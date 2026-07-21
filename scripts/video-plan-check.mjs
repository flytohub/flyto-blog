import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlanDir = 'video/plans';
const brandLogoRelativePath = 'video/assets/flyto2-logo.png';
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
const supportedFormats = new Set(['short', 'explainer', 'tutorial']);
const supportedAspectRatios = new Set(['16:9', '9:16', '1:1']);
const supportedPlatforms = new Set(['youtube', 'youtube-shorts', 'linkedin', 'facebook', 'x', 'web']);
const failures = [];
const legacyBrandPattern = new RegExp(`\\b${['Fly', 'to'].join('')}\\b`);

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

function assertStringArray(label, value, min, max, itemMin, itemMax) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
    return [];
  }
  if (value.length < min || value.length > max) fail(`${label} must contain ${min}-${max} entries`);
  return value.map((item, index) => assertString(`${label} ${index + 1}`, item, itemMin, itemMax));
}

function assertKebabId(label, value) {
  const id = assertString(label, value, 3, 120);
  if (!/^[a-z0-9][a-z0-9-]+[a-z0-9]$/.test(id)) fail(`${label} must be kebab-case`);
  return id;
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
    /AIza[0-9A-Za-z_-]{20,}/,
    /ya29\.[0-9A-Za-z_-]+/,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) fail(`${label} appears to contain a secret-like token: ${pattern}`);
  }
}

function assertFlyto2Only(label, value) {
  const text = JSON.stringify(value);
  if (legacyBrandPattern.test(text)) fail(`${label} contains legacy brand text; use Flyto2`);
  const emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const badEmails = [...new Set(emails.filter((email) => !email.toLowerCase().endsWith('@flyto2.com')))];
  if (badEmails.length) fail(`${label} contains non-flyto2.com email(s): ${badEmails.join(', ')}`);
}

function assertHttpsAllowed(label, value) {
  try {
    const url = new URL(assertString(label, value, 20, 240));
    if (url.protocol !== 'https:') fail(`${label} must use https`);
    if (!allowedHosts.has(url.host)) fail(`${label} host is not allowed: ${url.host}`);
    return url.toString();
  } catch (error) {
    fail(`${label}: invalid URL: ${error.message}`);
    return '';
  }
}

