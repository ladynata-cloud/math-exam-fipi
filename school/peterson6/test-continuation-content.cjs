'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const M=Object.assign({},require('./math.js'),{skills:require('./math.js').courseSkills}),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),ctx);
const D=ctx.window.PetersonCourse,ids=new Set(),skills=new Set(M.skills.map(s=>s.id));
let numeric=0,choice=0,manual=0,checkedSteps=0,instructionSteps=0,legacyTasks=0,newTextbookTasks=0;
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'legacy-content-baseline.json'),'utf8'));
for(const [file,sha] of Object.entries(baseline.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,file))).digest('hex'),sha,'legacy source remains unchanged: '+file);
for(const [key,sha] of Object.entries(baseline.publishedSections)){
 const value=key==='lessons'?D.lessons.slice(0,14):D[key];
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'),sha,'exact published '+key);
}
assert.equal(D.methodVersion,2);assert.equal(D.lessons.length,58);assert.equal(Object.keys(D.exerciseIndex).length,497);
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
 assert.equal(l.id,'p'+String(i+1).padStart(2,'0'));assert.equal(l.part||1,i<14?1:i<32?2:3);
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
   else if(q.kind==='choice'){checkedSteps++;assert.equal(q.choices.filter(v=>v===q.answer).length,1,t.id+' one correct step choice');}
   else{checkedSteps++;assert(M.parse(q.answer),t.id+' step '+q.answer);assert(M.check(accepted(q.answer,q.answerFormat),q.answer,q.answerFormat),t.id+' step form');}
  }
 }
}
const oracles=JSON.parse(fs.readFileSync(path.join(__dirname,'continuation-numeric-oracles.json'),'utf8')).answers;
const newNumeric=D.lessons.filter(l=>l.order>14).flatMap(l=>l.tasks).filter(t=>t.kind==='number');
assert.equal(Object.keys(oracles).length,newNumeric.length);
for(const t of newNumeric)assert(M.equal(t.answer,oracles[t.id]),t.id+' independently recomputed expected value');
assert.equal(legacyTasks,224);assert.equal(newTextbookTasks,237);assert(manual>0);
const segments=D.lessons.find(l=>l.id==='p15').tasks.filter(t=>t.source.exercise===12);
assert.deepEqual(Array.from(segments,t=>[t.source.subpart,t.source.page,t.kind,t.segmentRatio]),[
 ['1',7,'manual','equal'],['2',7,'manual','greater'],['3',7,'manual','less'],['4',7,'manual','double'],
]);
const constructions=D.lessons.find(l=>l.id==='p15').tasks.filter(t=>t.source.exercise===13);
assert.deepEqual(Array.from(constructions,t=>[t.source.subpart,t.source.page,t.kind,t.ratioConstruction]),[
 ['1',7,'manual','segments'],['2',7,'manual','rectangle'],['3',7,'manual','triangle'],['4',7,'manual','angle'],
]);
const keys=task=>Array.from(task.steps.filter(step=>step.answer),step=>step.answer);
assert.deepEqual(keys(constructions[0]),['6']);
assert.deepEqual(keys(constructions[1]),['2','10']);
assert.deepEqual(keys(constructions[2]),['3/5','4/5']);
assert.deepEqual(keys(constructions[3]),['3','20','40']);
const applications=D.lessons.find(l=>l.id==='p15').tasks.filter(t=>t.source.exercise>=9&&t.source.exercise<=11);
assert.deepEqual(Array.from(applications,t=>[t.source.exercise,t.source.subpart,t.source.page]),[
 [9,'1',7],[9,'2',7],[10,'1',7],[10,'2',7],[10,'3',7],
 ...['а','б','в','г','д','е'].map(part=>[11,part,7]),
]);
assert(M.equal(applications[0].answer,273/300*100));
const concentration=M.parse(applications[3].answer);
assert.equal(concentration.n*(5600+140),concentration.d*100*140,'salt mass divided by the mass of the whole solution');
assert.equal(Number(applications[4].answer)+18+7,3*10,'mass-weighted mean for three equal portions');
const rates=[[4,2,'м/мин'],[25,4,'км/ч'],[280,7,'руб./м'],[120,5,'руб./кг'],[6,3,'детали/мин'],[50,2,'страниц/ч']];
for(const [i,[amount,measure,unit]]of rates.entries()){
 const t=applications[5+i];
 assert.equal(t.steps[0].answer,unit);
 assert(M.equal(t.steps[1].answer,amount/measure));
 assert(t.answer.startsWith(String(amount/measure).replace('.',',')+' '+unit+' — '));
}
const signs=D.lessons.find(l=>l.id==='p33').tasks.filter(t=>[4,5,6].includes(t.source.exercise));
assert.deepEqual(Array.from(signs,t=>[t.source.exercise,t.source.subpart,t.source.page]),[
 ...[...'абвгдежз'].map(s=>[4,s,5]),...[...'абвг'].map(s=>[5,s,5]),[6,'а',5],[6,'б',5],
]);
const originalForms=[
 [x=>2.8-(x-1.4),'4,2 − a'],[x=>-(-x+3.2)+0.7,'b − 2,5'],
 [x=>x-(1.6+x),'−1,6'],[x=>(-5.9+x)-x,'−5,9'],
 [x=>(6.4-x)-(5.8+x),'0,6 − 2x'],[x=>x-(4.3+x)+3.9,'−0,4'],
 [x=>(-0.7-x)-(-x+0.5),'−1,2'],[x=>-(1.2-x)+(x-0.8),'2n − 2'],
];
for(const [i,[original,simplified]]of originalForms.entries()){
 const task=signs[i],[coeff,constant]=task.steps.map(s=>Number(s.answer));
 assert.equal(task.answer,simplified);
 for(const value of [-3,0,2])assert(Math.abs(original(value)-coeff*value-constant)<1e-10,task.id);
}
const solutions=signs.slice(8).map(t=>Number(t.answer));
assert.equal(-43-(-18-solutions[0]*10),30);
assert.equal(solutions[1]*10-30,-48);
assert.equal((solutions[2]*10-60)-(45-solutions[2]*10),-15);
assert.equal(22*5-(solutions[3]*60-7*5)+25*5,54);
assert.equal(28+(solutions[4]-6)+solutions[4],80);
assert.equal(158+10*solutions[5]+(10*solutions[5]+19),485);
const all=JSON.stringify(D);assert(!/[\uE000-\uF8FF]/.test(all),'unresolved PDF glyph');assert(!all.includes('undefined'));assert(!all.includes('/workspace/'));
console.log(JSON.stringify({ok:true,topics:D.lessons.length,tasks:ids.size,legacyTasks,newTextbookTasks,numeric,choice,manual,checkedSteps,instructionSteps,printedNumbers:1863}));
