/* Enhance the original twelve-group navigator, preserving its cabinet/library links. */
(function(){
'use strict';const C=window.FoundationRoutesCore,catalog=window.FoundationRoutes;if(!C||!catalog)return;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage;try{storage=localStorage;}catch(_){}
const store=window.FoundationRouteStore.create(catalog,storage),query=new URLSearchParams(location.search).toString();
const href=id=>'route.html'+(query?'?'+query:'')+'#'+id;
const section=document.createElement('section');section.className='course-overview';section.id='learning-overview';section.setAttribute('aria-labelledby','learning-overview-title');
section.innerHTML='<p class="eyebrow">ПОНЯТНОЕ НАЧАЛО И ЗАВЕРШЕНИЕ</p><h2 id="learning-overview-title">Карта базовой математики</h2><p class="overview-numbers">12 разделов · '+catalog.routes.length+' коротких маршрутов</p><p>В каждом: несколько тренажёров, учебная порция из 6 вопросов и два разных набора самопроверки. Все ступени открыты.</p><p id="learning-progress" aria-live="polite"></p><div id="learning-resume" class="actions"></div><label class="route-search-label" for="route-search">Найти навык<input id="route-search" type="search" placeholder="Например: минус, разряды, ноль в частном" autocomplete="off"></label><p id="route-search-count" class="small" aria-live="polite"></p>';
document.getElementById('topic-nav').before(section);
for(const group of catalog.groups){
 const stage=document.getElementById('stage-'+group.id),body=stage?.querySelector('.stage-body');if(!body)continue;
 const old=document.createElement('details');old.className='source-links';old.innerHTML='<summary>Прежние входы к занятиям и работа в кабинете</summary>';while(body.firstChild)old.appendChild(body.firstChild);
 const intro=document.createElement('p');intro.className='route-group-intro';intro.textContent='Выбери один навык. Внутри — карта, разные способы тренировки и отдельная самопроверка.';
 const grid=document.createElement('div');grid.className='route-grid';grid.innerHTML=group.routes.map(r=>'<a class="mini-route" data-course-route="'+E(r.id)+'" href="'+E(href(r.id))+'"><b>'+E(r.title)+'</b><span>'+E(r.goal)+'</span><small>'+r.trainers.length+' тренажёра · практика 6 · проверка 6</small><span class="route-progress">Открыть карту →</span></a>').join('');
 body.append(intro,grid,old);
}
const start=document.getElementById('start-link');if(start){start.href=href(catalog.routes[0].id);start.textContent='Начать с первых навыков →';start.removeAttribute('data-visit');start.removeAttribute('data-mode');}
const sourceOnly=document.querySelector('.hero .actions a[href="/trainers/oge-basics/"]');if(sourceOnly)sourceOnly.textContent='Прежние тренажёры →';
const routeCount=document.querySelector('.route-note .small');if(routeCount)routeCount.textContent='Можно выбрать любой маршрут. Проверки основ и результаты экзаменационных курсов учитываются отдельно.';
function refresh(){
 const result=store.read(),summary=C.summaries(catalog,result.events),verified=Object.values(summary).filter(s=>s.verified).length;
 document.getElementById('learning-progress').textContent=result.reliable?'Самопроверка на новых вопросах пройдена: '+verified+' из '+catalog.routes.length+' маршрутов. Открытие ссылки и работа с подсказкой учитываются отдельно.':result.notice;
 for(const link of document.querySelectorAll('[data-course-route]')){const s=summary[link.dataset.courseRoute];link.classList.toggle('verified',result.reliable&&s.verified);link.querySelector('.route-progress').textContent=result.reliable&&s.verified?'✓ Проверено: 6 из 6 без помощи':s.unfinished?'Продолжить начатое →':s.practice?'К самостоятельной проверке →':'Открыть карту →';}
 const unfinished=Object.values(summary).map(s=>s.unfinished).filter(Boolean).sort((a,b)=>b.startedAt-a.startedAt)[0],resume=document.getElementById('learning-resume');
 resume.innerHTML=unfinished?'<a class="button primary" href="'+E(href(unfinished.route)+'?session='+unfinished.mode)+'">Продолжить: '+E(catalog.byId[unfinished.route].title)+' →</a>':'';
}
document.getElementById('route-search').addEventListener('input',event=>{
 const q=event.target.value.toLowerCase().replace(/ё/g,'е').trim();let count=0;
 for(const group of catalog.groups){const stage=document.getElementById('stage-'+group.id);let shown=0;for(const r of group.routes){const node=stage.querySelector('[data-course-route="'+r.id+'"]'),text=(r.title+' '+r.goal+' '+group.title).toLowerCase().replace(/ё/g,'е'),match=!q||text.includes(q);node.hidden=!match;if(match){count++;shown++;}}stage.hidden=shown===0;if(q&&shown)stage.open=true;}
 document.getElementById('route-search-count').textContent=q?(count?'Найдено маршрутов: '+count+'.':'Такой навык не найден. Попробуй более короткое слово.'):'';
});
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#topic=')){document.getElementById('route-search').value='';document.getElementById('route-search').dispatchEvent(new Event('input'));}});
window.addEventListener('pageshow',refresh);window.addEventListener('storage',event=>{if(event.key===null||event.key.startsWith(C.PREFIX))refresh();});refresh();
})();
