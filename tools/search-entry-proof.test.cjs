'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../geometry-course/assets/search-entry-proof.js');
const ids={angles:'ch4-p1-t2-proof-angle-sum',asa:'ch2-p3-t2-proof-asa'};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Independent angle oracle uses atan2(cross, dot), not the runtime's acos.
function measured(a,v,b){const ax=a.x-v.x,ay=a.y-v.y,bx=b.x-v.x,by=b.y-v.y;return Math.atan2(Math.abs(ax*by-ay*bx),ax*bx+ay*by)*180/Math.PI;}
test('every allowed research triangle is non-degenerate; sum is 180 degrees',()=>{
 for(let x=0;x<=100;x+=5)for(let y=0;y<=100;y+=5){
  const {points,angles,sum}=api.research('angle-sum',x,y),[a,b,c]=points;
  assert.deepEqual(a,{x:55,y:210});assert.deepEqual(b,{x:345,y:210});assert(c.y<a.y);
  const actual=points.map((v,i)=>measured(points[(i+1)%3],v,points[(i+2)%3]));
  actual.forEach((n,i)=>assert(Math.abs(n-angles[i])<1e-8));assert(Math.abs(actual.reduce((s,n)=>s+n,0)-180)<1e-8);assert(Math.abs(sum-180)<1e-8);
  for(const p of points)assert(p.x>=0&&p.x<=400&&p.y>=0&&p.y<=250);
 }
});
test('ASA fixes one side and its first angle; the second angle matches only at the intersection',()=>{
 let matches=0;
 for(let n=40;n<=160;n++){
  const {points,target,matched}=api.research('asa',n),[a,b,c]=points;
  assert(Math.abs(distance(a,b)-143)<1e-9);assert(Math.abs(measured(b,a,c)-48)<1e-8);
  if(Math.abs(measured(a,b,c)-67)<1e-8){matches++;assert.equal(n,100);assert(matched);assert(distance(c,target)<1e-8);}else assert(!matched);
  for(const p of [...points,target])assert(p.x>=20&&p.x<=380&&p.y>=20&&p.y<=230,'whole model remains in its viewport');
 }
 assert.equal(matches,1);
});
test('new task models preserve their stated angles under rotation and reflection',()=>{
 for(const [a,b]of [[47,68],[46,71]])for(const mirror of [false,true])for(const rotation of [0,72,180]){
  const p=api.triangle(a,b,rotation,mirror),q=api.fit(p);
  assert(Math.abs(measured(p[1],p[0],p[2])-a)<1e-8);assert(Math.abs(measured(p[0],p[1],p[2])-b)<1e-8);
  assert(Math.abs(measured(p[0],p[2],p[1])-(180-a-b))<1e-8);
  for(let i=0;i<3;i++)assert(Math.abs(measured(q[(i+1)%3],q[i],q[(i+2)%3])-measured(p[(i+1)%3],p[i],p[(i+2)%3]))<1e-8);
 }
 for(const pair of [[0,70],[90,90],[100,90],[NaN,30]])assert.throws(()=>api.triangle(...pair),RangeError);
});
test('answer AND justification are required; empty input does not spend an attempt',()=>{
 let p=api.fresh(ids.angles,'angle-sum').practice;
 assert.equal(api.attempt('angle-sum',p,'','angle-sum').state.attempts,0);
 assert.equal(api.attempt('angle-sum',p,'65','').result,'empty');
 for(const s of ['65','65.0','65,0',' 65° '])assert(api.check('angle-sum',s,'angle-sum'));
 for(const s of ['64','0x41','6°5','65;','6.5e1'])assert(!api.check('angle-sum',s,'angle-sum'));
 assert(!api.check('angle-sum','65','appearance'));assert(!api.check('asa','U','two-angles'));
 assert(api.check('asa','У','asa'));assert(!api.check('asa','R','asa'));assert(!api.check('asa','U°','asa'));
});
test('first independent success is preserved, never multiplied by repeating; wrong/help stay assisted',()=>{
 const start=api.fresh(ids.angles,'angle-sum').practice;
 const first=api.attempt('angle-sum',start,'65','angle-sum');assert.equal(first.result,'independent');assert(first.state.independent);
 const repeat=api.attempt('angle-sum',first.state,'65','angle-sum');assert.equal(repeat.result,'repeat');assert.equal(repeat.state.attempts,1);
 const edited=api.attempt('angle-sum',first.state,'12','angle-sum');assert.equal(edited.result,'changed');assert(edited.state.independent,'previous achievement is retained, current answer is not approved');
 const wrong=api.attempt('angle-sum',start,'64','angle-sum');assert.equal(wrong.result,'wrong');assert(wrong.state.assisted);assert(!wrong.state.revealed,'wrong answer does not open a solution');
 assert.equal(api.attempt('angle-sum',wrong.state,'65','angle-sum').result,'assisted');
 assert.equal(api.attempt('angle-sum',{...start,assisted:true,revealed:true},'65','angle-sum').result,'assisted');
});
test('typed drafts reject impossible success and unknown versions without reinterpreting old progress',()=>{
 const v=api.fresh(ids.asa,'asa');assert(api.valid(v,ids.asa,'asa'));
 for(const mutation of [x=>x.version=2,x=>x.topic=ids.angles,x=>x.research.position=200,x=>x.notes.reasons='x'.repeat(2001),x=>x.practice.independent=true]){
  const copy=JSON.parse(JSON.stringify(v));mutation(copy);assert(!api.valid(copy,ids.asa,'asa'));
 }
});
