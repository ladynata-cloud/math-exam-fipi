'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const oldBoard = 'https://mathexam-board-ladynata.amvera.io';
const board = 'https://mathexam-board-ladynata.msk1.amvera.tech';
const video = 'https://mathexam-video-ladynata.msk1.amvera.tech';
const ordinary = read('trainers/trainer-board.html');
const group = read('trainers/group-board.js');
function between(source, start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, `Missing code section: ${start}`);
  return source.slice(from, to);
}
const ordinaryHelpers = between(ordinary, 'function normalizeServer(', '    function addBoardSeedToTrainerUrl(');
const groupHelper = between(group, 'function serverUrl(', '  function errorText(');
const normalize = vm.runInNewContext(ordinaryHelpers + ';normalizeServer', { DEFAULT_SERVER: board, URL });
const groupServer = vm.runInNewContext(groupHelper + ';serverUrl', { DEFAULT_SERVER: board, URL });

test('ordinary board redirects only the exact retired HTTPS origin', () => {
  for (const value of [oldBoard, oldBoard + '/', '  ' + oldBoard + '///  ']) assert.equal(normalize(value), board);
  for (const value of [board, 'http://127.0.0.1:3000', 'https://custom.example',
    oldBoard + '.evil.test', oldBoard + '/proxy', oldBoard + '?server=other',
    oldBoard.replace('https:', 'http:'), 'https://user@mathexam-board-ladynata.amvera.io']) {
    assert.equal(normalize(value), value, value);
  }
});
test('ordinary saved teacher session keeps identity and access fields', () => {
  const session = { role: 'teacher', roomId: 'synthetic-room', teacherToken: 'synthetic-teacher',
    studentToken: 'synthetic-student', server: oldBoard, savedAt: 'synthetic-date' };
  const restore = vm.runInNewContext(ordinaryHelpers + ';readTeacherRoomSession', {
    DEFAULT_SERVER: board, URL, TEACHER_SESSION_KEY: 'synthetic-key',
    sessionStorage: { getItem: () => JSON.stringify(session) }
  });
  assert.deepEqual(JSON.parse(JSON.stringify(restore(session.roomId))), { ...session, server: board });
  assert.equal(restore('another-room'), null);
});
test('group board keeps URL validation and changes only the retired origin', () => {
  assert.equal(groupServer(oldBoard + '/'), board);
  for (const value of [board, 'https://custom.example', 'http://127.0.0.1:3000', oldBoard + '.evil.test']) {
    assert.equal(groupServer(value), value);
  }
  for (const value of [oldBoard + '/path', oldBoard + '?x=1', oldBoard + '#x',
    'https://user@mathexam-board-ladynata.amvera.io', oldBoard.replace('https:', 'http:')]) {
    assert.throws(() => groupServer(value), undefined, value);
  }
});
test('saved group session is migrated before its authenticated request', async () => {
  const session = { id: 'synthetic-lesson', token: 'synthetic-access', server: oldBoard };
  const calls = [];
  const initCode = between(group, '  async function init()', "  $('createForm')");
  const context = vm.createContext({
    DEFAULT_SERVER: board, URL, URLSearchParams, credentials: null,
    location: { hash: '', search: '?lesson=synthetic-lesson' },
    sessionStorage: { getItem: () => JSON.stringify(session) },
    sessionKey: id => id, $: () => ({}), notice: () => {},
    rememberSession: () => { calls.push(['remember', JSON.parse(JSON.stringify(context.credentials))]); },
    request: async route => { calls.push(['request', context.credentials.server, route]); return {}; },
    startSession: async () => {}, checkCapability: async () => {}
  });
  await vm.runInContext(groupHelper + initCode + ';init()', context);
  assert.deepEqual(calls, [
    ['remember', { ...session, server: board }],
    ['request', board, '/api/group-lessons/synthetic-lesson']
  ]);
});
test('public entries and video exports target restored applications', () => {
  for (const name of ['index.html', 'courses/index.html', 'laboratory/index.html',
    'oge/index.html', 'trainers/oge-course/index.html', 'ege-baza/index.html',
    'ege-baza/app.js', 'ege-baza/path/app.js', 'foundations/index.html', 'foundations/course.js',
    'grade7/index.html', 'grade7/course.js', 'learning/grade7-route-map.js',
    'video-lessons/cheatsheets.html', 'video-lessons/cheatsheets.js']) {
    assert(read(name).includes(board), name + ': restored cabinet entry');
    assert(!read(name).includes(oldBoard), name + ': no retired cabinet entry');
  }
  for (const name of ['video-lessons/export.js', 'trainers/dvi/math-18-20-video-studio.html']) {
    assert(read(name).includes(video), name + ': restored video API');
    assert(!read(name).includes('https://mathexam-video-ladynata.amvera.io'), name + ': no retired video API');
  }
});
test('legacy progress clients retain matching teacher and learner endpoints', () => {
  for (const prefix of ['trainers/algebra-7/control-work',
    'trainers/ege-profile/yashchenko-lines-1-2', 'trainers/dvi/math-18-20']) {
    for (const suffix of ['.html', '-teacher.html']) {
      const source = read(prefix + suffix);
      assert(source.includes(board), prefix + suffix);
      assert(!source.includes(oldBoard), prefix + suffix);
      assert(source.includes('http://127.0.0.1:3000'), 'Local development remains available');
    }
  }
});
