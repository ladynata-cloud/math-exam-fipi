'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const M=require('./math.js'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),ctx);
const D=ctx.window.PetersonCourse,ids=new Set(),skills=new Set(M.skills.map(s=>s.id));
let numeric=0,choice=0,manual=0,checkedSteps=0,instructionSteps=0,legacyTasks=0,newTextbookTasks=0;
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'legacy-content-baseline.json'),'utf8'));
for(const [file,sha] of Object.entries(baseline.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,file))).digest('hex'),sha,'legacy source remains unchanged: '+file);
assert.equal(D.lessons.length,58);assert.equal(Object.keys(D.exerciseIndex).length,497);
assert.equal(D.sources.length,3);
for(let n=1;n<=497;n++)assert(D.exerciseIndex[n]&&D.exerciseIndex[n].page>=6&&D.exerciseIndex[n].page<=110);
for(const [part,count,last] of [[1,497,497],[2,588,589],[3,778,778]]){
 const index=D.exerciseIndexByPart[part];
 assert.equal(Object.values(index).filter(x=>!x.missing).length,count,'real unique printed numbers, part'+part);
 for(let n=1;n<=last;n++){assert(index[n],'lookup position '+part+':'+n);assert(index[n].page>0);assert(D.lessons.some(l=>l.id===index[n].lesson));}
}
assert(D.exerciseIndexByPart[2][144].missing);
assert.match(D.exerciseIndexByPart[2][144].notice,/143/);
assert.match(D.exerciseIndexByPart[2][143].notice,/два|дважды|повтор/);
function accepted(answer,format){
 if(format==='decimal')return M.decimal(answer);
 if(format==='mixed-number'){
  const q=M.parse(answer),n=Math.abs(q.n),whole=Math.floor(n/q.d),rest=n%q.d;
  return (q.n<0?'-':'')+whole+(rest?' '+rest+'/'+q.d:'');
 }
 return answer;
}
for(const [i,l]of D.lessons.entries()){
 assert.equal(l.id,'p'+String(i+1).padStart(2,'0'));assert.equal(l.part,i<14?1:i<32?2:3);
 assert(l.theory.length>=3,l.id+' theory');assert(l.tasks.length>=(i<14?14:4),l.id+' exercises');assert(l.page>0);assert(l.goals.length>=2);
 for(const sk of l.skills||[])assert(skills.has(sk),l.id+': unknown skill '+sk);
 for(const t of l.tasks){
  assert(!ids.has(t.id),t.id+' unique');ids.add(t.id);assert(t.prompt&&t.finalLabel&&t.explanation&&t.hint,t.id+' teaching text');
  assert(['authored','textbook'].includes(t.source.type));
  for(const sk of t.skills||[])assert(skills.has(sk),t.id+': unknown skill '+sk);
  if(i<14)legacyTasks++;
  else{
   newTextbookTasks++;assert.equal(t.source.type,'textbook',t.id+' real source');assert.equal(t.source.part,l.part);
   assert(Number.isInteger(t.source.exercise)&&t.source.exercise>0,t.id+' printed exercise');
   const row=D.exerciseIndexByPart[l.part][t.source.exercise];assert(row&&!row.missing,t.id+' source exists');assert.equal(row.page,t.source.page,t.id+' printed page');
   assert(t.source.reference&&t.title.includes('К задаче'),t.id+' companion label');
  }
  if(t.kind==='choice'){choice++;assert.equal(t.choices.filter(c=>c===t.answer).length,1,t.id);assert.equal(new Set(t.choices).size,t.choices.length);}
  else if(t.kind==='manual'){manual++;assert.equal(t.answer,'',t.id+' no machine correctness');assert(t.steps.length>=2,t.id+' reasoning scaffold');}
  else{numeric++;assert.equal(t.kind,'number');assert(M.parse(t.answer),t.id+' final '+t.answer);assert(M.check(accepted(t.answer,t.answerFormat),t.answer,t.answerFormat),t.id+' accepted answer form');assert(t.steps.length>=2,t.id+' small steps');}
  for(const q of t.steps||[]){
   assert(q.prompt&&q.hint&&q.explanation,t.id+' complete step');
   if(q.kind==='instruction'){instructionSteps++;assert(!q.answer,t.id+' instruction has no auto-answer');}
   else{checkedSteps++;assert(M.parse(q.answer),t.id+' step '+q.answer);assert(M.check(accepted(q.answer,q.answerFormat),q.answer,q.answerFormat),t.id+' step form');}
  }
 }
}
const oracles=JSON.parse(fs.readFileSync(path.join(__dirname,'continuation-numeric-oracles.json'),'utf8')).answers;
const newNumeric=D.lessons.filter(l=>l.order>14).flatMap(l=>l.tasks).filter(t=>t.kind==='number');
assert.equal(Object.keys(oracles).length,newNumeric.length);
for(const t of newNumeric)assert(M.equal(t.answer,oracles[t.id]),t.id+' independently recomputed expected value');
assert.equal(legacyTasks,224);assert(newTextbookTasks>=176);assert(manual>0);
const all=JSON.stringify(D);assert(!/[\uE000-\uF8FF]/.test(all),'unresolved PDF glyph');assert(!all.includes('undefined'));assert(!all.includes('/workspace/'));
console.log(JSON.stringify({ok:true,topics:D.lessons.length,tasks:ids.size,legacyTasks,newTextbookTasks,numeric,choice,manual,checkedSteps,instructionSteps,printedNumbers:1863}));
