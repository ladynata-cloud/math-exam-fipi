/* Course navigation uses existing attempts and the read-only progress summary. */
(function(root){
'use strict';
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const completed=new Set(['independent','repeated','hinted','together','practiced']);
const independent=new Set(['independent','repeated']);
function foundationsView(course){
 return (course.foundationTracks||[]).map(track=>`<section id="arithmetic-track-${E(track.id)}" data-foundation-track="${E(track.id)}" class="division-course-track"><header class="division-course-track-heading"><h2>${E(track.title)}</h2><p>${E(track.lead)}</p><p>Шесть шагов от простого к сложному. Упражнения откроются отдельно; работа сохраняется в той вкладке и не входит в прогресс кабинета.</p></header><ol class="division-course-list">${track.stages.map((stage,i)=>`<li class="division-course-step"><span class="division-course-number" aria-hidden="true">${i+1}</span><article><h3>${E(stage.title)}</h3><p>${E(stage.goal)}</p><a class="button" href="https://mathexam.space${E(stage.url)}" target="_blank" rel="noopener">Начать шаг ${i+1} ↗</a></article></li>`).join('')}</ol></section>`).join('');
}
function entry(){return '<section class="division-course-entry"><div><p class="eyebrow">ЧЕТЫРЕ ЛИНЕЙКИ</p><h2>Сложение, вычитание, умножение и деление</h2><p>Начни с проверки или выбери нужный навык. В каждой линейке двигайся сверху вниз.</p></div><a class="button" href="#division-course">Открыть маршруты →</a></section>';}
function mount(host,context){
 const tracks=(root.ArithmeticCourse||root.DivisionCourse)?.tracks||[],teacher=context.account.role==='teacher';
 let alive=true,progress=null,loadError=false;
 const section=document.createElement('section');section.className='division-course';host.replaceChildren(section);
 const rows=()=>new Map((progress||[]).map(row=>[row.trainerId+':'+row.contentId,row]));
 const rowFor=(item,summary)=>summary.get((item.trainerId||'oge-basics')+':'+(item.contentId||item.id));
 const finished=(stage,row)=>Boolean(row?.completed)&&completed.has(row.latest?.outcome)&&(stage.guidance!=='check'||independent.has(row.latest?.outcome));
 function status(stage,row){
  if(teacher)return stage.guidance==='check'?'Три новых примера для проверки':'Объяснение и упражнения';
  if(!progress)return loadError?'История пока не загрузилась':'Загружаем сохранённую работу…';
  if(!row)return 'Ещё не начинали';
  if(row.latest?.outcome==='started')return 'Начато. Можно продолжить с того же места.';
  if(stage.guidance==='check'&&independent.has(row.latest?.outcome))return 'Три примера решены без подсказок.';
  if(stage.guidance==='check')return 'Попробуй новые примеры без подсказок.';
  return row.completed?'Есть решение по шагам. Можно повторить с новыми числами.':'Работа сохранена.';
 }
 function supplementView(track,summary){
  if(!track.supplementGroups?.length)return '';
  function resourceView(item){
   const row=rowFor(item,summary),latest=row?.latest,label=teacher?'Назначить ученику':latest?.outcome==='started'?'Продолжить':completed.has(latest?.outcome)?'Новые примеры':'Начать';
   const description=item.managedId?status(item,row):'Отдельная практика. Результат не входит в прогресс кабинета.';
   const actions=item.managedId?`<button type="button" data-arithmetic-resource="${E(item.managedId)}">${label} →</button>${latest?`<a class="button" href="#attempt=${encodeURIComponent(latest.id)}">Моя сохранённая работа</a>`:''}`:`<a class="button" href="https://mathexam.space${E(item.publicUrl)}" target="_blank" rel="noopener">Открыть отдельно ↗</a>`;
   const aliases=(item.aliases||[]).map(alias=>`<a class="division-course-resource-alias" data-arithmetic-alias="${E(alias.id)}" href="https://mathexam.space${E(alias.publicUrl)}" target="_blank" rel="noopener">${E(alias.title)} ↗</a>`).join('');
   return `<li class="division-course-resource" data-arithmetic-resource-id="${E(item.id)}"><h4>${E(item.title)}</h4>${item.goal?`<p>${E(item.goal)}</p>`:''}<p class="division-course-resource-note">${E(description)}</p><div class="actions">${actions}</div>${aliases}</li>`;
  }
  return '<div class="division-course-supplements"><h3>Ещё упражнения по умножению</h3><p>Выбирай нужную тему. Здесь можно тренироваться отдельно от основных шагов.</p>'+track.supplementGroups.map(group=>{
   const managed=group.items.filter(item=>item.managedId),separate=group.items.filter(item=>!item.managedId),count=managed.filter(item=>rowFor(item,summary)?.completed).length;
   return `<section class="division-course-resource-group" data-arithmetic-group="${E(group.id)}" tabindex="-1"><h3>${E(group.title)}</h3><p>${E(group.lead)}</p>${managed.length&&!teacher&&progress?`<p class="division-course-progress-text">Есть решения в кабинете: ${count} из ${managed.length} упражнений</p><progress data-resource-progress value="${count}" max="${managed.length}" aria-label="${E(group.title)}: есть решения в ${count} из ${managed.length} упражнений кабинета"></progress>`:''}<ul class="division-course-resource-list">${managed.map(resourceView).join('')}</ul>${separate.length?`<details class="division-course-resource-more"><summary>Развернуть отдельные упражнения · ${separate.length}</summary><p>Откроются в новой вкладке. Их результаты не входят в прогресс кабинета.</p><ul class="division-course-resource-list">${separate.map(resourceView).join('')}</ul></details>`:''}</section>`;
  }).join('')+'</div>';
 }
 function preparationView(stage){
  const item=stage.preparation;if(!item)return '';
  return `<li class="division-course-preparation" data-division-preparation="${E(item.id)}"><span class="division-course-number" aria-hidden="true">↳</span><article><p class="division-course-meta">Перед прикидкой</p><h3>${E(item.title)}</h3><p>${E(item.goal)}</p><div class="actions"><a class="button" href="https://mathexam.space${E(item.publicUrl)}" target="_blank" rel="noopener">${E(item.action)} ↗</a></div><p>${E(item.returnNote)}</p><p class="division-course-status">Отдельная практика. Результат не входит в прогресс кабинета.</p></article></li>`;
 }
 function trackView(track,summary){
  const stages=track.stages,current=progress?stages.findIndex(stage=>!finished(stage,rowFor(stage,summary))):-1;
  const count=stages.filter(stage=>rowFor(stage,summary)?.completed).length;
  return `<section class="division-course-track" data-arithmetic-track="${E(track.id)}" aria-labelledby="arithmetic-track-${E(track.id)}" tabindex="-1"><header class="division-course-track-heading"><h2 id="arithmetic-track-${E(track.id)}">${E(track.title)}</h2><p>${E(track.lead)}</p>${teacher?`<p class="division-course-progress-text">${stages.length} шагов · можно назначить любой</p>`:progress?`<p class="division-course-progress-text">Есть решённые примеры: ${count} из ${stages.length} шагов</p><progress value="${count}" max="${stages.length}" aria-label="${E(track.title)}: есть решённые примеры в ${count} из ${stages.length} шагов"></progress>`:'<p class="division-course-progress-text">'+(loadError?'История пока не загрузилась':'Загружаем прогресс…')+'</p>'}${current>=0?`<button type="button" data-division-current="${E(track.id)}">К моему шагу ↓</button>`:''}${track.supplementGroups?.length?'<nav class="division-course-supplement-links" aria-label="Дополнительные темы умножения">'+track.supplementGroups.map(group=>`<button type="button" data-arithmetic-group-jump="${E(group.id)}">${E(group.title)} ↓</button>`).join('')+'</nav>':''}</header><ol class="division-course-list">${stages.map((stage,index)=>{
   const row=rowFor(stage,summary),latest=row?.latest,done=completed.has(latest?.outcome),isCurrent=index===current;
   const label=teacher?'Назначить ученику':!progress?'Открыть шаг':latest?.outcome==='started'?'Продолжить':done?'Новые примеры':'Начать';
   return `${preparationView(stage)}<li class="division-course-step${isCurrent?' is-current':''}${row?.completed?' is-complete':''}"${isCurrent?' aria-current="step" tabindex="-1"':''}><span class="division-course-number" aria-hidden="true">${index+1}</span><article><p class="division-course-meta">Шаг ${index+1} из ${stages.length}${isCurrent?' · Можно продолжить здесь':''}</p><h3>${E(stage.title)}</h3><p>${E(stage.goal)}</p><p class="division-course-support">${E(stage.support)}</p><p class="division-course-status">${E(status(stage,row))}</p><div class="actions"><button type="button" class="${isCurrent?'primary':''}" data-division-stage="${E(stage.id)}">${label} →</button>${latest?`<a class="button" href="#attempt=${encodeURIComponent(latest.id)}">Моя сохранённая работа</a>`:''}</div></article></li>`;
  }).join('')}</ol>${progress&&current===-1?'<p class="division-course-track-finish">Все шаги пройдены. Можно повторить любой.</p>':''}${supplementView(track,summary)}</section>`;
 }
 function focusAndScroll(target){target?.focus({preventScroll:true});target?.scrollIntoView({block:'start',behavior:'auto'});}
 function render(){
  if(!alive)return;
  const summary=rows();
  section.innerHTML=`<header class="division-course-heading"><p class="eyebrow">ЧЕТЫРЕ ЛИНЕЙКИ · ОТ ПРОСТОГО К СЛОЖНОМУ</p><h1>Сложение, вычитание, умножение и деление</h1><section class="division-course-diagnostic-entry" data-division-diagnostic aria-labelledby="division-diagnostic-heading"><div><h2 id="division-diagnostic-heading">С чего мне начать?</h2><p>Короткая проверка на деление покажет, какие шаги стоит потренировать сначала.</p></div><a class="button primary" href="https://mathexam.space/trainers/oge-basics/multiplication-division/division-diagnostic.html?from=cabinet" target="_blank" rel="noopener">Проверить себя</a><p class="division-course-diagnostic-note">Проверка откроется в новой вкладке. Результат сохраняется только в браузере и не входит в прогресс кабинета. После проверки вернись в кабинет.</p></section><p class="lead">Для деления нужны все четыре навыка. Начни с того, что требует повторения.</p><p>Сложение и вычитание готовят к работе с разрядами. В умножении и делении сохраняется прежний прогресс кабинета.</p><p>${teacher?'Выберите шаг и назначьте его ученику. Он откроется в кабинете и на общей доске.':'На каждом шаге можно решать столько примеров, сколько нужно. Сохранённую работу можно продолжить.'}</p><nav class="division-course-track-links" aria-label="Выбрать маршрут">${(root.ArithmeticCourse.foundationTracks||[]).map(track=>`<a class="button" href="#arithmetic-track-${E(track.id)}" data-foundation-jump="${E(track.id)}">${E(track.title)} ↓</a>`).join('')}${tracks.map(track=>`<button type="button" data-division-track-jump="${E(track.id)}">${E(track.title)} ↓</button>`).join('')}</nav>${loadError?'<p role="status">Не удалось загрузить историю. Сохранённые решения остаются в кабинете.</p><button type="button" data-division-retry>Обновить историю</button>':''}</header><div class="division-course-tracks">${foundationsView(root.ArithmeticCourse)}${tracks.map(track=>trackView(track,summary)).join('')}</div><footer class="division-course-finish"><h2>Можно продолжать тренировку</h2><p>Повтори трудные шаги на новых числах. Затем реши примеры в тетради и покажи преподавателю.</p><p>Одна законченная работа ещё не означает, что всё запомнилось.</p><a class="button" href="#route">Вернуться к остальным темам →</a></footer>`;
  section.querySelectorAll('[data-foundation-jump]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const target=section.querySelector('[data-foundation-track="'+link.dataset.foundationJump+'"]');target.setAttribute('tabindex','-1');focusAndScroll(target);}));
  section.querySelectorAll('[data-division-current]').forEach(button=>button.addEventListener('click',()=>focusAndScroll(button.closest('[data-arithmetic-track]').querySelector('[aria-current="step"]'))));
  section.querySelectorAll('[data-division-track-jump]').forEach(button=>button.addEventListener('click',()=>focusAndScroll([...section.querySelectorAll('[data-arithmetic-track]')].find(track=>track.dataset.arithmeticTrack===button.dataset.divisionTrackJump))));
  section.querySelectorAll('[data-arithmetic-group-jump]').forEach(button=>button.addEventListener('click',()=>focusAndScroll([...section.querySelectorAll('[data-arithmetic-group]')].find(group=>group.dataset.arithmeticGroup===button.dataset.arithmeticGroupJump))));
  section.querySelectorAll('[data-arithmetic-resource]').forEach(button=>button.addEventListener('click',async()=>{
   const item=tracks.flatMap(track=>(track.supplementGroups||[]).flatMap(group=>group.items)).find(item=>item.managedId===button.dataset.arithmeticResource),row=rowFor(item,summary),latest=row?.latest;button.disabled=true;
   try{await context.openContent(item.managedId,!teacher&&completed.has(latest?.outcome)?{fresh:true,sourceAttemptId:latest.id}:{});}
   finally{if(button.isConnected)button.disabled=false;}
  }));
  section.querySelector('[data-division-retry]')?.addEventListener('click',load);
  section.querySelectorAll('[data-division-stage]').forEach(button=>button.addEventListener('click',async()=>{
   const id=button.dataset.divisionStage,row=summary.get('oge-basics:'+id),latest=row?.latest;button.disabled=true;
   try{await context.openContent('oge-basics:'+id,!teacher&&completed.has(latest?.outcome)?{fresh:true,sourceAttemptId:latest.id}:{});}
   finally{if(button.isConnected)button.disabled=false;}
  }));
 }
 async function load(){
  if(teacher)return;
  try{const result=await context.api('/progress');if(!Array.isArray(result.progress))throw Error('INVALID_PROGRESS');if(!alive)return;progress=result.progress;loadError=false;}
  catch(_){if(!alive)return;loadError=true;}
  render();
 }
 render();load();return()=>{alive=false;section.remove();};
}
root.LearningDivisionCourse=Object.freeze({entry,mount});
})(window);
