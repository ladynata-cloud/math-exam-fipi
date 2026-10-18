/* Public navigation reads existing browser records; it never creates attempts. */
(function(){
'use strict';
const course=window.ArithmeticCourse,host=document.getElementById('division-course-stages');
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!host||!course?.tracks)return;
const legacyKeys={
 'multiplication-meaning':'mathExamBasics.multiplication-meaning.v1',
 'multiplication-pythagoras-table':'mathExamBasics.multiplication-pythagoras.v1',
 'multiplication-tricks':'mathExamBasics.multiplication-tricks.v1',
 'multiplication-ladder':'mathExamBasics.multiplication-ladder.v1',
 'multiplication-mixed':'mathExamBasics.multiplication-mixed.v1'
};
const count=value=>Number.isSafeInteger(value)&&value>=0;
function savedProgress(stage){
 try{
  const key=legacyKeys[stage.slug]||'mathExamBasics.divisionCourse.v1.'+stage.id;
  const raw=window.localStorage.getItem(key);
  if(!raw)return {started:false,solved:false};
  const saved=JSON.parse(raw);
  if(!saved||typeof saved!=='object'||Array.isArray(saved))throw Error('format');
  if(legacyKeys[stage.slug]){
   if(![saved.independent,saved.supported,saved.best].every(count)||saved.best>5||!Array.isArray(saved.learnDone))throw Error('format');
   return {started:true,solved:saved.independent>0||saved.supported>0||saved.best>0};
  }
  const state=saved.state;
  if(saved.version!==1||!count(saved.seed)||saved.seed>4294967295||!count(saved.errors)||saved.errors>1000000||typeof saved.assisted!=='boolean'||!state||!count(state.step)||!Array.isArray(state.answers)||state.answers.length!==state.step||!state.answers.every(answer=>typeof answer==='string')||typeof state.completed!=='boolean'||(state.completed&&state.step===0))throw Error('format');
  return {started:true,solved:state.completed};
 }catch(_){return {unavailable:true,started:false,solved:false};}
}
function stageLink(stage){return encodeURIComponent(stage.id.split('/').at(-1))+'.html';}
function render(){
 host.innerHTML=course.tracks.map(track=>{
  const rows=track.stages.map(savedProgress),solved=rows.filter(row=>row.solved).length,unavailable=rows.some(row=>row.unavailable);
  const current=rows.findIndex(row=>!row.solved&&!row.unavailable);
  const summary=unavailable?'Не все записи удалось прочитать. Они оставлены без изменений.':'Есть решённые примеры: '+solved+' из '+track.stages.length+' шагов';
  return `<section id="arithmetic-track-${E(track.id)}" class="division-course-track" data-arithmetic-track="${E(track.id)}" aria-labelledby="arithmetic-track-title-${E(track.id)}" tabindex="-1"><header class="division-course-track-heading"><h2 id="arithmetic-track-title-${E(track.id)}">${E(track.title)}</h2><p>${E(track.lead)}</p><p class="division-course-progress-text"${unavailable?' role="status"':''}>${E(summary)}</p>${unavailable?'':`<progress value="${solved}" max="${track.stages.length}" aria-label="${E(track.title)}: решённые примеры есть на ${solved} из ${track.stages.length} шагов"></progress>`}${current>=0?`<a class="button" href="#arithmetic-step-${E(track.id)}-${current+1}">К моему шагу ↓</a>`:''}</header><ol class="division-course-list" aria-label="${E(track.title)}: шаги сверху вниз">${track.stages.map((stage,index)=>{
   const row=rows[index],isCurrent=index===current;
   const status=row.unavailable?'Не удалось прочитать запись этого шага.':row.solved?'Есть решённый пример. Можно потренироваться ещё.':row.started?'Есть сохранённая работа. Можно продолжить.':'Ещё не начинали';
   const label=row.unavailable?'Открыть шаг':row.started?'Продолжить тренировку':'Начать';
   return `<li id="arithmetic-step-${E(track.id)}-${index+1}" class="division-course-step${isCurrent?' is-current':''}${row.solved?' is-complete':''}"${isCurrent?' aria-current="step"':''}><span class="division-course-number" aria-hidden="true">${index+1}</span><article><p class="division-course-meta">Шаг ${index+1} из ${track.stages.length}</p><h3>${E(stage.title)}</h3><p>${E(stage.goal)}</p><p class="division-course-support">${E(stage.support)}</p><p class="division-course-status">${E(status)}</p><div class="actions"><a class="button${isCurrent?' primary':''}" href="${stageLink(stage)}">${E(label)} →</a></div></article></li>`;
  }).join('')}</ol>${!unavailable&&current===-1?'<p class="division-course-track-finish">На каждом шаге есть решённые примеры. Можно повторить любой.</p>':''}</section>`;
 }).join('');
}
render();
window.addEventListener('pageshow',render);
window.addEventListener('storage',render);
})();
