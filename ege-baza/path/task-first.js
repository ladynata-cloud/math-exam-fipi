/* Task-first presentation for the existing EGE bank. Grade 7, managed lessons,
   checks and exam sessions retain their own controllers. */
(function (root) {
 'use strict';
 const E=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const bounded=(value,max)=>typeof value==='string'&&value.length<=max;
 const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
 function valid(value) {
  if(value===undefined)return true;
  return plain(value)&&value.version===1&&Number.isSafeInteger(value.seed)&&value.seed>=0&&
   bounded(value.finalDraft,10000)&&bounded(value.stepDraft,10000)&&(value.legacyDraft===undefined||bounded(value.legacyDraft,10000))&&bounded(value.feedback,4000)&&
   bounded(value.stepFeedback,4000)&&Array.isArray(value.stepAnswers)&&value.stepAnswers.length<=20&&value.stepAnswers.every(x=>bounded(x,10000))&&['','good','bad'].includes(value.feedbackKind)&&
   ['helpOpen','modelOpen','stepsOpen','whyOpen','noteOpen'].every(k=>typeof value[k]==='boolean')&&
   (value.model===null||plain(value.model)&&JSON.stringify(value.model).length<=16000);
 }
 function question(task) {
  // The final input label comes only from the condition. A worked step may ask
  // for a different quantity, or reveal an answer that belongs inside help.
  const source=String(task.q),matches=[...source.matchAll(/(?:Найд(?:и|ите)|Вычисл(?:и|ите)|Реш(?:и|ите)|Упрост(?:и|ите)|Сколько|Как(?:ов|ова|ово|ой|ая|ое|ую)|На какой|Во сколько|За сколько|Через сколько|Укаж(?:и|ите)|Запиш(?:и|ите)|Чему)(?=[\s:])/giu)];
  return matches.length?source.slice(matches.at(-1).index):source;
 }
 function inputMarkup(item,prefix,label) {
  const choices=root.PathPracticeView.answerChoices(item);
  const format=item.answerKind==='match'?'Введи соответствующие цифры подряд, без пробелов.':item.answerKind==='multi'?'Введи номера подходящих утверждений подряд, без пробелов.':item.answerKind==='solutions'?'Введи любое число, которое удовлетворяет всем условиям.':'Введи число без единиц измерения. Десятичную дробь можно записать с запятой; обычную дробь — как 2/3.';
  return `<form id="${prefix}Form" class="task-first-form"><label for="${prefix}">${root.PathPracticeView.math(label)}</label><p id="${prefix}Format" class="muted">${format}</p><div class="actions"><input id="${prefix}" ${choices?'type="hidden"':''} maxlength="10000" autocomplete="off" aria-describedby="${prefix}Format" value="">${choices?`<div class="actions">${choices.map((choice,i)=>`<button type="button" data-${prefix}-choice="${E(choice.value)}" aria-pressed="false">${root.PathPracticeView.math(choice.label)}</button>`).join('')}</div>`:''}<button class="primary" type="submit">${prefix==='answer'?'Проверить ответ':'Проверить этот шаг'}</button></div></form>`;
 }
 function primaryVisual(task) {
  if(task.display)return '';
  const m=task.model, line=(d)=>`<path d="${d}" fill="#edf6f0" stroke="#216e56" stroke-width="3"/>`,label=(x,y,text)=>`<text x="${x}" y="${y}" text-anchor="middle">${E(text)}</text>`;
  let picture='';
  if(task.id==='grid')picture=line('M70 250H470L70 50Z')+line('M70 230h20v20')+label(270,284,m.a)+label(42,150,m.b);
  if(task.id==='practical')picture=line('M100 60H460V240H100Z')+label(280,278,m.a+' см')+label(64,155,'3 см');
  if(task.id==='triangle')picture=line('M70 250H490L280 45Z')+label(280,286,2*m.a)+label(158,132,m.b)+label(402,132,m.b);
  if(task.id==='quadrilateral')picture=line('M55 250H505L405 65H155Z')+label(280,42,m.a)+label(280,286,m.b)+`<path d="M155 65V250m0-20h20v20" fill="none" stroke="#a64f2e" stroke-width="2" stroke-dasharray="5"/>`+label(132,163,'h = '+m.h);
  if(task.id==='circle')picture=`<circle cx="280" cy="150" r="120" fill="#edf6f0" stroke="#216e56" stroke-width="3"/><path d="M184 222H376L280 150V222m0-16h16v16" fill="none" stroke="#a64f2e" stroke-width="3"/>`+label(330,176,'R = '+m.r)+label(245,194,m.d)+label(280,132,'O');
  return picture?`<svg class="task-figure" viewBox="0 0 560 310" role="img" aria-label="Чертёж к условию задачи; заданные длины подписаны">${picture}</svg><p class="muted">Чертёж схематический. Значения берём из условия.</p>`:'';
 }
 function mount(host,context) {
  const {meta,task:t,lesson:l,save,seen,expose,fresh,remediationId}=context,D=root.PathData,M=root.PathPracticeView.math;
  let u=l.taskFirst;
  if(!valid(u)||!u||u.seed!==l.seed) {
   const resumed=!!(l.help||l.step||l.draft||l.note||l.done||l.attempted);
   u=l.taskFirst={version:1,seed:l.seed,finalDraft:[3,4].includes(l.stage)?l.draft:'',stepDraft:l.stage===2?l.draft:'',legacyDraft:l.stage<2?l.draft:'',feedback:'',stepFeedback:'',stepAnswers:t.steps.slice(0,l.step).map(s=>s.a===undefined?'Условия выполнены':root.PathPracticeView.answerText(s)),feedbackKind:'',helpOpen:resumed&&l.stage<3,modelOpen:resumed&&l.stage===1,stepsOpen:resumed&&l.stage===2,whyOpen:false,noteOpen:resumed&&l.stage===4,model:null};
  }
  // A legacy draft belongs to the stage where it was written. Do not promote a
  // guided answer to a final answer when converting the presentation.
  l.stage=3;l.draft=u.finalDraft;
  if(u.helpOpen||u.modelOpen||u.stepsOpen){l.help=true;expose(t);}
  const markHelp=()=>{if(!root.document||!host.isConnected)return;l.help=true;expose(t);save();};
  const currentIndex=D.meta.filter(m=>!m.grade7&&!m.pre7&&m.pos===meta.pos);
  host.innerHTML=`<div class="task-first-course"><a class="back" href="#map">← Все задания</a><div class="task-first-heading"><span class="eyebrow">ЕГЭ 2027 · Базовый уровень · Задание ${meta.pos}</span><h1>${E(meta.title)}</h1></div><section class="panel task-first-problem" aria-label="Условие и ответ"><p class="task">${M(t.q)}</p><div class="task-support">${root.PathPracticeView.markup(t)}${primaryVisual(t)}</div>${inputMarkup(t,'answer',question(t))}<p id="feedback" class="feedback" role="status"></p><details id="taskHelp" class="task-first-help"><summary>Хочешь подсказку?</summary><div class="task-first-help-body">${u.legacyDraft?`<aside class="callout"><strong>Ранее записано</strong><p>${E(u.legacyDraft)}</p><p class="muted">Эта запись сохранена из прежнего урока. Проверь, к какому шагу она относится; в ответ задачи она не подставляется.</p></aside>`:''}<p class="task-first-idea">${M(meta.idea)}</p><details id="taskModel"><summary>Как это увидеть на модели?</summary>${t.model.expansion?`<p>${M(t.model.expansion)}</p>`:''}<div id="model"></div></details><details id="taskSteps"><summary>Помочь решить по шагам?</summary><div id="taskStepsBody"></div>${meta.id==='equations'||D.equationPractice?.has(meta.id)?'<button type="button" id="moreGuided">Ещё похожее уравнение по шагам</button>':''}</details><button type="button" id="returnToAnswer">Вернуться к моему ответу</button></div></details><div class="actions task-first-next"><button id="new" type="button">Другие числа</button><a class="btn" href="#map">Выбрать задание</a></div></section><details id="taskNote" class="task-first-note"><summary>Хочешь объяснить своё решение?</summary><label for="note">Как ты получил ответ и как его проверил?</label><textarea id="note" rows="4"></textarea><p class="muted">Запись сохранится для обсуждения с преподавателем. Автоматическая проверка не оценивает рассуждение.</p></details><details class="task-first-options"><summary>Другие типы и результаты</summary><label for="typeSelect">Какой тип задачи разобрать?</label><select id="typeSelect">${currentIndex.map(m=>`<option value="${m.id}" ${m.id===meta.id?'selected':''}>${E(m.title)}</option>`).join('')}</select><p><a href="#report">Мой отчёт</a> · <a href="../sources/index.html#p${meta.pos}">Источники и границы покрытия</a></p><p class="muted">Это авторские учебные задачи. Помощь, исправление и самостоятельное решение нового условия учитываются отдельно.</p>${context.equationPracticeLinks(meta.id)}${context.fractionPracticeLink(meta.id)}</details></div>`;
  const $=selector=>host.querySelector(selector),help=$('#taskHelp'),model=$('#taskModel'),steps=$('#taskSteps'),note=$('#taskNote');
  const answer=$('#answer');answer.value=u.finalDraft;
  const feedback=(text,bad=false)=>{u.feedback=text;u.feedbackKind=bad?'bad':'good';$('#feedback').innerHTML=M(text);$('#feedback').className='feedback '+u.feedbackKind;save();};
  $('#feedback').innerHTML=M(u.feedback);$('#feedback').className='feedback '+u.feedbackKind;
  function bindChoices(prefix,change) {
   const input=$('#'+prefix),buttons=host.querySelectorAll('[data-'+prefix+'-choice]');
   const redraw=()=>buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute('data-'+prefix+'-choice')===input.value)));
   buttons.forEach(b=>b.onclick=()=>{input.value=b.getAttribute('data-'+prefix+'-choice');change(input.value);redraw();});redraw();
  }
  const writeFinal=value=>{u.finalDraft=value.slice(0,10000);l.draft=u.finalDraft;save();};
  answer.oninput=()=>writeFinal(answer.value);bindChoices('answer',writeFinal);
  $('#answerForm').onsubmit=event=>{
   event.preventDefault();const value=answer.value;
   if(!value.trim())return feedback('Сначала запиши ответ на вопрос задачи.',true);
   if(l.done)return feedback('Этот вариант уже проверен. Возьми другие числа.');
   const ok=D.correct(t,value),independent=!l.attempted&&!l.help&&!seen(t);
   l.attempted=true;expose(t);
   if(ok){l.done=true;if(independent)l.independent++;l.checks=(l.checks||[]).concat({seed:l.seed,correct:true,independent}).slice(-100);feedback(independent?'Верно с первой попытки на новом варианте.':'Верно после помощи, повторного показа или исправления.');}
   else{l.help=true;feedback(root.PathPracticeView.wrongFeedback(t,value,'Пока неверно. Проверь, что нужно найти, знак и единицы. Если трудно, открой подсказку.'),true);root.EgeRemediation.show({id:remediationId(meta),value,expected:t.answer});}
   save();
  };
  let mountedModel=false;
  function mountModel(){
   if(mountedModel)return;
   // Reuse the existing strict model-state validator before returning any saved
   // value to an interactive model. Malformed optional UI state is not executed.
   let saved=null;try{saved=root.PathManagedState.model(u.model,t);}catch{u.model=null;}
   root.PathModels.mount($('#model'),t,{state:saved,onChange:value=>{u.model=value;markHelp();}});
   mountedModel=true;u.model=$('#model').pathModel?.getState()||null;save();
  }
  function renderSteps(){
   const step=t.steps[l.step],body=$('#taskStepsBody');
   body.innerHTML=`<ol class="steps">${t.steps.slice(0,l.step).map((s,index)=>`<li>${M(s.q)} <strong>${M(u.stepAnswers[index]??(s.a===undefined?'Условия выполнены':root.PathPracticeView.answerText(s)))}</strong><p>${M(s.why)}</p></li>`).join('')}</ol>${step?`<h2>Шаг ${l.step+1} из ${t.steps.length}</h2>${inputMarkup(step,'stepAnswer',step.q)}<details id="stepWhy"><summary>Почему именно так?</summary><p>${M(step.why)}</p></details><p id="stepFeedback" class="feedback" role="status">${M(u.stepFeedback)}</p>`:'<h2>Разбор завершён</h2><p>Запиши ответ в поле задачи выше. Чтобы проверить себя самостоятельно, возьми другие числа.</p>'}`;
   if(!step)return;
   const field=$('#stepAnswer');field.value=u.stepDraft;
   const writeStep=value=>{u.stepDraft=value.slice(0,10000);save();};field.oninput=()=>writeStep(field.value);bindChoices('stepAnswer',writeStep);
   $('#stepAnswerForm').onsubmit=event=>{event.preventDefault();const value=field.value;if(!value.trim()){$('#stepFeedback').textContent='Сначала ответь на вопрос этого шага.';return;}markHelp();if(D.correct(step,value)){u.stepAnswers[l.step]=value;l.step++;u.stepDraft='';u.stepFeedback='';u.whyOpen=false;if(l.step===t.steps.length)l.guided++;save();renderSteps();$('#stepAnswer')?.focus({preventScroll:true});}else{u.stepFeedback=root.PathPracticeView.wrongFeedback(step,value,'Проверь этот шаг. '+step.why);$('#stepFeedback').innerHTML=M(u.stepFeedback);$('#stepFeedback').className='feedback bad';root.EgeRemediation.show({id:remediationId(meta),value,expected:step.a});save();}};
   const why=$('#stepWhy');why.open=u.whyOpen;why.querySelector('summary').addEventListener('click',()=>{if(!why.open)markHelp();});why.ontoggle=()=>{if(!root.document||!why.isConnected)return;u.whyOpen=why.open;if(why.open)markHelp();else save();};
  }
  renderSteps();
  const bindDisclosure=(element,key,onOpen)=>{
   element.open=u[key];
   element.querySelector('summary').addEventListener('click',()=>{u[key]=!element.open;if(u[key])markHelp();else save();});
   element.ontoggle=()=>{if(!root.document||!element.isConnected)return;u[key]=element.open;if(element.open){markHelp();onOpen?.();}else save();if(element===help)element.querySelector('summary').textContent=element.open?'Убрать подсказку':'Хочешь подсказку?';};
   if(element.open)onOpen?.();
  };
  bindDisclosure(help,'helpOpen');bindDisclosure(model,'modelOpen',mountModel);bindDisclosure(steps,'stepsOpen');
  help.querySelector('summary').textContent=help.open?'Убрать подсказку':'Хочешь подсказку?';
  $('#returnToAnswer').onclick=()=>{help.open=false;u.helpOpen=false;save();answer.focus({preventScroll:true});answer.scrollIntoView?.({block:'center',behavior:'smooth'});};
  note.open=u.noteOpen;note.ontoggle=()=>{if(!root.document||!note.isConnected)return;u.noteOpen=note.open;save();};$('#note').value=l.note;$('#note').oninput=event=>{l.note=event.target.value.slice(0,10000);save();};
  $('#typeSelect').onchange=event=>context.setHash('lesson='+event.target.value);
  $('#new').onclick=()=>fresh(meta.id);
  if($('#moreGuided'))$('#moreGuided').onclick=()=>{const target=meta.id==='equations'?'equations-linear':meta.id;context.setHash('lesson='+target);fresh(target);host.querySelector('#taskHelp>summary')?.click();host.querySelector('#taskSteps>summary')?.click();};
  save();
 }
 root.PathTaskFirst={mount,valid,question};
})(window);
