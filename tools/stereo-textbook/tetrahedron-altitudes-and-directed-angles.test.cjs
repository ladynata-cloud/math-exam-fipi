'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./tetrahedron-altitudes-and-directed-angles.json');
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
const cosine=(a,b)=>dot(a,b)/(norm(a)*norm(b));
const degrees=(a,b)=>Math.acos(Math.max(-1,Math.min(1,cosine(a,b))))*180/Math.PI;
function solveAltitude(a,b,c){
  const k=dot(a,b);near(dot(a,c),k);near(dot(b,c),k);
  const det=dot(a,cross(b,c));assert(Math.abs(det)>1e-9);
  const h=mul(add(add(cross(b,c),cross(c,a)),cross(a,b)),k/det);
  const q=[[0,0,0],a,b,c];
  for(const [i,p] of q.entries()){
    const f=q.filter((_,j)=>i!==j);for(const side of [sub(f[1],f[0]),sub(f[2],f[0])])near(dot(sub(h,p),side),0);
  }return h;
}
const unit=v=>mul(v,1/norm(v));
const projectedAltitude=(a,b,c)=>{
  const O=[0,0,0],A=[a,0,0],B=[0,b,0],C=[0,0,c],H=projection(O,A,B,C);
  near(dot(sub(H,A),sub(C,B)),0);near(dot(sub(H,B),sub(C,A)),0);near(dot(sub(H,C),sub(B,A)),0);
  const n=[1/a,1/b,1/c];equal(H,mul(n,1/dot(n,n)));return H;
};
let rayPairs=0,orthic=0,directions=0,orthocenters=0;
for(const r of [.3,1,2,5])for(const t of [1,3,5]){
  const q=Math.SQRT1_2,A=[0,0,0],D=[r,0,0],B=[r*q,r*q,0],E=[0,0,t];
  for(const sign of [-1,1]){
    const C=[r*q,0,sign*r*q];
    near(degrees(B,C),60);near(degrees(B,D),45);near(degrees(D,C),45);near(degrees(C,E),sign>0?45:135);
    assert.equal(dot(A,A),0);
  }rayPairs++;
}
for(const s of [2,3,5])for(const t of [.4,1,2])for(const z of [1,2,4]){
  const a=[s,0,0],b=[1,2*t,0],c=[1,(s-1)/(2*t),z];
  solveAltitude(a,b,c);orthic++;
}
for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
  const d=[x,y,z],normal=[1,1,1],axes=[[1,0,0],[0,1,0],[0,0,1]];
  const signed=axes.map(u=>cosine(d,u));
  signed.forEach(s=>near(Math.abs(s),1/Math.sqrt(3)));
  assert.equal(x===y&&y===z,norm(cross(d,normal))===0);
  assert(dot(d,normal)!==0);
  const onPlane=mul(d,1/dot(normal,d));near(dot(onPlane,normal),1);
  directions++;
}
for(const a of [.5,1,2,4])for(const b of [1,2,3,7])for(const c of [1,3,6,9]){projectedAltitude(a,b,c);orthocenters++;}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0791','ex-main-0792','ex-main-0793','ex-main-0794']);
let fields=0;
for(const id of Object.keys(release.cards)){
  const card=available.get(id),m=card.visualization.model,p=m.points;
  viewer.prepare(m);assert.deepEqual(card.source.printedPages,[191]);assert.deepEqual(card.source.pdfPages,[193]);
  let expected;
  if(id.endsWith('791')){
    near(degrees(p.B,p.C),60);near(degrees(p.B,p.T),60);near(degrees(p.D,p.C),45);near(degrees(p.D,p.T),45);
    assert.equal(engine.classifyAnswer('45;135',card.answer.accepted).status,'correct');
    for(const v of ['45;45','135;45','60;120'])assert.equal(engine.classifyAnswer(v,card.answer.accepted).status,'wrong');
    expected=[p.C[0],p.C[1],degrees(p.T,p.E)];
  }else if(id.endsWith('792')){
    assert.equal(card.answer.mode,'manual');assert.match(card.answer.feedback,/линейно независимы/u);
    equal(p.H,solveAltitude(p.A,p.B,p.C));
    for(const [name,k,face] of [['F','A','OBC'],['G','O','ABC'],['K','B','OAC'],['L','C','OAB']]){
      equal(p[name],projection(p[k],...[...face].map(n=>p[n])));
      near(norm(cross(sub(p.H,p[k]),sub(p[name],p[k]))),0);
    }
    expected=['OC',dot(p.A,p.B),dot(p.A,sub(p.T,p.B))];
  }else if(id.endsWith('793')){
    assert.equal(card.answer.mode,'manual');assert.match(card.answer.feedback,/контр|уточнения/u);
    const d=sub(p.T,p.O),n=normal(p.A,p.B,p.C);
    near(dot(p.T,[1,1,1]),1);near(dot(p.N,[1,1,1]),1);assert(norm(cross(d,n))>0);
    near(norm(cross(d,sub(p.E,p.N))),0);assert([p.A,p.B,p.C].every(a=>Math.abs(Math.abs(cosine(d,a))-1/Math.sqrt(3))<1e-8));
    assert(norm(cross(p.N,n))<1e-8);
    expected=[Math.abs(cosine(d,p.A)),p.T[0],0];
  }else{
    assert.equal(card.answer.mode,'manual');assert.match(card.answer.feedback,/ортоцентр/u);
    equal(p.H,projectedAltitude(2,3,6));equal(p.G,projectedAltitude(2,3,3));
    near(norm(cross(sub(p.H,p.A),sub(p.J,p.A))),0);near(norm(cross(sub(p.H,p.B),sub(p.K,p.B))),0);
    expected=['BC',p.H[2],norm(p.G)];
  }
  for(const [i,step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,12);
console.log('ADVANCED_791_794_OK: twelve checked fields, '+rayPairs+' reflected ray pairs, '+orthic+' orthocentric tetrahedra, '+directions+' independent sign patterns and '+orthocenters+' projected orthocenters.');
