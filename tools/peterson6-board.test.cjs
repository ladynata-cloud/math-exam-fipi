'use strict';

// In-memory integration of the real wrapper, course application and adapter.
// This does not replace actual browser/Socket.IO or visual verification.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = resolve(__dirname, '..');
const PATH = '/trainers/peterson6.html';
const clone = value => JSON.parse(JSON.stringify(value));

function fixture(options = {}) {
  const errors = [], console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(readFileSync(resolve(ROOT, '.' + PATH), 'utf8'), {
    url: 'https://local.example' + (options.path || PATH) + (options.route || '#home'),
    runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: console
  });
  const w = dom.window, d = w.document, accesses = { local: 0, session: 0 };
  let registration, unsubscribe, bridge, notifications = 0;
  const messages = [], diagnostics = [];
  const parent = { postMessage(value, origin) { messages.push({ value: clone(value), origin }); } };
  if (options.realSdk) {
    Object.defineProperty(w, 'parent', { get: () => parent });
    w.addEventListener('mathexam:bridge-diagnostic', event => diagnostics.push(clone(event.detail)));
  }
  if (options.marker !== undefined) d.body.dataset.petersonBoard = options.marker;
  w.TextEncoder = TextEncoder;
  w.scrollTo = (_x, y) => { w.scrollY = y; };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.console.error = (...values) => errors.push(values.map(String).join(' '));
  // Throw and count even reads the application catches. This also precludes writes.
  Object.defineProperty(w, 'localStorage', { get() { accesses.local++; throw Error('Personal localStorage is outside the room'); } });
  Object.defineProperty(w, 'sessionStorage', { get() { accesses.session++; throw Error('Personal sessionStorage is outside the room'); } });
  w.MathExamBoard = { register(config) {
    assert.equal(registration, undefined, 'one SDK registration'); registration = config;
    if (options.subscribe !== false) unsubscribe = config.subscribe(() => { notifications++; });
    return { destroy() { unsubscribe?.(); } };
  } };
  for (const script of d.querySelectorAll('script[src]')) {
    const path = new URL(script.src).pathname;
    if (path === '/trainers/board-bridge.js') {
      if (!options.realSdk) continue;
      w.eval(readFileSync(resolve(ROOT, '.' + path), 'utf8'));
      const sdk = w.MathExamBoard;
      w.MathExamBoard = { ...sdk, register(config) {
        assert.equal(registration, undefined); registration = config;
        bridge = sdk.register(config); return bridge;
      } };
    } else w.eval(readFileSync(resolve(ROOT, '.' + path), 'utf8'));
  }
  const api = w.__peterson6Board;
  const intoWindow = value => w.JSON.parse(JSON.stringify(value));
  const state = () => clone(api.getState());
  const runtime = () => clone(w.PetersonApp.getState());
  const valid = value => api.validateState(intoWindow(value));
  const apply = value => api.applyState(intoWindow(value));
  const query = selector => { const node = d.querySelector(selector); assert(node, 'Missing ' + selector); return node; };
  const settle = () => new Promise(done => w.setTimeout(done, options.realSdk ? 75 : 25));
  function receive(type, extra = {}) {
    const ready = messages.find(item => item.value.type === 'mathexam:trainer-ready');
    assert(ready, 'actual SDK announces ready');
    w.dispatchEvent(new w.MessageEvent('message', {
      source: parent, origin: 'https://local.example',
      data: intoWindow({ ...ready.value, ...extra, type })
    }));
  }
  const published = () => messages.filter(item => item.value.type === 'mathexam:trainer-state').map(item => clone(item.value.state));
  async function navigate(hash) {
    w.location.hash = hash; await settle();
    assert.equal(w.location.hash, hash, 'hash route is reached');
    assert.equal(d.querySelector('.error-page'), null, 'no error page');
  }
  function input(selector, value) { const node = query(selector); node.value = String(value); node.dispatchEvent(new w.Event('input', { bubbles: true })); }
  function click(selector) { query(selector).click(); }
  function submit(selector) { query(selector).dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); }
  function appearance() {
    // A textarea's textContent is its default value, not the text currently
    // displayed after typing. Compare current values below, separately.
    const prose = query('#main').cloneNode(true);
    for (const textarea of prose.querySelectorAll('textarea')) textarea.textContent = '';
    return {
      text: prose.textContent,
      values: [...d.querySelectorAll('#main input,#main textarea,#main select')].map(node => ({ tag: node.tagName, value: node.value, readOnly: node.readOnly, disabled: node.disabled })),
      details: [...d.querySelectorAll('#main details')].map(node => node.open),
      pictures: [...d.querySelectorAll('#main svg')].map(node => node.outerHTML),
      choices: [...d.querySelectorAll('[data-choice]')].map(node => node.getAttribute('aria-pressed'))
    };
  }
  function roundtrip(label) {
    const before = state(), view = appearance();
    assert(valid(before), label + ': exported snapshot is valid');
    apply(before);
    assert.deepEqual(state(), before, label + ': state roundtrip');
    const restored = appearance();
    if (restored.text !== view.text) {
      let index = 0; while (restored.text[index] === view.text[index]) index++;
      assert.fail(label + ': visible text changed at ' + index + '\nBefore: ' + view.text.slice(Math.max(0, index - 70), index + 150) + '\nAfter: ' + restored.text.slice(Math.max(0, index - 70), index + 150));
    }
    assert.deepEqual({ ...restored, text: '' }, { ...view, text: '' }, label + ': displayed controls/picture roundtrip');
    assert.deepEqual(accesses, { local: 0, session: 0 }, label + ': no personal storage access');
    assert.equal(errors.length, 0, errors.join('\n'));
    return before;
  }
  function close() { unsubscribe?.(); bridge?.destroy(); dom.window.close(); }
  return { dom, w, d, api, errors, accesses, registration, state, runtime, valid, apply, query, settle, navigate, input, click, submit, appearance, roundtrip, close, messages, diagnostics, receive, published, notifications: () => notifications };
}

