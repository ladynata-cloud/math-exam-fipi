'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const directory = 'ege-profil/azbuka-metodov';
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
for (const file of ['catalog', 'data', 'engine']) require('../' + directory + '/' + file + '.js');
const catalog = globalThis.ProfileAlphabetCatalog;
const lessons = globalThis.ProfileAlphabetLessons;
const engine = globalThis.ProfileAlphabetEngine;

test('eight alphabets share 24 stable skills and reference valid current course routes', () => {
  assert.equal(catalog.list.length, 8);
  assert.equal(Object.values(lessons).flatMap(Object.keys).length, 24);
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
