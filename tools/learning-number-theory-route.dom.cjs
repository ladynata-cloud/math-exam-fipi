'use strict';

// Synthetic accounts and mocked HTTP only. No live learner or credential data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, 'learning', name), 'utf8');
const attached = require('../learning/attached-course');
const catalog = require('../learning/catalog');
const map = require('../learning/preparation-map');
const MARKER = 'Индивидуальный маршрут: только НОК и НОД.';
const COMMENT = 'Сначала выпиши множители.\nСохрани <b>свой разбор</b>.';
const IDS = ['grade6-nok', 'grade6-nod'];
const url = id => 'https://mathexam.space/trainers/' + id + '.html';
const wait = () => new Promise(resolve => setImmediate(resolve));
async function settle() { for (let i = 0; i < 30; i++) await wait(); }

test('only the exact standalone marker opts in; ordinary comments and trainer URLs do not', () => {
  for (const focus of [MARKER, COMMENT + '\n' + MARKER, MARKER + '\n' + COMMENT, 'Разбор\r\n' + MARKER]) {
    const profile = Object.freeze({ course: 'vilenkin6', focus });
    assert.equal(attached.numberTheoryOnly(profile), true);
    assert.equal(attached.selected(profile).id, 'grade6-number-theory-only');
    assert.equal(profile.focus, focus);
    assert(!attached.focusComment(focus).includes(MARKER));
  }
  for (const focus of ['', null, undefined, IDS.map(url).join('\n'), 'Ссылка: ' + MARKER,
    MARKER + ' пояснение', ' ' + MARKER, MARKER + ' ', MARKER.toLowerCase(), MARKER.slice(0, -1),
    '<p>' + MARKER + '</p>', '«' + MARKER + '»']) {
    assert.equal(attached.numberTheoryOnly({ focus }), false, String(focus));
  }
  assert.equal(attached.focusComment('Прежний\r\nкомментарий'), 'Прежний\r\nкомментарий');
  const enabled = attached.withNumberTheoryOnly(COMMENT, true);
  assert.equal(enabled, COMMENT + '\n' + MARKER);
  assert.equal(attached.withNumberTheoryOnly(enabled, true), enabled);
  assert.equal(attached.withNumberTheoryOnly(enabled, false), COMMENT);
  assert(attached.withNumberTheoryOnly('x'.repeat(1200), true).length > 1200, 'helper never silently truncates');
});

