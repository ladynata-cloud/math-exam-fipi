'use strict';
// Synthetic saved specifications only. Presentation must not rewrite tasks/answers.
const assert=require('node:assert/strict');
const {test}=require('node:test');
const C=require('../trainers/oge-basics/multiplication-division/division-course-core.js');
const M=require('../trainers/oge-basics/multiplication-division/multiplication-column-core.js');
const D=require('../trainers/oge-basics/multiplication-division/division-lab-core.js');
const U=require('../trainers/oge-basics/learning-scaffolds.js');
const plain=html=>html.replace(/<[^>]*>/g,'');
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const show=(spec,index,answer)=>U.present(spec,spec.steps[index],{scope:'step',step:index,answer});
const help=(spec,index,level=2)=>U.render(spec,spec.steps[index],{scope:'step',step:index,level});
const column=(a,b)=>freeze({contentId:'multiplication-division/course-column-three-by-three',task:{multiplication:{a,b}},steps:M.plan(a,b)});

test('course digit errors distinguish high, low and non-digit; only explicit solution chooses a row',()=>{
  const id='multiplication-division/course-digit-choice',spec=freeze({contentId:id,...C.make(id,73)}),before=JSON.stringify(spec);
  const q=spec.steps[0],correct=Number(q.answer);
  assert.match(show(spec,0,String(correct+1)).error,/слишком много.*поменьше/);
  assert.match(show(spec,0,String(correct-1)).error,/слишком мало.*побольше/);
  for(const bad of ['10','-1','2,5','<b>2</b>'])assert.match(show(spec,0,bad).error,/одну цифру/);
  const hint=help(spec,0),solution=help(spec,0,3);
  assert.match(hint,/data-help-number/);
  assert.doesNotMatch(hint,/lm-scaffold-selected|data-scaffold-result|✓ Берём/);
  assert.match(solution,new RegExp('lm-scaffold-selected"><th scope="row">'+correct));
  assert.match(solution,/data-scaffold-result/);
  assert.equal(JSON.stringify(spec),before);
});

test('division errors point at the current arithmetic or one next digit',()=>{
  const id='multiplication-division/course-whole-simple',spec=freeze({contentId:id,...C.make(id,73)}),before=JSON.stringify(spec);
  for(let i=0;i<spec.steps.length;i++){
    const segment=spec.divisionTasks.find(t=>i>=t.startIndex&&i<t.endIndex),plan=D.plan(segment?segment.task:spec.divisionTask);
    const q=spec.steps[i],a=plan.actions[i-(segment?segment.startIndex:0)],cycle=plan.cycles[a.cycle];
    if(q.kind==='product'&&cycle.qd+plan.normalizedDivisor!==cycle.product)assert.match(show(spec,i,String(cycle.qd+plan.normalizedDivisor)).error,/сложил.*умножить/);
    if(q.kind==='subtract'&&cycle.product)assert.match(show(spec,i,String(cycle.partial+cycle.product)).error,/прибавил.*вычесть/);
    if(q.kind==='bring')assert.match(show(spec,i,'99').error,/только одну следующую цифру/);
    const hint=help(spec,i);
    assert.doesNotMatch(hint,/data-scaffold-result|На этом шаге запиши|✓ Берём/);
    assert(help(spec,i,3));
  }
  assert.equal(JSON.stringify(spec),before);
});

test('column feedback names forgotten in-mind value, written digit and shifted row',()=>{
  const spec=column(27,36),before=JSON.stringify(spec);
  const carry=spec.steps.findIndex(q=>q.multiplication.event==='add-carry');
  assert(carry>0);
  const meta=spec.steps[carry].multiplication,x=Number(String(27).at(-meta.operandColumn-1)),y=Number(String(36).at(-meta.multiplierColumn-1));
  assert.match(show(spec,carry,String(x*y)).error,/в уме осталось \d+.*прибавь/);
  assert.match(plain(help(spec,carry)),/В уме \d+\. Прибавь его: \d+ \+ \d+ = \?/);
  assert.doesNotMatch(plain(help(spec,carry)),new RegExp('= '+spec.steps[carry].answer+'(?:\\.|$)'));
  const write=spec.steps.findIndex(q=>/^Получилось \d\d\./.test(q.prompt));
  const total=spec.steps[write].prompt.match(/\d+/)[0];
  assert.match(show(spec,write,total).error,/целое число.*последняя цифра/);
  const shift=spec.steps.findIndex(q=>q.multiplication.phase==='multiply'&&q.multiplication.event==='calculate'&&q.multiplication.multiplierColumn===1&&q.multiplication.operandColumn===0);
  assert.match(show(spec,shift,String(Number(spec.steps[shift].answer)*10)).error,/уже сдвинута.*не дописывай/);
  const third=column(27,136),thirdIndex=third.steps.findIndex(q=>q.multiplication.phase==='multiply'&&q.multiplication.event==='calculate'&&q.multiplication.multiplierColumn===2&&q.multiplication.operandColumn===0);
  assert.match(show(third,thirdIndex,String(Number(third.steps[thirdIndex].answer)*100)).error,/уже сдвинута.*не дописывай/);
  const remember=spec.steps.findIndex(q=>q.multiplication.event==='carry');
  assert.match(plain(help(spec,remember)),/закрой последнюю цифру.*оставь в уме/);
  assert.doesNotMatch(help(spec,remember),/data-scaffold-result/);
  assert.match(help(spec,remember,3),/data-scaffold-result/);
  assert.equal(JSON.stringify(spec),before);
});

test('all existing course and column actions retain a non-answer first hint, including saved specs',()=>{
  let count=0;
  for(const core of [C,M])for(const stage of core.stages)for(const seed of [0,1,4,73,99999]){
    const spec=freeze({contentId:stage.id,...core.make(stage.id,seed)}),before=JSON.stringify(spec);
    spec.steps.forEach((q,i)=>{
      const copy=show(spec,i),hint=help(spec,i),solution=help(spec,i,3);
      assert(copy,stage.id+':'+i+':'+q.kind);
      assert(hint,stage.id+':'+i+':'+q.kind);
      assert.doesNotMatch(hint,/data-scaffold-result|✓ Берём|На этом шаге запиши/);
      if(['product','subtract','round','estimate'].includes(q.kind))assert.doesNotMatch(plain(hint),new RegExp('= '+q.answer.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\.|$)'));
      assert(solution,stage.id+':'+i+':'+q.kind);
      count++;
    });
    assert.equal(JSON.stringify(spec),before);
  }
  assert(count>2000);
});

test('round numbers stay fixed; assembling subtraction includes all three computed digits',()=>{
  const id='multiplication-division/course-subtract';
  for(const source of [C.make(id,1),C.makeV2(id,1)]){
    const spec=freeze({contentId:id,...source}),group=spec.divisionTasks.at(-1),index=group.endIndex-1;
    assert.match(show(spec,index).hint,/три полученные цифры.*последнюю — слева.*Начальные нули/);
    assert.doesNotMatch(show(spec,index).hint,/две цифры/);
  }
  const est='multiplication-division/course-estimate',spec=freeze({contentId:est,...C.makeV2(est,4)});
  assert.equal(spec.steps[0].answer,'20');
  assert.match(show(spec,0).hint,/уже оканчивается на 0\. Ничего не меняй/);
  assert.doesNotMatch(show(spec,0).hint,/вниз/);
});
