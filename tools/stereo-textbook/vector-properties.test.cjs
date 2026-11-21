'use strict';

const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./vector-properties.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available,issues} = engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const answers={
 '0561-a':['да','да','да','нет','да'], '0561-b':['да','нет','нет','да','да'], '0561-c':['да','да','нет','да','нет'],
 '0562-a':['4','нет','да','1','параллельны или совпадают'],
 '0562-b':['0','да','нет','да','параллельна или лежит в плоскости'],
 '0562-c':['нет','VU','да','нет','параллельны, пересекаются или совпадают'],
 '0563-a':['верхнем','C','C1','7','CC1'], '0563-b':['M','да','K','5','DK'],
 '0563-c':['нет','да','C1','13','A1C1'], '0563-d':['подходит','нет','B1','11','C1B1'],
 '0563-e':['4','середины','B1','5','MB1']
};
const translations={
 a:['D','D1','C','C1'], b:['C','M','D','K'], c:['A','C','A1','C1'], d:['C','B','C1','B1'], e:['K','A1','M','B1']
};
const minus=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const intersection=(p,n,k)=>dot(p,n)===k;
let fields=0,configs=0;
for(const [suffix,expected] of Object.entries(answers)){
 const id='ex-main-'+suffix,c=available.get(id),m=c.visualization.model,p=m.points;
 assert(Object.hasOwn(manifest.cards,id));viewer.prepare(m);assert.deepEqual(c.source.printedPages,[144]);assert.deepEqual(c.source.pdfPages,[146]);
 const reachable=new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]);
 assert.deepEqual(reachable,new Set(Object.keys(m.views)),id+' view access');
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(expected[i],s.input.accepted).status,'correct',id+'/'+s.id);
  for(const wrong of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(wrong,s.input.accepted).status,'wrong',id+'/'+s.id+'/'+wrong);
  fields++;
 }
 assert.equal(engine.classifyAnswer(expected[4],c.answer.accepted).status,'correct');
 if(suffix.startsWith('0561')){
  const ab=minus(p.B,p.A),cd=minus(p.D,p.C),ef=minus(p.F,p.E),tw=minus(p.W,p.T);
  for(const v of [cd,ef])assert.equal(Math.hypot(...cross(ab,v)),0);
  assert(dot(ab,cd)>0 && dot(ab,ef)<0);assert(Math.hypot(...cross(ab,tw))>0);configs+=3;
 }else if(suffix.startsWith('0562')){
  assert.deepEqual(minus(p.A1,p.A),minus(p.B1,p.B));assert.deepEqual(minus(p.B1,p.A1),minus(p.B,p.A));
  const ground=[0,0,1],vertical=[0,1,0],diagonal=[0,-1,1];
  for(const k of ['A','B','U','V'])assert(intersection(p[k],ground,0));
  for(const k of ['E','F','A1','B1'])assert(intersection(p[k],ground,2));
  for(const k of ['U','V','A1','B1'])assert(intersection(p[k],vertical,2));
  for(const k of ['A','B','A1','B1'])assert(intersection(p[k],diagonal,0));
  for(const k of ['U','V'])assert(intersection(p[k],ground,0)&&intersection(p[k],vertical,2));
  for(const k of ['A','B'])assert(!intersection(p[k],vertical,2));
  assert.equal(Math.hypot(...cross(minus(p.X,p.A),minus(p.Y,p.B))),0);assert.deepEqual(minus(p.X,p.A),minus(p.Y,p.B));configs+=3;
 }else{
  const [a,b,t,u]=translations[suffix.at(-1)];
  assert.deepEqual(m.arrows,[[a,b],[t,u]]);
  for(const matrix of [[[1,0,0],[0,1,0],[0,0,1]],[[1,1,0],[0,2,1],[1,0,1]],[[-2,1,1],[0,2,1],[0,1,1]]]){
   const q=Object.fromEntries(Object.entries(p).map(([name,v])=>[name,matrix.map(row=>dot(row,v))]));
   const v=minus(q[b],q[a]);
   assert.deepEqual(minus(q[u],q[t]),v);assert.deepEqual(Object.keys(q).filter(k=>minus(q[k],q[t]).every((x,i)=>x===v[i])),[u]);
   assert.equal(engine.classifyAnswer(u+t,c.answer.accepted).status,'wrong');configs++;
  }
 }
}
assert.deepEqual(manifest.parts,{'561':['а','б','в'],'562':['а','б','в'],'563':['а','б','в','г','д']});
assert.equal(fields,44);assert.equal(configs,33);
console.log('ATANASYAN_VECTOR_PROPERTIES_OK: printed yes/no, three incidence cases and five unique translated endpoints, 44 fields and 33 checks');
