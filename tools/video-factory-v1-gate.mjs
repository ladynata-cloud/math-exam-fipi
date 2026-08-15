import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function count(source, pattern) { return (source.match(pattern) || []).length; }

const studio = read('trainers/dvi/math-18-20-video-studio.html');
const config = read('video-worker/src/config.js');
const renderer = read('video-worker/src/renderer.js');
const app = read('video-worker/src/app.js');
const command = read('video-worker/src/command.js');
const queue = read('video-worker/src/job-queue.js');
const jobStore = read('video-worker/src/job-store.js');
const lock = read('video-worker/src/worker-lock.js');
const tts = read('video-worker/src/tts.js');
const docker = read('video-worker/Dockerfile');
const packageLock = read('video-worker/package-lock.json');
const adr = read('docs/adr/0002-video-f×¾ô¶‰žËkºwµç`if (entry.isDirectory()) total += await directoryBytes(target);
    else if (entry.isFile()) total += (await fs.stat(target)).size;
  }
  return total;
}

async function enforceWorkBudget(config, directory) {
  if (await directoryBytes(directory) > config.maxWorkBytes) {
    const error = new Error('Per-job working disk budget exceeded');
    error.code = 'WORK_BUDGET_EXCEEDED';
    throw error;
  }
}

async function addCaption(page, caption, enabled, portrait) {
  await page.evaluate(({ text, visible, isPortrait }) => {
    let box = document.getElementById('mathexam-video-caption');
    if (!box) {
      box = document.createElement('div');
      box.id = 'mathexam-video-caption';
      document.body.appendChild(box);
    }
    box.textContent = text;
    Object.assign(box.style, {
      display: visible ? 'block' : 'none',
      position: 'fixed',
      zIndex: '2147483647',
      left: isPortrait ? '42px' : '80px',
      right: isPortrait ? '42px' : '80px',
      bottom: isPortrait ? '90px' : '46px',
      padding: isPortrait ? '28px 32px' : '20px 28px',
      borderRadius: '18px',
      background: 'rgba(20, 27, 45, .91)',
      color: '#fff',
      font: `${isPortrait ? 36 : 30}px/1.35 system-ui, sans-serif`,
      textAlign: 'center',
      boxShadow: '0 10px 35px rgba(0,0,0,.25)',
    });
  }, { text: caption, visible: enabled, isPortrait: portrait });
}

