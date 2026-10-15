/* Elementary geometry: task-bound selections and explicit constructions.
 * No pixels or DOM are persisted; the managed session stores only known IDs. */
(function(root){'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n.toFixed(3)),ink='#173d32',green='#246954',accent='#b54527';
const label=(x,y,s,extra='')=>`<text x="${num(x)}" y="${num(y)}" text-anchor="middle" fill="${ink}" stroke="white" stroke-width="5" paint-order="stroke" font-family="system-ui,sans-serif" font-size="21" ${extra}>${E(s)}</text>`;
const visible=(item,built)=>!item.construction||built.includes(item.construction);
function svg(task,selected=null,built=[]){
 const d=task.model.diagram,points=d.points,all=Object.values(points),xs=all.map(p=>p.x),ys=all.map(p=>p.y);
 for(const circle of d.circles||[]){const c=points[circle.center],r=circle.radius;xs.push(c.x-r,c.x+r);ys.push(c.y-r,c.y+r);}
 if(d.protractor){const c=points[d.protractor.center],r=d.protractor.radius;xs.push(c.x-r,c.x+r);ys.push(c.y-r,c.y);}
 const lowX=Math.min(...xs)-85,lowY=Math.min(...ys)-75,width=Math.max(350,Math.max(...xs)-lowX+85),height=Math.max(250,Math.max(...ys)-lowY+80);
 let body='';
 for(const circle of d.circles||[]){
  if(!visible(circle,built))continue;
  const c=points[circle.center],active=selected===circle.id;
  body+=`<circle data-core-part="${E(circle.id)}" cx="${num(c.x)}" cy="${num(c.y)}" r="${num(circle.radius)}" fill="none" stroke="${active?accent:green}" stroke-width="${active?6:3}"/>`;
 }
 if(d.protractor){
  const p=d.protractor,c=points[p.center],r=p.radius,at=(degree,radius)=>[num(c.x+radius*Math.cos(degree*Math.PI/180)),num(c.y-radius*Math.sin(degree*Math.PI/180))];
  body+=`<path d="M${num(c.x-r)} ${num(c.y)}A${r} ${r} 0 0 1 ${num(c.x+r)} ${num(c.y)}" fill="none" stroke="#94aea0" stroke-width="2"/>`;
  for(let angle=0;angle<=180;angle+=10){const a=at(angle,r),b=at(angle,r-(angle%30===0?13:7));body+=`<path d="M${a.join(' ')}L${b.join(' ')}" stroke="#94aea0" stroke-width="1.5"/>`;}
  for(const reading of p.readings){const a=at(reading.degrees,r),b=at(reading.degrees,r-16),pos=at(reading.degrees,r+23);body+=`<path d="M${a.join(' ')}L${b.join(' ')}" stroke="${accent}" stroke-width="2.5"/>${label(pos[0],pos[1]+6,reading.label)}`;}
 }

 for(const s of d.segments||[]){
  if(!visible(s,built))continue;
  const p=points[s.from],q=points[s.to],active=selected===s.id,color=active?accent:green,dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
  body+=`<g data-core-part="${E(s.id)}"><path d="M${num(p.x)} ${num(p.y)}L${num(q.x)} ${num(q.y)}" fill="none" stroke="${color}" stroke-width="${active?6:3}"${s.dashed?' stroke-dasharray="7 5"':''}/>`;
  for(let i=0;i<(s.marks||0);i++){const offset=(i-((s.marks||0)-1)/2)*8,x=(p.x+q.x)/2+ux*offset,y=(p.y+q.y)/2+uy*offset;body+=`<path d="M${num(x-uy*7)} ${num(y+ux*7)}L${num(x+uy*7)} ${num(y-ux*7)}" stroke="${color}" stroke-width="2.5"/>`;}
  if(s.label){const x=s.labelX??((p.x+q.x)/2-uy*22),y=s.labelY??((p.y+q.y)/2+ux*22);body+=label(x,y,s.label);}
  body+='</g>';
 }
 for(const a of d.angles||[]){
  if(!visible(a,built))continue;
  const v=points[a.vertex],p=points[a.from],q=points[a.to],start=Math.atan2(p.y-v.y,p.x-v.x),end=Math.atan2(q.y-v.y,q.x-v.x);
  let delta=((end-start+Math.PI*3)%(2*Math.PI))-Math.PI;
  const active=selected===a.id,color=active?accent:green,requested=a.radius||32,r=Math.min(requested,Math.hypot(p.x-v.x,p.y-v.y)*.45,Math.hypot(q.x-v.x,q.y-v.y)*.45),sweep=delta>=0?1:0;
  const at=(radius,t)=>[num(v.x+radius*Math.cos(t)),num(v.y+radius*Math.sin(t))];
  body+=`<g data-core-part="${E(a.id)}">`;
  if(a.right){const u=[Math.cos(start),Math.sin(start)],w=[Math.cos(end),Math.sin(end)],z=r*.65;body+=`<path d="M${num(v.x+u[0]*z)} ${num(v.y+u[1]*z)}l${num(w[0]*z)} ${num(w[1]*z)}l${num(-u[0]*z)} ${num(-u[1]*z)}" fill="none" stroke="${color}" stroke-width="${active?4:2}"${a.marks?'':' stroke-dasharray="5 4"'}/>`;}
  else for(let i=0;i<Math.max(1,a.marks||1);i++){const radius=r+i*5,from=at(radius,start),to=at(radius,start+delta);body+=`<path d="M${from.join(' ')}A${num(radius)} ${num(radius)} 0 0 ${sweep} ${to.join(' ')}" fill="none" stroke="${color}" stroke-width="${active?4:2}"${a.marks?'':' stroke-dasharray="5 4"'}/>`;}
  if(a.label){const [x,y]=at(r+Math.max(1,a.marks||1)*5+20,start+delta/2);body+=label(a.labelX??x,a.labelY??(y+6),a.label);}
  body+='</g>';
 }
 for(const [name,p]of Object.entries(points)){
  if(!visible(p,built)||p.label===false)continue;
  const active=selected===name||selected==='point-'+name;
  body+=`<g data-core-part="${E(name)}"><circle cx="${num(p.x)}" cy="${num(p.y)}" r="${active?7:3.5}" fill="${active?accent:ink}"/>${p.label===false?'':label(p.x+(p.dx??0),p.y+(p.dy??-15),p.label??name,'font-weight="700"')}</g>`;
 }
 return `<svg class="task-figure grade7-core-figure" viewBox="${[lowX,lowY,width,height].map(num).join(' ')}" role="img" aria-label="${E(d.description)}" style="width:100%;max-width:700px;height:auto;display:block;margin:auto;background:#fbfdf9;border-radius:16px">${body}</svg>`;
}
function visual(task){return svg(task)+`<p class="muted">${E(task.model.diagram.description)} Чертёж помогает рассуждать; данные берём из условия. Пунктирные дуги показывают углы, а не их равенство.</p>`;}
function mount(host,task,options={}){
 const model=task.model,session=root.PathModels.session(host,'grade7-construction',options),state=session.value;
 const constructions=model.constructions||[];
 state.selected=model.elements.some(e=>e.id===state.selected)?state.selected:null;
 state.built=Array.isArray(state.built)?[...new Set(state.built.filter(id=>constructions.some(c=>c.id===id)))]:[];
 state.revealed=Number.isInteger(state.revealed)?Math.max(0,Math.min(task.steps.length,state.revealed)):0;
 let readOnly=!!options.readOnly,active=null,renderedLocked;const locked=()=>readOnly||host.inert||!!host.closest('[inert]');
 host.innerHTML=`<p>Выдели элемент чертежа и прочитай его свойство.${constructions.length?' Затем выбери нужное построение.':''} Все изменения можно отменить.</p><div data-core-drawing></div><div class="actions" role="group" aria-label="Элементы чертежа">${model.elements.map(e=>`<button type="button" data-core-select="${E(e.id)}" aria-pressed="false">${E(e.label)}</button>`).join('')}</div>${constructions.length?`<div class="actions" role="group" aria-label="Построить линию">${constructions.map(c=>`<button type="button" data-core-build="${E(c.id)}" aria-pressed="false">${E(c.label)}</button>`).join('')}<button type="button" data-core-reset>Убрать построения</button></div>`:''}<p data-core-read role="status"></p><div class="actions"><button type="button" data-core-next>Объяснить следующий шаг</button><button type="button" data-core-clear>Начать исследование заново</button></div><ol data-core-steps aria-label="Шаги объяснения" aria-live="polite"></ol><p class="muted">После разбора реши новый вариант самостоятельно. Просмотр модели остаётся в истории этой попытки.</p>`;
 function draw(){
  renderedLocked=locked();
  host.querySelector('[data-core-drawing]').innerHTML=svg(task,state.selected,state.built);
  host.querySelectorAll('[data-core-select]').forEach(b=>{b.disabled=locked();b.setAttribute('aria-pressed',String(b.dataset.coreSelect===state.selected));});
  host.querySelectorAll('[data-core-build]').forEach(b=>{b.disabled=locked();b.setAttribute('aria-pressed',String(state.built.includes(b.dataset.coreBuild)));});
  host.querySelector('[data-core-read]').textContent=model.elements.find(e=>e.id===state.selected)?.description||constructions.find(c=>c.id===state.built.at(-1))?.description||model.diagram.description;
  host.querySelector('[data-core-steps]').innerHTML=task.steps.slice(0,state.revealed).map(s=>`<li><p>${E(s.why)}</p></li>`).join('');
  host.querySelector('[data-core-next]').disabled=locked()||state.revealed>=task.steps.length;
  host.querySelector('[data-core-clear]').disabled=locked()||!state.selected&&!state.built.length&&!state.revealed;
  const reset=host.querySelector('[data-core-reset]');if(reset)reset.disabled=locked()||!state.built.length;
  active?.render();
 }
 const mutate=fn=>{if(locked())return;fn();draw();session.changed();};
 host.querySelectorAll('[data-core-select]').forEach(b=>b.onclick=()=>mutate(()=>{state.selected=b.dataset.coreSelect;}));
 host.querySelectorAll('[data-core-build]').forEach(b=>b.onclick=()=>mutate(()=>{const id=b.dataset.coreBuild;state.built=state.built.includes(id)?state.built.filter(x=>x!==id):[...state.built,id];state.selected=null;}));
 const reset=host.querySelector('[data-core-reset]');if(reset)reset.onclick=()=>mutate(()=>{state.built=[];});
 host.querySelector('[data-core-next]').onclick=()=>mutate(()=>{state.revealed=Math.min(task.steps.length,state.revealed+1);});
 host.querySelector('[data-core-clear]').onclick=()=>mutate(()=>{state.selected=null;state.built=[];state.revealed=0;});
 if(task.geometryRebuild)active=activePractice(host,task,state,locked,mutate);
 session.setReadOnly=value=>{readOnly=!!value;if(renderedLocked!==locked())draw();};draw();return session;
}
function activePractice(host,task,state,locked,mutate){
 const panel=document.createElement('section');panel.className='geometry-active';host.classList.add('geometry-active-host');panel.setAttribute('aria-label','Геометрическая мастерская');host.append(panel);
 const all=task.model.elements||[],d=task.model.diagram;
 const points=all.filter(e=>Object.hasOwn(d.points,e.id)),lines=all.filter(e=>(d.segments||[]).some(s=>s.id===e.id)),angles=all.filter(e=>(d.angles||[]).some(a=>a.id===e.id));
 const pick=(items,offset)=>items[(Math.abs(task.seed||0)+offset)%items.length];
 const targets=[points.length&&pick(points,0),lines.length&&pick(lines,1),angles.length&&pick(angles,2)].filter(Boolean);
 let found=0,huntMessage='',huntBad=false,answer='',draftStep=state.revealed,stepMessage='',stepBad=false,buildMessage='',buildBad=false;
 const q=selector=>panel.querySelector(selector);
 const selectedIsTarget=()=>targets[found]?.id===state.selected;
 function render(){
  if(draftStep!==state.revealed){answer='';draftStep=state.revealed;stepMessage='';stepBad=false;}
  const step=task.steps[state.revealed],total=task.steps.length,percent=Math.round(state.revealed/total*100),built=task.params?.requiredBuild;
  panel.innerHTML=`<div class="geometry-active-heading"><span class="badge">Мастерская геометра</span><span>${state.revealed} из ${total} шагов разобрано</span></div><progress value="${state.revealed}" max="${total}" aria-label="Шаги исследования">${percent}%</progress><p>Собирай понятные шаги. Ошибка — повод проверить условие. Можно пробовать ещё раз.</p>
  ${targets.length?`<section class="geometry-mission"><h3>1. Найди на чертеже</h3><p>${found<targets.length?'Найди: <strong>'+E(targets[found].label)+'</strong>. Нажми на рисунок или на кнопку с названием элемента выше.':'Все элементы этой серии найдены.'}</p><div class="actions"><button type="button" data-hunt-check ${found===targets.length?'disabled':''}>Проверить находку</button><span class="geometry-token ${found===targets.length?'earned':''}">${found===targets.length?'✓ Чертёж прочитан':`${found} / ${targets.length} находок`}</span></div><p data-hunt-feedback role="status" class="feedback ${huntBad?'bad':'good'}">${E(huntMessage)}</p></section>`:''}
  ${Array.isArray(built)&&built.length?`<section class="geometry-mission"><h3>2. Проверь построение</h3><p>Кнопками «Провести» выше оставь только построение, которое требуется в условии.</p><button type="button" data-build-check>Проверить построение</button><p data-build-feedback role="status" class="feedback ${buildBad?'bad':'good'}">${E(buildMessage)}</p></section>`:''}
  <section class="geometry-mission"><h3>${built?.length?'3':'2'}. Собери рассуждение</h3>${step?`<p><strong>Шаг ${state.revealed+1}.</strong> ${E(step.q)}</p>${step.choices?`<div class="geometry-choice-grid" role="group" aria-label="Ответ на шаг">${step.choices.map(c=>`<button type="button" data-active-choice="${E(c.value)}" aria-pressed="${answer===c.value}">${E(c.label)}</button>`).join('')}</div>`:`<label>Ответ на шаг <input data-active-answer inputmode="decimal" autocomplete="off" maxlength="80" value="${E(answer)}"></label>`}<div class="actions"><button type="button" data-active-check class="primary">Проверить шаг</button><button type="button" data-active-hint>Нужна подсказка</button></div><p data-active-feedback role="status" class="feedback ${stepBad?'bad':'good'}">${E(stepMessage)}</p>`:`<div class="geometry-finish"><strong>✓ Рассуждение собрано</strong><p>Теперь проверь себя на новом варианте. Разбор остаётся тренировкой с помощью.</p></div>`}</section>
  <section class="geometry-proof-board"><h3>Моя доска рассуждений</h3>${state.revealed?`<ol>${task.steps.slice(0,state.revealed).map(s=>`<li><strong>${E(root.PathPracticeView.answerText(s))}</strong><br>${E(s.why)}</li>`).join('')}</ol>`:'<p>Здесь останутся все разобранные шаги — они не исчезнут после следующего ответа.</p>'}</section><p class="muted">Значки отмечают эту тренировку, а не оценку. Найденные элементы считаются в текущем открытии; разобранные шаги и построения сохраняются вместе с моделью в кабинете.</p>`;
  panel.querySelectorAll('button,input').forEach(b=>{if(locked())b.disabled=true;});
  q('[data-hunt-check]')?.addEventListener('click',()=>{
   if(locked()||found>=targets.length)return;
   if(selectedIsTarget()){found++;huntBad=false;huntMessage=found===targets.length?'Все находки верны. Можно перейти к рассуждению.':'Верно. Теперь найди следующий элемент.';}
   else{huntBad=true;huntMessage=state.selected?'Сверь название: для угла средняя буква — вершина, для отрезка нужны оба конца.':'Сначала выдели элемент на рисунке или кнопкой.';}render();
  });
  q('[data-build-check]')?.addEventListener('click',()=>{
   if(locked())return;const ok=built.length===state.built.length&&built.every(id=>state.built.includes(id));buildBad=!ok;
   buildMessage=ok?'✓ Построение соответствует условию. Объясни, какое свойство это подтверждает.':'Проверь все требования условия. Убери лишние построения и выбери нужное.';render();
  });
  panel.querySelectorAll('[data-active-choice]').forEach(button=>button.onclick=()=>{if(locked())return;answer=button.dataset.activeChoice;render();q('[data-active-choice="'+answer+'"]')?.focus({preventScroll:true});});
  const input=q('[data-active-answer]');if(input){input.oninput=()=>{answer=input.value;};input.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing&&!e.repeat){e.preventDefault();check();}};}
  q('[data-active-check]')?.addEventListener('click',check);
  q('[data-active-hint]')?.addEventListener('click',()=>{if(locked())return;stepMessage=step.why;stepBad=false;render();});
 }
 function check(){
  if(locked())return;const step=task.steps[state.revealed];if(!step)return;
  if(!answer.trim()){stepMessage='Сначала выбери или введи ответ.';stepBad=true;render();return;}
  if(root.PathData.correct(step,answer)){mutate(()=>{state.revealed++;});q('[data-active-choice], [data-active-answer]')?.focus({preventScroll:true});}
  else{stepMessage=root.PathPracticeView.wrongFeedback(step,answer,'Пока не сходится. '+step.why);stepBad=true;render();}
 }
 // The original large labelled controls remain the keyboard/touch alternative.
 // Direct drawing clicks use exactly the same persisted selected-element ID.
 host.querySelector('[data-core-drawing]').addEventListener('click',event=>{
  if(locked())return;const part=event.target.closest?.('[data-core-part]');if(!part||!host.querySelector('[data-core-drawing]')?.contains(part))return;
  const id=part.getAttribute('data-core-part'),button=[...host.querySelectorAll('[data-core-select]')].find(b=>b.dataset.coreSelect===id);button?.click();
 });
 host.querySelector('[data-core-next]').textContent='Открыть следующий шаг с объяснением';
 host.querySelector('[data-core-clear]').addEventListener('click',()=>{if(locked())return;found=0;huntMessage='';stepMessage='';buildMessage='';answer='';render();});
 return {render};
}
root.PathGrade7Construction={svg,visual,mount};
if(root.PathModels){const previous=root.PathModels.mount;root.PathModels.mount=(host,task,options={})=>task.model?.kind==='grade7-construction'?mount(host,task,options):previous(host,task,options);}
if(typeof module!=='undefined')module.exports=root.PathGrade7Construction;
})(typeof window==='undefined'?globalThis:window);
