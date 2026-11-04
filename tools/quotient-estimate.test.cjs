'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Q = require('../trainers/oge-basics/multiplication-division/quotient-estimate-core.js');
const D = require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
const nearestTen = n => { const low = n - n % 10; return n - low < 5 ? low : low + 10; };

function audit(n,d) {
  const p = Q.plan(n,d), expected = Math.floor(n/d), steps = p.steps;
  assert.equal(p.digit,expected);
  assert.equal(Number(steps.at(-1).answer),expected);
  assert.equal(steps.at(-1).kind,'digit');
  assert.ok(expected >= 0 && expected <= 9);
  assert.ok(expected*d <= n && (expected+1)*d > n);
  assert.ok(steps.length >= 2 && steps.length <= 26,'bounded work per question');
  let trial = null, product = null, pendingAdjustment = false;
  let estimateSeen = false;
  const computedProducts = [];
  steps.forEach((step,index) => {
    assert.ok(['round','estimate','product','digit'].includes(step.kind));
    assert.equal(typeof step.answer,'string');
    assert.match(step.answer,/^\d+$/);
    for (const key of ['prompt','hint','error','record']) assert.ok(typeof step[key] === 'string' && step[key].length > 0,key);
    assert.doesNotMatch(step.error,/\d/,'automatic error does not reveal numbers or answers');
    assert.notEqual(step.error,step.hint);
    assert.equal(D.check(step.answer,step),true,'existing numeric checker accepts correct answer');
    assert.equal(D.check(String(Number(step.answer)+1),step),false);
    assert.equal(D.check('-1',step),false);
    if (step.kind === 'digit') {
      assert.equal(D.check('0'+step.answer,step),false,'digit must be one character');
      assert.equal(D.check(step.answer+'.0',step),false);
    }
    if (step.kind === 'round') {
      const original = index === 0 ? d : n;
      assert.equal(Number(step.answer),nearestTen(original));
    } else if (step.kind === 'estimate') {
      assert.equal(Number(step.answer),nearestTen(n)/nearestTen(d));
      assert.ok(Number.isInteger(Number(step.answer)));
      estimateSeen = true;
    } else if (step.kind === 'product') {
      const match = step.prompt.match(/(\d+) × (\d+) = \?/);
      assert.ok(match,'a product question explicitly shows its two numbers');
      const a = Number(match[1]),b = Number(match[2]);
      assert.equal(b,d); assert.equal(Number(step.answer),a*b);
      if (trial !== null) assert.equal(a,trial);
      else { assert.equal(n < d,true); assert.equal(a,1); trial = 1; }
      product = a*b; computedProducts.push([a,product]); pendingAdjustment = false;
    } else if (index < steps.length-1) {
      const next = Number(step.answer);
      if (trial === null) {
        assert.equal(estimateSeen,true);
        assert.equal(next,Math.min(9,nearestTen(n)/nearestTen(d)));
      } else {
        assert.equal(pendingAdjustment,false,'do not change trial twice without checking');
        assert.equal(next,trial+(product>n ? -1 : 1));
      }
      trial = next; pendingAdjustment = true;
    }
  });
  assert.equal(pendingAdjustment,false);
  assert.ok(computedProducts.some(([q,value])=>q===expected&&value===expected*d) || expected===0);
  if (expected*d !== n && expected < 9) assert.ok(computedProducts.some(([q,value])=>q===expected+1&&value>n),'must prove next digit is too large');
  return p;
}

test('all published examples are valid one-digit plans with checked arithmetic', () => {
  assert.ok(Q.examples.length >= 30);
  Q.examples.forEach(([n,d]) => audit(n,d));
});

test('bounded exhaustive oracle over eligible two-digit divisors and current numbers', () => {
  let count = 0;
  for (let d=10;d<=99;d++) for (let n=0;n<10*d;n++) {
    if (n>=d && nearestTen(n)%nearestTen(d)!==0) continue;
    audit(n,d); count++;
  }
  assert.ok(count>10000);
});

