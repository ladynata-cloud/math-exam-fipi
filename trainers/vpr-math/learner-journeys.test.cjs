'use strict';

// Exercise the real page scripts and DOM controls. jsdom is installed by the
// caller (see the workflow); this test makes no network requests or app edits.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, VirtualConsole} = require('jsdom');
const Data = require('./data.js');
const Core = require('./core.js');

const ROOT = path.resolve(__dirname, '../..');
const STORE = 'mathexam.vpr2027.offline.v1';
const PAGE = 'https://mathexam.space/trainers/vpr-math/index.html';
const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const ITEMS = Data.lessons.flatMap(lesson => lesson.tasks.map(task => ({lesson, task})));
const BY_ID = new Map(ITEMS.map(item => [item.task.id, item]));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const plain = value => JSON.parse(JSON.stringify(value));

function answerValue(step) {
  const answer = step.answer;
  if (answer.kind === 'choice') return answer.value;
  if (answer.kind === 'set' || answer.kind === 'tuple') return answer.values.join(';');
  return String(answer.value);
}

function open(options = {}) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(options.boardParentPath ? '<!doctype html><html><body></body></html>' : HTML, {
    url: options.boardParentPath ? new URL(options.boardParentPath, PAGE).href : options.url || PAGE,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: console,
  });
  let w = dom.window;
  if (options.boardParentPath) {
    const frame = w.document.createElement('iframe');
    frame.src = options.url || PAGE;
    frame.inert = options.inertFrame === true;
    w.document.body.append(frame);
    w = frame.contentWindow;
    w.document.open();
    w.document.write(HTML);
    w.document.close();
    assert.equal(w.parent, dom.window, 'A real nested iframe supplies the board parent');
  }
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (options.now !== undefined) w.Date.now = () => options.now;
  w.URL.createObjectURL = () => 'blob:local-test';
  w.URL.revokeObjectURL = () => {};
  if (options.saved !== undefined) {
    w.localStorage.setItem(STORE, typeof options.saved === 'string' ? options.saved : JSON.stringify(options.saved));
  }
  let storageAccesses = 0;
  if (options.spyStorage) {
    const storage = w.localStorage;
    Object.defineProperty(w, 'localStorage', {get() { storageAccesses++; return storage; }});
  }
  if (options.blockedStorage) {
    Object.defineProperty(w, 'localStorage', {
      get() { throw new w.DOMException('Storage denied', 'SecurityError'); },
    });
  } else if (options.quotaExceeded) {
    w.Storage.prototype.setItem = () => { throw new w.DOMException('Quota exceeded', 'QuotaExceededError'); };
  }
  const loaded = [];
  for (const script of w.document.querySelectorAll('script[src]')) {
    const url = new URL(script.src);
    // Simulate one failed local bundle request without changing production code.
    if (options.omitBoardAdapter && url.pathname === '/trainers/vpr-math/board.js') continue;
    if (options.omitBoardMode && url.pathname === '/trainers/vpr-math/board-mode.js') continue;
    assert.equal(url.origin, new URL(PAGE).origin, 'Only local application scripts may run');
    const filename = path.resolve(ROOT, '.' + decodeURIComponent(url.pathname));
    assert.ok(filename.startsWith(ROOT + path.sep), 'Script must stay within the repository');
    assert.ok(fs.existsSync(filename), 'Missing local script: ' + url.pathname);
    w.eval(fs.readFileSync(filename, 'utf8') + '\n//# sourceURL=' + url.pathname);
    loaded.push(url.pathname);
  }
  for (const name of ['data.js', 'core.js', 'plot.js', 'app.js']) {
    assert.ok(loaded.includes('/trainers/vpr-math/' + name), 'Page must load ' + name);
  }
  const ui = {
    w, dom, d: w.document, errors,
    find(selector) {
      const element = w.document.querySelector(selector);
      assert.ok(element, 'Missing DOM control: ' + selector);
      return element;
    },
    click(selector) { ui.find(selector).click(); },
    fill(selector, value) {
      const element = ui.find(selector);
      element.value = String(value);
      element.dispatchEvent(new w.Event('input', {bubbles: true}));
      return element;
    },
    state() { return plain(w.VPRApp.snapshot()); },
    saved() { return w.localStorage.getItem(STORE); },
    storageAccesses() { return storageAccesses; },
    async navigate(params) {
      w.location.hash = new URLSearchParams(params).toString() || 'view=home';
      await tick();
      await tick();
    },
    async task(item, mode = 'learn', route = item.lesson.routes[0]) {
      await ui.navigate({view: 'lesson', route, lesson: item.lesson.id, task: item.task.id, mode});
      assert.equal(w.VPRApp.getView().task, item.task.id);
    },
    enter(step, index, context = 'task', value = answerValue(step)) {
      if (step.answer.kind === 'choice') {
        ui.click(`[data-action="choice"][data-context="${context}"][data-index="${index}"][data-choice="${value}"]`);
      } else {
        ui.fill(`[data-answer="${context}"][data-index="${index}"]`, value);
      }
    },
    check(step, index) {
      ui.enter(step, index);
      ui.click('[data-action="check"]');
      assert.ok(w.document.querySelector(`.step.done[data-step="${index}"]`), 'Step did not complete: ' + w.VPRApp.getView().task + ':' + index);
    },
    assertClean() { assert.deepEqual(errors, [], 'Application raised a DOM runtime error'); },
    close() { dom.window.close(); },
  };
  assert.ok(w.VPRApp, 'Real app initialized');
  return ui;
}

