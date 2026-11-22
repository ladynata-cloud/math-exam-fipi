'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./final-square-pyramid-review.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');

const add = (a,b) => a.map((x,i) => x+b[i]);
const sub = (a,b) => a.map((x,i) => x-b[i]);
const scale = (a,k) => a.map(x => k*x);
const dot = (a,b) => a.reduce((total,x,i) => total+x*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm = v => Math.hypot(...v);
const sq = v => dot(v,v);
const deg = rad => rad * 180 / Math.PI;
const near = (a,b) => assert(Math.abs(a-b)<1e-8,a+' differs from '+b);
const triangle = (a,b,c) => norm(cross(sub(b,a),sub(c,a)))/2;
const angle = (a,b) => deg(Math.acos(dot(a,b)/(norm(a)*norm(b))));

function square(side,height) {
  const half=side/2;
  return {A:[-half,-half,0],B:[half,-half,0],C:[half,half,0],D:[-half,half,0],
    O:[0,0,0],K:[0,-half,0],M:[0,0,height]};
}
function measures(p) {
  const ab=sub(p.B,p.A), ad=sub(p.D,p.A), am=sub(p.M,p.A);
  const baseCross=cross(ab,ad), sideNormal=cross(ab,am);
  const area=triangle(p.A,p.B,p.M)+triangle(p.B,p.C,p.M)+triangle(p.C,p.D,p.M)+triangle(p.D,p.A,p.M);
  const volume=Math.abs(dot(cross(ab,sub(p.C,p.A)),am))/6+Math.abs(dot(cross(sub(p.C,p.A),ad),am))/6;
  const facet=deg(Math.acos(Math.abs(dot(sideNormal,baseCross))/(norm(sideNormal)*norm(baseCross))));
  const edge=deg(Math.asin(Math.abs(dot(am,baseCross))/(norm(am)*norm(baseCross))));
  return {area,volume,facet,edge,dotProduct:dot(add(ab,ad),am),baseArea:norm(baseCross)};
}

let families=0;
for (const side of [2,4,6*Math.SQRT2,10,13]) for(const h of [.4,2,6*Math.sqrt(3),12,20]) {
  const p=square(side,h),m=measures(p),radiusBase=norm(p.A);
  near(m.area,2*side*Math.hypot(h,side/2));
  near(m.volume,side*side*h/3);
  near(m.facet,deg(Math.atan2(h,side/2)));
  near(m.edge,deg(Math.atan2(h,radiusBase)));
  near(m.dotProduct,side*side);
  const center=[0,0,(h*h-radiusBase*radiusBase)/(2*h)],R=norm(sub(center,p.M));
  for(const letter of ['A','B','C','D'])near(norm(sub(center,p[letter])),R);
  near(R,(h*h+radiusBase*radiusBase)/(2*h));
  families++;
}

const {issues,available}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(manifest.parts['765'],['а','б','в','г','д','е']);
const cards=Object.keys(manifest.cards).map(id=>available.get(id));
assert.deepEqual(cards.map(c=>c.source.subpart),manifest.parts['765']);
let count=0;
for(const [part,c] of cards.entries()) {
  assert.equal(c.source.exercise,'765');
  assert.deepEqual(c.source.printedPages,[189]); assert.deepEqual(c.source.pdfPages,[191]);
  const model=c.visualization.model, p=model.points;
  viewer.prepare(model);
  let fields, final;
  if(part<5){
    const m=measures(p);
    for(const letter of ['A','B','C','D'])near(norm(sub(p.M,p[letter])),12);
    near(sq(sub(p.B,p.A)),72);
    if(part===0){
      const changed=measures({...p,M:p.T});
      fields=[sq(sub(p.A,p.K)),sq(sub(p.M,p.K)),changed.area];
      final=m.area;near(final,72*Math.sqrt(7));
    }else if(part===1){
      fields=[m.baseArea,sq(sub(p.M,p.O)),measures({...p,M:p.T}).volume];
      final=m.volume;near(final,144*Math.sqrt(3));
    }else if(part===2){
      fields=[sq(sub(p.O,p.K)),Math.tan(m.facet*Math.PI/180),angle(sub(p.O,p.K),sub(p.T,p.K))];
      final=Number(m.facet.toFixed(1));near(final,67.8);
    }else if(part===3){
      fields=[norm(sub(p.O,p.A)),Math.cos(m.edge*Math.PI/180),angle(sub(p.O,p.A),sub(p.T,p.A))];
      final=m.edge;near(final,60);
    }else{
      const ac=sub(p.C,p.A),om=sub(p.M,p.O);
      fields=[norm(ac),dot(ac,om),measures({...p,M:p.T}).dotProduct];
      final=m.dotProduct;near(final,72);
    }
  }else{
    assert.equal(model.planar,true);
    const rsq=sq(sub(p.A,p.S));
    for(const name of ['C','M'])near(sq(sub(p[name],p.S)),rsq);
    for(const [name,pt] of Object.entries(p)){
      if(name.startsWith('u'))near(sq(sub(pt,p.S)),rsq);
      if(name.startsWith('v'))near(sq(sub(pt,p.H)),rsq/4);
    }
    near(norm(sub(p.A,p.C)),12);
    near(norm(sub(p.M,p.O)),6*Math.sqrt(3));
    fields=[sq(sub(p.A,p.O)),rsq,rsq/sq(sub(p.P,p.H))];
    final=4*Math.PI*rsq;near(final,192*Math.PI);
    assert.equal(engine.classifyAnswer('48*pi',c.answer.accepted).status,'wrong');
  }
  c.steps.forEach((st,j)=>{
    assert.equal(engine.classifyAnswer(String(fields[j]),st.input.accepted).status,'correct',c.id+' '+st.id);
    for(const bad of wrongStepAnswers(c.id,st))assert.equal(engine.classifyAnswer(bad,st.input.accepted).status,'wrong',c.id+' '+bad);
    count++;
  });
  assert.equal(engine.classifyAnswer(String(final),c.answer.accepted).status,'correct',c.id+' final');
}
assert.equal(count,18);
console.log('FINAL_PYRAMID_765_OK: six printed parts, 18 steps, '+families+' independently reconstructed pyramids and both exact circumcircles.');
