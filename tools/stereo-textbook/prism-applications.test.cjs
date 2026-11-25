'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./prism-applications.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const vec=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>Math.hypot(...a);
const d=(a,b)=>norm(vec(a,b));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function near(x,y){assert(Math.abs(x-y)<1e-7*Math.max(1,Math.abs(y)),x+' versus '+y);}
const vals=[[2,1296,36,30],[97,16,48*Math.sqrt(11),24],[5,4,60,780],[21,25,105,42],
  [25,4,7,16*Math.sqrt(11),60],[2,8,16,54],[2,1,3,2]];
let fields=0;
for(let n=518;n<=524;n++){
  const id='ex-main-'+String(n).padStart(4,'0'),c=available.get(id),m=c.visualization.model,p=m.points;
  const tri=n>=523,u=vec(p.B,p.A),v=vec(tri?p.C:p.D,p.A),w=vec(p.A1,p.A);
  const volume=Math.abs(dot(cross(u,v),w))/(tri?2:1);
  assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(manifest.parts[n],[null]);
  assert.deepEqual(c.source.printedPages,[n<=520?138:139]);assert.deepEqual(c.source.pdfPages,[n<=520?140:141]);viewer.prepare(m);
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(vals[n-518][i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
    if(i===2)assert(available.has(step.justifications[0].theoryId));fields++;
  }
  for(const v of Object.values(m.views))for(const [a,o,b] of v.rightAngles||[])near(dot(vec(p[a],p[o]),vec(p[b],p[o])),0);
  near(dot(u,w),0);near(dot(v,w),0);
  if(n===518){
    const areas=[norm(cross(u,v)),norm(cross(u,w)),norm(cross(v,w))].sort((a,b)=>a-b);
    assert.deepEqual(areas,[6,12,18]);near(volume,Math.sqrt(areas.reduce((x,y)=>x*y,1)));
  }else if(n===519){
    near(d(p.A,p.C),7);near(d(p.A,p.B1),8);near(d(p.A,p.D1),9);near(volume,48*Math.sqrt(11));
  }else if(n===520){
    const ring=m.views.square.polygon.map(k=>p[k]);for(let i=0;i<4;i++){near(d(ring[i],ring[(i+1)%4]),5);near(dot(vec(ring[(i+3)%4],ring[i]),vec(ring[(i+1)%4],ring[i])),0);}
    near(norm(w),3);near(volume,60);
  }else if(n===521){
    near(norm(u),7);near(norm(v),3*Math.SQRT2);near(dot(u,v)/(norm(u)*norm(v)),Math.SQRT1_2);near(d(p.B,p.D),5);
    near(norm(w)/d(p.B,p.D),1);assert(d(p.B,p.D1)<d(p.A,p.C1));near(volume,105);
  }else if(n===522){
    const diag1=vec(p.D1,p.B),diag2=vec(p.C,p.A1);near(norm(diag1),6);near(norm(diag2),8);near(dot(diag1,diag2),0);
    for(let i=0;i<3;i++){near((p.D1[i]+p.B[i])/2,p.O[i]);near((p.C[i]+p.A1[i])/2,p.O[i]);}
    near(norm(u),3);near(norm(w),4);near(volume,16*Math.sqrt(11));
  }else if(n===523){
    const a=norm(w),lens=m.edges.map(([i,j])=>d(p[i],p[j]));assert.equal(lens.length,9);assert.equal(lens.filter(x=>Math.abs(x-a)<1e-10).length,5);
    for(const x of lens.filter(x=>Math.abs(x-a)>=1e-10))near(x,a/Math.SQRT2);
    near(dot(u,v),0);near(volume,a**3/4);
  }else if(n===524){
    const areas=[norm(cross(u,w)),norm(cross(v,w)),norm(cross(vec(p.C,p.B),w))].sort((a,b)=>a-b);
    near(areas[0],3);near(areas[2],3*Math.sqrt(5));near(volume,3);near(areas[1],6);
  }
}
let checks=0;
for(const a of [.5,2,5])for(const b of [1,3,6])for(const h of [.75,2,7]){
  const Q=b*b+h*h;near(h*Math.sqrt(Q*Q-Q*h*h),h*b*Math.sqrt(Q));
  const d1=a*a+b*b,d2=a*a+h*h,d3=b*b+h*h,half=(d1+d2+d3)/2;
  near(Math.sqrt((half-d1)*(half-d2)*(half-d3)),a*b*h);checks++;
}
assert.equal(fields,29);assert.equal(Object.keys(manifest.cards).length,7);
console.log('ATANASYAN_PRISM_APPLICATIONS_OK: seven printed exercises, 29 answer fields, determinant and 27 edge/diagonal/square-section parameter families');
