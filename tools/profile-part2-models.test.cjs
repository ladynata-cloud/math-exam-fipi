'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lessons=require('../ege-profil/part-two/content-models.js');
const answer=(t,i=0)=>t.final[i].answers[0];
const close=(x,y)=>Math.abs(x-y)<1e-8;
function quadraticRoots(A,B,C){const D=B*B-4*A*C;if(D < -1e-9)return [];if(Math.abs(D)<1e-9)return [-B/(2*A)];return [(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)];}
function systemPoints(R,a){return quadraticRoots(2,2*a,a*a-R*R).filter(x=>x>=-1e-8).reduce((n,t)=>n+(Math.abs(t)<1e-8?1:2),0);}

test('18 substantive methods, six unique tasks each, complete proof and help paths',()=>{
 assert.equal(lessons.length,18);
 assert.deepEqual([...new Set(lessons.map(l=>l.exam))],[17,19,20]);
 const ids=new Set();
 for(const l of lessons){assert.equal(l.tasks.length,6);assert.ok(l.theory.length>=3);assert.ok(l.prerequisites.length);
  for(const p of l.prerequisites){const file=p.href.split('#')[0].split('?')[0];assert.ok(fs.existsSync(path.join(__dirname,'..',file)),p.href);}
  for(const t of l.tasks){assert.ok(!ids.has(t.id));ids.add(t.id);assert.ok(t.prompt.length>80);assert.equal(t.steps.length,3);assert.ok(t.final.length>=2);assert.ok(t.solution.length>=3);assert.equal(t.proof.criteria.length,4);for(const s of t.steps){assert.ok(s.answers.length);assert.ok(s.hint);assert.ok(s.explanation);}for(const f of t.final){assert.ok(f.answers.every(x=>typeof x==='string'||Number.isFinite(x)));}}
 }
 assert.equal(ids.size,108);
});

