'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(ROOT, 'trainers/oge-geometry-helper.js'), 'utf8');
const cases = [
  [15, 'oge-task15-triangles', 'oge-triangles', '#taskText', '#ans'],
  [16, 'oge-task16-circle', 'oge-circle', '#main .grid .task', '#ans'],
  [17, 'oge-task17-quadrilaterals', 'oge-quadrilaterals', '#tzone .qtext', '#ans'],
  [18, 'oge-task18-grid', 'oge-grid', '#main > .card > .task', '#ansIn'],
  [19, 'task19-trainer', 'oge-statements', '#statement', null]
];
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
class Local extends ResourceLoader {
  fetch(url) {
    const u = new URL(url);
    if (u.origin !== 'https://mathexam.space') return null;
    const file = path.join(ROOT, u.pathname);
    return fs.existsSync(file) ? Promise.resolve(fs.readFileSync(file)) : null;
  }
}
async function load(t, row, search = '') {
  const [number, id] = row, errors = [], opened = [];
  const console = new VirtualConsole(); console.on('jsdomError', error => errors.push(error.message));
  // The root task wires this script into the canonical pages. Evaluate it here
  // after the actual native page has loaded, so tests work before/after wiring.
  const html = fs.readFileSync(path.join(ROOT, 'trainers/' + id + '.html'), 'utf8')
    .replace(/<script\b[^>]*\bsrc=["'][^"']*oge-geometry-helper\.js[^"']*["'][^>]*>\s*<\/script>/g, '');
  const dom = new JSDOM(html, {
    url: 'https://mathexam.space/trainers/' + id + '.html' + search,
    runScripts: 'dangerously', resources: new Local(), pretendToBeVisual: true, virtualConsole: console,
    beforeParse(w) { w.open = (...args) => { opened.push(args); return null; }; w.HTMLElement.prototype.scrollIntoView = function () {}; }
  });
  t.after(() => dom.window.close());
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  dom.window.eval(script); await tick();
  const w = dom.window, d = w.document;
  const get = selector => d.querySelector(selector);
  const transfer = () => { const b = get('[data-oge-helper-transfer]'); assert(b, 'transfer control for ' + number); b.click(); };
  assert.deepEqual(errors, []);
  return { w, d, get, opened, errors, transfer, number, id };
}
function assistance(c) {
  if (c.number === 15) return c.w.__oge15.debug().tr.hinted === true;
  if (c.number === 19) return JSON.parse(c.w.localStorage.getItem('mathExam.task19.visualHints.v1')).current.helpUsed;
  return c.w.OgeGeometryHelpUsed;
}
function question(c) { return new URL(c.opened.at(-1)[0]).hash; }

for (const row of cases) test('OGE' + row[0] + ': explicit current condition, preserved work, native assistance, no automatic request', async t => {
  const c = await load(t, row, '?question=UNTRUSTED_QUERY&from=evil&externalConsent=true');
  const condition = c.get(row[3]), before = condition.outerHTML;
  const figure = c.get(c.number === 19 ? '#visualHost' : '#main svg');
  const diagramBefore = c.number === 19 ? null : figure?.outerHTML;
  const input = row[4] && c.get(row[4]);
  if (input) input.value = '876543210987';
  if (c.get('#fb')) c.get('#fb').textContent = 'PRIVATE ANSWER KEY NOT A CONDITION';
  const initialOpen = c.get(c.number === 19 ? '#hintPanel' : '#courseHintPanel')?.hidden;
  assert.equal(c.opened.length, 0);
  assert.equal(c.get('[data-oge-geometry-helper]').open, false);
  c.transfer();
  assert.equal(c.opened.length, 1);
  const [address, target, features] = c.opened[0], url = new URL(address), values = new URLSearchParams(url.hash.slice(1));
  assert.equal(url.origin, 'https://mathexam-board-ladynata.msk1.amvera.tech');
  assert.equal(url.pathname, '/learning/'); assert.equal(url.search, '');
  assert.deepEqual([...values.keys()], ['geometry-help', 'from', 'question']);
  assert.equal(values.get('geometry-help'), row[2]); assert.equal(values.get('from'), row[1]);
  assert(values.get('question').length >= 5 && values.get('question').length <= 1000);
  assert(!/PRIVATE|876543210987|UNTRUSTED_QUERY|<svg|<script|externalConsent/.test(values.get('question')));
  assert.equal(target, '_blank'); assert.equal(features, 'noopener,noreferrer');
  assert.equal(assistance(c), true);
  assert.equal(condition.outerHTML, before);
  if (input) { assert.equal(input.value, '876543210987'); assert.equal(input.disabled, false); }
  if (c.number !== 19) assert.equal(c.get('#main svg')?.outerHTML, diagramBefore);
  if (initialOpen !== undefined) assert.equal(c.get(c.number === 19 ? '#hintPanel' : '#courseHintPanel').hidden, initialOpen);
  assert.match(c.get('[data-oge-geometry-helper]').textContent, /Рисунок, твой ответ и изменения задачи.*не видит/);
  assert.match(c.get('.oge-geometry-helper-status').textContent, /только после твоего нажатия/);
  await tick(); assert.equal(c.opened.length, 1); assert.deepEqual(c.errors, []);
});

for (const row of cases) test('OGE' + row[0] + ': board, examination and embedded use do not expose new helper controls', async t => {
  for (const search of ['?board=1', '?mode=exam', '?mode=diagnostic']) {
    const c = await load(t, row, search);
    assert.equal(c.get('[data-oge-geometry-helper]'), null);
    assert.equal(c.opened.length, 0);
  }
  const c = await load(t, row);
  // A second fresh document tests an embedded launch before helper initialization.
  const dom = new JSDOM('<main></main>', { url: 'https://mathexam.space/trainers/' + row[1] + '.html', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  Object.defineProperty(dom.window, 'parent', { value: {} });
  dom.window.eval(script);
  assert.equal(dom.window.MathExamOgeGeometryHelper, undefined);
  assert.equal(c.opened.length, 0);
});

test('current identity is reread after each native task change, with no stale hidden answer or old hints', async t => {
  for (const row of cases) {
    const c = await load(t, row);
    c.transfer(); const before = question(c);
    if (row[0] === 15) c.w.__oge15.trainWith('bisIso', c.w.JSON.parse('{"d":"B","L":"K","g":27,"f":0}'));
    if (row[0] === 16) c.w.eval('trTask = null; renderTrain();');
    if (row[0] === 17) c.w.eval('renderTrain(true);');
    if (row[0] === 18) c.get('#nextBtn').click();
    if (row[0] === 19) c.get('#nextCard').click();
    await tick();
    assert.equal(c.get('[data-oge-helper-shown]').hidden, true);
    assert.equal(c.get('.oge-geometry-helper-status').textContent, '');
    c.transfer();
    const url = new URL(c.opened.at(-1)[0]), text = new URLSearchParams(url.hash.slice(1)).get('question');
    const raw = c.get(row[3]).textContent.replace(/\s+/g, ' ').trim();
    // Superscripts/fractions gain explicit plain-text notation in the handoff.
    if (!c.get(row[3]).querySelector('sup,sub,.frac,.fraction')) assert.equal(text, row[0] === 19 ? 'Верно ли утверждение: ' + raw : raw);
    if (row[0] === 19) assert.notEqual(question(c), before);
    assert.equal(assistance(c), true); assert.deepEqual(c.errors, []);
  }
});

test('triangle hint uses the native current step without disabling draft input or revealing a worked answer', async t => {
  const c = await load(t, cases[0]);
  c.w.__oge15.trainWith('bisIso', c.w.JSON.parse('{"d":"B","L":"K","g":25,"f":0}'));
  await tick();
  c.get('#ans').value = '123';
  const debug = c.w.__oge15.debug(), currentTask = debug.tr.t;
  assert.equal(currentTask.ans, 105);
  c.get('[data-oge-helper-hint]').click();
  assert.equal(c.get('#ans').value, '123'); assert.equal(c.get('#ans').disabled, false);
  assert.equal(debug.tr.hinted, true); assert.equal(debug.tr.shown, false); assert.equal(debug.tr.ladder, false);
  assert(!c.get('[data-oge-helper-shown]').textContent.includes('105'));
  assert.equal(c.get('[data-oge-helper-shown]').querySelectorAll('[data-helper-step]').length, 1);
  c.get('[data-oge-helper-hint]').click();
  assert.equal(c.get('[data-oge-helper-shown]').querySelectorAll('[data-helper-step]').length, 1);
  assert.equal(c.opened.length, 0);
  c.w.__oge15.switchTab('quiz'); await tick();
  assert.equal(c.get('[data-oge-geometry-helper]'), null);
});

test('native examination tabs remove helper controls before the next answer', async t => {
  for (const row of cases.filter(row => row[0] >= 16 && row[0] <= 18)) {
    const c = await load(t, row);
    assert(c.get('[data-oge-geometry-helper]'));
    c.w.eval(row[0] === 16 ? "switchTab('quiz');" : row[0] === 17 ? "setTab('quiz');" : "setMode('quiz');");
    await tick();
    assert.equal(c.get('[data-oge-geometry-helper]'), null);
    assert.equal(c.opened.length, 0);
  }
});

test('fraction and exponent typography remains meaningful; long or unsafe text cannot be truncated into another problem', async t => {
  const c = await load(t, cases[1]);
  const node = c.get(cases[1][3]);
  node.innerHTML = 'Радиус равен <span class="frac"><span class="fn">5</span><span class="fd">13</span></span> см. Найди площадь квадрата в см<sup>2</sup>.';
  await tick(); c.transfer();
  const exported = new URLSearchParams(new URL(c.opened.at(-1)[0]).hash.slice(1)).get('question');
  assert.match(exported, /\(5\)\/\(13\)/); assert.match(exported, /см\^\(2\)/);
  for (const value of ['Слишком длинное условие ' + 'а'.repeat(1001), 'См. https://evil.test/secret',
    'Открой javascript:alert(1)', 'Изображение data:text/html,secret', 'Напиши learner@example.test', 'Сравни < 5 > без контекста']) {
    node.textContent = value; await tick();
    const count = c.opened.length; c.transfer();
    assert.equal(c.opened.length, count);
    assert.match(c.get('.oge-geometry-helper-status').textContent, /не удалось передать целиком/);
  }
});

test('unrecognized origins, routes and missing native assistance handlers fail closed', t => {
  for (const url of [
    'https://mathexam.space.evil.test/trainers/oge-task15-triangles.html',
    'https://evil.test/trainers/oge-task16-circle.html',
    'https://mathexam.space/trainers/geometry_statements_trainer_improved.html',
    'https://mathexam.space/trainers/oge-task17-quadrilaterals.html'
  ]) {
    const dom = new JSDOM('<main id="main"><div id="tzone"><div class="qtext">Условие задачи</div></div></main>', { url, runScripts: 'outside-only' });
    t.after(() => dom.window.close()); dom.window.eval(script);
    assert.equal(dom.window.document.querySelector('[data-oge-geometry-helper]'), null);
  }
});

test('helper bootstrap is idempotent, creates no requests and reads no storage', async t => {
  const c = await load(t, cases[0]);
  let reads = 0, requests = 0;
  Object.defineProperty(c.w, 'localStorage', { get() { reads++; throw new Error('Helper must not read learner history'); } });
  c.w.fetch = () => { requests++; throw new Error('Unexpected helper request'); };
  c.w.eval(script); await tick();
  assert.equal(c.get('#main').querySelectorAll('[data-oge-geometry-helper]').length, 1);
  assert.equal(reads, 0); assert.equal(requests, 0); assert.equal(c.opened.length, 0);
});
