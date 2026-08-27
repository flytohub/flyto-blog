import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, constants, existsSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlan = 'video/plans/community-growth-open-source-ai-workflow-automation.json';
const catalogPath = path.join(root, 'video/assets/stock-sources.json');
const maxAssetBytes = 12 * 1024 * 1024;
const approvedAsset = Object.freeze({
  id: 'mixkit-people-working-laptops-42620',
  downloadUrl: 'https://assets.mixkit.co/videos/42620/42620-720.mp4',
  sha256: '4e26b16f9f85ac6843b07290b1c2cbf96d4cb4b6c640b9e47da57b30ca4b48cc',
});

function parseArgs(argv) {
  const args = { plan: defaultPlan, out: '', required: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else if (arg === '--out') args.out = argv[++index] ?? '';
    else if (arg === '--required') args.required = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

export function repositoryPath(relativePath, { forWrite = false } = {}) {
  if (typeof relativePath !== 'string' || !relativePath || relativePath.includes('\0') || relativePath.includes('\\') || path.isAbsolute(relativePath)) throw new Error('path must be a non-empty repository-relative path');
  let decoded = relativePath;
  for (let count = 0; count < 4; count += 1) {
    const next = decodeURIComponent(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  if (!decoded || decoded.includes('\0') || decoded.includes('\\') || path.isAbsolute(decoded) || decoded.split('/').includes('..')) throw new Error(`${relativePath} escapes repository root`);
  const absolutePath = path.resolve(root, decoded);
  let parent = forWrite ? path.dirname(absolutePath) : absolutePath;
  while (!existsSync(parent)) parent = path.dirname(parent);
  const canonicalParent = realpathSync(parent);
  if (canonicalParent !== root && !canonicalParent.startsWith(`${root}${path.sep}`)) throw new Error(`${relativePath} escapes repository root`);
  return absolutePath;
}

function readRegularFile(filePath, encoding) {
  const fd = openSync(filePath, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile()) throw new Error(`${filePath} is not a regular file`);
    return readFileSync(fd, encoding);
  } finally { closeSync(fd); }
}

function atomicWrite(filePath, data) {
  if (existsSync(filePath) && lstatSync(filePath).isSymbolicLink()) throw new Error(`${filePath} is a symbolic link`);
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    const fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    try { writeFileSync(fd, data); } finally { closeSync(fd); }
    renameSync(temporary, filePath);
  } finally { if (existsSync(temporary)) unlinkSync(temporary); }
}

function hasCommand(name) {
  try {
    execFileSync('which', [name], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function digest(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function isTrustedAssetUrl(value) {
  try {
    const raw = String(value);
    const url = new URL(raw);
    const authority = raw.match(/^https:\/\/([^/?#]*)/i)?.[1] ?? '';
    return url.origin === 'https://assets.mixkit.co' && authority === 'assets.mixkit.co' && !url.username && !url.password && !url.port;
  } catch { return false; }
}

export function resolveApprovedAsset(catalog, assetId) {
  if (assetId !== approvedAsset.id) throw new Error(`unknown human B-roll asset: ${assetId ?? 'missing'}`);
  const source = catalog?.assets?.find((asset) => asset.id === approvedAsset.id);
  if (!source) throw new Error(`unknown human B-roll asset: ${assetId}`);
  if (source.downloadUrl !== approvedAsset.downloadUrl) throw new Error('approved stock video catalog URL drifted');
  if (source.sha256 !== approvedAsset.sha256) throw new Error('approved stock video catalog checksum drifted');
  if (!isTrustedAssetUrl(source.downloadUrl)) throw new Error('stock video downloads must use the approved Mixkit asset host');
  if (source.commercialUse !== true || !source.licenseUrl) throw new Error('stock video must record commercial-use license metadata');
  return source;
}

export function verifyDownloadedAsset(bytes) {
  if (!Buffer.isBuffer(bytes)) throw new TypeError('stock video body must be a Buffer');
  if (bytes.length > maxAssetBytes) throw new Error(`stock video exceeds ${maxAssetBytes} bytes`);
  if (digest(bytes) !== approvedAsset.sha256) throw new Error('stock video checksum does not match the reviewed source');
  return bytes;
}

export function validateAssetResponse(response) {
  if (response.redirected || response.url !== approvedAsset.downloadUrl) throw new Error('stock video redirect or final URL is not approved');
  if (!response.ok) throw new Error(`stock video download failed: HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('video/mp4')) throw new Error(`unexpected stock video content type: ${contentType}`);
}

async function boundedResponseBuffer(response) {
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxAssetBytes) throw new Error(`stock video exceeds ${maxAssetBytes} bytes`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('stock video response has no readable body');
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxAssetBytes) {
      await reader.cancel();
      throw new Error(`stock video exceeds ${maxAssetBytes} bytes`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}

export function persistVerifiedAsset(filePath, bytes) {
  atomicWrite(filePath, verifyDownloadedAsset(bytes));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = JSON.parse(readRegularFile(repositoryPath(args.plan), 'utf8'));
  const catalog = JSON.parse(readRegularFile(catalogPath, 'utf8'));
  const source = resolveApprovedAsset(catalog, plan.humanBroll?.assetId);

  const output = repositoryPath(args.out || `video/dist/${plan.id}/shared/human-broll.mp4`, { forWrite: true });
  mkdirSync(path.dirname(output), { recursive: true });
  let buffer = existsSync(output) ? readRegularFile(output) : null;
  if (!buffer || digest(buffer) !== source.sha256) {
    const response = await fetch('https://assets.mixkit.co/videos/42620/42620-720.mp4', {
      headers: { 'User-Agent': 'Flyto2 video renderer (https://github.com/flytohub/flyto-blog)' },
      redirect: 'manual',
    });
    validateAssetResponse(response);
    buffer = verifyDownloadedAsset(await boundedResponseBuffer(response));
    persistVerifiedAsset(output, buffer);
  }

  const provenancePath = path.join(path.dirname(output), 'human-broll-provenance.json');
  atomicWrite(provenancePath, `${JSON.stringify({
    ...source,
    localArtifact: path.relative(root, output),
    checksumVerified: true,
    redistribution: 'Rendered into Flyto2 review videos; original media is not committed to the repository.',
  }, null, 2)}\n`);

  const posterPath = path.join(path.dirname(output), 'human-broll-poster.png');
  if (hasCommand('ffmpeg')) {
    if (existsSync(posterPath) && lstatSync(posterPath).isSymbolicLink()) throw new Error(`${posterPath} is a symbolic link`);
    const posterTemporary = `${posterPath}.${process.pid}.${Date.now()}.tmp.png`;
    try {
      execFileSync('ffmpeg', [
        '-y', '-ss', String(plan.humanBroll?.trimStartSeconds ?? 1), '-i', output,
        '-frames:v', '1', '-vf', 'scale=1280:-2', posterTemporary,
      ], { stdio: 'inherit' });
      renameSync(posterTemporary, posterPath);
    } finally { if (existsSync(posterTemporary)) unlinkSync(posterTemporary); }
  } else if (args.required) {
    throw new Error('ffmpeg is required to verify the human B-roll poster');
  }

  process.stdout.write(`${JSON.stringify({
    output: path.relative(root, output),
    provenance: path.relative(root, provenancePath),
    poster: existsSync(posterPath) ? path.relative(root, posterPath) : '',
    source: source.pageUrl,
    license: source.licenseName,
  }, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
