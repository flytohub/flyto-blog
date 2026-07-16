import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, '.vitepress', 'dist');
const postsDir = path.join(distDir, 'posts');
const seoDir = path.join(root, '.seo');
const siteUrl = 'https://blog.flyto2.com';
const maxKeywordMatrixAgeDays = 100;
const failures = [];

const homepageTerms = [
  'AI workflow automation',
  'open source AI agent framework',
  'MCP server automation',
  'no-code browser automation',
  'CTEM',
  'attack surface management',
  'AI search visibility',
];
const requiredPostTerms = new Map([
  ['posts/ai-browser-automation-guide.html', ['AI browser automation']],
  ['posts/workflow-automation.html', ['workflow automation']],
  ['posts/mcp-server-guide.html', ['MCP server']],
  ['posts/modules-not-magic.html', ['registry-backed']],
  ['posts/attack-surface-management-guide.html', ['attack surface management']],
  ['posts/what-is-ctem-continuous-threat-exposure-management.html', ['Continuous Threat Exposure Management']],
  ['posts/what-is-easm-external-attack-surface-management.html', ['external attack surface management']],
  ['posts/no-code-browser-automation.html', ['no code browser automation']],
  ['posts/ai-search-visibility-for-technical-products.html', ['AI search visibility']],
  ['posts/data-workflow-automation-guide.html', ['data workflow automation']],
  ['posts/zero-person-company-agent-guide.html', ['zero-person company']],
  ['posts/intelligence-workflow-automation-guide.html', ['intelligence workflow automation']],
]);
const forbiddenSitemapTokens = [
  '/AGENTS',
  '/ARCHITECTURE',
  '/CLAUDE',
  '/DECISIONS',
  '/PROJECT',
  '/README',
  '/ROADMAP',
  '/SECURITY',
  '/STATE',
  '/tasks',
  '/workflows/',
  '/handoffs/',
  '/public/blog/',
];
const requiredRobotsTokens = [
  'Sitemap: https://blog.flyto2.com/sitemap.xml',
  'User-agent: OAI-SearchBot',
  'User-agent: ChatGPT-User',
  'User-agent: Claude-User',
  'User-agent: PerplexityBot',
  'User-agent: GPTBot',
  'Disallow: /',
];
const requiredLlmsTokens = [
  'AI workflow automation',
  'open-source AI agent frameworks',
  'MCP server automation',
  'attack surface management',
  'AI search visibility',
  'zero-person company agent',
  'data workflow automation',
  'https://flyto2.com',
  'https://docs.flyto2.com',
];
const requiredKeywordMatrixTokens = ['Volume', 'SD', 'PD', 'CPC', 'Long-Tail Editorial Plan', 'Ubersuggest'];

function fail(message) {
  failures.push(message);
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

function getTags(html, tagName) {
  return Array.from(html.matchAll(new RegExp(`<${tagName}\\b([^>]*)>`, 'gi')), (match) => match[1]);
}

function attrs(rawAttrs) {
  const result = {};
  for (const match of rawAttrs.matchAll(/([:@\w-]+)\s*=\s*"([^"]*)"/g)) {
    result[match[1].toLowerCase()] = decodeHtml(match[2]);
  }
  return result;
}

function findMeta(html, key, value) {
  const wanted = value.toLowerCase();
  for (const raw of getTags(html, 'meta')) {
    const attributes = attrs(raw);
    if ((attributes[key] ?? '').toLowerCase() === wanted) {
      return attributes.content ?? '';
    }
  }
  return '';
}

function findLink(html, rel) {
  const wanted = rel.toLowerCase();
  for (const raw of getTags(html, 'link')) {
    const attributes = attrs(raw);
    if ((attributes.rel ?? '').toLowerCase() === wanted) {
      return attributes.href ?? '';
    }
  }
  return '';
}

function titleFrom(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]) : '';
}

function checkLength(label, value, min, max) {
  if (value.length < min || value.length > max) {
    fail(`${label} length ${value.length} outside ${min}-${max}: ${value}`);
  }
}

function canonicalFor(relativeHtmlPath) {
  if (relativeHtmlPath === 'index.html') return siteUrl;
  return `${siteUrl}/${relativeHtmlPath.replace(/\.html$/, '')}`;
}

function sitemapLocVariants(url) {
  return url.endsWith('/') ? [`<loc>${url}</loc>`] : [`<loc>${url}</loc>`, `<loc>${url}/</loc>`];
}

function checkBrandAndEmails(label, content) {
  if (content.match(/\bFlyto\b/g)) fail(`${label} contains standalone "Flyto"; use Flyto2 unless referring to repo IDs`);
  const emails = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const badEmails = [...new Set(emails.filter((email) => !email.toLowerCase().endsWith('@flyto2.com')))];
  if (badEmails.length) fail(`${label} contains non-flyto2.com email(s): ${badEmails.join(', ')}`);
}

function checkMetaBasics(label, html, canonical, { article = false } = {}) {
  const title = titleFrom(html);
  const description = findMeta(html, 'name', 'description');
  const actualCanonical = findLink(html, 'canonical');
  const robots = findMeta(html, 'name', 'robots');
  const ogUrl = findMeta(html, 'property', 'og:url');

  checkLength(`${label} title`, title, 10, 110);
  checkLength(`${label} description`, description, 50, 180);
  if (actualCanonical !== canonical) fail(`${label} canonical mismatch: expected ${canonical}, got ${actualCanonical || '(missing)'}`);
  if (!robots.toLowerCase().includes('index')) fail(`${label} robots tag must be indexable; got ${robots || '(missing)'}`);
  if (ogUrl !== canonical) fail(`${label} og:url mismatch: expected ${canonical}, got ${ogUrl || '(missing)'}`);

  for (const [metaLabel, value] of [
    ['og:title', findMeta(html, 'property', 'og:title')],
    ['og:description', findMeta(html, 'property', 'og:description')],
    ['og:image', findMeta(html, 'property', 'og:image')],
    ['twitter:card', findMeta(html, 'name', 'twitter:card')],
    ['twitter:title', findMeta(html, 'name', 'twitter:title')],
    ['twitter:description', findMeta(html, 'name', 'twitter:description')],
    ['twitter:image', findMeta(html, 'name', 'twitter:image')],
  ]) {
    if (!value) fail(`${label} missing ${metaLabel}`);
  }

  if (!html.includes('application/ld+json')) fail(`${label} missing JSON-LD`);
  if (article && !html.includes('BlogPosting')) fail(`${label} missing BlogPosting JSON-LD`);
  checkBrandAndEmails(label, html);
}

