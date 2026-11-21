'use strict';

const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const course = require('../../stereo-course/textbook/data/course.json');
const runtime = require('../../stereo-course/textbook/assets/engine.js');
const manifest = require('./inscribed-solids.json');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const minus = (a, b) => a.map((value, i) => value - b[i]);
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = a => Math.hypot(...a);
const equal = (a,b) => assert(Math.abs(a-b) < 2e-7*Math.max(1,Math.abs(b)), a+' differs from '+b);
function area(m,face) {
  const a = m.points[face[0]];
  return face.slice(1,-1).reduce((sum, name, i) =>
    sum + norm(cross(minus(m.points[name],a), minus(m.points[face[i+2]],a)))/2,0);
}
const sourceParts = {422:[null],423:[null],424:['а','б','в'],425:[null],426:[null],427:['а','б','в']};
const {available,issues} = runtime.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(issues, []);
const cards = [...available.values()].filter(card => manifest.cards[card.id]);
assert.equal(cards.length,10);
for (const [number,parts] of Object.entries(sourceParts))
  assert.deepEqual(cards.filter(card => card.source.exercise === number).map(card=>card.source.subpart||null),parts);
for (const card of cards) {
  assert.deepEqual(card.source.pdfPages,[116]);
  assert.deepEqual(card.source.printedPages,[114]);
  assert.equal(card.status,'reviewed');
  assert.equal(card.review.mathematics,'passed');
  const model=card.visualization.model, coordinates=model.points;
  viewer.prepare(model);
  for(const view of Object.values(model.views)) for (const [a,o,b] of view.rightAngles||[])
    equal(dot(minus(coordinates[a],coordinates[o]),minus(coordinates[b],coordinates[o])),0);
  assert(card.steps.length>=4 && card.steps.every(step=>step.justifications.length && step.explanation.length>20));
  assert(!Object.values(model.views).some(v=>!v.label));
  let expected;
  const n=Number(card.source.exercise);
  if(n===422){
    equal(dot(minus(coordinates.A,coordinates.C),minus(coordinates.B,coordinates.C)),0);
    for(const s of ['A','B','C'])equal(Math.hypot(coordinates[s][0],coordinates[s][1]),3);
  }
  if(n===423) {
    expected=model.faces.reduce((sum,f)=>sum+area(model,f),0)/(Math.PI*5*(5+13));
    equal(expected,(8+4*Math.sqrt(10)+4*Math.sqrt(17))/(15*Math.PI));
  }
  if(n===424){
    const sides=model.faces.length-2;
    expected=model.faces.reduce((sum,f)=>sum+area(model,f),0);
    const a=Math.PI/sides;
    equal(expected,sides*29*Math.sin(2*a)/2 + 7*sides*Math.sin(a)*Math.hypot(4,3*Math.cos(a)));
  }
  if(n>=425) {
    const ball=model.spheres[0], p=ball.center;
    for(const f of model.faces){
      const [a,b,c]=f.map(name=>coordinates[name]);
      const normal=cross(minus(b,a),minus(c,a));
      equal(Math.abs(dot(normal,minus(p,a)))/norm(normal),ball.radius);
    }
    if(n===427)expected=model.faces.reduce((sum,f)=>sum+area(model,f),0)/ball.radius**2;
  }
  if(expected!==undefined){
    assert.equal(runtime.classifyAnswer(String(expected),card.answer.accepted).status,'correct',card.id);
    assert.equal(runtime.classifyAnswer(String(expected+1),card.answer.accepted).status,'wrong',card.id);
  }
}
for(let i=1;i<60;i++){
  const t=Math.PI*i/60,x=Math.cos(t),y=Math.sin(t);
  equal(dot([1-x,-y,0],[-1-x,-y,0]),0);
}
console.log('INSCRIBED_SOLIDS_OK: ten source parts, cross products, tangency of every face, independent surface areas, exact answers and transfer tasks');
