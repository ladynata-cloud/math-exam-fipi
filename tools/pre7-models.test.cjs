'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data');
for(const file of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications'])require('../ege-baza/path/'+file);
const models=require('../ege-baza/path/pre7-models'),state=require('../ege-baza/path/managed-state');
let variants=0,restorations=0;
for(const family of D.meta.filter(m=>m.pre7))for(let seed=0;seed<360;seed++){
 const task=D.task(family.id,seed),m=task.model,d=m.diagram;
 assert.equal(m.kind,'pre7-lab');assert(m.elements.length>=2);assert.equal(new Set(m.elements.map(e=>e.id)).size,m.elements.length);
 for(const e of m.elements)assert(e.id&&e.label&&e.description);
 assert(typeof d.description==='string'&&d.description.length>10,`${family.id} diagram description`);
 if(d.type==='table'){assert(d.headers.length>=2&&d.rows.length>=1);for(const row of d.rows)assert.equal(row.length,d.headers.length);if(d.rowIds)assert.equal(d.rowIds.length,d.rows.length);}
 else if(d.type==='line'){
  assert(d.max>d.min);assert(Number.isInteger(d.intervals)&&d.intervals>0&&d.intervals<=24);
  for(const p of d.points){assert(Number.isFinite(p.value)&&p.value>=d.min&&p.value<=d.max);assert(m.elements.some(e=>e.id===p.id));assert(Math.abs((p.value-d.min)/(d.max-d.min)*d.intervals-Math.round((p.value-d.min)/(d.max-d.min)*d.intervals))<1e-8,'point lies on an actual tick');}
  if(d.tickLabels)assert.equal(d.tickLabels.length,d.intervals+1);
 }else if(d.type==='bars')for(const b of d.bars){assert(b.value>=0&&b.total>0&&b.value<=b.total);if(b.parts)assert(Number.isInteger(b.parts)&&b.parts<=24);}
 else if(d.type==='grid'){assert(Number.isInteger(d.cols)&&d.cols>=1&&d.cols<=12);assert(Number.isInteger(d.rows)&&d.rows>=1&&d.rows<=10);if(d.cutout){const c=d.cutout;assert(c.x>=0&&c.y>=0&&c.w>0&&c.h>0&&c.x+c.w<=d.cols&&c.y+c.h<=d.rows);}}
 else if(d.type==='boundary'){assert([3,4].includes(d.sides.length));assert(d.sides.every(x=>Number.isFinite(x)&&x>0));if(d.sides.length===3)assert(2*Math.max(...d.sides)<d.sides.reduce((a,b)=>a+b,0));else{assert.equal(d.sides[0],d.sides[2]);assert.equal(d.sides[1],d.sides[3]);}}
 else throw Error('Unexpected diagram '+d.type);
 const html=models.drawing(task,m.elements[0].id);assert(!/undefined|NaN|Infinity|<script/i.test(html));assert(html.includes('data-pre7-part'));
 const spec={id:task.id,seed,contentVersion:1,task};
 const restored=state.fresh(spec);restored.work.model={kind:'pre7-lab',selected:m.elements[0].id,revealed:2};assert.deepEqual(state.validate(restored,spec).work.model,restored.work.model);restorations++;
 for(const bad of [{kind:'pre7-lab',selected:'foreign-task-part',revealed:0},{kind:'pre7-lab',selected:null,revealed:task.steps.length+1},{kind:'pre7-lab',selected:null,revealed:0,answers:[1]},{kind:'pre7-lab',selected:null,revealed:0.5}])assert.throws(()=>state.model(bad,task));
 variants++;
}
assert.equal(variants,6480);console.log(`PRE7_MODELS_OK: ${variants} task-bound diagrams, ${restorations} restored selections; foreign fields/elements/out-of-range reveals rejected.`);
