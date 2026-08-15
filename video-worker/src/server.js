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

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Video worker stopping after ${signal}`);
  if (server) await new Promise((resolve) => server.close(resolve));
  if (queue) await queue.stop();
  if (workerLock) await workerLock.release().catch((error) => {
    console.error('Video worker lock release failed:', safeError(error));
  });
}

async function main() {
  const config = loadConfig();
  workerLock = await new WorkerLock(config).acquire();
  const store = await new JobStore(config, { lock: workerLock }).init();
  const processor = createRenderer(config, createTts(config));
  queue = new JobQueue(store, processor);
  server = http.createServer(createRequestHandler({ config, store, queue }));
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.listen(config.port, '0.0.0.0', () => {
    console.log(`Mathexam video worker listening on port ${config.port}`);
    queue.start();
  });
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
  console.error('Video worker startup failed:', safeError(error));
  if (workerLock) await workerLock.release().catch(() => {});
  process.exitCode = 1;
});
