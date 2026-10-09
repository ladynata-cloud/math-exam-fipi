'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-profil/start/readiness');
const C=require('../ege-profil/start/checks');
const lessons=['geometry','stereo','algebra','probability','equations','functions','applied','readiness'].flatMap(x=>require('../ege-profil/start/'+x+'-data'));
const ids=new Set(lessons.map(l=>l.id));
// Independent calculations for the public placement questions, not copied keys.
const oracle={signs:-(3**2),fractions:(3/4)/(1/2),roots:Math.sqrt(25)/Math.sqrt(36),equations:12/3+2,coordinates:-2,triangle:4/5,powers:1/(2*2*2),quadratic:(5+Math.sqrt(25-24))/2,circle:-3/5,radians:240/180,exact:2*Math.sin(Math.PI/6),cosine:-Math.sqrt(1-(3/5)**2)};
assert.equal(D.checks.length,12);assert.equal(new Set(D.checks.map(q=>q.id)).size,12);
for(const q of D.checks){assert(ids.has(q.lesson),q.id+' remediation exists');assert(Math.abs(q.answer-oracle[q.id])<1e-9,q.id+' independent answer');assert(C.check(q.answer,String(oracle[q.id])),q.id+' valid input');assert(!C.check(q.answer,String(oracle[q.id]+1)),q.id+' rejects wrong value');assert(q.why&&q.prompt);}
const all=Object.fromEntries(D.checks.map(q=>[q.id,true]));
assert.deepEqual(D.recommend(all),[]);
assert.deepEqual(D.recommend({...all,circle:false,radians:false,cosine:false}),['trig-coordinates','trig-angle','algebra-cosine']);
assert(D.recommend({}).includes('bridge-fractions'));
assert(!D.recommend({...all,roots:false}).includes('bridge-signs'),'known skills not forced into repeat');
for(const id of [...D.foundation,...D.trig,...D.routes.flatMap(r=>r.ids),...Object.keys(D.next),...Object.values(D.next),...Object.keys(D.prerequisites),...Object.values(D.prerequisites).flat()])assert(ids.has(id),'real route target '+id);
assert.equal(D.next['eq-linear'],'eq-rational');assert.equal(D.next['algebra-exponential'],'algebra-logarithmic');assert.equal(D.next['trig-tangent'],'algebra-cosine');
for(const id of D.trig){const seen=new Set();let current=id;while(D.next[current]){assert(!seen.has(current),'no next-lesson loop');seen.add(current);current=D.next[current];}}
// Placement feedback must not reveal the next "new" independent condition.
const degree=Number(D.checks.find(q=>q.id==='radians').prompt.match(/(\d+)°/)[1]);
assert(!lessons.find(l=>l.id==='trig-angle').tasks.slice(3).some(t=>t.meta.degrees===degree),'diagnostic radians differ from reserved tasks');
console.log(JSON.stringify({gate:'PROFILE_READINESS_PLAN_OK',placementQuestions:12,validTargets:ids.size,recommendationCases:4,diagnosticReserveSeparation:true}));