test('only exact wrapper path and marker enable the isolated shared runtime', () => {
  const f = fixture();
  try {
    assert(f.api); assert.equal(f.registration.id, 'peterson6'); assert.equal(f.registration.version, '1.0.0');
    assert.equal(f.registration.stateSchemaVersion, 1); assert.equal(f.registration.parentOrigin, 'https://local.example');
    assert.match(f.d.querySelector('footer').textContent, /без зачёта в личный прогресс/);
    assert.equal(Object.keys(f.state().work.tasks).length, 0, 'home does not transmit all 224 untouched records');
    f.roundtrip('home');
  } finally { f.close(); }
  for (const options of [{ path: '/school/peterson6/' }, { path: '/trainers/peterson6-copy.html' }, { marker: 'other' }, { marker: '' }]) {
    const inactive = fixture(options);
    try { assert.equal(inactive.api, undefined); assert.equal(inactive.registration, undefined); }
    finally { inactive.close(); }
  }
});

test('all 224 authored tasks and 60 practice screens export and restore valid shared views', async () => {
  const f = fixture();
  try {
    let authored = 0, generated = 0;
    for (const lesson of f.w.PetersonCourse.lessons) for (let index = 0; index < lesson.tasks.length; index++) {
      await f.navigate('#lesson/' + lesson.id + '/' + index);
      assert.equal(f.query('.prompt').textContent.length > 0, true);
      assert.equal(f.query('#model').textContent.length > 0, true);
      const snapshot = f.roundtrip(lesson.id + '/' + index);
      assert.equal(snapshot.view.model.lessonId, lesson.id);
      assert.equal(snapshot.view.model.kind, lesson.model);
      authored++;
    }
    for (const skill of f.w.PetersonMath.skills) for (let level = 1; level <= 3; level++) {
      await f.navigate('#practice/' + skill.id + '/' + level);
      const snapshot = f.roundtrip(skill.id + '/' + level);
      assert.equal(snapshot.work.practice[skill.id + ':' + level], 1);
      assert(snapshot.work.tasks['practice:' + skill.id + ':' + level + ':1']);
      generated++;
    }
    assert.equal(authored, 224); assert.equal(generated, 60);
    await f.navigate('#skills'); f.roundtrip('skills');
    await f.navigate('#progress'); f.roundtrip('shared summary');
    assert.equal(f.d.querySelector('#import-file'), null);
    assert.equal(f.d.querySelector('[data-action="export"]'), null);
    assert.match(f.query('#main').textContent, /не изменяет личные результаты ученика/);
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.close(); }
});

