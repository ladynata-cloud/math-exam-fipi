'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const receipt = require('./end-of-final-pyramid-review.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const add = (a,b) => a.map((x,i)=>x+b[i]);
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const mul = (a,k) => a.map(x=>x*k);
const dot = (a,b) => a.reduce((v,x,i)=>v+x*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm = a => Math.hypot(...a);
const sq = a => dot(a,a);
const degrees = r => r*180/Math.PI;
const near = (a,b) => assert(Math.abs(a-b)<1e-8,a+' differs from '+b);
function anglePlanes(a,b){
  const cosine=Math.abs(dot(a,b))/(norm(a)*norm(b));
  return degrees(Math.acos(Math.min(1,cosine)));
}
function pyramid(distance,height) {
  const q=distance;
  return {A:[-q,-q,0],B:[q,-q,0],C:[q,q,0],D:[-q,q,0],M:[0,0,height],O:[0,0,0],Q:[0,-q,0],L:[0,q,0]};
}
function geometry(p){
  const square=[p.A,p.B,p.C,p.D];
  const normals=square.map((a,i)=>cross(sub(square[(i+1)%4],a),sub(p.M,a)));
  const ground=cross(sub(p.B,p.A),sub(p.D,p.A));
  const area=normals.reduce((s,n)=>s+norm(n)/2,0);
  const volume=Math.abs(dot(ground,sub(p.M,p.A)))/3;
  const opposite=anglePlanes(normals[0],normals[2]),facet=anglePlanes(ground,normals[0]);
  const halfSum=mul(add(sub(p.B,p.M),sub(p.D,p.M)),.5);
  return {base:norm(ground),area,volume,opposite,facet,scalar:k=>dot(halfSum,sub(k,p.M))};
}

let families=0;
for(const q of [1,2,2*Math.SQRT2,4,7])for(const h of [1,3,4*Math.sqrt(3),8,12]){
  const p=pyramid(q,h),g=geometry(p);
  near(g.area,4*q*Math.hypot(q,h));
  near(g.volume,4*q*q*h/3);
  const interior=degrees(2*Math.atan(q/h));
  near(g.opposite,Math.min(interior,180-interior));
  near(g.facet,degrees(Math.atan(h/q)));
  for(const z of [-h,0,h/2,h,2*h])for(const x of [-q,0,q])near(g.scalar([x,2*x,z]),h*(h-z));
  const center=[0,0,(h*h-2*q*q)/(2*h)];
  for(const a of [p.A,p.B,p.C,p.D])near(norm(sub(a,center)),norm(sub(p.M,center)));
  families++;
}

const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const cards=Object.keys(receipt.cards).map(id=>available.get(id));
assert.deepEqual(receipt.parts['767'],['а','б','в','г','д','е']);
assert.deepEqual(cards.map(c=>c.source.subpart),receipt.parts['767']);
let fields=0;
for(const [i,c] of cards.entries()){
  assert.equal(c.source.exercise,'767');
  assert.deepEqual(c.source.printedPages,[189]); assert.deepEqual(c.source.pdfPages,[191]);
  const m=c.visualization.model,p=m.points;
  viewer.prepare(m);
  let vals,answer;
  if(i<5){
    const g=geometry(p);
    const am=sub(p.M,p.A),ao=sub(p.O,p.A);
    near(norm(am),8);near(dot(am,ao)/(norm(am)*norm(ao)),.5);
    if(i===0){
      vals=[norm(ao),sq(sub(p.M,p.Q)),geometry({...p,M:p.T}).area];
      answer=g.area;near(answer,32*Math.sqrt(7));
    }else if(i===1){
      vals=[g.base,norm(sub(p.M,p.O)),geometry({...p,M:p.T}).volume];
      answer=g.volume;near(answer,128*Math.sqrt(3)/3);
    }else if(i===2){
      const h=norm(sub(p.M,p.O)),q=norm(sub(p.Q,p.O));
      vals=[q*q,q/h,geometry({...p,M:p.T}).opposite];
      answer=Number(g.opposite.toFixed(1));near(answer,44.4);
      assert.equal(engine.classifyAnswer('67,8°',c.answer.accepted).status,'wrong');
      assert.match(c.answer.feedback,/272/u);
    }else if(i===3){
      vals=[norm(sub(p.O,p.Q)),Math.tan(g.facet*Math.PI/180),geometry({...p,M:p.T}).facet];
      answer=Number(g.facet.toFixed(1));near(answer,67.8);
      assert.equal(engine.classifyAnswer('44,4°',c.answer.accepted).status,'wrong');
      assert.match(c.answer.feedback,/272/u);
    }else{
      assert.equal(c.answer.mode,'exact');
      assert.match(c.statement.text,/K — середина ребра AB/u);
      near(norm(sub(p.K,mul(add(p.A,p.B),.5))),0);
      assert.equal(p.K[2],p.O[2]);
      near(g.scalar(p.K),48);
      near(p.P[2],p.M[2]/2);
      near(p.P[0],p.K[0]);near(p.P[1],p.K[1]);
      vals=['O',dot(sub(p.O,p.M),sub(p.K,p.O)),g.scalar(p.P)];
      answer=g.scalar(p.K);
    }
  }else{
    assert.equal(m.planar,true);
    const R=norm(sub(p.M,p.S));near(norm(sub(p.A,p.S)),R);near(norm(sub(p.C,p.S)),R);
    for(const [key,x] of Object.entries(p)){
      if(key.startsWith('u'))near(norm(sub(x,p.S)),R);
      if(key.startsWith('v'))near(norm(sub(x,p.H)),R/2);
    }
    vals=[sq(sub(p.A,p.O)),norm(sub(p.S,p.O)),norm(sub(p.T,p.H))];answer=R;near(answer,8*Math.sqrt(3)/3);
  }
  for(const [j,st] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(vals[j]),st.input.accepted).status,'correct',c.id+' '+st.id);
    for(const bad of wrongStepAnswers(c.id,st))assert.equal(engine.classifyAnswer(bad,st.input.accepted).status,'wrong',c.id+' '+bad);
    fields++;
  }
  if(answer!==undefined)assert.equal(engine.classifyAnswer(String(answer),c.answer.accepted).status,'correct',c.id+' final');
}
assert.equal(fields,18);
console.log('END_OF_FINAL_REVIEW_767_OK: all 24 printed parts of exercises 764–767, six final cards, both interchanged angles, 25 normal-vector models and the given midpoint K and 375 independent transfer checks.');
