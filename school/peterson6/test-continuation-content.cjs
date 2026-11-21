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
assert.equal(legacyTasks,224);assert.equal(newTextbookTasks,334);assert(manual>0);
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
const trigonometry=D.lessons.find(l=>l.id==='p15').tasks.filter(t=>[14,15].includes(t.source.exercise));
assert.deepEqual(Array.from(trigonometry,t=>[t.source.exercise,t.source.subpart,t.source.page]),[
 [14,'1',7],[14,'2',7],[15,'1',8],[15,'2',8],[15,'3',8],[15,'4',8],[15,'5',8],
]);
assert.deepEqual(keys(trigonometry[1]),['BC/AB','AC/AB','BC/AC','AC/AB','BC/AB','AC/BC']);
assert.deepEqual(keys(trigonometry[5]),['4/5','3/5','4/3','1']);
for(const [v,h,c] of [[3,4,5],[5,12,13],[8,15,17]]) {
 assert.equal(v*v+h*h,c*c);
 for(const [opposite,adjacent] of [[v,h],[h,v]]) {
  assert(Math.abs((opposite/c)**2+(adjacent/c)**2-Number(trigonometry[3].answer))<1e-12);
  assert(Math.abs((opposite/c)/(adjacent/c)-opposite/adjacent)<1e-12);
 }
}
assert(Math.abs(82.789/110.386-3/4)<1e-5,'relative legs measured from the printed exercise 15 diagram');
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
const group=D.lessons.find(l=>l.id==='p33').tasks.filter(t=>t.source.exercise>=7&&t.source.exercise<=10);
const printedSeven=group.filter(t=>t.source.exercise===7);
assert.deepEqual(Array.from(printedSeven,t=>t.source.subpart).sort(),Array.from('абвгдежзи').sort());
for(const [exercise,labels] of [[8,'аб'],[9,'аб'],[10,'аб']]) {
 assert.deepEqual(Array.from(group.filter(t=>t.source.exercise===exercise),t=>t.source.subpart),Array.from(labels));
}
assert(group.every(t=>t.source.page===5));
const newColumns=group.filter(t=>t.distributedTerms && t.kind==='choice');
const operands=[
 [['a'],a=>5*(a+2)-12],[['m'],m=>m-3*(2-m)+8],[['m','n'],(m,n)=>2*(m-n)-(m+n)],
 [['x','y'],(x,y)=>(x-y)-2*(x+y)],[['a','b'],(a,b)=>-2*(a+b)+2*(a-b)],
 [['b'],b=>3*(b-1)-2*(b-2)],[['d'],d=>-2*(d+3)+3*(2-d)],
 [['m','n'],(m,n)=>3*(m-n)+2*(m+n)],[['x','y'],(x,y)=>2*(x+y)-(3*x-y)],
];
function valueOfLinear(text,values) {
 const terms=text.replace(/−/g,'-').replace(/ /g,'').match(/[+-]?[^+-]+/g);
 return terms.reduce((sum,term)=>{
  const variable=term.match(/[a-z]$/)?.[0];
  if(!variable)return sum+Number(term);
  const raw=term.slice(0,-1),coefficient=Number(raw==='-'?'-1':raw==='+'||raw===''?'1':raw);
  return sum+coefficient*values[variable];
 },0);
}
assert.equal(newColumns.length,operands.length);
for (const [i,task] of newColumns.entries()) {
 const [vars,original]=operands[i];
 for(const pair of [[0,0],[3,-2],[-1,5],[5,1]]) {
  const values=Object.fromEntries(vars.map((v,k)=>[v,pair[k]]));
  assert.equal(valueOfLinear(task.answer,values),original(...pair),task.id);
 }
 assert(task.distributedTerms.every(group=>group.length===3));
}
const values=group.filter(t=>t.source.exercise===8);
assert(Math.abs(3*(-1.8-4)+2*(1.8+6)-Number(values[0].answer))<1e-10);
for(const b of [1/7,0,-3])assert(Math.abs(3*b-2*(-0.5-b)-0.5-5*(-0.5+b)-Number(values[1].answer))<1e-10);
const quantities=group.filter(t=>t.source.exercise===10);
assert.deepEqual(Array.from(quantities[0].steps.slice(1),s=>Number(s.answer)),[70,80,90].map(v=>625-(2*v+3*(v+10)+(v-5))));
assert.deepEqual(Array.from(quantities[1].steps.slice(2),s=>Number(s.answer)),[10,15,20].map(n=>(3200-50*(n+(n+4)))/1000));
const p33=D.lessons.find(l=>l.id==='p33');
const printedColumns=['абв','абвгдежзи','абвгдежз','абвгдежз','абвг','аб','абвгдежзи','аб','аб','аб'];
for(const [i,letters] of printedColumns.entries()) {
 const rows=p33.tasks.filter(t=>t.source.exercise===i+1);
 assert.deepEqual(Array.from(rows,t=>t.source.subpart).sort(),Array.from(letters).sort(),'all printed subparts of '+(i+1));
 assert(rows.every(t=>t.source.page===(i<3?4:5)));
}
const openings=p33.tasks.filter(t=>t.source.exercise===1);
assert.deepEqual(Array.from(openings,t=>t.groupRule),['add','subtract','distribute']);
const expanded=p33.tasks.filter(t=>t.source.exercise===2&&t.source.subpart!=='а');
const directForms=[
 o=>-(o.c+o.d),o=>-(-o.x+o.y),o=>o.d-(-o.k+o.t),o=>-o.m+(o.a-o.c),
 o=>o.p-(-o.n+o.r-o.s),o=>o.c-(o.b+o.c-o.a)+(-o.a+o.b),
 o=>(o.d-o.m)-o.b-(-o.m+o.x+o.d)+o.x,
 o=>o.k-(o.y-o.c)+(o.d-o.c-o.y)+(-o.k+o.d),
];
for (const [i,task] of expanded.entries()) {
 assert(!/[()]/.test(task.answer),'all groups expanded on '+task.id);
 for(const seed of [-4,0,1,7]) {
  const vars=Object.fromEntries([...new Set(task.answer.match(/[a-z]/g))].map((letter,k)=>[letter,(k+1)*seed+k-3]));
  assert.equal(valueOfLinear(task.answer,vars),directForms[i](vars),task.id);
 }
}
const originalNumbers=p33.tasks.filter(t=>t.source.exercise===3&&t.source.subpart!=='а');
const exactLeft=[
 ((1+3/8)+(-(2+7/9)+5/8)),(5.6-7.2)-(-7.2+3.4),
 (2.4-2/3)+2.4-(1.8+(1+5/6)),45-(-7+18)-(34-18+26),
 -9.7+(-3.8+5.2)-(2.9-5.2-9.7)+3.8,
 (1.8-6.03)-(-4.14+2.25-6.03)-4.8,
 -((5+1/3)-(4+5/16))+(2+1/16)-((1+2/3)-(1+5/16)+(3+11/16)),
];
for (const [i,task] of originalNumbers.entries()) {
 const q=M.parse(task.answer);assert(Math.abs(q.n/q.d-exactLeft[i])<1e-10,task.id);
}
const p15=D.lessons.find(l=>l.id==='p15');
const ratioColumns=['аб','','абвгдежз','','абвг','абвгдежз','абвг','абвгде','12','123','абвгде','1234','1234','12','12345'];
for(const [i,letters] of ratioColumns.entries()) {
 const rows=p15.tasks.filter(t=>t.source.exercise===i+1);
 const expected=letters?Array.from(letters):[''];
 assert.deepEqual(Array.from(rows,t=>t.source.subpart||'').sort(),expected.sort(),'every printed prompt at part 2 number '+(i+1));
 assert(rows.every(t=>t.source.page===(i<8?6:i<14?7:8)));
}
assert.equal(p15.tasks.length,75);
const oralTravel=D.lessons.find(l=>l.id==='p33').tasks.filter(t=>[14,15,16].includes(t.source.exercise));
assert.deepEqual(Array.from(oralTravel,t=>[t.source.exercise,t.source.subpart||'',t.source.page]),[
 [14,'а',6],[14,'б',6],[14,'в',6],[14,'г',6],[15,'',6],[16,'а',6],[16,'б',6],[16,'в',6],[16,'г',6],
]);
const exactGroups=[
 [[-7-(-3),.4-.9,-1.2+5,-.7-.8],[5-(-2),.6-1.1,-2.4+6,-1.1-.4]],
 [[-2.5*(-8),-3/4*1.6,4.2/(-.7),-.125/(1/8)],[-1.5*(-6),-2/3*1.8,6.3/(-.9),.25/(-1/4)]],
 [[90/.3,2.4/3,.6-4,5.6+.2],[12/.4,3.6/3,1.2-3,4.2+.7]],
 [[0/(-7.6),-1*(-1-2/9),4.5/(-1),(3.4-(3+2/5))*6.4],[0/(-2.5),-1*(-2-1/3),6.3/(-1),(1.8-(1+4/5))*9]],
];
for(const [i,[original,fresh]] of exactGroups.entries())for(const [j,values] of [original,fresh].entries()){
 for(const [k,n] of values.entries()){
  const answer=(j?oralTravel[i].oralStudy.freshAnswers:oralTravel[i].oralStudy.answers)[k],r=M.parse(answer);
  assert(Math.abs(r.n/r.d-n)<1e-9,oralTravel[i].source.reference+' '+j+'/'+k);
 }
}
const chains=oralTravel.find(t=>t.source.exercise===15).chainStudy;
const chainResults=Array.from(chains,chain=>{
 const operations={'+':'add','−':'subtract','×':'multiply',':':'divide'};
 const result=chain.steps.reduce((acc,[op,operand])=>M.operation(operations[op],acc,operand),M.parse(chain.start));
 return [chain.letter,M.answer(result),result.n/result.d];
});
assert.deepEqual(chainResults.map(([k,v])=>[k,v]),[['Б','40'],['У','6/5'],['О','-7/5'],['Р','-9/2'],['К','-2'],['М','16']]);
assert.equal(chainResults.sort((a,b)=>a[2]-b[2]).map(row=>row[0]).join(''),'РКОУМБ');
assert.equal((5*60+15*80)/20,75);assert.equal((5*84+15*52)/20,60);
for(const d of [12,36]){assert.equal((d/2+d/3)/2,5*d/12);assert.equal((d/2-d/3)/2,d/12);}
const nested=D.lessons.find(l=>l.id==='p33').tasks.filter(t=>t.source.exercise>=11&&t.source.exercise<=13);
assert.deepEqual(Array.from(nested,t=>[t.source.exercise,t.source.subpart,t.source.page,t.kind]),[
 [11,'а',6,'choice'],[11,'б',6,'choice'],[11,'в',6,'choice'],[12,'а',6,'manual'],[12,'б',6,'manual'],[13,'а',6,'manual'],[13,'б',6,'manual'],
]);
assert.deepEqual(Array.from(nested.slice(0,3),t=>t.answer),['1 − x','2y − 4','5']);
for(let x=-12;x<=12;x++){
 assert.equal(4*x-(3*x+(2*x-1)),1-x);
 assert.equal(x-(2*x-(3*x-4)),2*x-4);
 assert.equal(x-(2*x+(3*x-(4*x+5))),5);
 if(x>0){assert.equal((2*(x-1)+3*(x+1))%5,1);assert.equal((3*x+(3*x+3)+(3*x+6)+(3*x+9))%12,6);}
 for(let y=-6;y<=6;y++){
  assert.equal(x-(y-x+y),2*x-2*y);assert.equal(x-(y-x)+y,2*x);assert.equal(x-(y-(x+y)),2*x);
 }
}
const proofs=p15.tasks.filter(t=>t.source.exercise===18);
assert.equal(proofs.length,1);assert.equal(proofs[0].kind,'manual');assert.equal(proofs[0].figure.type,'pythagoras-dissection');
const equations19=p15.tasks.filter(t=>t.source.exercise===19);
const lhs=[x=>0.9*x+4.96,x=>(4+1/3)*x+x,x=>0.4*(2*x+0.3),x=>5*(x-3.8)];
const rhs=[x=>3.6+1.4*x,x=>6*x-10.4,x=>(6*x-7.2)/6,x=>4.7*(x-4)];
for(const [i,t] of equations19.entries()){
 const r=M.parse(t.answer),v=r.n/r.d;
 assert.equal(t.source.subpart,'абвг'[i]);
 assert(Math.abs(lhs[i](v)-rhs[i](v))<1e-10,t.source.reference);
 assert(Math.abs(lhs[i](v+1)-rhs[i](v+1))>0.1);
 const [m,p,k,q]=t.balanceStudy.coefficients.map(raw=>{const n=M.parse(raw);return n.n/n.d;});
 for(const x of [-3,0,1,v,v+1]) {
  assert(Math.abs(m*x+p-lhs[i](x))<1e-10);
  assert(Math.abs(k*x+q-rhs[i](x))<1e-10);
 }
}
const numericalChanges=p15.tasks.filter(t=>t.source.exercise===16);
assert.deepEqual(Array.from(numericalChanges,t=>t.source.subpart),['1','2','3','4']);
for(const [i,result] of ['3','4/3','1001/200','28/5'].entries()) {
 assert.equal(numericalChanges[i].answer,result);
 assert(numericalChanges[i].errorCues.every(([wrong])=>!M.equal(wrong,result)));
}
const rules=p15.tasks.filter(t=>t.source.exercise===17);
assert.deepEqual(Array.from(rules,t=>t.answer),['a = b/7','c = d + 3','m = 2n/9','k = 0,8t','x = 1,28y','p = 0,6s']);
const expected=[
 v=>v+1/4,v=>v/(31/10),v=>v-437/100,v=>v*28/27,
 v=>v/7,v=>v+3,v=>2*v/9,v=>4*v/5,v=>v+28*v/100,v=>v-40*v/100,
];
for(const [i,t] of [...numericalChanges,...rules].entries()) {
 const study=t.changeStudy;
 for(const [before,after] of [[study.base,study.result],[study.alternate,study.nextResult]]) {
  const input=M.parse(before),output=M.parse(after);
  assert(Math.abs(expected[i](input.n/input.d)-output.n/output.d)<1e-10,t.source.reference+' numeric model');
 }
}

