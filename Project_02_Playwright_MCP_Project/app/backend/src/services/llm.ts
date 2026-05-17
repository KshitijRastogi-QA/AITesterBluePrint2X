import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'groq' | 'ollama' | 'lmstudio';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface PlaywrightAction {
  type: 'navigate' | 'fill' | 'click' | 'waitForSelector' | 'check' | 'selectOption';
  selector?: string;
  value?: string;
  url?: string;
  description: string;
}

const DEFAULTS: Record<LLMConfig['provider'], { model: string; baseUrl?: string }> = {
  anthropic: { model: 'claude-sonnet-4-6' },
  openai:    { model: 'gpt-4o' },
  gemini:    { model: 'gemini-1.5-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/' },
  groq:      { model: 'llama-3.3-70b-versatile', baseUrl: 'https://api.groq.com/openai/v1' },
  ollama:    { model: 'gemma3:1b', baseUrl: 'http://localhost:11434/v1' },
  lmstudio:  { model: 'local-model', baseUrl: 'http://localhost:1234/v1' },
};

// Root of the project (two levels up from dist/src/services or src/services)
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');

/**
 * Loads a RICEPOT prompt file from prompts/ and replaces {{PLACEHOLDER}} tokens.
 * Falls back to empty string if the file is missing — callers provide inline fallbacks.
 */
function loadPrompt(filename: string, replacements: Record<string, string>): string {
  const promptPath = path.join(PROJECT_ROOT, 'prompts', filename);
  let template = '';
  try {
    template = fs.readFileSync(promptPath, 'utf-8');
  } catch {
    return '';
  }
  for (const [key, value] of Object.entries(replacements)) {
    template = template.split(`{{${key}}}`).join(value);
  }
  return template;
}

function getModel(config: LLMConfig): string {
  return config.model || DEFAULTS[config.provider].model;
}

// Pure text LLM call — no vision, works with every provider
async function callLLM(config: LLMConfig, prompt: string, maxTokens = 4000): Promise<string> {
  const model = getModel(config);

  if (config.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: config.apiKey });
    const res = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    return res.content[0].type === 'text' ? res.content[0].text : '';
  }

  // All other providers via OpenAI-compatible API
  const def = DEFAULTS[config.provider];
  const client = new OpenAI({
    apiKey: config.apiKey || 'not-needed',
    baseURL: config.baseUrl || def.baseUrl,
  });
  const res = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.choices[0]?.message?.content || '';
}

// ─────────────────────────────────────────────
//  Prompt 02 — Test Plan Generation
//  File: prompts/02_test_plan_generation.md
// ─────────────────────────────────────────────
export async function generateTestPlan(
  config: LLMConfig,
  url: string,
  domText: string,
  context: string
): Promise<string> {
  const prompt = loadPrompt('02_test_plan_generation.md', {
    URL: url,
    DOM_TEXT: domText,
    ADDITIONAL_CONTEXT: context || 'No additional context provided.',
  });

  // Inline fallback if prompt file is missing
  const fallback = `You are a Senior QA Engineer. Generate a detailed test plan based on the page structure extracted by Playwright.

Target URL: ${url}

PAGE STRUCTURE (extracted from live DOM by Playwright):
${domText}

${context ? `ADDITIONAL CONTEXT:\n${context}` : ''}

Generate a comprehensive test plan in markdown format covering:
1. Introduction and objectives
2. In-scope and out-of-scope (based ONLY on what is in the DOM structure above)
3. Test strategy (Playwright as automation tool)
4. Test environment details
5. Entry and exit criteria
6. Test cases summary (list titles only)
7. Risk assessment
8. Schedule
9. Deliverables checklist

IMPORTANT: Only document features present in the DOM or described in context. Do not invent fields or functionality.`;

  return callLLM(config, prompt || fallback, 4000);
}

