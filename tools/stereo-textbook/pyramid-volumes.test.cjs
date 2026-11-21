'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./pyramid-volumes.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');

const difference = (a,b) => a.map((x,i) => x-b[i]);
const dot = (a,b) => a.reduce((sum,x,i) => sum+x*b[i], 0);
const cross = (u,v) => [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
const dist = (a,b) => Math.hypot(...difference(a,b));
const vectorLength = a => Math.hypot(...a);
const rad = degrees => degrees*Math.PI/180;
const angle = (a,o,b) => Math.acos(dot(difference(a,o),difference(b,o))/(dist(a,o)*dist(b,o)));
const midpoint = (a,b) => a.map((x,i) => (x+b[i])/2);
function near(actual, expected) {
  assert(Math.abs(actual-expected) < 1e-8*Math.max(1,Math.abs(expected)), actual + ' differs from ' + expected);
}
// Sum independent tetrahedra obtained by triangulating the actual base polygon.
function volume(base,t) {
  const a = base[0];
  return base.slice(1,-1).reduce((sum,b,i) =>
    sum + Math.abs(dot(difference(t,a),cross(difference(b,a),difference(base[i+2],a))))/6, 0);
}
const triangular = {
  edgePlane:(l,phi) => Math.sqrt(3)/4*l**3*Math.sin(phi)*Math.cos(phi)**2,
  edgeBaseSide:(l,alpha) => l**3*Math.cos(alpha)**2*Math.sqrt(3-4*Math.cos(alpha)**2)/3,
  faceApex:(l,beta) => l**3*Math.sin(beta/2)**2*Math.sqrt(3-4*Math.sin(beta/2)**2)/3,
  baseAndApex:(a,phi) => a**3*Math.sqrt(3-4*Math.sin(phi/2)**2)/(24*Math.sin(phi/2))
};
const square = {
  dihedral:(h,beta) => 4*h**3/(3*Math.tan(beta)**2),
  faceApex:(a,alpha) => a**3*Math.sqrt(Math.cos(alpha))/(6*Math.sin(alpha/2))
};

const {available,issues} = engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const expectedParts = {477:['а','б'],478:[null],479:['а','б','в'],480:[null],481:['а','б']};
assert.deepEqual(manifest.parts,expectedParts);
const expectedSteps = {
  '0477-a':[9,2,6,16], '0477-b':[6.75,67.5,220,2700], '0478':[169,169/4,169,27],
  '0479-a':[8,108,72,9], '0479-b':[6,12,24,9/4], '0479-c':[30,6,24,9],
  '0480':[6,12,18,9], '0481-a':[6,12,288,12], '0481-b':[6,18,18,32/3]
};
const exact = {'0477-a':6,'0477-b':4950,'0478':169*Math.sqrt(3)};
assert.deepEqual(Object.keys(manifest.cards).sort(),Object.keys(expectedSteps).map(k=>'ex-main-'+k).sort());
for (const [number,parts] of Object.entries(expectedParts)) {
  assert.deepEqual(bank.lessons.filter(c=>c.source.collection==='main'&&c.source.exercise===number).map(c=>c.source.subpart??null),parts);
}
for (const [suffix, answers] of Object.entries(expectedSteps)) {
  const c = available.get('ex-main-'+suffix), model = c.visualization.model, p = model.points;
  assert.equal(c.source.bookId,'atanasyan-2024-10-11');
  assert.deepEqual(c.source.printedPages,[131]);assert.deepEqual(c.source.pdfPages,[133]);
  assert.equal(c.steps.length,4);assert.equal(c.help.length,2);
  c.steps.forEach((step,i)=>{
    assert.equal(engine.classifyAnswer(String(answers[i]),step.input.accepted).status,'correct',c.id + ' ' + step.id);
    for (const wrong of wrongStepAnswers(c.id,step)) assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
  });
  if (Object.hasOwn(exact,suffix)) {
    assert.equal(c.answer.mode,'exact');
    assert.equal(engine.classifyAnswer(String(exact[suffix]),c.answer.accepted).status,'correct');
    assert.equal(engine.classifyAnswer('0',c.answer.accepted).status,'wrong');
  } else assert.equal(c.answer.mode,'manual');
  viewer.prepare(model);
  for (const view of Object.values(model.views))
    for (const [a,o,b] of view.rightAngles||[]) near(dot(difference(p[a],p[o]),difference(p[b],p[o])),0);
  if (suffix==='0477-b') {
    assert.equal(model.planar,true);
    near(dist(p.A,p.B),20); near(dist(p.B,p.C),13.5); near(angle(p.A,p.B,p.C),rad(30));
    near(dist(p.C,p.K),6.75);
    const twiceArea=vectorLength(cross(difference(p.A,p.B),difference(p.C,p.B)));
    near(twiceArea*220/6,4950);near(twiceArea*120/6,2700);
    continue;
  }
  const base = [p.A,p.B,p.C,...(p.D?[p.D]:[])], a=dist(p.A,p.B), h=dist(p.O,p.T), l=dist(p.T,p.A);
  for (const [i,point] of base.entries()) {
    near(point[2],0);near(dist(point,p.T),l);near(dist(point,base[(i+1)%base.length]),a);
    near(dot(difference(point,p.O),difference(p.T,p.O)),0);
  }
  midpoint(p.A,p.B).forEach((x,i)=>near(x,p.M[i]));
  const v = volume(base,p.T);
  if (suffix==='0477-a') {near(a,3);near(h,2);near(v,6);}
  if (suffix==='0478') {near(a,13);near(h,12);near(v,169*Math.sqrt(3));}
  if (suffix==='0479-a') {near(l,10);near(h,8);near(angle(p.T,p.A,p.O),Math.asin(0.8));near(v,72*Math.sqrt(3));}
  if (['0479-b','0479-c','0480'].includes(suffix)) {
    near(l,6);near(a,6);near(angle(p.T,p.A,p.B),rad(60));near(angle(p.A,p.T,p.B),rad(60));near(v,18*Math.sqrt(2));
  }
  if (suffix==='0481-a') {near(h,6);near(angle(p.T,p.M,p.O),rad(45));near(v,288);}
  if (suffix==='0481-b') {near(a,6);near(angle(p.A,p.T,p.B),rad(60));near(v,36*Math.sqrt(2));}
}
// Use asymmetric height/radius ratios. In an equilateral tetrahedron, confusing
// the two different face angles would otherwise escape detection.
let identities=0;
for (const radius of [1,2.5,6,9]) for (const h of [0.5,1,3,8,12]) {
  const O=[0,0,0],T=[0,0,h];
  for (const count of [3,4]) {
    const base=Array.from({length:count},(_,i)=>[
      radius*Math.cos(2*Math.PI*i/count),radius*Math.sin(2*Math.PI*i/count),0]);
    const [A,B]=base, M=midpoint(A,B), a=dist(A,B), l=dist(T,A), V=volume(base,T);
    const apex=angle(A,T,B), edgeToSurface=angle(T,A,O), edgeToSide=angle(T,A,B), dihedral=angle(T,M,O);
    if (count===3) {
      near(triangular.edgePlane(l,edgeToSurface),V);
      near(triangular.edgeBaseSide(l,edgeToSide),V);
      near(triangular.faceApex(l,apex),V);
      near(triangular.baseAndApex(a,apex),V);
      assert(edgeToSide>rad(30)&&apex<rad(120));
      identities+=4;
    } else {
      near(square.dihedral(h,dihedral),V);near(square.faceApex(a,apex),V);
      assert(apex<rad(90));identities+=2;
    }
  }
}
near(triangular.edgeBaseSide(3,rad(60)),9*Math.sqrt(2)/4);
near(triangular.faceApex(3*Math.sqrt(2),rad(90)),9*Math.sqrt(2));
near(triangular.baseAndApex(6,rad(90)),9*Math.sqrt(2));
near(square.faceApex(4,Math.acos(1/3)),32/3);
console.log('ATANASYAN_PYRAMID_VOLUMES_OK: 9 source parts, 36 independently checked steps, '+identities+' coordinate identities and distinct angles');
