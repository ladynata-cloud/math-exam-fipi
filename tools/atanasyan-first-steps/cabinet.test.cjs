'use strict';
// Synthetic account boundaries. No pupil identifiers, credentials or real writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const attached = require('../../learning/attached-course.js');
const catalog = require('../../learning/catalog.js');
const url = 'https://mathexam.space/geometry-course/first-steps/';
const focus = 'Сохраняем прежнее замечание.\nКурс: ' + url + '\nСначала попробуй сам. <b>Подсказки</b> доступны.';
const lesson = 'atanasyan-7-9-main-160-part-2';
const tick = () => new Promise(resolve => setImmediate(resolve));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
async function changeHash(window, action) {
  const changed = new Promise(resolve => window.addEventListener('hashchange', resolve, { once: true }));
  action(); await changed; await settle();
}

test('only explicit canonical course selection adds the native route', () => {
  for (const value of [url, 'Курс: ' + url, '(' + url + ').', focus]) {
    const profile = Object.freeze({ course: 'school', focus: value });
    assert.equal(attached.selected(profile).id, 'atanasyan-first-steps');
    assert.equal(profile.focus, value);
  }
  for (const value of ['', null, undefined, 'Атанасян', url + '?next=elsewhere', url + '#x', url + 'index.html',
    url.replace('https:', 'http:'), url.replace('mathexam.space', 'mathexam.space.evil.example'),
    url.replace('mathexam.space', 'mathexam.space@evil.example'), 'https://evil.example/?next=' + url,
    'prefix' + url, url.replace('/geometry-course/', '/%67eometry-course/'), '<script>alert(1)</script>']) {
    assert.equal(attached.selected({ course: 'school', focus: value }), null, String(value));
  }
  assert.equal(attached.selected({ course: 'school', focus: attached.withNumberTheoryOnly(focus, true) }).id, 'grade6-number-theory-only');
  assert.equal(attached.selected({ course: 'school', focus: 'https://mathexam.space/trainers/college-functions/\n' + focus }).id, 'college-functions');
  assert.equal(attached.selected({ course: 'school', focus: 'https://mathexam.space/stereo-course/merzlyak-10-base/\n' + focus }).id, 'merzlyak-10-base');
});

async function fixture({ role = 'student', route = 'home', selected = true, allowSave = false, deferNativeProfile = false } = {}) {
  const dom = new JSDOM(read('learning/index.html'), { url: `https://cabinet.example/learning/?role=${role}#${route}`, runScripts: 'outside-only' });
  const { window } = dom;
  const calls = [], mounts = [], helpers = [];
  const profile = { course: 'school', goal: null, focus: selected ? focus : 'Прежний комментарий.', version: 4 };
  const pupil = { id: 'fixture-pupil', role: 'student', name: 'Проверочный ученик', login: 'fixture-pupil', profile };
  const teacher = { id: 'fixture-teacher', role: 'teacher', name: 'Преподаватель', login: 'fixture-teacher' };
  const peer = { id: 'fixture-peer', role: 'student', name: 'Другой ученик', login: 'fixture-peer', profile: { course: 'school', focus: 'Иное направление.', version: 2 } };
  const own = { id: 'fixture-work', learnerId: pupil.id, trainerId: 'ege-path', contentId: 'triangle', title: 'Сохранённая работа', outcome: 'started', updatedAt: '2026-01-01T00:00:00Z' };
  const attempts = [own, { ...own, id: 'peer-work', learnerId: peer.id }];
  let profileRelease = null, profileWaiting = false;
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  window.LearningCatalog = catalog;
  window.LearningRoute = { mount(host) { host.innerHTML = '<h1 data-original-route>Прежний маршрут</h1>'; return () => {}; } };
  window.MathExamWelcome = { maybeOpen() {}, cleanup() {} };
  window.AtanasyanFirstSteps = { mount(host, options) {
    const record = { host, options, disposed: false }; mounts.push(record);
    host.innerHTML = '<h1 data-native-renderer>Курс к учебнику Атанасяна</h1>';
    return () => { record.disposed = true; host.replaceChildren(); };
  } };
  window.LearningAssistant = { mount(host, options) {
    const record = { host, options, disposed: false }; helpers.push(record);
    return () => { record.disposed = true; };
  } };
  window.fetch = async (target, options = {}) => {
    const request = String(target).replace('/api/learning', '');
    calls.push({ request, method: options.method || 'GET', headers: options.headers, body: options.body });
    if (options.method === 'POST') {
      assert(allowSave && request === '/teacher/students/fixture-pupil/profile', 'Unexpected write: ' + request);
      const body = JSON.parse(options.body);
      assert.equal(body.expectedVersion, profile.version);
      assert.equal(body.course, 'school'); assert.equal(body.goal, null);
      Object.assign(profile, { focus: body.focus.trim(), version: profile.version + 1 });
    }
    if (deferNativeProfile && request === '/teacher/students/fixture-pupil/profile' && window.location.hash.startsWith('#atanasyan-')) {
      profileWaiting = true;
      await new Promise(resolve => { profileRelease = resolve; });
      profileWaiting = false;
    }
    const responses = {
      '/status': {}, '/session': { account: role === 'teacher' ? teacher : pupil, csrfToken: 'synthetic-csrf' }, '/profile': { profile },
      '/attempts': { attempts }, '/assignments': { assignments: [] }, '/lessons': { lessons: [] },
      '/teacher/students': { students: [pupil, peer] },
      '/teacher/students/fixture-pupil/report': { student: pupil, attempts: [own], counts: {} },
      '/teacher/students/fixture-pupil/profile': { profile },
      '/teacher/students/fixture-peer/profile': { profile: peer.profile },
      '/teacher/students/fixture-pupil/plan': { items: [], note: 'Прежний план.' },
      '/teacher/students/fixture-pupil/ai-drafts': { drafts: [] },
      '/teacher/students/fixture-pupil/parent-access': { parentAccess: { exists: false } }
    };
    assert(Object.hasOwn(responses, request), 'Unexpected API: ' + request);
    return { ok: true, status: 200, json: async () => structuredClone(responses[request]) };
  };
  for (const file of ['attached-course', 'vilenkin6-course', 'preparation', 'teaching', 'app']) window.eval(read('learning/' + file + '.js'));
  await settle();
  return { dom, window, main: window.document.getElementById('main'), calls, mounts, helpers, profile, peer, attempts,
    profileWaiting: () => profileWaiting, releaseProfile: () => profileRelease?.() };
}

