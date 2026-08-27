import { deflateSync, inflateSync } from 'node:zlib';
import { createHash, randomBytes } from 'node:crypto';
import { closeSync, constants, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = path.join(root, 'posts');
const publicDir = path.join(root, 'public');
const siteUrl = 'https://blog.flyto2.com';
const siteTitle = 'Flyto2 Blog';
const siteDescription = 'Plain-language guides for AI workflow automation, MCP server automation, CTEM, browser automation, and open-source AI agent workflows.';
const feedAuthor = { name: 'Flyto2 Team', email: 'team@flyto2.com', url: 'https://flyto2.com' };

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

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteUrl(value) {
  const text = String(value ?? '').trim();
  if (!text) return `${siteUrl}/og-image.png`;
  return text.startsWith('http') ? text : `${siteUrl}${text.startsWith('/') ? text : `/${text}`}`;
}

function isoDate(value) {
  const date = new Date(`${String(value ?? '').slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? '2026-07-18T00:00:00.000Z' : date.toISOString();
}

function rfc822(value) {
  return new Date(isoDate(value)).toUTCString();
}

function postRecords() {
  return readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .map((file) => {
      const slug = path.basename(file, '.md');
      const raw = readFileSync(path.join(postsDir, file), 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      const title = meta.title || slug.replace(/-/g, ' ');
      const description = meta.description || stripMarkdown(body).slice(0, 180);
      const url = `${siteUrl}/posts/${slug}`;
      const image = absoluteUrl(meta.cover || '/og-image.png');
      const tags = Array.isArray(meta.tags) ? meta.tags : [];
      const keywords = [
        meta.focusKeyword,
        ...(Array.isArray(meta.relatedKeywords) ? meta.relatedKeywords : []),
        ...tags,
      ].filter(Boolean);
      return {
        file,
        slug,
        title,
        description,
        url,
        image,
        date: meta.date || '2026-07-18',
        updated: meta.updated || meta.date || '2026-07-18',
        author: meta.author || feedAuthor.name,
        tags,
        keywords,
        body: stripMarkdown(body),
      };
    })
    .sort((a, b) => isoDate(b.date).localeCompare(isoDate(a.date)) || a.slug.localeCompare(b.slug));
}

function writeIfChanged(filePath, content, encoding = 'utf8') {
  const binary = Buffer.isBuffer(content);
  if (existsSync(filePath) && lstatSync(filePath).isSymbolicLink()) throw new Error(`refusing to replace symbolic link: ${filePath}`);
  const previous = existsSync(filePath) ? readFileSync(filePath, binary ? undefined : encoding) : null;
  if (binary ? Buffer.isBuffer(previous) && previous.equals(content) : previous === content) return false;
  mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${randomBytes(12).toString('hex')}.tmp`);
  let descriptor;
  try {
    descriptor = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    writeFileSync(descriptor, content, binary ? undefined : encoding);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, filePath);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    try { unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return true;
}

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const maxPngBytes = 16 * 1024 * 1024;
const maxPngPixels = 1200 * 630;
const maxPngCompressedBytes = 8 * 1024 * 1024;

function decodeRgbaPng(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length > maxPngBytes || !buffer.subarray(0, 8).equals(pngSignature)) throw new Error('invalid PNG signature or size');
  let offset = 8;
  let width = 0;
  let height = 0;
  let sawHeader = false;
  let sawEnd = false;
  const compressed = [];
  let compressedLength = 0;
  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) throw new Error('truncated PNG chunk');
    const length = buffer.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > buffer.length) throw new Error('truncated PNG data');
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (crc32(buffer.subarray(offset + 4, offset + 8 + length)) !== buffer.readUInt32BE(offset + 8 + length)) throw new Error('invalid PNG CRC');
    if (!sawHeader && type !== 'IHDR') throw new Error('PNG header must be first');
    if (type === 'IHDR') {
      if (sawHeader || length !== 13) throw new Error('invalid PNG header');
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (!width || !height || width * height > maxPngPixels || data[8] !== 8 || data[9] !== 6 || data[10] || data[11] || data[12]) throw new Error('unsupported or oversized PNG');
      sawHeader = true;
    } else if (type === 'IDAT') {
      if (!sawHeader || sawEnd) throw new Error('misplaced PNG image data');
      compressedLength += length;
      if (compressedLength > maxPngCompressedBytes) throw new Error('oversized PNG image data');
      compressed.push(data);
    } else if (type === 'IEND') {
      if (length || !compressed.length) throw new Error('invalid PNG end');
      sawEnd = true;
      if (end !== buffer.length) throw new Error('trailing PNG data');
    } else if ((type.charCodeAt(0) & 0x20) === 0) throw new Error(`unsupported critical PNG chunk: ${type}`);
    offset = end;
  }
  if (!sawHeader || !sawEnd) throw new Error('incomplete PNG');
  const rowBytes = width * 4;
  const inflatedLength = (rowBytes + 1) * height;
  const raw = inflateSync(Buffer.concat(compressed, compressedLength), { maxOutputLength: inflatedLength });
  if (raw.length !== inflatedLength) throw new Error('invalid inflated PNG length');
  const pixels = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (rowBytes + 1)];
    if (filter > 4) throw new Error('invalid PNG filter');
    for (let x = 0; x < rowBytes; x += 1) {
      const source = raw[y * (rowBytes + 1) + x + 1];
      const left = x >= 4 ? pixels[y * rowBytes + x - 4] : 0;
      const above = y ? pixels[(y - 1) * rowBytes + x] : 0;
      const upperLeft = y && x >= 4 ? pixels[(y - 1) * rowBytes + x - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = above;
      else if (filter === 3) predictor = Math.floor((left + above) / 2);
      else if (filter === 4) {
        const p = left + above - upperLeft;
        const distances = [Math.abs(p - left), Math.abs(p - above), Math.abs(p - upperLeft)];
        predictor = distances[0] <= distances[1] && distances[0] <= distances[2] ? left : distances[1] <= distances[2] ? above : upperLeft;
      }
      pixels[y * rowBytes + x] = (source + predictor) & 0xff;
    }
  }
  return { width, height, pixels };
}

