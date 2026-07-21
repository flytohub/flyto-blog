import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlan = 'video/plans/community-growth-open-source-ai-workflow-automation.json';
const catalogPath = path.join(root, 'video/assets/stock-sources.json');
const maxAssetBytes = 12 * 1024 * 1024;

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

function insideRoot(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) throw new Error(`${relativePath} escapes repository root`);
  return absolutePath;
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = JSON.parse(readFileSync(insideRoot(args.plan), 'utf8'));
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const source = catalog.assets.find((asset) => asset.id === plan.humanBroll?.assetId);
  if (!source) throw new Error(`unknown human B-roll asset: ${plan.humanBroll?.assetId ?? 'missing'}`);
  const downloadUrl = new URL(source.downloadUrl);
  if (downloadUrl.protocol !== 'https:' || downloadUrl.hostname !== 'assets.mixkit.co') {
    throw new Error('stock video downloads must use the approved Mixkit asset host');
  }
  if (source.commercialUse !== true || !source.licenseUrl) throw new Error('stock video must record commercial-use license metadata');

  const output = insideRoot(args.out || `video/dist/${plan.id}/shared/human-broll.mp4`);
  mkdirSync(path.dirname(output), { recursive: true });
  let buffer = existsSync(output) ? readFileSync(output) : null;
  if (!buffer || digest(buffer) !== source.sha256) {
    const response = await fetch(downloadUrl, {
      headers: { 'User-Agent': 'Flyto2 video renderer (https://github.com/flytohub/flyto-blog)' },
    });
    if (!response.ok) throw new Error(`stock video download failed: HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('video/mp4')) throw new Error(`unexpected stock video content type: ${contentType}`);
    buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxAssetBytes) throw new Error(`stock video exceeds ${maxAssetBytes} bytes`);
    if (digest(buffer) !== source.sha256) throw new Error('stock video checksum does not match the reviewed source');
    writeFileSync(output, buffer);
  }

  const provenancePath = path.join(path.dirname(output), 'human-broll-provenance.json');
  writeFileSync(provenancePath, `${JSON.stringify({
    ...source,
    localArtifact: path.relative(root, output),
    checksumVerified: true,
    redistribution: 'Rendered into Flyto2 review videos; original media is not committed to the repository.',
  }, null, 2)}\n`);

  const posterPath = path.join(path.dirname(output), 'human-broll-poster.png');
  if (hasCommand('ffmpeg')) {
    execFileSync('ffmpeg', [
      '-y', '-ss', String(plan.humanBroll?.trimStartSeconds ?? 1), '-i', output,
      '-frames:v', '1', '-vf', 'scale=1280:-2', posterPath,
    ], { stdio: 'inherit' });
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

await main();
