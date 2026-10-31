'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourcePath = '/ege-profil/start/index.html';
const publicAssistantScripts = [
  '/assets/assistant/data.js?v=public-assistant-20261031',
  '/assets/assistant/widget.js?v=public-assistant-20261031'
];
const courses = [
  { number: 1, marker: 'planimetry', ids: ['geo-angles', 'geo-right', 'geo-similarity', 'geo-area', 'geo-quadrilaterals', 'geo-circle'] },
  { number: 2, marker: 'vectors', ids: ['vec-coordinates', 'vec-length', 'vec-operations', 'vec-dot'] },
  { number: 4, marker: 'probability', ids: ['prob-count', 'prob-complement', 'prob-range'] },
  { number: 6, marker: 'random-variables', ids: ['prob-distribution', 'prob-variance', 'prob-continuous'] },
  { number: 7, marker: 'equations', ids: ['algebra-exponential', 'algebra-logarithmic', 'eq-linear', 'eq-rational', 'eq-quadratic', 'eq-root'] }
];
function picker(origin = 'https://mathexam.space') {
  const sandbox = { window: {}, location: new URL(origin + '/trainers/trainer-board.html'), URL };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'trainers/board-picker.js'), 'utf8'), sandbox);
  return sandbox.window.BoardPicker;
}
function courseRoutes(course) {
  const routes = ['#exam/' + course.number, '#calm/' + course.number];
  for (const id of course.ids) {
    for (const page of ['lesson', 'example']) routes.push('#' + page + '/' + id);
    for (const page of ['practice', 'repair', 'pause']) {
      for (const mode of ['guided', 'plan', 'independent']) routes.push('#' + page + '/' + id + '/' + mode);
    }
  }
  return routes;
}
const scripts = html => [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(match => match[1]);

test('the five route inventories match the authored 22 topics / 132 tasks', () => {
  const data = {};
  for (const file of ['geometry-data.js', 'algebra-data.js', 'probability-data.js', 'equations-data.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, 'ege-profil/start', file), 'utf8'), data);
  }
  let tasks = 0, topics = 0;
  for (const course of courses) {
    const lessons = data.ProfileLessons.filter(lesson => lesson.position === course.number);
    assert.deepEqual(Array.from(lessons, lesson => lesson.id).sort(), [...course.ids].sort());
    assert.equal(lessons.every(lesson => lesson.tasks.length === 6), true);
    topics += lessons.length;
    tasks += lessons.reduce((count, lesson) => count + lesson.tasks.length, 0);
  }
  assert.equal(topics, 22);
  assert.equal(tasks, 132);
});

for (const course of courses) {
  const wrapperPath = '/trainers/ege-profile-' + course.marker + '.html';
  test('section ' + course.number + ': exact literal aliases cover every supported route and preserve query', () => {
    const { normalize, canonical } = picker();
    for (const source of [sourcePath, '/ege-profil/start/', 'https://mathexam.space' + sourcePath,
      'https://mathexam.space:443' + sourcePath, '//mathexam.space' + sourcePath, 'mathexam.space' + sourcePath]) {
      for (const hash of courseRoutes(course)) {
        assert.equal(normalize(source + hash), wrapperPath + hash, source + hash);
      }
    }
    const query = '?unit=' + course.ids[0] + '&seed=123&note=%2B+%26';
    const hash = '#practice/' + course.ids[0] + '/independent';
    const alias = wrapperPath + query + hash;
    assert.equal(normalize(sourcePath + query + hash), alias);
    assert.equal(normalize(alias), alias);
    assert.equal(canonical(sourcePath + query + hash), canonical(alias));
    assert.equal(new URL(canonical(alias), 'https://mathexam.space').searchParams.has('seed'), false);
    const local = picker('http://127.0.0.1:5173');
    assert.equal(local.normalize('http://127.0.0.1:5173' + sourcePath + hash), wrapperPath + hash);
  });

  test('section ' + course.number + ': malformed, foreign and encoded sources gain no alias', () => {
    const { normalize } = picker();
    const id = course.ids[0], hash = '#exam/' + course.number;
    for (const badHash of ['', '#home', '#exam/0' + course.number, hash + '/extra', '#%65xam/' + course.number,
      '#lesson/' + id + '/extra', '#lesson/' + id.toUpperCase(), '#practice/' + id,
      '#practice/' + id + '/other', '#practice/' + id + '/guided/extra', '#pause/' + id,
      '#example/' + id + '/guided', '#repair-task/' + id]) {
      assert.equal(normalize(sourcePath + badHash), sourcePath + badHash);
    }
    for (const url of ['https://example.org' + sourcePath, 'https://sub.mathexam.space' + sourcePath,
      'http://mathexam.space' + sourcePath, 'https://mathexam.space:444' + sourcePath,
      '/ege-profil/start/../start/index.html', '/ege-profil/start/%2e%2e/start/index.html',
      '/ege-profil/start/%69ndex.html', '/ege-profil/start\\index.html', '../ege-profil/start/index.html']) {
      assert.equal(normalize(url + hash), url + hash, url);
    }
    for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x',
      'https://name:password@mathexam.space' + sourcePath + hash,
      '/trainers/trainer-board.html', '/trainers/%74rainer-board.html', sourcePath + '\n' + hash]) {
      assert.throws(() => normalize(url), url);
    }
    for (const other of courses.filter(other => other !== course)) {
      const otherHash = '#exam/' + other.number;
      assert.equal(normalize(sourcePath + otherHash), '/trainers/ege-profile-' + other.marker + '.html' + otherHash);
      assert.equal(normalize(wrapperPath + otherHash), wrapperPath + otherHash, 'wrapper cannot be silently reclassified');
    }
  });

  test('section ' + course.number + ': wrapper uses the canonical assets and existing bridge', () => {
    const wrapper = fs.readFileSync(path.join(root, wrapperPath), 'utf8');
    const canonical = fs.readFileSync(path.join(root, sourcePath), 'utf8');
    const bridge = '/trainers/board-bridge.js';
    const adapter = '/ege-profil/start/board-session.js?v=20261024-added-board';
    const wrapperScripts = scripts(wrapper);
    const canonicalScripts = scripts(canonical);
    assert.deepEqual(canonicalScripts.filter(src => src.startsWith('/assets/assistant/')), publicAssistantScripts,
      'Only the exact public navigation scripts are included on the canonical page');
    assert.deepEqual(wrapperScripts.filter(src => src.startsWith('/assets/assistant/')), [],
      'Board wrappers must not include the public navigation helper');
    assert.deepEqual(wrapperScripts.filter(src => src !== bridge && src !== adapter),
      canonicalScripts.filter(src => !src.startsWith('../learning/') && !publicAssistantScripts.includes(src))
        .map(src => '/ege-profil/start/' + src));
    const app = wrapperScripts.findIndex(src => src.startsWith('/ege-profil/start/app.js?'));
    assert.deepEqual(wrapperScripts.slice(app - 2, app), [bridge, adapter]);
    assert.match(wrapper, new RegExp('<body data-profile-board="' + course.marker + '">'));
    assert.match(wrapper, new RegExp('href="#exam/' + course.number + '">Темы №' + course.number + '</a>'));
    assert.match(wrapper, /Совместная работа на доске · без зачёта в личный прогресс/);
    assert.doesNotMatch(wrapper, /<base\b|<iframe\b|http-equiv\s*=\s*["']refresh|location\.(?:replace|assign)/i);
    for (const id of ['main', 'storage-warning', 'calm-toggle']) assert.match(wrapper, new RegExp('id="' + id + '"'));
    const styles = [...wrapper.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match => match[1]);
    for (const src of [...wrapperScripts, ...styles]) {
      assert.equal(src.startsWith('/'), true, src);
      assert.equal(fs.statSync(path.join(root, new URL(src, 'https://mathexam.space').pathname)).isFile(), true, src);
    }
  });

  test('section ' + course.number + ': one picker overview has a separate exact registry authorization', () => {
    const { canonical } = picker();
    const catalog = JSON.parse(fs.readFileSync(path.join(root, 'trainers/board-picker-data.json'), 'utf8'));
    const overviews = catalog.entries.filter(entry => canonical(entry.href) === wrapperPath + '#exam/' + course.number);
    assert.equal(overviews.length, 1);
    assert.match(overviews[0].title, new RegExp('ЕГЭ профиль №' + course.number));
    assert.equal(overviews[0].group, 'ЕГЭ профиль · понятный старт 2027');
    const { canonicalTrainerFile, loadTrainerRegistry } = require('../board-server/trainer-registry');
    assert.equal(canonicalTrainerFile(sourcePath.slice(1)), null);
    assert.equal(canonicalTrainerFile(wrapperPath.slice(1)), wrapperPath.slice(1));
    const registry = loadTrainerRegistry({ env: {} });
    assert.deepEqual(registry.getByTrainerUrl(wrapperPath + '#exam/' + course.number), {
      trainerId: 'ege-profile-' + course.marker, file: wrapperPath.slice(1), version: '1.0.0',
      stateSchemaVersion: 1, bridgeProtocolVersion: 1, allowLegacyHtml: false
    });
    assert.equal(registry.getByTrainerUrl(sourcePath + '#exam/' + course.number), null);
  });
}
