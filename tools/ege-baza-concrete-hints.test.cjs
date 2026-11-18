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
assert.equal(ids.length,113,'the EGE catalogue contains 113 families');
assert.deepEqual(Array.from(H.familyIds).sort(),ids.slice().sort(),'every existing family has authored hints');

const remediationFile=path.join(__dirname,'../ege-baza/remediation.js');
vm.runInContext(fs.readFileSync(remediationFile,'utf8'),context,{filename:remediationFile});
const R=context.EgeRemediation;
// Exam-family routing must not swallow a concrete input error. These cases
// used to work only for non-exam lessons, breaking the learner's return path.
for(const id of ['fractions','equations','practice-decimals','practice-percent-change']){
 const task=D.task(id,10),meta=D.meta.find(row=>row.id===id);
 const before=JSON.stringify(task),expected=task.steps[0].a;
 for(const value of ['1/0','-2/0,00']){
  const route=R.recommend({id,task,meta,stepIndex:0,value,expected});
  assert.equal(route.path,R.skills.part.path,id+' explains the zero denominator');
 }
 if(Number.isFinite(expected)&&expected!==0){
  const route=R.recommend({id,task,meta,stepIndex:0,value:String(-expected),expected});
  assert.equal(route.path,R.skills.signs.path,id+' offers help for the actual sign error');
 }
 assert.equal(JSON.stringify(task),before,id+' keeps task data unchanged');
}
function recommendation(id,seed,stepIndex){
 const task=D.task(id,seed),meta=D.meta.find(row=>row.id===id);
 return R.recommend({id,task,meta,stepIndex,value:'9999',expected:task.answer});
}
for(const meta of D.meta){
 const {id}=meta;
 for(let seed=0;seed<5;seed++){
  const task=D.task(id,seed);
  const route=R.recommend({id,task,meta,value:'9999',expected:task.answer});
  assert(route?.why,id+' provides a next action for the same variant');
  if(route.path)assert.equal(route.path,R.skills[route.key].path,id+' uses a registered trainer');
  else assert.equal(route.key,null,id+' uses the existing guided task');
  assert.deepEqual(task,D.task(id,seed),id+' does not alter the mathematics');
 }
}
for(const id of [
 'practice-inverse-formula','probability','practice-probability-draw','practice-probability-opposite',
 'practice-graph-match','practice-graph-slope','practice-right-ratio','practice-log-value','expressions',
 'practice-quadratic','practice-radical-equation','practice-log-equation','practice-exponential-equation',
 'practice-rational-equation','practice-number-match','practice-inequality-match','practice-average-speed'
]){
 for(let seed=0;seed<6;seed++){
  const route=recommendation(id,seed);
  assert.equal(route.path,undefined,id+' keeps the next action in this task');
  assert.equal(route.why,H.hint(D.task(id,seed)),id+' uses the exact authored first step');
 }
}
for(let seed=0;seed<15;seed++){
 const route=recommendation('equations',seed);
 assert.equal(route.path,seed%5===0?R.skills.equations.path:undefined,'only the linear variant uses linear training');
 assert.equal(route.why,H.hint(D.task('equations',seed)));
}
assert.equal(recommendation('practice-fraction-expression',2).path,undefined,'division comes first');
assert.equal(recommendation('practice-fraction-expression',2,0),null);
assert.equal(recommendation('practice-fraction-expression',2,1).path,R.skills.fractions.path,'the addition step uses the common denominator');
assert.equal(recommendation('practice-temperature',2,1).path,R.skills.signs.path,'adding a negative term uses signed arithmetic');
assert.equal(recommendation('practice-temperature',12,1),null,'no signed operation in this variant');
assert.equal(recommendation('practice-percent-whole',5).path,R.skills.percent.path,'finding the whole keeps a direct training route');

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
   assert.doesNotMatch(task.steps[index].q.trim(),/^(?:Нужное отношение|Отношение (?:площадей|объёмов|длин))\s*\?$/iu,label+' names the quantities being compared');
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

