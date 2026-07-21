import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlan = 'video/plans/community-growth-open-source-ai-workflow-automation.json';

function parseArgs(argv) {
  const args = { plan: defaultPlan, out: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else if (arg === '--out') args.out = argv[++index] ?? '';
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function insideRoot(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) throw new Error(`${relativePath} escapes repository root`);
  return absolutePath;
}

function assertPublicFlyto2Url(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('product demo URL must use https');
  if (url.hostname !== 'flyto2.com' && !url.hostname.endsWith('.flyto2.com')) {
    throw new Error(`product demo URL must stay on flyto2.com: ${url.hostname}`);
  }
  return url.toString();
}

async function dismissConsent(page) {
  const candidates = [
    'button:has-text("Accept all")',
    'button:has-text("Accept")',
    'button:has-text("同意")',
    'button:has-text("全部接受")',
  ];
  for (const selector of candidates) {
    const button = page.locator(selector).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => {});
      return;
    }
  }
}

async function runAction(page, action) {
  const durationMs = Math.max(250, Math.min(Number(action.durationMs ?? 1200), 8000));
  if (action.type === 'wait') {
    await page.waitForTimeout(durationMs);
    return;
  }
  if (action.type === 'scroll') {
    const top = Number(action.y ?? 0);
    await page.evaluate((scrollTop) => window.scrollTo({ top: scrollTop, behavior: 'smooth' }), top);
    await page.waitForTimeout(durationMs);
    return;
  }
  if (action.type === 'hover') {
    await page.locator(String(action.selector)).first().hover({ timeout: 5000 });
    await page.waitForTimeout(durationMs);
    return;
  }
  if (action.type === 'goto') {
    await page.goto(assertPublicFlyto2Url(action.url), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(durationMs);
    return;
  }
  throw new Error(`unsupported product demo action: ${action.type}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = JSON.parse(readFileSync(insideRoot(args.plan), 'utf8'));
  const demo = plan.productDemo;
  if (!demo || typeof demo !== 'object') throw new Error(`${args.plan} is missing productDemo`);

  const sourceUrl = assertPublicFlyto2Url(demo.url);
  const output = insideRoot(args.out || `video/dist/${plan.id}/shared/product-demo.webm`);
  const posterPath = path.join(path.dirname(output), 'product-demo-poster.png');
  const captureDir = path.join(path.dirname(output), '.capture');
  mkdirSync(captureDir, { recursive: true });

  const channel = process.env.FLYTO2_VIDEO_BROWSER_CHANNEL;
  const browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'dark',
    recordVideo: { dir: captureDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const video = page.video();

  try {
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.addStyleTag({ content: 'html { scroll-behavior: smooth !important; } * { caret-color: transparent !important; }' });
    await dismissConsent(page);
    await page.mouse.move(1090, 120);
    const actions = Array.isArray(demo.actions) && demo.actions.length
      ? demo.actions
      : [{ type: 'wait', durationMs: 1500 }, { type: 'scroll', y: 900, durationMs: 2200 }];
    for (const action of actions) await runAction(page, action);
    await page.screenshot({ path: posterPath, fullPage: false });
  } finally {
    await context.close();
  }

  mkdirSync(path.dirname(output), { recursive: true });
  await video.saveAs(output);
  await browser.close();
  rmSync(captureDir, { recursive: true, force: true });
  writeFileSync(path.join(path.dirname(output), 'product-demo.json'), `${JSON.stringify({
    sourceUrl,
    output: path.relative(root, output),
    poster: path.relative(root, posterPath),
    viewport: { width: 1280, height: 720 },
    actions: demo.actions ?? [],
    capturedAt: new Date().toISOString(),
  }, null, 2)}\n`);
  process.stdout.write(`${path.relative(root, output)}\n`);
}

await main();
