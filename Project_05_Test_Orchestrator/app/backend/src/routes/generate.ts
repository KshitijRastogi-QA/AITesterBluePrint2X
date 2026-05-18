import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const router = Router();
const OUTPUT_ROOT = path.resolve(__dirname, '../../../../output');
const RESOURCES_ROOT = path.resolve(__dirname, '../../../../resources');

interface LLMConfig { provider: string; apiKey?: string; model?: string; baseUrl?: string; }

// In-memory SSE store
const genRuns = new Map<string, { lines: string[]; done: boolean; sseRes: Response | null }>();

function emit(runId: string, line: string) {
  const run = genRuns.get(runId);
  if (!run) return;
  run.lines.push(line);
  if (run.sseRes) run.sseRes.write(`data: ${JSON.stringify({ text: line })}\n\n`);
}

function finishRun(runId: string, result: any) {
  const run = genRuns.get(runId);
  if (!run) return;
  run.done = true;
  if (run.sseRes) run.sseRes.write(`data: ${JSON.stringify({ done: true, result })}\n\n`);
}

// GET /api/generate/:id/stream
router.get('/generate/:id/stream', (req: Request, res: Response) => {
  const id = req.params['id'];
  const run = genRuns.get(id);
  if (!run) return res.status(404).json({ error: 'Run not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  for (const l of run.lines) res.write(`data: ${JSON.stringify({ text: l })}\n\n`);
  if (run.done) { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); return; }

  run.sseRes = res;
  const hb = setInterval(() => res.write(': heartbeat\n\n'), 15000);
  req.on('close', () => { clearInterval(hb); run.sseRes = null; });
});

// Find story file for a given story ID
function findStoryFile(storyId: string): string | null {
  const storiesRoot = path.join(OUTPUT_ROOT, 'jira-stories');
  try {
    const batches = fs.readdirSync(storiesRoot);
    for (const batch of batches) {
      const batchDir = path.join(storiesRoot, batch);
      if (!fs.statSync(batchDir).isDirectory()) continue;
      const files = fs.readdirSync(batchDir).filter(f => f.startsWith(storyId.toUpperCase() + '-') && f.endsWith('.md') && f !== 'index.md');
      if (files.length > 0) return path.join(batchDir, files[0]);
    }
  } catch {}
  return null;
}

// Find most-recent test plan for a story ID
function findTestPlanFile(storyId: string): string | null {
  const planDir = path.join(OUTPUT_ROOT, 'test-plan');
  try {
    const files = fs.readdirSync(planDir)
      .filter(f => f.startsWith(storyId.toUpperCase() + '-') && f.endsWith('.md'))
      .map(f => ({ f, mtime: fs.statSync(path.join(planDir, f)).mtime.getTime() }))
      .sort((a, b) => b.mtime - a.mtime);
    return files.length > 0 ? path.join(planDir, files[0].f) : null;
  } catch { return null; }
}

function resolveOpenAIBase(config: LLMConfig): string | undefined {
  if (config.baseUrl) return config.baseUrl;
  if (config.provider === 'groq') return 'https://api.groq.com/openai/v1';
  if (config.provider === 'gemini') return 'https://generativelanguage.googleapis.com/v1beta/openai/';
  if (config.provider === 'ollama') return 'http://localhost:11434/v1';
  if (config.provider === 'lmstudio') return 'http://localhost:1234/v1';
  return undefined;
}

function resolveModel(config: LLMConfig): string {
  if (config.model) return config.model;
  if (config.provider === 'anthropic' || config.provider === 'claude') return 'claude-sonnet-4-6';
  if (config.provider === 'openai') return 'gpt-4o';
  if (config.provider === 'groq') return 'llama-3.3-70b-versatile';
  if (config.provider === 'gemini') return 'gemini-2.0-flash';
  if (config.provider === 'ollama') return 'gemma3:1b';
  if (config.provider === 'lmstudio') return 'local-model';
  return 'gpt-4o';
}

async function callLLM(config: LLMConfig, systemPrompt: string, userMsg: string, onChunk: (t: string) => void): Promise<string> {
  const isAnthropic = config.provider === 'anthropic' || config.provider === 'claude';
  const isLocal = config.provider === 'ollama' || config.provider === 'lmstudio';

  if (isAnthropic) {
    const client = new Anthropic({ apiKey: config.apiKey });
    const stream = await client.messages.stream({
      model: resolveModel(config),
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    });
    let full = '';
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        full += chunk.delta.text;
        onChunk(chunk.delta.text);
      }
    }
    return full;
  } else {
    const client = new OpenAI({
      apiKey: isLocal ? 'local' : (config.apiKey || 'no-key'),
      baseURL: resolveOpenAIBase(config),
    });
    const stream = await client.chat.completions.create({
      model: resolveModel(config),
      max_tokens: isLocal ? 4096 : 8192,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
      stream: true as const,
    } as Parameters<typeof client.chat.completions.create>[0] & { stream: true });
    let full = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) { full += text; onChunk(text); }
    }
    return full;
  }
}

