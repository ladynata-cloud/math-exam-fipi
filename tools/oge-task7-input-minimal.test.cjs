'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../trainers/oge-task7-number-line.html'), 'utf8');
function between(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert(a >= 0 && b > a, 'real source region exists: ' + start);
  return source.slice(a, b);
}
const engine = [
  between('function bgcd(', 'const Q0='),
  between('function qcmp(', 'function qlt('),
  between('function parseQ(', '/* ---------- Модель утверждений'),
  between('function h(', '/* первое касание'),
  between('function mountSteps(', '/* ---------- Рендер условия задачи')
].join('\n');

// Exercise the actual page functions and registered click/keydown handlers.
// This small element double checks feedback and callback state, not DOM layout,
// browser event propagation, localStorage persistence or external adapters.
function element(tag) {
  let content = '';
  const listeners = new Map();
  const node = {
    tagName: tag.toUpperCase(), className: '', value: '', disabled: false,
    style: {}, children: [], attributes: {},
    appendChild(child) { this.children.push(child); return child; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    key(key) { for (const fn of listeners.get('keydown') || []) fn({key}); },
    querySelector(selector) {
      assert.equal(selector, 'input', 'only native first-input lookup is doubled');
      return descendants(this).find(n => n.tagName === 'INPUT') || null;
    }
  };
  for (const name of ['innerHTML', 'textContent']) Object.defineProperty(node, name, {
    get() { return content; },
    set(value) { content = String(value); node.children.length = 0; }
  });
  node.classList = {
    add(c) { node.className = [...new Set(node.className.split(/\s+/).filter(Boolean).concat(c))].join(' '); },
    remove(c) { node.className = node.className.split(/\s+/).filter(x => x && x !== c).join(' '); },
    contains(c) { return node.className.split(/\s+/).includes(c); }
  };
  return node;
}
function descendants(node) {
  return node.children.flatMap(child => [child, ...descendants(child)]);
}
function boot() {
  return vm.runInNewContext(engine + '\n({Q, parseQ, mountSteps})', {
    document: {createElement: element}, userActed: false,
    setTimeout(fn) { fn(); }
  });
}
function stepFixture(step) {
  const api = boot(), container = element('div');
  const calls = {miss: 0, hint: 0, show: 0, finalMiss: 0, done: []};
  api.mountSteps(container, [Object.assign({q: 'Аудиторский пример', hint: 'Доступная подсказка'}, step)], {
    onMiss() { calls.miss++; }, onHint() { calls.hint++; }, onShow() { calls.show++; },
    onFinalMiss() { return ++calls.finalMiss; },
    onDone(shown, hinted) { calls.done.push([shown, hinted]); }
  });
  const nodes = descendants(container);
  const inputs = nodes.filter(n => n.tagName === 'INPUT');
  const check = nodes.find(n => n.tagName === 'BUTTON' && n.classList.contains('primary'));
  const message = nodes.find(n => n.tagName === 'SPAN' && n.classList.contains('msg'));
  assert(check && message && inputs.length, 'native step controls were created');
  return {
    api, calls, inputs, check, message,
    submit(values, mode = 'click') {
      inputs.forEach((input, i) => { input.value = String(values[i]); });
      if (mode === 'click') check.onclick();
      else inputs[mode === 'enter-second' ? 1 : 0].key('Enter');
    }
  };
}
function noPenalty(f) {
  assert.deepEqual(f.calls, {miss: 0, hint: 0, show: 0, finalMiss: 0, done: []});
  assert.equal(f.check.disabled, false);
  assert(f.inputs.every(input => input.disabled === false));
}

test('user fractions reject a zero denominator without weakening exact Q arithmetic', () => {
  const api = boot();
  for (const input of ['1/0', '0/0', '-1/0', '−1/0', '1 / 0', ' 1 / 00 '])
    assert.equal(api.parseQ(input), null, input);
  assert.throws(() => api.Q(1n, 0n), /den=0/, 'the internal arithmetic invariant remains strict');
  const q = api.Q(1n, -2n);
  assert.equal(q.n, -1n);
  assert.equal(q.d, 2n);
});

test('valid integer, signed fraction and decimal formats retain exact values including zero', () => {
  const api = boot();
  const cases = [
    ['0', '0', '1'], ['-0', '0', '1'], ['0/7', '0', '1'],
    ['42', '42', '1'], ['−3', '-3', '1'], ['2/4', '1', '2'],
    ['-3/4', '-3', '4'], [' −3 / 4 ', '-3', '4'],
    ['0.5', '1', '2'], ['0,5', '1', '2'], ['−0,50', '-1', '2'],
    ['1.50', '3', '2'], ['9007199254740993/3', '3002399751580331', '1']
  ];
  for (const [input, n, d] of cases) {
    const q = api.parseQ(input);
    assert(q, input + ' is filled numeric input');
    assert.deepEqual([String(q.n), String(q.d)], [n, d], input);
  }
});

test('blank and unsupported syntax remain invalid instead of becoming numeric zero', () => {
  const api = boot();
  for (const input of ['', ' ', null, undefined, 'abc', '1/0.0', '1/-2', '1//2', '1e3'])
    assert.equal(api.parseQ(input), null, String(input));
});

for (const mode of ['click', 'enter-first']) test('single-field invalid input and recovery via ' + mode, () => {
  const f = stepFixture({type: 'int', ans: 6});
  f.submit(['1/0'], mode);
  assert.equal(f.message.textContent, 'Впиши число.');
  assert.equal(f.inputs[0].value, '1/0', 'draft remains editable');
  noPenalty(f);
  f.submit(['6'], mode);
  assert.equal(f.message.textContent, 'верно ✓');
  assert.equal(f.inputs[0].disabled, true);
  assert.equal(f.check.disabled, true);
  assert.deepEqual(f.calls, {miss: 0, hint: 0, show: 0, finalMiss: 0, done: [[false, false]]});
});

for (const mode of ['click', 'enter-first', 'enter-second']) for (const badField of [0, 1])
  test('two-field zero denominator in field ' + (badField + 1) + ' and recovery via ' + mode, () => {
    const f = stepFixture({type: 'int2', ans1: 6, ans2: 10});
    const values = ['6', '10']; values[badField] = '1/0';
    f.submit(values, mode);
    assert.equal(f.message.textContent, 'Впиши число в оба поля.');
    assert.deepEqual(f.inputs.map(input => input.value), values, 'both drafts retained');
    noPenalty(f);
    f.submit(['6', '10'], mode);
    assert.equal(f.message.textContent, 'верно ✓');
    assert(f.inputs.every(input => input.disabled));
    assert.equal(f.check.disabled, true);
    assert.deepEqual(f.calls, {miss: 0, hint: 0, show: 0, finalMiss: 0, done: [[false, false]]});
  });

test('blank is neutral but a valid zero can complete the same native step', () => {
  const f = stepFixture({type: 'int', ans: 0});
  f.submit(['']);
  assert.equal(f.message.textContent, 'Впиши число.');
  noPenalty(f);
  f.inputs[0].value = '0';
  f.inputs[0].key('x');
  noPenalty(f);
  f.inputs[0].key('Enter');
  assert.equal(f.message.textContent, 'верно ✓');
  assert.deepEqual(f.calls.done, [[false, false]]);
});

test('an ordinary wrong numeric answer still invokes the native error callback', () => {
  const f = stepFixture({type: 'int2', ans1: 6, ans2: 10});
  f.submit(['5', '10']);
  assert.equal(f.calls.miss, 1);
  assert.equal(f.calls.hint, 0);
  assert.equal(f.calls.show, 0);
  assert.match(f.message.innerHTML, /Пока не сходится/);
  assert.deepEqual(f.calls.done, []);
  f.submit(['1/0', '10']);
  assert.equal(f.message.textContent, 'Впиши число в оба поля.', 'invalid input replaces old feedback');
  assert.equal(f.calls.miss, 1, 'invalid input adds no second mathematical error');
  f.submit(['6', '10']);
  assert.equal(f.calls.miss, 1);
  assert.deepEqual(f.calls.done, [[false, false]]);
});

test('invalid fraction does not consume a final-option attempt; a real wrong option does', () => {
  const f = stepFixture({type: 'int', ans: 2, final: true, nOpts: 4});
  f.submit(['1/0'], 'enter-first');
  noPenalty(f);
  f.submit(['1']);
  assert.equal(f.calls.finalMiss, 1);
  assert.equal(f.calls.miss, 1);
  assert.equal(f.calls.hint, 0);
  f.submit(['2'], 'enter-first');
  assert.equal(f.message.textContent, 'верно ✓');
  assert.deepEqual(f.calls.done, [[false, false]]);
});

test('DOM: native one- and two-field routes reject zero denominators on click and Enter', {timeout: 20000}, async () => {
  const {JSDOM, VirtualConsole} = require('jsdom');
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  let seed = 773;
  const dom = new JSDOM(source, {
    url: 'https://mathexam.test/trainers/oge-task7-number-line.html',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    // External resources deliberately stay disabled: this test targets native
    // input handlers. The existing course/browser suites cover integrations.
    beforeParse(w) {
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.__TESTHOOK__ = true;
      w.TextEncoder = TextEncoder;
      w.Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
      w.localStorage.setItem('mathExamCourseProgress.v1', JSON.stringify({
        unrelated: {keep: 'sentinel', solvedByType: {a: 3}}
      }));
    }
  });
  try {
    await new Promise(resolve => dom.window.addEventListener('load', resolve, {once: true}));
    const w = dom.window, d = w.document, key = 'mathExamCourseProgress.v1';
    const scenarios = [
      ['betint', 'click', 0], ['betint', 'click', 1],
      ['betint', 'enter-first', 0], ['betint', 'enter-first', 1],
      ['betint', 'enter-second', 0], ['betint', 'enter-second', 1],
      ['tenths', 'click', 0], ['tenths', 'enter-first', 0]
    ];
    for (const [subtype, mode, badField] of scenarios) {
      w.eval('stepGroup="frac";stepSub=' + JSON.stringify(subtype) + ';stepMethod="school";renderStepChips();newStepTask();switchTab("steps");');
      assert(d.querySelector('#mode-steps.active'), 'the actual steps route is active');
      const host = d.getElementById('stepTask'), card = host.querySelector('.stepcard');
      const inputs = [...card.querySelectorAll('input.ans')];
      assert.equal(inputs.length, subtype === 'betint' ? 2 : 1);
      const button = [...card.querySelectorAll('button')].find(n => n.textContent === 'Проверить');
      const feedback = card.querySelector('.msg'), hintbox = card.querySelector('.hintbox');
      const prompt = card.querySelector('.stepq').textContent;
      const match = prompt.match(/Подели с остатком: (\d+) = \?·(\d+)/);
      assert(match, 'real generator produced a division-with-remainder step: ' + prompt);
      const numerator = Number(match[1]), denominator = Number(match[2]);
      const correct = [String(Math.floor(numerator / denominator))];
      if (inputs.length === 2) correct.push(String(numerator % denominator));
      const submit = values => {
        inputs.forEach((input, i) => { input.value = values[i]; });
        if (mode === 'click') button.click();
        else inputs[mode === 'enter-second' ? 1 : 0].dispatchEvent(new w.KeyboardEvent('keydown', {
          key: 'Enter', bubbles: true, cancelable: true
        }));
      };
      const beforeStore = w.localStorage.getItem(key);
      const beforeCounters = w.eval('JSON.stringify(CNT.step)');
      const values = correct.slice(); values[badField] = '1/0';
      submit(values);
      assert.equal(feedback.textContent, inputs.length === 2 ? 'Впиши число в оба поля.' : 'Впиши число.');
      assert.deepEqual(inputs.map(input => input.value), values, 'native DOM retains both input drafts');
      assert(inputs.every(input => !input.disabled));
      assert.equal(button.disabled, false);
      assert.equal(hintbox.style.display, 'none', 'validation does not open a hint');
      assert.equal(host.querySelectorAll('.stepcard').length, 1, 'invalid input does not advance');
      assert.equal(w.localStorage.getItem(key), beforeStore, 'validation does not mutate course progress');
      assert.equal(w.eval('JSON.stringify(CNT.step)'), beforeCounters, 'no solved/hinted/shown credit');
      submit(correct);
      assert.equal(feedback.textContent, 'верно ✓');
      assert(inputs.every(input => input.disabled));
      assert.equal(button.disabled, true);
      assert.equal(host.querySelectorAll('.stepcard').length, 2, 'a corrected answer opens the next step');
      assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).unrelated, {
        keep: 'sentinel', solvedByType: {a: 3}
      });
      assert.deepEqual(errors, [], 'no native page exception on ' + subtype + '/' + mode + '/' + badField);
    }
  } finally {
    dom.window.close();
  }
});

