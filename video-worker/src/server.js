import http from 'node:http';
import { createRequestHandler } from './app.js';
import { loadConfig } from './config.js';
import { JobQueue } from './job-queue.js';
import { JobStore } from './job-store.js';
import { createRenderer } from './renderer.js';
import { safeError } from './security.js';
import { createTts } from './tts.js';
import { WorkerLock } from './worker-lock.js';

let workerLock = null;
let server = null;
let queue = null;
let shuttingDown = false;
let shutdownGraceMs = 30_000;
const startupAbortController = new AbortController();
let resolveStartupDone;
const startupDone = new Promise((resolve) => { resolveStartupDone = resolve; });

async function closeHttpServer(graceMs) {
  if (!server) return;
  await new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => {
      server.closeAllConnections?.();
      finish();
    }, graceMs);
    server.close(finish);
  });
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  startupAbortController.abort();
  console.log(`Video worker stopping after ${signal}`);
  await startupDone;
  await Promise.all([
    closeHttpServer(shutdownGraceMs),
    queue ? queue.stop({ graceMs: shutdownGraceMs }) : Promise.resolve(),
  ]);
  if (workerLock) await workerLock.release().catch((error) => {
    console.error('Video worker lock release failed:', safeError(error));
  });
}

async function main() {
  try {
    const config = loadConfig();
    shutdownGraceMs = config.shutdownGraceMs;
    workerLock = new WorkerLock(config);
    await workerLock.acquire({ signal: startupAbortController.signal });
    if (shuttingDown) return;
    const store = await new JobStore(config, { lock: workerLock }).init();
    if (shuttingDown) return;
    const processor = createRenderer(config, createTts(config));
    queue = new JobQueue(store, processor);
    server = http.createServer(createRequestHandler({ config, store, queue }));
    server.requestTimeout = 30_000;
    server.headersTimeout = 15_000;
    server.listen(config.port, '0.0.0.0', () => {
      if (shuttingDown) return;
      console.log(`Mathexam video worker listening on port ${config.port}`);
      queue.start();
    });
  } finally {
    resolveStartupDone();
  }
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    shutdown(signal)
      .then(() => { process.exitCode = 0; })
      .catch((error) => {
        console.error('Video worker shutdown failed:', safeError(error));
        process.exitCode = 1;
      });
  });
}

main().catch(async (error) => {
  if (shuttingDown && error.code === 'WORKER_STARTUP_ABORTED') return;
  console.error('Video worker startup failed:', safeError(error));
  if (workerLock) await workerLock.release().catch(() => {});
  process.exitCode = 1;
});
