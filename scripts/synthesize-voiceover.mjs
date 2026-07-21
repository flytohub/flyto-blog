import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPlan = 'video/plans/community-growth-open-source-ai-workflow-automation.json';

function parseArgs(argv) {
  const args = { plan: defaultPlan, out: '', voice: '', rate: '', required: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') args.plan = argv[++index] ?? '';
    else if (arg === '--out') args.out = argv[++index] ?? '';
    else if (arg === '--voice') args.voice = argv[++index] ?? '';
    else if (arg === '--rate') args.rate = argv[++index] ?? '';
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = JSON.parse(readFileSync(insideRoot(args.plan), 'utf8'));
  const narration = plan.scenes.map((scene) => scene.narration ?? `${scene.title}. ${scene.body}`).join(' ');
  const output = insideRoot(args.out || `video/dist/${plan.id}/shared/voiceover.mp3`);
  const scriptPath = path.join(path.dirname(output), 'voiceover-script.txt');
  const captionsPath = path.join(path.dirname(output), 'voiceover-captions.srt');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(scriptPath, `${narration}\n`);

  if (!hasCommand('edge-tts')) {
    if (args.required) throw new Error('edge-tts is required for automatic voiceover');
    console.warn('edge-tts is unavailable; voiceover script was generated without audio');
    return;
  }

  const voice = args.voice || plan.audio?.voice || 'en-US-AndrewMultilingualNeural';
  const rate = args.rate || plan.audio?.voiceRate || '+10%';
  execFileSync('edge-tts', [
    '--voice', voice,
    `--rate=${rate}`,
    '--text', narration,
    '--write-media', output,
    '--write-subtitles', captionsPath,
  ], { cwd: root, stdio: 'inherit' });
  if (!existsSync(output)) throw new Error('edge-tts did not create the voiceover');
  process.stdout.write(`${JSON.stringify({
    output: path.relative(root, output),
    script: path.relative(root, scriptPath),
    captions: path.relative(root, captionsPath),
    voice,
    rate,
  }, null, 2)}\n`);
}

main();
