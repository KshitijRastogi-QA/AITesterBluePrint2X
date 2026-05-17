import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runAgent, AgentEvent, LLMConfig } from '../agent/loop';
import fs from 'fs';
import path from 'path';

const router = Router();

// In-memory store for active runs (SSE clients)
const activeRuns = new Map<string, { emit: (e: AgentEvent) => void; done: boolean }>();

// POST /api/run — start an agent run, return a run ID immediately
router.post('/run', async (req: Request, res: Response): Promise<any> => {
  const { spec, url, config } = req.body as {
    spec: string;
    url: string;
    config: LLMConfig;
  };

  if (!spec?.trim()) return res.status(400).json({ error: 'spec is required' });
  if (!url?.trim()) return res.status(400).json({ error: 'url is required' });
  if (!config?.provider) return res.status(400).json({ error: 'config.provider is required' });
  if (!config?.apiKey) {
    return res.status(400).json({ error: 'config.apiKey is required' });
  }

  const runId = uuidv4();

  // Buffer events until the SSE client connects
  const eventBuffer: AgentEvent[] = [];
  let sseRes: Response | null = null;
  let completed = false;
  let finalResult: any = null;

  const emit = (event: AgentEvent) => {
    if (sseRes) {
      sseRes.write(`data: ${JSON.stringify(event)}\n\n`);
    } else {
      eventBuffer.push(event);
    }
    if (event.type === 'complete') {
      finalResult = event.data;
      completed = true;
      // Save report
      saveReport(runId, url, spec, event.data, eventBuffer.concat(event));
    }
  };

  activeRuns.set(runId, { emit, done: false });

  // Run agent in background
  const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

  runAgent(spec, normalizedUrl, config, emit)
    .then(result => {
      if (!completed) {
        const finalEvent: AgentEvent = {
          type: 'complete',
          content: result.summary,
          data: result,
          timestamp: Date.now(),
        };
        emit(finalEvent);
      }
      const run = activeRuns.get(runId);
      if (run) run.done = true;
    })
    .catch(err => {
      const errorEvent: AgentEvent = {
        type: 'error',
        content: err.message,
        timestamp: Date.now(),
      };
      emit(errorEvent);
    });

  res.json({ runId });

  // Attach SSE emitter so it works whether SSE connects before or after
  activeRuns.set(runId, {
    emit: (event: AgentEvent) => {
      eventBuffer.push(event);
      if (sseRes) sseRes.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.type === 'complete') {
        completed = true;
        finalResult = event.data;
      }
    },
    done: false,
  });

  // Override SSE setter
  (activeRuns.get(runId) as any)._setSse = (r: Response) => {
    sseRes = r;
    // Flush buffer
    for (const e of eventBuffer) {
      r.write(`data: ${JSON.stringify(e)}\n\n`);
    }
  };
});

// GET /api/run/:id/stream — SSE stream for a run
router.get('/run/:id/stream', (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const run = activeRuns.get(id) as any;

  if (!run) return res.status(404).json({ error: 'Run not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send buffered events
  if (run._setSse) run._setSse(res);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    activeRuns.delete(id);
  });
});

// GET /api/reports — list saved reports
router.get('/reports', (_req: Request, res: Response) => {
  const reportsDir = path.resolve(__dirname, '../../../../../reports');
  try {
    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const data = JSON.parse(fs.readFileSync(path.join(reportsDir, f), 'utf-8'));
        return { id: f.replace('.json', ''), ...data };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
    res.json(files);
  } catch {
    res.json([]);
  }
});

function saveReport(runId: string, url: string, spec: string, result: any, events: AgentEvent[]) {
  const reportsDir = path.resolve(__dirname, '../../../../../reports');
  try {
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const report = {
      runId,
      url,
      specSnippet: spec.substring(0, 200),
      verdict: result?.verdict,
      summary: result?.summary,
      findings: result?.findings || [],
      duration: result?.duration,
      iterations: result?.iterations,
      timestamp: Date.now(),
      events: events.slice(-50), // last 50 events
    };
    fs.writeFileSync(path.join(reportsDir, `${runId}.json`), JSON.stringify(report, null, 2));
  } catch { /* non-critical */ }
}

export default router;
