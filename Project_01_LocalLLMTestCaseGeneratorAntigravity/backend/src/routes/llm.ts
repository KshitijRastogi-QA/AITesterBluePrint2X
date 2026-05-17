import express from 'express';
import { Request, Response } from 'express';
import axios from 'axios';
import { getLLMClient, generateTestCasesWithLLM } from '../services/llmService';

const router = express.Router();

// Define Configuration Interface
export interface LLMConfig {
  provider: 'ollama' | 'lmstudio' | 'groq' | 'openai' | 'claude' | 'gemini';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

// Global or per-request configuration
let currentConfig: LLMConfig | null = null;

router.post('/settings', (req: Request, res: Response) => {
  const config = req.body as LLMConfig;
  currentConfig = config;
  res.json({ success: true, message: 'Settings saved temporarily in memory' });
});

router.post('/test-connection', async (req: Request, res: Response) => {
  const config = req.body as LLMConfig;

  try {
    if (config.provider === 'ollama') {
      const baseUrl = config.baseUrl || 'http://localhost:11434';
      const { data } = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
      const models: string[] = (data.models || []).map((m: any) => m.name);
      const modelName = config.model || 'gemma3:1b';
      if (!models.includes(modelName)) {
        return res.status(500).json({ success: false, message: `Model '${modelName}' not found. Available: ${models.join(', ')}` });
      }
      return res.json({ success: true, message: `Connected to Ollama. Model '${modelName}' is available.` });
    }

    if (config.provider === 'lmstudio') {
      const baseUrl = config.baseUrl || 'http://localhost:1234/v1';
      await axios.get(`${baseUrl}/models`, { timeout: 5000 });
      return res.json({ success: true, message: 'Connected to LM Studio successfully.' });
    }

    // For cloud providers — do a minimal inference call
    const llm = getLLMClient(config);
    await llm.invoke("ping");
    res.json({ success: true, message: `Successfully connected to ${config.provider}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Connection test failed' });
  }
});

router.post('/generate', async (req: Request, res: Response) => {
  const { requirement, config } = req.body;
  const activeConfig = config || currentConfig;
  
  if (!activeConfig) {
      return res.status(400).json({ error: 'LLM Configuration is required' });
  }
  if (!requirement) {
      return res.status(400).json({ error: 'Requirement text is required' });
  }

  try {
    const testCases = await generateTestCasesWithLLM(requirement, activeConfig);
    res.json({ testCases, providerUsed: activeConfig.provider });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate test cases.' });
  }
});

export default router;
