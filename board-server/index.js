const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const SERVER_STARTED_AT = new Date().toISOString();
const DEFAULT_ORIGINS = [
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://mathexam.space'
];
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const DEFAULT_ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_ROOM_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const ROOM_TTL_MS = parsePositiveInteger(process.env.ROOM_TTL_MS, DEFAULT_ROOM_TTL_MS);
const ROOM_CLEANUP_INTERVAL_MS = parsePositiveInteger(
  process.env.ROOM_CLEANUP_INTERVAL_MS,
  DEFAULT_ROOM_CLEANUP_INTERVAL_MS
);
const AUTHOR_ROLES = new Set(['teacher', 'student', 'bot']);
const PAGE_BACKGROUNDS = new Set(['grid', 'lined', 'blank']);

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isLocalDevOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch (_error) {
    return false;
  }
}

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`Origin ${origin} is not allowed`));
}

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: corsOrigin }));

const rooms = new Map();

function nowIso() {
  return new Date().toISOString();
}

function touchRoom(room, timestamp = nowIso()) {
  if (room) room.lastActivityAt = timestamp;
}

function hasOnlineParticipants(room) {
  return (room?.participants || []).some(participant => Number(participant?.onlineCount || 0) > 0);
}

function cleanupRooms(now = Date.now()) {
  let removed = 0;
  for (const [roomId, room] of rooms) {
    const lastActivity = Date.parse(room.lastActivityAt || room.createdAt || '') || 0;
    if (now - lastActivity > ROOM_TTL_MS && !hasOnlineParticipants(room)) {
      rooms.delete(roomId);
      removed += 1;
    }
  }
  return removed;
}

function makeId(size = 12) {
  return crypto.randomBytes(size).toString('base64url');
}

function normalizePageId(value) {
  return isValidObjectId(value) ? value : makeId(6);
}

function normalizeBoardBg(value) {
  return PAGE_BACKGROUNDS.has(value) ? value : 'grid';
}

function blankPage() {
  return { id: makeId(6), bg: 'grid', strokes: [] };
}

function safePageFromPayload(page = {}) {
  return {
    id: normalizePageId(page.id),
    bg: normalizeBoardBg(page.bg),
    strokes: []
  };
}

function createParticipant(role, joinedAt) {
  const isTeacher = role === 'teacher';
  return {
    id: makeId(10),
    role,
    name: isTeacher ? 'Учитель' : 'Ученик',
    color: isTeacher ? '#172033' : '#ea580c',
    caps: {
      moderate: isTeacher,
      structure: isTeacher,
      draw: isTeacher,
      controlTrainer: isTeacher,
      view: true
    },
    connected: false,
    onlineCount: 0,
    lastSeen: null,
    joinedAt
  };
}

function createRoom() {
  const roomId = makeId(9);
  const createdAt = nowIso();
  const room = {
    roomId,
    teacherToken: makeId(18),
    studentToken: makeId(18),
    createdAt,
    lastActivityAt: createdAt,
    initialized: false,
    stateVersion: 0,
    redoStacks: {},
    currentPage: 0,
    pages: [blankPage()],
    trainerUrl: 'negative-numbers-line.html',
    latestTrainerState: null,
    participants: [
      createParticipant('teacher', createdAt),
      createParticipant('student', createdAt)
    ]
  };
  rooms.set(roomId, room);
  return room;
}

function publicParticipants(room) {
  return (room.participants || []).map(participant => ({
    id: participant.id,
    role: participant.role,
    name: participant.name,
    color: participant.color,
    caps: { ...participant.caps },
    connected: participant.connected,
    onlineCount: participant.onlineCount,
    lastSeen: participant.lastSeen,
    joinedAt: participant.joinedAt
  }));
}

function publicState(room) {
  return {
    roomId: room.roomId,
    createdAt: room.createdAt,
    stateVersion: Number(room.stateVersion || 0),
    currentPage: room.currentPage,
    pages: room.pages,
    trainerUrl: room.trainerUrl,
    latestTrainerState: room.latestTrainerState,
    participants: publicParticipants(room)
  };
}

function participantsState(room) {
  return { participants: publicParticipants(room) };
}

function findParticipant(room, role) {
  return (room.participants || []).find(participant => participant.role === role) || null;
}

