'use strict';

const express = require('express');
const crypto = require('node:crypto');
const { requireValue, exactKeys, safeName, token, tokenHash } = require('./learning-auth');
const { getPaper, hasPaper, mountPaperRoutes } = require('./learning-paper');
const MAX_PHOTO = 3 * 1024 * 1024;
const PHOTO_TOTAL = 512 * 1024 * 1024;
const outcomes = require('../learning/outcomes').labels;
const parse = value => JSON.parse(value);
const text = (value, max = 4000) => {
  requireValue(typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value), 'LEARNING_TEXT_INVALID');
  return value.trim();
};
function aiAnswer(value) {
  const answer = String(value ?? '').trim();
  // Export ordinary numerical/fraction answers, never arbitrary notes, dates,
  // long identifiers or phone-sized digit sequences entered in an answer box.
  return /^[+−-]?\d{1,8}(?:[.,]\d{1,6})?(?:\s*\/\s*[+−-]?\d{1,8}(?:[.,]\d{1,6})?)?$/.test(answer)
    && (answer.match(/\d/g) || []).length <= 9 ? answer : '[нечисловой или длинный ответ скрыт]';
}

let photoQueue = Promise.resolve();
let photoPending = 0;
async function inspectPhoto(input, mime) {
  requireValue(Buffer.isBuffer(input) && input.length >= 24 && input.length <= MAX_PHOTO, 'LEARNING_PHOTO_TOO_LARGE');
  const formats = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
  requireValue(Object.hasOwn(formats, mime), 'LEARNING_PHOTO_TYPE_INVALID');
  requireValue(photoPending < 3, 'LEARNING_BUSY', 429);
  photoPending++;
  const run = photoQueue.then(async () => {
    const sharp = require('sharp');
    sharp.cache({ memory: 16, files: 0, items: 20 });
    sharp.concurrency(1);
    try {
      const source = sharp(input, { failOn: 'warning', limitInputPixels: 16000000, sequentialRead: true });
      const meta = await source.metadata();
      requireValue(meta.format === formats[mime] && (meta.pages || 1) === 1, 'LEARNING_PHOTO_INVALID');
      requireValue(meta.width >= 16 && meta.height >= 16 && meta.width <= 12000 && meta.height <= 12000, 'LEARNING_PHOTO_DIMENSIONS_INVALID');
      // Decode every pixel, honour camera orientation, and strip all input metadata.
      // A compressed byte limit alone does not validate an uploaded image.
      const result = await source.rotate().resize({ width: 3200, height: 3200, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' }).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toBuffer({ resolveWithObject: true });
      requireValue(result.data.length <= MAX_PHOTO, 'LEARNING_PHOTO_TOO_LARGE');
      return { data: result.data, width: result.info.width, height: result.info.height, mime: 'image/jpeg' };
    } catch (error) {
      if (error.code && error.code.startsWith('LEARNING_')) throw error;
      requireValue(false, 'LEARNING_PHOTO_INVALID');
    }
  });
  photoQueue = run.catch(() => {});
  try { return await run; } finally { photoPending--; }
}

function initializeTeaching(store) {
  if (!store.available) return;
  store.db.exec(`
    CREATE TABLE IF NOT EXISTS learning_photo_files(hash TEXT PRIMARY KEY, bytes INTEGER NOT NULL, data BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_photos(id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES assignments(id), actor_id TEXT NOT NULL REFERENCES accounts(id),
      kind TEXT NOT NULL CHECK(kind IN ('task','solution')), mime TEXT NOT NULL, filename TEXT NOT NULL, bytes INTEGER NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL,
      file_hash TEXT NOT NULL REFERENCES learning_photo_files(hash), created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS learning_photo_assignment ON learning_photos(assignment_id);
    CREATE TABLE IF NOT EXISTS learning_feedback(id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES assignments(id), teacher_id TEXT NOT NULL REFERENCES accounts(id),
      text TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_plans(learner_id TEXT PRIMARY KEY REFERENCES accounts(id), teacher_id TEXT NOT NULL REFERENCES accounts(id), items_json TEXT NOT NULL, note TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_ai_drafts(id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES accounts(id), teacher_id TEXT NOT NULL REFERENCES accounts(id),
      recommendations_json TEXT NOT NULL, parent_note TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_resets(id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES accounts(id), teacher_id TEXT NOT NULL REFERENCES accounts(id),
      scope TEXT NOT NULL, value TEXT, reason TEXT NOT NULL, attempt_ids_json TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_submissions(attempt_id TEXT PRIMARY KEY REFERENCES attempts(id), learner_id TEXT NOT NULL REFERENCES accounts(id),
      attempt_version INTEGER NOT NULL, submitted_at INTEGER NOT NULL, assignment_id TEXT REFERENCES assignments(id), photo_ids_json TEXT NOT NULL, feedback_count INTEGER NOT NULL,
      revision INTEGER NOT NULL);
  `);
}

function createTeachingRouter(learning) {
  const { store, handler, authMiddleware, mutationMiddleware } = learning;
  initializeTeaching(store);
  const router = express.Router();
  router.use(authMiddleware);
  mountPaperRoutes(router, learning);
  store.paperReadyForAssignment = id => hasPaper(store, id);
  const catalog = () => store.contracts.list();
  function submissionContext(attemptId) {
    const assigned = store.row('SELECT id,status FROM assignments WHERE attempt_id=?', attemptId);
    return { assignment: assigned || null,
      photoIds: assigned ? store.rows("SELECT id FROM learning_photos WHERE assignment_id=? AND kind='solution' ORDER BY id", assigned.id).map(row => row.id) : [],
      feedbackCount: assigned ? store.row('SELECT COUNT(*) AS n FROM learning_feedback WHERE assignment_id=?', assigned.id).n : 0 };
  }
  store.submissionForAttempt = attempt => {
    const row = store.row('SELECT * FROM learning_submissions WHERE attempt_id=?', attempt.id);
    if (!row) return null;
    const context = submissionContext(attempt.id), photoIds = parse(row.photo_ids_json);
    const feedback = context.assignment && context.feedbackCount > row.feedback_count
      ? store.row('SELECT status FROM learning_feedback WHERE assignment_id=? ORDER BY rowid DESC LIMIT 1', context.assignment.id) : null;
    return { submittedAt: row.submitted_at, attemptVersion: row.attempt_version, revision: row.revision, photoIds,
      stale: attempt.archived_at != null || attempt.version !== row.attempt_version || JSON.stringify(context.photoIds) !== row.photo_ids_json,
      status: feedback?.status || 'submitted' };
  };
  function reviewRevision(row) {
    const attempt = store.row('SELECT version,archived_at FROM attempts WHERE id=?', row.attempt_id);
    const submission = store.row('SELECT revision FROM learning_submissions WHERE attempt_id=?', row.attempt_id);
    const context = submissionContext(row.attempt_id);
    return tokenHash(JSON.stringify({ assignmentId: row.id, status: row.status, attemptVersion: attempt.version,
      archivedAt: attempt.archived_at, submissionRevision: submission?.revision || 0,
      photoIds: context.photoIds, feedbackCount: context.feedbackCount }));
  }
  function assignment(auth, id) {
    const row = store.row('SELECT * FROM assignments WHERE id=?', id);
    requireValue(row && (auth.role === 'teacher' ? row.teacher_id === auth.id : row.learner_id === auth.id && row.status === 'published'), 'LEARNING_NOT_FOUND', 404);
    return row;
  }
  const photoDTO = row => ({ id: row.id, kind: row.kind, filename: row.filename, mime: row.mime, bytes: row.bytes, width: row.width, height: row.height, createdAt: row.created_at, url: '/api/learning/photos/' + row.id });
  function assignmentDTO(auth, row) {
    return { assignment: { id: row.id, title: row.title, learnerId: row.learner_id, attemptId: row.attempt_id, batchId: row.batch_id || null, dueAt: row.due_at, status: row.status, createdAt: row.created_at, paperReady: hasPaper(store, row.id) },
      attempt: store.getAttempt(auth, row.attempt_id),
      reviewRevision: reviewRevision(row),
      paper: getPaper(store, auth, row.id),
      batchAssignments: auth.role === 'teacher' && row.batch_id ? store.rows("SELECT a.id,a.learner_id AS learnerId,a.status,(SELECT COUNT(*) FROM learning_photos p WHERE p.assignment_id=a.id AND p.kind='task') AS taskPhotos FROM assignments a WHERE a.batch_id=? AND a.teacher_id=? ORDER BY a.created_at,a.id", row.batch_id, auth.id).map(item => ({ ...item, paperReady: hasPaper(store, item.id) })) : [],
      photos: store.rows('SELECT id,kind,filename,mime,bytes,width,height,created_at FROM learning_photos WHERE assignment_id=? ORDER BY created_at,id', row.id).map(photoDTO),
      feedback: store.rows('SELECT id,text,status,created_at AS createdAt FROM learning_feedback WHERE assignment_id=? ORDER BY rowid DESC LIMIT 100', row.id) };
  }
  function report(auth, learnerId) {
    const learner = store.ownsStudent(auth, learnerId), items = catalog();
    const attempts = store.rows("SELECT * FROM attempts WHERE learner_id=? AND trainer_id!='board' ORDER BY updated_at DESC,id", learnerId);
    const rows = attempts.map(row => {
      const taskSpec = parse(row.task_json), item = items.find(i => i.trainerId === row.trainer_id && i.contentId === taskSpec.contentId);
      const checks = store.row("SELECT COUNT(*) AS n,SUM(CASE WHEN json_extract(payload_json,'$.evaluation.correct')=0 AND trim(COALESCE(json_extract(payload_json,'$.details.answer'),''))!='' THEN 1 ELSE 0 END) AS wrong,SUM(CASE WHEN trim(COALESCE(json_extract(payload_json,'$.details.answer'),''))='' THEN 1 ELSE 0 END) AS skipped FROM events WHERE attempt_id=? AND type='check'", row.id);
      return { id: row.id, catalogId: item?.id || null, title: item?.title || '', topicId: item?.topicId || '', position: item?.position || null,
        outcome: row.outcome, status: outcomes[row.outcome], assistance: parse(row.assistance_json), checks: checks.n, wrongChecks: checks.wrong || 0, skippedChecks: checks.skipped || 0,
        submission: store.submissionForAttempt(row),
        archivedAt: row.archived_at, createdAt: row.created_at, updatedAt: row.updated_at };
    });
    const current = rows.filter(row => !row.archivedAt), counts = Object.fromEntries(Object.keys(outcomes).map(key => [key, current.filter(row => row.outcome === key).length]));
    const positions = Array.from({ length: 21 }, (_, i) => {
      const matching = current.filter(row => row.position === i + 1);
      return { position: i + 1, started: matching.length, independentlySolved: matching.filter(row => ['independent', 'repeated'].includes(row.outcome)).length,
        contentCount: new Set(matching.filter(row => ['independent', 'repeated'].includes(row.outcome)).map(row => row.catalogId)).size };
    });
    const assignments = store.rows('SELECT id,title,status,due_at AS dueAt,attempt_id AS attemptId FROM assignments WHERE learner_id=? ORDER BY created_at DESC LIMIT 500', learnerId).map(row => ({ ...row,
      paperReady: hasPaper(store, row.id),
      submission: store.submissionForAttempt(store.row('SELECT * FROM attempts WHERE id=?', row.attemptId)),
      taskPhotos: store.row("SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=? AND kind='task'", row.id).n,
      solutionPhotos: store.row("SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=? AND kind='solution'", row.id).n,
      photoReview: store.row('SELECT status,text,created_at AS createdAt FROM learning_feedback WHERE assignment_id=? ORDER BY rowid DESC LIMIT 1', row.id) || null }));
    return { student: { id: learner.id, name: learner.name }, generatedAt: store.clock(), counts, positions, attempts: rows,
      assignments, resets: store.rows('SELECT id,scope,value,reason,created_at AS createdAt FROM learning_resets WHERE learner_id=? ORDER BY created_at DESC LIMIT 100', learnerId),
      interpretation: 'Количество решённых задач отражает выполненные попытки. Оно не означает освоение всей темы. Проверка фотографий преподавателем учитывается отдельно.' };
  }
  function planItems(value) {
    requireValue(Array.isArray(value) && value.length <= 40, 'LEARNING_PLAN_INVALID');
    const known = new Set(catalog().map(item => item.id)), used = new Set();
    return value.map(item => {
      exactKeys(item, ['catalogId', 'reason', 'priority'], ['catalogId', 'reason', 'priority']);
      requireValue(known.has(item.catalogId) && !used.has(item.catalogId) && ['high', 'normal', 'low'].includes(item.priority), 'LEARNING_PLAN_INVALID');
      used.add(item.catalogId); return { catalogId: item.catalogId, reason: text(item.reason, 1000), priority: item.priority };
    });
  }

  router.post('/attempts/:id/submit', mutationMiddleware, handler((req, res) => {
    exactKeys(req.body, ['opId', 'expectedVersion'], ['opId', 'expectedVersion']);
    const auth = req.learningAuth;
    requireValue(auth.role === 'student', 'LEARNING_FORBIDDEN', 403);
    requireValue(Number.isSafeInteger(req.body.expectedVersion) && req.body.expectedVersion >= 0);
    const current = store.attemptRow(auth, req.params.id);
    requireValue(current.archived_at == null, 'LEARNING_ATTEMPT_ARCHIVED', 409);
    const result = store.operation(auth, { ...req.body, operation: 'submit-work', attemptId: current.id }, () => {
      const attempt = store.attemptRow(auth, current.id);
      requireValue(attempt.version === req.body.expectedVersion, 'LEARNING_STATE_CONFLICT', 409);
      requireValue(attempt.controller === 'student', 'LEARNING_CONTROL_REQUIRED', 409);
      const context = submissionContext(attempt.id);
      requireValue(!context.assignment || context.photoIds.length > 0, 'LEARNING_SOLUTION_PHOTO_REQUIRED', 409);
      const at = store.clock();
      store.run(`INSERT INTO learning_submissions VALUES(?,?,?,?,?,?,?,1) ON CONFLICT(attempt_id) DO UPDATE SET
        attempt_version=excluded.attempt_version,submitted_at=excluded.submitted_at,assignment_id=excluded.assignment_id,
        photo_ids_json=excluded.photo_ids_json,feedback_count=excluded.feedback_count,revision=learning_submissions.revision+1`,
      attempt.id, auth.id, attempt.version, at, context.assignment?.id || null, JSON.stringify(context.photoIds), context.feedbackCount);
      store.run('UPDATE attempts SET updated_at=? WHERE id=?', at, attempt.id);
      return { submission: store.submissionForAttempt(attempt) };
    });
    res.json({ ...result, attempt: store.getAttempt(auth, current.id) });
  }));
  router.get('/assignments/:id', handler((req, res) => res.json(assignmentDTO(req.learningAuth, assignment(req.learningAuth, req.params.id)))));
  router.post('/assignments/:id/photos', mutationMiddleware, handler(async (req, res) => {
    exactKeys(req.body, ['opId', 'kind', 'filename', 'mime', 'data'], ['opId', 'kind', 'filename', 'mime', 'data']);
    const auth = req.learningAuth, row = assignment(auth, req.params.id);
    requireValue(req.body.kind === (auth.role === 'teacher' ? 'task' : 'solution'), 'LEARNING_FORBIDDEN', 403);
    requireValue(auth.role !== 'teacher' || row.status === 'draft', 'LEARNING_HOMEWORK_ALREADY_PUBLISHED', 409);
    requireValue(typeof req.body.data === 'string' && req.body.data.length <= Math.ceil(MAX_PHOTO / 3) * 4 && /^[A-Za-z0-9+/]+={0,2}$/.test(req.body.data), 'LEARNING_PHOTO_INVALID');
    const raw = Buffer.from(req.body.data, 'base64'); requireValue(raw.toString('base64') === req.body.data, 'LEARNING_PHOTO_INVALID');
    const image = await inspectPhoto(raw, req.body.mime), filename = safeName(req.body.filename, 120).replace(/[\\/]/g, '_');
    const fingerprint = crypto.createHash('sha256').update(raw).digest('hex');
    const result = store.operation(auth, { opId: req.body.opId, operation: 'photo', assignmentId: row.id, kind: req.body.kind, filename, mime: req.body.mime, fingerprint }, () => {
      store.session(req.learningSessionToken);
      const current = assignment(auth, row.id);
      requireValue(auth.role !== 'teacher' || current.status === 'draft', 'LEARNING_HOMEWORK_ALREADY_PUBLISHED', 409);
      requireValue(store.attemptRow(auth, current.attempt_id).archived_at == null, 'LEARNING_ATTEMPT_ARCHIVED', 409);
      requireValue(store.row('SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=? AND kind=?', row.id, req.body.kind).n < 12, 'LEARNING_PHOTO_LIMIT', 507);
      const fileHash = crypto.createHash('sha256').update(image.data).digest('hex');
      if (!store.row('SELECT hash FROM learning_photo_files WHERE hash=?', fileHash)) {
        requireValue((store.row('SELECT COALESCE(SUM(bytes),0) AS n FROM learning_photo_files').n + image.data.length) <= PHOTO_TOTAL, 'LEARNING_PHOTO_LIMIT', 507);
        store.run('INSERT INTO learning_photo_files VALUES(?,?,?)', fileHash, image.data.length, image.data);
      }
      const id = token(18);
      store.run('INSERT INTO learning_photos VALUES(?,?,?,?,?,?,?,?,?,?,?)', id, row.id, auth.id, req.body.kind, image.mime, filename, image.data.length, image.width, image.height, fileHash, store.clock());
      return { photo: photoDTO(store.row('SELECT * FROM learning_photos WHERE id=?', id)) };
    });
    res.status(201).json(result);
  }));
  router.get('/photos/:id', handler((req, res) => {
    const row = store.row('SELECT p.*,f.data FROM learning_photos p JOIN learning_photo_files f ON f.hash=p.file_hash WHERE p.id=?', req.params.id);
    requireValue(row, 'LEARNING_NOT_FOUND', 404); assignment(req.learningAuth, row.assignment_id);
    res.set({ 'Content-Type': row.mime, 'Content-Length': String(row.bytes), 'Content-Disposition': 'inline',
      'Content-Security-Policy': "default-src 'none'; sandbox", 'Cross-Origin-Resource-Policy': 'same-origin' });
    res.send(Buffer.from(row.data));
  }));
  router.post('/assignments/:id/publish', mutationMiddleware, handler((req, res) => {
    exactKeys(req.body, ['opId'], ['opId']); const auth = req.learningAuth; store.teacher(auth);
    const row = assignment(auth, req.params.id);
    res.json(store.operation(auth, { ...req.body, operation: 'publish-homework', assignmentId: row.id }, () => {
      requireValue(row.status === 'draft', 'LEARNING_HOMEWORK_ALREADY_PUBLISHED', 409);
      const attempt = store.attemptRow(auth, row.attempt_id); requireValue(attempt.archived_at == null, 'LEARNING_ATTEMPT_ARCHIVED', 409);
      requireValue(hasPaper(store, row.id) || store.row("SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=? AND kind='task'", row.id).n > 0, 'LEARNING_HOMEWORK_NEEDS_PHOTO', 409);
      store.run("UPDATE assignments SET status='published' WHERE id=?", row.id);
      return { assignment: { id: row.id, status: 'published' } };
    }));
  }));
  router.post('/assignments/:id/feedback', mutationMiddleware, handler((req, res) => {
    exactKeys(req.body, ['opId', 'text', 'status', 'reviewRevision'], ['opId', 'text', 'status', 'reviewRevision']); const auth = req.learningAuth; store.teacher(auth);
    const row = assignment(auth, req.params.id), message = text(req.body.text);
    requireValue(row.status === 'published' && ['reviewed', 'revise', 'accepted'].includes(req.body.status), 'LEARNING_FEEDBACK_INVALID');
    requireValue(typeof req.body.reviewRevision === 'string' && /^[a-f0-9]{64}$/.test(req.body.reviewRevision), 'LEARNING_REVIEW_REVISION_INVALID');
    requireValue(store.attemptRow(auth, row.attempt_id).archived_at == null, 'LEARNING_ATTEMPT_ARCHIVED', 409);
    requireValue(store.row("SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=? AND kind='solution'", row.id).n > 0, 'LEARNING_SOLUTION_PHOTO_REQUIRED', 409);
    res.json(store.operation(auth, { ...req.body, text: message, operation: 'photo-feedback', assignmentId: row.id }, () => {
      // Compare the exact work the teacher opened, inside the same transaction
      // as the verdict. A same-version, same-time resubmit is a new generation.
      const current = assignment(auth, row.id), attempt = store.attemptRow(auth, current.attempt_id);
      requireValue(reviewRevision(current) === req.body.reviewRevision && !store.submissionForAttempt(attempt)?.stale,
        'LEARNING_REVIEW_CONFLICT', 409);
      requireValue(store.row('SELECT COUNT(*) AS n FROM learning_feedback WHERE assignment_id=?', row.id).n < 100, 'LEARNING_LIMIT_EXCEEDED', 507);
      const id = token(18), at = store.clock(); store.run('INSERT INTO learning_feedback VALUES(?,?,?,?,?,?)', id, row.id, auth.id, message, req.body.status, at);
      return { feedback: { id, text: message, status: req.body.status, createdAt: at, checkedBy: 'teacher' } };
    }));
  }));
  router.get('/teacher/students/:id/report', handler((req, res) => res.json(report(req.learningAuth, req.params.id))));
  router.post('/teacher/students/:id/reset', mutationMiddleware, handler((req, res) => {
    exactKeys(req.body, ['opId', 'scope', 'value', 'reason'], ['opId', 'scope', 'reason']); const auth = req.learningAuth;
    store.ownsStudent(auth, req.params.id); const reason = text(req.body.reason, 1000);
    requireValue(['all', 'topic', 'content'].includes(req.body.scope) && reason.length > 0, 'LEARNING_RESET_INVALID');
    const items = catalog().filter(item => req.body.scope === 'all' || (req.body.scope === 'topic' ? item.topicId === req.body.value : item.id === req.body.value));
    requireValue(items.length > 0, 'LEARNING_RESET_INVALID');
    const keys = new Set(items.map(item => item.trainerId + ':' + item.contentId));
    res.json(store.operation(auth, { ...req.body, reason, operation: 'archive-results', learnerId: req.params.id }, () => {
      const selected = store.rows('SELECT * FROM attempts WHERE learner_id=? AND archived_at IS NULL', req.params.id)
        .filter(row => keys.has(row.trainer_id + ':' + parse(row.task_json)?.contentId));
      requireValue(store.row('SELECT COUNT(*) AS n FROM events').n + selected.length <= 500000, 'LEARNING_LIMIT_EXCEEDED', 507);
      const ids = new Set(selected.map(row => row.id)), at = store.clock(), resetId = token(18);
      for (const [index, row] of selected.entries()) {
        store.run('UPDATE attempts SET archived_at=?,version=version+1,trainer_version=trainer_version+1,updated_at=? WHERE id=?', at, at, row.id);
        store.run("UPDATE assignments SET status='archived' WHERE attempt_id=?", row.id);
        store.run('INSERT INTO events(attempt_id,actor_id,actor_role,op_id,fingerprint,revision,type,payload_json,at) VALUES(?,?,?,?,?,?,?,?,?)', row.id, auth.id, 'teacher', resetId + '-' + index,
          resetId, row.version + 1, 'archive', JSON.stringify({ reason, after: { archivedAt: at, outcome: row.outcome, assistance: parse(row.assistance_json), controller: row.controller } }), at);
      }
      for (const lesson of store.rows('SELECT * FROM lessons WHERE teacher_id=?', auth.id)) {
        const seats = parse(lesson.seats_json); let changed = false;
        for (const seat of seats) if (ids.has(seat.attemptId)) { seat.attemptId = null; changed = true; }
        if (changed) store.run('UPDATE lessons SET seats_json=?,presentation_target=?,version=version+1 WHERE id=?', JSON.stringify(seats), lesson.presentation_target === req.params.id ? null : lesson.presentation_target, lesson.id);
      }
      if (typeof store.runGuard === 'function') {
        for (const run of store.rows('SELECT id,questions_json FROM learning_runs WHERE learner_id=? AND finished_at IS NULL', req.params.id)) {
          if (parse(run.questions_json).some(question => ids.has(question.attemptId))) store.run('UPDATE learning_runs SET finished_at=?,version=version+1,result_json=? WHERE id=?', at,
            JSON.stringify({ correct: 0, answered: 0, total: 21, byPosition: [], cancelled: true, reason: 'progress-reset' }), run.id);
        }
      }
      store.run('INSERT INTO learning_resets VALUES(?,?,?,?,?,?,?,?)', resetId, req.params.id, auth.id, req.body.scope, req.body.value || null, reason, JSON.stringify([...ids]), at);
      return { archived: selected.length, resetId, preservedHistory: true };
    }));
  }));
  function studentPlan(learnerId) {
    const row = store.row('SELECT * FROM learning_plans WHERE learner_id=?', learnerId);
    return { items: row ? parse(row.items_json) : [], note: row?.note || '', updatedAt: row?.updated_at || null };
  }
  router.get('/plan', handler((req, res) => {
    requireValue(req.learningAuth.role === 'student', 'LEARNING_FORBIDDEN', 403);
    exactKeys(req.query, []);
    res.json(studentPlan(req.learningAuth.id));
  }));
  router.get('/teacher/students/:id/plan', handler((req, res) => {
    store.ownsStudent(req.learningAuth, req.params.id);
    res.json(studentPlan(req.params.id));
  }));
  router.post('/teacher/students/:id/plan', mutationMiddleware, handler((req, res) => {
    exactKeys(req.body, ['opId', 'items', 'note'], ['opId', 'items']); const auth = req.learningAuth; store.ownsStudent(auth, req.params.id);
    const items = planItems(req.body.items), note = text(req.body.note || '');
    res.json(store.operation(auth, { ...req.body, items, note, operation: 'save-plan', learnerId: req.params.id }, () => {
      const at = store.clock(); store.run('INSERT INTO learning_plans VALUES(?,?,?,?,?) ON CONFLICT(learner_id) DO UPDATE SET items_json=excluded.items_json,note=excluded.note,updated_at=excluded.updated_at', req.params.id, auth.id, JSON.stringify(items), note, at);
      return { items, note, updatedAt: at };
    }));
  }));
  router.get('/teacher/students/:id/ai-package', handler((req, res) => {
    const result = report(req.learningAuth, req.params.id);
    const recent = result.attempts.filter(item => !item.archivedAt).slice(0, 80).map(item => ({ catalogId: item.catalogId, title: item.title, position: item.position,
      status: item.status, wrongChecks: item.wrongChecks, skippedChecks: item.skippedChecks, checks: item.checks, assistance: item.assistance,
      answers: store.rows("SELECT payload_json FROM events WHERE attempt_id=? AND type='check' ORDER BY revision DESC LIMIT 12", item.id).map(event => {
        const payload = parse(event.payload_json); return { scope: payload.details?.scope, step: payload.details?.step, answer: aiAnswer(payload.details?.answer), correct: payload.evaluation?.correct };
      }) }));
    res.json({ format: 'mathexam-ai-homework-v1', learner: 'Ученик', generatedAt: result.generatedAt, counts: result.counts, work: recent,
      available: catalog().map(item => ({ catalogId: item.id, title: item.title, position: item.position, topicId: item.topicId })),
      prompt: 'Предложи учебную траекторию и домашнюю работу на основе подтверждённых попыток. Не объявляй тему освоенной по одной задаче. Отдели совместную работу от самостоятельной. Не считай непроверенные фотографии верными. Не делай диагнозов и оценок личности. Верни только JSON: {"recommendations":[{"catalogId":"ID из available","reason":"что закрепить и почему","priority":"high|normal|low"}],"parentNote":"спокойный фактический черновик отчёта родителям"}. Не более 12 рекомендаций. Каждое домашнее задание будет выдано на сайте и фотографиями задач. Все рекомендации проверит преподаватель.' });
  }));
  router.post('/teacher/students/:id/ai-drafts', mutationMiddleware, handler((req, res) => {
    exactKeys(req.body, ['opId', 'recommendations', 'parentNote'], ['opId', 'recommendations']); const auth = req.learningAuth; store.ownsStudent(auth, req.params.id);
    const recommendations = planItems(req.body.recommendations), parentNote = text(req.body.parentNote || '');
    res.json(store.operation(auth, { ...req.body, recommendations, parentNote, operation: 'ai-draft', learnerId: req.params.id }, () => {
      requireValue(store.row('SELECT COUNT(*) AS n FROM learning_ai_drafts WHERE learner_id=?', req.params.id).n < 500, 'LEARNING_LIMIT_EXCEEDED', 507);
      const id = token(18), at = store.clock(); store.run('INSERT INTO learning_ai_drafts VALUES(?,?,?,?,?,?)', id, req.params.id, auth.id, JSON.stringify(recommendations), parentNote, at);
      return { draft: { id, recommendations, parentNote, status: 'requires-teacher-review', createdAt: at } };
    }));
  }));
  router.get('/teacher/students/:id/ai-drafts', handler((req, res) => {
    store.ownsStudent(req.learningAuth, req.params.id);
    res.json({ drafts: store.rows('SELECT * FROM learning_ai_drafts WHERE learner_id=? ORDER BY created_at DESC,id LIMIT 100', req.params.id).map(row => ({
      id: row.id, recommendations: parse(row.recommendations_json), parentNote: row.parent_note, status: 'requires-teacher-review', createdAt: row.created_at
    })) });
  }));
  return router;
}

module.exports = { createTeachingRouter, initializeTeaching, inspectPhoto, MAX_PHOTO };
