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
const bundle = JSON.parse(read('stereo-course/merzlyak-10-base/data/course.json'));
const origin = 'https://mathexam.space';
const wrapper = '/trainers/merzlyak-10-base.html';

function productionPart(start, end) {
  const first = boardSource.indexOf(start), last = boardSource.indexOf(end, first + start.length);
  assert(first >= 0 && last > first, 'Production declarations remain available: ' + start);
  return boardSource.slice(first, last);
}

// Use the real course engine and its existing validator. Only model painting
// and the wire registration are fixtures; lesson selection/storage are real.
function course() {
  const dom = new JSDOM('<body data-merzlyak-board="true"><div id="app"></div></body>', {
    url: origin + wrapper + '?token=child-only-marker', runScripts: 'outside-only'
  });
  const w = dom.window, errors = [];
  w.TextEncoder = TextEncoder;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.addEventListener('error', event => errors.push(event.error?.message || event.message));
  w.localStorage.setItem('mathExamTextbook.v1:merzlyak-2022-10-base:ex-02-019:r1', 'existing-personal-work');
  w.localStorage.setItem('unrelated', 'preserve');
  const before = JSON.stringify({...w.localStorage});
  w.TaskSceneViewer = {mount(container, model, options = {}) {
    const svg = w.document.createElement('svg'), live = w.document.createElement('p');
    live.className = 'am-sr-only';
    container.replaceChildren(svg, live);
    const camera = model.planar ? {yaw: 0, pitch: -Math.PI / 2} : options.savedCamera || {yaw: .6, pitch: .4};
    svg.dataset.yaw = camera.yaw; svg.dataset.pitch = camera.pitch;
    return {setView(value) {svg.dataset.view = value; return true;}, getState() {return w.JSON.parse(JSON.stringify(camera));}, destroy() {container.replaceChildren();}};
  }};
  w.MathExamBoard = {register() {return {destroy() {}};}};
  for (const file of ['stereo-course/assets/math-text.js', 'stereo-course/merzlyak-10-base/assets/engine.js', 'stereo-course/merzlyak-10-base/assets/board-session.js']) w.eval(read(file));
  const mounted = w.MerzlyakBoard.boot(w.JSON.parse(JSON.stringify(bundle)), w.document.getElementById('app'));
  return {w, api: w.__merzlyakBoard, app: mounted.app,
    close() {
      assert.equal(JSON.stringify({...w.localStorage}), before, 'Personal and unrelated storage is unchanged');
      mounted.session.destroy(); mounted.app.destroy(); dom.window.close();
      assert.deepEqual(errors, []);
    }
  };
}

function parent(child, boardOrigin = origin) {
  const context = vm.createContext({window: {}, location: new URL(boardOrigin + '/trainers/trainer-board.html'), URL, frame: {contentWindow: child}});
  vm.runInContext(read('trainers/board-picker.js'), context);
  context.normalizeTrainer = context.window.BoardPicker.normalize;
  // Execute the production URL guards and room handler, not copies of them.
  vm.runInContext([
    productionPart('const TRAINER_PATH_LIMITS=', 'const trainerRegistry='),
    productionPart('function unsafePathText(', 'function trainerIdFromPayload('),
    productionPart('function addBoardSeedToTrainerUrl(', 'function compatLabel('),
    productionPart('async function createRoom(){', 'async function connectRoom(){')
  ].join('\n'), context);
  return context;
}

