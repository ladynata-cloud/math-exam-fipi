'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourcePath = '/stereo-course/merzlyak-10-base/';
const wrapperPath = '/trainers/merzlyak-10-base.html';

function picker(origin = 'https://mathexam.space') {
  const sandbox = { window: {}, location: new URL(origin + '/trainers/trainer-board.html'), URL };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'trainers/board-picker.js'), 'utf8'), sandbox);
  return sandbox.window.BoardPicker;
}

test('literal same-origin course entries open the Merzlyak board wrapper', () => {
  const { normalize } = picker();
  for (const entry of [sourcePath, sourcePath + 'index.html']) {
    for (const prefix of ['', 'https://mathexam.space', 'https://mathexam.space:443', '//mathexam.space', 'mathexam.space']) {
      assert.equal(normalize(prefix + entry), wrapperPath, prefix + entry);
    }
  }
  assert.equal(picker('http://127.0.0.1:5173').normalize('http://127.0.0.1:5173' + sourcePath), wrapperPath);
});

test('all published card deep links and queries survive the alias without granting extra registry paths', () => {
  const { normalize, canonical } = picker();
  const course = JSON.parse(fs.readFileSync(path.join(root, sourcePath, 'data/course.json'), 'utf8'));
  assert.equal(course.catalog.entries.length, 989);
  for (const entry of course.catalog.entries) {
    const suffix = '?from=course&note=%2B+%26#' + entry.id;
    const alias = wrapperPath + suffix;
    assert.equal(normalize(sourcePath + suffix), alias, entry.id);
    assert.equal(normalize(sourcePath + 'index.html' + suffix), alias, entry.id);
    assert.equal(normalize(alias), alias, 'idempotent: ' + entry.id);
    assert.equal(canonical(sourcePath + suffix), canonical(alias), 'same recent entry: ' + entry.id);
  }
  const query = '?seed=123&from=teacher#ex-16-010';
  assert.equal(normalize(sourcePath + query), wrapperPath + query);
  assert.equal(new URL(canonical(wrapperPath + query), 'https://mathexam.space').searchParams.has('seed'), false);
});

test('foreign, encoded, traversing and near-match course paths never gain the alias', () => {
  const { normalize } = picker();
  for (const value of [
    'https://example.org' + sourcePath,
    '//example.org' + sourcePath,
    'https://sub.mathexam.space' + sourcePath,
    'http://mathexam.space' + sourcePath,
    'https://mathexam.space:444' + sourcePath,
    '/stereo-course/merzlyak-10-base',
    '/stereo-course/merzlyak-10-base//',
    '/stereo-course/merzlyak-10-base/other.html',
    '/stereo-course/merzlyak-10-base/INDEX.html',
    '/stereo-course/Merzlyak-10-base/',
    '/stereo-course/merzlyak-10-base/%69ndex.html',
    '/stereo-course/%6derzlyak-10-base/',
    '/stereo-course/x/../merzlyak-10-base/',
    '/stereo-course/%2e/merzlyak-10-base/',
    '/stereo-course/merzlyak-10-base\\index.html',
    '../stereo-course/merzlyak-10-base/'
  ]) assert.equal(normalize(value), value, value);
  for (const value of [
    'javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x',
    'https://name:password@mathexam.space' + sourcePath,
    sourcePath + '\n#ex-16-010'
  ]) assert.throws(() => normalize(value), value);
});

test('the course is searchable once and only its wrapper has registry authorization', () => {
  const { canonical } = picker();
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'trainers/board-picker-data.json'), 'utf8'));
  const entries = catalog.entries.filter(entry => canonical(entry.href) === wrapperPath);
  assert.equal(entries.length, 1);
  assert.match(entries[0].title, /Мерзляк.*геометрия.*10 класс.*базовый уровень.*весь курс/);
  assert.equal(entries[0].group, 'Мерзляк · геометрия 10 класс');
  const { loadTrainerRegistry, canonicalTrainerFile } = require('../board-server/trainer-registry');
  const registry = loadTrainerRegistry({ env: {} });
  assert.equal(canonicalTrainerFile(sourcePath.slice(1) + 'index.html'), null);
  assert.equal(registry.getByTrainerUrl(sourcePath), null);
  assert.deepEqual(registry.getByTrainerUrl(wrapperPath + '?from=course#ex-16-010'), {
    trainerId: 'merzlyak-10-base', file: wrapperPath.slice(1), version: '1.0.0',
    stateSchemaVersion: 1, bridgeProtocolVersion: 1, allowLegacyHtml: false
  });
  assert.equal(registry.getById('merzlyak-10-base').allowLegacyHtml, false);
  assert.equal(registry.getProgressById('merzlyak-10-base'), null);
});

test('previous profile aliases and ordinary trainer opening remain unchanged', () => {
  const { normalize } = picker();
  assert.equal(normalize('/ege-profil/start/index.html#exam/3'), '/trainers/ege-profile-stereometry.html#exam/3');
  assert.equal(normalize('/ege-profil/start/index.html#exam/8'), '/trainers/ege-profile-expressions.html#exam/8');
  assert.equal(normalize('/trainers/negative-numbers-line.html'), '/trainers/negative-numbers-line.html');
  assert.throws(() => normalize('/trainers/trainer-board.html'));
});
