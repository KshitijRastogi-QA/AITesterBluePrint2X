import { Page } from 'playwright';

// ─── Anthropic tool definitions ──────────────────────────────────────────────

export const ANTHROPIC_TOOLS: any[] = [
  {
    name: 'navigate',
    description: 'Navigate the browser to a URL. Use this first to open the target page.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full URL including https://' },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_dom',
    description: 'Extract structured DOM text from the current page — all headings, form inputs, buttons, links, and visible text. Use this after navigation to understand the page before interacting.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_text',
    description: 'Get visible text from the page or a specific element.',
    input_schema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector; omit to get full page text' },
      },
    },
  },
  {
    name: 'click',
    description: 'Click an element on the page.',
    input_schema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector derived from the DOM' },
        description: { type: 'string', description: 'What you are clicking and why' },
      },
      required: ['selector', 'description'],
    },
  },
  {
    name: 'fill',
    description: 'Type text into an input field, clearing it first.',
    input_schema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the input' },
        value: { type: 'string', description: 'Text to type' },
        description: { type: 'string', description: 'What field you are filling and why' },
      },
      required: ['selector', 'value', 'description'],
    },
  },
  {
    name: 'wait_for',
    description: 'Wait for an element to appear on the page.',
    input_schema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to wait for' },
        timeout: { type: 'number', description: 'Max wait in ms (default 5000)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'assert_text_present',
    description: 'Assert that a specific piece of text is visible on the page. Returns PASS or FAIL with what was found.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to look for on the page' },
        description: { type: 'string', description: 'What assertion this represents' },
      },
      required: ['text', 'description'],
    },
  },
  {
    name: 'assert_element_exists',
    description: 'Assert that an element matching the selector exists on the page.',
    input_schema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to check' },
        description: { type: 'string', description: 'What element you are checking for' },
      },
      required: ['selector', 'description'],
    },
  },
  {
    name: 'assert_url_contains',
    description: 'Assert that the current URL contains a given string.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'String the URL should contain' },
        description: { type: 'string', description: 'What navigation you are verifying' },
      },
      required: ['pattern', 'description'],
    },
  },
  {
    name: 'complete',
    description: 'Signal that testing is complete. Call this when you have verified all scenarios from the spec — or have exhausted reasonable attempts. This ends the agent run.',
    input_schema: {
      type: 'object',
      properties: {
        verdict: {
          type: 'string',
          enum: ['PASS', 'FAIL', 'PARTIAL'],
          description: 'PASS = all scenarios verified and working; FAIL = critical scenarios failed; PARTIAL = some passed, some failed or blocked',
        },
        summary: { type: 'string', description: 'One paragraph summary of what was tested and what was found' },
        findings: {
          type: 'array',
          description: 'Per-scenario results',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string', description: 'Scenario name from the spec' },
              status: { type: 'string', enum: ['PASS', 'FAIL', 'SKIP', 'BLOCKED'] },
              observation: { type: 'string', description: 'What was actually observed' },
            },
            required: ['scenario', 'status', 'observation'],
          },
        },
      },
      required: ['verdict', 'summary', 'findings'],
    },
  },
];

// ─── OpenAI-format tool definitions (converted) ──────────────────────────────

export const OPENAI_TOOLS = ANTHROPIC_TOOLS
  .filter(t => t.name !== 'complete')
  .map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  })).concat([{
    type: 'function' as const,
    function: {
      name: 'complete',
      description: ANTHROPIC_TOOLS.find(t => t.name === 'complete')!.description,
      parameters: ANTHROPIC_TOOLS.find(t => t.name === 'complete')!.input_schema,
    },
  }]);

// ─── DOM extraction (mirrors Project_02 approach) ────────────────────────────

