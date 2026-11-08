'use strict';
// Render real cabinet routes with synthetic users and read-only mocked HTTP.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const catalog = require('../learning/catalog');
const shared = require('../learning/profile-shared-board');
const tick = () => new Promise(resolve => setImmediate(resolve));
const sources = {
  start: ['algebra-data','equations-data','functions-data'].flatMap(file => require('../ege-profil/start/' + file)),
  circle: ['preparation','chapter5','chapter6a','chapter6b'].flatMap(file => require('../ege-profil/circle/' + file))
};

async function fixture({role = 'student', route = 'home', course = 'ege-profile', programCourses, focus = 'Повтори выбранную тему.'} = {}) {
  const dom = new JSDOM(read('learning/index.html'), {url:`https://cabinet.example/learning/?role=${role}#${route}`,runScripts:'outside-only'});
  const {window} = dom, calls = [];
  const profile = {course,goal:null,focus,version:1};
  if (programCourses) profile.program = {grade:10,courseIds:programCourses};
  const student = {id:'fixture-pupil',role:'student',name:'Проверочный ученик',login:'fixture-pupil',profile};
  const teacher = {id:'fixture-teacher',role:'teacher',name:'Преподаватель',login:'fixture-teacher'};
  const work = {id:'fixture-work',learnerId:student.id,trainerId:'ege-path',contentId:'triangle',title:'Сохранённая работа',outcome:'started',updatedAt:'2026-01-01T00:00:00Z'};
  const attempts = [work,{...work,id:'peer-work',learnerId:'fixture-peer'}];
  const snapshot = JSON.stringify({profile,attempts});
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  window.LearningCatalog = catalog;
  window.LearningRoute = {mount(host) { host.innerHTML = '<h1 data-original-route>Школьный маршрут</h1>'; return () => {}; }};
  window.MathExamWelcome = {maybeOpen() {},cleanup() {}};
  window.fetch = async (target, options = {}) => {
    const request = String(target).replace('/api/learning', '');
    calls.push({request,method:options.method || 'GET'});
    assert.equal(options.method || 'GET', 'GET', 'Opening the shared course must not write cabinet data');
    const responses = {
      '/status':{},'/session':{account:role === 'teacher' ? teacher : student},'/profile':{profile},
      '/attempts':{attempts},'/assignments':{assignments:[]},'/lessons':{lessons:[]},
      '/teacher/students':{students:[student]},'/teacher/students/fixture-pupil/report':{student,attempts,counts:{}},
      '/teacher/students/fixture-pupil/profile':{profile},'/teacher/students/fixture-pupil/plan':{items:[]},
      '/teacher/students/fixture-pupil/ai-drafts':{drafts:[]},'/teacher/students/fixture-pupil/parent-access':{parentAccess:{exists:false}}
    };
    assert(Object.hasOwn(responses, request), 'Unexpected API: ' + request);
    return {ok:true,status:200,json:async () => structuredClone(responses[request])};
  };
  for (const file of ['attached-course','course-program','profile-exam-catalog','profile-shared-board','vilenkin6-course','preparation','teaching','public-practice','app']) {
    window.eval(read('learning/' + file + '.js'));
  }
  for (let n = 0; n < 25; n++) await tick();
  return {dom,window,main:window.document.getElementById('main'),calls,profile,attempts,snapshot};
}

function destination(link, route) {
  const params = new URLSearchParams(link.hash.slice(1));
  assert.equal(params.get('return'), route, 'Return keeps the cabinet route, including teacher card/preview');
  assert.equal(link.target, '', 'The existing cabinet workspace supplies the return button');
  const board = new URL(params.get('public-practice'), 'https://mathexam.space');
  assert.equal(board.origin, 'https://mathexam.space');
  assert.equal(board.pathname, '/trainers/trainer-board.html');
  assert.equal([...board.searchParams.keys()].join(','), 'trainer');
  const trainer = new URL(board.searchParams.get('trainer'), board.origin);
  assert.equal(trainer.search, '');
  assert.equal(trainer.origin, board.origin);
  assert(!trainer.href.includes('fixture-'), 'No pupil identifiers cross into the public trainer');
  return {board,trainer};
}

function checkEntry(f, role, route) {
  const sections = f.main.querySelectorAll('[data-profile-shared-board]');
  assert.equal(sections.length, 1, role + ' ' + route);
  const section = sections[0];
  assert.equal(section.querySelectorAll('[data-profile-shared-item]').length, 16);
  assert.match(section.querySelector('[data-profile-shared-room]').textContent, role === 'teacher' ? /Создать комнату/ : /ссылку комнаты преподавателя/);
  assert.match(section.querySelector('[data-profile-shared-storage]').textContent, /не отмечается как самостоятельная/);
  assert(!section.textContent.includes('класс'), 'This route does not infer or assign a school grade');
  for (const link of section.querySelectorAll('[data-profile-shared-open]')) {
    const lesson = shared.lessons.find(item => item.id === link.dataset.profileSharedLesson);
    assert(lesson);
    const {trainer} = destination(link, route);
    assert.equal(trainer.pathname, lesson.source === 'start' ? '/trainers/ege-profile-log-trig.html' : '/trainers/ege-profile-circle.html');
    const guided = link.dataset.profileSharedMode === 'guided';
    const expected = guided ? (lesson.source === 'circle' ? '#task/' + lesson.firstTask + '/guided' : '#practice/' + lesson.id + '/guided') : '#lesson/' + lesson.id;
    assert.equal(trainer.hash, expected, 'Selected lesson/task/mode survives both URL encoding layers');
  }
  assert(f.calls.every(call => call.method === 'GET'));
  assert.equal(JSON.stringify({profile:f.profile,attempts:f.attempts}), f.snapshot);
}

