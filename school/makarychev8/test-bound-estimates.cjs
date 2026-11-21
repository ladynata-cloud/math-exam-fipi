'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js'),ts=require('./exercises-869-880.json'),task=id=>ts.find(t=>t.id==='p35-source-'+id);
const perimeter=task('877-a'),inverse=task('878-a');
for(const x of ['[20,4;20,8]','20,4 ≤ P ≤ 20,8','20,8 >= P >= 20,4'])assert(C.check(x,perimeter));
for(const x of ['(20.4;20.8)','[20.4;20.8)','(20.4;20.8]'])assert.equal(C.estimateStatus(x,perimeter),'inclusion');
assert.equal(C.estimateStatus('20.4 ≤ x ≤ 20.8',perimeter),'format');assert.equal(C.estimateStatus('[20.8;20.4]',perimeter),'order');assert.equal(C.estimateStatus('[20;21]',perimeter),'ends');
for(const x of ['(0,125;0,2)','1/8 < 1/y < 1/5','0,2 > 1/y > 1/8'])assert(C.check(x,inverse));
for(const x of ['(1/5;1/8)','1/8 < y < 1/5','(0;1)∪(1;2)'])assert(!C.check(x,inverse));
assert(C.check('3;1;2;4',task('869')));assert(C.check('6;4;8;2',task('869').steps[0]));assert(!C.check('2;4;8;6',task('869').steps[0]));
for(let seed=0;seed<60;seed++)for(let level=1;level<=3;level++){
 const t=M.practiceBounds(seed,level),q=C.estimateInput(t.answer,t.graph.expression);assert(C.check(t.answer,t));assert.equal(q.leftOpen,seed%2===1);
 assert(q.min<q.max);if(level===3)assert.equal(q.min,1/Number(t.graph.source[1]));
 assert(!C.check((q.leftOpen?'[':'(')+t.answer.slice(1),t));for(const s of t.steps)assert(C.check(s.answer,s));
}
console.log('PASS open and closed bounds, direction, exact endpoints and 180 generated estimates');

