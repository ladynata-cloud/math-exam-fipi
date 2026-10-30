'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createDialogueCache } = require('../assistant-dialogue');
const answer = { title: 'Подсказка', text: 'Проверь разряд.', steps: ['Найди сотые.'], check: 'Что получилось?' };

test('conversation memory expires, evicts at a finite cap, and never accepts a mismatched binding', () => {
  let now = 1000;
  const cache = createDialogueCache(() => now);
  assert.equal(cache.remember('first', 'account-login-task', '0,1 + 0,2', answer), true);
  assert.throws(() => cache.prepare('first', 'other-account', 'Почему?'), { code: 'LEARNING_ASSISTANT_DIALOGUE_CONTEXT' });
  const prepared = cache.prepare('first', 'account-login-task', 'Почему?');
  prepared.turns[0].answer.text = 'changed by caller';
  assert.equal(cache.prepare('first', 'account-login-task', 'Почему?').turns[0].answer.text, answer.text);
  now += 15 * 60 * 1000;
  assert.throws(() => cache.prepare('first', 'account-login-task', 'Почему?'), { code: 'LEARNING_ASSISTANT_DIALOGUE_EXPIRED' });
  for (let i = 0; i < 61; i++) cache.remember('answer-' + i, 'binding', 'Вопрос', answer);
  assert.throws(() => cache.prepare('answer-0', 'binding', 'Почему?'), { code: 'LEARNING_ASSISTANT_DIALOGUE_EXPIRED' });
  assert.equal(cache.prepare('answer-1', 'binding', 'Почему?').turns.length, 1);
});

test('only latest successful answer continues a chain; three pairs maximum and oldest pairs trim by UTF-8 bytes', () => {
  const cache = createDialogueCache();
  let parent;
  for (let i = 0; i < 5; i++) {
    const id = 'answer-' + i;
    assert.equal(cache.remember(id, 'binding', 'Вопрос ' + i, answer, parent), true);
    if (parent) assert.throws(() => cache.prepare(parent, 'binding', 'Почему?'), { code: 'LEARNING_ASSISTANT_DIALOGUE_EXPIRED' });
    parent = id;
  }
  assert.deepEqual(cache.prepare(parent, 'binding', 'Почему?').turns.map(turn => turn.question), ['Вопрос 2', 'Вопрос 3', 'Вопрос 4']);
  const bigAnswer = { ...answer, text: 'ы'.repeat(1000) };
  assert.equal(cache.remember('big', 'binding', 'Другой вопрос', bigAnswer, parent), true);
  const bounded = cache.prepare('big', 'binding', 'Почему?');
  assert.ok(Buffer.byteLength(JSON.stringify(bounded), 'utf8') <= 3500);
  assert.equal(bounded.turns.at(-1).answer.text, bigAnswer.text);
  assert.equal(cache.remember('huge', 'binding', 'Вопрос', { ...answer, text: 'ы'.repeat(2000) }), false);
  assert.throws(() => cache.prepare('huge', 'binding', 'Почему?'), { code: 'LEARNING_ASSISTANT_DIALOGUE_EXPIRED' });
});

test('one oversized pair plus the new question is rejected rather than truncated, and expiry cannot be revived', () => {
  let now = 0;
  const cache = createDialogueCache(() => now);
  assert.equal(cache.remember('large', 'binding', 'Вопрос', { ...answer, text: 'ы'.repeat(1500) }), true);
  assert.throws(() => cache.prepare('large', 'binding', 'я'.repeat(400)), { code: 'LEARNING_ASSISTANT_DIALOGUE_CONTEXT' });
  now = 15 * 60 * 1000;
  assert.equal(cache.remember('after-expiry', 'binding', 'Вопрос', answer, 'large'), false);
});

test('follow-up near expiry cannot extend the original conversation retention window', () => {
  let now = 0;
  const cache = createDialogueCache(() => now);
  assert.equal(cache.remember('root', 'binding', 'Исходная задача', answer), true);
  now = 14 * 60 * 1000;
  assert.equal(cache.remember('child', 'binding', 'Почему?', answer, 'root'), true);
  assert.equal(cache.prepare('child', 'binding', 'Уточни').turns[0].question, 'Исходная задача');
  now += 30 * 1000;
  assert.equal(cache.remember('grandchild', 'binding', 'Уточни', answer, 'child'), true);
  now = 15 * 60 * 1000;
  assert.throws(() => cache.prepare('grandchild', 'binding', 'Ещё вопрос'), { code: 'LEARNING_ASSISTANT_DIALOGUE_EXPIRED' });
  assert.equal(cache.remember('renewed', 'binding', 'Ещё вопрос', answer, 'grandchild'), false);
});
