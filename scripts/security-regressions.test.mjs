import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { deflateSync } from 'node:zlib';
import { decodeRgbaPng, ogImagePng, pngsAreEquivalent, writeIfChanged } from './generate-discovery-feeds.mjs';
import { atomicWrite, escapeCell, parseSource } from './generate-documentation-reference.mjs';
import { isExistingSameRepositorySourceUrl } from './list-external-links.mjs';

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
