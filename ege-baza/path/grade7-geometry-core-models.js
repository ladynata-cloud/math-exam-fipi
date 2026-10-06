/* Elementary geometry: task-bound selections and explicit constructions.
 * No pixels or DOM are persisted; the managed session stores only known IDs. */
(function(root){'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n.toFixed(3)),ink='#173d32',green='#246954',accent='#b54527';
const label=(x,y,s,extra='')=>`<text x="${num(x)}" y="${num(y)}" text-anchor="middle" fill="${ink}" stroke="white" stroke-width="5" paint-order="stroke" font-family="system-ui,sans-serif" font-size="21" ${extra}>${E(s)}</text>`;
const visible=(item,built)=>!item.construction||built.includes(item.construction);
function svg(task,selected=null,built=[]){
 const d=task.model.diagram,points=d.points,all=Object.values(points),xs=all.map(p=>p.x),ys=all.map(p=>p.y);
 if(d.protractor){const c=points[d.protractor.center],r=d.protractor.radius;xs.push(c.x-r,c.x+r);ys.push(c.y-r,c.y);}
 const lowX=Math.min(...xs)-85,lowY=Math.min(...ys)-75,width=Math.max(350,Math.max(...xs)-lowX+85),height=Math.max(250,Math.max(...ys)-lowY+80);
 let body='';
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
 let readOnly=!!options.readOnly;const locked=()=>readOnly||host.inert||!!host.closest('[inert]');
 host.innerHTML=`<p>Выдели элемент чертежа и прочитай его свойство.${constructions.length?' Затем выбери нужное построение.':''} Все изменения можно отменить.</p><div data-core-drawing></div><div class="actions" role="group" aria-label="Элементы чертежа">${model.elements.map(e=>`<button type="button" data-core-select="${E(e.id)}" aria-pressed="false">${E(e.label)}</button>`).join('')}</div>${constructions.length?`<div class="actions" role="group" aria-label="Построить линию">${constructions.map(c=>`<button type="button" data-core-build="${E(c.id)}" aria-pressed="false">${E(c.label)}</button>`).join('')}<button type="button" data-core-reset>Убрать построения</button></div>`:''}<p data-core-read role="status"></p><div class="actions"><button type="button" data-core-next>Объяснить следующий шаг</button><button type="button" data-core-clear>Начать исследование заново</button></div><ol data-core-steps aria-label="Шаги объяснения" aria-live="polite"></ol><p class="muted">После разбора реши новый вариант самостоятельно. Просмотр модели остаётся в истории этой попытки.</p>`;
 function draw(){
  host.querySelector('[data-core-drawing]').innerHTML=svg(task,state.selected,state.built);
  host.querySelectorAll('[data-core-select]').forEach(b=>{b.disabled=locked();b.setAttribute('aria-pressed',String(b.dataset.coreSelect===state.selected));});
  host.querySelectorAll('[data-core-build]').forEach(b=>{b.disabled=locked();b.setAttribute('aria-pressed',String(state.built.includes(b.dataset.coreBuild)));});
  host.querySelector('[data-core-read]').textContent=model.elements.find(e=>e.id===state.selected)?.description||constructions.find(c=>c.id===state.built.at(-1))?.description||model.diagram.description;
  host.querySelector('[data-core-steps]').innerHTML=task.steps.slice(0,state.revealed).map(s=>`<li><p>${E(s.why)}</p></li>`).join('');
  host.querySelector('[data-core-next]').disabled=locked()||state.revealed>=task.steps.length;
  host.querySelector('[data-core-clear]').disabled=locked()||!state.selected&&!state.built.length&&!state.revealed;
  const reset=host.querySelector('[data-core-reset]');if(reset)reset.disabled=locked()||!state.built.length;
 }
 const mutate=fn=>{if(locked())return;fn();draw();session.changed();};
 host.querySelectorAll('[data-core-select]').forEach(b=>b.onclick=()=>mutate(()=>{state.selected=b.dataset.coreSelect;}));
 host.querySelectorAll('[data-core-build]').forEach(b=>b.onclick=()=>mutate(()=>{const id=b.dataset.coreBuild;state.built=state.built.includes(id)?state.built.filter(x=>x!==id):[...state.built,id];state.selected=null;}));
 const reset=host.querySelector('[data-core-reset]');if(reset)reset.onclick=()=>mutate(()=>{state.built=[];});
 host.querySelector('[data-core-next]').onclick=()=>mutate(()=>{state.revealed=Math.min(task.steps.length,state.revealed+1);});
 host.querySelector('[data-core-clear]').onclick=()=>mutate(()=>{state.selected=null;state.built=[];state.revealed=0;});
 session.setReadOnly=value=>{readOnly=!!value;draw();};draw();return session;
}
root.PathGrade7Construction={svg,visual,mount};
if(root.PathModels){const previous=root.PathModels.mount;root.PathModels.mount=(host,task,options={})=>task.model?.kind==='grade7-construction'?mount(host,task,options):previous(host,task,options);}
if(typeof module!=='undefined')module.exports=root.PathGrade7Construction;
})(typeof window==='undefined'?globalThis:window);
