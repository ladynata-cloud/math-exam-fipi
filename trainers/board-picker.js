/* The picker opens pages; only the existing registry/bridge can authorize mirror. */
(function(root){'use strict';
const RECENT_KEY='mathexam.trainerBoard.recent.v1';
const PROFILE_EXPRESSIONS_LESSONS=new Set(['expr-powers','expr-roots','expr-fractions','expr-logarithms','algebra-cosine','algebra-double-angle']);
const PROFILE_STEREOMETRY_LESSONS=new Set(['stereo-box','stereo-cube','stereo-prism','stereo-pyramid','stereo-cylinder','stereo-cone','stereo-sphere','stereo-compound']);
const PROFILE_COURSES=[
 ['1','ege-profile-planimetry.html',new Set(['geo-angles','geo-right','geo-similarity','geo-area','geo-quadrilaterals','geo-circle'])],
 ['2','ege-profile-vectors.html',new Set(['vec-coordinates','vec-length','vec-operations','vec-dot'])],
 ['3','ege-profile-stereometry.html',PROFILE_STEREOMETRY_LESSONS],
 ['4','ege-profile-probability.html',new Set(['prob-count','prob-complement','prob-range'])],
 ['6','ege-profile-random-variables.html',new Set(['prob-distribution','prob-variance','prob-continuous'])],
 ['7','ege-profile-equations.html',new Set(['algebra-exponential','algebra-logarithmic','eq-linear','eq-rational','eq-quadratic','eq-root'])],
 ['8','ege-profile-expressions.html',PROFILE_EXPRESSIONS_LESSONS]
];
const PETERSON_TASK_COUNTS=Object.freeze({p01:14,p02:14,p03:14,p04:14,p05:14,p06:14,p07:14,p08:18,p09:18,p10:18,p11:18,p12:18,p13:18,p14:18});
const PETERSON_SKILLS=new Set(['fraction-reduce','fraction-mixed','fraction-add','fraction-subtract','fraction-multiply','fraction-divide','decimal-add','decimal-subtract','decimal-multiply','decimal-divide','decimal-to-fraction','fraction-to-decimal','mixed-multiply','mixed-divide','unlike-multiply','unlike-divide','order-operations','percent-part','percent-whole','percent-ratio']);
function petersonRoute(hash){
 if(['','#home','#skills','#progress'].includes(hash))return true;
 const lesson=/^#lesson\/(p\d{2})(?:\/(0|[1-9]\d*))?$/.exec(hash);
 if(lesson)return Object.hasOwn(PETERSON_TASK_COUNTS,lesson[1])&&(lesson[2]===undefined||Number(lesson[2])<PETERSON_TASK_COUNTS[lesson[1]]);
 const practice=/^#practice\/([a-z-]+)\/([123])$/.exec(hash);
 return !!practice&&PETERSON_SKILLS.has(practice[1]);
}
function profileCourseRoute(hash,position,lessons){
 const parts=hash.slice(1).split('/');
 if(parts.length===2&&['exam','calm'].includes(parts[0])&&parts[1]===position)return true;
 if(!lessons.has(parts[1]))return false;
 return parts.length===2&&['lesson','example'].includes(parts[0])||parts.length===3&&['practice','repair','pause'].includes(parts[0])&&['guided','plan','independent'].includes(parts[2]);
}
function normalize(value){
 let raw=String(value||'').trim();if(!raw)return 'negative-numbers-line.html';
 if(/[\u0000-\u001f\u007f]/.test(raw))throw Error('В ссылке есть недопустимые символы.');
 if(/^mathexam\.space\//i.test(raw))raw='https://'+raw;
 if(raw.startsWith('trainers/'))raw='/'+raw;
 let u;try{u=new URL(raw,location.href);}catch(_){throw Error('Проверьте адрес тренажёра.');}if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Нужна обычная ссылка http или https на тренажёр.');
 let path=u.pathname;try{for(let i=0;i<3;i++){const next=decodeURIComponent(path);if(next===path)break;path=next;}}catch(_){throw Error('Проверьте адрес тренажёра.');}
 if(/(?:^|\/)trainer-board\.html(?:\/|$)/i.test(path)||path===location.pathname)throw Error('Доску нельзя открыть внутри самой себя. Выберите тренажёр.');
 // Alias only the literal same-origin course entry. Keep the registry's
 // trainers/ boundary and its rejection of encoded or traversing paths intact.
 const rawPath=raw.replace(/^(?:https?:)?\/\/[^/?#]*/i,'').split(/[?#]/,1)[0];
 if(u.origin===location.origin&&rawPath===u.pathname&&['/ege-baza/path/','/ege-baza/path/index.html'].includes(u.pathname)){
  const id=u.hash.startsWith('#lesson=')?u.hash.slice(8):'';
  const position=['box','practice-displacement','practice-pour','practice-joined-surface','practice-faces'].includes(id)?11:['roundbody','pyramid','scale','practice-cone-area','practice-pyramid-lateral','practice-box-diagonal','practice-similar-volume'].includes(id)?13:null;
  if(position)return '/trainers/ege-baza-'+position+'.html'+u.search+u.hash;
 }

 if(u.origin===location.origin&&rawPath===u.pathname&&['/ege-profil/start/index.html','/ege-profil/start/'].includes(u.pathname)){
  const file=PROFILE_COURSES.find(([number,_,lessons])=>profileCourseRoute(u.hash,number,lessons))?.[1];
  if(file)return '/trainers/'+file+u.search+u.hash;
 }
 if(u.origin===location.origin&&rawPath===u.pathname&&['/stereo-course/merzlyak-10-base/','/stereo-course/merzlyak-10-base/index.html'].includes(u.pathname)){
  return '/trainers/merzlyak-10-base.html'+u.search+u.hash;
 }
 if(u.origin===location.origin&&rawPath===u.pathname&&['/school/peterson6/','/school/peterson6/index.html'].includes(u.pathname)&&petersonRoute(u.hash)){
  return '/trainers/peterson6.html'+u.search+u.hash;
 }
 if(u.origin===location.origin&&rawPath===u.pathname&&['/geometry-course/textbook/','/geometry-course/textbook/index.html'].includes(u.pathname)&&u.hash==='#atanasyan-7-9-main-92-part-1')return '/trainers/atanasyan-7-9.html'+u.search+u.hash;
 return raw;
}
function canonical(value){const u=new URL(normalize(value),location.href);u.searchParams.delete('seed');return u.origin===location.origin?u.pathname+u.search+u.hash:u.href;}
function error(message){const el=document.getElementById('pickerError');if(el){el.textContent=message;el.hidden=false;}}
function clearError(){const el=document.getElementById('pickerError');if(el)el.hidden=true;}
function mount(options){
 const $=id=>document.getElementById(id),dialog=$('trainerPicker'),search=$('pickerSearch'),group=$('pickerGroup'),results=$('pickerResults'),frame=$('trainerFrame'),panel=frame.closest('.trainer'),status=$('frameStatus'),separate=$('openTrainerSeparate');
 let entries=[],recent=[],limit=60,expanded=false,generation=0,active='',loaded=false,check=null,timeout=null;
 const narrow=matchMedia('(max-width:720px)'),manual=$('manualTrainerEntry');manual.open=false;
 const checks=new Map();
 try{const data=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');if(Array.isArray(data))recent=data.filter(x=>typeof x==='string').map(canonical).slice(0,12);}catch(_){}
 const titleFor=url=>entries.find(x=>canonical(x.href)===canonical(url))?.title||'Тренажёр по ссылке';
 function remember(url){try{const key=canonical(url);recent=[key,...recent.filter(x=>x!==key)].slice(0,12);localStorage.setItem(RECENT_KEY,JSON.stringify(recent));}catch(_){}renderRecent();}
 function choose(url){if(options.open(url)){remember(url);dialog.close();}}
 function button(entry){const b=document.createElement('button');b.type='button';b.className='picker-item';const title=document.createElement('strong');title.textContent=entry.title;const detail=document.createElement('span');detail.textContent=entry.group||'Недавно открытые';b.append(title,detail);b.onclick=()=>choose(entry.href);return b;}
 function renderRecent(){const el=$('recentTrainers');el.replaceChildren();for(const href of recent.slice(0,3)){const b=document.createElement('button');b.type='button';b.className='recent-item';b.textContent=titleFor(href);b.title=b.textContent;b.onclick=()=>choose(href);el.append(b);}el.hidden=!recent.length||options.role()!=='teacher';}
 function render(){const words=search.value.toLocaleLowerCase('ru').trim().split(/\s+/).filter(Boolean),selected=group.value;let list=selected==='recent'?recent.map(href=>({href,title:titleFor(href),group:'Недавно открытые'})):entries.filter(x=>!selected||x.group===selected);list=list.filter(x=>words.every(w=>(x.title+' '+x.group+' '+x.href).toLocaleLowerCase('ru').includes(w)));results.replaceChildren(...list.slice(0,limit).map(button));$('pickerCount').textContent=list.length?'Найдено: '+list.length:'Ничего не найдено. Попробуйте тему, класс или номер задания.';$('pickerMore').hidden=list.length<=limit;}
 function openDialog(recentOnly=false){if(options.role()!=='teacher')return;group.value=recentOnly?'recent':'';limit=60;render();if(!dialog.open)dialog.showModal();search.focus();}
 $('chooseTrainer').onclick=()=>openDialog();document.querySelectorAll('[data-course-picker]').forEach(b=>b.onclick=()=>{openDialog();group.value=b.dataset.coursePicker;search.value='';render();});
 $('boardLayout').onchange=e=>{document.getElementById('lesson').dataset.layout=e.target.value;window.dispatchEvent(new Event('resize'));};
 $('focusBoard').onclick=()=>{expand(false);document.getElementById('canvas').scrollIntoView({block:'center',behavior:'instant'});document.getElementById('canvas').focus({preventScroll:true});};$('pickerClose').onclick=()=>dialog.close();$('pickerMore').onclick=()=>{limit+=60;render();};search.oninput=group.onchange=()=>{limit=60;render();};dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 function expand(value){expanded=value;panel.classList.toggle('trainer-expanded',value);document.body.classList.toggle('trainer-is-expanded',value);$('expandTrainer').textContent=value?'Вернуться к доске':'Развернуть';$('expandTrainer').setAttribute('aria-pressed',String(value));window.dispatchEvent(new Event('resize'));}
 $('expandTrainer').onclick=()=>expand(!expanded);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded&&!document.querySelector('dialog[open]')){expand(false);$('expandTrainer').focus();}});
 function show(kind,text){status.dataset.state=kind;status.textContent=text;frame.setAttribute('aria-busy',String(kind==='loading'));}
 function update(){if(!active)return;if(check?.kind==='missing'){show('error','Страница не найдена (404). Выберите другой тренажёр или повторите загрузку.');return;}if(check?.kind==='blocked'){show('error','Эту страницу нельзя встроить в доску. Откройте её отдельно.');return;}if(check?.kind==='error'){show('error','Не удалось загрузить страницу. Можно повторить или открыть отдельно.');return;}if(!loaded)return;try{const doc=frame.contentDocument;if(doc?.body){if(frame.contentWindow.location.href==='about:blank')return;show('ready','Тренажёр открыт.');}else show('external','Если страница пуста или запрещает встраивание, откройте её отдельно.');}catch(_){show('external','Внешняя страница может запрещать встраивание. При необходимости откройте отдельно.');}}
 function headerKey(url){const u=new URL(url,location.href);u.searchParams.delete('seed');u.hash='';return u.href;}
 function inspect(url){const u=new URL(url,location.href),key=headerKey(url);if(checks.has(key))return checks.get(key);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);const request=fetch(u.href,{method:'HEAD',signal:controller.signal,credentials:'same-origin'}).then(r=>{if(r.status===404)return {kind:'missing'};if(!r.ok&&r.status!==405)return {kind:'error'};const xfo=(r.headers.get('x-frame-options')||'').toLowerCase(),csp=r.headers.get('content-security-policy')||'';if(xfo.includes('deny')||(/frame-ancestors\s+'none'/i.test(csp))||(u.origin!==location.origin&&xfo.includes('sameorigin')))return {kind:'blocked'};try{normalize(r.url);}catch(_){return {kind:'blocked'};}return {kind:'ok'};}).catch(()=>({kind:'unknown'})).finally(()=>clearTimeout(timer));checks.set(key,request);return request;}
 function loading(){const source=frame.getAttribute('src');if(!source||source==='about:blank')return;let url;try{url=normalize(source);}catch(e){error(e.message);return;}active=url;if(options.role()==='teacher')remember(url);loaded=false;check=null;const version=++generation;clearTimeout(timeout);show('loading','Загружаем тренажёр…');separate.href=new URL(url,location.href).href;$('openedTrainerTitle').textContent=titleFor(url);timeout=setTimeout(()=>{if(version===generation&&!loaded)show('error','Загрузка затянулась. Повторите попытку или откройте тренажёр отдельно.');},12000);inspect(url).then(result=>{if(version!==generation)return;check=result;update();});}
 function followLocation(){try{const u=frame.contentWindow.location;if(u.origin!==location.origin||u.href==='about:blank')return;const local=u.pathname+u.search+u.hash;separate.href=u.href;$('openedTrainerTitle').textContent=titleFor(local);if(options.role()==='teacher')remember(local);}catch(_){}}
 frame.addEventListener('load',()=>{try{frame.contentWindow.addEventListener('hashchange',followLocation);followLocation();}catch(_){}try{if(frame.contentWindow.location.href==='about:blank')return;}catch(_){}loaded=true;clearTimeout(timeout);update();});frame.addEventListener('error',()=>show('error','Не удалось загрузить тренажёр. Повторите попытку или откройте отдельно.'));new MutationObserver(loading).observe(frame,{attributes:true,attributeFilter:['src']});
 $('retryOpenedTrainer').onclick=()=>{if(!active)return;checks.delete(headerKey(active));options.retry();};loading();
 function setEntries(list){const seen=new Set();entries=list.filter(x=>{try{const key=canonical(x.href);if(seen.has(key))return false;seen.add(key);return typeof x.title==='string';}catch(_){return false;}});const groups=[...new Set(entries.map(x=>x.group))];group.replaceChildren(new Option('Все разделы',''),new Option('Недавние','recent'),...groups.map(x=>new Option(x,x)));renderRecent();render();if(active)$('openedTrainerTitle').textContent=titleFor(active);}
 setEntries(options.fallback.map(x=>({href:'/'+x.file,title:x.title,group:x.group})));
 fetch('board-picker-data.json?v=20261025-college-functions').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(Array.isArray(data.entries))setEntries(data.entries);followLocation();}).catch(()=>{$('pickerCount').textContent='Полный каталог недоступен. Можно воспользоваться быстрым списком или ссылкой.';});
 const query=new URLSearchParams(location.search).get('trainer');if(query&&options.role()==='teacher')choose(query);
}
root.BoardPicker={normalize,canonical,mount,error,clearError};
})(window);
