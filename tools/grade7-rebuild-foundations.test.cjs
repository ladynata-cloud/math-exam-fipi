'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');
const old=D.meta.map(m=>({id:m.id,tasks:[0,1,71,-1].map(n=>JSON.stringify(D.task(m.id,n)))}));
require('../ege-baza/path/grade7-geometry-rebuild-base.js');
require('../ege-baza/path/grade7-geometry-rebuild-foundations.js');
const H=D.geometryRebuild,families=[...H.families];
assert.equal(families.length,27);
const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-6*Math.max(1,Math.abs(b)),`${msg}: ${a} != ${b}`);
const vec=(p,a,b)=>({x:p[b].x-p[a].x,y:p[b].y-p[a].y});
const len=(p,a,b)=>Math.hypot(p[b].x-p[a].x,p[b].y-p[a].y);
const cross=(u,v)=>u.x*v.y-u.y*v.x,dot=(u,v)=>u.x*v.x+u.y*v.y;
const degrees=(p,o,a,b)=>{const u=vec(p,o,a),v=vec(p,o,b);return Math.acos(Math.max(-1,Math.min(1,dot(u,v)/(Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y)))))*180/Math.PI;};
const chosen=s=>{const c=s.choices?.find(c=>c.value===s.a);assert(c,s.q);return c.label;};
const expectLabel=(s,label)=>assert.equal(chosen(s),label,s.q);
const expectNum=(s,num)=>near(Number(s.a),num,s.q);
function allGeometry(t){
 const d=t.model.diagram,p=d.points;
 for(const point of Object.values(p)){assert(Number.isFinite(point.x)&&Number.isFinite(point.y));}
 for(const s of d.segments){assert(p[s.from]&&p[s.to]);assert(len(p,s.from,s.to)>1e-7);}
 const segmentMarks=new Map(),angleMarks=new Map();
 for(const s of d.segments){if(s.marks){const L=len(p,s.from,s.to);if(segmentMarks.has(s.marks))near(L,segmentMarks.get(s.marks),'equal segment marks');else segmentMarks.set(s.marks,L);}}
 for(const a of d.angles){const angle=degrees(p,a.vertex,a.from,a.to);if(a.right)near(angle,90,'right-angle square');if(a.marks&&!a.right){if(angleMarks.has(a.marks))near(angle,angleMarks.get(a.marks),'equal angle marks');else angleMarks.set(a.marks,angle);}
 if(/^\d+(?:\.\d+)?°$/.test(a.label||''))near(angle,Number(a.label.slice(0,-1)),'given numerical angle matches geometry');}
}
function oracle(t){
 const key=t.id.replace('grade7-r-',''),p=t.params,s=t.steps,d=t.model.diagram,ps=d.points,last=s.at(-1);
 switch(key){
 case 'point-membership':{
  const AB=vec(ps,'A','B'),AT=vec(ps,'A',p.target),onLine=Math.abs(cross(AB,AT))<1e-5,onSegment=onLine&&dot(AB,AT)>=-1e-7&&dot(AB,AT)<=dot(AB,AB)+1e-7;
  expectLabel(s[0],onLine?'Да':'Нет');expectLabel(last,onSegment?'Да':'Нет');break;
 }
 case 'segment-names':{
  const name=t.q.match(/отрезок (\w\w)\?/)[1];expectLabel(last,[...name].reverse().join(''));const actual=chosen(s[1]).split(' и ').sort().join('');assert.equal(actual,[...name].sort().join(''));break;
 }
 case 'segment-count':{
  const visible=Object.keys(ps).filter(k=>ps[k].label!==false),unique=new Set();for(const a of visible)for(const b of visible)if(a!==b)unique.add([a,b].sort().join(''));
  expectNum(last,unique.size);expectNum(s[0],visible.length-1);expectLabel(s[1],'Нет, это один отрезок');break;
 }
 case 'ray-start':expectLabel(last,d.segments[0].from);break;
 case 'ray-same':{
  const wanted=t.q.match(/совпадает с (\w\w)/)[1],u=vec(ps,wanted[0],wanted[1]),candidates=p.side?['OA','OB','CO']:['OB','OC','AO'],same=candidates.filter(k=>k[0]===wanted[0]&&Math.abs(cross(u,vec(ps,k[0],k[1])))<1e-6&&dot(u,vec(ps,k[0],k[1]))>0);expectLabel(last,same[0]||'Никакой из OA, OB, CO');break;
 }
 case 'angle-vertex':{
  const name=t.q.match(/угла (\w\w\w)/)[1];expectLabel(s[0],name[1]);expectLabel(last,`${name[1]+name[0]} и ${name[1]+name[2]}`);break;
 }
 case 'angle-count':{
  const names=Object.keys(ps).filter(k=>k!=='O'&&!k.startsWith('_'));let total=0,straight=0;
  for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){const angle=degrees(ps,'O',names[i],names[j]);if(angle>1e-6){total++;if(Math.abs(angle-180)<1e-5)straight++;}}
  expectNum(s[0],total);expectNum(s[1],straight);expectNum(last,total-straight);break;
 }
 case 'segment-part':{
  const vals=Object.fromEntries([...t.q.matchAll(/(AB|BC|AC) = (\d+) см/g)].map(m=>[m[1],Number(m[2])])),ask=t.q.match(/Найди (\w\w)/)[1];const whole=vals.AC??vals.AB+vals.BC,ab=vals.AB??whole-vals.BC,bc=vals.BC??whole-vals.AB;expectNum(last,{AB:ab,BC:bc,AC:whole}[ask]);near(len(ps,'A','B')/len(ps,'B','C'),ab/bc,'segment ratio');break;
 }
 case 'midpoint':{
  const whole=t.q.match(/AB = (\d+)/),given=Number(t.q.match(/= (\d+)/)[1]);expectNum(last,whole?given/2:t.q.endsWith('Найди AB.')?given*2:given);near(len(ps,'A','M'),len(ps,'M','B'),'midpoint');break;
 }
 case 'equal-parts':{
  const values=Object.values(ps),first=values[0],lastPoint=values.at(-1),totalDrawn=Math.hypot(lastPoint.x-first.x,lastPoint.y-first.y),partDrawn=len(ps,p.names[0],p.names[1]),given=Number(t.q.match(/(?:равна|длиной) (\d+)/)[1]),unitsPerPixel=p.mode===0?given/partDrawn:given/totalDrawn,ask=t.q.match(/Найди (\w\w)/)[1];expectNum(last,len(ps,ask[0],ask[1])*unitsPerPixel);break;
 }
 case 'angle-parts':{
  const ask=t.q.match(/Найди ∠(\w\w\w)/)[1];expectNum(last,degrees(ps,ask[1],ask[0],ask[2]));break;
 }
 case 'angle-bisector':{
  near(degrees(ps,'O','A','M'),degrees(ps,'O','M','B'),'bisector');const ask=t.q.match(/Найди ∠(\w\w\w)/)[1];expectNum(last,degrees(ps,ask[1],ask[0],ask[2]));break;
 }
 case 'angle-type':{
  const a=Number(t.q.match(/равен (\d+)/)[1]);expectLabel(last,a<90?'Острый':a===90?'Прямой':a<180?'Тупой':'Развёрнутый');break;
 }
 case 'angle-protractor':{
  const g=d.protractor,readings=g.readings.map(r=>Number(r.label.slice(0,-1)));expectNum(last,Math.abs(readings[1]-readings[0]));near(Number(last.a),degrees(ps,'O','A','B'),'protractor geometry');if(p.mode===1){assert(t.q.includes('нулём слева'));assert.equal(g.readings[0].degrees,180);}break;
 }
 case 'adjacent-identify':expectLabel(last,Math.abs(degrees(ps,'O','A','C')-180)<1e-5?'Да':'Нет');break;
 case 'adjacent-calc':{
  const given=Number(t.q.match(/= (\d+)°/)[1]),ask=t.q.match(/ним ∠(\w\w\w)/)[1];expectNum(last,180-given);near(Number(last.a),degrees(ps,ask[1],ask[0],ask[2]),'adjacent computed angle');expectNum(s[0],180);break;
 }
 case 'vertical-identify':{
  const second=t.q.match(/AOC и (\w\w\w)/)[1],opposite=(a,b)=>Math.abs(degrees(ps,'O',a,b)-180)<1e-5;expectLabel(last,(opposite('A',second[0])&&opposite('C',second[2]))||(opposite('A',second[2])&&opposite('C',second[0]))?'Да':'Нет');break;
 }
 case 'vertical-calc':{
  const ask=t.q.match(/Найди ∠(\w\w\w)/)[1];expectNum(last,degrees(ps,ask[1],ask[0],ask[2]));expectNum(s[1],Number(t.q.match(/= (\d+)°/)[1]));assert(d.angles.every(a=>!a.marks),'do not premark inferred angle equality');break;
 }
 case 'adjacent-equation':{
  const ratio=t.q.match(/в (\d+) раз(?:а)?/),diff=t.q.match(/на (\d+)°/),candidates=[];for(let half=1;half<180;half++){const a=half/2,b=180-a;if(a>=b)continue;if(ratio?Math.abs(b/a-Number(ratio[1]))<1e-8:Math.abs(b-a-Number(diff[1]))<1e-8)candidates.push([a,b]);}assert.equal(candidates.length,1);const [a,b]=candidates[0];expectNum(s[2],a);expectNum(last,t.q.includes('больший угол.')?b:a);near(degrees(ps,'O','A','B'),a,'equation geometry');break;
 }
 case 'perpendicular':{
  near(degrees(ps,'O','A','C'),90,'perpendicular directions');if(t.q.includes('Сколько прямых')){let right=0;for(const [a,b]of[['A','C'],['C','B'],['B','D'],['D','A']])if(Math.abs(degrees(ps,'O',a,b)-90)<1e-6)right++;expectNum(last,right);}else{const ask=t.q.match(/Найди ∠(\w\w\w)/)[1];expectNum(last,degrees(ps,ask[1],ask[0],ask[2]));}break;
 }
 case 'triangle-elements':{
  if(p.mode===0){const v=t.q.match(/вершины (\w)/)[1];expectLabel(last,'ABC'.split('').filter(k=>k!==v).join(''));}
  else if(p.mode===1){const side=t.q.match(/стороны (\w\w)/)[1];expectLabel(last,'ABC'.split('').find(k=>!side.includes(k)));}
  else{const m=t.q.match(/сторонами (\w\w) и (\w\w)/);expectLabel(last,[...m[1]].find(k=>m[2].includes(k)));}break;
 }
 case 'triangle-correspondence':{
  const perm=t.q.match(/ΔABC = Δ(\w\w\w)/)[1],map=Object.fromEntries([...`ABC`].map((k,i)=>[k,perm[i]])),given=t.q.match(/\. (∠?)(\w{2,3}) = (\d+)/),target=t.q.match(/Найди (∠?)(\w{2,3})/)[2];assert.equal(target,[...given[2]].map(k=>map[k]).join(''));expectNum(last,Number(given[3]));for(const [a,b]of[['A','B'],['A','C'],['B','C']])near(len(ps,a,b),len(ps,map[a],map[b]),'congruent corresponding lengths');if(given[1])near(degrees(ps,'A','B','C'),Number(given[3]),'given corresponding angle');break;
 }
 case 'perimeter-sum':{
  const values=Object.fromEntries([...t.q.matchAll(/(AB|BC|CA) = (\d+) см/g)].map(m=>[m[1],Number(m[2])])),perimeter=t.q.match(/Периметр ABC равен (\d+)/),answer=perimeter?Number(perimeter[1])-values.AB-values.BC:values.AB+values.BC+values.CA;expectNum(last,answer);expectNum(s[0],values.AB+values.BC);break;
 }
 case 'perimeter-chain-more-half':case 'perimeter-chain-less-double':{
  const first=Number(t.q.match(/AB = (\d+)/)[1]),delta=Number(t.q.match(/на (\d+) см/)[1]),second=t.q.includes('меньше AB')?first-delta:first+delta,third=t.q.includes('меньше BC')?second/2:second*2;expectNum(s[1],second);expectNum(s[3],third);expectNum(last,first+second+third);assert.deepEqual(p.sides,[first,second,third]);assert.equal(d.segments.find(s=>s.id==='BC').label,'?');assert.equal(d.segments.find(s=>s.id==='CA').label,'?');break;
 }
 case 'perimeter-equation-fourfold':case 'perimeter-equation-threefold':{
  const total=Number(t.q.match(/равен (\d+) см/)[1]),delta=Number(t.q.match(/на (\d+) см/)[1]),k=Number(t.q.match(/в (\d+) раз(?:а)?/)[1]),candidates=[];
  // Enumerate admissible lengths from the verbal constraints, independently of the generator formula.
  for(let x=1;x<total;x++){const y=x+delta,z=k*x;if(x+y+z===total&&x+y>z&&x+z>y&&y+z>x)candidates.push(x);}assert.equal(candidates.length,1);expectNum(last,candidates[0]);expectNum(s[4],total-delta);assert.equal(chosen(s[0]),'x + '+delta);assert.equal(chosen(s[1]),k+'x');assert(d.segments.every(s=>/x/.test(s.label)),'unknown side lengths must stay symbolic');break;
 }
 default:throw Error('Missing independent oracle '+key);
 }
 if(p.sides){const a=[...p.sides].sort((a,b)=>a-b);assert(a[0]>0&&a[0]+a[1]>a[2],'strict triangle inequality');near(len(ps,'A','B')/len(ps,'B','C'),p.sides[0]/p.sides[1],'triangle sides AB:BC');near(len(ps,'C','A')/len(ps,'B','C'),p.sides[2]/p.sides[1],'triangle sides CA:BC');}
}
let checked=0,steps=0;const allIds=new Set(families.map(f=>f.id));
for(const family of families){
 assert(family.section>=1&&family.section<=5);assert(family.sourcePages.every(p=>p>=5&&p<=32));assert(family.prerequisites.every(k=>allIds.has(k)));
 const variants=new Set();
 for(let n=0;n<72;n++){
  const t=D.task(family.id,n);assert.equal(t.model.kind,'grade7-construction');assert(t.steps.length>=2&&t.steps.length<=8);assert.equal(t.a,t.steps.at(-1).a);assert.equal(t.answerExact,t.a);assert.equal(t.answer,Number(t.a));assert.equal(t.strict,true);assert(t.q&&t.model.diagram.description);
  for(const s of t.steps){assert(s.q&&s.why&&Number.isFinite(Number(s.a)));assert(D.correct(s,s.a));assert(!D.correct(s,String(Number(s.a)+1000)));if(s.choices){assert.equal(new Set(s.choices.map(c=>c.label)).size,s.choices.length);for(const c of s.choices)assert.equal(D.correct(s,c.value),c.value===s.a);assert(s.feedback&&Object.keys(s.feedback).length===s.choices.length-1);}steps++;}
  if(t.steps.at(-1).choices)assert.deepEqual(t.choices,t.steps.at(-1).choices);else assert(!t.choices);
  allGeometry(t);oracle(t);variants.add(JSON.stringify({q:t.q,diagram:t.model.diagram}));checked++;
 }
 assert(variants.size>=4,family.id+' needs more than answer shuffling');
 for(const [input,normal]of[[-1,71],[72,0],[145,1],[-73,71],[Infinity,0],[NaN,0],['bad',0]]){
  const a=D.task(family.id,input),b=D.task(family.id,normal);assert.deepEqual(a.steps,b.steps);assert.deepEqual(a.model,b.model);assert.equal(a.params.variant,normal);
 }
}
for(const prev of old)assert.deepEqual([0,1,71,-1].map(n=>JSON.stringify(D.task(prev.id,n))),prev.tasks,'old task changed: '+prev.id);
// Focused regressions for errors in the supplied source: exclude straight angles; preserve degree units.
const angleSet=Array.from({length:72},(_,n)=>D.task('grade7-r-angle-count',n));assert(angleSet.some(t=>t.params.k===3&&t.params.straight===1&&t.answer===2));
for(const deg of [1,89,90,91,179,180])assert(Array.from({length:72},(_,n)=>D.task('grade7-r-angle-type',n)).some(t=>t.params.deg===deg));
assert(Array.from({length:72},(_,n)=>D.task('grade7-r-adjacent-equation',n)).some(t=>!Number.isInteger(t.answer)),'half-degree solution must be supported');
for(const seed of [0,4]){const p=D.task('grade7-r-adjacent-calc',seed).model.diagram.points;for(const [a,b]of[['A','B'],['B','C']]){const dx=Math.abs(p[a].x+p[a].dx-p[b].x-p[b].dx),dy=Math.abs(p[a].y+p[a].dy-p[b].y-p[b].dy);assert(dx>=27||dy>=27,'near-coincident ray labels must remain distinct');}}

console.log(`PASS: ${families.length} families, ${checked} original variants, ${steps} reasoning steps; independent numeric/geometry oracles, boundary seeds, equality marks, unknowns and legacy stability.`);
