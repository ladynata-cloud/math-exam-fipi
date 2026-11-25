'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),cards=require('./exercises-832-837.json'),find=n=>cards.find(t=>t.title==='№ '+n);
const triple=find('834'),exclude=find('835б');
for(const good of ['1;0;0','0;1;4','-16;19;20','1/3;0;8','-8;9.000000001;10'])assert(C.check(good,triple),good);
for(const bad of ['0;0;0','0;0;99','-16;18;20','-16;18;21','1;2'])assert(!C.check(bad,triple),bad);
assert(C.systemTriple('-16;18;20').same);assert(!C.systemTriple('-16;18;20.000000001').same);
for(const good of ['c≠6','с != 6','c <> 12/2','(-∞;6)∪(6;+∞)','R\\{6}'])assert(C.check(good,exclude),good);
for(const bad of ['6','3','c≠5','(-∞;6]∪(6;+∞)','(-∞;6)'])assert(!C.check(bad,exclude),bad);
for(const t of cards.filter(q=>q.kind==='line-pair-equation')){
 const line=C.affinePlot(t.answer);assert(line);
 const pts=t.graph.fromSystem?[...t.graph.points,[2,-5]]:t.graph.points;for(const [x,y]of pts)assert(line.atPoint(x,y));
}
assert(C.affinePlot('2y+5x=0').atPoint(2,-5));
assert(!C.affinePlot('y=0.000000001x').atPoint(1,0));
assert(!C.affinePlot('y=x^2'));assert(!C.affinePlot('x=3'));
console.log('PASS open coefficients, exact parallelism, parameter complement and submitted line incidences');
