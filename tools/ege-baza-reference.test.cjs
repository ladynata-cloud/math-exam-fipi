'use strict';

// Exercise public and saved-attempt controllers with synthetic browser state.
// No server, pupil account, network request or real browser store is used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 8));
const D = require('../ege-baza/path/data.js');
require('../ege-baza/path/practice.js');
require('../ege-baza/path/equation-practice.js');
const families = D.meta.filter(item => !item.grade7 && !item.pre7);
const familyById = new Map(families.map(item => [item.id, item]));

function referenceData() {
  const scope = { window: {} };
  vm.createContext(scope);
  vm.runInContext(read('ege-baza/reference/data.js'), scope);
  return scope.window.EgeReferenceData;
}

function fixture({ file = 'ege-baza/path/index.html', hash = 'lesson=box', search = '', saved, managed = false } = {}) {
  const errors = [], requests = [], events = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(read(file), {
    url: `https://reference.test/${file}${search}${hash ? '#' + hash : ''}`,
    runScripts: 'outside-only', virtualConsole: vc, pretendToBeVisual: true
  });
  const w = dom.window, d = w.document;
  w.structuredClone = value => w.JSON.parse(JSON.stringify(value));
  w.TextEncoder = TextEncoder;
  w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.URL.createObjectURL = () => 'blob:reference-fixture';
  w.URL.revokeObjectURL = () => {};
  w.fetch = async (...args) => { requests.push(args); throw Error('Unexpected network request'); };
  let adapter, storageReads = 0;
  if (managed) {
    for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(w, key, {
      get() { storageReads++; throw Error('Managed reference must not access personal storage'); }
    });
    w.MathExamLearning = { register(value) { adapter = value; value.subscribe(event => events.push(copy(event))); } };
  } else {
    if (saved) w.localStorage.setItem('mathexam.ege-baza.path.v1', saved);
    w.localStorage.setItem('reference-unrelated-sentinel', 'preserved');
  }
  for (const script of d.querySelectorAll('script')) {
    if (!script.src) { if (script.textContent.trim()) w.eval(script.textContent); continue; }
    const url = new URL(script.src);
    assert.equal(url.origin, w.location.origin, 'fixture only loads repository scripts');
    if (managed && url.pathname === '/trainers/learning-bridge.js') continue;
    w.eval(read(url.pathname.slice(1)));
  }
  return { dom, w, d, errors, requests, events, adapter: () => adapter, storageReads: () => storageReads,
    close() { w.close(); } };
}

async function go(f, hash) {
  f.w.location.hash = hash;
  await tick();
}

function write(f, selector, value) {
  const input = f.d.querySelector(selector);
  assert(input, selector + ' exists');
  input.value = value;
  input.dispatchEvent(new f.w.Event('input', { bubbles: true }));
  return input;
}

async function open(element, value = true) {
  assert(element, 'disclosure exists');
  element.open = value;
  await tick();
}

function localTarget(href, base = 'https://reference.test/ege-baza/reference/index.html') {
  const url = new URL(href, base);
  assert.equal(url.origin, 'https://reference.test', 'reference links stay on this site');
  assert.equal(url.username, ''); assert.equal(url.password, '');
  const file = path.join(ROOT, url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname);
  assert(fs.existsSync(file), 'target exists: ' + url.pathname);
  return url;
}

test('all 107 EGE families use known, nonempty references; no orphan sheets or invented families', () => {
  const refs = referenceData();
  assert.equal(families.length, 107);
  assert.equal(refs.sheets.length, 31);
  const sheetIds = refs.sheets.map(sheet => sheet.id), unique = new Set(sheetIds);
  assert.equal(unique.size, sheetIds.length, 'sheet IDs are unique');
  assert.deepEqual(Object.keys(refs.lessonSheets).sort(), [...familyById.keys()].sort());
  const used = new Set();
  for (const [id, ids] of Object.entries(refs.lessonSheets)) {
    assert(ids.length > 0 && ids.length <= 5, id + ' has a focused reference list');
    assert.equal(new Set(ids).size, ids.length, id + ' has no duplicate rules');
    for (const sheetId of ids) { assert(unique.has(sheetId), `${id}: unknown ${sheetId}`); used.add(sheetId); }
  }
  assert.deepEqual([...used].sort(), [...unique].sort(), 'every sheet is used by a real family');
  for (const sheet of refs.sheets) {
    assert.match(sheet.id, /^[a-z][a-z0-9-]*$/);
    for (const key of ['category', 'title', 'summary', 'rule', 'example', 'commonError']) {
      assert.equal(typeof sheet[key], 'string', `${sheet.id}.${key}`);
      assert(sheet[key].trim(), `${sheet.id}.${key} is not empty`);
      assert(!/<\/?(?:script|iframe|img|svg|a|button|input)\b/i.test(sheet[key]), 'reference content is plain text');
    }
    assert(sheet.foundation.title.trim());
    localTarget(sheet.foundation.href);
  }
  for (const id of ['unknown-family', '__proto__', 'constructor', 'toString']) {
    assert.equal(refs.sheetsForTask({ id, seed: 0 }).length, 0, 'unknown family: ' + id);
  }
  for (const value of [null, undefined, {}, { id: 17 }]) assert.equal(refs.sheetsForTask(value).length, 0);
  assert(refs.lessonSheets['practice-faces'].includes('faces'), 'counting faces has its own rule, distinct from surface area');
  assert(!refs.lessonSheets['practice-faces'].includes('surface'), 'face counting does not substitute an area formula');
});

