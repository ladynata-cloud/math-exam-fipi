'use strict';

const assert = require('node:assert/strict');
const course = require('../../stereo-course/textbook/data/course.json');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const manifest = require('./circumspheres.json');
const minus = (a,b) => a.map((v,i) => v-b[i]);
const dot = (a,b) => a.reduce((s,v,i) => s+v*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length = a => Math.hypot(...a);
const equal = (a,b) => assert(Math.abs(a-b) < 1e-9*Math.max(1,Math.abs(b)), a+' differs from '+b);
function faceArea(face,p) {
  const first = p[face[0]];
  return face.slice(1,-1).reduce((s,k,i) =>
    s+length(cross(minus(p[k],first),minus(p[face[i+2]],first)))/2,0);
}
function distanceToFace(q,face,p) {
  const [a,b,c] = face.map(k => p[k]);
  const normal = cross(minus(b,a),minus(c,a));
  return Math.abs(dot(normal,minus(q,a)))/length(normal);
}
const parts = {428:['а','б'],429:[null],430:['а','б'],431:['а','б'],432:['а','б','в']};
const {available,issues} = engine.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(issues,[]);
const cards = [...available.values()].filter(c => Object.hasOwn(manifest.cards,c.id));
assert.equal(cards.length,10);
for(const [exercise,expected] of Object.entries(parts))
  assert.deepEqual(cards.filter(c => c.source.exercise===exercise).map(c => c.source.subpart||null),expected);
for (const card of cards) {
  const n = +card.source.exercise, part = card.source.subpart;
  assert.deepEqual(card.source.printedPages, [n<431?114:115]);
  assert.deepEqual(card.source.pdfPages, [n<431?116:117]);
  const m = card.visualization.model, p=m.points, ball=m.spheres[0], center=ball.center;
  viewer.prepare(m);
  for(const view of Object.values(m.views))
    for(const [x,o,y] of view.rightAngles||[]) equal(dot(minus(p[x],p[o]),minus(p[y],p[o])),0);
  assert(card.steps.filter(s=>s.input).length>=1 && card.steps.every(s=>s.justifications.length));
  if(n===428 || n===429 || (n===431 && part==='б')) {
    for(const face of m.faces) equal(distanceToFace(center,face,p),ball.radius);
  } else {
    for(const key of new Set(m.faces.flat()))
      equal(length(minus(center,p[key])),ball.radius);
  }
  const computedAreas = m.faces.map(face => faceArea(face,p));
  if(n===428) {
    const sideArea = computedAreas.slice(1).reduce((a,b)=>a+b,0);
    const q=length(minus(p.A,p.B))/2, l=length(minus(p.S,p.M)), t=q/l;
    equal(sideArea,4*ball.radius**2*(1+t)/(t*(1-t)));
    if(part==='б') {
      equal(ball.radius,5);
      equal(sideArea,300+200*Math.sqrt(3));
      assert.equal(engine.classifyAnswer(String(sideArea),card.answer.accepted).status,'correct');
    }
  }
  if(n===429) equal(length(minus(p.M,p.P)),(length(minus(p.A,p.B))+length(minus(p.A1,p.B1)))/2);
  if(n===430 && part==='б') assert(p.I[2] < p.O[2] && p.O[2] < p.S[2]);
  if(n===431 && part==='б') {
    const t=length(minus(p.I,p.S))/length(minus(p.K,p.S));
    assert(t>0 && t<1);
    equal(length(cross(minus(p.I,p.S),minus(p.K,p.S))),0);
    for(const [i,face] of m.faces.entries())
      equal(ball.radius,i===0?(1-t)*distanceToFace(p.S,face,p):t*distanceToFace(p.K,face,p));
  }
  if(n===432) {
    const coefficient=computedAreas.reduce((a,b)=>a+b,0)/ball.radius**2;
    equal(coefficient,{'а':8,'б':21*Math.sqrt(3)/4,'в':8*Math.sqrt(3)/3}[part]);
    assert.equal(engine.classifyAnswer(String(coefficient),card.answer.accepted).status,'correct');
    assert.equal(engine.classifyAnswer(String(coefficient+1),card.answer.accepted).status,'wrong');
  }
}
// The printed expression and the learner's half-angle expression agree for all
// admissible angles. Sample acute angles only, since the pyramid must have height.
for (let deg=1;deg<90;deg++) {
  const angle=deg*Math.PI/180, t=Math.tan(angle/2);
  equal((1+t)/(t*(1-t)),Math.cos(angle)/((1-Math.sin(angle))*t));
}
console.log('ATANASYAN_CIRCUMSPHERES_OK: all ten source parts and models, all face tangencies and vertex radii, 89 angle cases and four surface coefficients');
