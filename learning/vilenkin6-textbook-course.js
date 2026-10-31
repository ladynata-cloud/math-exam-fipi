/* Revised textbook selections. Each source task owns a separate cloud attempt;
 * the earlier 27-module course and all its saved attempts remain unchanged. */
(function(root){
  'use strict';
  const TRAINER='vilenkin6-textbook';
  const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const roleTitles={learn:'Разбираем вместе',practice:'Тренируемся',check:'Проверяем себя'};
  const authorStages={example:'Разбираем примеры',practice:'Тренируемся двумя способами',check:'Проверяем себя'};
  const methodTitles={chain:'По очереди',factors:'Через простые множители'};
  const reviewTopics=[{id:6,title:'Разложение на простые множители'},{id:7,title:'Вспомним НОД'},{id:8,title:'НОК двух чисел и задания №2.97 д–з'}];
  const isAuthor=row=>row.source?.kind==='author';
  function items(catalog){return (root.VilenkinTextbookCatalog||[]).map(row=>catalog?.get(row.id)).filter(Boolean);}
  function mount(host,context){
    const {account,catalog,api,navigate,openContent,labels={}}=context;
    const teacher=account.role==='teacher',all=items(catalog),definitions=root.VilenkinTextbookCatalog||[];
    let alive=true,loading=!teacher,revision=0,progress=new Map();
    const groups=new Map();
    for(const row of definitions){if(!groups.has(row.unitId))groups.set(row.unitId,{id:row.unitId,title:row.unitTitle,sectionLabel:row.sectionLabel,author:isAuthor(row),rows:[]});groups.get(row.unitId).rows.push(row);}
    if(!all.length||all.length!==definitions.length){host.innerHTML='<section class="empty"><h1>Курс пока не загрузился</h1><p>Обновите страницу. Сохранённые работы остаются в кабинете.</p></section>';return()=>{alive=false;};}
    function controls(item,label=item.title,author=false){return `<button type="button"${author?' class="primary"':''} data-vilenkin-textbook-open="${E(item.id)}" aria-label="${E(item.title)}"${teacher?'':' disabled'}>${E(label)} →</button><small data-vilenkin-textbook-status="${E(item.id)}">${teacher?'Выбрать ученика и подготовить задание':'Проверяем сохранённую работу…'}</small>${teacher?'':`<button class="subtle small" type="button" data-vilenkin-textbook-fresh="${E(item.id)}" hidden disabled>Новое решение по текущей версии</button>`}`;}
    function row(item){return `<li>${controls(item)}</li>`;}
    function authorRows(group,stage){
      const cases=new Map();
      for(const item of group.rows.filter(item=>item.stage===stage)){
        if(!cases.has(item.groupId))cases.set(item.groupId,{id:item.groupId,numbers:item.numbers,rows:[]});
        cases.get(item.groupId).rows.push(item);
      }
      return [...cases.values()];
    }
    function reviewLinks(){
      return `<section data-lcm-review><h3>Вспомним знакомое</h3><p>Если нужно, повтори разложение чисел, НОД и НОК двух чисел. Затем вернись к новым примерам.</p><div class="lcm-method-options">${reviewTopics.map(topic=>`<button type="button" class="subtle" data-vilenkin-review-unit="${topic.id}" aria-controls="vilenkin-source-${topic.id}">${topic.title} →</button>`).join('')}</div></section>`;
    }
    function authorGroup(group){
      const names={example:'Пример',practice:'Тренировка',check:'Проверка'};
      return `<section class="panel" data-vilenkin-textbook-unit="${group.id}" data-vilenkin-textbook-author><p class="eyebrow">АВТОРСКОЕ ДОПОЛНЕНИЕ MATHEXAM · К ТЕМЕ НОК</p><h2 tabindex="-1" data-lcm-title>${E(group.title)}</h2><p>Находим НОК трёх, четырёх и пяти чисел по очереди и через простые множители. Прежний курс остаётся ниже.</p><p>У каждого примера и тренировки можно выбрать способ. Оба решения сохраняются отдельно. Для самостоятельной проверки есть новые условия.</p><p class="form-hint" data-vilenkin-textbook-unit-progress="${group.id}"></p>${reviewLinks()}${Object.entries(authorStages).map(([stage,title])=>`<section class="lcm-stage" data-lcm-stage="${stage}"><h3>${title}</h3>${stage==='check'?'<p class="form-hint">Реши на листе или в уме и введи ответ. Если потребуется помощь, открой подсказку внутри задания.</p>':''}${authorRows(group,stage).map((entry,index)=>`<article class="lcm-group" data-lcm-group="${E(entry.id)}"><h4>${names[stage]} ${index+1} · Числа ${entry.numbers.map(E).join(', ')}</h4><div class="lcm-method-options">${entry.rows.map(item=>`<div>${controls(item,methodTitles[item.method]+(stage==='check'?' · проверить себя':''),true)}</div>`).join('')}</div></article>`).join('')}</section>`).join('')}</section>`;
    }
    function sourceGroup(group){return `<details class="panel" id="vilenkin-source-${group.id}" data-vilenkin-textbook-unit="${group.id}"${group.id===0?' open':''}><summary><strong>${E(group.sectionLabel||(group.id===0?'Повторение перед началом':`Пункт ${group.id}`))} · ${E(group.title)}</strong><span data-vilenkin-textbook-unit-progress="${group.id}"></span></summary>${reviewTopics.some(topic=>topic.id===group.id)&&authorGroups.length?'<p><button type="button" class="subtle small" data-vilenkin-return-lcm>Вернуться к НОК трёх и более чисел ↑</button></p>':''}${Object.entries(roleTitles).map(([role,title])=>{const rows=group.rows.filter(item=>item.role===role);return rows.length?`<section><h2>${title}</h2><ul class="catalog-items">${rows.map(row).join('')}</ul></section>`:'';}).join('')}</details>`;}
    const sourceGroups=[...groups.values()].filter(group=>!group.author).sort((a,b)=>a.id-b.id),authorGroups=[...groups.values()].filter(group=>group.author);
    const sourceCount=all.filter(item=>!isAuthor(item)).length;
    host.innerHTML=`<section data-vilenkin-textbook-course><div class="page-heading"><div><p class="eyebrow">К УЧЕБНИКУ ВИЛЕНКИНА · 6 КЛАСС · ЧАСТЬ 1</p><h1>Мой курс математики</h1><p>Выбери тему: короткое правило, разбор по шагам, затем самостоятельная работа. Здесь ${sourceCount} выбранных заданий и примеров из всех 23 пунктов первой части и вводное повторение.${authorGroups.length?' Рядом — авторское дополнение MathExam «НОК трёх и более чисел».':''}</p></div></div><section class="hero-card"><div><h2>Начатое решение остаётся на месте</h2><p>Каждое задание сохраняется отдельно в кабинете: ответ, выполненные шаги и использованная помощь. Можно продолжить с другого устройства.</p><p class="form-hint">Перед закрытием дождись сообщения «Все изменения сохранены» над заданием. При потере связи оставайся в текущей вкладке до отправки работы.</p></div></section><p role="status" aria-live="polite" data-vilenkin-textbook-progress>${teacher?'Просмотр тем не создаёт работы ученика.':'Загружаем результаты из кабинета…'}</p>${authorGroups.map(authorGroup).join('')}${sourceGroups.map(sourceGroup).join('')}<section class="panel"><h2>Отдельная тренировка НОД и НОК</h2>${root.LearningPreparationUI?.numberTheoryCardsMarkup?.({teacher})||'<p>Тренажёры доступны в материалах сайта.</p>'}</section><details class="panel"><summary>Прежний курс и сохранённые работы</summary><p>Если задание обновилось и прежнее решение не открывается, выбери рядом с ним «Новое решение по текущей версии». Предыдущая запись останется в истории.</p><p>Работы в прежних 27 модулях сохранены отдельно. Они не считаются выполнением новых заданий из учебника.</p><a class="button" href="${teacher?'#course=vilenkin6':'#vilenkin-legacy'}">Открыть прежние модули →</a><a class="button" href="#history">История работ →</a></details><p class="form-hint">Здесь разобраны выбранные задания каждого пункта, а не все номера учебника. Авторские упражнения отмечены отдельно. Выполнение одного задания не означает освоения всей темы. Построения проверяются по памятке и преподавателем.</p></section>`;
    const buttons=()=>[...host.querySelectorAll('[data-vilenkin-textbook-open]')];
    const status=host.querySelector('[data-vilenkin-textbook-progress]');
    for(const button of host.querySelectorAll('[data-vilenkin-review-unit]'))button.onclick=()=>{
      if(!alive)return;
      const target=host.querySelector('#vilenkin-source-'+button.dataset.vilenkinReviewUnit);
      if(!target)return;
      target.open=true;
      target.scrollIntoView?.({block:'start'});
      target.querySelector('summary')?.focus({preventScroll:true});
    };
    for(const button of host.querySelectorAll('[data-vilenkin-return-lcm]'))button.onclick=()=>{
      if(!alive)return;
      const target=host.querySelector('[data-vilenkin-textbook-author]');
      target?.scrollIntoView?.({block:'start'});
      target?.querySelector('[data-lcm-title]')?.focus({preventScroll:true});
    };
    for(const button of buttons())button.onclick=async()=>{
      if(!alive||loading||button.disabled)return;
      const item=catalog.get(button.dataset.vilenkinTextbookOpen);if(item?.trainerId!==TRAINER)return;
      const latest=progress.get(item.contentId)?.latest;
      if(!teacher&&latest&&/^[A-Za-z0-9_-]{1,160}$/.test(latest.id||'')){navigate('attempt='+encodeURIComponent(latest.id));return;}
      button.disabled=true;
      try{await openContent(item.id);}catch(_){if(alive)status.textContent='Не удалось открыть задание. Проверь связь и попробуй ещё раз; прежние решения сохранены.';}
      finally{if(alive&&button.isConnected)button.disabled=false;}
    };
    for(const button of host.querySelectorAll('[data-vilenkin-textbook-fresh]'))button.onclick=async()=>{
      if(!alive||loading||button.disabled)return;
      const item=catalog.get(button.dataset.vilenkinTextbookFresh),latest=item&&progress.get(item.contentId)?.latest;
      if(item?.trainerId!==TRAINER||!latest||!/^[A-Za-z0-9_-]{1,160}$/.test(latest.id||''))return;
      button.disabled=true;
      try{await openContent(item.id,{fresh:true,sourceAttemptId:latest.id});}catch(_){if(alive)status.textContent='Не удалось открыть новое решение. Прежняя работа сохранена; проверь связь и попробуй ещё раз.';}
      finally{if(alive&&button.isConnected)button.disabled=false;}
    };
    async function load(){
      const token=++revision;loading=true;buttons().forEach(button=>{button.disabled=true;});
      status.textContent='Загружаем результаты из кабинета…';
      try{
        const response=await api('/progress');if(!alive||token!==revision)return;
        if(!Array.isArray(response.progress))throw Error('INVALID_PROGRESS');
        progress=new Map(response.progress.filter(item=>item.trainerId===TRAINER&&catalog.get(TRAINER+':'+item.contentId)).map(item=>[item.contentId,item]));
        for(const item of all){const latest=progress.get(item.contentId)?.latest;const fresh=host.querySelector('[data-vilenkin-textbook-fresh="'+item.id+'"]');if(fresh){fresh.hidden=!latest;fresh.disabled=!latest;}host.querySelector('[data-vilenkin-textbook-status="'+item.id+'"]').textContent=latest?'Продолжить · '+(labels[latest.outcome]||'Начато'):'Ещё не начинали';}
        for(const group of groups.values()){const started=group.rows.filter(item=>progress.has(item.contentId)).length;host.querySelector('[data-vilenkin-textbook-unit-progress="'+group.id+'"]').textContent=` · начато ${started} из ${group.rows.length}`;}
        status.textContent=`Открыто ${progress.size} из ${all.length} заданий. Завершённых работ: ${[...progress.values()].filter(item=>item.completed).length}.`;
        loading=false;buttons().forEach(button=>{button.disabled=false;});
      }catch(_){
        if(!alive||token!==revision)return;
        status.innerHTML='Не удалось получить прежнюю работу. Повтори загрузку, чтобы продолжить с сохранённого места. <button type="button" data-vilenkin-textbook-retry>Повторить загрузку</button>';
        status.querySelector('button').onclick=load;
      }
    }
    if(!teacher)load();
    return()=>{alive=false;revision++;};
  }
  root.LearningVilenkinTextbook=Object.freeze({mount,items});
})(typeof window==='undefined'?globalThis:window);
