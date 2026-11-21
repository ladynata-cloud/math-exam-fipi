'use strict';

const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const course=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./cone-nets-and-frusta.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const distance=(a,b)=>Math.hypot(...sub(a,b));
function near(actual,expected){assert(Math.abs(actual-expected)<1e-8*Math.max(1,Math.abs(expected)),actual+' differs from '+expected);}
// Radii of circular slices interpolate linearly. Simpson integrates the square exactly.
const disks=(r,R,h)=>Math.PI*h*(r*r+4*((r+R)/2)**2+R*R)/6;
function volumeFromSurface(h,l,S){return Math.PI*h/12*(l*l-h*h+3*(S/(Math.PI*l))**2);}
const {available,issues}=engine.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(issues,[]);assert.deepEqual(manifest.parts,{'499':[null],'500':[null],'501':[null],'502':[null]});
const fields=[[9,15,216,288],[6,45/7,15,8/3],[3,4,84,52],[9,3,36,84,156,532]];
let checked=0;
for(let n=499;n<=502;n++){
  const c=available.get('ex-main-'+String(n).padStart(4,'0')),model=c.visualization.model,p=model.points;
  assert(Object.hasOwn(manifest.cards,c.id));assert.deepEqual(c.source.printedPages,[133]);assert.deepEqual(c.source.pdfPages,[135]);
  viewer.prepare(model);assert.equal(c.steps.length,fields[n-499].length);
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(fields[n-499][i]),step.input.accepted).status,'correct',c.id+' '+step.id);
    for(const wrong of wrongStepAnswers(c.id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
    checked++;
  }
  assert.equal(c.steps[2].justifications[0].theoryId,'theory-059');assert(available.has('theory-059'));
  for(const v of Object.values(model.views))
    for(const [a,o,b] of v.rightAngles||[])near(dot(sub(p[a],p[o]),sub(p[b],p[o])),0);
  const exact=value=>{
    assert.equal(c.answer.mode,'exact');assert.equal(engine.classifyAnswer(String(value),c.answer.accepted).status,'correct');
    assert.equal(engine.classifyAnswer('0',c.answer.accepted).status,'wrong');
  };
  if(n<=500){
    assert.equal(model.planar,true);
    const arc=model.views.sector.polygon.slice(1).map(key=>p[key]);
    const r=distance(p.O,p.B),h=distance(p.O,p.T),l=distance(p.T,p.B);
    let sweep=0;
    for(const v of arc)near(distance(v,p.Z),l);
    for(let i=1;i<arc.length;i++){
      const a=sub(arc[i-1],p.Z),b=sub(arc[i],p.Z);
      const positiveAngle=Math.atan2(a[0]*b[1]-a[1]*b[0],dot(a,b));
      assert(positiveAngle>0&&positiveAngle<Math.PI/8);
      sweep+=positiveAngle;
    }
    near(l*sweep,2*Math.PI*r);
    const degrees=sweep*180/Math.PI;
    if(n===499){
      near(h,12);near(r,9);near(disks(0,r,h),324*Math.PI);
      near(degrees,216);assert(degrees>180,'use the larger sector instead of its complement');exact(degrees);
    }else{
      near(degrees,60);near(Math.PI*r*r+l*l*sweep/2,45*Math.PI);
      near(l/r,6);near(h,15);near(disks(0,r,h),225*Math.PI/7);exact(disks(0,r,h));
    }
  }else{
    const r=distance(p.C,p.H),R=distance(p.A,p.O),l=distance(p.A,p.C),h=distance(p.H,p.O);
    near(distance(p.A,p.K),R-r);near(h*h+(R-r)**2,l*l);near(R,6);near(r,3);near(l,5);
    for(const [idx,center,radius] of [[0,p.O,R],[1,p.H,r]])for(const key of model.faces[idx]){
      near(distance(p[key],center),radius);near(p[key][2],center[2]);
    }
    const section=(distance(p.A,p.B)+distance(p.C,p.D))*h/2;
    const S=Math.PI*(R+r)*l;
    near(section,S*h/(Math.PI*l));near(section,36);near(disks(r,R,h),84*Math.PI);
    if(n===501)exact(disks(r,R,h));
    else{
      assert.equal(c.answer.mode,'manual');near(volumeFromSurface(h,l,S),disks(r,R,h));
      near(volumeFromSurface(12,13,169*Math.PI),532*Math.PI);
    }
  }
}
let variants=0;
for(const r of [0.25,2,5])for(const offset of [0.5,3,8])for(const h of [1,4,12]){
  const R=r+offset,l=Math.hypot(offset,h),S=Math.PI*(R+r)*l;
  near(volumeFromSurface(h,l,S),disks(r,R,h));
  near(S*h/(Math.PI*l),(R+r)*h);near(360*r/Math.hypot(r,h),360*(2*Math.PI*r)/(2*Math.PI*Math.hypot(r,h)));
  variants++;
}
assert.equal(checked,18);
console.log('ATANASYAN_CONE_NETS_FRUSTA_OK: four source exercises, 18 fields, sector arc winding including 216 degrees and 27 independent disk-integral volumes');