test('empty/wrong feedback, guided steps, notes and detour return survive application hydration', async () => {
  const f = fixture();
  try {
    await f.navigate('#lesson/p08/0');
    f.submit('#answer-form'); f.roundtrip('empty final answer');
    assert.match(f.query('#answer-form').textContent, /Сначала введи результат/);
    f.input('#final-answer', '999999'); f.submit('#answer-form'); f.roundtrip('wrong final answer');
    assert.equal(f.runtime().tasks['p08-t01'].attempts, 1);
    f.click('[data-action="guided"]'); f.submit('[data-step-form="0"]');
    assert.equal(f.roundtrip('empty step').view.stepFeedback, 'empty');
    f.input('[data-step-input="0"]', '1/2'); f.submit('[data-step-form="0"]');
    assert.equal(f.roundtrip('wrong required step format').view.stepFeedback, 'wrong');
    assert.equal(f.runtime().tasks['p08-t01'].step, 0);
    f.click('[data-action="step-hint"]'); f.click('[data-action="reveal"]');
    f.roundtrip('step hint and revealed calculation');
    f.input('[data-step-input="0"]', '0,5'); f.submit('[data-step-form="0"]');
    assert.equal(f.runtime().tasks['p08-t01'].step, 1);
    assert.match(f.query('.recorded').textContent, /0,5/);
    f.input('#final-answer', '0,86'); f.input('#notebook', 'Сначала 0,36 + 0,5; проверяю вычисление.');
    f.query('#notebook').closest('details').open = true;
    f.roundtrip('accepted first step and open notebook');
    f.query('#notebook').closest('details').open = false;
    f.roundtrip('explicitly closed notebook with retained notes');
    f.w.scrollY = 240;
    const skill = f.query('[data-action="detour"]').dataset.skill;
    f.click('[data-action="detour"]'); await f.settle();
    assert.equal(f.w.location.hash, '#practice/' + skill + '/1');
    let snapshot = f.roundtrip('practice detour');
    assert.equal(snapshot.work.origin.hash, '#lesson/p08/0'); assert.equal(snapshot.work.origin.scroll, 240);
    assert.equal(f.runtime().tasks['p08-t01'].value, '0,86'); assert.equal(f.runtime().tasks['p08-t01'].step, 1);
    assert.equal(f.runtime().tasks['p08-t01'].assisted, true);
    const condition = f.query('.prompt').textContent, seed = snapshot.work.practice[skill + ':1'];
    f.click('[data-action="new"]'); await f.settle();
    snapshot = f.roundtrip('new practice condition with saved origin');
    assert(snapshot.work.practice[skill + ':1'] > seed); assert.notEqual(f.query('.prompt').textContent, condition);
    f.click('[data-action="return"]'); await f.settle();
    assert.equal(f.w.location.hash, '#lesson/p08/0'); assert.equal(f.query('#final-answer').value, '0,86');
    assert.equal(f.query('#notebook').value, 'Сначала 0,36 + 0,5; проверяю вычисление.');
    assert.equal(f.d.querySelectorAll('.step.completed').length, 1); assert.equal(f.state().work.origin, null);
    f.submit('#answer-form'); f.roundtrip('accepted original answer after detour');
    assert.equal(f.runtime().tasks['p08-t01'].correct, true); assert.equal(f.runtime().tasks['p08-t01'].independent, false);
    assert.equal(f.runtime().tasks['p08-t01'].completion.independent, false);
    assert.match(f.query('#problem').textContent, /Разобрали на уроке/);
    assert.equal(f.errors.length, 0, f.errors.join('\n'));
  } finally { f.close(); }
});

