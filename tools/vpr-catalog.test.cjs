'use strict';
// Real cabinet rendering with synthetic users and read-only HTTP fixtures.
// NODE_PATH=/path/to/jsdom/node_modules node --test tools/vpr-catalog.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const program = require('../learning/course-program');
const bank = require('../trainers/vpr-math/data');
const navigator = require('../assets/assistant/navigator-data');
const routes = ['g5','g6','g7','g7u','g8','g8u','g10'];
const ids = routes.map(route => 'vpr-' + route);
const publicPath = route => '/trainers/vpr-math/index.html?route=' + route;
const tick = () => new Promise(resolve => setImmediate(resolve));

async function cabinet({role = 'student', route = 'home', courseIds = ['foundations', ...ids]} = {}) {
  const dom = new JSDOM(read('learning/index.html'), {url:`https://cabinet.example/learning/?role=${role}#${route}`,runScripts:'outside-only'});
  const {window} = dom, calls = [];
  const profile = {course:'school',goal:null,focus:'Сохранённые рекомендации.',version:3,program:{grade:7,courseIds:[...courseIds]}};
  const student = {id:'vpr-fixture-pupil',role:'student',name:'Проверочный ученик',login:'vpr-fixture-pupil',profile};
  const teacher = {id:'vpr-fixture-teacher',role:'teacher',name:'Преподаватель',login:'vpr-fixture-teacher'};
  const work = {id:'vpr-fixture-work',learnerId:student.id,trainerId:'school7',contentId:'equations',title:'Сохранённая работа',outcome:'started',updatedAt:'2026-01-01T00:00:00Z'};
  const attempts = [work,{...work,id:'vpr-fixture-peer-work',learnerId:'vpr-fixture-peer'}];
  const snapshot = JSON.stringify({profile,attempts});
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  window.LearningCatalog = require('../learning/catalog');
  window.LearningRoute = {mount(host) { host.innerHTML = '<h1>Школьный маршрут</h1>'; return () => {}; }};
  window.MathExamWelcome = {maybeOpen() {},cleanup() {}};
  window.fetch = async (target, options = {}) => {
    const request = String(target).replace('/api/learning', '');
    calls.push({request,method:options.method || 'GET'});
    assert.equal(options.method || 'GET', 'GET', 'Opening a VPR course must not mutate cabinet records');
    const responses = {
      '/status':{},'/session':{account:role === 'teacher' ? teacher : student},'/profile':{profile},
      '/attempts':{attempts},'/assignments':{assignments:[]},'/lessons':{lessons:[]},
      '/teacher/students':{students:[student]},
      '/teacher/students/vpr-fixture-pupil/report':{student,attempts,counts:{}},
      '/teacher/students/vpr-fixture-pupil/profile':{profile},
      '/teacher/students/vpr-fixture-pupil/plan':{items:[]},
      '/teacher/students/vpr-fixture-pupil/ai-drafts':{drafts:[]},
      '/teacher/students/vpr-fixture-pupil/parent-access':{parentAccess:{exists:false}}
    };
    assert(Object.hasOwn(responses, request), 'Unexpected API: ' + request);
    return {ok:true,status:200,json:async () => structuredClone(responses[request])};
  };
  for (const file of ['attached-course','course-program','profile-exam-catalog','profile-shared-board','vilenkin6-course','preparation','teaching','public-practice','app']) window.eval(read('learning/' + file + '.js'));
  for (let n = 0; n < 25; n++) await tick();
  return {dom,window,main:window.document.getElementById('main'),profile,attempts,snapshot,calls};
}

function boardDestination(anchor, route, returnTo) {
  assert(anchor, 'The assigned course has a shared board entry');
  const params = new URLSearchParams(anchor.hash.slice(1));
  assert.equal(params.get('return'), returnTo);
  const board = new URL(params.get('public-practice'), 'https://mathexam.space');
  assert.equal(board.origin + board.pathname, 'https://mathexam.space/trainers/trainer-board.html');
  assert.deepEqual([...board.searchParams.keys()], ['trainer']);
  assert.equal(board.searchParams.get('trainer'), publicPath(route));
  assert(!board.href.includes('fixture-'), 'Private pupil identifiers stay in the cabinet return route');
  return board;
}

