'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const C=require('../trainers/oge-basics/multiplication-division/division-course-core.js');
const D=require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
const Q=require('../trainers/oge-basics/multiplication-division/quotient-estimate-core.js');
const prefix='multiplication-division/course-';
const value=x=>Number(String(x).replace(',','.'));
const banned=/делим(?:ое|ого)|делител|частн(?:ое|ого|ом|ым)|кратн|произведен|разряд|групп/i;
const fingerprint=t=>t.dividend+' : '+t.divisor;
function quotientOracle(task,answer) {
  const a=value(task.dividend),b=value(task.divisor);
  const expected=task.level==='remainder'?Math.floor(a/b):a/b;
  assert.ok(Math.abs(value(answer)-expected)<1e-8,`${a} : ${b} has answer ${expected}, got ${answer}`);
}
function audit(id,seed) {
  const s=C.make(id,seed),stage=C.stageFor(id);
  assert.equal(s.family,'division');assert.equal(s.title,stage.title);
  assert.ok(Buffer.byteLength(JSON.stringify(s),'utf8')<60000,'wire-size headroom below the 64KB envelope');
  assert.ok(s.task.prompt.length<4000);
  assert.ok(s.lessons.length>=1);assert.ok(s.steps.length>=1&&s.steps.length<150);
  assert.deepEqual(s,C.make(id,seed),'deterministic variant');
  for(const l of s.lessons) {
    assert.equal(l.question.kind,'input');
    for(const key of ['title','short','lead','html'])assert.doesNotMatch(l[key],banned);
    assert.doesNotMatch(l.question.prompt,banned);
  }
  for(const step of s.steps) {
    assert.equal(typeof step.answer,'string');
    assert.equal(D.check(step.answer,step),true);
    assert.equal(D.check('-999',step),false);
    if(step.kind==='digit'||step.kind==='bring') {
      assert.match(step.answer,/^\d$/);assert.equal(D.check(step.answer+'0',step),false);
    }
    for(const key of ['prompt','hint','error','record'])assert.doesNotMatch(step[key],banned);
    assert.doesNotMatch(step.error,/\d/,'incorrect answer feedback must not reveal an answer');
    assert.notEqual(step.error,step.hint);
  }
  if(s.divisionTasks.length) {
    assert.equal(s.divisionTasks[0].startIndex,0);
    assert.equal(s.divisionTasks.at(-1).endIndex,s.steps.length);
    s.divisionTasks.forEach((g,i)=>{
      if(i)assert.equal(g.startIndex,s.divisionTasks[i-1].endIndex);
      assert.ok(g.endIndex>g.startIndex);
      assert.ok(s.steps.slice(g.startIndex,g.endIndex).every(a=>a.taskIndex===i));
    });
  }
  if(s.divisionTask) {
    s.divisionTasks.forEach(g=>{
      const expected=D.plan(g.task),actual=s.steps.slice(g.startIndex,g.endIndex);
      assert.equal(actual.length,expected.actions.length,'board action indexes remain intact');
      actual.forEach((a,i)=>{
        const e=expected.actions[i];
        for(const key of ['kind','answer','cycle','sourceIndex','appended'])assert.equal(a[key],e[key],key);
      });
      quotientOracle(g.task,actual.find(a=>a.kind==='answer').answer);
      const remainder=actual.find(a=>a.kind==='final-remainder');
      if(remainder)assert.equal(value(remainder.answer),value(g.task.dividend)%value(g.task.divisor));
      assert.equal(value(actual.at(-1).answer),value(g.task.dividend));
    });
  }
  if(stage.guidance==='check') {
    assert.equal(s.divisionTask,null,'no answer-filled board in independent checks');
    assert.equal(s.divisionTasks.length,3);assert.equal(s.steps.length,3);
    assert.equal(new Set(s.divisionTasks.map(g=>fingerprint(g.task))).size,3);
    s.divisionTasks.forEach((g,i)=>{
      assert.equal(s.steps[i].kind,'answer');quotientOracle(g.task,s.steps[i].answer);
      assert.doesNotMatch(s.steps[i].prompt,/=|Ответ:/);
    });
  }
  return s;
}

