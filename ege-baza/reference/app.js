(function(root){
 'use strict';
 const D=root.EgeReferenceData,U=root.EgeReferenceUI,content=document.getElementById('reference-content');
 if(!D||!U||!content)return;
 const search=document.getElementById('reference-search'),category=document.getElementById('reference-category'),status=document.getElementById('reference-status'),filters=document.getElementById('reference-filters');
 const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 for(const name of [...new Set(D.sheets.map(s=>s.category))]){const option=document.createElement('option');option.value=name;option.textContent=name;category.append(option);}
 const from=new URLSearchParams(location.search).get('from');
 if(from&&U.forLesson(from).length){const link=document.getElementById('reference-return');link.href='../path/index.html#lesson='+encodeURIComponent(from);link.hidden=false;}
 const rowAssets=new Map();
 function loadRowAsset(url){
  if(rowAssets.has(url))return rowAssets.get(url);
  const loading=new Promise((resolve,reject)=>{
   const style=url.endsWith('.css');
   const asset=document.createElement(style?'link':'script');
   if(style){asset.rel='stylesheet';asset.href=url;}else{asset.src=url;}
   asset.onload=resolve;
   asset.onerror=()=>{asset.remove();rowAssets.delete(url);reject(new Error(url));};
   document.head.append(asset);
  });
  rowAssets.set(url,loading);
  return loading;
 }
 async function rowLesson(){
  document.title='Сколько строк в таблице? · ЕГЭ база №21 · MathExam';
  filters.hidden=true;status.textContent='';
  const mount=document.createElement('div');
  mount.textContent='Открываем задачи на суммы строк…';
  content.replaceChildren(mount);
  try{
   await Promise.all([loadRowAsset('row-sums.css'),loadRowAsset('../reasoning/math.js')]);
   await loadRowAsset('../reasoning/row-sums.js');
   await loadRowAsset('row-sums.js');
   if(mount.isConnected)root.EgeRowSumsLesson.mount(mount);
  }catch{
   if(!mount.isConnected)return;
   mount.innerHTML='<p role="status">Урок не загрузился. Можно повторить загрузку или вернуться к правилу.</p><button type="button">Загрузить ещё раз</button> <a href="#sheet=reasoning">К правилу</a>';
   mount.querySelector('button').onclick=rowLesson;
  }
 }
 function catalogue(){
  document.title='Справочник с тренажёрами · MathExam';
  filters.hidden=false;const query=search.value.trim().toLocaleLowerCase('ru');
  const found=D.sheets.filter(s=>(!category.value||s.category===category.value)&&(!query||[s.title,s.summary,s.rule,s.category,...U.pins(s.id).map(p=>p.title)].join(' ').toLocaleLowerCase('ru').includes(query))).sort((a,b)=>Number(b.title.toLocaleLowerCase('ru').includes(query))-Number(a.title.toLocaleLowerCase('ru').includes(query)));
  status.textContent=`Листов: ${found.length} из ${D.sheets.length}.`;
  content.innerHTML=found.length?`<div class="ref-catalogue">${found.map(s=>`<a class="ref-preview" href="#sheet=${encodeURIComponent(s.id)}"><span class="ref-paper-pin" aria-hidden="true"></span><span class="ref-category">${E(s.category)}</span><h2>${E(s.title)}</h2><p>${U.math(s.summary)}</p><span class="ref-preview-footer">Открыть лист <span aria-hidden="true">→</span><small>Тренажёров: ${U.pins(s.id).length}</small></span></a>`).join('')}</div>`:'<div class="ref-empty"><h2>Такой лист пока не найден</h2><p>Попробуй другое слово или выбери все разделы.</p><button type="button" id="reference-clear">Показать все листы</button></div>';
  document.getElementById('reference-clear')?.addEventListener('click',()=>{search.value='';category.value='';catalogue();search.focus();});
 }
 function render(){
  const hash=location.hash.slice(1);let id='';
  if(hash==='row-sums'){rowLesson();return;}
  if(hash.startsWith('sheet=')){try{id=decodeURIComponent(hash.slice(6));}catch{id='invalid';}}
  if(!hash||hash==='catalogue'){catalogue();return;}
  filters.hidden=true;status.textContent='';
  content.innerHTML='<a class="ref-back" href="#catalogue">← Все справочные листы</a>'+(U.sheet(id)?U.card(id):'<section class="ref-empty"><h2>Этот лист не найден</h2><p>Выбери правило в справочнике.</p></section>');
  if(id==='inequality-line'||id==='reasoning'){
   const lesson=document.createElement('a');
   lesson.className='ref-pin';
   const rows=id==='reasoning';
   lesson.href=rows?'#row-sums':'../inequality-match/index.html';
   lesson.textContent=rows?'№21. Сколько строк в таблице? Разбор и самостоятельные задачи →'
       :'№18. Сопоставить показательные и логарифмические неравенства с промежутками →';
   content.querySelector('.ref-rule-text').after(lesson);
  }
  document.title=U.sheet(id)?U.sheet(id).title+' · Справочник MathExam':'Справочник с тренажёрами · MathExam';
 }
 document.querySelector('.ref-skip')?.addEventListener('click',e=>{e.preventDefault();content.focus({preventScroll:true});content.scrollIntoView?.({block:'start'});});
 filters.addEventListener('submit',e=>e.preventDefault());
 search.addEventListener('input',catalogue);category.addEventListener('change',catalogue);
 root.addEventListener('hashchange',()=>{render();content.focus({preventScroll:true});content.scrollIntoView?.({block:'start'});});
 render();
})(window);
