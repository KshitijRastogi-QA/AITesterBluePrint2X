import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { getBrowser } from '../services/browser';

const router = Router();
const upload = multer({ dest: 'uploads/' });

async function extractDOMText(page: any): Promise<string> {
  return page.evaluate(() => {
    const lines: string[] = [];

    lines.push(`Page Title: ${document.title}`);
    lines.push(`URL: ${window.location.href}`);
    lines.push('');

    // Headings
    document.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
      const text = (el as HTMLElement).innerText?.trim();
      if (text) lines.push(`[${el.tagName}] ${text}`);
    });

    lines.push('');

    // Forms
    document.querySelectorAll('form').forEach((form, fi) => {
      lines.push(`[FORM ${fi + 1}]`);
      form.querySelectorAll('input, select, textarea').forEach((input) => {
        const inp = input as HTMLInputElement;
        const labelEl = inp.id ? document.querySelector(`label[for="${inp.id}"]`) : null;
        const label = (labelEl as HTMLElement | null)?.innerText?.trim()
          || inp.getAttribute('aria-label')
          || inp.getAttribute('aria-labelledby')
          || inp.placeholder
          || inp.name
          || inp.type;
        lines.push(
          `  [INPUT] type="${inp.type || inp.tagName.toLowerCase()}" ` +
          `label="${label}" name="${inp.name}" ` +
          `placeholder="${inp.placeholder}" required="${inp.required}"`
        );
      });
      form.querySelectorAll('button, input[type="submit"]').forEach((btn) => {
        const b = btn as HTMLButtonElement;
        const text = b.innerText?.trim() || b.getAttribute('value') || b.getAttribute('aria-label');
        if (text) lines.push(`  [BUTTON] "${text}"`);
      });
    });

    // Standalone buttons / links
    lines.push('');
    lines.push('[STANDALONE BUTTONS / LINKS]');
    document.querySelectorAll('button, a').forEach((el) => {
      const text = (el as HTMLElement).innerText?.trim();
      if (text && text.length < 80) lines.push(`  [${el.tagName}] "${text}"`);
    });

    // Visible text
    lines.push('');
    lines.push('[VISIBLE TEXT CONTENT]');
    document.querySelectorAll('p, span, label, div').forEach((el) => {
      const hel = el as HTMLElement;
      const text = hel.innerText?.trim();
      if (text && text.length > 5 && text.length < 200 && el.children.length === 0) {
        lines.push(`  ${text}`);
      }
    });

    return lines.join('\n');
  });
}

router.post('/analyse', upload.single('prd'), async (req: Request, res: Response) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  let page: any = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Screenshot for UI preview only
    const screenshotBuffer = await page.screenshot({ fullPage: false });
    const screenshot = screenshotBuffer.toString('base64');

    // DOM text for LLM — no vision needed
    const domText = await extractDOMText(page);

    // PRD / uploaded file
    let prdContent = '';
    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const pdfParse = require('pdf-parse');
        const buffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(buffer);
        prdContent = data.text;
      } else {
        prdContent = fs.readFileSync(req.file.path, 'utf-8');
      }
      fs.unlinkSync(req.file.path);
    }

    res.json({ screenshot, domText, prdContent, url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

export default router;
