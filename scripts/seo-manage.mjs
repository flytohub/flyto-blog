import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seoDir = path.join(root, '.seo');
const reportDir = path.join(seoDir, 'reports');
const postsDir = path.join(root, 'posts');
const scoreReportPath = path.join(reportDir, 'seo-score.json');
const managementJsonPath = path.join(reportDir, 'seo-management.json');
const managementMdPath = path.join(reportDir, 'seo-management.md');
const searchConsoleDir = path.join(seoDir, 'search-console');
const queriesCsvPath = resolveProjectPath(process.env.FLYTO2_GSC_QUERIES_CSV ?? '.seo/search-console/queries.csv');
const pagesCsvPath = resolveProjectPath(process.env.FLYTO2_GSC_PAGES_CSV ?? '.seo/search-console/pages.csv');
const queryPagesCsvPath = resolveProjectPath(process.env.FLYTO2_GSC_QUERY_PAGES_CSV ?? '.seo/search-console/query-pages.csv');
const rankTargetsCsvPath = resolveProjectPath(process.env.FLYTO2_GSC_RANK_TARGETS_CSV ?? '.seo/search-console/rank-targets.csv');
const minManagementScore = Number(process.env.SEO_MANAGEMENT_MIN_SCORE ?? 85);
const keywordMatrixMaxAgeDays = Number(process.env.SEO_KEYWORD_MATRIX_MAX_AGE_DAYS ?? 100);
const requireSearchConsole = String(process.env.SEO_MANAGEMENT_REQUIRE_GSC ?? 'false').toLowerCase() === 'true';
const genericWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'for', 'from', 'guide', 'how',
  'in', 'into', 'is', 'it', 'of', 'on', 'or', 'the', 'to', 'tool', 'tools', 'use',
  'using', 'what', 'when', 'why', 'with', 'workflow', 'workflows',
]);

function resolveProjectPath(value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function maybeRead(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

function normalizeTerm(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return normalizeTerm(value)
    .split(' ')
    .filter((token) => token.length > 2 && !genericWords.has(token));
}

function includesTerm(haystack, term) {
  return normalizeTerm(haystack).includes(normalizeTerm(term));
}

function numberFrom(value) {
  const normalized = String(value ?? '').replace(/[%,$]/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function csvRows(filePath) {
  if (!existsSync(filePath)) return [];
  const records = parseCsv(readFileSync(filePath, 'utf8'));
  if (!records.length) return [];
  const headers = records[0].map(headerKey);
  return records.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      if (!header) return;
      item[header] = row[index] ?? '';
    });
    return normalizeSearchRow(item);
  }).filter((row) => row.query || row.page || row.keyword);
}

function parseCsv(value) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function headerKey(header) {
  const normalized = normalizeTerm(header);
  if (normalized === 'query' || normalized.includes('top queries')) return 'query';
  if (normalized === 'keyword' || normalized.includes('keyword')) return 'keyword';
  if (normalized === 'page' || normalized === 'url' || normalized.includes('top pages')) return 'page';
  if (normalized.includes('click')) return 'clicks';
  if (normalized.includes('impression')) return 'impressions';
  if (normalized === 'ctr' || normalized.includes('click through')) return 'ctr';
  if (normalized.includes('position') && normalized.includes('target')) return 'targetPosition';
  if (normalized.includes('position')) return 'position';
  if (normalized.includes('priority')) return 'priority';
  if (normalized.includes('date')) return 'date';
  return normalized.replace(/\s+/g, '');
}

function normalizeSearchRow(row) {
  const ctrValue = numberFrom(row.ctr);
  return {
    ...row,
    query: row.query ?? row.keyword ?? '',
    keyword: row.keyword ?? row.query ?? '',
    page: row.page ?? '',
    clicks: numberFrom(row.clicks),
    impressions: numberFrom(row.impressions),
    ctr: ctrValue > 1 ? ctrValue / 100 : ctrValue,
    position: numberFrom(row.position),
    targetPosition: numberFrom(row.targetPosition),
    priority: row.priority ?? '',
  };
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
  if (!raw.startsWith('---\n')) return { meta: {}, body: raw };
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { meta: {}, body: raw };
  const meta = {};
  for (const line of raw.slice(4, end).trim().split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) meta[match[1]] = parseYamlValue(match[2]);
  }
  return { meta, body: raw.slice(end + 4) };
}

