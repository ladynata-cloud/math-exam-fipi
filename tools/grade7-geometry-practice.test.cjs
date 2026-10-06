'use strict';
const assert=require('node:assert/strict'),D=require('../ege-baza/path/data.js');
for(const file of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core'])require('../ege-baza/path/'+file);
const oldSeeds=[0,1,71,72,143,215,100003],old=D.meta.map(m=>({id:m.id,tasks:oldSeeds.map(s=>JSON.stringify(D.task(m.id,s)))}));
require('../ege-baza/path/grade7-geometry-practice.js');
const renderer=require('../ege-baza/path/grade7-geometry-core-models.js');
const len=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),dot=(a,v,b)=>(a.x-v.x)*(b.x-v.x)+(a.y-v.y)*(b.y-v.y),angle=(a,v,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,v,b)/(len(a,v)*len(b,v)))))*180/Math.PI;
const near=(a,b,message)=>assert(Math.abs(a-b)<1e-7,message+': '+a+' != '+b);
const numeric=(step,value)=>{assert.equal(D.parse(step.a),value,step.q);assert(D.correct(step,String(value)));};
const picked=step=>step.choices.find(c=>c.value===step.a)?.label;
const expectChoice=(step,label)=>{assert.equal(picked(step),label,step.q);for(const c of step.choices)assert.equal(D.correct(step,c.value),c.label===label);};
function oracle(t){
 const p=t.params,m=p.mode,s=t.steps,w=p.world,key=t.id.replace('grade7-g-practice-','');let answer;
 switch(key){
 case 'segment-equation':{
  const expected=m===1?(p.right-p.k)/p.m:(p.total-p.k-(m===2?p.c:0))/(p.m+1);assert.equal(expected,p.x);answer=expected;
  expectChoice(s[0],m===1?'AB = BC':m===2?'AD = AB + BC + CD':'AC = AB + BC');numeric(s[1],m===1?p.m:p.m+1);numeric(s[2],m===1?p.right-p.k:p.total-p.k-(m===2?p.c:0));numeric(s[3],answer);
  near(len(w.A,w.B),p.left,'AB length');near(len(w.B,w.C),p.right,'BC length');near(len(w.A,w[m===2?'D':'C']),p.total,'whole length');if(m===1)near(len(w.A,w.B),len(w.B,w.C),'midpoint');break;
 }
 case 'angle-parts':{
  const r=p.rayAngles,actual=t.model.diagram.points;for(const[name,deg]of Object.entries(r))near(angle(actual.A,actual.O,actual[name]),deg,'ray order '+name);
  if(m===0){answer=r.C-r.M;numeric(s[0],(r.B-r.A)/2);numeric(s[1],answer);}else if(m===1){answer=(r.B-r.A)/2;numeric(s[0],r.C-r.A-(r.C-r.B));numeric(s[1],answer);}else{answer=r.N-r.M;numeric(s[0],180);numeric(s[1],180-p.alpha);numeric(s[2],answer);near(answer,90,'bisectors of adjacent angles');}
  break;
 }
 case 'vertical-proof':{
  const d=t.model.diagram.points;near(angle(d.A,d.O,d.B),p.theta,'givenangle');near(angle(d.C,d.O,d.D),p.theta,'verticalangle');near(angle(d.B,d.O,d.C),180-p.theta,'commonadjacent');assert(t.model.diagram.angles.every(a=>!a.marks),'Equality is not pre-marked before proof.');
  if(m===0){answer=p.theta;numeric(s[0],180);numeric(s[1],180-p.theta);numeric(s[2],p.theta);}else if(m===1){numeric(s[0],p.theta);numeric(s[1],p.theta);expectChoice(s[2],'Оба равны 180° − ∠BOC');answer=Number(s[2].a);}else{numeric(s[0],180);expectChoice(s[1],'Они равны, потому что вертикальные углы равны');answer=Number(s[1].a);}break;
 }
 case 'sas-common-side':{
  near(len(w.A,w.B),len(w.A,w.D),'AB=AD');near(angle(w.B,w.A,w.C),angle(w.D,w.A,w.C),'includedangle');near(len(w.B,w.C),len(w.D,w.C),'derived BC=DC');near(len(w.B,w.C),5*p.u,'numeric known side');
  expectChoice(s[0],'AC');expectChoice(s[1],'AB = AD, AC общая, ∠BAC = ∠DAC');if(m===0){expectChoice(s[2],'AC');answer=Number(s[2].a);}else if(m===1){expectChoice(s[2],'△ABC = △ADC');answer=Number(s[2].a);}else{answer=5*p.u;numeric(s[2],answer);}
  assert(t.model.diagram.segments.filter(s=>['BC','DC'].includes(s.id)).every(s=>!s.marks),'Derived sides are not given as equal.');break;
 }
 case 'sas-vertical':{
  near(len(w.A,w.O),len(w.C,w.O),'AO=CO');near(angle(w.A,w.O,w.B),angle(w.C,w.O,w.D),'vertical includedangles');expectChoice(s[0],'Они вертикальные');
  if(m===2){assert(Math.abs(len(w.B,w.O)-len(w.D,w.O))>1);expectChoice(s[1],'Нет: не хватает BO = OD');answer=Number(s[1].a);assert(t.model.diagram.segments.filter(s=>['BO','OD'].includes(s.id)).every(s=>!s.marks));}
  else{near(len(w.B,w.O),len(w.D,w.O),'BO=DO');near(len(w.A,w.B),len(w.C,w.D),'AB=CD');if(m===0){expectChoice(s[1],'∠AOB и ∠COD');answer=Number(s[1].a);}else{expectChoice(s[1],'△AOB = △COD');answer=len(w.A,w.B);near(answer,p.triple[2]*p.u,'knownrighttrianglemetric');answer=Math.round(answer);numeric(s[2],answer);}}break;
 }
 case 'cevian-reason':{
  assert(Math.abs(len(w.A,w.B)-len(w.A,w.C))>.1,'Counterexample is scalene.');
  expectChoice(s[0],['Равны две части стороны BC','Равны две части угла A','Есть прямой угол между AK и BC'][m]);expectChoice(s[1],['Это медиана; высота и биссектриса не следуют','Это биссектриса; медиана и высота не следуют','Это высота; медиана и биссектриса не следуют'][m]);answer=Number(s[1].a);
  const mid=Math.abs(len(w.B,w.K)-len(w.K,w.C))<1e-7,bis=Math.abs(angle(w.B,w.A,w.K)-angle(w.K,w.A,w.C))<1e-7,alt=Math.abs(angle(w.A,w.K,w.C)-90)<1e-7;
  assert.deepEqual([mid,bis,alt],[m===0,m===1,m===2],'Only the claimed property actually holds.');break;
 }
 case 'isosceles-perimeter':{
  assert(p.base>0&&p.side>0&&p.base<2*p.side,'Strict triangle inequality.');near(len(w.A,w.B),p.side,'AB literal length');near(len(w.A,w.C),p.side,'AC literal length');near(len(w.B,w.C),p.base,'BC literal length');assert.equal(p.total,2*p.side+p.base);
  const coefficient=m===0?2*p.m+1:4,constant=m===0?p.k:m===1?2*p.k:p.k,x=(p.total-constant)/coefficient;assert.equal(x,p.x);
  expectChoice(s[0],'P = 2 · AB + BC');numeric(s[1],coefficient);numeric(s[2],p.total-constant);numeric(s[3],x);answer=m===2?2*x-p.k:x;if(m===2)numeric(s[4],answer);break;
 }
 case 'isosceles-proof':{
  near(len(w.A,w.B),len(w.A,w.C),'given equal legs');near(angle(w.B,w.A,w.D),angle(w.D,w.A,w.C),'constructed bisector');near(len(w.B,w.D),len(w.D,w.C),'derived midpoint');near(angle(w.A,w.D,w.B),90,'derived rightangle');
  assert(t.model.diagram.angles.every(a=>!a.right),'Do not mark the rightangle before it is proved.');assert(t.model.diagram.segments.every(s=>!['BD','DC'].includes(s.id)),'Do not mark midpoint before it is proved.');
  expectChoice(s[0],'AD равна самой себе — общая сторона');expectChoice(s[1],'AD построена как биссектриса');expectChoice(s[2],'По двум сторонам и углу между ними');
  if(m===0){expectChoice(s[3],'Это соответствующие углы равных треугольников');answer=Number(s[3].a);}else if(m===1){answer=len(w.B,w.C)/2;numeric(s[3],answer);}else{expectChoice(s[3],'Они смежные: DB и DC противоположны');answer=90;numeric(s[4],answer);}break;
 }
 default:throw Error(key);
 }
 return answer;
}
let cases=0,stepCount=0,markCount=0;const unique={};assert.equal(D.grade7GeometryPractice.families.length,8);assert.equal(D.grade7GeometryPractice.count,216);
for(const f of D.grade7GeometryPractice.families){const meta=D.meta.find(m=>m.id===f.id);assert(meta.grade7&&meta.trainingOnly&&meta.geometryPractice&&meta.expanded);assert.equal(meta.subject,'geometry');assert.equal(meta.pos,null);const keys=new Set();
 for(let seed=0;seed<216;seed++){
  const t=D.task(f.id,seed),answer=oracle(t),m=t.model,d=m.diagram,points=d.points,builds=m.constructions.map(c=>c.id);assert(t.trainingOnly&&t.grade7&&t.geometryPractice);assert.equal(t.pos,null);assert.equal(t.answer,answer);assert.equal(Number(t.a),answer);assert(D.correct(t,D.answerText(t)));assert(!D.correct(t,String(answer+1)));assert(!D.correct(t,''));assert(!D.correct(t,'1/0'));assert.equal(t.params.mode,Math.floor(seed/72));
  for(const s of t.steps){assert(s.q&&s.why&&s.strict);assert(D.correct(s,D.answerText(s)));assert(!D.correct(s,String(Number(s.a)+1)));stepCount++;}
  assert(m.elements.length>=2);assert.equal(new Set(m.elements.map(e=>e.id)).size,m.elements.length);assert.equal(new Set(builds).size,builds.length);assert(d.description);
  const valid=new Set([...Object.keys(points),...d.segments.map(s=>s.id),...d.angles.map(a=>a.id)]);for(const e of m.elements)assert(valid.has(e.id),f.id+' selected part '+e.id);
  const equal={};for(const s of d.segments){assert(points[s.from]&&points[s.to]);assert(len(points[s.from],points[s.to])>1e-6);if(s.construction)assert(builds.includes(s.construction));if(s.marks){(equal['side'+s.marks]??=[]).push(len(points[s.from],points[s.to]));markCount++;}}
  for(const a of d.angles){assert(points[a.from]&&points[a.vertex]&&points[a.to]);const measure=angle(points[a.from],points[a.vertex],points[a.to]);if(a.right)near(measure,90,'valid rightmark');if(a.construction)assert(builds.includes(a.construction));if(a.marks){(equal['angle'+a.marks]??=[]).push(measure);markCount++;}}
  for(const[key,values]of Object.entries(equal))for(const v of values)near(v,values[0],f.id+' '+key);
  const html=renderer.svg(t,m.elements[0].id,builds);assert(!/NaN|Infinity|undefined|<script|marker-end/.test(html));assert(html.includes('data-core-part'));
  assert.deepEqual(D.task(f.id,seed),t);assert.equal(D.task(f.id,seed+216).q,t.q);assert.equal(D.task(f.id,seed-216).q,t.q);keys.add(JSON.stringify([t.q,t.model.diagram]));cases++;
 }
 unique[f.id]=keys.size;
}
for(const sample of old)assert.deepEqual(oldSeeds.map(s=>JSON.stringify(D.task(sample.id,s))),sample.tasks,sample.id+' unchanged');
console.log(JSON.stringify({result:'GRADE7_GEOMETRY_PRACTICE_OK',families:8,seedCases:cases,intermediateSteps:stepCount,validEqualityMarks:markCount,actualConditionDiagrams:unique,legacyCases:old.length*oldSeeds.length}));