async function importProgress(ui, value, size) {
  await ui.navigate({view: 'progress'});
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  Object.defineProperty(ui.find('#progress-file'), 'files', {
    configurable: true,
    value: [{name: 'MathExam_VPR_progress.json', size: size ?? Buffer.byteLength(text), text: async () => text}],
  });
  ui.find('#progress-file').dispatchEvent(new ui.w.Event('change', {bubbles: true}));
  await tick();
  await tick();
}

async function startDiagnostic(ui, route) {
  await ui.navigate({view: 'route', route});
  ui.click('[data-action="diagnostic"]');
  await tick();
  await tick();
  assert.equal(ui.state().session.route, route);
  return ui.state().session;
}

function submitDiagnostic(ui, value) {
  const session = ui.state().session;
  const task = BY_ID.get(session.ids[session.index]).task;
  ui.enter(task.steps.at(-1), session.index, 'diagnostic', value ?? answerValue(task.steps.at(-1)));
  ui.click('[data-action="diagnostic-next"]');
}

test('generated runtime bank equals the canonical input with only authoring evidence removed', () => {
  const canonical = JSON.parse(fs.readFileSync(path.join(__dirname, 'content/full_data.json'), 'utf8'));
  const removed = new Set(['oracle', 'oracles', 'oracleValues', 'web_reference', 'reference']);
  function publicData(value) {
    if (Array.isArray(value)) return value.map(publicData);
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).filter(([key]) => !removed.has(key)).map(([key, item]) => [key, publicData(item)]));
    }
    return value;
  }
  assert.deepEqual(Data, publicData(canonical));
  assert.equal(Data.lessons.length, 82);
  assert.equal(ITEMS.length, 492);
  for (const {task} of ITEMS) {
    for (const [index, step] of task.steps.entries()) {
      assert.equal(Core.judge(step.answer, answerValue(step)).correct, true, task.id + ':' + index);
      if (step.answer.display && step.answer.kind !== 'choice') {
        assert.equal(Core.judge(step.answer, step.answer.display).correct, true, 'Displayed answer is accepted: ' + task.id + ':' + index);
      }
    }
  }
});

test('all 492 tasks complete through real inputs in learning and independent modes', {timeout: 300000}, async () => {
  const ui = open();
  let learned = 0, learningSteps = 0, independent = 0, independentSteps = 0;
  try {
    assert.equal(ui.d.querySelectorAll('.course').length, 7);
    for (const item of ITEMS) {
      const task = item.task;
      await ui.task(item);
      ui.click('[data-action="restart"]');
      for (const [index, step] of task.steps.entries()) {
        ui.check(step, index);
        learningSteps++;
      }
      assert.equal(ui.d.querySelectorAll('.step.done').length, task.steps.length, task.id + ': retain completed reasoning');
      assert.ok(ui.d.querySelector('.complete'), task.id + ': learning completion');
      learned++;
      await ui.task(item, 'solo');
      ui.click('[data-action="restart"]');
      assert.equal(ui.d.querySelectorAll('.theory,.hint-area,.hint-text,.plot-lab').length, 0, task.id + ': no solo hints');
      const indices = task.assessAllSteps ? task.steps.map((_, index) => index) : [task.steps.length - 1];
      for (const index of indices) {
        ui.check(task.steps[index], index);
        independentSteps++;
      }
      assert.ok(ui.d.querySelector('.complete'), task.id + ': independent completion');
      independent++;
    }
    assert.equal(learned, 492);
    assert.equal(independent, 492);
    assert.equal(learningSteps, 1284);
    assert.equal(independentSteps, ITEMS.reduce((total, {task}) => total + (task.assessAllSteps ? task.steps.length : 1), 0));
    assert.equal(ui.w.VPRApp.stats().total, 492, 'Shared lessons count once globally');
    assert.equal(ui.w.VPRApp.stats().done, 492);
    assert.equal(ui.w.VPRApp.stats().learn, 492);
    assert.equal(ui.w.VPRApp.stats().solo, 492);
    ui.assertClean();
  } finally { ui.close(); }
});

