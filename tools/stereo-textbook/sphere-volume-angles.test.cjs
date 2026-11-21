'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./sphere-volume-angles.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const values=[[2,8/3,32*Math.sqrt(3)/3,256*Math.sqrt(3)/3],[1,.5,1/6,4/3],[4,6,96,72],[12,32*Math.sqrt(3),6,288,2]];
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=v=>Math.hypot(...v),d=(a,b)=>norm(sub(a,b));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const near=(x,y)=>assert(Math.abs(x-y)<2e-8*Math.max(1,Math.abs(y)),x+' versus '+y);
const angle=(a,o,b)=>Math.acos(Math.max(-1,Math.min(1,dot(sub(a,o),sub(b,o))/(d(a,o)*d(b,o)))));
const volume=r=>4*Math.PI*r**3/3;
const polygon=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
let fields=0;
for(let n=547;n<=550;n++){
 const id='ex-main-'+String(n).padStart(4,'0'),c=available.get(id),m=c.visualization.model,p=m.points;
 assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(manifest.parts[n],[null]);viewer.prepare(m);
 assert.deepEqual(c.source.printedPages,[141]);assert.deepEqual(c.source.pdfPages,[143]);
 for(const [i,step] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(String(values[n-547][i]),step.input.accepted).status,'correct',id+'/'+step.id);
  for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
  if(i===2)assert(available.has(step.justifications[0].theoryId));fields++;
 }
 for(const v of Object.values(m.views))for(const [a,o,b] of v.rightAngles||[])near(dot(sub(p[a],p[o]),sub(p[b],p[o])),0);
 if(n===547||n===548){
  const base=[...(n===547?'ABC':'ABCD')].map(k=>p[k]),h=d(p.S,p.O),b=d(p.O,p.M),t=d(p.I,p.O),beta=angle(p.S,p.M,p.O);
  near(angle(p.I,p.M,p.O),beta/2);near(t,b*Math.tan(beta/2));near(d(p.I,p.T),t);
  for(let i=0;i<base.length;i++){
   const start=base[i],end=base[(i+1)%base.length],v=sub(end,start),N=cross(v,sub(p.S,start));
   near(Math.abs(dot(sub(p.I,start),N))/norm(N),t);
   const u=dot(sub(p.O,start),v)/dot(v,v);assert(u>0&&u<1);near(norm(sub(sub(p.O,start),v.map(x=>x*u))),b);
  }
  if(n===547){near(polygon(base)*h/3,3*Math.sqrt(3)/(4*Math.PI)*Math.tan(beta)/Math.tan(beta/2)**3*volume(t));}
  else{const phi=angle(p.B,p.A,p.D),a=d(p.A,p.B);near(volume(t),Math.PI*a**3/6*Math.sin(phi)**3*Math.tan(beta/2)**3);}
 }else if(n===549){
  const R=d(p.I,p.A),r=d(p.O,p.B),h=d(p.O,p.P),alpha=angle(p.V,p.A,p.B);
  for(const name of 'ABVU')near(d(p.I,p[name]),R);
  near(d(p.A,p.V),2*R);near(h,2*R*Math.sin(alpha));near(r,R*Math.cos(alpha));
  near(Math.PI*r*r*h,Math.PI*R**3*Math.sin(2*alpha)*Math.cos(alpha));
 }else{
  // Construct each actual cylinder: all rim points lie on a common sphere;
  // both generators are 6 and the acute diagonal angle is 60 degrees.
  for(const [tag,view,radius] of [['t','key',2*Math.sqrt(3)],['w','alternative',6]]){
   const [A,B,C,D]=[...'ABCD'].map(k=>p[tag+k]),h=d(B,C),w=d(A,B),r=w/2;
   near(h,6);for(const pt of [A,B,C,D])near(d(p.I,pt),radius);
   near(d(A,C),2*radius);near(d(B,D),2*radius);
   const theta=angle(A,p.I,B);near(Math.min(theta,Math.PI-theta),Math.PI/3);
   assert.equal(h>w,tag==='t');assert.deepEqual(m.views[view].polygon,[...'ABCD'].map(k=>tag+k));
   assert(m.views[view].segments.every(pair=>pair.every(k=>['O','P','I'].includes(k)||k.startsWith(tag))),'no lines from the other configuration');
   for(const z of [0,h])for(const t of [.13,.72,1.9,4.55])near(d(p.I,[r*Math.cos(t),r*Math.sin(t),z]),radius);
   near(volume(radius),tag==='t'?32*Math.sqrt(3)*Math.PI:288*Math.PI);
  }
  assert.match(c.answer.feedback,/ключе/iu);assert.match(c.answer.feedback,/sin³/iu);
 }
}
let variants=0;
for(const l of [1,3,6])for(const alpha of [Math.PI/12,Math.PI/4,Math.PI/3,Math.PI/2]){
 for(const vertical of [true,false]){
  const w=vertical?l*Math.tan(alpha/2):l/Math.tan(alpha/2),R=Math.hypot(l,w)/2;
  const A=[-w/2,0,0],B=[w/2,0,0],I=[0,0,l/2];
  const t=angle(A,I,B);near(Math.min(t,Math.PI-t),alpha);near(d(A,I),R);
  near(volume(R),Math.PI*l**3/(6*(vertical?Math.cos(alpha/2):Math.sin(alpha/2))**3));variants++;
 }
}
for(const R of [1,2.5,5])for(const alpha of [.15,.5,1,1.3]){
 const r=R*Math.cos(alpha),h=2*R*Math.sin(alpha);
 near(Math.hypot(2*r,h),2*R);near(Math.PI*r*r*h,Math.PI*R**3*Math.sin(2*alpha)*Math.cos(alpha));variants++;
}
assert.equal(fields,17);assert.equal(variants,36);
console.log('ATANASYAN_SPHERE_VOLUME_ANGLES_OK: four source problems, 17 fields, tangent planes, both realizable cylinders at 60 degrees, 36 independent angle/diameter checks');