function stripMarkdown(value) {
  return String(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadPosts() {
  return readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
      const sourcePath = path.join(postsDir, file);
      const raw = readFileSync(sourcePath, 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      const slug = path.basename(file, '.md');
      const urlPath = `/posts/${slug}`;
      return {
        file,
        sourcePath,
        pagePath: `posts/${slug}.html`,
        urlPath,
        canonical: `https://blog.flyto2.com${urlPath}`,
        title: meta.title ?? slug.replace(/-/g, ' '),
        description: meta.description ?? '',
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        text: stripMarkdown(body),
      };
    });
}

function latestKeywordMatrixPath() {
  if (!existsSync(seoDir)) return '';
  const files = readdirSync(seoDir)
    .filter((file) => /^keyword-matrix-.*\.md$/.test(file))
    .map((file) => path.join(seoDir, file))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0] ?? '';
}

function keywordMatrixAge(matrixText, matrixPath) {
  const match = matrixText.match(/^Date:\s*(\d{4}-\d{2}-\d{2})/m);
  const date = match ? new Date(`${match[1]}T00:00:00Z`) : statSync(matrixPath).mtime;
  const ageDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  return { date: date.toISOString().slice(0, 10), ageDays };
}

function matrixTerms(matrixText) {
  const terms = new Set();
  for (const match of matrixText.matchAll(/`([^`]+)`/g)) {
    if (isKeywordCandidate(match[1])) terms.add(match[1]);
  }
  for (const line of matrixText.split('\n')) {
    if (!line.startsWith('|') || line.includes('---')) continue;
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    for (const cell of cells) {
      if (isKeywordCandidate(cell) && /\b(automation|agent|attack|surface|workflow|MCP|CTEM|browser|AI)\b/i.test(cell)) {
        terms.add(cell.replace(/`/g, ''));
      }
    }
  }
  return [...terms].filter((term) => normalizeTerm(term).split(' ').length >= 2);
}

function contractTerms() {
  const manifestPath = path.join(seoDir, 'i18n-seo-manifest.json');
  if (!existsSync(manifestPath)) return [];
  const contract = readJson(manifestPath);
  return (contract.surface?.keywordClusters ?? []).flatMap((cluster) => [
    cluster.primary,
    ...(cluster.longTail ?? []),
  ]).filter(isAsciiTerm);
}

function isAsciiTerm(value) {
  return Boolean(value && /^[\x20-\x7E]+$/.test(value));
}

