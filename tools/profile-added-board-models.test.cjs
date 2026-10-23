'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const ROOT = resolve(__dirname, '..');
const NUMBERS = [1, 2, 4, 6, 7];
const TRIG = ['geo-right-sine', 'geo-right-cosine', 'geo-right-tangent'];
const copy = value => JSON.parse(JSON.stringify(value));

function fixture() {
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
  const w = dom.window, storage = { local: 0, session: 0 };
  for (const [key, count] of [['localStorage', 'local'], ['sessionStorage', 'session']]) {
    Object.defineProperty(w, key, { get() { storage[count]++; throw Error('Personal storage is unavailable'); } });
  }
  for (const file of ['geometry-data', 'algebra-data', 'probability-data', 'equations-data',
    'geometry-models', 'algebra-models', 'planimetry-tasks', 'vector-tasks', 'probability-tasks', 'equations-tasks', 'solutions']) {
    w.eval(readFileSync(resolve(ROOT, 'ege-profil/start', file + '.js'), 'utf8'));
  }
  const lessons = w.ProfileLessons.filter(lesson => NUMBERS.includes(lesson.position));
  const tasks = lessons.flatMap(lesson => lesson.tasks);
  function mount(task, context = {}, renderer = w.ProfileTaskModels[task.id]) {
    const host = w.document.createElement('div'); w.document.body.append(host);
    const actions = { help: 0, explain: 0, current: 0 };
    const handle = renderer(host, task, { ...context,
      onHelp() { actions.help++; return true; }, onExplain() { actions.explain++; return true; },
      isCurrent() { actions.current++; return true; }
    });
    assert.equal(typeof handle, 'function');
    assert.equal(typeof handle.getBoardState, 'function');
    assert.equal(typeof handle.applyBoardState, 'function');
    assert.equal(typeof renderer.validateBoardState, 'function');
    w.ProfileSolutions.formatFractions(host);
    function view() {
      // These IDs only connect labels/clip paths within one render instance.
      return { html: host.innerHTML.replace(/\bvt-\d+/g, 'vt-instance').replace(/\bprofile-power-\d+/g, 'power-instance'),
        controls: [...host.querySelectorAll('input,select,details')].map(node => ({
          tag: node.tagName, value: node.value ?? null, checked: node.checked ?? null, open: node.open ?? null
        })) };
    }
    return { host, handle, renderer, actions, context, view, state: () => copy(handle.getBoardState()),
      button: selector => host.querySelector(selector),
      remove() { handle(); host.remove(); }
    };
  }
  function input(node, value, event = 'input') { node.value = value; node.dispatchEvent(new w.Event(event, { bubbles: true })); }
  function hydrate(source, target, label) {
    const snapshot = source.handle.getBoardState(), before = { ...target.actions };
    assert.equal(source.renderer.validateBoardState(snapshot, source.context), true, label + ': source state validates');
    target.handle.applyBoardState(snapshot);
    assert.deepEqual(target.state(), source.state(), label + ': semantic state');
    assert.deepEqual(target.view(), source.view(), label + ': authored drawing, input and explanation');
    assert.deepEqual(target.actions, before, label + ': hydration does not replay help or stale-attempt callbacks');
  }
  return { dom, w, lessons, tasks, storage, mount, input, hydrate,
    task: id => tasks.find(task => task.id === id), intoWindow: value => w.JSON.parse(JSON.stringify(value)) };
}

const independent = { mode: 'independent', step: 0, solved: false, completed: 0 };
const example = { ...independent, hideWalkthrough: true, strict: true };

