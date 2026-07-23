import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, '.vitepress', 'dist');
const postsDir = path.join(distDir, 'posts');
const seoDir = path.join(root, '.seo');
const seoContractPath = path.join(seoDir, 'i18n-seo-manifest.json');
const expectedSurfaceKey = 'blog';
const seoContract = loadSeoContract();
const siteUrl = seoContract.surface.origin;
const maxKeywordMatrixAgeDays = 100;
const failures = [];
const legacyBrandPattern = new RegExp(`\\b${['Fly', 'to'].join('')}\\b`, 'g');

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
  ['posts/community-growth-open-source-ai-workflow-automation.html', ['open-source AI workflow automation', 'MCP server automation examples']],
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
  '/docs/',
  '/social/',
  '/video/',
  '/workflows/',
  '/handoffs/',
  '/public/blog/',
];
const requiredRobotsTokens = [
  `Sitemap: ${seoContract.surface.sitemap}`,
  'Sitemap: https://blog.flyto2.com/image-sitemap.xml',
  'Sitemap: https://blog.flyto2.com/rss.xml',
  'Sitemap: https://blog.flyto2.com/atom.xml',
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
  'Community Growth',
  'https://github.com/flytohub',
  'https://pypi.org/project/flyto-core/',
  'https://blog.flyto2.com/image-sitemap.xml',
  'https://blog.flyto2.com/rss.xml',
  'https://blog.flyto2.com/atom.xml',
  'https://blog.flyto2.com/feed.json',
  'https://flyto2.com',
  'https://docs.flyto2.com',
];
const requiredKeywordMatrixTokens = [
  'Volume',
  'SD',
  'PD',
  'CPC',
  'Long-Tail Editorial Plan',
  'Evidence Caveats',
  'MCP security',
  'Ubersuggest',
];

function fail(message) {
  failures.push(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function loadSeoContract() {
  if (!existsSync(seoContractPath)) {
    throw new Error('missing .seo/i18n-seo-manifest.json; run npm run seo:sync');
  }

  return JSON.parse(readFileSync(seoContractPath, 'utf8'));
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

function findLink(html, rel, hrefLang = null) {
  const wanted = rel.toLowerCase();
  const wantedLang = hrefLang?.toLowerCase();
  for (const raw of getTags(html, 'link')) {
    const attributes = attrs(raw);
    if ((attributes.rel ?? '').toLowerCase() === wanted) {
      if (wantedLang && (attributes.hreflang ?? '').toLowerCase() !== wantedLang) continue;
      return attributes.href ?? '';
    }
  }
  return '';
}

function findTypedLink(html, rel, type) {
  const wantedRel = rel.toLowerCase();
  const wantedType = type.toLowerCase();
  for (const raw of getTags(html, 'link')) {
    const attributes = attrs(raw);
    if ((attributes.rel ?? '').toLowerCase() === wantedRel && (attributes.type ?? '').toLowerCase() === wantedType) {
      return attributes.href ?? '';
    }
  }
  return '';
}

function jsonLdTypes(html) {
  const types = [];
  const blocks = Array.from(html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi));
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(decodeHtml(block[1]));
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(parsed['@graph'] ?? [])];
      for (const node of nodes) {
        const type = node?.['@type'];
        if (Array.isArray(type)) types.push(...type.map(String));
        else if (type) types.push(String(type));
      }
    } catch {
      types.push('invalid-json-ld');
    }
  }
  return types;
}

function contractKeywordTerms() {
  return seoContract.surface.keywordClusters.flatMap((cluster) => [
    cluster.primary,
    ...cluster.longTail,
  ]);
}

function checkAlternateLinks(label, html) {
  for (const hreflang of [seoContract.locales.en.hreflang, 'x-default']) {
    if (!findLink(html, 'alternate', hreflang)) {
      fail(`${label} missing alternate hreflang=${hreflang}`);
    }
  }
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
  if (content.match(legacyBrandPattern)) fail(`${label} contains legacy brand text; use Flyto2 unless referring to repo IDs`);
  const emails = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const badEmails = [...new Set(emails.filter((email) => !email.toLowerCase().endsWith('@flyto2.com')))];
  if (badEmails.length) fail(`${label} contains non-flyto2.com email(s): ${badEmails.join(', ')}`);
}

function publicAssetPath(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.host !== 'blog.flyto2.com') return '';
    return path.join(distDir, parsed.pathname.replace(/^\/+/, ''));
  } catch {
    return url.startsWith('/') ? path.join(distDir, url.replace(/^\/+/, '')) : '';
  }
}

