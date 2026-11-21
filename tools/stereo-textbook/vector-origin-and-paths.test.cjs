'use strict';

const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./vector-origin-and-paths.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const fields={
 '0568-a':['AB','DC','да','да'],'0568-b':['CB','DA','нет','0'],
 '0569':['DB1','DB1-DA','AK-AD','MD'],'0570-a':['0','AC','0','AB'],'0570-b':['CB','D','DB','0']
};
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),equal=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-8);
const v=(p,a,b)=>sub(p[b],p[a]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const matrices=[[[1,0,0],[0,1,0],[0,0,1]],[[2,1,0],[0,1,1],[0,0,2]],[[-1,2,0],[0,1,0],[1,1,2]]];
let steps=0,configurations=0;
for(const [suffix,answers] of Object.entries(fields)){
 const id='ex-main-'+suffix,c=available.get(id),m=c.visualization.model;
 assert(Object.hasOwn(manifest.cards,id));viewer.prepare(m);
 assert.deepEqual(c.source.printedPages,[148]);assert.deepEqual(c.source.pdfPages,[150]);
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 for(const [i,step] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(answers[i],step.input.accepted).status,'correct',id+step.id);
  for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong',id+step.id+wrong);
  steps++;
 }
 for(const matrix of matrices){
  const p=Object.fromEntries(Object.entries(m.points).map(([k,x])=>[k,matrix.map(row=>dot(row,x))]));
  if(suffix.startsWith('0568')){
   for(const o of [p.O,p.A,p.B,p.C,[100,-0.5,7]]){
    p.O=o;
    assert(equal(sub(v(p,'O','B'),v(p,'O','A')),sub(v(p,'O','C'),v(p,'O','D'))));
    assert(equal(sub(v(p,'O','B'),v(p,'O','C')),v(p,'D','A')));
    configurations++;
   }
  }else if(suffix==='0569'){
   const names=Object.keys(p);assert.equal(names.length,10);
   for(const [field,from,to,count] of [[1,'A','B1',144],[2,'D','K',156]]){
    const all=c.steps[field].input.accepted;
    const canonical=new Set(all.filter(x=>!x.includes(' ')&&!x.includes('₁')));
    const target=v(p,from,to),geometric=new Set();
    for(const a of names)for(const b of names)for(const d of names)for(const e of names){
     if(equal(sub(v(p,a,b),v(p,d,e)),target))geometric.add(a+b+'-'+d+e);
    }
    assert.equal(geometric.size,count);assert.deepEqual(canonical,geometric);
    for(const term of geometric){
     assert(all.includes(term.replace('-',' - ')));
     assert(all.includes(term.replaceAll('1','₁')));
    }
    assert.equal(engine.classifyAnswer(canonical.values().next().value.replace('-',' − '),all).status,'correct');
    configurations++;
   }
  }else{
   const ab=v(p,'A','B'),ca=v(p,'C','A'),dc=v(p,'D','C'),bc=v(p,'B','C'),cd=v(p,'C','D'),ac=v(p,'A','C');
   assert(equal(add(add(add(ab,ca),dc),add(bc,cd)),[0,0,0]));
   assert(equal(add(sub(ab,ac),dc),v(p,'D','B')));
   if(suffix==='0570-a')for(const z of ['AA','BB','CC','DD','0'])assert.equal(engine.classifyAnswer(z,c.answer.accepted).status,'correct');
   else assert.equal(engine.classifyAnswer('BD',c.answer.accepted).status,'wrong');
   configurations++;
  }
 }
}
assert.equal(steps,20);assert.equal(configurations,42);
assert.deepEqual(manifest.parts,{'568':['а','б'],'569':[null],'570':['а','б']});
console.log('ATANASYAN_VECTOR_ORIGIN_PATHS_OK: 300 valid differences from all 10,000 marked-point expressions, arbitrary origins, closed paths and 20 fields across 42 independent checks');
