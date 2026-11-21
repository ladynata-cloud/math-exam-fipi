'use strict';
const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./pyramid-comparison-applications.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available, issues} = engine.inspectBundle(bank.catalog, bank.lessons);
assert.deepEqual(issues, []);
const sqrt = Math.sqrt;
const delta = (a, b) => a.map((x, i) => x-b[i]);
const dot = (a, b) => a.reduce((sum, x, i) => sum+x*b[i], 0);
const norm = a => Math.hypot(...a);
const distance = (a,b) => norm(delta(a,b));
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const tetraVolume = (a,b,c,d) => Math.abs(dot(cross(delta(b,a),delta(c,a)),delta(d,a)))/6;
const polygon = p => Math.abs(p.reduce((s,a,i) => {const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
function near(x,y) {assert(Math.abs(x-y)<1e-8*Math.max(1,Math.abs(y)), x+' ≠ '+y);}
const expected = {
  '0534':[4,6,6*sqrt(3),4*sqrt(3),8],
  '0535':[3,3,2,4],
  '0536-a':[2,1/12,23/12,sqrt(23)/6,2*sqrt(2)/3],
  '0536-b':[2,3,sqrt(3),2*sqrt(3)/3,4/3],
  '0537':[7,279,657,7/19]
};
let fields = 0;
for (const [suffix,answers] of Object.entries(expected)) {
  const id = 'ex-main-'+suffix, c = available.get(id), m = c.visualization.model, p = m.points;
  assert(Object.hasOwn(manifest.cards,id));
  assert.deepEqual(c.source.printedPages,[140]);assert.deepEqual(c.source.pdfPages,[142]);
  viewer.prepare(m);
  for (const [i,step] of c.steps.entries()) {
    assert.equal(engine.classifyAnswer(String(answers[i]),step.input.accepted).status,'correct',id+'/'+step.id);
    for (const wrong of wrongStepAnswers(id,step)) assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
    if (i===2) assert.equal(step.justifications[0].theoryId, 'theory-058');
    fields++;
  }
  for (const v of Object.values(m.views)) for (const [a,o,b] of v.rightAngles||[]) near(dot(delta(p[a],p[o]),delta(p[b],p[o])),0);
  if (suffix==='0534') {
    near(distance(p.S,p.A),distance(p.S,p.C));near(distance(p.S,p.B),distance(p.S,p.D));
    near(distance(p.A,p.C),4);near(distance(p.B,p.D),6);
    near(tetraVolume(p.A,p.B,p.C,p.S)+tetraVolume(p.A,p.C,p.D,p.S),4*sqrt(3));
  } else if (suffix==='0535') {
    near(dot(delta(p.S,p.A),delta(p.B,p.A)),0);near(dot(delta(p.S,p.A),delta(p.D,p.A)),0);
    near(distance(p.A,p.K),sqrt(3));near(distance(p.A,p.L),sqrt(3));near(distance(p.K,p.B)+distance(p.K,p.C),distance(p.B,p.C));
    near(distance(p.L,p.C)+distance(p.L,p.D),distance(p.C,p.D));
    near(tetraVolume(p.A,p.B,p.C,p.S)+tetraVolume(p.A,p.C,p.D,p.S),2);
  } else if (suffix==='0536-a') {
    near(tetraVolume(p.A,p.B,p.C,p.S),sqrt(23)/6);
    for (const [a,b] of [['A','B'],['B','C'],['C','A'],['S','C']]) near(distance(p[a],p[b]),2);
    for (const v of [p.A,p.B]) near(distance(p.S,v),sqrt(3));
  } else if (suffix==='0536-b') {
    near(tetraVolume(p.A,p.B,p.C,p.D),2*sqrt(3)/3);
    for (const a of [p.A,p.B]) for (const b of [p.C,p.D]) near(distance(a,b),sqrt(5));
    near(distance(p.A,p.B),2);near(distance(p.C,p.D),2);near(dot(delta(p.A,p.B),delta(p.C,p.D)),0);
    near(tetraVolume(p.A,p.B,p.N,p.C),tetraVolume(p.A,p.B,p.N,p.D));
  } else {
    const pyramid = names => polygon(names.map(k=>p[k]))*p[names[0]][2]/3;
    const volumes = ['u','m','l'].map(t=>pyramid([...('ABCD')].map(k=>t+k)));
    near((volumes[1]-volumes[0])/(volumes[2]-volumes[1]),31/73);
    assert.equal(engine.classifyAnswer('31/73',c.answer.accepted).status,'correct');
  }
}
assert.deepEqual(manifest.parts['536'],['а','б']);
for(const n of [534,535,537]) assert.deepEqual(manifest.parts[n],[null]);
let configurations = 0;
for (const a of [1,2,3.5]) for (const ratio of [.6,.8,1,1.2,1.35]) {
  const b = a*ratio, q = sqrt(3)*a/2, y = (2*b*b-a*a)/(2*sqrt(3)*a), h = sqrt(b*b-a*a/4-y*y);
  const A=[-a/2,0,0], B=[a/2,0,0], C=[0,q,0], S=[0,y,h];
  assert(h>0);near(distance(S,C),a);near(distance(S,A),b);near(distance(S,B),b);
  near(tetraVolume(A,B,C,S), a/12*sqrt(4*a*a*b*b-a**4-b**4));configurations++;
  const z=sqrt(a*a-b*b/2), A2=[-b/2,0,0], B2=[b/2,0,0], C2=[0,-b/2,z], D2=[0,b/2,z];
  for (const v of [A2,B2]) for(const w of [C2,D2]) near(distance(v,w),a);
  near(tetraVolume(A2,B2,C2,D2), b*b/12*sqrt(4*a*a-2*b*b));configurations++;
}
for (const a of [.5,1,3]) for (const b of [5,7]) {
  const m=(a+b)/2;
  const slice=(u,v)=>(v-u)*(u*u+u*v+v*v)/3;
  near(slice(a,m)/slice(m,b),(m**3-a**3)/(b**3-m**3));configurations++;
}
assert.equal(fields,23);assert.equal(configurations,36);
console.log('ATANASYAN_PYRAMID_COMPARISONS_OK: five source cards, 23 checked fields, 36 independent determinant and slice checks');