async function fixture(t, { role = 'student', route = 'home', focus = COMMENT + '\n' + MARKER,
  course = 'vilenkin6', allowSave = false, onSave } = {}) {
  const dom = new JSDOM(read('index.html'), {
    url: 'https://cabinet.example/learning/?role=' + role + '#' + route,
    runScripts: 'outside-only'
  });
  t.after(() => dom.window.close());
  const { window } = dom, calls = [], errors = [];
  const profile = { course, goal: null, focus, version: 4, updatedAt: 1800000000000 };
  const pupil = { id: 'fixture-pupil', role: 'student', name: 'Проверочный ученик', login: 'fixture-pupil', profile, passwordReady: true };
  const peer = { id: 'fixture-peer', role: 'student', name: 'Другой ученик', login: 'fixture-peer', profile: { course: 'vilenkin6', goal: null, focus: 'Продолжай свою тему.', version: 1 } };
  const teacher = { id: 'fixture-teacher', role: 'teacher', name: 'Преподаватель', login: 'fixture-teacher' };
  const saved = { id: 'fixture-work', learnerId: pupil.id, trainerId: 'vilenkin6-part1', contentId: 'lesson-1', outcome: 'hinted', updatedAt: '2026-01-01T00:00:00Z', title: 'Сохранённая работа' };
  const attempts = [saved, { ...saved, id: 'peer-work', learnerId: peer.id }];
  const assignments = [{ id: 'fixture-assignment', learnerId: pupil.id, attemptId: saved.id, title: 'Прежнее задание', status: 'published', attempt: saved }];
  const lessons = [{ id: 'fixture-lesson', title: 'Прежнее занятие', createdAt: 1800000000000, seats: [] }];
  const plan = { items: [{ catalogId: 'vilenkin6-part1:lesson-2', reason: 'Сохранённая рекомендация', priority: 'normal' }],
    note: 'Сохранённый комментарий к плану.\n' + IDS.map(url).join('\n') + '\nhttps://mathexam.space/school/peterson6/' };
  const retained = () => JSON.stringify({ attempts, assignments, lessons, plan, peer });
  const before = retained();
  window.setInterval = () => 0;
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.addEventListener('error', event => errors.push(event.error || event.message));
  window.LearningCatalog = catalog;
  window.LearningPreparation = map;
  window.LearningRoute = { mount(host) { host.innerHTML = '<h1 data-school-route>Школьный маршрут</h1>'; return () => {}; } };
  window.LearningDivisionCourse = {
    entry: () => '<section data-division-entry>Повторение деления</section>',
    mount(host) { host.innerHTML = '<h1 data-division-course>Умножение и деление</h1>'; return () => {}; }
  };
  window.LearningExam = { mount(host) { host.innerHTML = '<h1 data-exam-route>Проверочная работа</h1>'; return () => {}; } };
  window.MathExamWelcome = { cleanup() {}, maybeOpen() { calls.push({ route: 'welcome', method: 'VIEW' }); } };
  window.fetch = async (target, options = {}) => {
    const route = String(target).replace('/api/learning', ''), method = options.method || 'GET';
    const call = { route, method, ...(options.body ? { body: JSON.parse(options.body) } : {}) }; calls.push(call);
    const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => structuredClone(data) });
    if (method !== 'GET') {
      assert(allowSave && route === '/teacher/students/fixture-pupil/profile' && method === 'POST', 'Unexpected mutation');
      assert.deepEqual(Object.keys(call.body).sort(), ['course', 'expectedVersion', 'focus', 'goal', 'opId']);
      assert.equal(typeof call.body.opId, 'string');
      const override = await onSave?.({ body: call.body, profile, calls });
      if (override) return response(override.data, override.status);
      if (call.body.expectedVersion !== profile.version) return response({ error: 'LEARNING_PROFILE_CONFLICT' }, 409);
      assert(call.body.focus.length <= 1200);
      Object.assign(profile, { course: call.body.course, goal: call.body.goal, focus: call.body.focus.trim(), version: profile.version + 1 });
      return response({ profile });
    }
    const values = {
      '/status': {}, '/session': { account: role === 'teacher' ? teacher : pupil }, '/profile': { profile },
      '/attempts': { attempts }, '/assignments': { assignments }, '/lessons': { lessons },
      '/teacher/students': { students: [pupil, peer] }, '/plan': plan, '/progress': { progress: [] },
      '/teacher/students/fixture-pupil/report': { student: pupil, attempts, assignments, counts: {} },
      '/teacher/students/fixture-pupil/profile': { profile }, '/teacher/students/fixture-pupil/plan': plan,
      '/teacher/students/fixture-pupil/ai-drafts': { drafts: [] },
      '/teacher/students/fixture-pupil/parent-access': { parentAccess: { exists: false } }
    };
    assert(Object.hasOwn(values, route), 'Unexpected read ' + route);
    return response(values[route]);
  };
  for (const file of ['attached-course.js', 'preparation.js', 'vilenkin6-course.js', 'teaching.js', 'app.js']) window.eval(read(file));
  await settle();
  const main = window.document.getElementById('main');
  return { window, main, profile, pupil, peer, plan, calls, errors, retained, before,
    async go(route) { window.LearningApp.navigate(route); await new Promise(resolve => setTimeout(resolve, 5)); await settle(); },
    async submit() { main.querySelector('#teaching-profile').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); await settle(); }
  };
}

function checkPair(host, teacher = false) {
  const cards = [...host.querySelectorAll('[data-plan-course]')];
  assert.deepEqual(cards.map(card => card.dataset.planCourse), IDS);
  assert.equal(host.querySelectorAll('[data-number-theory-only]').length, 1);
  assert.equal(host.querySelectorAll('[data-plan-course-open]').length, 2);
  assert.equal(host.querySelectorAll('[data-plan-course-board]').length, teacher ? 2 : 0);
  for (const [index, card] of cards.entries()) {
    assert.equal(card.querySelector('[data-plan-course-open]').href, url(IDS[index]));
    if (teacher) {
      const board = new URL(card.querySelector('[data-plan-course-board]').href);
      assert.equal(board.origin, 'https://mathexam.space');
      assert.equal(board.pathname, '/trainers/trainer-board.html');
      assert.deepEqual([...board.searchParams], [['trainer', '/trainers/' + IDS[index] + '.html']]);
    }
  }
  assert.match(host.querySelector('[data-number-theory-room]').textContent, /ссылку комнаты/);
  assert.equal(host.querySelectorAll('[data-vilenkin6-course],[data-vilenkin6-preview],[data-school-route],[data-division-entry],[data-division-course],[data-exam-route],#catalog-grid').length, 0);
  assert(!host.textContent.includes(MARKER));
}

