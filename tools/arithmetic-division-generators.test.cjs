'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');
const C=require('../trainers/oge-basics/multiplication-division/division-course-core.js');
const Q=require('../trainers/oge-basics/multiplication-division/quotient-estimate-core.js');
const D=require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
const prefix='multiplication-division/course-';
const edgeSeeds=[0,1,2,36,37,38,99998,99999,100000,999999,1000000000,2147483648,4294967295];
const identity=source=>JSON.stringify({prompt:source.task.prompt,divisionTask:source.divisionTask});
const nearestTen=n=>n-n%10+(n%10>=5?10:0);
const number=s=>Number(String(s).replace(',','.'));

function common(source) {
  assert.ok(Buffer.byteLength(JSON.stringify(source),'utf8')<60000,'UTF-8 wire size keeps headroom for the envelope');
  assert.ok(source.task.prompt.length<4000);
  assert.ok(source.steps.length>0&&source.steps.length<150);
  for(const action of source.steps) {
    assert.equal(D.check(action.answer,action),true);
    assert.equal(D.check('-1',action),false);
    assert.doesNotMatch(action.error,/\d/,'automatic retry must not reveal the answer');
    if(['digit','bring'].includes(action.kind))assert.match(action.answer,/^\d$/);
  }
}

function estimateOracle(source) {
  common(source);
  const match=source.task.prompt.match(/(\d+) : (\d+)/);
  assert.ok(match,'the actual arithmetic condition is in the fingerprint');
  const n=Number(match[1]),d=Number(match[2]),answer=Math.floor(n/d),steps=source.steps;
  assert.ok(d>=10&&d<=99&&n>=0&&n<10*d);
  assert.equal(number(steps.at(-1).answer),answer);
  assert.ok(answer*d<=n&&(answer+1)*d>n);
  if(n<d) {
    assert.match(source.task.prompt,/уже начали делить/);
    assert.equal(steps.length,2);assert.equal(number(steps[0].answer),d);
    return 'zero';
  }
  const rn=nearestTen(n),rd=nearestTen(d),estimate=rn/rd;
  assert.equal(rn%rd,0,'the rounding task does not require a fractional estimate');
  assert.deepEqual(steps.slice(0,4).map(s=>number(s.answer)),[rd,rn,estimate,Math.min(9,estimate)]);
  for(const step of steps.filter(s=>s.kind==='product')) {
    const m=step.prompt.match(/(\d+) × (\d+) = \?/);
    assert.ok(m);assert.equal(number(step.answer),Number(m[1])*Number(m[2]));
  }
  assert.ok(steps.length<=12,'only a short bounded correction sequence');
  return estimate>9?'cap':estimate>answer?'high':estimate<answer?'low':n%d===0?'exact':'same';
}

function microOracle(stage,source) {
  common(source);
  assert.equal(source.divisionTask,null);
  assert.equal(source.divisionTasks.length,3);
  assert.equal(new Set(source.divisionTasks.map(g=>g.prompt)).size,3);
  assert.equal(source.task.prompt,source.divisionTasks.map(g=>g.prompt).join(' · '));
  source.divisionTasks.forEach((group,i)=>{
    assert.equal(group.startIndex,i?source.divisionTasks[i-1].endIndex:0);
    assert.equal(group.endIndex,i===2?source.steps.length:source.divisionTasks[i+1].startIndex);
    const actions=source.steps.slice(group.startIndex,group.endIndex);
    assert.ok(actions.every(a=>a.taskIndex===i));
    const m=group.prompt.match(/^(\d+) ([×−]|:) (\d+)/);
    assert.ok(m);const a=Number(m[1]),b=Number(m[3]);
    if(stage.slug==='multiply-bridge') {
      assert.ok(a>=2&&a<=9&&b>=2&&b<=9);
      assert.deepEqual(actions.map(s=>number(s.answer)),[a*b,a]);
    } else if(stage.slug==='multiply-two-digit') {
      assert.ok(a>=2&&a<=9&&b>=11&&b<=49);
      assert.deepEqual(actions.map(s=>number(s.answer)),[a*(b-b%10),a*(b%10),a*b]);
    } else if(stage.slug==='digit-choice') {
      const q=Math.floor(a/b);
      assert.ok(b>=2&&b<=9&&q>=1&&q<=9);
      assert.equal(number(actions[0].answer),q);
      assert.equal(number(actions[1].answer),q*b);
      assert.equal(number(actions.at(-1).answer),q);
      if(q<9&&a% b)assert.equal(number(actions[2].answer),(q+1)*b);
      if(q===9)assert.equal(actions.length,3,'there is no two-digit trial after 9');
    } else if(stage.slug==='subtract') {
      assert.ok(a>b&&b>=10);
      assert.equal(number(actions.at(-1).answer),a-b);
      if(i<2) {
        const borrow=a%10<b%10;
        assert.equal(borrow,i===1,'no borrow, then one borrow');
        assert.deepEqual(actions.map(s=>number(s.answer)),[(a%10+(borrow?10:0))-b%10,Math.floor(a/10)-(borrow?1:0)-Math.floor(b/10),a-b]);
      } else {
        assert.equal(a%100,0);assert.ok(a-b>=1&&a-b<=9);
        assert.deepEqual(actions.map(s=>number(s.answer)),[10,9,a-b,0,0,a-b]);
      }
    } else {
      const digits=String(a);let index=0,first=Number(digits[0]);
      while(first<b&&index<digits.length-1){index++;first=first*10+Number(digits[index]);}
      assert.ok(a>=100&&a<=999&&a%b===0);
      assert.ok(!String(a/b).includes('0'),'no internal-zero skill before its stage');
      const visual=actions[0].visual;
      assert.equal(visual.digits,String(a));assert.equal(visual.divisor,String(b));
      if(stage.slug==='first-part') {
        assert.equal(number(actions[0].answer),first);assert.equal(visual.sourceIndex,index);
      } else {
        const next=Number(digits[index+1]),remainder=first%b;
        assert.ok(index+1<digits.length,'a next digit actually exists');
        assert.deepEqual(actions.map(s=>number(s.answer)),[next,remainder*10+next]);
        assert.equal(visual.sourceIndex,index+1);assert.equal(visual.remainder,remainder);
      }
    }
  });
}

