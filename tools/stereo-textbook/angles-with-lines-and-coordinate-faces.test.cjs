'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),receipt=require('./angles-with-lines-and-coordinate-faces.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]), factor=(a,k)=>a.map(x=>x*k),dot=(u,v)=>u.reduce((s,x,i)=>s+x*v[i],0);
const norm=v=>Math.sqrt(dot(v,v)), near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' vs '+b),same=(a,b)=>near(norm(sub(a,b)),0);
const lineAngle=(u,v)=>Math.acos(Math.min(1,Math.abs(dot(u,v))/(norm(u)*norm(v))))*180/Math.PI;
const good=(v,accepted)=>assert.equal(engine.classifyAnswer(String(v),accepted).status,'correct',String(v));
const coords=[
 [[3,-2,4],[4,-1,2],[6,-3,2],[7,-3,1],30,'sqrt(3)/2'],
 [[5,-8,-1],[6,-8,-2],[7,-5,-11],[7,-7,-9],60,'1/2'],
 [[1,0,2],[2,1,0],[0,-2,-4],[-2,-4,0],0,'1'],
 [[-6,-15,7],[-7,-15,8],[14,-10,9],[14,-10,7],45,'sqrt(2)/2']
];
const cases={
 707:[['D','D1','3/sqrt(29)'],['B','D','2/sqrt(58)'],['B1','D','1/sqrt(87)'],['A1','C','9/sqrt(87)']],
 709:[['A','C','D1','B','3/sqrt(70)'],['A','B1','B','C1','9/sqrt(130)'],['A1','D','A','C1','5/sqrt(182)']],
 710:[[2,0,'10/sqrt(134)'],[1,1,'3/sqrt(134)'],[0,0,'5/sqrt(134)']],
 711:[[2,0,'1/3'],[0,0,'2/3'],[1,0,'2/3']]
};
let fields=0,signs=0,projections=0;
for(const id of Object.keys(receipt.cards)){
 const card=available.get(id),n=Number(card.source.exercise),idx=id.charCodeAt(id.length-1)-97,m=card.visualization.model,p=m.points;
 viewer.prepare(m);
 const page=n<=707?178:179;assert.deepEqual(card.source.printedPages,[page]);assert.deepEqual(card.source.pdfPages,[page+2]);
 assert.deepEqual(new Set(['neutral',...card.help.map(h=>h.view),...card.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 let vals,u,v;
 if(n===705){const [A,B,C,D,degree,exact]=coords[idx];assert.deepEqual([p.A,p.B,p.C,p.D],[A,B,C,D]);u=sub(B,A);v=sub(D,C);near(lineAngle(u,v),degree);vals=[dot(u,v),exact,degree,degree];}
 if(n===706){near(norm(sub(p.B,p.A)),1);near(norm(sub(p.C,p.A)),1);near(norm(sub(p.C,p.B)),1);near(norm(sub(p.A1,p.A)),Math.SQRT2);u=sub(p.C1,p.A);v=sub(p.B,p.A1);near(dot(u,v),-1.5);near(lineAngle(u,v),60);vals=['3;3','-3/2',120,60];}
 if(n===707){same(p.M,[0,0,.75]);same(p.N,[1,.5,0]);const [a,b,ans]=cases[n][idx];u=factor(sub(p.N,p.M),4);v=sub(p[b],p[a]);same(u,[4,2,-3]);const value=dot(u,v);vals=['4;2;-3',value,Math.abs(value),ans];}
 if(n===708){
  near(norm(sub(p.B,p.A)),1);near(norm(sub(p.C,p.B)),1);near(norm(sub(p.A1,p.A)),2);
  [u,v]=idx===0?[sub(p.D,p.B),sub(p.D1,p.C)]:[sub(p.C,p.A),sub(p.C1,p.A)];
  const degrees=[71,54][idx],minutes=[34,44][idx],theta=lineAngle(u,v);assert.equal(Math.round(60*theta),60*degrees+minutes);
  if(idx===1){const printedMinutes=59*60+44;assert(Math.abs(60*theta-printedMinutes)>299);
   assert.match(card.help.map(h=>h.text).join(' '),/с\. 271.*59°44′.*54°44′/);
   assert.notEqual(engine.classifyAnswer('59°44′',card.answer.accepted).status,'correct');
   near(dot(u,v)/(norm(u)*norm(v)),1/Math.sqrt(3));
  }
  vals=[dot(u,v),idx===0?'1/sqrt(10)':'1/sqrt(3)',1,degrees+'°'+minutes+'′'];
 }
 if(n===709){const [a,b,c,d,ans]=cases[n][idx];u=sub(p[b],p[a]);v=sub(p[d],p[c]);const val=dot(u,v);
  near(norm(sub(p.B,p.A)),1);near(norm(sub(p.C,p.B)),2);near(norm(sub(p.B1,p.B)),3);
  vals=[val,dot(u,u)+';'+dot(v,v),Math.abs(val),ans];}
 if(n<710){
  for(const s of [-2,1,3])for(const k of [-1,2]){near(lineAngle(factor(u,s),factor(v,k)),lineAngle(u,v));signs++;}
 }else{
  const k=n===710?10:2,[axis,h,ans]=cases[n][idx];if(n===710){same(p.M,[0,.2,1]);same(p.N,[.5,.5,0]);}else{same(p.M,[1,1,0]);same(p.N,[0,0,.5]);}
  u=sub(p.N,p.M);const w=factor(u,k);same(p.P,p.M.map((x,j)=>j===axis?h:x));same(p.Q,p.N.map((x,j)=>j===axis?h:x));
  const projected=sub(p.Q,p.P);near(dot(projected,projected)+u[axis]**2,dot(u,u));
  same(sub(p.T,p.M),factor(u,-1));
  for(const s of [-2,-1,1,3]){near(Math.abs(s*u[axis])/norm(factor(u,s)),Math.abs(w[axis])/norm(w));projections++;}
  vals=[w.map(Math.round).join(';'),Math.abs(Math.round(w[axis])),-Math.round(w[axis]),ans];
 }
 card.steps.forEach((step,i)=>{good(vals[i],step.input.accepted);for(const w of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(w,step.input.accepted).status,'wrong',id+' '+w);fields++;});good(vals.at(-1),card.answer.accepted);
}
assert.equal(fields,60);assert.equal(signs,84);assert.equal(projections,24);
console.log('LINE_AND_FACE_ANGLES_OK: all 20 printed parts, 60 step fields, 84 signed reorientations, 24 plane projection identities and source-versus-key correction 708b');