test('wrong answers stay for correction, two mistakes unlock help, and shown steps are assisted', async () => {
  const ui = open();
  const item = ITEMS[0], task = item.task;
  try {
    await ui.task(item);
    for (let count = 1; count <= 2; count++) {
      ui.enter(task.steps[0], 0, 'task', '999999123');
      ui.click('[data-action="check"]');
      assert.equal(ui.d.querySelectorAll('.step.done').length, 0);
      assert.equal(ui.find('.answer-input').value, '999999123');
      assert.equal(ui.state().attempts['learn:' + task.id].mistakes[0], count);
      assert.equal(ui.d.querySelectorAll('[data-action="hint"]').length, count === 2 ? 1 : 0);
    }
    ui.click('[data-action="hint"]');
    assert.equal(ui.d.querySelectorAll('.hint-text').length, 1);
    ui.click('[data-action="solution"]');
    assert.equal(ui.d.querySelectorAll('.step.done.assisted').length, 1);
    for (let index = 1; index < task.steps.length; index++) ui.check(task.steps[index], index);
    assert.equal(ui.state().achievements['learn:' + task.id].assisted, true);
    assert.equal(ui.w.VPRApp.stats().solo, 0);
    ui.click('[data-action="restart"]');
    assert.ok(ui.state().achievements['learn:' + task.id], 'Restart preserves prior completion');
    await ui.navigate({view: 'errors'});
    assert.equal(ui.d.querySelectorAll('.result-item').length, 1);
    assert.equal(ui.state().errorHistory[task.id].total, 2, 'Restart archives mistakes once');
    ui.assertClean();
  } finally { ui.close(); }
});

test('a correct final answer on a guided step gets the current question without a mistake', async () => {
  const ui = open();
  const item = BY_ID.get('g5-fractions-1');
  const {task} = item;
  try {
    await ui.task(item);
    for (const finalAnswer of ['5/8', '0,625']) {
      ui.enter(task.steps[0], 0, 'task', finalAnswer);
      ui.click('[data-action="check"]');
      assert.match(ui.find('.feedback[role="status"]').textContent, /Итоговый ответ верный/);
      assert.ok(ui.find('.feedback').textContent.includes(task.steps[0].prompt));
      assert.equal(ui.find('.answer-input').value, finalAnswer);
      assert.equal(ui.state().attempts['learn:' + task.id].mistakes[0], 0);
      assert.equal(ui.d.querySelector('.step.done,[data-action="hint"]'), null);
    }

    ui.enter(task.steps[0], 0, 'task', '3/8');
    ui.click('[data-action="check"]');
    assert.match(ui.find('.feedback').textContent, /Пока не совпало/);
    assert.equal(ui.state().attempts['learn:' + task.id].mistakes[0], 1);
    ui.check(task.steps[0], 0);
    ui.enter(task.steps[1], 1, 'task', '5/8');
    ui.click('[data-action="check"]');
    assert.ok(ui.d.querySelector('.complete'));

    await ui.task(item, 'solo');
    ui.enter(task.steps[1], 1, 'task', '5/8');
    ui.click('[data-action="check"]');
    assert.ok(ui.d.querySelector('.complete'));
    ui.assertClean();
  } finally { ui.close(); }
});

test('reload restores partial answers and safe notes; later solo work remains separate', async () => {
  let ui = open();
  const item = ITEMS[0], task = item.task;
  const notes = '</textarea><script>window.untrustedExecuted = true</script><img src=x onerror=alert(1)>';
  try {
    await ui.task(item);
    ui.check(task.steps[0], 0);
    ui.fill('[data-answer="task"][data-index="1"]', '17/');
    ui.fill('#task-notes', notes);
    const saved = ui.saved();
    ui.close();
    ui = open({saved});
    await ui.task(item);
    assert.equal(ui.d.querySelectorAll('.step.done').length, 1);
    assert.equal(ui.find('[data-answer="task"][data-index="1"]').value, '17/');
    assert.equal(ui.find('#task-notes').value, notes);
    assert.equal(ui.w.untrustedExecuted, undefined);
    assert.equal(ui.d.querySelectorAll('#app script,#app img[onerror]').length, 0);
    await ui.task(item, 'solo');
    assert.equal(ui.d.querySelectorAll('.step.done').length, 0);
    const last = task.steps.length - 1;
    ui.check(task.steps[last], last);
    assert.equal(ui.w.VPRApp.stats().solo, 1);
    ui.click('[data-action="restart"]');
    assert.equal(ui.w.VPRApp.stats().solo, 1, 'Restart never double-counts an achievement');
    assert.equal(ui.state().attempts['learn:' + task.id].answers[1], '17/');
    ui.assertClean();
  } finally { ui.close(); }
});

