'use strict';

// Synthetic DOM and board messages only: no accounts, rooms or network writes.
// These tests inspect the actual entry pages, math module, runtime and board SDK.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const math = require('../trainers/number-theory/math.js');
const ROOT = path.resolve(__dirname, '..');
const tick = () => new Promise(resolve => setImmediate(resolve));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const plain = value => JSON.parse(JSON.stringify(value));

function factors(n) {
  const result = [];
  for (let divisor = 2; divisor <= n; divisor++) {
    while (n % divisor === 0) { result.push(divisor); n /= divisor; }
  }
  return result;
}

function oracle(kind, a, b) {
  if (kind === 'nod') {
    for (let n = Math.min(a, b); n > 0; n--) if (a % n === 0 && b % n === 0) return n;
  }
  for (let n = Math.max(a, b); n <= a * b; n++) if (n % a === 0 && n % b === 0) return n;
  assert.fail('No positive answer for the fixture');
}

async function fixture(t, kind, { board = false } = {}) {
  const url = 'https://mathexam.space/trainers/grade6-' + kind + '.html';
  const html = fs.readFileSync(path.join(ROOT, 'trainers/grade6-' + kind + '.html'), 'utf8');
  const errors = [], messages = [], diagnostics = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', virtualConsole });
  const { window } = dom;
  const stats = { localNotifications: 0, storageWrites: 0, networkCalls: 0 };
  window.fetch = () => { stats.networkCalls++; throw new Error('DOM fixture forbids network requests'); };
  window.XMLHttpRequest.prototype.send = () => { stats.networkCalls++; throw new Error('DOM fixture forbids XHR'); };
  window.localStorage.setItem('number-theory-dom-sentinel', 'keep');
  const setItem = window.Storage.prototype.setItem;
  const removeItem = window.Storage.prototype.removeItem;
  const clear = window.Storage.prototype.clear;
  window.Storage.prototype.setItem = function (...args) { stats.storageWrites++; return setItem.apply(this, args); };
  window.Storage.prototype.removeItem = function (...args) { stats.storageWrites++; return removeItem.apply(this, args); };
  window.Storage.prototype.clear = function (...args) { stats.storageWrites++; return clear.apply(this, args); };
  const parent = { postMessage(data, targetOrigin) { messages.push({ data: plain(data), targetOrigin }); } };
  if (board) Object.defineProperty(window, 'parent', { configurable: true, value: parent });
  window.addEventListener('mathexam:bridge-diagnostic', event => diagnostics.push(plain(event.detail)));
  let registration, bridge;
  for (const script of window.document.querySelectorAll('script[src]')) {
    const scriptUrl = new URL(script.getAttribute('src'), url);
    assert.equal(scriptUrl.origin, new URL(url).origin, 'All scripts must be served with the trainer');
    const filename = path.join(ROOT, scriptUrl.pathname);
    window.eval(fs.readFileSync(filename, 'utf8') + '\n//# sourceURL=' + scriptUrl.pathname);
    if (scriptUrl.pathname.endsWith('/board-bridge.js')) {
      const sdk = window.MathExamBoard;
      window.MathExamBoard = Object.freeze({
        ...sdk,
        register(config) {
          assert.equal(registration, undefined, 'The runtime registers exactly once');
          registration = config;
          bridge = sdk.register({
            ...config,
            subscribe(callback) {
              return config.subscribe(function () { stats.localNotifications++; callback(); });
            }
          });
          return bridge;
        }
      });
    }
  }
  await tick();
  const api = window.NumberTheoryTrainer;
  assert.ok(api && registration, 'The actual trainer API and board registration must be available');
  const initial = plain(api.getState());
  const f = {
    window, api, initial, kind, stats, messages, diagnostics,
    state: () => plain(api.getState()),
    realm: value => window.JSON.parse(JSON.stringify(value)),
    q: selector => window.document.querySelector(selector),
    send(type, state, overrides = {}) {
      const ready = messages.find(message => message.data.type === 'mathexam:trainer-ready');
      assert.ok(ready, 'The actual SDK must emit trainer-ready before hydration');
      const envelope = { ...ready.data, type, ...overrides };
      if (state !== undefined) envelope.state = state;
      window.dispatchEvent(new window.MessageEvent('message', {
        data: window.JSON.parse(JSON.stringify(envelope)), origin: new URL(url).origin, source: parent
      }));
    },
    load(taskId) { const next = { ...initial, taskId }; api.applyState(window.JSON.parse(JSON.stringify(next))); }
  };
  t.after(() => {
    if (bridge) bridge.destroy();
    window.close();
    assert.equal(stats.networkCalls, 0, 'Trainer DOM tests never contact a remote service');
    assert.deepEqual(errors, [], 'No unhandled browser errors');
  });
  return f;
}

