(function () {
 'use strict';
 const registry=globalThis.EgeBazaRegistry, allProgress=globalThis.EgeBazaCourseState;
 let progress=allProgress;
 const main=document.getElementById('content'), notice=document.getElementById('storage-notice');
 const titles={today:'Сегодня',line:'Учебная линия',lines:'Учебные линии',task:'Задание ЕГЭ',map:'Все задания №1–21',foundation:'Вспомнить основу',progress:'Мой прогресс',teacher:'Преподавателю',backup:'Резервная копия'};
 const levels=['Начать знакомство','Тренируюсь','Решаю самостоятельно','Проверка пройдена','Подтверждено повторением'];
 const phases={diagnostic:'Стартовая проверка',checkpoint:'Итоговая проверка',repeat:'Повторение спустя сутки'};
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const link=(label,href,cls='')=>`<a class="btn ${cls}" href="${esc(href)}">${esc(label)}</a>`;
 const moduleHref=id=>'#module?module='+encodeURIComponent(id);
 const moduleLink=hash=>progress.meta.path+hash;
 const tag=status=>`<span class="tag ${status==='planned'?'planned':''}">${status==='planned'?'В плане':status==='available'?'Можно пройти':'Можно пройти · модуль'}</span>`;
 let first=registry.modules[0];
 let lastRaw, lastStatus, lastJourneySignature, disposePage=()=>{};
 function readState(){
  progress=allProgress.forModule(route().query.get('module')||'m01')||allProgress;
  first=registry.modules.find(m=>m.id===progress.meta.id);
  let raw=null,blocked=false;
  try{raw=localStorage.getItem(progress.KEY);}catch(e){blocked=true;}
  const s=progress.snapshot(raw);if(blocked)s.status='blocked';
  lastRaw=raw;lastStatus=s.status;
  notice.hidden=!['unreadable','blocked'].includes(s.status);
  notice.textContent=s.status==='blocked'?'Браузер не разрешил прочитать сохранение. Карта доступна, но результаты здесь показать не удалось.':s.status==='unreadable'?'Сохранение выбранного модуля не удалось прочитать. Ниже показан начальный маршрут; сохранённые данные навигатор не изменяет.':'';
  return s;
 }
 function route(){const hash=location.hash.slice(1), split=hash.indexOf('?');return {page:(split<0?hash:hash.slice(0,split))||'map',query:new URLSearchParams(split<0?'':hash.slice(split+1))};}
 function card(m){return `<article class="card" data-module="${m.id}"><div class="card-top"><span class="number">${m.number}</span>${tag(m.status)}</div><h3>${esc(m.title)}</h3><p>${esc(m.description)}</p><p class="positions">${m.lessons.length} тем · ${m.id==='m07'?'Смешанная практика по всем позициям':'Задания '+m.positions.join(', ')}</p><div class="actions">${link('Посмотреть темы',moduleHref(m.id),'secondary')}</div></article>`;}
 function today(s){
  const next=progress.recommend(s), actionLabel={resume:'Продолжить проверку',diagnostic:'К стартовой проверке',practice:'Продолжить практику',learn:'Открыть урок',checkpoint:'К итоговой проверке',repeat:'К повторной проверке',wait:'Посмотреть разбор',report:'Открыть отчёт',recovery:'Открыть модуль'}[next.kind];
  return `<section class="course-start"><span class="eyebrow">Базовый ЕГЭ · 2027</span><h1>Начни с задачи.</h1><p>Выбери номер и попробуй решить. Если трудно, нажми «Хочешь подсказку?» — объяснение и модель откроются рядом.</p><div class="actions">${link('Выбрать задание 1–21','path/index.html#map')}${link('Попробовать первую задачу','path/index.html#lesson=round','secondary')}</div><p class="small">Ответ, вычисления и выполненные шаги остаются на месте, когда ты открываешь или убираешь помощь.</p></section>
  <div class="chip-list"><a href="path/index.html#foundation">Вспомнить дроби и проценты</a><a href="path/index.html#report">Мои решения</a><a href="#map">Учебные модули</a></div>
  <details class="course-more course-recommendation" ${next.kind==='resume'?'open':''}><summary>Мои уроки и проверки</summary><section class="today-card" data-recommendation="${next.kind}"><div class="today-icon" aria-hidden="true">↗</div><div><span class="eyebrow">Модуль ${first.number}</span><h2>${esc(next.title)}</h2><p>${esc(next.reason)}</p>${next.kind==='wait'?`<p class="small">Повторение доступно с ${esc(new Date(s.repeatAt).toLocaleString('ru-RU'))} по часам этого устройства.</p>`:''}<div class="actions">${link(actionLabel,moduleLink(next.hash))}${link('Выбрать тему',moduleHref(first.id),'secondary')}</div>${next.minutes?`<p class="time">Ориентир: ${next.minutes}</p>`:''}</div></section><div class="helper"><p><a href="path/index.html#diagnostic">Проверить свои навыки</a> · <a href="path/index.html#exam">Пробная работа</a></p></div></details>`;
 }
 function map(){return `<span class="eyebrow">От основ к экзамену</span><h1>Карта курса</h1><p class="page-intro">Семь модулей и 32 учебных входа: объяснения, модели, практика и проверка. Для всех позиций 1–21 есть задания; полнота всех экзаменационных подтипов ещё не подтверждена.</p><div class="chip-list"><a href="#foundation">Подготовительные тренажёры</a><a href="#progress">Результаты модулей</a></div><div class="section-head"><h2>Учебные модули</h2><p>Выбирайте тему вместе с преподавателем</p></div><div class="cards">${registry.modules.map(card).join('')}</div>`;}
 // The journey reads existing stores; it never rewrites a learner's work.
 const journeyLabels={completed:'Проверка завершена',unstarted:'Ещё не начато',started:'Знакомлюсь',guided:'С поддержкой',independent:'Самостоятельно',confirmed:'Проверка пройдена',repeated:'Подтверждено повторением','need-review':'Нужно повторить',unknown:'Результаты недоступны'};
 const lineHref=id=>'#line?line='+encodeURIComponent(id);
 const journeyBadge=item=>`<span class="journey-status journey-status-${esc(item.status)}">${esc(journeyLabels[item.status]||'Результаты недоступны')}</span>`;
 function lineProgress(line){
  if(line.id==='m07')return `<div class="journey-checks">${line.items.map(item=>`<span>${esc(item.title)}: ${esc(journeyLabels[item.status]||'Результаты недоступны')}</span>`).join('')}</div>`;
  if(line.independent===null||line.started===null)return '<p class="journey-unavailable">Результаты этой практики сейчас недоступны. Сохранённая работа не изменена.</p>';
  return `<div class="journey-meter"><div><strong>${line.independent} из ${line.total}</strong><span> тем — есть самостоятельное решение</span></div><progress max="${line.total}" value="${line.independent}" aria-label="${esc(line.title)}: ${line.independent} из ${line.total} тем с самостоятельным решением"></progress><span class="small muted">Начато тем: ${line.started}</span></div>`;
 }
 function legacyLineProgress(line){
  return (line.groups||[]).filter(group=>group.source!=='path'&&line.id!=='m07'&&(group.started||group.started===null||group.items.some(item=>item.status==='unknown'))).map(group=>`<p class="journey-legacy-count">Учебные уроки: ${group.started===null?'результаты недоступны':`начато ${group.started} из ${group.total}${group.confirmed?`, проверкой подтверждено ${group.confirmed}`:''}`}.</p>`).join('');
 }
 function journeyCard(line){
  const m=registry.modules.find(m=>m.id===line.id);
  return `<article class="card journey-card" data-line="${line.id}"><div class="card-top"><span class="number">${m.number}</span><span class="tag">${line.id==='m07'?'Проверки':'Учебная линия'}</span></div><h3><a href="${lineHref(line.id)}">${esc(line.title)}</a></h3><p>${esc(m.description)}</p>${lineProgress(line)}${legacyLineProgress(line)}<div class="actions">${link('Открыть линию',lineHref(line.id),'secondary')}</div></article>`;
 }
 function legacyPanel(s){
  const next=progress.recommend(s), actionLabel={resume:'Продолжить проверку',diagnostic:'К стартовой проверке',practice:'Продолжить практику',learn:'Открыть урок',checkpoint:'К итоговой проверке',repeat:'К повторной проверке',wait:'Посмотреть разбор',report:'Открыть отчёт',recovery:'Открыть модуль'}[next.kind];
  return `<details class="course-more course-recommendation"><summary>Объяснения и проверки по основам</summary><section class="today-card" data-recommendation="${next.kind}"><div class="today-icon" aria-hidden="true">↗</div><div><span class="eyebrow">Модуль ${first.number}</span><h2>${esc(next.title)}</h2><p>${esc(next.reason)}</p><div class="actions">${link(actionLabel,moduleLink(next.hash))}${link('Выбрать тему',moduleHref(first.id),'secondary')}</div></div></section>${moduleChoices('today')}</details>`;
 }
 function journeyToday(s,j){
  const next=j.recommendation;
  return `<section class="course-start journey-start"><span class="eyebrow">Базовый ЕГЭ · 2027</span><h1>Твой следующий шаг</h1><p class="journey-next-title">${esc(next.title)}</p><p class="journey-reason">${esc(next.reason)}</p><div class="actions">${link(next.label,next.href,'journey-continue')}${link('Все задания №1–21','#map','secondary')}</div></section><div class="section-head"><h2>Подготовка по номерам ЕГЭ</h2><a href="#progress">Весь прогресс →</a></div>${examJump(examCatalog(j))}${examCards(j)}${secondaryLines(j)}<p class="journey-caption">Самостоятельное решение — новый вариант без подсказки. Продвигайся в своём темпе; к трудной теме можно вернуться.</p>${legacyPanel(s)}`;
 }
 function journeyLines(j){
  return `<a class="back" href="#map">← Все задания №1–21</a><h1 class="journey-line-title">Учебные линии</h1><p class="page-intro">Семь учебных линий. В каждой видны начатые темы и самостоятельные решения.</p><div class="chip-list"><a href="#today">Мой следующий шаг</a><a href="#foundation">Вспомнить основу</a><a href="#progress">Мой прогресс</a></div><div class="cards journey-lines">${j.lines.map(journeyCard).join('')}</div><details class="course-more journey-legacy"><summary>32 учебных входа: объяснения и основы</summary><div class="cards">${registry.modules.map(card).join('')}</div></details><p class="journey-caption">Для позиций 1–21 есть учебные задания. Карта не означает полного покрытия всех экзаменационных подтипов.</p>`;
 }
 function examCatalog(j){return globalThis.EgeBazaExamMap?.catalog(j)||[];}
 function examJump(tasks,current){
  return `<nav class="exam-jump" aria-label="Номера заданий ЕГЭ база">${tasks.map(task=>`<a href="${esc(task.href)}" data-exam-jump="${task.pos}" aria-label="Задание №${task.pos}: ${esc(task.title)}"${task.pos===current?' aria-current="page"':''}>${task.pos}</a>`).join('')}</nav>`;
 }
 function examAction(task,j){
  const canResume=j.sources?.path?.resumeCompatible!==false;
  const item=(canResume&&task.items.find(item=>item.resume))||task.items.find(item=>item.independent!==true)||task.items[0];
  if(!item)return '';
  const label=!canResume||item.status==='unknown'?'Открыть задачу':item.resume?'Продолжить':task.independent===task.total?'Потренироваться ещё':'Начать подготовку';
  return link(label,item.resumeHref||item.href,'exam-start');
 }
 function examCard(task,j){
  return `<article class="card exam-card" data-exam-position="${task.pos}"><div class="card-top"><span class="exam-number">№${task.pos}</span><span class="tag">Тренажёров: ${task.total}</span></div><h2><a href="${esc(task.href)}">${esc(task.title)}</a></h2><p>${esc(task.description)}</p>${lineProgress(task)}<div class="actions">${examAction(task,j)}${link('Все темы номера',task.href,'secondary exam-topics')}</div></article>`;
 }
 function examCards(j){
  const tasks=examCatalog(j);
  return tasks.length?`<div class="cards exam-cards">${tasks.map(task=>examCard(task,j)).join('')}</div>`:'<p class="helper">Карта номеров не загрузилась. <a href="path/index.html#map">Открой задания №1–21 в тренажёре</a>.</p>';
 }
 function secondaryLines(j){
  return `<details class="course-more journey-legacy"><summary>Учебные линии и результаты прежних уроков</summary><p class="small muted">Можно повторять материал по большим темам. Результаты прежних уроков показаны отдельно.</p><div class="cards journey-lines">${j.lines.map(journeyCard).join('')}</div><div class="actions">${link('Открыть учебные линии','#lines','secondary')}</div></details>`;
 }
 function journeyMap(j){
  const tasks=examCatalog(j),total=tasks.reduce((sum,task)=>sum+task.total,0);
  return `<section class="exam-heading"><span class="eyebrow">Математика · базовый ЕГЭ · 2027</span><h1>Все задания №1–21</h1><p class="page-intro">Выбери номер экзамена: разбери способ решения, потренируйся с подсказками и проверь себя.</p>${examJump(tasks)}<div class="chip-list"><a class="exam-extra" href="#today">Продолжить обучение</a><a href="path/index.html#diagnostic">Диагностика</a><a href="path/index.html#exam">Пробный ЕГЭ</a><a class="exam-extra" href="#progress">Мой прогресс</a></div></section><div class="section-head"><h2>21 тип заданий</h2><p>${total} тренажёров с вариантами и помощью по шагам</p></div>${examCards(j)}<details class="course-more journey-key"><summary>Что входит в курс</summary><p>Доступны задания №1–21. Внутри каждого номера — доступные темы и варианты задач; банк продолжаем дополнять подтипами. Отметка о самостоятельном решении относится к конкретной теме, а не ко всему номеру экзамена.</p><a href="sources/index.html">Источники и структура экзамена</a></details>${secondaryLines(j)}`;
 }
 function examTask(query,j){
  const tasks=examCatalog(j),task=tasks.find(task=>String(task.pos)===query.get('pos'));if(!task)return missing();
  document.title='Задание №'+task.pos+': '+task.title+' · ЕГЭ база 2027 · MathExam';
  const next=tasks.find(item=>item.pos===task.pos+1);
  return `<section data-exam-task="${task.pos}"><a class="back" href="#map">← Все задания №1–21</a><span class="eyebrow journey-line-eyebrow">ЕГЭ база · задание №${task.pos}</span><h1 class="journey-line-title">${esc(task.title)}</h1><p class="page-intro">${esc(task.description)}</p><section class="panel journey-line-summary">${lineProgress(task)}<div class="actions">${examAction(task,j)}${link('Вспомнить основу','#foundation','secondary')}</div><p class="small muted">Начни с задачи. Объяснение, модель и пошаговая помощь открываются рядом по запросу.</p></section><div class="section-head"><h2>Темы задания №${task.pos}</h2><p>Выбери нужный тренажёр</p></div>${journeyRows(task.items,j.sources?.path?.resumeCompatible!==false)}<div class="actions">${link('Все задания №1–21','#map','secondary')}${next?link('Следующий номер: №'+next.pos,next.href,'secondary'):link('Попробовать целый вариант','path/index.html#exam','secondary')}</div>${examJump(tasks,task.pos)}</section>`;
 }
 function journeyRows(items,canResume=true){
  return `<ol class="journey-steps">${items.map((item,i)=>`<li class="journey-step" data-journey-item="${esc(item.id)}"><span class="journey-step-number" aria-hidden="true">${i+1}</span><div><a class="journey-step-title" href="${esc(item.href)}">${esc(item.title)}</a>${journeyBadge(item)}${item.result?`<span class="small journey-result">Верных ответов: ${item.result.correct} из ${item.result.total}.${item.result.assisted?' С обращением к обучению.':''}${item.result.interrupted?' Завершена досрочно.':''}</span>`:''}${item.resume?'<span class="small journey-resume">Есть незавершённая работа</span>':''}</div>${link(item.source==='path'&&!canResume?'Открыть задачу':item.resume?'Продолжить':item.started?'Открыть':'Начать',item.resumeHref||item.href,'secondary')}</li>`).join('')}</ol>`;
 }
 function journeyLine(query,j){
  const line=j.lines.find(line=>line.id===query.get('line'));if(!line)return missing();
  const m=registry.modules.find(m=>m.id===line.id),next=line.next;
  document.title=line.title+' · ЕГЭ база 2027 · MathExam';
  const groups=line.groups?.length?line.groups:[{source:'path',title:line.id==='m07'?'Проверить свои навыки':'Практика по темам',items:line.items}];
  return `<a class="back" href="#lines">← Все учебные линии</a><span class="eyebrow journey-line-eyebrow">Линия ${m.number} · ${line.id==='m07'?'Экзаменационная практика':'Задания '+m.positions.join(', ')}</span><h1 class="journey-line-title">${esc(line.title)}</h1><p class="page-intro">${esc(m.description)}</p><section class="panel journey-line-summary">${lineProgress(line)}${legacyLineProgress(line)}${next?`<div class="actions">${link(next.label,next.href,'journey-continue')}</div><p class="small muted">${esc(next.reason)}</p>`:''}</section>${groups.map(group=>group.source==='path'||line.id==='m07'?`<section class="journey-group"><h2>${esc(group.title)}</h2>${journeyRows(group.items,j.sources?.path?.resumeCompatible!==false)}</section>`:`<details class="course-more journey-legacy" ${group.items.some(item=>item.started||item.status==='unknown')?'open':''}><summary>Уроки с объяснениями и проверкой</summary><p class="small muted">Здесь сохранены результаты учебных уроков. Они учитываются отдельно от практики по типам задач выше.</p>${journeyRows(group.items,j.sources?.path?.resumeCompatible!==false)}<div class="actions">${link('Подробный отчёт','#progress?module='+group.source,'secondary')}${link('Сохранить работу','#backup?module='+group.source,'secondary')}</div></details>`).join('')}<div class="actions">${link('Объяснения и необходимые основы',moduleHref(line.id),'secondary')}${link('Вспомнить основу','#foundation','secondary')}</div>`;
 }
 function journeyProgress(j){
  const practice=j.lines.filter(line=>line.id!=='m07'),complete=practice.every(line=>line.independent!==null&&line.started!==null),total=practice.reduce((n,line)=>n+line.total,0),independent=practice.reduce((n,line)=>n+(line.independent||0),0),started=practice.reduce((n,line)=>n+(line.started||0),0);
  return `<span class="eyebrow">Результаты этого браузера</span><h1>Мой прогресс</h1><p class="page-intro">Результаты по всем заданиям №1–21. Один самостоятельный ответ — шаг вперёд, а не подтверждение готовности ко всему экзамену.</p>${j.status==='empty'?'<p class="helper">Пока нет сохранённой работы. Начни с одной темы — здесь появятся твои результаты.</p>':''}${complete?`<div class="progress-grid journey-totals"><div class="stat"><p class="big-stat">${started}<small> / ${total}</small></p><p class="stat-label">Тем начато</p></div><div class="stat"><p class="big-stat">${independent}<small> / ${total}</small></p><p class="stat-label">Тем с новым самостоятельным решением</p></div></div>`:'<p class="helper">Общий итог сейчас неполный. Доступные результаты показаны по номерам; недоступные не считаются нулевыми.</p>'}<details class="course-more journey-key"><summary>Как читать отметки</summary><p>«С поддержкой» — работа с объяснением или исправлением. «Самостоятельно» — есть верный первый ответ на новое условие без помощи. Проверка и повторение отмечаются отдельно в первых учебных модулях. Проценты готовности к экзамену здесь не вычисляются.</p></details>${examJump(examCatalog(j))}${examCards(j)}${secondaryLines(j)}<div class="actions">${link('Продолжить учиться','#today')}<button class="btn secondary" type="button" data-refresh>Обновить результаты</button></div><p id="refresh-status" class="small muted" role="status"></p><details class="course-more journey-legacy"><summary>Подробные отчёты и сохранение работы</summary><div class="chip-list"><a href="#progress?module=m01">Числа, деньги и проценты</a><a href="#progress?module=m02">Данные, графики и логика</a><a href="path/index.html#report">Все решения нового маршрута</a></div><p class="small muted">Результаты относятся к этому браузеру. Автоматической отправки нет. Для переноса работы используй резервную копию в соответствующем отчёте.</p></details>`;
 }
 function prerequisite(id,from){
  const resource=registry.prerequisites.find(x=>x.id===id);
  if(resource)return `<a href="#foundation?skill=${id}&from=${from}">${esc(resource.title)}</a>`;
  const m=registry.modules.find(x=>x.lessons.some(l=>l.id===id)),lesson=m?.lessons.find(l=>l.id===id);
  return lesson?`<a href="${moduleHref(m.id)}&lesson=${id}">${esc(lesson.title)}${lesson.status==='planned'?' · в плане':''}</a>`:'';
 }
 function modulePage(query,s){
  const m=registry.modules.find(x=>x.id===query.get('module'));if(!m)return missing();
  document.title=m.title+' · ЕГЭ база 2027 · MathExam';
  return `<a class="back" href="#map">← Карта курса</a><div class="module-heading"><span class="number">${m.number}</span><div>${tag(m.status)}<h1>${esc(m.title)}</h1></div></div><p class="page-intro">${esc(m.description)}</p><p class="page-intro small">${m.id==='m07'?'Смешанная практика: позиции 1–21.':'Связь с экзаменом: задания '+m.positions.join(', ')+'.'} Перечень тем ещё предстоит дополнить всеми подтипами.</p>
  ${m.status==='available'?`<div class="actions">${link('Начать с первой темы',m.lessons[0].href)}${link('Диагностика 1–21','path/index.html#diagnostic','secondary')}</div>`:m.status==='prototype'?`<div class="actions">${link('Открыть модуль',moduleLink('#map'))}${link('Проверки модуля',moduleLink('#checks'),'secondary')}</div>`:'<div class="helper">Эти уроки ещё готовятся. Сейчас можно посмотреть их цели и необходимые основы.</div>'}
  <div class="lesson-list">${m.lessons.map((l,i)=>{const st=s.skills.find(x=>x.id===l.skill);return `<article class="lesson${query.get('lesson')===l.id?' selected':''}" id="${l.id}"><span class="lesson-order">${String(i+1).padStart(2,'0')}</span><div><h2>${esc(l.title)}</h2><p>${esc(l.goal)}</p>${l.prerequisites.length?`<p class="small">Пригодится перед уроком:</p><div class="prereqs">${l.prerequisites.map(id=>prerequisite(id,m.id)).join('')}</div>`:''}${st?`<p class="small">${esc(levels[st.level])} · практика ${st.done}/4</p>`:''}</div><div class="lesson-action">${tag(l.status)}${l.href?`<br>${link('Открыть урок',l.href,'secondary')}`:''}</div></article>`;}).join('')}</div>`;
 }
 function foundation(query){
  const routeGroups={'p-signs':'signed','p-order':'numbers','p-fraction':'fractions','p-common':'fractions','p-decimal':'decimals','p-proportion':'percent'};
  const routeQuery='?from=ege'+(query.get('skill')?'&skill='+encodeURIComponent(query.get('skill')):'')+(query.get('from')?'&module='+encodeURIComponent(query.get('from')):'');
  const selected=registry.prerequisites.find(x=>x.id===query.get('skill')),from=registry.modules.find(x=>x.id===query.get('from'));
  const ordered=selected?[selected,...registry.prerequisites.filter(x=>x!==selected)]:registry.prerequisites;
  return `${from?`<a class="back" href="${moduleHref(from.id)}">← Вернуться: ${esc(from.title)}</a>`:'<span class="eyebrow">Короткое ответвление от курса</span>'}<h1>Вспомнить основу</h1><p class="page-intro">Выберите конкретный пробел. После тренировки вернитесь к основной теме и попробуйте применить навык.</p><section class="helper foundation-route-entry"><b>Полный курс основ: карты и несколько тренажёров</b><p>12 разделов, короткие занятия и отдельные самостоятельные проверки. Можно начать с нужного навыка и вернуться к этой теме ЕГЭ.</p><a class="btn" href="${esc('/foundations/'+routeQuery+(selected?'#topic='+routeGroups[selected.id]:'#course'))}">Открыть карту основ →</a></section><div class="helper"><b>Существующие тренажёры сайта</b><p>Откроются в новой вкладке. Их результаты пока не прибавляются к прогрессу этого курса. Эта вкладка сохранит путь назад. Во время самостоятельной проверки сначала завершите работу, затем обращайтесь к объяснениям.</p></div><div class="section-head"><h2>${selected?'Начните с нужного навыка':'Что повторить'}</h2></div><div class="cards">${ordered.map(r=>`<article class="card resource${r===selected?' selected':''}" data-resource="${r.id}"><span class="tag">Отдельный тренажёр</span><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p><div class="actions"><a class="btn" href="${esc('/foundations/'+routeQuery+'#topic='+routeGroups[r.id])}">Карта темы и несколько подходов →</a><a class="btn secondary" href="${esc(r.href)}" target="_blank" rel="noopener">Открыть в новой вкладке</a></div></article>`).join('')}</div>`;
 }
 function progressPage(s){
  if(['unreadable','blocked'].includes(s.status))return '<span class="eyebrow">Результаты этого браузера</span><h1>Мой прогресс</h1><p class="page-intro">Результаты сейчас недоступны. Это не означает, что вы ничего не решали. Откройте выбранный модуль, чтобы проверить сохранённую работу.</p><div class="actions">'+link('Открыть модуль',moduleLink('#report'))+link('Восстановить из копии','#backup?module='+first.id,'secondary')+'</div>';
  return `<span class="eyebrow">Результаты этого браузера</span><h1>Мой прогресс</h1><p class="page-intro">Здесь только модуль «${esc(first.title)}». Эти показатели не означают готовность ко всему ЕГЭ.</p>${s.status==='empty'?'<div class="helper">Пока нет сохранённой работы. Начните с выбранного модуля — сюда попадут его результаты.</div>':''}<div class="progress-grid"><div class="stat"><p class="big-stat" data-stat="solved">${s.solved}<small> / ${s.skills.length*4}</small></p><p class="stat-label">Решено в практике</p></div><div class="stat"><p class="big-stat" data-stat="independent">${s.independent}<small> / ${s.skills.length*4}</small></p><p class="stat-label">С первого раза, без помощи</p></div><div class="stat"><p class="big-stat" data-stat="confirmed">${s.confirmed}<small> / ${s.skills.length}</small></p><p class="stat-label">Навыков подтверждено проверкой</p></div></div><div class="two"><section class="panel"><h2>Навыки модуля</h2><div class="status-list">${s.skills.map(x=>`<div class="status-row"><a href="${moduleLink('#learn-'+x.id)}">${esc(first.lessons.find(l=>l.skill===x.id).title)}</a><span>${esc(levels[x.level])}<br>Практика: ${x.done}/4</span></div>`).join('')}</div></section><section class="panel"><h2>Проверки</h2><div class="status-list">${Object.entries(phases).map(([id,title])=>{const r=s.runs[id];return `<div class="status-row" data-phase="${id}"><b>${title}</b><span>${r.finished?`${r.correct} из ${r.total}<br>${r.helped?'С обращением к обучению':'Без подсказок внутри модуля'}`:r.started?`Не завершена<br>Ответов ${r.count} из ${r.total}`:'Ещё не начата'}</span></div>`;}).join('')}</div><p class="small muted">Стартовая проверка помогает выбрать тему. Подтверждение навыка даёт только итог или повторение.</p></section></div><div class="actions">${link('Открыть отчёт модуля',moduleLink('#report'))}${link('Сохранить или восстановить работу','#backup?module='+first.id,'secondary')}<button class="btn secondary" type="button" data-refresh>Обновить результаты</button></div><p id="refresh-status" class="small muted" role="status"></p><div class="helper"><b>Как передать результат преподавателю</b><p>В отчёте выбранного модуля можно скачать или скопировать текст. Автоматической отправки нет. Прогресс зависит от браузера и устройства; для переноса работы скачайте резервную копию.</p></div>`;}
 function teacher(){return `<span class="eyebrow">Работа в мини-группе</span><h1>Преподавателю</h1><p class="page-intro">Навигатор помогает держать общий маршрут и выбирать короткие задания для восполнения индивидуальных пробелов.</p><div class="two"><section class="panel"><h2>Один учебный цикл</h2><ol><li>Ученик проходит стартовую проверку и передаёт отчёт.</li><li>Вы выбираете общую тему занятия и необходимые основы для каждого.</li><li>Дома — короткое объяснение и пробная практика. В группе — обсуждение способов и причин ошибок.</li><li>После практики — самостоятельная проверка на другом наборе.</li><li>Не раньше чем через сутки — повторение и обсуждение того, что ещё не закрепилось.</li></ol></section><section class="panel"><h2>Что доступно сейчас</h2><p>В новом маршруте — 111 тренажёров с вариантами, диагностика и пробная работа по позициям 1–21. Общая <a href="#map">карта заданий №1–21</a> собирает их результаты вместе с ранними модулями. Подробный <a href="path/index.html#report">отчёт нового маршрута</a> остаётся доступен. В первом модуле — шесть навыков и 60 заданий; во втором — четыре навыка и 40 заданий. В каждом есть модели и отдельные проверочные наборы. Сохранение и отчёт относятся к одному браузеру.</p><p>В <a href="https://mathexam-board-ladynata.msk1.amvera.tech/learning/">личном кабинете</a> доступны постоянная история ученика, задания и групповая доска. Ранее начатые самостоятельные модули в этом навигаторе продолжают хранить результаты в этом браузере. Их резервную копию можно скачать и восстановить через «Мой прогресс».</p><div class="actions">${allProgress.modules.map(id=>link('Сценарий модуля '+registry.modules.find(m=>m.id===id).number,allProgress.forModule(id).meta.path+'#teacher','secondary')).join('')}</div></section></div><div class="helper"><b>Как читать показатели</b><p>Решённая с подсказкой задача остаётся полезной практикой. Для самостоятельности учитываются первая попытка без помощи и отдельная проверка. Два проверочных вопроса на навык — ориентир для беседы, а не исчерпывающая диагностика.</p></div>`;}
 function rootBackup(){return globalThis.EgeBazaBackupUI.html(first.id);}
 function moduleChoices(page){return '<nav class="chip-list module-choices" aria-label="Выбор модуля">'+allProgress.modules.map(id=>{const m=registry.modules.find(x=>x.id===id);return '<a href="#'+page+'?module='+id+'" '+(id===first.id?'aria-current="true"':'')+'>'+esc(m.number+' · '+m.title)+'</a>';}).join('')+'</nav>';}
 function missing(){return '<h1>Раздел не найден</h1><p class="page-intro">Выберите нужный модуль на карте курса.</p><div class="actions">'+link('К карте курса','#map')+'</div>';}
 function render(focus=false){
  disposePage();disposePage=()=>{};
  const s=readState(),r=route(),j=globalThis.EgeBazaJourney?.snapshot();
  lastJourneySignature=j?JSON.stringify(j):null;
  if(['today','progress','backup'].includes(r.page)&&r.query.has('module')&&!allProgress.forModule(r.query.get('module')))r.page='missing';
  const unified=j&&(['map','line','lines','task'].includes(r.page)||['today','progress'].includes(r.page)&&!r.query.has('module'));
  if(unified){
   const pathResumeUnavailable=j.sources?.path?.resumeCompatible===false;
   notice.hidden=['saved','empty'].includes(j.status)&&!pathResumeUnavailable;
   notice.textContent=j.status==='blocked'?'Браузер не разрешил прочитать результаты. Темы можно открывать; сохранённая работа не изменена.':pathResumeUnavailable?'Точное продолжение практики сейчас не подтверждено. Доступные результаты показаны ниже; сохранённые данные не изменены.':j.status==='partial'?'Часть результатов сейчас недоступна. Доступные показаны ниже; сохранённая работа не изменена.':'Сохранённые результаты не удалось прочитать. Это не означает, что ты ничего не решал.';
  }
  document.title=(titles[r.page]||'Модуль')+' · Базовый ЕГЭ 2027 · MathExam';
  main.innerHTML=r.page==='today'?(unified?journeyToday(s,j):today(s)):r.page==='map'?(j?journeyMap(j):map()):r.page==='task'&&j?examTask(r.query,j):r.page==='lines'&&j?journeyLines(j):r.page==='line'&&j?journeyLine(r.query,j):r.page==='module'?modulePage(r.query,s):r.page==='foundation'?foundation(r.query):r.page==='progress'?(unified?journeyProgress(j):progressPage(s)):r.page==='teacher'?teacher():r.page==='backup'?rootBackup():missing();
  if(['today','progress','backup'].includes(r.page)&&!unified)main.insertAdjacentHTML('afterbegin',moduleChoices(r.page));
  if(r.page==='backup')disposePage=globalThis.EgeBazaBackupUI.mount(main,first.id);
  document.querySelectorAll('[data-nav]').forEach(a=>{if(['today','progress'].includes(a.dataset.nav))a.href=j?'#'+a.dataset.nav:'#'+a.dataset.nav+'?module='+first.id;if(a.dataset.nav===(r.page==='task'?'map':['module','line'].includes(r.page)?'lines':r.page==='backup'?'progress':r.page))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(focus){main.focus({preventScroll:true});main.scrollIntoView({block:'start'});}
 }
 // Refresh only after a change; do not discard a selection while reading a line.
 function refreshIfChanged(){
  if(route().page==='backup')return;
  if(globalThis.EgeBazaJourney){if(JSON.stringify(globalThis.EgeBazaJourney.snapshot())!==lastJourneySignature)render();return;}
  let raw;try{raw=localStorage.getItem(progress.KEY);}catch(e){if(lastStatus!=='blocked')render();return;}
  if(raw!==lastRaw||lastStatus==='blocked'||route().page==='today')render();
 }
 document.addEventListener('click',event=>{
  const a=event.target.closest('a');if(a?.getAttribute('href')==='#content'){event.preventDefault();main.focus();return;}
  if(event.target.closest('[data-refresh]')){render();main.querySelector('[data-refresh]')?.focus();document.getElementById('refresh-status').textContent='Результаты обновлены.';}
 });
 addEventListener('hashchange',()=>render(true));
 addEventListener('storage',event=>{if(event.key==='mathexam.ege-baza.path.v1'||allProgress.modules.some(id=>event.key===allProgress.forModule(id).KEY)||event.key===null)refreshIfChanged();});
 addEventListener('pageshow',refreshIfChanged);addEventListener('focus',refreshIfChanged);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshIfChanged();});
 render();
})();
