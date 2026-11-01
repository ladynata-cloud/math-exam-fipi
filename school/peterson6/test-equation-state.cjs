'use strict';

// Exercises the compiled course and real DOM handlers. Install jsdom in the
// test environment (or supply NODE_PATH); no browser data or network is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');
const M = require('./math.js');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const context = { window: {} };
vm.runInNewContext(read('school/peterson6/data.js'), context);
const D = clone(context.window.PetersonCourse);
const rawLessons = ['logic', 'arithmetic', 'percent'].flatMap(name =>
  JSON.parse(read('school/peterson6/' + name + '.json')));
const oldTasks = Object.fromEntries(rawLessons.flatMap(lesson => lesson.tasks.map(task => [task.id, task])));
const currentTasks = Object.fromEntries(D.lessons.flatMap(lesson => lesson.tasks.map(task => [task.id, task])));
const KEY = 'mathexam.peterson6.part1.v1';
const ID = 'p09-t01';
const ROUTE = '#lesson/p09/0';
const empty = () => ({ version: 1, tasks: {}, practice: {}, last: null, origin: null });
const partial = task => ({
  value: '', values: [task.steps[0].answer], step: 1, guided: true,
  assisted: true, attempts: 0, note: 'Проверить единицы; мой прежний черновик',
});
const completed = (task, methodVersion) => ({
  ...(methodVersion ? { methodVersion } : {}), value: task.answer,
  values: [], step: 0, attempts: 1, correct: true, independent: true,
  assisted: false, completion: { attempts: 1, assisted: false, independent: true },
});
const live = new Set();
let checks = 0;

function boot({ state = null, hash = ROUTE, board = false } = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  virtualConsole.on('error', error => errors.push(String(error)));
  const htmlPath = board ? 'trainers/peterson6.html' : 'school/peterson6/index.html';
  const pathname = board ? '/trainers/peterson6.html' : '/school/peterson6/';
  const dom = new JSDOM(read(htmlPath), {
    url: 'https://mathexam.space' + pathname + hash,
    runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole,
  });
  live.add(dom);
  const w = dom.window;
  w.scrollTo = () => {};
  w.TextEncoder = TextEncoder;
  w.TextDecoder = TextDecoder;
  w.Blob = Blob;
  let exported = null, registration = null;
  w.URL.createObjectURL = blob => { exported = blob; return 'blob:peterson-equation-test'; };
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = () => {};
  if (state) w.localStorage.setItem(KEY, JSON.stringify(state));
  for (const file of ['math.js', 'data.js', 'models.js'])
    w.eval(read('school/peterson6/' + file));
  if (board) {
    w.eval(read('school/peterson6/board-session.js'));
    w.MathExamBoard = { register(config) { registration = config; return () => {}; } };
  }
  w.eval(read('school/peterson6/app.js'));
  const api = w.PetersonApp;
  assert(api, 'application initialized');
  const select = selector => {
    const element = w.document.querySelector(selector);
    assert(element, 'Missing control: ' + selector);
    return element;
  };
  const click = selector => select(selector).click();
  const input = (selector, value) => {
    const element = select(selector);
    element.value = String(value);
    element.dispatchEvent(new w.Event('input', { bubbles: true }));
  };
  const submit = selector => select(selector).dispatchEvent(
    new w.Event('submit', { bubbles: true, cancelable: true }));
  const go = hash => {
    w.history.replaceState(null, '', pathname + hash);
    api.route();
  };
  return {
    w, api, errors, select, click, input, submit, go,
    state: () => clone(api.getState()),
    registration: () => registration,
    answer(value) { input('#final-answer', value); submit('#answer-form'); },
    async export() {
      go('#progress'); click('[data-action="export"]');
      assert(exported, 'export produced a Blob');
      return JSON.parse(await exported.text());
    },
    async import(backup) {
      go('#progress');
      const text = JSON.stringify(backup);
      await select('#import-file').onchange({ target: { files: [{
        size: Buffer.byteLength(text), text: async () => text,
      }] } });
      return select('#import-status').textContent;
    },
    dispose() { dom.window.close(); live.delete(dom); },
  };
}