test('independent answers require the full ordered pair, including repeated components', async () => {
  const ui = open();
  try {
    for (const item of [BY_ID.get('g5-geometry-1'), BY_ID.get('g5-logic-4')]) {
      await ui.task(item, 'solo');
      const index = item.task.steps.length - 1, step = item.task.steps[index];
      assert.equal(step.answer.kind, 'tuple');
      ui.enter(step, index, 'task', String(step.answer.values.at(-1)));
      ui.click('[data-action="check"]');
      assert.equal(ui.d.querySelectorAll('.complete').length, 0, 'One component is insufficient');
      ui.check(step, index);
      assert.ok(ui.d.querySelector('.complete'));
    }
    ui.assertClean();
  } finally { ui.close(); }
});

test('all eight graph laboratories accept constructed points and preserve them across reload', async () => {
  let ui = open();
  let last;
  try {
    const graphItems = ITEMS.filter(({task}) => task.plot);
    assert.equal(graphItems.length, 8);
    for (const item of graphItems) {
      await ui.task(item);
      ui.click('[data-action="plot-clear"]');
      const plot = item.task.plot, points = [], required = plot.kind === 'parabola' ? 3 : 2;
      for (let x = plot.minX; x <= plot.maxX && points.length < required; x++) {
        const y = plot.kind === 'parabola' ? (x - plot.h) ** 2 + plot.k : plot.k * x + plot.b;
        if (Number.isInteger(y) && y >= plot.minY && y <= plot.maxY) points.push([x, y]);
      }
      for (const [x, y] of points) {
        ui.fill('#plot-x', x);
        ui.fill('#plot-y', y);
        ui.click('[data-action="plot-add"]');
      }
      assert.equal(ui.find('.plot-message').classList.contains('ok'), true, item.task.id);
      assert.equal(ui.d.querySelectorAll('[data-user-curve]').length, 1, item.task.id);
      assert.deepEqual(ui.state().attempts['learn:' + item.task.id].plotPoints, points);
      last = {item, points};
    }
    const saved = ui.saved();
    ui.close();
    ui = open({saved});
    await ui.task(last.item);
    assert.deepEqual(ui.state().attempts['learn:' + last.item.task.id].plotPoints, last.points);
    assert.equal(ui.find('.plot-message').classList.contains('ok'), true);
    ui.assertClean();
  } finally { ui.close(); }
});

test('diagnostic hides correctness, counts skips, saves results and rotates the next set', async () => {
  const ui = open();
  try {
    const session = await startDiagnostic(ui, 'g5');
    assert.equal(session.ids.length, Data.routes.find(route => route.id === 'g5').lessonIds.length);
    for (let index = 0; index < session.ids.length; index++) {
      assert.equal(ui.d.querySelectorAll('.theory,.hint-area,.hint-text,.correct-answer,.solution-note,.result-score').length, 0);
      if (index === 0) ui.click('[data-action="diagnostic-skip"]');
      else submitDiagnostic(ui);
    }
    assert.equal(ui.find('.result-score').textContent, `${session.ids.length - 1} / ${session.ids.length}`);
    assert.equal(ui.state().diagnostics.g5.finished, true);
    assert.equal(ui.state().pendingSessions.g5, undefined);
    assert.equal(ui.w.VPRApp.stats().done, 0, 'Diagnostic does not grant course completion');
    const prior = [...session.ids];
    ui.click('[data-action="diagnostic-new"]');
    await tick();
    await tick();
    assert.equal(ui.state().session.index, 0);
    assert.equal(ui.state().session.ids.length, prior.length);
    assert.ok(ui.state().session.ids.every((id, index) => id !== prior[index]), 'New diagnostic rotates the exam task within every lesson');
    assert.equal(ui.state().diagnostics.g5.finished, true, 'Previous completed result remains');
    ui.assertClean();
  } finally { ui.close(); }
});

test('unfinished diagnostics in different routes retain answers and resume after reload', async () => {
  let ui = open();
  try {
    const original = await startDiagnostic(ui, 'g5');
    submitDiagnostic(ui);
    const firstAnswer = ui.state().session.answers[0];
    await startDiagnostic(ui, 'g6');
    submitDiagnostic(ui);
    submitDiagnostic(ui);
    assert.equal(ui.state().pendingSessions.g5.index, 1);
    assert.equal(ui.state().pendingSessions.g6.index, 2);
    const saved = ui.saved();
    ui.close();
    ui = open({saved});
    await startDiagnostic(ui, 'g5');
    assert.deepEqual(ui.state().session.ids, original.ids);
    assert.equal(ui.state().session.index, 1);
    assert.equal(ui.state().session.answers[0], firstAnswer);
    await startDiagnostic(ui, 'g6');
    assert.equal(ui.state().session.index, 2);
    ui.assertClean();
  } finally { ui.close(); }
});

