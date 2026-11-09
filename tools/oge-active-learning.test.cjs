'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const core = require('../trainers/oge-active-learning.js');
const fixture = { number: 8, title: 'Проверяем понимание', goal: 'Пробуем самостоятельно',
  prediction: { prompt: 'Будет ли результат положительным?', options: [{ text: 'Нет', correct: false, feedback: 'Проверим знак.' }, { text: 'Да', correct: true, feedback: 'Теперь проверим.' }] },
  experimentPrompt: 'Измени a.', controls: [{ key: 'a', label: 'Аргумент a', min: -2, max: 4, step: 1, value: 1 }],
  model: v => ({ html: '<svg viewBox="0 0 100 100"><text x="20" y="50">' + v.a + '</text></svg>', caption: 'a = ' + v.a }),
  concept: { prompt: 'Какое действие допустимо?', options: [{ text: 'Вычесть из обеих частей', correct: true, feedback: 'Да.' }, { text: 'Только из левой', correct: false, feedback: 'Изменились условия равенства.' }, { text: 'Разделить обе части на 2', correct: true, feedback: 'Тоже верно.' }] },
  practice: [{ id: 'first', prompt: 'Найди половину трёх.', answer: [3, 2], hint: 'Раздели три на два.', solution: '3 : 2 = 1,5.', mistakes: [{ answer: [6, 1], message: 'Ты умножил вместо деления.' }] }, { id: 'second', prompt: 'Найди четверть.', answer: [1, 4], hint: 'Одна из четырёх частей.', solution: '1/4 = 0,25.' }, { id: 'third', prompt: 'Найди ноль.', answer: [0, 1], hint: 'Ничего не осталось.', solution: '0.' }]
};
const storage = () => { const values = new Map(); return { get length() { return values.size; }, key: i => [...values.keys()][i], getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), values }; };
let serial = 0;
const ev = (type, more = {}) => ({ id: 'e' + (++serial), at: serial, type, ...more });

