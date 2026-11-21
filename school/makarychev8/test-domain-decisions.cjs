'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js'),G=require('./task-graphs.js'),ts=require('./exercises-956-972.json'),task=id=>ts.find(t=>t.id==='p39-source-'+id);
const p=task('963-parameters');assert(!C.check('(4/3;+∞)',p));assert(C.check('(4;+∞)∪(4/3;4)',p));
assert(C.check('все',task('956-a')));assert(!C.check('нет',task('956-a')));assert(C.check('нет',task('956-b')));assert(!C.check('все',task('956-d')));
const cube=task('971-graph');for(const v of ['2,3','2.29','2.289','∛12','cbrt(12)'])assert(C.check(v,cube));for(const v of ['2','2.24','2.1','-2.3','0','12'])assert(!C.check(v,cube));
assert(!C.check('756',task('967-transfer')));assert(C.check('26 2/3',task('968-return')));assert(C.check('12',task('972-boat')));assert(!C.check('-0.75',task('972-boat')));
for(let s=0;s<60;s++)for(let l=1;l<=3;l++){const t=M.practiceCase(s,l);assert(C.check(t.answer,t));assert.equal(C.axisRanges(t.answer).length,l===3?2:1);for(const q of t.steps)assert(C.check(q.answer,q));}
console.log('PASS linear exceptions, excluded roots, graphical rounding precision and 180 generated domains');
