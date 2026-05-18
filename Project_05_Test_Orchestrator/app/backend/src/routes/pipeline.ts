import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const OUTPUT_ROOT = path.resolve(__dirname, '../../../../output');

function readFile(filePath: string): string {
  try { return fs.readFileSync(filePath, 'utf-8'); } catch { return ''; }
}

function listFiles(dir: string, ext = '.md'): string[] {
  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith(ext))
      .map(f => path.join(dir, f));
  } catch { return []; }
}

// GET /api/stories — list extracted JIRA story batches
router.get('/stories', (_req: Request, res: Response) => {
  const storiesRoot = path.join(OUTPUT_ROOT, 'jira-stories');
  try {
    const batches = fs.readdirSync(storiesRoot).filter(d =>
      fs.statSync(path.join(storiesRoot, d)).isDirectory()
    );
    const result = batches.map(batch => {
      const batchDir = path.join(storiesRoot, batch);
      const stories = listFiles(batchDir).filter(f => !f.endsWith('index.md'));
      return {
        batch,
        timestamp: batch.split('-').slice(1).join('-'),
        stories: stories.map(f => ({
          id: path.basename(f, '.md'),
          content: readFile(f),
          file: path.basename(f),
        })),
        index: readFile(path.join(batchDir, 'index.md')),
      };
    });
    res.json(result);
  } catch {
    res.json([]);
  }
});

// GET /api/test-plans — list generated test plans
router.get('/test-plans', (_req: Request, res: Response) => {
  const dir = path.join(OUTPUT_ROOT, 'test-plan');
  const files = listFiles(dir);
  const result = files.map(f => ({
    file: path.basename(f),
    content: readFile(f),
    storyId: path.basename(f).split('-')[0] + '-' + path.basename(f).split('-')[1],
    mtime: fs.statSync(f).mtime.toISOString(),
  })).sort((a, b) => b.mtime.localeCompare(a.mtime));
  res.json(result);
});

// GET /api/test-cases — list generated test case files
router.get('/test-cases', (_req: Request, res: Response) => {
  const dir = path.join(OUTPUT_ROOT, 'test-cases');
  const files = listFiles(dir);
  const result = files.map(f => {
    const content = readFile(f);
    const tcs = parseTestCases(content);
    return {
      file: path.basename(f),
      storyId: path.basename(f).split('-')[0] + '-' + path.basename(f).split('-')[1],
      mtime: fs.statSync(f).mtime.toISOString(),
      content,
      testCases: tcs,
      total: tcs.length,
      passed: tcs.filter(tc => tc.status === 'PASS').length,
      failed: tcs.filter(tc => tc.status === 'FAIL').length,
    };
  }).sort((a, b) => b.mtime.localeCompare(a.mtime));
  res.json(result);
});

// GET /api/reports — list execution reports
router.get('/reports', (_req: Request, res: Response) => {
  const dir = path.join(OUTPUT_ROOT, 'test-case-executor');
  const result: any[] = [];
  try {
    const stories = fs.readdirSync(dir).filter(d =>
      fs.statSync(path.join(dir, d)).isDirectory()
    );
    for (const story of stories) {
      const runs = fs.readdirSync(path.join(dir, story)).filter(d =>
        fs.statSync(path.join(dir, story, d)).isDirectory()
      );
      for (const run of runs) {
        const reportFile = path.join(dir, story, run, 'execution-report.md');
        result.push({
          storyId: story,
          runId: run,
          content: readFile(reportFile),
          mtime: fs.existsSync(reportFile) ? fs.statSync(reportFile).mtime.toISOString() : run,
        });
      }
    }
  } catch { /* no reports yet */ }
  res.json(result.sort((a, b) => b.mtime.localeCompare(a.mtime)));
});

