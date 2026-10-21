/* Tire-only presentation adapter. The original task engine, answer keys and
 * stored step IDs are untouched. Native controls remain mounted, never cloned. */
(function(global){
'use strict';
const doc=global.document,order=[0,2,1,3,4,5,6];
const names={0:'Давайте разберёмся с маркировкой',2:'Задача 1 · читаем таблицу',1:'Соберём таблицу расчётов',3:'Задача 2',4:'Задача 3',5:'Задача 4',6:'Задача 5'};
const short={0:'Маркировка',2:'Задача 1',1:'Таблица расчётов',3:'Задача 2',4:'Задача 3',5:'Задача 4',6:'Задача 5'};
const q=(s,r=doc)=>r.querySelector(s),qa=(s,r=doc)=>Array.from(r.querySelectorAll(s));
const setText=(node,text)=>{if(node&&node.textContent!==text)node.textContent=text;};
const make=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
let started=false,decorating=false;
function arrange(ids){
 const host=q('#step-stepper');if(!host)return;
 const buttons=qa('.step-btn',host),wanted=ids.map(id=>buttons.find(b=>+b.dataset.step===id)).filter(Boolean);
 if(wanted.some((b,i)=>buttons[i]!==b))wanted.forEach(b=>host.append(b));
}
function wrapEngine(){
 // These two original helpers index DOM buttons by i. Give them their original
 // order only for the synchronous call, then restore the learner-facing route.
 // The same button objects carry the correctly calculated active/done classes.
 for(const key of ['goToStep','refreshStepperDone']){
  const native=global[key];if(typeof native!=='function'||native.tlfWrapped)continue;
  const wrapper=function(...args){arrange([0,1,2,3,4,5,6]);let result;try{result=native.apply(this,args);}finally{arrange(order);syncCurrent();}return result;};
  wrapper.tlfWrapped=true;global[key]=wrapper;
 }
}
function syncCurrent(){
 qa('#step-stepper .step-btn').forEach(b=>{if(b.classList.contains('active'))b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 syncCalculations();
}
function navigation(){
 arrange(order);
 qa('#step-stepper .step-btn').forEach(b=>{const id=+b.dataset.step;setText(q('.step-num',b),String(order.indexOf(id)+1));setText(q('.step-name',b),names[id]);b.setAttribute('aria-label',names[id]);});
 for(let i=0;i<order.length;i++){
  const section=q('#section-'+order[i]),nav=section&&q('.nav-row',section);if(!nav)continue;
  const back=q('.nav-btn:not(.next)',nav),next=q('.nav-btn.next',nav);
  if(back){back.disabled=i===0;if(i===0){back.removeAttribute('data-goto');setText(back,'← Назад');}else{back.dataset.goto=String(order[i-1]);setText(back,'← '+short[order[i-1]]);}}
  if(next&&i<order.length-1){next.dataset.goto=String(order[i+1]);setText(next,short[order[i+1]]+' →');}
 }
 const roadmap=q('.roadmap');if(roadmap&&!roadmap.dataset.tlfCopy){
  const steps=[['Разберёмся с маркировкой','Найди ширину B, процент p и диаметр диска d.'],['Задача 1: прочитай таблицу','Используй таблицу совместимости прямо под условием.'],['Собери таблицу расчётов','Посчитай размеры всех шин варианта один раз.'],['Реши задачи 2–5','Используй свои расчёты рядом с каждым условием.']];
  roadmap.replaceChildren(...steps.map(([title,text],i)=>{const card=make('div','rm-card');card.append(make('span','rm-num',String(i+1)),make('h4',null,title),make('p',null,text));return card;}));roadmap.dataset.tlfCopy='1';
 }
 setText(q('#section-0 .card-header h2'),names[0]);
 setText(q('#section-1 .card-tag'),'После задачи 1');
 setText(q('#section-1 .card-header h2'),'Соберём таблицу расчётов для задач 2–5');
 qa('.task-gate').forEach(g=>{const b=q('[data-goto="1"]',g);if(!b)return;if(!g.dataset.tlfCopy){g.replaceChildren(doc.createTextNode('Для задач 2–5 заполни таблицу расчётов. Она находится после задачи 1. '),b);g.dataset.tlfCopy='1';}setText(b,'Открыть таблицу');});
 const done=q('#table-done-msg');if(done&&!done.dataset.tlfCopy){done.replaceChildren(make('strong',null,'Таблица собрана! '),doc.createTextNode('Твои расчёты будут видны рядом с условиями задач 2–5. Можно вернуться к таблице в любой момент.'));done.dataset.tlfCopy='1';}
 setText(q('.side-table-empty'),'Таблица расчётов находится после задачи 1. Заполни её — твои числа будут видны рядом с условиями задач 2–5.');
}
function compatibility(){
 const section=q('#section-2'),table=section&&q('.compat-table',section),answer=q('#t1-final');if(!table||!answer)return;
 qa('.col-hl,.win',table).forEach(c=>c.classList.remove('col-hl','win'));
 let given=q('.tlf-compatibility-given',section);
 if(!given){given=make('section','tlf-compatibility-given');given.setAttribute('aria-label','Таблица совместимости из условия задачи 1');given.append(make('h3',null,'Таблица к задаче 1'),make('p',null,'В первом столбце указана ширина шины в миллиметрах, в остальных — допустимые значения второго числа маркировки (проценты). «—» означает, что сочетание не допускается. Если видны не все диаметры диска, прокрути таблицу вправо.'));const wrap=table.closest('.calc-table-wrap')||table.parentElement;given.append(wrap);}
 if(given.nextElementSibling!==answer)answer.before(given);
}
function calculations(){
 const source=q('#master-table');if(!source)return;
 for(const step of [3,4,5,6]){
  const section=q('#section-'+step),intro=section&&q('.card-intro',section);if(!intro||q('.tlf-shared-calculations',section))continue;
  const region=make('section','tlf-shared-calculations');region.setAttribute('aria-label','Твоя таблица расчётов');
  const header=make('div','tlf-calculation-heading');header.append(make('h3',null,'Твоя таблица расчётов'));
  const edit=make('button','tlf-open-calculations','Открыть и дополнить таблицу');edit.type='button';edit.dataset.goto='1';header.append(edit);
  region.append(header,make('p','tlf-calculation-note','Здесь твои записи. ✓ — проверено; остальные числа — черновик. Чтобы дописать или исправить число, открой таблицу. Если видны не все столбцы, прокрути таблицу вправо.'));
  const scroll=make('div','pm-table-scroll'),table=make('table','tlf-calculation-table');table.setAttribute('aria-label','Твои записи из общей таблицы');scroll.append(table);region.append(scroll);intro.after(region);
 }
 syncCalculations();
}
function syncCalculations(){
 const source=q('#master-table');if(!source)return;
 const rows=qa('tbody tr',source).map(row=>({mark:q('.marking',row)?.childNodes[0]?.textContent?.trim()||q('td',row)?.textContent?.trim()||'',cells:qa('.calc-cell',row).map(input=>({field:input.dataset.cell,value:input.value,status:input.classList.contains('correct')?'correct':input.classList.contains('wrong')?'wrong':'draft'}))}));
 const signature=JSON.stringify(rows);
 qa('.tlf-calculation-table').forEach(table=>{
  if(table.dataset.tlfSignature===signature)return;table.dataset.tlfSignature=signature;
  const head=make('thead'),hr=make('tr');['Маркировка','B, мм','p, %','d, дюйм','d, мм','H, мм','D, мм'].forEach(label=>{const th=make('th',null,label);th.scope='col';hr.append(th);});head.append(hr);
  const body=make('tbody');rows.forEach(row=>{const tr=make('tr'),name=make('th',null,row.mark);name.scope='row';tr.append(name);row.cells.forEach(cell=>{const td=make('td','tlf-value tlf-'+cell.status,cell.value||'—');td.dataset.cell=cell.field;td.dataset.status=cell.value?cell.status:'empty';td.setAttribute('aria-label',cell.value?(cell.value+(cell.status==='correct'?' — проверено':cell.status==='wrong'?' — исправь число':' — черновик, пока не проверено')):'Ещё не заполнено');if(cell.value){const state=make('span','tlf-value-status',cell.status==='correct'?' ✓':cell.status==='wrong'?' · исправь':' · черновик');td.append(state);}tr.append(td);});body.append(tr);});table.replaceChildren(head,body);
 });
}
function diagramNotes(){
 qa('.anim-svg-wrap,.wheel-svg-wrap').forEach(wrap=>{if(wrap.nextElementSibling?.classList.contains('tlf-scroll-note'))return;wrap.after(make('p','tlf-scroll-note','На небольшом экране прокручивай рисунок влево и вправо: подписи остаются крупными.'));});
 qa('svg.anim-svg').forEach(svg=>{
  const labels=qa('text.anim-lab',svg);if(labels.length!==5)return;
  labels[0].setAttribute('y','24');
  // The original wheels pass through their caption positions. Keep the current
  // engine-produced strings, but place them outside the moving drawing.
  const captions=labels.slice(1),strings=captions.map(label=>label.textContent);
  captions.forEach(label=>{label.dataset.tlfRollingCaption='1';label.setAttribute('aria-hidden','true');});
  const wrap=svg.closest('.anim-svg-wrap');if(!wrap)return;
  let legend=wrap.previousElementSibling;
  if(!legend?.classList.contains('tlf-rolling-captions')){legend=make('div','tlf-rolling-captions');legend.setAttribute('aria-label','Подписи к двум колёсам');wrap.before(legend);}
  const signature=JSON.stringify(strings);if(legend.dataset.tlfSignature===signature)return;legend.dataset.tlfSignature=signature;
  legend.replaceChildren(...[0,1].map(index=>{const row=make('div','tlf-rolling-caption');row.dataset.wheel=index===0?'upper':'lower';row.append(make('strong','tlf-rolling-position',index===0?'Верхнее колесо':'Нижнее колесо'),make('span','tlf-rolling-caption-name',strings[index*2]),make('span','tlf-rolling-caption-circumference',strings[index*2+1]));return row;}));
 });
}
function terminology(){
 // Copy-only correction in visible UI; never visit script, input or answer data.
 const walker=doc.createTreeWalker(doc.body,global.NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){if(node.parentElement?.closest('script,style,textarea'))continue;const corrected=node.data.replace(/высота профиля/gi,'высота боковины').replace(/высоту профиля/gi,'высоту боковины').replace(/высоты профиля/gi,'высоты боковины').replace('маркировка → таблица для всех шин → ответы','маркировка → задача 1 → таблица расчётов → задачи 2–5');if(corrected!==node.data)node.data=corrected;}
 qa('#master-table .calc-cell').forEach(input=>{if(input.hasAttribute('aria-label'))return;const row=input.closest('tr'),mark=q('.marking',row)?.childNodes[0]?.textContent?.trim()||'',labels={B:'Ширина шины B, мм',p:'Высота боковины в процентах от ширины',di:'Диаметр диска d, дюймы',dm:'Диаметр диска d, мм',H:'Высота боковины H, мм',D:'Полный диаметр колеса D, мм'};input.setAttribute('aria-label',mark+': '+labels[input.dataset.cell]);});
}
function decorate(){
 if(doc.body.dataset.practicalPage!=='tires'||decorating)return;decorating=true;
 try{wrapEngine();navigation();compatibility();calculations();terminology();diagramNotes();syncCurrent();if(q('#master-table')&&q('.tlf-compatibility-given'))doc.documentElement.dataset.tireLearningFlow='ready';}finally{decorating=false;}
}
function init(){
 if(started||doc.body.dataset.practicalPage!=='tires')return;started=true;
 // Native hints used to be one-way 'show'. Handle their UI toggle in capture;
 // no native answer/check/choice handler is intercepted.
 doc.addEventListener('click',event=>{const button=event.target.closest('.substep-hint-btn');if(!button)return;const panel=button.parentElement.querySelector('.substep-hint');if(!panel)return;event.preventDefault();event.stopImmediatePropagation();const show=panel.hidden||!panel.classList.contains('show');panel.hidden=!show;panel.classList.toggle('show',show);button.textContent=show?'Убрать подсказку':'Хочешь подсказку?';button.setAttribute('aria-expanded',String(show));},true);
 doc.addEventListener('toggle',event=>{const details=event.target;if(details.matches?.('.pm-wheel-hint'))setText(q('summary',details),details.open?'Убрать подсказку':'Хочешь подсказку?');},true);
 for(const type of ['input','change','blur','click'])doc.addEventListener(type,event=>{if(event.target.closest?.('#master-table,#section-1'))queueMicrotask(syncCalculations);},true);
 decorate();
}
global.TireLearningFlow={decorate,order:order.slice()};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>global.setTimeout(init,0));else init();
})(window);
