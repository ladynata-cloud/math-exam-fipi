'use strict';
const assert=require('node:assert/strict'),C=require('./check'),ts=require('./exercises-1049-1062.json');
for(const t of ts){assert(C.check(t.answer,t));for(const q of t.steps)assert(C.check(q.answer,q));}
for(const [t,yes,no]of [['№ 1049','0;1;2;3;4;5','1;2;3;4;5;6'],['№ 1051','v>18','v>=18'],['№ 1052','11;12;13','10;11;12;13'],['№ 1053в','∅','все числа'],['№ 1054б','-10','10'],['№ 1059','a>7/2','a>=7/2'],['№ 1060','(-3;5)','[-3;5]'],['№ 1061','(10;65/4)','(10;45/4)'],['№ 1062','(60;90]','(60;84]']]){
 const q=ts.find(z=>z.title===t);assert(C.check(yes,q),t);assert(!C.check(no,q),t);
}
console.log('PASS all applied limits, two and three constraints, integer and parameter tasks');