test('exact rational input accepts equivalent decimal/fraction records and rejects undefined arithmetic', () => {
  for (const value of ['1,5', '1.50', '3/2', '6 / 4', '0,3/0,2', '+1.5']) assert(core.isEqual(value, [3, 2]), value);
  for (const value of ['−3/2', '-1,50']) assert(core.isEqual(value, [-3, 2]), value);
  for (const value of ['0/5', '-0', '0.0']) assert(core.isEqual(value, [0, 1]));
  for (const value of ['', '0/0', '2/0', 'NaN', 'Infinity', '1e3', '2+3', '1 2', '1/2/3', '0.333333', '<img src=x>']) assert(!core.isEqual(value, [1, 3]), value);
  for (const value of ['0/0', '2/0', '1e3', '2+3', '1 2', '1/2/3', '9999999999999999999999999999']) assert.equal(core.parseRational(value), null);
  assert(core.isEqual('.5', [1, 2])); assert(core.isEqual('3/-2', [-3, 2]));
  assert(!core.isEqual({ n: '0', d: '0' }, [1, 1]));
  assert(!core.isEqual({ n: '1', d: '-2' }, [-1, 2]));
});
test('equivalence is exact across signs and common multiples, without rounding', () => {
  for (let n = -20; n <= 20; n++) for (let d = 1; d <= 20; d++) {
    assert(core.isEqual(`${n * 7}/${d * 7}`, [n, d]));
    assert(!core.isEqual(`${n * 7 + 1}/${d * 7}`, [n, d]));
  }
  assert(!core.isEqual('0.0833333333', [1, 12]));
});
test('help, correction, familiar repetition and first-attempt success are distinct', () => {
  const events = [ev('open', { token: 'a', item: 0 }), ev('hint', { token: 'a' }), ev('answer', { token: 'a', value: '3/2' }),
    ev('open', { token: 'b', item: 1 }), ev('answer', { token: 'b', value: '5' }), ev('answer', { token: 'b', value: '1/4' }),
    ev('open', { token: 'c', item: 2 }), ev('answer', { token: 'c', value: '0/2' }), ev('answer', { token: 'c', value: '0' }),
    ev('open', { token: 'd', item: 0 }), ev('answer', { token: 'd', value: '1,5' })];
  const r = core.reduceRecord(events, fixture);
  assert.deepEqual(r.counts, { independent: 1, helped: 1, corrected: 1, familiar: 1 });
  assert.equal(r.attempts[2].answers.length, 1);
  assert.equal(core.reduceRecord([...events, ev('hint', { token: 'c' })], fixture).counts.independent, 1, 'Later review does not rewrite historical success');
});
test('repeat of the same wrong rational does not add an attempt; new values do', () => {
  const r = core.reduceRecord([ev('open', { token: 'a', item: 0 }), ev('answer', { token: 'a', value: '1/2' }), ev('answer', { token: 'a', value: '2/4' }), ev('answer', { token: 'a', value: '3/2' })], fixture);
  assert.equal(r.attempts[0].answers.length, 2); assert.equal(r.counts.corrected, 1);
});
test('model change clears a previous concept answer and choice', () => {
  const r = core.reduceRecord([ev('pick', { target: 'concept', choice: 0 }), ev('concept', { choice: 0 }), ev('model', { values: { a: -2 } })], fixture);
  assert.equal(r.concept, null); assert.equal(r.picks.concept, undefined); assert.equal(r.values.a, -2);
});
test('repeating the experiment resets its cycle but preserves attempt evidence', () => {
  const r = core.reduceRecord([ev('pick', { target: 'prediction', choice: 1 }), ev('prediction', { choice: 1 }),
    ev('model', { values: { a: -2 } }), ev('pick', { target: 'concept', choice: 0 }), ev('concept', { choice: 0 }),
    ev('open', { token: 'a', item: 0 }), ev('answer', { token: 'a', value: '3/2' }), ev('restart')], fixture);
  assert.equal(r.phase, 'predict'); assert.deepEqual(r.values, { a: 1 }); assert.equal(r.modelChanged, false);
  assert.deepEqual(r.picks, {}); assert.equal(r.prediction, null); assert.equal(r.concept, null); assert.equal(r.counts.independent, 1);
});
test('append-only storage retains concurrent attempts and drafts without touching native results', () => {
  const s = storage(); s.setItem('mathExamCourseProgress.v1', '{"existing":true}');
  const a = core.createStore(s, 8, fixture), b = core.createStore(s, 8, fixture);
  a.add({ type: 'open', token: 'tab-a', item: 0 }); b.add({ type: 'open', token: 'tab-b', item: 1 });
  a.add({ type: 'draft', token: 'tab-a', value: '1,5' }); b.add({ type: 'draft', token: 'tab-b', value: '1/4' });
  a.add({ type: 'hint', token: 'tab-a' }); b.add({ type: 'answer', token: 'tab-b', value: '2/8' });
  a.add({ type: 'answer', token: 'tab-a', value: '3/2' });
  const r = core.createStore(s, 8, fixture).read();
  assert.equal(r.attempts.find(x => x.token === 'tab-a').draft, '3/2');
  assert.equal(r.attempts.find(x => x.token === 'tab-b').draft, '2/8');
  assert.deepEqual(r.counts, { independent: 1, helped: 1, corrected: 0, familiar: 0 });
  assert.equal(s.getItem('mathExamCourseProgress.v1'), '{"existing":true}');
});
test('malformed records are ignored but retained; storage denial keeps explicit memory fallback', () => {
  const s = storage(), key = core.keyPrefix + '8.broken'; s.setItem(key, '{oops');
  const store = core.createStore(s, 8, fixture); assert.deepEqual(store.read().attempts, []); assert.equal(s.getItem(key), '{oops');
  assert.equal(core.validEvent(ev('model', { values: { a: NaN } }), fixture), false);
  assert.equal(core.validEvent(ev('model', { values: { a: 500 } }), fixture), false);
  assert.equal(core.validEvent(ev('open', { item: 99, token: 'x' }), fixture), false);
  s.setItem(core.keyPrefix + '8.future', JSON.stringify({ id: 'future', at: Number.MAX_SAFE_INTEGER, type: 'nav', phase: 'summary' }));
  store.add({ type: 'open', token: 'after-malformed-time', item: 0 });
  assert.equal(store.read().attempts.length, 1, 'Corrupt future timestamps cannot prevent later work');
  let errors = 0; const blocked = { get length() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
  const memory = core.createStore(blocked, 8, fixture, () => errors++);
  memory.add({ type: 'open', token: 'one', item: 0 }); memory.add({ type: 'draft', token: 'one', value: '3/2' });
  assert.equal(memory.read().attempts[0].draft, '3/2'); assert(memory.failed()); assert(errors > 0);
});

const source = fs.readFileSync(path.join(__dirname, '../trainers/oge-active-learning.js'), 'utf8');
function boot(saved = {}, shared = false, lesson = fixture) {
  const dom = new JSDOM('<!doctype html><main><input id="native-answer" value="123"><div id="native-score">7</div></main><script data-oa-task="8">' + source + '</script>', {
    url: 'https://mathexam.test/trainers/test.html', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) { w.OgeActiveLearningData = { lessons: { 8: lesson } }; w.OgeCourseSharedMode = shared; Object.entries(saved).forEach(([k, v]) => w.localStorage.setItem(k, v)); }
  });
  const w = dom.window, d = w.document;
  return { w, d, dom, click: action => { const b = d.querySelector(`[data-oa-action="${action}"]`); assert(b, action); b.click(); },
    pick: (target, choice) => d.querySelector(`[data-oa-target="${target}"][data-oa-choice="${choice}"]`).click(),
    input: value => { const el = d.querySelector('[data-oa-answer]'); el.value = value; el.dispatchEvent(new w.Event('input', { bubbles: true })); },
    snapshot: () => Object.fromEntries(Array.from({ length: w.localStorage.length }, (_, i) => w.localStorage.key(i)).map(k => [k, w.localStorage.getItem(k)])) };
}
test('DOM route requires a prediction and changed model; either equivalent valid concept is accepted', () => {
  for (const choice of [0, 2]) {
    const t = boot(); try {
      assert.equal(t.d.querySelector('.oa-learning').open, false); t.click('begin');
      assert.equal(t.d.querySelector('[data-oa-model]'), null);
      t.pick('prediction', 0); assert.equal(t.d.activeElement.dataset.oaChoice, '0');
      t.click('check-prediction'); assert(t.d.querySelector('[data-oa-model]'));
      assert(t.d.querySelector('[data-oa-action="check-concept"]').disabled);
      const slider = t.d.querySelector('[data-oa-control]'); slider.value = '-1'; slider.dispatchEvent(new t.w.Event('input', { bubbles: true }));
      assert.match(t.d.querySelector('[data-oa-caption]').textContent, /-1/);
      t.pick('concept', 1); t.click('check-concept'); assert.equal(t.d.querySelector('.oa-screen').dataset.oaPhase, 'experiment');
      t.pick('concept', choice); t.click('check-concept'); assert.equal(t.d.querySelector('.oa-screen').dataset.oaPhase, 'practice');
      assert.equal(t.d.querySelector('#native-answer').value, '123'); assert.equal(t.d.querySelector('#native-score').textContent, '7');
    } finally { t.dom.window.close(); }
  }
});
test('DOM retains the draft on reload and requires a different new example after help', () => {
  let t = boot({ 'mathExamCourseProgress.v1': '{"unchanged":7}' }), saved;
  try { t.click('skip'); t.input('3/2'); t.click('hint'); saved = t.snapshot(); } finally { t.dom.window.close(); }
  t = boot(saved);
  try {
    assert.equal(t.d.querySelector('[data-oa-answer]').value, '3/2'); assert(t.d.querySelector('.oa-help'));
    t.click('check-answer'); assert.equal(t.w.OgeActiveLearning.readRecord().counts.helped, 1);
    t.click('next'); assert.equal(t.d.querySelector('[data-oa-answer]').value, ''); assert.equal(t.d.querySelector('.oa-help'), null);
    assert.match(t.d.querySelector('.oa-problem').textContent, /четверть/);
    t.input('2/8'); t.click('check-answer'); t.click('check-answer');
    assert.equal(t.w.OgeActiveLearning.readRecord().counts.independent, 1);
    assert.equal(t.w.localStorage.getItem('mathExamCourseProgress.v1'), '{"unchanged":7}');
  } finally { t.dom.window.close(); }
});
test('DOM rejects zero denominator without spending an attempt and gives targeted feedback', () => {
  const t = boot(); try {
    t.click('skip'); t.input('1/0'); t.click('check-answer');
    assert.equal(t.w.OgeActiveLearning.readRecord().attempts[0].answers.length, 0);
    assert.equal(t.d.querySelector('[data-oa-answer]').value, '1/0');
    t.input('6'); t.click('check-answer'); assert.match(t.d.querySelector('[data-oa-feedback]').textContent, /умножил/);
    assert(t.d.activeElement.matches('[data-oa-answer]'));
    t.input('5'); t.click('check-answer'); t.click('solution'); t.input('3/2'); t.click('check-answer');
    assert.equal(t.w.OgeActiveLearning.readRecord().counts.helped, 1);
  } finally { t.dom.window.close(); }
});
test('exhausted practice is labelled familiar rather than promising another unseen problem', () => {
  const s = storage(), store = core.createStore(s, 8, fixture);
  fixture.practice.forEach((item, i) => { store.add({ type: 'open', token: 't' + i, item: i }); store.add({ type: 'hint', token: 't' + i }); store.add({ type: 'answer', token: 't' + i, value: item.answer.join('/') }); });
  store.add({ type: 'nav', phase: 'summary' });
  const t = boot(Object.fromEntries(s.values));
  try { assert.match(t.d.querySelector('.oa-screen').textContent, /Все условия этого мини-урока уже знакомы/); assert.match(t.d.querySelector('[data-oa-action="next"]').textContent, /знакомый/); } finally { t.dom.window.close(); }
});
test('shared mode does not mount or read/write new local lesson evidence', () => {
  const t = boot({ 'mathExamCourseProgress.v1': '{"private":1}' }, true);
  try { assert.equal(t.d.querySelector('.oa-learning'), null); assert.equal(t.w.OgeActiveLearning, undefined); assert.deepEqual(t.snapshot(), { 'mathExamCourseProgress.v1': '{"private":1}' }); } finally { t.dom.window.close(); }
});

test('root operation select uses meaningful labels and updates the real zero-domain model', () => {
  const lesson = require('../trainers/oge-active-learning-data.js').lessons[8];
  const t = boot({}, false, lesson);
  try {
    t.click('begin'); t.pick('prediction', 0); t.click('check-prediction');
    const select = t.d.querySelector('select[data-oa-control="op"]');
    assert(select); assert.deepEqual([...select.options].map(o => o.textContent), ['Произведение', 'Частное']);
    for (const [key, value] of [['a', '0'], ['b', '0'], ['op', '1']]) {
      const control = t.d.querySelector('[data-oa-control="' + key + '"]');
      control.value = value; control.dispatchEvent(new t.w.Event('input', { bubbles: true }));
    }
    assert.equal(t.w.OgeActiveLearning.readRecord().values.op, 1);
    assert.match(t.d.querySelector('[data-oa-caption]').textContent, /ноль|нул/);
    assert.equal(t.d.querySelector('[data-oa-output="op"]'), null);
  } finally { t.dom.window.close(); }
});
