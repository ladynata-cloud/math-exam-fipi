'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),manifest=require('./signed-coordinate-arithmetic.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,q)=>a.map(x=>x*q),zero=[0,0,0],sum=vs=>vs.reduce(add,zero);
const same=(a,b)=>assert(Math.hypot(...sub(a,b))<1e-8,a+' vs '+b);
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const source646={A:[5,-1,1],B:[-2,1,0],C:[0,.2,0],D:[-1/3,12/5,-1/7]};
const source648={A:[-1,1,1],B:[0,2,-2],C:[-3,2,0],D:[-2,1,-2]};
const official646=[
 [[7,-2,1],[['A',1],['B',-1]],0],[[-7,2,-1],[['B',1],['A',-1]],0],[[5,-1.2,1],[['A',1],['C',-1]],1],
 [[-5-1/3,3+2/5,-1-1/7],[['D',1],['A',-1]],1],[[1/3,-2.2,1/7],[['C',1],['D',-1]],0],
 [[7,-1.8,1],[['A',1],['B',-1],['C',1]],1],[[7,-2.2,1],[['A',1],['B',-1],['C',-1]],1],
 [[10,-2,2],[['A',2]],1],[[6,-3,0],[['B',-3]],0],[[0,-1.2,0],[['C',-6]],1],
 [[1/9,-4/5,1/21],[['D',-1/3]],2],[[-.4,.2,0],[['B',.2]],0]
];
const official648=[
 [[0,5,-1],[['A',3],['B',2],['C',-1]],0],[[-3,2,1],[['A',-1],['C',2],['D',-1]],1],
 [[7.8,2.5,4.1],[['A',.1],['B',3],['C',.7],['D',-5]],0],[[-3,9,-3],[['A',3],['B',3]],1]
];
let fields=0,printedVectors=0,sourceVariations=0;
for(const id of Object.keys(manifest.cards)){
 const c=available.get(id),m=c.visualization.model,p=m.points,n=Number(c.source.exercise),j=id.charCodeAt(id.length-1)-97;
 assert.deepEqual(c.source.printedPages,[167]);assert.deepEqual(c.source.pdfPages,[169]);
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 let expected;
 if(n===646||n===648){
  const [answer,coef,axis]=(n===646?official646:official648)[j],data=n===646?source646:source648;
  for(const k of Object.keys(data))same(p[k],data[k]);
  const compute=set=>sum(coef.map(([k,w])=>scale(set[k],w))),total=compute(data);
  same(total,answer);printedVectors++;
  const [first,w]=coef[0],delta=[1,-2,.5],target=add(total,scale(delta,w));
  same(p.T,add(data[first],delta));same(p.R,target);
  const seg=m.views.path.segments;let prev='O';
  for(const [i,[k,q]] of coef.entries()){
   const [a,b]=seg[i];assert.equal(a,prev);same(sub(p[b],p[a]),scale(data[k],q));prev=b;
  }
  same(p[prev],answer);
  for(const shift of [delta,[.5,0,-3],[-4,.3,0],[0,0,0]]){
   const changed={...data,[first]:add(data[first],shift)};same(sub(compute(changed),total),scale(shift,w));sourceVariations++;
   if(n===648&&j===3){
    const {A:a,B:b}=changed;
    const parenthesized=add(sub(add(scale(a,2),scale(b,3)),sub(a,scale(b,2))),scale(sub(a,b),2));same(parenthesized,compute(changed));
   }
  }
  expected=[n===648&&j===3?'3;3':String(data[first][axis]*w),String(total[(axis+1)%3]),target.join(';'),answer.join(';')];
 }else if(n===647){
  expected=['4;-18;-9','10','1;33;4','5;15;-5'];
  same(p.A,[-1,2,0]);same(p.B,[0,-5,-2]);same(p.C,[2,1,-3]);same(p.P,sum([scale(p.B,3),scale(p.A,-2),p.C]));same(p.Q,sum([scale(p.C,3),scale(p.B,-2),p.A]));same(p.T,sub(p.Q,p.P));printedVectors+=2;
 }else{
  expected=['-1;0;0','0;-1;0','0;0;-1','-2;0;0','3;-5;7','-3/10;0;7/4','3/10;0;-7/4'];
  const orig={I:[1,0,0],J:[0,1,0],K:[0,0,1],A:[2,0,0],B:[-3,5,-7],C:[-.3,0,1.75]};
  for(const k of Object.keys(orig)){same(p[k],orig[k]);same(add(p[k],p[k+'1']),zero);same(scale(p[k+'1'],-1),p[k]);printedVectors++;}
 }
 assert.equal(expected.length,c.steps.length+1);
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(expected[i],s.input.accepted).status,'correct',id+'/'+s.id);
  for(const wrong of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(wrong,s.input.accepted).status,'wrong',id+'/'+s.id+' '+wrong);
  fields++;
 }
 assert.equal(engine.classifyAnswer(expected.at(-1),c.answer.accepted).status,'correct',id+' final');
}
assert.equal(fields,57);assert.equal(printedVectors,24);assert.equal(sourceVariations,64);
console.log('SIGNED_COORDINATE_ARITHMETIC_OK',JSON.stringify({fields,printedVectors,sourceVariations}));