test('learner home, route and course contain exactly the pair; navigation preserves existing work without other recommendations', async t => {
  const f = await fixture(t);
  for (const route of ['home', 'route', 'course']) {
    await f.go(route); checkPair(f.main);
    assert(f.main.textContent.includes(COMMENT));
    assert.equal(f.main.querySelectorAll('b,img,[onerror]').length, 0, 'comment is text');
    assert.equal(f.main.querySelector('[data-attached-prior-work]'), null);
    assert.deepEqual([...f.window.document.querySelectorAll('#navigation a')].map(a => a.dataset.nav), ['home', 'assignments', 'history', 'lessons']);
    assert.equal(f.window.document.querySelector('.site-link').hidden, true);
    assert.equal(f.profile.course, 'vilenkin6');
    assert.equal(f.retained(), f.before);
  }
  assert(f.calls.every(call => call.method === 'GET'));
  assert.equal(f.calls.some(call => call.route === '/plan'), false, 'the fixed pair does not read or alter the saved plan');
  assert.deepEqual(f.errors, []);
});

test('stale learning and catalog URLs cannot restore a different recommended course', async t => {
  const f = await fixture(t);
  for (const route of ['course=ege', 'course=school', 'course=vilenkin6', 'division-course', 'repeat', 'exam', 'diagnostic',
    'learn=old-topic', 'practice=vilenkin6-part1%3Alesson-1', 'route&topic=fractions']) {
    await f.go(route); checkPair(f.main);
    assert.equal(f.window.location.hash, '#home', route);
  }
  assert.equal(f.retained(), f.before);
  assert(f.calls.every(call => call.method === 'GET'));
});

test('saved work, assignments and lessons remain available as existing records without creating attempts', async t => {
  const f = await fixture(t);
  await f.go('history');
  assert(f.main.querySelector('a[href="#attempt=fixture-work"]'));
  assert.equal(f.main.querySelector('a[href="#attempt=peer-work"]'), null);
  assert.equal(f.main.querySelector('[data-repeat]'), null);
  await f.go('assignments'); assert(f.main.querySelector('a[href="#assignment=fixture-assignment"]'));
  await f.go('lessons'); assert(f.main.querySelector('a[href="#lesson=fixture-lesson"]'));
  await f.go('home'); checkPair(f.main);
  assert.equal(f.retained(), f.before);
  assert(f.calls.every(call => call.method === 'GET'));
});

test('teacher preview matches the learner pair; the teacher student card has board links and no duplicate plan cards', async t => {
  const f = await fixture(t, { role: 'teacher', route: 'preview=fixture-pupil' });
  checkPair(f.main);
  assert(f.main.querySelector('.preview-banner'));
  await f.go('student=fixture-pupil'); checkPair(f.main, true);
  const form = f.main.querySelector('#teaching-profile');
  assert.equal(form.elements.routeMode.value, 'number-theory-only');
  assert.equal(form.elements.focus.value, COMMENT);
  assert.equal(form.elements.course.value, 'vilenkin6');
  assert.equal(f.main.querySelector('[data-plan-course-links]').innerHTML, '');
  assert.equal(f.main.querySelector('#teaching-plan [name=note]').value, f.plan.note);
  assert.equal(f.retained(), f.before);
  assert(f.calls.every(call => call.method === 'GET'));
});

test('the setting uses only the existing profile fields, preserves the comment and course, and reverses cleanly', async t => {
  const f = await fixture(t, { role: 'teacher', route: 'student=fixture-pupil', focus: COMMENT, allowSave: true });
  const form = f.main.querySelector('#teaching-profile');
  assert.equal(form.elements.routeMode.value, 'ordinary');
  form.elements.routeMode.value = 'number-theory-only'; await f.submit();
  checkPair(f.main, true);
  assert.equal(f.profile.focus, COMMENT + '\n' + MARKER);
  assert.equal(form.elements.focus.value, COMMENT);
  assert.equal(f.profile.course, 'vilenkin6');
  form.elements.routeMode.value = 'ordinary'; await f.submit();
  assert.equal(f.profile.focus, COMMENT);
  assert.equal(f.profile.version, 6);
  assert.equal(f.main.querySelector('[data-number-theory-only]'), null);
  const writes = f.calls.filter(call => call.method === 'POST');
  assert.deepEqual(writes.map(call => call.body.expectedVersion), [4, 5]);
  assert.notEqual(writes[0].body.opId, writes[1].body.opId);
  assert.equal(f.retained(), f.before);
});

