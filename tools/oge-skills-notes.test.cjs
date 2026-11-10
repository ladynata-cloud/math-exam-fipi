'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Notes = require('../oge/skills/notes-store.js');
const Store = require('../foundations/route-store.js');
const C = require('../foundations/route-core.js');
const catalog = require('../oge/skills/catalog.js');
const foundationCatalog = require('../foundations/route-catalog.js');

const OGE_PREFIX = 'mathExamOge.skillMaps.v1.';
const map = catalog.byId['practical-tires'];
const node = map.nodes[0];
const nextNode = map.nodes[1];

function fixture() {
  const originals = new Map([
    ['mathExamCourseProgress.v1', '{"existing":"exact bytes"}'],
    ['mathExamFoundations.visits.v1', 'old visits\r\n'],
    ['mathExamBoard.savedWork', 'existing board work'],
  ]);
  const data = new Map(originals);
  const writes = [];
  let tick = 1762770000000;
  let serial = 0;
  const control = { denyRead: false, denyWrite: false, rejectWrite: null };
  function readable() {
    if (control.denyRead) throw Error('read denied');
  }
  const storage = {
    get length() { readable(); return data.size; },
    key(index) { readable(); return [...data.keys()][index] ?? null; },
    getItem(key) { readable(); return data.has(key) ? data.get(key) : null; },
    setItem(key, value) {
      if (control.denyWrite || control.rejectWrite?.(key, value)) throw Error('write denied');
      data.set(key, String(value));
      writes.push({ key, value: String(value) });
    },
    removeItem(key) { data.delete(key); },
  };
  const options = () => ({ now: () => ++tick, random: () => String(++serial).padStart(12, '0') });
  return {
    data, writes, originals, storage, control, options,
    notes: () => Notes.create(catalog, storage, options()),
    checkStore: (prefix = OGE_PREFIX, selectedCatalog = catalog) => Store.create(selectedCatalog, storage, { ...options(), prefix }),
  };
}

function noteBytes(f) {
  return new Map([...f.data].filter(([key]) => key.startsWith(Notes.PREFIX + 'event.')));
}

function assertOriginals(f) {
  for (const [key, value] of f.originals) assert.equal(f.data.get(key), value, key);
}

function solve(store, id, route, mode) {
  for (const q of C.questions(route, mode)) store.act(id, 'submit', q.id, String(q.answer));
  return store.act(id, 'finish');
}

test('explanations append exact text and retain every earlier version without rewriting other work', () => {
  const f = fixture();
  const notes = f.notes();
  const first = 'Сначала −3,5; затем 1/2.\n  <рисунок> & «объяснение»';
  const a = notes.saveNote(map.id, node.id, first);
  const before = noteBytes(f);
  const b = notes.saveNote(map.id, node.id, first + '\nПроверяю единицы.');
  const c = notes.saveNote(map.id, node.id, '');
  assert.notEqual(a.id, b.id);
  assert.notEqual(b.id, c.id);
  assert.deepEqual(f.notes().latest(map.id, node.id).history.map(e => e.text), [first, first + '\nПроверяю единицы.', '']);
  assert.equal(f.notes().latest(map.id, node.id).text, '');
  for (const [key, value] of before) assert.equal(f.data.get(key), value, 'immutable note bytes');
  assert.equal(f.writes.length, 3);
  assertOriginals(f);
});

test('unchanged explanation or review does not create duplicate history, and nodes stay separate', () => {
  const f = fixture();
  const notes = f.notes();
  const saved = notes.saveNote(map.id, node.id, 'Мой первый способ.');
  assert.equal(notes.saveNote(map.id, node.id, 'Мой первый способ.').id, saved.id);
  const review = notes.saveReview(map.id, node.id, [1, 0, 1], saved.id);
  assert.deepEqual(review.checks, [0, 1]);
  assert.equal(notes.saveReview(map.id, node.id, [0, 1], saved.id).id, review.id);
  notes.saveNote(map.id, nextNode.id, 'Объяснение другого шага.');
  assert.equal(notes.latest(map.id, node.id).history.length, 1);
  assert.equal(notes.latest(map.id, nextNode.id).history.length, 1);
  assert.deepEqual(notes.latest(map.id, nextNode.id).checks, []);
  assert.equal(notes.read().events.length, 3);
});

