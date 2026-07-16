import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, '.vitepress', 'dist');
const siteHosts = new Set(['blog.flyto2.com']);
const failures = [];
let checkedLinks = 0;

function fail(message) {
  failures.push(message);
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .flatMap((entry) => {
      const absolutePath = path.join(dir, entry);
      const stat = statSync(absolutePath);
      return stat.isDirectory() ? walk(absolutePath) : [absolutePath];
    });
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function splitUrl(url) {
  const [withoutHash, hash = ''] = url.split('#');
  const [pathname] = withoutHash.split('?');
  return { pathname, hash };
}

function isSkippable(url) {
  return !url
    || url.startsWith('#')
    || url.startsWith('//')
    || /^(mailto|tel|javascript|data|blob):/i.test(url);
}

function routeCandidates(publicPath) {
  const normalized = publicPath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!normalized) return [path.join(distDir, 'index.html')];

  const hasExtension = /\.[a-z0-9]+$/i.test(normalized);
  if (hasExtension) return [path.join(distDir, normalized)];

  return [
    path.join(distDir, `${normalized}.html`),
    path.join(distDir, normalized, 'index.html'),
    path.join(distDir, normalized),
  ];
}

function resolvePublicPath(rawUrl, fromFile) {
  if (isSkippable(rawUrl)) return null;

  let url = decodeHtml(rawUrl);
  if (/^https?:\/\//i.test(url)) {
    const parsed = new URL(url);
    if (!siteHosts.has(parsed.host)) return null;
    url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  if (url.startsWith('/')) return splitUrl(url);

  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null;

  const fromRelative = path.relative(distDir, fromFile).split(path.sep).join('/');
  const fromDir = path.posix.dirname(`/${fromRelative}`);
  return splitUrl(path.posix.normalize(path.posix.join(fromDir, url)));
}

function hasAnchor(filePath, hash) {
  if (!hash) return true;
  const id = decodeURIComponent(hash);
  if (!id || id.startsWith(':~:')) return true;
  const html = readFileSync(filePath, 'utf8');
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\bid=["']${escaped}["']`, 'i').test(html);
}

function checkUrl(rawUrl, fromFile) {
  const resolved = resolvePublicPath(rawUrl, fromFile);
  if (!resolved) return;

  checkedLinks += 1;
  const candidates = routeCandidates(resolved.pathname);
  const target = candidates.find((candidate) => existsSync(candidate));
  if (!target) {
    fail(`${path.relative(root, fromFile)} links to missing public path: ${rawUrl}`);
    return;
  }
  if (target.endsWith('.html') && !hasAnchor(target, resolved.hash)) {
    fail(`${path.relative(root, fromFile)} links to missing anchor #${resolved.hash}: ${rawUrl}`);
  }
}

function checkHtmlFile(filePath) {
  const html = readFileSync(filePath, 'utf8');
  for (const tag of html.matchAll(/<(?:a|link|script|img|source|iframe|video|audio)\b[^>]*>/gi)) {
    for (const attr of tag[0].matchAll(/\b(?:href|src|poster)\s*=\s*"([^"]*)"/gi)) {
      checkUrl(attr[1], filePath);
    }
    for (const attr of tag[0].matchAll(/\bsrcset\s*=\s*"([^"]*)"/gi)) {
      for (const part of decodeHtml(attr[1]).split(',')) {
        checkUrl(part.trim().split(/\s+/)[0] ?? '', filePath);
      }
    }
  }
}

if (!existsSync(distDir)) {
  fail('missing .vitepress/dist; run npm run build before npm run check:links');
} else {
  for (const filePath of walk(distDir).filter((file) => file.endsWith('.html'))) {
    checkHtmlFile(filePath);
  }
}

if (failures.length) {
  console.error('blog public link check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`blog public link check passed: ${checkedLinks} internal links`);
