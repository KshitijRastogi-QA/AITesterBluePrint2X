import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeTestCase, ExecEvent, LLMConfig, ExecResult } from '../agent/executor';
import fs from 'fs';
import path from 'path';

const router = Router();
const OUTPUT_ROOT = path.resolve(__dirname, '../../../../output');

// In-memory run store
const runs = new Map<string, {
  events: ExecEvent[];
  result: ExecResult | null;
  done: boolean;
  sseRes: Response | null;
}>();

// POST /api/execute — run a single test case
router.post('/execute', async (req: Request, res: Response): Promise<any> => {
  const { tcId, tcTitle, steps, url, config } = req.body as {
    tcId: string;
    tcTitle: string;
    steps: string;
    url: string;
    config: LLMConfig;
  };

  if (!tcId) return res.status(400).json({ error: 'tcId required' });
  if (!url) return res.status(400).json({ error: 'url required' });
  if (!config) return res.status(400).json({ error: 'config required' });
  const isLocal = config.provider === 'ollama' || config.provider === 'lmstudio';
  if (!isLocal && !config.apiKey) return res.status(400).json({ error: 'config.apiKey required for provider: ' + config.provider });

  const runId = uuidv4();
  const run = { events: [] as ExecEvent[], result: null as ExecResult | null, done: false, sseRes: null as Response | null };
  runs.set(runId, run);

  const emit = (event: ExecEvent) => {
    run.events.push(event);
    if (run.sseRes) run.sseRes.write(`data: ${JSON.stringify(event)}\n\n`);
    if (event.type === 'complete') {
      run.result = event.data;
      run.done = true;
      saveExecutionResult(tcId, tcTitle, event.data, run.events);
    }
  };

  executeTestCase(tcId, tcTitle, url, steps, config, emit).catch(err => {
    emit({ type: 'error', content: err.message, timestamp: Date.now() });
    run.done = true;
  });

  res.json({ runId });
});

// GET /api/execute/:id/stream — SSE for execution events
router.get('/execute/:id/stream', (req: Request, res: Response) => {
  const id = req.params['id'];
  const run = runs.get(id);
  if (!run) return res.status(404).json({ error: 'Run not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Flush buffered events
  for (const e of run.events) res.write(`data: ${JSON.stringify(e)}\n\n`);

  run.sseRes = res;
  const hb = setInterval(() => res.write(': heartbeat\n\n'), 15000);
  req.on('close', () => { clearInterval(hb); run.sseRes = null; });
});

// GET /api/executions — list saved execution results
router.get('/executions', (_req: Request, res: Response) => {
  const dir = path.join(OUTPUT_ROOT, 'test-case-executor');
  const results: any[] = [];
  try {
    if (!fs.existsSync(dir)) return res.json([]);
    const stories = fs.readdirSync(dir);
    for (const storyId of stories) {
      const storyDir = path.join(dir, storyId);
      if (!fs.statSync(storyDir).isDirectory()) continue;
      const runs = fs.readdirSync(storyDir).filter(d => fs.statSync(path.join(storyDir, d)).isDirectory());
      for (const runId of runs) {
        const rptFile = path.join(storyDir, runId, 'execution-report.json');
        if (fs.existsSync(rptFile)) {
          const data = JSON.parse(fs.readFileSync(rptFile, 'utf-8'));
          results.push(data);
        }
      }
    }
  } catch {}
  res.json(results.sort((a, b) => b.timestamp - a.timestamp));
});

function saveExecutionResult(tcId: string, tcTitle: string, result: ExecResult, events: ExecEvent[]) {
  // TC-ID format: TC-{PROJECT}-{NUMBER}-{MODULE}-{seq} → storyId = parts[1]-parts[2]
  const parts = tcId.split('-');
  const storyId = parts.length >= 3 ? parts.slice(1, 3).join('-') : tcId;
  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const dir = path.join(OUTPUT_ROOT, 'test-case-executor', storyId, ts);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'execution-report.json'), JSON.stringify({
      tcId, tcTitle, storyId, timestamp: Date.now(), runTs: ts,
      verdict: result.verdict, reason: result.reason,
      duration: result.duration, iterations: result.iterations,
      events: events.slice(-30),
    }, null, 2));
  } catch { /* non-critical */ }
}

export default router;
