import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.resolve(root, process.argv[2] ?? '.external-links.txt');
const ownHosts = new Set(['blog.flyto2.com']);
const skipDirs = new Set(['.git', '.flyto-index', '.pytest_cache', '.vitepress', 'node_modules']);
const links = new Set();

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .flatMap((entry) => {
      if (skipDirs.has(entry)) return [];
      const absolutePath = path.join(dir, entry);
      const stat = statSync(absolutePath);
      return stat.isDirectory() ? walk(absolutePath) : [absolutePath];
    });
}

function cleanUrl(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/[)\].,;:*_]+$/g, '');
}

function stripCodeBlocks(value) {
  return value
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '');
}

function shouldSkipUrl(rawUrl, parsed) {
  if (rawUrl.includes('[[') || rawUrl.includes(']]')) return true;
  if (ownHosts.has(parsed.host)) return true;

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (!host.includes('.')) return true;
  if (host === 'example.com' || host.endsWith('.example.com')) return true;
  if (host === 'unsplash.com' || host.endsWith('.unsplash.com')) return true;

  const pathName = parsed.pathname.toLowerCase();
  if (host === 'api.telegram.org' && pathName.startsWith('/bot')) return true;
  if (host === 'discord.com' && pathName.startsWith('/api/webhooks/')) return true;
  if (host === 'hooks.slack.com' && pathName.startsWith('/services/')) return true;
  if (host === 'notify-api.line.me') return true;

  return false;
}

for (const filePath of walk(root)) {
  if (filePath === outputPath) continue;
  if (!filePath.endsWith('.md') && !filePath.endsWith('.txt')) continue;
  const content = stripCodeBlocks(readFileSync(filePath, 'utf8'));
  for (const match of content.matchAll(/https?:\/\/[^\s<>"'`]+/g)) {
    const url = cleanUrl(match[0]);
    const parsed = new URL(url);
    if (!shouldSkipUrl(url, parsed)) links.add(url);
  }
}

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${[...links].sort().join('\n')}\n`);
console.log(`wrote ${links.size} external links to ${path.relative(root, outputPath)}`);
