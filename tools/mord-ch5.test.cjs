'use strict';
const assert = require('node:assert/strict');
const lessons = require('../ege-profil/circle/chapter5.js');
const tasks = lessons.flatMap(l => l.tasks), P = Math.PI, T = 2 * P;
const S2 = Math.sqrt(2) / 2, S3 = Math.sqrt(3) / 2;
const parts = ['а', 'б', 'в', 'г'];
const near = (a, b, message) => assert.ok(Math.abs(a - b) < 1e-8, `${message}: ${a} ≠ ${b}`);
const principal = t => ((t % T) + T) % T;
const answer = f => f.options.find(o => o.value === f.expected).label;
const find = (book, part) => tasks.find(t => t.book === book && t.part === part);
function angle(text) {
  text = text.trim().replace(/−/g, '-');
  if (!text.includes('π')) return Number(text);
  const m = /^(-?\d*)π(?:\/(\d+))?$/.exec(text);
  assert.ok(m, 'Unsupported angle: ' + text);
  return (m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1])) * P / (m[2] ? Number(m[2]) : 1);
}
function shifted(text) {
  const m = /^(?:(.*?) \+ )?(\d*)πk$/.exec(text);
  assert.ok(m, 'Unsupported shifted expression: ' + text);
  return { offset: m[1] ? angle(m[1]) : 0, period: Number(m[2] || 1) * P };
}
function parseInterval(text) {
  const m = /^(.*?) ([<≤]) t ([<≤]) (.*?), k ∈ Z$/.exec(text);
  assert.ok(m, 'Interval syntax: ' + text);
  const lo = shifted(m[1]), hi = shifted(m[4]);
  near(lo.period, hi.period, 'same interval period');
  return { lo: lo.offset, hi: hi.offset, period: lo.period, leftClosed: m[2] === '≤', rightClosed: m[3] === '≤' };
}
function inInterval(t, spec) {
  for (let k = -20; k <= 20; ++k) {
    const dl = t - (spec.lo + k * spec.period), dr = spec.hi + k * spec.period - t;
    if ((spec.leftClosed ? dl >= -1e-9 : dl > 1e-9) && (spec.rightClosed ? dr >= -1e-9 : dr > 1e-9)) return true;
  }
  return false;
}
function rootsFor(axis, value) {
  let result = axis === 'x' ? [Math.acos(value), -Math.acos(value)] : [Math.asin(value), P - Math.asin(value)];
  result = result.map(principal).sort((a, b) => a - b);
  return result.filter((v, i) => !i || Math.abs(v - result[i - 1]) > 1e-9);
}
function family(text) {
  assert.ok(text.endsWith(', k ∈ Z'), 'integer parameter is explicit');
  return text.replace(/, k ∈ Z$/, '').split(' или ').map(piece => {
    const m = /^t = (.*?) \+ (\d*)πk$/.exec(piece);
    assert.ok(m, 'family syntax: ' + piece);
    return { base: angle(m[1]), period: Number(m[2] || 1) * P };
  });
}
assert.equal(lessons.length, 8);
assert.equal(tasks.length, 56);
assert.equal(new Set(tasks.map(t => t.id)).size, 56);
for (let n = 1; n <= 14; n++) for (const part of parts) assert.ok(find('5.' + n, part), 'source coverage 5.' + n + part);
for (const l of lessons) {
  assert.ok(l.intro.length > 500, 'substantive lesson intro: ' + l.id);
  assert.ok(['coordinates', 'slice'].includes(l.lab.mode));
}
for (const t of tasks) {
  assert.ok(t.steps.length >= 2, t.id);
  for (const q of [t, ...t.steps]) {
    assert.ok(q.fields.length);
    assert.equal(new Set(q.fields.map(f => f.id)).size, q.fields.length);
    for (const f of q.fields) {
      if (f.kind === 'number' || f.kind === 'point') assert.ok(Number.isFinite(f.expected), t.id);
      else {
        assert.ok(f.options.some(o => o.value === f.expected), t.id);
        assert.equal(new Set(f.options.map(o => o.label)).size, f.options.length, 'no duplicated choices: ' + t.id);
        assert.ok(f.options.every(o => /^[a-d]$/.test(o.value)), 'opaque choices: ' + t.id);
      }
    }
  }
}
// Source-independent coordinate calculations, using the exact angles transcribed from the screenshots.
for (const [book, list] of Object.entries({ '5.1': [P/4, P/3, P/6, P/2], '5.2': [2*P, 7*P/2, -3*P/2, 15*P], '5.3': [15*P/4, 16*P/3, -31*P/4, -26*P/3] })) {
  list.forEach((a, i) => {
    const t = find(book, parts[i]);
    near(t.fields[0].expected, Math.cos(a), t.id + ' x');
    near(t.fields[1].expected, Math.sin(a), t.id + ' y');
    near(t.fields[0].expected ** 2 + t.fields[1].expected ** 2, 1, t.id + ' radius');
    for (const s of t.steps) for (const f of s.fields) {
      if (f.kind === 'point') near(Math.cos(f.expected), Math.cos(a), t.id + ' point');
      if (f.id === 'u') near(f.expected, principal(a), t.id + ' reduced angle');
      if (f.id === 'x') near(f.expected, Math.cos(a), t.id + ' guided x');
      if (f.id === 'y') near(f.expected, Math.sin(a), t.id + ' guided y');
      if (f.id === 'xs' || f.id === 'ys') {
        const value = f.id === 'xs' ? Math.cos(a) : Math.sin(a);
        assert.equal(answer(f), Math.abs(value) < 1e-10 ? 'Равна нулю' : value > 0 ? 'Положительная' : 'Отрицательная');
      }
    }
  });
}
for (const [book, list] of Object.entries({ '5.4': [[S3,.5],[-S3,.5],[S3,-.5],[-S3,-.5]], '5.5': [[.5,S3],[-.5,S3],[-.5,-S3],[.5,-S3]] })) {
  list.forEach(([x, y], i) => {
    const t = find(book, parts[i]), a = principal(Math.atan2(y, x));
    near(t.fields[0].expected, a, t.id + ' least positive');
    near(t.fields[1].expected, a - T, t.id + ' greatest negative');
    assert.ok(t.fields[0].expected > 0 && t.fields[0].expected < T);
    assert.ok(t.fields[1].expected < 0 && t.fields[1].expected > -T);
    near(t.steps[1].fields[0].expected, Math.atan2(Math.abs(y), Math.abs(x)), t.id + ' reference');
    assert.equal(Number(answer(t.steps[0].fields[0])), Math.floor(a / (P/2)) + 1);
  });
}
let familyChecks = 0;
for (const [book, axis, values] of [['5.6','y',[S2,.5,0,S3]], ['5.7','y',[-S3,1,-S2,-1]], ['5.8','x',[S3,.5,1,S2]], ['5.9','x',[0,-.5,-S3,-1]]]) {
  values.forEach((h, i) => {
    const t = find(book, parts[i]), oracleRoots = rootsFor(axis, h), f = family(answer(t.fields[0]));
    assert.equal(f.length, oracleRoots.length, t.id + ' all branches');
    near(t.steps[0].fields[0].expected, 1 - h*h, t.id + ' square');
    near(t.steps[1].fields[0].expected, Math.sqrt(1-h*h), t.id + ' missing magnitude');
    assert.equal(t.steps[1].fields[1].expected, oracleRoots.length, t.id + ' number of distinct points');
    f.forEach((branch, j) => {
      near(branch.base, oracleRoots[j], t.id + ' root');
      near(branch.period, T, t.id + ' period');
      near(t.steps[2].fields[j].expected, oracleRoots[j], t.id + ' guided root');
      for (let k = -6; k <= 6; k++) {
        near((axis === 'x' ? Math.cos : Math.sin)(branch.base + branch.period*k), h, t.id + ' complete family');
        familyChecks++;
      }
    });
  });
}
for (let i = 0; i < 4; i++) {
  const t = find('5.10', parts[i]), a = [2,-4,-1,6][i];
  near(t.steps[0].fields[0].expected, principal(a), t.id + ' radians');
  assert.equal(answer(t.fields[0]), Math.cos(a) > 0 ? 'Положительная' : 'Отрицательная');
  assert.equal(answer(t.fields[1]), Math.sin(a) > 0 ? 'Положительная' : 'Отрицательная');
}
const sourceInequalities = [
  ['5.11','x', [['>',0],['<',.5],['>',.5],['<',0]]],
  ['5.12','x', [['<',S2],['>',-S2],['<=',-S3],['>=',S3]]],
  ['5.13','y', [['>',0],['<',.5],['>',.5],['<',0]]],
  ['5.14','y', [['<',S2],['>',-S2],['<=',-S3],['>=',S3]]]
];
let intervalChecks = 0;
function accepts(v, op, h) {
  const d = v - h;
  return op === '>' ? d > 1e-9 : op === '<' ? d < -1e-9 : op === '>=' ? d >= -1e-9 : d <= 1e-9;
}
for (const [book, axis, list] of sourceInequalities) list.forEach(([op,h], i) => {
  const t = find(book, parts[i]), f = t.fields[0], spec = parseInterval(answer(f));
  const roots = rootsFor(axis,h), coordinate = axis === 'x' ? Math.cos : Math.sin;
  assert.equal(spec.leftClosed, op.includes('='), t.id + ' left endpoint');
  assert.equal(spec.rightClosed, op.includes('='), t.id + ' right endpoint');
  near(spec.period, T, t.id + ' period');
  roots.forEach((r,j) => near(t.steps[0].fields[j].expected, r, t.id + ' boundary'));
  const expectedSide = axis === 'x' ? (op[0] === '>' ? 'Справа от прямой' : 'Слева от прямой') : (op[0] === '>' ? 'Выше прямой' : 'Ниже прямой');
  assert.equal(answer(t.steps[1].fields[0]), expectedSide, t.id + ' side');
  assert.equal(answer(t.steps[2].fields[0]), op.includes('=') ? 'Обе включены' : 'Обе исключены', t.id + ' endpoints explanation');
  const samples = Array.from({length:769}, (_,n) => (n-384)*P/48);
  for (const root of roots) for (let k=-3; k<=3; k++) samples.push(root+T*k, root+T*k-1e-5, root+T*k+1e-5);
  for (const x of samples) {
    assert.equal(inInterval(x,spec), accepts(coordinate(x),op,h), t.id + ' t=' + x/P + 'π');
    intervalChecks++;
  }
  // Every distractor changes the solution set; no equivalent formula is marked wrong.
  for (const wrong of f.options.filter(o => o.value !== f.expected)) {
    const other = parseInterval(wrong.label);
    assert.ok(samples.some(x => inInterval(x,other) !== accepts(coordinate(x),op,h)), t.id + ' non-equivalent distractor');
  }
});
console.log(JSON.stringify({ gate: 'MORD_CH5_MATH_OK', lessons: lessons.length, tasks: tasks.length, guidedSteps: tasks.reduce((n,t) => n+t.steps.length,0), familyChecks, intervalChecks, exactSourceCoverage: '5.1–5.14 а,б,в,г' }));