test('two tabs append interleaved versions without losing either tab history', () => {
  const f = fixture();
  const a = f.notes();
  const b = f.notes();
  a.saveNote(map.id, node.id, 'Первая вкладка: модель.');
  b.saveNote(map.id, node.id, 'Вторая вкладка: проверка модели.');
  a.saveNote(map.id, node.id, 'Первая вкладка: исправленное объяснение.');
  const expected = ['Первая вкладка: модель.', 'Вторая вкладка: проверка модели.', 'Первая вкладка: исправленное объяснение.'];
  assert.deepEqual(a.latest(map.id, node.id).history.map(e => e.text), expected);
  assert.deepEqual(b.latest(map.id, node.id).history.map(e => e.text), expected);
  assert.equal(new Set(a.read().events.map(e => e.id)).size, 3);
  assert.equal(noteBytes(f).size, 3);
});

test('self-review belongs to the exact explanation version, including returning to old wording', () => {
  const f = fixture();
  const a = f.notes();
  const b = f.notes();
  const first = a.saveNote(map.id, node.id, 'Старое объяснение.');
  const review = a.saveReview(map.id, node.id, [0, 1], first.id);
  assert.equal(review.noteId, first.id);
  const revised = b.saveNote(map.id, node.id, 'Другое объяснение.');
  assert.deepEqual(a.latest(map.id, node.id).checks, []);
  assert.equal(a.latest(map.id, node.id).review, null);
  a.saveReview(map.id, node.id, [0], revised.id);
  const returned = b.saveNote(map.id, node.id, 'Старое объяснение.');
  assert.notEqual(returned.id, first.id);
  assert.deepEqual(a.latest(map.id, node.id).checks, []);
  assert.equal(a.read().events.find(e => e.id === review.id).noteId, first.id, 'old self-review remains in history');
});

test('a stale checkbox action cannot apply to a peer explanation saved since the caller read it', () => {
  const f = fixture();
  const a = f.notes();
  const b = f.notes();
  const displayed = a.saveNote(map.id, node.id, 'Текст, который открыт в первой вкладке.');
  b.saveNote(map.id, node.id, 'Новая версия из второй вкладки.');
  const before = noteBytes(f);
  assert.equal(a.saveReview(map.id, node.id, [0, 1], displayed.id), null);
  assert.deepEqual(noteBytes(f), before, 'rejected stale review writes nothing');
  assert.deepEqual(b.latest(map.id, node.id).checks, []);
});

test('self-review made without text does not transfer to the first written explanation', () => {
  const f = fixture();
  const notes = f.notes();
  const review = notes.saveReview(map.id, node.id, [0], null);
  assert.equal(review.noteId, null);
  notes.saveNote(map.id, node.id, 'Теперь есть записанное объяснение.');
  assert.deepEqual(notes.latest(map.id, node.id).checks, []);
  assert.equal(notes.latest(map.id, node.id).review, null);
});

test('corrupt JSON, invalid records and wrong-key records stay byte-for-byte intact and give no note evidence', () => {
  const f = fixture();
  const notes = f.notes();
  const original = notes.saveNote(map.id, node.id, 'Сохранённое объяснение.');
  const invalid = new Map([
    [Notes.PREFIX + 'event.broken-json', '{"unclosed":'],
    [Notes.PREFIX + 'event.invalid-text', JSON.stringify({ ...original, id: 'invalid-text', text: 42 })],
    [Notes.PREFIX + 'event.invalid-review', JSON.stringify({ ...original, id: 'invalid-review', type: 'review', noteId: original.id, checks: [999] })],
    [Notes.PREFIX + 'event.wrong-storage-key', JSON.stringify({ ...original, id: 'different-event-id' })],
  ]);
  for (const [key, value] of invalid) f.data.set(key, value);
  const read = notes.read();
  assert.equal(read.reliable, false);
  assert.match(read.notice, /поврежд|прочитать/);
  assert.deepEqual(read.events.map(e => e.id), [original.id]);
  notes.saveNote(map.id, node.id, 'Новая правильная запись.');
  for (const [key, value] of invalid) assert.equal(f.data.get(key), value, key);
  assert.equal(notes.latest(map.id, node.id).history.length, 2);
  assertOriginals(f);
});

test('denied writes keep text and review in the current tab until a successful ordered flush', () => {
  const f = fixture();
  const notes = f.notes();
  f.control.denyWrite = true;
  const note = notes.saveNote(map.id, node.id, 'Не потерять эту запись.');
  notes.saveReview(map.id, node.id, [1], note.id);
  assert.equal(notes.latest(map.id, node.id).text, 'Не потерять эту запись.');
  assert.deepEqual(notes.latest(map.id, node.id).checks, [1]);
  assert.equal(notes.read().pending, 2);
  assert.equal(notes.read().reliable, false);
  assert.equal(f.notes().latest(map.id, node.id).text, '', 'another tab cannot claim unsaved work');
  assert.equal(noteBytes(f).size, 0);
  f.control.denyWrite = false;
  assert.equal(notes.flush(), true);
  assert.equal(notes.read().pending, 0);
  assert.equal(f.notes().latest(map.id, node.id).text, 'Не потерять эту запись.');
  assert.deepEqual(f.notes().latest(map.id, node.id).checks, [1]);
  assert.deepEqual(f.writes.map(w => JSON.parse(w.value).type), ['note', 'review']);
  assertOriginals(f);
});

