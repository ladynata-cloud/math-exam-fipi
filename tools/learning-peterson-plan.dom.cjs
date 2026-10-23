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

function combinedCabinet(t, { teacher = false, readPlan = async () => structuredClone(plan), legacyHelper = false } = {}) {
  const dom = fixture(source('index.html'), 'https://cabinet.example/learning/#home'), { window } = dom, calls = [];
  const pupil = { id: 'fixture_combined', name: 'Проверочный ученик', login: 'fixture-combined', role: 'student', profile: { course: 'vilenkin6', goal: null, focus: '', version: 1 } };
  window.setInterval = () => 0;
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.eval(source('vilenkin6-course.js'));
  if (legacyHelper) delete window.LearningPreparationUI.planCoursesMarkup;
  const app = source('app.js'), startup = app.lastIndexOf("(async()=>{const revision=authRevision;try{try{const status=await api('/status')");
  assert(startup > 0);
  window.eval(app.slice(0, startup) + `window.fixtureApp={set(person,people=[]){account=person;students=people;assignments=[];attempts=[];authReady=false;},render};})();`);
  window.fetch = async (url, options = {}) => {
    const route = url.replace('/api/learning', ''); calls.push({ route, method: options.method || 'GET' });
    let result;
    if (route === '/plan' || route === '/teacher/students/fixture_combined/plan') result = await readPlan();
    else if (route === '/progress') result = { progress: [{ trainerId: 'vilenkin6-part1', contentId: 'lesson-1', completed: true, latest: { id: 'fixture_saved_work', outcome: 'hinted' } }] };
    else if (route.endsWith('/profile')) result = { profile: pupil.profile };
    else if (route.endsWith('/report')) result = { student: pupil, attempts: [] };
    else throw Error('Unexpected API route ' + route);
    return { ok: true, status: 200, json: async () => result };
  };
  window.fixtureApp.set(teacher ? { id: 'fixture_teacher', role: 'teacher', name: 'Преподаватель' } : pupil, [pupil]);
  t.after(() => window.close());
  return { window, calls, pupil, main: window.document.querySelector('#main'), async go(route) { window.history.replaceState(null, '', '#' + route); await window.fixtureApp.render(); await tick(); } };
}

test('combined Vilenkin profile keeps its 27 saved topics and shows the Peterson reference on home, route and course', async t => {
  const mixedPlan = { ...structuredClone(plan), items: [...plan.items, { catalogId: 'vilenkin6-part1:lesson-2', reason: 'Повтори тему курса.', priority: 'normal' }] };
  const before = JSON.stringify(mixedPlan), f = combinedCabinet(t, { readPlan: async () => structuredClone(mixedPlan) });
  for (const route of ['home', 'route', 'course']) {
    const start = f.calls.length;
    await f.go(route);
    links(f.main);
    const course = f.main.querySelector('[data-vilenkin6-course]'); assert(course, route);
    const all = [...course.querySelectorAll('[data-vilenkin6-open]')];
    assert.equal(new Set(all.map(n => n.dataset.vilenkin6Open)).size, 27, 'All Vilenkin topics remain accessible');
    assert.equal(course.querySelectorAll('[data-vilenkin6-plan] button').length, 1, 'Existing Vilenkin plan filtering remains intact');
    assert.equal(course.querySelector('[data-vilenkin6-plan] p').textContent, mixedPlan.note);
    assert.match(course.querySelector('[data-vilenkin6-progress]').textContent, /Открыто 1 из 27/);
    assert.match(course.querySelector('[data-vilenkin6-status="vilenkin6-part1:lesson-1"]').textContent, /Продолжить сохранённую работу/);
    assert.deepEqual(f.calls.slice(start).map(c => c.route).sort(), ['/plan', '/progress'], 'The linked card reuses the one existing plan read');
    assert.equal(f.pupil.profile.course, 'vilenkin6');
    assert.equal(JSON.stringify(mixedPlan), before);
  }
  assert(f.calls.every(c => c.method === 'GET'), 'Rendering neither starts nor rewrites a managed attempt');
});

test('combined teacher preview retains Vilenkin contents and the pupil-safe Peterson card', async t => {
  const f = combinedCabinet(t, { teacher: true });
  await f.go('preview=fixture_combined');
  links(f.main);
  assert.equal(f.main.querySelectorAll('[data-vilenkin6-preview] ol li').length, 27);
  assert.equal(f.main.querySelector('.route-plan-note').textContent, plan.note);
  assert.equal(f.main.querySelector('.route-plan-note').parentElement.querySelectorAll('ol li').length, 3);
  assert.equal(f.main.querySelectorAll('[data-vilenkin6-open]').length, 0, 'Teacher preview remains read-only');
  assert(f.calls.every(c => c.method === 'GET'));
});

test('a Vilenkin profile without a linked course retains its saved work without a Peterson card', async t => {
  const originalPlan = { ...structuredClone(plan), note: 'Прежние рекомендации по курсу.' };
  const before = JSON.stringify(originalPlan), f = combinedCabinet(t, { readPlan: async () => structuredClone(originalPlan) });
  await f.go('home');
  assert(f.main.querySelector('[data-vilenkin6-course]'));
  assert.equal(f.main.querySelector('[data-plan-course]'), null);
  assert.equal(new Set([...f.main.querySelectorAll('[data-vilenkin6-open]')].map(n => n.dataset.vilenkin6Open)).size, 27);
  assert.equal(f.main.querySelector('[data-vilenkin6-plan] p').textContent, originalPlan.note);
  assert.match(f.main.querySelector('[data-vilenkin6-status="vilenkin6-part1:lesson-1"]').textContent, /Продолжить сохранённую работу/);
  assert.deepEqual(f.calls.map(c => c.route).sort(), ['/plan', '/progress']);
  assert(f.calls.every(c => c.method === 'GET'));
  assert.equal(JSON.stringify(originalPlan), before);
});

test('late Vilenkin plan responses cannot attach a Peterson card to another cabinet view', async t => {
  let resolvePlan;
  const waiting = new Promise(resolve => { resolvePlan = resolve; });
  const f = combinedCabinet(t, { readPlan: () => waiting });
  await f.go('home');
  assert(f.main.querySelector('[data-vilenkin6-course]'));
  await f.go('assignments');
  const nextView = f.main.innerHTML;
  resolvePlan(structuredClone(plan)); await tick();
  assert.equal(f.main.innerHTML, nextView);
  assert.equal(f.main.querySelector('[data-plan-course]'), null);
});

test('cached older linked-course helper does not block Vilenkin saved work', async t => {
  const f = combinedCabinet(t, { legacyHelper: true });
  await f.go('home');
  assert(f.main.querySelector('[data-vilenkin6-course]'));
  assert.equal(f.main.querySelector('[data-plan-course]'), null);
  assert.equal(f.main.querySelector('[data-vilenkin6-plan] p').textContent, plan.note);
  assert.match(f.main.querySelector('[data-vilenkin6-progress]').textContent, /Открыто 1 из 27/);
  assert(f.calls.every(c => c.method === 'GET'));
});
