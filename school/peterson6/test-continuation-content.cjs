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
assert.equal(legacyTasks,224);assert.equal(newTextbookTasks,1343);assert(manual>0);
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
{
 const printed=Array.from(p33.tasks).filter(task=>task.source.exercise>=17);
 const letters=['абвг','абвг','','аб','','','','','',''];
 assert.equal(printed.length,17);assert.equal(p33.tasks.length,82);
 assert.deepEqual(Array.from(Object.values(p33.completeSourceSection)),[1,26,4,8]);
 for(const [offset,subparts]of letters.entries()){
  const rows=printed.filter(t=>t.source.exercise===17+offset);
  assert.deepEqual(rows.map(t=>t.source.subpart||''),subparts?[...subparts]:['']);
  assert(rows.every(t=>t.source.page===(offset<6?7:8)));
 }
 const mids=printed.filter(t=>t.source.exercise===17);
 for(const [i,[center,radius]]of [[4,1],[2,3],[-1,2],[-3,4]].entries()){
  const task=mids[i],left=Number(task.steps[1].answer),right=Number(task.steps[2].answer);
  assert.equal(Math.abs(left-center),radius);assert.equal(Math.abs(right-center),radius);
  assert.equal((left+right)/2,Number(task.answer));assert.notEqual(left,right);
 }
 const directions={a:[1,0],d:[1,0],c:[0,1],l:[0,1],b:[2,1]};
 const pairs=['ab','ac','ad','al','bc','bd','bl','cd','cl','dl'];
 const parallel=([a,b],[c,d])=>a*d===b*c,perp=([a,b],[c,d])=>a*c+b*d===0;
 for(const [i,f]of [((a,b)=>!parallel(a,b)),parallel,parallel,perp].entries()){
  const task=printed.filter(t=>t.source.exercise===18)[i];
  assert.deepEqual(task.answer.split(', '),pairs.filter(([x,y])=>f(directions[x],directions[y])));
 }
 const exact19=[a=>-4.5+(-a+5.6),b=>-(2*b-3)+b,c=>c-(1.8-c),d=>-d-(.7-3*d),
  m=>(-1.1+m)-(3.1-m),n=>-(n-4.6)+(2.9-n),x=>.5-(2*x+1.2)-x,y=>(y-5.4)-(-2.6+y)];
 const exact23=[a=>-4*(a+1)-5,b=>2*b-3*(b-4),m=>-m+2*(-m+3),n=>4*(n-2)-3*(n+2),
  d=>-2*(7+d)+3*(-d+5),x=>-x+(3-2*x)-2*(x+4)];
 for(const [number,functions]of [[19,exact19],[23,exact23]]){
  const task=printed.find(t=>t.source.exercise===number),byNumber=new Map();
  for(const [i,row]of Array.from(task.letterStudy).entries()){
   const v=Number(row.value),math=functions[i],answer=M.parse(task.steps[i].answer);
   assert(Math.abs(math(v)-answer.n/answer.d)<1e-10);
   for(const input of [v,v+2,-1,0,5])assert(Math.abs(math(input)-Number(row.coefficient)*input-Number(row.constant))<1e-10);
   byNumber.set(Math.round(math(v)*10)/10,row.letter);
  }
  assert.equal(number===19?[-2.4,-2.8,4,-2.8,-1.5,-1.5,.2,-1.5,1.6,-.4,4,-2.8,-2.3,-2.3].map(n=>byNumber.get(n)).join(''):[...byNumber].sort((a,b)=>b[0]-a[0]).map(([,letter])=>letter).join(''),number===19?'ПАРАЛЛЕЛОГРАММ':'КОРЕНЬ');
 }
 const roots=printed.filter(t=>t.source.exercise===20).map(t=>Number(t.answer));
 assert.equal(-(roots[0]+4)-19,7);
 assert(Math.abs((2+1/3)-(roots[1]-5/12)-1.75)<1e-10);
 const clowns=Number(printed.find(t=>t.source.exercise===21).answer);assert.equal(8+clowns+(clowns+6)+(clowns+6-7),28);
 for(const n of [1,2,7,100])assert.equal(((n-1)+(n+1))/2,n);
 const speeds=printed.find(t=>t.source.exercise===24).steps.slice(2).map(t=>M.parse(t.answer));
 for(const [i,v]of [28,29.7,35.5].entries())assert(Math.abs((5*(v+2)+3*(v-2))/8-speeds[i].n/speeds[i].d)<1e-10);
 assert.equal(.5+24.5,25);assert.equal(24.5/.5,49);assert.equal(5*2/3+8/3,6);
}
{
 const scale=D.lessons.find(l=>l.id==='p16');assert(scale.orderBySource);
 for(const [id,expected] of [[28,['1','2а','2б','2в']],[29,['1','2','3']],[30,['']],[31,['1','2','3','4']],[32,['']]]){
  const rows=Array.from(scale.tasks).filter(t=>t.source.exercise===id);
  assert.deepEqual(rows.map(t=>t.source.subpart||'').sort(),expected);assert(rows.every(t=>t.source.page===12));
 }
 const extra=Array.from(scale.tasks).slice(6,14);
 assert.equal(extra.length,8);assert.equal(extra[4].answer,String(50*100000/(2*10)));
 assert.deepEqual(extra.slice(5).map(t=>Number(t.answer)),[1,1.8*10,35/10].map(cm=>cm*1000000/100000));
 assert.deepEqual(extra.slice(1,4).map(t=>Number(t.steps[1].answer)),[3*400/100,3*500000/100000,12/3]);
}
{
 const scale=D.lessons.find(l=>l.id==='p16'),extra=Array.from(scale.tasks).slice(14,24);
 assert.deepEqual(extra.map(t=>t.source.exercise),[33,33,33,33,33,33,33,33,34,35]);
 assert.deepEqual(extra.slice(0,8).map(t=>t.source.subpart),['1','2','3','4','5','6','7','8']);
 assert(extra.every(t=>t.kind==='manual'&&t.source.page===12));
 // Independent haversine evaluation of the eight WGS84 place coordinates.
 const points=[[59.94096,30.31407],[55.75189,49.12440],[56.85003,53.23002],[50.43531,30.51468],[50.08697,14.42294],[52.52376,13.39960],[48.85809,2.35299],[51.50194,-.11867]];
 for(const [i,[lat,lon]]of points.entries()){
  const r=Math.PI/180,a=Math.sin((lat-55.75411)*r/2)**2+Math.cos(lat*r)*Math.cos(55.75411*r)*Math.sin((lon-37.61358)*r/2)**2;
  const km=12742*Math.asin(Math.sqrt(a));assert.equal(Number(extra[i].steps[2].answer),Math.round(km/100)*100);
 }
 const parcel=extra[8];assert.equal(Number(parcel.steps[2].answer),2*(5+2.4)*40);
 assert.equal(Number(parcel.steps[4].answer),(5*2.4-2*1)*40**2);
 const areas=extra[9].steps.slice(1,7).map(step=>M.parse(step.answer)).map(q=>q.n/q.d);
 const sides=[[7,5],[4.5,3.1],[4.5,3.9],[4.7,3.1],[4.5,1.1],[2.3,3.1]];
 for(const [i,[w,h]]of sides.entries())assert(Math.abs(areas[i]-w*h)<1e-9);
 assert(Math.abs(areas.reduce((a,b)=>a+b)-11.5*8.1)<1e-9);
}
{
 const coeff=D.lessons.find(l=>l.id==='p34'),reviewed=Array.from(coeff.tasks).slice(4,38);
 assert.equal(coeff.tasks.length,67);assert(coeff.orderBySource);assert(reviewed.every(t=>t.source.page===9));
 const mapped=Array.from(coeff.tasks);
 assert.deepEqual(mapped.filter(t=>t.source.exercise===27).map(t=>t.source.subpart).sort(),['а','б','в','г','д','обоснование']);
 assert.deepEqual(mapped.filter(t=>t.source.exercise===28).map(t=>t.source.readingKey).sort(),['а1','а2','а3','б1','б2','б3']);
 for(const [n,letters]of [[29,'абвгде'],[30,'абвгдежзиклм'],[31,'абвгдежз']])assert.deepEqual(mapped.filter(t=>t.source.exercise===n).map(t=>t.source.subpart).sort(),[...letters].sort());
 const plusOne=v=>Object.fromEntries([...Object.keys(v)].map(k=>[k,1]));
 const values={a:2,b:3,c:-2,d:-1,k:1,m:2,n:-2,x:3,y:-1,p:4};
 const originals={
  '27а':o=>2*o.x*o.y,'27в':o=>-3*o.a*o.b**4,'27г':o=>-5/6*o.m**3*o.n**2,
  '28а2':o=>-2*o.x**2,'28а3':o=>(-2)**2*o.x,'28б1':o=>(-2*o.m)**4,'28б2':o=>-2*o.m**4,'28б3':o=>(-2)**4*o.m,
  '29а':o=>-o.a*(-o.b)*(-o.c)*o.d,'29б':o=>-o.x*(-o.y)*(-o.n)*(-o.m),'29в':o=>(-o.c)**2*(-o.m)**3,
  '29г':o=>(-(o.c**2))*(-(o.m**3)),'29д':o=>(-o.a)**5*(-o.b)**4,'29е':o=>(-(o.a**5))*(-(o.b**4)),
  '30а':o=>2*o.a*7,'30б':o=>3*o.b*(-5*o.c),'30в':o=>-.5*o.x*(-o.y),'30г':o=>4*o.m*o.n*(-.2),
  '30д':o=>-o.x*2*o.p*(-.5),'30е':o=>-o.b*(-3*o.d)*(-1/3),'30ж':o=>2*o.c*(-o.c)*(-8),
  '30з':o=>o.y*6*o.y*(-.01*o.y),'30и':o=>-.25*o.n*(-4*o.n**2),'30к':o=>(-5*o.a)**2,'30л':o=>-5*o.a**2,'30м':o=>(-5)**2*o.a,
  '31а':o=>-3*o.a*(-2*o.b),'31б':o=>5/12*o.x*(-4*o.y),'31г':o=>o.c*(-4/9*o.c)*.9,'31д':o=>.8*o.d*o.y*(-12.5*o.y**2),
  '31е':o=>-1/3*o.m**2*(-15*o.m*o.b),'31ж':o=>(-.7*o.n)**2,'31з':o=>-3*o.x*(-3*o.x)**2};
 const numeric=q=>{const r=M.parse(q);return r.n/r.d;};
 for(const task of reviewed.filter(t=>t.coefficientStudy)){
  const source=task.source,op=originals[source.exercise+(source.readingKey||source.subpart)];
  assert.equal(typeof op,'function',task.id);
  const f=Array.from(task.coefficientStudy.factors);
  for(const vector of [values,plusOne(values),Object.fromEntries(Object.keys(values).map((v,i)=>[v,i%3-1]))]){
   const value=f.reduce((result,item)=>result*(numeric(item.coefficient)*Object.entries(item.variables).reduce((u,[letter,power])=>u*vector[letter]**power,1))**item.power,1);
   assert(Math.abs(op(vector)-value)<1e-8,task.id);
  }
  assert(Math.abs(numeric(task.steps[1].answer)-op(plusOne(values)))<1e-10,task.id);
 }
 assert.equal(Object.keys(originals).length,33);
}
{
 const section=D.lessons.find(l=>l.id==='p34'),end=Array.from(section.tasks).slice(38);
 assert.equal(end.length,29);assert.deepEqual(Object.values(section.completeSourceSection),[27,41,9,11]);
 const cols=['абвгде','аб','абвг','абв','','','абвгде','абв','аб',''];
 for(const [i,letters]of cols.entries()){
  const rows=end.filter(t=>t.source.exercise===32+i);
  assert.deepEqual(rows.map(t=>t.source.subpart||''),letters?[...letters]:['']);
  assert(rows.every(t=>t.source.page===(i===9?11:10)));
 }
 const linears=[o=>-3*(-2*o.a+5),o=>2*(5*o.b-4*o.c+3),o=>4*(-o.x+3*o.y)-2*(o.x+5*o.y),o=>-2*(6*o.d-o.k)+3*(4*o.d-2*o.k),o=>5*(3*o.c-2)+2*(4-7*o.c),o=>3*(-8+2*o.y)-4*(2*o.y-6),
  o=>-2*(o.c+7),o=>5*(2*o.a-3)-4*(3*o.a-4),o=>-2*(2*o.x+3*o.y)+3*(-o.x+2*o.y)];
 for(const [i,t]of end.filter(t=>t.linearStudy).entries()){
  for(const seed of [-3,0,5]){
   const vals=Object.fromEntries([...'abckdxy'].map((v,j)=>[v,seed+3*j-2]));
   const fromGroups=Array.from(t.linearStudy.groups).reduce((sum,g)=>sum+g.scale*(g.constant+Object.entries(g.terms).reduce((p,[v,k])=>p+k*vals[v],0)),0);
   assert.equal(fromGroups,linears[i](vals));assert.equal(fromGroups,valueOfLinear(t.answer,vals));
  }
 }
 assert.deepEqual(end.filter(t=>t.source.exercise===33).map(t=>Number(t.answer)),[(-5)*(-.78)*2*(-2.5)*(-4),Math.round((-.4)*(9/17)*(-.25)*1.25*(-8)*17)]);
 const props=end.filter(t=>t.source.exercise===34);assert(props.every(t=>t.kind==='manual'));
 for(const a of [-7,-.5,0,1,4]){assert.equal((-a)**2,a*a);assert.equal((-a)**3===-(a**3),true);}
 assert.notEqual((-1)**2,-(1**2));assert.equal((-0)**2===-(0**2),true);
 for(const t of end.filter(t=>t.squareSum)){
  const [a,b]=t.squareSum,answers=t.steps.slice(0,3).map(step=>Number(step.answer));
  assert.deepEqual(Array.from(answers),[(a+b)**2,a*a+b*b,a*a+2*a*b+b*b]);
 }
 for(const x of [-5,0,.5,12])assert.equal(3*(x+7)+4-3*x,25);
 assert.equal(15-2*(100-8*Number(end.find(t=>t.source.exercise===37).answer)),7);
 const coeffs=end.filter(t=>t.source.exercise===38),evals=[x=>5*(-1.2*x),x=>-(2/9)*x*(-3*x),x=>-2*x*.4*x,x=>x*x*(-6*x)*(-.5),x=>(-4*x)**2,x=>(-.1*x)**3];
 for(const [i,t]of coeffs.entries())for(const x of [-2,1,3]){
  let v=1;for(const factor of t.coefficientStudy.factors){const k=M.parse(factor.coefficient);v*=((k.n/k.d)*x**Object.values(factor.variables).reduce((a,b)=>a+b,0))**factor.power;}
  assert(Math.abs(v-evals[i](x))<1e-9);
 }
 assert.equal(40-7*(Number(end.find(t=>t.source.exercise===40&&t.source.subpart==='а').answer)-16),12);
 for(const x of [.2,1,1.5,6])assert(Math.abs(Math.sqrt(x*x+2*x+1)-1-x)<1e-12);
}
{
 const scale = D.lessons.find(lesson => lesson.id === 'p16');
 const additions = scale.tasks.filter(task => task.source.exercise >= 37 && task.source.exercise <= 44);
 const printed = [[37,''],[38,''],[39,''],[40,''],[41,'1234'],[42,'12345678'],[43,''],[44,'аб']];
 assert.deepEqual(Array.from(additions, task => [task.source.exercise, task.source.subpart || '', task.source.page]),
  printed.flatMap(([number, letters]) => (letters ? Array.from(letters) : ['']).map(letter => [number,letter,13])));
 const actual = value => { const part = M.parse(value); return part.n / part.d; };
 const at = (number, letter = '') => additions.find(task => task.source.exercise === number && (task.source.subpart || '') === letter);
 assert.deepEqual(Array.from(at(37).steps.filter(step => step.answer), step => actual(step.answer)), [40,30,10,4].map(m => 100 * m / 500));
 assert.deepEqual(Array.from(at(38).steps.filter(step => step.answer), step => actual(step.answer)), [8.4,6.2]);
 assert.equal(actual(at(39).answer), 42 * 4 / 60);
 assert.equal(actual(at(40).answer), 12 * 100000 / 300000);
 for (const [i,[printedValue, corrected]] of [[.16,.08/5],[10,4+6.5],[18,12*2],[9/32,9/(26+8)]].entries()) {
  const task = at(41,String(i+1));
  assert.equal(actual(task.answer), printedValue);
  assert.equal(actual(task.steps[1].answer), corrected);
 }
 for (const [i,[numerator,denominator]] of [[5,1],[1,2],[1,4],[1,6],[2,3],[2,5],[5,6],[3,4]].entries()) {
  const task = at(42,String(i+1)), anchor = Number(task.steps[0].prompt.match(/колеса (\d+) зубцов/)[1]);
  assert.equal(task.kind, 'manual');
  assert.deepEqual(Array.from(task.gearRatio), [numerator,denominator]);
  assert.equal(actual(task.steps[0].answer)*denominator, anchor*numerator);
  assert.equal(actual(task.steps[0].answer)%5,0);
  assert(actual(task.steps[0].answer)>=15 && actual(task.steps[0].answer)<=120);
 }
 assert.deepEqual(Array.from(at(43).steps.slice(0,2), step => actual(step.answer)), [100*240/4000,100*900/18000]);
 assert.equal(at(43).answer, 'Ставка выше в первом, сумма больше во втором');
 assert.equal(actual(at(44,'а').answer), 400*20/100);
 assert.equal(actual(at(44,'б').answer), 100*30/(1.2*1000));
}

