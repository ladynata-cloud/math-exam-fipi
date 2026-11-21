'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js');
const tasks=require('./exercises-733-742.json');
const task=id=>tasks.find(t=>t.id==='p33-source-'+id);
for(const [id,correct,incorrect] of [
 ['734-a-regular',['1+1/p','(p^2+p)/p^2'],['(p^2-1)/(p*(p-1))','p+1','1/(p+1)']],
 ['735-regular',['(a-3)(a+3)','(a^2-9)*(a-2)/(a-2)'],['(a^2-9)*(a+2)/(a+2)','a-9']],
 ['736-below',['1;(2-b)/2','1;(2-b)^2/(2*(2-b))','1;(2-b)*(b-7)/(2*(b-7))'],['(2-b)/2;1','1;2-b','1;(2-b)*(b+1)/(2*(b+1))']],
 ['737-a',['4*a;a','a;2a+2a'],['a;a','4a']],
 ['737-b',['3a;a/3'],['a/3;a/3']],
 ['740-regular',['-(a+1)/(a-1);-1','-1;(a^2-1)/(-(a-1)^2)'],['-1;1','-1;(a+1)/(a-1)']],
 ['741',['3+2k;2*(k-1)'],['2k;2k+3']]]){
 const q=task(id);
 for(const v of correct)assert(C.check(v,q),id+' accepts '+v);
 for(const v of incorrect)assert(!C.check(v,q),id+' rejects '+v);
}
for(const s of ['0','-24','24','-1/8','0,375'])assert.notEqual(G.parameterSample(s),null);
for(const s of ['1/3','25','aaa','','Infinity'])assert.equal(G.parameterSample(s),null);
const counts=[['733-special','-2','all'],['734-a-special','0','0'],['736-below','1','2'],['736-equal','2','1'],['736-above','3','0'],['738-c','0','1'],['738-c','9','1'],['738-d','-1/8','1'],['738-d','-1/4','0'],['740-linear','1','1'],['740-regular','2','2']];
for(const [id,sample,count] of counts)assert.equal(G.parameterExample(task(id).graph,sample).count,count,id);
for(let seed=1;seed<=60;seed++)for(let level=1;level<=3;level++){
 const q=M.practiceParameter(seed,level);assert(C.check(q.answer,q));
 const correct=q.answer.split(';').map(Number);
 for(let t=-24;t<=24;t++){
  const model=G.parameterExample(q.graph,String(t));
  assert.equal(level===1?model.count==='all':model.count==='1',correct.includes(t));
 }
 for(const s of q.steps)assert(C.check(s.answer,s));
}
console.log('PASS exact symbolic families, genuine excluded parameters, multiple/every/no solutions and 180 fresh problems');
