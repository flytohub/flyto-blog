import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = 'social/posts/community-growth-open-source-ai-workflow-automation.json';
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

const planText = read(planPath);
const scriptText = read('scripts/social-publish.mjs');
const workflowText = read('.github/workflows/social-publish.yml');
read('social/README.md');

if (planText) {
  const plan = JSON.parse(planText);
  if (!plan.canonicalUrl?.startsWith('https://blog.flyto2.com/posts/')) {
    fail('social plan canonicalUrl must point at a Flyto2 blog post');
  }
  for (const channel of ['linkedin', 'facebook', 'github', 'youtube', 'packagePages']) {
    if (!plan.channels?.[channel]?.enabled) fail(`social plan missing enabled channel: ${channel}`);
  }
}

for (const token of [
  'LINKEDIN_ACCESS_TOKEN',
  'LINKEDIN_AUTHOR_URN',
  'META_PAGE_ID',
  'META_PAGE_ACCESS_TOKEN',
  'dry-run',
]) {
  if (!scriptText.includes(token)) fail(`social publisher missing token: ${token}`);
}

if (/access_token:\s*['"][^'$]/.test(scriptText)) {
  fail('social publisher appears to hardcode an access token');
}

for (const token of [
  'workflow_dispatch',
  'schedule:',
  'npm run social:check',
  '--dry-run',
  '--live',
  'LINKEDIN_ACCESS_TOKEN: ${{ secrets.LINKEDIN_ACCESS_TOKEN }}',
  'META_PAGE_ACCESS_TOKEN: ${{ secrets.META_PAGE_ACCESS_TOKEN }}',
  'Live social credentials missing',
]) {
  if (!workflowText.includes(token)) fail(`social publish workflow missing token: ${token}`);
}

if (/access_token:\s*['"][^'$]/i.test(workflowText) || /Bearer\s+[A-Za-z0-9._-]{12,}/.test(workflowText)) {
  fail('social publish workflow appears to hardcode a credential');
}

try {
  const output = execFileSync(process.execPath, [
    'scripts/social-publish.mjs',
    '--plan',
    planPath,
    '--dry-run',
  ], { cwd: root, encoding: 'utf8' });
  const parsed = JSON.parse(output);
  if (parsed.mode !== 'dry-run') fail('dry-run output did not stay in dry-run mode');
  const channels = new Set(parsed.drafts.map((draft) => draft.channel));
  for (const channel of ['linkedin', 'facebook', 'github', 'youtube', 'packagePages']) {
    if (!channels.has(channel)) fail(`dry-run output missing channel: ${channel}`);
  }
  const json = JSON.stringify(parsed);
  if (json.includes('META_PAGE_ACCESS_TOKEN') && json.includes('access_token=')) {
    fail('dry-run output must not include access token request bodies');
  }
} catch (error) {
  fail(`dry-run command failed: ${error.message}`);
}

if (failures.length) {
  console.error('social publisher audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('social publisher audit passed: dry-run, channels, env guards, and no committed tokens');
