'use strict';

const assert = require('node:assert/strict');
const api = require('../../stereo-course/textbook/assets/engine.js');
const viewer = require('../../stereo-course/assets/task-scene-viewer.js');
const bank = require('../../stereo-course/textbook/data/course.json');
const manifest = require('./oblique-prisms.json');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const {available,issues} = api.inspectBundle(bank.catalog,bank.lessons);
assert.deepEqual(issues,[]);
const vec=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>Math.hypot(...a);
const dist=(a,b)=>norm(vec(a,b));
const cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
const close=(a,b)=>assert(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),a+' differs from '+b);
const expectedSteps=[[8,48,4,192],[5,1,3,8],[12,2,54,32],[25,12.5,84,2100]];
for(let n=469;n<=472;n++){
  const c=available.get('ex-main-0'+n), model=c.visualization.model,p=model.points;
  assert(Object.hasOwn(manifest.cards,c.id));
  assert.deepEqual(c.source.pdfPages,[n===472?133:132]);
  assert.deepEqual(c.source.printedPages,[n===472?131:130]);
  viewer.prepare(model);
  const ab=vec(p.B,p.A), ac=vec(p.C,p.A), side=vec(p.A1,p.A), perpendicular=cross(ab,ac);
  for (const name of ['B','C']) {
    const edge=vec(p[name+'1'],p[name]);
    nearVector(edge,side);
  }
  function nearVector(v,u){v.forEach((x,i)=>close(x,u[i]));}
  const S=norm(perpendicular)/2, V=Math.abs(dot(perpendicular,side))/2, h=V/S;
  for (const v of Object.values(model.views))
    for (const [a,o,b] of v.rightAngles||[])close(dot(vec(p[a],p[o]),vec(p[b],p[o])),0);
  if(n===469){
    close(norm(ab),12);close(norm(ac),10);close(dist(p.B,p.C),10);close(norm(side),8);
    close(dist(p.A1,p.H),h);close(h/norm(side),Math.sin(Math.PI/3));close(dist(p.C,p.K),8);
    close(V,192*Math.sqrt(3));close(S*8*Math.sin(Math.PI/6),192);
    assert.equal(api.classifyAnswer(String(V),c.answer.accepted).status,'correct');
  }
  if(n===470){
    const a=norm(ab),b=dist(p.A,p.B1);
    close(a,norm(ac));close(a,dist(p.B,p.C));close(a,norm(side));assert(b<dist(p.B,p.A1));
    close(dot(cross(ab,side),perpendicular),0);close(dist(p.A,p.H),b*b/(2*a));close(dist(p.B1,p.H),h);
    close(V,Math.sqrt(3)*a*b*Math.sqrt(4*a*a-b*b)/8);
    assert.equal(c.answer.mode,'manual');
  }
  if(n===471){
    const m=norm(ab);
    close(m,norm(ac));close(m,dist(p.B,p.C));nearVector(p.O,p.A.map((a,i)=>(a+p.B[i]+p.C[i])/3));
    close(dist(p.O,p.A),m/Math.sqrt(3));close(dist(p.A1,p.O),h);
    const tangent=h/dist(p.A,p.O);close(tangent,1);close(V,m**3*tangent/4);
    assert.equal(c.answer.mode,'manual');
  }
  if(n===472){
    close(norm(ab),7);close(norm(ac),24);close(dot(ab,ac),0);
    for(const name of ['B','C'])close(dist(p.A1,p.A),dist(p.A1,p[name]));
    nearVector(p.O,p.B.map((b,i)=>(b+p.C[i])/2));close(dist(p.A,p.O),h);close(V,1050);
    assert.equal(api.classifyAnswer(String(V),c.answer.accepted).status,'correct');
  }
  c.steps.forEach((s,i)=>{
    assert.equal(api.classifyAnswer(String(expectedSteps[n-469][i]),s.input.accepted).status,'correct');
    for(const wrong of wrongStepAnswers(c.id,s))assert.equal(api.classifyAnswer(wrong,s.input.accepted).status,'wrong');
  });
}
// Reconstruct valid prisms directly from horizontal/vertical projections.
// The determinant independently supplies all four parameterized identities.
let variants=0;
for(const a of [1,3,5,9])for(const degrees of [15,30,45,60,75]){
  const t=degrees*Math.PI/180, u=[a,0,0], v=[a/2,Math.sqrt(3)*a/2,0], areaVector=cross(u,v);
  const rhombus=[-a*Math.cos(t),0,a*Math.sin(t)], diagonal=norm([a+rhombus[0],0,rhombus[2]]);
  close(Math.abs(dot(areaVector,rhombus))/2,Math.sqrt(3)*a*diagonal*Math.sqrt(4*a*a-diagonal**2)/8);
  const overCentre=[a/2,Math.sqrt(3)*a/6,a/Math.sqrt(3)*Math.tan(t)];
  close(Math.abs(dot(areaVector,overCentre))/2,a**3*Math.tan(t)/4);
  const equalSides=[[1,0,0],[0.5,2/3,0]], edge=[a*Math.cos(t),0,a*Math.sin(t)];
  close(Math.abs(dot(cross(...equalSides),edge))/2,a*Math.sin(t)/3);
  const onHypotenuse=[3.5,12,12.5*Math.tan(t)];
  close(dot(cross([7,0,0],[0,24,0]),onHypotenuse)/2,1050*Math.tan(t));
  variants+=4;
}
const additionalSteps = [[3,18,18,60],[24,7,7/4,7/3,8],[90,12,6,126],[80,6,180,1620]];
for(let n=473;n<=476;n++){
  const c=available.get('ex-main-0'+n), m=c.visualization.model, p=m.points;
  assert(Object.hasOwn(manifest.cards,c.id));assert.deepEqual(c.source.pdfPages,[133]);assert.deepEqual(c.source.printedPages,[131]);viewer.prepare(m);
  for (const v of Object.values(m.views))
    for (const [a,o,b] of v.rightAngles||[])close(dot(vec(p[a],p[o]),vec(p[b],p[o])),0);
  if(n===473){
    const ab=vec(p.B,p.A),ad=vec(p.D,p.A),e=vec(p.A1,p.A),c=norm(e),cos=dot(e,ab)/(c*norm(ab));
    close(dot(ab,ad),0);close(cos,dot(e,ad)/(c*norm(ad)));close(norm(e)**2,36);
    close(dot(cross(ab,ad),e),norm(ab)*norm(ad)*c*Math.sqrt(1-2*cos**2));
  }
  if(n===474){
    const u=vec(p.B,p.A),v=vec(p.D,p.A), two=[];
    for (const tag of ['_u','_v']){
      const w=vec(p[tag+'A'],p.A);
      for (const [a,b] of [[u,v],[u,w],[v,w]]){
        close(norm(a),5);close(norm(b),5);
        const diags=[norm(a.map((x,i)=>x+b[i])),norm(vec(a,b))].sort((a,b)=>a-b);
        close(diags[0],6);close(diags[1],8);
      }
      const top='ABCD'.split('').map(k=>tag+k), bottom='ABCD'.split('');
      const vertices=[...bottom,...top];
      assert.equal(new Set(vertices.map(k=>p[k].join(','))).size,8);
      const center=[0,1,2].map(i=>vertices.reduce((sum,k)=>sum+p[k][i],0)/8);
      const faces=[bottom,top];
      for (let i=0;i<4;i++)faces.push([bottom[i],bottom[(i+1)%4],top[(i+1)%4],top[i]]);
      const incidence=new Map();let pyramidsVolume=0;
      for (const names of faces){
        const [a,b,c,d]=names.map(k=>p[k]);
        const allSides=[dist(a,b),dist(b,c),dist(c,d),dist(d,a)];
        allSides.forEach(length=>close(length,5));
        const diagonals=[dist(a,c),dist(b,d)].sort((x,y)=>x-y);
        close(diagonals[0],6);close(diagonals[1],8);
        // Both diagonals bisect each other in space, proving coplanarity and closure.
        for(let i=0;i<3;i++)close(a[i]+c[i],b[i]+d[i]);
        for(let i=0;i<4;i++){
          const edge=[names[i],names[(i+1)%4]].sort().join('/');
          incidence.set(edge,(incidence.get(edge)||0)+1);
        }
        for(const [a,b,c] of [[p[names[0]],p[names[1]],p[names[2]]],
                               [p[names[0]],p[names[2]],p[names[3]]]]){
          pyramidsVolume+=Math.abs(dot(vec(a,center),cross(vec(b,center),vec(c,center))))/6;
        }
      }
      assert.equal(faces.length,6);assert.equal(incidence.size,12);
      assert([...incidence.values()].every(count=>count===2));
      const V=Math.abs(dot(cross(u,v),w));close(pyramidsVolume,V);two.push(V);
      close(V,tag==='_u'?18*Math.sqrt(39):32*Math.sqrt(11));
      for(const key of 'ABCD')w.forEach((d,i)=>close(p[tag+key][i]-p[key][i],d));
    }
    assert(Math.abs(two[0]-two[1])>1);assert.equal(c.answer.mode,'manual');
  }
  if(n>=475){
    const u=vec(p.B,p.A),v=vec(p.C,p.A),w=vec(p.A1,p.A),normal=cross(u,v),section=cross(vec(p.Q,p.P),vec(p.R,p.P)),Q=norm(section)/2;
    for (const [bottom,top,cut] of [['A','A1','P'],['B','B1','Q'],['C','C1','R']]){
      close(dist(p[bottom],p[cut])+dist(p[cut],p[top]),norm(w));
    }
    for(const side of [vec(p.Q,p.P),vec(p.R,p.P)])close(dot(w,side),0);
    close(Q*norm(w),Math.abs(dot(normal,w))/2);
    if(n===476){
      const sides=[dist(p.P,p.Q),dist(p.Q,p.R),dist(p.R,p.P)].sort((a,b)=>a-b);
      [13,30,37].forEach((d,i)=>close(sides[i],d));close(Q,180);close(sides.reduce((a,b)=>a+b)*norm(w),480);
      assert.equal(api.classifyAnswer(String(Q*norm(w)),c.answer.accepted).status,'correct');
    }
  }
  c.steps.forEach((s,i)=>{
    assert.equal(api.classifyAnswer(String(additionalSteps[n-473][i]),s.input.accepted).status,'correct');
    for(const wrong of wrongStepAnswers(c.id,s))assert.equal(api.classifyAnswer(wrong,s.input.accepted).status,'wrong');
  });
}
const theorySteps=[[2,1,4,9],[6,4,24,30],[0.5,0.25,8,28],[1,0.25,16/3,26]];
const expectedPages=[[125,126],[126,127],[128,129],[129,130]];
const area=(a,b,c)=>norm(cross(vec(b,a),vec(c,a)))/2;
function integrate(f,h){
  const n=120,hStep=h/n;let sum=f(0)+f(h);
  for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(i*hStep);
  return hStep*sum/3;
}
for(let no=56;no<=59;no++){
 const c=available.get('theory-0'+no),m=c.visualization.model,p=m.points;
 assert(Object.hasOwn(manifest.cards,c.id));assert.equal(c.kind,'theory');assert.equal(c.answer.mode,'manual');
 assert.deepEqual(c.source.printedPages,expectedPages[no-56]);assert.deepEqual(c.source.pdfPages,expectedPages[no-56].map(x=>x+2));viewer.prepare(m);
 if(no===56){
  for(let i=0;i<=8;i++){
   const ring=Array.from({length:4},(_,k)=>p['_s'+i+'_'+k]);
   const S=area(ring[0],ring[1],ring[2])+area(ring[0],ring[2],ring[3]);
   ring.forEach(point=>close(point[0],i/4));close(S,1+i/4);
  }
  close(integrate(x=>1+x,2),4);close(integrate(x=>2*x,3),9);
 }
 if(no===57){
  const bottom=[p.A,p.B,p.C],middle=[p.P,p.Q,p.R],top=[p.A1,p.B1,p.C1];
  close(area(...bottom),6);close(area(...middle),6);close(area(...top),6);
  bottom.forEach((v,i)=>v.forEach((x,j)=>close(middle[i][j],(x+top[i][j])/2)));
  close(dist(p.A1,p.H),4);close(dot(vec(p.A1,p.H),vec(p.B,p.A)),0);
  close(integrate(()=>area(...middle),4),24);
 }
 if(no>=58){
  const count=no===58?3:24;
  const mid=Array.from({length:count},(_,i)=>p['_r0_'+i]),base=Array.from({length:count},(_,i)=>p['_r1_'+i]);
  mid.forEach((v,i)=>v.forEach((x,j)=>close(x,base[i][j]/2)));
  const h=dist(p.O,p.H),S=no===58?area(...base):Math.PI*dist(base[0],p.H)**2;
  close(integrate(x=>S*(x/h)**2,h),no===58?8:16*Math.PI/3);
  if(no===58){
   close(area(...mid),S/4);close(integrate(z=>(2+2*z/3)**2,3),28);
  }else{
   base.forEach(v=>close(dist(v,p.H),2));mid.forEach(v=>close(dist(v,p.M),1));
   close(integrate(z=>(1+2*z/6)**2,6),26);
  }
 }
 c.steps.forEach((step,i)=>{
  assert.equal(api.classifyAnswer(String(theorySteps[no-56][i]),step.input.accepted).status,'correct');
  for(const wrong of wrongStepAnswers(c.id,step))assert.equal(api.classifyAnswer(wrong,step.input.accepted).status,'wrong');
 });
}
assert.equal(Object.keys(manifest.cards).length,12);
console.log('ATANASYAN_OBLIQUE_PRISMS_OK 8 source exercises and 4 volume theorems, 49 checked fields, 80 parameter models, two rhombohedra, exact slices, integrals and both frustum transfers');
