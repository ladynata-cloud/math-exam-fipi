import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRenderer } from '../src/renderer.js';

for (const failure of ['budget', 'abort']) {
  test(`animated capture stops on ${failure} and removes every unpublished frame`, async (t) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathexam-capture-limit-'));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const mediaDir = path.join(root, 'media'), workDir = path.join(root, 'work');
    await fs.mkdir(mediaDir);
    const controller = new AbortController();
    let captured = 0, closed = false;
    const manifest = {
      format: 'mathexam-video-manifest', tab: 'tlinear-equation', videoType: 'ideal-solution',
      scenes: ['move-term', 'check-result'].map(id => ({ id, narration: 'Переносим слагаемое.', duration_hint_ms: 2000, motion_ms: 1000 })),
    };
    const page = {
      route: async () => {}, goto: async () => {}, waitForFunction: async () => {}, waitForTimeout: async () => {},
      async evaluate(fn) {
        if (String(fn).includes('MathExamVideoStudio.prepare')) return manifest;
        if (String(fn).includes('MathExamVideoStudio.show')) return {};
      },
      async screenshot({ path: target }) {
        await fs.writeFile(target, Buffer.alloc(1024));
        captured++;
        if (failure === 'abort' && captured === 2) controller.abort();
      },
    };
    const renderer = createRenderer({
      ttsProvider: 'openai', studioUrl: 'https://configured.example.test/video-lessons/studio.html',
      workDir, mediaDir, commandTimeoutMs: 1000, ffmpegPath: '/nonexistent/encoding-must-not-start',
      maxWorkBytes: failure === 'budget' ? 1500 : 10_000, maxOutputBytes: 100_000,
    }, { synthesize: () => assert.fail('Even legacy school voice requests must not synthesize') }, {
      chromium: { launch: async () => ({ newContext: async () => ({ newPage: async () => page }), close: async () => { closed = true; } }) },
    });
    const updates = [];
    await assert.rejects(renderer({
      id: 'capture-limit', ttsProvider: 'silent', request: { task: 'linear-equation', preset: 1, audioMode: 'voice' },
    }, { assertOwnership: async () => {}, update: async (_id, update) => updates.push(update) }, { signal: controller.signal }),
    error => error.code === (failure === 'budget' ? 'WORK_BUDGET_EXCEEDED' : 'JOB_ABORTED'));
    assert.equal(captured, 2, 'Capture must stop as soon as the budget or cancellation is observed');
    assert.equal(closed, true);
    assert.equal(updates.some(update => update.status === 'ready'), false);
    assert.deepEqual(await fs.readdir(workDir), []);
    assert.deepEqual(await fs.readdir(mediaDir), []);
  });
}
