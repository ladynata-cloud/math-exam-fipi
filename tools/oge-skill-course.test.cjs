'use strict';

// Integration checks use the built page, genuine DOM events and synthetic data.
// JSDOM is not evidence of a rendered browser layout or learner effectiveness.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test, after} = require('node:test');
const {JSDOM} = require('jsdom');
const {createHarness, STORAGE_PROGRESS, STORAGE_SESSION} = require('../oge/skills/dom-harness.js');

const root = path.resolve(__dirname, '..');
const origin = 'https://mathexam-skill-course.invalid';
const lessonPath = '/oge/skills/';
const cabinet = 'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#route';
const topics = ['base', ...Array.from({length: 14}, (_, i) => 'n' + (i + 6))];
const sources = {
  base: '/trainers/oge-basics/',
  n6: '/trainers/oge-task6-fractions.html',
  n7: '/trainers/oge-task7-number-line.html',
  n8: '/trainers/oge-task8-powers-roots.html',
  n9: '/trainers/oge-task9-equations.html',
  n10: '/trainers/oge-task10-probability.html',
  n11: '/trainers/oge-task11-graphs-trainer.html',
  n12: '/trainers/oge-task12-formulas-trainer.html',
  n13: '/trainers/oge13-inequalities-series.html',
  n14: '/trainers/oge-task14-progressions.html',
  n15: '/trainers/oge-task15-triangles.html',
  n16: '/trainers/oge-task16-circle.html',
  n17: '/trainers/oge-task17-quadrilaterals.html',
  n18: '/trainers/oge-task18-grid.html',
  n19: '/trainers/task19-trainer.html'
};
const oldTopics = {
  ...Object.fromEntries(Array.from({length: 5}, (_, i) => [String(i + 1), '/trainers/oge-1-5-trainers/practice-1-5-map.html'])),
  ...Object.fromEntries(Object.entries(sources).filter(([id]) => id !== 'base').map(([id, href]) => [id.slice(1), href])),
  20: '/trainers/oge-task20-equations.html',
  21: '/trainers/oge-task21-word-problems.html',
  22: '/trainers/oge-task22-functions-graphs.html',
  23: '/trainers/oge-task23-geometry-calculations.html',
  24: '/trainers/oge-task24-proofs.html',
  25: '/trainers/oge-task25-geometry.html'
};
const practical = ['roads-grid', 'roads-schema', 'tires', 'stoves', 'land-plots', 'apartments', 'tariffs', 'paper-sheets'];
const legacy = new Map([
  ['mathExamCourseProgress.v1', '{"synthetic-old-trainer":{"solvedByType":{"first":3},"updatedAt":99}}'],
  ['mathExam.oge6.practice.v1', '{"synthetic":"fractions"}'],
  ['mathExam.oge20.practice.v1', '{"synthetic":"equations"}'],
  ['mathExam.oge22.practice.v1', '{"synthetic":"graphs"}'],
  ['mathExam.task19.visualHints.v1', '{"synthetic":"help"}'],
  ['oge21_prog', '{"synthetic":"word-problems"}'],
  ['mathexam.oge.course-navigation.v1', '{"synthetic":"navigation"}'],
  ['mathExamFoundations.visits.v1', '{"synthetic":"foundations"}']
]);
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
function hrefExists(href) {
  const url = new URL(href, origin);
  assert.equal(url.origin, origin);
  const relative = url.pathname.slice(1) + (url.pathname.endsWith('/') ? 'index.html' : '');
  assert(fs.existsSync(path.join(root, relative)), 'Missing destination: ' + href);
}
function open(query = '', options = {}) {
  return createHarness({url: origin + lessonPath + query, ...options});
}
function untouched(storage) {
  for (const [key, value] of legacy) assert.equal(storage.get(key), value, 'Preserve old storage: ' + key);
  for (const key of storage.keys()) assert(legacy.has(key) || [STORAGE_PROGRESS, STORAGE_SESSION].includes(key), 'Unexpected storage write: ' + key);
}
function assertNavigation(h, topic) {
  const nav = h.query('nav[data-skill-navigation]');
  const course = nav.querySelector('a[data-skill-link="course"]');
  const trainer = nav.querySelector('a[data-skill-link="trainer"]');
  const account = nav.querySelector('a[data-skill-link="cabinet"]');
  assert.equal(course.getAttribute('href'), '/trainers/oge-course/');
  assert.equal(trainer.getAttribute('href'), sources[topic]);
  assert.equal(account.getAttribute('href'), cabinet);
  for (const anchor of [course, trainer]) {
    assert.equal(new URL(anchor.href).origin, origin);
    assert(!anchor.target || anchor.target === '_self', 'Public course links stay in this tab');
    assert.equal(new URL(anchor.href).search, '', 'No managed-session parameters are forwarded');
  }
}