{
 const scale = D.lessons.find(lesson => lesson.id === 'p16');
 assert.deepEqual(Array.from(Object.values(scale.completeSourceSection)), [28,56,12,15]);
 assert.equal(scale.tasks.length,79);
 const source = (number,part='') => scale.tasks.find(t => t.source.exercise === number && (t.source.subpart||'') === part);
 const ending = [[45,'1234'],[46,'1234'],[47,'123456'],[48,'1234'],[49,''],[50,''],[51,''],[52,''],[53,'123'],[54,'1234'],[55,'1234'],[56,'12']];
 for(const [number,letters] of ending) {
  const parts=Array.from(scale.tasks.filter(t=>t.source.exercise===number), t=>t.source.subpart||'').sort();
  const wanted=letters ? [...letters] : [''];if(number===55)wanted.unshift('');
  assert.deepEqual(parts,wanted);
  assert.equal(source(number,letters[0]||'').source.page,number<=51?14:15);
 }
 const roots = [
  [48,1,'32',x=>[x/7.2,(1+1/9)/.25]],
  [48,2,'2',x=>[(2+1/3)/(.6*x),2.5/(1+2/7)]],
  [48,3,'2/5',x=>[(7/12)/.14,(50*x)/4.8]],
  [48,4,'17/2',x=>[(1+3/17)/13.75,(2+2/11)/(3*x)]],
  [54,1,'1/4',x=>[x/6.3,(1/9)/2.8]],
  [54,2,'1',x=>[(1+1/3)/(2+5/6),(2/17)/(.25*x)]],
  [54,3,'5/4',x=>[6.125/(4*x),.35/(2/7)]],
  [54,4,'30',x=>[(2+1/4)/1.6,.125*x/(2+2/3)]]
 ];
 for(const [number,part,expected,equalities] of roots){
  const t=source(number,String(part)),root=M.parse(t.answer),x=root.n/root.d;
  assert.equal(t.crossScale.solution,expected);assert(M.equal(t.answer,expected));
  const [left,right]=equalities(x),[otherLeft,otherRight]=equalities(2*x);
  assert(Math.abs(left-right)<1e-9);assert(Math.abs(otherLeft-otherRight)>.001);
  assert(M.equal(M.operation('multiply',t.crossScale.factor,t.answer),t.crossScale.constant));
 }
 assert.equal(source(46,'1').answer,'(7a + 8)/(2a²)');
 assert.equal(source(46,'2').answer,'(b − 5)/b');assert.equal(source(46,'3').answer,'12c/d²');assert.equal(source(46,'4').answer,'2n/k');
 for(const x of [-5,-2,1,3,7])for(const y of [-3,2,4]){
  for(const [v,w]of [[7/(2*x)+4/x**2,(7*x+8)/(2*x**2)],[1-5/x,(x-5)/x],[3*x/(x**3/(4*y)),12*y/x**2],[y/(5*x**2)*10*x,2*y/x]])assert(Math.abs(v-w)<1e-10);
 }
 assert.deepEqual(Array.from(scale.tasks.filter(t=>t.source.exercise===47), t=>t.answer),['4a/5','3b/5','100(x − y)/x','3,4c и 0,7c²','1,2d','1,0609k']);
 for(const start of [20,80,300]){
  assert.equal((4*start/5)*1.25,start);assert.equal(.2*start+.5*.8*start,3*start/5);
  assert.equal(Math.round(10000*1.03*1.03*start),10609*start);
 }
 assert.equal(source(49).answer,'80000');
 assert.equal(1.5/1.2>2.4/2,true);assert.equal(source(52).answer,'Первая лестница');
 for(const [n,expected]of [[1,'100b/a'],[2,'5c'],[3,'0,3d']])assert.equal(source(53,String(n)).answer,expected);
 const printed=[(4.5+3+5/6)*.6,3.7/(1+2/9-.4),(4/(4/7)*.3)/(2.88/4.8),(.5+1/18)/((1+1/6-7/18)/2.8)];
 for(const [i,val]of printed.entries()){const r=M.parse(source(55,String(i+1)).answer);assert(Math.abs(r.n/r.d-val)<1e-9);}
 assert.equal(source(55).source.readingKey,5);assert.equal(source(55).answer,'0');assert.equal(2-2,0);
}

