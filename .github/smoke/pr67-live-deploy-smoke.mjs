import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const { io } = require('socket.io-client');

const baseUrl = process.env.BASE_URL;
const publicPage = process.env.PUBLIC_PAGE;
const oldServerStartedAt = process.env.OLD_SERVER_STARTED_AT;
const mergedAt = Date.parse(process.env.MERGED_AT);
const sockets = [];

function mark(name) {
  console.log(`LIVE_STEP ${name}`);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_error) {}
  return { response, text, data };
}

async function health() {
  const { response, data, text } = await fetchJson(`${baseUrl}/health`, { cache: 'no-store' });
  assert.equal(response.status, 200, text);
  assert.equal(data?.ok, true);
  assert.equal(typeof data.rooms, 'number');
  assert.ok(data.serverStartedAt);
  assert.equal(typeof data.roomTtlMs, 'number');
  assert.equal(typeof data.roomCleanupIntervalMs, 'number');
  assert.equal(data.features?.roomTtlCleanup, true);
  return data;
}

async function waitForDeploy() {
  const deadline = Date.now() + 15 * 60 * 1000;
  let last = null;
  while (Date.now() < deadline) {
    last = await health();
    console.log(`HEALTH_POLL ${JSON.stringify(last)}`);
    const started = Date.parse(last.serverStartedAt);
    if (last.serverStartedAt !== oldServerStartedAt && Number.isFinite(started) && started >= mergedAt) {
      return last;
    }
    await sleep(10000);
  }
  throw new Error(`Deploy was not observed. Last health: ${JSON.stringify(last)}`);
}

async function postRoom(origin) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  const { response, data, text } = await fetchJson(`${baseUrl}/api/rooms`, { method: 'POST', headers });
  assert.equal(response.status, 201, text);
  assert.ok(data.roomId);
  assert.ok(data.teacherToken);
  assert.ok(data.studentToken);
  assert.ok(data.state);
  if (origin) assert.equal(response.headers.get('access-control-allow-origin'), origin);
  return data;
}

async function checkCors(origin) {
  const getResponse = await fetch(`${baseUrl}/health`, { headers: { Origin: origin } });
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.headers.get('access-control-allow-origin'), origin);

  const optionsResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type'
    }
  });
  assert.ok([200, 204].includes(optionsResponse.status), `Unexpected OPTIONS ${optionsResponse.status}`);
  assert.equal(optionsResponse.headers.get('access-control-allow-origin'), origin);

  await postRoom(origin);
}

function connectSocket() {
  const socket = io(baseUrl, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 8000
  });
  sockets.push(socket);
  return socket;
}