test('every cabinet topic and guided first task exists in its published course', () => {
  assert.equal(shared.lessons.filter(lesson => lesson.source === 'start').length, 9);
  assert.equal(shared.lessons.filter(lesson => lesson.source === 'circle').length, 7);
  for (const entry of shared.lessons) {
    const lesson = sources[entry.source].find(item => item.id === entry.id);
    assert(lesson, entry.id);
    assert.equal(entry.title, lesson.title);
    if (entry.source === 'circle') assert.equal(entry.firstTask, lesson.tasks[0].id, entry.id);
    assert.equal(Object.isFrozen(entry), true);
  }
});

test('pupil profile home, course and route render shared entry without requiring a grade or changing prior work', async () => {
  for (const route of ['home','course','route']) {
    const f = await fixture({route});
    try {
      checkEntry(f, 'student', route);
      assert.equal(f.profile.program, undefined);
      assert.equal(f.main.querySelectorAll('[data-profile-exam-start]').length, 13, 'Full profile catalog is preserved');
      assert(f.main.querySelector('[data-profile-full-course]'));
      if (route === 'home') {
        assert(f.main.querySelector('[data-profile-prior-work] a[href="#attempt=fixture-work"]'));
        assert.equal(f.main.querySelector('a[href="#attempt=peer-work"]'), null);
      }
    } finally { f.dom.window.close(); }
  }
});

test('teacher student card and read-only preview expose the same shared lessons', async () => {
  for (const route of ['student=fixture-pupil','preview=fixture-pupil']) {
    const f = await fixture({role:'teacher',route});
    try {
      checkEntry(f, 'teacher', route);
      if (route.startsWith('student=')) {
        assert.equal(f.main.querySelector('[name=course]').value, 'ege-profile');
        assert.equal(f.main.querySelector('[name=focus]').value, f.profile.focus);
      } else assert(f.main.querySelector('.preview-banner'));
    } finally { f.dom.window.close(); }
  }
});

test('assigned profile programs expose exactly one entry in pupil routes and teacher cards', async () => {
  for (const [role,route] of [['student','home'],['student','course'],['student','route'],['student','program-course=ege-profile'],['teacher','student=fixture-pupil'],['teacher','preview=fixture-pupil']]) {
    const f = await fixture({role,route,programCourses:['ege-profile']});
    try { checkEntry(f, role, route); }
    finally { f.dom.window.close(); }
  }
});

test('a selected Circle task and START lesson/mode open inside the existing workspace with an exact return', async () => {
  for (const [role,route,lesson] of [['teacher','student=fixture-pupil','before-radians'],['student','course','algebra-logarithmic']]) {
    const f = await fixture({role,route});
    try {
      const link = f.main.querySelector(`[data-profile-shared-item="${lesson}"] [data-profile-shared-mode="guided"]`);
      const {board,trainer} = destination(link, route);
      link.closest('details').open = true;
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Cabinet board link did not navigate')), 1000);
        f.window.addEventListener('hashchange', () => { clearTimeout(timeout); resolve(); }, {once:true});
        link.click();
      });
      for (let n = 0; n < 25; n++) await tick();
      const frame = f.main.querySelector('[data-public-workspace] iframe');
      assert(frame, 'The real app mounted the public board workspace: ' + f.window.location.hash + ' ' + f.main.textContent.slice(0,200));
      assert.equal(frame.src, board.href);
      assert.equal(new URL(new URL(frame.src).searchParams.get('trainer'), board.origin).hash, trainer.hash);
      assert.equal(f.main.querySelector('[data-cabinet-return]').hash, '#' + route);
      assert(f.calls.every(call => call.method === 'GET'));
      assert.equal(JSON.stringify({profile:f.profile,attempts:f.attempts}), f.snapshot);
    } finally { f.dom.window.close(); }
  }
});

test('other directions, explicit other programs and attached courses keep their existing entries', async () => {
  const cases = [
    {course:'school'},
    {programCourses:['college-functions']},
    {course:'school',focus:'Курс: https://mathexam.space/stereo-course/merzlyak-10-base/'},
    {course:'school',focus:'Курс: https://mathexam.space/trainers/college-functions/'}
  ];
  for (const options of cases) for (const [role,route] of [['student','home'],['teacher','student=fixture-pupil']]) {
    const f = await fixture({...options,role,route});
    try {
      assert.equal(f.main.querySelector('[data-profile-shared-board]'), null);
      assert(f.calls.every(call => call.method === 'GET'));
      assert.equal(JSON.stringify({profile:f.profile,attempts:f.attempts}), f.snapshot);
      if (options.focus?.includes('merzlyak')) {
        const link = f.main.querySelector('[data-attached-course-board]');
        assert.equal(destination(link, route).trainer.pathname, '/trainers/merzlyak-10-base.html');
      }
      if (options.focus?.includes('college-functions') && role === 'teacher') {
        const link = f.main.querySelector('[data-attached-course-board]');
        assert.equal(destination(link, route).trainer.pathname, '/trainers/college-functions/index.html');
      }
    } finally { f.dom.window.close(); }
  }
});
