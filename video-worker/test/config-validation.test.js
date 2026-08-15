import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
import { authorized, isAllowedOrigin, publicJob, safeError } from '../src/security.js';
import { validateJobRequest, viewportFor } from '../src/validation.js';

test('production configuration fails closed', () => {
  assert.throws(() => loadConfig({ NODE_ENV: 'production' }), /VIDEO_ADMIN_TOKEN/);
  const base = {
    NODE_ENV: 'production',
    VIDEO_ADMIN_TOKEN: 'x'.repeat(40),
    VIDEO_ALLOWED_ORIGINS: 'https://mathexam.space',
    VIDEO_STUDIO_URL: 'https://mathexam.space/trainers/dvi/math-18-20-video-studio.html',
    VIDEO_TTS_PROVIDER: 'openai',
    OPENAI_API_KEY: 'test-key',
  };
  assert.throws(() => loadConfig(base), /VIDEO_PERSISTENCE_CONFIRMED/);
  const config = loadConfig({ ...base, VIDEO_PERSISTENCE_CONFIRMED: '1' });
  assert.equal(config.production, true);
  assert.deepEqual(config.allowedOrigins, ['https://mathexam.space']);
  assert.equal(config.ttsProvider, 'openai');
});

test('job request accepts only the fixed render contract', () => {
  assert.deepEqual(validateJobRequest({ task: '18', preset: 2, format: '9:16', captions: false }), {
    task: '18', preset: 2, format: '9:16', captions: false,
  });
  assert.throws(() => validateJobRequest({ task: '17', preset: 1 }), /18, 19 и 20/);
  assert.throws(() => validateJobRequest({ task: '18', preset: 4 }), /1, 2 и 3/);
  assert.throws(() => validateJobRequest({ task: '18', preset: 1, url: 'https://evil.test' }), /Неизвестный/);
  assert.deepEqual(viewportFor('16:9'), { width: 1920, height: 1080 });
  assert.deepEqual(viewportFor('9:16'), { width: 1080, height: 1920 });
});

test('authorization is header-only and public jobs are sanitized', () => {
  const token = 'this-is-a-long-test-token-value-123456';
  assert.equal(authorized(`Bearer ${token}`, token), true);
  assert.equal(authorized(token, token), false);
  assert.equal(authorized('Bearer wrong', token), false);
  assert.equal(isAllowedOrigin('https://mathexam.space', ['https://mathexam.space']), true);
  assert.equal(isAllowedOrigin(undefined, ['https://mathexam.space']), false);
  assert.equal(safeError(new Error(`Bearer ${token}`)), 'Bearer [redacted]');
  const exposed = publicJob({
    id: 'vid_test', status: 'ready', request: { task: '18', preset: 1, format: '16:9', captions: true },
    createdAt: 'a', updatedAt: 'b', progress: null, output: '/data/private.mp4', providerKey: 'secret',
  });
  assert.equal(exposed.videoReady, true);
  assert.equal('output' in exposed, false);
  assert.equal('providerKey' in exposed, false);
});

