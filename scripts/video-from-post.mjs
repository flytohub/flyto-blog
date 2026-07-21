import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultDuration = 45;

function parseArgs(argv) {
  const args = {
    post: '',
    out: '',
    force: false,
    format: 'short',
    duration: defaultDuration,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--post') args.post = argv[++index] ?? '';
    else if (arg === '--out') args.out = argv[++index] ?? '';
    else if (arg === '--format') args.format = argv[++index] ?? '';
    else if (arg === '--duration') args.duration = Number(argv[++index] ?? defaultDuration);
    else if (arg === '--force') args.force = true;
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (!args.post && !arg.startsWith('--')) {
      args.post = arg;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (!args.post) throw new Error('missing post path');
  return args;
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/video-from-post.mjs posts/example.md
  node scripts/video-from-post.mjs --post posts/example.md --out video/plans/example.json --force
`);
}

function readInsideRoot(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) throw new Error(`${relativePath} escapes repository root`);
  if (!existsSync(absolutePath)) throw new Error(`${relativePath} does not exist`);
  return { absolutePath, content: readFileSync(absolutePath, 'utf8') };
}

function stripQuotes(value) {
  return value.trim().replace(/^["']|["']$/g, '');
}

function parseYamlValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => stripQuotes(item))
      .filter(Boolean);
  }
  return stripQuotes(trimmed);
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw };
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: raw };
  const block = raw.slice(4, end).trim();
  const data = {};
  for (const line of block.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1]] = parseYamlValue(match[2]);
  }
  return { data, body: raw.slice(end + 4).trim() };
}

function slugFromPostPath(postPath) {
  return path.basename(postPath).replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function markdownToPlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_`|[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clipAtWord(text, max) {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  const clipped = normalized.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  if (lastSpace > Math.floor(max * 0.58)) return clipped.slice(0, lastSpace).trim();
  return clipped.trim();
}

function sectionsFromMarkdown(markdown) {
  const sections = [];
  const parts = markdown.split(/^##\s+/m);
  const intro = markdownToPlainText(parts.shift() ?? '');
  if (intro) sections.push({ heading: 'Why this matters', body: intro });
  for (const part of parts) {
    const [headingLine = '', ...rest] = part.split('\n');
    const heading = headingLine.trim().replace(/[#*`]/g, '');
    const body = markdownToPlainText(rest.join('\n'));
    if (heading && body) sections.push({ heading, body });
  }
  return sections;
}

function sentenceClip(text, max, min = 20) {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  let result = '';
  for (const sentence of sentences) {
    const next = result ? `${result} ${sentence}` : sentence;
    if (next.length > max) break;
    result = next;
  }
  if (!result || result.length < min) result = clipAtWord(normalized, max);
  return result.trim().replace(/\s+[,.;:!?]*$/, '');
}

function distributeDurations(count, total) {
  const base = Math.floor(total / count);
  let remaining = total - base * count;
  return Array.from({ length: count }, () => {
    const extra = remaining > 0 ? 1 : 0;
    remaining -= extra;
    return base + extra;
  });
}

function keywordBase(title, tags) {
  if (/open-source ai workflow automation/i.test(title)) return 'open-source AI workflow automation';
  if (/mcp/i.test(title)) return 'MCP server automation';
  if (/browser|web/i.test(title)) return 'browser workflow automation';
  const normalizedTags = tags.map((tag) => String(tag).replace(/-/g, ' '));
  if (normalizedTags.some((tag) => /ai|agent|automation/i.test(tag))) {
    const tagKeyword = normalizedTags.find((tag) => /ai.*automation|automation.*ai/i.test(tag))
      ?? normalizedTags.find((tag) => /automation|agent|mcp/i.test(tag));
    return tagKeyword ?? 'AI workflow automation';
  }
  if (/security|ctem|attack/i.test(title)) return 'AI security automation';
  return 'open-source AI workflow automation';
}

function makeLongTailKeywords(primaryKeyword, title) {
  const titleStem = title.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  return [
    `${primaryKeyword} for small teams`,
    `open-source ${primaryKeyword} examples`,
    `${primaryKeyword} with replay evidence`,
    `how to evaluate ${primaryKeyword}`,
    `${primaryKeyword} using MCP server workflows`,
    `Flyto2 ${titleStem}`.slice(0, 100),
  ];
}

function makeScenes(title, description, sections, durationSeconds) {
  const selected = [
    { heading: title, body: description },
    ...sections.filter((section) => !/^short answer$/i.test(section.heading)).slice(0, 4),
    { heading: 'Try it with Flyto2', body: 'Start from the canonical article, follow the linked docs, and keep every automation reviewable before sharing it.' },
  ].slice(0, 6);
  const durations = distributeDurations(selected.length, durationSeconds);
  const templates = ['editorial', 'product-demo', 'signal', 'proof', 'signal', 'editorial'];
  return selected.map((section, index) => ({
    durationSeconds: durations[index],
    template: templates[index % templates.length],
    title: sentenceClip(section.heading, 98),
    body: sentenceClip(section.body, 185),
    narration: sentenceClip(`${section.heading}. ${section.body}`, 240),
    visualCue: index === 0 ? 'Show the problem and the exact Flyto2 path.' : 'Use title cards, screenshots, or evidence from the source post.',
  }));
}

function makePlan(args) {
  const { content } = readInsideRoot(args.post);
  const { data, body } = parseFrontmatter(content);
  const slug = slugFromPostPath(args.post);
  const title = data.title || slug.replace(/-/g, ' ');
  const description = data.description || sentenceClip(markdownToPlainText(body), 150);
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const primaryKeyword = keywordBase(title, tags);
  const sourceUrl = `https://blog.flyto2.com/posts/${slug}`;
  const sections = sectionsFromMarkdown(body);

  return {
    id: slug,
    title,
    description: `A review-ready Flyto2 video draft based on the canonical blog post: ${description}`.slice(0, 218),
    sourceUrl,
    format: args.format,
    aspectRatio: '16:9',
    durationSeconds: args.duration,
    humanReviewRequired: true,
    aiDisclosureRequired: true,
    audio: {
      voice: 'en-US-AndrewMultilingualNeural',
      voiceRate: '+10%',
      background: 'generated-ambient',
      backgroundVolume: 0.12,
    },
    productDemo: {
      url: 'https://flyto2.com/cloud/',
      actions: [
        { type: 'wait', durationMs: 1800 },
        { type: 'scroll', y: 760, durationMs: 2200 },
        { type: 'scroll', y: 1520, durationMs: 2200 },
      ],
    },
    seo: {
      primaryKeyword,
      longTailKeywords: makeLongTailKeywords(primaryKeyword, title),
      titleCandidates: [
        title,
        `${primaryKeyword}: a practical Flyto2 walkthrough`,
        `How Flyto2 makes ${primaryKeyword} reviewable`,
      ],
      hashtags: ['#Flyto2', '#AIAutomation', '#OpenSource', '#MCP', '#WorkflowAutomation'],
    },
    outputs: [
      {
        id: 'youtube-landscape',
        platform: 'youtube',
        aspectRatio: '16:9',
        width: 1280,
        height: 720,
        label: 'YouTube 16:9 draft',
      },
      {
        id: 'youtube-shorts',
        platform: 'youtube-shorts',
        aspectRatio: '9:16',
        width: 1080,
        height: 1920,
        label: 'YouTube Shorts 9:16 draft',
      },
      {
        id: 'linkedin-square',
        platform: 'linkedin',
        aspectRatio: '1:1',
        width: 1080,
        height: 1080,
        label: 'LinkedIn square draft',
      },
    ],
    thumbnails: [
      {
        headline: clipAtWord(title, 42),
        subhead: clipAtWord(description, 86),
      },
      {
        headline: clipAtWord(`${primaryKeyword}, with proof`, 42),
        subhead: 'Flyto2 turns one canonical post into video, captions, metadata, and social assets.',
      },
      {
        headline: 'Flyto2 one source, many surfaces',
        subhead: 'Blog, docs, GitHub, package pages, and video stay linked back to the same evidence.',
      },
    ],
    assets: [
      {
        name: 'Flyto2 official logo',
        license: 'owned',
      },
      {
        name: 'Flyto2 generated title cards and thumbnails',
        license: 'owned',
      },
      {
        name: data.cover ? `Flyto2 blog cover asset ${data.cover}` : 'Flyto2 source article text',
        license: 'owned',
      },
    ],
    scenes: makeScenes(title, description, sections, args.duration),
    youtube: {
      privacyStatus: 'private',
      categoryId: '28',
      tags: [
        'Flyto2',
        primaryKeyword,
        'open-source AI workflow automation',
        'MCP server automation',
        'AI agents',
      ],
      description: `${description}\n\nNarration uses a synthetic voice.\n\nCanonical post: ${sourceUrl}`,
    },
  };
}

function outputPath(args) {
  const slug = slugFromPostPath(args.post);
  const relativePath = args.out || `video/plans/${slug}.json`;
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) throw new Error('--out must stay inside the repository');
  return { relativePath, absolutePath };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!Number.isInteger(args.duration) || args.duration < 15 || args.duration > 120) {
    throw new Error('--duration must be an integer from 15 to 120');
  }
  const plan = makePlan(args);
  const { relativePath, absolutePath } = outputPath(args);
  if (existsSync(absolutePath) && !args.force) {
    throw new Error(`${relativePath} already exists; pass --force to overwrite`);
  }
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(plan, null, 2)}\n`);
  process.stdout.write(`${relativePath}\n`);
}

main();
