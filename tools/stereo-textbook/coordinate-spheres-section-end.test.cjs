'use strict';
const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const receipt = require('./coordinate-spheres-section-end.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const cases = {
 '0678-a': [[2,-4,7],9], '0678-b': [[0,0,0],2], '0678-c': [[2,0,0],16],
 '0679-a': [[-2,2,0],54,[5,0,-1]], '0679-b': [[-2,2,0],8,[0,0,0]], '0679-c': [[0,0,0],35,[5,3,1]],
 '0680-a': [[0,0,0],49], '0680-b': [[3,-2,0],2],
 '0681-a': [[2,0,0],4,[[-4,0,0],0]], '0681-b': [[0,1,0],25,[[0,-2,0],24]],
 '0681-c': [[-1,0,0],4,[[2,0,0],3]], '0681-d': [[.5,-1.5,1],6,[[-1,3,-2],2.5]]
};
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const distanceSquared=(a,b)=>dot(sub(a,b),sub(a,b));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} versus ${b}`);
const correct=(input,accepted)=>assert.equal(engine.classifyAnswer(input,accepted).status,'correct',input);
const decimal=v=>v.map(x=>String(x)).join(';');
let fields=0, surfaceChecks=0, proofChecks=0, reversedHeights=0;
for(const id of Object.keys(receipt.cards)) {
 const c=available.get(id),s=id.slice(8),n=Number(c.source.exercise),model=c.visualization.model,p=model.points;
 viewer.prepare(model);
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(st=>st.view)]),new Set(Object.keys(model.views)));
 assert.deepEqual(c.source.printedPages,[n<679?170:171]);
 assert.deepEqual(c.source.pdfPages,[n<679?172:173]);
 for(const step of c.steps) for(const w of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(w,step.input.accepted).status,'wrong',id+' '+w);
 if(n===677){
  near(distanceSquared(p.C,p.H),25);
  assert.deepEqual(p.H,p.A.map((x,i)=>(x+p.B[i])/2));
  near(distanceSquared(p.D,p.H),169);near(distanceSquared(p.T,p.H),169);
  const [a,b,m]=[p.B[1],p.A[0],p.D[2]];
  for(const scale of [0.5,1,2]) for(const aa of [a,a+1]) for(const bb of [b,b+2]) for(const direction of [-1,1]){
   const h=[bb/2,aa/2,0],d=[0,0,direction*scale*m];near(distanceSquared(d,h),(aa*aa+bb*bb)/4+(scale*m)**2);reversedHeights++;
  }
  ['5','13','13'].forEach((v,i)=>correct(v,c.steps[i].input.accepted));
  correct('sqrt((a^2+b^2)/4+m^2)',c.answer.accepted);
  assert.notEqual(engine.classifyAnswer('sqrt((a^2+b^2+m^2)/4)',c.answer.accepted).status,'correct');
 }else{
  const [center,r2,extra]=cases[s];assert.deepEqual(p.A,center);near(distanceSquared(p.A,p.N),r2);
  near(distanceSquared(p.A,p.T),r2);near(distanceSquared(p.A,p.Q),4*r2);
  for(const [k,v] of Object.entries(p)) if(k.startsWith('_s')){near(distanceSquared(center,v),r2);surfaceChecks++;}
  let answers;
  if(n===678||n===679){
   if(n===679)assert.deepEqual(p.N,extra);
   answers=[decimal(center.map(x=>-x)),String(r2),String(4*r2)];
   const terms=center.map((x,i)=>(x?'('+'xyz'[i]+(x<0?'+':'-')+Math.abs(x)+')':'xyz'[i])+'^2');
   correct(terms.join('+')+'='+r2,c.answer.accepted);
   correct(terms.reverse().join('+').replaceAll('^2','²')+'='+r2,c.answer.accepted);
   assert.notEqual(engine.classifyAnswer(terms.join('+')+'='+String(r2+1),c.answer.accepted).status,'correct');
   if(s==='0678-b')assert.match(c.statement.text,/√2/);
  }else{
   const sumSquares=dot(center,center);answers=[decimal(center),String(n===681?sumSquares:r2),String(4*r2)];
   const r=Math.sqrt(r2);correct(decimal(center)+';'+(Number.isInteger(r)?r:'sqrt('+r2+')'),c.answer.accepted);
   if(n===681){const [linear,rhs]=extra;
    for(let i=0;i<3;i++) near(linear[i],-2*center[i]);near(rhs+sumSquares,r2);
    for(const v of [[0,0,0],center,p.N,p.T,p.Q,[2,-5,7],[.25,.5,-3],...Object.entries(p).filter(([k])=>k.startsWith('_s0_')).map(([,v])=>v)]){
     near(dot(v,v)+dot(linear,v)-rhs,distanceSquared(v,center)-r2);proofChecks++;
    }
    assert(r2>0);
   }
  }
  answers.forEach((v,i)=>correct(v,c.steps[i].input.accepted));
 }
 fields+=c.steps.length;
}
assert.deepEqual(Object.keys(receipt.cards).sort(),['ex-main-0677',...Object.keys(cases).map(s=>'ex-main-'+s)].sort());
for(let n=637;n<=681;n++){
 const cards=bank.catalog.entries.filter(e=>e.source.collection==='main'&&e.source.exercise===String(n));
 assert(cards.length && cards.every(c=>c.status==='reviewed' && available.has(c.id)),String(n));
}
for(let n=71;n<=75;n++)assert(available.has('theory-0'+n));
assert.equal(fields,39);assert.equal(surfaceChecks,864);assert.equal(reversedHeights,24);assert.equal(proofChecks,124);
console.log(`VII §1 complete, five theories and 45 printed exercises. Checked 13 final lessons, ${fields} addressed steps, six complete equations, ${surfaceChecks} surface points, ${proofChecks} independent polynomial identities and ${reversedHeights} perpendicular-height cases.`);