function valid(f) {
  const state = f.api.getState();
  assert.deepEqual(plain(f.api.validateState(state)), plain(state), 'Every visible local state must be serializable and valid');
}

function click(f, selector) {
  const element = f.q(selector);
  assert.ok(element, 'Missing control ' + selector);
  assert.equal(element.disabled, false, 'Control must be enabled: ' + selector);
  element.click();
  valid(f);
}

function enter(f, selector, value) {
  const element = f.q(selector);
  assert.ok(element, 'Missing input ' + selector);
  element.value = String(value);
  element.dispatchEvent(new f.window.Event('input', { bubbles: true }));
  valid(f);
}

function accept(f, side, divisor, quotient) {
  enter(f, '#divisor-' + side, divisor);
  click(f, '#accept-' + side);
  assert.equal(f.state()['active' + side.toUpperCase()], divisor);
  enter(f, '#quotient-' + side, quotient);
  click(f, '#accept-' + side);
}

function factorAll(f, side, n, descending = false) {
  const divisors = factors(n);
  if (descending) divisors.reverse();
  let remainder = n;
  for (const divisor of divisors) {
    remainder /= divisor;
    accept(f, side, divisor, remainder);
  }
}

function matchAll(f, a, b) {
  const aFactors = factors(a), bFactors = factors(b), usedB = new Set();
  const expected = [];
  aFactors.forEach((value, ai) => {
    const bi = bFactors.findIndex((factor, index) => factor === value && !usedB.has(index));
    if (bi < 0) return;
    click(f, '[data-factor-side="a"][data-factor-index="' + ai + '"]');
    click(f, '[data-factor-side="b"][data-factor-index="' + bi + '"]');
    usedB.add(bi); expected.push({ a: ai, b: bi });
  });
  assert.deepEqual(f.state().pairs, expected);
  click(f, '#confirm-pairs');
  assert.equal(f.state().stage, 'build');
}

function build(f, a, b) {
  const pairs = f.state().pairs;
  let indices;
  if (f.kind === 'nod') indices = pairs.map(pair => pair.a);
  else {
    const side = a < b ? 'a' : 'b';
    const matched = new Set(pairs.map(pair => pair[side]));
    indices = factors(side === 'a' ? a : b).map((_, index) => index).filter(index => !matched.has(index));
  }
  for (const index of indices) click(f, '[data-build-index="' + index + '"]');
  click(f, f.kind === 'nod' ? '#confirm-common' : '#confirm-missing');
  assert.equal(f.state().stage, 'answer');
  assert.equal(f.state().answer, '', 'Finishing the construction never fills the final answer');
  assert.equal(f.q('#answer-input').value, '');
}

function answer(f, value) {
  enter(f, '#answer-input', value);
  click(f, '#check-answer');
  return f.q('[data-feedback-scope="answer"]');
}

test('both real entry pages expose accessible labels, inert standalone bridge and the requested task', async t => {
  for (const kind of ['nok', 'nod']) {
    const f = await fixture(t, kind);
    assert.equal(f.state().kind, kind);
    assert.equal(f.state().taskId, math.bank[0].id);
    assert.match(f.q('h1').textContent, new RegExp(kind === 'nok' ? 'НОК' : 'НОД'));
    assert.match(f.q('label[for="divisor-a"]').textContent, /простой делитель/);
    assert.equal(f.q('#divisor-a').inputMode, 'numeric');
    assert.equal(f.messages.length, 0, 'Standalone SDK has no parent to notify');
    assert.equal(f.stats.storageWrites, 0);
    valid(f);
  }
});