// POST /api/generate/test-plan
router.post('/generate/test-plan', async (req: Request, res: Response): Promise<any> => {
  const { storyId, authorName, config } = req.body as { storyId: string; authorName: string; config: LLMConfig };

  if (!storyId) return res.status(400).json({ error: 'storyId required' });
  const isLocal = ['ollama', 'lmstudio'].includes(config?.provider);
  if (!isLocal && !config?.apiKey) return res.status(400).json({ error: 'config.apiKey required' });

  const storyFile = findStoryFile(storyId);
  if (!storyFile) return res.status(404).json({ error: `No extracted story found for ${storyId}. Extract it first in Stage 1.` });

  const storyContent = fs.readFileSync(storyFile, 'utf-8');
  const templatePath = path.join(RESOURCES_ROOT, 'enterprise_test_plan_template.md');
  const template = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf-8') : '';

  const runId = uuidv4();
  genRuns.set(runId, { lines: [], done: false, sseRes: null });
  res.json({ runId });

  const systemPrompt = `You are a QA architect with 15+ years of enterprise QA experience. Generate a comprehensive, enterprise-grade test plan in markdown format.

STRICT RULES:
- Output ONLY the completed test plan markdown document — no preamble, no explanation, no meta-commentary
- Replace every placeholder like {JIRA-ID}, {Story Title}, {Author Name}, etc. with real values from the story
- Base EVERY section strictly on the story content provided — no invented features or metrics
- Follow the exact section structure from the OUTPUT FORMAT TEMPLATE below
- Include the exact JIRA Story ID, title, and author in the document header table
- Map every Test Module to a specific acceptance criterion from the story
- Only include Non-Functional Testing if performance/security/accessibility is referenced in the story; otherwise write "N/A — Out of Scope for this Story"
- Do NOT output any workflow steps, tool instructions, or meta-text — only the test plan document itself

${template ? `OUTPUT FORMAT TEMPLATE (fill in every section with real content from the story — do not echo this template, generate the actual document):\n\n${template}` : ''}`;

  const userMsg = `Generate the complete enterprise test plan document for this JIRA story. Fill in every section with content derived strictly from the story below.

Author: ${authorName || 'QA Engineer'}
Date: ${new Date().toISOString().substring(0, 10)}

JIRA STORY CONTENT:
${storyContent}`;

  let fullContent = '';
  let buffer = '';
  const FLUSH_CHARS = 200;

  try {
    fullContent = await callLLM(config, systemPrompt, userMsg, (chunk) => {
      buffer += chunk;
      if (buffer.length >= FLUSH_CHARS) {
        emit(runId, buffer);
        buffer = '';
      }
    });
    if (buffer) emit(runId, buffer);

    // Save file
    const titleMatch = storyContent.match(/^# ([A-Z]+-\d+) — (.+)$/m);
    const sid = titleMatch ? titleMatch[1] : storyId.toUpperCase();
    const title = titleMatch ? titleMatch[2] : storyId;
    const slugTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
    const filename = `${sid}-${slugTitle}-${ts}.md`;
    const outPath = path.join(OUTPUT_ROOT, 'test-plan');
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });
    fs.writeFileSync(path.join(outPath, filename), fullContent);

    finishRun(runId, { filename, storyId: sid, path: `output/test-plan/${filename}` });
  } catch (err: any) {
    emit(runId, `\n\nERROR: ${err.message}`);
    finishRun(runId, { error: err.message });
  }
});

