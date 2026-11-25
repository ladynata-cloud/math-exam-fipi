'use strict';
const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const course = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./sphere-measures.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available, issues} = engine.inspectBundle(course.catalog, course.lessons);
assert.deepEqual(issues, []);
const pi = Math.PI;
const sub = (a,b) => a.map((x,i) => x-b[i]);
const length = (a,b) => Math.hypot(...sub(a,b));
const dot = (a,b) => a.reduce((s,x,i) => s+x*b[i],0);
function near(x,y) {assert(Math.abs(x-y)<1e-7*Math.max(1,Math.abs(y)),x+' versus '+y);}
// Simpson's rule integrates the quadratic cross-section area exactly.
function portion(r,a,b) {
  const disk = x => pi*(r*r-x*x);
  return (b-a)*(disk(a)+4*disk((a+b)/2)+disk(b))/6;
}
const ball = r => portion(r,-r,r);
const cap = (r,h) => portion(r,r-h,r);
const area = r => 4*pi*r*r;
const fields = {
  'theory-060':[5,9,ball(3)/pi,ball(6)/pi], 'theory-061-a':[2,5,cap(3,1)/pi,cap(3,2)/pi],
  'theory-061-b':[1,cap(3,2)/pi,portion(3,1,2)/pi,portion(3,-1,1)/pi],
  'theory-061-c':[5,10/3,cap(3,1)/pi+10/3,48], 'theory-062':[32/3,96,area(2)/pi,area(3)/pi],
  'ex-main-0503-a':[16,area(4),ball(4),ball(2)/pi], 'ex-main-0503-b':[27,3,area(3)/pi,6],
  'ex-main-0503-c':[16,4,ball(4),ball(5)/pi], 'ex-main-0504':[4,16,64,27],
  'ex-main-0505':[ball(3)/pi,9,4,8], 'ex-main-0506':[25,ball(2.5)/pi,25-ball(2.5)/pi,ball(2.5)/pi-75/4],
  'ex-main-0507':[ball(.5)/pi,25/16,32/75,16/75], 'ex-main-0508':[.6,317/15,cap(317/15,.6)/pi,cap(2.5,1)/pi]
};
const pages = {'theory-060':[133,134],'theory-061-a':[134,135],'theory-061-b':[135],'theory-061-c':[135],'theory-062':[135,136]};
assert.deepEqual(Object.keys(manifest.cards).sort(),Object.keys(fields).sort());
assert.deepEqual(manifest.parts,{'503':['а','б','в'],'504':[null],'505':[null],'506':[null],'507':[null],'508':[null],
  'theory-60':[null],'theory-61':['а','б','в'],'theory-62':[null]});
let checks=0;
for(const [id,values] of Object.entries(fields)) {
  const c=available.get(id), m=c.visualization.model, p=m.points;
  viewer.prepare(m);assert.equal(c.steps.length,values.length);
  assert.deepEqual(c.source.printedPages,pages[id]||[137]);assert.deepEqual(c.source.pdfPages,c.source.printedPages.map(page=>page+2));
  for(const [i,step] of c.steps.entries()) {
    assert.equal(engine.classifyAnswer(String(values[i]),step.input.accepted).status,'correct',id+'/'+step.id);
    for(const wrong of wrongStepAnswers(id,step)) assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong',id+'/'+step.id+' '+wrong);
    for(const j of step.justifications)if(j.theoryId) assert(available.has(j.theoryId));
    checks++;
  }
  for(const v of Object.values(m.views))for(const [a,o,b] of v.rightAngles||[])near(dot(sub(p[a],p[o]),sub(p[b],p[o])),0);
  if(p.F&&p.N) {
    const R=length(p.O,p.A);
    near(length(p.N,p.F),2*R);
    for(const [k,pt] of Object.entries(p))if(/^_(?:eq|xz|yz|cut|top|cap)/.test(k)) near(length(p.O,pt),R);
    if(p.C&&p.M) near(length(p.M,p.C)**2+length(p.O,p.M)**2,R**2);
    if(p.Q&&p.P) near(length(p.P,p.Q)**2+length(p.O,p.P)**2,R**2);
  }
  if(id==='theory-062') {
    for(const face of ['BCDE'.split(''),['B1','C1','D1','E1']]) {
      near(length(p[face[0]],p[face[1]]),4);near(length(p[face[0]],p[face[2]]),4*Math.SQRT2);
    }
  } else if(id==='ex-main-0503-b') {
    near(ball(3)*3.14/pi,113.04);
    assert.match(c.statement.text,/113[,.]04/);
    assert.match(c.steps.map(s=>s.explanation).join(' '),/приближ|округл/i);
  } else if(id==='ex-main-0504') {
    const ratio=length(p.E,p.R)/length(p.L,p.B);near(ratio**3,64);
  } else if(id==='ex-main-0505') {
    const r=length(p.O,p.K),h=length(p.M,p.N);near(r,length(p.M,p.B));near(ball(r),pi*r*r*h);
  } else if(id==='ex-main-0506') {
    const r=length(p.O,p.A),h=length(p.T,p.O);near(r,2.5);near(h,12);near(pi*r*r*h/3-ball(r),25*pi/6);
    assert.equal(engine.classifyAnswer('нет',c.answer.accepted).status,'correct');
  } else if(id==='ex-main-0507') {
    const r=length(p.O,p.B),dh=length(p.M,p.P);near(dh,4*ball(.5)/(pi*r*r));near(length(p.M,p.N),2*r);
  } else if(id==='ex-main-0508') {
    const h=length(p.O,p.T),a=length(p.O,p.A),R=(h*h+a*a)/(2*h),center=[0,0,h-R];
    for(const [name,pt] of Object.entries(p))if(name.startsWith('_s')||name.startsWith('_r')) near(length(pt,center),R);
    near(cap(R,h),942*pi/125);
  }
}
let variants=0;
for(const R of [.5,2,3,9])for(const x of [.1,.4,.8,1,1.6,2]){
  const h=R*x,a=Math.sqrt(Math.max(0,2*R*h-h*h));
  near(cap(R,h),pi*h*(3*a*a+h*h)/6);near(cap(R,h)+cap(R,2*R-h),ball(R));
  if(h<=R)near(cap(R,h)+pi*a*a*(R-h)/3,2*pi*R*R*h/3);
  variants++;
}
assert.equal(checks,52);
console.log('ATANASYAN_SPHERE_MEASURES_OK: 13 numbered and theory cards, 52 bound fields, 24 independent ball/cap integrals and actual diagrams');
