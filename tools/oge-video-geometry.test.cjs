'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lessons = require('../trainers/oge-video-geometry.js');
const byId = id => lessons.find(l => l.id === id);
const norm = a => Math.hypot(a.x, a.y);
const diff = (a,b) => ({x:a.x-b.x,y:a.y-b.y});
const cross = (a,b) => a.x*b.y-a.y*b.x;
const dot = (a,b) => a.x*b.x+a.y*b.y;
const area = (a,b,c) => Math.abs(cross(diff(b,a),diff(c,a)))/2;
function near(a,b,why=''){assert.ok(Math.abs(a-b)<1e-9,`${why}: ${a} != ${b}`);}
function range(control){const out=[];for(let i=0;i<=Math.round((control.max-control.min)/control.step);i++)out.push(control.min+i*control.step);return out;}

test('five original geometry lessons cover both OGE parts and expose complete learning questions',()=>{
 assert.equal(lessons.length,5);assert.equal(new Set(lessons.map(l=>l.id)).size,5);
 for(const l of lessons){
  assert.ok(l.title&&l.goal&&l.source.label,l.id);assert.equal(l.practices.length,3,l.id);
  for(const question of [l.predict,l.reason]){
   assert.equal(question.choices.length,3,l.id);assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<3,l.id);
   assert.ok(question.explain&&question.question,l.id);
  }
  for(const p of l.practices)assert.ok(p.prompt&&p.hint&&p.solution&&Number.isFinite(p.answer),l.id);
 }
 assert.ok(lessons.some(l=>l.tasks.some(n=>n<20)));assert.ok(lessons.some(l=>l.tasks.some(n=>n>20)));
});

test('median remains a midpoint; height can lie outside BC without clamping or changing areas',()=>{
 const l=byId('median-height');let external=0;
 for(const a of range(l.controls[0])){
  const g=l.geometry({a});
  near(g.M.x,(g.B.x+g.C.x)/2);near(g.M.y,(g.B.y+g.C.y)/2);
  near(dot(diff(g.A,g.H),diff(g.C,g.B)),0,'height perpendicular');
  near(cross(diff(g.H,g.B),diff(g.C,g.B)),0,'foot on line');
  near(g.H.x,a,'foot not clamped');near(area(g.A,g.B,g.M),area(g.A,g.M,g.C));
  near(area(g.A,g.B,g.C),12);near(area(g.A,g.B,g.M),g.halfArea);
  if(a<0||a>6){external++;assert.ok(g.H.x<g.B.x||g.H.x>g.C.x);}
 }
 assert.ok(external>=4);
 assert.notEqual(byId('median-height').geometry({a:1}).median,4,'median need not equal height');
});

test('angle on diameter remains exactly right on every reachable point; nondegenerate endpoints excluded',()=>{
 const l=byId('diameter-angle');
 for(const angle of range(l.controls[0])){
  const g=l.geometry({angle});near(norm(diff(g.A,g.O)),3);
  near(dot(diff(g.B,g.A),diff(g.C,g.A)),0,'BAC right');
  near(norm(diff(g.B,g.A))**2+norm(diff(g.C,g.A))**2,36);
  assert.ok(area(g.A,g.B,g.C)>0);
 }
});

test('similarity applies one scale to all side lengths and its square to area including reductions',()=>{
 const l=byId('similarity-area');
 for(const k of range(l.controls[0])){
  const g=l.geometry({k});
  for(const [a,b,c,d] of [[g.A,g.B,g.D,g.E],[g.B,g.C,g.E,g.F],[g.A,g.C,g.D,g.F]])near(norm(diff(d,c))/norm(diff(b,a)),k);
  near(area(g.D,g.E,g.F)/area(g.A,g.B,g.C),k*k);
  near(area(g.D,g.E,g.F),g.secondArea);near(area(g.A,g.B,g.C),g.firstArea);
 }
});

test('both contacts stay on the circle and perpendicular to tangents, with equal lengths',()=>{
 const l=byId('equal-tangents');
 for(const d of range(l.controls[0])){
  const g=l.geometry({d});
  assert.ok(norm(diff(g.P,g.O))>g.r);
  for(const t of [g.A,g.B]){
   near(norm(diff(t,g.O)),g.r,'contact belongs to circle');
   near(dot(diff(t,g.O),diff(g.P,t)),0,'tangent perpendicular');
   near(norm(diff(g.P,t))**2,d*d-g.r*g.r);
  }
  near(norm(diff(g.P,g.A)),norm(diff(g.P,g.B)));
  near(g.length,norm(diff(g.P,g.A)));
 }
});

test('L8 construction retains equal radii, segment membership, midpoints and a common diameter-circle',()=>{
 const l=byId('midpoints-common-circle');
 for(const x of range(l.controls[0])){
  const g=l.geometry({x}),bc=norm(diff(g.C,g.B));
  near(norm(diff(g.B1,g.C)),bc,'CB1=BC');near(norm(diff(g.C1,g.B)),bc,'BC1=BC');
  for(const [p,start,end] of [[g.B1,g.C,g.A],[g.C1,g.B,g.A]]){
   near(cross(diff(p,start),diff(end,start)),0,'point belongs to side line');
   const t=dot(diff(p,start),diff(end,start))/dot(diff(end,start),diff(end,start));
   assert.ok(t>0&&t<1,'point remains strictly on side segment');
  }
  near(norm(diff(g.M,g.B)),norm(diff(g.M,g.B1)),'M midpoint');
  near(norm(diff(g.N,g.C)),norm(diff(g.N,g.C1)),'N midpoint');
  near(dot(diff(g.B,g.M),diff(g.C,g.M)),0,'BMC=90');
  near(dot(diff(g.B,g.N),diff(g.C,g.N)),0,'BNC=90');
  for(const p of [g.B,g.C,g.M,g.N])near(norm(diff(p,g.O)),bc/2,'same circle');
 }
});

