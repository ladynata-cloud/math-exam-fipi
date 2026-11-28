'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const adapter = require('./vilenkin5-board.js');
const C = require('./curriculum.js'), M = require('./math.js');
require('./algebra7.js').install(C, M);
require('./secondary.js').install(C, M);
require('./core-content.js').install(C);
require('./core-math.js').install(M);
require('./paths.js').install(C);
const editions = require('./editions-content.js');
editions.install(C); require('./editions-math.js').install(M);
const v6 = require('./vilenkin6-lessons.js');
v6.install(C, editions); require('./vilenkin6-math.js').install(M);
require('./vilenkin5-lessons.js').install(C, v6);
require('./vilenkin5-math.js').install(M, C);
const quality = require('./vilenkin5-quality.js');
const copy = value => JSON.parse(JSON.stringify(value));
const lessonIds = C.pathById.vilenkin5.ids;

// Exercise the real bounded visual-model validator, with the real source labs
// and arithmetic engine. The VM is a DOM-free loading environment, not a model
// stub. JSON cloning models browser structured-clone realm boundaries.
const modelScope = vm.createContext({ console, WorkshopMath: M, WorkshopV5Math: require('./vilenkin5-math.js') });
modelScope.window = modelScope;
for (const file of ['../courses/vilenkin-5-part-1/math.js', '../courses/vilenkin-5-part-1/labs.js',
  '../courses/vilenkin-5-part-1/practice.js', 'vilenkin5-quality-models.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), modelScope, { filename: file });
const models = {
  defaults(lesson) { return copy(modelScope.Vilenkin5QualityModels.defaults(lesson)); },
  normalize(lesson, raw) {
    modelScope.lessonInput = lesson; modelScope.modelInput = JSON.stringify(raw);
    return copy(vm.runInContext('Vilenkin5QualityModels.normalize(lessonInput, JSON.parse(modelInput))', modelScope));
  }
};
const core = quality.createCore({ curriculum: C, math: M, models });
const fresh = (id = 'v5f-place-build', mode = 'learn', seed = 0) => ({ version: 1, route: '#lesson/' + id, scene: core.freshScene(id, mode, seed) });

// Memory here stands in for the UI owner only. Every accepted/rejected value
// still goes through the production semantic validator and real mathematics.
function runtime(initial = { version: 1, route: '#course/vilenkin5', scene: null }) {
  let state = core.validateState(copy(initial)), applyCount = 0;
  const listeners = new Set();
  const api = {
    getState: () => copy(state), validateState: value => core.validateState(value),
    applyState(value) { state = core.validateState(value); applyCount++; for (const notify of listeners) notify(); },
    subscribe(notify) { listeners.add(notify); return () => listeners.delete(notify); }
  };
  return { session: adapter.create(api), state: () => copy(state), applyCount: () => applyCount,
    change(value) { state = core.validateState(copy(value)); for (const notify of listeners) notify(); } };
}

test('fixed canonical Vilenkin 5 identity and current-scene envelope', () => {
  assert.equal(adapter.id, 'vilenkin5'); assert.equal(adapter.path, '/trainers/vilenkin5.html');
  assert.equal(adapter.marker, 'data-vilenkin5-board'); assert.equal(adapter.stateSchemaVersion, 1);
  assert.equal(lessonIds.length, 134);
  const r = runtime(), snapshot = r.session.getState();
  assert.deepEqual(snapshot, { version: 1, route: '#course/vilenkin5', scene: null });
  assert.equal(r.session.validateState(snapshot), true);
  assert.equal(r.session.validateState({ ...snapshot, personalProgress: {} }), false);
  for (let unit = 1; unit <= 53; unit++) {
    const value = { version: 1, route: '#v5-unit/' + unit, scene: null };
    assert.deepEqual(r.session.pack(value), value);
  }
});

test('all 134 actual lessons, four modes and deterministic seeds round trip', () => {
  const r = runtime(); let count = 0;
  for (const id of lessonIds) for (const mode of ['learn', 'practice', 'check', 'review']) for (const seed of [0, 17]) {
    const value = r.session.pack(fresh(id, mode, seed));
    assert.equal(r.session.validateState(value), true, id + '/' + mode + '/' + seed);
    assert.equal(value.scene.id, id); assert.equal(value.scene.seed, seed); assert.equal(value.scene.assisted, true);
    r.session.applyState(value); assert.deepEqual(r.session.getState(), value);
    assert(Buffer.byteLength(JSON.stringify(value)) <= adapter.maxBytes); count++;
  }
  assert.equal(count, 1072);
});

test('shared attribution cannot award an independent result or retain personal success text', () => {
  const r = runtime(), value = fresh('v5f-natural-add', 'practice', 17), task = M.generate(value.scene.id, value.scene.seed);
  Object.assign(value.scene, { correct: true, attempt: 1, savedInput: M.fmt(task.answer), assisted: false,
    message: 'Верно. Самостоятельно.', firstAttempt: { value: M.fmt(task.answer), correct: true, assisted: false } });
  const shared = r.session.pack(value);
  assert.equal(shared.scene.assisted, true); assert.equal(shared.scene.firstAttempt.assisted, true);
  assert.equal(shared.scene.message, adapter.sharedSuccess);
  assert.equal(value.scene.assisted, false, 'projection leaves its source value unchanged');
  assert.equal(value.scene.firstAttempt.assisted, false);
  r.session.applyState(shared); assert.deepEqual(r.session.getState(), shared);
  const forged = copy(shared); forged.scene.assisted = false; assert.equal(r.session.validateState(forged), false);
  const first = copy(shared); first.scene.firstAttempt.assisted = false; assert.equal(r.session.validateState(first), false);
  const text = copy(shared); text.scene.message = 'Верно. Самостоятельно.'; assert.equal(r.session.validateState(text), false);
  const learned = fresh('v5f-natural-add', 'learn', 17), step = M.generate(learned.scene.id, learned.scene.seed).steps[0];
  Object.assign(learned.scene, { correct: true, attempt: 1, savedInput: M.fmt(step.answer), answers: [M.fmt(step.answer)], message: step.why });
  assert.equal(r.session.pack(learned).scene.message, step.why, 'the mathematical explanation of an accepted learning step remains visible');
});

test('route, task and actual model validation reject foreign or impossible scenes before apply', () => {
  const r = runtime(), original = r.session.pack(fresh('v5f-fraction-add', 'practice', 17));
  const invalid = [
    value => { value.route = '#lesson/v6f-fraction-add'; },
    value => { value.route = '#v5-unit/54'; value.scene = null; },
    value => { value.route = '#v5-unit/01'; value.scene = null; },
    value => { value.route = '#lesson/v5f-fraction-add\n'; },
    value => { value.route = '#progress'; value.scene = null; },
    value => { value.scene.id = 'v5f-unknown'; },
    value => { value.scene.seed = -1; },
    value => { value.scene.seed = 1.5; },
    value => { value.scene.mode = 'diagnostic'; },
    value => { value.scene.correct = true; value.scene.attempt = 0; },
    value => { value.scene.step = 1000; },
    value => { value.scene.model.ad = 0; },
    value => { value.scene.model.unrelated = 1; },
    value => { value.scene.note = '<img src=x>'; },
    value => { value.scene.savedInput = '1'.repeat(401); },
    value => { value.scene.note = 'я'.repeat(2001); },
    value => { value.scene.media.frame = 5; },
    value => { value.scene.privateResults = {}; },
    value => { value.protocolVersion = 1; }
  ];
  for (const mutate of invalid) {
    const value = copy(original); mutate(value);
    assert.equal(r.session.validateState(value), false, mutate.toString());
    assert.throws(() => r.session.applyState(value), TypeError);
    assert.equal(r.applyCount(), 0, 'invalid input never reaches the owner apply function');
  }
});

test('raw noncanonical and oversized structures fail closed', () => {
  const r = runtime(), value = r.session.pack(fresh());
  assert.equal(r.session.validateState({ ...value, unexpected: [] }), false);
  const huge = copy(value); huge.scene.model = Object.fromEntries(Array.from({ length: 40 }, (_, i) => ['field' + i, 'я'.repeat(2000)]));
  assert.equal(r.session.validateState(huge), false);
  const sparse = copy(value); sparse.scene.answers = Array(3); assert.equal(r.session.validateState(sparse), false);
  const infinity = copy(value); infinity.scene.seed = Infinity; assert.equal(r.session.validateState(infinity), false);
  const cycle = copy(value); cycle.scene.self = cycle; assert.equal(r.session.validateState(cycle), false);
});

test('earned learning steps, open notes and current media survive without manufacturing completed work', () => {
  const r = runtime(), value = fresh('v5f-natural-add', 'learn', 17), task = M.generate(value.scene.id, value.scene.seed);
  const forged = copy(value); forged.scene.step = 1;
  assert.equal(r.session.validateState(forged), false, 'a progressed step needs the actual preceding answer');
  Object.assign(value.scene, { step: 1, answers: [M.fmt(task.steps[0].answer)], savedInput: '7/',
    note: 'Проверим сложение вычитанием.', panels: { notes: true, theory: false, claim: false, error: false, history: true },
    media: { id: 'u08', frame: 2, open: true, playing: false } });
  const shared = r.session.pack(value); r.session.applyState(shared);
  assert.deepEqual(r.session.getState(), shared);
  assert.equal(shared.scene.correct, false); assert.equal(shared.scene.panels.notes, true);
  assert.equal(shared.scene.media.frame, 2); assert.equal(shared.scene.savedInput, '7/');
  const invalid = copy(shared); invalid.scene.answers[0] = '999999'; assert.equal(r.session.validateState(invalid), false);
  const panel = copy(shared); panel.scene.panels.private = true; assert.equal(r.session.validateState(panel), false);
});

test('inspection executes no getters, toJSON hooks or inherited payload behavior', () => {
  const r = runtime(), value = r.session.getState(); let calls = 0;
  const getter = copy(value); Object.defineProperty(getter, 'scene', { enumerable: true, get() { calls++; return null; } });
  assert.equal(r.session.validateState(getter), false); assert.equal(calls, 0);
  const hook = Object.assign(Object.create({ toJSON() { calls++; return value; } }), value);
  assert.equal(r.session.validateState(hook), false); assert.equal(calls, 0);
  const poison = JSON.parse('{"version":1,"route":"#course/vilenkin5","scene":null,"__proto__":{}}');
  assert.equal(r.session.validateState(poison), false);
  const symbol = copy(value); symbol[Symbol('private')] = 1; assert.equal(r.session.validateState(symbol), false);
});

test('remote application suppresses an echo but subsequent local work publishes', () => {
  const r = runtime(); let notifications = 0;
  const dispose = r.session.subscribe(() => notifications++);
  r.session.applyState(r.session.pack(fresh())); assert.equal(notifications, 0);
  const changed = fresh(); changed.scene.savedInput = '30'; r.change(changed); assert.equal(notifications, 1);
  dispose(); r.change(fresh()); assert.equal(notifications, 1);
});

test('registration is limited to the canonical marker/path and unchanged bridge metadata', () => {
  const r = runtime(), rawApi = { memoryOnly: true, getState: r.session.getState, validateState: value => core.validateState(value),
    applyState: r.session.applyState, subscribe: r.session.subscribe };
  let config;
  const context = { document: { body: { hasAttribute: name => name === adapter.marker } },
    location: { pathname: adapter.path, origin: 'https://mathexam.test' }, Vilenkin5Quality: rawApi,
    MathExamBoard: { register(value) { config = value; } } };
  const connected = adapter.connect(context);
  assert.equal(context.__vilenkin5Board, connected);
  assert.equal(config.id, adapter.id); assert.equal(config.version, adapter.version);
  assert.equal(config.stateSchemaVersion, 1); assert.equal(config.parentOrigin, context.location.origin);
  assert.deepEqual(config.getState(), r.session.getState());
  assert.equal(adapter.connect(context), connected, 'connection is idempotent');
  assert.equal(adapter.connect({ document: { body: { hasAttribute: () => false } } }), null);
  assert.throws(() => adapter.connect({ ...context, __vilenkin5Board: undefined, location: { ...context.location, pathname: '/school/index.html' } }), /wrapper/);
  assert.throws(() => adapter.connect({ ...context, __vilenkin5Board: undefined, Vilenkin5Quality: { ...rawApi, memoryOnly: false } }), /wrapper/);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, 'vilenkin5-board.js'), 'utf8'), /\blocalStorage\b|\bsessionStorage\b|\.innerHTML\s*=/);
});

