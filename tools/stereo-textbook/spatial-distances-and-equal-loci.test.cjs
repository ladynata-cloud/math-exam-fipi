'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),receipt=require('./spatial-distances-and-equal-loci.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(v,s)=>v.map(x=>x*s),sq=v=>v.reduce((s,x)=>s+x*x,0),d2=(a,b)=>sq(sub(a,b)),mid=(a,b)=>mul(add(a,b),.5);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' vs '+b),same=(a,b)=>near(d2(a,b),0);
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const keys={
 '0668-a':['98;98;98','нет','4','равносторонний'],'0668-b':['140;196;56','да','4','прямоугольный разносторонний'],'0668-c':['4;2;6','да','4','прямоугольный разносторонний'],'0668-d':['2;4;2','да','4','прямоугольный равнобедренный'],
 '0669-a':['4','4','3','4','4;4;3'],'0669-b':['4*sqrt(2)','5','5','4','4*sqrt(2);5;5'],
 '0670':['0;sqrt(2);-3','-1;sqrt(2);0','4','2','-1;0;-3'],'0671':['3;0;0','0;-4;0','4','25','0;0;sqrt(7)'],
 '0672':['15/4','2;4','1-2*sqrt(2);1+2*sqrt(2)','нет','5'],'0673':['4','5;5','5*sqrt(2)/2','AB;CD'],
 '0674-a':['5','-8/5','10','-8/5;0;0'],'0674-b':['-1','8','-2','0;8;0'],'0674-c':['-8','1','-16','0;0;1'],
 '0675-a':['z','3/8;17/8','7/2','3/8;17/8;0'],'0675-b':['x','1;3/2','7/2','0;1;3/2'],'0675-c':['y','-1/3;17/6','7/2','-1/3;0;17/6'],
 '0676-a':['2;3;0','13','да','2;3;0;sqrt(13)'],'0676-b':['2;3','-1','22','2;3;-1']};
