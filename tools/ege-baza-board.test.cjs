'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const boards = require('../ege-baza/path/board-session.js');
const copy = value => JSON.parse(JSON.stringify(value));
function fixture(position, options = {}) {
  const url = 'https://local.example/trainers/ege-baza-' + position + '.html';
  const html = fs.readFileSync(path.join(ROOT, 'trainers/ege-baza-' + position + '.html'), 'utf8');
  const dom = new JSDOM(html, { url: (options.url || url) + '#lesson=' + boards.LESSONS[position][0], runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.TextEncoder = TextEncoder; w.structuredClone = value => w.JSON.parse(JSON.stringify(value));
  w.HTMLElement.prototype.scrollIntoView = () => {};
  let reads = 0, registration;
  for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(w, key, { get() { reads++; throw Error('No personal storage'); } });
  w.MathExamBoard = { register(config) { registration = config; } };
  if (options.marker !== undefined) w.document.body.dataset.bazaBoard = options.marker;
  for (const script of w.document.querySelectorAll('script[src]')) {
    const file = new URL(script.src).pathname;
    if (file !== '/trainers/board-bridge.js') w.eval(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  }
  const api = w.__bazaBoard, $ = selector => w.document.querySelector(selector);
  const tick = () => new Promise(resolve => w.setTimeout(resolve, 8));
  const input = (selector, value) => { $(selector).value = String(value); $(selector).dispatchEvent(new w.Event('input', { bubbles: true })); };
  const submit = selector => $(selector).dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  const state = () => copy(api.getState());
  const incoming = value => w.JSON.parse(JSON.stringify(value));
  const apply = value => api.applyState(incoming(value));
  const valid = value => api.validateState(incoming(value));
  const visual = () => ({ text: $('#main').textContent, inputs: [...w.document.querySelectorAll('input,textarea,select')].map(x => [x.id, x.value]), details: [...w.document.querySelectorAll('details')].map(x => x.open), svg: [...w.document.querySelectorAll('svg')].map(x => x.innerHTML) });
  async function roundtrip(label) { await tick(); const before = state(), view = visual(); assert(valid(before), label + ' valid'); apply(before); await tick(); assert.deepEqual(state(), before, label + ' state'); assert.deepEqual(visual(), view, label + ' UI'); assert.equal(reads, 0, label + ' personal stores'); }
  return { dom, w, api, $, tick, input, submit, state, apply, valid, roundtrip, visual, registration, reads: () => reads };
}
test('wrappers require their exact path and marker, and use bounded course routes', () => {
  for (const position of [11, 13]) {
    assert(boards.routeValid('#map', position));
    for (const id of boards.LESSONS[position]) assert(boards.routeValid('#lesson=' + id, position));
    for (const bad of ['#exam', '#report', '#lesson=equations', '#lesson=box/extra', '#lesson=%62ox', '#lesson=box\n']) assert.equal(boards.routeValid(bad, position), false);
    for (const option of [{ marker: '' }, { marker: position === 11 ? '13' : '11' }, { url: 'https://local.example/ege-baza/path/index.html' }]) {
      const f = fixture(position, option); assert.equal(f.registration, undefined); f.dom.window.close();
    }
  }
});
test('all twelve current-course families preserve inputs, help, correct steps, models and final work without personal storage', async () => {
  for (const position of [11, 13]) {
    const f = fixture(position);
    try {
      assert.equal(f.registration.id, 'ege-baza-' + position);
      assert.equal(f.registration.parentOrigin, 'https://local.example');
      for (const id of boards.LESSONS[position]) {
        f.api.navigate('#lesson=' + id);
        f.input('#answer', '7/');
        f.$('#taskHelp > summary').click(); await f.tick();
        f.$('#taskSteps > summary').click(); await f.tick();
        f.input('#stepAnswer', '3/'); await f.roundtrip(id + ' separate drafts');
        f.$('#taskModel > summary').click(); await f.tick();
        if (f.$('#angle')) f.input('#angle', '34');
        if (f.$('#cut')) f.input('#cut', '0.5');
        if (f.$('#revealPlan')) f.$('#revealPlan').click();
        await f.roundtrip(id + ' model');
        const task = f.w.PathData.task(id, f.state().work.seed);
        while (f.$('#stepAnswer')) {
          const i = f.state().work.step;
          f.input('#stepAnswer', task.steps[i].a); f.submit('#stepAnswerForm');
        }
        await f.roundtrip(id + ' all steps');
        assert.equal(f.$('#answer').value, '7/');
        f.input('#answer', task.answer); f.submit('#answerForm');
        assert.equal(f.state().work.done, true); assert.match(f.$('#feedback').textContent, /общей доске/);
        f.$('#taskNote > summary').click(); await f.tick(); f.input('#note', 'Площадь основания умножаю на высоту.');
        await f.roundtrip(id + ' done and note');
        f.input('#answer', '7/'); assert.equal(f.state().work.done, false); await f.roundtrip(id + ' editing completed answer');
        f.$('#taskHelp > summary').click(); await f.roundtrip(id + ' collapsed help');
        assert.equal(f.state().work.help, true);
        const oldSeed = f.state().work.seed; f.$('#new').click();
        assert.notEqual(f.state().work.seed, oldSeed); assert.equal(f.state().work.ui.finalDraft, ''); assert.equal(f.state().work.help, false);
        await f.roundtrip(id + ' fresh');
      }
      assert.equal(f.reads(), 0);
    } finally { f.dom.window.close(); }
  }
});
test('recreated step fields and long pasted answers/notes have identical visible and shared limits', async () => {
  const f = fixture(11);
  try {
    f.input('#answer', '7'.repeat(401));
    assert.equal(f.$('#answer').value.length, 200); await f.roundtrip('bounded final paste');
    f.$('#taskHelp > summary').click(); await f.tick(); f.$('#taskSteps > summary').click(); await f.tick();
    const task = f.w.PathData.task('box', f.state().work.seed);
    f.input('#stepAnswer', task.steps[0].a); f.submit('#stepAnswerForm');
    assert.equal(f.state().work.step, 1);
    f.input('#stepAnswer', '8'.repeat(401));
    assert.equal(f.$('#stepAnswer').maxLength, 200); assert.equal(f.$('#stepAnswer').value.length, 200);
    assert.equal(f.state().work.ui.stepDraft, f.$('#stepAnswer').value); await f.roundtrip('recreated bounded step paste');
    f.$('#taskNote > summary').click(); await f.tick(); f.input('#note', 'а'.repeat(5000));
    assert.equal(f.$('#note').value.length, 4000); assert.equal(f.state().work.note, f.$('#note').value); await f.roundtrip('bounded note paste');
  } finally { f.dom.window.close(); }
});
test('malformed states are rejected atomically, including forged correct steps and progress', () => {
  const f = fixture(11);
  try {
    const original = f.state(), mutations = [
      x => x.extra = true, x => x.position = 13, x => x.route = '#lesson=roundbody', x => x.serial = Infinity,
      x => x.work.seed = -1, x => x.work.note = '<img src=x>', x => x.work.note = 'x'.repeat(4001),
      x => x.work.independent = 1, x => x.work.done = true, x => x.work.ui.stepAnswers.push('wrong'),
      x => { x.work.step = 1; x.work.ui.stepAnswers = ['wrong']; x.work.help = true; },
      x => x.work.ui.model = { kind: 'solid', angle: 100, tilt: 0, cut: .5 },
      x => { x.work.ui.model = { kind: 'solid', angle: 0, tilt: 0, cut: .5, extra: 1 }; x.work.help = true; },
      x => x.work.ui.helpOpen = true, x => x.work.ui.finalDraft = 'x'.repeat(201)
    ];
    for (const mutate of mutations) { const bad = copy(original); mutate(bad); assert.equal(f.valid(bad), false); assert.throws(() => f.apply(bad)); assert.deepEqual(f.state(), original); }
    const getter = f.w.Object.assign({}, f.api.getState());
    let accessed = false; f.w.Object.defineProperty(getter, 'work', { enumerable: true, get() { accessed = true; return {}; } });
    assert.equal(f.api.validateState(getter), false); assert.equal(accessed, false);
  } finally { f.dom.window.close(); }
});
test('literal same-origin lesson URLs alias to the right wrapper; unsafe and unrelated paths remain outside mirror aliases', () => {
  const dom = new JSDOM('', { url: 'https://local.example/trainers/trainer-board.html', runScripts: 'outside-only' });
  try {
    dom.window.eval(fs.readFileSync(path.join(ROOT, 'trainers/board-picker.js'), 'utf8'));
    const normalize = dom.window.BoardPicker.normalize;
    for (const position of [11, 13]) for (const id of boards.LESSONS[position]) for (const entry of ['/ege-baza/path/', '/ege-baza/path/index.html'])
      assert.equal(normalize(entry + '#lesson=' + id), '/trainers/ege-baza-' + position + '.html#lesson=' + id);
    for (const input of ['/ege-baza/path/index.html#map', '/ege-baza/path/index.html#lesson=equations', '/ege-baza/path/index.html#lesson=%62ox', '/ege-baza/path/../path/index.html#lesson=box', 'https://external.example/ege-baza/path/index.html#lesson=box']) assert.equal(normalize(input), input);
    const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'trainers/board-compat.json')));
    for (const n of [11,13]) { const entry = registry.trainers.find(x => x.trainerId === 'ege-baza-' + n); assert.equal(entry.file, 'trainers/ege-baza-' + n + '.html'); assert.equal(entry.allowLegacyHtml, false); assert.equal(entry.supportsBoardMirror, true); }
  } finally { dom.window.close(); }
});