test('seven assignable VPR entries match the published data and preserve their route on the shared board', () => {
  assert.deepEqual(bank.routes.map(route => route.id), routes);
  assert.deepEqual(program.courses.filter(course => course.id.startsWith('vpr-')).map(course => course.id), ids);
  for (const route of bank.routes) {
    const entry = program.get('vpr-' + route.id);
    assert.deepEqual(entry.grades, [route.grade]);
    assert.deepEqual(entry.directions, ['school','foundations']);
    assert.equal(entry.storage, 'browser');
    assert.match(entry.storageLabel, /в этом браузере/);
    assert.equal(entry.publicPath, publicPath(route.id));
    assert.equal(entry.boardPath, entry.publicPath);
    const board = new URL(entry.boardURL);
    assert.equal(board.origin + board.pathname, 'https://mathexam.space/trainers/trainer-board.html');
    assert.equal(board.searchParams.get('trainer'), entry.publicPath);
    assert.equal(entry.publicURL, 'https://mathexam.space' + entry.publicPath);
    assert(Object.isFrozen(entry));
  }
  assert.match(program.get('vpr-g7').title, /базовый/);
  assert.match(program.get('vpr-g7u').title, /углублённый/);
  assert.equal(program.get('vpr-g9'), null);
  assert.equal(program.get('college-logarithms').publicPath, '/trainers/college-logarithms/');
});

test('public landing has seven static course links, source attribution, accessible headings and one canonical URL', () => {
  const dom = new JSDOM(read('vpr/index.html'), {url:'https://mathexam.space/vpr/'});
  const doc = dom.window.document;
  assert.equal(doc.documentElement.lang, 'ru');
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.deepEqual([...doc.querySelectorAll('link[rel=canonical]')].map(link => link.href), ['https://mathexam.space/vpr/']);
  assert.deepEqual([...doc.querySelectorAll('[data-vpr-route]')].map(card => card.dataset.vprRoute), routes);
  for (const route of routes) {
    const card = doc.querySelector(`[data-vpr-route="${route}"]`);
    assert.equal(card.querySelector('a').getAttribute('href'), publicPath(route));
    assert(card.querySelector('h3'));
  }
  assert(doc.querySelector('a[href="https://fioco.ru/obraztsi_i_opisaniya_vpr"]'));
  assert.match(doc.body.textContent, /не выставляет официальную отметку/);
  assert.match(doc.body.textContent, /на другом устройстве они не появятся автоматически/);
  assert(doc.querySelector('script[src*="navigator-data.js"]'));
  const home = new JSDOM(read('index.html'));
  const catalog = new JSDOM(read('trainers/index.html'));
  assert(home.window.document.querySelector('a[href="/vpr/"]'));
  assert.equal(catalog.window.document.querySelectorAll('#catalog a[href="/vpr/"]').length, 1);
  const seeds = JSON.parse(read('tools/seo-public-pages.json')).seed_paths;
  for (const canonical of ['/vpr/','/trainers/vpr-math/']) assert(seeds.includes(canonical));
  for (const page of [dom,home,catalog]) page.window.close();
});

test('pupil routes and teacher cards show the selected VPR entries without changing previous courses or work', async () => {
  for (const [role,route] of [['student','home'],['student','course'],['teacher','student=vpr-fixture-pupil'],['teacher','preview=vpr-fixture-pupil']]) {
    const f = await cabinet({role,route});
    try {
      for (const selected of routes) {
        const card = f.main.querySelector(`[data-program-course="vpr-${selected}"]`);
        assert(card, role + ' ' + route + ' ' + selected);
        assert.match(card.textContent, /в этом браузере/);
        boardDestination(card.querySelector('[data-program-board]'), selected, route);
        const open = card.querySelector('[data-program-open]');
        if (role === 'student') assert.equal(open.href, 'https://mathexam.space' + publicPath(selected));
      }
      assert(f.main.querySelector('[data-program-course="foundations"]'));
      assert.equal(JSON.stringify({profile:f.profile,attempts:f.attempts}), f.snapshot);
      assert(f.calls.every(call => call.method === 'GET'));
      if (role === 'student' && route === 'home') assert.equal(f.main.querySelector('a[href="#attempt=vpr-fixture-peer-work"]'), null);
    } finally { f.dom.window.close(); }
  }
});