// ─────────────────────────────────────────────
//  Prompt 03 — Test Cases Generation
//  File: prompts/03_test_cases_generation.md
// ─────────────────────────────────────────────
export async function generateTestCases(
  config: LLMConfig,
  url: string,
  domText: string,
  testPlan: string
): Promise<string> {
  const prompt = loadPrompt('03_test_cases_generation.md', {
    URL: url,
    DOM_TEXT: domText,
    TEST_PLAN: testPlan.substring(0, 2000),
  });

  // Inline fallback if prompt file is missing
  const fallback = `You are a Senior QA Engineer. Generate detailed test cases based on the page DOM structure and test plan.

Target URL: ${url}

PAGE STRUCTURE (extracted from live DOM by Playwright):
${domText}

Test Plan:
${testPlan.substring(0, 2000)}

CRITICAL: Start your response DIRECTLY with ### TC-001 — no introduction, no preamble.

Generate test cases in this EXACT format:

### TC-001
| Field | Description |
|-------|-------------|
| **TC ID** | TC-001 |
| **Title** | Brief title here |
| **Preconditions** | What must be true before the test |
| **Steps** | 1. First step<br>2. Second step<br>3. Third step |
| **Expected Result** | What should happen |
| **Priority** | High |
| **Category** | Functional |

Rules:
- Number sequentially: TC-001, TC-002 ...
- Steps use <br> between them (no real newlines in table cells)
- Include Smoke, Functional, and Negative scenarios
- Use actual field names/labels from the DOM structure above
- Only test what exists in the DOM — do not invent fields
- Generate at least 5 test cases`;

  return callLLM(config, prompt || fallback, 6000);
}

// ─────────────────────────────────────────────
//  Prompt 04 — Playwright Action Interpretation
//  File: prompts/04_action_interpretation.md
// ─────────────────────────────────────────────
export async function interpretStepsAsActions(
  config: LLMConfig,
  url: string,
  steps: string[],
  preconditions: string,
  domText: string
): Promise<PlaywrightAction[]> {
  const stepsText = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

  const prompt = loadPrompt('04_action_interpretation.md', {
    URL: url,
    PRECONDITIONS: preconditions,
    STEPS: stepsText,
    DOM_TEXT: domText.substring(0, 3000),
  });

  const fallback = `You are a Playwright automation expert. Convert these test steps into Playwright actions.

Target URL: ${url}
Preconditions: ${preconditions}

Test Steps:
${stepsText}

PAGE STRUCTURE (from live Playwright DOM extraction):
${domText.substring(0, 3000)}

Return a JSON array of Playwright actions. Each must have:
- type: "navigate" | "fill" | "click" | "waitForSelector" | "check" | "selectOption"
- selector: CSS selector (use name, id, type, placeholder attributes from the DOM above)
- value: text to enter (fill/selectOption only)
- url: full URL (navigate only)
- description: human-readable description

Rules:
- Always start with navigate to the URL
- Use attributes visible in the DOM: input[name="..."], input[type="email"], button[type="submit"]
- For text-based buttons: text="Continue" or :has-text("Continue")
- Return ONLY raw JSON array, no markdown`;

  const text = await callLLM(config, prompt || fallback, 2000);
  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [{ type: 'navigate', url, description: 'Navigate to target URL' }];
  }
}

// ─────────────────────────────────────────────
//  Prompt 05 — Result Verification
//  File: prompts/05_result_verification.md
// ─────────────────────────────────────────────
export async function verifyExpectedResult(
  config: LLMConfig,
  pageText: string,
  expectedResult: string
): Promise<{ pass: boolean; observedMessage: string }> {
  const prompt = loadPrompt('05_result_verification.md', {
    EXPECTED_RESULT: expectedResult,
    PAGE_TEXT: pageText.substring(0, 2000),
  });

  const fallback = `Check if the page content satisfies the expected result.

Expected: ${expectedResult}

Page text (first 2000 chars):
${pageText.substring(0, 2000)}

Return JSON only (no markdown):
{"pass": true or false, "observedMessage": "the relevant text found on the page"}`;

  const text = await callLLM(config, prompt || fallback, 300);
  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { pass: false, observedMessage: 'Could not verify result' };
  }
}
