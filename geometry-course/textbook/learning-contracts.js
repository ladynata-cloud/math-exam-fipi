(function (root) {
  'use strict';

  // Fixed adapter contract. The released textbook data and runtime stay unchanged.
  const TRAINER_ID = 'atanasyan-7-9';
  const CONTENT_ID = 'atanasyan-7-9-main-92-part-1';
  const CONTENT_VERSION = 1;
  const TITLE = 'Атанасян 7–9 · Задача 92а';
  const PROMPT = 'Изобразите произвольный треугольник MNP. Перечислите его стороны и углы.';
  const theoryId = number => 'atanasyan-7-9-theory-' + number + '-part-1';
  const THEORY = Object.freeze(Object.fromEntries([[14, 5, 13], [4, 4, 9], [1, 6, 13], [5, 3, 7]]
    .map(([number, steps, details]) => [theoryId(number), Object.freeze({ steps, details })])));
  const clone = value => JSON.parse(JSON.stringify(value));
  function requireValue(ok, message) { if (!ok) throw new Error(message || 'Недопустимое состояние задачи 92а'); }
  function object(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  }
  // Public board applyState also calls this contract directly, before a JSON
  // transport boundary. Inspect descriptors without invoking user getters.
  function json(value) {
    const seen = new Set(); let nodes = 0;
    function visit(item, depth) {
      requireValue(++nodes <= 12000 && depth <= 8, 'Слишком большое состояние');
      if (item === null || typeof item === 'boolean') return;
      if (typeof item === 'string') {
        requireValue(item.length <= 65536 && !/<\/?[a-z][^>]*>/i.test(item), 'Состояние должно содержать обычный текст');
        return;
      }
      if (typeof item === 'number') { requireValue(Number.isFinite(item)); return; }
      requireValue(typeof item === 'object' && !seen.has(item), 'Состояние должно быть JSON');
      const array = Array.isArray(item);
      requireValue(array ? Object.getPrototypeOf(item) === Array.prototype : object(item));
      const descriptors = Object.getOwnPropertyDescriptors(item), names = Reflect.ownKeys(descriptors);
      if (array) requireValue(item.length <= 2000 && names.length === item.length + 1, 'Недопустимый массив');
      seen.add(item);
      for (const name of names) {
        requireValue(typeof name === 'string' && !['__proto__', 'constructor', 'prototype'].includes(name));
        const descriptor = descriptors[name];
        requireValue(Object.hasOwn(descriptor, 'value'), 'В состоянии недопустимы getters');
        if (array && name === 'length') continue;
        requireValue(descriptor.enumerable, 'Скрытые поля состояния недопустимы');
        if (array) requireValue(/^(0|[1-9]\d*)$/.test(name) && Number(name) < item.length);
        visit(descriptor.value, depth + 1);
      }
      seen.delete(item);
    }
    visit(value, 1);
    requireValue(new TextEncoder().encode(JSON.stringify(value)).length <= 65536, 'Слишком большое состояние');
  }
  function keys(value, expected) {
    requireValue(object(value) && Object.keys(value).length === expected.length
      && expected.every(key => Object.hasOwn(value, key)), 'Недопустимые поля состояния');
  }
  function integer(value, min, max) { requireValue(Number.isSafeInteger(value) && value >= min && value <= max); }
  function boolean(value) { requireValue(typeof value === 'boolean'); }
  function view(value, steps, exactMax) {
    keys(value, ['viewId', 'zoom', 'maxStep']);
    integer(value.maxStep, 0, steps);
    if (exactMax !== undefined) requireValue(value.maxStep === exactMax);
    requireValue(typeof value.zoom === 'number' && Number.isFinite(value.zoom) && value.zoom >= 1 && value.zoom <= 2.5);
    requireValue(value.viewId === 'neutral' || Array.from({ length: value.maxStep }, (_, i) => 'step-' + (i + 1)).includes(value.viewId));
  }
  function opened(value, count) {
    requireValue(Array.isArray(value) && value.length <= count);
    let previous = -1;
    for (const index of value) { integer(index, 0, count - 1); requireValue(index > previous); previous = index; }
  }
  function canonical(contentId, seed) {
    requireValue(contentId === CONTENT_ID, 'Неизвестная задача');
    integer(seed, 0, 1000000000);
    return { trainerId: TRAINER_ID, contentId: CONTENT_ID, id: CONTENT_ID, seed,
      contentVersion: CONTENT_VERSION, revision: 1, answerMode: 'manual', title: TITLE, prompt: PROMPT, steps: 2 };
  }
  function validateTaskSpec(spec) {
    json(spec);
    requireValue(object(spec), 'Недопустимая задача');
    const expected = canonical(spec.contentId, spec.seed);
    keys(spec, Object.keys(expected));
    for (const key of Object.keys(expected)) requireValue(spec[key] === expected[key], 'Изменена зафиксированная задача');
    return expected;
  }
  function fresh() {
    return { lessonId: CONTENT_ID, draft: '', stepDrafts: {}, revealed: 0, assisted: false,
      checked: false, submitted: false, mainView: { viewId: 'neutral', zoom: 1, maxStep: 0 }, openDetails: [], theory: [] };
  }
  function normalizeState(state) {
    json(state);
    keys(state, ['lessonId', 'draft', 'stepDrafts', 'revealed', 'assisted', 'checked', 'submitted', 'mainView', 'openDetails', 'theory']);
    requireValue(state.lessonId === CONTENT_ID);
    requireValue(typeof state.draft === 'string' && state.draft.length <= 8000);
    keys(state.stepDrafts, []); // This released card has no individual step input fields.
    integer(state.revealed, 0, 2);
    boolean(state.assisted); boolean(state.submitted);
    requireValue(state.checked === false, 'Рассуждение проверяет учитель');
    view(state.mainView, 2, state.revealed);
    opened(state.openDetails, 4 + 2 * state.revealed);
    requireValue(Array.isArray(state.theory) && state.theory.length <= 2);
    state.theory.forEach((entry, index) => {
      keys(entry, ['id', 'view', 'openDetails']);
      requireValue(typeof entry.id === 'string' && Object.hasOwn(THEORY, entry.id));
      requireValue(index === 0 ? [theoryId(14), theoryId(4)].includes(entry.id)
        : state.theory[0].id === theoryId(14) && [theoryId(1), theoryId(5)].includes(entry.id));
      view(entry.view, THEORY[entry.id].steps);
      opened(entry.openDetails, THEORY[entry.id].details);
      const firstStep = THEORY[entry.id].details - 2 * THEORY[entry.id].steps;
      for (const index of entry.openDetails) if (index >= firstStep) {
        requireValue(Math.floor((index - firstStep) / 2) + 1 <= entry.view.maxStep,
          'Раскрытый шаг должен быть доступен на рисунке');
      }
    });
    requireValue(state.assisted || !(state.revealed > 0 || state.openDetails.some(index => index >= 1) || state.theory.length),
      'Открытая помощь должна быть отмечена');
    return clone(state);
  }
  function normalize(spec, state) { validateTaskSpec(spec); return normalizeState(state); }
  function create(contentId, seed) { return { taskSpec: canonical(contentId, seed), state: fresh() }; }
  function evaluate() { throw new Error('Рассуждение сохранено для ручной проверки; автоматическая оценка недоступна'); }
  function describe(spec) {
    const valid = validateTaskSpec(spec);
    return { title: valid.title, prompt: valid.prompt, contentId: CONTENT_ID, position: null, steps: valid.steps, answerMode: 'manual' };
  }
  function assistance(spec, state) { return normalize(spec, state).assisted; }
  function questionIdentity(spec) {
    const valid = validateTaskSpec(spec);
    return JSON.stringify({ trainerId: TRAINER_ID, contentId: CONTENT_ID, contentVersion: CONTENT_VERSION, revision: valid.revision, prompt: valid.prompt });
  }
  const api = Object.freeze({ TRAINER_ID, CONTENT_ID, CONTENT_VERSION, THEORY,
    create, fresh, normalizeState, normalize, validateTaskSpec, evaluate, describe, assistance, questionIdentity });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AtanasyanLearningContracts = api;
})(typeof window === 'undefined' ? globalThis : window);
