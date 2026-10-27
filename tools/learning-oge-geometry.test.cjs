'use strict';
// Synthetic DOM/API only. No real cabinet records or external model transport.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(ROOT, 'learning', name), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
const condition = 'Квадрат описан около окружности радиуса 7. Найди площадь квадрата.';
const handoff = (question = condition, extra = {}) => new URLSearchParams({ 'geometry-help': 'oge-circle', from: 'oge-task16-circle', question, ...extra }).toString();
function fixture(t) {
  const dom = new JSDOM('<!doctype html><main></main><div id="helper"></div>', { url: 'https://cabinet.example/learning/', runScripts: 'outside-only' });
  dom.window.eval(source('oge-geometry.js'));
  t.after(() => dom.window.close());
  return { window: dom.window, host: dom.window.document.querySelector('main'), api: dom.window.LearningGeometry };
}

test('only the exact topic/source pair and bounded plain mathematics enter a handoff', t => {
  const { api } = fixture(t);
  assert.equal(api.readRoute('geometry').kind, 'collection');
  assert.equal(api.readRoute('geometry=oge-circle').topic, 'oge-circle');
  assert.equal(api.readRoute(handoff()).question, condition);
  assert.equal(api.readRoute(handoff()).from, 'oge-task16-circle');
  for (const value of [null, '', '#geometry', 'geometry=unknown', 'geometry&attempt=owned',
    handoff() + '&question=extra', handoff() + '&run=exam', handoff() + '&student=other',
    handoff() + '&externalConsent=true', handoff(condition, { from: 'oge-task17-quadrilaterals' }),
    handoff(condition, { 'geometry-help': 'decimal-addition' }), handoff(condition, { from: 'https://evil.example' }),
    handoff('<img src=x onerror=alert(1)>'), handoff('x'.repeat(1001)), handoff('строка\nвторая'),
    handoff('https://example.test'), handoff('javascript:alert(1)'), handoff('user@example.test'),
    handoff(''), handoff('\u2028<script>')]) assert.equal(api.readRoute(value), null, String(value));
});

test('the collection exposes exactly five canonical public trainers and no fabricated progress', t => {
  const { host, api } = fixture(t);
  api.mount(host);
  const cards = [...host.querySelectorAll('[data-geometry-topic]')];
  assert.equal(cards.length, 5);
  assert.deepEqual(cards.map(card => card.dataset.geometryTopic), [...api.cards].map(card => card.id));
  for (const card of cards) {
    const open = card.querySelector('a[target="_blank"]');
    assert.equal(open.href, 'https://mathexam.space/trainers/' + card.dataset.geometryTopic + '.html');
    assert(fs.existsSync(path.join(ROOT, 'trainers', card.dataset.geometryTopic + '.html')));
    assert.equal(open.rel, 'noopener noreferrer');
    assert.equal(open.getAttribute('referrerpolicy'), 'no-referrer');
    assert.equal(card.querySelectorAll('a[href*="trainer-board"]').length, 0);
  }
  assert.match(host.textContent, /пока не входят в прогресс кабинета/);
  assert.match(host.textContent, /по одному/);
  assert.equal(host.querySelectorAll('progress,[data-prep-start],iframe,form').length, 0);
  const store = [...Array(host.ownerDocument.defaultView.localStorage.length)].map((_, i) => host.ownerDocument.defaultView.localStorage.key(i));
  assert.deepEqual(store, []);
  api.mount(host, { teacher: true });
  assert.equal(host.querySelectorAll('a[href*="trainer-board"]').length, 5);
  assert.equal(host.querySelectorAll('a[href^="#geometry="]').length, 0);
});

