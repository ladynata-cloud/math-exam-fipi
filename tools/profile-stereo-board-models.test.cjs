'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const ROOT = resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));

function fixture() {
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
  const w = dom.window, accesses = { local: 0, session: 0 }, callbacks = { help: 0, explain: 0 };
  for (const [property, counter] of [['localStorage', 'local'], ['sessionStorage', 'session']]) {
    Object.defineProperty(w, property, { get() { accesses[counter]++; throw Error('Personal storage is unavailable'); } });
  }
  for (const file of ['stereo-data.js', 'stereo-tasks.js']) w.eval(readFileSync(resolve(ROOT, 'ege-profil/start', file), 'utf8'));
  const lessons = w.ProfileLessons, tasks = lessons.flatMap(lesson => lesson.tasks);
  function mount(task, context, renderer = w.ProfileTaskModels[task.id]) {
    const container = w.document.createElement('div');
    w.document.body.append(container);
    const handle = renderer(container, task, {
      ...context,
      onHelp() { callbacks.help++; },
      onExplain() { callbacks.explain++; }
    });
    assert.equal(typeof handle, 'function');
    assert.equal(typeof handle.getBoardState, 'function');
    assert.equal(typeof handle.applyBoardState, 'function');
    assert.equal(typeof renderer.validateBoardState, 'function');
    const svg = container.querySelector('svg[data-stereo-view]');
    const details = container.querySelector('.stereo-extra-controls').closest('details');
    const status = container.querySelector('.stereo-rotation-status');
    const button = name => [...container.querySelectorAll('button')].find(el => el.getAttribute('aria-label') === name || el.textContent === name);
    const key = name => svg.dispatchEvent(new w.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
    function pointer(type, pointerId, x = 100, y = 100, button = 0) {
      const event = new w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button });
      Object.defineProperty(event, 'pointerId', { value: pointerId });
      svg.dispatchEvent(event);
    }
    function view() {
      return {
        svg: svg.innerHTML,
        // A pointer changes style.cursor through CSSOM, which serializes the
        // inline style differently from the initial authored HTML attribute.
        svgAttributes: [...svg.attributes].map(attr => [attr.name, attr.name === 'style' ? svg.style.cssText : attr.value]),
        labels: [...container.querySelectorAll('[data-known-label]')].map(el => [el.dataset.knownLabel, el.textContent]),
        focus: container.querySelector('.stereo-focus-note').textContent,
        note: container.querySelector('.stereo-problem-note').textContent,
        extraOpen: details.open,
        status: status.textContent
      };
    }
    return { container, handle, renderer, svg, details, status, button, key, pointer, view,
      state: () => copy(handle.getBoardState()),
      remove() { handle(); container.remove(); }
    };
  }
  return { dom, w, lessons, tasks, accesses, callbacks, mount, intoWindow: value => w.JSON.parse(JSON.stringify(value)) };
}

const independent = { mode: 'independent', step: 0, solved: false };
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-10, `${label}: ${actual} != ${expected}`);

test('all 48 task models preserve authored drawings across independent, guided and accepted-step hydration', () => {
  const f = fixture();
  try {
    assert.equal(f.tasks.length, 48);
    for (const task of f.tasks) {
      for (const context of [independent, { mode: 'guided', step: 0, solved: false }, { mode: 'guided', step: task.steps.length - 1, solved: true }]) {
        const label = `${task.id}/${context.mode}/${context.solved ? 'accepted' : 'working'}`;
        const source = f.mount(task, context), target = f.mount(task, context);
        try {
          assert.deepEqual(source.state(), {
            taskId: task.id, yaw: -0.65, pitch: 0.40, extraOpen: false,
            announcement: 'none', announcedYaw: null, announcedPitch: null
          }, label + ': original default camera');
          const original = source.view();
          assert.equal(source.svg.dataset.focus, context.mode === 'independent' ? 'neutral' : task.steps[context.step].focus, label + ': authored focus');
          assert.equal(original.labels.length, Object.keys(task.diagram.labels).length, label + ': authored givens');
          source.button('Повернуть вправо').click();
          source.details.open = true;
          source.button('Посмотреть сверху').click();
          source.key('ArrowLeft');
          const snapshot = source.handle.getBoardState();
          assert.equal(source.renderer.validateBoardState(snapshot), true, label + ': local state is valid');
          target.handle.applyBoardState(snapshot);
          assert.deepEqual(target.state(), source.state(), label + ': semantic roundtrip');
          assert.deepEqual(target.view(), source.view(), label + ': same drawing, labels, disclosure and announcement');
          assert.deepEqual(target.view().labels, original.labels, label + ': rotation cannot invent values');
          assert.equal(target.view().focus, original.focus, label + ': restore cannot reveal another step');
          assert.equal(target.view().note, original.note, label + ': schematic warning preserved');
          assert.doesNotMatch(target.svg.innerHTML, /NaN|Infinity|undefined/, label);
          source.key('ArrowRight'); target.key('ArrowRight');
          assert.deepEqual(target.state(), source.state(), label + ': next local key continues restored closure');
          assert.deepEqual(target.view(), source.view(), label + ': next drawing agrees');
        } finally { source.remove(); target.remove(); }
      }
    }
    assert.deepEqual(f.callbacks, { help: 0, explain: 0 }, 'rotation and hydration never count as help');
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.dom.window.close(); }
});

