'use strict';
const assert=require('node:assert/strict'),G=require('./task-graphs.js'),C=require('./check.js'),P=require('./models.js'),rows=require('./exercises-1119-1125.json');
assert.equal(rows.length,20);for(const q of rows){assert.equal(q.source.page,251);assert(C.check(q.answer,q),q.id);for(const s of q.steps)assert(C.check(s.answer,s));}
const store=id=>rows.find(q=>q.id===id);
assert(C.check('4;2',store('p44-source-1119-figure')));assert(!C.check('2;3',store('p44-source-1119-figure')));
assert(C.check('2≤x≤4',store('p44-source-1120-closed')));
let trials=0;
for(const q of rows.filter(q=>q.kind==='line-placement')){
 for(let k=-3;k<=3;k++)for(let b=-3;b<=3;b++){const g=q.graph,choice=k+'/2;'+b+'/3';assert.equal(C.check(choice,q),Math.sign(k)===g.slopeSign&&Math.sign(b)===g.offsetSign);trials++;}
}
for(const q of rows.filter(q=>q.graph.mode==='quadrants')){
 const g=q.graph,observed=new Set(),k=g.slopeSign;
 for(let t=-100;t<=100;t++){const x=t/2,y=k*x+g.b;if(x&&y)observed.add(x>0?(y>0?1:4):(y>0?2:3));}
 assert.deepEqual([...observed].sort(),q.answer.split(';').map(Number).sort());
}
for(const q of rows.filter(q=>q.graph.mode==='opposites')){
 for(let d=1;d<=9;d++)for(let n=1;n<=95;n++){const x=n/d,l=G.oppositeReading(q.graph,x),r=G.oppositeReading(q.graph,-x);assert.equal(l<r?'<':l>r?'>':'=',q.answer);trials++;}
}
const factors=rows.filter(q=>q.factorizedAnswer);
for(const [i,valid,invalid] of [[0,'-x*(x-2)*(x+2)','x*(4-x^2)'],[1,'(a+13)*a*a*(a-13)','a^2*(a^2-169)'],[2,'(c-4)*c*(c-4)','c*(c^2-8c+16)']]){
 assert(C.check(valid,factors[i]),valid);assert(!C.check(invalid,factors[i]),invalid);
}
for(const q of rows.filter(q=>q.graph.mode==='quadratic')){
 const g=q.graph,y=x=>g.a[0]/g.a[1]*x*x+g.k[0]/g.k[1]*x+g.b;
 const values=q.answer==='нет'?[]:q.answer.split(';').map(v=>v==='√5'?Math.sqrt(5):v==='-√5'?-Math.sqrt(5):v.includes('/')?Number(v.split('/')[0])/Number(v.split('/')[1]):Number(v));
 for(const x of values)assert(Math.abs(y(x))<1e-10);
 const D=(g.k[0]/g.k[1])**2-4*(g.a[0]/g.a[1])*g.b;assert.equal(values.length,D<0?0:D===0?1:2);
}
for(let seed=0;seed<80;seed++)for(const s of P.placementSkills){const q=P.practicePlacement(s.id,seed,1+seed%3);assert(C.check(q.answer,q));}
console.log('PASS '+trials+' slope/intercept choices, quadrants, quadratic roots, exact factors, opposite inputs and source-reading checks.');