test('selected pupil entry preserves old assignments and only their existing work', async () => {
  for (const route of ['home', 'course', 'route']) {
    const f = await fixture({ route });
    try {
      const card = f.main.querySelector('[data-attached-course="atanasyan-first-steps"]');
      assert(card); assert.equal(card.querySelector('[data-attached-course-open]').getAttribute('href'), '#atanasyan-course');
      assert.match(card.querySelector('[data-attached-course-storage]').textContent, /не входят в серверную историю/);
      assert(f.main.querySelector('a[href="#attempt=fixture-work"]'));
      assert.equal(f.main.querySelector('a[href="#attempt=peer-work"]'), null);
      assert.equal(f.main.querySelector('b'), null, 'private profile markup is escaped');
      assert.equal(f.mounts.length, 0, 'opening the cabinet does not force-start course work');
      assert(f.calls.every(call => call.method === 'GET')); assert.equal(f.profile.focus, focus); assert.equal(f.attempts.length, 2);
    } finally { f.dom.window.close(); }
  }
});

test('native pupil route is account-scoped, keeps in-place navigation and tears down on exit', async () => {
  const f = await fixture({ route: 'atanasyan-lesson=' + lesson });
  try {
    assert.equal(f.mounts.length, 1); assert.equal(f.helpers.length, 0, 'no duplicate cabinet helper below the native course');
    const mount = f.mounts[0], options = mount.options;
    assert.equal(options.initialLessonId, lesson); assert.equal(options.storageScope, 'fixture-pupil');
    assert.equal(options.bundleUrl, '/learning/atanasyan-first-steps/course.json');
    assert.equal(options.readOnly, false); assert.equal(options.role, 'student'); assert.equal(typeof options.api, 'function');
    assert.equal(options.isCurrent(), true); assert.equal(options.canAsk(), true);
    options.onNavigate('atanasyan-7-9-theory-23-part-1'); await settle();
    assert.equal(f.window.location.hash, '#atanasyan-lesson=atanasyan-7-9-theory-23-part-1');
    assert.equal(f.mounts.length, 1); assert.equal(mount.disposed, false); assert.equal(options.isCurrent(), true);
    options.onNavigate('atanasyan-7-9-main-161-part-1');
    assert.equal(f.window.location.hash, '#atanasyan-lesson=atanasyan-7-9-theory-23-part-1', 'invalid renderer callback cannot escape the course boundary');
    options.onNavigate(null); assert.equal(f.window.location.hash, '#atanasyan-course');
    await changeHash(f.window, () => options.onExit());
    assert.equal(mount.disposed, true); assert.equal(options.isCurrent(), false);
    assert(f.main.querySelector('[data-attached-course="atanasyan-first-steps"]'));
    assert(f.calls.every(call => call.method === 'GET')); assert.equal(f.attempts.length, 2);
  } finally { f.dom.window.close(); }
});

test('unselected and forged routes cannot mount another course or read another profile', async () => {
  for (const [route, selected] of [
    ['atanasyan-course', false], ['atanasyan-lesson=' + lesson, false],
    ['atanasyan-lesson=atanasyan-7-9-main-161-part-1', true],
    ['atanasyan-lesson=atanasyan-7-9-theory-24-part-1', true],
    ['atanasyan-course&preview=fixture-peer', true],
    ['atanasyan-course&attempt=peer-work', true],
    ['atanasyan-course&atanasyan-course', true],
    ['atanasyan-course&atanasyan-lesson=' + lesson, true],
    ['atanasyan-lesson=javascript:alert(1)', true]
  ]) {
    const f = await fixture({ route, selected });
    try {
      assert.equal(f.mounts.length, 0, route);
      assert(f.calls.every(call => call.method === 'GET' && !call.request.startsWith('/teacher/')), route);
      assert.equal(f.attempts.length, 2); assert.equal(f.peer.profile.focus, 'Иное направление.');
    } finally { f.dom.window.close(); }
  }
});