test('all 132 added tasks retain their authored model coverage and every mounted task model round-trips', () => {
  const f = fixture();
  try {
    assert.equal(f.lessons.length, 22); assert.equal(f.tasks.length, 132);
    assert.deepEqual(NUMBERS.map(number => f.lessons.filter(lesson => lesson.position === number).length), [6, 4, 3, 3, 6]);
    let mounted = 0, withoutDrawing = 0;
    for (const task of f.tasks) {
      if (!f.w.ProfileTaskModels[task.id]) {
        assert.ok(task.id.startsWith('algebra-exponential-') || task.id.startsWith('algebra-logarithmic-'), task.id + ': only the existing exponential/logarithmic tasks have no task drawing');
        withoutDrawing++; continue;
      }
      mounted++;
      for (const context of [independent, { mode: 'guided', step: 0, solved: false, completed: 0 },
        { mode: 'guided', step: task.steps.length - 1, solved: true, completed: task.steps.length }, example]) {
        const source = f.mount(task, context), target = f.mount(task, context), label = task.id + '/' + context.mode + '/' + !!context.hideWalkthrough + '/' + context.solved;
        try {
          f.hydrate(source, target, label + '/initial');
          for (const button of [...source.host.querySelectorAll('button')]) button.click();
          const next = source.host.querySelector('[data-trig-next]');
          if (next) { next.click(); source.host.querySelector('[data-trig-open]').click(); }
          f.hydrate(source, target, label + '/changed');
          // The next local action must use the restored closure as well as the DOM.
          const a = source.host.querySelector('button'), b = target.host.querySelector('button');
          if (a && b) { a.click(); b.click(); assert.deepEqual(target.state(), source.state(), label + '/next action'); assert.deepEqual(target.view(), source.view()); }
        } finally { source.remove(); target.remove(); }
      }
    }
    assert.equal(mounted, 120); assert.equal(withoutDrawing, 12);
    assert.deepEqual(f.storage, { local: 0, session: 0 });
  } finally { f.dom.window.close(); }
});

test('all 22 lesson labs preserve controls, raw numeric drafts and the next local action', () => {
  const f = fixture();
  try {
    for (const lesson of f.lessons) {
      const renderer = f.w.ProfileModels[lesson.model], task = lesson.tasks[0];
      const source = f.mount(task, {}, renderer), target = f.mount(task, {}, renderer);
      try {
        f.hydrate(source, target, lesson.id + '/initial');
        for (const select of source.host.querySelectorAll('select')) f.input(select, select.options[select.options.length - 1].value, 'change');
        for (const input of source.host.querySelectorAll('input[type="number"]')) {
          const min = Number(input.min), max = Number(input.max);
          f.input(input, String(min + (max - min) * 0.75));
        }
        for (const checkbox of source.host.querySelectorAll('input[type="checkbox"]')) {
          checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new f.w.Event('change', { bubbles: true }));
        }
        for (const button of source.host.querySelectorAll('button')) button.click();
        const number = source.host.querySelector('input[type="number"]');
        if (number) f.input(number, '');
        f.hydrate(source, target, lesson.id + '/changed with empty draft');
        const a = source.host.querySelector('button'), b = target.host.querySelector('button');
        if (a && b) { a.click(); b.click(); assert.deepEqual(target.state(), source.state(), lesson.id + '/next action'); assert.deepEqual(target.view(), source.view()); }
      } finally { source.remove(); target.remove(); }
    }
    assert.deepEqual(f.storage, { local: 0, session: 0 });
  } finally { f.dom.window.close(); }
});

test('three inline walkthroughs preserve collapsed progress and rewind without creating extra help or steps', () => {
  const f = fixture();
  try {
    for (const id of TRIG) {
      const task = f.task(id), source = f.mount(task, independent), target = f.mount(task, independent);
      try {
        const states = [source.handle.getBoardState()];
        source.button('[data-trig-open]').click(); states.push(source.handle.getBoardState());
        source.button('[data-trig-next]').click();
        source.button('[data-trig-open]').click(); states.push(source.handle.getBoardState());
        assert.deepEqual(copy(states[2].walkthrough), { open: false, count: 2 });
        f.hydrate(source, target, id + '/collapsed two steps');
        assert.equal(target.host.querySelectorAll('[data-trig-step]').length, 2);
        assert.equal(target.button('[data-trig-explanation]').hidden, true);
        source.button('[data-trig-open]').click();
        while (source.state().walkthrough.count < 5) source.button('[data-trig-next]').click();
        states.push(source.handle.getBoardState()); f.hydrate(source, target, id + '/all five steps');
        for (const saved of [states[1], states[0], states[2], states[3]]) {
          const before = { ...target.actions }; target.handle.applyBoardState(saved);
          assert.deepEqual(target.state(), copy(saved), id + '/backward and forward hydration');
          assert.deepEqual(target.actions, before, id + '/no help replay');
          assert.equal(target.host.querySelectorAll('[data-trig-step]').length, saved.walkthrough.count);
        }
        assert.equal(source.actions.help, 1, id + '/first opening alone records help');
        const hidden = f.mount(task, example);
        try {
          assert.equal(hidden.state().walkthrough, null);
          assert.equal(hidden.renderer.validateBoardState(states[2], example), false, 'example/result cannot adopt a live walkthrough');
          assert.throws(() => hidden.handle.applyBoardState(states[2]), /Invalid/);
          assert.equal(source.renderer.validateBoardState(hidden.handle.getBoardState(), independent), false);
        } finally { hidden.remove(); }
      } finally { source.remove(); target.remove(); }
    }
  } finally { f.dom.window.close(); }
});

