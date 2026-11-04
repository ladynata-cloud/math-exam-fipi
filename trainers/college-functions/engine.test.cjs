'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');
const interval = (lo,hi,lc=false,rc=false) => ({lo,hi,lc,rc});
const set = (intervals=[], points=[]) => ({intervals,points});

test('numeric answers: signs, decimal commas and fractions', () => {
  for (const [s,n] of [['0',0],[' -2 ', -2],['−2',-2],['0,5',.5],['.25',.25],['1/3',1/3],['-1/-2',.5],['1 / -4',-.25],['+3/2',1.5]]) assert.equal(E.parseNumber(s), n, s);
});
test('empty, unsafe and non-finite expressions cannot become answers', () => {
  for (const value of ['', ' ', null, undefined, true, {}, [], '1/0', '0/0', 'Infinity', 'NaN', '1e2', '1+1', '2**3', 'alert(1)', '<svg onload=alert(1)>', '1//2', '/2', '1/', '1,2,3', '1;2']) assert.equal(E.parseNumber(value), null, String(value));
  assert.equal(E.sameZeros('', []), false);
  assert.equal(E.sameZeros('', [0]), false);
  assert.equal(E.sameSet('', set()), false);
});
test('root and logarithm boundary inclusion remains mathematically distinct', () => {
  const root = set([interval(-2,'inf',true)]), log = set([interval(-2,'inf')]);
  assert.equal(E.sameSet('[-2; +∞)',root),true);
  assert.equal(E.sameSet('(-2; +∞)',root),false);
  assert.equal(E.sameSet('(-2; +∞)',log),true);
  assert.equal(E.sameSet('[-2; +∞)',log),false);
  assert.equal(E.sameSet('[−2;inf)',root),true);
});
test('malformed intervals and closed infinity are rejected', () => {
  for (const s of ['[-∞;2]', '(-∞;2]x', '[0;+∞]', '[2;1]', '(2;2)', '(0,2)', '[0;2;3]', '[0;2', '0;2', '(-∞;∞)∪', '{2;;3}', '{}', '[∞;∞)', '(-∞;-∞]']) assert.equal(E.parseSet(s),null,s);
});
test('unions normalize actual sets but preserve excluded holes', () => {
  assert.equal(E.sameSet('(-∞;0) ∪ [0;+∞)', 'R'),true);
  assert.equal(E.sameSet('(-∞;0) ∪ (0;+∞)', 'R'),false);
  assert.equal(E.sameSet('(-∞;0) ∪ {0} ∪ (0;+∞)', 'ℝ'),true);
  assert.equal(E.sameSet('[0;2] U [1;3)', '[0;3)'),true);
  assert.equal(E.sameSet('[0;2) и [2;3]', '[0;3]'),true);
  assert.equal(E.sameSet('[0;2) ∪ {3}',set([interval(0,2,true)], [3])),true);
  assert.equal(E.sameSet('[0;2] ∪ {3}',set([interval(0,2,true)], [3])),false);
  assert.equal(E.sameSet('{3; -2; 3}',set([],[-2,3])),true);
});
test('fractions and decimal commas are exact numeric endpoints', () => {
  assert.equal(E.sameSet('(-1; -2/3)',set([interval(-1,-2/3)])),true);
  assert.equal(E.sameSet('(-1; -0,666)',set([interval(-1,-2/3)])),false);
  assert.equal(E.sameSet('[0,5; 1,5]',set([interval(.5,1.5,true,true)])),true);
});
test('zero lists allow fractions, duplicates and empty-set notation', () => {
  assert.equal(E.sameZeros('-2; 2',[-2,2]),true);
  assert.equal(E.sameZeros('2; -2; 2',[-2,2]),true);
  assert.equal(E.sameZeros('{-2;2}',[-2,2]),true);
  assert.equal(E.sameZeros('-2/3',[-2/3]),true);
  assert.equal(E.sameZeros('нет',[]),true);
  assert.equal(E.sameZeros('∅',[]),true);
  assert.equal(E.sameZeros('0',[]),false);
  assert.equal(E.sameZeros('нет',[0]),false);
  assert.equal(E.sameZeros('2;', [2]),false);
});
test('monotonic branch segmentation is never flattened into a set union', () => {
  const f3=[interval('-inf',2),interval(2,'inf',true)];
  assert.equal(E.sameIntervals('(-∞;2) и [2;+∞)',f3),true);
  assert.equal(E.sameIntervals('[2;+∞) ∪ (-∞;2)',f3),true);
  assert.equal(E.sameIntervals('ℝ',f3),false);
  assert.equal(E.sameIntervals('(-∞;2) и (2;+∞)',f3),false);
  assert.equal(E.sameIntervals('нет',[]),true);
  assert.equal(E.sameIntervals('{0}',[]),false);
  assert.equal(E.sameIntervals('ℝ',[interval('-inf','inf')]),true);
});
test('formatting preserves finite points, holes and separate monotonic parts', () => {
  const source=set([interval(0,2,true)],[3]);
  assert.equal(E.sameSet(E.formatSet(source), source),true);
  assert.equal(E.formatNumber(-2/3),'-2/3');
  assert.equal(E.formatNumber(.5),'1/2');
  assert.equal(E.formatSet(set()),'∅');
  assert.equal(E.formatSet(set([interval('-inf','inf')])),'ℝ');
  assert.equal(E.formatIntervals([interval('-inf',2),interval(2,'inf',true)]),'(-∞; 2) и [2; +∞)');
  assert.equal(E.escapeHTML('<script>"&\''),'&lt;script&gt;&quot;&amp;&#39;');
});
test('optional school notation omits finite included extrema but never adds excluded boundaries', () => {
  const options={allowOpenFinite:true};
  assert.equal(E.sameIntervals('(2;+∞)',[interval(2,'inf',true)]),false);
  assert.equal(E.sameIntervals('(2;+∞)',[interval(2,'inf',true)],options),true);
  assert.equal(E.sameIntervals('(-∞;2)',[interval('-inf',2,false,true)],options),true);
  assert.equal(E.sameIntervals('(-∞;2] и (2;+∞)',[interval('-inf',2),interval(2,'inf',true)],options),false);
  assert.equal(E.sameIntervals('(-∞;2) и (2;+∞)',[interval('-inf',2),interval(2,'inf',true)],options),true);
  assert.equal(E.sameIntervals('R',[interval('-inf',2),interval(2,'inf',true)],options),false);
  assert.equal(E.sameIntervals('[-∞;2)',[interval('-inf',2)],options),false);
  assert.equal(E.sameSet('(2;+∞)',set([interval(2,'inf',true)])),false);
});
test('set normalization does not mutate expected authored data', () => {
  const expected=set([interval(0,1,true),interval(1,2,true,true)],[4,3]);
  const before=JSON.stringify(expected);
  E.parseSet(expected); E.sameSet('[0;2] ∪ {3;4}',expected);
  assert.equal(JSON.stringify(expected),before);
});
