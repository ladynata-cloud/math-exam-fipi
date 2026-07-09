import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { setTimeout as sleep } from 'node:timers/promises';

const require = createRequire(new URL('../../board-server/package.json', import.meta.url));
const { io } = require('socket.io-client');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4010';
const sockets = [];

function mark(name) {
  console.log(`SMOKE_STEP ${name}`);
}

function connectSocket() {
  const socket = io(baseUrl, {
    transports: ['websocket', 'polling'],
    reconnection: false,
    timeout: 4000
  });
  sockets.push(socket);
  return socket;
}

function waitFor(socket, event, predicate = () => true, timeoutMs = 5000) {
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

async function postRoom() {
  const response = await fetch(`${baseUrl}/api/rooms`, { method: 'POST' });
  assert.equal(response.status, 201);
  const data = await response.json();
  assert.ok(data.roomId);
  assert.ok(data.teacherToken);
  assert.ok(data.studentToken);
  assert.ok(data.state);
  return data;
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

async function health() {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  return response.json();
}

async function waitForRooms(expected, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await health();
    if (last.rooms === expected) return last;
    await sleep(100);
  }
  assert.equal(last?.rooms, expected);
  return last;
}

async function expectNoEvent(socket, event, timeoutMs = 350) {
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
  mark('health');
  const initialHealth = await health();
  assert.equal(initialHealth.ok, true);
  assert.equal(typeof initialHealth.rooms, 'number');
  assert.ok(initialHealth.serverStartedAt);
  assert.equal(initialHealth.roomTtlMs, 500);
  assert.equal(initialHealth.roomCleanupIntervalMs, 100);
  assert.equal(initialHealth.features?.roomTtlCleanup, true);

  mark('create-main-room');
  const room = await postRoom();
  const teacher = connectSocket();
  const freshTeacherState = await join(teacher, room, 'teacher', room.teacherToken, 2);
  assert.equal(freshTeacherState.state, null, 'fresh teacher should seed room');
  assert.ok(freshTeacherState.you?.participantId);

  mark('seed-snapshot');
  teacher.emit('board:snapshot', roomPayload(room, room.teacherToken, {
    state: {
      currentPage: 0,
      trainerUrl: 'negative-numbers-line.html?seed=server-owned',
      pages: [{ id: 'SeedPage01', bg: 'grid', strokes: [] }]
    }
  }));
  await sleep(100);
  let current = (await requestState(teacher)).state;
  assert.equal(current.stateVersion, 1);
  assert.equal(current.pages[0].id, 'SeedPage01');

  mark('teacher-rejoin-initialized-state');
  const teacherRejoin = connectSocket();
  const rejoinState = await join(teacherRejoin, room, 'teacher', room.teacherToken, 2);
  assert.ok(rejoinState.state, 'initialized teacher should receive state');
  assert.equal(rejoinState.state.pages[0].id, 'SeedPage01');
  teacherRejoin.disconnect();

  mark('student-live-join');
  const studentLive = connectSocket();
  const participantsAfterStudent = waitFor(teacher, 'participants:state', payload => (
    payload?.participants?.some(item => item.role === 'student' && Number(item.onlineCount) > 0)
  ));
  const studentState = await join(studentLive, room, 'student', room.studentToken, 2);
  assert.ok(studentState.you?.participantId);
  assert.equal(studentState.state.pages[0].id, 'SeedPage01');
  await participantsAfterStudent;

  mark('stroke-end-persists-and-relays');
  const liveStroke = waitFor(studentLive, 'board:stroke-end', payload => payload?.stroke?.objectId === 'StrokeA01');
  teacher.emit('board:stroke-end', roomPayload(room, room.teacherToken, {
    pageIndex: 0,
    stroke: {
      objectId: 'StrokeA01',
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
  assert.deepEqual(objectIds(current), ['StrokeA01']);
  assert.equal(
    current.pages[0].strokes[0].layerId,
    `participant:${current.participants.find(item => item.role === 'teacher').id}`
  );

  mark('text-add-persists-and-relays');
  const liveText = waitFor(studentLive, 'board:text-add', payload => (
    payload?.text || payload?.stroke || payload?.object
  )?.objectId === 'TextA01');
  teacher.emit('board:text-add', roomPayload(room, room.teacherToken, {
    pageIndex: 0,
    text: {
      objectId: 'TextA01',
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
  assert.deepEqual(objectIds(current), ['StrokeA01', 'TextA01']);

  mark('trainer-state-mirror');
  const trainerStatePromise = waitFor(studentLive, 'board:trainer-state-change', payload => (
    payload?.trainer === 'negative-numbers-line' && payload?.state?.answer === 42
  ));
  teacher.emit('board:trainer-state-change', roomPayload(room, room.teacherToken, {
    trainer: 'negative-numbers-line',
    state: { answer: 42 }
  }));
  await trainerStatePromise;

  mark('clear-page');
  const clearPromise = waitFor(studentLive, 'board:clear-page', payload => payload?.pageIndex === 0);
  teacher.emit('board:clear-page', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await clearPromise;
  current = await joinStudentState(room);
  assert.equal(current.pages[0].strokes.length, 0);

  mark('bg-change');
  const bgPromise = waitFor(studentLive, 'board:bg-change', payload => payload?.bg === 'lined');
  teacher.emit('board:bg-change', roomPayload(room, room.teacherToken, { pageIndex: 0, bg: 'lined' }));
  await bgPromise;
  current = await joinStudentState(room);
  assert.equal(current.pages[0].bg, 'lined');

  mark('page-add-switch-delete-legacy-snapshot');
  const legacyStudent = connectSocket();
  await join(legacyStudent, room, 'student', room.studentToken);
  const pageAddPromise = waitFor(studentLive, 'board:page-add', payload => payload?.page?.id === 'PageB01');
  const legacyPageAddSnapshot = waitFor(legacyStudent, 'board:snapshot', payload => (
    payload?.state?.pages?.some(page => page.id === 'PageB01')
  ));
  teacher.emit('board:page-add', roomPayload(room, room.teacherToken, {
    pageIndex: 1,
    page: { id: 'PageB01', bg: 'blank', strokes: [{ objectId: 'Ignored01' }] }
  }));
  const pageAddPayload = await pageAddPromise;
  assert.equal(pageAddPayload.page.bg, 'blank');
  assert.equal(pageAddPayload.page.strokes.length, 0);
  await legacyPageAddSnapshot;
  current = await joinStudentState(room);
  assert.equal(current.pages.length, 2);
  assert.equal(current.currentPage, 1);

  const pageSwitchPromise = waitFor(studentLive, 'board:page-switch', payload => payload?.pageIndex === 0);
  teacher.emit('board:page-switch', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await pageSwitchPromise;
  current = await joinStudentState(room);
  assert.equal(current.currentPage, 0);

  const pageDeletePromise = waitFor(studentLive, 'board:page-delete', payload => payload?.pageIndex === 1);
  const legacyDeleteSnapshot = waitFor(legacyStudent, 'board:snapshot', payload => payload?.state?.pages?.length === 1);
  teacher.emit('board:page-delete', roomPayload(room, room.teacherToken, { pageIndex: 1 }));
  await pageDeletePromise;
  await legacyDeleteSnapshot;
  current = await joinStudentState(room);
  assert.equal(current.pages.length, 1);

  mark('undo-redo-and-redo-clear');
  for (const id of ['StrokeB01', 'StrokeC01']) {
    teacher.emit('board:stroke-end', roomPayload(room, room.teacherToken, {
      pageIndex: 0,
      stroke: { objectId: id, kind: 'path', tool: 'pen', color: '#333333', size: 4, points: [{ x: 1, y: 1 }] }
    }));
    await sleep(80);
  }
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['StrokeB01', 'StrokeC01']);

  const undoPromise = waitFor(teacher, 'board:page-state', payload => payload?.page?.strokes?.length === 1);
  const legacyUndoSnapshot = waitFor(legacyStudent, 'board:snapshot', payload => payload?.state?.pages?.[0]?.strokes?.length === 1);
  teacher.emit('board:stroke-undo', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await undoPromise;
  await legacyUndoSnapshot;
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['StrokeB01']);

  const redoPromise = waitFor(teacher, 'board:page-state', payload => payload?.page?.strokes?.length === 2);
  teacher.emit('board:stroke-redo', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await redoPromise;
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['StrokeB01', 'StrokeC01']);

  const undoAgain = waitFor(teacher, 'board:page-state', payload => payload?.page?.strokes?.length === 1);
  teacher.emit('board:stroke-undo', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await undoAgain;
  teacher.emit('board:stroke-end', roomPayload(room, room.teacherToken, {
    pageIndex: 0,
    stroke: { objectId: 'StrokeD01', kind: 'path', tool: 'pen', color: '#444444', size: 4, points: [{ x: 2, y: 2 }] }
  }));
  await sleep(100);
  teacher.emit('board:stroke-redo', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await sleep(150);
  current = await joinStudentState(room);
  assert.deepEqual(objectIds(current), ['StrokeB01', 'StrokeD01']);

  mark('proto2-snapshot-ignored');
  const beforeProto2 = (await requestState(teacher)).state;
  teacher.emit('board:snapshot', roomPayload(room, room.teacherToken, {
    state: { currentPage: 0, trainerUrl: 'bad.html', pages: [{ id: 'BadPage01', bg: 'blank', strokes: [] }] }
  }));
  await sleep(120);
  const afterProto2 = (await requestState(teacher)).state;
  assert.equal(afterProto2.stateVersion, beforeProto2.stateVersion);
  assert.notEqual(afterProto2.pages[0].id, 'BadPage01');

  mark('legacy-snapshot-fallback');
  const legacyTeacher = connectSocket();
  await join(legacyTeacher, room, 'teacher', room.teacherToken);
  const beforeLegacy = (await requestState(teacher)).state;
  legacyTeacher.emit('board:snapshot', roomPayload(room, room.teacherToken, {
    state: {
      currentPage: 0,
      trainerUrl: 'legacy.html',
      pages: [{
        id: 'LegacyPage01',
        bg: 'grid',
        strokes: [{ objectId: 'LegacyObj01', authorId: 'fake', authorRole: 'student', kind: 'path', tool: 'pen', points: [] }]
      }]
    }
  }));
  await sleep(150);
  const afterLegacy = (await requestState(teacher)).state;
  assert.ok(afterLegacy.stateVersion > beforeLegacy.stateVersion);
  assert.equal(afterLegacy.pages[0].id, 'LegacyPage01');
  assert.equal(afterLegacy.pages[0].strokes[0].authorRole, 'teacher');

  mark('student-rejections');
  for (const [event, extra] of [
    ['board:stroke-undo', { pageIndex: 0 }],
    ['board:page-delete', { pageIndex: 0 }],
    ['board:stroke-end', { pageIndex: 0, stroke: { objectId: 'Student01', kind: 'path', points: [] } }]
  ]) {
    const errorPromise = waitFor(studentLive, 'room:error', payload => /доступ|комната/i.test(String(payload?.message || '')));
    studentLive.emit(event, roomPayload(room, room.studentToken, extra));
    await errorPromise;
  }
  studentLive.emit('board:stroke-end', roomPayload(room, room.studentToken, {
    pageIndex: 0,
    stroke: { objectId: 'NoRelay01', kind: 'path', points: [] }
  }));
  await expectNoEvent(teacher, 'board:stroke-end');

  mark('single-page-delete-replaces-page');
  teacher.emit('board:page-delete', roomPayload(room, room.teacherToken, { pageIndex: 0 }));
  await sleep(120);
  current = await joinStudentState(room);
  assert.equal(current.pages.length, 1);
  assert.equal(current.pages[0].strokes.length, 0);
  assert.notEqual(current.pages[0].id, 'LegacyPage01');

  mark('duplicate-join-guard');
  const dupRoom = await postRoom();
  const dupTeacher = connectSocket();
  await join(dupTeacher, dupRoom, 'teacher', dupRoom.teacherToken, 2);
  const duplicateParticipants = waitFor(dupTeacher, 'participants:state', payload => payload?.participants?.some(item => item.role === 'teacher'));
  dupTeacher.emit('room:join', { roomId: dupRoom.roomId, role: 'teacher', token: dupRoom.teacherToken, proto: 2 });
  const duplicateState = await duplicateParticipants;
  assert.equal(duplicateState.participants.find(item => item.role === 'teacher').onlineCount, 1);
  dupTeacher.disconnect();

  mark('disconnect-offline');
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

  mark('active-ttl-protection');
  const ttlRoom = await postRoom();
  const ttlTeacher = connectSocket();
  await join(ttlTeacher, ttlRoom, 'teacher', ttlRoom.teacherToken, 2);
  await sleep(700);
  assert.ok((await health()).rooms >= 1);
  ttlTeacher.disconnect();

  mark('ttl-inactive-cleanup');
  for (const socket of sockets) socket.disconnect();
  await sleep(750);
  await health();
  await postRoom();
  assert.ok((await health()).rooms >= 1);
  await sleep(750);
  await waitForRooms(0);

  mark('done');
} finally {
  for (const socket of sockets) socket.disconnect();
}
