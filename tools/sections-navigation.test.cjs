'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const script = fs.readFileSync(path.join(__dirname, '../trainers/sections-course-navigation.js'), 'utf8');
const lessons = require('../stereo-course/sections/data/course.json').lessons;
const WRAPPER = '/trainers/sections-from-zero.html';

function fixture(t, allowed = true) {
  const dom = new JSDOM('<header class="workspace-bar"><div id="workspaceModes"></div></header><iframe id="trainerFrame" src="' + WRAPPER + '#starter-01"></iframe>', {
    url: 'https://mathexam.space/trainers/trainer-board.html?room=synthetic&role=student&token=synthetic-only', runScripts: 'outside-only'
  });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document, frame = d.querySelector('#trainerFrame');
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
  let current = 'starter-01', url = WRAPPER + '#starter-01', permitted = allowed, valid = true, selectionChecks = 0;
  frame.contentWindow.__sectionsBoard = { getState: () => ({ lessonId: current }), validateState: () => valid };
  const originalWindow = frame.contentWindow, originalDocument = frame.contentDocument, opened = [];
  w.eval(script);
  const navigation = w.MathExamSectionsCourseNavigation.mount({
    frame, currentUrl: () => url,
    canSelect: () => { selectionChecks++; return permitted; },
    open: value => { opened.push(value); return true; }
  });
  const toggle = d.querySelector('#sectionsCourseToggle'), panel = d.querySelector('#sectionsCoursePanel');
  const course = d.querySelector('#sectionsCourseFrame');
  function loadCourse() {
    toggle.click();
    assert.equal(course.inert, true, 'the first course button cannot navigate before its return handler is installed');
    const view = course.contentWindow;
    let selected = decodeURIComponent(new URL(view.location.href).hash.slice(1));
    view.SECTIONS_APP = { lessons, getCurrentLesson: () => lessons.find(lesson => lesson.id === selected) };
    view.SECTIONS_MASTER = { openLesson: id => { selected = id; } };
    course.dispatchEvent(new w.Event('load'));
    assert.equal(course.inert, false, 'the authored course becomes interactive after its return handler is installed');
    return {
      view,
      select: id => { selected = id; },
      request: id => {
        const event = new view.CustomEvent('sections:board-request', { cancelable: true, detail: { lessonId: id } });
        view.dispatchEvent(event); return event;
      }
    };
  }
  return { w, d, frame, originalWindow, originalDocument, navigation, toggle, panel, course, opened, loadCourse,
    selectionChecks: () => selectionChecks,
    setAllowed: value => { permitted = value; },
    setCurrent: value => { current = value; },
    setURL: value => { url = value; navigation.refresh(); },
    setValid: value => { valid = value; navigation.refresh(); }
  };
}