test('mixed families receive the rule for the generated subtype instead of an unrelated topic', () => {
  const refs = referenceData();
  for (let seed = 0; seed < 30; seed++) {
    const functions = refs.sheetsForTask(D.task('functions', seed));
    assert(functions.includes(seed % 3 === 0 ? 'logarithm' : 'trig'));
    assert(!functions.includes(seed % 3 === 0 ? 'trig' : 'logarithm'));
    const box = refs.sheetsForTask(D.task('box', seed));
    assert(box.includes(seed % 3 === 1 ? 'surface' : 'volume'));
    assert(!box.includes(seed % 3 === 1 ? 'volume' : 'surface'));
    const equation = refs.sheetsForTask(D.task('equations', seed));
    assert(equation.includes('equations'));
    assert.equal(equation.includes('logarithm'), seed % 5 === 3);
  }
});

test('reverse pins derive from the same family mapping and open the exact local family', async () => {
  const f = fixture();
  try {
    const refs = f.w.EgeReferenceData, ui = f.w.EgeReferenceUI;
    assert(ui && refs);
    for (const sheet of refs.sheets) {
      const pins = Array.from(ui.pins(sheet.id));
      for (const family of families.filter(item => refs.lessonSheets[item.id].includes(sheet.id))) {
        const pin = pins.find(item => item.id === family.id);
        assert(pin, `${sheet.id}: missing reciprocal pin ${family.id}`);
        const url = localTarget(pin.href);
        assert.equal(url.pathname, '/ege-baza/path/index.html');
        assert.equal(url.search, '');
        assert.equal(url.hash, '#lesson=' + family.id);
        assert.equal(pin.title, family.title);
        assert.equal(pin.pos, family.pos);
      }
      for (const pin of pins.filter(item => familyById.has(item.id))) {
        assert(refs.lessonSheets[pin.id].includes(sheet.id), `${sheet.id}: unrelated reciprocal pin ${pin.id}`);
      }
    }
    assert.equal(ui.pins('unknown-sheet').length, 0);
    assert.equal(ui.pins('__proto__').length, 0);
    for (const id of ['unknown-family', '__proto__', 'constructor', 'toString']) assert.equal(ui.forLesson(id).length, 0);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('only exact known family query parameters create a return-to-task link', () => {
  for (const value of ['box', 'practice-diameter-chord', '__proto__', 'constructor', 'box/extra', 'https://outside.test/', '<img src=x onerror=alert(1)>']) {
    const f = fixture({ file: 'ege-baza/reference/index.html', hash: '', search: '?from=' + encodeURIComponent(value) });
    try {
      const link = f.d.querySelector('#reference-return');
      assert.equal(link.hidden, !familyById.has(value), value);
      if (familyById.has(value)) {
        const url = localTarget(link.href);
        assert.equal(url.pathname, '/ege-baza/path/index.html');
        assert.equal(url.search, ''); assert.equal(url.hash, '#lesson=' + value);
      }
      assert.equal(f.d.querySelector('#reference-return img,#reference-return script,[onerror]'), null);
      assert.deepEqual(f.errors, []);
    } finally { f.close(); }
  }
});

test('all sheets render independently, without raw math tokens, unsafe markup or current-task answers', async () => {
  const f = fixture();
  try {
    for (const sheet of f.w.EgeReferenceData.sheets) {
      const html = f.w.EgeReferenceUI.card(sheet.id, { referenceBase: '../reference/', showPins: true });
      const host = f.d.createElement('div'); host.innerHTML = html;
      assert.equal(host.querySelectorAll('article.ref-sheet').length, 1, sheet.id);
      assert.equal(host.querySelector('article').dataset.sheetId, sheet.id);
      assert(host.textContent.includes(sheet.title), sheet.id + ' title');
      const visibleText = value => value.replace(/\[\[([^|]+)\|([^|]+)\]\]/g, '$1$2').replace(/\n/g, '');
      for (const [key, selector] of [['summary', '.ref-summary'], ['rule', '.ref-rule-text p'], ['example', '.ref-example p'], ['commonError', '.ref-error p']]) {
        assert.equal(host.querySelector(selector)?.textContent, visibleText(sheet[key]), sheet.id + ' complete ' + key);
      }
      assert.equal(host.querySelector('.ref-error').open, false, sheet.id + ' optional mistake explanation stays closed');
      assert(!host.textContent.includes('[['), sheet.id + ' math tokens are rendered');
      assert(!host.textContent.includes('undefined') && !host.textContent.includes('NaN'), sheet.id + ' no missing data');
      assert.equal(host.querySelectorAll('script,iframe,img,[onerror],[onclick]').length, 0);
      for (const link of host.querySelectorAll('a')) {
        assert(!/^(?:javascript|data):/i.test(link.getAttribute('href')));
        localTarget(link.getAttribute('href'), f.w.location.href);
      }
    }
    const ref = f.d.querySelector('.ref-help');
    assert(ref); await open(ref); await open(ref.querySelector('.ref-rule'));
    const before = ref.innerHTML, task = f.w.PathData.task;
    f.w.PathData.task = (id, seed) => {
      const value = task(id, seed);
      return { ...value, answer: 'CURRENT-ANSWER-MUST-NOT-LEAK', steps: value.steps.map(step => ({ ...step, a: 'CURRENT-STEP-MUST-NOT-LEAK', why: 'CURRENT-SOLUTION-MUST-NOT-LEAK' })) };
    };
    f.w.dispatchEvent(new f.w.HashChangeEvent('hashchange')); await tick();
    const after = f.d.querySelector('.ref-help'); await open(after); await open(after.querySelector('.ref-rule'));
    assert.equal(after.innerHTML, before, 'references do not read the generated answer or solution');
    assert(!after.textContent.includes('MUST-NOT-LEAK'));
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('each of 107 ordinary task screens has closed relevant references without automatic help', async () => {
  const f = fixture();
  try {
    for (const family of families) {
      await go(f, 'lesson=' + family.id);
      const help = f.d.querySelector('.ref-help'), lesson = f.w.PathCourse.state().lessons[family.id];
      assert(help, family.id + ' reference control');
      assert.equal(help.open, false, family.id + ' closed overview');
      assert.equal(lesson.help, false, family.id + ' no automatic help');
      assert.equal(f.d.querySelectorAll('.ref-rule[open]').length, 0, family.id + ' closed rule text');
      const ids = [...help.querySelectorAll('.ref-rule')].map(node => node.dataset.sheetId);
      assert(ids.length > 0, family.id + ' rules exist');
      assert(ids.every(id => f.w.EgeReferenceData.sheets.some(sheet => sheet.id === id)), family.id + ' known rules');
      for (const pin of help.querySelectorAll('.ref-pin')) assert.fail(family.id + ' inline helper should not show trainer catalogue');
    }
    assert.equal(f.w.localStorage.getItem('reference-unrelated-sentinel'), 'preserved');
    assert.deepEqual(f.errors, []); assert.deepEqual(f.requests, []);
  } finally { f.close(); }
});

test('opening a rule retains answer node, draft, caret and completed steps; only rule reveal counts as help', async () => {
  const f = fixture({ hash: 'lesson=equations-linear' });
  try {
    const lesson = f.w.PathCourse.state().lessons['equations-linear'];
    const answer = write(f, '#answer', '7/'); answer.focus(); answer.setSelectionRange(1, 2);
    const condition = f.d.querySelector('.task-first-problem .task'), conditionText = condition.textContent;
    const disclosure = f.d.querySelector('.ref-help');
    await open(disclosure);
    assert.equal(lesson.help, false, 'opening the rule menu alone is not assistance');
    assert.equal(f.d.querySelector('#answer'), answer); assert.equal(answer.value, '7/');
    assert.equal(answer.selectionStart, 1); assert.equal(answer.selectionEnd, 2);
    const rule = disclosure.querySelector('.ref-rule'); await open(rule);
    assert.equal(lesson.help, true, 'revealed rule is recorded');
    assert.equal(f.d.querySelector('#answer'), answer); assert.equal(answer.value, '7/');
    assert.equal(f.d.querySelector('.task-first-problem .task'), condition);
    assert.equal(condition.textContent, conditionText);
    await open(rule, false); await open(disclosure, false);
    assert.equal(lesson.help, true, 'closing cannot erase the assistance record');
    await open(f.d.querySelector('#taskHelp')); await open(f.d.querySelector('#taskSteps'));
    const task = f.w.PathData.task('equations-linear', lesson.seed);
    write(f, '#stepAnswer', String(task.steps[0].a));
    f.d.querySelector('#stepAnswerForm').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
    const step = write(f, '#stepAnswer', '3/'), stepIndex = lesson.step;
    const done = f.d.querySelector('.steps').textContent;
    await open(disclosure); await open(rule);
    assert.equal(f.d.querySelector('#answer'), answer); assert.equal(f.d.querySelector('#stepAnswer'), step);
    assert.equal(answer.value, '7/'); assert.equal(step.value, '3/'); assert.equal(lesson.step, stepIndex);
    assert.equal(f.d.querySelector('.steps').textContent, done);
    const saved = f.w.localStorage.getItem(f.w.PathCourse.KEY);
    const restored = fixture({ hash: 'lesson=equations-linear', saved });
    try {
      assert.equal(restored.d.querySelector('#answer').value, '7/');
      assert.equal(restored.w.PathCourse.state().lessons['equations-linear'].help, true);
      assert(restored.w.PathCourse.valid(restored.w.PathCourse.state()));
    } finally { restored.close(); }
    const before = lesson.independent;
    write(f, '#answer', String(task.answer));
    f.d.querySelector('#answerForm').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(lesson.independent, before, 'reference-assisted answer is not independent');
    assert.equal(lesson.done, true);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('exam and diagnostic screens do not acquire reference controls', async () => {
  for (const kind of ['exam', 'diagnostic']) {
    const f = fixture({ hash: kind });
    try {
      assert.equal(f.d.querySelector('.ref-help'), null);
      f.d.querySelector('#start').click(); await tick();
      for (let i = 0; i < 21; i++) {
        assert.equal(f.d.querySelector('.ref-help,.ref-rule,.ref-sheet'), null, kind + ' position ' + (i + 1));
        f.d.querySelector('#skip').click(); await tick();
      }
      assert.equal(f.w.PathCourse.state().runs.at(-1).assisted, false);
      assert.deepEqual(f.errors, []);
    } finally { f.close(); }
  }
});

test('saved-attempt references record a hint without personal storage or cross-attempt changes; read-only stays inert', async () => {
  const f = fixture({ search: '?learning=1', managed: true });
  try {
    const adapter = f.adapter(); assert(adapter);
    const spec = f.w.JSON.parse(JSON.stringify({ trainerId: 'ege-path', contentVersion: 1, id: 'box', seed: 17, task: D.task('box', 17) }));
    adapter.applyState({ taskSpec: spec, state: null, readOnly: false });
    const answer = write(f, '#answer', '12/');
    const snapshot = adapter.getState(), hintCount = () => f.events.filter(event => event.kind === 'hint').length;
    const overview = f.d.querySelector('.ref-help'); assert(overview);
    await open(overview); assert.equal(adapter.getState().work.help, false); assert.equal(hintCount(), 0);
    const rule = overview.querySelector('.ref-rule'); await open(rule);
    assert.equal(adapter.getState().work.help, true); assert.equal(hintCount(), 1);
    const hint = f.events.find(event => event.kind === 'hint');
    assert.equal(hint.details.reference, rule.dataset.sheetId); assert.equal(hint.details.level, 1);
    assert.equal(f.d.querySelector('#answer'), answer); assert.equal(answer.value, '12/');
    const current = adapter.getState();
    assert.equal(current.work.stage, snapshot.work.stage); assert.equal(current.work.step, snapshot.work.step);
    assert.deepEqual(copy(current.taskSpec), copy(snapshot.taskSpec));
    assert.equal(current.work.draft, snapshot.work.draft);
    const fullSheet = f.d.querySelector('.ref-rule[open] .ref-full-link a');
    assert(fullSheet, 'saved attempt can open the separate reference');
    const sheetUrl = localTarget(fullSheet.href);
    assert.equal(sheetUrl.pathname, '/ege-baza/reference/index.html');
    assert.equal(sheetUrl.searchParams.has('from'), false, 'a saved attempt must not pretend its public family route is the current work');
    assert.equal(fullSheet.target, '_blank', 'the original saved attempt remains in its existing tab');
    const reference = fixture({ file: 'ege-baza/reference/index.html', hash: sheetUrl.hash.slice(1), search: sheetUrl.search });
    try {
      assert.equal(reference.d.querySelector('#reference-return').hidden, true, 'separate sheet makes no false return-to-saved-work promise');
      assert.deepEqual(copy(adapter.getState()), copy(current), 'opening the separate sheet leaves the exact saved attempt intact');
      assert.equal(f.d.querySelector('#answer'), answer); assert.equal(answer.value, '12/');
      assert.deepEqual(reference.errors, []);
    } finally { reference.close(); }
    adapter.applyState({ taskSpec: spec, state: current, readOnly: true });
    assert.equal(f.d.querySelector('#main').inert, true);
    const readonly = JSON.stringify(adapter.getState()), count = f.events.length;
    const readonlyRule = f.d.querySelector('.ref-rule');
    await open(readonlyRule, false); await open(readonlyRule);
    assert.equal(JSON.stringify(adapter.getState()), readonly); assert.equal(f.events.length, count);
    assert.equal(f.storageReads(), 0); assert.deepEqual(f.requests, []);
    const school = f.w.PathData.meta.find(item => item.grade7);
    const schoolSpec = f.w.JSON.parse(JSON.stringify({ trainerId: 'ege-path', contentVersion: 1, id: school.id, seed: 17, task: f.w.PathData.task(school.id, 17) }));
    adapter.applyState({ taskSpec: schoolSpec, state: null, readOnly: false });
    assert.equal(f.d.querySelector('.ref-help'), null, 'unrelated grade 7 does not inherit EGE rules');
    assert.equal(adapter.getState().work.help, false);
    assert.deepEqual(f.errors, []);
  } finally { f.close(); }
});

test('reference catalogue handles exact deep links, unknown hashes and hostile search as plain text', async () => {
  const f = fixture({ file: 'ege-baza/reference/index.html', hash: '' });
  try {
    await tick();
    const refs = f.w.EgeReferenceData;
    assert(f.d.querySelector('#reference-search'));
    assert(f.d.querySelector('#reference-category'));
    assert(f.d.querySelector('#reference-filters'));
    for (const sheet of refs.sheets) {
      await go(f, 'sheet=' + sheet.id);
      const opened = f.d.querySelector('#reference-content .ref-sheet');
      assert(opened, sheet.id + ' deep link'); assert.equal(opened.dataset.sheetId, sheet.id);
    }
    const currentSheet = f.d.querySelector('#reference-content .ref-sheet'), currentHash = f.w.location.hash;
    f.d.querySelector('.ref-skip').click(); await tick();
    assert.equal(f.w.location.hash, currentHash, 'skip link does not replace the selected-sheet route');
    assert.equal(f.d.querySelector('#reference-content .ref-sheet'), currentSheet, 'skip link preserves the open sheet');
    assert.equal(f.d.activeElement, f.d.querySelector('#reference-content'), 'skip link moves keyboard focus to the reference content');
    await go(f, 'catalogue');
    assert.equal(f.d.title, 'Справочник с тренажёрами · MathExam', 'catalogue restores its title after a sheet');
    for (const hash of ['sheet=unknown', 'sheet=__proto__', 'sheet=%3Cimg%20src=x%20onerror=alert(1)%3E', 'sheet=fractions/extra', 'sheet=fractions&next=https://outside.test/']) {
      await go(f, hash);
      assert.equal(f.d.querySelector('#reference-content .ref-sheet'), null, 'invalid sheet must not select another rule');
      assert.equal(f.d.querySelector('#reference-content img,#reference-content script,[onerror]'), null);
      assert.equal(f.w.location.origin, 'https://reference.test');
    }
    await go(f, '');
    write(f, '#reference-search', 'площадь'); await tick();
    assert.equal(f.d.querySelector('#reference-content .ref-preview').getAttribute('href'), '#sheet=areas', 'a direct title match precedes incidental trainer mentions');
    write(f, '#reference-search', '<img src=x onerror="alert(1)">'); await tick();
    assert.equal(f.d.querySelector('#reference-content img,#reference-content script,[onerror]'), null);
    assert.equal(f.w.location.origin, 'https://reference.test');
    write(f, '#reference-search', ''); await tick();
    assert(f.d.querySelector('#reference-content').textContent.includes(refs.sheets[0].title), 'clearing search restores catalogue');
    assert.deepEqual(f.errors, []); assert.deepEqual(f.requests, []);
  } finally { f.close(); }
});
