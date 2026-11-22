const assert = require('node:assert/strict');
const engine = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bundle = require('../../stereo-course/textbook/data/course.json');
const receipt = require('./additional-coordinate-combinations.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available,issues} = engine.inspectBundle(bundle.catalog,bundle.lessons);
assert.deepEqual(issues,[]);
const mul = (u,k) => u.map(x=>x*k);
const add = (u,v) => u.map((x,i)=>x+v[i]);
const sub = (u,v) => u.map((x,i)=>x-v[i]);
const dot = (u,v) => u.reduce((s,x,i)=>s+x*v[i],0);
const sq = u => dot(u,u);
const triple = u => u.join(';');
const equal = (u,v) => assert(sq(sub(u,v))<1e-12,JSON.stringify([u,v]));
const yes = b => b?'да':'нет';
let fields=0, additionalChecks=0;
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),n=Number(c.source.exercise),k='абвг'.indexOf(c.source.subpart),m=c.visualization.model,p=m.points;
 viewer.prepare(m);assert.equal(c.source.collection,'main');assert.deepEqual(c.source.printedPages,[187]);assert.deepEqual(c.source.pdfPages,[189]);
 assert.deepEqual(new Set(Object.keys(m.views)),new Set(['neutral',...c.steps.map(s=>s.view),...c.help.map(h=>h.view)]));
 let vals;
 if(n===731){
   const [x,y,z]=k===0?[-3,3,3]:[.8,-.5,-.1],a=[-5,0,5],b=[-5,5,0],v=[1,-2,-3],s=add(mul(a,x),mul(b,y)),t=mul(v,z),sum=add(s,t),newSum=add(sum,mul([1,0,-1],z));
   equal(p.A,mul(a,x));equal(p.H,s);equal(p.B,sum);equal(p.T,newSum);vals=[triple(s),triple(t),triple(newSum),triple(sum)];
 }else if(n===732){
   const v=[[-5,3,-1],[-2,3,7],[-2/3,5/9,-1],[.7,-1.2,-5.2]][k],w=[[6,-10,-2],[-1,1.5,3.5],[6,-5,9],[-2.8,4.8,-20.8]][k];equal(p.A,v);equal(p.B,w);const scale=w[0]/v[0],expected=mul(v,scale);equal(expected,p.C);assert(Math.abs(expected[1]-p.D[1])>.99);vals=[scale,triple(expected.slice(1)),'нет',yes(sq(sub(expected,w))<1e-16)];
 }else if(n===733){
   const mid=mul(add(p.A,p.B),.5);equal(mid,p.M);for(let axis=0;axis<3;axis++){const h=mid.map((v,i)=>i===axis?v:0);for(const t of [-5,-1,.5,2,5]){const q=h.map((v,i)=>v+(i===axis?t:0));assert(sq(sub(q,mid))>sq(sub(h,mid)));additionalChecks++;}}vals=[triple(mid),sq(sub(mid,k===0?p.H:p.K)),k===0?triple(p.U):triple([p.V[1],p.W[2]]),k===0?triple(p.H):triple([...p.K,...p.L])];
 }else if(n===734){
   assert.equal(dot(p.B,p.N),0);assert.equal(dot(p.C,p.N),0);assert(sq(p.N)>0);const g=dot(p.A,p.N);equal(p.D,add(p.A,p.N));vals=['0;0',g,dot(p.N,p.D),yes(Math.abs(g)<1e-12)];
 }else if(n===735){
   const ab=sub(p.B,p.A),dc=sub(p.C,p.D);equal(ab,dc);equal(mul(add(p.A,p.C),.5),p.M);equal(mul(add(p.B,p.D),.5),p.M);vals=[triple(ab),triple(dc),'нет','да'];
 }else if(n===736){
   const mid=mul(add(p.B,p.C),.5),g=mul(add(add(p.A,p.B),p.C),1/3);equal(p.K,mid);equal(g,p.G);equal(p.G,add(p.A,mul(sub(mid,p.A),2/3)));vals=[triple(mid),2/3,p.U[2],triple(g)];
 }else if(n===737){
   const w=sub(p.A1,p.A),cnew=add(p.B,sub(p.D,p.A));equal(p.C,cnew);for(const s of ['A','B','C','D'])equal(p[s+'1'],add(p[s],w));vals=[triple(w),triple(cnew),p.C1[2]+(p.T[2]-p.A[2]),triple([...p.C,...p.B1,...p.C1,...p.D1])];
 }else if(n===738){
   const [m,z]=[[1,-1],[1,2],[4,0]][k],t=-z/m;equal(p.M,mul(add(p.A,p.B),.5));assert.equal(p.M[2],0);assert.equal(p.U[2],1);assert.equal(m*t+z,0);vals=[0,m,p.U[2],t];
 }else throw Error(id);
 c.steps.forEach((st,i)=>{assert.equal(engine.classifyAnswer(String(vals[i]),st.input.accepted).status,'correct',id+' '+i+' '+vals[i]);for(const v of wrongStepAnswers(id,st))assert.equal(engine.classifyAnswer(v,st.input.accepted).status,'wrong',id+' '+i+' '+v);fields++;});assert.equal(engine.classifyAnswer(String(vals.at(-1)),c.answer.accepted).status,'correct',id+' final '+vals.at(-1));
}
assert.equal(Object.keys(receipt.parts).length,8);assert.equal(fields,51);assert.equal(additionalChecks,30);
console.log('ADDITIONAL_COORDINATES_731_738_OK: 17 printed cases and all 51 steps recalculated; 30 alternative axis points, every missing corner and all coplanarity normals checked.');