test('existing course entries remain; all optional topic links also work without JavaScript', () => {
  for (const file of ['trainers/oge-course/index.html', 'oge/index.html']) {
    const dom = new JSDOM(read(file), {url: origin + '/' + file});
    try {
      const doc = dom.window.document;
      const actual = Object.fromEntries(Array.from(doc.querySelectorAll('[data-oge-topic]'), a => [a.dataset.ogeTopic, a.getAttribute('href')]));
      assert.deepEqual(actual, oldTopics, file + ' retains the 25 existing trainer links');
      assert.deepEqual(Array.from(doc.querySelectorAll('[data-oge-practical]'), a => a.dataset.ogePractical).sort(), practical.slice().sort());
      const section = doc.querySelector('#skill-course.oge-skill-course-entry');
      assert(section, file + ' has a separate optional entry');
      const details = section.querySelector('details#skill-course-topics');
      assert(details && !details.open, 'Full topic list starts closed');
      const links = Array.from(details.querySelectorAll('a[data-oge-skill-topic]'));
      assert.deepEqual(links.map(a => a.dataset.ogeSkillTopic), topics);
      for (const a of links) {
        const url = new URL(a.href);
        assert.equal(url.pathname, lessonPath);
        assert.equal(url.search, '?topic=' + a.dataset.ogeSkillTopic);
        hrefExists(a.getAttribute('href'));
      }
      assert(section.querySelector('a[href="#all-topics"]'), 'Ordinary practice remains an explicit choice');
      assert(section.querySelector('a[href="/oge/skills/"]'), 'The optional section has a direct entry');
      assert(doc.querySelector('a[href="' + cabinet + '"]'), 'Existing cabinet entry remains');
      if (file.startsWith('trainers/')) {
        assert.equal(doc.querySelectorAll('.learner-start .entry').length, 3);
        assert.equal(doc.querySelector('#how-to-learn').open, false);
        assert.equal(doc.querySelectorAll('#how-to-learn li').length, 4);
      }
    } finally { dom.window.close(); }
  }
  const fallback = new JSDOM(read('oge/skills/index.html'), {url: origin + lessonPath});
  try {
    assert(fallback.window.document.querySelector('nav[data-skill-navigation] a[data-skill-link="course"]'));
    assert(fallback.window.document.querySelector('noscript'), 'The non-script page explains how to reach existing practice');
  } finally { fallback.window.close(); }
  Object.values(sources).forEach(hrefExists);
});

test('each explicit topic overrides stale selection and opens a finite ordinary practice', () => {
  const storage = new Map(legacy);
  let h = open('?topic=n11', {storage});
  try {
    h.click('[data-action="mode"][data-mode="creative"]');
    h.click('[data-action="map"]');
  } finally { h.close(); }
  for (const topic of topics) {
    h = open('?topic=' + topic, {storage});
    try {
      assert.equal(h.api.state.topic, topic);
      assert.equal(h.query('#skill-topic').value, topic);
      assert.equal(h.api.state.mode, 'quick');
      assert.equal(h.api.state.activeRun, null);
      assert.equal(h.api.state.map, false);
      assert.equal(h.query('[data-action="map"]').getAttribute('aria-expanded'), 'false');
      assert(!h.document.querySelector('.map'));
      assert(!h.query('details.series-picker').open);
      const about = h.query('details.topic-about');
      assert.equal(about.open, false, 'The full topic description is optional');
      assert.equal(h.query('.stage').nextElementSibling, about, 'The description follows the concrete task');
      assert.equal(about.querySelector('.goal').textContent, h.api.data.topics.find(item => item.id === topic).goal, 'The complete learning goal is preserved');
      assert.equal(h.document.querySelector('.heading .goal'), null, 'The full description does not push the first task down');
      assert.match(h.query('.stage-count').textContent, /Задание 1 из 4/);
      assert(h.api.task(), 'Topic opens a concrete task');
      assertNavigation(h, topic);
      const url = new URL(h.window.location.href);
      assert.equal(url.searchParams.get('topic'), topic);
      untouched(storage);
    } finally { h.close(); }
  }
});