function pngsAreEquivalent(left, right) {
  try {
    const a = decodeRgbaPng(left);
    const b = decodeRgbaPng(right);
    return a.width === b.width && a.height === b.height && a.pixels.equals(b.pixels);
  } catch {
    return false;
  }
}

function writePngIfChanged(filePath, content) {
  if (existsSync(filePath) && lstatSync(filePath).isSymbolicLink()) throw new Error(`refusing to replace symbolic link: ${filePath}`);
  if (existsSync(filePath) && pngsAreEquivalent(readFileSync(filePath), content)) return false;
  return writeIfChanged(filePath, content);
}

function rss(posts) {
  const latestDate = posts[0]?.date || '2026-07-18';
  const items = posts.map((post) => `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(post.url)}</link>
      <guid isPermaLink="true">${xmlEscape(post.url)}</guid>
      <description>${xmlEscape(post.description)}</description>
      <pubDate>${xmlEscape(rfc822(post.date))}</pubDate>
      <author>${xmlEscape(`${feedAuthor.email} (${post.author})`)}</author>
      ${post.tags.map((tag) => `<category>${xmlEscape(tag)}</category>`).join('\n      ')}
      <enclosure url="${xmlEscape(post.image)}" type="${post.image.endsWith('.svg') ? 'image/svg+xml' : post.image.endsWith('.png') ? 'image/png' : 'image/jpeg'}" />
    </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(siteTitle)}</title>
    <link>${xmlEscape(siteUrl)}</link>
    <description>${xmlEscape(siteDescription)}</description>
    <language>en-US</language>
    <lastBuildDate>${xmlEscape(rfc822(latestDate))}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub" />
${items}
  </channel>
</rss>
`;
}

function atom(posts) {
  const latestDate = posts[0]?.updated || '2026-07-18';
  const entries = posts.map((post) => `  <entry>
    <title>${xmlEscape(post.title)}</title>
    <link href="${xmlEscape(post.url)}" />
    <id>${xmlEscape(post.url)}</id>
    <published>${xmlEscape(isoDate(post.date))}</published>
    <updated>${xmlEscape(isoDate(post.updated))}</updated>
    <summary>${xmlEscape(post.description)}</summary>
    <author><name>${xmlEscape(post.author)}</name></author>
    <category term="${xmlEscape(post.keywords[0] || post.tags[0] || 'Flyto2')}" />
  </entry>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xmlEscape(siteTitle)}</title>
  <subtitle>${xmlEscape(siteDescription)}</subtitle>
  <link href="${xmlEscape(siteUrl)}" />
  <link href="${siteUrl}/atom.xml" rel="self" />
  <link href="https://pubsubhubbub.appspot.com/" rel="hub" />
  <id>${xmlEscape(siteUrl)}</id>
  <updated>${xmlEscape(isoDate(latestDate))}</updated>
  <author><name>${xmlEscape(feedAuthor.name)}</name><email>${xmlEscape(feedAuthor.email)}</email></author>
${entries}
</feed>
`;
}

function jsonFeed(posts) {
  return `${JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: siteTitle,
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    description: siteDescription,
    icon: `${siteUrl}/logo.webp`,
    favicon: `${siteUrl}/favicon.ico`,
    authors: [feedAuthor],
    language: 'en-US',
    items: posts.map((post) => ({
      id: post.url,
      url: post.url,
      title: post.title,
      summary: post.description,
      image: post.image,
      date_published: isoDate(post.date),
      date_modified: isoDate(post.updated),
      authors: [{ name: post.author, url: feedAuthor.url }],
      tags: post.keywords,
      content_text: post.body.slice(0, 5000),
    })),
  }, null, 2)}\n`;
}

function imageSitemap(posts) {
  const urls = posts.map((post) => `  <url>
    <loc>${xmlEscape(post.url)}</loc>
    <image:image>
      <image:loc>${xmlEscape(post.image)}</image:loc>
      <image:title>${xmlEscape(post.title)}</image:title>
      <image:caption>${xmlEscape(post.description)}</image:caption>
    </image:image>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
}

const font = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '2': ['11110', '00001', '00001', '11110', '10000', '10000', '11111'],
  '4': ['10001', '10001', '10001', '11111', '00001', '00001', '00001'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function setPixel(buffer, width, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= 630) return;
  const index = (y * width + x) * 4;
  buffer[index] = color[0];
  buffer[index + 1] = color[1];
  buffer[index + 2] = color[2];
  buffer[index + 3] = color[3];
}

function fillRect(buffer, width, x, y, rectWidth, rectHeight, color) {
  for (let row = y; row < y + rectHeight; row += 1) {
    for (let col = x; col < x + rectWidth; col += 1) setPixel(buffer, width, col, row, color);
  }
}

function drawText(buffer, width, text, x, y, scale, color) {
  let cursor = x;
  for (const raw of text.toUpperCase()) {
    const glyph = font[raw] || font[' '];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === '1') fillRect(buffer, width, cursor + col * scale, y + row * scale, scale, scale, color);
      }
    }
    cursor += 6 * scale;
  }
}

function ogImagePng() {
  const width = 1200;
  const height = 630;
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const shade = Math.round(248 - (y / height) * 18);
      setPixel(pixels, width, x, y, [shade, shade, 252, 255]);
    }
  }
  fillRect(pixels, width, 0, 0, 1200, 16, [126, 58, 242, 255]);
  fillRect(pixels, width, 84, 96, 84, 84, [126, 58, 242, 255]);
  fillRect(pixels, width, 112, 116, 76, 16, [249, 250, 251, 255]);
  fillRect(pixels, width, 112, 146, 54, 16, [249, 250, 251, 255]);
  fillRect(pixels, width, 900, 118, 224, 328, [255, 255, 255, 255]);
  fillRect(pixels, width, 900, 118, 224, 3, [229, 231, 235, 255]);
  fillRect(pixels, width, 900, 443, 224, 3, [229, 231, 235, 255]);
  fillRect(pixels, width, 900, 226, 224, 2, [229, 231, 235, 255]);
  fillRect(pixels, width, 900, 334, 224, 2, [229, 231, 235, 255]);
  drawText(pixels, width, 'TRACE', 934, 162, 5, [18, 24, 38, 255]);
  drawText(pixels, width, 'REPLAY', 934, 270, 5, [18, 24, 38, 255]);
  drawText(pixels, width, 'EVIDENCE', 934, 378, 5, [18, 24, 38, 255]);
  drawText(pixels, width, 'FLYTO2 BLOG', 84, 224, 11, [18, 24, 38, 255]);
  drawText(pixels, width, 'AI WORKFLOW AUTOMATION', 88, 366, 5, [74, 85, 104, 255]);
  drawText(pixels, width, 'MCP CTEM AGENT GUIDES', 88, 440, 5, [74, 85, 104, 255]);
  drawText(pixels, width, '452 MODULES', 88, 524, 6, [126, 58, 242, 255]);

  const rawRows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    rawRows[y * (width * 4 + 1)] = 0;
    pixels.copy(rawRows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(rawRows, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function manifest(posts) {
  return `${JSON.stringify({
    generatedFrom: 'scripts/generate-discovery-feeds.mjs',
    sourceHash: createHash('sha256').update(posts.map((post) => `${post.file}:${post.date}:${post.title}:${post.image}`).join('\n')).digest('hex'),
    outputs: [
      '/rss.xml',
      '/atom.xml',
      '/feed.json',
      '/image-sitemap.xml',
      '/og-image.png',
    ],
    postCount: posts.length,
    latestPostDate: posts[0]?.date || '',
  }, null, 2)}\n`;
}

function main() {
  const posts = postRecords();
  const outputs = [
    [path.join(publicDir, 'rss.xml'), rss(posts)],
    [path.join(publicDir, 'atom.xml'), atom(posts)],
    [path.join(publicDir, 'feed.json'), jsonFeed(posts)],
    [path.join(publicDir, 'image-sitemap.xml'), imageSitemap(posts)],
    [path.join(publicDir, 'discovery-manifest.json'), manifest(posts)],
  ];
  let changed = outputs.filter(([filePath, content]) => writeIfChanged(filePath, content)).length;
  if (writePngIfChanged(path.join(publicDir, 'og-image.png'), ogImagePng())) changed += 1;
  console.log(`SEO discovery files ready: ${outputs.length + 1} outputs, ${changed} changed`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export { decodeRgbaPng, ogImagePng, pngsAreEquivalent, writeIfChanged, writePngIfChanged };
