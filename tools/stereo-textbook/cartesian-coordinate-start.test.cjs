'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),receipt=require('./cartesian-coordinate-start.json'),source=require('../../stereo-course/textbook/source-index.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const sum=(a,b)=>a.map((x,i)=>x+b[i]),diff=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,t)=>a.map(x=>x*t),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>Math.hypot(...a),close=(a,b)=>assert(Math.abs(a-b)<1e-9,a+' '+b),same=(a,b)=>close(norm(diff(a,b)),0);
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const given={A:[3,-1,0],B:[0,0,-7],C:[2,0,0],D:[-4,0,3],E:[0,-1,0],F:[1,2,3],G:[0,5,-7],H:[-Math.sqrt(5),Math.sqrt(3),0]};
const points638={A:[2,-3,5],B:[3,-5,.5],C:[-Math.sqrt(3),-Math.sqrt(2)/2,Math.sqrt(5)-Math.sqrt(3)]};
const sourceTheory={'071':[[160,161],['-2;2','-2;3;0','0;-1;0','0;0;2']],'072':[[161,162,163],['2;-1;1','3;-3;0','-2;1;-1','1;1;2']],
 '073':[[163,164],['-1;2;1','-3;2;-2','1;-3;2','3;-2;2']],'074':[[164,165],['1;0;2','36','5','6']],'075':[[166],['4','1','4','2']]};
const coordinates=a=>a.join(';');let fields=0, testedProjections=0,acceptedMembershipGroups=0;
function graded(id,c,values){
 for(const [i,s] of c.steps.entries()){assert.equal(engine.classifyAnswer(values[i],s.input.accepted).status,'correct',id+' '+s.id);
  for(const wrong of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(wrong,s.input.accepted).status,'wrong',id+' '+s.id+' '+wrong);
  fields++;
 }
 assert.equal(values.length,c.steps.length+1);assert.equal(engine.classifyAnswer(values.at(-1),c.answer.accepted).status,'correct',id+' final');
}
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),m=c.visualization.model,p=m.points;
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 const n=Number(c.source.exercise||c.source.point),part=id.at(-1);
 const coordinatesAt=source.entries.find(e=>e.source.collection===c.source.collection&&e.source.point===c.source.point&&e.source.exercise===c.source.exercise);
 assert.deepEqual(c.source.printedPages,coordinatesAt.source.printedPages);
 assert.deepEqual(c.source.pdfPages,c.source.printedPages.map(n=>n+2));
 if(n<100){const [pages,vals]=sourceTheory[id.slice(-3)];assert.deepEqual(c.source.printedPages,pages);graded(id,c,vals);
  if(n===71){same(p.U,[p.M[0],0,0]);same(p.V,[...p.M.slice(0,2),0]);same(p.H,[0,0,p.M[2]]);same(p.T,[2,-1,0]);}
  if(n===72){same(p.S,sum(p.A,p.B));same(p.D,diff(p.A,p.B));same(p.T,scale(p.A,-1));for(const k of ['I','J','K'])close(norm(p[k]),1);}
  if(n===73){same(p.D,diff(p.B,p.A));same(p.D,diff(p.V,p.U));}
  if(n===74){same(p.M,scale(sum(p.A,p.B),.5));same(p.D,diff(p.B,p.A));close(norm(p.D),6);close(norm(p.T),5);}
  if(n===75){close(norm(diff(p.M,p.C)),2);close(norm(diff(p.T,p.C)),2);close(norm(diff(p.P,p.C)),1);
   const rings=Object.keys(p).filter(k=>k.startsWith('_r'));assert.equal(rings.length,72);
   for(const name of rings){const s=diff(p[name],p.C),j=Number(name[2]);close(norm(s),2);close(s[[2,1,0][j]],0);}
  }
 }else if(n===637){
  for(const k in given)same(p[k],given[k]);assert.match(c.statement.text,/H\(−√5;√3;0\)/u);
  const sourceKeys={a:'C',b:'E',c:'B',d:'ACEH',e:'BEG',f:'BCD'};
  const zero={a:[1,2],b:[0,2],c:[0,1],d:[2],e:[0],f:[1]}[part],belongs=x=>zero.every(j=>x[j]===0);
  const match=Object.keys(given).filter(k=>belongs(given[k])).join('');assert.equal(match,sourceKeys[part]);
  const markers=m.views.filter.segments.map(([a,b])=>{assert.equal(a,'O');return b;}).join('');assert.equal(markers,match);
  for(const [,value] of Object.entries(given))assert.equal(belongs(value),zero.reduce((v,k)=>v+value[k]**2,0)===0);
  for(const sep of [' ',',',', ',';',''])for(const ordered of [match,Array.from(match).reverse().join('')]){
   assert.equal(engine.classifyAnswer([...ordered].join(sep),c.answer.accepted).status,'correct');
   acceptedMembershipGroups++;
  }
  assert.equal(engine.classifyAnswer(match+'F',c.answer.accepted).status,'wrong');
  const required=zero.map(i=>'xyz'[i]).join(';');graded(id,c,[required,'нет',belongs(p.T)?'да':'нет',match]);
 }else if(n===638){
  const planes=part==='a',levels=planes?[[0,2],[0,1],[1,2]]:[[0],[1],[2]],values=[];
  for(const label of 'ABC'){
   same(p[label],points638[label]);const projected=[];
   for(const [j,keep] of levels.entries()){
    const name=label+(j+1),original=p[label],target=original.map((v,i)=>keep.includes(i)?v:0),step=diff(target,original);
    same(p[name],target);
    for(const i of keep){const unit=[0,0,0];unit[i]=1;close(dot(step,unit),0);}
    assert(m.views['at'+label].segments.some(([a,b])=>a===label&&b===name));
    assert(m.views['at'+label].label.includes(name+' на '));
    projected.push(coordinates(target));testedProjections++;
   }
   values.push(...projected);
  }
  const last=values.pop();values.push(coordinates(p.Q),last);graded(id,c,values);
  assert.match(c.statement.text,/−√3;−√2\/2;√5−√3/u);
  const expectedEnd=planes?['0','-sqrt(2)/2','sqrt(5)-sqrt(3)']:['0','0','sqrt(5)-sqrt(3)'];
  assert.equal(engine.classifyAnswer(expectedEnd.join(';'),c.answer.accepted).status,'correct');
  assert.equal(engine.classifyAnswer([expectedEnd[0],expectedEnd[1],'5-sqrt(3)'].join(';'),c.answer.accepted).status,'wrong');
 }else{
  graded(id,c,['1;0;1','0;1;1','1;1;1','1;0;1','1;1;0']);
  same(p.A,[0,0,0]);same(p.B,[0,0,1]);same(p.D,[0,1,0]);same(p.A1,[1,0,0]);
  for(const k of ['A','B','C','D'])same(diff(p[k+'1'],p[k]),p.A1);
  same(p.C,sum(p.B,p.D));same(diff(p.C1,p.D),[1,0,1]);assert.equal(m.edges.length,12);
  for(const [a,b] of m.edges)close(norm(diff(p[a],p[b])),1);
 }
}
assert.equal(fields,55);assert.equal(testedProjections,18);assert.equal(acceptedMembershipGroups,60);
console.log('CARTESIAN_COORDINATE_START_OK',JSON.stringify({fields,testedProjections,acceptedMembershipGroups}));
