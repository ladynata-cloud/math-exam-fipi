'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bundle = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./cross-sections.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available, issues} = engine.inspectBundle(bundle.catalog, bundle.lessons);
assert.deepEqual(issues, []);
assert.deepEqual(Object.keys(manifest.parts), ['466','467','468']);
const answers = [[0.5, 4/9, 0.5, 0.25], [0.5, 0.25, 0.5, 2], [0.25, 1/16, 0.2, 1/160]];
function near(actual, expected) {
  assert(Math.abs(actual - expected) < 2e-9, actual + ' != ' + expected);
}
function simpson(f, lower, upper) {
  const n = 2048, h = (upper-lower)/n;
  let total = f(lower) + f(upper);
  for (let i=1; i<n; i++) total += (i%2 ? 4 : 2)*f(lower+i*h);
  return h*total/3;
}
for (let number=466; number<=468; number++) {
  const id = 'ex-main-0' + number;
  const card = available.get(id);
  assert(card && Object.hasOwn(manifest.cards,id));
  assert.deepEqual(card.source.pdfPages,[132]);
  assert.deepEqual(card.source.printedPages,[130]);
  assert.equal(card.source.exercise,String(number));
  assert.deepEqual(manifest.parts[number],[null]);
  assert.equal(card.help.length,2);
  const model = card.visualization.model, points = model.points;
  viewer.prepare(model);
  const square = number===466, vertical=number===468;
  const axis = vertical ? 2 : 0;
  // Every modeled ring must be perpendicular to the chosen axis and have the
  // radius (or square side) prescribed by the original condition.
  for (let i=square ? 0 : 1; i<=8; i++) {
    const t = i/8 + (square ? 1 : 0);
    const ring = Array.from({length:square ? 4 : 24}, (_,k)=>points['_p'+i+'_'+k]);
    const plane = ring.map(p=>p.filter((_,j)=>j!==axis));
    for (const p of ring) near(p[axis],t);
    if (square) {
      for (let k=0;k<4;k++) {
        const a=plane[k], b=plane[(k+1)%4], c=plane[(k+2)%4];
        near(Math.hypot(b[0]-a[0],b[1]-a[1]),1/t);
        near((a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]),0);
      }
    } else {
      for (const [u,v] of plane) near(Math.hypot(u,v),vertical ? t*t : Math.sqrt(t));
    }
  }
  assert.deepEqual(model.views.section.polygon,Array.from({length:square ? 4 : 24},(_,k)=>'_p4_'+k));
  assert.deepEqual(model.views.interval.segments,[[square ? 'L' : 'O','N']]);
  const sectionArea = square ? t=>1/t**2 : vertical ? t=>t**4 : t=>t;
  const original = simpson(sectionArea,square ? 1 : 0,square ? 2 : 1);
  near(original,answers[number-466][2]);
  const transfer = simpson(sectionArea,square ? 2 : 0,square ? 4 : vertical ? 0.5 : 2);
  near(transfer,answers[number-466][3]);
  for (const [i,step] of card.steps.entries()) {
    assert.equal(engine.classifyAnswer(String(answers[number-466][i]),step.input.accepted).status,'correct');
    for (const wrong of wrongStepAnswers(id,step))
      assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
  }
  assert.equal(engine.classifyAnswer(String(answers[number-466][2]),card.answer.accepted).status,'correct');
  assert.equal(engine.classifyAnswer('1',card.answer.accepted).status,'wrong');
}
console.log('ATANASYAN_CROSS_SECTIONS_OK: 3 source exercises, 25 coordinate rings, 12 original and transfer steps, independent numerical volumes');
