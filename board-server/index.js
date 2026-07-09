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

function blankPage() {
  return { id: makeId(6), bg: 'grid', strokes: [] };
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
  object.objectId = isValidObjectId(object.objectId) ? object.objectId : makeId(9);
  object.authorId = fallbackAuthor.id;
  object.authorRole = AUTHOR_ROLES.has(fallbackAuthor.role) ? fallbackAuthor.role : 'teacher';
  object.layerId = `participant:${object.authorId}`;
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
      id: String(page.id || `page-${index + 1}`),
      bg: ['grid', 'lined', 'blank'].includes(page.bg) ? page.bg : 'grid',
      strokes: Array.isArray(page.strokes)
        ? page.strokes.map(stroke => normalizeObjectMeta(room, { ...stroke }, owner, { preserveCreatedAt: true }))
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
  return true;
}

function authenticate(roomId, role, token) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Комната не найдена' };
  if (role === 'teacher' && token === room.teacherToken) return { room, role };
  if (role === 'student' && token === room.studentToken) return { room, role };
  return { error: 'Нет доступа к комнате' };
}

function requireTeacher(socket, payload = {}) {
  const roomId = payload.roomId || socket.data.roomId;
  const token = payload.token || socket.data.token;
  const auth = authenticate(roomId, 'teacher', token);
  if (auth.error) {
    socket.emit('room:error', { message: auth.error });
    return null;
  }
  return auth.room;
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
    markParticipantConnected(auth.room, role, socket);
    const participant = findParticipant(auth.room, role);
    socket.join(auth.room.roomId);
    socket.emit('room:state', {
      role,
      state: role === 'student' ? publicState(auth.room) : null,
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

  [
    'board:stroke-start',
    'board:stroke-points',
    'board:stroke-end',
    'board:text-add',
    'board:clear-page',
    'board:page-add',
    'board:page-switch',
    'board:bg-change'
  ].forEach(eventName => {
    socket.on(eventName, payload => {
      const room = requireTeacher(socket, payload);
      if (!room) return;
      const participant = socketParticipant(room, socket);
      if (eventName === 'board:stroke-start' || eventName === 'board:stroke-end') {
        normalizeObjectMeta(room, payload?.stroke, participant, { preserveCreatedAt: false });
      }
      if (eventName === 'board:text-add') {
        normalizeObjectMeta(room, payload?.stroke, participant, { preserveCreatedAt: false });
        normalizeObjectMeta(room, payload?.text, participant, { preserveCreatedAt: false });
        normalizeObjectMeta(room, payload?.object, participant, { preserveCreatedAt: false });
      }
      touchRoom(room);
      socket.to(room.roomId).emit(eventName, payload);
    });
  });

  socket.on('board:trainer-url-change', payload => {
    const room = requireTeacher(socket, payload);
    if (!room) return;
    const trainerUrl = normalizeTrainerUrl(payload?.trainerUrl);
    if (!trainerUrl) return;
    room.trainerUrl = trainerUrl;
    room.latestTrainerState = null;
    touchRoom(room);
    socket.to(room.roomId).emit('board:trainer-url-change', { trainerUrl });
  });

  socket.on('board:trainer-state-change', payload => {
    const room = requireTeacher(socket, payload);
    if (!room) return;
    const latestTrainerState = normalizeTrainerState(payload);
    if (!latestTrainerState) return;
    room.latestTrainerState = latestTrainerState;
    touchRoom(room);
    socket.to(room.roomId).emit('board:trainer-state-change', latestTrainerState);
  });

  socket.on('board:snapshot', payload => {
    const room = requireTeacher(socket, payload);
    if (!room) return;
    if (applySnapshot(room, payload?.state)) {
      touchRoom(room);
      socket.to(room.roomId).emit('board:snapshot', { state: publicState(room) });
    }
  });
});

const cleanupTimer = setInterval(cleanupRooms, ROOM_CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.();