test('embedded navigation cannot move only one participant out of the selected trainer iframe', async t => {
  for (const kind of ['nok', 'nod']) {
    const f = await fixture(t, kind, { board: true });
    // jsdom outside-only deliberately does not fetch link stylesheets. Apply
    // the actual local CSS in memory to inspect the embedded navigation rule.
    for (const link of f.window.document.querySelectorAll('link[rel="stylesheet"]')) {
      const asset = new URL(link.href);
      assert.equal(asset.origin, f.window.location.origin);
      const style = f.window.document.createElement('style');
      style.textContent = fs.readFileSync(path.join(ROOT, asset.pathname), 'utf8');
      f.window.document.head.append(style);
    }
    const hidden = element => {
      for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
        const css = f.window.getComputedStyle(node);
        if (node.hidden || css.display === 'none' || css.visibility === 'hidden') return true;
      }
      return false;
    };
    assert.ok(f.window.document.body.classList.contains('embedded'));
    for (const anchor of f.window.document.querySelectorAll('a[href]')) {
      const target = new URL(anchor.href);
      const staysOnTrainer = target.origin === f.window.location.origin && target.pathname === f.window.location.pathname;
      if (hidden(anchor) || staysOnTrainer) continue;
      assert.equal(anchor.target, '_blank', 'Visible embedded navigation must use a separate tab: ' + anchor.href);
      assert.ok(anchor.relList.contains('noopener'), 'A separate tab must not gain a reference to the trainer');
    }
  }
});

test('all 48 guided tasks can be solved by actions with repeated factors and retained work', async t => {
  for (const kind of ['nok', 'nod']) {
    const f = await fixture(t, kind);
    for (const task of math.bank) {
      f.load(task.id);
      factorAll(f, 'a', task.a);
      factorAll(f, 'b', task.b);
      assert.equal(f.state().stage, 'pairs');
      const rows = { a: f.state().rowsA, b: f.state().rowsB };
      matchAll(f, task.a, task.b);
      build(f, task.a, task.b);
      assert.ok(f.q('#factorization-section') && f.q('#pairs-section') && f.q('#build-section'), 'Previous steps remain visible');
      assert.deepEqual(f.state().rowsA, rows.a);
      assert.deepEqual(f.state().rowsB, rows.b);
      assert.match(f.q('label[for="answer-input"]').textContent, /впиши одно целое число/);
      const feedback = answer(f, oracle(kind, task.a, task.b));
      assert.ok(feedback.classList.contains('success'), task.id + ': ' + feedback.textContent);
      assert.match(feedback.textContent, /разобран по шагам/);
      assert.ok(f.q('.answer-proof'), 'A correct answer is checked against both original numbers');
      assert.deepEqual(f.state().rowsA, rows.a);
      assert.deepEqual(f.state().rowsB, rows.b);
    }
  }
});

test('a valid non-smallest prime is accepted and two-phase errors preserve the chosen divisor and earlier rows', async t => {
  const f = await fixture(t, 'nok');
  f.load('nt-1-5'); // 12 and 18.
  enter(f, '#divisor-a', '4');
  click(f, '#accept-a');
  assert.deepEqual(f.state().feedback, { scope: 'factor-a', code: 'prime' });
  assert.equal(f.q('#divisor-a').value, '4');
  assert.deepEqual(f.state().rowsA, []);
  enter(f, '#divisor-a', '3');
  click(f, '#accept-a');
  assert.equal(f.state().activeA, 3);
  assert.equal(f.q('#divisor-a'), null);
  assert.match(f.q('[data-column="a"] .ladder').textContent, /12.*3/s);
  enter(f, '#quotient-a', '5');
  click(f, '#accept-a');
  assert.equal(f.state().activeA, 3);
  assert.equal(f.state().quotientDraftA, '5');
  assert.equal(f.state().feedback.code, 'quotient');
  assert.deepEqual(f.state().rowsA, []);
  enter(f, '#quotient-a', '4');
  click(f, '#accept-a');
  assert.deepEqual(f.state().rowsA, [{ divisor: 3, quotient: 4 }]);
  accept(f, 'a', 2, 2);
  accept(f, 'a', 2, 1);
  factorAll(f, 'b', 18, true);
  assert.equal(f.state().stage, 'pairs');
  assert.deepEqual(f.state().rowsA.map(row => row.divisor), [3, 2, 2]);
  assert.deepEqual(f.state().rowsB.map(row => row.divisor), [3, 3, 2]);
  matchAll(f, 12, 18);
  build(f, 12, 18);
  assert.ok(answer(f, 36).classList.contains('success'));
});

