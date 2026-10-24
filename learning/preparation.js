/* Course presentation only. Attempts and points are owned by the server. */
(function(root){
'use strict';
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// These are separate public exercises, never managed assignments or progress.
const focusPractices=Object.freeze({
 'https://mathexam.space/stereo-course/merzlyak-10-base/':'10 класс · Геометрия Мерзляк',
 'https://mathexam.space/trainers/rounding-stepwise.html':'Округление по шагам',
 'https://mathexam.space/trainers/task19-trainer.html':'ОГЭ №19: геометрические утверждения'
});
function focusMarkup(value){
 const text=String(value??'');if(!text)return '';
 let html='',offset=0,linked=false;
 for(const match of text.matchAll(/https:\/\/[^\s<>"']+/g)){
  html+=E(text.slice(offset,match.index));
  const token=match[0],url=token.replace(/[.,;:!?)\]}]+$/,'');
  if(Object.hasOwn(focusPractices,url)){
   html+=`<a class="button small" data-focus-practice href="${E(url)}" target="_blank" rel="noopener noreferrer">${E(focusPractices[url])} ↗</a>${E(token.slice(url.length))}`;linked=true;
  }else html+=E(token);
  offset=match.index+token.length;
 }
 html+=E(text.slice(offset));
 return `<p class="prep-focus">${html}</p>${linked?'<p class="small" data-focus-practice-note>Тренажёры откроются в отдельной вкладке. Их результаты сохраняются в этом браузере и не входят в прогресс кабинета.</p>':''}`;
}
// Fixed course references are presentation only. A saved plan may link a public
// course without creating a managed attempt or claiming its whole-course result.
function planCoursesMarkup(value,{teacher=false}={}){
 const canonical='https://mathexam.space/school/peterson6/';
 const tokens=new Set((String(value??'').match(/https:\/\/[^\s<>"']+/g)||[]).map(token=>token.replace(/[.,;:!?)\]}]+$/,'')));
 const cards=[];
 const board='https://mathexam.space/trainers/trainer-board.html?trainer=%2Fschool%2Fpeterson6%2F';
 if(tokens.has(canonical))cards.push(`<section class="panel prep-linked-course" data-plan-course="peterson6"><p class="eyebrow">КУРС В УЧЕБНОМ ПЛАНЕ</p><h2>Петерсон · 6 класс · часть 1</h2><p>Выбери тему, решай задачи и тренируй трудные вычисления отдельно. После тренировки можно вернуться к исходной задаче.</p><div class="actions"><a class="button primary" data-plan-course-open href="${canonical}" target="_blank" rel="noopener noreferrer">Открыть курс →</a><a class="button" data-plan-course-practice href="${canonical}#skills" target="_blank" rel="noopener noreferrer">Тренировка вычислений</a>${teacher?`<a class="button" data-plan-course-board href="${board}" target="_blank" rel="noopener noreferrer">Открыть на доске</a>`:''}</div><p class="small" data-plan-course-note>Личные решения курса сохраняются в этом браузере и не входят в итоги кабинета. Совместная работа на доске не считается самостоятельным решением.${teacher?' Для общего урока создайте комнату на доске и передайте ученику ссылку подключения.':' Для общего урока открой ссылку доски от преподавателя.'}</p></section>`);
 // Only fixed public trainer URLs become cards. Notes are neither HTML nor a
 // source of managed content IDs; no attempt or result is created here.
 for(const [id,title,description] of [
  ['grade6-nok','НОК · наименьшее общее кратное','Разложи числа на простые множители и добавь недостающие. Разбери пример по шагам, затем потренируйся самостоятельно.'],
  ['grade6-nod','НОД · наибольший общий делитель','Разложи числа на простые множители и найди общие пары. Разбери пример по шагам, затем потренируйся самостоятельно.']
 ]){
  const href='https://mathexam.space/trainers/'+id+'.html';
  if(!tokens.has(href))continue;
  const shared='https://mathexam.space/trainers/trainer-board.html?trainer='+encodeURIComponent('/trainers/'+id+'.html');
  cards.push(`<section class="panel prep-linked-course" data-plan-course="${id}"><p class="eyebrow">ТРЕНАЖЁР · 6 КЛАСС</p><h2>${title}</h2><p>${description}</p><div class="actions"><a class="button primary" data-plan-course-open href="${href}" target="_blank" rel="noopener noreferrer">Потренироваться →</a>${teacher?`<a class="button" data-plan-course-board href="${shared}" target="_blank" rel="noopener noreferrer">Открыть на доске</a>`:''}</div></section>`);
 }
 return cards.join('');
}
const complete=new Set(['independent','repeated','hinted','together','practiced']);
function publicHref(item){try{const url=new URL(item.publicUrl||item.url,'https://mathexam.space');return url.origin==='https://mathexam.space'?url.href:'';}catch(_){return '';}}
function mountRoute(host,context){
 const map=root.LearningPreparation, teacher=()=>context.account.role==='teacher';
 const profile=context.profile||{course:'foundations',goal:null,focus:''},oge=profile.course==='oge';
 const own=(context.attempts||[]).filter(a=>a.learnerId===context.account.id&&!a.archivedAt);
 let alive=true,mode='tasks',goalKey=profile.goal||'pass',rewards=null,rewardsError=false,plan=null,planError=false,progress=null,progressError=false,loaded=false;
 const home=context.page==='home';
 const section=document.createElement('section');section.className='preparation';host.replaceChildren(section);
 function entryFor(id){const listed=map.get(id);if(listed)return listed;const item=context.catalog.get(id);return item?{id:item.id,managedId:item.id,title:item.title,kind:'managed',tier:'core',url:'/learning/#practice='+encodeURIComponent(item.id),publicUrl:item.url}:null;}
 function attemptsFor(entry){const item=context.catalog.get(entry.managedId);return item?own.filter(a=>a.trainerId===item.trainerId&&a.contentId===item.contentId):[];}
 function progressFor(entry){const item=context.catalog.get(entry.managedId);return item&&progress?.find(p=>p.trainerId===item.trainerId&&p.contentId===item.contentId);}
 function hasCompleted(entry){return progress?!!progressFor(entry)?.completed:attemptsFor(entry).some(a=>complete.has(a.outcome));}
 function latest(entry){if(progress)return progressFor(entry)?.latest||null;return attemptsFor(entry).sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)))[0];}
 function state(entry){const a=latest(entry);return a?(context.labels[a.outcome]||'Начато'):progress?'Ещё не начинали':'История темы пока не загружена';}
 function openButton(entry,primary=false){const a=latest(entry),done=a&&complete.has(a.outcome);return `<button type="button" ${primary?'class="primary"':''} data-prep-start="${E(entry.managedId)}" ${done?'data-prep-fresh="true"':''}>${teacher()?'Назначить ученику':done?(context.catalog.get(entry.managedId)?.trainerId==='motion-grade6'?'Повторить занятие':'Новый пример'):a?'Продолжить':'Начать задание'} →</button>${a?`<a class="button small" href="#attempt=${encodeURIComponent(a.id)}">Моё решение</a>`:''}`;}
 function publishedHomework(){return (context.assignments||[]).filter(a=>a.learnerId===context.account.id&&a.status==='published').sort((a,b)=>String(a.dueAt||'9999').localeCompare(String(b.dueAt||'9999')));}
 function nextMarkup(){
  if(teacher())return '';
  const homework=publishedHomework().find(a=>!a.attempt?.submission||a.attempt.submission.stale||a.attempt.submission.status==='revise');
  const recent=[...own].filter(a=>a.outcome==='started').sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)))[0];
  let title='',lead='',action='';
  if(homework){title=homework.title;lead=homework.attempt?.submission?.status==='revise'?'Преподаватель просит исправить эту работу. Открой задание и комментарий.':'Задание от преподавателя. Тренажёр, фотографии и отправка работы находятся вместе.';action=`<a class="button primary" href="#assignment=${encodeURIComponent(homework.id)}">${homework.attempt?.version>0?'Продолжить занятие':'Начать занятие'} →</a>`;}
  else if(recent){const item=context.catalog.items.find(i=>i.trainerId===recent.trainerId&&i.contentId===recent.contentId);title=item?.title||'Моя начатая работа';lead='Продолжи с того же места. Условие, введённый ответ и предыдущие шаги остаются в этой работе.';action=`<a class="button primary" href="#attempt=${encodeURIComponent(recent.id)}">Продолжить занятие →</a>`;}
  else if(!loaded){return '<section class="prep-start" data-prep-next aria-live="polite"><p>Загружаем ближайшее задание…</p></section>';}
  else if(planError||progressError){title='Мой маршрут';lead='Личный план или история сейчас не загрузились. Открой маршрут: сохранённые задания остаются доступны.';action='<a class="button primary" href="#route">Открыть маршрут →</a>';}
  else{const next=recommendations().find(x=>x.entry.managedId&&!hasCompleted(x.entry));if(next){title=next.entry.title;lead=next.reason||'Начни с этого задания. Подсказку можно открыть на трудном шаге.';action=`<button type="button" class="primary" data-prep-start="${E(next.entry.managedId)}">Начать занятие →</button>`;}else{title='Задания этого маршрута выполнены';lead='Можно закрепить тему новым примером или выбрать другой раздел.';action='<a class="button primary" href="#route">Выбрать следующую тему →</a>';}}
  return `<section class="prep-start" data-prep-next aria-labelledby="prep-next-title"><p class="eyebrow">БЛИЖАЙШИЙ ШАГ</p><h2 id="prep-next-title">${E(title)}</h2><p>${E(lead)}</p>${action}<p class="prep-save-note">Ответы из задания в кабинете сохраняются автоматически. Дождись отметки «Сохранено» — тогда результат доступен преподавателю и родителю, которому открыт доступ.</p></section>`;
 }
 function entryCard(entry,reason=''){
  const managed=entry.managedId&&context.catalog.get(entry.managedId),href=publicHref(entry);
  return `<article class="prep-task" data-prep-item="${E(entry.id)}"><span class="prep-kind">${managed?'Результат в кабинете':'Практика на сайте'}</span><h3>${E(entry.title)}</h3>${reason?`<p>${E(reason)}</p>`:''}${entry.note?`<p class="small">${E(entry.note)}</p>`:''}${!teacher()&&managed?`<p class="prep-task-status">${E(state(entry))}</p>`:''}<div class="actions">${managed?openButton(entry):''}${href?`<a class="button ${managed?'small':''}" href="${E(href)}" target="_blank" rel="noopener">${managed?'Исследовать в лаборатории':'Открыть упражнение'} ↗</a>`:''}</div>${!managed?'<p class="small">Эта страница не передаёт результат в кабинет. Преподаватель и родитель его не увидят. Для общей истории выбирай задание с отметкой «Результат в кабинете».</p>':''}</article>`;
 }
 function rewardsMarkup(){
  if(teacher())return '<section class="prep-reward-note"><b>Личный опыт ученика</b><p>За завершённое новое условие — 10 баллов; за самостоятельное решение — ещё 5. Открытие страницы баллов не добавляет. Баллы не являются экзаменационной оценкой.</p></section>';
  if(!rewards)return `<section class="prep-rewards" aria-live="polite"><p>${rewardsError?'Баллы сейчас не загрузились. Сохранённые решения остаются в кабинете.':'Загружаем Ваш учебный опыт…'}</p>${rewardsError?'<button type="button" data-prep-retry>Обновить баллы</button>':''}</section>`;
  const points=Math.max(0,Number(rewards.totalPoints)||0),within=Math.max(0,Math.min(100,Number(rewards.pointsWithinLevel)||0));
  return `<section class="prep-rewards" aria-label="Мой учебный опыт"><div class="prep-reward-head"><div><span class="eyebrow">МОЙ ОБЩИЙ ОПЫТ</span><h2>Уровень <span data-prep-level>${E(rewards.level)}</span></h2></div><strong class="prep-points"><span data-prep-points>${points}</span><small>баллов</small></strong></div><progress max="100" value="${within}" aria-label="До следующего уровня"></progress><p>До следующего уровня: ${Math.max(0,Number(rewards.nextLevelAt)-points)} баллов. Завершённых разных условий: ${E(rewards.uniqueCompleted)}.</p><div class="prep-badges">${rewards.badges.length?rewards.badges.map(b=>`<span class="prep-badge">✦ ${E(b.title)}</span>`).join(''):'<span class="small">Первое достижение появится после завершённого задания.</span>'}</div><details><summary>За что даются баллы</summary><p>За завершённое условие — 10 баллов. За самостоятельное решение — ещё 5, один раз. Подсказки доступны всегда. Повторное открытие и знакомый пример не прибавляют баллы заново.</p><p>Это общий опыт за всё время, включая работы, перенесённые в архив. Текущий учебный прогресс показывается отдельно. Баллы не являются оценкой за ОГЭ.</p></details></section>`;
 }
 function homeworkMarkup(){
  if(teacher())return '';
  const rows=publishedHomework();
  if(!rows.length)return '';
  return `<section class="prep-homework"><h2>От Натальи Михайловны</h2><div class="list">${rows.map(a=>{const sent=a.attempt?.submission;return `<article class="list-row"><div><h3>${E(a.title)}</h3><p>${sent?sent.stale?'Есть изменения после сдачи':sent.status==='revise'?'Нужно исправить':'Работа сдана':'Тренажёр и работа в тетради'}${a.dueAt?' · к '+E(new Date(a.dueAt).toLocaleDateString('ru-RU')):''}</p></div><a class="button" href="#assignment=${encodeURIComponent(a.id)}">Открыть домашку →</a></article>`;}).join('')}</div></section>`;
 }
 function recommendations(){
  const saved=plan?.items?.map(item=>({entry:entryFor(item.catalogId),reason:item.reason})).filter(x=>x.entry);
  if(saved?.length)return saved;
  const ids=oge?map.goals[goalKey].managedIds:map.groups.flatMap(g=>g.items.filter(i=>i.tier==='core'&&i.managedId).map(i=>i.managedId));
  return [...new Set(ids)].map(id=>({entry:map.get(id),reason:''})).filter(x=>x.entry);
 }
 function hasPersonalRoute(){return !teacher()&&!!plan?.items?.some(item=>entryFor(item.catalogId));}
 function pendingHomework(){return publishedHomework().some(a=>!a.attempt?.submission||a.attempt.submission.stale||a.attempt.submission.status==='revise');}
 function routeStage(entry){
  const id=entry.managedId||entry.id;
  if(/^oge-basics:multiplication-division\/(?:long-division|division-|decimal-division-natural|decimal-divisor-shift)/.test(id))return {id:'division',title:'Деление уголком'};
  if(['oge-basics:order-of-operations','path:practice-fraction-expression'].includes(id))return {id:'expressions',title:'Выражения в несколько действий'};
  if(['path:practice-decimals','path:practice-decimal-division'].includes(id))return {id:'decimals',title:'Десятичные дроби'};
  if(['path:practice-fraction-add','path:practice-fraction-divide'].includes(id))return {id:'fractions',title:'Обыкновенные дроби'};
  const group=map.groupFor(id);
  return group?{id:group.id,title:group.title}:{id:'personal',title:'Шаги учебного плана'};
 }
 function personalRouteMarkup(){
  const list=recommendations(),finished=list.filter(x=>hasCompleted(x.entry)).length;
  // Only the complete server history can choose a next step reliably. A failed
  // history read must not turn an old completed topic into a new starting point.
  const current=progress?list.findIndex(x=>!hasCompleted(x.entry)):-1;
  const homeworkFirst=pendingHomework();
  let previousStage='';
  return `<section class="prep-next prep-journey" aria-labelledby="prep-journey-title"><header class="prep-journey-head"><p class="eyebrow">ТВОЙ ПУТЬ · СВЕРХУ ВНИЗ</p><h2 id="prep-journey-title">Рекомендации преподавателя</h2><p>Проходи шаги по порядку. После разбора реши новый пример самостоятельно. К любому шагу можно вернуться.</p>${plan.note?`<p class="prep-route-note">${E(plan.note)}</p>`:''}${current>0?'<button type="button" data-prep-current>К текущему шагу ↓</button>':''}</header><p class="small">${progress?'Есть завершённые примеры у '+finished+' из '+list.length+' тренажёров. Это ещё не означает полного освоения тем.':progressError?'История сейчас не загрузилась. Порядок шагов сохранён; отметки по недавним работам могут быть неполными.':'Загружаем историю всех тем…'}</p>${progressError?'<button type="button" data-prep-retry>Обновить историю</button>':''}${progress&&current<0?'<p class="prep-route-finish">В каждом шаге есть завершённые примеры. Повтори трудные места с новыми числами и обсуди готовность с преподавателем.</p>':''}<ol class="prep-route-list">${list.map(({entry,reason},index)=>{
   const stage=routeStage(entry),heading=stage.id!==previousStage;previousStage=stage.id;
   const done=hasCompleted(entry),isCurrent=index===current;
   return `<li class="prep-route-step${done?' is-done':''}${isCurrent?' is-current':''}" data-prep-item="${E(entry.id)}"${isCurrent?' aria-current="step" tabindex="-1"':''}${isCurrent&&!homeworkFirst?' data-prep-next':''}><span class="prep-route-number" aria-hidden="true">${index+1}</span><article class="prep-route-card">${heading?`<p class="prep-route-stage">${E(stage.title)}</p>`:''}<div class="prep-route-meta"><span>Шаг ${index+1} из ${list.length}</span><b>${isCurrent?'Текущий шаг':done?'Есть завершённые примеры':'Впереди'}</b></div><h3>${E(entry.title)}</h3>${reason?`<p>${E(reason)}</p>`:''}<p class="prep-task-status">${E(state(entry))}</p><div class="actions">${openButton(entry,isCurrent&&!homeworkFirst)}</div>${isCurrent?'<p class="prep-save-note">Ответы сохраняются в кабинете. Перед выходом дождись отметки «Сохранено».</p>':''}</article></li>`;
  }).join('')}</ol>${list.some(x=>routeStage(x.entry).id==='division')?`<details class="prep-route-help"><summary>Нужна помощь с таблицей умножения?</summary><p>Повтори таблицу отдельно и вернись к текущему шагу деления.</p><button type="button" data-prep-start="oge-basics:multiplication-division/multiplication-mixed">Повторить таблицу умножения →</button></details>`:''}</section>`;
 }
 function tasksMarkup(){
  const list=recommendations(),remaining=list.filter(x=>!hasCompleted(x.entry)),next=remaining.slice(0,3);
  const total=list.length,finished=total-remaining.length;
  return `${homeworkMarkup()}<section class="prep-next"><div class="section-heading"><h2>${teacher()?'Подобрать следующее задание':plan?.items?.length?'Рекомендации преподавателя':'Следующие шаги'}</h2></div><p>${teacher()?'Выберите материал, затем ученика и письменную часть домашней работы.':planError?'Личный план сейчас не загрузился. Ниже — общий маршрут; домашняя работа остаётся выше.':plan?.note?E(plan.note):oge?E(map.goals[goalKey].lead):'Начните с нужной темы. Если основа уже понятна, можно сразу перейти дальше.'}</p>${!teacher()?`<p class="small">${progress?'В этом списке есть завершённые примеры к '+finished+' из '+total+' тренажёров. Это ещё не означает полного освоения тем.':progressError?'Полная история сейчас не загрузилась. Показаны доступные недавние работы; сохранённые решения не потеряны.':'Загружаем историю всех тем…'}</p>`:''}<div class="prep-task-grid">${(teacher()?list.slice(0,3):next.length?next:list.slice(0,3)).map(x=>entryCard(x.entry,x.reason)).join('')}</div></section><section><div class="section-heading"><h2>${oge?'Базовые темы, к которым можно вернуться':'Полный маршрут основ'}</h2></div><p>Все темы доступны. Предыдущие решения сохраняются.</p>${map.groups.map((g,index)=>`<details class="prep-group"><summary><span class="prep-group-number">${index+1}</span><span>${E(g.title)}</span><span class="prep-group-count">${g.items.filter(i=>i.tier==='core').length} шагов</span></summary><p>${E(g.lead)}</p><div class="prep-task-grid">${g.items.filter(i=>i.tier==='core').map(i=>entryCard(i)).join('')}</div></details>`).join('')}</section>${oge?`<section><div class="section-heading"><h2>Экзаменационная практика</h2></div><p>Разборы на сайте открываются отдельно. Эти материалы пока не передают результат в кабинет автоматически.</p><div class="prep-task-grid">${map.goals[goalKey].publicItems.map(i=>entryCard(i)).join('')}</div></section>`:''}`;
 }
 function labMarkup(){return `<section class="prep-lab"><h2>Выбрать и исследовать</h2><p>Здесь можно свободно пробовать модели и способы решения. Для сохранения результата и начисления баллов нажмите «Начать задание» у материала с отметкой «Результат в кабинете».</p><label class="prep-search">Найти тему<input type="search" data-prep-search placeholder="Деление, проценты, углы…"></label><div data-prep-lab-groups>${labGroups('')}</div></section>`;}
 function labGroups(query){return map.groups.map(g=>{const items=g.items.filter(i=>(g.title+' '+i.title).toLocaleLowerCase('ru').includes(query));return items.length?`<details class="prep-group" ${query?'open':''}><summary><span>${E(g.title)}</span><span class="prep-group-count">${items.length} материалов</span></summary><p>${E(g.lead)}</p><div class="prep-task-grid">${items.map(i=>entryCard(i)).join('')}</div></details>`:'';}).join('')||'<p>Такой темы пока не найдено. Попробуйте другое слово.</p>';}
 function homeMarkup(){return `${hasPersonalRoute()?`${pendingHomework()?nextMarkup():''}${personalRouteMarkup()}`:nextMarkup()}<div class="actions prep-home-links"><a class="button" href="#route">Мой маршрут</a><a class="button" href="#assignments">Мои задания</a></div>${publishedHomework().length?`<details class="prep-group"><summary>Все задания преподавателя</summary>${homeworkMarkup()}</details>`:''}<details class="prep-group"><summary>Мой учебный опыт</summary>${rewardsMarkup()}</details><p class="small prep-home-note">Вход на другом устройстве с тем же логином открывает ту же сохранённую работу. У свободных тренажёров на сайте отдельная история в браузере.</p>`;}
 function render(){if(!alive)return;section.innerHTML=`<div class="page-heading"><div><p class="eyebrow">${oge?'ПОДГОТОВКА К ОГЭ':'ОТДЕЛЬНЫЙ БАЗОВЫЙ КУРС'}</p><h1>${home?hasPersonalRoute()?'Мой путь в математике':'Моё занятие':oge?'Мой маршрут ОГЭ':'Математические основы'}</h1><p class="lead">${oge?'Своя цель, свои задания и понятный следующий шаг.':'От понятного действия — к самостоятельному решению.'}</p>${oge?`<p class="prep-goal" data-prep-goal>${E(map.goals[goalKey].title)}${!profile.goal&&!teacher()?' · стартовый маршрут, цель можно уточнить с преподавателем':''}</p>`:''}${focusMarkup(profile.focus)}</div></div>${planCoursesMarkup(plan?.note,{teacher:teacher()})}${home?homeMarkup():`${teacher()&&oge?`<label>Посмотреть подборку<select data-prep-goal-select><option value="pass" ${goalKey==='pass'?'selected':''}>Уверенно сдать</option><option value="grade5" ${goalKey==='grade5'?'selected':''}>Подготовка на 5</option></select></label>`:''}${mode==='tasks'&&(!hasPersonalRoute()||pendingHomework())?nextMarkup():''}<div class="prep-modes segmented" role="group" aria-label="Режим курса"><button type="button" data-prep-mode="tasks" aria-pressed="${mode==='tasks'}">Задания</button><button type="button" data-prep-mode="lab" aria-pressed="${mode==='lab'}">Лаборатория</button></div><div data-prep-content>${mode==='tasks'?hasPersonalRoute()?personalRouteMarkup()+`<details class="prep-group"><summary>Другие темы и тренажёры</summary>${labMarkup()}</details>`:tasksMarkup():labMarkup()}</div>${rewardsMarkup()}<p class="prep-course-link"><a href="https://mathexam.space/foundations/" target="_blank" rel="noopener">Весь базовый курс без входа ↗</a></p>`}`;
  section.querySelectorAll('[data-prep-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.prepMode;render();section.querySelector('[data-prep-mode="'+mode+'"]')?.focus();});
  section.querySelector('[data-prep-goal-select]')?.addEventListener('change',e=>{goalKey=e.target.value;render();});
  section.querySelector('[data-prep-search]')?.addEventListener('input',e=>{section.querySelector('[data-prep-lab-groups]').innerHTML=labGroups(e.target.value.trim().toLocaleLowerCase('ru'));bindStarts();});
  section.querySelector('[data-prep-current]')?.addEventListener('click',()=>{const current=section.querySelector('[aria-current="step"]');current?.focus({preventScroll:true});current?.scrollIntoView({block:'start',behavior:'auto'});});
  section.querySelectorAll('[data-prep-retry]').forEach(button=>button.addEventListener('click',load));bindStarts();
 }
 function bindStarts(){section.querySelectorAll('[data-prep-start]').forEach(button=>button.onclick=async()=>{button.disabled=true;const entry=entryFor(button.dataset.prepStart),a=entry&&latest(entry);try{await context.openContent(button.dataset.prepStart,button.dataset.prepFresh==='true'&&a?{fresh:true,sourceAttemptId:a.id}:{});}finally{if(button.isConnected)button.disabled=false;}});}
 async function load(){if(teacher())return;const result=await Promise.allSettled([context.api('/rewards'),context.api('/plan'),context.api('/progress')]);if(!alive)return;loaded=true;if(result[0].status==='fulfilled'){rewards=result[0].value.rewards||result[0].value;rewardsError=false;}else rewardsError=true;if(result[1].status==='fulfilled'){plan=result[1].value.plan||result[1].value;planError=false;}else planError=true;if(result[2].status==='fulfilled'){progress=result[2].value.progress;progressError=false;}else progressError=true;render();}
 render();load();return()=>{alive=false;section.remove();};
}
root.LearningPreparationUI={mountRoute,focusMarkup,planCoursesMarkup};
})(window);
