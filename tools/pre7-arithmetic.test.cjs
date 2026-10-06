'use strict';
const assert=require('node:assert/strict');
const D=require('../ege-baza/path/data.js');
require('../ege-baza/path/practice.js');
require('../ege-baza/path/equation-practice.js');
require('../ege-baza/path/grade7-foundations.js');
const oldSeeds=[0,1,119,120,239,240,359,-1,100003];
const oldTasks=D.meta.map(m=>({id:m.id,tasks:oldSeeds.map(seed=>JSON.stringify(D.task(m.id,seed)))}));
require('../ege-baza/path/pre7-arithmetic.js');
let testedSteps=0,yes=0,no=0,zeroDigits=0,closeEquals=0,ambiguousPairs=0;
const roles=new Set(),digit=n=>Number(String(n).at(-1)),digitSum=n=>[...String(n)].reduce((s,c)=>s+Number(c),0);
function numeric(step,expected){
 assert.equal(Number(step.a),expected,step.q);
 assert(D.correct(step,String(expected)),step.q);
 assert(!D.correct(step,String(expected+1)),step.q+' rejects adjacent wrong answer');
}
function label(step,expected){
 assert(Array.isArray(step.choices)&&step.choices.length>=2,step.q);
 const selected=step.choices.find(c=>String(c.value)===String(step.a));assert(selected,step.q);
 assert.equal(selected.label,expected,step.q);
 assert.equal(new Set(step.choices.map(c=>c.label)).size,step.choices.length,'No duplicate/ambiguous labels');
 for(const c of step.choices)assert.equal(D.correct(step,c.value),c===selected,step.q);
 return Number(selected.value);
}
function sequence(steps,answers){assert.equal(steps.length,answers.length);steps.forEach((s,i)=>typeof answers[i]==='string'?label(s,answers[i]):numeric(s,answers[i]));}
function oracle(t){
 const p=t.params,s=t.steps,m=p.mode;
 switch(t.id){
  case 'pre7-place-value':{
   if(m===0){const digits=[...String(p.value)].map(Number),weight=10**(3-p.position),answer=digits[p.position]*weight;sequence(s,[weight,digits[p.position],answer]);if(answer===0)zeroDigits++;return answer;}
   if(m===1){const answer=p.thousands*1000+p.hundreds*100+p.units;sequence(s,[p.thousands*1000,p.hundreds*100,0,answer]);assert.equal(Math.floor(answer/10)%10,0);return answer;}
   const answer=p.center+(p.previousWanted?-1:1);sequence(s,[1,p.center-1,p.center+1,answer]);assert.equal(p.center%100,0);return answer;
  }
  case 'pre7-natural-compare':{
   const a=String(p.left),b=String(p.right),symbol=p.left<p.right?'<':p.left>p.right?'>':'=';
   numeric(s[0],a.length);numeric(s[1],b.length);let i=2;
   if(a.length===b.length)numeric(s[i++],[...a].findIndex((x,j)=>x!==b[j])+1);
   assert.equal(s.length,i+1);if(symbol==='=')closeEquals++;
   return label(s[i],`${p.left} ${symbol} ${p.right}`);
  }
  case 'pre7-add-carry':{
   // Independent school column algorithm uses the actual displayed operands.
   const [left,right]=t.q.match(/(\d+) \+ (\d+)/).slice(1).map(Number);
   assert.equal(left,p.left);assert.equal(right,p.right);
   const units=digit(left)+digit(right),carry1=units>=10?1:0,tens=digit(Math.floor(left/10))+digit(Math.floor(right/10))+carry1,carry2=tens>=10?1:0,hundreds=Math.floor(left/100)+Math.floor(right/100)+carry2;
   sequence(s,[units,carry1,units%10,tens,carry2,hundreds,left+right]);
   assert.equal(carry1,1);if(m===0)assert.equal(carry2,0);if(m===1)assert.equal(carry2,1);if(m===2)assert(left+right>=1000);
   assert.equal(hundreds*100+(tens%10)*10+units%10,left+right);return left+right;
  }
  case 'pre7-subtract-borrow':{
   const [left,right]=t.q.match(/(\d+) − (\d+)/).slice(1).map(Number),u=digit(left),ru=digit(right),tens=digit(Math.floor(left/10)),rt=digit(Math.floor(right/10)),h=Math.floor(left/100);
   assert(left>right&&u<ru);
   if(m===0)sequence(s,[u+10,tens-1,u+10-ru,tens-1-rt,left-right]);
   else if(m===1){assert.equal(tens,0);sequence(s,[h-1,10,9,u+10,9-rt,left-right]);}
   else{assert.equal(Math.floor(left/10)%100,0);sequence(s,[Math.floor(left/1000)-1,9,9,u+10,9-Math.floor(right/100),left-right]);}
   assert.equal(Number(s.at(-1).a)+right,left);return left-right;
  }
  case 'pre7-smart-calculation':{
   if(m===0){const [a,b,c]=t.q.match(/(\d+) \+ (\d+) \+ (\d+)/).slice(1).map(Number);assert.equal(a+c,100);if(s[0].choices){label(s[0],`${a} и ${c}`);numeric(s[1],a+c);numeric(s[2],a+b+c);assert.notEqual(a+b,100);assert.notEqual(b+c,100);}else{assert(a+b===100||b+c===100);sequence(s,[a+c,a+b+c]);ambiguousPairs++;}return a+b+c;}
   if(m===1){const [a,b]=t.q.match(/(\d+) \+ (\d+)/).slice(1).map(Number);sequence(s,[a+1,b-1,a+b]);assert.equal((a+1)+(b-1),a+b);return a+b;}
   const [factor,value]=t.q.match(/(\d+) · (\d+)/).slice(1).map(Number),round=Math.round(value/10)*10;sequence(s,[factor*round,factor,factor*value]);assert.equal(Math.abs(value-round),1);return factor*value;
  }
  case 'pre7-inverse-components':{
   // Solve the textual equation, independent of the generator's saved root.
   const raw=t.q.match(/Найди x: (.+)\./)[1],parts=raw.match(/^(x|\d+) ([+−·:]) (x|\d+) = (\d+)$/);assert(parts,raw);
   const [,left,op,right,rhsText]=parts,rhs=Number(rhsText),leftUnknown=left==='x',known=Number(leftUnknown?right:left);let answer,role,check;
   if(op==='+'){answer=rhs-known;role='Слагаемое';sequence(s,[role,rhs,answer,rhs]);}
   else if(op==='·'){answer=rhs/known;role='Множитель';sequence(s,[role,rhs,answer,rhs]);}
   else if(op==='−'&&leftUnknown){answer=rhs+known;role='Уменьшаемое';sequence(s,[role,'Сложить разность и вычитаемое',answer,rhs]);}
   else if(op==='−'){answer=known-rhs;role='Вычитаемое';sequence(s,[role,known,answer,rhs]);}
   else if(leftUnknown){answer=known*rhs;role='Делимое';sequence(s,[role,rhs,answer,rhs]);}
   else{answer=known/rhs;role='Делитель';sequence(s,[role,known,answer,rhs]);}
   const a=leftUnknown?answer:Number(left),b=leftUnknown?Number(right):answer;
   check=op==='+'?a+b:op==='−'?a-b:op==='·'?a*b:a/b;assert.equal(check,rhs);roles.add(role);return answer;
  }
  case 'pre7-divisibility':{
   if(m===2){const candidates=Array.from({length:10},(_,i)=>i).filter(d=>(10*p.prefix+d)%9===0),answer=Math.min(...candidates);sequence(s,[digitSum(p.prefix),answer,10*p.prefix+answer,answer]);if(answer===0)zeroDigits++;assert(candidates.every(d=>d>=answer));return answer;}
   const exact=p.value%p.divisor===0,word=exact?'Да, делится без остатка':'Нет, остаётся ненулевой остаток';if(exact)yes++;else no++;
   if(m===0)numeric(s[0],digit(p.value));else{numeric(s[0],digitSum(p.value));numeric(s[1],digitSum(p.value)%p.divisor);assert.equal(p.value%p.divisor,digitSum(p.value)%p.divisor);}
   return label(s.at(-1),word);
  }
  case 'pre7-scale-reading':{
   if(m===0){const answer=(p.end-p.start)/p.intervals;sequence(s,[p.end-p.start,p.intervals,answer]);return answer;}
   const point=t.model.diagram.points.find(pt=>pt.id==='point').value,shift=point-p.start;
   assert.equal(shift,p.index*p.step);assert.equal((p.end-p.start)/p.intervals,p.step);
   if(m===1){sequence(s,[shift,p.start,point]);assert.equal(t.model.diagram.points.find(pt=>pt.id==='point').label,'A');return point;}
   sequence(s,[p.start,point,shift]);assert(p.start!==0);return shift;
  }
  case 'pre7-comparison-stories':{
   assert(p.larger>p.smaller&&p.smaller>0);
   if(m===0){sequence(s,['Вычитание',p.larger,p.larger-p.smaller]);return p.larger-p.smaller;}
   if(m===1){sequence(s,['Деление',p.smaller,p.larger/p.smaller]);const bars=t.model.diagram.bars;assert.equal(bars[0].value/bars[1].value,p.larger/p.smaller);return p.larger/p.smaller;}
   const answer=p.wantedLarger?p.larger:p.smaller;sequence(s,['У Оли',p.wantedLarger?'Прибавить разницу к меньшему':'Вычесть разницу из большего',answer]);assert.equal(p.larger-p.smaller,p.delta);assert(t.model.diagram.description.includes('не задают численный масштаб'));assert(t.model.diagram.bars.some(b=>b.label.endsWith('?')));return answer;
  }
  default:throw Error('Missing independent oracle '+t.id);
 }
}
assert.equal(D.pre7Arithmetic.families.length,9);assert.equal(D.pre7Arithmetic.count,360);
assert.equal(new Set(D.meta.map(m=>m.id)).size,D.meta.length);
let tasks=0;
for(const family of D.pre7Arithmetic.families){
 const meta=D.meta.find(m=>m.id===family.id),unique=[new Set(),new Set(),new Set()];
 for(const flag of ['grade7','pre7','trainingOnly','expanded'])assert.equal(meta[flag],true,family.id);assert.equal(meta.pos,null);assert.equal(meta.subject,'foundation');assert(meta.idea&&meta.gap);
 for(let seed=0;seed<360;seed++){
  const t=D.task(family.id,seed),expected=oracle(t);unique[t.params.mode].add(t.q);
  assert.equal(t.params.mode,Math.floor(seed/120));assert(Number.isSafeInteger(expected));assert.equal(Number(t.a),expected);if(t.steps.at(-1).choices&&String(t.steps.at(-1).a)===String(t.a)){assert.deepEqual(t.choices,t.steps.at(-1).choices,'Standalone stage retains labelled choices');label(t,t.steps.at(-1).choices.find(c=>c.value===t.a).label);}assert.equal(Number(t.answerExact),expected);assert.equal(t.answer,expected);assert.equal(t.pos,null);assert(t.pre7&&t.grade7&&t.trainingOnly);
  assert(D.correct(t,String(expected)));assert(D.correct(t,D.answerText(t)));assert(!D.correct(t,String(expected+1)));for(const bad of ['', 'abc','1/0','NaN'])assert(!D.correct(t,bad));
  for(const s of t.steps){assert(s.q&&s.why&&s.strict);assert(D.correct(s,D.answerText(s)));assert(!D.correct(s,String(Number(s.a)+1)));for(const bad of ['', 'abc','1/0'])assert(!D.correct(s,bad));testedSteps++;}
  assert.equal(t.model.kind,'pre7-lab');assert(t.model.elements.length>=2);assert(t.model.diagram.description.length>10);
  assert.deepEqual(D.task(family.id,seed),t);assert.equal(D.task(family.id,seed+360).q,t.q);assert.equal(D.task(family.id,seed-360).q,t.q);tasks++;
 }
 unique.forEach((set,mode)=>assert.equal(set.size,120,`${family.id} mode ${mode} unique conditions`));
 for(const badSeed of [NaN,Infinity,-Infinity,'not-a-number'])assert.equal(D.task(family.id,badSeed).q,D.task(family.id,0).q);
 assert.equal(D.task(family.id,1.9).q,D.task(family.id,1).q);assert.equal(D.task(family.id,-1.9).q,D.task(family.id,359).q);
}
assert.deepEqual([...roles].sort(),['Слагаемое','Множитель','Уменьшаемое','Вычитаемое','Делимое','Делитель'].sort());assert(yes>0&&no>0&&zeroDigits>0&&closeEquals>0&&ambiguousPairs>0);
for(const old of oldTasks)assert.deepEqual(oldSeeds.map(seed=>JSON.stringify(D.task(old.id,seed))),old.tasks,old.id+' unchanged');
console.log(`PRE7_ARITHMETIC_OK: ${tasks} tasks, ${testedSteps} independently checked steps, 27 structural modes, all six inverse components, zero/equality/carry/borrow boundaries, wrong inputs rejected, ${oldTasks.length*oldSeeds.length} legacy tasks unchanged`);
