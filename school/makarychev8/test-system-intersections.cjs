'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),ts=require('./exercises-973-990.json');
const card=id=>ts.find(t=>t.id==='p40-source-'+id);
for(const txt of ['2<=x≤4','4≥x>=2','[2;4]'])assert(C.check(txt,card('977-b')));
for(const txt of ['2<x≤4','2<=y≤4','2≤x>4','x=2','1<x<0'])assert(!C.check(txt,card('977-b')));
for(const txt of ['(-∞;14/5)','a<2.8'])assert(C.check(txt,card('988-a')));
assert(C.check('все числа',card('988-a').steps[2]));assert(C.check('нет решений',card('988-b').steps[1]));assert(C.check('∅',card('988-b')));
assert(C.check('3;2,75',card('977-b-examples')));assert(!C.check('3;3,0',card('977-b-examples')));assert(!C.check('2;4.1',card('977-b-examples')));
assert(C.check('7/30;13/60',card('977-c-examples')));assert(!C.check('1/5;1/4',card('977-c-examples')));
assert(C.check('[5/2;11)∪(11;+∞)',card('983-a')));assert(!C.check('[5/2;+∞)',card('983-a')));
assert(C.check('0;-1;-2',card('986-d-integers')));assert(!C.check('0;-1',card('986-d-integers')));
const rows=card('980-d').graph.rows;assert(rows.every(r=>G.linearTrial(r,'3').holds));assert(rows.some(r=>!G.linearTrial(r,'67/10').holds));
for(let s=0;s<60;s++)for(let l=1;l<=3;l++){
 const t=M.practiceIntersection(s,l);assert(C.check(t.answer,t));for(const q of t.steps)assert(C.check(q.answer,q));
 const set=C.axisRanges(t.answer);for(let x=-8;x<=17;x+=.5){const direct=t.graph.rows.every(r=>G.linearTrial(r,String(x)).holds);const shown=set.some(r=>(x>r.min||x===r.min&&!r.leftOpen)&&(x<r.max||x===r.max&&!r.rightOpen));assert.equal(direct,shown);}
}
console.log('PASS 180 new systems, two inequality syntaxes, empty/universal rows, distinct user examples and denominator exclusions');
