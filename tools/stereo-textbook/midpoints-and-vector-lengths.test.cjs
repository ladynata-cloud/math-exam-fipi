'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),manifest=require('./midpoints-and-vector-lengths.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,f)=>a.map(x=>x*f),norm=v=>Math.hypot(...v),sq=v=>v.reduce((s,t)=>s+t*t,0),mean=(u,v)=>scale(add(u,v),.5);
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' vs '+b),same=(a,b)=>near(norm(sub(a,b)),0);
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const keys={
 '0661-a':['-1','-2','2;-2;4','-1;5/2;-2'],'0661-b':['-8','-7','2;-2;4','-8;4;-19'],'0661-c':['-24','15','2;-2;4','-24;8;28'],
 '0662-a':['2','-5','1','2;-5'],'0662-b':['-1/2','2','1','-1/2;2'],'0662-c':['1','-1','1','1;-1'],'0662-d':['2','-1','1','2;-1'],
 '0663-a':['2;-2;1','9','6','3'],'0663-b':['1;12;-12','289','34','17'],
 '0664':['5*sqrt(3)','7','sqrt(3)','2','2*sqrt(5)','sqrt(5)'],
 '0665-a':['1;1;2','6','2*sqrt(6)','sqrt(6)'],'0665-b':['14','sqrt(14)','4*sqrt(14)','2*sqrt(14)'],
 '0665-c':['14','sqrt(14)','sqrt(14)','0'],'0665-d':['5;-5;0','50','5*sqrt(2)','5*sqrt(2)'],
 '0665-e':['-9;6;3','126','2*sqrt(14)','3*sqrt(14)'],'0665-f':['14','sqrt(14)','28','14'],
 '0665-g':['15;-10;-1','326','326','sqrt(326)'],'0666':['-2;3;1','14','13','sqrt(14)'],
 '0667-a':['3/2','2*sqrt(2)','6+4*sqrt(2)','3+2*sqrt(2)'],'0667-b':['1/2','73/16','sqrt(73)/4','1','1/2;sqrt(73)/4;sqrt(73)/4']
};
const p661={a:[[0,3,-4],[-2,2,0]],b:[[14,-8,5],[-8,4,-19]],c:[[-24,8,28],[0,0,2]]};
const p662={a:[[2,-5],(m,n)=>[[-3,m,5],[2,-2,n]]],b:[[-.5,2],(m,n)=>[[1,.5,-4],[1,m,2*n]]],
 c:[[1,-1],(m,n)=>[[0,m,n+1],[1,n,-m+1]]],d:[[2,-1],(m,n)=>[[7,2*m+n,-n],[-5,-3,m-3]]]};
