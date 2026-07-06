const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
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

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed`));
  }
}));

const rooms = new Map();

function makeId(size = 12) {
  return crypto.randomBytes(size).toString('base64url');
}

function blankPage() {
  return { id: makeId(6), bg: 'grid', strokes: [] };
}

function createRoom() {
  const roomId = makeId(9);
  const room = {
    roomId,
    teacherToken: makeId(18),
    studentToken: makeId(18),
    createdAt: new Date().toISOString(),
    currentPage: 0,
    pages: [blankPage()],
    trainerUrl: 'negative-numbers-line.html'
  };
  rooms.set(roomId, room);
  return room;
}

function publicState(room) {
  return {
    roomId: room.roomId,
    createdAt: room.createdAt,
    currentPage: room.currentPage,
    pages: room.pages,
    trainerUrl: room.trainerUrl
  };
}

function normalizeSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.pages) || snapshot.pages.length === 0) return null;
  return {
    currentPage: Math.max(0, Math.min(Number(snapshot.currentPage || 0), snapshot.pages.length - 1)),
    pages: snapshot.pages.map((page, index) => ({
      id: String(page.id || `page-${index + 1}`),
      bg: ['grid', 'lined', 'blank'].includes(page.bg) ? page.bg : 'grid',
      strokes: Array.isArray(page.strokes) ? page.strokes : []
    })),
    trainerUrl: typeof snapshot.trainerUrl === 'string' ? snapshot.trainerUrl : 'negative-numbers-line.html'
  };
}

function applySnapshot(room, snapshot) {
  const next = normalizeSnapshot(snapshot);
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
  res.json({ ok: true, rooms: rooms.size });
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
    origin: allowedOrigins,
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
    socket.join(auth.room.roomId);
    socket.emit('room:state', { role, state: role === 'student' ? publicState(auth.room) : null });
  });

  socket.on('room:state', () => {
    const room = rooms.get(socket.data.roomId);
    if (room) socket.emit('room:state', { role: socket.data.role, state: publicState(room) });
  });

  [
    'board:stroke-start',
    'board:stroke-points',
    'board:stroke-end',
    'board:text-add',
    'board:clear-page',
    'board:page-add',
    'board:page-switch',
    'board:bg-change',
    'board:trainer-url-change'
  ].forEach(eventName => {
    socket.on(eventName, payload => {
      const room = requireTeacher(socket, payload);
      if (!room) return;
      socket.to(room.roomId).emit(eventName, payload);
    });
  });

  socket.on('board:snapshot', payload => {
    const room = requireTeacher(socket, payload);
    if (!room) return;
    if (applySnapshot(room, payload?.state)) {
      socket.to(room.roomId).emit('board:snapshot', { state: publicState(room) });
    }
  });
});
