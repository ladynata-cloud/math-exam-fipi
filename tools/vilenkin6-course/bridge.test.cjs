'use strict';
// Exercise the unchanged production bridge in a DOM, rather than a register stub.
// All identity/cookie values below are synthetic; no real account is accessed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.resolve(__dirname, '../../trainers/learning-bridge.js'), 'utf8');
const ORIGIN = 'https://mathexam-board-ladynata.msk1.amvera.tech';
const CHANNEL = 'fixture_channel_00000001';
const copy = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function fixture(t, { origin = ORIGIN, channel = CHANNEL, topLevel = false, apply } = {}) {
  const query = new URLSearchParams({ learning: '1', parentOrigin: origin, channel });
  const dom = new JSDOM('<button id="work">Change work</button>', {
    url: 'https://mathexam.space/courses/vilenkin-6-part-1/?' + query,
    runScripts: 'outside-only'
  });
  const w = dom.window, messages = [], restores = [], readonly = [];
  const parent = { postMessage(message, target) { messages.push({ message: copy(message), target }); } };
  Object.defineProperty(w, 'parent', { value: topLevel ? w : parent });
  w.TextEncoder = TextEncoder;
  w.document.cookie = 'fixture_session=never-in-trainer-message; Secure';
  w.eval(source);
  let emit, current = { module: 'lesson-1', draft: '' }, edits = 0;
  w.document.querySelector('#work').addEventListener('click', () => { edits++; });
  const unsubscribe = w.MathExamLearning.register({
    trainerId: 'vilenkin6-part1', contentVersion: 1,
    getState: () => current,
    setReadOnly: value => readonly.push(value),
    subscribe: callback => { emit = callback; return () => {}; },
    async applyState(payload) {
      restores.push(copy(payload));
      if (apply) await apply(payload);
      current = copy(payload.state);
    }
  });
  t.after(() => { unsubscribe(); w.close(); });
  const ready = () => messages.find(item => item.message.type === 'ready')?.message;
  function hydrate(state = current, overrides = {}, event = {}) {
    const message = { ...ready(), type: 'hydrate', payload: {
      taskSpec: { trainerId: 'vilenkin6-part1', contentId: 'lesson-1', contentVersion: 1 },
      state, readOnly: false
    }, ...overrides };
    w.dispatchEvent(new w.MessageEvent('message', { source: parent, origin: ORIGIN, data: message, ...event }));
  }
  return { w, parent, messages, restores, readonly, ready, hydrate,
    send: change => emit?.(change), state: () => current,
    edits: () => edits, click: () => w.document.querySelector('#work').click() };
}

test('production bridge rejects untrusted parent, malformed channel and top-level managed entry', t => {
  for (const options of [{ origin: 'https://untrusted.example' }, { channel: 'short' }, { topLevel: true }]) {
    const f = fixture(t, options);
    assert.equal(f.w.MathExamLearning.enabled, false);
    assert.equal(f.messages.length, 0);
    f.click();
    assert.equal(f.edits(), 0, 'An unconnected managed trainer cannot edit work.');
    assert.match(f.w.document.body.textContent, /личного кабинета/);
  }
});

test('actual handshake binds parent source, origin, channel, instance and protocol before restoring', async t => {
  const f = fixture(t);
  assert(f.ready());
  assert.equal(f.messages[0].target, ORIGIN);
  f.click(); assert.equal(f.edits(), 0, 'Edits are blocked before hydration.');
  const foreignState = { module: 'lesson-1', draft: 'foreign' };
  f.hydrate(foreignState, {}, { source: {} });
  f.hydrate(foreignState, {}, { origin: 'https://untrusted.example' });
  f.hydrate(foreignState, { channel: 'fixture_channel_other000' });
  f.hydrate(foreignState, { instance: 'old_frame_instance' });
  f.hydrate(foreignState, { protocol: 'another-protocol' });
  f.hydrate(foreignState, { version: 99 });
  await tick();
  assert.equal(f.restores.length, 0);
  f.hydrate({ module: 'lesson-1', draft: '3/7' });
  await tick();
  assert.equal(f.restores.length, 1);
  assert.equal(f.messages.at(-1).message.type, 'applied');
  f.click(); assert.equal(f.edits(), 1);
  f.send({ kind: 'input' });
  const sent = f.messages.at(-1).message;
  assert.equal(sent.type, 'change');
  assert.equal(sent.payload.state.draft, '3/7');
  assert.deepEqual(Object.keys(sent).sort(), ['channel','instance','payload','protocol','type','version']);
  assert(!JSON.stringify(f.messages).includes('never-in-trainer-message'), 'Cookie data never enters bridge payloads.');
  assert(f.w.document.cookie.includes('never-in-trainer-message'), 'Cookie fixture was actually present.');
});

test('read-only observers cannot emit changes and old-frame messages cannot hydrate a replacement', async t => {
  const old = fixture(t), next = fixture(t, { channel: 'fixture_channel_00000002' });
  old.hydrate({ module: 'lesson-1', draft: 'old pupil draft' });
  await tick();
  const oldMessage = { ...old.ready(), type: 'hydrate', payload: {
    taskSpec: { contentId: 'lesson-1' }, state: old.state(), readOnly: false
  }};
  next.w.dispatchEvent(new next.w.MessageEvent('message', { source: next.parent, origin: ORIGIN, data: oldMessage }));
  await tick();
  assert.equal(next.restores.length, 0, 'A different pupil/frame channel cannot receive the previous draft.');
  next.hydrate({ module: 'lesson-1', draft: 'current pupil draft' }, { payload: {
    taskSpec: { contentId: 'lesson-1' }, state: { module: 'lesson-1', draft: 'current pupil draft' }, readOnly: true
  }});
  await tick();
  const count = next.messages.length;
  next.click(); next.send({ kind: 'input', state: { draft: 'attempted edit' } });
  assert.equal(next.edits(), 0);
  assert.equal(next.messages.length, count);
  assert.equal(next.state().draft, 'current pupil draft');
});

test('concurrent hydration applies the latest pending state without echoing local changes', async t => {
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  const f = fixture(t, { apply: payload => payload.state.draft === 'first' ? hold : undefined });
  f.hydrate({ module: 'lesson-1', draft: 'first' });
  f.hydrate({ module: 'lesson-1', draft: 'superseded' });
  f.hydrate({ module: 'lesson-1', draft: 'latest' });
  f.send({ kind: 'input', state: { draft: 'echo' } });
  assert.equal(f.restores.length, 1);
  release(); await tick(); await tick();
  assert.deepEqual(f.restores.map(item => item.state.draft), ['first', 'latest']);
  assert.equal(f.state().draft, 'latest');
  assert.equal(f.messages.filter(item => item.message.type === 'change').length, 0);
});

test('oversized outbound state and failed restore stay fail-closed without a saved-state claim', async t => {
  const f = fixture(t);
  f.hydrate(); await tick();
  const count = f.messages.length;
  f.send({ kind: 'input', state: { draft: 'Я'.repeat(40000) } });
  assert.equal(f.messages.length, count);
  assert.match(f.w.document.body.textContent, /слишком велико/);
  const bad = fixture(t, { apply() { throw Error('Synthetic invalid module'); } });
  bad.hydrate(); await tick();
  assert.equal(bad.messages.at(-1).message.payload.error, 'RESTORE_FAILED');
  bad.click(); assert.equal(bad.edits(), 0);
  assert.match(bad.w.document.body.textContent, /Не удалось восстановить/);
});
