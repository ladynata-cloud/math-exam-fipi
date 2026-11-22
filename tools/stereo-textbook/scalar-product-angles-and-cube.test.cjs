'use strict';
const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const receipt = require('./scalar-product-angles-and-cube.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available,issues} = engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const scale=(a,k)=>a.map(x=>x*k);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' vs '+b);
const angle=(u,v)=>Math.acos(Math.max(-1,Math.min(1,dot(u,v)/Math.sqrt(dot(u,u)*dot(v,v)))))*180/Math.PI;
const good=(x,accepted)=>assert.equal(engine.classifyAnswer(String(x),accepted).status,'correct',String(x));
const cubeAngles = [
 ['B1','B','B1','C',45],['D','A','B1','D1',135],['A1','C1','A1','B',60],['B','C','A','C',45],
 ['B','B1','A','C',90],['B1','C','A','D1',90],['A1','D1','B','C',0],['A','A1','C1','C',180]];
const products=[
 ['A','D','B1','C1',1],['A','C','C1','A1',-2],['D1','B','A','C',0],['B','A1','B','C1',1],
 ['A1','O1','A1','C1',1],['D1','O1','B1','O1',-.5],['B','O1','C1','B',-1.5]];
const theory={
 76:[[171],['60','120','90','0']],77:[[171,172],['0','9','-9','0']],
 78:[[173,174],['-1','45','1/sqrt(2)','0']],79:[[174,175],['3','3','-9','3']]
};
let steps=0, transformed=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),n=Number(c.source.point||c.source.exercise),p=c.visualization.model.points;
 viewer.prepare(c.visualization.model);
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(c.visualization.model.views)));
 const pages=theory[n]?.[0]||[176];assert.deepEqual(c.source.printedPages,pages);assert.deepEqual(c.source.pdfPages,pages.map(x=>x+2));
 let val;
 if(n===682||n===684){
  const [a,b,h,l,w]=(n===682?cubeAngles:products)[id.charCodeAt(id.length-1)-97];
  const edge=Math.sqrt(dot(sub(p.B,p.A),sub(p.B,p.A)));
  assert.equal(edge,3);
  if(n===684)assert.deepEqual(p.O1,p.A1.map((x,i)=>(x+p.C1[i])/2));
  const u=scale(sub(p[b],p[a]),1/edge),v=scale(sub(p[l],p[h]),1/edge);
  const pair=c.visualization.model.views.neutral.segments;
  assert(pair.some(([i,j])=>i===a&&j===b));assert(pair.some(([i,j])=>i===h&&j===l));
  for(let i=0;i<3;i++){near((p.Q[i]-p[a][i])/edge,v[i]);near((p.T[i]-p[a][i])/edge,-v[i]);}
  const d=dot(u,v), uv=u.map((x,i)=>x*v[i]),d1=dot(u,u),d2=dot(v,v);
  if(n===682){near(angle(u,v),w);val=[String(d),d1+';'+d2,String(180-w),String(w)];}
  else{near(d,w);val=[uv.join(';'),String(w),String(-4*w),new Map([[1,'a^2'],[-2,'-2*a^2'],[0,'0'],[-.5,'-a^2/2'],[-1.5,'-3*a^2/2']]).get(w)];}
  for(const k of [.25,.5,2,4])for(const [i,j,l] of [[0,1,2],[2,0,1],[1,2,0]]){
   const moved=v=>[k*v[i],-k*v[j],k*v[l]];
   near(dot(moved(u),moved(v)),k*k*d);
   near(angle(moved(u),moved(v)),angle(u,v));
   near(angle(moved(u),scale(moved(v),-1)),180-angle(u,v));
   transformed++;
  }
 }else if(n===683){
  val=['60','70','180','phi;180-phi;180-phi'];
  const v=sub(p.D,p.C),u=sub(p.B,p.A);near(angle(u,v),60);
  for(const a of [0,20,60,90,110,145,180]){
   const b=[Math.cos(a*Math.PI/180),Math.sin(a*Math.PI/180),0];
   near(angle(scale(u,-1),scale(b,-1)),a);near(angle(scale(u,-1),b),180-a);near(angle(u,scale(b,-1)),180-a);
  }
 }else{
  val=theory[n][1];
  if(n===76){near(angle(sub(p.A,p.O),sub(p.K,p.H)),60);near(angle(sub(p.A,p.O),sub(p.C,p.O)),120);near(dot(p.B,p.D),0);}
  if(n===77){near(dot(p.A,p.B),0);near(dot(p.B,p.B),9);near(dot(p.S,p.T),-9);}
  if(n===78){near(angle(p.A,p.B),135);near(angle(p.A,p.C),45);near(dot(p.A,p.N)/Math.sqrt(dot(p.A,p.A)),Math.SQRT1_2);}
  if(n===79){const n=sub(p.X,p.A);for(const name of ['B','C','D'])near(dot(n,sub(p[name],p.A)),0);near(dot(n,sub(p.X,p.A)),9);near(dot(n,sub(p.T,p.A)),-9);}
 }
 c.steps.forEach((step,i)=>{good(val[i],step.input.accepted);for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong',id+' '+wrong);steps++;});
 good(val.at(-1),c.answer.accepted);
}
assert.equal(steps,60);assert.equal(transformed,180);
console.log('SCALAR_PRODUCT_CUBE_OK: 4 independent theory concepts, 15 exact printed cube pairs, 3 signed reversals, 180 uniform reflections or scalings and 60 addressed steps');
