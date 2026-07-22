import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'docs', 'documentation-manifest.json');
const approvedEmails = new Set([
  'admin@flyto2.com', 'alerts@flyto2.com', 'conduct@flyto2.com', 'dev@flyto2.com',
  'dmarc@flyto2.com', 'hello@flyto2.com', 'info@flyto2.com', 'noreply@flyto2.com',
  'oncall@flyto2.com', 'pentest@flyto2.com', 'privacy@flyto2.com', 'reports@flyto2.com',
  'sales@flyto2.com', 'security@flyto2.com', 'support@flyto2.com', 'team@flyto2.com',
]);
const requiredDocs = [
  'AGENTS.md', 'CLAUDE.md', 'PROJECT.md', 'ARCHITECTURE.md', 'STATE.md', 'ROADMAP.md',
  'tasks.md', 'DECISIONS.md', 'CHANGELOG.md', 'README.md', 'SECURITY.md', 'POSTING.md',
  'CONTRIBUTING.md', 'docs/README.md', 'docs/WHITEPAPER.md',
  'docs/documentation-manifest.json', 'handoffs/_registry.md', 'social/README.md', 'video/README.md',
];
const textExtensions = new Set(['.cjs', '.css', '.example', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.mts', '.svg', '.ts', '.tsx', '.txt', '.vue', '.xml', '.yaml', '.yml']);
const sourceExtensions = new Set(['.cjs', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx', '.vue']);

function repositoryFiles() {
  return execFileSync('git', ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function globRegex(pattern) {
  let output = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '*' && pattern[index + 1] === '*') {
      output += '.*';
      index += 1;
    } else if (character === '*') output += '[^/]*';
    else if (character === '?') output += '[^/]';
    else output += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  }
  return new RegExp(`${output}$`);
}

function matches(relativePath, patterns) {
  return patterns.some((pattern) => globRegex(pattern).test(relativePath));
}

function patternHasFile(pattern, files) {
  return files.some((file) => globRegex(pattern).test(file));
}

function shouldOwn(relativePath) {
  if (sourceExtensions.has(path.extname(relativePath))) return true;
  if (/^(?:posts|social|video|public)\//.test(relativePath)) return true;
  if (/^(?:index|tags|POSTING|CONTRIBUTING)\.md$/.test(relativePath)) return true;
  if (/^(?:\.github\/|package(?:-lock)?\.json$|\.env\.example$|lighthouserc\.cjs$|\.seo\/i18n-seo-manifest\.json$)/.test(relativePath)) return true;
  return false;
}

function checkGenerated(errors) {
  const result = spawnSync(process.execPath, ['scripts/generate-documentation-reference.mjs', '--check'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) errors.push(...`${result.stderr}${result.stdout}`.split(/\r?\n/).filter(Boolean));
}

function checkPost(relativePath, files, errors) {
  const parsed = matter(read(relativePath));
  const data = parsed.data;
  if (!/^[a-z0-9][a-z0-9-]+\.md$/.test(path.basename(relativePath))) errors.push(`post filename must be a stable kebab-case slug: ${relativePath}`);
  if (String(data.title ?? '').length < 10 || String(data.title ?? '').length > 110) errors.push(`post title outside 10-110 characters: ${relativePath}`);
  if (String(data.description ?? '').length < 50 || String(data.description ?? '').length > 180) errors.push(`post description outside 50-180 characters: ${relativePath}`);
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push(`post date must be YYYY-MM-DD: ${relativePath}`);
  if (!Array.isArray(data.tags) || data.tags.length < 2 || data.tags.length > 8) errors.push(`post tags must contain 2-8 values: ${relativePath}`);
  if (data.author !== 'Flyto2 Team') errors.push(`post author must be Flyto2 Team: ${relativePath}`);
  const cover = String(data.cover ?? '');
  if (!cover.startsWith('/')) errors.push(`post cover must be root-relative: ${relativePath}`);
  else if (!files.includes(`public/${cover.slice(1)}`)) errors.push(`post cover does not exist: ${relativePath} -> public${cover}`);
  if ((parsed.content.match(/^##\s+/gm) ?? []).length < 3) errors.push(`post needs at least three H2 sections: ${relativePath}`);
}

function main() {
  const errors = [];
  const files = repositoryFiles();
  const fileSet = new Set(files);
  checkGenerated(errors);

  for (const file of requiredDocs) if (!fileSet.has(file)) errors.push(`missing required documentation: ${file}`);

  if (!existsSync(manifestPath)) errors.push('missing docs/documentation-manifest.json');
  else {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const areas = manifest.source_areas ?? [];
    for (const area of areas) {
      if (!area.id || !Array.isArray(area.paths) || !area.paths.length) errors.push(`invalid source area: ${JSON.stringify(area)}`);
      for (const documentPattern of area.documentation ?? []) {
        if (!patternHasFile(documentPattern, files)) errors.push(`documentation target has no file: ${area.id} -> ${documentPattern}`);
      }
    }
    for (const file of files.filter(shouldOwn)) {
      if (!areas.some((area) => matches(file, area.paths ?? []))) errors.push(`maintained file has no documentation owner: ${file}`);
    }
  }

  for (const file of files.filter((entry) => entry.endsWith('.md'))) {
    const content = read(file);
    let frontmatterTitle = '';
    try {
      frontmatterTitle = String(matter(content).data.title ?? '');
    } catch (error) {
      errors.push(`invalid Markdown frontmatter in ${file}: ${error.message}`);
    }
    if (!/^#\s+\S/m.test(content) && !/<h1\b/i.test(content) && !frontmatterTitle) errors.push(`Markdown file has no H1 or frontmatter title: ${file}`);
  }

  const currentDocs = files.filter((file) => file.endsWith('.md') && !file.startsWith('handoffs/'));
  for (const file of currentDocs) {
    const content = read(file);
    if (/\b(?:411|412|417)\+?\s+(?:modules?|模組)/i.test(content)) errors.push(`stale module count in ${file}`);
    if (/\bFlyto\b(?!2)/.test(content)) errors.push(`bare Flyto brand in ${file}`);
  }

  for (const file of ['README.md', 'POSTING.md', 'CONTRIBUTING.md']) {
    if (/posts\/YYYY-MM-DD-slug\.md|posts\/YYYY-MM-DD-your-slug\.md/.test(read(file))) errors.push(`stale dated post filename contract in ${file}`);
  }

  for (const file of files.filter((entry) => entry.startsWith('posts/') && entry.endsWith('.md'))) checkPost(file, files, errors);

  for (const file of files.filter((entry) => entry !== 'package-lock.json' && (textExtensions.has(path.extname(entry)) || path.basename(entry).startsWith('.env')))) {
    const content = read(file);
    for (const match of content.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
      const email = match[0].toLowerCase();
      if (!approvedEmails.has(email)) errors.push(`unapproved email ${email} in ${file}`);
    }
  }

  const packageJson = JSON.parse(read('package.json'));
  if (!packageJson.scripts?.['docs:reference'] || !packageJson.scripts?.['docs:check']) errors.push('package.json must expose docs:reference and docs:check');
  if (!String(packageJson.scripts?.verify ?? '').includes('docs:check')) errors.push('npm run verify must include docs:check');

  if (errors.length) {
    console.error('Blog documentation contract failed:');
    for (const error of [...new Set(errors)].sort()) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`blog documentation contract passed: ${files.filter((file) => file.endsWith('.md')).length} Markdown files, ${files.filter((file) => file.startsWith('posts/') && file.endsWith('.md')).length} posts`);
}

main();
