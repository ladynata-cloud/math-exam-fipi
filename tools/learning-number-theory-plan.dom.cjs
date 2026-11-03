'use strict';

// Synthetic accounts and in-memory DOM only. This gate never writes a pupil
// record, creates a production room or changes the managed learning catalog.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const catalog = require('../learning/catalog');
const map = require('../learning/preparation-map');
const source = name => fs.readFileSync(path.join(ROOT, 'learning', name), 'utf8');
const trainers = ['grade6-nok', 'grade6-nod'];
const href = id => 'https://mathexam.space/trainers/' + id + '.html';
const board = id => 'https://mathexam.space/trainers/trainer-board.html?trainer=' + encodeURIComponent('/trainers/' + id + '.html');
const plan = {
  items: [{ catalogId: 'vilenkin6-part1:lesson-2', reason: 'Повтори текущую тему.', priority: 'normal' }],
  note: 'Прежние рекомендации. <b>Обычный текст</b>\n' + trainers.map(href).join('\n')
};
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture(html = '<main></main>') {
  const dom = new JSDOM(html, { url: 'https://cabinet.example/learning/#home', runScripts: 'outside-only' });
  dom.window.LearningCatalog = catalog;
  dom.window.LearningPreparation = map;
  dom.window.eval(source('attached-course.js'));
  dom.window.eval(source('preparation.js'));
  return dom;
}

function checkCards(host, { teacher = false, expected = trainers } = {}) {
  const cards = [...host.querySelectorAll('[data-plan-course^="grade6-"]')];
  assert.deepEqual(cards.map(card => card.dataset.planCourse), expected);
  for (const card of cards) {
    const id = card.dataset.planCourse, links = [...card.querySelectorAll('a')];
    assert.deepEqual(links.map(a => a.href), [href(id), ...(teacher ? [board(id)] : [])]);
    assert.match(card.textContent, /Разложи числа на простые множители/);
    assert.match(card.textContent, /по шагам/);
    assert.match(card.textContent, /самостоятельно/);
    assert.doesNotMatch(card.textContent, /сохраня|балл|зачёт|прогресс кабинета/);
    assert.equal(card.querySelectorAll('[data-prep-start],[data-vilenkin6-open],button').length, 0);
    for (const a of links) {
      assert.equal(a.target, '_blank');
      assert.equal(a.rel, 'noopener noreferrer');
      assert.equal(a.hasAttribute('onclick'), false);
    }
    if (!teacher) assert.equal(card.querySelector('[data-plan-course-board]'), null);
  }
}

test('each exact canonical URL creates one fixed card; repeated URLs and note HTML do not duplicate or inject', t => {
  const dom = fixture(); t.after(() => dom.window.close());
  const host = dom.window.document.querySelector('main');
  const render = dom.window.LearningPreparationUI.planCoursesMarkup;
  for (const teacher of [false, true]) {
    host.innerHTML = render(plan.note + '\n(' + href('grade6-nok') + '). <img src=x onerror=alert(1)>', { teacher });
    checkCards(host, { teacher });
    assert.equal(host.querySelectorAll('img,script,[onerror]').length, 0);
    for (const id of trainers) {
      host.innerHTML = render(href(id), { teacher });
      checkCards(host, { teacher, expected: [id] });
    }
  }
});

test('lookalikes, query/hash variants and absent references create no number-theory cards', t => {
  const dom = fixture(); t.after(() => dom.window.close());
  const render = dom.window.LearningPreparationUI.planCoursesMarkup;
  const unsafe = ['', null, undefined, 'НОК и НОД', 'javascript:alert(1)', '<script>alert(1)</script>'];
  for (const id of trainers) unsafe.push(
    href(id) + '?next=https://evil.example/', href(id) + '#solution', href(id) + '/extra',
    href(id).replace('https:', 'http:'), href(id).replace('mathexam.space', 'mathexam.space.evil.example'),
    href(id).replace('mathexam.space', 'mathexam.space@evil.example'),
    'https://evil.example/?next=' + href(id), href(id).replace('/trainers/', '/trainers/../trainers/'),
    href(id).replace('/trainers/', '/%74rainers/')
  );
  for (const note of unsafe) assert.equal(render(note), '', String(note));
});

test('number-theory references coexist with the unchanged Peterson card and stay out of managed attempts', t => {
  const dom = fixture(); t.after(() => dom.window.close());
  const host = dom.window.document.querySelector('main');
  host.innerHTML = dom.window.LearningPreparationUI.planCoursesMarkup(plan.note + '\nhttps://mathexam.space/school/peterson6/', { teacher: true });
  checkCards(host, { teacher: true });
  const peterson = host.querySelector('[data-plan-course="peterson6"]');
  assert(peterson);
  assert.equal(peterson.querySelectorAll('a').length, 3);
  assert.match(peterson.textContent, /не входят в итоги кабинета/);
  assert.equal(catalog.items.filter(item => item.trainerId !== 'vilenkin6-textbook').length, 378);
  assert.equal(catalog.items.filter(item => item.trainerId === 'vilenkin6-part1').length, 27);
  assert.equal(catalog.items.some(item => trainers.includes(item.trainerId)), false);
});

