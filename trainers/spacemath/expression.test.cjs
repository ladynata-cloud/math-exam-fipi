'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const E = require('./expression.js');
const close = (actual, expected, epsilon = 1e-12) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} ≠ ${expected}`);

test('school arithmetic, powers, signs and explicit multiplication have mathematical precedence', () => {
  const cases = [['2+3*4', 14], ['(2+3)*4', 20], ['-x^2', -9], ['(-x)^2', 9], ['2^3^2', 512], ['2^-2', 0.25], ['-2^-2', -0.25], ['1-2-3', -4], ['24/4/2', 3], ['.5+1e-3', 0.501], ['+x', 3], ['--x', 3]];
  for (const [source, expected] of cases) close(E.evaluate(source, 3), expected);
  assert.equal(E.validate('2x').ok, false);
  assert.equal(E.validate('sin x').ok, false);
});

test('a,b,c parameters and constants support common graph families', () => {
  const program = E.parse(' a*x^2+b*x+c ');
  assert.deepEqual(program.variables, ['a', 'b', 'c', 'x']);
  assert.equal(program.source, 'a*x^2+b*x+c');
  assert.equal(E.evaluate(program, 2, { a: 2, b: -3, c: 4 }), 6);
  assert.equal(E.evaluate(program, 2, { a: 4, b: -3, c: 4 }), 14);
  assert.ok(Number.isNaN(E.evaluate(program, 2, { a: 2 })));
  close(E.evaluate('sin(pi/2)+cos(0)+ln(e)'), 3);
  close(E.evaluate('log(e^2)'), 2);
  close(E.evaluate('asin(1)+acos(0)+atan(1)'), 5 * Math.PI / 4);
  assert.equal(E.evaluate('abs(-3)+sqrt(9)'), 6);
  close(E.evaluate('exp(1)'), Math.E);
});

test('piecewise branches are lazy and comparisons are bounded scalar conditions', () => {
  const source = 'If(x<0,-sqrt(-x),sqrt(x))';
  assert.equal(E.evaluate(source, -9), -3);
  assert.equal(E.evaluate(source, 9), 3);
  assert.equal(E.evaluate(source, 0), 0);
  assert.equal(E.evaluate('If(x!=0,1/x,0)', 0), 0);
  assert.equal(E.evaluate('if(x>=2,If(x==2,4,5),1)', 2), 4);
  assert.equal(E.evaluate('If(x<=2,4,5)', 3), 5);
  assert.equal(E.evaluate('If(x>2,4,5)', 3), 4);
  assert.equal(E.validate('If(0<x<2,x,0)').ok, false);
  assert.equal(E.validate('If(x<0,-x)').ok, false);
  assert.equal(E.validate('If(x<0,-x,x,1)').ok, false);
});

test('undefined domains, poles and overflow return NaN rather than a spurious point', () => {
  for (const source of ['sqrt(-1)', 'ln(0)', 'log(-1)', 'asin(2)', 'acos(-2)', '1/0', '0/0', '0^0', '0^-1', '(-1)^.5', 'exp(1000)', '10^101', 'tan(pi/2)', 'tan(3*pi/2)']) {
    assert.ok(Number.isNaN(E.evaluate(source)), source);
  }
  close(E.evaluate('tan(pi/4)'), 1);
  assert.equal(E.evaluate('1/x', -0.1), -10);
  assert.ok(Number.isNaN(E.evaluate('1/x', 0)));
  assert.equal(E.evaluate('1/x', 0.1), 10);
  assert.ok(Number.isNaN(E.evaluate('x', Infinity)));
  assert.ok(Number.isNaN(E.evaluate('x', '2')));
});

test('only the mathematical grammar is accepted, never property access or executable input', () => {
  for (const source of ['Math.sin(x)', 'x.constructor', 'constructor(1)', 'globalThis', 'window', 'process.exit()', 'eval("1")', 'Function("return 1")()', 'x[0]', 'x=2', 'x++', '1;2', '1/*x*/2', '`x`', '(()=>1)()', '{x:2}', '__proto__', 'Infinity', 'NaN', 'sin.constructor(x)', '2**3', 'new Date()', 'sin(x);alert(1)', '<script>', 'x||2', 'x&&2', 'x?1:0']) {
    const result = E.validate(source);
    assert.equal(result.ok, false, source);
    assert.equal(typeof result.error, 'string');
    assert.ok(Number.isNaN(E.evaluate(source)), source);
  }
});

test('malformed syntax and resource exhaustion are rejected without a stack overflow', () => {
  for (const source of ['', ' ', '(', ')', 'x+', '*2', 'sin()', 'sin(x,2)', '1e999', '1e', '1..2', 'x'.repeat(513), '('.repeat(40) + 'x' + ')'.repeat(40), '-'.repeat(40) + 'x', '2^'.repeat(40) + '2', '1+'.repeat(129) + '1']) {
    assert.equal(E.validate(source).ok, false, source.slice(0, 60));
  }
  for (const value of [null, {}, [], 1, undefined]) assert.equal(E.validate(value).ok, false);
  assert.equal(E.validate('If(x<0,-x,x)').ok, true);
});

test('compiled programs are immutable and fabricated syntax trees cannot be executed', () => {
  const program = E.parse('a*x');
  assert.ok(Object.isFrozen(program));
  assert.ok(Object.isFrozen(program.variables));
  assert.throws(() => { program.source = 'x'; }, TypeError);
  assert.ok(Number.isNaN(E.evaluate({ source: 'x', variables: ['x'] }, 2)));
  assert.ok(Number.isNaN(E.evaluate(JSON.parse(JSON.stringify(program)), 2, { a: 1 })));
  const forged = Object.create(null);
  Object.defineProperty(forged, 'source', { get() { throw new Error('must not read'); } });
  assert.ok(Number.isNaN(E.evaluate(forged, 2)));
});

test('parameters reject accessors, prototype keys, extra names and excessive magnitudes', () => {
  let calls = 0;
  const accessor = Object.defineProperty({}, 'a', { enumerable: true, get() { calls++; return 3; } });
  assert.ok(Number.isNaN(E.evaluate('a*x', 2, accessor)));
  assert.equal(calls, 0);
  for (const value of [null, [], { a: '2' }, { a: Infinity }, { a: 1000001 }, { d: 3 }, { x: 2 }, Object.create({ a: 2 }), JSON.parse('{"__proto__":2}')]) {
    assert.ok(Number.isNaN(E.evaluate('a*x', 2, value)));
  }
  assert.equal(E.evaluate('a*x', 2, { a: 1000000 }), 2000000);
  const nullPrototype = Object.assign(Object.create(null), { a: 3 });
  assert.equal(E.evaluate('a*x', 2, nullPrototype), 6);
});

test('browser global is available without CommonJS or dynamic evaluation', () => {
  const source = fs.readFileSync(path.join(__dirname, 'expression.js'), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(source, context, { timeout: 1000 });
  assert.equal(vm.runInContext('SpaceMathExpression.evaluate("x^2",3)', context), 9);
});

const plot = (source, options = {}, parameters = {}) => E.sample(source, parameters, { left: -4, right: 4, bottom: -8, top: 8, ...options });
function segments(result) {
  const groups = [[]];
  result.x.forEach((x, index) => {
    if (Number.isNaN(x)) { if (groups[groups.length - 1].length) groups.push([]); }
    else groups[groups.length - 1].push([x, result.y[index]]);
  });
  return groups.filter(group => group.length);
}

test('bounded plotting breaks reciprocal and tangent poles even between original samples', () => {
  for (const pole of [0, 0.0137, -0.34567]) {
    const result = plot(`1/(x-(${pole}))`), groups = segments(result);
    assert.ok(groups.length >= 2);
    for (const group of groups) assert.ok(!(group[0][0] < pole && group[group.length - 1][0] > pole), `bridged pole ${pole}`);
  }
  const tangent = segments(plot('tan(x)'));
  assert.ok(tangent.length >= 3);
  for (const pole of [-Math.PI / 2, Math.PI / 2]) {
    for (const group of tangent) assert.ok(!(group[0][0] < pole && group[group.length - 1][0] > pole), `bridged tan pole ${pole}`);
  }
});

test('plotting domain boundaries and piecewise jumps keeps visible pieces separate', () => {
  for (const source of ['sqrt(x)', 'ln(x)']) {
    const result = plot(source);
    assert.ok(result.x.some(Number.isFinite));
    assert.ok(result.x.every(x => Number.isNaN(x) || x >= 0));
  }
  const groups = segments(plot('If(x<0.0137,-2,3)'));
  assert.equal(groups.length, 2);
  assert.ok(groups[0].every(([x, y]) => x < 0.0137 && y === -2));
  assert.ok(groups[1].every(([x, y]) => x > 0.0137 && y === 3));
  const cusp = segments(plot('abs(x)'));
  assert.equal(cusp.length, 1);
  assert.ok(cusp[0].some(([x, y]) => x === 0 && y === 0));
});

test('plots clip steep continuous lines without dropping their visible crossing', () => {
  const groups = segments(plot('100000*x+0.123'));
  assert.equal(groups.length, 1);
  assert.equal(groups[0][0][1], -8);
  assert.equal(groups[0][groups[0].length - 1][1], 8);
  assert.ok(groups[0].some(([x]) => Math.abs(x) < 0.0001));
  const parabola = plot('a*x^2', {}, { a: 1 });
  assert.ok(parabola.x.length > 30);
  assert.ok(parabola.y.every(y => Number.isNaN(y) || y >= -8 && y <= 8));
});

test('sampling has fixed output bounds and rejects invalid viewports or programs', () => {
  for (const source of ['sin(100000*x)', '1/(x-0.123)', 'If(sin(10000*x)>0,1,-1)']) {
    const result = plot(source, { points: 1025 });
    assert.equal(result.x.length, result.y.length);
    assert.ok(result.x.length <= 4096);
    assert.ok(result.x.every(x => Number.isNaN(x) || Number.isFinite(x) && x >= -4 && x <= 4));
    assert.ok(result.y.every(y => Number.isNaN(y) || Number.isFinite(y) && y >= -8 && y <= 8));
  }
  for (const options of [{ left: 4 }, { bottom: 8 }, { right: Infinity }, { points: 100000 }, { points: 1 }, { points: 2.5 }]) assert.deepEqual(plot('x', options), { x: [], y: [] });
  assert.deepEqual(plot('process.exit()'), { x: [], y: [] });
  assert.deepEqual(E.sample({ source: 'x' }, {}, { left: -1, right: 1, bottom: -1, top: 1 }), { x: [], y: [] });
});

test('padded and aspect-expanded viewports can extend beyond object coordinate limits', () => {
  const result = plot('x', { left: -8000000, right: 8000000, bottom: -8000000, top: 8000000 });
  assert.ok(result.x.length > 200);
  assert.equal(result.x[0], -8000000);
  assert.equal(result.x[result.x.length - 1], 8000000);
  assert.deepEqual(plot('x', { left: -1e13 }), { x: [], y: [] });
});

test('non-dyadic probes detect periodic grid aliases and a partial plot reports its limit', () => {
  const sine = plot('sin(64*pi*x)');
  assert.ok(sine.y.some(y => y > 0.5));
  assert.ok(sine.y.some(y => y < -0.5));
  const tangent = plot('tan(64*pi*x)');
  assert.ok(tangent.y.some(y => y > 1));
  assert.ok(segments(tangent).every(group => group[group.length - 1][0] - group[0][0] < 1 / 64));
  assert.equal(tangent.limited, true);
  assert.equal(plot('tan(32*pi*x)').limited, true);
  assert.equal(plot('x^2').limited, undefined);
});

test('structural guards split cancelled holes, small reciprocal poles and squared denominators', () => {
  const options = { left: -8, right: 8, bottom: -6, top: 6, points: 256 };
  for (const [source, hole] of [['(x^2-1)/(x-1)', 1], ['0.00001/(x-0.01)', 0.01], ['0.00000001/(x-0.01)^2', 0.01], ['0.00001*(x-0.01)^-1', 0.01]]) {
    const groups = segments(plot(source, options));
    assert.ok(groups.length >= 2, source);
    assert.ok(groups.every(group => !(group[0][0] < hole && group[group.length - 1][0] > hole)), source);
  }
});

test('structural comparison guards find a narrow domain gap and a narrow visible piece', () => {
  const options = { left: -8, right: 8, bottom: -6, top: 6, points: 256 };
  const absent = segments(plot('If(x>0.003,If(x<0.02,1/0,0),0)', options));
  assert.ok(absent.length >= 2);
  assert.ok(absent.every(group => !(group[0][0] < 0.003 && group[group.length - 1][0] > 0.02)));
  const piece = segments(plot('If(x>0.003,If(x<0.02,4,0),0)', options));
  assert.ok(piece.some(group => group.some(([x, y]) => x > 0.003 && x < 0.02 && y === 4)));
});

test('identical subexpressions avoid false domain hazards while retaining real undefined values', () => {
  for (const source of ['If(x==x,1,0)', 'If(x<x,0,1)', 'If(0==0,1,0)', '1/(x-x+1)', '0.000001/(x-x+0.000001)', 'If(0,1/0,1)']) {
    const result = plot(source, { points: 256 });
    assert.ok(result.x.length > 200, source);
    assert.equal(result.limited, undefined, source);
    assert.ok(result.y.every(y => y === 1), source);
  }
  assert.ok(Number.isNaN(E.evaluate('If(sqrt(-1)==sqrt(-1),1,0)')));
  assert.deepEqual(plot('If(sqrt(-1)==sqrt(-1),1,0)'), { x: [], y: [] });
});

test('constant valid domain endpoints remain visible and numeric If boundaries are separated', () => {
  for (const source of ['sqrt(0)', 'sqrt(x-x)', 'acos(1)', 'asin(-1)', '0^0.5']) {
    const result = plot(source, { points: 256 });
    assert.ok(result.x.length > 200, source);
    assert.equal(result.limited, undefined, source);
  }
  const groups = segments(plot('If(x-0.01,1,0)', { points: 256 }));
  assert.ok(groups.length >= 2);
  assert.ok(groups.every(group => !(group[0][0] < 0.01 && group[group.length - 1][0] > 0.01)));
});
