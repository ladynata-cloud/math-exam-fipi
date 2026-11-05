'use strict';
// Browser-memory dialogue controls against synthetic API responses only.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.join(__dirname, '../learning/assistant.js'), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
async function settle() { for (let index = 0; index < 8; index++) await new Promise(resolve => setImmediate(resolve)); }
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
async function fixture(t, external = true) {
  const dom = new JSDOM('<!doctype html><body><div id="host"></div></body>', { url: 'https://cabinet.example/learning/', runScripts: 'outside-only' });
  const { window } = dom, host = window.document.getElementById('host');
  const state = { active: true, canAsk: true, before: async () => true, reply: null, calls: [], answerId: null,
    status: { enabled: true, available: true, externalEnabled: external, mode: external ? 'api' : 'offline', remaining: 20, dailyLimit: 20,
      profile: { id: 'vilenkin-grade6', title: '6 класс · Виленкин · НОД и НОК', topics: [
        { id: 'gcd', title: 'НОД', example: 'НОД 12 и 18' }, { id: 'lcm', title: 'НОК', example: 'НОК 6 и 8' }] } } };
  const answer = () => ({ ok: true, remaining: --state.status.remaining, contextMode: 'entered', followUpAvailable: state.status.externalEnabled,
    answer: { answerId: state.answerId = randomUUID(), title: 'Следующий шаг', text: 'Найди общие делители.', steps: ['Начни с делителей 12.'], check: '', verification: 'curated-guidance' } });
  window.eval(source);
  const dispose = window.LearningAssistant.mount(host, { role: 'student', floating: false, isCurrent: () => state.active,
    canAsk: () => state.canAsk,
    onBeforeAsk: () => state.before(), api: async (route, request = {}) => {
      const body = request.body ? JSON.parse(request.body) : undefined; state.calls.push({ route, body });
      if (route === '/assistant/ask') return state.reply ? state.reply(body) : answer();
      return copy(state.status);
    } });
  await settle(); t.after(() => { dispose(); window.close(); });
  const query = selector => host.querySelector(selector);
  const field = name => query('[name="assistant-' + name + '"]');
  function enter(name, text) { const input = field(name); input.value = text; input.dispatchEvent(new window.Event(name === 'topic' ? 'change' : 'input', { bubbles: true })); }
  async function submit(followUp = false) { query(followUp ? '.cabinet-assistant-follow-up' : '.cabinet-assistant-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); await settle(); }
  return { window, host, state, dispose, field, enter, submit, answer, query,
    get asks() { return state.calls.filter(call => call.route === '/assistant/ask'); },
    get shown() { return [...host.querySelectorAll('[data-assistant-answer]')]; },
    get followUpVisible() { return !query('.cabinet-assistant-follow-up').hidden; },
    async first() { enter('question', 'НОД 12 и 18'); await submit(); } };
}

test('follow-up keeps the original task and one server answer pointer, with fresh explicit consent', async t => {
  const f = await fixture(t); assert.equal(f.followUpVisible, false);
  await f.first(); assert.equal(f.followUpVisible, true);
  const answerId = f.state.answerId;
  f.enter('follow-up', 'Почему подходит число 6?'); await f.submit(true);
  assert.equal(f.asks.length, 1); assert.match(f.query('[role=status]').textContent, /отметь согласие/);
  f.field('follow-up-consent').checked = true; await f.submit(true);
  assert.equal(f.asks.length, 2);
  assert.deepEqual(f.asks[1].body.followUp, { answerId, question: 'Почему подходит число 6?' });
  assert.equal(f.asks[1].body.question, 'НОД 12 и 18'); assert.equal(f.asks[1].body.topic, 'gcd');
  assert.equal(f.asks[1].body.externalConsent, true); assert.equal('history' in f.asks[1].body, false);
  assert.equal(f.field('follow-up-consent').checked, false); assert.equal(f.field('follow-up').value, '');
  assert.equal(f.shown.length, 2); assert.match(f.shown[1].textContent, /Уточнение: Почему подходит число 6/);
  assert.equal(f.field('question').value, 'НОД 12 и 18');
});

test('root topic, condition, attempt and explicit new-task changes clear the anchor, preserving visible answers', async t => {
  for (const [name, value] of [['topic', 'lcm'], ['question', 'НОД 8 и 12'], ['attempt', '4']]) {
    const f = await fixture(t); await f.first(); f.enter('follow-up', 'Почему?');
    f.enter(name, value);
    assert.equal(f.followUpVisible, false, name); assert.equal(f.field('follow-up').value, ''); assert.equal(f.shown.length, 1);
    f.field('follow-up-consent').checked = true; await f.submit(true); assert.equal(f.asks.length, 1);
  }
  const f = await fixture(t); await f.first();
  [...f.host.querySelectorAll('button')].find(item => item.textContent === 'Новая задача').click();
  assert.equal(f.followUpVisible, false); assert.equal(f.field('question').value, ''); assert.equal(f.shown.length, 1);
});

test('offline and uncached answers never offer a live dialogue', async t => {
  const offline = await fixture(t, false); await offline.first();
  assert.equal(offline.followUpVisible, false); assert.equal(offline.field('external-consent'), null);
  assert.match(offline.query('[data-assistant-mode]').textContent, /Внешняя модель не подключена/);
  const unavailable = await fixture(t); unavailable.state.reply = () => ({ ...unavailable.answer(), followUpAvailable: false });
  await unavailable.first(); assert.equal(unavailable.followUpVisible, false);
});

test('failed follow-ups preserve text and previous steps without automatic request retry', async t => {
  const f = await fixture(t); await f.first(); f.enter('follow-up', 'Почему 6?'); f.field('follow-up-consent').checked = true;
  f.state.reply = () => { throw Object.assign(Error('unavailable'), { code: 'LEARNING_ASSISTANT_SERVICE_UNAVAILABLE' }); };
  await f.submit(true); assert.equal(f.asks.length, 2); assert.equal(f.shown.length, 1);
  assert.equal(f.field('follow-up').value, 'Почему 6?'); assert.equal(f.field('follow-up-consent').checked, false);
  assert.equal(f.state.calls.filter(call => call.route === '/assistant').length, 2);
  f.state.reply = () => { throw Object.assign(Error('expired'), { code: 'LEARNING_ASSISTANT_DIALOGUE_EXPIRED' }); };
  f.field('follow-up-consent').checked = true; await f.submit(true);
  assert.equal(f.asks.length, 3); assert.equal(f.followUpVisible, false); assert.equal(f.field('follow-up').value, 'Почему 6?');
  assert.match(f.query('[role=status]').textContent, /Попроси новую подсказку/);
});

test('a changed task before the persistence callback completes sends nothing', async t => {
  const f = await fixture(t); f.enter('question', 'НОД 12 и 18'); const pending = deferred(); f.state.before = () => pending.promise;
  await f.submit(); f.enter('question', 'НОД 8 и 12'); pending.resolve(true); await settle();
  assert.equal(f.asks.length, 0); assert.equal(f.followUpVisible, false);
});

test('a late answer never anchors a changed task, including changing away and back', async t => {
  const f = await fixture(t); const pending = deferred(); f.state.reply = () => pending.promise;
  await f.first(); f.enter('question', 'НОД 8 и 12'); f.enter('question', 'НОД 12 и 18');
  pending.resolve(f.answer()); await settle();
  assert.equal(f.shown.length, 1); assert.match(f.shown[0].textContent, /НОД 12 и 18/); assert.equal(f.followUpVisible, false);
});

test('account disposal suppresses a late follow-up and mathematical text remains literal', async t => {
  const f = await fixture(t); await f.first();
  f.enter('follow-up', '<img src=x onerror="window.injected=true">'); f.field('follow-up-consent').checked = true; await f.submit(true);
  assert.equal(f.host.querySelectorAll('img').length, 0); assert.match(f.shown.at(-1).textContent, /<img src=x/);
  const pending = deferred(); f.state.reply = () => pending.promise; f.enter('follow-up', 'Почему?'); f.field('follow-up-consent').checked = true; await f.submit(true);
  f.state.active = false; f.dispose(); pending.resolve(f.answer()); await settle();
  assert.equal(f.shown.length, 0); assert.equal(f.host.childElementCount, 0);
});

test('follow-up length is bounded before any API request and consent is not consumed on empty input', async t => {
  const f = await fixture(t); await f.first(); f.field('follow-up-consent').checked = true;
  await f.submit(true); assert.equal(f.asks.length, 1); assert.equal(f.field('follow-up-consent').checked, true);
  f.enter('follow-up', 'x'.repeat(401)); await f.submit(true); assert.equal(f.asks.length, 1);
  assert.equal(f.field('follow-up').maxLength, 400);
});

test('control revoked during a pending explanation withholds the answer and continuation', async t => {
  for (const followUp of [false, true]) {
    const f = await fixture(t);
    if (followUp) await f.first();
    const shown = f.shown.length, pending = deferred();
    f.state.reply = () => pending.promise;
    if (followUp) { f.enter('follow-up', 'Почему?'); f.field('follow-up-consent').checked = true; }
    else f.enter('question', 'НОД 12 и 18');
    await f.submit(followUp);
    f.state.canAsk = false; pending.resolve(f.answer()); await settle();
    assert.equal(f.shown.length, shown);
    assert.equal(f.followUpVisible, false);
    assert.match(f.query('[role=status]').textContent, /Управление работой изменилось/);
    assert.equal(f.asks.length, followUp ? 2 : 1, 'No automatic retry');
  }
});
