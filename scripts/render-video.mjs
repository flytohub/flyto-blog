import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlan = 'video/plans/community-growth-open-source-ai-workflow-automation.json';
const aspectSpecs = {
  '16:9': {
    width: 1280,
    height: 720,
    titleLimit: 38,
    bodyLimit: 58,
    titleSize: 56,
    bodySize: 29,
    titleY: 205,
    labelY: 84,
    marginX: 92,
  },
  '9:16': {
    width: 1080,
    height: 1920,
    titleLimit: 23,
    bodyLimit: 30,
    titleSize: 66,
    bodySize: 35,
    titleY: 470,
    labelY: 150,
    marginX: 88,
  },
  '1:1': {
    width: 1080,
    height: 1080,
    titleLimit: 28,
    bodyLimit: 38,
    titleSize: 62,
    bodySize: 33,
    titleY: 320,
    labelY: 116,
    marginX: 86,
  },
};

function parseArgs(argv) {
  const args = {
    plan: defaultPlan,
    outDir: '',
    variant: 'all',
    mp4: false,
    storyboardOnly: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else if (arg === '--out-dir') args.outDir = argv[++index] ?? '';
    else if (arg === '--variant') args.variant = argv[++index] ?? '';
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
  node scripts/render-video.mjs --plan <plan.json> --variant youtube-shorts --mp4
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
  const words = String(text).split(/\s+/).filter(Boolean);
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

function outputSpec(output) {
  const spec = aspectSpecs[output.aspectRatio];
  if (!spec) throw new Error(`unsupported output aspect ratio: ${output.aspectRatio}`);
  return {
    ...spec,
    width: output.width ?? spec.width,
    height: output.height ?? spec.height,
  };
}

function fallbackOutputs(plan) {
  const spec = aspectSpecs[plan.aspectRatio] ?? aspectSpecs['16:9'];
  return [{
    id: 'youtube-landscape',
    platform: 'youtube',
    aspectRatio: plan.aspectRatio ?? '16:9',
    width: spec.width,
    height: spec.height,
    label: 'YouTube review draft',
  }];
}

function resolveOutputs(plan, variant) {
  const outputs = (Array.isArray(plan.outputs) && plan.outputs.length ? plan.outputs : fallbackOutputs(plan))
    .map((output) => {
      const spec = outputSpec(output);
      return {
        label: output.label ?? output.id,
        ...output,
        width: output.width ?? spec.width,
        height: output.height ?? spec.height,
      };
    });
  if (variant === 'all') return outputs;
  const selected = outputs.filter((output) => output.id === variant);
  if (!selected.length) throw new Error(`unknown video variant: ${variant}`);
  return selected;
}

function safeFilePath(filePath) {
  return filePath.replaceAll("'", "'\\''");
}

function lineTexts(lines, x, y, className, step) {
  return lines
    .map((line, offset) => `<text x="${x}" y="${y + offset * step}" class="${className}">${escapeHtml(line)}</text>`)
    .join('\n');
}

function writeFrame(plan, output, scene, index, outputDir) {
  const spec = outputSpec(output);
  const titleLines = wrapWords(scene.title, spec.titleLimit).slice(0, 4);
  const bodyLines = wrapWords(scene.body, spec.bodyLimit).slice(0, output.aspectRatio === '9:16' ? 7 : 5);
  const bodyY = spec.titleY + titleLines.length * (spec.titleSize + 13) + 42;
  const sceneNo = `${String(index + 1).padStart(2, '0')}/${String(plan.scenes.length).padStart(2, '0')}`;
  const visualCue = scene.visualCue ? `<text x="${spec.marginX}" y="${spec.height - 120}" class="cue">${escapeHtml(scene.visualCue)}</text>` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">
  <defs>
    <style>
      .bg { fill: #f6f7fb; }
      .panel { fill: #ffffff; stroke: #d8dce8; stroke-width: 1; }
      .stripe-a { fill: #7c3aed; }
      .stripe-b { fill: #0891b2; }
      .stripe-c { fill: #059669; }
      .label { font: 760 19px Inter, Arial, sans-serif; letter-spacing: 4px; fill: #6d28d9; }
      .title { font: 780 ${spec.titleSize}px Inter, Arial, sans-serif; fill: #111827; }
      .body { font: 440 ${spec.bodySize}px Inter, Arial, sans-serif; fill: #374151; }
      .small { font: 560 22px Inter, Arial, sans-serif; fill: #64748b; }
      .mono { font: 620 18px ui-monospace, SFMono-Regular, Menlo, monospace; fill: #475569; }
      .cue { font: 650 23px Inter, Arial, sans-serif; fill: #0f766e; }
    </style>
  </defs>
  <rect width="${spec.width}" height="${spec.height}" class="bg"/>
  <rect x="${spec.marginX - 30}" y="${spec.labelY + 45}" width="${spec.width - (spec.marginX - 30) * 2}" height="${spec.height - spec.labelY - 145}" rx="10" class="panel"/>
  <rect x="0" y="0" width="${spec.width}" height="12" class="stripe-a"/>
  <rect x="${Math.round(spec.width * 0.34)}" y="0" width="${Math.round(spec.width * 0.33)}" height="12" class="stripe-b"/>
  <rect x="${Math.round(spec.width * 0.67)}" y="0" width="${Math.round(spec.width * 0.33)}" height="12" class="stripe-c"/>
  <text x="${spec.marginX}" y="${spec.labelY}" class="label">FLYTO2 VIDEO DRAFT</text>
  <text x="${spec.width - spec.marginX}" y="${spec.labelY}" class="small" text-anchor="end">${escapeHtml(output.label)} ${sceneNo}</text>
  ${lineTexts(titleLines, spec.marginX, spec.titleY, 'title', spec.titleSize + 13)}
  ${lineTexts(bodyLines, spec.marginX, bodyY, 'body', spec.bodySize + 12)}
  ${visualCue}
  <text x="${spec.marginX}" y="${spec.height - 58}" class="mono">${escapeHtml(plan.sourceUrl)}</text>
</svg>
`;
  const framePath = path.join(outputDir, 'frames', `scene-${String(index + 1).padStart(2, '0')}.svg`);
  writeFileSync(framePath, svg);
  return framePath;
}

function writeThumbnail(plan, output, thumbnail, index, outputDir) {
  const spec = outputSpec(output);
  const headlineLines = wrapWords(thumbnail.headline, output.aspectRatio === '9:16' ? 20 : 30).slice(0, 4);
  const subheadLines = wrapWords(thumbnail.subhead, output.aspectRatio === '9:16' ? 26 : 42).slice(0, 3);
  const titleSize = output.aspectRatio === '9:16' ? 82 : output.aspectRatio === '1:1' ? 72 : 64;
  const subheadSize = output.aspectRatio === '9:16' ? 36 : 30;
  const startY = output.aspectRatio === '9:16' ? 430 : output.aspectRatio === '1:1' ? 300 : 220;
  const subheadY = startY + headlineLines.length * (titleSize + 10) + 38;
  const keyword = plan.seo?.primaryKeyword ?? 'open-source AI workflow automation';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .shadow { fill: #eef2ff; }
      .mark { font: 900 ${output.aspectRatio === '9:16' ? 96 : 82}px Inter, Arial, sans-serif; fill: #7c3aed; }
      .kicker { font: 800 22px Inter, Arial, sans-serif; letter-spacing: 4px; fill: #0891b2; }
      .headline { font: 850 ${titleSize}px Inter, Arial, sans-serif; fill: #0f172a; }
      .subhead { font: 520 ${subheadSize}px Inter, Arial, sans-serif; fill: #334155; }
      .tag { font: 700 22px Inter, Arial, sans-serif; fill: #065f46; }
    </style>
  </defs>
  <rect width="${spec.width}" height="${spec.height}" class="bg"/>
  <rect x="${Math.round(spec.width * 0.08)}" y="${Math.round(spec.height * 0.12)}" width="${Math.round(spec.width * 0.84)}" height="${Math.round(spec.height * 0.76)}" rx="12" class="shadow"/>
  <text x="${spec.marginX}" y="${output.aspectRatio === '9:16' ? 190 : 110}" class="mark">F</text>
  <text x="${spec.marginX + 88}" y="${output.aspectRatio === '9:16' ? 176 : 100}" class="kicker">FLYTO2 ${String(index + 1).padStart(2, '0')}</text>
  ${lineTexts(headlineLines, spec.marginX, startY, 'headline', titleSize + 10)}
  ${lineTexts(subheadLines, spec.marginX, subheadY, 'subhead', subheadSize + 10)}
  <text x="${spec.marginX}" y="${spec.height - 92}" class="tag">${escapeHtml(keyword)}</text>
</svg>
`;
  const thumbnailPath = path.join(outputDir, 'thumbnails', `thumbnail-${String(index + 1).padStart(2, '0')}.svg`);
  writeFileSync(thumbnailPath, svg);
  return thumbnailPath;
}

function writeStoryboard(plan, output, outputDir, framePaths, thumbnailPaths) {
  const thumbnailCards = thumbnailPaths.map((thumbnailPath) => {
    const frame = path.relative(outputDir, thumbnailPath);
    return `<img src="${escapeHtml(frame)}" alt="Thumbnail candidate">`;
  }).join('\n');
  const sceneCards = plan.scenes.map((scene, index) => {
    const frame = path.relative(outputDir, framePaths[index]);
    return `<article>
      <img src="${escapeHtml(frame)}" alt="${escapeHtml(scene.title)}">
      <h2>${escapeHtml(scene.title)}</h2>
      <p>${escapeHtml(scene.body)}</p>
      <small>${scene.durationSeconds}s</small>
    </article>`;
  }).join('\n');
  writeFileSync(path.join(outputDir, 'storyboard.html'), `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(plan.title)} - ${escapeHtml(output.label)}</title>
<style>
  body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f6f7fb; color: #111827; }
  main { max-width: 1120px; margin: 0 auto; padding: 40px 20px; }
  article, section { border: 1px solid #d8dce8; border-radius: 8px; padding: 18px; margin: 18px 0; background: #ffffff; }
  img { width: 100%; border-radius: 6px; border: 1px solid #d8dce8; }
  .thumbs { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
  p, small { color: #475569; }
</style>
<main>
  <h1>${escapeHtml(plan.title)}</h1>
  <p>${escapeHtml(plan.description)}</p>
  <p><strong>Variant:</strong> ${escapeHtml(output.label)} (${escapeHtml(output.aspectRatio)})</p>
  <section>
    <h2>Thumbnail candidates</h2>
    <div class="thumbs">${thumbnailCards}</div>
  </section>
  ${sceneCards}
</main>
</html>
`);
}

function writeCaptions(plan, outputDir) {
  let cursor = 0;
  const blocks = plan.scenes.map((scene, index) => {
    const start = cursor;
    cursor += scene.durationSeconds;
    return `${index + 1}\n${srtTime(start)} --> ${srtTime(cursor)}\n${scene.title} ${scene.body}\n`;
  });
  writeFileSync(path.join(outputDir, 'captions.srt'), `${blocks.join('\n')}\n`);
}

function writeVoiceover(plan, outputDir) {
  const script = plan.scenes
    .map((scene, index) => `${index + 1}. ${scene.narration ?? `${scene.title} ${scene.body}`}`)
    .join('\n\n');
  writeFileSync(path.join(outputDir, 'voiceover-script.txt'), `${script}\n`);
}

function writeMetadata(plan, output, outputDir) {
  const metadata = {
    title: plan.youtube.title ?? plan.title,
    titleCandidates: plan.seo?.titleCandidates ?? [plan.title],
    description: plan.youtube.description,
    tags: plan.youtube.tags,
    hashtags: plan.seo?.hashtags ?? [],
    categoryId: plan.youtube.categoryId,
    privacyStatus: plan.youtube.privacyStatus,
    sourceUrl: plan.sourceUrl,
    platform: output.platform,
    aspectRatio: output.aspectRatio,
    humanReviewRequired: plan.humanReviewRequired,
    aiDisclosureRequired: plan.aiDisclosureRequired,
  };
  writeFileSync(path.join(outputDir, 'youtube-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
}

function hasCommand(name) {
  try {
    execFileSync('command', ['-v', name], { stdio: 'ignore', shell: true });
    return true;
  } catch {
    return false;
  }
}

function renderMp4(plan, output, outputDir, framePaths) {
  if (!hasCommand('rsvg-convert')) throw new Error('rsvg-convert is required for --mp4');
  if (!hasCommand('ffmpeg')) throw new Error('ffmpeg is required for --mp4');

  const pngPaths = framePaths.map((framePath) => framePath.replace(/\.svg$/, '.png'));
  for (const [index, framePath] of framePaths.entries()) {
    execFileSync('rsvg-convert', ['-o', pngPaths[index], framePath], { stdio: 'inherit' });
  }

  const concatPath = path.join(outputDir, 'concat.txt');
  const concat = [];
  for (const [index, pngPath] of pngPaths.entries()) {
    concat.push(`file '${safeFilePath(pngPath)}'`);
    concat.push(`duration ${plan.scenes[index].durationSeconds}`);
  }
  concat.push(`file '${safeFilePath(pngPaths[pngPaths.length - 1])}'`);
  writeFileSync(concatPath, `${concat.join('\n')}\n`);

  const mp4Path = path.join(outputDir, `${plan.id}-${output.id}.mp4`);
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

function renderOutput(plan, output, baseOutDir, args) {
  const outputDir = path.join(baseOutDir, output.id);
  mkdirSync(path.join(outputDir, 'frames'), { recursive: true });
  mkdirSync(path.join(outputDir, 'thumbnails'), { recursive: true });

  const framePaths = plan.scenes.map((scene, index) => writeFrame(plan, output, scene, index, outputDir));
  const thumbnails = Array.isArray(plan.thumbnails) && plan.thumbnails.length ? plan.thumbnails : [{
    headline: plan.title,
    subhead: plan.description,
  }];
  const thumbnailPaths = thumbnails.map((thumbnail, index) => writeThumbnail(plan, output, thumbnail, index, outputDir));

  writeStoryboard(plan, output, outputDir, framePaths, thumbnailPaths);
  writeCaptions(plan, outputDir);
  writeVoiceover(plan, outputDir);
  writeMetadata(plan, output, outputDir);

  const result = {
    id: output.id,
    platform: output.platform,
    aspectRatio: output.aspectRatio,
    storyboard: path.relative(root, path.join(outputDir, 'storyboard.html')),
    captions: path.relative(root, path.join(outputDir, 'captions.srt')),
    voiceover: path.relative(root, path.join(outputDir, 'voiceover-script.txt')),
    metadata: path.relative(root, path.join(outputDir, 'youtube-metadata.json')),
    frames: framePaths.map((framePath) => path.relative(root, framePath)),
    thumbnails: thumbnailPaths.map((thumbnailPath) => path.relative(root, thumbnailPath)),
    mp4: '',
  };

  if (args.mp4 && !args.storyboardOnly) {
    result.mp4 = path.relative(root, renderMp4(plan, output, outputDir, framePaths));
  }
  return result;
}

function writeManifest(plan, outDir, outputs) {
  const manifest = {
    plan: plan.id,
    title: plan.title,
    sourceUrl: plan.sourceUrl,
    durationSeconds: plan.durationSeconds,
    humanReviewRequired: plan.humanReviewRequired,
    outputs,
  };
  const manifestPath = path.join(outDir, 'manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifestPath;
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
  mkdirSync(outDir, { recursive: true });

  const outputs = resolveOutputs(plan, args.variant).map((output) => renderOutput(plan, output, outDir, args));
  const manifestPath = writeManifest(plan, outDir, outputs);
  const result = {
    plan: plan.id,
    outDir: path.relative(root, outDir),
    manifest: path.relative(root, manifestPath),
    outputs,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main();
