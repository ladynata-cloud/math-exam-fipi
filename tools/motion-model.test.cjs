'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const original = require('../trainers/motion-grade6/course-core');
const { cases, position, checkEquation, checkNumber } = require('../trainers/motion-grade6/model-data');

// Independent solutions from the four story statements. Coordinates in km, time in h.
const scenarios = {
  meet: {
    starts: [0, 10], velocities: [12, -8], target: 0, time: 0.5,
    converted: 200 * 60 / 1000,
    models: ['12x = 10 - 8x', '10 = (12 + 8)x', 'x = 10/(12+8)', '(12x+8x)/2=5', '10/(12+8)'],
    mistakes: ['12x = 10 + 8x', '10 = (200+8)x', 'x=0,5', 'x+(12x-12x)=0,5', '13x=12x+0,5', 'x+12x=12x+0,5', 'x=10/20-10/20+0,5'],
  },
  chase: {
    starts: [0, 10], velocities: [12, 8], target: 0, time: 2.5,
    converted: 200 * 60 / 1000,
    models: ['10+8x=12x', '(12-8)*x=10', 'x=10/(12-8)', '10/(12-8)'],
    mistakes: ['(12+8)x=10', '(8-12)x=10', 'x=2,5'],
  },
  delay: {
    starts: [0, 8 * 45 / 60], velocities: [12, 8], target: 0, time: 1.5,
    converted: 45 / 60,
    models: ['12x=8(x+0,75)', '6+8x=12x', 'x=6/(12-8)', '(12-8)=8*0,75/х', '(8*45/60)/(12-8)'],
    mistakes: ['12x=8(x+0.45)', '12(x-0.75)=8x', '12x=8x', 'x=1,5'],
  },
  signal: {
    starts: [0, 20], velocities: [6, -4], target: 5, time: 1.5,
    converted: 5000 / 1000,
    models: ['20 - (6+4)x = 5', '6x + 5 = 20-4x', 'x=(20-5)/(6+4)', '(20-5):х=6+4', '(20-5)/(6+4)'],
    mistakes: ['6x=20-4x', '6x-(20-4x)=5', '(6+4)x=5', 'x=1,5'],
  },
};

test('legacy IDs, twelve lessons and every complete exercise match the reviewed base', () => {
  const { ids, lessons, task } = original;
  assert.equal(ids.length, 12);
  const tasks = ids.map((_, lesson) => Array.from({length: 12}, (_, i) => task(lesson, i)));
  const digest = createHash('sha256').update(JSON.stringify({ids, lessons, tasks})).digest('hex');
  assert.equal(digest, 'a83c51cdf7e642fd791291cfe70eb56792ffd2fc8c5fdf4c8d21939114d70b9d');
});

test('all four stories have distinct stable IDs', () => {
  assert.deepEqual(cases.map(c => c.id), Object.keys(scenarios));
});

for (const [id, expected] of Object.entries(scenarios)) {
  test(id + ' — convert, move both objects, and substitute into the original condition', () => {
    const current = cases.find(c => c.id === id);
    assert.ok(current, id);
    assert.equal(current.unitAnswer, expected.converted);
    const [v1, v2] = expected.velocities, [s1, s2] = expected.starts;
    assert.equal((s2 - s1 - expected.target) / (v1 - v2), expected.time);
    for (const time of [0, 0.1, expected.time / 2, expected.time]) {
      const { p1, p2, distance } = position(current, time);
      const a = s1 + v1 * time, b = s2 + v2 * time;
      assert.ok(Math.abs(p1 - a) < 1e-8, id + ': first position at ' + time);
      assert.ok(Math.abs(p2 - b) < 1e-8, id + ': second position at ' + time);
      assert.ok(Math.abs(distance - Math.abs(b-a)) < 1e-8, id + ': gap at ' + time);
      if (time < expected.time) assert.ok(b-a > expected.target);
      else assert.equal(b-a, expected.target);
    }
  });

  test(id + ' — equivalent models and meaningful diagnostics for different errors', () => {
    const current = cases.find(c => c.id === id);
    for (const model of expected.models) assert.equal(checkEquation(current, model).ok, true, model);
    for (const model of expected.mistakes) {
      const result = checkEquation(current, model);
      assert.equal(result.ok, false, model);
      assert.ok(result.message && result.message.trim(), model + ': diagnostic');
    }
    const [left, right] = expected.models[0].split('=');
    assert.equal(checkEquation(current, right + '=' + left).ok, true, 'reversed equality');
  });
}

test('one distance unit or normalization applies to both sides of a physical model', () => {
  const examples = {
    meet: [
      '200*60*x+8000*x=10000', '10000/(200*60+8000)', '10000/x=20000',
      '0,5*(12x+8x)=0,5*10', '(12x+8x)/2=5', '2*(12x+8x)=20',
      '12x=12*(10/(12+8))', '20x=10*0.5+10*0.5'
    ],
    chase: ['12000x=10000+8000x', '10000/(12000-8000)'],
    delay: ['8/12*(x+0,75)=x', '12/8*x=x+0,75', '0,75/(12/8-1)', '6000/(12000-8000)'],
    signal: ['6000x+4000x+5000=20000', '(20000-5000)/(6000+4000)', '(20000-5000)/x=10000']
  };
  for (const c of cases) {
    for (const expression of examples[c.id]) {
      assert.equal(checkEquation(c, expression).ok, true, expression);
      if (expression.includes('=')) {
        const reversed = expression.split('=').reverse().join('=');
        assert.equal(checkEquation(c, reversed).ok, true, reversed);
      }
    }
  }
});

test('a supplied answer stays unsupported after scaling, shifting, or cancelling physical terms', () => {
  const shortcuts = [
    '12x=12*0,5', '12*x=12*1/2', '12*x=12*(0.2+0.3)', '12*(x-1/2)=0', '12x=12*(0,25+0,25)', '20000x=20000*0,5',
    '12x+8x=12*0,5+8*0,5', '12x=12*(10/20-10/20+0,5)', '12x=12*(20*0,5/20)',
    'x=10/20-10000/20000+0,5', 'x+8000x=8000x+0,5', '1*x=0,5'
  ];
  for (const expression of shortcuts) {
    assert.equal(checkEquation(cases[0], expression).ok, false, expression);
    const reversed = expression.split('=').reverse().join('=');
    assert.equal(checkEquation(cases[0], reversed).ok, false, reversed);
  }
  assert.equal(checkEquation(cases[2], '8/12*(x+0,75)-8/12*(x+0,75)+x=1,5').ok, false);
});

test('undefined, nonlinear, identity and answer-only inputs cannot satisfy the modeling gate', () => {
  for (const source of ['', 'x=x', '0=0', '12x+8x=12x+8x', '(x-.5)*(x+2)=0',
    '10+1/(x-x)=20x', '0,5', '1/2', '10/20-10/20+0.5', '12x+8x', 'x=undefined', 'x=Infinity',
    '2+8/x=20', '10/(x-1)=20', '10/x=10/x', 'globalThis.bad=1', '(1+1', 'x==10/(12+8)']) {
    assert.equal(checkEquation(cases[0], source).ok, false, source);
  }
});

test('decimal answers use a decimal point or comma and require a finite numeric value', () => {
  assert.ok(checkNumber('1,5', 1.5));
  assert.ok(checkNumber(' 1.50 ', 1.5));
  for (const entry of ['', '  ', '12км', '1,5,0', 'NaN', 'Infinity']) {
    assert.equal(checkNumber(entry, 0), false, JSON.stringify(entry));
  }
  assert.equal(checkNumber('-1.5', 1.5), false);
});
