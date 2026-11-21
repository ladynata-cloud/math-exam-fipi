'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const course = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./pyramid-projections.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const dot = (u,v) => u.reduce((sum,x,i)=>sum+x*v[i],0);
const norm = a => Math.hypot(...a);
const cross = (u,v) => [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
const dist = (a,b) => norm(sub(a,b));
const area = (a,b,c) => norm(cross(sub(b,a),sub(c,a)))/2;
const tetra = (a,b,c,t) => Math.abs(dot(cross(sub(b,a),sub(c,a)),sub(t,a)))/6;
const angle = (a,o,b) => Math.acos(dot(sub(a,o),sub(b,o))/(dist(a,o)*dist(b,o)));
const pointToEdge = (p,a,b) => norm(cross(sub(p,a),sub(b,a)))/dist(a,b);
const pointToPlane = (p,a,b,c) => {
  const normal=cross(sub(b,a),sub(c,a));
  return Math.abs(dot(sub(p,a),normal))/norm(normal);
};
function near(actual,expected) {
  assert(Math.abs(actual-expected)<1e-8*Math.max(1,Math.abs(expected)),actual+' differs from '+expected);
}
function triangles(base) {
  return base.slice(1,-1).map((b,i)=>[base[0],b,base[i+2]]);
}
const {available,issues}=engine.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(issues,[]);
const steps = {
  '0482':[6,128,256,32], '0483':[12,157,6*Math.sqrt(471),6*Math.sqrt(498),12],
  '0484':[60,169/24,845/6,40], '0485':[10,15/4,30,130], '0486':[5,18,48,384],
  '0487':[1.5,18,9,64/3], '0488-a':[8,4,32,256], '0488-b':[8,3,48,96],
  '0488-c':[6,5,10,32], '0489':[210,20,1400,350]
};
const answers={'0484':845*Math.sqrt(3)/6,'0487':9,'0488-b':48,'0489':1400*Math.sqrt(3)};
assert.deepEqual(Object.keys(manifest.cards).sort(),Object.keys(steps).map(n=>'ex-main-'+n).sort());
assert.deepEqual(manifest.parts,{'482':[null],'483':[null],'484':[null],'485':[null],'486':[null],'487':[null],'488':['а','б','в'],'489':[null]});
let checked=0;
for (const [suffix,expected] of Object.entries(steps)) {
  const c=available.get('ex-main-'+suffix), model=c.visualization.model, p=model.points;
  assert.equal(c.source.bookId,'atanasyan-2024-10-11');
  assert.deepEqual(c.source.printedPages,[132]);assert.deepEqual(c.source.pdfPages,[134]);
  viewer.prepare(model);
  assert.equal(c.steps.length,expected.length);assert.equal(c.help.length,2);
  c.steps.forEach((step,i)=>{
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',suffix+' '+step.id);
    for (const wrong of wrongStepAnswers(c.id,step)) assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
    checked++;
  });
  if (Object.hasOwn(answers,suffix)) {
    assert.equal(c.answer.mode,'exact');
    assert.equal(engine.classifyAnswer(String(answers[suffix]),c.answer.accepted).status,'correct');
    assert.equal(engine.classifyAnswer('0',c.answer.accepted).status,'wrong');
  } else assert.equal(c.answer.mode,'manual');
  for(const view of Object.values(model.views))
    for(const [a,o,b] of view.rightAngles||[]) near(dot(sub(p[a],p[o]),sub(p[b],p[o])),0);
  const base=model.faces[0].map(key=>p[key]), apex=p.T||p.S||p.D;
  const s=triangles(base).reduce((total,t)=>total+area(...t),0);
  const v=triangles(base).reduce((total,t)=>total+tetra(...t,apex),0);
  const side=base.map((a,i)=>area(apex,a,base[(i+1)%base.length])).reduce((a,b)=>a+b,0);
  switch (suffix) {
    case '0482': {
      const e=dist(p.A,p.T),phi=angle(p.T,p.A,p.O);
      near(e,10);near(s,128);near(v,256);near(v,2*e**3*Math.cos(phi)**2*Math.sin(phi)/3);
      break;
    }
    case '0483':
      near(dist(p.O,p.M),3);near(dist(p.O,p.A),2*Math.sqrt(3));near(dist(p.A,p.T),13);
      near(s,18*Math.sqrt(3));near(v,6*Math.sqrt(471));near(side,6*Math.sqrt(498));
      break;
    case '0484':
      near(dist(p.A,p.B),13);near(dist(p.C,p.B),13);near(dist(p.A,p.C),10);near(s,60);
      for(const a of base){near(angle(a,p.T,p.O),Math.PI/6);near(dist(a,p.O),169/24);}
      near(v,845*Math.sqrt(3)/6);
      break;
    case '0485':
    case '0488-a': {
      const a=dist(p.A,p.B),b=dist(p.A,p.C),c=dist(p.B,p.C),theta=angle(apex,p.A,p.O);
      near(dot(sub(p.A,p.B),sub(p.A,p.C)),0);
      for(const x of base){near(dist(x,p.O),c/2);near(angle(apex,x,p.O),theta);}
      near(v,a*b*c*Math.tan(theta)/12);
      const phi=angle(p.A,p.B,p.C);
      near(v,c**3*Math.sin(2*phi)*Math.tan(theta)/24);
      near(v,suffix==='0485'?30:32);
      break;
    }
    case '0486': {
      near(s,36);near(side,60);near(v,48);
      let pieces=0;
      for(const face of model.faces.map(names=>names.map(name=>p[name]))) {
        near(pointToPlane(p.I,...face.slice(0,3)),1.5);
        for(const t of triangles(face))pieces+=tetra(...t,p.I);
      }
      for(let i=0;i<32;i++)near(dist(p.I,p['_q'+i]),1.5);
      near(pointToPlane(p.K,p.T,p.A,p.B),0);near(dist(p.K,p.I),1.5);
      near(pieces,v);near(v,(s+side)*1.5/3);
      break;
    }
    case '0487':
    case '0488-b':
      for(const [i,a] of base.entries()) {
        const b=base[(i+1)%base.length],r=pointToEdge(p.O,a,b);
        near(r,dist(apex,p.O));
        if(suffix==='0487')near(dist(a,b),6);
      }
      near(angle(apex,p.M,p.O),Math.PI/4);near(s,suffix==='0487'?18:48);near(v,suffix==='0487'?9:48);
      break;
    case '0488-c':
      for(const [a,b] of [[p.A,p.B],[p.A,p.C],[p.B,p.C]])near(dot(sub(a,apex),sub(b,apex)),0);
      near(v,dist(p.A,apex)*dist(p.B,apex)*dist(p.C,apex)/6);near(v,10);
      break;
    case '0489': {
      near(dist(p.A,p.B),20);near(dist(p.B,p.C),21);near(dist(p.A,p.C),29);near(s,210);
      const baseNormal=cross(sub(p.B,p.A),sub(p.C,p.A));
      for(const x of [p.B,p.C])near(dot(baseNormal,cross(sub(p.D,p.A),sub(x,p.A))),0);
      near(dot(sub(p.C,p.B),sub(p.D,p.B)),0);near(angle(p.D,p.B,p.A),Math.PI/3);
      near(v,1400*Math.sqrt(3));break;
    }
  }
}
// Independently vary both legs and the tilt in the two right-base identities.
let variants=0;
for(const a of [2,5,8])for(const b of [3,6,11])for(const t of [0.25,0.75,2]) {
  const A=[0,0,0],B=[a,0,0],C=[0,b,0],c=dist(B,C),S=[a/2,b/2,c*t/2];
  const v=tetra(A,B,C,S),phi=angle(A,B,C);
  near(v,a*b*c*t/12);near(v,c**3*Math.sin(2*phi)*t/24);variants+=2;
}
assert.equal(checked,41);
console.log('ATANASYAN_PYRAMID_PROJECTIONS_OK: '+checked+' exact fields, '+variants+' varying coordinate identities, all insphere face distances and both hexagon quantities');
