'use strict';
const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./normal-prism-applications.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);assert.deepEqual(issues,[]);
const vec=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>Math.hypot(...a);
const d=(a,b)=>norm(vec(a,b));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const detPrism=(a,b,c,w)=>Math.abs(dot(cross(vec(b,a),vec(c,a)),w))/2;
function near(x,y){assert(Math.abs(x-y)<1e-8*Math.max(1,Math.abs(y)),x+' versus '+y);}
const values=[[2,8,2*Math.sqrt(6),16*Math.sqrt(6)],[.5,24,12,20],[8,12,12,18],[2,10.2,12.24,6.12,12.24]];
let fields=0,models=0;
for(let n=525;n<=528;n++){
  const id='ex-main-'+String(n).padStart(4,'0'),c=available.get(id),m=c.visualization.model,p=m.points;
  const w=vec(p.A1,p.A),vol=detPrism(p.A,p.B,p.C,w);
  assert(Object.hasOwn(manifest.cards,id));assert.deepEqual(manifest.parts[n],[null]);
  assert.deepEqual(c.source.printedPages,[139]);assert.deepEqual(c.source.pdfPages,[141]);
  viewer.prepare(m);
  for(const [i,step] of c.steps.entries()){
    assert.equal(engine.classifyAnswer(String(values[n-525][i]),step.input.accepted).status,'correct',id+' '+step.id);
    for(const wrong of wrongStepAnswers(id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
    if(i===2)assert(available.has(step.justifications[0].theoryId));fields++;
  }
  for(const v of Object.values(m.views))for(const [a,o,b] of v.rightAngles||[])near(dot(vec(p[a],p[o]),vec(p[b],p[o])),0);
  if(n===525){
    const a=d(p.A,p.B),normal=cross(vec(p.C,p.B),w),diag=vec(p.A1,p.B),D=norm(diag),sin=Math.abs(dot(normal,diag))/(norm(normal)*D);
    near(d(p.A,p.C),a);near(d(p.B,p.C),a);near(sin,.5);near(d(p.A1,p.H1),D*sin);
    near(dot(vec(p.A1,p.H1),vec(p.C,p.B)),0);near(dot(vec(p.A1,p.H1),w),0);
    near(vol,D**3*sin**2*Math.sqrt(3-4*sin**2)/3);near(vol,2*Math.sqrt(6));
  }else if(n===526){
    const face=norm(cross(vec(p.B,p.A),w)),dist=d(p.C,p.H);near(face,8);near(dist,3);near(vol,face*dist/2);
    near(dot(vec(p.C,p.H),w),0);near(dot(vec(p.C,p.H),vec(p.B,p.A)),0);
    near(detPrism(p.D,p.B,p.C,w),vol);
  }else if(n===527){
    near(vol,12);
    for(const k of ['A','B','C']){near(d(p[k],p[k+'1']),d(p[k+'n'],p[k+'n1']));near(norm(cross(w,vec(p[k+'n'],p[k]))),0);}
    near(detPrism(p.An,p.Bn,p.Cn,w),vol);
    for(const a of [-3,0,7])for(const b of [-1,4])for(const c of [-2,8,15]){
      const move=(q,t)=>q.map((x,i)=>x+t*w[i]);
      near(detPrism(move(p.A,a),move(p.B,b),move(p.C,c),w),vol);models++;
    }
  }else{
    const areas=[[p.A,p.B],[p.B,p.C],[p.C,p.A]].map(([a,b])=>norm(cross(vec(b,a),w))).sort((x,y)=>x-y);
    const lengths=[d(p.M,p.N),d(p.M,p.P),d(p.N,p.P)].sort((a,b)=>a-b);
    near(norm(w),.5);near(areas[0],2);near(areas[1],3.7);near(areas[2],5.1);near(areas.reduce((x,y)=>x+y),10.8);
    near(lengths[0],4);near(lengths[1],7.4);near(lengths[2],10.2);
    for(const [x,y] of [[p.N,p.M],[p.P,p.M]])near(dot(vec(x,y),w),0);
    assert(p.H[0]<p.M[0]);near(d(p.P,p.H),6.12);
    const s=lengths.reduce((a,b)=>a+b)/2,heron=Math.sqrt(lengths.reduce((res,a)=>res*(s-a),s));
    near(heron,12.24);near(vol,6.12);near(vol,heron*norm(w));
  }
}
for(const a of [.25,2,3])for(const h of [.2,1,4,12]){
  const D=Math.hypot(a,h),s=Math.sqrt(3)*a/(2*D);
  assert(s>0&&s<Math.sqrt(3)/2);near(D**3*s**2*Math.sqrt(3-4*s**2)/3,Math.sqrt(3)*a*a*h/4);
  models++;
}
assert.equal(fields,17);assert.equal(models,30);assert.equal(Object.keys(manifest.cards).length,4);
console.log('ATANASYAN_NORMAL_PRISM_APPLICATIONS_OK: four actual source problems, 17 checked fields, orthogonal projection, proof by completion, 18 independent slides and 12 prism shapes');
