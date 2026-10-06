import assert from 'node:assert/strict';
import test from 'node:test';
import { isSchoolTask, resolveAudioMode, studioUrlFor, validateJobRequest, viewportFor } from '../src/validation.js';

const schoolTasks = ['homework-help', 'linear-equation', 'adjacent-angles',
  'negative-numbers', 'fractions', 'brackets', 'proportions', 'percentages',
  'numeric-expressions', 'variable-expressions', 'compare-expressions', 'arithmetic-properties',
  'identities', 'equation-roots', 'linear-cases', 'equation-word-problems',
  'grade7-a-opposite-expression', 'grade7-a-two-variable-collect', 'grade7-a-equation-two-brackets', 'grade7-a-equation-denominators', 'grade7-a-equation-decimals', 'grade7-g-segment-order', 'grade7-g-midpoint-chain', 'grade7-g-angle-addition', 'grade7-g-angle-bisector', 'grade7-g-adjacent-equation', 'grade7-b-mixed-borrow', 'grade7-b-fraction-product-cancel', 'grade7-b-decimal-divisor-scale', 'grade7-b-signed-fraction-sum', 'grade7-b-percent-proportion', 'pre7-place-value', 'pre7-natural-compare', 'pre7-add-carry', 'pre7-subtract-borrow', 'pre7-smart-calculation', 'pre7-inverse-components', 'pre7-divisibility', 'pre7-scale-reading', 'pre7-comparison-stories', 'pre7-fraction-line', 'pre7-equivalent-fractions', 'pre7-fraction-compare', 'pre7-fraction-part-whole', 'pre7-decimal-compare', 'pre7-mass-capacity', 'pre7-ruler-length', 'pre7-perimeter', 'pre7-grid-area', 'grade7-g-core-point-line-ray', 'grade7-g-core-perpendicular', 'grade7-g-core-angle-measure', 'grade7-g-core-triangle-elements', 'grade7-g-core-triangle-perimeter', 'grade7-g-core-sas', 'grade7-g-core-median', 'grade7-g-core-bisector', 'grade7-g-core-altitude', 'grade7-g-core-isosceles-elements', 'grade7-g-core-isosceles-base-angles', 'grade7-g-core-isosceles-vertex-line', 'grade7-g-practice-segment-equation', 'grade7-g-practice-angle-parts', 'grade7-g-practice-vertical-proof', 'grade7-g-practice-sas-common-side', 'grade7-g-practice-sas-vertical', 'grade7-g-practice-cevian-reason', 'grade7-g-practice-isosceles-perimeter', 'grade7-g-practice-isosceles-proof'];

test('all fixed school topics retain the three presets, portrait/landscape and compulsory captions', () => {
  for (const task of schoolTasks) {
    assert.equal(isSchoolTask(task), true);
    for (const preset of [1, 2, 3]) {
      for (const format of ['16:9', '9:16']) {
        for (const audioMode of [undefined, 'silent', 'clicks', 'voice']) {
          for (const ttsProvider of ['silent', 'mock', 'openai', 'yandex']) {
            const input = { task, preset, format, ...(audioMode ? { audioMode } : {}), captions: false };
            assert.deepEqual(validateJobRequest(input, { ttsProvider }),
              { task, preset, format, audioMode: 'silent', captions: true, videoType: 'ideal-solution' });
            assert.equal(resolveAudioMode(input, ttsProvider), 'silent', 'legacy unnormalized school jobs cannot request speech');
          }
        }
      }
    }
    assert.throws(() => validateJobRequest({ task, preset: 0 }), /1, 2 и 3/);
    assert.throws(() => validateJobRequest({ task, preset: 4 }), /1, 2 и 3/);
    assert.throws(() => validateJobRequest({ task, preset: 1, format: '1:1' }), /16:9 или 9:16/);
    assert.throws(() => validateJobRequest({ task, preset: 1, videoType: 'student-path' }), /ideal-solution/);
  }
});

test('DVI keeps its configured speech and explicit audio modes', () => {
  for (const task of ['18', '19', '20']) {
    assert.equal(resolveAudioMode({ task }, 'openai'), 'voice');
    assert.equal(resolveAudioMode({ task }, 'silent'), 'clicks');
    assert.equal(validateJobRequest({ task, preset: 1, audioMode: 'voice' }, { ttsProvider: 'yandex' }).audioMode, 'voice');
    assert.throws(() => validateJobRequest({ task, preset: 1, audioMode: 'voice' }, { ttsProvider: 'silent' }), /OpenAI или Yandex/);
  }
});

test('school routes stay on the configured studio origin and cannot be supplied by render requests', () => {
  for (const studio of ['https://mathexam.space/trainers/dvi/studio.html?variant=1', 'https://configured.example.test:8443/nested/studio.html']) {
    for (const task of schoolTasks) {
      assert.equal(studioUrlFor(task, studio), new URL('/video-lessons/studio.html', studio).toString());
      assert.equal(new URL(studioUrlFor(task, studio)).origin, new URL(studio).origin);
      assert.deepEqual(viewportFor('16:9', task), { width: 1280, height: 720 });
      assert.deepEqual(viewportFor('9:16', task), { width: 720, height: 1280 });
    }
    for (const task of ['18', '19', '20']) {
      assert.equal(isSchoolTask(task), false);
      assert.equal(studioUrlFor(task, studio), studio);
      assert.equal(validateJobRequest({ task, preset: 1, videoType: 'student-path' }).videoType, 'student-path');
      assert.deepEqual(viewportFor('16:9', task), { width: 1920, height: 1080 });
      assert.deepEqual(viewportFor('9:16', task), { width: 1080, height: 1920 });
    }
  }
  for (const key of ['url', 'html', 'narration', 'script', 'studioUrl']) {
    assert.throws(() => validateJobRequest({ task: 'fractions', preset: 1, [key]: 'https://untrusted.example.test' }), /Неизвестный параметр/);
  }
});

test('adding the named topics does not create a general task or path allowlist', () => {
  for (const task of ['', '17', '21', 'geometry', 'fractions-extra', 'percent', 'Fractions', ' fractions', 'fractions ',
    '../fractions', '/video-lessons/studio.html', 'fractions?url=https://untrusted.example.test', 'https://untrusted.example.test']) {
    assert.equal(isSchoolTask(task), false);
    assert.throws(() => validateJobRequest({ task, preset: 1 }), /готовые школьные видеоуроки/);
  }
});
