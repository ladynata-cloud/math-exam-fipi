'use strict';

// In-memory DOM only. All accounts and API responses are synthetic; no server
// writes, production-room creation or real learner login is involved.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const catalog = require('../learning/catalog');
const map = require('../learning/preparation-map');
const source = name => fs.readFileSync(path.join(ROOT, 'learning', name), 'utf8');
const COURSE = 'https://mathexam.space/school/peterson6/';
const BOARD = 'https://mathexam.space/trainers/trainer-board.html?trainer=%2Fschool%2Fpeterson6%2F';
const plan = { items: [
  { catalogId: 'path:practice-river', reason: 'Объясни скорости на реке.', priority: 'high' },
  { catalogId: 'path:practice-time', reason: 'Повтори часы и минуты.', priority: 'normal' },
  { catalogId: 'path:practice-meeting', reason: 'Проверь скорость сближения.', priority: 'normal' }
], note: `Прежние рекомендации сохранены. <b>Это текст</b>\nНовый курс: ${COURSE}\nВыбирай тему и тренируй вычисления.` };
const tick = () => new Promise(resolve => setImmediate(resolve));
const snapshot = JSON.stringify(plan);
function fixture(html = '<main></main>', url = 'https://cabinet.example/learning/') {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  dom.window.LearningCatalog = catalog;
  dom.window.LearningPreparation = map;
  dom.window.eval(source('preparation.js'));
  return dom;
}
function links(host, teacher = false) {
  const cards = host.querySelectorAll('[data-plan-course="peterson6"]');
  assert.equal(cards.length, 1, 'Exactly one assigned-course card');
  const card = cards[0], anchors = [...card.querySelectorAll('a')];
  assert.deepEqual(anchors.map(a => a.href), [COURSE, COURSE + '#skills', ...(teacher ? [BOARD] : [])]);
  for (const a of anchors) {
    assert.equal(a.target, '_blank');
    assert.equal(a.rel, 'noopener noreferrer');
    assert(!a.hasAttribute('onclick'));
    assert(!a.hasAttribute('data-prep-start'));
    assert(!a.hasAttribute('data-route-item'));
  }
  assert.match(card.textContent, /не входят в итоги кабинета/);
  assert.match(card.textContent, /не считается самостоятельным решением/);
  if (!teacher) {
    assert.equal(card.querySelector('[data-plan-course-board]'), null, 'A pupil is not sent to a new teacher room');
    assert.match(card.textContent, /ссылку доски от преподавателя/);
  }
  return card;
}

test('only the exact canonical course in a saved note exposes one fixed course card', () => {
  const dom = fixture();
  try {
    const { window } = dom, host = window.document.querySelector('main');
    host.innerHTML = window.LearningPreparationUI.planCoursesMarkup(`План <img src=x onerror=alert(1)> (${COURSE}).\n${COURSE}!`);
    links(host);
    assert.equal(host.querySelectorAll('img,script,[onerror]').length, 0);
    host.innerHTML = window.LearningPreparationUI.planCoursesMarkup(COURSE, { teacher: true });
    links(host, true);
    assert.match(host.textContent, /создайте комнату/);
    assert.equal(catalog.items.some(item => item.trainerId === 'peterson6'), false, 'The public course is not an unsupported managed attempt');
  } finally { dom.window.close(); }
});

test('unrecognized, deceptive and parameterized URLs never create a course assignment', () => {
  const dom = fixture();
  try {
    const render = dom.window.LearningPreparationUI.planCoursesMarkup;
    const unsafe = ['', null, undefined, 'Повтори дроби.', 'Петерсон, 6 класс',
      COURSE + '?next=https://evil.test/', COURSE + '#skills', COURSE + 'other/',
      'http://mathexam.space/school/peterson6/', 'https://mathexam.space.evil.test/school/peterson6/',
      'https://mathexam.space@evil.test/school/peterson6/', 'https://evil.test/?next=' + COURSE,
      'javascript:alert(1)', '<script>alert(1)</script>'];
    for (const value of unsafe) assert.equal(render(value), '', String(value));
  } finally { dom.window.close(); }
});

test('student home and route retain the three previous managed recommendations and never create work for course links', async () => {
  for (const page of ['home', 'route']) {
    const dom = fixture(), { window } = dom, host = window.document.querySelector('main');
    const calls = [], opened = [];
    try {
      window.LearningPreparationUI.mountRoute(host, {
        account: { id: 'fixture', role: 'student' }, profile: { course: 'foundations', goal: null, focus: '' },
        page, catalog, labels: {}, attempts: [], assignments: [],
        api: async route => {
          calls.push(route);
          if (route === '/plan') return structuredClone(plan);
          if (route === '/progress') return { progress: [] };
          return { totalPoints: 0, pointsWithinLevel: 0, level: 1, nextLevelAt: 100, uniqueCompleted: 0, badges: [] };
        },
        openContent: async (...args) => opened.push(args)
      });
      await tick();
      const card = links(host);
      assert.deepEqual([...host.querySelectorAll('.prep-route-step')].map(n => n.dataset.prepItem), plan.items.map(i => i.catalogId));
      assert.equal(host.querySelector('.prep-route-note').textContent, plan.note, 'The existing note is unchanged and escaped');
      assert.equal(host.querySelector('.prep-route-note b'), null);
      for (const a of card.querySelectorAll('a')) { a.addEventListener('click', e => e.preventDefault()); a.click(); }
      assert.deepEqual(calls.sort(), ['/plan', '/progress', '/rewards']);
      assert.deepEqual(opened, [], 'A course reference never starts or completes a managed attempt');
      assert.equal(JSON.stringify(plan), snapshot);
    } finally { dom.window.close(); }
  }
});

