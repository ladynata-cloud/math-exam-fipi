import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { createRenderer, validateManifest } from '../video-worker/src/renderer.js';
import { viewportFor } from '../video-worker/src/validation.js';
import { silentDuration } from '../video-worker/src/tts.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const render = process.argv.includes('--render');
const outputIndex = process.argv.indexOf('--output');
const outputDir = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.resolve(repo, '..', 'self-study-deliverables');
const runtimeModules = process.env.NODE_PATH?.split(path.delimiter)[0] || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || path.join(repo, 'video-worker', 'node_modules');
const requireRuntime = createRequire(path.join(runtimeModules, 'package.json'));
const { chromium } = requireRuntime('playwright');
const run = promisify(execFile);
const allTasks = ['homework-help', 'linear-equation', 'adjacent-angles'];
const taskArgument = process.argv.find(argument => argument.startsWith('--tasks='));
const tasks = taskArgument ? taskArgument.slice('--tasks='.length).split(',') : allTasks;
assert.ok(tasks.length && tasks.every(task => allTasks.includes(task)), '--tasks must contain fixed pilot IDs');
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'self-study-local-check-'));
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || chromium.executablePath();
const report = {
  scope: 'Local authored pilot assets only. No production or external speech provider is contacted.',
  rendering: render, views: [], samples: [], errors: [],
  naturalVoiceVerified: false, browserSandbox: 'Disabled only in this local test wrapper; production launch options are unchanged.',
};
if (render && taskArgument) {
  const previous = JSON.parse(await fs.readFile(path.join(outputDir, 'render-report.json'), 'utf8'));
  report.views = previous.views.filter(view => !tasks.includes(view.task));
  report.samples = previous.samples.filter(sample => !tasks.includes(sample.task));
  report.preservedTaskResults = allTasks.filter(task => !tasks.includes(task));
}
const allowed = new Map([
  ['/video-lessons/studio.html', ['studio.html', 'text/html; charset=utf-8']],
  ['/video-lessons/studio.css', ['studio.css', 'text/css; charset=utf-8']],
  ['/video-lessons/studio.js', ['studio.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/export.js', ['export.js', 'text/javascript; charset=utf-8']],
]);
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const item = allowed.get(pathname);
    if (!item || request.method !== 'GET') { response.writeHead(404); response.end(); return; }
    const content = await fs.readFile(path.join(repo, 'video-lessons', item[0]));
    response.writeHead(200, { 'Content-Type': item[1], 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(500); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

// Only the locally served, authored fixture is reachable. This dependency is
// internal to the check, never a production environment variable or API field.
const localChromium = {
  async launch(options) {
    const browser = await chromium.launch({ ...options, executablePath, chromiumSandbox: false });
    const originalNewContext = browser.newContext.bind(browser);
    browser.newContext = async contextOptions => {
      const context = await originalNewContext(contextOptions);
      await context.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith('data:') || url.startsWith('blob:') || new URL(url).origin === origin) return route.continue();
        return route.abort();
      });
      context.on('page', page => {
        page.on('pageerror', error => report.errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
      });
      return context;
    };
    return browser;
  },
};

async function putCaption(page, text, portrait) {
  await page.evaluate(({ text, portrait }) => {
    let caption = document.getElementById('check-caption');
    if (!caption) { caption = document.createElement('div'); caption.id = 'check-caption'; document.body.appendChild(caption); }
    caption.textContent = text;
    Object.assign(caption.style, {
      position: 'fixed', left: portrait ? '28px' : '40px', right: portrait ? '28px' : '40px', bottom: '20px',
      padding: '16px 22px', font: `${portrait ? 24 : 22}px/1.4 system-ui, sans-serif`, boxSizing: 'border-box',
      whiteSpace: 'normal', overflowWrap: 'anywhere', color: 'white', background: 'rgba(20,27,45,.91)', borderRadius: '18px', textAlign: 'center',
    });
  }, { text, portrait });
}

async function inspectFrame(page, portrait) {
  return page.evaluate(({ portrait }) => {
    const failures = [];
    const canvas = document.querySelector('.canvas').getBoundingClientRect();
    for (const selector of ['.lesson-frame h2', '#condition', '#step-panel', '.frame-footer']) {
      const element = document.querySelector(selector), box = element.getBoundingClientRect();
      if (box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > canvas.bottom + 1) failures.push(`${selector} outside reserved scene area`);
      if (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1) failures.push(`${selector} content overflow`);
    }
    const caption = document.getElementById('check-caption'), box = caption.getBoundingClientRect();
    if (box.height > (portrait ? 320 : 220) || box.top < canvas.bottom - 1 || box.bottom > innerHeight) failures.push('caption outside its reserved area');
    if (document.documentElement.scrollWidth > innerWidth + 1) failures.push('horizontal page overflow');
    return { failures, captionHeight: Math.round(box.height), canvasHeight: Math.round(canvas.height) };
  }, { portrait });
}

let browser;
try {
  await fs.mkdir(path.join(outputDir, 'screenshots'), { recursive: true });
  browser = await localChromium.launch({ headless: true, chromiumSandbox: true });
  for (const format of ['16:9', '9:16']) {
    const portrait = format === '9:16';
    const context = await browser.newContext({ viewport: viewportFor(format, tasks[0]), serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.goto(`${origin}/video-lessons/studio.html?studio=1`);
    await page.waitForFunction(() => window.__MATH_EXAM_VIDEO_READY__);
    for (const task of tasks) {
      for (const preset of [1, 2, 3]) {
        const manifest = validateManifest(await page.evaluate(({ task, preset }) => window.MathExamVideoStudio.prepare(`t${task}`, preset, 'ideal-solution'), { task, preset }), task, 'ideal-solution');
        const view = { task, preset, format, scenes: [] };
        report.views.push(view);
        for (const scene of manifest.scenes) {
          await page.evaluate(({ task, id }) => window.MathExamVideoStudio.show(`t${task}`, id, 'ideal-solution'), { task, id: scene.id });
          await putCaption(page, scene.narration, portrait);
          await page.evaluate(() => document.fonts.ready);
          const layout = await inspectFrame(page, portrait);
          view.scenes.push({ id: scene.id, action: scene.action, click: scene.click, readingSeconds: silentDuration(scene.narration, scene.duration_hint_ms), ...layout });
          if (layout.failures.length) {
            await page.screenshot({ path: path.join(outputDir, 'screenshots', `failure-${task}-${preset}-${portrait ? 'portrait' : 'landscape'}-${scene.id}.png`) });
            report.errors.push(`${task} preset ${preset} ${format} scene ${scene.id}: ${layout.failures.join('; ')}`);
          }
          if (preset === 1 && scene === manifest.scenes[2]) {
            await page.screenshot({ path: path.join(outputDir, 'screenshots', `${task}-${portrait ? 'portrait' : 'landscape'}.png`) });
          }
        }
      }
    }
    await context.close();
  }
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const mobile = await mobileContext.newPage();
  await mobile.goto(`${origin}/video-lessons/studio.html`);
  await mobile.waitForFunction(() => window.__MATH_EXAM_VIDEO_READY__);
  const firstStep = mobile.locator('#transcript button').first();
  await firstStep.focus(); await mobile.keyboard.press('Enter');
  assert.equal(await mobile.locator('#scene-count').textContent(), '1 / 12');
  await mobile.locator('#next').focus(); await mobile.keyboard.press('Enter');
  assert.equal(await mobile.locator('#scene-count').textContent(), '2 / 12');
  await mobile.locator('#hint-one summary').focus(); await mobile.keyboard.press('Space');
  assert.equal(await mobile.locator('#hint-one').getAttribute('open'), '');
  await mobile.locator('#answer').fill('Сначала своя попытка'); await mobile.keyboard.press('Enter');
  assert.ok((await mobile.locator('#feedback').textContent()).length > 0);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  await mobile.locator('.reader').scrollIntoViewIfNeeded();
  await mobile.screenshot({ path: path.join(outputDir, 'screenshots', 'reader-390.png'), fullPage: true });
  report.mobile = { width: 390, keyboardStepNavigation: true, keyboardHint: true, practiceSubmit: true, horizontalOverflow: false };
  await mobileContext.close();
  await browser.close(); browser = null;
  assert.deepEqual(report.errors, [], 'browser layout, console or page errors');
  for (const file of await fs.readdir(path.join(outputDir, 'screenshots'))) {
    if (file.startsWith('failure-') && file.endsWith('.png')) await fs.rm(path.join(outputDir, 'screenshots', file));
  }
  console.log(`Browser checks passed: ${tasks.length * 6} task/preset/format journeys and 390px keyboard reader.`);

  if (render) {
    const mediaDir = path.join(temp, 'videos');
    const workDir = path.join(temp, 'work');
    await fs.mkdir(mediaDir); await fs.mkdir(workDir);
    const config = {
      ttsProvider: 'silent', studioUrl: `${origin}/video-lessons/studio.html`, mediaDir, workDir,
      ffmpegPath: 'ffmpeg', ffprobePath: '/nonexistent/no-audio-ffprobe', commandTimeoutMs: 180_000,
      maxOutputBytes: 100 * 1024 * 1024, maxWorkBytes: 1024 * 1024 * 1024,
    };
    let externalTtsCalls = 0;
    const renderer = createRenderer(config, { synthesize: () => { externalTtsCalls++; throw new Error('external speech must not be called'); } }, { chromium: localChromium });
    for (const task of tasks) {
      console.log(`Rendering ${task}: original reading pauses, local clicks only.`);
      const updates = [];
      const job = { id: `local-${task}`, ttsProvider: 'silent', request: { task, preset: 1, format: '16:9', captions: true, videoType: 'ideal-solution', audioMode: 'clicks' } };
      await renderer(job, { assertOwnership: async () => {}, update: async (_id, update) => updates.push(update) });
      assert.equal(updates.at(-1).status, 'ready');
      const destination = path.join(outputDir, `${task}.mp4`);
      await fs.copyFile(updates.at(-1).output, destination);
      const metadata = JSON.parse((await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', destination])).stdout);
      assert.equal(metadata.streams.filter(stream => stream.codec_type === 'audio').length, 1);
      assert.equal(metadata.streams.find(stream => stream.codec_type === 'audio').codec_name, 'aac');
      const video = metadata.streams.find(stream => stream.codec_type === 'video');
      assert.equal(video.width, 1280); assert.equal(video.height, 720);
      const expectedDuration = report.views.find(view => view.task === task && view.preset === 1 && view.format === '16:9').scenes.reduce((total, scene) => total + scene.readingSeconds, 0);
      assert.ok(Math.abs(Number(metadata.format.duration) - expectedDuration) < 2, 'reading pauses preserved in completed clip');
      const bytes = await fs.readFile(destination);
      report.samples.push({ task, file: path.basename(destination), durationSeconds: Number(metadata.format.duration), expectedReadingSeconds: expectedDuration, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), audio: 'AAC local clicks and silence; no narration', states: [...new Set(updates.map(update => update.status).filter(Boolean))], temporaryWorkClean: (await fs.readdir(workDir)).length === 0 });
      assert.equal(externalTtsCalls, 0);
      console.log(`Ready ${task}: ${metadata.format.duration}s, ${bytes.length} bytes.`);
    }
    report.externalTtsCalls = externalTtsCalls;
  }
  assert.deepEqual(report.errors, [], 'complete renderer console or page errors');
  const sheetScript = 'from PIL import Image,ImageDraw\nimport sys\nfiles=sys.argv[2:]\nout=Image.new("RGB",(1080,500),"#eef2f0")\nd=ImageDraw.Draw(out)\nfor i,f in enumerate(files):\n im=Image.open(f).convert("RGB"); im.thumbnail((350,210)); x=(i%3)*360+(360-im.width)//2; y=(i//3)*250+18; out.paste(im,(x,y)); d.text(((i%3)*360+10,(i//3)*250+235),f.rsplit("/",1)[-1],fill="#17302d")\nout.save(sys.argv[1])';
  await run('python3', ['-c', sheetScript, path.join(outputDir, 'contact-sheet.png'), ...['landscape', 'portrait'].flatMap(format => allTasks.map(task => path.join(outputDir, 'screenshots', `${task}-${format}.png`)))]);
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error.message;
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  await fs.rm(temp, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, render ? 'render-report.json' : 'browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (render && report.passed) {
    await fs.writeFile(path.join(outputDir, 'browser-report.json'), `${JSON.stringify({
      scope: report.scope, passed: true, views: report.views, mobile: report.mobile, errors: report.errors,
      ...(report.preservedTaskResults ? { preservedTaskResults: report.preservedTaskResults } : {}),
    }, null, 2)}\n`);
  }
}
