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
    const burnedCaptions = result.production?.burnedCaptions;
    if (!burnedCaptions || !existsSync(insideRoot(burnedCaptions))) throw new Error(`${output.id}: resolution-aware ASS captions are missing`);
    const ass = readFileSync(insideRoot(burnedCaptions), 'utf8');
    if (!ass.includes(`PlayResX: ${output.width}`) || !ass.includes(`PlayResY: ${output.height}`)) {
      throw new Error(`${output.id}: ASS captions do not match output resolution`);
    }
    const styleLine = ass.split(/\r?\n/).find((line) => line.startsWith('Style: Default,'));
    const captionMarginV = Number(styleLine?.slice('Style: '.length).split(',')[21]);
    const minCaptionMarginV = output.aspectRatio === '9:16' ? 160 : output.aspectRatio === '1:1' ? 150 : 50;
    if (!Number.isFinite(captionMarginV) || captionMarginV < minCaptionMarginV) {
      throw new Error(`${output.id}: caption bottom margin must be at least ${minCaptionMarginV}px`);
    }
    if ((result.production?.captionCueCount ?? 0) < 12) throw new Error(`${output.id}: production captions are not sufficiently chunked`);
    const maxCaptionChars = output.aspectRatio === '9:16' ? 28 : output.aspectRatio === '1:1' ? 36 : 48;
    const captionLines = readFileSync(insideRoot(result.captions), 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !/^\d+$/.test(line) && !line.includes('-->'));
    if (captionLines.some((line) => line.length > maxCaptionChars)) {
      throw new Error(`${output.id}: a production caption exceeds the ${maxCaptionChars}-character visual limit`);
    }
    if ((result.production?.templates ?? []).length < 6) throw new Error(`${output.id}: scene template coverage is incomplete`);
    if (!(result.production?.templates ?? []).includes('human-broll')) throw new Error(`${output.id}: human B-roll scene is missing`);
    const humanBrollPath = insideRoot(result.production?.humanBroll ?? '');
    if (!existsSync(humanBrollPath) || statSync(humanBrollPath).size < 200_000) throw new Error(`${output.id}: licensed human B-roll is missing`);
    const provenancePath = insideRoot(result.production?.humanBrollProvenance ?? '');
    if (!existsSync(provenancePath)) throw new Error(`${output.id}: human B-roll provenance is missing`);
    const provenance = JSON.parse(readFileSync(provenancePath, 'utf8'));
    if (provenance.checksumVerified !== true || provenance.commercialUse !== true || !provenance.licenseUrl) {
      throw new Error(`${output.id}: human B-roll license provenance is incomplete`);
    }
    const verificationFrames = result.production?.verificationFrames ?? [];
    if (verificationFrames.length !== plan.scenes.length) throw new Error(`${output.id}: expected one final-video verification frame per scene`);
    for (const frame of verificationFrames) {
      const framePath = path.resolve(root, frame);
      if (!framePath.startsWith(root) || !existsSync(framePath)) throw new Error(`${output.id}: missing verification frame ${frame}`);
    }
  }
  console.log(`video artifact qa passed: ${expected.length} MP4(s) with video, audio, duration, dimensions, burned captions, and final-frame evidence`);
}

main();
