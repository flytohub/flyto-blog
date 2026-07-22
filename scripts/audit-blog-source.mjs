import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = path.join(root, 'posts');
const publicDir = path.join(root, 'public');
const failures = [];
const legacyBrandPattern = new RegExp(`\\b${['Fly', 'to'].join('')}\\b`, 'g');

const requiredPosts = [
  'ai-browser-automation-guide.md',
  'workflow-automation.md',
  'mcp-server-guide.md',
  'mcp-security-risks-and-controls.md',
  'modules-not-magic.md',
  'attack-surface-management-guide.md',
  'what-is-ctem-continuous-threat-exposure-management.md',
  'what-is-easm-external-attack-surface-management.md',
  'no-code-browser-automation.md',
  'ai-search-visibility-for-technical-products.md',
  'data-workflow-automation-guide.md',
  'zero-person-company-agent-guide.md',
  'intelligence-workflow-automation-guide.md',
  'community-growth-open-source-ai-workflow-automation.md',
];

const requiredKeywordProfiles = new Map([
  ['workflow-automation.md', 'what is AI workflow automation'],
  ['ai-browser-automation-guide.md', 'AI browser automation'],
  ['mcp-server-guide.md', 'MCP server automation'],
  ['mcp-security-risks-and-controls.md', 'MCP security'],
  ['attack-surface-management-guide.md', 'attack surface management'],
  ['what-is-ctem-continuous-threat-exposure-management.md', 'what is CTEM'],
]);

function fail(message) {
  failures.push(message);
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function field(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match ? stripQuotes(match[1]) : '';
}

function checkBrandAndEmails(label, content) {
  if (content.match(legacyBrandPattern)) fail(`${label} contains legacy brand text; use Flyto2 unless referring to repo IDs`);
  const emails = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const badEmails = [...new Set(emails.filter((email) => !email.toLowerCase().endsWith('@flyto2.com')))];
  if (badEmails.length) fail(`${label} contains non-flyto2.com email(s): ${badEmails.join(', ')}`);
}

function checkPost(file) {
  const relativePath = `posts/${file}`;
  const content = readFileSync(path.join(postsDir, file), 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    fail(`${relativePath} missing frontmatter`);
    return;
  }

  const frontmatter = frontmatterMatch[1];
  const title = field(frontmatter, 'title');
  const description = field(frontmatter, 'description');
  const date = field(frontmatter, 'date');
  const tags = field(frontmatter, 'tags');
  const author = field(frontmatter, 'author');
  const cover = field(frontmatter, 'cover');
  const focusKeyword = field(frontmatter, 'focusKeyword');
  const relatedKeywords = field(frontmatter, 'relatedKeywords');

  if (title.length < 10 || title.length > 110) fail(`${relativePath} title length ${title.length} outside 10-110`);
  if (description.length < 50 || description.length > 180) {
    fail(`${relativePath} description length ${description.length} outside 50-180: ${description}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`${relativePath} date must be YYYY-MM-DD`);
  if (!tags.startsWith('[') || !tags.endsWith(']')) fail(`${relativePath} tags must be an inline array`);
  if (author !== 'Flyto2 Team') fail(`${relativePath} author must be Flyto2 Team`);
  if (!cover) {
    fail(`${relativePath} missing cover`);
  } else if (cover.startsWith('/') && !existsSync(path.join(publicDir, cover.slice(1)))) {
    fail(`${relativePath} cover file missing: public${cover}`);
  }

  const expectedFocusKeyword = requiredKeywordProfiles.get(file);
  if (expectedFocusKeyword && focusKeyword !== expectedFocusKeyword) {
    fail(`${relativePath} focusKeyword must be ${expectedFocusKeyword}`);
  }
  if (expectedFocusKeyword) {
    const relatedCount = relatedKeywords
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean).length;
    if (relatedCount < 3) fail(`${relativePath} needs at least three relatedKeywords`);
  }

  checkBrandAndEmails(relativePath, content);
}

if (!existsSync(postsDir)) {
  fail('missing posts directory');
} else {
  const postFiles = readdirSync(postsDir).filter((file) => file.endsWith('.md')).sort();
  if (postFiles.length < 60) fail(`too few blog posts for current content strategy: ${postFiles.length}`);
  for (const file of postFiles) checkPost(file);
  for (const file of requiredPosts) {
    if (!postFiles.includes(file)) fail(`required long-tail post missing: posts/${file}`);
  }
}

if (failures.length) {
  console.error('blog source audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('blog source audit passed: frontmatter, covers, brand, email, and long-tail posts');
