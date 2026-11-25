'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),ts=require('./exercises-991-1003.json'),card=n=>ts.find(t=>t.id==='p40-source-'+n);
assert(C.check('-4<a<4',card('995-two-roots')));assert(!C.check('-4≤a<4',card('995-two-roots')));assert(C.check('b<-4/3',card('996-two-roots')));assert(!C.check('b<=-4/3',card('996-two-roots')));
assert(C.check('3;0;5',card('992-a-examples')));assert(!C.check('3;3.0;5',card('992-a-examples')));assert(!C.check('3;5;6',card('992-a-examples')));assert(!C.check('3;5',card('992-a-examples')));
assert(C.check('10<m<12',card('997-c')));assert(!C.check('9<m<12',card('997-c')));assert.equal(card('997-c').graph.rows.length,3);
for(const [id,valid,invalid]of [['1000-a','x<=12/25','x<12/25'],['1000-b','x>11/5','x>=11/5'],['1000-c','(-∞;2/3)∪(2/3;+∞)','все числа'],['1003-ride','10;15','15;10']]){assert(C.check(valid,card(id)));assert(!C.check(invalid,card(id)));}
assert(G.admissibleSample('12','natural-single',1));assert(!G.admissibleSample('0','natural-single',1));assert(!G.admissibleSample('1/2','natural-single',1));
assert(C.check('√(2s/a)',card('1002-c')));assert(!C.check('-√(2s/a)',card('1002-c')));assert(!C.check('s/a',card('1002-a')));
console.log('PASS three simultaneous constraints, both parameter roots, three new examples, radical denominator, positive time and two speeds');

const M=require('./models.js');
for(let seed=0;seed<60;seed++)for(let level=1;level<=3;level++){const t=M.practiceRootLocations(seed,level),g=t.graph.settings;assert(C.check(t.answer,t));for(const q of t.steps)assert(C.check(q.answer,q));const ranges=C.axisRanges(t.answer);for(let a=-25;a<=25;a+=0.5){const c=g.coefficient*a+g.offset,ok=(g.low===null||c-g.radius>g.low)&&c+g.radius<g.high;assert.equal(ranges.some(r=>a>r.min&&a<r.max),ok);}}
console.log('PASS 180 independently scanned new parameter tasks');