test('progress import merges both pending diagnostics and never replaces newer answers with older work', async () => {
  const source = open();
  const target = open();
  try {
    await startDiagnostic(source, 'g5');
    submitDiagnostic(source);
    await startDiagnostic(source, 'g6');
    submitDiagnostic(source);
    const imported = source.state();
    const item = ITEMS[0];
    await target.task(item);
    target.fill('[data-answer="task"][data-index="0"]', '123');
    const own = target.state().attempts['learn:' + item.task.id];
    const older = Core.blank(item.task, 'learn');
    older.answers[0] = '456';
    older.updated = Math.max(0, own.updated - 1);
    imported.attempts['learn:' + item.task.id] = older;
    await importProgress(target, imported);
    assert.match(target.find('.feedback').textContent, /Прогресс загружен/);
    assert.equal(target.state().attempts['learn:' + item.task.id].answers[0], '123');
    assert.equal(target.state().pendingSessions.g5.index, 1);
    assert.equal(target.state().pendingSessions.g6.index, 1);
    await startDiagnostic(target, 'g5');
    assert.equal(target.state().session.index, 1);
    await startDiagnostic(target, 'g6');
    assert.equal(target.state().session.index, 1);
    source.assertClean();
    target.assertClean();
  } finally { source.close(); target.close(); }
});

test('malformed imports cannot erase valid work or insert cross-route diagnostics', async () => {
  const ui = open();
  try {
    await ui.task(ITEMS[0]);
    ui.check(ITEMS[0].task.steps[0], 0);
    const attempt = ui.state().attempts['learn:' + ITEMS[0].task.id];
    for (const value of ['not json', {version: 99, attempts: {}}, {version: 1, attempts: null}]) {
      await importProgress(ui, value);
      assert.match(ui.find('.feedback').textContent, /Не удалось прочитать/);
      assert.deepEqual(ui.state().attempts['learn:' + ITEMS[0].task.id], attempt);
    }
    await importProgress(ui, {}, 8 * 1024 * 1024 + 1);
    assert.match(ui.find('.feedback').textContent, /слишком большой/);
    const badSession = {
      route: 'g5', ids: ['g10-percent-1'], answers: [null], index: 0,
      finished: false, started: 1, finishedAt: 0,
    };
    const cleaned = ui.w.VPRApp.sanitize({version: 1, attempts: {}, pendingSessions: {g5: badSession}, session: badSession});
    assert.equal(cleaned.session, null);
    assert.equal(cleaned.pendingSessions.g5, undefined);
    for (const edit of [
      session => { session.index = session.ids.length; },
      session => { session.ids.push(session.ids[0]); session.answers.push(null); },
      session => { session.answers[0] = {}; },
    ]) {
      const session = {...badSession, ids: [ITEMS[0].task.id], answers: [null]};
      edit(session);
      assert.equal(ui.w.VPRApp.sanitize({version: 1, session}).session, null);
    }
    ui.assertClean();
  } finally { ui.close(); }
});

test('invalid saved JSON, denied storage and exhausted quota leave a usable page', async () => {
  for (const options of [{saved: 'not json'}, {saved: {version: 1, attempts: {bad: {}}}}, {blockedStorage: true}, {quotaExceeded: true}]) {
    const ui = open(options);
    try {
      assert.equal(ui.d.querySelectorAll('.course').length, 7);
      await ui.task(ITEMS[0]);
      ui.check(ITEMS[0].task.steps[0], 0);
      if (options.blockedStorage || options.quotaExceeded) {
        assert.equal(ui.find('#save-warning').classList.contains('visible'), true);
      }
      ui.assertClean();
    } finally { ui.close(); }
  }
});

test('query task links initialize once; explicit home navigation and board links use the current view', async () => {
  const item = BY_ID.get('g8-quadratics-3');
  const ui = open({url: PAGE + '?route=g8u&task=' + item.task.id + '&mode=solo'});
  try {
    assert.deepEqual(plain(ui.w.VPRApp.getView()), {view: 'lesson', route: 'g8u', lesson: item.lesson.id, task: item.task.id, mode: 'solo'});
    const boardLink = new URL(ui.find('#open-board').href);
    const trainer = new URL(boardLink.searchParams.get('trainer'), PAGE);
    assert.equal(trainer.searchParams.get('route'), 'g8u');
    assert.equal(trainer.searchParams.get('task'), item.task.id);
    assert.equal(trainer.searchParams.get('mode'), 'solo');
    ui.click('[data-action="home"]');
    await tick();
    await tick();
    assert.equal(ui.w.VPRApp.getView().view, 'home');
    assert.equal(ui.d.querySelectorAll('.course').length, 7);
    assert.equal(new URL(ui.find('#open-board').href).searchParams.get('trainer'), '/trainers/vpr-math/index.html');
    await ui.navigate({view: 'about'});
    assert.equal(ui.d.querySelectorAll('a[href^="https://fioco.ru/"]').length, 8);
    ui.assertClean();
  } finally { ui.close(); }
});

