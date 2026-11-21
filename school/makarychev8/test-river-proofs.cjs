'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),ts=require('./exercises-1014-1021.json'),river=ts.find(t=>t.id==='p36-extra-1020');
for(const t of ts){assert(C.check(t.answer,t));for(const q of t.steps)assert(C.check(q.answer,q));if(t.graph.type==='inequality-evidence')assert(G.inequalityTrial(t.graph,t.steps[t.graph.trialStep||0].answer,true));}
for(const guess of river.steps[0].choices)assert(C.check(guess,river.steps[0]));assert(!C.check('любой другой текст',river.steps[0]));
assert(!C.check('x — путь, y и z — времена, s — скорость катера',river.steps[1]));assert(C.check('2sx/(x²−y²)',river.steps[3]));assert(!C.check('2sx/(x²+z²)',river.steps[4]));
for(const [d,count,yes,no]of [['above-three',1,'7/2','3'],['speed-current',2,'10;3','3;10'],['two-rivers',4,'8;2;7;4','8;7;2;4'],['all-real',1,'-8','не число']]){assert(G.admissibleSample(yes,d,count));assert(!G.admissibleSample(no,d,count));}
assert.equal(G.inequalityTrial(river.graph,'12;2;4;24',true).sign,'<');
console.log('PASS original hypotheses retained independently of correct proof and separate symbolic times for two rivers');
