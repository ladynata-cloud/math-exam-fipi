'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'trainers/oge-task15-triangles.html'), 'utf8').replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g, '');
const adapter = fs.readFileSync(path.join(root, 'trainers/oge-task15-board.js'), 'utf8');
function create(board = true) {
  let registration, notifications = 0, reads = 0, writes = 0;
  const dom = new JSDOM(html, {
    url: 'https://mathexam.space/trainers/oge-task15-triangles.html' + (board ? '?board=1' : ''),
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia = () => ({ matches: false });
      window.MathExamBoard = { register(config) { registration = config; config.subscribe(() => notifications++); } };
      const getItem = window.Storage.prototype.getItem, setItem = window.Storage.prototype.setItem;
      setItem.call(window.localStorage, 'unrelated', 'retained');
      window.Storage.prototype.getItem = function (...args) { reads++; return getItem.apply(this, args); };
      window.Storage.prototype.setItem = function (...args) { writes++; return setItem.apply(this, args); };
    }
  });
  dom.window.eval(adapter);
  const w = dom.window;
  const local = value => w.JSON.parse(JSON.stringify(value));
  const click = selector => { const node = w.document.querySelector(selector); assert.ok(node, selector); node.click(); };
  const input = (selector, value) => {
    const node = w.document.querySelector(selector); assert.ok(node, selector); node.value = String(value);
    node.dispatchEvent(new w.Event('input', { bubbles: true }));
  };
  return { dom, w, local, click, input, registration: () => registration, counters: () => ({ reads, writes, notifications }) };
}
test('existing 26 types/66 variants retain mathematical and figure selftests', () => {
  const c = create();
  try {
    const bank = c.w.__oge15;
    assert.equal(bank.TYPE_IDS.length, 26);
    assert.equal(bank.TASK_VARIANTS.length, 66);
    const checked = bank.selftest(40);
    assert.equal(checked.ok, true, JSON.stringify(checked.errs));
    const demo = bank.build('bisIso', c.local({ d: 'B', L: 'K', g: 25, f: 0 }), c.local({ kind: 'gen' }));
    assert.equal(demo.ans, 105);
    assert.deepEqual(Array.from(demo.steps, step => step.a), [25, 50, 105]);
    assert.match(demo.text, /25/);
    assert.match(demo.fig.svg, /svg/);
  } finally { c.dom.window.close(); }
});
test('board starts with condition, real figure and closed help; never reads personal progress', () => {
  const c = create();
  try {
    assert.equal(c.registration().id, 'oge-task15-triangles');
    assert.ok(c.w.document.querySelector('#taskText').textContent.includes('биссектрис'));
    assert.ok(c.w.document.querySelector('.diagram svg'));
    assert.equal(c.w.document.querySelector('.hintbox'), null);
    assert.equal(c.w.document.querySelector('.lstep'), null);
    assert.deepEqual(c.counters(), { reads: 0, writes: 0, notifications: 0 });
  } finally { c.dom.window.close(); }
});
test('answer, incorrect feedback, help and reference synchronize atomically without echo', () => {
  const a = create(), b = create();
  try {
    a.input('#board-answer', 999);
    a.click('#board-check');
    a.click('#board-hint');
    a.click('#board-reference');
    const snapshot = a.w.OGE15Board.getState();
    b.w.OGE15Board.applyState(b.local(snapshot));
    assert.deepEqual(JSON.parse(JSON.stringify(b.w.OGE15Board.getState())), JSON.parse(JSON.stringify(snapshot)));
    assert.equal(b.w.document.querySelector('#board-answer').value, '999');
    assert.match(b.w.document.querySelector('#board-feedback').textContent, /не совпало/);
    assert.ok(b.w.document.querySelector('.hintbox'));
    assert.ok(b.w.document.querySelector('.law'));
    assert.equal(b.counters().notifications, 0);
    a.click('#board-hint');
    a.click('#board-reference');
    assert.equal(a.w.OGE15Board.getState().helpUsed, true);
    assert.equal(a.counters().writes, 0);
  } finally { a.dom.window.close(); b.dom.window.close(); }
});
test('all 66 variants complete retained guided steps and roundtrip without losing answers', () => {
  const a = create(), b = create();
  try {
    const template = a.w.OGE15Board.getState();
    for (const variant of a.w.__oge15.TASK_VARIANTS) {
      const snapshot = a.local({ ...template, variantId: variant.id, seed: 729, topic: variant.topic });
      a.w.OGE15Board.applyState(snapshot);
      const expected = a.w.__oge15.buildSeeded(variant.id, 729);
      const same = b.w.__oge15.buildSeeded(variant.id, 729);
      assert.equal(expected.text, same.text, variant.id);
      assert.equal(expected.fig.svg, same.fig.svg, variant.id);
      a.click('#board-guide');
      for (let i = 0; i < expected.steps.length; i++) {
        const n = expected.steps[i].a;
        // The authored bank is separately audited above. This journey checks retention and rendering.
        a.input('#board-step-' + i, String(n));
        a.click('[data-step-check="' + i + '"]');
        assert.equal(a.w.document.querySelectorAll('.lstep').length, Math.min(i + 2, expected.steps.length), variant.id);
        assert.equal(a.w.document.querySelectorAll('.board-completed').length, i + 1, variant.id);
        b.w.OGE15Board.applyState(b.local(a.w.OGE15Board.getState()));
        assert.equal(b.w.document.querySelectorAll('.board-completed').length, i + 1, variant.id);
        assert.equal(b.w.document.querySelector('#board-step-' + i).value, String(n), variant.id);
      }
      assert.match(a.w.document.querySelector('#board-feedback').textContent, /Все шаги разобраны/);
      assert.equal(a.w.OGE15Board.getState().helpUsed, false);
    }
    assert.equal(b.counters().notifications, 0);
    assert.equal(a.counters().writes, 0);
    assert.equal(b.counters().reads, 0);
  } finally { a.dom.window.close(); b.dom.window.close(); }
});
test('independent geometric solver checks 1320 generated conditions from all 66 variants', async () => {
  const { solve } = await import('./oge-task15-triangles.solve.mjs');
  const c = create();
  try {
    let count = 0;
    for (const variant of c.w.__oge15.TASK_VARIANTS) for (let seed = 1; seed <= 20; seed++) {
      const task = c.w.__oge15.buildSeeded(variant.id, seed * 199);
      const independent = solve(task.k, task.text);
      assert.ok(Number.isFinite(independent.ans), variant.id + ': ' + task.text);
      assert.ok(Math.abs(independent.ans - task.ans) < 1e-6 * Math.max(1, Math.abs(task.ans)), variant.id + ': ' + task.text);
      count++;
    }
    assert.equal(count, 1320);
  } finally { c.dom.window.close(); }
});
test('revealed steps and contextual help remain visible after restoration and are never independent', () => {
  const a = create(), b = create();
  try {
    a.click('#board-guide');
    a.input('#board-step-0', '123');
    a.click('[data-step-hint="0"]');
    a.click('[data-step-reveal="0"]');
    b.w.OGE15Board.applyState(b.local(a.w.OGE15Board.getState()));
    assert.equal(b.w.OGE15Board.getState().helpUsed, true);
    assert.equal(b.w.document.querySelector('#board-step-0').value, '123');
    assert.equal(b.w.document.querySelector('#board-step-0').disabled, true);
    assert.equal(b.w.document.querySelectorAll('.lstep').length, 2);
    assert.ok(b.w.document.querySelector('.lstep .hintbox'));
    assert.equal(b.counters().notifications, 0);
  } finally { a.dom.window.close(); b.dom.window.close(); }
});
test('malformed payloads, impossible steps, HTML and getters leave state and DOM unchanged', () => {
  const c = create();
  try {
    c.input('#board-answer', '12,5');
    const before = JSON.stringify(c.w.OGE15Board.getState()), dom = c.w.document.querySelector('#main').innerHTML;
    const base = JSON.parse(before);
    const invalid = [
      { ...base, seed: 0 }, { ...base, seed: 1e99 }, { ...base, variantId: 'unknown' },
      { ...base, answer: '<img src=x onerror=alert(1)>' }, { ...base, extra: true },
      { ...base, topic: 'trig' }, { ...base, helpUsed: false, hintOpen: true },
      { ...base, guided: true }, { ...base, steps: [{ draft: '1', checked: true, hint: false, revealed: false }] },
      { ...base, guided: true, steps: [{ draft: '1', checked: true, hint: false, revealed: false }, { draft: '', checked: false, hint: false, revealed: false }] }
    ];
    for (const value of invalid) {
      assert.throws(() => c.w.OGE15Board.applyState(c.local(value)));
      assert.equal(JSON.stringify(c.w.OGE15Board.getState()), before);
      assert.equal(c.w.document.querySelector('#main').innerHTML, dom);
    }
    const getter = c.local(base);
    let executed = false;
    Object.defineProperty(getter, 'answer', { enumerable: true, get() { executed = true; return ''; } });
    assert.throws(() => c.w.OGE15Board.applyState(getter));
    assert.equal(executed, false);
    assert.equal(JSON.stringify(c.w.OGE15Board.getState()), before);
  } finally { c.dom.window.close(); }
});
test('fresh task resets assistance, keeps chosen topic and produces a new shared example', () => {
  const c = create();
  try {
    c.click('#board-hint');
    c.input('#board-answer', '23');
    const previous = c.w.OGE15Board.getState();
    c.click('#board-next');
    const next = c.w.OGE15Board.getState();
    assert.equal(next.seed, previous.seed + 1);
    assert.equal(next.variantId, previous.variantId);
    assert.equal(next.helpUsed, false);
    assert.equal(next.answer, '');
  } finally { c.dom.window.close(); }
});
test('standalone retains native training, guided method and its own progress contract', () => {
  const c = create(false);
  try {
    assert.equal(c.w.OGE15Board, undefined);
    assert.equal(c.registration(), undefined);
    assert.equal(c.w.__oge15.debug().TAB, 'train');
    assert.ok(c.w.document.querySelector('#ans'));
    assert.ok(c.w.document.querySelector('#ladBtn'));
    assert.equal(c.w.__oge15.boardMode, false);
  } finally { c.dom.window.close(); }
});
