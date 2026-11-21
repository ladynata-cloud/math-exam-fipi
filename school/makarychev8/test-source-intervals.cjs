'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),M=require('./models.js'),tasks=require('./exercises-911-931.json'),task=id=>tasks.find(t=>t.id==='p38-source-'+id);
assert(C.check('[-2; 4] | числовой отрезок',task('911-a')));assert(!C.check('(-2;4) | отрезок',task('911-a')));assert(!C.check('[-2;4] | интервал',task('911-a')));
for(const q of ['[-∞;3]','[1;+∞]','[3;2]','[1;1)','[+∞;+∞)'])assert.equal(C.axisRanges(q),null);
assert(C.equalAxisSets('(0;1)∪[1;2)','(0;2)'));assert(!C.equalAxisSets('(0;1)∪(1;2)','(0;2)'));assert(C.equalAxisSets('(-∞;0)∪[0;+∞)','(-∞;+∞)'));
assert(C.equalAxisSets('(10;12) или (-4;1)',task('926-b-u').answer));assert(!C.check('(-4;12)',task('926-b-u')));
assert(C.check('6/54;7/54;8/54;9/54',task('919-fractions')));assert(!C.check('1/9;7/54;4/27;1/6',task('919-fractions')));
assert(C.check('1,999;199/100',task('923-examples')));assert(!C.check('1.999;1.999',task('923-examples')));assert(!C.check('1.99;2',task('923-examples')));
assert(C.check('40;45',task('930-trains')));assert(!C.check('45;40',task('930-trains')));
for(let seed=0;seed<60;seed++)for(let level=1;level<=3;level++){
 const p=M.practiceAxis(seed,level),r=C.axisRanges(p.answer);assert(C.check(p.answer,p));assert.equal(r.length,level===3?2:1);for(const q of p.steps)assert(C.check(q.answer,q));
}
console.log('PASS exact infinite endpoints, open contact holes, alternate names, free examples, preserved denominator and 180 variants');
