/* An ephemeral drawing of the saved task. This component never saves answers. */
(function(root){'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>JSON.parse(JSON.stringify(value));
function supported(task){
 const d=task?.model?.diagram;
 return task?.model?.kind==='grade7-construction'&&!!d?.points&&Object.keys(d.points).length>1&&Object.values(d.points).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
}
function movable(task){
 if(!supported(task)||task.params?.kind!=='photo-proof')return [];
 const p=task.model.diagram.points,n=task.params.problem;
 return [1,2].includes(n)&&['A','B','C','D'].every(id=>p[id])?['B']:n===3&&['D','E','F','G','H'].every(id=>p[id])?['D','E']:[];
}
// Reflect paired vertices, rejecting degenerate triangles and changes of side.
function move(task,id,x,y){
 if(!movable(task).includes(id)||!Number.isFinite(x)||!Number.isFinite(y))return false;
 const p=task.model.diagram.points;
 if(task.params.problem===3){
  const u={x:x-p.F.x,y:y-p.F.y},other=p[id==='D'?'E':'D'],v={x:other.x-p.F.x,y:other.y-p.F.y};
  const length=Math.hypot(u.x,u.y),vl=Math.hypot(v.x,v.y);
  if(length<35||Math.abs(u.x*v.y-u.y*v.x)<.2*length*vl)return false;
  Object.assign(p[id],{x,y});Object.assign(p[id==='D'?'H':'G'],{x:2*p.F.x-x,y:2*p.F.y-y});
 }else{
  const dx=p.C.x-p.A.x,dy=p.C.y-p.A.y,length=Math.hypot(dx,dy);
  const side=dx*(y-p.A.y)-dy*(x-p.A.x),old=dx*(p.B.y-p.A.y)-dy*(p.B.x-p.A.x);
  const t=((x-p.A.x)*dx+(y-p.A.y)*dy)/(length*length);
  if(!length||side*old<=0||Math.abs(side)/length<35||t<.08||t>.92)return false;
  Object.assign(p.B,{x,y});Object.assign(p.D,{x:2*(p.A.x+t*dx)-x,y:2*(p.A.y+t*dy)-y});
 }
 return true;
}
function mount(host,savedTask){
 if(!host||!supported(savedTask)||!root.PathGrade7Construction?.svg)return null;
 let task=clone(savedTask),selected='',built=[],zoom=1,drag=null;
 const original=clone(savedTask),ids=movable(task),elements=task.model.elements||[],constructions=task.model.constructions||[];
 let initial;
 try{initial=root.PathGrade7Construction.svg(task);}catch{return null;}
 host.innerHTML=`<section class="panel assignment-geometry teaching-section" aria-label="Интерактивный чертёж к заданию"><p class="eyebrow">ИССЛЕДУЙ РИСУНОК</p><h2>Чертёж перед тобой</h2><p>${E(task.q)}</p><p>${ids.length?'Потяни за оранжевую точку. Связанная точка переместится вместе с ней: равенства из условия сохранятся.':'Нажми на точку, сторону или угол — элемент выделится на рисунке.'}</p><div class="assignment-geometry-toolbar"><button type="button" data-geometry-zoom="in" aria-label="Увеличить чертёж">＋</button><output data-geometry-scale aria-live="polite">100%</output><button type="button" data-geometry-zoom="out" aria-label="Уменьшить чертёж">−</button><button type="button" data-geometry-fit>Весь рисунок</button><button type="button" data-geometry-reset>Вернуть исходный рисунок</button></div><div class="assignment-geometry-viewport" data-geometry-drawing>${initial}</div><label class="assignment-geometry-picker">Выделить элемент<select data-geometry-select><option value="">Весь рисунок</option>${elements.map(e=>`<option value="${E(e.id)}">${E(e.label)}</option>`).join('')}</select></label><p class="assignment-geometry-read" data-geometry-read role="status"></p>${ids.length?`<fieldset class="assignment-geometry-move"><legend>Перемещение кнопками</legend><label>Подвижная точка<select data-geometry-point>${ids.map(id=>`<option>${E(id)}</option>`).join('')}</select></label><div class="assignment-geometry-toolbar">${[['left','←','Влево'],['up','↑','Вверх'],['down','↓','Вниз'],['right','→','Вправо']].map(([id,icon,label])=>`<button type="button" data-geometry-move="${id}" aria-label="${label}">${icon}</button>`).join('')}</div><p class="teaching-muted">Можно использовать Tab и Enter. Если точка достигла границы или треугольник почти выпрямился, двигай её в другую сторону.</p></fieldset>`:''}${constructions.length?`<details><summary>Добавить линии</summary><div class="assignment-geometry-toolbar">${constructions.map(c=>`<button type="button" data-geometry-build="${E(c.id)}" aria-pressed="false">${E(c.label)}</button>`).join('')}</div></details>`:''}<details><summary>Как читать отметки</summary><p>Одинаковые штрихи отмечают равные отрезки, одинаковые сплошные дуги — равные углы. Пунктирная дуга только показывает угол. Квадратик со сплошными сторонами обозначает прямой угол. Данные берём из условия, а не из размеров на экране.</p></details><p class="teaching-muted">${ids.length?'Движение точек помогает заметить закономерность. В тетради всё равно нужно доказательство.':'Масштаб и выделение помогают рассмотреть условие. Ответы записывай в тренажёре или тетради.'} При повторном открытии рисунок вернётся в исходное положение.</p></section>`;
 const $=selector=>host.querySelector(selector),drawing=$('[data-geometry-drawing]'),picker=$('[data-geometry-select]'),read=$('[data-geometry-read]');
 const base=drawing.querySelector('svg').getAttribute('viewBox').split(/\s+/).map(Number);
 const listeners=[];
 function on(node,event,fn){node.addEventListener(event,fn);listeners.push(()=>node.removeEventListener(event,fn));}
 function draw(){
  drawing.innerHTML=root.PathGrade7Construction.svg(task,selected,built);
  const svg=drawing.querySelector('svg'),[x,y,w,h]=base;
  svg.setAttribute('viewBox',`${x+(w-w/zoom)/2} ${y+(h-h/zoom)/2} ${w/zoom} ${h/zoom}`);
  svg.style.maxWidth='none';svg.style.height='100%';
  for(const id of ids){
   const group=[...svg.querySelectorAll('[data-core-part]')].find(g=>g.getAttribute('data-core-part')===id);
   group?.classList.add('assignment-geometry-handle');
  }
  picker.value=selected;
  read.textContent=elements.find(e=>e.id===selected)?.description||task.model.diagram.description||'';
  $('[data-geometry-scale]').textContent=Math.round(zoom*100)+'%';
  $('[data-geometry-zoom="in"]').disabled=zoom>=2;
  $('[data-geometry-zoom="out"]').disabled=zoom<=1;
  host.querySelectorAll('[data-geometry-build]').forEach(b=>b.setAttribute('aria-pressed',String(built.includes(b.dataset.geometryBuild))));
 }
 function moveInside(id,x,y){
  const next=clone(task);
  if(!move(next,id,x,y))return false;
  const [bx,by,w,h]=base;
  if(Object.values(next.model.diagram.points).some(p=>p.x<bx+35||p.x>bx+w-35||p.y<by+35||p.y>by+h-35))return false;
  task=next;selected=id;draw();return true;
 }
 on(picker,'change',()=>{selected=picker.value;draw();});
 host.querySelectorAll('[data-geometry-zoom]').forEach(b=>on(b,'click',()=>{zoom=Math.max(1,Math.min(2,zoom+(b.dataset.geometryZoom==='in'?.25:-.25)));draw();}));
 on($('[data-geometry-fit]'),'click',()=>{zoom=1;draw();});
 on($('[data-geometry-reset]'),'click',()=>{task=clone(original);selected='';built=[];zoom=1;drag=null;draw();});
 host.querySelectorAll('[data-geometry-build]').forEach(b=>on(b,'click',()=>{const id=b.dataset.geometryBuild;built=built.includes(id)?built.filter(x=>x!==id):[...built,id];draw();}));
 host.querySelectorAll('[data-geometry-move]').forEach(b=>on(b,'click',()=>{
  const id=$('[data-geometry-point]').value,p=task.model.diagram.points[id],delta={left:[-10,0],right:[10,0],up:[0,-10],down:[0,10]}[b.dataset.geometryMove];
  if(!moveInside(id,p.x+delta[0],p.y+delta[1]))read.textContent='Здесь точка остановилась. Попробуй другое направление: условие и треугольник должны сохраниться.';
 }));
 on(drawing,'click',event=>{const id=event.target.closest('[data-core-part]')?.getAttribute('data-core-part');if(elements.some(e=>e.id===id)){selected=id;draw();}});
 on(drawing,'pointerdown',event=>{
  if(event.button!==0||drag)return;
  const id=event.target.closest('[data-core-part]')?.getAttribute('data-core-part');
  if(!ids.includes(id))return;
  drag={id,pointer:event.pointerId};drawing.setPointerCapture(event.pointerId);event.preventDefault();
 });
 on(drawing,'pointermove',event=>{
  if(!drag||drag.pointer!==event.pointerId)return;
  const svg=drawing.querySelector('svg'),matrix=svg.getScreenCTM();if(!matrix)return;
  const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
  const local=point.matrixTransform(matrix.inverse());moveInside(drag.id,local.x,local.y);
 });
 const release=event=>{if(drag?.pointer===event.pointerId){drag=null;if(drawing.hasPointerCapture(event.pointerId))drawing.releasePointerCapture(event.pointerId);}};
 on(drawing,'pointerup',release);on(drawing,'pointercancel',release);on(drawing,'lostpointercapture',()=>{drag=null;});
 draw();return ()=>{listeners.forEach(remove=>remove());host.replaceChildren();};
}
const api=Object.freeze({supported,movable,move,mount});root.LearningAssignmentGeometry=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis==='undefined'?this:globalThis);