function chooseStep(rt, task, index, correct = true) {
  const step = task.steps[index];
  if (step.kind === 'choice') {
    const position = step.choices.findIndex(value => correct ? value === step.answer : value !== step.answer);
    assert(position >= 0);
    rt.click('[data-action="step-choice"][data-step="' + index + '"][data-choice="' + position + '"]');
  } else {
    rt.input('[data-step-input="' + index + '"]', correct ? step.answer : '987654321');
  }
  rt.submit('[data-step-form="' + index + '"]');
}

async function test(name, action) {
  try { await action(); checks++; return null; }
  catch (error) { return { name, error: error.message.slice(0, 1600) }; }
  finally { for (const dom of live) dom.window.close(); live.clear(); }
}

(async () => {
  const cases = [
    ['compiled overlay preserves every legacy condition and complete old task', () => {
      assert.equal(D.methodVersion, 2);
      assert.equal(Object.keys(D.legacyTasks).length, 98);
      for (const [id, old] of Object.entries(D.legacyTasks)) {
        assert.deepEqual(old, oldTasks[id], id + ': immutable legacy task');
        for (const field of ['id', 'prompt', 'answer', 'kind', 'answerFormat', 'source'])
          assert.deepEqual(currentTasks[id][field], old[field], id + ': stable ' + field);
        assert.equal(currentTasks[id].methodVersion, 2);
      }
    }],
    ['legacy partial steps and notebook resume against legacy content', () => {
      const state = empty(); state.tasks[ID] = partial(oldTasks[ID]);
      const rt = boot({ state }); const saved = rt.state().tasks[ID];
      assert.equal(saved.methodVersion, 1);
      assert.equal(saved.step, 1);
      assert.deepEqual(saved.values, [oldTasks[ID].steps[0].answer]);
      assert.equal(saved.note, state.tasks[ID].note);
      assert(rt.select('#problem').textContent.includes(oldTasks[ID].steps[0].prompt));
      assert(rt.select('[data-action="current-method"]'));
      assert.equal(rt.errors.length, 0);
    }],
    ['legacy completion remains old work and is not current-method credit', () => {
      const state = empty(); state.tasks[ID] = completed(oldTasks[ID]);
      const rt = boot({ state });
      assert.equal(rt.state().tasks[ID].correct, true);
      assert.equal(rt.state().tasks[ID].independent, true);
      assert.equal(rt.select('.side-list [data-index="0"] .status').textContent, '');
      const reloaded = boot({ state: rt.state() });
      assert.equal(reloaded.state().tasks[ID].methodVersion, 1);
      assert.equal(reloaded.state().tasks[ID].independent, true);
    }],
    ['empty legacy placeholders upgrade without a false archive or help flag', () => {
      const state = empty(); state.tasks[ID] = {};
      const rt = boot({ state });
      assert.equal(rt.state().tasks[ID].methodVersion, 2);
      assert.equal(rt.state().tasks[ID].assisted, false);
      assert.equal(rt.w.document.querySelector('[data-action="current-method"]'), null);
      assert.equal((rt.state().history[ID] || []).length, 0);
    }],
    ['switching methods preserves old partial work and starts distinct steps', () => {
      const state = empty(); state.tasks[ID] = partial(oldTasks[ID]);
      const rt = boot({ state }); const before = rt.state().tasks[ID];
      rt.click('[data-action="current-method"]');
      assert.deepEqual(rt.state().history[ID][0], before);
      assert.equal(rt.state().tasks[ID].methodVersion, 2);
      assert.equal(rt.state().tasks[ID].step, 0);
      assert.deepEqual(rt.state().tasks[ID].values, []);
      assert.equal(rt.state().tasks[ID].assisted, true);
      assert(rt.select('.earlier-work').textContent.includes(before.note));
      rt.answer(currentTasks[ID].answer);
      assert.equal(rt.state().tasks[ID].independent, false);
      assert.equal(rt.state().tasks[ID].completion.independent, false);
    }],
    ['a previously exposed final answer cannot earn new independent credit', () => {
      const state = empty(); state.tasks[ID] = completed(oldTasks[ID]);
      const rt = boot({ state });
      rt.click('[data-action="current-method"]'); rt.answer(currentTasks[ID].answer);
      assert.equal(rt.state().tasks[ID].independent, false);
      const again = boot({ state: rt.state() });
      assert.equal(again.state().tasks[ID].independent, false);
      assert.equal(again.state().history[ID][0].independent, true);
    }],
    ['an earlier wrong attempt is not reset into a first-try result', () => {
      const state = empty(); state.tasks[ID] = { value: '999', attempts: 1, correct: false };
      const rt = boot({ state });
      rt.click('[data-action="current-method"]'); rt.answer(currentTasks[ID].answer);
      assert.equal(rt.state().tasks[ID].independent, false);
    }],
    ['unexposed draft is archived without inventing help', () => {
      const state = empty(); state.tasks[ID] = { value: '', note: 'Сначала согласую единицы.' };
      const rt = boot({ state }); rt.click('[data-action="current-method"]');
      assert.equal(rt.state().tasks[ID].assisted, false);
      assert.equal(rt.state().history[ID][0].note, state.tasks[ID].note);
    }],
    ['choice steps reject a distractor, retain selection on reload, and complete', () => {
      let rt = boot(); const task = currentTasks[ID];
      rt.click('[data-action="guided"]'); chooseStep(rt, task, 0, false);
      assert.equal(rt.state().tasks[ID].step, 0);
      const wrongSelection = rt.state().tasks[ID].values[0];
      assert.notEqual(wrongSelection, task.steps[0].answer);
      const saved = rt.state(); rt.dispose(); rt = boot({ state: saved });
      assert.equal(rt.select('[data-step="0"].selected').textContent, wrongSelection);
      for (let index = 0; index < task.steps.length; index++) {
        chooseStep(rt, task, index);
        assert.equal(rt.state().tasks[ID].step, index + 1);
      }
      assert.equal(rt.w.document.querySelectorAll('.step.completed').length, task.steps.length);
      rt.answer(task.answer);
      assert.equal(rt.state().tasks[ID].correct, true);
      assert.equal(rt.state().tasks[ID].independent, false);
      assert.equal(rt.errors.length, 0);
    }],
    ['new first-try result and post-success help keep their completion snapshot', () => {
      const rt = boot(); rt.answer(currentTasks[ID].answer);
      assert.equal(rt.state().tasks[ID].independent, true);
      rt.click('[data-action="hint"]');
      const reloaded = boot({ state: rt.state() });
      assert.equal(reloaded.state().tasks[ID].independent, true);
    }],
    ['old JSON imported into an empty browser remains resumable legacy work', async () => {
      const state = empty(); state.tasks[ID] = partial(oldTasks[ID]);
      const rt = boot({ hash: '#home' });
      assert.match(await rt.import({ course: 'peterson6-part1', state }), /объединены/);
      rt.go(ROUTE);
      assert.equal(rt.state().tasks[ID].methodVersion, 1);
      assert.equal(rt.state().tasks[ID].step, 1);
      assert.equal(rt.state().tasks[ID].note, state.tasks[ID].note);
      assert(rt.select('[data-action="current-method"]'));
    }],
    ['importing old work preserves a filled new draft and archives the incoming record', async () => {
      const rt = boot(); rt.input('#notebook', 'Новая запись'); rt.input('#final-answer', '111');
      const state = empty(); state.tasks[ID] = partial(oldTasks[ID]);
      assert.match(await rt.import({ course: 'peterson6-part1', state }), /объединены/);
      assert.equal(rt.state().tasks[ID].methodVersion, 2);
      assert.equal(rt.state().tasks[ID].value, '111');
      assert.equal(rt.state().tasks[ID].note, 'Новая запись');
      assert.equal(rt.state().history[ID][0].methodVersion, 1);
      assert.equal(rt.state().history[ID][0].note, state.tasks[ID].note);
      assert.equal(rt.state().tasks[ID].assisted, true);
    }],
    ['same-version imports cannot erase completed steps with an empty final field', async () => {
      const rt = boot(); rt.click('[data-action="guided"]'); chooseStep(rt, currentTasks[ID], 0);
      const before = rt.state().tasks[ID];
      const state = empty(); state.tasks[ID] = { methodVersion: 2, guided: false, step: 0, values: [] };
      assert.match(await rt.import({ course: 'peterson6-part1', state }), /объединены/);
      assert.equal(rt.state().tasks[ID].step, before.step);
      assert.deepEqual(rt.state().tasks[ID].values, before.values);
    }],
    ['export/import roundtrip retains both methods, notes, choices and assistance', async () => {
      const state = empty(); state.tasks[ID] = partial(oldTasks[ID]);
      const rt = boot({ state }); rt.click('[data-action="current-method"]');
      rt.click('[data-action="guided"]'); chooseStep(rt, currentTasks[ID], 0);
      rt.input('#notebook', 'Новый способ: выбрал неизвестную.');
      const backup = await rt.export();
      const fresh = boot({ hash: '#progress' });
      assert.match(await fresh.import(backup), /объединены/);
      assert.deepEqual(fresh.state().history[ID], backup.state.history[ID]);
      assert.deepEqual(fresh.state().tasks[ID], backup.state.tasks[ID]);
      fresh.go(ROUTE);
      assert.equal(fresh.state().tasks[ID].step, 1);
      assert(fresh.select('.earlier-work').textContent.includes('прежний черновик'));
    }],
    ['new-work import into filled old work retains both versions', async () => {
      const state = empty(); state.tasks[ID] = partial(oldTasks[ID]);
      const rt = boot({ state });
      const incoming = empty(); incoming.tasks[ID] = { methodVersion: 2, note: 'Импортированная новая работа', value: '111' };
      assert.match(await rt.import({ course: 'peterson6-part1', state: incoming }), /объединены/);
      assert.equal(rt.state().tasks[ID].methodVersion, 1);
      assert.equal(rt.state().tasks[ID].step, 1);
      assert.equal(rt.state().history[ID][0].methodVersion, 2);
      assert.equal(rt.state().history[ID][0].note, incoming.tasks[ID].note);
    }],
    ['future method imports are rejected without modifying existing work', async () => {
      const rt = boot(); rt.input('#notebook', 'Сохранить меня'); rt.go('#progress'); const before = rt.state();
      const state = empty(); state.tasks[ID] = { methodVersion: 999, value: '42' };
      assert.match(await rt.import({ course: 'peterson6-part1', state }), /Не удалось открыть/);
      assert.deepEqual(rt.state().tasks, before.tasks);
    }],
    ['symbolic fractions render horizontally and escape hostile text safely', () => {
      const rt = boot();
      const host = rt.w.document.createElement('div');
      host.innerHTML = rt.api.format('{{frac:385:2,2x}}; {{frac:<img src=x onerror=alert(1)>:x" onmouseover="bad}}');
      assert.equal(host.querySelectorAll('.fra').length, 2);
      assert.equal(host.querySelector('.fra').children[1].textContent, '2,2x');
      assert.equal(host.querySelectorAll('img,script,[onerror],[onmouseover]').length, 0);
      assert(host.textContent.includes('<img src=x onerror=alert(1)>'));
    }],
    ['old and new generated percentages keep conditions and legacy hints', () => {
      const hints = {
        'percent-part': 'Находим одну сотую и нужное число сотых.',
        'percent-whole': 'Из известной части восстанавливаем 100%.',
        'percent-ratio': 'Часть делим на целое и умножаем на 100.',
      };
      for (const [skill, hint] of Object.entries(hints)) for (const level of [1, 2, 3]) for (const seed of [1, 7, 36, 212]) {
        const old = M.generate(skill, seed, level, 1), now = M.generate(skill, seed, level, 2);
        assert.equal(old.hint, hint);
        assert.equal(now.prompt, old.prompt);
        assert.equal(now.answer, old.answer);
        assert.deepEqual(now.calculation, old.calculation);
        assert.equal(now.methodVersion, 2);
        assert.equal(now.steps.filter(step => step.kind === 'choice').length, 2);
        assert.deepEqual(M.generate(skill, seed, level), old,
          'shared three-argument generator remains compatible with other courses');
      }
    }],
    ['old generated steps resume, then new percent choices survive a reload', () => {
      for (const skill of ['percent-part', 'percent-whole', 'percent-ratio']) {
        const id = 'practice:' + skill + ':1:7', hash = '#practice/' + skill + '/1';
        const state = empty(); state.practice[skill + ':1'] = { seed: 7 };
        state.tasks[id] = partial(M.generate(skill, 7, 1, 1));
        let rt = boot({ state, hash });
        assert.equal(rt.state().tasks[id].methodVersion, 1);
        assert.equal(rt.state().tasks[id].step, 1);
        rt.click('[data-action="current-method"]');
        rt.click('[data-action="guided"]'); chooseStep(rt, M.generate(skill, 7, 1, 2), 0);
        const saved = rt.state(); rt.dispose(); rt = boot({ state: saved, hash });
        assert.equal(rt.state().tasks[id].methodVersion, 2);
        assert.equal(rt.state().tasks[id].step, 1);
        assert.equal(rt.state().tasks[id].assisted, true);
        assert.equal(rt.state().history[id][0].methodVersion, 1);
        assert.equal(rt.errors.length, 0);
        rt.dispose();
      }
    }],
    ['earlier-work links open the exact saved practice seed and its notes', async () => {
      const skill = 'percent-part', id = 'practice:' + skill + ':1:7';
      const old = M.generate(skill, 7, 1, 1);
      for (const hash of ['#home', '#progress']) for (const archived of [false, true]) {
        const state = empty(); state.practice[skill + ':1'] = { seed: 8 };
        if (archived) {
          state.history = { [id]: [{ ...partial(old), methodVersion: 1 }] };
          state.tasks[id] = { methodVersion: 2, note: 'Новый черновик к прежнему условию' };
        } else state.tasks[id] = partial(old);
        const rt = boot({ state, hash });
        const link = rt.select('.legacy-summary [data-task="' + id + '"]');
        const click = new rt.w.MouseEvent('click', { bubbles: true, cancelable: true });
        link.dispatchEvent(click);
        assert(click.defaultPrevented, 'saved-work navigation uses the exact task identity');
        await new Promise(resolve => rt.w.setTimeout(resolve, 0));
        assert.equal(rt.state().practice[skill + ':1'].seed, 7);
        assert.equal(rt.select('.prompt').textContent, old.prompt);
        if (archived) {
          assert(rt.select('.earlier-work').textContent.includes(state.history[id][0].note));
          assert.equal(rt.select('#notebook').value, state.tasks[id].note);
          assert.equal(rt.state().history[id][0].step, 1);
        } else {
          assert(rt.select('.method-notice'));
          assert.equal(rt.select('#notebook').value, state.tasks[id].note);
          assert.equal(rt.state().tasks[id].step, 1);
        }
        assert.equal(rt.errors.length, 0);
        rt.dispose();
      }
    }],
    ['new percentage steps enforce the explicitly requested decimal representation', () => {
      for (const skill of ['percent-part', 'percent-whole']) {
        const state = empty(); state.practice[skill + ':3'] = { seed: 7 };
        const rt = boot({ state, hash: '#practice/' + skill + '/3' });
        const id = 'practice:' + skill + ':3:7', task = M.generate(skill, 7, 3, 2);
        assert(task.steps[1].prompt.includes('десятичной дробью'));
        rt.click('[data-action="guided"]'); chooseStep(rt, task, 0);
        rt.input('[data-step-input="1"]', '3/40'); rt.submit('[data-step-form="1"]');
        assert.equal(rt.state().tasks[id].step, 1, 'a fraction does not meet a decimal-format question');
        rt.input('[data-step-input="1"]', '0,075'); rt.submit('[data-step-form="1"]');
        assert.equal(rt.state().tasks[id].step, 2);
        rt.dispose();
      }
    }],
    ['new practice excludes the just-migrated exposed condition', () => {
      // Seeds 36 and 37 are independently observed identical 50%-of-60 cases.
      const skill = 'percent-part', id = 'practice:percent-part:1:36';
      const old = M.generate(skill, 36, 1, 1);
      assert.equal(old.prompt, M.generate(skill, 37, 1, 2).prompt);
      const state = empty(); state.practice['percent-part:1'] = { seed: 36 };
      state.tasks[id] = partial(old);
      const rt = boot({ state, hash: '#practice/percent-part/1' });
      rt.click('[data-action="current-method"]'); rt.click('[data-action="new"]');
      const seed = rt.state().practice['percent-part:1'].seed;
      assert.notEqual(M.generate(skill, seed, 1, 2).prompt, old.prompt);
      assert(rt.state().tasks[id].signature, 'upgraded practice has its condition signature immediately');
    }],
    ['same condition under another seed cannot bypass archived exposure', () => {
      const a = 'practice:percent-part:1:36', b = 'practice:percent-part:1:37';
      const state = empty(); state.practice['percent-part:1'] = { seed: 37 };
      state.tasks[b] = completed(M.generate('percent-part', 37, 1, 2), 2);
      state.history = { [a]: [{ ...partial(M.generate('percent-part', 36, 1, 1)), methodVersion: 1 }] };
      const rt = boot({ state, hash: '#practice/percent-part/1' });
      assert.equal(rt.state().tasks[b].independent, false);
      assert.equal(rt.state().tasks[b].completion.independent, false);
    }],
    ['current board choices roundtrip without personal progress fields or storage writes', () => {
      const rt = boot({ board: true });
      assert.equal(rt.registration().version, '1.1.0');
      assert.equal(rt.registration().stateSchemaVersion, 1);
      assert.equal(rt.w.localStorage.getItem(KEY), null);
      rt.click('[data-action="guided"]'); chooseStep(rt, currentTasks[ID], 0);
      const snapshot = rt.w.__peterson6Board.getState();
      assert.equal(rt.w.__peterson6Board.validateState(snapshot), true);
      assert.equal(snapshot.work.tasks[ID][2], 1);
      assert.equal('history' in snapshot.work, false);
      const peer = boot({ board: true });
      peer.w.__peterson6Board.applyState(peer.w.JSON.parse(JSON.stringify(snapshot)));
      assert.equal(peer.w.__peterson6Board.getState().work.tasks[ID][2], 1);
      assert.equal(peer.state().tasks[ID].independent, false);
      assert.equal(peer.w.localStorage.getItem(KEY), null);
      assert.equal(peer.errors.length, 0);
    }],
    ['board bridge rejects old content version before applying its unchanged payload', () => {
      const dom = new JSDOM('', { url: 'https://mathexam.space/trainers/peterson6.html', runScripts: 'outside-only' });
      live.add(dom); const w = dom.window; const posted = [], applied = [], diagnostics = [];
      const parent = { postMessage(message) { posted.push(clone(message)); } };
      Object.defineProperty(w, 'parent', { value: parent });
      w.console.warn = () => {};
      w.addEventListener('mathexam:bridge-diagnostic', event => diagnostics.push(event.detail.code));
      w.eval(read('trainers/board-bridge.js'));
      w.MathExamBoard.register({
        id: 'peterson6', version: '1.1.0', stateSchemaVersion: 1,
        parentOrigin: 'https://mathexam.space', getState: () => ({ value: 1 }),
        applyState: value => applied.push(clone(value)), subscribe: () => () => {},
      });
      const ready = posted.find(message => message.type === 'mathexam:trainer-ready');
      assert(ready);
      const old = { ...ready, type: 'mathexam:hydrate', trainerVersion: '1.0.0', mode: 'state', state: { oldWork: 'preserve' } };
      const untouched = JSON.stringify(old);
      w.dispatchEvent(new w.MessageEvent('message', { source: parent, origin: 'https://mathexam.space', data: old }));
      assert.equal(applied.length, 0);
      assert(diagnostics.includes('envelope-mismatch'));
      assert.equal(JSON.stringify(old), untouched);
      const current = w.JSON.parse(JSON.stringify({ ...old, trainerVersion: '1.1.0', state: { value: 2 } }));
      w.dispatchEvent(new w.MessageEvent('message', { source: parent, origin: 'https://mathexam.space', data: current }));
      assert.equal(applied.length, 1, 'positive control: matching content version applies');
    }],
  ];
  const failures = [];
  for (const [name, action] of cases) {
    const failure = await test(name, action);
    if (failure) failures.push(failure);
  }
  console.log(JSON.stringify({ ok: failures.length === 0, checks, scenarios: cases.length,
    compiledTasks: Object.keys(D.legacyTasks).length,
    coverage: 'legacy/new state, archive, choices, merge/export, duplicate exposure, symbolic fractions, versioned board isolation',
    failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})();
