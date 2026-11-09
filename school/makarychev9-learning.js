(function(root){
 'use strict';
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const experiments={
  numbers:'Поменяй точное и приближённое значения местами. Предскажи, что случится с абсолютной и относительной погрешностью. Сравни расчёт с расстоянием на модели.',
  graph:'Измени только один коэффициент, остальные оставь прежними. Сначала предскажи движение графика; затем сравни формулу, таблицу и рисунок. Проверь также a=0 и запрещённый аргумент.',
  signs:'Сначала предскажи знак на каждом промежутке и выбери границы. Затем открой пробные точки. Объясни, почему нуль знаменателя нельзя включать даже при нестрогом знаке.',
  systems:'Сначала выбери точку и предскажи, выполнит ли она все условия. Проверь каждое условие отдельно, затем точку на границе. Нарисованная область подсказывает, подстановка доказывает.',
  sequence:'Измени только разность или знаменатель. Предскажи следующие два члена и знаки, затем проверь на модели. Сравни прибавление одного числа с умножением; проверь q=0, 1 и −1.'
 };
 function readable(value,target,M){
  const s=String(value).trim();if(!s)return false;
  if(target.answerFormat==='m9-set')return root.WorkshopM9Math.acceptsSet(s,s,M);
  if(target.answerFormat==='m9-pairs'){const re=/\(\s*([^();]+)\s*;\s*([^();]+)\s*\)/g,parts=[...s.matchAll(re)];return parts.length>0&&!s.replace(re,'').replace(/[;\s,]/g,'')&&parts.every(p=>M.parse(p[1])&&M.parse(p[2]));}
  if(target.answerFormat==='prime-factors')return s.split(/\s*[·×*]\s*/).every(v=>/^\d+$/.test(v));
  if(Array.isArray(target.answer))return s.split(';').every(v=>M.parse(v));
  if(typeof target.answer==='number'||target.answer&&typeof target.answer==='object'||typeof target.answer==='string'&&M.parse(target.answer))return !!M.parse(s);
  return true;
 }
 function render(lesson,task,draft){
  const inquiry=draft.inquiry||{};
  return '<section class="panel m9-inquiry"><p class="eyebrow">Короткий цикл · 10–15 минут</p><h2>Предскажи → проверь → объясни</h2><label for="m9-prediction">'+esc(lesson.reflect[0])+'</label><textarea id="m9-prediction" maxlength="2000" rows="2" placeholder="Сначала запиши своё предположение">'+esc(inquiry.prediction)+'</textarea><details><summary>Небольшой опыт в лаборатории</summary><p>'+esc(experiments[task.model.family])+'</p><p class="tiny">Лаборатория — отдельный опыт; её параметры не заменяют условие задачи.</p></details><label for="m9-explanation">Что подтвердилось? Запиши проверку или контрпример.</label><textarea id="m9-explanation" maxlength="2000" rows="2" placeholder="Например: подставил значение, сравнил стороны…">'+esc(inquiry.explanation)+'</textarea><p class="tiny">Записи сохраняются для обсуждения. Текст объяснения автоматически не оценивается; верный итог сам по себе не подтверждает ход рассуждения.</p></section>';
 }
 function checkpoint(state,session,now){
  if(!session||!session.task.m9Full||session.diagnostic)return;
  state.m9Drafts=state.m9Drafts||{};
  const old=state.m9Drafts[session.id];if(old&&(old.seed!==session.seed||old.mode!==session.mode)&&(old.input||old.attempt||old.inquiry?.prediction||old.inquiry?.explanation)){state.m9History=state.m9History||[];state.m9History.push(JSON.parse(JSON.stringify(old)));if(state.m9History.length>30)state.m9History.shift();}
  state.m9Drafts[session.id]={skill:session.id,mode:session.mode,seed:session.seed,prompt:session.task.prompt,step:session.step,attempt:session.attempt,assisted:session.assisted,exposed:session.exposed,correct:session.correct,input:session.savedInput||'',message:session.message||'',checkIndex:session.checkIndex||0,hintLevels:session.hintLevels||{},inquiry:session.inquiry||{},answers:session.answers||[],attemptLog:session.attemptLog||[],firstAttempt:session.firstAttempt||null,modelState:session.modelState||null,time:now};
 }
 function restore(state,id,M){
  const d=state.m9Drafts&&state.m9Drafts[id];if(!d)return null;
  const task=M.generate(id,d.seed);if(task.prompt!==d.prompt||d.step>task.steps.length)return null;
  const target=d.mode==='learn'?(task.steps[d.step]||task):task;
  return {id,mode:d.mode,seed:d.seed,task,step:d.step,attempt:d.attempt,assisted:d.assisted,exposed:d.exposed,correct:d.correct&&M.accepts(d.input,target),savedInput:d.input,message:d.message,claimAnswered:false,diagnostic:null,checkIndex:d.checkIndex,hintLevels:d.hintLevels,inquiry:d.inquiry,answers:d.answers,attemptLog:d.attemptLog,firstAttempt:d.firstAttempt,modelState:d.modelState};
 }
 function bind(main,lesson,session,save,M,answerText){
  const panel=main.querySelector('#task-panel'),head=main.querySelector('.lesson-head');
  // Keep the course return and mode choice above the problem. Secondary actions
  // follow the task, so the pupil sees the question and answer on a narrow screen.
  main.dataset.m9Lesson='true';
  if(panel&&head){
   head.after(panel);
   const utility=main.ownerDocument.createElement('div');utility.className='row m9-lesson-tools';
   const modes=head.querySelector('[data-cmd="mode"]')?.parentElement;
   if(modes){modes.classList.add('m9-mode-controls');for(const button of modes.querySelectorAll('[data-cmd="mode"]')){const full=button.textContent;button.setAttribute('aria-label',full);button.title=full;button.textContent={learn:'Разбор',practice:'Практика',check:'Самому'}[button.dataset.value]||full;}const board=modes.querySelector('a[href*="trainer-board.html?trainer="]');if(board)utility.append(board);}
   const jumps=head.querySelector('.lesson-jumps');if(jumps)utility.append(jumps);
   if(utility.childNodes.length)panel.after(utility);
   const back=head.querySelector('a[href="#course/makarychev9"]');if(back){back.title=back.textContent;back.textContent='← Макарычев 9';}
   const eyebrow=head.querySelector('.eyebrow');if(eyebrow){eyebrow.classList.remove('section');eyebrow.textContent=({learn:'Разбираемся',practice:'Тренировка',check:'Самостоятельная проверка',review:'Повторение',diagnostic:'Диагностика'}[session.mode]||'Занятие')+' · пункт '+lesson.point;}
  }
  const theory=main.querySelector('.v6-theory');if(theory){const details=main.ownerDocument.createElement('details');details.className='panel';details.innerHTML='<summary>Коротко о главном и разобранный пример</summary>';theory.before(details);details.append(theory);}
  if(session.mode==='learn'){
   const model=main.querySelector('#model');if(model){model.insertAdjacentHTML('beforebegin',render(lesson,session.task,session));const details=main.ownerDocument.createElement('details');details.className='panel m9-model-details';details.innerHTML='<summary>Исследовать на модели</summary>';model.before(details);details.append(model);}
   const modelDetails=main.querySelector('.m9-model-details');if(modelDetails)modelDetails.addEventListener('toggle',()=>{if(modelDetails.open&&!session.inquiry?.prediction){const prediction=main.querySelector('#m9-prediction');prediction.placeholder='Перед опытом запиши прогноз — так удобнее сравнить с результатом.';}});
   for(const key of ['prediction','explanation']){const el=main.querySelector('#m9-'+key);if(el)el.oninput=()=>{session.inquiry=session.inquiry||{};session.inquiry[key]=el.value.slice(0,2000);save();};}
  }
  const input=main.querySelector('#answer');if(input)input.oninput=()=>{session.savedInput=input.value.slice(0,2000);save();};
  if(session.mode==='learn'&&session.step){const history=main.querySelector('.v6-history');if(history)history.open=true;}
  const helper=main.querySelector('#help');const level=session.hintLevels&&(session.hintLevels[session.mode==='learn'?session.step:'check']||0);
  if(helper&&level){const part=session.mode==='learn'?(session.task.steps[session.step]||session.task):session.task.steps[0],hints=part.hints||[part.why,part.prompt];helper.innerHTML='<div class="helper"><b>Сохранённая помощь · уровень '+level+'</b><p>'+esc(hints[0]||part.why)+'</p>'+(level>=2?'<p>'+esc(hints[1]||part.prompt)+'</p>':'')+(level>=3?'<p>Ответ этого шага: <b>'+esc(answerText(part))+'</b></p>':'')+'<p class="tiny">Помощь учтена. Для самостоятельной проверки возьми новое условие.</p></div>';}
  if(session.attempt>=2&&!session.correct&&helper&&!level)helper.innerHTML='<p class="tiny">Две попытки сохранены. Открой подсказку к этому шагу или вернись к основе — потом проверь себя на новом условии.</p>';
  if(panel&&session.firstAttempt){panel.insertAdjacentHTML('beforeend','<details class="m9-attempt-history"><summary>Мои попытки и помощь</summary><p>Первая запись: '+esc(session.firstAttempt.value)+' · '+(session.firstAttempt.assisted?'с помощью':'без помощи')+'</p><ol>'+(session.attemptLog||[]).map(e=>'<li>'+esc(e.value)+' — '+(e.kind==='format'?'уточнение записи':e.correct?'верно':'нужно исправить')+(e.assisted?' · помощь':'')+'</li>').join('')+'</ol><p class="tiny">Показаны последние 20 отправок; первая запись сохранена отдельно. Прежние условия есть в резервной копии (до 30 последних).</p></details>');}
  if(session.correct&&panel){panel.insertAdjacentHTML('beforeend','<p class="tiny">'+(session.mode==='learn'?'Разбор сохраняет все выполненные шаги.':'Проверен ответ; собственное объяснение можно обсудить с преподавателем.')+'</p>'+((session.assisted||session.attempt>1||session.mode==='practice')?'<button type="button" data-cmd="mode" data-value="check">Новое условие без помощи →</button>':''));}
 }
 function summary(state,ids,now){
  const wanted=new Set(ids),events=state.events.filter(e=>wanted.has(e.skill)),due=ids.filter(id=>state.skills[id]&&state.skills[id].nextReview>0&&state.skills[id].nextReview<=now);
  return {independent:events.filter(e=>e.correct&&e.independent).length,assisted:events.filter(e=>e.correct&&e.assisted).length,corrected:events.filter(e=>e.correct&&!e.assisted&&e.attempt>1).length,practice:events.filter(e=>e.correct&&e.mode==='practice').length,due};
 }
 const API={readable,render,checkpoint,restore,bind,summary,experiments};root.WorkshopM9Learning=API;if(typeof module!=='undefined')module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
