'use strict';

// Teacher workflow security, exercised through actual local HTTP routes.
// No production service, external AI, real learner, or private photo is used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const express = require('express');
const { LearningStore } = require('../learning-store');
const { createLearningApi } = require('../learning-api');
const { createTeachingRouter, inspectPhoto, MAX_PHOTO } = require('../learning-teaching');
const { createLearningRunsRouter } = require('../learning-runs');
const contracts = require('../learning-contracts');
const { tokenHash } = require('../learning-auth');
const op = () => crypto.randomUUID();
const HASH = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
const MARKER = 'PRIVATE-GPS-CAMERA-COMMENT-EXAMPLE';
const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wgARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAP/xAAUAQEAAAAAAAAAAAAAAAAAAAAF/9oADAMBAAIQAxAAAAG4RL//xAAUEAEAAAAAAAAAAAAAAAAAAAAg/9oACAEBAAEFAh//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//xAAUEAEAAAAAAAAAAAAAAAAAAAAg/9oACAEBAAY/Ah//xAAUEAEAAAAAAAAAAAAAAAAAAAAg/9oACAEBAAE/IR//2gAMAwEAAgADAAAAEAf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAAAAAAAAAg/9oACAEBAAE/EB//2Q==', 'base64');
const WEBP = Buffer.from('UklGRh4AAABXRUJQVlA4TBEAAAAvD8ADAAdQ0EJVuv+BiOh/AAA=', 'base64');
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, payload) {
  const body = Buffer.concat([Buffer.from(type), payload]);
  const length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(payload.length); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
function png({ pixels = true, width = 16, height = 16, metadata = true } = {}) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header),
    ...(metadata ? [chunk('tEXt', Buffer.from('Comment\0' + MARKER))] : []),
    ...(pixels ? [chunk('IDAT', zlib.deflateSync(Buffer.alloc((16 * 3 + 1) * 16, 0)))] : []), chunk('IEND', Buffer.alloc(0))]);
}
function jpegWithLateMetadata() {
  const message = Buffer.from(MARKER), header = Buffer.alloc(4);
  header[0] = 0xff; header[1] = 0xfe; header.writeUInt16BE(message.length + 2, 2);
  // Legal COM segment after the final scan and before EOI. A filter that stops
  // parsing at the first SOS leaks this metadata.
  return Buffer.concat([JPEG.subarray(0, -2), header, message, JPEG.subarray(-2)]);
}
async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-teaching-review-'));
  let tick = 1700000000000;
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts, clock: () => ++tick });
  assert(store.available);
  const invitation = store.bootstrap({ login: 'private_teacher', name: 'Private Teacher Name' });
  const teacher = store.activate(invitation.invitationToken, HASH);
  const students = [1, 2].map(i => {
    const invite = store.createStudent(teacher.account, { login: 'private_student_' + i, name: 'Private Student Name ' + i });
    return store.activate(invite.invitationToken, HASH);
  });
  const app = express(); app.use(express.json({ limit: '6mb' }));
  const learning = createLearningApi({ store, publicOrigin: 'https://cabinet.example', secureCookies: true });
  app.use('/api/learning', learning.router); app.use('/api/learning', createTeachingRouter(learning));
  app.use('/api/learning', createLearningRunsRouter(learning).router);
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}/api/learning`;
  async function request(session, route, body, extras = {}) {
    const response = await fetch(base + route, { method: body === undefined ? 'GET' : 'POST', headers: {
      ...(session ? { Cookie: '__Host-mathexam_learning=' + session.sessionToken } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: 'https://cabinet.example', 'x-csrf-token': tokenHash('learning-csrf:' + session.sessionToken) }), ...extras
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const content = response.headers.get('content-type') || '';
    return { response, status: response.status, body: content.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer()) };
  }
  const draft = async (student = 0, contentId = 'practice-decimal-division') => {
    const result = await request(teacher, '/assignments', { opId: op(), learnerIds: [students[student].account.id], title: 'Homework ' + student, trainerId: 'ege-path', contentId });
    assert.equal(result.status, 201); return result.body.assignments[0];
  };
  const upload = (session, id, { kind = 'task', mime = 'image/png', image = png(), filename = 'work.png', opId = op() } = {}) => request(session, '/assignments/' + id + '/photos', { opId, kind, mime, data: image.toString('base64'), filename });
  return { store, teacher, students, request, draft, upload };
}

test('photo verification decodes genuine PNG, JPEG and WebP and strips late metadata', async () => {
  for (const [mime, input] of [['image/png', png()], ['image/jpeg', jpegWithLateMetadata()], ['image/webp', WEBP]]) {
    const clean = await inspectPhoto(input, mime);
    assert.equal(clean.width, 16); assert.equal(clean.height, 16);
    assert(Buffer.isBuffer(clean.data) && clean.data.length > 20);
    assert(!clean.data.includes(Buffer.from(MARKER)), mime + ': metadata must not survive');
    assert(['image/png', 'image/jpeg', 'image/webp'].includes(clean.mime), 'Store the actual normalized output MIME');
  }
});

test('unsupported, oversized, truncated, header-only and excessive-dimension photos fail closed', async () => {
  const minimal = Buffer.concat([Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'), Buffer.alloc(4)]);
  for (const [mime, input] of [['image/svg+xml', Buffer.from('<svg>' + 'x'.repeat(40) + '</svg>')], ['image/png', Buffer.alloc(MAX_PHOTO + 1)],
    ['image/png', minimal], ['image/png', png({ pixels: false })], ['image/png', png({ width: 20000 })], ['image/jpeg', JPEG.subarray(0, -5)], ['image/png', JPEG]]) {
    await assert.rejects(async () => inspectPhoto(input, mime), error => /^LEARNING_PHOTO_/.test(error.code || ''), mime + ': use a controlled validation error');
  }
});

test('draft publication needs a verified photo; photos are private, idempotent and role-scoped', async t => {
  const f = await fixture(t), a = await f.draft();
  let r = await f.request(f.teacher, '/assignments/' + a.id + '/publish', { opId: op() });
  assert.equal(r.status, 409); assert.equal(r.body.error, 'LEARNING_HOMEWORK_NEEDS_PHOTO');
  r = await f.request(f.students[0], '/assignments/' + a.id); assert.equal(r.status, 404);
  const uploadId = op(); r = await f.upload(f.teacher, a.id, { opId: uploadId }); assert.equal(r.status, 201);
  const photo = r.body.photo;
  const duplicate = await f.upload(f.teacher, a.id, { opId: uploadId }); assert.equal(duplicate.status, 201); assert.equal(duplicate.body.photo.id, photo.id);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=?', a.id).n, 1);
  for (const session of [null, ...f.students]) {
    r = await f.request(session, '/photos/' + photo.id); assert.equal(r.status, session ? 404 : 401);
  }
  r = await f.request(f.teacher, '/assignments/' + a.id + '/publish', { opId: op() }); assert.equal(r.status, 200);
  r = await f.request(f.students[0], '/photos/' + photo.id); assert.equal(r.status, 200);
  assert.equal(r.response.headers.get('cross-origin-resource-policy'), 'same-origin');
  assert.equal(r.response.headers.get('cache-control'), 'no-store'); assert.equal(r.response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.response.headers.get('content-type').split(';')[0], photo.mime);
  assert(!r.body.includes(Buffer.from(MARKER)));
  r = await f.request(f.students[1], '/photos/' + photo.id); assert.equal(r.status, 404);
  r = await f.upload(f.students[0], a.id, { kind: 'task' }); assert.equal(r.status, 403);
  r = await f.upload(f.students[1], a.id, { kind: 'solution' }); assert.equal(r.status, 404);
  r = await f.upload(f.teacher, a.id); assert.equal(r.status, 409, 'Published task images cannot silently change');
});

test('manual photo acceptance never awards automatic independent trainer completion', async t => {
  const f = await fixture(t), a = await f.draft();
  assert.equal((await f.upload(f.teacher, a.id)).status, 201);
  assert.equal((await f.request(f.teacher, '/assignments/' + a.id + '/publish', { opId: op() })).status, 200);
  let r = await f.request(f.teacher, '/assignments/' + a.id + '/feedback', { opId: op(), text: 'Проверено', status: 'accepted' }); assert.equal(r.status, 409);
  assert.equal((await f.upload(f.students[0], a.id, { kind: 'solution' })).status, 201);
  r = await f.request(f.students[0], '/assignments/' + a.id + '/feedback', { opId: op(), text: 'Сам проверил', status: 'accepted' }); assert.equal(r.status, 403);
  r = await f.request(f.teacher, '/assignments/' + a.id + '/feedback', { opId: op(), text: 'Ход решения проверен по фото.', status: 'accepted' }); assert.equal(r.status, 200);
  r = await f.request(f.students[0], '/assignments/' + a.id); assert.equal(r.body.attempt.outcome, 'started');
  assert.equal(r.body.feedback[0].status, 'accepted');
  r = await f.request(f.teacher, '/teacher/students/' + f.students[0].account.id + '/report');
  assert.equal(r.body.counts.independent, 0); assert.equal(r.body.assignments[0].photoReview.status, 'accepted');
});

test('photo count and total storage budgets are enforced before a committed insert', async t => {
  const f = await fixture(t), a = await f.draft();
  let first;
  for (let n = 0; n < 12; n++) {
    const r = await f.upload(f.teacher, a.id); assert.equal(r.status, 201); first ||= r.body.photo;
  }
  let r = await f.upload(f.teacher, a.id); assert.equal(r.status, 507);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=?', a.id).n, 12);
  const b = await f.draft(1);
  // Exercise quota accounting without allocating a 512 MiB test blob.
  const fileHash = f.store.row('SELECT file_hash FROM learning_photos WHERE id=?', first.id).file_hash;
  f.store.run('UPDATE learning_photo_files SET bytes=? WHERE hash=?', 512 * 1024 * 1024, fileHash);
  // Reusing the verified same bytes consumes no extra blob storage, but the
  // new private assignment still receives its own access-controlled photo ID.
  r = await f.upload(f.teacher, b.id); assert.equal(r.status, 201);
  assert.notEqual(r.body.photo.id, first.id);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_photo_files').n, 1);
  r = await f.upload(f.teacher, b.id, { mime: 'image/jpeg', image: JPEG }); assert.equal(r.status, 507);
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=?', b.id).n, 1);
});

test('an image whose decoding finishes after publication cannot modify the published task', { timeout: 5000 }, async t => {
  const f = await fixture(t), a = await f.draft();
  assert.equal((await f.upload(f.teacher, a.id)).status, 201);
  const sharpId = require.resolve('sharp'), original = require(sharpId);
  let release, started;
  const wait = new Promise(resolve => { release = resolve; });
  const entered = new Promise(resolve => { started = resolve; });
  const wrapped = (...args) => {
    const image = original(...args), toBuffer = image.toBuffer;
    image.toBuffer = async function (...params) { started(); await wait; return toBuffer.apply(this, params); };
    return image;
  };
  Object.assign(wrapped, original); require.cache[sharpId].exports = wrapped;
  try {
    const late = f.upload(f.teacher, a.id);
    await entered;
    const publish = await f.request(f.teacher, '/assignments/' + a.id + '/publish', { opId: op() }); assert.equal(publish.status, 200);
    release();
    const result = await late; assert.equal(result.status, 409);
    assert.equal(f.store.row('SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=?', a.id).n, 1);
  } finally { release(); require.cache[sharpId].exports = original; }
});

test('content reset archives only selected learner attempts, preserves history and detaches presentation', async t => {
  const f = await fixture(t), s1 = f.students[0], s2 = f.students[1];
  async function create(s, contentId) {
    const r = await f.request(s, '/attempts', { opId: op(), trainerId: 'ege-path', contentId, fresh: true }); assert.equal(r.status, 201); return r.body.attempt;
  }
  const a = await create(s1, 'practice-decimal-division'), b = await create(s1, 'practice-percent-part'), c = await create(s2, 'practice-decimal-division');
  let r = await f.request(f.teacher, '/lessons', { opId: op(), title: 'Reset review', learnerIds: [s1.account.id, s2.account.id] }); let lesson = r.body.lesson;
  r = await f.request(f.teacher, '/lessons/' + lesson.id + '/actions', { opId: op(), expectedVersion: lesson.version, type: 'attach', payload: { learnerId: s1.account.id, attemptId: a.id } }); lesson = r.body.lesson;
  r = await f.request(f.teacher, '/lessons/' + lesson.id + '/actions', { opId: op(), expectedVersion: lesson.version, type: 'present', payload: { target: s1.account.id } }); lesson = r.body.lesson;
  const reset = { opId: op(), scope: 'content', value: 'path:practice-decimal-division', reason: 'Проверка после повторения' };
  r = await f.request(s1, '/teacher/students/' + s1.account.id + '/reset', reset); assert.equal(r.status, 403);
  r = await f.request(f.teacher, '/teacher/students/' + s1.account.id + '/reset', reset); assert.equal(r.status, 200); assert.equal(r.body.archived, 1);
  r = await f.request(f.teacher, '/teacher/students/' + s1.account.id + '/reset', reset); assert.equal(r.body.duplicate, true);
  const archived = f.store.getAttempt(f.teacher.account, a.id); assert(archived.archivedAt); assert.equal(archived.version, 1);
  assert.equal(f.store.getAttempt(s1.account, b.id).archivedAt, null); assert.equal(f.store.getAttempt(s2.account, c.id).archivedAt, null);
  r = await f.request(s1, '/attempts/' + a.id + '/actions', { opId: op(), expectedVersion: 0, type: 'state', payload: { state: a.state } }); assert.equal(r.status, 409);
  const events = f.store.history(f.teacher.account, a.id).events; assert.equal(events.length, 1); assert.equal(events[0].type, 'archive');
  r = await f.request(f.teacher, '/lessons/' + lesson.id); assert.equal(r.body.presentation.target, null);
  assert.equal(r.body.seats.find(s => s.learnerId === s1.account.id).attemptId, null);
  assert.equal(r.body.seats.find(s => s.learnerId === s2.account.id).attemptId, c.id);
});

test('AI export removes identity and arbitrary answer prose; import is a validated private draft only', async t => {
  const f = await fixture(t), student = f.students[0], learnerId = student.account.id;
  let r = await f.request(student, '/attempts', { opId: op(), trainerId: 'ege-path', contentId: 'practice-decimal-division' }); const a = r.body.attempt;
  const sensitiveAnswer = 'Меня зовут Private Student Name 1, телефон +79991234567, секрет PRIVATE-ANSWER-PROSE';
  const state = JSON.parse(JSON.stringify(a.state)); state.work.draft = sensitiveAnswer;
  r = await f.request(student, '/attempts/' + a.id + '/actions', { opId: op(), expectedVersion: a.version, type: 'check', payload: { state, details: { scope: 'final', answer: sensitiveAnswer } } }); assert.equal(r.status, 200);
  r = await f.request(f.teacher, '/teacher/students/' + learnerId + '/ai-package'); assert.equal(r.status, 200);
  const exported = JSON.stringify(r.body);
  for (const privateValue of [learnerId, student.account.name, student.account.login, student.sessionToken, f.teacher.account.id, f.teacher.account.name, a.id, 'PRIVATE-ANSWER-PROSE', '+79991234567']) {
    assert(!exported.includes(privateValue), 'AI package disclosed identity or arbitrary prose: ' + privateValue);
  }
  assert.equal(r.body.learner, 'Ученик'); assert(Array.isArray(r.body.available));
  assert(!exported.includes('data:image/')); assert(!exported.includes('photos/'));
  const unknown = { opId: op(), recommendations: [{ catalogId: 'unknown:<script>', reason: 'test', priority: 'high' }] };
  r = await f.request(f.teacher, '/teacher/students/' + learnerId + '/ai-drafts', unknown); assert.equal(r.status, 400);
  const proposal = { opId: op(), recommendations: [{ catalogId: 'path:practice-percent-part', reason: 'Закрепить выбор целого', priority: 'normal' }], parentNote: 'Черновик для проверки преподавателем.' };
  r = await f.request(student, '/teacher/students/' + learnerId + '/ai-drafts', proposal); assert.equal(r.status, 403);
  r = await f.request(f.teacher, '/teacher/students/' + learnerId + '/ai-drafts', proposal); assert.equal(r.status, 200); assert.equal(r.body.draft.status, 'requires-teacher-review');
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM assignments').n, 0);
  r = await f.request(f.teacher, '/teacher/students/' + learnerId + '/plan'); assert.deepEqual(r.body.items, []);
  r = await f.request(student, '/teacher/students/' + learnerId + '/ai-package'); assert.equal(r.status, 403);
});

test('active exam keys stay private through lesson seats, presentation and attempt history', async t => {
  const f = await fixture(t), student = f.students[0], peer = f.students[1];
  let r = await f.request(student, '/runs', { opId: op(), kind: 'exam' }); assert.equal(r.status, 201);
  const run = r.body.run, question = run.questions[0];
  for (const path of ['/attempts/' + question.attemptId, '/attempts/' + question.attemptId + '/history']) {
    r = await f.request(student, path); assert.equal(r.status, 409);
    r = await f.request(peer, path); assert.equal(r.status, 404);
  }
  r = await f.request(peer, '/runs/' + run.id); assert.equal(r.status, 404);
  r = await f.request(f.teacher, '/lessons', { opId: op(), title: 'Exam privacy review', learnerIds: [student.account.id, peer.account.id] });
  assert.equal(r.status, 201); let lesson = r.body.lesson;
  r = await f.request(f.teacher, '/lessons/' + lesson.id + '/actions', { opId: op(), expectedVersion: lesson.version, type: 'attach', payload: { learnerId: student.account.id, attemptId: question.attemptId } });
  assert.equal(r.status, 200); lesson = r.body.lesson;
  r = await f.request(f.teacher, '/lessons/' + lesson.id + '/actions', { opId: op(), expectedVersion: lesson.version, type: 'present', payload: { target: student.account.id } });
  assert.equal(r.status, 200);
  for (const session of [student, peer]) {
    r = await f.request(session, '/lessons/' + lesson.id); assert.equal(r.status, 200);
    assert.equal(r.body.presentation.target, null);
    assert(r.body.seats.every(seat => seat.attempt === null));
  }
  const attempt = f.store.getAttempt(f.teacher.account, question.attemptId);
  r = await f.request(f.teacher, '/attempts/' + question.attemptId + '/actions', { opId: op(), expectedVersion: attempt.version, type: 'control', payload: { controller: 'teacher' } });
  assert.equal(r.status, 409); assert.equal(r.body.error, 'LEARNING_RUN_ACTIVE');
  assert.equal(f.store.row('SELECT COUNT(*) AS n FROM events WHERE attempt_id=?', question.attemptId).n, 0);
});

test('reset cancels an affected run atomically without grading or cancelling another learner run', async t => {
  const f = await fixture(t), student = f.students[0], peer = f.students[1];
  const create = async session => { const r = await f.request(session, '/runs', { opId: op(), kind: 'exam' }); assert.equal(r.status, 201); return r.body.run; };
  const run = await create(student), peerRun = await create(peer), q = run.questions[0];
  let r = await f.request(student, '/runs/' + run.id + '/actions', { opId: op(), expectedVersion: 0, type: 'answer', payload: { index: 0, answer: '123' } }); assert.equal(r.status, 200);
  r = await f.request(f.teacher, '/teacher/students/' + student.account.id + '/reset', { opId: op(), scope: 'content', value: 'path:' + q.contentId, reason: 'Повторная диагностика' }); assert.equal(r.status, 200);
  r = await f.request(student, '/runs/' + run.id); assert.equal(r.status, 200); assert.equal(r.body.result.cancelled, true); assert.equal(r.body.version, 2);
  assert.equal(r.body.questions[0].answer, '123', 'Preserve the pre-reset draft');
  const archived = f.store.getAttempt(f.teacher.account, q.attemptId); assert(archived.archivedAt); assert.equal(archived.trainerVersion, 1);
  r = await f.request(student, '/runs/' + run.id + '/actions', { opId: op(), expectedVersion: 1, type: 'finish', payload: {} }); assert.equal(r.status, 409);
  assert.equal(f.store.row("SELECT COUNT(*) AS n FROM events WHERE type='check'").n, 0, 'Cancellation must not grade any answer');
  r = await f.request(peer, '/runs/' + peerRun.id); assert.equal(r.status, 200); assert.equal(r.body.finishedAt, null); assert.equal(r.body.version, 0);
  const replacement = await create(student); assert.notEqual(replacement.id, run.id);
});
