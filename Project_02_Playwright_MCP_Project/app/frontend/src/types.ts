export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'groq' | 'ollama' | 'lmstudio';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface TestCase {
  id: string;
  title: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  priority: string;
  category: string;
  status: 'idle' | 'running' | 'pass' | 'fail';
  observedMessage: string;
  stepLogs: string[];
}

export interface SSEEvent {
  type: 'start' | 'tc_start' | 'step' | 'tc_result' | 'done' | 'error';
  id?: string;
  title?: string;
  total?: number;
  message?: string;
  pass?: boolean;
  observedMessage?: string;
  expectedResult?: string;
}

export type Step = 1 | 2 | 3 | 4;
