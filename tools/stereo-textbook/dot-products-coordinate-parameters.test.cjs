'use strict';
const assert=require('node:assert/strict');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const receipt=require('./dot-products-coordinate-parameters.json');
const bank=require('../../stereo-course/textbook/data/course.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const mul=(u,v)=>u.map((x,i)=>x*v[i]), dot=(u,v)=>mul(u,v).reduce((a,b)=>a+b,0);
const sum=(u,v)=>u.map((x,i)=>x+v[i]), factor=(u,k)=>u.map(x=>x*k);
const triple=v=>v.join(';');
const classify=d=>d<0?'тупой':d>0?'острый':'прямой';
const good=(v,accepted)=>assert.equal(engine.classifyAnswer(String(v),accepted).status,'correct',String(v));
const first=[3,-5,1],second=[0,1,-5],i=[1,0,0],j=[0,1,0],k=[0,0,1];
const products=[[first,second,-10],[first,i,3],[second,j,1],[sum(first,second),k,-4],[sum(first,factor(second,-2)),sum(sum(i,k),factor(j,-2)),28]];
const aa=[3,-1,1],bb=[-5,1,0],cc=[-1,-2,1];
let fields=0,linearChecks=0, transformed=0;
for(const id of Object.keys(receipt.cards)){
 const card=available.get(id),model=card.visualization.model,p=model.points,number=Number(card.source.exercise),n=id.charCodeAt(id.length-1)-97;
 viewer.prepare(model);
 assert.deepEqual(new Set(['neutral',...card.help.map(h=>h.view),...card.steps.map(s=>s.view)]),new Set(Object.keys(model.views)));
 assert.deepEqual(card.source.printedPages,[176]);assert.deepEqual(card.source.pdfPages,[178]);
 let answers;
 if(number===685){
  assert.deepEqual([p.A,p.B,p.C],[[1,-1,2],[-1,1,1],[5,6,2]]);
  const mixed=[dot(p.A,p.C),dot(p.A,p.B),dot(p.B,p.C)],squares=[dot(p.A,p.A),dot(p.B,p.B)];
  assert.deepEqual([...mixed,...squares],[3,0,3,6,3]);
  answers=[triple(mixed),triple(squares),dot(p.A,p.T),triple([...mixed,...squares])];
 }else if(number>=686&&number<=688){
  let u,v,value;
  if(number===686)[u,v,value]=products[n];
  else if(number===687)[u,v,value]=[[aa,bb,-16],[bb,cc,3],[aa,cc,0]][n];
  else {u=[3,-5,0];v=[i,j,k][n];value=[3,-5,0][n];}
  assert.deepEqual([p.U,p.V],[u,v]);
  assert.deepEqual(p.T,v.map(x=>x===0?0:-x));
  assert.equal(dot(u,v),value);
  const contributions=triple(mul(u,v));
  answers=number===686?[triple(u),contributions,-value,value]:[contributions,value,classify(-value),classify(value)];
  for(const signed of [-3,-1,1,2]){
   const perm=v=>[v[2],-v[1],v[0]];
   assert.equal(dot(perm(u),factor(perm(v),signed)),signed*value || 0);
   transformed++;
  }
 }else if(number===689){
  const target=[3,-1,0][n],x=[5.5,3.5,4][n];assert.deepEqual(p.A,[-1,2,3]);assert.deepEqual(p.B,[5,x,-1]);
  assert.equal(dot(p.A,p.B),target);assert.equal(dot(p.T,p.P),target+2);
  for(const y of [-10,-1,0,x-1,x,x+1,20]){assert.equal(dot(p.A,[5,y,-1]),2*y-8);assert.equal(dot(p.A,[5,y,-1])===target,y===x);linearChecks++;}
  answers=[-8,target,target+2,x];
 }else{
  for(const m of [-10,0,1,3,4,5,7]){const result=dot([m,3,4],[4,m,-7]);assert.equal(result,7*m-28);assert.equal(result===0,m===4);linearChecks++;}
  assert.deepEqual([p.A,p.B,p.T,p.P],[[4,3,4],[4,4,-7],[5,3,4],[4,5,-7]]);answers=[7,0,7,4];
 }
 card.steps.forEach((step,idx)=>{good(answers[idx],step.input.accepted);for(const w of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(w,step.input.accepted).status,'wrong',id+' '+w);fields++;});
 good(answers.at(-1),card.answer.accepted);
}
assert.equal(fields,48);assert.equal(linearChecks,28);assert.equal(transformed,44);
console.log('COORDINATE_DOT_PRODUCTS_OK: 48 learner fields, 44 signed axis transformations, six angle types, all 28 parameter evaluations and four unique roots');