function isKeywordCandidate(value) {
  const text = String(value ?? '').replace(/`/g, '').trim();
  if (!isAsciiTerm(text)) return false;
  if (/^https?:\/\//i.test(text) || text.startsWith('/') || text.startsWith('.') || text.includes('://')) return false;
  if (text.includes('/') || text.includes('\\')) return false;
  if (/\b[a-z0-9.-]+\.(com|org|io|dev|net)\b/i.test(text)) return false;
  if (/\.(json|md|txt|xml|html|ts|js|mjs|yml|yaml)\b/i.test(text)) return false;
  const normalized = normalizeTerm(text);
  if (normalized.length < 5 || normalized.split(' ').length < 2) return false;
  if (/^\d+(\.\d+)?$/.test(normalized)) return false;
  if (/^(intent|keyword|volume|heat|source|date|scope|locale|strong|medium|high|low)$/i.test(normalized)) return false;
  return true;
}

function uniqueTerms(terms) {
  const byKey = new Map();
  for (const term of terms) {
    const key = normalizeTerm(term);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, term);
  }
  return [...byKey.values()];
}

function scoreOpportunities(scoreReport) {
  return scoreReport.pages
    .filter((page) => page.score < 96 || page.failedChecks.length)
    .sort((a, b) => a.score - b.score)
    .slice(0, 20)
    .map((page) => ({
      page: page.path,
      canonical: page.canonical,
      score: page.score,
      focusKeyword: page.focusKeyword,
      priority: page.score < 90 ? 'high' : page.score < 96 ? 'medium' : 'low',
      actions: page.failedChecks.slice(0, 5).map((check) => check.recommendation || check.name),
    }));
}

function duplicateFocusKeywords(scoreReport) {
  const groups = new Map();
  for (const page of scoreReport.pages) {
    const key = normalizeTerm(page.focusKeyword);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), page]);
  }
  return [...groups.entries()]
    .filter(([, pages]) => pages.length > 1)
    .map(([keyword, pages]) => ({
      keyword,
      pages: pages.map((page) => page.path),
    }));
}

function coverageGaps(terms, scoreReport) {
  const haystack = scoreReport.pages
    .map((page) => `${page.focusKeyword} ${page.title} ${page.description}`)
    .join(' ');
  return terms
    .filter((term) => !includesTerm(haystack, term))
    .slice(0, 30)
    .map((term) => ({
      term,
      action: `Add or refresh a post section that directly answers "${term}".`,
    }));
}

function internalLinkSuggestions(posts, scoreReport) {
  const pageByPath = new Map(scoreReport.pages.map((page) => [page.path, page]));
  const targets = scoreReport.pages
    .filter((page) => page.path !== 'index.html')
    .sort((a, b) => a.score - b.score)
    .slice(0, 16);
  const suggestions = [];

  for (const target of targets) {
    const targetTokens = tokens(`${target.focusKeyword} ${target.title}`).slice(0, 8);
    if (!targetTokens.length) continue;
    const candidates = posts
      .filter((post) => post.pagePath !== target.path && !post.text.includes(target.canonical))
      .map((post) => {
        const overlap = targetTokens.filter((token) => includesTerm(`${post.title} ${post.description} ${post.text}`, token)).length;
        return { post, overlap };
      })
      .filter((candidate) => candidate.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3);

    for (const candidate of candidates) {
      const page = pageByPath.get(candidate.post.pagePath);
      suggestions.push({
        from: candidate.post.urlPath,
        to: target.canonical.replace('https://blog.flyto2.com', ''),
        anchor: target.focusKeyword,
        reason: `Shared topic terms with ${target.path}; source score ${page?.score ?? 'n/a'}, target score ${target.score}.`,
      });
    }
  }

  return suggestions.slice(0, 25);
}

function gscSummary() {
  const queryRows = csvRows(queriesCsvPath);
  const pageRows = csvRows(pagesCsvPath);
  const queryPageRows = csvRows(queryPagesCsvPath);
  const allRows = [...queryRows, ...pageRows, ...queryPageRows];
  const dataConnected = allRows.length > 0;
  const impressions = allRows.reduce((sum, row) => sum + row.impressions, 0);
  const clicks = allRows.reduce((sum, row) => sum + row.clicks, 0);
  const latestDate = allRows.map((row) => row.date).filter(Boolean).sort().at(-1) ?? '';

  return {
    dataConnected,
    files: {
      queries: path.relative(root, queriesCsvPath),
      pages: path.relative(root, pagesCsvPath),
      queryPages: path.relative(root, queryPagesCsvPath),
    },
    rows: {
      queries: queryRows.length,
      pages: pageRows.length,
      queryPages: queryPageRows.length,
    },
    clicks,
    impressions,
    latestDate,
    strikingDistance: queryRows
      .filter((row) => row.query && row.impressions >= 20 && row.position >= 8 && row.position <= 20)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 20),
    lowCtr: queryRows
      .filter((row) => row.query && row.impressions >= 50 && row.ctr > 0 && row.ctr <= 0.015)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 20),
  };
}

function discoverySummary(posts) {
  const files = {
    rss: path.join(root, 'public', 'rss.xml'),
    atom: path.join(root, 'public', 'atom.xml'),
    jsonFeed: path.join(root, 'public', 'feed.json'),
    imageSitemap: path.join(root, 'public', 'image-sitemap.xml'),
    ogImage: path.join(root, 'public', 'og-image.png'),
    manifest: path.join(root, 'public', 'discovery-manifest.json'),
  };
  const exists = Object.fromEntries(Object.entries(files).map(([key, filePath]) => [key, existsSync(filePath)]));
  const manifest = exists.manifest ? readJson(files.manifest) : {};
  return {
    exists,
    allPresent: Object.values(exists).every(Boolean),
    manifestPostCount: manifest.postCount ?? 0,
    latestPostDate: manifest.latestPostDate ?? '',
    expectedPostCount: posts.length,
    files: Object.fromEntries(Object.entries(files).map(([key, filePath]) => [key, path.relative(root, filePath)])),
  };
}

function rankTargets(terms, scoreReport, gsc) {
  const explicitTargets = csvRows(rankTargetsCsvPath)
    .map((row) => ({
      keyword: row.keyword || row.query,
      url: row.page,
      targetPosition: row.targetPosition || 10,
      priority: row.priority || 'medium',
      source: 'rank-targets.csv',
    }))
    .filter((row) => row.keyword);

  const generatedTargets = terms.slice(0, 20).map((term) => {
    const page = bestPageForTerm(term, scoreReport.pages);
    return {
      keyword: term,
      url: page?.canonical ?? '',
      targetPosition: 10,
      priority: keywordPriority(term),
      source: 'keyword matrix',
    };
  });

  const targets = explicitTargets.length ? explicitTargets : generatedTargets;
  const searchRows = [
    ...csvRows(queriesCsvPath),
    ...csvRows(queryPagesCsvPath),
  ];

  return targets.map((target) => {
    const match = searchRows.find((row) => {
      if (!row.query) return false;
      return normalizeTerm(row.query) === normalizeTerm(target.keyword) ||
        includesTerm(row.query, target.keyword) ||
        includesTerm(target.keyword, row.query);
    });
    const position = match?.position ?? 0;
    return {
      ...target,
      currentPosition: position || null,
      clicks: match?.clicks ?? 0,
      impressions: match?.impressions ?? 0,
      status: rankStatus(position, target.targetPosition, gsc.dataConnected),
    };
  });
}

function bestPageForTerm(term, pages) {
  return pages
    .filter((page) => page.path !== 'index.html')
    .map((page) => {
      const text = `${page.focusKeyword} ${page.title} ${page.description}`;
      const overlap = tokens(term).filter((token) => includesTerm(text, token)).length;
      const focusFit = includesTerm(term, page.focusKeyword) || includesTerm(page.focusKeyword, term) ? 8 : 0;
      const titleFit = includesTerm(term, page.title) || includesTerm(page.title, term) ? 4 : 0;
      return { page, score: overlap + focusFit + titleFit };
    })
    .sort((a, b) => b.score - a.score || b.page.score - a.page.score)[0]?.page;
}

function keywordPriority(term) {
  const normalized = normalizeTerm(term);
  if (/open source|ai workflow|attack surface|ctem|automation tools/.test(normalized)) return 'high';
  if (/mcp|browser|workflow/.test(normalized)) return 'medium';
  return 'low';
}

function rankStatus(position, targetPosition, dataConnected) {
  if (!dataConnected) return 'waiting-for-gsc-data';
  if (!position) return 'not-ranking-yet';
  if (position <= targetPosition) return 'on-target';
  if (position <= targetPosition + 5) return 'striking-distance';
  return 'needs-work';
}

function editorRecommendations(scoreReport, gaps, links, gsc) {
  const recommendations = [];
  for (const opportunity of scoreOpportunities(scoreReport).slice(0, 10)) {
    recommendations.push({
      priority: opportunity.priority,
      page: opportunity.page,
      recommendation: opportunity.actions[0] ?? `Refresh intro and internal links around ${opportunity.focusKeyword}.`,
    });
  }
  for (const gap of gaps.slice(0, 8)) {
    recommendations.push({
      priority: 'medium',
      page: '(content queue)',
      recommendation: gap.action,
    });
  }
  for (const link of links.slice(0, 8)) {
    recommendations.push({
      priority: 'low',
      page: link.from,
      recommendation: `Add an internal link to ${link.to} with anchor "${link.anchor}".`,
    });
  }
  for (const row of gsc.strikingDistance.slice(0, 5)) {
    recommendations.push({
      priority: 'high',
      page: row.page || '(query-level)',
      recommendation: `Improve title, intro, and internal links for "${row.query}" at average position ${row.position}.`,
    });
  }
  return recommendations.slice(0, 30);
}

function managementChecks({ scoreReport, matrixInfo, posts, links, ranks, gsc, discovery }) {
  const checks = [];
  addCheck(checks, 'Score report present', 20, scoreReport.pages.length > 0, 'Run npm run seo:score before seo:manage.');
  addCheck(checks, 'Score gate healthy', 20, scoreReport.failures.length === 0, 'Fix failing page scores first.');
  addCheck(checks, 'Keyword matrix fresh', 15, matrixInfo.exists && matrixInfo.ageDays <= keywordMatrixMaxAgeDays, 'Refresh .seo/keyword-matrix evidence.');
  addCheck(checks, 'Posts indexed for editor review', 10, posts.length > 0, 'Add Markdown posts under posts/.');
  addCheck(checks, 'Editor recommendations generated', 10, scoreReport.pages.length > 0, 'Generate page-level recommendations.');
  addCheck(checks, 'Internal link map generated', 10, links.length > 0, 'Add enough related posts to generate internal link suggestions.');
  addCheck(checks, 'Rank target map generated', 10, ranks.length > 0, 'Add keyword matrix or .seo/search-console/rank-targets.csv.');
  addCheck(checks, 'Discovery feeds generated', 10, discovery.allPresent && discovery.manifestPostCount >= posts.length, 'Run npm run seo:discovery before build.');
  addCheck(checks, 'Search Console data policy satisfied', 5, gsc.dataConnected || !requireSearchConsole, 'Export GSC CSV data or set SEO_MANAGEMENT_REQUIRE_GSC=false.');
  return checks;
}

function addCheck(checks, name, points, pass, recommendation) {
  checks.push({ name, points, earned: pass ? points : 0, status: pass ? 'pass' : 'fail', recommendation: pass ? '' : recommendation });
}

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

function tableRows(rows, columns) {
  if (!rows.length) {
    return [
      `| ${columns.map((column) => column.label).join(' | ')} |`,
      `| ${columns.map(() => '---').join(' | ')} |`,
      `| ${columns.map(() => 'none').join(' | ')} |`,
    ].join('\n');
  }
  return [
    `| ${columns.map((column) => column.label).join(' | ')} |`,
    `| ${columns.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${columns.map((column) => escapeCell(column.value(row))).join(' | ')} |`),
  ].join('\n');
}

function writeReports(report) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(managementJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  const failures = report.failures.map((failure) => `- ${failure}`).join('\n') || '- none';
  const gscNote = report.gsc.dataConnected
    ? `Connected with ${report.gsc.rows.queries} query rows, ${report.gsc.rows.pages} page rows, and ${report.gsc.rows.queryPages} query-page rows.`
    : `Not connected. Place Search Console CSV exports in ${path.relative(root, searchConsoleDir)} or set FLYTO2_GSC_* paths.`;

  writeFileSync(managementMdPath, `# Flyto2 SEO Management Report

Generated: ${report.generatedAt}

| Metric | Value |
| --- | --- |
| Management score | ${report.managementScore} |
| Minimum score | ${report.thresholds.management} |
| Score average | ${report.score.averageScore} |
| Score lowest | ${report.score.lowestScore} |
| Pages | ${report.score.pageCount} |
| Search Console | ${gscNote} |
| Keyword matrix age | ${report.keywordMatrix.exists ? `${report.keywordMatrix.ageDays} days` : 'missing'} |
| Discovery files | ${report.discovery.allPresent ? `present for ${report.discovery.manifestPostCount} posts` : 'missing'} |

## Failures

${failures}

## Management Checks

${tableRows(report.checks, [
  { label: 'Status', value: (row) => row.status },
  { label: 'Check', value: (row) => row.name },
  { label: 'Points', value: (row) => `${row.earned}/${row.points}` },
  { label: 'Recommendation', value: (row) => row.recommendation || 'none' },
])}

## Page Opportunities

${tableRows(report.pageOpportunities.slice(0, 15), [
  { label: 'Priority', value: (row) => row.priority },
  { label: 'Score', value: (row) => row.score },
  { label: 'Page', value: (row) => row.page },
  { label: 'Focus keyword', value: (row) => row.focusKeyword },
  { label: 'Next action', value: (row) => row.actions[0] ?? 'none' },
])}

## Rank Targets

${tableRows(report.rankTargets.slice(0, 20), [
  { label: 'Status', value: (row) => row.status },
  { label: 'Priority', value: (row) => row.priority },
  { label: 'Keyword', value: (row) => row.keyword },
  { label: 'URL', value: (row) => row.url || 'needs mapping' },
  { label: 'Position', value: (row) => row.currentPosition ?? 'waiting' },
])}

## Search Console Opportunities

${tableRows(report.gsc.strikingDistance.slice(0, 12), [
  { label: 'Query', value: (row) => row.query },
  { label: 'Position', value: (row) => row.position },
  { label: 'Impressions', value: (row) => row.impressions },
  { label: 'Clicks', value: (row) => row.clicks },
])}

## Low CTR Queries

${tableRows(report.gsc.lowCtr.slice(0, 12), [
  { label: 'Query', value: (row) => row.query },
  { label: 'CTR', value: (row) => `${(row.ctr * 100).toFixed(2)}%` },
  { label: 'Impressions', value: (row) => row.impressions },
  { label: 'Position', value: (row) => row.position },
])}

## Internal Link Suggestions

${tableRows(report.internalLinkSuggestions.slice(0, 20), [
  { label: 'From', value: (row) => row.from },
  { label: 'To', value: (row) => row.to },
  { label: 'Anchor', value: (row) => row.anchor },
  { label: 'Reason', value: (row) => row.reason },
])}

## Editor Recommendations

${tableRows(report.editorRecommendations.slice(0, 20), [
  { label: 'Priority', value: (row) => row.priority },
  { label: 'Page', value: (row) => row.page },
  { label: 'Recommendation', value: (row) => row.recommendation },
])}

## Coverage Gaps

${tableRows(report.coverageGaps.slice(0, 20), [
  { label: 'Term', value: (row) => row.term },
  { label: 'Action', value: (row) => row.action },
])}

## Focus Keyword Cannibalization

${tableRows(report.duplicateFocusKeywords, [
  { label: 'Keyword', value: (row) => row.keyword },
  { label: 'Pages', value: (row) => row.pages.join(', ') },
])}
`);
}

function main() {
  if (!existsSync(scoreReportPath)) {
    throw new Error('missing .seo/reports/seo-score.json; run npm run build && npm run seo:score first');
  }

  const scoreReport = readJson(scoreReportPath);
  const posts = loadPosts();
  const matrixPath = latestKeywordMatrixPath();
  const matrixText = maybeRead(matrixPath);
  const matrixInfo = matrixPath
    ? { exists: true, path: path.relative(root, matrixPath), ...keywordMatrixAge(matrixText, matrixPath) }
    : { exists: false, path: '', date: '', ageDays: Number.POSITIVE_INFINITY };
  const keywordTerms = uniqueTerms([...contractTerms(), ...matrixTerms(matrixText)]);
  const gaps = coverageGaps(keywordTerms, scoreReport);
  const pageOpportunities = scoreOpportunities(scoreReport);
  const duplicateKeywords = duplicateFocusKeywords(scoreReport);
  const links = internalLinkSuggestions(posts, scoreReport);
  const gsc = gscSummary();
  const ranks = rankTargets(keywordTerms, scoreReport, gsc);
  const discovery = discoverySummary(posts);
  const recommendations = editorRecommendations(scoreReport, gaps, links, gsc);
  const checks = managementChecks({ scoreReport, matrixInfo, posts, links, ranks, gsc, discovery });
  const managementScore = Math.round((checks.reduce((sum, check) => sum + check.earned, 0) / checks.reduce((sum, check) => sum + check.points, 0)) * 100);
  const failures = [];
  if (managementScore < minManagementScore) failures.push(`management score ${managementScore} below ${minManagementScore}`);
  if (scoreReport.failures.length) failures.push(...scoreReport.failures.map((failure) => `score gate: ${failure}`));
  if (!matrixInfo.exists) failures.push('keyword matrix missing');
  if (matrixInfo.exists && matrixInfo.ageDays > keywordMatrixMaxAgeDays) {
    failures.push(`keyword matrix age ${matrixInfo.ageDays} days exceeds ${keywordMatrixMaxAgeDays}`);
  }
  if (requireSearchConsole && !gsc.dataConnected) failures.push('Search Console CSV data required but not found');

  const report = {
    generatedAt: new Date().toISOString(),
    thresholds: {
      management: minManagementScore,
      keywordMatrixMaxAgeDays,
      requireSearchConsole,
    },
    managementScore,
    checks,
    failures,
    score: {
      averageScore: scoreReport.averageScore,
      lowestScore: scoreReport.lowestScore,
      pageCount: scoreReport.pageCount,
    },
    keywordMatrix: matrixInfo,
    discovery,
    gsc,
    pageOpportunities,
    coverageGaps: gaps,
    internalLinkSuggestions: links,
    rankTargets: ranks,
    editorRecommendations: recommendations,
    duplicateFocusKeywords: duplicateKeywords,
    inputs: {
      scoreReport: path.relative(root, scoreReportPath),
      queriesCsv: path.relative(root, queriesCsvPath),
      pagesCsv: path.relative(root, pagesCsvPath),
      queryPagesCsv: path.relative(root, queryPagesCsvPath),
      rankTargetsCsv: path.relative(root, rankTargetsCsvPath),
    },
  };

  writeReports(report);

  if (failures.length) {
    console.error('SEO management gate failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    console.error(`See ${path.relative(root, managementMdPath)}`);
    process.exit(1);
  }

  console.log(`SEO management gate passed: score ${managementScore}, recommendations ${recommendations.length}, rank targets ${ranks.length}`);
}

main();
