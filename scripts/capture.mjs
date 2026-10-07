// Hangar 7 capture helper: screenshots desktop + mobile views of CAPTURE_URL.
// Exit 75 = transient browser/navigation/infra failure (safe to retry).
// Exit 1  = script or rendering defect (needs a fix).
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const t0 = Date.now();
const stamp = (label) => console.error(`[timing] ${label}: ${Date.now() - t0} ms`);

function failTransient(message) {
  console.error(`transient: ${message}`);
  process.exitCode = 75;
  process.exit();
}

function failDefect(message) {
  console.error(`defect: ${message}`);
  process.exitCode = 1;
  process.exit();
}

const url = process.env.CAPTURE_URL;
const output = process.env.CAPTURE_DIR;
if (!url) failDefect('CAPTURE_URL is not set.');
if (!output) failDefect('CAPTURE_DIR is not set.');
stamp('env-checked');

const runtime = join(process.env.HOME || '/home/runner', '.local/share/omgithub-playwright');
let chromium;
try {
  const require = createRequire(join(runtime, 'package.json'));
  ({ chromium } = require('playwright'));
  stamp('playwright-required');
} catch (error) {
  failDefect(`playwright runtime unavailable: ${error.message}`);
}

let config;
try {
  config = JSON.parse(readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'));
  stamp('browser-config-read');
} catch (error) {
  failTransient(`browser config unreadable: ${error.message}`);
}

if (process.platform === 'linux') {
  try {
    process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim();
  } catch (error) {
    failTransient(`no X display for headed browser: ${error.message}`);
  }
}

const TRANSIENT_HTTP = new Set([408, 429, 500, 502, 503, 504]);
let browser;
try {
  const launchT0 = Date.now();
  try {
    browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 });
  } catch (error) {
    failTransient(`browser launch failed: ${error.message}`);
  }
  console.error(`[timing] browser-launch: ${Date.now() - launchT0} ms`);

  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const viewT0 = Date.now();
    const page = await browser.newPage({ viewport: { width, height } }).catch((error) => {
      failTransient(`new page (${name}) failed: ${error.message}`);
    });
    page.setDefaultTimeout(30000);
    let pageError = '';
    page.on('pageerror', (error) => { pageError += error.message + '\n'; });
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    } catch (error) {
      await page.close().catch(() => {});
      failTransient(`navigation (${name}) failed: ${error.message}`);
    }
    if (!response?.ok()) {
      const status = response?.status();
      await page.close().catch(() => {});
      if (!response || TRANSIENT_HTTP.has(status)) failTransient(`HTTP ${status} loading preview (${name}).`);
      failDefect(`HTTP ${status} loading preview (${name}).`);
    }
    try {
      await page.locator('#scene').waitFor({ state: 'visible', timeout: 20000 });
      await page.waitForFunction(() => window.__hangar !== undefined, null, { timeout: 20000 });
      await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 15000 });
      await page.waitForTimeout(2500);
      const frames = await page.evaluate(() => window.__hangar?.renderer?.info?.render?.calls ?? -1);
      console.error(`[timing] render-calls-${name}: ${frames}`);
      if (frames <= 0) throw new Error(`WebGL renderer produced no draw calls (calls=${frames}).`);
      if (pageError && /three|webgl|__hangar/i.test(pageError)) throw new Error(`page errors: ${pageError.slice(0, 400)}`);
    } catch (error) {
      await page.close().catch(() => {});
      failDefect(`rendered-content check (${name}) failed: ${error.message}`);
    }
    const shotPath = join(output, `final-${name}.png`);
    try {
      await page.screenshot({ path: shotPath, timeout: 30000 });
    } catch (error) {
      await page.close().catch(() => {});
      if (error.name === 'TimeoutError' || !browser.isConnected()) failTransient(`screenshot (${name}) failed: ${error.message}`);
      failDefect(`screenshot (${name}) failed: ${error.message}`);
    }
    await page.close().catch(() => {});
    console.error(`[timing] view-${name}: ${Date.now() - viewT0} ms`);
  }
} finally {
  const closeT0 = Date.now();
  await browser?.close().catch((error) => {
    console.error(`browser close: ${error.message}`);
    process.exitCode ||= 75;
  });
  console.error(`[timing] browser-close: ${Date.now() - closeT0} ms`);
}

// Validate PNG outputs (magic bytes + non-trivial size).
mkdirSync(output, { recursive: true });
for (const name of ['final-desktop.png', 'final-mobile.png']) {
  const path = join(output, name);
  let stat;
  try {
    stat = statSync(path);
  } catch {
    failDefect(`capture missing: ${name}`);
  }
  const head = readFileSync(path).subarray(0, 8).toString('hex');
  if (stat.size < 24 || head !== '89504e470d0a1a0a') failDefect(`capture is not a valid PNG: ${name}`);
  console.error(`[timing] validated-${name}: ${stat.size} bytes`);
}
stamp('capture-done');
console.log(`captured final-desktop.png + final-mobile.png in ${output}`);
