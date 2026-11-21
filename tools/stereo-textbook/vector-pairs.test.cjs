'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./vector-pairs.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');

const {available,issues} = engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues, []);
const directed = s => s.split(' ').map(v => v.split('-'));
const arrows559 = directed('A-D D1-A1 A1-A C1-B1 C-B C-C1 C-D A-B A-C A-C1 A-B1 D-K C-M');
const arrows560 = directed('M-A M-B B-Q D-P P-C M-N Q-P Q-M P-N');
const steps = {
  'ex-main-0559-a': ['C1B1','CB','CM','6'],
  'ex-main-0559-b': ['CC1','AB','3','2'],
  'ex-main-0559-c': ['C1B1','CB','CM','4'],
  'ex-main-0560-a': ['QP','PN','PC','6'],
  'ex-main-0560-b': ['4','16','90','25']
};
const finals = ['C1B1,CB,CM','CC1,AB,AD,AD,AD','C1B1,CB,CM','QP,PN,PC','квадрат'];
const minus = (a,b) => a.map((x,i) => x-b[i]);
const dot = (a,b) => a.reduce((sum,x,i) => sum+x*b[i],0);
const length = a => Math.hypot(...a);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const near = (a,b) => assert(Math.abs(a-b) < 1e-8, a+' versus '+b);
const midpoint = (a,b) => a.map((x,i) => (x+b[i])/2);
const tag = (u,v) => [u,v].sort().join('=');

function relations(points, arrows) {
  const lines = arrows.map(([a,b]) => [a+b,minus(points[b],points[a])]);
  const result = {same:new Set(),opposite:new Set(),equal:new Set()};
  for (const [i,[u,a]] of lines.entries()) {
    assert(length(a) > 0);
    for (const [v,b] of lines.slice(i+1)) {
      if (length(cross(a,b)) > 1e-8) continue;
      const key = tag(u,v);
      result[dot(a,b)>0?'same':'opposite'].add(key);
      if (length(minus(a,b))<1e-8) result.equal.add(key);
    }
  }
  return result;
}

const same559 = new Set([tag('D1A1','C1B1'),tag('D1A1','CB'),tag('C1B1','CB'),tag('DK','CM')]);
const opposite559 = new Set([tag('A1A','CC1'),tag('CD','AB'),tag('AD','D1A1'),tag('AD','C1B1'),tag('AD','CB')]);
const equal560 = new Set([tag('MN','QP'),tag('QM','PN'),tag('DP','PC')]);
let fields=0, configs=0;
for (const [k,[id,answers]] of Object.entries(steps).entries()) {
  const c=available.get(id), m=c.visualization.model, p=m.points, box=id.includes('0559');
  assert(Object.hasOwn(manifest.cards,id));
  viewer.prepare(m);
  assert.deepEqual(c.source.printedPages,[144]);
  assert.deepEqual(c.source.pdfPages,[146]);
  assert.deepEqual(m.arrows,box?arrows559:arrows560);
  for(const [i,s] of c.steps.entries()) {
    assert.equal(engine.classifyAnswer(answers[i],s.input.accepted).status,'correct',id+'/'+s.id);
    for(const wrong of wrongStepAnswers(id,s)) assert.equal(engine.classifyAnswer(wrong,s.input.accepted).status,'wrong');
    fields++;
  }
  assert.equal(engine.classifyAnswer(finals[k],c.answer.accepted).status,'correct');
  if (box || id==='ex-main-0560-a') {
    assert.equal(engine.classifyAnswer(finals[k].replaceAll(',',';').replaceAll('1','₁'),c.answer.accepted).status,'correct');
    assert.equal(engine.classifyAnswer('MC,XX',c.answer.accepted).status,'wrong');
  }
  if (box) {
    assert.deepEqual(p.K,midpoint(p.A1,p.D1)); assert.deepEqual(p.M,midpoint(p.B1,p.C1));
    // Nonsingular coordinate changes preserve parallelism and equality even when the box becomes oblique.
    for (const matrix of [[[1,0,0],[0,1,0],[0,0,1]],[[2,1,0],[0,2,1],[1,0,1]],[[-1,2,0],[0,3,0],[0,1,-2]]]) {
      const points=Object.fromEntries(Object.entries(p).map(([name,point])=>[name,matrix.map(row=>dot(row,point))]));
      const all=relations(points,m.arrows);
      assert.deepEqual(all.same,same559); assert.deepEqual(all.opposite,opposite559); assert.deepEqual(all.equal,same559); configs++;
    }
  } else {
    const tetraEdges=directed('A-B B-C C-D D-A A-C B-D');
    for(const [k,a,b] of [['M','A','B'],['N','A','D'],['P','D','C'],['Q','B','C']]) assert.deepEqual(p[k],midpoint(p[a],p[b]));
    for(const edge of [2*Math.sqrt(2),8,10,14]) {
      const points=Object.fromEntries(Object.entries(p).map(([name,v])=>[name,v.map(x=>x*edge/(2*Math.sqrt(2)))]));
      const vector=(a,b)=>minus(points[b],points[a]);
      for(const [a,b] of tetraEdges) near(length(vector(a,b)),edge);
      assert.deepEqual(relations(points,m.arrows).equal,equal560);
      for(const [a,b] of directed('M-N N-P P-Q Q-M')) near(length(vector(a,b)),edge/2);
      for(const [a,b,c] of ['MNP','NPQ','PQM','QMN']) near(dot(vector(b,a),vector(b,c)),0);
      near(length(cross(vector('M','N'),vector('M','Q'))),edge**2/4); configs++;
    }
  }
}
assert.deepEqual(manifest.parts,{'559':['а','б','в'],'560':['а','б']});
assert.equal(fields,20);assert.equal(configs,17);
console.log('ATANASYAN_VECTOR_PAIRS_OK: all 78 box and 36 tetrahedron unordered pairs, five printed subparts, square midsection, 20 fields and 17 independent model checks');
