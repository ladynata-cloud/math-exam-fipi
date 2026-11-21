'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=require('../ege-profil/part-two/content-geometry.js');
const close=(a,b,label)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${label}: ${a} != ${b}`);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.sqrt(dot(a,a));
const tri=(a,b,c)=>norm(cross(sub(b,a),sub(c,a)))/2;
const tetra=(a,b,c,d)=>Math.abs(dot(sub(b,a),cross(sub(c,a),sub(d,a))))/6;
function numeric(value){
  if(typeof value==='number')return value;
  const s=String(value).replace(/sqrt\((\d+)\)/g,(_,n)=>String(Math.sqrt(Number(n))));
  assert.match(s,/^\d+(?:\.\d+)?(?:[*/]\d+(?:\.\d+)?)*$/);
  const parts=s.split(/([*/])/);let n=Number(parts[0]);
  for(let i=1;i<parts.length;i+=2)n=parts[i]==='*'?n*Number(parts[i+1]):n/Number(parts[i+1]);
  return n;
}
const answer=(task,index=0)=>numeric(task.final[index].answers[0]);
const tasks=kind=>lessons.flatMap(l=>l.tasks).filter(t=>t.meta.kind===kind);
test('12 distinct methods, 72 unique tasks, diagrams, proof rubric and existing prerequisite routes',()=>{
  assert.equal(lessons.length,12);assert.equal(lessons.filter(l=>l.exam===15).length,6);assert.equal(lessons.filter(l=>l.exam===18).length,6);
  const ids=new Set();
  for(const l of lessons){
    assert.equal(l.tasks.length,6);assert.ok(l.theory.length>=3);
    for(const p of l.prerequisites){const clean=p.href.split(/[?#]/)[0];assert.ok(fs.existsSync(path.join(__dirname,'..',clean.endsWith('/')?clean+'index.html':clean)),p.href);}
    for(const t of l.tasks){assert.ok(!ids.has(t.id));ids.add(t.id);assert.ok(t.proof.prompt.length>25);assert.ok(t.proof.criteria.length>=3);assert.equal(t.steps.length,3);assert.ok(t.solution.length>=3);assert.ok(t.diagram.startsWith('<svg'));assert.match(t.diagram,/role="img"/);assert.doesNotMatch(t.diagram,/NaN|undefined|Infinity/);assert.ok(t.final.every(f=>f.answers.length>0));}
  }
  assert.equal(ids.size,72);
});
test('Projection: feet are on BC and both AK and SK are perpendicular to BC; independently measured SK',()=>{
  for(const t of tasks('projection')){const {u,v,h,k}=t.meta;const A=[0,0,0],B=[u,0,0],C=[0,v,0],S=[0,0,h];
    close(k[0]/u+k[1]/v,1,'K on BC');close(dot(sub(k,A),sub(C,B)),0,'AK perpendicular');close(dot(sub(k,S),sub(C,B)),0,'SK perpendicular');close(answer(t),norm(sub(S,k)),t.id);
  }
});
test('Line-plane: sine equals absolute scalar component along unit normal',()=>{
  for(const t of tasks('line-plane')){const {u,v,h}=t.meta;const diagonal=[u,v,h],normal=cross([u,0,0],[0,v,0]);close(answer(t),Math.abs(dot(diagonal,normal))/(norm(diagonal)*norm(normal)),t.id);}
});
test('Dihedral: angle between face and base normals agrees with the supplied tangent',()=>{
  for(const t of tasks('dihedral')){const {a,h}=t.meta;const A=[-a/2,-a/2,0],B=[a/2,-a/2,0],S=[0,0,h],face=cross(sub(B,A),sub(S,A)),base=[0,0,1];close(answer(t),norm(cross(face,base))/Math.abs(dot(face,base)),t.id);}
});
test('Point-plane distance independently from cross-product normal and foot projection',()=>{
  for(const t of tasks('distance')){const {u,v,h}=t.meta;const B=[u,0,0],C=[0,v,0],S=[0,0,h],n=cross(sub(C,B),sub(S,B));const foot=mul(n,dot(n,B)/dot(n,n));close(dot(n,sub(foot,B)),0,'foot on plane');close(answer(t),norm(foot),t.id);}
});
test('Parallel section: vector areas and determinant volumes, including remaining frustum',()=>{
  for(const t of tasks('section')){const {u,v,h,m,n}=t.meta,r=m/n,A=[0,0,0],B=[u,0,0],C=[0,v,0],S=[0,0,h],M=add(S,mul(sub(A,S),r)),N=add(S,mul(sub(B,S),r)),P=add(S,mul(sub(C,S),r));
    const normalSmall=cross(sub(N,M),sub(P,M)),normalBase=cross(sub(B,A),sub(C,A));close(norm(cross(normalSmall,normalBase)),0,'parallel planes');close(answer(t),tri(M,N,P),t.id+' area');close(answer(t,1),tetra(S,A,B,C)-tetra(S,M,N,P),t.id+' volume');
  }
});
test('Skew-line angle: scalar triple product proves non-coplanarity; dot product gives angle',()=>{
  for(const t of tasks('coordinate-angle')){const {u,v,h}=t.meta,p=[u,0,h],q=[0,v,h],base=[u,0,0];assert.notEqual(dot(base,cross(p,q)),0);close(answer(t),Math.abs(dot(p,q))/(norm(p)*norm(q)),t.id);}
});
test('Similarity: projected parallel construction and determinant area',()=>{
  for(const t of tasks('similarity')){const {m,n,h}=t.meta,A=[0,0,0],B=[m+n,0,0],C=[m+n,h,0],D=[m,0,0],E=mul(C,m/(m+n));close(norm(cross(sub(E,D),sub(C,B))),0,'DE parallel BC');close(answer(t),norm(sub(E,D)),t.id);close(answer(t,1),tri(A,D,E),t.id+' area');}
});
test('Tangencies: T/U lie on circle, OT is perpendicular to PT, chord length independently computed',()=>{
  for(const t of tasks('tangents')){const {r,d}=t.meta;const x=r*r/d,y=Math.sqrt(r*r-x*x),P=[d,0,0],T=[x,y,0],U=[x,-y,0];close(norm(T),r,'T on circle');close(dot(T,sub(P,T)),0,'tangent');close(answer(t),norm(sub(P,T)),t.id);close(answer(t,1),norm(sub(T,U)),t.id+' chord');}
});
test('Cyclic trapezoids: all four vertices lie on one circle and their side/diagonal lengths match',()=>{
  for(const t of tasks('cyclic')){const {a,b,h,l}=t.meta,p=(a-b)/2,A=[0,0,0],B=[a,0,0],C=[p+b,h,0],D=[p,h,0],O=[a/2,(b*b+4*h*h-a*a)/(8*h),0];const radius=norm(sub(A,O));for(const V of [B,C,D])close(norm(sub(V,O)),radius,'concyclic');close(norm(sub(D,A)),l,'leg');close(answer(t),norm(sub(C,A)),t.id);}
});
test('Bisector: compute coordinates from sides; verify equal angles and actual AD length',()=>{
  for(const t of tasks('bisector')){const {a,b,c}=t.meta;assert.ok(a+b>c&&a+c>b&&b+c>a);const x=(c*c-b*b+a*a)/(2*a),A=[x,Math.sqrt(c*c-x*x),0],B=[0,0,0],C=[a,0,0],D=[a*c/(b+c),0,0],AD=sub(D,A);close(dot(sub(B,A),AD)/(c*norm(AD)),dot(sub(C,A),AD)/(b*norm(AD)),'bisected angles');close(answer(t),norm(sub(D,B)),t.id+' BD');close(answer(t,1),norm(AD),t.id+' AD');}
});
test('Cevians: solve the line intersection, equal determinant areas and actual segment ratio',()=>{
  for(const t of tasks('cevians')){const {m,n,b,h}=t.meta,A=[0,h,0],B=[0,0,0],C=[b,0,0],D=[b*m/(m+n),0,0],E=[b/2,h/2,0];const ag=(m+n)/(2*m+n),G=add(A,mul(sub(D,A),ag));close(norm(cross(sub(G,B),sub(E,B))),0,'G on BE');close(tri(A,B,G),tri(C,B,G),'equal areas');close(answer(t),norm(sub(G,A))/norm(sub(D,G)),t.id+' ratio');close(answer(t,1),tri(A,B,G),t.id+' area');}
});
test('Altitude: coordinate right angle, actual hypotenuse pieces, side length and determinant area',()=>{
  for(const t of tasks('altitude')){const {p,q}=t.meta,A=[p,Math.sqrt(p*q),0],B=[0,0,0],C=[p+q,0,0];close(dot(sub(B,A),sub(C,A)),0,'right angle');close(answer(t),norm(sub(B,A)),t.id);close(answer(t,1),tri(A,B,C),t.id+' area');}
});