test('too-high, too-low, exact, cap-nine, repeated adjustment and internal zero', () => {
  const high = audit(266,33);
  assert.equal(high.estimate,9); assert.equal(high.digit,8);
  assert.equal(D.check('9',high.steps.find(s=>s.kind==='estimate')),true,'an initial estimate is not the final answer');
  assert.equal(D.check('8',high.steps.find(s=>s.kind==='estimate')),false);
  assert.deepEqual(high.steps.filter(s=>s.kind==='product').map(s=>s.answer),['297','264']);
  assert.deepEqual(audit(184,26).steps.filter(s=>s.kind==='product').map(s=>s.answer),['156','182','208']);
  assert.deepEqual(audit(84,21).steps.filter(s=>s.kind==='product').map(s=>s.answer),['84']);
  assert.equal(audit(296,31).estimate,10);
  assert.equal(audit(296,31).initialDigit,9);
  assert.deepEqual(audit(64,14).steps.filter(s=>s.kind==='product').map(s=>s.answer),['84','70','56']);
  assert.equal(audit(13,33).digit,0);
  assert.match(Q.make(7).task.prompt,/Внутри деления 10032 : 33/);
});

test('halfway rounding goes up and invalid plans cannot masquerade as one digit', () => {
  const p = audit(235,25);
  assert.equal(p.roundedN,240); assert.equal(p.roundedD,30);
  for (const args of [[330,33],[-1,33],[100,0],[100,9],[100,100],[10.5,20],[100,21.5],[NaN,33],[Infinity,33],[266,35]]) {
    assert.throws(()=>Q.plan(...args));
  }
});

test('seeded sources are stable, varied, fresh and ready for numeric managed steps', () => {
  assert.match(Q.make(1).task.prompt,/266 : 33/);
  assert.deepEqual(Q.make(0),Q.make(1));
  const variants = new Set();
  for (let seed=1;seed<=Q.examples.length;seed++) {
    const source = Q.make(seed);
    assert.equal(source.family,'division'); assert.equal(source.title,Q.title);
    assert.equal(source.task.kind,'input'); assert.ok(source.lessons.length>=3);
    assert.deepEqual(source,Q.make(seed));
    for (const l of source.lessons) {
      assert.equal(l.question.kind,'input'); assert.match(l.question.answer,/^\d+$/);
      for (const key of ['title','short','lead','html']) assert.equal(typeof l[key],'string');
    }
    variants.add(source.task.prompt);
  }
  assert.equal(variants.size,Q.examples.length);
  const first = Q.make(1); first.steps[0].answer='broken'; first.lessons[0].question.answer='broken';
  assert.equal(Q.make(1).steps[0].answer,'30'); assert.equal(Q.make(1).lessons[0].question.answer,'50');
  assert.ok(Object.isFrozen(Q.examples)); assert.ok(Object.isFrozen(Q.examples[0]));
  assert.deepEqual(Q.make(4294967295),Q.make(4294967295));
  for (const seed of [-1,1.5,NaN,4294967296,'1',null]) assert.throws(()=>Q.make(seed));
});

test('current questions do not print their answer equation; browser API is identical', () => {
  for (let seed=1;seed<=Q.examples.length;seed++) for (const s of Q.make(seed).steps) {
    assert.doesNotMatch(s.prompt,new RegExp('=\\s*'+s.answer+'(?:\\D|$)'));
    assert.doesNotMatch(s.prompt,/Берём \d|Пишем \d|[кК]ратн|[дД]елител|[дД]елим[оы]е|[гГ]рупп/);
  }
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../trainers/oge-basics/multiplication-division/quotient-estimate-core.js'),'utf8'),sandbox);
  assert.equal(sandbox.QuotientEstimate.id,Q.id);
  assert.equal(JSON.stringify(sandbox.QuotientEstimate.make(1)),JSON.stringify(Q.make(1)));
});
