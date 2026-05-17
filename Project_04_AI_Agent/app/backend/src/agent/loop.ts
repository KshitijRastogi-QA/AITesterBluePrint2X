import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { chromium, Browser, Page } from 'playwright';
import { ANTHROPIC_TOOLS, OPENAI_TOOLS, executeTool } from './tools';
import { buildSystemPrompt } from './prompt';

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'groq';
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AgentEvent {
  type: 'thought' | 'plan' | 'action' | 'observation' | 'adapt' | 'error' | 'complete' | 'status';
  content: string;
  tool?: string;
  input?: Record<string, any>;
  data?: any;
  timestamp: number;
}

export interface AgentFinding {
  scenario: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'BLOCKED';
  observation: string;
}

export interface AgentResult {
  verdict: 'PASS' | 'FAIL' | 'PARTIAL';
  summary: string;
  findings: AgentFinding[];
  duration: number;
  iterations: number;
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-flash',
  groq: 'llama-3.3-70b-versatile',
};

const DEFAULT_BASE_URLS: Record<string, string | undefined> = {
  anthropic: undefined,
  openai: undefined,
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  groq: 'https://api.groq.com/openai/v1',
};

const MAX_ITERATIONS = 30;

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch({ headless: true });
  }
  return sharedBrowser;
}

// ─── Anthropic agent loop ─────────────────────────────────────────────────────

