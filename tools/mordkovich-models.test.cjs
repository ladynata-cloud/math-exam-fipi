'use strict';
const assert=require('node:assert/strict');
const {math}=require('../ege-profil/circle/models.js');
const T=2*Math.PI;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(let n=-40;n<=40;n++)for(const fraction of [0,1/12,1/4,1/3,1/2,3/4,11/12]){
 const t=(n+fraction)*T, v=math.values(t);
 near(v.normalized,fraction*T);
 near(v.x*v.x+v.y*v.y,1);
 if(v.tan!==null)near(v.tan*v.x,v.y);
 if(v.cot!==null)near(v.cot*v.y,v.x);
}
for(const t of [Math.PI/2,3*Math.PI/2,-Math.PI/2,21*Math.PI/2])assert.equal(math.values(t).tan,null);
for(const t of [0,Math.PI,2*Math.PI,-Math.PI,15*Math.PI])assert.equal(math.values(t).cot,null);
assert.equal(math.radians(-5*Math.PI/3),'−5π/3');
assert.equal(math.radians(12*Math.PI),'12π');
assert.equal(math.exact(-Math.sqrt(3)/2),'−√3/2');
assert.equal(math.values(-5*Math.PI/2).angle,-5*Math.PI/2);
// Every highlighted slice is checked against the coordinate inequality directly.
let comparisons=0;
for(const axis of ['x','y'])for(const c of [-1.5,-1,-.9,-Math.SQRT1_2,-.5,0,.5,Math.SQRT1_2,.9,1,1.5])for(const relation of ['>','>=','<','<=']){
 const result=math.sliceIntervals(axis,c,relation);
 for(const a of result.roots)near(axis==='x'?Math.cos(a):Math.sin(a),c);
 for(let i=0;i<720;i++){
  const t=(i+.3125)*T/720,v=axis==='x'?Math.cos(t):Math.sin(t);
  const expected=relation==='>'?v>c:relation==='>='?v>=c:relation==='<'?v<c:v<=c;
  assert.equal(result.intervals.some(([a,b])=>t>a&&t<b),expected,`${axis}${relation}${c} at ${t}`);comparisons++;
 }
 assert.equal(result.closed,relation.includes('='));
}
assert.deepEqual(math.sliceIntervals('x',1,'>=').intervals,[]);
assert.deepEqual(math.sliceIntervals('x',1,'>=').roots,[0]);
assert.equal(math.belongs(1,1,'>='),true);assert.equal(math.belongs(1,1,'>'),false);
assert.equal(math.sliceIntervals('y',-1,'<=').roots.length,1);
console.log(JSON.stringify({gate:'MORDKOVICH_MODELS_MATH_OK',sliceComparisons:comparisons,multipleTurns:true,undefinedRatios:true}));
