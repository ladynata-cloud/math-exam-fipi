'use strict';
// Independent offline review probes; no browser, network, model or real storage.
const test = require('node:test');
const assert = require('node:assert/strict');
const {reply, preferences} = require('../../assets/assistant/division-dialogue.js');

test('1710 truthful digit conversations preserve the multiplication/comparison/group sequence', () => {
  let checked = 0;
  for (let divisor = 2; divisor <= 20; divisor++) {
    for (let quotient = 1; quotient <= 9; quotient++) {
      for (let attempt = 0; attempt <= 9; attempt++) {
        const context = {step:'digit', divisor, partial:quotient * divisor};
        let turn = reply('Пробую ' + attempt, context);
        assert.equal(turn.intent, 'digit-multiply');
        turn = reply(String(attempt * divisor), context, turn);
        assert.equal(turn.intent, 'digit-compare');
        turn = reply(attempt > quotient ? 'больше' : attempt === quotient ? 'равно' : 'меньше', context, turn);
        if (attempt > quotient) {
          assert.match(turn.text, /меньше своей пробы/);
        } else if (attempt < 9) {
          assert.equal(turn.intent, 'digit-extra');
          turn = reply(String((attempt + 1) * divisor), context, turn);
          assert.match(turn.text, attempt < quotient ? /следующую цифру/ : /проверенную цифру/);
        } else {
          assert.match(turn.text, /проверенную цифру/);
        }
        checked++;
      }
    }
  }
  assert.equal(checked, 1710);
});

test('false comparison claims are checked instead of advancing the learner', () => {
  const context = {step:'digit', divisor:3, partial:12};
  let turn = reply('Пробую 3', context);
  turn = reply('9', context, turn);
  for (const claim of ['равно', 'больше', 'не меньше', 'не помещается']) {
    const next = reply(claim, context, turn);
    assert.equal(next.intent, 'digit-compare', claim);
    assert.match(next.text, /Перепроверь сравнение/, claim);
  }
});

test('inclusive comparison phrases keep their mathematical disjunction', () => {
  const context = {step:'digit', divisor:3, partial:12};
  for (const attempt of [3, 4, 8]) {
    let turn = reply('Пробую ' + attempt, context);
    turn = reply(String(3 * attempt), context, turn);
    for (const [claim, correct] of [['меньше или равно', attempt <= 4], ['больше или равно', attempt >= 4],
      ['не (меньше или равно)', attempt > 4], ['не (больше или равно)', attempt < 4]]) {
      const next = reply(claim, context, turn);
      if (correct) assert.doesNotMatch(next.text, /Перепроверь сравнение/, `${attempt}: ${claim}`);
      else assert.match(next.text, /Перепроверь сравнение/, `${attempt}: ${claim}`);
    }
    for (const claim of ['не меньше или равно', 'не больше или равно']) {
      assert.equal(reply(claim, context, turn).intent, 'digit-compare', `ambiguous ${claim}`);
    }
  }
});

test('a conversational probe supersedes an unchanged older native attempt', () => {
  const context = {step:'digit', divisor:3, partial:12, attempt:8};
  const first = reply('Пробую 3', context);
  const second = reply('9', context, {...first, nativeAttempt:8});
  assert.equal(second.attempt, 3);
  assert.equal(second.intent, 'digit-compare');
  assert.match(second.text, /9 с 12/);
});

test('repeated simpler follow-ups remain explanations of the same operation', () => {
  for (const step of ['start','count','digit','product','subtract','remainder-check',
    'bring','partial','comma','answer','final-remainder','verify',
    'shift-count','shift-factor','shift-divisor','shift-dividend']) {
    const context = {step, divisor:3, partial:12, dividend:'12', originalDivisor:'0,3'};
    let turn = reply('Почему так?', context);
    assert.equal(turn.intent, 'why', step);
    for (let index = 0; index < 3; index++) {
      turn = reply('Ещё проще', context, turn);
      assert.equal(turn.intent, 'why-simple', step);
    }
  }
});

test('opt-in memory stores only an allowed category and clears independently', () => {
  const records = new Map();
  const storage = {getItem:key => records.get(key) ?? null,
    setItem:(key,value) => records.set(key,value), removeItem:key => records.delete(key)};
  const memory = preferences(storage);
  memory.remember('why');
  assert.equal(records.size, 0);
  memory.enable(true);
  memory.remember('why-simple');
  memory.remember('raw question 12345');
  assert.equal(records.size, 1);
  const saved = JSON.parse([...records.values()][0]);
  assert.deepEqual(saved, {version:1, enabled:true, intent:'why-simple'});
  assert.equal(preferences(storage).read().intent, 'why-simple');
  memory.clear();
  assert.equal(records.size, 0);
  assert.equal(memory.read().enabled, false);
});

test('unavailable or corrupt memory does not prevent a local explanation', () => {
  const blocked = preferences({getItem() {throw new Error('blocked');},
    setItem() {throw new Error('blocked');}, removeItem() {throw new Error('blocked');}});
  assert.doesNotThrow(() => blocked.enable(true));
  assert.equal(blocked.read().enabled, false);
  assert.equal(blocked.read().available, false);
  const corrupt = preferences({getItem:() => '{broken', setItem() {}, removeItem() {}});
  assert.equal(corrupt.read().enabled, false);
  assert.equal(reply('Почему?', {step:'subtract'}, corrupt.read()).intent, 'why');
});
