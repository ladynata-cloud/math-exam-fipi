'use strict';

// Run the actual wrapper dependencies, contracts, renderer and public adapter.
// All work is local; no pupil account or production attempt is changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM, VirtualConsole } = require('jsdom');
const server = require('../board-server/learning-contracts');
const columns = require('../trainers/oge-basics/multiplication-division/multiplication-column-core');
const repo = path.resolve(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));

function mount(t, contentId, { saved, readOnly = false, publicPage = false, localSaved } = {}) {
  const relative = 'trainers/oge-basics/' + contentId + '.html';
  const html = fs.readFileSync(path.join(repo, relative), 'utf8');
  const errors = [], events = [], virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(html, { url: 'https://example.test/' + relative + (publicPage ? '' : '?learning=1'), runScripts: 'outside-only', virtualConsole });
  const { window } = dom, key = 'mathExamBasics.divisionCourse.v1.' + contentId;
  if (localSaved) window.localStorage.setItem(key, localSaved);
  let bridge, current = clone(saved || server.create('oge-basics', contentId, 1));
  if (!publicPage) {
    window.MathExamRemediationManaged = true;
    const main = window.document.createElement('main'); main.id = 'learning-remediation-root'; window.document.body.append(main);
    window.MathExamLearning = { register: adapter => { bridge = adapter; } };
  }
  const scripts = [...window.document.querySelectorAll('script[src]')];
  for (const script of scripts) {
    const src = script.getAttribute('src').split('?')[0];
    // Managed bootstrapping is the host's responsibility. Use the declared
    // wrapper dependency order without creating a second asynchronous loader.
    if (!publicPage && src.endsWith('learning-loader.js')) continue;
    if (publicPage && src.endsWith('learning-managed.js')) {
      assert(window.MathExamLearning?.register, 'The public adapter must register before its renderer');
      const register = window.MathExamLearning.register;
      window.MathExamLearning.register = adapter => { bridge = adapter; register(adapter); };
    }
    const filename = path.resolve(repo, path.dirname(relative), src);
    assert(fs.existsSync(filename), 'Every declared wrapper dependency exists: ' + src);
    window.eval(fs.readFileSync(filename, 'utf8'));
  }
  assert(bridge, 'The actual scripts register a managed renderer');
  assert.equal(window.ArithmeticCourse.trackFor(contentId).id, 'multiplication');
  assert(window.DivisionCourse.make, 'Arithmetic core remains intact beside navigation metadata');
  const state = () => clone(bridge.getState());
  const spec = () => publicPage ? server.create('oge-basics', contentId, JSON.parse(window.localStorage.getItem(key) || '{"seed":1}').seed).taskSpec : current.taskSpec;
  if (!publicPage) {
    bridge.subscribe(browserEvent => {
      // Account requests cross a JSON transport boundary, including object prototypes.
      const event = clone(browserEvent);
      events.push(event);
      const normalized = server.normalize('oge-basics', spec(), event.state);
      assert.deepEqual(clone(normalized), clone(event.state), 'Every emitted state passes the account server validator');
      if (event.kind === 'check') {
        const result = server.evaluate('oge-basics', spec(), event.details, normalized);
        assert.equal(result.correct, event.state.feedback.kind === 'correct');
        assert.equal(result.complete, event.state.completed);
        assert.equal(result.assisted, true, 'A guided column is not recorded as an unassisted check');
      }
    });
  }
  function apply(envelope, observer = readOnly) {
    const before = JSON.stringify(envelope); current = clone(envelope);
    bridge.applyState({ ...clone(envelope), readOnly: observer });
    assert.equal(JSON.stringify(envelope), before, 'Restoring does not mutate saved work');
  }
  if (publicPage) window.document.querySelector('#practice').click();
  else apply(current);
  const host = window.document.querySelector('#learning-remediation-root');
  function answer(value) {
    const input = host.querySelector('#lm-answer'); assert(input, 'One answer field is visible');
    input.value = String(value); input.dispatchEvent(new window.Event('input', { bubbles: true }));
    host.querySelector('#lm-check').click();
    assert.deepEqual(errors, [], 'No browser handler raised an exception');
    server.normalize('oge-basics', spec(), state());
  }
  function finish() {
    let remaining = 150;
    while (!state().completed) { assert(remaining-- > 0); answer(spec().steps[state().step].answer); }
  }
  t.after(() => dom.window.close());
  return { dom, window, host, errors, events, state, spec, apply, answer, finish, saved: () => window.localStorage.getItem(key) };
}

