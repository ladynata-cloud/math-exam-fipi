'use strict';

const assert=require('node:assert/strict');
const engine=require('../../stereo-course/textbook/assets/engine.js');
const viewer=require('../../stereo-course/assets/task-scene-viewer.js');
const bank=require('../../stereo-course/textbook/data/course.json');
const manifest=require('./pyramid-frusta.json');
const {wrongStepAnswers}=require('./wrong-step-answers.cjs');
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dot=(u,v)=>u.reduce((sum,x,i)=>sum+x*v[i],0);
const cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
const norm=a=>Math.hypot(...a);
const d=(a,b)=>norm(sub(a,b));
const triangles=face=>face.slice(1,-1).map((p,i)=>[face[0],p,face[i+2]]);
const area=face=>triangles(face).reduce((sum,[a,b,c])=>sum+norm(cross(sub(b,a),sub(c,a)))/2,0);
const tetra=(a,b,c,o)=>Math.abs(dot(cross(sub(b,a),sub(c,a)),sub(o,a)))/6;
function near(actual,expected){assert(Math.abs(actual-expected)<1e-8*Math.max(1,Math.abs(expected)),actual+' differs from '+expected);}
function closedVolume(faces){
  const vertices=[...new Set(faces.flat())];
  const interior=[0,1,2].map(i=>vertices.reduce((s,p)=>s+p[i],0)/vertices.length);
  return faces.flatMap(triangles).reduce((v,[a,b,c])=>v+tetra(a,b,c,interior),0);
}
const {available,issues}=engine.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
assert.deepEqual(manifest.parts,{'490':[null],'491':[null],'492':[null],'493':[null]});
const fields=[[3,141,7/4,63/8],[3,3,39,42],[20,1440,1260,2600],[10,9/2,38,224]];
for(let n=490;n<=493;n++){
  const c=available.get('ex-main-0'+n),m=c.visualization.model,p=m.points;
  assert(Object.hasOwn(manifest.cards,c.id));
  assert.deepEqual(c.source.printedPages,[132]);assert.deepEqual(c.source.pdfPages,[134]);
  viewer.prepare(m);
  c.steps.forEach((step,i)=>{
    assert.equal(engine.classifyAnswer(String(fields[n-490][i]),step.input.accepted).status,'correct');
    for(const wrong of wrongStepAnswers(c.id,step))assert.equal(engine.classifyAnswer(wrong,step.input.accepted).status,'wrong');
  });
  for(const hint of c.help)assert(Object.hasOwn(m.views,hint.view));
  if(n!==492){
    assert.equal(c.steps[2].justifications[0].theoryId,'theory-058');
    assert.ok(available.get('theory-058'));
  }
  for(const view of Object.values(m.views))
    for(const [a,o,b] of view.rightAngles||[])near(dot(sub(p[a],p[o]),sub(p[b],p[o])),0);
  const faces=m.faces.map(names=>names.map(name=>p[name])),base=faces[0],top=faces[1],volume=closedVolume(faces);
  const S=area(base),s=area(top),height=top[0][2]-base[0][2],ratio=Math.sqrt(s/S);
  const edges=new Map();
  for(const f of m.faces)for(let i=0;i<f.length;i++){
    const key=[f[i],f[(i+1)%f.length]].sort().join('/');edges.set(key,(edges.get(key)||0)+1);
  }
  assert([...edges.values()].every(count=>count===2),'closed surface');
  for(let i=0;i<base.length;i++){
    near(top[i][2],height);near(base[i][2],0);
    const j=(i+1)%base.length;
    near(d(top[i],top[j]),ratio*d(base[i],base[j]));
  }
  near(volume,height*(S+s+Math.sqrt(S*s))/3);
  if(n===490){
    const a=d(p.A,p.B);
    near(a,12);near(d(p.A1,p.B1),a/2);near(d(p.M,p.M1),a);
    near(d(p.O,p.M)-d(p.O1,p.M1),d(p.M,p.K));near(d(p.M,p.K)**2,3);
    near(height**2,141);near(volume,7*a**3*Math.sqrt(47)/192);
  }else if(n===491){
    near(dot(sub(p.B,p.A),sub(p.C,p.A)),0);near(d(p.A,p.B),d(p.A,p.C));
    const m=d(p.B,p.C),k=d(p.B1,p.C1),t=height/d(p.M,p.K);
    near(m,10);near(k,4);near(t,1);near(d(p.M,p.K),(m-k)/2);
    near(norm(cross(sub(p.A1,p.A),[0,0,1])),0);
    near(volume,(m**3-k**3)*t/24);
  }else if(n===492){
    near(d(p.A,p.B),24);near(d(p.A,p.C),18);near(d(p.O,p.T),20);
    for(const key of 'ABC'){
      near(d(p[key],p.T),25);
      for(let i=0;i<3;i++)near(p[key+'1'][i],(p.T[i]+p[key][i])/2);
    }
    const full=tetra(...base,p.T),tip=tetra(...top,p.T);
    near(full,1440);near(tip,180);near(volume,full-tip);
  }else{
    near(S,36);near(s,16);near(d(p.A,p.C),6*Math.sqrt(2));near(d(p.A1,p.C1),4*Math.sqrt(2));
    near(area([p.A,p.C,p.C1,p.A1]),15);near(volume,38*Math.sqrt(2));
    assert(m.faces.slice(2).every(f=>!(f.includes('A')&&f.includes('C'))));
  }
  if(n>=492){
    assert.equal(c.answer.mode,'exact');assert.equal(engine.classifyAnswer(String(volume),c.answer.accepted).status,'correct');
  }else assert.equal(c.answer.mode,'manual');
}
// Construct oblique frusta as closed meshes, including centres outside the base.
// Their determinant volumes agree with the general area formula independently of shear.
let variants=0;
for(const count of [3,4,5])for(const k of [0.25,0.5,0.8])for(const h of [1,3,8]){
  const base=Array.from({length:count},(_,i)=>[5*Math.cos(2*Math.PI*i/count),5*Math.sin(2*Math.PI*i/count),0]);
  const top=base.map(([x,y])=>[k*x+7,k*y-4,h]);
  const sides=base.map((a,i)=>{const j=(i+1)%count;return [a,base[j],top[j],top[i]];});
  near(closedVolume([base,top,...sides]),h*area(base)*(1+k+k*k)/3);variants++;
}
console.log('ATANASYAN_PYRAMID_FRUSTA_OK: four source exercises, 16 fields, closed triangulated models, removable tip, diagonal plane and '+variants+' oblique variants');
