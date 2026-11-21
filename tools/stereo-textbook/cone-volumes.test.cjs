'use strict';

const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./cone-volumes.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=v=>Math.hypot(...v);
const distance=(a,b)=>norm(sub(a,b));
function near(actual,expected){assert(Math.abs(actual-expected)<1e-8*Math.max(1,Math.abs(expected)),actual+' differs from '+expected);}
// Disk areas vary quadratically with distance from the apex, so Simpson's
// three-point integration is exact. This does not presume the volume formula.
function diskIntegral(r,h){return h/6*(4*Math.PI*(r/2)**2+Math.PI*r*r);}
function volumeFromAreas(Q,P){return Math.sqrt(Math.PI*Q*(P*P-Q*Q))/(3*Math.PI);}
function recoverLegs(slant,axialArea){
  const sum=Math.sqrt(slant*slant+2*axialArea);
  const difference=Math.sqrt(slant*slant-2*axialArea);
  return [(sum-difference)/2,(sum+difference)/2];
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(manifest.parts,{'494':['а','б','в'],'495':[null],'496':[null],'497':[null],'498':[null]});
const fields={
  '0494-a':[9/4,1,9/4,8],'0494-b':[16,144,9,6],'0494-c':[16,4,16,3],
  '0495':[2/5,8/125,375,270],'0496':[3,5,12,16],'0497':[5,25,250/3,18],
  '0498':[17,5,100,240,12,16]
};
const exact={'0494-a':9*Math.PI/4,'0494-b':9,'0495':375};
assert.equal(Object.keys(manifest.cards).length,Object.keys(fields).length);
let checked=0;
for(const [suffix,expected] of Object.entries(fields)){
  const c=available.get('ex-main-'+suffix),m=c.visualization.model,p=m.points;
  assert(Object.hasOwn(manifest.cards,c.id));assert.equal(c.source.bookId,'atanasyan-2024-10-11');
  assert.deepEqual(c.source.printedPages,[133]);assert.deepEqual(c.source.pdfPages,[135]);
  viewer.prepare(m);
  for(const v of Object.values(m.views))
    for(const [a,o,b] of v.rightAngles||[])near(dot(sub(p[a],p[o]),sub(p[b],p[o])),0);
  assert.equal(c.steps.length,expected.length);
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(expected[i]),step.input.accepted).status,'correct',c.id+' '+step.id);
    for(const wrong of wrongStepAnswers(c.id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
    checked++;
  }
  assert.equal(c.steps[2].justifications[0].theoryId,'theory-059');assert(available.has('theory-059'));
  if(Object.hasOwn(exact,suffix)){
    assert.equal(c.answer.mode,'exact');assert.equal(engine.classifyAnswer(String(exact[suffix]),c.answer.accepted).status,'correct');
  }else assert.equal(c.answer.mode,'manual');
  if(suffix==='0498'){
    assert.equal(m.planar,true);
    const high=m.views.tall,wide=m.views.wide;
    assert(high.polygon.includes('T')&&!high.polygon.includes('U'));
    assert(wide.polygon.includes('U')&&!wide.polygon.includes('T'));
    const legs=recoverLegs(13,60);near(legs[0],5);near(legs[1],12);
    const values=[];
    for(const [tip,side] of [[p.T,p.B],[p.U,p.D]]){
      const r=distance(p.O,side),h=distance(tip,p.O);
      near(r*h,60);near(distance(tip,side),13);
      near((r+h)**2,289);values.push(diskIntegral(r,h)/Math.PI);
    }
    near(values[0],100);near(values[1],240);
    const [r,h]=recoverLegs(5,12);near(r,3);near(h,4);
    near(diskIntegral(r,h)/Math.PI,12);near(diskIntegral(h,r)/Math.PI,16);
    continue;
  }
  const radius=distance(p.A,p.O),height=distance(p.T,p.O),slant=distance(p.A,p.T),v=diskIntegral(radius,height);
  assert.equal(m.faces[0].length,24);
  for(const key of m.faces[0]){near(distance(p.O,p[key]),radius);near(p[key][2],0);near(distance(p.T,p[key]),slant);}
  near(height**2+radius**2,slant**2);
  if(suffix==='0494-a'){near(radius,1.5);near(height,3);near(v,9*Math.PI/4);}
  if(suffix==='0494-b'){near(radius,4);near(v,48*Math.PI);near(height,9);}
  if(suffix==='0494-c'){near(height,3);near(v,16*Math.PI);near(Math.sqrt(3*v/(Math.PI*height)),radius);}
  if(suffix==='0495'){
    near(height,5);near(distance(p.T,p.K),2);const r=distance(p.K,p.C);
    for(const name of m.views.small.polygon.filter(k=>k!=='T'))near(distance(p.K,p[name]),r);
    near(r/radius,2/5);near(diskIntegral(r,2),24);near(v,375);
  }
  if(suffix==='0496'){
    const Q=Math.PI*radius**2,P=Math.PI*radius*slant;
    near(Q,9*Math.PI);near(P,15*Math.PI);near(volumeFromAreas(Q,P),v);near(v,12*Math.PI);
  }
  if(suffix==='0497'){near(height,2*radius);near(v,Math.PI*height**3/12);}
}
let cases=0;
for(const r of [1,2.5,5,8])for(const h of [0.5,2,6,12]){
  const v=diskIntegral(r,h),l=Math.hypot(r,h),Q=Math.PI*r*r,P=Math.PI*r*l;
  near(Math.sqrt(3*v/(Math.PI*h)),r);near(3*v/Q,h);near(volumeFromAreas(Q,P),v);
  const [a,b]=recoverLegs(l,r*h);near(a,Math.min(r,h));near(b,Math.max(r,h));
  for(const k of [0.2,0.5,0.8]){near(diskIntegral(k*r,k*h)/v,k**3);cases++;}
}
assert.equal(checked,30);
console.log('ATANASYAN_CONE_VOLUMES_OK: seven source parts, 30 fields, 48 exact similarity comparisons, both admissible axial configurations and disk integration');