const board = f => f.host.querySelector('.lm-multiplication-board');
const rowDigits = (f, name) => [...f.host.querySelectorAll('.lm-mul-row:not(.lm-mul-carry)[data-mul-row="' + name + '"] .lm-mul-filled')].map(cell => cell.textContent).join('');
function observeSnapshot(t, f) {
  const saved = { taskSpec: clone(f.spec()), state: f.state() }, serialized = JSON.stringify(saved);
  const mirror = mount(t, f.spec().contentId, { saved, readOnly: true });
  assert.deepEqual(mirror.state(), saved.state);
  assert.equal(board(mirror).outerHTML, board(f).outerHTML, 'Teacher mirror restores the same digits, carry and active cell');
  for (const control of mirror.host.querySelectorAll('button,input')) { assert(control.disabled); control.click(); }
  assert(mirror.host.querySelector('#lm-note').readOnly);
  assert.equal(mirror.events.length, 0); assert.deepEqual(mirror.state(), saved.state);
  const resumed = mount(t, f.spec().contentId, { saved });
  assert.equal(board(resumed).outerHTML, board(f).outerHTML);
  resumed.answer(resumed.spec().steps[resumed.state().step].answer);
  assert.equal(resumed.state().step, saved.state.step + 1, 'Restored work continues from exactly its saved action');
  assert.equal(JSON.stringify(saved), serialized);
}

