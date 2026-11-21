'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js');
for(let seed=1;seed<=60;seed++)for(let level=1;level<=3;level++){
 const q=M.practiceGraphical(seed,level),line=q.graph.curves[1],D=line.k**2+4*line.b,n=D<0?0:D===0?1:2;
 const pts=q.kind==='number'?[]:C.pointGroups(q.answer)[0];
 assert.equal(pts.length,n);for(const [x,y]of pts){assert.equal(x.d,1);assert.equal(y.n,x.n**2);assert.equal(y.n,line.k*x.n+line.b);}
 assert(C.check(q.answer,q));for(const s of q.steps)assert(C.check(s.answer,s));
}
console.log('PASS 180 generated secant, tangent and disjoint line–parabola systems');
