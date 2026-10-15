'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');
const old=D.meta.map(m=>({id:m.id,sample:JSON.stringify(D.task(m.id,7))}));
require('../ege-baza/path/grade7-geometry-rebuild-base.js');
require('../ege-baza/path/grade7-geometry-rebuild-triangles.js');
const H=D.geometryRebuild,families=[...H.families];
assert.equal(families.length,25);
const near=(a,b,context)=>assert(Math.abs(a-b)<1e-6*Math.max(1,Math.abs(b)),`${context}: ${a} != ${b}`);
const length=(p,a,b)=>Math.hypot(p[b].x-p[a].x,p[b].y-p[a].y);
const degrees=(p,o,a,b)=>{const u=[p[a].x-p[o].x,p[a].y-p[o].y],v=[p[b].x-p[o].x,p[b].y-p[o].y];return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)))))*180/Math.PI;};
const chosen=s=>{const c=s.choices?.find(c=>c.value===s.a);assert(c,s.q);return c.label;};
const expectNumber=(s,a)=>near(Number(s.a),a,s.q);
const expectLabel=(s,a)=>assert.equal(chosen(s),a,s.q);
function allGeometry(t){
 const d=t.model.diagram,p=d.points;
 for(const pt of Object.values(p)){assert(Number.isFinite(pt.x)&&Number.isFinite(pt.y));assert(pt.x>=0&&pt.x<=600&&pt.y>=0&&pt.y<=400,'diagram coordinate bounds');}
 const segments=new Map(),angles=new Map();
 for(const s of d.segments){assert(p[s.from]&&p[s.to]);const l=length(p,s.from,s.to);assert(l>1e-7,'nonzero segment');if(s.marks){if(segments.has(s.marks))near(l,segments.get(s.marks),'equal side marks');else segments.set(s.marks,l);}}
 for(const a of d.angles){const theta=degrees(p,a.vertex,a.from,a.to);assert(theta>0&&theta<=180);if(a.right)near(theta,90,'right-angle mark');if(a.marks&&!a.right){if(angles.has(a.marks))near(theta,angles.get(a.marks),'equal angle marks');else angles.set(a.marks,theta);}if(/^\d+°$/.test(a.label||''))near(theta,Number(a.label.slice(0,-1)),'numerical angle label');}
 for(const c of d.circles||[]){assert(c.radius>0&&p[c.center]);for(const id of Object.keys(p).filter(x=>x!==c.center))near(length(p,c.center,id),c.radius,'point lies on circle');}
}
function oracle(t){
 const key=t.id.replace('grade7-r-',''),s=t.steps,last=s.at(-1),d=t.model.diagram,p=d.points;
 switch(key){
 case 'triangle-included-angle':{
  const sides=t.q.match(/стороны (\w\w) и (\w\w)/),v=[...sides[1]].find(x=>sides[2].includes(x));expectLabel(s[0],v);assert.equal(chosen(last)[1],v);assert.equal(new Set(chosen(last)).size,3);break;
 }
 case 'triangle-common-side':{
  const names=t.q.match(/Треугольники (\w{3}) и (\w{3})/),common=[...names[1]].filter(x=>names[2].includes(x));expectLabel(s[0],common.join(''));assert(chosen(last).includes('один и тот же'));break;
 }
 case 'triangle-vertical-angle':
  near(degrees(p,'O','A','C'),180,'opposite rays AC');near(degrees(p,'O','B','D'),180,'opposite rays BD');expectNumber(last,degrees(p,'O','C','D'));assert(chosen(s[0]).includes('вертикальные'));assert(d.angles.every(a=>!a.marks),'vertical equality must be derived');break;
 case 'triangle-proof-correspondence':{
  const left=t.q.match(/△(\w{3}) =/)[1],result=chosen(last),mapping={A:'D',B:'E',C:'F'};assert.equal(result,[...left].map(x=>mapping[x]).join(''));
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)near(length(p,left[i],left[j]),length(p,result[i],result[j]),'corresponding sides');break;
 }
 case 'triangle-proof-reasons':assert(chosen(s[0]).includes('условия'));assert(chosen(last).includes(t.q.includes('∠')?'Вертикальные':'Общая'));break;
 case 'triangle-sas-common':{
  assert(chosen(s[0]).startsWith('AC = AC'));const proof=chosen(last);assert(proof.includes('AB = AD')&&proof.includes('AC = AC')&&proof.includes('∠BAC = ∠CAD')&&proof.includes('по первому'));
  for(const id of ['BC','CD'])assert(!d.segments.find(x=>x.id===id).marks,'derived side cannot be marked as given');break;
 }
 case 'triangle-sas-cross':{
  near(degrees(p,'O','A','C'),180,'cross line AC');near(degrees(p,'O','B','D'),180,'cross line BD');near(degrees(p,'O','A','B'),degrees(p,'O','C','D'),'vertical included angles');assert(chosen(last).includes('по первому')&&chosen(last).includes('как вертикальные'));assert.equal(d.angles.length,0,'no derived angle marks');break;
 }
 case 'triangle-sas-insufficient':{
  const matches=[...t.q.matchAll(/([ABC]{2}) = ([DEF]{2})/g)],a=matches[0][1],b=matches[1][1],v=[...a].find(x=>b.includes(x)),angle=t.q.match(/∠([ABC]{3})/)[1];assert.notEqual(v,angle[1],'given angle is not included');const required=chosen(last).match(/∠([ABC]{3})/)[1];assert.equal(required[1],v);assert(chosen(s[0]).startsWith('Нет'));break;
 }
 case 'triangle-median':{
  near(length(p,'B','M'),length(p,'M','C'),'midpoint');const given=Number(t.q.match(/= (\d+) см/)[1]),whole=t.q.includes('BC =');expectNumber(last,whole?given/2:2*given);assert(chosen(s[0]).startsWith('BM = MC'));break;
 }
 case 'triangle-bisector':{
  near(degrees(p,'A','B','L'),degrees(p,'A','L','C'),'bisector');const ask=t.q.match(/Найди ∠(\w{3})/)[1];expectNumber(last,degrees(p,ask[1],ask[0],ask[2]));assert(chosen(s[0]).includes('∠BAL = ∠LAC'));break;
 }
 case 'triangle-altitude':{
  near(degrees(p,'H','A','C'),90,'height');expectNumber(s[0],90);const BH=length(p,'B','H'),HC=length(p,'H','C'),BC=length(p,'B','C'),outside=Math.abs(BH+HC-BC)>1e-6;assert(chosen(last).includes('высота'));assert.equal(chosen(last).includes('продолжении'),outside);break;
 }
 case 'triangle-cevian-choice':{
  const expected=t.q.includes('BM = MC')?'медиана':t.q.includes('∠BAL = ∠LAC')?'биссектриса':'высота';expectLabel(last,expected);break;
 }
 case 'triangle-isosceles-base':{
  const marked=d.segments.filter(x=>x.marks),v=[marked[0].from,marked[0].to].find(x=>x===marked[1].from||x===marked[1].to),base=Object.keys(p).filter(x=>x!==v);assert.equal(chosen(last).split('').sort().join(''),base.sort().join(''));expectLabel(s[0],v);const sides=t.q.match(/равны стороны (\w\w) и (\w\w)/);assert.equal(d.description,`${sides[1]} = ${sides[2]}. Другие равенства нужно обосновать.`,'renamed diagram caption must agree with the given equal sides');assert(!d.description.includes(chosen(last))&&!d.description.includes('основание'),'caption must not reveal the requested base');break;
 }
 case 'triangle-isosceles-angle':expectNumber(last,degrees(p,'C','B','A'));near(length(p,'A','B'),length(p,'A','C'),'equal lateral sides');if(t.q.includes('продолжение'))expectNumber(s[0],degrees(p,'B','A','C'));break;
 case 'triangle-isosceles-cevian':{
  const output=chosen(last);if(output.includes('BM = MC'))near(length(p,'B','M'),length(p,'M','C'),'median conclusion');if(output.includes('AM ⟂ BC'))near(degrees(p,'M','A','C'),90,'height conclusion');if(output.includes('∠BAM = ∠MAC'))near(degrees(p,'A','B','M'),degrees(p,'A','M','C'),'bisector conclusion');assert(chosen(s[0]).includes('к основанию'));break;
 }
 case 'triangle-asa-adjacent':{
  const side=t.q.match(/сторона (\w\w)/)[1],vertices=[...chosen(last).matchAll(/∠(\w{3})/g)].map(x=>x[1][1]);assert.equal(vertices.sort().join(''),side.split('').sort().join(''));break;
 }
 case 'triangle-asa-proof':assert(chosen(last).includes('по второму')&&chosen(last).includes('AB = DE')&&chosen(last).includes('∠BAC = ∠EDF')&&chosen(last).includes('∠ABC = ∠DEF'));expectLabel(s[0],'AB и DE.');break;
 case 'triangle-asa-consequence':{
  expectNumber(last,Number(t.q.match(/AC = (\d+)/)[1]));near(length(p,'A','C'),length(p,'D','F'),'corresponding side');expectLabel(s[0],'△ABC = △DEF.');assert(!d.segments.find(x=>x.id==='DF').marks,'derived side DF not given');break;
 }
 case 'triangle-sss-proof':{
  assert(chosen(last).includes('по третьему'));assert(!d.angles.some(a=>a.marks),'SSS cannot presume equal angles');const groups=new Set(d.segments.filter(s=>s.marks).map(s=>s.marks));assert(groups.size>=2);assert(chosen(s[0]).includes('Три пары'));break;
 }
 case 'triangle-congruence-choice':{
  const sides=d.segments.filter(s=>s.marks).length,angles=d.angles.filter(a=>a.marks).length,expected=sides===6?'Третий':angles===4?'Второй':'Первый';assert(chosen(last).startsWith(expected));assert(sides===6&&angles===0||sides===2&&angles===4||sides===4&&angles===2);break;
 }
 case 'triangle-congruence-consequence':{
  const [left,right]=[...chosen(last).matchAll(/∠(\w{3})/g)].map(x=>x[1]),mapping={A:'A',B:'D',C:'C'};assert.equal([...left].map(x=>mapping[x]).join(''),right);assert(chosen(s[0]).includes('третий'));assert.equal(d.angles.length,0,'consequence angles not premarked');break;
 }
 case 'circle-elements':{
  if(t.q.includes('часть окружности'))expectLabel(last,'Дуга.');else{const seg=t.q.match(/отрезок (\w\w)/)[1],r=d.circles[0].radius;if(seg.includes('O'))expectLabel(last,'Радиус.');else if(Math.abs(length(p,...seg)-2*r)<1e-6)expectLabel(last,'Диаметр (он также является хордой).');else expectLabel(last,'Хорда, не проходящая через центр.');}break;
 }
 case 'circle-radius-diameter':{
  const given=Number(t.q.match(/= (\d+) см/)[1]),ask=t.q.match(/Найди (\w\w)/)[1];expectNumber(last,ask==='OB'?given/2:given*2);near(length(p,'A','C'),2*length(p,'O','A'),'diameter is twice radius');break;
 }
 case 'circle-isosceles':expectNumber(last,degrees(p,'B','A','O'));near(length(p,'O','A'),length(p,'O','B'),'radii');assert(chosen(s[0]).includes('радиусы одной окружности'));assert(d.angles.every(a=>!a.marks),'base-angle equality is derived');break;
 case 'circle-congruent-chords':
  near(degrees(p,'O','A','C'),180,'diameter AC');near(degrees(p,'O','B','D'),180,'diameter BD');near(length(p,'A','B'),length(p,'C','D'),'congruent chords');assert(chosen(last).includes('по первому')&&chosen(last).includes('соответствующие стороны'));assert(d.segments.every(s=>!s.marks),'equal chords not marked as given');break;
 default:throw Error('Missing oracle '+key);
 }
}
let checked=0,stepCount=0;
for(const family of families){
 assert(family.section>=6&&family.section<=11);assert(family.sourcePages.every(p=>p>=33&&p<=53));
 const unique=new Set();
 for(let n=0;n<72;n++){
  const t=D.task(family.id,n);assert.equal(t.model.kind,'grade7-construction');assert(t.steps.length>=2);assert.equal(t.a,t.steps.at(-1).a);assert.equal(t.answerExact,t.a);assert.equal(t.answer,Number(t.a));assert.equal(t.strict,true);
  for(const s of t.steps){assert(s.q&&s.why);assert(Number.isFinite(Number(s.a)));assert(D.correct(s,s.a));assert(!D.correct(s,String(Number(s.a)+1000)));if(s.choices){assert.equal(new Set(s.choices.map(c=>c.label)).size,s.choices.length);assert.equal(Object.keys(s.feedback||{}).length,s.choices.length-1);for(const c of s.choices)assert.equal(D.correct(s,c.value),c.value===s.a);}stepCount++;}
  if(t.steps.at(-1).choices)assert.deepEqual(t.choices,t.steps.at(-1).choices);else assert(!t.choices);
  allGeometry(t);oracle(t);unique.add(JSON.stringify({q:t.q,diagram:t.model.diagram}));checked++;
 }
 assert(unique.size>=24,`${family.id}: variants must vary the mathematical situation or geometry, not just shuffle answers`);
 for(const [seed,normalized]of[[-1,71],[72,0],[143,71],[3.9,3],[NaN,0],[Infinity,0]]){
  const a=D.task(family.id,seed),b=D.task(family.id,normalized);assert.equal(a.q,b.q);assert.equal(a.a,b.a);assert.deepEqual(a.model,b.model);
 }
}
assert.equal(new Set(families.map(m=>m.id)).size,25);assert(H.has('grade7-r-triangle-proof-correspondence'));assert(!H.has('grade7-r-triangle-correspondence'));
for(const x of old)assert.equal(JSON.stringify(D.task(x.id,7)),x.sample,'existing task unaffected: '+x.id);
console.log(`Triangle/circle content: ${families.length} families, ${checked} variants, ${stepCount} steps; geometry, proofs, marks and normalization passed.`);
