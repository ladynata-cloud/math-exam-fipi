'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const boardSource = read('trainers/trainer-board.html');
const bundle = JSON.parse(read('stereo-course/sections/data/course.json'));
const origin = 'https://mathexam.space';
const wrapper = '/trainers/sections-from-zero.html';

function productionPart(start, end) {
  const first = boardSource.indexOf(start), last = boardSource.indexOf(end, first + start.length);
  assert(first >= 0 && last > first, 'Production declarations remain available: ' + start);
  return boardSource.slice(first, last);
}

// Real course state, real validator, real room handler. No room is created and
// no network request or personal storage write is permitted by the fixtures.
function course() {
  const dom = new JSDOM('<body data-sections-board="true"><main id="sections-app"></main></body>', {
    url: origin + wrapper + '?token=child-only-marker', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, errors = [];
  w.TextEncoder = TextEncoder;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  // jsdom has no SVG text layout; room selection does not depend on glyph size.
  w.SVGElement.prototype.getBBox = function () {return {x: 0, y: -12, width: this.textContent.length * 7, height: 16};};
  w.addEventListener('error', event => errors.push(event.error?.message || event.message));
  w.COURSE = w.JSON.parse(JSON.stringify(bundle));
  w.localStorage.setItem(bundle.storageKey, JSON.stringify({version: 1, current: 'starter-24', tasks: {}}));
  w.localStorage.setItem('mathexam.sections.master.activities.v1', 'existing-personal-activities');
  w.localStorage.setItem('unrelated', 'preserve');
  const before = JSON.stringify({...w.localStorage});
  w.MathExamBoard = {register() {return {destroy() {}};}};
  w.eval(read('stereo-course/sections/assets/board-session.js'));
  w.eval(read('stereo-course/sections/assets/app.js'));
  assert(w.__sectionsBoard, 'The production wrapper session exposes its selection contract');
  return {w, api: w.__sectionsBoard, app: w.SECTIONS_APP,
    close() {
      assert.equal(JSON.stringify({...w.localStorage}), before, 'Personal and unrelated storage is unchanged');
      w.SECTIONS_BOARD_SESSION.destroy(); dom.window.close();
      assert.deepEqual(errors, []);
    }
  };
}

function parent(child, boardOrigin = origin) {
  const context = vm.createContext({window: {}, location: new URL(boardOrigin + '/trainers/trainer-board.html'), URL, frame: {contentWindow: child}});
  vm.runInContext(read('trainers/board-picker.js'), context);
  context.normalizeTrainer = context.window.BoardPicker.normalize;
  vm.runInContext([
    productionPart('const TRAINER_PATH_LIMITS=', 'const trainerRegistry='),
    productionPart('function unsafePathText(', 'function trainerIdFromPayload('),
    productionPart('function addBoardSeedToTrainerUrl(', 'function compatLabel('),
    productionPart('async function createRoom(){', 'async function connectRoom(){')
  ].join('\n'), context);
  return context;
}

for (const lessonId of ['starter-18', 'ii-self-12а']) {
test('createRoom keeps selected lesson ' + lessonId + ' and its normal seed without copying draft or child query', async () => {
  const f = course();
  try {
    f.app.selectLesson(lessonId);
    const draft = f.w.document.querySelector('textarea');
    assert(draft, 'The selected lesson has a real draft field');
    draft.value = 'unpublished fixture draft'; draft.dispatchEvent(new f.w.Event('input', {bubbles: true}));
    assert(f.api.validateState(f.api.getState()));
    const workBefore = JSON.stringify(f.api.getState());
    const p = parent(f.w), navigations = [], savedSettings = [];
    Object.assign(p, {
      state: {trainerUrl: wrapper + '?from=assigned&note=%2B+%26#starter-01'}, shared: {server: 'https://room-fixture.invalid'}, trainerRegistry: {server: 'https://room-fixture.invalid'},
      serverUrl: {value: 'https://room-fixture.invalid'}, trainerUrl: {}, studentLink: {}, roomBadge: {},
      SERVER_KEY: 'mathexam.trainerBoard.serverUrl', DEFAULT_SERVER: 'https://room-fixture.invalid',
      normalizeServer: value => value, loadTrainerRegistry() {}, setStatus() {}, saveTeacherRoomSession() {},
      replaceTeacherRoomUrl() {}, setControlState() {}, setParticipants() {}, save() {}, updateControlUi() {},
      setTrainerFrameSrc: value => navigations.push(value), makeStudentLink: () => 'synthetic-room-invitation',
      localStorage: {setItem: (key, value) => savedSettings.push([key, value])},
      fetch: async () => ({ok: true, json: async () => ({roomId: 'fixture-room', teacherToken: 'fixture-teacher', studentToken: 'fixture-pupil'})}),
      connectRoom: async () => {p.connectedByHandler = true;}
    });
    await p.createRoom();
    assert.equal(navigations.length, 1, 'The existing iframe navigation still runs');
    const selected = new URL(navigations[0], origin);
    assert.equal(selected.pathname, wrapper); assert.equal(selected.hash, '#' + encodeURIComponent(lessonId));
    assert.deepEqual([...selected.searchParams], [['from', 'assigned'], ['note', '+ &'], ['seed', 'fixture-room']]);
    assert.equal(p.state.trainerUrl, navigations[0]); assert.equal(p.connectedByHandler, true);
    assert.equal(navigations[0].includes('child-only-marker'), false);
    assert.equal(navigations[0].includes('unpublished'), false);
    assert.deepEqual(savedSettings, [['mathexam.trainerBoard.serverUrl', 'https://room-fixture.invalid']]);
    assert.equal(JSON.stringify(f.api.getState()), workBefore, 'Reading selection never changes course work');
  } finally {f.close();}
});
}

test('all 186 published sections IDs retain their exact encoded selection for each supported wrapper URL shape', () => {
  const f = course();
  try {
    const p = parent(f.w);
    assert.equal(bundle.lessons.length, 186);
    for (const {id} of bundle.lessons) {
      f.app.selectLesson(id); assert(f.api.validateState(f.api.getState()), id);
      for (const base of [wrapper, 'sections-from-zero.html', origin + wrapper]) {
        const input = base + '?from=teacher&note=%2B+%26#starter-18';
        assert.equal(p.trainerUrlWithCurrentMerzlyakSelection(input), base + '?from=teacher&note=%2B+%26#' + encodeURIComponent(id));
      }
    }
  } finally {f.close();}
});

test('unknown, encoded or mismatched hashes and rejected sections snapshots keep the original destination', () => {
  const f = course();
  try {
    f.app.selectLesson('starter-18');
    const input = wrapper + '#starter-01';
    for (const hash of ['#unknown-lesson', '#starter-19', '#%73tarter-18', '#token=private', '#../starter-18', '#', '']) {
      const child = {location: new URL(origin + wrapper + hash), __sectionsBoard: f.api};
      assert.equal(parent(child).trainerUrlWithCurrentMerzlyakSelection(input), input, hash);
    }
    const valid = f.api.getState();
    for (const snapshot of [{...valid, lessonId: 'unknown-lesson'}, {...valid, courseId: 'other-course'}, {...valid, work: {...valid.work, draft: 42}}, null]) {
      const inChildRealm = f.w.JSON.parse(JSON.stringify(snapshot));
      const child = {location: new URL(origin + wrapper + '#starter-18'), __sectionsBoard: {getState: () => inChildRealm, validateState: f.api.validateState}};
      assert.equal(parent(child).trainerUrlWithCurrentMerzlyakSelection(input), input);
    }
  } finally {f.close();}
});

test('wrong-origin, wrong-wrapper and inaccessible contexts cannot supply sections selection', () => {
  const f = course();
  try {
    f.app.selectLesson('starter-18');
    const input = wrapper + '?from=teacher#starter-01';
    for (const href of ['https://other.invalid' + wrapper, origin + '/trainers/merzlyak-10-base.html', origin + '/stereo-course/sections/', 'about:blank', 'https://name:password@mathexam.space' + wrapper]) {
      const child = {location: new URL(href + '#starter-18'), __sectionsBoard: f.api};
      assert.equal(parent(child).trainerUrlWithCurrentMerzlyakSelection(input), input, href);
    }
    for (const child of [null, {location: new URL(origin + wrapper + '#starter-18')},
      {location: new URL(origin + wrapper + '#starter-18'), __merzlyakBoard: f.api},
      {get location() {throw new Error('inaccessible');}}]) {
      assert.equal(parent(child).trainerUrlWithCurrentMerzlyakSelection(input), input);
    }
    assert.equal(parent(f.w, 'https://other-board.invalid').trainerUrlWithCurrentMerzlyakSelection(origin + input), origin + input);
  } finally {f.close();}
});

test('external and unsafe sections paths keep the established seed behavior without inspecting another document', () => {
  const p = parent({get location() {throw new Error('This document must not be inspected');}});
  for (const input of ['negative-numbers-line.html', 'https://external.invalid' + wrapper, '/trainers/%73ections-from-zero.html',
    '/trainers/nested/../sections-from-zero.html', '/trainers/sections-from-zero.html.extra', '/trainers/Sections-From-Zero.html']) {
    assert.equal(p.trainerUrlWithCurrentMerzlyakSelection(input), input, input);
    assert.equal(p.addBoardSeedToTrainerUrl(p.trainerUrlWithCurrentMerzlyakSelection(input), 'fixture-room'), p.addBoardSeedToTrainerUrl(input, 'fixture-room'));
  }
  assert.equal(p.addBoardSeedToTrainerUrl(wrapper + '?seed=existing#starter-18', 'new-room'), wrapper + '?seed=existing#starter-18');
});
