import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, '.vitepress', 'dist');
const postsDistDir = path.join(distDir, 'posts');
const postsSourceDir = path.join(root, 'posts');
const seoDir = path.join(root, '.seo');
const reportDir = path.join(seoDir, 'reports');
const seoContractPath = path.join(seoDir, 'i18n-seo-manifest.json');
const siteUrl = 'https://blog.flyto2.com';
const pageThreshold = Number(process.env.SEO_PAGE_SCORE_THRESHOLD ?? 82);
const averageThreshold = Number(process.env.SEO_AVERAGE_SCORE_THRESHOLD ?? 88);
const homepageThreshold = Number(process.env.SEO_HOMEPAGE_SCORE_THRESHOLD ?? 88);
const legacyBrandPattern = new RegExp(`\\b${['Fly', 'to'].join('')}\\b`);

const focusKeywordOverrides = new Map([
  ['posts/ai-browser-automation-guide.html', 'AI browser automation'],
  ['posts/workflow-automation.html', 'workflow automation'],
  ['posts/mcp-server-guide.html', 'MCP server automation'],
  ['posts/modules-not-magic.html', 'AI automation modules'],
  ['posts/attack-surface-management-guide.html', 'attack surface management'],
  ['posts/what-is-ctem-continuous-threat-exposure-management.html', 'Continuous Threat Exposure Management'],
  ['posts/what-is-easm-external-attack-surface-management.html', 'external attack surface management'],
  ['posts/no-code-browser-automation.html', 'no-code browser automation'],
  ['posts/ai-search-visibility-for-technical-products.html', 'AI search visibility'],
  ['posts/data-workflow-automation-guide.html', 'data workflow automation'],
  ['posts/zero-person-company-agent-guide.html', 'zero-person company agent'],
  ['posts/intelligence-workflow-automation-guide.html', 'intelligence workflow automation'],
  ['posts/community-growth-open-source-ai-workflow-automation.html', 'open-source AI workflow automation'],
]);

const homepageFocusTerms = [
  'AI workflow automation',
  'open-source AI agent frameworks',
  'MCP server automation',
  'no-code browser automation',
  'AI search visibility',
];

function decodeHtml(value) {
  return String(value)
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
    if ((attributes[key] ?? '').toLowerCase() === wanted) return attributes.content ?? '';
  }
  return '';
}

function findLink(html, rel, hrefLang = null) {
  const wanted = rel.toLowerCase();
  const wantedLang = hrefLang?.toLowerCase();
  for (const raw of getTags(html, 'link')) {
    const attributes = attrs(raw);
    if ((attributes.rel ?? '').toLowerCase() !== wanted) continue;
    if (wantedLang && (attributes.hreflang ?? '').toLowerCase() !== wantedLang) continue;
    return attributes.href ?? '';
  }
  return '';
}

function titleFrom(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]) : '';
}

function textFromTag(html, tagName) {
  return Array.from(html.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi')), (match) => {
    return stripHtml(match[1]);
  });
}

function stripHtml(html) {
  return decodeHtml(String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' '));
}

function visibleText(html) {
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return stripHtml(bodyMatch ? bodyMatch[1] : html);
}