test('the transferred condition remains text, with drawing and stale-context limits visible', t => {
  const { host, api } = fixture(t);
  api.mount(host, { route: handoff() });
  assert.equal(host.querySelector('blockquote').textContent, condition);
  assert.match(host.textContent, /Чертёж остался/);
  assert.match(host.textContent, /не переносятся/);
  assert.match(host.textContent, /Ничего не отправляется автоматически/);
  assert.equal(host.querySelectorAll('.geometry-topic.is-current').length, 1);
  assert.equal(host.querySelector('.geometry-topic.is-current').dataset.geometryTopic, 'oge-task16-circle');
  api.mount(host, { route: handoff('<img src=x>') });
  assert.equal(host.querySelectorAll('img,script,[onerror]').length, 0);
  assert.match(host.textContent, /Не получилось открыть/);
});

function status(window, profileId = 'oge-geometry') {
  return { enabled: true, available: true, mode: 'offline', dailyLimit: 10, remaining: 10,
    externalEnabled: false, profile: { id: profileId, title: 'Геометрия ОГЭ', topics: [...window.LearningGeometry.cards].map(card => ({ id: card.topic, title: card.title, example: condition })), links: [] } };
}
test('handoff prefills the existing panel, never submits automatically or enables a model', async t => {
  const { window } = fixture(t), calls = [];
  window.eval(source('assistant.js'));
  const host = window.document.querySelector('#helper');
  const cleanup = window.LearningAssistant.mount(host, { role: 'student', geometryRoute: handoff(), isCurrent: () => true,
    api: async (route, options) => {
      calls.push({ route, options });
      if (route === '/assistant') return status(window);
      return { answer: { answerId: 'synthetic-answer', title: 'Один шаг', verification: 'deterministic', steps: ['Найди диаметр.'] }, remaining: 9 };
    } });
  t.after(cleanup); await flush();
  assert.equal(host.querySelector('[name="assistant-topic"]').value, 'oge-circle');
  assert.equal(host.querySelector('[name="assistant-question"]').value, condition);
  assert.equal(host.querySelector('[name="assistant-attempt"]').value, '');
  assert.deepEqual(calls.map(call => call.route), ['/assistant']);
  assert.equal(host.querySelector('[name="assistant-external-consent"]'), null);
  assert.match(host.textContent, /не видит чертёж/);
  host.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await flush();
  const posted = calls.find(call => call.route === '/assistant/ask');
  assert(posted);
  const body = JSON.parse(posted.options.body);
  assert.equal(body.question, condition);
  assert.equal(body.topic, 'oge-circle');
  assert.equal(body.externalConsent, false);
  assert.equal(body.hintLevel, 1);
  assert.equal(body.mode, 'hint');
  for (const key of ['attemptId', 'from', 'studentId', 'profileId', 'answerKey']) assert(!Object.hasOwn(body, key));
  assert.equal(host.querySelectorAll('[data-assistant-answer]').length, 1);
  assert.equal(host.querySelector('[name="assistant-question"]').value, condition);
});

test('a geometry entry cannot retarget a different assistant profile', async t => {
  const { window } = fixture(t); window.eval(source('assistant.js'));
  const host = window.document.querySelector('#helper');
  const cleanup = window.LearningAssistant.mount(host, { role: 'student', geometryRoute: handoff(), api: async () => status(window, 'peterson-decimals') });
  t.after(cleanup); await flush();
  assert.equal(host.querySelector('form'), null);
  assert.match(host.textContent, /другой профиль/);
});

test('existing plan references gain one collection entry while retaining all five links', t => {
  const { window, host, api } = fixture(t);
  window.eval(source('preparation.js'));
  const urls = [...api.cards].map(card => 'https://mathexam.space/trainers/' + card.id + '.html');
  host.innerHTML = window.LearningPreparationUI.planCoursesMarkup(urls.join('\n'));
  assert.equal(host.querySelectorAll('[data-plan-course]').length, 5);
  assert.equal(host.querySelectorAll('[data-geometry-collection-entry]').length, 1);
  assert.equal(host.querySelector('[data-geometry-collection-entry] a').getAttribute('href'), '#geometry');
});
