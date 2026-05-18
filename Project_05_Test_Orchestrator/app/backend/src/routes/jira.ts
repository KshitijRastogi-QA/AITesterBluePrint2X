import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const OUTPUT_ROOT = path.resolve(__dirname, '../../../../output');

interface JiraConfig {
  domain: string;
  email: string;
  token: string;
}

function jiraAuth(cfg: JiraConfig): string {
  return 'Basic ' + Buffer.from(`${cfg.email}:${cfg.token}`).toString('base64');
}

function jiraBase(domain: string): string {
  return `https://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
}

async function fetchIssue(cfg: JiraConfig, issueKey: string): Promise<any> {
  const url = `${jiraBase(cfg.domain)}/rest/api/3/issue/${issueKey}?expand=renderedFields,names`;
  const resp = await fetch(url, {
    headers: { Authorization: jiraAuth(cfg), Accept: 'application/json' },
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`JIRA ${resp.status}: ${err.substring(0, 300)}`);
  }
  return resp.json();
}

async function fetchProjectIssues(cfg: JiraConfig, projectKey: string, maxResults = 50): Promise<any[]> {
  const jql = encodeURIComponent(`project = ${projectKey} AND issuetype in (Story, Feature, Epic) ORDER BY created DESC`);
  const url = `${jiraBase(cfg.domain)}/rest/api/3/search?jql=${jql}&maxResults=${maxResults}&fields=summary,description,status,priority,assignee,reporter,labels,fixVersions,issuetype,parent,subtasks,issuelinks,created,updated,customfield_10016,attachment`;
  const resp = await fetch(url, {
    headers: { Authorization: jiraAuth(cfg), Accept: 'application/json' },
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`JIRA ${resp.status}: ${err.substring(0, 300)}`);
  }
  const data: any = await resp.json();
  return data.issues || [];
}

function adfToText(node: any, depth = 0): string {
  if (!node) return '';
  if (typeof node === 'string') return node;

  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'paragraph') return (node.content || []).map((n: any) => adfToText(n)).join('') + '\n';
  if (node.type === 'heading') return '#'.repeat(node.attrs?.level || 1) + ' ' + (node.content || []).map((n: any) => adfToText(n)).join('') + '\n';
  if (node.type === 'bulletList') return (node.content || []).map((n: any) => adfToText(n, depth)).join('');
  if (node.type === 'orderedList') {
    return (node.content || []).map((n: any, i: number) => `${i + 1}. ` + (n.content || []).map((c: any) => adfToText(c)).join('').trim() + '\n').join('');
  }
  if (node.type === 'listItem') return '- ' + (node.content || []).map((n: any) => adfToText(n)).join('').trim() + '\n';
  if (node.type === 'blockquote') return '> ' + (node.content || []).map((n: any) => adfToText(n)).join('');
  if (node.type === 'codeBlock') return '```\n' + (node.content || []).map((n: any) => adfToText(n)).join('') + '\n```\n';
  if (node.type === 'rule') return '\n---\n';
  if (node.type === 'doc') return (node.content || []).map((n: any) => adfToText(n)).join('');
  if (node.content) return (node.content as any[]).map(n => adfToText(n)).join('');
  return '';
}

const TEXT_MIMES = new Set(['text/plain', 'text/markdown', 'text/csv', 'application/json', 'application/xml', 'text/xml']);
const TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.yaml', '.yml']);

async function fetchAttachmentText(cfg: JiraConfig, url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, { headers: { Authorization: jiraAuth(cfg) } });
    if (!resp.ok) return null;
    const text = await resp.text();
    return text.length > 8000 ? text.substring(0, 8000) + '\n...[truncated]' : text;
  } catch {
    return null;
  }
}

async function attachmentsSection(cfg: JiraConfig, attachments: any[]): Promise<string> {
  if (!attachments || attachments.length === 0) return '*(No attachments)*';

  const lines: string[] = [];
  for (const att of attachments) {
    const ext = path.extname(att.filename).toLowerCase();
    const sizeKb = Math.round((att.size || 0) / 1024);
    const created = att.created ? new Date(att.created).toISOString().substring(0, 10) : '';
    lines.push(`### ${att.filename}`);
    lines.push(`- **Type**: ${att.mimeType || 'unknown'} | **Size**: ${sizeKb} KB | **Uploaded**: ${created}`);
    lines.push(`- **URL**: ${att.content}`);

    const isText = TEXT_MIMES.has(att.mimeType) || TEXT_EXTS.has(ext);
    if (isText && att.content) {
      const content = await fetchAttachmentText(cfg, att.content);
      if (content) {
        lines.push('');
        lines.push('```');
        lines.push(content);
        lines.push('```');
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function issueToMarkdown(issue: any): string {
  const f = issue.fields;
  const key = issue.key;
  const title = f.summary || '';
  const status = f.status?.name || '';
  const priority = f.priority?.name || '';
  const issueType = f.issuetype?.name || '';
  const assignee = f.assignee?.displayName || 'Unassigned';
  const reporter = f.reporter?.displayName || '';
  const labels = (f.labels || []).join(', ') || '—';
  const fixVersions = (f.fixVersions || []).map((v: any) => v.name).join(', ') || '—';
  const created = f.created ? new Date(f.created).toISOString().substring(0, 10) : '';
  const updated = f.updated ? new Date(f.updated).toISOString().substring(0, 10) : '';
  const storyPoints = f.story_points || f.customfield_10016 || '—';

  const description = f.description
    ? (typeof f.description === 'string' ? f.description : adfToText(f.description))
    : '*(No description)*';

  const subtasks = (f.subtasks || []).map((s: any) => `- [ ] ${s.key}: ${s.fields?.summary}`).join('\n') || '—';
  const linkedIssues = (f.issuelinks || []).map((l: any) => {
    const rel = l.type?.name || '';
    const linked = l.inwardIssue || l.outwardIssue;
    return `- ${rel}: ${linked?.key} — ${linked?.fields?.summary}`;
  }).join('\n') || '—';

  return `# ${key} — ${title}

| Field | Value |
|-------|-------|
| **Story ID** | ${key} |
| **Story Title** | ${title} |
| **Story Type** | ${issueType} |
| **Status** | ${status} |
| **Priority** | ${priority} |
| **Story Points** | ${storyPoints} |
| **Fix Version** | ${fixVersions} |
| **Labels** | ${labels} |
| **Reporter** | ${reporter} |
| **Assignee** | ${assignee} |
| **Created** | ${created} |
| **Updated** | ${updated} |

---

## Description

${description.trim()}

---

## Sub-tasks

${subtasks}

---

## Linked Issues

${linkedIssues}
`;
}

// POST /api/jira/extract-story — extract a specific JIRA story
router.post('/jira/extract-story', async (req: Request, res: Response): Promise<any> => {
  const { domain, email, token, storyId } = req.body;
  if (!domain || !email || !token || !storyId) {
    return res.status(400).json({ error: 'domain, email, token, storyId are required' });
  }

  const cfg: JiraConfig = { domain, email, token };

  try {
    const issue = await fetchIssue(cfg, storyId.trim().toUpperCase());
    const baseMarkdown = issueToMarkdown(issue);
    const attText = await attachmentsSection(cfg, issue.fields.attachment || []);
    const markdown = baseMarkdown + `\n---\n\n## Attachments\n\n${attText}`;
    const projectKey = issue.key.split('-')[0];
    const slugTitle = (issue.fields.summary || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const batchDir = path.join(OUTPUT_ROOT, 'jira-stories', `${projectKey}-${ts}`);
    const filename = `${issue.key}-${slugTitle}.md`;

    if (!fs.existsSync(batchDir)) fs.mkdirSync(batchDir, { recursive: true });
    fs.writeFileSync(path.join(batchDir, filename), markdown);

    // Write index
    const indexContent = `# JIRA Story Extraction Index\n\n| Field | Value |\n|-------|-------|\n| **Project Key** | ${projectKey} |\n| **Extracted** | ${new Date().toISOString()} |\n| **Total Stories** | 1 |\n\n## Extracted Stories\n\n| Story ID | Title | Status | Priority | File |\n|----------|-------|--------|----------|------|\n| ${issue.key} | ${issue.fields.summary} | ${issue.fields.status?.name} | ${issue.fields.priority?.name} | [${filename}](${filename}) |\n`;
    fs.writeFileSync(path.join(batchDir, 'index.md'), indexContent);

    res.json({
      storyId: issue.key,
      title: issue.fields.summary,
      status: issue.fields.status?.name,
      priority: issue.fields.priority?.name,
      batchDir: path.relative(OUTPUT_ROOT, batchDir),
      filename,
      markdown,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jira/extract-project — extract all stories from a project
router.post('/jira/extract-project', async (req: Request, res: Response): Promise<any> => {
  const { domain, email, token, projectKey, maxResults } = req.body;
  if (!domain || !email || !token || !projectKey) {
    return res.status(400).json({ error: 'domain, email, token, projectKey are required' });
  }

  const cfg: JiraConfig = { domain, email, token };

  try {
    const issues = await fetchProjectIssues(cfg, projectKey.trim().toUpperCase(), maxResults || 20);
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const batchDir = path.join(OUTPUT_ROOT, 'jira-stories', `${projectKey.toUpperCase()}-${ts}`);
    if (!fs.existsSync(batchDir)) fs.mkdirSync(batchDir, { recursive: true });

    const saved: any[] = [];
    for (const issue of issues) {
      const baseMarkdown = issueToMarkdown(issue);
      const attText = await attachmentsSection(cfg, issue.fields.attachment || []);
      const markdown = baseMarkdown + `\n---\n\n## Attachments\n\n${attText}`;
      const slugTitle = (issue.fields.summary || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
      const filename = `${issue.key}-${slugTitle}.md`;
      fs.writeFileSync(path.join(batchDir, filename), markdown);
      saved.push({ storyId: issue.key, title: issue.fields.summary, status: issue.fields.status?.name, priority: issue.fields.priority?.name, filename });
    }

    // Write index
    const indexRows = saved.map(s => `| ${s.storyId} | ${s.title} | ${s.status} | ${s.priority} | [${s.filename}](${s.filename}) |`).join('\n');
    const indexContent = `# JIRA Story Extraction Index\n\n| Field | Value |\n|-------|-------|\n| **Project Key** | ${projectKey.toUpperCase()} |\n| **Extracted** | ${new Date().toISOString()} |\n| **Total Stories** | ${saved.length} |\n\n## Extracted Stories\n\n| Story ID | Title | Status | Priority | File |\n|----------|-------|--------|----------|------|\n${indexRows}\n`;
    fs.writeFileSync(path.join(batchDir, 'index.md'), indexContent);

    res.json({ stories: saved, batchDir: path.relative(OUTPUT_ROOT, batchDir), total: saved.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