test('teacher entry and preview link to read-only native course for the selected owned pupil', async () => {
  for (const route of ['student=fixture-pupil', 'preview=fixture-pupil']) {
    const f = await fixture({ role: 'teacher', route });
    try {
      const link = f.main.querySelector('[data-attached-course-open]');
      assert(link); assert.equal(link.getAttribute('href'), '#atanasyan-course&preview=fixture-pupil');
      assert.equal(f.mounts.length, 0); assert(f.calls.every(call => call.method === 'GET'));
    } finally { f.dom.window.close(); }
  }
  const f = await fixture({ role: 'teacher', route: 'atanasyan-course&preview=fixture-pupil' });
  try {
    assert.equal(f.mounts.length, 1); assert.equal(f.helpers.length, 0);
    const options = f.mounts[0].options;
    assert.equal(options.readOnly, true); assert.equal(options.role, 'teacher');
    assert.equal(options.api, undefined); assert.equal(options.canAsk, undefined);
    assert.equal(options.storageScope, 'preview:fixture-teacher:fixture-pupil');
    assert.match(f.main.querySelector('.preview-banner').textContent, /без личных записей/);
    options.onNavigate(lesson); await settle();
    assert.equal(f.window.location.hash, '#atanasyan-lesson=' + lesson + '&preview=fixture-pupil');
    assert.equal(f.mounts.length, 1); assert.equal(options.isCurrent(), true);
    assert(f.calls.every(call => call.method === 'GET'));
  } finally { f.dom.window.close(); }
});

test('teacher cannot preview an unowned or unselected native course', async () => {
  for (const route of ['atanasyan-course', 'atanasyan-course&preview=unknown-pupil', 'atanasyan-course&preview=fixture-peer']) {
    const f = await fixture({ role: 'teacher', route });
    try {
      assert.equal(f.mounts.length, 0, route);
      assert(!f.calls.some(call => call.request.includes('unknown-pupil')));
      assert(f.calls.every(call => call.method === 'GET'));
    } finally { f.dom.window.close(); }
  }
});

test('teacher course selection reuses the existing versioned profile form without replacing other work', async () => {
  const f = await fixture({ role: 'teacher', route: 'student=fixture-pupil', selected: false, allowSave: true });
  try {
    const form = f.main.querySelector('#teaching-profile'); assert(form);
    form.elements.focus.value = f.profile.focus + '\nКурс: ' + url;
    form.dispatchEvent(new f.window.Event('submit', { bubbles: true, cancelable: true })); await settle();
    assert.equal(f.profile.version, 5); assert.equal(f.profile.focus, 'Прежний комментарий.\nКурс: ' + url);
    assert.equal(f.peer.profile.focus, 'Иное направление.'); assert.equal(f.attempts.length, 2);
    assert.deepEqual(f.calls.filter(call => call.method !== 'GET').map(call => call.request), ['/teacher/students/fixture-pupil/profile']);
    assert.equal(f.main.querySelector('[data-attached-course-open]').getAttribute('href'), '#atanasyan-course&preview=fixture-pupil');
  } finally { f.dom.window.close(); }
});

test('late teacher profile response cannot mount course after route exit', async () => {
  const f = await fixture({ role: 'teacher', route: 'students', deferNativeProfile: true });
  try {
    await changeHash(f.window, () => { f.window.location.hash = 'atanasyan-course&preview=fixture-pupil'; });
    assert.equal(f.profileWaiting(), true);
    await changeHash(f.window, () => { f.window.location.hash = 'students'; });
    assert(f.main.querySelector('#add-student'));
    f.releaseProfile(); await settle();
    assert.equal(f.mounts.length, 0); assert(f.main.querySelector('#add-student'));
  } finally { f.releaseProfile(); f.dom.window.close(); }
});

test('new cabinet scripts and styles stay on the cabinet origin', () => {
  const dom = new JSDOM(read('learning/index.html'), { url: 'https://cabinet.example/learning/' });
  try {
    const targets = [...dom.window.document.querySelectorAll('script[src],link[rel=stylesheet]')].map(node => node.src || node.href);
    for (const value of targets.filter(value => /atanasyan-first-steps|geometry-course\/textbook\/assets/.test(value))) {
      assert.equal(new URL(value).origin, 'https://cabinet.example');
    }
    assert(targets.some(value => value.includes('/atanasyan-first-steps/state.js')));
    assert(targets.some(value => value.includes('/atanasyan-first-steps/app.js')));
  } finally { dom.window.close(); }
});
