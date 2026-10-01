const assert=require('node:assert/strict'),D=require('../../ege-baza/work-rate/data.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);let count=0;
for(const k of D.kinds)for(let seed=0;seed<500;seed++){
 const t=D.make(k.id,seed),m=t.model,T=t.answer;assert(Number.isFinite(T)&&T>=0);assert(t.steps.every(s=>Number.isFinite(s.a)));assert(D.correct(String(T),T));assert(!D.correct('',T));assert(!D.correct('1/0',T));assert(!D.correct('NaN',T));assert(!D.correct(String(T+1),T));
 switch(k.id){
 case 'gardens':if(m.complete){near(T,Math.floor(m.hours/m.a)+Math.floor(m.hours/m.b));assert(T<=m.hours/m.a+m.hours/m.b);}else near(T,m.hours/m.a+m.hours/m.b);break;
 case 'share':near(T*m.a,1+seed%2);assert(T<1);break;
 case 'joint':near(T/m.a+T/m.b,1);assert(T<Math.min(m.a,m.b));break;
 case 'delay':near(T/m.a+(T-m.delay)/m.b,1);assert(T>m.delay&&T<m.a);break;
 case 'leave':near(T/m.a+m.leave/m.b,1);assert(T>m.leave);break;
 case 'reverse':near(1/m.solo+1/T,1/m.team);assert(T>m.team);break;
 case 'ratio':near(T/m.slow+T*m.times/m.slow,1);assert(T<m.slow/m.times);break;
 case 'crew':near(T*m.m,m.n*m.days);assert(T<m.days);break;
 case 'minimum':{const rate=m.pits/(m.n*m.hours);assert(Number.isInteger(T));assert(T*rate*m.deadline>=m.target-1e-8);assert((T-1)*rate*m.deadline<m.target-1e-8);break;}
 }count++;
}
assert.equal(D.make('joint',0).answer,4);assert.equal(D.make('reverse',0).answer,12);assert.equal(D.make('ratio',0).answer,2);assert.equal(D.parse('2,5'),2.5);assert.equal(D.parse(' 24 / 7 '),24/7);
console.log('WORK_RATE_MATH_PASS:',count,'generated tasks; independent work/time conservation; whole-worker minimality; valid numeric input.');
