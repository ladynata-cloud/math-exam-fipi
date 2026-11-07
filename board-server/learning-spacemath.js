'use strict';

const express = require('express');
const { requireValue, exactKeys, safeName } = require('./learning-auth');
const { ID, parse } = require('./learning-store');

// A construction is a durable attempt with the existing account, controller,
// revision and event history. This router only supplies the document library.
function createSpaceMathRouter({ store, handler, authMiddleware, mutationMiddleware }) {
  const router = express.Router();

  function scope(auth, learnerId = auth.id) {
    requireValue(typeof learnerId === 'string' && ID.test(learnerId), 'LEARNING_NOT_FOUND', 404);
    if (auth.role === 'teacher') {
      if (learnerId !== auth.id) store.ownsStudent(auth, learnerId);
      return { learnerId, teacherId: auth.id };
    }
    requireValue(auth.role === 'student' && learnerId === auth.id, 'LEARNING_NOT_FOUND', 404);
    const learner = store.account(auth.id);
    requireValue(learner?.role === 'student' && learner.teacher_id === auth.teacherId, 'LEARNING_NOT_FOUND', 404);
    return { learnerId, teacherId: learner.teacher_id };
  }

  function source(auth, id) {
    requireValue(typeof id === 'string' && ID.test(id), 'LEARNING_NOT_FOUND', 404);
    const row = store.attemptRow(auth, id);
    const owner = scope(auth, row.learner_id);
    requireValue(row.teacher_id === owner.teacherId, 'LEARNING_NOT_FOUND', 404);
    requireValue(row.trainer_id === 'spacemath' && parse(row.task_json)?.contentId === 'construction', 'LEARNING_NOT_FOUND', 404);
    requireValue(row.archived_at == null, 'LEARNING_ATTEMPT_ARCHIVED', 409);
    requireValue(!store.runGuard?.(row.id), 'LEARNING_RUN_ACTIVE', 409);
    requireValue(!store.row("SELECT id FROM assignments WHERE attempt_id=? AND status!='published'", row.id), 'LEARNING_NOT_FOUND', 404);
    return row;
  }

  router.get('/spacemath/models', authMiddleware, handler((req, res) => {
    exactKeys(req.query, ['learnerId']);
    const owner = scope(req.learningAuth, req.query.learnerId);
    const rows = store.rows(`SELECT * FROM attempts WHERE learner_id=? AND teacher_id=?
      AND trainer_id='spacemath' AND json_extract(task_json,'$.contentId')='construction' AND archived_at IS NULL
      AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.attempt_id=attempts.id AND a.status!='published')
      ORDER BY updated_at DESC,id LIMIT 200`, owner.learnerId, owner.teacherId);
    res.json({ models: rows.filter(row => !store.runGuard?.(row.id)).map(row => {
      const state = parse(row.state_json);
      return { ...store.attemptSummary(row), title: state.title, objectCount: state.objects.length };
    }) });
  }));

  router.post('/spacemath/models', authMiddleware, mutationMiddleware, handler((req, res) => {
    const body = req.body, auth = req.learningAuth;
    exactKeys(body, ['opId', 'learnerId', 'sourceAttemptId', 'title'], ['opId']);
    requireValue(typeof body.opId === 'string' && ID.test(body.opId), 'LEARNING_OP_INVALID');
    const title = Object.hasOwn(body, 'title') ? safeName(body.title, 120) : undefined;
    const authorize = () => ({ owner: scope(auth, body.learnerId),
      original: Object.hasOwn(body, 'sourceAttemptId') ? source(auth, body.sourceAttemptId) : null });
    authorize();
    const result = store.operation(auth, { ...body, operation: 'spacemath-model' }, () => {
      const { owner, original } = authorize();
      const generated = original
        ? { taskSpec: parse(original.task_json), state: store.contracts.normalize('spacemath', parse(original.task_json), parse(original.state_json)) }
        : store.contracts.create('spacemath', 'construction');
      if (title !== undefined) generated.state.title = title;
      // Source ownership never crosses into another pupil's or the teacher's
      // private library. Only the bounded construction itself is copied.
      const sourceId = original?.learner_id === owner.learnerId ? original.id : null;
      const attempt = store.newAttempt(owner.learnerId, owner.teacherId, 'spacemath', generated, sourceId);
      return { attemptId: attempt.id };
    }, saved => {
      const { owner } = authorize();
      const current = source(auth, saved.attemptId);
      requireValue(current.learner_id === owner.learnerId && current.teacher_id === owner.teacherId, 'LEARNING_NOT_FOUND', 404);
    });
    // Receipts contain only an ID. A retry cannot return an old state or a
    // private snapshot after an ownership change; resolve current access/state.
    res.status(result.duplicate ? 200 : 201).json({ attempt: store.getAttempt(auth, result.attemptId), duplicate: result.duplicate });
  }));

  return router;
}

module.exports = { createSpaceMathRouter };
