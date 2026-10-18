'use strict';
const assert=require('node:assert/strict');
const M=require('../trainers/oge-basics/multiplication-division/multiplication-column-core');
const D=require('../trainers/oge-basics/multiplication-division/division-lab-core');
const clone=x=>JSON.parse(JSON.stringify(x));
const rowValue=row=>Object.entries(row).reduce((sum,[col,digit])=>sum+Number(digit)*10**Number(col),0);
let examples=0,steps=0,restores=0;
function verify(a,b){
 const id=M.stages[b<10?0:1].id,actions=M.plan(a,b),spec={contentId:id,task:{multiplication:{a,b}},steps:actions},answers=[];
 const original=JSON.stringify(spec);
 for(let index=0;index<actions.length;index++){
  const q=actions[index],before=M.layout(spec,{answers});
  assert(!D.check('99999999',q));
  assert(D.check(q.answer,q));
  if(q.kind==='digit')assert(/^[0-9]$/.test(q.answer));
  // Every visible cell must have been explicitly written by a prior accepted action.
  for(const [name,row] of Object.entries(before.rows))for(const [col,value] of Object.entries(row)){
   assert(actions.slice(0,index).some(p=>p.multiplication.effects.some(e=>!e.carry&&e.row===name&&String(e.col)===col&&String(e.digit)===value)));
  }
  if(q.multiplication.event==='write'){
   assert.equal(before.rows[q.multiplication.row][q.multiplication.col],undefined,'The active result cell is empty before its answer');
   assert(M.board(spec,{answers}).includes('□'),'Current write target is visible');
  }
  const prefix=clone({answers});
  assert.deepEqual(M.layout(clone(spec),prefix),before,'Restored work has identical visible cells');
  if(index===Math.floor(actions.length/2)){assert.equal(JSON.stringify(prefix),JSON.stringify({answers}));restores++;}
  answers.push(q.answer);steps++;
 }
 const finished=M.layout(spec,{answers});
 assert.equal(rowValue(finished.rows.RES),Number(BigInt(a)*BigInt(b)),'Independent integer multiplication oracle');
 if(b>=10){
  assert.equal(rowValue(finished.rows.P1),a*(b%10));
  assert.equal(rowValue(finished.rows.P2),a*Math.floor(b/10)*10);
  assert.equal(finished.rows.P2[0],undefined,'The second product really starts one column left');
 }
 assert.equal(Number(actions.at(-1).answer),a*b);
 assert.deepEqual(M.layout(spec,{answers:['99999999',...answers.slice(1)]}).rows,{RES:{},P1:{},P2:{}},'Invalid prefix cannot reveal future cells');
 assert.equal(JSON.stringify(spec),original,'Rendering does not mutate saved task specs');
 examples++;
}
for(const [a,b] of [[23,4],[324,7],[999,9],[100,2],[101,8],[909,9],[23,14],[316,24],[125,23],[999,99],[105,50],[100,10],[99,99],[101,11],[909,91]])verify(a,b);
for(const stage of M.stages)for(let i=0;i<300;i++){
 const seed=(i*2654435761)>>>0,source=M.make(stage.id,seed);
 assert.deepEqual(M.make(stage.id,seed),source,'Deterministic generator');
 assert.equal(source.family,'multiplication');
 assert(source.task.multiplication.a>=12&&source.task.multiplication.a<=99,'Early lessons use two-digit upper numbers');
 assert(source.task.multiplication.b<50,'Early two-digit multipliers stay below 50');
 assert(source.steps.length&&source.steps.length<100);
 assert.equal(source.task.prompt,source.task.multiplication.a+' × '+source.task.multiplication.b);
 verify(source.task.multiplication.a,source.task.multiplication.b);
}
const one=M.make(M.stages[0].id,1),spec={...one,contentId:M.stages[0].id},q=one.steps[0];
for(const raw of [q.answer,q.answer+',0',q.answer+'.0000','000'+q.answer,' '+q.answer+' ','+'+q.answer,q.answer.slice(0,1)+' '+q.answer.slice(1),q.answer+'/1']){
 const expected=D.check(raw,q)?one.steps[1].multiplication.event:one.steps[0].multiplication.event;
 assert.equal(M.layout(spec,{answers:[raw]}).active.event,expected,'Board prefix validation matches DivisionLab.check for '+JSON.stringify(raw));
}
for(const q of one.steps)assert.equal(typeof q.cue,'string');
for(const bad of [-1,1.2,4294967296])assert.throws(()=>M.make(M.stages[0].id,bad));
assert.throws(()=>M.make('old-id',1));
assert.equal(M.board({contentId:'old-id'},{}),'');
console.log(JSON.stringify({result:'MULTIPLICATION_COLUMN_OK',examples,steps,restores,checks:['independent integer oracle','right-to-left carry','shifted second row','checked prefix only','no mutation','restore parity']}));