// The personal practice bank includes exact division and different nonzero remainders.
const packSizes=new Set(),remainders=new Set(),conditions=new Set(),legacyByCondition=new Map();
for(let seed=0;seed<7;seed++){
 const old=D.task('round',seed),{total,pack}=old.params;
 assert.equal(pack,9);assert.equal(total,(2+seed)*9+4);
 assert.deepEqual(Array.from(old.steps,step=>step.a),[2+seed,4,3+seed]);
 legacyByCondition.set(old.q,old.progressKey);
}
for(let seed=0;seed<140;seed++){
 const t=D.roundPractice(seed),{total,pack}=t.params,count=Math.ceil(total/pack),remainder=total%pack;
 assert.deepEqual(Array.from(t.steps,step=>step.a),[Math.floor(total/pack),remainder,count]);
 assert.equal(t.answer,count);assert.equal(count,D.task('round',seed).answer,'same final key on older clients');
 assert.equal(t.q,D.roundPractice(seed+140).q,'same finite family after full period');
 assert.equal(t.progressKey,`Для класса нужно ${total} тетрадей. В упаковке ${pack} тетрадей. Сколько упаковок нужно купить?`);
 if(legacyByCondition.has(t.q))assert.equal(t.progressKey,legacyByCondition.get(t.q));
 if(remainder===0){
  assert.match(t.steps[2].why,/Остаток равен нулю/);
  assert.doesNotMatch(t.steps[2].why,/Этого мало/);
 }
 for(let step=0;step<t.steps.length;step++)assert.equal(H.hint(t,step),H.hint(withoutAnswers(t),step));
 assert.match(H.hint(t,2),/Если он равен нулю/);
 conditions.add(t.progressKey);packSizes.add(pack);remainders.add(remainder);
}
assert.equal(conditions.size,140);assert.equal(packSizes.size,5);assert(remainders.has(0)&&remainders.size>=4);

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
for(let seed=0;seed<18;seed++){
 const water=D.task('practice-pour',seed),{ratio,oldH}=water.params,areaFactor=ratio**2;
 const depth=water.steps[1];
 assert.equal(water.steps[0].a,areaFactor);
 assert.equal(depth.a*areaFactor,oldH,'same water volume in both cylinders');
 assert.ok(depth.q.includes(oldH+' см')&&depth.q.includes('в '+areaFactor+' раз'),'the second step repeats both operands beside the input');
 for(const copy of [depth.why,H.hint(withoutAnswers(water),1)]){
  assert.ok(copy.includes(oldH+' см')&&copy.includes('на '+areaFactor+'.'),'both guided entry points divide the given depth by the area factor');
  assert.doesNotMatch(copy,/равн[ао] \d+ см|= \d+ см/,'the learner still works out the new depth');
 }
 const cone=D.task('practice-cone-area',seed);
 const {r,l,ratio:radiusFactor}=cone.params, firstProduct=r*l, secondProduct=(r*radiusFactor)*(2*l);
 assert.ok(cone.steps[2].q.includes(firstProduct+'π')&&cone.steps[2].q.includes(secondProduct+'π'));
 for(const hint of [cone.steps[2].why,H.hint(withoutAnswers(cone),2)]){
  assert.ok(hint.includes('Раздели '+secondProduct+' на '+firstProduct+'.'),'the second lateral area is compared with the first');
 }
 const similar=D.task('practice-similar-volume',seed),{small,factor}=similar.params;
 assert.ok(H.hint(withoutAnswers(similar),1).includes([factor,factor,factor].join(' · ')),'a linear scale affects three dimensions');
 for(const hint of [similar.steps[2].why,H.hint(withoutAnswers(similar),2)]){
  assert.ok(hint.includes('Умножь '+small+' на '+factor**3+'.'),'the small volume is scaled by the cube of the length factor');
 }
 const immersed=D.task('practice-displacement',seed),{litres,factor:levelFactor}=immersed.params;
 const total=D.F(litres*levelFactor),part=D.F(litres*(levelFactor-1));
 assert.ok(immersed.steps[1].q.includes(total+' л')&&immersed.steps[1].q.includes(litres+' л'));
 for(const hint of [immersed.steps[1].why,H.hint(withoutAnswers(immersed),1)]){
  assert.ok(hint.includes('Вычти '+litres+' из '+total+'.'),'subtract the original amount of water from the occupied total');
 }
 assert.ok(H.hint(withoutAnswers(immersed),2).includes('Умножь '+part+' на 1000.'));
 const trig=D.task('practice-right-ratio',seed),{a,b,c,ask}=trig.params;
 assert.match(trig.steps[1].q,/длина катета/,'a numeric input asks for a length');
 assert.ok(trig.steps[2].q.includes(ask?'sin A':'cos A'));
 for(const copy of [trig.steps[2].why,H.hint(withoutAnswers(trig),2)]){
  assert.ok(copy.includes((ask?'BC':'AC')+' ('+(ask?b:a)+')')&&copy.includes('AB ('+c+')'),'the named numerator and denominator match the requested function');
 }
}
const independent=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../ege-baza/path/task-hints.js'),'utf8'),independent);
for(const id of ['practice-displacement','practice-cone-area','practice-similar-volume']){
 const issued=withoutAnswers(D.task(id,5));
 for(let i=0;i<issued.steps.length;i++)
  assert.equal(independent.PathTaskHints.hint(issued,i),H.hint(issued,i),'issued tasks work with an independently cached hint catalogue');
}
assert.equal(H.hint(unknown),'Как найти неизвестную сторону?','unregistered curricula retain their own question');
assert.equal(H.hint(notebooks,-1),notebookHint);
assert.equal(H.hint(notebooks,NaN),notebookHint);
assert.equal(H.hint(notebooks,100),H.hint(notebooks,notebooks.steps.length-1));
assert.equal(typeof H.hint(null),'string');

