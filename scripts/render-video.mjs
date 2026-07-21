import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlan = 'video/plans/community-growth-open-source-ai-workflow-automation.json';
const brandLogoRelativePath = 'video/assets/flyto2-logo.png';
const brandLogoPath = path.join(root, brandLogoRelativePath);
const brandLogoDataUri = `data:image/png;base64,${readFileSync(path.join(root, brandLogoRelativePath)).toString('base64')}`;
const transitionSeconds = 0.45;
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
    voiceover: '',
    productDemo: '',
    mp4: false,
    storyboardOnly: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else if (arg === '--out-dir') args.outDir = argv[++index] ?? '';
    else if (arg === '--variant') args.variant = argv[++index] ?? '';
    else if (arg === '--voiceover') args.voiceover = argv[++index] ?? '';
    else if (arg === '--product-demo') args.productDemo = argv[++index] ?? '';
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
  node scripts/render-video.mjs --plan <plan.json> --voiceover <voice.mp3> --product-demo <demo.webm> --mp4
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

function sourceLabel(value) {
  try {
    return `${new URL(value).hostname} · canonical source`;
  } catch {
    return 'Flyto2 · canonical source';
  }
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

function lineTexts(lines, x, y, className, step) {
  return lines
    .map((line, offset) => `<text x="${x}" y="${y + offset * step}" class="${className}">${escapeHtml(line)}</text>`)
    .join('\n');
}

function logoImage(x, y, size) {
  return `<image href="${brandLogoDataUri}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
}

function writeFrame(plan, output, scene, index, outputDir) {
  const spec = outputSpec(output);
  const template = scene.template ?? ['editorial', 'product-demo', 'signal', 'proof'][index % 4];
  const titleLines = wrapWords(scene.title, spec.titleLimit).slice(0, 4);
  const bodyLines = wrapWords(scene.body, spec.bodyLimit).slice(0, output.aspectRatio === '9:16' ? 7 : 5);
  const bodyY = spec.titleY + titleLines.length * (spec.titleSize + 13) + 42;
  const sceneNo = `${String(index + 1).padStart(2, '0')}/${String(plan.scenes.length).padStart(2, '0')}`;
  const logoSize = output.aspectRatio === '9:16' ? 54 : output.aspectRatio === '1:1' ? 46 : 42;
  const logoY = spec.labelY - logoSize + 4;
  const brandX = spec.marginX + logoSize + 14;
  const palettes = {
    editorial: { bg: '#f6f7fb', panel: '#ffffff', stroke: '#d8dce8', title: '#111827', body: '#374151', small: '#64748b', cue: '#0f766e', label: '#6d28d9' },
    signal: { bg: '#0b1020', panel: '#111827', stroke: '#334155', title: '#f8fafc', body: '#cbd5e1', small: '#94a3b8', cue: '#67e8f9', label: '#c4b5fd' },
    proof: { bg: '#ecfdf5', panel: '#f8fafc', stroke: '#99f6e4', title: '#102a2a', body: '#334155', small: '#476368', cue: '#047857', label: '#6d28d9' },
    'product-demo': { bg: '#0b1020', panel: '#111827', stroke: '#475569', title: '#f8fafc', body: '#cbd5e1', small: '#94a3b8', cue: '#67e8f9', label: '#c4b5fd' },
  };
  const palette = palettes[template] ?? palettes.editorial;
  const panelX = spec.marginX - 30;
  const panelY = spec.labelY + 45;
  const panelWidth = spec.width - panelX * 2;
  const panelHeight = spec.height - spec.labelY - 145;
  const cueText = scene.visualCue ? escapeHtml(scene.visualCue) : '';
  let content;

  if (template === 'signal') {
    content = `
  <text x="${spec.width - spec.marginX}" y="${spec.height - 115}" class="number" text-anchor="end">${String(index + 1).padStart(2, '0')}</text>
  <rect x="${spec.marginX}" y="${spec.titleY - 64}" width="92" height="8" rx="4" class="accent"/>
  ${lineTexts(titleLines, spec.marginX, spec.titleY, 'title', spec.titleSize + 13)}
  ${lineTexts(bodyLines, spec.marginX, bodyY, 'body', spec.bodySize + 12)}
  ${cueText ? `<text x="${spec.marginX}" y="${spec.height - 120}" class="cue">${cueText}</text>` : ''}`;
  } else if (template === 'proof') {
    content = `
  <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="10" class="panel"/>
  <rect x="${panelX}" y="${panelY}" width="14" height="${panelHeight}" rx="7" class="accent"/>
  ${lineTexts(titleLines, spec.marginX + 18, spec.titleY, 'title', spec.titleSize + 13)}
  ${lineTexts(bodyLines, spec.marginX + 18, bodyY, 'body', spec.bodySize + 12)}
  ${cueText ? `<rect x="${spec.marginX + 18}" y="${spec.height - 158}" width="${spec.width - (spec.marginX + 18) * 2}" height="58" rx="6" class="cue-panel"/><text x="${spec.marginX + 40}" y="${spec.height - 120}" class="cue">${cueText}</text>` : ''}`;
  } else if (template === 'product-demo') {
    const demoY = output.aspectRatio === '16:9' ? 245 : output.aspectRatio === '1:1' ? 390 : 710;
    const demoHeight = output.aspectRatio === '16:9' ? 360 : output.aspectRatio === '1:1' ? 520 : 720;
    content = `
  ${lineTexts(titleLines.slice(0, 2), spec.marginX, spec.titleY - 35, 'title', spec.titleSize + 13)}
  <rect x="${panelX}" y="${demoY}" width="${panelWidth}" height="${demoHeight}" rx="12" class="demo"/>
  <circle cx="${panelX + 30}" cy="${demoY + 28}" r="6" class="dot-a"/>
  <circle cx="${panelX + 50}" cy="${demoY + 28}" r="6" class="dot-b"/>
  <circle cx="${panelX + 70}" cy="${demoY + 28}" r="6" class="dot-c"/>
  <text x="${spec.width / 2}" y="${demoY + demoHeight / 2}" class="demo-label" text-anchor="middle">LIVE FLYTO2 PRODUCT CAPTURE</text>`;
  } else {
    content = `
  <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="10" class="panel"/>
  ${lineTexts(titleLines, spec.marginX, spec.titleY, 'title', spec.titleSize + 13)}
  ${lineTexts(bodyLines, spec.marginX, bodyY, 'body', spec.bodySize + 12)}
  ${cueText ? `<text x="${spec.marginX}" y="${spec.height - 120}" class="cue">${cueText}</text>` : ''}`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">
  <defs>
    <style>
      .bg { fill: ${palette.bg}; }
      .panel { fill: ${palette.panel}; stroke: ${palette.stroke}; stroke-width: 1; }
      .stripe-a { fill: #7c3aed; }
      .stripe-b { fill: #0891b2; }
      .stripe-c { fill: #059669; }
      .accent { fill: #14b8a6; }
      .label { font: 760 19px Inter, Arial, sans-serif; letter-spacing: 4px; fill: ${palette.label}; }
      .title { font: 780 ${spec.titleSize}px Inter, Arial, sans-serif; fill: ${palette.title}; }
      .body { font: 440 ${spec.bodySize}px Inter, Arial, sans-serif; fill: ${palette.body}; }
      .small { font: 560 22px Inter, Arial, sans-serif; fill: ${palette.small}; }
      .mono { font: 620 18px ui-monospace, SFMono-Regular, Menlo, monospace; fill: ${palette.small}; }
      .cue { font: 650 23px Inter, Arial, sans-serif; fill: ${palette.cue}; }
      .cue-panel { fill: #d1fae5; }
      .number { font: 900 ${Math.round(spec.titleSize * 3.2)}px Inter, Arial, sans-serif; fill: #1e293b; }
      .demo { fill: #020617; stroke: #475569; stroke-width: 2; }
      .demo-label { font: 760 22px Inter, Arial, sans-serif; letter-spacing: 3px; fill: #94a3b8; }
      .dot-a { fill: #fb7185; } .dot-b { fill: #fbbf24; } .dot-c { fill: #34d399; }
    </style>
  </defs>
  <rect width="${spec.width}" height="${spec.height}" class="bg"/>
  <rect x="0" y="0" width="${spec.width}" height="12" class="stripe-a"/>
  <rect x="${Math.round(spec.width * 0.34)}" y="0" width="${Math.round(spec.width * 0.33)}" height="12" class="stripe-b"/>
  <rect x="${Math.round(spec.width * 0.67)}" y="0" width="${Math.round(spec.width * 0.33)}" height="12" class="stripe-c"/>
  ${logoImage(spec.marginX, logoY, logoSize)}
  <text x="${brandX}" y="${spec.labelY}" class="label">FLYTO2</text>
  <text x="${spec.width - spec.marginX}" y="${spec.labelY}" class="small" text-anchor="end">${escapeHtml(output.label)} ${sceneNo}</text>
  ${content}
  <text x="${spec.marginX}" y="${spec.height - 58}" class="mono">${escapeHtml(sourceLabel(plan.sourceUrl))}</text>
</svg>
`;
  const framePath = path.join(outputDir, 'frames', `scene-${String(index + 1).padStart(2, '0')}.svg`);
  writeFileSync(framePath, svg);
  return framePath;
}

function writeThumbnail(plan, output, thumbnail, index, outputDir) {
  const spec = outputSpec(output);
  const headlineLimit = output.aspectRatio === '9:16' ? 17 : output.aspectRatio === '1:1' ? 20 : 28;
  const subheadLimit = output.aspectRatio === '9:16' ? 24 : output.aspectRatio === '1:1' ? 32 : 38;
  const headlineLines = wrapWords(thumbnail.headline, headlineLimit).slice(0, 4);
  const subheadLines = wrapWords(thumbnail.subhead, subheadLimit).slice(0, 4);
  const titleSize = output.aspectRatio === '9:16' ? 82 : output.aspectRatio === '1:1' ? 72 : 64;
  const subheadSize = output.aspectRatio === '9:16' ? 36 : 30;
  const startY = output.aspectRatio === '9:16' ? 430 : output.aspectRatio === '1:1' ? 300 : 220;
  const subheadY = startY + headlineLines.length * (titleSize + 10) + 38;
  const keyword = plan.seo?.primaryKeyword ?? 'open-source AI workflow automation';
  const logoSize = output.aspectRatio === '9:16' ? 92 : 66;
  const logoY = output.aspectRatio === '9:16' ? 98 : 40;
  const kickerY = output.aspectRatio === '9:16' ? 176 : 100;
  const contentX = Math.round(spec.width * 0.08) + 32;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .shadow { fill: #eef2ff; }
      .kicker { font: 800 22px Inter, Arial, sans-serif; letter-spacing: 4px; fill: #0891b2; }
      .headline { font: 850 ${titleSize}px Inter, Arial, sans-serif; fill: #0f172a; }
      .subhead { font: 520 ${subheadSize}px Inter, Arial, sans-serif; fill: #334155; }
      .tag { font: 700 22px Inter, Arial, sans-serif; fill: #065f46; }
    </style>
  </defs>
  <rect width="${spec.width}" height="${spec.height}" class="bg"/>
  <rect x="${Math.round(spec.width * 0.08)}" y="${Math.round(spec.height * 0.12)}" width="${Math.round(spec.width * 0.84)}" height="${Math.round(spec.height * 0.76)}" rx="12" class="shadow"/>
  ${logoImage(contentX, logoY, logoSize)}
  <text x="${contentX + logoSize + 18}" y="${kickerY}" class="kicker">FLYTO2 ${String(index + 1).padStart(2, '0')}</text>
  ${lineTexts(headlineLines, contentX, startY, 'headline', titleSize + 10)}
  ${lineTexts(subheadLines, contentX, subheadY, 'subhead', subheadSize + 10)}
  <text x="${contentX}" y="${spec.height - 92}" class="tag">${escapeHtml(keyword)}</text>
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
  const captionsPath = path.join(outputDir, 'captions.srt');
  writeFileSync(captionsPath, `${blocks.join('\n')}\n`);
  return captionsPath;
}

function writeVoiceover(plan, outputDir) {
  const script = plan.scenes
    .map((scene, index) => `${index + 1}. ${scene.narration ?? `${scene.title} ${scene.body}`}`)
    .join('\n\n');
  const voiceoverPath = path.join(outputDir, 'voiceover-script.txt');
  writeFileSync(voiceoverPath, `${script}\n`);
  return voiceoverPath;
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
    execFileSync('which', [name], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function mediaDuration(filePath) {
  const value = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ], { encoding: 'utf8' }).trim();
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`cannot read media duration: ${filePath}`);
  return duration;
}

function renderStaticClip(output, pngPath, clipPath, duration) {
  const spec = outputSpec(output);
  const scaledWidth = Math.ceil(spec.width * 1.04 / 2) * 2;
  const scaledHeight = Math.ceil(spec.height * 1.04 / 2) * 2;
  const motion = `scale=${scaledWidth}:${scaledHeight},crop=${spec.width}:${spec.height}:x='(in_w-out_w)/2+6*sin(t*0.7)':y='(in_h-out_h)/2+4*cos(t*0.5)',fps=30,format=yuv420p`;
  execFileSync('ffmpeg', [
    '-y', '-loop', '1', '-framerate', '30', '-i', pngPath,
    '-t', duration.toFixed(3), '-vf', motion,
    '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
    clipPath,
  ], { stdio: 'inherit' });
}

function renderProductClip(output, demoPath, clipPath, duration) {
  const spec = outputSpec(output);
  const logoWidth = output.aspectRatio === '9:16' ? 112 : 82;
  const logoX = output.aspectRatio === '9:16' ? 70 : 56;
  const logoY = output.aspectRatio === '9:16' ? 54 : 34;
  const headerHeight = output.aspectRatio === '9:16' ? 180 : 124;
  const filter = [
    `[0:v]split=2[bgsrc][fgsrc]`,
    `[bgsrc]scale=${spec.width}:${spec.height}:force_original_aspect_ratio=increase,crop=${spec.width}:${spec.height},gblur=sigma=26,eq=brightness=-0.30[bg]`,
    `[fgsrc]scale=${spec.width}:${spec.height}:force_original_aspect_ratio=decrease[fg]`,
    `[bg][fg]overlay=(W-w)/2:(H-h)/2[base]`,
    `[1:v]scale=${logoWidth}:-1[logo]`,
    `[base]drawbox=x=0:y=0:w=iw:h=${headerHeight}:color=0x0b1020@0.78:t=fill[bar]`,
    `[bar][logo]overlay=${logoX}:${logoY},fps=30,format=yuv420p[out]`,
  ].join(';');
  execFileSync('ffmpeg', [
    '-y', '-stream_loop', '-1', '-i', demoPath,
    '-loop', '1', '-framerate', '30', '-i', brandLogoPath,
    '-t', duration.toFixed(3), '-filter_complex', filter, '-map', '[out]',
    '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
    clipPath,
  ], { stdio: 'inherit' });
}

function renderVisualMaster(clips, durations, outputPath) {
  const args = ['-y'];
  for (const clip of clips) args.push('-i', clip);
  if (clips.length === 1) {
    execFileSync('ffmpeg', [...args, '-map', '0:v', '-an', '-c:v', 'copy', outputPath], { stdio: 'inherit' });
    return;
  }

  const filters = clips.map((_, index) => `[${index}:v]settb=AVTB,setpts=PTS-STARTPTS,fps=30,format=yuv420p[v${index}]`);
  const transitions = ['fade', 'smoothleft', 'circleopen', 'wipeleft'];
  let current = 'v0';
  let offset = durations[0] - transitionSeconds;
  for (let index = 1; index < clips.length; index += 1) {
    const next = `x${index}`;
    const transition = transitions[(index - 1) % transitions.length];
    filters.push(`[${current}][v${index}]xfade=transition=${transition}:duration=${transitionSeconds}:offset=${offset.toFixed(3)}[${next}]`);
    current = next;
    offset += durations[index] - transitionSeconds;
  }
  execFileSync('ffmpeg', [
    ...args,
    '-filter_complex', filters.join(';'), '-map', `[${current}]`,
    '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
    outputPath,
  ], { stdio: 'inherit' });
}

function renderAmbientAudio(plan, outputPath) {
  const duration = plan.durationSeconds;
  const fadeOutStart = Math.max(0, duration - 1.8);
  const filter = [
    '[0:a]volume=0.032[a0]',
    '[1:a]volume=0.020[a1]',
    '[2:a]volume=0.014[a2]',
    `[a0][a1][a2]amix=inputs=3:duration=longest:normalize=0,lowpass=f=900,afade=t=in:st=0:d=1.2,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.8[a]`,
  ].join(';');
  execFileSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', `sine=frequency=110:sample_rate=48000:duration=${duration}`,
    '-f', 'lavfi', '-i', `sine=frequency=164.81:sample_rate=48000:duration=${duration}`,
    '-f', 'lavfi', '-i', `sine=frequency=220:sample_rate=48000:duration=${duration}`,
    '-filter_complex', filter, '-map', '[a]', '-c:a', 'pcm_s16le', outputPath,
  ], { stdio: 'inherit' });
}

function subtitleFilter(captionsPath, output) {
  const escaped = captionsPath.replaceAll('\\', '\\\\').replaceAll(':', '\\:').replaceAll("'", "\\'");
  const fontSize = output.aspectRatio === '9:16' ? 30 : output.aspectRatio === '1:1' ? 26 : 22;
  const margin = output.aspectRatio === '9:16' ? 150 : 55;
  const style = `FontName=DejaVu Sans,FontSize=${fontSize},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H99000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=${margin},Alignment=2`;
  return `subtitles=filename='${escaped}':force_style='${style}'`;
}

function muxProductionAudio(plan, output, visualPath, captionsPath, voiceoverPath, backgroundPath, mp4Path) {
  const voiceDuration = mediaDuration(voiceoverPath);
  const targetVoiceDuration = Math.max(1, plan.durationSeconds - 0.8);
  const tempo = Math.max(1, voiceDuration / targetVoiceDuration);
  if (tempo > 1.35) {
    throw new Error(`voiceover is too long (${voiceDuration.toFixed(1)}s for ${plan.durationSeconds}s); shorten narration`);
  }
  const backgroundVolume = Number(plan.audio?.backgroundVolume ?? 0.12);
  const audio = [
    `[1:a]atempo=${tempo.toFixed(4)},loudnorm=I=-18:TP=-2:LRA=11,apad=pad_dur=${plan.durationSeconds}[voice]`,
    `[2:a]volume=${backgroundVolume.toFixed(3)}[music]`,
    `[voice][music]amix=inputs=2:duration=longest:normalize=0,atrim=duration=${plan.durationSeconds},alimiter=limit=0.95[a]`,
  ].join(';');
  execFileSync('ffmpeg', [
    '-y', '-i', visualPath, '-i', voiceoverPath, '-i', backgroundPath,
    '-filter_complex', audio, '-vf', subtitleFilter(captionsPath, output),
    '-map', '0:v', '-map', '[a]', '-t', String(plan.durationSeconds),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
    mp4Path,
  ], { stdio: 'inherit' });
  return { voiceDuration, tempo };
}

function renderMp4(plan, output, outputDir, framePaths, captionsPath, voiceoverPath, productDemoPath) {
  for (const command of ['rsvg-convert', 'ffmpeg', 'ffprobe']) {
    if (!hasCommand(command)) throw new Error(`${command} is required for --mp4`);
  }
  if (!existsSync(voiceoverPath)) throw new Error(`voiceover is required: ${voiceoverPath}`);
  if (!existsSync(productDemoPath)) throw new Error(`product demo is required: ${productDemoPath}`);

  const workDir = path.join(outputDir, '.work');
  mkdirSync(workDir, { recursive: true });
  const pngPaths = framePaths.map((framePath) => framePath.replace(/\.svg$/, '.png'));
  for (const [index, framePath] of framePaths.entries()) {
    execFileSync('rsvg-convert', ['-o', pngPaths[index], framePath], { stdio: 'inherit' });
  }

  const clipDurations = plan.scenes.map((scene, index) => scene.durationSeconds + (index < plan.scenes.length - 1 ? transitionSeconds : 0));
  const clips = plan.scenes.map((scene, index) => {
    const clipPath = path.join(workDir, `scene-${String(index + 1).padStart(2, '0')}.mp4`);
    if (scene.template === 'product-demo') {
      renderProductClip(output, productDemoPath, clipPath, clipDurations[index]);
    } else {
      renderStaticClip(output, pngPaths[index], clipPath, clipDurations[index]);
    }
    return clipPath;
  });

  const visualPath = path.join(workDir, 'visual-master.mp4');
  const backgroundPath = path.join(workDir, 'generated-ambient.wav');
  renderVisualMaster(clips, clipDurations, visualPath);
  renderAmbientAudio(plan, backgroundPath);

  const mp4Path = path.join(outputDir, `${plan.id}-${output.id}.mp4`);
  const audio = muxProductionAudio(plan, output, visualPath, captionsPath, voiceoverPath, backgroundPath, mp4Path);
  rmSync(workDir, { recursive: true, force: true });
  return { mp4Path, audio };
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
  const captionsPath = writeCaptions(plan, outputDir);
  const voiceoverScriptPath = writeVoiceover(plan, outputDir);
  writeMetadata(plan, output, outputDir);

  const sharedDir = path.join(baseOutDir, 'shared');
  const voiceoverPath = args.voiceover ? path.resolve(root, args.voiceover) : path.join(sharedDir, 'voiceover.mp3');
  const productDemoPath = args.productDemo ? path.resolve(root, args.productDemo) : path.join(sharedDir, 'product-demo.webm');
  if (!voiceoverPath.startsWith(root) || !productDemoPath.startsWith(root)) {
    throw new Error('production media paths must stay inside the repository');
  }

  const result = {
    id: output.id,
    platform: output.platform,
    aspectRatio: output.aspectRatio,
    storyboard: path.relative(root, path.join(outputDir, 'storyboard.html')),
    captions: path.relative(root, captionsPath),
    voiceover: path.relative(root, voiceoverScriptPath),
    metadata: path.relative(root, path.join(outputDir, 'youtube-metadata.json')),
    frames: framePaths.map((framePath) => path.relative(root, framePath)),
    thumbnails: thumbnailPaths.map((thumbnailPath) => path.relative(root, thumbnailPath)),
    mp4: '',
    production: {
      templates: [...new Set(plan.scenes.map((scene) => scene.template))],
      transitions: ['fade', 'smoothleft', 'circleopen', 'wipeleft'],
      captionsBurned: false,
      productDemo: path.relative(root, productDemoPath),
      voiceoverAudio: path.relative(root, voiceoverPath),
      backgroundAudio: 'generated-ambient',
    },
  };

  if (args.mp4 && !args.storyboardOnly) {
    const rendered = renderMp4(plan, output, outputDir, framePaths, captionsPath, voiceoverPath, productDemoPath);
    result.mp4 = path.relative(root, rendered.mp4Path);
    result.production.captionsBurned = true;
    result.production.voiceoverDurationSeconds = Number(rendered.audio.voiceDuration.toFixed(3));
    result.production.voiceTempo = Number(rendered.audio.tempo.toFixed(4));
  }
  return result;
}

function writeManifest(plan, outDir, outputs) {
  const manifest = {
    plan: plan.id,
    title: plan.title,
    sourceUrl: plan.sourceUrl,
    brand: {
      name: 'Flyto2',
      logo: brandLogoRelativePath,
    },
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
