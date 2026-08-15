import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runCommand } from '../src/command.js';
import { JobStore } from '../src/job-store.js';
import { publicJob, safeError } from '../src/security.js';
import { writeSpeechResponse } from '../src/tts.js';
import { WorkerLock } from '../src/worker-lock.js';

async function rootFixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathexam-video-hardening-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('worker lock prevents overlapping recovery and permits a clean handoff', async (t) => {
  const root = await rootFixture(t);
  const lockConfig = { dataDir: root, workerLockWaitMs: 0 };
  const firstLock = await new WorkerLock(lockConfig).acquire();
  t.after(() => firstLock.release());
  const overlappingLock = new WorkerLock(lockConfig);
  await assert.rejects(overlappingLock.acquire(), (error) => error.code === 'WORKER_LOCKED');

  const storeConfig = {
    ...lockConfig,
    jobDir: path.join(root, 'jobs'), mediaDir: path.join(root, 'videos'), workDir: path.join(root, 'work'),
    retentionDays: 30, maxRetainedBytes: 20 * 1024 * 1024, maxOutputBytes: 1024 * 1024,
  };
  const firstStore = await new JobStore(storeConfig, { lock: firstLock }).init();
  const request = { task: '18', preset: 1, format: '16:9', captions: true };
  const job = await firstStore.create(request);
  await firstStore.update(job.id, { status: 'rendering', attemptId: 'first-attempt' });
  await firstLock.release();
  assert.equal(firstStore.health().ok, false);

  const secondLock = await new WorkerLock(lockConfig).acquire();
  t.after(() => secondLock.release());
  const recovered = await new JobStore(storeConfig, { lock: secondLock }).init();
  assert.equal(recovered.get(job.id).status, 'queued');
  assert.equal(recovered.get(job.id).attemptId, null);
});

test('worker lock never performs an automatic stale takeover', async (t) => {
  const root = await rootFixture(t);
  const lockConfig = {
    dataDir: root, workerLockWaitMs: 0, workerLockHeartbeatMs: 60_000,
  };
  const firstLock = await new WorkerLock(lockConfig).acquire();
  t.after(() => firstLock.release());
  clearInterval(firstLock.timer);
  firstLock.timer = null;
  await fs.writeFile(path.join(firstLock.lockDir, 'owner.json'), `${JSON.stringify({
    token: firstLock.token,
    heartbeatAt: '2000-01-01T00:00:00.000Z',
  })}\n`, { mode: 0o600 });

  const replacement = new WorkerLock(lockConfig);
  await assert.rejects(replacement.acquire(), (error) => error.code === 'WORKER_LOCKED');
  assert.equal((await firstLock.owner()).token, firstLock.token);
  await firstLock.assertOwnership();
});

test('commands are terminated at their deadline', async () => {
  await assert.rejects(
    runCommand(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeoutMs: 100 }),
    (error) => error.code === 'COMMAND_TIMEOUT',
  );
});

test('shutdown cancellation terminates an active command', async () => {
  const controller = new AbortController();
  const command = runCommand(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1000)'],
    { timeoutMs: 5000, signal: controller.signal },
  );
  setTimeout(() => controller.abort(), 50);
  await assert.rejects(command, (error) => error.code === 'JOB_ABORTED');
});

test('chunked speech is cancelled before crossing the file limit', async (t) => {
  const root = await rootFixture(t);
  const target = path.join(root, 'speech.bin');
  const response = new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3]));
      controller.enqueue(new Uint8Array([4, 5, 6]));
      controller.close();
    },
  }));
  await assert.rejects(
    writeSpeechResponse(response, target, 'Test', 5),
    (error) => error.code === 'TTS_RESPONSE_TOO_LARGE',
  );
  await assert.rejects(fs.stat(target), (error) => error.code === 'ENOENT');
});

test('public and logged errors do not expose configured filesystem paths', () => {
  assert.equal(safeError(new Error('ffmpeg failed at /data/work/vid_secret/input.png')).includes('/data'), false);
  const exposed = publicJob({
    id: 'vid_test', status: 'failed', request: { task: '18', preset: 1, format: '16:9', captions: true },
    createdAt: 'a', updatedAt: 'b', progress: null, errorCode: 'VIDEO_RENDER_FAILED',
    output: '/data/videos/vid_test.mp4',
  });
  assert.equal(exposed.error.includes('/data'), false);
  assert.equal(exposed.errorCode, 'VIDEO_RENDER_FAILED');
});

test('only the exact active attempt is protected and recovery removes it', async (t) => {
  const root = await rootFixture(t);
  const config = {
    dataDir: root,
    jobDir: path.join(root, 'jobs'), mediaDir: path.join(root, 'videos'), workDir: path.join(root, 'work'),
    retentionDays: 30, maxRetainedBytes: 20 * 1024 * 1024, maxOutputBytes: 1024 * 1024,
  };
  const store = await new JobStore(config).init();
  const job = await store.create({ task: '18', preset: 1, format: '16:9', captions: true });
  await store.update(job.id, { status: 'rendering', attemptId: 'current-attempt' });
  const active = path.join(config.mediaDir, `${job.id}.current-attempt.tmp.mp4`);
  const stale = path.join(config.mediaDir, `${job.id}.stale-attempt.tmp.mp4`);
  const orphan = path.join(config.mediaDir, 'orphan.tmp.mp4');
  await fs.writeFile(active, 'active');
  await fs.writeFile(stale, 'stale');
  await fs.writeFile(orphan, 'orphan');
  await store.prune();
  assert.equal((await fs.readFile(active, 'utf8')), 'active');
  await assert.rejects(fs.stat(stale), (error) => error.code === 'ENOENT');
  await assert.rejects(fs.stat(orphan), (error) => error.code === 'ENOENT');
  await store.update(job.id, { status: 'queued', attemptId: null });
  await assert.rejects(fs.stat(active), (error) => error.code === 'ENOENT');
});

test('cleanup failure keeps metadata visible and health fail-closed', async (t) => {
  const root = await rootFixture(t);
  const config = {
    dataDir: root,
    jobDir: path.join(root, 'jobs'), mediaDir: path.join(root, 'videos'), workDir: path.join(root, 'work'),
    retentionDays: 30, maxRetainedBytes: 20 * 1024 * 1024, maxOutputBytes: 1024 * 1024,
  };
  const store = await new JobStore(config).init();
  const created = await store.create({ task: '18', preset: 1, format: '16:9', captions: true });
  const job = await store.update(created.id, { status: 'failed', attemptId: null });
  await fs.mkdir(store.expectedOutput(job.id));

  await assert.rejects(store.removeCompleted(job), (error) => error.code === 'PERSISTENCE_CLEANUP_FAILED');
  assert.equal(store.get(job.id).id, job.id);
  assert.equal(store.health().ok, false);
  await fs.stat(path.join(config.jobDir, `${job.id}.json`));
});
