/* Route page and finite six-question sessions. Source trainers keep their own saves. */
(function(){
'use strict';
const C=window.FoundationRoutesCore,catalog=window.FoundationRoutes,$=id=>document.getElementById(id);
if(!C||!catalog)return;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage;try{storage=window.localStorage;}catch(_){}
const store=window.FoundationRouteStore.create(catalog,storage);
const labels={practice:'Короткая практика','check-a':'Проверка А','check-b':'Проверка Б'};
let current=null,sessionId=null,lastFocused=null;
const context=new URLSearchParams(location.search),query=context.toString();
function routeURL(id,extra){return 'route.html'+(query?'?'+query:'')+'#'+id+(extra?'?'+extra:'');}
function mapURL(group){return './'+(query?'?'+query:'')+'#topic='+group;}
function warn(){const s=store.read(),node=$('storage-notice');node.hidden=!s.notice;node.textContent=s.notice;return s;}
function contextBack(){
 const nav=$('exam-back');if(context.get('from')==='ege'){const p=new URLSearchParams();for(const [from,to] of [['skill','skill'],['module','from']]){const v=context.get(from);if(v&&/^[a-z0-9-]{1,60}$/.test(v))p.set(to,v);}nav.href='/ege-baza/#foundation'+(p.size?'?'+p:'');nav.textContent='← К теме ЕГЭ база';}
 else if(context.get('from')==='oge'&&/^(?:oge-(?:[6-9]|1[0-9]|2[0-5])|practical-[a-z-]+)$/.test(context.get('skillMap')||'')){const id=context.get('skillMap'),node=context.get('node');nav.href='/oge/skills/#'+id+(node&&/^[a-z][a-z0-9-]{1,80}$/.test(node)?'?node='+node:'');nav.textContent='← К шагу ОГЭ';}
 else{nav.href='/trainers/oge-course/';nav.textContent='← К курсу ОГЭ';}
}
const figure=window.FoundationRouteVisuals.figure;
function routeState(route){return store.summary()[route.id];}
function resourceVisits(route){let entries={};try{const raw=storage?.getItem(C.PREFIX+'visits.'+route.id);if(raw){const p=JSON.parse(raw);if(p.version===1&&p.entries&&typeof p.entries==='object')entries=p.entries;}}catch(_){}return entries;}
function markResource(route,index){const entries=resourceVisits(route);entries[index]=Date.now();try{storage?.setItem(C.PREFIX+'visits.'+route.id,JSON.stringify({version:1,entries}));}catch(_){}}
function renderMap(route,choice){
 const summary=routeState(route),visits=resourceVisits(route);const stages=route.trainers.map((t,i)=>({href:routeURL(route.id,'trainer='+i),title:t.title,note:t.kind+' · '+(visits[i]?'открывали':'попробовать'),active:choice.trainer===i}));
 stages.push(...C.MODES.map(mode=>({href:routeURL(route.id,'session='+mode),title:labels[mode],note:'6 заданий'+(summary.sessions.some(s=>s.mode===mode&&s.finished)?' · завершали':''),active:choice.mode===mode})));
 $('route-map').innerHTML=stages.map((step,i)=>'<li'+(step.active?' class="current"':'')+'><a href="'+E(step.href)+'"'+(step.active?' aria-current="step"':'')+'><span class="step-dot">'+(i+1)+'</span><span><b>'+E(step.title)+'</b><small>'+E(step.note)+'</small></span></a></li>').join('');
 const data=warn();$('route-status').textContent=!data.reliable?'Прогресс сейчас не подтверждён.':summary.verified?'Проверка: 6 из 6 самостоятельно на новых вопросах.':summary.practice?'Учебная порция выполнена. Следующий шаг — самостоятельная проверка.':summary.started?'Есть начатая работа. Все шаги доступны.':'Можно начать с модели или сразу проверить себя.';
 const group=catalog.groups.find(g=>g.id===route.group),i=group.routes.indexOf(route);$('group-position').textContent=(i+1)+' из '+group.routes.length+' маршрутов · '+group.title;
 $('all-topics').href=mapURL(route.group);
 const prereqs=[...new Set((route.prerequisites||[]).map(id=>catalog.byItem[id]).filter(r=>r&&r.id!==route.id))];
 $('prerequisites').hidden=!prereqs.length;
 $('prerequisite-links').innerHTML=prereqs.map(r=>'<a href="'+E(routeURL(r.id))+'">'+E(r.title)+' →</a>').join('');
}
function nextRoute(route){const i=catalog.routes.indexOf(route);return catalog.routes[i+1]||null;}
function renderOverview(route){
 const s=routeState(route),next=s.unfinished;
 $('workspace').innerHTML='<section class="route-intro"><p class="eyebrow">ОДИН НАВЫК · НЕСКОЛЬКО ПОДХОДОВ</p><h2>Как пройти этот маршрут</h2><ol class="plan-list"><li>Попробуй модель и объяснение по шагам. У каждого тренажёра есть короткое задание.</li><li>Выполни учебную порцию: <b>6 вопросов</b>. Можно пользоваться подсказками.</li><li>Проверь себя на <b>6 других вопросах</b>. Если понадобится помощь, останется второй набор.</li></ol><div class="actions"><a class="button primary" href="'+E(routeURL(route.id,'trainer=0'))+'">Начать с модели →</a><a class="button" href="'+E(routeURL(route.id,'session='+(next?next.mode:'practice')))+'">'+(next?'Продолжить начатое':'К короткой практике')+'</a><a class="button quiet" href="'+E(routeURL(route.id,'session=check-a'))+'">Сразу проверить себя</a></div><p class="small">Открытие тренажёра отмечает только посещение. Зелёная отметка появится после отдельной самостоятельной проверки новых вопросов; она относится к этому небольшому навыку.</p></section>';
}
function renderTrainer(route,index){
 const trainer=route.trainers[index];if(!trainer)return renderOverview(route);
 markResource(route,index);
 const next=index+1<route.trainers.length?'trainer='+(index+1):'session=practice';
 $('workspace').innerHTML='<section class="trainer-workspace"><div class="resource-instruction"><p class="eyebrow">'+E(trainer.kind)+'</p><h2>'+E(trainer.title)+'</h2><p>'+E(trainer.instruction)+'</p><p class="finish-rule"><b>Когда закончить:</b> '+E(trainer.finish)+'</p><div class="actions"><a class="button primary" href="'+E(routeURL(route.id,next))+'">К следующему шагу →</a><a class="button" href="'+E(trainer.href)+'" target="_blank" rel="noopener">Открыть тренажёр отдельно ↗</a></div><p class="small">Здесь сохраняются результаты самого тренажёра, если он это поддерживает. Открытие этой страницы не засчитывает самопроверку маршрута.</p></div><iframe id="trainer-frame" src="'+E(trainer.href)+'" title="'+E(trainer.title)+'" loading="eager" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe><p class="small">Карта и кнопка возврата остаются над тренажёром. Если места мало, открой его отдельно.</p></section>';
}
function history(route,state){
 const qs=C.questions(route,state.mode),done=state.items.filter(i=>i.correct);if(!done.length)return'';
 return'<details class="completed-work" open><summary>Мои выполненные шаги · '+done.length+'</summary><ol>'+state.items.map((item,i)=>item.correct?'<li><span>'+E(qs[i].prompt)+'</span><b>Мой ответ: '+E(item.value)+'</b><small>'+(item.help?'С помощью':item.errors?'После исправления':item.repeated?'Знакомый вопрос':'С первого раза без помощи')+'</small><details><summary>Почему так</summary><p>'+E(qs[i].explanation)+'</p></details></li>':'').join('')+'</ol></details>';
}
function result(route,state){
 const s=routeState(route),data=warn(),next=nextRoute(route),fresh=state.independent;
 let headline=state.mode==='practice'?'Учебная порция закончена':state.verified&&data.reliable?'Самостоятельная проверка пройдена':state.repeated?'Повтор знакомого набора завершён':'Проверка разобрана';
 let note=!data.reliable?'В этой вкладке были трудности с сохранением. Работа показана ниже, но самостоятельный результат сейчас не подтверждён.':state.mode==='practice'?'Теперь попробуй новые вопросы без помощи.':state.verified?'Все 6 новых вопросов решены с первого раза без подсказок.':state.repeated?'Это знакомые условия. Повтор полезен для тренировки и не выдаётся за новую независимую проверку.':'Ошибки и помощь сохранены отдельно. Вернись к трудному шагу, затем попробуй другой набор.';
 const other=state.mode==='check-a'?'check-b':'check-a',otherDone=s.sessions.some(x=>x.mode===other&&x.finished);
 $('workspace').innerHTML='<section class="session-result" aria-labelledby="result-title"><p class="eyebrow">ЕСТЬ ЗАВЕРШЕНИЕ</p><h2 id="result-title" tabindex="-1">'+headline+'</h2><div class="result-stats"><div><b>6 / 6</b><span>разобрано</span></div><div><b>'+fresh+' / 6</b><span>новых · с первого раза без помощи</span></div><div><b>'+state.assisted+'</b><span>с помощью или исправлением</span></div></div><p>'+note+'</p><div class="actions">'+(state.mode==='practice'?'<a class="button primary" href="'+E(routeURL(route.id,'session=check-a'))+'">Проверка: 6 новых вопросов →</a>':!state.verified&&!otherDone?'<a class="button primary" href="'+E(routeURL(route.id,'session='+other))+'">Другой проверочный набор →</a>':'')+(next?'<a class="button" href="'+E(routeURL(next.id))+'">Следующий маршрут: '+E(next.title)+' →</a>':'<a class="button primary" href="'+E(mapURL(route.group))+'">Вернуться к общей карте →</a>')+'<button class="button quiet" id="repeat-set" type="button">Повторить этот знакомый набор</button></div>'+((s.checkedSets.length===2&&!s.verified)?'<p class="notice">Оба проверочных набора уже знакомы. Можно повторять их и работать с разными тренажёрами; повтор не заменяет новую самостоятельную проверку с учителем.</p>':'')+history(route,state)+'<p class="small">Результат хранится в этом браузере. Он не отправляется в кабинет автоматически. Проверка относится к вопросам этого маршрута, а не ко всему экзамену.</p></section>';
 $('repeat-set').addEventListener('click',()=>{sessionId=store.start(route.id,state.mode,true);renderSession(route,state.mode,sessionId);});
 $('result-title').focus({preventScroll:true});
}
function waitingForSave(route,mode){
 $('workspace').innerHTML='<section class="question-card"><h2>Сохранение проверки приостановилось</h2><p>Не удаётся записать ответы и отметки помощи. Незавершённая работа остаётся в этой вкладке. Пока можно перейти к учебной порции.</p><div class="actions"><button class="button primary" id="retry-save" type="button">Повторить сохранение</button><a class="button" href="'+E(routeURL(route.id,'session=practice'))+'">К учебной порции →</a></div></section>';
 $('retry-save').onclick=()=>{store.flush();window.history.replaceState(null,'',routeURL(route.id,'session='+mode));renderSession(route,mode,sessionId);};warn();
}
function missingSession(route){renderOverview(route);$('peer-notice').hidden=false;$('peer-notice').textContent='Прежняя попытка была удалена в другой вкладке. Выбери шаг, чтобы начать новую работу.';}
function renderSession(route,mode,id){
 sessionId=id||store.start(route.id,mode,false);let state=store.get(sessionId);if(!state)return missingSession(route);
 if(mode!=='practice'&&store.read().pending)return waitingForSave(route,mode);
 if(state.finished)return result(route,state);
 if(state.complete){$('workspace').innerHTML='<section class="question-card"><h2>Все 6 вопросов выполнены</h2><button class="button primary" id="finish-session" type="button">Посмотреть результат →</button>'+history(route,state)+'</section>';$('finish-session').onclick=()=>{state=store.act(sessionId,'finish');if(!state)return missingSession(route);result(route,state);renderMap(route,{mode});};return;}
 const qs=C.questions(route,mode),q=qs[state.index];state=store.act(sessionId,'view',q.id);if(!state)return missingSession(route);if(state.finished||state.complete||qs[state.index].id!==q.id)return renderSession(route,mode,sessionId);if(mode!=='practice'&&store.read().pending)return waitingForSave(route,mode);const item=state.items[state.index],draft=store.getDraft(sessionId,q.id);
 $('workspace').innerHTML='<section class="question-card" aria-labelledby="question-title"><div class="question-top"><span>'+E(labels[mode])+'</span><b>Вопрос '+(state.index+1)+' из 6</b></div><progress max="6" value="'+state.index+'" aria-label="Выполнено вопросов"></progress><h2 id="question-title" tabindex="-1">'+E(q.prompt)+'</h2>'+figure(q.visual)+'<form id="answer-form" novalidate>'+(q.input==='choice'?'<fieldset class="answer-choices"><legend>Выбери один ответ</legend>'+q.choices.map((option,i)=>'<label><input type="radio" name="answer" value="'+E(option)+'"'+(draft===option?' checked':'')+'><span>'+E(option)+'</span></label>').join('')+'</fieldset>':'<label class="answer-label" for="route-answer">Твой ответ<input id="route-answer" name="answer" type="text" inputmode="text" autocomplete="off" maxlength="100" value="'+E(draft)+'" aria-describedby="answer-format"></label><p class="small" id="answer-format">'+E(q.answerFormat==='decimal'?'Запиши десятичную дробь с запятой или точкой.':q.answerFormat==='fraction'?'Запиши одну дробь a/b.'+(q.requireReduced?' Сократи её до несократимой.':''):'Можно ввести целое число, десятичную дробь с запятой или точкой, дробь 3/4 или смешанное число 1 1/2.')+'</p>')+'<div class="actions"><button class="button primary" id="check-answer" type="submit">Проверить</button><button class="button" id="show-hint" type="button">Хочешь подсказку?</button><button class="button quiet" id="show-solution" type="button"'+(!item.help?' hidden':'')+'>Разобрать до ответа</button></div></form><div id="answer-feedback" class="feedback" role="status" aria-live="polite">'+(item.errors?'В этом вопросе уже было исправление. Можно продолжить с того же места.':'')+'</div><div id="question-hint" class="help-box"'+(!item.help?' hidden':'')+'><b>Подсказка</b><p>'+E(q.hint)+'</p></div><div id="question-solution" class="help-box"'+(!item.revealed?' hidden':'')+'><b>Разбор</b><p>'+E(q.explanation)+'</p><p>После разбора этот вопрос учитывается как работа с помощью.</p></div><button id="next-question" class="button primary next-question" type="button" hidden>Дальше →</button><p class="small help-accounting">'+(item.repeated?'Этот вопрос уже встречался в другой попытке. Он остаётся тренировкой.':mode==='practice'?'Это учебная порция: помощь разрешена.':'Подсказка доступна и здесь. При её открытии сохраним работу как выполненную с помощью.')+'</p>'+history(route,state)+'</section>';
 const form=$('answer-form'),feedback=$('answer-feedback');
 function answer(){return q.input==='choice'?(form.querySelector('input[name="answer"]:checked')?.value||''):$('route-answer').value;}
 form.addEventListener('input',()=>{store.setDraft(sessionId,q.id,answer());warn();});
 form.addEventListener('change',()=>{store.setDraft(sessionId,q.id,answer());warn();});
 function accepted(updated){
  feedback.className='feedback success';feedback.textContent='Верно. '+(updated.items.find(x=>x.id===q.id).help?'Этот вопрос разобран с помощью.':'Ответ сохранён.');
  form.querySelectorAll('input,button').forEach(n=>n.disabled=true);
  const next=$('next-question');next.hidden=false;next.textContent=updated.complete?'Завершить и увидеть результат →':'Следующий вопрос →';next.focus({preventScroll:true});
  next.onclick=()=>{if(!store.get(sessionId)){renderOverview(route);$('peer-notice').hidden=false;$('peer-notice').textContent='Прежняя попытка была удалена в другой вкладке. Выбери шаг, чтобы начать новую работу.';return;}if(updated.complete){const finished=store.act(sessionId,'finish');if(!finished)return missingSession(route);result(route,finished);}else renderSession(route,mode,sessionId);renderMap(route,{mode});};
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();const value=answer(); // Capture before reconciling another tab.
  if(!value.trim()){feedback.textContent='Сначала введи или выбери ответ.';return;}
  if(q.input!=='choice'&&!C.parseNumber(value)){feedback.textContent='Не получилось прочитать число. Например: −3, 0,75 или 3/4. Ноль в знаменателе недопустим.';return;}
  store.setDraft(sessionId,q.id,value);store.flush();if(mode!=='practice'&&store.read().pending)return waitingForSave(route,mode);const before=store.get(sessionId);
  if(!before){feedback.textContent='Прежняя попытка была удалена. Вернись к карте маршрута и начни новое занятие.';return;}
  if(before.items.find(x=>x.id===q.id)?.correct){accepted(before);feedback.textContent='Этот шаг уже решён в другой вкладке. Показан сохранённый результат; новый ввод здесь не проверялся.';return;}
  const updated=store.act(sessionId,'submit',q.id,value);if(!updated)return missingSession(route);const answerState=updated.items.find(x=>x.id===q.id);
  if(mode!=='practice'&&store.read().pending)return waitingForSave(route,mode);
  if(answerState.correct){accepted(updated);if(!C.correct(q,value))feedback.textContent='Этот шаг уже решён в другой вкладке. Показан сохранённый результат; новый ввод здесь не проверялся.';}
  else{feedback.className='feedback';feedback.textContent=C.formatProblem(q,value)||'Пока не сходится. Проверь условие и своё действие. Ответ можно исправить.';if(answerState.errors>=2){store.act(sessionId,'hint',q.id);if(mode!=='practice'&&store.read().pending)return waitingForSave(route,mode);$('question-hint').hidden=false;$('show-solution').hidden=false;feedback.textContent+=' Подсказка открыта ниже; помощь будет учтена.';}}
  warn();
 });
 $('show-hint').onclick=()=>{store.act(sessionId,'hint',q.id);if(mode!=='practice'&&store.read().pending)return waitingForSave(route,mode);$('question-hint').hidden=false;$('show-solution').hidden=false;feedback.textContent='Подсказка открыта. Попробуй закончить вычисление сам.';warn();};
 $('show-solution').onclick=()=>{store.act(sessionId,'reveal',q.id);if(mode!=='practice'&&store.read().pending)return waitingForSave(route,mode);$('question-hint').hidden=false;$('question-solution').hidden=false;feedback.textContent='Разбор открыт; ответ остаётся за тобой.';warn();};
 $('question-title').focus({preventScroll:true});warn();
}
function parse(){
 const raw=location.hash.slice(1),cut=raw.indexOf('?'),id=cut<0?raw:raw.slice(0,cut),p=new URLSearchParams(cut<0?'':raw.slice(cut+1));
 const mode=C.MODES.includes(p.get('session'))?p.get('session'):null,trainer=/^\d{1,2}$/.test(p.get('trainer')||'')?Number(p.get('trainer')):null;
 return{id,mode,trainer};
}
function render(){
 const choice=parse(),route=catalog.byId[choice.id];
 if(current&&sessionId&&(choice.trainer!==null||choice.id!==current.id)){const previous=store.get(sessionId);if(previous&&!previous.finished&&!previous.complete&&previous.mode!=='practice'){const q=C.questions(current,previous.mode)[previous.index];store.act(sessionId,'hint',q.id);if(store.read().pending)return waitingForSave(current,previous.mode);}}
 current=route;sessionId=null;
 if(!route){$('route-heading').textContent='Выбери маршрут';$('route-goal').textContent='Все темы открыты. Можно начать с нужного навыка.';$('route-map').innerHTML='';$('workspace').innerHTML='<section class="route-intro"><h2>Разделы курса</h2><div class="route-grid">'+catalog.groups.map(g=>'<a class="mini-route" href="'+E(mapURL(g.id))+'"><b>'+E(g.title)+'</b><span>'+g.routes.length+' маршрутов →</span></a>').join('')+'</div></section>';return;}
 $('route-heading').textContent=route.title;$('route-goal').textContent=route.goal;document.title=route.title+' — маршрут базовой математики | MathExam';
 if(choice.mode)renderSession(route,choice.mode);else if(choice.trainer!==null&&route.trainers[choice.trainer])renderTrainer(route,choice.trainer);else renderOverview(route);
 renderMap(route,choice);$('route-error').hidden=true;
}
contextBack();render();window.addEventListener('hashchange',()=>{render();$('route-heading').focus({preventScroll:true});});
window.addEventListener('storage',e=>{if(e.key===null||e.key.startsWith(C.PREFIX)){const state=store.read();const n=$('peer-notice');n.hidden=false;n.textContent=state.notice||'Есть изменения в другой вкладке. При следующем действии они будут учтены; введённый здесь ответ сохранён.';}});
window.addEventListener('pageshow',()=>{warn();if(current)renderMap(current,parse());});
window.FoundationRoutePage={figure,render}; // Deterministic browser QA, no answers/actions shortcut.
})();
