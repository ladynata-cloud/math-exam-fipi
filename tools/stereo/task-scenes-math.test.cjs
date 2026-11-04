'use strict';
// Independent geometric invariants for scenes made from the unchanged task bank.
// No DOM, renderer snapshots, bank formula replacements, or external resources.
const assert = require('node:assert/strict');
const Bank = require('../../stereo-course/assets/tasks.js');
const Scenes = require('../../stereo-course/assets/task-scenes.js');
const expected = ['incidence','parallel','skew','plane-parallel','euler','section','perpendicular','projection','dihedral','box-diagonal','solid-angle','prism','pyramid','frustum','regular','cylinder-area','cone-area','cone-frustum','sphere-cut','insphere','conic','box-volume','cylinder-volume','cavalieri','pyramid-volume','sphere-volume','vectors','vector-sum','basis','distance','sphere-equation','dot','plane-distance','scale','circle-bridge','triangle-bridge','ceva','conics-plane'];
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,n)=>a.map(x=>x*n);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(...a),dist=(a,b)=>norm(sub(a,b));
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b)/norm(a)/norm(b))))*180/Math.PI;
const read=s=>Number(String(s).replace(/−/g,'-'));
const numbers=s=>(s.match(/[−-]?\d+(?:\.\d+)?/g)||[]).map(read);
const match=(s,re)=>{const m=s.match(re);assert(m,'condition parser '+s);return m.slice(1).map(read);};
const ratio=s=>s.split('/').map(read).reduce((a,b)=>a/b);
let checked=0;
function close(actual,expected,message=''){assert(Number.isFinite(actual)&&Number.isFinite(expected),message+' finite');assert(Math.abs(actual-expected)<=1e-7*(1+Math.abs(expected)),message+`: ${actual} != ${expected}`);checked++;}
function vec(actual,expected,message){assert.equal(actual.length,expected.length);actual.forEach((x,i)=>close(x,expected[i],message));}
function polygonArea(points){let c=[0,0,0];for(let i=0;i<points.length;i++)c=add(c,cross(points[i],points[(i+1)%points.length]));return norm(c)/2;}
function normal(points){for(let i=1;i<points.length-1;i++){const n=cross(sub(points[i],points[0]),sub(points[i+1],points[0]));if(norm(n)>1e-8)return n;}return null;}
function volume(points,faces){const body=[...new Set(faces.flat())],center=mul(body.map(n=>points[n]).reduce(add,[0,0,0]),1/body.length);let result=0;for(const face of faces)for(let i=1;i<face.length-1;i++){const a=sub(points[face[0]],center),b=sub(points[face[i]],center),c=sub(points[face[i+1]],center);result+=Math.abs(dot(a,cross(b,c)))/6;}return result;}
function along(p,a,b){const d=sub(b,a);return dot(sub(p,a),d)/dot(d,d);}
function onLine(p,a,b,message){close(norm(cross(sub(p,a),sub(b,a))),0,message);}
function side(p,a,b){return dist(p,a)/dist(p,b);}
function generic(scene,task){
 const m=scene.model,p=m.points;
 assert.notEqual(scene.status,'unsupported');assert(['exact','representative'].includes(scene.status));
 assert.equal(scene.title,task.q);assert(scene.find.length);assert(scene.given.length);
 assert.equal(scene.stepViews.length,task.steps.length);
 for(const [name,point] of Object.entries(p)){assert.equal(point.length,3,name);assert(point.every(Number.isFinite),name+' nonfinite');}
 assert(Object.keys(p).length>0);
 for(const edge of m.edges){assert.equal(edge.length,2);edge.forEach(n=>assert(p[n],n+' missing edge endpoint'));}
 for(const face of m.faces){assert(face.length>=3);face.forEach(n=>assert(p[n],n+' missing face vertex'));const ps=face.map(n=>p[n]),n=normal(ps);if(n)for(const point of ps)close(dot(sub(point,ps[0]),n)/norm(n),0,'coplanar face');}
 for(const [key,view] of Object.entries(m.views)){
  assert(view.label);for(const line of view.segments){assert.equal(line.length,2);line.forEach(n=>assert(p[n],key+' missing segment point'));}
  for(const name of view.points)assert(p[name],key+' missing point');
  for(const name of view.polygon)assert(p[name],key+' missing polygon vertex');
  if(view.polygon.length){const ps=view.polygon.map(n=>p[n]),n=normal(ps);assert(n,key+' degenerate highlighted polygon');for(const point of ps)close(dot(sub(point,ps[0]),n)/norm(n),0,key+' nonplanar highlight');}
 }
 for(const name of m.labelNames){assert(p[name]);assert.equal(typeof m.labels[name],'string');assert(!/NaN|Infinity|undefined/.test(m.labels[name]));}
 for(const key of scene.stepViews)assert(m.views[key]);
 // Initial scene labels must not come from answer/solution fields. Replacing
 // every such field leaves the complete scene (including step highlights) intact.
 const changed=structuredClone(task);changed.a='PRIVATE_FINAL_SENTINEL';changed.steps=changed.steps.map(s=>({...s,a:'PRIVATE_STEP_SENTINEL',q:'PRIVATE_STEP_QUESTION',why:'PRIVATE_STEP_EXPLANATION'}));
 assert.deepEqual(Scenes.build(scene.kind,changed),scene,'scene reads an answer/solution field');
}
function specific(kind,seed,t,s){
 const q=t.q,m=s.model,p=m.points,f=s.facts;let a,b,h,r,c,values;
 switch(kind){
 case'incidence':assert(norm(cross(sub(p.B,p.A),sub(p.C,p.A)))>0);break;
 case'parallel':case'skew':for(const e of m.edges)close(dist(p[e[0]],p[e[1]]),2,'cube edge');close(dot(sub(p.B,p.A),sub(p['C₁'],p.C)),0);break;
 case'plane-parallel':close(p.A[2],p.B[2]);close(p.C[2],p.D[2]);assert.notEqual(p.A[2],p.C[2]);close(norm(cross(sub(p.B,p.A),sub(p.D,p.C))),0);break;
 case'euler':{[a,b]=match(q,/имеет (\d+) вершин и (\d+) рёбер/);const vertices=new Set(m.faces.flat());assert.equal(vertices.size,a);assert.equal(m.edges.length,b);assert.equal(m.faces.length,t.a);assert.equal(vertices.size-m.edges.length+m.faces.length,2);assert(volume(p,m.faces)>0);break;}
 case'section':{[a]=match(q,/стороной (\d+)/);vec(p.M,mul(add(p.A,p.B),.5));vec(p.N,mul(add(p.A,p.D),.5));vec(p.P,mul(add(p.A,p['A₁']),.5));close(dist(p.A,p.B),a);for(const name of f.section)close(dot(p[name],f.plane.n),f.plane.d);for(const [x,y] of [['M','N'],['N','P'],['P','M']])close(dist(p[x],p[y])**2,t.a,'section side square');assert.equal(f.section.length,3);const intersections=[];for(const [u,v] of m.edges){const du=dot(p[u],f.plane.n)-f.plane.d,dv=dot(p[v],f.plane.n)-f.plane.d;if(du*dv<0){const hit=add(p[u],mul(sub(p[v],p[u]),du/(du-dv)));if(!intersections.some(x=>dist(x,hit)<1e-7))intersections.push(hit);}}assert.equal(intersections.length,3);for(const hit of intersections)assert(f.section.some(n=>dist(p[n],hit)<1e-7));break;}
 case'perpendicular':close(dot(sub(p.P,p.O),sub(p.A,p.O)),0);close(dot(sub(p.P,p.O),sub(p.B,p.O)),0);assert(norm(cross(sub(p.A,p.O),sub(p.B,p.O)))>0);break;
 case'projection':[a,b]=match(q,/длину (\d+), её проекция (\d+)/);close(dist(p.A,p.B),a);close(dist(p.O,p.B),b);close(dot(sub(p.A,p.O),sub(p.B,p.O)),0);close(dist(p.A,p.O),t.a);break;
 case'dihedral':case'pyramid':{[h,a]=kind==='dihedral'?match(q,/высота (\d+), сторона основания (\d+)/):match(q,/основания.*? (\d+), высота (\d+)/).reverse();close(dist(p.A,p.B),a);close(dist(p.B,p.C),a);close(dist(p.S,p.O),h);vec(p.M,mul(add(p.A,p.B),.5));if(kind==='dihedral')close(angle(sub(p.S,p.M),sub(p.O,p.M)),t.a);else{const areas=m.faces.filter(x=>x.includes('S')).map(face=>polygonArea(face.map(n=>p[n])));close(areas.reduce((a,b)=>a+b,0),t.a);}break;}
 case'box-diagonal':case'box-volume':[a,b,h]=kind==='box-diagonal'?match(q,/равны (\d+), (\d+), (\d+)/):match(q,/параллелепипеда (\d+), (\d+), (\d+)/);close(dist(p.A,p.B),a);close(dist(p.B,p.C),b);close(dist(p.C,p['C₁']),h);close(kind==='box-volume'?volume(p,m.faces):dist(p.A,p['C₁']),t.a);break;
 case'solid-angle':{values=numbers(q);if(q.startsWith('Все')){[a]=values;for(let i=0;i<3;i++)close(angle(sub(p['V'+i],p.O),sub(p['V'+((i+1)%3)],p.O)),a);close(t.a,Math.ceil(360/a)-1);break;}[a,b]=values;close(angle(sub(p.B,p.O),sub(p.C,p.O)),a);close(angle(sub(p.A,p.O),sub(p.C,p.O)),b);const gamma=angle(sub(p.A,p.O),sub(p.B,p.O)),det=dot(sub(p.A,p.O),cross(sub(p.B,p.O),sub(p.C,p.O)));if(q.startsWith('Два')){const lo=Math.abs(a-b),hi=Math.min(a+b,360-a-b);assert(gamma>lo&&gamma<hi);vec(t.a,[lo,hi]);}else{close(gamma,values[2]);if(q.startsWith('Могут'))assert.equal(Math.abs(det)>1e-5,t.a==='да');else close(a+b+gamma,t.a);}break;}
 case'prism':{[a,h]=match(q,/основания (\d+) и высоту (\d+)/);const base=m.faces.find(face=>face.every(n=>Math.abs(p[n][2])<1e-8));assert(base);let perimeter=0;for(let i=0;i<base.length;i++)perimeter+=dist(p[base[i]],p[base[(i+1)%base.length]]);close(perimeter,a);close(dist(p.O,p.H),h);const lateral=m.faces.filter(face=>!face.every(n=>Math.abs(p[n][2]-p[face[0]][2])<1e-8));close(lateral.reduce((total,face)=>total+polygonArea(face.map(n=>p[n])),0),t.a);break;}
 case'frustum':{const baseArea=polygonArea(['A','B','C','D'].map(n=>p[n])),cutArea=polygonArea(f.section.map(n=>p[n]));for(const n of f.section)close(dot(p[n],f.plane.n),f.plane.d);close((p.S[2]-f.plane.d)/(p.S[2]-p.O[2]),.5);close(cutArea/baseArea,.25);close(cutArea*(p.S[2]-f.plane.d)/(baseArea*(p.S[2]-p.O[2])),t.a);break;}
 case'regular':assert.equal(m.faces.length,8);assert.equal(m.edges.length,t.a);for(const e of m.edges)close(dist(p[e[0]],p[e[1]]),dist(p[m.edges[0][0]],p[m.edges[0][1]]));break;
 case'cylinder-area':case'cylinder-volume':case'cone-area':case'cone-frustum':case'insphere':{
  if(kind==='cone-frustum'){[r,b,h]=match(q,/конуса (\d+) и (\d+), высота (\d+)/);close(dist(p.H,p.B),b);close(dist(p.A,p.B),t.a);}else{[r,h]=kind==='cylinder-volume'?match(q,/цилиндра (\d+), высота (\d+)/):match(q,/(?:цилиндра|конуса) (\d+), высота (\d+)/);if(kind==='cylinder-volume'){close(dist(p.A,p.D),r);r/=2;close(Math.PI*r*r*h,t.a);}if(kind==='cylinder-area')close(2*Math.PI*r*(r+h),t.a);if(kind==='cone-area')close(Math.PI*r*Math.hypot(r,h),t.a);if(kind==='insphere'){const [l]=match(q,/образующая (\d+)/);close(dist(p.A,p.H),l);const rho=dist(p.I,p.O);close(rho,t.a);close(r*(h-p.I[2])/l,rho,'insphere tangent to lateral face');for(const [name,point] of Object.entries(p))if(name.startsWith('_in'))close(dist(point,p.I),rho);}}
  close(dist(p.O,p.A),r);close(dist(p.O,p.H),h);close(dot(sub(p.A,p.O),sub(p.H,p.O)),0);break;
 }
 case'sphere-cut':{[r,h]=match(q,/шара (\d+), расстояние.*? (\d+)\./);close(dist(p.O,p.A),r);close(dist(p.O,p.H),h);for(const name of f.section){close(dist(p.O,p[name]),r);close(dot(p[name],f.plane.n),f.plane.d);}close(Math.PI*dist(p.H,p.A)**2,t.a);break;}
 case'sphere-volume':[r]=match(q,/шара (\d+)/);for(const [name,point] of Object.entries(p))if(name.startsWith('_sphere'))close(dist(point,p.O),r);close(dist(p.O,p.A),r);close(4*Math.PI*r**3/3,t.a);break;
 case'cavalieri':[a,h,b]=match(q,/призмы (\d+), перпендикулярная высота (\d+), боковое ребро (\d+)/);close(polygonArea(['A','B','C','D'].map(n=>p[n])),a);close(dist(p.A,p['A₁']),b);close(dist(p['A₁'],p.H),h);close(p.H[2],0);close(volume(p,m.faces),t.a);break;
 case'pyramid-volume':[a,h]=match(q,/пирамиды (\d+), высота (\d+)/);close(polygonArea(['A','B','C','D'].map(n=>p[n])),a);close(dist(p.S,p.O),h);close(volume(p,m.faces),t.a);break;
 case'vectors':case'distance':[a,b,h]=match(q,/B\((\d+);(\d+);(\d+)\)/);vec(p.A,[0,0,0]);vec(p.B,[a,b,h]);if(kind==='vectors'){vec(sub(p.A,p.B),t.a);assert.deepEqual(m.views.neutral.segments,[['B','A']]);}else close(dist(p.A,p.B),t.a);break;
 case'vector-sum':case'dot':{const u=q.match(/u=\(([^)]+)\)/)[1].split(';').map(read),v=q.match(/v=\(([^)]+)\)/)[1].split(';').map(read);vec(p.U,u);vec(p.V,v);if(kind==='vector-sum'){vec(p.W,add(u,v));vec(sub(p.W,p.U),v);vec(t.a,p.W);}else close(angle(u,v),t.a);break;}
 case'basis':for(const n of ['U','V','W'])close(p[n][2],0);vec(p.W,add(p.U,p.V));break;
 case'sphere-equation':{[a,b,h,r]=match(q,/\(x−(\d+)\)²\+\(y\+(\d+)\)²\+\(z−(\d+)\)²=(\d+)/);vec(p.O,[0,0,0]);vec(p.C,[a,-b,h]);vec(t.a,p.C);for(const [name,point] of Object.entries(p))if(name.startsWith('_sphere'))close((point[0]-a)**2+(point[1]+b)**2+(point[2]-h)**2,r);assert.equal(m.labels.C,'C = ?');break;}
 case'plane-distance':[h]=match(q,/\(0;0;(\d+)\)/);vec(p.A,[0,0,h]);vec(p.O,[0,0,0]);close(dist(p.A,p.O),t.a);break;
 case'scale':{[a]=match(q,/в (\d+) раза/);for(const edge of [['A','B'],['B','C'],['C','C₁']])close(dist(p['l'+edge[0]],p['l'+edge[1]])/dist(p['s'+edge[0]],p['s'+edge[1]]),a);const sf=m.faces.filter(face=>face[0].startsWith('s')),lf=m.faces.filter(face=>face[0].startsWith('l'));close(volume(p,lf)/volume(p,sf),t.a);break;}
 case'circle-bridge':{[a,b,h]=match(q,/PA=(\d+), PB=(\d+), PC=(\d+)/);close(dist(p.P,p.A),a);close(dist(p.P,p.B),b);close(dist(p.P,p.C),h);close(dist(p.P,p.D),t.a);onLine(p.P,p.A,p.B);onLine(p.P,p.C,p.D);assert(along(p.P,p.A,p.B)>0&&along(p.P,p.A,p.B)<1);assert(along(p.P,p.C,p.D)>0&&along(p.P,p.C,p.D)<1);for(const n of ['A','B','C','D'])close(dist(p[n],f.circle.center),f.circle.radius);assert(!Object.values(m.labels).includes('PD = '+t.a));break;}
 case'triangle-bridge':[a,b,h]=match(q,/стороны (\d+) и (\d+), третья (\d+)/);close(dist(p.A,p.C),a);close(dist(p.B,p.C),b);close(dist(p.A,p.B),h);vec(p.M,mul(add(p.A,p.B),.5));close(dist(p.C,p.M),t.a);break;
 case'ceva':{const r1=ratio(q.match(/BD\/DC=([\d/]+)/)[1]),r2=ratio(q.match(/CE\/EA=([\d/]+)/)[1]),r3=q.match(/AF\/FB=([\d/]+)/);onLine(p.D,p.B,p.C);onLine(p.E,p.C,p.A);onLine(p.F,p.A,p.B);close(side(p.D,p.B,p.C),r1);close(side(p.E,p.C,p.A),r2);assert(along(p.D,p.B,p.C)>0&&along(p.D,p.B,p.C)<1);assert(along(p.E,p.C,p.A)>0&&along(p.E,p.C,p.A)<1);if(r3)close(side(p.F,p.A,p.B),ratio(r3[1]));if(q.includes('продолжении')){assert(along(p.F,p.A,p.B)>1);onLine(p.D,p.E,p.F,'Menelaus collinearity');const givenLength=q.match(/AB=(\d+)/);if(givenLength){close(dist(p.A,p.B),read(givenLength[1]));close(dist(p.B,p.F),t.a);}else close(side(p.F,p.A,p.B),t.a);}else{assert(along(p.F,p.A,p.B)>0&&along(p.F,p.A,p.B)<1);const product=r1*r2*side(p.F,p.A,p.B);if(r3)assert.equal(Math.abs(product-1)<1e-7,t.a==='да');else{close(product,1);close(side(p.F,p.A,p.B),t.a);}}break;}
 case'conics-plane':{[a,b]=match(q,/равна (\d+)\. Одно расстояние равно (\d+(?:\.\d+)?)/);close(dist(p.P,p['F₁']),b);close(dist(p.P,p['F₂']),t.a);close(dist(p.P,p['F₁'])+dist(p.P,p['F₂']),a);for(const [name,point] of Object.entries(p))if(name.startsWith('_ellipse'))close(dist(point,p['F₁'])+dist(point,p['F₂']),a);break;}
 case'conic':{
  if(q.includes('цилиндрическая')){[r]=match(q,/радиуса (\d+)/);for(const n of f.section){const v=p[n];close(v[0]**2+v[1]**2,r*r);close(dot(f.plane.n,v),f.plane.d);}const center=[0,0,0],radii=f.section.map(n=>dist(p[n],center));close(Math.max(...radii),t.a);close(Math.min(...radii),r);close(Math.asin(Math.abs(f.plane.n[2])/norm(f.plane.n))*180/Math.PI,30);break;}
  const k=Math.tan(f.coneAngle*Math.PI/180);
  if(f.axial){for(const [u,v] of m.views.neutral.segments){onLine([0,0,0],p[u],p[v]);assert(p[u][2]*p[v][2]<0);for(const n of [u,v]){close(p[n][0]**2+p[n][1]**2,k*k*p[n][2]**2);close(dot(f.plane.n,p[n]),0);}}assert.equal(m.views.neutral.segments.length,t.a);break;}
  assert(f.section.length>20,'empty/missing conic curve');
  for(const n of f.section){const v=p[n];close(v[0]**2+v[1]**2,k*k*v[2]**2);close(dot(f.plane.n,v),f.plane.d);}
  close(Math.asin(Math.abs(f.plane.n[2])/norm(f.plane.n))*180/Math.PI,f.planeAngle);
  for(const [u,v] of f.sectionSegments){const i=Number(u.replace('_curve','')),j=Number(v.replace('_curve',''));assert.equal(j,i+1,'curve reconnects across clipped region/pole');assert(p[u][2]*p[v][2]>0,'false bridge across cone nappes');}
  if(q.includes('перпендикулярна')){[h]=match(q,/расстоянии (\d+)/);for(const n of f.section)close(p[n][2],h);assert.equal(t.a,'окружность');}
  else if(f.planeAngle>f.coneAngle){assert.equal(t.a,'эллипс');assert(f.section.every(n=>p[n][2]>0));}
  else if(Math.abs(f.planeAngle-f.coneAngle)<1e-7){assert.equal(t.a,'парабола');assert(f.section.every(n=>p[n][2]>0));}
  else{assert.equal(t.a,'гипербола');assert(f.section.some(n=>p[n][2]>0),'missing positive branch');assert(f.section.some(n=>p[n][2]<0),'missing negative branch');}
  break;
 }
 default:assert.fail('No independent checks for '+kind);
 }
}
assert.deepEqual(Scenes.families,expected,'task-family inventory changed');
let scenes=0;
for(const kind of expected)for(let seed=0;seed<120;seed++){
 const t=Bank.make(kind,seed),before=structuredClone(t);let scene;
 try{scene=Scenes.build(kind,t);generic(scene,t);specific(kind,seed,t,scene);assert.deepEqual(t,before,'bank task mutated');}
 catch(error){error.message=`${kind}, seed ${seed}: ${error.message}`;throw error;}
 scenes++;
}
const unsupported=Scenes.build('not-a-task-family',{q:'Unknown condition.',steps:[]});assert.equal(unsupported.status,'unsupported');assert.equal(unsupported.stepViews.length,0);
assert.throws(()=>Scenes.build('section',{q:'Unsupported rewritten question.',steps:[]}),/does not match/,'unknown condition must not silently use default dimensions');
console.log(`TASK_SCENES_MATH_OK: ${scenes} task-bound scenes, ${expected.length} families, ${checked} independent geometric checks; all conic/trihedral/Ceva variants, actual givens, sections, volumes, answer privacy, immutable bank; unknown family explicitly unsupported.`);