test('generated route links continue saved variants, answer, cursor and used help', () => {
  const storage = new Map(legacy);
  const route = 'route-arith-fractions';
  let h = open('?topic=n9&route=' + route, {storage});
  let taskId, refs, seedCounter;
  try {
    assert.equal(h.api.state.topic, 'n6', 'Route owns its actual topic');
    assert.equal(h.api.state.activeRun, route);
    h.input('#skill-answer', '123/7');
    h.click('[data-action="hint"]');
    taskId = h.api.task().id;
    refs = plain(h.api.state.runs[route].refs);
    seedCounter = h.api.state.seedCounter;
  } finally { h.close(); }
  h = open('?route=' + route, {storage});
  try {
    assert.equal(h.api.task().id, taskId);
    assert.deepEqual(plain(h.api.state.runs[route].refs), refs);
    assert.equal(h.api.state.seedCounter, seedCounter, 'Reload does not generate a new route');
    assert.equal(h.query('#skill-answer').value, '123/7');
    assert.equal(h.api.taskState(h.api.task()).helpUsed, true);
    h.solve();
    assert.equal(h.api.progress[taskId].independent || 0, 0, 'A helped answer does not become independent after reload');
    h.click('[data-action="next"]');
    assert.equal(h.api.state.runs[route].cursor, 1);
  } finally { h.close(); }
  h = open('?route=' + route, {storage});
  try {
    assert.equal(h.api.state.runs[route].cursor, 1);
    assert.deepEqual(plain(h.api.state.runs[route].refs), refs);
    assert.equal(h.api.state.seedCounter, seedCounter);
    untouched(storage);
  } finally { h.close(); }
});

test('skipping a workshop leaves two solved ordinary tasks as a completed two-task result', () => {
  const storage = new Map(legacy);
  const route = 'route-exp-n6-errors';
  const h = open('?route=' + route, {storage});
  try {
    assert.equal(h.api.task().id, 'exp-n6-errors-entry');
    h.input('#skill-answer', '13/6');
    h.click('[data-action="check"]');
    assert.equal(h.api.state.feedback.ok, true);
    h.click('[data-action="next"]');
    const skipped = h.api.task().id;
    assert.equal(h.api.task().learningMode, 'creative');
    h.click('[data-action="skip-workshop"]');
    assert.equal(h.api.task().id, 'exp-n6-errors-exit');
    h.input('#skill-answer', '2,9');
    h.click('[data-action="check"]');
    assert.equal(h.api.state.feedback.ok, true);
    h.click('[data-action="next"]');
    assert.match(h.query('.ordinary-result').textContent, /решено 2 из 2/);
    assert.match(h.query('.ordinary-result').textContent, /Без подсказки приложения — 2/);
    assert.match(h.query('.workshop-result').textContent, /мастерских: 0/);
    assert(!h.api.progress[skipped] || !h.api.progress[skipped].successful);
    assert.deepEqual(plain(h.api.state.runs[route].skipped), [skipped]);
    assert.match(h.query('.completed').textContent, /Можно закончить здесь/);
    untouched(storage);
  } finally { h.close(); }
});

test('links to a single generated variant or fixed task resume the same unfinished work', () => {
  for (const route of ['family:func-point-membership', 'task:exp-n6-errors-entry']) {
    const storage = new Map(legacy);
    let h = open('?route=' + encodeURIComponent(route), {storage});
    let snapshot;
    try {
      assert.equal(h.api.state.activeRun, route);
      h.fillCorrect(h.api.task());
      h.click('[data-action="hint"]');
      snapshot = plain({id: h.api.task().id, state: h.api.taskState(h.api.task()), refs: h.api.state.runs[route].refs, seed: h.api.state.seedCounter});
    } finally { h.close(); }
    h = open('?route=' + encodeURIComponent(route) + '&map=1', {storage});
    try {
      assert.deepEqual(plain({id: h.api.task().id, state: h.api.taskState(h.api.task()), refs: h.api.state.runs[route].refs, seed: h.api.state.seedCounter}), snapshot);
      assert.equal(h.api.state.map, true);
      h.click('[data-action="check"]');
      assert.equal(h.api.state.feedback.ok, true);
      assert.equal(h.api.progress[snapshot.id].independent || 0, 0);
      untouched(storage);
    } finally { h.close(); }
  }
});

