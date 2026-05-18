import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const OUTPUT_ROOT = path.resolve(__dirname, '../../../../output');

// POST /api/bugs/create — create a JIRA bug via REST API
router.post('/bugs/create', async (req: Request, res: Response): Promise<any> => {
  const { domain, email, token, projectKey, tcId, tcTitle, verdict, reason, observations, storyId } = req.body;

  if (!domain || !email || !token || !projectKey) {
    return res.status(400).json({ error: 'domain, email, token, and projectKey are required' });
  }
  if (!tcId || verdict !== 'FAIL') {
    return res.status(400).json({ error: 'tcId required and verdict must be FAIL' });
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const apiUrl = `https://${domain.replace(/^https?:\/\//, '')}/rest/api/3/issue`;

  const body = {
    fields: {
      project: { key: projectKey },
      summary: `[AUTO-BUG] ${tcId} — ${tcTitle}`,
      description: {
        version: 1,
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: `Automated test case ${tcId} failed during execution.`, marks: [{ type: 'strong' }] }] },
          { type: 'paragraph', content: [{ type: 'text', text: `Linked Story: ${storyId || 'N/A'}` }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Failure Reason' }] },
          { type: 'paragraph', content: [{ type: 'text', text: reason || 'See test execution logs' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Observations' }] },
          { type: 'paragraph', content: [{ type: 'text', text: observations || 'N/A' }] },
          { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Raised By' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'TestGen Orchestrator (automated)' }] },
        ],
      },
      issuetype: { name: 'Bug' },
      labels: ['automated-qa', 'testgen-orchestrator'],
    },
  };

  try {
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: `JIRA API error: ${resp.status}`, detail: errText });
    }

    const data: any = await resp.json();
    const bugId: string = data.key;
    const bugUrl = `https://${domain.replace(/^https?:\/\//, '')}/browse/${bugId}`;

    // Link bug to original story
    if (storyId) {
      try {
        await fetch(`https://${domain.replace(/^https?:\/\//, '')}/rest/api/3/issueLink`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: { name: 'relates to' }, inwardIssue: { key: bugId }, outwardIssue: { key: storyId } }),
        });
      } catch { /* link is best-effort */ }
    }

    saveBugReport(tcId, tcTitle, bugId, bugUrl, projectKey);

    res.json({ bugId, bugUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function saveBugReport(tcId: string, tcTitle: string, bugId: string, bugUrl: string, projectKey: string) {
  const reportsDir = path.join(OUTPUT_ROOT, 'reports');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  // TC-ID format: TC-{PROJECT}-{NUMBER}-{MODULE}-{seq} → storyId = parts[1]-parts[2]
  const parts = tcId.split('-');
  const storyId = parts.length >= 3 ? parts.slice(1, 3).join('-') : tcId;
  try {
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const report = `# Bug Report — ${storyId}\n\nGenerated: ${new Date().toISOString()}\n\n| TC-ID | Title | Bug ID | URL |\n|-------|-------|--------|-----|\n| ${tcId} | ${tcTitle} | ${bugId} | ${bugUrl} |\n`;
    fs.writeFileSync(path.join(reportsDir, `${storyId}-bug-report-${ts}.md`), report);
  } catch { /* non-critical */ }
}

export default router;
