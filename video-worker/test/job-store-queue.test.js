import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { JobQueue } from '../src/job-queue.js';
import { JobStore } from '../src/job-store.js';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathexam-video-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return {
    root,
    jobDir: path.join(root, 'jobs'), mediaDir: path.join(root, 'videos'), workDir: path.join(root, 'work'),
    retentionDays: 30,
  };
}

const request = { task: '18', preset: 1, format: '16:9', captions: true };

test('job metadata persists and interrupted work is re-queued', async (t) => {
  const config = await fixture(t);
  const first = await new JobStore(config).init();
  const job = await first.create(request);
  await first.update(job.id, { status: 'rendering', progress: { stage: 'rendering', current: 2, total: 8 } });

  const second = await new JobStore(config).init();
  assert.equal(second.get(job.id).status, 'queued');
  assert.deepEqual(second.get(job.id).progress, { stage: 'queued', current: 0, total: 0 });
  const disk = JSON.parse(await fs.readFile(path.join(config.jobDir, `${job.id}.json`), 'utf8'));
  assert.equal(disk.status, 'queued');
});

test('queue processes jobs one at a time in creation order', async (t) => {
  const config = await fixture(t);
  const store = await new JobStore(config).init();
  const first = await store.create(request);
  const second = await store.create({ ...request, task: '19' });
  const events = [];
  const queue = new JobQueue(store, async (job, activeStore) => {
    events.push(`start:${job.request.task}`);
    await new Promise((resolve) => setTimeout(resolve, 15));
    events.push(`end:${job.request.task}`);
    await activeStore.update(job.id, { status: 'ready', output: path.join(config.mediaDir, `${job.id}.mp4`) });
  });
  queue.start();
  const deadline = Date.now() + 2000;
  while ((store.get(first.id).status !== 'ready' || store.get(second.id).status !== 'ready') && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.deepEqual(events, ['start:18', 'end:18', 'start:19', 'end:19']);
});
