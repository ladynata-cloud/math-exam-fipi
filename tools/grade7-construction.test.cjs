'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data');
for(const file of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core','grade7-geometry-practice'])require('../ege-baza/path/'+file);
const renderer=require('../ege-baza/path/grade7-geometry-core-models'),state=require('../ege-baza/path/managed-state');
let cases=0,constructions=0,angles=0;
for(const meta of D.meta.filter(x=>/^grade7-g-(?:core|practice)-/.test(x.id)))for(let seed=0;seed<216;seed++){
 const t=D.task(meta.id,seed),m=t.model,d=m.diagram,ids=m.elements.map(e=>e.id),builds=(m.constructions||[]).map(c=>c.id);
 assert.equal(m.kind,'grade7-construction');assert(ids.length>=2);assert.equal(ids.length,new Set(ids).size);assert.equal(builds.length,new Set(builds).size);assert(d.description);
 for(const point of Object.values(d.points)){assert(Number.isFinite(point.x)&&Number.isFinite(point.y));if(point.construction)assert(builds.includes(point.construction));}
 for(const s of d.segments||[]){const p=d.points[s.from],q=d.points[s.to];assert(p&&q);assert(Math.hypot(p.x-q.x,p.y-q.y)>1e-6);if(s.construction)assert(builds.includes(s.construction));if(s.marks)assert(Number.isInteger(s.marks)&&s.marks>=1&&s.marks<=3);}
 for(const a of d.angles||[]){const v=d.points[a.vertex],p=d.points[a.from],q=d.points[a.to];assert(v&&p&&q);const u=[p.x-v.x,p.y-v.y],w=[q.x-v.x,q.y-v.y],length=Math.hypot(...u)*Math.hypot(...w);assert(length>1e-6);if(a.right)assert(Math.abs(u[0]*w[0]+u[1]*w[1])/length<1e-8,'right-angle mark must be perpendicular');if(a.construction)assert(builds.includes(a.construction));angles++;}
 const html=renderer.svg(t,ids[0],builds);assert(!/NaN|Infinity|undefined|<script|marker-end/.test(html));assert(html.includes('data-core-part'));
 const spec={id:t.id,seed,contentVersion:1,task:t},fresh=state.fresh(spec);fresh.work.model={kind:'grade7-construction',selected:ids[0],built:builds,revealed:2};assert.deepEqual(state.validate(fresh,spec).work.model,fresh.work.model);
 for(const bad of [{kind:'grade7-construction',selected:null,built:['foreign-construction'],revealed:0},{kind:'grade7-construction',selected:'foreign-element',built:[],revealed:0},{kind:'grade7-construction',selected:null,built:[],revealed:t.steps.length+1},{kind:'grade7-construction',selected:null,built:[],revealed:0,coordinates:[1,2]}])assert.throws(()=>state.model(bad,t));
 if(builds.length)assert.throws(()=>state.model({kind:'grade7-construction',selected:null,built:[builds[0],builds[0]],revealed:0},t));
 constructions+=builds.length;cases++;
}
assert.equal(cases,4320);console.log(`GRADE7_CONSTRUCTION_OK: ${cases} semantic diagrams; ${constructions} constructions; ${angles} valid angle records; exact restored state, forged/duplicate IDs rejected.`);
