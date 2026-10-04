'use strict';
const assert=require('node:assert/strict');
const C=require('../board-server/learning-remediation-contracts');
const {taskSpec,state}=C.create('percentages/percent-final-checkpoint',12345);
assert.deepEqual(taskSpec.items.map(t=>t.skill),['base','part','whole','percent','apply','change','successive','prop','part','whole','change','apply']);
assert.deepEqual(C.create(taskSpec.contentId,12345).taskSpec,taskSpec,'The entire checkpoint must reproduce, including order, options and hints.');
const answer=q=>q.answer&&typeof q.answer==='object'?q.answer.n+'/'+q.answer.d:String(q.answer);
const answers=[];
for(let step=0;step<taskSpec.items.length;step++){
 const wrong=C.evaluate(taskSpec,{scope:'practice',step,answer:'99999999',answers});assert.deepEqual(wrong,{correct:false,complete:false});
 const result=C.evaluate(taskSpec,{scope:'practice',step,answer:answer(taskSpec.items[step]),answers});
 assert.deepEqual(result,{correct:true,complete:step===11});answers.push(answer(taskSpec.items[step]));
 const restored=C.normalize(taskSpec,{...state,answers:answers.slice(),step:answers.length,answer:'12,',hint:2,feedback:{kind:'incorrect',scope:'practice',step,answer:'99999999'}});
 assert.equal(restored.completed,step===11);assert.equal(restored.answer,'12,');assert.equal(restored.hint,2);
}
assert.throws(()=>C.evaluate(taskSpec,{scope:'practice',step:11,answer:answer(taskSpec.items[11]),answers:[]}));
assert.throws(()=>C.normalize(taskSpec,{...state,step:12,answers:[answer(taskSpec.items[0])],completed:true}));
const tampered=answers.slice();tampered[4]='99999999';assert.throws(()=>C.normalize(taskSpec,{...state,step:12,answers:tampered,completed:true}));
const mixed=C.create('multiplication-division/long-division-mixed-checkpoint',12345),D=require('../trainers/oge-basics/multiplication-division/division-lab-core');
assert.equal(mixed.taskSpec.divisionTasks.length,3);assert.equal(new Set(mixed.taskSpec.divisionTasks.map(t=>t.task.level)).size,3);
assert.deepEqual(C.create(mixed.taskSpec.contentId,12345),mixed);
const prefix=[];let count=0;
for(const [index,segment] of mixed.taskSpec.divisionTasks.entries()){
 assert.equal(segment.startIndex,count);const plan=D.plan(segment.task);assert.equal(segment.endIndex-segment.startIndex,plan.actions.length);
 for(const action of plan.actions){
  assert.deepEqual(C.evaluate(mixed.taskSpec,{scope:'step',step:count,answer:'99999999',answers:prefix}),{correct:false,complete:false});
  const result=C.evaluate(mixed.taskSpec,{scope:'step',step:count,answer:action.answer,answers:prefix});assert(result.correct);assert.equal(result.complete,count===mixed.taskSpec.steps.length-1);prefix.push(action.answer);count++;
 }
 const restored=C.normalize(mixed.taskSpec,{...mixed.state,step:count,answers:prefix.slice(),answer:'черновик',hint:2});assert.equal(restored.completed,index===2);
}
assert.throws(()=>C.evaluate(mixed.taskSpec,{scope:'step',step:mixed.taskSpec.steps.length-1,answer:prefix.at(-1),answers:[]}));
console.log(JSON.stringify({result:'LEARNING_REMEDIATION_CHECKPOINT_OK',percentQuestions:12,divisionProblems:3,divisionActions:count,checks:['all CHECK_PLAN skills','three distinct division levels','deterministic whole sequence','wrong answers cannot advance','completion only after full checkpoint','draft hint feedback restore','skipped steps rejected']}));
