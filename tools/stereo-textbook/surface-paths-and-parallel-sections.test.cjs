'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./surface-paths-and-parallel-sections.json');
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
const unit=v=>mul(v,1/norm(v));
const axis=unit([1,1,1]),u=unit([1,-1,0]),v=cross(axis,u);
const shadow=q=>sub(q,mul(axis,dot(q,axis)));
const normals=[[1,-1,0],[0,-1,1],[-1,0,1],[-1,1,0],[0,1,-1],[1,0,-1]].map(unit);
const squareVertex=(length,j)=>add(mul(u,length/Math.SQRT2*Math.cos((15+90*j)*Math.PI/180)),mul(v,length/Math.SQRT2*Math.sin((15+90*j)*Math.PI/180)));
function rayRange(q,side){
  const start=Math.max(...q.map((x,i)=>(-side/2-x)/axis[i]));
  const end=Math.min(...q.map((x,i)=>(side/2-x)/axis[i]));
  return [start,end];
}
function clippedHex(a,h,k){
  const r=a*Math.sqrt(3)/2,V=[0,0,h];
  const base=[[-a/2,r,0],[a/2,r,0],[a,0,0],[a/2,-r,0],[-a/2,-r,0],[-a,0,0]];
  const edges=base.flatMap((p,i)=>[[p,base[(i+1)%6]],[p,V]]);
  const points=[];
  const f=p=>p[1]/r+p[2]/h-k;
  for(const [p,q] of edges)if(f(p)*f(q)<0)points.push(mix(p,q,f(p)/(f(p)-f(q))));
  const center=mul(points.reduce(add,[0,0,0]),1/points.length);
  const inPlane=unit([0,1,-h/r]);
  points.sort((p,q)=>Math.atan2(dot(sub(p,center),inPlane),p[0]-center[0])-Math.atan2(dot(sub(q,center),inPlane),q[0]-center[0]));
  const surface=points.reduce((s,p,i)=>s+area(center,p,points[(i+1)%points.length]),0);
  return {points,surface};
}
let spiderCases=0,passageRays=0,pyramidCases=0;
for(const a of [.2,.5,1,2,3,6,11]){
  const M=[a/2,0,0],Q=[a,0,a/3],G=[a,a,a],T=[2*a,0,a];let lattice=Infinity;
  for(let i=-5;i<=5;i++)for(let n=-5;n<=5;n++){
    const dist=Math.hypot(i+.5,n);
    if(dist>1.5+1e-9)lattice=Math.min(lattice,dist);
  }
  near(a*lattice,distance(M,T));near(distance(M,Q)+distance(Q,G),distance(M,T));
  near(distance(M,G),1.5*a);assert(a*(.5+Math.SQRT2)>a*lattice);assert(a*(1+Math.sqrt(5)/2)>a*lattice);spiderCases++;
}
const limit=1/Math.cos(Math.PI/12);near(limit,Math.sqrt(6)-Math.sqrt(2));
for(const edge of [.5,1,3])for(const relative of [1,1.001,1.01,1.02,1.034]){
  const corners=[0,1,2,3].map(j=>squareVertex(edge*relative,j));
  for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){
    const q=add(corners[0],add(mul(sub(corners[1],corners[0]),i/8),mul(sub(corners[3],corners[0]),j/8)));
    assert(normals.every(n=>dot(n,q)<edge/Math.SQRT2-1e-8));
    const [lo,hi]=rayRange(q,edge);assert(hi>lo);
    for(const t of [lo,hi])near(Math.max(...add(q,mul(axis,t)).map(Math.abs)),edge/2);
    passageRays++;
  }
}
for(const e of [1.04,1.08])assert([0,1,2,3].some(j=>normals.some(n=>dot(n,squareVertex(e,j))>1/Math.SQRT2)));
for(const a of [.5,1,2,3,7])for(const h of [.5,1.3,3,5,11])for(const k of [.25,.5,.7]){
  const {surface,points}=clippedHex(a,h,k),l=Math.hypot(h,a*Math.sqrt(3)/2);
  assert.equal(points.length,6);
  const low=a*(2-k),middle=2*a*(1-k),high=a*(1-k)/2;
  near(surface,(low+middle)/2*k*l+(middle+high)/2*(1-k)/2*l);
  if(k===.5)near(surface/(a*l/2),25/16);
  pyramidCases++;
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0777','ex-main-0778','ex-main-0779']);
let fields=0;
for(const id of Object.keys(release.cards)){
  const c=available.get(id),m=c.visualization.model,p=m.points;
  viewer.prepare(m);assert.deepEqual(c.source.printedPages,[190]);assert.deepEqual(c.source.pdfPages,[192]);
  let expected;
  if(id.endsWith('777')){
    const shortest=distance(p.M,p.T);
    for(const [crossing,end] of [['P','G'],['Q','G'],['N','H']])near(distance(p.M,p[crossing])+distance(p[crossing],p[end]),shortest);
    equal(mix(p.M,p.T,1/3),p.Q);near(distance(p.Q,p.G),distance(p.Q,p.T));
    assert.equal(c.answer.mode,'manual');assert.match(c.answer.feedback,/целых/u);
    expected=[shortest,distance(p.Q,p.B)/distance(p.B,p.F),distance(p.M,p.G),6/3];
  }else if(id.endsWith('778')){
    const silhouette=m.views.neutral.polygon;
    assert.equal(silhouette.length,6);near(distance(p.O,p.N),1/Math.SQRT2);
    for(const [index,k] of silhouette.entries()){
      equal(shadow(p[k[0]]),p[k]);near(distance(p[k],p.O),Math.sqrt(2/3));
      near(distance(p[k],p[silhouette[(index+1)%6]]),Math.sqrt(2/3));
    }
    for(const [i,k] of [...'IJKL'].entries()){
      equal(p[k],squareVertex(1.02,i));near(distance(p[k],p['IJKL'[(i+1)%4]]),1.02);
      const [lo,hi]=rayRange(p[k],1);equal(p[k+'a'],add(p[k],mul(axis,lo)));equal(p[k+'b'],add(p[k],mul(axis,hi)));
      near(dot(sub(p[k+'x'],p[k]),axis),1.2);
    }
    assert.equal(c.answer.mode,'manual');assert.match(c.answer.feedback,/1,01/u);
    expected=[distance(p.O,p.N),limit,.01];
  }else{
    const {points,surface}=clippedHex(2,3,.5);
    for(const k of 'PQRSUW')assert(points.some(q=>distance(q,p[k])<1e-8));
    const face=area(p.V,p.A,p.B);near(surface/face,25/16);
    near(area(p.V,p.A,p.B),distance(p.A,p.B)*distance(p.V,p.J)/2);
    const answers=c.answer.accepted;assert.equal(engine.classifyAnswer(String(surface/face),answers).status,'correct');
    for(const bad of ['5/4','3/2','25/32'])assert.equal(engine.classifyAnswer(bad,answers).status,'wrong');
    expected=[distance(p.P,p.Q),distance(p.V,p.S)/distance(p.V,p.D),distance(p.Z,p.Y)/distance(p.A,p.B)];
  }
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,10);
console.log('ADVANCED_777_779_OK: ten checked fields, '+spiderCases+' unfolded paths, '+passageRays+' strictly interior shaft generators, '+pyramidCases+' independent plane clips; numeric work stays separate from the two written proofs.');
