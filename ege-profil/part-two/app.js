(function(root){
'use strict';
const lessons=(root.ProfilePartTwoLessons||[]).slice().sort((a,b)=>a.exam-b.exam);
const titles={14:'Уравнения и отбор корней',15:'Стереометрия с доказательством',16:'Неравенства',17:'Моделирование и оптимизация',18:'Планиметрия с доказательством',19:'Задачи с параметром',20:'Числа и их свойства'};
const main=document.getElementById('main'),banner=document.getElementById('save-warning'),API=root.ProfilePartTwoState;
const byLesson=new Map(lessons.map(l=>[l.id,l])),byTask=new Map();
lessons.forEach(lesson=>lesson.tasks.forEach((task,index)=>byTask.set(task.id,{lesson,task,index})));
let storage;try{storage=root.localStorage;}catch(_){}
const store=API.create(storage,{locks:root.navigator?.locks,validate:(v,id)=>{const task=byTask.get(id)?.task;return !!task&&v.solvedSteps.length<=task.steps.length&&v.drafts.steps.length<=task.steps.length&&v.drafts.final.length<=task.final.length&&v.solutionSteps<=task.solution.length;},onWarning:text=>{banner.hidden=false;banner.textContent=text;}});
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const taskURL=(id,mode)=>'#task/'+encodeURIComponent(id)+'/'+mode;
const modeFor=index=>index>=3?'independent':'guided';
const modeLabels={guided:'С опорой по шагам',plan:'С коротким планом',independent:'Самостоятельно'};
const check=(answers,value)=>API.matches(answers,value,root.ProfileCheck);
const parameterGraphs={
 'param-modules':{
  preset:'plateau',title:'Горизонтальный участок',
  question:'Когда горизонталь пересекает две ветви, а когда совпадает с целым отрезком?'
 },
 'param-hole':{
  preset:'hole',title:'Выколотая точка',
  question:'Почему пересечение может исчезнуть при одном уровне горизонтали?'
 }
};
let routeVersion=0,active=null,labCleanup=null;
function graphURL(graph,target,help=''){
 const url=new URL(root.ProfileAlphabetCatalog.href('function-atlas','',19,target),root.location.origin);
 url.searchParams.set('graph',graph.preset);
 if(help)url.searchParams.set('help',help);
 return url.pathname+url.search+url.hash;
}
function parameterGraphRoutes(){
 const cards=Object.entries(parameterGraphs).map(([lessonId,graph])=>{
  const lesson=byLesson.get(lessonId);
  if(!lesson)return '';
  const available=lesson.tasks.slice(3).map(task=>({task,record:store.read(task.id)}))
   .filter(({record})=>!record.completed&&!record.helped);
  const draft=available.filter(({record})=>record.attemptCount||record.drafts.proof.trim()||record.drafts.final.some(value=>value.trim()))
   .sort((a,b)=>b.record.updatedAt-a.record.updatedAt)[0];
  const next=draft??available[0];
  const target=next?taskURL(next.task.id,'independent'):'#lesson/'+lessonId;
  const label=draft?'Продолжить условие':next?'Решить новое условие':'Открыть условия для повторения';
  const back=root.location.pathname+root.location.search+target;
  return `<article class="card"><h3>${graph.title}</h3><p>${graph.question}</p><div class="actions"><a class="button" href="${esc(graphURL(graph,back))}">Исследовать график</a><a class="button quiet" href="${target}">${label}</a></div></article>`;
 }).join('');
 return `<section id="parameter-graphs" class="panel" aria-labelledby="parameter-graphs-title"><h2 id="parameter-graphs-title">От графика к задаче №19</h2><div class="grid">${cards}</div></section>`;
}
function mountSkills(number,lesson){
 if(!root.ProfileSkillMap||root.self!==root.top)return;
 let target=main.querySelector('.modes');
 if(!target){
  target=document.createElement('div');main.querySelector('h1').after(target);
 }
 root.ProfileSkillMap.mount(target,[number],{
  lesson:lesson&&{title:lesson.title,skill:lesson.goal},
  beforeLeave:async()=>{if(active)await store.patch(active.item.task.id,r=>{if(!r.completed)r.helped=true;});await store.flush();}
 });
}
function correctedWithoutHelp(record){return record.independent&&record.attempts.find(a=>a.kind==='final')?.correct===false;}
function status(task,record){if(record.independent)return `<span class="tag ok">${correctedWithoutHelp(record)?'Исправлено без подсказки':'Ответы самостоятельно'}</span>`;if(record.completed)return '<span class="tag help">Ответы с опорой</span>';if(record.attemptCount||record.drafts.proof||record.drafts.openFinal?.trim()||record.drafts.final.some(Boolean)||record.solvedSteps.length)return '<span class="tag">Продолжить работу</span>';return '<span class="tag">Можно начать</span>';}
function stats(items){const out={total:0,completed:0,independent:0,helped:0,pending:0};items.forEach(l=>l.tasks.forEach(task=>{const r=store.read(task.id);out.total++;if(r.completed)out.completed++;if(r.independent)out.independent++;else if(r.completed)out.helped++;if(r.completed&&task.proof)out.pending++;}));return out;}
function badges(s){return `<div class="stats"><span class="tag">${s.total} условий</span><span class="tag ok">Самостоятельные ответы: ${s.independent}</span><span class="tag help">С опорой: ${s.helped}</span></div>`;}
function resume(items=lessons){let best=null;for(const lesson of items)for(let index=0;index<lesson.tasks.length;index++){const task=lesson.tasks[index],r=store.read(task.id);if(r.updatedAt&&!r.completed&&(!best||r.updatedAt>best.r.updatedAt))best={lesson,task,index,r};}return best;}
function home(){
 const s=stats(lessons),last=resume();
 main.innerHTML=`<p class="eyebrow">Профильный ЕГЭ · проект 2027</p><h1>Вторая часть: от метода до обоснования</h1><p class="lead">Все семь номеров №14–20. Выберите тему: три условия с опорой, затем три других условия для самостоятельной проверки. Сохраняются ответы, первая попытка и ваше обоснование.</p>${badges(s)}${last?`<a class="button" href="${taskURL(last.task.id,last.r.helped&&!last.r.drafts.openFinal?.trim()?'guided':modeFor(last.index))}">Продолжить: ${esc(last.lesson.title)}</a>`:''}<div class="grid">${Object.keys(titles).map(number=>{const group=lessons.filter(l=>l.exam===Number(number)),g=stats(group);return `<section class="card"><h2><span class="number">${number}</span>${titles[number]}</h2><p>${group.length} тем · ${g.total} условий</p><p class="caption">Самостоятельные ответы: ${g.independent}; с опорой: ${g.helped}.</p><a class="button" href="#exam/${number}">Открыть №${number}</a></section>`;}).join('')}</div><aside class="panel"><h2>Как оценивать результат</h2><p>Верный числовой ответ ещё не означает полное решение второй части. Запишите ход рассуждений и проверьте его по критериям. Доказательство остаётся на проверку преподавателю.</p><p>После подсказки условие отмечается как работа с опорой. Для новой самостоятельной проверки откройте другое условие.</p><a href="/ege-profil/start/#calm">Первая часть №1–13 и школьные основы →</a></aside>`;
}
function exam(number){
 const group=lessons.filter(l=>l.exam===number);if(!group.length)return missing();const s=stats(group),last=resume(group);
 main.innerHTML=`<a class="back" href="#map">← Все номера второй части</a><p class="eyebrow">Проект ЕГЭ 2027 · №${number}</p><h1>${titles[number]}</h1>${badges(s)}${number===20&&root.self===root.top?`<p><a class="button quiet" href="/trainers/ege-methods.html">Оценка плюс пример</a></p>`:''}${last?`<p><a class="button" href="${taskURL(last.task.id,last.r.helped&&!last.r.drafts.openFinal?.trim()?'guided':modeFor(last.index))}">Продолжить сохранённое условие</a></p>`:''}<div class="grid">${group.map((lesson,i)=>`<section class="card"><span class="eyebrow">Тема ${i+1} из ${group.length}</span><h2>${esc(lesson.title)}</h2><p>${esc(lesson.goal)}</p><p class="caption">${lesson.tasks.length} условий · ${stats([lesson]).independent} самостоятельных ответов</p><a class="button" href="#lesson/${lesson.id}">Начать или продолжить</a></section>`).join('')}</div><section class="panel"><h2>Проверка без подсказок</h2><p>Выберите по одному новому условию каждой темы. Сначала сами определите способ решения. После проверки вернитесь к темам, где понадобилась помощь.</p><div class="actions">${group.map(l=>{const unseen=l.tasks.slice(3).find(t=>{const r=store.read(t.id);return !r.completed&&!r.helped;})||l.tasks[3];return `<a class="button quiet" href="${taskURL(unseen.id,'independent')}">${esc(l.title)}</a>`;}).join('')}</div></section>`;
 mountSkills(number);
 const catalog=root.ProfileAlphabetCatalog;
 const learningRoutes=catalog?.forNumber(number).filter(topic=>topic.route)??[];
 if(root.self===root.top&&learningRoutes.length){
  const nav=document.createElement('nav');
  nav.className='actions';
  nav.setAttribute('aria-label','Подготовка к задачам №'+number);
  for(const topic of learningRoutes){
   const link=document.createElement('a');
   link.className='button quiet';
   link.href=catalog.href(topic.id,'',number,root.location.pathname+root.location.hash);
   link.textContent=topic.title;
   nav.append(link);
  }
  main.querySelector('.stats').after(nav);
 }
 if(number===19&&catalog&&root.self===root.top)main.querySelector('.stats').insertAdjacentHTML('afterend',parameterGraphRoutes());
}
function prerequisites(lesson){return lesson.prerequisites?.length?`<details class="prerequisites"><summary>Вспомнить основу и прежние материалы</summary><ul>${lesson.prerequisites.map(p=>`<li><a href="${esc(p.href)}">${esc(p.title)}</a></li>`).join('')}</ul><p class="caption">Черновик сохранится. Вернитесь кнопкой браузера, чтобы продолжить это условие.</p></details>`:'';}
function lessonView(lesson){
 const index=lessons.indexOf(lesson),next=lessons[index+1];
 main.innerHTML=`<a class="back" href="#exam/${lesson.exam}">← Все темы №${lesson.exam}</a><p class="eyebrow">№${lesson.exam} · учебная тема</p><h1>${esc(lesson.title)}</h1><p class="lead">${esc(lesson.goal)}</p><div class="panel"><h2>Начать с задачи</h2><p>Попробуйте первый шаг сами; объяснение и помощь можно открыть рядом с условием.</p><div class="actions"><a class="button" href="${taskURL(lesson.tasks[0].id,'guided')}">Первое условие по шагам</a><a class="button quiet" href="${taskURL(lesson.tasks[3].id,'independent')}">Проверить себя</a></div></div><details><summary>Короткая теория и выбор метода</summary><div class="panel">${lesson.theory.map(p=>`<p>${p}</p>`).join('')}</div></details>${prerequisites(lesson)}<details id="model-lab"><summary>Исследование на модели · не зачёт</summary><div id="model-lab-content" class="panel"></div></details><h2>Сначала — разобраться</h2><div class="task-grid">${lesson.tasks.slice(0,3).map((task,i)=>taskCard(task,i,'guided')).join('')}</div><h2>Затем — другое условие самостоятельно</h2><p class="caption">Это отдельные условия. Если открыть подсказку или разбор, результат будет отмечен как работа с опорой.</p><div class="task-grid">${lesson.tasks.slice(3).map((task,i)=>taskCard(task,i+3,'independent')).join('')}</div>${next?`<p class="next"><a href="#lesson/${next.id}">Следующая тема: ${esc(next.title)} →</a></p>`:''}`;
 mountSkills(lesson.exam,lesson);
 const lab=document.getElementById('model-lab');if(!root.ProfilePartTwoLabs)lab.hidden=true;else lab.addEventListener('toggle',()=>{if(lab.open&&!labCleanup)labCleanup=root.ProfilePartTwoLabs.mount(document.getElementById('model-lab-content'),lesson.exam,{storage});});
}
function taskCard(task,i,mode){return `<a class="task-link" href="${taskURL(task.id,mode)}"><strong>Условие ${i+1}</strong><small>${i<3?'Учимся решать':'Проверяем себя'}</small>${status(task,store.read(task.id))}</a>`;}
function feedback(text,kind=''){const box=document.getElementById('feedback');if(box){box.className='feedback '+kind;box.hidden=false;box.textContent=text;}}
function bind(id,event,fn){document.getElementById(id)?.addEventListener(event,fn);}
function recentTrace(r){if(!r.attempts.length)return '';const first=r.attempts[0],last=r.attempts[r.attempts.length-1];return `<details class="history"><summary>Первая попытка и последнее исправление</summary><dl><dt>Первая отправка</dt><dd>${esc(first.answers.join('; '))} · ${first.correct?'верно':'нужна проверка'} · ${first.helped?'с опорой':'без подсказки'}</dd><dt>Последняя отправка</dt><dd>${esc(last.answers.join('; '))} · ${last.correct?'верно':'нужна проверка'} · ${last.helped?'с опорой':'без подсказки'}</dd></dl><p>Отправок: ${r.attemptCount}. Сохраняются первая и последние 59 отправок этого условия.</p></details>`;}
function proofView(task,r){if(!task.proof)return '';return `<section class="panel"><h2>Ваше обоснование</h2><p>${task.proof.prompt}</p><label class="field"><span>Запишите ход решения</span><textarea id="proof-draft" maxlength="12000" placeholder="Почему выбранный способ работает? Какие ограничения проверены?">${esc(r.drafts.proof)}</textarea></label><details class="proof-criteria"><summary>Критерии самопроверки</summary><div class="checklist">${task.proof.criteria.map((c,i)=>`<label><input type="checkbox" data-proof-check="${i}" ${r.proofChecks.includes(i)?'checked':''}><span>${c}</span></label>`).join('')}</div></details><p class="proof-status"><strong>Обоснование требует проверки.</strong> Галочки — ваша самопроверка; они не подтверждают правильность доказательства автоматически.</p></section>`;}
function completion(item,r,mode){
 if(!r.completed)return '';
 const {lesson,task,index}=item;
 const nextIndependent=lesson.tasks.slice(3).find(t=>{const a=store.read(t.id);return t.id!==task.id&&!a.completed&&!a.helped;});
 const nextTask=lesson.tasks[index+1],nextLesson=lessons[lessons.indexOf(lesson)+1];
 const offerFresh=mode!=='independent'||r.helped;
 const nextLink=nextIndependent&&offerFresh?`<a class="button" href="${taskURL(nextIndependent.id,'independent')}">Другое условие самостоятельно →</a>`:
  nextTask?`<a class="button" href="${taskURL(nextTask.id,modeFor(index+1))}">Следующее условие →</a>`:
  nextLesson?`<a class="button" href="#lesson/${nextLesson.id}">Следующая тема →</a>`:'';
 return `<section class="panel complete" id="completion"><h2>Ответы приняты</h2><p>${correctedWithoutHelp(r)?'Ответ исправлен самостоятельно после первой попытки.':r.independent?'Вычислительная часть решена самостоятельно.':'Это работа с опорой или повтор учебного условия.'}${task.proof?' Письменное обоснование требует проверки.':''}</p><div class="actions">${nextLink}<a class="button quiet" href="#exam/${lesson.exam}">Все темы №${lesson.exam}</a></div>${!nextIndependent?'<p class="caption">Новые самостоятельные условия этой темы закончились. Повтор знакомого условия не увеличивает счётчик.</p>':''}</section>`;
}
function guidedView(task,r){const stepIndex=r.solvedSteps.length,step=task.steps[stepIndex];return `<section class="panel"><h2>Решение по шагам</h2>${r.solvedSteps.length?`<ol class="steps">${r.solvedSteps.map(i=>`<li class="step-done">${task.steps[i].prompt}<br><strong>${task.steps[i].explanation}</strong></li>`).join('')}</ol>`:''}${step?`<form id="step-form"><p class="eyebrow">Шаг ${stepIndex+1} из ${task.steps.length}</p><label class="field"><span>${step.prompt}</span><input id="step-answer" type="text" maxlength="500" autocomplete="off" value="${esc(r.drafts.steps[stepIndex]||'')}"></label><div class="actions"><button type="submit">Проверить шаг</button><button type="button" id="step-hint" class="quiet">Нужна подсказка</button></div></form>${r.hints.includes(stepIndex)?`<p class="hint">${step.hint}</p>`:''}`:'<p class="feedback ok">Шаги пройдены. Теперь соберите итоговые ответы ниже.</p>'}</section>`;}
async function taskView(item,mode,viewVersion=routeVersion){
 if(viewVersion!==routeVersion)return;
 const {lesson,task,index}=item;active={item,mode};
 if(mode!=='independent')await store.patch(task.id,r=>{r.helped=true;});
 if(viewVersion!==routeVersion)return;
 const isCurrent=()=>viewVersion===routeVersion&&active?.item.task.id===task.id&&active.mode===mode;
 const r=store.read(task.id),displayedStep=r.solvedSteps.length,independentEligible=index>=3;
 const openFinal=mode==='independent'&&independentEligible&&typeof API.openAnswer==='function'?task.independentFinal:null;
 const finalFields=openFinal?[openFinal]:task.final;
 const finalDraft=openFinal?[r.drafts.openFinal]:r.drafts.final;
 const earlierDraft=openFinal&&r.drafts.final.some(value=>value.trim())?
  `<details class="earlier-final"><summary>Ответы из пошаговой формы</summary>${task.final.map((field,i)=>r.drafts.final[i]?`<p>${esc(field.label)}: ${esc(r.drafts.final[i])}</p>`:'').join('')}</details>`:'';
 const parameterCondition=Object.hasOwn(parameterGraphs,lesson.id);
 const graph=mode==='independent'&&independentEligible&&root.ProfileAlphabetCatalog&&root.self===root.top?parameterGraphs[lesson.id]:null;
 const wrongFinal=attempt=>attempt.kind==='final'&&!attempt.correct;
 function offerGraph(record){
  if(!graph||record.completed||record.attempts.filter(wrongFinal).length<2||document.getElementById('parameter-graph-help'))return;
  const actions=document.createElement('div');
  actions.className='actions';
  const button=document.createElement('button');
  button.id='parameter-graph-help';
  button.type='button';
  button.className='quiet';
  button.textContent='Посмотреть подсказку на графике';
  button.addEventListener('click',async()=>{
   button.disabled=true;
   const last=store.read(task.id).attempts.findLast(wrongFinal);
   const fields=task.final.flatMap((field,i)=>check(field.answers,last?.answers[i]??'')?[]:[i+1]);
   const href=graphURL(graph,root.location.pathname+root.location.search+root.location.hash,fields.join('')||'12');
   await store.patch(task.id,s=>{if(!s.completed)s.helped=true;});
   await store.flush();
   if(isCurrent())root.location.assign(href);
  });
  actions.append(button);
  document.getElementById('feedback').after(actions);
 }
 main.innerHTML=`<a class="back" href="#lesson/${lesson.id}">← ${esc(lesson.title)}</a><p class="eyebrow">№${lesson.exam} · условие ${index+1} из ${lesson.tasks.length}</p><h1>${esc(lesson.title)}</h1><nav class="modes" aria-label="Способ работы">${Object.entries(modeLabels).map(([key,label])=>`<a href="${taskURL(task.id,key)}" ${mode===key?'aria-current="page"':''}>${label}</a>`).join('')}</nav>${mode==='independent'&&(r.helped||!independentEligible)?'<p class="hint">Это знакомое учебное условие или условие с уже открытой помощью. Его повтор не считается новой самостоятельной проверкой.</p>':''}<div class="task-layout"><section class="panel condition"><h2>Условие</h2><div>${openFinal?.prompt||task.prompt}</div>${task.diagram?`<div class="diagram">${task.diagram}</div>`:''}${task.diagram?'<p class="caption">Рисунок относится к этому условию. Для доказательства используйте данные и свойства, а не измерения по экрану.</p>':''}</section><div class="work">${mode==='guided'?guidedView(task,r):mode==='plan'?`<section class="panel"><h2>План решения</h2><ol class="steps">${task.steps.map(s=>`<li>${s.prompt}</li>`).join('')}</ol><p class="caption">План — опора. Для самостоятельного зачёта затем откройте другое условие.</p></section>`:''}<section class="panel"><h2>Итоговые ответы</h2><form id="final-form">${finalFields.map((field,i)=>`<label class="field"><span>${field.label}</span><input id="final-${i}" data-final="${i}" type="text" maxlength="500" autocomplete="off" value="${esc(finalDraft[i]||'')}"></label>`).join('')}<p class="caption">${openFinal?esc(openFinal.format):'Можно вводить дроби, π и корни: 3/4, π/6, sqrt(2). Ограничения и формат ответа указаны у поля.'}</p><button type="submit">${openFinal?'Проверить ответ':'Проверить ответы'}</button></form>${earlierDraft}<div id="feedback" class="feedback" role="status" hidden></div><div class="actions"><button type="button" id="request-help" class="quiet">Хочу подсказку</button><button type="button" id="show-solution" class="quiet">Открыть разбор</button></div>${r.hints.includes(99)?`<p class="hint">${task.steps[0]?.hint||lesson.goal}</p>`:''}${r.solution?`<div class="hint"><h3>Разбор с опорой</h3><ol class="solution-list">${task.solution.slice(0,r.solutionSteps).map(p=>`<li>${p}</li>`).join('')}</ol>${r.solutionSteps<task.solution.length?'<button type="button" id="solution-next" class="quiet">Следующий шаг разбора</button>':''}</div>`:''}${recentTrace(r)}</section></div></div>${proofView(openFinal?{...task,proof:{...task.proof,prompt:'Объясните, как нашли все решения и почему других нет.'}}:task,r)}${completion(item,r,mode)}<details class="task-theory"><summary>Теория для этой темы</summary><div class="panel">${lesson.theory.map(p=>`<p>${p}</p>`).join('')}</div></details>${prerequisites(lesson)}<p><a href="#exam/${lesson.exam}">Вернуться к темам №${lesson.exam}</a> · <a href="#map">Все задания второй части</a></p>`;
 if(parameterCondition){
  const layout=main.querySelector('.task-layout'),modes=main.querySelector('.modes');
  layout.querySelector('.work').prepend(modes);
 }
 mountSkills(lesson.exam,lesson);
 offerGraph(r);
 main.querySelectorAll('.modes a').forEach(link=>link.addEventListener('click',event=>{if(link.getAttribute('href')===root.location.hash){event.preventDefault();render();}}));
 document.querySelectorAll('[data-final]').forEach(input=>input.addEventListener('input',()=>{
  const i=Number(input.dataset.final),value=input.value;
  store.patch(task.id,s=>{
   if(openFinal){s.drafts.openFinal=value;return;}
   while(s.drafts.final.length<=i)s.drafts.final.push('');
   s.drafts.final[i]=value;
  });
 }));
 bind('step-answer','input',e=>{const value=e.target.value;store.patch(task.id,s=>{while(s.drafts.steps.length<=displayedStep)s.drafts.steps.push('');s.drafts.steps[displayedStep]=value;});});
 bind('proof-draft','input',e=>{const value=e.target.value;store.patch(task.id,s=>{s.drafts.proof=value;});});
 document.querySelectorAll('[data-proof-check]').forEach(input=>input.addEventListener('change',()=>{const index=Number(input.dataset.proofCheck),checked=input.checked;store.patch(task.id,s=>{s.proofChecks=s.proofChecks.filter(i=>i!==index);if(checked)s.proofChecks.push(index);});}));
 bind('final-form','submit',async event=>{
  event.preventDefault();const fields=finalFields.map((_,i)=>document.getElementById('final-'+i)),values=fields.map(f=>f.value.trim());
  if(store.read(task.id).completed){feedback('Этот ответ уже проверен. Можно перейти к другому условию.','ok');return;}
  if(values.some(v=>!v)){feedback('Заполните каждое поле. Пустое поле не считается ошибкой.','error');fields[values.findIndex(v=>!v)].focus();return;}
  const openResult=openFinal&&API.openAnswer(openFinal,values[0]);
  if(openResult&&!openResult.recognized){
   feedback('Проверьте запись. '+openFinal.format+' Это уточнение формата.','error');
   fields[0].focus();return;
  }
  const results=openResult?[openResult.correct]:finalFields.map((field,i)=>check(field.answers,values[i])),correct=results.every(Boolean);
  const button=event.target.querySelector('button[type="submit"]');
  if(button.disabled)return;
  button.disabled=true;
  let updated;
  try {
   updated=await store.attempt(task.id,{kind:'final',answers:values,correct,mode,independentEligible,openFinal:!!openFinal,onceCompleted:true});
  } finally {button.disabled=false;}
  if(!isCurrent())return;
  if(updated.completed){await taskView(item,mode,viewVersion);if(!isCurrent())return;feedback(task.proof?'Ответы верны. Сохраните обоснование и проверьте его с преподавателем.':'Ответы верны. Можно перейти к другому условию.','ok');document.getElementById('completion')?.scrollIntoView?.({block:'nearest',behavior:'auto'});}
  else{
   fields.forEach((f,i)=>f.setAttribute('aria-invalid',String(!results[i])));
   const wrongFields=results.flatMap((ok,i)=>ok?[]:[i]);
   const guidance='Сверьте ограничения и вычисления.'+(updated.wrong>=2?' Можно открыть подсказку.':'');
   feedback(openResult?openResult.hint:`Проверьте поля ${wrongFields.map(i=>i+1).join(', ')}. ${guidance}`,'error');
   offerGraph(updated);
  }
 });
 bind('step-form','submit',async event=>{
  event.preventDefault();const value=document.getElementById('step-answer').value.trim();if(!value){feedback('Введите ответ на текущий шаг. Пустое поле не считается ошибкой.','error');return;}
  const current=store.read(task.id),i=current.solvedSteps.length;if(i!==displayedStep){feedback('Этот шаг уже изменён в другой вкладке. Ваш ввод сохранён к прежнему шагу. Откройте заново «С опорой по шагам», чтобы увидеть текущий шаг.','error');return;}const step=task.steps[i];if(!step)return;
  const correct=check(step.answers,value);await store.attempt(task.id,{kind:'step-'+i,answers:[value],correct,mode});
  if(correct){await store.patch(task.id,s=>{if(s.solvedSteps.length===i)s.solvedSteps.push(i);});await taskView(item,mode,viewVersion);if(!isCurrent())return;feedback('Шаг верный. Предыдущие шаги остались выше.','ok');document.getElementById('step-answer')?.focus();}
  else if(isCurrent()){
   feedback('Пока не совпало. Проверьте именно этот шаг; условие и предыдущая работа сохранены.','error');
   const catalog=root.ProfileAlphabetCatalog;
   if(catalog&&root.self===root.top&&lesson.exam===16&&i===0&&/^p16-(repeated-root|cancelled-hole)$/.test(lesson.id)){
    const link=document.createElement('a');
    link.className='button quiet';
    link.href=catalog.href('domain','denominator',16,root.location.pathname+root.location.search+root.location.hash);
    link.textContent='Как исключить нули знаменателя';
    link.addEventListener('click',async e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();await store.flush();root.location.assign(link.href);});
    document.getElementById('feedback').append(document.createElement('br'),link);
   }
  }
 });
 bind('step-hint','click',async()=>{await store.patch(task.id,s=>{s.helped=true;const i=s.solvedSteps.length;if(!s.hints.includes(i))s.hints.push(i);});await taskView(item,mode,viewVersion);if(!isCurrent())return;});
 bind('request-help','click',async()=>{await store.patch(task.id,s=>{s.helped=true;if(!s.hints.includes(99))s.hints.push(99);});await taskView(item,mode,viewVersion);if(!isCurrent())return;feedback('Подсказка открыта. Для самостоятельной проверки потом выберите другое условие.');});
 bind('show-solution','click',async()=>{await store.patch(task.id,s=>{s.helped=true;s.solution=true;s.solutionSteps=Math.max(1,s.solutionSteps);});await taskView(item,mode,viewVersion);if(!isCurrent())return;feedback('Разбор открыт; это условие отмечено как работа с опорой.');});
 bind('solution-next','click',async()=>{await store.patch(task.id,s=>{s.helped=true;s.solutionSteps=Math.min(task.solution.length,s.solutionSteps+1);});await taskView(item,mode,viewVersion);});
 main.querySelectorAll('.task-theory,.prerequisites,.proof-criteria,.earlier-final').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)store.patch(task.id,s=>{s.helped=true;});}));
}
function progress(){const s=stats(lessons);main.innerHTML=`<a class="back" href="#map">← Все номера второй части</a><h1>Мой прогресс</h1>${badges(s)}<p>Это результаты проверки ответов. Письменные обоснования автоматически не оцениваются. На проверку обоснования: <strong>${s.pending}</strong>.</p><div class="table-wrap"><table><thead><tr><th>Тема</th><th>Самостоятельные ответы</th><th>С опорой</th><th>Всего условий</th></tr></thead><tbody>${lessons.map(l=>{const a=stats([l]);return `<tr><td><a href="#lesson/${l.id}">№${l.exam} · ${esc(l.title)}</a></td><td>${a.independent} / ${l.tasks.slice(3).length}</td><td>${a.helped}</td><td>${a.total}</td></tr>`;}).join('')}</tbody></table></div><section class="panel"><h2>Как продолжить</h2><p>После помощи решите другое условие. После завершения темы вернитесь к ней через несколько дней и попробуйте объяснить способ без подсказок. Знакомый повтор не добавляет новое самостоятельное решение.</p><a class="button" href="#map">Выбрать номер</a></section>`;}
function missing(){main.innerHTML='<section class="panel"><h1>Такое условие не найдено</h1><p>Выберите тему из карты курса. Сохранённая работа остаётся в браузере.</p><a class="button" href="#map">Открыть карту</a></section>';}
async function render(){const version=++routeVersion;await store.flush();if(version!==routeVersion)return;active=null;if(labCleanup){labCleanup();labCleanup=null;}const route=root.location.hash.slice(1).split('/');if(!lessons.length){main.innerHTML='<section class="panel"><h1>Не удалось загрузить темы</h1><p>Обновите страницу. Если ошибка остаётся, <a href="/ege-profil/">откройте прежние материалы курса</a>.</p></section>';return;}if(route[0]==='exam')exam(Number(route[1]));else if(route[0]==='lesson'&&byLesson.has(route[1]))lessonView(byLesson.get(route[1]));else if(route[0]==='task'&&byTask.has(route[1])){const item=byTask.get(route[1]),mode=modeLabels[route[2]]?route[2]:modeFor(item.index);await taskView(item,mode,version);}else if(route[0]==='progress')progress();else if(!route[0]||route[0]==='map')home();else missing();main.focus({preventScroll:true});}
root.addEventListener('hashchange',async()=>{
 const hash=root.location.hash,[page,id]=hash.slice(1).split('/');
 const lessonId=page==='task'?byTask.get(id)?.lesson.id:page==='lesson'?id:'';
 await render();
 if(root.location.hash===hash&&((page==='exam'&&id==='19')||Object.hasOwn(parameterGraphs,lessonId)))root.scrollTo(0,0);
});
root.addEventListener('storage',event=>{if(event.key?.startsWith(API.PREFIX)){if(active){banner.hidden=false;banner.textContent='Работа обновлена в другой вкладке. Перед следующей проверкой будет прочитано свежее сохранение; текущий ввод остаётся на экране.';}else render();}});
root.ProfilePartTwoApp={render,store,lessons,byTask};render();
})(globalThis);
