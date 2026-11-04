'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const M=require('../trainers/oge-basics/multiplication-division/multiplication-column-core');
const D=require('../trainers/oge-basics/multiplication-division/division-lab-core');
const C=require('../trainers/oge-basics/learning-contracts');
const clone=x=>JSON.parse(JSON.stringify(x));
const rowValue=row=>Object.entries(row).reduce((sum,[col,digit])=>sum+BigInt(digit)*10n**BigInt(col),0n);
const prefix='multiplication-division/course-column-';
// Captured before edits from production 5c61b0bc12ad9aaebfdb8484cc9987bccb59474a.
// Preserve both published task generators AND their complete canonical task/state envelopes.
const legacyIds=['one-digit','two-digit'].map(name=>prefix+name);
const legacySeeds=[0,1,17,12345,4294967295,...Array.from({length:95},(_,i)=>Math.imul(i+1,2654435761)>>>0)];
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(legacySeeds.length,100);assert.equal(new Set(legacySeeds).size,100);
assert.equal(digest(legacyIds.flatMap(id=>legacySeeds.map(seed=>[id,seed,M.make(id,seed)]))),'94a21172a4a8bbc344312526263dc8860a44c33c6feae1247153181d56d8028b','200 published source specifications remain byte-identical');
assert.equal(digest(legacyIds.flatMap(id=>legacySeeds.map(seed=>[id,seed,C.create(id,seed)]))),'c73bd5e4ab921211027dcfe25d4741fe559e0b5bb8e6c7e5c831f0860dc92b44','200 published canonical task/state envelopes remain byte-identical');
assert.deepEqual(M.stages.map(stage=>stage.id),['one-digit','two-digit','three-by-one','four-by-one','three-by-two','two-by-three','three-by-three','zeros','mixed'].map(name=>prefix+name));
let examples=0,steps=0,restores=0,sumCarryTwo=0,zeroRows=0,maxSteps=0,maxBytes=0;
function verify(a,b,id=prefix+'mixed'){
 const actions=M.plan(a,b),spec={contentId:id,task:{multiplication:{a,b}},steps:actions},answers=[];
 const original=JSON.stringify(spec),bDigits=String(b).split('').reverse().map(Number),writes=new Set();
 maxSteps=Math.max(maxSteps,actions.length);
 const initial=M.layout(spec,{answers});
 assert(Object.values(initial.rows).every(row=>Object.keys(row).length===0));
 for(let index=0;index<actions.length;index++){
  const q=actions[index],before=M.layout(spec,{answers}),meta=q.multiplication;
  assert(!D.check('99999999',q));assert(D.check(q.answer,q));
  if(q.kind==='digit')assert(/^[0-9]$/.test(q.answer));
  // Independent arithmetic: evaluate the displayed integer equation, not the production plan.
  const expression=q.prompt.match(/(?:Умножь:|Прибавь \d+, которые перенесли:|Сложи:) ([\d +×]+) = \?$/)?.[1];
  if(expression){
   const terms=expression.split(' + ').map(term=>term.split(' × ').map(BigInt).reduce((a,b)=>a*b,1n));
   assert.equal(terms.reduce((a,b)=>a+b,0n),BigInt(q.answer),'Every shown calculation has the correct answer');
  }
  // Every visible result/carry cell must come from an accepted prior action.
  for(const [name,row] of Object.entries(before.rows))for(const [col,value] of Object.entries(row))assert(writes.has(name+':'+col+':'+value));
  for(const [name,row] of Object.entries(before.carries))for(const [col,value] of Object.entries(row))assert(writes.has('carry:'+name+':'+col+':'+value));
  if(meta.event==='write'){
   assert.equal(before.rows[meta.row][meta.col],undefined,'The current result cell has not been filled early');
   assert(M.board(spec,{answers}).includes('□'),'Current empty write target is visible');
  }
  const saved=clone({answers});
  assert.deepEqual(M.layout(clone(spec),saved),before,'Reload restores accepted digits and pending action exactly');
  if(index===Math.floor(actions.length/2))restores++;
  answers.push(q.answer);
  for(const effect of meta.effects)writes.add((effect.carry?'carry:':'')+effect.row+':'+effect.col+':'+effect.digit);
  if(meta.phase==='add'&&meta.event==='carry'&&q.answer==='2')sumCarryTwo++;
  steps++;
 }
 const finished=M.layout(spec,{answers});
 assert.equal(rowValue(finished.rows.RES),BigInt(a)*BigInt(b),'Independent integer multiplication oracle');
 if(b>=10)for(let i=0;i<bDigits.length;i++){
  const row=finished.rows['P'+(i+1)];
  assert.equal(rowValue(row),BigInt(a)*BigInt(bDigits[i])*10n**BigInt(i),'Each partial row has its own place value');
  for(let col=0;col<i;col++)assert.equal(row[col],undefined,'A partial row starts at its required shift');
  if(bDigits[i]===0){assert(Object.keys(row).length>0,'The zero row is still explicitly written');assert(Object.values(row).every(digit=>digit==='0'));zeroRows++;}
 }
 assert.equal(BigInt(actions.at(-1).answer),BigInt(a)*BigInt(b));
 assert.deepEqual(Object.values(M.layout(spec,{answers:['99999999',...answers.slice(1)]}).rows).map(row=>Object.keys(row).length),Object.values(initial.rows).map(()=>0),'Invalid prefix cannot reveal future cells');
 assert.equal(JSON.stringify(spec),original,'Rendering does not mutate saved task specs');
 examples++;
}
for(const [a,b] of [[23,4],[324,7],[999,9],[100,2],[101,8],[909,9],[23,14],[316,24],[125,23],[999,99],[105,50],[100,10],[99,99],[101,11],[909,91],[9999,9],[1000,9],[9009,8],[9999,99],[99,999],[999,999],[9999,999],[1111,111],[1001,101],[305,204],[9999,909],[9990,900],[2400,100],[1000,999],[9999,990]])verify(a,b);
const shapes={
 'one-digit':[2,1],'two-digit':[2,2],'three-by-one':[3,1],'four-by-one':[4,1],
 'three-by-two':[3,2],'two-by-three':[2,3],'three-by-three':[3,3]
};
const diversity={};
for(const stage of M.stages){
 const name=stage.id.slice(prefix.length),seen=new Set(),mixedShapes=new Set();
 for(let i=0;i<300;i++){
  const seed=(i*2654435761)>>>0,source=M.make(stage.id,seed),{a,b}=source.task.multiplication;
  assert.deepEqual(M.make(stage.id,seed),source,'Deterministic generator');
  assert.equal(source.family,'multiplication');
  assert(source.steps.length&&source.steps.length<100,'Existing saved-action bounds remain sufficient');
  assert.equal(source.task.prompt,a+' × '+b);
  if(shapes[name])assert.deepEqual([String(a).length,String(b).length],shapes[name]);
  if(name==='zeros')assert(/0/.test(String(a)+String(b)),'Every zero lesson actually contains a zero');
  if(legacyIds.includes(stage.id)){assert(a>=12&&a<=99);assert(b<50);}
  assert(a>=10&&a<=9999&&b>=2&&b<=999);
  const created=C.create(stage.id,seed),bytes=Buffer.byteLength(JSON.stringify(created.taskSpec));
  assert(bytes<=60000,'Task specification fits the existing size bound');maxBytes=Math.max(maxBytes,bytes);
  seen.add(a+'|'+b);mixedShapes.add(String(a).length+'x'+String(b).length);
  verify(a,b,stage.id);
 }
 if(!legacyIds.includes(stage.id))assert(seen.size>=240,name+' has broad seeded example variety');
 if(name==='mixed')assert.deepEqual([...mixedShapes].sort(),['2x1','2x2','2x3','3x1','3x2','3x3','4x1','4x3']);
 diversity[name]=seen.size;
}
assert(sumCarryTwo>0,'Three-row addition exercises keeping 2 in mind');
assert(zeroRows>0,'Explicit zero partial rows were verified');
const one=M.make(legacyIds[0],1),spec={...one,contentId:legacyIds[0]},q=one.steps[0];
for(const raw of [q.answer,q.answer+',0',q.answer+'.0000','000'+q.answer,' '+q.answer+' ','+'+q.answer,q.answer.slice(0,1)+' '+q.answer.slice(1),q.answer+'/1']){
 const expected=D.check(raw,q)?one.steps[1].multiplication.event:one.steps[0].multiplication.event;
 assert.equal(M.layout(spec,{answers:[raw]}).active.event,expected,'Board validation matches saved-answer validation for '+JSON.stringify(raw));
}
for(const stage of M.stages){
 const source=M.make(stage.id,1),before=JSON.stringify(source);
 const visible=[stage.goal,stage.action,source.rule,...source.steps.flatMap(q=>[q.prompt,q.hint,q.cue,q.record]),...source.lessons.flatMap(l=>[l.lead,l.html,l.question.prompt,l.question.hint])].map(M.displayText);
 assert(!visible.some(text=>/перенос|перенес/i.test(text)),'Visible multiplication language consistently uses «в уме»');
 assert.equal(JSON.stringify(source),before,'Presentation text conversion never changes canonical content');
}
assert.equal(M.displayText('Прибавь 1, которые перенесли: 8 + 1 = ?'),'В уме 1. Прибавь: 8 + 1 = ?');
assert.equal(M.displayText('<p>Пишем 2, переносим 1.</p>'),'<p>Пишем 2, 1 в уме.</p>');
for(const bad of [-1,1.2,4294967296])assert.throws(()=>M.make(legacyIds[0],bad));
for(const [a,b] of [[9,3],[10000,3],[10,1],[10,1000],[12.5,3]])assert.throws(()=>M.plan(a,b));
assert.throws(()=>M.make('old-id',1));assert.equal(M.board({contentId:'old-id'},{}),'');
console.log(JSON.stringify({result:'MULTIPLICATION_COLUMN_OK',examples,steps,restores,preservedCanonicalTasks:200,sumCarryTwo,zeroRows,maxSteps,maxBytes,diversity,checks:['independent integer equations and final product','1–3 shifted rows','digit/carry effects from verified prefix only','restore parity','published snapshot identity','presentation-only wording']}));
