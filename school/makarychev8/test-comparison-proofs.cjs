'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),ts=require('./exercises-846-859.json'),find=n=>ts.find(t=>t.title===n);
const pair=find('№ 846, взаимопроверка');for(const a of ['3;2','101;100','2000000;195']) assert(C.check(a,pair));
for(const a of ['2;3','2;2','0;1','0.5;0.25','x;2','2;3;5'])assert(!C.check(a,pair));
assert(G.admissibleSample('0;0','nonnegative',2));assert(!G.admissibleSample('2;2','positive-unequal',2));assert(!G.admissibleSample('0','positive',1));
assert.equal(G.inequalityTrial(find('№ 847').graph,'2').sign,'=');assert.equal(G.inequalityTrial(find('№ 847').graph,'1/2').sign,'>');
const means=find('№ 853').graph;assert.equal(G.inequalityTrial(means,'0;0').sign,'=');assert.equal(G.inequalityTrial(means,'2;0').sign,'<');
for(const t of ts.filter(t=>t.kind==='proof-chain')){const n=t.answer.split(';').map(Number);assert.equal(new Set(n).size,3);}
assert.equal(G.sourceFractionTrial(find('№ 858б').graph,'3/2').original,null);assert.equal(G.sourceFractionTrial(find('№ 858б').graph,'3/2').reduced,'1');
console.log('PASS paired natural numbers, domain restrictions, zero and equality boundaries, uncancelled exclusions');