const bySource=(n,sub)=>p15.tasks.find(t=>t.source.exercise===n&&t.source.subpart===sub);
for(const [sub,left,right]of [['в',2.5,3],['г',4,1/3],['д',0.34,1.7],['е',3+1/9,4+2/3]]) {
 const t=bySource(3,sub),q=M.parse(t.answer);
 assert(Math.abs(q.n/q.d-left/right)<1e-10);
 assert(Math.abs(t.ratioQuantities[0]/t.ratioQuantities[1]-left/right)<1e-10);
}
for(const a of [-4,2])for(const b of [-3,5])for(const c of [-1,0,6]) {
 assert.equal(bySource(3,'ж').answer,'3c/a');assert.equal(15*a*b*c/(5*a*a*b),3*c/a);
 assert.equal(bySource(3,'з').answer,'x/(5y)');assert.equal((4*a*a)/(20*a*b),a/(5*b));
 assert.equal(Number(bySource(6,'ж').answer),100*a/(4*a));
 assert(Math.abs(Number(bySource(6,'з').answer)-100*8.4*b/((4+1/5)*b))<1e-10);
}
for(const [letter,left,right]of [['б',9,25],['в',15,3],['г',77,28],['д',1.6,5+1/3],['е',6.3,70]]) {
 assert(Math.abs(Number(bySource(6,letter).answer)-100*left/right)<1e-10);
}
for(const [letter,left,right]of [['б',0.3*1000,500],['в',12,4*10],['г',0.034*100,20],['д',6,60]]) {
 assert(Math.abs(Number(bySource(8,letter).answer)-100*left/right)<1e-10);
}
for(const [letter,left,right]of [['а',1,3],['в',7.2,36],['г',9/20,0.75]]) {
 const t=bySource(7,letter),q=t.steps.map(step=>M.parse(step.answer)).map(r=>r.n/r.d);
 assert(Math.abs(q[0]-left/right)<1e-10 && Math.abs(q[1]-100*left/right)<1e-10);
 assert(Math.abs(q[2]-right/left)<1e-10 && Math.abs(q[3]-100*right/left)<1e-10);
}
const all=JSON.stringify(D);assert(!/[\uE000-\uF8FF]/.test(all),'unresolved PDF glyph');assert(!all.includes('undefined'));assert(!all.includes('/workspace/'));
console.log(JSON.stringify({ok:true,topics:D.lessons.length,tasks:ids.size,legacyTasks,newTextbookTasks,numeric,choice,manual,checkedSteps,instructionSteps,printedNumbers:1863}));