// The displayed scaffold must use the current givens, not the generator's k/b/c.
// Check the whole 7×3×5 variant cycle and the supported serial boundary.
let concreteScaffolds=0;
for(const seed of [...Array.from({length:240},(_,i)=>i),1e9]){
 const k=2+seed%7,j=seed%3,label='seed '+seed;
 const expression=D.task('expressions',seed),equation=D.task('equations',seed);
 for(const task of [expression,equation]){
  const visible=task.steps.map(step=>step.q+' '+step.why).join(' ');
  assert.doesNotMatch(visible,/\b(?:k|b|c|cx)\b|undefined|NaN/,'no undeclared generator symbols: '+task.id+', '+label);
  assert.doesNotMatch(visible,/\+\s*[−-]|[−-]\s*[−-]/,'readable signs: '+task.id+', '+label);
  for(const step of task.steps)assert(D.correct(step,String(step.a)),'the stated intermediate answer remains accepted: '+label);
  assert(D.correct(task,String(task.answer)),'the final answer remains accepted: '+label);
  concreteScaffolds++;
 }
 assert.deepEqual(Array.from(expression.steps,step=>step.a),[k,2*k+1],label+' cancellation answers');
 assert(expression.steps[0].why.includes('x−'+k),label+' actual denominator');
 assert(expression.steps[1].q.includes('x+'+k),label+' actual remaining factor');
 assert(expression.steps[1].q.includes('x='+(k+1)),label+' actual substitution');
 assert(expression.steps[1].why.includes('(x−'+k+')(x+'+k+')'),label+' factorization matches the numerator');
 if(seed%5===0){
  const c=k===2?1:2,b=k+3,x=j+2,r=(k-c)*x+b;
  assert.deepEqual(Array.from(equation.steps,step=>step.a),[k-c,r-b,x],label+' linear arithmetic');
  assert(equation.steps[0].q.includes('вычитания '+c+'x'),label+' subtract the actual right-hand variable term');
  assert(equation.steps[1].q.includes('вычитания '+b+' из обеих частей'),label+' subtract the actual left-hand constant');
  assert(equation.steps[2].why.includes((k-c)+'x='+(r-b)),label+' final equality uses the current operands');
 }else if(seed%5===1){
  assert.deepEqual(Array.from(equation.steps,step=>step.a),[1,k],label+' quadratic arithmetic');
  assert(equation.steps[0].why.includes('(−'+(2*k+1)+')²−4·1·'+k*(k+1)),label+' negative coefficient is squared as a whole');
  assert(equation.steps[1].why.includes('('+(2*k+1)+'−√D)/2'),label+' choose the smaller root');
 }else if(seed%5===2){
  assert.deepEqual(Array.from(equation.steps,step=>step.a),[k*k,k*k-k],label+' radical arithmetic');
  assert(equation.steps[1].why.includes('x+'+k+'='+k*k),label+' equation after squaring');
 }else if(seed%5===3){
  assert.deepEqual(Array.from(equation.steps,step=>step.a),[8,8-k],label+' logarithmic arithmetic');
  assert(equation.steps[0].q.includes('x+'+k),label+' actual logarithm argument');
  assert.match(equation.steps[1].why,/положительным/,label+' retain the domain check');
 }else{
  assert.deepEqual(Array.from(equation.steps,step=>step.a),[5,5-k],label+' exponential arithmetic');
  assert(equation.steps[1].why.includes('x+'+k+'=5'),label+' actual exponent equality');
 }
}
const concreteLinear=D.task('equations',10);
assert.equal(concreteLinear.q,'5x + 8 = 2x + 17. Найдите x.');
assert.match(concreteLinear.steps[0].q,/вычитания 2x/);
assert.match(concreteLinear.steps[1].q,/вычитания 8/);
assert.match(concreteLinear.steps[2].why,/3x=9/);
const concreteCancellation=D.task('expressions',1);
assert.match(concreteCancellation.steps[1].q,/остаётся x\+3.*x=4/);
// The separate signed-equation trainer must keep its explicit parentheses.
const signedEquation=D.task('equations-signs',0);
assert.match(signedEquation.steps[1].q,/Вычти \([-−]3\)/);
assert.match(signedEquation.steps[1].why,/− \([-−]3\)/);

