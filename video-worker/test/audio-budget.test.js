import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { JobStore } from '../src/job-store.js';

test('clicks and muted requests do not consume a paid voice reservation', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathexam-audio-budget-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const config = {
    jobDir: path.join(root, 'jobs'), mediaDir: path.join(root, 'media'), workDir: path.join(root, 'work'),
    ttsProvider: 'openai', retentionDays: 30,
    maxPendingJobs: 10, maxJobsPerHour: 10,
    maxRetainedBytes: 100 * 1024 * 1024, maxOutputBytes: 1024 * 1024,
    dailyTtsCharacterBudget: 30_000, maxTtsCharactersPerJob: 30_000,
  };
  const store = await new JobStore(config).init();
  const request = { task: '18', preset: 1, format: '16:9', videoType: 'ideal-solution', captions: true };
  const first = await store.admit({ ...request, audioMode: 'voice' }, 'first-voice-request');
  assert.equal(first.job.reservedTtsCharacters, 30_000);
  for (const audioMode of ['clicks', 'silent']) {
    const admitted = await store.admit({ ...request, audioMode }, `free-mode-${audioMode}`);
    assert.equal(admitted.job.reservedTtsCharacters, 0);
  }
  await assert.rejects(store.admit({ ...request, audioMode: 'voice', preset: 2 }, 'second-voice-request'),
    (error) => error.code === 'DAILY_TTS_BUDGET');
  const resumed = await new JobStore(config).init();
  assert.equal((await resumed.admit({ ...request, audioMode: 'voice' }, 'first-voice-request')).reused, true);
  await assert.rejects(resumed.admit({ ...request, audioMode: 'clicks' }, 'first-voice-request'),
    (error) => error.code === 'IDEMPOTENCY_CONFLICT');
});

test('school jobs never reserve paid speech even with legacy voice flags', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathexam-school-silent-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = await new JobStore({
    jobDir: path.join(root, 'jobs'), mediaDir: path.join(root, 'media'), workDir: path.join(root, 'work'),
    ttsProvider: 'openai', retentionDays: 30, maxPendingJobs: 80, maxJobsPerHour: 80,
    maxRetainedBytes: 100 * 1024 * 1024, maxOutputBytes: 1024 * 1024,
    dailyTtsCharacterBudget: 1, maxTtsCharactersPerJob: 30_000,
  }).init();
  for (const task of ['homework-help', 'linear-equation', 'adjacent-angles', 'negative-numbers', 'fractions', 'brackets', 'proportions', 'percentages',
    'numeric-expressions', 'variable-expressions', 'compare-expressions', 'arithmetic-properties',
    'identities', 'equation-roots', 'linear-cases', 'equation-word-problems']) {
    for (const audioMode of [undefined, 'silent', 'clicks', 'voice']) {
      const admitted = await store.admit({ task, preset: 1, ...(audioMode ? { audioMode } : {}) }, `school-${task}-${audioMode}`);
      assert.equal(admitted.job.reservedTtsCharacters, 0);
    }
  }
});
