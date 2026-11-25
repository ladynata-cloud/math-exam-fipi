'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),manifest=require('./vector-span-and-barycentres.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(...vs)=>vs.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]),scale=(a,t)=>a.map(x=>x*t);
const sub=(a,b)=>add(a,scale(b,-1)),v=(p,a,b)=>sub(p[b],p[a]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=([a,b,c],[d,e,f])=>[b*f-c*e,c*d-a*f,a*e-b*d],length=v=>Math.hypot(...v);
const near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' vs '+b);
const same=(a,b)=>near(length(sub(a,b)),0),mean=(...vs)=>scale(add(...vs),1/vs.length);
const answers={
 '0619-a':['2','да','да','любое число'],'0619-b':['0','да','нет','k≥0'],'0619-c':['2','нет','да','k<0'],'0619-d':['1','нет','нет','-1'],
 '0620-a':['3','1','нет','нет'],'0620-b':['3','1','3','нет'],'0621':['1/2','1','9','1;1;1'],
 '0622':['1/2','1/4','3;2','1/4'],'0623':['4','<','5','<'],'0624-a':['3','-2','-3;4','-2;3'],
 '0624-b':['-1','2','1/2;1/2','2;-1'],'0624-c':['k','1-k','3;-2','1-k;k'],
 '0625-a':['0','2','0','да'],'0625-b':['-2','2','0','да'],'0626':['2/3;1/3','нет','-1/2;3/2','1-k;k']
};
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
let fields=0,modelCases=0,planeLevels=0;
for(const [idSuffix,expected] of Object.entries(answers)){
 const id='ex-main-'+idSuffix,c=available.get(id),m=c.visualization.model,p0=m.points,n=Number(c.source.exercise),part=idSuffix.at(-1);
 assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(c.source.printedPages,[158]);assert.deepEqual(c.source.pdfPages,[160]);
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 for(const [i,step] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(expected[i],step.input.accepted).status,'correct',id+'/'+step.id);
  for(const w of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(w,step.input.accepted).status,'wrong',id+'/'+step.id+' '+w);fields++;
 }
 assert.equal(engine.classifyAnswer(expected.at(-1),c.answer.accepted).status,'correct',id+' final');
 for(const mat of [[[1,0,0],[0,1,0],[0,0,1]],[[1,.5,0],[0,1,-1],[0,0,2]],[[-1,0,2],[1,1,0],[0,1,3]]]){
  const p=Object.fromEntries(Object.entries(p0).map(([k,x])=>[k,add(mat.map(row=>dot(row,x)),[1,-3,2])]));
  const r=(a,b)=>v(p,a,b);
  if(n===619){
   const k={a:-2,b:0,c:-2,d:-1}[part],newk={a:-3.5,b:-.5,c:-.25,d:-3}[part];
   if(k!==0)same(r('P','A'),scale(r('O','B'),k));else assert.equal(m.views.neutral.segments.length,1);
   same(r('S','T'),scale(r('R','S'),newk));
   if(part==='b'){
    assert.equal(engine.classifyAnswer('k>0',c.answer.accepted).status,'wrong');
    assert(c.help.some(h=>h.text.includes('142')&&h.text.includes('сонаправленным с любым')));
   }
  }else if(n===620){
   const a=r('O','A'),b=r('O','B');assert(length(cross(a,b))>.1);
   same(r('U','V'),scale(b,3));same(r('R','S'),scale(b,3));
   for(const k of [-2,0,1])for(const l of [-1,1,3]){
    const u=add(a,scale(b,k)),w=add(a,scale(b,l));
    same(cross(u,w),scale(cross(a,b),l-k));assert.equal(length(cross(u,w))<1e-8,k===l);
   }
  }else if(n===621){
   for(const [a,b,c] of [['A1','B','C'],['B1','A','C'],['C1','A','B']])same(p[a],mean(p[b],p[c]));
   for(const origin of ['O','T','A'])same(add(...['A1','B1','C1'].map(a=>r(origin,a))),add(...['A','B','C'].map(a=>r(origin,a))));
  }else if(n===622){
   for(const [x,a,b] of [['P','A','B'],['Q','C','D'],['R','B','C'],['S','D','A'],['M','P','Q'],['M','R','S']])same(p[x],mean(p[a],p[b]));
   same(r('O','M'),mean(...['A','B','C','D'].map(a=>r('O',a))));same(p0.M,[3,2,0]);
  }else if(n===623){
   same(p.O,mean(p.A,p.C));same(p.O,mean(p.B,p.D));
   for(const origin of ['M','O','A','C']){
    const to=['A','B','C','D'].map(a=>r(origin,a));
    same(r(origin,'O'),mean(...to));assert(length(r(origin,'O'))<to.reduce((s,t)=>s+length(t),0)/4-1e-8);
   }
  }else if(n===624){
   const t={a:3,b:-1,c:.4}[part],next={a:4,b:.5,c:-2}[part];
   same(r('M','P'),scale(r('M','N'),t));same(r('O','P'),add(scale(r('O','M'),1-t),scale(r('O','N'),t)));
   if(part==='a')same(r('N','P'),scale(r('M','N'),2));if(part==='b')same(r('M','P'),scale(r('P','N'),-.5));
   same(r('O','T'),add(scale(r('O','M'),1-next),scale(r('O','N'),next)));
  }else if(n===625){
   const normal=cross(r('O','A'),r('O','B'));assert(length(normal)>.1);
   if(part==='b')same(r('O','P'),scale(r('O','A'),-2));else assert.equal(m.views.neutral.segments.length,2);
   near(dot(normal,r('O','T')),0);
  }else{
   const a=r('A1','A3'),b=r('B1','B3');assert(Math.abs(dot(cross(a,b),r('A1','B1')))>.1);
   const u=r('A1','B1'),w=r('A3','B3'),normal=cross(u,w);assert(length(normal)>.1);
   same(r('A1','A2'),scale(a,1/3));same(r('B1','B2'),scale(b,1/3));same(r('A2','B2'),add(scale(u,2/3),scale(w,1/3)));
   const plane=dot(normal,p._i);for(const label of ['_j','_k','_l'])near(dot(normal,p[label]),plane);
   for(const i of [1,2,3]){near(dot(normal,r('A'+i,'B'+i)),0);assert(Math.abs(dot(normal,p['A'+i])-plane)>.01);planeLevels++;}
   for(const k of [-2,0,.5,1,1.5,3]){
    const A=add(p.A1,scale(a,k)),B=add(p.B1,scale(b,k));
    same(sub(B,A),add(scale(u,1-k),scale(w,k)));
   }
  }
  modelCases++;
 }
}
assert.equal(fields,45);assert.equal(modelCases,45);assert.equal(planeLevels,9);
console.log('VECTOR_SPAN_AND_BARYCENTRES_OK',JSON.stringify({fields,modelCases,planeLevels}));
