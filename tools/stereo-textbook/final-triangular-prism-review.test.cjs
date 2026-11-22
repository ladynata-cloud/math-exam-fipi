'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const receipt = require('./final-triangular-prism-review.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const difference = (a, b) => a.map((x, i) => x - b[i]);
const sum = (a, b) => a.map((x, i) => x + b[i]);
const scale = (a, k) => a.map(x => x * k);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const length = a => Math.hypot(...a);
const squared = a => dot(a, a);
const near = (a, b) => assert(Math.abs(a-b) < 1e-8, a+' versus '+b);
const degrees = x => x * 180 / Math.PI;

function measurements(p) {
  const ab=difference(p.B,p.A), ac=difference(p.C,p.A), ab1=difference(p.B1,p.A);
  const bb1=difference(p.B1,p.B), bc=difference(p.C,p.B), cc1=difference(p.C1,p.C);
  const sectionNormal=cross(ab,difference(p.C1,p.A));
  const baseNormal=cross(ab,ac), otherNormal=cross(ab1,ac);
  const cb1=difference(p.B1,p.C);
  const angle=degrees(Math.asin(Math.abs(dot(cb1,baseNormal))/(length(cb1)*length(baseNormal))));
  const dihedral=degrees(Math.acos(Math.abs(dot(baseNormal,otherNormal))/(length(baseNormal)*length(otherNormal))));
  const vector=sum(sum(difference(bb1,bc),scale(difference(p.A,p.A1),2)),cc1);
  return {section:length(sectionNormal)/2, sectionNormal, angle, dihedral, vectorLength:length(vector),
    volume:Math.abs(dot(baseNormal,bb1))/2, baseArea:length(baseNormal)/2};
}
function prism(side,height) {
  const p={A:[0,0,0],B:[side,0,0],C:[side/2,side*Math.sqrt(3)/2,0]};
  for (const k of ['A','B','C']) p[k+'1']=sum(p[k],[0,0,height]);
  return p;
}

let families=0, checked=0;
for (const side of [1,2,4,6,8]) for(const height of [1,3,5,6,8]) {
  const p=prism(side,height), m=measurements(p);
  near(m.section,side*Math.hypot(side*Math.sqrt(3)/2,height)/2);
  near(m.angle,degrees(Math.atan(height/side)));
  near(m.dihedral,degrees(Math.atan(height/(side*Math.sqrt(3)/2))));
  near(m.vectorLength,side);
  near(m.volume,side*side*Math.sqrt(3)*height/4);
  const direction=difference(p.B1,p.A1);
  near(dot(direction,m.sectionNormal),0);
  assert(Math.abs(dot(difference(p.A1,p.A),m.sectionNormal))>1e-8);
  families++;
}

const {issues,available}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(receipt.parts['764'],['а','б','в','г','д','е']);
const first=Object.keys(receipt.cards).map(key=>available.get(key));
assert.deepEqual(first.map(c=>c.source.subpart),receipt.parts['764']);
for(const [i,c] of first.entries()){
  const scene=c.visualization.model, p=scene.points;
  viewer.prepare(scene);
  assert.deepEqual(c.source.printedPages,[189]);
  assert.deepEqual(c.source.pdfPages,[191]);
  assert.equal(c.source.exercise,'764');
  const m=measurements(p);
  for(const k of ['A','B','C']) near(length(difference(p[k+'1'],p[k])),3);
  near(length(difference(p.B,p.A)),6);
  let fields,final;
  if(i===0){
    fields=[squared(difference(p.H,p.C)),squared(difference(p.H,p.C1)),squared(difference(p.H,p.T))];
    final=m.section; near(final,18);
  }else if(i===1){
    const proof=c.answer;
    assert.equal(proof.mode,'manual');
    assert.equal(proof.accepted,undefined);
    assert.match(proof.prompt,/линию пересечения/u);
    assert.match(proof.feedback,/пересечение — прямая AB/u);
    assert.match(proof.feedback,/не пересекаются/u);
    assert.deepEqual(scene.views.reason.polygon,['A','B','B1','A1']);
    for(const name of ['A','B','C1','F','G']) near(dot(difference(p[name],p.A),m.sectionNormal),0);
    for(const name of ['A1','B1']) assert(Math.abs(dot(difference(p[name],p.A),m.sectionNormal))>1);
    near(dot(difference(p.B1,p.A1),m.sectionNormal),0);
    near(length(cross(difference(p.F,p.G),difference(p.B,p.A))),0);
    fields=['да','AB','да'];
  }else if(i===2){
    fields=[length(difference(p.C,p.B)),Math.tan(m.angle*Math.PI/180),
      degrees(Math.atan(length(difference(p.T,p.B))/length(difference(p.C,p.B))))];
    final=Number(m.angle.toFixed(1));near(final,26.6);
  }else if(i===3){
    const bk=length(difference(p.B,p.K));
    near(dot(difference(p.C,p.A),difference(p.B,p.K)),0);
    near(dot(difference(p.C,p.A),difference(p.B1,p.K)),0);
    fields=[bk*bk,length(difference(p.B1,p.B))/bk,degrees(Math.atan(length(difference(p.T,p.B))/bk))];
    final=m.dihedral;near(final,30);
  }else if(i===4){
    fields=[0,-1,length(difference(p.D,p.B))];
    near(length(difference(p.T,p.B)),5);
    final=m.vectorLength;near(final,6);
  }else{
    fields=[m.baseArea,length(difference(p.C1,p.C)),m.baseArea*length(difference(p.T,p.C))];
    final=m.volume;near(final,27*Math.sqrt(3));
    assert.equal(engine.classifyAnswer('27√3 см²',c.answer.accepted).status,'invalid');
  }
  for(const [j,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(fields[j]),step.input.accepted).status,'correct',c.id+' '+step.id);
    for(const wrong of wrongStepAnswers(c.id,step)) assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong',c.id+' '+wrong);
    checked++;
  }
  if(final!==undefined) assert.equal(engine.classifyAnswer(String(final),c.answer.accepted).status,'correct',c.id+' final');
}
assert.equal(checked,18);
console.log('FINAL_PRISM_764_OK: all six source parts, saved proof, 18 fields and '+families+' independent parameter families.');
