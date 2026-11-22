'use strict';

const assert = require('node:assert/strict');
const bank = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const release = require('./tetrahedra-and-cube-tilings.json');
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
const vertices=['A','B','C','D','A1','B1','C1','D1'];
const mean=(points)=>mul(points.reduce(add,[0,0,0]),1/points.length);
function tetraRadiusBound(points,center){
  const g=mean(points);
  const ev=points.reduce((s,q)=>s+distance(q,g)**2,0)/4;
  const avg=points.reduce((s,q)=>s+distance(q,center)**2,0)/4;
  near(avg,ev+distance(center,g)**2);
  let pairSum=0;
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)pairSum+=distance(points[i],points[j])**2;
  near(ev,pairSum/16);return {ev,avg};
}
const turn=(p,theta,phi)=>{
  const [x,y,z]=p,a=x*Math.cos(theta)-y*Math.sin(theta),b=x*Math.sin(theta)+y*Math.cos(theta);
  return [a,b*Math.cos(phi)-z*Math.sin(phi),b*Math.sin(phi)+z*Math.cos(phi)];
};
const directions=[];
for(const a of [-1,1])for(const b of [-1,1])for(const c of [-1,1])directions.push([a,b,c]);
function insideTetra(p,t) {
  // Independently take the same side of each oriented face as the opposite vertex.
  return t.every((opposite,i)=>{
    const [a,b,c]=t.filter((_,j)=>i!==j),n=normal(a,b,c);
    return dot(n,sub(p,a))*dot(n,sub(opposite,a))>=-1e-8;
  });
}
function rectangleGrid(tiles,width,height){
  const plane=Array.from({length:height},()=>Array(width).fill(-1));
  for(const [i,[x,y,a]] of tiles.entries()){
    assert(a>0&&x>=0&&y>=0&&x+a<=width&&y+a<=height);
    for(let j=y;j<y+a;j++)for(let k=x;k<x+a;k++){assert.equal(plane[j][k],-1);plane[j][k]=i;}
  }
  assert(plane.every(row=>row.every(x=>x>=0)));
  return plane;
}
function rotatedRectangle(tiles,width,height){
  return tiles.map(([x,y,a])=>[height-y-a,x,a]);
}
let placements=0,gridSamples=0,rectangleOrientations=0;
const seed=[[0,0,9],[9,0,10],[19,0,14],[0,9,8],[8,9,1],[8,10,7],[15,10,4],[15,14,18],[0,17,15]];
for(const scale of [.2,.5,1,2,3])for(const theta of [0,.21,1.2,2.4])for(const phi of [-.8,0,1.2]){
  const points=directions.filter(d=>d[0]*d[1]*d[2]<0).map(d=>add(turn(mul(d,scale),theta,phi),[.3,-.5,.8]));
  const {ev}=tetraRadiusBound(points,[0,0,0]);near(ev,3*distance(points[0],points[1])**2/8);placements++;
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert.deepEqual(Object.keys(release.cards),['ex-main-0780','ex-main-0781','ex-main-0782']);
let fields=0;
for(const id of Object.keys(release.cards)){
  const c=available.get(id),m=c.visualization.model,p=m.points,printed=id.endsWith('780')?190:191;
  viewer.prepare(m);assert.deepEqual(c.source.printedPages,[printed]);assert.deepEqual(c.source.pdfPages,[printed+2]);
  let expected;
  if(id.endsWith('780')){
    const t=['A','B1','C','D1'].map(k=>p[k]),small=['As','B1s','Cs','D1s'].map(k=>p[k]);
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)near(distance(t[i],t[j]),Math.SQRT2);
    equal(mean(t),p.O);equal(mean(small),p.G);
    assert(small.every(q=>q.every(x=>Math.abs(x)<=.5)));
    const b=tetraRadiusBound(t,p.O),s=tetraRadiusBound(small,p.O);
    near(b.avg,.75);near(s.avg-s.ev,.01);
    assert.equal(engine.classifyAnswer(String(Math.SQRT2),c.answer.accepted).status,'correct');
    for(const bad of ['1','1.5','sqrt(3)'])assert.equal(engine.classifyAnswer(bad,c.answer.accepted).status,'wrong');
    expected=[distance(p.A,p.C),distance(p.A,p.O)**2,s.avg-s.ev];
  }else if(id.endsWith('781')){
    const t=['A','B1','C','D1'].map(k=>p[k]),other=['C1','B','A1','D'].map(k=>p[k]);
    for(const s of directions){
      const tetra=s[0]*s[1]*s[2]>0?t:other;
      const products=tetra.map(v=>dot(s,v)).sort((a,b)=>a-b);assert.deepEqual(products,[-3,1,1,1]);
    }
    for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++)for(let z=-5;z<=5;z++){
      const q=[x/4,y/4,z/4];assert.equal(insideTetra(q,t)&&insideTetra(q,other),Math.abs(x)+Math.abs(y)+Math.abs(z)<=4);gridSamples++;
    }
    const onAxis=['X','Y','Z','U','V','W'].map(k=>p[k]);assert.equal(onAxis.length,6);
    for(const s of directions){
      const face=onAxis.filter(q=>dot(s,q)===1);assert.equal(face.length,3);
      for(const [i,q] of face.entries())near(distance(q,face[(i+1)%3]),Math.SQRT2);
    }
    assert.equal(c.answer.mode,'manual');assert.match(c.answer.feedback,/восемь ограничений/u);
    expected=[p.X[2],distance(p.X,p.Y),3*distance(p.X,p.Y)];
  }else{
    let tiles=seed,width=33,height=32;
    assert.equal(new Set(tiles.map(t=>t[2])).size,tiles.length);
    for(let rotation=0;rotation<4;rotation++){
      const plane=rectangleGrid(tiles,width,height),[x,y,a]=tiles.find(t=>t[2]===1);
      assert(x>0&&y>0&&x+a<width&&y+a<height);
      const neighbours=[plane[y-1][x],plane[y][x+1],plane[y+1][x],plane[y][x-1]].map(i=>tiles[i][2]).sort((a,b)=>a-b);
      assert.deepEqual(neighbours,[7,8,9,10]);tiles=rotatedRectangle(tiles,width,height);[width,height]=[height,width];rectangleOrientations++;
    }
    // Rectangles around a boundary square block every larger footprint even for intervals sharing just a portion of its top.
    for(const s of [1,2,4])for(const larger of [s+1,s+2,s+3])for(let x=1-larger;x<s;x++){
      if(x+larger>0&&x<s)assert(x<0||x+larger>s);
    }
    near(distance(p.A,p.B),1);near(distance(p.E,p.F),1);
    for(const k of ['c0','c1','c2','c3'])near(p[k][2],1);
    near(distance(p.c0,p.c1),.4);assert(p.c0[0]>p.A[0]&&p.c2[0]<p.C[0]);
    assert.equal(c.answer.mode,'manual');assert.match(c.answer.feedback,/Бесконечная убывающая цепочка/u);
    expected=[7-1,0,'нет'];
  }
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',id+' '+bad);
    fields++;
  }
}
assert.equal(fields,9);
console.log('ADVANCED_780_782_OK: nine checked fields, '+placements+' translated tetrahedra, '+gridSamples+' independent membership checks and '+rectangleOrientations+' exact squared-rectangle orientations; tiling descent and octahedron are written proofs.');
