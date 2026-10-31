/* A continuous tire variant built from the original task nodes and validators.
 * DOM step IDs and native order are retained; only optional explanations fold. */
(function(global){
'use strict';
const doc=global.document,q=(s,r=doc)=>r.querySelector(s),qa=(s,r=doc)=>Array.from(r.querySelectorAll(s));
const make=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const text=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
let decorating=false,started=false,model=null,modelKey='';
function details(label,cls){const d=make('details','pm-details '+(cls||''));d.append(make('summary',null,label),make('div','pm-content'));return d;}
function before(node,reference){if(node&&reference&&node.nextElementSibling!==reference)reference.before(node);}
function structure(){
 const main=q('.layout>main');if(!main)return null;
 let common=q('#tvl-common-condition');
 if(!common){
  common=make('section','tvl-common-condition');common.id='tvl-common-condition';common.setAttribute('aria-label','Общее условие и модель шины');
  common.append(make('h2',null,'Шины. Задания 1–5'),make('p','tvl-common-given'),make('p','tvl-marking-given','Первое число маркировки — ширина шины в миллиметрах. Второе — высота боковины в процентах от ширины. После R указан диаметр диска в дюймах; R означает радиальную конструкцию. 1 дюйм = 25,4 мм.'));
  const host=make('div','tvl-main-model');host.id='tvl-main-model';host.setAttribute('aria-label','Интерактивная модель заводской шины');common.append(host);
  const explanation=details('Что означает маркировка?','tvl-marking-help');common.append(explanation);main.prepend(common);
  const workspace=make('div','tvl-workspace');workspace.id='tvl-workspace';
  const tables=make('aside','tvl-tables-pane');tables.id='tvl-tables-pane';tables.tabIndex=0;tables.setAttribute('aria-label','Таблица совместимости и твоя таблица расчётов');
  const tasks=make('div','tvl-task-stream');tasks.id='tvl-task-stream';tasks.setAttribute('aria-label','Все пять заданий варианта');workspace.append(tables,tasks);common.after(workspace);
 }
 const marking=q('#section-0'),markingHost=q('.tvl-marking-help>.pm-content',common);if(marking&&marking.parentElement!==markingHost)markingHost.append(marking);
 const tables=q('#tvl-tables-pane'),calc=q('#section-1');if(calc&&calc.parentElement!==tables)tables.append(calc);
 const tasks=q('#tvl-task-stream');for(const id of [2,3,4,5,6]){const section=q('#section-'+id);if(section&&section.parentElement!==tasks)tasks.append(section);}
 // This preserves 0,1,2,3,4,5,6 in the native engine's section NodeList.
 const nav=q('#step-stepper')?.closest('details');if(nav&&nav.parentElement!==common)common.append(nav);
 const roadmap=q('.roadmap')?.closest('details');if(roadmap)roadmap.hidden=true;
 const bar=q('.variant-bar'),fold=bar?.closest('details');if(fold){fold.before(bar);fold.remove();}
 qa('.tlf-shared-calculations').forEach(region=>region.remove());
 return common;
}
function mainModel(common){
 const factory=q('#vb-factory')?.textContent.trim()||'',key=(q('#variant-select')?.value||'')+'|'+factory;
 text(q('.tvl-common-given',common),'Заводская шина этого варианта — '+factory+'. Используй общее условие и таблицу совместимости для заданий 1–5.');
 const host=q('#tvl-main-model');if(!host||!global.Tire3D)return;
 if(!model){
  host.append(make('p','tvl-model-instruction','Поверни шину мышью или пальцем. Отметь размеры, которые хочешь увидеть.'));
  model=global.Tire3D.mount(host,{kind:'wheel'});
  const root=model.root,stage=q('.t3d-stage',root),choices=q('.t3d-dimensions',root);before(stage,choices);
  const experiments=details('Хочешь изменить маркировку и сравнить?','tvl-model-experiments'),content=q('.pm-content',experiments);
  content.append(make('p',null,'Это исследование модели. Условия задач остаются прежними; расчёты и ответы впиши самостоятельно.'),q('.t3d-controls',root));
  const reset=make('button','pd-action tvl-reset-model','Вернуть заводскую шину');reset.type='button';reset.addEventListener('click',()=>resetModel(factoryFromPage()));content.append(reset);root.append(experiments);
 }
 if(key!==modelKey){modelKey=key;resetModel(factory);}
}
function factoryFromPage(){return q('#vb-factory')?.textContent.trim()||'';}
function resetModel(marking){
 const match=marking.match(/(\d+)\s*\/\s*(\d+)\s*R\s*(\d+)/i);if(!model||!match)return;
 const values={width:+match[1],profile:+match[2],disk:+match[3]},root=model.root;
 for(const [key,value]of Object.entries(values)){const input=q('[data-pd-key="'+key+'"]',root);input.min=String(Math.min(+input.min,value));input.max=String(Math.max(+input.max,value));input.step='1';input.value=String(value);input.dispatchEvent(new global.Event('input',{bubbles:true}));}
 for(const [key,value]of [['tire-yaw',global.Tire3D.presets.quarter.yaw],['tire-pitch',global.Tire3D.presets.quarter.pitch],['part','width']]){const input=q('[data-pd-key="'+key+'"]',root);input.value=String(value);}
 model.draw();
}
function compatibility(){
 const pane=q('#tvl-tables-pane'),calc=q('#section-1'),fresh=q('#section-2 .tlf-compatibility-given');
 if(fresh){qa(':scope>.tlf-compatibility-given',pane).forEach(old=>old.remove());pane.insertBefore(fresh,calc);}
 const given=q(':scope>.tlf-compatibility-given',pane);if(!given)return;
 text(q('h3',given),'Таблица совместимости');
 if(!q('.tvl-compatibility-note',given)){const note=make('p','tvl-compatibility-note','Прочерк — сочетание не допускается. Если видны не все диаметры диска, прокрути таблицу вправо.');q('h3',given).after(note);}
 if(!q('.tvl-compatibility-help',given)){
  const help=details('Как читать эту таблицу?','tvl-compatibility-help'),content=q('.pm-content',help);qa(':scope>p:not(.tvl-compatibility-note)',given).forEach(p=>content.append(p));given.append(help);
 }
}
function calculations(){
 const section=q('#section-1'),card=section&&q('.card',section),table=q('#master-table');if(!card||!table)return;
 text(q('.card-header h2',card),'Твоя таблица расчётов');const tag=q('.card-tag',card);if(tag)tag.hidden=true;
 let help=q('.tvl-calculation-help',card);
 if(!help){help=details('Как заполнить таблицу?','tvl-calculation-help');card.append(help);const content=q('.pm-content',help);
  const selectors=['.card-intro','.pd-native-help','.wt-wrap','.calc-table-caption','.formula-hint','.schema-ref','.wheel-svg-wrap','.tlf-scroll-note','.d-box','.teacher-block'];
  for(const selector of selectors)qa(':scope>'+selector,card).forEach(node=>content.append(node));
  const instruction=make('p','tvl-calculation-instruction','Впиши свои расчёты. Нажми Enter или перейди к другой ячейке — число проверится. Если видны не все столбцы, прокрути таблицу вправо.');q('.card-header',card).after(instruction);
 }
 // The discovery layer can add this note after the calculation help exists.
 // Keep its side-view warning next to the folded side-view drawing.
 qa(':scope>.t3d-original-note',card).forEach(note=>q('.pm-content',help).append(note));
 // The original sample cells already have the same native blur/Enter validator.
 // Unlock only unanswered cells; accepted and teacher-filled values stay locked.
 if(doc.body.dataset.mode!=='teacher')qa('.calc-cell.sample',section).forEach(input=>{if(!input.classList.contains('correct')&&!input.hasAttribute('data-teacher-filled'))input.disabled=false;});
 text(q('.wt-sub',section),'Можно заполнить первую строку прямо в таблице или пройти эти четыре шага. Проверенные числа сохранятся в таблице.');
 text(q('.sample-done',section),'Первая строка готова. Заполни остальные строки таблицы тем же способом.');
 const headers=qa('thead th',table),names=['Маркировка','Ширина B, мм','p, %','Диск d, дюйм','Диск d, мм','Боковина H, мм','Колесо D, мм'];
 headers.forEach((th,i)=>{if(th.firstChild?.nodeType===3&&th.firstChild.textContent!==names[i])th.firstChild.textContent=names[i];});
 const done=q('#table-done-msg');if(done&&!done.dataset.tvlCopy){done.replaceChildren(make('strong',null,'Таблица собрана! '),doc.createTextNode('Используй свои расчёты для задач 2–5.'));done.dataset.tvlCopy='1';}
}
const questions={0:'Что означает маркировка?',1:'Как найти размеры колеса?',2:'Как выбрать шину по таблице?',3:'Как найти высоту боковины?',4:'Как найти диаметр колеса?',5:'Как сравнить размеры колёс?',6:'Как связаны оборот колеса и пробег?'};
function contextHelp(){
 for(const id of [0,1,2,3,4,5,6]){const section=q('#section-'+id);if(!section)continue;
  qa('.pd-toggle',section).forEach(button=>{const panel=doc.getElementById(button.getAttribute('aria-controls'));if(panel){button.dataset.contextLabel=questions[id];text(button,panel.hidden?questions[id]:'Убрать подсказку');}});
  if(id<2)continue;
  const card=q('.card',section),panel=q('.card-intro',section)?.parentElement.querySelector('.pd-panel');if(!card||!panel)continue;
  qa(':scope>p:not(.card-intro),:scope>.teacher-block',card).forEach(node=>panel.insertBefore(node,q('.pd-return',panel)));
 }
}
function decorate(){
 if(doc.body.dataset.practicalPage!=='tires'||decorating)return;decorating=true;
 try{doc.body.classList.add('tvl-exam');const common=structure();if(!common)return;mainModel(common);compatibility();calculations();contextHelp();
  if(model&&q('#tvl-tables-pane .compat-table')&&q('#master-table')&&qa('#tvl-task-stream>.step-section').length===5)doc.documentElement.dataset.tireVariantLayout='ready';
 }finally{decorating=false;}
}
function init(){
 if(started||doc.body.dataset.practicalPage!=='tires')return;started=true;
 doc.addEventListener('click',event=>{const navigation=event.target.closest('#step-stepper [data-step],[data-goto]');
  if(navigation){const id=+(navigation.dataset.step??navigation.dataset.goto);queueMicrotask(()=>{const section=q('#section-'+id);if(!section)return;for(let p=section.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;section.scrollIntoView?.({behavior:'smooth',block:'start'});});}
  if(event.target.closest('.pd-toggle,.pd-return'))queueMicrotask(contextHelp);
 });
 decorate();
}
global.TireVariantLayout={decorate};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>global.setTimeout(init,0));else init();
})(window);
