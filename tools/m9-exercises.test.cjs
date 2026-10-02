'use strict';
const assert=require('node:assert/strict'),D=require('../school/m9-exercises/data'),Check=require('../school/m9-exercises/checks'),State=require('../school/m9-exercises/app');
const C=require('../school/curriculum'),M=require('../school/math');require('../school/algebra7').install(C,M);require('../school/secondary').install(C,M);require('../school/core-content').install(C);require('../school/core-math').install(M);require('../school/paths').install(C);const E=require('../school/editions-content');E.install(C);require('../school/editions-math').install(M);const V6=require('../school/vilenkin6-lessons');V6.install(C,E);require('../school/vilenkin5-lessons').install(C,V6);require('../school/makarychev9-lessons').install(C,E);
assert.equal(D.total,891);assert.deepEqual(D.exercises.map(e=>e.number),Array.from({length:36},(_,i)=>i+1));assert.equal(D.exercises.reduce((n,e)=>n+e.parts.length,0),144);
let steps=0;for(const e of D.exercises)for(const p of e.parts){assert(C.byId[p.skill],p.skill);assert(p.steps.length>=2);assert(p.steps.some(s=>s.final));for(const s of p.steps){steps++;assert(s.explain&&s.hints.length===2);const a=s.rule.type==='interval'?JSON.parse(s.example):s.example;assert(Check.check(s,a).ok,`${e.number} ${p.label}: ${s.prompt}`);assert(!Check.check(s,'').ok,'empty accepted');if(s.rule.type==='number'&&s.rule.value!==0)assert(!Check.check(s,'0').ok,'zero accepted for '+s.rule.value);if(s.rule.type==='choice'){assert(!Check.check(s,s.rule.answer.concat('impossible')).ok);assert(!Check.check(s,[...s.rule.answer,...s.rule.answer]).ok);}}}
function final(n,p=0){return D.byNumber[n].parts[p].steps.filter(s=>s.final);}
function numeric(n,values){values.forEach((v,i)=>assert(Math.abs(final(n,i).at(-1).rule.value-v)<1e-12*Math.max(1,Math.abs(v)),`source oracle #${n}/${i}`));}
// Independent calculations from the visually verified printed source.
numeric(20,[Math.sqrt(1)-Math.sqrt(.64),Math.sqrt(1-.64),2*Math.sqrt(.12+4*.01),Math.sqrt(3*.6-.8),Math.sqrt(.7+Math.sqrt(.09)),-Math.sqrt(4.8-Math.sqrt(.64))]);
numeric(21,[(22.5/.45)*(5.27+1.93),(7.6-8.5)/(.23+2.92),35.4*(62.4-49.9)-12.5*15.4,12.48/(1.23+1.17)-14.7/.49]);
numeric(33,[62/5-(16/7)/(40/21),(62/5-16/7)/(40/21)]);
const numbers34=[[2.4*10**-2,.0125*10**3],[(1.3*10**-2)**2,5.2*10**-5],[15.4*10**6,.044*10**7],[(3.5*10**-3)**2,(7*10**-4)**2]];
numbers34.forEach(([a,b],i)=>{const expect=[a+b,a-b,a*b,a/b];final(34,i).forEach((s,j)=>assert(Check.check(s,String(expect[j])).ok,`#34/${i}/${j}`));});
numeric(35,[7**5*(7**2)**4/7**11,11**(-4)*11**13/11**17,5**9/5**(-12)/5**20,10/(5**(-2))**13/25**14,(15**5/(3**3*5**4))/(12**5/(3**6*4**6)),(10**10/(2**8*5**9))/(17**6*8**3/34**7)]);
const gcd=(a,b)=>b?gcd(b,a%b):a;function rat(n,d){const g=gcd(n,d);return [n/g,d/g];}
const big36=[rat(27n**5n+27n**4n,9n**8n+9n**7n+9n**6n),rat(16n**7n+16n**6n,8n**10n+8n**9n+8n**8n),rat(4n**95n+4n**94n+4n**93n,21n*(16n**2n)**23n)];
big36.forEach(([n,d],i)=>assert(Check.check(final(36,i)[0],n+'/'+d).ok));
const ranges=[[1,3],[2,3],[5,6],[7,9],[19,11],[34,15]];ranges.forEach(([n,d],i)=>assert(Check.check(final(7,i)[0],D.periodic(n,d)).ok));
// Source comparisons checked by independent fractions/known decimal prefixes.
const expectedSigns={25:['<','<','>','=','<','<','<','=','>','<'],26:['>','<','>','>'],27:['>','>','>','<'],28:['=','>','=','<','>','='],29:['<','<'],32:['>','=','>','<']};
for(const [n,signs]of Object.entries(expectedSigns))signs.forEach((s,i)=>assert.deepEqual(final(n,i).at(-1).rule.answer,[s]));
const witness=final(1,0)[0];assert(Check.check(witness,'0.002;0.003;0.004;0.005;0.006;0.007;0.008;0.009;0.0091;0.0092').ok);assert(!Check.check(witness,'0.001;0.003;0.004;0.005;0.006;0.007;0.008;0.009;0.0091;0.0092').ok);
assert(Check.check(final(1,1)[0],'sqrt(5)/1000;pi/1000').ok);assert.equal(Check.check(final(4,0)[0],'sqrt(2)*sqrt(2);0').unsupported,true);assert(Check.check(final(4,0)[0],'-4;-100').ok);assert(Check.check(final(15,0)[0],'1/4;4/9;9/16;16/25;0').ok);assert(Check.check(final(15,1)[0],'1/2;3/4;2;3;5').ok);
assert(!Check.check(final(14,0)[0],'').ok);assert(Check.check(final(14,0)[0],'2,65').ok);assert(!Check.check(final(14,0)[0],'2,7').ok);
assert.equal(Check.number('-2^2').value,-4);assert.equal(Check.number('(-2)^2').value,4);assert.equal(Check.number('sqrt(4/9)').rational,true);assert.equal(Check.number('sqrt(2)').rational,false);assert(Check.close(Check.number('0,0(9)').value,.1));assert.equal(Check.number('2^(-3)').value,.125);assert.throws(()=>Check.number('alert(1)'));assert.throws(()=>Check.number('1/0'));
let state=State.blank();state.records['1:0']={seen:true,learn:true,check:false,independent:false};assert.deepEqual(State.validate(state),state);assert.throws(()=>State.validate({}));assert.throws(()=>State.validate({...state,records:{'100:0':state.records['1:0']}}));assert.throws(()=>State.validate({...state,sessions:{'1:0':{mode:'learn',index:999}}}));
console.log(`PASS M9 numbered: 36 exercises, 144 parts, ${steps} steps; source arithmetic with separate BigInt checks; open alternatives; strict endpoints; parser and progress validation.`);
