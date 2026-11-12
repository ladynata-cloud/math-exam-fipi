(function(){'use strict';
const lessons=globalThis.ProfileLessons||[],byId=new Map(lessons.map(l=>[l.id,l])),main=document.getElementById('main'),groups=[['foundations','00','Вспомнить нужную основу','Короткие темы по пробелам, без повторения всего курса'],['geometry','01','Планиметрия','Научиться видеть решение на чертеже'],['vectors','02','Векторы','От перемещения — к скалярному произведению'],['stereometry','03','Стереометрия','Увидеть основание, высоту и нужное сечение'],['trigonometry','04','Тригонометрия','Понять круг, координаты и знаки'],['algebra','05','Алгебра для экзамена','Уравнения, степени, корни и логарифмы'],['probability','06','Вероятность и случайные величины','Исходы, события и распределения'],['calculus','07','Производная','Наклон, изменение и экстремумы'],['functions','08','Функции и графики','Связать формулу с рисунком'],['applied','09','Прикладные и текстовые задачи','Из условия — в понятную запись'],['finance','10','Финансовые расчёты','Проценты, долг и платежи']];
const boardAdapter=[globalThis.ProfileExpressionsBoard,globalThis.ProfileStereoBoard,globalThis.ProfilePlanimetryBoard,globalThis.ProfileVectorsBoard,globalThis.ProfileProbabilityBoard,globalThis.ProfileRandomVariablesBoard,globalThis.ProfileEquationsBoard,globalThis.ProfileLogTrigBoard].find(adapter=>adapter&&location.pathname===adapter.path&&document.body.dataset.profileBoard===adapter.marker)||null;
const logTrigWrapper=location.pathname==='/trainers/ege-profile-log-trig.html'||document.body.dataset.profileBoard==='log-trig';
if(logTrigWrapper&&(!boardAdapter||boardAdapter!==globalThis.ProfileLogTrigBoard)){
 main.textContent='Совместный урок не загрузился. Обновите страницу, чтобы продолжить на общей доске.';main.inert=true;document.getElementById('calm-toggle').disabled=true;return;
}
const boardSession=boardAdapter?boardAdapter.create(lessons):null;
let applyingBoardState=false,boardNotifyTimer=null,boardNotify=()=>{},boardViews=new Map(),boardFeedback='none',boardHelp=null,boardConnectionWarning='';
let boardRenderFeedback=()=>{},boardRenderHint=()=>{},boardRenderHelp=()=>{};
function createState(){
 let result;try{result=ProfileState.create(lessons,boardSession?boardSession.storage:localStorage,{publicAttempts:!boardSession});}catch(_){result=ProfileState.create(lessons,{getItem(){throw Error();}},{publicAttempts:!boardSession});}
 if(boardSession){const persist=result.persist,start=result.start;result.persist=()=>applyingBoardState?true:persist();result.start=(id,mode,fresh)=>{if(!applyingBoardState)return start(id,mode,fresh);const session=result.data.sessions[id+':'+mode];if(!session||fresh)throw new TypeError('Remote render cannot start an attempt');return session;};}
 return result;
}
function trackBoardView(key,dispose,afterApply){if(boardSession)boardViews.set(key,{dispose,afterApply});return dispose;}
let cleanup=()=>{},returnToTask=null,state=createState(),calm;
if(!boardSession)try{const saved=sessionStorage.getItem('mathexam.profileReturn');returnToTask=validReturn(saved)?saved:null;}catch(_){}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,cls='button')=>'<button type="button" class="'+cls+'" id="'+action+'">'+text+'</button>';
function save(){if(applyingBoardState)return;state.persist();warn();}
function validReturn(hash){return hash==='#checkpoint'||/^#practice\/[a-z0-9-]+\/(guided|plan|independent)$/.test(hash||'');}
function setReturn(hash){if(applyingBoardState)return;hash=validReturn(hash)?hash:null;if(hash&&returnToTask)return;returnToTask=hash;if(boardSession)return;try{if(hash)sessionStorage.setItem('mathexam.profileReturn',hash);else sessionStorage.removeItem('mathexam.profileReturn');}catch(_){}}
function activeIndependent(l){state.persist();return state.data.sessions[l.id+':independent']?state.start(l.id,'independent'):null;}
function markHelp(s,mode,kind='support'){if(applyingBoardState)return;if(mode!=='independent'||!s.answers.length){s.assisted=true;if(!boardSession)state.noteHelp(s,kind);save();}}
function warn(){const box=document.getElementById('storage-warning'),message=[state.warning,diagnosticWarning,boardConnectionWarning].filter(Boolean).join(' ');box.hidden=!message;if(message)box.textContent=message;}
function board(hash,label='Открыть на доске'){if(boardSession||window.self!==window.top)return '';return '<a class="button quiet board-link" href="/trainers/trainer-board.html?trainer='+encodeURIComponent('/ege-profil/start/index.html'+(globalThis.ProfileRouteNav?.query()||'')+hash)+'">'+esc(label)+'</a>';}
function formatDisplay(container=main){globalThis.ProfileSolutions?.formatFractions(container);}
function mountSkills(){
 if(boardSession||!globalThis.ProfileSkillMap)return;
 const [page,id]=location.hash.slice(1).split('/');
 if(page==='exam'||page==='calm'){
  if(/^\d+$/.test(id||''))ProfileSkillMap.mount(main.querySelector('.lesson-head,.exam-head,.inequalities-entry'),[id]);
  return;
 }
 if(!['lesson','practice','example','repair'].includes(page))return;
 const lesson=byId.get(id);if(!lesson)return;
 const directlyMapped=lesson.vectorBasics?'2':String(lesson.position||'').match(/\d+/)?.[0];
 const relevant=globalThis.ProfileCalmData?.exams.filter(exam=>exam.lessonIds.includes(id)||exam.prerequisites.includes(id)).map(exam=>exam.number)||[];
 const keys=directlyMapped?[directlyMapped]:relevant;
 const target=main.querySelector('.focused-practice .task-panel,.lesson-head,.repair-panel,.complete,.result-panel')||main;
 ProfileSkillMap.mount(target,keys,{lesson:{title:lesson.title,skill:lesson.summary}});
}
function shell(html){cleanup();cleanup=()=>{};boardViews=new Map();boardFeedback='none';boardHelp=null;boardRenderFeedback=()=>{};boardRenderHint=()=>{};boardRenderHelp=()=>{};if(returnToTask&&location.hash===returnToTask)setReturn(null);main.innerHTML=(returnToTask?'<p class="return-to-task"><a href="'+esc(returnToTask)+'">← Вернуться на сохранённый шаг исходной задачи</a></p>':'')+html;formatDisplay();boardSession?.scopeLinks(main);globalThis.ProfileRouteNav?.render();mountSkills();warn();const h=main.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}window.scrollTo(0,0);}
function status(l){const r=state.record(l.id);if(r.independent.length>=2)return 'Две новые задачи самостоятельно';if(state.canAdvance(l.id))return 'Закреплено на знакомых задачах';const repeat=state.data.sessions[l.id+':independent'];if(repeat?.done&&repeat.familiar&&!repeat.wrong&&!repeat.assisted)return 'Повтор решён без подсказок';return r.independent.length?'Одна новая задача самостоятельно':r.guided.length?'Есть пошаговая практика':'Можно начать по шагам';}
function allCompleted(){return lessons.filter(l=>state.record(l.id).independent.length>=2).length;}
function home(){
 const next=lessons.find(l=>!state.canAdvance(l.id))||lessons[0];const nextHref=(next.group==='trigonometry'||['algebra-cosine','algebra-double-angle'].includes(next.id))?'#readiness':'#lesson/'+next.id;
 shell(readinessEntry()+'<aside class="first-three-entry"><a class="button" href="#part-one">Вся первая часть · выбрать номер →</a> <a class="button quiet" href="#exam/16">Неравенства второй части →</a></aside><section class="hero"><div><p class="eyebrow">ЕГЭ профиль · проект 2027</p><h1>Математика,<br>которую <em>понимаешь.</em></h1><p class="lead">Выберите тему. Разберите пример по шагам. Затем решите новое условие самостоятельно.</p><div class="actions"><a class="button" href="'+nextHref+'">'+(allCompleted()===lessons.length?'Повторить маршрут':lessons.every(l=>state.canAdvance(l.id))?'Выбрать тему для повторения':'Мой следующий урок')+' <span aria-hidden="true">→</span></a>'+board('#home')+'</div><p class="muted">'+allCompleted()+' из '+lessons.length+' тем: две новые самостоятельные задачи.</p></div><div class="hero-art" aria-hidden="true"><svg viewBox="0 0 320 310"><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#d8dfeb" stroke-width=".7"/></pattern></defs><rect width="320" height="310" fill="url(#grid)"/><circle cx="158" cy="150" r="104" fill="#edf3ff" stroke="#3162d3" stroke-width="2"/><path d="M22 150H295M158 280V20" stroke="#8693ae"/><path d="M158 150L232 76L232 150Z" fill="#f8af65" fill-opacity=".35" stroke="#d67b28" stroke-width="2"/><path d="M158 150L232 76" stroke="#183967" stroke-width="3"/><circle cx="232" cy="76" r="7" fill="#3162d3"/><text x="196" y="173" fill="#315fd0">cos α</text><text x="242" y="120" fill="#a74764">sin α</text><text x="25" y="287" fill="#64718c" font-size="13">одна идея → несколько задач</text></svg></div></section><aside class="note"><h2>Урок и домашняя работа одним маршрутом</h2><p>Задания 1 и 2, затем начало тригонометрии. Шесть блоков с моделями и самостоятельной проверкой.</p><div class="actions"><a class="button" href="../lesson/index.html">Урок с репетитором</a><a class="button quiet" href="../homework/index.html">Домашка ученику</a></div></aside><section class="how"><span><b>1</b> Исследуй модель</span><span><b>2</b> Реши по шагам</span><span><b>3</b> Проверь себя</span></section><section class="route-list" aria-label="Учебный маршрут">'+groups.map(([id,n,title,sub])=>'<section class="topic-group" id="group-'+id+'"><div class="group-title"><span>'+n+'</span><div><h2>'+title+'</h2><p>'+sub+'</p></div></div>'+(id==='trigonometry'?'<aside class="note"><h3>От окружности к ЕГЭ — один последовательный курс</h3><p>Короткий маршрут помогает восстановить основы и перейти к экзаменационным выражениям. Подробные §§4–6 Мордковича доступны для дополнительного разбора.</p><a class="button" href="#readiness">Начать с основ тригонометрии →</a><p><a href="../trigonometry/index.html">Подробный курс тригонометрии</a></p></aside>':'')+'<div class="lesson-grid">'+lessons.filter(l=>l.group===id&&id!=='trigonometry'&&!['algebra-cosine','algebra-double-angle'].includes(l.id)).map(l=>'<a class="lesson-card" href="#lesson/'+l.id+'"><span class="position">'+position(l)+'</span><h3>'+esc(l.title)+'</h3><p>'+esc(l.summary)+'</p><span class="lesson-status">'+status(l)+' <span aria-hidden="true">↗</span></span></a>').join('')+'</div></section>').join('')+'</section><aside class="note"><b>Пошаговые темы для всей первой части и неравенств второй части.</b> Более широкие подборки и сохранённые варианты 2026 года доступны в <a href="../index.html">общем навигаторе</a>.</aside>');
}
function hasPractice(l){const r=state.record(l.id);return !!(r.guided.length||r.independent.length||['guided','plan','independent'].some(mode=>state.data.sessions[l.id+':'+mode]?.done));}
function readinessEntry(){return '<aside class="readiness-entry panel"><p class="eyebrow">Уже сдали ОГЭ, но есть пробелы?</p><h2>Начните с того, что нужно именно вам.</h2><p>12 коротких вопросов помогут выбрать повторение. Для тригонометрии есть отдельный короткий маршрут.</p><a class="button" href="#readiness">Подобрать начало →</a></aside>';}
const DIAGNOSTIC_KEY='mathexam.profileReadinessDiagnostic.v1';
let diagnostic=null,diagnosticWarning='',diagnosticBlocked=false;
function saveDiagnostic(){if(boardSession||diagnosticBlocked)return;try{localStorage.setItem(DIAGNOSTIC_KEY,JSON.stringify({version:1,checkIds:ProfileReadiness.checks.map(q=>q.id),...diagnostic}));}catch(_){diagnosticBlocked=true;diagnosticWarning='Не удалось сохранить проверку основы. Текущие ответы останутся до закрытия страницы.';}warn();}
if(!boardSession)try{const raw=localStorage.getItem(DIAGNOSTIC_KEY);if(raw){const v=JSON.parse(raw),ids=ProfileReadiness.checks.map(q=>q.id);if(v.version!==1||JSON.stringify(v.checkIds)!==JSON.stringify(ids)||!Number.isInteger(v.index)||v.index<0||v.index>ids.length||typeof v.accepted!=='boolean'||typeof v.draft!=='string'||v.draft.length>200||!v.results||typeof v.results!=='object'||Array.isArray(v.results))throw Error();const answered=ids.slice(0,v.index+(v.accepted?1:0));if(v.index===ids.length&&v.accepted||Object.keys(v.results).length!==answered.length||answered.some(id=>typeof v.results[id]!=='boolean'))throw Error();diagnostic={index:v.index,accepted:v.accepted,draft:v.draft,results:Object.fromEntries(answered.map(id=>[id,v.results[id]]))};}}catch(_){diagnosticBlocked=true;diagnosticWarning='Сохранение проверки основы не удалось прочитать. Оно оставлено без изменений; новую проверку можно пройти до закрытия страницы.';}
function readinessCards(ids){return ids.map(id=>{const l=byId.get(id);if(!l)return '';return '<article class="readiness-card"><div><h3>'+esc(l.title)+'</h3><p>'+status(l)+'</p></div><a class="button quiet" href="#lesson/'+id+'">'+(hasPractice(l)?'Повторить':'Разобрать')+'</a></article>';}).join('');}
function readiness(){
 const D=globalThis.ProfileReadiness,finished=diagnostic&&diagnostic.index>=D.checks.length;
 const recommended=finished?D.recommend(diagnostic.results):D.foundation;
 shell('<section class="lesson-head"><p class="eyebrow">От ОГЭ к профилю</p><h1>Знаете основу. Закроем пробелы.</h1><p class="lead">Не нужно начинать всю математику заново. Выберите короткую проверку или сразу откройте нужную тему.</p><div class="actions">'+button(diagnostic&&!finished?'Продолжить проверку':'Проверить основу · 12 вопросов','diagnostic-start')+'<a class="button quiet" href="#part-one">Выбрать номер ЕГЭ</a></div><p class="small">Без таймера и оценки. Можно ответить «Не помню». Вопросы, введённый ответ и рекомендации сохраняются в этом браузере. Можно сделать паузу и продолжить после обновления страницы.</p></section>'+
 (finished?'<section class="panel" id="diagnostic-result"><h2>Ваше начало</h2><p>'+Object.values(diagnostic.results).filter(Boolean).length+' из 12 вопросов решены с первой попытки. Это ориентир для повторения, а не прогноз балла ЕГЭ.</p>'+(recommended.length?'<p>Стоит разобрать:</p>'+readinessCards(recommended):'<p>По короткой проверке пробелов не обнаружено. Попробуйте самостоятельные задания выбранной темы.</p>')+'</section>':'<details class="panel"><summary>Выбрать пробел без проверки</summary>'+readinessCards(recommended)+'</details>')+
 '<section class="panel"><h2>Короткий маршрут по тригонометрии</h2><p>За один подход: одна тема, одна задача по шагам, затем новое условие самостоятельно. Если уверенно получается — переходите дальше.</p>'+readinessCards(D.trig)+'<p><a href="../trigonometry/index.html">Подробный курс с окружностью и дополнительными темами</a></p></section>'+
 D.routes.map(group=>'<details class="panel"><summary>'+esc(group.title)+'</summary><p>'+esc(group.text)+'</p>'+readinessCards(group.ids)+'</details>').join('')+
 '<aside class="note"><h2>После ошибки можно продолжать</h2><p>Разберите правило, закончите текущую задачу и возьмите новое условие. Ошибка не закрывает другие темы. В каждой теме три отдельных условия для проверки. Когда они закончатся, повторы будут отмечены как тренировка.</p><a href="#progress">Посмотреть работу и скачать отчёт</a></aside>');
 document.getElementById('diagnostic-start').onclick=()=>{if(!diagnostic||finished)diagnostic={index:0,results:{},accepted:false,draft:''};saveDiagnostic();location.hash='diagnostic';};
}
function diagnose(){
 const D=globalThis.ProfileReadiness;if(!diagnostic){diagnostic={index:0,results:{},accepted:false,draft:''};saveDiagnostic();}
 if(diagnostic.index>=D.checks.length){location.hash='readiness';return;}
 const q=D.checks[diagnostic.index];
 shell('<p class="breadcrumb"><a href="#readiness">← К маршруту</a></p><section class="panel diagnostic-panel"><p class="eyebrow">Короткая проверка · '+(diagnostic.index+1)+' из '+D.checks.length+'</p><h1>'+esc(q.title)+'</h1><div class="question">'+q.prompt+'</div><form id="diagnostic-form">'+questionInput(q,diagnostic.draft)+'<div class="actions"><button type="submit" class="button" id="diagnostic-check">Проверить</button>'+button('Не помню','diagnostic-skip','button quiet')+'</div></form><div id="diagnostic-feedback" class="feedback" role="status" aria-live="polite"></div><button type="button" class="button" id="diagnostic-next" hidden>Следующий вопрос →</button></section>');
 const input=document.getElementById('answer'),feed=document.getElementById('diagnostic-feedback'),next=document.getElementById('diagnostic-next');
 function show(){const ok=diagnostic.results[q.id]===true;feed.className='feedback '+(ok?'good':'bad');feed.textContent=(ok?'Верно. ':'Добавим тему для повторения. ')+q.why;input.disabled=true;document.getElementById('diagnostic-check').disabled=true;document.getElementById('diagnostic-skip').disabled=true;next.hidden=false;next.textContent=diagnostic.index===D.checks.length-1?'Показать мой маршрут →':'Следующий вопрос →';}
 input.oninput=()=>{diagnostic.draft=input.value.slice(0,200);saveDiagnostic();};
 document.getElementById('diagnostic-form').onsubmit=e=>{e.preventDefault();if(diagnostic.accepted)return;diagnostic.draft=input.value.slice(0,200);if(!input.value.trim()||!Number.isFinite(ProfileCheck.number(input.value))){feed.textContent='Введите число, например 0,75 или 3/4, либо выберите «Не помню». Это не считается ошибкой.';return;}diagnostic.results[q.id]=ProfileCheck.check(q.answer,input.value);diagnostic.accepted=true;saveDiagnostic();show();next.focus();};
 document.getElementById('diagnostic-skip').onclick=()=>{if(diagnostic.accepted)return;diagnostic.results[q.id]=false;diagnostic.accepted=true;saveDiagnostic();show();next.focus();};
 next.onclick=()=>{if(!diagnostic.accepted)return;diagnostic.index++;diagnostic.accepted=false;diagnostic.draft='';saveDiagnostic();diagnose();};if(diagnostic.accepted)show();
}
function prerequisiteIds(l){const exact=globalThis.ProfileReadiness?.prerequisites[l.id];const exam=globalThis.ProfileCalmData?.exams.find(e=>e.number===l.position);return [...new Set(exact||exam?.prerequisites||[])].filter(id=>id!==l.id&&byId.has(id));}
function prerequisiteChoices(l){return prerequisiteIds(l).map(id=>'<p><a class="prerequisite-link" href="#lesson/'+id+'">'+esc(byId.get(id).title)+'</a></p>').join('');}
function prerequisiteLinks(l){const links=prerequisiteChoices(l);return links?'<section class="panel"><h2>Если мешает забытое правило</h2><p>Откройте только то, что сейчас нужно. Затем вернитесь к задаче.</p>'+links+'</section>':'';}
function difficultyHelp(l,mode,s,solved){return '<section id="difficulty-help" class="difficulty-help" '+(!s.wrong||solved?'hidden':'')+'><h2>Нужно вспомнить основу?</h2><p>Одна ошибка ещё не означает пробел. Можно исправить ответ или разобрать нужное правило:</p>'+prerequisiteChoices(l)+'<a class="difficulty-repair" href="#repair/'+l.id+'/'+mode+'">Разобраться с правилом этой задачи</a><p class="small">После повторения вернётесь к этой же задаче. Ответ и текущий шаг сохраняются.</p></section>';}
function position(l){return typeof l.position==='number'?'ЕГЭ 2027 · №'+l.position:esc(l.position||'Основа для профиля');}
function breadcrumb(l){if(boardAdapter?.marker==='log-trig')return '<p class="breadcrumb"><a href="#course">← Логарифмы и тригонометрия</a></p>';const examNumber=l.vectorBasics?2:Number(l.position);return '<p class="breadcrumb"><a href="'+(l.vectorBasics?'#calm/2':examNames[examNumber]?'#exam/'+examNumber:'#home')+'">'+(examNames[examNumber]?'№'+examNumber+' · Все темы':'Маршрут')+'</a></p>';}
const examNames={1:'Планиметрия',2:'Векторы',3:'Стереометрия',4:'Простая вероятность',5:'Сложные события',6:'Случайные величины',7:'Уравнения',8:'Вычисления и выражения',9:'Производная',10:'Задачи с формулами',11:'Текстовые задачи',12:'Функции и графики',13:'Финансовые расчёты'};
const examStarts={1:'geo-right',2:'vec-coordinates',3:'stereo-box',7:'eq-linear',8:'expr-powers'};
const examDescriptions={1:'Треугольники, площади и окружность.',2:'Координаты, длина и действия с векторами.',3:'Объёмные фигуры, площади и объёмы.',4:'Все исходы и подходящие исходы.',5:'Несколько событий. Как связаны их вероятности.',6:'Таблица значений, среднее и разброс.',7:'Преобразуем равенство и проверяем корень.',8:'Степени, корни, дроби, логарифмы и тригонометрия.',9:'Наклон касательной, изменение функции и экстремумы.',10:'Подставляем данные и находим нужную величину.',11:'Движение, работа и смеси. Сначала таблица.',12:'Читаем график и восстанавливаем формулу.',13:'Проценты, платежи и остаток долга.'};
const examBanks={1:'../trainers/planimetry-t1.html',2:'../trainers/vectors-t2.html',3:'../trainers/stereo/index.html'};
function partOne(){
 const ongoing=lessons.flatMap(l=>['guided','plan','independent'].map(mode=>({l,mode,s:state.data.sessions[l.id+':'+mode]}))).filter(x=>x.s&&!x.s.done).sort((a,b)=>String(b.s.started).localeCompare(String(a.s.started)))[0];
 shell('<section class="first-three-head full-course-head"><p class="eyebrow">ЕГЭ профиль · первая часть</p><h1>Выберите задание.</h1><p class="lead">Один вопрос за раз. Подсказки рядом. Пройденные шаги остаются на экране.</p>'+(ongoing?'<a class="button" href="#practice/'+ongoing.l.id+'/'+ongoing.mode+'">Продолжить: '+esc(ongoing.l.title.split(':')[0])+' →</a>':'')+'<p class="small muted">Номера по проекту ФИПИ 2027: задания 1–13. <a href="#sources">Как соотносятся с 2026 годом</a>.</p></section><div class="exam-grid full-course-grid">'+Object.keys(examNames).map(key=>{const n=Number(key),list=lessons.filter(l=>l.position===n),done=list.filter(l=>state.record(l.id).independent.length>=2).length;return '<a class="exam-card" href="#exam/'+n+'"><span class="exam-number">'+n+'</span><h2>'+examNames[n]+'</h2><p>'+examDescriptions[n]+'</p><span class="small course-card-status">'+(done?done+' из '+list.length+' тем закреплено':'Начать по шагам')+'</span><span class="exam-open">Открыть →</span></a>';}).join('')+'</div><section class="inequalities-entry panel"><p class="eyebrow">Вторая часть · №15 в проекте 2027</p><h2>Стереометрия по Атанасяну · 10–11</h2><p>От пространственного чертежа — к доказательствам, углам, расстояниям и объёмам. Отдельный курс с моделями и записью каждого шага.</p><a class="button" href="../atanasyan-10-11/index.html">Открыть курс к задаче №15 →</a><p class="small muted">В вариантах 2026 года стереометрия — №14.</p></section><section class="inequalities-entry panel"><p class="eyebrow">Вторая часть · №16 в проекте 2027</p><h2>Неравенства — с записью всего решения</h2><p>Собираем ограничения в систему. Решаем каждую строку. Отмечаем решения на числовых прямых и пересекаем.</p><a class="button" href="#exam/16">Разобрать неравенство →</a><p class="small muted">В вариантах 2026 года — №15.</p></section><p class="small"><a href="#home">Выбрать по темам</a> · <a href="#progress">Мои результаты</a></p>');
}
function stereometryCourse(){shell('<section class="inequalities-entry panel"><p class="eyebrow">Вторая часть · №15 в проекте 2027</p><h2>Стереометрия по Атанасяну · 10–11</h2><p>От пространственного чертежа — к доказательствам, углам, расстояниям и объёмам. Отдельный курс с моделями и записью каждого шага.</p><a class="button" href="../atanasyan-10-11/index.html">Открыть курс к задаче №15 →</a><p class="small muted">В вариантах 2026 года стереометрия — №14.</p></section>');}
function inequalities(){
 shell('<p class="breadcrumb"><a href="#calm">← Все задания: №1–13 и №16</a></p><section class="exam-head"><p class="eyebrow">Вторая часть · №16 в проекте 2027 · №15 в 2026</p><h1>Неравенства.</h1><p class="lead">Сначала выясним, какие значения x допустимы. Затем решим неравенство и оставим общую часть на числовой прямой.</p><a class="button" href="../../trainers/ege-profile/inequalities/index.html">Выбрать пример и начать по шагам →</a></section><section class="panel"><h2>Как будет устроено решение</h2><ol class="plain-steps"><li>Записываем каждое ограничение и объясняем, откуда оно взялось.</li><li>Собираем ограничения в систему.</li><li>Решаем строки по отдельности и отмечаем ответы на осях.</li><li>Пересекаем решения. Проверяем граничные точки.</li></ol><p>Уже выполненные шаги остаются в тетради. Результат можно скопировать или скачать и отправить учителю.</p></section><section class="panel"><h2>Подробные разборы логарифмов</h2><div class="actions"><a class="button quiet" href="../../trainers/ege-profile/log-inequalities/lesson.html">Логарифм с переменным основанием</a><a class="button quiet" href="../../trainers/ege-profile/log-inequalities/nested.html">Внутренний и внешний логарифмы</a></div><p><a href="../../trainers/ege-profile/log-inequalities/index.html">Ещё 48 вариантов логарифмических неравенств</a></p></section>'+globalThis.ProfileCourse.resources(16)+'<details class="panel"><summary>Вспомнить основу, если трудно</summary>'+readinessCards(['bridge-signs','bridge-equations','expr-powers','expr-logarithms'])+'</details>');
}
function firstThree(){
 shell('<section class="first-three-head"><p class="eyebrow">ЕГЭ профиль · задания 1–3</p><h1>Разобраться. Решить. Закрепить.</h1><p class="lead">Выберите номер. Рисунок и условие будут рядом. Будем решать по одному шагу.</p></section><div class="exam-grid">'+[1,2,3].map(n=>'<a class="exam-card" href="#exam/'+n+'"><span class="exam-number">'+n+'</span><h2>'+examNames[n]+'</h2><p>'+({1:'Треугольники, площади и окружность.',2:'Действия со стрелками на чертеже, затем задачи ЕГЭ.',3:'Объёмные фигуры, площади и объёмы.'}[n])+'</p><span class="exam-open">Начать →</span></a>').join('')+'</div><p class="first-three-note">Можно ошибаться и брать подсказки. Пройденные шаги останутся на экране.</p><div class="actions"><a class="button quiet" href="#progress">Мои результаты</a><a class="text-link" href="../index.html">Все материалы профиля</a></div>');
}
function exam(n){
 if(n===2&&globalThis.ProfileVectorBasics?.length&&!boardSession)return calm.route(2,{preserveView:true});
 const list=lessons.filter(l=>l.position===n);
 if(!list.length){partOne();return;}
 const ongoing=list.flatMap(l=>['guided','plan','independent'].map(mode=>({l,mode,s:state.data.sessions[l.id+':'+mode]}))).filter(x=>x.s&&!x.s.done).sort((a,b)=>String(b.s.started).localeCompare(String(a.s.started)))[0];
 const initial=list.find(l=>l.id===examStarts[n])||list[0];
 const next=ongoing?.l||(list.some(l=>state.record(l.id).attempts)?list.find(l=>!state.record(l.id).guided.length):initial)||initial;
 shell('<p class="breadcrumb"><a href="#calm">← Все задания: №1–13 и №16</a></p><section class="exam-head"><p class="eyebrow">ЕГЭ профиль · проект 2027 · №'+n+'</p><h1>'+examNames[n]+'</h1><p class="lead">'+examDescriptions[n]+'</p><a class="button" id="exam-start" href="#practice/'+next.id+'/'+(ongoing?.mode||'independent')+'">'+(ongoing?(ongoing.mode==='independent'?'Продолжить самостоятельно':'Продолжить по шагам'):'Попробовать задачу')+' →</a><p class="small">'+esc(next.title)+'</p>'+([1,2,3,4,6,7,8].includes(n)?board('#exam/'+n):'')+'</section><h2 class="topic-heading">Или выберите тему</h2><div class="exam-topics">'+list.map((l,i)=>'<article class="exam-topic"><span class="topic-number">'+String(i+1).padStart(2,'0')+'</span><div><h3>'+esc(l.title)+'</h3><p>'+esc(l.summary)+'</p><span class="small">'+status(l)+'</span></div><div class="topic-actions"><a class="button" href="#practice/'+l.id+'/independent">Решить самому</a><a href="#practice/'+l.id+'/guided">По шагам</a><a href="#lesson/'+l.id+'">Вспомнить правило</a></div></article>').join('')+'</div><p class="small">'+list.reduce((n,l)=>n+l.tasks.length,0)+' задач в этом маршруте.'+'</p>'+globalThis.ProfileCourse.resources(n));
}
function lesson(l){
 const active=activeIndependent(l);if(active&&!active.done&&!active.answers.length)markHelp(active,'independent');
 const s=state.data.sessions[l.id+':guided'];
 shell(breadcrumb(l)+'<section class="lesson-head"><p class="eyebrow">'+position(l)+'</p><h1>'+esc(l.title)+'</h1><p class="lead">'+esc(l.summary)+'</p><div class="actions">'+button(s&&!s.done?'Продолжить по шагам':'Решать по шагам','guided')+button('Решить с коротким планом','plan','button quiet')+button('Проверить себя','independent','button quiet')+'</div></section><details class="panel theory"><summary>Что понадобится: открыть справку</summary><p><a href="#example/'+l.id+'">Сначала посмотреть разобранный образец</a></p>'+l.intro+'</details>'+prerequisiteLinks(l)+(l.model?'<details class="panel model-panel" id="explore-lab"><summary>Исследовать правило на модели</summary><div id="lab"></div><p class="small muted">Это свободная модель. Во время решения будет рисунок именно к вашей задаче.</p></details>':'')+'<details class="panel extra-help"><summary>Дополнительные материалы</summary><ul class="resource-list">'+(l.links||[]).map(x=>'<li><a href="'+esc(x.href)+'">'+esc(x.title)+'</a></li>').join('')+'</ul>'+(l.vectorBasics?'':board('#lesson/'+l.id))+'</details>');
 if(l.model&&ProfileModels[l.model])cleanup=trackBoardView('model',ProfileModels[l.model](document.getElementById('lab'))||(()=>{}));formatDisplay();
 for(const mode of ['guided','plan','independent'])document.getElementById(mode).onclick=()=>{state.start(l.id,mode,!!state.data.sessions[l.id+':'+mode]?.done);location.hash='practice/'+l.id+'/'+mode;};
}
function current(l,mode){const s=state.start(l.id,mode),t=l.tasks.find(t=>t.id===s.taskId);return {s,t};}
function questionInput(q,draft){
 const answerUnit=ProfileTaskFirst.unit?.(q)||q.unit;
 const unit=answerUnit?'<p class="answer-unit-label">Единица ответа: <strong id="answer-unit" data-answer-unit>'+esc(answerUnit)+'</strong></p>':'';
 if(q.choices)return '<fieldset class="choices"><legend>Выберите ответ на вопрос выше</legend>'+q.choices.map(v=>'<label><input type="radio" name="answer" aria-label="'+esc(q.choiceLabels?.[v]||v)+'" value="'+esc(v)+'" '+(draft===String(v)?'checked':'')+'><span>'+esc(q.choiceLabels?.[v]||v)+'</span></label>').join('')+'</fieldset>'+unit;
 return '<label class="answer-label" for="answer">Запишите ответ на вопрос выше<input id="answer" name="answer" type="text" autocomplete="off" inputmode="text" value="'+esc(draft)+'" aria-describedby="input-note'+(answerUnit?' answer-unit':'')+'"></label>'+unit+'<p class="small muted" id="input-note">Введите число. Дробь — например, 3/4. Можно с запятой: 0,75.</p><details class="number-help"><summary>Как ввести корень или π</summary><p>Корень: √2 или sqrt(2). Число π: π или pi. Например, 3π/4. Если в знаменателе произведение, нужны скобки: 3/(4π).</p></details>';
}
function answerFeedback(q,input,l,t,mode,step){
 if(!boardSession&&globalThis.ProfilePracticeFeedback){
  const specific=ProfilePracticeFeedback.forAnswer({lesson:l,task:t,question:q,step,mode,input});
  if(specific)return specific;
 }
 if(!q.strictNumeric)return q.retry||'Попробуйте ещё раз. Если трудно — откройте подсказку к этому шагу.';
 const value=ProfileCheck.number(input);
 if(q.domain==='integer'&&!Number.isInteger(value))return 'Здесь нужно целое число. Проверьте количество периодов или целую границу из условия.';
 if(/руб/.test(q.unit||'')&&q.answer!==0&&[1000,0.001,1000000,0.000001].some(f=>Math.abs(value-q.answer*f)<=Math.max(1e-9,8*Number.EPSILON*Math.abs(q.answer*f))))return 'Сверьте единицы: ответ нужен в '+q.unit+'. В расчётах могли остаться тысячи или миллионы.';
 return q.retry||'Проверьте, от какой суммы начислены проценты, порядок платежей и единицу ответа.';
}
function submissionHistory(t,s,mode){
 if(boardSession)return '';
 const trace=s.submissions,steps=trace?.steps||[];
 const context=e=>e.help==='solution'?'после открытия разбора':e.help==='support'?'после подсказки или правила':mode==='guided'?'с пошаговой опорой':mode==='plan'?'с коротким планом':trace.fromStart?'без открытой помощи':'сведения о предыдущей помощи неизвестны';
 const answer=(event,step)=>{const q=mode==='guided'?t.steps[step]:t;return esc(q.choiceLabels?.[event.answer]||event.answer);};
 return '<details id="submission-history" class="earned-explanation" '+(!steps.length?'hidden':'')+'><summary>Мои ответы и исправления</summary><p class="small">'+(trace?.fromStart?'Здесь сохраняются первая и последняя отправки в этой попытке. Черновые правки сюда не попадают.':'История начата в уже открытой попытке. Более ранние ответы и помощь могли не сохраниться.')+'</p><ol>'+steps.map(item=>'<li data-submission-step="'+item.step+'">'+(mode==='guided'?'<b>Шаг '+(item.step+1)+'</b>':'<b>Ответ на задачу</b>')+'<p data-submission-first data-raw-math>'+(trace.fromStart?'Первая отправка':'Первая сохранённая отправка')+': '+answer(item.first,item.step)+' — '+(item.first.correct?'верно':'нужна правка')+'; '+context(item.first)+'.</p>'+(item.last.at!==item.first.at?'<p data-submission-latest data-raw-math>Последняя отправка: '+answer(item.last,item.step)+' — '+(item.last.correct?'верно':'нужна правка')+'; '+context(item.last)+'.</p>':'')+'</li>').join('')+'</ol></details>';
}
function history(t,s,mode){
 const count=mode==='guided'?Math.min(s.answers.length,t.steps.length):0;
 return '<section id="solution-history" class="solution-history" '+(!count?'hidden':'')+'><h2>Уже нашли</h2><ol>'+t.steps.slice(0,count).map((q,i)=>'<li data-step="'+i+'"><span class="earned-number">'+(i+1)+'</span><div><p>'+q.prompt+'</p><strong>'+esc(q.choiceLabels?.[q.answer]||format(q.answerExact??q.answer))+(q.unit?' '+esc(q.unit):'')+'</strong>'+('<details class="earned-explanation"><summary>Почему так</summary><p>'+q.why+'</p></details>')+'</div></li>').join('')+'</ol></section>';
}
function practice(l,mode){
 if(mode!=='independent'){const active=activeIndependent(l);if(active&&!active.done&&!active.answers.length)markHelp(active,'independent');}
 const {s,t}=current(l,mode);if(s.done){result(l,mode,s,t);return;}
 const q=mode==='guided'?t.steps[s.step]:{prompt:t.question||ProfileTaskFirst.question(t),answer:t.answer,answerExact:t.answerExact,choices:t.choices,choiceLabels:t.choiceLabels,unit:ProfileTaskFirst.unit?.(t)||t.unit,domain:t.domain,strictNumeric:t.strictNumeric,retry:t.retry,hint:t.steps[0].hint,why:t.explanation};
 const solved=mode==='guided'?s.answers.length>s.step:s.answers.length>0;
 const hasModel=!!globalThis.ProfileTaskModels?.[t.id],hasDrawingWalkthrough=['geo-right-sine','geo-right-cosine','geo-right-tangent'].includes(t.id)&&hasModel;
 const stamp=x=>[x.taskId,x.started,x.step,x.answers.length,x.done].join('|');let rendered=stamp(s);
 function ensureCurrent(){const live=state.start(l.id,mode);if(live!==s||stamp(live)!==rendered){practice(l,mode);return false;}return true;}
 shell(breadcrumb(l)+'<section class="practice-head"><div><p class="eyebrow">'+(mode==='guided'?'Решаем по шагам':mode==='plan'?'Решаем с коротким планом':'Решаем самостоятельно')+' · '+position(l)+'</p><h1>'+esc(l.title.split(':')[0])+'</h1></div><a class="text-link" href="#lesson/'+l.id+'">Вспомнить правило</a></section><div class="focused-practice '+(hasModel?'with-model':'')+(t.finance?' finance-practice':'')+'"><section class="panel condition-panel"><h2>Задача</h2><div class="task-condition">'+t.prompt+'</div>'+(t.finance?'<p class="finance-goal"><b>Нужно найти:</b> '+esc(t.targetLabel||t.diagram?.target||t.question||'ответ на вопрос задачи')+(t.unit?' <span>('+esc(t.unit)+')</span>':'')+'</p>':'')+'<div class="task-help-entry">'+button('Хочешь подсказку?','hint','button quiet')+'<section id="hint-box" class="hint-box" aria-label="Помощь к текущему шагу" hidden><h2>Что сделать сейчас?</h2><div class="short-hint">'+(q.hint||t.steps[0].hint)+'</div>'+(!hasDrawingWalkthrough?'<div id="task-solution"></div>':'')+'<details class="task-foundation"><summary>Нужно вспомнить правило?</summary><div>'+l.intro+'</div>'+(l.prereq?.text?'<details><summary>Объяснить ещё проще</summary>'+l.prereq.text+'</details>':'')+'</details><p class="small" id="hint-credit"></p></section></div>'+(hasModel&&!t.finance?'<div id="task-model" aria-label="Рисунок к задаче"></div>':'')+'<p class="small task-kind">'+(s.familiar?'Повтор знакомой задачи':'Новое условие')+'</p></section><section class="panel task-panel">'+(mode==='plan'?calm.plan(l):'')+(t.finance?'':history(t,s,mode))+'<div class="current-question"><p id="current-step" class="current-step">'+(mode==='guided'?'Шаг '+(s.step+1)+' из '+t.steps.length:'Ваше решение')+'</p><div class="question">'+q.prompt+'</div>'+(hasModel&&t.finance?'<div id="task-model" aria-label="Таблица к текущему шагу"></div>':'')+'<form id="answer-form">'+questionInput(q,s.draft)+'<div class="actions answer-actions"><button class="button" type="submit" id="submit-answer" '+(solved?'disabled hidden':'')+'>Проверить</button></div></form><div id="feedback" role="status" aria-live="polite" class="feedback '+(solved?'good':'')+'">'+(solved?'Верно. '+(mode==='guided'?q.why:'Можно завершить задачу.'):'')+'</div>'+submissionHistory(t,s,mode)+difficultyHelp(l,mode,s,solved)+'<div class="actions next-actions">'+button(mode==='guided'&&s.step<t.steps.length-1?'Следующий шаг →':'Завершить задачу','next')+'</div></div>'+(t.finance?history(t,s,mode):'')+'<details class="support-details"><summary>Нужна дополнительная помощь?</summary><p>Можно вспомнить основное правило и вернуться к этому шагу.</p>'+button('Разобраться с основой','repair','button quiet')+(mode!=='guided'?button('Разобрать эту задачу по шагам','repair-current','button quiet'):'')+'</details></section></div>');
 if(hasModel&&!t.finance){const model=main.querySelector('#task-model'),help=main.querySelector('.task-help-entry');if(model&&help)help.before(model);}
 // Keep the current answer directly under its question on narrow screens.
 // Finance tables and help remain available without pushing the input below them.
 if(t.finance){
  const workspace=main.querySelector('.current-question');
  for(const selector of ['#task-model','.task-help-entry','.task-kind']){
   const element=main.querySelector(selector);if(element)workspace.append(element);
  }
 }
 let modelCleanup=()=>{},solutionCleanup=()=>{},coachCleanup=()=>{};
 function helpLink(kind,controlIndex=-1){
  boardHelp={kind,controlIndex};
  const note=main.querySelector('.task-kind');if(!note)return;
  const link=document.createElement('a');link.className='task-help-link';
  link.href=kind==='solution'?'#task-solution':'#task-model';
  link.textContent=kind==='solution'?'Открыт разбор задачи · решение с помощью':'Открыто объяснение на рисунке · решение с помощью';
  link.onclick=e=>{
   // These are in-page destinations, not new routes in the hash router.
   e.preventDefault();if(!ensureCurrent())return;
   const container=document.getElementById(kind==='solution'?'task-solution':'task-model');if(!container)return;if(kind==='solution'&&document.getElementById('hint-box')?.hidden)document.getElementById('hint').click();
   const control=kind==='solution'?container.querySelector('[data-solution-open]'):
    container.querySelector('[data-trig-open]')||container.querySelectorAll('button,summary')[controlIndex];
   if(control?.getAttribute('aria-expanded')==='false'||control?.getAttribute('aria-pressed')==='false')control.click();
   else if(control?.tagName==='SUMMARY'&&!control.parentElement.open)control.parentElement.open=true;
   if(!container.isConnected)return;
   const target=container.querySelector('.profile-solution-title')||
    (control?.tagName==='SUMMARY'?control.parentElement:null)||
    container.querySelector('[data-expression-parts]:not([hidden])')||container.querySelector('.profile-model-note')||
    [...container.querySelectorAll('[aria-live]')].find(node=>!node.hidden&&!node.closest('details:not([open])'))||container;
   target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});
  };
  note.replaceChildren(link);
 }
 boardRenderHelp=value=>{if(value)helpLink(value.kind,value.controlIndex);};
 function solutionHelp(){if(applyingBoardState)return true;if(!ensureCurrent())return false;markHelp(s,mode,'solution');helpLink('solution');return true;}
 function mountModel(){
  modelCleanup();if(!hasModel)return;
  const container=document.getElementById('task-model');let controlIndex=-1;
  if(boardSession)container.replaceChildren();
  const rememberControl=e=>{const control=e.target.closest('button,summary');if(control&&container.contains(control))controlIndex=[...container.querySelectorAll('button,summary')].indexOf(control);};
  container.addEventListener('click',rememberControl,true);
  const dispose=globalThis.ProfileTaskModels[t.id](container,t,{step:s.step,solved:mode==='guided'?s.answers.length>s.step:s.answers.length>0,mode:mode==='plan'?'independent':mode,completed:s.answers.length,isCurrent:ensureCurrent,onHelp(){
   if(applyingBoardState)return true;if(!ensureCurrent())return false;markHelp(s,mode);helpLink('model',controlIndex);return true;
  },onExplain(){
   if(applyingBoardState)return true;if(!ensureCurrent())return false;helpLink('model',controlIndex);return true;
  }})||(()=>{});
  trackBoardView('model',dispose);formatDisplay(container);
  modelCleanup=()=>{container.removeEventListener('click',rememberControl,true);dispose();};
 }
 mountModel();
 // In text/finance problems the drawing repeats the supplied data. Keep it
 // available after the current answer instead of making the learner scroll
 // past the whole diagram and table before doing the first calculation.
 // Geometry and shared-board wrappers keep their original drawing position.
 if(document.body.classList.contains('profile-journey-page')&&!boardSession&&main.querySelector('#task-model .applied-model')){
  const workspace=main.querySelector('.current-question');
  for(const selector of ['#task-model','.task-help-entry','.task-kind']){
   const element=main.querySelector(selector);if(element)workspace.append(element);
  }
 }
 if(!hasDrawingWalkthrough&&globalThis.ProfileSolutions)solutionCleanup=trackBoardView('solution',ProfileSolutions.mount(document.getElementById('task-solution'),t,{onHelp:solutionHelp}));cleanup=()=>{modelCleanup();solutionCleanup();coachCleanup();};
 if(!boardSession&&mode!=='independent'&&globalThis.ProfilePracticeCoach?.supports(l)){
  const host=document.createElement('section');host.className='practice-coach-host';
  main.querySelector('.task-panel').append(host);
  coachCleanup=ProfilePracticeCoach.mount(host,{lesson:l,task:t,mode,session:s,isCurrent:ensureCurrent})||(()=>{});
 }
 calm.micro(l,t,s,mode);const pause=document.createElement('button');pause.type='button';pause.id='pause-practice';pause.className='button quiet';pause.textContent='Сделать паузу';main.querySelector('.practice-head').append(pause);pause.onclick=()=>{save();location.hash='pause/'+l.id+'/'+mode;};const repairCurrent=document.getElementById('repair-current');if(repairCurrent)repairCurrent.onclick=()=>{if(!ensureCurrent())return;markHelp(s,mode);setReturn('#practice/'+l.id+'/'+mode);state.remediate(l.id,t.id);location.hash='practice/'+l.id+'/guided';};
 const form=document.getElementById('answer-form'),feed=document.getElementById('feedback'),next=document.getElementById('next'),submit=document.getElementById('submit-answer');next.disabled=!solved;next.hidden=!solved;
 function showFeedback(kind){
  boardFeedback=kind;feed.className='feedback'+(kind==='right'?' good':kind==='wrong'?' bad':'');
  if(kind==='right')feed.innerHTML='Верно. '+(mode==='guided'?(q.why||'Можно продолжить.'):'Теперь завершите задачу, чтобы сохранить результат.');
  else feed.textContent=kind==='empty'?'Сначала введите или выберите ответ.':kind==='format'?'Не удалось прочитать число. Введите, например, 0,75 или 3/4. Это не считается ошибкой решения.':kind==='wrong'?'Пока не сходится. '+answerFeedback(q,s.draft,l,t,mode,s.step) : '';
  formatDisplay(feed);
 }
 boardRenderFeedback=showFeedback;showFeedback(solved?'right':'none');
 if(solved)for(const input of form.querySelectorAll('input'))input.disabled=true;
 if(boardSession)for(const input of form.querySelectorAll('input[type="text"]'))input.maxLength=200;
 function draft(){if(!ensureCurrent())return false;s.draft=String(new FormData(form).get('answer')||'');if(boardSession){s.draft=s.draft.slice(0,200);const input=form.querySelector('input[type="text"]');if(input){s.draft=s.draft.replace(/</g,'‹').replace(/>/g,'›');input.value=s.draft;}}save();return true;}
 form.addEventListener('input',draft);form.addEventListener('change',draft);
 form.onsubmit=e=>{
  e.preventDefault();if(submit.disabled||!draft())return;
  if(!s.draft.trim()){showFeedback('empty');return;}
  if(!q.choices&&!Number.isFinite(ProfileCheck.number(s.draft))){showFeedback('format');return;}
  const ok=ProfileCheck.check(q.answer,s.draft,q.choices,q);if(!boardSession)state.submitTrace(l.id,mode,s,s.draft,ok);showFeedback(ok?'right':'wrong');
  const traceView=document.getElementById('submission-history');if(traceView){const open=traceView.open;traceView.outerHTML=submissionHistory(t,s,mode);document.getElementById('submission-history').open=open;}
  if(ok){
   document.getElementById('difficulty-help').hidden=true;
   next.disabled=false;next.hidden=false;submit.disabled=true;submit.hidden=true;
   if(mode==='guided')s.answers[s.step]=s.draft;else s.answers[0]=s.draft;
   for(const input of form.querySelectorAll('input'))input.disabled=true;
   save();rendered=stamp(s);document.getElementById('solution-history').outerHTML=history(t,s,mode);mountModel();if(boardSession)boardRenderHint(!document.getElementById('hint-box').hidden);formatDisplay();next.focus({preventScroll:true});
  }else{s.wrong=true;document.getElementById('difficulty-help').hidden=false;save();}
 };
 const hintButton=document.getElementById('hint'),hintBox=document.getElementById('hint-box');
 hintButton.setAttribute('aria-controls','hint-box');hintButton.setAttribute('aria-expanded','false');
 function showHint(opening){hintBox.hidden=!opening;hintButton.setAttribute('aria-expanded',String(opening));hintButton.textContent=opening?'Убрать подсказку':'Хочешь подсказку?';document.getElementById('hint-credit').textContent=opening&&mode==='independent'&&!s.answers.length?'Это решение сохранится как работа с помощью. Затем можно решить новую задачу самостоятельно.':'';}
 boardRenderHint=showHint;
 hintButton.onclick=()=>{if(!ensureCurrent())return;const opening=hintBox.hidden;if(opening)markHelp(s,mode);showHint(opening);};
 document.getElementById('repair').onclick=()=>{if(!ensureCurrent())return;markHelp(s,mode);location.hash='repair/'+l.id+'/'+mode;};
 for(const link of main.querySelectorAll('#difficulty-help .prerequisite-link,#difficulty-help .difficulty-repair'))link.onclick=e=>{if(!ensureCurrent()){e.preventDefault();return;}markHelp(s,mode);if(!boardSession||link.target!=='_blank')setReturn('#practice/'+l.id+'/'+mode);};
 main.querySelector('a[href="#lesson/'+l.id+'"]').onclick=e=>{if(!ensureCurrent()){e.preventDefault();return;}markHelp(s,mode);setReturn('#practice/'+l.id+'/'+mode);};
 next.onclick=()=>{if(next.disabled||!ensureCurrent())return;if(mode==='guided'&&s.step<t.steps.length-1){s.step++;s.draft='';save();practice(l,mode);document.getElementById(t.vectorDiagram?'task-model':'current-step').scrollIntoView({block:'nearest'});}else{if(state.finish(l.id,mode,s)===false)practice(l,mode);else result(l,mode,s,t);}};
}
function repair(l,mode){const {s}=current(l,mode);markHelp(s,mode);const p=l.prereq||{title:'Проверяем основы',text:'<p>Выделите известные величины. Сформулируйте, что нужно найти, и выберите одно действие.</p>'};shell(breadcrumb(l)+'<section class="panel repair-panel"><p class="eyebrow">Короткое возвращение к основе</p><h1>'+esc(p.title)+'</h1><div class="theory">'+p.text+'</div>'+prerequisiteLinks(l)+(p.href?'<p><a target="_blank" rel="noopener" href="'+esc(p.href)+'">Открыть дополнительный тренажёр в новой вкладке</a></p>':'')+'<a class="button" href="#practice/'+l.id+'/'+mode+'">Вернуться на сохранённый шаг</a><p class="small muted">'+(s.assisted?'Помощь отмечена. Закончите эту задачу, затем попробуйте новую.':'Ответ уже принят. Просмотр правила не меняет результат.')+'</p></section>');for(const link of main.querySelectorAll('.prerequisite-link'))link.onclick=()=>{if(!boardSession||link.target!=='_blank')setReturn('#practice/'+l.id+'/'+mode);};}
function result(l,mode,s,t){
 const success=mode==='independent'&&!s.wrong&&!s.assisted&&!s.familiar;
 const idx=lessons.indexOf(l),next=byId.get(globalThis.ProfileReadiness?.next[l.id])||lessons.slice(idx+1).find(x=>x.group===l.group);
 const handoff=!boardSession?state.independentHandoff(l.id,s):null;
 const basicsDone=l.vectorBasics&&ProfileVectorBasics.every(topic=>ProfileJourney.starterProgress(topic,state)===3);
 const starterResult=l.vectorBasics?'<a class="button" data-vector-continue href="#calm/2">'+(basicsDone?'К задачам ЕГЭ':'Продолжить азбуку')+' →</a>':'';
 const handoffLabel=handoff?.kind==='resume'?'Продолжить начатую задачу':handoff?.kind==='familiar'?'Повторить другое знакомое условие':'Проверить себя на другом условии';
 const handoffNote=handoff?.kind==='resume'?'Сначала продолжите уже начатую попытку: ответ и шаг сохранены.'+(handoff.assisted?' Она уже с помощью или после ошибки и останется тренировкой.':handoff.familiar?' Это повтор знакомого условия.':''):handoff?.kind==='familiar'?'Подходящие условия уже знакомы. Повтор поможет закрепить тему; он не увеличит число новых самостоятельных решений.':'Другое условие ещё не открывалось. Попробуйте решить его без подсказок.';
 const lead=success?'Новое условие, первая попытка, без подсказок.':mode!=='independent'?(boardSession?(mode==='plan'?'Решение с коротким планом завершено. Теперь попробуйте новое условие без помощи.':'Пошаговая практика завершена. Следующее новое условие поможет проверить понимание.'):(mode==='plan'?'Решение с коротким планом завершено.':'Пошаговая практика завершена.')):s.familiar?(!s.wrong&&!s.assisted?'Повтор решён без подсказок. Этот повтор знакомой задачи сохранён как закрепление; он не увеличивает число новых самостоятельных успехов.':'Это повтор знакомой задачи. Он сохранён как тренировка.'):'Решение с подсказкой или после ошибки сохранено как тренировка.';
 shell(breadcrumb(l)+'<section class="panel result-panel"><span class="result-symbol" aria-hidden="true">✓</span><p class="eyebrow">Задача завершена</p><h1>'+(success?'Вы решили самостоятельно.':'Разобрались — теперь закрепим.')+'</h1><p class="lead">'+lead+'</p>'+starterResult+(handoff?'<div class="result-handoff"><div class="actions">'+button(handoffLabel,'independent-check')+'</div><p class="small" id="independent-check-note">'+handoffNote+'</p></div>':'')+submissionHistory(t,s,mode)+history(t,s,mode)+(mode==='independent'&&l.tasks.slice(-3).every(task=>state.data.seen[task.id])?'<aside class="note"><b>Все три проверочных условия уже открывались.</b><p>Продолжайте без подсказок: два разных условия, решённых в новой попытке с первого раза, дадут отметку «Закреплено на знакомых задачах». После этого маршрут предложит следующую тему. Число новых самостоятельных решений останется прежним.</p></aside>':'')+'<div class="solution"><h2>Решение этой задачи</h2><div class="task-condition">'+t.prompt+'</div>'+(globalThis.ProfileTaskModels?.[t.id]?'<div id="result-model" aria-label="Рисунок к решённой задаче"></div>':'')+'<div id="result-solution"></div></div><p>'+status(l)+'</p><div class="actions">'+button(mode==='guided'?'Ещё задача по шагам':'Следующая задача','another',boardSession?'button':'button quiet')+button(mode==='guided'?(calm.enabled()&&!l.vectorBasics?'Попробовать короткий план':'Проверить себя'):mode==='plan'?'Проверить себя':'Вернуться к объяснению','switch','button quiet')+'</div>'+(next&&!l.vectorBasics?'<p><a href="#lesson/'+next.id+'">Следующая тема: '+esc(next.title)+' →</a></p>':'')+'<p><a href="#calm">Весь маршрут профиля</a></p><p><a href="#progress">Мой отчёт</a> · <a href="#part-one">Вся первая часть</a></p></section>');
 const resultModel=document.getElementById('result-model'),modelCleanup=resultModel?(ProfileTaskModels[t.id](resultModel,t,{mode:'independent',step:0,completed:t.finance?.schema===1?t.steps.length:0,solved:t.finance?.schema===1||!!t.vectorDiagram,hideWalkthrough:true,onHelp(){return true;}})||(()=>{})):(()=>{}),solutionCleanup=globalThis.ProfileSolutions?ProfileSolutions.mount(document.getElementById('result-solution'),t,{initialOpen:false}):(()=>{});
 trackBoardView('model',modelCleanup);trackBoardView('solution',solutionCleanup);formatDisplay();cleanup=()=>{modelCleanup();solutionCleanup();};
 if(handoff){
  const check=document.getElementById('independent-check');check.setAttribute('aria-describedby','independent-check-note');
  check.onclick=()=>{state.independentHandoff(l.id,s,true);const target='#practice/'+l.id+'/independent';if(location.hash===target)practice(l,'independent');else location.hash=target;};
 }
 document.getElementById('another').onclick=()=>{if(boardSession)state.start(l.id,mode,true);else if(state.start(l.id,mode).done)state.start(l.id,mode,true);practice(l,mode);};
 document.getElementById('switch').onclick=()=>{if(mode!=='independent'){const dest=mode==='guided'&&calm.enabled()&&!l.vectorBasics?'plan':'independent';if(boardSession)state.start(l.id,dest,!!state.data.sessions[l.id+':'+dest]?.done);else if(state.start(l.id,dest).done)state.start(l.id,dest,true);location.hash='practice/'+l.id+'/'+dest;}else location.hash='lesson/'+l.id;};
}
function format(n){return typeof n==='number'?Number(n.toFixed(8)).toLocaleString('ru-RU',{maximumFractionDigits:8}):n;}
function download(data,name,type='application/json'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function progress(){
 const exams=globalThis.ProfileCalmData?.exams||[],journey=globalThis.ProfileJourney;
 const rows=lessons.map(l=>{
  const r=state.data.records[l.id]||{},guided=(r.guided||[]).length,independent=(r.independent||[]).length,recovered=(r.recovered||[]).length;
  const sessions=['guided','plan','independent'].map(mode=>state.data.sessions[l.id+':'+mode]).filter(Boolean);
  const active=sessions.some(s=>!s.done),started=!!(guided||independent||recovered||r.attempts||sessions.length);
  const mastered=independent>=2,canAdvance=new Set([...(r.independent||[]),...(r.recovered||[])]).size>=2;
  return {lesson:l,guided,independent,recovered,attempts:r.attempts||0,active,started,mastered,
   label:mastered?'Две новые задачи самостоятельно':canAdvance?'Закреплено на знакомых задачах':independent?'Одна новая задача самостоятельно':guided?'Есть пошаговая практика':active?'Есть незавершённая задача':'Можно начать по шагам'};
 });
 const next=journey?.choose({lessons,state,exams});
 const supported=rows.filter(r=>r.guided>0).length,independent=rows.filter(r=>r.independent>0).length,mastered=rows.filter(r=>r.mastered).length;
 const topic=r=>'<article class="progress-topic" data-progress-topic="'+r.lesson.id+'"><h3><a href="#lesson/'+r.lesson.id+'">'+esc(r.lesson.title)+'</a></h3><p class="lesson-status">'+esc(r.label)+'</p><progress value="'+Math.min(2,r.independent)+'" max="2" aria-label="'+esc(r.lesson.title)+': самостоятельное освоение"></progress><details class="progress-topic-evidence"><summary>Попытки и помощь</summary><p>С опорой: '+r.guided+' разных задач<br>Новые самостоятельно: '+r.independent+' из 3<br>Знакомые без ошибок и подсказок: '+r.recovered+'<br>Завершённых попыток: '+r.attempts+'</p></details></article>';
 const used=new Set(),sections=exams.map(e=>{const ids=new Set([...(e.starterIds||[]),...e.lessonIds]),items=rows.filter(r=>ids.has(r.lesson.id));items.forEach(r=>used.add(r.lesson.id));return {id:String(e.number),title:'№'+e.number+' · '+e.title,href:'#calm/'+e.number,items};});
 const foundations=rows.filter(r=>!used.has(r.lesson.id));if(foundations.length)sections.push({id:'foundations',title:'Основа и тригонометрия',href:'#readiness',items:foundations});
 const groupsHTML=sections.filter(g=>g.items.length).map(g=>{
  const worked=g.items.filter(r=>r.started),unstarted=g.items.filter(r=>!r.started),done=g.items.filter(r=>r.mastered).length;
  return '<details class="panel progress-group" data-progress-group="'+g.id+'"><summary><span>'+esc(g.title)+'</span><span class="progress-group-count">'+done+' из '+g.items.length+' тем · начато '+worked.length+'</span></summary><p class="small">Два новых самостоятельных условия: '+done+' из '+g.items.length+' тем.</p><p><a href="'+g.href+'">Открыть раздел →</a></p><div class="progress-topic-list">'+worked.map(topic).join('')+'</div>'+(unstarted.length?'<details class="progress-unstarted"><summary>Ещё не начинали · '+unstarted.length+' тем</summary><div class="progress-topic-list">'+unstarted.map(topic).join('')+'</div></details>':'')+'</details>';
 }).join('');
 let secondPart='';
 if(globalThis.ProfileSecondPart){let storage;try{storage=localStorage;}catch(_){}secondPart='<section class="progress-second-part"><h2>Вторая часть</h2><p class="small">У каждого раздела свои проверки. Ниже сохранены результаты прежних дополнительных тренажёров.</p><p><a href="/ege-profil/part-two/index.html#progress">Прогресс нового курса №14–20 →</a></p>'+ProfileSecondPart.items.map(item=>{const p=ProfileSecondPart.progress(item,storage);return '<details class="panel progress-group"><summary><span>№'+item.number+' · '+esc(item.title)+'</span><span class="progress-group-count">Прежние материалы: '+esc(p.text)+'</span></summary>'+(p.detail?'<p>'+esc(p.detail)+'</p>':'')+'<p class="small">'+esc(item.coverage)+'</p><a href="'+esc(item.href)+'">Открыть раздел →</a></details>';}).join('')+'</section>';}
 shell('<section class="lesson-head"><p class="eyebrow">Мой прогресс</p><h1>Что уже получается.</h1><p class="lead">Каждый шаг виден: работа с помощью, самостоятельный результат и две новые задачи без подсказок.</p></section>'+
 '<section class="journey-progress-summary" aria-label="Результаты учебного маршрута"><div class="journey-progress-metric"><strong>'+supported+'</strong><span>тем разобрано с опорой</span></div><div class="journey-progress-metric"><strong>'+independent+'</strong><span>тем с самостоятельным результатом</span></div><div class="journey-progress-metric"><strong>'+mastered+' из '+lessons.length+'</strong><span>тем: два новых условия самостоятельно</span></div></section>'+
 (next?'<section class="panel journey-next progress-next"><p class="eyebrow">Следующий шаг</p><h2>'+esc(byId.get(next.lessonId)?.title||next.label)+'</h2><p>'+esc(next.reason)+'</p><a class="button" id="progress-continue" href="'+esc(next.href)+'">'+esc(next.label)+'</a></section>':'')+
 '<section class="progress-course-groups"><h2>Темы и результаты</h2><p class="small">Раскройте нужный номер, чтобы посмотреть темы, попытки и помощь.</p>'+groupsHTML+'</section>'+secondPart+
 '<section class="panel progress-report"><h2>Отчёт для учителя</h2><details><summary>Как передать результаты</summary><p>Это локальная история этого браузера. Скачанный отчёт можно передать учителю или родителю: его откроет <a href="../teacher.html">кабинет учителя</a> кнопкой «Открыть полный отчёт». Облачный журнал групп здесь не подключён.</p></details><div class="actions">'+button('Скачать полный отчёт','export')+(state.original?button('Скачать исходное сохранение','raw-export','button quiet'):'')+'</div></section>'+
 '<details class="panel progress-explainer"><summary>Как читать результаты</summary><p>Две разные новые задачи решены с первой попытки без помощи — текущий рубеж темы. Он не подтверждает сохранение умения после перерыва.</p><p>Самостоятельные задачи берутся из отдельного набора. Когда все три уже открывались, начнутся повторы с явной отметкой. Два разных чистых решения знакомых условий отмечаются отдельно: «Закреплено на знакомых задачах». Они позволяют продолжить маршрут, но не увеличивают число новых самостоятельных успехов.</p><p>Одна тема может иметь несколько отметок: например, сначала работу с опорой, затем самостоятельное решение.</p></details>');
 const continueButton=document.getElementById('progress-continue');if(continueButton)continueButton.onclick=()=>{if(next.lessonId){const current=state.start(next.lessonId,next.mode,false);if(next.fresh&&current.done)state.start(next.lessonId,next.mode,true);}};
 document.getElementById('export').onclick=()=>download(JSON.stringify(globalThis.PROGRESS_CODE?.fullReport?PROGRESS_CODE.fullReport(state.export(),lessons):state.export(),null,2),'ege-profile-full-report.json');
 const raw=document.getElementById('raw-export');if(raw)raw.onclick=()=>download(state.original,'ege-profile-original-save.txt','text/plain');
}
function sources(){shell('<section class="panel repair-panel"><p class="eyebrow">Содержание и источники</p><h1>Первая часть и неравенства.</h1><p>'+lessons.length+' учебных тем, '+lessons.reduce((n,l)=>n+l.tasks.length,0)+' авторских задач в основном маршруте. В каждой теме — короткое объяснение, пошаговое решение и три отдельных условия для самостоятельной проверки. Подробные неравенства открываются отдельным разделом.</p><p>Нумерация соответствует <b>проекту ЕГЭ 2027</b>, опубликованному ФИПИ. Проверено 31 октября 2026 года. <a href="https://fipi.ru/ege/demoversii-specifikacii-kodifikatory" target="_blank" rel="noopener">Официальная страница ФИПИ</a> · <a href="https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/ma_11_2027.zip">Архив по математике</a>.</p><h2>Если у вас сборник 2026 года</h2><div class="course-table-wrap"><table class="course-numbering"><thead><tr><th>Тема</th><th>2026</th><th>Проект 2027</th></tr></thead><tbody><tr><td>Геометрия и вероятности</td><td>1–5</td><td>1–5</td></tr><tr><td>Случайные величины</td><td>—</td><td>6</td></tr><tr><td>Уравнения</td><td>6</td><td>7</td></tr><tr><td>Выражения</td><td>7</td><td>8</td></tr><tr><td>Производная и экстремумы</td><td>8, 12</td><td>9</td></tr><tr><td>Прикладные формулы</td><td>9</td><td>10</td></tr><tr><td>Текстовые задачи</td><td>10</td><td>11</td></tr><tr><td>Функции и графики</td><td>11</td><td>12</td></tr><tr><td>Финансовая задача первой части</td><td>—</td><td>13</td></tr><tr><td>Неравенства второй части</td><td>15</td><td>16</td></tr></tbody></table></div><h2>Финансовые задачи №13</h2><p>В финансовом разделе 16 тем и 96 задач. Новые 13 тем содержат 39 пар: разобранное условие и другое условие для самостоятельной работы. Условия, числовые данные и объяснения составлены заново.</p><p>Для дополнительной практики использованы математические модели девяти проверенных официальных кредитных примеров: №13 из проекта демоверсии 2027 года и экономические задачи №16 из материалов 2026 года. Исторические примеры помогают освоить способы расчёта; их включение не означает, что каждый такой тип обязателен в №13 2027 года. <a href="https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2026/ma_11_2026.zip">Демоверсия 2026, ZIP</a> · <a href="https://doc.fipi.ru/navigator-podgotovki/navigator-ege/MR_matematika_ege_2026.pdf">Методические рекомендации ФИПИ 2026, PDF</a>.</p><p>Авторские упражнения охватывают все номера первой части, но не каждый возможный тип из банка ФИПИ. Это учебный маршрут, а не полный пробный экзамен. Материалы второй части собраны на общей карте с указанием охвата каждой линии.</p><p>Модель показывает данные текущей задачи. Обоснование опирается на свойства и формулы. Результаты сохраняются в этом браузере; их можно скачать. У подробных неравенств своя тетрадь и свой отчёт.</p><a class="button" href="#part-one">К первой части</a></section>');}
function courseBoard(){
 const sections=[['Логарифмы',['expr-logarithms','algebra-logarithmic','fn-explog']],['Тригонометрия: понять основу',['trig-angle','trig-coordinates','trig-special','trig-tangent']],['Тригонометрия: применить формулы',['algebra-cosine','algebra-double-angle']]];
 shell('<section class="lesson-head"><p class="eyebrow">ЕГЭ профиль · совместный урок</p><h1>Логарифмы и тригонометрия</h1><p class="lead">Выберите тему. Исследуйте модель вместе, решите задачу по шагам и попробуйте новое условие.</p><p>Для основ с нуля откройте «Тригонометрия с нуля · окружность» в выборе тренажёра на доске.</p></section>'+sections.map(([title,ids])=>'<section><h2>'+title+'</h2><div class="exam-topics">'+ids.map(id=>{const l=byId.get(id);return '<article class="exam-topic"><div><h3>'+esc(l.title)+'</h3><p>'+esc(l.summary)+'</p><span class="small">'+status(l)+'</span></div><div class="topic-actions"><a class="button" href="#lesson/'+id+'">Открыть тему</a><a href="#practice/'+id+'/guided">Решить вместе по шагам</a><a href="#practice/'+id+'/independent">Проверить себя</a></div></article>';}).join('')+'</div></section>').join(''));
}
function route(){if(boardSession&&!boardAdapter.validRoute(location.hash))historyReplace(boardAdapter.defaultRoute);const [page,id,mode]=location.hash.slice(1).split('/');if(boardAdapter?.marker==='log-trig'&&page==='course')return courseBoard();if(!boardSession)calm?.beforeRoute(page);if(page==='calm')return calm.route(id);if(page==='example')return calm.example(id);if(page==='checkpoint')return calm.check();if(page==='checkpoint-pause')return calm.checkPause();if(page==='pause'&&byId.has(id)&&['guided','plan','independent'].includes(mode)){const l=byId.get(id),s=state.data.sessions[id+':'+mode];return shell('<section class="panel"><h1>Можно сделать паузу.</h1><p>'+esc(l.title)+'. '+(mode==='guided'?'Текущий шаг: '+((s?.step||0)+1)+'.':'')+' Введённый ответ сохранён.</p><a class="button" href="#practice/'+id+'/'+mode+'">Продолжить с того же места</a></section>');}if(page==='repair-task'&&byId.has(id)){const s=activeIndependent(byId.get(id));if(s&&!s.done){markHelp(s,'independent');setReturn('#practice/'+id+'/independent');state.remediate(id,s.taskId);location.hash='practice/'+id+'/guided';return;}}if(page==='readiness')return readiness();if(page==='diagnostic')return diagnose();if(page==='part-one')return partOne();if(page==='first-three')return firstThree();if(page==='exam'&&id==='15')return stereometryCourse();if(page==='exam'&&id==='16')return inequalities();if(page==='exam'&&examNames[Number(id)])return exam(Number(id));const l=byId.get(id);if(page==='lesson'&&l)return lesson(l);if(page==='practice'&&l&&['guided','plan','independent'].includes(mode))return practice(l,mode);if(page==='repair'&&l&&['guided','plan','independent'].includes(mode))return repair(l,mode);if(page==='progress')return progress();if(page==='sources')return sources();if(page==='home')return home();calm.route();}
function createCalm(){return ProfileCalmUI.create({lessons,state,main,shell,esc,format,questionInput,save,route,download,setReturn,board,storage:boardSession?.storage,isApplyingRemoteState:()=>applyingBoardState,trackBoardView,setCleanup(fn){cleanup=fn;}});}
function historyReplace(hash){window.history.replaceState(null,'',location.pathname+location.search+hash);}
function getBoardState(){return {
 route:location.hash,returnToTask,progress:boardSession.progress(state.data),preferences:boardSession.preferences(calm.getBoardState()),
 view:{hintOpen:!!document.getElementById('hint-box')&&!document.getElementById('hint-box').hidden,difficultyOpen:!!document.getElementById('difficulty-help')&&!document.getElementById('difficulty-help').hidden,feedback:boardFeedback,details:boardSession.readDetails(main),help:boardHelp?{...boardHelp}:null,model:boardViews.get('model')?.dispose.getBoardState?.()||null,solution:boardViews.get('solution')?.dispose.getBoardState?.()||null}
};}
function applyBoardState(value){
 if(!boardSession.validateState(value))throw new TypeError('Invalid '+boardAdapter.marker+' board state');
 // Validate every value before changing memory, route or DOM. Rendering a remote
 // snapshot must not start/finish attempts, award help, persist or publish.
 clearTimeout(boardNotifyTimer);applyingBoardState=true;
 try{
  boardSession.replace(value);returnToTask=value.returnToTask;state=createState();calm=createCalm();calm.bindToggle();historyReplace(value.route);route();
  for(const key of ['model','solution']){const view=boardViews.get(key);if(value.view[key]!==null){view.dispose.applyBoardState(value.view[key]);view.afterApply?.(value.view[key]);}}
  boardRenderHint(value.view.hintOpen);boardRenderFeedback(value.view.feedback);boardRenderHelp(value.view.help);
  const difficulty=document.getElementById('difficulty-help');if(difficulty)difficulty.hidden=!value.view.difficultyOpen;
  boardSession.applyDetails(main,value.view.details);
 }finally{applyingBoardState=false;}
}
function connectBoard(){
 const api={getState:getBoardState,applyState:applyBoardState,validateState:boardSession.validateState};
 window[boardAdapter.debugKey]=Object.freeze(api);
 if(typeof globalThis.MathExamBoard?.register!=='function'){
  boardConnectionWarning='Не удалось подключить общую доску. Обновите страницу, чтобы продолжить совместный урок.';warn();main.inert=true;document.getElementById('calm-toggle').disabled=true;return;
 }
 const schedule=()=>{if(applyingBoardState)return;clearTimeout(boardNotifyTimer);boardNotifyTimer=setTimeout(()=>{if(!applyingBoardState)boardNotify();},0);};
 MathExamBoard.register({id:boardAdapter.id,version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,getState(){const value=getBoardState();if(!boardSession.validateState(value))throw new TypeError('Profile board view is not ready to publish');return value;},applyState:applyBoardState,subscribe(notify){
  boardNotify=notify;const events=['click','input','change','submit','toggle','keydown','pointermove','pointerup'];
  events.forEach(name=>document.addEventListener(name,schedule,true));window.addEventListener('hashchange',schedule);
  return ()=>{clearTimeout(boardNotifyTimer);events.forEach(name=>document.removeEventListener(name,schedule,true));window.removeEventListener('hashchange',schedule);boardNotify=()=>{};};
 }});
}
calm=createCalm();calm.bindToggle();window.addEventListener('hashchange',route);route();if(boardSession)connectBoard();
})();