function checkPublicAsset(label, metaLabel, url) {
  const assetPath = publicAssetPath(url);
  if (assetPath && !existsSync(assetPath)) fail(`${label} ${metaLabel} points to missing public asset: ${url}`);
}

function checkDiscoveryLinks(label, html) {
  for (const [type, expected] of [
    ['application/rss+xml', 'https://blog.flyto2.com/rss.xml'],
    ['application/atom+xml', 'https://blog.flyto2.com/atom.xml'],
    ['application/feed+json', 'https://blog.flyto2.com/feed.json'],
  ]) {
    const href = findTypedLink(html, 'alternate', type);
    if (href !== expected) fail(`${label} missing ${type} discovery link: expected ${expected}, got ${href || '(missing)'}`);
  }
}

function checkMetaBasics(label, html, canonical, { article = false, homepage = false } = {}) {
  const title = titleFrom(html);
  const description = findMeta(html, 'name', 'description');
  const actualCanonical = findLink(html, 'canonical');
  const robots = findMeta(html, 'name', 'robots');
  const ogUrl = findMeta(html, 'property', 'og:url');
  const ogImage = findMeta(html, 'property', 'og:image');
  const twitterImage = findMeta(html, 'name', 'twitter:image');

  checkLength(`${label} title`, title, 10, 110);
  checkLength(`${label} description`, description, 50, 180);
  if (actualCanonical !== canonical) fail(`${label} canonical mismatch: expected ${canonical}, got ${actualCanonical || '(missing)'}`);
  if (!robots.toLowerCase().includes('index')) fail(`${label} robots tag must be indexable; got ${robots || '(missing)'}`);
  if (ogUrl !== canonical) fail(`${label} og:url mismatch: expected ${canonical}, got ${ogUrl || '(missing)'}`);
  checkAlternateLinks(label, html);

  for (const [metaLabel, value] of [
    ['og:title', findMeta(html, 'property', 'og:title')],
    ['og:description', findMeta(html, 'property', 'og:description')],
    ['og:image', ogImage],
    ['og:image:alt', findMeta(html, 'property', 'og:image:alt')],
    ['twitter:card', findMeta(html, 'name', 'twitter:card')],
    ['twitter:title', findMeta(html, 'name', 'twitter:title')],
    ['twitter:description', findMeta(html, 'name', 'twitter:description')],
    ['twitter:image', twitterImage],
    ['twitter:image:alt', findMeta(html, 'name', 'twitter:image:alt')],
  ]) {
    if (!value) fail(`${label} missing ${metaLabel}`);
  }

  checkPublicAsset(label, 'og:image', ogImage);
  checkPublicAsset(label, 'twitter:image', twitterImage);
  checkDiscoveryLinks(label, html);

  const schemaTypes = jsonLdTypes(html);
  if (!schemaTypes.length) fail(`${label} missing JSON-LD`);
  if (schemaTypes.includes('invalid-json-ld')) fail(`${label} has invalid JSON-LD`);
  if (homepage) {
    for (const type of ['Organization', 'WebSite', 'Blog']) {
      if (!schemaTypes.includes(type)) fail(`${label} missing ${type} JSON-LD`);
    }
  }
  if (article) {
    for (const type of ['WebPage', 'BlogPosting', 'BreadcrumbList']) {
      if (!schemaTypes.includes(type)) fail(`${label} missing ${type} JSON-LD`);
    }
  }
  checkBrandAndEmails(label, html);
}

function checkSeoContract() {
  if (seoContract.surfaceKey !== expectedSurfaceKey) {
    fail(`SEO contract surface mismatch: expected ${expectedSurfaceKey}, got ${seoContract.surfaceKey || '(missing)'}`);
  }
  if (seoContract.surface.origin !== 'https://blog.flyto2.com') {
    fail(`SEO contract origin mismatch: ${seoContract.surface.origin || '(missing)'}`);
  }
  if (seoContract.surface.sitemap !== `${seoContract.surface.origin}/sitemap.xml`) {
    fail(`SEO contract sitemap mismatch: ${seoContract.surface.sitemap || '(missing)'}`);
  }

  const requiredSignals = new Set(seoContract.surface.requiredSignals ?? []);
  for (const signal of ['canonical', 'hreflang-alternates', 'x-default', 'sitemap', 'localized-title', 'localized-description', 'structured-data']) {
    if (!requiredSignals.has(signal)) fail(`SEO contract missing required signal: ${signal}`);
  }
  if (Object.keys(seoContract.locales ?? {}).length < 16) {
    fail('SEO contract must expose all 16 Flyto2 locale definitions');
  }
  for (const cluster of seoContract.surface.keywordClusters ?? []) {
    if (!cluster.evidence?.source || !cluster.evidence.observedAt) {
      fail(`SEO contract keyword cluster ${cluster.id} missing evidence`);
    }
    if (!Array.isArray(cluster.longTail) || cluster.longTail.length < 5) {
      fail(`SEO contract keyword cluster ${cluster.id} must include long-tail terms`);
    }
  }

  const upstreamPath = path.resolve(root, '..', 'flyto-i18n', 'dist', 'seo-manifest.json');
  if (existsSync(upstreamPath)) {
    const upstreamText = readFileSync(upstreamPath, 'utf8');
    if (seoContract.source?.sha256 !== sha256(upstreamText)) {
      fail('.seo/i18n-seo-manifest.json is stale; run npm run seo:sync');
    }
  }
}

