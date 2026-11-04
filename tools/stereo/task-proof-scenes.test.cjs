'use strict';
const assert=require('node:assert/strict');
const Proofs=require('../../stereo-course/data/proofs.json');
const Scenes=require('../../stereo-course/assets/task-scenes.js');
const API=require('../../stereo-course/assets/task-proof-scenes.js');
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,n)=>a.map(v=>v*n);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>Math.hypot(...a),dist=(a,b)=>norm(sub(a,b));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
let checks=0;
function close(a,b,label=''){assert(Number.isFinite(a)&&Number.isFinite(b));assert(Math.abs(a-b)<1e-7*(1+Math.abs(b)),label+`: ${a} != ${b}`);checks++;}
function vec(a,b,label=''){a.forEach((v,i)=>close(v,b[i],label));}
function area(ps){let v=[0,0,0];for(let i=0;i<ps.length;i++)v=add(v,cross(ps[i],ps[(i+1)%ps.length]));return norm(v)/2;}
function angle(a,b){return Math.acos(Math.max(-1,Math.min(1,dot(a,b)/norm(a)/norm(b))));}
function onLine(p,a,b){close(norm(cross(sub(p,a),sub(b,a))),0);}
function coplanar(ps){let n=null;for(let i=1;i<ps.length-1&&!n;i++){const v=cross(sub(ps[i],ps[0]),sub(ps[i+1],ps[0]));if(norm(v)>1e-8)n=v;}assert(n,'degenerate plane polygon');for(const p of ps)close(dot(sub(p,ps[0]),n)/norm(n),0,'coplanar');}
const exactKeys=['incidence','parallel','skew','plane-parallel','section','perpendicular','projection','dihedral','box-diagonal','pyramid','frustum','cylinder-area','cone-area','sphere-cut','pyramid-volume','sphere-volume','basis','dot','scale'];
assert.deepEqual(API.keys,exactKeys);assert.deepEqual(Object.keys(Proofs),exactKeys);
for(const key of exactKeys){
 const proof=Proofs[key],before=structuredClone(proof),s=API.buildProof(key,proof),m=s.model,p=m.points,f=s.facts;
 try{
  assert.equal(Scenes.buildProof,API.buildProof);assert.equal(Scenes.mountProof,API.mountProof);assert.notEqual(s.status,'unsupported');assert.equal(s.title,proof.title);assert.deepEqual(s.given,[proof.given]);assert.equal(s.find,proof.goal);assert.equal(s.goalLabel,'Требуется');assert.equal(s.stepViews.length,proof.steps.length);assert.equal(m.note,s.note);assert(s.note.includes('Вращение'));
  for(const point of Object.values(p)){assert.equal(point.length,3);assert(point.every(Number.isFinite));}
  for(const edge of [...m.edges,...m.arrows]){assert.equal(edge.length,2);edge.forEach(n=>assert(p[n],'missing edge '+n));}
  for(const face of m.faces)coplanar(face.map(n=>{assert(p[n]);return p[n];}));
  for(const [name,v] of Object.entries(m.views)){assert(v.label);for(const e of v.segments){assert.equal(e.length,2);e.forEach(n=>assert(p[n],key+'/'+name+' missing segment '+n));}for(const n of v.points)assert(p[n]);if(v.polygon.length)coplanar(v.polygon.map(n=>{assert(p[n]);return p[n];}));}
  for(const n of m.labelNames){assert(p[n]);assert.equal(typeof m.labels[n],'string');}
  for(const name of s.stepViews)assert(m.views[name]);
  // No proof statement or justification is used to populate a scene. The
  // given and requested conclusion deliberately remain visible as task text.
  const modified=structuredClone(proof);modified.steps=modified.steps.map((step,i)=>({...step,text:'PRIVATE_PROOF_TEXT_'+i,reason:'PRIVATE_PROOF_REASON_'+i}));assert.deepEqual(API.buildProof(key,modified),s,'proof text leaked into scene');
  const initialText=[m.views.neutral.label,...m.labelNames.map(n=>m.labels[n]),s.note].join('\n');for(const step of proof.steps){assert(!initialText.includes(step.text),'initial statement leak');assert(!initialText.includes(step.reason),'initial reason leak');}
  assert.deepEqual(proof,before,'proof mutated');assert.throws(()=>API.buildProof(key,{...proof,given:proof.given+' Изменено.'}),/requires review/);assert.throws(()=>API.buildProof(key,{...proof,goal:'Иная цель.'}),/requires review/);
  switch(key){
   case'incidence':onLine(p.O,p['a₋'],p['a₊']);onLine(p.O,p['b₋'],p['b₊']);onLine(p.A,p['a₋'],p['a₊']);onLine(p.B,p['b₋'],p['b₊']);assert(norm(cross(sub(p.A,p.O),sub(p.B,p.O)))>0);assert(!m.labelNames.includes('A'));assert(!m.labelNames.includes('B'));assert.equal(m.faces.length,0,'plane should appear at proof step');break;
   case'parallel':close(norm(cross(sub(p['B₁'],p['A₁']),sub(p.B,p.A))),0);assert(p['A₁'][2]!==p.A[2]);assert.notEqual(dist(p.A,p.B),dist(p.A,p.D),'proof is rectangular box, not accidental numeric cube reuse');break;
   case'skew':for(const edge of m.edges)close(dist(p[edge[0]],p[edge[1]]),3);assert(Math.abs(dot(sub(p.C,p.A),cross(sub(p.B,p.A),sub(p['C₁'],p.C))))>0);break;
   case'plane-parallel':close(norm(cross(sub(p.B,p.A),sub(p.D,p.C))),0);assert.notEqual(p.A[2],p.C[2]);coplanar([p.A,p.B,p.C,p.D]);break;
   case'section':{assert.equal(m.faces.length,4,'tetrahedron proof, not numeric cube');vec(p.M,mul(add(p.A,p.B),.5));vec(p.N,mul(add(p.A,p.C),.5));for(const n of f.section)close(dot(p[n],f.plane.n),f.plane.d);assert(Math.abs(f.plane.n[2])<.99999,'section plane differs fromABC');assert(dist(p.K,mul(add(p.A,p.D),.5))>.1,'third point must not be silently another midpoint');close(norm(cross(sub(p.N,p.M),sub(p.C,p.B))),0);close(dist(p.M,p.N)/dist(p.B,p.C),.5);const intersects=[];for(const [a,b] of m.edges){const da=dot(p[a],f.plane.n)-f.plane.d,db=dot(p[b],f.plane.n)-f.plane.d;if(da*db<0)intersects.push(add(p[a],mul(sub(p[b],p[a]),da/(da-db))));}assert.equal(intersects.length,3);for(const point of intersects)assert(f.section.some(n=>dist(point,p[n])<1e-7));break;}
   case'perpendicular':close(dot(sub(p.S,p.A),sub(p.B,p.A)),0);close(dot(sub(p.S,p.A),sub(p.D,p.A)),0);assert(norm(cross(sub(p.B,p.A),sub(p.D,p.A)))>0);close(dot(sub(p.S,p.A),sub(p.C,p.A)),0);break;
   case'projection':{const l=sub(p.T,p.L);assert(dist(p.B,p.H)>0);close(p.B[2],0);close(p.H[2],0);close(dot(l,sub(p.B,p.H)),0);close(dot(l,sub(p.H,p.A)),0);close(dot(l,sub(p.B,p.A)),0);vec(add(sub(p.H,p.A),sub(p.B,p.H)),sub(p.B,p.A));onLine(p.B,p.L,p.T);break;}
   case'dihedral':vec(p.M,mul(add(p.A,p.B),.5));close(dist(p.S,p.A),dist(p.S,p.B));close(dot(sub(p.S,p.M),sub(p.B,p.A)),0);close(dot(sub(p.O,p.M),sub(p.B,p.A)),0);close(dist(p.A,p.B),dist(p.B,p.C));break;
   case'box-diagonal':{const a=dist(p.A,p.B),b=dist(p.A,p.D),h=dist(p.A,p['A₁']);close(dist(p.A,p.C)**2,a*a+b*b);close(dot(sub(p['C₁'],p.C),sub(p.C,p.A)),0);close(dist(p.A,p['C₁'])**2,a*a+b*b+h*h);for(const text of ['a','b','h'])assert(Object.values(m.labels).includes(text));break;}
   case'pyramid':{assert.equal(f.base.length,5);const lengths=f.base.map((n,i)=>dist(p[n],p[f.base[(i+1)%f.base.length]]));for(const length of lengths)close(length,lengths[0]);const apothems=f.base.map((n,i)=>dist(p.S,mul(add(p[n],p[f.base[(i+1)%f.base.length]]),.5)));for(const l of apothems)close(l,f.apothem);const lateral=m.faces.filter(face=>face.includes('S')).reduce((sum,face)=>sum+area(face.map(n=>p[n])),0);close(lateral,lengths.reduce((a,b)=>a+b,0)*f.apothem/2);assert(Object.values(m.labels).includes('P'));assert(Object.values(m.labels).includes('l'));break;}
   case'frustum':{assert(f.k>0&&f.k<1);assert.notEqual(f.k,.5,'not the numeric half-height task');assert(!m.labelNames.includes('M'));for(const n of f.section)close(dot(p[n],f.plane.n),f.plane.d);close(dist(p.S,p.Z)/dist(p.S,p.O),f.k);close(area(f.section.map(n=>p[n]))/area(['A','B','C','D'].map(n=>p[n])),f.k*f.k);assert(Object.values(m.labels).includes('kH'));assert(!Object.values(m.labels).includes(String(f.k)));break;}
   case'cylinder-area':close(dist(p.O,p.A),f.radius);close(dist(p.A,p.B),f.height);close(dot(sub(p.A,p.O),sub(p.B,p.A)),0);assert(Object.values(m.labels).includes('R'));assert(Object.values(m.labels).includes('h'));break;
   case'cone-area':close(dist(p.O,p.A),f.radius);close(dist(p.S,p.A),f.slant);assert(Object.values(m.labels).includes('l'));assert(!Object.values(m.labels).includes(String(f.slant)));break;
   case'sphere-cut':assert(f.distance<f.radius);close(dist(p.O,p.H),f.distance);close(dist(p.O,p.P),f.radius);close(dot(sub(p.H,p.O),sub(p.P,p.H)),0);for(const n of f.section){close(dist(p[n],p.O),f.radius);close(dot(p[n],f.plane.n),f.plane.d);}close(dist(p.H,p.P)**2,f.radius**2-f.distance**2);break;
   case'pyramid-volume':vec(f.coordinateOrigin,p.S);vec(f.coordinateDirection,[0,0,-1]);close(dot(sub(p.Z,p.S),f.coordinateDirection),f.z);close(dot(sub(p.O,p.S),f.coordinateDirection),f.height);for(const n of f.section)close(dot(p[n],f.plane.n),f.plane.d);close(area(f.section.map(n=>p[n])),f.baseArea*(f.z/f.height)**2);assert(!m.labelNames.includes('Z'));assert(m.labels.B!=='B','avoid confusing base areaB with invented vertexB');assert.equal(m.labels._area,'S осн. = B');break;
   case'sphere-volume':vec(p.O,[0,0,0]);close(p['Z₋'][2],-f.radius);close(p['Z₊'][2],f.radius);close(p.H[2],f.z);for(const n of f.section){close(dist(p[n],p.O),f.radius);close(p[n][2],f.z);}assert(!m.labelNames.includes('H'));assert(!m.edges.some(e=>e.some(n=>n.startsWith('_cut'))),'helper slice visible before help');break;
   case'basis':vec(p.U,[1,0,0]);vec(p.V,[0,1,0]);vec(p.W,[1,1,0]);vec(p.E,[0,0,1]);vec(add(p.U,p.V),p.W);assert(!m.labelNames.includes('E'));assert.equal(s.status,'exact');break;
   case'dot':{assert(norm(f.direction)>0&&norm(f.normal)>0);close(dot(sub(p.U,p.H),sub(p.H,p.O)),0);close(dot(p.H,f.plane.n),0);const beta=angle(sub(p.U,p.O),sub(p.N,p.O)),alpha=angle(sub(p.U,p.O),sub(p.H,p.O));close(alpha+beta,Math.PI/2);close(Math.sin(alpha),Math.abs(dot(f.direction,f.normal))/norm(f.direction)/norm(f.normal));assert(!m.labelNames.includes('H'));break;}
   case'scale':for(const [a,b] of [['A','B'],['A','D'],['A','A₁']])close(dist(p['l'+a],p['l'+b])/dist(p['s'+a],p['s'+b]),f.scale);for(const label of ['a','b','h','ka','kb','kh'])assert(Object.values(m.labels).includes(label));break;
  }
 }catch(error){error.message=key+': '+error.message;throw error;}
}
const unknown=API.buildProof('missing',{title:'Other',given:'Other',goal:'Other',steps:[]});assert.equal(unknown.status,'unsupported');assert.equal(unknown.stepViews.length,0);
assert.throws(()=>API.buildProof('parallel',null),/Supply/);
// API delegates to the shared mounting lifecycle, forwarding camera and step.
const previous=Scenes.mountScene,calls=[],el={};Scenes.mountScene=(...args)=>{calls.push(args);return {destroy(){}};};const options={key:'section',proof:Proofs.section,step:2,savedCamera:{yaw:1,pitch:.2},onChange(){}};const mounted=API.mountProof(el,options);assert.equal(typeof mounted.destroy,'function');assert.equal(calls[0][0],el);assert.equal(calls[0][1].kind,'proof:section');assert.equal(calls[0][2],options);Scenes.mountScene=previous;
console.log(`TASK_PROOF_SCENES_OK: ${exactKeys.length} distinct proof scenes, ${checks} geometric checks; all steps valid, strict given/goal identity, symbolic labels, no proof-text leaks, helper visibility and mounting API.`);
