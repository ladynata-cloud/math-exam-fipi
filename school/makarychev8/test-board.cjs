'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const {JSDOM}=require('jsdom'), project=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(project,'trainers/makarychev8.html'),'utf8');
function participant() {
 const dom=new JSDOM(html,{url:'https://mathexam.test/trainers/makarychev8.html#lesson/p11/0',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.TextEncoder=TextEncoder;
 Object.defineProperty(w,'localStorage',{get(){throw Error('Joint classroom accessed personal progress');}});
 let api;
 for (const script of w.document.querySelectorAll('script[src]')) {
  if(script.src.endsWith('/board-bridge.js')){w.MathExamBoard={register(config){api=config;}};continue;}
  w.eval(fs.readFileSync(path.join(project,new URL(script.src).pathname),'utf8'));
 }
 assert(api);
 return {dom,w,api,d:w.document};
}
const teacher=participant(),student=participant();
function input(p,selector,value){const el=p.d.querySelector(selector);assert(el,selector);el.value=value;el.dispatchEvent(new p.w.Event('input',{bubbles:true}));}
function send(from,to){const snap=JSON.parse(JSON.stringify(from.api.getState()));assert(to.api.validateState(snap));to.api.applyState(snap);return snap;}
const one=teacher.d.querySelector('.task-heading h2').textContent;
teacher.d.querySelector('[data-action=guided]').click();
input(teacher,'[data-step-input="0"]','3');input(teacher,'#notebook','Проверка 2 < 3; <b> записано как текст');
send(teacher,student);
assert.equal(student.d.querySelector('.task-heading h2').textContent,one);
assert.equal(student.d.querySelector('[data-step-input="0"]').value,'3');
assert.equal(student.d.querySelector('#notebook').value,'Проверка 2 < 3; <b> записано как текст');
student.d.querySelector('[data-action=hint]').click();
send(student,teacher);assert(teacher.d.querySelector('.help'));
const lesson=teacher.w.MakarychevCourse.lessons.find(l=>l.id==='p11'), task=lesson.tasks[0];
input(teacher,'[data-step-input="0"]',String(task.steps[0].answer));
teacher.d.querySelector('[data-step-form="0"]').dispatchEvent(new teacher.w.Event('submit',{bubbles:true,cancelable:true}));
send(teacher,student);assert.equal(student.d.querySelectorAll('.step.completed').length,1);
const answer=student.d.querySelector('#final-answer');if(answer)input(student,'#final-answer',String(task.answer));else student.d.querySelector('[data-choice="'+task.choices.indexOf(task.answer)+'"]').click();
student.d.querySelector('#answer-form').dispatchEvent(new student.w.Event('submit',{bubbles:true,cancelable:true}));
const snap=send(student,teacher), result=JSON.parse(snap.work).tasks[task.id];assert(result.correct);assert(!result.independent);
assert.equal(teacher.api.validateState({...snap,route:'#lesson/unknown'}),false);
assert.equal(teacher.api.validateState({...snap,work:'x'.repeat(65536)}),false);
const altered=JSON.parse(snap.work);altered.tasks[task.id].independent=true;
assert.equal(teacher.api.validateState({...snap,work:JSON.stringify(altered)}),false);
const predictor=teacher.d.querySelector('#model .m8-prediction select');predictor.value='0';teacher.d.querySelector('#model .m8-prediction button').click();
const slider=teacher.d.querySelector('#model input[type=range]');assert(slider);const next=slider.value===slider.min?slider.max:slider.min;
slider.value=next;slider.dispatchEvent(new teacher.w.Event('input',{bubbles:true}));
send(teacher,student);assert.equal(student.d.querySelector('#model input[type=range]').value,next,'model position');
const reconnect=participant();send(student,reconnect);assert.equal(reconnect.d.querySelector('#notebook').value,student.d.querySelector('#notebook').value);
const numbered=teacher.w.MakarychevCourse.lessons.find(l=>l.id==='p09');
const index206=numbered.tasks.findIndex(t=>t.id==='p09-source-206-a');
teacher.w.history.replaceState(null,'','#lesson/p09/'+index206);
teacher.w.MakarychevApp.route();
input(teacher,'#final-answer','(-2;4)');
send(teacher,student);
assert.equal(student.d.querySelector('#final-answer').value,'(-2;4)');
assert.equal(student.d.querySelectorAll('#task-graph li').length,0);
student.d.querySelector('#answer-form').dispatchEvent(new student.w.Event('submit',{bubbles:true,cancelable:true}));
send(student,teacher);
assert.match(teacher.d.querySelector('#task-graph li').textContent,/Слева 2, справа 2/);
input(teacher,'#final-answer',numbered.tasks[index206].answer);
teacher.d.querySelector('#answer-form').dispatchEvent(new teacher.w.Event('submit',{bubbles:true,cancelable:true}));
send(teacher,reconnect);
assert.equal(reconnect.d.querySelectorAll('#task-graph li').length,4);
assert.equal(reconnect.w.MakarychevApp.getState().tasks['p09-source-206-a'].correct,true);
const appendix=teacher.w.MakarychevCourse.lessons.find(l=>l.id==='p01');
const trainIndex=appendix.tasks.findIndex(t=>t.id==='ch1-extra-213-speeds');
teacher.w.history.replaceState(null,'','#lesson/p01/'+trainIndex);
teacher.w.MakarychevApp.route();
input(teacher,'#final-answer','45;40');
teacher.d.querySelector('#answer-form').dispatchEvent(new teacher.w.Event('submit',{bubbles:true,cancelable:true}));
send(teacher,student);
assert.match(student.d.querySelectorAll('.train-model figcaption')[1].textContent,/Вместе 480 км/);
input(student,'#final-answer','45;80');
student.d.querySelector('#answer-form').dispatchEvent(new student.w.Event('submit',{bubbles:true,cancelable:true}));
send(student,reconnect);
assert.match(reconnect.d.querySelectorAll('.train-model figcaption')[1].textContent,/Вместе 600 км/);
assert.equal(reconnect.w.MakarychevApp.getState().tasks['ch1-extra-213-speeds'].correct,true);
const domainIndex=appendix.tasks.findIndex(t=>t.id==='ch1-extra-215-b');
teacher.w.history.replaceState(null,'','#lesson/p01/'+domainIndex);
teacher.w.MakarychevApp.route();
input(teacher,'#final-answer','1/(x-3)');
teacher.d.querySelector('#answer-form').dispatchEvent(new teacher.w.Event('submit',{bubbles:true,cancelable:true}));
send(teacher,student);
assert.match(student.d.querySelector('.exclusion-model li').textContent,/x = 0: знаменатель отличен от нуля/);
input(student,'#final-answer','(x+4)/(x*(x-3)*(x^2+1))');
student.d.querySelector('#answer-form').dispatchEvent(new student.w.Event('submit',{bubbles:true,cancelable:true}));
send(student,reconnect);
assert.equal(reconnect.w.MakarychevApp.getState().tasks['ch1-extra-215-b'].correct,true);
assert.match(reconnect.d.querySelector('.exclusion-model').textContent,/знаменателя: 2/);
teacher.w.history.replaceState(null,'','#lesson/p51/5');
teacher.w.MakarychevApp.route();
const prediction=teacher.d.querySelector('#model .m8-prediction select');
prediction.value='0';
teacher.d.querySelector('#model .m8-prediction button').click();
function setComparison(p,index,value){
 const controls=p.d.querySelectorAll('#model .m8-controls select');
 controls[index].value=value;
 controls[index].dispatchEvent(new p.w.Event('change',{bubbles:true}));
}
function compare(p,power,x){
 assert.deepEqual(Array.from(p.d.querySelectorAll('#model .m8-controls select'),c=>c.value),[power,x]);
 assert.equal(p.w.MakarychevApp.getState().tasks['p51-t06'].correct,false);
 const graphic=p.d.querySelector('#model .m8-chart');
 assert.equal(Number(graphic.querySelector('[data-reciprocal-value]').dataset.reciprocalValue),1/Number(x));
 assert.equal(Number(graphic.querySelector('[data-square-reciprocal-value]').dataset.squareReciprocalValue),1/(Number(x)**2));
}
setComparison(teacher,0,'-2');
setComparison(teacher,1,'-0.5');
send(teacher,student);
compare(student,'-2','-0.5');
setComparison(student,1,'2');
send(student,teacher);
compare(teacher,'-2','2');
setComparison(teacher,1,'-0.5');
send(teacher,reconnect);
compare(reconnect,'-2','-0.5');
[teacher,student,reconnect].forEach(p=>p.dom.window.close());
console.log('PASS two participants, accepted step, notes, assist status, model, reconnect and isolation');