test('matching uses separate factor occurrences and rejects missing pairs or extra build factors without clearing work', async t => {
  for (const kind of ['nok', 'nod']) {
    const f = await fixture(t, kind);
    f.load('nt-1-3'); // 8 = 2×2×2; 12 = 2×2×3.
    factorAll(f, 'a', 8); factorAll(f, 'b', 12);
    click(f, '[data-factor-side="a"][data-factor-index="0"]');
    click(f, '[data-factor-side="b"][data-factor-index="2"]');
    assert.equal(f.state().feedback.code, 'different');
    assert.equal(f.state().pairs.length, 0);
    click(f, '[data-factor-side="b"][data-factor-index="0"]');
    assert.deepEqual(f.state().pairs, [{ a: 0, b: 0 }]);
    assert.equal(f.q('[data-factor-side="a"][data-factor-index="0"]').disabled, true);
    click(f, '#confirm-pairs');
    assert.equal(f.state().stage, 'pairs');
    assert.equal(f.state().feedback.code, 'missing');
    assert.deepEqual(f.state().pairs, [{ a: 0, b: 0 }]);
    click(f, '[data-factor-side="a"][data-factor-index="1"]');
    click(f, '[data-factor-side="b"][data-factor-index="1"]');
    click(f, '#undo-pair');
    assert.deepEqual(f.state().pairs, [{ a: 0, b: 0 }]);
    assert.equal(f.q('[data-factor-side="a"][data-factor-index="1"]').disabled, false);
    click(f, '[data-factor-side="a"][data-factor-index="1"]');
    click(f, '[data-factor-side="b"][data-factor-index="1"]');
    click(f, '#confirm-pairs');
    const extra = kind === 'nod' ? 2 : 0;
    click(f, '[data-build-index="' + extra + '"]');
    click(f, kind === 'nod' ? '#confirm-common' : '#confirm-missing');
    assert.equal(f.state().stage, 'build');
    assert.equal(f.state().feedback.code, 'extra');
    assert.deepEqual(f.state().selected, [extra]);
    assert.equal(f.state().pairs.length, 2);
    click(f, '[data-build-index="' + extra + '"]');
    build(f, 8, 12);
  }
});

test('help reveals one requested step, keeps drafts and rows, and closing it does not erase assistance', async t => {
  const f = await fixture(t, 'nod');
  f.load('nt-1-5');
  accept(f, 'a', 2, 6);
  enter(f, '#divisor-a', '3');
  const before = f.state();
  click(f, '#hint-toggle');
  assert.equal(f.state().hintUsed, true);
  assert.equal(f.state().hintLevel, 1);
  assert.equal(f.state().taskId, before.taskId);
  assert.equal(f.state().stage, before.stage);
  assert.deepEqual(f.state().rowsA, before.rowsA);
  assert.equal(f.q('#divisor-a').value, '3');
  click(f, '#hint-step');
  assert.equal(f.state().hintLevel, 2);
  assert.equal(f.state().activeA, null, 'A hint does not automatically accept its suggested divisor');
  assert.deepEqual(f.state().rowsA, before.rowsA);
  click(f, '#hint-toggle');
  assert.equal(f.state().hintOpen, false);
  assert.equal(f.state().hintUsed, true);
  assert.equal(f.q('#current-hint'), null);
  assert.equal(f.q('#divisor-a').value, '3');
  assert.deepEqual(f.state().rowsA, before.rowsA);
});