test('opening VPR boards preserves grade, level and the teacher or pupil return destination', async () => {
  for (const [role,route,selected] of [['teacher','student=vpr-fixture-pupil','g7u'],['student','home','g10']]) {
    const f = await cabinet({role,route});
    try {
      const anchor = f.main.querySelector(`[data-program-course="vpr-${selected}"] [data-program-board]`);
      const board = boardDestination(anchor, selected, route);
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Cabinet board link did not navigate')), 1000);
        f.window.addEventListener('hashchange', () => { clearTimeout(timer); resolve(); }, {once:true});
        anchor.click();
      });
      for (let n = 0; n < 25; n++) await tick();
      const frame = f.main.querySelector('[data-public-workspace] iframe');
      assert(frame, 'The existing public workspace opens the shared board');
      assert.equal(frame.src, board.href);
      assert.equal(f.main.querySelector('[data-cabinet-return]').hash, '#' + route);
      assert.equal(JSON.stringify({profile:f.profile,attempts:f.attempts}), f.snapshot);
      assert(f.calls.every(call => call.method === 'GET'));
    } finally { f.dom.window.close(); }
  }
});

test('existing programmes are not automatically assigned a VPR course', async () => {
  const f = await cabinet({courseIds:['foundations']});
  try {
    assert.equal(f.main.querySelector('[data-program-course^="vpr-"]'), null);
    assert(f.main.querySelector('[data-program-course="foundations"]'));
    assert.deepEqual(f.profile.program.courseIds, ['foundations']);
  } finally { f.dom.window.close(); }
});

test('navigator uses reviewed VPR destinations, asks for 7–8 level and preserves privacy/access priority', () => {
  const cases = [
    ['ВПР 5 класс','g5'],['ВПР 6','g6'],['ВПР 7 класс базовый','g7'],
    ['ВПР 7 класс углублённый','g7u'],['ВПР 8 класс обычный','g8'],
    ['ВПР 8 класс углублённый','g8u'],['ВПР 10 класс','g10'],['Бесплатный тренажёр ВПР 5 класс','g5'],
    ['ВПР 7 класс базовый, не углублённый','g7'],['ВПР 8 класс без углубления','g8'],
    ['ВПР 8 класс не базовый, углублённый','g8u'],['Мне ВПР 5 класс','g5'],
    ['ВПР 7 класс, мне углублённый','g7u']
  ];
  for (const [text,route] of cases) {
    const response = navigator.respond({text,pathname:'/ege-profil/',dialog:{goal:'ege-profile'}});
    assert.equal(response.kind, 'vpr', text);
    assert.equal(response.links[0].url, publicPath(route), text);
  }
  for (const grade of [7,8]) {
    const response = navigator.respond({text:`ВПР ${grade} класс`,pathname:'/'});
    assert.equal(response.kind, 'clarify');
    assert.deepEqual(response.links.map(link => link.url), [publicPath('g'+grade),publicPath('g'+grade+'u')]);
    for (const action of response.actions) {
      assert.equal(navigator.respond({text:action.text,pathname:'/'}).kind, 'vpr');
      const followup = navigator.respond({text:action.label,pathname:'/',dialog:response.dialog});
      assert.equal(followup.kind, 'vpr', 'A typed level answer follows the offered VPR choices');
    }
  }
  const absent = navigator.respond({text:'ВПР 9 класс',pathname:'/'});
  assert.match(absent.text, /Отдельного маршрута для 9 класса здесь пока нет/);
  assert.deepEqual(absent.links.map(link => link.url), ['/vpr/']);
  for (const text of ['Не ВПР, нужен ОГЭ','Не хочу ВПР, хочу ОГЭ','Не готовлюсь к ВПР, нужен ОГЭ']) {
    const response = navigator.respond({text,pathname:'/'});
    assert.equal(response.links.some(link => link.url === '/vpr/' || link.url.includes('vpr-math')), false, text);
    assert.equal(response.links[0].url, '/trainers/oge-course/', text);
  }
  assert.equal(navigator.respond({text:'Раньше ВПР 7 класс, теперь ОГЭ',pathname:'/'}).links.some(link => link.url.startsWith('/vpr/') || link.url.includes('vpr-math')), false);
  assert.equal(navigator.respond({text:'Раньше ОГЭ, теперь ВПР 6 класс',pathname:'/'}).links[0].url, publicPath('g6'));
  assert.equal(navigator.respond({text:'ВПР, не могу войти в кабинет',pathname:'/'}).kind, 'cabinet');
  assert.equal(navigator.respond({text:'ВПР пароль 12345678',pathname:'/'}).kind, 'privacy');
});