test('two simultaneous planimetry layers retain the last feedback and vectors reject unavailable controls', () => {
  const f = fixture();
  try {
    const task = f.task('geo-area-common-height'), source = f.mount(task, independent), target = f.mount(task, independent);
    try {
      const buttons = [...source.host.querySelectorAll('button')]; buttons[0].click(); buttons[1].click();
      assert.deepEqual(source.state().toggles, [true, true]); assert.equal(source.state().feedbackIndex, 1);
      f.hydrate(source, target, 'two open layers');
      buttons[0].click(); assert.deepEqual(source.state().toggles, [false, true]); assert.equal(source.state().feedbackIndex, -1);
      f.hydrate(source, target, 'closing one layer restores the authored default note');
    } finally { source.remove(); target.remove(); }
    let absent = 0;
    for (const task of f.tasks.filter(task => task.id.startsWith('vec-'))) {
      const model = f.mount(task, independent);
      try {
        for (const key of ['projection', 'construction']) if (!model.host.querySelector('[data-model-action="' + key + '"]')) {
          const bad = f.intoWindow(model.state()); bad[key] = true; absent++;
          assert.equal(model.renderer.validateBoardState(bad, independent), false, task.id + '/' + key);
          const before = model.view(); assert.throws(() => model.handle.applyBoardState(bad), /Invalid/); assert.deepEqual(model.view(), before);
        }
      } finally { model.remove(); }
    }
    assert.ok(absent > 0, 'the test exercises real restricted controls');
  } finally { f.dom.window.close(); }
});

test('power/log lab keeps invalid input, correct feedback and later changed feedback distinct', () => {
  const f = fixture(), lesson = f.lessons.find(lesson => lesson.id === 'algebra-exponential');
  const renderer = f.w.ProfileModels['power-log'], source = f.mount(lesson.tasks[0], {}, renderer), target = f.mount(lesson.tasks[0], {}, renderer);
  try {
    f.input(source.button('[data-base]'), '3', 'change'); f.input(source.button('[data-exponent]'), '-2'); source.button('[data-check]').click();
    assert.equal(source.state().feedback, 'correct'); f.hydrate(source, target, 'correct relation');
    f.input(source.button('[data-exponent]'), '9');
    assert.equal(source.state().exponent, -2); assert.equal(source.state().input, '9'); assert.equal(source.state().error, true);
    f.hydrate(source, target, 'out-of-range raw draft');
    f.input(source.button('[data-exponent]'), '0'); assert.equal(source.state().feedback, 'changed');
    f.hydrate(source, target, 'changed relation');
    source.button('[data-check]').click(); assert.equal(source.state().feedback, 'incorrect'); f.hydrate(source, target, 'incorrect relation');
  } finally { source.remove(); target.remove(); f.dom.window.close(); }
});