test('denied reads retain the current tab text with an explicit reliability warning', () => {
  const f = fixture();
  const notes = f.notes();
  notes.saveNote(map.id, node.id, 'Уже сохранённый текст.');
  f.control.denyRead = true;
  f.control.denyWrite = true;
  notes.saveNote(map.id, node.id, 'Правка во время отказа хранилища.');
  assert.equal(notes.latest(map.id, node.id).text, 'Правка во время отказа хранилища.');
  assert.equal(notes.read().pending, 1);
  assert.equal(notes.read().reliable, false);
  assert.match(notes.read().notice, /вкладке|недоступно/);
  f.control.denyRead = false;
  f.control.denyWrite = false;
  notes.flush();
  assert.equal(f.notes().latest(map.id, node.id).history.length, 2);
});

test('deleting persisted notes in a peer tab removes cached notes, reviews, visits and cursor', () => {
  const f = fixture();
  const notes = f.notes();
  const saved = notes.saveNote(map.id, node.id, 'Удалённая затем работа.');
  notes.saveReview(map.id, node.id, [0], saved.id);
  notes.visit(map.id, node.id, node.resources[0].href);
  notes.cursor(map.id, node.id);
  assert.equal(notes.read().events.length, 4);
  for (const key of noteBytes(f).keys()) f.storage.removeItem(key);
  assert.deepEqual(notes.read().events, []);
  assert.deepEqual(notes.latest(map.id, node.id), { text: '', checks: [], note: null, review: null, history: [], visits: [] });
  assert.equal(notes.last(), null);
  notes.flush();
  assert.equal(noteBytes(f).size, 0, 'cache must not resurrect deleted work');
  assertOriginals(f);
});

test('a peer deletion does not discard a genuinely unsaved current-tab explanation', () => {
  const f = fixture();
  const notes = f.notes();
  notes.saveNote(map.id, node.id, 'Ранее сохранённое.');
  f.control.denyWrite = true;
  notes.saveNote(map.id, node.id, 'Ещё не сохранённая правка.');
  for (const key of noteBytes(f).keys()) f.storage.removeItem(key);
  assert.deepEqual(notes.latest(map.id, node.id).history.map(e => e.text), ['Ещё не сохранённая правка.']);
  f.control.denyWrite = false;
  notes.flush();
  assert.deepEqual(f.notes().latest(map.id, node.id).history.map(e => e.text), ['Ещё не сохранённая правка.']);
});

test('a failed first note cannot be overtaken on disk by its review, visit or resume cursor', () => {
  const f = fixture();
  const notes = f.notes();
  let reject = true;
  f.control.rejectWrite = (key, value) => reject && key.startsWith(Notes.PREFIX) && JSON.parse(value).type === 'note';
  const note = notes.saveNote(map.id, node.id, 'Запись перед самооценкой.');
  notes.saveReview(map.id, node.id, [0], note.id);
  notes.visit(map.id, node.id, node.resources[0].href);
  notes.cursor(map.id, node.id);
  assert.equal(notes.read().pending, 4);
  assert.equal(noteBytes(f).size, 0);
  assert.equal(f.notes().last(), null, 'no durable cursor may hide the missing note');
  reject = false;
  notes.flush();
  assert.deepEqual(f.writes.map(w => JSON.parse(w.value).type), ['note', 'review', 'visit', 'cursor']);
  const reloaded = f.notes();
  assert.equal(reloaded.latest(map.id, node.id).note.id, note.id);
  assert.deepEqual(reloaded.latest(map.id, node.id).checks, [0]);
  assert.equal(reloaded.latest(map.id, node.id).visits.length, 1);
  assert.equal(reloaded.last().node, node.id);
});

test('flushing an older offline explanation later does not replace a newer peer version or inherit its review', () => {
  const f = fixture();
  const a = f.notes();
  const b = f.notes();
  f.control.denyWrite = true;
  const earlier = a.saveNote(map.id, node.id, 'Более ранняя несохранённая мысль.');
  a.saveReview(map.id, node.id, [0], earlier.id);
  f.control.denyWrite = false;
  const later = b.saveNote(map.id, node.id, 'Более поздняя мысль из другой вкладки.');
  a.flush();
  const result = f.notes().latest(map.id, node.id);
  assert.equal(result.note.id, later.id);
  assert.deepEqual(result.checks, []);
  assert.deepEqual(result.history.map(e => e.id), [earlier.id, later.id]);
  assert(f.writes.findIndex(w => JSON.parse(w.value).id === later.id) < f.writes.findIndex(w => JSON.parse(w.value).id === earlier.id));
});

