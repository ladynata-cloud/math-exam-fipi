'use strict';

const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./opposite-and-difference-vectors.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const vals={
 '0566-a':['BC','AD','4','7'],'0566-b':['AB1','DC1','2','0'],
 '0566-c':['CD','BA','4','4'],'0566-d':['B1A1','BA','4','A1B1'],
 '0567-a':['A1B','BA','A1A','6'],'0567-b':['DA','CD','CA','15'],'0567-c':['D1C1','B','AA1','9'],
 '0567-d':['A1B','BC','A1C','13'],'0567-e':['D1C1','DC','AC','13']
};
const targets={
 '0566-a':['BC','AD','A1D1','B1C1'],'0566-b':['AB1','DC1'],'0566-c':['CD','BA','B1A1','C1D1'],'0566-d':['B1A1','C1D1','CD','BA'],
 '0567-a':['A1A','B1B','C1C','D1D'],'0567-b':['CA','C1A1'],'0567-c':['AA1','BB1','CC1','DD1'],'0567-d':['A1C'],'0567-e':['AC','A1C1']
};
const source={'0566-a':'C,B','0566-b':'B1,A','0566-c':'D,C','0566-d':'A1,B1'};
const abc={a:['C1','D1'],b:['B','A1'],c:['A','D']};
const subtract={'0567-a':['a','b'],'0567-b':['a','c'],'0567-c':['b','a'],'0567-d':['c','b'],'0567-e':['c','a']};
const axisCodes={A:'000',B:'100',C:'110',D:'010',A1:'001',B1:'101',C1:'111',D1:'011'};
const vertices=Object.keys(axisCodes);
const sub=(a,b)=>a.map((n,i)=>n-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const diff=(p,a,b)=>sub(p[b],p[a]),equal=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-9);
const faceEdge=(a,b)=>[0,1,2].filter(i=>axisCodes[a][i]!==axisCodes[b][i]).length===1;
function permutations(values){return values.length===1?[values]:values.flatMap((v,i)=>permutations(values.filter((_,j)=>j!==i)).map(row=>[v,...row]));}
const matrices=[[[1,0,0],[0,1,0],[0,0,1]],[[2,1,0],[0,2,1],[0,0,1]],[[-1,3,0],[0,2,1],[0,1,2]]];
let checks=0,configs=0;
for(const [suffix,fields] of Object.entries(vals)){
 const id='ex-main-'+suffix,c=available.get(id),m=c.visualization.model;
 assert(Object.hasOwn(manifest.cards,id));viewer.prepare(m);
 assert.deepEqual(c.source.printedPages,[148]);assert.deepEqual(c.source.pdfPages,[150]);
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(fields[i],s.input.accepted).status,'correct',id+'/'+s.id);
  for(const w of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(w,s.input.accepted).status,'wrong',id+'/'+s.id+'/'+w);checks++;
 }
 for(const mat of matrices){
  const p=Object.fromEntries(Object.entries(m.points).map(([k,v])=>[k,mat.map(row=>dot(row,v))]));
  const opposites=suffix.startsWith('0566');
  const [first,second]=opposites?[source[suffix].split(','),null]:subtract[suffix].map(k=>abc[k]);
  const result=opposites?diff(p,...first).map(x=>-x):sub(diff(p,...first),diff(p,...second));
  const all=[],strict=[];
  for(const u of vertices)for(const v of vertices){
   const yes=equal(diff(p,u,v),result);
   if(yes){all.push(u+v);if(faceEdge(u,v))strict.push(u+v);}
   if(!opposites)assert.equal(engine.classifyAnswer(u+v,c.answer.accepted).status,yes?'correct':'wrong');
  }
  assert.deepEqual(new Set(all),new Set(targets[suffix]));
  if(opposites){
   assert.deepEqual(new Set(strict),new Set(suffix==='0566-b'?[]:targets[suffix]));
   for(const permutation of permutations(all))assert.equal(engine.classifyAnswer(permutation.join(','),c.answer.accepted).status,'correct');
   assert.equal(engine.classifyAnswer(all.slice(1).join(','),c.answer.accepted).status,'wrong');
   assert.equal(engine.classifyAnswer(all.concat(all[0]).join(','),c.answer.accepted).status,'wrong');
  }
  configs++;
 }
}
assert.deepEqual(manifest.parts,{'566':['а','б','в','г'],'567':['а','б','в','г','д']});
assert.equal(checks,36);assert.equal(configs,27);
console.log('ATANASYAN_OPPOSITE_DIFFERENCE_OK: all 64 vertex pairs in nine source subparts, affine checks and printed diagonal exception 566b, 36 fields and 27 models');