console.log(`Concrete EGE hints: ${ids.length} families, ${checked} step variants, max ${longest} characters; no answer dependencies or task mutations; ${concreteScaffolds} concrete algebra scaffolds.`);

const mapContext={};
mapContext.globalThis=mapContext;
vm.createContext(mapContext);
for(const file of ['path/data','path/practice','path/equation-practice','skill-map-data']){
 const name=path.join(__dirname,'../ege-baza',file+'.js');
 vm.runInContext(fs.readFileSync(name,'utf8'),mapContext,{filename:name});
}
const mapData=mapContext.EgeBazaSkillMaps;
const mapBank=mapContext.PathData;
const familyMaps=mapData.all();
assert.equal(familyMaps.length,113);
assert.deepEqual(Array.from(familyMaps,m=>m.id).sort(),Array.from(mapBank.meta,m=>m.id).sort());
const questions=new Set();
for(const map of familyMaps){
 assert(map.skills.length>=3&&map.skills.length<=8,map.id+' focused route');
 assert(map.selfCheck?.question&&map.selfCheck.explanation,map.id+' authored self-check');
 assert(Number.isFinite(mapBank.parse(map.selfCheck.answer)),map.id+' numeric key');
 questions.add(map.selfCheck.question);
 for(const node of map.skills)assert(node&&node.practiceIds.every(id=>mapData.forLesson(id)),map.id+' verified practice');
 for(const next of map.next)assert(mapData.forLesson(next.id),map.id+' verified next lesson');
}
assert.equal(questions.size,113,'distinct self-checks');
assert.deepEqual(Array.from(mapData.forLesson('practice-work').skills,x=>x.id),['unit-work','fraction-sum','joint-rate','work-time']);
assert(!mapData.forLesson('functions').skills.some(skill=>skill.practiceIds.includes('functions')),'mixed-family answer does not stand in for both branches');
assert(mapData.forLesson('motion').skills.some(skill=>skill.id==='total-distance'));
assert.deepEqual(Array.from(mapData.forLesson('practice-inequality-match').skills,x=>x.id),['inequality-sign','fraction-domain','interval-signs','interval-ends']);
