'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./volume-chapter-end.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const pi=Math.PI,sqrt=Math.sqrt;
const answers={'0551':[-1,2,16,500/3],'0552':[1,5/4,25/4,4/3],'0553':[5,25/4,625/4,500/3],
 '0554':[2.5,7/12,6.56,61/6],'0555':[1.5,1,1+sqrt(5),sqrt(pi),8],
 '0556-a':[4.8,.115264,1.026,.523],'0556-b':[4.85,.087327,.777,1.269]};
const difference=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const d=(a,b)=>Math.hypot(...difference(a,b));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' versus '+b);
const vol=r=>4*pi*r**3/3;
const shellDensity=(outer,wall)=>8.9*(vol(outer)-vol(outer-wall))/vol(outer);
let fields=0;
for(const [suffix,values] of Object.entries(answers)){
 const id='ex-main-'+suffix,c=available.get(id),m=c.visualization.model,p=m.points;
 assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(c.source.printedPages,[141]);assert.deepEqual(c.source.pdfPages,[143]);viewer.prepare(m);
 for(const [i,step] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(String(values[i]),step.input.accepted).status,'correct',id+'/'+step.id);
  for(const bad of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(bad,step.input.accepted).status,'wrong');
  if(i===2)assert(available.has(step.justifications[0].theoryId));fields++;
 }
 for(const v of Object.values(m.views))for(const [a,o,b] of v.rightAngles||[])near(dot(difference(p[a],p[o]),difference(p[b],p[o])),0);
 if(['0551','0552','0553'].includes(suffix)){
  const r=d(p.O,p.F),h=d(p.S,p.O),R=d(p.S,p.I),z=p.I[2];near(R,(h*h+r*r)/(2*h));near(z,(h*h-r*r)/(2*h));
  near(z+R,h);for(let i=0;i<9;i++){const angle=2*pi*i/9;near(d(p.I,[r*Math.cos(angle),r*Math.sin(angle),0]),R);}
  if(suffix==='0551') {assert(z<0);near(R,2);}
  if(suffix==='0552'){near(d(p.A,p.B),2);near(dot(difference(p.A,p.C),difference(p.B,p.C)),0);assert(z<0);}
  if(suffix==='0553'){near(d(p.A,p.C),10);near(d(p.B,p.D),10);assert(z>0);}
  for(const k of 'ABCD')if(p[k])near(d(p.I,p[k]),R);
 }else if(suffix==='0554'){
  const r=d(p.O,p.B),L=d(p.O,p.P),h=d(p.X,p.O),R=d(p.J,p.B);near(r,1.5);near(h,.5);near(R,2.5);
  near(d(p.X,p.J),R);near(d(p.Y,p.K),R);
  const disk=z=>pi*(R**2-(R-h+z)**2);
  const cap=h*(disk(0)+4*disk(h/2)+disk(h))/6;
  near(cap,7*pi/12);near(pi*r*r*L+2*cap,50);near(Math.round(100*L)/100,6.56);
  near(d(p.X,p.Y),L+1);
 }else if(suffix==='0555'){
  const cubeSide=d(p.cubeA0,p.cubeB0),sphereR=d(p.O,p.ballxy0);
  const cylR=d(p.cylLow0,p.cylLow12)/2,cylH=d(p.cylLow0,p.cylTop0);
  const coneR=d(p.coneBase0,p.coneBase12)/2,coneH=p.coneTop[2]-p.coneBase0[2],coneL=d(p.coneTop,p.coneBase0);
  near(6*cubeSide**2,6*pi);near(4*pi*sphereR*sphereR,6*pi);near(2*pi*cylR*(cylR+cylH),6*pi);near(pi*coneR*(coneR+coneL),6*pi);
  near(cylH,2*cylR);near(coneH,2*coneR);
  const ordered=[pi*coneR**2*coneH/3,cubeSide**3,pi*cylR**2*cylH,vol(sphereR)];
  assert(ordered.every((x,i)=>i===0||x>ordered[i-1]));
  assert.equal(engine.classifyAnswer('шар, конус',c.answer.accepted).status,'correct');
 }else{
  const R=d(p.O,p.A),r=d(p.O,p.B),wall=R-r;
  const density=shellDensity(R,wall);
  const thick=suffix==='0556-a';near(R,5);near(wall,thick?.2:.15);assert.equal(density>1,thick);
  assert.equal(engine.classifyAnswer(thick?'нет':'да',c.answer.accepted).status,'correct');
  // The copper wall and the water displaced by the *outside* sphere are computed separately.
  assert.equal(8.9*(vol(R)-vol(r))>vol(R),thick);near(Math.round(density*1000)/1000,values[2]);
 }
}
assert.deepEqual(manifest.parts['556'],['а','б']);for(let n=551;n<=555;n++)assert.deepEqual(manifest.parts[n],[null]);
let variants=0;
for(const r of [.5,1,2.5,5])for(const h of [.5,2,5]){
 const z=(h*h-r*r)/(2*h),R=Math.hypot(r,z);near(h-z,R);near(R,(h*h+r*r)/(2*h));
 const a=Math.atan(h/r);near(R,r/Math.sin(2*a));variants++;
}
for(const scale of [.2,1,3,12]){
 const S=6*pi*scale**2,cube=Math.sqrt(S/6),sphere=Math.sqrt(S/(4*pi)),cyl=Math.sqrt(S/(6*pi)),cone=Math.sqrt(S/(pi*(1+sqrt(5))));
 const nums=[2*pi*cone**3/3,cube**3,2*pi*cyl**3,vol(sphere)];assert(nums.every((x,i)=>i===0||x>nums[i-1]));variants++;
}
for(const R of [2,5,8])for(const t of [.05,.15,.2,.25]){
 const f=1-(1-t/R)**3;near(shellDensity(R,t),8.9*f);variants++;
}
const numbers=new Set(bank.lessons.filter(c=>c.source.collection==='main').map(c=>Number(c.source.exercise)));
for(let n=1;n<=556;n++)assert(numbers.has(n),'consecutive problem '+n);
assert.equal(fields,29);assert.equal(variants,28);
console.log('ATANASYAN_VOLUME_CHAPTER_END_OK: seven cards finish 1–556, 29 fields, signed sphere centres, exact cap integral, four equal surfaces, two shell densities, 28 independent configurations');
