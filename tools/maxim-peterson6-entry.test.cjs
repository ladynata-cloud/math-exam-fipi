'use strict';

// Synthetic DOM and a frozen save exported by the published PR400 code.
// No network, accounts, teacher rooms or real learner records are used.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('trainers/maxim-peterson6/index.html');
const equations = read('trainers/maxim-peterson6/equation-method.js');
const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(m => !/\bsrc=/.test(m[1]))[2];
const published = JSON.parse(read('tools/fixtures/maxim-peterson6-pr400-save.json'));
const storageKey = 'mathexam-maxim-peterson6-route-v1';
const plain = value => JSON.parse(JSON.stringify(value));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const smallSpeed = /В этом разборе x — меньшая скорость\. Чью скорость обозначим буквой x\?/;

function fixture(hash = '#', progress) {
  const dom = new JSDOM(html, { url: 'https://mathexam.space/trainers/maxim-peterson6/' + hash, runScripts: 'outside-only' });
  const { window } = dom;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.fetch = () => { throw new Error('Exact exercise routing must not make a network request'); };
  let helper;
  window.PetersonTaskHelp = { mount(options) { helper = options; return { sync() {} }; } };
  if (progress) window.localStorage.setItem(storageKey, JSON.stringify(progress));
  window.eval(equations);
  window.eval(inline);
  return {
    window, C: window.TrainerCore, doc: window.document,
    raw() { return window.localStorage.getItem(storageKey); },
    progress() { return JSON.parse(this.raw()); },
    task() { return helper.getTask(); },
    // Exercise the registered hashchange handler synchronously. The browser
    // companion separately verifies actual links and browser navigation.
    navigate(hash) { window.history.pushState(null, '', hash); window.dispatchEvent(new window.HashChangeEvent('hashchange')); },
    submit(value) {
      const input = window.document.getElementById('answer-input');
      input.value = String(value);
      input.dispatchEvent(new window.Event('change', { bubbles: true }));
      window.document.getElementById('answer-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    },
    close() { window.close(); }
  };
}

test('published PR400 version-1 and version-2 saves and all 27 condition keys retain identity', () => {
  const f = fixture();
  try {
    assert.equal(published.synthetic, true);
    assert.equal(published.sourceCommit, '5bbfe3a4615b6410dacf7f1344aa57b909a986ef');
    assert.equal(published.sourceIdentities.length, 27);
    for (const name of ['current', 'legacy']) assert.deepEqual(plain(f.C.validateProgress(plain(published[name]))), published[name]);
    for (const item of published.sourceIdentities) {
      assert.equal(digest(f.C.conditionKey(f.C.textbookProblem(item.module, item.exampleId))), item.conditionKeySHA256, item.module + '/' + item.exampleId);
    }
    const current = published.current;
    assert.equal(current.solutions.length, 1);
    assert.equal(current.sessions.ratio.index, 2);
    assert.equal(current.sessions.ratio.answers[2], 'v0');
    assert.equal(current.sessions.ratio.hintUsed[2], true);
    assert.equal(published.legacy.sessions.ratio.answers[1], '2,');
  } finally { f.close(); }
});

test('every existing source-entry route selects its exact condition, including 303 and 305', () => {
  for (const item of published.sourceIdentities) {
    const f = fixture('#' + item.module + '?example=' + item.exampleId);
    try {
      const progress = f.progress(), session = progress.sessions[item.module];
      assert.equal(session.exampleId, item.exampleId);
      assert.equal(session.methodVersion, 2);
      assert.equal(digest(f.C.conditionKey(f.C.problemFor(session))), item.conditionKeySHA256);
      assert.equal(f.doc.querySelector('.problem-text').innerHTML, f.C.rich(f.C.textbookProblem(item.module, item.exampleId).prompt));
      assert.match(f.doc.querySelector('.badge').textContent, /Учебник/);
      assert.equal(f.task().condition, f.C.problemFor(session).prompt);
      assert.doesNotThrow(() => f.C.validateProgress(progress));
      if (item.exampleId === '303') assert.match(f.doc.querySelector('legend').textContent, smallSpeed);
      if (item.exampleId === '305') {
        f.submit('4/3');
        assert.match(f.doc.querySelector('legend').textContent, smallSpeed);
        assert.match(f.task().steps[1].title, smallSpeed);
      }
    } finally { f.close(); }
  }
});

test('malformed, mismatched and duplicated exact routes leave the entire saved work untouched', () => {
  const f = fixture('#ratio?example=305', published.current);
  try {
    const before = f.raw();
    const invalid = ['#ratio?example=999', '#meeting?example=305', '#time?example=303', '#missing?example=303', '#ratio?', '#ratio?example=', '#ratio?example=0303', '#ratio?example=303&example=305', '#ratio?example=303&other=1', '#ratio?example=303?example=305', '#ratio?Example=303', '#ratio?example=%25303', '#%E0%A4%A', '#ratio?example=%3Cscript%3E'];
    for (const hash of invalid) {
      f.navigate(hash);
      assert.match(f.doc.querySelector('h1').textContent, /Задание по этой ссылке не найдено/, hash);
      assert.equal(f.task(), null, hash);
      assert.equal(f.raw(), before, hash);
    }
    f.navigate('#');
    assert.match(f.doc.querySelector('h1').textContent, /Линейка Максима/);
    assert.equal(f.raw(), before);
    f.navigate('#ratio?example=305');
    assert.deepEqual(f.progress(), published.current);
  } finally { f.close(); }
});

test('exact links and reload keep published partial, completed and legacy work without duplicate credit', () => {
  for (const [hash, progress, module] of [
    ['#ratio?example=305', published.current, 'ratio'],
    ['#meeting?example=303', published.current, 'meeting'],
    ['#ratio?example=303', published.legacy, 'ratio']
  ]) {
    let f = fixture(hash, progress);
    try {
      assert.deepEqual(f.progress(), progress);
      f.navigate('#');
      f.navigate(hash);
      assert.deepEqual(f.progress(), progress);
      const snapshot = f.progress();
      f.close(); f = fixture(hash, snapshot);
      assert.deepEqual(f.progress(), progress);
      const session = progress.sessions[module];
      assert.match(f.doc.querySelector('#step-count').textContent, new RegExp('шагов: ' + session.index + ' из'));
      if (session.completedAt) {
        assert.match(f.doc.querySelector('#finish').textContent, /Пример решён/);
        assert.equal(f.progress().solutions.length, 1);
      } else {
        assert.equal(f.doc.querySelector('#answer-input').value, session.answers[session.index]);
        assert.equal(f.doc.querySelector('#hint-toggle').getAttribute('aria-expanded'), 'true');
      }
      if (progress.version === 1) assert.match(f.doc.querySelector('.equation-legacy').textContent, /начатое ранее решение/);
    } finally { f.close(); }
  }
});

test('305 to 303 and back restores the unfinished source draft through the existing archive', () => {
  const f = fixture('#ratio?example=305', published.current);
  try {
    const original = plain(published.current.sessions.ratio);
    f.navigate('#ratio?example=303');
    let progress = f.progress();
    assert.equal(progress.sessions.ratio.exampleId, '303');
    assert.deepEqual(progress.archivedSessions.find(s => s.exampleId === '305'), original);
    f.submit(f.C.problemFor(progress.sessions.ratio).steps[0].expected);
    const partial303 = f.progress().sessions.ratio;
    assert.equal(partial303.index, 1);
    f.navigate('#ratio?example=305');
    progress = f.progress();
    assert.deepEqual(progress.sessions.ratio, original);
    assert.deepEqual(progress.archivedSessions.find(s => s.exampleId === '303'), partial303);
    assert.deepEqual(progress.solutions, published.current.solutions);
    assert.equal(progress.metrics.ratio.errors, published.current.metrics.ratio.errors, 'navigation must not manufacture errors');
    assert.equal(progress.metrics.ratio.hints, published.current.metrics.ratio.hints, 'navigation must not manufacture hints');
    assert.doesNotThrow(() => f.C.validateProgress(progress));
    f.navigate('#ratio?example=303');
    assert.deepEqual(f.progress().sessions.ratio, partial303);
    assert.equal(f.progress().solutions.length, 1);
  } finally { f.close(); }
});

test('back to an archived legacy source keeps its method, accepted step, draft and hint', () => {
  let f = fixture('#ratio?example=303', published.legacy);
  try {
    const original = published.legacy.sessions.ratio;
    f.navigate('#ratio?example=305');
    assert.deepEqual(f.progress().archivedSessions.find(s => s.exampleId === '303'), original);
    f.navigate('#ratio?example=303');
    const restored = f.progress();
    assert.deepEqual(restored.sessions.ratio, original);
    assert.equal(restored.version, 2, 'the existing archive upgrades the container while retaining the legacy session');
    assert.equal(restored.sessions.ratio.methodVersion, undefined);
    assert.deepEqual(restored.assistance, published.legacy.assistance);
    assert.equal(restored.metrics.ratio.errors, published.legacy.metrics.ratio.errors);
    assert.equal(restored.metrics.ratio.hints, published.legacy.metrics.ratio.hints);
    assert.doesNotThrow(() => f.C.validateProgress(restored));
    f.close(); f = fixture('#ratio?example=303', restored);
    assert.deepEqual(f.progress(), restored);
    assert.equal(f.doc.querySelector('#answer-input').value, '2,');
    assert.match(f.doc.querySelector('.equation-legacy').textContent, /начатое ранее решение/);
    assert.equal(f.doc.querySelector('#hint-toggle').getAttribute('aria-expanded'), 'true');
  } finally { f.close(); }
});

test('textbook and generated selections keep the URL truthful and survive reload', () => {
  let f = fixture('#ratio?example=305', published.current);
  try {
    f.doc.querySelector('#another').click();
    assert.equal(f.window.location.hash, '#ratio');
    const generated = f.progress();
    assert.equal(generated.sessions.ratio.exampleId, null);
    assert.deepEqual(generated.archivedSessions.find(s => s.exampleId === '305'), published.current.sessions.ratio);
    f.close(); f = fixture('#ratio', generated);
    assert.deepEqual(f.progress(), generated);
    f.doc.querySelector('#sample-select').value = '303';
    f.doc.querySelector('#textbook').click();
    assert.equal(f.window.location.hash, '#ratio?example=303');
    assert.equal(f.progress().sessions.ratio.exampleId, '303');
    assert.deepEqual(f.progress().archivedSessions.find(s => !s.exampleId), generated.sessions.ratio);
    const exact = f.progress();
    f.close(); f = fixture('#ratio', exact);
    assert.equal(f.window.location.hash, '#ratio?example=303', 'a topic-only link resumes and identifies its current textbook task');
    assert.deepEqual(f.progress(), exact);
  } finally { f.close(); }
});

test('helper title and solved report clarify the model; stale exact-route help cannot alter another task', () => {
  const f = fixture('#ratio?example=303');
  try {
    const selected = f.task(), before = f.raw();
    assert.match(selected.steps[0].title, smallSpeed);
    const step = f.C.textbookProblem('ratio', '303').steps[0];
    assert.equal(step.label, 'Что обозначим буквой x?', 'the stored condition label is not rewritten');
    f.window.history.replaceState(null, '', '#ratio?example=305');
    assert.equal(f.task(), null, 'the helper does not read the stale view before hashchange');
    assert.equal(selected.onHelp(), false);
    assert.equal(f.raw(), before);
    f.navigate('#ratio?example=305');
    assert.equal(selected.onHelp(), false);
    assert.equal(f.progress().metrics.ratio.hints, 0);
    f.submit('4/3');
    const task305 = f.task();
    assert.match(task305.steps[1].title, smallSpeed);
    assert.equal(task305.onHelp(), true);
    assert.equal(f.progress().metrics.ratio.hints, 1);
    assert.match(f.C.reportHTML(published.current, '2026-11-02T00:10:00Z'), smallSpeed);
    assert.doesNotThrow(() => f.C.validateProgress(f.progress()));
  } finally { f.close(); }
});

test('click and Enter check local answers once without native submission or composing-input side effects', () => {
  const f = fixture('#ratio?example=305');
  try {
    const input = f.doc.querySelector('#answer-input');
    input.value = '4/3';
    input.dispatchEvent(new f.window.Event('input', { bubbles: true }));
    for (const options of [{ key: 'Enter', isComposing: true }, { key: 'Enter', keyCode: 229 }, { key: 'ArrowDown' }]) {
      const event = new f.window.KeyboardEvent('keydown', { ...options, bubbles: true, cancelable: true });
      input.dispatchEvent(event);
      assert.equal(event.defaultPrevented, false);
      assert.equal(f.progress().sessions.ratio.index, 0);
    }
    for (const options of [{ repeat: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      const event = new f.window.KeyboardEvent('keydown', { key: 'Enter', ...options, bubbles: true, cancelable: true });
      input.dispatchEvent(event);
      assert.equal(event.defaultPrevented, true);
      assert.equal(f.progress().sessions.ratio.index, 0);
    }
    const enter = new f.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input.dispatchEvent(enter);
    assert.equal(enter.defaultPrevented, true);
    assert.equal(f.progress().sessions.ratio.index, 1);
    const radio = f.doc.querySelector('[name=equation-choice][value=v0]');
    radio.checked = true;
    radio.dispatchEvent(new f.window.Event('change', { bubbles: true }));
    const button = f.doc.querySelector('#answer-form button[type=submit]');
    const click = new f.window.MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(click);
    assert.equal(click.defaultPrevented, true);
    assert.equal(f.progress().sessions.ratio.index, 2);
    const after = f.raw();
    button.dispatchEvent(new f.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(f.raw(), after, 'an already replaced button cannot submit a second step');
    assert.equal(f.progress().metrics.ratio.errors, 0);
    assert.equal(f.progress().metrics.ratio.hints, 0);
  } finally { f.close(); }
});

test('detached controls cannot submit another task or repeat a failed step at the same index', () => {
  const f = fixture('#ratio?example=303');
  try {
    const oldTaskButton = f.doc.querySelector('#answer-form button[type=submit]');
    f.navigate('#ratio?example=305');
    let input = f.doc.querySelector('#answer-input');
    input.value = '4/3';
    input.dispatchEvent(new f.window.Event('input', { bubbles: true }));
    const before = f.raw();
    oldTaskButton.dispatchEvent(new f.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(f.raw(), before, 'a detached №303 button cannot accept №305 at the same index');
    f.doc.querySelector('#answer-form button[type=submit]').click();
    assert.equal(f.progress().sessions.ratio.index, 1);
    input = f.doc.querySelector('#answer-input');
    input.value = 'v1';
    input.dispatchEvent(new f.window.Event('change', { bubbles: true }));
    const oldStepButton = f.doc.querySelector('#answer-form button[type=submit]');
    oldStepButton.click();
    assert.equal(f.progress().sessions.ratio.index, 1);
    assert.equal(f.progress().sessions.ratio.errors[1], 1);
    const afterFailure = f.raw();
    oldStepButton.dispatchEvent(new f.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(f.raw(), afterFailure, 'a detached failed-step button cannot count another error or reveal an automatic hint');
    assert.equal(f.progress().metrics.ratio.hints, 0);
  } finally { f.close(); }
});