export function createRenderer(config, tts) {
  return async function processJob(job, store, options = {}) {
    const { signal } = options;
    const attemptId = crypto.randomBytes(12).toString('base64url');
    const working = path.join(config.workDir, `${job.id}-${attemptId}`);
    const output = path.join(config.mediaDir, `${job.id}.mp4`);
    const request = job.request;
    const viewport = viewportFor(request.format);
    let browser;
    let temporaryOutput;
    const closeBrowser = () => { if (browser) browser.close().catch(() => {}); };
    signal?.addEventListener('abort', closeBrowser, { once: true });
    await fs.rm(working, { recursive: true, force: true });
    await fs.mkdir(working, { recursive: true });

    try {
      throwIfAborted(signal);
      await store.assertOwnership();
      const { chromium } = await import('playwright');
      browser = await chromium.launch({
        headless: true,
        chromiumSandbox: true,
        args: ['--disable-dev-shm-usage'],
        timeout: Math.min(config.commandTimeoutMs, 60_000),
      });
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: 'block' });
      const page = await context.newPage();
      const trustedOrigin = new URL(config.studioUrl).origin;
      await page.route('**/*', async (route) => {
        const url = route.request().url();
        if (url.startsWith('data:') || url.startsWith('blob:') || new URL(url).origin === trustedOrigin) {
          await route.continue();
        } else {
          await route.abort();
        }
      });
      const studio = new URL(config.studioUrl);
      studio.searchParams.set('studio', '1');
      await page.goto(studio.toString(), { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.waitForFunction(() => window.__MATH_EXAM_VIDEO_READY__ === true, null, { timeout: 20_000 });
      const manifest = validateManifest(await page.evaluate(
        ({ tab, preset }) => window.MathExamVideoStudio.prepare(tab, preset),
        { tab: `t${request.task}`, preset: request.preset },
      ), request.task);

      const audioFiles = [];
      throwIfAborted(signal);
      await store.update(job.id, {
        status: 'synthesizing',
        progress: { stage: 'synthesizing', current: 0, total: manifest.scenes.length },
        errorCode: null,
        attemptId,
        ttsCharacters: manifest.scenes.reduce((total, scene) => total + scene.narration.length, 0),
      });
      for (let index = 0; index < manifest.scenes.length; index++) {
        throwIfAborted(signal);
        await store.assertOwnership();
        const scene = manifest.scenes[index];
        audioFiles.push(await tts.synthesize(
          scene.narration,
          path.join(working, `audio-${String(index).padStart(3, '0')}`),
          { signal },
        ));
        await enforceWorkBudget(config, working);
        await store.update(job.id, {
          progress: { stage: 'synthesizing', current: index + 1, total: manifest.scenes.length },
        });
      }

      await store.update(job.id, {
        status: 'rendering',
        progress: { stage: 'rendering', current: 0, total: manifest.scenes.length },
      });
      const segments = [];
      for (let index = 0; index < manifest.scenes.length; index++) {
        throwIfAborted(signal);
        await store.assertOwnership();
        const scene = manifest.scenes[index];
        await page.evaluate(
          ({ tab, id }) => window.MathExamVideoStudio.show(tab, id),
          { tab: `t${request.task}`, id: scene.id },
        );
        await addCaption(page, scene.narration, request.captions, request.format === '9:16');
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await page.waitForTimeout(120);
        const frame = path.join(working, `frame-${String(index).padStart(3, '0')}.png`);
        const segment = path.join(working, `segment-${String(index).padStart(3, '0')}.mp4`);
        await page.screenshot({ path: frame, fullPage: false });
        const duration = await audioDuration(config, audioFiles[index], signal);
        await renderSegment(config, frame, audioFiles[index], segment, duration, signal);
        await enforceWorkBudget(config, working);
        segments.push(path.basename(segment));
        await store.update(job.id, {
          progress: { stage: 'rendering', current: index + 1, total: manifest.scenes.length },
        });
      }
      const concatFile = path.join(working, 'segments.txt');
      await fs.writeFile(concatFile, `${segments.map((name) => `file '${name}'`).join('\n')}\n`, 'utf8');
      temporaryOutput = `${output}.${attemptId}.tmp.mp4`;
      await runCommand(config.ffmpegPath, [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'concat', '-safe', '0', '-i', path.basename(concatFile),
        '-c', 'copy', '-movflags', '+faststart', '-fs', String(config.maxOutputBytes), temporaryOutput,
      ], {
        cwd: working,
        timeoutMs: config.commandTimeoutMs,
        monitorFile: temporaryOutput,
        maxFileBytes: config.maxOutputBytes,
        signal,
      });
      const stat = await fs.stat(temporaryOutput);
      if (!stat.size || stat.size > config.maxOutputBytes) throw new Error('Rendered video has an invalid size');
      throwIfAborted(signal);
      await store.assertOwnership();
      await fs.rename(temporaryOutput, output);
      temporaryOutput = null;
      await store.update(job.id, {
        status: 'ready',
        progress: { stage: 'ready', current: manifest.scenes.length, total: manifest.scenes.length },
        output,
        errorCode: null,
        attemptId: null,
      });
    } finally {
      signal?.removeEventListener('abort', closeBrowser);
      if (browser) await browser.close().catch(() => {});
      if (temporaryOutput) await fs.rm(temporaryOutput, { force: true }).catch(() => {});
      await fs.rm(working, { recursive: true, force: true }).catch(() => {});
    }
  };
}