test('a shared-state hook cannot overwrite personal attempts outside board mode', async () => {
  const ui = open();
  try {
    await ui.task(ITEMS[0]);
    ui.fill('[data-answer="task"][data-index="0"]', '123');
    ui.fill('#task-notes', 'Личный черновик');
    const before = ui.state();
    const roomHome = {
      version: 1, view: {view: 'home'}, attempt: null, feedback: null,
      panels: {theory: false, notes: false, plot: false, mobileLessons: false},
    };
    if (typeof ui.w.applyBoardTrainerState === 'function') {
      assert.throws(() => ui.w.applyBoardTrainerState(ui.w.JSON.parse(JSON.stringify(roomHome))), 'Shared state is rejected outside its boundary');
    }
    assert.deepEqual(ui.state(), before, 'Personal attempts and notes must be untouched');
    ui.assertClean();
  } finally { ui.close(); }
});

test('board mode fails closed when the board adapter did not load', () => {
  const item = ITEMS[0];
  const ui = open({url: PAGE + '?board=1&task=' + item.task.id, omitBoardAdapter: true});
  try {
    const before = ui.state();
    ui.fill('[data-answer="task"][data-index="0"]', answerValue(item.task.steps[0]));
    ui.click('[data-action="check"]');
    ui.fill('#task-notes', 'This write must be blocked');
    assert.deepEqual(ui.state(), before, 'An unavailable permission adapter cannot authorize edits');
    assert.equal(ui.saved(), null, 'Board fallback never writes personal storage');
    ui.assertClean();
  } finally { ui.close(); }
});

test('known board iframe isolates personal storage even when the board-mode asset failed', () => {
  const item = ITEMS[0];
  const personal = Core.blank(item.task, 'learn');
  personal.notes = 'Личные записи из обычного курса';
  const saved = {version: 1, attempts: {['learn:' + item.task.id]: personal}};
  for (const parentPath of ['/trainers/trainer-board.html', '/trainers/group-board.html']) {
    const ui = open({
      url: PAGE + '?task=' + item.task.id,
      boardParentPath: parentPath,
      inertFrame: true,
      omitBoardMode: true,
      spyStorage: true,
      saved,
    });
    try {
      assert.equal(ui.w.VPRBoardMode, true, 'App detects the known parent before reading storage');
      assert.equal(ui.storageAccesses(), 0, 'No personal storage getter may be touched');
      assert.equal(ui.find('#task-notes').value, '', 'Private notes are absent from the room');
      const before = ui.state();
      ui.fill('[data-answer="task"][data-index="0"]', answerValue(item.task.steps[0]));
      ui.click('[data-action="check"]');
      ui.fill('#task-notes', 'Blocked room edit');
      assert.deepEqual(ui.state(), before, 'An inert board iframe rejects input and submit');
      assert.equal(ui.storageAccesses(), 0, 'Blocked room input must not write personal storage');
      assert.deepEqual(JSON.parse(ui.saved()), saved, 'Existing personal storage is unchanged');
      ui.assertClean();
    } finally { ui.close(); }
  }
});

const STRATEGY_START = Date.UTC(2026, 10, 9, 8);
const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;
const routePrimary = '.route-actions [data-action=task]';
const topicStatus = lesson => '.lesson-card[data-lesson="' + lesson + '"] [data-topic-status]';

function openStrategy(t, params, options = {}) {
  const ui = open({now: STRATEGY_START, ...options, url: PAGE + '?' + new URLSearchParams(params)});
  t.after(ui.close);
  return ui;
}

