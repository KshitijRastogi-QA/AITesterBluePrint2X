import { Browser, BrowserContext, Page, chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
let artifactDir: string | null = null;

export function setArtifactDir(dir: string) { artifactDir = dir; }

export async function getPage(): Promise<Page> {
  if (!browser) browser = await chromium.launch({ headless: false });
  if (!context) context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  if (!page || page.isClosed()) page = await context.newPage();
  return page;
}

export async function closeBrowser() {
  if (browser) { await browser.close(); browser = null; context = null; page = null; }
}

function extractDom(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 4000);
}

export async function executeTool(name: string, input: any): Promise<string> {
  const p = await getPage();
  try {
    switch (name) {
      case 'navigate': {
        await p.goto(input.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        return `Navigated to ${input.url}`;
      }
      case 'get_dom': {
        const html = await p.content();
        return extractDom(html);
      }
      case 'click': {
        await p.locator(input.selector).first().click({ timeout: 8000 });
        return `Clicked: ${input.description || input.selector}`;
      }
      case 'fill': {
        await p.locator(input.selector).first().fill(input.value, { timeout: 8000 });
        return `Filled "${input.value}" into: ${input.description || input.selector}`;
      }
      case 'wait_for': {
        await p.locator(input.selector).first().waitFor({ timeout: input.timeout || 5000 });
        return `Element visible: ${input.selector}`;
      }
      case 'get_text': {
        if (input.selector) {
          const text = await p.locator(input.selector).first().innerText({ timeout: 5000 });
          return text.trim();
        }
        return (await p.innerText('body')).substring(0, 2000);
      }
      case 'assert_text_present': {
        const body = await p.innerText('body');
        const found = body.toLowerCase().includes(input.text.toLowerCase());
        return found ? `PASS — "${input.text}" found on page` : `FAIL — "${input.text}" NOT found on page`;
      }
      case 'assert_element_exists': {
        const count = await p.locator(input.selector).count();
        return count > 0 ? `PASS — element exists: ${input.selector}` : `FAIL — element NOT found: ${input.selector}`;
      }
      case 'assert_url_contains': {
        const url = p.url();
        const ok = url.includes(input.pattern);
        return ok ? `PASS — URL contains "${input.pattern}" (current: ${url})` : `FAIL — URL does not contain "${input.pattern}" (current: ${url})`;
      }
      case 'screenshot': {
        const buf = await p.screenshot({ fullPage: true });
        if (artifactDir) {
          if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });
          const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
          const fname = `screenshot-${ts}.png`;
          fs.writeFileSync(path.join(artifactDir, fname), buf);
          return `Screenshot saved: ${fname} (${buf.length} bytes)`;
        }
        return `Screenshot taken (${buf.length} bytes)`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `ERROR: ${err.message}`;
  }
}

export const ANTHROPIC_TOOLS: any[] = [
  { name: 'navigate', description: 'Open a URL in the browser', input_schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
  { name: 'get_dom', description: 'Get the current page DOM as text — use this to find selectors', input_schema: { type: 'object', properties: {} } },
  { name: 'click', description: 'Click an element by CSS selector', input_schema: { type: 'object', properties: { selector: { type: 'string' }, description: { type: 'string' } }, required: ['selector'] } },
  { name: 'fill', description: 'Fill a text input by CSS selector', input_schema: { type: 'object', properties: { selector: { type: 'string' }, value: { type: 'string' }, description: { type: 'string' } }, required: ['selector', 'value'] } },
  { name: 'wait_for', description: 'Wait for an element to appear', input_schema: { type: 'object', properties: { selector: { type: 'string' }, timeout: { type: 'number' } }, required: ['selector'] } },
  { name: 'get_text', description: 'Read text from the page or a specific element', input_schema: { type: 'object', properties: { selector: { type: 'string' } } } },
  { name: 'assert_text_present', description: 'Assert text is visible on the page — returns PASS or FAIL', input_schema: { type: 'object', properties: { text: { type: 'string' }, description: { type: 'string' } }, required: ['text'] } },
  { name: 'assert_element_exists', description: 'Assert an element exists — returns PASS or FAIL', input_schema: { type: 'object', properties: { selector: { type: 'string' }, description: { type: 'string' } }, required: ['selector'] } },
  { name: 'assert_url_contains', description: 'Assert the current URL contains a pattern — returns PASS or FAIL', input_schema: { type: 'object', properties: { pattern: { type: 'string' }, description: { type: 'string' } }, required: ['pattern'] } },
  { name: 'complete', description: 'End the test case execution with a verdict', input_schema: { type: 'object', properties: { verdict: { type: 'string', enum: ['PASS', 'FAIL', 'BLOCKED'] }, reason: { type: 'string' }, observations: { type: 'string' } }, required: ['verdict', 'reason'] } },
];

export const OPENAI_TOOLS: any[] = ANTHROPIC_TOOLS.map(t => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: t.input_schema },
}));
