(function () {
'use strict';
const D=window.PetersonCourse, sharedMath=window.PetersonMath, main=document.getElementById('main');
if(!D||!sharedMath){main.innerHTML='<div class="error-page"><h1>Не все файлы курса загрузились</h1><p>Обновите страницу. Для работы без интернета распакуйте весь архив курса в одну папку.</p></div>';return;}
// Opt this course into revised steps; other courses keep the shared legacy API.
const M={...sharedMath,skills:sharedMath.equationSkills||sharedMath.skills,generate:(id,seed,level=1,methodVersion=2)=>sharedMath.generate(id,seed,level,methodVersion)};
const KEY='mathexam.peterson6.part1.v1', blank=()=>({version:1,tasks:{},practice:{},last:null,origin:null,...(!boardSession?{history:{}}:{})});
const boardAdapter=window.PetersonBoard;
const boardSession=boardAdapter&&location.pathname===boardAdapter.path&&document.body?.dataset.petersonBoard===boardAdapter.marker?boardAdapter.create({lessons:D.lessons,math:M,models:window.PetersonModels}):null;
let state=blank(), writable=true, cleanup=null, active=null;
const taskHelp=!boardSession&&(window.self===window.top||new URLSearchParams(location.search).get('cabinet')==='peterson-helper')
  ? window.PetersonTaskHelp?.mount({getTask:assistantTask}) : null;
function assistantTask(){
 if(!active||boardSession)return null;
 const selected=active,t=selected.task,s=ts(t.id);
 const expected=selected.practice?'#practice/'+selected.skill+'/'+selected.level:'#lesson/'+selected.lesson.id+'/'+selected.index;
 if(validRoute(location.hash)!==expected)return null;
 return {id:t.id,title:t.title,condition:t.prompt,hint:t.hint,stepIndex:s.step,complete:s.correct,
  steps:t.steps.map(q=>({title:q.prompt,hint:q.hint,explanation:q.explanation,answer:displayValue(q.answer,q.answerFormat)})),
  explanation:(t.explanation||'')+'\nОтвет: '+displayValue(t.answer,t.answerFormat),
  onHelp(){if(active!==selected||validRoute(location.hash)!==expected)return false;markAssisted(s);save();return true;}};
}
let applyingBoardState=false,boardNotifyTimer=null,boardNotify=()=>{},lastBoardSnapshot=null;
let boardStepFeedback='',boardNumber={draft:'',submitted:null},renderedBoardRoute=null;
function boardText(input,max){if(!boardSession)return input.value;input.value=input.value.slice(0,max).replace(/</g,'‹').replace(/>/g,'›');return input.value;}
function boardLink(){return boardSession||window.self!==window.top?'':'<a class="button quiet board-link" href="'+(location.protocol==='file:'?'https://mathexam.space':'')+'/trainers/trainer-board.html?trainer='+encodeURIComponent('/school/peterson6/'+(location.hash||'#home'))+'">Открыть на доске</a>';}

const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(v){return e(v).replace(/\{\{mix:([−\-\d]+):([\d]+):([\d]+)\}\}/g,(_,w,n,d)=>'<span class="mixed">'+w+'<span class="fra" aria-label="'+n+' делить на '+d+'"><span>'+n+'</span><span>'+d+'</span></span></span>').replace(/\{\{frac:([^{}:\n]+):([^{}:\n]+)\}\}/g,(_,n,d)=>'<span class="fra" aria-label="'+n+' делить на '+d+'"><span>'+n+'</span><span>'+d+'</span></span>').replace(/\n/g,'<br>');}
const byId=Object.fromEntries(D.lessons.map(l=>[l.id,l])), skills=Object.fromEntries(M.skills.map(s=>[s.id,s])), taskById=Object.fromEntries(D.lessons.flatMap(l=>l.tasks.map(t=>[t.id,t])));

function record(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
function taskSignature(t){return t.prompt+'\u241f'+t.answer+'\u241f'+(t.answerFormat||'');}
function resolveTask(id,methodVersion=2){if(Object.prototype.hasOwnProperty.call(taskById,id))return methodVersion===1&&D.legacyTasks?.[id]?D.legacyTasks[id]:taskById[id];const m=/^practice:([a-z-]+):([123]):(\d+)$/.exec(id);if(!m||!skills[m[1]])return null;const seed=Number(m[3]);if(!Number.isSafeInteger(seed)||seed<1||seed>=1000000)return null;try{const t=M.generate(m[1],seed,Number(m[2]),methodVersion);t.id=id;return t;}catch(_){return null;}}
function validRoute(hash){if(typeof hash!=='string')return null;let m=/^#lesson\/(p\d{2})(?:\/(\d+))?$/.exec(hash);if(m&&byId[m[1]]){const i=Number(m[2]||0);return i<byId[m[1]].tasks.length?'#lesson/'+m[1]+'/'+i:null;}m=/^#practice\/([a-z-]+)\/([123])$/.exec(hash);return m&&skills[m[1]]?hash:null;}
function sanitizeTask(raw,t){const safe=fresh(t.methodVersion||1);if(!record(raw))return safe;for(const k of ['value','note','feedback'])if(typeof raw[k]==='string')safe[k]=raw[k].slice(0,15000);for(const k of ['guided','assisted','hint'])safe[k]=raw[k]===true;safe.attempts=Number.isSafeInteger(raw.attempts)?Math.max(0,Math.min(1000000,raw.attempts)):0;safe.values=Array.isArray(raw.values)?raw.values.slice(0,t.steps.length).map(v=>typeof v==='string'?v.slice(0,200):''):[];for(const k of ['stepHints','reveals'])if(record(raw[k]))for(const [i,v] of Object.entries(raw[k]))if(/^\d{1,2}$/.test(i)&&Number(i)<t.steps.length&&v===true)safe[k][i]=true;
 const target=Number.isInteger(raw.step)?Math.max(0,Math.min(t.steps.length,raw.step)):0;while(safe.step<target&&check(safe.values[safe.step]||'',t.steps[safe.step]))safe.step++;
 safe.correct=raw.correct===true&&check(safe.value,t);
 const help=safe.assisted||safe.guided||safe.hint||Object.keys(safe.stepHints).length>0||Object.keys(safe.reveals).length>0||safe.step>0;
 const c=raw.completion,hasCompletion=safe.correct&&record(c)&&Number.isInteger(c.attempts)&&c.attempts>=1&&c.attempts<=1000000&&typeof c.assisted==='boolean';
 if(hasCompletion){safe.attempts=c.attempts;safe.assisted=c.assisted;safe.independent=c.independent===true&&!c.assisted&&c.attempts===1;}else{safe.assisted=help;safe.independent=safe.correct&&raw.independent===true&&!help&&safe.attempts===1;}
 if(safe.correct)safe.completion={attempts:safe.attempts,assisted:safe.assisted,independent:safe.independent};
 if(t.id.startsWith('practice:'))safe.signature=taskSignature(t);
 return safe;
}
function hasPreviousWork(r){return !!(r.value||r.note||r.feedback||r.correct||r.guided||r.assisted||r.hint||r.attempts||r.step||(r.values||[]).some(Boolean)||Object.values(r.stepHints||{}).some(Boolean)||Object.values(r.reveals||{}).some(Boolean));}
function hadHelpOrAnswer(r){return !!(r.assisted||r.guided||r.hint||r.correct||r.attempts||r.step||Object.values(r.stepHints||{}).some(Boolean)||Object.values(r.reveals||{}).some(Boolean));}
function sanitizeState(raw){
 if(!record(raw)||raw.version!==1||!record(raw.tasks)||!record(raw.practice))throw Error('Неподдерживаемый формат сохранения.');
 const safe=blank(),seen=new Set();
 function restore(id,r){
  if(!record(r))return null;
  const version=r.methodVersion===undefined?1:r.methodVersion;
  if(![1,2].includes(version))throw Error('Сохранение использует более новую редакцию заданий.');
  const t=resolveTask(id,version);if(!t)return null;
  if(version===2&&t.methodVersion!==2)throw Error('Редакция сохранённой задачи не найдена.');
  const restored=sanitizeTask(r,t);const current=resolveTask(id);return version===1&&current.methodVersion===2&&!hasPreviousWork(restored)?fresh(2):restored;
 }
 for(const [id,taskState] of Object.entries(raw.tasks)){
  const r=restore(id,taskState);if(!r)continue;
  if(r.signature){r.repeated=seen.has(r.signature);seen.add(r.signature);if(r.repeated){r.independent=false;if(r.completion)r.completion.independent=false;}}
  safe.tasks[id]=r;
 }
 if(raw.history!==undefined){
  if(!record(raw.history))throw Error('Повреждена история прежних решений.');
  let total=0;
  for(const [id,entries] of Object.entries(raw.history)){
   if(!Array.isArray(entries)||!resolveTask(id))throw Error('Повреждена история задачи.');
   total+=entries.length;if(total>10000)throw Error('Слишком много записей истории.');
   safe.history[id]=entries.map(r=>{const value=restore(id,r);if(!value)throw Error('Неизвестная запись истории.');return value;});
  }
 }
 for(const [key,p]of Object.entries(raw.practice)){
  const m=/^([a-z-]+):([123])$/.exec(key);
  if(m&&skills[m[1]]&&record(p)&&Number.isSafeInteger(p.seed)&&p.seed>=1&&p.seed<1000000)safe.practice[key]={seed:p.seed};
 }
 for(const [id,entries]of Object.entries(safe.history||{})){const current=safe.tasks[id];if(current?.methodVersion===2&&entries.some(hadHelpOrAnswer)){current.assisted=true;current.independent=false;if(current.completion){current.completion.assisted=true;current.completion.independent=false;}}}
 const historicalSignatures=new Map();for(const [id,rows]of Object.entries(safe.history||{}))for(const r of rows)if(r.signature){const ids=historicalSignatures.get(r.signature)||new Set();ids.add(id);historicalSignatures.set(r.signature,ids);}
 for(const [id,r]of Object.entries(safe.tasks))if(r.signature&&[...(historicalSignatures.get(r.signature)||[])].some(other=>other!==id)){r.repeated=true;r.independent=false;if(r.completion)r.completion.independent=false;}
 const last=validRoute(raw.last?.hash);if(last)safe.last={hash:last};
 const origin=validRoute(raw.origin?.hash);if(origin&&origin.startsWith('#lesson/'))safe.origin={hash:origin,scroll:Number.isFinite(raw.origin.scroll)?Math.max(0,Math.min(10000000,raw.origin.scroll)):0};
 return safe;
}
function workTask(current){
 if(boardSession)return current;
 const saved=state.tasks[current.id];
 return saved&&(saved.methodVersion||1)<(current.methodVersion||1)?resolveTask(current.id,saved.methodVersion||1):current;
}
function currentCredit(task){const saved=ts(task.id);return boardSession||(saved.methodVersion||1)===(task.methodVersion||1);}
function archiveTask(id,saved){
 if(boardSession)return;
 const list=state.history[id]||(state.history[id]=[]),copy=JSON.parse(JSON.stringify(saved));
 if(!list.some(item=>JSON.stringify(item)===JSON.stringify(copy)))list.push(copy);
}
function startCurrentMethod(){
 if(boardSession||!active)return;
 const id=active.task.id,current=resolveTask(id),previous=ts(id);
 if((current.methodVersion||1)<=(previous.methodVersion||1))return;
 archiveTask(id,previous);
 const next=fresh(current.methodVersion||1);
 if(active.practice){next.signature=taskSignature(current);next.repeated=previous.repeated;}
 next.assisted=hadHelpOrAnswer(previous)||(state.history[id]||[]).some(hadHelpOrAnswer);
 state.tasks[id]=next;active.task=current;save();renderProblem();
}
function earlierWorkHTML(id){
 if(boardSession)return '';
 const entries=state.history[id]||[];if(!entries.length)return '';
 return '<details class="earlier-work"><summary>Ранее сохранённая работа ('+entries.length+')</summary>'+entries.map((r,n)=>{
  const t=resolveTask(id,r.methodVersion||1);
  return '<section><h3>Работа '+(n+1)+'</h3><p>'+fmt(t.prompt)+'</p><p>'+e(r.correct?(r.independent?'Завершена самостоятельно.':'Завершена с помощью / после попыток.'):'Начатое решение.')+'</p><ol>'+t.steps.slice(0,Math.min(t.steps.length,r.step+1)).map((q,i)=>'<li><strong>'+fmt(q.prompt)+'</strong>'+(r.values[i]?'<p>Твоя запись: '+fmt(r.values[i])+(i<r.step?' ✓':'')+'</p>':'')+(i<r.step||r.reveals[i]?'<p>'+fmt(q.explanation)+'</p>':'')+(r.stepHints[i]?'<p>Была открыта подсказка: '+fmt(q.hint)+'</p>':'')+'</li>').join('')+'</ol>'+(r.value?'<p>Записанный ответ: '+fmt(r.value)+'</p>':'')+(r.note?'<p>Твои заметки: '+fmt(r.note)+'</p>':'')+'</section>';
 }).join('')+'</details>';
}
function methodNotice(t,s){
 if(boardSession)return '';
 const current=resolveTask(t.id);
 return (current.methodVersion||1)>(s.methodVersion||1)?'<div class="method-notice"><p>Здесь сохранена прежняя работа. Можно продолжить её или открыть разбор через неизвестную. Прежние записи останутся доступны.</p>'+button('Открыть разбор через неизвестную','current-method')+'</div>':'';
}
function legacySummaryHTML(){
 if(boardSession)return '';
 const prior=new Map();
 for(const [id,r]of Object.entries(state.tasks))if((r.methodVersion||1)<(resolveTask(id)?.methodVersion||1)&&hasPreviousWork(r))prior.set(id,[r]);
 for(const [id,rows]of Object.entries(state.history||{}))for(const r of rows)if((r.methodVersion||1)<(resolveTask(id)?.methodVersion||1)&&hasPreviousWork(r))prior.set(id,[...(prior.get(id)||[]),r]);
 if(!prior.size)return '';
 let completed=0;const links=[];
 for(const [id,rows]of prior){if(rows.some(r=>r.correct))completed++;let hash,label,attributes='';
  if(id.startsWith('practice:')){const [,skill,level,seed]=id.split(':');hash='#practice/'+skill+'/'+level;label=skills[skill].title+' · пример '+seed;attributes=' data-action="saved-practice" data-task="'+e(id)+'"';}
  else {const lesson=D.lessons.find(l=>l.tasks.some(t=>t.id===id)),index=lesson.tasks.findIndex(t=>t.id===id);hash='#lesson/'+lesson.id+'/'+index;label=lesson.title+' · задача '+(index+1);}
  links.push('<li><a href="'+e(hash)+'"'+attributes+'>'+e(label)+'</a> — '+(rows.some(r=>r.correct)?'завершена ранее':'сохранены записи')+'</li>');
 }
 return '<details class="panel section legacy-summary"><summary>Прежняя работа сохранена: '+prior.size+' задач</summary><p>Ранее завершено: '+completed+'. Здесь можно открыть прежние записи. В таблице результатов показано освоение текущих разборов через неизвестную.</p><ul>'+links.join('')+'</ul></details>';
}
function markAssisted(s){if(!s.correct)s.assisted=true;}
function displayValue(value,form){if(form==='decimal'){try{return M.decimal(value);}catch(_){return String(value);}}const str=String(value??'').trim().replace(/−/g,'-');const mixed=/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(str);if(mixed)return '{{mix:'+mixed[1]+':'+mixed[2]+':'+mixed[3]+'}}';const fraction=/^([+-]?\d+)\s*\/\s*(\d+)$/.exec(str);if(fraction)return '{{frac:'+fraction[1]+':'+fraction[2]+'}}';return str;}

function warn(msg){const el=document.getElementById('storage-warning');el.hidden=false;el.textContent=msg;}
if(!boardSession)try{const raw=localStorage.getItem(KEY);if(raw)state=sanitizeState(JSON.parse(raw));}catch(err){writable=false;warn('Не удалось прочитать сохранение. Оно не перезаписано. Текущую работу можно скачать в разделе результатов.');}
function save(){if(boardSession||!writable)return;try{localStorage.setItem(KEY,JSON.stringify(state));}catch(err){writable=false;warn('Браузер не смог сохранить работу. Продолжайте занятие и скачайте результаты перед закрытием.');}}
function fresh(methodVersion=1){return {...(!boardSession?{methodVersion}:{}),value:'',values:[],step:0,guided:false,assisted:false,hint:false,stepHints:{},reveals:{},attempts:0,correct:false,independent:false,note:'',feedback:'',signature:'',repeated:false,completion:null};}
function ts(id){if(!state.tasks[id]||typeof state.tasks[id]!=='object')state.tasks[id]=fresh(resolveTask(id)?.methodVersion||1);const s=state.tasks[id];for(const [k,v] of Object.entries(fresh(resolveTask(id)?.methodVersion||1)))if(s[k]===undefined)s[k]=v;return s;}
function button(text,action,extra='',quiet=false){return '<button type="button" data-action="'+action+'" '+extra+(quiet?' class="quiet"':'')+'>'+text+'</button>';}
function go(hash){if(location.hash===hash)route();else location.hash=hash;}
function count(lesson){return lesson.tasks.filter(t=>currentCredit(t)&&ts(t.id).correct).length;}
function independent(lesson){return lesson.tasks.filter(t=>currentCredit(t)&&ts(t.id).independent).length;}
function returnBanner(){return state.origin?'<div class="return-banner"><div><strong>Тренируем отдельный навык</strong><br><span class="small">Условие, ответы и шаги исходной задачи сохранены.</span></div>'+button('← Вернуться к задаче','return')+'</div>':'';}
function skillLinks(ids){return (ids||[]).filter(id=>skills[id]).map(id=>button(e(skills[id].title),'detour','data-skill="'+id+'"',true)).join('');}
function home(){const total=D.lessons.reduce((s,l)=>s+l.tasks.length,0),done=D.lessons.reduce((s,l)=>s+count(l),0);main.innerHTML=`
<section class="hero"><div><p class="eyebrow">Петерсон · 6 класс · часть 1</p><h1>Разобраться.<br>Потренироваться.<br>Решить самому.</h1><p class="lead">Логика, дроби и проценты — маленькими шагами. Если вычисление пока не получается, остановись и потренируй именно его.</p><div class="row"><a class="button" href="${e(state.last?.hash||'#lesson/p01')}">${state.last?'Продолжить занятие':'Начать с первой темы'} →</a><a class="button quiet" href="#skills">Потренировать вычисления</a>${boardLink()}</div></div><div class="hero-art" aria-label="Из сложного примера можно перейти в тренировку и вернуться"><span class="eyebrow">Один навык за раз</span><div class="equation">0,3 × <span class="fra"><span>5</span><span>9</span></span> = ?</div><div class="path"><span>Выбери запись</span><span>Сократи</span><span>Умножь</span></div><p class="small">Новые примеры → возврат к своей задаче</p></div></section>
<div class="stats"><div class="stat"><strong>14</strong><span>тем первой части</span></div><div class="stat"><strong>${total}</strong><span>учебных задач с проверкой</span></div><div class="stat"><strong>${M.skills.length}</strong><span>отдельных тренировок</span></div><div class="stat"><strong>${done}</strong><span>${boardSession?'решено на этом уроке':'решено в этом браузере'}</span></div></div>
${legacySummaryHTML()}
<section class="panel section"><h2>Занимаешься по учебнику?</h2><form id="number-form" class="number-form"><label for="exercise-number">Номер упражнения (1–497)<input id="exercise-number" type="number" min="1" max="497" required inputmode="numeric"></label><button>Найти тему и тренировку</button></form><div id="number-result" class="search-results" aria-live="polite"></div><p class="small">Поиск связывает номер с темой. Это карта всех номеров первой части; подробные решения в курсе есть для отдельных выбранных примеров.</p></section>
${['Язык и логика','Арифметика'].map((chapter,i)=>'<section class="section"><p class="eyebrow">Глава '+(i+1)+'</p><h2>'+chapter+'</h2><div class="grid">'+D.lessons.filter(l=>l.chapter===chapter).map(l=>'<a class="lesson-card" href="#lesson/'+l.id+'"><span class="lesson-number">'+String(l.order).padStart(2,'0')+'</span><div><h3>'+e(l.title)+'</h3><p class="small">С. '+l.page+' · '+l.tasks.length+' задач · наглядная модель</p><p><span class="tag">'+count(l)+' / '+l.tasks.length+' решено</span>'+(independent(l)?'<span class="tag">'+independent(l)+' самостоятельно</span>':'')+'</p></div></a>').join('')+'</div></section>').join('')}
<details class="panel section"><summary>Что входит в курс</summary><p>Все 14 тем части 1 учебника Г. В. Дорофеева и Л. Г. Петерсон, БИНОМ, 2019. Авторские объяснения, интерактивные модели, учебные задачи и выбранные примеры из книги. Авторские задачи помечены; они не выдаются за номера учебника.</p><p>Решения всех 497 номеров и частей 2–3 сюда не входят. Успех в отдельной тренировке не отмечает исходную задачу как решённую.</p><p>Дроби можно вводить как 3/4, десятичные — с запятой, смешанные числа — как 2 1/3. Никаких таймеров. Для самостоятельного результата реши новую задачу с первой попытки без подсказок.</p></details>`;
const numberInput=document.getElementById('exercise-number');
numberInput.oninput=()=>{if(boardSession){numberInput.value=numberInput.value.replace(/[^0-9]/g,'').slice(0,3);boardNumber.draft=numberInput.value;}};
document.getElementById('number-form').onsubmit=ev=>{ev.preventDefault();const n=Number(numberInput.value);if(boardSession)boardNumber={draft:numberInput.value,submitted:Number.isInteger(n)&&n>=1&&n<=497?n:'invalid'};findNumber(n);};}

function findNumber(n){const r=document.getElementById('number-result');if(!Number.isInteger(n)||n<1||n>497){r.textContent='Введи целый номер от 1 до 497.';return;}const ref=D.exerciseIndex[n],l=byId[ref.lesson],matches=D.lessons.flatMap(x=>x.tasks.map((t,i)=>({t,l:x,i}))).filter(x=>x.t.source?.type==='textbook'&&new RegExp('№\\s*'+n+'(?!\\d)').test(x.t.source.reference));r.innerHTML='<h3>№ '+n+' · страница '+ref.page+'</h3><p>'+e(ref.review?'Блок самопроверки. Повтори связанные темы.':l.title)+'</p><div class="row"><a class="button quiet" href="#lesson/'+l.id+'">Открыть тему</a>'+matches.map(x=>'<a class="button quiet" href="#lesson/'+x.l.id+'/'+x.i+'">Разбор '+e(x.t.source.reference)+'</a>').join('')+'</div>'+(matches.length?'':'<p class="small">Индивидуальный разбор этого номера ещё не включён. Доступны объяснение темы и авторские задания.</p>')+'<div class="row">'+skillLinks(l.skills)+'</div>';}
function skillPage(){main.innerHTML=returnBanner()+'<p class="eyebrow">Вычислительная мастерская</p><h1>Потренируй один навык</h1><p class="lead">Выбери действие. Начни с простых чисел, затем переходи к более сложным. Кнопка «Новый пример» даёт другое задание.</p><div class="skill-grid">'+M.skills.map(s=>'<article class="skill-card"><span class="eyebrow">Практика</span><h2>'+e(s.title)+'</h2><p>'+e(s.description)+'</p><a class="button quiet" href="#practice/'+s.id+'/1">Начать →</a></article>').join('')+'</div>';}
function lessonView(id,index){const l=byId[id];if(!l)return home();index=Math.max(0,Math.min(l.tasks.length-1,Number(index)||0));const t=workTask(l.tasks[index]);active={lesson:l,task:t,index,practice:false};state.last={hash:'#lesson/'+id+'/'+index};save();main.innerHTML='<div class="breadcrumb"><a href="#home">← Все темы</a><span>/ '+l.chapter+'</span></div><p class="eyebrow">Тема '+l.order+' · с. '+l.page+' · № '+e(l.sourceRange)+'</p><h1 class="lesson-title">'+e(l.title)+'</h1><div id="model" class="model"></div><details class="panel"><summary>Коротко о главном</summary>'+l.theory.map(p=>'<div class="theory-block"><h3>'+e(p.title)+'</h3><p>'+fmt(p.text)+'</p>'+(p.example?'<div class="theory-example">'+fmt(p.example)+'</div>':'')+'</div>').join('')+'</details><div class="lesson-layout"><aside class="side"><details open><summary>Задачи этой темы</summary><div class="side-list">'+l.tasks.map((q,i)=>'<button type="button" data-action="task" data-index="'+i+'" class="'+(i===index?'current':'')+'" '+(i===index?'aria-current="step"':'')+'><span class="status">'+(ts(q.id).correct?'✓':'')+'</span>'+(i+1)+'. '+e(q.title)+'</button>').join('')+'</div></details></aside><div class="content-column"><div id="problem"></div><div class="navigation">'+(index?button('← Предыдущая','task','data-index="'+(index-1)+'"',true):'<span></span>')+(index<l.tasks.length-1?button('Следующая задача →','task','data-index="'+(index+1)+'"',true):l.order<14?'<a class="button quiet" href="#lesson/p'+String(l.order+1).padStart(2,'0')+'">Следующая тема →</a>':'<a class="button" href="#progress">Мои результаты →</a>')+'</div></div></div>';cleanup=window.PetersonModels?.mount(document.getElementById('model'),l);renderProblem();}
function practiceView(id,level){if(!skills[id])return skillPage();level=[1,2,3].includes(Number(level))?Number(level):1;const key=id+':'+level;let p=state.practice[key];if(!p||!Number.isSafeInteger(p.seed))p=state.practice[key]={seed:1};let t=M.generate(id,p.seed,level);t.id='practice:'+id+':'+level+':'+p.seed;t=workTask(t);t.signature=taskSignature(t);const saved=ts(t.id);if(!saved.signature){saved.signature=t.signature;saved.repeated=savedSignatures(t.id).has(t.signature);}active={task:t,practice:true,skill:id,level,key};if(!state.origin)state.last={hash:'#practice/'+id+'/'+level};save();main.innerHTML=returnBanner()+'<div class="breadcrumb"><a href="#skills">← Выбрать другой навык</a></div><p class="eyebrow">Отдельная тренировка · пример '+p.seed+'</p><h1 class="lesson-title">'+e(skills[id].title)+'</h1><div class="row"><label for="level">Сложность</label><select id="level" class="level-select"><option value="1">1 · Начинаем с простого</option><option value="2">2 · Закрепляем</option><option value="3">3 · Проверяем себя</option></select><span class="small">Без ограничения времени</span></div><div id="problem" class="section"></div><div class="navigation">'+button('Новый пример →','new')+(state.origin?button('Вернуться к исходной задаче','return','',true):'<a class="button quiet" href="#skills">Другой навык</a>')+'</div><p class="small">Для самостоятельного результата реши новый пример без подсказок и с первой попытки. Разобранный пример остаётся в результатах как решение с помощью.</p>';document.getElementById('level').value=level;document.getElementById('level').onchange=ev=>go('#practice/'+id+'/'+ev.target.value);renderProblem();}
function inputNote(target){if(target.kind==='choice')return 'Выбери запись и нажми «Проверить шаг».';const f=target.answerFormat;return {'decimal':'Введи десятичную дробь с запятой или точкой.','reduced-fraction':'Введи несократимую дробь, например 3/4, или целое число.','improper-fraction':'Введи неправильную дробь, например 7/3.','mixed-number':'Введи смешанное число с пробелом: 2 1/3.','integer':'Введи целое число.'}[f]||'Можно ввести 3/4, 0,75 или 2 1/3. Единицы измерения не вводи.';}
function renderProblem(){if(!active)return;if(active.lesson)main.querySelectorAll('.side-list [data-index]').forEach(el=>{el.querySelector('.status').textContent=currentCredit(active.lesson.tasks[Number(el.dataset.index)])&&ts(active.lesson.tasks[Number(el.dataset.index)].id).correct?'✓':'';});boardStepFeedback='';const t=active.task,s=ts(t.id),host=document.getElementById('problem');host.innerHTML=methodNotice(t,s)+earlierWorkHTML(t.id)+'<article class="problem"><div class="task-heading"><h2>'+e(t.title)+'</h2><span class="tag">'+(s.correct?(boardSession?'Решено на уроке':s.independent?'Самостоятельно':'С помощью / после попыток'):'Твоя задача')+'</span></div>'+(t.source?'<p class="source-note">'+e(t.source.type==='textbook'?'Из учебника: '+t.source.reference+', с. '+t.source.page:'Авторская задача по теме учебника')+'</p>':'')+'<div class="prompt">'+fmt(t.prompt)+'</div><div class="row">'+button(s.hint?'Закрыть подсказку':'Хочешь подсказку?','hint','',true)+(t.steps?.length?button(s.guided?'Скрыть разбор':'Разобрать по шагам','guided','',true):'')+'</div>'+(s.hint?'<div class="help"><strong>Подсказка</strong><p>'+fmt(t.hint||'Выдели, что известно и что требуется найти. Вспомни правило из раздела «Коротко о главном».')+'</p></div>':'')+(s.guided?renderSteps(t,s):'')+'<form class="answer-form" id="answer-form"><label for="final-answer">'+fmt(t.finalLabel||(t.kind==='choice'?'Выбери верный ответ на вопрос задачи.':'Чему равен результат? Введи число.'))+'</label>'+(t.kind==='choice'?'<div class="choices" role="group" aria-label="Варианты ответа">'+t.choices.map((v,i)=>'<button type="button" data-action="choice" data-choice="'+i+'" class="'+(s.value===v?'selected':'')+'" aria-pressed="'+(s.value===v)+'">'+fmt(v)+'</button>').join('')+'</div><button type="submit" '+(s.correct?'disabled':'')+'>Проверить ответ</button>':'<p class="small">'+inputNote(t)+'</p><div class="answer-controls"><input id="final-answer" name="final-answer" type="text" inputmode="text" autocomplete="off" spellcheck="false" value="'+e(s.value)+'" '+(s.correct?'readonly':'')+'><button type="submit" '+(s.correct?'disabled':'')+'>Проверить ответ</button></div><div id="answer-preview" class="answer-preview small" aria-live="polite"></div>')+'<div class="feedback '+(s.feedback&&!s.correct?'error':'')+'" role="status">'+e(s.feedback)+'</div></form>'+(s.correct?'<div class="feedback"><strong>'+(boardSession?'Верно. Разобрали на уроке.':s.independent?'Верно, самостоятельно.':'Верно. Теперь закрепи навык на новом примере.')+'</strong><p>'+fmt(t.explanation)+'</p></div>':'')+((t.skills?.length)?'<section class="detour"><h3>С вычислением нужна помощь?</h3><p class="small">Потренируй отдельное действие. Затем вернись к этому же условию и записям.</p><div class="row">'+skillLinks(t.skills)+'</div></section>':'')+'<details '+(s.note?'open':'')+'><summary>Мои записи к задаче</summary><label class="small" for="notebook">Сохраняются вместе с этой задачей</label><textarea id="notebook" placeholder="Запиши свою мысль или промежуточные вычисления">'+e(s.note)+'</textarea></details></article>';
document.getElementById('answer-form').onsubmit=ev=>{ev.preventDefault();checkFinal();};const inp=document.getElementById('final-answer');if(inp){if(boardSession)inp.maxLength=200;inp.oninput=()=>{s.value=boardText(inp,200);save();preview(inp.value);};preview(inp.value);}const notebook=document.getElementById('notebook');if(boardSession)notebook.maxLength=2000;notebook.oninput=ev=>{s.note=boardText(ev.target,2000);save();};host.querySelectorAll('[data-step-input]').forEach(el=>{if(boardSession)el.maxLength=200;el.oninput=()=>{s.values[Number(el.dataset.stepInput)]=boardText(el,200);save();};});host.querySelectorAll('[data-step-form]').forEach(el=>{el.onsubmit=ev=>{ev.preventDefault();checkStep(Number(el.dataset.stepForm));};});taskHelp?.sync();}
function preview(value){const p=document.getElementById('answer-preview');if(!p)return;const r=M.parse(value);p.innerHTML=value.trim()?(r?'Ты ввёл: '+fmt(displayValue(value)):'Формат пока не распознан. Примеры: 0,5 · 1/2 · 2 1/3') : '';}
function renderSteps(t,s){
 let html='<section class="steps"><p class="small">Каждый завершённый шаг остаётся видимым. Разбор считается помощью.</p>';
 for(let i=0;i<Math.min(t.steps.length,s.step+1);i++){
  const q=t.steps[i],done=i<s.step;
  const control=q.kind==='choice'?'<div class="choices step-choices" role="group" aria-label="Запись для шага '+(i+1)+'">'+q.choices.map((v,j)=>'<button type="button" data-action="step-choice" data-step="'+i+'" data-choice="'+j+'" class="'+(s.values[i]===v?'selected':'')+'" aria-pressed="'+(s.values[i]===v)+'">'+fmt(v)+'</button>').join('')+'</div><button>Проверить шаг</button>':'<div class="answer-controls"><input aria-label="Ответ к шагу '+(i+1)+'" data-step-input="'+i+'" type="text" autocomplete="off" value="'+e(s.values[i]||'')+'"><button>Проверить шаг</button></div>';
  html+='<div class="step '+(done?'completed':'')+'"><span class="step-label">Шаг '+(i+1)+(done?' · готово':'')+'</span><h3>'+fmt(q.prompt)+'</h3>'+(done?'<div class="recorded">Твоя запись: '+fmt(displayValue(s.values[i]))+' ✓</div><p>'+fmt(q.explanation||'')+'</p>':'<form data-step-form="'+i+'"><p class="small">'+inputNote(q)+'</p>'+control+'</form><div class="row">'+button(s.stepHints[i]?'Скрыть подсказку':'Подсказка к этому шагу','step-hint','data-step="'+i+'"',true)+(s.stepHints[i]?button('Показать этот шаг','reveal','data-step="'+i+'"',true):'')+'</div>'+(s.stepHints[i]?'<div class="help">'+fmt(q.hint||q.explanation)+'</div>':'')+(s.reveals[i]?'<div class="help">'+fmt(q.explanation||'Выполни указанное действие.')+'<p>Результат шага: '+fmt(displayValue(q.answer,q.answerFormat))+'. Выбери или введи его и проверь.</p></div>':'')+'<div id="step-feedback-'+i+'" class="feedback error" role="status"></div>')+'</div>';
 }
 if(s.step>=t.steps.length)html+='<p class="feedback">Все шаги готовы. Теперь ответь на вопрос исходной задачи ниже.</p>';
 return html+'</section>';
}
function check(user,q){return q.kind==='choice'?user===q.answer:M.check?M.check(user,q.answer,q.answerFormat):M.equal(user,q.answer);}
function checkFinal(){const t=active.task,s=ts(t.id);if(s.correct)return;if(!s.value.trim()){s.feedback=t.kind==='choice'?'Сначала выбери ответ.':'Сначала введи результат.';renderProblem();return;}s.attempts++;if(check(s.value,t)){s.correct=true;s.independent=!boardSession&&!s.assisted&&!s.repeated&&s.attempts===1;s.completion={attempts:s.attempts,assisted:s.assisted,independent:s.independent};s.feedback='';}else{s.feedback='Пока не совпало. '+(t.kind==='choice'?'Проверь смысл каждого варианта.':t.answerFormat?'Проверь вычисление и требуемую запись ответа.':'Проверь действие и вычисление. Можно открыть подсказку или отдельную тренировку.');}save();renderProblem();}
function checkStep(i){const t=active.task,s=ts(t.id),q=t.steps[i];if(i!==s.step)return;const v=s.values[i]||'';if(!v.trim()){boardStepFeedback='empty';document.getElementById('step-feedback-'+i).textContent='Сначала введи результат этого шага.';return;}if(check(v,q)){s.step++;save();renderProblem();}else{boardStepFeedback='wrong';document.getElementById('step-feedback-'+i).textContent='Проверь вычисление в этом шаге. Подсказка поможет выбрать действие.';}}
function progress(){if(boardSession)return boardProgress();const lessonRows=D.lessons.map(l=>'<tr><td><a href="#lesson/'+l.id+'">'+e(l.title)+'</a></td><td>'+independent(l)+'</td><td>'+(count(l)-independent(l))+'</td><td>'+l.tasks.length+'</td></tr>').join(''),pr=Object.entries(state.tasks).filter(([id,s])=>id.startsWith('practice:')&&s.correct&&currentCredit(resolveTask(id)));main.innerHTML='<p class="eyebrow">Мои результаты</p><h1>Виден каждый шаг</h1><p class="lead">Самостоятельно — с первой попытки, без открытого разбора и подсказок. Решение с помощью тоже полезно: оно учитывается отдельно.</p>'+legacySummaryHTML()+'<div class="panel table-scroll" role="region" aria-label="Результаты по темам" tabindex="0"><table class="progress-table"><thead><tr><th>Тема</th><th>Сам</th><th>С помощью / после попыток</th><th>Всего задач</th></tr></thead><tbody>'+lessonRows+'</tbody></table></div><h2>Отдельные тренировки</h2><p>Решено '+pr.length+' примеров, из них '+pr.filter(([,s])=>s.independent).length+' самостоятельно.</p><div class="grid">'+M.skills.map(sk=>{const list=pr.filter(([id])=>id.split(':')[1]===sk.id);return list.length?'<div class="panel"><h3>'+e(sk.title)+'</h3><p>'+list.filter(([,s])=>s.independent).length+' самостоятельно · '+list.filter(([,s])=>!s.independent).length+' с помощью / после попыток</p><a href="#practice/'+sk.id+'/1">Продолжить</a></div>':'';}).join('')+'</div><div class="panel"><h2>Сохранить свою работу</h2><p>Результаты и черновики находятся в этом браузере. Скачай резервную копию, чтобы перенести их на другое устройство.</p><div class="row">'+button('Скачать сохранение','export')+'<label class="button quiet" for="import-file">Открыть сохранение<input class="sr-only" id="import-file" type="file" accept="application/json,.json"></label></div><p id="import-status" role="status" class="small"></p></div>';document.getElementById('import-file').onchange=importState;}
function download(){const blob=new Blob([JSON.stringify({course:'peterson6-part1',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Peterson6-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importState(ev){const file=ev.target.files[0],status=document.getElementById('import-status');if(!file)return;try{if(file.size>5000000)throw Error('Файл слишком большой.');const data=JSON.parse(await file.text());if(data.course!=='peterson6-part1')throw Error('Это не сохранение данного курса.');const incoming=sanitizeState(data.state);for(const [id,s]of Object.entries(incoming.tasks)){const current=state.tasks[id];if(current&&(current.methodVersion||1)!==(s.methodVersion||1)){if(!hasPreviousWork(current))state.tasks[id]=s;else{archiveTask(id,s);if(hadHelpOrAnswer(s))markAssisted(current);}continue;}if(!current||!hasPreviousWork(current))state.tasks[id]=s;else if(!current.correct&&s.correct){archiveTask(id,current);state.tasks[id]=s;}else if(hasPreviousWork(s)&&JSON.stringify(current)!==JSON.stringify(s))archiveTask(id,s);}for(const [id,entries]of Object.entries(incoming.history||{}))for(const item of entries)archiveTask(id,item);for(const [key,p]of Object.entries(incoming.practice))state.practice[key]={seed:Math.max(p.seed,state.practice[key]?.seed||1)};state=sanitizeState(state);save();progress();document.getElementById('import-status').textContent='Сохранения объединены. Текущие заполненные черновики сохранены.';}catch(err){status.textContent='Не удалось открыть: '+err.message;}}
function savedSignatures(excludeId){const signatures=new Set();for(const [id,r]of Object.entries(state.tasks))if(id!==excludeId&&r.signature)signatures.add(r.signature);for(const [id,rows]of Object.entries(state.history||{}))if(id!==excludeId)for(const r of rows)if(r.signature)signatures.add(r.signature);return signatures;}
function newPractice(){const used=savedSignatures();let seed=state.practice[active.key].seed;for(let i=0;i<1000&&seed<999999;i++){seed++;const task=M.generate(active.skill,seed,active.level);if(!used.has(taskSignature(task))){state.practice[active.key].seed=seed;save();practiceView(active.skill,active.level);return;}}ts(active.task.id).feedback='В этой подборке пока не нашёлся новый пример. Выбери другую сложность или другой навык.';renderProblem();}

function openDetour(id){if(!skills[id])return;if(active&&!active.practice){state.origin={hash:'#lesson/'+active.lesson.id+'/'+active.index,scroll:window.scrollY};markAssisted(ts(active.task.id));save();}go('#practice/'+id+'/1');}
document.addEventListener('click',ev=>{if(ev.target.closest('a.skip')){ev.preventDefault();main.focus();return;}const b=ev.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;
 if(action==='detour'){openDetour(b.dataset.skill);return;}
 if(action==='return'){const origin=state.origin;state.origin=null;save();if(origin){go(origin.hash);requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,origin.scroll||0)));}else go('#home');return;}
 if(action==='saved-practice'){ev.preventDefault();if(boardSession)return;const id=b.dataset.task,m=/^practice:([a-z-]+):([123]):(\d+)$/.exec(id||'');if(m&&resolveTask(id)&&(state.tasks[id]||state.history[id])){state.practice[m[1]+':'+m[2]]={seed:Number(m[3])};save();go('#practice/'+m[1]+'/'+m[2]);}return;}
 if(action==='export'){download();return;}
 if(action==='current-method'){startCurrentMethod();return;}
 if(!active)return;const s=ts(active.task.id);
 if(action==='task'){go('#lesson/'+active.lesson.id+'/'+b.dataset.index);return;}
 if(action==='new'){newPractice();return;}
 if(action==='step-choice'){const i=Number(b.dataset.step),q=active.task.steps[i];if(i!==s.step||q?.kind!=='choice')return;const value=q.choices[Number(b.dataset.choice)];if(value===undefined)return;s.values[i]=value;}
 if(action==='choice'){if(s.correct)return;s.value=active.task.choices[Number(b.dataset.choice)];s.feedback='';}
 if(action==='hint'){s.hint=!s.hint;markAssisted(s);}
 if(action==='guided'){s.guided=!s.guided;markAssisted(s);}
 if(action==='step-hint'){const i=Number(b.dataset.step);s.stepHints[i]=!s.stepHints[i];markAssisted(s);}
 if(action==='reveal'){s.reveals[Number(b.dataset.step)]=true;markAssisted(s);}
 save();renderProblem();
});
function route(){if(boardSession&&!boardSession.validRoute(location.hash))window.history.replaceState(null,'',location.pathname+location.search+'#home');boardNumber={draft:'',submitted:null};boardStepFeedback='';if(typeof cleanup==='function')cleanup();cleanup=null;active=null;const parts=location.hash.replace(/^#/,'').split('/');document.querySelectorAll('nav a').forEach(a=>a.removeAttribute('aria-current'));try{if(parts[0]==='lesson')lessonView(parts[1],parts[2]);else if(parts[0]==='practice')practiceView(parts[1],parts[2]);else if(parts[0]==='skills')skillPage();else if(parts[0]==='progress')progress();else home();const nav=parts[0]==='practice'||parts[0]==='skills'?'skills':parts[0]==='progress'?'progress':'home';document.querySelector('nav a[href="#'+nav+'"]').setAttribute('aria-current','page');}catch(err){main.innerHTML='<div class="error-page"><h1>Не удалось открыть занятие</h1><p>Сохранённые ответы остаются в браузере. Обнови страницу или вернись к курсу.</p><a class="button" href="#home">К началу</a></div>';console.error(err);}renderedBoardRoute=location.hash;window.scrollTo(0,0);}

function boardProgress(){
 const rows=D.lessons.map(l=>'<tr><td><a href="#lesson/'+l.id+'">'+e(l.title)+'</a></td><td>'+count(l)+'</td><td>'+l.tasks.length+'</td></tr>').join('');
 const practiced=Object.entries(state.tasks).filter(([id,s])=>id.startsWith('practice:')&&s.correct).length;
 main.innerHTML='<p class="eyebrow">Совместный урок</p><h1>Работа на доске</h1><p class="lead">Здесь виден общий разбор. Он не изменяет личные результаты ученика. Для самостоятельной работы открой курс из своего кабинета.</p><div class="panel table-scroll"><table class="progress-table"><thead><tr><th>Тема</th><th>Разобрано</th><th>Всего задач</th></tr></thead><tbody>'+rows+'</tbody></table></div><p>Решено тренировочных примеров на уроке: '+practiced+'.</p><a class="button" href="#home">Вернуться к темам</a>';
}
function getBoardState(){if(renderedBoardRoute!==location.hash)route();return {
 route:location.hash,work:boardSession.pack(state),
 view:{model:cleanup?.getBoardState?.()||null,details:boardSession.readDetails(main),stepFeedback:boardStepFeedback,number:{...boardNumber}}
};}
function applyBoardState(value){
 if(!boardSession.validateState(value))throw new TypeError('Invalid Peterson board state');
 const incoming=boardSession.unpack(value.work);
 clearTimeout(boardNotifyTimer);applyingBoardState=true;
 try{
  state=incoming;window.history.replaceState(null,'',location.pathname+location.search+value.route);route();
  if(value.view.model!==null)cleanup.applyBoardState(value.view.model);
  boardNumber={...value.view.number};
  const numberInput=document.getElementById('exercise-number');
  if(numberInput){numberInput.value=boardNumber.draft;if(boardNumber.submitted!==null)findNumber(boardNumber.submitted==='invalid'?NaN:boardNumber.submitted);}
  boardStepFeedback=value.view.stepFeedback;
  if(boardStepFeedback&&active){const el=document.getElementById('step-feedback-'+ts(active.task.id).step);if(el)el.textContent=boardStepFeedback==='empty'?'Сначала введи результат этого шага.':'Проверь вычисление в этом шаге. Подсказка поможет выбрать действие.';}
  boardSession.applyDetails(main,value.view.details);
  lastBoardSnapshot=JSON.parse(JSON.stringify(value));
 }finally{applyingBoardState=false;}
}
function checkedBoardState(){
 let value;
 try{value=getBoardState();if(!boardSession.validateState(value))throw new TypeError('Invalid local shared state');}
 catch(error){
  if(!lastBoardSnapshot)throw error;
  applyBoardState(lastBoardSnapshot);
  warn('Не удалось передать последнее изменение на доску. Восстановлена предыдущая общая работа. Если запись длинная, сократи её или продолжи в новой комнате.');
  value=getBoardState();
 }
 lastBoardSnapshot=JSON.parse(JSON.stringify(value));return value;
}
function connectBoard(){
 const api={getState:checkedBoardState,applyState:applyBoardState,validateState:boardSession.validateState};
 window.__peterson6Board=Object.freeze(api);
 checkedBoardState();
 const schedule=()=>{if(applyingBoardState)return;clearTimeout(boardNotifyTimer);boardNotifyTimer=setTimeout(()=>{if(!applyingBoardState){checkedBoardState();boardNotify();}},0);};
 window.MathExamBoard.register({id:boardAdapter.id,version:'1.1.0',stateSchemaVersion:1,parentOrigin:location.origin,getState:checkedBoardState,applyState:applyBoardState,subscribe(notify){
  boardNotify=notify;const events=['click','input','change','submit','toggle','keydown'];events.forEach(name=>document.addEventListener(name,schedule,true));window.addEventListener('hashchange',schedule);
  return ()=>{clearTimeout(boardNotifyTimer);events.forEach(name=>document.removeEventListener(name,schedule,true));window.removeEventListener('hashchange',schedule);boardNotify=()=>{};};
 }});
}

window.addEventListener('hashchange',()=>{if(!boardSession||renderedBoardRoute!==location.hash)route();});route();if(boardSession)connectBoard();
window.PetersonApp={getState:()=>JSON.parse(JSON.stringify(state)),format:fmt,route,validateState:sanitizeState,displayValue,resolveTask};
})();
