'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const reviews=require('../ege-profil/part-two/parameter-proof.js');
const bank=['algebra','geometry','models'].flatMap(name=>require('../ege-profil/part-two/content-'+name+'.js'));
const levels=Array.from({length:65},(_,i)=>(i-32)/4);
const roots=(A,B,C)=>{
 const D=B*B-4*A*C;
 if(D<0)return [];
 if(D===0)return [-B/(2*A)];
 return [(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)];
};

test('six method reviews preserve the authored criterion ordering and skill links',()=>{
 const families=bank.filter(l=>l.exam===19).map(l=>l.tasks[0].meta.family);
 assert.deepEqual(Object.keys(reviews).sort(),families.sort());
 require('../ege-profil/azbuka-metodov/catalog.js');
 const catalog=globalThis.ProfileAlphabetCatalog;
 for(const lesson of bank.filter(l=>l.exam===19))for(const task of lesson.tasks){
  const review=reviews[task.meta.family];
  assert.equal(review.criteria.length,task.proof.criteria.length,task.id);
  assert(catalog.index['parameter-methods'].skills[review.skill]);
  for(const criterion of review.criteria)assert(criterion.length===3&&criterion.every(value=>typeof value==='string'&&value.trim()));
  assert(review.example.task&&review.example.incomplete&&review.example.revised);
 }
});

test('linear and removed-point examples retain the singular parameter as well as the positivity boundary',()=>{
 assert.equal(reviews.linear.example.task,'(a − 1)x = a² − 1. Когда есть ровно один положительный корень?');
 assert.match(reviews.linear.example.revised,/\(−1; 1\) ∪ \(1; \+∞\)/);
 assert.equal(reviews.hole.example.task,'(x² − 1)/(x − 1) = a. Когда есть ровно один положительный корень?');
 assert.match(reviews.hole.example.revised,/\(1; 2\) ∪ \(2; \+∞\)/);
 for(const a of levels){
  const exactlyOneLinear=a===1?false:(a*a-1)/(a-1)>0;
  assert.equal(exactlyOneLinear,a>-1&&a!==1,'linear a='+a);
  const x=a-1,exactlyOneHole=x>0&&x!==1;
  assert.equal(exactlyOneHole,a>1&&a!==2,'hole a='+a);
  if(exactlyOneHole)assert(Math.abs((x*x-1)/(x-1)-a)<1e-12);
 }
});

test('positive-root and plateau examples distinguish strict boundaries from double roots or a whole segment',()=>{
 assert.equal(reviews['positive-roots'].example.task,'x² − 2ax + a = 0. Когда есть два различных положительных корня?');
 assert.match(reviews['positive-roots'].example.revised,/a > 1/);
 assert.equal(reviews.modules.example.task,'|x − 1| + |x + 1| = a. Когда есть ровно два решения?');
 assert.match(reviews.modules.example.revised,/весь отрезок \[−1; 1\]/);
 for(const a of levels){
  const positive=roots(1,-2*a,a).filter(x=>x>0);
  assert.equal(positive.length===2,a>1,'positive roots a='+a);
  if(a>2){
   for(const x of [-a/2,a/2])assert.equal(Math.abs(x-1)+Math.abs(x+1),a);
  }else if(a===2){
   for(const x of [-1,-.75,0,.5,1])assert.equal(Math.abs(x-1)+Math.abs(x+1),a);
  }
 }
});

test('tangent and absolute-value system examples count distinct points, retaining both signs and attainability',()=>{
 assert.equal(reviews.tangent.example.task,'x² + y² = 2, x + y = a. Когда система имеет ровно одно решение?');
 assert.match(reviews.tangent.example.revised,/a = 2 и a = −2/);
 assert.equal(reviews.system.example.task,'x² + y² = 4, y = |x| + a. Когда есть три решения и каков максимум?');
 assert.match(reviews.system.example.revised,/a = −12\/5/);
 const pointCount=a=>roots(2,2*a,a*a-4).reduce((count,t)=>count+(t>0?2:t===0?1:0),0);
 for(const a of [...levels,-12/5]){
  assert.equal(roots(2,-2*a,a*a-2).length===1,Math.abs(a)===2,'circle and line a='+a);
  assert.equal(pointCount(a)===3,a===-2,'absolute-value system a='+a);
  assert(pointCount(a)<=4);
 }
 assert.equal(pointCount(2),1);
 assert.equal(pointCount(-12/5),4);
});