// POST /api/generate/test-cases
router.post('/generate/test-cases', async (req: Request, res: Response): Promise<any> => {
  const { storyId, authorName, config } = req.body as { storyId: string; authorName: string; config: LLMConfig };

  if (!storyId) return res.status(400).json({ error: 'storyId required' });
  const isLocal = ['ollama', 'lmstudio'].includes(config?.provider);
  if (!isLocal && !config?.apiKey) return res.status(400).json({ error: 'config.apiKey required' });

  const planFile = findTestPlanFile(storyId);
  if (!planFile) return res.status(404).json({ error: `No test plan found for ${storyId}. Generate the test plan first in Stage 2.` });

  const planContent = fs.readFileSync(planFile, 'utf-8');
  const templatePath = path.join(RESOURCES_ROOT, 'enterprise_test_case_template.md');
  const template = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf-8') : '';

  const runId = uuidv4();
  genRuns.set(runId, { lines: [], done: false, sseRes: null });
  res.json({ runId });

  const systemPrompt = `You are a senior QA engineer with 15+ years of enterprise experience. Generate exhaustive, traceable, enterprise-grade test cases in markdown format.

RULES:
- Generate test cases for EVERY module in the test plan — no skipping
- Every test case ID MUST follow: TC-{JIRA-ID}-{MODULE-CODE}-{3-digit-seq} e.g. TC-PROJ-1234-AUTH-001
- Every TC must include: ID, Title, Module, Type, Priority, Pre-conditions, Test Data, Steps table, Expected Result, Actual Result (blank), Pass/Fail (blank), Traceability, Automation Candidate, Notes
- Include Positive, Negative, Edge, E2E types for each module
- Add a Test Case Summary Table at the top
- Add a Traceability Matrix at the end
- Output ONLY the markdown — no preamble or explanation

${template ? `TEMPLATE TO FOLLOW:\n${template}` : ''}`;

  const userMsg = `Generate exhaustive enterprise test cases from this test plan.

Author: ${authorName || 'QA Engineer'}
Generated: ${new Date().toISOString().substring(0, 10)}

TEST PLAN:
${planContent}`;

  let fullContent = '';
  let buffer = '';
  const FLUSH_CHARS = 200;

  try {
    fullContent = await callLLM(config, systemPrompt, userMsg, (chunk) => {
      buffer += chunk;
      if (buffer.length >= FLUSH_CHARS) {
        emit(runId, buffer);
        buffer = '';
      }
    });
    if (buffer) emit(runId, buffer);

    const sidMatch = planContent.match(/\|\s*\*\*JIRA Story ID\*\*\s*\|\s*([A-Z]+-\d+)/im) || planContent.match(/([A-Z]+-\d+)/);
    const sid = sidMatch ? sidMatch[1] : storyId.toUpperCase();
    const titleMatch = planContent.match(/\|\s*\*\*Story Title\*\*\s*\|\s*(.+?)\s*\|/im);
    const title = titleMatch ? titleMatch[1].trim() : storyId;
    const slugTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const ts = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
    const filename = `${sid}-${slugTitle}-test-cases-${ts}.md`;
    const outPath = path.join(OUTPUT_ROOT, 'test-cases');
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });
    fs.writeFileSync(path.join(outPath, filename), fullContent);

    finishRun(runId, { filename, storyId: sid, path: `output/test-cases/${filename}` });
  } catch (err: any) {
    emit(runId, `\n\nERROR: ${err.message}`);
    finishRun(runId, { error: err.message });
  }
});

// GET /api/stories-list — flat list of all extracted story IDs
router.get('/stories-list', (_req: Request, res: Response) => {
  const storiesRoot = path.join(OUTPUT_ROOT, 'jira-stories');
  const stories: { storyId: string; title: string; file: string; batch: string }[] = [];
  try {
    const batches = fs.readdirSync(storiesRoot);
    for (const batch of batches) {
      const batchDir = path.join(storiesRoot, batch);
      if (!fs.statSync(batchDir).isDirectory()) continue;
      const files = fs.readdirSync(batchDir).filter(f => f.endsWith('.md') && f !== 'index.md');
      for (const f of files) {
        const m = f.match(/^([A-Z]+-\d+)-(.+)\.md$/i);
        if (m) stories.push({ storyId: m[1].toUpperCase(), title: m[2].replace(/-/g, ' '), file: path.join(batchDir, f), batch });
      }
    }
  } catch {}
  res.json(stories);
});

export default router;
