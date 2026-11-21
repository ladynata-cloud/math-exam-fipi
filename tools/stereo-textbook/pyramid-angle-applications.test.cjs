'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./pyramid-angle-applications.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const pi=Math.PI;
const vec=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>Math.hypot(...a);
const d=(a,b)=>norm(vec(a,b));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b)/(norm(a)*norm(b)))));
const polygon=names=>Math.abs(names.reduce((s,v,i)=>{const w=names[(i+1)%names.length];return s+v[0]*w[1]-v[1]*w[0];},0))/2;
function near(x,y){assert(Math.abs(x-y)<2e-8*Math.max(1,Math.abs(y)),x+' versus '+y);}
const values=[[3,3,3,24],[2,8,16/3,128/3],[8,4,2*Math.sqrt(3),30],[2,2,4,4*Math.sqrt(2)/3,2*Math.sqrt(2)/3],[2,2,Math.sqrt(3),2*Math.sqrt(3)/3,4*Math.sqrt(3)/3]];
let fields=0,variants=0;
for(let n=529;n<=533;n++){
  const id='ex-main-'+String(n).padStart(4,'0'),c=available.get(id),m=c.visualization.model,p=m.points;
  const square=n===530||n===532,base=(square?'ABCD':'ABC').split('').map(k=>p[k]),h=d(p.S,p.O),V=polygon(base)*h/3;
  assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(manifest.parts[n],[null]);
  assert.deepEqual(c.source.printedPages,[139]);assert.deepEqual(c.source.pdfPages,[141]);viewer.prepare(m);
  for(const [i,s] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(values[n-529][i]),s.input.accepted).status,'correct',id+' '+s.id);
    for(const bad of wrongStepAnswers(id,s))assert.equal(engine.classifyAnswer(bad,s.input.accepted).status,'wrong');
    if(i===2)assert(available.has(s.justifications[0].theoryId));fields++;
  }
  for(const v of Object.values(m.views))for(const [a,o,b] of v.rightAngles||[])near(dot(vec(p[a],p[o]),vec(p[b],p[o])),0);
  if(n===529){
    const phi=angle(vec(p.S,p.M),vec(p.C,p.M)),mCH=d(p.C,p.H),N=cross(vec(p.B,p.A),vec(p.S,p.A));
    near(phi,pi/3);near(mCH,3*Math.sqrt(3)/2);near(norm(cross(vec(p.C,p.H),N)),0);
    near(dot(vec(p.H,p.A),N),0);near(V,Math.sqrt(3)*mCH**3/(27*Math.sin(phi)**2*Math.cos(phi)));near(V,3);
  }else if(n===530){
    for(let j=0;j<3;j++)near(p.M[j],(p.A[j]+p.S[j])/2);
    const phi=angle(vec(p.S,p.A),vec(p.O,p.A)),mMK=d(p.M,p.K);
    near(phi,pi/4);near(mMK,1);near(V,16*mMK**3/(3*Math.tan(phi)**2));
  }else if(n===531){
    const axis=vec(p.S,p.A);near(dot(axis,vec(p.B,p.T)),0);near(dot(axis,vec(p.C,p.T)),0);
    const phi=angle(vec(p.B,p.T),vec(p.C,p.T))/2;
    near(Math.tan(phi)**2,2/3);near(d(p.O,p.A)**2,h*h*(3*Math.tan(phi)**2-1));
    near(V,Math.sqrt(3)*h**3*(3*Math.tan(phi)**2-1)/4);
    assert(d(p.T,p.S)>.01&&d(p.T,p.A)>.01,'the dihedral foot is distinct from both edge endpoints');
  }else if(n===532){
    const alpha=angle(vec(p.A,p.S),vec(p.B,p.S)),beta=pi/4,a=d(p.A,p.B);near(alpha,pi/3);near(a,2);
    near(d(p.O,p.A),a/(2*Math.sin(beta)));near(d(p.S,p.A),a/(2*Math.sin(alpha/2)));
    near(V,4*a**3*Math.sqrt(1/Math.tan(alpha/2)**2-1/Math.tan(beta)**2)/(24*Math.tan(beta)));
  }else{
    const a=angle(vec(p.B,p.A),vec(p.C,p.A)),b=angle(vec(p.A,p.B),vec(p.C,p.B)),gamma=angle(vec(p.S,p.A),vec(p.O,p.A));
    near(a,pi/6);near(b,pi/6);near(gamma,pi/4);
    assert(Math.max(...base.map(pt=>pt[1]))<p.O[1],'circumcentre is outside the obtuse base');
    for(const q of base){near(d(q,p.O),h/Math.tan(gamma));near(angle(vec(p.S,q),vec(p.O,q)),gamma);}
    near(V,2*h**3*Math.sin(a)*Math.sin(b)*Math.sin(a+b)/(3*Math.tan(gamma)**2));
  }
}
for(const count of [3,4,5,6,8])for(const scale of [.25,.55,.85]){
  const beta=pi/count,alpha=2*beta*scale;
  const r=1/(2*Math.sin(beta)),ell=1/(2*Math.sin(alpha/2));
  const z=Math.sqrt(ell*ell-r*r),verts=Array.from({length:count},(_,i)=>[r*Math.cos(2*i*beta),r*Math.sin(2*i*beta),0]);
  near(polygon(verts)*z/3,count*Math.sqrt(1/Math.tan(alpha/2)**2-1/Math.tan(beta)**2)/(24*Math.tan(beta)));variants++;
}
for(const A of [pi/9,pi/4,4*pi/9])for(const B of [pi/8,pi/3])for(const gamma of [pi/6,pi/3]){
  const h=3,R=h/Math.tan(gamma),ab=2*R*Math.sin(A+B),ac=2*R*Math.sin(B);
  const verts=[[0,0],[ab,0],[ac*Math.cos(A),ac*Math.sin(A)]];
  near(polygon(verts)*h/3,2*h**3*Math.sin(A)*Math.sin(B)*Math.sin(A+B)/(3*Math.tan(gamma)**2));variants++;
}
assert.equal(fields,22);assert.equal(variants,27);
console.log('ATANASYAN_PYRAMID_ANGLES_OK: five source problems, 22 checked fields, actual feet and normals, exterior circumcentre, 27 polygon and angle/height models');