test('a shown answer stays assisted and fresh independent practice resumes in solo mode', async t => {
  const lesson = 'g5-parts';
  const shown = BY_ID.get(lesson + '-1');
  const fresh = BY_ID.get(lesson + '-2');
  const params = {route: 'g5', lesson, task: shown.task.id};
  const ui = openStrategy(t, params);
  ui.check(shown.task.steps[0], 0);
  for (let i = 1; i <= 2; i++) {
    ui.enter(shown.task.steps[1], 1, 'task', '20');
    ui.click('[data-action=check]');
    assert.equal(ui.d.querySelectorAll('[data-action=hint]').length, i === 2 ? 1 : 0);
  }
  ui.click('[data-action=hint]');
  ui.click('[data-action=solution]');
  const next = ui.find('.complete [data-purpose=fresh]');
  assert.equal(next.dataset.task, fresh.task.id);
  assert.equal(next.dataset.mode, 'solo');
  assert.equal(next.dataset.lesson, lesson);

  await ui.navigate({view: 'route', route: 'g5'});
  assert.match(ui.find(topicStatus(lesson)).textContent, /Разобрал с помощью/);

  const revisit = openStrategy(t, {...params, mode: 'solo'}, {saved: ui.saved()});
  revisit.check(shown.task.steps[1], 1);
  assert.equal(revisit.state().learning.verified[shown.task.id], undefined, 'An answer already revealed cannot verify independence');

  const practice = openStrategy(t, params, {saved: revisit.saved()});
  practice.click('.complete [data-purpose=fresh]');
  await tick();
  assert.equal(practice.w.VPRApp.getView().task, fresh.task.id);
  assert.equal(practice.w.VPRApp.getView().mode, 'solo');
  assert.equal(practice.d.querySelector('.hint-area'), null);
  const route = openStrategy(t, {route: 'g5'}, {saved: practice.saved()});
  assert.equal(route.find(routePrimary).dataset.task, fresh.task.id);
  assert.equal(route.find(routePrimary).dataset.mode, 'solo');
  route.click(routePrimary);
  await tick();
  route.check(fresh.task.steps[1], 1);
  assert.equal(route.state().learning.verified[fresh.task.id], STRATEGY_START);
  await route.navigate({view: 'route', route: 'g5'});
  assert.match(route.find(topicStatus(lesson)).textContent, /Решил новую задачу сам/);
  for (const view of [ui, revisit, practice, route]) view.assertClean();
});

test('the graph prediction survives reopening and stays out of solo and shared-board views', async t => {
  const params = {route: 'g7', lesson: 'g7-process-graphs'};
  const ui = openStrategy(t, params);
  assert.equal(ui.find('.motion-pilot').open, false);
  ui.click('.motion-pilot > summary');
  ui.click('[data-action=motion-predict][data-prediction=lower]');
  assert.equal(ui.find('[data-action=motion-stop][data-stop="1"]').getAttribute('aria-pressed'), 'true');
  assert.equal(ui.d.querySelector('.motion-feedback'), null, 'The explanation follows the experiment');
  ui.click('[data-action=motion-stop][data-stop="2"]');
  assert.match(ui.find('.motion-feedback').textContent, /2,4 км\/ч.*2 км\/ч/);
  assert.deepEqual([...ui.d.querySelectorAll('.motion-table tr:first-child td')].map(cell => cell.textContent), ['0', '2', '4', '6']);
  const saved = ui.saved();
  const reopened = openStrategy(t, params, {saved});
  assert.equal(reopened.find('.motion-pilot').open, true);
  assert.equal(reopened.find('[data-action=motion-stop][data-stop="2"]').getAttribute('aria-pressed'), 'true');
  assert.equal(reopened.state().learning.motion.prediction, 'lower');
  const fresh = reopened.find('.motion-next [data-purpose=fresh]');
  assert.equal(fresh.dataset.task, 'g7-process-graphs-5');
  fresh.click();
  await tick();
  assert.equal(reopened.w.VPRApp.getView().mode, 'solo');
  assert.equal(reopened.d.querySelector('.motion-pilot'), null);
  const board = openStrategy(t, {...params, board: '1'}, {saved});
  assert.equal(board.w.VPRBoardMode, true);
  assert.equal(board.d.querySelector('.motion-pilot'), null);
  assert.equal(board.saved(), saved, 'Shared work cannot alter the stored personal prediction');
  for (const view of [ui, reopened, board]) view.assertClean();
});

