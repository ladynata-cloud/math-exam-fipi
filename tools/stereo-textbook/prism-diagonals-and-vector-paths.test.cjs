'use strict';

const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./prism-diagonals-and-vector-paths.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const answers={
 '0571-a':['5','13','13','17'],'0571-b':['K1N','ML1','нет','15'],'0571-c':['NM1','K1L','153','25'],
 '0572-a':['0','AC','PQ','0'],'0572-b':['0','AQ','AK','AP'],'0572-c':['0','CK','CP','CM'],'0572-d':['BA','DC','0','AB']
};
const sums={a:['AB','MN','BC','CA','PQ','NM'],b:['FK','MQ','KP','AM','QK','PF'],
 c:['KM','DF','AC','FK','CD','CA','MP'],d:['AB','BA','CD','MN','DC','NM']};
const printed={a:'PQ',b:'AK',c:'CP',d:null};
const minus=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b)=>a.map((x,i)=>x+b[i]),scale=(a,k)=>a.map(x=>x*k);
const vec=(p,a,b)=>minus(p[b],p[a]),norm=v=>Math.hypot(...v),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const equal=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-9);
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' versus '+b);
let fields=0,configurations=0;
for(const [suffix,values] of Object.entries(answers)){
 const id='ex-main-'+suffix,c=available.get(id),m=c.visualization.model,t=suffix.at(-1);
 assert(Object.hasOwn(manifest.cards,id));viewer.prepare(m);
 assert.deepEqual(c.source.printedPages,[149]);assert.deepEqual(c.source.pdfPages,[151]);
 assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 for(const [i,s] of c.steps.entries()){
  assert.equal(engine.classifyAnswer(values[i],s.input.accepted).status,'correct',id+'/'+s.id);
  for(const w of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(w,s.input.accepted).status,'wrong',id+'/'+s.id+'/'+w);fields++;
 }
 if(suffix.startsWith('0571')){
  for(const [width,depth,height] of [[3,4,12],[5,8,15],[9,12,12],[7,10,24]]){
   const p=Object.fromEntries(Object.entries(m.points).map(([k,[x,y,z]])=>[k,[x*width/3,y*depth/4,z*height/12]]));
   let left,right;
   if(t==='a'){
    const mk=vec(p,'M','K'),up=vec(p,'M','M1'); left=add(mk,up);right=minus(mk,up);
    near(dot(mk,up),0);assert(equal(left,vec(p,'M','K1')) && equal(right,vec(p,'M','R')));
    near(norm(left)**2,width**2+depth**2+height**2);
   }else if(t==='b'){
    left=minus(vec(p,'K1','L1'),vec(p,'N','L1'));right=add(vec(p,'M','L'),vec(p,'M','M1'));
    assert(equal(left,vec(p,'K1','N')) && equal(right,vec(p,'M','L1')));
    assert(equal(left,scale(right,-1)));near(norm(left)**2,depth**2+height**2);
   }else{
    left=minus(vec(p,'N','L'),vec(p,'M1','L'));right=minus(vec(p,'K1','N'),vec(p,'L','N'));
    assert(equal(left,vec(p,'N','M1')) && equal(right,vec(p,'K1','L')));
    assert(!equal(left,right) && !equal(left,scale(right,-1)));near(norm(left)**2,width**2+height**2);
   }
   near(norm(left),norm(right));configurations++;
  }
 }else{
  const words=sums[t],key=printed[t];assert.deepEqual(m.arrows,words.map(x=>[...x]));
  for(let k=1;k<=4;k++){
   // Perturb every named vertex independently. The cancellation holds without an assumed solid or coplanarity.
   const p=Object.fromEntries(Object.entries(m.points).map(([name,v],i)=>[name,v.map((x,j)=>x*k+(i+1)**(j+1)/(k+2))]));
   const result=words.reduce((sum,w)=>add(sum,vec(p,...w)),[0,0,0]);
   assert(equal(result,key?vec(p,...key):[0,0,0]));
   assert.equal(engine.classifyAnswer(key||'0',c.answer.accepted).status,'correct');configurations++;
  }
 }
}
assert.deepEqual(manifest.parts,{'571':['а','б','в'],'572':['а','б','в','г']});
assert.equal(fields,28);assert.equal(configurations,28);
console.log('ATANASYAN_PRISM_DIAGONALS_PATHS_OK: three independent prism norm identities, all four directed source sums, 28 fields and 28 configurations');
