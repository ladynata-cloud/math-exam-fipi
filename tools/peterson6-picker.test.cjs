'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sourcePath = '/school/peterson6/index.html';
const wrapperPath = '/trainers/peterson6.html';

function picker(origin = 'https://mathexam.space') {
  const sandbox = { window: {}, location: new URL(origin + '/trainers/trainer-board.html'), URL };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'trainers/board-picker.js'), 'utf8'), sandbox);
  return sandbox.window.BoardPicker;
}
function course() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'school/peterson6/data.js'), 'utf8'), sandbox);
  return sandbox.window.PetersonCourse;
}

test('canonical Peterson entries resolve to the bounded registered wrapper on the same origin', () => {
  const { normalize } = picker();
  for (const source of [sourcePath, '/school/peterson6/', 'https://mathexam.space' + sourcePath,
    'https://mathexam.space:443' + sourcePath, '//mathexam.space' + sourcePath,
    'mathexam.space' + sourcePath]) {
    for (const hash of ['', '#home', '#skills', '#progress', '#diagnostic']) {
      assert.equal(normalize(source + hash), wrapperPath + hash, source + hash);
    }
  }
  for (const origin of ['http://127.0.0.1:5173', 'https://mathexam-board-ladynata.msk1.amvera.tech']) {
    assert.equal(picker(origin).normalize(origin + sourcePath + '#skills'), wrapperPath + '#skills');
  }
});

test('all 58 topics and every practice/check choice receive exact aliases', () => {
  const { normalize } = picker(), data = course();
  assert.equal(data.lessons.length, 58);
  let tasks = 0;
  for (const lesson of data.lessons) {
    assert.equal(normalize(sourcePath + '#lesson/' + lesson.id), wrapperPath + '#lesson/' + lesson.id);
    for (let i = 0; i < lesson.tasks.length; i++) {
      const hash = '#lesson/' + lesson.id + '/' + i;
      assert.equal(normalize(sourcePath + hash), wrapperPath + hash, hash); tasks++;
    }
    for (const index of [lesson.tasks.length, lesson.tasks.length + 1, -1, '00', '01', '1.5']) {
      const hash = '#lesson/' + lesson.id + '/' + index;
      assert.equal(normalize(sourcePath + hash), sourcePath + hash, hash);
    }
  }
  assert.equal(tasks, data.lessons.reduce((n,l)=>n+l.tasks.length,0));
  assert.equal(data.lessons.slice(0,14).reduce((n,l)=>n+l.tasks.length,0),224,'old subset retained');
  const math = require('../school/peterson6/math.js');
  assert.equal(math.skills.length, 43);
  for (const skill of math.skills) for (const level of [1, 2, 3]) for(const mode of ['practice','check']) {
    const hash = '#'+mode+'/' + skill.id + '/' + level;
    assert.equal(normalize(sourcePath + hash), wrapperPath + hash, hash);
  }
  for (const hash of ['#lesson/p00', '#lesson/p59', '#lesson/P01', '#lesson/p01/0/extra',
    '#lesson/p01/', '#lesson/p01/9007199254740992', '#practice/fraction-multiply',
    '#practice/unknown/1', '#practice/fraction-multiply/0', '#practice/fraction-multiply/4',
    '#practice/fraction-multiply/01', '#check/unknown/1', '#check/fraction-multiply/4', '#check/fraction-multiply/01', '#check/fraction-multiply/1/extra', '#diagnostic/extra', '#skills/extra', '#%68ome', '#home/', '#main']) {
    assert.equal(normalize(sourcePath + hash), sourcePath + hash, hash);
  }
});

test('alias retains query and hash, is idempotent, and canonical recents remove only the seed', () => {
  const { normalize, canonical } = picker();
  const query = '?seed=123&lesson=p08&note=%2B+%26', hash = '#practice/unlike-multiply/3';
  const expected = wrapperPath + query + hash;
  assert.equal(normalize(sourcePath + query + hash), expected);
  assert.equal(normalize(expected), expected);
  assert.equal(canonical(sourcePath + query + hash), canonical(expected));
  const parsed = new URL(canonical(expected), 'https://mathexam.space');
  assert.equal(parsed.searchParams.has('seed'), false);
  assert.equal(parsed.searchParams.get('lesson'), 'p08');
  assert.equal(parsed.searchParams.get('note'), '+ &');
  assert.equal(parsed.hash, hash);
});

