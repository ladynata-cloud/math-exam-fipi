/* Task-bound elementary models. Only semantic selection and opened explanations
 * travel through the existing managed-attempt contract. */
(function(root){'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(Number(x).toFixed(3)),green='#246954',orange='#b54527',light='#dcece3';
const text=(x,y,s,extra='')=>`<text x="${n(x)}" y="${n(y)}" fill="#173d32" font-size="20" ${extra.includes('text-anchor=')?'':'text-anchor="middle"'} font-family="system-ui,sans-serif" ${extra}>${E(s)}</text>`;
const pretty=x=>String(n(x)).replace('.',',').replace('-','−');
function drawing(task,selected=null){
 const d=task.model.diagram;
 if(d.type==='table')return `<div style="overflow-x:auto"><table class="pre7-place-table" style="width:100%;border-collapse:collapse;text-align:center"><thead><tr>${d.headers.map(s=>`<th scope="col" style="padding:10px;border:1px solid #c5d8cc">${E(s)}</th>`).join('')}</tr></thead><tbody>${d.rows.map((row,r)=>`<tr>${row.map((s,c)=>`<td data-pre7-part="cell-${r}-${c}" style="padding:12px;border:1px solid #c5d8cc;font-size:1.15rem;${selected===`cell-${r}-${c}`||selected===d.rowIds?.[r]?'background:#ffe4cd;box-shadow:inset 0 0 0 2px #b54527;':''}">${E(s)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 let body='',height=270;
 if(d.type==='line'){
  const X=v=>45+(v-d.min)/(d.max-d.min)*510;
  body=`<path d="M45 145H555" stroke="${green}" stroke-width="3"/>`;
  for(let i=0;i<=d.intervals;i++){const value=d.min+(d.max-d.min)*i/d.intervals,x=X(value);body+=`<path d="M${n(x)} 137V153" stroke="${green}" stroke-width="2"/>`;const label=Array.isArray(d.tickLabels)?d.tickLabels[i]:(i===0||i===d.intervals?pretty(value):null);if(label!==null&&label!==undefined&&label!=='')body+=text(x,181,label);}
  for(const p of d.points){const x=X(p.value),active=selected===p.id;body+=`<g data-pre7-part="${E(p.id)}"><circle cx="${n(x)}" cy="145" r="${active?10:6}" fill="${active?orange:green}"/>${text(x,100,p.label,(x<90?'text-anchor="start"':x>510?'text-anchor="end"':'')+(active?' font-weight="700"':''))}</g>`;}
  body+=text(300,228,d.unit||'Равные промежутки на шкале');
 }else if(d.type==='bars'){
  height=80+d.bars.length*90;
  d.bars.forEach((b,i)=>{
   const y=50+i*90,width=480*b.value/b.total,active=selected===b.id;
   body+=text(60,y-12,b.label,'text-anchor="start"');
   body+=`<g data-pre7-part="${E(b.id)}"><rect x="60" y="${y}" width="480" height="34" rx="4" fill="#f3f7f2" stroke="${green}"/><rect x="60" y="${y}" width="${n(width)}" height="34" rx="4" fill="${active?orange:light}" stroke="${active?orange:green}" stroke-width="${active?3:1}"/>`;
   if(b.parts)for(let j=1;j<b.parts;j++)body+=`<path d="M${n(60+480*j/b.parts)} ${y}v34" stroke="${green}"/>`;
   body+='</g>';
  });
  if(d.unit)body+=text(300,height-12,d.unit);
 }else if(d.type==='grid'){
  const size=Math.min(40,480/d.cols,240/d.rows),x=(600-d.cols*size)/2,y=36;
  height=90+d.rows*size;
  for(let r=0;r<d.rows;r++)for(let c=0;c<d.cols;c++){
   const absent=d.cutout&&c>=d.cutout.x&&c<d.cutout.x+d.cutout.w&&r>=d.cutout.y&&r<d.cutout.y+d.cutout.h;
   const active=selected===(absent?'cutout':'row-'+r);
   body+=`<rect data-pre7-part="${absent?'cutout':'row-'+r}" x="${n(x+c*size)}" y="${n(y+r*size)}" width="${n(size)}" height="${n(size)}" fill="${absent?(active?'#ffe4cd':'#fff'):(active?orange:light)}" stroke="${green}"${absent?' stroke-dasharray="3 3"':''}/>`;
  }
  body+=text(300,height-15,d.unit||'Одна клетка — одна квадратная единица');
 }else if(d.type==='boundary'){
  const points=d.sides.length===3?[[110,210],[490,210],[300,55]]:[[110,65],[490,65],[490,210],[110,210]];
  const midpoints=d.sides.length===3?[[300,242],[420,123],[180,123]]:[[300,45],[529,145],[300,242],[70,145]];
  body+=`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="#f2f7f1"/>`;
  d.sides.forEach((value,i)=>{const a=points[i],b=points[(i+1)%points.length],active=selected==='side-'+i;body+=`<path data-pre7-part="side-${i}" d="M${a.join(' ')}L${b.join(' ')}" stroke="${active?orange:green}" stroke-width="${active?7:3}"/>${text(...midpoints[i],d.labels?.[i]??pretty(value)+(d.unit?' '+d.unit:''),active?'font-weight="700"':'')}`;});
 }else return '';
 return `<svg class="task-figure pre7-figure" viewBox="0 0 600 ${n(height)}" role="img" aria-label="${E(d.description)}" style="display:block;width:100%;max-width:640px;height:auto;margin:auto;background:#fbfdf9;border-radius:16px">${body}</svg>`;
}
function visual(task){return drawing(task)+`<p class="muted">${E(task.model.diagram.description)}</p>`;}
function mount(host,task,options={}){
 const session=root.PathModels.session(host,'pre7-lab',options),state=session.value,elements=task.model.elements;
 state.selected=elements.some(x=>x.id===state.selected)?state.selected:null;
 state.revealed=Number.isInteger(state.revealed)?Math.max(0,Math.min(task.steps.length,state.revealed)):0;
 let readOnly=!!options.readOnly;
 const locked=()=>readOnly||host.inert||!!host.closest('[inert]');
 host.innerHTML=`<p>Выбери часть модели кнопкой: она выделится на рисунке. Числа здесь те же, что в твоём задании.</p><div data-pre7-drawing></div><div class="actions" role="group" aria-label="Исследовать модель">${elements.map(x=>`<button type="button" data-pre7-select="${E(x.id)}" aria-pressed="false">${E(x.label)}</button>`).join('')}<button type="button" data-pre7-clear>Снять выделение</button></div><p data-pre7-read role="status"></p><div class="actions"><button type="button" data-pre7-next>Открыть следующий шаг</button><button type="button" data-pre7-reset>Скрыть подсказки</button></div><ol data-pre7-steps aria-label="Шаги объяснения" aria-live="polite"></ol><p class="muted">После разбора попробуй новый вариант самостоятельно.</p>`;
 function draw(){
  host.querySelector('[data-pre7-drawing]').innerHTML=drawing(task,state.selected);
  host.querySelectorAll('[data-pre7-select]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.pre7Select===state.selected));button.disabled=locked();});
  host.querySelector('[data-pre7-read]').textContent=elements.find(x=>x.id===state.selected)?.description||task.model.diagram.description;
  host.querySelector('[data-pre7-steps]').innerHTML=task.steps.slice(0,state.revealed).map(step=>`<li><p>${E(step.why)}</p></li>`).join('');
  host.querySelector('[data-pre7-next]').disabled=locked()||state.revealed>=task.steps.length;
  host.querySelector('[data-pre7-reset]').disabled=locked()||state.revealed===0;
  host.querySelector('[data-pre7-clear]').disabled=locked()||state.selected===null;
 }
 const mutate=fn=>{if(locked())return;fn();draw();session.changed();};
 host.querySelectorAll('[data-pre7-select]').forEach(button=>button.onclick=()=>mutate(()=>{state.selected=button.dataset.pre7Select;}));
 host.querySelector('[data-pre7-next]').onclick=()=>mutate(()=>{state.revealed=Math.min(task.steps.length,state.revealed+1);});
 host.querySelector('[data-pre7-reset]').onclick=()=>mutate(()=>{state.revealed=0;});
 host.querySelector('[data-pre7-clear]').onclick=()=>mutate(()=>{state.selected=null;});
 session.setReadOnly=value=>{readOnly=!!value;draw();};draw();return session;
}
root.PathPre7Models={drawing,visual,mount};
if(root.PathModels){const previous=root.PathModels.mount;root.PathModels.mount=(host,task,options={})=>task.model?.kind==='pre7-lab'?mount(host,task,options):previous(host,task,options);}
if(typeof module!=='undefined')module.exports=root.PathPre7Models;
})(typeof window==='undefined'?globalThis:window);