test('the unmodified bridge validator accepts real Vilenkin scenes', () => {
  const context = vm.createContext({ TextEncoder, URL, console, document: {} }); context.window = context;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../trainers/board-bridge.js'), 'utf8'), context);
  const r = runtime();
  for (const value of [r.session.getState(), ...['v5f-division-column', 'v5f-fraction-add', 'v5f-decimal-divide', 'v5f-angle-build'].map(id => r.session.pack(fresh(id)))]) {
    context.payload = JSON.stringify(value);
    const result = vm.runInContext('MathExamBoard.validateState(JSON.parse(payload))', context);
    assert.equal(result.ok, true, result.code);
  }
});

// Tests the real app/quality/model owners through the actual transport adapter.
// This DOM restoration test deliberately makes no claim about network delivery;
// test-vilenkin5-board.browser.cjs verifies the real room/ownership/server path.
async function actualBoardRuntime() {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), {
    url: 'https://mathexam.test/trainers/vilenkin5.html?course=vilenkin5#course/vilenkin5',
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, d = w.document, storage = { reads: 0, writes: 0 }, errors = [];
  d.body.setAttribute('data-vilenkin5-board', '');
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {}; w.TextEncoder = TextEncoder;
  w.addEventListener('error', event => errors.push(event.error || event.message));
  const personal = [require('./state.js').KEY, require('./state.js').TEACHER, quality.KEY];
  const get = w.Storage.prototype.getItem, set = w.Storage.prototype.setItem;
  w.Storage.prototype.getItem = function (key) {
    if (personal.includes(key)) { storage.reads++; throw Error('Personal key read in board mode'); }
    return get.call(this, key);
  };
  w.Storage.prototype.setItem = function (key, value) {
    if (personal.includes(key)) { storage.writes++; throw Error('Personal key written in board mode'); }
    return set.call(this, key, value);
  };
  for (const script of d.querySelectorAll('script[src]')) {
    const url = new URL(script.getAttribute('src'), 'https://mathexam.test/school/index.html');
    if (url.pathname.startsWith('/assets/')) continue;
    w.eval(fs.readFileSync(path.join(__dirname, '..', url.pathname), 'utf8'));
  }
  w.eval(fs.readFileSync(path.join(__dirname, '../trainers/board-bridge.js'), 'utf8'));
  w.eval(fs.readFileSync(path.join(__dirname, 'vilenkin5-board.js'), 'utf8'));
  w.Vilenkin5Board.connect(w);
  const settle = async () => { await new Promise(done => setTimeout(done, 10)); assert.deepEqual(errors, []); };
  await settle();
  return { w, d, storage, settle, close: () => w.close(),
    snapshot: () => copy(w.__vilenkin5Board.getState()),
    apply(value) { w.__vilenkin5Board.applyState(w.JSON.parse(JSON.stringify(value))); },
    async go(route) { w.history.replaceState(null, '', route); w.dispatchEvent(new w.HashChangeEvent('hashchange')); await settle(); },
    input(selector, value, event = 'input') { const input = d.querySelector(selector); assert(input, selector); input.value = value; input.dispatchEvent(new w.Event(event, { bubbles: true })); },
    submit() { d.querySelector('#answer-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); }
  };
}

test('actual app and adapter restore model closures, earned steps, panels and current drafts without personal storage', async () => {
  const source = await actualBoardRuntime(), observer = await actualBoardRuntime();
  const view = runtime => ({
    text: runtime.d.querySelector('#main').textContent.replace(/\s+/g, ' ').trim(),
    values: [...runtime.d.querySelectorAll('#main input,#main select,#main textarea')].map(element => [element.value, element.type === 'radio' ? element.checked : null]),
    details: [...runtime.d.querySelectorAll('#main details')].map(element => element.open)
  });
  async function same(label) {
    await source.settle(); const value = source.snapshot(); observer.apply(value); await observer.settle();
    assert.deepEqual(observer.snapshot(), value, label + ': semantic scene');
    assert.deepEqual(view(observer), view(source), label + ': independent DOM');
    return value;
  }
  try {
    await same('neutral course');
    await source.go('#lesson/v5f-division-column'); await same('long division lesson');
    source.input('#answer', '1/'); source.submit(); await same('partial numeric input');
    source.input('#answer', '999999'); source.submit(); await same('first mathematical error');
    source.d.querySelector('[data-cmd="hint"]').click(); await same('requested hint');
    const q = M.generate('v5f-division-column', source.snapshot().scene.seed).steps[0];
    source.input('#answer', M.fmt(q.answer)); source.submit(); await same('accepted learning step');
    source.d.querySelector('[data-cmd="next"]').click(); await same('next step with earned history');
    source.d.querySelector('.v5q-notes details').open = true; await source.settle();
    source.input('#v5-quality-note', 'Проверим частное умножением.'); await same('open notebook');
    await source.go('#lesson/v5f-angle-build');
    source.input('[data-v5-param="angle"]', '65', 'change'); const angle = await same('model control at 65 degrees');
    assert.equal(angle.scene.model.angle, 65);
    observer.input('[data-v5-param="angle"]', '80', 'change'); await observer.settle();
    assert.equal(observer.snapshot().scene.model.angle, 80, 'restored model closure responds from its hydrated value');
    source.apply(observer.snapshot()); await same('next controller model edit');
    await source.go('#course/vilenkin5'); await same('neutral course after shared work');
    for (const runtime of [source, observer]) assert.deepEqual(runtime.storage, { reads: 0, writes: 0 });
  } finally { source.close(); observer.close(); }
});