function findParticipantByIdAndRole(room, authorId, authorRole) {
  if (typeof authorId !== 'string' || !AUTHOR_ROLES.has(authorRole)) return null;
  return (room.participants || []).find(participant => (
    participant.id === authorId && participant.role === authorRole
  )) || null;
}

function roomOwner(room) {
  return findParticipant(room, 'teacher') || (room.participants || [])[0] || {
    id: 'room-owner',
    role: 'teacher',
    name: 'Учитель',
    color: '#172033',
    caps: {
      moderate: true,
      structure: true,
      draw: true,
      controlTrainer: true,
      view: true
    }
  };
}

function socketParticipant(room, socket) {
  return (room.participants || []).find(participant => participant.id === socket.data.participantId)
    || findParticipant(room, socket.data.role)
    || roomOwner(room);
}

function publicYou(participant, role) {
  if (!participant) return null;
  return {
    participantId: participant.id,
    role: participant.role || role,
    name: participant.name,
    color: participant.color,
    caps: { ...(participant.caps || {}) }
  };
}

function isValidObjectId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(value);
}

function isValidIsoDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function normalizeObjectMeta(room, object, author, options = {}) {
  if (!object || typeof object !== 'object') return object;
  const fallbackAuthor = author && AUTHOR_ROLES.has(author.role) ? author : roomOwner(room);
  const existingAuthor = options.preserveExistingAuthor
    ? findParticipantByIdAndRole(room, object.authorId, object.authorRole)
    : null;
  const resolvedAuthor = existingAuthor || fallbackAuthor;
  object.objectId = isValidObjectId(object.objectId) ? object.objectId : makeId(9);
  object.authorId = resolvedAuthor.id;
  object.authorRole = AUTHOR_ROLES.has(resolvedAuthor.role) ? resolvedAuthor.role : 'teacher';
  if (existingAuthor && typeof object.layerId === 'string' && object.layerId.length > 0 && object.layerId.length <= 80) {
    object.layerId = object.layerId;
  } else {
    object.layerId = `participant:${object.authorId}`;
  }
  object.createdAt = options.preserveCreatedAt && isValidIsoDate(object.createdAt) ? object.createdAt : nowIso();
  return object;
}

function markParticipantConnected(room, role, socket) {
  const participant = findParticipant(room, role);
  if (!participant) return;
  const now = nowIso();
  if (socket.data.participantId === participant.id) {
    participant.connected = participant.onlineCount > 0;
    participant.lastSeen = now;
    touchRoom(room, now);
    return;
  }
  participant.connected = true;
  participant.onlineCount += 1;
  participant.lastSeen = now;
  socket.data.participantId = participant.id;
  touchRoom(room, now);
}

function markParticipantDisconnected(socket) {
  const room = rooms.get(socket.data.roomId);
  if (!room || !socket.data.participantId) return null;
  const participant = (room.participants || []).find(item => item.id === socket.data.participantId);
  if (!participant) return null;
  const now = nowIso();
  participant.onlineCount = Math.max(0, participant.onlineCount - 1);
  participant.connected = participant.onlineCount > 0;
  participant.lastSeen = now;
  touchRoom(room, now);
  return room;
}

function normalizeTrainerUrl(value) {
  const url = typeof value === 'string' ? value.trim() : '';
  return url ? url.slice(0, 1000) : '';
}

function normalizeTrainerState(payload) {
  if (!payload || payload.trainer !== 'negative-numbers-line' || !payload.state || typeof payload.state !== 'object') {
    return null;
  }
  return {
    trainer: 'negative-numbers-line',
    state: payload.state,
    updatedAt: new Date().toISOString()
  };
}

function normalizeSnapshot(room, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.pages) || snapshot.pages.length === 0) return null;
  const owner = roomOwner(room);
  return {
    currentPage: Math.max(0, Math.min(Number(snapshot.currentPage || 0), snapshot.pages.length - 1)),
    pages: snapshot.pages.map((page, index) => ({
      id: normalizePageId(page.id || `page-${index + 1}`),
      bg: normalizeBoardBg(page.bg),
      strokes: Array.isArray(page.strokes)
        ? page.strokes.map(stroke => normalizeObjectMeta(room, { ...stroke }, owner, {
          preserveCreatedAt: true,
          preserveExistingAuthor: true
        }))
        : []
    })),
    trainerUrl: normalizeTrainerUrl(snapshot.trainerUrl) || 'negative-numbers-line.html'
  };
}

