'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const course=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./sphere-applications.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(course.catalog,course.lessons);
assert.deepEqual(issues,[]);
const pi=Math.PI;
const vec=(a,b)=>a.map((n,i)=>n-b[i]);
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const distance=(a,b)=>Math.hypot(...vec(a,b));
function near(x,y){assert(Math.abs(x-y)<1e-7*Math.max(1,Math.abs(y)),x+' versus '+y);}
// Simpson's rule is exact for the quadratic circular slice area, including intervals across the centre.
function slice(r,a,b){const f=x=>r*r-x*x;return pi*(b-a)*(f(a)+4*f((a+b)/2)+f(b))/6;}
const ball=r=>slice(r,-r,r);
const fields=[[2,40/3,5/16,10/3],[45,58500,504000,562500],[2,8,52/3,52/81],[9,252,720,28/3],[45,30,112500,100/3],
  [1,3,(2-Math.sqrt(3))/3,1/3],[1/4,1,6375**2,160],[400,32,432,110],[2,4/3,3,36]];
let bound=0;
for(let n=509;n<=517;n++){
  const id='ex-main-'+String(n).padStart(4,'0'),c=available.get(id),m=c.visualization.model,p=m.points;
  assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(manifest.parts[n],[null]);assert.deepEqual(c.source.printedPages,[137]);assert.deepEqual(c.source.pdfPages,[139]);viewer.prepare(m);
  for(const [i,s] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(fields[n-509][i]),s.input.accepted).status,'correct',id+'/'+s.id);
    for(const wrong of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(wrong,s.input.accepted).status,'wrong');
    if(i===2)assert(available.has(s.justifications[0].theoryId));bound++;
  }
  for(const v of Object.values(m.views))for(const [a,o,b] of v.rightAngles||[])near(dot(vec(p[a],p[o]),vec(p[b],p[o])),0);
  if(n===509){
    const R=distance(p.O,p.P),d=distance(p.O,p.M);
    near(distance(p.A,p.O),R);near(distance(p.A,p.P),R);near(d,R/2);
    for(const name of m.views.lens.polygon){const pt=p[name];assert(distance(pt,p.O)<=R+1e-9&&distance(pt,p.P)<=R+1e-9);}
    near(2*slice(R,d,R)/ball(R),5/16);
  }else if(n===510||n===512){
    const R=distance(p.O,p.N),a=distance(p.M,p.A),d=distance(p.O,p.M);
    near(a*a+d*d,R*R);near(distance(p.M,p.N)+distance(p.M,p.S),2*R);
    const small=slice(R,d,R),large=slice(R,-R,d);
    for(const name of m.views.small.polygon)assert(p[name][1]>=d-1e-8);
    for(const name of m.views.large.polygon)assert(p[name][1]<=d+1e-8);
    near(small/pi,n===510?58500:252);near(large/pi,n===510?504000:720);near(small+large,ball(R));
  }else if(n===511){
    const R=distance(p.O,p.N);near(p.M[2],-R/3);near(p.P[2],R/3);
    near(slice(R,p.M[2],p.P[2])/(pi*R**3),52/81);
    near(distance(p.M,p.C),distance(p.P,p.Q));
  }else if(n===513||n===514){
    const R=distance(p.O,p.N),a=distance(p.M,p.A),d=distance(p.O,p.M),h=distance(p.M,p.N);
    const cos=dot(vec(p.A,p.O),vec(p.N,p.O))/R**2;near(cos,d/R);assert(cos>0&&cos<1);
    near(d*d+a*a,R*R);near(slice(R,d,R)+pi*a*a*d/3,2*pi*R*R*h/3);
    if(n===513){near(a,60);near(R,75);near((slice(R,d,R)+pi*a*a*d/3)/pi,112500);}
    else {near(Math.acos(cos),pi/6);near(2*h/(3*R),(2-Math.sqrt(3))/3);}
  }else if(n===515){
    const r=distance(p.O,p.N),equator=m.views.disk.polygon;
    for(const k of equator)near(distance(p[k],p.O),r);
    for(const [a,b] of m.views.quarter.segments)for(const k of [a,b]){near(distance(p[k],p.O),r);assert(Math.abs(p[k][0])<1e-8||Math.abs(p[k][1])<1e-8);}
    near(4*pi*6375**2*(1-.75),40640625*pi);
  }else if(n===516){
    const r=distance(p.O,p.N);near(4*r*r*1.08,432);assert.equal(Math.round(432*pi),1357);
  }else{
    const R=distance(p.O,p.K),r=distance(p.M,p.B),h=distance(p.M,p.T),l=distance(p.T,p.B);
    near(h,2*R);near(l,2*r);near(pi*r*(r+l),4*pi*R*R);
  }
}
let variants=0;
for(const r of [.5,2,5,17])for(const ratio of [.1,.25,.4,.6,.9]){
  const d=r*ratio,a=Math.sqrt(r*r-d*d),h=r-d;
  near(slice(r,d,r)+slice(r,-r,d),ball(r));
  near(slice(r,d,r)+pi*a*a*d/3,2*pi*r*r*h/3);
  near(slice(r,-r/3,r/3),52*pi*r**3/81);variants++;
}
assert.equal(bound,36);assert.equal(Object.keys(manifest.cards).length,9);
console.log('ATANASYAN_SPHERE_APPLICATIONS_OK: nine exercises, 36 error/correction fields, lens intersection, complementary segments, acute sectors, surface area and 20 disk-integral comparisons');
