import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlanDir = 'video/plans';
const failures = [];
const warnings = [];

function parseArgs(argv) {
  const args = { plan: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readPlan(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) throw new Error(`${relativePath} escapes repository root`);
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

function planFiles(args) {
  if (args.plan) return [args.plan];
  const absoluteDir = path.join(root, defaultPlanDir);
  return readdirSync(absoluteDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => path.join(defaultPlanDir, file));
}

function wordCount(value) {
  return String(value).split(/\s+/).filter(Boolean).length;
}

function hasOutput(plan, platform, aspectRatio) {
  return (plan.outputs ?? []).some((output) => output.platform === platform && output.aspectRatio === aspectRatio);
}

function includesAny(value, needles) {
  const lower = String(value).toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

function qaPlan(relativePath) {
  const plan = readPlan(relativePath);
  if (!hasOutput(plan, 'youtube', '16:9')) fail(`${relativePath}: missing YouTube 16:9 output`);
  if (!hasOutput(plan, 'youtube-shorts', '9:16')) fail(`${relativePath}: missing YouTube Shorts 9:16 output`);
  if (!hasOutput(plan, 'linkedin', '1:1')) fail(`${relativePath}: missing LinkedIn 1:1 output`);
  const templates = new Set((plan.scenes ?? []).map((scene) => scene.template));
  for (const template of ['editorial', 'signal', 'proof', 'product-demo', 'terminal', 'community']) {
    if (!templates.has(template)) fail(`${relativePath}: missing ${template} scene template`);
  }

  if (plan.format === 'short' && plan.durationSeconds > 60) {
    fail(`${relativePath}: short videos should stay at or under 60 seconds`);
  }
  if (plan.youtube?.privacyStatus !== 'private' && plan.youtube?.privacyStatus !== 'unlisted') {
    fail(`${relativePath}: YouTube upload must stay private or unlisted before review`);
  }
  if (plan.youtube?.title && plan.youtube.title.length > 100) {
    fail(`${relativePath}: YouTube title exceeds 100 characters`);
  }
  if (!includesAny(plan.youtube?.description, ['canonical post', plan.sourceUrl])) {
    fail(`${relativePath}: YouTube description should point viewers to the canonical post`);
  }

  const primaryKeyword = plan.seo?.primaryKeyword ?? '';
  const longTailKeywords = plan.seo?.longTailKeywords ?? [];
  if (!longTailKeywords.some((keyword) => keyword.includes(primaryKeyword))) {
    warn(`${relativePath}: no long-tail keyword contains the primary keyword verbatim`);
  }
  for (const keyword of longTailKeywords) {
    if (wordCount(keyword) < 3) fail(`${relativePath}: keyword is too broad for long-tail SEO: ${keyword}`);
  }
  if (!(plan.seo?.titleCandidates ?? []).some((title) => includesAny(title, [primaryKeyword, 'Flyto2']))) {
    fail(`${relativePath}: at least one title candidate should include Flyto2 or the primary keyword`);
  }
  if ((plan.seo?.hashtags ?? []).length > 5) {
    warn(`${relativePath}: keep hashtags focused; 3-5 is usually easier to review`);
  }

  for (const [index, thumbnail] of (plan.thumbnails ?? []).entries()) {
    if (thumbnail.headline.length > 44) {
      warn(`${relativePath}: thumbnail ${index + 1} headline may be too dense on mobile`);
    }
    if (!includesAny(`${thumbnail.headline} ${thumbnail.subhead}`, ['Flyto2', primaryKeyword, 'open-source', 'AI'])) {
      warn(`${relativePath}: thumbnail ${index + 1} could anchor more clearly to Flyto2 or the topic`);
    }
  }

  for (const [index, scene] of (plan.scenes ?? []).entries()) {
    if (scene.title.length > 76 && plan.outputs?.some((output) => output.aspectRatio === '9:16')) {
      warn(`${relativePath}: scene ${index + 1} title may wrap heavily in Shorts`);
    }
    if (!scene.narration) warn(`${relativePath}: scene ${index + 1} has no narration draft`);
  }

  if (plan.aiDisclosureRequired === true && !includesAny(plan.youtube?.description, ['synthetic', 'AI-generated', 'AI generated'])) {
    fail(`${relativePath}: AI disclosure is required but not reflected in the YouTube description`);
  }
}

function qaProductionPipeline() {
  const renderer = readFileSync(path.join(root, 'scripts/render-video.mjs'), 'utf8');
  const workflow = readFileSync(path.join(root, '.github/workflows/video-render.yml'), 'utf8');
  for (const token of ['xfade=', 'subtitles=filename=', 'amix=inputs=2', 'loudnorm=', 'renderProductClip', 'generated-ambient']) {
    if (!renderer.includes(token)) fail(`production renderer is missing ${token}`);
  }
  for (const token of ['video:capture', 'video:voiceover', 'video:artifact-qa', 'edge-tts==7.2.8', 'playwright install']) {
    if (!workflow.includes(token)) fail(`video workflow is missing ${token}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = planFiles(args);
  const checkArgs = args.plan ? ['scripts/video-plan-check.mjs', '--plan', args.plan] : ['scripts/video-plan-check.mjs'];
  execFileSync(process.execPath, checkArgs, { cwd: root, stdio: 'inherit' });

  for (const file of files) qaPlan(file);
  qaProductionPipeline();
  if (warnings.length) {
    console.warn('video qa warnings:');
    for (const warning of warnings) console.warn(`- ${warning}`);
  }
  if (failures.length) {
    console.error('video qa failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`video qa passed: ${files.length} plan(s), ${warnings.length} warning(s)`);
}

main();