test('ordered, plain metadata loads without runtime dependencies',()=>{
  assert.equal(C.stages.length,17);
  assert.ok(Object.isFrozen(C.stages));
  const sandbox={};
  vm.runInNewContext(fs.readFileSync(require.resolve('../trainers/oge-basics/multiplication-division/division-course-core.js'),'utf8'),sandbox);
  C.stages.forEach((s,i)=>{
    assert.equal(s.order,i+1);assert.equal(s.id,prefix+s.slug);
    assert.equal(s.prerequisite,i?C.stages[i-1].id:null);
    assert.ok(Object.isFrozen(s));assert.equal(C.has(s.id),true);
    for(const k of ['title','goal','action','support'])assert.doesNotMatch(s[k],banned);
  });
  assert.equal(JSON.stringify(sandbox.DivisionCourse.stages),JSON.stringify(C.stages));
  assert.equal(C.has('other'),false);assert.throws(()=>C.stageFor('other'));
});

test('all 17 stages preserve numerical answers and board positions across seeds',()=>{
  const seeds=[...Array.from({length:80},(_,i)=>i),99998,99999,100000,4294967295];
  C.stages.forEach(stage=>seeds.forEach(seed=>audit(stage.id,seed)));
});

test('micro exercises are distinct and independently agree with arithmetic',()=>{
  for(let seed=0;seed<80;seed++)for(const stage of C.stages.slice(0,6)) {
    const s=C.make(stage.id,seed);
    assert.equal(s.divisionTask,null);assert.equal(s.divisionTasks.length,3);
    assert.equal(new Set(s.divisionTasks.map(g=>g.prompt)).size,3);
    s.divisionTasks.forEach((g,index)=>{
      const a=s.steps.slice(g.startIndex,g.endIndex);
      if(stage.slug==='multiply-bridge') {
        const m=g.prompt.match(/^(\d+) × (\d+)/),x=+m[1],y=+m[2];
        assert.equal(value(a[0].answer),x*y);assert.equal(value(a[1].answer),x);
      } else if(stage.slug==='digit-choice') {
        const [n,d]=g.prompt.split(' : ').map(Number),q=Math.floor(n/d);
        assert.equal(value(a[0].answer),q);assert.equal(value(a.at(-1).answer),q);
        assert.equal(value(a[1].answer),q*d);
        if(n!==q*d)assert.equal(value(a[2].answer),(q+1)*d);
      } else if(stage.slug==='multiply-two-digit') {
        const [x,y]=g.prompt.split(' × ').map(Number);
        assert.deepEqual(a.map(t=>value(t.answer)),[x*Math.floor(y/10)*10,x*(y%10),x*y]);
      } else if(stage.slug==='subtract') {
        const [x,y]=g.prompt.split(' − ').map(Number);
        assert.equal(value(a.at(-1).answer),x-y);
        if(index===0)assert.ok(x%10>=y%10);
        if(index===1)assert.ok(x%10<y%10&&Math.floor(x/10)>Math.floor(y/10));
        if(index===2) {
          assert.equal(x%100,0);assert.equal(a.length,6);
          assert.deepEqual(a.map(t=>value(t.answer)),[10,9,x-y,0,0,x-y]);
        }
      } else {
        const m=g.prompt.match(/^(\d+) : (\d+)/),n=m[1],d=+m[2];
        let pos=0,first=+n[pos];while(first<d){pos++;first=first*10+Number(n[pos]);}
        if(stage.slug==='first-part') {
          assert.equal(value(a[0].answer),first);assert.equal(a[0].visual.sourceIndex,pos);
          assert.equal(a[0].visual.kind,'first');
        } else {
          const rem=first%d,next=Number(n[pos+1]);
          assert.deepEqual(a.map(t=>value(t.answer)),[next,rem*10+next]);
          for(const step of a){assert.equal(step.visual.kind,'bring');assert.equal(step.visual.sourceIndex,pos+1);assert.equal(step.visual.remainder,rem);}
        }
      }
    });
  }
});

