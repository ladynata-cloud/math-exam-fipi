'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const model = require('../trainers/spacemath/model.js');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'trainers/trainer-board.html'), 'utf8');
const origin = 'https://mathexam.space', file = 'trainers/spacemath/index.html';
const copy = value => JSON.parse(JSON.stringify(value));
function part(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, start);
  return source.slice(from, to);
}
function fixture() {
  const selected = {
    ...model.empty(), title: 'Середина отрезка', objects: [
      { id: 'a', type: 'point', label: 'A', x: 0, y: 0 },
      { id: 'b', type: 'point', label: 'B', x: 4, y: 2 },
      { id: 'm', type: 'midpoint', label: 'M', parents: ['a', 'b'] }
    ]
  };
  const child = { location: new URL(origin + '/' + file + '#local-selection'),
    SpaceMathApp: { getState: () => selected }, SpaceMathModel: model };
  const entry = { trainerId: 'spacemath', file, trainerVersion: '1.0.0', protocolVersion: 1,
    stateSchemaVersion: 1, allowLegacyHtml: false };
  const p = vm.createContext({ window: {}, location: new URL(origin + '/trainers/trainer-board.html'), URL, TextEncoder,
    frame: { contentWindow: child }, state: { trainerUrl: '/' + file },
    shared: { role: 'teacher', roomId: 'new-room', connected: true, control: 'teacher', me: { participantId: 'teacher' } },
    trainerRegistry: { status: 'ready', server: 'https://room.example', byId: new Map([['spacemath', entry]]), byFile: new Map([[file, entry]]) },
    setMirrorStatus() {}
  });
  for (const script of ['board-picker.js', 'board-bridge.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'trainers', script), 'utf8'), p);
  p.MathExamBoard = p.window.MathExamBoard; p.normalizeTrainer = p.window.BoardPicker.normalize;
  vm.runInContext([
    part('const TRAINER_PATH_LIMITS=', 'const trainerRegistry='),
    part('function unsafePathText(', 'function validateTrainerRegistryResponse('),
    part('function mirrorEntryFromPayload(', 'function trustedTrainerOrigin('),
    part('function canWrite(){', 'function readonly(){'),
    part('function addBoardSeedToTrainerUrl(', 'function compatLabel('),
    part('function bridgeStateFromPayload(', 'function requestTrainerState('),
    part('async function createRoom(){', 'async function connectRoom(){')
  ].join('\n'), p);
  return { p, child, selected };
}

test('creating a public room preserves the latest construction and its dependencies across iframe reload', async () => {
  const { p, selected } = fixture(), calls = { rooms: 0, connected: 0, navigations: [], settings: [] };
  let resolveRegistry;
  const pendingRegistry = new Promise(resolve => { resolveRegistry = resolve; });
  p.trainerRegistry.status = 'pending';
  Object.assign(p, {
    serverUrl: { value: 'https://room.example' }, trainerUrl: {}, studentLink: {}, roomBadge: {},
    DEFAULT_SERVER: 'https://room.example', SERVER_KEY: 'server', normalizeServer: value => value,
    loadTrainerRegistry: () => pendingRegistry, setStatus() {}, saveTeacherRoomSession() {}, replaceTeacherRoomUrl() {},
    setControlState() {}, setParticipants() {}, save() {}, makeStudentLink: () => 'fixture-invitation', updateControlUi() {},
    setTrainerFrameSrc: value => calls.navigations.push(value),
    localStorage: { setItem: (key, value) => calls.settings.push([key, value]) },
    fetch: async () => { calls.rooms++; return { ok: true, json: async () => ({ roomId: 'fresh-room', teacherToken: 'fixture-teacher', studentToken: 'fixture-student' }) }; },
    connectRoom: async () => { calls.connected++; }
  });
  const creating = p.createRoom();
  await Promise.resolve();
  assert.equal(calls.rooms, 0, 'capture waits for authoritative registry authorization');
  selected.objects[1].x = 6;
  p.trainerRegistry.status = 'ready'; resolveRegistry();
  await creating;
  assert.equal(calls.rooms, 1); assert.equal(calls.connected, 1);
  assert.deepEqual(calls.navigations, ['/' + file + '?seed=fresh-room']);
  assert.deepEqual(calls.settings, [['server', 'https://room.example']], 'construction does not enter room credentials');
  const prepared = p.shared.preparedProfileTrainer;
  assert.deepEqual(copy(prepared.payload.state), selected);
  selected.objects[1].x = 8;
  assert.equal(prepared.payload.state.objects[1].x, 6, 'captured graph is detached from later local edits');
  assert.deepEqual(copy(prepared.payload.state.objects[2].parents), ['a', 'b']);
  assert.equal(p.takePreparedProfileTrainer(null), prepared.payload);
  assert.equal(p.takePreparedProfileTrainer(null), null, 'prepared work is consumed once');
});

test('existing room state, different controller, room identity and failed registry prevent draft replay', () => {
  const { p } = fixture();
  const prepare = () => ({ roomId: p.shared.roomId, ...p.prepareProfileTrainerForRoom(p.state.trainerUrl) });
  p.shared.preparedProfileTrainer = prepare();
  assert.equal(p.takePreparedProfileTrainer({ latestTrainerState: null }), null);
  p.shared.preparedProfileTrainer = prepare(); p.shared.preparedProfileTrainer.roomId = 'old-room';
  assert.equal(p.takePreparedProfileTrainer(null), null);
  p.shared.preparedProfileTrainer = prepare(); p.shared.control = 'student';
  assert.equal(p.takePreparedProfileTrainer(null), null); p.shared.control = 'teacher';
  p.shared.preparedProfileTrainer = prepare(); p.shared.role = 'student';
  assert.equal(p.takePreparedProfileTrainer(null), null); p.shared.role = 'teacher';
  p.shared.preparedProfileTrainer = prepare(); p.trainerRegistry.status = 'failed';
  assert.equal(p.takePreparedProfileTrainer(null), null);
});

test('foreign frames, missing adapters and invalid construction graphs cannot seed a room', () => {
  for (const change of [
    f => { f.child.location = new URL('https://other.example/' + file); },
    f => { f.child.location = new URL(origin + '/trainers/other.html'); },
    f => { delete f.child.SpaceMathApp; },
    f => { delete f.child.SpaceMathModel; },
    f => { f.p.trainerRegistry.status = 'pending'; },
    f => { f.selected.objects[2].parents = ['missing', 'b']; },
    f => { f.selected.objects[1].x = Infinity; },
    f => { f.selected.title = '<script>invalid</script>'; },
    f => { f.selected.title = 'x'.repeat(65536); },
    f => { f.selected.version = 2; }
  ]) {
    const f = fixture(); change(f);
    assert.equal(f.p.prepareProfileTrainerForRoom(f.p.state.trainerUrl), null);
  }
});
