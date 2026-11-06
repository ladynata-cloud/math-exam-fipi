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
