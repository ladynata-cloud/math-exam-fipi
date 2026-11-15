'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const directory = 'ege-profil/azbuka-metodov';
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
for (const file of ['catalog', 'data', 'routes', 'engine', 'function-atlas', 'parameter-plane']) require('../' + directory + '/' + file + '.js');
const catalog = globalThis.ProfileAlphabetCatalog;
const lessons = globalThis.ProfileAlphabetLessons;
const engine = globalThis.ProfileAlphabetEngine;

test('foundations and exam routes reference valid current routes, with separate conditions for independent checks', () => {
  assert.equal(catalog.list.length, 11);
  assert.equal(Object.values(lessons).flatMap(Object.keys).length, 44);
  assert.equal(catalog.forNumber(15).find(item => item.id === 'coordinate-method').route, true);
  assert.equal(catalog.forNumber(19).find(item => item.id === 'function-atlas').next, 'parameter-methods');
  assert.equal(catalog.forNumber(19).find(item => item.id === 'parameter-methods').route, true);
  for (const alphabet of catalog.list) {
    assert.deepEqual(Object.keys(alphabet.skills), Object.keys(lessons[alphabet.id]));
    assert.deepEqual([...new Set(Object.values(alphabet.skills).flatMap(skill => skill.numbers))].sort((a, b) => a - b), alphabet.numbers);
    for (const [, href] of alphabet.refs) {
      const url = new URL(href, 'https://mathexam.space');
      const file = path.join(root, url.pathname, url.pathname.endsWith('/') ? 'index.html' : '');
      assert.ok(fs.statSync(file).isFile(), href);
    }
    for (const lesson of Object.values(lessons[alphabet.id])) {
      assert.equal(lesson.checks.length, 2);
      const exercises = [lesson.practice, ...lesson.checks];
      assert.equal(new Set(exercises.map(task => task.prompt)).size, 3);
      for (const [index, task] of exercises.entries())
        assert.ok(exercises.slice(index + 1).every(other => task.answers.every(answer => !engine.matches(answer, other.answers))),
          'An answer from a previous example must not solve a later condition');
      for (const task of exercises) {
        for (const answer of task.answers) assert.ok(engine.matches(answer, task.answers), answer);
        assert.equal(engine.matches('', task.answers), false);
        assert.ok(task.hint && task.explanation);
      }
    }
  }
  assert.ok(catalog.forNumber(16).some(alphabet => alphabet.id === 'domain'));
  assert.deepEqual(catalog.forNumber(6).map(item => item.id), ['random-variables']);
  assert.deepEqual(catalog.forNumber(2), []);
});

test('function atlas counts horizontal intersections over the full domain and at boundary levels', () => {
  const atlas = globalThis.ProfileFunctionAtlas;
  const boundaries = {
    constant: [0, 0, Infinity], line: [1, 1, 1], mod: [0, 1, 2],
    quadratic: [1, 2, 2], cubic: [1, 1, 1], quartic: [0, 1, 2],
    root: [0, 1, 1], cubeRoot: [1, 1, 1], inverse: [1, 0, 1], rational: [1, 1, 1],
    hole: [1, 1, 0], exp: [0, 0, 1], expDown: [0, 0, 1], log: [1, 1, 1], logDown: [1, 1, 1],
    sin: [0, Infinity, 0], cos: [0, Infinity, 0], tan: [Infinity, Infinity, Infinity],
    cot: [Infinity, Infinity, Infinity], piece: [1, 0, 0], absOut: [0, 2, 3], absIn: [0, 2, 2],
    plateau: [0, 0, Infinity], radical: [0, 2, 2], semicircle: [0, 2, 2]
  };
  assert.equal(atlas.entries.length, 25);
  for (const [id] of atlas.entries) {
    assert.deepEqual([-2, 0, 2].map(level => atlas.count(id, level)), boundaries[id], id);
  }
  for (const [id, level, count] of [
    ['rational', 1, 0], ['constant', 2, Infinity], ['piece', 1, Infinity],
    ['absOut', 1, 4], ['absOut', 3, 2], ['absIn', 0.5, 4], ['absIn', 1, 3],
    ['plateau', 3, 2], ['semicircle', 3, 1], ['semicircle', 3.5, 0], ['sin', 1, Infinity]
  ]) assert.equal(atlas.count(id, level), count, id + ' at ' + level);
});

