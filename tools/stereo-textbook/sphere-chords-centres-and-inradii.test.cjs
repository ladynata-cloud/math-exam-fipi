'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./sphere-chords-centres-and-inradii.json');
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
function checkChords(O,P,basis){
  let total=0;const radius=distance(O,P);
  for(const u of basis){
    const along=dot(sub(O,P),u);assert(Math.abs(along)>1e-8);
    const second=add(P,mul(u,2*along));near(distance(O,second),radius);
    total+=distance(P,second)**2;
  }
  near(total,4*radius**2);
}
function sectionCenter(d,r,angle){
  const H=[d,0,0],P=[0,0,0],normal=[Math.cos(angle),Math.sin(angle),0];
  const M=mul(normal,dot(normal,H));
  near(dot(sub(M,H),M),0);near(distance(M,[d/2,0,0]),d/2);
  return {center:M,cut:d*d*Math.cos(angle)**2<r*r};
}
function checkTriple(O,P,basis){
  const d=distance(O,P),r=d*Math.sqrt(2/3);
  for(const u of basis){const f=add(P,mul(u,dot(sub(O,P),u)));near(distance(O,f),r);near(dot(sub(O,f),u),0);}
  return r;
}
function inradius(points){
  const faces=points.map((_,i)=>points.filter((_,j)=>j!==i));
  const areas=faces.map(f=>area(...f)),sum=areas.reduce((s,x)=>s+x,0),v=volume(...points);
  const I=mul(points.reduce((s,p,i)=>add(s,mul(p,areas[i])),[0,0,0]),1/sum);
  const heights=faces.map((f,i)=>planeDistance(points[i],...f)),rs=faces.map(f=>planeDistance(I,...f));
  for(const r of rs)near(r,3*v/sum);
  near(1/rs[0],heights.reduce((s,h)=>s+1/h,0));
  near(faces.reduce((s,f)=>s+volume(I,...f),0),v);return {I,r:rs[0]};
}
let chordFrames=0,planes=0,tangentTriples=0,tetrahedra=0;
for(const a of [.2,.5,1,2,5])for(const t of [.1,.3,.7,1.1]){
  const U=[Math.cos(t),Math.sin(t),0],V=[-Math.sin(t),Math.cos(t),0],W=[0,0,1],P=[1,-2,3],O=add(P,mul([1,2,2],a));
  checkChords(O,P,[U,V,W]);chordFrames++;
  const center=add(P,mul(add(add(U,V),W),a));near(checkTriple(center,P,[U,V,W]),a*Math.SQRT2);tangentTriples++;
}
for(const R of [1,2,3])for(const d of [1.1*R,1.8*R,4*R])for(let i=0;i<60;i++){
  const {center,cut}=sectionCenter(d,R,i*Math.PI/60);assert.equal(cut,norm(center)<R);planes++;
}
for(const a of [1,2,4])for(const b of [2,3,7])for(const h of [.5,3,9])for(const shift of [-1,0,2]){
  inradius([[0,0,0],[a,0,0],[shift,b,0],[-shift,2,h]]);tetrahedra++;
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0795','ex-main-0796','ex-main-0797','ex-main-0798']);
let fields=0;
for(const id of Object.keys(release.cards)){
  const card=available.get(id),m=card.visualization.model,p=m.points;
  viewer.prepare(m);assert.deepEqual(card.source.printedPages,[192]);assert.deepEqual(card.source.pdfPages,[194]);assert.equal(card.answer.mode,'manual');
  let expected;
  if(id.endsWith('795')){
    const r=m.spheres[0].radius;equal(m.spheres[0].center,p.O);
    for(const tuple of ['ABC','XYC']){
      const rays=[...tuple].map(k=>sub(p[k],p.P));for(const ray of rays)near(distance(p.O,add(p.P,ray)),r);
      for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)near(dot(rays[i],rays[j]),0);
      near(rays.reduce((s,x)=>s+dot(x,x),0),4*r*r);
    }
    for(const [name,mid] of [['A','I'],['B','J'],['C','K']])equal(p[mid],mix(p.P,p[name],.5));
    expected=[distance(p.P,p.A),4*r*r,100];
  }else if(id.endsWith('796')){
    const r=m.spheres[0].radius,d=distance(p.O,p.H);near(norm(sub(p.H,p.J)),d/2);
    near(norm(cross(sub(p.B,p.A),[0,0,1])),0);near(dot(sub(p.M,p.H),p.M),0);
    for(const k of ['T','U']){near(distance(p.O,p[k]),r);near(distance(p.J,p[k]),d/2);}
    for(const k of Object.keys(p).filter(k=>/^n\d+$/.test(k))){assert(distance(p.O,p[k])<r);near(distance(p.J,p[k]),d/2);}
    for(const k of Object.keys(p).filter(k=>/^e\d+$/.test(k))){assert(distance(p.O,p[k])>r);near(distance(p.J,p[k]),d/2);}
    near(planeDistance(p.O,p.A,p.B,p.G),distance(p.O,p.M));assert.match(card.answer.feedback,/конца соответствуют/u);
    expected=[d/2,Math.sqrt(r*r-dot(p.M,p.M)),0];
  }else if(id.endsWith('797')){
    const r=m.spheres[0].radius;equal(m.spheres[0].center,p.O);
    for(const [base,ends] of [['P','ABC'],['Q','DEF']]){
      const axes=[...ends].map(k=>unit(sub(p[k],p[base])));near(checkTriple(p.O,p[base],axes),r);
      axes.forEach((v,i)=>axes.slice(i+1).forEach(w=>near(dot(v,w),0)));
    }
    expected=[distance(p.A,p.O)**2,distance(p.P,p.O)**2/r**2,Math.sqrt(6)];
  }else{
    const original=inradius([p.O,p.A,p.B,p.C]);equal(original.I,p.I);near(original.r,m.spheres[0].radius);
    for(const k of ['F','J','K','L'])near(distance(p.I,p[k]),original.r);
    equal(p.F,projection(p.I,p.A,p.B,p.C));equal(p.G,projection(p.O,p.A,p.B,p.C));
    expected=[volume(p.O,p.A,p.B,p.C),original.r,2*original.r];
  }
  for(const [i,step] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,12);console.log('ADVANCED_795_798_OK: twelve checked fields, '+chordFrames+' orthogonal chord frames, '+planes+' actual section planes, '+tangentTriples+' tangent triples and '+tetrahedra+' independent inspheres.');
