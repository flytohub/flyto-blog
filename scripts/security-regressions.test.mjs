import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { deflateSync } from 'node:zlib';
import { decodeRgbaPng, ogImagePng, pngsAreEquivalent, writeIfChanged } from './generate-discovery-feeds.mjs';
import { atomicWrite, escapeCell, parseSource } from './generate-documentation-reference.mjs';
import { isExistingSameRepositorySourceUrl } from './list-external-links.mjs';
import { isTrustedAssetUrl, persistVerifiedAsset, repositoryPath as assetPath, resolveApprovedAsset, validateAssetResponse, verifyDownloadedAsset } from './fetch-video-assets.mjs';
import { escapeHtml, repositoryPath as renderPath, stripCueTags } from './render-video.mjs';
import { MissingRepositoryFileError, readInsideRoot, repositoryPath as postPath } from './video-from-post.mjs';

const presentSourceUrl = 'https://github.com/flytohub/flyto-blog/blob/main/present.md#L1';
const missingSourceUrl = 'https://github.com/flytohub/flyto-blog/blob/main/missing.md';
const traversalSourceUrl = 'https://github.com/flytohub/flyto-blog/blob/main/%2e%2e/outside.md';

test('equivalent PNG compression does not change the generated image', () => {
  const original = ogImagePng();
  const decoded = decodeRgbaPng(original);
  const rowBytes = decoded.width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * decoded.height);
  for (let row = 0; row < decoded.height; row += 1) decoded.pixels.copy(raw, row * (rowBytes + 1) + 1, row * rowBytes, (row + 1) * rowBytes);
  const recompressed = Buffer.concat([original.subarray(0, 33), pngChunkForTest('IDAT', deflateSync(raw, { level: 1 })), original.subarray(original.length - 12)]);
  assert.equal(pngsAreEquivalent(original, recompressed), true);
});

test('PNG decoding rejects malformed and oversized inflation', () => {
  const malformed = Buffer.from(ogImagePng());
  malformed[malformed.length - 1] ^= 1;
  assert.throws(() => decodeRgbaPng(malformed));
  const oversizedHeader = Buffer.from(ogImagePng());
  oversizedHeader.writeUInt32BE(1201, 16);
  assert.throws(() => decodeRgbaPng(oversizedHeader));
});

test('Vue extraction handles quoted tag delimiters without consuming templates', () => {
  const parsed = parseSource('fixture.vue', '<template><scripture>no</scripture></template>\n<script setup data-note="> bait">\nconst safe = 1\n</script>\n<div>after</div>');
  assert.match(parsed.text, /const safe = 1/);
  assert.doesNotMatch(parsed.text, /after/);
  assert.equal(parsed.lineOffset, 1);
});

test('Markdown table cells neutralize controls, HTML, backslashes, pipes, and backticks', () => {
  const escaped = escapeCell('x\u0000 <img> \\ | `code`');
  assert.equal(escaped, 'x &lt;img&gt; &#92; &#124; &#96;code&#96;');
  assert.doesNotMatch(escaped, /[\u0000-\u001f<>\\|`]/);
});

test('atomic writers refuse symlink destinations and preserve their targets', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'flyto-generator-test-'));
  const target = path.join(directory, 'target');
  const link = path.join(directory, 'output');
  writeFileSync(target, 'safe');
  symlinkSync(target, link);
  assert.throws(() => writeIfChanged(link, 'unsafe'), /symbolic link/);
  assert.throws(() => atomicWrite(link, 'unsafe'), /symbolic link/);
  assert.equal(readFileSync(target, 'utf8'), 'safe');
});

test('same-repository source links skip only existing checkout files', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'flyto-link-test-'));
  writeFileSync(path.join(directory, 'present.md'), 'safe');
  assert.equal(isExistingSameRepositorySourceUrl(presentSourceUrl, directory), true);
  assert.equal(isExistingSameRepositorySourceUrl(missingSourceUrl, directory), false);
  assert.equal(isExistingSameRepositorySourceUrl(traversalSourceUrl, directory), false);
});

test('video asset downloads trust only the exact credential-free HTTPS origin', () => {
  assert.equal(isTrustedAssetUrl('https://assets.mixkit.co/video.mp4'), true);
  for (const value of [
    'http://assets.mixkit.co/video.mp4',
    'https://assets.mixkit.co:444/video.mp4',
    'https://assets.mixkit.co:443/video.mp4',
    `https://user:pass${'@'}assets.mixkit.co/video.mp4`,
    'https://assets.mixkit.co.evil.example/video.mp4',
    'https://evil.example/?assets.mixkit.co',
  ]) assert.equal(isTrustedAssetUrl(value), false, value);
});

