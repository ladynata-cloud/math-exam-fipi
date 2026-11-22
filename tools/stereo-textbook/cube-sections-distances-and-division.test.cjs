'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./cube-sections-distances-and-division.json');
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
const cubeNames='A B C D E F G H'.split(' ');
function sectionVertices(a,components,offset){
  const corners=[];
  for(const x of [0,a])for(const y of [0,a])for(const z of [0,a])corners.push([x,y,z]);
  const points=[];
  function addUnique(p){if(points.every(q=>distance(q,p)>1e-8))points.push(p);}
  for(let i=0;i<corners.length;i++)for(let j=i+1;j<corners.length;j++){
    const p=corners[i],q=corners[j];
    if(p.filter((v,k)=>v!==q[k]).length!==1)continue;
    const u=dot(p,components)-offset,v=dot(q,components)-offset;
    if(Math.abs(u)<1e-9)addUnique(p);
    if(Math.abs(v)<1e-9)addUnique(q);
    if(u*v<0)addUnique(mix(p,q,u/(u-v)));
  }
  return points;
}
function testRegular(actual,expected,order){
  assert.equal(actual.length,order.length);
  for(const p of order)assert(actual.some(q=>distance(p,q)<1e-7));
  const center=mul(order.reduce(add,[0,0,0]),1/order.length);
  const radius=distance(order[0],center);
  for(const [i,p] of order.entries()){
    near(distance(p,order[(i+1)%order.length]),expected);
    near(distance(center,p),radius);
    const e=sub(p,center),v=sub(order[(i+1)%order.length],center);
    near(dot(e,v)/radius**2,Math.cos(2*Math.PI/order.length));
  }
}
const axisDistance=(v,u)=>norm(cross(v,u))/norm(u);
function squaredDistanceSum(points,center,u){
  return points.reduce((s,p)=>s+axisDistance(sub(p,center),u)**2,0);
}
const paths=['ABCG','ABFG','ADCG','ADHG','AEFG','AEHG'];
function permutations3(f){
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(i!==j)f(i,j,3-i-j);
}
const values=(p,letters)=>[...letters].map(k=>p[k]);
function distances(t){
  const sides=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)sides.push(distance(t[i],t[j]));
  return sides.sort((a,b)=>a-b);
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0774','ex-main-0775','ex-main-0776']);
let variableSections=0,lines=0,interiorSamples=0,fields=0;
for(const id of Object.keys(release.cards)){
  const c=available.get(id),m=c.visualization.model,p=m.points;
  viewer.prepare(m);assert.deepEqual(c.source.printedPages,[190]);assert.deepEqual(c.source.pdfPages,[192]);assert.equal(c.answer.mode,'manual');
  let expected;
  if(id.endsWith('774')){
    for(const [normal,k,letters] of [[[1,1,1],1,'IJK'],[[0,0,1],1.5,'LMNP'],[[1,1,1],3,'RSTUVW']]){
      testRegular(sectionVertices(2,normal,k),letters.length===4?2:Math.SQRT2,values(p,letters));
    }
    near(norm(cross(sub(p.T,p.S),sub(p.W,p.V))),0);
    for(const a of [1,2,4.5])for(const k of [.25,.6,.85]){
      const triangle=sectionVertices(a,[1,1,1],a*k),square=sectionVertices(a,[0,0,1],a*k);
      assert.equal(triangle.length,3);assert.equal(square.length,4);testRegular(triangle,a*k*Math.SQRT2,triangle);variableSections+=2;
    }
    // Five distinct sides determine five faces. At least two of these faces are opposite.
    for(let omit=0;omit<6;omit++){
      const used=[0,1,2,3,4,5].filter(x=>x!==omit);
      assert([[0,1],[2,3],[4,5]].some(pair=>pair.every(x=>used.includes(x))));
    }
    assert.match(c.answer.feedback,/параллельных сторон/u);
    expected=[distance(p.I,p.J),p.R.reduce((a,b)=>a+b),m.faces.length,distance(p.I,p.J)/2];
  }else if(id.endsWith('775')){
    const corners=cubeNames.map(n=>p[n]);
    for(const [a,b] of [['X','Y'],['A','G'],['T','U']])near(squaredDistanceSum(corners,p.O,sub(p[b],p[a])),16);
    for(const [a,f,start,end] of [['A','I','X','Y'],['G','J','X','Y'],['B','K','A','G'],['C','L','A','G'],['A','T','T','U'],['G','U','T','U']]){
      const u=sub(p[end],p[start]);near(dot(sub(p[a],p[f]),u),0);near(axisDistance(sub(p[f],p[start]),u),0);
    }
    for(const a of [.5,2,3,7])for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)for(const k of [-1,0,2]){
      if(!i&&!j&&!k)continue;
      const centered=corners.map(v=>mul(sub(v,p.O),a/2));
      near(squaredDistanceSum(centered,[0,0,0],[i,j,k]),4*a*a);lines++;
    }
    assert.match(c.answer.feedback,/единичный/u);
    expected=[distance(p.A,p.O)**2,corners.reduce((s,q)=>s+(q[0]-p.O[0])*(q[1]-p.O[1]),0),36];
  }else{
    const tuples=paths.map(path=>values(p,path));
    const side=distance(p.A,p.B),reference=distances(tuples[0]);
    const orders=new Set();
    for(const tetra of tuples){
      near(volume(...tetra),side**3/6);
      for(const [i,x] of distances(tetra).entries())near(x,reference[i]);
      const delta=[0,1,2].map(i=>sub(tetra[i+1],tetra[i]));
      const order=delta.map(v=>v.findIndex(x=>x>1e-7));
      assert.equal(new Set(order).size,3);orders.add(order.join(''));
      for(const v of delta)near(norm(v),side);
    }
    assert.equal(orders.size,6);
    // Strict coordinate orders classify interiors. Boundary equality may occur in more than one piece.
    for(let x=1;x<8;x++)for(let y=1;y<8;y++)for(let z=1;z<8;z++){
      const q=[x/4,y/4,z/4],owners=[];
      permutations3((i,j,k)=>{if(q[i]>=q[j] && q[j]>=q[k])owners.push([i,j,k].join(''));});
      assert(owners.length && owners.every(o=>orders.has(o)));
      if(new Set(q).size===3)assert.equal(owners.length,1);
      interiorSamples++;
    }
    assert.match(c.answer.feedback,/Перестановки координат/u);
    expected=[m.faces.filter(f=>!f.includes('A')).length,tuples.length,volume(...tuples[0])*1.5**3];
  }
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,10);
console.log('ADVANCED_774_776_OK: ten checked fields, '+variableSections+' variable sections, '+lines+' lines through the cube center and '+interiorSamples+' partition samples; all three constructions or proofs remain human-reviewed.');
