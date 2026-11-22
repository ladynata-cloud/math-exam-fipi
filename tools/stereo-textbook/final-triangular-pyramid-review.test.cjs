'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const receipt = require('./final-triangular-pyramid-review.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const sub = (a,b) => a.map((x,i) => x-b[i]);
const add = (a,b) => a.map((x,i) => x+b[i]);
const mul = (a,k) => a.map(x => k*x);
const dot = (a,b) => a.reduce((s,x,i) => s+x*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm = v => Math.hypot(...v);
const squared = v => dot(v,v);
const near = (a,b) => assert(Math.abs(a-b)<1e-8, a+' differs from '+b);
const degrees = rad => rad*180/Math.PI;

function tetrahedron(baseRadius,height) {
  const u=baseRadius*Math.sqrt(3)/2;
  return {A:[0,baseRadius,0], B:[-u,-baseRadius/2,0], C:[u,-baseRadius/2,0],
    D:[0,0,height], M:[0,-baseRadius/2,0], O:[0,0,0]};
}
function geometry(p) {
  const vertices=[p.A,p.B,p.C,p.D];
  const faces=vertices.map((_,i)=>vertices.filter((__,j)=>i!==j));
  const normals=faces.map(([a,b,c])=>cross(sub(b,a),sub(c,a)));
  const areas=normals.map(n=>norm(n)/2);
  const surface=areas.reduce((s,x)=>s+x,0);
  const volume=Math.abs(dot(normals[3],sub(p.D,p.A)))/6;
  // The incenter has barycentric weights equal to the opposite face areas.
  // This constructs the point without using the printed radius or the axial section.
  const center=vertices.reduce((sum,v,i)=>add(sum,mul(v,areas[i]/surface)),[0,0,0]);
  const distances=faces.map(([a],i)=>Math.abs(dot(normals[i],sub(center,a)))/norm(normals[i]));
  distances.forEach(d=>near(d,distances[0]));
  const dm=mul(add(sub(p.B,p.D),sub(p.C,p.D)),.5);
  [0,1,2].forEach(i=>near(dm[i],sub(p.M,p.D)[i]));
  const product=dot(dm,sub(p.A,p.M));
  const ad=sub(p.D,p.A);
  const edge=degrees(Math.asin(Math.abs(dot(ad,normals[3]))/(norm(ad)*norm(normals[3]))));
  const facet=degrees(Math.acos(Math.abs(dot(normals[3],normals[0]))/(norm(normals[3])*norm(normals[0]))));
  return {base:areas[3],surface,volume,center,distances,radius:distances[0],edge,facet,product};
}

let families=0;
for(const baseRadius of [.75,2,4,6,8]) for(const h of [.8,2,3,4,9]) {
  const p=tetrahedron(baseRadius,h), g=geometry(p);
  const side=baseRadius*Math.sqrt(3), apothem=Math.hypot(h,baseRadius/2);
  near(g.surface,g.base+1.5*side*apothem);
  near(g.volume,g.base*h/3);
  near(g.radius,3*g.volume/g.surface);
  near(g.radius,baseRadius*h/(baseRadius+2*apothem));
  near(g.center[0],0);near(g.center[1],0);near(g.center[2],g.radius);
  near(g.product,-3*baseRadius*baseRadius/4);
  near(g.edge,degrees(Math.atan2(h,baseRadius)));
  near(g.facet,degrees(Math.atan2(h,baseRadius/2)));
  families++;
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const cards=Object.keys(receipt.cards).map(id=>available.get(id));
assert.deepEqual(receipt.parts['766'],['а','б','в','г','д','е']);
assert.deepEqual(cards.map(c=>c.source.subpart),receipt.parts['766']);
const original=geometry(tetrahedron(4,3));
let fieldsChecked=0;
for(const [i,c] of cards.entries()){
  assert.equal(c.source.exercise,'766');
  assert.deepEqual(c.source.printedPages,[189]);assert.deepEqual(c.source.pdfPages,[191]);
  const m=c.visualization.model,p=m.points;
  viewer.prepare(m);
  let vals,answer;
  if(i<5){
    const g=geometry(p);
    near(norm(sub(p.D,p.A)),5);near(norm(sub(p.D,p.O)),3);
    if(i===0){
      vals=[squared(sub(p.A,p.O)),squared(sub(p.D,p.M)),squared(sub(p.T,p.M))];
      answer=g.surface;near(answer,6*Math.sqrt(3)*(2+Math.sqrt(13)));
    }else if(i===1){
      vals=[norm(sub(p.A,p.M)),g.base,geometry({...p,D:p.T}).volume];
      answer=g.volume;near(answer,12*Math.sqrt(3));
    }else if(i===2){
      vals=[norm(sub(p.O,p.A)),Math.sin(g.edge*Math.PI/180),geometry({...p,D:p.T}).edge];
      answer=Number(g.edge.toFixed(1));near(answer,36.9);
    }else if(i===3){
      vals=[norm(sub(p.O,p.M)),Math.tan(g.facet*Math.PI/180),geometry({...p,D:p.T}).facet];
      answer=Number(g.facet.toFixed(1));near(answer,56.3);
    }else{
      const d=sub(p.M,p.D),ma=sub(p.A,p.M);
      const other=dot(sub(p.M2,p.D),sub(p.A2,p.M2));
      vals=[norm(ma),dot(d,ma)/norm(ma),other];answer=g.product;
      near(answer,-12);near(dot(d,sub(p.M,p.A)),12);
      assert.equal(engine.classifyAnswer('12',c.answer.accepted).status,'wrong');
      assert.match(c.answer.feedback,/272/u);
    }
  }else{
    assert.equal(m.planar,true);
    const r=norm(sub(p.S,p.O));
    const side=sub(p.D,p.M),sf=sub(p.F,p.S);
    near(dot(side,sf),0);
    near(norm(sf),r);near(norm(cross(side,sub(p.F,p.M))),0);
    near(r,original.radius);near(r,6/(2+Math.sqrt(13)));
    for(const [id,v] of Object.entries(p)){
      if(id.startsWith('u'))near(norm(sub(v,p.S)),r);
      if(id.startsWith('v'))near(norm(sub(v,p.H)),r/2);
    }
    vals=[original.base,r*original.surface/original.volume,r/norm(sub(p.H,p.O))];
    answer=original.radius;
    const printed=12-6*Math.sqrt(3);
    assert(Math.abs((6-2*printed)/Math.sqrt(13)-printed)>.5);
    assert.equal(engine.classifyAnswer('12-6*sqrt(3)',c.answer.accepted).status,'wrong');
    assert.equal(engine.classifyAnswer('2*(sqrt(13)-2)/3',c.answer.accepted).status,'correct');
    assert.match(c.answer.feedback,/272/u);
  }
  for(const [j,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(vals[j]),step.input.accepted).status,'correct',c.id+' '+step.id);
    for(const bad of wrongStepAnswers(c.id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong',c.id+' '+bad);
    fieldsChecked++;
  }
  assert.equal(engine.classifyAnswer(String(answer),c.answer.accepted).status,'correct',c.id+' final');
}
assert.equal(fieldsChecked,18);
console.log('FINAL_TRIANGULAR_PYRAMID_766_OK: all six printed parts, 18 steps, '+families+' tetrahedra, four independently calculated face distances and both printed-key discrepancies.');
