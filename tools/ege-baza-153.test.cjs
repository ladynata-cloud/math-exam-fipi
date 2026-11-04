'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../ege-baza/path/data.js');require('../ege-baza/path/practice.js');
let reconstructed=0;
for(let seed=0;seed<120;seed++){
 const ring=D.task('practice-ring-route',seed),{half,ac,ad,cd}=ring.params;
 // L >= 2*AB. Beyond 2*(AC+AD), neither orientation can give CD.
 const results=[];
 for(let L=2*half;L<=2*(ac+ad)+1;L++)for(const c of [ac,L-ac])for(const d of [ad,L-ad]){
  const distance=(a,b)=>Math.min(Math.abs(a-b),L-Math.abs(a-b));
  if(distance(c,d)===cd)for(const b of [half,L-half])results.push({L,bc:distance(b,c)});
 }
 assert(results.length>0);assert(results.every(x=>x.L===2*half&&x.bc===ring.answer));reconstructed++;
 const travel=D.task('practice-average-three',seed),{dist,speed}=travel.params;
 assert.equal(new Set(dist).size,3);const times=dist.map((d,i)=>d/speed[i]);
 assert.notEqual(new Set(times).size,1);assert(Math.abs(travel.answer*times.reduce((a,b)=>a+b)-dist.reduce((a,b)=>a+b))<1e-8);
 assert(!D.correct(travel,String(speed.reduce((a,b)=>a+b)/3)),'arithmetic mean must fail');
 const meeting=D.task('practice-ring-meeting',seed),{L,fast,slow,same}=meeting.params;
 const delta=t=>((fast*t-(same?1:-1)*slow*t)%L+L)%L;
 assert(delta(meeting.answer)<1e-8);for(let q=1;q<100;q++)assert(delta(meeting.answer*q/100)>1e-8);
 assert(!D.correct(meeting,'0'));assert(!D.correct(meeting,String(meeting.answer*2)));
}
// In a deletion problem enumerate every five-digit candidate, including invalid permutations.
for(let seed=0;seed<4;seed++){
 const t=D.task('practice-digits-delete',seed),possible=[];
 for(let n=10000;n<100000;n++){
  const s=String(n),expected=n%22===0&&new RegExp([...s].join('.*')).test(t.params.digits);
  assert.equal(D.correct(t,s),expected);assert.equal(D.correct(t.steps.at(-1),s),expected);if(expected)possible.push(s);
 }
 assert(possible.length>1);assert.deepEqual(t.solutions,possible);
 for(const bad of ['012034','12034.0','1.2034e4',' 0 ', 'NaN'])assert(!D.correct(t,bad));
}
const html=fs.readFileSync('trainers/ege-baza/index.html','utf8');
const context={};vm.createContext(context);vm.runInContext(html.slice(html.indexOf('/*__EGE_DATA_START__*/'),html.indexOf('/*__EGE_DATA_END__*/'))+';globalThis.tasks=TASKS;',context);
const task=id=>context.tasks.find(t=>t.id===id);
const lake=task('p20a'),l=lake.lab;assert.equal(l.L,6);assert.equal(l.vA*2*l.L/(l.vA+l.vB),lake.answer);
const mix=task('p20b');assert.equal(mix.lab.solute+mix.lab.water0,6);assert.equal(mix.lab.solute/6*100,15);assert.equal(mix.lab.solute/(6+mix.lab.added)*100,mix.answer);
const average=task('p20c');assert.deepEqual(Array.from(average.lab.dist),[120,180,150]);assert.deepEqual(Array.from(average.lab.speed),[60,90,75]);assert.equal(average.lab.dist.reduce((a,b)=>a+b)/average.lab.dist.reduce((a,d,i)=>a+d/average.lab.speed[i],0),average.answer);
const towards=task('p20d');assert.equal(towards.lab.L,300);assert.equal(towards.lab.L-towards.lab.meeting,180);assert.equal(towards.lab.meeting/towards.lab.t,towards.answer);
console.log(`EGE_153_MATH_OK: 360000 candidate answers and guided alternatives; ${reconstructed} exhaustive ring reconstructions; unequal-speed and first-meeting checks; p20a–d condition/model consistency.`);

const State=require('../ege-baza/path/managed-state.js');
for(let seed=0;seed<12;seed++){
 const t=D.task('practice-ring-meeting',seed),value={kind:'ring-motion',time:t.answer};
 assert.deepEqual(State.model(value,t),value);
 for(const bad of [-1,Infinity,NaN,'4',t.answer*1.5+.01])assert.throws(()=>State.model({...value,time:bad},t));
 assert.throws(()=>State.model({...value,extra:1},t));assert.throws(()=>State.model({kind:'ring',mode:1},t));
}
console.log('EGE_153_STATE_OK: bounded ring time round trip; invalid, foreign and extra fields rejected.');
