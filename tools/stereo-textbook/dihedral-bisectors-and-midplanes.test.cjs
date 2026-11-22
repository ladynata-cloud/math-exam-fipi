'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./dihedral-bisectors-and-midplanes.json');
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
function checkBisector(A,B,C,D,E) {
  const ratio=area(A,B,C)/area(A,B,D);
  near(distance(C,E)/distance(E,D),ratio);
  near(volume(A,B,C,E)/volume(A,B,E,D),ratio);
  near(planeDistance(E,A,B,C),planeDistance(E,A,B,D));
  equal(E,mix(C,D,ratio/(ratio+1)));
}
// A scalar affine map is uniquely determined at four noncoplanar vertices.
// Interpolating ±1 at those vertices recovers the middle plane at level zero.
function midplanes(points) {
  const [o,...others]=points,basis=others.map(p=>sub(p,o));
  const reciprocal=[cross(basis[1],basis[2]),cross(basis[2],basis[0]),cross(basis[0],basis[1])];
  const determinant=dot(basis[0],reciprocal[0]);assert(Math.abs(determinant)>1e-8);
  const planes=new Set(),groups=[];
  for(let mask=1;mask<8;mask++){
    const signs=[1,...basis.map((_,j)=>(mask & (1<<j))?-1:1)];
    const n=basis.reduce((total,_,i)=>add(total,mul(reciprocal[i],(signs[i+1]-signs[0])/determinant)),[0,0,0]);
    const c=signs[0]-dot(n,o);
    const d=1/norm(n);
    for(const [i,p] of points.entries()){
      near(dot(n,p)+c,signs[i]);
      near(Math.abs(dot(n,p)+c)/norm(n),d);
    }
    const between=[];
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if(signs[i]!==signs[j]){
      const midpoint=mix(points[i],points[j],.5);
      near(dot(n,midpoint)+c,0);
      between.push(midpoint);
    }
    assert([3,4].includes(between.length));
    for(const point of between)near(planeDistance(point,...between.slice(0,3)),0);
    const key=[...n,c].map(x=>Math.round(x*1e8)).join(',');
    assert(!planes.has(key));planes.add(key);
    groups.push({n,c,sizes:[signs.filter(s=>s===1).length,signs.filter(s=>s===-1).length],between});
  }
  assert.equal(planes.size,7);
  assert.equal(groups.filter(g=>g.sizes[0]===2).length,3);
  return groups;
}
function checkBothAngles(theta,ra,rb,za,zb){
  const A=[ra,0,za],B=[rb*Math.cos(theta),rb*Math.sin(theta),zb],v=sub(B,A),n=[-Math.sin(theta),Math.cos(theta),0];
  const sinA=Math.abs(v[1])/norm(v),sinB=Math.abs(dot(v,n))/norm(v);
  near(sinA,rb*Math.sin(theta)/norm(v));near(sinB,ra*Math.sin(theta)/norm(v));
  assert.equal(Math.abs(Math.asin(Math.min(1,sinA))-Math.asin(Math.min(1,sinB)))<1e-7,ra===rb);
}
let n771=0,n772=0,n773=0;
for(const theta of [.35,Math.PI/2,2.4])for(const c of [2,3,7])for(const d of [1,4,9]){
  const A=[0,0,0],B=[5,0,0],C=[1,c,0],D=[3,d*Math.cos(theta),d*Math.sin(theta)];
  checkBisector(A,B,C,D,mix(C,D,c/(c+d)));n771++;
}
for(const shift of [[0,0,0],[2,-3,1]])for(const stretch of [1,2,4])for(const shear of [-2,0,3]){
  const p=[[0,0,0],[4,0,0],[shear,3,0],[1,2,stretch]].map(v=>add(v,shift));
  n772+=midplanes(p).length;
}
for(const theta of [.3,1,Math.PI/2,2.1,2.8])for(const a of [1,3,5])for(const b of [1,3,5])for(const z of [-2,0,4]){
  checkBothAngles(theta,a,b,1,z);n773++;
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0771','ex-main-0772','ex-main-0773']);
let fields=0;
for(const id of Object.keys(release.cards)){
  const c=available.get(id),m=c.visualization.model,p=m.points;
  viewer.prepare(m);assert.deepEqual(c.source.printedPages,[190]);assert.deepEqual(c.source.pdfPages,[192]);
  let values;
  if(id.endsWith('771')){
    assert.equal(c.answer.mode,'manual');assert.match(c.answer.feedback,/V₁\/V₂/u);
    checkBisector(p.A,p.B,p.C,p.D,p.E);checkBisector(p.A,p.B,p.C,p.Q,p.T);
    equal(p.F,projection(p.E,p.A,p.B,p.C));equal(p.G,projection(p.E,p.A,p.B,p.D));
    values=[area(p.A,p.B,p.C)/area(p.A,p.B,p.D),distance(p.E,p.F)/distance(p.E,p.G),distance(p.C,p.T)/distance(p.C,p.Q)];
  }else if(id.endsWith('772')){
    const groups=midplanes([p.O,p.A,p.B,p.C]);
    for(const set of [['E','F','G'],['E','R','Q','G']])assert(groups.some(({n,c})=>set.every(k=>Math.abs(dot(n,p[k])+c)<1e-8)));
    const reference=[p.T,p.U,p.V];for(const x of [p.O,p.X,p.B,p.C])near(planeDistance(x,...reference),5);
    assert.equal(engine.classifyAnswer('7',c.answer.accepted).status,'correct');
    for(const bad of ['3','4','6','14'])assert.equal(engine.classifyAnswer(bad,c.answer.accepted).status,'wrong');
    values=[groups.filter(g=>g.sizes[0]!==2).length,groups.filter(g=>g.sizes[0]===2).length,planeDistance(p.X,...reference)];
  }else{
    assert.equal(c.answer.mode,'manual');assert.match(c.answer.feedback,/строго возрастает/u);
    equal(p.F,projection(p.B,p.O,p.Z,p.V));equal(p.G,projection(p.A,p.O,p.Z,p.X));equal(p.U,projection(p.T,p.O,p.Z,p.V));
    near(distance(p.A,p.I),distance(p.B,p.J));near(distance(p.B,p.F),distance(p.A,p.G));
    values=['AB',distance(p.B,p.F),distance(p.T,p.U)/distance(p.A,p.G)];
  }
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(values[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,9);
console.log('ADVANCED_771_773_OK: nine checked fields, '+n771+' volume ratios, '+n772+' classified midplanes and '+n773+' two-way angle checks including obtuse dihedrals.');
