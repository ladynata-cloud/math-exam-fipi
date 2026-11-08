(function(){
'use strict';
const D=window.VPR_DATA,C=window.VPRCore,$=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LESSON=new Map(D.lessons.map(x=>[x.id,x]));
const TASK=new Map(D.lessons.flatMap(l=>l.tasks.map(t=>[t.id,{task:t,lesson:l}])));
const ROUTE=new Map(D.routes.map(x=>[x.id,x]));
// Keep the standalone export/import format and stable personal progress key.
function sharedContext(){
 if(window.VPRBoardMode===true||new URLSearchParams(location.search).get('board')==='1')return true;
 try{return parent!==window&&parent.location.origin===location.origin&&/\/trainers\/(?:trainer-board|group-board)\.html$/.test(parent.location.pathname);}catch(_){return false;}
}
// Repeat the privacy check here so a failed board-mode asset never reads a
// personal attempt inside a known board iframe.
const KEY='mathexam.vpr2027.offline.v1',BOARD=sharedContext();
if(BOARD){window.VPRBoardMode=true;document.documentElement.classList.add('board-mode');}
let board=null,applyingBoard=false,rendering=false,changeQueued=false;
let acceptedBoardState=null;
const emptyPanels=()=>({theory:false,notes:false,plot:false,mobileLessons:false});
let panels=emptyPanels();
const panelSelectors={theory:'.theory',notes:'.notes',plot:'.plot-lab',mobileLessons:'.mobile-lessons'};
const clone=value=>JSON.parse(JSON.stringify(value));
function canEdit(){return !BOARD||!!board?.canWrite();}
function boardWarning(message){
 let el=$('board-save-warning');
 if(!message){el?.remove();return;}
 if(!el){el=document.createElement('div');el.id='board-save-warning';el.className='feedback';el.setAttribute('role','alert');$('app').before(el);}
 el.textContent=message;
}
function changed(){
 if(!BOARD||applyingBoard||rendering||!board)return;
 // Check every edit synchronously, before the SDK's debounced notification.
 // Never evict an earlier task or silently leave an oversized local draft that
 // the room cannot accept. Restore the last complete accepted snapshot instead.
 const next=readBoardState();
 if(!board.validateState(next)){
  if(acceptedBoardState)writeBoardState(acceptedBoardState);
  boardWarning('Объём общей работы заполнен. Последнее изменение не сохранено; прежние ответы и записи сохранены. Сократи записи перед продолжением.');
  return false;
 }
 acceptedBoardState=clone(next);boardWarning('');
 if(changeQueued)return true;
 changeQueued=true;queueMicrotask(()=>{changeQueued=false;if(!applyingBoard)board?.changed();});
 return true;
}
function safeSharedInput(el){
 const unsafe=BOARD&&/<\/?[a-z][^>]*>/i.test(el.value);
 el.setCustomValidity(unsafe?'Запиши обычный текст без HTML-тегов. Математические знаки можно вводить как ≤, ≥ и ≠.':'');
 if(unsafe){el.reportValidity();return false;}return true;
}
let store={version:1,attempts:{},achievements:{},errorHistory:{},diagnostics:{},pendingSessions:{},last:{},session:null};
let storageOK=true,feedback=null,routeView={};
function validSession(s){
 if(!s||!ROUTE.has(s.route)||!Array.isArray(s.ids)||!Array.isArray(s.answers)||s.ids.length!==s.answers.length||s.ids.length<1||s.ids.length>40)return false;
 if(s.ids.some(id=>!TASK.has(id)||!TASK.get(id).lesson.routes.includes(s.route)))return false;
 if(new Set(s.ids).size!==s.ids.length||!Number.isInteger(s.index)||s.index<0||s.index>s.ids.length||typeof s.finished!=='boolean')return false;
 if(s.finished?s.index!==s.ids.length:s.index>=s.ids.length)return false;
 if(s.answers.some(x=>x!==null&&!(typeof x==='string'&&x.length<=160)&&!(Number.isInteger(x)&&x>=0&&x<30)))return false;
 return Number.isFinite(s.started)&&Number.isFinite(s.finishedAt||0);
}
function sanitize(raw){
 const clean={version:1,attempts:{},achievements:{},errorHistory:{},diagnostics:{},pendingSessions:{},last:{},session:null};
 if(!raw||raw.version!==1)return clean;
 for(const [key,v]of Object.entries(raw.attempts||{})){
  const [mode,id]=key.split(':');if(!['learn','solo'].includes(mode)||!TASK.has(id)||key!==mode+':'+id)continue;
  const task=TASK.get(id).task;
  if(C.validate(v,task,mode)){clean.attempts[key]=v;if(C.done(v,task))clean.achievements[key]={assisted:v.hints.some(Boolean)||v.shown.some(Boolean),updated:v.updated};}
 }
 for(const [key,v]of Object.entries(raw.achievements||{})){
  const [mode,id]=key.split(':');if(!['learn','solo'].includes(mode)||!TASK.has(id)||key!==mode+':'+id||!v||typeof v.assisted!=='boolean'||!Number.isFinite(v.updated))continue;
  clean.achievements[key]={assisted:v.assisted,updated:Math.max(0,v.updated)};
 }
 for(const [key,v]of Object.entries(raw.errorHistory||{})){if(TASK.has(key)&&v&&Number.isInteger(v.total)&&v.total>=0&&v.total<=1e9&&Number.isFinite(v.updated))clean.errorHistory[key]={total:v.total,updated:Math.max(0,v.updated)};}
 for(const [key,v]of Object.entries(raw.diagnostics||{}))if(ROUTE.has(key)&&validSession(v)&&v.route===key&&v.finished)clean.diagnostics[key]=v;
 for(const [key,id]of Object.entries(raw.last||{}))if(ROUTE.has(key)&&TASK.has(id)&&TASK.get(id).lesson.routes.includes(key))clean.last[key]=id;
 for(const [key,v]of Object.entries(raw.pendingSessions||{}))if(ROUTE.has(key)&&validSession(v)&&v.route===key&&!v.finished)clean.pendingSessions[key]=v;
 if(validSession(raw.session)){clean.session=raw.session;if(!raw.session.finished)clean.pendingSessions[raw.session.route]=raw.session;}
 return clean;
}
if(!BOARD)try{store=sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(_){storageOK=false;}
function save(){if(BOARD){return changed();}if(store.session){if(store.session.finished)delete store.pendingSessions[store.session.route];else store.pendingSessions[store.session.route]=store.session;}try{localStorage.setItem(KEY,JSON.stringify(store));storageOK=true;}catch(_){storageOK=false;}const el=$('save-warning');if(el){el.classList.toggle('visible',!storageOK);}}
function routeLessons(id){const route=ROUTE.get(id);return route?.lessonIds?route.lessonIds.map(key=>LESSON.get(key)).filter(Boolean):D.lessons.filter(l=>l.routes.includes(id));}
function allTasks(id){return routeLessons(id).flatMap(l=>l.tasks);}
function completed(id){return !!(store.achievements['learn:'+id]||store.achievements['solo:'+id]);}
function stats(id){const tasks=id?allTasks(id):[...TASK.values()].map(x=>x.task);return {total:tasks.length,done:tasks.filter(t=>completed(t.id)).length,solo:tasks.filter(t=>store.achievements['solo:'+t.id]).length,learn:tasks.filter(t=>store.achievements['learn:'+t.id]).length,assisted:tasks.filter(t=>store.achievements['learn:'+t.id]?.assisted&&!store.achievements['solo:'+t.id]).length};}
function href(params){const p=new URLSearchParams();for(const [k,v]of Object.entries(params))if(v!==undefined&&v!==null)p.set(k,v);return '#'+(p.toString()||'view=home');}
function go(params){
 if(!canEdit())return;
 feedback=null;panels=emptyPanels();const next=href(params);
 if(location.hash===next){render();changed();window.scrollTo(0,0);}else location.hash=next;
}
function parseParams(p){
 const requested=p.get('view'),taskId=p.get('task'),entry=TASK.get(taskId);
 const route=ROUTE.has(p.get('route'))?p.get('route'):entry?.lesson.routes[0];
 const lesson=p.get('lesson')||entry?.lesson.id;
 const view=requested||(taskId||lesson?'lesson':route?'route':'home');
 const mode=p.get('mode')==='solo'?'solo':'learn';
 if(!BOARD&&['about','progress','errors'].includes(view))return {view};
 if(['route','lesson',...(!BOARD?['diagnostic']:[])].includes(view)&&ROUTE.has(route)){
  if(view==='lesson'){
   const l=LESSON.get(lesson);if(!l||!l.routes.includes(route))return {view:'route',route};
   return {view,route,lesson,task:entry?.lesson.id===lesson?taskId:l.tasks[0].id,mode};
  }
  return {view,route};
 }
 return {view:'home'};
}
function parse(){return parseParams(new URLSearchParams(location.hash.slice(1)));}
function entryPath(v=routeView){
 const p=new URLSearchParams();
 if(v.route)p.set('route',v.route);
 if(v.view==='lesson'){p.set('lesson',v.lesson);p.set('task',v.task);p.set('mode',v.mode);}
 return '/trainers/vpr-math/index.html'+(p.size?'?'+p:'');
}
// Query links from a cabinet/board are consumed once. Thereafter the hash is
// authoritative, including an explicit home route; unrelated URL fields stay put.
if(!location.hash){const initial=parseParams(new URLSearchParams(location.search));history.replaceState(null,'',location.pathname+location.search+href(initial));}
function updateEntryLinks(){
 const link=$('open-board');if(link)link.href='../trainer-board.html?trainer='+encodeURIComponent(entryPath());
 const back=$('return-cabinet');if(!back)return;
 try{if(parent!==window&&parent.location.origin===location.origin&&/^\/learning\/(?:index\.html)?$/.test(parent.location.pathname)){back.href=parent.location.href;back.target='_top';}}
 catch(_){}
}

function action(name,label,attrs='',cls='btn'){return `<button type="button" class="${cls}" data-action="${name}" ${attrs}>${label}</button>`;}
function routeButton(id,label,cls='btn'){return action('route',label,`data-route="${esc(id)}"`,cls);}
function taskButton(route,lesson,task,label,mode='learn',cls='btn'){return action('task',label,`data-route="${esc(route)}" data-lesson="${esc(lesson)}" data-task="${esc(task)}" data-mode="${mode}"`,cls);}
function crumb(route,lesson){return `<div class="crumb">${action('home','Все курсы','','text-btn')}<span>/</span>${lesson?routeButton(route.id,esc(route.title),'text-btn'):`<span>${esc(route.title)}</span>`}${lesson?`<span>/</span><span>${esc(lesson.title)}</span>`:''}</div>`;}
function diagram(t){return t.svg?`<div class="diagram">${t.svg}</div>`:'';}
function home(){
 const ss=stats();
 return `<section class="hero"><div><div class="tag"><span class="dot"></span> Подготовка • 2027</div><h1>Математика к ВПР.<br>Понятно, по шагам.</h1><p>Выбери класс, разберись в теме и попробуй решить самостоятельно. ${BOARD?'Выбранная задача и решение общие для участников комнаты.':'Твоё продвижение сохраняется.'}</p><div class="meta-line"><div><strong>${D.routes.length}</strong>учебных маршрутов</div><div><strong>${D.lessons.length}</strong>уроков</div><div><strong>${TASK.size}</strong>задания</div></div></div><div class="hero-visual" aria-hidden="true"><svg viewBox="0 0 420 260"><defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="#b7caa7" stroke-width=".5"/></pattern></defs><rect width="420" height="260" fill="url(#grid)"/><circle cx="282" cy="118" r="68" fill="none" stroke="#176848" stroke-width="2"/><path d="M100 185L210 45L320 185Z" fill="#d5e9a2" fill-opacity=".7" stroke="#176848" stroke-width="2.5"/><path d="M210 45L210 185M100 185L282 118" stroke="#176848" stroke-width="1.5" stroke-dasharray="5 5"/><circle cx="100" cy="185" r="5" fill="#176848"/><circle cx="210" cy="45" r="5" fill="#176848"/><circle cx="320" cy="185" r="5" fill="#176848"/><text x="197" y="29" fill="#176848" font-size="15">A</text><text x="79" y="197" fill="#176848" font-size="15">B</text><text x="327" y="198" fill="#176848" font-size="15">C</text></svg><span class="visual-caption">ОТ ПОНИМАНИЯ — К РЕШЕНИЮ</span></div></section><div class="section-title"><h2>С какого класса начнём?</h2><p>${ss.done?`Пройдено ${ss.done} из ${ss.total} заданий`:'Можно начать с любой темы'}</p></div><section class="course-grid" aria-label="Курсы ВПР">${D.routes.map(r=>{const lessons=routeLessons(r.id),s=stats(r.id);return `<article class="course ${r.advanced?'advanced':''}"><div class="course-top"><div class="grade-badge">${r.grade}</div><div><span class="eyebrow">${esc(r.level)}</span><h3>${r.grade} класс</h3></div></div><p>${esc(r.description)}</p><div class="course-meta"><span>${lessons.length} тем · ${s.total} заданий</span><span>${s.done?`${s.done} пройдено`:'с нуля'}</span></div>${routeButton(r.id,`Открыть курс <span class="arrow">↗</span>`,r.advanced?'btn secondary':'btn')}</article>`;}).join('')}</section><div class="info-strip"><p><strong>Удобно учиться понемногу.</strong> Начни с короткой диагностики или выбери нужную тему. Каждый урок: правило, пример, шесть заданий и понятный разбор. Углублённые маршруты содержат общую основу и дополнительные темы.</p></div>`;
}
function routePage(id){const r=ROUTE.get(id),ls=routeLessons(id),s=stats(id),pct=Math.round(100*s.done/s.total),next=store.last[id]||ls[0].tasks[0].id,n=TASK.get(next);return `${crumb(r)}<section class="route-head"><div><div class="eyebrow">${esc(r.level)} · учебный маршрут</div><h1>${esc(r.title)}</h1><p>${esc(r.description)}. ${ls.length} тем: от первых действий до самостоятельного решения.</p></div><div class="route-stats"><b>${pct}%</b><small>${s.done} из ${s.total}<br>заданий пройдено</small><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div></section><div class="route-actions">${taskButton(id,n.lesson.id,next,s.done?'Продолжить обучение':'Начать с первой темы')}${action('diagnostic','Проверить свои знания',`data-route="${id}"`,'btn secondary')}${action('errors','Мои ошибки','','btn tertiary')}</div><div class="section-title"><h2>Программа курса</h2><p>Каждая тема открыта — выбирай свой темп</p></div><section class="lesson-grid">${ls.map((l,i)=>{const count=l.tasks.filter(t=>completed(t.id)).length;return taskButton(id,l.id,l.tasks[0].id,`<span class="lesson-num">${count===l.tasks.length?'✓':String(i+1).padStart(2,'0')}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.section)} · ${count}/${l.tasks.length} заданий</p></div><span class="arrow">›</span>`,'learn','lesson-card');}).join('')}</section><p class="inline-note">Диагностика и процент прохождения — учебные показатели. Они не заменяют официальную оценку ВПР и проверку развёрнутых решений преподавателем.</p>`;}
function getState(task,mode){const k=mode+':'+task.id;return store.attempts[k]||(store.attempts[k]=C.blank(task,mode));}
function setAchievement(s,t){if(BOARD)return;if(C.done(s,t)){const key=s.mode+':'+t.id;const assisted=s.hints.some(Boolean)||s.shown.some(Boolean);const old=store.achievements[key];store.achievements[key]={assisted:old?old.assisted&&assisted:assisted,updated:Date.now()};}}
function renderAnswer(step,value,context,index){const id=`answer-${context}-${index}`;return step.answer.kind==='choice'?`<div class="choices" role="radiogroup" aria-label="Варианты ответа">${step.options.map((o,i)=>`<button type="button" class="choice ${value===i?'chosen':''}" role="radio" aria-checked="${value===i}" data-action="choice" data-context="${context}" data-index="${index}" data-choice="${i}">${esc(o)}</button>`).join('')}</div>`:`<label class="visually-hidden" for="${id}">${esc(step.prompt)}</label><input id="${id}" class="answer-input" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" maxlength="160" aria-describedby="format-${context}-${index}" data-answer="${context}" data-index="${index}" value="${esc(value)}" placeholder="${['set','tuple'].includes(step.answer.kind)?'Например: −2; 3':'Введи ответ'}"><div class="format-help" id="format-${context}-${index}">${step.answer.kind==='tuple'?'Запиши все значения в указанном порядке через ; .':step.answer.kind==='set'?'Все числа через ; . Запятая внутри числа — десятичная.':'Число, десятичная или обыкновенная дробь. Без единиц.'}</div>`;}
function taskPage(v){
 const r=ROUTE.get(v.route),l=LESSON.get(v.lesson),t=TASK.get(v.task).task,s=getState(t,v.mode),ls=routeLessons(v.route),li=ls.indexOf(l),ti=l.tasks.indexOf(t),st=C.stage(s,t),isDone=C.done(s,t);
 store.last[v.route]=t.id;save();
 const list=ls.map((x,i)=>action('task',`<small>${i+1}</small>${esc(x.title)}`,`data-route="${r.id}" data-lesson="${x.id}" data-task="${x.tasks[0].id}" data-mode="${v.mode}"`,x.id===l.id?'active':'')).join('');
 const theory=`<details class="theory"><summary>Коротко о теме · правило и пример</summary><div class="theory-inside">${l.theory.map(p=>`<p>${esc(p)}</p>`).join('')}<div class="worked-example"><h3>Разберём пример</h3><p>${esc(l.example.prompt)}</p><ol>${l.example.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p><strong>Ответ: ${esc(l.example.answer)}</strong></p></div></div></details>`;
 const indices=v.mode==='solo'&&!t.assessAllSteps?[t.steps.length-1]:t.steps.map((_,i)=>i).filter(i=>i<=st||isDone);
 const steps=indices.map(i=>{const p=t.steps[i];if(s.solved[i])return `<section class="step done ${s.shown[i]?'assisted':''}" data-step="${i}"><div class="step-head">${s.shown[i]?'Разобрано с помощью':'✓ Верно'} · ${v.mode==='solo'?'самостоятельный ответ':`шаг ${i+1}`}</div><h3>${esc(p.prompt)}</h3><div class="correct-answer">${esc(C.format(p.answer,p.options))}</div><p class="solution-note">${esc(p.solution)}</p></section>`;
  const hints=v.mode==='learn'?`<div class="hint-area">${s.mistakes[i]>=2?action('hint',s.hints[i]?'Подсказка открыта':'Нужна подсказка',`data-index="${i}" ${s.hints[i]?'disabled':''}`,'btn small secondary'):'<span class="hint-locked">Подсказка появится после двух неверных попыток.</span>'}${s.hints[i]?action('solution','Показать этот шаг',`data-index="${i}"`,'text-btn'):''}</div>${s.hints[i]?`<div class="hint-text">${esc(p.hint)}</div>`:''}`:'';
  return `<section class="step current" data-step="${i}"><div class="step-head"><span class="number">${v.mode==='solo'?'?':i+1}</span>${v.mode==='solo'?(t.assessAllSteps?`самостоятельный шаг ${i+1} из ${t.steps.length}`:'Самостоятельный ответ'):`шаг ${i+1} из ${t.steps.length}`}</div><h3>${esc(p.prompt)}</h3><form data-submit="answer" data-index="${i}"><div class="answer-form"><div style="flex:1;min-width:0">${renderAnswer(p,s.answers[i],'task',i)}</div>${action('check','Проверить',`data-index="${i}"`,'btn')}</div></form>${feedback&&feedback.task===t.id&&feedback.index===i?`<div class="feedback" role="status">${esc(feedback.text)}</div>`:''}${hints}</section>`;}).join('');
 const nextTask=l.tasks[ti+1]||ls[li+1]?.tasks[0],nextLesson=l.tasks[ti+1]?l:ls[li+1];
 const complete=isDone?`<section class="complete"><h3>${v.mode==='solo'?'Ответ найден самостоятельно':s.shown.some(Boolean)?'Задание разобрано':'Все шаги выполнены'}</h3><p>${esc(t.finalExplanation)}</p>${s.shown.some(Boolean)?'<p>В одном из шагов открыт ответ. Закрепи способ в следующем задании, а затем попробуй самостоятельный режим.</p>':''}<div class="self-check"><label><input type="checkbox">Я могу объяснить ход решения и записать его в тетради.</label></div><div class="complete-actions">${nextTask?taskButton(r.id,nextLesson.id,nextTask.id,'Следующее задание →',v.mode):routeButton(r.id,'Вернуться к программе')}${v.mode==='learn'?action('mode','Попробовать самостоятельно','data-mode="solo"','btn secondary'):action('mode','Посмотреть шаги','data-mode="learn"','btn secondary')}</div></section>`:'';
 return `${crumb(r,l)}<div class="work-grid"><aside class="side"><div class="side-title">${esc(r.title)}</div>${list}</aside><section class="lesson-content"><details class="mobile-lessons"><summary>Все темы курса</summary><label class="visually-hidden" for="lesson-select">Выбери тему</label><select id="lesson-select" data-route="${r.id}">${ls.map((x,i)=>`<option value="${x.id}" ${x.id===l.id?'selected':''}>${i+1}. ${esc(x.title)}</option>`).join('')}</select></details><div class="lesson-heading"><div class="eyebrow">Тема ${li+1} из ${ls.length} · ${esc(l.section)}</div><h1>${esc(l.title)}</h1><p>${esc(l.goal)}</p></div>${v.mode==='learn'?theory:''}<div class="toolbar"><div class="segmented" aria-label="Режим работы">${action('mode','По шагам',`data-mode="learn" aria-pressed="${v.mode==='learn'}"`,v.mode==='learn'?'selected':'')}${action('mode','Самостоятельно',`data-mode="solo" aria-pressed="${v.mode==='solo'}"`,v.mode==='solo'?'selected':'')}</div><div class="task-tabs" aria-label="Задания темы">${l.tasks.map((x,i)=>action('task',`${i+1}`,`data-route="${r.id}" data-lesson="${l.id}" data-task="${x.id}" data-mode="${v.mode}" aria-label="Задание ${i+1}${completed(x.id)?', пройдено':''}" aria-pressed="${x.id===t.id}"`,`task-tab ${x.id===t.id?'active':''} ${completed(x.id)?'completed':''}`)).join('')}</div></div><article class="task-card"><div class="task-top"><span class="task-level">${({start:'Первые шаги',practice:'Закрепление',exam:'Применяем способ'})[t.level]}</span><span class="task-index">Задание ${ti+1} из ${l.tasks.length}</span></div><p class="task-prompt">${esc(t.prompt)}</p>${diagram(t)}</article>${v.mode==='learn'?window.VPRPlot.render(t,s):''}<p class="mode-note">${v.mode==='learn'?'Проверяй по одному шагу. Выполненные действия останутся перед глазами.':(t.assessAllSteps?'Пройди всю цепочку обоснований без подсказок. Полное письменное доказательство обсуди с преподавателем.':'Реши в тетради и введи итоговый ответ. Подсказок в этом режиме нет. Развёрнутое решение обсуди с преподавателем.')}</p><div class="steps">${steps}</div>${complete}<details class="notes"><summary>${BOARD?'Общие записи к заданию':'Мои записи к этому заданию'}</summary><label class="visually-hidden" for="task-notes">Черновик решения</label><textarea id="task-notes" maxlength="10000" placeholder="Запиши действия или то, что пока непонятно…">${esc(s.notes)}</textarea><p class="format-help">${BOARD?'Записи видны участникам комнаты.':'Записи сохраняются в этом браузере.'} Они не оцениваются автоматически.</p></details><div class="bottom-actions">${routeButton(r.id,'← К программе курса','btn secondary')}${action('restart','Повторить это задание','','text-btn')}</div><p class="storage-note">${BOARD?'Совместное решение сохраняется в комнате отдельно от личного прогресса.':storageOK?'Прогресс хранится в этом браузере. В разделе «Мой прогресс» можно скачать его копию.':'Сохранение недоступно. Скачай прогресс перед закрытием файла.'}</p></section></div>`;
}
function startDiagnostic(route){
 const s=store.session?.route===route?store.session:store.pendingSessions[route];
 if(s&&s.route===route&&!s.finished){store.session=s;save();go({view:'diagnostic',route});return;}
 const prev=store.diagnostics[route];
 const ls=routeLessons(route),ids=ls.map((l,i)=>{const choices=l.tasks.filter(t=>t.level==='exam');const previousId=prev?.ids.find(id=>l.tasks.some(t=>t.id===id));const previousIndex=choices.findIndex(t=>t.id===previousId);const pick=previousIndex<0?0:(previousIndex+1)%choices.length;return (choices[pick]||l.tasks.at(-1)).id;});
 store.session={route,ids,answers:ids.map(()=>null),index:0,finished:false,started:Date.now(),finishedAt:0};save();go({view:'diagnostic',route});
}
function diagnosticPage(route){const r=ROUTE.get(route),s=store.session?.route===route?store.session:(store.pendingSessions[route]||store.diagnostics[route]);if(!s)return `${crumb(r)}<div class="empty"><h2>Проверим, с чего начать?</h2><p>По одной задаче из каждой темы. Можно пропускать задания; разбор появится в конце.</p>${action('diagnostic','Начать диагностику',`data-route="${route}"`)}</div>`;if(s.finished)return diagnosticResult(s);store.session=s;save();
 const t=TASK.get(s.ids[s.index]).task,p=t.steps.at(-1),i=s.index,pct=Math.round(100*i/s.ids.length);
 return `${crumb(r)}<section class="assessment"><div class="assessment-head"><div><h1>Проверяем основу</h1><p>${esc(r.title)}. Реши самостоятельно. Результат и темы для повторения появятся после последнего задания.</p></div><span class="assessment-count">${i+1} / ${s.ids.length}</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><article class="task-card"><p class="task-prompt">${esc(t.prompt)}</p>${diagram(t)}</article><section class="step current"><h3>${esc(p.prompt)}</h3><form data-submit="diagnostic"><div class="answer-form"><div style="flex:1;min-width:0">${renderAnswer(p,s.answers[i]??'','diagnostic',i)}</div></div><div class="route-actions">${action('diagnostic-next',i===s.ids.length-1?'Завершить диагностику':'Сохранить ответ →')}${action('diagnostic-skip','Пропустить','','btn secondary')}</div></form>${feedback?.diagnostic?`<p class="feedback" role="status">${esc(feedback.text)}</p>`:''}</section><p class="inline-note">Это учебная диагностика, а не официальный вариант ВПР. Черновик решения веди в тетради.</p></section>`;
}
function diagnosticResult(s){const r=ROUTE.get(s.route),items=s.ids.map((id,i)=>{const x=TASK.get(id),step=x.task.steps.at(-1);return {...x,step,value:s.answers[i],ok:C.judge(step.answer,s.answers[i]).correct};}),score=items.filter(x=>x.ok).length;return `${crumb(r)}<section class="result-hero"><div class="eyebrow" style="color:var(--lime)">Диагностика завершена</div><h1>${esc(r.title)}</h1><div class="result-score">${score} / ${items.length}</div><p>${score===items.length?'Все итоговые ответы верны. Проверь письменные решения с преподавателем и переходи к новым заданиям.':'Начни с тем, отмеченных «повторить»: в них есть объяснения, примеры и решение по шагам.'}</p></section><p class="inline-note">Считаются итоговые ответы. Полнота доказательств и записи решения здесь автоматически не оценивается.</p><div class="result-list">${items.map(x=>`<article class="result-item"><div class="result-item-head"><div><h3>${esc(x.lesson.title)}</h3><p>${x.value===null?'Задание пропущено':`Твой ответ: ${esc(typeof x.value==='number'?x.step.options?.[x.value]??x.value:x.value)}`}</p></div><span class="${x.ok?'badge-ok':'badge-review'}">${x.ok?'верно':'повторить'}</span></div><details><summary>Проверить ответ и ход решения</summary><p>${esc(x.task.prompt)}</p><ol>${x.task.steps.map(p=>`<li>${esc(p.prompt)} — <strong>${esc(C.format(p.answer,p.options))}</strong>. ${esc(p.solution)}</li>`).join('')}</ol></details>${!x.ok?`<div style="margin-top:12px">${taskButton(r.id,x.lesson.id,x.task.id,'Разобрать эту задачу','learn','btn small secondary')}</div>`:''}</article>`).join('')}</div><div class="route-actions">${routeButton(r.id,'К программе курса')}${action('diagnostic-new','Пройти другой набор',`data-route="${r.id}"`,'btn secondary')}</div>`;}
function errorItems(){const map=new Map();for(const [id,record]of Object.entries(store.errorHistory)){const x=TASK.get(id);if(x&&record.total)map.set(id,{...x,total:record.total});}for(const [key,s]of Object.entries(store.attempts)){const total=s.mistakes.reduce((a,b)=>a+b,0);if(!total)continue;const x=TASK.get(s.taskId);const old=map.get(s.taskId);map.set(s.taskId,{...x,total:total+(old?.total||0)});}return [...map.values()].sort((a,b)=>b.total-a.total);}
function errorsPage(){const items=errorItems();return `<div class="crumb">${action('home','Все курсы','','text-btn')}<span>/</span><span>Мои ошибки</span></div><div class="section-title"><h1 style="font-size:35px">Вернёмся к трудным местам</h1></div><p class="inline-note">Здесь задания, в которых были неверные попытки. Повторная тренировка помогает проверить, понятен ли способ решения.</p>${items.length?`<div class="result-list">${items.map(x=>`<article class="result-item"><div class="result-item-head"><div><h3>${esc(x.lesson.title)}</h3><p>${esc(x.task.prompt)}</p><p>Неверных попыток: ${x.total}. ${completed(x.task.id)?'Задание уже пройдено.':'Пока не завершено.'}</p></div></div><div class="route-actions">${taskButton(x.lesson.routes[0],x.lesson.id,x.task.id,'Вернуться к шагам','learn','btn small secondary')}${taskButton(x.lesson.routes[0],x.lesson.id,x.task.id,'Решить самостоятельно','solo','btn small')}</div></article>`).join('')}</div>`:'<div class="empty"><h2>Пока записей нет</h2><p>Если в ответе будет ошибка, задание появится здесь.</p></div>'}`;}
function progressPage(){const s=stats();return `<div class="crumb">${action('home','Все курсы','','text-btn')}<span>/</span><span>Мой прогресс</span></div><h1 style="font-size:35px">Учусь в своём темпе</h1><p class="inline-note">Общая основа обычного и углублённого маршрутов считается один раз. Повтор задания сохраняет отметку о предыдущем прохождении.</p><div class="report-grid"><div class="report-metric"><b>${s.done}</b><small>заданий пройдено</small></div><div class="report-metric"><b>${s.solo}</b><small>итогов решено самостоятельно</small></div><div class="report-metric"><b>${s.assisted}</b><small>разобрано с помощью</small></div></div><div class="result-list">${D.routes.map(r=>{const st=stats(r.id),diag=store.diagnostics[r.id];return `<article class="result-item"><div class="result-item-head"><div><h3>${esc(r.title)} · ${esc(r.level)}</h3><p>Пройдено ${st.done} / ${st.total} · самостоятельно ${st.solo}</p></div>${routeButton(r.id,'Открыть','btn small secondary')}</div><div class="progress-track" style="margin-top:12px"><div class="progress-fill" style="width:${Math.round(100*st.done/st.total)}%"></div></div>${diag?`<p>Диагностика: ${diag.ids.filter((id,i)=>C.judge(TASK.get(id).task.steps.at(-1).answer,diag.answers[i]).correct).length} / ${diag.ids.length} итоговых ответов.</p>`:''}</article>`;}).join('')}</div><div class="data-actions">${action('export','Скачать прогресс','','btn secondary')}${action('import','Загрузить прогресс','','btn secondary')}${action('print','Распечатать отчёт','','btn tertiary')}${action('errors','Открыть мои ошибки','','btn tertiary')}</div><p class="inline-note">Прогресс относится к этому браузеру и устройству. Перед сменой устройства скачай копию, затем загрузи её в тот же комплект курсов. Из кабинета открывается назначенный курс. Результаты этой практики хранятся в браузере отдельно от серверной истории кабинета; совместная комната хранит свой разбор.</p>${feedback?.import?`<p class="feedback ${feedback.ok?'good':''}" role="status">${esc(feedback.text)}</p>`:''}<input type="file" id="progress-file" accept="application/json,.json" hidden>`;}
function aboutPage(){return `<article class="prose"><div class="tag">MathExam · авторские материалы</div><h1>Как устроены курсы</h1><p>Семь маршрутов для 5, 6, 7, 8 и 10 классов. В 7-м и 8-м предусмотрены обычный и углублённый маршруты. Для 9-го класса отдельная ВПР по математике не предусмотрена.</p><h2>От понимания к самостоятельности</h2><ol><li>Открой нужную тему или начни с диагностики.</li><li>В режиме «По шагам» проверь каждое действие. После двух неверных попыток можно открыть подсказку.</li><li>Сохраняй запись решения в тетради или поле «Мои записи». Уже выполненные шаги не исчезают.</li><li>В режиме «Самостоятельно» вводи итоговый ответ без подсказок. Для задач с полным решением объясни ход решения преподавателю.</li><li>Вернись к списку ошибок и попробуй ещё раз.</li></ol><h2>На какие материалы опираемся</h2><p>Структура направлений сверена с описаниями ВПР-2027 Рособрнадзора. Задания курса составлены для тренировки и не являются официальными КИМ. Краткие уроки и диагностика не воспроизводят целый экзаменационный вариант.</p><ul><li><a href="https://fioco.ru/obraztsi_i_opisaniya_vpr" target="_blank" rel="noopener noreferrer">ФИОКО: образцы и описания ВПР</a></li><li><a href="${esc(D.sources.primary_publication_index.url)}" target="_blank" rel="noopener noreferrer">Перечень образцов ВПР-2027 Центра мониторинга качества образования</a></li>${D.sources.routes.map(r=>`<li><a href="${esc(r.official_description_url)}" target="_blank" rel="noopener noreferrer">${r.grade} класс${r.level==='углублённый'?' · углублённый уровень':r.level==='базовый'?' · базовый уровень':''}: описание работы 2027</a> · <a href="${esc(r.read_description_mirror_url)}" target="_blank" rel="noopener noreferrer">копия того же документа</a></li>`).join('')}</ul><p>Проверка источников: 7 ноября 2026 года. В старших маршрутах важно отдельно готовиться к алгебре, геометрии и вероятности. Для геометрических доказательств и построений тренажёр даёт подготовительные действия; самостоятельные чертежи и полное доказательство проверяет преподаватель.</p><h2>Что сохраняется</h2><p>Ответы, пройденные шаги, использованные подсказки, ошибки, записи и результаты диагностики сохраняются локально. В разделе «Мой прогресс» есть переносимая копия данных. Личные ответы остаются в этом браузере; копию можно скачать и перенести. Для открытия страниц сайта и совместной комнаты нужен интернет.</p><p>Маршруты можно назначать через существующую программу ученика. Кнопка «На общую доску» открывает выбранную задачу: преподаватель создаёт комнату и передаёт ученику её ссылку. Общие ответы, подсказки, графики и записи не записываются в личный прогресс.</p><h2>Для преподавателя</h2><p>Все темы открыты. Можно показать условие на экране и вместе разобрать ход решения. На общей доске выбранная задача и действия синхронизируются; право управления передаётся средствами комнаты. Диагностика помогает выбрать темы, но не выставляет официальную отметку ВПР.</p>${action('home','К выбору курса')}</article>`;}
function render(){
 const previous=routeView;routeView=parse();const v=routeView;
 if(!applyingBoard&&(v.view!==previous.view||v.task!==previous.task||v.mode!==previous.mode))panels=emptyPanels();
 rendering=true;
 try{
  const html=v.view==='route'?routePage(v.route):v.view==='lesson'?taskPage(v):v.view==='diagnostic'?diagnosticPage(v.route):v.view==='progress'?progressPage():v.view==='errors'?errorsPage():v.view==='about'?aboutPage():home();
  $('app').innerHTML=html;$('save-warning').classList.toggle('visible',!BOARD&&!storageOK);
  document.title=(v.view==='lesson'?LESSON.get(v.lesson).title:v.route?ROUTE.get(v.route).title:'ВПР по математике')+' · MathExam';
  for(const [name,selector]of Object.entries(panelSelectors)){const el=document.querySelector(selector);if(el)el.open=panels[name];else panels[name]=false;}
  updateEntryLinks();
 }finally{rendering=false;}
}
function readBoardState(){
 const cur=current();
 const currentKey=cur?cur.state.mode+':'+cur.task.id:null;
 const pack=attempt=>({...clone(attempt),plotPoints:clone(attempt.plotPoints||[])});
 const hasWork=attempt=>attempt.notes||attempt.answers.some(value=>value!=='')||
  ['solved','mistakes','hints','shown'].some(key=>attempt[key].some(Boolean))||attempt.plotPoints?.length;
 // Only in-memory room work is shared. Visiting an untouched task consumes no
 // archive space, and learning/independent attempts remain separate by key.
 const history=BOARD?Object.entries(store.attempts).filter(([key,attempt])=>key!==currentKey&&hasWork(attempt))
  .sort(([a],[b])=>a.localeCompare(b)).map(([,attempt])=>pack(attempt)):[];
 return {version:1,view:{...routeView},attempt:cur?{...clone(cur.state),plotPoints:clone(cur.state.plotPoints||[])}:null,
  history,feedback:cur&&feedback?.task===cur.task.id&&feedback.index===C.stage(cur.state,cur.task)?clone(feedback):null,panels:{...panels}};
}
function writeBoardState(value){
 if(!BOARD)throw new TypeError('Shared state is unavailable in personal mode');
 applyingBoard=true;
 try{
  feedback=value.feedback;panels={...value.panels};
  // The complete bounded room archive is authoritative, including intentional
  // restarts. Never merge it with personal progress or stale local room work.
  store.attempts=Object.fromEntries(value.history.map(attempt=>[attempt.mode+':'+attempt.taskId,clone(attempt)]));
  if(value.attempt)store.attempts[value.view.mode+':'+value.view.task]=clone(value.attempt);
  history.replaceState(null,'',location.pathname+location.search+href(value.view));render();
  acceptedBoardState=clone(value);
 }finally{applyingBoard=false;}
}

function current(){if(routeView.view!=='lesson')return null;const t=TASK.get(routeView.task).task;return {task:t,state:getState(t,routeView.mode)};}
function check(index){if(!canEdit())return;const cur=current();if(!cur)return;const {task:t,state:s}=cur;if(index!==C.stage(s,t)||C.done(s,t))return;const p=t.steps[index],result=C.judge(p.answer,s.answers[index]);if(!result.valid){feedback={task:t.id,index,text:result.message};render();changed();return;}if(result.correct){s.solved[index]=true;feedback=null;setAchievement(s,t);}else{s.mistakes[index]=Math.min(s.mistakes[index]+1,1e6);feedback={task:t.id,index,text:s.mode==='learn'?(s.mistakes[index]>=2?'Пока не совпало. Проверь действие; теперь можно открыть подсказку.':'Пока не совпало. Попробуй ещё раз: проверь знак, действие и единицы. Ничего не потеряно.'):'Пока не совпало. Проверь решение в тетради и попробуй ещё раз.'};}s.updated=Date.now();if(save()===false)return;render();if(result.correct)requestAnimationFrame(()=>{const el=document.querySelector('.step.current');if(el){const rect=el.getBoundingClientRect();if(rect.bottom>innerHeight-15)el.scrollIntoView({block:'nearest',behavior:'smooth'});}});}
function diagnosticNext(skip){const s=store.session;if(!s||s.finished)return;const t=TASK.get(s.ids[s.index]).task;if(skip)s.answers[s.index]=null;else{const result=C.judge(t.steps.at(-1).answer,s.answers[s.index]);if(!result.valid){feedback={diagnostic:true,text:result.message};render();return;}}s.index++;feedback=null;if(s.index>=s.ids.length){s.finished=true;s.finishedAt=Date.now();store.diagnostics[s.route]=JSON.parse(JSON.stringify(s));}if(save()===false)return;render();window.scrollTo(0,0);}
function download(){const blob=new Blob([JSON.stringify({...store,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='MathExam_VPR_progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function processAction(el){if(!canEdit())return;const a=el.dataset.action,d=el.dataset;if(BOARD&&['about','progress','errors','diagnostic','diagnostic-new','diagnostic-next','diagnostic-skip','export','import','print'].includes(a))return;switch(a){case'home':go({});break;case'route':go({view:'route',route:d.route});break;case'task':go({view:'lesson',route:d.route,lesson:d.lesson,task:d.task,mode:d.mode||'learn'});break;case'mode':go({...routeView,mode:d.mode});break;case'about':go({view:'about'});break;case'progress':go({view:'progress'});break;case'errors':go({view:'errors'});break;case'check':check(Number(d.index));break;case'choice':{const idx=Number(d.index),val=Number(d.choice);if(d.context==='task'){const cur=current();if(!cur||idx!==C.stage(cur.state,cur.task))return;cur.state.answers[idx]=val;cur.state.updated=Date.now();}else{const s=store.session;if(!s||s.finished||idx!==s.index)return;s.answers[idx]=val;}if(save()===false)return;feedback=null;render();break;}case'hint':{const cur=current(),i=Number(d.index);if(cur&&cur.state.mode==='learn'&&cur.state.mistakes[i]>=2&&C.stage(cur.state,cur.task)===i){cur.state.hints[i]=true;cur.state.updated=Date.now();if(save()===false)return;render();}break;}case'solution':{const cur=current(),i=Number(d.index);if(cur&&cur.state.mode==='learn'&&cur.state.hints[i]&&C.stage(cur.state,cur.task)===i){cur.state.shown[i]=true;cur.state.solved[i]=true;cur.state.updated=Date.now();setAchievement(cur.state,cur.task);if(save()===false)return;feedback=null;render();}break;}case'restart':{const cur=current();if(!cur)return;const mistakes=cur.state.mistakes.reduce((a,b)=>a+b,0);if(mistakes){const prev=store.errorHistory[cur.task.id];store.errorHistory[cur.task.id]={total:Math.min(1e9,(prev?.total||0)+mistakes),updated:Date.now()};}const next=C.blank(cur.task,cur.state.mode);next.notes=cur.state.notes;next.updated=Date.now();store.attempts[cur.state.mode+':'+cur.task.id]=next;if(save()===false)return;feedback=null;render();break;}case'diagnostic':startDiagnostic(d.route);break;case'diagnostic-new':store.session=null;delete store.pendingSessions[d.route];startDiagnostic(d.route);break;case'diagnostic-next':diagnosticNext(false);break;case'diagnostic-skip':diagnosticNext(true);break;case'export':download();break;case'import':$('progress-file').click();break;case'print':window.print();break;case'plot-add':{const cur=current();if(!cur||!cur.task.plot)return;const x=Number($('plot-x').value),y=Number($('plot-y').value);if($('plot-x').value===''||$('plot-y').value==='')return;addPlotPoint([x,y]);break;}case'plot-clear':{const cur=current();if(cur){cur.state.plotPoints=[];cur.state.updated=Date.now();panels.plot=true;if(save()===false)return;render();}break;}}}
function addPlotPoint(point){if(!canEdit())return;const cur=current();if(!cur?.task.plot||!window.VPRPlot.validPoints([point],cur.task.plot))return;const points=window.VPRPlot.validPoints(cur.state.plotPoints,cur.task.plot)?cur.state.plotPoints:[];cur.state.plotPoints=points.length<window.VPRPlot.count(cur.task.plot)?[...points,point]:[point];cur.state.updated=Date.now();panels.plot=true;if(save()===false)return;render();}
document.addEventListener('click',e=>{if(!canEdit()){e.preventDefault();return;}const svg=e.target.closest('#interactive-plot');if(svg){const cur=current();if(cur?.task.plot){const p=window.VPRPlot.point(e,svg,cur.task.plot);if(p)addPlotPoint(p);}return;}const el=e.target.closest('[data-action]');if(!el||el.disabled)return;e.preventDefault();processAction(el);});
document.addEventListener('input',e=>{if(!canEdit())return;const el=e.target;if(el.matches('[data-answer]')){if(!safeSharedInput(el))return;feedback=null;}if(el.matches('[data-answer]')){const i=Number(el.dataset.index);if(el.dataset.answer==='task'){const c=current();if(c&&i===C.stage(c.state,c.task)){c.state.answers[i]=el.value.slice(0,160);c.state.updated=Date.now();save();}}else if(store.session&&!store.session.finished&&store.session.index===i){store.session.answers[i]=el.value.slice(0,160);save();}}else if(el.id==='task-notes'){if(!safeSharedInput(el))return;const c=current();if(c){c.state.notes=el.value.slice(0,10000);c.state.updated=Date.now();save();}}});
document.addEventListener('submit',e=>{if(!canEdit()){e.preventDefault();return;}const f=e.target;if(f.dataset.submit){e.preventDefault();if(f.dataset.submit==='answer')check(Number(f.dataset.index));else diagnosticNext(false);}});
document.addEventListener('change',async e=>{if(!canEdit())return;const el=e.target;if(el.id==='lesson-select'){const l=LESSON.get(el.value);if(l)go({view:'lesson',route:el.dataset.route,lesson:l.id,task:l.tasks[0].id,mode:routeView.mode});}else if(!BOARD&&el.id==='progress-file'){const f=el.files[0];if(!f)return;if(f.size>8*1024*1024){feedback={import:true,text:'Этот файл слишком большой. Выбери сохранённый файл прогресса MathExam.',ok:false};render();return;}try{const raw=JSON.parse(await f.text());if(raw.version!==1||!raw.attempts)throw Error('format');const imported=sanitize(raw);for(const [k,v]of Object.entries(imported.attempts)){if(!store.attempts[k]||v.updated>store.attempts[k].updated)store.attempts[k]=v;}for(const [k,v]of Object.entries(imported.achievements)){if(!store.achievements[k])store.achievements[k]=v;else store.achievements[k].assisted=store.achievements[k].assisted&&v.assisted;}for(const [k,v]of Object.entries(imported.errorHistory)){if(!store.errorHistory[k]||v.total>store.errorHistory[k].total)store.errorHistory[k]=v;}for(const [k,v]of Object.entries(imported.pendingSessions)){const old=store.pendingSessions[k];if((!store.diagnostics[k]||v.started>store.diagnostics[k].started)&&(!old||v.started>old.started||(v.started===old.started&&v.index>old.index)))store.pendingSessions[k]=v;}if(imported.session&&!imported.session.finished&&store.pendingSessions[imported.session.route]===imported.session&&(!store.session||store.session.finished||imported.session.started>store.session.started))store.session=imported.session;for(const [k,v]of Object.entries(imported.diagnostics)){if(!store.diagnostics[k]||v.finishedAt>store.diagnostics[k].finishedAt)store.diagnostics[k]=v;}for(const [k,v]of Object.entries(imported.last))if(!store.last[k])store.last[k]=v;save();feedback={import:true,text:'Прогресс загружен. Существующие результаты сохранены; добавлены новые и более поздние попытки.',ok:true};}catch(_){feedback={import:true,text:'Не удалось прочитать прогресс. Нужен JSON-файл, скачанный из этих курсов.',ok:false};}render();}});
document.addEventListener('toggle',e=>{
 const name=Object.keys(panelSelectors).find(k=>e.target.matches?.(panelSelectors[k]));
 if(!name||rendering||applyingBoard||!e.target.isConnected||e.target.open===panels[name])return;
 if(!canEdit()){e.target.open=panels[name];return;}
 panels[name]=e.target.open;changed();
},true);
window.addEventListener('hashchange',()=>{
 if(BOARD&&!canEdit()){history.replaceState(null,'',location.pathname+location.search+href(routeView));return;}
 feedback=null;render();changed();window.scrollTo(0,0);
});
window.VPRApp={snapshot:()=>JSON.parse(JSON.stringify(store)),sanitize,routeLessons,stats,getView:()=>({...routeView}),entryPath};
render();
board=window.VPRBoardAdapter?.create({read:readBoardState,write:writeBoardState})||null;
if(BOARD&&board)acceptedBoardState=board.getState();
})();
