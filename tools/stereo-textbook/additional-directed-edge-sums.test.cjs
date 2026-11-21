'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./additional-directed-edge-sums.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(...vs)=>vs.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]),scale=(x,k)=>x.map(v=>v*k);
const sub=(a,b)=>add(a,scale(b,-1)),v=(p,a,b)=>sub(p[b],p[a]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const close=(x,y)=>Math.hypot(...sub(x,y))<1e-8,same=(x,y)=>assert(close(x,y),JSON.stringify([x,y]));
const directed=(p,edges)=>add(...edges.split(' ').map(e=>v(p,...e.split('-'))));
const rows={
 '0613-a':['MQ','2','2','0','2'], '0613-b':['P1Q1','1','1','1','1'], '0613-c':['Q','1','1','1','1'],
 '0614-a':['D','2','DB','1','DB'], '0614-b':['FC','2','EC','1','EC'], '0614-c':['2','2','-2','-2','2'],
 '0615':['0','1','3;-2;-2','3;-2;-2'], '0616-a':['AD','C','AC','CA','AC'],'0616-b':['AC','B','AB','BA','AB'],'0616-c':['AC','A','0','AD','0'],
 '0617-a':['0','1','AD1','D1A','AD1'],'0617-b':['0','1','AC1','C1A','AC1'],'0617-c':['0','-1','DB','BD','DB'],'0618':['0','BC','1','3;1;1','AB']
};
const box={
 a:['A-B B1-C1 D-D1 C-D','A','D1'], b:['B1-C1 A-B D-D1 C-B1 B-C A1-A','A','C1'], c:['B-A A-C C-B D-C D-A','D','B']
},tetra={a:['A-B B-D D-C','A','C'],b:['A-D C-B D-C','A','B'],c:['A-B C-D B-C D-A','A','A']};
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
let fields=0,names=0,affine=0,figures=0;
for(const [suffix,answers] of Object.entries(rows)){
 const id='ex-main-'+suffix,c=available.get(id),m=c.visualization.model,n=Number(c.source.exercise),p0=m.points,part=suffix.at(-1);
 assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(c.source.printedPages,[157]);assert.deepEqual(c.source.pdfPages,[159]);
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(answers[i],s.input.accepted).status,'correct',id+'/'+s.id);
  for(const bad of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(bad,s.input.accepted).status,'wrong',id+'/'+s.id+' '+bad);fields++;
 }
 assert.equal(engine.classifyAnswer(answers.at(-1),c.answer.accepted).status,'correct',id+' final');
 if(n===614){
  const names=['A','B','C','D','E','F'];
  const actual=m.edges.map(edge=>edge.toSorted().join('')).sort(),opposites=['AF','BD','CE'];
  const expected=names.flatMap((a,i)=>names.slice(i+1).map(b=>a+b)).filter(e=>!opposites.includes(e)).sort();
  assert.deepEqual(actual,expected);assert.equal(m.faces.length,8);
  const edgeLength=Math.hypot(...v(p0,'A','B'));
  for(const e of actual)assert(Math.abs(Math.hypot(...v(p0,...e))-edgeLength)<1e-8);
  for(const e of opposites)same(add(p0[e[0]],p0[e[1]]),scale(p0.O,2));
  for(const face of m.faces){assert.equal(face.length,3);for(const [i,a] of face.entries())assert(actual.includes([a,face[(i+1)%3]].sort().join('')));}
  figures++;
 }
 for(const mat of [[[1,0,0],[0,1,0],[0,0,1]],[[2,.5,0],[0,1,-1],[0,0,2]],[[-1,0,1],[1,-2,0],[0,1,3]]]){
  const p=Object.fromEntries(Object.entries(p0).map(([k,x])=>[k,add(mat.map(row=>dot(row,x)),[2,-1,4])]));
  const sum=edges=>directed(p,edges),r=(a,b)=>v(p,a,b);
  if(n===613){
   if(part==='a'){same(sum('M-Q M1-Q1'),sum('N1-P1 N-P'));same(sum('M-Q Q1-M1'),[0,0,0]);}
   if(part==='b'){same(sum('P-Q N-P1'),r('N','Q1'));same(sub(r('N','P1'),r('N','Q1')),r('M','N'));}
   if(part==='c'){same(sum('Q1-P1 Q-Q1'),r('Q','P1'));same(sum('Q1-P1 Q-Q1 Q1-Q'),r('M','N'));}
  }else if(n===614){
   if(part==='a'){same(sum('A-B F-B'),r('D','B'));same(sum('B-A B-F'),r('B','D'));}
   if(part==='b'){same(sub(r('A','C'),r('C','F')),r('E','C'));same(sum('C-A C-F'),r('C','E'));}
   if(part==='c'){same(sum('A-B A-C A-D A-E'),scale(r('A','F'),2));same(sum('B-A C-A D-A E-A'),scale(r('A','F'),-2));}
  }else if(n===615){
   same(r('O','T'),scale(r('O','B'),-1));same(r('O','C'),add(r('O','A'),r('O','T')));same(add(r('O','C'),r('O','B')),r('O','A'));
   same(r('O','Z'),scale(r('O','Y'),-1));same(r('O','W'),add(r('O','X'),r('O','Z')));same(v(p0,'O','W'),[3,-2,-2]);
  }else if(n===616||n===617){
   const [edges,start,end]=(n===616?tetra:box)[part],wanted=sum(edges);same(wanted,r(start,end));
   // Every actual pair of named vertices is checked, including equal alternative names on parallel edges.
   for(const a of Object.keys(p))for(const b of Object.keys(p)){
    const expected=close(r(a,b),wanted),typed=a+b;
    assert.equal(engine.classifyAnswer(typed,c.answer.accepted).status==='correct',expected,id+' '+typed);names++;
   }
   if(n===616&&part==='c')same(sum('A-B B-C C-D'),r('A','D'));
  }else{
   same(r('O','P'),r('A','A1'));same(r('O','P'),r('B','B1'));same(r('O','P'),r('C','C1'));
   for(const [a,b] of [['A','B'],['B','C'],['C','A']])same(r(a,b),r(a+'1',b+'1'));
   same(r('X','Y'),r('X1','Y1'));same(scale(v(p0,'X','Y'),4),[3,1,1]);same(scale(v(p0,'X','X1'),4),[4,-2,5]);
  }
  affine++;
 }
}
assert.equal(fields,55);assert.equal(affine,42);assert.equal(figures,3);assert.equal(names,720);
console.log('ADDITIONAL_DIRECTED_EDGE_SUMS_OK',JSON.stringify({fields,affine,figures,names}));
