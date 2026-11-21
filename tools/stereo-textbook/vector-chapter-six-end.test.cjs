'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),manifest=require('./vector-chapter-six-end.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const add=(...vs)=>vs.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]),scale=(a,t)=>a.map(x=>x*t);
const sub=(a,b)=>add(a,scale(b,-1)),v=(p,a,b)=>sub(p[b],p[a]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=v=>Math.hypot(...v);
const cross=([a,b,c],[d,e,f])=>[b*f-c*e,c*d-a*f,a*e-b*d];
const near=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' vs '+b);
const same=(a,b)=>near(norm(sub(a,b)),0),mean=(...vs)=>scale(add(...vs),1/vs.length);
const answers={
 '0627-a':['1/2','9/4','3/8','3/2'],'0627-b':['5','-4/(5*sqrt(5))','1/4','sqrt(143+10*sqrt(10))/(5*sqrt(5))'],
 '0627-c':['0','9/2','1/9','4/9'],'0627-d':['горизонтальные','-8*sqrt(2)/27','1/4','4*sqrt(737)/27'],
 '0628':['0;1/2;1/2','1/4','2/3;1/6;1/6','1/2;1/4;1/4'],
 '0629':['1;1;1','-1;-1;1','-1;1;1','-1;1;-1','1;-1;1'],
 '0630-a':['1;1;0','1/2','1;1;1/3','1;1;1/2'],'0630-b':['0;-1;1','-1','-1;1;-1','1;-1;1'],
 '0631':['1;0;1','1','1;1/2;1/2','1/2;1;1/2'],'0632':['-1;-1','нет','-1;-3;-3','0'],
 '0633':['-1;1;0','0;-1;1','1;0;-1','1/3;2/3;-1','1/2;1/2;-1'],
 '0634':['2','-','1/3','1/3'],'0635':['1/6','1/2;1/2','3;-1;2','середина'],'0636':['-1/3','1/3','3;4;5','1/3']
};
const {available,issues,coverage}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
assert(coverage.availableExercises>=636);const chapter=bank.catalog.entries.filter(e=>e.source.chapter==='VI. Векторы в пространстве');
const inventory=require('../../stereo-course/textbook/source-index.json').entries.filter(e=>e.source.chapter==='VI. Векторы в пространстве');
assert.deepEqual(['theory','main','selfcheck'].map(kind=>inventory.filter(e=>e.source.collection===kind).length),[8,80,15]);
assert.equal(chapter.length,201);assert(chapter.every(e=>e.status==='reviewed'&&available.has(e.id)));
for(const e of inventory){
 const s=e.source,rows=chapter.filter(r=>r.source.collection===s.collection&&r.source.point===s.point&&r.source.exercise===s.exercise);
 assert.deepEqual(rows.map(r=>r.source.subpart??null).sort(),[...(e.requiredParts||[null])].sort(),e.id+' all printed parts');
}
let fields=0,affineCases=0,fieldCases=0;
for(const [short,expected] of Object.entries(answers)){
 const id='ex-main-'+short,c=available.get(id),m=c.visualization.model,n=Number(c.source.exercise),part=short.at(-1),p0=m.points;
 assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(c.source.printedPages,[n<=629?158:159]);assert.deepEqual(c.source.pdfPages,[n<=629?160:161]);
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(expected[i],s.input.accepted).status,'correct',id+' '+s.id);
  for(const wrong of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(wrong,s.input.accepted).status,'wrong',id+' '+s.id+' '+wrong);
  fields++;
 }
 assert.equal(engine.classifyAnswer(expected.at(-1),c.answer.accepted).status,'correct',id+' final');
 if(n===627){
  const t={a:'A1',b:'C',c:'F',d:'O'}[part];const ab=v(p0,'A','B'),ad=v(p0,'A','D'),up=v(p0,'A','A1');
  near(norm(ab),norm(ad));near(norm(up),2*norm(ab));near(dot(ab,ad),0);near(dot(ad,up),0);near(dot(ab,up),0);
  if(t==='F')same(p0.F,mean(p0.A1,p0.C1));if(t==='O')same(p0.O,mean(p0.A,p0.C));
  const answer={a:1.5,b:Math.sqrt((143+10*Math.sqrt(10))/125),c:4/9,d:4*Math.sqrt(737)/27}[part];
  for(const factor of [.25,1,2.3])for(const q of [-2,0,1,4.5]){
   const p=Object.fromEntries(Object.entries(p0).map(([k,x])=>[k,add([2,-4,3],scale([-x[2],x[0],-x[1]],factor))]));
   const a=norm(v(p,'A','B')),contributions=['A','B1','D1'].map((s,i)=>{
    const r=v(p,s,t);return scale(r,q*(i===0?2:1)/norm(r)**3);
   });
   near(norm(add(...contributions)),answer*Math.abs(q)/a**2);
   for(const [i,s] of ['A','B1','D1'].entries()){
    const r=v(p0,s,t),diagramShaft=v(p0,t,'_'+s);
    same(diagramShaft,scale(r,(i===0?2:1)*norm(ab)**2*.6/norm(r)**3));
   }
   same(v(p0,t,'_sum'),add(...['A','B1','D1'].map(s=>v(p0,t,'_'+s))));
   if(t==='F')same(add(contributions[1],contributions[2]),[0,0,0]);
   if(t==='O')near(dot(contributions[0],add(contributions[1],contributions[2])),0);
   fieldCases++;
  }
  continue;
 }
 for(const mat of [[[1,0,0],[0,1,0],[0,0,1]],[[1,.5,0],[0,1,-1],[0,0,2]],[[-1,0,2],[1,1,0],[0,1,3]]]){
  assert(Math.abs(dot(mat[0],cross(mat[1],mat[2])))>.1);
  const p=Object.fromEntries(Object.entries(p0).map(([k,x])=>[k,add(mat.map(row=>dot(row,x)),[1,-3,2])]));
  const r=(a,b)=>v(p,a,b),lin=(basis,coefs)=>add(...basis.map((vv,i)=>scale(vv,coefs[i])));
  const edge=()=>[r('A','B'),r('A','D'),r('A','A1')],tet=()=>[r('A','B'),r('A','C'),r('A','D')];
  if(n===628){same(p.B1,mean(p.C,p.D));same(p.K,mean(p.B,p.B1));same(r('A','K'),lin(tet(),[.5,.25,.25]));same(r('A','L'),lin(tet(),[2/3,1/6,1/6]));}
  if(n===629){
   for(const [a,b,c] of [['A','C1',[1,1,1]],['C','A1',[-1,-1,1]],['B','D1',[-1,1,1]],['D','B1',[1,-1,1]]]){
    same(r(a,b),lin(edge(),c));same(r(b,a),lin(edge(),c.map(x=>-x)));
   }
  }
  if(n===630&&part==='a'){same(p.K,mean(p.C,p.C1));same(r('A','K'),lin(edge(),[1,1,.5]));same(r('A','L'),lin(edge(),[1,1,1/3]));}
  if(n===630&&part==='b'){
   const basis=[r('A','B1'),r('B','C1'),r('C','D1')];assert(Math.abs(dot(basis[0],cross(basis[1],basis[2])))>.1);
   same(r('D','A1'),lin(basis,[1,-1,1]));same(r('A1','D'),lin(basis,[-1,1,-1]));
  }
  if(n===631){same(p.M,mean(p.D,p.C1));same(p.M,mean(p.C,p.D1));same(r('A','M'),lin(edge(),[.5,1,.5]));same(r('A','N'),lin(edge(),[1,.5,.5]));}
  if(n===632){
   same(p.G,mean(p.A,p.B,p.C));same(p.G,mean(p.A1,p.B1,p.C1));same(add(...['A','B','C'].map(k=>r(k,k+'1'))),[0,0,0]);
   const normal=cross(r('_i','_j'),r('_i','_l')),level=dot(normal,p._i);
   for(const k of ['A','B','C']){near(dot(normal,r(k,k+'1')),0);assert(Math.abs(dot(normal,p[k])-level)>.1);}
  }
  if(n===633){same(p.M,mean(p.B,p.C));for(const [a,b,coeff] of [['B','C',[-1,1,0]],['C','D',[0,-1,1]],['D','B',[1,0,-1]],['D','M',[.5,.5,-1]],['D','T',[1/3,2/3,-1]]])same(r(a,b),lin(tet(),coeff));}
  if(n===634){same(p.M,mean(p.A,p.D,p.B));same(p.N,mean(p.B,p.D,p.C));same(r('M','N'),scale(r('A','C'),1/3));same(r('N','T'),scale(r('D','A'),1/3));same(r('O','M'),scale(r('O','A'),1/3));}
  if(n===635){for(const k of ['A','B','C','G'])same(p[k],mean(p[k+'1'],p[k+'2']));for(const k of ['','1','2'])same(p['G'+k],mean(p['A'+k],p['B'+k],p['C'+k]));}
  if(n===636){
   const pts=['A','B','C','S'];same(p.G,mean(...pts.map(k=>p[k])));
   for(const [a,k] of [['A','M'],['B','N'],['C','P']]){
    same(p[k],mean(...pts.filter(s=>s!==a).map(s=>p[s])));same(r('G',k),scale(r('G',a),-1/3));
   }
   for(const [a,b,k,l] of [['A','B','M','N'],['B','C','N','P'],['C','A','P','M']])same(r(k,l),scale(r(a,b),-1/3));
  }
  affineCases++;
 }
}
assert.equal(fields,44);assert.equal(affineCases,30);assert.equal(fieldCases,48);
console.log('VECTOR_CHAPTER_SIX_END_OK',JSON.stringify({fields,affineCases,fieldCases}));
