'use strict';

const { test, before } = require('node:test');
const assert = require('node:assert/strict');

const trainerPath = 'trainers/oge-task9-equations.html';
const bracketCounts = new Map([
  ['linear-transfer', 0],
  ['linear-one-bracket', 1],
  ['linear-two-brackets', 2],
]);
const linearKinds = [...bracketCounts.keys()];
const quadraticKinds = ['quad-factor-x', 'quad-monic', 'quad-nonmonic', 'quad-square'];
const examKinds = [...linearKinds, ...quadraticKinds].sort();
let math;
let oracle;

before(async () => {
  math = await import('./oge-algebra-contract.lib.mjs');
  oracle = await import('./oge-algebra-contract.t9.mjs');
});

test('exam bank covers the seven prototype shapes with varied divisors and independently verified answers', () => {
  const trainer = math.loadTrainer(trainerPath);
  const bank = trainer.run('EXAM_BANK');
  assert.deepEqual([...new Set(bank.map(task => task.examKind))].sort(), examKinds);
  assert.equal(new Set(bank.map(task => task.id)).size, bank.length);
  assert.deepEqual([...new Set(bank.map(task => task.src))].sort(), ['analog', 'fipi', 'fipi-demo']);
  assert.equal(bank[0].id, 'exam-demo-2027');
  assert.equal(bank[0].exp, '-32');
  assert.equal(bank.find(task => task.id === 'exam-demo-2026').exp, '0,5');

  const getNorm = trainer.run('taskNorm');
  const getInstruction = trainer.run('taskInstrHTML');
  const checkFinal = trainer.run('checkFinal');
  const getEquation = trainer.run('taskEqnHTML');
  const divisors = [];
  const linearCoefficients = [];
  const equationPrompts = new Set();

  for (const task of bank) {
    const result = oracle.answer(task);
    const context = task.id + ' ' + task.examKind;
    assert.equal(result.bad, undefined, context);
    assert.match(task.exp, /^-?\d+(,\d+)?$/, context + ' has an exam-compatible answer');
    assert.ok(math.eq(math.parseNum(task.exp), result.key), context + ' matches independent exact math');
    assert.equal(checkFinal(task, task.exp).ok, true, context + ' accepts the expected answer');
    const equation = getEquation(task);
    const norm = getNorm(task);
    assert.equal(/\bclass="frac"/.test(equation), false, context + ' has no fractions to clear');
    const prompt = getInstruction(task);
    assert.equal(equationPrompts.has(prompt), false, context + ' does not repeat an exam prompt');
    equationPrompts.add(prompt);

    if (linearKinds.includes(task.examKind)) {
      assert.equal(norm.A.n, 0n, context);
      assert.equal(result.roots.length, 1, context);
      assert.equal(task.ask, null, context);
      const brackets = [...task.p.Lt, ...task.p.Rt].filter(term => term.br).length;
      assert.equal(brackets, bracketCounts.get(task.examKind), context);
      const coefficient = Number(norm.B.n) / Number(norm.B.d);
      linearCoefficients.push(coefficient);
      divisors.push(Math.abs(coefficient));
    } else {
      assert.equal(result.roots.length, 2, context);
      assert.match(task.ask, /^(min|max)$/, context);
      assert.match(prompt, task.ask === 'min' ? /меньший/ : /больший/, context);
      const otherRoot = result.roots[task.ask === 'min' ? 1 : 0];
      assert.equal(checkFinal(task, math.str(otherRoot)).ok, false, context + ' rejects the other root');
    }
  }

  assert.ok(new Set(divisors).size >= 5, 'at least five absolute coefficients after collecting linear terms');
  assert.ok(divisors.includes(1), 'some problems require no division');
  assert.ok(divisors.filter(value => value === 2).length <= divisors.length / 4, 'division by two stays occasional');
  assert.ok(linearCoefficients.some(value => value < 0), 'negative coefficients also occur');
});

test('generated two-bracket practice varies both the bracket multipliers and the resulting divisors', () => {
  const trainer = math.loadTrainer(trainerPath);
  const tasks = trainer.run('RNG=mkRng(20261110); Array.from({length:200},()=>genTask("g_lb"))');
  const getNorm = trainer.run('taskNorm');
  const multipliers = new Set();
  const divisors = new Set();
  for (const task of tasks) {
    const brackets = [...task.p.Lt, ...task.p.Rt].filter(term => term.br);
    if (brackets.length !== 2) continue;
    multipliers.add(brackets.map(term => math.str(term.br.k)).join(':'));
    const { B } = getNorm(task);
    divisors.add(Math.abs(Number(B.n) / Number(B.d)));
  }
  assert.ok(multipliers.size >= 4, 'two-bracket practice is not restricted to 3 and −2');
  assert.ok(divisors.size >= 4, 'brackets lead to different linear equations');
});

test('source disclosure distinguishes official demos, indirect bank verification and authored analogues', () => {
  const trainer = math.loadTrainer(trainerPath);
  const bank = trainer.run('EXAM_BANK');
  const sourceHTML = trainer.run('taskSourceHTML');
  assert.equal(bank.filter(task => task.src === 'fipi').length, 17);
  assert.equal(bank.filter(task => task.src === 'fipi-demo').length, 2);
  assert.equal(bank.filter(task => task.src === 'analog').length, 8);
  assert.equal(bank.find(task => task.id === 'exam-demo-2027').tag, 'Проект демоверсии ФИПИ 2027');
  for (const task of bank) {
    const text = sourceHTML(task);
    if (task.src === 'fipi') {
      assert.match(text, /навигаторе ФИПИ/);
      assert.match(text, /Прямая сверка карточки официального банка недоступна/);
      assert.match(text, /100ballnik\.com/);
      assert.match(text, /sdamgia\.online/);
    } else if (task.src === 'analog') {
      assert.match(text, /Авторское задание MathExam/);
      assert.match(text, /не является заданием ФИПИ/);
    } else {
      const year = task.id.slice(-4);
      assert.ok(text.includes('/' + year + '/ma_9_' + year + '.zip'));
    }
  }
  assert.equal(sourceHTML(trainer.run('BANK.find(t=>!t.examKind)')), '');
});

test('each exam quiz draws five linear and five quadratic equations with all shapes and both root directions', () => {
  const trainer = math.loadTrainer(trainerPath);
  const bank = new Set(trainer.run('EXAM_BANK'));
  const quizzes = trainer.run('RNG=mkRng(20261110); Array.from({length:100},()=>buildQuiz())');
  for (const quiz of quizzes) {
    assert.equal(quiz.length, 10);
    assert.ok(quiz.every(task => bank.has(task)));
    assert.equal(new Set(quiz.map(task => task.id)).size, 10);
    assert.equal(quiz.filter(task => linearKinds.includes(task.examKind)).length, 5);
    assert.equal(quiz.filter(task => quadraticKinds.includes(task.examKind)).length, 5);
    assert.deepEqual([...new Set(quiz.map(task => task.examKind))].sort(), examKinds);
    assert.deepEqual([...new Set(quiz.map(task => task.ask).filter(Boolean))].sort(), ['max', 'min']);
  }
});
