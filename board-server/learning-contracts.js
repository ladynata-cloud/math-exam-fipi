'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { LearningError, requireValue } = require('./learning-auth');
const pathState = require('../ege-baza/path/managed-state');
const remediation = require('./learning-remediation-contracts');
const catalog = require('../learning/catalog');
const pathExamPool = require('../ege-baza/path/exam-pool');
const context = vm.createContext({}, { codeGeneration: { strings: false, wasm: false } });
for (const name of ['data.js', 'practice.js', 'equation-practice.js', 'grade7-algebra.js', 'grade7-geometry.js', 'grade7-geometry-core.js', 'grade7-geometry-practice.js', 'grade7-foundations.js', 'pre7-arithmetic.js', 'pre7-applications.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../ege-baza/path', name), 'utf8'), context,
    { filename: name, timeout: 1000 });
}
const D = context.PathData;
const meta = new Map(D.meta.map(item => [item.id, item]));
const clone = value => JSON.parse(JSON.stringify(value));

function bounded(value) {
  requireValue(value != null && typeof value === 'object' && !Array.isArray(value), 'LEARNING_STATE_INVALID');
  let nodes = 0;
  const visit = (item, depth) => {
    requireValue(++nodes <= 12000 && depth <= 16, 'LEARNING_STATE_INVALID');
    if (typeof item === 'number') requireValue(Number.isFinite(item), 'LEARNING_STATE_INVALID');
    else if (item && typeof item === 'object') {
      requireValue(Array.isArray(item) || [Object.prototype, null].includes(Object.getPrototypeOf(item)), 'LEARNING_STATE_INVALID');
      for (const key of Object.keys(item)) {
        requireValue(!['__proto__', 'constructor', 'prototype'].includes(key), 'LEARNING_STATE_INVALID');
        visit(item[key], depth + 1);
      }
    } else requireValue(item === null || ['string', 'boolean'].includes(typeof item), 'LEARNING_STATE_INVALID');
  };
  visit(value, 0);
  requireValue(Buffer.byteLength(JSON.stringify(value)) <= 65536, 'LEARNING_STATE_TOO_LARGE');
  return value;
}

function list() {
  return catalog.items.map(item => ({ ...item }));
}

function create(trainerId, contentId, seed = crypto.randomInt(1, 1000000)) {
  requireValue(Number.isSafeInteger(seed) && seed >= 0 && seed <= 1000000000, 'LEARNING_TASK_INVALID');
  if (trainerId === 'oge-basics') {
    const created = remediation.create(contentId, seed);
    created.taskSpec.trainerId = trainerId;
    created.taskSpec.id = contentId;
    return created;
  }
  requireValue(trainerId === 'ege-path' && meta.has(contentId), 'LEARNING_TRAINER_UNKNOWN');
  const taskSpec = { trainerId, contentId, id: contentId, seed, contentVersion: 1, task: clone(D.task(contentId, seed)) };
  return { taskSpec, state: pathState.fresh(taskSpec) };
}

function normalize(trainerId, taskSpec, state) {
  bounded(state);
  try {
    if (trainerId === 'oge-basics') return remediation.normalize(taskSpec, state);
    requireValue(trainerId === 'ege-path' && meta.has(taskSpec.contentId) && taskSpec.contentVersion === 1, 'LEARNING_TRAINER_UNKNOWN');
    return pathState.validate(state, taskSpec, D.correct);
  } catch (error) {
    if (error instanceof LearningError) throw error;
    throw new LearningError('LEARNING_STATE_INVALID');
  }
}

function evaluate(trainerId, taskSpec, details) {
  bounded(details);
  try {
    if (trainerId === 'oge-basics') return remediation.evaluate(taskSpec, details);
    requireValue(trainerId === 'ege-path' && meta.has(taskSpec.contentId) && taskSpec.contentVersion === 1, 'LEARNING_TRAINER_UNKNOWN');
    requireValue(typeof details.answer === 'string' && details.answer.length <= 4000, 'LEARNING_ANSWER_INVALID');
    const task = taskSpec.task;
    if (details.scope === 'step') {
      requireValue(Number.isInteger(details.step) && details.step >= 0 && details.step < task.steps.length, 'LEARNING_STEP_INVALID');
      requireValue(Array.isArray(details.answers) && details.answers.length === details.step && details.answers.every((answer, index) =>
        typeof answer === 'string' && answer.length <= 4000 && D.correct(task.steps[index], answer)), 'LEARNING_STEP_PREFIX_INVALID');
      const correct = !!D.correct(task.steps[details.step], details.answer);
      return { correct, complete: correct && details.step === task.steps.length - 1, assisted: true };
    }
    requireValue(details.scope === 'final', 'LEARNING_CHECK_INVALID');
    const correct = !!D.correct(task, details.answer);
    return { correct, complete: correct };
  } catch (error) {
    if (error instanceof LearningError) throw error;
    throw new LearningError('LEARNING_CHECK_INVALID');
  }
}

function describe(taskSpec) {
  if (taskSpec.trainerId === 'oge-basics') return remediation.describe(taskSpec);
  const item = meta.get(taskSpec.contentId);
  return { title: item?.title || '', prompt: taskSpec.task?.q || '', contentId: taskSpec.contentId,
    position: item?.pos, steps: taskSpec.task?.steps?.length || 1 };
}

// Identity ignores seeds and answer keys. Repetition must use a different question.
function questionIdentity(taskSpec) {
  const task = taskSpec.task || {};
  return crypto.createHash('sha256').update(JSON.stringify({ trainerId: taskSpec.trainerId,
    contentId: taskSpec.contentId, prompt: task.q || task.prompt, choices: task.choices,
    labels: task.labels, display: task.display, model: task.model, divisionTask: taskSpec.divisionTask })).digest('hex');
}

function assistance(trainerId, _taskSpec, state) {
  if (trainerId === 'ege-path') return state.work.help || state.work.stage < 3 || !!state.view.hintText;
  if (trainerId === 'oge-basics') return state.view === 'learn' || state.hint > 0 || ['hint', 'solution'].includes(state.feedback.kind);
  return false;
}

function expectedText(taskSpec) {
  if (taskSpec.trainerId === 'ege-path') {
    if (taskSpec.task.answerKind === 'solutions') return 'Например: ' + taskSpec.task.solutions[0];
    if (taskSpec.task.rule) return 'Возможны разные ответы, удовлетворяющие условию';
    return D.answerText(taskSpec.task);
  }
  return '';
}

function examPool(position) {
  const ids = new Set(pathExamPool.select(D.meta, position).map(item => item.id));
  return list().filter(item => item.trainerId === 'ege-path' && ids.has(item.contentId));
}

module.exports = { list, create, normalize, evaluate, describe, questionIdentity, assistance, expectedText, examPool };