test('after five days the route offers a fresh motion problem and records delayed evidence', async t => {
  const route = 'g7';
  const lesson = 'g7-process-graphs';
  const first = BY_ID.get(lesson + '-5').task;
  const unrelated = BY_ID.get(lesson + '-1').task;
  const reviewId = lesson + '-review';
  const now = openStrategy(t, {route, lesson, task: first.id, mode: 'solo'});
  now.check(first.steps.at(-1), first.steps.length - 1);
  assert.equal(now.state().learning.verified[first.id], STRATEGY_START);

  const early = openStrategy(t, {route}, {saved: now.saved(), now: STRATEGY_START + FIVE_DAYS - 1});
  assert.match(early.find(topicStatus(lesson)).textContent, /Решил новую задачу сам/);
  assert.equal(early.d.querySelector('[data-purpose=review]'), null);

  const unrelatedCheck = openStrategy(t, {route, lesson, task: unrelated.id, mode: 'solo'}, {
    saved: now.saved(), now: STRATEGY_START + FIVE_DAYS,
  });
  unrelatedCheck.check(unrelated.steps.at(-1), unrelated.steps.length - 1);
  assert.equal(unrelatedCheck.state().learning.verified[unrelated.id], STRATEGY_START + FIVE_DAYS);
  const due = openStrategy(t, {route}, {saved: unrelatedCheck.saved(), now: STRATEGY_START + FIVE_DAYS});
  assert.match(due.find(topicStatus(lesson)).textContent, /Пора повторить/);
  const review = due.find(routePrimary + '[data-purpose=review]');
  assert.equal(review.dataset.task, reviewId);
  assert.equal(review.dataset.mode, 'solo');
  review.click();
  await tick();
  due.fill('.step.current [data-answer=task]', '2,5');
  due.click('.step.current [data-action=check]');
  assert.equal(due.state().learning.verified[reviewId], STRATEGY_START + FIVE_DAYS);
  await due.navigate({view: 'route', route});
  assert.match(due.find(topicStatus(lesson)).textContent, /Подтвердил после паузы/);
  await due.navigate({view: 'route', route: 'g7u'});
  assert.match(due.find(topicStatus(lesson)).textContent, /Подтвердил после паузы/);
  for (const view of [now, early, unrelatedCheck, due]) view.assertClean();
});

test('opening a graph lab that reveals the coefficient disqualifies same-item evidence', async t => {
  const item = BY_ID.get('g7-linear-function-5');
  const params = {route: 'g7', lesson: item.lesson.id, task: item.task.id};
  const ui = openStrategy(t, params);
  assert.equal(ui.find('.plot-lab').open, false);
  ui.click('.plot-lab summary');
  await tick();
  assert.equal(ui.find('.plot-lab').open, true);
  assert.ok(ui.state().learning.exposed[item.task.id], 'The displayed formula contains the coefficient');
  const solo = openStrategy(t, {...params, mode: 'solo'}, {saved: ui.saved()});
  solo.check(item.task.steps.at(-1), item.task.steps.length - 1);
  assert.equal(solo.state().learning.verified[item.task.id], undefined);
  ui.assertClean();
  solo.assertClean();
});

test('the diagnostic recommends an incorrect topic before an earlier skipped task', async t => {
  const ui = open();
  t.after(ui.close);
  const session = await startDiagnostic(ui, 'g5');
  ui.click('[data-action=diagnostic-skip]');
  const wrong = BY_ID.get(session.ids[1]);
  const step = wrong.task.steps.at(-1);
  const value = step.answer.kind === 'choice' ? (step.answer.value + 1) % step.options.length : '999999';
  submitDiagnostic(ui, value);
  for (let i = 2; i < session.ids.length; i++) submitDiagnostic(ui);
  const statuses = [...ui.d.querySelectorAll('.result-list .result-item-head > span')].map(el => el.textContent);
  assert.deepEqual(statuses.slice(0, 3), ['пропущено', 'неверно', 'верно']);
  assert.equal(ui.find('.diagnostic-next-step h2').textContent, wrong.lesson.title);
  assert.equal(ui.find('.diagnostic-next-step button').dataset.task, wrong.lesson.tasks[0].id);
  ui.click('.diagnostic-next-step button');
  await tick();
  assert.equal(ui.w.VPRApp.getView().mode, 'learn');
  assert.equal(ui.w.VPRApp.getView().task, wrong.lesson.tasks[0].id);
  ui.assertClean();
});

test('recognizable errors get specific feedback only during guided practice', async t => {
  const ui = open();
  t.after(ui.close);
  const graph = BY_ID.get('g7-process-graphs-5');
  await ui.task(graph);
  for (let i = 1; i <= 2; i++) {
    ui.enter(graph.task.steps[0], 0, 'task', 1);
    ui.click('[data-action=check]');
    assert.match(ui.find('.feedback').textContent, /Высота верхней точки/);
    assert.equal(ui.d.querySelectorAll('[data-action=hint]').length, i === 2 ? 1 : 0);
    assert.equal(ui.d.querySelectorAll('.hint-text,.step.done').length, 0);
  }
  await ui.task(graph, 'solo');
  ui.enter(graph.task.steps[3], 3, 'task', 6);
  ui.click('[data-action=check]');
  assert.doesNotMatch(ui.find('.feedback').textContent, /ось времени|осью времени/);
  assert.equal(ui.d.querySelectorAll('[data-action=hint],.hint-text').length, 0);

  const percent = BY_ID.get('g6-percent-5');
  await ui.task(percent);
  ui.check(percent.task.steps[0], 0);
  ui.enter(percent.task.steps[1], 1, 'task', 200);
  ui.click('[data-action=check]');
  assert.match(ui.find('.feedback').textContent, /От какой цены берутся вторые 20%/);
  ui.assertClean();
});