test('new model hooks reject malformed state atomically, do not read accessors and cannot hydrate disposed views', () => {
  const f = fixture();
  const cases = [
    ...['prof-triangle', 'prof-right-similarity', 'prof-construction', 'prof-circle', 'prof-vectors', 'power-log'].map(kind => {
      const lesson = f.lessons.find(lesson => lesson.model === kind); return () => f.mount(lesson.tasks[0], {}, f.w.ProfileModels[kind]);
    }),
    ...['geo-area-common-height', 'geo-right-sine', 'vec-coordinates-x', 'prob-count-1'].map(id => () => f.mount(f.task(id), independent))
  ];
  try {
    for (const create of cases) {
      const model = create();
      try {
        const good = model.handle.getBoardState(), before = model.view(), state = model.state();
        const badStates = [null, [], { ...state, extra: true }, { ...state, taskId: 'foreign-task' }].map(value => f.intoWindow(value));
        const inherited = Object.create(good); badStates.push(inherited);
        const symbol = f.intoWindow(state); symbol[Symbol('hidden')] = true; badStates.push(symbol);
        const key = Object.keys(state)[0], accessor = f.intoWindow(state); let reads = 0;
        Object.defineProperty(accessor, key, { enumerable: true, get() { reads++; return state[key]; } }); badStates.push(accessor);
        const malformed = change => { const value = f.intoWindow(state); change(value); badStates.push(value); };
        if (state.kind === 'prof-triangle') { malformed(value => { value.x = 11; }); malformed(value => { value.h = 0; }); }
        if (state.kind === 'prof-right-similarity') { malformed(value => { value.k = 0; }); malformed(value => { value.a = NaN; }); }
        if (state.kind === 'prof-construction') { malformed(value => { value.goal = 'foreign'; }); malformed(value => { value.construction = true; }); }
        if (state.kind === 'prof-circle') { malformed(value => { value.side = 'minor'; }); malformed(value => { value.degrees = Infinity; }); }
        if (state.kind === 'prof-vectors') {
          malformed(value => { value.a[0] = 6; }); malformed(value => { value.b[1] = 0.5; });
          malformed(value => { Object.defineProperty(value.a, '0', { enumerable: true, get() { reads++; return 1; } }); });
        }
        if (state.kind === 'power-log') { malformed(value => { value.base = 1; }); malformed(value => { value.exponent = 4; }); malformed(value => { value.feedback = 'correct'; }); }
        if (state.inputs) malformed(value => { value.inputs[Object.keys(value.inputs)[0]] = '<img onerror=alert(1)>'; });
        if (state.toggles?.length) {
          malformed(value => { value.feedbackIndex = 0; });
          malformed(value => { Object.defineProperty(value.toggles, '0', { enumerable: true, get() { reads++; return false; } }); });
        }
        if (state.walkthrough) { malformed(value => { value.walkthrough.count = 6; }); malformed(value => { value.walkthrough.open = true; }); }
        if ('opened' in state) malformed(value => { value.opened = 'true'; });
        for (const bad of badStates) {
          assert.equal(model.renderer.validateBoardState(bad, model.context), false, key + ': reject malformed value');
          assert.throws(() => model.handle.applyBoardState(bad), /Invalid/);
          assert.deepEqual(model.state(), state); assert.deepEqual(model.view(), before);
        }
        assert.equal(reads, 0, 'validation does not execute getters');
        model.handle(); assert.throws(() => model.handle.applyBoardState(good), /Invalid/);
      } finally { model.remove(); }
    }
    assert.deepEqual(f.storage, { local: 0, session: 0 });
  } finally { f.dom.window.close(); }
});

test('geometry hydration cancels pointer capture and stale movement without changing stored coordinates', () => {
  const f = fixture(), lesson = f.lessons.find(lesson => lesson.id === 'geo-angles');
  const model = f.mount(lesson.tasks[0], {}, f.w.ProfileModels['prof-triangle']);
  const svg = model.host.querySelector('svg'), captures = new Set();
  svg.setPointerCapture = id => captures.add(id); svg.hasPointerCapture = id => captures.has(id); svg.releasePointerCapture = id => captures.delete(id);
  svg.getScreenCTM = () => ({ inverse() { return {}; } });
  svg.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return this; } });
  function pointer(target, type, id, x, y) {
    const event = new f.w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
    Object.defineProperty(event, 'pointerId', { value: id }); target.dispatchEvent(event);
  }
  try {
    const original = model.handle.getBoardState();
    pointer(svg.querySelector('[data-drag]'), 'pointerdown', 11, 240, 120); assert.equal(captures.has(11), true);
    const dragged = model.state(); assert.notDeepEqual(dragged, copy(original));
    pointer(svg, 'pointermove', 12, 400, 80); assert.deepEqual(model.state(), dragged, 'another pointer does not own this drag');
    const bad = f.intoWindow(dragged); bad.x = Infinity;
    assert.throws(() => model.handle.applyBoardState(bad), /Invalid/); assert.equal(captures.has(11), true, 'rejection changes no pointer state');
    model.handle.applyBoardState(original); assert.equal(captures.size, 0); assert.deepEqual(model.state(), copy(original));
    pointer(svg, 'pointermove', 11, 400, 80); assert.deepEqual(model.state(), copy(original), 'stale pointer cannot overwrite restored values');
    pointer(svg.querySelector('[data-drag]'), 'pointerdown', 13, 240, 120); model.handle(); assert.equal(captures.size, 0, 'cleanup releases capture');
  } finally { model.remove(); f.dom.window.close(); }
});
