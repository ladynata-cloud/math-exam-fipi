/* A continuous exam sheet around the existing practical exercise engines.
 * Providers retain the original task identities, validation and progress. */
(function (global) {
'use strict';
const doc=global.document;
let serial=0;
const providers=new Map();
function el(tag,text,cls){const node=doc.createElement(tag);if(text!=null)node.textContent=text;if(cls)node.className=cls;return node;}
function html(markup){const host=el('div');host.innerHTML=String(markup||'');return host;}
function clone(node){if(!node)return el('div');const copy=node.cloneNode(true);for(const n of [copy,...copy.querySelectorAll('*')]){n.removeAttribute('id');n.removeAttribute('onclick');n.removeAttribute('onchange');n.removeAttribute('oninput');n.removeAttribute('for');n.removeAttribute('aria-controls');}return copy;}
function append(host,value){if(value==null)return;if(typeof value==='string')host.append(html(value));else host.append(value);}
function help(options={}){
 const wrap=el('div',null,'pv-help pm-context-hint'),toggle=el('button','Хочешь подсказку?','pv-help-button pm-hint-button');toggle.type='button';
 const panel=el('section',null,'pv-help-panel pm-model');panel.id='pv-help-'+(++serial);panel.hidden=true;panel.setAttribute('aria-label','Помощь к заданию');
 toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');
 const close=()=>{panel.hidden=true;toggle.textContent='Хочешь подсказку?';toggle.setAttribute('aria-expanded','false');toggle.focus();};
 if(global.PracticalDiscovery){global.PracticalDiscovery.build(panel,{page:options.page,type:options.type,text:options.text,steps:options.steps,close});for(const picture of panel.querySelectorAll('.pd-picture'))picture.after(el('p','На узком экране рисунок можно прокручивать в сторону.','pv-scroll-note'));}
 else panel.append(el('p','Прочитай, что нужно найти. Выпиши данные и единицы измерения.'));
 if(options.native){const details=el('details',null,'pv-native-help pm-details'),summary=el('summary','Помочь с числами из условия?'),content=el('div',null,'pm-content');details.append(summary,content);let built=false;details.addEventListener('toggle',()=>{if(details.open&&!built){append(content,options.native());built=true;}});const back=panel.querySelector('.pd-return');back?back.before(details):panel.append(details);}
 toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.textContent=panel.hidden?'Хочешь подсказку?':'Убрать подсказку';toggle.setAttribute('aria-expanded',String(!panel.hidden));});
 wrap.append(toggle,panel);return wrap;
}
function question(options){
 const card=el('article',null,'pv-question');card.id='pv-question-'+String(options.id||++serial).replace(/[^\w-]/g,'-');card.dataset.question=String(options.number);card.dataset.taskId=String(options.id||'');
 const heading=el('h2',String(options.number)+'. '+(options.title||'Задание'));card.append(heading);
 const condition=el('div',null,'pv-question-condition');append(condition,options.condition);card.append(condition);prepareFigures(condition);
 const form=el('form',null,'pv-answer-form'),fields=new Map();
 for(const spec of options.fields||[]){const label=el('label',null,'pv-field');label.append(el('span',spec.label||'Запиши ответ.'));let input;
  if(spec.options){input=el('select');for(const entry of spec.options){const option=el('option',Array.isArray(entry)?entry[1]:typeof entry==='object'?entry.label:entry);option.value=String(Array.isArray(entry)?entry[0]:typeof entry==='object'?entry.value:entry);input.append(option);}}
  else{input=el(spec.type==='textarea'?'textarea':'input');if(input.tagName==='INPUT'){input.type=spec.type==='number'?'text':(spec.type||'text');input.inputMode=spec.inputMode||'decimal';}input.autocomplete='off';}
  input.dataset.pvField=spec.key;input.name=spec.key;input.value=spec.value??'';input.setAttribute('aria-label',spec.label||'Ответ');if(spec.placeholder)input.placeholder=spec.placeholder;
  fields.set(spec.key,input);label.append(input);form.append(label);
 }
 const values=()=>Object.fromEntries([...fields].map(([key,input])=>[key,input.value]));
 for(const input of fields.values()){input.addEventListener('input',()=>options.onDraft?.(values()));input.addEventListener('change',()=>options.onDraft?.(values()));}
 const check=el('button','Проверить ответ','pv-check');check.type='submit';
 const feedback=el('div',null,'pv-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
 let locked=false;
 function show(result){if(!result)return;feedback.replaceChildren();result.html?append(feedback,result.html):feedback.append(doc.createTextNode(result.message||''));feedback.classList.toggle('pv-correct',result.ok===true);feedback.classList.toggle('pv-incorrect',result.ok===false);card.dataset.result=result.ok===true?'correct':result.ok===false?'incorrect':'';if(result.locked){locked=true;for(const input of fields.values())input.disabled=true;check.disabled=true;}}
 show(typeof options.status==='object'?options.status:options.status?{ok:true,message:'Ответ уже проверен.'}:null);
 form.addEventListener('submit',async event=>{event.preventDefault();if(locked)return;check.disabled=true;try{const result=await options.check(values());show(result);}catch(error){feedback.textContent='Не удалось проверить ответ. Попробуй ещё раз.';global.console.error(error);}finally{check.disabled=locked;if(!locked)check.focus();else{feedback.tabIndex=-1;feedback.focus();}}});
 form.append(check,feedback);card.append(form);
 card.append(help({page:options.page||doc.body.dataset.practicalPage,type:options.helpType,text:condition.textContent,steps:options.helpSteps,native:options.helpNative}));
 return card;
}
function prepareFigures(host){
 for(const svg of host.querySelectorAll('svg')){
  if(svg.closest('.pv-figure-scroll'))continue;
  const wrap=el('div',null,'pv-figure-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',svg.getAttribute('aria-label')||'Рисунок к условию');svg.before(wrap);wrap.append(svg);
  const zoom=el('button','Увеличить рисунок','pv-zoom');zoom.type='button';zoom.setAttribute('aria-pressed','false');const note=el('p','Рисунок можно прокручивать вправо и влево.','pv-scroll-note');
  zoom.addEventListener('click',()=>{const large=zoom.getAttribute('aria-pressed')!=='true';wrap.classList.toggle('pv-figure-large',large);zoom.setAttribute('aria-pressed',String(large));zoom.textContent=large?'Уменьшить рисунок':'Увеличить рисунок';});wrap.after(zoom,note);
 }
 for(const table of host.querySelectorAll('table')){if(table.closest('.pv-table-scroll'))continue;const wrap=el('div',null,'pv-table-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Таблица: можно прокручивать по горизонтали');table.before(wrap);wrap.append(table);}
}
function mount(options){
 const previous=doc.querySelector('.pv-shell');
 const shell=el('main',null,'pv-shell'),nav=el('nav',null,'pv-nav');nav.setAttribute('aria-label','Вернуться к курсу');
 for(const [href,text] of [['index.html','Все сюжеты 1–5'],['../oge-course/','Весь курс ОГЭ']]){const link=el('a',text);link.href=href;nav.append(link);}
 shell.append(nav,el('h1',options.title),el('p','Реши задания по условию. Подсказки открываются рядом с вопросом.','pv-intro'));
 if(options.controls){options.controls.classList.add('pv-controls');shell.append(options.controls);}
 const condition=el('section',null,'pv-condition');condition.setAttribute('aria-label','Общее условие');append(condition,options.condition);shell.append(condition);
 const workspace=el('div',null,'pv-workspace'),reference=el('aside',null,'pv-reference');reference.setAttribute('aria-label','Рисунок и данные варианта');
 const visual=el('div',null,'pv-primary-visual');append(visual,options.visual);reference.append(visual);
 if(options.tables){const tables=el('section',null,'pv-tables');tables.setAttribute('aria-label','Таблицы для решения');append(tables,options.tables);reference.append(tables);}
 const stream=el('section',null,'pv-task-stream');stream.setAttribute('aria-label','Задания варианта');for(const card of options.questions)stream.append(card);
 workspace.append(reference,stream);shell.append(workspace);prepareFigures(reference);
 for(const root of options.nativeRoots||[]){root.hidden=true;root.inert=true;root.dataset.pvNative='1';}
 previous?previous.replaceWith(shell):doc.body.append(shell);doc.body.classList.add('pv-exam');doc.documentElement.dataset.practicalVariant='ready';doc.documentElement.dataset.practicalMinimal='ready';
 return shell;
}
function register(page,init){providers.set(page,init);}
function start(){const init=providers.get(doc.body.dataset.practicalPage);if(doc.body.dataset.practicalVariant==='1'&&init)init(global.PracticalVariant);}
global.PracticalVariant={el,html,clone,help,question,mount,register,prepareFigures};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start);else global.setTimeout(start,0);
})(window);
