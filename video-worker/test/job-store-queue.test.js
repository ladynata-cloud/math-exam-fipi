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
    retentionDays: 30, maxRetainedBytes: 20 * 1024 * 1024, maxOutputBytes: 1024 * 1024,
    maxPendingJobs: 5, maxJobsPerHour: 10, dailyTtsCharacterBudget: 300_000,
    maxTtsCharactersPerJob: 30_000,
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

test('graceful queue shutdown aborts active work and safely re-queues it', async (t) => {
  const config = await fixture(t);
  const store = await new JobStore(config).init();
  const job = await store.create(request);
  let signalWorkStarted;
  const workStarted = new Promise((resolve) => { signalWorkStarted = resolve; });
  const queue = new JobQueue(store, async (activeJob, activeStore, { signal }) => {
    await activeStore.update(activeJob.id, { status: 'rendering', attemptId: 'shutdown-attempt' });
    signalWorkStarted();
    await new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('cancelled by shutdown');
        error.code = 'JOB_ABORTED';
        reject(error);
      }, { once: true });
    });
  });
  queue.start();
  await workStarted;
  await queue.stop({ graceMs: 1000 });

  assert.equal(queue.running, false);
  assert.equal(store.get(job.id).status, 'queued');
  assert.equal(store.get(job.id).attemptId, null);
});

test('a failed metadata write never publishes an in-memory ghost job', async (t) => {
  const config = await fixture(t);
  const store = await new JobStore(config).init();
  const blocked = path.join(config.root, 'not-a-directory');
  await fs.writeFile(blocked, 'blocked');
  config.jobDir = blocked;
  await assert.rejects(store.create(request), (error) => error.code === 'PERSISTENCE_WRITE_FAILED');
  assert.equal(store.countPending(), 0);
  assert.equal(store.counts().queued, 0);
  assert.equal(store.health().ok, false);
});

test('admission enforces the retained media reservation quota', async (t) => {
  const config = await fixture(t);
  config.maxRetainedBytes = config.maxOutputBytes;
  const store = await new JobStore(config).init();
  await store.admit(request, 'storage-reservation-key-0001');
  await assert.rejects(
    store.admit({ ...request, task: '19' }, 'storage-reservation-key-0002'),
    (error) => error.status === 507 && error.code === 'MEDIA_QUOTA',
  );
});

test('admission enforces hourly jobs and daily reserved TTS characters', async (t) => {
  const config = await fixture(t);
  config.maxJobsPerHour = 1;
  const store = await new JobStore(config).init();
  await store.admit(request, 'budget-admission-key-0001');
  await assert.rejects(
    store.admit({ ...request, task: '19' }, 'budget-admission-key-0002'),
    (error) => error.code === 'HOURLY_JOB_BUDGET',
  );
  config.maxJobsPerHour = 10;
  config.dailyTtsCharacterBudget = 30_000;
  await assert.rejects(
    store.admit({ ...request, task: '19' }, 'budget-admission-key-0003'),
    (error) => error.code === 'DAILY_TTS_BUDGET',
  );
});
