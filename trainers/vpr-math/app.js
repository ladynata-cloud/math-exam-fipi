(function(){
'use strict';
const D=window.VPR_DATA,C=window.VPRCore,$=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LESSON=new Map(D.lessons.map(x=>[x.id,x]));
const TASK=new Map(D.lessons.flatMap(l=>l.tasks.map(t=>[t.id,{task:t,lesson:l}])));
const bankSize=TASK.size,ROUTE=new Map(D.routes.map(x=>[x.id,x]));
const P=window.VPRLearningProgress,MOTION_LESSON='g7-process-graphs',motionReview=window.VPRMotionPilot?.reviewTask;
if(motionReview)TASK.set(motionReview.id,{task:motionReview,lesson:LESSON.get(MOTION_LESSON)});
const isMotionReview=id=>!!motionReview&&id===motionReview.id;
function topicStatus(lesson){return P.topic(store,lesson,Date.now(),lesson.id===MOTION_LESSON?motionReview:null);}
function motionReviewAvailable(lesson){
 return !BOARD&&(store.achievements['solo:'+motionReview.id]||topicStatus(lesson).next?.id===motionReview.id);
}
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
const emptyStore=()=>({version:1,attempts:{},achievements:{},errorHistory:{},diagnostics:{},pendingSessions:{},last:{},session:null,learning:P.empty()});
let store=emptyStore();
let storageOK=true,feedback=null,routeView={},storedBytes=null;
function validSession(s){
 if(!s||!ROUTE.has(s.route)||!Array.isArray(s.ids)||!Array.isArray(s.answers)||s.ids.length!==s.answers.length||s.ids.length<1||s.ids.length>40)return false;
 if(s.ids.some(id=>!TASK.has(id)||!TASK.get(id).lesson.routes.includes(s.route)))return false;
 if(new Set(s.ids).size!==s.ids.length||!Number.isInteger(s.index)||s.index<0||s.index>s.ids.length||typeof s.finished!=='boolean')return false;
 if(s.finished?s.index!==s.ids.length:s.index>=s.ids.length)return false;
 if(s.answers.some(x=>x!==null&&!(typeof x==='string'&&x.length<=160)&&!(Number.isInteger(x)&&x>=0&&x<30)))return false;
 return Number.isFinite(s.started)&&Number.isFinite(s.finishedAt||0);
}
function sanitize(raw){
 const clean=emptyStore();
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
 clean.learning=P.sanitize(raw.learning,ROUTE,TASK);
 const legacyExposure=(id,at)=>{
  if(!clean.learning.exposed[id])P.expose(clean.learning,id,Number.isFinite(at)?Math.max(1,at):1);
 };
 for(const [key,attempt] of Object.entries(clean.attempts)){
  if(key.startsWith('learn:')&&P.wasGuided(attempt))legacyExposure(attempt.taskId,attempt.updated);
 }
 for(const [key,achievement] of Object.entries(clean.achievements)){
  if(key.startsWith('learn:'))legacyExposure(key.slice(6),achievement.updated);
 }
 for(const session of Object.values(clean.diagnostics))for(const id of session.ids)legacyExposure(id,session.finishedAt);
 for(const id of Object.keys(clean.learning.verified))if(!clean.achievements['solo:'+id])delete clean.learning.verified[id];
 P.merge(clean.learning,P.empty());
 return clean;
}
if(!BOARD)try{
 storedBytes=localStorage.getItem(KEY);
 store=sanitize(JSON.parse(storedBytes||'null'));
}catch(_){storageOK=false;}

function mergeStoredProgress(incoming){
 for(const [key,attempt] of Object.entries(incoming.attempts)){
  if(!store.attempts[key]||attempt.updated>store.attempts[key].updated)store.attempts[key]=attempt;
 }
 for(const [key,achievement] of Object.entries(incoming.achievements)){
  const previous=store.achievements[key];
  store.achievements[key]=previous?{assisted:previous.assisted&&achievement.assisted,updated:Math.max(previous.updated,achievement.updated)}:achievement;
 }
 for(const [id,error] of Object.entries(incoming.errorHistory)){
  if(!store.errorHistory[id]||error.total>store.errorHistory[id].total)store.errorHistory[id]=error;
 }
 for(const [id,diagnostic] of Object.entries(incoming.diagnostics)){
  if(!store.diagnostics[id]||diagnostic.finishedAt>store.diagnostics[id].finishedAt)store.diagnostics[id]=diagnostic;
 }
 for(const [id,session] of Object.entries(incoming.pendingSessions)){
  const previous=store.pendingSessions[id];
  if((!store.diagnostics[id]||session.started>store.diagnostics[id].started)&&
   (!previous||session.started>previous.started||(session.started===previous.started&&session.index>previous.index)))store.pendingSessions[id]=session;
 }
 if(incoming.session&&!incoming.session.finished&&store.pendingSessions[incoming.session.route]===incoming.session&&
  (!store.session||store.session.finished||incoming.session.started>store.session.started))store.session=incoming.session;
 for(const [id,task] of Object.entries(incoming.last))if(!store.last[id])store.last[id]=task;
 P.merge(store.learning,incoming.learning);
}
function markExposure(id,at=Date.now()){
 // Two UI events can land on the same clock tick. Preserve a proof already
 // recorded before the pupil subsequently opens a worked answer.
 P.expose(store.learning,id,Math.max(at,(store.learning.verified[id]||0)+1));
}
function save(){
 if(BOARD)return changed();
 const v=routeView,attempt=store.attempts['learn:'+v.task];
 if(v.mode==='learn'&&P.wasGuided(attempt))markExposure(v.task);
 if(store.session){
  if(store.session.finished){
   delete store.pendingSessions[store.session.route];
   for(const id of store.session.ids)markExposure(id,store.session.finishedAt);
  }else store.pendingSessions[store.session.route]=store.session;
 }
 try{
  const previous=localStorage.getItem(KEY);
  if(previous!==storedBytes){
   let latest;
   try{latest=JSON.parse(previous||'null');}catch(_){/* Replace a corrupt local copy. */}
   if(latest?.version===1)mergeStoredProgress(sanitize(latest));
  }
  const next=JSON.stringify(store);
  localStorage.setItem(KEY,next);storedBytes=next;storageOK=true;
 }catch(_){storageOK=false;}
 const el=$('save-warning');if(el)el.classList.toggle('visible',!storageOK);
}
function routeLessons(id){const route=ROUTE.get(id);return route?.lessonIds?route.lessonIds.map(key=>LESSON.get(key)).filter(Boolean):D.lessons.filter(l=>l.routes.includes(id));}
function allTasks(id){return routeLessons(id).flatMap(l=>l.tasks);}
function completed(id){return !!(store.achievements['learn:'+id]||store.achievements['solo:'+id]);}
function stats(id){const tasks=id?allTasks(id):D.lessons.flatMap(lesson=>lesson.tasks);return {total:tasks.length,done:tasks.filter(t=>completed(t.id)).length,solo:tasks.filter(t=>store.achievements['solo:'+t.id]).length,learn:tasks.filter(t=>store.achievements['learn:'+t.id]).length,assisted:tasks.filter(t=>store.achievements['learn:'+t.id]?.assisted&&!store.achievements['solo:'+t.id]).length};}
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
 if(!BOARD&&['about','progress','errors'].includes(view))return {view,...(view==='errors'&&route?{route}:{})};
 if(['route','lesson',...(!BOARD?['diagnostic']:[])].includes(view)&&ROUTE.has(route)){
  if(view==='lesson'){
   const l=LESSON.get(lesson);if(!l||!l.routes.includes(route))return {view:'route',route};
   if(isMotionReview(taskId)){
    const available=mode==='solo'&&lesson===MOTION_LESSON&&motionReviewAvailable(l);
    if(!available)return {view:'route',route};
   }
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
 const link=$('open-board');if(link){link.hidden=isMotionReview(routeView.task);link.href='../trainer-board.html?trainer='+encodeURIComponent(entryPath());}
 const back=$('return-cabinet');if(!back)return;
 try{if(parent!==window&&parent.location.origin===location.origin&&/^\/learning\/(?:index\.html)?$/.test(parent.location.pathname)){back.href=parent.location.href;back.target='_top';}}
 catch(_){}
}

function action(name,label,attrs='',cls='btn'){return `<button type="button" class="${cls}" data-action="${name}" ${attrs}>${label}</button>`;}
function routeButton(id,label,cls='btn'){return action('route',label,`data-route="${esc(id)}"`,cls);}
function taskButton(route,lesson,task,label,mode='learn',cls='btn',purpose=''){return action('task',label,`data-route="${esc(route)}" data-lesson="${esc(lesson)}" data-task="${esc(task)}" data-mode="${mode}"${purpose?` data-purpose="${purpose}"`:''}`,cls);}
function crumb(route,lesson){return `<div class="crumb">${action('home','Все курсы','','text-btn')}<span>/</span>${lesson?routeButton(route.id,esc(route.title),'text-btn'):`<span>${esc(route.title)}</span>`}${lesson?`<span>/</span><span>${esc(lesson.title)}</span>`:''}</div>`;}
function diagram(t){return t.svg?`<div class="diagram">${t.svg}</div>`:'';}
function home(){
 const ss=stats();
 return `<section class="hero"><div><div class="tag"><span class="dot"></span> Подготовка • 2027</div><h1>Математика к ВПР.<br>Понятно, по шагам.</h1><p>Выбери класс, разберись в теме и попробуй решить самостоятельно. ${BOARD?'Выбранная задача и решение общие для участников комнаты.':'Твоё продвижение сохраняется.'}</p><div class="meta-line"><div><strong>${D.routes.length}</strong>учебных маршрутов</div><div><strong>${D.lessons.length}</strong>уроков</div><div><strong>${bankSize}</strong>задания</div></div></div><div class="hero-visual" aria-hidden="true"><svg viewBox="0 0 420 260"><defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="#b7caa7" stroke-width=".5"/></pattern></defs><rect width="420" height="260" fill="url(#grid)"/><circle cx="282" cy="118" r="68" fill="none" stroke="#176848" stroke-width="2"/><path d="M100 185L210 45L320 185Z" fill="#d5e9a2" fill-opacity=".7" stroke="#176848" stroke-width="2.5"/><path d="M210 45L210 185M100 185L282 118" stroke="#176848" stroke-width="1.5" stroke-dasharray="5 5"/><circle cx="100" cy="185" r="5" fill="#176848"/><circle cx="210" cy="45" r="5" fill="#176848"/><circle cx="320" cy="185" r="5" fill="#176848"/><text x="197" y="29" fill="#176848" font-size="15">A</text><text x="79" y="197" fill="#176848" font-size="15">B</text><text x="327" y="198" fill="#176848" font-size="15">C</text></svg><span class="visual-caption">ОТ ПОНИМАНИЯ — К РЕШЕНИЮ</span></div></section><div class="section-title"><h2>С какого класса начнём?</h2><p>${ss.done?`Пройдено ${ss.done} из ${ss.total} заданий`:'Можно начать с любой темы'}</p></div><section class="course-grid" aria-label="Курсы ВПР">${D.routes.map(r=>{const lessons=routeLessons(r.id),s=stats(r.id);return `<article class="course ${r.advanced?'advanced':''}"><div class="course-top"><div class="grade-badge">${r.grade}</div><div><span class="eyebrow">${esc(r.level)}</span><h3>${r.grade} класс</h3></div></div><p>${esc(r.description)}</p><div class="course-meta"><span>${lessons.length} тем · ${s.total} заданий</span><span>${s.done?`${s.done} пройдено`:'с нуля'}</span></div>${routeButton(r.id,`Открыть курс <span class="arrow">↗</span>`,r.advanced?'btn secondary':'btn')}</article>`;}).join('')}</section><div class="info-strip"><p><strong>Удобно учиться понемногу.</strong> Начни с диагностики или выбери нужную тему. Каждый урок: правило, пример, шесть заданий и понятный разбор. Углублённые маршруты содержат общую основу и дополнительные темы.</p></div>`;
}
function nextInRoute(id,lessons,topics){
 const resume=store.learning.resume[id],last=TASK.get(resume?.task||store.last[id]);
 const pending=resume&&store.attempts[resume.mode+':'+resume.task];
 const due=topics.findIndex(topic=>topic.next);
 if(!BOARD&&due>=0&&!(pending&&!C.done(pending,last.task)&&pending.answers.some(value=>value!==''))){
  return taskButton(id,lessons[due].id,topics[due].next.id,`Повторить · ${esc(lessons[due].title)}`,'solo','btn','review');
 }
 if(last){
  if(!BOARD&&resume?.mode==='learn'&&store.achievements['learn:'+last.task.id]){
   const fresh=P.freshTask(store,last.lesson,last.task);
   if(fresh)return taskButton(id,last.lesson.id,fresh.id,`Решить самому · ${esc(last.lesson.title)}`,'solo','btn','fresh');
  }
  if(isMotionReview(last.task.id)&&!motionReviewAvailable(last.lesson)){
   return taskButton(id,last.lesson.id,last.lesson.tasks[0].id,`Повторить тему · ${esc(last.lesson.title)}`);
  }
  return taskButton(id,last.lesson.id,last.task.id,`Продолжить · ${esc(last.lesson.title)}`,resume?.mode||'learn');
 }
 return taskButton(id,lessons[0].id,lessons[0].tasks[0].id,`Начать · ${esc(lessons[0].title)}`);
}
function routePage(id){
 const r=ROUTE.get(id),ls=routeLessons(id),s=stats(id),pct=Math.round(100*s.done/s.total);
 const topics=BOARD?[]:ls.map(topicStatus);
 const cards=ls.map((l,i)=>{
  const count=l.tasks.filter(t=>completed(t.id)).length,topic=topics[i];
  const cursor=store.learning.resume[id];
  const saved=cursor&&TASK.get(cursor.task).lesson.id===l.id&&
   (!isMotionReview(cursor.task)||motionReviewAvailable(l))?cursor:null;
  const task=topic?.next?.id||saved?.task||l.tasks[0].id,mode=topic?.next?'solo':saved?.mode||'learn';
  return taskButton(id,l.id,task,`<span class="lesson-num">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.section)} · ${count}/${l.tasks.length} заданий</p>${topic?.label?`<span class="topic-status" data-topic-status>${topic.label}</span>`:''}</div><span class="arrow">›</span>`,mode,'lesson-card');
 }).join('');
 return `${crumb(r)}<section class="route-head"><div><div class="eyebrow">${esc(r.level)} · учебный маршрут</div><h1>${esc(r.title)}</h1><p>${esc(r.description)}. ${ls.length} тем: от первых действий до самостоятельного решения.</p></div><div class="route-stats"><b>${pct}%</b><small>${s.done} из ${s.total}<br>заданий пройдено</small><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div></section><div class="route-actions">${nextInRoute(id,ls,topics)}${action('diagnostic','Проверить свои знания',`data-route="${id}"`,'btn secondary')}${action('errors','Мои ошибки',`data-route="${id}"`,'btn tertiary')}</div><div class="section-title"><h2>Программа курса</h2><p>Каждая тема открыта — выбирай свой темп</p></div><section class="lesson-grid">${cards}</section><p class="inline-note">Процент показывает, сколько заданий пройдено. Отметки на темах отдельно показывают самостоятельную работу. Диагностика помогает выбрать, что учить дальше.</p>`;
}
function getState(task,mode){const k=mode+':'+task.id;return store.attempts[k]||(store.attempts[k]=C.blank(task,mode));}
function setAchievement(s,t){
 if(BOARD||!C.done(s,t))return;
 const at=Date.now(),key=s.mode+':'+t.id,assisted=s.hints.some(Boolean)||s.shown.some(Boolean),old=store.achievements[key];
 if(s.mode==='solo')P.verify(store,t.id,at);
 store.achievements[key]={assisted:old?old.assisted&&assisted:assisted,updated:at};
}
function renderAnswer(step,value,context,index){const id=`answer-${context}-${index}`;return step.answer.kind==='choice'?`<div class="choices" role="radiogroup" aria-label="Варианты ответа">${step.options.map((o,i)=>`<button type="button" class="choice ${value===i?'chosen':''}" role="radio" aria-checked="${value===i}" data-action="choice" data-context="${context}" data-index="${index}" data-choice="${i}">${esc(o)}</button>`).join('')}</div>`:`<label class="visually-hidden" for="${id}">${esc(step.prompt)}</label><input id="${id}" class="answer-input" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" maxlength="160" aria-describedby="format-${context}-${index}" data-answer="${context}" data-index="${index}" value="${esc(value)}" placeholder="${['set','tuple'].includes(step.answer.kind)?'Например: −2; 3':'Введи ответ'}"><div class="format-help" id="format-${context}-${index}">${step.answer.kind==='tuple'?'Запиши все значения в указанном порядке через ; .':step.answer.kind==='set'?'Все числа через ; . Запятая внутри числа — десятичная.':'Число, десятичная или обыкновенная дробь. Без единиц.'}</div>`;}
function taskPage(v){
 const r=ROUTE.get(v.route),l=LESSON.get(v.lesson),t=TASK.get(v.task).task,ls=routeLessons(v.route),li=ls.indexOf(l),ti=l.tasks.indexOf(t);
 store.last[v.route]=t.id;
 const resume=store.learning.resume[v.route];
 if(!BOARD&&(resume?.task!==t.id||resume?.mode!==v.mode))store.learning.resume[v.route]={task:t.id,mode:v.mode,at:Date.now()};
 save();
 const s=getState(t,v.mode),st=C.stage(s,t),isDone=C.done(s,t);
 const list=ls.map((x,i)=>action('task',`<small>${i+1}</small>${esc(x.title)}`,`data-route="${r.id}" data-lesson="${x.id}" data-task="${x.tasks[0].id}" data-mode="${v.mode}"`,x.id===l.id?'active':'')).join('');
 const theory=`<details class="theory"><summary>Коротко о теме · правило и пример</summary><div class="theory-inside">${l.theory.map(p=>`<p>${esc(p)}</p>`).join('')}<div class="worked-example"><h3>Разберём пример</h3><p>${esc(l.example.prompt)}</p><ol>${l.example.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p><strong>Ответ: ${esc(l.example.answer)}</strong></p></div></div></details>`;
 const indices=v.mode==='solo'&&!t.assessAllSteps?[t.steps.length-1]:t.steps.map((_,i)=>i).filter(i=>i<=st||isDone);
 const steps=indices.map(i=>{const p=t.steps[i];if(s.solved[i])return `<section class="step done ${s.shown[i]?'assisted':''}" data-step="${i}"><div class="step-head">${s.shown[i]?'Разобрано с помощью':'✓ Верно'} · ${v.mode==='solo'?'самостоятельный ответ':`шаг ${i+1}`}</div><h3>${esc(p.prompt)}</h3><div class="correct-answer">${esc(C.format(p.answer,p.options))}</div><p class="solution-note">${esc(p.solution)}</p></section>`;
  const hints=v.mode==='learn'?`<div class="hint-area">${s.mistakes[i]>=2?action('hint',s.hints[i]?'Подсказка открыта':'Нужна подсказка',`data-index="${i}" ${s.hints[i]?'disabled':''}`,'btn small secondary'):'<span class="hint-locked">Подсказка появится после двух неверных попыток.</span>'}${s.hints[i]?action('solution','Показать этот шаг',`data-index="${i}"`,'text-btn'):''}</div>${s.hints[i]?`<div class="hint-text">${esc(p.hint)}</div>`:''}`:'';
  return `<section class="step current" data-step="${i}"><div class="step-head"><span class="number">${v.mode==='solo'?'?':i+1}</span>${v.mode==='solo'?(t.assessAllSteps?`самостоятельный шаг ${i+1} из ${t.steps.length}`:'Самостоятельный ответ'):`шаг ${i+1} из ${t.steps.length}`}</div><h3>${esc(p.prompt)}</h3><form data-submit="answer" data-index="${i}"><div class="answer-form"><div style="flex:1;min-width:0">${renderAnswer(p,s.answers[i],'task',i)}</div>${action('check','Проверить',`data-index="${i}"`,'btn')}</div></form>${feedback&&feedback.task===t.id&&feedback.index===i?`<div class="feedback" role="status">${esc(feedback.text)}</div>`:''}${hints}</section>`;}).join('');
 const isReview=isMotionReview(t.id);
 const nextTask=isReview?null:l.tasks[ti+1]||ls[li+1]?.tasks[0],nextLesson=l.tasks[ti+1]?l:ls[li+1];
 const fresh=!BOARD&&isDone&&v.mode==='learn'?P.freshTask(store,l,t):null;
 const verified=!BOARD&&store.learning.verified[t.id];
 const soloHeading=BOARD?'Ответ найден самостоятельно':verified?'Новая задача решена самостоятельно':'Ответ верный';
 const retry=BOARD?action('mode','Попробовать самостоятельно','data-mode="solo"','btn secondary'):
  fresh?taskButton(r.id,l.id,fresh.id,'Решить новую задачу по теме','solo','btn','fresh'):'';
 const complete=isDone?`<section class="complete"><h3>${v.mode==='solo'?soloHeading:s.shown.some(Boolean)?'Задание разобрано':'Все шаги выполнены'}</h3><p>${esc(t.finalExplanation)}</p>${!BOARD&&v.mode==='learn'&&s.shown.some(Boolean)?'<p>Один или несколько шагов разобраны с помощью.</p>':''}<div class="self-check"><label><input type="checkbox">Я могу объяснить ход решения и записать его в тетради.</label></div><div class="complete-actions">${v.mode==='learn'?retry:''}${nextTask?taskButton(r.id,nextLesson.id,nextTask.id,'Следующее задание →',v.mode,fresh?'btn secondary':'btn'):routeButton(r.id,'Вернуться к программе',fresh?'btn secondary':'btn')}${v.mode==='solo'&&!isReview?action('mode','Посмотреть шаги','data-mode="learn"','btn secondary'):''}</div></section>`:'';
 const motion=motionAvailable(v)?window.VPRMotionPilot.render(store.learning.motion):'';
 const motionTask=motion&&store.learning.motion?.stop===2?P.freshTask(store,l,null,'exam'):null;
 const experiment=motionTask?motion+`<div class="motion-next">${taskButton(r.id,l.id,motionTask.id,'Проверить себя на новой задаче','solo','btn','fresh')}</div>`:motion;
 return `${crumb(r,l)}<div class="work-grid"><aside class="side"><div class="side-title">${esc(r.title)}</div>${list}</aside><section class="lesson-content"><details class="mobile-lessons"><summary>Все темы курса</summary><label class="visually-hidden" for="lesson-select">Выбери тему</label><select id="lesson-select" data-route="${r.id}">${ls.map((x,i)=>`<option value="${x.id}" ${x.id===l.id?'selected':''}>${i+1}. ${esc(x.title)}</option>`).join('')}</select></details><div class="lesson-heading"><div class="eyebrow">Тема ${li+1} из ${ls.length} · ${esc(l.section)}</div><h1>${esc(l.title)}</h1><p>${esc(l.goal)}</p></div>${v.mode==='learn'?theory:''}<div class="toolbar"><div class="segmented" aria-label="Режим работы"${isReview?" hidden":""}>${action('mode','По шагам',`data-mode="learn" aria-pressed="${v.mode==='learn'}"`,v.mode==='learn'?'selected':'')}${action('mode','Самостоятельно',`data-mode="solo" aria-pressed="${v.mode==='solo'}"`,v.mode==='solo'?'selected':'')}</div><div class="task-tabs" aria-label="Задания темы">${l.tasks.map((x,i)=>action('task',`${i+1}`,`data-route="${r.id}" data-lesson="${l.id}" data-task="${x.id}" data-mode="${v.mode}" aria-label="Задание ${i+1}${completed(x.id)?', пройдено':''}" aria-pressed="${x.id===t.id}"`,`task-tab ${x.id===t.id?'active':''} ${completed(x.id)?'completed':''}`)).join('')}</div></div><article class="task-card"><div class="task-top"><span class="task-level">${({start:'Первые шаги',practice:'Закрепление',exam:'Применяем способ'})[t.level]}</span><span class="task-index">${isReview?"Проверка после паузы":`Задание ${ti+1} из ${l.tasks.length}`}</span></div><p class="task-prompt">${esc(t.prompt)}</p>${diagram(t)}</article>${experiment}${v.mode==='learn'?window.VPRPlot.render(t,s):''}<p class="mode-note">${v.mode==='learn'?'Проверяй по одному шагу. Выполненные действия останутся перед глазами.':(t.assessAllSteps?'Пройди всю цепочку обоснований без подсказок. Полное письменное доказательство обсуди с преподавателем.':'Реши в тетради и введи итоговый ответ. Подсказок в этом режиме нет. Развёрнутое решение обсуди с преподавателем.')}</p><div class="steps">${steps}</div>${complete}<details class="notes"><summary>${BOARD?'Общие записи к заданию':'Мои записи к этому заданию'}</summary><label class="visually-hidden" for="task-notes">Черновик решения</label><textarea id="task-notes" maxlength="10000" placeholder="Запиши действия или то, что пока непонятно…">${esc(s.notes)}</textarea><p class="format-help">${BOARD?'Записи видны участникам комнаты.':'Записи сохраняются в этом браузере.'} Они не оцениваются автоматически.</p></details><div class="bottom-actions">${routeButton(r.id,'← К программе курса','btn secondary')}${action('restart','Повторить это задание','','text-btn')}</div><p class="storage-note">${BOARD?'Совместное решение сохраняется в комнате отдельно от личного прогресса.':storageOK?'Прогресс хранится в этом браузере. В разделе «Мой прогресс» можно скачать его копию.':'Сохранение недоступно. Скачай прогресс перед закрытием файла.'}</p></section></div>`;
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
 return `${crumb(r)}<section class="assessment"><div class="assessment-head"><div><h1>Проверяем основу</h1><p>${esc(r.title)}. По одной задаче на тему. Решай самостоятельно, любую задачу можно пропустить. В конце увидишь результат и следующий шаг.</p></div><span class="assessment-count">${i+1} / ${s.ids.length}</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><article class="task-card"><p class="task-prompt">${esc(t.prompt)}</p>${diagram(t)}</article><section class="step current"><h3>${esc(p.prompt)}</h3><form data-submit="diagnostic"><div class="answer-form"><div style="flex:1;min-width:0">${renderAnswer(p,s.answers[i]??'','diagnostic',i)}</div></div><div class="route-actions">${action('diagnostic-next',i===s.ids.length-1?'Завершить диагностику':'Сохранить ответ →')}${action('diagnostic-skip','Пропустить','','btn secondary')}</div></form>${feedback?.diagnostic?`<p class="feedback" role="status">${esc(feedback.text)}</p>`:''}</section><p class="inline-note">Это учебная диагностика, а не официальный вариант ВПР. Черновик решения веди в тетради.</p></section>`;
}
function diagnosticResult(s){
 const r=ROUTE.get(s.route);
 const items=s.ids.map((id,i)=>{
  const entry=TASK.get(id),step=entry.task.steps.at(-1),value=s.answers[i];
  const status=value===null?'skipped':C.judge(step.answer,value).correct?'correct':'wrong';
  return {...entry,step,value,status};
 });
 const score=items.filter(x=>x.status==='correct').length;
 const next=items.find(x=>x.status==='wrong')||items.find(x=>x.status==='skipped');
 const nextStep=next?`<h2>${esc(next.lesson.title)}</h2><p>${next.status==='wrong'?'В этой теме ответ пока не совпал. Начни с первых шагов.':'Ты пропустил эту тему. Начни с первых шагов, чтобы проверить себя.'}</p><div class="route-actions">${taskButton(r.id,next.lesson.id,next.lesson.tasks[0].id,'Открыть тему','learn')}</div>`:`<h2>Новые задачи курса</h2><p>Выбери тему для самостоятельной практики.</p><div class="route-actions">${routeButton(r.id,'К программе курса')}</div>`;
 const labels={correct:'верно',wrong:'неверно',skipped:'пропущено'};
 return `${crumb(r)}<section class="result-hero"><div class="eyebrow" style="color:var(--lime)">Диагностика завершена</div><h1>${esc(r.title)}</h1><div class="result-score">${score} / ${items.length}</div><p>${next?'Верные итоговые ответы. Пропуски отмечены отдельно.':'Все итоговые ответы верны. Проверь письменные решения с преподавателем и переходи к новым заданиям.'}</p></section><section class="result-item diagnostic-next-step"><div class="eyebrow">Следующий шаг</div>${nextStep}</section><p class="inline-note">Считаются итоговые ответы. Полнота доказательств и записи решения здесь автоматически не оценивается.</p><div class="result-list">${items.map(x=>`<article class="result-item"><div class="result-item-head"><div><h3>${esc(x.lesson.title)}</h3>${x.status==='skipped'?'':`<p>Твой ответ: ${esc(typeof x.value==='number'?x.step.options?.[x.value]??x.value:x.value)}</p>`}</div><span class="${x.status==='correct'?'badge-ok':'badge-review'}">${labels[x.status]}</span></div><details><summary>Проверить ответ и ход решения</summary><p>${esc(x.task.prompt)}</p>${diagram(x.task)}<ol>${x.task.steps.map(p=>`<li>${esc(p.prompt)} — <strong>${esc(C.format(p.answer,p.options))}</strong>. ${esc(p.solution)}</li>`).join('')}</ol></details>${x.status!=='correct'?`<div style="margin-top:12px">${taskButton(r.id,x.lesson.id,x.task.id,'Разобрать эту задачу','learn','btn small secondary')}</div>`:''}</article>`).join('')}</div><div class="route-actions">${next?routeButton(r.id,'К программе курса'):''}${action('diagnostic-new','Пройти другой набор',`data-route="${r.id}"`,'btn secondary')}</div>`;
}
function errorItems(){const map=new Map();for(const [id,record]of Object.entries(store.errorHistory)){const x=TASK.get(id);if(x&&record.total)map.set(id,{...x,total:record.total});}for(const [key,s]of Object.entries(store.attempts)){const total=s.mistakes.reduce((a,b)=>a+b,0);if(!total)continue;const x=TASK.get(s.taskId);const old=map.get(s.taskId);map.set(s.taskId,{...x,total:total+(old?.total||0)});}return [...map.values()].sort((a,b)=>b.total-a.total);}
function errorsPage(route){
 const items=errorItems().filter(x=>!isMotionReview(x.task.id)&&(!route||x.lesson.routes.includes(route)));
 const cards=items.map(x=>{
  const id=route||x.lesson.routes[0],fresh=P.freshTask(store,x.lesson,x.task);
  return `<article class="result-item"><div class="result-item-head"><div><h3>${esc(x.lesson.title)}</h3><p>${esc(x.task.prompt)}</p><p>Неверных попыток: ${x.total}. ${completed(x.task.id)?'Задание уже пройдено.':'Пока не завершено.'}</p></div></div><div class="route-actions">${taskButton(id,x.lesson.id,x.task.id,'Вернуться к шагам','learn','btn small secondary')}${fresh?taskButton(id,x.lesson.id,fresh.id,'Решить новую задачу по теме','solo','btn small','fresh'):taskButton(id,x.lesson.id,x.task.id,'Повторить решение','solo','btn small')}</div></article>`;
 }).join('');
 return `<div class="crumb">${route?routeButton(route,esc(ROUTE.get(route).title),'text-btn'):action('home','Все курсы','','text-btn')}<span>/</span><span>Мои ошибки</span></div><div class="section-title"><h1 style="font-size:35px">Вернёмся к трудным местам</h1></div><p class="inline-note">Здесь задания, в которых были неверные попытки. После разбора попробуй решить новую задачу по теме.</p>${items.length?`<div class="result-list">${cards}</div>`:'<div class="empty"><h2>Пока записей нет</h2><p>Если в ответе будет ошибка, задание появится здесь.</p></div>'}`;
}
function progressPage(){const s=stats();return `<div class="crumb">${action('home','Все курсы','','text-btn')}<span>/</span><span>Мой прогресс</span></div><h1 style="font-size:35px">Учусь в своём темпе</h1><p class="inline-note">Общая основа обычного и углублённого маршрутов считается один раз. Повтор задания сохраняет отметку о предыдущем прохождении.</p><div class="report-grid"><div class="report-metric"><b>${s.done}</b><small>заданий пройдено</small></div><div class="report-metric"><b>${s.solo}</b><small>ответов в режиме «Самостоятельно»</small></div><div class="report-metric"><b>${s.assisted}</b><small>разобрано с помощью</small></div></div><div class="result-list">${D.routes.map(r=>{const st=stats(r.id),diag=store.diagnostics[r.id];return `<article class="result-item"><div class="result-item-head"><div><h3>${esc(r.title)} · ${esc(r.level)}</h3><p>Пройдено ${st.done} / ${st.total} · новых задач решено без помощи ${allTasks(r.id).filter(t=>store.learning.verified[t.id]).length}</p></div>${routeButton(r.id,'Открыть','btn small secondary')}</div><div class="progress-track" style="margin-top:12px"><div class="progress-fill" style="width:${Math.round(100*st.done/st.total)}%"></div></div>${diag?`<p>Диагностика: ${diag.ids.filter((id,i)=>C.judge(TASK.get(id).task.steps.at(-1).answer,diag.answers[i]).correct).length} / ${diag.ids.length} итоговых ответов.</p>`:''}</article>`;}).join('')}</div><div class="data-actions">${action('export','Скачать прогресс','','btn secondary')}${action('import','Загрузить прогресс','','btn secondary')}${action('print','Распечатать отчёт','','btn tertiary')}${action('errors','Открыть мои ошибки','','btn tertiary')}</div><p class="inline-note">Прогресс относится к этому браузеру и устройству. Перед сменой устройства скачай копию, затем загрузи её в тот же комплект курсов. Из кабинета открывается назначенный курс. Результаты этой практики хранятся в браузере отдельно от серверной истории кабинета; совместная комната хранит свой разбор.</p>${feedback?.import?`<p class="feedback ${feedback.ok?'good':''}" role="status">${esc(feedback.text)}</p>`:''}<input type="file" id="progress-file" accept="application/json,.json" hidden>`;}
function aboutPage(){return `<article class="prose"><div class="tag">MathExam · авторские материалы</div><h1>Как устроены курсы</h1><p>Семь маршрутов для 5, 6, 7, 8 и 10 классов. В 7-м и 8-м предусмотрены обычный и углублённый маршруты. Для 9-го класса отдельная ВПР по математике не предусмотрена.</p><h2>От понимания к самостоятельности</h2><ol><li>Открой нужную тему или начни с диагностики.</li><li>В режиме «По шагам» проверь каждое действие. После двух неверных попыток можно открыть подсказку.</li><li>Сохраняй запись решения в тетради или поле «Мои записи». Уже выполненные шаги не исчезают.</li><li>В режиме «Самостоятельно» вводи итоговый ответ без подсказок. Для задач с полным решением объясни ход решения преподавателю.</li><li>Вернись к списку ошибок и попробуй ещё раз.</li></ol><h2>На какие материалы опираемся</h2><p>Структура направлений сверена с описаниями ВПР-2027 Рособрнадзора. Задания курса составлены для тренировки и не являются официальными КИМ. Краткие уроки и диагностика не воспроизводят целый экзаменационный вариант.</p><ul><li><a href="https://fioco.ru/obraztsi_i_opisaniya_vpr" target="_blank" rel="noopener noreferrer">ФИОКО: образцы и описания ВПР</a></li><li><a href="${esc(D.sources.primary_publication_index.url)}" target="_blank" rel="noopener noreferrer">Перечень образцов ВПР-2027 Центра мониторинга качества образования</a></li>${D.sources.routes.map(r=>`<li><a href="${esc(r.official_description_url)}" target="_blank" rel="noopener noreferrer">${r.grade} класс${r.level==='углублённый'?' · углублённый уровень':r.level==='базовый'?' · базовый уровень':''}: описание работы 2027</a> · <a href="${esc(r.read_description_mirror_url)}" target="_blank" rel="noopener noreferrer">копия того же документа</a></li>`).join('')}</ul><p>Проверка источников: 7 ноября 2026 года. В старших маршрутах важно отдельно готовиться к алгебре, геометрии и вероятности. Для геометрических доказательств и построений тренажёр даёт подготовительные действия; самостоятельные чертежи и полное доказательство проверяет преподаватель.</p><h2>Что сохраняется</h2><p>Ответы, пройденные шаги, использованные подсказки, ошибки, записи и результаты диагностики сохраняются локально. В разделе «Мой прогресс» есть переносимая копия данных. Личные ответы остаются в этом браузере; копию можно скачать и перенести. Для открытия страниц сайта и совместной комнаты нужен интернет.</p><p>Маршруты можно назначать через существующую программу ученика. Кнопка «На общую доску» открывает выбранную задачу: преподаватель создаёт комнату и передаёт ученику её ссылку. Общие ответы, подсказки, графики и записи не записываются в личный прогресс.</p><h2>Для преподавателя</h2><p>Все темы открыты. Можно показать условие на экране и вместе разобрать ход решения. На общей доске выбранная задача и действия синхронизируются; право управления передаётся средствами комнаты. Диагностика помогает выбрать темы, но не выставляет официальную отметку ВПР.</p>${action('home','К выбору курса')}</article>`;}
function render(){
 const previous=routeView;routeView=parse();const v=routeView;
 if(!applyingBoard&&(v.view!==previous.view||v.task!==previous.task||v.mode!==previous.mode))panels=emptyPanels();
 rendering=true;
 try{
  const html=v.view==='route'?routePage(v.route):v.view==='lesson'?taskPage(v):v.view==='diagnostic'?diagnosticPage(v.route):v.view==='progress'?progressPage():v.view==='errors'?errorsPage(v.route):v.view==='about'?aboutPage():home();
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
function check(index){
 if(!canEdit())return;
 const cur=current();if(!cur)return;
 const {task:t,state:s}=cur;if(index!==C.stage(s,t)||C.done(s,t))return;
 const p=t.steps[index],answer=s.answers[index],result=C.judge(p.answer,answer);
 const finalStep=t.steps.at(-1);
 if(!result.correct&&s.mode==='learn'&&p!==finalStep&&!t.assessAllSteps&&
    p.answer.kind!=='choice'&&finalStep.answer.kind!=='choice'&&C.judge(finalStep.answer,answer).correct){
  feedback={task:t.id,index,text:`Итоговый ответ верный. Сейчас ответь на вопрос «${p.prompt}»`};
  render();
  changed();
  return;
 }
 if(!result.valid){feedback={task:t.id,index,text:result.message};render();changed();return;}
 if(result.correct){s.solved[index]=true;feedback=null;setAchievement(s,t);}
 else{
  s.mistakes[index]=Math.min(s.mistakes[index]+1,1e6);
  let message='Проверь решение в тетради и попробуй ещё раз.';
  if(s.mode==='learn'){
   const value=C.number(answer);
   let cue='';
   if(t.id==='g7-process-graphs-5'||t.id==='g7-process-graphs-6'){
    const option=p.options?.[answer];
    const path=t.steps[1].answer.value,oneWay=path/2,totalTime=t.steps[2].answer.value;
    if(option==='Вычесть начальное расстояние от конечного'||((index===1||index===3)&&value===0))cue='Расстояния от дома в начале и в конце совпали. Вспомни, что измеряет весь пройденный путь.';
    else if(option==='Взять только наибольшее расстояние от дома'||(index===1&&C.near(value,oneWay))||(index===3&&C.near(value,oneWay/totalTime)))cue='Высота верхней точки показывает расстояние от дома в тот момент. Какое движение было после остановки?';
    else if((index===2&&C.near(value,4))||(index===3&&C.near(value,path/4)))cue='Сверь свой расчёт с осью времени. Какое время просит учесть условие?';
   }
   if(t.id==='g6-percent-5'){
    if(index===1&&C.near(value,200))cue='От какой цены берутся вторые 20%? Вспомни, что произошло с ценой до скидки.';
    else if(index===2&&C.near(value,1000))cue='Сравни, от каких цен считаются повышение и снижение на 20%. Получаются ли одинаковые суммы?';
   }
   if(t.id==='g6-percent-6'&&index===2&&C.near(value,60))cue='Что считается целым для второго дня? Посмотри, сколько тетрадей было к его началу.';
   message=cue||'Попробуй ещё раз: проверь знак, действие и единицы.';
   if(s.mistakes[index]>=2)message+=' Теперь можно открыть подсказку.';
  }
  feedback={task:t.id,index,text:`Пока не совпало. ${message}`};
 }
 s.updated=Date.now();if(save()===false)return;render();
 if(result.correct)requestAnimationFrame(()=>{const el=document.querySelector('.step.current');if(el){const rect=el.getBoundingClientRect();if(rect.bottom>innerHeight-15)el.scrollIntoView({block:'nearest',behavior:'smooth'});}});
}
function diagnosticNext(skip){const s=store.session;if(!s||s.finished)return;const t=TASK.get(s.ids[s.index]).task;if(skip)s.answers[s.index]=null;else{const result=C.judge(t.steps.at(-1).answer,s.answers[s.index]);if(!result.valid){feedback={diagnostic:true,text:result.message};render();return;}}s.index++;feedback=null;if(s.index>=s.ids.length){s.finished=true;s.finishedAt=Date.now();store.diagnostics[s.route]=JSON.parse(JSON.stringify(s));}if(save()===false)return;render();window.scrollTo(0,0);}
function download(){const blob=new Blob([JSON.stringify({...store,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='MathExam_VPR_progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function processAction(el){if(!canEdit())return;const a=el.dataset.action,d=el.dataset;if(a==='motion-predict'||a==='motion-stop'){updateMotion(a,d);return;}if(BOARD&&['about','progress','errors','diagnostic','diagnostic-new','diagnostic-next','diagnostic-skip','export','import','print'].includes(a))return;switch(a){case'home':go({});break;case'route':go({view:'route',route:d.route});break;case'task':go({view:'lesson',route:d.route,lesson:d.lesson,task:d.task,mode:d.mode||'learn'});break;case'mode':go({...routeView,mode:d.mode});break;case'about':go({view:'about'});break;case'progress':go({view:'progress'});break;case'errors':go({view:'errors',route:d.route||routeView.route});break;case'check':check(Number(d.index));break;case'choice':{const idx=Number(d.index),val=Number(d.choice);if(d.context==='task'){const cur=current();if(!cur||idx!==C.stage(cur.state,cur.task))return;cur.state.answers[idx]=val;cur.state.updated=Date.now();}else{const s=store.session;if(!s||s.finished||idx!==s.index)return;s.answers[idx]=val;}if(save()===false)return;feedback=null;render();break;}case'hint':{const cur=current(),i=Number(d.index);if(cur&&cur.state.mode==='learn'&&cur.state.mistakes[i]>=2&&C.stage(cur.state,cur.task)===i){cur.state.hints[i]=true;cur.state.updated=Date.now();if(save()===false)return;render();}break;}case'solution':{const cur=current(),i=Number(d.index);if(cur&&cur.state.mode==='learn'&&cur.state.hints[i]&&C.stage(cur.state,cur.task)===i){cur.state.shown[i]=true;cur.state.solved[i]=true;cur.state.updated=Date.now();setAchievement(cur.state,cur.task);if(save()===false)return;feedback=null;render();}break;}case'restart':{const cur=current();if(!cur)return;const mistakes=cur.state.mistakes.reduce((a,b)=>a+b,0);if(mistakes){const prev=store.errorHistory[cur.task.id];store.errorHistory[cur.task.id]={total:Math.min(1e9,(prev?.total||0)+mistakes),updated:Date.now()};}const next=C.blank(cur.task,cur.state.mode);next.notes=cur.state.notes;next.updated=Date.now();store.attempts[cur.state.mode+':'+cur.task.id]=next;if(save()===false)return;feedback=null;render();break;}case'diagnostic':startDiagnostic(d.route);break;case'diagnostic-new':store.session=null;delete store.pendingSessions[d.route];startDiagnostic(d.route);break;case'diagnostic-next':diagnosticNext(false);break;case'diagnostic-skip':diagnosticNext(true);break;case'export':download();break;case'import':$('progress-file').click();break;case'print':window.print();break;case'plot-add':{const cur=current();if(!cur||!cur.task.plot)return;const x=Number($('plot-x').value),y=Number($('plot-y').value);if($('plot-x').value===''||$('plot-y').value==='')return;addPlotPoint([x,y]);break;}case'plot-clear':{const cur=current();if(cur){cur.state.plotPoints=[];cur.state.updated=Date.now();panels.plot=true;if(save()===false)return;render();}break;}}}
function motionAvailable(v){
 return !BOARD&&v.lesson===MOTION_LESSON&&v.mode==='learn'&&!!window.VPRMotionPilot;
}
function updateMotion(action,data){
 if(!motionAvailable(routeView))return;
 const previous=store.learning.motion;
 let target;
 if(action==='motion-predict'&&P.predictions.includes(data.prediction)&&!previous){
  store.learning.motion={prediction:data.prediction,stop:1,at:Date.now()};
  target=2;
 }else if(action==='motion-stop'&&previous&&['1','2'].includes(data.stop)){
  target=Number(data.stop);
  store.learning.motion={...previous,stop:target,at:Date.now()};
 }else return;
 save();render();
 document.querySelector(`[data-action="motion-stop"][data-stop="${target}"]`)?.focus();
}
function addPlotPoint(point){if(!canEdit())return;const cur=current();if(!cur?.task.plot||!window.VPRPlot.validPoints([point],cur.task.plot))return;const points=window.VPRPlot.validPoints(cur.state.plotPoints,cur.task.plot)?cur.state.plotPoints:[];cur.state.plotPoints=points.length<window.VPRPlot.count(cur.task.plot)?[...points,point]:[point];cur.state.updated=Date.now();panels.plot=true;if(save()===false)return;render();}
document.addEventListener('click',e=>{if(!canEdit()){e.preventDefault();return;}const svg=e.target.closest('#interactive-plot');if(svg){const cur=current();if(cur?.task.plot){const p=window.VPRPlot.point(e,svg,cur.task.plot);if(p)addPlotPoint(p);}return;}const el=e.target.closest('[data-action]');if(!el||el.disabled)return;e.preventDefault();processAction(el);});
document.addEventListener('input',e=>{if(!canEdit())return;const el=e.target;if(el.matches('[data-answer]')){if(!safeSharedInput(el))return;feedback=null;}if(el.matches('[data-answer]')){const i=Number(el.dataset.index);if(el.dataset.answer==='task'){const c=current();if(c&&i===C.stage(c.state,c.task)){c.state.answers[i]=el.value.slice(0,160);c.state.updated=Date.now();save();}}else if(store.session&&!store.session.finished&&store.session.index===i){store.session.answers[i]=el.value.slice(0,160);save();}}else if(el.id==='task-notes'){if(!safeSharedInput(el))return;const c=current();if(c){c.state.notes=el.value.slice(0,10000);c.state.updated=Date.now();save();}}});
document.addEventListener('submit',e=>{if(!canEdit()){e.preventDefault();return;}const f=e.target;if(f.dataset.submit){e.preventDefault();if(f.dataset.submit==='answer')check(Number(f.dataset.index));else diagnosticNext(false);}});
document.addEventListener('change',async e=>{if(!canEdit())return;const el=e.target;if(el.id==='lesson-select'){const l=LESSON.get(el.value);if(l)go({view:'lesson',route:el.dataset.route,lesson:l.id,task:l.tasks[0].id,mode:routeView.mode});}else if(!BOARD&&el.id==='progress-file'){const f=el.files[0];if(!f)return;if(f.size>8*1024*1024){feedback={import:true,text:'Этот файл слишком большой. Выбери сохранённый файл прогресса MathExam.',ok:false};render();return;}try{const raw=JSON.parse(await f.text());if(raw.version!==1||!raw.attempts)throw Error('format');mergeStoredProgress(sanitize(raw));save();feedback={import:true,text:'Прогресс загружен. Существующие результаты сохранены; добавлены новые и более поздние попытки.',ok:true};}catch(_){feedback={import:true,text:'Не удалось прочитать прогресс. Нужен JSON-файл, скачанный из этих курсов.',ok:false};}render();}});
document.addEventListener('toggle',e=>{
 const name=Object.keys(panelSelectors).find(k=>e.target.matches?.(panelSelectors[k]));
 if(!name||rendering||applyingBoard||!e.target.isConnected||e.target.open===panels[name])return;
 if(!canEdit()){e.target.open=panels[name];return;}
 panels[name]=e.target.open;
 if(!BOARD&&name==='plot'&&e.target.open&&routeView.mode==='learn'){markExposure(routeView.task);save();}
 changed();
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