async function extractDom(page: Page): Promise<string> {
  return page.evaluate(() => {
    const lines: string[] = [];
    lines.push(`Page Title: ${document.title}`);
    lines.push(`URL: ${window.location.href}`);
    lines.push('');

    document.querySelectorAll('h1,h2,h3,h4').forEach(el => {
      const text = (el as HTMLElement).innerText?.trim();
      if (text) lines.push(`[${el.tagName}] ${text}`);
    });

    lines.push('');
    document.querySelectorAll('form').forEach((form, fi) => {
      lines.push(`[FORM ${fi + 1}]`);
      form.querySelectorAll('input,select,textarea').forEach(inp => {
        const el = inp as HTMLInputElement;
        const labelEl = el.id ? document.querySelector(`label[for="${el.id}"]`) : null;
        const label = (labelEl as HTMLElement | null)?.innerText?.trim()
          || el.getAttribute('aria-label') || el.placeholder || el.name || el.type;
        lines.push(`  [INPUT] type="${el.type}" label="${label}" name="${el.name}" placeholder="${el.placeholder}" id="${el.id}"`);
      });
      form.querySelectorAll('button,input[type="submit"]').forEach(btn => {
        const b = btn as HTMLButtonElement;
        const text = b.innerText?.trim() || b.getAttribute('value') || b.getAttribute('aria-label');
        if (text) lines.push(`  [BUTTON] "${text}" type="${b.type}"`);
      });
    });

    lines.push('');
    lines.push('[LINKS & STANDALONE BUTTONS]');
    document.querySelectorAll('button,a').forEach(el => {
      const text = (el as HTMLElement).innerText?.trim();
      if (text && text.length < 100) lines.push(`  [${el.tagName}] "${text}"`);
    });

    lines.push('');
    lines.push('[VISIBLE TEXT]');
    document.querySelectorAll('p,span,label,div,li').forEach(el => {
      const hel = el as HTMLElement;
      const text = hel.innerText?.trim();
      if (text && text.length > 3 && text.length < 300 && el.children.length === 0) {
        lines.push(`  ${text}`);
      }
    });

    return lines.join('\n');
  });
}

// ─── Tool executor ────────────────────────────────────────────────────────────

export async function executeTool(name: string, input: Record<string, any>, page: Page): Promise<string> {
  switch (name) {
    case 'navigate': {
      let url = input.url as string;
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      return `Navigated to ${url}. Page title: "${await page.title()}"`;
    }

    case 'get_dom': {
      const dom = await extractDom(page);
      return dom;
    }

    case 'get_text': {
      if (input.selector) {
        const el = page.locator(input.selector).first();
        const text = await el.innerText({ timeout: 5000 }).catch(() => '');
        return text || `No text found for selector: ${input.selector}`;
      }
      return page.evaluate(() => document.body.innerText?.substring(0, 3000) || '');
    }

    case 'click': {
      const loc = page.locator(input.selector).first();
      await loc.click({ timeout: 8000 });
      await page.waitForTimeout(800);
      return `Clicked: ${input.description}. Current URL: ${page.url()}`;
    }

    case 'fill': {
      const loc = page.locator(input.selector).first();
      await loc.clear({ timeout: 5000 });
      await loc.fill(input.value, { timeout: 5000 });
      return `Filled "${input.selector}" with "${input.value}": ${input.description}`;
    }

    case 'wait_for': {
      await page.waitForSelector(input.selector, { timeout: input.timeout || 5000 });
      return `Element "${input.selector}" is now visible.`;
    }

    case 'assert_text_present': {
      const bodyText = await page.evaluate(() => document.body.innerText || '');
      const found = bodyText.toLowerCase().includes((input.text as string).toLowerCase());
      if (found) {
        return `PASS — "${input.text}" found on page. [${input.description}]`;
      }
      // Try to give a useful nearby excerpt
      const idx = bodyText.length > 0 ? bodyText.substring(0, 500) : '(empty page)';
      return `FAIL — "${input.text}" NOT found on page. [${input.description}] Page sample: ${idx}`;
    }

    case 'assert_element_exists': {
      const count = await page.locator(input.selector).count();
      if (count > 0) {
        return `PASS — Element "${input.selector}" exists (${count} found). [${input.description}]`;
      }
      return `FAIL — Element "${input.selector}" NOT found on page. [${input.description}]`;
    }

    case 'assert_url_contains': {
      const currentUrl = page.url();
      const found = currentUrl.includes(input.pattern);
      if (found) {
        return `PASS — URL contains "${input.pattern}". Current URL: ${currentUrl}. [${input.description}]`;
      }
      return `FAIL — URL does NOT contain "${input.pattern}". Current URL: ${currentUrl}. [${input.description}]`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
