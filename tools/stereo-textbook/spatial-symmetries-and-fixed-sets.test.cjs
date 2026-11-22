'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),receipt=require('./spatial-symmetries-and-fixed-sets.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b)=>a.map((x,i)=>x+b[i]), scale=(v,k)=>v.map(x=>x*k);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=v=>Math.sqrt(dot(v,v));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' vs '+b),same=(a,b)=>near(norm(sub(a,b)),0),triple=v=>v.join(';');
const good=(v,accepted)=>assert.equal(engine.classifyAnswer(String(v),accepted).status,'correct',String(v));
const pages={80:[180,181],81:[181],82:[182],83:[182,183],84:[183,184]};
const centre=[-1,-1,-1],axes=[[1,-1,-1],[-1,1,-1],[-1,-1,1]],planes=[[1,1,-1],[1,-1,1],[-1,1,1]];
const apply=(v,s)=>v.map((x,i)=>x*s[i]);
let fields=0,images=0,motionChecks=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),m=c.visualization.model,p=m.points,n=Number(c.source.point||c.source.exercise),part=id.slice(-1),pg=pages[n]||[185];
 viewer.prepare(m);assert.deepEqual(c.source.printedPages,pg);assert.deepEqual(c.source.pdfPages,pg.map(v=>v+2));
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 let vals;
 if(n<100){
  const f={80:v=>scale(v,-1),81:v=>apply(v,axes[2]),82:v=>apply(v,planes[0]),83:v=>add(v,[1,2,-1]),84:v=>scale(v,-2)}[n];
  same(p.U,f(p.A));same(p.V,f(p.B));near(dot(sub(p.U,p.V),sub(p.U,p.V)),n===84?56:14);
  const extra={80:'0;0;0',81:'0;0;3',82:'2;-1;0',83:'1;2;-1',84:'2'}[n];vals=[triple(p.U),extra,n===84?56:14,n===84?4:1];
  for(const a of [[1,2,3],[-3,1,0],[0,0,0],[5,-2,1]])for(const b of [[-2,.5,1],[0,1,0],[-2,0,4]]){
   near(norm(sub(f(a),f(b))),norm(sub(a,b))*(n===84?2:1));if(n<=82)same(f(f(a)),a);motionChecks++;}
 }else if(n===719){
  const signs=part==='a'?[centre]:part==='b'?axes:planes;vals=[];assert.deepEqual([p.A,p.B,p.C],[[0,1,2],[3,-1,4],[1,0,-2]]);
  for(const [j,s] of signs.entries())for(const name of ['A','B','C']){
   const v=p[name+(j+1)];same(v,apply(p[name],s));same(apply(v,s),p[name]);vals.push(triple(v));images++;}
  same(p.R,apply(p.T,signs.at(-1)));vals.push(triple(p.R));
  c.steps.forEach(step=>assert.equal(step.justifications[0].theoryId,'theory-0'+({a:80,b:81,c:82}[part])));
 }else if(n===720){const u=sub(p.B,p.A),v=sub(p.V,p.U);same(u,scale(v,-1));same(p.R,scale(p.T,-1));
  const d=part==='a'?2:0;vals=['-1;0;-1',-d,triple(p.R),d?'параллельная':'совпадает'];
  for(const t of [-2,0,1,4]){const y=scale(add(p.A,scale(u,t)),-1);same(y,add(p.U,scale(v,t)));near(y[1],-d);motionChecks++;}
 }else if(n===721){const d=part==='a'?2:0;for(const name of 'ABC')same(p[name+'1'],scale(p[name],-1));same(p.R,scale(p.T,-1));
  vals=[-d,d?'нет':'да',triple(p.R),d?'параллельная':'совпадает'];
  for(const x of [-1,0,2])for(const y of [0,1]){const point=[x,y,d],q=scale(point,-1);near(q[2],-d);same(scale(q,-1),point);motionChecks++;}
 }else{const u=sub(p.B,p.A),v=sub(p.V,p.U);same(v,apply(u,axes[2]));same(p.R,apply(p.T,axes[2]));
  vals=[triple(v),part==='a'?'1':'2/3',triple(p.R),part==='a'?'0':'phi'];
  for(const t of [-2,0,2]){const q=apply(add(p.A,scale(u,t)),axes[2]);same(q,add(p.U,scale(v,t)));near(Math.abs(u[2])/norm(u),Math.abs(v[2])/norm(v));motionChecks++;}
 }
 c.steps.forEach((st,i)=>{good(vals[i],st.input.accepted);for(const w of wrongStepAnswers(id,st))assert.equal(engine.classifyAnswer(w,st.input.accepted).status,'wrong',id+' '+w);fields++;});good(vals.at(-1),c.answer.accepted);
}
assert.equal(images,21);assert.equal(fields,54);assert.equal(motionChecks,86);
console.log('MOTION_FIXED_SETS_OK: the 5 theory topics, all 21 printed images, 54 graded steps and 86 independent isometry, scaling, line and plane checks');