test('fresh independent work hides the solution, retains answer drafts and never relabels helped work as independent success', async t => {
  for (const kind of ['nok', 'nod']) {
    const f = await fixture(t, kind);
    click(f, '#mode-independent');
    click(f, '#fresh-independent');
    const task = math.bank.find(item => item.id === f.state().taskId);
    assert.equal(f.state().mode, 'independent');
    assert.equal(f.state().guidedUsed, false);
    assert.equal(f.state().hintUsed, false);
    assert.equal(f.q('#factorization-section'), null);
    assert.equal(f.q('#pairs-section'), null);
    assert.equal(f.q('#build-section'), null);
    assert.equal(f.q('.result-expression'), null);
    assert.equal(f.q('.answer-proof'), null);
    assert.equal(f.q('#answer-input').value, '');
    const expected = oracle(kind, task.a, task.b);
    for (const raw of ['', '1e2', '3/2', '-1', String(expected + 1)]) {
      const feedback = answer(f, raw);
      assert.equal(feedback.classList.contains('success'), false);
      assert.equal(f.q('#answer-input').value, raw);
      assert.equal(f.state().taskId, task.id);
      assert.equal(f.q('.answer-proof'), null);
    }
    enter(f, '#answer-input', '17');
    click(f, '#hint-toggle');
    click(f, '#hint-step');
    assert.equal(f.q('#answer-input').value, '17');
    assert.doesNotMatch(f.q('#current-hint').textContent, /\d/, 'Independent hints do not disclose the computed answer');
    click(f, '#hint-toggle');
    const helped = answer(f, expected);
    assert.match(helped.textContent, /использована подсказка/);
    assert.doesNotMatch(helped.textContent, /без подсказок/);
    const oldTask = f.state().taskId;
    click(f, '#fresh-independent');
    assert.notEqual(f.state().taskId, oldTask);
    assert.equal(f.state().hintUsed, false);
    assert.equal(f.state().guidedUsed, false);
    assert.equal(f.q('#answer-input').value, '');
    const fresh = math.bank.find(item => item.id === f.state().taskId);
    assert.match(answer(f, oracle(kind, fresh.a, fresh.b)).textContent, /без подсказок/);
  }
});

test('changing modes preserves current input and accepted steps; only a fresh task clears assistance', async t => {
  const f = await fixture(t, 'nok');
  f.load('nt-1-5');
  accept(f, 'a', 2, 6);
  enter(f, '#divisor-a', '3');
  click(f, '#mode-independent');
  enter(f, '#answer-input', '36');
  click(f, '#mode-guided');
  assert.deepEqual(f.state().rowsA, [{ divisor: 2, quotient: 6 }]);
  assert.equal(f.q('#divisor-a').value, '3');
  assert.equal(f.state().answer, '36');
  click(f, '#mode-independent');
  assert.equal(f.q('#answer-input').value, '36');
  assert.match(answer(f, 36).textContent, /разобран по шагам/);
  click(f, '#fresh-independent');
  assert.equal(f.state().guidedUsed, false);
  assert.deepEqual(f.state().rowsA, []);
  assert.equal(f.state().answer, '');
});

test('level and previous/next controls choose valid tasks and never change the selected trainer kind', async t => {
  const f = await fixture(t, 'nod');
  for (const level of [1, 2, 3]) {
    const select = f.q('#level-select'); select.value = String(level);
    select.dispatchEvent(new f.window.Event('change', { bubbles: true }));
    valid(f);
    const expected = math.bank.filter(task => task.level === level);
    assert.equal(f.state().taskId, expected[0].id);
    click(f, '#previous-task');
    assert.equal(f.state().taskId, expected.at(-1).id);
    click(f, '#next-task');
    assert.equal(f.state().taskId, expected[0].id);
    assert.equal(f.state().kind, 'nod');
  }
});

function rejectAtomically(f, raw, label) {
  const beforeState = JSON.stringify(f.api.getState());
  const beforeDom = f.q('#trainer').innerHTML;
  assert.throws(() => f.api.validateState(raw), undefined, label + ': validate');
  assert.throws(() => f.api.applyState(raw), undefined, label + ': apply');
  assert.equal(JSON.stringify(f.api.getState()), beforeState, label + ': state is unchanged');
  assert.equal(f.q('#trainer').innerHTML, beforeDom, label + ': DOM is unchanged');
}