test('the exact input receipt preserves the full pinned source and rejects every other change', () => {
  const {createHash} = require('node:crypto');
  const {restoreOge7Input, BEFORE, AFTER} = require('./oge7-number-input-preservation.cjs');
  const sha = value => createHash('sha256').update(value).digest('hex');
  const originalHash = '327b041bf929619f3ced888e576ce12c560def6fd918aa637fc967ee355504ca';
  assert.equal(sha(restoreOge7Input(source)), originalHash, 'all original main198 HTML bytes recovered');
  const scripts = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(x => !(/\bsrc\s*=/.test(x[1]))).map(x => x[2]).join('\n');
  assert.equal(sha(restoreOge7Input(scripts)),
    '1c8377171051d6cd9582537dcfca1d270f00300b0b1a8f15fb0cd0f40f7348dc',
    'the existing full native-engine pin is unchanged');
  for (const altered of [
    source.replace(AFTER, ''),
    source + AFTER,
    source.replace(AFTER, AFTER.replace('d===0n', 'd!==0n')),
    source + BEFORE
  ]) {
    assert.notEqual(altered, source, 'effective missing/duplicate/modified fragment probe');
    assert.throws(() => restoreOge7Input(altered), /OGE7 input:/);
  }
  for (const altered of [
    source + '\n<!-- unreviewed source -->',
    source.replace('<title>', '<title>Unreviewed source '),
    source.replace('if(d===0n) throw new Error("den=0");', 'if(d===0n) return null;')
  ]) {
    assert.notEqual(altered, source, 'effective extra/source/arithmetic change probe');
    assert.notEqual(sha(restoreOge7Input(altered)), originalHash,
      'known guard inversion must not absorb an unrelated byte or arithmetic change');
  }
});
