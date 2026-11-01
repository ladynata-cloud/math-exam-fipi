'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourcePath = '/ege-profil/start/index.html';
const wrapperPath = '/trainers/ege-profile-stereometry.html';
const expressionsPath = '/trainers/ege-profile-expressions.html';
const lessonIds = [
  'stereo-box', 'stereo-cube', 'stereo-prism', 'stereo-pyramid',
  'stereo-cylinder', 'stereo-cone', 'stereo-sphere', 'stereo-compound'
];
const expressionsIds = [
  'expr-powers', 'expr-roots', 'expr-fractions', 'expr-logarithms',
  'algebra-cosine', 'algebra-double-angle'
];

function picker(origin = 'https://mathexam.space') {
  const sandbox = {
    window: {},
    location: new URL(origin + '/trainers/trainer-board.html'),
    URL
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'trainers/board-picker.js'), 'utf8'), sandbox);
  return sandbox.window.BoardPicker;
}

function courseRoutes(number, ids) {
  const routes = ['#exam/' + number, '#calm/' + number];
  for (const id of ids) {
    for (const page of ['lesson', 'example']) routes.push('#' + page + '/' + id);
    for (const page of ['practice', 'repair', 'pause']) {
      for (const mode of ['guided', 'plan', 'independent']) routes.push('#' + page + '/' + id + '/' + mode);
    }
  }
  return routes;
}

test('the original task 3 URL and literal same-origin entry aliases open the stereometry wrapper', () => {
  const { normalize } = picker();
  for (const source of [
    'https://mathexam.space' + sourcePath,
    'https://mathexam.space:443' + sourcePath,
    '//mathexam.space' + sourcePath,
    'mathexam.space' + sourcePath,
    sourcePath,
    '/ege-profil/start/'
  ]) {
    assert.equal(normalize(source + '#exam/3'), wrapperPath + '#exam/3', source);
  }
  const local = picker('http://127.0.0.1:5173');
  assert.equal(local.normalize('http://127.0.0.1:5173' + sourcePath + '#exam/3'), wrapperPath + '#exam/3');
});

test('the eight authored stereometry lessons and all complete supported routes are aliased', () => {
  const data = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'ege-profil/start/stereo-data.js'), 'utf8'), data);
  assert.deepEqual(Array.from(data.ProfileLessons, lesson => lesson.id), lessonIds);
  assert.equal(data.ProfileLessons.every(lesson => lesson.position === 3), true);
  const { normalize } = picker();
  const routes = courseRoutes('3', lessonIds);
  assert.equal(routes.length, 90);
  for (const hash of routes) assert.equal(normalize(sourcePath + hash), wrapperPath + hash, hash);
  for (const hash of [
    '', '#home', '#calm', '#progress', '#checkpoint', '#exam/5', '#exam/15', '#calm/9',
    '#lesson/geo-unknown', '#lesson/stereo-t14', '#example/stereo-other', '#repair-task/stereo-box',
    '#practice/stereo-box', '#practice/stereo-box/other', '#practice/stereo-box/guided/extra',
    '#lesson/stereo-box/extra', '#example/stereo-box/guided', '#pause/stereo-box',
    '#exam/03', '#exam/3/', '#exam/3/extra', '#lesson/STEREO-box', '#%65xam/3'
  ]) {
    assert.equal(normalize(sourcePath + hash), sourcePath + hash, hash);
  }
});

test('task 8 retains its own complete route alias and cannot enter the task 3 wrapper', () => {
  const { normalize } = picker();
  for (const hash of courseRoutes('8', expressionsIds)) {
    assert.equal(normalize(sourcePath + hash), expressionsPath + hash, hash);
  }
  assert.equal(normalize(expressionsPath + '#exam/3'), expressionsPath + '#exam/3');
  assert.equal(normalize(wrapperPath + '#exam/8'), wrapperPath + '#exam/8');
});

test('stereometry alias preserves query and hash and keeps recent-entry normalization idempotent', () => {
  const { normalize, canonical } = picker();
  const query = '?route=lesson&unit=stereo-box&seed=123&note=%2B+%26';
  const hash = '#practice/stereo-box/guided';
  const alias = wrapperPath + query + hash;
  assert.equal(normalize('https://mathexam.space' + sourcePath + query + hash), alias);
  assert.equal(normalize(alias), alias);
  assert.equal(canonical(sourcePath + query + hash), canonical(alias));
  assert.equal(new URL(canonical(alias), 'https://mathexam.space').searchParams.has('seed'), false);
});