test('the actual createRoom retains the selected exercise while adding its normal seed', async () => {
  const f = course();
  try {
    f.app.open('ex-02-019');
    const input = f.w.document.querySelector('#final-answer');
    input.value = 'unpublished fixture draft'; input.dispatchEvent(new f.w.Event('input', {bubbles: true}));
    const workBefore = JSON.stringify(f.api.getState());
    const p = parent(f.w), navigations = [], savedSettings = [];
    Object.assign(p, {
      state: {trainerUrl: wrapper + '?from=assigned&note=%2B+%26'}, shared: {server: 'https://room-fixture.invalid'}, trainerRegistry: {server: 'https://room-fixture.invalid'},
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
    assert.equal(navigations.length, 1, 'The established iframe reload still runs');
    const selected = new URL(navigations[0], origin);
    assert.equal(selected.pathname, wrapper); assert.equal(selected.hash, '#ex-02-019');
    assert.deepEqual([...selected.searchParams], [['from', 'assigned'], ['note', '+ &'], ['seed', 'fixture-room']]);
    assert.equal(p.state.trainerUrl, navigations[0]); assert.equal(p.connectedByHandler, true);
    assert.equal(navigations[0].includes('child-only-marker'), false);
    assert.equal(navigations[0].includes('unpublished'), false, 'Only lesson identity enters the URL');
    assert.deepEqual(savedSettings, [['mathexam.trainerBoard.serverUrl', 'https://room-fixture.invalid']]);
    assert.equal(JSON.stringify(f.api.getState()), workBefore, 'Reading the selection does not mutate course work');
  } finally {f.close();}
});

test('published non-exercise-prefix cards and absolute same-origin URLs retain their exact destination', () => {
  const f = course();
  try {
    const p = parent(f.w);
    for (const id of ['ex-02-019', 'merz-ex-10-001', 'merz-theory-01', 'research-sections-001']) {
      assert(f.app.open(id)); assert(f.api.validateState(f.api.getState()), id);
      for (const base of [wrapper, 'merzlyak-10-base.html', origin + wrapper]) {
        const input = base + '?from=teacher&note=%2B+%26#ex-16-010';
        assert.equal(p.trainerUrlWithCurrentMerzlyakSelection(input), base + '?from=teacher&note=%2B+%26#' + id);
      }
    }
  } finally {f.close();}
});

test('returning to the catalogue removes a stale parent lesson fragment', () => {
  const f = course();
  try {
    f.app.open('ex-02-019'); f.app.home();
    assert.equal(f.api.getState().lessonId, null); assert.equal(f.w.location.hash, '');
    const p = parent(f.w), input = wrapper + '?from=teacher#ex-16-010';
    assert.equal(p.trainerUrlWithCurrentMerzlyakSelection(input), wrapper + '?from=teacher');
    assert.equal(p.addBoardSeedToTrainerUrl(p.trainerUrlWithCurrentMerzlyakSelection(input), 'new-room'), wrapper + '?from=teacher&seed=new-room');
  } finally {f.close();}
});

test('invalid, encoded and mismatched fragments and unvalidated snapshots cannot supply a lesson', () => {
  const f = course();
  try {
    f.app.open('ex-02-019');
    const input = wrapper + '#ex-16-010';
    for (const hash of ['#unknown-lesson', '#ex-02-020', '#%65x-02-019', '#token=private', '#../ex-02-019', '#']) {
      const child = {location: new URL(origin + wrapper + hash), __merzlyakBoard: f.api};
      assert.equal(parent(child).trainerUrlWithCurrentMerzlyakSelection(input), input, hash);
    }
    const valid = f.api.getState();
    for (const snapshot of [{...valid, lessonId: 'unknown-lesson'}, {...valid, bookId: 'other-book'}, {...valid, work: {...valid.work, draft: 42}}, null]) {
      const inChildRealm = f.w.JSON.parse(JSON.stringify(snapshot));
      const child = {location: new URL(origin + wrapper + '#ex-02-019'), __merzlyakBoard: {getState: () => inChildRealm, validateState: f.api.validateState}};
      assert.equal(parent(child).trainerUrlWithCurrentMerzlyakSelection(input), input);
    }
  } finally {f.close();}
});

test('wrong-origin, wrong-wrapper, missing and inaccessible child contexts keep the original URL', () => {
  const f = course();
  try {
    f.app.open('ex-02-019');
    const input = wrapper + '?from=teacher#ex-16-010';
    for (const href of ['https://other.invalid' + wrapper, origin + '/trainers/negative-numbers-line.html', origin + '/stereo-course/merzlyak-10-base/', 'about:blank', 'https://name:password@mathexam.space' + wrapper]) {
      const child = {location: new URL(href + '#ex-02-019'), __merzlyakBoard: f.api};
      assert.equal(parent(child).trainerUrlWithCurrentMerzlyakSelection(input), input, href);
    }
    for (const child of [null, {location: new URL(origin + wrapper + '#ex-02-019')}, {get location() {throw new Error('inaccessible');}}]) {
      assert.equal(parent(child).trainerUrlWithCurrentMerzlyakSelection(input), input);
    }
    const p = parent(f.w, 'https://other-board.invalid');
    assert.equal(p.trainerUrlWithCurrentMerzlyakSelection(origin + input), origin + input, 'An absolute public URL is not silently retargeted to a different board origin');
  } finally {f.close();}
});

test('other trainers, external URLs and unsafe wrapper paths retain the existing seed behavior', () => {
  const p = parent({get location() {throw new Error('Other trainer context must not be inspected');}});
  for (const input of ['negative-numbers-line.html', '/trainers/oge-task7-number-line.html?mode=exam#task', 'https://external.invalid' + wrapper,
    '/trainers/%6derzlyak-10-base.html', '/trainers/nested/../merzlyak-10-base.html', '/trainers/merzlyak-10-base.html.extra']) {
    assert.equal(p.trainerUrlWithCurrentMerzlyakSelection(input), input, input);
    assert.equal(p.addBoardSeedToTrainerUrl(p.trainerUrlWithCurrentMerzlyakSelection(input), 'fixture-room'), p.addBoardSeedToTrainerUrl(input, 'fixture-room'));
  }
  assert.equal(p.addBoardSeedToTrainerUrl('negative-numbers-line.html', 'fixture-room'), 'negative-numbers-line.html?seed=fixture-room');
  assert.equal(p.addBoardSeedToTrainerUrl('negative-numbers-line.html?seed=existing', 'fixture-room'), 'negative-numbers-line.html?seed=existing');
});