test('post reads report a typed missing-file error from the single open', () => {
  assert.throws(() => readInsideRoot(`posts/missing-${process.pid}.md`), (error) => error instanceof MissingRepositoryFileError && error.code === 'ERR_REPOSITORY_FILE_MISSING');
});

test('approved asset resolution rejects catalog URL and digest drift', () => {
  const base = { id: 'mixkit-people-working-laptops-42620', downloadUrl: 'https://assets.mixkit.co/videos/42620/42620-720.mp4', sha256: '4e26b16f9f85ac6843b07290b1c2cbf96d4cb4b6c640b9e47da57b30ca4b48cc', commercialUse: true, licenseUrl: 'https://mixkit.co/license/#videoFree' };
  assert.throws(() => resolveApprovedAsset({ assets: [{ ...base, downloadUrl: 'https://assets.mixkit.co/other.mp4' }] }, base.id), /URL drifted/);
  assert.throws(() => resolveApprovedAsset({ assets: [{ ...base, sha256: '0'.repeat(64) }] }, base.id), /checksum drifted/);
});

test('asset responses refuse redirects and unapproved final URLs', () => {
  const headers = new Headers({ 'content-type': 'video/mp4' });
  assert.throws(() => validateAssetResponse({ redirected: true, url: 'https://assets.mixkit.co/videos/42620/42620-720.mp4', ok: true, status: 200, headers }), /redirect/);
  assert.throws(() => validateAssetResponse({ redirected: false, url: 'https://assets.mixkit.co.evil.example/video.mp4', ok: true, status: 200, headers }), /not approved/);
});

test('unverified asset bytes never create a final artifact', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'flyto-asset-test-'));
  const output = path.join(directory, 'human-broll.mp4');
  for (const bytes of [Buffer.alloc(12 * 1024 * 1024 + 1), Buffer.from('digest mismatch')]) {
    assert.throws(() => persistVerifiedAsset(output, bytes), /exceeds|checksum/);
    assert.equal(existsSync(output), false);
  }
  assert.throws(() => verifyDownloadedAsset(Buffer.from('digest mismatch')), /checksum/);
  rmSync(directory, { recursive: true });
});

test('all video path boundaries reject encoded traversal and unsafe path forms', () => {
  for (const boundary of [assetPath, renderPath, postPath]) {
    for (const value of ['', '../outside', '%2e%2e/outside', '%252e%252e/outside', 'dir\\file', 'dir\0file', '/absolute']) {
      assert.throws(() => boundary(value), /path|escape/i, `${boundary.name}: ${JSON.stringify(value)}`);
    }
  }
});

test('video write boundaries reject an existing-parent symlink escape', () => {
  const linkName = `.security-path-link-${process.pid}`;
  const linkPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', linkName);
  const outside = mkdtempSync(path.join(tmpdir(), 'flyto-video-outside-'));
  symlinkSync(outside, linkPath);
  try {
    for (const boundary of [assetPath, renderPath, postPath]) assert.throws(() => boundary(`${linkName}/output`, { forWrite: true }), /escape/i);
  } finally {
    unlinkSync(linkPath);
    rmSync(outside, { recursive: true });
  }
});

test('caption tags are quote-aware and active markup is escaped exactly once', () => {
  assert.equal(stripCueTags('<v title="1 > 0">safe</v>'), 'safe');
  const escaped = escapeHtml(`<img onerror='run()'>&`);
  assert.equal(escaped, '&lt;img onerror=&#39;run()&#39;&gt;&amp;');
  assert.doesNotMatch(escaped, /<img|onerror='/);
});

function pngChunkForTest(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32ForTest(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32ForTest(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
