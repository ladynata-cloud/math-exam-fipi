import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRequestHandler } from '../src/app.js';
import { JobStore } from '../src/job-store.js';

const origin = 'https://mathexam.space';
const token = 'integration-test-token-that-is-long-enough';

async function setup(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathexam-video-api-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const config = {
    jobDir: path.join(root, 'jobs'), mediaDir: path.join(root, 'videos'), workDir: path.join(root, 'work'),
    retentionDays: 30, allowedOrigins: [origin], adminToken: token, maxPendingJobs: 5,
  };
  const store = await new JobStore(config).init();
  const enqueued = [];
  const queue = { enqueue(id) { enqueued.push(id); } };
  const server = http.createServer(createRequestHandler({ config, store, queue }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  return { root, config, store, enqueued, base: `http://127.0.0.1:${address.port}` };
}

test('API rejects missing origins and missing bearer credentials', async (t) => {
  const { base } = await setup(t);
  const noOrigin = await fetch(`${base}/api/v1/jobs/x`);
  assert.equal(noOrigin.status, 403);
  const noToken = await fetch(`${base}/api/v1/jobs/x`, { headers: { Origin: origin } });
  assert.equal(noToken.status, 401);
  assert.equal(noToken.headers.get('access-control-allow-origin'), origin);
});

test('API creates, reads and downloads a sanitized durable job', async (t) => {
  const { base, config, store, enqueued } = await setup(t);
  const headers = { Origin: origin, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const createdResponse = await fetch(`${base}/api/v1/jobs`, {
    method: 'POST', headers,
    body: JSON.stringify({ task: '20', preset: 3, format: '9:16', captions: true }),
  });
  assert.equal(createdResponse.status, 202);
  const created = (await createdResponse.json()).job;
  assert.match(created.id, /^vid_/);
  assert.deepEqual(enqueued, [created.id]);

  const metadata = await fs.readFile(path.join(config.jobDir, `${created.id}.json`), 'utf8');
  assert.equal(metadata.includes(token), false);
  const statusResponse = await fetch(`${base}/api/v1/jobs/${created.id}`, { headers });
  assert.equal(statusResponse.status, 200);
  const status = (await statusResponse.json()).job;
  assert.equal(status.task, '20');
  assert.equal('output' in status, false);

  const output = path.join(config.mediaDir, `${created.id}.mp4`);
  await fs.writeFile(output, Buffer.from('fake-mp4'));
  await store.update(created.id, { status: 'ready', output });
  const video = await fetch(`${base}/api/v1/jobs/${created.id}/video`, { headers });
  assert.equal(video.status, 200);
  assert.equal(video.headers.get('content-type'), 'video/mp4');
  assert.equal(Buffer.from(await video.arrayBuffer()).toString(), 'fake-mp4');
});

test('API rejects arbitrary render fields and reports health without secrets', async (t) => {
  const { base } = await setup(t);
  const health = await fetch(`${base}/healthz`);
  assert.equal(health.status, 200);
  assert.deepEqual(Object.keys(await health.json()).sort(), ['ok', 'queue', 'service']);
  const response = await fetch(`${base}/api/v1/jobs`, {
    method: 'POST',
    headers: { Origin: origin, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: '18', preset: 1, format: '16:9', url: 'https://evil.test' }),
  });
  assert.equal(response.status, 400);
});