const ts={a:[[9,3,-5],[2,10,-5],[2,3,2]],b:[[3,7,-4],[5,-3,2],[1,3,-10]],c:[[5,-5,-1],[5,-3,-1],[4,-3,0]],d:[[-5,2,0],[-4,3,0],[-5,2,-Math.sqrt(2)]]};
let fields=0,exactLoci=0,projectionWitnesses=0,distinctRoots=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),n=Number(c.source.exercise),part=id.at(-1),m=c.visualization.model,p=m.points,ans=keys[id.slice(8)];
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(st=>st.view)]),new Set(Object.keys(m.views)));
 assert.deepEqual(c.source.printedPages,[170]);assert.deepEqual(c.source.pdfPages,[172]);
 for(const [i,st] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(ans[i],st.input.accepted).status,'correct',id+' '+st.id);
  for(const w of wrongStepAnswers(id,st))assert.equal(engine.classifyAnswer(w,st.input.accepted).status,'wrong',id+' '+st.id+' '+w);fields++;
 }
 assert.equal(engine.classifyAnswer(ans.at(-1),c.answer.accepted).status,'correct',id+' final');
 if(n===668){
  for(const [i,k] of Array.from('ABC').entries())same(p[k],ts[part][i]);const sides=[d2(p.A,p.B),d2(p.B,p.C),d2(p.A,p.C)];
  for(const [i,l] of ans[0].split(';').entries())near(sides[i],Number(l));near(d2(p.T,p.R),4*d2(p.B,p.C));
  const [x,y,z]=[...sides].sort((a,b)=>a-b);assert.equal(Math.abs(x+y-z)<1e-8,part!=='a');
  const distinct=new Set(sides.map(x=>Math.round(x*1e8))).size;assert.equal(distinct,part==='a'?1:part==='d'?2:3);
 }
 if(n===669||n===670||n===671){
  const origin=n===671?p.B:p.A;const rows=n===670?[[1,2],[0,1],[0,2]]:(n===671||part==='b'?[[0],[1],[2]]:[[0,1],[0,2],[1,2]]);
  same(origin,n===669?[-3,4,-4]:n===670?[-1,Math.sqrt(2),-3]:[3,-4,Math.sqrt(7)]);
  for(const [j,keep] of rows.entries()){
   const P=p['P'+(j+1)],a=origin.map((x,i)=>keep.includes(i)?x:0);same(P,a);
   const residual=sub(origin,P);
   for(const i of keep){
    const step=[0,0,0];step[i]=1;
    for(const t of [-2,1,3]){const displaced=add(P,mul(step,t));near(dot(residual,step),0);near(d2(origin,displaced),d2(origin,P)+t*t);projectionWitnesses++;}
   }
  }
  near(d2(origin,p.T)-d2(origin,p.P1),4);
 }
 if(n===672){
  same(p.B,[-1,2,3]);same(p.C,[0,0,1]);const roots=[15/4,2,4,1-2*Math.sqrt(2),1+2*Math.sqrt(2)];
  assert.equal(new Set(roots).size,5);
  for(const [i,k] of roots.entries()){
   const a=p['A'+(i+1)];same(a,[1,0,k]);const [ab,ac,bc]=[d2(a,p.B),d2(a,p.C),d2(p.B,p.C)];
   near(ab,8+(k-3)**2);near(ac,1+(k-1)**2);near(bc,9);
   const branch=i===0?[ab,ac]:i<3?[ab,bc]:[ac,bc];near(...branch);assert(sq(cross(sub(p.B,a),sub(p.C,a)))>.01);distinctRoots++;
  }
  same(p.A6,[1,0,0]);assert.equal(new Set([d2(p.A6,p.B),d2(p.A6,p.C),d2(p.B,p.C)]).size,3);
 }
 if(n===673){
  same(p.A,[4,4,0]);same(p.B,[0,0,0]);same(p.C,[0,3,4]);same(p.D,[1,4,4]);
  const ab=sub(p.B,p.A),dc=sub(p.C,p.D),ad=sub(p.D,p.A),bc=sub(p.C,p.B);
  same(ab,mul(dc,4));near(sq(ad),25);near(sq(bc),25);assert(sq(cross(ad,bc))>.1);same(p.T,mid(p.A,p.D));same(p.P,mid(p.B,p.C));same(sub(p.P,p.T),mul(add(ab,dc),.5));
  for(const good of ['BA;DC','CD и BA','DC, AB'])assert.equal(engine.classifyAnswer(good,c.answer.accepted).status,'correct');
 }
 if(n===674){
  same(p.A,[-2,3,5]);same(p.B,[3,2,-3]);assert.equal(p.P.filter(x=>x!==0).length,1);
  near(d2(p.P,p.A),d2(p.P,p.B));for(const t of [-2,1,4]){
   const w=add(p.P,mul(sub(p.T,p.P),t));near(d2(w,p.A)-d2(w,p.B),t*Number(ans[2]));exactLoci++;
  }
 }
 if(n===675){
  same(p.A,[-1,2,3]);same(p.B,[-2,1,2]);same(p.C,[0,-1,1]);
  for(const name of ['B','C'])near(d2(p.P,p.A),d2(p.P,p[name]));
  const [x,y,z]=p.P;near(x+y+z,2.5);near(x-3*y-2*z,-6);
  const planeIndex={a:2,b:0,c:1}[part];near(p.P[planeIndex],0);near(p.T[planeIndex],0);
  // Restrict the two bisector equations to the plane and check uniqueness of the intersection.
  const inPlane=[0,1,2].filter(v=>v!==planeIndex),[i,j]=inPlane;const b1=[1,1,1],b2=[1,-3,-2];
  assert.notEqual(b1[i]*b2[j]-b1[j]*b2[i],0);exactLoci++;
 }
 if(n===676){
  same(p.O,[0,0,0]);same(p.A,[4,0,0]);same(p.B,[0,6,0]);same(p.C,[0,0,-2]);
  const center=part==='a'?p.M:p.P;for(const k of part==='a'?'OAB':'OABC')near(d2(p[k],center),part==='a'?13:14);
  if(part==='a'){same(p.M,mid(p.A,p.B));const names=Object.keys(p).filter(k=>k.startsWith('_circle'));assert.equal(names.length,48);for(const k of names){near(p[k][2],0);near(d2(p.M,p[k]),13);}}
  else{near(d2(p.T,p.C),22);near(d2(p.T,p.O),14);}exactLoci++;
 }
}
assert.equal(fields,59);assert.equal(exactLoci,14);assert.equal(distinctRoots,5);assert.equal(projectionWitnesses,54);
console.log('SPATIAL_DISTANCES_AND_EQUAL_LOCI_OK',JSON.stringify({fields,exactLoci,projectionWitnesses,distinctRoots}));