function cabinet(t, { teacher = false, readPlan = async () => structuredClone(plan) } = {}) {
  const dom = fixture(source('index.html')), { window } = dom, calls = [];
  const pupil = { id: 'fixture_number_theory', name: 'Проверочный ученик', login: 'fixture-number-theory', role: 'student', profile: { course: 'vilenkin6', goal: null, focus: '', version: 1 } };
  window.setInterval = () => 0;
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.eval(source('vilenkin6-course.js'));
  const app = source('app.js'), startup = app.lastIndexOf("(async()=>{const revision=authRevision;try{try{const status=await api('/status')");
  assert(startup > 0);
  window.eval(app.slice(0, startup) + 'window.fixtureApp={set(person,people=[]){account=person;students=people;assignments=[];attempts=[];authReady=false;},render};})();');
  window.fetch = async (url, options = {}) => {
    const route = url.replace('/api/learning', ''); calls.push({ route, method: options.method || 'GET' });
    let result;
    if (route === '/plan' || route === '/teacher/students/' + pupil.id + '/plan') result = await readPlan();
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

test('Vilenkin pupil home, route and course show both trainers while preserving all 27 topics and saved work', async t => {
  const before = JSON.stringify(plan), f = cabinet(t);
  for (const route of ['home', 'route', 'course']) {
    const start = f.calls.length;
    await f.go(route);
    checkCards(f.main);
    const course = f.main.querySelector('[data-vilenkin6-course]'); assert(course, route);
    assert.equal(new Set([...course.querySelectorAll('[data-vilenkin6-open]')].map(n => n.dataset.vilenkin6Open)).size, 27);
    assert.equal(course.querySelectorAll('[data-vilenkin6-plan] button').length, 1);
    assert.equal(course.querySelector('[data-vilenkin6-plan] p').textContent, plan.note);
    assert.equal(course.querySelector('[data-vilenkin6-plan] b'), null);
    assert.match(course.querySelector('[data-vilenkin6-status="vilenkin6-part1:lesson-1"]').textContent, /Продолжить сохранённую работу/);
    assert.deepEqual(f.calls.slice(start).map(c => c.route).sort(), ['/plan', '/progress']);
    assert.equal(f.pupil.profile.course, 'vilenkin6');
    assert.equal(JSON.stringify(plan), before);
  }
  assert(f.calls.every(c => c.method === 'GET'));
});

test('teacher preview is pupil-safe and unrelated plans receive no new cards', async t => {
  const f = cabinet(t, { teacher: true });
  await f.go('preview=' + f.pupil.id);
  checkCards(f.main);
  assert.equal(f.main.querySelectorAll('[data-vilenkin6-preview] ol li').length, 27);
  assert.equal(f.main.querySelector('.route-plan-note').textContent, plan.note);
  assert.equal(f.main.querySelectorAll('[data-vilenkin6-open]').length, 0);
  assert(f.calls.every(c => c.method === 'GET'));
  const unrelated = cabinet(t, { readPlan: async () => ({ ...structuredClone(plan), note: 'Сохранённый прежний план.' }) });
  await unrelated.go('home');
  checkCards(unrelated.main, { expected: [] });
  assert.equal(new Set([...unrelated.main.querySelectorAll('[data-vilenkin6-open]')].map(n => n.dataset.vilenkin6Open)).size, 27);
});

test('late plan response cannot add cards after leaving the pupil course', async t => {
  let resolvePlan;
  const pending = new Promise(resolve => { resolvePlan = resolve; });
  const f = cabinet(t, { readPlan: () => pending });
  await f.go('home');
  await f.go('assignments');
  const previous = f.main.innerHTML;
  resolvePlan(structuredClone(plan)); await tick();
  assert.equal(f.main.innerHTML, previous);
  checkCards(f.main, { expected: [] });
});

test('teacher pupil page exposes board links while retaining the exact saved plan and read-only loading', async t => {
  const dom = fixture(); t.after(() => dom.window.close());
  const { window } = dom, host = window.document.querySelector('main'), calls = [];
  const pupil = { id: 'fixture', name: 'Проверочный ученик', login: 'fixture-pupil', passwordReady: true };
  window.eval(source('teaching.js'));
  const responses = {
    '/teacher/students/fixture/report': { student: pupil, attempts: [], counts: {}, assignments: [] },
    '/teacher/students/fixture/plan': plan,
    '/teacher/students/fixture/ai-drafts': { drafts: [] },
    '/teacher/students/fixture/profile': { profile: { course: 'vilenkin6', goal: null, focus: '', version: 1 } },
    '/teacher/students/fixture/parent-access': { parentAccess: { exists: false } }
  };
  window.LearningTeaching.mount(host, {
    page: 'student', id: 'fixture', students: [pupil], catalog,
    api: async (route, options = {}) => {
      calls.push({ route, method: options.method || 'GET' });
      assert(Object.hasOwn(responses, route), route); return structuredClone(responses[route]);
    },
    account: { id: 'fixture-teacher', role: 'teacher' }, navigate: () => assert.fail('No navigation expected')
  });
  for (let i = 0; i < 8 && !host.querySelector('#teaching-plan'); i++) await tick();
  checkCards(host, { teacher: true });
  assert.equal(host.querySelector('#teaching-plan [name="note"]').value, plan.note);
  assert.deepEqual([...host.querySelectorAll('[data-plan-row] [name="catalogId"]')].map(n => n.value), plan.items.map(item => item.catalogId));
  assert.equal(host.querySelector('#teaching-profile [name="course"]').value, 'vilenkin6');
  assert(calls.every(c => c.method === 'GET'));
});
