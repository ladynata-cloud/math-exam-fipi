'use strict';
// Transport-only fixtures for continuation semantics. Real authored content and
// model rendering are covered by their own content/DOM/browser gates.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const math = require('../school/peterson6/math.js');
require('../school/peterson6/models.js');
const legacyModels = global.PetersonModels;
const adapter = require('../school/peterson6/board-session.js');
const original = ['logic', 'arithmetic', 'percent'].flatMap(name => JSON.parse(readFileSync(resolve(__dirname, '../school/peterson6/' + name + '.json'))));
const continuation = Array.from({ length: 44 }, (_, i) => {
  const id = 'p' + String(i + 15).padStart(2, '0');
  return { id, model: 'continuation', tasks: [
    { id: id + '-manual', kind: 'manual', prompt: 'Объясни ход решения.', answer: '', steps: [{ kind: 'instruction', prompt: 'Запиши объяснение.' }] },
    { id: id + '-number', kind: 'number', prompt: 'Вычисли 1 + 2.', answer: '3', steps: [{ kind: 'instruction', prompt: 'Прочитай выражение.' }, { kind: 'number', prompt: 'Второе слагаемое?', answer: '2' }] }
  ] };
});
const lessons = [...original, ...continuation];
const models = { validateBoardState(lesson, value, task) {
  if (lesson.model !== 'continuation') return legacyModels.validateBoardState(lesson, value, task);
  return !!value && Object.keys(value).sort().join(',') === 'kind,lessonId,stage,taskId,values' && value.lessonId === lesson.id && value.kind === 'continuation' && value.taskId === task.id && Array.isArray(value.values) && value.values.length === 2 && value.values.every(x => Number.isInteger(x) && x >= 0 && x <= 9) && Number.isInteger(value.stage) && value.stage >= 0 && value.stage <= 2;
} };
const session = adapter.create({ lessons, math, models });
const copy = value => JSON.parse(JSON.stringify(value));
const fresh = () => ({ value: '', values: [], step: 0, guided: false, assisted: false, hint: false, stepHints: {}, reveals: {}, attempts: 0, correct: false, independent: false, note: '', feedback: '', signature: '', repeated: false, completion: null });
const blank = () => ({ version: 1, tasks: {}, practice: {}, last: null, origin: null, models: {} });
const numberView = () => ({ part: 1, draft: '', submitted: null });
const model = task => ({ lessonId: task.id.split('-')[0], kind: 'continuation', taskId: task.id, values: [1, 2], stage: 0 });
const [manual, numeric] = continuation[0].tasks;
function snapshot(state, task = numeric) {
  const lessonId = task.id.split('-')[0], lesson = lessons.find(l => l.id === lessonId), route = '#lesson/' + lessonId + '/' + lesson.tasks.indexOf(task);
  state.last = { hash: route }; if (!state.models[task.id]) state.models[task.id] = model(task);
  return { route, work: session.pack(state), view: { model: copy(state.models[task.id]), details: [false, true, false, false], stepFeedback: '', number: numberView() } };
}
function home(state = blank()) { return { route: '#home', work: session.pack(state), view: { model: null, details: [false], stepFeedback: '', number: numberView() } }; }

test('v2 admits all 58 known contiguous lessons and check/diagnostic routes only', () => {
  for (const l of lessons) for (let i = 0; i < l.tasks.length; i++) assert(session.validRoute('#lesson/' + l.id + '/' + i));
  assert(session.validRoute('#check/fraction-add/1')); assert(session.validRoute('#diagnostic'));
  for (const bad of ['#lesson/p59/0', '#lesson/p15/2', '#check/unknown/1', '#check/fraction-add/0', '#diagnostic/extra']) assert(!session.validRoute(bad), bad);
  assert.throws(() => adapter.create({ lessons: lessons.slice(1), math, models }), /Incomplete/);
  assert.throws(() => adapter.create({ lessons: [...lessons, { id: 'p59', tasks: [] }], math, models }), /Incomplete/);
});

test('instruction acknowledgements and checked steps roundtrip without new tuple fields', () => {
  const state = blank(); state.tasks[numeric.id] = { ...fresh(), value: '3', values: ['done', '2'], step: 2, guided: true, assisted: true, attempts: 1, correct: true, completion: { attempts: 1, assisted: true, independent: false } };
  const value = snapshot(state); assert(session.validateState(value)); assert.equal(value.work.tasks[numeric.id].length, 10);
  const restored = session.unpack(value.work); assert.deepEqual(restored.tasks[numeric.id].values, ['done', '2']); assert.deepEqual(session.pack(restored), value.work);
  for (const change of [v => { v.work.tasks[numeric.id][1][0] = 'read'; }, v => { v.work.tasks[numeric.id][1][1] = '4'; }, v => { v.work.tasks[numeric.id][2] = 3; }]) { const bad = copy(value); change(bad); assert(!session.validateState(bad)); }
});

