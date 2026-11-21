'use strict';
const assert=require('node:assert/strict'),engine=require('../../stereo-course/textbook/assets/engine.js'),viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json'),receipt=require('./cube-proofs-and-scalar-product-section-end.json'),{wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b)=>a.map((x,i)=>x+b[i]),mul=(a,k)=>a.map(x=>x*k);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=v=>Math.sqrt(dot(v,v));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,a+' vs '+b);
const cos=(a,b)=>dot(a,b)/(norm(a)*norm(b)),good=(v,accepted)=>assert.equal(engine.classifyAnswer(String(v),accepted).status,'correct',String(v));
let fields=0,skew=0,intersecting=0,heights=0,centroids=0;
const checks={
 712:['1;1;1',0,0,90],713:['-1;-1;1','0;0','0;0',2],714:[1,2,120,60],715:['1/2','sqrt(2)/2',135,45],
 716:[20,'15*sqrt(2)',4,'sqrt(70+15*sqrt(2))/3'],717:['1/2','sqrt(2)/2',135,45],718:['0;0',0,90,90]
};
for(const id of Object.keys(receipt.cards)){
 const c=available.get(id),n=Number(c.source.exercise),m=c.visualization.model,p=m.points;
 viewer.prepare(m);assert.deepEqual(new Set(['neutral',...c.help.map(h=>h.view),...c.steps.map(s=>s.view)]),new Set(Object.keys(m.views)));
 assert.deepEqual(c.source.printedPages,[179]);assert.deepEqual(c.source.pdfPages,[181]);
 if(n===712){
  const verts=['A','B','C','D','A1','B1','C1','D1'].map(k=>p[k]),pairs=[];
  for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)pairs.push([verts[i],verts[j]]);
  const body=pairs.filter(([a,b])=>dot(sub(a,b),sub(a,b))===3),face=pairs.filter(([a,b])=>dot(sub(a,b),sub(a,b))===2);
  assert.equal(body.length,4);assert.equal(face.length,12);
  for(const [a,b] of body)for(const [h,l] of face){const u=sub(b,a),v=sub(l,h);
   assert(norm(cross(u,v))>0);const separated=dot(sub(h,a),cross(u,v));
   if(separated===0){assert.notEqual(dot(u,v),0);intersecting++;}
   else{near(dot(u,v),0);skew++;}
  }
 }
 if(n===713){
  const u=sub(p.M1,p.P),a=sub(p.N1,p.M),b=sub(p.Q1,p.M),h=sub(p.N,p.Q),l=sub(p.P1,p.Q);
  for(const v of [a,b,h,l])near(dot(u,v),0);
  assert(norm(cross(a,b))>0);assert(norm(cross(h,l))>0);
  near(norm(cross(u,cross(a,b))),0);near(norm(cross(u,cross(h,l))),0);
 }
 if(n===714){near(cos(p.U,p.A),Math.SQRT1_2);near(cos(p.U,p.C),Math.SQRT1_2);near(cos(p.V,p.A),Math.SQRT1_2);near(cos(p.V,p.B),Math.SQRT1_2);near(cos(p.U,p.V),.5);near(cos(p.U,p.T),-.5);}
 if(n===715||n===717){
  near(cos(p.B,p.C1),.5);near(cos(p.D,p.C1),.5);near(cos(p.A1,p.C1),Math.SQRT1_2);near(cos(p.C,p.C1),Math.SQRT1_2);near(cos(p.V,p.C1),-Math.SQRT1_2);
 }
 if(n===716){
  near(norm(p.D),5);near(norm(p.B),4);near(norm(p.C),3);near(cos(p.D,p.B),.5);near(cos(p.D,p.C),Math.SQRT1_2);near(cos(p.B,p.C),0);
  const length=Math.sqrt(70+15*Math.SQRT2)/3;near(norm(p.G),length);
  for(const scale of [.25,1,2])for(const sign of [-1,1]){
   const d=mul([p.D[0],p.D[1],sign*p.D[2]],scale),b=mul(p.B,scale),c=mul(p.C,scale),g=mul(add(add(d,b),c),1/3),midpoint=mul(add(b,c),.5);
   near(norm(g),scale*length);near(norm(sub(g,midpoint))*2,norm(sub(d,g)));centroids++;
  }
 }
 if(n===718){const u=sub(p.D,p.B);for(const side of [.5,2,3])for(const h of [-3,-1,0,1,5]){
   const a=mul(p.A,side),d=mul(u,side),k=[0,0,h];near(dot(sub(k,a),d),0);heights++;
  }}
 c.steps.forEach((s,i)=>{good(checks[n][i],s.input.accepted);for(const w of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(w,s.input.accepted).status,'wrong',id+' '+w);fields++;});good(checks[n].at(-1),c.answer.accepted);
}
for(let n=637;n<=718;n++){
 const rows=bank.catalog.entries.filter(c=>c.source.collection==='main'&&c.source.exercise===String(n));
 assert(rows.length&&rows.every(c=>c.status==='reviewed'&&available.has(c.id)),'incomplete source number '+n);
}
for(let t=71;t<=79;t++)assert(available.has('theory-0'+t));
assert.equal(fields,21);assert.equal(skew,24);assert.equal(intersecting,24);assert.equal(centroids,6);assert.equal(heights,15);
console.log('SCALAR_SECTION_COMPLETE: points 76–79, source numbers 682–718. All 48 cube diagonal pairs classified, both independent plane bases, six mirrored centroids, 15 square-height configurations and all 21 final step fields verified');
