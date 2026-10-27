'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourcePath = '/ege-profil/start/index.html';
const publicAssistantScripts = [
  '/assets/assistant/data.js?v=public-assistant-20261027',
  '/assets/assistant/widget.js?v=public-assistant-20261027'
];
const wrapperPath = '/trainers/ege-profile-expressions.html';
const lessonIds = [
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

test('the original expressions URL and literal same-origin entry aliases open the registered wrapper', () => {
  const { normalize } = picker();
  for (const source of [
    'https://mathexam.space' + sourcePath,
    'https://mathexam.space:443' + sourcePath,
    '//mathexam.space' + sourcePath,
    'mathexam.space' + sourcePath,
    sourcePath,
    '/ege-profil/start/'
  ]) {
    assert.equal(normalize(source + '#exam/8'), wrapperPath + '#exam/8', source);
  }
  const local = picker('http://127.0.0.1:5173');
  assert.equal(local.normalize('http://127.0.0.1:5173' + sourcePath + '#exam/8'), wrapperPath + '#exam/8');
});

test('only the six expressions lessons and their supported complete routes are aliased', () => {
  const { normalize } = picker();
  const hashes = ['#exam/8', '#calm/8'];
  for (const id of lessonIds) {
    for (const page of ['lesson', 'example']) hashes.push('#' + page + '/' + id);
    for (const page of ['practice', 'repair', 'pause']) {
      for (const mode of ['guided', 'plan', 'independent']) hashes.push('#' + page + '/' + id + '/' + mode);
    }
  }
  for (const hash of hashes) {
    assert.equal(normalize(sourcePath + hash), wrapperPath + hash, hash);
  }
  for (const hash of [
    '', '#home', '#calm', '#progress', '#checkpoint', '#exam/5', '#calm/9',
    '#lesson/trig-angle', '#example/bridge-fractions', '#repair-task/expr-powers',
    '#practice/expr-powers', '#practice/expr-powers/other',
    '#practice/expr-powers/guided/extra', '#lesson/expr-powers/extra',
    '#exam/8/', '#exam/8/extra', '#lesson/EXPR-powers', '#%65xam/8'
  ]) {
    assert.equal(normalize(sourcePath + hash), sourcePath + hash, hash);
  }
});

test('alias preserves query and hash, is idempotent, and shares the canonical recent entry', () => {
  const { normalize, canonical } = picker();
  const query = '?route=lesson&unit=expr-powers&seed=123&note=%2B+%26';
  const hash = '#practice/expr-powers/guided';
  const alias = wrapperPath + query + hash;
  assert.equal(normalize('https://mathexam.space' + sourcePath + query + hash), alias);
  assert.equal(normalize(alias), alias);
  assert.equal(canonical(sourcePath + query + hash), canonical(alias));
  assert.equal(new URL(canonical(alias), 'https://mathexam.space').searchParams.has('seed'), false);
});

test('foreign origins and nonliteral source paths never gain the registered alias', () => {
  const { normalize } = picker();
  for (const url of [
    'https://example.org' + sourcePath + '#exam/8',
    'https://sub.mathexam.space' + sourcePath + '#exam/8',
    'http://mathexam.space' + sourcePath + '#exam/8',
    'https://mathexam.space:444' + sourcePath + '#exam/8',
    '//example.org' + sourcePath + '#exam/8',
    '/other/start/index.html#exam/8',
    '/ege-profil/start/../start/index.html#exam/8',
    '/ege-profil/start/%2e%2e/start/index.html#exam/8',
    '/ege-profil/start/%69ndex.html#exam/8',
    '/ege-profil/start\\index.html#exam/8',
    '../ege-profil/start/index.html#exam/8'
  ]) {
    assert.equal(normalize(url), url, url);
  }
});

test('existing URL rejection and ordinary trainer opening remain intact', () => {
  const { normalize } = picker();
  for (const url of [
    'javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x',
    'https://name:password@mathexam.space' + sourcePath + '#exam/8',
    '/trainers/trainer-board.html', '/x/../trainers/trainer-board.html',
    '/trainers/%74rainer-board.html', 'https://other.example/trainers/trainer-board.html',
    '/ege-profil/start/index.html\n#exam/8'
  ]) assert.throws(() => normalize(url), url);
  assert.equal(normalize('negative-numbers-line.html'), 'negative-numbers-line.html');
  assert.equal(normalize('trainers/negative-numbers-line.html'), '/trainers/negative-numbers-line.html');
  assert.equal(normalize('https://example.org/lesson'), 'https://example.org/lesson');
});

test('the wrapper reuses the original scripts in order without a base, redirect, or nested frame', () => {
  const wrapper = fs.readFileSync(path.join(root, wrapperPath), 'utf8');
  const canonical = fs.readFileSync(path.join(root, sourcePath), 'utf8');
  const scripts = html => [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(match => match[1]);
  const canonicalScripts = scripts(canonical);
  const wrapperScripts = scripts(wrapper);
  assert.deepEqual(canonicalScripts.filter(src => src.startsWith('/assets/assistant/')), publicAssistantScripts,
    'Only the exact public navigation scripts are included on the canonical page');
  assert.deepEqual(wrapperScripts.filter(src => src.startsWith('/assets/assistant/')), [],
    'Board wrappers must not include the public navigation helper');
  const bridge = '/trainers/board-bridge.js';
  const adapter = '/ege-profil/start/board-session.js?v=20261024-added-board';
  assert.deepEqual(wrapperScripts.filter(src => src !== bridge && src !== adapter),
    canonicalScripts.filter(src => !src.startsWith('../learning/') && !publicAssistantScripts.includes(src))
      .map(src => '/ege-profil/start/' + src));
  const app = wrapperScripts.findIndex(src => src.startsWith('/ege-profil/start/app.js?'));
  assert.deepEqual(wrapperScripts.slice(app - 2, app), [bridge, adapter]);
  assert.doesNotMatch(wrapper, /<base\b|<iframe\b|http-equiv\s*=\s*["']refresh|location\.(?:replace|assign)/i);
  assert.match(wrapper, /<body data-profile-board="expressions">/);
  for (const id of ['main', 'storage-warning', 'calm-toggle']) assert.match(wrapper, new RegExp('id="' + id + '"'));
  assert.match(wrapper, /href="#exam\/8">Темы №8<\/a>/);
  assert.doesNotMatch(wrapper, /Результаты хранятся в этом браузере/);
});

test('the picker has one searchable expressions overview and the registry keeps the exact trainer boundary', () => {
  const { canonical } = picker();
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'trainers/board-picker-data.json'), 'utf8'));
  const overview = catalog.entries.filter(entry => canonical(entry.href) === wrapperPath + '#exam/8');
  assert.equal(overview.length, 1);
  assert.match(overview[0].title, /ЕГЭ профиль №8.*степени.*корни.*дроби.*логарифмы.*тригонометрия/);
  const { canonicalTrainerFile, loadTrainerRegistry } = require('../board-server/trainer-registry');
  assert.equal(canonicalTrainerFile(sourcePath.slice(1)), null);
  assert.equal(canonicalTrainerFile(wrapperPath.slice(1)), wrapperPath.slice(1));
  const registry = loadTrainerRegistry({ env: {} });
  assert.deepEqual(registry.getByTrainerUrl(wrapperPath + '#exam/8'), {
    trainerId: 'ege-profile-expressions',
    file: wrapperPath.slice(1),
    version: '1.0.0',
    stateSchemaVersion: 1,
    bridgeProtocolVersion: 1,
    allowLegacyHtml: false
  });
  assert.equal(registry.getByTrainerUrl(sourcePath + '#exam/8'), null);
});
