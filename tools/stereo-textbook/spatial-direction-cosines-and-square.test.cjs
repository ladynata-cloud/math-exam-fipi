'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js'), viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const receipt=require('./spatial-direction-cosines-and-square.json'),bank=require('../../stereo-course/textbook/data/course.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs'), {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]), dot=(u,v)=>u.reduce((s,x,i)=>s+x*v[i],0);
const norm=v=>Math.sqrt(dot(v,v));
const cos=(u,v)=>dot(u,v)/(norm(u)*norm(v));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' vs '+b);
const angle=(u,v)=>Math.acos(cos(u,v))*180/Math.PI;
const r=Math.sqrt;
const vectors=[
 [[2,-2,0],[3,0,-3],'6','1/2',60],
 [[r(2),r(2),2],[-3,-3,0],'-6*sqrt(2)','-sqrt(2)/2',135],
 [[0,5,0],[0,-r(3),1],'-5*sqrt(3)','-sqrt(3)/2',150],
 [[-2.5,2.5,0],[-5,5,5*r(2)],'25','sqrt(2)/2',45],
 [[-r(2),-r(2),-2],[r(2)/2,r(2)/2,-1],'0','0',90]
];
const cube=[['A','A1','A','C1',1,3,'sqrt(3)/3','-sqrt(3)/3'],['B','D1','D','B1',-1,9,'-1/3','1/3'],['D','B','A','C1',0,6,'0','0']];
const axes=[[1,0,0],[0,1,0],[0,0,1]], good=(v,accepted)=>assert.equal(engine.classifyAnswer(String(v),accepted).status,'correct',String(v));
let fields=0, radicalExamples=0, signedTests=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),n=Number(c.source.exercise),idx=id.charCodeAt(id.length-1)-97,m=c.visualization.model,p=m.points;
 viewer.prepare(m); assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(st=>st.view)]),new Set(Object.keys(m.views)));
 assert.deepEqual(c.source.printedPages,[176]);assert.deepEqual(c.source.pdfPages,[178]);
 let answers;
 if(n===691){
  near(p.B[0],r(2));near(p.C[0],r(2));const u=sub(p.B,p.A),v=sub(p.D,p.A);assert.deepEqual(u,sub(p.C,p.D));near(dot(u,v),0);near(dot(u,u),2);near(dot(v,v),2);near(dot(sub(p.T,p.B),sub(p.T,p.B)),8);answers=['2;2',0,8,'квадрат'];
 }else if(n===692){
  const [u,v,d,exact,deg]=vectors[idx];p.U.forEach((x,i)=>near(x,u[i]));p.V.forEach((x,i)=>near(x,v[i]));
  near(angle(u,v),deg);near(angle(u,p.T),180-deg);
  for(const k of [.5,1,2])for(const s of [-1,1]){const t=u=>[k*u[2],s*k*u[1],k*u[0]];near(angle(t(u),t(v)),deg);signedTests++;}
  answers=[d,exact,180-deg,deg];radicalExamples++;
 }else if(n===693){
  assert.deepEqual(p.A,[2,1,2]);near(norm(p.A),3);const values=axes.map(ax=>cos(p.A,ax));values.forEach((v,j)=>near(v,[2/3,1/3,2/3][j]));near(dot(values,values),1);
  const rounded=axes.map(ax=>Math.round(angle(p.A,ax)*60));
  assert.deepEqual(rounded,[48*60+11,70*60+32,48*60+11]);
  const key=[50+46/60,63+26/60,50+46/60];
  const cosKey=key.map(x=>Math.cos(x*Math.PI/180));
  const alternate=[Math.SQRT2,1,Math.SQRT2];
  assert.deepEqual(axes.map(ax=>Math.round(angle(alternate,ax)*60)),[50*60+46,63*60+26,50*60+46]);
  for(let i=0;i<3;i++)assert(Math.abs(cosKey[i]-values[i])>0.01);
  assert.match(c.help.map(h=>h.text).join(' '),/с\. 271.*50°46′.*63°26′/);
  const printed='50°46′;63°26′;50°46′';assert.notEqual(engine.classifyAnswer(printed,c.answer.accepted).status,'correct');
  good('arccos(2/3);arccos(1/3);arccos(2/3)',c.answer.accepted);
  answers=[3,'2/3;1/3;2/3','-2/3;-1/3;-2/3','48°11′;70°32′;48°11′'];
 }else if(n===694){
  const a=sub(p.A,p.C),b=sub(p.B,p.C);near(dot(a,b),1);near(angle(a,b),60);near(angle(a,sub(p.T,p.C)),120);answers=[1,'1/2',120,60];
 }else if(n===695){
  const u=sub(p.B,p.A),v=sub(p.C,p.A),w=sub(p.C,p.B);
  near(angle(u,v),120);near(angle(w,sub(p.A,p.B)),30);near(angle(sub(p.A,p.C),sub(p.B,p.C)),30);
  near(norm(u)+norm(v)+norm(w),4*r(2)+2*r(6));near(dot(sub(p.A,p.H),w),0);
  near(norm(w)*norm(sub(p.A,p.H))/2,2*r(3));near(dot(sub(p.T,p.A),sub(p.U,p.A)),4*dot(u,v));
  answers=['120;30;30','2*sqrt(2)*(2+sqrt(3))','8*sqrt(3)','120;30;30;4*sqrt(2)+2*sqrt(6);2*sqrt(3)'];
 }else{
  const [h,l,a,b,d,q,exact,neg]=cube[idx];const e=norm(sub(p.B,p.A)),u=sub(p[l],p[h]),v=sub(p[b],p[a]);
  near(dot(u,v)/e**2,d);near(dot(u,u)*dot(v,v)/e**4,q);near(cos(u,v),d/r(q));near(cos(u,sub(p.T,p[h])),-d/r(q));
  answers=[d,q,neg,exact];
 }
 c.steps.forEach((step,i)=>{good(answers[i],step.input.accepted);for(const x of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(x,step.input.accepted).status,'wrong',id+' '+x);fields++;});
 good(answers.at(-1),c.answer.accepted);
}
assert.equal(fields,36);assert.equal(radicalExamples,5);assert.equal(signedTests,30);
console.log('DIRECTION_COSINES_OK: 36 source-checked steps, every printed radical, 30 angle symmetries, three cube diagonals, direct direction cosines and independently rounded minutes for problem 693');
