'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./monotone-paths-and-dual-solids.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const sub=(a,b)=>a.map((v,i)=>v-b[i]), add=(a,b)=>a.map((v,i)=>v+b[i]), mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>Math.hypot(...v);
const near=(x,y)=>assert(Math.abs(x-y)<1e-8*Math.max(1,Math.abs(x),Math.abs(y)),x+' versus '+y);
const equal=(a,b)=>near(norm(sub(a,b)),0);
const normal=(a,b,c)=>cross(sub(b,a),sub(c,a));
const area=(a,b,c)=>norm(normal(a,b,c))/2;
function projection(p,a,b,c) {
  const n=normal(a,b,c);
  return sub(p,mul(n,dot(sub(p,a),n)/dot(n,n)));
}
const distance=(a,b)=>norm(sub(a,b));
const volume=(a,b,c,d)=>Math.abs(dot(normal(a,b,c),sub(d,a)))/6;
const mix=(a,b,t)=>add(a,mul(sub(b,a),t));
function planeDistance(point,a,b,c) {
  const n=normal(a,b,c);
  return Math.abs(dot(n,sub(point,a)))/norm(n);
}
const mean=points=>mul(points.reduce(add,[0,0,0]),1/points.length);
function polyline(d){
  return [[d,d,d],[1-3*d,2*d,2*d],[1-2*d,1-2*d,3*d],[1-d,1-d,1-d]];
}
function pathLength(points){return points.slice(1).reduce((total,q,i)=>total+distance(q,points[i]),0);}
function checkMonotone(points){
  for(const q of points)assert(q.every(x=>x>0&&x<1));
  for(let i=0;i<points.length-1;i++)assert(sub(points[i+1],points[i]).every(x=>x>0));
  for(let axis=0;axis<3;axis++)for(let t=.025;t<1;t+=.05){
    const hits=points.slice(1).map((q,i)=>[points[i],q]).filter(([a,b])=>a[axis]<=t&&t<b[axis]);
    assert(hits.length<=1);
  }
}
function checkDual(c,regularFaces,vertexDegree){
  const {points:p,faces,edges,views}=c.visualization.model;
  const originalNames=[...new Set(faces.flat())],centers=faces.map(f=>mean(f.map(k=>p[k])));
  const cnames=centers.map(q=>Object.keys(p).find(k=>distance(q,p[k])<1e-8));
  assert(cnames.every(Boolean));assert.equal(new Set(cnames).size,faces.length);
  const d=dot(centers[0],centers[0]),seen=new Map(),edgeLength=[];
  for(const f of faces){
    assert.equal(f.length,regularFaces);const origin=mean(f.map(k=>p[k]));near(dot(origin,origin),d);
    for(const k of originalNames){
      const value=dot(origin,p[k]);assert(value<=d+1e-8);assert.equal(Math.abs(value-d)<1e-8,f.includes(k));
    }
  }
  for(const k of originalNames){
    const active=cnames.filter(name=>Math.abs(dot(p[k],p[name])-d)<1e-8);
    assert.equal(active.length,vertexDegree);
    const center=mean(active.map(n=>p[n])),r=distance(p[active[0]],center);
    for(const n of active)near(distance(p[n],center),r);
    const connecting=views.dual.segments.filter(([a,b])=>active.includes(a)&&active.includes(b));
    assert.equal(connecting.length,vertexDegree);
    for(const [a,b] of connecting){
      const key=[a,b].sort().join(':');seen.set(key,(seen.get(key)||0)+1);edgeLength.push(distance(p[a],p[b]));
      near(dot(sub(p[a],center),sub(p[b],center))/r**2,Math.cos(2*Math.PI/vertexDegree));
    }
  }
  assert.equal(edges.length,30);assert.equal(seen.size,30);
  assert([...seen.values()].every(k=>k===2));
  assert.equal(cnames.length-seen.size+originalNames.length,2);
  for(const e of edgeLength)near(e,edgeLength[0]);
  const dualDegree=Object.fromEntries(cnames.map(k=>[k,0]));
  for(const [a,b] of views.dual.segments){dualDegree[a]++;dualDegree[b]++;}
  assert(Object.values(dualDegree).every(d=>d===regularFaces));
  return {centers:cnames.length,facets:originalNames.length};
}
let piecewise=0,translations=0;
for(const eps of [1,.5,.1,.025,.001,.00001]){
  const delta=Math.min(1/12,eps/24),q=polyline(delta);
  checkMonotone(q);const length=pathLength(q);assert(3-length>0 && 3-length<eps);
  for(const [i,b] of q.slice(1).entries())assert(distance(q[i],b)<sub(b,q[i]).reduce((s,x)=>s+x,0));
  piecewise++;
}
for(const theta of [.2,.7,1.4,2.4])for(const a of [.5,2,5])for(const b of [1,3,7])for(const d of [1,3,8])for(const t of [-2,0,2]){
  const first=[a,0,0],second=[b*Math.cos(theta),b*Math.sin(theta),0],A=[t,0,0],C=add([0,0,d],mul(second,-t/3));
  near(volume(A,add(A,first),C,add(C,second)),a*b*d*Math.sin(theta)/6);
  translations++;
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0783','ex-main-0784','ex-main-0785','ex-main-0786']);
let fields=0;
for(const id of Object.keys(release.cards)){
  const c=available.get(id),m=c.visualization.model,p=m.points;
  viewer.prepare(m);assert.deepEqual(c.source.printedPages,[191]);assert.deepEqual(c.source.pdfPages,[193]);assert.equal(c.answer.mode,'manual');
  let expected;
  if(id.endsWith('783')){
    for(const [names,delta] of [[['P','Q','R','S'],.05],[['P1','Q1','R1','S1'],.01]]){
      const q=names.map(n=>p[n]);for(const [i,pt] of q.entries())equal(pt,polyline(delta)[i]);
      checkMonotone(q);assert(pathLength(q)>3-12*delta&&pathLength(q)<3);
    }
    assert.match(c.answer.feedback,/ε/u);expected=[3,p.S[0]-p.P[0],3*(p.Q1[0]-p.P1[0])];
  }else if(id.endsWith('784')){
    const a=sub(p.B,p.A),b=sub(p.D,p.C),area=norm(cross(a,b));
    const V=volume(p.A,p.B,p.C,p.D);
    near(volume(p.A1,p.B1,p.C1,p.D1),V);near(volume(p.A,p.B,p.P,p.Q),2*V);
    near(norm(cross(a,sub(p.A1,p.A))),0);near(norm(cross(b,sub(p.C1,p.C))),0);
    assert.match(c.answer.feedback,/расстояние d/u);expected=[area,V,2*V];
  }else if(id.endsWith('785')){
    const dual=checkDual(c,5,3);assert.equal(dual.centers,12);assert.equal(dual.facets,20);
    expected=[m.views.reason.polygon.length,dual.facets,360/m.views.reason.polygon.length];
  }else{
    const dual=checkDual(c,3,5);assert.equal(dual.centers,20);assert.equal(dual.facets,12);
    expected=[360/m.views.reason.polygon.length,dual.centers,180-360/m.views.reason.polygon.length];
  }
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,12);
console.log('ADVANCED_783_786_OK: twelve checked fields, '+piecewise+' monotone extremal paths, '+translations+' skew-line translations and all sixty dual edge incidences for each solid.');
