'use strict';
const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const scene = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./cylinder-applications.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available, issues} = engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const answers={'0538-a':[3,4,36,24],'0538-b':[2,4,16,54],'0538-c':[4,4,16,2],'0539':[4,2/3,5],'0540':[2.25,2.25,7065,3140]};
const d=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' != '+b);
const volume=(r,h)=>Math.PI*r*r*h;
const side=(r,h)=>2*Math.PI*r*h;
let fields=0;
for(const [suffix,values] of Object.entries(answers)){
  const id='ex-main-'+suffix,c=available.get(id),m=c.visualization.model,p=m.points;
  assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(c.source.printedPages,[140]);assert.deepEqual(c.source.pdfPages,[142]);scene.prepare(m);
  for(const [i,s] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(values[i]),s.input.accepted).status,'correct',id+'/'+s.id);
    for(const bad of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(bad,s.input.accepted).status,'wrong');
    if(i===2)assert.equal(s.justifications[0].theoryId,suffix==='0540'?'theory-059':'theory-055');fields++;
  }
  if(suffix.startsWith('0538')){
    const r=d(p.O,p.B),h=d(p.O,p.P),Q=Math.PI*r*r,L=side(r,h),S=L+2*Q;
    near(d(p.A,p.B),2*r);
    if(suffix==='0538-a')near(volume(r,h),L*Math.sqrt(Q/Math.PI)/2);
    else {near(d(p.A,p.B),d(p.B,p.V));near(volume(r,h),suffix==='0538-b'?Math.PI*h**3/4:S*Math.sqrt(S/(6*Math.PI))/3);}
  }else if(suffix==='0539'){
    const r=d(p.O1,p.B1),R=d(p.O2,p.B2),h=d(p.O1,p.P1),H=d(p.O2,p.P2);
    near(side(r,h),side(R,H));near(volume(r,h)/volume(R,H),r/R);
  }else{
    const r=d(p.O,p.B),h=d(p.O,p.S);assert(p.S[2]<p.O[2]);near(r,1.5);near(h,3);
    const litres=1000*volume(r,h)/3;near(litres,2250*Math.PI);
    near(1000*3.14*r*r*h/3,7065);assert.equal(Math.round(litres),7069);
    assert.equal(engine.classifyAnswer(String(litres),c.answer.accepted).status,'correct');
  }
}
assert.deepEqual(manifest.parts['538'],['а','б','в']);
assert.deepEqual(manifest.parts['539'],[null]);assert.deepEqual(manifest.parts['540'],[null]);assert.equal(fields,19);
let comparisons=0;
for (const r of [.75,1.5,4])for(const h of [2,4.5,9]){
  const Q=Math.PI*r*r,L=side(r,h),V=volume(r,h);
  near(V,L/2*Math.sqrt(Q/Math.PI));for (const R of [r/2,3*r]){const H=L/(2*Math.PI*R);near(V/volume(R,H),r/R);comparisons++;}
  const S=2*Math.PI*r*r+side(r,2*r);near(volume(r,2*r),S*Math.sqrt(S/(6*Math.PI))/3);comparisons++;
  // For a tank with the vertex at z=0, integrate its actual circular cross-sections.
  const disk=z=>Math.PI*(r*z/h)**2;
  near(h/6*(disk(0)+4*disk(h/2)+disk(h)),V/3);comparisons++;
}
assert.equal(comparisons,36);console.log('ATANASYAN_CYLINDER_APPLICATIONS_OK: five source cards, 19 fields, 36 height, area and section checks; 2250π L, 7065 L at pi=3.14');
