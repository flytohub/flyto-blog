import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlanDir = 'video/plans';
const allowedHosts = new Set([
  'blog.flyto2.com',
  'docs.flyto2.com',
  'flyto2.com',
  'github.com',
  'pypi.org',
  'www.npmjs.com',
  'hub.docker.com',
  'www.youtube.com',
  'youtube.com',
]);
const failures = [];

function fail(message) {
  failures.push(message);
}

function parseArgs(argv) {
  const args = { plan: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function readJson(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) throw new Error(`${relativePath} escapes repository root`);
  if (!existsSync(absolutePath)) throw new Error(`${relativePath} does not exist`);
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

function assertString(label, value, min, max) {
  if (typeof value !== 'string') {
    fail(`${label} must be a string`);
    return '';
  }
  const text = value.trim();
  if (text.length < min || text.length > max) fail(`${label} length ${text.length} outside ${min}-${max}`);
  return text;
}

function assertNoSecrets(label, value) {
  const text = JSON.stringify(value);
  const secretPatterns = [
    /access[_-]?token/i,
    /refresh[_-]?token/i,
    /client[_-]?secret/i,
    /app[_-]?secret/i,
    /authorization:\s*bearer/i,
    /password/i,
    /cookie/i,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) fail(`${label} appears to contain a secret-like token: ${pattern}`);
  }
}

function assertFlyto2Only(label, value) {
  const text = JSON.stringify(value);
  if (/\bFlyto\b/.test(text)) fail(`${label} contains standalone Flyto; use Flyto2`);
  const emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const badEmails = [...new Set(emails.filter((email) => !email.toLowerCase().endsWith('@flyto2.com')))];
  if (badEmails.length) fail(`${label} contains non-flyto2.com email(s): ${badEmails.join(', ')}`);
}

function validatePlan(relativePath) {
  const plan = readJson(relativePath);
  const id = assertString(`${relativePath}: id`, plan.id, 8, 120);
  if (!/^[a-z0-9][a-z0-9-]+[a-z0-9]$/.test(id)) fail(`${relativePath}: id must be kebab-case`);

  assertString(`${relativePath}: title`, plan.title, 20, 110);
  assertString(`${relativePath}: description`, plan.description, 60, 220);

  try {
    const sourceUrl = new URL(assertString(`${relativePath}: sourceUrl`, plan.sourceUrl, 20, 240));
    if (sourceUrl.protocol !== 'https:') fail(`${relativePath}: sourceUrl must use https`);
    if (!allowedHosts.has(sourceUrl.host)) fail(`${relativePath}: sourceUrl host is not allowed: ${sourceUrl.host}`);
  } catch (error) {
    fail(`${relativePath}: invalid sourceUrl: ${error.message}`);
  }

  if (!['short', 'explainer', 'tutorial'].includes(plan.format)) fail(`${relativePath}: unsupported format`);
  if (!['16:9', '9:16'].includes(plan.aspectRatio)) fail(`${relativePath}: unsupported aspectRatio`);
  if (!Number.isInteger(plan.durationSeconds) || plan.durationSeconds < 15 || plan.durationSeconds > 600) {
    fail(`${relativePath}: durationSeconds must be an integer from 15 to 600`);
  }
  if (plan.humanReviewRequired !== true) fail(`${relativePath}: humanReviewRequired must be true`);
  if (typeof plan.aiDisclosureRequired !== 'boolean') fail(`${relativePath}: aiDisclosureRequired must be boolean`);

  if (!Array.isArray(plan.assets) || plan.assets.length < 1) fail(`${relativePath}: assets must list owned or licensed inputs`);
  for (const asset of plan.assets ?? []) {
    assertString(`${relativePath}: asset.name`, asset.name, 3, 120);
    if (!['owned', 'open', 'generated', 'licensed'].includes(asset.license)) {
      fail(`${relativePath}: asset license must be owned, open, generated, or licensed`);
    }
  }

  if (!Array.isArray(plan.scenes) || plan.scenes.length < 3 || plan.scenes.length > 12) {
    fail(`${relativePath}: scenes must contain 3-12 entries`);
  }
  let sceneDuration = 0;
  for (const [index, scene] of (plan.scenes ?? []).entries()) {
    if (!Number.isInteger(scene.durationSeconds) || scene.durationSeconds < 3 || scene.durationSeconds > 30) {
      fail(`${relativePath}: scene ${index + 1} durationSeconds must be 3-30`);
    } else {
      sceneDuration += scene.durationSeconds;
    }
    assertString(`${relativePath}: scene ${index + 1} title`, scene.title, 8, 110);
    assertString(`${relativePath}: scene ${index + 1} body`, scene.body, 20, 220);
  }
  if (sceneDuration !== plan.durationSeconds) {
    fail(`${relativePath}: scene durations total ${sceneDuration}, expected ${plan.durationSeconds}`);
  }

  if (!plan.youtube || typeof plan.youtube !== 'object') fail(`${relativePath}: youtube metadata is required`);
  if (!['private', 'unlisted'].includes(plan.youtube?.privacyStatus)) {
    fail(`${relativePath}: youtube.privacyStatus must stay private or unlisted in source`);
  }
  assertString(`${relativePath}: youtube.description`, plan.youtube?.description, 60, 5000);
  if (!Array.isArray(plan.youtube?.tags) || plan.youtube.tags.length < 3 || plan.youtube.tags.length > 15) {
    fail(`${relativePath}: youtube.tags must contain 3-15 tags`);
  }

  assertNoSecrets(relativePath, plan);
  assertFlyto2Only(relativePath, plan);
}

function planFiles(args) {
  if (args.plan) return [args.plan];
  const absoluteDir = path.join(root, defaultPlanDir);
  return readdirSync(absoluteDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => path.join(defaultPlanDir, file));
}

const args = parseArgs(process.argv.slice(2));
const files = planFiles(args);
for (const file of files) validatePlan(file);

if (failures.length) {
  console.error('video plan audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`video plan audit passed: ${files.length} plan(s)`);
