'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),manifest=require('./coordinate-span-ratios.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,f)=>a.map(x=>x*f),dot=(a,b)=>a.reduce((s,t,i)=>s+t*b[i],0);
const cross=([a,b,c],[d,e,f])=>[b*f-c*e,c*d-a*f,a*e-b*d],norm=v=>Math.hypot(...v),same=(a,b)=>assert(norm(sub(a,b))<1e-8,a+' vs '+b);
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const keys={
 '0650-a':['1/2','8','да','да'],'0650-b':['1/2','-1/3','да','нет'],'0650-c':['0','1','да','нет'],'0650-d':['0','0','нет','да'],'0650-e':['-1/3','1/3','да','нет'],
 '0651-a':['5/6','10','5','10;6/5'],'0651-b':['-1/5','1/10','-3/5','1/10;-2'],
 '0652-a':['-3;-3','0','2;-1;0','да'],'0652-b':['2;0','0','2;-1;0','нет'],'0652-c':['1;-2','0','2;0;-1','да'],
 '0652-d':['1;-2','5','4;-2;3','да'],'0652-e':['-3;2','-8','1;-1;5','нет'],'0652-f':['0;1/3','1','-3;7;3','нет']
};
const rankCases={
 a:[[3,6,8],[6,12,16],.5],b:[[1,-1,3],[2,3,15],.5],c:[[1,0,0],[0,1,0],1],
 d:[[0,0,0],[5,7,-3],0],e:[[1/3,-1,5],[-1,-3,-15],-1/3]
};
const spanCases={
 a:[[1,0,0],[0,1,0],[-3,-3,0],[-3,-3],0],b:[[1,0,0],[0,1,0],[2,0,-3],[2,0],-3],
 c:[[1,0,0],[0,0,1],[1,0,-2],[1,-2],0],d:[[1,-1,2],[-2,0,1],[5,-1,0],[1,-2],0],
 e:[[1,0,2],[1,1,-1],[-1,2,4],[-3,2],12],f:[[0,5,3],[3,3,3],[1,1,4],[0,1/3],-45]
};
let fields=0,parameters=0,spanTransforms=0,rankTransforms=0;
for(const id of Object.keys(manifest.cards)){
 const c=available.get(id),n=Number(c.source.exercise),letter=id.at(-1),m=c.visualization.model,p=m.points,expected=keys[id.slice(8)];
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(st=>st.view)]),new Set(Object.keys(m.views)));
 assert.deepEqual(c.source.printedPages,[168]);assert.deepEqual(c.source.pdfPages,[170]);
 for(const [i,st] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(expected[i],st.input.accepted).status,'correct',id+' '+st.id);
  for(const w of wrongStepAnswers(id,st))assert.equal(engine.classifyAnswer(w,st.input.accepted).status,'wrong',id+' '+st.id+' '+w);fields++;
 }
 assert.equal(engine.classifyAnswer(expected.at(-1),c.answer.accepted).status,'correct',id+' final');
 if(n===651){
  const k=letter==='a'?5/6:-1/5;const [u,v]=letter==='a'?[[15,10,1],[18,12,1.2]]:[[.1,.4,-1],[-.5,-2,5]];
  same(p.U,u);same(p.V,v);same(p.U,scale(p.V,k));same(p.T,scale(p.Q,k));
  // The exact key pair is unique: changing either free number breaks collinearity.
  for(const defect of [-1,.1,2]){
   const M=letter==='a'?[15,10+defect,1]:[.1+defect,.4,-1];const N=letter==='a'?[18,12,1.2+defect]:[-.5,-2+defect,5];
   assert(norm(cross(M,v))>.1);assert(norm(cross(u,N))>.001);parameters+=2;
  }
  continue;
 }
 for(const mat of [[[1,0,0],[0,1,0],[0,0,1]],[[0,1,-1],[1,0,0],[0,1,2]],[[1,1,0],[0,1,1],[2,0,1]]]){
  const apply=x=>mat.map(v=>dot(v,x));assert(Math.abs(dot(mat[0],cross(mat[1],mat[2])))>.5);
  if(n===650){
   const [u,v,k]=rankCases[letter];same(p.U||p.O,u);same(p.V,v);
   assert.equal(norm(cross(apply(u),apply(v)))<1e-8,expected.at(-1)==='да');
   assert.equal(norm(cross(apply(p.T),apply(v)))<1e-8,expected[2]==='да');
   const candidate=p.W|| (k===1?p.V:k===0?p.O:p.U);same(candidate,scale(v,k));
   if(letter==='d')assert(!Object.hasOwn(p,'U'));rankTransforms++;
  }else{
   const [u,v,target,coef,det]=spanCases[letter];same(p.U,u);same(p.V,v);same(p.T,target);
   assert(Math.abs(dot(cross(u,v),target)-det)<1e-9);const pred=add(scale(u,coef[0]),scale(v,coef[1]));
   same(p.W||p.T,pred);same(p.Q,sub(scale(u,2),v));const normal=cross(apply(u),apply(v));assert(norm(normal)>.1);
   for(const vertex of ['_a','_b','_c','_d'])assert(Math.abs(dot(normal,apply(p[vertex])))<1e-8);
   assert.equal(Math.abs(dot(normal,apply(target)))<1e-8,expected.at(-1)==='да');spanTransforms++;
  }
 }
}
assert.equal(fields,39);assert.equal(parameters,12);assert.equal(spanTransforms,18);assert.equal(rankTransforms,15);
console.log('COORDINATE_SPAN_RATIOS_OK',JSON.stringify({fields,parameters,spanTransforms,rankTransforms}));