for(const lesson of lessons)test('independent mathematical checks: '+lesson.id,()=>{
 for(const t of lesson.tasks){const m=t.meta;
  switch(m.family){
   case 'fence':{const [x,y,A]=t.final.map(f=>f.answers[0]);assert.equal(2*x+y,m.L);assert.equal(x*y,A);for(let k=1;k<1000;k++){const u=m.L*k/2000;assert.ok(u*(m.L-2*u)<=A+1e-8);}break;}
   case 'revenue':{const [p,q,P]=t.final.map(f=>f.answers[0]);assert.equal(m.B-m.k*p,q);assert.equal((p-m.c)*q,P);assert.ok(p>=m.c&&q>=0);for(let j=0;j<=1000;j++){const trial=m.c+(m.B/m.k-m.c)*j/1000;assert.ok((trial-m.c)*(m.B-m.k*trial)<=P+1e-8);}break;}
   case 'boundary':{const [x,y,A]=t.final.map(f=>f.answers[0]);assert.equal(x+y,m.p);assert.equal(x*y,A);assert.ok(x<=m.cap);for(let j=1;j<=1000;j++){const u=m.cap*j/1000;assert.ok(u*(m.p-u)<=A+1e-8);}break;}
   case 'discrete':{const values=Array.from({length:m.limit+1},(_,n)=>({n,P:-m.a*n*n+m.b*n-m.C}));const max=Math.max(...values.map(v=>v.P));assert.equal(answer(t,1),max);assert.deepEqual(values.filter(v=>v.P===max).map(v=>v.n),[answer(t)]);break;}
   case 'box':{const [x,side,V]=t.final.map(f=>f.answers[0]);assert.equal(side,m.L-2*x);assert.equal(x*side*side,V);assert.ok(x>0&&x<m.L/2);for(let j=1;j<1000;j++){const cut=m.L*j/2000;assert.ok(cut*(m.L-2*cut)**2<=V+1e-8);}break;}
   case 'motion':{const [time,distance]=t.final.map(f=>f.answers[0]);assert.ok(time>=0&&time<=m.T);assert.equal((m.d-3*time)**2+(4*time)**2,distance**2);for(let j=0;j<=1000;j++){const time2=m.T*j/1000;assert.ok((m.d-3*time2)**2+(4*time2)**2>=distance**2-1e-8);}break;}
   case 'linear':{assert.equal(answer(t),-m.r);assert.equal(answer(t,1),m.r);for(let j=-4*m.r;j<=4*m.r;j++){const a=j/2,A=a-m.r,B=a*a-m.r*m.r;const count=A===0?(B===0?Infinity:0):(B/A>0?1:0);assert.equal(count===1,a>answer(t)&&a!==answer(t,1));}break;}
   case 'positive-roots':{const boundary=answer(t);assert.equal(boundary,m.m);for(let j=-40;j<=80;j++){const a=j/4,roots=quadraticRoots(1,-2*a,a+m.b);const good=roots.length===2&&roots.every(x=>x>0);assert.equal(good,a>boundary,'a='+a);}assert.equal(quadraticRoots(1,-2*boundary,boundary+m.b).length,1);break;}
   case 'modules':{const threshold=2*m.h;assert.ok(t.final[0].answers.includes('a>'+threshold));for(const a of [threshold-1,threshold,threshold+1,threshold+7]){if(a>threshold){const roots=[-a/2,a/2];assert.ok(roots.every(x=>close(Math.abs(x-m.h)+Math.abs(x+m.h),a)));assert.ok(roots[0]<-m.h&&roots[1]>m.h);}else if(a===threshold){for(let j=-10;j<=10;j++)assert.equal(Math.abs(j*m.h/10-m.h)+Math.abs(j*m.h/10+m.h),a);}else{for(let x=-20;x<=20;x+=.25)assert.ok(Math.abs(x-m.h)+Math.abs(x+m.h)>a);}}break;}
   case 'hole':{assert.equal(answer(t),m.h);assert.equal(answer(t,1),2*m.h);for(let a=-2*m.h;a<=4*m.h;a+=.5){const x=a-m.h;const admissible=x>0&&x!==m.h;assert.equal(admissible,a>answer(t)&&a!==answer(t,1));if(admissible)assert.ok(close((x*x-m.h*m.h)/(x-m.h),a));}break;}
   case 'tangent':{for(const a of [answer(t),answer(t,1)]){const roots=quadraticRoots(2,-2*a,a*a-m.R2);assert.equal(roots.length,1);const x=roots[0],y=a-x;assert.ok(close(x*x+y*y,m.R2));for(const offset of [-.01,.01])assert.notEqual(quadraticRoots(2,-2*(a+offset),(a+offset)**2-m.R2).length,1);}break;}
   case 'system':{assert.equal(systemPoints(m.R,answer(t)),3);assert.equal(answer(t),-m.R);assert.equal(answer(t,1),4);assert.equal(systemPoints(m.R,-6*m.R/5),4);assert.equal(systemPoints(m.R,m.R),1);for(let j=-250;j<=250;j++){const a=j*m.R/100;const count=systemPoints(m.R,a);assert.ok(count<=4);if(count===3)assert.ok(close(a,-m.R));}break;}
   case 'remainders':{const accepted=[];for(let n=1;n<=m.B;n++)if(n%m.m===m.r&&n%(m.m+1)===m.s)accepted.push(n);assert.equal(answer(t),accepted[0]);assert.equal(answer(t,1),accepted.length);break;}
   case 'digits':{const candidates=[],sumOnly=[];for(let n=10;n<=99;n++){const a=Math.floor(n/10),b=n%10;if(a+b===m.s){sumOnly.push(n);if(n-(10*b+a)===9*m.d)candidates.push(n);}}assert.deepEqual(candidates,[answer(t)]);assert.equal(sumOnly.length,answer(t,1));break;}
   case 'extremum':{const pairs=[];for(let x=1;x<=m.S/2;x++)pairs.push([x,m.S-x]);const maximum=Math.max(...pairs.map(([x,y])=>x*y));assert.equal(answer(t),maximum);assert.deepEqual(pairs.filter(([x,y])=>x*y===maximum),[[answer(t,1),answer(t,2)]]);break;}
   case 'counterexample':{let first=1;while((first*first+first+m.q)%m.q)first++;assert.equal(answer(t),first);const value=first*first+first+m.q;assert.equal(answer(t,1),value);assert.ok(m.q>1&&m.q<value);assert.equal(value%m.q,0);break;}
   case 'invariant':{for(let trial=0;trial<8;trial++){const board=Array.from({length:m.n},(_,j)=>j+1);while(board.length>1){const a=board.splice((trial*3+board.length)%board.length,1)[0],b=board.splice((trial+board.length)%board.length,1)[0];board.push(a+b-m.c);}assert.equal(board[0],answer(t));}assert.equal(answer(t,1),1);break;}
   case 'diophantine':{const pairs=[];for(let v=1;v<m.N;v++){const u=Math.sqrt(v*v+m.N);if(Number.isInteger(u))pairs.push([u,v]);}assert.equal(pairs.length,answer(t));const largest=pairs.reduce((best,p)=>p[1]>best[1]?p:best,[0,0]);assert.deepEqual(largest,[answer(t,2),answer(t,1)]);break;}
   default:assert.fail(m.family);
  }
 }
});

