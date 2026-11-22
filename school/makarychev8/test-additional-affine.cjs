'use strict';
const assert = require('node:assert/strict');
const C = require('./check.js');
const models = require('./models.js');
const cards = require('./exercises-1158-1160.json');
const card = suffix => cards.find(task => task.id === 'p44-source-' + suffix);
assert.equal(cards.length, 10);
assert.equal(cards.reduce((count, task) => count + task.steps.length, 0), 24);
assert(cards.every(task => task.source.page === 259 && C.check(task.answer, task)));
const third = card('1158-a');
for (const formula of ['y=-14', 'y=2x-10', '3y=6x-30', 'y=7x/2-7-1/17-x/17']) {
  assert(C.check(formula, third), formula);
}
for (const [formula, status] of [['x=-2','format'], ['y=3,5x-7','same'], ['y=(7x-13)/2','parallel'], ['y=0','location']]) {
  assert.equal(C.lineCondition(formula, third.graph).status, status);
  assert(!C.check(formula, third));
}
const almostSame = 'y=3.5x-7+(x+1)/(12345*12345*12345*12345)';
assert.equal(C.lineCondition(almostSame, third.graph).status,'valid');
assert(C.check('3y=6x-12', card('1158-b')));
assert(!C.check('y=3,5x-7', card('1158-b')));
assert(C.check('y=x/2-7',card('1158-c')));
for (const [suffix, point, intercept] of [['a',[0,0],0], ['b',[-4,0],-8], ['c',[0,3],3], ['d',[-2,2],-2]]) {
  const t = card('1159-'+suffix);
  assert.deepEqual(t.graph.point, point);
  assert(C.check('2y=-4x+('+2*intercept+')',t));
  assert.equal(C.lineCondition('y=-2x+6',t.graph).status,'same');
  assert.equal(C.lineCondition('y=-2x+11',t.graph).status,'point');
  assert.equal(C.lineCondition('y=2x+11',t.graph).status,'slope');
}
for (const [suffix,good,wrong] of [['a','a>2','a≥2'],['b','a<2','a>2'],['c','a=2','a≤2']]) {
  assert(C.check(good, card('1160-'+suffix)));assert(!C.check(wrong,card('1160-'+suffix)));
}
for (const skill of ['line-intersection-location','parallel-at-point','line-parameter-direction']) {
  const variants = new Set();
  for (let seed=0; seed<100; seed++) for (let level=1; level<=3; level++) {
    const t = models.practiceFinalFunction(skill,seed,level);
    assert(C.check(t.answer,t),t.prompt);variants.add(t.prompt);
    if(t.graph.mode==='parallel') assert(!C.check('y=0',t));
    if(t.graph.mode==='third') assert(!C.check('y=0',t));
  }
  assert(variants.size>=15);
}
console.log('PASS 10 exercises, 24 steps, exact rational determinants, arbitrary lines, strict directions and 900 practice variants.');
