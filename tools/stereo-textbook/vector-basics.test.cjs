'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./vector-basics.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const steps={'theory-063':[5,5,10,0],'theory-064':[1,5,5,13],'ex-main-0557-a':[4,1.5,2.5,4],
 'ex-main-0557-b':[4,2,2.5,3.5],'ex-main-0558-a':[12,8,9,10],'ex-main-0558-b':[15,145,17,13]};
const expected={
 'ex-main-0557-a':[['A','B'],['B','C'],['B','D'],['N','M'],['B','N'],['N','K']],
 'ex-main-0557-b':[['C','B'],['B','A'],['D','B'],['N','C'],['K','N']],
 'ex-main-0558-a':[['C','C1'],['C','B'],['C','D']],
 'ex-main-0558-b':[['D','C1'],['D','B'],['D','B1']]
};
const keys={'ex-main-0557-a':[3,4,5,1.5,2,2.5],'ex-main-0557-b':[4,3,5,2,2.5],'ex-main-0558-a':[12,8,9],'ex-main-0558-b':[15,Math.sqrt(145),17]};
const fromTo=(a,b)=>a.map((x,i)=>b[i]-x),norm=v=>Math.hypot(...v);
const near=(x,y)=>assert(Math.abs(x-y)<1e-8*Math.max(1,Math.abs(y)),x+' versus '+y);
const mid=(a,b)=>a.map((x,i)=>(x+b[i])/2);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
let fields=0;
for(const [id,values] of Object.entries(steps)){
 const c=available.get(id),m=c.visualization.model,p=m.points;assert(Object.hasOwn(manifest.cards,id));viewer.prepare(m);
 const printed=id==='theory-063'?[142,143]:id==='theory-064'?[143]:[144];
 assert.deepEqual(c.source.printedPages,printed);assert.deepEqual(c.source.pdfPages,printed.map(v=>v+2));
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(String(values[i]),s.input.accepted).status,'correct',id+'/'+s.id);
  for(const wrong of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(wrong,s.input.accepted).status,'wrong');
  if(id.startsWith('ex-')&&i===2)assert.equal(s.justifications[0].theoryId,'theory-063');fields++;
 }
 for(const view of Object.values(m.views))for(const [a,o,b] of view.rightAngles||[])near(dot(fromTo(p[o],p[a]),fromTo(p[o],p[b])),0);
 if(id==='theory-063'){assert.deepEqual(m.arrows,[['A','B'],['C','E'],['D','C'],['A','T']]);near(dot(fromTo(p.A,p.T),fromTo(p.A,p.B)),0);assert.deepEqual(fromTo(p.C,p.E),fromTo(p.A,p.B).map(x=>2*x));assert.deepEqual(fromTo(p.C,p.D),fromTo(p.A,p.B));}
 else if(id==='theory-064'){assert.deepEqual(fromTo(p.A,p.B),fromTo(p.C,p.D));assert.deepEqual(fromTo(p.C,p.F),fromTo(p.D,p.C));}
 else{
  assert.deepEqual(m.arrows,expected[id]);for(const [i,[a,b]] of expected[id].entries())near(norm(fromTo(p[a],p[b])),keys[id][i]);
  assert.equal(engine.classifyAnswer(keys[id].join(';'),c.answer.accepted).status,'correct');
  if(id.includes('0557')){for(const [k,a,b] of [['M','A','C'],['N','B','C'],['K','C','D']])assert.deepEqual(p[k],mid(p[a],p[b]));}
 }
}
for(const n of ['557','558'])assert.deepEqual(manifest.parts[n],['а','б']);for(const n of ['theory-63','theory-64'])assert.deepEqual(manifest.parts[n],[null]);
let variants=0;
// Check the midpoint conclusions even when none of the three edges at B is perpendicular.
for(const A of [[3,0,0],[1,2,2],[-2,-2,1]])for(const D of [[0,3,4],[4,0,3],[3,4,0]]){
 const B=[0,0,0],C=[0,0,4],M=mid(A,C),N=mid(B,C),K=mid(C,D);
 near(norm(fromTo(N,M)),norm(fromTo(B,A))/2);near(norm(fromTo(N,K)),norm(fromTo(B,D))/2);
 near(norm(fromTo(N,C)),norm(fromTo(C,B))/2);near(norm(fromTo(K,N)),norm(fromTo(N,K)));variants++;
}
for(const [x,y,z] of [[8,9,12],[3,4,12],[4,2,7],[2.5,4,1.5]]){
 const D=[x,0,0],B=[0,y,0],C1=[x,y,z],B1=[0,y,z];
 near(norm(fromTo(D,C1)),Math.hypot(y,z));near(norm(fromTo(D,B1))**2,norm(fromTo(D,B))**2+z**2);variants++;
}
assert.equal(fields,24);assert.equal(variants,13);
console.log('ATANASYAN_VECTOR_BASICS_OK: points 63–64, exact directed arrow order and printed vector lengths in 557ab and 558ab, 24 fields, 13 independent configurations');
