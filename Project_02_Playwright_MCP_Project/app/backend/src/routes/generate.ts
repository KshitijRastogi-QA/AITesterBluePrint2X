import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { generateTestPlan, generateTestCases, LLMConfig } from '../services/llm';

const router = Router();
const DELIVERABLES_DIR = path.join(__dirname, '../../../../deliverables');

router.post('/test-connection', async (req: Request, res: Response) => {
  const config: LLMConfig = req.body;
  try {
    if (config.provider === 'ollama') {
      const base = config.baseUrl?.replace('/v1', '') || 'http://localhost:11434';
      const { data } = await axios.get(`${base}/api/tags`, { timeout: 5000 });
      const models = (data.models || []).map((m: any) => m.name);
      const model = config.model || 'llava';
      if (models.length === 0) return res.json({ success: false, message: 'No models found in Ollama' });
      if (!models.includes(model)) return res.json({ success: false, message: `Model '${model}' not found. Available: ${models.join(', ')}` });
      return res.json({ success: true, message: `Connected — model '${model}' available` });
    }
    if (config.provider === 'lmstudio') {
      const base = config.baseUrl || 'http://localhost:1234/v1';
      await axios.get(`${base}/models`, { timeout: 5000 });
      return res.json({ success: true, message: 'Connected to LM Studio' });
    }
    // For cloud providers do a lightweight model list check
    const OpenAI = require('openai');
    const Anthropic = require('@anthropic-ai/sdk');
    if (config.provider === 'anthropic') {
      const client = new Anthropic.default({ apiKey: config.apiKey });
      await client.models.list();
      return res.json({ success: true, message: `Connected to Anthropic` });
    }
    const baseURL = config.baseUrl || (config.provider === 'groq' ? 'https://api.groq.com/openai/v1' : config.provider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta/openai/' : undefined);
    const client = new OpenAI.default({ apiKey: config.apiKey, baseURL });
    await client.models.list();
    res.json({ success: true, message: `Connected to ${config.provider}` });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/generate/test-plan', async (req: Request, res: Response) => {
  const { url, domText, context, config } = req.body as { url: string; domText: string; context: string; config: LLMConfig };
  if (!url || !domText) return res.status(400).json({ error: 'url and domText are required' });
  if (!config?.provider) return res.status(400).json({ error: 'LLM config is required' });

  try {
    const testPlan = await generateTestPlan(config, url, domText, context || '');
    res.json({ testPlan });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate/test-cases', async (req: Request, res: Response) => {
  const { url, domText, testPlan, config } = req.body as { url: string; domText: string; testPlan: string; config: LLMConfig };
  if (!url || !domText || !testPlan) return res.status(400).json({ error: 'url, domText, and testPlan are required' });
  if (!config?.provider) return res.status(400).json({ error: 'LLM config is required' });

  try {
    const testCases = await generateTestCases(config, url, domText, testPlan);
    res.json({ testCases });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/save', async (req: Request, res: Response) => {
  const { testPlan, testCases } = req.body;
  try {
    if (!fs.existsSync(DELIVERABLES_DIR)) fs.mkdirSync(DELIVERABLES_DIR, { recursive: true });
    if (testPlan) fs.writeFileSync(path.join(DELIVERABLES_DIR, 'test_plan.md'), testPlan);
    if (testCases) fs.writeFileSync(path.join(DELIVERABLES_DIR, 'test_cases.md'), testCases);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
