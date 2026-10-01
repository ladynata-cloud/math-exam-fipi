(function () {
 'use strict';
 const registry=globalThis.EgeBazaRegistry, allProgress=globalThis.EgeBazaCourseState;
 let progress=allProgress;
 const main=document.getElementById('content'), notice=document.getElementById('storage-notice');
 const titles={today:'Сегодня',map:'Карта курса',foundation:'Вспомнить основу',progress:'Мой прогресс',teacher:'Преподавателю',backup:'Резервная копия'};
 const levels=['Начать знакомство','Тренируюсь','Решаю самостоятельно','Проверка пройдена','Подтверждено повторением'];
 const phases={diagnostic:'Стартовая проверка',checkpoint:'Итоговая проверка',repeat:'Повторение спустя сутки'};
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const link=(label,href,cls='')=>`<a class="btn ${cls}" href="${esc(href)}">${esc(label)}</a>`;
 const moduleHref=id=>'#module?module='+encodeURIComponent(id);
 const moduleLink=hash=>progress.meta.path+hash;
 const tag=status=>`<span class="tag ${status==='planned'?'planned':''}">${status==='planned'?'В плане':status==='available'?'Можно пройти':'Можно пройти · модуль'}</span>`;
 let first=registry.modules[0];
 let lastRaw, lastStatus, disposePage=()=>{};
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
 function route(){const hash=location.hash.slice(1), split=hash.indexOf('?');return {page:(split<0?hash:hash.slice(0,split))||'today',query:new URLSearchParams(split<0?'':hash.slice(split+1))};}
 function card(m){return `<article class="card" data-module="${m.id}"><div class="card-top"><span class="number">${m.number}</span>${tag(m.status)}</div><h3>${esc(m.title)}</h3><p>${esc(m.description)}</p><p class="positions">${m.lessons.length} тем · ${m.id==='m07'?'Смешанная практика по всем позициям':'Задания '+m.positions.join(', ')}</p><div class="actions">${link('Посмотреть темы',moduleHref(m.id),'secondary')}</div></article>`;}
 function today(s){
  const next=progress.recommend(s), actionLabel={resume:'Продолжить проверку',diagnostic:'К стартовой проверке',practice:'Продолжить практику',learn:'Открыть урок',checkpoint:'К итоговой проверке',repeat:'К повторной проверке',wait:'Посмотреть разбор',report:'Открыть отчёт',recovery:'Открыть модуль'}[next.kind];
  return `<section class="hero"><div><span class="eyebrow">Базовый ЕГЭ · Ваш маршрут</span><h1>Понятная математика.<br>Шаг за шагом.</h1><p>Сначала найдём точку старта. Затем — короткий урок, практика и проверка того, что получается самостоятельно.</p></div><div class="hero-art" aria-label="Учебный цикл"><div class="art-line"><span class="art-num">01</span><div><strong>Понять</strong>Разобрать идею</div></div><div class="art-line"><span class="art-num">02</span><div><strong>Попробовать</strong>Решить и исправить</div></div><div class="art-line"><span class="art-num">03</span><div><strong>Закрепить</strong>Вернуться спустя время</div></div></div></section>
  <section class="today-card" data-recommendation="${next.kind}"><div class="today-icon" aria-hidden="true">↗</div><div><span class="eyebrow">Сегодня · Модуль ${first.number}</span><h2>${esc(next.title)}</h2><p>${esc(next.reason)}</p>${next.kind==='wait'?`<p class="small">Повторение доступно с ${esc(new Date(s.repeatAt).toLocaleString('ru-RU'))} по часам этого устройства.</p>`:''}<div class="actions">${link(actionLabel,moduleLink(next.hash))}${link('Выбрать тему',moduleHref(first.id),'secondary')}</div>${next.minutes?`<p class="time">Ориентир: ${next.minutes}</p>`:''}</div></section>
  <div class="helper"><b>Готовы посмотреть весь маршрут?</b><p><a href="path/index.html#diagnostic">Диагностика 1–21</a> · <a href="path/index.html#map">Новые уроки и модели</a> · <a href="path/index.html#report">Отчёт по новому маршруту</a></p></div><div class="section-head"><h2>Куда идём дальше</h2><a href="#map">Вся карта курса →</a></div><div class="cards">${registry.modules.slice(0,2).map(card).join('')}</div>
  <div class="helper"><b>Если мешает пробел в основе</b><p>У каждой темы есть связи с нужными навыками. Откройте короткий тренажёр, разберитесь и вернитесь к уроку.</p><p><a href="#foundation">Вспомнить основу →</a></p></div>`;
 }
 function map(){return `<span class="eyebrow">От основ к экзамену</span><h1>Карта курса</h1><p class="page-intro">Семь модулей и 32 учебных входа: объяснения, модели, практика и проверка. Для всех позиций 1–21 есть задания; полнота всех экзаменационных подтипов ещё не подтверждена.</p><div class="chip-list"><a href="#foundation">Подготовительные тренажёры</a><a href="#progress">Результаты модулей</a></div><div class="section-head"><h2>Учебные модули</h2><p>Выбирайте тему вместе с преподавателем</p></div><div class="cards">${registry.modules.map(card).join('')}</div>`;}
 function prerequisite(id,from){
  const resource=registry.prerequisites.find(x=>x.id===id);
  if(resource)return `<a href="#foundation?skill=${id}&from=${from}">${esc(resource.title)}</a>`;
  const m=registry.modules.find(x=>x.lessons.some(l=>l.id===id)),lesson=m?.lessons.find(l=>l.id===id);
  return lesson?`<a href="${moduleHref(m.id)}&lesson=${id}">${esc(lesson.title)}${lesson.status==='planned'?' · в плане':''}</a>`:'';
 }
 function modulePage(query,s){
  const m=registry.modules.find(x=>x.id===query.get('module'));if(!m)return missing();
  document.title=m.title+' · Базовый ЕГЭ · MathExam';
  return `<a class="back" href="#map">← Карта курса</a><div class="module-heading"><span class="number">${m.number}</span><div>${tag(m.status)}<h1>${esc(m.title)}</h1></div></div><p class="page-intro">${esc(m.description)}</p><p class="page-intro small">${m.id==='m07'?'Смешанная практика: позиции 1–21.':'Связь с экзаменом: задания '+m.positions.join(', ')+'.'} Перечень тем ещё предстоит дополнить всеми подтипами.</p>
  ${m.status==='available'?`<div class="actions">${link('Начать с первой темы',m.lessons[0].href)}${link('Диагностика 1–21','path/index.html#diagnostic','secondary')}</div>`:m.status==='prototype'?`<div class="actions">${link('Открыть модуль',moduleLink('#map'))}${link('Проверки модуля',moduleLink('#checks'),'secondary')}</div>`:'<div class="helper">Эти уроки ещё готовятся. Сейчас можно посмотреть их цели и необходимые основы.</div>'}
  <div class="lesson-list">${m.lessons.map((l,i)=>{const st=s.skills.find(x=>x.id===l.skill);return `<article class="lesson${query.get('lesson')===l.id?' selected':''}" id="${l.id}"><span class="lesson-order">${String(i+1).padStart(2,'0')}</span><div><h2>${esc(l.title)}</h2><p>${esc(l.goal)}</p>${l.prerequisites.length?`<p class="small">Пригодится перед уроком:</p><div class="prereqs">${l.prerequisites.map(id=>prerequisite(id,m.id)).join('')}</div>`:''}${st?`<p class="small">${esc(levels[st.level])} · практика ${st.done}/4</p>`:''}</div><div class="lesson-action">${tag(l.status)}${l.href?`<br>${link('Открыть урок',l.href,'secondary')}`:''}</div></article>`;}).join('')}</div>`;
 }
 function foundation(query){
  const selected=registry.prerequisites.find(x=>x.id===query.get('skill')),from=registry.modules.find(x=>x.id===query.get('from'));
  const ordered=selected?[selected,...registry.prerequisites.filter(x=>x!==selected)]:registry.prerequisites;
  return `${from?`<a class="back" href="${moduleHref(from.id)}">← Вернуться: ${esc(from.title)}</a>`:'<span class="eyebrow">Короткое ответвление от курса</span>'}<h1>Вспомнить основу</h1><p class="page-intro">Выберите конкретный пробел. После тренировки вернитесь к основной теме и попробуйте применить навык.</p><div class="helper"><b>Существующие тренажёры сайта</b><p>Откроются в новой вкладке. Их результаты пока не прибавляются к прогрессу этого курса. Эта вкладка сохранит путь назад. Во время самостоятельной проверки сначала завершите работу, затем обращайтесь к объяснениям.</p></div><div class="section-head"><h2>${selected?'Начните с нужного навыка':'Что повторить'}</h2></div><div class="cards">${ordered.map(r=>`<article class="card resource${r===selected?' selected':''}" data-resource="${r.id}"><span class="tag">Отдельный тренажёр</span><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p><div class="actions"><a class="btn secondary" href="${esc(r.href)}" target="_blank" rel="noopener">Открыть в новой вкладке</a></div></article>`).join('')}</div>`;
 }
 function progressPage(s){
  if(['unreadable','blocked'].includes(s.status))return '<span class="eyebrow">Результаты этого браузера</span><h1>Мой прогресс</h1><p class="page-intro">Результаты сейчас недоступны. Это не означает, что вы ничего не решали. Откройте выбранный модуль, чтобы проверить сохранённую работу.</p><div class="actions">'+link('Открыть модуль',moduleLink('#report'))+link('Восстановить из копии','#backup?module='+first.id,'secondary')+'</div>';
  return `<span class="eyebrow">Результаты этого браузера</span><h1>Мой прогресс</h1><p class="page-intro">Здесь только модуль «${esc(first.title)}». Эти показатели не означают готовность ко всему ЕГЭ.</p>${s.status==='empty'?'<div class="helper">Пока нет сохранённой работы. Начните с выбранного модуля — сюда попадут его результаты.</div>':''}<div class="progress-grid"><div class="stat"><p class="big-stat" data-stat="solved">${s.solved}<small> / ${s.skills.length*4}</small></p><p class="stat-label">Решено в практике</p></div><div class="stat"><p class="big-stat" data-stat="independent">${s.independent}<small> / ${s.skills.length*4}</small></p><p class="stat-label">С первого раза, без помощи</p></div><div class="stat"><p class="big-stat" data-stat="confirmed">${s.confirmed}<small> / ${s.skills.length}</small></p><p class="stat-label">Навыков подтверждено проверкой</p></div></div><div class="two"><section class="panel"><h2>Навыки модуля</h2><div class="status-list">${s.skills.map(x=>`<div class="status-row"><a href="${moduleLink('#learn-'+x.id)}">${esc(first.lessons.find(l=>l.skill===x.id).title)}</a><span>${esc(levels[x.level])}<br>Практика: ${x.done}/4</span></div>`).join('')}</div></section><section class="panel"><h2>Проверки</h2><div class="status-list">${Object.entries(phases).map(([id,title])=>{const r=s.runs[id];return `<div class="status-row" data-phase="${id}"><b>${title}</b><span>${r.finished?`${r.correct} из ${r.total}<br>${r.helped?'С обращением к обучению':'Без подсказок внутри модуля'}`:r.started?`Не завершена<br>Ответов ${r.count} из ${r.total}`:'Ещё не начата'}</span></div>`;}).join('')}</div><p class="small muted">Стартовая проверка помогает выбрать тему. Подтверждение навыка даёт только итог или повторение.</p></section></div><div class="actions">${link('Открыть отчёт модуля',moduleLink('#report'))}${link('Сохранить или восстановить работу','#backup?module='+first.id,'secondary')}<button class="btn secondary" type="button" data-refresh>Обновить результаты</button></div><p id="refresh-status" class="small muted" role="status"></p><div class="helper"><b>Как передать результат преподавателю</b><p>В отчёте выбранного модуля можно скачать или скопировать текст. Автоматической отправки нет. Прогресс зависит от браузера и устройства; для переноса работы скачайте резервную копию.</p></div>`;}
 function teacher(){return `<span class="eyebrow">Работа в мини-группе</span><h1>Преподавателю</h1><p class="page-intro">Навигатор помогает держать общий маршрут и выбирать короткие задания для восполнения индивидуальных пробелов.</p><div class="two"><section class="panel"><h2>Один учебный цикл</h2><ol><li>Ученик проходит стартовую проверку и передаёт отчёт.</li><li>Вы выбираете общую тему занятия и необходимые основы для каждого.</li><li>Дома — короткое объяснение и пробная практика. В группе — обсуждение способов и причин ошибок.</li><li>После практики — самостоятельная проверка на другом наборе.</li><li>Не раньше чем через сутки — повторение и обсуждение того, что ещё не закрепилось.</li></ol></section><section class="panel"><h2>Что доступно сейчас</h2><p>В новом маршруте — 28 тем с вариантами, диагностика и пробная работа по позициям 1–21. <a href="path/index.html#report">Отчёт нового маршрута</a> хранится отдельно от ранних модулей. В первом модуле — шесть навыков и 60 заданий; во втором — четыре навыка и 40 заданий. В каждом есть модели и отдельные проверочные наборы. Сохранение и отчёт относятся к одному браузеру.</p><p>Это не кабинет группы: чужие результаты здесь не появляются. Общий журнал и назначения пока в плане. Резервную копию каждого готового модуля можно скачать и восстановить через «Мой прогресс».</p><div class="actions">${allProgress.modules.map(id=>link('Сценарий модуля '+registry.modules.find(m=>m.id===id).number,allProgress.forModule(id).meta.path+'#teacher','secondary')).join('')}</div></section></div><div class="helper"><b>Как читать показатели</b><p>Решённая с подсказкой задача остаётся полезной практикой. Для самостоятельности учитываются первая попытка без помощи и отдельная проверка. Два проверочных вопроса на навык — ориентир для беседы, а не исчерпывающая диагностика.</p></div>`;}
 function rootBackup(){return globalThis.EgeBazaBackupUI.html(first.id);}
 function moduleChoices(page){return '<nav class="chip-list module-choices" aria-label="Выбор модуля">'+allProgress.modules.map(id=>{const m=registry.modules.find(x=>x.id===id);return '<a href="#'+page+'?module='+id+'" '+(id===first.id?'aria-current="true"':'')+'>'+esc(m.number+' · '+m.title)+'</a>';}).join('')+'</nav>';}
 function missing(){return '<h1>Раздел не найден</h1><p class="page-intro">Выберите нужный модуль на карте курса.</p><div class="actions">'+link('К карте курса','#map')+'</div>';}
 function render(focus=false){
  disposePage();disposePage=()=>{};
  const s=readState(),r=route();if(['today','progress','backup'].includes(r.page)&&r.query.has('module')&&!allProgress.forModule(r.query.get('module')))r.page='missing';document.title=(titles[r.page]||'Модуль')+' · Базовый ЕГЭ · MathExam';
  main.innerHTML=r.page==='today'?today(s):r.page==='map'?map():r.page==='module'?modulePage(r.query,s):r.page==='foundation'?foundation(r.query):r.page==='progress'?progressPage(s):r.page==='teacher'?teacher():r.page==='backup'?rootBackup():missing();
  if(['today','progress','backup'].includes(r.page))main.insertAdjacentHTML('afterbegin',moduleChoices(r.page));
  if(r.page==='backup')disposePage=globalThis.EgeBazaBackupUI.mount(main,first.id);
  document.querySelectorAll('[data-nav]').forEach(a=>{if(['today','progress'].includes(a.dataset.nav))a.href='#'+a.dataset.nav+'?module='+first.id;if(a.dataset.nav===(r.page==='module'?'map':r.page==='backup'?'progress':r.page))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(focus){main.focus({preventScroll:true});main.scrollIntoView({block:'start'});}
 }
 // Read on return; background refresh must not steal focus or discard selection.
 function refreshIfChanged(){
  if(route().page==='backup')return;
  let raw;try{raw=localStorage.getItem(progress.KEY);}catch(e){if(lastStatus!=='blocked')render();return;}
  if(raw!==lastRaw||lastStatus==='blocked'||route().page==='today')render();
 }
 document.addEventListener('click',event=>{
  const a=event.target.closest('a');if(a?.getAttribute('href')==='#content'){event.preventDefault();main.focus();return;}
  if(event.target.closest('[data-refresh]')){render();main.querySelector('[data-refresh]')?.focus();document.getElementById('refresh-status').textContent='Результаты обновлены.';}
 });
 addEventListener('hashchange',()=>render(true));
 addEventListener('storage',event=>{if(allProgress.modules.some(id=>event.key===allProgress.forModule(id).KEY)||event.key===null)refreshIfChanged();});
 addEventListener('pageshow',refreshIfChanged);addEventListener('focus',refreshIfChanged);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshIfChanged();});
 render();
})();
