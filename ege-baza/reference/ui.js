/* Shared, on-demand reference presentation. No storage or answer access. */
(function(root){
 'use strict';
 const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const data=()=>root.EgeReferenceData;
 const sheet=id=>data()?.sheets.find(s=>s.id===id);
 // Explicit fraction tokens are authored content, not executable markup.
 function math(text){return String(text??'').split(/(\[\[[^\[\]\n]+\|[^\[\]\n]+\]\])/g).map(part=>{
  const m=part.match(/^\[\[([^|]+)\|([^|]+)\]\]$/);
  return m?`<span class="ref-fraction" role="math" aria-label="${E(m[1])} разделить на ${E(m[2])}"><span aria-hidden="true">${E(m[1])}</span><span aria-hidden="true">${E(m[2])}</span></span>`:E(part).replace(/\n/g,'<br>');
 }).join('');}
 function forLesson(id){const ids=data()?.lessonSheets[id];return Array.isArray(ids)?[...ids]:[];}
 function pins(id){
  const meta=root.PathData?.meta||[],out=[];
  for(const [lessonId,ids] of Object.entries(data()?.lessonSheets||{})){
   if(!ids.includes(id))continue;
   const m=meta.find(x=>x.id===lessonId);if(!m)continue;
   out.push({id:lessonId,title:m.title,pos:m.pos,href:'/ege-baza/path/index.html#lesson='+encodeURIComponent(lessonId)});
  }
  for(const p of root.EgeReferenceLegacy?.pins||[])if(p.sheetIds.includes(id))out.push({...p});
  return out;
 }
 function safeHref(href){
  try{const url=new URL(href,root.document.baseURI);return ['http:','https:','file:'].includes(url.protocol)&&url.origin===new URL(root.document.baseURI).origin?url.href:'#';}catch{return '#';}
 }
 function sheetHref(id,base,from){
  const url=new URL('index.html',new URL(base||'/ege-baza/reference/',root.document.baseURI));
  if(from&&forLesson(from).length)url.searchParams.set('from',from);
  url.hash='sheet='+encodeURIComponent(id);return url.href;
 }
 function pinMarkup(pin){return `<a class="ref-pin" data-lesson-id="${E(pin.id)}" href="${E(safeHref(pin.href))}"><span class="ref-pin-head" aria-hidden="true"></span><span>${pin.pos?`<small>Задание ${E(pin.pos)}</small>`:''}${E(pin.title)}</span><span aria-hidden="true">↗</span></a>`;}
 function card(id,options={}){
  const s=sheet(id);if(!s)return '';
  const attached=pins(id),shown=attached.slice(0,6),rest=attached.slice(6);
  return `<article class="ref-sheet" data-sheet-id="${E(s.id)}"><p class="ref-category">${E(s.category)}</p><h2>${E(s.title)}</h2><p class="ref-summary">${math(s.summary)}</p><div class="ref-rule-text"><h3>Правило</h3><p>${math(s.rule)}</p></div><div class="ref-example"><h3>Короткий пример</h3><p>${math(s.example)}</p></div><details class="ref-error"><summary>Где легко ошибиться?</summary><p>${math(s.commonError)}</p></details>${options.showPins!==false&&options.externalLinks!==false?`<section class="ref-pins" aria-label="Тренажёры к этому правилу"><h3>Прикреплённые тренажёры <span class="ref-count">${attached.length}</span></h3><div class="ref-pin-grid">${shown.map(pinMarkup).join('')}</div>${rest.length?`<details class="ref-more"><summary>Ещё ${rest.length} тренажёров</summary><div class="ref-pin-grid">${rest.map(pinMarkup).join('')}</div></details>`:''}</section>`:''}${s.foundation&&options.externalLinks!==false?`<details class="ref-foundation"><summary>Потренировать саму основу</summary><a class="ref-foundation-link" href="${E(safeHref(s.foundation.href))}" target="_blank" rel="noopener">${E(s.foundation.title)} ↗</a><p class="ref-small">Откроется в новой вкладке.</p></details>`:''}</article>`;
 }
 function attach(host,options={}){
  if(!host||!data())return null;
  const ids=[...new Set(options.sheetIds||[])].filter(id=>sheet(id));if(!ids.length)return null;
  const wrapper=root.document.createElement('details');wrapper.className='ref-help';
  wrapper.innerHTML=`<summary>Вспомнить правило</summary><div class="ref-help-body"><p class="ref-small">Выбери нужный лист. Он откроется рядом с задачей.</p>${ids.map(id=>`<details class="ref-rule" data-sheet-id="${E(id)}"><summary>${E(sheet(id).title)}</summary><div class="ref-rule-body"></div></details>`).join('')}</div>`;
  host.append(wrapper);
  for(const item of wrapper.querySelectorAll('.ref-rule')){
   let filled=false;
   item.addEventListener('toggle',()=>{
    if(!item.open||!wrapper.isConnected)return;
    const id=item.dataset.sheetId;
    if(!filled){
     const from=options.lessonId||'';
     item.querySelector('.ref-rule-body').innerHTML=card(id,{showPins:options.showPins===true,externalLinks:options.externalLinks})+(options.externalLinks===false?'':`<p class="ref-full-link"><a href="${E(sheetHref(id,options.referenceBase,from))}" target="_blank" rel="noopener">Открыть лист с тренажёрами ↗</a><span class="ref-small"> В новой вкладке; задача останется здесь.</span><a href="${E(new URL('exam.html',new URL(options.referenceBase||'/ege-baza/reference/',root.document.baseURI)).href)}" target="_blank" rel="noopener">Формулы экзаменационного листа ↗</a></p>`);
     filled=true;
    }
    options.onReveal?.(id);
   });
  }
  return wrapper;
 }
 root.EgeReferenceUI={math,forLesson,pins,card,attach,sheet,sheetHref,safeHref};
})(window);
