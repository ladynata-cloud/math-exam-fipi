'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),T=require('./exercises-932-955.json'),task=id=>T.find(t=>t.id==='p39-source-'+id);
const q=task('936-g');for(const v of ['x <= 1/4','0.25 ≥ x','(-∞;0,25]'])assert(C.check(v,q));for(const v of ['x<1/4','y<=1/4','x≥1/4','[1/4;+∞)'])assert(!C.check(v,q));
assert.deepEqual(G.linearTrial(q.graph,'1/4'),{left:'-1',right:'-1',sign:'=',holds:true});assert.equal(G.linearTrial(q.graph,'3/4').holds,false);
const examples=task('937-examples');assert(C.check('2.1;100;7/2',examples));assert(!C.check('2;3;4',examples));assert(!C.check('3;3;4',examples));
const quad=task('945-b');assert(G.linearTrial(quad.graph,'999999999999').holds);assert(!G.linearTrial(quad.graph,'-999999999999').holds);
for(let seed=0;seed<60;seed++)for(let level=1;level<=3;level++){
 const v=M.practiceRay(seed,level),g=v.graph,b=Number(g.threshold);assert(C.check(v.answer,v));
 for(const x of [b-1,b,b+1]){const trial=G.linearTrial(g,x),l=Number(g.left[0])+Number(g.left[1])*x,r=Number(g.right[0])+Number(g.right[1])*x;assert.equal(trial.holds,g.operator==='<'?l<r:l<=r);}
 for(const s of v.steps)assert(C.check(s.answer,s));
}
console.log('PASS arbitrary examples, exact equivalence of rays, wrong signs after division and 180 fresh variants');