async function runAnthropicAgent(
  spec: string,
  url: string,
  config: LLMConfig,
  page: Page,
  emit: (event: AgentEvent) => void
): Promise<AgentResult> {
  const client = new Anthropic({ apiKey: config.apiKey });
  const model = config.model || DEFAULT_MODELS.anthropic;
  const systemPrompt = buildSystemPrompt(spec, url);

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Begin the QA agent run. Navigate to ${url} and verify the feature described in the spec. Call complete when you are done.`,
    },
  ];

  let iterations = 0;
  const startTime = Date.now();

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    emit({ type: 'status', content: `Iteration ${iterations} / ${MAX_ITERATIONS}`, timestamp: Date.now() });

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      tools: ANTHROPIC_TOOLS,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    // Emit text blocks as thoughts
    for (const block of response.content) {
      if (block.type === 'text' && block.text.trim()) {
        emit({ type: 'thought', content: block.text.trim(), timestamp: Date.now() });
      }
    }

    if (response.stop_reason === 'end_turn') break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      const { name, id, input } = block;

      // The complete tool ends the loop
      if (name === 'complete') {
        const data = input as any;
        emit({ type: 'complete', content: data.summary, data, timestamp: Date.now() });
        return {
          verdict: data.verdict,
          summary: data.summary,
          findings: data.findings || [],
          duration: Date.now() - startTime,
          iterations,
        };
      }

      emit({
        type: 'action',
        content: formatActionLabel(name, input as Record<string, any>),
        tool: name,
        input: input as Record<string, any>,
        timestamp: Date.now(),
      });

      let resultContent: string;
      try {
        resultContent = await executeTool(name, input as Record<string, any>, page);
        const eventType = resultContent.startsWith('FAIL') ? 'adapt' : 'observation';
        emit({ type: eventType, content: resultContent, tool: name, timestamp: Date.now() });
      } catch (e: any) {
        resultContent = `ERROR: ${e.message}`;
        emit({ type: 'error', content: e.message, tool: name, timestamp: Date.now() });
      }

      toolResults.push({ type: 'tool_result', tool_use_id: id, content: resultContent });
    }

    if (toolResults.length > 0) {
      messages.push({ role: 'user', content: toolResults });
    }
  }

  // Max iterations reached
  return {
    verdict: 'PARTIAL',
    summary: `Agent reached the maximum iteration limit (${MAX_ITERATIONS}) without completing all scenarios.`,
    findings: [],
    duration: Date.now() - startTime,
    iterations,
  };
}

// ─── OpenAI-compatible agent loop (OpenAI / Gemini / Groq) ───────────────────

async function runOpenAIAgent(
  spec: string,
  url: string,
  config: LLMConfig,
  page: Page,
  emit: (event: AgentEvent) => void
): Promise<AgentResult> {
  const client = new OpenAI({
    apiKey: config.apiKey || 'not-needed',
    baseURL: config.baseUrl || DEFAULT_BASE_URLS[config.provider],
  });
  const model = config.model || DEFAULT_MODELS[config.provider] || 'gpt-4o';
  const systemPrompt = buildSystemPrompt(spec, url);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Begin the QA agent run. Navigate to ${url} and verify the feature spec. Call complete when done.`,
    },
  ];

  let iterations = 0;
  const startTime = Date.now();

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    emit({ type: 'status', content: `Iteration ${iterations} / ${MAX_ITERATIONS}`, timestamp: Date.now() });

    const response = await client.chat.completions.create({
      model,
      tools: OPENAI_TOOLS,
      tool_choice: 'auto',
      messages,
    } as any);

    const msg = response.choices[0].message;
    messages.push(msg as any);

    if (msg.content?.trim()) {
      emit({ type: 'thought', content: msg.content.trim(), timestamp: Date.now() });
    }

    if (!msg.tool_calls || msg.tool_calls.length === 0) break;

    const toolResultMessages: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];

    for (const call of msg.tool_calls) {
      const name = call.function.name;
      const input = JSON.parse(call.function.arguments || '{}');

      if (name === 'complete') {
        emit({ type: 'complete', content: input.summary, data: input, timestamp: Date.now() });
        return {
          verdict: input.verdict,
          summary: input.summary,
          findings: input.findings || [],
          duration: Date.now() - startTime,
          iterations,
        };
      }

      emit({
        type: 'action',
        content: formatActionLabel(name, input),
        tool: name,
        input,
        timestamp: Date.now(),
      });

      let resultContent: string;
      try {
        resultContent = await executeTool(name, input, page);
        const eventType = resultContent.startsWith('FAIL') ? 'adapt' : 'observation';
        emit({ type: eventType, content: resultContent, tool: name, timestamp: Date.now() });
      } catch (e: any) {
        resultContent = `ERROR: ${e.message}`;
        emit({ type: 'error', content: e.message, tool: name, timestamp: Date.now() });
      }

      toolResultMessages.push({ role: 'tool', tool_call_id: call.id, content: resultContent });
    }

    messages.push(...toolResultMessages);
  }

  return {
    verdict: 'PARTIAL',
    summary: `Agent reached the maximum iteration limit (${MAX_ITERATIONS}) without completing.`,
    findings: [],
    duration: Date.now() - startTime,
    iterations,
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function runAgent(
  spec: string,
  url: string,
  config: LLMConfig,
  emit: (event: AgentEvent) => void
): Promise<AgentResult> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  emit({ type: 'status', content: 'Browser launched. Starting agent...', timestamp: Date.now() });

  try {
    if (config.provider === 'anthropic') {
      return await runAnthropicAgent(spec, url, config, page, emit);
    }
    return await runOpenAIAgent(spec, url, config, page, emit);
  } finally {
    await page.close().catch(() => {});
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatActionLabel(name: string, input: Record<string, any>): string {
  switch (name) {
    case 'navigate': return `navigate("${input.url}")`;
    case 'get_dom': return 'get_dom()';
    case 'get_text': return `get_text(${input.selector ? `"${input.selector}"` : ''})`;
    case 'click': return `click("${input.selector}") — ${input.description}`;
    case 'fill': return `fill("${input.selector}", "${input.value}") — ${input.description}`;
    case 'wait_for': return `wait_for("${input.selector}")`;
    case 'assert_text_present': return `assert_text_present("${input.text}") — ${input.description}`;
    case 'assert_element_exists': return `assert_element_exists("${input.selector}") — ${input.description}`;
    case 'assert_url_contains': return `assert_url_contains("${input.pattern}") — ${input.description}`;
    default: return `${name}(${JSON.stringify(input)})`;
  }
}
