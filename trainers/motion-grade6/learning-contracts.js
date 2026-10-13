/* Version 1 pins the original twelve lessons and their 144 authored exercises. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const course = node ? require('./course-core.js') : root.MotionCourse;
  const fail = message => { throw new Error(message); };
  function keys(value, names) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).length !== names.length || names.some(name => !Object.hasOwn(value, name))) fail('Некорректные поля состояния.');
  }
  function integer(value, max) {
    if (!Number.isSafeInteger(value) || value < 0 || value > max) fail('Некорректный номер задачи или шага.');
    return value;
  }
  function text(value) {
    if (typeof value !== 'string' || value.length > 200 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail('Некорректный ответ.');
    return value;
  }
  function boolean(value) { if (typeof value !== 'boolean') fail('Некорректный переключатель.'); return value; }
  function correct(raw, expected) {
    const value = course.numeric(raw);
    return Number.isFinite(value) && Math.abs(value - expected) <= 1e-6;
  }
  function canonical(contentId, seed) {
    const lessonIndex = course.ids.indexOf(contentId);
    if (lessonIndex < 0 || !Number.isSafeInteger(seed) || seed < 0 || seed > 1000000000) fail('Неизвестное занятие или вариант.');
    return { schema: 'mathexam-motion-task', trainerId: 'motion-grade6', contentVersion: 1,
      contentId, id: contentId, lessonIndex, seed, title: course.lessons[lessonIndex][0],
      items: Array.from({ length: 12 }, (_, index) => course.task(lessonIndex, index)) };
  }
  function guard(spec) {
    if (!spec || JSON.stringify(canonical(spec.contentId, spec.seed)) !== JSON.stringify(spec)) fail('Условие отличается от сохранённой версии тренажёра.');
  }
  function fresh(spec) {
    guard(spec);
    return { schema: 'mathexam-motion-state', version: 1, contentId: spec.contentId, seed: spec.seed,
      view: 'train', taskIndex: 0, help: false, exampleStep: 0, modelTime: 0, modelOpen: false,
      records: Array.from({ length: 12 }, () => ({ draft: '', answers: [], finalAnswer: '', assisted: false })) };
  }
  function create(contentId, seed = 0) {
    const taskSpec = canonical(contentId, seed);
    return { taskSpec, state: fresh(taskSpec) };
  }
  function prefix(spec, values, index) {
    const task = spec.items[index];
    if (!Array.isArray(values) || values.length > task.steps.length) fail('Некорректная последовательность решения.');
    return values.map((raw, step) => {
      text(raw); if (!correct(raw, task.steps[step].a)) fail('В решении пропущен непроверенный шаг.');
      return raw;
    });
  }
  function isDone(spec, record, index) {
    const task = spec.items[index];
    if (!task || !record) return false;
    return (typeof record.finalAnswer === 'string' && record.finalAnswer !== '' && correct(record.finalAnswer, task.answer)) ||
      (Array.isArray(record.answers) && record.answers.length === task.steps.length &&
        record.answers.every((raw, step) => typeof raw === 'string' && correct(raw, task.steps[step].a)));
  }
  function normalize(spec, value) {
    guard(spec);
    keys(value, ['schema', 'version', 'contentId', 'seed', 'view', 'taskIndex', 'help', 'exampleStep', 'modelTime', 'modelOpen', 'records']);
    if (value.schema !== 'mathexam-motion-state' || value.version !== 1 || value.contentId !== spec.contentId || value.seed !== spec.seed ||
        !['learn', 'example', 'train'].includes(value.view)) fail('Состояние относится к другому занятию.');
    const taskIndex = integer(value.taskIndex, 11), task = spec.items[taskIndex];
    if (!Number.isFinite(value.modelTime) || value.modelTime < 0 || value.modelTime > task.duration) fail('Некорректное время анимации.');
    if (!Array.isArray(value.records) || value.records.length !== 12) fail('В занятии должно быть 12 задач.');
    const records = value.records.map((record, index) => {
      keys(record, ['draft', 'answers', 'finalAnswer', 'assisted']);
      const answers = prefix(spec, record.answers, index), finalAnswer = text(record.finalAnswer);
      if (finalAnswer !== '' && !correct(finalAnswer, spec.items[index].answer)) fail('Итоговый ответ не подтверждён.');
      const assisted = boolean(record.assisted) || answers.length > 0;
      return { draft: text(record.draft), answers, finalAnswer, assisted };
    });
    return { schema: value.schema, version: 1, contentId: spec.contentId, seed: spec.seed, view: value.view,
      taskIndex, help: boolean(value.help), exampleStep: integer(value.exampleStep, task.steps.length),
      modelTime: value.modelTime, modelOpen: boolean(value.modelOpen), records };
  }
  function status(spec, value) {
    const records = value.records;
    let completed = 0, independent = 0, assisted = 0;
    records.forEach((record, index) => {
      if (!isDone(spec, record, index)) return;
      completed++;
      if (record.assisted || record.answers.length) assisted++; else independent++;
    });
    return { completed, total: 12, independent, assisted };
  }
  function assistance(spec, value) {
    return value.view !== 'train' || value.help || value.modelOpen || value.records.some(record => record.assisted || record.answers.length > 0);
  }
  function evaluate(spec, details, normalizedState) {
    guard(spec);
    if (!details || !['step', 'final'].includes(details.scope)) fail('Неизвестный вид проверки.');
    keys(details, details.scope === 'step' ? ['scope', 'taskIndex', 'step', 'answer', 'answers'] : ['scope', 'taskIndex', 'answer']);
    const state = normalize(spec, normalizedState), index = integer(details.taskIndex, 11), answer = text(details.answer);
    if (state.view !== 'train' || state.taskIndex !== index) fail('Проверяется другая задача.');
    const record = state.records[index], task = spec.items[index];
    let ok;
    if (details.scope === 'step') {
      const step = integer(details.step, task.steps.length - 1), answers = prefix(spec, details.answers, index);
      if (!state.help || answers.length !== step) fail('Сначала завершите предыдущие шаги.');
      ok = correct(answer, task.steps[step].a);
      const expected = ok ? [...answers, answer] : answers;
      if (JSON.stringify(record.answers) !== JSON.stringify(expected)) fail('Сохранённое решение не соответствует проверке.');
    } else {
      if (state.help) fail('Для проверки по шагам укажите шаг.');
      ok = correct(answer, task.answer);
      if (ok && record.finalAnswer !== answer) fail('Сохранённый итоговый ответ не соответствует проверке.');
    }
    if (!ok && record.draft !== answer) fail('Сохранённый ответ не соответствует проверке.');
    return { correct: ok, complete: ok && status(spec, state).completed === 12,
      assisted: assistance(spec, state) || details.scope === 'step' };
  }
  function describe(spec) {
    guard(spec);
    return { title: spec.title, prompt: '12 задач: первые шаги, закрепление и задачи посложнее.',
      contentId: spec.contentId, position: null, steps: spec.items.reduce((sum, item) => sum + item.steps.length, 0) };
  }
  function questionIdentity(spec) {
    guard(spec);
    // The seed is an attempt envelope, never a new variant of this fixed bank.
    return JSON.stringify({ trainerId: spec.trainerId, contentId: spec.contentId,
      questions: spec.items.map(item => item.text).sort() });
  }
  const api = { create, fresh, normalize, evaluate, isDone, status, assistance, describe, questionIdentity, correct };
  if (node) module.exports = api; else root.MotionContracts = api;
})(typeof window === 'undefined' ? globalThis : window);
