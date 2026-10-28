'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const attached = require('../../learning/attached-course');
const focus = 'Прежний комментарий. Курс: https://mathexam.space/geometry-course/first-steps/';
const first = 'ichenskaya-7-sr-01-v1-task-01', last = 'ichenskaya-7-kr-06-v2-task-04';
const settle = async () => { for (let i = 0; i < 25; i++) await new Promise(resolve => setImmediate(resolve)); };
async function changeHash(window, action) { const changed = new Promise(resolve => window.addEventListener('hashchange', resolve, { once: true })); action(); await changed; await settle(); }
async function fixture({ role = 'student', route = 'home', selected = true, deferred = false } = {}) {
  const dom = new JSDOM(read('learning/index.html'), { url: 'https://cabinet.example/learning/?role=' + role + '#' + route, runScripts: 'outside-only' });
  const { window } = dom, calls = [], mounts = [], helpers = [];
  const profile = { course: 'school', focus: selected ? focus : 'Другое направление.', version: 3, goal: null };
  const pupil = { id: 'synthetic-pupil', role: 'student', name: 'Проверочный ученик', login: 'synthetic-pupil', profile };
  const teacher = { id: 'synthetic-teacher', role: 'teacher', name: 'Преподаватель', login: 'synthetic-teacher' };
  const peer = { ...pupil, id: 'synthetic-peer', profile: { ...profile, focus: 'Другой курс.' } };
  const attempts = [{ id: 'synthetic-old-work', learnerId: pupil.id, title: 'Прежняя работа', outcome: 'started', trainerId: 'ege-path', contentId: 'triangle', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 'synthetic-peer-work', learnerId: peer.id, title: 'Чужая работа', outcome: 'started' }];
  let release = null, waiting = false;
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  window.LearningCatalog = require('../../learning/catalog');
  window.LearningRoute = { mount(host) { host.innerHTML = '<h1 data-original-route>Прежний маршрут</h1>'; return () => {}; } };
  window.MathExamWelcome = { maybeOpen() {}, cleanup() {} };
  for (const [name, course] of [['AtanasyanFirstSteps', 'atanasyan-first-steps'], ['IchenskayaGrade7Works', 'ichenskaya-grade7-works']]) {
    window[name] = { mount(host, options) { const record = { course, options, disposed: false }; mounts.push(record); host.innerHTML = '<h1 data-native-renderer>Учебный курс</h1>'; return () => { record.disposed = true; host.replaceChildren(); }; } };
  }
  window.LearningAssistant = { mount() { helpers.push(true); return () => {}; } };
  window.fetch = async (target, options = {}) => {
    const request = String(target).replace('/api/learning', ''); calls.push({ request, method: options.method || 'GET' });
    assert.equal(options.method || 'GET', 'GET');
    if (deferred && request === '/teacher/students/synthetic-pupil/profile' && window.location.hash.startsWith('#ichenskaya-')) {
      waiting = true; await new Promise(resolve => { release = resolve; }); waiting = false;
    }
    const responses = { '/status': {}, '/session': { account: role === 'teacher' ? teacher : pupil, csrfToken: 'synthetic-csrf' },
      '/profile': { profile }, '/attempts': { attempts }, '/assignments': { assignments: [] }, '/lessons': { lessons: [] },
      '/teacher/students': { students: [pupil, peer] }, '/teacher/students/synthetic-pupil/profile': { profile },
      '/teacher/students/synthetic-peer/profile': { profile: peer.profile } };
    assert(Object.hasOwn(responses, request), request);
    return { ok: true, status: 200, json: async () => structuredClone(responses[request]) };
  };
  for (const file of ['attached-course', 'app']) window.eval(read('learning/' + file + '.js'));
  await settle();
  return { dom, window, main: window.document.getElementById('main'), profile, calls, mounts, helpers, attempts, waiting: () => waiting, release: () => release?.() };
}

test('same selected Atanasyan profile adds a companion and preserves old work', async () => {
  for (const route of ['home', 'route', 'course']) {
    const f = await fixture({ route });
    try {
      assert.equal(attached.selected(f.profile).id, 'atanasyan-first-steps');
      assert.equal(f.profile.focus, focus);
      assert.equal(f.main.querySelector('[data-attached-course="atanasyan-first-steps"] [data-attached-course-open]').getAttribute('href'), '#atanasyan-course');
      assert.equal(f.main.querySelector('[data-companion-course-open]').getAttribute('href'), '#ichenskaya-course');
      assert(f.main.querySelector('a[href="#attempt=synthetic-old-work"]'));
      assert.equal(f.main.querySelector('a[href="#attempt=synthetic-peer-work"]'), null);
      assert.equal(f.attempts.length, 2); assert.equal(f.mounts.length, 0); assert(f.calls.every(call => call.method === 'GET'));
    } finally { f.dom.window.close(); }
  }
  assert.equal(attached.markup({ course: 'school', focus: 'Без назначенного курса.' }), '');
});