function applySnapshot(room, snapshot) {
  const next = normalizeSnapshot(room, snapshot);
  if (!next) return false;
  room.currentPage = next.currentPage;
  room.pages = next.pages;
  room.trainerUrl = next.trainerUrl;
  room.redoStacks = {};
  return true;
}

function pageRef(room, pageIndex) {
  const index = Number(pageIndex);
  if (!Number.isInteger(index) || index < 0 || index >= room.pages.length) return null;
  return { pageIndex: index, page: room.pages[index] };
}

function insertionIndex(room, pageIndex) {
  const index = Number(pageIndex);
  if (!Number.isInteger(index) || index < 0 || index > room.pages.length) return room.pages.length;
  return index;
}

function emitBoardError(socket, message = 'Некорректное состояние доски') {
  socket.emit('room:error', { message });
}

function markBoardStateChanged(room) {
  room.initialized = true;
  room.stateVersion = Number(room.stateVersion || 0) + 1;
  touchRoom(room);
}

function redoStack(room, participantId) {
  room.redoStacks = room.redoStacks || {};
  if (!Array.isArray(room.redoStacks[participantId])) room.redoStacks[participantId] = [];
  return room.redoStacks[participantId];
}

function clearRedoForAuthorPage(room, authorId, pageId) {
  const stack = redoStack(room, authorId);
  room.redoStacks[authorId] = stack.filter(entry => entry.pageId !== pageId);
}

function clearRedoForPage(room, pageId) {
  room.redoStacks = room.redoStacks || {};
  Object.keys(room.redoStacks).forEach(authorId => {
    room.redoStacks[authorId] = (room.redoStacks[authorId] || []).filter(entry => entry.pageId !== pageId);
  });
}

function normalizeLiveBoardObject(room, payload, participant) {
  if (!payload || typeof payload !== 'object') return null;
  ['stroke', 'text', 'object'].forEach(key => {
    normalizeObjectMeta(room, payload[key], participant, {
      preserveCreatedAt: false,
      preserveExistingAuthor: false
    });
  });
  return payload.stroke || payload.text || payload.object || null;
}

function persistBoardObject(room, payload, participant) {
  const target = pageRef(room, payload?.pageIndex);
  if (!target) return null;
  const object = normalizeLiveBoardObject(room, payload, participant);
  if (!object) return null;
  target.page.strokes.push(object);
  clearRedoForAuthorPage(room, participant.id, target.page.id);
  markBoardStateChanged(room);
  return { ...payload, pageIndex: target.pageIndex };
}

function emitLegacySnapshot(socket, room) {
  socket.to(room.roomId).emit('board:snapshot', { state: publicState(room) });
}

function findLastAuthoredStrokeIndex(page, authorId) {
  for (let index = page.strokes.length - 1; index >= 0; index -= 1) {
    if (page.strokes[index]?.authorId === authorId) return index;
  }
  return -1;
}

function authenticate(roomId, role, token) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Комната не найдена' };
  if (role === 'teacher' && token === room.teacherToken) return { room, role };
  if (role === 'student' && token === room.studentToken) return { room, role };
  return { error: 'Нет доступа к комнате' };
}

function requireTeacherAccess(socket, payload = {}) {
  const roomId = payload.roomId || socket.data.roomId;
  const token = payload.token || socket.data.token;
  const auth = authenticate(roomId, 'teacher', token);
  if (auth.error) {
    socket.emit('room:error', { message: auth.error });
    return null;
  }
  return auth.room;
}

function requireWriter(socket, payload = {}) {
  return requireTeacherAccess(socket, payload);
}

function requireStructure(socket, payload = {}) {
  return requireTeacherAccess(socket, payload);
}

app.get('/health', (_req, res) => {
  cleanupRooms();
  res.json({
    ok: true,
    rooms: rooms.size,
    serverStartedAt: SERVER_STARTED_AT,
    roomTtlMs: ROOM_TTL_MS,
    roomCleanupIntervalMs: ROOM_CLEANUP_INTERVAL_MS,
    features: { roomTtlCleanup: true }
  });
});

