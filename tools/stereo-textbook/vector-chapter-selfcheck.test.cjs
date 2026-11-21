'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./vector-chapter-selfcheck.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(...vs)=>vs.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]),scale=(x,k)=>x.map(v=>v*k);
const diff=(a,b)=>add(a,scale(b,-1)),v=(p,a,b)=>diff(p[b],p[a]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=([a,b,c],[d,e,f])=>[b*f-c*e,c*d-a*f,a*e-b*d],length=a=>Math.hypot(...a);
const near=(x,y)=>assert(Math.abs(x-y)<1e-8*Math.max(1,Math.abs(y)),x+' vs '+y),same=(a,b)=>near(length(diff(a,b)),0);
const col=(a,b)=>length(cross(a,b))<1e-8,opp=(a,b)=>col(a,b)&&dot(a,b)<0;
const answers={
 '01-a':['-3/2','да','-3','да'], '01-b':['-1','нет','-2','нет'], '01-c':['1','да','1','да'],
 '01-d':['3','нет','2','нет'], '01-e':['3/2','нет','6','нет'], '01-f':['-1/2','нет','1','да'],
 '02':['0','-1','-1;-2;1','да'], '03-a':['1','да','-2;1;3','да'],'03-b':['-1','нет','-2;1;3','да'],
 '04-a':['0','да','1;0;-2','да'],'04-b':['2','нет','1;0;-2','да'],
 '05':['-3','нет','2','да'], '06':['1','2','1','да'], '07':['6','нет','2','да'], '08':['5','минус','6','да'],
 '09':['3','нет','-3','да'], '10':['5','5','0','да'],
 '11-a':['1','1','2','1'],'11-b':['3','-3','-2','-3'],'11-c':['k','-k','-5/2','-k'],'11-d':['0','0','0','0'],
 '12-a':['нет','1','4','нет','1'],'12-b':['нет','1','4/3','нет','0;1'],
 '13-a':['0','2','-2','да'],'13-b':['-1','2','-2','да'],
 '14-a':['3;6','нет','6','да'],'14-b':['-3;-4','нет','-6','да'], '15':['2','да','да','нет']
};
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert.equal(Object.keys(manifest.parts).length,15);assert.equal(Object.keys(manifest.cards).length,28);
assert.deepEqual(Object.keys(answers).sort().map(s=>'ex-selfcheck-vi-'+s),Object.keys(manifest.cards));
let fields=0, configurations=0;
for(const [suffix,expected] of Object.entries(answers)){
 const id='ex-selfcheck-vi-'+suffix,c=available.get(id),m=c.visualization.model,p=m.points,n=Number(suffix.slice(0,2)),part=suffix.at(-1);
 const page=n<=8?156:157;
 assert.deepEqual(c.source.printedPages,[page]);assert.deepEqual(c.source.pdfPages,[page+2]);assert.equal(c.source.collection,'selfcheck');
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(expected[i],s.input.accepted).status,'correct',id+'/'+s.id);
  for(const w of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(w,s.input.accepted).status,'wrong',id+' '+s.id+' '+w);
  fields++;
 }
 assert.equal(engine.classifyAnswer(expected.at(-1),c.answer.accepted).status,'correct',id+' final');
 const arrows=name=>m.views[name].segments.map(([a,b])=>v(p,a,b));
 const initial=arrows('neutral'),next=arrows('transfer');
 if(n===1){
  const [a,b,c]=initial;
  if(part==='a'||part==='b'){assert(opp(a,b));assert(opp(next[0],next[1]));}
  if(part==='c'){same(a,b);same(next[0],next[1]);}
  if(part==='d'){assert(col(a,b)&&dot(a,b)>0);near(length(b)/length(a),3);near(length(next[1])/length(next[0]),2);}
  if(part==='e'){assert(opp(a,b)&&opp(b,c)&&!opp(a,c));same(c,scale(a,1.5));same(next[2],scale(next[0],6));}
  if(part==='f'){assert(col(a,b)&&!col(a,c)&&!col(b,c));assert(col(next[0],next[1])&&!col(next[0],next[2]));}
 }else if(n===2||n===3){
  same(v(p,'A','D'),v(p,'B','C'));same(p.O,scale(add(p.A,p.C),.5));same(p.O,scale(add(p.B,p.D),.5));
  if(n===2)same(p.Q,scale(p.P,-1));
 }else if(n===4){
  const reflect=u=>[u[0],u[1],-u[2]];same(p.C,reflect(p.A));same(p.D,reflect(p.B));
  same(v(p,'C','D'),reflect(v(p,'A','B')));near(length(v(p,'C','D')),length(v(p,'A','B')));
  assert.equal(length(diff(v(p,'C','D'),v(p,'A','B')))<1e-8,part==='a');
  same(v(p,'T','W'),reflect(v(p,'P','Q')));
 }else if(n===5){
  same(initial[2],add(initial[0],initial[1]));assert(col(initial[0],initial[1]));same(next[2],add(next[0],next[1]));
  for(const t of [-3,0,1,4]){const a=[1,2,-3],b=scale(a,t-1);same(add(a,b),scale(a,t));assert(col(a,b));configurations++;}
 }else if(n===6||n===8||n===9){
  const sign=n===6?1:-1;
  for(const [a,b,result] of [initial,next]){
   same(result,add(a,scale(b,sign)));
   if(n===6)assert(length(result)<Math.min(length(a),length(b)));
   if(n===8)near(length(result),length(a)+length(b));
  }
  if(n===9){near(length(initial[2]),length(initial[0])-length(initial[1]));assert(length(next[0])-length(next[1])<0);}
 }else if(n===7){
  same(initial[3],add(...initial.slice(0,3)));near(length(initial[3]),initial.slice(0,3).reduce((s,u)=>s+length(u),0));
  same(next[3],add(...next.slice(0,3)));assert(length(next[3])<next.slice(0,3).reduce((s,u)=>s+length(u),0));
 }else if(n===10){
  near(dot(initial[0],initial[1]),0);same(initial[2],add(initial[0],initial[1]));same(initial[3],diff(initial[0],initial[1]));
  near(length(initial[2]),length(initial[3]));same(next[0],next[1]);
 }else if(n===11){
  const f={a:1,b:-3,c:-2,d:0}[part];
  if(f){same(initial[1],scale(initial[0],f));same(next[1],scale(next[0],{a:2,b:-2,c:-2.5}[part]));}
  else{assert.equal(initial.length,1);assert.equal(next.length,1);assert(p.D&&p.H);}
 }else if(n===12){
  const k=part==='a'?1:2;same(v(p,'A','B'),scale(v(p,'C','D'),k));assert.equal(col(v(p,'A','C'),v(p,'B','D')),k===1);
  assert(col(v(p,'B','E'),v(p,'B','X')));assert(col(v(p,'A','C'),v(p,'A','X')));
  near(p.X[1],part==='a'?4:4/3);
  // These axes form the affine coordinate system determined by AB and AC.
  for(const k of [-9,-2,-.5,.5,1,2,5]){
   const a=[1,2,3],u=[1,2,0],w=[0,1,2],b=add(a,u),c=add(a,w),d=add(c,scale(u,1/k));
   near(dot(cross(u,w),diff(d,a)),0);const bd=diff(d,b),ac=diff(c,a);
   assert.equal(col(ac,bd),k===1);
   if(k!==1){const t=k/(k-1);same(add(b,scale(bd,t)),add(a,scale(ac,t)));}
   configurations++;
  }
 }else if(n===13||n===14){
  const normal=cross(p.U,p.V);assert(length(normal)>.1);
  for(const vector of arrows('reason'))near(dot(normal,vector),0);
  if(n===13){same(p.T,add(scale(p.U,4),scale(p.V,-2)));near(dot(normal,p.T),0);}
  else{
   same(p.C,add(p.U,scale(p.V,2)));near(p.L[2],2);
   const raised=arrows('transfer').slice(0,3);
   if(part==='a'){same(raised[0],p.U);same(raised[1],scale(p.V,2));same(raised[2],scale(p.L,3));near(raised[2][2],6);}
   else{same(raised[0],add(p.U,p.V));same(raised[1],add(p.U,scale(p.L,2)));same(raised[2],add(scale(p.V,2),scale(p.L,-3)));near(raised[2][2],-6);}
   assert(Math.abs(dot(cross(...raised.slice(0,2)),raised[2]))>.1);
  }
 }else{
  const normal=cross(v(p,'A','B'),v(p,'A','C'));assert(length(normal)>1);
  for(const x of ['A','B','C'])near(length(p[x]),2);
  assert(Math.abs(dot(normal,v(p,'A','O')))>1);near(dot(normal,v(p,'A','S')),0);
  for(const height of [-3,-1,0,2,7]){
   const o=[.2,-.4,height],vectors=[p.A,p.B,p.C].map(k=>diff(k,o));
   assert.equal(Math.abs(dot(cross(vectors[0],vectors[1]),vectors[2]))<1e-8,height===0);configurations++;
  }
 }
 if(n===3){
  const rotate=u=>[-u[0],-u[1],u[2]];same(p.C,rotate(p.A));same(p.Q,rotate(p.P));
  assert.equal(length(diff(rotate(p.B),p.D))<1e-8,part==='a');
 }
}
assert.equal(fields,86);assert.equal(configurations,23);
console.log('VECTOR_CHAPTER_SELFCHECK_OK',JSON.stringify({cards:Object.keys(answers).length,fields,configurations}));