test('foreign origins and nonliteral source paths never gain the stereometry alias', () => {
  const { normalize } = picker();
  for (const url of [
    'https://example.org' + sourcePath + '#exam/3',
    'https://sub.mathexam.space' + sourcePath + '#exam/3',
    'http://mathexam.space' + sourcePath + '#exam/3',
    'https://mathexam.space:444' + sourcePath + '#exam/3',
    '//example.org' + sourcePath + '#exam/3',
    '/other/start/index.html#exam/3',
    '/ege-profil/start/../start/index.html#exam/3',
    '/ege-profil/start/%2e%2e/start/index.html#exam/3',
    '/ege-profil/start/%69ndex.html#exam/3',
    '/ege-profil/start\\index.html#exam/3',
    '../ege-profil/start/index.html#exam/3'
  ]) {
    assert.equal(normalize(url), url, url);
  }
  for (const url of [
    'javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x',
    'https://name:password@mathexam.space' + sourcePath + '#exam/3',
    '/trainers/trainer-board.html', '/x/../trainers/trainer-board.html',
    '/trainers/%74rainer-board.html', 'https://other.example/trainers/trainer-board.html',
    '/ege-profil/start/index.html\n#exam/3'
  ]) assert.throws(() => normalize(url), url);
});

test('the stereometry wrapper reuses canonical assets and the existing bridge without nested navigation', () => {
  const wrapper = fs.readFileSync(path.join(root, wrapperPath), 'utf8');
  const canonical = fs.readFileSync(path.join(root, sourcePath), 'utf8');
  const scripts = html => [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(match => match[1]);
  const canonicalScripts = scripts(canonical)
    .filter(src => !src.startsWith('../learning/'))
    .map(src => '/ege-profil/start/' + src);
  const wrapperScripts = scripts(wrapper);
  const bridge = '/trainers/board-bridge.js';
  const adapter = '/ege-profil/start/board-session.js?v=20261101-trainer-repair';
  assert.deepEqual(wrapperScripts.filter(src => src !== bridge && src !== adapter), canonicalScripts);
  const app = wrapperScripts.findIndex(src => src.startsWith('/ege-profil/start/app.js?'));
  assert.deepEqual(wrapperScripts.slice(app - 2, app), [bridge, adapter]);
  assert.doesNotMatch(wrapper, /<base\b|<iframe\b|http-equiv\s*=\s*["']refresh|location\.(?:replace|assign)/i);
  assert.match(wrapper, /<body data-profile-board="stereometry">/);
  for (const id of ['main', 'storage-warning', 'calm-toggle']) assert.match(wrapper, new RegExp('id="' + id + '"'));
  assert.match(wrapper, /href="#exam\/3">Темы №3<\/a>/);
  assert.match(wrapper, /Совместная работа на доске · без зачёта в личный прогресс/);
  assert.doesNotMatch(wrapper, /Результаты хранятся в этом браузере/);
  const styles = [...wrapper.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match => match[1]);
  for (const src of [...wrapperScripts, ...styles]) {
    assert.equal(src.startsWith('/'), true, src);
    assert.equal(fs.statSync(path.join(root, new URL(src, 'https://mathexam.space').pathname)).isFile(), true, src);
  }
});

test('the picker exposes one searchable task 3 overview with a separate exact registry authorization', () => {
  const { canonical } = picker();
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'trainers/board-picker-data.json'), 'utf8'));
  const overview = catalog.entries.filter(entry => canonical(entry.href) === wrapperPath + '#exam/3');
  assert.equal(overview.length, 1);
  assert.match(overview[0].title, /ЕГЭ профиль №3.*стереометрия.*параллелепипед.*куб.*призма.*пирамида.*цилиндр.*конус.*шар.*составные тела/);
  assert.equal(catalog.entries.filter(entry => canonical(entry.href) === expressionsPath + '#exam/8').length, 1);
  const { canonicalTrainerFile, loadTrainerRegistry } = require('../board-server/trainer-registry');
  assert.equal(canonicalTrainerFile(sourcePath.slice(1)), null);
  assert.equal(canonicalTrainerFile(wrapperPath.slice(1)), wrapperPath.slice(1));
  const registry = loadTrainerRegistry({ env: {} });
  assert.deepEqual(registry.getByTrainerUrl(wrapperPath + '#exam/3'), {
    trainerId: 'ege-profile-stereometry',
    file: wrapperPath.slice(1),
    version: '1.0.0',
    stateSchemaVersion: 1,
    bridgeProtocolVersion: 1,
    allowLegacyHtml: false
  });
  assert.equal(registry.getByTrainerUrl(sourcePath + '#exam/3'), null);
  assert.equal(registry.getByTrainerUrl(expressionsPath + '#exam/8').trainerId, 'ege-profile-expressions');
});