{
 const printed=D.lessons.find(l=>l.id==='p35');
 const cases=[
  [42,'абвгде',[(x)=>-4*x+x+2*x,x=>3*x-7*x-x,x=>-.3*x-x+2.1*x,x=>x-1.6*x-.9*x,x=>1.8*x-2*x+x-.4*x-1.3*x,x=>(-4/5)*x+.2*x-(5/6)*x+x+x/3]],
  [43,'абвг',[(a,b)=>4*a-b/7+2.3*b-3*a/7,(x,y)=>-.3*x**2*y+x*y**2+5*x**2*y-2.1*x*y**2,a=>-5*a**2+9*a-4+a**2+7-18*a,(n,m)=>2*n**3*m+4.3*n*m**3-.5*n**2*m**2+3.6*n*m**3]],
  [44,'абв',[y=>-3*y+12-y-5,k=>2*k-k**2-3*k+4,(x,y)=>.6*x-x+1.6*y+.4*x]],
  [45,'абвг',[(c,d)=>-7*c+3*d+8*c-5*d,m=>-9+2*m-4-m+8,(k,n)=>3*k/5-2*n/7-3*k-5*n/7+.4*k,p=>-1+p**2-3*p+.2-.5*p**2+.8+2.4*p]],
  [46,'аб',[(m,c)=>-2*m/3+4*c+m/2-2.5*c+m/6,(x,y)=>1.8*x**2+.6*y**2-5.1*y**2+3.2*x**2+4.5*y**2]],
  [47,'абвгде',[y=>-(y-16)+4*(2*y-3),(a,b)=>5*(a-2*b)+3*(-a+3*b),(m,n)=>4*(m+5*n)-5*(m-3*n),(b,x)=>-b*(1+x)+b*(1-x),(p,k)=>1.6*(2*p-k)-.8*(4*p-5*k),(c,d)=>-.2*(5*c+3*d)-.5*(-4*c+.8*d)]]
 ];
 const keys=[['n','x','a','c','y','b'],['ab','xy','a','nm'],['y','k','xy'],['cd','m','kn','p'],['mc','xy'],['y','ab','mn','bx','pk','cd']];
 const value=raw=>{const v=M.parse(raw);return v.n/v.d;};
 function grouped(groups,letters){
  return groups.reduce((total,[variables,items])=>{
   let term=items.reduce((s,v)=>s+value(v),0);
   for(const [_,letter,power]of variables.matchAll(/([a-z])([²³]?)/g))term*=letters[letter]**(power==='²'?2:power==='³'?3:1);
   return total+term;
  },0);
 }
 for(const [j,[n,labels,forms]]of cases.entries()){
  const cards=printed.tasks.filter(t=>t.source.exercise===n);assert.deepEqual(Array.from(cards,t=>t.source.subpart).sort(),[...labels].sort());
  for(const [i,letter]of [...labels].entries()){
   const card=cards.find(t=>t.source.subpart===letter);assert.equal(card.source.page,12);const study=card.likeTermsStudy;
   if(!study){const existing={'p35-t01':'−n','p35-t02':'−4y+7','p35-t03':'c−2d','p35-t04':'2,4k'};assert.equal(card.answer,existing[card.id]);continue;}
   for(const [x,y]of [[-3,2],[-1,-3],[0,4],[1,-2],[4,3]]){
    const vars=Object.fromEntries([...keys[j][i]].map((v,index)=>[v,index?y:x]));
    assert(Math.abs(grouped(study.groups,vars)-forms[i](x,y))<1e-9,card.source.reference);
   }
   if(n===46){const original=study.substitutions[0];assert(Math.abs(grouped(study.groups,Object.fromEntries(Object.entries(original).map(([letter,v])=>[letter,value(v)])))-value(card.answer))<1e-9);}
   if(n===43)assert.equal(card.kind,'manual');
  }
 }
}

{
 const p=D.lessons.find(l=>l.id==='p17');
 const first=p.tasks.filter(t=>t.source.exercise<=63);assert.equal(first.length,21);
 const at=(number,s='')=>first.find(t=>t.source.exercise===number&&(t.source.subpart||'')===s);
 for(const [n,labels]of [[57,'абвг'],[58,''],[59,'12'],[60,'абвг'],[61,'абвг'],[62,'абвг'],[63,'аб']]){
  assert.deepEqual(Array.from(first.filter(t=>t.source.exercise===n),t=>t.source.subpart||'').sort(),labels?[...labels].sort():['']);
  assert(first.filter(t=>t.source.exercise===n).every(t=>t.source.page===18));
 }
 const value=v=>{const r=M.parse(v);return r.n/r.d;};
 for(const [n,items]of [[57,[[7,14,3,6],[8,3,40,15],[36,20,9,5],[2,10,3,15]]],[60,[[9,1,18,2],[1,4,3,12],[.5,1/30,6,.4],[8,2.4,5,1.5]]],[61,[[4,6/5,5,1.5],[9,10,.9,.01],[7,14,7/3,14/3],[3,2.5,4,10/3]]]]){
  for(const [i,[a,b,c,d]]of items.entries()){
   const t=at(n,'абвг'[i]);const same=Math.abs(a*d-b*c)<1e-9;
   if(!t.proportionReading){assert(['p17-t01','p17-t02'].includes(t.id));continue;}
   const real=Array.from(t.proportionReading,value);assert.deepEqual(real,[a,b,c,d]);
   if(n===61)assert.equal(t.answer,same?'Да, это пропорция':'Нет, равенство неверно');
   for(const [step,expected]of t.steps.filter(s=>s.answer).map((s,i)=>[s,n===61?[a/b,c/d,a*d,b*c][i]:[a*d,b*c][i]]))
    assert(Math.abs(value(step.answer)-expected)<1e-9,t.source.reference);
  }
 }
 const list=at(58);assert.deepEqual(Array.from(list.source.entries),Array.from({length:10},(_,i)=>String(i+1)));
 assert.deepEqual(Array.from(list.steps,step=>M.answer(M.parse(step.answer))),['1/3','3','5/2','1/15','1/9','1/5','3/10','1/4','1/15','30']);
 const entries=list.ratioCollection.map(([a,b])=>M.operation('divide',a,b));const ties=[];
 for(let i=0;i<10;i++)for(let j=i+1;j<10;j++)if(M.equal(entries[i],entries[j]))ties.push([i+1,j+1]);
 assert.deepEqual(ties,[[4,9]]);
 assert.equal(at(59,'1').answer,'mp = nk');assert.equal(at(59,'2').answer,'xt = yz');
 for(const [i,expected]of [40,72,54,1/7].entries()){
  const task=at(62,'абвг'[i]);assert.equal(task.kind,'manual');
  const numbers=task.fourPlaces.map(value);const solutions=[];
  for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++){
   if(new Set([a,b,c]).size!==3)continue;const d=6-a-b-c;if(Math.abs(numbers[a]/numbers[b]-numbers[c]/numbers[d])<1e-9)solutions.push(numbers[a]*numbers[d]);
  }
  assert.equal(solutions.length,8);assert(solutions.every(x=>Math.abs(x-expected)<1e-9));assert(Math.abs(value(task.steps[1].answer)-expected)<1e-9);
 }
}

{
 const rows=D.lessons.find(l=>l.id==='p35').tasks.filter(t=>t.source.exercise>=48&&t.source.exercise<=53);
 assert.equal(rows.length,23);
 const get=(n,part)=>rows.find(t=>t.source.exercise===n&&(t.source.subpart||'')===part);
 const val=s=>{const r=M.parse(s);return r.n/r.d;};
 for(const [n,wanted]of [[48,'абвг'],[49,'абвг'],[50,'аб'],[51,'абв'],[52,'абвгде'],[53,'абв']]){
  const printed=rows.filter(t=>t.source.exercise===n);
  assert.deepEqual(Array.from(printed.filter(t=>t.source.subpart),t=>t.source.subpart).sort(),[...wanted].sort());assert(printed.every(t=>t.source.page===13));
 }
 const sides=[x=>8*(x-4)+3*(2-x),y=>2*(3*y+4)-(9*y-7),n=>3*(2*n-5)-2*(3-4*n),k=>-4*(.3*k-.4)+6*(-.8*k+.2)];
 for(const [i,t]of rows.filter(t=>t.source.exercise===48).entries()){
  const model=t.collectedEquation;for(const x of [-4,0,1,val(t.answer),val(t.answer)+1,3])assert(Math.abs(sides[i](x)-(val(model.factor)*x+val(model.constant)))<1e-10);
  assert(Math.abs(sides[i](val(t.answer))-[-21,15,0,0][i])<1e-9);
 }
 const printed=[a=>2*(6*a-1)+4*(2-a),b=>15*b-3*(2*b+5)+2*(-5*b+7),n=>2*n*(n-4)-n*(n-8),(x,y)=>x*(x+y)-y*(x-y)];
 for(const [i,t]of rows.filter(t=>t.source.exercise===49).entries()){
  const k=t.likeTermsStudy,sub=Object.values(k.substitutions[0]).map(val);assert(Math.abs(printed[i](...sub)-val(t.answer))<1e-9);
 }
 assert.equal(1.5*12+.5*(12+16),32);assert.equal(val(get(50,'а').answer),12+28);
 assert.equal(6*(12+2)+8*(12-2),164);assert.equal(val(get(50,'б').answer),54/12);
 const diagrams=[[-6+4,-6-3,-6*(2/3),-6/.3,-6+.4,-6/12,-6*0,-6+3/7],[-1/3,.6,-1,4/3,-4,7/5,-2/3,0].map(x=>x/(2/3)),[-.4+1.2,-.4-.9,-.4*.1,-.4/.2,-.4+3,-.4-1/5,-.4*5/8,-.4*2.5]];
 for(const [i,actual]of diagrams.entries()){
  const task=get(51,'абв'[i]);assert.equal(task.kind,'manual');assert.equal(task.figure.type,'operation-wheel');assert.equal(task.spokeStudy.direction,i===1?'in':'out');assert.equal(task.steps.length,8);
  for(const [j,v]of actual.entries())assert(Math.abs(val(task.steps[j].answer)-v)<1e-9);
 }
 const direct=[.8*19+.8*21,2/9*43+2/9*32,6*(-.9)+14*(-.9),.3*(7/11)-(7/11)*5.8,.9*2.43-2.43,(1+1/3)*4.6-(1+1/3)*4.35];
 for(const [i,v]of direct.entries())assert(Math.abs(val(get(52,'абвгде'[i]).answer)-v)<1e-9);
 for(const t of rows.filter(t=>t.source.exercise===53&&t.kind==='number')){
  const [a,b]=t.differenceSquareStudy.source;assert.deepEqual(Array.from(t.steps,s=>val(s.answer)),[(a-b)**2,a*a-b*b,a*a-2*a*b+b*b]);assert.equal(val(t.answer),(a-b)**2);
 }
 assert.equal(get(53,'').kind,'manual');
}