test('legacy seeded sources remain byte-identical to base 7183175',()=>{
  // Captured before editing either core: 135 seeds × (17 course + estimate).
  const seeds=[...Array.from({length:128},(_,i)=>i),99998,99999,100000,999999,1000000000,2147483648,4294967295];
  const hash=crypto.createHash('sha256');
  for(const seed of seeds) {
    hash.update(JSON.stringify(Q.make(seed)));
    for(const stage of C.stages)hash.update(JSON.stringify(C.make(stage.id,seed)));
  }
  assert.equal(hash.digest('hex'),'c6a0b5e0a008496216f1daf4a27f519c2e1d1894df6216789a7022990fece169');
});

test('estimate v2 expands the 37-example cycle and covers all correction outcomes',()=>{
  const identities=new Set(),outcomes=new Set();
  for(let seed=1;seed<=10000;seed++) {
    const source=Q.makeV2(seed);
    identities.add(identity(source));outcomes.add(estimateOracle(source));
    if(seed<=3000)assert.equal(identities.size,seed,'no repeat across the first 3000 attempts');
  }
  assert.ok(identities.size>=8500,'thousands of actual number pairs, without seed text in the condition');
  assert.deepEqual([...outcomes].sort(),['cap','exact','high','low','same','zero']);
  assert.match(Q.makeV2(1).task.prompt,/266 : 33/);
  for(const seed of edgeSeeds) {
    estimateOracle(Q.makeV2(seed));
    assert.deepEqual(Q.makeV2(seed),Q.makeV2(seed));
  }
});

test('all six small-action stages have 3000 distinct attempts with independent arithmetic',()=>{
  for(const stage of C.stages.slice(0,6)) {
    const identities=new Set();let previous;
    for(let seed=1;seed<=3000;seed++) {
      const source=C.makeV2(stage.id,seed),key=identity(source);
      identities.add(key);assert.notEqual(key,previous);previous=key;
      microOracle(stage,source);
    }
    assert.equal(identities.size,3000,stage.slug);
    for(const seed of edgeSeeds) {
      const source=C.makeV2(stage.id,seed);
      microOracle(stage,source);assert.deepEqual(source,C.makeV2(stage.id,seed));
    }
  }
});

test('version 2 preserves full-division positions, independent checks and supported bounds',()=>{
  for(const stage of C.stages.slice(6))for(const seed of edgeSeeds) {
    const source=C.makeV2(stage.id,seed);
    common(source);
    if(stage.slug==='estimate') {
      estimateOracle(source);
      assert.equal(source.task.prompt,Q.makeV2(seed).task.prompt);
    } else assert.deepEqual(source,C.make(stage.id,seed),'unaffected generators keep their established difficulty');
  }
  for(const bad of [-1,1.5,NaN,Infinity,4294967296]) {
    assert.throws(()=>Q.makeV2(bad));assert.throws(()=>C.makeV2(prefix+'first-part',bad));
  }
});

test('browser core produces the same versioned source and still loads metadata alone',()=>{
  const sandbox={};
  for(const name of ['division-lab-core.js','quotient-estimate-core.js','division-course-core.js']) {
    vm.runInNewContext(fs.readFileSync(require.resolve('../trainers/oge-basics/multiplication-division/'+name),'utf8'),sandbox);
  }
  for(const seed of edgeSeeds) {
    assert.equal(JSON.stringify(sandbox.QuotientEstimate.makeV2(seed)),JSON.stringify(Q.makeV2(seed)));
    for(const stage of C.stages)assert.equal(JSON.stringify(sandbox.DivisionCourse.makeV2(stage.id,seed)),JSON.stringify(C.makeV2(stage.id,seed)));
  }
  const metadataOnly={};
  vm.runInNewContext(fs.readFileSync(require.resolve('../trainers/oge-basics/multiplication-division/division-course-core.js'),'utf8'),metadataOnly);
  assert.equal(JSON.stringify(metadataOnly.DivisionCourse.stages),JSON.stringify(C.stages));
});