test('difficulty grows without a hidden zero lesson before the zero stage',()=>{
  for(let seed=0;seed<200;seed++) {
    for(const slug of ['whole-simple','simple-check','whole-two-digit']) {
      const s=C.make(prefix+slug,seed);
      for(const g of s.divisionTasks){const q=value(g.task.dividend)/value(g.task.divisor);assert.ok(q>=12&&q<=99);assert.doesNotMatch(String(q),/0/);}
    }
    const full=C.make(prefix+'whole-simple',seed);
    assert.equal(full.divisionTasks.length,2);assert.notEqual(fingerprint(full.divisionTasks[0].task),fingerprint(full.divisionTasks[1].task));
    const first=full.steps.slice(0,full.divisionTasks[0].endIndex),second=full.steps.slice(full.divisionTasks[1].startIndex);
    assert.match(first.find(s=>s.kind==='product').prompt,/\d/);
    assert.doesNotMatch(second.find(s=>s.kind==='product').prompt,/\d/);
    const earlyConditions=full.divisionTasks.map(g=>g.prompt);
    assert.ok(C.make(prefix+'simple-check',seed).divisionTasks.every(g=>!earlyConditions.includes(g.prompt)),'simple check is fresh relative to the same seeded practice');
    const zero=C.make(prefix+'zeros',seed),zeroPlan=D.plan(zero.divisionTask);
    assert.ok(zeroPlan.cycles.some((c,i)=>i>0&&c.qd===0));
    const independent=C.make(prefix+'independent-check',seed),tasks=independent.divisionTasks.map(g=>g.task);
    assert.ok(D.plan(tasks[0]).cycles.some((c,i)=>i>0&&c.qd===0));
    assert.ok(tasks[1].divisor.includes(','));
    assert.ok(D.plan(tasks[2]).actions.some(a=>a.appended));
    assert.ok(!['84 : 4','96 : 3','1 : 4','8 : 2,5','1005 : 5'].some(demo=>tasks.some(t=>fingerprint(t)===demo)));
    const practiced=['whole-simple','whole-two-digit','zeros','remainder','decimal-natural','append-zeros','decimal-divisor','mixed-guided'].flatMap(slug=>C.make(prefix+slug,seed).divisionTasks.map(g=>g.prompt));
    assert.ok(tasks.every(t=>!practiced.includes(fingerprint(t))),'final checks are fresh relative to same-seed guided examples');
  }
});

test('rounding stage keeps separate trial and final answers, and automatic errors reveal neither',()=>{
  const s=C.make(prefix+'estimate',1),q=Q.make(1);
  assert.deepEqual(s.steps.map(a=>[a.kind,a.answer]),q.steps.map(a=>[a.kind,a.answer]));
  assert.equal(s.steps.find(a=>a.kind==='estimate').answer,'9');assert.equal(s.steps.at(-1).answer,'8');
  for(const step of s.steps)assert.doesNotMatch(step.error,/\d/);
});

test('fresh source data, varied variants and numeric seed validation',()=>{
  for(const stage of C.stages) {
    const first=C.make(stage.id,1),again=JSON.stringify(first);
    first.steps[0].answer='changed';first.lessons[0].question.answer='changed';
    assert.equal(JSON.stringify(C.make(stage.id,1)),again);
    assert.notDeepEqual(C.make(stage.id,1).steps,C.make(stage.id,2).steps);
    assert.notEqual(C.make(stage.id,1).task.prompt,C.make(stage.id,2).task.prompt,'question identity includes actual conditions, not only the stage goal');
    for(const seed of [-1,1.5,NaN,4294967296,'1',null])assert.throws(()=>C.make(stage.id,seed));
  }
});
