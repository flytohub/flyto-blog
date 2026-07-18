import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlan = 'social/posts/community-growth-open-source-ai-workflow-automation.json';
const legacyBrandPattern = new RegExp(`\\b${['Fly', 'to'].join('')}\\b`);
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

function parseArgs(argv) {
  const args = {
    plan: defaultPlan,
    dryRun: true,
    live: false,
    out: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else if (arg === '--dry-run') {
      args.dryRun = true;
      args.live = false;
    } else if (arg === '--live') {
      args.live = true;
      args.dryRun = false;
    } else if (arg === '--out') args.out = argv[++index] ?? '';
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!args.plan) throw new Error('--plan requires a path');
  return args;
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/social-publish.mjs --plan <plan.json> [--dry-run]
  node scripts/social-publish.mjs --plan <plan.json> --live

Default plan:
  ${defaultPlan}
`);
}

function fail(message) {
  throw new Error(message);
}

function readPlan(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) fail('plan path must stay inside the repository');
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

function assertText(label, value, min, max) {
  if (typeof value !== 'string') fail(`${label} must be a string`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    fail(`${label} length ${normalized.length} outside ${min}-${max}`);
  }
  return normalized;
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

function validatePlan(plan) {
  const id = assertText('id', plan.id, 8, 120);
  if (!/^[a-z0-9][a-z0-9-]+[a-z0-9]$/.test(id)) fail('id must be a kebab-case slug');
  const canonicalUrl = new URL(assertText('canonicalUrl', plan.canonicalUrl, 20, 240));
  if (canonicalUrl.protocol !== 'https:') fail('canonicalUrl must be https');
  if (!allowedHosts.has(canonicalUrl.host)) fail(`canonicalUrl host is not allowed: ${canonicalUrl.host}`);
  const title = assertText('title', plan.title, 20, 110);
  const description = assertText('description', plan.description, 60, 200);
  if (!Array.isArray(plan.tags) || plan.tags.length < 2 || plan.tags.length > 8) {
    fail('tags must contain 2-8 entries');
  }
  for (const tag of plan.tags) assertText('tag', tag, 3, 60);
  if (!plan.channels || typeof plan.channels !== 'object') fail('channels is required');

  assertNoSecrets('plan', plan);
  assertFlyto2Only('plan', plan);

  return { ...plan, id, canonicalUrl: canonicalUrl.toString(), title, description };
}

function enabledChannel(plan, name) {
  const channel = plan.channels[name];
  return channel && channel.enabled !== false ? channel : null;
}

function linkedInDraft(plan, env) {
  const channel = enabledChannel(plan, 'linkedin');
  if (!channel) return null;
  const commentary = assertText('linkedin.commentary', channel.commentary ?? plan.description, 20, 3000);
  const articleTitle = assertText('linkedin.article.title', channel.article?.title ?? plan.title, 20, 200);
  const articleDescription = assertText('linkedin.article.description', channel.article?.description ?? plan.description, 40, 256);
  return {
    channel: 'linkedin',
    endpoint: 'https://api.linkedin.com/rest/posts',
    requiredEnv: ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_AUTHOR_URN'],
    headers: {
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version': env.LINKEDIN_VERSION || '202606',
      'Content-Type': 'application/json',
    },
    body: {
      author: env.LINKEDIN_AUTHOR_URN || '${LINKEDIN_AUTHOR_URN}',
      commentary,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
      content: {
        article: {
          source: plan.canonicalUrl,
          title: articleTitle,
          description: articleDescription,
        },
      },
    },
  };
}

function facebookDraft(plan, env) {
  const channel = enabledChannel(plan, 'facebook');
  if (!channel) return null;
  const pageId = env.META_PAGE_ID || '${META_PAGE_ID}';
  const version = env.META_GRAPH_VERSION || 'v25.0';
  return {
    channel: 'facebook',
    endpoint: `https://graph.facebook.com/${version}/${pageId}/feed`,
    requiredEnv: ['META_PAGE_ID', 'META_PAGE_ACCESS_TOKEN'],
    body: {
      message: assertText('facebook.message', channel.message ?? plan.description, 20, 63206),
      link: plan.canonicalUrl,
    },
  };
}

function manualDrafts(plan) {
  return Object.entries(plan.channels)
    .filter(([name, channel]) => !['linkedin', 'facebook'].includes(name) && channel?.enabled !== false)
    .map(([name, channel]) => ({
      channel: name,
      mode: channel.mode ?? 'manual',
      target: channel.target ?? '',
      message: channel.message ?? plan.description,
      canonicalUrl: plan.canonicalUrl,
    }));
}

function buildDryRun(plan, env = process.env) {
  const drafts = [
    linkedInDraft(plan, env),
    facebookDraft(plan, env),
    ...manualDrafts(plan),
  ].filter(Boolean);
  return {
    mode: 'dry-run',
    generatedAt: new Date().toISOString(),
    plan: {
      id: plan.id,
      canonicalUrl: plan.canonicalUrl,
      title: plan.title,
      tags: plan.tags,
    },
    drafts,
  };
}

function requireEnv(names, env = process.env) {
  const missing = names.filter((name) => !env[name]);
  if (missing.length) fail(`missing environment variable(s): ${missing.join(', ')}`);
}

async function publishLinkedIn(draft, env = process.env) {
  requireEnv(draft.requiredEnv, env);
  const response = await fetch(draft.endpoint, {
    method: 'POST',
    headers: {
      ...draft.headers,
      Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      ...draft.body,
      author: env.LINKEDIN_AUTHOR_URN,
    }),
  });
  const text = await response.text();
  if (!response.ok) fail(`LinkedIn publish failed (${response.status}): ${text}`);
  return {
    channel: 'linkedin',
    status: response.status,
    id: response.headers.get('x-restli-id') ?? '',
  };
}

async function publishFacebook(draft, env = process.env) {
  requireEnv(draft.requiredEnv, env);
  const body = new URLSearchParams({
    message: draft.body.message,
    link: draft.body.link,
    access_token: env.META_PAGE_ACCESS_TOKEN,
  });
  const response = await fetch(draft.endpoint.replace('${META_PAGE_ID}', env.META_PAGE_ID), {
    method: 'POST',
    body,
  });
  const text = await response.text();
  if (!response.ok) fail(`Facebook publish failed (${response.status}): ${text}`);
  return {
    channel: 'facebook',
    status: response.status,
    response: text ? JSON.parse(text) : {},
  };
}

async function publishLive(plan) {
  const dryRun = buildDryRun(plan);
  const results = [];
  for (const draft of dryRun.drafts) {
    if (draft.channel === 'linkedin') results.push(await publishLinkedIn(draft));
    else if (draft.channel === 'facebook') results.push(await publishFacebook(draft));
    else results.push({ channel: draft.channel, mode: 'manual', skipped: true, target: draft.target });
  }
  return {
    mode: 'live',
    generatedAt: new Date().toISOString(),
    plan: dryRun.plan,
    results,
  };
}

function writeOutput(output, outPath) {
  const body = `${JSON.stringify(output, null, 2)}\n`;
  if (!outPath) {
    process.stdout.write(body);
    return;
  }
  const absolutePath = path.resolve(root, outPath);
  if (!absolutePath.startsWith(root)) fail('--out path must stay inside the repository');
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, body);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = validatePlan(readPlan(args.plan));
  const output = args.live ? await publishLive(plan) : buildDryRun(plan);
  writeOutput(output, args.out);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
