'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const C = require('../trainers/oge-basics/learning-contracts');
const D = require('../trainers/oge-basics/multiplication-division/division-lab-core');
const S = require('../trainers/oge-basics/learning-scaffolds');
const code = fs.readFileSync(require.resolve('../trainers/oge-basics/learning-managed.js'),'utf8');
const clone = x => JSON.parse(JSON.stringify(x));
function mount(id, {step=0, readOnly=false, noHelp=false}={}) {
  const dom = new JSDOM('<main id="learning-remediation-root"></main>',{url:'https://example.test/?learning=1',runScripts:'outside-only'});
  const {window} = dom, calls=[];
  let bridge;
  window.MathExamRemediationManaged=true;
  window.MathExamRemediation=C;window.DivisionLab=D;
  if(!noHelp)window.LearningScaffolds=S;
  window.MathExamLearning={register:x=>bridge=x};window.eval(code);
  const {taskSpec,state}=C.create(id,1);
  taskSpec.trainerId='oge-basics';taskSpec.id=taskSpec.contentId;
  state.answers=taskSpec.steps.slice(0,step).map(a=>a.answer);state.step=step;
  const saved=JSON.stringify({taskSpec,state});
  bridge.subscribe(x=>calls.push(clone(x)));
  bridge.applyState({taskSpec,state,readOnly});
  assert.equal(JSON.stringify({taskSpec,state}),saved);
  const host=window.document.querySelector('main');
  return {dom,window,host,bridge,calls,taskSpec,state};
}
const first='multiplication-division/long-division-quotient-digit';
const t=mount(first);
assert(t.host.classList.contains('lm-arithmetic'));
assert.match(t.host.textContent,/Подбери одну цифру: □ × 16/);
assert.doesNotMatch(t.host.textContent,/Цифра частного|линейка кратных/);
t.host.querySelector('#lm-hint').click();
assert.doesNotMatch(t.host.querySelector('.lm-feedback').textContent,/частно|кратн|делител|произведени/);
assert.equal(t.host.querySelectorAll('.lm-scaffold').length,1);
assert.equal(t.host.querySelectorAll('.lm-scaffold-selected').length,0);
assert.deepEqual([...t.host.querySelectorAll('[data-help-number]')].map(x=>x.textContent),['16','91','9']);
assert.doesNotMatch(t.host.querySelector('.lm-feedback').textContent,/✓ Берём|5 × 16 = 80/);
assert.equal(t.host.querySelector('#lm-answer').value,'');
assert.equal(t.bridge.getState().hint,2);
assert.equal(t.bridge.getState().completed,false);
assert.equal(t.host.querySelector('#lm-answer').getAttribute('aria-label'),'Одна цифра от 0 до 9');
assert.equal(t.bridge.getState().step,0);
for(const [value,direction] of [['9','цифру поменьше'],['2','цифру побольше'],['80','одну цифру']]) {
  const input=t.host.querySelector('#lm-answer');input.value=value;input.dispatchEvent(new t.window.Event('input'));
  t.host.querySelector('#lm-check').click();assert(t.host.querySelector('.lm-feedback.incorrect').textContent.includes(direction));
  assert.equal(t.bridge.getState().step,0);
}
t.host.querySelector('#lm-solution').click();assert.equal(t.bridge.getState().step,0);
assert.equal(t.host.querySelectorAll('.lm-scaffold-selected').length,1);
assert.deepEqual([...t.host.querySelector('.lm-scaffold-selected').children].map(x=>x.textContent),['5','5 × 16','80✓ Берём 5']);
assert.deepEqual([...t.host.querySelectorAll('.lm-digit-table thead th')].map(x=>x.textContent),['Цифра','Умножаем на 16','Получилось']);
t.host.querySelector('#lm-learn').click();
for(let i=0;i<t.taskSpec.lessons.length;i++) {
  t.host.querySelector('[data-lesson="'+i+'"]').click();
  assert.doesNotMatch(t.host.querySelector('.lm-layout').textContent,/кратн|частно|произведени|делител|неполное/);
  assert.equal(t.bridge.getState().lessonChecked.length,0);
}
// Older saved task specifications retain their canonical labels and IDs. The
// display-only wording must still submit, restore, and review the same answer.
const originalLessons=JSON.stringify(t.taskSpec.lessons);
assert.deepEqual(t.taskSpec.lessons[2].question.options.map(option=>option.html),['подходит','слишком мала','слишком велика']);
for(const lessonIndex of [2,3]) {
  t.host.querySelector('[data-lesson="'+lessonIndex+'"]').click();
  const question=t.taskSpec.lessons[lessonIndex].question;
  const buttons=()=>[...t.host.querySelectorAll('[data-choice]')];
  assert.deepEqual(buttons().map(button=>button.textContent),['подходит','слишком мало','слишком много']);
  assert.deepEqual(buttons().map(button=>button.dataset.choice),question.options.map(option=>option.id));
  buttons().find(button=>button.dataset.choice==='0').click();
  t.host.querySelector('#lm-check').click();
  assert.equal(t.bridge.getState().feedback.kind,'incorrect');
  buttons().find(button=>button.dataset.choice===question.answer).click();
  t.host.querySelector('#lm-check').click();
  const saved=clone(t.bridge.getState());
  assert.equal(saved.lessonAnswers[lessonIndex],question.answer);
  assert.equal(saved.lessonChecked[lessonIndex],true);
  assert.equal(saved.feedback.kind,'correct');
  C.normalize(t.taskSpec,saved);
  t.bridge.applyState({taskSpec:t.taskSpec,state:saved,readOnly:true});
  assert.equal(t.host.querySelector('[aria-pressed="true"]').dataset.choice,question.answer);
  assert.equal(t.host.querySelector('[aria-pressed="true"]').textContent,lessonIndex===2?'слишком мало':'слишком много');
  assert(buttons().every(button=>button.disabled));
  t.bridge.applyState({taskSpec:t.taskSpec,state:saved,readOnly:false});
}
assert.equal(JSON.stringify(t.taskSpec.lessons),originalLessons,'Presentation must not rewrite saved canonical lessons');
t.host.querySelector('#lm-practice').click();
const input=t.host.querySelector('#lm-answer');input.value='5';input.dispatchEvent(new t.window.Event('input'));t.host.querySelector('#lm-check').click();
assert.equal(t.bridge.getState().completed,true);assert.deepEqual(clone(t.bridge.getState().answers),['5']);
C.normalize(t.taskSpec,t.bridge.getState());
assert(t.calls.some(x=>x.kind==='hint'&&x.details.level===3));t.dom.window.close();
for(const name of ['long-division-one-digit','decimal-divisor-shift','division-lab','long-division-mixed-checkpoint']) {
  const id='multiplication-division/'+name, spec=C.create(id,1).taskSpec;
  for(const step of [0,Math.floor(spec.steps.length/2),spec.steps.length-1]) {
    const t=mount(id,{step});
    assert.doesNotMatch(t.host.querySelector('.lm-card .lm-prompt:last-of-type')?.textContent||'',/неполное|частно|делител|произведени/);
    t.host.querySelector('#lm-hint').click();assert(t.host.querySelector('[data-scaffold="division"]'));
    const input=t.host.querySelector('#lm-answer');input.value=spec.steps[step].answer;input.dispatchEvent(new t.window.Event('input'));t.host.querySelector('#lm-check').click();
    assert.equal(t.bridge.getState().step,step+1);C.normalize(t.taskSpec,t.bridge.getState());t.dom.window.close();
  }
}
const observer=mount(first,{readOnly:true});assert.equal(observer.calls.length,0);assert(observer.host.querySelector('#lm-check').disabled);observer.dom.window.close();
const fallback=mount(first,{noHelp:true});assert(fallback.host.querySelector('#lm-check'));fallback.host.querySelector('#lm-hint').click();assert(fallback.host.querySelector('.lm-feedback'));fallback.dom.window.close();
const multiplication=mount('multiplication-division/column-multiplication-one-digit');
assert(multiplication.host.classList.contains('lm-arithmetic'));
multiplication.dom.window.close();
console.log('LEARNING_PLAIN_DIVISION_DOM_OK (saved tasks; hints; diagnostic errors; visible highlight without auto-answer/advance; five lessons; corrected choice labels with original IDs and saved answers; resume; decimal/checkpoint; read-only; optional-help failure; arithmetic readability scope)');
