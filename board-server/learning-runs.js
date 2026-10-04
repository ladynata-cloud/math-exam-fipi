'use strict';

const express = require('express');
const { exactKeys, requireValue, token, tokenHash } = require('./learning-auth');
const { ID, canonical } = require('./learning-store');
const parse = JSON.parse;
const json = JSON.stringify;

function initializeRuns(store) {
  if (!store.available) return;
  store.db.exec(`CREATE TABLE IF NOT EXISTS learning_runs(id TEXT PRIMARY KEY,learner_id TEXT NOT NULL REFERENCES accounts(id),teacher_id TEXT NOT NULL REFERENCES accounts(id),
    kind TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 0,current_index INTEGER NOT NULL DEFAULT 0,questions_json TEXT NOT NULL,answers_json TEXT NOT NULL,
    result_json TEXT,start_event_id INTEGER NOT NULL DEFAULT 0,started_at INTEGER NOT NULL,finished_at INTEGER);
    CREATE TABLE IF NOT EXISTS learning_run_attempts(attempt_id TEXT PRIMARY KEY REFERENCES attempts(id),run_id TEXT NOT NULL REFERENCES learning_runs(id),position INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_run_operations(actor_id TEXT NOT NULL,op_id TEXT NOT NULL,run_id TEXT NOT NULL REFERENCES learning_runs(id),fingerprint TEXT NOT NULL,
      PRIMARY KEY(actor_id,op_id));`);
  store.runGuard = attemptId => !!store.row('SELECT r.id FROM learning_run_attempts a JOIN learning_runs r ON r.id=a.run_id WHERE a.attempt_id=? AND r.finished_at IS NULL', attemptId);
}
function publicTask(taskSpec) {
  const task = taskSpec.task;
  const visible = {};
  for (const key of ['id','pos','q','display','labels','choices','answerKind']) if (task[key] !== undefined) visible[key] = task[key];
  return { trainerId: taskSpec.trainerId, contentId: taskSpec.contentId, id: taskSpec.id, seed: taskSpec.seed, contentVersion: taskSpec.contentVersion, task: visible };
}
function createLearningRunsRouter(learning) {
  const { store, handler, authMiddleware, mutationMiddleware } = learning;
  initializeRuns(store);
  const router = express.Router();
  function authorized(auth, id) {
    requireValue(ID.test(id || ''), 'LEARNING_NOT_FOUND', 404);
    const row = store.row('SELECT * FROM learning_runs WHERE id=?', id);
    requireValue(row && (auth.role === 'teacher' ? row.teacher_id === auth.id : row.learner_id === auth.id), 'LEARNING_NOT_FOUND', 404);
    return row;
  }
  function summary(row) {
    const result = row.result_json ? parse(row.result_json) : null;
    return { id: row.id, learnerId: row.learner_id, teacherId: row.teacher_id, kind: row.kind, version: row.version,
      currentIndex: row.current_index, startedAt: row.started_at, finishedAt: row.finished_at,
      result: result ? { correct: result.correct, total: result.total, answered: result.answered, assisted: !!result.assisted, cancelled: !!result.cancelled } : null };
  }
  function dto(row) {
    const answers = parse(row.answers_json);
    return { ...summary(row), questions: parse(row.questions_json).map(question => {
      const attempt = store.row('SELECT task_json FROM attempts WHERE id=?', question.attemptId);
      return { ...question, taskSpec: publicTask(parse(attempt.task_json)), answer: answers[question.index] || '' };
    }), result: row.result_json ? parse(row.result_json) : null };
  }
  function create(auth, body) {
    requireValue(auth.role === 'student', 'LEARNING_FORBIDDEN', 403);
    exactKeys(body, ['opId','kind'], ['opId','kind']); requireValue(['exam','diagnostic'].includes(body.kind));
    const result = store.operation(auth, { operation: 'create-run', ...body }, () => {
      const existing = store.row('SELECT * FROM learning_runs WHERE learner_id=? AND kind=? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', auth.id, body.kind);
      if (existing) {
        const archived = parse(existing.questions_json).some(question => store.row('SELECT archived_at FROM attempts WHERE id=?', question.attemptId).archived_at !== null);
        if (!archived) return { runId: existing.id };
        store.run('UPDATE learning_runs SET finished_at=?,version=version+1,result_json=? WHERE id=?', store.clock(),
          json({ correct: 0, answered: 0, total: 21, byPosition: [], cancelled: true, reason: 'progress-reset' }), existing.id);
      }
      store.limit('learning_runs', 2000);
      requireValue(typeof store.contracts.examPool === 'function', 'LEARNING_EXAM_CONTENT_MISSING', 503);
      const runId = token(18), questions = [];
      for (let position = 1; position <= 21; position++) {
        const candidates = store.contracts.examPool(position);
        requireValue(candidates.length > 0, 'LEARNING_EXAM_CONTENT_MISSING', 503);
        const item = candidates[Number.parseInt(tokenHash(`${runId}:${position}`).slice(0, 8), 16) % candidates.length];
        const previous = store.rows("SELECT task_json FROM attempts WHERE learner_id=? AND trainer_id='ege-path' AND json_extract(task_json,'$.contentId')=? AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.attempt_id=attempts.id AND a.status!='published') LIMIT 501", auth.id, item.contentId);
        const seen = new Set(previous.slice(0, 500).map(row => store.taskFingerprint(parse(row.task_json))));
        let generated = store.contracts.create(item.trainerId, item.contentId);
        for (let trial = 0; trial < 15 && seen.has(store.taskFingerprint(generated.taskSpec)); trial++) generated = store.contracts.create(item.trainerId, item.contentId);
        const previouslySeen = previous.length > 500 || seen.has(store.taskFingerprint(generated.taskSpec));
        const attempt = store.newAttempt(auth.id, auth.teacherId, item.trainerId, generated);
        questions.push({ index: position - 1, position, title: item.title, attemptId: attempt.id, trainerId: item.trainerId, contentId: item.contentId, previouslySeen });
      }
      store.run('INSERT INTO learning_runs(id,learner_id,teacher_id,kind,questions_json,answers_json,start_event_id,started_at) VALUES(?,?,?,?,?,?,?,?)',
        runId, auth.id, auth.teacherId, body.kind, json(questions), json(Array(21).fill('')), store.row('SELECT COALESCE(MAX(id),0) AS id FROM events').id, store.clock());
      for (const question of questions) store.run('INSERT INTO learning_run_attempts VALUES(?,?,?)', question.attemptId, runId, question.position);
      return { runId };
    });
    return { run: dto(authorized(auth, result.runId)), duplicate: result.duplicate };
  }
  function action(auth, id, body) {
    requireValue(auth.role === 'student', 'LEARNING_FORBIDDEN', 403);
    exactKeys(body, ['opId','expectedVersion','type','payload'], ['opId','expectedVersion','type','payload']);
    requireValue(ID.test(body.opId || '') && Number.isSafeInteger(body.expectedVersion) && body.expectedVersion >= 0);
    const fingerprint = tokenHash(canonical({ operation: 'run-action', runId: id, ...body }));
    return store.transaction(() => {
      const row = authorized(auth, id);
      const old = store.row('SELECT * FROM learning_run_operations WHERE actor_id=? AND op_id=?', auth.id, body.opId);
      if (old) { requireValue(old.fingerprint === fingerprint, 'LEARNING_OP_CONFLICT', 409); return { run: dto(row), duplicate: true }; }
      requireValue(row.finished_at === null, 'LEARNING_RUN_FINISHED', 409);
      requireValue(body.expectedVersion === row.version, 'LEARNING_STATE_CONFLICT', 409);
      const questions = parse(row.questions_json), answers = parse(row.answers_json);
      requireValue(!questions.some(question => store.row('SELECT archived_at FROM attempts WHERE id=?', question.attemptId).archived_at !== null), 'LEARNING_ATTEMPT_ARCHIVED', 409);
      store.limit('learning_run_operations', 100000);
      if (body.type === 'answer') {
        exactKeys(body.payload, ['index','answer'], ['index','answer']);
        requireValue(Number.isInteger(body.payload.index) && body.payload.index >= 0 && body.payload.index < 21 && typeof body.payload.answer === 'string' && body.payload.answer.length <= 4000);
        answers[body.payload.index] = body.payload.answer;
        store.run('UPDATE learning_runs SET answers_json=?,version=version+1 WHERE id=?', json(answers), id);
      } else if (body.type === 'navigate') {
        exactKeys(body.payload, ['index'], ['index']); requireValue(Number.isInteger(body.payload.index) && body.payload.index >= 0 && body.payload.index < 21);
        store.run('UPDATE learning_runs SET current_index=?,version=version+1 WHERE id=?', body.payload.index, id);
      } else if (body.type === 'finish') {
        exactKeys(body.payload, []);
        const at = store.clock(), byPosition = [];
        const disclosed = store.row(`SELECT MAX(CASE WHEN json_extract(e.payload_json,'$.after.assistance.teacher')=1 THEN 1 ELSE 0 END) AS teacher,
          MAX(CASE WHEN e.type='hint' OR json_extract(e.payload_json,'$.after.assistance.hints')=1 THEN 1 ELSE 0 END) AS hints
          FROM events e JOIN attempts a ON a.id=e.attempt_id WHERE a.learner_id=? AND e.id>? AND e.type IN ('state','hint','check','stroke')`, auth.id, row.start_event_id);
        const assistance = { teacher: !!disclosed.teacher, hints: !!disclosed.hints };
        for (const question of questions) {
          const attemptRow = store.row('SELECT * FROM attempts WHERE id=?', question.attemptId), attempt = store.attemptDTO(attemptRow);
          const answer = answers[question.index], answered = !!answer.trim();
          const evaluation = answered ? store.contracts.evaluate(attempt.trainerId, attempt.taskSpec, { scope: 'final', answer }) : { correct: false, complete: false };
          const outcome = evaluation.correct ? (assistance.teacher ? 'together' : assistance.hints ? 'hinted' : question.previouslySeen ? 'practiced' : 'independent') : 'started';
          {
            store.limit('events', 500000);
            const state = structuredClone(attempt.state);
            state.work.stage = 3; state.work.draft = answer; state.work.done = evaluation.correct; state.work.attempted = answered;
            const clean = store.contracts.normalize(attempt.trainerId, attempt.taskSpec, state);
            store.run('UPDATE attempts SET state_json=?,outcome=?,assistance_json=?,version=version+1,trainer_version=trainer_version+1,updated_at=? WHERE id=?', json(clean), outcome, json(assistance), at, attempt.id);
            store.run('INSERT INTO events(attempt_id,actor_id,actor_role,op_id,fingerprint,revision,type,payload_json,at) VALUES(?,?,?,?,?,?,?,?,?)',
              attempt.id, auth.id, 'student', `run:${id}:${body.opId}:${question.index}`, fingerprint, attempt.version + 1, 'check',
              json({ state: clean, details: { scope: 'final', answer }, evaluation, skipped: !answered, runId: id, previouslySeen: question.previouslySeen,
                after: { outcome, assistance, controller: 'student', trainerVersion: attempt.trainerVersion + 1 } }), at);
          }
          const task = attempt.taskSpec.task;
          byPosition.push({ index: question.index, position: question.position, correct: evaluation.correct, answered, answer,
            expectedText: typeof store.contracts.expectedText === 'function' ? store.contracts.expectedText(attempt.taskSpec)
              : task.rule ? 'Возможны разные ответы' : Array.isArray(task.solutions) && task.solutions.length ? `Например: ${task.solutions[0]}` : Array.isArray(task.answer) ? task.answer.join('; ') : String(task.answer ?? ''),
            steps: Array.isArray(task.steps) ? task.steps.map(step => ({ q: step.q, a: step.a, why: step.why })) : [],
            previouslySeen: question.previouslySeen, attemptId: attempt.id, contentId: question.contentId, outcome });
        }
        const result = { correct: byPosition.filter(row => row.correct).length, total: 21, answered: byPosition.filter(row => row.answered).length,
          assisted: assistance.teacher || assistance.hints, assistance, byPosition };
        store.run('UPDATE learning_runs SET result_json=?,finished_at=?,version=version+1 WHERE id=?', json(result), at, id);
      } else requireValue(false, 'LEARNING_INVALID');
      store.run('INSERT INTO learning_run_operations VALUES(?,?,?,?)', auth.id, body.opId, id, fingerprint);
      return { run: dto(authorized(auth, id)), duplicate: false };
    });
  }
  router.get('/runs', authMiddleware, handler((req, res) => {
    const auth = req.learningAuth, column = auth.role === 'teacher' ? 'teacher_id' : 'learner_id';
    res.json({ runs: store.rows(`SELECT * FROM learning_runs WHERE ${column}=? ORDER BY started_at DESC LIMIT 100`, auth.id).map(summary) });
  }));
  router.post('/runs', authMiddleware, mutationMiddleware, handler((req, res) => res.status(201).json(create(req.learningAuth, req.body))));
  router.get('/runs/:id', authMiddleware, handler((req, res) => res.json(dto(authorized(req.learningAuth, req.params.id)))));
  router.post('/runs/:id/actions', authMiddleware, mutationMiddleware, handler((req, res) => res.json(action(req.learningAuth, req.params.id, req.body))));
  return { router, create, action, get: (auth, id) => dto(authorized(auth, id)), list: auth => store.rows(`SELECT * FROM learning_runs WHERE ${auth.role === 'teacher' ? 'teacher_id' : 'learner_id'}=? ORDER BY started_at DESC LIMIT 100`, auth.id).map(summary) };
}

module.exports = { initializeRuns, createLearningRunsRouter, publicTask };
