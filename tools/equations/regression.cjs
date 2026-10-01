'use strict';
const assert=require('assert/strict'),C=require('../../equations/data.js'),M=require('../../equations/algebra.js');
const value=(b,x,side)=>M.add(M.mul(b[side+'A'],M.from(String(x))),b[side+'B']);
let checked=0;
for(const lesson of C.lessons)for(let seed=1;seed<=100;seed+=7){
 const task=C.generate(lesson.id,seed);if(!task.balance||!Array.isArray(task.roots))continue;
 let b=M.fromBalance(task.balance);
 for(const [operation,n]of [['constant','0.2'],['variable','-0.5'],['multiply','-0.5'],['divide','1000'],['divide','1000'],['divide','1000']]){
  b=M.transform(b,operation,n);for(const x of task.roots)assert.equal(M.add(value(b,x,'l'),M.neg(value(b,x,'r'))).n,0n);checked++;
 }
 b=M.transform(b,'variable',M.neg(b.rA));assert.equal(b.rA.n,0n);
 b=M.transform(b,'constant',M.neg(b.lB));assert.equal(b.lB.n,0n);
}
let exact=M.fromBalance(C.generate('linear',1).balance);
for(let i=0;i<3;i++)exact=M.transform(exact,'divide','1000');
assert.equal(M.fmt(exact.lA),'1/500000000');
assert.equal(M.fmt(M.fromBalance(C.generate('divide',3).balance).lA),'1/3');
for(const operation of ['divide','multiply'])assert.throws(()=>M.transform(exact,operation,'0'),/ноль/);
for(let seed=1;seed<=300;seed++){
 const task=C.generate('rational',seed),banned=task.domain[0];
 assert.equal(C.equal(String(banned),task.roots),false,'A forbidden candidate cannot be accepted');
 assert.equal(C.equal('1/0',task.roots),false);
}
console.log('EQUATIONS_REGRESSION_PASS',checked,'exact transformations, rational-domain rejection, zero-operation guards');
