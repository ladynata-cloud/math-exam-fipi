/* Course navigation uses existing attempts and the read-only progress summary. */
(function(root){
'use strict';
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const completed=new Set(['independent','repeated','hinted','together','practiced']);
const independent=new Set(['independent','repeated']);
function entry(){return '<section class="division-course-entry"><div><p class="eyebrow">ДЕЛЕНИЕ УГОЛКОМ · ПО ОДНОМУ ДЕЙСТВИЮ</p><h2>От первого шага до самостоятельного решения</h2><p>Начни сверху. На каждом шаге — короткое объяснение и новые примеры.</p></div><a class="button" href="#division-course">Открыть курс деления →</a></section>';}
function mount(host,context){
 const core=root.DivisionCourse,stages=core?.stages||[],teacher=context.account.role==='teacher';
 let alive=true,progress=null,loadError=false;
 const section=document.createElement('section');section.className='division-course';host.replaceChildren(section);
 const rows=()=>new Map((progress||[]).filter(row=>row.trainerId==='oge-basics').map(row=>[row.contentId,row]));
 function status(stage,row){
  if(teacher)return stage.guidance==='check'?'Три новых примера для проверки':'Объяснение и упражнения';
  if(!progress)return loadError?'История пока не загрузилась':'Загружаем сохранённую работу…';
  if(!row)return 'Ещё не начинали';
  if(row.latest?.outcome==='started')return 'Начато. Можно продолжить с того же места.';
  if(stage.guidance==='check'&&independent.has(row.latest?.outcome))return 'Три примера решены без подсказок.';
  if(stage.guidance==='check')return 'Проверка закончена. Попробуй новые примеры без подсказок.';
  return row.completed?'Есть решение по шагам. Можно повторить с новыми числами.':'Работа сохранена.';
 }
 function render(){
  if(!alive)return;
  const summary=rows(),current=progress?stages.findIndex(stage=>{const row=summary.get(stage.id);return !row?.completed||row.latest?.outcome==='started'||stage.guidance==='check'&&!independent.has(row.latest?.outcome);}):-1;
  section.innerHTML=`<header class="division-course-heading"><p class="eyebrow">ТВОЙ ПУТЬ · СВЕРХУ ВНИЗ</p><h1>Учимся делить уголком</h1><p class="lead">Один вопрос — одно действие. Сделанные строки остаются перед глазами.</p><p>Сначала разбираем маленькие шаги. Затем соединяем их в целое решение. В конце — новые примеры для самостоятельной проверки.</p><p>${teacher?'Выберите шаг и назначьте его ученику. Он откроется в кабинете и на общей доске.':'Все шаги открыты. Если трудно, вернись на шаг выше или открой подсказку.'}</p>${current>0?'<button type="button" data-division-current>К ближайшему шагу ↓</button>':''}${loadError?'<p role="status">Не удалось загрузить историю. Сохранённые решения остаются в кабинете.</p><button type="button" data-division-retry>Обновить историю</button>':''}</header><ol class="division-course-list">${stages.map((stage,index)=>{
   const row=summary.get(stage.id),latest=row?.latest,done=completed.has(latest?.outcome),isCurrent=index===current;
   const label=teacher?'Назначить ученику':!progress?'Открыть шаг':latest?.outcome==='started'?'Продолжить':done?'Новые примеры':'Начать';
   return `<li class="division-course-step${isCurrent?' is-current':''}"${isCurrent?' aria-current="step" tabindex="-1"':''}><span class="division-course-number" aria-hidden="true">${index+1}</span><article><p class="division-course-meta">Шаг ${index+1} из ${stages.length}${isCurrent?' · Можно продолжить здесь':''}</p><h2>${E(stage.title)}</h2><p>${E(stage.goal)}</p><p class="division-course-support">${E(stage.support)}</p><p class="division-course-status">${E(status(stage,row))}</p><div class="actions"><button type="button" class="${isCurrent?'primary':''}" data-division-stage="${E(stage.id)}">${label} →</button>${latest?`<a class="button small" href="#attempt=${encodeURIComponent(latest.id)}">Моя сохранённая работа</a>`:''}</div></article></li>`;
  }).join('')}</ol><footer class="division-course-finish"><h2>После курса</h2><p>Повтори трудные шаги на новых числах. Затем реши примеры в тетради и покажи преподавателю.</p><p>Одна законченная работа ещё не означает, что всё запомнилось.</p><a class="button" href="#route">Вернуться к остальным темам →</a></footer>`;
  section.querySelector('[data-division-current]')?.addEventListener('click',()=>{const target=section.querySelector('[aria-current="step"]');target?.focus({preventScroll:true});target?.scrollIntoView({block:'start',behavior:'auto'});});
  section.querySelector('[data-division-retry]')?.addEventListener('click',load);
  section.querySelectorAll('[data-division-stage]').forEach(button=>button.addEventListener('click',async()=>{
   const id=button.dataset.divisionStage,row=summary.get(id),latest=row?.latest;button.disabled=true;
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
