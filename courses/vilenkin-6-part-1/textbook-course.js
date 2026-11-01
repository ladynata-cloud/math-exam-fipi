(function () {
  'use strict';
  const M=window.TextbookMath, Sources=window.VilenkinSourceLabels, KEY='mathexam-vilenkin6-textbook-2024-v1';
  const managed=window.MathExamLearning?.managed===true||new URLSearchParams(location.search).get('learning')==='1';
  let managedContracts=null,managedSpec=null,managedReady=false,managedReadonly=true,managedApplying=false,managedNotify=()=>{},managedUnits=[];
  const main=document.getElementById('main');
  document.querySelector('.skip-link')?.addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView?.({block:'start'});});
  const statusLabels={independent:'Решено самостоятельно',assisted:'Решено с помощью',learned:'Разобрано по шагам',manual:'Проверено по памятке',repeated:'Решено повторно'};
  const roleLabels={learn:'Разбираем вместе',practice:'Тренируемся',check:'Проверяем себя'};
  const supplementStages={example:'Разбираем примеры',practice:'Тренируемся двумя способами',check:'Проверяем себя'};
  const methodLabels={chain:'По очереди',factors:'Через простые множители'};
  let units=[], taskMap=new Map(), unitMap=new Map(), state={version:1,last:'',tasks:{}}, resetPending=false, writesBlocked=false, renderEpoch=0;
  const text=v=>M.esc(v), fmt=v=>M.fmt(v), limited=(v,n=180)=>typeof v==='string'?v.slice(0,n):'';
  const taskURL=(unit,task)=>`#unit/${unit.id}/task/${encodeURIComponent(task.id)}`;
  const unitURL=unit=>`#unit/${unit.id}`;
  const isSupplement=unit=>unit?.kind==='author-supplement'&&unit.id===1008;
  const bookUnits=()=>units.filter(unit=>!isSupplement(unit));
  function setSupplementView(value){document.body.classList.toggle('supplement-task',value);}
  const viewIsCurrent=(epoch,hash)=>epoch===renderEpoch&&location.hash===hash&&(!managed||managedReady&&!managedReadonly&&!managedApplying);
  function guardLinks(epoch,hash){main.querySelectorAll('a').forEach(link=>{
    // The isolated task returns to its owning cabinet's existing catalogue.
    if(managed&&link.getAttribute('href')==='#'){
      link.dataset.managedCourseCatalog='';
      link.setAttribute('aria-label','Все темы курса в кабинете');
      link.setAttribute('aria-disabled',String(managedReadonly||!managedReady));
      link.addEventListener('click',event=>{
        event.preventDefault();
        if(viewIsCurrent(epoch,hash))managedNotify({kind:'navigate',details:{target:'vilenkin-textbook-catalog'},state:managedSnapshot()});
      });
      return;
    }
    if(managed&&link.getAttribute('href')?.startsWith('#')&&link.getAttribute('href')!==managedRoute()){
      link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.title='Другую задачу можно выбрать в маршруте кабинета.';
    }
    link.addEventListener('click',event=>{if(!viewIsCurrent(epoch,hash))event.preventDefault();});
  });}
  function resultStatus(task,p,manual){return manual?'manual':task.role==='learn'?'learned':p.helped||p.mode==='guided'?'assisted':p.repeated?'repeated':'independent';}
  function hasPriorWork(p){return !!p&&(!!p.status||p.helped||p.solution||p.repeated||p.attempts>0||p.step>0||p.hintKeys?.length>0||p.hiddenHints?.length>0||p.revealedSteps?.length>0);}
  function getProgress(task) {
    if (!state.tasks[task.id]) state.tasks[task.id]={mode:task.role==='learn'?'guided':'independent',step:0,draft:'',stepDrafts:[],hintKeys:[],hiddenHints:[],revealedSteps:[],manualChecks:{},feedback:{},wrongCounts:{},helped:false,solution:false,reviewedAfter:false,status:'',repeated:false,attempts:0};
    return state.tasks[task.id];
  }
  function safeProgress(raw,task) {
    if (!raw || typeof raw!=='object' || Array.isArray(raw)) return null;
    const steps=task.steps || [], max=steps.length;
    const p={mode:task.role==='learn'?'guided':raw.mode==='guided'?'guided':'independent',step:Number.isInteger(raw.step)?Math.max(0,Math.min(max,raw.step)):0,
      draft:limited(raw.draft),stepDrafts:Array.isArray(raw.stepDrafts)?raw.stepDrafts.slice(0,max).map(v=>limited(v)):[],
      hintKeys:Array.isArray(raw.hintKeys)?[...new Set(raw.hintKeys.filter(k=>k==='final'||Number.isInteger(k)&&k>=0&&k<max))].slice(0,max+1):[],
      hiddenHints:Array.isArray(raw.hiddenHints)?raw.hiddenHints.filter(k=>k==='final'||Number.isInteger(k)&&k>=0&&k<max).slice(0,max+1):[],
      revealedSteps:Array.isArray(raw.revealedSteps)?raw.revealedSteps.filter(k=>Number.isInteger(k)&&k>=0&&k<max).slice(0,max):[],
      manualChecks:{},feedback:{},wrongCounts:{},reviewedAfter:false,ruleOpen:raw.ruleOpen===true,helped:raw.helped===true,solution:raw.solution===true,status:Object.hasOwn(statusLabels,raw.status)?raw.status:'',repeated:raw.repeated===true||raw.status==='repeated',attempts:Number.isInteger(raw.attempts)?Math.max(0,Math.min(10000,raw.attempts)):0};
    const keys=['final',...steps.map((_,i)=>String(i))];
    for (const k of keys) {
      const item=k==='final'?task:steps[Number(k)], checks=raw.manualChecks?.[k];
      if (Array.isArray(checks)) p.manualChecks[k]=checks.slice(0,(item.selfCheck || []).length).map(v=>v===true);
      const f=raw.feedback?.[k];
      if (f && ['wrong','format','manual'].includes(f.kind)) p.feedback[k]={kind:f.kind};
      const wrong=raw.wrongCounts?.[k];
      if(Number.isInteger(wrong)&&wrong>0)p.wrongCounts[k]=Math.min(10000,wrong);
    }
    // A stored label is not evidence of a valid answer. Rebuild it from the
    // checked draft/step prefix and preserve every surviving sign of help.
    p.helped=p.helped||p.solution||p.ruleOpen||p.hintKeys.length>0||p.hiddenHints.length>0||p.revealedSteps.length>0||raw.status==='assisted'||(task.role!=='learn'&&p.mode==='guided');
    const verified=(item,key,value)=>item.answerType==='self-check'
      ? (item.selfCheck || []).length>0&&item.selfCheck.every((_,i)=>p.manualChecks[String(key)]?.[i]===true)
      : M.check(value,item.answer,item.answerType || 'number').ok;
    const claimedStep=p.step;
    p.step=0;
    while(p.step<claimedStep){
      const item=steps[p.step],revealed=item.answerType!=='self-check'&&p.revealedSteps.includes(p.step);
      if(!revealed&&!verified(item,p.step,p.stepDrafts[p.step] || ''))break;
      p.step++;
    }
    const claimedComplete=Object.hasOwn(statusLabels,raw.status);
    const validComplete=p.mode==='guided'?p.step===max&&max>0:verified(task,'final',p.draft);
    const manual=task.answerType==='self-check'||(p.mode==='guided'&&steps[max-1]?.answerType==='self-check');
    if(raw.status==='learned'&&task.role!=='learn'||raw.status==='manual'&&!manual)p.repeated=true;
    p.status=claimedComplete&&validComplete?resultStatus(task,p,manual):'';
    if(claimedComplete&&!validComplete)p.repeated=true;
    if(!p.status&&p.mode==='guided'&&p.step===max&&max>0)p.status=resultStatus(task,p,manual);
    p.reviewedAfter=!!p.status&&raw.reviewedAfter===true;
    return p;
  }
  function loadState() {
    if(managed)return;
    try {
      const raw=localStorage.getItem(KEY); if (!raw) return; if(raw.length>250000)throw new Error('oversize');
      const saved=JSON.parse(raw); if (!saved || saved.version!==1 || typeof saved.tasks!=='object' || !saved.tasks || Array.isArray(saved.tasks))throw new Error('invalid state');
      state.last=limited(saved.last,220);
      if(taskMap.get(saved.activeCheck)?.role==='check')state.activeCheck=saved.activeCheck;
      units.forEach(u=>{if(saved[`pitfalls${u.id}`]===true)state[`pitfalls${u.id}`]=true;});
      for (const [id,task] of taskMap) { const p=safeProgress(saved.tasks[id],task); if(p) state.tasks[id]=p; }
    } catch (_) { writesBlocked=true;announceStorage(false); }
  }
  function announceStorage(ok) { const n=document.getElementById('save-status'); if(n)n.textContent=managed?(ok?'Статус облачного сохранения показан в кабинете над заданием.':'Это изменение ещё не передано в кабинет. Не закрывай работу; проверь сообщение над заданием.'):writesBlocked?'Не удалось прочитать сохранённую работу. Прежняя запись сохранена без изменений; новые ответы останутся только в этой вкладке.':ok?'Работа сохраняется в этом браузере.':'Браузер не разрешил сохранить работу. Не закрывай эту вкладку до конца занятия.'; }
  function save(kind='input',details={}) {
    if(managed){
      if(!managedReady||managedReadonly||managedApplying)return false;
      try{const snapshot=managedSnapshot();managedNotify({kind,details,state:snapshot});announceStorage(true);return true;}
      catch(_){announceStorage(false);return false;}
    }
    if(writesBlocked){announceStorage(false);return false;}try {localStorage.setItem(KEY,JSON.stringify(state));announceStorage(true);return true;}catch(_){announceStorage(false);return false;}
  }
  function progressSummary(unit) {
    const counts={independent:0,assisted:0,learned:0,manual:0,repeated:0};
    unit.tasks.forEach(t=>{const s=state.tasks[t.id]?.status;if(Object.hasOwn(counts,s))counts[s]++;});
    return {counts,total:Object.values(counts).reduce((a,b)=>a+b,0)};
  }
  function sourceHTML(task,unit) {
    const s=task.source;
    if(s.kind==='author')return `<p class="source source-author"><strong>${text(Sources.taskLabel(task))}</strong><br>К теме НОК · пункт ${text(unit.relatedPoint)}</p>`;
    return `<p class="source"><strong>${text(Sources.taskLabel(task))}</strong><br>${text(Sources.sectionLabel(unit.id))}<br><a href="textbook.pdf#page=${Number(s.page)+1}" target="_blank" rel="noopener">с. ${Number(s.page)} учебника</a></p>`;
  }
  function mountSupport(unit,epoch,hash,task=null,p=null) {
    const host=main.querySelector('[data-study-support]');
    if(!host||!window.VilenkinStudySupport)return;
    window.VilenkinStudySupport.mount(host,{unitId:isSupplement(unit)?unit.relatedPoint:unit.id,answerType:task?.answerType,actionsHost:main.querySelector('.work .help-actions'),isCurrent:()=>viewIsCurrent(epoch,hash)&&(!task||state.tasks[task.id]===p),onUse(reason){
      if(!task||p.status)return;
      p.helped=true;
      save('hint',{resource:reason});
      const note=host.querySelector('[data-help-status]')||document.createElement('p');
      note.dataset.helpStatus='true';note.className='status-detail';note.textContent='В этой задаче ты воспользовался справкой. Работа будет отмечена как выполненная с помощью.';
      if(!note.parentNode)host.append(note);
    }});
  }
  function visualHTML(visual) {
    if (!visual) return '';
    if (visual.type==='image' && /^textbook-data\/figures\/[A-Za-z0-9._-]+\.(png|jpg|webp|svg)$/.test(visual.src)) return `<figure><img class="task-image" src="${text(visual.src)}" alt="${text(visual.alt || 'Рисунок к заданию из учебника')}"><figcaption class="figure-note">Рисунок из учебника</figcaption></figure>`;
    if (visual.type==='table') return `<div class="table-wrap"><table>${visual.headers?`<thead><tr>${visual.headers.map(h=>`<th scope="col">${fmt(h)}</th>`).join('')}</tr></thead>`:''}<tbody>${(visual.rows || []).map(row=>`<tr>${row.map(cell=>`<td>${fmt(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return '';
  }
  function supplementGroups(unit,stage) {
    const groups=new Map();
    for(const task of unit.tasks.filter(task=>task.stage===stage)){
      if(!groups.has(task.groupId))groups.set(task.groupId,{id:task.groupId,numbers:task.numbers,tasks:[]});
      groups.get(task.groupId).tasks.push(task);
    }
    return [...groups.values()];
  }
  function supplementOverviewHTML(unit) {
    const count=stage=>supplementGroups(unit,stage).length;
    return `<section class="card supplement-overview" data-author-supplement="${unit.id}"><p class="eyebrow">Авторское дополнение MathExam · к теме НОК</p><h2>${text(unit.title)}</h2><p>Сначала научимся находить НОК по очереди для двух чисел. Затем соберём его из простых множителей всех исходных чисел.</p><p class="muted">${count('example')} разобранных примера, ${count('practice')} тренировочных условий с выбором способа и ${count('check')} новых проверочных заданий.</p><a class="button-link" href="${unitURL(unit)}">НОК трёх и более чисел →</a></section>`;
  }
  function supplementTasksHTML(unit) {
    const names={example:'Пример',practice:'Тренировка',check:'Проверка'};
    return Object.entries(supplementStages).map(([stage,title])=>`<section class="supplement-stage" data-lcm-stage="${stage}"><h2>${title}</h2>${stage==='check'?'<p class="muted">Это новые условия. Реши выбранным в задании способом на листе или в уме и введи ответ. Подсказку можно открыть, если понадобится.</p>':'<p class="muted">У каждого условия два способа. Пройди один, затем сравни со вторым. Шаги каждого способа сохраняются отдельно.</p>'}<div class="supplement-cases">${supplementGroups(unit,stage).map((group,index)=>`<article class="card lcm-group" data-lcm-group="${text(group.id)}"><h3>${names[stage]} ${index+1}</h3><p>Найди НОК чисел <strong>${group.numbers.map(text).join(', ')}</strong>.</p><div class="lcm-methods">${group.tasks.map(task=>`<div><a class="button-link${task.method==='factors'?' secondary':''}" data-lcm-method="${text(task.method)}" href="${taskURL(unit,task)}">${text(methodLabels[task.method])}${stage==='check'?' · проверить себя':''}</a><small>${text(statusLabels[state.tasks[task.id]?.status]||(hasPriorWork(state.tasks[task.id])||state.tasks[task.id]?.draft||state.tasks[task.id]?.stepDrafts?.some(Boolean)?'Продолжить сохранённые шаги':stage==='check'?'Ещё не решали':'Начать по шагам'))}</small></div>`).join('')}</div></article>`).join('')}</div></section>`).join('');
  }
  function renderSupplementUnit(unit) {
    setSupplementView(false);
    const epoch=++renderEpoch,hash=location.hash,progress=progressSummary(unit);
    const next=unit.tasks.find(task=>!state.tasks[task.id]?.status)||unit.tasks[0];
    main.innerHTML=`<nav class="breadcrumb" aria-label="Путь"><a href="#">Все темы</a><span>›</span><span>НОК трёх и более чисел</span></nav><p class="eyebrow">${text(Sources.unitSectionLabel(unit))}</p><h1>${text(unit.title)}</h1><p class="intro">${fmt(unit.goal)}</p><a class="button-link" href="${taskURL(unit,next)}">${progress.total?'Продолжить разборы':'Начать с первого примера'} →</a><details class="card rules supplement-rules"><summary>Правила двух способов и частые ошибки</summary>${unit.rules.map(rule=>`<article><h2>${text(rule.title)}</h2><p>${fmt(rule.text)}</p></article>`).join('')}<h2>Где легко ошибиться</h2><ul>${unit.pitfalls.map(pitfall=>`<li>${fmt(pitfall)}</li>`).join('')}</ul></details><details class="card supplement-support"><summary>Вспомнить простые числа и действия</summary><aside data-study-support aria-label="Справка и повторение"></aside></details>${unit.prereq?.length?`<p class="unit-rule-link">Прежние темы: ${unit.prereq.map(id=>unitMap.get(id)).filter(Boolean).map(topic=>`<a href="${unitURL(topic)}">${text(topic.title)}</a>`).join(' · ')}.</p>`:''}${supplementTasksHTML(unit)}<p class="status-detail">Завершено разборов по шагам: ${progress.counts.learned+progress.counts.assisted}. Самостоятельных решений: ${progress.counts.independent}. Повторных решений: ${progress.counts.repeated}. Каждое условие в двух способах хранится как две отдельные работы.</p><a href="#">Вернуться ко всем прежним темам</a>`;
    mountSupport(unit,epoch,hash);
    guardLinks(epoch,hash);
  }
  function alternativeMethodHTML(unit,task) {
    if(!isSupplement(unit)||task.stage==='check')return '';
    if(managed)return '<p class="method-return-note">Другой способ можно открыть в маршруте кабинета. Шаги текущей работы сохраняются отдельно.</p>';
    const alternative=unit.tasks.find(candidate=>candidate.id===task.alternativeId)||unit.tasks.find(candidate=>candidate.groupId===task.groupId&&candidate.stage===task.stage&&candidate.method!==task.method);
    if(!alternative)return '';
    return `<div class="method-switch"><a class="button-link secondary" href="${taskURL(unit,alternative)}">Другой способ: ${text(methodLabels[alternative.method])}</a><small>Шаги обоих способов сохраняются отдельно. Можно вернуться к начатому решению.</small></div>`;
  }
  function renderHome() {
    setSupplementView(false);
    const epoch=++renderEpoch,hash=location.hash;
    const last=parseRoute(state.last), resume=last && unitMap.has(last.unit)?state.last:'';
    main.innerHTML=`<div class="intro"><p class="eyebrow">Математика · 6 класс · часть 1</p><h1>Разберёмся по учебнику</h1><p>Сначала — короткое правило и решение по шагам. Затем — задания из учебника для самостоятельной работы. Рядом с условием — номер упражнения или название примера и ссылка на страницу учебника.</p><p class="muted">Начни с нужной темы. Если что-то не получается, открой подсказку: условие и уже выполненные действия останутся перед тобой.</p>${resume?`<a class="button-link" href="${text(resume)}">Продолжить занятие</a>`:''}</div>${units.filter(isSupplement).map(supplementOverviewHTML).join('')}<div class="topic-grid">${bookUnits().map(u=>{const p=progressSummary(u);return `<a class="topic-card" href="${unitURL(u)}"><span class="eyebrow">${text(Sources.pointLabel(u.id))} · с. ${u.page}–${u.endPage}</span><strong>${text(u.title)}</strong><small>${p.total?`Выполнено заданий: ${p.total} из ${u.tasks.length}`:'Правило · решение по шагам · практика'}</small></a>`;}).join('')}</div><p class="muted">Здесь собраны выбранные упражнения из всех 23 тем первой части и примеры для повторения. Выполненные упражнения показывают твою работу, но сами по себе не означают, что вся тема уже освоена.</p>`;
    guardLinks(epoch,hash);
  }
  function renderUnit(unit) {
    if(isSupplement(unit)){renderSupplementUnit(unit);return;}
    setSupplementView(false);
    const epoch=++renderEpoch,hash=location.hash,live=()=>viewIsCurrent(epoch,hash);
    const progress=progressSummary(unit), next=unit.tasks.find(t=>!state.tasks[t.id]?.status) || unit.tasks[0];
    main.innerHTML=`<nav class="breadcrumb" aria-label="Путь"><a href="#">Все темы</a><span>›</span><span>${text(Sources.pointLabel(unit.id))}</span></nav><p class="eyebrow">${text(Sources.sectionLabel(unit.id))} · с. ${unit.page}–${unit.endPage}</p><h1>${text(unit.title)}</h1><p class="intro">${fmt(unit.goal)}</p>${unit.prereq?.length?`<p class="unit-rule-link">Пригодится: ${unit.prereq.map(id=>unitMap.get(id)).filter(Boolean).map(u=>`<a href="${unitURL(u)}">${text(u.title)}</a>`).join(' · ')}.</p>`:''}<section class="card rules" aria-label="Коротко о главном">${unit.rules.map(r=>`<article><h2>${text(r.title)}</h2><p>${fmt(r.text)}</p></article>`).join('')}${unit.pitfalls?.length?`<details data-disclosure="pitfalls"><summary>Где легко ошибиться</summary><ul>${unit.pitfalls.map(p=>`<li>${fmt(p)}</li>`).join('')}</ul></details>`:''}</section><aside class="card" data-study-support aria-label="Справка и повторение"></aside><a class="button-link" href="${taskURL(unit,next)}">${progress.total?'Продолжить задания':'Начать с решения по шагам'}</a><div class="task-groups">${['learn','practice','check'].map(role=>`<section class="card"><h2>${roleLabels[role]}</h2><ol>${unit.tasks.filter(t=>t.role===role).map(t=>`<li><a href="${taskURL(unit,t)}">${text(Sources.taskLabel(t))}</a><small>${statusLabels[state.tasks[t.id]?.status] || (role==='learn'?'Один шаг за другим':'Попробуй решить сам')}</small></li>`).join('')}</ol></section>`).join('')}</div>${progress.total?`<p class="status-detail">Выполнено ${progress.total} из ${unit.tasks.length}. Самостоятельно с первого прохождения: ${progress.counts.independent}. По шагам и с помощью: ${progress.counts.learned+progress.counts.assisted}. По памятке: ${progress.counts.manual}. Повторно: ${progress.counts.repeated}.</p>`:''}<p class="muted">После этой подборки попробуй ещё одно задание того же вида в учебнике. Не торопись переходить дальше, если пока нужна помощь.</p><div class="reset"><button type="button" data-action="ask-reset">Начать эту тему заново</button>${resetPending?`<div class="reset-confirm"><p>Очистить только ответы и отметки этой темы в этом браузере?</p><button type="button" data-action="confirm-reset">Да, начать заново</button> <button type="button" data-action="cancel-reset">Отмена</button></div>`:''}</div>`;
    mountSupport(unit,epoch,hash);
    main.querySelector('[data-action="ask-reset"]').addEventListener('click',()=>{if(!live())return;resetPending=true;renderUnit(unit);});
    main.querySelector('[data-action="cancel-reset"]')?.addEventListener('click',()=>{if(!live())return;resetPending=false;renderUnit(unit);});
    main.querySelector('[data-action="confirm-reset"]')?.addEventListener('click',()=>{if(!live())return;unit.tasks.forEach(t=>{const old=state.tasks[t.id];delete state.tasks[t.id];if(hasPriorWork(old))getProgress(t).repeated=true;});resetPending=false;save();renderUnit(unit);});
    const disclosure=main.querySelector('[data-disclosure="pitfalls"]');
    if(disclosure){disclosure.open=state[`pitfalls${unit.id}`]===true;disclosure.addEventListener('toggle',()=>{if(!live())return;state[`pitfalls${unit.id}`]=disclosure.open;save();});}
    guardLinks(epoch,hash);
  }
  function itemKey(p) {return p.mode==='guided'?p.step:'final';}
  function activeItem(task,p) {return p.mode==='guided'?task.steps[p.step]:task;}
  function feedbackHTML(item,p,key,author=false) {
    const f=p.feedback[String(key)]; if(!f)return '';
    const hintVisible=p.hintKeys.includes(key)&&!p.hiddenHints.includes(key);
    const help=item.hint&&hintVisible?'В подсказке ниже указано, с какого действия начать. Можешь попробовать ещё раз.':item.hint&&(p.wrongCounts[String(key)]||0)>=2?'Хочешь подсказку? Нажми «Подсказка к этому шагу» или попробуй ещё раз.':'Сверь числа с условием и проверь последнее действие. Можно попробовать ещё раз.';
    let message=f.kind==='format'?`Проверь запись ответа. ${M.formats[item.answerType || 'number']}`:f.kind==='manual'?'Проверь каждый пункт памятки и поставь отметку, когда он выполнен.':`Пока не получилось. ${help}`;
    const operands=Array.isArray(item.lcmInputs)?item.lcmInputs:key==='final'&&item.source?.kind==='author'?item.numbers:null;
    const raw=key==='final'?p.draft:p.stepDrafts[key],answer=Number(raw),expected=Number(item.answer);
    if(author&&f.kind==='wrong'&&item.answerType==='integer'&&typeof raw==='string'&&/^\+?\d+$/.test(raw.trim())&&Number.isSafeInteger(answer)&&Number.isSafeInteger(expected)&&answer>expected&&Array.isArray(operands)&&operands.length>=2&&operands.every(number=>Number.isSafeInteger(number)&&number>0&&answer%number===0)){
      message='Это общее кратное, но есть меньшее. Найди наименьшее.'+((p.wrongCounts[String(key)]||0)>=2?' '+help:'');
    }
    return `<div class="feedback" role="status">${fmt(message)}</div>`;
  }
  function entryHTML(item,p,key) {
    if(item.answerType==='self-check'){
      const checks=p.manualChecks[String(key)] || [], criteria=item.selfCheck || [];
      return `<p class="manual-note">Это задание с построением в тетради. Программа не проверяет рисунок: ты сверяешь его с памяткой. Если есть сомнение, покажи рисунок учителю.</p><div class="checklist">${criteria.map((c,i)=>`<label><input type="checkbox" data-criterion="${i}" ${checks[i]?'checked':''}> <span>${fmt(c)}</span></label>`).join('')}</div><button class="primary" type="submit">Я проверил каждый пункт</button>`;
    }
    const draft=key==='final'?p.draft:p.stepDrafts[key] || '';
    return `<label class="entry-label" for="answer">${fmt(item.inputLabel || item.prompt || 'Твой ответ')}${item.unit?` (${text(item.unit)})`:''}</label>${item.options?.length?`<div class="options" aria-label="Варианты ответа">${item.options.map(option=>`<button type="button" data-option="${text(option)}" class="${draft===option?'selected':''}" aria-pressed="${draft===option}">${fmt(option)}</button>`).join('')}</div>`:''}<div class="answer-row"><input id="answer" name="answer" type="text" maxlength="180" autocomplete="off" spellcheck="false" aria-describedby="answer-format" value="${text(draft)}"><button class="primary" type="submit">Проверить</button></div><p class="format-help" id="answer-format">${text(M.formats[item.answerType || 'number'])}</p>`;
  }
  function complete(task,p,manual=false) {
    if(state.activeCheck===task.id)delete state.activeCheck;
    p.status=resultStatus(task,p,manual);
  }
  function renderTask(unit,task,focusAnswer=false) {
    const author=isSupplement(unit);
    setSupplementView(author);
    const epoch=++renderEpoch,hash=location.hash;
    const p=getProgress(task), isComplete=!!p.status, guided=p.mode==='guided', item=activeItem(task,p), key=itemKey(p), idx=unit.tasks.findIndex(t=>t.id===task.id), next=unit.tasks[idx+1];
    const doneSteps=guided?task.steps.slice(0,p.step):[];
    const live=()=>viewIsCurrent(epoch,hash)&&state.tasks[task.id]===p&&!p.status&&p.mode===(guided?'guided':'independent')&&itemKey(p)===key;
    const hintVisible=p.hintKeys.includes(key)&&!p.hiddenHints.includes(key);
    main.innerHTML=`<nav class="breadcrumb" aria-label="Путь"><a href="#">Все темы</a><span>›</span><a href="${unitURL(unit)}">${text(unit.title)}</a></nav><p class="eyebrow">${author?supplementStages[task.stage]:roleLabels[task.role]} · задание ${managed?(managedUnits.find(u=>u.id===unit.id)?.tasks.findIndex(t=>t.id===task.id)??idx)+1:idx+1} из ${managed?(managedUnits.find(u=>u.id===unit.id)?.tasks.length??unit.tasks.length):unit.tasks.length}</p><div class="task-layout"><section class="card condition">${author?`<h1>Найди НОК</h1><p class="prompt">${fmt(task.prompt)}</p>${sourceHTML(task,unit)}`:`<h1>Условие задания</h1>${sourceHTML(task,unit)}<p class="prompt">${fmt(task.prompt)}</p>`}${visualHTML(task.visual)}<details data-disclosure="rule" ${p.ruleOpen?'open':''}><summary>Вспомнить правило</summary>${unit.rules.map(r=>`<h3>${text(r.title)}</h3><p>${fmt(r.text)}</p>`).join('')}</details>${author?'<details class="supplement-support"><summary>Вспомнить простые числа и действия</summary><aside data-study-support aria-label="Справка и повторение"></aside></details>':'<aside data-study-support aria-label="Справка и повторение"></aside>'}</section><section class="card work" aria-label="Решение">${p.repeated?'<p class="pill">Повторное решение знакомого задания</p>':''}${doneSteps.length?`<ol class="step-history">${doneSteps.map((step,i)=>`<li><span class="step-label">Шаг ${i+1} ${p.revealedSteps.includes(i)?'разобран с объяснением':'выполнен'}</span><p>${fmt(step.prompt)}</p><p class="equation">${fmt(step.explain || p.stepDrafts[i] || '')}</p>${step.answerType==='self-check'?'<small>Отмечено по памятке, без автоматической проверки рисунка.</small>':''}</li>`).join('')}</ol>`:''}${isComplete?`<h2>${text(statusLabels[p.status])}</h2>${!guided&&task.answerType!=='self-check'?`<p>Твой ответ: <strong>${fmt(p.draft)}</strong>${task.unit?` ${text(task.unit)}`:''}.</p>`:''}<p class="status-detail">${p.status==='independent'?'Ты справился без подсказки в этом задании.':p.status==='manual'?'Сохранена твоя отметка самопроверки. Правильность рисунка программа не оценивала.':p.status==='repeated'?'Это повтор знакомого задания. Для проверки темы реши ещё одно из учебника.':p.status==='learned'?'Теперь попробуй похожее задание самостоятельно.':'Подсказки помогли выполнить задание. Позже попробуй ещё одно без помощи.'}</p><div class="actions">${next?`<a class="button-link" href="${taskURL(unit,next)}">${next.role!==task.role?roleLabels[next.role]:'Следующее задание'}</a>`:`<a class="button-link" href="${unitURL(unit)}">К итогам темы</a>`}<button type="button" data-action="repeat">Решить ещё раз</button>${task.solution.length&&!p.solution?`<button type="button" data-action="review-solution">${p.reviewedAfter?'Скрыть решение':'Посмотреть решение после ответа'}</button>`:''}</div>`:`<h2>${guided?`Шаг ${p.step+1} из ${task.steps.length}`:task.answerType==='self-check'?'Выполни и проверь построение':'Попробуй решить самостоятельно'}</h2>${guided&&item.answerType==='self-check'?`<p>${fmt(item.prompt)}</p>`:''}<form id="answer-form" novalidate>${entryHTML(item,p,key)}</form>${feedbackHTML(item,p,key,author)}${hintVisible&&item.hint?`<div class="hint"><strong>Подсказка.</strong> ${fmt(item.hint)}</div>`:''}<div class="help-actions">${item.hint?`<button type="button" data-action="hint">${hintVisible?'Скрыть подсказку':'Подсказка к этому шагу'}</button>`:''}${guided&&item.answerType!=='self-check'?'<button type="button" data-action="reveal-step">Показать этот шаг</button>':''}${!guided&&task.steps.length?'<button type="button" data-action="guide">Разобрать по шагам</button>':''}${p.hintKeys.includes(key)||guided&&p.step>0?'<button type="button" data-action="solution">Посмотреть всё решение</button>':''}</div>${guided&&p.revealedSteps.includes(key)?`<div class="solution"><h3>Разбор этого шага</h3><p>${fmt(item.explain || `Ответ: ${Array.isArray(item.answer)?item.answer[0]:item.answer}`)}</p><button type="button" data-action="continue-step">Понятно, перейти дальше</button></div>`:''}${p.helped?'<p class="status-detail">Это задание выполняется с помощью.</p>':''}`}${p.solution||p.reviewedAfter?`<div class="solution"><h3>Решение для проверки</h3>${p.reviewedAfter?'<p class="status-detail">Ты открыл решение после ответа. Отметка за выполненное задание сохранена.</p>':''}${task.solution.map(line=>`<p>${fmt(line)}</p>`).join('')}</div>`:''}</section></div>${alternativeMethodHTML(unit,task)}<div class="actions">${idx>0?`<a class="button-link secondary" href="${taskURL(unit,unit.tasks[idx-1])}">Предыдущее задание</a>`:''}<a href="${unitURL(unit)}">К правилу и списку заданий</a>${!isComplete&&next?`<a href="${taskURL(unit,next)}">Пропустить пока</a>`:''}</div>`;
    if(author){
      // Keep the condition and active entry first on small screens. Help remains
      // available below the work area and still records assistance normally.
      const reference=document.createElement('section');reference.className='card supplement-task-reference';
      // The cabinet already names this author task above the frame. Keep its
      // stage/count available with the reference material without repeating
      // that heading above the current input on a small managed screen.
      const position=managed?main.querySelector(':scope > .eyebrow'):null;
      if(position)reference.append(position);
      const condition=main.querySelector('.condition');
      reference.append(condition.querySelector('[data-disclosure="rule"]'),condition.querySelector('.supplement-support'));
      main.querySelector('.task-layout').after(reference);
      if(!isComplete){
        const history=main.querySelector('.step-history');
        if(history){const heading=document.createElement('h2');heading.className='retained-step-heading';heading.textContent='Уже выполненные шаги';main.querySelector('.work').append(heading,history);}
      }
    }
    mountSupport(unit,epoch,hash,task,p);
    main.querySelector('.source a')?.addEventListener('click',()=>{if(!viewIsCurrent(epoch,hash))return;if(!p.status){p.helped=true;save();}});
    const rule=main.querySelector('[data-disclosure="rule"]');
    rule.addEventListener('toggle',()=>{if(!viewIsCurrent(epoch,hash)||isComplete)return;p.ruleOpen=rule.open;if(rule.open){p.helped=true;}save();});
    main.querySelector('[data-action="repeat"]')?.addEventListener('click',()=>{if(!viewIsCurrent(epoch,hash)||state.tasks[task.id]!==p||!p.status)return;if(managed){save('new-task');return;}const old=p;delete state.tasks[task.id];const fresh=getProgress(task);fresh.repeated=true;fresh.attempts=old.attempts;save();renderTask(unit,task,true);});
    main.querySelector('[data-action="review-solution"]')?.addEventListener('click',()=>{if(!viewIsCurrent(epoch,hash)||state.tasks[task.id]!==p||!p.status)return;p.reviewedAfter=!p.reviewedAfter;save();renderTask(unit,task);});
    guardLinks(epoch,hash);
    if(isComplete)return;
    const input=main.querySelector('#answer');
    input?.addEventListener('input',()=>{if(!live())return;input.value=input.value.slice(0,180);if(key==='final')p.draft=input.value;else p.stepDrafts[key]=input.value;delete p.feedback[String(key)];save();});
    main.querySelectorAll('[data-option]').forEach(button=>button.addEventListener('click',()=>{if(!live())return;const v=button.dataset.option;if(key==='final')p.draft=v;else p.stepDrafts[key]=v;delete p.feedback[String(key)];save();renderTask(unit,task,true);}));
    main.querySelectorAll('[data-criterion]').forEach(box=>box.addEventListener('change',()=>{if(!live())return;const previous=p.manualChecks[String(key)] || [],list=Array.from({length:(item.selfCheck||[]).length},(_,i)=>previous[i]===true);list[Number(box.dataset.criterion)]=box.checked;p.manualChecks[String(key)]=list;delete p.feedback[String(key)];save();}));
    const answerForm=main.querySelector('#answer-form');
    const submitAnswer=event=>{
      event.preventDefault();
      if(!live())return;
      let ok=false;
      if(item.answerType==='self-check'){
        const criteria=item.selfCheck || [],checks=p.manualChecks[String(key)] || [];ok=criteria.length>0&&criteria.every((_,i)=>checks[i]);
        if(!ok)p.feedback[String(key)]={kind:'manual'};
      }else{
        const value=input.value.slice(0,180);input.value=value;p.attempts=Math.min(10000,p.attempts+1);if(key==='final')p.draft=value;else p.stepDrafts[key]=value;
        const result=M.check(value,item.answer,item.answerType || 'number');ok=result.ok;
        if(!ok){p.feedback[String(key)]={kind:result.format?'wrong':'format'};if(result.format)p.wrongCounts[String(key)]=Math.min(10000,(p.wrongCounts[String(key)]||0)+1);}
      }
      if(ok){delete p.feedback[String(key)];if(guided){p.step++;if(p.step>=task.steps.length)complete(task,p,task.answerType==='self-check'||item.answerType==='self-check');}else complete(task,p,task.answerType==='self-check');}
      save(item.answerType==='self-check'&&!ok?'input':'check',{scope:item.answerType==='self-check'?'manual':guided?'step':'final',...(item.answerType==='self-check'?{}:guided?{step:key,answer:input.value.slice(0,180)}:{answer:input.value.slice(0,180)})});renderTask(unit,task,true);
    };
    answerForm.addEventListener('submit',submitAnswer);
    // Answer checking never needs native form navigation. Explicit UI actions
    // also work when this renderer is hosted in a form-restricted frame.
    answerForm.querySelector('[type=submit]')?.addEventListener('click',submitAnswer);
    answerForm.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing&&event.target===input)submitAnswer(event);});
    main.querySelector('[data-action="hint"]')?.addEventListener('click',()=>{if(!live())return;if(hintVisible)p.hiddenHints.push(key);else{p.hiddenHints=p.hiddenHints.filter(k=>k!==key);if(!p.hintKeys.includes(key))p.hintKeys.push(key);}p.helped=true;save();renderTask(unit,task);});
    main.querySelector('[data-action="reveal-step"]')?.addEventListener('click',()=>{if(!live())return;if(!p.revealedSteps.includes(key))p.revealedSteps.push(key);p.helped=true;save();renderTask(unit,task);});
    main.querySelector('[data-action="continue-step"]')?.addEventListener('click',()=>{if(!live()||!p.revealedSteps.includes(key))return;p.step++;if(p.step>=task.steps.length)complete(task,p,task.answerType==='self-check');save('check',{scope:'guided'});renderTask(unit,task,true);});
    main.querySelector('[data-action="guide"]')?.addEventListener('click',()=>{if(!live())return;p.mode='guided';p.helped=true;save();renderTask(unit,task,true);});
    main.querySelector('[data-action="solution"]')?.addEventListener('click',()=>{if(!live())return;p.solution=true;p.helped=true;save();renderTask(unit,task);});
    if(focusAnswer){
      input?.focus({preventScroll:true});
      // A new author step can be longer than the previous one. Reveal the
      // whole current form, including its question and check button, inside
      // this document; the cabinet also reveals the owning frame on checks.
      if(author)answerForm.scrollIntoView?.({block:'center',inline:'nearest'});
    }
  }
  function renderProgress() {
    setSupplementView(false);
    const epoch=++renderEpoch,hash=location.hash;
    const practiced=units.filter(u=>progressSummary(u).total>0);
    main.innerHTML=`<nav class="breadcrumb" aria-label="Путь"><a href="#">Все темы</a></nav><h1>Моя работа</h1><p class="intro">Здесь видны выполненные задания. Отдельно отмечены решения с помощью, самопроверка рисунков и повторные решения знакомых примеров. Эти отметки не заменяют проверку понимания всей темы.</p>${practiced.length?practiced.map(u=>`<section class="card rules"><h2><a href="${unitURL(u)}">${text(u.title)}</a></h2><ul>${u.tasks.filter(t=>state.tasks[t.id]?.status).map(t=>`<li><a href="${taskURL(u,t)}">${t.source.kind==='author'?text(Sources.taskLabel(t)):t.source.number?`№ ${text(t.source.number)}`:text(t.source.kind==='question'?'Вопрос из учебника':t.source.kind==='check'?'Проверочная работа из учебника':'Пример из учебника')}${t.source.part?` · ${text(t.source.part)}`:''}</a> — ${text(statusLabels[state.tasks[t.id].status])}</li>`).join('')}</ul></section>`).join(''):'<p>Пока нет выполненных заданий. Начни с нужной темы — ответы сохранятся в этом браузере.</p>'}<a class="button-link" href="#">Выбрать тему</a>`;
    guardLinks(epoch,hash);
  }
  function renderBook() {
    setSupplementView(false);
    const epoch=++renderEpoch,hash=location.hash;
    main.innerHTML=`<nav class="breadcrumb" aria-label="Путь"><a href="#">Все темы</a></nav><h1>Учебник, часть 1</h1><p class="intro">Н. Я. Виленкин и соавторы. «Математика. 6 класс», часть 1, 2024 год. В заданиях курса указан номер упражнения и печатная страница этого издания.</p><a class="button-link" href="textbook.pdf" target="_blank" rel="noopener">Открыть учебник</a><div class="topic-grid">${bookUnits().map(u=>`<a class="topic-card" href="textbook.pdf#page=${u.page+1}" target="_blank" rel="noopener"><strong>${text(u.title)}</strong><small>С. ${u.page}–${u.endPage}</small></a>`).join('')}</div>`;
    guardLinks(epoch,hash);
  }
  function managedRoute(){return managedSpec?`#unit/${managedSpec.unitId}/task/${encodeURIComponent(managedSpec.contentId)}`:'';}
  function managedSnapshot(){
    if(!managedSpec||!managedContracts)throw Error('MANAGED_TASK_NOT_READY');
    const task=getProgress(taskMap.get(managedSpec.contentId));
    // A revealed step can leave holes before the next typed answer.
    const record={...task,ruleOpen:task.ruleOpen===true,stepDrafts:Array.from(task.stepDrafts,value=>value||''),manualChecks:Object.fromEntries(Object.entries(task.manualChecks).map(([key,checks])=>[key,Array.from(checks,value=>value===true)]))};
    return managedContracts.normalize(managedSpec,{schema:'mathexam-vilenkin6-textbook-state',version:1,contentId:managedSpec.contentId,seed:managedSpec.seed,route:managedRoute(),task:record});
  }
  function managedAccess(value){
    managedReadonly=!!value;main.inert=managedReadonly||!managedReady;
    document.body.dataset.managedReadonly=String(managedReadonly);
    main.querySelectorAll('[data-managed-course-catalog]').forEach(link=>link.setAttribute('aria-disabled',String(managedReadonly||!managedReady)));
  }
  function initManaged(){
    document.body.classList.add('managed');
    main.innerHTML='<h1>Задание курса</h1><p role="status">Открываем сохранённую работу из кабинета…</p>';
    document.querySelector('.site-header nav')?.replaceChildren();
    const brand=document.querySelector('.site-header .brand');if(brand)brand.removeAttribute('href');
    const note=document.createElement('p');note.className='managed-course-note';note.textContent='Работа сохраняется в кабинете. Вернуться к каталогу можно по ссылке «Все темы курса» над заданием.';main.before(note);
    announceStorage(true);managedAccess(true);
    if(!window.MathExamLearning?.enabled||!window.VilenkinTextbookLearning?.createFactory){
      main.innerHTML='<h1>Открой задание из кабинета</h1><p>Связь с кабинетом не установлена. Сохранённые работы остаются на сервере.</p>';return;
    }
    managedUnits=units;
    managedContracts=window.VilenkinTextbookLearning.createFactory(managedUnits,M,window.VilenkinTextbookCatalog);
    window.MathExamLearning.register({trainerId:'vilenkin6-textbook',contentVersion:1,getState:managedSnapshot,setReadOnly:managedAccess,
      subscribe(callback){managedNotify=callback;return()=>{managedNotify=()=>{};};},
      applyState({taskSpec,state:incomingState,readOnly}){
        const incoming=managedContracts.normalize(taskSpec,incomingState);
        const canonical=managedContracts.create(taskSpec.contentId,taskSpec.seed).taskSpec;
        if(JSON.stringify(canonical)!==JSON.stringify(taskSpec))throw Error('MANAGED_TASK_MISMATCH');
        const same=managedReady&&JSON.stringify(managedSpec)===JSON.stringify(taskSpec)&&JSON.stringify(managedSnapshot())===JSON.stringify(incoming);
        managedAccess(readOnly);if(same)return;
        const active=document.activeElement,selection=active?.id==='answer'&&typeof active.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null;
        managedApplying=true;
        try{
          managedSpec=JSON.parse(JSON.stringify(taskSpec));
          const sourceUnit=managedUnits.find(unit=>unit.id===managedSpec.unitId),task=sourceUnit?.tasks.find(item=>item.id===managedSpec.contentId);
          if(!task)throw Error('MANAGED_TASK_UNKNOWN');
          const unit={...sourceUnit,tasks:[task]};units=[unit];unitMap=new Map([[unit.id,unit]]);taskMap=new Map([[task.id,task]]);
          state={version:1,last:incoming.route,tasks:{[task.id]:JSON.parse(JSON.stringify(incoming.task))}};
          history.replaceState(null,'',incoming.route);managedReady=true;renderTask(unit,task);
          if(selection&&!readOnly){const field=main.querySelector('#answer');field?.focus({preventScroll:true});field?.setSelectionRange?.(...selection);}
        }finally{managedApplying=false;managedAccess(readOnly);}
      }
    });
  }
  function parseRoute(hash) {
    const s=String(hash || '').slice(0,250),m=s.match(/^#(?:unit|module)\/(\d+)(?:\/task\/([^/]+))?$/);
    if(!m)return null;try{return {unit:Number(m[1]),task:m[2]?decodeURIComponent(m[2]):null};}catch(_){return null;}
  }
  function route() {
    if(managed){
      if(!managedReady)return;
      if(location.hash!==managedRoute())history.replaceState(null,'',managedRoute());
      if(managedReadonly||managedApplying)return;
      const unit=unitMap.get(managedSpec.unitId),task=taskMap.get(managedSpec.contentId);renderTask(unit,task);return;
    }
    resetPending=false;
    const arriving=parseRoute(location.hash);
    if(state.activeCheck&&(location.hash==='#book'||arriving&&!arriving.task)){const checked=taskMap.get(state.activeCheck);if(checked&&!getProgress(checked).status)getProgress(checked).helped=true;delete state.activeCheck;save();}
    if(location.hash==='#progress'){renderProgress();return;}
    if(location.hash==='#book'){renderBook();return;}
    const parsed=parseRoute(location.hash),unit=parsed&&unitMap.get(parsed.unit);
    if(!unit){renderHome();return;}
    state.last=location.hash;save();
    const task=parsed.task&&unit.tasks.find(t=>t.id===parsed.task);
    if(task){if(task.role==='check'&&!getProgress(task).status){state.activeCheck=task.id;save();}else if(task.role==='learn'&&state.activeCheck){const checked=taskMap.get(state.activeCheck);if(checked&&!getProgress(checked).status)getProgress(checked).helped=true;delete state.activeCheck;save();}renderTask(unit,task);}else renderUnit(unit);
    main.focus({preventScroll:true});window.scrollTo?.(0,0);
  }
  async function start() {
    try{
      const files=['A','B','C','D'].map(name=>`textbook-data/units-${name}.json`).concat('textbook-data/supplement-lcm-multi.json');
      const groups=await Promise.all(files.map(async name=>{const r=await fetch(name,{cache:'no-cache'});if(!r.ok)throw new Error('load');return r.json();}));
      const originals=groups.slice(0,4).flat().sort((a,b)=>a.id-b.id);
      if(originals.length!==24||originals.some((u,i)=>u.id!==i||!Array.isArray(u.tasks)||!u.tasks.length||!Array.isArray(u.rules)))throw new Error('data');
      // Authored practice is validated separately; it never becomes a textbook
      // point or weakens the original 24-unit/source-number contract.
      const supplements=groups[4],supplement=Array.isArray(supplements)&&supplements[0];
      if(!Array.isArray(supplements)||supplements.length!==1||!isSupplement(supplement)||supplement.relatedPoint!==8||!Array.isArray(supplement.rules)||!supplement.rules.length||!Array.isArray(supplement.pitfalls)||!Array.isArray(supplement.tasks)||supplement.tasks.length!==44)throw new Error('supplement');
      for(const task of supplement.tasks){
        if(!/^v6-author-lcm-(example|practice|check)-[0-9]{2}-(chain|factors)$/.test(task.id)||task.source?.kind!=='author'||typeof task.source.label!=='string'||!task.source.label.trim()||task.source.relatedPoint!==8||Object.hasOwn(task.source,'number')||Object.hasOwn(task.source,'page')||!Object.hasOwn(supplementStages,task.stage)||!Object.hasOwn(methodLabels,task.method)||task.role!==(task.stage==='check'?'check':'learn')||typeof task.groupId!=='string'||!Array.isArray(task.numbers)||task.numbers.length<3||task.numbers.length>5||task.numbers.some(number=>!Number.isSafeInteger(number)||number<1))throw new Error('author task');
      }
      units=originals.concat(supplements);
      units.forEach(u=>{unitMap.set(u.id,u);u.tasks.forEach(t=>{if(taskMap.has(t.id)||!t.source||!Array.isArray(t.steps)||!t.steps.length||!Array.isArray(t.solution))throw new Error('task');taskMap.set(t.id,t);});});
      if(managed)initManaged();else{loadState();route();}window.addEventListener('hashchange',route);
      window.VilenkinTextbook={key:KEY,units,math:M,ready:true};
    }catch(_){const epoch=++renderEpoch,hash=location.hash;main.innerHTML='<section class="card error-card"><h1>Не удалось открыть задания</h1><p>Проверь соединение и попробуй ещё раз. Сохранённые ответы останутся в этом браузере.</p><button type="button" id="retry-load">Открыть снова</button> <a href="textbook.pdf">Открыть учебник</a></section>';main.querySelector('#retry-load').addEventListener('click',()=>{if(viewIsCurrent(epoch,hash))location.reload();});guardLinks(epoch,hash);}
  }
  start();
})();