let fields=0,rigidCases=0,badParameters=0,renderStages=0;
for(const id of Object.keys(manifest.cards)){
 const c=available.get(id),n=Number(c.source.exercise),part=id.at(-1),m=c.visualization.model,p=m.points,values=keys[id.slice(8)];
 assert.deepEqual(c.source.printedPages,[n<=662?169:170]);assert.deepEqual(c.source.pdfPages,c.source.printedPages.map(v=>v+2));
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(st=>st.view)]),new Set(Object.keys(m.views)));
 const neutral=new Set(m.views.neutral.segments.flat());assert(m.labelNames.every(k=>neutral.has(k)||['O','X','Y','Z'].includes(k)),'future points hidden before their step');
 renderStages+=Object.keys(m.views).length;
 for(const [i,st] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(values[i],st.input.accepted).status,'correct',id+' '+st.id);
  for(const w of wrongStepAnswers(id,st))assert.equal(engine.classifyAnswer(w,st.input.accepted).status,'wrong',id+' '+st.id+' '+w);fields++;
 }
 assert.equal(engine.classifyAnswer(values.at(-1),c.answer.accepted).status,'correct',id+' final');
 if(n===661){const [a,b]=p661[part];same(p.A,a);same(p.B,b);}
 if(n===662){
  const [[m0,n0],make]=p662[part],[a,b]=make(m0,n0);same(p.A,a);same(p.B,b);near(p.M[1],0);near(p.M[2],0);
  for(const [dm,dn] of [[1,0],[0,1],[-1,1],[2,2]]){
   const ends=make(m0+dm,n0+dn),x=mean(...ends);assert(Math.hypot(x[1],x[2])>.1);badParameters++;
  }
 }
 if(n===663){const [a,b]=part==='a'?[[-1,0,2],[1,-2,3]]:[[-35,-17,20],[-34,-5,8]];same(p.A,a);same(p.B,b);}
 if(n===664){for(const [k,v] of Object.entries({A:[5,-1,7],B:[2*Math.sqrt(3),-6,1],C:[1,1,1],D:[0,0,-2],M:[1,-2,0]}))same(p[k],v);}
 if(n===665){same(p.A,[3,-2,1]);same(p.B,[-2,3,1]);same(p.C,[-3,2,1]);
  const expected={a:scale(add(p.A,p.B),2),b:scale(p.A,2),c:scale(p.A,2),d:sub(p.B,p.A),e:scale(p.C,-2),f:scale(p.C,2),g:sub(scale(p.C,3),scale(p.A,2))}[part];
  same(p.T,expected);if(part==='b')same(p.V,scale(p.B,2));
  const answer={a:norm(add(p.A,p.B)),b:norm(p.A)+norm(p.B),c:norm(p.A)-norm(p.B),d:norm(sub(p.A,p.B)),e:norm(scale(p.C,3)),f:Math.sqrt(14)*norm(p.C),g:norm(sub(scale(p.A,2),scale(p.C,3)))}[part];
  assert.equal(engine.classifyAnswer(String(answer),c.answer.accepted).status,'correct');
 }
 if(n===666){same(p.M,[-4,7,0]);same(p.N,[0,-1,2]);}
 if(n===667){same(p.A,[1.5,1,-2]);same(p.B,[2,2,-3]);same(p.C,[2,0,-1]);for(const name of ['A','B','C','M','N','P'])same(p[name+'2'],scale(p[name],2));}
 for(const [factor,shift,rotate] of [[1,[0,0,0],p=>p],[.5,[2,-1,3],([x,y,z])=>[z,-x,y]],[3,[-5,1,2],([x,y,z])=>[-y,z,x]]]){
  const t=Object.fromEntries(Object.entries(p).map(([key,q])=>[key,add(shift,scale(rotate(q),factor))]));
  const v=(a,b)=>sub(t[b],t[a]),L=(a,b)=>norm(v(a,b))/factor;
  if(n===661){same(t.M,mean(t.A,t.B));same(t.N,mean(t.A,t.T));same(v('B','T'),scale(v('M','N'),2));}
  if(n===662){same(t.M,mean(t.A,t.B));same(t.N,mean(t.A,t.T));same(v('M','N'),scale(rotate([1,0,0]),factor));}
  if(n===663){near(L('A','B'),part==='a'?3:17);near(L('A','T'),2*L('A','B'));near(sq(v('A','B')),sq(v('A','P'))+sq(v('P','Q'))+sq(v('Q','B')));}
  if(n===664){for(const [i,k] of Array.from('ABCDM').entries())near(L('O',k),[5*Math.sqrt(3),7,Math.sqrt(3),2,Math.sqrt(5)][i]);near(L('O','T'),2*L('O','M'));}
  if(n===665){near(L('O','A'),Math.sqrt(14));near(L('O','B'),Math.sqrt(14));near(L('O','C'),Math.sqrt(14));}
  if(n===666){same(t.K,mean(t.M,t.N));near(L('O','K'),Math.sqrt(14));near(L('S','K'),Math.sqrt(13));}
  if(n===667){same(t.M,mean(t.B,t.C));same(t.N,mean(t.A,t.C));same(t.P,mean(t.A,t.B));
   near(L('A','B')+L('B','C')+L('C','A'),3+2*Math.sqrt(2));near(L('A','M'),.5);near(L('B','N'),Math.sqrt(73)/4);near(L('C','P'),Math.sqrt(73)/4);
   near(L('A2','M2'),2*L('A','M'));near(L('B2','C2'),2*L('B','C'));}
  rigidCases++;
 }
}
assert.equal(fields,63);assert.equal(rigidCases,60);assert.equal(badParameters,16);
console.log('MIDPOINTS_AND_VECTOR_LENGTHS_OK',JSON.stringify({fields,rigidCases,badParameters,renderStages}));