test('the new routes resume an unfinished step and the atlas hides the previous check when its graph changes', () => {
  const dom = new JSDOM(source(directory + '/index.html'), {
    url: 'https://mathexam.space/ege-profil/azbuka-metodov/?exam=19#/function-atlas',
    runScripts: 'outside-only'
  });
  const w = dom.window;
  const engine = globalThis.ProfileAlphabetEngine;
  const draft = {
    phase: 1, attempts: [], helped: false, draft: 'первый черновик', events: [], independent: false
  };
  w.localStorage.setItem(engine.storageKey + 'function-atlas/shifts', JSON.stringify(draft));
  for (const file of ['catalog', 'data', 'routes', 'engine', 'diagrams', 'function-atlas', 'app'])
    w.eval(source(directory + '/' + file + '.js'));
  const d = w.document;
  const resume = d.querySelector('a.az-button.primary');
  assert.equal(resume.textContent, 'Продолжить маршрут');
  assert.match(resume.href, /#\/function-atlas\/shifts$/);
  const select = d.querySelector('.az-atlas select');
  select.value = 'hole';
  select.dispatchEvent(new w.Event('change'));
  assert.equal(d.querySelectorAll('.atlas-open').length, 1);
  assert.match(d.querySelector('.az-atlas-count').textContent, /равно 0/);
  const details = d.querySelector('.az-atlas details');
  details.open = true;
  select.value = 'plateau';
  select.dispatchEvent(new w.Event('change'));
  assert.equal(details.open, false);
  assert.match(d.querySelector('.az-atlas-count').textContent, /бесконечно/);
  const slider = d.querySelector('#az-atlas-level');
  slider.value = '3';
  slider.dispatchEvent(new w.Event('input'));
  assert.match(d.querySelector('.az-atlas-count').textContent, /равно 2/);
  w.close();
});

test('parameter-plane slices satisfy both original inequalities and keep the exact boundary points', () => {
  const { sliceAt } = globalThis.ProfileParameterPlane;
  for (const a of [-1, -Number.EPSILON, 1 + Number.EPSILON, 2, Infinity, NaN]) assert.equal(sliceAt(a), null);
  assert.deepEqual(sliceAt(0), { left: 0, right: 0 });
  assert.deepEqual(sliceAt(1), { left: -1, right: -1 });
  for (let step = 1; step < 100; step++) {
    const a = step / 100;
    const { left, right } = sliceAt(a);
    const satisfies = x => x ** 2 <= a + 1e-12 && (x + 1) ** 2 <= 1 - a + 1e-12;
    assert.ok(left < -a && -a < right);
    assert.ok([left, -a, right].every(satisfies));
    assert.ok(!satisfies(left - 0.001) && !satisfies(right + 0.001));
  }
  assert.ok(engine.matches('[0; 1]', lessons['parameter-methods'].plane.practice.answers));
  assert.equal(engine.matches('[0; 2]', lessons['parameter-methods'].plane.checks[0].answers), false);
  assert.ok(engine.matches('(0; 2]', lessons['parameter-methods'].plane.checks[0].answers));
  assert.ok(engine.matches('a = 1', lessons['parameter-methods'].plane.checks[1].answers));
});

test('parameter-plane prediction, written reasoning and an independent check work from the course link', () => {
  const index = new JSDOM(source('ege-profil/trainers/parameters-18/index.html'), {
    url: 'https://mathexam.space/ege-profil/trainers/parameters-18/index.html', runScripts: 'dangerously'
  });
  const entry = index.window.document.querySelector('#gMethods a.tcard');
  assert.ok(entry);
  const dom = new JSDOM(source(directory + '/index.html'), { url: entry.href, runScripts: 'outside-only' });
  index.window.close();
  const w = dom.window;
  for (const file of ['catalog', 'data', 'routes', 'engine', 'diagrams', 'function-atlas', 'parameter-plane', 'app'])
    w.eval(source(directory + '/' + file + '.js'));
  const d = w.document;
  const click = selector => d.querySelector(selector).click();
  const edit = (selector, value) => {
    const input = d.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new w.Event('input', { bubbles: true }));
  };
  const check = value => {
    edit('#az-answer', value);
    click('#az-form [type=submit]');
  };

  assert.match(w.location.hash, /\/parameter-methods\/plane$/);
  assert.match(d.querySelector('.az-navigation .az-button').href, /parameters-18\/index\.html#gMethods$/);
  assert.equal(d.querySelector('[data-plane-slice]').children.length, 0);
  click('[data-plane-predict=yes]');
  assert.ok(d.querySelector('[data-plane-slice] line'));
  click('[data-plane-exact="0"]');
  assert.equal(d.querySelector('[data-plane-slice]').children.length, 0);
  click('[data-plane-predict=yes]');
  assert.match(d.querySelector('[data-plane-feedback]').textContent, /x = 0/);
  click('[data-hint]');
  assert.equal(d.querySelector('#az-plane-level').value, '0');
  assert.ok(d.querySelector('[data-plane-slice] circle'));
  edit('#az-plane-level', '-0.25');
  click('[data-plane-predict=yes]');
  assert.match(d.querySelector('[data-plane-feedback]').textContent, /мимо общей области/);
  click('[data-plane-exact="1"]');
  click('[data-plane-predict=yes]');
  assert.match(d.querySelector('[data-plane-feedback]').textContent, /x = −1/);

  edit('#az-note', 'Квадраты неотрицательны, беру x = −a.');
  check('[0;1]');
  click('[data-advance]');
  assert.equal(d.querySelector('[data-parameter-plane]'), null);
  assert.match(d.querySelector('label[for=az-note]').textContent, /какая граница входит/);
  check('[0;2]');
  assert.match(d.querySelector('#az-feedback').textContent, /Пока не сходится/);
  check('(0;2]');
  click('[data-advance]');
  assert.match(d.querySelector('label[for=az-note]').textContent, /только одна пара/);
  check('a = 1');
  click('[data-advance]');
  const saved = JSON.parse(w.localStorage.getItem(engine.storageKey + 'parameter-methods/plane'));
  assert.equal(saved.independent, true);
  assert.match(saved.note, /беру x = −a/);
  assert.ok(saved.events.some(event => event.type === 'hint'));
  assert.ok(saved.events.some(event => event.type === 'wrong'));
  assert.match(d.querySelector('.az-exercise a').href, /#exam\/19$/);
  w.close();
});

test('explicit number forms, restriction notation, and alternate keyboard layouts', () => {
  assert.ok(engine.matches('0,5', ['1/2']));
  assert.ok(engine.matches('2 / 4', ['1/2']));
  assert.equal(engine.matches('1/0', ['1/2']), false);
  assert.equal(engine.matches('1 * 2', ['12']), false);
  assert.ok(engine.matches('х ≠ −5', ['x!=-5', 'x≠-5']));
  assert.ok(engine.matches('3·x + 2', ['3x+2']));
  assert.ok(engine.matches('t² + 2t − 8', ['t^2+2t-8']));
  assert.equal(engine.matches('t2+2t-8', ['t^2+2t-8']), false);
});

test('only a fresh unassisted check earns the skill and review keeps history', () => {
  const lesson = lessons.domain.denominator;
  const map = new Map();
  const storage = { getItem: id => map.get(id), setItem: (id, value) => map.set(id, value) };
  const store = engine.create(storage);
  const id = 'domain/denominator';
  const record = store.read(id);
  assert.equal(engine.check(record, lesson, ''), null);
  assert.equal(engine.check(record, lesson, '3'), true);
  assert.equal(record.independent, false);
  engine.advance(record, lesson);
  engine.hint(record, lesson);
  assert.equal(engine.check(record, lesson, 'x!=-5'), true);
  assert.equal(record.independent, false);
  engine.advance(record, lesson);
  assert.equal(engine.check(record, lesson, 'x≠4'), true);
  engine.advance(record, lesson);
  assert.equal(engine.question(record, lesson), undefined);
  assert.equal(engine.progress(store.save(id, record), lesson), 'verified');
  assert.equal(engine.progress(engine.create(storage).read(id), lesson), 'verified');
  const repeated = engine.restart(record);
  assert.equal(repeated.independent, true);
  assert.ok(repeated.events.some(event => event.type === 'hint'));
  assert.equal(repeated.events.at(-1).type, 'repeat');

  const retry = store.read('fresh');
  engine.check(retry, lesson, '3');
  engine.advance(retry, lesson);
  engine.check(retry, lesson, 'x≠5');
  engine.check(retry, lesson, 'x≠-5');
  engine.advance(retry, lesson);
  engine.hint(retry, lesson);
  engine.check(retry, lesson, 'x≠4');
  engine.advance(retry, lesson);
  const familiar = engine.restart(retry);
  engine.check(familiar, lesson, '3');
  engine.advance(familiar, lesson);
  engine.check(familiar, lesson, 'x≠-5');
  assert.equal(familiar.independent, false);
  assert.ok(familiar.events.some(event => event.type === 'wrong'));
});

test('return URLs preserve course context and reject other origins and arbitrary pages', () => {
  const source = '/ege-profil/part-two/index.html#task/p16-cancelled-hole-3/guided';
  const url = new URL(catalog.href('domain', 'denominator', 16, source), 'https://mathexam.space');
  assert.equal(url.searchParams.get('exam'), '16');
  assert.equal(url.searchParams.get('back'), source);
  assert.equal(catalog.safeBack('/ege-profil/start/index.html?skills=1&view=full#practice/eq/guided'),
    '/ege-profil/start/index.html?view=full#practice/eq/guided');
  for (const unsafe of ['//example.com/ege-profil/start/#calm/16','https://example.com/', '/\\example.com/', '//[','/login','/ege-profil/part-two/#wrong'])
    assert.equal(catalog.safeBack(unsafe), '');
});

test('skill map opens the specific lesson with a return path, and existing challenge remains', () => {
  const dom = new JSDOM('<main></main>', {
    url: 'https://mathexam.space/ege-profil/part-two/index.html#task/p16-cancelled-hole-3/guided',
    runScripts: 'outside-only'
  });
  const w = dom.window;
  for (const file of [directory + '/catalog.js', 'ege-profil/skill-map-data.js', 'ege-profil/skill-map.js']) w.eval(source(file));
  const container = w.document.querySelector('main');
  w.ProfileSkillMap.mount(container, [16]);
  container.querySelector('[data-profile-skill-trigger]').click();
  const links = [...container.querySelectorAll('[data-profile-alphabet-link]')];
  const target = links.find(link => link.textContent === 'Исключаю нули знаменателя');
  assert.ok(target);
  const url = new URL(target.href);
  assert.equal(url.hash, '#/domain/denominator');
  assert.match(url.searchParams.get('back'), /#task\/p16-cancelled-hole-3\/guided$/);
  assert.ok(container.querySelector('[data-profile-skill-challenge]'));
  container.replaceChildren();
  w.history.replaceState({}, '', '#exam/19');
  w.ProfileSkillMap.mount(container, [19]);
  container.querySelector('[data-profile-skill-trigger]').click();
  const plane = [...container.querySelectorAll('[data-profile-alphabet-link]')].find(link => link.hash.endsWith('/plane'));
  assert.ok(plane);
  assert.equal(new URL(plane.href).searchParams.get('back'), '/ege-profil/part-two/index.html#exam/19');
  w.close();
});

test('skill checks, hint recovery, reload and journal work through the learner interface', () => {
  const dom = new JSDOM(source(directory + '/index.html'), {
    url: 'https://mathexam.space/ege-profil/azbuka-metodov/?exam=16#/domain/denominator',
    runScripts: 'outside-only'
  });
  const w = dom.window;
  for (const file of ['catalog', 'data', 'engine', 'diagrams', 'app']) w.eval(source(directory + '/' + file + '.js'));
  const d = w.document;
  const click = selector => d.querySelector(selector).click();
  const enter = value => {
    const input = d.querySelector('#az-answer');
    input.value = value;
    input.dispatchEvent(new w.Event('input', { bubbles: true }));
    d.querySelector('#az-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  };
  enter('');
  assert.match(d.querySelector('#az-feedback').textContent, /Введи/);
  enter('3');
  click('[data-advance]');
  click('[data-hint]');
  enter('x ≠ −5');
  click('[data-advance]');
  enter('x ≠ 4');
  click('[data-advance]');
  assert.match(d.querySelector('.az-exercise').textContent, /Самостоятельная проверка пройдена/);
  assert.match(d.querySelector('.az-history').textContent, /Подсказка/);
  assert.equal(d.querySelector('.az-skill-list [aria-current] .az-status').textContent, 'Самостоятельно');
  assert.equal(d.querySelector('.az-navigation .az-button').getAttribute('href'), '/ege-profil/part-two/index.html#exam/16');
  const data = JSON.parse(w.localStorage.getItem(engine.storageKey + 'domain/denominator'));
  assert.equal(data.independent, true);
  assert.equal(data.events.filter(event => event.type === 'correct').length, 3);
  w.close();
});
