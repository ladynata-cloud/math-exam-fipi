(function(root){
'use strict';
const lessons=(root.ProfilePartTwoLessons||[]).slice().sort((a,b)=>a.exam-b.exam);
const financeLessons=root.ProfileFinanceWrittenLessons||[];
const financeIds=new Set(financeLessons.map(lesson=>lesson.id));
const isFinance=lesson=>financeIds.has(lesson.id);
const allLessons=lessons.concat(financeLessons);
const lessonSequence=lesson=>isFinance(lesson)?financeLessons:lessons;
const examMap=root.ProfileExamMap;
// Legacy exam keys identify the existing lessons, labs and saved work.
const entryFor=number=>examMap?.fromLegacyPartTwo(number);
const labelFor=number=>{const entry=entryFor(number);return entry?examMap.label(entry):'Учебная тема';};
const groupURL=number=>{const entry=entryFor(number);return entry?examMap.hash(entry):'#exam/'+number;};
const titles={14:'Уравнения и отбор корней',15:'Стереометрия с доказательством',16:'Неравенства',17:'Моделирование и оптимизация',18:'Планиметрия с доказательством',19:'Задачи с параметром',20:'Числа и их свойства'};
const lessonLabel=lesson=>isFinance(lesson)?examMap.label(16):labelFor(lesson.exam);
const lessonGroupURL=lesson=>isFinance(lesson)?examMap.hash(16):groupURL(lesson.exam);
const main=document.getElementById('main'),banner=document.getElementById('save-warning'),API=root.ProfilePartTwoState;
const byLesson=new Map(allLessons.map(l=>[l.id,l])),byTask=new Map();
allLessons.forEach(lesson=>lesson.tasks.forEach((task,index)=>{
 const presentation=root.ProfileDihedralView?.(task.id);
 byTask.set(task.id,{lesson,task:presentation?{...task,...presentation}:task,index});
}));
let storage;try{storage=root.localStorage;}catch(_){}
const store=API.create(storage,{locks:root.navigator?.locks,validate:(v,id)=>{const task=byTask.get(id)?.task;return !!task&&v.solvedSteps.length<=task.steps.length&&v.drafts.steps.length<=task.steps.length&&v.drafts.final.length<=task.final.length&&v.solutionSteps<=task.solution.length;},onWarning:text=>{banner.hidden=false;banner.textContent=text;}});
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const taskURL=(id,mode)=>'#task/'+encodeURIComponent(id)+'/'+mode;
const modeFor=index=>index>=3?'independent':'guided';
const modeLabels={guided:'С опорой по шагам',plan:'С коротким планом',independent:'Самостоятельно'};
const check=(answers,value)=>API.matches(answers,value,root.ProfileCheck);
const proofReviewFor=(lesson,task)=>lesson.exam===19?root.ProfileParameterProofReviews?.[task.meta?.family]:null;
const hasFinalAttempt=r=>r.completed||r.attempts.some(attempt=>attempt.kind==='final');
// Guided steps and the general answer hint already use other values in hints.
const proofHintStart=80,proofExampleHint=84,proofSkillHint=85;
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
 const offline=root.MathExamTrainerOffline;
 const url=new URL(root.ProfileAlphabetCatalog.href('function-atlas','',19,target),offline?.origin||root.location.origin);
 url.searchParams.set('graph',graph.preset);
 if(help)url.searchParams.set('help',help);
 return offline?url.href:url.pathname+url.search+url.hash;
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
 return `<section id="parameter-graphs" class="panel" aria-labelledby="parameter-graphs-title"><h2 id="parameter-graphs-title">От графика к задаче №18</h2><div class="grid">${cards}</div></section>`;
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
function status(task,record){if(record.independent)return `<span class="tag ok">${correctedWithoutHelp(record)?'Исправлено без подсказки':'Ответы самостоятельно'}</span>`;if(record.completed)return '<span class="tag help">Ответы с опорой</span>';if(record.attemptCount||record.drafts.proof||record.drafts.openFinal?.trim()||record.drafts.final.some(Boolean)||record.drafts.steps.some(Boolean)||record.solvedSteps.length)return '<span class="tag">Продолжить работу</span>';return '<span class="tag">Можно начать</span>';}
function stats(items){const out={total:0,completed:0,independent:0,helped:0,pending:0};items.forEach(l=>l.tasks.forEach(task=>{const r=store.read(task.id);out.total++;if(r.completed)out.completed++;if(r.independent)out.independent++;else if(r.completed)out.helped++;if(r.completed&&task.proof)out.pending++;}));return out;}
function badges(s){return `<div class="stats"><span class="tag">${s.total} условий</span><span class="tag ok">Самостоятельные ответы: ${s.independent}</span><span class="tag help">С опорой: ${s.helped}</span></div>`;}
function resume(items=allLessons){let best=null;for(const lesson of items)for(let index=0;index<lesson.tasks.length;index++){const task=lesson.tasks[index],r=store.read(task.id);if(r.updatedAt&&!r.completed&&(!best||r.updatedAt>best.r.updatedAt))best={lesson,task,index,r};}return best;}
function courseCard(entry){
 if(!entry.legacyPartTwo){
  const count=stats(financeLessons).total;
  return `<section class="card"><h2><span class="number">${entry.number}</span>${esc(entry.title)}</h2><p>${count?count+' условий с письменным решением.':'Подготовка по процентам и кредитам.'}</p><p class="caption">Проверьте расчёт и запишите полное обоснование.</p><div class="actions"><a class="button" href="${examMap.hash(entry)}">Открыть №16</a><a class="button quiet" href="${esc(examMap.href(entry))}">К финансовой подготовке</a></div></section>`;
 }
 const group=lessons.filter(l=>l.exam===entry.legacyPartTwo),s=stats(group);
 return `<section class="card"><h2><span class="number">${entry.number??'+'}</span>${esc(entry.title)}</h2><p>${group.length} тем · ${s.total} условий</p><p class="caption">Самостоятельные ответы: ${s.independent}; с опорой: ${s.helped}.</p><a class="button" href="${examMap.hash(entry)}">${entry.number?'Открыть №'+entry.number:'Открыть дополнительную тему'}</a></section>`;
}
function home(){
 const official=examMap.entries.filter(entry=>entry.part===2),extras=examMap.extras.filter(entry=>entry.legacyPartTwo);
 const topics=lessons.filter(lesson=>entryFor(lesson.exam)?.number);
 const s=stats(topics),last=resume();
 main.innerHTML=`<p class="eyebrow">Профильный ЕГЭ · ФИПИ 2027</p><h1>Вторая часть: от метода до обоснования</h1><p class="lead">Задания экзамена №13–19. В каждой теме можно решить первые три условия с опорой, затем взять новое условие для самостоятельной проверки. Сохраняются ответы, первая попытка и ваше обоснование.</p><p>Здесь ${topics.length} тем и ${s.total} условий по уравнениям, геометрии, неравенствам, параметрам и числам. Отдельный раздел №16 посвящён письменному решению финансовых задач. Ещё 6 тем и 36 условий по оптимизации находятся в дополнительном разделе ниже.</p>${badges(s)}${last?`<a class="button" href="${taskURL(last.task.id,last.r.helped&&!last.r.drafts.openFinal?.trim()?'guided':modeFor(last.index))}">Продолжить: ${esc(last.lesson.title)}</a>`:''}<h2>Подготовка к №13–19</h2><div class="grid">${official.map(courseCard).join('')}</div><h2>Дополнительная подготовка</h2><p>Оптимизация развивает работу с моделью и ограничениями. Это дополнительная тема, а не отдельный официальный номер экзамена.</p><div class="grid">${extras.map(courseCard).join('')}</div><aside class="panel"><h2>Как оценивать результат</h2><p>Запишите ход рассуждений и проверьте его по критериям. Доказательство остаётся на проверку преподавателю.</p><p>После подсказки условие отмечается как работа с опорой. Для новой самостоятельной проверки откройте другое условие.</p><a href="/ege-profil/start/#calm">Первая часть №1–12 и школьные основы →</a></aside>`;
}
function finance(){
 const entry=examMap.get(16),last=resume(financeLessons);
 const cards=financeLessons.map(lesson=>`<section class="card"><h2>${esc(lesson.title)}</h2><p>${esc(lesson.goal)}</p><p class="caption">Условий с верным числовым ответом: ${stats([lesson]).completed} из ${lesson.tasks.length}.</p><div class="actions"><a class="button" href="#lesson/${lesson.id}">К условиям</a><a class="button quiet" href="${taskURL((lesson.tasks.slice(3).find(task=>{const r=store.read(task.id);return !r.completed&&!r.helped;})||lesson.tasks[3]).id,'independent')}">Решить самостоятельно</a></div></section>`).join('');
 const continuing=last?`<p><a class="button" href="${taskURL(last.task.id,modeFor(last.index))}">Продолжить сохранённое условие</a></p>`:'';
 main.innerHTML=`<a class="back" href="#map">← Карта второй части</a><p class="eyebrow">ЕГЭ 2027 · №16</p><h1>${esc(entry.title)}</h1><p class="lead">Разберите календарь выплат и запишите, откуда берётся каждый платёж. Тренажёр сверит числовой ответ. Полное решение можно сверить с образцом и показать преподавателю.</p>${continuing}<div class="grid">${cards}</div><section class="panel"><h2>Вспомнить проценты и платежи</h2><p>16 тем и 96 числовых упражнений для подготовки к письменным задачам.</p><a class="button quiet" href="${esc(examMap.href(entry))}">Открыть финансовую подготовку</a></section>`;
}
function exam(number){
 const group=lessons.filter(l=>l.exam===number);if(!group.length)return missing();const s=stats(group),last=resume(group);
 main.innerHTML=`<a class="back" href="#map">← Все номера второй части</a><p class="eyebrow">ЕГЭ 2027 · ${esc(labelFor(number))}</p><h1>${titles[number]}</h1>${badges(s)}${number===20&&root.self===root.top?`<p><a class="button quiet" href="/trainers/ege-methods.html">Оценка плюс пример</a></p>`:''}${last?`<p><a class="button" href="${taskURL(last.task.id,last.r.helped&&!last.r.drafts.openFinal?.trim()?'guided':modeFor(last.index))}">Продолжить сохранённое условие</a></p>`:''}<div class="grid">${group.map((lesson,i)=>`<section class="card"><span class="eyebrow">Тема ${i+1} из ${group.length}</span><h2>${esc(lesson.title)}</h2><p>${esc(lesson.goal)}</p><p class="caption">${lesson.tasks.length} условий · ${stats([lesson]).independent} самостоятельных ответов</p><a class="button" href="#lesson/${lesson.id}">Начать или продолжить</a></section>`).join('')}</div><section class="panel"><h2>Проверка без подсказок</h2><p>Выберите по одному новому условию каждой темы. Сначала сами определите способ решения. После проверки вернитесь к темам, где понадобилась помощь.</p><div class="actions">${group.map(l=>{const unseen=l.tasks.slice(3).find(t=>{const r=store.read(t.id);return !r.completed&&!r.helped;})||l.tasks[3];return `<a class="button quiet" href="${taskURL(unseen.id,'independent')}">${esc(l.title)}</a>`;}).join('')}</div></section>`;
 mountSkills(number);
 if(number===14)root.ProfileEquationSchoolWorkshop?.mount(main,root.ProfileEquationSchoolRoute);
 const catalog=root.ProfileAlphabetCatalog;
 const learningRoutes=catalog?.forNumber(number).filter(topic=>topic.route)??[];
 if(root.self===root.top&&learningRoutes.length){
  const nav=document.createElement('nav');
  nav.className='actions';
  nav.setAttribute('aria-label','Подготовка: '+labelFor(number));
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
 const sequence=lessonSequence(lesson),next=sequence[sequence.indexOf(lesson)+1];
 const equationLabs=!isFinance(lesson)&&Array.isArray(root.ProfileEquationInvestigationData)&&root.ProfileEquationAnswers?
  root.ProfilePartTwoEquationLabs?.create(root.ProfileEquationInvestigationData,root.ProfileEquationAnswers):null;
 const hasEquationLab=equationLabs?.has(lesson.id);
 const labMarkup=`<details id="model-lab"${hasEquationLab?' class="equation-investigation"':''}><summary>${hasEquationLab?'Сначала исследуйте на модели':'Исследование на модели · не зачёт'}</summary><div id="model-lab-content" class="panel"></div></details>`;
 main.innerHTML=`<a class="back" href="${lessonGroupURL(lesson)}">← Все темы · ${esc(lessonLabel(lesson))}</a><p class="eyebrow">${esc(lessonLabel(lesson))} · учебная тема</p><h1>${esc(lesson.title)}</h1><p class="lead">${esc(lesson.goal)}</p>${hasEquationLab?labMarkup:''}<div class="panel"><h2>Начать с задачи</h2><p>Попробуйте первый шаг сами; объяснение и помощь можно открыть рядом с условием.</p><div class="actions"><a class="button" href="${taskURL(lesson.tasks[0].id,'guided')}">Первое условие по шагам</a><a class="button quiet" href="${taskURL(lesson.tasks[3].id,'independent')}">Проверить себя</a></div></div><details><summary>Короткая теория и выбор метода</summary><div class="panel">${lesson.theory.map(p=>`<p>${p}</p>`).join('')}</div></details>${prerequisites(lesson)}${hasEquationLab||isFinance(lesson)?'':labMarkup}<h2>Сначала — разобраться</h2><div class="task-grid">${lesson.tasks.slice(0,3).map((task,i)=>taskCard(task,i,'guided')).join('')}</div><h2>Затем — другое условие самостоятельно</h2><p class="caption">Это отдельные условия. Если открыть подсказку или разбор, результат будет отмечен как работа с опорой.</p><div class="task-grid">${lesson.tasks.slice(3).map((task,i)=>taskCard(task,i+3,'independent')).join('')}</div>${next?`<p class="next"><a href="#lesson/${next.id}">Следующая тема: ${esc(next.title)} →</a></p>`:''}`;
 if(isFinance(lesson))return;
 mountSkills(lesson.exam,lesson);
 const lab=document.getElementById('model-lab');
 if(!hasEquationLab&&!root.ProfilePartTwoLabs){lab.hidden=true;return;}
 lab.addEventListener('toggle',()=>{
  if(!lab.open||labCleanup)return;
  const host=document.getElementById('model-lab-content');
  labCleanup=hasEquationLab?equationLabs.mount(host,lesson.id,{storage}):root.ProfilePartTwoLabs.mount(host,lesson.exam,{storage});
 });
 if(hasEquationLab && root.location.hash.split('/')[2]==='model')lab.open=true;
}
function taskCard(task,i,mode){return `<a class="task-link" href="${taskURL(task.id,mode)}"><strong>Условие ${i+1}</strong><small>${i<3?'Учимся решать':'Проверяем себя'}</small>${status(task,store.read(task.id))}</a>`;}
function feedback(text,kind=''){const box=document.getElementById('feedback');if(box){box.className='feedback '+kind;box.hidden=false;box.textContent=text;}}
function bind(id,event,fn){document.getElementById(id)?.addEventListener(event,fn);}
function bindSubmit(id,fn){
 const form=document.getElementById(id);let pending=false;
 form?.addEventListener('submit',async event=>{
  event.preventDefault();
  if(pending||!form.isConnected)return;
  pending=true;const button=form.querySelector('button[type="submit"]');button.disabled=true;
  try{await fn(event);}finally{pending=false;button.disabled=button.dataset.syncBlocked==='true';}
 });
}
function recentTrace(r,review){if(!r.attempts.length)return '';const first=r.attempts[0],last=r.attempts[r.attempts.length-1];return `<details class="history"><summary>Первая попытка и последнее исправление</summary><dl><dt>Первая отправка</dt><dd>${esc(first.answers.join('; '))} · ${first.correct?'верно':'нужна проверка'} · ${first.helped?'с опорой':'без подсказки'}</dd><dt>Последняя отправка</dt><dd>${esc(last.answers.join('; '))} · ${last.correct?'верно':'нужна проверка'} · ${last.helped?'с опорой':'без подсказки'}</dd></dl><p>Отправок: ${r.attemptCount}. Сохраняются первая и последние 59 отправок этого условия.</p>${review?'<p id="proof-help-history" hidden></p>':''}</details>`;}
const {normalizedProof,currentProofChecks}=API;
function reviewCount(review,r){
 const checks=currentProofChecks(r);
 return review.criteria.reduce((count,_,i)=>count+Number(checks.includes(i)),0);
}
function parameterProofView(review,r,nextLink){
 const catalog=root.ProfileAlphabetCatalog,skill=catalog?.index['parameter-methods']?.skills[review.skill];
 const back=(root.MathExamTrainerOffline?'/ege-profil/part-two/':root.location.pathname)+root.location.search+root.location.hash;
 const skillLink=skill&&root.self===root.top?`<p><a id="proof-skill" href="${esc(catalog.href('parameter-methods',review.skill,19,back))}">${esc(skill.title)} →</a></p>`:'';
 const {example}=review;
 return `<p id="proof-review-instruction" class="caption"></p>
  <details id="proof-review" hidden>
   <summary>Критерии самопроверки</summary>
   <p>Отметьте пункты, для которых нашли довод в своём тексте. Остальные можно дописать после подсказки.</p>
   <ol class="proof-review-list">${review.criteria.map(([title,criterion,hint],i)=>`
    <li>
     <label><input type="checkbox" data-proof-check="${i}" disabled><span><strong>${esc(title)}</strong>${esc(criterion)}</span></label>
     <details data-proof-help="${proofHintStart+i}"><summary aria-label="Подсказка к пункту «${esc(title)}»">Подсказка</summary><p class="hint">${esc(hint)}</p></details>
    </li>`).join('')}
   </ol>
   <p id="proof-review-count" class="caption" role="status"></p>
   <details class="proof-example" data-proof-help="${proofExampleHint}">
    <summary>Сравнить рассуждения на других данных</summary>
    <p>${esc(example.task)}</p>
    <p><strong>Неполный довод.</strong> ${esc(example.incomplete)}</p>
    <p><strong>Исправленный довод.</strong> ${esc(example.revised)}</p>
   </details>
   ${skillLink}${!r.completed&&nextLink?`<p>${nextLink}</p>`:''}
  </details>`;
}
function proofView(task,r,review,nextLink){
 if(!task.proof)return '';
 const criteria=review?parameterProofView(review,r,nextLink):`<p id="proof-sync-warning" class="caption" role="status" hidden>Обоснование изменилось в другой вкладке. Можно скопировать текст на экране или открыть сохранённый вариант.</p><button type="button" id="proof-open-saved" class="button quiet" hidden>Открыть сохранённое обоснование</button><details class="proof-criteria"><summary>Критерии самопроверки</summary><p id="proof-needs-draft" class="caption">Запишите хотя бы один довод, чтобы отметить пункты.</p><div class="checklist">${task.proof.criteria.map((c,i)=>`<label><input type="checkbox" data-proof-check="${i}" disabled><span>${c}</span></label>`).join('')}</div></details>`;
 return `<section class="panel" aria-labelledby="proof-heading"><h2 id="proof-heading">Ваше обоснование</h2><p>${task.proof.prompt}</p><label class="field"><span>Запишите ход решения</span><textarea id="proof-draft" maxlength="12000" placeholder="Почему выбранный способ работает? Какие ограничения проверены?"></textarea></label>${criteria}<p class="proof-status"><strong>Обоснование требует проверки.</strong> ${review?'Ответы сверяет тренажёр. Полноту доводов оцениваете вы по своему тексту.':'Галочки — ваша самопроверка; они не подтверждают правильность доказательства автоматически.'}</p></section>`;
}
function updateProofReview(review,r,staleDraft,ready){
 const reviewPanel=document.getElementById('proof-review'),instruction=document.getElementById('proof-review-instruction');
 const attempted=hasFinalAttempt(r);
 reviewPanel.hidden=!ready;
 if(!ready)reviewPanel.open=false;
 instruction.hidden=ready;
 instruction.textContent=staleDraft?'Обоснование изменилось в другой вкладке. Можно скопировать текст на экране или открыть сохранённый вариант.':attempted?'Запишите хотя бы один довод, чтобы открыть критерии.':'Отправьте ответы и запишите свой довод, чтобы открыть критерии.';
 const jump=document.getElementById('proof-jump');
 jump.hidden=!attempted&&!staleDraft;
 jump.textContent=staleDraft?'Открыть сохранённое обоснование':ready?'К критериям обоснования':'Записать обоснование';
 document.getElementById('proof-review-count').textContent=staleDraft?'Сверка приостановлена до открытия сохранённого довода.':`Вы отметили ${reviewCount(review,r)} из ${review.criteria.length} пунктов.`;
 const history=document.getElementById('proof-help-history');
 if(history){
  const opened=review.criteria.flatMap(([title],i)=>r.hints.includes(proofHintStart+i)?[title]:[]);
  if(r.hints.includes(proofExampleHint))opened.push('пример на других данных');
  if(r.hints.includes(proofSkillHint))opened.push('упражнение из карты навыков');
  history.hidden=!opened.length;
  history.textContent=opened.length?`Помощь к обоснованию — ${opened.join(', ')}.`:'';
 }
}
function bindProof(task,review,r,isCurrent,conflictingDraft){
 const draft=document.getElementById('proof-draft');
 if(!draft)return;
 const inputs=main.querySelectorAll('[data-proof-check]');
 const syncWarning=document.getElementById('proof-sync-warning');
 const openSaved=document.getElementById('proof-open-saved');
 const needsDraft=document.getElementById('proof-needs-draft');
 let savedProof=r.drafts.proof;
 draft.value=conflictingDraft??savedProof;
 draft.readOnly=conflictingDraft!==null;
 function captureProofConflict(storedProof){
  if(!draft.isConnected)return null;
  const visible=draft.value,stored=normalizedProof(storedProof);
  const conflict=draft.readOnly||stored!==normalizedProof(savedProof);
  return conflict&&normalizedProof(visible)!==stored?visible:null;
 }
 function refresh(record){
  if(!isCurrent()||!draft.isConnected)return;
  const stored=normalizedProof(record.drafts.proof),shown=normalizedProof(draft.value);
  const staleDraft=stored!==normalizedProof(savedProof)||(draft.readOnly&&shown!==stored);
  if(!staleDraft&&shown!==stored)return;
  const ready=!staleDraft&&!!shown&&(!review||hasFinalAttempt(record));
  const checks=ready?currentProofChecks(record):[];
  draft.readOnly=staleDraft;
  inputs.forEach(input=>{input.disabled=!ready;input.checked=checks.includes(Number(input.dataset.proofCheck));});
  if(review)updateProofReview(review,record,staleDraft,ready);
  else{
   syncWarning.hidden=!staleDraft;
   openSaved.hidden=!staleDraft;
   needsDraft.hidden=ready||staleDraft;
  }
 }
 bind('proof-draft','input',event=>{
  if(draft.readOnly)return;
  const value=event.target.value;
  store.patch(task.id,record=>{
   const stored=normalizedProof(record.drafts.proof);
   if(stored!==normalizedProof(savedProof))return false;
   if(stored!==normalizedProof(value)){
    record.proofChecks=[];
    delete record.proofReviewSnapshot;
   }
   record.drafts.proof=value;
   savedProof=value;
  }).then(refresh);
 });
 inputs.forEach(input=>input.addEventListener('change',()=>{
  const index=Number(input.dataset.proofCheck),checked=input.checked;
  const proof=normalizedProof(draft.value);
  store.patch(task.id,record=>{
   if(!proof||normalizedProof(savedProof)!==proof||normalizedProof(record.drafts.proof)!==proof||(review&&!hasFinalAttempt(record)))return false;
   const checks=currentProofChecks(record);
   if(checked===checks.includes(index))return false;
   record.proofChecks=checked?[...checks,index]:checks.filter(i=>i!==index);
   if(record.proofChecks.length)record.proofReviewSnapshot={proof,checks:[...record.proofChecks]};
   else delete record.proofReviewSnapshot;
  }).then(refresh);
 }));
 async function restoreDraft(){
  await store.flush();
  if(!isCurrent()||!draft.isConnected)return false;
  const saved=store.read(task.id);
  if(!draft.readOnly&&normalizedProof(saved.drafts.proof)===normalizedProof(savedProof))return false;
  draft.value=savedProof=saved.drafts.proof;
  refresh(saved);
  draft.focus();
  return true;
 }
 bind('proof-open-saved','click',restoreDraft);
 refresh(r);
 const hooks={refreshProof:refresh,captureProofConflict};
 if(!review)return hooks;
 function recordHelp(index){
  return store.patch(task.id,record=>{
   record.helped=true;
   if(!record.hints.includes(index))record.hints.push(index);
  }).then(refresh);
 }
 bind('proof-jump','click',async()=>{
  if(await restoreDraft()||!isCurrent()||!draft.isConnected)return;
  const panel=document.getElementById('proof-review');
  if(panel.hidden)draft.focus();
  else{panel.open=true;panel.querySelector('summary').focus();}
 });
 main.querySelectorAll('[data-proof-help]').forEach(details=>{
  details.querySelector('summary').addEventListener('click',()=>{
   if(!details.open)recordHelp(Number(details.dataset.proofHelp));
  });
 });
 bind('proof-skill','click',async event=>{
  const href=event.currentTarget.href,save=recordHelp(proofSkillHint);
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  await save;
  await store.flush();
  if(isCurrent())root.location.assign(href);
 });
 bind('proof-skill','auxclick',event=>{
  if(event.button===1)recordHelp(proofSkillHint);
 });
 return hooks;
}
function nextPractice(lesson,task){
 return lesson.tasks.slice(3).find(t=>{const r=store.read(t.id);return t.id!==task.id&&!r.completed&&!r.helped;});
}
function practiceLink(task){return task?`<a class="button" href="${taskURL(task.id,'independent')}">Другое условие самостоятельно →</a>`:'';}
function parameterPracticeLink(lesson,task){return practiceLink(task)||`<a class="button quiet" href="#lesson/${lesson.id}">Выбрать условие для повторения →</a>`;}
function completion(item,r,mode,nextIndependent,review,equation){
 if(!r.completed)return '';
 if(equation&&!equation.fields.every(field=>API.equationCheck(r,field.key)==='correct')){
  return '<section class="panel complete" id="historical-completion"><h2>Ранее решённое условие</h2><p>Прежний результат сохранён. Проверьте текущую запись в новых полях.</p></section>';
 }
 const {lesson,task,index}=item;
 const sequence=lessonSequence(lesson),nextTask=lesson.tasks[index+1],nextLesson=sequence[sequence.indexOf(lesson)+1];
 const offerFresh=mode!=='independent'||r.helped;
 const nextLink=review?parameterPracticeLink(lesson,nextIndependent):
  nextIndependent&&offerFresh?practiceLink(nextIndependent):
  nextTask?`<a class="button" href="${taskURL(nextTask.id,modeFor(index+1))}">Следующее условие →</a>`:
  nextLesson?`<a class="button" href="#lesson/${nextLesson.id}">Следующая тема →</a>`:'';
 return `<section class="panel complete" id="completion"><h2>Ответы приняты</h2><p>${correctedWithoutHelp(r)?'Ответ исправлен самостоятельно после первой попытки.':r.independent?'Вычислительная часть решена самостоятельно.':'Это работа с опорой или повтор учебного условия.'}${task.proof?' Письменное обоснование требует проверки.':''}</p><div class="actions">${nextLink}<a class="button quiet" href="${lessonGroupURL(lesson)}">Все темы · ${esc(lessonLabel(lesson))}</a></div>${!nextIndependent?'<p class="caption">Новые самостоятельные условия этой темы закончились. Повтор знакомого условия не увеличивает счётчик.</p>':''}</section>`;
}
function equationFeedback(status){
 if(status==='correct')return 'Ответ верен.';
 const text=[];
 if(status.startsWith('missing'))text.push('В ответе не хватает решений.');
 if(status.includes('extra')){
  if(status.endsWith('outside-interval'))text.push('Есть корень вне промежутка или на исключённой границе.');
  else if(status.endsWith('outside-domain'))text.push('Один из ответов нарушает область определения.');
  else if(status.endsWith('not-root'))text.push('Одно из чисел не решает исходное уравнение.');
  else text.push('В ответе есть лишние решения.');
 }
 return text.join(' ');
}
function earlierEquationDraft(task,record){
 const own=record.drafts.final.flatMap((value,index)=>value.trim()&&task.final[index]?
  [`<p>${esc(task.final[index].label)} · ${esc(value)}</p>`]:[]);
 if(record.drafts.openFinal?.trim())own.push(`<p>${esc(record.drafts.openFinal)}</p>`);
 return own.length?`<details class="earlier-equation"><summary>Мои ответы из прежней формы</summary>${own.join('')}</details>`:'';
}
function bindEquationForm(equation,context){
 const {item,mode,viewVersion,isCurrent,record,priorConflict,independentEligible,proofBindings}=context;
 const id=item.task.id;
 const fields=equation.fields.map((descriptor,index)=>({descriptor,input:document.getElementById('final-'+index),
  message:document.getElementById('equation-result-'+index)}));
 const entries=callback=>Object.fromEntries(fields.map(({descriptor,input})=>[descriptor.key,callback(descriptor,input)]));
 let observed=entries(descriptor=>API.equationDraft(record,descriptor.key));
 let blocked=!!priorConflict;
 const visible=()=>entries((_,input)=>input.value);
 const conflictButton=document.getElementById('equation-open-saved');
 const conflictNotice=document.getElementById('equation-sync-warning');
 function show(record){
  if(!isCurrent())return;
  conflictNotice.hidden=conflictButton.hidden=!blocked;
  for(const {descriptor,input,message} of fields){
   const matches=input.value===API.equationDraft(record,descriptor.key);
   const status=matches?API.equationCheck(record,descriptor.key):'';
   input.readOnly=blocked;
   input.setAttribute('aria-invalid',String(!!status&&status!=='correct'));
   message.textContent=equationFeedback(status);
  }
  const button=document.querySelector('#final-form button[type="submit"]');
  if(blocked){button.dataset.syncBlocked='true';button.disabled=true;}
  else if(button.dataset.syncBlocked){delete button.dataset.syncBlocked;button.disabled=false;}
 }
 function refreshEquation(record){
  if(!isCurrent())return;
  if(Object.entries(observed).some(([key,value])=>API.equationDraft(record,key)!==value))blocked=true;
  show(record);
 }
 if(priorConflict)for(const {descriptor,input} of fields)input.value=priorConflict[descriptor.key]??input.value;
 for(const {descriptor,input} of fields)input.addEventListener('input',async()=>{
  if(blocked)return;
  const key=descriptor.key,before=observed[key],value=input.value;
  observed[key]=value;
  const updated=await store.patch(id,state=>{
   if(blocked)return false;
   const change=API.updateEquationDraft(state,{[key]:before},{[key]:value});
   if(change==='conflict')blocked=true;
   return change==='updated';
  });
  show(updated);
 });
 conflictButton.addEventListener('click',async()=>{
  await store.flush();
  if(!isCurrent())return;
  const saved=store.read(id);
  observed=entries(descriptor=>API.equationDraft(saved,descriptor.key));
  for(const {descriptor,input} of fields)input.value=observed[descriptor.key];
  blocked=false;
  show(saved);
  fields[0].input.focus();
 });
 bindSubmit('final-form',async()=>{
  const raw=visible(),expected={...observed};
  const parser=root.ProfileEquationAnswers;
  const results=fields.map(({descriptor})=>parser.compare(parser.parse(raw[descriptor.key],descriptor.type),equation.answer));
  const invalid=results.findIndex(result=>!result.recognized);
  let outcome='format';
  const updated=await store.patch(id,state=>{
   if(blocked){outcome='conflict';return false;}
   const change=API.updateEquationDraft(state,expected,raw);
   if(change==='conflict'){blocked=true;outcome='conflict';return false;}
   if(invalid!==-1)return change==='updated';
   const statuses=Object.fromEntries(fields.map(({descriptor},index)=>[descriptor.key,results[index].status]));
   outcome=store.finishEquation(state,raw,statuses,{mode,independentEligible});
   return change==='updated'||outcome==='correct'||outcome==='wrong';
  });
  if(!isCurrent())return;
  if(outcome==='conflict'){show(updated);conflictButton.focus();return;}
  for(const {descriptor} of fields){
   const key=descriptor.key;
   if(observed[key]===expected[key])observed[key]=raw[key];
  }
  show(updated);
  if(fields.some(({descriptor,input})=>input.value!==raw[descriptor.key]))return;
  if(invalid!==-1){
   fields.forEach(({input},index)=>{if(!results[index].recognized)input.setAttribute('aria-invalid','true');});
   const {input,descriptor}=fields[invalid],result=results[invalid];
   const message=result.reason==='empty'?'Заполните поле. Пустой ввод не заменяет ∅.':
    result.reason==='complexity'?'Упростите запись и повторите проверку.':'Проверьте формат записи. '+descriptor.format;
   feedback(message,'error');
   input.focus();
   return;
  }
  if(outcome==='correct'||outcome==='duplicate'){
   await taskView(item,mode,viewVersion);
   if(!isCurrent())return;
   feedback('Ответы верны. Сохраните обоснование и проверьте его с преподавателем.','ok');
   document.getElementById('completion')?.scrollIntoView?.({block:'nearest',behavior:'auto'});
   return;
  }
  feedback('Проверьте поля с замечаниями. Результаты каждого ответа сохранены.','error');
  const trace=document.getElementById('equation-trace'),opened=trace.querySelector('details')?.open;
  trace.innerHTML=recentTrace(updated);
  if(opened)trace.querySelector('details').open=true;
  proofBindings?.refreshProof(updated);
 });
 show(record);
 return {refreshEquation,captureEquationConflict:()=>blocked?visible():null};
}
function proofFigure(figure){
 return figure?`<figure class="diagram solution-figure">${figure.diagram}<figcaption>${esc(figure.caption)}</figcaption></figure>`:'';
}
function constructionIndex(task,record){
 if(record.solvedSteps.length||record.drafts.steps[0]?.trim())return task.construction.length;
 return record.constructionStep||0;
}
function constructionForm(task,record){
 const index=constructionIndex(task,record),item=task.construction[index];
 if(!item)return '';
 return `<section class="panel" data-construction="${index}"><h2>Построим линейный угол</h2>${proofFigure(item.figure)}<p>${esc(item.prompt)}</p><div class="actions">${item.choices.map((choice,i)=>`<button type="button" data-ray="${i}">${esc(choice)}</button>`).join('')}</div><p role="status" data-ray-feedback></p></section>`;
}
function guidedView(task,r){
 if(task.construction){const form=constructionForm(task,r);if(form)return form;}
 const stepIndex=r.solvedSteps.length,step=task.steps[stepIndex];return `<section class="panel"><h2>Решение по шагам</h2>${r.solvedSteps.length?`<ol class="steps">${r.solvedSteps.map(i=>`<li class="step-done">${task.steps[i].prompt}<br><strong>${task.steps[i].explanation}</strong></li>`).join('')}</ol>`:''}${step?`<form id="step-form">${task.construction?proofFigure(stepIndex===1?task.angleQuestionFigure:task.solutionFigures[stepIndex]):''}<p class="eyebrow">Шаг ${stepIndex+1} из ${task.steps.length}</p><label class="field"><span>${step.prompt}</span><input id="step-answer" type="text" maxlength="500" autocomplete="off" value="${esc(r.drafts.steps[stepIndex]||'')}"></label><div class="actions"><button type="submit">Проверить шаг</button><button type="button" id="step-hint" class="quiet">Нужна подсказка</button></div></form>${r.hints.includes(stepIndex)?`<p class="hint">${step.hint}</p>`:''}`:'<p class="feedback ok">Шаги пройдены. Теперь соберите итоговые ответы ниже.</p>'}</section>`;}
async function taskView(item,mode,viewVersion=routeVersion,previous=active){
 if(viewVersion!==routeVersion)return;
 const {lesson,task,index}=item;
 const sameTask=previous?.item.task.id===task.id;
 const captureProofConflict=sameTask?previous.captureProofConflict:null;
 const priorEquationConflict=sameTask?previous.captureEquationConflict?.()??null:null;
 active={item,mode,captureProofConflict,captureEquationConflict:()=>priorEquationConflict};
 if(mode!=='independent')await store.patch(task.id,r=>{r.helped=true;});
 if(viewVersion!==routeVersion)return;
 const isCurrent=()=>viewVersion===routeVersion&&active?.item.task.id===task.id&&active.mode===mode;
 const r=store.read(task.id),displayedStep=r.solvedSteps.length,independentEligible=index>=3;
 const conflictingDraft=captureProofConflict?.(r.drafts.proof)??null;
 const equation=root.ProfileEquationFields?.forTask(lesson,task,mode,independentEligible);
 const examPractice=mode==='independent' && equation?.answer.type==='finite-pi' && root.location.hash.endsWith('/trig-exam');
 const returnURL=examPractice?'#fipi/2027/13/school/exam':'#lesson/'+lesson.id;
 const backLabel=examPractice?'К самостоятельным работам':lesson.title;
 const taskTitle=examPractice?'Самостоятельная работа №13':lesson.title;
 const proofTask=examPractice?{...task,proof:{prompt:'Запишите решение обоих пунктов и обоснуйте полноту ответа.',criteria:[
  'Каждый переход обоснован с учётом его условий.',
  'Записаны все решения исходного уравнения.',
  'Для каждого выбранного угла показано, почему он входит в промежуток. Обосновано, почему других подходящих углов нет.'
 ]}}:task;
 const openFinal=!equation&&mode==='independent'&&independentEligible&&typeof API.openAnswer==='function'?task.independentFinal:null;
 const finalFields=equation?.fields||(openFinal?[openFinal]:task.final);
 const finalDraft=equation?finalFields.map(field=>API.equationDraft(r,field.key)):openFinal?[r.drafts.openFinal]:r.drafts.final;
 const equationHints=equation?(task.hints||task.steps.slice(0,2).map(step=>step.hint)):[];
 const observedFinal=finalFields.map((_,i)=>finalDraft[i]||'');
 let observedStep=r.drafts.steps[displayedStep]||'';
 const earlierDraft=equation?earlierEquationDraft(task,r):openFinal&&r.drafts.final.some(value=>value.trim())?
  `<details class="earlier-final"><summary>Ответы из пошаговой формы</summary>${task.final.map((field,i)=>r.drafts.final[i]?`<p>${esc(field.label)}: ${esc(r.drafts.final[i])}</p>`:'').join('')}</details>`:'';
 const review=proofReviewFor(lesson,task),nextIndependent=review||r.completed?nextPractice(lesson,task):null;
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
 main.innerHTML=`<a class="back" href="${returnURL}">← ${esc(backLabel)}</a><p class="eyebrow">${esc(lessonLabel(lesson))} · условие ${index+1} из ${lesson.tasks.length}</p><h1>${esc(taskTitle)}</h1><nav class="modes" aria-label="Способ работы">${Object.entries(modeLabels).map(([key,label])=>`<a href="${examPractice && key==='independent'?root.location.hash:taskURL(task.id,key)}" ${mode===key?'aria-current="page"':''}>${label}</a>`).join('')}</nav>${mode==='independent'&&(r.helped||!independentEligible)?'<p class="hint">Это знакомое учебное условие или условие с уже открытой помощью. Его повтор не считается новой самостоятельной проверкой.</p>':''}<div class="task-layout"><section class="panel condition"><h2>Условие</h2><div>${equation?.prompt||openFinal?.prompt||task.prompt}</div>${task.diagram&&!(mode==='guided'&&task.construction&&displayedStep<task.steps.length)?`<div class="diagram">${task.diagram}</div>`:''}${task.diagram&&!task.construction?'<p class="caption">Рисунок относится к этому условию. Для доказательства используйте данные и свойства, а не измерения по экрану.</p>':''}</section><div class="work">${!task.steps.length&&mode!=='independent'?'<section class="panel"><h2>Работа с опорой</h2><p>Введите свой ответ или откройте подсказку ниже.</p></section>':mode==='guided'?guidedView(task,r):mode==='plan'?`<section class="panel"><h2>План решения</h2><ol class="steps">${task.steps.map(s=>`<li>${s.prompt}</li>`).join('')}</ol><p class="caption">План — опора. Для самостоятельного зачёта затем откройте другое условие.</p></section>`:''}<section class="panel"><h2>Итоговые ответы</h2><form id="final-form">${finalFields.map((field,i)=>`<label class="field"><span>${field.label}</span><input id="final-${i}" data-final="${i}" type="text" maxlength="500" autocomplete="off" value="${esc(finalDraft[i]||'')}"${equation?` aria-describedby="equation-format-${i} equation-result-${i}"`:''}></label>${equation?`<p class="caption" id="equation-format-${i}">${esc(field.format)}</p><p class="caption" id="equation-result-${i}" role="status"></p>`:''}`).join('')}${equation?'':`<p class="caption">${openFinal?esc(openFinal.format):'Можно вводить дроби, π и корни: 3/4, π/6, sqrt(2). Ограничения и формат ответа указаны у поля.'}</p>`}<button type="submit">${openFinal||(equation&&finalFields.length===1)?'Проверить ответ':'Проверить ответы'}</button></form>${equation?'<p id="equation-sync-warning" class="caption" role="status" hidden>Ответы изменились в другой вкладке. Можно скопировать текущий ввод или открыть сохранённый вариант.</p><button id="equation-open-saved" type="button" class="quiet" hidden>Открыть сохранённые ответы</button>':''}${earlierDraft}<div id="feedback" class="feedback" role="status" hidden></div>${review?'<button id="proof-jump" type="button" class="quiet" hidden>К критериям обоснования</button>':''}<div class="actions"><button type="button" id="request-help" class="quiet">Хочу подсказку</button><button type="button" id="show-solution" class="quiet">Открыть разбор</button></div>${r.hints.includes(99)?`<p class="hint">${equationHints[0]||task.steps[0]?.hint||lesson.goal}</p>${equationHints[1]&&!r.hints.includes(98)?'<button type="button" id="equation-next-hint" class="quiet">Открыть вторую подсказку</button>':''}`:''}${equationHints[1]&&r.hints.includes(98)?`<p class="hint">${equationHints[1]}</p>`:''}${r.solution?`<div class="hint"><h3>Разбор с опорой</h3><ol class="solution-list">${task.solution.slice(0,r.solutionSteps).map((p,i)=>`<li>${p}${proofFigure(task.solutionFigures?.[i])}</li>`).join('')}</ol>${r.solutionSteps<task.solution.length?'<button type="button" id="solution-next" class="quiet">Следующий шаг разбора</button>':''}</div>`:''}${equation?`<div id="equation-trace">${recentTrace(r)}</div>`:review?`<div id="task-trace">${recentTrace(r,review)}</div>`:recentTrace(r)}</section></div></div>${proofView(openFinal?{...task,proof:{...task.proof,prompt:'Объясните, как нашли все решения и почему других нет.'}}:proofTask,r,review,review&&parameterPracticeLink(lesson,nextIndependent))}${completion(item,r,mode,nextIndependent,review,equation)}<details class="task-theory"><summary>Теория для этой темы</summary><div class="panel">${lesson.theory.map(p=>`<p>${p}</p>`).join('')}</div></details>${prerequisites(lesson)}<p><a href="${lessonGroupURL(lesson)}">Вернуться к темам · ${esc(lessonLabel(lesson))}</a> · <a href="#map">Все задания второй части</a></p>`;
 if(parameterCondition){
  const layout=main.querySelector('.task-layout'),modes=main.querySelector('.modes');
  layout.querySelector('.work').prepend(modes);
 }
 if(!isFinance(lesson)&&!examPractice)mountSkills(lesson.exam,lesson);
 offerGraph(r);
 main.querySelectorAll('.modes a').forEach(link=>link.addEventListener('click',event=>{if(link.getAttribute('href')===root.location.hash){event.preventDefault();render();}}));
 if(!equation)document.querySelectorAll('[data-final]').forEach(input=>input.addEventListener('input',()=>{
  const i=Number(input.dataset.final),value=input.value;
  observedFinal[i]=value;
  store.patch(task.id,s=>{
   if(openFinal){s.drafts.openFinal=value;return;}
   while(s.drafts.final.length<=i)s.drafts.final.push('');
   s.drafts.final[i]=value;
  });
 }));
 bind('step-answer','input',e=>{const value=e.target.value;observedStep=value;store.patch(task.id,s=>{while(s.drafts.steps.length<=displayedStep)s.drafts.steps.push('');s.drafts.steps[displayedStep]=value;});});
 const proofBindings=bindProof(task,review,r,isCurrent,conflictingDraft);
 Object.assign(active,proofBindings);
 if(equation)Object.assign(active,bindEquationForm(equation,{item,mode,viewVersion,isCurrent,record:r,priorConflict:priorEquationConflict,independentEligible,proofBindings}));
 else bindSubmit('final-form',async()=>{
  const fields=finalFields.map((_,i)=>document.getElementById('final-'+i)),rawValues=fields.map(f=>f.value),values=rawValues.map(v=>v.trim());
  const formats=finalFields.map((field,i)=>API.recognize(field,values[i],root.ProfileCheck));
  const invalid=formats.findIndex(result=>!result.recognized);
  if(invalid!==-1){
   // Input events already save individual fields. Only persist changes which
   // arrived without an input event (for example autofill), never a stale form.
   const changed=rawValues.flatMap((value,i)=>value===observedFinal[i]?[]:[i]);
   for(const i of changed)observedFinal[i]=rawValues[i];
   if(changed.length)await store.patch(task.id,s=>{for(const i of changed){
    if(openFinal)s.drafts.openFinal=rawValues[i];
    else{while(s.drafts.final.length<=i)s.drafts.final.push('');s.drafts.final[i]=rawValues[i];}
   }});
   else await store.flush();
   if(!isCurrent())return;
   fields.forEach((f,i)=>f.setAttribute('aria-invalid',String(!formats[i].recognized)));
   feedback(values[invalid]?`Проверьте запись в поле «${finalFields[invalid].label}». ${formats[invalid].format} Это уточнение формата; попытка не засчитывается.`:'Заполните каждое поле. Пустое поле не считается ошибкой.','error');
   fields[invalid].focus();return;
  }
  const openResult=openFinal&&API.openAnswer(openFinal,values[0]);
  const results=openResult?[openResult.correct]:finalFields.map((field,i)=>check(field.answers,values[i])),correct=results.every(Boolean);
  const updated=await store.attempt(task.id,{kind:'final',answers:values,correct,mode,independentEligible,openFinal:!!openFinal,saveFinalDraft:true});
  if(!isCurrent())return;
  if(correct){
   await taskView(item,mode,viewVersion);if(!isCurrent())return;
   const message=review?'Ответы верны.':task.proof?'Ответы верны. Сохраните обоснование и проверьте его с преподавателем.':'Ответы верны. Можно перейти к другому условию.';
   feedback(message,'ok');
   if(review)document.getElementById('final-form').querySelector('button[type="submit"]').focus();
   else document.getElementById('completion')?.scrollIntoView?.({block:'nearest',behavior:'auto'});
  }
  else{
   fields.forEach((f,i)=>f.setAttribute('aria-invalid',String(!results[i])));
   const wrongFields=results.flatMap((ok,i)=>ok?[]:[i]);
   const guidance='Сверьте ограничения и вычисления.'+(updated.wrong>=2?' Можно открыть подсказку.':'');
   feedback(openResult?openResult.hint:`Проверьте поля ${wrongFields.map(i=>i+1).join(', ')}. ${guidance}`,'error');
   offerGraph(updated);
   if(review){
    const trace=document.getElementById('task-trace'),wasOpen=trace.querySelector('details')?.open;
    trace.innerHTML=recentTrace(updated,review);
    if(wasOpen)trace.querySelector('details').open=true;
   }
   proofBindings?.refreshProof(updated);
  }
 });
 bindSubmit('step-form',async()=>{
  const input=document.getElementById('step-answer'),raw=input.value,value=raw.trim();
  if(raw!==observedStep){observedStep=raw;await store.patch(task.id,s=>{while(s.drafts.steps.length<=displayedStep)s.drafts.steps.push('');s.drafts.steps[displayedStep]=raw;});}
  else await store.flush();
  const current=store.read(task.id),i=current.solvedSteps.length;if(i!==displayedStep){if(isCurrent())feedback('Этот шаг уже изменён в другой вкладке. Ваш ввод сохранён к прежнему шагу. Откройте заново «С опорой по шагам», чтобы увидеть текущий шаг.','error');return;}const step=task.steps[i];if(!step)return;
  const format=API.recognize(step,value,root.ProfileCheck);
  input.setAttribute('aria-invalid',String(!format.recognized));
  if(!format.recognized){if(isCurrent()){feedback(value?`Проверьте запись ответа. ${format.format} Это уточнение формата; попытка не засчитывается.`:'Введите ответ на текущий шаг. Пустое поле не считается ошибкой.','error');input.focus();}return;}
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
 bind('equation-next-hint','click',async()=>{await store.patch(task.id,s=>{s.helped=true;if(!s.hints.includes(98))s.hints.push(98);});await taskView(item,mode,viewVersion);if(isCurrent())feedback('Открыта вторая подсказка.');});
 if(mode==='guided'&&task.construction){
  const index=constructionIndex(task,r),question=task.construction[index];
  for(const button of main.querySelectorAll('[data-ray]'))button.onclick=async()=>{
   if(!isCurrent()||!question)return;
   if(Number(button.dataset.ray)!==question.answer){main.querySelector('[data-ray-feedback]').textContent=question.hint;return;}
   await store.patch(task.id,s=>{s.constructionStep=Math.max(s.constructionStep||0,index+1);});
   if(isCurrent()){await taskView(item,mode,viewVersion);main.querySelector('[data-ray], #step-answer')?.focus({preventScroll:true});}
  };
 }
 bind('show-solution','click',async()=>{await store.patch(task.id,s=>{s.helped=true;s.solution=true;s.solutionSteps=Math.max(1,s.solutionSteps);});await taskView(item,mode,viewVersion);if(!isCurrent())return;feedback('Разбор открыт; это условие отмечено как работа с опорой.');});
 bind('solution-next','click',async()=>{await store.patch(task.id,s=>{s.helped=true;s.solutionSteps=Math.min(task.solution.length,s.solutionSteps+1);});await taskView(item,mode,viewVersion);});
 main.querySelectorAll('.task-theory,.prerequisites,.earlier-final').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)store.patch(task.id,s=>{s.helped=true;});}));
}
function parameterProofProgress(){
 let drafts=0,reviewed=0,resume=null;
 for(const lesson of lessons.filter(lesson=>lesson.exam===19))for(const task of lesson.tasks){
  const review=proofReviewFor(lesson,task),r=store.read(task.id);
  if(!review||!hasFinalAttempt(r)||!r.drafts.proof.trim())continue;
  drafts++;
  if(reviewCount(review,r)===review.criteria.length)reviewed++;
  else if(!resume||r.updatedAt>resume.r.updatedAt)resume={task,r};
 }
 if(!drafts)return '';
 const continuation=resume?` <a href="${taskURL(resume.task.id,'independent')}">Вернуться к обоснованию</a>`:'';
 return `<section class="panel"><h2>Самопроверка обоснований · ${esc(labelFor(19))}</h2><p>Вы отметили все пункты в ${reviewed} из ${drafts} обоснований.${continuation}</p></section>`;
}
function progress(){
 const s=stats(lessons);
 const written=stats(financeLessons);
 main.innerHTML=`<a class="back" href="#map">← Все номера второй части</a><h1>Мой прогресс</h1><p>Все ${lessons.length} темы и ${s.total} условий этого курса, включая дополнительную оптимизацию.</p>${badges(s)}<p>Это результаты проверки ответов. Письменные обоснования автоматически не оцениваются. На проверку обоснования: <strong>${s.pending}</strong>.</p>${parameterProofProgress()}<section class="panel" aria-labelledby="finance-progress-title"><h2 id="finance-progress-title">№16 · Письменные финансовые задачи</h2>${badges(written)}<a href="#fipi/2027/16">К задачам и сохранённым решениям №16 →</a></section><div class="table-wrap"><table><thead><tr><th>Тема</th><th>Самостоятельные ответы</th><th>С опорой</th><th>Всего условий</th></tr></thead><tbody>${lessons.map(l=>{const a=stats([l]);return `<tr><td><a href="#lesson/${l.id}">${esc(labelFor(l.exam))} · ${esc(l.title)}</a></td><td>${a.independent} / ${l.tasks.slice(3).length}</td><td>${a.helped}</td><td>${a.total}</td></tr>`;}).join('')}</tbody></table></div><section class="panel"><h2>Как продолжить</h2><p>После помощи решите другое условие. После завершения темы вернитесь к ней через несколько дней и попробуйте объяснить способ без подсказок. Знакомый повтор не добавляет новое самостоятельное решение.</p><a class="button" href="#map">Выбрать номер</a></section>`;}
function missing(){main.innerHTML='<section class="panel"><h1>Такое условие не найдено</h1><p>Выберите тему из карты курса. Сохранённая работа остаётся в браузере.</p><a class="button" href="#map">Открыть карту</a></section>';}
async function render(){const version=++routeVersion;await store.flush();if(version!==routeVersion)return;const previous=active;active=null;if(labCleanup){labCleanup();labCleanup=null;}const route=root.location.hash.slice(1).split('/');if(!lessons.length||!examMap){main.innerHTML='<section class="panel"><h1>Не удалось загрузить темы</h1><p>Обновите страницу. Если ошибка остаётся, <a href="/ege-profil/">откройте прежние материалы курса</a>.</p></section>';return;}if(route[0]==='fipi'&&route[1]==='2027'){const entry=examMap.get(route[2]);if(entry?.legacyPartTwo)exam(entry.legacyPartTwo);else if(entry?.number===16)finance();else missing();}else if(route[0]==='topic'){const entry=examMap.topic(route[1]);if(entry?.legacyPartTwo&&!entry.number)exam(entry.legacyPartTwo);else missing();}else if(route[0]==='exam')exam(Number(route[1]));else if(route[0]==='lesson'&&byLesson.has(route[1]))lessonView(byLesson.get(route[1]));else if(route[0]==='task'&&byTask.has(route[1])){const item=byTask.get(route[1]),mode=modeLabels[route[2]]?route[2]:modeFor(item.index);await taskView(item,mode,version,previous);}else if(route[0]==='progress')progress();else if(!route[0]||route[0]==='map')home();else missing();const schoolHeading=main.querySelector('[data-school-title]');
 if(schoolHeading)schoolHeading.focus();
 else main.focus({preventScroll:true});
}
root.addEventListener('hashchange',async()=>{
 const hash=root.location.hash,[page,id]=hash.slice(1).split('/');
 const lessonId=page==='task'?byTask.get(id)?.lesson.id:page==='lesson'?id:'';
 await render();
 if(root.location.hash===hash&&((page==='exam'&&id==='19')||(page==='fipi'&&hash==='#fipi/2027/18')||Object.hasOwn(parameterGraphs,lessonId)))root.scrollTo(0,0);
});
root.addEventListener('storage',event=>{
 if(!event.key?.startsWith(API.PREFIX))return;
 if(!active){render();return;}
 const taskId=active.item.task.id;
 if(event.key===store.key(taskId)){const record=store.read(taskId);active.refreshProof?.(record);active.refreshEquation?.(record);}
 banner.hidden=false;
 banner.textContent='Работа обновлена в другой вкладке. Перед следующей проверкой будет прочитано свежее сохранение; текущий ввод остаётся на экране.';
});
root.ProfilePartTwoApp={render,store,lessons,financeLessons,byTask};render();
})(globalThis);
