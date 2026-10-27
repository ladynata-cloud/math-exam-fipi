/* Browser-local records for this bounded course. No cabinet/board grades. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AtanasyanFirstStepsState = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const plain = value => value && typeof value === 'object' && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const assert = value => { if (!value) throw Error('INVALID_COURSE_RECORD'); };
  function empty(lesson) {
    return { schemaVersion: 1, lessonId: lesson.id, revision: lesson.revision,
      draft: '', stepDrafts: {}, revealed: 0, explained: [], justified: [],
      assisted: false, submitted: false, read: false, compared: false,
      model: { viewId: 'neutral', zoom: 1, maxStep: 0 }, updatedAt: null };
  }
  function normalize(value, lesson) {
    assert(plain(value));
    const expected = Object.keys(empty(lesson));
    assert(Object.keys(value).length === expected.length && expected.every(key => own(value, key)));
    assert(value.schemaVersion === 1 && value.lessonId === lesson.id && value.revision === lesson.revision);
    assert(typeof value.draft === 'string' && value.draft.length <= 8000);
    assert(plain(value.stepDrafts) && Object.keys(value.stepDrafts).length <= lesson.steps.length);
    const steps = new Set(lesson.steps.map(step => step.id));
    for (const [key, text] of Object.entries(value.stepDrafts)) {
      assert(steps.has(key) && typeof text === 'string' && text.length <= 2000);
    }
    assert(Number.isSafeInteger(value.revealed) && value.revealed >= 0 && value.revealed <= lesson.steps.length);
    for (const field of ['explained', 'justified']) {
      assert(Array.isArray(value[field]) && value[field].length <= value.revealed);
      let previous = -1;
      for (const index of value[field]) {
        assert(Number.isSafeInteger(index) && index > previous && index >= 0 && index < value.revealed);
        previous = index;
      }
    }
    for (const field of ['assisted', 'submitted', 'read', 'compared']) assert(typeof value[field] === 'boolean');
    assert(value.assisted || !(value.revealed || value.compared || value.explained.length || value.justified.length));
    assert(value.updatedAt === null || typeof value.updatedAt === 'string' && /^\d{4}-\d\d-\d\dT/.test(value.updatedAt)
      && Number.isFinite(Date.parse(value.updatedAt)));
    assert(plain(value.model) && Object.keys(value.model).length === 3);
    assert(typeof value.model.viewId === 'string' && own(lesson.visualization.model.views, value.model.viewId));
    assert(Number.isFinite(value.model.zoom) && value.model.zoom >= 1 && value.model.zoom <= 2.5);
    assert(value.model.maxStep === value.revealed);
    const number = /^step-(\d+)$/.exec(value.model.viewId);
    assert(number ? Number(number[1]) <= value.revealed
      : value.model.viewId === 'neutral' || (lesson.visualization.model.views[value.model.viewId].availableFromStep || 0) <= value.revealed);
    return clone(value);
  }
  function createStore({ storage, scope = 'public', namespace = 'mathExamAtanasyanFirstSteps.v1', readOnly = false, onNotice = () => {} } = {}) {
    assert(typeof scope === 'string' && scope.length > 0 && scope.length <= 240);
    assert(['mathExamAtanasyanFirstSteps.v1', 'mathExamIchenskayaGrade7Works.v1'].includes(namespace));
    const prefix = namespace + ':' + encodeURIComponent(scope) + ':';
    const records = new Map(); let unavailableReported = false;
    function notice(message, kind) { onNotice(message, kind); }
    function unavailable() {
      if (!unavailableReported) {
        unavailableReported = true;
        notice('Браузер не сохранил записи. Они остаются в открытой странице; скачай их перед закрытием.', 'storage');
      }
    }
    const keyFor = lesson => prefix + lesson.id + ':r' + lesson.revision;
    function raw(key) {
      if (readOnly) return null;
      try { if (!storage) { unavailable(); return null; } return storage.getItem(key); }
      catch (_) { unavailable(); return null; }
    }
    function read(lesson) {
      if (readOnly) return empty(lesson);
      if (records.has(lesson.id)) return clone(records.get(lesson.id).state);
      const original = raw(keyFor(lesson)); let state = empty(lesson);
      if (original) {
        try { assert(original.length <= 100000); state = normalize(JSON.parse(original), lesson); }
        catch (_) { notice('Прежняя запись этого задания имеет другой формат. Она сохранена отдельно и не будет перезаписана.', 'invalid'); }
      }
      records.set(lesson.id, { state, expected: original, conflict: !!original && state.updatedAt === null });
      return clone(state);
    }
    function write(lesson, proposed) {
      if (readOnly) return { saved: false, readOnly: true };
      read(lesson);
      const entry = records.get(lesson.id), state = normalize(proposed, lesson);
      // A hint is irreversible within the same task, including after returning
      // from another page or a caller trying to replace its local state.
      state.assisted = entry.state.assisted || state.assisted;
      entry.state = clone(state);
      if (entry.conflict || raw(keyFor(lesson)) !== entry.expected) {
        entry.conflict = true;
        notice('В другом окне есть новая запись этого задания. Твой текст остался на экране; скачай его перед открытием сохранённой версии.', 'conflict');
        return { saved: false, conflict: true };
      }
      state.updatedAt = new Date().toISOString(); entry.state = clone(state);
      if (!storage) { unavailable(); return { saved: false, memory: true }; }
      try {
        const value = JSON.stringify(state);
        storage.setItem(keyFor(lesson), value); entry.expected = value;
        return { saved: true };
      } catch (_) { unavailable(); return { saved: false, memory: true }; }
    }
    function hasConflict(lesson) {
      if (readOnly) return false;
      read(lesson); const entry = records.get(lesson.id);
      if (raw(keyFor(lesson)) !== entry.expected) entry.conflict = true;
      return entry.conflict;
    }
    function reload(lesson) { records.delete(lesson.id); return read(lesson); }
    function all(lessons) {
      if (readOnly) return [];
      return lessons.map(lesson => read(lesson)).filter(record => record.updatedAt !== null || record.draft
        || Object.values(record.stepDrafts).some(Boolean) || record.revealed || record.submitted || record.read);
    }
    function remember(lesson) {
      if (readOnly || !storage) return;
      try { storage.setItem(prefix + 'last', lesson.id); } catch (_) { unavailable(); }
    }
    function last(lessons) {
      if (readOnly) return null;
      const id = raw(prefix + 'last'); return lessons.some(lesson => lesson.id === id) ? id : null;
    }
    function legacy(lesson, bookId) {
      if (readOnly) return null;
      const value = raw('mathExamTextbook.v1:' + bookId + ':' + lesson.id + ':r' + lesson.revision);
      if (!value || value.length > 100000) return null;
      try {
        const previous = JSON.parse(value); if (!plain(previous)) return null;
        const next = empty(lesson);
        next.draft = typeof previous.draft === 'string' ? previous.draft.slice(0, 8000) : '';
        for (const step of lesson.steps) if (plain(previous.stepDrafts) && typeof previous.stepDrafts[step.id] === 'string') {
          next.stepDrafts[step.id] = previous.stepDrafts[step.id].slice(0, 2000);
        }
        next.revealed = Number.isSafeInteger(previous.revealed) ? Math.max(0, Math.min(lesson.steps.length, previous.revealed)) : 0;
        next.assisted = previous.assisted === true || next.revealed > 0;
        next.model.maxStep = next.revealed;
        if (!next.draft && !Object.values(next.stepDrafts).some(Boolean) && !next.revealed) return null;
        return normalize(next, lesson);
      } catch (_) { return null; }
    }
    return Object.freeze({ read, write, keyFor, hasConflict, reload, all, remember, last, legacy });
  }
  return Object.freeze({ empty, normalize, createStore });
});
