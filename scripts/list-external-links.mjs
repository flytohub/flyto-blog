import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.resolve(root, process.argv[2] ?? '.external-links.txt');
const ownHosts = new Set(['blog.flyto2.com']);
const skipDirs = new Set(['.git', '.flyto-index', '.vitepress', 'node_modules']);
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
    .replace(/[),.;\]}]+$/g, '')
    .replace(/&amp;/g, '&');
}

for (const filePath of walk(root)) {
  if (!filePath.endsWith('.md') && !filePath.endsWith('.txt')) continue;
  const content = readFileSync(filePath, 'utf8');
  for (const match of content.matchAll(/https?:\/\/[^\s<>"'`]+/g)) {
    const url = cleanUrl(match[0]);
    const parsed = new URL(url);
    if (!ownHosts.has(parsed.host)) links.add(url);
  }
}

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${[...links].sort().join('\n')}\n`);
console.log(`wrote ${links.size} external links to ${path.relative(root, outputPath)}`);
