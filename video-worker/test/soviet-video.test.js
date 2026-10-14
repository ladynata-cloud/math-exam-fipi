import assert from 'node:assert/strict';
import test from 'node:test';
import { isSchoolTask, resolveAudioMode, studioUrlFor, validateJobRequest, viewportFor } from '../src/validation.js';

test('the named Soviet lesson accepts three silent landscape presets on its own fixed studio', () => {
  for (const preset of [1, 2, 3]) {
    for (const provider of ['silent', 'mock', 'openai', 'yandex']) {
      const input = { task: 'soviet-motion-time', preset, audioMode: 'voice', captions: false };
      assert.deepEqual(validateJobRequest(input, { ttsProvider: provider }), {
        task: 'soviet-motion-time', preset, format: '16:9', audioMode: 'silent', captions: true, videoType: 'ideal-solution',
      });
      assert.equal(resolveAudioMode(input, provider), 'silent');
    }
  }
  assert.equal(isSchoolTask('soviet-motion-time'), true);
  for (const origin of ['https://mathexam.space', 'https://configured.example.test:8443']) {
    assert.equal(studioUrlFor('soviet-motion-time', origin + '/old/studio.html?extra=1'), origin + '/soviet-math/studio.html');
  }
  assert.deepEqual(viewportFor('16:9', 'soviet-motion-time'), { width: 1600, height: 900 });
  assert.throws(() => validateJobRequest({ task: 'soviet-motion-time', preset: 1, format: '9:16' }), /горизонтальный/);
  assert.throws(() => viewportFor('9:16', 'soviet-motion-time'), /горизонтальный/);
  assert.throws(() => validateJobRequest({ task: 'soviet-motion-time', preset: 1, videoType: 'student-path' }), /ideal-solution/);
});

test('the new route does not allow arbitrary Soviet tasks, paths, numbers, or narration', () => {
  for (const task of ['motion-time', 'soviet-motion-speed', 'soviet-motion-time/../other', 'soviet-motion-time?url=x', 'soviet-motion-time ']) {
    assert.equal(isSchoolTask(task), false);
    assert.throws(() => validateJobRequest({ task, preset: 1 }), /готовые школьные видеоуроки/);
  }
  for (const key of ['url', 'studioUrl', 'html', 'narration', 'distance', 'speed']) {
    assert.throws(() => validateJobRequest({ task: 'soviet-motion-time', preset: 1, [key]: 'custom' }), /Неизвестный параметр/);
  }
  for (const preset of [0, 4, 1.5]) {
    assert.throws(() => validateJobRequest({ task: 'soviet-motion-time', preset }), /1, 2 и 3/);
  }
  assert.deepEqual(viewportFor('9:16', 'fractions'), { width: 720, height: 1280 });
  assert.equal(studioUrlFor('fractions', 'https://mathexam.space/dvi.html'), 'https://mathexam.space/video-lessons/studio.html');
  assert.equal(studioUrlFor('18', 'https://mathexam.space/dvi.html'), 'https://mathexam.space/dvi.html');
});