function checkHomepage() {
  const htmlPath = path.join(distDir, 'index.html');
  if (!existsSync(htmlPath)) {
    fail('homepage build output missing: .vitepress/dist/index.html');
    return;
  }
  const html = readFileSync(htmlPath, 'utf8');
  checkMetaBasics('homepage', html, siteUrl);
  for (const term of homepageTerms) {
    if (!html.toLowerCase().includes(term.toLowerCase())) fail(`homepage missing intent term: ${term}`);
  }
}

function checkPosts() {
  if (!existsSync(postsDir)) {
    fail('posts build output missing: .vitepress/dist/posts');
    return [];
  }

  const postFiles = readdirSync(postsDir)
    .filter((file) => file.endsWith('.html'))
    .map((file) => `posts/${file}`)
    .sort();

  if (postFiles.length < 60) fail(`blog has too few built posts for current content strategy: ${postFiles.length}`);

  for (const relativePath of postFiles) {
    const html = readFileSync(path.join(distDir, relativePath), 'utf8');
    checkMetaBasics(relativePath, html, canonicalFor(relativePath), { article: true });

    for (const term of requiredPostTerms.get(relativePath) ?? []) {
      if (!html.toLowerCase().includes(term.toLowerCase())) fail(`${relativePath} missing long-tail intent term: ${term}`);
    }
  }

  for (const requiredPath of requiredPostTerms.keys()) {
    if (!postFiles.includes(requiredPath)) fail(`required long-tail blog post missing from build output: ${requiredPath}`);
  }

  return postFiles;
}

function checkSitemapRobotsLlms(postFiles) {
  const sitemap = readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
  const robots = readFileSync(path.join(distDir, 'robots.txt'), 'utf8');
  const llms = readFileSync(path.join(distDir, 'llms.txt'), 'utf8');
  const full = readFileSync(path.join(distDir, 'llms-full.txt'), 'utf8');

  const locCount = (sitemap.match(/<loc>/g) ?? []).length;
  if (locCount < postFiles.length + 1) fail(`sitemap has too few URLs: ${locCount} for ${postFiles.length} posts plus homepage`);

  const requiredUrls = [siteUrl, ...postFiles.map(canonicalFor)];
  for (const url of requiredUrls) {
    const variants = sitemapLocVariants(url);
    if (!variants.some((token) => sitemap.includes(token))) {
      fail(`sitemap missing ${variants.join(' or ')}`);
    }
  }
  for (const token of forbiddenSitemapTokens) {
    if (sitemap.includes(token)) fail(`sitemap should not include internal memory path token: ${token}`);
  }
  for (const token of requiredRobotsTokens) {
    if (!robots.includes(token)) fail(`robots.txt missing ${token}`);
  }
  for (const token of requiredLlmsTokens) {
    if (!llms.includes(token) && !full.includes(token)) fail(`llms files missing ${token}`);
  }
  checkBrandAndEmails('robots.txt', robots);
  checkBrandAndEmails('llms.txt', llms);
  checkBrandAndEmails('llms-full.txt', full);
}

function newestKeywordMatrix() {
  if (!existsSync(seoDir)) return null;
  return readdirSync(seoDir)
    .filter((file) => /^keyword-matrix-\d{4}-\d{2}-\d{2}\.md$/.test(file))
    .map((file) => ({
      file,
      absolutePath: path.join(seoDir, file),
      date: file.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? '',
    }))
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

function checkKeywordMatrix() {
  const matrix = newestKeywordMatrix();
  if (!matrix) {
    fail('missing .seo/keyword-matrix-YYYY-MM-DD.md');
    return;
  }

  const ageDays = Math.floor((Date.now() - new Date(`${matrix.date}T00:00:00Z`).getTime()) / 86_400_000);
  if (ageDays > maxKeywordMatrixAgeDays) fail(`${matrix.file} is ${ageDays} days old; refresh keyword evidence`);

  const content = readFileSync(matrix.absolutePath, 'utf8');
  const stat = statSync(matrix.absolutePath);
  if (stat.size < 2000) fail(`${matrix.file} is too small to be a useful keyword evidence matrix`);
  for (const token of requiredKeywordMatrixTokens) {
    if (!content.includes(token)) fail(`${matrix.file} missing keyword evidence token: ${token}`);
  }
  checkBrandAndEmails(matrix.file, content);
}

if (!existsSync(distDir)) {
  fail('missing .vitepress/dist; run npm run build before npm run audit:seo');
} else {
  checkHomepage();
  const postFiles = checkPosts();
  if (existsSync(path.join(distDir, 'sitemap.xml'))) {
    checkSitemapRobotsLlms(postFiles);
  } else {
    fail('missing built sitemap.xml; run npm run build before npm run audit:seo');
  }
}
checkKeywordMatrix();

if (failures.length) {
  console.error('blog SEO surface audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('blog SEO surface audit passed: homepage, all posts, sitemap, robots, llms, keyword matrix');
