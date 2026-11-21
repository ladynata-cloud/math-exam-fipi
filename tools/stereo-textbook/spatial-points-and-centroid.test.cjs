'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),receipt=require('./spatial-points-and-centroid.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,t)=>a.map(x=>x*t),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=([a,b,c],[d,e,f])=>[b*f-c*e,c*d-a*f,a*e-b*d],norm=v=>Math.hypot(...v),same=(a,b)=>assert(norm(sub(a,b))<1e-8,a+' vs '+b);
const mean=(...p)=>scale(p.reduce(add,[0,0,0]),1/p.length),tr=v=>v.join(';'),zero=[0,0,0];
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const pointVectors={653:[[3,2,1],[1,-3,5],[-1/3,.75,-2.75]],654:[[2,-3,0],[7,-12,18],[-8,0,5]]};
const ends={a:[[3,-1,2],[2,-1,4],[-1,0,2]],b:[[-2,6,-2],[3,-1,0],[5,-7,2]],c:[[1,5/6,.5],[.5,1/3,.25],[-.5,-.5,-.25]]};
const lines={
 a:[[3,-7,8],[-5,4,1],[27,-40,29],-3,true],
 b:[[-5,7,12],[4,-8,3],[13,-23,-6],2,true],
 c:[[-4,8,-2],[-3,-1,7],[-2,-10,-16],2,false]};
const planes={
 a:[[[-2,-13,3],[1,4,1],[-1,-1,-4],[0,0,0]],[-5,1,1],0,0],
 b:[[[0,1,0],[3,4,-1],[-2,-3,0],[2,0,3]],[-2,1,-3],1,-13],
 c:[[[5,-1,0],[-2,7,1],[12,-15,-7],[1,1,-2]],[1,1,-1],4,4]};
let fields=0,affineCases=0,endpointCases=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),m=c.visualization.model,p=m.points,n=Number(c.source.exercise),letter=id.at(-1);
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(st=>st.view)]),new Set(Object.keys(m.views)));
 assert.deepEqual(c.source.printedPages,[169]);assert.deepEqual(c.source.pdfPages,[171]);let expected;
 if(n===653||n===654){
  for(const [i,k] of ['A','B','C'].entries())same(p[k],pointVectors[n][i]);
  same(p.T,add(p.S,p.C));expected=[tr(p.A),tr(p.B),tr(p.T),tr(p.C)];
 }else if(n===655){
  const [a,b,v]=ends[letter];same(p.A,a);same(p.B,b);same(sub(b,a),v);same(p.D,v);
  expected=[String(v[0]),String(v[1]),tr(scale(v,-1)),tr(v)];
 }else if(n===656){
  same(p.A,[1,6,2]);same(p.B,[2,3,-1]);same(p.C,[-3,4,5]);expected=['i-3j-3k','-5i+j+6k','-4i-2j+3k','4i+2j-3k'];
 }else if(n===657){
  same(p.A,[3,-1,5]);same(p.B,[2,3,-4]);same(p.C,[7,0,-1]);same(p.D,[8,-4,8]);expected=['-1;4;-9','5;-3;3','-5;3;-3','да'];
 }else if(n===658){
  const [a,b,c,k,yes]=lines[letter];same(p.A,a);same(p.B,b);same(p.C,c);
  const prediction=scale(sub(b,a),k);same(p.P||p.C,add(a,prediction));same(p.T,add(p.A,scale(sub(b,a),-.5)));
  expected=[String(k),String(prediction[2]),tr(p.T),yes?'да':'нет'];
 }else if(n===659){
  const [points,normal,h,w]=planes[letter];for(const [i,k] of Array.from('ABCD').entries())same(p[k],points[i]);
  for(const k of ['A','B','C','Q'])assert(Math.abs(dot(p[k],normal)-h)<1e-8);assert.equal(dot(p.D,normal),w);
  if(h!==w){assert(p.P);assert(Math.abs(dot(p.P,normal)-h)<1e-8);assert(norm(cross(sub(p.D,p.P),normal))<1e-8);}
  expected=[String(h),String(w),String(h),h===w?'да':'нет'];
 }else{expected=['2/3','1;2;1','1;2;2','1/3;1/3;1/3'];}
 for(const [i,st] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(expected[i],st.input.accepted).status,'correct',id+' '+st.id);
  for(const w of wrongStepAnswers(id,st))assert.equal(engine.classifyAnswer(w,st.input.accepted).status,'wrong',id+' '+st.id+' '+w);fields++;
 }
 assert.equal(engine.classifyAnswer(expected.at(-1),c.answer.accepted).status,'correct',id+' final');
 for(const matrix of [[[1,0,0],[0,1,0],[0,0,1]],[[1,-1,0],[0,1,1],[1,0,2]],[[0,2,0],[1,0,1],[0,0,3]]]){
  const linear=v=>matrix.map(r=>dot(r,v)),F=v=>add(linear(v),[1,-4,2]),pts=Object.fromEntries(Object.entries(p).map(([k,v])=>[k,F(v)]));
  const v=(a,b)=>sub(pts[b],pts[a]);
  if(n===653||n===654){same(v('O','C'),v('S','T'));endpointCases++;}
  if(n===655){same(v('A','B'),v('O','D'));same(v('A','B'),v('S','T'));endpointCases++;}
  if(n===656){same(add(add(v('A','B'),v('B','C')),v('C','A')),zero);same(v('A','B'),linear([1,-3,-3]));same(v('B','C'),linear([-5,1,6]));}
  if(n===657){same(v('A','B'),v('D','C'));same(v('B','C'),v('A','D'));same(mean(pts.A,pts.C),mean(pts.B,pts.D));}
  if(n===658){assert.equal(norm(cross(v('A','B'),v('A','C')))<1e-8,lines[letter][4]);same(v('A','T'),scale(v('A','B'),-.5));}
  if(n===659){const normVec=cross(v('A','B'),v('A','C'));assert(norm(normVec)>.1);assert.equal(Math.abs(dot(v('A','D'),normVec))<1e-8,planes[letter][2]===planes[letter][3]);same(v('A','Q'),add(scale(v('A','B'),.5),scale(v('A','C'),.25)));}
  if(n===660){same(pts.M,mean(pts.B,pts.C));same(pts.G,mean(pts.A,pts.B,pts.C));same(v('A','G'),scale(v('A','M'),2/3));same(pts.H,mean(pts.T,pts.B,pts.C));same(v('G','H'),scale(v('A','T'),1/3));}
  affineCases++;
 }
}
assert.equal(fields,42);assert.equal(affineCases,42);assert.equal(endpointCases,15);
console.log('SPATIAL_POINTS_AND_CENTROID_OK',JSON.stringify({fields,affineCases,endpointCases}));
