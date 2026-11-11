'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const course = require('../stereo-course/sections/data/course.json');
const source = fs.readFileSync(path.join(__dirname, '../stereo-course/sections/assets/app.js'), 'utf8');
const TASKS = 'mathexam.sections.master.v1';
const ACTIVITIES = 'mathexam.sections.master.activities.v1';
const copy = value => JSON.parse(JSON.stringify(value));

function boot({ current = 'starter-01', tasks = {}, activities = {}, storage, now } = {}) {
  const dom = new JSDOM('<!doctype html><body><a class="skip-link" href="#lesson-title">К уроку</a><div id="sections-app"></div></body>', {
    url: 'https://example.test/stereo-course/sections/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, errors = [];
  if (now !== undefined) w.Date.now = () => now;
  w.addEventListener('error', event => errors.push(event.error));
  w.TextEncoder = TextEncoder;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.SVGElement.prototype.getBBox = function () { return { x: 0, y: -16, width: Math.max(12, this.textContent.length * 12), height: 20 }; };
  for (const [key, value] of Object.entries(storage || {
    [TASKS]: JSON.stringify({ version: 1, current, tasks }),
    [ACTIVITIES]: JSON.stringify({ view: 'map', ...activities })
  })) w.localStorage.setItem(key, value);
  w.COURSE = w.JSON.parse(JSON.stringify(course));
  w.eval(source);
  return {
    w, doc: w.document, state: () => copy(w.SECTIONS_APP.getState()),
    saved: () => Object.fromEntries(Object.keys(w.localStorage).map(key => [key, w.localStorage.getItem(key)])),
    async close() { await new Promise(resolve => setTimeout(resolve, 20)); assert.deepEqual(errors, []); w.close(); }
  };
}

function click(f, selector) { const node = f.doc.querySelector(selector); assert(node, selector); node.click(); }
function finished(id, override = {}) {
  const l = course.lessons.find(x => x.id === id);
  return { mode: 'practice', revealed: l.steps.length, independentSteps: l.steps.length,
    attemptEvidenceVersion: 1, mistakes: 0, checkCorrect: true, selectedCheck: l.check?.correct ?? -1,
    answerChecked: true, correctAnswer: true, ...override };
}
function node(f, stageId) { return f.doc.querySelector('[data-path-stage="' + stageId + '"]').closest('li'); }

test('all 26 stages are visible in their teaching order and a new learner starts on the first face', async () => {
  const f = boot();
  try {
    const items = [...f.doc.querySelectorAll('[data-path-stage]')];
    assert.deepEqual(items.map(x => x.dataset.pathStage), course.learningPath.map(x => x.id));
    assert.equal(items.length, 26);
    for (const item of items) assert.equal(item.closest('details'), null, 'the map is not hidden in a disclosure');
    assert(f.doc.querySelector('#path-readiness').compareDocumentPosition(f.doc.querySelector('.path-overview')) & f.w.Node.DOCUMENT_POSITION_FOLLOWING, 'self-check and next-stage controls remain before the long map');
    assert.equal(items[0].getAttribute('aria-current'), 'step');
    assert.equal(f.doc.querySelectorAll('[aria-current="step"]').length, 1);
    assert.equal(f.doc.querySelector('[data-action="path-resume"]'), null);
    assert.equal(f.doc.querySelector('[data-action="path-start"]').textContent, 'Начать с первой грани');
    click(f, '[data-action="path-start"]');
    assert.equal(f.state().current, 'starter-01');
  } finally { await f.close(); }
});

test('resume returns to the exact saved card and its stage after browsing another stage and reloading', async () => {
  const task = { mode: 'practice', revealed: 2, independentSteps: 2, draft: 'Проверить следующую грань', attemptEvidenceVersion: 1, mistakes: 1 };
  const f = boot({ current: 'starter-18', tasks: { 'starter-18': task }, activities: { path: { stageId: 'begin-01', readiness: {} } } });
  let restored;
  try {
    const savedWork = copy(f.state().tasks['starter-18']);
    click(f, '[data-path-stage="begin-02"]');
    assert.equal(f.doc.activeElement.id, 'path-stage-title', 'stage navigation puts focus on its heading');
    assert.equal(f.state().current, 'starter-18', 'browsing the map does not replace saved work');
    click(f, '[data-action="path-resume"]');
    assert.equal(f.state().current, 'starter-18');
    assert.equal(f.w.SECTIONS_MASTER.getState().path.stageId, 'begin-06');
    assert.deepEqual(f.state().tasks['starter-18'], savedWork);
    f.w.SECTIONS_MASTER.show('map');
    restored = boot({ storage: f.saved() });
    assert.equal(restored.doc.querySelector('[data-action="path-start"]').dataset.nextLesson, 'starter-18');
    click(restored, '[data-action="path-start"]');
    assert.equal(restored.state().tasks['starter-18'].draft, task.draft);
    assert.equal(restored.state().tasks['starter-18'].revealed, 2);
  } finally { if (restored) await restored.close(); await f.close(); }
});

test('one click opens the first stage and keeps the current card and its saved work', async () => {
  const task = {mode:'practice', revealed:2, independentSteps:2, draft:'Проверить следующую грань', attemptEvidenceVersion:1, mistakes:1};
  const f = boot({current:'starter-18',tasks:{'starter-18':task}});
  let restored;
  try {
    f.w.SECTIONS_MASTER.openLesson('starter-18');
    const work = f.state();
    assert.equal(f.w.location.hash, '#starter-18');
    assert.equal(f.doc.querySelector('.course-return a').getAttribute('href'), '/');
    click(f, '[data-action="course-start"]');
    assert.equal(f.doc.querySelector('.gentle-stage').dataset.stageId, 'begin-01');
    assert.equal(f.w.location.hash, '');
    assert.deepEqual(f.state(), work);
    restored = boot({storage:f.saved()});
    assert.equal(restored.doc.querySelector('.gentle-stage').dataset.stageId, 'begin-01');
    click(restored, '[data-action="path-resume"]');
    assert.equal(restored.state().current, 'starter-18');
    assert.equal(restored.state().tasks['starter-18'].draft, task.draft);
  } finally { if (restored) await restored.close(); await f.close(); }
});

test('a new independent transfer schedules a distinct optional check after one day', async () => {
  const now = Date.UTC(2026, 10, 12), day = 24 * 60 * 60 * 1000;
  const f = boot({now});
  let restored;
  try {
    f.w.SECTIONS_MASTER.openPractice('incidence');
    const seenPrompt = f.doc.querySelector('.drill-prompt').textContent;
    f.w.SECTIONS_MASTER.openLesson('starter-03');
    click(f, '[data-action="start-practice"]');
    click(f, '[data-plane-choice="DHEA"]'); click(f, '[data-action="construct"]');
    click(f, '[data-check-option="0"]');
    assert.equal(f.state().tasks['starter-03'].choiceEvidenceAt, now);
    f.w.SECTIONS_MASTER.show('map');
    assert.match(f.doc.querySelector('.stage-review').textContent, /Через сутки/);
    assert.equal(f.doc.querySelector('[data-action="path-review"]'), null);
    restored = boot({storage:f.saved(),now:now+day});
    click(restored, '[data-action="path-review"]');
    assert.notEqual(restored.doc.querySelector('.drill-prompt').textContent, seenPrompt);
    const attempt = () => restored.w.SECTIONS_MASTER.getState().path.reviews['begin-01'];
    const question = () => restored.w.SECTION_ACTIVITIES.makeDrill('incidence', attempt().index);
    const firstPrompt = question().prompt;
    click(restored, '[data-action="drill-hint"]');
    click(restored, '[data-drill-option="'+question().answer+'"]');
    assert.equal(attempt().firstCorrect, 'assisted');
    click(restored, '[data-action="next-drill"]');
    assert.notEqual(question().prompt, firstPrompt);
    const wrong = (question().answer + 1) % question().options.length;
    click(restored, '[data-drill-option="'+wrong+'"]');
    assert.doesNotMatch(restored.doc.querySelector('.drill-card .feedback').textContent, /открой короткую/);
    click(restored, '[data-drill-option="'+wrong+'"]');
    assert.match(restored.doc.querySelector('.drill-card .feedback').textContent, /открой короткую/);
    click(restored, '[data-drill-option="'+question().answer+'"]');
    assert.equal(attempt().firstCorrect, 'corrected');
    assert.equal(attempt().hint, 0);
    restored.w.SECTIONS_MASTER.show('map');
    assert.match(restored.doc.querySelector('.stage-review').textContent, /после самостоятельного исправления/);
    assert.match(restored.doc.querySelector('.path-summary').textContent, /Проверены выборы на новом примере: 1 из 26/);
  } finally { if (restored) await restored.close(); await f.close(); }
});

test('a related numeric answer identifies the question without recording a hint', async () => {
  const f = boot({activities:{view:'practice',practice:{topic:'area',topics:{area:{index:3,answer:'',hint:0}}}}});
  try {
    const q = f.w.SECTION_ACTIVITIES.makeDrill('area', 3);
    const input = f.doc.getElementById('drill-answer');
    input.value = String(q.otherAnswer.value);
    input.dispatchEvent(new f.w.Event('input'));
    click(f, '[data-action="check-drill-answer"]');
    assert.match(f.doc.querySelector('.drill-card .feedback').textContent, /площадь проекции.+площадь самого сечения/);
    assert.equal(f.w.SECTIONS_MASTER.getState().practice.topics.area.hint, 0);
  } finally { await f.close(); }
});

test('legacy completions and manual readiness never become evidence of unaided choices', async () => {
  const legacy = finished('starter-03'); delete legacy.attemptEvidenceVersion;
  legacy.choiceEvidence = 'first';
  const f = boot({ tasks: { 'starter-03': legacy }, activities: { path: { stageId: 'begin-01', readiness: { 'begin-01': [true, true] } } } });
  try {
    assert.equal(node(f, 'begin-01').dataset.stageProgress, 'built');
    assert.match(node(f, 'begin-01').textContent, /Самооценка: 2 из 2/);
    assert.match(f.doc.querySelector('.path-summary').textContent, /Проверены выборы на новом примере: 0 из 26/);
    assert.equal(f.state().tasks['starter-03'].attemptEvidenceVersion, undefined);
  } finally { await f.close(); }
});

test('an earned result survives opening the answer, repeating the card and later mistakes', async () => {
  const f = boot(); let reloaded;
  try {
    f.w.SECTIONS_MASTER.openLesson('starter-03');
    click(f, '[data-action="start-practice"]');
    click(f, '[data-plane-choice="DHEA"]'); click(f, '[data-action="construct"]');
    click(f, '[data-check-option="0"]');
    assert.equal(f.state().tasks['starter-03'].choiceEvidence, 'first');
    click(f, '.result-details > summary');
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(f.state().tasks['starter-03'].helpUsed, true);
    f.w.SECTIONS_MASTER.show('map');
    assert.equal(node(f, 'begin-01').dataset.stageProgress, 'checked');
    assert.match(node(f, 'begin-01').textContent, /Ранее проверены выборы без подсказки/);
    assert.match(f.doc.querySelector('.path-summary').textContent, /Чертёж и доказательство проверяем отдельно/);
    click(f, '[data-action="path-resume"]');
    click(f, '.starter-repeat > summary'); click(f, '[data-action="restart"]');
    click(f, '[data-action="start-practice"]');
    click(f, '[data-plane-choice="EFGH"]');
    assert.equal(f.state().tasks['starter-03'].mistakes, 1);
    assert.equal(f.state().tasks['starter-03'].choiceEvidence, 'first', 'later mistakes do not rewrite the earned result');
    f.w.SECTIONS_MASTER.show('map');
    assert.equal(node(f, 'begin-01').dataset.stageProgress, 'checked');
    assert.doesNotMatch(node(f, 'begin-01').textContent, /Сам исправил|сам исправил/);
    assert.equal(f.doc.querySelector('[data-action="path-start"]').textContent, 'Продолжить занятие');
    assert.equal(f.doc.querySelector('[data-action="path-start"]').dataset.nextLesson, 'starter-03', 'unfinished repeated work still takes precedence');
    reloaded = boot({ storage: f.saved() });
    assert.equal(node(reloaded, 'begin-01').dataset.stageProgress, 'checked');
    assert.equal(reloaded.state().tasks['starter-03'].choiceEvidence, 'first');
  } finally { if (reloaded) await reloaded.close(); await f.close(); }
});

test('a self-corrected earned result keeps its own history after the explanation is opened', async () => {
  const f = boot();
  try {
    f.w.SECTIONS_MASTER.openLesson('starter-03'); click(f, '[data-action="start-practice"]');
    click(f, '[data-plane-choice="EFGH"]'); click(f, '[data-plane-choice="DHEA"]');
    click(f, '[data-action="construct"]'); click(f, '[data-check-option="0"]');
    assert.equal(f.state().tasks['starter-03'].choiceEvidence, 'corrected');
    click(f, '.result-details > summary'); await new Promise(resolve => setTimeout(resolve, 30));
    f.w.SECTIONS_MASTER.show('map');
    assert.equal(node(f, 'begin-01').dataset.stageProgress, 'checked');
    assert.match(node(f, 'begin-01').textContent, /Ранее сам исправил; без подсказки/);
  } finally { await f.close(); }
});

test('a completed new transfer records unaided choices and self-correction separately from help', async t => {
  const cases = [
    [{}, 'checked', /Выборы без подсказки/],
    [{ mistakes: 2 }, 'checked', /Сам исправил; без подсказки/],
    [{ helpUsed: true }, 'help', /работа с помощью/],
    [{ workedSeen: true }, 'help', /работа с помощью/],
    [{ resultSeen: true }, 'help', /работа с помощью/],
    [{ calculationSeen: true }, 'help', /работа с помощью/],
    [{ checkCorrect: false }, 'built', /нужна проверка/],
    [{ independentSteps: 0 }, 'built', /нужна проверка/],
    [{ mode: 'study' }, 'built', /нужна проверка/]
  ];
  for (const [override, status, label] of cases) await t.test(JSON.stringify(override), async () => {
    const f = boot({ tasks: { 'starter-03': finished('starter-03', override) } });
    try {
      assert.equal(node(f, 'begin-01').dataset.stageProgress, status);
      assert.match(node(f, 'begin-01').textContent, label);
      assert.match(f.doc.querySelector('.path-overview').textContent, /не подтверждают самостоятельное доказательство/);
    } finally { await f.close(); }
  });
});

test('viewed stage examples lead to an unused reserve while a pending final answer keeps the current card', async () => {
  const tasks = Object.fromEntries(['starter-01', 'starter-02', 'starter-03'].map(id => [id, finished(id, { mode: 'study', workedSeen: true, independentSteps: 0 })]));
  const f = boot({ current: 'starter-03', tasks });
  let pending;
  try {
    assert.equal(f.doc.querySelector('[data-action="path-start"]').dataset.nextLesson, 'starter-19');
    assert.equal(f.doc.querySelector('[data-action="path-start"]').textContent, 'Новый пример без прежнего разбора');
    tasks['starter-03'].checkCorrect = false;
    pending = boot({ current: 'starter-03', tasks });
    assert.equal(pending.doc.querySelector('[data-action="path-start"]').dataset.nextLesson, 'starter-03');
  } finally { if (pending) await pending.close(); await f.close(); }
});

test('a checked reserve remains evidence even when the initial transfer needed help', async () => {
  const f = boot({ tasks: { 'starter-03': finished('starter-03', { helpUsed: true }), 'starter-19': finished('starter-19') } });
  try {
    assert.equal(node(f, 'begin-01').dataset.stageProgress, 'checked');
    assert.equal(f.state().tasks['starter-03'].helpUsed, true, 'history of help is retained');
  } finally { await f.close(); }
});

test('a learner who checks the transfer directly is sent to explain it rather than back to an unused model', async () => {
  const f = boot({ current: 'starter-03', tasks: { 'starter-03': finished('starter-03') } });
  try {
    assert.equal(f.doc.querySelector('[data-action="path-start"]').dataset.nextLesson, 'starter-03');
    assert.match(f.doc.querySelector('.gentle-stage').textContent, /воспроизведи чертёж и объяснение/);
    assert.equal(f.state().tasks['starter-01'].mode, 'choose', 'earlier examples need not be started');
    assert.equal(f.state().tasks['starter-01'].revealed, 0);
  } finally { await f.close(); }
});

test('readiness changes preserve keyboard focus and do not replace task evidence', async () => {
  const f = boot();
  try {
    const input = f.doc.querySelector('[data-readiness="0"]'); input.focus(); input.click();
    assert.equal(f.doc.activeElement.dataset.readiness, '0');
    assert.equal(f.doc.activeElement.checked, true);
    assert.equal(node(f, 'begin-01').dataset.stageProgress, 'new');
    assert.match(node(f, 'begin-01').textContent, /Самооценка: 1 из 2/);
  } finally { await f.close(); }
});

test('a numerical result must also be checked before a main-stage example earns a checked status', async () => {
  const stage = course.learningPath.find(s => {
    const l = course.lessons.find(l => l.id === s.lessons.at(-1)); return l.result?.numeric;
  });
  assert(stage, 'the real course includes a numerical final example');
  const id = stage.lessons.at(-1),f = boot({ tasks: { [id]: finished(id, { correctAnswer: false }) } });
  let checked, assisted;
  try {
    assert.equal(node(f, stage.id).dataset.stageProgress, 'built');
    checked = boot({ tasks: { [id]: finished(id) } });
    assert.equal(node(checked, stage.id).dataset.stageProgress, 'checked');
    const l = course.lessons.find(l => l.id === id);
    assert(l.calculationSteps.length > 0, 'this task has real calculation steps');
    assisted = boot({ tasks: { [id]: finished(id, { calculationRevealed: 1 }) } });
    assert.equal(node(assisted, stage.id).dataset.stageProgress, 'help');
  } finally { if (assisted) await assisted.close(); if (checked) await checked.close(); await f.close(); }
});
