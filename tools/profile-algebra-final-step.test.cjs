'use strict';

// Regression gate for a learner who can do OGE arithmetic but stops at an
// intermediate trigonometric/algebraic quantity. Oracles come from task
// parameters and mathematical identities, not from task.answer or a step key.
const assert = require('node:assert/strict');
const lessons = require('../ege-profil/start/algebra-data.js');
const checker = require('../ege-profil/start/checks.js');
const rad = degrees => degrees * Math.PI / 180;
const normalize = degrees => ((degrees % 360) + 360) % 360;

function problem(meta) {
  const m = meta;
  switch (m.kind) {
    case 'angle':
      return { solution: m.degrees / 180, prompt: /исходному углу.*kπ|kπ.*исходн/s,
        input: `${m.degrees}/180`, mistakes: [m.degrees / 90, normalize(m.degrees) / 180, m.degrees * Math.PI / 180], recovery: /исход|предыдущ/ };
    case 'coordinates':
      return { solution: (m.fn === 'sin' ? m.yNum : m.xNum) / m.den, prompt: /числовое значение (sin|cos)/,
        input: `${m.fn === 'sin' ? m.yNum : m.xNum}/${m.den}`,
        mistakes: [(m.fn === 'sin' ? m.xNum : m.yNum) / m.den, m.fn === 'sin' ? m.yNum : m.xNum], recovery: /координат.*знаменатель/s };
    case 'special': {
      const v = Math[m.fn](rad(m.degrees));
      return { solution: m.scale * v, prompt: /всё выражение/,
        input: String(Math.round(m.scale * v * 1e10) / 1e10),
        mistakes: [v, -m.scale * v, Math.sign(v)], recovery: /[Уу]множ/ };
    }
    case 'tangent':
      return { solution: m.yNum / m.xNum, prompt: /tg α.*:/,
        input: `${m.yNum}/${m.xNum}`, mistakes: [m.xNum / m.yNum, m.yNum / m.den, Math.sign(m.yNum / m.xNum)], recovery: /вторую.*первую/s };
    case 'exponential':
      return { solution: (m.power - m.b) / m.a, prompt: /Найдите x/,
        input: `(${m.power}-(${m.b}))/(${m.a})`, mistakes: [m.power - m.b, (m.power + m.b) / m.a, m.power], recovery: /[Рр]аздел/ };
    case 'logarithmic': {
      const arg = m.base ** m.power;
      return { solution: (arg - m.b) / m.a, prompt: /ОДЗ.*ответ.*x/s,
        input: `(${m.base}^(${m.power})-(${m.b}))/(${m.a})`, mistakes: [arg, -m.b / m.a, (arg + m.b) / m.a], recovery: /аргумент.*вместо x/s };
    }
    case 'recover-cosine': {
      const sin = m.sinNum / m.den;
      const magnitude = Math.sqrt(1 - sin * sin), sign = [1, 4].includes(m.quadrant) ? 1 : -1;
      return { solution: sign * magnitude, prompt: /модуль и знак.*cos α/s,
        input: `${sign}*sqrt(1-(${m.sinNum}/${m.den})^2)`, mistakes: [1 - sin * sin, sign, -sign * magnitude], recovery: /корень.*четверть/s };
    }
    case 'double-angle':
      return { solution: m.coefficient * Math.sin(rad(2 * m.angle)) / (Math.sin(rad(m.angle)) * Math.sin(rad(90 - m.angle))), prompt: /значение всего выражения/,
        input: String(m.coefficient * 2), mistakes: [2, m.coefficient, 1, 0], recovery: /коэффициент/s };
    default: throw Error(`Missing independent solver for ${m.kind}`);
  }
}

const counts = new Map();
let finalChecks = 0, rejectedMistakes = 0, rootInputChecks = 0;
for (const lesson of lessons) {
  for (const task of lesson.tasks) {
    const label = `${lesson.id}/${task.id}`;
    counts.set(task.meta.kind, (counts.get(task.meta.kind) || 0) + 1);
    const oracle = problem(task.meta), final = task.steps.at(-1);
    assert.equal(task.steps.filter(s => s.role === 'final').length, 1, `${label}: one explicit final step`);
    assert.equal(final.role, 'final', `${label}: final numeric input must be last`);
    assert(!final.choices, `${label}: learner enters the result rather than guessing an option`);
    assert.match(final.prompt, oracle.prompt, `${label}: final question asks for the original quantity`);
    assert.match(final.retry, oracle.recovery, `${label}: retry addresses the stopping-point misconception`);
    assert(checker.check(final.answer, oracle.input), `${label}: realistic symbolic/fraction entry succeeds`);
    assert(Math.abs(final.answer - oracle.solution) < 1e-8, `${label}: independent expression agrees with the final step`);
    assert(Math.abs(task.answer - oracle.solution) < 1e-8, `${label}: independent answer agrees with the problem`);
    assert(!checker.check(final.answer, ''), `${label}: blank answer does not finish`);
    for (const wrong of oracle.mistakes) {
      // Some intermediates accidentally equal the result in an individual
      // variant. They are mathematically correct there, so do not reject them.
      if (Math.abs(wrong - oracle.solution) < 1e-7) continue;
      assert(!checker.check(final.answer, String(wrong)), `${label}: intermediate ${wrong} cannot finish the task`);
      rejectedMistakes++;
    }

    if (task.meta.kind === 'special') {
      const table = task.steps.at(-2), m = task.meta;
      const a = Math.abs(Math[m.fn](rad(m.degrees)));
      const exactEntry = Math.abs(a - 0.5) < 1e-9 ? '1/2' : Math.abs(a - Math.SQRT1_2) < 1e-9 ? '√2/2' : 'sqrt(3)/2';
      assert.match(table.prompt, /по таблице/, `${label}: table lookup is practised before multiplication`);
      assert(checker.check(table.answer, exactEntry), `${label}: exact radicals can be entered, no decimal guessing`);
      rootInputChecks++;
    }
    if (task.meta.kind === 'logarithmic') {
      const domain = task.steps.at(-2), m = task.meta;
      assert.match(domain.prompt, /Проверка ОДЗ.*аргумент/s, `${label}: domain is checked before the answer`);
      assert(oracle.solution * m.a + m.b > 0, `${label}: independent root in log domain`);
      assert(checker.check(domain.answer, String(oracle.solution * m.a + m.b)), `${label}: actual substituted argument is checked`);
      assert(!checker.check(domain.answer, '0'), `${label}: zero log argument cannot pass`);
    }
    if (task.meta.kind === 'recover-cosine') {
      const magnitude = task.steps.at(-2);
      assert.match(magnitude.prompt, /квадратный корень.*\|cos α\|/s, `${label}: square root is a separate operation`);
      assert(checker.check(magnitude.answer, `sqrt(1-(${task.meta.sinNum}/${task.meta.den})^2)`), `${label}: positive square root before sign`);
    }
    finalChecks++;
  }
}
assert.equal(counts.size, 8, 'All eight lesson families covered');
for (const [kind, count] of counts) assert.equal(count, 6, `${kind}: all six authored variants`);
assert.equal(finalChecks, 48, 'Every authored task reaches its requested value');
assert(rejectedMistakes > 100, 'Substantial wrong-answer coverage, not just happy paths');
console.log(`PASS: ${finalChecks} explicit final answers; ${rejectedMistakes} plausible intermediate/sign errors rejected; ${rootInputChecks} exact table entries; logarithm domain checks precede final x.`);
