'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.existsSync(path.join(__dirname,'task19-models-triangles.js'))?path.join(__dirname,'task19-models-triangles.js'):path.join(__dirname,'../trainers/task19-models-triangles.js');
const RAD=Math.PI/180,clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),distance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
const angle=(a,b,c)=>{const u=[a[0]-b[0],a[1]-b[1]],v=[c[0]-b[0],c[1]-b[1]];return Math.acos(clamp((u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)),-1,1))/RAD;};
const defs=require(source)({RAD,clamp,finite:(x,f)=>Number.isFinite(Number(x))?Number(x):f,hypot:distance,mid:(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2],angleAt:angle});
const sample=(name,params={})=>{const d=defs[name],p=d.normalize?d.normalize({...d.values,...params}):{...d.values,...params};return{...d.sample(p),values:p};};
const close=(a,b,message)=>assert(Math.abs(a-b)<1e-8,message||`${a} != ${b}`);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
function finiteGeometry(s){const check=x=>{if(typeof x==='number')assert(Number.isFinite(x));else if(x&&typeof x==='object')Object.values(x).forEach(check);};check(s.points);check(s.metrics);}

test('all family controls at their endpoints return finite geometry',()=>{
  assert.equal(Object.keys(defs).length,8);
  for(const [name,d]of Object.entries(defs)){
    const initial=sample(name);finiteGeometry(initial);
    for(const [key,,min,max]of(d.controlsFor?.(initial.values)||d.controls))for(const value of[min,max])finiteGeometry(sample(name,{[key]:value}));
  }
});

test('right, acute, obtuse, isosceles and equilateral hypotheses survive extreme input',()=>{
  for(const mode of['right','acute','obtuse','iso','equilateral'])for(const a of[-100,20,55,90,200])for(const b of[-100,35,80,200]){
    const s=sample('triangleExplore',{mode,a,b}),P=s.points,angles=[angle(P.B,P.A,P.C),angle(P.A,P.B,P.C),angle(P.A,P.C,P.B)];
    close(angles.reduce((x,y)=>x+y,0),180);finiteGeometry(s);
    if(mode==='right')close(angles[0],90);
    if(mode==='acute')assert(angles.every(x=>x<90&&x>0));
    if(mode==='obtuse')assert(angles[0]>90&&angles.slice(1).every(x=>x<90));
    if(mode==='iso')close(distance(P.A,P.C),distance(P.B,P.C));
    if(mode==='equilateral'){close(distance(P.A,P.C),distance(P.B,P.C));close(distance(P.A,P.C),distance(P.A,P.B));}
  }
});

test('midpoint converse uses a moving C and three actual equal radii',()=>{
  for(const radius of[2,3,6])for(const point of[15,25,65,90,130,165]){
    const {points:P,metrics:M}=sample('triangleMedianCircle',{radius,point});
    close(P.M[0],(P.A[0]+P.B[0])/2);close(P.M[1],(P.A[1]+P.B[1])/2);
    for(const name of['A','B','C'])close(distance(P.M,P[name]),distance(P.A,P.B)/2);
    close(angle(P.A,P.C,P.B),90);close(M.angle,angle(P.A,P.C,P.B));
  }
});

test('triangle centers are calculated from vertices and perpendicular distances',()=>{
  for(const a of[30,55,90,120])for(const b of[25,40]){
    const s=sample('triangleCenters',{a,b}),P=s.points;
    close(distance(P.O,P.A),distance(P.O,P.B));close(distance(P.O,P.A),distance(P.O,P.C));
    close(distance(P.I,P.X),distance(P.I,P.Y));close(distance(P.I,P.X),distance(P.I,P.Z));
    for(const [h,u,v]of[['X','A','B'],['Y','B','C'],['Z','C','A']])close(dot(sub(P.I,P[h]),sub(P[v],P[u])),0);
    finiteGeometry(s);
  }
  const e=sample('triangleCenters',{mode:'equilateral'});close(distance(e.points.O,e.points.I),0);
});