test('cross-topic navigation and an optional detour preserve unfinished input and help', () => {
  const storage = new Map(legacy);
  let h = open('?topic=n9', {storage});
  try {
    h.input('#skill-answer', '5');
    h.click('[data-action="hint"]');
    h.click('[data-action="map"]');
    h.click('[data-action="skill"][data-skill="n9-root"]');
    const detour = h.document.querySelector('.skill-detail [data-action="prerequisite"]');
    assert(detour, 'This real skill offers a prerequisite');
    h.click(detour);
    assert.notEqual(h.api.state.topic, 'n9');
    h.click('[data-action="return"]');
    assert.equal(h.api.state.topic, 'n9');
    assert.equal(h.query('#skill-answer').value, '5');
    assert(h.api.taskState(h.api.task()).helpUsed);
    h.select('#skill-topic', 'n11');
  } finally { h.close(); }
  h = open('?topic=n9', {storage});
  try {
    assert.equal(h.query('#skill-answer').value, '5');
    assert(h.api.taskState(h.api.task()).helpUsed);
    h.click('[data-action="check"]');
    assert.equal(h.api.state.feedback.ok, true);
    assert.equal(h.api.progress['n9-q-linear'].independent || 0, 0);
    untouched(storage);
  } finally { h.close(); }
});

test('invalid or managed-context parameters cannot break the page or escape navigation', () => {
  const queries = [
    '?topic=missing&route=missing',
    '?topic=__proto__&route=constructor',
    '?route=family:constructor',
    '?route=task:__proto__',
    '?topic=%3Cimg%20src=x%20onerror=alert(1)%3E&route=javascript%3Aalert(1)',
    '?topic=n9&mode=unknown&map=unknown&learning=1&channel=test&parentOrigin=https://example.invalid&returnTo=https://example.invalid/'
  ];
  for (const query of queries) {
    const storage = new Map(legacy);
    const h = open(query, {storage});
    try {
      assert(topics.includes(h.api.state.topic));
      assert(h.api.task());
      assertNavigation(h, h.api.state.topic);
      const params = new URL(h.window.location.href).searchParams;
      for (const key of params.keys()) assert(['topic', 'route', 'mode', 'map'].includes(key));
      assert(!h.document.querySelector('[onerror]'));
      untouched(storage);
    } finally { h.close(); }
  }
  const saved = new Map(legacy);
  let continued = open('?topic=n6&mode=creative', {storage: saved});
  const previousId = continued.api.task().id;
  continued.close();
  continued = open('?topic=missing&route=constructor', {storage: saved});
  try {
    assert.equal(continued.api.state.topic, 'n6', 'Unknown entry preserves the saved topic');
    assert.equal(continued.api.state.mode, 'creative', 'Unknown entry preserves the saved activity');
    assert.equal(continued.api.task().id, previousId);
    untouched(saved);
  } finally { continued.close(); }
  const h = open('?topic=n9', {storageBlocked: true});
  try {
    h.input('#skill-answer', '5');
    h.click('[data-action="check"]');
    assert.equal(h.api.state.feedback.ok, true);
    assert.match(h.query('.footer').textContent, /Ответы и подсказки доступны в этой открытой вкладке/);
    assertNavigation(h, 'n9');
  } finally { h.close(); }
});

test('a history entry is applied through the same validated topic contract', () => {
  const h = open('?topic=n9');
  try {
    h.input('#skill-answer', '5');
    h.window.history.pushState(null, '', '?topic=n6&map=1');
    h.window.dispatchEvent(new h.window.PopStateEvent('popstate'));
    h.flush();
    assert.equal(h.api.state.topic, 'n6');
    assert.equal(h.api.state.map, true);
    h.window.history.pushState(null, '', '?topic=n9');
    h.window.dispatchEvent(new h.window.PopStateEvent('popstate'));
    h.flush();
    assert.equal(h.api.state.topic, 'n9');
    assert.equal(h.query('#skill-answer').value, '5');
  } finally { h.close(); }
});

