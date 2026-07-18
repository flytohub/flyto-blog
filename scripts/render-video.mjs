import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlan = 'video/plans/community-growth-open-source-ai-workflow-automation.json';

function parseArgs(argv) {
  const args = {
    plan: defaultPlan,
    outDir: '',
    mp4: false,
    storyboardOnly: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else if (arg === '--out-dir') args.outDir = argv[++index] ?? '';
    else if (arg === '--mp4') args.mp4 = true;
    else if (arg === '--storyboard-only') args.storyboardOnly = true;
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/render-video.mjs --plan <plan.json> --storyboard-only
  node scripts/render-video.mjs --plan <plan.json> --mp4
`);
}

function readPlan(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!absolutePath.startsWith(root)) throw new Error('plan path must stay inside the repository');
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function wrapWords(text, limit) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > limit && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function srtTime(seconds) {
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},000`;
}

function writeFrame(plan, scene, index, outDir) {
  const width = plan.aspectRatio === '9:16' ? 1080 : 1280;
  const height = plan.aspectRatio === '9:16' ? 1920 : 720;
  const titleLines = wrapWords(scene.title, plan.aspectRatio === '9:16' ? 24 : 40);
  const bodyLines = wrapWords(scene.body, plan.aspectRatio === '9:16' ? 30 : 58);
  const titleY = plan.aspectRatio === '9:16' ? 460 : 210;
  const bodyY = titleY + titleLines.length * 68 + 42;
  const titleSize = plan.aspectRatio === '9:16' ? 64 : 54;
  const bodySize = plan.aspectRatio === '9:16' ? 34 : 28;
  const innerX = plan.aspectRatio === '9:16' ? 92 : 96;
  const sceneNo = `${String(index + 1).padStart(2, '0')}/${String(plan.scenes.length).padStart(2, '0')}`;

  const titleSvg = titleLines
    .map((line, offset) => `<text x="${innerX}" y="${titleY + offset * (titleSize + 14)}" class="title">${escapeHtml(line)}</text>`)
    .join('\n');
  const bodySvg = bodyLines
    .map((line, offset) => `<text x="${innerX}" y="${bodyY + offset * (bodySize + 12)}" class="body">${escapeHtml(line)}</text>`)
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0b0b12"/>
      <stop offset="48%" stop-color="#171323"/>
      <stop offset="100%" stop-color="#271a10"/>
    </linearGradient>
    <style>
      .label { font: 700 20px Inter, Arial, sans-serif; letter-spacing: 4px; fill: #a78bfa; }
      .title { font: 760 ${titleSize}px Inter, Arial, sans-serif; fill: #f8fafc; }
      .body { font: 420 ${bodySize}px Inter, Arial, sans-serif; fill: #d7d7de; }
      .small { font: 520 22px Inter, Arial, sans-serif; fill: #9ca3af; }
      .mono { font: 600 18px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #c4b5fd; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="${innerX}" y="${height - 106}" width="${width - innerX * 2}" height="1" fill="#3d3a48"/>
  <text x="${innerX}" y="${plan.aspectRatio === '9:16' ? 150 : 88}" class="label">FLYTO2 VIDEO DRAFT</text>
  <text x="${width - innerX}" y="${plan.aspectRatio === '9:16' ? 150 : 88}" class="small" text-anchor="end">${sceneNo}</text>
  ${titleSvg}
  ${bodySvg}
  <text x="${innerX}" y="${height - 58}" class="mono">${escapeHtml(plan.sourceUrl)}</text>
</svg>
`;
  const framePath = path.join(outDir, 'frames', `scene-${String(index + 1).padStart(2, '0')}.svg`);
  writeFileSync(framePath, svg);
  return framePath;
}

function writeStoryboard(plan, outDir, framePaths) {
  const cards = plan.scenes.map((scene, index) => {
    const frame = path.relative(outDir, framePaths[index]);
    return `<article>
      <img src="${escapeHtml(frame)}" alt="${escapeHtml(scene.title)}">
      <h2>${escapeHtml(scene.title)}</h2>
      <p>${escapeHtml(scene.body)}</p>
      <small>${scene.durationSeconds}s</small>
    </article>`;
  }).join('\n');
  writeFileSync(path.join(outDir, 'storyboard.html'), `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(plan.title)}</title>
<style>
  body { margin: 0; font-family: Inter, Arial, sans-serif; background: #0b0b12; color: #f8fafc; }
  main { max-width: 1100px; margin: 0 auto; padding: 40px 20px; }
  article { border: 1px solid #2d2938; border-radius: 8px; padding: 18px; margin: 18px 0; background: #14131b; }
  img { width: 100%; border-radius: 6px; border: 1px solid #2d2938; }
  p, small { color: #cbd5e1; }
</style>
<main>
  <h1>${escapeHtml(plan.title)}</h1>
  <p>${escapeHtml(plan.description)}</p>
  ${cards}
</main>
</html>
`);
}

function writeCaptions(plan, outDir) {
  let cursor = 0;
  const blocks = plan.scenes.map((scene, index) => {
    const start = cursor;
    cursor += scene.durationSeconds;
    return `${index + 1}\n${srtTime(start)} --> ${srtTime(cursor)}\n${scene.title} ${scene.body}\n`;
  });
  writeFileSync(path.join(outDir, 'captions.srt'), `${blocks.join('\n')}\n`);
}

function writeMetadata(plan, outDir) {
  const metadata = {
    title: plan.title,
    description: plan.youtube.description,
    tags: plan.youtube.tags,
    categoryId: plan.youtube.categoryId,
    privacyStatus: plan.youtube.privacyStatus,
    sourceUrl: plan.sourceUrl,
    humanReviewRequired: plan.humanReviewRequired,
    aiDisclosureRequired: plan.aiDisclosureRequired,
  };
  writeFileSync(path.join(outDir, 'youtube-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
}

function hasCommand(name) {
  try {
    execFileSync('command', ['-v', name], { stdio: 'ignore', shell: true });
    return true;
  } catch {
    return false;
  }
}

function renderMp4(plan, outDir, framePaths) {
  if (!hasCommand('rsvg-convert')) throw new Error('rsvg-convert is required for --mp4');
  if (!hasCommand('ffmpeg')) throw new Error('ffmpeg is required for --mp4');

  const pngPaths = framePaths.map((framePath) => framePath.replace(/\.svg$/, '.png'));
  for (const [index, framePath] of framePaths.entries()) {
    execFileSync('rsvg-convert', ['-o', pngPaths[index], framePath], { stdio: 'inherit' });
  }

  const concatPath = path.join(outDir, 'concat.txt');
  const concat = [];
  for (const [index, pngPath] of pngPaths.entries()) {
    concat.push(`file '${pngPath.replaceAll("'", "'\\''")}'`);
    concat.push(`duration ${plan.scenes[index].durationSeconds}`);
  }
  concat.push(`file '${pngPaths[pngPaths.length - 1].replaceAll("'", "'\\''")}'`);
  writeFileSync(concatPath, `${concat.join('\n')}\n`);

  const mp4Path = path.join(outDir, `${plan.id}.mp4`);
  execFileSync('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatPath,
    '-vf', 'fps=30,format=yuv420p',
    '-pix_fmt', 'yuv420p',
    mp4Path,
  ], { stdio: 'inherit' });
  return mp4Path;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  execFileSync(process.execPath, ['scripts/video-plan-check.mjs', '--plan', args.plan], {
    cwd: root,
    stdio: 'inherit',
  });
  const plan = readPlan(args.plan);
  const outDir = path.resolve(root, args.outDir || `video/dist/${plan.id}`);
  if (!outDir.startsWith(root)) throw new Error('--out-dir must stay inside the repository');
  mkdirSync(path.join(outDir, 'frames'), { recursive: true });

  const framePaths = plan.scenes.map((scene, index) => writeFrame(plan, scene, index, outDir));
  writeStoryboard(plan, outDir, framePaths);
  writeCaptions(plan, outDir);
  writeMetadata(plan, outDir);

  const result = {
    plan: plan.id,
    outDir: path.relative(root, outDir),
    storyboard: path.relative(root, path.join(outDir, 'storyboard.html')),
    captions: path.relative(root, path.join(outDir, 'captions.srt')),
    metadata: path.relative(root, path.join(outDir, 'youtube-metadata.json')),
    frames: framePaths.map((framePath) => path.relative(root, framePath)),
    mp4: '',
  };

  if (args.mp4 && !args.storyboardOnly) {
    result.mp4 = path.relative(root, renderMp4(plan, outDir, framePaths));
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main();