for (const stage of columns.stages) {
  test('real column actions, incorrect answers, saved carries and read-only mirrors: ' + stage.slug, t => {
    const f = mount(t, stage.id), initial = clone(f.spec()), snapshots = new Set();
    assert.equal(f.host.querySelector('#lm-practice').textContent, 'Тренировка');
    assert.match(f.host.querySelector('.lm-header').textContent, /Умножение · шаг/);
    assert.equal(rowDigits(f, 'RES'), '', 'The final answer is not shown before solving');
    let verified = 0;
    while (!f.state().completed) {
      const state = f.state(), question = f.spec().steps[state.step], visual = question.multiplication;
      const before = board(f).outerHTML;
      f.answer(Number(question.answer) + 1);
      assert.equal(f.state().step, state.step, 'Wrong answers do not advance');
      assert.deepEqual(f.state().answers, state.answers);
      assert.equal(f.state().feedback.kind, 'incorrect');
      assert.equal(board(f).outerHTML, before, 'Wrong answers cannot fill a future cell');
      if ((visual.event === 'add-carry' || visual.phase === 'add' || visual.row === 'P2') && !snapshots.has(visual.event === 'add-carry' ? 'carry' : visual.phase === 'add' ? 'sum' : 'second-row')) {
        snapshots.add(visual.event === 'add-carry' ? 'carry' : visual.phase === 'add' ? 'sum' : 'second-row');
        observeSnapshot(t, f);
      }
      const previousCells = [...f.host.querySelectorAll('.lm-mul-row:not(.lm-mul-carry) .lm-mul-filled')].map(cell => [cell.parentElement.dataset.mulRow, cell.dataset.column, cell.textContent]);
      f.answer(question.answer); verified++;
      assert.equal(f.state().step, state.step + 1);
      assert.equal(f.state().feedback.kind, 'correct');
      for (const [name, column, text] of previousCells) assert.equal(f.host.querySelector('.lm-mul-row:not(.lm-mul-carry)[data-mul-row="' + name + '"] [data-column="' + column + '"]').textContent, text, 'Previously written digits remain visible');
    }
    assert.equal(verified, initial.steps.length);
    assert(snapshots.has('carry'), 'The selected condition exercises restoring a written carry');
    const { a, b } = initial.task.multiplication;
    assert.equal(rowDigits(f, 'RES'), String(a * b));
    if (b >= 10) {
      assert(snapshots.has('sum')); assert(snapshots.has('second-row'));
      assert.equal(rowDigits(f, 'P1'), String(a * (b % 10)));
      assert.equal(rowDigits(f, 'P2'), String(a * Math.floor(b / 10)));
      const units = f.host.querySelector('.lm-mul-row:not(.lm-mul-carry)[data-mul-row="P2"] [data-column="0"]');
      assert.equal(units.classList.contains('lm-mul-filled'), false, 'The second product starts one cell left');
    }
    assert.equal(f.events.filter(event => event.kind === 'new-task').length, 0, 'Finishing keeps the solved example until a deliberate next click');
    const finished = f.state(), observer = mount(t, stage.id, { saved: { taskSpec: initial, state: finished }, readOnly: true });
    assert.equal(observer.host.querySelector('#lm-new').textContent, 'Следующий пример →');
    assert(observer.host.querySelector('#lm-new').disabled); observer.host.querySelector('#lm-new').click();
    assert.equal(observer.events.length, 0); assert.deepEqual(observer.state(), finished);
  });

  test('managed column repetition preserves completed work and requests the same kind: ' + stage.slug, t => {
    const f = mount(t, stage.id), completed = [];
    for (let cycle = 0; cycle < 3; cycle++) {
      f.finish();
      const saved = { taskSpec: clone(f.spec()), state: f.state() }, serialized = JSON.stringify(saved);
      completed.push(saved);
      const next = f.host.querySelector('#lm-new');
      assert.equal(next.textContent, 'Следующий пример →'); assert(next.classList.contains('lm-primary'));
      next.click(); next.click();
      const requests = f.events.filter(event => event.kind === 'new-task');
      assert.equal(requests.length, cycle + 1); assert.deepEqual(requests.at(-1).details, { contentId: stage.id });
      assert.deepEqual(requests.at(-1).state, saved.state); assert.deepEqual(f.state(), saved.state); assert(next.disabled);
      f.apply(server.create('oge-basics', stage.id, saved.taskSpec.seed + 1));
      assert.equal(f.state().step, 0); assert.equal(f.state().completed, false); assert.deepEqual(f.state().answers, []);
      assert(f.host.querySelector('#lm-answer')); assert.equal(f.host.querySelector('#lm-new').disabled, false);
      assert.equal(JSON.stringify(saved), serialized);
    }
    for (const saved of completed) {
      const observer = mount(t, stage.id, { saved, readOnly: true });
      assert.equal(rowDigits(observer, 'RES'), String(saved.taskSpec.task.multiplication.a * saved.taskSpec.task.multiplication.b));
      assert.deepEqual(observer.state(), saved.state);
    }
  });

  test('actual public wrapper loads, restores and repeats column practice: ' + stage.slug, async t => {
    let f = mount(t, stage.id, { publicPage: true });
    for (let cycle = 0; cycle < 2; cycle++) {
      f.finish(); const saved = f.saved(), done = f.state(), seed = JSON.parse(saved).seed;
      assert.deepEqual(JSON.parse(saved).state, done);
      assert.equal(done.completed, true);
      const condition = f.spec().task.multiplication;
      f = mount(t, stage.id, { publicPage: true, localSaved: saved });
      assert.deepEqual(f.state(), done); assert.equal(rowDigits(f, 'RES'), String(condition.a * condition.b));
      const next = f.host.querySelector('#lm-new'); next.click(); next.click();
      assert.deepEqual(f.state(), done, 'Public continuation retains old work while its microtask is pending');
      await tick();
      assert.equal(JSON.parse(f.saved()).seed, seed + 1, 'Rapid double click creates only one fresh example');
      assert.equal(f.state().step, 0); assert.equal(f.state().completed, false); assert.deepEqual(f.state().answers, []);
      assert.equal(f.host.querySelector('#lm-new').disabled, false); assert(f.host.querySelector('#lm-answer'));
      assert.deepEqual(f.errors, []);
    }
  });
}
