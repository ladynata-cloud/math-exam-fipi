'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./first-advanced-pyramid-problems.json');
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
function faceAngleToBase(a,b,m) {
  const n=normal(a,b,m);
  return Math.acos(Math.min(1,Math.abs(n[2])/norm(n)));
}
function checkDistanceToFace(a,b,c,m,h,d) {
  near(faceAngleToBase(b,c,m),faceAngleToBase(a,b,m));
  near(faceAngleToBase(a,c,m),Math.PI/2);
  const f=projection(h,m,b,c), cm=sub(m,c), cf=sub(f,c);
  near(norm(cross(cm,cf)),0);
  const fraction=dot(cm,cf)/dot(cm,cm);
  assert(fraction>0 && fraction<1,'the closest point belongs to the actual triangular face, on edge MC');
  near(norm(sub(h,f)),d);
  return area(a,b,m)+area(b,c,m)+area(c,a,m);
}
let cases768=0,cases769=0,cases770=0;
for(const a of [2,4,9])for(const b of [1.5,3,5])for(const ratio of [.25,.6,.8]){
  const ab=Math.hypot(a,b),C=[0,0,0],A=[a,0,0],B=[0,b,0];
  const positions=[a*b/(ab+b),-a*b/(ab-b)];
  const d=ratio*positions[0];
  for(const x of positions){
    const h=d*Math.abs(x)/Math.sqrt(x*x-d*d),H=[x,0,0],M=[x,0,h];
    const surface=checkDistanceToFace(A,B,C,M,H,d);
    near(surface,(a*h+(ab+b)*Math.hypot(x,h))/2);
    cases768++;
  }
}
for(const b of [2,4,7])for(const ratio of [-.5,0,.25,.75,1,1.5])for(const h of [1,3]){
  const y=3,x=b*ratio,hy=x*(b-x)/y;
  const tetra=[[0,0,0],[b,0,0],[x,y,0],[x,hy,h]];
  for(const [i,p] of tetra.entries()){
    const face=tetra.filter((_,j)=>j!==i),[u,v,w]=face,f=projection(p,u,v,w);
    near(dot(sub(f,u),sub(w,v)),0);near(dot(sub(f,v),sub(w,u)),0);near(dot(sub(f,w),sub(v,u)),0);
    cases769++;
  }
}
for(const a of [1,3,4,7])for(const b of [1,3,5])for(const c of [.6,1.8,4,9]){
  const O=[0,0,0],A=[a,0,0],B=[0,b,0],C=[0,0,c],F=projection(O,A,B,C);
  const middle=area(A,O,B),top=area(A,B,C),bottom=area(A,F,B);
  near(middle*middle,top*bottom);
  near(middle/top,bottom/middle);
  equal(projection(C,O,A,B),O);
  cases770++;
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0768','ex-main-0769','ex-main-0770']);
let fields=0;
for(const id of Object.keys(release.cards)){
  const c=available.get(id),m=c.visualization.model,p=m.points;
  viewer.prepare(m);assert.deepEqual(c.source.printedPages,[190]);assert.deepEqual(c.source.pdfPages,[192]);
  let values;
  if(id.endsWith('768')){
    const d=3*Math.SQRT2/4;
    const inside=checkDistanceToFace(p.A,p.B,p.C,p.M,p.H,d);
    const outside=checkDistanceToFace(p.A,p.B,p.C,p.T,p.E,d);
    equal(p.F,projection(p.H,p.M,p.B,p.C)); equal(p.G,projection(p.E,p.T,p.B,p.C)); equal(p.X,projection(p.H,p.N,p.B,p.C));
    const a=norm(sub(p.A,p.C));assert(p.H[0]>0 && p.H[0]<a && p.E[0]<0);
    near(inside,3*(1+2*Math.SQRT2));near(outside,(12+96*Math.SQRT2)/Math.sqrt(31));
    assert.equal(engine.classifyAnswer(inside+';'+outside,c.answer.accepted).status,'correct');
    assert.equal(engine.classifyAnswer(outside+';'+inside,c.answer.accepted).status,'wrong');
    values=[norm(sub(p.H,p.C)),norm(sub(p.H,p.M)),norm(sub(p.E,p.C)),norm(sub(p.X,p.H))];
  }else if(id.endsWith('769')){
    assert.equal(c.answer.mode,'manual');assert.match(c.answer.feedback,/равноправны/u);
    equal(p.F,projection(p.A,p.B,p.C,p.D)); equal(p.H,projection(p.D,p.A,p.B,p.C));
    near(dot(sub(p.B,p.A),sub(p.D,p.C)),0);near(dot(sub(p.C,p.B),sub(p.D,p.A)),0);near(dot(sub(p.C,p.A),sub(p.D,p.B)),0);
    near(dot(sub(p.F,p.B),sub(p.D,p.C)),0);near(dot(sub(p.F,p.C),sub(p.D,p.B)),0);
    values=['CD','CD',dot(sub(p.B,p.A),sub(p.T,p.C))];
  }else{
    assert.equal(c.answer.mode,'manual');assert.match(c.answer.feedback,/положительны/u);
    equal(p.O1,projection(p.O,p.A,p.B,p.C)); equal(p.G,projection(p.O,p.A,p.B,p.T));
    values=['O',area(p.A,p.O,p.B)/area(p.A,p.B,p.C),area(p.A,p.G,p.B)];
    near(area(p.A,p.O1,p.B),24/5);
  }
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(values[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,10);
console.log('ADVANCED_768_770_OK: ten fields, '+cases768+' interior/exterior pyramids, '+cases769+' tetrahedron feet and '+cases770+' double projections; both proofs remain human-reviewed.');