test('snapshot validation rejects malformed metadata, drafts and calculation rows atomically', async t => {
  const f = await fixture(t, 'nok');
  f.load('nt-1-5');
  const base = f.state();
  const changes = [
    ['wrong kind', { kind: 'nod' }], ['unknown task', { taskId: 'missing' }],
    ['mode', { mode: 'exam' }], ['stage', { stage: 'finished' }],
    ['oversized answer', { answer: '1'.repeat(2000) }], ['numeric answer', { answer: 36 }],
    ['HTML draft', { divisorDraftA: '<img src=x>' }], ['control character', { answer: '3\u0000' }],
    ['wrong flag', { hintUsed: 'true' }], ['hint history', { hintOpen: true, hintUsed: false }],
    ['hint level', { hintLevel: 3 }], ['guided history', { guidedUsed: false }],
    ['unknown feedback', { feedback: { scope: 'answer', code: 'approved' } }],
    ['composite divisor', { rowsA: [{ divisor: 4, quotient: 3 }] }],
    ['wrong quotient', { rowsA: [{ divisor: 2, quotient: 5 }] }],
    ['B before A', { rowsB: [{ divisor: 2, quotient: 9 }] }],
    ['invalid active divisor', { activeA: 5 }],
    ['non-prime active divisor', { activeA: 4 }],
    ['unknown row key', { rowsA: [{ divisor: 2, quotient: 6, approved: true }] }],
    ['oversized rows', { rowsA: Array.from({ length: 9 }, () => ({ divisor: 2, quotient: 1 })) }],
    ['build before factorization', { stage: 'build' }],
    ['pending factor before matching', { pendingA: 0 }],
    ['selection before build', { selected: [0] }],
    ['extra state key', { savedCredit: 1 }]
  ];
  for (const [label, change] of changes) rejectAtomically(f, f.realm({ ...base, ...change }), label);
  const missing = f.realm(base); delete missing.answer;
  rejectAtomically(f, missing, 'missing field');
  const sparse = f.realm(base); sparse.rowsA.length = 1;
  rejectAtomically(f, sparse, 'sparse array');
  assert.equal(f.stats.storageWrites, 0);
});

test('snapshot validation checks multiplicity, pair identities and completed build requirements', async t => {
  const f = await fixture(t, 'nok');
  f.load('nt-1-3');
  factorAll(f, 'a', 8); factorAll(f, 'b', 12);
  matchAll(f, 8, 12);
  const base = f.state();
  const changes = [
    ['duplicate A occurrence', { pairs: [{ a: 0, b: 0 }, { a: 0, b: 1 }] }],
    ['duplicate B occurrence', { pairs: [{ a: 0, b: 0 }, { a: 1, b: 0 }] }],
    ['unequal factors', { pairs: [{ a: 0, b: 0 }, { a: 1, b: 2 }] }],
    ['negative index', { pairs: [{ a: -1, b: 0 }, { a: 1, b: 1 }] }],
    ['fractional index', { pairs: [{ a: 0.5, b: 0 }, { a: 1, b: 1 }] }],
    ['missing completed pair', { pairs: [{ a: 0, b: 0 }] }],
    ['pending already paired', { pendingA: 0 }],
    ['duplicate selection', { selected: [2, 2] }],
    ['outside selection', { selected: [3] }],
    ['answer before correct build', { stage: 'answer', selected: [] }],
    ['answer with extra multiplier', { stage: 'answer', selected: [0, 2] }]
  ];
  for (const [label, change] of changes) rejectAtomically(f, f.realm({ ...base, ...change }), label);
  build(f, 8, 12);
  valid(f);
});

test('snapshot validation rejects getters and custom prototypes without invoking them', async t => {
  const f = await fixture(t, 'nod');
  f.load('nt-1-5');
  accept(f, 'a', 2, 6);
  const base = f.state();
  let accesses = 0;
  const topGetter = f.realm(base);
  Object.defineProperty(topGetter, 'answer', { enumerable: true, configurable: true, get() { accesses++; return ''; } });
  rejectAtomically(f, topGetter, 'top-level getter');
  const nestedGetter = f.realm(base);
  Object.defineProperty(nestedGetter.rowsA[0], 'divisor', { enumerable: true, configurable: true, get() { accesses++; return 2; } });
  rejectAtomically(f, nestedGetter, 'nested getter');
  const arrayGetter = f.realm(base);
  Object.defineProperty(arrayGetter.rowsA, '0', { enumerable: true, configurable: true, get() { accesses++; return { divisor: 2, quotient: 6 }; } });
  rejectAtomically(f, arrayGetter, 'array getter');
  const customObject = f.realm(base);
  Object.setPrototypeOf(customObject, f.window.Object.create(null));
  rejectAtomically(f, customObject, 'custom record prototype');
  const customArray = f.realm(base);
  const arrayProto = f.window.Object.create(f.window.Array.prototype);
  Object.defineProperty(arrayProto, 'toJSON', { value() { accesses++; return []; } });
  Object.setPrototypeOf(customArray.rowsA, arrayProto);
  rejectAtomically(f, customArray, 'custom array prototype');
  const hiddenField = f.realm(base);
  Object.defineProperty(hiddenField, 'answer', { enumerable: false, configurable: true, value: '' });
  rejectAtomically(f, hiddenField, 'non-enumerable required field');
  const hiddenRowField = f.realm(base);
  Object.defineProperty(hiddenRowField.rowsA[0], 'divisor', { enumerable: false, configurable: true, value: 2 });
  rejectAtomically(f, hiddenRowField, 'non-enumerable row field');
  const symbol = f.realm(base); symbol[f.window.Symbol('untrusted')] = true;
  rejectAtomically(f, symbol, 'symbol field');
  const prototypeKey = f.realm(base);
  Object.defineProperty(prototypeKey, '__proto__', { enumerable: true, value: { polluted: true } });
  rejectAtomically(f, prototypeKey, 'prototype key');
  assert.equal(accesses, 0, 'Validation must reject accessors and inherited serializers before executing them');
});

