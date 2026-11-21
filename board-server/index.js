const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { loadTrainerRegistry, TRAINER_PATH_LIMITS } = require('./trainer-registry');
const { ProgressStoreError, loadProgressStore } = require('./progress-store');
const { createGroupLessonsRouter } = require('./group-lessons');
const { RoomStore } = require('./room-store');
const { createLearningApi } = require('./learning-api');
const learningContracts = require('./learning-contracts');
const { createTeachingRouter } = require('./learning-teaching');
const { createLearningRunsRouter } = require('./learning-runs');
const { applyBootstrapEnvironment } = require('./learning-admin');

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
const trainerRegistry = loadTrainerRegistry();
const progressPersistenceConfirmed = process.env.PROGRESS_PERSISTENCE_CONFIRMED === '1';
const progressStore = loadProgressStore({
  filePath: process.env.PROGRESS_STORE_PATH,
  persistenceConfirmed: progressPersistenceConfirmed,
  isTrainerAllowed: trainerId => trainerRegistry.loaded && trainerRegistry.allowsProgress(trainerId)
});
const PROGRESS_CREATE_WINDOW_MS = 60 * 60 * 1000;
const PROGRESS_CREATE_LIMIT = parsePositiveInteger(process.env.PROGRESS_CREATE_LIMIT, 20);

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
app.disable('x-powered-by');
const learningPublicOrigin = process.env.LEARNING_PUBLIC_ORIGIN || 'https://mathexam-board-ladynata.amvera.io';
const learningTrainerOrigin = process.env.LEARNING_TRAINER_ORIGIN || 'https://mathexam.space';
const localLearning = process.env.NODE_ENV !== 'production' && process.env.LEARNING_LOCAL_DEV === '1';
for (const origin of [learningPublicOrigin, learningTrainerOrigin]) {
  const url = new URL(origin);
  if (url.origin !== origin || (url.protocol !== 'https:' && !(localLearning && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) throw new Error('Invalid learning origin');
}
if (learningPublicOrigin === learningTrainerOrigin) throw new Error('The account cabinet and trainers require separate origins');
const learning = createLearningApi({ contracts: learningContracts, publicOrigin: learningPublicOrigin, secureCookies: !localLearning });
const bootstrapResult = applyBootstrapEnvironment(learning.store);
// Closed operator log: fixed diagnostic enum only, never login/token/hash.
console.info('[learning-bootstrap]', bootstrapResult.status);
const learningRuns = createLearningRunsRouter(learning);
const teaching = createTeachingRouter(learning);
// Account routes precede legacy CORS. Cabinet cookies never participate in the
// public site's anonymous board API; all account mutations verify exact Origin.
app.use('/api/learning', express.json({ limit: '5mb' }));
app.get('/api/learning/status', (_req, res) => res.set('Cache-Control', 'no-store').json({ ...learning.store.status(), trainerOrigin: learningTrainerOrigin }));
app.use('/api/learning', learning.router, learningRuns.router, teaching);
app.use('/api/learning', (_req, res) => res.status(404).json({ ok: false, error: 'LEARNING_NOT_FOUND' }));
const learningHeaders = (_req, res, next) => {
  res.set({
    'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' ${learningTrainerOrigin}; connect-src 'self'; frame-src ${learningTrainerOrigin}; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`
  }); next();
};
app.use('/learning', learningHeaders, express.static(path.join(__dirname, '../learning'), { dotfiles: 'deny', index: 'index.html', fallthrough: false }));
// Only these reviewed renderers enter the native cabinet. Public trainers and
// arbitrary textbook files are not mounted on the authenticated origin.
for (const file of ['math-text.js', 'planar-viewer.js']) {
  app.get('/geometry-course/textbook/assets/' + file, learningHeaders, (_req, res) =>
    res.sendFile(path.join(__dirname, '../geometry-course/textbook/assets', file)));
}
for (const file of ['textbook-source-labels.js', 'textbook-support.js', 'textbook-support.css']) {
  app.get('/courses/vilenkin-6-part-1/' + file, learningHeaders, (_req, res) =>
    res.sendFile(path.join(__dirname, '../courses/vilenkin-6-part-1', file)));
}
for (const file of ['data.js', 'practice.js', 'equation-practice.js', 'grade7-algebra.js', 'grade7-geometry.js', 'grade7-geometry-core.js', 'grade7-geometry-core-models.js', 'grade7-geometry-practice.js', 'grade7-geometry-rebuild-base.js', 'grade7-geometry-rebuild-foundations.js', 'grade7-geometry-rebuild-triangles.js', 'grade7-geometry-rebuild-relations.js', 'grade7-geometry-rebuild-workbook.js', 'grade7-foundations.js', 'pre7-arithmetic.js', 'pre7-applications.js', 'practice-view.js']) {
  app.get('/ege-baza/path/' + file, learningHeaders, (_req, res) => res.sendFile(path.join(__dirname, '../ege-baza/path', file)));
}
process.once('exit', () => learning.close());
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: corsOrigin }));
const groupLessons = createGroupLessonsRouter();
app.use('/api/group-lessons', groupLessons.router);
process.once('exit', () => groupLessons.store.close());

const roomStore = new RoomStore();
const rooms = roomStore.rooms;
// A crash cannot tell us when an online participant became inactive. Give
// recovered rooms one full retention window to reconnect before expiring them.
const roomRecoveryUntil = new Map([...rooms.keys()].map(id => [id, Date.now() + ROOM_TTL_MS]));
process.once('exit', () => roomStore.close());
const progressCreateAttempts = new Map();

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
    if (now - lastActivity > ROOM_TTL_MS && !hasOnlineParticipants(room)
      && now >= (roomRecoveryUntil.get(roomId) || 0)) {
      try { roomStore.remove(roomId); } catch (_) { continue; }
      rooms.delete(roomId);
      roomRecoveryUntil.delete(roomId);
      removed += 1;
    }
  }
  return removed;
}

function makeId(size = 12) {
  return crypto.randomBytes(size).toString('base64url');
}

function bearerCode(req) {
  const header = req.get('authorization');
  if (typeof header !== 'string') return '';
  const match = /^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(header);
  return match ? match[1] : '';
}

function progressNoStore(_req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
}

function allowProgressWorkspaceCreation(req, res, next) {
  const address = req.socket?.remoteAddress || 'unknown';
  const timestamp = Date.now();
  const current = progressCreateAttempts.get(address);
  const record = !current || timestamp - current.startedAt >= PROGRESS_CREATE_WINDOW_MS
    ? { startedAt: timestamp, count: 0 }
    : current;
  record.count += 1;
  progressCreateAttempts.set(address, record);
  if (record.count > PROGRESS_CREATE_LIMIT) {
    res.status(429).json({ ok: false, error: 'PROGRESS_CREATE_RATE_LIMITED' });
    return;
  }
  next();
}

function progressHandler(handler) {
  return (req, res) => {
    try {
      handler(req, res);
    } catch (error) {
      const known = error instanceof ProgressStoreError;
      res.status(known ? error.status : 500).json({
        ok: false,
        error: known ? error.code : 'PROGRESS_INTERNAL_ERROR'
      });
    }
  };
}

function normalizePageId(value) {
  return isValidObjectId(value) ? value : makeId(6);
}

function normalizeBoardBg(value) {
  return PAGE_BACKGROUNDS.has(value) ? value : 'grid';
}

function blankPage() {
  return { id: makeId(6), bg: 'grid', pageEpoch: 0, strokes: [] };
}

function safePageFromPayload(page = {}) {
  if (!page || typeof page !== 'object') page = {};
  return {
    id: normalizePageId(page.id),
    bg: normalizeBoardBg(page.bg),
    pageEpoch: 0,
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
      draw: true,
      controlTrainer: true,
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
  const participants = [
    createParticipant('teacher', createdAt),
    createParticipant('student', createdAt)
  ];
  const teacher = participants.find(participant => participant.role === 'teacher');
  const room = {
    roomId,
    teacherToken: makeId(18),
    studentToken: makeId(18),
    createdAt,
    lastActivityAt: createdAt,
    initialized: false,
    stateVersion: 0,
    control: teacher.id,
    controlVersion: 0,
    redoStacks: {},
    inkReceipts: {},
    currentPage: 0,
    pages: [blankPage()],
    trainerUrl: 'negative-numbers-line.html',
    latestTrainerState: null,
    participants
  };
  roomStore.save(room);
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
    inkDelivery: roomStore.capability(),
    roomTtlMs: ROOM_TTL_MS,
    control: room.control,
    controlVersion: Number(room.controlVersion || 0),
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

function findParticipantById(room, participantId) {
  if (typeof participantId !== 'string') return null;
  return (room.participants || []).find(participant => participant.id === participantId) || null;
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

function canWrite(room, participant) {
  return Boolean(room && participant && room.control === participant.id);
}

function setRoomControl(room, participant) {
  if (!room || !participant || room.control === participant.id) return false;
  return commitRoomMutation(room, draft => {
    draft.control = participant.id;
    draft.controlVersion = Number(draft.controlVersion || 0) + 1;
    touchRoom(draft);
  });
}

function controlState(room) {
  return {
    control: room.control,
    controlVersion: Number(room.controlVersion || 0)
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
  if (!participant) return false;
  const now = nowIso();
  if (!commitRoomMutation(room, draft => {
    const next = findParticipant(draft, role);
    if (socket.data.participantId !== next.id) next.onlineCount += 1;
    next.connected = next.onlineCount > 0; next.lastSeen = now;
    touchRoom(draft, now);
  }, socket)) return false;
  socket.data.participantId = participant.id;
  roomRecoveryUntil.delete(room.roomId);
  return true;
}

function markParticipantDisconnected(socket) {
  const room = rooms.get(socket.data.roomId);
  if (!room || !socket.data.participantId) return null;
  const participant = (room.participants || []).find(item => item.id === socket.data.participantId);
  if (!participant) return null;
  const now = nowIso();
  commitRoomMutation(room, draft => {
    const next = findParticipantById(draft, participant.id);
    next.onlineCount = Math.max(0, next.onlineCount - 1);
    next.connected = next.onlineCount > 0; next.lastSeen = now; touchRoom(draft, now);
  });
  return room;
}

function normalizeTrainerUrl(value) {
  if (
    typeof value !== 'string'
    || !value
    || value.length > TRAINER_PATH_LIMITS.maxUrlLength
  ) {
    return '';
  }
  return value.trim();
}

const TRAINER_STATE_MAX_BYTES = 64 * 1024;
const TRAINER_STATE_MAX_DEPTH = 8;
const TRAINER_STATE_MAX_ARRAY_LENGTH = 2000;
const TRAINER_STATE_VERSION_KEYS = new Set([
  'protocolVersion',
  'trainerVersion',
  'stateSchemaVersion'
]);
function trainerIdFromUrl(value) {
  return trainerRegistry.getByTrainerUrl(normalizeTrainerUrl(value))?.trainerId || null;
}

function validateTrainerState(state, { allowLegacyHtml = false } = {}) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
  const seen = new Set();

  function visit(value, depth) {
    if (depth > TRAINER_STATE_MAX_DEPTH) return false;
    if (value === null) return true;
    const type = typeof value;
    if (type === 'string') {
      return allowLegacyHtml || !/<\/?[a-z][^>]*>/i.test(value);
    }
    if (type === 'number') return Number.isFinite(value);
    if (type === 'boolean') return true;
    if (type !== 'object' || seen.has(value)) return false;
    seen.add(value);
    if (Array.isArray(value)) {
      if (value.length > TRAINER_STATE_MAX_ARRAY_LENGTH) return false;
      for (const entry of value) {
        if (!visit(entry, depth + 1)) return false;
      }
      seen.delete(value);
      return true;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    for (const [key, entry] of Object.entries(value)) {
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') return false;
      if (depth === 1 && TRAINER_STATE_VERSION_KEYS.has(key)) return false;
      if (!allowLegacyHtml && /html$/i.test(key)) return false;
      if (!visit(entry, depth + 1)) return false;
    }
    seen.delete(value);
    return true;
  }

  if (!visit(state, 1)) return false;
  try {
    return Buffer.byteLength(JSON.stringify(state), 'utf8') <= TRAINER_STATE_MAX_BYTES;
  } catch {
    return false;
  }
}

function normalizeTrainerState(room, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const hasTrainerId = Object.prototype.hasOwnProperty.call(payload, 'trainerId');
  const hasCompatibleTrainerId = Object.prototype.hasOwnProperty.call(payload, 'trainer');
  if (hasTrainerId && typeof payload.trainerId !== 'string') return null;
  if (hasCompatibleTrainerId && typeof payload.trainer !== 'string') return null;
  const trainerId = hasTrainerId ? payload.trainerId.trim() : '';
  const compatibleTrainerId = hasCompatibleTrainerId ? payload.trainer.trim() : '';
  if (hasTrainerId && hasCompatibleTrainerId && trainerId !== compatibleTrainerId) return null;
  const canonicalTrainerId = hasTrainerId ? trainerId : compatibleTrainerId;
  const trainerMeta = trainerRegistry.getById(canonicalTrainerId);
  if (!trainerMeta) return null;
  if (trainerIdFromUrl(room?.trainerUrl) !== canonicalTrainerId) return null;
  const metadataKeys = ['protocolVersion', 'trainerVersion', 'stateSchemaVersion'];
  const hasProtocolMetadata = [...metadataKeys, 'bridgeInstanceId'].some(key => (
    Object.prototype.hasOwnProperty.call(payload, key)
  ));
  if (hasProtocolMetadata) {
    if (!metadataKeys.every(key => Object.prototype.hasOwnProperty.call(payload, key))) return null;
    if (payload.protocolVersion !== trainerMeta.bridgeProtocolVersion) return null;
    if (payload.trainerVersion !== trainerMeta.version) return null;
    if (payload.stateSchemaVersion !== trainerMeta.stateSchemaVersion) return null;
  } else if (!trainerMeta.allowLegacyHtml) return null;
  if (!validateTrainerState(payload.state, {
    allowLegacyHtml: !hasProtocolMetadata && trainerMeta.allowLegacyHtml
  })) return null;
  const normalized = {
    trainerId: canonicalTrainerId,
    trainer: canonicalTrainerId,
    state: payload.state,
    updatedAt: new Date().toISOString()
  };
  if (hasProtocolMetadata) {
    normalized.protocolVersion = trainerMeta.bridgeProtocolVersion;
    normalized.trainerVersion = trainerMeta.version;
    normalized.stateSchemaVersion = trainerMeta.stateSchemaVersion;
  }
  return normalized;
}

function normalizeSnapshot(room, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.pages) || snapshot.pages.length === 0) return null;
  const owner = roomOwner(room);
  return {
    currentPage: Math.max(0, Math.min(Number(snapshot.currentPage || 0), snapshot.pages.length - 1)),
    pages: snapshot.pages.map((page, index) => ({
      id: normalizePageId(page.id || `page-${index + 1}`),
      bg: normalizeBoardBg(page.bg),
      pageEpoch: Number.isSafeInteger(page.pageEpoch) && page.pageEpoch >= 0 ? page.pageEpoch : 0,
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
  if (new Set(next.pages.map(page => page.id)).size !== next.pages.length) return false;
  for (const page of next.pages) {
    const previous = room.pages.find(item => item.id === page.id);
    page.pageEpoch = room.initialized && previous ? Number(previous.pageEpoch || 0) + 1 : 0;
  }
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

// Mutations are synchronous and invisible until a full private snapshot has
// reached disk. A failed save leaves the prior room object unchanged.
function commitRoomMutation(room, mutate, socket) {
  const draft = JSON.parse(JSON.stringify(room));
  try {
    if (mutate(draft) === false) return false;
    roomStore.save(draft);
    Object.assign(room, draft);
    return true;
  } catch (_) {
    const payload = { message: 'Сервер не сохранил изменение. Сохраните локальную копию и повторите позже.', code: roomStore.reason || 'ROOM_STORAGE_LIMIT' };
    if (socket) socket.emit('room:error', payload);
    else io.to(room.roomId).emit('room:error', payload);
    return false;
  }
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

function inkFingerprint(payload) {
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
    return JSON.stringify(value);
  }
  return crypto.createHash('sha256').update(canonical({ opId: payload.opId, pageId: payload.pageId,
    pageEpoch: payload.pageEpoch, controlVersion: payload.controlVersion,
    eventName: payload.eventName, stroke: payload.stroke })).digest('hex');
}

function validCompletedInk(payload) {
  const stroke = payload?.stroke;
  const finite = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e7;
  const point = value => value && typeof value === 'object' && finite(value.x) && finite(value.y);
  if (!stroke || typeof stroke !== 'object' || Array.isArray(stroke) || !isValidObjectId(stroke.objectId)
    || !['board:stroke-end', 'board:text-add'].includes(payload.eventName)
    || !Number.isSafeInteger(payload.controlVersion) || payload.controlVersion < 0
    || !Number.isSafeInteger(payload.pageEpoch) || payload.pageEpoch < 0
    || typeof payload.pageId !== 'string' || payload.pageId.length > 80) return false;
  let bytes;
  try { bytes = Buffer.byteLength(JSON.stringify(stroke)); } catch (_) { return false; }
  if (bytes > 512 * 1024) return false;
  function safe(value, depth = 0) {
    if (depth > 6) return false;
    if (value === null || typeof value === 'boolean') return true;
    if (typeof value === 'string') return value.length <= 360 * 1024;
    if (typeof value === 'number') return finite(value);
    if (Array.isArray(value)) return value.length <= 20000 && value.every(item => safe(item, depth + 1));
    return !!value && typeof value === 'object' && Object.keys(value).length <= 40
      && Object.entries(value).every(([key, item]) => !['__proto__', 'constructor', 'prototype'].includes(key) && safe(item, depth + 1));
  }
  if (!safe(stroke) || (payload.eventName === 'board:text-add') !== (stroke.kind === 'text')) return false;
  if (stroke.kind === 'image') return /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(stroke.src || '')
    && point(stroke) && finite(stroke.width) && stroke.width > 0 && finite(stroke.height) && stroke.height > 0;
  if (!finite(stroke.size) || stroke.size <= 0 || stroke.size > 100 || !/^#[a-f0-9]{6}$/i.test(stroke.color || '')) return false;
  if (stroke.kind === 'path') return Array.isArray(stroke.points) && stroke.points.length > 0 && stroke.points.every(point);
  if (['line', 'rect'].includes(stroke.kind)) return point(stroke.start) && point(stroke.end);
  return stroke.kind === 'text' && point(stroke) && typeof stroke.text === 'string' && stroke.text.length > 0 && stroke.text.length <= 10000;
}

function commitCompletedInk(socket, payload, callback) {
  const opId = typeof payload?.opId === 'string' ? payload.opId : '';
  const respond = data => { if (typeof callback === 'function') callback(data); };
  const reject = (error, retryable = false) => respond({ ok: false, opId, error, retryable });
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(opId) || !validCompletedInk(payload)) return reject('ROOM_INK_INVALID');
  if (!roomStore.configured) return reject('ROOM_DURABILITY_UNAVAILABLE');
  if (!roomStore.available) return reject(roomStore.reason || 'ROOM_STORAGE_UNAVAILABLE', true);
  if (payload.roomId !== socket.data.roomId || payload.role !== socket.data.role) return reject('ROOM_UNAUTHORIZED');
  const auth = authenticate(payload.roomId, payload.role, payload.token);
  if (auth.error) return reject('ROOM_UNAUTHORIZED');
  const room = auth.room, participant = findParticipantById(room, socket.data.participantId);
  if (!participant || participant.role !== payload.role) return reject('ROOM_UNAUTHORIZED');
  const key = participant.id + ':' + opId, fingerprint = inkFingerprint(payload);
  const duplicate = room.inkReceipts[key];
  if (duplicate) {
    if (duplicate.fingerprint !== fingerprint) return reject('ROOM_OP_ID_CONFLICT');
    // A receipt is not a command to redraw: the stroke can since have been
    // undone or its page deleted. ACK the original operation without mutation.
    return respond({ ok: true, opId, roomId: room.roomId, pageId: duplicate.pageId,
      pageEpoch: duplicate.pageEpoch, durable: true, stroke: duplicate.stroke, duplicate: true });
  }
  if (!canWrite(room, participant) || room.controlVersion !== payload.controlVersion) return reject('ROOM_CONTROL_CHANGED');
  const pageIndex = room.pages.findIndex(page => page.id === payload.pageId);
  if (pageIndex < 0) return reject('ROOM_PAGE_CHANGED');
  const page = room.pages[pageIndex];
  if (Number(page.pageEpoch || 0) !== payload.pageEpoch) return reject('ROOM_PAGE_CHANGED');
  if (Object.keys(room.inkReceipts).length >= 10000) return reject('ROOM_INK_LIMIT');
  // An object ID is permanent within the room, even after undo/clear. A second
  // operation must not impersonate a previously accepted object.
  if (room.pages.some(page => page.strokes.some(stroke => stroke?.objectId === payload.stroke.objectId))
    || Object.values(room.inkReceipts).some(receipt => receipt?.stroke?.objectId === payload.stroke.objectId)) return reject('ROOM_OBJECT_ID_CONFLICT');
  const draft = JSON.parse(JSON.stringify(room));
  const stroke = normalizeObjectMeta(draft, JSON.parse(JSON.stringify(payload.stroke)), participant);
  draft.pages[pageIndex].strokes.push(stroke);
  clearRedoForAuthorPage(draft, participant.id, page.id); markBoardStateChanged(draft);
  draft.inkReceipts[key] = { fingerprint, pageId: payload.pageId, pageEpoch: payload.pageEpoch, stroke };
  try { roomStore.save(draft); }
  catch (error) { return reject(error.code || 'ROOM_STORAGE_WRITE_FAILED', error.code !== 'ROOM_STORAGE_LIMIT'); }
  Object.assign(room, draft);
  socket.to(room.roomId).emit(payload.eventName, { pageIndex, pageId: payload.pageId,
    pageEpoch: payload.pageEpoch, stateVersion: room.stateVersion, stroke });
  respond({ ok: true, opId, roomId: room.roomId, pageId: payload.pageId, pageEpoch: payload.pageEpoch,
    durable: true, stroke, duplicate: false });
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
  if (!room && roomStore.configured && !roomStore.available) {
    return { error: 'Хранилище комнаты временно недоступно. Сохраните ссылку и повторите позже.', code: 'ROOM_STORAGE_UNAVAILABLE' };
  }
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

function requireAuthenticatedParticipant(socket, payload = {}) {
  const roomId = payload.roomId || socket.data.roomId;
  const token = payload.token || socket.data.token;
  const role = socket.data.role;
  const auth = authenticate(roomId, role, token);
  if (auth.error) {
    socket.emit('room:error', { message: auth.error });
    return null;
  }
  const participant = findParticipantById(auth.room, socket.data.participantId);
  if (!participant) {
    socket.emit('room:error', { message: 'Нет участника комнаты' });
    return null;
  }
  return { room: auth.room, participant };
}

function requireWriter(socket, payload = {}) {
  const access = requireAuthenticatedParticipant(socket, payload);
  if (!access) return null;
  if (!canWrite(access.room, access.participant)) return null;
  return access.room;
}

function requireStructure(socket, payload = {}) {
  return requireTeacherAccess(socket, payload);
}

function returnControlToTeacher(room) {
  const teacher = findParticipant(room, 'teacher');
  return teacher && setRoomControl(room, teacher);
}

function emitControlChanged(room) {
  io.to(room.roomId).emit('control:changed', controlState(room));
}

app.get('/health', (_req, res) => {
  cleanupRooms();
  res.json({
    ok: true,
    rooms: rooms.size,
    serverStartedAt: SERVER_STARTED_AT,
    roomTtlMs: ROOM_TTL_MS,
    roomCleanupIntervalMs: ROOM_CLEANUP_INTERVAL_MS,
    features: { roomTtlCleanup: true, progressWorkspaces: true },
    inkDelivery: roomStore.capability(),
    roomStoreError: roomStore.reason,
    registryLoaded: trainerRegistry.loaded,
    registrySchemaVersion: trainerRegistry.schemaVersion,
    registryDigest: trainerRegistry.digest,
    registrySource: trainerRegistry.source,
    registryEntryCount: trainerRegistry.entries.length,
    registryError: trainerRegistry.error,
    progressStoreReady: progressStore.ready,
    progressStoreError: progressStore.error,
    progressPersistenceConfirmed,
    progressAuthorizedTrainerCount: trainerRegistry.progressEntries.length,
    progressRegistryDigest: trainerRegistry.progressDigest
  });
});

app.get('/api/trainer-registry', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(trainerRegistry.loaded ? 200 : 503).json(trainerRegistry.publicPayload);
});

app.post(
  '/api/progress/workspaces',
  progressNoStore,
  allowProgressWorkspaceCreation,
  progressHandler((req, res) => {
    if (
      !req.body
      || typeof req.body !== 'object'
      || Array.isArray(req.body)
      || Object.keys(req.body).length !== 0
    ) {
      throw new ProgressStoreError('PROGRESS_WORKSPACE_REQUEST_INVALID');
    }
    const workspace = progressStore.createWorkspace();
    res.status(201).json({ ok: true, ...workspace });
  })
);

app.get(
  '/api/progress/workspaces/:workspaceId/assignments',
  progressNoStore,
  progressHandler((req, res) => {
    const workspace = progressStore.listAssignments(
      req.params.workspaceId,
      bearerCode(req)
    );
    res.json({ ok: true, ...workspace });
  })
);

app.post(
  '/api/progress/workspaces/:workspaceId/assignments',
  progressNoStore,
  progressHandler((req, res) => {
    const assignment = progressStore.createAssignment(
      req.params.workspaceId,
      bearerCode(req),
      req.body
    );
    res.status(201).json({ ok: true, ...assignment });
  })
);

app.get(
  '/api/progress/assignments/:assignmentId',
  progressNoStore,
  progressHandler((req, res) => {
    const assignment = progressStore.getAssignment(
      req.params.assignmentId,
      bearerCode(req)
    );
    res.json({ ok: true, ...assignment });
  })
);

app.put(
  '/api/progress/assignments/:assignmentId',
  progressNoStore,
  progressHandler((req, res) => {
    const assignment = progressStore.updateAssignment(
      req.params.assignmentId,
      bearerCode(req),
      req.body
    );
    res.json({ ok: true, ...assignment });
  })
);

app.post('/api/rooms', (_req, res) => {
  let room;
  try { room = createRoom(); }
  catch (error) { res.status(503).json({ ok: false, error: error.code || 'ROOM_STORAGE_UNAVAILABLE' }); return; }
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
  socket.on('board:ink-commit', (payload, callback) => commitCompletedInk(socket, payload, callback));
  socket.on('room:create', callback => {
    let room;
    try { room = createRoom(); }
    catch (error) { callback?.({ ok: false, error: error.code || 'ROOM_STORAGE_UNAVAILABLE' }); return; }
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
    if (!markParticipantConnected(auth.room, role, socket)) return;
    const participant = findParticipant(auth.room, role);
    socket.join(auth.room.roomId);
    socket.emit('room:state', {
      inkDelivery: roomStore.capability(),
      role,
      state: role === 'student' || auth.room.initialized ? publicState(auth.room) : null,
      you: publicYou(participant, role),
      ...controlState(auth.room)
    });
    io.to(auth.room.roomId).emit('participants:state', participantsState(auth.room));
  });

  socket.on('disconnect', () => {
    const room = markParticipantDisconnected(socket);
    if (room) {
      const participant = findParticipantById(room, socket.data.participantId);
      io.to(room.roomId).emit('participants:state', participantsState(room));
      if (
        participant
        && room.control === participant.id
        && Number(participant.onlineCount || 0) === 0
        && !participant.caps?.moderate
        && returnControlToTeacher(room)
      ) {
        emitControlChanged(room);
      }
    }
  });

  socket.on('room:state', () => {
    const room = rooms.get(socket.data.roomId);
    if (room) {
      const role = socket.data.role;
      socket.emit('room:state', {
        inkDelivery: roomStore.capability(),
        role,
        state: publicState(room),
        you: publicYou(socketParticipant(room, socket), role),
        ...controlState(room)
      });
    }
  });

  socket.on('control:grant', payload => {
    const access = requireAuthenticatedParticipant(socket, payload);
    if (!access) return;
    if (!access.participant.caps?.moderate) {
      emitBoardError(socket, 'Нет прав на передачу хода');
      return;
    }
    const student = findParticipant(access.room, 'student');
    if (!student) {
      emitBoardError(socket, 'Ученик не найден');
      return;
    }
    if (setRoomControl(access.room, student)) emitControlChanged(access.room);
  });

  socket.on('control:revoke', payload => {
    const access = requireAuthenticatedParticipant(socket, payload);
    if (!access) return;
    if (!access.participant.caps?.moderate) {
      emitBoardError(socket, 'Нет прав на передачу хода');
      return;
    }
    if (returnControlToTeacher(access.room)) emitControlChanged(access.room);
  });

  socket.on('control:release', payload => {
    const access = requireAuthenticatedParticipant(socket, payload);
    if (!access) return;
    if (
      access.participant.caps?.moderate
      || access.room.control !== access.participant.id
    ) {
      emitBoardError(socket, 'Нет прав на передачу хода');
      return;
    }
    if (returnControlToTeacher(access.room)) emitControlChanged(access.room);
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
    let nextPayload;
    if (!commitRoomMutation(room, draft => {
      nextPayload = persistBoardObject(draft, payload, socketParticipant(draft, socket));
      return !!nextPayload;
    }, socket)) return;
    socket.to(room.roomId).emit('board:stroke-end', nextPayload);
  });

  socket.on('board:text-add', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    let nextPayload;
    if (!commitRoomMutation(room, draft => {
      nextPayload = persistBoardObject(draft, payload, socketParticipant(draft, socket));
      return !!nextPayload;
    }, socket)) return;
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
    if (!commitRoomMutation(room, draft => {
      const page = draft.pages[target.pageIndex];
      page.strokes = []; page.pageEpoch = Number(page.pageEpoch || 0) + 1;
      clearRedoForPage(draft, page.id); markBoardStateChanged(draft);
    }, socket)) return;
    io.to(room.roomId).emit('board:clear-page', { pageIndex: target.pageIndex,
      pageEpoch: room.pages[target.pageIndex].pageEpoch, stateVersion: room.stateVersion });
  });

  socket.on('board:page-add', payload => {
    const room = requireStructure(socket, payload);
    if (!room) return;
    const page = safePageFromPayload(payload?.page);
    if (room.pages.some(existing => existing.id === page.id)) { emitBoardError(socket); return; }
    const pageIndex = insertionIndex(room, payload?.pageIndex);
    if (!commitRoomMutation(room, draft => {
      draft.pages.splice(pageIndex, 0, page);
      draft.currentPage = pageIndex; markBoardStateChanged(draft);
    }, socket)) return;
    socket.to(room.roomId).emit('board:page-add', {
      pageIndex,
      currentPage: room.currentPage,
      page,
      stateVersion: room.stateVersion
    });
    socket.emit('room:state', { role: socket.data.role, state: publicState(room),
      you: publicYou(socketParticipant(room, socket), socket.data.role),
      inkDelivery: roomStore.capability(), ...controlState(room) });
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
    if (!commitRoomMutation(room, draft => {
      const oldCurrentPage = draft.currentPage;
      if (draft.pages.length === 1) {
        draft.pages[0] = blankPage(); draft.currentPage = 0;
      } else {
        draft.pages.splice(target.pageIndex, 1);
        draft.currentPage = target.pageIndex < oldCurrentPage ? oldCurrentPage - 1
          : Math.min(oldCurrentPage, draft.pages.length - 1);
      }
      clearRedoForPage(draft, deletedPageId); markBoardStateChanged(draft);
    }, socket)) return;
    socket.to(room.roomId).emit('board:page-delete', {
      pageIndex: target.pageIndex,
      currentPage: room.currentPage,
      page: room.pages[room.currentPage],
      stateVersion: room.stateVersion
    });
    socket.emit('room:state', { role: socket.data.role, state: publicState(room),
      you: publicYou(socketParticipant(room, socket), socket.data.role),
      inkDelivery: roomStore.capability(), ...controlState(room) });
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
    if (!commitRoomMutation(room, draft => {
      draft.currentPage = target.pageIndex; markBoardStateChanged(draft);
    }, socket)) return;
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
    if (!commitRoomMutation(room, draft => {
      draft.pages[target.pageIndex].bg = normalizeBoardBg(payload?.bg); markBoardStateChanged(draft);
    }, socket)) return;
    socket.to(room.roomId).emit('board:bg-change', {
      pageIndex: target.pageIndex,
      bg: room.pages[target.pageIndex].bg,
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
    if (!commitRoomMutation(room, draft => {
      const page = draft.pages[target.pageIndex], [stroke] = page.strokes.splice(strokeIndex, 1);
      page.pageEpoch = Number(page.pageEpoch || 0) + 1;
      redoStack(draft, participant.id).push({ pageId: page.id, stroke }); markBoardStateChanged(draft);
    }, socket)) return;
    io.to(room.roomId).emit('board:page-state', {
      pageIndex: target.pageIndex,
      page: room.pages[target.pageIndex],
      stateVersion: room.stateVersion
    });
    emitLegacySnapshot(socket, room);
  });

  socket.on('board:stroke-redo', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    const participant = socketParticipant(room, socket);
    let entry = null;
    let pageIndex = -1;
    if (!commitRoomMutation(room, draft => {
      const stack = redoStack(draft, participant.id);
      while (stack.length > 0) {
        const candidate = stack.pop();
        const candidatePageIndex = draft.pages.findIndex(page => page.id === candidate.pageId);
        if (candidatePageIndex >= 0) {
          entry = candidate; pageIndex = candidatePageIndex; break;
        }
      }
      if (!entry) return false;
      const page = draft.pages[pageIndex];
      page.strokes.push(entry.stroke); page.pageEpoch = Number(page.pageEpoch || 0) + 1;
      markBoardStateChanged(draft);
    }, socket)) return;
    io.to(room.roomId).emit('board:page-state', {
      pageIndex,
      page: room.pages[pageIndex],
      stateVersion: room.stateVersion
    });
    emitLegacySnapshot(socket, room);
  });

  socket.on('board:trainer-url-change', payload => {
    const room = requireStructure(socket, payload);
    if (!room) return;
    const trainerUrl = normalizeTrainerUrl(payload?.trainerUrl);
    if (!trainerUrl) return;
    if (!commitRoomMutation(room, draft => {
      draft.trainerUrl = trainerUrl; draft.latestTrainerState = null; touchRoom(draft);
    }, socket)) return;
    socket.to(room.roomId).emit('board:trainer-url-change', { trainerUrl });
  });

  socket.on('board:trainer-state-change', payload => {
    const room = requireWriter(socket, payload);
    if (!room) return;
    const latestTrainerState = normalizeTrainerState(room, payload);
    if (!latestTrainerState) return;
    if (!commitRoomMutation(room, draft => {
      draft.latestTrainerState = latestTrainerState; touchRoom(draft);
    }, socket)) return;
    socket.to(room.roomId).emit('board:trainer-state-change', latestTrainerState);
  });

  socket.on('board:snapshot', payload => {
    const room = requireStructure(socket, payload);
    if (!room) return;
    if (room.initialized && Number(socket.data.proto || 1) >= 2) return;
    if (commitRoomMutation(room, draft => {
      if (!applySnapshot(draft, payload?.state)) return false;
      markBoardStateChanged(draft);
    }, socket)) {
      socket.to(room.roomId).emit('board:snapshot', { state: publicState(room) });
    }
  });
});

const cleanupTimer = setInterval(cleanupRooms, ROOM_CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.();
