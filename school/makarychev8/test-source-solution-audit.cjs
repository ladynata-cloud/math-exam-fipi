'use strict';
const assert=require('node:assert/strict'),C=require('./check'),G=require('./task-graphs'),ts=require('./exercises-1039-1048.json');
for(const t of ts){assert(C.check(t.answer,t));for(const q of t.steps)assert(C.check(q.answer,q));assert(G.linearTrial(t.graph,'1 1/2'));}
for(const [title,yes,no]of [['№ 1039в','y>0.56','y>=0.56'],['№ 1039г','x<=1/16','x<1/16'],['№ 1040а','a<-115','a>-115'],['№ 1043а','нет решений','все числа'],['№ 1043б','все числа','∅'],['№ 1047б','m<2','m<=2'],['№ 1047в','m<=-6','m<-6'],['№ 1048, положительные значения','x<2','x>2']]){
 const t=ts.find(q=>q.title===title);assert(C.check(yes,t),title);assert(!C.check(no,t),title);
}
console.log('PASS all interval, degeneracy, finite natural, absolute-value and graph answers');
