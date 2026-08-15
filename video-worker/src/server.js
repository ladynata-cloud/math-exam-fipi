import http from 'node:http';
import { createRequestHandler } from './app.js';
import { loadConfig } from './config.js';
import { JobQueue } from './job-queue.js';
import { JobStore } from './job-store.js';
import { createRenderer } from './renderer.js';
import { safeError } from './security.js';
import { createTts } from './tts.js';

async function main() {
  const config = loadConfig();
  const store = await new JobStore(config).init();
  const processor = createRenderer(config, createTts(config));
  const queue = new JobQueue(store, processor);
  const server = http.createServer(createRequestHandler({ config, store, queue }));
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.listen(config.port, '0.0.0.0', () => {
    console.log(`Mathexam video worker listening on port ${config.port}`);
    queue.start();
  });
}

main().catch((error) => {
  console.error('Video worker startup failed:', safeError(error));
  process.exitCode = 1;
});

