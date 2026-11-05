// Full localhost integration gate for a normal CI runner. No Amvera endpoint,
// production credential, external speech service, or alternate renderer is used.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequestHandler } from '../video-worker/src/app.js';
import { loadConfig } from '../video-worker/src/config.js';
import { JobQueue } from '../video-worker/src/job-queue.js';
import { JobStore } from '../video-worker/src/job-store.js';
import { createRenderer } from '../video-worker/src/renderer.js';
import { createTts } from '../video-worker/src/tts.js';
import { WorkerLock } from '../video-worker/src/worker-lock.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0 && (!process.argv[outputIndex + 1] || process.argv[outputIndex + 1].startsWith('--'))) {
  throw new Error('--output requires a directory');
}
const output = path.resolve((outputIndex >= 0 ? process.argv[outputIndex + 1] : process.env.SOVIET_WORKER_OUTPUT_DIR)
  || path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'soviet-math-worker-check'));
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'soviet-math-worker-'));
const run = promisify(execFile);
const report = { scope: 'Real worker/Chromium/FFmpeg on localhost only; production Amvera is not verified.',
  task: 'soviet-motion-time', preset: 1, states: [], ok: false, browserSandbox: 'Production renderer launch options unchanged.' };
let staticServer, apiServer, queue, lock;
await fs.mkdir(output, { recursive: true });

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
  });
  return 'http://127.0.0.1:' + server.address().port;
}
async function close(server) {
  if (!server?.listening) return;
  server.closeIdleConnections?.();
  await new Promise(resolve => server.close(resolve));
}

try {
  staticServer = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      // The real renderer can fetch only this static origin; serve the authored
      // page dependencies, never a user-provided path or any persistent data.
      if (request.method !== 'GET' || !/^\/(?:soviet-math\/|trainers\/oge-basics\/multiplication-division\/)/.test(pathname)) {
        response.writeHead(404).end(); return;
      }
      const target = path.resolve(repo, '.' + pathname);
      if (!target.startsWith(repo + path.sep)) { response.writeHead(403).end(); return; }
      const bytes = await fs.readFile(target);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
      response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(bytes);
    } catch (_) { response.writeHead(404).end(); }
  });
  const staticOrigin = await listen(staticServer);
  const token = 'local-ci-fixture-' + crypto.randomBytes(24).toString('hex');
  const config = loadConfig({ NODE_ENV: 'test', VIDEO_DATA_DIR: temporary, VIDEO_TTS_PROVIDER: 'silent',
    VIDEO_ADMIN_TOKEN: token, VIDEO_ALLOWED_ORIGINS: staticOrigin,
    VIDEO_STUDIO_URL: staticOrigin + '/trainers/dvi/math-18-20-video-studio.html',
    VIDEO_COMMAND_TIMEOUT_SECONDS: '240', VIDEO_MAX_WORK_MB: '1024', VIDEO_MAX_OUTPUT_MB: '100' });
  lock = new WorkerLock(config); await lock.acquire();
  const store = await new JobStore(config, { lock }).init();
  // No browser substitution: this is the same processor and sandboxed Chromium
  // launch used by the deployed application.
  queue = new JobQueue(store, createRenderer(config, createTts(config)));
  apiServer = http.createServer(createRequestHandler({ config, store, queue }));
  const apiOrigin = await listen(apiServer); queue.start();
  const headers = { Origin: staticOrigin, Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json', 'Idempotency-Key': 'soviet-motion-time-ci-preset-1' };
  const request = JSON.stringify({ task: report.task, preset: 1, format: '16:9',
    captions: true, videoType: 'ideal-solution', audioMode: 'silent' });
  const health = await fetch(apiOrigin + '/healthz');
  assert.equal(health.status, 200); assert.equal((await health.json()).ok, true);
  const accepted = await fetch(apiOrigin + '/api/v1/jobs', { method: 'POST', headers, body: request });
  assert.equal(accepted.status, 202);
  let job = (await accepted.json()).job; report.jobId = job.id;
  const repeated = await fetch(apiOrigin + '/api/v1/jobs', { method: 'POST', headers, body: request });
  assert.equal(repeated.status, 200);
  const duplicate = await repeated.json(); assert.equal(duplicate.reused, true); assert.equal(duplicate.job.id, job.id);
  const deadline = Date.now() + 10 * 60_000;
  while (true) {
    if (!report.states.includes(job.status)) { report.states.push(job.status); console.log('LOCAL_WORKER_STATE', job.status); }
    if (job.status === 'ready') break;
    assert.notEqual(job.status, 'failed', 'Real render failed: ' + job.errorCode);
    assert.ok(Date.now() < deadline, 'Real render exceeded ten minutes');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const status = await fetch(apiOrigin + '/api/v1/jobs/' + job.id, { headers });
    assert.equal(status.status, 200); job = (await status.json()).job;
  }
  const downloaded = await fetch(apiOrigin + '/api/v1/jobs/' + job.id + '/video', { headers });
  assert.equal(downloaded.status, 200); assert.equal(downloaded.headers.get('content-type'), 'video/mp4');
  const bytes = Buffer.from(await downloaded.arrayBuffer()); assert.ok(bytes.length > 10_000);
  const movie = path.join(output, 'soviet-motion-time-worker.mp4'); await fs.writeFile(movie, bytes);
  assert.deepEqual(bytes, await fs.readFile(path.join(config.mediaDir, job.id + '.mp4')), 'API downloads the persisted worker output');
  const metadata = JSON.parse((await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', movie],
    { maxBuffer: 1024 * 1024 })).stdout);
  assert.equal(metadata.streams.length, 1, 'silent output has exactly one video stream and no audio');
  const video = metadata.streams[0];
  assert.equal(video.codec_type, 'video'); assert.equal(video.codec_name, 'h264');
  assert.equal(video.width, 1600); assert.equal(video.height, 900); assert.equal(video.pix_fmt, 'yuv420p');
  const seconds = Number(metadata.format.duration); assert.ok(seconds >= 90 && seconds <= 150, 'full six-scene explanation lasts 90–150 seconds');
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', movie, '-frames:v', '1', path.join(output, 'first-frame.png')]);
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(Math.max(0, seconds - .2)), '-i', movie,
    '-frames:v', '1', path.join(output, 'last-frame.png')]);
  const jobMetadata = await fs.readFile(path.join(config.jobDir, job.id + '.json'), 'utf8');
  assert.equal(jobMetadata.includes(token), false, 'the local fixture credential never enters persistent job metadata');
  Object.assign(report, { ok: true, bytes: bytes.length, seconds, width: video.width, height: video.height,
    audioStreams: 0, sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    expectedStages: store.counts(), frames: ['first-frame.png', 'last-frame.png'] });
  console.log('SOVIET_WORKER_LOCAL_OK', JSON.stringify(report));
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error);
  console.error('SOVIET_WORKER_LOCAL_FAILED', report.error); process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(output, 'worker-report.json'), JSON.stringify(report, null, 2) + '\n');
  if (queue) await queue.stop({ graceMs: 30_000 }).catch(error => { console.error(error.message); process.exitCode = 1; });
  await close(apiServer); await close(staticServer);
  if (lock) await lock.release();
  await fs.rm(temporary, { recursive: true, force: true });
}