test('bisectors and heights maintain their defining properties at every selected vertex',()=>{
  for(const mode of['free','iso','acute','obtuse','equilateral'])for(const from of[0,1,2]){
    const s=sample('triangleConstructions',{mode,from,a:55,b:65}),P=s.points,[v,u,w]=[['C','A','B'],['A','B','C'],['B','A','C']][from];
    close(angle(P[u],P[v],P.D),angle(P.D,P[v],P[w]));
    close(distance(P[u],P.M),distance(P.M,P[w]));close(dot(sub(P[v],P.H),sub(P[w],P[u])),0);
    close(distance(P.E,P.F),distance(P.A,P.B)/2);
    for(const [n,l,r]of[['A','B','C'],['B','A','C'],['C','A','B']])close(dot(sub(P[n],P['H'+n]),sub(P[r],P[l])),0);
  }
  const s=sample('triangleConstructions',{mode:'iso',a:40,from:1});assert(s.metrics.DM>.1);assert(Math.abs(s.metrics.bisectorBaseAngle-90)>1);
});

test('SSA counterexample preserves both named sides and the non-included angle',()=>{
  for(const angleValue of[20,30,35])for(const rotation of[0,45,180,360]){
    const s=sample('triangleCongruence',{kind:'ssa',angle:angleValue,rotation}),P=s.points.first,Q=s.points.second;
    close(distance(P[0],P[1]),8);close(distance(Q[0],Q[1]),8);close(distance(P[1],P[2]),5);close(distance(Q[1],Q[2]),5);
    close(angle(P[1],P[0],P[2]),angleValue);close(angle(Q[1],Q[0],Q[2]),angleValue);
    assert(Math.abs(distance(P[0],P[2])-distance(Q[0],Q[2]))>1);
  }
  const sas=sample('triangleCongruence',{kind:'sas',rotation:135});sas.metrics.sides1.forEach((s,i)=>close(s,sas.metrics.sides2[i]));
});

test('fixed numerical rods retain their lengths even when moving endpoints coincide',()=>{
  for(const [a,b,c]of[[2,3,5],[1,2,4],[2,4,6],[2,3,2]])for(const turn of[0,.1,30,90,180]){
    const s=sample('triangleLinkage',{a,b,c,turn}),P=s.points;close(distance(P.A,P.C),a);close(distance(P.B,P.D),b);close(distance(P.A,P.B),c);finiteGeometry(s);
  }
  const flat=sample('triangleLinkage',{a:2,b:3,c:5,turn:0});close(flat.metrics.gap,0);close(flat.metrics.height,0);
  for(const turn of[0,20,60,120,180])assert(sample('triangleLinkage',{a:1,b:2,c:4,turn}).metrics.gap>=1-1e-8);
  for(const rotation of[0,35,90,180]){const s=sample('triangleExplore',{mode:'fixed345',rotation});close(s.metrics.AB,4);close(s.metrics.AC,3);close(s.metrics.BC,5);}
});

test('equal-area and similarity experiments preserve exactly their advertised conditions',()=>{
  for(const x of[-2,1,4,8]){const s=sample('triangleAreaPair',{x});close(s.metrics.area1,s.metrics.area2);}
  for(const rotation of[0,45,270]){const s=sample('triangleAreaPair',{congruent:true,rotation});s.metrics.sides1.forEach((v,i)=>close(v,s.metrics.sides2[i]));close(s.metrics.area1,s.metrics.area2);}
  for(const a of[20,55,80])for(const b of[20,65,80]){
    const s=sample('triangleSimilarity',{a,b,scale:3,fixedScale:true});s.metrics.sides1.forEach((v,i)=>close(s.metrics.sides2[i]/v,2));close(s.metrics.area2/s.metrics.area1,4);
  }
  const s=sample('triangleSimilarity',{mode:'isoPair',a:50,otherAngle:35});close(s.metrics.sides1[1],s.metrics.sides1[2]);close(s.metrics.sides2[1],s.metrics.sides2[2]);assert(Math.abs(s.metrics.angles1[0]-s.metrics.angles2[0])>1);
});
