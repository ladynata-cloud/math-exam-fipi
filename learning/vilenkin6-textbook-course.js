/* Revised textbook selections. Each source task owns a separate cloud attempt;
 * the earlier 27-module course and all its saved attempts remain unchanged. */
(function(root){
  'use strict';
  const TRAINER='vilenkin6-textbook';
  const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const roleTitles={learn:'Разбираем вместе',practice:'Тренируемся',check:'Проверяем себя'};
  const completedOutcomes=new Set(['independent','repeated','hinted','together','practiced']);
  const latestComplete=record=>completedOutcomes.has(record?.latest?.outcome);
  function items(catalog){return (root.VilenkinTextbookCatalog||[]).map(row=>catalog?.get(row.id)).filter(Boolean);}
  function taskTitle(item){
    if(item.source?.number)return 'К задаче № '+item.source.number+(item.source.part?' · '+item.source.part:'');
    const title=item.source?.part?.replace(/^пример:\s*/i,'')||item.title;
    return title.charAt(0).toUpperCase()+title.slice(1);
  }
  function mount(host,context){
    const {account,catalog,api,navigate,openContent,labels={}}=context;
    const teacher=account.role==='teacher',all=items(catalog),definitions=root.VilenkinTextbookCatalog||[];
    let alive=true,loading=!teacher,revision=0,opening=false,progress=new Map(),nextId='';
    const groups=new Map();
    for(const row of definitions){
      if(!groups.has(row.unitId))groups.set(row.unitId,{id:row.unitId,title:row.unitTitle,sectionLabel:row.sectionLabel,rows:[]});
      groups.get(row.unitId).rows.push(row);
    }
    if(!all.length||all.length!==definitions.length){host.innerHTML='<section class="empty"><h1>Курс пока не загрузился</h1><p>Обновите страницу. Сохранённые работы остаются в кабинете.</p></section>';return()=>{alive=false;};}
    function row(item){
      const action=teacher?'Выбрать задание':item.role==='learn'?'Разобрать пример':'Начать задание';
      return `<li class="v6-course-task" data-v6-task-card="${E(item.id)}"><div class="v6-course-task-copy"><h3>${E(taskTitle(item))}</h3><p class="v6-course-source">${item.source?.kind==='example'?'Пример из учебника':'Задание учебника'}${item.source?.page?' · с. '+E(item.source.page):''}</p><p class="v6-course-task-status" data-vilenkin-textbook-status="${E(item.id)}">${teacher?'Выбрать ученика и подготовить задание':'Проверяем сохранённую работу…'}</p></div><div class="v6-course-task-actions"><button class="primary v6-course-task-button" type="button" data-vilenkin-textbook-open="${E(item.id)}" aria-label="${E(action+' — '+taskTitle(item))}"${teacher?'':' disabled'}><span data-v6-action-label>${action}</span><span aria-hidden="true">→</span></button>${teacher?'':`<button class="subtle small" type="button" data-vilenkin-textbook-fresh="${E(item.id)}" hidden disabled>Новое решение по текущей версии</button>`}</div></li>`;
    }
    function groupMarkup(group){
      return `<details class="v6-course-topic" data-vilenkin-textbook-unit="${group.id}"><summary><span class="v6-course-topic-number" aria-hidden="true">${group.id===0?'↺':E(group.id)}</span><span class="v6-course-topic-heading"><span class="v6-course-topic-kicker">${group.id===0?'ПОВТОРЕНИЕ ЗА 5 КЛАСС':'К ПУНКТУ '+E(group.id)}</span><span class="v6-course-topic-title">${E(group.title)}</span><span class="v6-course-topic-progress" data-vilenkin-textbook-unit-progress="${group.id}">${group.rows.length} заданий</span></span><span class="v6-course-topic-action"><span class="v6-course-topic-open">К заданиям</span><span class="v6-course-topic-close">Свернуть</span><span aria-hidden="true">↓</span></span></summary><div class="v6-course-topic-body"><p class="v6-course-source">${E(group.sectionLabel||'Повторение перед началом курса')}</p>${Object.entries(roleTitles).map(([role,title],index)=>{const rows=group.rows.filter(item=>item.role===role);return rows.length?`<section class="v6-course-stage"><h2><span aria-hidden="true">${index+1}</span>${title}</h2><ul class="v6-course-task-list">${rows.map(row).join('')}</ul></section>`:'';}).join('')}</div></details>`;
    }
    host.innerHTML=`<section class="v6-course" data-vilenkin-textbook-course>
      <header class="v6-course-hero"><div class="v6-course-welcome"><p class="eyebrow">ВИЛЕНКИН · 6 КЛАСС · ЧАСТЬ 1</p><h1>Мой курс математики</h1><p class="v6-course-lead">Выбери тему, открой задание и решай по шагам.</p><div class="v6-course-primary-actions"><button class="primary v6-course-start" type="button" data-vilenkin-textbook-start${teacher?'':' disabled'}>${teacher?'Выбрать задание':'Начать курс'} <span aria-hidden="true">→</span></button><button class="v6-course-choose" type="button" data-vilenkin-textbook-choose-topic>Выбрать тему</button></div><p class="v6-course-next" data-vilenkin-textbook-next>${teacher?'Открой тему ниже, чтобы выбрать задание для ученика.':'Сначала проверим, на чём ты остановился.'}</p></div><div class="v6-course-progress-card"><span class="v6-course-progress-label">МОЙ ПРОГРЕСС</span><p><strong data-v6-completed>${teacher?'—':'0'}</strong><span> / ${all.length}</span></p><span>заданий завершено</span><progress value="0" max="${all.length}" aria-label="Завершённые задания" data-v6-progress-bar></progress><small>${groups.size} темы · разборы и практика</small></div></header>
      <ol class="v6-course-how" aria-label="Как заниматься"><li><span>1</span>Открой тему</li><li><span>2</span>Выбери задание</li><li><span>3</span>Решай по шагам</li></ol>
      <p class="v6-course-progress-status" role="status" aria-live="polite" data-vilenkin-textbook-progress>${teacher?'Просмотр тем не создаёт работы ученика.':'Загружаем результаты из кабинета…'}</p>
      <div class="v6-course-section-heading"><h2 id="v6-course-topics-heading">Темы курса</h2><span>Нажми «К заданиям»</span></div>
      <div class="v6-course-topics" aria-labelledby="v6-course-topics-heading">${[...groups.values()].sort((a,b)=>a.id-b.id).map(groupMarkup).join('')}</div>
      <section class="panel v6-course-practice"><h2>Отдельная тренировка НОД и НОК</h2>${root.LearningPreparationUI?.numberTheoryCardsMarkup?.({teacher})||'<p>Тренажёры доступны в материалах сайта.</p>'}</section>
      <details class="panel v6-course-saved"><summary>Как сохраняются решения и где прежние работы</summary><p>Каждое задание сохраняется отдельно: ответ, шаги и использованная помощь. Можно продолжить с другого устройства.</p><p>Перед закрытием дождись сообщения «Все изменения сохранены» над заданием. При потере связи оставайся в текущей вкладке до отправки работы.</p><p>Если задание обновилось и прежнее решение не открывается, выбери рядом с ним «Новое решение по текущей версии». Предыдущая запись останется в истории.</p><p>Работы в прежних 27 модулях сохранены отдельно. Они не считаются выполнением новых заданий из учебника.</p><div class="actions"><a class="button" href="${teacher?'#course=vilenkin6':'#vilenkin-legacy'}">Открыть прежние модули →</a><a class="button" href="#history">История работ →</a></div></details>
      <p class="form-hint v6-course-note">Здесь разобраны выбранные задания каждого пункта, а не все номера учебника. Выполнение одного задания не означает освоения всей темы. Построения проверяются по памятке и преподавателем.</p>
    </section>`;
    const buttons=()=>[...host.querySelectorAll('[data-vilenkin-textbook-open]')];
    const status=host.querySelector('[data-vilenkin-textbook-progress]'),start=host.querySelector('[data-vilenkin-textbook-start]'),next=host.querySelector('[data-vilenkin-textbook-next]');
    function focusTopics(){
      if(!alive)return;
      const summary=host.querySelector('[data-vilenkin-textbook-unit] > summary');
      summary?.scrollIntoView?.({block:'start'});summary?.focus({preventScroll:true});
    }
    host.querySelector('[data-vilenkin-textbook-choose-topic]').onclick=focusTopics;
    function setBusy(){
      buttons().forEach(button=>{button.disabled=loading||opening;});
      start.disabled=loading||opening;
      for(const button of host.querySelectorAll('[data-vilenkin-textbook-fresh]'))button.disabled=loading||opening||button.hidden;
    }
    async function openItem(id,fresh=false){
      if(!alive||loading||opening)return;
      const item=catalog.get(id);if(item?.trainerId!==TRAINER)return;
      const latest=progress.get(item.contentId)?.latest,validSaved=latest&&/^[A-Za-z0-9_-]{1,160}$/.test(latest.id||'');
      if(fresh&&!validSaved)return;
      if(!teacher&&!fresh&&validSaved){navigate('attempt='+encodeURIComponent(latest.id));return;}
      opening=true;setBusy();
      try{await openContent(item.id,...(fresh?[{fresh:true,sourceAttemptId:latest.id}]:[]));}
      catch(_){if(alive)status.textContent=fresh?'Не удалось открыть новое решение. Прежняя работа сохранена; проверь связь и попробуй ещё раз.':'Не удалось открыть задание. Проверь связь и попробуй ещё раз; прежние решения сохранены.';}
      finally{opening=false;if(alive)setBusy();}
    }
    for(const button of buttons())button.onclick=()=>{if(!button.disabled)openItem(button.dataset.vilenkinTextbookOpen);};
    for(const button of host.querySelectorAll('[data-vilenkin-textbook-fresh]'))button.onclick=()=>{if(!button.disabled)openItem(button.dataset.vilenkinTextbookFresh,true);};
    start.onclick=()=>{if(!start.disabled){if(teacher||!nextId)focusTopics();else openItem(nextId);}};
    function updateProgress(){
      for(const item of all){
        const record=progress.get(item.contentId),latest=record?.latest,definition=definitions.find(row=>row.id===item.id),button=host.querySelector('[data-vilenkin-textbook-open="'+item.id+'"]');
        const fresh=host.querySelector('[data-vilenkin-textbook-fresh="'+item.id+'"]');if(fresh)fresh.hidden=!latest;
        const action=latest?(latestComplete(record)?'Посмотреть работу':'Продолжить'):definition.role==='learn'?'Разобрать пример':'Начать задание';
        button.querySelector('[data-v6-action-label]').textContent=action;button.setAttribute('aria-label',action+' — '+taskTitle(definition));
        const badge=host.querySelector('[data-vilenkin-textbook-status="'+item.id+'"]');
        badge.textContent=latest?(labels[latest.outcome]||(latestComplete(record)?'Завершено':'Начато')):'Ещё не начинали';
        badge.dataset.state=latest?(latestComplete(record)?'done':'started'):'new';
      }
      for(const group of groups.values()){
        const started=group.rows.filter(item=>progress.has(item.contentId)).length,completed=group.rows.filter(item=>progress.get(item.contentId)?.completed).length;
        host.querySelector('[data-vilenkin-textbook-unit-progress="'+group.id+'"]').textContent=`${group.rows.length} заданий · начато ${started} · завершено ${completed}`;
      }
      const completed=[...progress.values()].filter(item=>item.completed).length;
      status.textContent=`Открыто ${progress.size} из ${all.length} заданий. Завершённых работ: ${completed}.`;
      host.querySelector('[data-v6-completed]').textContent=String(completed);host.querySelector('[data-v6-progress-bar]').value=completed;
      const unfinished=all.find(item=>progress.get(item.contentId)?.latest&&!latestComplete(progress.get(item.contentId))),target=unfinished||all.find(item=>!progress.get(item.contentId)?.completed);
      nextId=target?.id||'';
      start.innerHTML=(unfinished?'Продолжить задание':target?'Начать курс':'Выбрать задание')+' <span aria-hidden="true">→</span>';
      next.textContent=target?(unfinished?'Продолжим: ':'Начнём: ')+taskTitle(definitions.find(row=>row.id===target.id)):'Все выбранные задания пройдены. Можно открыть любую работу для повторения.';
    }
    async function load(){
      const token=++revision;loading=true;setBusy();status.textContent='Загружаем результаты из кабинета…';
      try{
        const response=await api('/progress');if(!alive||token!==revision)return;
        if(!Array.isArray(response.progress))throw Error('INVALID_PROGRESS');
        progress=new Map(response.progress.filter(item=>item.trainerId===TRAINER&&catalog.get(TRAINER+':'+item.contentId)).map(item=>[item.contentId,item]));
        updateProgress();loading=false;setBusy();
      }catch(_){
        if(!alive||token!==revision)return;
        next.textContent='Повтори загрузку результатов, чтобы продолжить с нужного места.';
        status.innerHTML='Не удалось получить прежнюю работу. Повтори загрузку, чтобы продолжить с сохранённого места. <button type="button" data-vilenkin-textbook-retry>Повторить загрузку</button>';
        status.querySelector('button').onclick=load;
      }
    }
    if(!teacher)load();
    return()=>{alive=false;revision++;};
  }
  root.LearningVilenkinTextbook=Object.freeze({mount,items});
})(typeof window==='undefined'?globalThis:window);
