import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { answerOffline, listTopics } from '../src/tutor.js';
import { clarificationFor } from '../src/clarification.js';
import { topicHelp, practiceFor, visualFor } from '../public/learning-aids.js';

test('incomplete questions ask for the missing quantity, never judge an attempt', () => {
  for (const [topic, question, expected, corrected] of [
    ['percentages', '15% от', /От какого числа/, '15% от 240'],
    ['percentages', 'Увеличь 240', /На сколько процентов/, 'Увеличь 240 на 15%'],
    ['percentages', '15% числа равны', /Чему равна/, '15% числа равны 36'],
    ['percentages', 'Сколько процентов составляет 30 от', /С каким целым/, 'Сколько процентов составляет 30 от 120?'],
    ['linear-equations', '2x+3=', /справа/, '2x+3=11'],
    ['linear-equations', '=2x+3', /слева/, '11=2x+3'],
    ['linear-equations', '2x+3', /Чему равно/, '2x+3=11'],
    ['fractions', '1 1/2 +', /второе число/, '1 1/2 + 1/2'],
    ['rounding', 'Округли 3,46', /какого разряда/, 'Округли 3,46 до десятых'],
    ['gcd-lcm', 'НОК 12 и', /второе число/, 'НОК 12 и 18'],
  ]) {
    for (const mode of ['hint', 'explain']) {
      const answer = answerOffline({ topic, question, attempt: '999', mode });
      assert.equal(answer.verification, 'needs-teacher'); assert.equal(answer.complete, false);
      assert.match(answer.text, expected); assert.equal(answer.steps.length, 1);
      assert.doesNotMatch(answer.text, /Твоё число подходит|другое число|Ответ:/);
    }
    assert.equal(answerOffline({ topic, question: corrected }).verification, 'deterministic');
  }
});

test('coverage gaps are not mislabeled as missing data; concept guidance and digit guard survive', () => {
  for (const [topic, question] of [['pythagoras', 'Катеты 3 и 4. Найди гипотенузу'], ['linear-equations', 'x*x=9'], ['fractions', '1/0 + 1/2']]) {
    assert.equal(clarificationFor(topic, question), null);
    const answer = answerOffline({ topic, question });
    assert.equal(answer.verification, 'needs-teacher'); assert.match(answer.text, /выбрать пример записи/);
  }
  assert.equal(answerOffline({ topic: 'pythagoras', question: 'Что такое гипотенуза?' }).verification, 'curated-guidance');
  assert.match(answerOffline({ topic: 'linear-equations', question: '1 2x=24' }).text, /цифры одного числа пиши подряд/);
});

test('all curated examples are supported and resource paths exist in this repository', () => {
  for (const topic of listTopics()) {
    const help = topicHelp(topic.id);
    for (const question of help.examples) assert.notEqual(answerOffline({ topic: topic.id, question }).verification, 'needs-teacher', question);
    if (help.resource) {
      const url = new URL(help.resource.url);
      assert.equal(url.origin, 'https://mathexam.space');
      assert(fs.existsSync(new URL(`../..${url.pathname}`, import.meta.url)), url.pathname);
    }
  }
  assert.deepEqual(topicHelp('__proto__'), { examples: [], resource: null });
  const help = topicHelp('fractions'); help.examples.length = 0;
  assert.equal(topicHelp('fractions').examples.length, 2);
});

test('similar exercises preserve the family and accept independently known answers', () => {
  for (const [topic, original, expectedQuestion, firstAnswer, secondAnswer] of [
    ['linear-equations', '3x+5=20', '4x + 3 = 19', '4', '4'],
    ['linear-equations', '2(x+3)=x+9', '3(x + 2) = x + 14', '4', '3'],
    ['linear-equations', '0,5x=2', '0,5x + 1 = 0,25x + 3', '8', '12'],
    ['linear-equations', '2x+1=x+3', '4x + 2 = 2x + 10', '4', '6'],
    ['fractions', '1/2+1/3', '1/3 + 1/6', '1/2', '1/4'],
    ['fractions', '1 1/2+1/2', '1 1/3 + 1/6', '1 1/2', '1 1/2'],
    ['percentages', '15% от 240', '20% от 150', '30', '20'],
    ['percentages', '15% числа равны 36', '20% числа равны 30', '150', '80'],
    ['percentages', '30 от 120 в процентах', 'Сколько процентов составляет 15 от 60?', '25%', '40%'],
    ['percentages', 'Увеличь 240 на 15%', 'Увеличь 150 на 20%', '180', '100'],
    ['percentages', 'Уменьши 240 на 15%', 'Уменьши 150 на 20%', '120', '60'],
    ['gcd-lcm', 'НОД 18 и 24', 'НОД 16 и 24', '8', '6'],
    ['gcd-lcm', 'НОК 12 и 18', 'НОК 8 и 12', '24', '30'],
    ['rounding', 'Округли 9,96 до десятых', 'Округли 7,86 до десятых', '7,9', '3,9'],
  ]) {
    const first = practiceFor(topic, original); assert.equal(first.question, expectedQuestion);
    const second = practiceFor(topic, first.question); assert.notEqual(second.question, first.question);
    for (const [exercise, attempt] of [[first, firstAnswer], [second, secondAnswer]]) {
      const answer = answerOffline({ ...exercise, attempt });
      assert.equal(answer.verification, 'deterministic'); assert.match(answer.text, /Твоё число подходит/, exercise.question);
    }
  }
  assert.equal(practiceFor('pythagoras', 'Катеты 3 и 4'), null);
});

test('bounded visual descriptors represent original rational operands and percentage, not the result', () => {
  const visual = visualFor('fractions', '1 1/2 + 1/3');
  assert.equal(visual.kind, 'fraction-bars'); assert.equal(visual.units, 2);
  assert.deepEqual(visual.operands.map(x => [x.n, x.d]), [[3, 2], [1, 3]]);
  const negative = visualFor('fractions', '-1 1/2 + 1/2');
  assert.equal(negative.kind, 'number-line'); assert.equal(negative.operands[0].n, -3);
  for (const question of ['15% от 240', '15% числа равны 36', 'Уменьши 240 на 15%']) {
    assert.equal(visualFor('percentages', question).percent, 15);
    assert.equal(Object.hasOwn(visualFor('percentages', question), 'answer'), false);
  }
  for (const question of ['1/0+1/2', '1/13+1/2', '4/1+1/2', '1 3/2+1/2', '<img>1/2+1/3']) assert.equal(visualFor('fractions', question), null);
  for (const question of ['120% от 240', '-5% от 10', '30 от 120 в процентах']) assert.equal(visualFor('percentages', question), null);
  assert.equal(visualFor('linear-equations', 'x=2'), null);
});
