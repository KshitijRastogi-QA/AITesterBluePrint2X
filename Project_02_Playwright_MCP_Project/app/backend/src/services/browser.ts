import { Browser, chromium } from 'playwright';

let browserPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: false });
  }
  const b = await browserPromise;
  if (!b.isConnected()) {
    browserPromise = chromium.launch({ headless: false });
    return browserPromise;
  }
  return b;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const b = await browserPromise;
    await b.close();
    browserPromise = null;
  }
}
