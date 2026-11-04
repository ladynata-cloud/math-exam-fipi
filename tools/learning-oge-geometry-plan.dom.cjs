'use strict';

// Synthetic DOM and API fixtures only; no learner data or production writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const catalog = require('../learning/catalog');
const map = require('../learning/preparation-map');
const ROOT = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(ROOT, 'learning', name), 'utf8');
const IDS = ['oge-task15-triangles', 'oge-task16-circle', 'oge-task17-quadrilaterals', 'oge-task18-grid', 'task19-trainer'];
const URLS = IDS.map(id => 'https://mathexam.space/trainers/' + id + '.html');
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture(t) {
  const dom = new JSDOM('<main></main>', { url: 'https://cabinet.example/learning/', runScripts: 'outside-only' });
  dom.window.LearningCatalog = catalog;
  dom.window.LearningPreparation = map;
  dom.window.eval(source('attached-course.js'));
  dom.window.eval(source('preparation.js'));
  t.after(() => dom.window.close());
  return { window: dom.window, host: dom.window.document.querySelector('main'), ui: dom.window.LearningPreparationUI };
}
function checkCards(host, teacher = false, ids = IDS) {
  const cards = [...host.querySelectorAll('[data-plan-course]')];
  assert.deepEqual(cards.map(card => card.dataset.planCourse), ids);
  for (const card of cards) {
    const pathname = '/trainers/' + card.dataset.planCourse + '.html';
    assert.deepEqual([...card.querySelectorAll('a')].map(a => a.href), [
      'https://mathexam.space' + pathname,
      ...(teacher ? ['https://mathexam.space/trainers/trainer-board.html?trainer=' + encodeURIComponent(pathname)] : [])
    ]);
    for (const a of card.querySelectorAll('a')) {
      assert.equal(a.target, '_blank');
      assert.equal(a.rel, 'noopener noreferrer');
      assert(!a.hasAttribute('onclick'));
      assert(!a.hasAttribute('data-prep-start'));
      assert(!a.hasAttribute('data-route-item'));
    }
    assert.equal(card.querySelectorAll('[data-plan-course-board]').length, teacher ? 1 : 0);
  }
  const note = host.querySelector('[data-oge-geometry-plan-note]');
  assert(note);
  assert.match(note.textContent, /не входят в прогресс кабинета/);
  assert.match(note.textContent, /не считается самостоятельным решением/);
  assert.match(note.textContent, teacher ? /создайте комнату/ : /ссылку доски от преподавателя/);
  if (ids.includes('task19-trainer')) assert.equal(host.querySelector('[data-plan-course="task19-trainer"] h2').textContent, 'Геометрические утверждения');
}

test('exact plan references expose five fixed trainer cards with teacher-only board links', t => {
  const { host, ui } = fixture(t);
  for (const teacher of [false, true]) {
    host.innerHTML = ui.planCoursesMarkup('Прежние рекомендации.\n' + URLS.map(url => '(' + url + ').').join('\n') + '\n' + URLS[0], { teacher });
    checkCards(host, teacher);
    assert.equal(host.querySelectorAll('[data-oge-geometry-plan-note]').length, 1);
  }
  host.innerHTML = ui.planCoursesMarkup(URLS[2] + '\n' + URLS[4]);
  checkCards(host, false, [IDS[2], IDS[4]]);
});

test('malformed, deceptive, parameterized and unknown URLs cannot activate geometry cards', t => {
  const { ui, host } = fixture(t);
  const unsafe = ['', null, undefined, 'ОГЭ 15–19', 'javascript:alert(1)', '<img src=x onerror=alert(1)>'];
  for (const url of URLS) unsafe.push(
    url + '?', url + '?next=elsewhere', url + '#', url + '#lesson', url + '/other',
    url.replace('https:', 'http:'), url.replace('mathexam.space', 'mathexam.space.evil.test'),
    url.replace('mathexam.space', 'mathexam.space@evil.test'), url.replace('mathexam.space', 'mathexam.space:443'),
    url.replace('/trainers/', '/trainers/%2e%2e/trainers/'), url.replace('task', 'tаsk'),
    'https://evil.test/?next=' + url, 'prefix' + url, 'javascript:' + url, 'https://' + url
  );
  for (const value of unsafe) assert.equal(ui.planCoursesMarkup(value), '', String(value));
  host.innerHTML = ui.ogeGeometryCardsMarkup({ teacher: true, ids: ['<img src=x onerror=alert(1)>', 'https://evil.test/', IDS[0]] });
  checkCards(host, true, [IDS[0]]);
  assert.equal(host.querySelectorAll('img,script,[onerror]').length, 0);
  assert.equal(ui.ogeGeometryCardsMarkup({ ids: [] }), '');
});

test('existing Peterson and number-theory references remain unchanged alongside geometry links', t => {
  const { ui, host } = fixture(t);
  const previous = 'https://mathexam.space/school/peterson6/\nhttps://mathexam.space/trainers/grade6-nok.html\nhttps://mathexam.space/trainers/grade6-nod.html';
  const original = ui.planCoursesMarkup(previous, { teacher: true });
  const mixed = ui.planCoursesMarkup(previous + '\n' + URLS.join('\n'), { teacher: true });
  assert(mixed.startsWith(original));
  host.innerHTML = mixed;
  assert.equal(host.querySelectorAll('[data-plan-course]').length, 8);
  assert.equal(host.querySelectorAll('[data-plan-course-board]').length, 8);
  assert.equal(ui.planCoursesMarkup('Прежний план без ссылок'), '');
});

test('student home and route preserve the saved plan and never start or complete managed work', async t => {
  const plan = { items: [
    { catalogId: 'path:practice-river', reason: 'Сохрани предыдущую тему.', priority: 'high' },
    { catalogId: 'path:practice-time', reason: 'Повтори время.', priority: 'normal' }
  ], note: 'Прежняя рекомендация <b>это текст</b>.\n' + URLS.join('\n') };
  const before = JSON.stringify(plan);
  for (const page of ['home', 'route']) {
    const { host, ui } = fixture(t), calls = [], opened = [];
    ui.mountRoute(host, {
      account: { id: 'fixture-pupil', role: 'student' }, profile: { course: 'oge', goal: 'pass', focus: '' },
      page, catalog, labels: {}, attempts: [], assignments: [],
      api: async (route, options = {}) => {
        calls.push({ route, method: options.method || 'GET' });
        if (route === '/plan') return structuredClone(plan);
        if (route === '/progress') return { progress: [] };
        return { totalPoints: 0, pointsWithinLevel: 0, level: 1, nextLevelAt: 100, uniqueCompleted: 0, badges: [] };
      },
      openContent: async (...args) => opened.push(args)
    });
    await tick();
    checkCards(host);
    assert.deepEqual([...host.querySelectorAll('.prep-route-step')].map(n => n.dataset.prepItem), plan.items.map(item => item.catalogId));
    assert.equal(host.querySelector('.prep-route-note').textContent, plan.note);
    assert.equal(host.querySelector('.prep-route-note b'), null);
    for (const a of host.querySelectorAll('[data-plan-course] a')) { a.addEventListener('click', event => event.preventDefault()); a.click(); }
    assert.deepEqual(calls.map(call => call.route).sort(), ['/plan', '/progress', '/rewards']);
    assert(calls.every(call => call.method === 'GET'));
    assert.deepEqual(opened, []);
    assert.equal(JSON.stringify(plan), before);
  }
});