test('every authored answer and equivalent numeric fraction is accepted by actual shared checker',()=>{
 const check=require('../ege-profil/start/checks.js');
 const engine=require('../ege-profil/part-two/state.js');
 for(const lesson of lessons)for(const task of lesson.tasks)for(const f of [...task.steps,...task.final]){
  for(const value of f.answers)assert.equal(engine.matches(f.answers,String(value),check),true,task.id+': '+value);
  const first=f.answers[0];
  if(typeof first==='number'){
   assert.equal(engine.matches(f.answers,`${first*2}/2`,check),true,task.id);
   assert.equal(engine.matches(f.answers,String(first+1),check),false,task.id);
  }
  assert.equal(engine.matches(f.answers,'',check),false,task.id);
 }
});

test('SVG geometry: equal graph scales and genuine square corner cuts for every condition',()=>{
 const points=svg=>[...svg.matchAll(/(?:M|L)([-\d.]+) ([-\d.]+)/g)].map(m=>[+m[1],+m[2]]);
 const pathOf=(svg,cls)=>svg.match(new RegExp('<path class="'+cls+'" d="([^"]+)"'))[1];
 for(const l of lessons)for(const t of l.tasks){const {family}=t.meta;
  if(family==='hole'){
   const h=t.meta.h,[[x1,y1],[x2,y2]]=points(pathOf(t.diagram,'model-curve'));
   const circle=t.diagram.match(/class="excluded-point" cx="([\d.]+)" cy="([\d.]+)"/),cx=+circle[1],cy=+circle[2];
   const sx=(cx-80)/h,sy=(175-cy)/(2*h);
   assert.ok(close(sx,sy),'equal graph units');
   for(const [px,py] of [[x1,y1],[x2,y2],[cx,cy]])assert.ok(close((175-py)/sy,(px-80)/sx+h),'point lies on y=x+h');
   const atAxis=y1+(y2-y1)*(80-x1)/(x2-x1);assert.ok(close((175-atAxis)/sy,h),'correct y intercept');
  }
  if(family==='modules'){
   const h=t.meta.h,pts=points(pathOf(t.diagram,'model-curve'));
   assert.equal(pts.length,4);
   const sx=(pts[2][0]-pts[1][0])/(2*h),sy=(180-pts[1][1])/(2*h);
   assert.ok(close(sx,sy),'equal module graph units');
   for(const [px,py] of pts){const x=(px-180)/sx,y=(180-py)/sy;assert.ok(close(y,Math.abs(x-h)+Math.abs(x+h)),'all vertices match actual function');}
   assert.ok(close(pts[1][1],pts[2][1]));
  }
  if(family==='box'){
   const pts=points(pathOf(t.diagram,'box-net')),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
   const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
   assert.ok(close(right-left,bottom-top),'original sheet square');
   const cut=pts[0][0]-left;
   assert.ok(close(pts[1][0],right-cut));assert.ok(close(pts[2][1],top+cut));
   assert.ok(close(pts[4][1],bottom-cut));assert.ok(close(pts[6][0],right-cut));
   assert.ok(close(pts[7][0],left+cut));assert.ok(close(pts[8][1],bottom-cut));
   assert.ok(close(pts[10][1],top+cut));assert.ok(cut>0&&cut<(right-left)/2);
  }
 }
});
