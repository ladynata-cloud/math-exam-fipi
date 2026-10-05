'use strict';
const assert=require('node:assert/strict');
require('../ege-baza/path/data.js');
require('../ege-baza/path/practice.js');
require('../ege-baza/path/equation-practice.js');
const oldTasks=PathData.meta.map(({id})=>[id,[0,1,19,239].map(seed=>JSON.stringify(PathData.task(id,seed)))]);
require('../ege-baza/path/grade7-geometry.js');
const V=require('../ege-baza/path/grade7-geometry-models.js'),D=PathData;
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-7,`${message}: ${a} != ${b}`);
for(const [id,snapshots] of oldTasks)[0,1,19,239].forEach((seed,i)=>assert.equal(JSON.stringify(D.task(id,seed)),snapshots[i],`old task changed: ${id}/${seed}`));
assert.equal(D.grade7Geometry.families.length,8);
const assignments=(q,re)=>Object.fromEntries([...q.matchAll(re)].map(m=>[m[1],Number(m[2])]));
const lengths=q=>assignments(q,/([A-Z]{2}) = (\d+) см/g);
const degrees=q=>assignments(q,/∠([A-Z]{3}) = (\d+)°/g);
function parseLinear(text){
 const compact=text.replace(/[()\s°]/g,'').replaceAll('−','-');
 const match=compact.match(/^(\d*)x(?:([+-])(\d+))?$/);
 assert.ok(match,`linear label ${text}`);
 return {coefficient:Number(match[1]||1),constant:(match[2]==='-'?-1:1)*Number(match[3]||0)};
}
// Solve from the public question and its stated relationships, not generator params.
function expected(t){
 const L=lengths(t.q),A=degrees(t.q);
 if(t.id.endsWith('segment-order'))return L.AD!==undefined?L.AD-L.AB-L.BC:L.AC!==undefined?L.AC-L.AB:L.AB+L.BC;
 if(t.id.endsWith('midpoint-chain'))return L.AM!==undefined?2*L.AM:L.AB!==undefined?L.AB/4:L.AN/3*4;
 if(t.id.endsWith('angle-naming')){
  if(t.q.includes('Найди ∠NML'))return A.LMN;
  const values=Object.values(A);return t.q.includes('Найди ∠ABD')?values[0]+values[1]:values[0]-values[1];
 }
 if(t.id.endsWith('angle-addition'))return A.AOD!==undefined?A.AOD-A.AOB-A.BOC:A.AOC!==undefined?A.AOC-A.AOB:A.AOB+A.BOC;
 if(t.id.endsWith('angle-bisector'))return t.q.includes('OD — биссектриса')?A.AOB/4:A.AOC!==undefined?A.AOC/2:A.AOB*2;
 if(t.id.endsWith('adjacent-equation')){
  const terms=[...t.q.matchAll(/∠[A-Z]{3} = ([^.]+?)°/g)].map(m=>parseLinear(m[1]));
  return (180-terms.reduce((sum,x)=>sum+x.constant,0))/terms.reduce((sum,x)=>sum+x.coefficient,0);
 }
 if(t.id.endsWith('vertical-chain'))return t.q.includes('биссектриса')?A.AOC/2:A.AOC??180-A.COB;
 const map=t.q.match(/△ABC = △([A-Z]{3})/)[1],unknown=t.q.match(/Найди ([A-Z]{2})/),equation=t.q.match(/([A-Z]{2}) = \(2x \+ (\d+)\)/),target=unknown?unknown[1]:equation[1];
 const source=[...target].map(c=>'ABC'[map.indexOf(c)]).sort().join('');
 return unknown?L[source]:(L[source]-Number(equation[2]))/2;
}
let tasks=0,arcs=0,correspondences=0;
for(const meta of D.grade7Geometry.families){
 const fullMeta=D.meta.find(x=>x.id===meta.id),unique=new Set(),variants=new Set();
 assert.equal(fullMeta.pos,null);assert.equal(fullMeta.trainingOnly,true);assert.equal(fullMeta.grade7,true);assert.equal(fullMeta.subject,'geometry');
 for(let seed=0;seed<D.grade7Geometry.count;seed++){
  const t=D.task(meta.id,seed),d=t.model.diagram;tasks++;unique.add(t.q);variants.add(t.variant);
  assert.equal(t.seed,seed);assert.equal(t.model.kind,'grade7-geometry');assert.equal(t.strict,true);
  near(t.answer,expected(t),`${t.id}/${seed}: question solution`);
  assert.equal(D.correct(t,D.answerText(t)),true);assert.equal(D.correct(t,String(t.answer+1)),false);
  near(D.parse(t.steps.at(-1).a),D.parse(t.answer),`${t.id}/${seed}: final scaffold`);
  for(const step of t.steps){
   assert.ok(step.q.length>5&&step.why.length>10);assert.equal(step.strict,true);assert.notEqual(D.parse(step.a),null);assert.equal(D.correct(step,D.answerText(step)),true);
   if(step.choices){assert.equal(new Set(step.choices.map(x=>x.value)).size,step.choices.length);assert.equal(step.choices.filter(x=>D.correct(step,x.value)).length,1);assert.ok(step.choices.some(x=>x.value===String(step.a)));}
  }
  const elementIDs=t.model.elements.map(x=>x.id);assert.equal(new Set(elementIDs).size,elementIDs.length);
  const graphicalIDs=[...d.segments,...d.angles].map(x=>x.id);
  for(const id of elementIDs)assert.ok(graphicalIDs.includes(id),`selectable element has no shape: ${id}`);
  for(const p of Object.values(d.points)){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=20&&p.x<=580&&p.y>=20&&p.y<=315);}
  for(const a of d.angles){
   assert.ok(a.degrees>0&&a.degrees<180);arcs++;
   const v=d.points[a.vertex],p=d.points[a.from],q=d.points[a.to],u=[p.x-v.x,p.y-v.y],w=[q.x-v.x,q.y-v.y];
   const dot=(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w));
   near(Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI,a.degrees,`${t.id}/${seed}: drawn angle ${a.id}`);
  }
  // A repeated marking must mean equal lengths/angles, never a decorative equality.
  for(const count of [1,2,3]){
   const same=d.segments.filter(s=>s.marks===count).map(s=>Math.hypot(d.points[s.from].x-d.points[s.to].x,d.points[s.from].y-d.points[s.to].y));
   same.slice(1).forEach(length=>{near(length,same[0],`${t.id}/${seed}: equal segment ticks`);correspondences++;});
   const angleGroup=d.angles.filter(a=>a.marks===count);angleGroup.slice(1).forEach(a=>near(a.degrees,angleGroup[0].degrees,`${t.id}/${seed}: equal angle arcs`));
  }
  if(d.type==='triangles'){
   const stated=lengths(t.q),drawn={};
   for(const side of ['AB','BC','AC'])drawn[side]=Math.hypot(d.points[side[0]].x-d.points[side[1]].x,d.points[side[0]].y-d.points[side[1]].y);
   near(drawn.AB/stated.AB,drawn.BC/stated.BC,'first triangle scale');near(drawn.BC/stated.BC,drawn.AC/stated.AC,'first triangle scale');
   const step=t.steps[1],picked=step.choices.find(x=>x.value===String(step.a)).label,mapping=t.q.match(/△ABC = △([A-Z]{3})/)[1],target=t.q.match(/Найди ([A-Z]{2})/)?.[1]||t.q.match(/([A-Z]{2}) = \(2x/)[1];
   assert.equal([...picked].map(c=>mapping['ABC'.indexOf(c)]).sort().join(''),[...target].sort().join(''));
  }
  const markup=V.svg(t),selected=V.svg(t,elementIDs[0]);
  assert.ok(!/(NaN|undefined|<script|marker-end)/.test(markup));assert.ok(markup.includes('role="img"'));assert.notEqual(markup,selected,'selection changes actual drawing');
  for(const id of elementIDs)assert.ok(markup.includes(`data-geo-id="${id}"`));
  assert.ok(V.visual(t).includes(d.description));
 }
 assert.deepEqual([...variants].sort(),[0,1,2]);assert.ok(unique.size>=40,`${meta.id}: too few original numerical variants (${unique.size})`);
 assert.deepEqual(D.task(meta.id,-1).model,D.task(meta.id,239).model);
 assert.deepEqual(D.task(meta.id,240).model,D.task(meta.id,0).model);
}
// The model has no local persistence or document-wide listeners. It restores only
// selected element + reveal count through the shared semantic model session.
const source=require('node:fs').readFileSync(require.resolve('../ege-baza/path/grade7-geometry-models.js'),'utf8');
assert.ok(!/localStorage|sessionStorage|addEventListener/.test(source));
console.log(JSON.stringify({gate:'GRADE7_GEOMETRY_OK',families:8,tasks,structuralVariants:24,angleCoordinateChecks:arcs,equalSegmentChecks:correspondences,existingTasksPreserved:oldTasks.length}));