// GET /api/pipeline-status — overall pipeline status per story
router.get('/pipeline-status', (_req: Request, res: Response) => {
  const stagesCompleted: Record<string, number[]> = {};

  // Stage 1 — stories
  try {
    const storiesRoot = path.join(OUTPUT_ROOT, 'jira-stories');
    const batches = fs.readdirSync(storiesRoot);
    for (const b of batches) {
      const files = listFiles(path.join(storiesRoot, b)).filter(f => !f.endsWith('index.md'));
      for (const f of files) {
        const id = extractStoryId(path.basename(f, '.md'));
        if (id) {
          stagesCompleted[id] = [...(stagesCompleted[id] || []), 1];
        }
      }
    }
  } catch {}

  // Stage 2 — test plans
  try {
    for (const f of listFiles(path.join(OUTPUT_ROOT, 'test-plan'))) {
      const id = extractStoryId(path.basename(f, '.md'));
      if (id && stagesCompleted[id]) stagesCompleted[id].push(2);
    }
  } catch {}

  // Stage 3 — test cases
  try {
    for (const f of listFiles(path.join(OUTPUT_ROOT, 'test-cases'))) {
      const id = extractStoryId(path.basename(f, '.md'));
      if (id && stagesCompleted[id]) stagesCompleted[id].push(3);
    }
  } catch {}

  // Stage 4 — executor
  try {
    const execRoot = path.join(OUTPUT_ROOT, 'test-case-executor');
    const stories = fs.readdirSync(execRoot);
    for (const s of stories) {
      if (stagesCompleted[s]) stagesCompleted[s].push(4, 5);
    }
  } catch {}

  // Stage 6 — bug reports
  try {
    for (const f of listFiles(path.join(OUTPUT_ROOT, 'reports'))) {
      const id = extractStoryId(path.basename(f, '.md'));
      if (id && stagesCompleted[id]) stagesCompleted[id].push(6);
    }
  } catch {}

  res.json(stagesCompleted);
});

function extractStoryId(filename: string): string | null {
  const m = filename.match(/^([A-Z]+-\d+)/i);
  return m ? m[1] : null;
}

function parseTestCases(content: string): any[] {
  const tcs: any[] = [];

  // Format 1: ### TC-ID — Title heading blocks (detailed block format)
  const tcBlocks = content.split(/\n(?=###\s+`?TC-)/);
  for (const block of tcBlocks) {
    const idMatch = block.match(/###\s+`?(TC-[A-Z0-9-]+)`?/i);
    if (!idMatch) continue;
    const id = idMatch[1];
    const titleMatch = block.match(/###\s+`?TC-[A-Z0-9-]+`?\s+[—-]+\s+(.+)/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const priorityMatch = block.match(/\|\s*\*\*Priority\*\*\s*\|\s*`?([^`|\n]+)`?\s*\|/i);
    const priority = priorityMatch ? priorityMatch[1].trim() : '';
    const typeMatch = block.match(/\|\s*\*\*Test Type\*\*\s*\|\s*`?([^`|\n]+)`?\s*\|/i);
    const type = typeMatch ? typeMatch[1].trim() : '';
    const moduleMatch = block.match(/\|\s*\*\*Module[^|]*\*\*\s*\|\s*`?([^`|\n]+)`?\s*\|/i);
    const module = moduleMatch ? moduleMatch[1].trim() : '';
    const autoMatch = block.match(/\|\s*\*\*Automation Candidate\*\*\s*\|\s*`?([^`|\n]+)`?\s*\|/i);
    const automation = autoMatch ? autoMatch[1].trim() : '';
    tcs.push({ id, title, priority, type, module, automation, status: null });
  }

  if (tcs.length > 0) return tcs;

  // Format 2: | TC-ID | Title | Module | Priority | ... table row format
  // Column order: ID, Title, Module, Priority (based on LLM table output)
  const seen = new Set<string>();
  for (const line of content.split('\n')) {
    const m = line.match(/^\|\s*(TC-[\w-]+?)(?:\s+#)?\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/i);
    if (!m) continue;
    const id = m[1].trim();
    if (!id.match(/^TC-/i) || seen.has(id)) continue;
    const title = m[2].trim();
    const module = m[3].trim();
    const priority = m[4].trim();
    // Skip header/separator rows
    if (title.toLowerCase() === 'title' || priority.toLowerCase() === 'priority') continue;
    seen.add(id);
    tcs.push({ id, title, module, priority, type: '', automation: '', status: null });
  }

  return tcs;
}

export default router;
