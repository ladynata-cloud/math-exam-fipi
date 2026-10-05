/* Semantic grade-seven geometry diagrams: selection and cumulative worked steps. */
(function(root){'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number(n.toFixed(3)),normal='#246954',accent='#b54527',ink='#173d32';
function label(x,y,text,extra=''){
 return `<text x="${number(x)}" y="${number(y)}" text-anchor="middle" fill="${ink}" stroke="white" stroke-width="5" paint-order="stroke" stroke-linejoin="round" font-size="22" font-family="system-ui,sans-serif" ${extra}>${E(text)}</text>`;
}
function ticks(p,q,count,color){
 if(!count)return '';
 const dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
 return Array.from({length:count},(_,i)=>{const offset=(i-(count-1)/2)*7,x=mx+ux*offset,y=my+uy*offset;return `<path d="M${number(x-uy*6)} ${number(y+ux*6)}L${number(x+uy*6)} ${number(y-ux*6)}" stroke="${color}" stroke-width="2.5"/>`;}).join('');
}
function segmentMarkup(d,s,selected){
 const p=d.points[s.from],q=d.points[s.to],active=s.id===selected,color=active?accent:normal;
 const width=active?6:3,attrs=`data-geo-id="${E(s.id)}"`,dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy);
 let path,markP=p,markQ=q,tx=(p.x+q.x)/2,ty=(p.y+q.y)/2-14;
 if(d.type==='segments'&&s.lane){
  const y=193+s.lane*30;path=`M${p.x} ${y-7}V${y}H${q.x}V${y-7}`;markP={x:p.x,y};markQ={x:q.x,y};ty=y+25;
 }else{
  path=`M${p.x} ${p.y}L${q.x} ${q.y}`;
  if(d.type==='triangles'){
   // Outside each triangle, so values do not cover the corresponding-side marks.
   let nx=-dy/length,ny=dx/length;
   const names=Object.keys(d.points).filter(name=>('ABC'.includes(name))===('ABC'.includes(s.from))),cx=names.reduce((sum,name)=>sum+d.points[name].x,0)/names.length,cy=names.reduce((sum,name)=>sum+d.points[name].y,0)/names.length;
   if(nx*(cx-tx)+ny*(cy-(p.y+q.y)/2)>0){nx=-nx;ny=-ny;}
   tx=(p.x+q.x)/2+nx*40;ty=(p.y+q.y)/2+ny*40+6;
  }
 }
 return `<g ${attrs}><path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>${ticks(markP,markQ,s.marks,color)}${s.label?label(tx,ty,s.label):''}</g>`;
}
function angleMarkup(d,a,selected){
 const v=d.points[a.vertex],p=d.points[a.from],start=Math.atan2(v.y-p.y,p.x-v.x),delta=a.degrees*Math.PI/180,active=a.id===selected,color=active?accent:normal;
 const at=(r,t)=>[number(v.x+r*Math.cos(t)),number(v.y-r*Math.sin(t))];
 const end=start+delta,arcs=Math.max(1,a.marks||1),r=a.radius;
 let result='';
 if(active){
  const p1=at(r+8,start),p2=at(r+8,end);
  result+=`<path d="M${v.x} ${v.y}L${p1.join(' ')}A${r+8} ${r+8} 0 ${a.degrees>180?1:0} 0 ${p2.join(' ')}Z" fill="#e7a775" fill-opacity=".3"/>`;
 }
 for(let i=0;i<arcs;i++){
  const radius=r+i*5,p1=at(radius,start),p2=at(radius,end);
  result+=`<path d="M${p1.join(' ')}A${radius} ${radius} 0 ${a.degrees>180?1:0} 0 ${p2.join(' ')}" fill="none" stroke="${color}" stroke-width="${active?3.5:2}"${a.marks?'':' stroke-dasharray="5 5"'}/>`;
 }
 let labelAngle=start+delta/2;
 if(!a.marks){
  // The middle of the whole angle may itself be a bisector. Place the label
  // between existing rays so the printed value does not hide that ray.
  const cuts=[0,delta,...Object.entries(d.points).filter(([name])=>name!==a.vertex).map(([,point])=>((Math.atan2(v.y-point.y,point.x-v.x)-start)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)).filter(t=>t>0&&t<delta)].sort((x,y)=>x-y);
  let gap=-1;for(let i=1;i<cuts.length;i++)if(cuts[i]-cuts[i-1]>gap){gap=cuts[i]-cuts[i-1];labelAngle=start+(cuts[i]+cuts[i-1])/2;}
 }
 const [x,y]=at(r+arcs*5+19,labelAngle);
 return `<g data-geo-id="${E(a.id)}">${result}${a.label?label(x,y+5,a.label):''}</g>`;
}
function svg(task,selected=null){
 const d=task.model.diagram;
 let viewBox=d.type==='segments'?'25 90 550 220':'-30 40 635 285';
 if(d.type==='angles'){
  const points=Object.values(d.points),loX=Math.min(...points.map(p=>p.x)),hiX=Math.max(...points.map(p=>p.x)),loY=Math.min(...points.map(p=>p.y)),hiY=Math.max(...points.map(p=>p.y)),width=Math.max(420,hiX-loX+90);
  viewBox=[(loX+hiX-width)/2,loY-40,width,hiY-loY+90].map(number).join(' ');
 }
 return `<svg class="task-figure grade7-geometry-figure" viewBox="${viewBox}" role="img" aria-label="${E(d.description)}" style="width:100%;max-width:640px;height:auto;display:block;margin:auto;background:#fbfdf9;border-radius:16px">${d.segments.map(s=>segmentMarkup(d,s,selected)).join('')}${d.angles.map(a=>angleMarkup(d,a,selected)).join('')}${Object.entries(d.points).map(([name,p])=>`<circle cx="${number(p.x)}" cy="${number(p.y)}" r="3.5" fill="${ink}"/>${label(p.x+p.dx,p.y+p.dy,name,'font-weight="700"')}`).join('')}</svg>`;
}
function visual(task){return `${svg(task)}<p class="muted">${E(task.model.diagram.description)}${task.model.diagram.angles.some(a=>!a.marks)?' Пунктирная дуга обозначает целый угол.':''} Числа берём из условия, а не измеряем по экрану.</p>`;}
function mount(host,task,options={}){
 const session=root.PathModels.session(host,'grade7-geometry',options),state=session.value,elements=task.model.elements;
 state.selected=elements.some(x=>x.id===state.selected)?state.selected:null;
 state.revealed=Number.isInteger(state.revealed)?Math.max(0,Math.min(task.steps.length,state.revealed)):0;
 let readOnly=!!options.readOnly;
 const isReadOnly=()=>readOnly||host.inert||!!host.closest('[inert]');
 host.innerHTML=`<p>Нажми на название, чтобы выделить часть чертежа. Разбор открывается по одному шагу; предыдущие шаги остаются на экране.</p><div data-geometry-drawing></div><div class="actions" role="group" aria-label="Выделить часть чертежа">${elements.map(x=>`<button type="button" data-geometry-select="${E(x.id)}" aria-pressed="false">${E(x.label)}</button>`).join('')}<button type="button" data-geometry-clear>Снять выделение</button></div><p data-geometry-read role="status"></p><div class="actions"><button type="button" data-geometry-next>Следующий шаг разбора</button><button type="button" data-geometry-reset>Скрыть разбор</button></div><ol data-geometry-steps aria-label="Открытые шаги разбора" aria-live="polite"></ol><p class="muted">Разбор помогает понять решение. Для самостоятельной проверки затем выбери новый вариант.</p>`;
 const draw=()=>{
  host.querySelector('[data-geometry-drawing]').innerHTML=svg(task,state.selected);
  host.querySelectorAll('[data-geometry-select]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.geometrySelect===state.selected));button.disabled=isReadOnly();});
  host.querySelector('[data-geometry-read]').textContent=elements.find(x=>x.id===state.selected)?.description||'Выбери отрезок или угол кнопкой над этой строкой.';
  host.querySelector('[data-geometry-steps]').innerHTML=task.steps.slice(0,state.revealed).map(step=>`<li><p>${E(step.why)}</p></li>`).join('');
  host.querySelector('[data-geometry-next]').disabled=isReadOnly()||state.revealed>=task.steps.length;
  host.querySelector('[data-geometry-reset]').disabled=isReadOnly()||state.revealed===0;
  host.querySelector('[data-geometry-clear]').disabled=isReadOnly()||state.selected===null;
 };
 const mutate=fn=>{if(isReadOnly())return;fn();draw();session.changed();};
 host.querySelectorAll('[data-geometry-select]').forEach(button=>button.onclick=()=>mutate(()=>{state.selected=button.dataset.geometrySelect;}));
 host.querySelector('[data-geometry-clear]').onclick=()=>mutate(()=>{state.selected=null;});
 host.querySelector('[data-geometry-next]').onclick=()=>mutate(()=>{state.revealed=Math.min(task.steps.length,state.revealed+1);});
 host.querySelector('[data-geometry-reset]').onclick=()=>mutate(()=>{state.revealed=0;});
 session.setReadOnly=value=>{readOnly=!!value;draw();};
 draw();return session;
}
root.PathGrade7Geometry={svg,visual,mount};
if(root.PathModels){const previous=root.PathModels.mount;root.PathModels.mount=(host,task,options={})=>task.model?.kind==='grade7-geometry'?mount(host,task,options):previous(host,task,options);}
if(typeof module!=='undefined')module.exports=root.PathGrade7Geometry;
})(typeof window==='undefined'?globalThis:window);