test('native companion navigation stays in place and switching courses disposes the prior view', async () => {
  const f = await fixture({ route: 'ichenskaya-lesson=' + first });
  try {
    assert.equal(f.mounts.length, 1); assert.equal(f.helpers.length, 0);
    const current = f.mounts[0], options = current.options;
    assert.equal(current.course, 'ichenskaya-grade7-works'); assert.equal(options.storageScope, 'synthetic-pupil');
    assert.equal(options.bundleUrl, '/learning/ichenskaya-grade7-works/course.json'); assert.equal(options.initialLessonId, first);
    assert.equal(options.readOnly, false); assert.equal(typeof options.api, 'function'); assert.equal(options.canAsk(), true);
    options.onNavigate(last); assert.equal(f.window.location.hash, '#ichenskaya-lesson=' + last); assert.equal(f.mounts.length, 1);
    options.onNavigate('atanasyan-7-9-main-1-part-1'); assert.equal(f.window.location.hash, '#ichenskaya-lesson=' + last);
    await changeHash(f.window, () => options.onCompanion());
    assert.equal(current.disposed, true); assert.equal(options.isCurrent(), false); assert.equal(f.mounts[1].course, 'atanasyan-first-steps');
    await changeHash(f.window, () => f.mounts[1].options.onCompanion());
    assert.equal(f.mounts[1].disposed, true); assert.equal(f.mounts[2].course, 'ichenskaya-grade7-works');
    await changeHash(f.window, () => f.mounts[2].options.onExit());
    assert(f.main.querySelector('[data-companion-course-open]')); assert.equal(f.attempts.length, 2);
  } finally { f.dom.window.close(); }
});

test('strict companion routes reject mixed courses, unknown bounds and pupil previews', async () => {
  for (const [route, selected] of [['ichenskaya-course', false], ['ichenskaya-lesson=' + first, false],
    ['ichenskaya-course&atanasyan-course', true], ['ichenskaya-course&ichenskaya-course', true],
    ['ichenskaya-course&ichenskaya-lesson=' + first, true], ['ichenskaya-course&attempt=synthetic-peer-work', true],
    ['ichenskaya-course&preview=synthetic-peer', true], ['ichenskaya-lesson=atanasyan-7-9-main-1-part-1', true],
    ['ichenskaya-lesson=ichenskaya-7-sr-18-v1-task-01', true], ['ichenskaya-lesson=ichenskaya-7-kr-07-v1-task-01', true],
    ['ichenskaya-lesson=ichenskaya-7-sr-01-v3-task-01', true], ['ichenskaya-lesson=javascript:alert(1)', true]]) {
    const f = await fixture({ route, selected });
    try { assert.equal(f.mounts.length, 0, route); assert(f.calls.every(call => !call.request.startsWith('/teacher/')), route); assert.equal(f.attempts.length, 2); }
    finally { f.dom.window.close(); }
  }
});

test('owned teacher preview is read-only across both courses with no pupil API', async () => {
  const profile = { course: 'school', focus };
  assert.match(attached.markup(profile, { teacher: true, previewStudentId: 'synthetic-pupil' }), /#ichenskaya-course&amp;preview=synthetic-pupil/);
  const f = await fixture({ role: 'teacher', route: 'ichenskaya-lesson=' + first + '&preview=synthetic-pupil' });
  try {
    assert.equal(f.mounts.length, 1); const options = f.mounts[0].options;
    assert.equal(options.readOnly, true); assert.equal(options.role, 'teacher'); assert.equal(options.api, undefined);
    assert.equal(options.storageScope, 'preview:synthetic-teacher:synthetic-pupil'); assert.equal(f.helpers.length, 0);
    await changeHash(f.window, () => options.onCompanion());
    assert.equal(f.window.location.hash, '#atanasyan-course&preview=synthetic-pupil'); assert.equal(f.mounts[1].options.readOnly, true);
    assert.equal(f.mounts[1].options.api, undefined);
  } finally { f.dom.window.close(); }
  for (const route of ['ichenskaya-course', 'ichenskaya-course&preview=unknown', 'ichenskaya-course&preview=synthetic-peer']) {
    const f = await fixture({ role: 'teacher', route });
    try { assert.equal(f.mounts.length, 0, route); assert(!f.calls.some(call => call.request.includes('/unknown/'))); }
    finally { f.dom.window.close(); }
  }
});

test('late teacher profile response cannot mount after exiting the companion route', async () => {
  const f = await fixture({ role: 'teacher', route: 'students', deferred: true });
  try {
    await changeHash(f.window, () => { f.window.location.hash = 'ichenskaya-course&preview=synthetic-pupil'; }); assert.equal(f.waiting(), true);
    await changeHash(f.window, () => { f.window.location.hash = 'students'; }); f.release(); await settle();
    assert.equal(f.mounts.length, 0); assert(f.main.querySelector('#add-student'));
  } finally { f.release(); f.dom.window.close(); }
});