test('the full serialized focus length is checked without truncation; the exact 1200-character boundary saves', async t => {
  const f = await fixture(t, { role: 'teacher', route: 'student=fixture-pupil', focus: 'Прежний комментарий', allowSave: true });
  const form = f.main.querySelector('#teaching-profile'), oversized = 'x'.repeat(1200);
  form.elements.routeMode.value = 'number-theory-only'; form.elements.focus.value = oversized;
  await f.submit();
  assert.equal(f.calls.filter(call => call.method === 'POST').length, 0);
  assert.equal(form.elements.focus.value, oversized);
  assert.match(form.querySelector('.form-error').textContent, /1200/);
  assert.equal(form.querySelector('[type=submit]').disabled, false);
  const boundary = 'x'.repeat(1200 - MARKER.length - 1);
  form.elements.focus.value = boundary; await f.submit();
  assert.equal(f.profile.focus.length, 1200);
  assert.equal(form.elements.focus.value, boundary);
  assert.equal(f.retained(), f.before);
});

test('optimistic conflict keeps the draft mode and comment, then uses the refreshed version only after an explicit save', async t => {
  let conflict = true;
  const f = await fixture(t, { role: 'teacher', route: 'student=fixture-pupil', focus: COMMENT, allowSave: true,
    onSave({ profile }) {
      if (!conflict) return;
      conflict = false; profile.focus = 'Комментарий из другого окна.\n' + MARKER; profile.version = 8;
      return { status: 409, data: { error: 'LEARNING_PROFILE_CONFLICT' } };
    }
  });
  const form = f.main.querySelector('#teaching-profile');
  form.elements.focus.value = 'Мой несохранённый комментарий.';
  form.elements.routeMode.value = 'ordinary'; await f.submit();
  assert.equal(form.querySelector('[type=submit]').disabled, true);
  assert.equal(form.elements.focus.value, 'Мой несохранённый комментарий.');
  form.querySelector('[data-profile-refresh]').click(); await settle();
  checkPair(f.main, true);
  assert.equal(form.elements.routeMode.value, 'ordinary');
  assert.equal(form.elements.focus.value, 'Мой несохранённый комментарий.');
  assert.match(form.querySelector('[data-profile-conflict]').textContent, /Только НОК и НОД/);
  assert(!form.querySelector('[data-profile-conflict]').textContent.includes(MARKER));
  assert.equal(f.calls.filter(call => call.method === 'POST').length, 1);
  await f.submit();
  assert.equal(f.profile.focus, 'Мой несохранённый комментарий.');
  assert.deepEqual(f.calls.filter(call => call.method === 'POST').map(call => call.body.expectedVersion), [4, 8]);
  assert.equal(f.retained(), f.before);
});

test('an unchanged save retry keeps its operation ID; selecting a different mode changes the request', async t => {
  let fail = true;
  const f = await fixture(t, { role: 'teacher', route: 'student=fixture-pupil', focus: COMMENT, allowSave: true,
    onSave() { if (fail) { fail = false; return { status: 503, data: { error: 'TEMPORARY_TEST_FAILURE' } }; } }
  });
  const form = f.main.querySelector('#teaching-profile');
  form.elements.routeMode.value = 'number-theory-only'; await f.submit(); await f.submit();
  const writes = f.calls.filter(call => call.method === 'POST');
  assert.equal(writes.length, 2); assert.deepEqual(writes[0].body, writes[1].body);
  checkPair(f.main, true);
  form.elements.routeMode.value = 'ordinary'; await f.submit();
  assert.notEqual(f.calls.filter(call => call.method === 'POST')[2].body.opId, writes[0].body.opId);
  assert.equal(f.retained(), f.before);
});

test('ordinary Vilenkin profiles and a refreshed ordinary profile retain courses and public navigation', async t => {
  const ordinary = await fixture(t, { focus: COMMENT + '\n' + IDS.map(url).join('\n') });
  assert(ordinary.main.querySelector('[data-vilenkin6-course]'));
  assert.equal(ordinary.main.querySelector('[data-number-theory-only]'), null);
  assert.equal(ordinary.window.document.querySelector('.site-link').hidden, false);
  assert(ordinary.window.document.querySelector('[data-nav=division-course]'));
  const selected = await fixture(t);
  checkPair(selected.main);
  selected.profile.focus = COMMENT;
  await selected.window.LearningApp.refresh(); await settle();
  assert(selected.main.querySelector('[data-vilenkin6-course]'));
  assert.equal(selected.window.document.querySelector('.site-link').hidden, false);
  assert(selected.window.document.querySelector('[data-nav=division-course]'));
  assert.equal(selected.retained(), selected.before);
  assert.equal(catalog.items.length, 378);
  assert.equal(catalog.items.filter(item => item.trainerId === 'vilenkin6-part1').length, 27);
});