test('choice answers and successful shared work never award personal independent credit', async () => {
  const f = fixture();
  try {
    await f.navigate('#lesson/p01/0');
    const task = f.w.PetersonCourse.lessons[0].tasks[0];
    f.submit('#answer-form'); f.roundtrip('empty choice');
    f.click('[data-choice="' + task.choices.indexOf(task.answer) + '"]');
    f.roundtrip('selected choice'); f.submit('#answer-form'); f.roundtrip('accepted choice');
    const current = f.runtime().tasks[task.id];
    assert.equal(current.correct, true); assert.equal(current.attempts, 1); assert.equal(current.assisted, false);
    assert.equal(current.independent, false); assert.equal(current.completion.independent, false);
    f.click('[data-action="hint"]'); f.roundtrip('informational hint after shared completion');
    assert.equal(f.runtime().tasks[task.id].completion.independent, false);
    await f.navigate('#progress'); f.roundtrip('shared progress');
    assert.equal(f.d.querySelector('[data-action="export"],#import-file'), null);
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.close(); }
});

test('a fresh observer receives the source model and draft, then continues from restored work', async () => {
  const source = fixture(), observer = fixture();
  try {
    await source.navigate('#lesson/p09/0');
    const sliders = source.d.querySelectorAll('#model input[type="range"]');
    sliders[0].value = '17'; sliders[0].dispatchEvent(new source.w.Event('input', { bubbles: true }));
    sliders[1].value = '3.5'; sliders[1].dispatchEvent(new source.w.Event('input', { bubbles: true }));
    source.input('#final-answer', '12,5'); source.input('#notebook', 'Общий черновик: течение помогает и мешает.');
    source.query('#notebook').closest('details').open = true;
    const sent = source.state(); observer.apply(sent);
    assert.deepEqual(observer.state(), sent, 'late observer receives source state from an unrelated initial route');
    assert.deepEqual(observer.appearance(), source.appearance());
    const receiverSlider = observer.query('#model input[type="range"]');
    receiverSlider.value = '12'; receiverSlider.dispatchEvent(new observer.w.Event('input', { bubbles: true }));
    observer.input('#notebook', 'Продолжаю общий черновик после передачи управления.');
    assert.match(observer.query('#model').textContent, /15,5 − 8,5 = 7 = 2 · 3,5/);
    source.apply(observer.state());
    assert.equal(source.query('#notebook').value, 'Продолжаю общий черновик после передачи управления.');
    assert.equal(source.query('#final-answer').value, '12,5');
    assert.deepEqual(source.state(), observer.state());
    assert.deepEqual(source.accesses, { local: 0, session: 0 }); assert.deepEqual(observer.accesses, { local: 0, session: 0 });
  } finally { source.close(); observer.close(); }
});