test('opening the current card and returning keeps the original board document even for an observer', t => {
  const f = fixture(t, false), entryURL = f.w.location.href;
  const c = f.loadCourse();
  assert.equal(f.panel.open, true);
  assert.equal(f.toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(f.course.src, 'https://mathexam.space/stereo-course/sections/#starter-01');
  assert.equal(f.course.getAttribute('referrerpolicy'), 'no-referrer');
  assert(!f.course.src.includes('synthetic'));
  const event = c.request('starter-01');
  assert.equal(event.defaultPrevented, true);
  assert.equal(f.panel.open, false);
  assert.equal(f.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(f.selectionChecks(), 0, 'returning to the same card requires no new control');
  assert.deepEqual(f.opened, []);
  assert.equal(f.frame.contentWindow, f.originalWindow);
  assert.equal(f.frame.contentDocument, f.originalDocument);
  assert.equal(f.w.location.href, entryURL);
  assert.equal(f.d.activeElement, f.toggle);
});

test('an observer can browse other cards but cannot replace the shared lesson, and can always close the course', t => {
  const f = fixture(t, false), c = f.loadCourse();
  c.select('starter-18');
  assert.equal(c.request('starter-18').defaultPrevented, true);
  assert.equal(f.panel.open, true);
  assert.match(f.d.querySelector('[data-sections-course-status]').textContent, /преподаватель/);
  assert.deepEqual(f.opened, []);
  f.d.querySelector('[data-sections-course-close]').click();
  assert.equal(f.panel.open, false);
  assert.equal(f.frame.contentDocument, f.originalDocument);
});

test('a teacher uses the existing authorized opener for exactly the selected known card, including Cyrillic IDs', t => {
  const f = fixture(t), c = f.loadCourse();
  const cyrillic = lessons.find(lesson => /[а-яё]/i.test(lesson.id)).id;
  c.select(cyrillic);
  assert.equal(c.request(cyrillic).defaultPrevented, true);
  assert.deepEqual(f.opened, [WRAPPER + '#' + encodeURIComponent(cyrillic)]);
  assert.equal(f.panel.open, false);
  assert.equal(f.frame.contentDocument, f.originalDocument);
});

test('authority is checked at selection time after the course has opened', t => {
  const f = fixture(t), c = f.loadCourse();
  f.setAllowed(false); c.select('starter-18');
  c.request('starter-18');
  assert.equal(f.panel.open, true);
  assert.deepEqual(f.opened, []);
});

test('unknown IDs, arbitrary URLs and a card different from the course selection never navigate the board', t => {
  const f = fixture(t), c = f.loadCourse();
  for (const id of ['unreviewed-card', 'https://example.com/', '../other', 'x'.repeat(200), 'starter-18', null]) {
    assert.equal(c.request(id).defaultPrevented, true);
    assert.equal(f.panel.open, true);
  }
  assert.deepEqual(f.opened, []);
  assert.equal(f.selectionChecks(), 0);
});

test('closed-course events and unrelated postMessages cannot select a shared lesson', t => {
  const f = fixture(t), c = f.loadCourse();
  f.d.querySelector('[data-sections-course-close]').click();
  c.select('starter-18'); c.request('starter-18');
  f.w.dispatchEvent(new f.w.MessageEvent('message', { data: { type: 'sections:board-request', lessonId: 'starter-18' }, origin: 'https://example.com/' }));
  assert.deepEqual(f.opened, []);
  assert.equal(f.selectionChecks(), 0);
});

test('the course panel stays mounted and reopens on the current shared card without remounting the trainer', t => {
  const f = fixture(t), c = f.loadCourse(), personalDocument = f.course.contentDocument;
  c.select('starter-18'); f.d.querySelector('[data-sections-course-close]').click();
  f.setCurrent('starter-02'); f.toggle.click();
  assert.equal(f.course.contentDocument, personalDocument);
  assert.equal(c.view.SECTIONS_APP.getCurrentLesson().id, 'starter-02');
  c.request('starter-02');
  assert.equal(f.panel.open, false);
  assert.equal(f.frame.contentDocument, f.originalDocument);
  assert.deepEqual(f.opened, []);
});

test('the feature is limited to the exact local sections wrapper and waits for valid shared state', t => {
  const f = fixture(t);
  assert.equal(f.toggle.hidden, false); assert.equal(f.toggle.disabled, false);
  f.setValid(false); assert.equal(f.toggle.disabled, true);
  f.setValid(true); assert.equal(f.toggle.disabled, false);
  for (const url of ['negative-numbers-line.html', 'https://example.com' + WRAPPER, WRAPPER + '?external=1']) {
    f.setURL(url); assert.equal(f.toggle.hidden, true);
  }
  assert.deepEqual(f.opened, []);
});

test('the existing room seed is accepted on the wrapper and is never sent to the personal course', t => {
  const f = fixture(t, false);
  f.setURL(WRAPPER + '?seed=synthetic-room#starter-01');
  f.frame.src = WRAPPER + '?seed=synthetic-room#starter-01';
  f.frame.contentWindow.__sectionsBoard = { getState: () => ({ lessonId: 'starter-01' }), validateState: () => true };
  f.navigation.refresh();
  assert.equal(f.toggle.hidden, false); assert.equal(f.toggle.disabled, false);
  const c = f.loadCourse();
  assert.equal(new URL(f.course.src).search, '');
  assert.equal(c.request('starter-01').defaultPrevented, true);
  assert.equal(f.panel.open, false); assert.deepEqual(f.opened, []);
});

test('a course document moved to another path or a query cannot request board navigation', t => {
  const f = fixture(t), c = f.loadCourse();
  c.select('starter-18');
  for (const url of ['/stereo-course/sections/?source=other', '/courses/#starter-18']) {
    c.view.history.replaceState(null, '', url);
    c.request('starter-18');
    assert.deepEqual(f.opened, []);
    assert.equal(f.selectionChecks(), 0);
  }
});

test('a previous course document loses authority after the frame navigates', t => {
  const f = fixture(t), c = f.loadCourse();
  c.select('starter-18');
  f.course.src = '/stereo-course/sections/#starter-02';
  c.request('starter-18');
  assert.deepEqual(f.opened, []);
  assert.equal(f.selectionChecks(), 0);
  assert.notEqual(f.course.contentDocument, c.view.document);
});
