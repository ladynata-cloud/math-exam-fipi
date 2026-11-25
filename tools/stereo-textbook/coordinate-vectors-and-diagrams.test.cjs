'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),manifest=require('./coordinate-vectors-and-diagrams.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const a=(u,v)=>u.map((x,i)=>x+v[i]),d=(u,v)=>u.map((x,i)=>x-v[i]),s=(u,t)=>u.map(x=>x*t),sum=ar=>ar.reduce(a,[0,0,0]);
const same=(u,v)=>assert(Math.hypot(...d(u,v))<1e-9,u+' vs '+v),dot=(u,v)=>u.reduce((v1,x,i)=>v1+x*v[i],0),mid=(u,v)=>s(a(u,v),.5);
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const key={
 '0640':['3;2;-5','-5;3;-1','1;-1;0','0;1;1','-1;0;1','0;0;-7/5','0;0;7/10'],
 '0641':['5i-j+2k','-3i-j','-j','-2k','0'],'0642':['2;0;2','0;3;2','0;0;2','2;3;0','2;3;2','2;0;2','0;3;2','-2;-3;2','2;3;-2'],
 '0643':['1;3;0','3;-1;-2','3;-7;-3','y1+y2;y1-y2'],
 '0645':['-4;0;2','0;9;-2','-4;9;0','-2;0;0','0;9/2;0','2;-9;1','2;0;1','0;-9/2;-1','0;9/2;1']
};
const directions={A:[3,-5,2],B:[0,7,-1],C:[2/3,0,0],D:[-2.7,3.1,.5]};
const sums={a:['AB',1,[3,2,1]],b:['AC',0,[11/3,-5,2]],c:['BC',0,[2/3,7,-1]],d:['DB',1,[-2.7,10.1,-.5]],
 e:['DA',0,[.3,-1.9,2.5]],f:['ABC',0,[11/3,2,1]],g:['BAD',1,[.3,5.1,1.5]],h:['ABCD',0,[29/30,5.1,1.5]]};
let fields=0,vectorArrows=0,figures=0,sumCases=0;
for(const id of Object.keys(manifest.cards)){
 const c=available.get(id),n=Number(c.source.exercise),short=id.slice(8),m=c.visualization.model,p=m.points;
 assert.deepEqual(c.source.printedPages,[167]);assert.deepEqual(c.source.pdfPages,[169]);
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(st=>st.view)]),new Set(Object.keys(m.views)));
 let values;
 if(n===644){const [letters,pos,official]=sums[id.at(-1)],v=sum([...letters].map(k=>directions[k]));same(v,official);
  const increase=[1,-2,.5],changed=a(official,increase);
  values=[String(v[pos]),String(v[(pos+1)%3]),changed.join(';'),official.join(';')];
  for(const k in directions)same(p[k],directions[k]);
  const parts=m.views.path.segments;let previous='O';
  for(const [i,k] of [...letters].entries()){
   const [start,end]=parts[i];assert.equal(start,previous);same(d(p[end],p[start]),directions[k]);previous=end;
  }
  same(p[previous],official);same(p.T,a(directions[letters[0]],increase));same(p.R,changed);
  for(const mat of [[[1,0,0],[0,1,0],[0,0,1]],[[0,1,-1],[1.5,0,0],[0,1,2]],[[1,1,0],[0,1,1],[2,0,1]]]){
   const apply=v=>mat.map(row=>dot(row,v));same(apply(p[previous]),sum([...letters].map(k=>apply(p[k]))));same(apply(p.R),a(apply(p[previous]),apply(increase)));sumCases++;
  }
 }else values=key[short];
 assert(values,id);assert.equal(values.length,c.steps.length+1);
 for(const [i,st] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(values[i],st.input.accepted).status,'correct',id+' '+st.id);
  for(const w of wrongStepAnswers(id,st))assert.equal(engine.classifyAnswer(w,st.input.accepted).status,'wrong',id+' '+st.id+' '+w);
  fields++;
 }
 assert.equal(engine.classifyAnswer(values.at(-1),c.answer.accepted).status,'correct',id+' final');
 if(n===640){for(const [name,v] of Object.entries({A:[3,2,-5],B:[-5,3,-1],C:[1,-1,0],D:[0,1,1],M:[-1,0,1],N:[0,0,.7]}))same(p[name],v);}
 if(n===641){same(p.A,[5,-1,2]);same(p.B,[-3,-1,0]);same(p.C,[0,-1,0]);same(p.O,[0,0,0]);assert(!m.arrows.some(([a,b])=>a===b));assert.equal(engine.classifyAnswer('2*k + 5*i - j',c.steps[0].input.accepted).status,'correct');}
 if(n===643){same(p.S,a(p.A,p.B));same(p.D,d(p.A,p.B));same(d(p.S,p.A),p.B);
  for(const u of [[1,0,0],[0,0,0],[-4,1,3]])for(const v of [[0,-3,2],[0,0,0],[4,5,6]])same(d(a(u,v),v),u);}
 if(n===642||n===645){
  const mainPaths=n===642?[['O','A1'],['O','B1'],['O','O1'],['O','C'],['O','C1'],['B','C1'],['A','C1'],['O1','C']]:[['A','C'],['C','B'],['A','B'],['M','N'],['N','P'],['B','M'],['O','M'],['O','P']];
  const ends=n===642?[[2,0,2],[0,3,2],[0,0,2],[2,3,0],[2,3,2],[2,0,2],[0,3,2],[2,3,-2]]:[[-4,0,2],[0,9,-2],[-4,9,0],[-2,0,0],[0,4.5,0],[2,-9,1],[2,0,1],[0,4.5,1]];
  for(const [i,[from,to]] of mainPaths.entries()){
   same(d(p[to],p[from]),ends[i]);assert(Object.values(m.views).some(view=>view.segments.some(([x,y])=>x===from&&y===to)));vectorArrows++;
  }
  if(n===642){
   same(p.A,[2,0,0]);same(p.B,[0,3,0]);same(p.O1,[0,0,2]);same(p.C,a(p.A,p.B));
   assert.equal(m.faces.length,6);assert.equal(m.edges.length,12);
   for(const k of ['O','A','B','C'])same(d(p[k+'1'],p[k]),p.O1);
  }else{same(p.A,[4,0,0]);same(p.B,[0,9,0]);same(p.C,[0,0,2]);same(p.M,mid(p.A,p.C));same(p.N,mid(p.O,p.C));same(p.P,mid(p.C,p.B));}
  figures++;
 }
}
assert.equal(fields,53);assert.equal(figures,2);assert.equal(vectorArrows,16);assert.equal(sumCases,24);
console.log('COORDINATE_VECTORS_AND_DIAGRAMS_OK',JSON.stringify({fields,figures,vectorArrows,sumCases}));