test('notes, visits and self-review do not create mathematical check credit', () => {
  const f = fixture();
  const notes = f.notes();
  const checks = f.checkStore();
  const saved = notes.saveNote(map.id, node.id, 'Я объяснил решение своими словами.');
  notes.saveReview(map.id, node.id, node.explain.criteria.map((_, index) => index), saved.id);
  notes.visit(map.id, node.id, node.resources[0].href);
  assert.equal(checks.read().events.length, 0);
  assert.equal(checks.summary()[map.id].started, false);
  assert.equal(checks.summary()[map.id].verified, false);
});

test('foundation and OGE stores isolate event, active and draft keys even with identical route/session IDs', () => {
  const f = fixture();
  const route = foundationCatalog.routes[0];
  // Identical catalogs and generated IDs make the namespace, not differing route IDs, the isolation boundary.
  const options = { now: () => 1762770000000, random: () => 'same-test-id' };
  const foundations = Store.create(foundationCatalog, f.storage, options);
  const oge = Store.create(foundationCatalog, f.storage, { ...options, prefix: OGE_PREFIX });
  const foundationId = foundations.start(route.id, 'check-a');
  const q = C.questions(route, 'check-a')[0];
  foundations.act(foundationId, 'hint', q.id);
  foundations.setDraft(foundationId, q.id, 'foundation draft');
  const ogeId = oge.start(route.id, 'check-a');
  assert.equal(ogeId, foundationId, 'fixture deliberately collides IDs across namespaces');
  assert.equal(oge.get(ogeId).items[0].help, false);
  assert.equal(oge.getDraft(ogeId, q.id), '');
  oge.setDraft(ogeId, q.id, 'oge draft');
  assert.equal(foundations.getDraft(foundationId, q.id), 'foundation draft');
  assert.equal(oge.getDraft(ogeId, q.id), 'oge draft');
  assert.equal(solve(oge, ogeId, route, 'check-a').verified, true);
  assert.equal(foundations.get(foundationId).index, 0);
  assert.equal(foundations.get(foundationId).items[0].help, true);
  for (const prefix of [C.PREFIX, OGE_PREFIX]) {
    assert(f.data.has(prefix + 'active.' + route.id + '.check-a'));
    assert(f.data.has(prefix + 'draft.' + ogeId + '.' + q.id));
    assert([...f.data.keys()].some(key => key.startsWith(prefix + 'event.')));
  }
  assert.equal(Store.create(foundationCatalog, f.storage, options).start(route.id, 'check-a'), foundationId);
  assert.equal(Store.create(foundationCatalog, f.storage, { ...options, prefix: OGE_PREFIX }).get(ogeId).verified, true);
  assertOriginals(f);
});

test('corruption and deletion are confined to their own check namespace and leave notes intact', () => {
  const f = fixture();
  const foundationRoute = foundationCatalog.routes[0];
  const foundations = f.checkStore(C.PREFIX, foundationCatalog);
  const oge = f.checkStore();
  const notes = f.notes();
  const foundationId = foundations.start(foundationRoute.id, 'practice');
  const ogeId = oge.start(map.id, 'check-a');
  notes.saveNote(map.id, node.id, 'Отдельная история объяснений.');
  const badKey = C.PREFIX + 'event.corrupt-foundation';
  f.data.set(badKey, '{broken');
  assert.equal(foundations.read().reliable, false);
  assert.equal(oge.read().reliable, true);
  assert.equal(notes.read().reliable, true);
  for (const key of [...f.data.keys()]) if (key.startsWith(OGE_PREFIX)) f.data.delete(key);
  assert.equal(oge.get(ogeId), null);
  assert.notEqual(foundations.get(foundationId), null);
  assert.equal(notes.latest(map.id, node.id).text, 'Отдельная история объяснений.');
  assert.equal(f.data.get(badKey), '{broken');
  assertOriginals(f);
});

test('the shared store rejects unsupported namespace options before reading or writing storage', () => {
  let accessed = 0;
  const denied = new Proxy({}, { get() { accessed++; throw Error('must not touch storage'); } });
  for (const prefix of ['other.', 'mathExamOge.skillMaps.v2.', Notes.PREFIX, 'mathExamFoundations.routes.v1', '../', {}, 1]) {
    assert.throws(() => Store.create(catalog, denied, { prefix }), /Unknown learning namespace/);
  }
  assert.equal(accessed, 0);
  assert.doesNotThrow(() => Store.create(catalog, null));
  assert.doesNotThrow(() => Store.create(catalog, null, { prefix: OGE_PREFIX }));
});