test('all eight lesson renderers are bound to their first authored task and preserve every camera announcement', () => {
  const f = fixture();
  try {
    assert.equal(f.lessons.length, 8);
    for (const lesson of f.lessons) {
      const task = lesson.tasks[0], renderer = f.w.ProfileModels[lesson.model];
      const source = f.mount(task, {}, renderer), target = f.mount(task, {}, renderer);
      try {
        for (const [button, text, mode] of [
          [null, '', 'none'],
          ['Посмотреть сверху', 'Вид сверху под углом.', 'top'],
          ['Посмотреть сбоку', 'Вид сбоку под небольшим углом.', 'side'],
          ['Исходный вид', 'Исходный вид.', 'reset'],
          ['Повернуть влево', 'Вид изменён. Поворот -57 градусов; наклон 23 градусов.', 'rotate']
        ]) {
          if (button) source.button(button).click();
          source.details.open = !source.details.open;
          const snapshot = source.handle.getBoardState();
          assert.equal(renderer.validateBoardState(snapshot), true, lesson.id);
          target.handle.applyBoardState(snapshot);
          assert.equal(target.state().taskId, task.id, lesson.id);
          assert.equal(target.state().announcement, mode, lesson.id);
          assert.equal(target.status.textContent, text, lesson.id + ': original spoken feedback');
          assert.deepEqual(target.state(), source.state(), lesson.id);
          assert.deepEqual(target.view(), source.view(), lesson.id);
        }
        const wrongTask = f.intoWindow(source.state());
        wrongTask.taskId = lesson.tasks[1].id;
        assert.equal(renderer.validateBoardState(wrongTask), false, lesson.id + ': lesson model cannot adopt another task');
      } finally { source.remove(); target.remove(); }
    }
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.dom.window.close(); }
});

test('pointer rotation retains its last announcement, and restored camera state survives a same-task accepted-step remount', () => {
  const f = fixture();
  try {
    const task = f.tasks.find(task => task.id === 'stereo-box-height');
    const source = f.mount(task, independent), target = f.mount(task, independent);
    try {
      source.button('Повернуть вправо').click();
      const announced = source.state(), text = source.status.textContent;
      source.pointer('pointerdown', 9, 100, 100);
      source.pointer('pointermove', 9, 140, 85);
      source.pointer('pointerup', 9, 140, 85);
      assert.notEqual(source.state().yaw, announced.yaw);
      assert.notEqual(source.state().pitch, announced.pitch);
      assert.equal(source.state().announcedYaw, announced.announcedYaw);
      assert.equal(source.state().announcedPitch, announced.announcedPitch);
      assert.equal(source.status.textContent, text, 'drag does not replace the original announcement');
      target.handle.applyBoardState(source.handle.getBoardState());
      assert.deepEqual(target.view(), source.view());
      assert.match(target.container.querySelector('[data-known-label="h"]').textContent, /\?/);
      const restored = target.state();
      target.handle();
      const remounted = target.renderer(target.container, task, { mode: 'guided', step: 0, solved: true });
      try {
        assert.equal(remounted.getBoardState().yaw, restored.yaw);
        assert.equal(remounted.getBoardState().pitch, restored.pitch);
        assert.equal(remounted.getBoardState().announcement, 'none', 'existing remount semantics reset the announcement');
        assert.equal(remounted.getBoardState().extraOpen, false, 'existing remount semantics collapse extra controls');
        const svg = target.container.querySelector('svg[data-stereo-view]');
        svg.dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        near(remounted.getBoardState().yaw, restored.yaw + Math.PI / 18, 'remounted rotation starts from the restored camera');
      } finally { remounted(); }
    } finally { source.remove(); target.remove(); }
  } finally { f.dom.window.close(); }
});