test('15 transfer answers are independently recomputed from their stated data',()=>{
 const oracle={
  'median-height':[[10,6],[14,4],[8,9]].map(([base,height])=>base*height/4),
  'diameter-angle':[[10,6],[13,5],[17,8]].map(([hyp,leg])=>Math.sqrt(hyp*hyp-leg*leg)),
  'similarity-area':[8*(10/4)**2,7*3**2,20*(6/12)**2],
  'equal-tangents':[Math.sqrt(13**2-5**2),2*Math.sqrt(10**2-6**2),Math.sqrt(17**2-8**2)],
  'midpoints-common-circle':[10/2,14/2,9/2]
 };
 for(const l of lessons)l.practices.forEach((p,i)=>near(p.answer,oracle[l.id][i],`${l.id} variant ${i}`));
 const proof=byId('midpoints-common-circle');
 for(const p of proof.practices){assert.match(p.prompt,/Докажи|Обоснуй/);assert.match(p.proof,/CM|СM/);assert.match(p.proof,/BN/);assert.match(p.proof,/диаметр/);}
});

test('all scenes are pure accessible SVG and remain finite at every slider value and malformed input',()=>{
 for(const l of lessons){
  const c=l.controls[0];
  for(const value of [...range(c),NaN,Infinity,undefined,'bad',-1e30,1e30]){
   const params={[c.key]:value},before={...params};const result=l.render(params);
   assert.deepEqual(params,before,'render must not mutate caller');
   assert.match(result.svg,/^<svg /);assert.match(result.svg,l.id==='midpoints-common-circle'?/viewBox="130 0 220 300"/:/viewBox="0 0 480 300"/);assert.match(result.svg,/role="img"/);assert.match(result.svg,/<title>/);
   assert.doesNotMatch(result.svg,/NaN|Infinity|undefined|<script|foreignObject|onload|(?:href|src)=/);
   assert.ok(result.readout.length>20,l.id);
  }
 }
});

test('browser export touches no storage and exposes only data',()=>{
 const file=path.join(__dirname,'../trainers/oge-video-geometry.js'),context={window:{}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
 assert.deepEqual(Object.keys(context.window),['OgeVideoGeometryLessons']);
 assert.equal(context.window.OgeVideoGeometryLessons.length,5);
});


test('L8 prediction preview contains the givens but does not disclose circle or perpendicular construction',()=>{
 const l=byId('midpoints-common-circle');
 assert.equal(lessons.filter(item=>typeof item.preview==='function').length,1);
 for(const x of range(l.controls[0])){
  const preview=l.preview({x}),scene=l.render({x});
  for(const label of ['A','B','C','B₁','C₁','M','N'])assert.ok(preview.svg.includes('>'+label+'</text>'),label);
  // The seven tiny circles are vertex dots, not a solution circumference.
  const circles=Array.from(preview.svg.matchAll(/<circle [^>]*r="([^"]+)"[^>]*>/g),m=>Number(m[1]));
  assert.equal(circles.length,7);assert.ok(circles.every(r=>r===3.5));
  assert.doesNotMatch(preview.svg,/<path |stroke-dasharray="6 5"[^>]*r=/);
  assert.doesNotMatch(preview.readout,/окружност|90|перпендикуляр|диаметр/);
  assert.equal((preview.svg.match(/<line /g)||[]).length,8,'three given segments, two midpoint segments, three equal marks');
  assert.match(scene.svg,/<path /,'full scene explains right angles');
  const fullRadii=Array.from(scene.svg.matchAll(/<circle [^>]*r="([^"]+)"[^>]*>/g),m=>Number(m[1]));
  assert.ok(fullRadii.some(r=>r>3.5),'full scene includes the common circumference');
 }
});


test('L8 portrait viewBox retains every given, constructed point, and mobile-size label over the full control domain',()=>{
 const l=byId('midpoints-common-circle');
 function inside(x,y,margin=0){assert.ok(x>=130+margin&&x<=350-margin,`x=${x}`);assert.ok(y>=margin&&y<=300-margin,`y=${y}`);}
 // Dense sampling additionally covers numeric-field values between slider increments.
 for(let i=0;i<=200;i++){
  const x=1+i/100;
  for(const scene of [l.preview({x}),l.render({x})]){
   assert.match(scene.svg,/viewBox="130 0 220 300"/);
   for(const match of scene.svg.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"/g)){inside(+match[1],+match[2],2);inside(+match[3],+match[4],2);}
   for(const match of scene.svg.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)){const [cx,cy,r]=match.slice(1).map(Number);inside(cx-r,cy-r,2);inside(cx+r,cy+r,2);}
   for(const match of scene.svg.matchAll(/<polygon points="([^"]+)"/g))for(const pair of match[1].split(' ')){const [px,py]=pair.split(',').map(Number);inside(px,py,2);}
   for(const match of scene.svg.matchAll(/<path d="([^"]+)"/g))for(const pair of match[1].replace(/[ML]/g,'').split(' ')){const [px,py]=pair.split(',').map(Number);inside(px,py,2);}
   for(const match of scene.svg.matchAll(/<text x="([^"]+)" y="([^"]+)"[^>]*>([^<]+)<\/text>/g)){
    // Conservative 22-unit box per glyph and 22-unit ascent matches the mobile CSS.
    const tx=+match[1],ty=+match[2];inside(tx,ty-22);inside(tx+22*Array.from(match[3]).length,ty+5);
   }
  }
 }
});
