import express from 'express';
import { Request, Response } from 'express';
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
    const llm = getLLMClient(config);
    // Ping to check if model/API responds basic completion.
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
