import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import path from 'path';
import { PlaywrightMCPClient } from './mcp-client';

export interface ExecEvent {
  type: 'thought' | 'action' | 'observation' | 'adapt' | 'complete' | 'error';
  content: string;
  data?: any;
  timestamp: number;
}

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'groq' | 'gemini' | 'ollama' | 'lmstudio' | string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface ExecResult {
  verdict: 'PASS' | 'FAIL' | 'BLOCKED';
  reason: string;
  observations: string;
  duration: number;
  iterations: number;
}

function buildSystemPrompt(tcId: string, tcTitle: string, url: string, steps: string): string {
  return `You are an expert QA engineer executing a single test case in a live browser via Playwright.

Test Case: ${tcId} — ${tcTitle}
Target URL: ${url}

Your job:
1. Navigate to the URL using browser_navigate
2. Use browser_snapshot to understand the page structure (preferred over DOM text)
3. Execute each test step using the available browser tools
4. After each interaction, use browser_snapshot to observe the result
5. When all steps are complete (or a critical step fails), call complete() with your verdict

Rules:
- Use browser_snapshot to find elements — it gives you the accessibility tree with roles and labels
- Use browser_click with element ref IDs from the snapshot, not raw CSS selectors
- If an element is not found, try browser_snapshot again or try an alternative approach
- Do not ask for clarification — make your best judgement and complete the test
- Take a screenshot (browser_take_screenshot) for any step that results in a FAIL

Test Steps to Execute:
${steps}`;
}

async function runAnthropicExecutor(
  tcId: string, tcTitle: string, url: string, steps: string,
  config: LLMConfig, mcp: PlaywrightMCPClient, emit: (e: ExecEvent) => void
): Promise<ExecResult> {
  const client = new Anthropic({ apiKey: config.apiKey });
  const model = config.model || 'claude-sonnet-4-6';
  const systemPrompt = buildSystemPrompt(tcId, tcTitle, url, steps);
  const messages: any[] = [{ role: 'user', content: `Execute test case ${tcId}: ${tcTitle}\n\nStart by navigating to ${url}` }];
  const tools = mcp.getAnthropicTools();

  let iterations = 0;
  const MAX = 25;

  while (iterations < MAX) {
    iterations++;
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });

    let assistantContent: any[] = [];
    for (const block of response.content) {
      assistantContent.push(block);
      if (block.type === 'text' && block.text.trim()) {
        emit({ type: 'thought', content: block.text.trim(), timestamp: Date.now() });
      }
      if (block.type === 'tool_use') {
        emit({ type: 'action', content: `${block.name}(${JSON.stringify(block.input)})`, data: { tool: block.name, input: block.input }, timestamp: Date.now() });

        if (block.name === 'complete') {
          const inp = block.input as any;
          return { verdict: inp.verdict, reason: inp.reason, observations: inp.observations || '', duration: 0, iterations };
        }

        const result = await mcp.callTool(block.name, block.input);
        const isFail = /\bFAIL\b/.test(result) || result.startsWith('ERROR:');
        emit({ type: isFail ? 'adapt' : 'observation', content: result, timestamp: Date.now() });

        messages.push({ role: 'assistant', content: assistantContent });
        messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: block.id, content: result }] });
        assistantContent = [];
        break;
      }
    }

    if (assistantContent.length > 0) {
      messages.push({ role: 'assistant', content: assistantContent });
    }

    if (response.stop_reason === 'end_turn') break;
  }

  return { verdict: 'BLOCKED', reason: 'Max iterations reached without complete()', observations: '', duration: 0, iterations };
}

async function runOpenAIExecutor(
  tcId: string, tcTitle: string, url: string, steps: string,
  config: LLMConfig, mcp: PlaywrightMCPClient, emit: (e: ExecEvent) => void
): Promise<ExecResult> {
  const BASE_URLS: Record<string, string> = {
    groq: 'https://api.groq.com/openai/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    ollama: config.baseUrl || 'http://localhost:11434/v1',
    lmstudio: config.baseUrl || 'http://localhost:1234/v1',
  };
  const isLocal = config.provider === 'ollama' || config.provider === 'lmstudio';
  const client = new OpenAI({
    apiKey: isLocal ? (config.apiKey || 'local') : config.apiKey,
    baseURL: config.baseUrl || BASE_URLS[config.provider] || undefined,
  });
  const model = config.model || 'gpt-4o';
  const systemPrompt = buildSystemPrompt(tcId, tcTitle, url, steps);
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Execute test case ${tcId}: ${tcTitle}\n\nStart by navigating to ${url}` },
  ];
  const tools = mcp.getOpenAITools();

  let iterations = 0;
  const MAX = 25;

  while (iterations < MAX) {
    iterations++;
    const response = await client.chat.completions.create({ model, messages, tools, tool_choice: 'auto' });
    const msg = response.choices[0].message;
    messages.push(msg);

    if (msg.content) emit({ type: 'thought', content: msg.content, timestamp: Date.now() });

    if (!msg.tool_calls?.length) break;

    for (const tc of msg.tool_calls) {
      const input = JSON.parse(tc.function.arguments || '{}');
      emit({ type: 'action', content: `${tc.function.name}(${tc.function.arguments})`, data: { tool: tc.function.name, input }, timestamp: Date.now() });

      if (tc.function.name === 'complete') {
        return { verdict: input.verdict, reason: input.reason, observations: input.observations || '', duration: 0, iterations };
      }

      const result = await mcp.callTool(tc.function.name, input);
      const isFail = /\bFAIL\b/.test(result) || result.startsWith('ERROR:');
      emit({ type: isFail ? 'adapt' : 'observation', content: result, timestamp: Date.now() });
      messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
    }

    if (response.choices[0].finish_reason === 'stop') break;
  }

  return { verdict: 'BLOCKED', reason: 'Max iterations reached', observations: '', duration: 0, iterations };
}

export async function executeTestCase(
  tcId: string, tcTitle: string, url: string, steps: string,
  config: LLMConfig, emit: (e: ExecEvent) => void
): Promise<ExecResult> {
  const start = Date.now();
  const mcp = new PlaywrightMCPClient();

  try {
    emit({ type: 'thought', content: 'Starting Playwright MCP server...', timestamp: Date.now() });
    await mcp.start(true);
    emit({ type: 'observation', content: 'Playwright MCP ready', timestamp: Date.now() });

    let result: ExecResult;
    if (config.provider === 'anthropic') {
      result = await runAnthropicExecutor(tcId, tcTitle, url, steps, config, mcp, emit);
    } else {
      result = await runOpenAIExecutor(tcId, tcTitle, url, steps, config, mcp, emit);
    }

    result.duration = Date.now() - start;
    emit({ type: 'complete', content: `${result.verdict} — ${result.reason}`, data: result, timestamp: Date.now() });
    return result;
  } catch (err: any) {
    emit({ type: 'error', content: err.message, timestamp: Date.now() });
    return { verdict: 'BLOCKED', reason: err.message, observations: '', duration: Date.now() - start, iterations: 0 };
  } finally {
    await mcp.close();
  }
}