app.post('/api/rooms', (_req, res) => {
  const room = createRoom();
  res.status(201).json({
    roomId: room.roomId,
    teacherToken: room.teacherToken,
    studentToken: room.studentToken,
    state: publicState(room)
  });
});

const httpServer = app.listen(PORT, HOST, () => {
  console.log(`Mathexam board server listening on ${HOST}:${PORT}`);
});

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 2e6
});

io.on('connection', socket => {
  socket.on('room:create', callback => {
    const room = createRoom();
    callback?.({
      ok: true,
      roomId: room.roomId,
      teacherToken: room.teacherToken,
      studentToken: room.studentToken,
      state: publicState(room)
    });
  });

  socket.on('room:join', payload => {
    const role = payload?.role === 'student' ? 'student' : 'teacher';
    const auth = authenticate(payload?.roomId, role, payload?.token);
    if (auth.error) {
      socket.emit('room:error', { message: auth.error });
      return;
    }
    socket.data.roomId = auth.room.roomId;
    socket.data.role = role;
    socket.data.token = payload.token;
    const proto = Number(payload?.proto);
    socket.data.proto = Number.isFinite(proto) && proto > 0 ? proto : 1;
    markParticipantConnected(auth.room, role, socket);
    const participant = findParticipant(auth.room, role);
    socket.join(auth.room.roomId);
    socket.emit('room:state', {
      role,
      state: role === 'student' || auth.room.initialized ? publicState(auth.room) : null,
      you: publicYou(participant, role)
    });
    io.to(auth.room.roomId).emit('participants:state', participantsState(auth.room));
  });

  socket.on('disconnect', () => {
    const room = markParticipantDisconnected(socket);
    if (room) io.to(room.roomId).emit('participants:state', participantsState(room));
  });

  socket.on('room:state', () => {
    const room = rooms.get(socket.data.roomId);
    if (room) {
      const role = socket.data.role;
      socket.emit('room:state', { role, state: publicState(room), you: publicYou(socketParticipant(room, socket), role) });
    }
  });

  socket.on('board:stroke-start', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    normalizeObjectMeta(room, payload?.stroke, socketParticipant(room, socket), {
      preserveCreatedAt: false,
      preserveExistingAuthor: false
    });
    touchRoom(room);
    socket.to(room.roomId).emit('board:stroke-start', payload);
  });

  socket.on('board:stroke-points', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    touchRoom(room);
    socket.to(room.roomId).emit('board:stroke-points', payload);
  });

  socket.on('board:stroke-end', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    const nextPayload = persistBoardObject(room, payload, socketParticipant(room, socket));
    if (!nextPayload) {
      emitBoardError(socket);
      return;
    }
    socket.to(room.roomId).emit('board:stroke-end', nextPayload);
  });

  socket.on('board:text-add', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    const nextPayload = persistBoardObject(room, payload, socketParticipant(room, socket));
    if (!nextPayload) {
      emitBoardError(socket);
      return;
    }
    socket.to(room.roomId).emit('board:text-add', nextPayload);
  });

  socket.on('board:clear-page', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    const target = pageRef(room, payload?.pageIndex);
    if (!target) {
      emitBoardError(socket);
      return;
    }
    target.page.strokes = [];
    clearRedoForPage(room, target.page.id);
    markBoardStateChanged(room);
    socket.to(room.roomId).emit('board:clear-page', { pageIndex: target.pageIndex, stateVersion: room.stateVersion });
  });

  socket.on('board:page-add', payload => {
    const room = requireStructure(socket, payload);
    if (!room) return;
    const page = safePageFromPayload(payload?.page);
    const pageIndex = insertionIndex(room, payload?.pageIndex);
    room.pages.splice(pageIndex, 0, page);
    room.currentPage = pageIndex;
    markBoardStateChanged(room);
    socket.to(room.roomId).emit('board:page-add', {
      pageIndex,
      currentPage: room.currentPage,
      page,
      stateVersion: room.stateVersion
    });
    emitLegacySnapshot(socket, room);
  });

  socket.on('board:page-delete', payload => {
    const room = requireStructure(socket, payload);
    if (!room) return;
    const target = pageRef(room, payload?.pageIndex);
    if (!target) {
      emitBoardError(socket);
      return;
    }
    const deletedPageId = target.page.id;
    if (room.pages.length === 1) {
      room.pages[0] = blankPage();
      room.currentPage = 0;
    } else {
      room.pages.splice(target.pageIndex, 1);
      room.currentPage = Math.min(room.currentPage, room.pages.length - 1);
    }
    clearRedoForPage(room, deletedPageId);
    markBoardStateChanged(room);
    socket.to(room.roomId).emit('board:page-delete', {
      pageIndex: target.pageIndex,
      currentPage: room.currentPage,
      page: room.pages[room.currentPage],
      stateVersion: room.stateVersion
    });
    emitLegacySnapshot(socket, room);
  });

  socket.on('board:page-switch', payload => {
    const room = requireStructure(socket, payload);
    if (!room) return;
    const target = pageRef(room, payload?.pageIndex);
    if (!target) {
      emitBoardError(socket);
      return;
    }
    room.currentPage = target.pageIndex;
    markBoardStateChanged(room);
    socket.to(room.roomId).emit('board:page-switch', { pageIndex: target.pageIndex, stateVersion: room.stateVersion });
  });

  socket.on('board:bg-change', payload => {
    const room = requireStructure(socket, payload);
    if (!room) return;
    const target = pageRef(room, payload?.pageIndex);
    if (!target) {
      emitBoardError(socket);
      return;
    }
    target.page.bg = normalizeBoardBg(payload?.bg);
    markBoardStateChanged(room);
    socket.to(room.roomId).emit('board:bg-change', {
      pageIndex: target.pageIndex,
      bg: target.page.bg,
      stateVersion: room.stateVersion
    });
  });

  socket.on('board:stroke-undo', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    const participant = socketParticipant(room, socket);
    const target = pageRef(room, payload?.pageIndex);
    if (!target) {
      emitBoardError(socket);
      return;
    }
    const strokeIndex = findLastAuthoredStrokeIndex(target.page, participant.id);
    if (strokeIndex < 0) return;
    const [stroke] = target.page.strokes.splice(strokeIndex, 1);
    redoStack(room, participant.id).push({ pageId: target.page.id, stroke });
    markBoardStateChanged(room);
    io.to(room.roomId).emit('board:page-state', {
      pageIndex: target.pageIndex,
      page: target.page,
      stateVersion: room.stateVersion
    });
    emitLegacySnapshot(socket, room);
  });

  socket.on('board:stroke-redo', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    const participant = socketParticipant(room, socket);
    const stack = redoStack(room, participant.id);
    let entry = null;
    let pageIndex = -1;
    while (stack.length > 0) {
      const candidate = stack.pop();
      const candidatePageIndex = room.pages.findIndex(page => page.id === candidate.pageId);
      if (candidatePageIndex >= 0) {
        entry = candidate;
        pageIndex = candidatePageIndex;
        break;
      }
    }
    if (!entry) return;
    const page = room.pages[pageIndex];
    page.strokes.push(entry.stroke);
    markBoardStateChanged(room);
    io.to(room.roomId).emit('board:page-state', {
      pageIndex,
      page,
      stateVersion: room.stateVersion
    });
    emitLegacySnapshot(socket, room);
  });

  socket.on('board:trainer-url-change', payload => {
    const room = requireStructure(socket, payload);
    if (!room) return;
    const trainerUrl = normalizeTrainerUrl(payload?.trainerUrl);
    if (!trainerUrl) return;
    room.trainerUrl = trainerUrl;
    room.latestTrainerState = null;
    touchRoom(room);
    socket.to(room.roomId).emit('board:trainer-url-change', { trainerUrl });
  });

  socket.on('board:trainer-state-change', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    const latestTrainerState = normalizeTrainerState(payload);
    if (!latestTrainerState) return;
    room.latestTrainerState = latestTrainerState;
    touchRoom(room);
    socket.to(room.roomId).emit('board:trainer-state-change', latestTrainerState);
  });

  socket.on('board:snapshot', payload => {
    const room = requireStructure(socket, payload);
    if (!room) return;
    if (room.initialized && Number(socket.data.proto || 1) >= 2) return;
    if (applySnapshot(room, payload?.state)) {
      markBoardStateChanged(room);
      socket.to(room.roomId).emit('board:snapshot', { state: publicState(room) });
    }
  });
});

const cleanupTimer = setInterval(cleanupRooms, ROOM_CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.();
