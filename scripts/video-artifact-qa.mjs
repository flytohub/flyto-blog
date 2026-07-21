import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlan = 'video/plans/community-growth-open-source-ai-workflow-automation.json';

function parseArgs(argv) {
  const args = { plan: defaultPlan, variant: 'all' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else if (arg === '--variant') args.variant = argv[++index] ?? '';
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function insideRoot(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) throw new Error(`${relativePath} escapes repository root`);
  return absolutePath;
}

function probe(filePath) {
  return JSON.parse(execFileSync('ffprobe', [
    '-v', 'error', '-show_streams', '-show_format', '-of', 'json', filePath,
  ], { encoding: 'utf8' }));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = JSON.parse(readFileSync(insideRoot(args.plan), 'utf8'));
  const manifestPath = insideRoot(`video/dist/${plan.id}/manifest.json`);
  if (!existsSync(manifestPath)) throw new Error('render manifest is missing');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const expected = plan.outputs.filter((output) => args.variant === 'all' || output.id === args.variant);
  if (expected.length === 0) throw new Error(`unknown variant: ${args.variant}`);

  for (const output of expected) {
    const result = manifest.outputs.find((entry) => entry.id === output.id);
    if (!result?.mp4) throw new Error(`${output.id}: MP4 is missing from manifest`);
    const mp4Path = insideRoot(result.mp4);
    if (!existsSync(mp4Path) || statSync(mp4Path).size < 200_000) throw new Error(`${output.id}: MP4 is missing or too small`);
    const data = probe(mp4Path);
    const video = data.streams.find((stream) => stream.codec_type === 'video');
    const audio = data.streams.find((stream) => stream.codec_type === 'audio');
    if (!video) throw new Error(`${output.id}: video stream is missing`);
    if (!audio) throw new Error(`${output.id}: voiceover/background audio stream is missing`);
    if (video.width !== output.width || video.height !== output.height) {
      throw new Error(`${output.id}: expected ${output.width}x${output.height}, got ${video.width}x${video.height}`);
    }
    const duration = Number(data.format.duration);
    if (!Number.isFinite(duration) || Math.abs(duration - plan.durationSeconds) > 1.1) {
      throw new Error(`${output.id}: duration ${duration} does not match ${plan.durationSeconds}s plan`);
    }
    if (result.production?.captionsBurned !== true) throw new Error(`${output.id}: burned-caption contract is missing`);
    if ((result.production?.templates ?? []).length < 4) throw new Error(`${output.id}: scene template coverage is incomplete`);
  }
  console.log(`video artifact qa passed: ${expected.length} MP4(s) with video, audio, duration, dimensions, and burned-caption contract`);
}

main();