function validateSeo(relativePath, plan) {
  if (!plan.seo || typeof plan.seo !== 'object') {
    fail(`${relativePath}: seo metadata is required`);
    return;
  }
  assertString(`${relativePath}: seo.primaryKeyword`, plan.seo.primaryKeyword, 8, 80);
  const longTailKeywords = assertStringArray(
    `${relativePath}: seo.longTailKeywords`,
    plan.seo.longTailKeywords,
    5,
    12,
    12,
    110,
  );
  for (const keyword of longTailKeywords) {
    if (keyword.split(/\s+/).length < 3) fail(`${relativePath}: long-tail keyword is too broad: ${keyword}`);
  }
  assertStringArray(`${relativePath}: seo.titleCandidates`, plan.seo.titleCandidates, 3, 8, 24, 100);
  const hashtags = assertStringArray(`${relativePath}: seo.hashtags`, plan.seo.hashtags, 3, 8, 4, 32);
  for (const hashtag of hashtags) {
    if (!/^#[A-Za-z0-9]+$/.test(hashtag)) fail(`${relativePath}: invalid hashtag: ${hashtag}`);
  }
}

function validateOutputs(relativePath, plan) {
  if (!Array.isArray(plan.outputs) || plan.outputs.length < 3 || plan.outputs.length > 8) {
    fail(`${relativePath}: outputs must contain 3-8 platform variants`);
    return;
  }
  const ratios = new Set();
  const ids = new Set();
  for (const [index, output] of plan.outputs.entries()) {
    const label = `${relativePath}: output ${index + 1}`;
    const id = assertKebabId(`${label} id`, output.id);
    if (ids.has(id)) fail(`${label}: duplicate output id ${id}`);
    ids.add(id);
    if (!supportedPlatforms.has(output.platform)) fail(`${label}: unsupported platform ${output.platform}`);
    if (!supportedAspectRatios.has(output.aspectRatio)) fail(`${label}: unsupported aspectRatio ${output.aspectRatio}`);
    ratios.add(output.aspectRatio);
    if (!Number.isInteger(output.width) || output.width < 720 || output.width > 3840) fail(`${label}: width must be 720-3840`);
    if (!Number.isInteger(output.height) || output.height < 720 || output.height > 3840) fail(`${label}: height must be 720-3840`);
    assertString(`${label}: label`, output.label, 8, 80);
  }
  for (const requiredRatio of ['16:9', '9:16', '1:1']) {
    if (!ratios.has(requiredRatio)) fail(`${relativePath}: outputs should cover ${requiredRatio}`);
  }
}

function validateThumbnails(relativePath, plan) {
  if (!Array.isArray(plan.thumbnails) || plan.thumbnails.length < 3 || plan.thumbnails.length > 6) {
    fail(`${relativePath}: thumbnails must contain 3-6 candidates`);
    return;
  }
  for (const [index, thumbnail] of plan.thumbnails.entries()) {
    assertString(`${relativePath}: thumbnail ${index + 1} headline`, thumbnail.headline, 8, 56);
    assertString(`${relativePath}: thumbnail ${index + 1} subhead`, thumbnail.subhead, 12, 100);
  }
}

function validatePlan(relativePath) {
  const plan = readJson(relativePath);
  const id = assertKebabId(`${relativePath}: id`, plan.id);

  assertString(`${relativePath}: title`, plan.title, 20, 110);
  assertString(`${relativePath}: description`, plan.description, 60, 220);
  assertHttpsAllowed(`${relativePath}: sourceUrl`, plan.sourceUrl);

  if (!supportedFormats.has(plan.format)) fail(`${relativePath}: unsupported format`);
  if (!supportedAspectRatios.has(plan.aspectRatio)) fail(`${relativePath}: unsupported aspectRatio`);
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
  if (!(plan.assets ?? []).some((asset) => /flyto2.*logo/i.test(asset.name))) {
    fail(`${relativePath}: assets must list the owned Flyto2 logo`);
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
    if (scene.narration !== undefined) assertString(`${relativePath}: scene ${index + 1} narration`, scene.narration, 20, 260);
    if (scene.visualCue !== undefined) assertString(`${relativePath}: scene ${index + 1} visualCue`, scene.visualCue, 8, 120);
  }
  if (sceneDuration !== plan.durationSeconds) {
    fail(`${relativePath}: scene durations total ${sceneDuration}, expected ${plan.durationSeconds}`);
  }

  if (!plan.youtube || typeof plan.youtube !== 'object') fail(`${relativePath}: youtube metadata is required`);
  if (!['private', 'unlisted'].includes(plan.youtube?.privacyStatus)) {
    fail(`${relativePath}: youtube.privacyStatus must stay private or unlisted in source`);
  }
  assertString(`${relativePath}: youtube.description`, plan.youtube?.description, 60, 5000);
  if (!String(plan.youtube?.description ?? '').includes(plan.sourceUrl)) {
    fail(`${relativePath}: youtube.description must include the canonical sourceUrl`);
  }
  if (!Array.isArray(plan.youtube?.tags) || plan.youtube.tags.length < 3 || plan.youtube.tags.length > 15) {
    fail(`${relativePath}: youtube.tags must contain 3-15 tags`);
  }

  validateSeo(relativePath, plan);
  validateOutputs(relativePath, plan);
  validateThumbnails(relativePath, plan);
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
const brandLogoPath = path.join(root, brandLogoRelativePath);
if (!existsSync(brandLogoPath)) {
  fail(`${brandLogoRelativePath} is required`);
} else {
  const signature = readFileSync(brandLogoPath).subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') fail(`${brandLogoRelativePath} must be a PNG file`);
}
for (const file of files) validatePlan(file);

if (failures.length) {
  console.error('video plan audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`video plan audit passed: ${files.length} plan(s)`);