test('foreign origins, encoded paths and traversal do not gain registry authorization', () => {
  const { normalize } = picker();
  for (const value of [
    'https://example.org' + sourcePath + '#skills',
    'https://sub.mathexam.space' + sourcePath + '#skills',
    'http://mathexam.space' + sourcePath + '#skills',
    'https://mathexam.space:444' + sourcePath + '#skills',
    '/school/peterson6', '/school/peterson6/../peterson6/index.html#skills',
    '/school/peterson6/%69ndex.html#skills', '/school/peterson6/%2e%2e/peterson6/index.html#skills',
    '../school/peterson6/index.html#skills', '/school/peterson6\\index.html#skills'
  ]) assert.equal(normalize(value), value, value);
  for (const value of ['javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x',
    'https://name:password@mathexam.space' + sourcePath, '/trainers/trainer-board.html',
    '/trainers/%74rainer-board.html', '/school/peterson6/index.html\n#skills']) {
    assert.throws(() => normalize(value), value);
  }
});

test('the wrapper is a thin copy of the canonical shell and uses the exact common runtime', () => {
  const wrapper = fs.readFileSync(path.join(root, wrapperPath), 'utf8');
  const canonical = fs.readFileSync(path.join(root, sourcePath), 'utf8');
  const scripts = html => [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(m => m[1]);
  const canonicalScripts = scripts(canonical).map(src => '/school/peterson6/' + src);
  const wrapperScripts = scripts(wrapper);
  const pathname = src => new URL(src, 'https://mathexam.space').pathname;
  const bridge = '/trainers/board-bridge.js', adapter = '/school/peterson6/board-session.js';
  assert.deepEqual(wrapperScripts.map(pathname).filter(src => src !== bridge && src !== adapter), canonicalScripts.map(pathname));
  assert.deepEqual(wrapperScripts.map(pathname).slice(-3), [bridge, adapter, '/school/peterson6/app.js']);
  assert.match(wrapper, /<body data-peterson-board="part1">/);
  assert.match(wrapper, /Совместная работа на доске · без зачёта в личный прогресс/);
  assert.doesNotMatch(wrapper, /<base\b|<iframe\b|http-equiv\s*=\s*["']refresh|location\.(?:replace|assign)/i);
  assert.doesNotMatch(wrapper, /Работа сохраняется в этом браузере/);
  for (const id of ['main', 'storage-warning']) assert.match(wrapper, new RegExp('id="' + id + '"'));
  for (const hash of ['home', 'skills', 'progress']) assert.match(wrapper, new RegExp('href="#' + hash + '"'));
  for (const src of wrapperScripts) {
    assert.equal(src.startsWith('/'), true);
    assert.equal(fs.statSync(path.join(root, pathname(src))).isFile(), true, src);
  }
});

test('one searchable course entry has an exact mirror declaration without a personal-credit claim', () => {
  const { canonical } = picker();
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'trainers/board-picker-data.json'), 'utf8'));
  const entries = catalog.entries.filter(entry => canonical(entry.href) === wrapperPath + '#home');
  assert.equal(entries.length, 1);
  assert.match(entries[0].title, /Петерсон.*6 класс.*части 1–3.*58 тем.*дроби.*43 тренировки/);
  const { canonicalTrainerFile, loadTrainerRegistry } = require('../board-server/trainer-registry');
  assert.equal(canonicalTrainerFile(sourcePath.slice(1)), null);
  const registry = loadTrainerRegistry({ env: {} });
  assert.deepEqual(registry.getByTrainerUrl(wrapperPath + '#skills'), {
    trainerId: 'peterson6', file: wrapperPath.slice(1), version: '2.0.0',
    stateSchemaVersion: 2, bridgeProtocolVersion: 1, allowLegacyHtml: false
  });
  assert.equal(registry.getByTrainerUrl(sourcePath + '#skills'), null);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'trainers/board-compat.json'), 'utf8'));
  const declaration = manifest.trainers.find(entry => entry.trainerId === 'peterson6');
  assert.equal(declaration.supportsBoardMirror, true);
  assert.equal(declaration.supportsSeed, false);
  assert.notEqual(declaration.supportsProgressTracking, true);
  assert.equal(registry.getByTrainerUrl('/trainers/ege-profile-expressions.html#exam/8').trainerId, 'ege-profile-expressions');
  assert.equal(registry.getByTrainerUrl('/trainers/ege-profile-stereometry.html#exam/3').trainerId, 'ege-profile-stereometry');
});
