(function(){'use strict';
const C=STEREO_COURSE, PROOFS=STEREO_PROOFS;
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=document.getElementById('app'), notice=document.getElementById('storage-notice');
const store=StereoStore.open(C.units.map(u=>u.id),message=>{notice.hidden=false;if(notice.querySelector('[data-recovery-drafts]')){const p=document.createElement('p');p.textContent=message;notice.append(p);}else notice.textContent=message;});
let unit=null, record=null, viewer=null, taskViewer=null, proofViewer=null, stage=4, timer=null, pending=null, conflict=false;
const helpFields={'task-help':'helpOpen','task-theory':'theoryOpen','task-guide':'guideOpen','task-source':'sourceOpen','answer-format':'formatOpen'};
const REVIEW_DELAY=24*60*60*1000;
const foundation=u=>u.chapter<=2;
const taskKey=t=>JSON.stringify([t.q,t.a]);
function snapshotCamera(){if(record?.taskFirst&&taskViewer)record.taskFirst.camera=taskViewer.getState();if(record?.taskFirst&&proofViewer)record.taskFirst.proofCamera=proofViewer.getState();}
function save(event){
 clearTimeout(timer);if(!unit||!record)return true;if(conflict)return false;
 snapshotCamera();record.stage=stage;const result=store.put(unit.id,record,event,record.updated);
 if(result?.status==='conflict'){showConflict();return false;}
 if(result?.status==='saved')record.updated=result.record.updated;
 return true;
}
function ensureCurrent(){
 if(!unit||!record)return true;if(conflict)return false;
 if(store.get(unit.id).updated!==record.updated){showConflict();return false;}
 return true;
}
function showConflict(){
 clearTimeout(timer);if(conflict)return;conflict=true;
 const t=task(),p=proof(),condition=root.dataset.condition||t.q,writtenCondition=root.dataset.proofCondition||(p?p.given+' '+p.goal:unit.investigate),older=[...notice.querySelectorAll('[data-recovery-drafts]')].map(el=>el.outerHTML).join(''),main=document.getElementById('answer')?.value??record.taskFirst.mainDraft,step=document.getElementById('step-answer')?.value??record.taskFirst.stepDraft;
 const written=document.getElementById('written')?.value??record.written,observation=document.getElementById('observation')?.value??record.observation;
 notice.hidden=false;notice.innerHTML='<strong>В другом окне уже сохранена новая работа по этой теме.</strong><p>Чтобы не затереть её, это окно приостановлено. Твои записи остались ниже: их можно скопировать. Они не переносятся в другое условие автоматически.</p>'+older+'<details data-recovery-drafts open><summary>Записи из этого окна</summary><p><strong>Условие:</strong> '+E(condition)+'</p><label>Ответ на задачу<textarea readonly>'+E(main)+'</textarea></label><label>Промежуточный ответ<textarea readonly>'+E(step)+'</textarea></label>'+(written?'<p><strong>Условие письменной работы:</strong> '+E(writtenCondition)+'</p><label>Моё рассуждение<textarea readonly>'+E(written)+'</textarea></label>':'')+(observation?'<label>Наблюдение в лаборатории<textarea readonly>'+E(observation)+'</textarea></label>':'')+'</details><p><button data-recover-latest class="primary">Открыть сохранённую версию</button></p><p>Эти записи останутся здесь и после открытия новой версии.</p>';
 root.querySelectorAll('button,select').forEach(el=>el.disabled=true);
 root.querySelectorAll('input,textarea').forEach(el=>el.readOnly=true);
 notice.scrollIntoView({block:'start'});
}
notice.addEventListener('click',event=>{
 const button=event.target.closest('[data-recover-latest]');if(!button)return;
 destroyViewers();conflict=false;record=store.get(unit.id);migrateUI();stage=record.stage;
 render();if(!conflict){button.remove();notice.querySelector('strong').textContent='Сохранённая версия открыта. Записи прежнего окна доступны ниже.';}
});
window.addEventListener('storage',event=>{if(event.key===StereoStore.KEY&&unit&&record)ensureCurrent();});
function later(){clearTimeout(timer);timer=setTimeout(()=>save(),180);}
function destroyViewers(){snapshotCamera();viewer?.destroy();taskViewer?.destroy();proofViewer?.destroy();viewer=null;taskViewer=null;proofViewer=null;}
window.addEventListener('pagehide',()=>save());
function setHash(value){history.replaceState(null,'','#'+value);}
function home(){if(!save())return;destroyViewers();unit=null;record=null;setHash('');window.scrollTo(0,0);const all=store.all().units;root.innerHTML='<section class="stereo-hero"><div><p class="eyebrow">Атанасян · 10–11 классы · 2024</p><h1>Увидеть пространство.<br>Построить доказательство.</h1><p class="lead">Вращай тела, двигай точки на рёбрах, создавай секущие плоскости. Разбирайся, откуда берутся углы, расстояния и объёмы.</p><div class="row"><button class="primary" data-unit="sections">Попробовать сечения →</button><button data-unit="space">Начать с основ</button></div><div class="stats"><div class="stat"><strong>39</strong><span>учебных узлов</span></div><div class="stat"><strong>99</strong><span>пунктов в карте</span></div><div class="stat"><strong>3D</strong><span>зависимые построения</span></div></div></div><div class="hero-art"><svg viewBox="0 0 400 330" aria-hidden="true"><path data-hero-fill="section" d="M65 160L235 220L345 130L180 95Z" fill="#eeb66d55" stroke="none"/><path data-hero-lines="body-hidden" d="M65 240L180 165L345 210M180 165L180 20" fill="none" stroke="#95cbbb" stroke-width="2.5" stroke-dasharray="6 5"/><path data-hero-lines="section-hidden" d="M65 160L180 95L345 130" fill="none" stroke="#f0bd76" stroke-width="2.5" stroke-dasharray="6 5"/><path data-hero-lines="body-visible" d="M65 240L235 290L345 210M65 240L65 85L180 20L345 70L345 210M65 85L235 135L345 70M235 135L235 290" fill="none" stroke="#95cbbb" stroke-width="2.5"/><path data-hero-lines="section-visible" d="M65 160L235 220L345 130" fill="none" stroke="#f0bd76" stroke-width="2.5"/><g fill="#ffdf97"><circle cx="65" cy="160" r="7"/><circle cx="235" cy="220" r="7"/><circle cx="345" cy="130" r="7"/></g></svg></div></section><section class="panel"><p>В основе — реальная пространственная геометрия. Ракурс можно менять, но длины, углы и условия задачи от этого не меняются. Карта включает введение, семь глав стереометрии и углублённую планиметрию из присланного учебника.</p><p class="muted">В каждом узле — объяснение, исследование, основной тип задачи и место для собственного рассуждения. Это не решебник всех упражнений. Звёздочкой отмечены узлы, полностью относящиеся к углублённому материалу; в остальных могут встречаться отдельные дополнительные пункты.</p></section><div class="filters"><input id="course-search" type="search" placeholder="Найти сечения, объёмы, векторы…" aria-label="Найти тему"><button data-action="reports">Работы учеников</button><label>Восстановить прогресс<input id="import" type="file" accept=".json,application/json"></label></div>'+C.chapters.map((title,i)=>'<section class="chapter"><div class="chapter-head"><span class="chapter-number">'+(i?'ГЛАВА '+i:'ВВЕДЕНИЕ')+'</span><h2>'+E(title)+'</h2></div>'+chapterProgress(i,all)+'<div class="cards">'+C.units.filter(u=>u.chapter===i).map(u=>'<article class="card"><p class="eyebrow">Пункты '+u.points.join(', ')+(u.advanced?' · ★ Углубление':'')+'</p><h3>'+E(u.title)+'</h3><p>'+E(u.investigate)+'</p><div class="card-bottom"><span class="status">'+topicStatus(u,all[u.id])+'</span><button data-unit="'+u.id+'">Открыть →</button></div></article>').join('')+'</div></section>').join('');}
function migrateUI(){
 if(record.taskFirst)return;
 const legacy=record.stage, draft=record.draft;
 record.taskFirst={version:1,mainDraft:legacy===4?draft:'',stepDraft:legacy===3?draft:'',legacyDraft:![3,4].includes(legacy)?draft:'',helpOpen:legacy===3,guideOpen:legacy===3,theoryOpen:false,sourceOpen:false,formatOpen:false,camera:null,proofCamera:null};
 if(legacy===3)record.assisted=true;
 // Existing drafts and accepted steps survive; the first view of the new presentation is the task.
 record.stage=4;
}
function open(id){
 if(!save())return;destroyViewers();unit=C.units.find(u=>u.id===id)||C.units[0];record=store.get(unit.id);migrateUI();stage=record.stage;setHash(unit.id);if(!save('start'))return;render();window.scrollTo(0,0);
}
function task(){
 return (record.review?.active&&foundation(unit)&&StereoTasks.makeReview(unit.task,record.seed))||StereoTasks.make(unit.task,record.seed);
}
function proof(){return PROOFS[unit.proof||unit.task]||null;}
function rememberTask(){
 const key=taskKey(task());if(record.currentTaskKey===key)return;
 record.repeatedTask=record.seenTasks.includes(key);record.currentTaskKey=key;
 if(!record.repeatedTask)record.seenTasks.push(key);save();
}
function markAssisted(){
 if(record.assisted)return;
 record.assisted=true;record.hints++;
 if(record.review?.active&&!record.review.passedAt)record.review.dueAt=Date.now()+REVIEW_DELAY;
 if(save('hint'))refreshReview();
}
function freshSeed(kind,r,make){
 for(let i=1;i<=200;i++){
  const seed=(r.seed+i)%1e8,t=make(kind,seed);
  if(!t)return null;
  if(!r.seenTasks.includes(taskKey(t)))return seed;
 }
 return null;
}
function nextTask(seed=record.seed+1,review=false){
 destroyViewers();const proofCamera=record.taskFirst.proofCamera;record.seed=seed;record.currentTaskKey='';record.repeatedTask=false;record.taskStep=0;record.draft='';record.assisted=false;record.checked=false;
 if(record.review)record.review.active=review;
 record.taskFirst={version:1,mainDraft:'',stepDraft:'',legacyDraft:'',helpOpen:false,guideOpen:false,theoryOpen:false,sourceOpen:false,formatOpen:false,camera:null,proofCamera:null};
 record.taskFirst.proofCamera=proofCamera;stage=4;return save('task_start');
}
function canReplaceTask(r){
 const ui=r.taskFirst;
 return ui.finalCorrect||(!ui.mainDraft.trim()&&!ui.stepDraft.trim()&&!r.taskStep&&!r.checked);
}
function reviewMarkup(){
 if(!foundation(unit)||!record.review)return '';
 const {dueAt,passedAt,active}=record.review;
 if(passedAt)return '<p class="good">Новый вариант после паузы решён самостоятельно.</p>';
 if(active&&!record.checked)return record.assisted
  ?'<p>Ты открыл подсказку. Закончи разбор и вернись к самостоятельной проверке позже.</p>'
  :'<p>Проверка после паузы. Реши этот вариант без подсказки.</p>';
 if(!dueAt)return '';
 if(dueAt>Date.now()){
  const date=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(dueAt);
  return '<p>Следующий самостоятельный вариант станет доступен '+E(date)+'.</p>';
 }
 if(freshSeed(unit.task,record,StereoTasks.makeReview)===null)return '<p>Все доступные варианты уже открыты.</p>';
 if(!canReplaceTask(record))return '<p>Сначала закончи текущую задачу. Затем можно начать проверку после паузы.</p>';
 return '<button data-action="review">Решить новый вариант после паузы</button>';
}
function refreshReview(){
 const status=document.getElementById('review-status');
 if(status)status.innerHTML=reviewMarkup();
}
function chapterProgress(i,all){
 if(i>2)return '';
 const topics=C.units.filter(u=>u.chapter===i);
 const independent=topics.filter(u=>all[u.id]?.independent).length;
 const reviewed=topics.filter(u=>all[u.id]?.review?.passedAt).length;
 return '<p class="chapter-progress">Самостоятельно решены задачи по '+independent+' из '+topics.length+' тем. Тем с пройденной проверкой после паузы — '+reviewed+'.</p>';
}
function topicStatus(u,r){
 if(!r)return 'Можно начать';
 if(!foundation(u))return r.independent?'Самостоятельных: '+r.independent:'В работе';
 if(r.review?.passedAt)return 'Повтор после паузы пройден';
 if(r.review?.active&&!r.checked)return 'Проверка после паузы начата';
 if(r.review?.dueAt<=Date.now()&&r.taskFirst&&canReplaceTask(r)&&freshSeed(u.task,r,StereoTasks.makeReview)!==null)return 'Доступна проверка после паузы';
 return r.independent?'Самостоятельных: '+r.independent:'В работе';
}
function taskQuestion(t){
 // The final label may use only the actual condition, never an intermediate step or answer.
 const text=String(t.q).trim(), sentences=text.match(/[^.!?]+[.!?]?/g)||[text];
 const wanted=sentences.findIndex(s=>/\b(?:Find)\b|Найди|Сколько|Какое|Какую|Какой|Могут ли|Пересекаются ли|Назови|Во сколько|прямая .+ параллельна/.test(s));
 return wanted<0?text:sentences.slice(wanted).join('').trim();
}
function reference(){
 return '<p>'+E(C.edition)+'.</p><ul class="source-points">'+unit.source.map(s=>'<li>Пункт '+s.point+(s.advanced?' ★':'')+' «'+E(s.title)+'», страница '+s.page+'.</li>').join('')+'</ul><p class="muted">Выше — авторское объяснение по темам учебника. Это ссылка на нужный пункт, а не дословная цитата.</p>';
}
function nav(){
 return '<nav class="lesson-actions" aria-label="Разделы темы"><button data-stage="4"'+([0,3,4].includes(stage)?' aria-current="page"':'')+'>К задаче</button><details class="more-sections"><summary>Ещё по теме</summary><div class="section-links"><button data-stage="0">Вспомнить теорию</button><button data-stage="1">Свободная 3D-лаборатория</button><button data-stage="2">Отдельная задача на доказательство</button><button data-stage="3">Разобрать текущую задачу</button><button data-stage="5">'+(proof()?'Записать доказательство':'Обосновать исследование')+'</button></div></details></nav>';
}
function answerFormat(){
 return '<details id="answer-format"'+(record.taskFirst.formatOpen?' open':'')+'><summary>Как записать ответ?</summary><p>Дробь вводи через <code>/</code>, например <code>1/3</code>; корень — <code>sqrt(2)</code>; π — <code>pi</code>. Координаты разделяй <code>;</code>, умножение обозначай <code>*</code>. В вопросе «да или нет» введи одно из этих слов.</p></details>';
}
function guidedBody(t){
 const i=Math.min(record.taskStep,t.steps.length);
 let h='<ol class="proof-list">'+t.steps.slice(0,i).map(s=>'<li><strong>'+E(s.q)+' '+E(Answer.format(s.a))+'</strong><small>Почему: '+E(s.why)+'</small></li>').join('')+'</ol>';
 if(i<t.steps.length){
  const s=t.steps[i];h+='<p class="step-number">Шаг '+(i+1)+' из '+t.steps.length+'</p><form id="step-answer-form"><label for="step-answer">'+E(s.q)+'</label><div class="answer-row"><input id="step-answer" autocomplete="off" value="'+E(record.taskFirst.stepDraft)+'"><button class="primary" type="submit">Проверить шаг</button></div></form><p id="step-feedback" class="feedback" role="status"></p><details id="step-why"><summary>Почему именно так?</summary><p>'+E(s.why)+'</p></details>';
 }else h+='<p class="good">Разбор завершён. Ответ: '+E(Answer.format(t.a))+'.</p><p>Вернись к полю ответа под условием или возьми новый вариант для самостоятельной проверки.</p><button data-action="independent" class="primary">Новый вариант без подсказки</button>';
 return h;
}
function taskPanel(){
 rememberTask();const t=task(),ui=record.taskFirst;
 return '<div class="task-layout"><section class="panel task-main" aria-labelledby="task-title"><h2 id="task-title">Задача</h2><p class="task-question">'+E(t.q)+'</p><div id="task-model" aria-label="Рисунок к условию"></div><button data-action="help" aria-controls="task-help" aria-expanded="'+ui.helpOpen+'">'+(ui.helpOpen?'Убрать подсказку':'Хочешь подсказку?')+'</button><form id="answer-form" data-mode="independent"><label for="answer">'+E(taskQuestion(t))+'</label><div class="answer-row"><input id="answer" autocomplete="off" aria-describedby="final-answer-note" value="'+E(ui.mainDraft)+'"><button type="submit" class="primary">Проверить ответ</button></div><p id="final-answer-note" class="muted">Впиши ответ на задачу. Для промежуточных вычислений открой подсказку.</p></form><p id="feedback" class="feedback" role="status"></p>'+answerFormat()+(record.repeatedTask?'<p class="callout">Это условие уже открывалось. Повторить его можно; новый самостоятельный зачёт за повтор не начисляется.</p>':'')+'<div class="row"><button data-action="new">Другой вариант</button></div><p class="stage-status">Первые самостоятельные решения новых условий: '+record.independent+'.</p><div id="review-status">'+reviewMarkup()+'</div></section><aside class="help-column"><details id="task-help"'+(ui.helpOpen?' open':'')+'><summary>'+(ui.helpOpen?'Убрать подсказку':'Хочешь подсказку?')+'</summary><p>Условие, рисунок и твой ответ остаются на месте. Выбери, что нужно разобрать.</p>'+(ui.legacyDraft?'<p class="callout"><strong>Ранее записано:</strong> '+E(ui.legacyDraft)+'</p>':'')+'<details id="task-guide"'+(ui.guideOpen?' open':'')+'><summary>Помочь решить по шагам?</summary><div id="task-guide-body">'+guidedBody(t)+'</div></details><details id="task-theory"'+(ui.theoryOpen?' open':'')+'><summary>Какое правило здесь пригодится?</summary><p class="law">'+E(unit.idea)+'</p><details><summary>На что обратить внимание?</summary><p>'+E(unit.pitfall)+'</p></details></details><details id="task-source"'+(ui.sourceOpen?' open':'')+'><summary>Для ценителей строгости и точности</summary>'+reference()+'</details><p><button data-action="close-help">Вернуться к задаче</button></p></details></aside></div>';
}
function proofPanel(){
 const p=proof();
 if(!p)return '<section class="panel"><h2>Обоснуй своё исследование</h2><p>'+E(unit.investigate)+'</p><p>Назови точки и плоскости. Запиши, что дано, что нужно доказать и какие определения или теоремы обосновывают каждый переход.</p><p>'+E(unit.pitfall)+'</p><p>Для этого узла готовая цепочка пока не включена. Сохрани рассуждение в своей работе и обсуди с учителем.</p><button data-stage="5">Записать рассуждение</button></section>';
 const count=record.proofDone.length;
 let h='<section class="panel proof-problem"><p class="eyebrow">Отдельная задача на доказательство</p><h2>'+E(p.title)+'</h2><p><strong>Дано:</strong> '+E(p.given)+'</p><p><strong>Доказать:</strong> '+E(p.goal)+'</p><div id="proof-model" aria-label="Рисунок к задаче на доказательство"></div><p class="muted">Собери рассуждение: выбирай очередной шаг и обосновывай его определением, условием или теоремой.</p><ol class="proof-list">'+p.steps.slice(0,count).map(s=>'<li><strong>'+E(s.text)+'</strong><small>Основание: '+E(s.reason)+'</small></li>').join('')+'</ol>';
 if(count<p.steps.length){
  const choices=p.steps.map((s,i)=>({s,i})).slice(count,count+3).reverse();
  h+='<h3>Какой шаг можно сделать сейчас?</h3><p>Выбери утверждение, затем укажи, почему оно верно.</p><div class="proof-options">'+choices.map(x=>'<button data-proof="'+x.i+'">'+E(x.s.text)+'</button>').join('')+'<button data-action="visual-trap">Это следует из того, как выглядит рисунок.</button></div><div id="reason"></div><p id="proof-feedback" class="feedback" role="status"></p>';
 }else h+='<p class="callout">Цепочка обоснований собрана. Теперь восстанови доказательство своими словами.</p><button data-stage="5" class="primary">Написать доказательство</button><button data-action="reset-proof">Повторить цепочку</button>';
 return h+'<details><summary>Для ценителей строгости и точности</summary>'+reference()+'</details></section>';
}
function formatProofChoices(container){
 // Only authored proof choices opt in: the general text formatter skips controls.
 // Keep the button (and its action/listeners) and its exact original accessible name.
 container.querySelectorAll('.proof-options button').forEach(button=>{
  const raw=button.getAttribute('aria-label')??button.textContent,content=document.createElement('span');
  content.className='proof-choice-text';content.setAttribute('aria-hidden','true');
  StereoMath.appendText(content,raw);button.setAttribute('aria-label',raw);button.replaceChildren(content);
 });
}
function writtenPanel(){
 const p=proof();return '<section class="panel"><p class="eyebrow">'+(p?'Отдельная задача на доказательство':'Обоснование исследования')+'</p><h2>Объяснение своими словами</h2><p>'+E(p?p.given+' '+p.goal:unit.investigate)+'</p>'+(p?'<div id="proof-model" aria-label="Рисунок к задаче на доказательство"></div>':'')+'<label for="written">Запиши рассуждение: условие, необходимые построения, основания переходов и вывод.</label><textarea id="written" rows="9">'+E(record.written)+'</textarea><div class="rubric"><label><input type="checkbox"> Названы объекты и условия.</label><label><input type="checkbox"> Объяснено назначение каждой дополнительной линии или плоскости.</label><label><input type="checkbox"> У каждого перехода есть основание: условие, определение или теорема.</label><label><input type="checkbox"> Проверены особые случаи.</label></div><p class="muted">Это самопроверка. Рассуждение сохраняется для учителя и не получает автоматическую отметку за верность.</p><button class="primary" data-action="finish">Сохранить итог занятия</button><div id="finish-result" role="status"></div></section>';
}
function render(){
 if(conflict)return;if([1,2,5].includes(stage))markAssisted();if(conflict)return;destroyViewers();pending=null;
 const compact=foundation(unit)&&[0,3,4].includes(stage);
 let h='<div class="workspace'+(compact?' workspace--foundation':'')+'"><div class="back-row"><button data-action="home">← К началу курса</button><span class="pill">Пункты '+unit.points.join(', ')+'</span></div><p class="eyebrow">'+E(C.chapters[unit.chapter])+'</p><h1>'+E(unit.title)+'</h1>'+(compact?'':nav());
 if([0,3,4].includes(stage))h+=taskPanel();
 if(compact)h+=nav();
 if(stage===1)h+='<section class="panel"><h2>Свободная 3D-лаборатория</h2><p>'+E(unit.investigate)+'</p><p class="callout">Это отдельное исследование. Параметры здесь можно менять; условие твоей задачи сохранено. Вернись к нему кнопкой «К задаче».</p><div id="viewer"></div><label for="observation">Что ты изменил(а), какое свойство заметил(а) и как его объяснишь?</label><textarea id="observation">'+E(record.observation)+'</textarea></section>';
 if(stage===2)h+=proofPanel();
 if(stage===5)h+=writtenPanel();
 h+='<div class="stage-footer"><button data-action="home">← К началу курса</button>'+(stage===4?'<button data-stage="5">'+(proof()?'Записать доказательство отдельной задачи':'Обосновать исследование')+'</button>':'<button data-stage="4" class="primary">К задаче</button>')+'</div></div>';if(conflict)return;root.innerHTML=h;root.dataset.condition=task().q;root.dataset.proofCondition=proof()?proof().given+' '+proof().goal:unit.investigate;StereoMath.formatFractions(root);formatProofChoices(root);
 if([0,3,4].includes(stage)){
  taskViewer=StereoTaskScenes.mount(document.getElementById('task-model'),{kind:unit.task,task:task(),compact,savedCamera:record.taskFirst.camera,step:activeStep(),onChange:camera=>{record.taskFirst.camera=camera;later();}});
  StereoMath.formatFractions(document.getElementById('task-model'));bindHelp();
 }
 if((stage===2||stage===5)&&proof())proofViewer=StereoTaskScenes.mountProof(document.getElementById('proof-model'),{key:unit.proof||unit.task,proof:proof(),savedCamera:record.taskFirst.proofCamera,step:stage===2?record.proofDone.length-1:-1,onChange:camera=>{record.taskFirst.proofCamera=camera;later();}});
 if(stage===1)viewer=SpaceViewer.mount(document.getElementById('viewer'),{kind:unit.kind,mode:unit.id==='sections'?'section':'explore',saved:record.model},ev=>{record.model=ev.state;record.moved=true;if(ev.type==='solved-construction')record.construction=true;if(ev.type==='hint')record.hints++;later();});
}
function activeStep(){return record.taskFirst.helpOpen&&record.taskFirst.guideOpen?Math.min(record.taskStep,task().steps.length-1):-1;}
function syncHelp(id,opened){
 if(!ensureCurrent())return;const key=helpFields[id];if(!key)return;
 if(record.taskFirst[key]===opened&&(!opened||id==='answer-format'||record.assisted))return;
 record.taskFirst[key]=opened;
 if(opened&&id!=='answer-format')markAssisted();
 if(id==='task-help'){document.querySelector('#task-help>summary').textContent=opened?'Убрать подсказку':'Хочешь подсказку?';const button=document.querySelector('[data-action=help]');button.textContent=opened?'Убрать подсказку':'Хочешь подсказку?';button.setAttribute('aria-expanded',String(opened));}
 taskViewer?.setStep(activeStep());save();
}
function bindHelp(){
 for(const id of Object.keys(helpFields)){
  const el=document.getElementById(id);if(!el)continue;
  el.querySelector('summary').addEventListener('click',()=>syncHelp(id,!el.open));
  el.addEventListener('toggle',()=>{if(unit&&record&&el.isConnected)syncHelp(id,el.open);});
 }
}
function changeStage(n){
 if(!ensureCurrent()||!save())return;
 if(n===0||n===3){stage=4;record.taskFirst.helpOpen=true;record.taskFirst[n===0?'theoryOpen':'guideOpen']=true;markAssisted();}
 else {stage=n;if(n===1||n===2||n===5)markAssisted();}
 if(!save('step'))return;render();window.scrollTo(0,0);
}
function answerFor(t,input){
 const angular=typeof t.a==='number'&&(
  ['skew','perpendicular'].includes(unit.task)||
  (unit.task==='dihedral'&&!t.q.includes('тангенс'))||
  (unit.task==='solid-angle'&&t.q.includes('сумму в градусах'))
 );
 return angular?input.replace(/\s*°$/u,''):input;
}
function wrongAnswer(t,value){
 const firstStep=t.steps[0].a;
 if(unit.task==='section'){
  const asksArea=t.q.includes('Найди площадь'),sideSquare=asksArea?firstStep:t.a;
  if(Answer.equal(value,Math.sqrt(sideSquare)))return asksArea?'Это длина стороны. В этой задаче нужно найти площадь сечения.':'Это длина стороны. В задаче спрашивают её квадрат.';
  if(asksArea&&Answer.equal(value,sideSquare))return 'Это квадрат стороны. Теперь найди площадь треугольного сечения.';
  if(!asksArea&&Answer.equal(value,firstStep))return 'Это половина ребра куба. Найди квадрат отрезка между двумя серединами.';
 }
 if(unit.task==='dihedral'){
  if(t.q.includes('тангенс')){
   const degrees=Math.atan(t.a)*180/Math.PI;
   if(Answer.equal(value.replace(/\s*°$/u,''),degrees))return 'Ты записал угол в градусах. Здесь просят найти его тангенс.';
  }
  if(Answer.equal(value,firstStep))return 'Это расстояние от центра основания до середины стороны. Посмотри, что нужно найти в условии.';
 }
 if(['projection','box-diagonal'].includes(unit.task)&&Answer.equal(value,firstStep))return 'Это квадрат искомой длины. Запиши саму длину.';
 if(unit.task==='euler'&&Answer.equal(value,firstStep))return 'Это значение В − Р + Г по формуле Эйлера. В задаче спрашивают число граней.';
 if(unit.task==='solid-angle'&&Array.isArray(t.a)&&t.a.some(bound=>Answer.equal(value,bound)))return 'Это одна граница интервала. Запиши обе по порядку через точку с запятой.';
 return 'Пока неверно. Проверь, какую величину нужно найти, её единицы и основание для формулы. Можно открыть подсказку.';
}
function registerReview(independent,first){
 if(!foundation(unit)||!first)return;
 const review=record.review;
 if(review?.active&&!review.passedAt){
  if(independent)review.passedAt=Date.now();
  else review.dueAt=Date.now()+REVIEW_DELAY;
  return;
 }
 if(independent&&!review&&freshSeed(unit.task,record,StereoTasks.makeReview)!==null){
  record.review={dueAt:Date.now()+REVIEW_DELAY,passedAt:0,active:false};
 }
}
function checkFinal(){
 if(!ensureCurrent())return;const input=document.getElementById('answer'),f=document.getElementById('feedback'),a=input.value.trim(),t=task(),ui=record.taskFirst;ui.mainDraft=input.value;record.draft=input.value;
 if(!a){f.textContent='Впиши ответ на вопрос над полем.';f.className='feedback error';save();return;}
 // A script-triggered native disclosure must not race an immediate submission.
 if(document.getElementById('task-help').open)markAssisted();
 const value=foundation(unit)?answerFor(t,a):a;
 const ok=Answer.equal(value,t.a),first=!record.checked;
 const independent=ok&&first&&!record.assisted&&!record.repeatedTask;
 record.checked=true;
 if(first){record.attempts++;ui.firstResult=ok?'correct':'wrong';}
 if(ok){
  ui.finalCorrect=true;
  if(independent)record.independent++;
  if(record.repeatedTask)f.textContent='Верно. Это условие уже открывалось; повтор решён без нового самостоятельного зачёта.';
  else if(independent)f.textContent='Верно с первой попытки без подсказки. Засчитан самостоятельный вариант.';
  else if(ui.answerRevealed)f.textContent='Верно после разбора с подсказкой. Возьми новый вариант для самостоятельной проверки.';
  else if(record.assisted)f.textContent=foundation(unit)
   ?'Верно с подсказкой. Возьми другой вариант для самостоятельной проверки.'
   :'Верно после исправления или с подсказкой. Возьми другой вариант для самостоятельной проверки.';
  else if(ui.firstResult==='wrong')f.textContent='Верно после исправления. Возьми новый вариант и попробуй решить его с первой попытки.';
  else f.textContent='Ответ верный. Этот вариант уже учтён.';
  f.className='feedback good';
 }else{
  if(!foundation(unit))record.assisted=true;
  f.textContent=foundation(unit)?wrongAnswer(t,value):'Пока неверно. Проверь, какую величину нужно найти, её единицы и основание для формулы. Можно открыть подсказку.';
  f.className='feedback error';
 }
 registerReview(independent,first);
 document.querySelector('.stage-status').textContent='Первые самостоятельные решения новых условий: '+record.independent+'.';
 if(!save(ok?'solved':'attempt')){f.textContent='Результат этого окна не сохранён: открой сохранённую версию выше.';document.querySelector('.stage-status').textContent='Сохранённый результат не изменён.';return;}
 refreshReview();
}
function checkStep(){
 if(!ensureCurrent())return;const input=document.getElementById('step-answer'),a=input.value.trim(),f=document.getElementById('step-feedback'),t=task();record.taskFirst.stepDraft=input.value;markAssisted();
 if(!a){f.textContent='Впиши ответ на вопрос этого шага.';f.className='feedback error';save();return;}
 if(record.taskStep>=t.steps.length)return;
 if(Answer.equal(a,t.steps[record.taskStep].a)){
  record.taskStep++;record.taskFirst.stepDraft='';
  if(record.taskStep===t.steps.length){record.guided=true;record.taskFirst.answerRevealed=true;}
  if(!save('solved'))return;
  document.getElementById('task-guide-body').innerHTML=guidedBody(t);StereoMath.formatFractions(document.getElementById('task-guide-body'));taskViewer?.setStep(activeStep());
 }else{f.textContent='Пока неверно. Перечитай вопрос над этим полем. Кнопка «Почему именно так?» пояснит шаг.';f.className='feedback error';save('attempt');}
}
root.addEventListener('input',event=>{
 const el=event.target;
 if(el.id==='course-search'){const s=el.value.toLocaleLowerCase('ru');root.querySelectorAll('.card').forEach(c=>c.hidden=!c.textContent.toLocaleLowerCase('ru').includes(s));root.querySelectorAll('.chapter').forEach(c=>c.hidden=![...c.querySelectorAll('.card')].some(a=>!a.hidden));return;}
 if(!record)return;
 if(el.id==='answer'){record.taskFirst.mainDraft=el.value;record.draft=el.value;}
 if(el.id==='step-answer')record.taskFirst.stepDraft=el.value;
 if(el.id==='observation')record.observation=el.value;
 if(el.id==='written')record.written=el.value;
 later();
});
root.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.dataset.unit){open(b.dataset.unit);return;}
 if(b.dataset.stage!==undefined){changeStage(+b.dataset.stage);return;}
 const a=b.dataset.action;if(a==='home')return home();if(a==='export')return download();if(a==='reports')return reports();if(!unit||!ensureCurrent())return;
 if(b.dataset.proof!==undefined){
  const i=+b.dataset.proof,f=document.getElementById('proof-feedback');if(i!==record.proofDone.length){f.textContent='Сначала нужно установить предыдущий факт. Найди недостающее основание.';f.className='feedback error';return;}
  pending=i;proofViewer?.setStep(i);document.getElementById('reason').innerHTML='<div class="reason-panel"><strong>Почему выбранный шаг верен?</strong><div class="proof-options"><button data-action="bad-reason">Используем вывод, который сейчас доказываем.</button><button data-action="good-reason">'+E(proof().steps[i].reason)+'</button><button data-action="bad-reason">Совпали измерения на рисунке.</button></div></div>';formatProofChoices(document.getElementById('reason'));
 }
 if(a==='visual-trap'||a==='bad-reason'){document.getElementById('proof-feedback').textContent='Нужен факт из условия, определение, аксиома или уже установленная теорема. Измерения и вид рисунка не заменяют доказательство.';save('proof-error');}
 if(a==='good-reason'&&pending!==null){record.proofDone.push('s'+pending);record.proof=record.proofDone.length===proof().steps.length;if(save('proof-step'))render();}
 if(a==='reset-proof'){record.proofDone=[];record.proof=false;if(save())render();}
 if(a==='independent'||a==='new'){
  const seed=foundation(unit)?freshSeed(unit.task,record,StereoTasks.make):null;
  if(nextTask(seed??record.seed+1)){render();window.scrollTo(0,0);}
 }
 if(a==='review'&&record.review?.dueAt<=Date.now()&&!record.review.passedAt&&canReplaceTask(record)){
  const seed=freshSeed(unit.task,record,StereoTasks.makeReview);
  if(seed!==null&&nextTask(seed,true)){render();window.scrollTo(0,0);}
 }
 if(a==='help'){const el=document.getElementById('task-help');el.open=!el.open;syncHelp('task-help',el.open);if(el.open&&window.innerWidth<861)el.scrollIntoView({block:'nearest'});}
 if(a==='close-help'){const el=document.getElementById('task-help');el.open=false;syncHelp('task-help',false);document.getElementById('answer').focus();}
 if(a==='finish'){
  record.complete=record.guided&&record.moved&&record.observation.trim().length>=10;if(!save('finish'))return;
  document.getElementById('finish-result').innerHTML='<div class="callout"><strong id="success">Итог занятия сохранён.</strong><p>Самостоятельных первых попыток: '+record.independent+'. '+(record.written.trim()?'Письменная работа сохранена для проверки учителем.':'Письменную работу можно дописать позже.')+'</p><p>Позже реши новый вариант и восстанови объяснение без карточек.</p></div>';
 }
});
root.addEventListener('submit',event=>{if(!['answer-form','step-answer-form'].includes(event.target.id))return;event.preventDefault();if(event.target.id==='answer-form')checkFinal();else checkStep();});
function download(){if(!save())return;StereoStore.download(store.export(),'stereometry-progress.json');}
document.getElementById('export-progress').onclick=download;document.getElementById('home').onclick=home;
const menu=document.getElementById('toplinks-toggle');
menu?.addEventListener('click',()=>{
 const open=document.getElementById('course-toplinks').classList.toggle('is-open');
 menu.setAttribute('aria-expanded',String(open));
});
root.addEventListener('change',async event=>{
 if(event.target.id!=='import'&&event.target.id!=='reports-files')return;
 const report=event.target.id==='reports-files';
 for(const f of event.target.files){try{if(f.size>8e6)throw Error('Слишком большой файл');const raw=JSON.parse(await f.text());if(report)renderReport(StereoStore.validate(raw,C.units.map(u=>u.id)),f.name);else{store.import(raw);home();}}catch(err){notice.hidden=false;notice.textContent='Не удалось прочитать файл: '+err.message;}}
});
function reports(){if(!save())return;destroyViewers();root.innerHTML='<div class="workspace"><button data-action="home">← К началу курса</button><h1>Работы учеников</h1><section class="panel"><p>Выберите файлы прогресса. Тексты и результаты читаются локально, без отправки на сервер.</p><label>Файлы работ<input id="reports-files" type="file" accept=".json,application/json" multiple></label><p>Разбор с опорой и самостоятельная первая попытка учитываются отдельно. Письменные доказательства проверьте по условиям, построениям, основаниям и полноте вывода.</p></section><div id="reports-output"></div></div>';renderReport(store.export(),'Этот браузер');}
function renderReport(d,name){const el=document.createElement('section');el.className='panel';el.style.marginTop='20px';el.innerHTML='<h2>'+E(name)+'</h2>'+Object.entries(d.units).map(([id,r])=>'<details><summary>'+E(C.units.find(u=>u.id===id).title)+' · самостоятельно '+r.independent+' / попыток '+r.attempts+'</summary><p>Разбор: '+(r.guided?'пройден':'не закончен')+'. Цепочка: '+(r.proof?'собрана':'не закончена или отсутствует в узле')+'.</p><h3>Наблюдение</h3><p class="report-note">'+E(r.observation||'Нет записи')+'</p><h3>Рассуждение</h3><p class="report-note">'+E(r.written||'Нет записи')+'</p></details>').join('');document.getElementById('reports-output').appendChild(el);}

const returnRoutes={ege15:['../ege-profil/atanasyan-10-11/index.html#route','← К маршруту задания №15'],ege3:['../ege-profil/start/index.html#exam/3','← К заданию №3 ЕГЭ']};
const routeName=new URLSearchParams(location.search).get('route');
const returnRoute=Object.hasOwn(returnRoutes,routeName)?returnRoutes[routeName]:null;
if(returnRoute){const link=document.createElement('a');link.href=returnRoute[0];link.textContent=returnRoute[1];document.querySelector('.toplinks').prepend(link);}
function openHash(){
 let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch(_){}
 if(C.units.some(u=>u.id===id)){if(unit?.id!==id)open(id);}
 else if(!conflict)home();
 if(conflict)setHash(unit?.id||'');
}
window.addEventListener('hashchange',openHash);
openHash();
})();
