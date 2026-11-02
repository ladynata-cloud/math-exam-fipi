import test from 'node:test';import assert from 'node:assert/strict';
import {SKILLS,PRACTICE_VERSION,ACTIVITIES,generatePractice,gradePractice,gradeActivity,activityData,adaptLevel,diagnosticTasks,parsePracticeNumber,counterexample,constructEquation,estimateTask,summarizePractice} from '../public/practice-core.js';
import {R,eq,mul,add} from '../src/math-kernel.js';
import {answerOffline} from '../src/tutor.js';
const descriptor=(skill='linear-equations',level=1,seed=1)=>({skill,level,seed,version:PRACTICE_VERSION});
test('generated tasks agree with independent math and the main exact tutor across 720 cases',()=>{
 let count=0;for(const skill of Object.keys(SKILLS))for(let level=1;level<=3;level++)for(let seed=0;seed<40;seed++){
  const d=descriptor(skill,level,seed),t=generatePractice(d),p=t.params;assert.equal(gradePractice(d,t.expected).status,'correct');
  if(skill==='arithmetic')assert(eq(parsePracticeNumber(t.expected),R(level===1?p.a+p.b:level===2?-p.a*p.b:(p.a+p.b)*p.c)));
  if(skill==='linear-equations')assert.equal(p.a*Number(t.expected)+p.b,p.c);
  if(skill==='fractions')assert(eq(parsePracticeNumber(t.expected),p.product?R(p.a*p.c,p.b*p.d):R(p.a*p.d+p.c*p.b,p.b*p.d)));
  if(skill==='percentages')assert(eq(parsePracticeNumber(t.expected),R(level===1?p.whole*p.p/100:level===2?p.whole:p.whole*(100+p.p)/100)));
  if(skill==='quadratic-equations')for(const root of t.expected.split(';').map(Number))assert.equal(p.a*root*root+p.b*root+p.c,0);
  if(skill==='pythagoras'){assert.equal(p.a*p.a+p.b*p.b,p.c*p.c);assert.equal(Number(t.expected),p.leg?p.b:p.c);}
  const checked=answerOffline({topic:skill,question:t.question,attempt:t.expected});assert.equal(checked.verification,'deterministic',t.question);assert.equal(checked.attemptStatus,'correct',t.question);assert.doesNotThrow(()=>JSON.stringify(t));count++;
 }assert.equal(count,720);
 for(const skill of Object.keys(SKILLS)){const qs=new Set(Array.from({length:100},(_,seed)=>generatePractice(descriptor(skill,2,seed)).question));assert(qs.size>=12,skill+' '+qs.size);}
});
test('known error labels require a matching computed wrong result; unknown failures remain unknown',()=>{
 for(const skill of ['arithmetic','fractions','linear-equations','percentages','pythagoras']){const d=descriptor(skill,2,41),t=generatePractice(d);for(const w of t.wrong){const g=gradePractice(d,w.value);if(g.status==='correct')continue;assert.equal(g.errorType,w.type);assert(g.prerequisite);}}
 const d=descriptor();assert.equal(gradePractice(d,'999999').errorType,'unclassified');assert.equal(gradePractice(d,'не знаю').status,'unsupported');assert.equal(gradePractice(d,null).status,'unsupported');
 assert.equal(gradePractice(descriptor('fractions',1,3),'1/0').status,'unsupported');
});
test('transparent adaptation requires two task outcomes and does not treat unsupported notation as an error',()=>{
 const correct={status:'correct',helped:false},wrong={status:'incorrect',helped:false};let s=adaptLevel({level:1},correct);assert.equal(s.level,1);s=adaptLevel(s,correct);assert.equal(s.level,2);s=adaptLevel(s,wrong);assert.equal(s.level,2);s=adaptLevel(s,wrong);assert.equal(s.level,1);
 assert.equal(adaptLevel({level:2,streak:1,errors:0},{status:'unsupported'}).streak,1);
 let assisted=adaptLevel({level:3},{status:'correct',helped:true});assisted=adaptLevel(assisted,{status:'correct',helped:true});assert.equal(assisted.level,2);
 assert.equal(diagnosticTasks(2).length,4);assert.equal(new Set(diagnosticTasks(2).map(d=>d.skill)).size,4);
});
test('ten reasoning modes grade the actual mathematical requirement',()=>{
 for(const skill of Object.keys(SKILLS))for(const level of [1,2,3]){const d=descriptor(skill,level,37),t=generatePractice(d);
  assert.equal(gradeActivity(d,'missing',t.missing.answer).status,'correct');
  const error=activityData(d,'error');assert.equal(gradeActivity(d,'error',error.correctIndex).status,'correct');assert.equal(gradeActivity(d,'error',(error.correctIndex+1)%error.steps.length).status,'incorrect');
  assert.equal(gradeActivity(d,'order',t.steps.map((_,i)=>i)).status,'correct');assert.equal(gradeActivity(d,'order',t.steps.map((_,i)=>i).reverse()).status,'incorrect');
  assert.equal(gradeActivity(d,'plan','0').status,'correct');assert.equal(gradeActivity(d,'plan','2').status,'incorrect');
  const estimate=estimateTask(t);assert.equal(gradeActivity(d,'estimate',estimate).status,'correct');assert.equal(gradeActivity(d,'estimate',{sign:'none',band:estimate.band}).status,'incorrect');
  assert.equal(gradeActivity(d,'plausibility','1').status,'correct');assert.equal(gradeActivity(d,'plausibility','0').status,'incorrect');
  assert.equal(gradeActivity(d,'contrast',['common','product']).status,'correct');assert.equal(gradeActivity(d,'contrast',['product','common']).status,'incorrect');
  for(const mode of Object.keys(ACTIVITIES))assert.doesNotThrow(()=>JSON.stringify(activityData(d,mode)));
 }
 assert.equal(counterexample(0,'2').status,'correct');assert.equal(counterexample(0,'1').status,'incorrect');assert.equal(counterexample(1,'1/2').status,'correct');assert.equal(counterexample(1,'-1').status,'incorrect');assert.equal(counterexample(2,'-1').status,'correct');
 for(let seed=0;seed<30;seed++){const root=seed%11-5;assert.equal(constructEquation(seed,`3;2;${3*root+2}`).status,'correct');assert.equal(constructEquation(seed,'0;2;2').status,'incorrect');}
});
test('session summary distinguishes help and latest unresolved skill; unsupported input does not reduce ability',()=>{
 const s=summarizePractice([{skill:'fractions',status:'incorrect',helped:false},{skill:'fractions',status:'correct',helped:false},{skill:'arithmetic',status:'correct',helped:true},{skill:'linear-equations',status:'unsupported',helped:false}]);
 assert.deepEqual(s,{independent:1,withHelp:1,difficult:['arithmetic'],checked:3});
 for(const d of [{skill:'unknown',level:1,seed:1},{skill:'fractions',level:0,seed:1},{skill:'fractions',level:1,seed:NaN},{skill:'fractions',level:1,seed:-1},{skill:'fractions',level:1,seed:1,version:'forged'}])assert.throws(()=>generatePractice(d));
});
