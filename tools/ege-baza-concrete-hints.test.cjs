'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={};
context.globalThis=context;
vm.createContext(context);
for(const file of ['data','practice','equation-practice','task-hints']){
 const filename=path.join(__dirname,'../ege-baza/path',file+'.js');
 vm.runInContext(fs.readFileSync(filename,'utf8'),context,{filename});
}
const D=context.PathData,H=context.PathTaskHints;
const ids=Array.from(D.meta,m=>m.id);
assert.equal(ids.length,111,'the existing EGE catalogue remains 111 families');
assert.deepEqual(Array.from(H.familyIds).sort(),ids.slice().sort(),'every existing family has authored hints');

function freeze(value){
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  Object.freeze(value);
  for(const child of Object.values(value))freeze(child);
 }
 return value;
}
function withoutAnswers(task){
 const copy=JSON.parse(JSON.stringify(task));
 // A hint must still work when the learner has no access to the solution.
 for(const key of ['answer','a','solutions'])delete copy[key];
 if(copy.model)delete copy.model.root;
 for(const step of copy.steps)for(const key of ['answer','a','why','solutions'])delete step[key];
 return freeze(copy);
}
let checked=0,longest=0;
for(const id of ids){
 for(let seed=0;seed<240;seed++){
  const task=freeze(D.task(id,seed));
  const before=JSON.stringify(task),blind=withoutAnswers(task);
  for(let index=0;index<task.steps.length;index++){
   const value=H.hint(task,index),label=`${id}, seed ${seed}, step ${index}`;
   assert.equal(typeof value,'string',label);
   assert.ok(value.trim().length>0,label+' has actionable text');
   assert.ok(value.length<=220,label+' stays short');
   assert.doesNotMatch(value,/undefined|NaN|\bk\b/,label+' has no missing value or generator symbol');
   assert.notEqual(value,task.steps[index].q,label+' adds guidance instead of repeating the question');
   assert.equal(H.hint(blind,index),value,label+' does not depend on an answer or worked explanation');
   longest=Math.max(longest,value.length);
   checked++;
  }
  assert.equal(JSON.stringify(task),before,'hint does not mutate the task or progress: '+id);
 }
}

const notebooks=D.task('round',3),notebookHint=H.hint(notebooks);
assert.match(notebooks.q,/49 тетрадей.*9 тетрадей/);
assert.match(notebookHint,/Раздели 49 на 9 с остатком/);
assert.match(notebookHint,/купить/);
assert.doesNotMatch(notebookHint,/\b6\b|заполн|\bk\b/,'do not reveal six packs or talk about filling packs');
assert.notEqual(H.hint(notebooks,1),notebookHint,'the hint advances with the active step');
const changedGiven={...notebooks,q:notebooks.q.replace('49 тетрадей','67 тетрадей')};
assert.match(H.hint(changedGiven),/Раздели 67 на 9/,'use visible operands rather than the hidden seed');
assert.equal(H.hint({...notebooks,seed:999,model:{kind:'round',k:999}}),notebookHint,'hidden generator values do not change the hint');

// The opening task asks for affordability, but its first scaffold question asks
// for the COST of a stated number of tickets: that step needs multiplication.
// Its chosen count is also the final answer, so do not copy it into a hint that
// the learner can open before expanding the scaffold.
for(let seed=0;seed<240;seed++){
 const tickets=D.task('practice-afford',seed);
 const first=H.hint(tickets,0);
 assert.match(first,/Умножь выбранное число билетов/);
 assert.match(first,new RegExp('цену '+tickets.params.price+' рублей'));
 assert.match(first,/стоимость покупки/,'the result of this step is a cost, not a ticket count');
 assert.deepEqual(first.match(/\d+/g),[String(tickets.params.price)],'only the given price may appear; the answer count remains hidden');
 assert.doesNotMatch(first,/Раздели|частн/i,'the cost step must not suggest budget division');
 assert.match(H.hint(tickets,1),/Из бюджета вычти стоимость/,'the remainder step subtracts the cost');
 assert.match(H.hint(tickets,2),/целую часть частного/,'only the final affordability step selects whole tickets');
 const changedStep={...tickets,steps:[{...tickets.steps[0],q:'Сколько стоят 2 билетов?'},...tickets.steps.slice(1)]};
 assert.equal(H.hint(changedStep),first,'do not expose a selected answer count from a still-collapsed step');
}

// Opposite operations must follow the visible variant, not the seed or a stored answer.
for(let seed=0;seed<12;seed++){
 const price=D.task('practice-percent-change',seed),ring=D.task('practice-ring-meeting',seed);
 assert.match(H.hint(price,1),price.params.up?/Прибавь/:/Вычти/);
 assert.match(H.hint(ring),ring.params.same?/вычти/:/сложи/);
 const quadratic=D.task('practice-quadratic',seed);
 assert.match(H.hint(quadratic,0),/меньший/,'the first quadratic step asks for the smaller root');
 assert.match(H.hint(quadratic,1),/больший/,'the final quadratic step selects the larger root required by the task');
 const logarithm=D.task('practice-log-value',seed);
 assert.match(H.hint(logarithm),new RegExp('возводи '+logarithm.params.a+' в степени'));
 assert.match(H.hint(logarithm),new RegExp('получишь '+logarithm.params.b));
 assert.doesNotMatch(H.hint(logarithm),/ответ\s*[:=]|равен\s*\d/i,'one-step logarithm gets a method, not its exponent');
 const body=D.task('roundbody',seed);
 assert.match(H.hint(body,1),body.model.body==='sphere'?/4r³\/3/:body.model.body==='cone'?/r²h\/3/:/r²h/);
}
const unknown={id:'another-curriculum',steps:[{q:'Как найти неизвестную сторону?'}]};
assert.equal(H.hint(unknown),'Как найти неизвестную сторону?','unregistered curricula retain their own question');
assert.equal(H.hint(notebooks,-1),notebookHint);
assert.equal(H.hint(notebooks,NaN),notebookHint);
assert.equal(H.hint(notebooks,100),H.hint(notebooks,notebooks.steps.length-1));
assert.equal(typeof H.hint(null),'string');
console.log(`Concrete EGE hints: ${ids.length} families, ${checked} step variants, max ${longest} characters; no answer dependencies or task mutations.`);