test('the actual SDK publishes local interactions and deduplicates remote hydration without an echo', async () => {
  const source = fixture({ realSdk: true }), observer = fixture({ realSdk: true });
  async function changed(f, label, action) {
    const count = f.published().length;
    await action(); await f.settle();
    const sent = f.published();
    assert(sent.length > count, label + ': subscriber reaches the actual SDK');
    assert(f.valid(sent.at(-1)), label + ': published snapshot is valid');
    assert.deepEqual(sent.at(-1), f.state(), label + ': publication matches visible current work');
  }
  try {
    for (const f of [source, observer]) {
      f.receive('mathexam:hydrate', { mode: 'empty' });
      f.receive('mathexam:request-trainer-state');
      await f.settle();
      assert.equal(f.published().length, 1);
    }
    await changed(source, 'number input', () => source.input('#exercise-number', '177'));
    await changed(source, 'number submit', () => source.submit('#number-form'));
    await changed(source, 'disclosure toggle', () => { source.query('#main details').open = true; });
    await changed(source, 'hash navigation', () => source.navigate('#lesson/p08/0'));
    await changed(source, 'guided button', () => source.click('[data-action="guided"]'));
    await changed(source, 'step draft', () => source.input('[data-step-input="0"]', '0,5'));
    await changed(source, 'accepted step submit', () => source.submit('[data-step-form="0"]'));
    await changed(source, 'practice detour click', () => source.click('[data-action="detour"]'));
    await changed(source, 'level change', () => {
      const level = source.query('#level'); level.value = '2';
      level.dispatchEvent(new source.w.Event('change', { bubbles: true }));
    });
    await changed(source, 'new practice condition', () => source.click('[data-action="new"]'));
    await changed(source, 'return click', () => source.click('[data-action="return"]'));
    await changed(source, 'model route', () => source.navigate('#lesson/p09/0'));
    await changed(source, 'model input', () => source.input('#model input[type="range"]', '17'));
    await changed(source, 'shared note input', () => source.input('#notebook', 'Проверяем общее течение.'));
    await changed(source, 'shared notebook toggle', () => { source.query('#notebook').closest('details').open = true; });
    const count = observer.published().length;
    observer.receive('mathexam:apply-trainer-state', { state: source.published().at(-1) });
    await observer.settle();
    assert.deepEqual(observer.state(), source.state());
    assert.deepEqual(observer.appearance(), source.appearance());
    assert.equal(observer.published().length, count, 'remote application and resulting toggle events do not echo through the real SDK');
    await changed(observer, 'observer continues note', () => observer.input('#notebook', 'Добавляю новую общую запись.'));
    const sourceCount = source.published().length;
    source.receive('mathexam:apply-trainer-state', { state: observer.published().at(-1) });
    await source.settle();
    assert.deepEqual(source.state(), observer.state());
    assert.equal(source.published().length, sourceCount, 'the original author also suppresses remote echo');
    for (const f of [source, observer]) {
      assert.deepEqual(f.diagnostics, []); assert.deepEqual(f.errors, []);
      assert(f.messages.every(item => item.origin === 'https://local.example'));
      assert.deepEqual(f.accesses, { local: 0, session: 0 });
    }
  } finally { source.close(); observer.close(); }
});

test('source number lookup keeps the submitted result separately from a newly typed draft', () => {
  const f = fixture();
  try {
    f.input('#exercise-number', '177'); f.submit('#number-form'); f.roundtrip('source example 177');
    assert.match(f.query('#number-result').textContent, /страница 47/);
    assert(f.d.querySelector('#number-result a[href="#lesson/p08/0"]'));
    f.input('#exercise-number', '178');
    const snapshot = f.roundtrip('new lookup draft retains previous submitted result');
    assert.deepEqual(snapshot.view.number, { draft: '178', submitted: 177 });
    assert.match(f.query('#number-result').textContent, /№ 177/);
    f.input('#exercise-number', '0'); f.submit('#number-form');
    assert.equal(f.roundtrip('invalid exercise number').view.number.submitted, 'invalid');
    assert.match(f.query('#number-result').textContent, /от 1 до 497/);
  } finally { f.close(); }
});