test('remote hydration restores partial rows, typed drafts and help without echoing or changing personal storage', async t => {
  for (const kind of ['nok', 'nod']) {
    const source = await fixture(t, kind);
    source.load('nt-1-5');
    accept(source, 'a', 3, 4);
    enter(source, '#divisor-a', '2');
    click(source, '#accept-a');
    enter(source, '#quotient-a', '2');
    click(source, '#hint-toggle');
    click(source, '#hint-step');
    const pending = source.state();
    const peer = await fixture(t, kind, { board: true });
    const beforeMessages = peer.messages.length;
    peer.send('mathexam:hydrate', pending, { mode: 'state' });
    await pause(70);
    assert.deepEqual(peer.state(), pending);
    assert.equal(peer.q('#quotient-a').value, '2');
    assert.match(peer.q('[data-column="a"] .ladder').textContent, /12.*3.*4.*2/s);
    assert.ok(peer.q('#current-hint .hint-detail'));
    assert.equal(peer.q('#hint-toggle').getAttribute('aria-expanded'), 'true');
    assert.equal(peer.stats.localNotifications, 0, 'Hydration must not be broadcast as a new local action');
    assert.equal(peer.messages.length, beforeMessages);
    assert.equal(peer.stats.storageWrites, 0);
    assert.equal(peer.window.localStorage.getItem('number-theory-dom-sentinel'), 'keep');
    click(source, '#accept-a');
    const next = source.state();
    peer.send('mathexam:apply-trainer-state', next);
    await pause(70);
    assert.deepEqual(peer.state(), next);
    assert.equal(peer.stats.localNotifications, 0);
    assert.equal(peer.messages.length, beforeMessages);
    assert.equal(peer.stats.storageWrites, 0);
    enter(peer, '#divisor-a', '2');
    await pause(70);
    assert.ok(peer.stats.localNotifications > 0, 'A new local action must still notify the SDK');
    const updates = peer.messages.filter(message => message.data.type === 'mathexam:trainer-state');
    assert.equal(updates.length, 1);
    assert.equal(updates[0].data.state.divisorDraftA, '2');
    assert.deepEqual(peer.diagnostics, []);
  }
});

test('remote independent drafts, checked feedback and settings restore without granting additional credit', async t => {
  const source = await fixture(t, 'nok');
  click(source, '#mode-independent'); click(source, '#fresh-independent');
  enter(source, '#answer-input', '17');
  click(source, '#check-answer');
  const details = source.q('#task-settings'); details.open = true;
  details.dispatchEvent(new source.window.Event('toggle'));
  const snapshot = source.state();
  const peer = await fixture(t, 'nok', { board: true });
  peer.send('mathexam:hydrate', snapshot, { mode: 'state' });
  await pause(70);
  assert.deepEqual(peer.state(), snapshot);
  assert.equal(peer.q('#answer-input').value, '17');
  assert.equal(peer.q('#task-settings').open, true);
  assert.equal(peer.q('[data-feedback-scope="answer"]').textContent, source.q('[data-feedback-scope="answer"]').textContent);
  assert.equal(peer.q('#factorization-section'), null);
  assert.equal(peer.q('.answer-proof'), null);
  assert.equal(peer.stats.localNotifications, 0);
  assert.equal(peer.stats.storageWrites, 0);
});
