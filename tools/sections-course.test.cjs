'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const course = require('../stereo-course/sections/data/course.json');
const source = fs.readFileSync(path.join(ROOT, 'stereo-course/sections/assets/app.js'), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
const copy = value => JSON.parse(JSON.stringify(value));

function boot({ hash = '', storage = {} } = {}) {
  const dom = new JSDOM('<!doctype html><body><a class="skip-link" href="#lesson-title">К уроку</a><div id="sections-app"></div></body>', {
    url: 'https://example.test/stereo-course/sections/' + hash,
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, errors = [];
  w.addEventListener('error', event => errors.push(event.error));
  w.TextEncoder = TextEncoder;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  // JSDOM has no font layout; this implements only SVG label measurement.
  // Browser tests separately check actual layout and model visibility.
  w.SVGElement.prototype.getBBox = function () { return { x: 0, y: -16, width: Math.max(12, this.textContent.length * 12), height: 20 }; };
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, value);
  w.COURSE = w.JSON.parse(JSON.stringify(course));
  w.eval(source);
  assert(w.SECTIONS_APP && w.SECTIONS_MASTER, 'real course engine and learning portal boot');
  return {
    w, doc: w.document,
    state: () => copy(w.SECTIONS_APP.getState()),
    current: () => { const state = w.SECTIONS_APP.getState(); return copy(state.tasks[state.current]); },
    open: id => w.SECTIONS_MASTER.openLesson(id),
    saved: () => Object.fromEntries(Object.keys(w.localStorage).map(key => [key, w.localStorage.getItem(key)])),
    async close() { await tick(); assert.deepEqual(errors, [], 'no uncaught engine errors'); w.close(); }
  };
}

function click(f, selector) {
  const node = f.doc.querySelector(selector); assert(node, selector); node.click();
}

function input(f, selector, value) {
  const node = f.doc.querySelector(selector); assert(node, selector); node.value = value;
  node.dispatchEvent(new f.w.Event('input', { bubbles: true }));
}

function construct(f, count) {
  for (let i = 0; i < count; i++) {
    if (f.doc.querySelector('[data-action="next-step"]')) click(f, '[data-action="next-step"]');
    click(f, '[data-action="construct"]');
  }
}

test('a fresh learner starts on one face and the first action is explicit', async () => {
  const f = boot();
  try {
    assert.equal(f.w.SECTIONS_MASTER.getState().view, 'map');
    const start = f.doc.querySelector('[data-action="path-start"]');
    assert.equal(start.textContent, 'Начать с первой грани'); start.click();
    assert.equal(f.state().current, 'starter-01');
    assert.equal(f.doc.querySelector('#lesson-title').textContent, 'Находим одну грань');
    assert.equal(f.current().revealed, 0);
    assert.equal(f.doc.querySelector('[data-action="construct"]'), null);
    click(f, '[data-action="start-study"]');
    assert.equal(f.current().revealed, 0, 'opening explanation does not draw');
    construct(f, 1);
    assert.equal(f.current().revealed, 1);
    assert.equal(f.current().workedSeen, true);
    assert.equal(f.current().independentSteps, 0, 'a shown action is not independent mastery');
    assert.equal(f.doc.querySelectorAll('[data-history-step]').length, 1);
  } finally { await f.close(); }
});

test('wrong working planes never draw and a usable hint remains after two distinct mistakes', async () => {
  const f = boot({ hash: '#starter-18' });
  try {
    click(f, '[data-action="start-practice"]');
    click(f, '[data-plane-choice="CGHD"]');
    click(f, '[data-plane-choice="BFGC"]');
    assert.equal(f.current().revealed, 0);
    assert.equal(f.doc.querySelector('[data-action="construct"]'), null);
    assert.equal(f.doc.querySelectorAll('.model-segment').length, 0);
    assert.deepEqual(f.current().planeAttempts['0'].wrong.sort(), ['BFGC', 'CGHD']);
    assert.match(f.doc.querySelector('.feedback.retry').textContent, /гран[ьи]|плоскост/);
    const hint = f.doc.querySelector('.step-hint'); assert(hint);
    assert.equal(hint.querySelector('summary').textContent, 'Хочешь подсказку?');
    click(f, '.step-hint > summary'); await tick();
    assert.equal(hint.open, true); assert.match(hint.textContent, /рёбра|ребра/);
    assert.equal(f.current().hintOpen['0'], true);
    click(f, '[data-plane-choice="AEFB"]');
    assert.equal(f.current().revealed, 0, 'a correct plane still requires an explicit construction');
    construct(f, 1);
    assert.equal(f.current().revealed, 1);
    assert.equal(f.current().helpUsed, true);
    assert.equal(f.current().independentSteps, 0, 'retry with help does not masquerade as a clean attempt');
  } finally { await f.close(); }
});

test('previous explanations, draft, camera and help survive navigation and a fresh document', async () => {
  const f = boot({ hash: '#starter-18' }); let reloaded;
  try {
    click(f, '.starter-other-mode > summary'); click(f, '[data-action="start-study"]');
    construct(f, 2);
    const previous = [...f.doc.querySelectorAll('[data-history-step]')].map(node => node.textContent);
    click(f, '.starter-draft > summary'); await tick();
    input(f, '#proof-draft', 'В AEFB точки M и N лежат на рёбрах этой грани.');
    f.doc.querySelector('.model-svg').dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await tick();
    const before = f.current(), saved = f.saved();
    f.open('starter-17'); f.open('starter-18');
    assert.deepEqual(f.current(), before);
    assert.deepEqual([...f.doc.querySelectorAll('[data-history-step]')].map(node => node.textContent), previous);
    reloaded = boot({ hash: '#starter-18', storage: saved }); await tick();
    assert.deepEqual(reloaded.current(), before);
    assert.deepEqual([...reloaded.doc.querySelectorAll('[data-history-step]')].map(node => node.textContent), previous);
    assert.equal(reloaded.doc.querySelector('#proof-draft').value, before.draft);
    assert.equal(reloaded.w.SECTIONS_MASTER.getState().path.stageId, 'begin-06');
    assert.equal(reloaded.w.SECTIONS_MASTER.getState().view, 'lessons');
  } finally { await reloaded?.close(); await f.close(); }
});

test('a delayed result toggle from a detached longer lesson cannot change the next lesson scene or saved work', async () => {
  const previous = course.lessons.find(lesson => lesson.id === 'auth-method-04');
  const next = course.lessons.find(lesson => lesson.id === 'auth-metric-09');
  assert(previous.steps.length > next.steps.length, 'the regression crosses from eight steps to five');
  const f = boot({hash:'#' + previous.id,storage:{[course.storageKey]:JSON.stringify({version:1,current:previous.id,tasks:{
    [previous.id]:{mode:'study',revealed:previous.steps.length,viewCount:previous.steps.length,
      calculationRevealed:(previous.calculationSteps || []).length,showResult:true,draft:'Сохранённое объяснение предыдущего построения.'}
  }})}});
  try {
    await tick();
    const detached = f.doc.querySelector('.result-details'); assert(detached?.open);
    f.open(next.id); await tick();
    assert.equal(detached.isConnected, false);
    const before = f.state(), saved = f.saved(), drawing = f.doc.querySelector('.course-main .model-svg').outerHTML;
    // Browsers can deliver a queued native toggle after the old card has been
    // replaced. Exercise both its opening and closing callbacks explicitly.
    detached.dispatchEvent(new f.w.Event('toggle'));
    detached.open = false; detached.dispatchEvent(new f.w.Event('toggle')); await tick();
    assert.deepEqual(f.state(), before, 'stale events do not alter either lesson or its help/result history');
    assert.deepEqual(f.saved(), saved, 'stale events cannot save work from a replaced disclosure');
    assert.equal(f.doc.querySelector('.course-main .model-svg').outerHTML, drawing);
    assert.equal(f.current().revealed, 0);
    click(f, '[data-action="start-study"]'); construct(f, 1);
    const camera = f.current().camera;
    click(f, '[aria-label="Повернуть вправо"]'); assert.notDeepEqual(f.current().camera, camera);
    click(f, '.plane-toggle'); assert.equal(f.current().planeView, true);
    assert.equal(f.current().revealed, 1, 'the actual next lesson still constructs and changes views normally');
  } finally { try { await f.close(); } finally { f.w.close(); } }
});

test('a known direct link opens its actual card instead of a hidden learning portal', async () => {
  const f = boot({ hash: '#auth-method-04' });
  try {
    assert.equal(f.state().current, 'auth-method-04');
    assert.equal(f.w.SECTIONS_MASTER.getState().view, 'lessons');
    assert.equal(f.doc.querySelector('.layout').hidden, false);
    assert.equal(f.doc.querySelector('#master-portal').hidden, true);
    assert.match(f.doc.querySelector('.lesson-condition').textContent, /BQ/);
    assert.equal(f.w.location.hash, '#auth-method-04');
  } finally { await f.close(); }
});

test('the selected card opens on the board without exporting personal work or leaving an existing room', async () => {
  const f = boot({ hash: '#auth-method-04' });
  try {
    const requested = [];
    f.w.addEventListener('sections:board-request', event => {
      requested.push(copy(event.detail));
      event.preventDefault(); // The actual board host handles its own course frame.
    });
    for (const id of ['starter-18', 'auth-method-04', ...course.lessons.filter(item => /[^a-z0-9-]/i.test(item.id)).map(item => item.id)]) {
      f.open(id);
      const link = f.doc.querySelector('[data-sections-board-open]'); assert(link);
      const url = new URL(link.href);
      assert.equal(url.origin, 'https://example.test');
      assert.equal(url.pathname, '/trainers/trainer-board.html');
      assert.deepEqual([...url.searchParams], [['trainer', '/trainers/sections-from-zero.html#' + encodeURIComponent(id)]]);
      assert.equal(link.target, '', 'the cabinet workspace remains the current browsing context');
      const before = f.saved();
      const event = new f.w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
      link.dispatchEvent(event);
      assert.equal(event.defaultPrevented, true, 'an existing board can return without navigating away from its room');
      assert.deepEqual(requested.at(-1), { lessonId: id });
      assert.deepEqual(f.saved(), before, 'navigation does not copy, mark or erase personal answers');
    }
  } finally { await f.close(); }
});

test('all 186 existing cards render with their exact condition and an actual geometry model', async () => {
  const f = boot();
  try {
    for (const lesson of course.lessons) {
      f.open(lesson.id);
      assert.equal(f.state().current, lesson.id);
      assert.equal(f.doc.querySelector('#lesson-title').textContent, lesson.title);
      assert.equal(f.doc.querySelector('.app-error'), null, lesson.id);
      assert.equal(new URL(f.doc.querySelector('[data-sections-board-open]').href).searchParams.get('trainer'),
        '/trainers/sections-from-zero.html#' + encodeURIComponent(lesson.id));
      assert(f.doc.querySelector('.model-svg [data-label]'), lesson.id + ': visible authored labels');
      assert.equal(f.current().revealed, 0, lesson.id + ': navigation cannot solve the card');
    }
    assert.equal(f.doc.querySelectorAll('[data-lesson-id]').length, 186);
  } finally { await f.close(); }
});

test('numeric syntax, wrong answers and fractional success retain explicit feedback', async () => {
  const f = boot({ hash: '#auth-method-04' }); let reloaded;
  try {
    click(f, '[data-action="start-study"]');
    construct(f, course.lessons.find(l => l.id === 'auth-method-04').steps.length);
    input(f, '#numeric-answer', '1/0');
    f.doc.querySelector('.answer-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
    assert.match(f.doc.querySelector('.answer-form .feedback').textContent, /Введи число/);
    input(f, '#numeric-answer', '7/11');
    f.doc.querySelector('.answer-form').dispatchEvent(new f.w.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(f.current().answerChecked, true); assert.equal(f.current().correctAnswer, false);
    const saved = f.saved();
    reloaded = boot({ hash: '#auth-method-04', storage: saved }); await tick();
    assert.equal(reloaded.doc.querySelector('#numeric-answer').value, '7/11');
    assert.equal(reloaded.current().correctAnswer, false);
    assert.equal(reloaded.doc.querySelector('.answer-form .feedback').textContent, f.doc.querySelector('.answer-form .feedback').textContent);
    input(reloaded, '#numeric-answer', '2/2');
    reloaded.doc.querySelector('.answer-form').dispatchEvent(new reloaded.w.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(reloaded.current().correctAnswer, true);
    assert.equal(reloaded.current().workedSeen, true, 'correct answer does not erase use of the explanation');
  } finally { await reloaded?.close(); await f.close(); }
});

test('lesson checks run by button and Enter without native submit and ignore composing Enter', async () => {
  const f = boot({ hash: '#auth-method-04' });
  try {
    click(f, '[data-action="start-study"]'); construct(f, course.lessons.find(l => l.id === 'auth-method-04').steps.length);
    let submits = 0; f.doc.querySelector('.answer-form').addEventListener('submit', () => submits++);
    assert.equal(f.doc.querySelector('[data-action="check-numeric-answer"]').type, 'button');
    input(f, '#numeric-answer', '1/0'); click(f, '[data-action="check-numeric-answer"]');
    assert.equal(f.current().answerInvalid, true); assert.equal(f.current().answerChecked, false);
    input(f, '#numeric-answer', '2/2');
    const composing = new f.w.KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true });
    f.doc.querySelector('#numeric-answer').dispatchEvent(composing);
    assert.equal(composing.defaultPrevented, false); assert.equal(f.current().answerChecked, false);
    const enter = new f.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    f.doc.querySelector('#numeric-answer').dispatchEvent(enter);
    assert.equal(enter.defaultPrevented, true); assert.equal(f.current().correctAnswer, true);
    assert.equal(f.current().answerChecked, true); assert.equal(f.current().answerInvalid, false);
    assert.equal(f.current().workedSeen, true); assert.equal(f.current().independentSteps, 0);
    assert.match(f.doc.querySelector('.answer-form .feedback').textContent, /Численный результат совпал/);
    input(f, '#numeric-answer', '1'); click(f, '[data-action="check-numeric-answer"]');
    assert.equal(f.current().correctAnswer, true); assert.equal(submits, 0);
    assert.deepEqual(JSON.parse(f.saved()[course.storageKey]).tasks['auth-method-04'], f.current());
  } finally { await f.close(); }
});

test('numeric practice checks keep feedback and saved work for button, Enter and composing Enter', async () => {
  const f = boot();
  try {
    f.w.SECTIONS_MASTER.openPractice('ratio');
    assert.equal(f.doc.querySelector('.drill-prompt').textContent, 'M∈AB, AM:MB=2:4, AB=12. Найди AM.');
    const work = () => copy(f.w.SECTIONS_MASTER.getState().practice.topics.ratio);
    let submits = 0; f.doc.addEventListener('submit', () => submits++);
    assert.equal(f.doc.querySelector('[data-action="check-drill-answer"]').type, 'button');
    input(f, '#drill-answer', '1/0'); click(f, '[data-action="check-drill-answer"]');
    assert.equal(work().checked, false); assert.equal(work().correct, false);
    assert.match(f.doc.querySelector('.drill-card .feedback').textContent, /Введи число/);
    input(f, '#drill-answer', '8/2');
    const composing = new f.w.KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true });
    f.doc.querySelector('#drill-answer').dispatchEvent(composing);
    assert.equal(composing.defaultPrevented, false); assert.equal(work().checked, false);
    const enter = new f.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    f.doc.querySelector('#drill-answer').dispatchEvent(enter);
    assert.equal(enter.defaultPrevented, true); assert.equal(work().checked, true); assert.equal(work().correct, true);
    assert.match(f.doc.querySelector('.drill-card .feedback').textContent, /Ответ совпал/);
    input(f, '#drill-answer', '4'); click(f, '[data-action="check-drill-answer"]');
    assert.equal(work().correct, true); assert.equal(submits, 0);
    assert.deepEqual(JSON.parse(f.saved()['mathexam.sections.master.activities.v1']).practice.topics.ratio, work());
  } finally { await f.close(); }
});

test('completing a demonstrated card does not automatically certify independent readiness', async () => {
  const f = boot({ hash: '#starter-01' });
  try {
    click(f, '[data-action="start-study"]'); construct(f, 1);
    click(f, '[data-action="starter-route"]');
    assert.equal(f.w.SECTIONS_MASTER.getState().view, 'map');
    assert.equal(Object.values(f.w.SECTIONS_MASTER.getState().path.readiness).flat().some(Boolean), false);
    assert.equal([...f.doc.querySelectorAll('[data-readiness]')].some(node => node.checked), false);
  } finally { await f.close(); }
});

test('self-corrected choices remain distinct from hints across reload and retry', async () => {
  const f = boot({ hash: '#starter-03' }); let again;
  try {
    click(f, '[data-action="start-practice"]');
    click(f, '[data-plane-choice="EFGH"]');
    assert.equal(f.current().mistakes, 1);
    assert.equal(f.current().helpUsed, false);
    assert.equal(f.current().revealed, 0);
    click(f, '[data-plane-choice="DHEA"]'); construct(f, 1);
    click(f, '[data-check-option="1"]');
    assert.equal(f.current().mistakes, 2);
    assert.equal(f.current().helpUsed, false);
    assert(!f.doc.querySelector('#starter-check .feedback').textContent.includes(course.lessons.find(l => l.id === 'starter-03').check.explanation), 'wrong choice does not reveal the answer');
    click(f, '[data-check-option="0"]');
    assert.equal(f.current().independentSteps, 1);
    assert.equal(f.current().checkCorrect, true);
    const saved = f.saved(); again = boot({ storage: saved });
    assert.equal(again.state().current, 'starter-03');
    assert.equal(again.current().attemptEvidenceVersion, 1);
    assert.equal(again.current().mistakes, 2);
    assert.equal(again.current().helpUsed, false);
    click(again, '[data-action="restart"]');
    assert.equal(again.current().mistakes, 2, 'retry cannot erase earlier corrections');
    click(again, '[data-action="start-practice"]');
    click(again, '.step-hint > summary'); await tick();
    assert.equal(again.current().helpUsed, true, 'opening help is recorded separately');
    assert.equal(again.current().mistakes, 2);
  } finally { await f.close(); if (again) await again.close(); }
});

test('a wrong reason retains the construction gate without revealing its explanation', async () => {
  const f = boot({ hash: '#auth-method-01' });
  try {
    click(f, '[data-action="start-practice"]');
    click(f, '[data-plane-choice="AA1B1B"]');
    click(f, '[data-reason-choice="0"]');
    assert.equal(f.current().mistakes, 1);
    assert.equal(f.current().helpUsed, false);
    assert.equal(f.doc.querySelector('[data-action="construct"]'), null);
    const question = course.lessons.find(l => l.id === 'auth-method-01').steps[0].question;
    assert(!f.doc.querySelector('.step-question').textContent.includes(question.explanation));
    click(f, '[data-reason-choice="2"]'); construct(f, 1);
    assert.equal(f.current().revealed, 1);
    assert.equal(f.current().independentSteps, 1);
    assert.equal(f.current().mistakes, 1);
  } finally { await f.close(); }
});

test('old records keep their unknown provenance and existing help flags', async () => {
  const legacy = { current: 'starter-03', tasks: { 'starter-03': {
    mode: 'practice', revealed: 0, helpUsed: true, helpReasons: ['Ошибка выбора плоскости, шаг 1'],
    planeAttempts: { 0: { wrong: ['EFGH'], selected: 'EFGH', correct: false } }
  } } };
  const f = boot({ hash: '#starter-03', storage: { [course.storageKey]: JSON.stringify(legacy) } });
  try {
    assert.equal(f.current().attemptEvidenceVersion, undefined);
    click(f, '[data-plane-choice="DHEA"]'); construct(f, 1);
    click(f, '[data-check-option="0"]');
    assert.equal(f.current().helpUsed, true);
    assert.equal(f.current().independentSteps, 0);
    assert.equal(f.current().attemptEvidenceVersion, undefined);
    assert.deepEqual(f.current().helpReasons, legacy.tasks['starter-03'].helpReasons);
  } finally { await f.close(); }
});

test('numeric mistakes are saved without converting them into opened help', async () => {
  const f = boot({ hash: '#auth-method-04' });
  try {
    click(f, '[data-action="start-study"]');
    const lesson = course.lessons.find(l => l.id === 'auth-method-04'); construct(f, lesson.steps.length);
    input(f, '#numeric-answer', '1/0'); click(f, '[data-action="check-numeric-answer"]');
    assert.equal(f.current().mistakes, 0, 'invalid notation is not a mathematical answer');
    input(f, '#numeric-answer', String(lesson.result.numeric.value + 10)); click(f, '[data-action="check-numeric-answer"]');
    assert.equal(f.current().mistakes, 1);
    assert.equal(f.current().helpUsed, false);
    input(f, '#numeric-answer', String(lesson.result.numeric.value)); click(f, '[data-action="check-numeric-answer"]');
    assert.equal(f.current().correctAnswer, true);
    assert.equal(f.current().mistakes, 1);
    assert.equal(f.current().workedSeen, true, 'a correct answer cannot erase the viewed construction');
  } finally { await f.close(); }
});

test('an untouched legacy catalog record starts new evidence while old work stays unknown', async () => {
  const original = boot(); let f;
  try {
    const old = original.state();
    assert.equal(Object.keys(old.tasks).length, 186, 'catalog creates a placeholder for every lesson');
    for (const record of Object.values(old.tasks)) { delete record.attemptEvidenceVersion; delete record.mistakes; }
    Object.assign(old.tasks['starter-01'], { mode: 'practice', revealed: 1, viewCount: 1, independentSteps: 1, selectedCheck: 0, checkCorrect: true });
    f = boot({ hash: '#starter-03', storage: { [course.storageKey]: JSON.stringify(old) } });
    assert.equal(f.current().attemptEvidenceVersion, undefined);
    click(f, '[data-action="start-practice"]');
    assert.equal(f.current().attemptEvidenceVersion, 1, 'actual start of untouched old placeholder is tracked');
    click(f, '[data-plane-choice="DHEA"]'); construct(f, 1); click(f, '[data-check-option="0"]');
    assert.equal(f.current().independentSteps, 1);
    assert.equal(f.state().tasks['starter-01'].attemptEvidenceVersion, undefined, 'completed old result is not upgraded');
    click(f, '[data-view="map"]');
    assert.equal(f.doc.querySelector('[data-path-stage="begin-01"]').closest('li').dataset.stageProgress, 'checked');
  } finally { await original.close(); if (f) await f.close(); }
});

test('section sides follow their supporting faces when the solid turns and in a flat view', async () => {
  const f = boot();
  try {
    const lab = f.w.SECTION_ACTIVITIES.makeLab('cube-horizontal', 0.5);
    const frame = f.doc.createElement('div'); f.doc.body.append(frame);
    const scene = f.w.SECTIONS_APP.createScene(frame, lab);
    const face = lab.steps.find(step => step.plane === 'DD1A1A'); // y = 0.
    const {a, b} = face.segments[0];
    const side = attr => frame.querySelector('[' + attr + '="' + a + '-' + b + '"],[' + attr + '="' + b + '-' + a + '"]');
    const update = (yaw, planeView = false, viewCount = lab.steps.length) => scene.update({
      viewCount, planeId:face.plane, planeView, camera:{yaw, pitch:.2}, showHelpers:true, showResult:true
    });
    update(0);
    assert.equal(side('data-segment').dataset.hidden, 'true');
    assert.equal(side('data-final-side'), null, 'a solid outline cannot cover dashes');
    update(Math.PI);
    assert.equal(side('data-segment').dataset.hidden, 'false');
    update(0, true);
    assert.equal(side('data-segment').dataset.hidden, 'false');
    update(0, false, 0);
    assert.equal(side('data-final-side').dataset.hidden, 'true', 'final-only contour also respects the camera');
    scene.destroy();
  } finally { await f.close(); }
});

test('written controls supply a blank figure and keep the explanation until submission', async () => {
  const f = boot();
  try {
    for (const id of ['basic','metric','research','final']) {
      const {written, proof} = f.w.SECTION_ACTIVITIES.makeExam(id, 0);
      assert.equal(written.prompt, proof);
      assert.equal(written.scene.steps.length, 0);
      assert.equal(written.scene.result, undefined);
      assert(!/выбери.*задачу|из главы|из лаборатории/i.test(proof));
      assert(written.solution);
      assert.notEqual(f.w.SECTION_ACTIVITIES.makeExam(id, 1).proof, proof);
    }
    click(f, '[data-view="control"]');
    const picker = f.doc.querySelector('select[aria-label="Самостоятельная работа"]');
    picker.value = 'final'; picker.dispatchEvent(new f.w.Event('change'));
    click(f, '[data-action="exam-start"]');
    const exam = f.w.SECTION_ACTIVITIES.makeExam('final');
    const proofPanel = f.doc.querySelector('#exam-proof').parentElement;
    assert(proofPanel.textContent.includes(exam.proof));
    assert(proofPanel.querySelector('[data-label="M"]'));
    assert.equal(proofPanel.querySelector('[data-label="R"]'), null, 'missing vertex remains for the learner');
    assert(!proofPanel.textContent.includes(exam.written.solution));
    input(f, '#exam-proof', 'Строю четвёртую вершину на BC.');
    for (const [i, q] of exam.questions.entries()) {
      if (q.kind === 'choice') click(f, '[data-exam-option="' + q.answer + '"]');
      else input(f, '#exam-answer', String(q.answer));
      if (i < exam.questions.length - 1) {
        [...f.doc.querySelectorAll('.exam-question button')].find(b => b.textContent === 'Следующее →').click();
      }
    }
    click(f, '[data-action="exam-finish"]');
    const report = f.doc.querySelector('#master-portal');
    assert(report.textContent.includes('5 из 5'));
    assert(report.textContent.includes(exam.written.solution));
    assert.equal(f.w.SECTIONS_MASTER.getState().exams.final.assisted, false);
    assert.equal(f.w.SECTIONS_MASTER.getState().exams.final.proof, 'Строю четвёртую вершину на BC.');
    const legacy = boot({storage:{'mathexam.sections.master.activities.v1':JSON.stringify({
      view:'control', examId:'final', exams:{final:{started:true, finished:false, run:0, answers:{}, proof:'Моя прежняя работа', history:[]}}
    })}});
    try {
      assert(legacy.doc.querySelector('#master-portal').textContent.includes('Построй новую задачу из главы'));
      assert.equal(legacy.doc.querySelector('#exam-proof').value, 'Моя прежняя работа');
    } finally { await legacy.close(); }
  } finally { await f.close(); }
});

test('an active face and oppositely directed strokes leave the same gaps on a hidden edge', async () => {
  const f = boot();
  try {
    const sheet = f.doc.createElement('style');
    sheet.textContent = fs.readFileSync(path.join(ROOT, 'stereo-course/sections/assets/style.css'), 'utf8');
    f.doc.head.append(sheet);
    const frame = f.doc.createElement('div'); f.doc.body.append(frame);
    const lesson = f.w.COURSE.lessons.find(item => item.id === 'ii-self-1');
    const scene = f.w.SECTIONS_APP.createScene(frame, lesson);
    scene.update({viewCount:lesson.steps.length, planeId:'ABCD', planeView:false,
      camera:{yaw:.2, pitch:.27}, showHelpers:true, showResult:true});
    const face = frame.querySelector('[data-active-plane="ABCD"]');
    assert.equal(f.w.getComputedStyle(face).stroke, 'none', 'a face fill cannot paint over hidden edge gaps');
    const edge = frame.querySelector('[data-edge="D-A"]');
    const side = frame.querySelector('[data-segment="A-D"]');
    for (const stroke of [edge, side]) {
      assert.equal(stroke.dataset.hidden, 'true');
      assert.equal(f.w.getComputedStyle(stroke).strokeDasharray, '6 5');
    }
    const coordinates = (line, end) => ['x','y'].map(axis => Number(line.getAttribute(axis + end)));
    const ends = [coordinates(edge, 1), coordinates(edge, 2)];
    assert.deepEqual(ends, [coordinates(side, 2), coordinates(side, 1)]);
    const distance = Math.hypot(ends[1][0] - ends[0][0], ends[1][1] - ends[0][1]);
    const phase = (line, offset) => ((Number(line.getAttribute('stroke-dashoffset')) + offset) % 11 + 11) % 11;
    for (let t = .137; t < distance; t += .67) {
      assert.equal(phase(edge, t) < 6, phase(side, distance - t) < 6, 'same physical point in the same dash or gap');
    }
    scene.destroy();
  } finally { await f.close(); }
});