test('malformed snapshots are rejected atomically without invoking accessors or stopping a live drag', () => {
  const f = fixture();
  try {
    const model = f.mount(f.tasks[0], independent), taskId = model.state().taskId;
    const good = () => f.intoWindow(model.state());
    const captured = new Set();
    model.svg.setPointerCapture = id => captured.add(id);
    model.svg.hasPointerCapture = id => captured.has(id);
    model.svg.releasePointerCapture = id => captured.delete(id);
    model.pointer('pointerdown', 4);
    const originalView = model.view(), originalState = model.state(), originalCache = copy(model.container._profileStereoView);
    const bad = [null, undefined, 1, '', true, [], new f.w.Array(7), new f.w.Date(), f.w.Object.create({})];
    for (const [key, values] of Object.entries({
      taskId: ['', 'not-a-task', f.tasks[1].id, null],
      yaw: [null, '0', NaN, Infinity, -Infinity, 1000000.1, -1000000.1, []],
      pitch: [null, '0.4', NaN, Infinity, 0.139, 1.251],
      extraOpen: [0, 1, 'true', null],
      announcement: ['', 'html', 'rotate', null, {}],
      announcedYaw: [0, NaN, Infinity, []],
      announcedPitch: [0.4, NaN, Infinity, []]
    })) for (const value of values) { const candidate = good(); candidate[key] = value; bad.push(candidate); }
    const missing = good(); delete missing.extraOpen; bad.push(missing);
    const extra = good(); extra.unexpected = true; bad.push(extra);
    const symbol = good(); symbol[Symbol('extra')] = 1; bad.push(symbol);
    const hidden = good(); Object.defineProperty(hidden, 'yaw', { enumerable: false }); bad.push(hidden);
    const inherited = good(); Object.setPrototypeOf(inherited, { inherited: true }); bad.push(inherited);
    const cycle = good(); cycle.announcement = cycle; bad.push(cycle);
    const poison = good(); Object.defineProperty(poison, '__proto__', { value: null, enumerable: true }); bad.push(poison);
    let getterCalls = 0;
    for (const key of Object.keys(good())) {
      const candidate = good();
      Object.defineProperty(candidate, key, { enumerable: true, get() { getterCalls++; throw Error('Accessor must not run'); } });
      bad.push(candidate);
    }
    for (const pair of [[null, null], [0, null], [null, 0.4], [Infinity, 0.4], [0, 1.3], [1000001, 0.4]]) {
      const candidate = good(); candidate.announcement = 'rotate'; [candidate.announcedYaw, candidate.announcedPitch] = pair; bad.push(candidate);
    }
    for (let i = 0; i < bad.length; i++) {
      assert.equal(model.renderer.validateBoardState(bad[i]), false, `malformed ${i}`);
      assert.throws(() => model.handle.applyBoardState(bad[i]), /Invalid stereometry board state/, `malformed ${i}`);
      assert.deepEqual(model.state(), originalState, `malformed ${i}: state is atomic`);
      assert.deepEqual(model.view(), originalView, `malformed ${i}: drawing is atomic`);
      assert.deepEqual(copy(model.container._profileStereoView), originalCache, `malformed ${i}: remount cache is atomic`);
      assert.equal(captured.has(4), true, `malformed ${i}: existing drag is untouched`);
    }
    assert.equal(getterCalls, 0);
    const plainNull = f.w.Object.assign(f.w.Object.create(null), good());
    assert.equal(model.renderer.validateBoardState(plainNull), true, 'null-prototype JSON records are valid');
    assert.equal(model.renderer.validateBoardState(Object.freeze(good())), true, 'frozen data records are valid');
    assert.equal(model.state().taskId, taskId);
    model.pointer('pointermove', 4, 120, 100);
    near(model.state().yaw, originalState.yaw + 0.24, 'rejected state did not cancel existing control');
    model.remove();
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
  } finally { f.dom.window.close(); }
});