test('a successful helped answer resumes with Next without replaying its result', () => {
  const cases = [
    {query: '?topic=n9', answer: '5', route: null},
    {query: '?route=route-exp-n6-errors', answer: '13/6', route: 'route-exp-n6-errors'}
  ];
  for (const scenario of cases) {
    const storage = new Map(legacy);
    let h = open(scenario.query, {storage});
    let taskId, record;
    try {
      h.click('[data-action="hint"]');
      h.input('#skill-answer', scenario.answer);
      h.click('[data-action="check"]');
      taskId = h.api.task().id;
      assert.equal(h.api.state.feedback.ok, true);
      h.query('[data-action="next"]');
      record = plain(h.api.progress[taskId]);
      assert.equal(record.successful, 1);
      assert.equal(record.independent, 0);
    } finally { h.close(); }

    h = open(scenario.query, {storage});
    try {
      assert.equal(h.api.task().id, taskId);
      assert.equal(h.query('#skill-answer').value, scenario.answer);
      assert.equal(h.api.taskState(h.api.task()).helpUsed, true);
      h.query('[data-action="next"]');
      assert.deepEqual(plain(h.api.progress[taskId]), record, 'Restoring a checked answer does not replay its result');
      h.click('[data-action="map"]');
      h.query('[data-action="next"]');
      assert.deepEqual(plain(h.api.progress[taskId]), record, 'Opening the map does not replay the result');
      if (scenario.route) {
        h.click('[data-action="next"]');
        assert.equal(h.api.state.runs[scenario.route].cursor, 1);
        assert.notEqual(h.api.task().id, taskId);
        assert.deepEqual(plain(h.api.progress[taskId]), record, 'Continue uses the existing result');
      } else {
        h.input('#skill-answer', '6');
        assert.equal(h.document.querySelector('[data-action="next"]'), null, 'An edited answer needs a new check');
        h = h.reload();
        assert.equal(h.query('#skill-answer').value, '6');
        assert.equal(h.document.querySelector('[data-action="next"]'), null, 'Reload does not attach an old success to a changed answer');
        assert.deepEqual(plain(h.api.progress[taskId]), record);
      }
      untouched(storage);
    } finally { h.close(); }
  }
});

test('checking, help and map renders preserve a usable focus target', {timeout: 30000}, async () => {
  const h = open('?topic=n9');
  function focusWithin(selectors, label) {
    const focused = h.document.activeElement;
    assert(focused && focused.isConnected && focused !== h.document.body, label + ': focus must not fall back to BODY');
    assert(focused.matches(selectors), label + ': focus stays on the relevant control or task');
  }
  try {
    h.input('#skill-answer', '5');
    const answer = h.query('#skill-answer');
    answer.focus();
    answer.dispatchEvent(new h.window.KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true}));
    h.flush();
    assert.equal(h.api.state.feedback.ok, true);
    focusWithin('#skill-answer, [data-action="check"], [data-action="next"], .task[tabindex], .task-prompt[tabindex]', 'Keyboard check');

    h.query('[data-action="hint"]').focus();
    h.click('[data-action="hint"]');
    focusWithin('[data-action="hint"], .hint[tabindex]', 'Opening help');

    h.query('[data-action="map"]').focus();
    h.click('[data-action="map"]');
    focusWithin('[data-action="map"], .map[tabindex]', 'Opening the optional map');
    h.click('[data-action="map"]');
    focusWithin('[data-action="map"]', 'Closing the optional map');

    const teacher = h.query('details.teacher');
    const toggled = new Promise(resolve => teacher.addEventListener('toggle', resolve, {once: true}));
    h.openDetails('details.teacher');
    // Wait for this native event: a timer does not synchronize JSDOM's task queue.
    await toggled;
    h.flush();
    assert(teacher.isConnected && teacher.open, 'The current teacher overview is open');
    const sameTopic = '.teacher [data-action="topic"][data-topic="n9"]';
    h.query(sameTopic).focus();
    h.click(sameTopic);
    assert.equal(h.api.state.topic, 'n9');
    focusWithin(sameTopic, 'Reopening the same topic from the teacher overview');

    const closingTeacher = h.query('details.teacher');
    let closeToggleDelivered = false;
    closingTeacher.addEventListener('toggle', () => { closeToggleDelivered = true; }, {once: true});
    h.click('details.teacher > summary');
    assert.equal(closingTeacher.open, false, 'Native close changes the visible state immediately');
    h.query('[data-action="hint"]').focus();
    h.click('[data-action="hint"]');
    assert.equal(closeToggleDelivered, false, 'The following action occurs before the queued close event');
    assert.equal(h.query('details.teacher').open, false, 'Rendering does not reopen an overview the user just closed');
    focusWithin('[data-action="hint"]', 'Task action immediately after closing the overview');

    const openingTeacher = h.query('details.teacher');
    let openToggleDelivered = false;
    openingTeacher.addEventListener('toggle', () => { openToggleDelivered = true; }, {once: true});
    h.openDetails('details.teacher');
    assert.equal(openingTeacher.open, true, 'Native open is immediately usable');
    h.query(sameTopic).focus();
    h.click(sameTopic);
    assert.equal(openToggleDelivered, false, 'The topic is selected before the queued open event');
    assert.equal(h.query('details.teacher').open, true, 'A fast same-topic action preserves the opened overview');
    focusWithin(sameTopic, 'Immediate same-topic action before the toggle event');
  } finally { h.close(); }
});

after(() => console.log('OGE_SKILL_COURSE_DOM_CHECKS_COMPLETE'));
