/* Independent source/units/answer gate; generator answers are checked from displayed equations with rational arithmetic. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadTrainer} from './oge-algebra-contract.lib.mjs';
import {check} from './oge-algebra-contract.t12.mjs';
const file='trainers/oge-task12-formulas-trainer.html';
const registry=JSON.parse(fs.readFileSync('trainers/oge-task12-sources.json','utf8'));
const source=fs.readFileSync(file,'utf8');
const original=execFileSync('git',['show',registry.baseCommit+':'+file],{encoding:'utf8',maxBuffer:2**22});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const blocks=s=>[...s.matchAll(/GENS\.push\(\{t:\d+,make:function\(\)\{[\s\S]*?\n\}\}\);/g)].map(m=>m[0]);
const currentBlocks=blocks(source),oldBlocks=blocks(original);
assert.equal(registry.generators.length,40);assert.equal(currentBlocks.length,40);assert.equal(oldBlocks.length,40);
for(const r of registry.generators){
 assert.equal(r.generatorSha256,hash(currentBlocks[r.index]),r.id+' registry stale');
 assert.equal(r.originalGeneratorSha256,hash(oldBlocks[r.index]),r.id+' baseline stale');
 assert.equal(r.verbatimFipi,false);assert.equal(typeof r.constraintsAndUnits,'string');assert.match(r.constraintsAndUnits,/\S/);
 if(r.sourceId){const ref=registry.sources[r.sourceId];assert.ok(ref.url.startsWith('https://'));assert.ok(ref.locator.includes('№12'));assert.match(ref.fileSha256,/^[a-f0-9]{64}$/);}
}
let sampled=0,domainCases=0,negativeControls=0;
for(const [label,html] of [['original',original],['current',source]]){
 const T=loadTrainer(file,{html,seed:20261105});
 for(let i=0;i<40;i++){
  const tasks=JSON.parse(T.run(`JSON.stringify(Array.from({length:1000},()=>GENS[${i}].make()))`));
  for(const task of tasks){assert.deepEqual(check(task),[],label+' g'+i+' '+task.story);assert.ok(Number.isFinite(task.answer));sampled++;}
  const task=tasks[0];assert.ok(check({...task,answer:task.answer+1}).length>0,'wrong-answer mutant must fail');negativeControls++;
 }
}
const T=loadTrainer(file,{seed:20261105});
const gen=(i,randoms)=>JSON.parse(T.run(`(()=>{const old=Math.random,queue=${JSON.stringify(randoms)};Math.random=()=>queue.length?queue.shift():0.413;try{return JSON.stringify(GENS[${i}].make());}finally{Math.random=old}})()`));
const rnd=(v,a,b)=>(v-a+0.1)/(b-a+1);
function verify(i,randoms,expected){const task=gen(i,randoms);assert.deepEqual(check(task),[],task.generatorId);assert.ok(Math.abs(task.answer-expected)<1e-8,task.generatorId+' domain answer');assert.ok(task.distract.every(d=>Math.abs(d.v-task.answer)>1e-8));domainCases++;return task;}
for(let t=20;t<=300;t++)verify(1,[rnd(t,20,300)],33*t);
for(let a=10;a<=25;a++)for(let b=8;b<=25;b++)for(let t=6;t<=45;t++)verify(4,[rnd(a,10,25),rnd(b,8,25),rnd(t,6,45)],10*a+b*(t-5));
for(let d=4;d<=30;d++)for(let e=3;e<=20;e++)verify(7,[rnd(d,4,30),rnd(e,3,20)],d);
for(let v=1;v<=900;v++)verify(13,[rnd(v,1,900)],9.8*v);
for(let c=20;c<=90;c++)verify(14,[rnd(c,20,90)],32-1.8*c);
for(let a=50;a<=80;a++)for(let b=30;b<=50;b++)for(let n=3;n<=20;n++)verify(16,[rnd(a,50,80),rnd(b,30,50),rnd(n,3,20)],100*a+100*b*n);
for(let i=3;i<=15;i++)for(let r=3;r<=30;r++)verify(18,[rnd(i,3,15),rnd(r,3,30)],r);
for(let m=3;m<=35;m++)for(let h=2;h<=25;h++)verify(23,[rnd(m,3,35),rnd(h,2,25)],m);
for(let c=1;c<=9;c++)for(let u=3;u<=30;u++)verify(29,[rnd(c,1,9),rnd(u,3,30)],c*u*u/20000);
// Lower/upper random endpoints for every retained generator, including guarded choices.
for(let i=0;i<40;i++)for(const edge of [0,0.999999]){const task=gen(i,Array(180).fill(edge));assert.deepEqual(check(task),[],`edge ${i}/${edge}`);}
for(let k=0;k<100;k++){
 const quiz=JSON.parse(T.run('JSON.stringify(buildQuiz12())'));assert.equal(quiz.length,10);assert.equal(new Set(quiz.map(t=>t.t)).size,10);assert.ok(quiz.every(t=>t.sourceId));
}
const admission=JSON.parse(T.run('JSON.stringify(gensFor("exam",0).map(g=>g.id))'));
assert.deepEqual(admission,registry.generators.filter(r=>r.examEligible).map(r=>r.id));
assert.equal(admission.length,11);
for(let type=1;type<=10;type++)assert.ok(registry.generators.some(r=>r.type===type&&r.examEligible));
for(const [raw,value] of [['14 Ом',14],['98 Н',98],['−40 °F',-40],['0,00045 Дж',0.00045],['3 м³',3],['12 см²',12]])assert.equal(T.run(`parseAns(${JSON.stringify(raw)}).value`),value);
assert.equal(T.run('near(0.00045,0.000451)'),false,'one extra millionth is not the exact capacitor answer');
// Physics invariants that cannot be established by algebra alone.
assert.match(currentBlocks[3],/постоянного тока/);assert.match(currentBlocks[5],/высотой 200 см/);assert.ok(60+9*12<200);
assert.match(currentBlocks[6],/Велосипедист/);assert.doesNotMatch(currentBlocks[6],/Турист прошёл/);
assert.match(currentBlocks[20],/покоящегося/);assert.match(currentBlocks[21],/вдоль прямолинейного перемещения/);
assert.match(currentBlocks[25],/см\/кг/);assert.match(currentBlocks[25],/упругой деформации/);
for(const i of [11,28])assert.match(currentBlocks[i],/половина ускорения|половина ускорения/);
assert.match(currentBlocks[34],/заёмные средства/);
assert.match(source,/var TID="oge-t12-formuly"/);assert.match(source,/var KEY="mathExamCourseProgress.v1"/);assert.match(source,/var OLD_KEY="mx-oge12-v1"/);
const report={status:'PASS',generators:40,sourceLinked:11,teachingOnly:29,sampled,domainCases,edgeCases:80,negativeControls,quizSamples:100};
fs.mkdirSync('artifacts/oge12-source-audit',{recursive:true});fs.writeFileSync('artifacts/oge12-source-audit/math.json',JSON.stringify(report,null,2)+'\n');console.log('OGE12_SOURCE_AUDIT_OK '+JSON.stringify(report));