function wordList(text) {
  return String(text).toLowerCase().match(/[a-z0-9]+(?:[-'][a-z0-9]+)*/g) ?? [];
}

function wordCount(text) {
  return wordList(text).length;
}

function normalizeTerm(value) {
  return String(value).toLowerCase().replace(/[-_]+/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function includesTerm(haystack, term) {
  return normalizeTerm(haystack).includes(normalizeTerm(term));
}

function parseYamlValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return trimmed.replace(/^["']|["']$/g, '');
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return {};
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return {};
  const data = {};
  for (const line of raw.slice(4, end).trim().split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) data[match[1]] = parseYamlValue(match[2]);
  }
  return data;
}

function sourceForPage(relativePath) {
  if (relativePath === 'index.html') return path.join(root, 'index.md');
  const slug = path.basename(relativePath, '.html');
  return path.join(postsSourceDir, `${slug}.md`);
}

function sourceMeta(relativePath) {
  const sourcePath = sourceForPage(relativePath);
  if (!existsSync(sourcePath)) return {};
  return parseFrontmatter(readFileSync(sourcePath, 'utf8'));
}

function contractKeywordTerms() {
  if (!existsSync(seoContractPath)) return [];
  const contract = JSON.parse(readFileSync(seoContractPath, 'utf8'));
  return (contract.surface?.keywordClusters ?? []).flatMap((cluster) => [
    cluster.primary,
    ...(cluster.longTail ?? []),
  ]).filter((term) => term && /^[\x20-\x7E]+$/.test(term));
}

function inferFocusKeyword(relativePath, meta, html) {
  if (relativePath === 'index.html') return homepageFocusTerms[0];
  if (focusKeywordOverrides.has(relativePath)) return focusKeywordOverrides.get(relativePath);

  const titleKeyword = inferTitleKeyword(meta.title);
  if (titleKeyword) return titleKeyword;

  const text = `${meta.title ?? ''} ${meta.description ?? ''} ${visibleText(html)}`;
  const contractMatch = contractKeywordTerms().find((term) => includesTerm(text, term));
  if (contractMatch) return contractMatch;

  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const usefulTag = tags.find((tag) => /automation|security|mcp|agent|browser|workflow|ai/i.test(tag));
  if (usefulTag) return String(usefulTag).replace(/-/g, ' ');

  return path.basename(relativePath, '.html').replace(/-/g, ' ');
}

function inferTitleKeyword(title) {
  const text = String(title ?? '').trim();
  if (!text) return '';
  const whatMatch = text.match(/^what is an?\s+([^?:]+)[?:]?/i);
  if (whatMatch) return cleanupKeyword(whatMatch[1]);
  const howToMatch = text.match(/^how to\s+([^?:]+)[?:]?/i);
  if (howToMatch) return cleanupKeyword(howToMatch[1]);
  const firstSegment = text.split(/:|\u2014|\u2013/)[0];
  return cleanupKeyword(firstSegment);
}

function cleanupKeyword(value) {
  return String(value)
    .replace(/\bwith\b.*$/i, '')
    .replace(/\bfor\b.*$/i, '')
    .replace(/\ba practical\b.*$/i, '')
    .replace(/\bcomplete guide\b.*$/i, '')
    .replace(/\bguide\b.*$/i, '')
    .replace(/\bFlyto2\b/g, '')
    .replace(/&/g, ' ')
    .replace(/[^A-Za-z0-9 +./-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function relatedTerms(relativePath, focusKeyword, meta) {
  const terms = new Set([focusKeyword]);
  for (const term of contractKeywordTerms()) {
    if (includesTerm(term, focusKeyword) || includesTerm(focusKeyword, term)) terms.add(term);
  }
  if (focusKeywordOverrides.has(relativePath)) terms.add(focusKeywordOverrides.get(relativePath));
  for (const tag of Array.isArray(meta.tags) ? meta.tags : []) terms.add(String(tag).replace(/-/g, ' '));
  return [...terms].filter((term) => normalizeTerm(term).length > 2).slice(0, 10);
}

function canonicalFor(relativePath) {
  if (relativePath === 'index.html') return siteUrl;
  return `${siteUrl}/${relativePath.replace(/\.html$/, '')}`;
}

function sitemapSet() {
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  if (!existsSync(sitemapPath)) return new Set();
  const sitemap = readFileSync(sitemapPath, 'utf8');
  return new Set(Array.from(sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g), (match) => decodeHtml(match[1]).replace(/\/$/, '')));
}

function linkStats(html) {
  const links = getTags(html, 'a').map(attrs).map((attributes) => attributes.href).filter(Boolean);
  const internal = links.filter((href) => href.startsWith('/') || href.startsWith(siteUrl));
  const external = links.filter((href) => /^https?:\/\//.test(href) && !href.startsWith(siteUrl));
  return { total: links.length, internal: internal.length, external: external.length };
}

function imageStats(html) {
  const images = getTags(html, 'img')
    .map(attrs)
    .filter((image) => !String(image.class ?? '').includes('logo'));
  const missingAlt = images.filter((image) => !image.alt || image.alt.trim().length < 3);
  return { total: images.length, missingAlt: missingAlt.length };
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
        if (Array.isArray(type)) types.push(...type);
        else if (type) types.push(type);
      }
    } catch {
      types.push('invalid-json-ld');
    }
  }
  return types;
}

function scoreItem(items, category, name, points, pass, recommendation, details = {}) {
  items.push({
    category,
    name,
    points,
    earned: pass ? points : 0,
    status: pass ? 'pass' : 'fail',
    recommendation: pass ? '' : recommendation,
    details,
  });
}

function scoreRange(items, category, name, points, value, min, max, recommendation) {
  scoreItem(items, category, name, points, value >= min && value <= max, recommendation, { value, min, max });
}

function keywordDensity(text, term) {
  const words = wordList(text);
  if (!words.length) return 0;
  const normalizedTerm = normalizeTerm(term);
  const normalizedText = normalizeTerm(text);
  const matches = normalizedText.split(normalizedTerm).length - 1;
  return Number(((matches / words.length) * 100).toFixed(2));
}

function scorePage(relativePath, html, sitemapUrls) {
  const meta = sourceMeta(relativePath);
  const title = titleFrom(html);
  const description = findMeta(html, 'name', 'description');
  const canonical = findLink(html, 'canonical');
  const robots = findMeta(html, 'name', 'robots');
  const h1s = textFromTag(html, 'h1');
  const h2s = textFromTag(html, 'h2');
  const text = visibleText(html);
  const wc = wordCount(text);
  const focusKeyword = inferFocusKeyword(relativePath, meta, html);
  const terms = relatedTerms(relativePath, focusKeyword, meta);
  const firstParagraph = text.slice(0, Math.max(450, Math.floor(text.length * 0.14)));
  const links = linkStats(html);
  const images = imageStats(html);
  const schemaTypes = jsonLdTypes(html);
  const expectedCanonical = canonicalFor(relativePath);
  const sitemapUrl = expectedCanonical.replace(/\/$/, '');
  const isPost = relativePath.startsWith('posts/');
  const isHomepage = relativePath === 'index.html';
  const items = [];

  scoreRange(items, 'technical', 'SEO title length', 5, title.length, isHomepage ? 20 : 30, 110, 'Set a clear title between 30 and 110 characters.');
  scoreRange(items, 'technical', 'Meta description length', 5, description.length, 50, 180, 'Set a meta description between 50 and 180 characters.');
  scoreItem(items, 'technical', 'Canonical URL', 5, canonical === expectedCanonical, `Expected canonical ${expectedCanonical}.`, { canonical });
  scoreItem(items, 'technical', 'Robots indexable', 3, robots.toLowerCase().includes('index'), 'Use an indexable robots meta tag.', { robots });
  scoreItem(items, 'technical', 'OpenGraph complete', 4, ['og:title', 'og:description', 'og:image', 'og:url'].every((name) => findMeta(html, 'property', name)), 'Add complete OpenGraph metadata.');
  scoreItem(items, 'technical', 'Twitter card complete', 3, ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'].every((name) => findMeta(html, 'name', name)), 'Add complete Twitter card metadata.');
  scoreItem(items, 'technical', 'JSON-LD present', 4, schemaTypes.length > 0 && !schemaTypes.includes('invalid-json-ld'), 'Add valid JSON-LD structured data.', { schemaTypes });
  scoreItem(items, 'technical', 'Article schema for posts', 3, !isPost || schemaTypes.includes('BlogPosting'), 'Use BlogPosting schema for posts.', { schemaTypes });
  scoreItem(items, 'technical', 'Hreflang alternates', 3, Boolean(findLink(html, 'alternate', 'en') && findLink(html, 'alternate', 'x-default')), 'Add en and x-default hreflang links.');
  scoreItem(items, 'technical', 'Sitemap inclusion', 3, sitemapUrls.has(sitemapUrl), 'Include the canonical URL in sitemap.xml.', { sitemapUrl });

  scoreItem(items, 'keyword', 'Focus keyword in title', 5, includesTerm(title, focusKeyword), `Use focus keyword in the SEO title: ${focusKeyword}.`);
  scoreItem(items, 'keyword', 'Focus keyword in description', 5, includesTerm(description, focusKeyword), `Use focus keyword in meta description: ${focusKeyword}.`);
  scoreItem(items, 'keyword', 'Focus keyword in H1', 4, h1s.some((h1) => includesTerm(h1, focusKeyword)), `Use focus keyword in the H1: ${focusKeyword}.`, { h1s });
  scoreItem(items, 'keyword', 'Focus keyword in intro', 4, includesTerm(firstParagraph, focusKeyword), `Mention focus keyword early in the page: ${focusKeyword}.`);
  if (isHomepage) {
    scoreItem(items, 'keyword', 'Focus keyword density', 3, includesTerm(text, focusKeyword), `Mention homepage focus keyword in body copy: ${focusKeyword}.`);
    scoreItem(items, 'keyword', 'Related long-tail terms', 4, homepageFocusTerms.filter((term) => includesTerm(text, term)).length >= 3, 'Include homepage topic cluster terms.', { terms: homepageFocusTerms });
  } else {
    scoreRange(items, 'keyword', 'Focus keyword density', 3, keywordDensity(text, focusKeyword), 0.08, 4.5, 'Keep focus keyword density natural but visible.');
    scoreItem(items, 'keyword', 'Related long-tail terms', 4, terms.filter((term) => includesTerm(text, term)).length >= Math.min(3, terms.length), 'Include related long-tail terms from the keyword matrix.', { terms });
  }

  scoreItem(items, 'content', 'Word count', 4, isHomepage ? wc >= 350 : wc >= 500, 'Add enough useful body copy for the search intent.', { wordCount: wc });
  scoreItem(items, 'content', 'Heading structure', 4, h1s.length === 1 && h2s.length >= (isHomepage ? 1 : isPost ? 3 : 2), 'Use exactly one H1 and enough H2 sections for scanability.', { h1s: h1s.length, h2s: h2s.length });
  scoreItem(items, 'content', 'Readable paragraphs', 4, isHomepage || averageParagraphWords(html) <= 95, 'Break long paragraphs into smaller sections.', { averageParagraphWords: averageParagraphWords(html) });
  scoreItem(items, 'content', 'Answer-shaped sections', 4, hasAnswerIntent(h2s, text), 'Add sections that answer what/how/why/when/bottom-line style queries.');
  scoreItem(items, 'content', 'Fresh publication metadata', 4, !isPost || Boolean(meta.date && meta.author), 'Keep post date and author in frontmatter.', { date: meta.date, author: meta.author });

  scoreItem(items, 'links_images', 'Internal links', 4, links.internal >= (isPost ? 2 : 6), 'Add relevant internal links to docs, related posts, or product pages.', links);
  scoreItem(items, 'links_images', 'External authority links', 3, !isPost || links.external >= 1, 'Add at least one useful external authority link when the topic benefits from evidence.', links);
  scoreItem(items, 'links_images', 'Image alt text', 4, images.missingAlt === 0, 'Add descriptive alt text to every image.', images);
  scoreItem(items, 'links_images', 'Social image present', 4, Boolean(findMeta(html, 'property', 'og:image') && findMeta(html, 'name', 'twitter:image')), 'Add share image metadata.');

  scoreItem(items, 'ai_visibility', 'LLM-friendly entity clarity', 4, includesTerm(text, 'Flyto2') && includesTerm(text, focusKeyword), 'Make the entity and topic explicit in body copy.');
  scoreItem(items, 'ai_visibility', 'Canonical evidence path', 3, includesTerm(text, 'docs') || includesTerm(text, 'GitHub') || includesTerm(text, 'source'), 'Point readers and AI systems to durable evidence: docs, GitHub, source, or canonical pages.');
  scoreItem(items, 'ai_visibility', 'No legacy brand text', 4, !legacyBrandPattern.test(html), 'Use Flyto2 consistently across source and rendered HTML.');
  scoreItem(items, 'ai_visibility', 'Flyto2 email hygiene', 4, noBadEmails(html), 'Use only @flyto2.com email addresses in public content.');

  const earned = items.reduce((sum, item) => sum + item.earned, 0);
  const possible = items.reduce((sum, item) => sum + item.points, 0);
  const score = Math.round((earned / possible) * 100);
  const failed = items.filter((item) => item.status === 'fail');
  const categoryScores = Object.fromEntries([...new Set(items.map((item) => item.category))].map((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    const categoryEarned = categoryItems.reduce((sum, item) => sum + item.earned, 0);
    const categoryPossible = categoryItems.reduce((sum, item) => sum + item.points, 0);
    return [category, Math.round((categoryEarned / categoryPossible) * 100)];
  }));

  return {
    path: relativePath,
    canonical: expectedCanonical,
    focusKeyword,
    score,
    categoryScores,
    title,
    description,
    wordCount: wc,
    internalLinks: links.internal,
    externalLinks: links.external,
    images: images.total,
    failedChecks: failed.map((item) => ({
      category: item.category,
      name: item.name,
      points: item.points,
      recommendation: item.recommendation,
      details: item.details,
    })),
  };
}

function averageParagraphWords(html) {
  const paragraphs = textFromTag(html, 'p').filter((paragraph) => wordCount(paragraph) > 0);
  if (!paragraphs.length) return 0;
  const average = paragraphs.reduce((sum, paragraph) => sum + wordCount(paragraph), 0) / paragraphs.length;
  return Number(average.toFixed(1));
}

function hasAnswerIntent(h2s, text) {
  const headings = h2s.join(' ');
  return /what|how|why|when|where|checklist|bottom line|examples|guide|start|matters/i.test(`${headings} ${text.slice(0, 800)}`);
}

function noBadEmails(html) {
  const emails = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return emails.every((email) => email.toLowerCase().endsWith('@flyto2.com'));
}

function pageFiles() {
  if (!existsSync(distDir)) throw new Error('missing .vitepress/dist; run npm run build first');
  const files = ['index.html'];
  if (existsSync(postsDistDir)) {
    files.push(...readdirSync(postsDistDir).filter((file) => file.endsWith('.html')).sort().map((file) => `posts/${file}`));
  }
  return files;
}

function writeReports(report) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(path.join(reportDir, 'seo-score.json'), `${JSON.stringify(report, null, 2)}\n`);
  const rows = report.pages
    .slice()
    .sort((a, b) => a.score - b.score)
    .map((page) => `| ${page.score} | ${page.path} | ${page.focusKeyword} | ${page.failedChecks.slice(0, 3).map((check) => check.name).join('; ') || 'none'} |`)
    .join('\n');
  const failures = report.failures
    .map((failure) => `- ${failure}`)
    .join('\n') || '- none';
  writeFileSync(path.join(reportDir, 'seo-score.md'), `# Flyto2 SEO Score Report

Generated: ${report.generatedAt}

| Metric | Value |
| --- | --- |
| Pages | ${report.pageCount} |
| Average score | ${report.averageScore} |
| Lowest score | ${report.lowestScore} |
| Page threshold | ${report.thresholds.page} |
| Homepage threshold | ${report.thresholds.homepage} |
| Average threshold | ${report.thresholds.average} |

## Failures

${failures}

## Lowest Pages

| Score | Page | Focus keyword | Top issues |
| --- | --- | --- | --- |
${rows}
`);
}

function main() {
  const sitemapUrls = sitemapSet();
  const pages = pageFiles().map((relativePath) => {
    const html = readFileSync(path.join(distDir, relativePath), 'utf8');
    return scorePage(relativePath, html, sitemapUrls);
  });
  const averageScore = Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length);
  const lowestScore = Math.min(...pages.map((page) => page.score));
  const failures = [];
  for (const page of pages) {
    const threshold = page.path === 'index.html' ? homepageThreshold : pageThreshold;
    if (page.score < threshold) failures.push(`${page.path} scored ${page.score}, below ${threshold}`);
  }
  if (averageScore < averageThreshold) failures.push(`average score ${averageScore} below ${averageThreshold}`);

  const report = {
    generatedAt: new Date().toISOString(),
    thresholds: {
      page: pageThreshold,
      homepage: homepageThreshold,
      average: averageThreshold,
    },
    pageCount: pages.length,
    averageScore,
    lowestScore,
    failures,
    pages,
    referenceModel: {
      name: 'Rank Math-style CI scorer',
      categories: ['technical', 'keyword', 'content', 'links_images', 'ai_visibility'],
      source: 'Built from Flyto2 static output plus Markdown frontmatter; no external API calls.',
    },
  };

  writeReports(report);

  if (failures.length) {
    console.error('SEO score gate failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    console.error(`See ${path.relative(root, path.join(reportDir, 'seo-score.md'))}`);
    process.exit(1);
  }

  console.log(`SEO score gate passed: average ${averageScore}, lowest ${lowestScore}, pages ${pages.length}`);
}

main();