test('manual recording preserves note and always rejects automatic success or independent credit', () => {
  const state = blank(); state.tasks[manual.id] = { ...fresh(), value: 'recorded', note: 'Рассуждение записано в тетради.', feedback: 'Записано для проверки.', values: ['done'], step: 1, guided: true, assisted: true };
  const value = snapshot(state, manual); assert(session.validateState(value)); const restored = session.unpack(value.work).tasks[manual.id];
  assert.equal(restored.correct, false); assert.equal(restored.independent, false); assert.equal(restored.completion, null); assert.equal(restored.value, 'recorded'); assert.equal(restored.note, state.tasks[manual.id].note);
  for (const change of [v => { v.work.tasks[manual.id][0] = 'correct'; }, v => { v.work.tasks[manual.id][7] = ' '; }, v => { v.work.tasks[manual.id][3] |= 8; }, v => { v.work.tasks[manual.id][6] = 1; }]) { const bad = copy(value); change(bad); assert(!session.validateState(bad)); }
  state.tasks[manual.id].independent = true; assert.throws(() => session.pack(state), /Invalid/);
});

test('task-local model cache preserves multiple figures and must match the active view semantically', () => {
  const state = blank(); state.models[manual.id] = model(manual); state.models[numeric.id] = { ...model(numeric), stage: 2, values: [3, 4] };
  const value = snapshot(state); assert(session.validateState(value)); const restored = session.unpack(value.work); assert.deepEqual(restored.models, state.models);
  restored.models[manual.id].values[0] = 8; assert.equal(value.work.models[manual.id].values[0], 1, 'cache copy is detached');
  const reordered = copy(value); const m = reordered.view.model; reordered.view.model = { values: m.values, taskId: m.taskId, stage: m.stage, kind: m.kind, lessonId: m.lessonId }; assert(session.validateState(reordered), 'object key order is not model semantics');
  for (const change of [v => { v.view.model.stage = 1; }, v => { delete v.work.models[numeric.id]; }, v => { v.work.models[numeric.id].taskId = manual.id; }, v => { v.work.models.unknown = model(numeric); }, v => { v.work.models['practice:fraction-add:1:1'] = model(numeric); }]) { const bad = copy(value); change(bad); assert(!session.validateState(bad)); }
});

test('part-aware source lookup enforces 497/589/778 and rejects v1 network shapes', () => {
  for (const [part, max] of [[1, 497], [2, 589], [3, 778]]) { const value = home(); value.view.number = { part, draft: String(max), submitted: max }; assert(session.validateState(value)); value.view.number.submitted++; assert(!session.validateState(value)); }
  const oldWork = home(); delete oldWork.work.models; assert(!session.validateState(oldWork));
  const oldNumber = home(); delete oldNumber.view.number.part; assert(!session.validateState(oldNumber));
  const badPart = home(); badPart.view.number.part = 4; assert(!session.validateState(badPart));
});

test('fresh check tasks are separately identified and forbid every form of help', () => {
  const id = 'check:fraction-add:1:1', task = session.resolveTask(id), state = blank(); assert(task); assert.equal(task.id, id);
  state.practice['fraction-add:1'] = { seed: 1 }; state.tasks[id] = { ...fresh(), value: task.answer, correct: true, attempts: 1, independent: true, completion: { attempts: 1, assisted: false, independent: true } }; state.last = { hash: '#check/fraction-add/1' };
  const value = { route: state.last.hash, work: session.pack(state), view: { model: null, details: [false], stepFeedback: '', number: numberView() } }; assert(session.validateState(value));
  const restored = session.unpack(value.work); assert.equal(restored.tasks[id].independent, false); assert.equal(restored.tasks[id].completion.independent, false);
  for (const change of [v => { v.work.tasks[id][3] |= 1; }, v => { v.work.tasks[id][3] |= 2; }, v => { v.work.tasks[id][3] |= 4; }, v => { v.work.tasks[id][1] = ['']; }, v => { v.work.tasks[id][4] = [0]; }, v => { v.work.tasks[id][5] = [0]; }, v => { v.work.tasks[id][9] = true; }, v => { v.work.practice['fraction-add:1'] = 2; }]) { const bad = copy(value); change(bad); assert(!session.validateState(bad)); }
  const retry = copy(value); retry.work.tasks[id][6] = 2; assert(session.validateState(retry), 'attempt count preserved without granting independence');
});

test('checks cannot reuse a condition already visited in practice; diagnostic is a stateless route', () => {
  const state = blank(), practiceId = 'practice:fraction-add:1:1', checkId = 'check:fraction-add:1:1';
  state.practice['fraction-add:1'] = { seed: 1 }; state.tasks[practiceId] = fresh(); state.tasks[checkId] = fresh();
  assert.throws(() => session.pack(state), /Invalid/, 'same condition across practice/check is not fresh');
  state.tasks[checkId].repeated = true; assert.throws(() => session.pack(state), /Invalid/, 'check cannot claim repeated credit');
  delete state.tasks[checkId]; const value = home(state); value.route = '#diagnostic'; value.view.details = []; assert(session.validateState(value));
  value.view.details = [true]; assert(!session.validateState(value));
});

test('visible model or theory cannot arrive as unassisted unfinished work',()=>{
 for(const index of [2,3]){
  const value=snapshot(blank());value.view.details[index]=true;assert.equal(session.validateState(value),false);
  const helped=blank();helped.tasks[numeric.id]={...fresh(),assisted:true};const open=snapshot(helped);open.view.details[index]=true;assert(session.validateState(open));
  const done=blank();done.tasks[numeric.id]={...fresh(),value:'3',attempts:1,correct:true,completion:{attempts:1,assisted:false,independent:false}};const review=snapshot(done);review.view.details[index]=true;assert(session.validateState(review),'post-success viewing preserves original completion');
 }
});
