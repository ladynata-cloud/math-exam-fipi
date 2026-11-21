'use strict';
const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const review = require('./centroids-in-tetrahedra.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(...vs)=>vs.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]);
const scale=(v,k)=>v.map(x=>x*k),sub=(a,b)=>add(a,scale(b,-1));
const dot=(x,y)=>x.reduce((v,n,i)=>v+n*y[i],0),norm=x=>Math.hypot(...x);
const mean=vs=>scale(add(...vs),1/vs.length),v=(p,a,b)=>sub(p[b],p[a]);
const near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' vs '+b);
const same=(a,b)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>near(x,b[i]));};
const combine=(basis,ks)=>add(...basis.map((x,i)=>scale(x,ks[i])));
const det=([a,b,c],[d,e,f],[g,h,i])=>a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
const part605={
 a:['A','C',[1,1,0],'C','M',[-.5,-1,0]], b:['C','M',[-.5,-1,0],'M','C',[.5,1,0]],
 c:['C1','N',[-1,-.5,0],'N','C1',[1,.5,0]],d:['A','C1',[1,1,1],'A','C',[1,1,0]],
 e:['A1','N',[0,.5,0],'N','A1',[0,-.5,0]],f:['A','N',[0,.5,1],'A1','N',[0,.5,0]],
 g:['M','D',[-.5,1,0],'D','M',[.5,-1,0]]
};
const part607={
 a:['D','N',[1/3,1/3,1/3],'N','D',[-1/3,-1/3,-1/3],'1'],
 b:['D','K',[.25,.25,.25],'K','N',[1/12,1/12,1/12],'3/4'],
 c:['A','M',[-1,1/3,1/3],'M','A',[1,-1/3,-1/3],'-1'],
 d:['M','K',[.25,-1/12,-1/12],'K','M',[-.25,1/12,1/12],'-1/12']
};
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
let fields=0,affineModels=0,altitudes=0;
for(const id of Object.keys(review.cards)){
  const card=available.get(id), model=card.visualization.model,n=Number(card.source.exercise),part=id.at(-1);
  const pages=n===609?[155,156]:[155];assert.deepEqual(card.source.printedPages,pages);assert.deepEqual(card.source.pdfPages,pages.map(n=>n+2));
  viewer.prepare(model);assert.deepEqual(new Set(['neutral',...card.help.map(h=>h.view),...card.steps.map(s=>s.view)]),new Set(Object.keys(model.views)));
  let answers;
  if(n===604)answers=['3/10','7/10','7/10;3/20;3/20','3/5;1/5;1/5'];
  if(n===605){
    const [,,ks,,,transfer]=part605[part];answers=[String(ks[2]),String(ks[0]),ks[2]?'нет':ks.slice(0,2).join(';'),transfer.slice(0,2).join(';')];
  }
  if(n===606)answers=['3','-1','-1;-1;3','3;-1;-1'];
  if(n===607){
    const [,,ks,,,transfer,intermediate]=part607[part];
    answers=['ab'.includes(part)?'1/3;1/3;1/3':'0;1/3;1/3',intermediate,ks.join(';'),transfer.join(';')];
    // Check regularity, both perpendiculars, and the actual intersection under three similarities.
    for(const q of [.5,1,11]){
      const p=Object.fromEntries(Object.entries(model.points).map(([s,x])=>[s,add(scale([x[2],-x[0],x[1]],q),[2,-3,5])]));
      const distances=['AB','AC','AD','BC','BD','CD'].map(([a,b])=>norm(v(p,a,b)));distances.forEach(d=>near(d,distances[0]));
      near(dot(v(p,'A','M'),v(p,'B','C')),0);near(dot(v(p,'A','M'),v(p,'B','D')),0);
      near(dot(v(p,'D','N'),v(p,'A','B')),0);near(dot(v(p,'D','N'),v(p,'A','C')),0);
      same(v(p,'D','K'),scale(v(p,'D','N'),.75));same(v(p,'A','K'),scale(v(p,'A','M'),.75));altitudes+=2;
    }
  }
  if(n===608)answers=['3','сонаправлены','<','sqrt(3)'];
  if(n===609)answers=['1/3','2/3','1/3','14'];
  assert.equal(answers.length,card.steps.length);
  for(const [i,s] of card.steps.entries()){
    assert.equal(engine.classifyAnswer(answers[i],s.input.accepted).status,'correct',id+'/'+s.id);
    for(const wrong of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(wrong,s.input.accepted).status,'wrong',id+'/'+s.id);
    fields++;
  }
  for(const mat of [[[1,0,0],[0,1,0],[0,0,1]],[[2,1,0],[0,1,-1],[0,0,2]],[[-1,2,1],[1,1,0],[0,1,3]]]){
    const p=Object.fromEntries(Object.entries(model.points).map(([k,x])=>[k,add(mat.map(r=>dot(r,x)),[2,-1,4])]));
    const r=(a,b)=>v(p,a,b);
    if(n===604){
      const basis=['A','B','C'].map(a=>r('D',a));
      same(p.A1,mean([p.B,p.C]));same(r('A','K'),scale(r('A','A1'),.3));
      same(r('D','K'),combine(basis,[.7,.15,.15]));
      same(add(r('D','A'),scale(r('A','A1'),.4)),combine(basis,[.6,.2,.2]));
    }else if(n===605){
      const [a,b,w,c,d,q]=part605[part],basis=[r('A','B'),r('A','D'),r('A','A1')];
      same(p.M,mean([p.A,p.B]));same(p.N,mean([p.A1,p.D1]));
      assert(Math.abs(det(...basis))>1);same(r(a,b),combine(basis,w));same(r(c,d),combine(basis,q));
      near(det(basis[0],basis[1],r(a,b))/det(...basis),w[2]);
      assert.equal(Object.hasOwn(card.answer,'accepted'),true);
      const accepted=card.answer.accepted;
      assert.equal(engine.classifyAnswer(w[2]?'нет':w.slice(0,2).join(';'),accepted).status,'correct');
      assert.notEqual(engine.classifyAnswer(w[2]?w.slice(0,2).join(';'):'нет',accepted).status,'correct');
    }else if(n===606){
      same(p.M,mean([p.A,p.B,p.C]));const basis=['B','C','M'].map(a=>r('O',a));assert(Math.abs(det(...basis))>.01);
      same(r('O','A'),combine(basis,[-1,-1,3]));same(r('O','B'),combine(['M','A','C'].map(a=>r('O',a)),[3,-1,-1]));
    }else if(n===607){
      const [a,b,w,c,d,q]=part607[part],basis=['A','B','C'].map(a=>r('D',a));
      same(p.M,mean([p.B,p.C,p.D]));same(p.N,mean([p.A,p.B,p.C]));same(p.K,mean([p.A,p.B,p.C,p.D]));
      same(r(a,b),combine(basis,w));same(r(c,d),combine(basis,q));
    }else if(n===608){
      const rays=['B','C','D'].map(a=>r('A',a));assert(Math.abs(det(...rays))>1);same(r('A','O'),mean(rays));
      assert(3*norm(r('A','O'))<rays.reduce((s,a)=>s+norm(a),0)-1e-6);
      near(norm(mean([[3,0,0],[0,3,0],[0,0,3]])),Math.sqrt(3));
    }else{
      const entire=r('A','C1');same(p.M1,mean([p.A1,p.B,p.D]));same(p.M2,mean([p.C,p.B1,p.D1]));
      for(const [a,b] of [['A','M1'],['M1','M2'],['M2','C1']])same(r(a,b),scale(entire,1/3));
    }
    affineModels++;
  }
}
assert.equal(fields,60);assert.equal(affineModels,45);assert.equal(altitudes,24);
console.log('CENTROIDS_IN_TETRAHEDRA_OK',JSON.stringify({fields,affineModels,altitudes}));
