'use strict';

const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./prism-vector-equations.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const fields={
 '0575':['A1A','C1C','да','AC1'],'0576-a':['DC1','C1','C1B','5'],'0576-b':['AB','DA','AC','10'],
 '0577-a':['BC','BC-BA','AC','7'],'0577-b':['C1C','AC','CB','9'],'0577-c':['2','B1C','BC','12']
};
const expected={'0576-a':['C1B','D1A'],'0576-b':['AC','A1C1'],'0577-a':['AC','A1C1'],'0577-b':['CB','C1B1'],'0577-c':['BC','B1C1']};
const matrices=[[[1,0,0],[0,1,0],[0,0,1]],[[2,1,0],[0,2,1],[0,0,1]],[[-1,0,1],[1,1,2],[0,1,0]]];
const sum=(...rows)=>rows.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]),eq=(a,b)=>a.every((x,i)=>Math.abs(x-b[i])<1e-9);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),vec=(p,a,b)=>sub(p[b],p[a]);
let count=0,cases=0;
for(const [suffix,aa] of Object.entries(fields)){
 const id='ex-main-'+suffix,c=available.get(id),m=c.visualization.model;assert(Object.hasOwn(manifest.cards,id));viewer.prepare(m);
 assert.deepEqual(c.source.printedPages,[149]);assert.deepEqual(c.source.pdfPages,[151]);
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(aa[i],s.input.accepted).status,'correct',id+'/'+s.id);
  for(const w of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(w,s.input.accepted).status,'wrong',id+'/'+s.id+'/'+w);count++;
 }
 for(const matrix of matrices){
  const p=Object.fromEntries(Object.entries(m.points).map(([n,v])=>[n,matrix.map(row=>dot(row,v))]));
  const at=(a,b)=>vec(p,a,b);
  if(suffix==='0575'){
   for(const o of [p.O,p.A,p.C1,[3,17,-7]]){
    p.O=o;assert(eq(sum(at('O','A'),at('O','C1')),sum(at('O','C'),at('O','A1'))));
    assert(eq(sub(at('O','A'),at('O','A1')),sub(at('O','C'),at('O','C1'))));cases++;
   }
  }else{
   const valid=new Set(),vertices=Object.keys(p);
   for(const u of vertices)for(const v of vertices){
    const x=at(u,v);let a,b;
    if(suffix==='0576-a'){a=sum(at('D','C'),at('D1','A1'),at('C','D1'),x,at('A1','C1'));b=at('D','B');}
    else if(suffix==='0576-b'){a=sum(at('D','A'),x,at('D1','B'),at('A','D1'),at('B','A'));b=at('D','C');}
    else if(suffix==='0577-a'){a=sub(sum(at('A','A1'),at('B1','C')),x);b=at('B','A');}
    else if(suffix==='0577-b'){a=sum(sub(at('A','C1'),at('B','B1')),x);b=at('A','B');}
    else{a=sum(at('A','B1'),x);b=sum(sub(at('A','C'),x),at('B','C1'));}
    const correct=eq(a,b);if(correct)valid.add(u+v);
    assert.equal(engine.classifyAnswer(u+v,c.answer.accepted).status,correct?'correct':'wrong',id+' '+u+v);
   }
   assert.deepEqual(valid,new Set(expected[suffix]));cases++;
  }
 }
}
assert.deepEqual(manifest.parts,{'575':[null],'576':['а','б'],'577':['а','б','в']});
assert.equal(count,24);assert.equal(cases,27);
console.log('ATANASYAN_PRISM_VECTOR_EQUATIONS_OK: arbitrary origins and all vertex substitutes in five original equations, 24 fields and 27 independent configurations');
