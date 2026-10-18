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
assert.match(t.host.textContent,/Сколько раз можно взять 16/);
assert.doesNotMatch(t.host.textContent,/Цифра частного|линейка кратных/);
t.host.querySelector('#lm-hint').click();
assert.doesNotMatch(t.host.querySelector('.lm-feedback').textContent,/частно|кратн|делител|произведени/);
assert.equal(t.host.querySelectorAll('.lm-scaffold').length,1);
assert.equal(t.host.querySelectorAll('.lm-scaffold-selected').length,0);
assert.equal(t.bridge.getState().step,0);
for(const [value,direction] of [['9','меньше раз'],['2','больше раз']]) {
  const input=t.host.querySelector('#lm-answer');input.value=value;input.dispatchEvent(new t.window.Event('input'));
  t.host.querySelector('#lm-check').click();assert(t.host.querySelector('.lm-feedback').textContent.includes(direction));
  assert.equal(t.bridge.getState().step,0);
}
t.host.querySelector('#lm-solution').click();assert.equal(t.bridge.getState().step,0);
assert.equal(t.host.querySelectorAll('.lm-scaffold-selected').length,1);
t.host.querySelector('#lm-learn').click();
for(let i=0;i<t.taskSpec.lessons.length;i++) {
  t.host.querySelector('[data-lesson="'+i+'"]').click();
  assert.doesNotMatch(t.host.querySelector('.lm-layout').textContent,/кратн|частно|произведени|делител|неполное/);
  assert.equal(t.bridge.getState().lessonChecked.length,0);
}
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
console.log('LEARNING_PLAIN_DIVISION_DOM_OK (saved tasks; hints; diagnostic errors; no auto-advance/reveal; five lessons; resume; decimal/checkpoint; read-only; optional-help failure)');
