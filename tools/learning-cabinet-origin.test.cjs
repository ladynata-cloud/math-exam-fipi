'use strict';

// Execute the real child bridge under HTTPS production origins, not localhost.
// Synthetic messages only; this gate does not contact or certify a live server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const currentOrigin = 'https://cabinet.mathexam.space';
const previousOrigin = 'https://mathexam-board-ladynata.amvera.io';
const channel = 'fixture_channel_0123456789';
const bridge = fs.readFileSync(path.join(root, 'trainers/learning-bridge.js'), 'utf8');

function fixture(origin, options = {}) {
  const messages = [], listeners = {}, calls = [];
  let emit;
  const parent = { postMessage(message, target) { messages.push({ message, target }); } };
  const document = { documentElement: { dataset: {} }, addEventListener() {} };
  const window = {
    parent, crypto: webcrypto,
    location: { search: '?' + new URLSearchParams({ learning: options.managed ?? '1', parentOrigin: origin, channel: options.channel ?? channel }) },
    addEventListener(type, listener) { listeners[type] = listener; }
  };
  if (options.topLevel) window.parent = window;
  vm.runInNewContext(bridge, {
    window, document, URL, URLSearchParams, Uint8Array, TextEncoder,
    setInterval() { return 1; }, clearInterval() {}
  }, { filename: 'trainers/learning-bridge.js' });
  function register() {
    return window.MathExamLearning.register({
      trainerId: 'fixture-trainer', contentVersion: 1,
      getState() { return { draft: '' }; },
      applyState(payload) { calls.push(payload); },
      subscribe(listener) { emit = listener; return () => {}; }, setReadOnly() {}
    });
  }
  return { window, parent, messages, calls, register, receive: event => listeners.message(event), change: payload => emit(payload) };
}

async function main() {
  for (const origin of [currentOrigin, previousOrigin, 'http://127.0.0.1:3000', 'http://localhost:3000']) {
    const f = fixture(origin);
    assert.equal(f.window.MathExamLearning.enabled, true, 'Allow exact trusted origin: ' + origin);
  }
  for (const origin of [
    'https://untrusted.example', 'https://cabinet.mathexam.space.untrusted.example',
    'https://untrusted.example/cabinet.mathexam.space', 'https://cabinet.mathexam.space@untrusted.example',
    'https://sub.cabinet.mathexam.space', 'http://cabinet.mathexam.space',
    'https://cabinet.mathexam.space:8443', currentOrigin + '/', currentOrigin + '/learning/', 'null'
  ]) assert.equal(fixture(origin).window.MathExamLearning.enabled, false, 'Reject untrusted or non-origin input: ' + origin);
  for (const invalid of ['', 'short', 'a'.repeat(97), 'fixture/channel_0123456789']) {
    assert.equal(fixture(currentOrigin, { channel: invalid }).window.MathExamLearning.enabled, false, 'Reject invalid channel');
  }
  assert.equal(fixture(currentOrigin, { topLevel: true }).window.MathExamLearning.enabled, false);
  assert.equal(fixture(currentOrigin, { managed: '0' }).window.MathExamLearning.enabled, false);

  for (const origin of [currentOrigin, previousOrigin]) {
    const f = fixture(origin), dispose = f.register();
    assert.equal(f.messages.length, 1);
    const ready = f.messages[0];
    assert.equal(ready.target, origin);
    assert.equal(ready.message.type, 'ready');
    const message = {
      protocol: 'mathexam-learning', version: 1, channel,
      instance: ready.message.instance, type: 'hydrate',
      payload: { taskSpec: { id: 'fixture-task' }, state: { draft: '42' }, readOnly: false }
    };
    const event = { source: f.parent, origin, data: message };
    for (const invalid of [
      { ...event, source: {} }, { ...event, origin: 'https://untrusted.example' },
      { ...event, data: { ...message, channel: 'other_channel_0123456789' } },
      { ...event, data: { ...message, instance: 'other-instance' } },
      { ...event, data: { ...message, version: 2 } }
    ]) f.receive(invalid);
    assert.equal(f.calls.length, 0, 'Wrong source/origin/channel/instance/version cannot hydrate');
    f.receive(event);
    await Promise.resolve();
    assert.equal(f.calls.length, 1, 'Trusted production parent restores the task');
    assert.equal(f.calls[0].state.draft, '42');
    assert.equal(f.messages.at(-1).message.type, 'applied');
    assert.equal(f.messages.at(-1).target, origin);
    f.change({ kind: 'input', state: { draft: '43' } });
    assert.equal(f.messages.at(-1).message.type, 'change');
    assert.equal(f.messages.at(-1).message.payload.state.draft, '43');
    assert.equal(f.messages.at(-1).target, origin, 'Changes go only to the exact trusted parent');
    dispose();
  }

  const entries = [
    'index.html', 'oge/index.html', 'trainers/oge-course/index.html', 'laboratory/index.html',
    'courses/index.html', 'foundations/index.html', 'foundations/course.js', 'grade7/index.html',
    'grade7/course.js', 'learning/grade7-route-map.js', 'video-lessons/cheatsheets.html',
    'video-lessons/cheatsheets.js', 'ege-baza/index.html', 'ege-baza/app.js', 'ege-baza/path/app.js'
  ];
  for (const file of entries) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert(source.includes(currentOrigin), 'Public entry has the configured origin: ' + file);
    assert(!source.includes(previousOrigin + '/learning/'), 'Public entry must not send users to the old cabinet: ' + file);
  }
  console.log('LEARNING_CABINET_ORIGIN_OK: exact production origins, rejected spoofed parents/channels, real hydration, 15 public entry files. Live DNS/TLS not checked.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
