(function(){
'use strict';
const core=window.DivisionCourse,host=document.getElementById('division-course-stages');
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!host||!core)return;
host.innerHTML=core.stages.map((stage,index)=>`<li class="division-course-step"><span class="division-course-number" aria-hidden="true">${index+1}</span><article><p class="division-course-meta">Шаг ${index+1} из ${core.stages.length}</p><h2>${E(stage.title)}</h2><p>${E(stage.goal)}</p><p class="division-course-support">${E(stage.support)}</p><div class="actions"><a class="button${index===0?' primary':''}" href="course-${encodeURIComponent(stage.slug)}.html">${stage.guidance==='check'?'Проверить себя':'Открыть шаг'} →</a></div></article></li>`).join('');
})();
