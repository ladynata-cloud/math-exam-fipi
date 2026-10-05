import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runCommand } from '../video-worker/src/command.js';
import { createRenderer } from '../video-worker/src/renderer.js';

// Render fixed, repository-authored lessons locally. No hosting session, speech
// credentials, remote content or production queue is used by this CLI.
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixedTasks = ['linear-equation', 'adjacent-angles', 'negative-numbers', 'fractions', 'brackets', 'proportions', 'percentages',
  'numeric-expressions', 'variable-expressions', 'compare-expressions', 'arithmetic-properties',
  'identities', 'equation-roots', 'linear-cases', 'equation-word-problems', 'homework-help',
  'grade7-a-opposite-expression', 'grade7-a-two-variable-collect', 'grade7-a-equation-two-brackets', 'grade7-a-equation-denominators', 'grade7-a-equation-decimals', 'grade7-g-segment-order', 'grade7-g-midpoint-chain', 'grade7-g-angle-addition', 'grade7-g-angle-bisector', 'grade7-g-adjacent-equation', 'grade7-b-mixed-borrow', 'grade7-b-fraction-product-cancel', 'grade7-b-decimal-divisor-scale', 'grade7-b-signed-fraction-sum', 'grade7-b-percent-proportion'];
const value = name => process.argv.find(argument => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
const output = value('output');
assert.ok(output, 'Pass --output=directory for rendered clips and their manifest');
for (const argument of process.argv.slice(2)) assert.match(argument, /^--(?:output|tasks|preset|format)=.+$/, 'Unknown render option');
const outputDir = path.resolve(output);
const tasks = value('tasks')?.split(',') || fixedTasks.filter(task => task !== 'homework-help');
assert.ok(tasks.length && tasks.every(task => fixedTasks.includes(task)), 'Only fixed authored school task IDs may be rendered');
assert.equal(new Set(tasks).size, tasks.length, 'Duplicate task IDs are not supported');
const preset = Number(value('preset') || 1), format = value('format') || '16:9';
assert.ok([1, 2, 3].includes(preset), 'Preset must be 1, 2 or 3');
assert.ok(['16:9', '9:16'].includes(format), 'Format must be 16:9 or 9:16');
const modules = process.env.NODE_PATH?.split(path.delimiter)[0] || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || path.join(repo, 'video-worker', 'node_modules');
const requireRuntime = createRequire(path.join(modules, 'package.json'));
const { chromium } = requireRuntime('playwright');
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || chromium.executablePath();
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'grade7-authored-video-'));
const mediaDir = path.join(root, 'media'), workDir = path.join(root, 'work');
await fs.mkdir(mediaDir); await fs.mkdir(workDir); await fs.mkdir(outputDir, { recursive: true });
const files = new Map([
  ['studio.html', 'text/html; charset=utf-8'], ['studio.css', 'text/css; charset=utf-8'],
  ['studio.js', 'text/javascript; charset=utf-8'], ['export.js', 'text/javascript; charset=utf-8'],
  ['cheatsheet-topics.js', 'text/javascript; charset=utf-8'],
  ['motion.js', 'text/javascript; charset=utf-8'], ['motion-topics.js', 'text/javascript; charset=utf-8'],
  ['makarychev7-videos.js', 'text/javascript; charset=utf-8'],
  ['grade7-next-videos.js', 'text/javascript; charset=utf-8'],
].map(([name, type]) => [`/video-lessons/${name}`, { name, type }]));
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const file = files.get(pathname);
    if (request.method !== 'GET' || !file) { response.writeHead(404); response.end(); return; }
    const content = await fs.readFile(path.join(repo, 'video-lessons', file.name));
    response.writeHead(200, { 'Content-Type': file.type, 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(500); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const errors = [];
const localChromium = {
  async launch(options) {
    // Test-only wrapper around the renderer's dependency injection. Production
    // Chromium sandbox flags are unchanged; only this loopback fixture uses the
    // local runtime's browser executable and sandbox accommodation.
    const browser = await chromium.launch({ ...options, executablePath, chromiumSandbox: false });
    const original = browser.newContext.bind(browser);
    browser.newContext = async contextOptions => {
      const context = await original(contextOptions);
      await context.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith('data:') || url.startsWith('blob:') || new URL(url).origin === origin) return route.continue();
        errors.push('Blocked a non-local browser request');
        return route.abort();
      });
      context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
      return context;
    };
    return browser;
  },
};
const abort = new AbortController();
const onSignal = () => abort.abort();
process.once('SIGINT', onSignal); process.once('SIGTERM', onSignal);
const report = { format, preset, audio: 'No audio stream', motionFps: 12, samples: [], externalSpeechCalls: 0 };
try {
  const renderer = createRenderer({
    ttsProvider: 'silent', studioUrl: `${origin}/video-lessons/studio.html`, mediaDir, workDir,
    ffmpegPath: 'ffmpeg', ffprobePath: '/nonexistent/silent-lessons-do-not-probe-speech',
    commandTimeoutMs: 180_000, maxOutputBytes: 100 * 1024 * 1024, maxWorkBytes: 1024 * 1024 * 1024,
  }, { synthesize() { report.externalSpeechCalls++; throw new Error('School lessons must not synthesize speech'); } }, { chromium: localChromium });
  for (const task of tasks) {
    console.log(`Rendering ${task}: authored motion, full reading pauses, no audio.`);
    const updates = [];
    await renderer({ id: `local-${task}`, ttsProvider: 'silent', request: { task, preset, format, captions: true, audioMode: 'silent' } }, {
      assertOwnership: async () => {}, update: async (_id, update) => updates.push(update),
    }, { signal: abort.signal });
    assert.equal(updates.at(-1).status, 'ready');
    assert.deepEqual(errors, [], 'Authored browser must have no errors or non-local requests');
    const target = path.join(outputDir, `${task}.mp4`);
    await fs.copyFile(updates.at(-1).output, target);
    const metadata = JSON.parse((await runCommand('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', target], { signal: abort.signal })).stdout);
    assert.equal(metadata.streams.filter(stream => stream.codec_type === 'audio').length, 0);
    const video = metadata.streams.filter(stream => stream.codec_type === 'video');
    assert.equal(video.length, 1);
    assert.deepEqual([video[0].width, video[0].height], format === '16:9' ? [1280, 720] : [720, 1280]);
    assert.deepEqual(await fs.readdir(workDir), [], 'Completed render cleans temporary work');
    const bytes = await fs.readFile(target);
    report.samples.push({ task, file: path.basename(target), durationSeconds: Number(metadata.format.duration), bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), audioStreams: 0 });
    await fs.writeFile(path.join(outputDir, 'grade7-render-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Ready ${task}: ${metadata.format.duration}s, ${bytes.length} bytes, audio streams: 0.`);
  }
  assert.equal(report.externalSpeechCalls, 0);
  console.log('GRADE7_SILENT_RENDER_OK');
} finally {
  process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal);
  await new Promise(resolve => server.close(resolve));
  await fs.rm(root, { recursive: true, force: true });
}
