import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runCommand } from './command.js';
import { viewportFor } from './validation.js';

function validateManifest(manifest, task) {
  if (!manifest || manifest.format !== 'mathexam-video-manifest' || !Array.isArray(manifest.scenes)) {
    throw new Error('Studio returned an invalid scene manifest');
  }
  if (manifest.tab !== `t${task}` || manifest.scenes.length < 2 || manifest.scenes.length > 20) {
    throw new Error('Studio returned an unexpected scene set');
  }
  let total = 0;
  for (const scene of manifest.scenes) {
    if (!scene || typeof scene.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(scene.id)) {
      throw new Error('Studio returned an invalid scene identifier');
    }
    if (typeof scene.narration !== 'string' || !scene.narration.trim() || scene.narration.length > 5000) {
      throw new Error('Studio returned invalid narration');
    }
    total += scene.narration.length;
  }
  if (total > 30_000) throw new Error('Studio narration is too large');
  return manifest;
}

function jobAbortError() {
  const error = new Error('Video job was cancelled');
  error.code = 'JOB_ABORTED';
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw jobAbortError();
}

export async function launchBrowser(chromium, launchOptions, signal) {
  throwIfAborted(signal);
  const pending = chromium.launch(launchOptions);
  if (!signal) return pending;

  pending.then((launched) => {
    if (signal.aborted) launched.close().catch(() => {});
  }, () => {});
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(jobAbortError());
    signal.addEventListener('abort', onAbort, { once: true });
    pending.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', onAbort);
    });
  });
}

async function audioDuration(config, audioPath, signal) {
  const result = await runCommand(config.ffprobePath, [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', audioPath,
  ], { timeoutMs: config.commandTimeoutMs, signal });
  const duration = Number.parseFloat(result.stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0 || duration > 300) {
    throw new Error('Speech audio has an invalid duration');
  }
  return duration;
}

async function renderSegment(config, framePath, audioPath, targetPath, duration, signal) {
  await runCommand(config.ffmpegPath, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-loop', '1', '-framerate', '30', '-i', framePath, '-i', audioPath,
    '-t', duration.toFixed(3), '-r', '30',
    '-c:v', 'libx264', '-preset', 'medium', '-tune', 'stillimage',
    '-c:a', 'aac', '-b:a', '160k', '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-movflags', '+faststart', '-shortest', '-fs', String(config.maxOutputBytes), targetPath,
  ], {
    timeoutMs: config.commandTimeoutMs,
    monitorFile: targetPath,
    maxFileBytes: config.maxOutputBytes,
    signal,
  });
}

async function directoryBytes(directory) {
  let total = 0;
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) total += await directoryBytes(target);
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
      browser = await launchBrowser(chromium, {
        headless: true,
        chromiumSandbox: true,
        args: ['--disable-dev-shm-usage'],
        timeout: Math.min(config.commandTimeoutMs, 60_000),
      }, signal);
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
        ttsCharacters: ['openai', 'yandex'].includes(config.ttsProvider)
          ? manifest.scenes.reduce((total, scene) => total + scene.narration.length, 0)
          : 0,
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