test('malformed snapshots are rejected before memory, route, model or DOM mutation', async () => {
  const f = fixture();
  try {
    await f.navigate('#lesson/p08/0'); f.click('[data-action="guided"]');
    f.input('[data-step-input="0"]', '0,5'); f.submit('[data-step-form="0"]');
    f.input('#final-answer', '0,86'); f.input('#notebook', 'Запись сохраняется');
    const before = f.roundtrip('valid rejection baseline'), view = f.appearance(), runtime = f.runtime();
    const changes = [
      v => { v.route = '#lesson/p99/0'; }, v => { v.route = '#lesson/p08/999'; },
      v => { v.route += '/extra'; }, v => { v.route = '#practice/unknown/1'; },
      v => { v.extra = true; }, v => { v.work.independent = true; },
      v => { v.work.tasks.foreign = clone(v.work.tasks['p08-t01']); },
      v => { v.work.tasks['p08-t01'][0] = '<img src=x>'; },
      v => { v.work.tasks['p08-t01'][0] = '1'.repeat(201); },
      v => { v.work.tasks['p08-t01'][1][0] = '1/2'; },
      v => { v.work.tasks['p08-t01'][2] = 99; },
      v => { v.work.tasks['p08-t01'][3] = 16; },
      v => { v.work.tasks['p08-t01'][4] = [99]; },
      v => { v.work.tasks['p08-t01'][5] = [99]; },
      v => { v.work.tasks['p08-t01'][6] = -1; },
      v => { v.work.tasks['p08-t01'][7] = 'a'.repeat(2001); },
      v => { v.work.tasks['p08-t01'][8] = 'Произвольная обратная связь'; },
      v => { v.work.tasks['p08-t01'][9] = true; },
      v => { v.work.tasks['p08-t01'].push(true); },
      v => { v.work.practice['fraction-multiply:4'] = 1; },
      v => { v.work.origin = { hash: '#practice/fraction-multiply/1', scroll: 0 }; },
      v => { v.view.model.a = 100; }, v => { v.view.model.lessonId = 'p09'; },
      v => { v.view.details = [true]; }, v => { v.view.stepFeedback = 'right'; },
      v => { v.view.number = { draft: '177', submitted: 177 }; }
    ];
    for (const change of changes) {
      const value = clone(before); change(value);
      assert.equal(f.valid(value), false, String(change));
      assert.throws(() => f.apply(value), /Invalid Peterson board state/);
      assert.deepEqual(f.state(), before); assert.deepEqual(f.runtime(), runtime); assert.deepEqual(f.appearance(), view);
    }
    let getterCalls = 0;
    const getter = f.w.JSON.parse(JSON.stringify(before));
    Object.defineProperty(getter, 'route', { enumerable: true, get() { getterCalls++; return before.route; } });
    assert.equal(f.api.validateState(getter), false); assert.throws(() => f.api.applyState(getter));
    const sparse = f.w.JSON.parse(JSON.stringify(before)); sparse.work.tasks['p08-t01'][1] = new f.w.Array(1);
    assert.equal(f.api.validateState(sparse), false); assert.throws(() => f.api.applyState(sparse));
    const extra = f.w.JSON.parse(JSON.stringify(before)); extra.view.details.extra = true;
    assert.equal(f.api.validateState(extra), false); assert.throws(() => f.api.applyState(extra));
    assert.equal(getterCalls, 0); assert.deepEqual(f.state(), before); assert.deepEqual(f.appearance(), view);
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.close(); }
});

test('oversized new notes roll back atomically to the last valid shared work', async () => {
  const f = fixture();
  try {
    const completed = [], note = 'Длинная учебная запись. '.repeat(100).slice(0, 2000);
    let rolledBack = false;
    for (const lesson of f.w.PetersonCourse.lessons) {
      for (let index = 0; index < lesson.tasks.length; index++) {
        await f.navigate('#lesson/' + lesson.id + '/' + index);
        const before = f.state(), runtime = f.runtime();
        f.input('#notebook', note); await f.settle();
        const after = f.state();
        if (!f.query('#storage-warning').hidden) {
          assert.match(f.query('#storage-warning').textContent, /Восстановлена предыдущая общая работа|Последнее изменение отменено/);
          assert.deepEqual(after, before, 'overflow keeps the exact prior valid shared snapshot');
          assert.deepEqual(f.runtime().tasks[lesson.tasks[index].id], runtime.tasks[lesson.tasks[index].id], 'overflow keeps the current task draft');
          assert.equal(f.query('#notebook').value, '', 'rejected edit is visibly rolled back');
          for (const id of completed) assert.equal(f.runtime().tasks[id].note, note, id + ' keeps its prior note');
          rolledBack = true; break;
        }
        assert.equal(f.query('#notebook').value, note);
        assert(f.valid(after)); assert(Buffer.byteLength(JSON.stringify(after.work)) <= 48 * 1024);
        completed.push(lesson.tasks[index].id);
      }
      if (rolledBack) break;
    }
    assert(rolledBack, 'capacity limit must be reached'); assert(completed.length > 1);
    f.roundtrip('valid work after overflow'); assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.close(); }
});