test('valid hydration and cleanup release pointer capture, ignore stale gestures and never replay learner events', () => {
  const f = fixture();
  try {
    const model = f.mount(f.tasks[0], independent), captured = new Set(), releases = [];
    model.svg.setPointerCapture = id => captured.add(id);
    model.svg.hasPointerCapture = id => captured.has(id);
    model.svg.releasePointerCapture = id => { releases.push(id); captured.delete(id); model.pointer('lostpointercapture', id); };
    const incoming = model.handle.getBoardState();
    incoming.yaw = 1.2; incoming.pitch = 0.8; incoming.extraOpen = true;
    incoming.announcement = 'top';
    model.pointer('pointerdown', 11);
    model.pointer('pointermove', 11, 120, 90);
    let replayed = 0;
    for (const name of ['click', 'keydown', 'input', 'change', 'pointerdown', 'pointermove', 'pointerup']) {
      model.container.addEventListener(name, () => replayed++);
    }
    model.handle.applyBoardState(incoming);
    assert.equal(replayed, 0, 'hydrate dispatches no synthetic learner action');
    assert.deepEqual(releases, [11]);
    assert.equal(captured.size, 0);
    assert.equal(model.svg.style.cursor, 'grab');
    assert.equal(model.status.textContent, 'Вид сверху под углом.');
    const hydrated = model.state();
    model.pointer('pointermove', 11, 200, 20);
    assert.deepEqual(model.state(), hydrated, 'old pointer cannot continue after apply');
    model.pointer('pointerdown', 12, 100, 100);
    model.pointer('pointermove', 12, 110, 90);
    near(model.state().yaw, hydrated.yaw + 0.12, 'new pointer uses hydrated yaw');
    near(model.state().pitch, hydrated.pitch + 0.07, 'new pointer uses hydrated pitch');
    model.pointer('pointercancel', 12);
    assert.deepEqual(releases, [11, 12]);
    model.pointer('pointerdown', 13);
    const beforeCleanup = model.state();
    model.handle(); model.handle();
    assert.deepEqual(releases, [11, 12, 13], 'cleanup releases active capture exactly once');
    assert.equal(model.svg.style.cursor, 'grab');
    model.pointer('pointermove', 13, 200, 20);
    model.key('ArrowLeft'); model.button('Повернуть вправо').click();
    assert.deepEqual(model.state(), beforeCleanup, 'disposed controls no longer mutate the camera');
    assert.throws(() => model.handle.applyBoardState(incoming), /Invalid stereometry board state/);
    assert.deepEqual(model.state(), beforeCleanup, 'stale apply is rejected');
    assert.deepEqual(f.callbacks, { help: 0, explain: 0 });
    assert.deepEqual(f.accesses, { local: 0, session: 0 });
    model.remove();
  } finally { f.dom.window.close(); }
});

test('camera bounds preserve ordinary cumulative turns and detached capture cannot break cleanup or hydration', () => {
  const f = fixture();
  try {
    const model = f.mount(f.tasks[0], independent);
    for (const yaw of [8 * Math.PI, 1000000, -1000000]) {
      const value = model.handle.getBoardState(); value.yaw = yaw;
      model.handle.applyBoardState(value);
      const delta = yaw < 0 ? -Math.PI / 9 : Math.PI / 9;
      model.button(yaw < 0 ? 'Повернуть влево' : 'Повернуть вправо').click();
      const state = model.handle.getBoardState(), sum = yaw + delta;
      assert.equal(model.renderer.validateBoardState(state), true);
      near(state.yaw, Math.abs(sum) > 1000000 ? sum % (2 * Math.PI) : sum, 'finite bounded rotation');
      if (yaw === 8 * Math.PI) assert.match(model.status.textContent, /Поворот 1460 градусов/, 'ordinary completed turns are still announced');
      assert.doesNotMatch(model.svg.innerHTML, /NaN|Infinity|undefined/);
    }
    for (const pitch of [0.14, 1.25]) {
      const value = model.handle.getBoardState(); value.pitch = pitch;
      model.handle.applyBoardState(value);
      model.key(pitch === 0.14 ? 'ArrowDown' : 'ArrowUp');
      assert.equal(model.state().pitch, pitch, 'existing pitch clamp remains inclusive');
    }
    model.svg.setPointerCapture = () => { throw Error('Detached SVG'); };
    model.svg.hasPointerCapture = () => true;
    model.svg.releasePointerCapture = () => { throw Error('Capture already lost'); };
    model.pointer('pointerdown', 31);
    const snapshot = model.handle.getBoardState();
    assert.doesNotThrow(() => model.handle.applyBoardState(snapshot));
    model.pointer('pointermove', 31, 200, 20);
    assert.deepEqual(model.state(), copy(snapshot), 'capture failure still terminates the old gesture');
    model.pointer('pointerdown', 32);
    assert.doesNotThrow(() => model.handle());
    model.remove();
  } finally { f.dom.window.close(); }
});
