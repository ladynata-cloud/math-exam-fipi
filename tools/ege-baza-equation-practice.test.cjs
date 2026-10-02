'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');require('../ege-baza/path/practice.js');
const prior=D.meta.map(m=>({id:m.id,tasks:[0,1,10,23,99].map(s=>JSON.stringify(D.task(m.id,s)))}));
require('../ege-baza/path/equation-practice.js');
function value(side,x){const s=side.replace(/\s/g,'').replace(/−/g,'-');const bracket=s.match(/^(\d+)\(x([+-]\d+)?\)$/);if(bracket)return +bracket[1]*(x+Number(bracket[2]||0));const m=s.match(/^(-?\d*)x([+-]\d+)?$/);assert(m,side);return (m[1]===''?1:m[1]==='-'?-1:Number(m[1]))*x+Number(m[2]||0);}
let total=0;
for(const family of D.equationPractice.families){const unique=new Set();let negative=false,fraction=false;
 for(let seed=0;seed<240;seed++){
  const t=D.task(family.id,seed),sides=t.q.replace('. Найди x.','').split(' = ');unique.add(t.q);assert.equal(sides.length,2);
  const constant=value(sides[1],0)-value(sides[0],0),coefficient=(value(sides[0],1)-value(sides[0],0))-(value(sides[1],1)-value(sides[1],0)),x=constant/coefficient;
  assert.notEqual(coefficient,0);assert(Math.abs(value(sides[0],x)-value(sides[1],x))<1e-9);assert(D.correct(t,String(x)));assert(!D.correct(t,String(x+.01)));assert(!D.correct(t,'1/0'));
  assert(D.correct(t,`${constant}/${coefficient}`));
  const last=t.steps.slice(-3);assert.equal(last[0].a,coefficient);assert.equal(last[1].a,constant);assert(Math.abs(D.parse(last[2].a)-x)<1e-9);
  if(t.params.bracket!==null)assert.equal(t.steps[0].a,value(sides[0],0));
  for(const step of t.steps)assert(D.correct(step,String(step.a)));
  for(const side of ['left','right']){const evaluated=t.model[side].reduce((n,[v,p])=>n+v*(p?x:1),0);assert(Math.abs(evaluated-value(sides[side==='left'?0:1],x))<1e-9);}
  assert.equal(D.task(family.id,seed+240).q,t.q);negative ||= x<0;fraction ||= !Number.isInteger(x);total++;
 }
 assert.equal(unique.size,240,family.id+' unique conditions');
 if(family.id==='equations-signs')assert(negative);if(family.id==='equations-fractions')assert(fraction);
}
for(const m of prior)assert.deepEqual([0,1,10,23,99].map(s=>JSON.stringify(D.task(m.id,s))),m.tasks,m.id+' legacy preservation');
console.log('EGE_BAZA_EQUATION_PRACTICE_OK: '+total+' distinct conditions, independent substitution and step checks, models, strict fractions, periodicity, 515 legacy tasks unchanged');
