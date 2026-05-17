import { Router, Request, Response } from 'express';
import { getBrowser } from '../services/browser';
import { parseTestCases } from '../services/parser';
import { interpretStepsAsActions, verifyExpectedResult, PlaywrightAction, LLMConfig } from '../services/llm';

const router = Router();

router.post('/execute', async (req: Request, res: Response) => {
  const { url, testCasesMarkdown, testCaseIds, config } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const allCases = parseTestCases(testCasesMarkdown);
    const toRun = testCaseIds?.length
      ? allCases.filter(tc => testCaseIds.includes(tc.id))
      : allCases;

    send({ type: 'start', total: toRun.length });

    const browser = await getBrowser();

    for (const tc of toRun) {
      send({ type: 'tc_start', id: tc.id, title: tc.title });

      let page: any = null;
      try {
        page = await browser.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });

        // Navigate and extract DOM text (no vision needed)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1000);
        const domText = await page.evaluate(() => {
          const lines: string[] = [`Page: ${document.title}`, `URL: ${window.location.href}`, ''];
          document.querySelectorAll('h1,h2,h3').forEach((el: any) => { if (el.innerText?.trim()) lines.push(`[${el.tagName}] ${el.innerText.trim()}`); });
          document.querySelectorAll('input,select,textarea').forEach((el: any) => {
            const label = document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() || el.getAttribute('aria-label') || el.placeholder || el.name || el.type;
            lines.push(`[INPUT] type="${el.type}" label="${label}" name="${el.name}" placeholder="${el.placeholder}"`);
          });
          document.querySelectorAll('button,a').forEach((el: any) => { const t = el.innerText?.trim(); if (t && t.length < 60) lines.push(`[${el.tagName}] "${t}"`); });
          return lines.join('\n');
        });

        // Ask AI to interpret steps into Playwright actions using DOM text
        send({ type: 'step', id: tc.id, message: 'AI is interpreting test steps...' });
        const actions: PlaywrightAction[] = await interpretStepsAsActions(
          config, url, tc.steps, tc.preconditions, domText
        );

        // Execute each action
        for (const action of actions) {
          send({ type: 'step', id: tc.id, message: action.description });
          try {
            switch (action.type) {
              case 'navigate':
                await page.goto(action.url!, { waitUntil: 'domcontentloaded', timeout: 15000 });
                break;
              case 'fill':
                await page.locator(action.selector!).fill(action.value || '');
                break;
              case 'click':
                await page.locator(action.selector!).click();
                await page.waitForTimeout(800);
                break;
              case 'waitForSelector':
                await page.locator(action.selector!).waitFor({ timeout: 5000 });
                break;
              case 'check':
                await page.locator(action.selector!).check();
                break;
              case 'selectOption':
                await page.locator(action.selector!).selectOption(action.value || '');
                break;
            }
          } catch (actionErr: any) {
            send({ type: 'step', id: tc.id, message: `⚠ ${action.description}: ${actionErr.message}` });
          }
        }

        await page.waitForTimeout(1500);

        // Verify expected result
        send({ type: 'step', id: tc.id, message: 'Verifying expected result...' });
        const pageText = await page.locator('body').innerText();
        const result = await verifyExpectedResult(config, pageText, tc.expectedResult);

        send({
          type: 'tc_result',
          id: tc.id,
          title: tc.title,
          pass: result.pass,
          observedMessage: result.observedMessage,
          expectedResult: tc.expectedResult
        });

      } catch (tcErr: any) {
        send({
          type: 'tc_result',
          id: tc.id,
          title: tc.title,
          pass: false,
          observedMessage: `Error: ${tcErr.message}`,
          expectedResult: tc.expectedResult
        });
      } finally {
        if (page) await page.close().catch(() => {});
      }
    }

    send({ type: 'done' });
    res.end();

  } catch (err: any) {
    send({ type: 'error', message: err.message });
    res.end();
  }
});

export default router;