function checkHomepage() {
  const htmlPath = path.join(distDir, 'index.html');
  if (!existsSync(htmlPath)) {
    fail('homepage build output missing: .vitepress/dist/index.html');
    return;
  }
  const html = readFileSync(htmlPath, 'utf8');
  checkMetaBasics('homepage', html, siteUrl, { homepage: true });
  if (html.includes('<link rel="preload stylesheet"')) {
    fail('homepage contains render-blocking stylesheet requests');
  }
  if ((html.match(/data-flyto2-inline-style=/g) ?? []).length < 2) {
    fail('homepage must inline the VitePress theme and icon stylesheets');
  }
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

function checkDiscoveryFiles(postFiles) {
  const paths = {
    rss: path.join(distDir, 'rss.xml'),
    atom: path.join(distDir, 'atom.xml'),
    jsonFeed: path.join(distDir, 'feed.json'),
    imageSitemap: path.join(distDir, 'image-sitemap.xml'),
    ogImage: path.join(distDir, 'og-image.png'),
    securityTxt: path.join(distDir, '.well-known', 'security.txt'),
  };
  for (const [label, filePath] of Object.entries(paths)) {
    if (!existsSync(filePath)) fail(`missing discovery file: ${label} (${path.relative(distDir, filePath)})`);
  }
  if (!Object.values(paths).every((filePath) => existsSync(filePath))) return;

  const rss = readFileSync(paths.rss, 'utf8');
  const atom = readFileSync(paths.atom, 'utf8');
  const jsonFeed = JSON.parse(readFileSync(paths.jsonFeed, 'utf8'));
  const imageSitemap = readFileSync(paths.imageSitemap, 'utf8');
  const securityTxt = readFileSync(paths.securityTxt, 'utf8');

  if ((rss.match(/<item>/g) ?? []).length < postFiles.length) fail('rss.xml must include every built post');
  if ((atom.match(/<entry>/g) ?? []).length < postFiles.length) fail('atom.xml must include every built post');
  if (!Array.isArray(jsonFeed.items) || jsonFeed.items.length < postFiles.length) fail('feed.json must include every built post');
  if ((imageSitemap.match(/<image:image>/g) ?? []).length < postFiles.length) fail('image-sitemap.xml must include every built post image');

  for (const url of postFiles.map(canonicalFor)) {
    if (!rss.includes(url)) fail(`rss.xml missing ${url}`);
    if (!atom.includes(url)) fail(`atom.xml missing ${url}`);
    if (!imageSitemap.includes(url)) fail(`image-sitemap.xml missing ${url}`);
    if (!jsonFeed.items.some((item) => item.url === url)) fail(`feed.json missing ${url}`);
  }
  for (const token of ['Contact: mailto:security@flyto2.com', 'Canonical: https://blog.flyto2.com/.well-known/security.txt']) {
    if (!securityTxt.includes(token)) fail(`security.txt missing ${token}`);
  }
  checkBrandAndEmails('rss.xml', rss);
  checkBrandAndEmails('atom.xml', atom);
  checkBrandAndEmails('feed.json', JSON.stringify(jsonFeed));
  checkBrandAndEmails('image-sitemap.xml', imageSitemap);
  checkBrandAndEmails('security.txt', securityTxt);
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
  for (const term of contractKeywordTerms().slice(0, 4)) {
    if (!content.toLowerCase().includes(term.toLowerCase())) {
      fail(`${matrix.file} missing manifest keyword term: ${term}`);
    }
  }
  checkBrandAndEmails(matrix.file, content);
}

checkSeoContract();
if (!existsSync(distDir)) {
  fail('missing .vitepress/dist; run npm run build before npm run audit:seo');
} else {
  checkHomepage();
  const postFiles = checkPosts();
  if (existsSync(path.join(distDir, 'sitemap.xml'))) {
    checkSitemapRobotsLlms(postFiles);
    checkDiscoveryFiles(postFiles);
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
