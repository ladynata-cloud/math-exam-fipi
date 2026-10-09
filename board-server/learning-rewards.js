'use strict';

const { requireValue } = require('./learning-auth');
const { createHash } = require('node:crypto');
const { ID, canonical } = require('./learning-store');
const { independent } = require('../learning/outcomes');

const INDEPENDENT = new Set(independent);
const MAX_ATTEMPTS = 20000; // Same lifetime bound as LearningStore.newAttempt.
const LEVEL_SIZE = 100;

function rewardFingerprint(store, spec) {
  // The existing assessment fingerprint describes one question. A remediation
  // checkpoint is a whole set: its first question alone cannot identify it.
  // Keep this reward identity local so historical grading/exposure semantics
  // remain unchanged. Order, seeds, option IDs and worked answers are not new
  // conditions; the visible questions and division operands are.
  if (spec.trainerId === 'oge-basics' && spec.schema === 'mathexam-remediation-task') {
    let kind, questions;
    if (Array.isArray(spec.divisionTasks) && spec.divisionTasks.length) {
      kind = 'division-checkpoint';
      questions = spec.divisionTasks.map(item => canonical({
        level: item.task.level, dividend: item.task.dividend, divisor: item.task.divisor
      }));
    } else if (Array.isArray(spec.items) && spec.items.length) {
      kind = 'question-checkpoint';
      questions = spec.items.map(item => canonical({
        kind: item.kind, prompt: item.q || item.prompt,
        options: (item.options || []).map(option => typeof option === 'object' ? option.html : String(option)).sort(),
        choices: item.choices, labels: item.labels, display: item.display, model: item.model
      }));
    }
    if (questions) return createHash('sha256').update(canonical({ kind, questions: questions.sort() })).digest('hex');
  }
  return store.taskFingerprint(spec);
}

// A read-only ledger of server-graded questions. Academic resets archive
// attempts, so they neither remove earned points nor allow the same question
// to earn another reward. No browser state, photo grade or submission count
// participates in this calculation.
function getRewards(store, auth, learnerId = auth?.id) {
  requireValue(auth && ['student', 'teacher'].includes(auth.role), 'LEARNING_FORBIDDEN', 403);
  requireValue(typeof learnerId === 'string' && ID.test(learnerId), 'LEARNING_NOT_FOUND', 404);
  if (auth.role === 'teacher') store.ownsStudent(auth, learnerId);
  else requireValue(learnerId === auth.id, 'LEARNING_NOT_FOUND', 404);
  store.ready();

  // Iterate instead of loading thousands of full task specifications at once.
  // Each NOT IN subquery builds its set once; no per-attempt scan of all
  // assignments/operations. Reset loses a homework's previous status, so its
  // successful publish operation proves that an archived assignment really
  // was available to the pupil. Archiving an unseen teacher draft earns zero.
  const rows = store.db.prepare(`SELECT trainer_id,task_json,outcome FROM attempts
    WHERE learner_id=? AND trainer_id IN ('ege-path','oge-basics')
      AND outcome IN ('together','hinted','independent','repeated','practiced')
      AND id NOT IN (SELECT attempt_id FROM assignments WHERE status='draft'
        OR (status='archived' AND id NOT IN (
          SELECT json_extract(result_json,'$.assignment.id') FROM operations
          WHERE json_extract(result_json,'$.assignment.status')='published'
            AND json_type(result_json,'$.assignment.id')='text')))
    LIMIT ?`).iterate(learnerId, MAX_ATTEMPTS + 1);
  const conditions = new Map(), themes = new Set();
  let scanned = 0;
  for (const row of rows) {
    // Fail closed rather than silently dropping old rewards if the storage
    // bound is ever changed without revisiting this calculation.
    requireValue(++scanned <= MAX_ATTEMPTS, 'LEARNING_REWARDS_LIMIT_EXCEEDED', 503);
    const taskSpec = JSON.parse(row.task_json);
    const fingerprint = rewardFingerprint(store, taskSpec);
    requireValue(typeof fingerprint === 'string' && /^[a-f0-9]{64}$/.test(fingerprint), 'LEARNING_TASK_INVALID');
    // Include the scope for stores using the legacy fallback fingerprint,
    // which intentionally hashes just the question, ignoring its seed/id.
    const scope = JSON.stringify([row.trainer_id, taskSpec.contentId]);
    const key = scope + ':' + fingerprint;
    conditions.set(key, conditions.get(key) === true || INDEPENDENT.has(row.outcome));
    themes.add(scope);
  }

  const uniqueCompleted = conditions.size;
  let independentConditions = 0;
  for (const earned of conditions.values()) if (earned) independentConditions++;
  const totalPoints = uniqueCompleted * 10 + independentConditions * 5;
  const level = Math.floor(totalPoints / LEVEL_SIZE) + 1;
  const badges = [];
  if (uniqueCompleted >= 1) badges.push({ id: 'first-completion', title: 'Первая решённая задача' });
  if (themes.size >= 5) badges.push({ id: 'five-themes', title: 'Решены задачи по пяти темам' });
  if (independentConditions >= 10) badges.push({ id: 'ten-independent', title: 'Десять самостоятельных решений' });
  return {
    version: 1, totalPoints, uniqueCompleted, independentConditions,
    completedThemes: themes.size, level, levelSize: LEVEL_SIZE,
    nextLevelAt: level * LEVEL_SIZE, pointsWithinLevel: totalPoints % LEVEL_SIZE,
    badges, trustedBasis: 'server-graded-distinct-conditions', lifetime: true
  };
}

module.exports = { getRewards };