test('a different learner plan without the URL receives no Peterson card', async () => {
  const dom = fixture(), { window } = dom, host = window.document.querySelector('main');
  try {
    window.LearningPreparationUI.mountRoute(host, {
      account: { id: 'other-fixture', role: 'student' }, profile: { course: 'foundations', goal: null, focus: '' },
      page: 'home', catalog, labels: {}, attempts: [], assignments: [], openContent: () => assert.fail('No work expected'),
      api: async route => route === '/plan' ? { items: plan.items, note: 'Прежний план' } : route === '/progress' ? { progress: [] } : { totalPoints: 0, pointsWithinLevel: 0, level: 1, nextLevelAt: 100, uniqueCompleted: 0, badges: [] }
    });
    await tick();
    assert.equal(host.querySelector('[data-plan-course]'), null);
    assert.equal(host.querySelectorAll('.prep-route-step').length, 3);
  } finally { dom.window.close(); }
});

test('teacher student card shows the board link without changing saved notes, recommendations or attempts', async () => {
  const dom = fixture(), { window } = dom, host = window.document.querySelector('main'), calls = [];
  const student = { id: 'fixture', name: 'Проверочный ученик', login: 'fixture-pupil', passwordReady: true };
  try {
    window.eval(source('teaching.js'));
    const responses = {
      '/teacher/students/fixture/report': { student, attempts: [], counts: {}, assignments: [] },
      '/teacher/students/fixture/plan': plan,
      '/teacher/students/fixture/ai-drafts': { drafts: [] },
      '/teacher/students/fixture/profile': { profile: { course: 'foundations', goal: null, focus: '', version: 0 } },
      '/teacher/students/fixture/parent-access': { parentAccess: { exists: false } }
    };
    window.LearningTeaching.mount(host, {
      page: 'student', id: 'fixture', students: [student], catalog,
      api: async (route, options = {}) => {
        calls.push({ route, method: options.method || 'GET' });
        assert(Object.hasOwn(responses, route), route); return structuredClone(responses[route]);
      },
      account: { id: 'fixture-teacher', role: 'teacher' }, navigate: () => assert.fail('No navigation expected')
    });
    for (let i = 0; i < 8 && !host.querySelector('#teaching-plan'); i++) await tick();
    links(host, true);
    assert.equal(host.querySelector('#teaching-plan [name="note"]').value, plan.note);
    assert.deepEqual([...host.querySelectorAll('[data-plan-row] [name="catalogId"]')].map(n => n.value), plan.items.map(i => i.catalogId));
    assert(calls.every(c => c.method === 'GET'));
    assert.equal(JSON.stringify(plan), snapshot);
  } finally { dom.window.close(); }
});

test('actual teacher preview exposes the same pupil course card and preserves inert fallback with older helper', async () => {
  for (const legacyHelper of [false, true]) {
    const dom = fixture(source('index.html'), 'https://cabinet.example/learning/?role=teacher#preview=fixture');
    const { window } = dom, calls = [];
    const teacher = { id: 'fixture-teacher', name: 'Преподаватель', login: 'fixture-teacher', role: 'teacher' };
    const profile = { course: 'foundations', goal: null, focus: '', version: 1 };
    const student = { id: 'fixture', name: 'Проверочный ученик', login: 'fixture-pupil', role: 'student', profile };
    window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
    window.fetch = async (url, options = {}) => {
      const route = url.replace('/api/learning', ''); calls.push({ route, method: options.method || 'GET' });
      const responses = {
        '/status': {}, '/session': { account: teacher }, '/attempts': { attempts: [] }, '/assignments': { assignments: [] }, '/lessons': { lessons: [] },
        '/teacher/students': { students: [student] }, '/teacher/students/fixture/report': { student, attempts: [] },
        '/teacher/students/fixture/profile': { profile }, '/teacher/students/fixture/plan': plan
      };
      assert(Object.hasOwn(responses, route), 'Unexpected API route ' + route);
      return { ok: true, status: 200, json: async () => structuredClone(responses[route]) };
    };
    try {
      if (legacyHelper) delete window.LearningPreparationUI.planCoursesMarkup;
      window.eval(source('app.js'));
      for (let i = 0; i < 12 && !window.document.querySelector('.preview-banner'); i++) await tick();
      const main = window.document.querySelector('#main');
      assert(main.querySelector('.preview-banner'));
      if (legacyHelper) assert.equal(main.querySelector('[data-plan-course]'), null);
      else links(main);
      assert.equal(main.querySelector('.route-plan-note').textContent, plan.note);
      assert.equal(main.querySelector('.route-plan-note b'), null);
      assert.equal(main.querySelectorAll('ol li').length, 3);
      assert.equal(main.querySelectorAll('[data-prep-start]').length, 0);
      assert(calls.every(c => c.method === 'GET'));
      assert.equal(JSON.stringify(plan), snapshot);
    } finally { dom.window.close(); }
  }
});
