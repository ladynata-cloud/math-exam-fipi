'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js'),data=require('./exercises-671-686.json');
const find=ref=>data.find(t=>t.source.reference==='№ '+ref);
for(const [ref,pairs,ok]of [
 ['672а','(9;1/2), (7;-1/2), (10;1)',true],['672б','(10;1),(10;2),(10;3)',true],
 ['672в','(3;-3),(24;1/2),(-4;4)',true],['672г','(1;-1),(3;2),(1;2)',true],
 ['672г','(1;-1),(3;2),(1;-1)',false],['672б','(0;10),(10;2),(10;3)',false],
 ['675д','(0;3),(4;3) | (2;-9),(2;8)',true],['675д','(0;3),(4;3) | (1;3),(2;3)',false],
 ['677а','(1/3;-2),(5/3;0)',true],['675г','(-0,5;1,5),(2;3/2)',true],
 ['679б','y(x+1)=x(x+1)',true],['679б','4(x+1)(y-x)=0',true],
 ['679б','(x-y)(x+1)(x+2)=0',false],['679б','(x-y)(x+1)/x=0',false],
 ['686а','(x-1)/(4x^3)',false],['686б','(48n^2-3)/(8n^3)',false]
])assert.equal(C.check(pairs,find(ref)),ok,ref+': '+pairs);
for(let level=1;level<=3;level++)for(let seed=1;seed<=60;seed++){
 const q=M.practicePlane(seed,level);
 assert(C.check(q.answer,q));
 const groups=C.pointGroups(q.answer);assert.equal(groups.length,level===3?2:1);
 // Reversing both the order of branches and the order of points preserves the drawing.
 const v=q.answer.split('|').reverse().map(x=>x.trim().split(', ').reverse().join(', ')).join(' | ');
 assert(C.check(v,q));
 for(const s of q.steps)assert(C.check(s.answer,s));
}
console.log('PASS free points and lines, equivalent quadratic equations, two errata, 180 generated constructions');