{
 const all=D.lessons.find(l=>l.id==='p35').tasks,rows=all.filter(t=>t.source.exercise>=54&&t.source.exercise<=58);
 assert.equal(rows.length,27);assert(rows.every(t=>t.source.page===14));
 const of=n=>rows.filter(t=>t.source.exercise===n),val=raw=>{const r=M.parse(raw);return r.n/r.d;};
 for(const [n,letters]of [[54,'абвг'],[56,'абвгде'],[57,'абвгд'],[58,'абвгд']])assert.deepEqual(Array.from(of(n),t=>t.source.subpart),[...letters]);
 assert.deepEqual(Array.from(of(55),t=>[t.source.subpart,t.source.diagram||null]),[['а',null],['б',1],['б',2],['б',3],['б',4],['в',null],['г',null]]);
 for(const a of [-3,0,2])for(const b of [-2,0,.5,3])assert(-(a-b)===b-a);
 assert(-(2+3)!==-2+3);assert((-1)**2>(-1+1)**2);assert(.5**3<.5**2);
 assert.deepEqual(Array.from(of(55).slice(1,5),t=>t.answer),['CL','DK','Среди проведённых внутри отрезков высоты MNP нет','XZ, YZ и ZT']);
 assert.deepEqual(Array.from(of(56),t=>val(t.answer)),[50,25,20,100/3,75,60]);assert.deepEqual(Array.from(of(57),t=>val(t.answer)),[100,200,75,25,50]);
 for(const t of of(56)){assert(Math.abs(100*val(t.percentagePortion)-val(t.answer))<1e-9);}
 for(const t of of(57)){assert(Math.abs(100*Math.abs(val(t.percentageChange)-1)-val(t.answer))<1e-9);}
 assert.deepEqual(Array.from(of(58),t=>t.answer),['2,2a','25b/27','100(x − y)/x','1,54n','2,5k']);
 const equations=[([first,next,total])=>next===1.2*first&&total===first+next,([sale,cost,profit])=>Math.abs(sale-1.08*cost)<1e-9&&profit===sale-cost,([first,last,rate])=>Math.abs(100*(first-last)/first-rate)<1e-9,([first,mid,last])=>Math.abs(mid-1.1*first)<1e-9&&Math.abs(last-1.4*mid)<1e-9,([last,mid,first])=>mid===.8*first&&last===.5*mid];
 for(const [i,t]of of(58).entries())assert(t.percentNarrative.values.every(equations[i]));
}

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
assert.equal(p15.tasks.length,93);
{
const completeTopic=D.lessons.find(l=>l.id==='p15');
assert.deepEqual(Array.from(Object.values(completeTopic.completeSourceSection)),[1,27,6,10]);
const reviewedEnd=completeTopic.tasks.filter(t=>t.source.exercise>=20);
assert.equal(reviewedEnd.length,18);
const rates=reviewedEnd.filter(t=>t.source.exercise===21);
assert.deepEqual(Array.from(rates,t=>t.answer),['80','10','140','100/3','7','25/2','125','6']);
for(const [i,[x,y]] of [[.56,.7],[3/22,1+4/11],[3.6,2+4/7],[8+1/3,25],[2.8,4*10],[3,24],[5*100,400],[180,3*1000]].entries()){
 const r=M.parse(rates[i].answer);assert(Math.abs(r.n/r.d-100*x/y)<1e-9);
}
assert.equal(1.5*16-5,16+3);
assert(Math.abs((2*2.4-3)-4.5*(2.4-2))<1e-9);
assert.equal((180*.1+360*.15+460*.3)/(180+360+460)*100,21);
assert.equal(12*11-39,8*11+5);
assert(Math.abs(6*(4-1.4)-(3.5*4+1.6))<1e-9);
assert.equal(2*12,.8*(12+18));assert.equal(10+5*4,3*10);
const add=(a,b)=>M.operation('add',a,b),sub=(a,b)=>M.operation('subtract',a,b),mul=(a,b)=>M.operation('multiply',a,b),div=(a,b)=>M.operation('divide',a,b);
const numA=sub(mul(sub('7 3/8','2.125'),'2 2/7'),div('39.48','5.6'));
const denA=sub(mul(div(sub(mul('3.4','.9'),'2.7'),'.06'),'2 2/3'),mul('30.9','.5'));
const numB=mul(sub(mul('6.1','3.05'),mul('2.05',add('4 3/5','4.46'))),'22.5');
const denB=mul(div(add(add('1 1/4','.5'),'2 1/3'),'2 1/24'),'.01');
assert.deepEqual([numA,denA,numB,denB].map(M.answer),['99/20','11/20','18/25','1/50']);
assert.deepEqual([div(numA,denA),div(numB,denB)].map(M.answer),['9','36']);
}
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
{
 const topic=D.lessons.find(l=>l.id==='p35');
 assert.deepEqual(Object.values(topic.completeSourceSection),[42,68,12,15]);
 assert.equal(topic.tasks.length,98);
 const row=(n)=>topic.tasks.filter(t=>t.source.exercise===n);
 for(let n=42;n<=68;n++)assert(row(n).length,'source coverage '+n);
 for(const [n,letters]of [[59,'абвг'],[60,''],[61,'абв'],[62,'абвг'],[63,'аб'],[64,'абв'],[65,''],[66,''],[67,'абв'],[68,'']]){
  assert.deepEqual(Array.from(row(n),t=>t.source.subpart||''),letters?[...letters]:['']);
  assert(row(n).every(t=>t.source.page===15));
 }
 const cents=(raw)=>{const r=M.parse(raw);return r.n/r.d;},near=(a,b)=>assert(Math.abs(a-b)<1e-10);
 const printedLeft=[x=>x*x,x=>x*x,x=>x*x+9,x=>x*x-25,x=>x**3+x*x,x=>x**4+x*x,x=>x**5-x**4];
 const expected=[[-2,2],[],[],[-5,5],[4],[-2,2],[3]];
 for(const [i,t] of [...row(59),...row(67)].entries()){
  const good=[];for(let x=-12;x<=12;x++)if(printedLeft[i](x)===t.integerTrial.right)good.push(x);
  assert.deepEqual(good,expected[i],t.source.reference);
 }
 const total=24+20+20*1.6+(20-16);near(total,cents(row(60)[0].answer));
 const [va,vb,vc]=row(61).map(t=>cents(t.answer));near(va,2.5-3/4);near(vb,-2*(-0.3)+1);near(vc,(-5)**2-10);
 const [xa,xb]=row(63).map(t=>cents(t.answer));near(-2*(xa-9)+5*(xa-4),25);near(4*(5-xb)-3*(2*xb+7),0);
 const [w,c,r]=row(64).map(t=>cents(t.answer));near(w*.36,27);near(c*.85,5100);near(96*(1+r/100),120);
 const share=cents(row(65)[0].answer);near(180*share*20+180*(1-share)*16,3360);
 const value=cents(row(66)[0].answer),num=10.2/(18.5-((5+2/3)*1.75-(3+2/3)*1.75)/(2+1/3)),den=80.64/1.6-3.4/(1/6);
 near(num/den,value);
 const price=cents(row(68)[0].answer)*4/10;near(25*price-1,5-5*price);
}
{
 const topic=D.lessons.find(l=>l.id==='p17'),of=n=>topic.tasks.filter(t=>t.source.exercise===n);
 for(const n of [64,65,66])assert(of(n).every(t=>t.source.page===19));
 assert.equal(of(64)[0].answer,'8');assert.equal(of(65)[0].steps.length,9);
 const answers=new Map(Array.from(of(66),t=>[t.source.subpart,t.answer]));
 assert.deepEqual(Array.from(answers.keys(),Number).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8]);
 for(const [i,x]of ['10','36','12','12/5','20','6','21/2','120'].entries())assert(M.equal(answers.get(String(i+1)),x));
 const expected=[[12,15],[12/5,15/2],[20,15],[6,7],[120,100]];
 for(const [j,t]of of(66).filter(t=>t.missingRatio).entries()){
  for(const [variant,cells]of t.missingRatio.sets.entries()){
   const values=cells.map(raw=>raw===null?expected[j][variant]:(v=>v.n/v.d)(M.parse(raw)));
   assert(Math.abs(values[0]*values[3]-values[1]*values[2])<1e-9);
   const q=M.parse(t.missingRatio.answers[variant]);assert(Math.abs(q.n/q.d-expected[j][variant])<1e-9);
  }
 }
}
{
 const chapter=D.lessons.find(l=>l.id==='p17'),rows=chapter.tasks.filter(t=>t.source.exercise===67);
 const keyed=new Map(Array.from(rows,t=>[t.source.subpart,t]));assert.equal(keyed.size,12);
 const functions=[a=>[5.4/a,1.8/6.8],b=>[b/(6/7),(5+4/9)/(4+2/3)],c=>[720/91.2,c/.513],
  d=>[4.2/(7+5/7),(3+1/9)/d],k=>[2.4/(.5*k),3.6/(1+2/3)],m=>[7/(4/11*m),56/3.2],
  n=>[8*n/9,6.4/.45],p=>[2.1/27,(2+1/3)/(.3*p)],x=>[4/(x-3),2/3],
  y=>[(2*y+1.6)/.8,30/2.5],x=>[1.5/(4*x-1),.4/(x+4)],y=>[5*y/(1+1/3),(y-.9)/.2]];
 for(const [index,evaluate]of functions.entries()){
  const row=keyed.get(String(index+1)),q=M.parse(row.answer),value=q.n/q.d,[a,b]=evaluate(value);
  assert(Math.abs(a-b)<1e-9,row.source.reference);const [l,r]=evaluate(value+1);assert(Math.abs(l-r)>1e-8,row.source.reference);
  if(row.affineRatios){
   const t=row.affineRatios,real=s=>{const r=M.parse(s);return r.n/r.d;};
   for(const x of [value,0,1.5]){const cells=t.terms.map(v=>Array.isArray(v)?real(v[0])*x+real(v[1]):real(v));const numeric=evaluate(x);
    for(const [j,quotient]of [cells[0]/cells[1],cells[2]/cells[3]].entries())if(Number.isFinite(numeric[j]))assert(Math.abs(quotient-numeric[j])<1e-8,row.source.reference);
   }
  }
 }
 const other=n=>chapter.tasks.filter(t=>t.source.exercise===n);
 assert.equal(other(68).length,2);assert.equal(other(69)[0].kind,'manual');assert.equal(other(70).length,2);
 const answers=[...other(68),...other(70)].map(t=>{const r=M.parse(t.answer);return r.n/r.d;});
 assert.deepEqual(answers,[12,.2,12.5,4.8]);
}
{
 const all=D.lessons.find(l=>l.id==='p17').tasks,get=n=>all.filter(t=>t.source.exercise===n);
 for(const [n,count]of [[71,2],[72,2],[73,2],[74,3],[75,2]]){
  const r=get(n);assert.deepEqual(Array.from(r,t=>t.source.subpart),Array.from({length:count},(_,i)=>String(i+1)));assert(r.every(t=>t.source.page===20));
 }
 const ratio=4/2.5,side=get(71)[1].steps.map(t=>{const r=M.parse(t.answer);return r.n/r.d;});
 for(const [i,value]of [4.8/ratio,3.2/ratio,1.5*ratio,2*ratio].entries())assert(Math.abs(side[i]-value)<1e-9);
 assert.equal(Number(get(71)[0].answer),ratio*100);assert.equal(Number(get(72)[0].answer),80*2/5);assert.equal(Number(get(72)[1].answer),18*5/2);
 for(const [i,value]of [10*22/7,60*7/22].entries())assert(M.equal(get(73)[i].answer,(Math.round(value*10)/10).toString()));
 assert([...get(74),...get(75)].every(t=>t.kind==='manual'&&!t.answer));
}
{
 const bank=D.lessons.find(l=>l.id==='p17').tasks,of=n=>bank.filter(t=>t.source.exercise===n);
 for(const [n,k]of [[76,4],[77,6],[78,1],[79,8],[80,1],[81,1],[82,1]]){
  assert.equal(of(n).length,k);assert(of(n).every(t=>t.source.page===21));
 }
 for(const [j,r]of [2,3.5,.25,.75,1/3,.4,.5,5].entries()){
  const expected=of(79)[j],v=M.parse(expected.answer);assert(Math.abs(v.n/v.d-100*Math.abs(r-1))<1e-8);
 }
 const r=of(81)[0];assert.match(r.explanation,/с\. 128/);
 for(const s of [18,36,54]){
  const bus=s/40,carA=s/24,carB=bus*1.4;
  assert(Math.abs(s/(bus+carA)-15)<1e-9);assert(Math.abs(s/(bus+carB)-50/3)<1e-9);
 }
 for(const [i,raw]of ['24','15','12/5','50/3'].entries())assert(M.equal(r.steps[i].answer,raw));
 const bike=M.parse(of(82)[0].answer),walk=bike.n/bike.d/3.5;assert(Math.abs((bike.n/bike.d-walk)*1.5-16.5)<1e-8);
}
{
 const all=D.lessons.find(l=>l.id==='p17').tasks,of=n=>all.filter(t=>t.source.exercise===n);
 for(const [n,k]of [[83,4],[84,1],[85,1],[86,3],[87,3]]){assert.equal(of(n).length,k);assert(of(n).every(t=>t.source.page===22));}
 for(const [i,x]of [36,84,56,64].entries())assert.equal(Number(of(83)[i].steps[1].answer),x);
 assert.equal(of(84)[0].kind,'manual');assert.equal(of(85)[0].steps.length,12);
 const expressions=[x=>[x/250,5.08/12.5],y=>[1.32/(3+1/7),1.4*y/(5/6)],z=>[4.8/(2*z+15),.2/5]];
 for(const [i,t]of of(86).entries()){const r=M.parse(t.answer),[a,b]=expressions[i](r.n/r.d);assert(Math.abs(a-b)<1e-9,t.source.reference);}
 const figure=of(87);assert.equal(figure[0].answer,'50');assert.equal(figure[1].kind,'manual');assert.equal(figure[2].kind,'manual');
 const pdfToCm=2.54/72;assert(Math.abs(170.10*pdfToCm-6)<.01);assert(Math.abs(92.65*pdfToCm-3.27)<.01);
 for(const [span,cm]of [[212.60,7.5],[127.55,4.5],[85.05,3]])assert(Math.abs(span*pdfToCm-cm)<.01);
}
{
 const chapter=D.lessons.find(l=>l.id==='p17'),of=n=>chapter.tasks.filter(t=>t.source.exercise===n);
 assert.deepEqual(Object.values(chapter.completeSourceSection),[57,95,18,24]);assert.equal(chapter.tasks.length,103);
 for(let n=57;n<=95;n++)assert(of(n).length,'missing source number '+n);
 for(const [n,k]of [[88,1],[89,1],[90,1],[91,2],[92,2],[93,1],[94,1],[95,1]]){
  assert.equal(of(n).length,k);assert(of(n).every(t=>t.source.page===(n===95?24:23)));
 }
 assert.equal(Number(of(88)[0].answer),31.5*(31.5/7*4));
 assert.equal(Number(of(89)[0].answer),145/(145/2.5+145/2.5*1.5));
 assert.deepEqual(Array.from(of(90)[0].steps).slice(0,7).map(t=>{const v=M.parse(t.answer);return v.n/v.d;}),[12,8,6,4,3,1.5,1]);
 const values=[3.6*(3/4+2/9+5/12),84.8*.125/(10.07/.95),(4+1/12-1/3)/.15-(14-.14)/.014/99,.28*4500/50.4*((16.2-(12+2/5))/190+.1)];
 values.forEach((v,i)=>assert(Math.abs(v-Number(of(92)[0].steps[i].answer))<1e-9));
 const minimum=Number(of(93)[0].answer);assert.equal(minimum%36,0);assert.equal(new Set(String(minimum)).size,10);
 for(let x=1023456789;x<minimum;x++){if(x%36===0)assert(new Set(String(x)).size!==10);}
 const correct=[];for(let x=5;x<=9;x++)if(String(x*2).split('').reverse().join('')===String(x*x))correct.push(x*x);assert.deepEqual(correct,[Number(of(94)[0].answer)]);
 const orders=[];for(const a of 'АБВГ')for(const b of 'АБВГ')for(const c of 'АБВГ')for(const d of 'АБВГ'){
  if(new Set([a,b,c,d]).size!==4)continue;
  if(Number(a==='А')+Number(b==='Б')===1&&Number(b==='А')+Number(c==='Г')===1&&Number(b==='В')+Number(d==='Г')===1)orders.push(a+b+c+d);
 }
 assert.deepEqual(orders,['АВГБ']);
}
{
 const rows=D.lessons.find(l=>l.id==='p36').tasks,sel=n=>rows.filter(t=>t.source.exercise===n);
 for(const [n,k,page]of [[69,5,17],[70,4,18],[71,4,18],[72,9,18]]){assert.equal(sel(n).length,k);assert(sel(n).every(t=>t.source.page===page));}
 for(const [i,x]of [0,1,2,3,1].entries())assert.equal(sel(69)[i].equationNotation.kind,x);
 const functions={absSign:x=>[Math.abs(-x),-x],selfSquare:x=>[x*x,2*x],triple:x=>[x*(x-1)*(x+1),0],quadratic:x=>[2*x*x+5*x+2,0]};
 for(const t of rows.filter(t=>t.rootProbe)){
  const r=M.parse(t.rootProbe.initial),pair=functions[t.rootProbe.rule](r.n/r.d);
  assert.deepEqual(Array.from(t.steps,z=>{const x=M.parse(z.answer);return x.n/x.d;}),pair);assert.equal(t.answer==='Это корень.',pair[0]===pair[1]);
 }
 const roots=[[],[0],[-4,4],[],[0],[5],[-3,6],[-4,-2,0,1,3]];
 for(const [j,t]of sel(72).filter(t=>t.rootCount).entries()){
  const item=t.rootCount,found=[];for(let n=-12;n<=12;n++){
   const expressions={abs:Math.abs(n),square:n*n,fractionX:n===0?NaN:(n*n-5*n)/n,fractionY:n===0?NaN:2*(n*n-3*n-18)/n,fiveFactors:-4*n*(n-1)*(n+2)*(n-3)*(n+4)};
   if(expressions[item.rule]===item.rhs)found.push(n);
  }assert.deepEqual(found,roots[j]);assert.equal(Number(t.steps[1].answer),found.length);
 }
}
{
 const rows=D.lessons.find(l=>l.id==='p36').tasks;
 const part=n=>Array.from(rows.filter(t=>t.source.exercise===n)).sort((a,b)=>(a.source.subpart||'').localeCompare(b.source.subpart||'','ru'));
 for(const [n,total]of [[73,4],[74,3],[75,6],[76,5],[77,1],[78,8]]){
  assert.equal(part(n).length,total);assert(part(n).every(t=>t.source.page===18));
 }
 for(const t of [...part(73),...part(74)]){assert.equal(t.kind,'manual');assert(t.steps.every(s=>s.kind==='instruction'));}
 const roots=[[],[-5,5],[],[-.8],[1,3]],calc=[
  x=>2*x+3*(x-2)-5*(x-3),x=>x*x-25,x=>x*x+36,x=>Math.abs(5*x+4),x=>Math.abs(x-2)-1,
 ];
 for(const [i,t] of part(75).slice(1).entries()){
  const got=[];for(let n=-40;n<=40;n++){const x=n/5;if(Math.abs(calc[i](x))<1e-8)got.push(x);}
  assert.deepEqual(got,roots[i]);assert.equal(Number(t.steps[1].answer),roots[i].length);
 }
 const all=[-2,0,5/3];assert(all.every(x=>Math.abs(3*x*(x+2)*(3*x-5))<1e-10));
 for(const [i,t]of part(76).entries()){assert.equal(t.rootDomain,i);const kept=all.filter(x=>[true,Number.isInteger(x),Number.isInteger(x)&&x>0,x>0,x>=0][i]);assert.equal(Number(t.steps[2].answer),kept.length);}
 const chain=part(77)[0],actual=Array.from(chain.steps,t=>Number(t.answer)).concat(Number(chain.answer));let x=36;assert.deepEqual(actual,[3,.01,10,2,5,4].map(d=>x/=d));
 assert.deepEqual(part(78).map(t=>{const q=M.parse(t.answer);return q.n/q.d;}),[-.5,2,.5,.5,2,-2,4,-4]);
}
{
 const rows=D.lessons.find(l=>l.id==='p36').tasks;
 const part=n=>Array.from(rows.filter(t=>t.source.exercise===n));
 for(const [num,count]of [[79,4],[80,2],[81,2],[82,6],[83,2],[84,1],[85,1]]){assert.equal(part(num).length,count);assert(part(num).every(t=>t.source.page===19));}
 assert.deepEqual(part(79).map(t=>t.quantifiedEquation),['inverseTotal','nonzeroProduct','existsOpposite','existsSquare']);
 const affine=[[-3,x=>2*(x-4)+9,x=>x-2],[2.5,x=>(x+3)/(3*x),()=>11/15],[2,x=>3*(5*x-8),x=>3*x]];
 [...part(80),...part(84)].forEach((t,i)=>{const [x,L,R]=affine[i],q=M.parse(t.answer);assert.equal(q.n/q.d,x);assert.equal(L(x),R(x));assert.notEqual(L(x+1),R(x+1));});
 const candidates=Array.from({length:120},(_,i)=>i+1),lhs=[x=>x*(x+12),x=>x*(x-9)*(15-x),x=>x*(x-4),x=>x*x+3*x];
 [...part(81),...part(83)].forEach((t,i)=>{const found=candidates.filter(x=>lhs[i](x)===t.naturalTrials.rhs);assert.deepEqual(found,[Number(t.answer)]);});
 const probed=[-9,-5,-3,-1,0,19/16,9/2,9],solutions=[[19/16],probed,[],[-9,9],[9/2],[-5,-1]];
 const check=[x=>Math.abs(48*x-57)<1e-10,()=>true,x=>x*x===-4,x=>x*x===81,x=>2*x===9,x=>Math.abs(x+3)===2];
 part(82).forEach((t,i)=>assert.deepEqual(probed.filter(check[i]),solutions[i],t.id));
 for(const cost of [100,50]){let x=Number(part(85)[0].answer)*cost/100;const initial=x;const yrs=[1,2,3].map(()=>x=(x-cost)*4/3);assert.deepEqual(yrs,[1840,2320,2960].map(v=>v*cost/100));assert.equal(x,2*initial);}
}
{
 assert.equal(D.lessons.find(l=>l.id==='p18').orderBySource,true);
 assert.deepEqual(Object.values(D.lessons.find(l=>l.id==='p36').completeSourceSection),[69,85,17,19]);
 const rows=D.lessons.find(l=>l.id==='p18').tasks,source=n=>Array.from(rows.filter(t=>t.source.exercise===n));
 for(const [n,count]of [[96,6],[97,4],[98,4],[99,4]]){assert.equal(source(n).length,count);assert(source(n).every(t=>t.source.page===26));}
 for(const t of rows.filter(t=>t.sourceRearrangement)){
  const s=t.sourceRearrangement;if(s.symbolic)continue;
  const raw=s.terms;
  const arrangements=[];
  for(const a of raw)for(const b of raw)for(const c of raw)for(const d of raw){if(new Set([a,b,c,d]).size!==4)continue;
   if(M.equal(M.operation('divide',a,b),M.operation('divide',c,d)))arrangements.push([a,b,c,d]);
  }
  assert.equal(arrangements.length,8,t.id);assert(M.equal(M.operation('multiply',raw[0],raw[3]),M.operation('multiply',raw[1],raw[2])));
 }
 for(const t of source(99)){
  const s=t.constantRateStory,expected=s.inputs.map(x=>M.operation('multiply',s.rate,x));
  for(const [i,y]of expected.entries())assert(M.equal(y,t.steps[i].answer),t.id);
  assert(M.equal(M.operation('divide',s.inputs[1],s.inputs[0]),M.operation('divide',expected[1],expected[0])));
 }
}
{
 const rows=D.lessons.find(l=>l.id==='p18').tasks,group=n=>Array.from(rows.filter(t=>t.source.exercise===n)).sort((a,b)=>Number(a.source.subpart)-Number(b.source.subpart));
 for(const [n,total]of [[100,7],[101,4],[102,3],[103,1]]){assert.equal(group(n).length,total);assert(group(n).every(t=>t.source.page===27));}
 for(const [i,t]of group(100).entries()){assert.equal(t.derivedProof,i+1);assert.equal(t.kind,'manual');}
 for(const [id,t] of group(101).entries()){assert.equal(t.deriveThree.terms.length,4);assert.equal(t.deriveThree.variant,id===0?'subtract':'complement');}
 assert.deepEqual(group(102).map(t=>t.parallelIntercept),['measure','explore','sum']);assert(group(102).every(t=>t.kind==='manual'));
 const t=group(103)[0],truth=Array.from(t.thalesCipher).filter(([l,a,b,c,d])=>M.equal(M.operation('multiply',a,d),M.operation('multiply',b,c))).map(v=>v[0]);
 assert.equal(truth.join(''),'ФАЛЕС');assert.equal(t.answer,'Фалес');
}
{
 const rows=D.lessons.find(l=>l.id==='p18').tasks,group=n=>Array.from(rows.filter(t=>t.source.exercise===n));
 for(const [n,total]of [[104,4],[105,8],[106,6],[107,2],[108,2],[109,1],[110,1],[111,1]]){assert.equal(group(n).length,total);assert(group(n).every(t=>t.source.page===28));}
 for(const t of group(104)){const f=t.missingOperation;const matches=['add','subtract','multiply','divide'].filter(k=>M.equal(M.operation(k,...f.terms),f.target));assert.equal(matches.length,1);assert.equal(t.answer,{add:'+',subtract:'−',multiply:'×',divide:'÷'}[matches[0]]);}
 for(const t of group(105)){for(const [j,vals] of t.missingRatio.sets.entries()){const v=Array.from(vals,x=>x===null?t.missingRatio.answers[j]:x);assert(M.equal(M.operation('multiply',v[0],v[3]),M.operation('multiply',v[1],v[2])),t.id);}}
 for(const t of group(106)){const q=t.affineRatios,vals=q.terms.map(v=>Array.isArray(v)?M.operation('add',M.operation('multiply',v[0],t.answer),v[1]):M.parse(v));assert(vals[1].n!==0&&vals[3].n!==0);assert(M.equal(M.operation('divide',vals[0],vals[1]),M.operation('divide',vals[2],vals[3])));}
 for(const [j,ans]of ['4/5','2'].entries())assert(M.equal(group(107)[j].answer,ans));
 for(const t of group(108)){const q=t.wholeFromExtras,all=M.parse(t.answer);const [f,g,a,b]=q.values.map(M.parse);assert(M.equal(all,M.operation('add',M.operation('multiply',all,M.operation('add',f,g)),M.operation('add',a,b))));}
 assert.equal(group(109)[0].answer,'На первом заводе');assert.equal(Number(group(110)[0].answer),90*1.2-100);assert.equal(Number(group(111)[0].answer),100-360*.25);
}
{
 const topic=D.lessons.find(l=>l.id==='p18'),rows=topic.tasks,group=n=>Array.from(rows.filter(t=>t.source.exercise===n));
 assert.deepEqual(Object.values(topic.completeSourceSection),[96,122,26,30]);
 for(const [n,count] of [[112,1],[113,1],[114,3],[115,3],[116,4],[117,2],[118,1],[119,1],[120,1],[121,2],[122,1]]){assert.equal(group(n).length,count);assert(group(n).every(t=>t.source.page===(n<=116?29:30)));}
 const salary=group(112)[0];assert.equal(Number(salary.answer),8000+8*2000);assert.deepEqual(Array.from(salary.steps,z=>Number(z.answer)),[2000,8,3,200]);
 const scores=Array.from(group(113)[0].scoreRanking).map(([letter,...marks])=>[letter,marks.reduce((x,y)=>x+y)/300]);assert.deepEqual(scores.map(x=>x[1]),[.60,1.20,.80,.96,1.04,1.32,.98]);assert.equal(scores.sort((a,b)=>b[1]-a[1]).map(x=>x[0]).join(''),'РЕЙТИНГ');
 for(const t of [...group(116),...group(120)]){const z=M.parse(t.answer),v=t.affineRatios.terms.map(x=>Array.isArray(x)?M.operation('add',M.operation('multiply',x[0],z),x[1]):M.parse(x));assert(M.equal(M.operation('divide',v[0],v[1]),M.operation('divide',v[2],v[3])),t.id);}
 assert.equal(Number(group(118)[0].answer),36);assert.equal(Number(group(119)[0].answer),(5225-5000)/5000/6*12*100);
 for(const [i,target]of ['0123456789','123456789'].entries()){
  const ks=[];for(let n=1;n<20;n++){const vals=[1,2,3,4,5].map(v=>v*n);if(vals.join('').split('').sort().join('')===target&&(i||vals.every(v=>v>=10&&v<100)))ks.push(n);}assert.deepEqual(ks,[i?9:18]);
 }
}
{
 const topic=D.lessons.find(l=>l.id==='p18'),groups=n=>Array.from(topic.tasks.filter(t=>t.source.exercise===n));
 assert.deepEqual(Object.values(topic.completeSourceReview),[123,131,31,31]);
 for(const [n,total]of [[123,4],[124,4],[125,3],[126,4],[127,3],[128,1],[129,2],[130,4],[131,2]]){assert.equal(groups(n).length,total);assert(groups(n).every(t=>t.source.page===31));assert(D.exerciseIndexByPart[2][n].review);}
 for(const t of [...groups(123),...groups(124)].filter(t=>t.reviewRatio)){const s=t.reviewRatio,q=M.operation('divide',...s.values);assert(M.equal(t.answer,s.percent?M.operation('multiply',100,q):q));}
 const [S,cm,km]=groups(125);assert(M.equal(S.answer,M.operation('divide',74400000,'18.6')));assert(M.equal(cm.answer,M.operation('divide',1490,100)));assert(M.equal(km.answer,M.operation('multiply','13.7',80)));
 for(const t of groups(126)){const s=t.missingRatio;for(const [i,values]of s.sets.entries()){const a=values.map(v=>v===null?s.answers[i]:v);assert(M.equal(M.operation('divide',a[0],a[1]),M.operation('divide',a[2],a[3])));}}
 for(const t of groups(127)){const s=t.affineRatios,q=M.parse(t.answer),v=s.terms.map(x=>Array.isArray(x)?M.operation('add',M.operation('multiply',x[0],q),x[1]):M.parse(x));assert(M.equal(M.operation('divide',v[0],v[1]),M.operation('divide',v[2],v[3])));}
 assert(M.equal(groups(129)[0].answer,21));assert(M.equal(groups(129)[1].answer,'.3'));assert.deepEqual(groups(130).map(t=>t.answer),['5a','9b/20','100d/c','x/25']);
 assert.deepEqual(groups(131).map(t=>Number(t.answer)),[100,0]);
}
{
 const topic=D.lessons.find(l=>l.id==='p37'),rows=topic.tasks;
 const sorted=n=>Array.from(rows.filter(t=>t.source.exercise===n)).sort((a,b)=>a.source.subpart.localeCompare(b.source.subpart,'ru'));
 const answers={86:['1','1','6','-7'],87:['-9','2','-3','-5/2','1/6','-2/3','-28/5','-3/2','1/10'],88:['4/5','-4','-2','1/6','2/3','Все рациональные числа'],89:['20','7','-28','12/5','-8/5','25']};
 for(const n of [86,87,88,89]){
  const group=sorted(n);assert.equal(group.length,answers[n].length);
  for(const [i,t] of group.entries()){
   assert.equal(t.source.page,22);assert(t.linearEquationStudy);assert(t.kind==='choice'?t.answer===answers[n][i]:M.equal(t.answer,answers[n][i]));const s=t.linearEquationStudy,[a,b,c,d]=s.coefficients.map(M.parse);
   if(t.kind==='number'){const q=M.parse(t.answer);assert(M.equal(M.operation('add',M.operation('multiply',a,q),b),M.operation('add',M.operation('multiply',c,q),d)),t.id);}
   else{assert(M.equal(a,c));assert(M.equal(b,d));}
   if(n===89)for(const v of [a,b,c,d])assert.equal(M.operation('multiply',v,s.clear).d,1);
  }
 }
}
{
 const l=D.lessons.find(l=>l.id==='p37'),group=n=>Array.from(l.tasks.filter(t=>t.source.exercise===n)).sort((a,b)=>a.source.subpart.localeCompare(b.source.subpart,'ru'));
 for(const [n,number]of [[90,4],[91,2],[92,2],[93,2],[94,2],[95,2],[96,8]]){assert.equal(group(n).length,number);assert(group(n).every(t=>t.source.page===23));}
 const expected={90:['6','-27/10','-21','-50'],91:['2','3'],92:['3','Корней нет'],93:['2','240'],94:['210','324'],95:['15','100'],96:['0','-1/4','1/6','Корней нет','25','-9','2/5','21/44']};
 for(const [n,keys]of Object.entries(expected))group(Number(n)).forEach((t,i)=>assert(t.kind==='choice'?t.answer===keys[i]:M.equal(t.answer,keys[i]),t.id));
 const fns=[x=>7*x*(9-2*x),x=>x*(2*x-1)*(4-x)*(x+1),x=>x*(x+8),x=>3*x*x-14*x-15];
 [...group(91),...group(92)].forEach((t,i)=>{const target=[70,60,33,0][i];const candidates=Array.from({length:75},(_,j)=>j+1).filter(x=>fns[i](x)===target);assert.deepEqual(candidates,[[2],[3],[3],[]][i]);});
 for(const t of [...group(90),group(96).at(-1)]){const q=t.affineRatios;const a=q.terms.map(v=>Array.isArray(v)?M.operation('add',M.operation('multiply',v[0],t.answer),v[1]):M.parse(v));assert(M.equal(M.operation('divide',a[0],a[1]),M.operation('divide',a[2],a[3])));}
 assert.equal(2-.5,1+.5);assert.equal(240-60,1.5*(60+60));assert.equal(105+60+45,210);assert.equal(108+120+96,324);assert.equal(150-5*15,120-3*15);assert.equal(300-25*10,(300-20*10)/2);
}
{
 const rows=D.lessons.find(l=>l.id==='p37').tasks,group=n=>Array.from(rows.filter(t=>t.source.exercise===n));
 for(const [n,total]of [[97,1],[98,2],[99,6],[100,6]]){assert.equal(group(n).length,total);assert(group(n).every(t=>t.source.page===24));}
 assert(M.equal(group(97)[0].answer,'27/2'));assert(M.equal(M.operation('multiply','27/2','20/27'),10));
 for(const [i,t]of group(98).entries()){const v=t.directedCycle;let n=M.parse(v.start);const vals=v.ops.map(([k,x])=>n=M.operation({'+':'add','−':'subtract','×':'multiply','÷':'divide'}[k],n,x));assert(M.equal(vals[5],v.start));assert.equal(t.steps.length,6);for(let k=0;k<5;k++)assert(M.equal(vals[k],t.steps[k].answer));assert.equal(v.side,i);}
 const keys=[['3/5','17/10','26/5','39/10','-1/2','-7/5'],['2/25','9/20','15','-3/50','9/25','-80']];
 for(const [j,n]of [99,100].entries())group(n).forEach((t,i)=>{assert(M.equal(t.answer,keys[j][i]),t.id);assert.equal(t.steps[0].kind,'choice');});
}
{
 const rows=D.lessons.find(l=>l.id==='p37').tasks,groups=n=>Array.from(rows.filter(t=>t.source.exercise===n));
 for(const [n,k]of [[101,4],[102,2],[103,6],[104,8]]){assert.equal(groups(n).length,k);assert(groups(n).every(t=>t.source.page===24));}
 const expected101=[['0','-3/4','-2/3','5/6','1/12','1/6','-3/4','-3/2','-17/12'],['7/3','3/2','3/4','1/3','-1/2','-5/4','5/6','0','-3/4'],['1','0','-1/2','-3/2','0','3/4','3','0','-3/2'],['2','-6/5','1/4','-4/3','4/5','-1/6','5','-3','5/8']];
 for(const [j,t]of groups(101).entries()){assert.equal(t.kind,'manual');assert.equal(t.steps.length,9);assert.deepEqual(Array.from(t.steps,s=>M.answer(s.answer)),expected101[j]);}
 const seq=groups(102)[1];assert.deepEqual(Array.from(seq.steps,s=>M.answer(s.answer)),['4/3','8/5','16/7','32/9','64/11','64/11','128/13','128/13','256/15','256/15']);assert.equal(seq.steps.filter(s=>s.answerFormat==='mixed-number').length,3);
 assert.deepEqual(Array.from(groups(103),t=>M.answer(t.answer)),['-14/3','-35/6','-15','7/5','-5','1']);assert.deepEqual(Array.from(groups(104),t=>t.answer),['<','>','>','<','<','<','>','<']);
}
{
 const topic=D.lessons.find(t=>t.id==='p37'),group=n=>Array.from(topic.tasks.filter(t=>t.source.exercise===n));
 assert.deepEqual(Object.values(topic.completeSourceSection),[86,114,22,26]);
 for(let n=86;n<=114;n++)assert(group(n).length>0,'paper number '+n);
 for(const [n,len]of [[105,4],[106,8],[107,2],[108,1],[109,1],[110,1],[111,6],[112,1],[113,3],[114,1]]){assert.equal(group(n).length,len);assert(group(n).every(t=>t.source.page===(n===114?26:25)));}
 for(const [n,ans]of [[105,['8','15/2','3/2','25']],[106,['-4','0','7','2','-24','-9','Все рациональные числа','11']],[107,['3','5']],[111,['-17/6','-221/40','-23/15','3','-16','2']]])assert.deepEqual(group(n).map(t=>t.answer),ans);
 const finalRatio=group(106).at(-1);assert.equal(finalRatio.affineRatios.root,'11');assert.deepEqual(Array.from(finalRatio.affineRatios.terms[1]),['2','7/5']);
 assert.deepEqual(group(108)[0].steps.map(s=>s.answer).join(','),'12,24,6,18');assert.equal(group(109)[0].answer,'840');assert.equal(group(110)[0].answer,'35/2');
 assert.deepEqual(Array.from(group(112)[0].steps,s=>s.answer),['8/105','-8/315','-3','-5/8','-1/6','15/4','3/4','4']);assert.equal(group(112)[0].answer,'3');assert(group(113).every(t=>t.kind==='manual'));assert.equal(group(114)[0].answer,'84');assert.equal(14+7+12+5+42+4,84);
}
{
 const topic=D.lessons.find(l=>l.id==='p19'),by=n=>Array.from(topic.tasks.filter(t=>t.source.exercise===n));
 assert(topic.orderBySource);for(const [n,k]of [[132,1],[133,3],[134,3],[135,6]])assert.equal(by(n).length,k);
 for(const t of by(134)){const u=t.unitBlanks;assert.equal(t.steps.length,4);assert.deepEqual(Array.from(t.steps,s=>s.answer),Array.from(u.rows,(r,i)=>r[u.missing[i]]));}
 const expected={'1а':'25','1б':'11','2а':'1','2б':'5','3а':'60','3б':'100'};for(const t of by(135)){assert.equal(t.answer,expected[t.source.readingKey]);}
 assert.equal(by(133).find(t=>t.source.subpart==='2').answer,'t = 240/w');
}
{
 const topic=D.lessons.find(l=>l.id==='p19'),by=n=>Array.from(topic.tasks.filter(t=>t.source.exercise===n));
 for(const [n,total]of [[136,4],[137,4],[138,1],[139,6]]){assert.equal(by(n).length,total);assert(by(n).every(t=>t.source.page===35));}
 assert.deepEqual(by(136).map(t=>t.steps[1].answer),['40','160','80','120']);assert.deepEqual(by(137).map(t=>t.steps[1].answer),['2','80','1200','1210']);
 assert.deepEqual(by(139).map(t=>t.steps[1].answer),['27','6','6','21','54','94']);
}
{
 const t=D.lessons.find(l=>l.id==='p19'),by=n=>Array.from(t.tasks.filter(k=>k.source.exercise===n));
 for(const [n,k]of [[140,1],[141,5],[142,1],[143,6]])assert.equal(by(n).length,k);
 assert.equal(by(140)[0].steps.length,12);assert.deepEqual(Array.from(by(141)[2].steps,s=>s.answer),['800','800','1200','800','600','600','600']);
 assert.deepEqual(Array.from(by(141)[3].steps,s=>s.answer).slice(0,6),['1600','800','2400','1600','3200/3','800']);assert.deepEqual(Array.from(by(141)[4].steps,s=>s.answer),['09:30','17:30','11:20','18:00']);
 const surveys=by(143);assert.equal(surveys.filter(k=>k.hobbySurvey).length,5);assert.equal(surveys.filter(k=>k.legoSurvey).length,1);assert.deepEqual(Array.from(surveys[5].steps,s=>s.answer).slice(0,8),['30','30','20','17','10','10','10','3']);assert(D.exerciseIndexByPart[2][144].missing);
}
{
 const t=D.lessons.find(l=>l.id==='p19'),by=n=>Array.from(t.tasks.filter(k=>k.source.exercise===n)),section=t.completeSourceSection;
 assert.deepEqual([section.first,section.last,section.firstPage,section.lastPage],[132,159,34,39]);assert(section.printingNote.includes('144'));assert.equal(by(144).length,0);assert.equal(by(143).length,6);
 for(const [n,k]of [[145,1],[146,6],[147,4],[148,3],[149,1],[150,1],[151,1],[152,2],[153,3],[154,1],[155,1],[156,2],[157,1],[158,5],[159,1]]){assert.equal(by(n).length,k);assert(by(n).every(x=>x.source.page===(n>=153?39:38)));}
 for(const x of by(146)){const q=x.ratioRewrite;for(const vals of [q.before,q.after])assert(M.equal(M.operation('multiply',vals[0],vals[3]),M.operation('multiply',vals[1],vals[2])));}
 for(const [n,answers]of [[147,['3','1/10','5/4','4/5']],[148,['5/2','6','16']],[152,['57/10','32/5']],[156,['20','1/10']]])assert.deepEqual(by(n).map(k=>k.answer),answers);
 assert.deepEqual(by(158).slice(0,4).map(k=>k.answer),['6','10','3','5']);assert.equal(by(159)[0].answer,'16');assert.equal(7*10+9*17,223);
}
{
 const lesson=D.lessons.find(t=>t.id==='p38'),g=n=>Array.from(lesson.tasks.filter(t=>t.source.exercise===n)).sort((a,b)=>a.source.subpart.localeCompare(b.source.subpart,'ru'));
 assert(lesson.orderBySource);for(let n=115;n<=121;n++){const set=g(n);assert.equal(set.length,2);assert.deepEqual(set.map(x=>x.source.subpart),['а','б']);assert(set.every(t=>t.appliedBalance&&t.source.page===(n===115?28:29)));}
 for(const [n,expected]of [[115,['4','15']],[116,['75','1400']],[117,['360','30']],[118,['24','7/5']],[119,['200','']],[120,['24','']],[121,['24','25/2']]])assert.deepEqual(g(n).map(t=>t.answer),expected);
 assert.deepEqual(Array.from(g(119)[1].steps,s=>s.answer),['400','1200','200','1000']);assert.deepEqual(Array.from(g(120)[1].steps,s=>s.answer),['4/5','16/5','8/5','12/5']);
}
{
 const sec=D.lessons.find(l=>l.id==='p38');
 const expect=[['18/5','7/5'],['25','23'],['25','30'],['9','12'],['64','96'],['200','432'],['16','5'],['25','20'],['6','24'],['500','740']];
 for(let i=0;i<10;i++){
  const t=sec.tasks[15+i];assert.equal(t.source.page,30);assert.equal(t.source.exercise,122+Math.floor(i/2));assert.equal(t.source.subpart,['а','б'][i%2]);assert(t.appliedCompare);
  assert.deepEqual(Array.from(t.steps.slice(-2),step=>step.answer),expect[i]);
 }
 assert.equal(3*1.2+7*1.2/6,5);assert.equal(23/25,0.92);assert.equal(27/30,0.9);assert.equal(9*4/3,12);assert.equal(480/(6+1.5)*3.5,224);assert.equal(792-200,592);
 assert.deepEqual([5+16+6+3,(5+16)*100/30],[30,70]);assert.equal(15*.4,12*.5);assert.equal(6+15+24,45);assert.equal((500+240)/.05,14800);
}
{
 const sec=D.lessons.find(l=>l.id==='p38');
 for(let n=127;n<=131;n++){
  const group=Array.from(sec.tasks.filter(t=>t.source.exercise===n)).sort((a,b)=>a.source.subpart.localeCompare(b.source.subpart,'ru'));
  assert.deepEqual(group.map(t=>t.source.subpart),n===131?['а','б','в','г']:['а','б']);assert(group.every(t=>t.source.page===31&&t.printedJourney));
 }
 for(const [i,s]of [[25,['240','160']],[28,['18','16']],[32,['75','60']],[33,['68','100']],[34,['440/3','616/3']],[35,['120','84']]])assert.deepEqual(Array.from(sec.tasks[i].steps.slice(-2),s=>s.answer),s);
 assert.equal((160+80)/(400+80),.5);assert.equal((10+50)/(200+50),.24);assert.equal(40+36+14,90);assert.equal(9+15+18+16,58);assert.equal(3.25/(2.5),1.3);
 assert(Math.abs(2.4*6-14.4)<1e-10);assert.equal(30/40,.75);assert.equal(75*1.8+60*1.8,243);assert.equal(52+168*1.5,304);assert.equal(30+462-330,162);assert.equal(24+84*2/3-120*2/3,0);
}
{
 const sec=D.lessons.find(l=>l.id==='p38'),g=n=>Array.from(sec.tasks.filter(t=>t.source.exercise===n));
 assert.deepEqual(g(132).map(t=>t.source.subpart),['а','б']);assert.deepEqual(g(133).map(t=>t.source.subpart),['а','б']);assert.deepEqual(g(135).map(t=>t.source.subpart),[...'абвгдежз']);
 assert.deepEqual(g(135).map(t=>t.answer),['3','54/5','5a/6','7b/5','27/5','175','3c','2d/5']);
 const answers=[['4/5','-59/10','-3/2','-5','39/20','-23/10','12/5','9/5','-18/5','39/50'],['-9/20','39/500','-260','3/5','9/100','-8','-1/4','19/100','-56','-1/125'],['-3/20','-3/5','1','-1/7','-9/10','27/10','-5/3','-2/25','7','-1/30']];
 assert.equal(g(134).length,3);for(const [i,t]of g(134).entries()){assert.equal(t.mentalSeries.length,10);assert.deepEqual(Array.from(t.steps,s=>s.answer),answers[i]);}assert(g(132).concat(g(133),g(134),g(135)).every(t=>t.source.page===32));
}
{
 const sec=D.lessons.find(l=>l.id==='p38'),at=n=>Array.from(sec.tasks.filter(t=>t.source.exercise===n));
 assert.deepEqual(at(136).map(t=>t.source.subpart),['(1а)','(1б)','(1в)','(1г)','(2а)','(2б)','(2в)','(2г)']);
 assert.deepEqual(at(137).map(t=>t.answer),['60','150']);assert.deepEqual(at(138).map(t=>Array.from(t.steps,s=>s.answer)),[['80','125','20','25'],['200','50','100','50'],['60','500/3','40','200/3'],['1000/9','90','100/9','10']]);
 assert.deepEqual(at(139).map(t=>t.answer),['Сохраняется','3/5','1/4','b/(3a)','3x/(8z)','(x − y)/(x + y)','n/(n + 1)']);assert.deepEqual(at(140).map(t=>t.squareClaim),[0,1,2,3]);
}
{
 const g=n=>Array.from(D.lessons.find(l=>l.id==='p38').tasks.filter(t=>t.source.exercise===n));
 assert.deepEqual(g(141).map(t=>t.answer),['7','1/2']);assert.deepEqual(g(142).map(t=>t.figure.variant),['squareHole','oneStep','twoSteps']);
 assert.deepEqual(g(143).map(t=>Array.from(t.steps,s=>s.answer)),[['-55','-30','-5','25'],['-77/50','-77/5','-154','10']]);assert.deepEqual(Array.from(g(144)[0].steps,s=>s.answer),['6','4','40','160','32']);assert.equal(g(144)[0].source.page,34);
}
{
 const l=D.lessons.find(t=>t.id==='p38'),group=n=>Array.from(l.tasks.filter(t=>t.source.exercise===n));
 assert.deepEqual(group(145).map(t=>t.formulaWords),['area','perimeter','distance','closure','volume','surface','remainder','current']);assert.deepEqual(group(146).map(t=>t.stationGraph),['starts','meeting','speeds','stops']);
 assert.deepEqual(group(146).map(t=>Array.from(t.steps,s=>s.answer)),[['9','30','36'],['12','12','60'],['4','6','12','12','0'],['60','30','90']]);assert(group(146).every(t=>t.source.page===34&&t.figure.type==='p38-station-graph'));
}
{
 const l=D.lessons.find(t=>t.id==='p38'),group=n=>Array.from(l.tasks.filter(t=>t.source.exercise===n));
 assert.deepEqual(group(147).map(t=>Array.from(t.steps,s=>s.answer)),[['200','30','50','90','240','48'],['3/2','9','24','18','45','144'],['5/2','15','35','3/2','2','12/5']]);
 assert.deepEqual(group(148).map(t=>t.answer),['50 − 2,5t','50 + 2,5t','50 − 0,5t','50 + 0,5t']);assert.deepEqual(group(149).map(t=>t.answer),['105','40']);
}
{
 const l=D.lessons.find(t=>t.id==='p38'),group=n=>Array.from(l.tasks.filter(t=>t.source.exercise===n));
 assert.deepEqual(group(150)[0].steps.map(t=>t.answer).join(','),'350,500,1000,150');assert.deepEqual(group(153).map(t=>t.answer),['5/11','4/3','5a/(2b)','(x + y)/(xy)','2n/3']);
 assert.deepEqual(group(155).map(t=>Array.from(t.steps,s=>s.answer).join(',')),['30,30,900,1','35,25,875,7/5','40,20,800,2','44,15,660,44/15','50,10,500,5','55,5,275,11']);assert.deepEqual(group(156).map(t=>t.answer),['18/25','1/20']);
}
{
 const l=D.lessons.find(t=>t.id==='p38'),group=n=>Array.from(l.tasks.filter(t=>t.source.exercise===n));
 assert.deepEqual(group(157)[0].steps.map(t=>t.answer).join(','),'5,0,10,1');assert.deepEqual(group(159).map(t=>Array.from(t.steps,s=>s.answer)),[['150','300'],['24','72'],['15/2','5/2']]);assert.deepEqual([160,161,162].map(n=>group(n)[0].answer),['50','63/25','25']);
 assert.deepEqual([160,161,162].map(n=>Array.from(group(n)[0].steps,s=>s.answer)),[['1/4','0','5','11/2'],['11/2','40','10','28/5'],['18','-12/5','-6','108/5']]);
}
{
 const sec=D.lessons.find(t=>t.id==='p38'),g=n=>Array.from(sec.tasks.filter(t=>t.source.exercise===n));assert.equal(sec.completeSourceSection.first,115);assert.equal(sec.completeSourceSection.last,167);
 for(let n=115;n<=167;n++)assert(g(n).length>0,'missing printed exercise '+n);
 const repeated=[11,13,15,17,31,33,35,37,51,53,55,57,71,73,75,77],unique=repeated.filter(n=>Math.floor(n/10)!==n%10);
 assert.deepEqual(g(164).map(x=>Array.from(x.steps,q=>Number(q.answer))),[repeated,unique]);assert.deepEqual(g(165).map(t=>t.answer),['60','125']);assert.deepEqual(g(166).map(t=>t.answer),['48','100']);assert.equal(g(167)[0].answer,'40');
 for(const [n,digits]of [[165,'12345'],[166,'02468']]){const all=Array.from({length:900},(_,i)=>String(i+100)).filter(v=>v.split('').every(d=>digits.includes(d)));assert.equal(all.length,Number(g(n)[1].answer));assert.equal(all.filter(v=>new Set(v).size===3).length,Number(g(n)[0].answer));}
}
{
 const l=D.lessons.find(t=>t.id==='p20'),g=n=>Array.from(l.tasks.filter(t=>t.source.exercise===n));
 assert(l.orderBySource);assert.equal(g(160).length,1);assert.equal(g(161).length,1);assert.equal(g(162).length,8);assert.equal(g(163).length,8);
 assert.deepEqual(g(162).map(t=>t.physicalLaw.k),['50','3','7','300','120','24','60','2']);
 assert.deepEqual(g(163).map(t=>t.answer).sort(),['90','2/5','30','6/5','9','24','800','100'].sort());
}
{
 const l=D.lessons.find(t=>t.id==='p20'),group=n=>Array.from(l.tasks.filter(t=>t.source.exercise===n)).sort((a,b)=>Number(a.source.subpart)-Number(b.source.subpart));
 assert.equal(group(164).length,10);assert.deepEqual(group(164).map(t=>t.classifyLaw.kind),['direct','affine','direct','inverse','inverse','inverse','direct','inverse','inverse','square']);
 assert.deepEqual(group(165).map(t=>t.fillProportionTable.k),['14/5','30','5','8']);for(const t of group(165)){assert.equal(t.fillProportionTable.blank.filter(Boolean).length,4);assert.equal(t.figure.type,'p20-paper-table');}
}
{
 const sec=D.lessons.find(t=>t.id==='p20'),g=n=>Array.from(sec.tasks.filter(t=>t.source.exercise===n));
 assert.equal(sec.completeSourceSection.first,160);assert.equal(sec.completeSourceSection.last,172);for(let n=160;n<=172;n++)assert(g(n).length);
 assert.deepEqual(g(166).map(t=>t.answer),['10','15']);assert.deepEqual(g(168).map(t=>t.answer),['60','8/5','5']);assert.deepEqual(g(169).map(t=>t.answer),['4/5','8','10','24']);assert.deepEqual(g(170).map(t=>t.paperLawGraph.kind),['direct','inverse']);assert.equal(g(171)[0].answer,'10');assert.equal(g(172)[0].answer,'2008440');
 assert.equal(Array.from({length:798},(_,i)=>i*2520).find(n=>String(n).startsWith('2008')),2008440);for(let d=1;d<=9;d++)assert.equal(2008440%d,0);
}
{
 const points=Array.from(D.lessons.find(l=>l.id==='p39').tasks).filter(t=>t.gridRead);
 assert.deepEqual(points.map(t=>Array.from(t.steps,s=>Number(s.answer))),[[-4,3],[5,4],[4,-1],[-3,-2],[4,1],[-5,3],[-3,-2],[5,-3]]);
 assert.deepEqual(points.map(t=>t.source.subpart),['A','B','C','D','A','B','C','D']);assert.deepEqual(points.slice(4).map(t=>t.answer),['I','II','III','IV']);
 for(const t of points){assert.equal(new Set(t.choices).size,4);assert.equal(t.errorCues.length,3);assert.equal(t.source.page,39);}
}
{
 const lesson=D.lessons.find(l=>l.id==='p39');
 const g=n=>Array.from(lesson.tasks).filter(t=>t.source.exercise===n);
 assert.deepEqual(g(170).map(t=>t.source.subpart),['III четверть','порядок координат','I четверть','II четверть','IV четверть']);assert.deepEqual(g(172).map(t=>t.source.subpart),['а','б','в']);assert.deepEqual(g(173).map(t=>t.source.subpart),['а','б']);assert.equal(g(171).length,1);
 assert.equal(g(172)[0].answer,'10');assert.equal(g(173)[1].answer,'Горизонтальная прямая y = 3');
}
{
 const l=D.lessons.find(t=>t.id==='p39'),g=n=>Array.from(l.tasks).filter(t=>t.source.exercise===n);
 assert.deepEqual(g(174).map(t=>Array.from(t.steps,s=>Number(s.answer))),[[-4,5,-2,3],[-2,5,-3,4]]);assert.equal(g(175)[0].answer,'3');
 assert.deepEqual(g(176).map(t=>t.source.subpart),['а','б','в']);assert.deepEqual(g(177).map(t=>t.answer),['Прямоугольник','Квадрат','Параллелограмм','Трапеция']);
}
{
 const l=D.lessons.find(t=>t.id==='p39'),g=n=>Array.from(l.tasks).filter(t=>t.source.exercise===n);
 assert.equal(g(178)[0].figure.points.length,27);assert.equal(g(178)[0].answer,'Лыжник');assert.equal(g(179)[0].answer,'(−2,3; 2,7) и (1,8; 1,1)');
 assert.deepEqual(g(180).map(t=>Array.from(t.steps,s=>Number(s.answer))),[[-1.3,2],[1.8,.8],[-2.6,.4],[1.8,-1.5],[0,-1.6],[-1.2,-.7]]);
}
{
 const l=D.lessons.find(t=>t.id==='p39'),g=n=>Array.from(l.tasks).filter(t=>t.source.exercise===n);
 assert.equal(g(181).length,18);assert.equal(g(182).length,6);
 assert.deepEqual(g(181).map(t=>t.paperIntersection.axis),[...Array(9).fill('x'),...Array(9).fill('y')]);
 for(const task of [...g(181),...g(182)]){assert.equal(new Set(task.choices).size,4);assert(task.choices.includes(task.answer));assert.equal(task.source.page,41);}
}
{
 const l=D.lessons.find(t=>t.id==='p39'),g=n=>Array.from(l.tasks).filter(t=>t.source.exercise===n);
 assert.equal(g(183).length,2);assert.equal(g(184).length,5);assert.deepEqual(g(185).map(t=>t.answer),['-7/9','12/5','-7/5','0','-3/5','7/10','-9/10','1']);
 assert.equal(g(184)[3].answer,'2');assert.equal(g(184)[4].source.subpart,'3');
}
{
 const l=D.lessons.find(t=>t.id==='p39'),g=n=>Array.from(l.tasks).filter(t=>t.source.exercise===n);
 assert.deepEqual(g(187).map(t=>t.answer),['−4 < x < 4','x ≤ −3 или x ≥ 3','−3 ≤ x ≤ −1','x < −1 или x > 3']);assert.deepEqual(g(188).map(t=>t.answer),['-4','-1']);
 assert.deepEqual(g(189).map(t=>Number(t.answer)),[1,2,6,3,2,3,6,7]);assert.deepEqual(g(190).map(t=>Number(t.answer)),[66,99]);
 for(const t of g(186))assert.equal(new Set(t.choices).size,3);
}
{
 const l=D.lessons.find(t=>t.id==='p39'),g=n=>Array.from(l.tasks).filter(t=>t.source.exercise===n);
 assert.deepEqual(g(191).map(t=>t.answer),['-7/4','2','1','-18','2/5','-4']);assert.deepEqual(g(192).map(t=>Number(t.answer)),[20,-8,5,3,-17,2]);assert.deepEqual(g(193).map(t=>t.answer),['3/5','-5/7','-3/20','5']);assert.equal(g(194).length,11);
}
{
 const route=D.lessons.find(l=>l.id==='p39'),rows=Array.from(route.tasks).filter(t=>[195,196].includes(t.source.exercise));
 assert.equal(rows.length,5);assert(rows.every(t=>t.source.page===43&&t.source.isbn==='978-5-9963-4599-1'));
 assert.equal(5*8,4*(8+2));assert.equal(Number(rows[0].answer),5*8);
 assert.equal((3/.25)*.45,27/5);assert.equal(rows[1].answer,'27/5');assert.deepEqual(rows.slice(2).map(t=>t.answer),['Ньютон','Паскаль','Торричелли']);
}
{
 const l=D.lessons.find(t=>t.id==='p39'),newRows=Array.from(l.tasks).filter(t=>[197,198].includes(t.source.exercise));
 assert.equal(newRows.length,12);assert(newRows.every(t=>t.kind==='manual'&&t.answer===''));assert.equal(newRows.filter(t=>t.source.page===44).length,10);assert.equal(new Set(newRows.map(t=>t.source.reference)).size,12);
}
const all=JSON.stringify(D);assert(!/[\uE000-\uF8FF]/.test(all),'unresolved PDF glyph');assert(!all.includes('undefined'));assert(!all.includes('/workspace/'));
console.log(JSON.stringify({ok:true,topics:D.lessons.length,tasks:ids.size,legacyTasks,newTextbookTasks,numeric,choice,manual,checkedSteps,instructionSteps,printedNumbers:1863}));
