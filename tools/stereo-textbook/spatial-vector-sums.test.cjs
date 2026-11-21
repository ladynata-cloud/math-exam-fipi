'use strict';

const assert=require('node:assert/strict'),crypto=require('node:crypto');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./spatial-vector-sums.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const answerRows={
 'theory-065':['AC','5','DB','13'], 'theory-066':['5','13','0','26'], 'theory-067':['2','-1.5','0','6'],
 'ex-main-0564-a':['B','BC','AC','5'], 'ex-main-0564-b':['B','C1','AC1','7'],
 'ex-main-0564-c':['B1','B','C1B','13'], 'ex-main-0564-d':['D1','D1B1','DB1','13'],
 'ex-main-0564-e':['B1','B1C1','DC1','17'], 'ex-main-0565-a':['AD','AD','нет','DA'],
 'ex-main-0565-b':['AC','AC','нет','CA'], 'ex-main-0565-c':['BC','BC','нет','CB']
};
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]);
const scale=(a,k)=>a.map(x=>x*k),equal=(a,b)=>a.every((x,i)=>Math.abs(x-b[i])<1e-8);
const coords=(p,a,b)=>sub(p[b],p[a]),norm=a=>Math.hypot(...a),dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const expr={
 a:[['A','B'],['A1','D1'],['AC','A1C1']], b:[['A','B'],['A','D1'],['AC1']],
 c:[['D','A'],['B1','B'],['C1B','D1A']], d:[['D','D1'],['D','B'],['DB1']],
 e:[['D','B1'],['B','C'],['DC1','AB1']]
};
const proof={a:['AB','BD','AC','CD','AD'], b:['AB','BC','DC','AD','AC'], c:['DC','BD','AC','BA','BC']};
const matrices=[[[1,0,0],[0,1,0],[0,0,1]],[[2,1,0],[0,1,1],[0,0,2]],[[1,-2,1],[0,2,1],[0,0,1]]];
let fields=0,configs=0;
for(const [id,aa] of Object.entries(answerRows)){
 const c=available.get(id),m=c.visualization.model,p=m.points;
 assert(Object.hasOwn(manifest.cards,id));viewer.prepare(m);
 const pages=id==='theory-065'?[145,146]:id==='theory-066'?[146,147]:id==='theory-067'?[147,148]:[148];
 assert.deepEqual(c.source.printedPages,pages);assert.deepEqual(c.source.pdfPages,pages.map(n=>n+2));
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(aa[i],s.input.accepted).status,'correct',id+'/'+s.id);
  for(const w of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(w,s.input.accepted).status,'wrong',id+'/'+s.id+'/'+w);
  fields++;
 }
 if(id==='theory-065'){
  assert(equal(add(coords(p,'A','B'),coords(p,'B','C')),coords(p,'A','C')));
  assert(equal(sub(coords(p,'A','B'),coords(p,'A','D')),coords(p,'D','B')));
  assert.equal(norm(coords(p,'A','C')),5);configs+=3;
 }else if(id==='theory-066'){
  const ends=['O','A','B','C','D','E','O'];
  let v=[0,0,0];for(let i=1;i<ends.length;i++)v=add(v,coords(p,ends[i-1],ends[i]));
  assert(equal(v,[0,0,0]));assert.equal(norm(coords(p,'O','C')),13);
  assert.equal(dot(coords(p,'O','B'),coords(p,'B','C')),0);configs+=3;
 }else if(id==='theory-067'){
  const a=coords(p,'O','A'),d=coords(p,'O','D');assert(equal(scale(a,-1.5),coords(p,'O','C')));
  for(const [k,l] of [[-2,-3],[2,-.5],[0,3],[.25,6]]){
   assert(equal(scale(scale(a,l),k),scale(a,k*l)));
   assert(equal(scale(add(a,d),k),add(scale(a,k),scale(d,k))));
   assert(equal(scale(a,k+l),add(scale(a,k),scale(a,l))));configs++;
  }
 }else{
  for(const matrix of matrices){
   const q=Object.fromEntries(Object.entries(p).map(([name,v])=>[name,matrix.map(row=>dot(row,v))]));
   if(id.includes('0564')){
    const [a,b,allowed]=expr[id.at(-1)],v=add(coords(q,...a),coords(q,...b));
    const vertices=['A','B','C','D','A1','B1','C1','D1'];
    const equivalents=[];for(const start of vertices)for(const end of vertices)if(equal(coords(q,start,end),v))equivalents.push(start+end);
    assert.deepEqual(new Set(equivalents),new Set(allowed));
    for(const start of vertices)for(const end of vertices){
     const status=engine.classifyAnswer(start+end,c.answer.accepted).status;
     assert.equal(status,equivalents.includes(start+end)?'correct':'wrong',id+' '+start+end);
    }
   }else{
    const [a,b,c,d,res]=proof[id.at(-1)];
    assert(equal(add(coords(q,...a),coords(q,...b)),coords(q,...res)));
    assert(equal(add(coords(q,...c),coords(q,...d)),coords(q,...res)));
   }
   configs++;
  }
 }
}
// Native frozen-hash compatibility, including sparse-like values present in custom JS checks.
// No production course or review input may be changed by a projection.
const inc=require('./inscribed-solids-predecessor.cjs').spatialVectorSums;
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
const fixture={z:0,10:'ten',2:'two',missing:undefined,lessons:[{b:2,a:1},null,undefined],catalog:{entries:[]}};
assert.equal(inc.digest(fixture),crypto.createHash('sha256').update(JSON.stringify(canon(fixture))).digest('hex'));
const index=require('../../stereo-course/textbook/source-index.json');
const prior=inc.indexBefore(index);
assert(!prior.entries.find(e=>e.source.collection==='main'&&e.source.exercise==='564').requiredParts);
assert.deepEqual(index.entries.find(e=>e.source.collection==='main'&&e.source.exercise==='564').requiredParts,['а','б','в','г','д']);
assert.deepEqual(manifest.parts,{
 '564':['а','б','в','г','д'],'565':['а','б','в'],'theory-65':[null],'theory-66':[null],'theory-67':[null]
});
assert.equal(fields,44);assert.equal(configs,34);
console.log('ATANASYAN_SPATIAL_VECTOR_SUMS_OK: points 65–67, all vertex-to-vertex answers in 564, both proof paths in 565, 44 fields and 34 independent checks');