function waitFor(socket, event, predicate = () => true, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for ${event}`));
    }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      socket.off(event, handler);
    }
    function handler(payload) {
      try {
        if (!predicate(payload)) return;
        cleanup();
        resolve(payload);
      } catch (error) {
        cleanup();
        reject(error);
      }
    }
    socket.on(event, handler);
  });
}

async function waitForConnect(socket) {
  if (!socket.connected) await waitFor(socket, 'connect');
}

async function join(socket, room, role, token, proto) {
  await waitForConnect(socket);
  const statePromise = waitFor(socket, 'room:state', payload => payload?.role === role);
  const payload = { roomId: room.roomId, role, token };
  if (proto !== undefined) payload.proto = proto;
  socket.emit('room:join', payload);
  return statePromise;
}

async function requestState(socket) {
  const statePromise = waitFor(socket, 'room:state', payload => payload?.state);
  socket.emit('room:state');
  return statePromise;
}

async function joinStudentState(room) {
  const socket = connectSocket();
  const payload = await join(socket, room, 'student', room.studentToken, 2);
  socket.disconnect();
  return payload.state;
}

async function expectNoEvent(socket, event, timeoutMs = 500) {
  let fired = false;
  const handler = () => { fired = true; };
  socket.on(event, handler);
  await sleep(timeoutMs);
  socket.off(event, handler);
  assert.equal(fired, false, `${event} should not fire`);
}

function roomPayload(room, token, extra = {}) {
  return { roomId: room.roomId, token, ...extra };
}

function objectIds(state) {
  return state.pages[0].strokes.map(item => item.objectId);
}

try {
  mark('wait-for-deploy');
  const deployedHealth = await waitForDeploy();
  console.log(`DEPLOYED_HEALTH ${JSON.stringify(deployedHealth)}`);

  mark('public-html');
  const htmlResponse = await fetch(publicPage, { cache: 'no-store' });
  assert.equal(htmlResponse.status, 200);
  const html = await htmlResponse.text();
  assert.ok(html.includes('https://mathexam-board-ladynata.amvera.io'));
  assert.ok(html.includes('trainer-board'));

  mark('post-room');
  const room = await postRoom();

  mark('cors');
  await checkCors('https://mathexam.space');
  await checkCors('http://localhost:5173');

  mark('fresh-teacher-join');
  const teacher = connectSocket();
  const freshTeacherState = await join(teacher, room, 'teacher', room.teacherToken, 2);
  assert.equal(freshTeacherState.state, null);
  assert.ok(freshTeacherState.you?.participantId);

  mark('seed-snapshot');
  teacher.emit('board:snapshot', roomPayload(room, room.teacherToken, {
    state: {
      currentPage: 0,
      trainerUrl: 'negative-numbers-line.html?seed=server-owned-live',
      pages: [{ id: 'SeedLive01', bg: 'grid', strokes: [] }]
    }
  }));
  await sleep(200);
  let current = (await requestState(teacher)).state;
  assert.equal(current.stateVersion, 1);
  assert.equal(current.pages[0].id, 'SeedLive01');

  mark('teacher-rejoin-initialized');
  const teacherRejoin = connectSocket();
  const rejoinState = await join(teacherRejoin, room, 'teacher', room.teacherToken, 2);
  assert.ok(rejoinState.state);
  assert.equal(rejoinState.state.pages[0].id, 'SeedLive01');
  teacherRejoin.disconnect();

  mark('student-live-join');
  const studentLive = connectSocket();
  const participantsAfterStudent = waitFor(teacher, 'participants:state', payload => (
    payload?.participants?.some(item => item.role === 'student' && Number(item.onlineCount) > 0)
  ));
  const studentState = await join(studentLive, room, 'student', room.studentToken, 2);
  assert.ok(studentState.state);
  assert.ok(studentState.you?.participantId);
  await participantsAfterStudent;

  mark('stroke-end');
  const liveStroke = waitFor(studentLive, 'board:stroke-end', payload => payload?.stroke?.objectId === 'LiveStroke01');
  teacher.emit('board:stroke-end', roomPayload(room, room.teacherToken, {
    pageIndex: 0,
    stroke: {
      objectId: 'LiveStroke01',
      authorId: 'fake-author',
      authorRole: 'student',
      layerId: 'participant:fake-author',
      kind: 'path',
      tool: 'pen',
      color: '#111111',
      size: 4,
      points: [{ x: 1, y: 1 }]
    }
  }));
  const strokePayload = await liveStroke;
  assert.notEqual(strokePayload.stroke.authorId, 'fake-author');
  assert.equal(strokePayload.stroke.authorRole, 'teacher');
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['LiveStroke01']);

  mark('text-add');
  const liveText = waitFor(studentLive, 'board:text-add', payload => (payload?.text || payload?.stroke || payload?.object)?.objectId === 'LiveText01');
  teacher.emit('board:text-add', roomPayload(room, room.teacherToken, {
    pageIndex: 0,
    text: {
      objectId: 'LiveText01',
      authorId: 'fake-author',
      authorRole: 'student',
      kind: 'text',
      tool: 'text',
      x: 12,
      y: 14,
      text: 'hello',
      color: '#222222',
      size: 5
    }
  }));
  const textPayload = await liveText;
  assert.equal((textPayload.text || textPayload.stroke || textPayload.object).authorRole, 'teacher');
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['LiveStroke01', 'LiveText01']);

  mark('trainer-state-mirror');
  const trainerStatePromise = waitFor(studentLive, 'board:trainer-state-change', payload => payload?.trainer === 'negative-numbers-line' && payload?.state?.answer === 42);
  teacher.emit('board:trainer-state-change', roomPayload(room, room.teacherToken, {
    trainer: 'negative-numbers-line',
    state: { answer: 42 }
  }));
  await trainerStatePromise;

  mark('clear-bg-switch-page-add-delete');
  const clearPromise = waitFor(studentLive, 'board:clear-page', payload => payload?.pageIndex === 0);
  teacher.emit('board:clear-page', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await clearPromise;
  current = await joinStudentState(room);
  assert.equal(current.pages[0].strokes.length, 0);

  const bgPromise = waitFor(studentLive, 'board:bg-change', payload => payload?.bg === 'lined');
  teacher.emit('board:bg-change', roomPayload(room, room.teacherToken, { pageIndex: 0, bg: 'lined' }));
  await bgPromise;
  current = await joinStudentState(room);
  assert.equal(current.pages[0].bg, 'lined');

  const legacyStudent = connectSocket();
  await join(legacyStudent, room, 'student', room.studentToken);

  const pageAddB = waitFor(studentLive, 'board:page-add', payload => payload?.page?.id === 'LivePageB01');
  const legacyPageAddSnapshot = waitFor(legacyStudent, 'board:snapshot', payload => payload?.state?.pages?.some(page => page.id === 'LivePageB01'));
  teacher.emit('board:page-add', roomPayload(room, room.teacherToken, { pageIndex: 1, page: { id: 'LivePageB01', bg: 'blank' } }));
  await pageAddB;
  await legacyPageAddSnapshot;

  const pageAddC = waitFor(studentLive, 'board:page-add', payload => payload?.page?.id === 'LivePageC01');
  teacher.emit('board:page-add', roomPayload(room, room.teacherToken, { pageIndex: 2, page: { id: 'LivePageC01', bg: 'grid' } }));
  await pageAddC;

  const switchToB = waitFor(studentLive, 'board:page-switch', payload => payload?.pageIndex === 1);
  teacher.emit('board:page-switch', roomPayload(room, room.teacherToken, { pageIndex: 1 }));
  await switchToB;
  current = await joinStudentState(room);
  assert.equal(current.currentPage, 1);
  assert.equal(current.pages[current.currentPage].id, 'LivePageB01');

  const deleteA = waitFor(studentLive, 'board:page-delete', payload => payload?.pageIndex === 0 && payload?.currentPage === 0);
  const legacyDeleteSnapshot = waitFor(legacyStudent, 'board:snapshot', payload => payload?.state?.currentPage === 0 && payload?.state?.pages?.[0]?.id === 'LivePageB01');
  teacher.emit('board:page-delete', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await deleteA;
  await legacyDeleteSnapshot;
  current = await joinStudentState(room);
  assert.equal(current.currentPage, 0);
  assert.equal(current.pages[0].id, 'LivePageB01');

  mark('undo-redo-redo-clear');
  for (const id of ['LiveStrokeB01', 'LiveStrokeC01']) {
    teacher.emit('board:stroke-end', roomPayload(room, room.teacherToken, {
      pageIndex: 0,
      stroke: { objectId: id, kind: 'path', tool: 'pen', color: '#333333', size: 4, points: [{ x: 1, y: 1 }] }
    }));
    await sleep(150);
  }
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['LiveStrokeB01', 'LiveStrokeC01']);

  const undoPromise = waitFor(teacher, 'board:page-state', payload => payload?.page?.strokes?.length === 1);
  const legacyUndoSnapshot = waitFor(legacyStudent, 'board:snapshot', payload => payload?.state?.pages?.[0]?.strokes?.length === 1);
  teacher.emit('board:stroke-undo', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await undoPromise;
  await legacyUndoSnapshot;
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['LiveStrokeB01']);

  const redoPromise = waitFor(teacher, 'board:page-state', payload => payload?.page?.strokes?.length === 2);
  const legacyRedoSnapshot = waitFor(legacyStudent, 'board:snapshot', payload => payload?.state?.pages?.[0]?.strokes?.length === 2);
  teacher.emit('board:stroke-redo', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await redoPromise;
  await legacyRedoSnapshot;
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['LiveStrokeB01', 'LiveStrokeC01']);

  const undoAgain = waitFor(teacher, 'board:page-state', payload => payload?.page?.strokes?.length === 1);
  teacher.emit('board:stroke-undo', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await undoAgain;
  teacher.emit('board:stroke-end', roomPayload(room, room.teacherToken, {
    pageIndex: 0,
    stroke: { objectId: 'LiveStrokeD01', kind: 'path', tool: 'pen', color: '#444444', size: 4, points: [{ x: 2, y: 2 }] }
  }));
  await sleep(200);
  teacher.emit('board:stroke-redo', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await sleep(250);
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['LiveStrokeB01', 'LiveStrokeD01']);

  mark('proto2-ignore-and-legacy-fallback');
  const beforeProto2 = (await requestState(teacher)).state;
  teacher.emit('board:snapshot', roomPayload(room, room.teacherToken, {
    state: { currentPage: 0, trainerUrl: 'bad.html', pages: [{ id: 'BadLivePage01', bg: 'blank', strokes: [] }] }
  }));
  await sleep(200);
  const afterProto2 = (await requestState(teacher)).state;
  assert.equal(afterProto2.stateVersion, beforeProto2.stateVersion);
  assert.notEqual(afterProto2.pages[0].id, 'BadLivePage01');

  const legacyTeacher = connectSocket();
  await join(legacyTeacher, room, 'teacher', room.teacherToken);
  const beforeLegacy = (await requestState(teacher)).state;
  legacyTeacher.emit('board:snapshot', roomPayload(room, room.teacherToken, {
    state: {
      currentPage: 0,
      trainerUrl: 'legacy.html',
      pages: [{
        id: 'LegacyLivePage01',
        bg: 'grid',
        strokes: [{ objectId: 'LegacyLiveObj01', authorId: 'fake', authorRole: 'student', kind: 'path', tool: 'pen', points: [] }]
      }]
    }
  }));
  await sleep(250);
  const afterLegacy = (await requestState(teacher)).state;
  assert.ok(afterLegacy.stateVersion > beforeLegacy.stateVersion);
  assert.equal(afterLegacy.pages[0].id, 'LegacyLivePage01');
  assert.equal(afterLegacy.pages[0].strokes[0].authorRole, 'teacher');

  mark('student-rejects');
  for (const [event, extra] of [
    ['board:stroke-undo', { pageIndex: 0 }],
    ['board:page-delete', { pageIndex: 0 }],
    ['board:stroke-end', { pageIndex: 0, stroke: { objectId: 'StudentLive01', kind: 'path', points: [] } }]
  ]) {
    const errorPromise = waitFor(studentLive, 'room:error', payload => /доступ|комната/i.test(String(payload?.message || '')));
    studentLive.emit(event, roomPayload(room, room.studentToken, extra));
    await errorPromise;
  }
  studentLive.emit('board:stroke-end', roomPayload(room, room.studentToken, {
    pageIndex: 0,
    stroke: { objectId: 'NoRelayLive01', kind: 'path', points: [] }
  }));
  await expectNoEvent(teacher, 'board:stroke-end');

  mark('duplicate-join-and-disconnect');
  const dupRoom = await postRoom();
  const dupTeacher = connectSocket();
  await join(dupTeacher, dupRoom, 'teacher', dupRoom.teacherToken, 2);
  const duplicateParticipants = waitFor(dupTeacher, 'participants:state', payload => payload?.participants?.some(item => item.role === 'teacher'));
  dupTeacher.emit('room:join', { roomId: dupRoom.roomId, role: 'teacher', token: dupRoom.teacherToken, proto: 2 });
  const duplicateState = await duplicateParticipants;
  assert.equal(duplicateState.participants.find(item => item.role === 'teacher').onlineCount, 1);
  dupTeacher.disconnect();

  const offRoom = await postRoom();
  const offTeacher = connectSocket();
  await join(offTeacher, offRoom, 'teacher', offRoom.teacherToken, 2);
  const offStudent = connectSocket();
  await join(offStudent, offRoom, 'student', offRoom.studentToken, 2);
  const participantsOffline = waitFor(offTeacher, 'participants:state', payload => {
    const student = payload?.participants?.find(item => item.role === 'student');
    return student && student.connected === false && Number(student.onlineCount) === 0;
  });
  offStudent.disconnect();
  await participantsOffline;
  offTeacher.disconnect();

  mark('final-health');
  const finalHealth = await health();
  console.log(`FINAL_HEALTH ${JSON.stringify(finalHealth)}`);
  console.log('LIVE_SMOKE_OK');
} finally {
  for (const socket of sockets) socket.disconnect();
}
