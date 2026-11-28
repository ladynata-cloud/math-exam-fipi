'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const bank=require('../ege-profil/part-two/content-finance.js');
const state=require('../ege-profil/part-two/state.js');
const checker=require('../ege-profil/start/checks.js');

const expected=[
  [1034,189,317.8,12,3240,94],
  [1679.5,502.5,10,922.9,9,231],
  [816.48,954,170.5,1254,109.9,896]
];

test('all new written finance cases have separate IDs and complete solutions',()=>{
 assert.equal(bank.length,3);
 assert.deepEqual(bank.map(lesson=>lesson.tasks.length),[6,6,6]);
 const ids=new Set();
 for(const [family,lesson] of bank.entries())for(const [index,task] of lesson.tasks.entries()){
  assert(!ids.has(task.id));
  ids.add(task.id);
  assert.match(task.id,/^h12-/);
  assert.equal(lesson.exam,16);
  assert.match(task.prompt,/плат[её]ж/);
  assert.equal(task.steps.length,3);
  assert.equal(task.solution.length,4);
  assert.equal(task.proof.criteria.length,3);
  assert.equal(task.final[0].answers[0],expected[family][index]);
  assert(state.matches(task.final[0].answers,String(expected[family][index]).replace('.',','),checker));
 }
});

test('direct payout ledger independently verifies all 18 answer values',()=>{
 const schedule=(before, after, rates)=>before.map((balance,index)=>balance*(100+rates[index])-after[index]*100);
 const sum=series=>series.reduce((a,b)=>a+b,0);
 const cases=[
  {before:[880,660,440,220],after:[660,440,220,0],rates:[7,7,7,7],ask:'payment'},
  {before:[1050,840,630,420,210],after:[840,630,420,210,0],rates:[6,6,6,6,6],ask:'interest'},
  {before:[280,140],after:[140,0],rates:[9,9],ask:'payment'},
  {before:[310,155],after:[155,0],sumCents:36580,ask:'rate'},
  {before:[11,10,9,8,7,6],after:[10,9,8,7,6,5],rates:[2,2,2,2,2,2],sumCents:126360,shares:18,ask:'principal'},
  {before:[940,705,470,235],after:[705,470,235,0],rates:[4,4,4,4],ask:'interest'},
  {before:[1340,1100,860,620,465,310,155],after:[1100,860,620,465,310,155,0],rates:[7,7,7,7,7,7,7],ask:'payment'},
  {before:[725,550,440],after:[550,440,330],rates:[8,5,5],ask:'payment'},
  {before:[1080,880,680,480,360,240,120],after:[880,680,480,360,240,120,0],sumCents:146400,ask:'rate'},
  {before:[990,690,460],after:[690,460,230],rates:[6,9,9],ask:'payment'},
  {before:[1170,910,650,520,390,260],after:[910,650,520,390,260,130],sumCents:139100,ask:'rate'},
  {before:[750,600,450,300],after:[600,450,300,150],rates:[11,11,11,11],ask:'interest'}
 ];
 for(const [index,c] of cases.entries()){
  const principalCents=100*(c.before[0]-c.after.at(-1));
  const value=c.ask==='principal'?c.shares*c.sumCents/sum(schedule(c.before,c.after,c.rates)):
   c.ask==='rate'?(c.sumCents-principalCents)/sum(c.before):
   (sum(schedule(c.before,c.after,c.rates))-(c.ask==='interest'?principalCents:0))/100;
  assert.equal(value,expected.flat()[index],'calendar task '+(index+1));
 }
 for(const [index,[start,yearOne,rate,ask]] of [
  [1456,756,8,'payment'],[1854,954,6,'balance'],[2255,1155,5,'interest'],
  [1254,654,9,'principal'],[1035,535,7,'interest'],[1696,896,12,'balance']
 ].entries()){
  const p1=start*(100+rate)-100*yearOne,p2=yearOne*(100+rate);
  assert.equal(p1,p2);
  const value=({payment:p1/100,balance:yearOne,interest:(p1+p2-start*100)/100,principal:start})[ask];
  assert.equal(value,expected[2][index],'equal payment task '+(index+1));
 }
});

test('inverse calendar exercise teaches the month count, then the payment coefficient',()=>{
 const task=bank[0].tasks[4];
 assert.equal(task.id,'h12-monthly-balance-5');
 assert.match(task.prompt,/октябрь 2028 года/);
 assert.match(task.prompt,/С мая по октябрь 2029 года включительно.*1263,6/);
 assert.match(task.prompt,/Какую сумму он взял в кредит/);
 assert.deepEqual(task.steps.map(step=>step.answers),[[11],[7.02],[3240]]);
 assert.match(task.solution.join(' '),/11d, 10d, 9d, 8d, 7d, 6d/);
 assert.match(task.solution.join(' '),/7,02d = 1263,6/);
});
