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
 if(options.native){const details=el('details',null,'pv-native-help pm-details'),summary=el('summary','Помочь с числами из условия?'),content=el('div',null,'pm-content');details.append(summary,content);let built=false;if(global.OgeCourseSharedMode){append(content,options.native());built=true;}details.addEventListener('toggle',()=>{if(details.open&&!built){append(content,options.native());built=true;}});const back=panel.querySelector('.pd-return');back?back.before(details):panel.append(details);}
 toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.textContent=panel.hidden?'Хочешь подсказку?':'Убрать подсказку';toggle.setAttribute('aria-expanded',String(!panel.hidden));});
 wrap.append(toggle,panel);return wrap;
}
function question(options){
 const card=el('article',null,'pv-question');card.id='pv-question-'+String(options.id||++serial).replace(/[^\w-]/g,'-');card.dataset.question=String(options.number);card.dataset.taskId=String(options.id||'');
 const heading=el('h2',String(options.number)+'. '+(options.title||'Задание'));card.append(heading);
 const condition=el('div',null,'pv-question-condition');append(condition,options.condition);card.append(condition);prepareFigures(condition);
 if(!global.OgeCourseSharedMode&&options.page==='stoves')enhanceQuestionDiagram(condition);
 const form=el('form',null,'pv-answer-form'),fields=new Map(),requiredFields=new Set();
 for(const spec of options.fields||[]){const label=el('label',null,'pv-field');label.append(el('span',spec.label||'Запиши ответ.'));let input;
  if(spec.options){input=el('select');for(const entry of spec.options){const option=el('option',Array.isArray(entry)?entry[1]:typeof entry==='object'?entry.label:entry);option.value=String(Array.isArray(entry)?entry[0]:typeof entry==='object'?entry.value:entry);input.append(option);}}
  else{input=el(spec.type==='textarea'?'textarea':'input');if(input.tagName==='INPUT'){input.type=spec.type==='number'?'text':(spec.type||'text');input.inputMode=spec.inputMode||'decimal';}input.autocomplete='off';if(global.OgeCourseSharedMode)input.maxLength=100;}
  input.dataset.pvField=spec.key;input.name=spec.key;input.value=spec.value??'';input.setAttribute('aria-label',spec.label||'Ответ');if(spec.placeholder)input.placeholder=spec.placeholder;
  if(spec.required!==false){requiredFields.add(input);input.setAttribute('aria-required','true');}
  fields.set(spec.key,input);label.append(input);form.append(label);
 }
 const values=()=>Object.fromEntries([...fields].map(([key,input])=>[key,input.value]));
 const cleanDraft=input=>{if(global.OgeCourseSharedMode)input.value=input.value.replace(/[<>\u0000-\u001f]/g,'').slice(0,100);};
 for(const input of fields.values()){input.addEventListener('input',()=>{if(!locked){cleanDraft(input);input.removeAttribute('aria-invalid');lastCheck=false;feedback.replaceChildren();card.dataset.result='';options.onDraft?.(values());}});input.addEventListener('change',()=>{if(!locked){cleanDraft(input);input.removeAttribute('aria-invalid');lastCheck=false;feedback.replaceChildren();card.dataset.result='';options.onDraft?.(values());}});}
 const check=el('button','Проверить ответ','pv-check');check.type='submit';
 const feedback=el('div',null,'pv-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
 let locked=false,lastCheck=!!options.status,helpUsed=false;
 function show(result){if(!result)return;feedback.replaceChildren();result.html?append(feedback,result.html):feedback.append(doc.createTextNode(result.message||''));feedback.classList.toggle('pv-correct',result.ok===true);feedback.classList.toggle('pv-incorrect',result.ok===false);card.dataset.result=result.ok===true?'correct':result.ok===false?'incorrect':'';if(result.locked||result.ok===true){locked=true;for(const input of fields.values())input.disabled=true;check.disabled=true;}}
 show(typeof options.status==='object'?options.status:options.status?{ok:true,message:'Ответ уже проверен.'}:null);
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(locked)return;
  for(const input of fields.values())input.removeAttribute('aria-invalid');
  const missing=Array.from(requiredFields).find(input=>!input.value.trim());
  if(missing){
   lastCheck=false;
   missing.setAttribute('aria-invalid','true');
   const label=missing.getAttribute('aria-label')||'Ответ';
   show({message:(missing.tagName==='SELECT'?'Выбери значение в поле «':'Заполни поле «')+label+'».'});
   missing.focus();return;
  }
  check.disabled=true;
  try{lastCheck=true;const result=await options.check(values());show(result);}
  catch(error){feedback.textContent='Не удалось проверить ответ. Попробуй ещё раз.';global.console.error(error);}
  finally{check.disabled=locked;if(!locked)check.focus();else{feedback.tabIndex=-1;feedback.focus();}}
 });
 form.append(check,feedback);card.append(form);
 const assistance=help({page:options.page||doc.body.dataset.practicalPage,type:options.helpType,text:condition.textContent,steps:options.helpSteps,native:options.helpNative});card.append(assistance);
 assistance.addEventListener('click',()=>{helpUsed=true;},true);assistance.addEventListener('input',()=>{helpUsed=true;},true);assistance.addEventListener('toggle',()=>{if(assistance.querySelector('details[open]'))helpUsed=true;},true);
 card.__practicalQuestion={options,fields,values,capture:()=>({answers:values(),checked:lastCheck,helpUsed,helpOpen:!assistance.querySelector('.pv-help-panel').hidden,details:Array.from(assistance.querySelectorAll('details')).map(d=>d.open),model:global.PracticalDiscovery.captureState(assistance.querySelector('.pv-help-panel')),zoom:Array.from(card.querySelectorAll('.pv-zoom')).map(b=>b.getAttribute('aria-pressed')==='true')}),restore:value=>{
  for(const [key,input]of fields){input.value=value.answers[key];}options.onDraft?.(values());
  if(value.checked){const result=options.check(values());if(result&&typeof result.then==='function')throw new TypeError('Synchronous practical checker required');show(result);lastCheck=true;}
  const panel=assistance.querySelector('.pv-help-panel');if(value.helpOpen!==!panel.hidden)assistance.querySelector('.pv-help-button').click();
  let ds=Array.from(assistance.querySelectorAll('details'));const native=assistance.querySelector('.pv-native-help');if(native&&value.details.length>ds.length){native.open=true;native.dispatchEvent(new Event('toggle'));}for(let i=0;i<value.details.length;i++){ds=Array.from(assistance.querySelectorAll('details'));if(ds[i]){ds[i].open=value.details[i];ds[i].dispatchEvent(new Event('toggle'));}}
  global.PracticalDiscovery.applyState(panel,value.model);Array.from(card.querySelectorAll('.pv-zoom')).forEach((b,i)=>{if((b.getAttribute('aria-pressed')==='true')!==!!value.zoom[i])b.click();});helpUsed=value.helpUsed;
 }};
 return card;
}
function prepareFigures(host){
 for(const svg of host.querySelectorAll('svg')){
  let wrap=svg.closest('.pv-figure-scroll');
  if(wrap?.dataset.pvFigureReady==='1')continue;
  if(!wrap){wrap=el('div',null,'pv-figure-scroll');svg.before(wrap);wrap.append(svg);}
  wrap.dataset.pvFigureReady='1';wrap.tabIndex=0;wrap.setAttribute('role','region');if(!wrap.hasAttribute('aria-label'))wrap.setAttribute('aria-label',svg.getAttribute('aria-label')||'Рисунок к условию');
  const zoom=el('button','Увеличить рисунок','pv-zoom');zoom.type='button';zoom.setAttribute('aria-pressed','false');const note=el('p','Рисунок можно прокручивать вправо и влево.','pv-scroll-note');
  zoom.addEventListener('click',()=>{const large=zoom.getAttribute('aria-pressed')!=='true';wrap.classList.toggle('pv-figure-large',large);zoom.setAttribute('aria-pressed',String(large));zoom.textContent=large?'Уменьшить рисунок':'Увеличить рисунок';});wrap.after(zoom);if(!wrap.parentElement.querySelector('.pv-scroll-note'))zoom.after(note);
 }
 for(const table of host.querySelectorAll('table')){if(table.closest('.pv-table-scroll'))continue;const wrap=el('div',null,'pv-table-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Таблица: можно прокручивать по горизонтали');table.before(wrap);wrap.append(table);}
}

// Neutral drawing tools: never select the correct answer, evaluate an
// exercise, or change the help/progress/board protocol. Standalone only.

function enhanceQuestionDiagram(host){
 const svg=host.querySelector('svg.pv-arc-diagram,svg.pv-room-diagram');if(!svg||svg.dataset.pvPartsReady)return;
 const arc=svg.classList.contains('pv-arc-diagram'),attr=arc?'data-pv-arc-part':'data-pv-room-face';
 const parts=Array.from(svg.querySelectorAll('['+attr+']'));if(!parts.length)return;
 const wrap=el('div',null,'pv-part-controls');wrap.setAttribute('aria-label',arc?'Рассмотри элементы арки':'Рассмотри части помещения');
 wrap.append(el('p',arc?'Рассмотри отдельно хорду, высоту и радиусы.':'Рассмотри отдельно пол и стены.'));
 const buttons=el('div',null,'pv-explore-controls');const options=arc?[['all','Весь рисунок'],['chord','Хорда'],['height','Высота'],['radius','Радиус']]:[['all','Всё помещение'],['floor','Пол'],['wall','Стены']];
 const controls=options.map(([value,label])=>{const b=el('button',label);b.type='button';b.setAttribute('aria-pressed',String(value==='all'));
  b.addEventListener('click',()=>{parts.forEach(part=>{const yes=value==='all'||part.getAttribute(attr).split(' ').includes(value);part.classList.toggle('pv-part-muted',!yes);part.classList.toggle('pv-part-active',value!=='all'&&yes);});controls.forEach(btn=>btn.setAttribute('aria-pressed',String(btn===b)));});buttons.append(b);return b;});
 wrap.append(buttons);host.append(wrap);svg.dataset.pvPartsReady='1';
}

function enhancePrimaryVisual(host,page){
 const svg=host.querySelector('svg');if(!svg||host.dataset.pvExploreReady)return;
 const ns='http://www.w3.org/2000/svg';
 const S=(tag,attrs={},content)=>{const n=doc.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(content!=null)n.textContent=content;return n;};
 const panel=el('section',null,'pv-explore');panel.setAttribute('aria-label','Исследуй рисунок');
 const title=el('h3','Исследуй рисунок');const note=el('p');const controls=el('div',null,'pv-explore-controls');const status=el('p',null,'pv-explore-status');status.setAttribute('role','status');
 const button=(label,action)=>{const b=el('button',label);b.type='button';b.addEventListener('click',action);controls.append(b);return b;};
 const clear=()=>{for(const n of svg.querySelectorAll('[data-pv-explore-mark]'))n.remove();for(const n of svg.querySelectorAll('[data-pv-explore-choice]'))n.setAttribute('aria-pressed','false');};
 const overlay=S('g',{'aria-hidden':'true','pointer-events':'none','data-pv-explore-overlay':'1'});svg.append(overlay);
 if(page==='roads-grid'||page==='roads-schema'){
  note.textContent='Нажимай на участки дороги, чтобы отмечать свой маршрут. Можно выбрать любой путь. Повторное нажатие снимает отметку.';
  const lines=Array.from(svg.querySelectorAll('line[stroke-linecap="round"]')).filter(n=>Number(n.getAttribute('stroke-width'))>=3);
  for(const [i,line] of lines.entries()){
   const hit=line.cloneNode(false);hit.removeAttribute('stroke-dasharray');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','20');hit.setAttribute('role','button');hit.setAttribute('tabindex','0');hit.setAttribute('aria-label','Участок дороги '+(i+1));hit.setAttribute('aria-pressed','false');hit.setAttribute('data-pv-explore-choice',String(i));line.after(hit);
   const toggle=()=>{const prev=overlay.querySelector('[data-pv-explore-mark="'+i+'"]');if(prev){prev.remove();hit.setAttribute('aria-pressed','false');}else{const mark=line.cloneNode(false);mark.setAttribute('stroke','#b45309');mark.setAttribute('stroke-width','7');mark.setAttribute('stroke-opacity','.9');mark.setAttribute('data-pv-explore-mark',String(i));overlay.append(mark);hit.setAttribute('aria-pressed','true');}status.textContent='Маршрут отмечен тобой, без проверки.';};
   hit.addEventListener('click',toggle);hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
  }
  if(!lines.length){overlay.remove();return;}svg.setAttribute('role','group');
  // Keep the number badges and the right-angle mark above the coloured route.
  const foreground=Array.from(svg.children).find(n=>n.matches('path,g[data-pv-town],circle,text'));if(foreground)svg.insertBefore(overlay,foreground);
  button('Очистить маршрут',()=>{clear();status.textContent='Отметки сняты.';});
 }else if(page==='apartments'||page==='land-plots'){
  const apt=page==='apartments',step=apt?24:28,ox=apt?54:14,oy=apt?32:14;
  const rooms=apt?Array.from(svg.querySelectorAll(':scope>rect')).map(n=>({x:+n.getAttribute('x'),y:+n.getAttribute('y'),w:+n.getAttribute('width'),h:+n.getAttribute('height')})).filter(r=>r.w>0&&r.h>0):[];
  note.textContent='Отмечай клетки на плане двумя цветными карандашами: например, два разных помещения или части одной фигуры. Повторное нажатие того же цвета убирает отметку.';
  const palette=[['Янтарный','#f59e0b','#b45309'],['Синий','#60a5fa','#1d4ed8']];let activeColor=0;
  const pencils=palette.map(([name],i)=>{const b=button(name+' карандаш',()=>{activeColor=i;pencils.forEach((p,j)=>p.setAttribute('aria-pressed',String(i===j)));});b.dataset.pvPencil=String(i);b.setAttribute('aria-pressed',String(i===0));return b;});
  const cells=new Map(),inside=(x,y)=>apt?rooms.some(r=>x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h):x>=14&&x<434&&y>=14&&y<294;
  const toggleCell=(x,y)=>{const X=ox+Math.floor((x-ox)/step)*step,Y=oy+Math.floor((y-oy)/step)*step;if(!inside(X+step/2,Y+step/2)){status.textContent='Эта клетка находится вне плана.';return;}const key=X+','+Y;const previous=cells.get(key);if(previous){previous.remove();cells.delete(key);}if(!previous||previous.dataset.pvColor!==String(activeColor)){const [,fill,stroke]=palette[activeColor],mark=S('rect',{x:X+1,y:Y+1,width:step-2,height:step-2,fill,'fill-opacity':'.28',stroke,'stroke-width':'1.7','data-pv-explore-mark':key,'data-pv-color':activeColor});overlay.append(mark);cells.set(key,mark);}status.textContent='Клетки отмечены вручную.';};
  svg.addEventListener('click',e=>{if(typeof svg.createSVGPoint!=='function'||!svg.getScreenCTM())return;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const pos=p.matrixTransform(svg.getScreenCTM().inverse());toggleCell(pos.x,pos.y);});
  // Keyboard alternative: select the cell by row and column, not by its answer.
  const choices=el('div',null,'pv-explore-coordinates');const labels=['Строка клетки','Столбец клетки'];const fields=labels.map((label,i)=>{const wrap=el('label',label);const input=el('select');input.setAttribute('aria-label',label);const max=apt?Math.ceil((Number(svg.getAttribute('viewBox').split(/\s+/)[i===0?3:2])-(i===0?oy:ox)*2)/step):i===0?10:15;for(let n=1;n<=Math.max(1,max);n++){const opt=el('option',String(n));opt.value=String(n);input.append(opt);}wrap.append(input);choices.append(wrap);return input;});controls.append(choices);
  button('Отметить клетку',()=>toggleCell(ox+(+fields[1].value-.5)*step,oy+(+fields[0].value-.5)*step));
  button('Очистить отметки',()=>{clear();cells.clear();status.textContent='Отметки сняты.';});
 }else if(page==='tariffs'){
  note.textContent='Выбирай месяц. Вертикальная линия отмечает месяц. Синяя сплошная направляющая ведёт к шкале минут слева; фиолетовая пунктирная — к шкале гигабайтов справа. Значения считывай самостоятельно.';
  const points=Array.from(svg.querySelectorAll('polyline')).slice(0,2).map(n=>(n.getAttribute('points')||'').trim().split(/\s+/).map(p=>p.split(',').map(Number)));
  if(points.length!==2||points.some(p=>p.length!==12||p.some(q=>q.length!==2||q.some(v=>!Number.isFinite(v))))){overlay.remove();return;}
  const label=el('label','Месяц');const sel=el('select');sel.setAttribute('aria-label','Месяц для чтения графика');
  for(let i=1;i<=12;i++){const opt=el('option',String(i));opt.value=String(i);sel.append(opt);}label.append(sel);controls.append(label);
  function draw(){clear();const i=+sel.value-1;const x=points[0][i][0];overlay.append(S('line',{x1:x,x2:x,y1:18,y2:300,stroke:'#b45309','stroke-width':2,'stroke-dasharray':'5 4','data-pv-explore-mark':'month'}));points.forEach((p,j)=>{const [cx,cy]=p[i],color=j?'#7e22ce':'#1d4ed8';const attrs={x1:cx,x2:j?628:54,y1:cy,y2:cy,stroke:color,'stroke-width':2.5,'data-pv-explore-mark':'guide-'+j};if(j)attrs['stroke-dasharray']='6 4';overlay.append(S('line',attrs),S('circle',{cx,cy,r:7,fill:'white',stroke:color,'stroke-width':3,'data-pv-explore-mark':String(j)}));});status.textContent='Выбран месяц '+sel.value+'.';}
  sel.addEventListener('change',draw);button('Показать месяц',draw);svg.addEventListener('click',e=>{if(typeof svg.createSVGPoint!=='function'||!svg.getScreenCTM())return;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const pos=p.matrixTransform(svg.getScreenCTM().inverse());if(pos.x<54||pos.x>628||pos.y<18||pos.y>320)return;sel.value=String(1+Math.round((pos.x-54)*11/(628-54)));draw();});button('Убрать линию',()=>{clear();status.textContent='Линия убрана.';});
 }else if(page==='paper-sheets'){
  note.textContent='Разрезай один лист пополам параллельно короткой стороне. Одна половина остаётся на месте, другая становится новым листом. Размеры и площадь находи сам.';
  const pieces=Array.from(svg.querySelectorAll('rect[data-paper-format]'));if(!pieces.length){overlay.remove();return;}
  const x0=Math.min(...pieces.map(n=>+n.getAttribute('x'))),y0=Math.min(...pieces.map(n=>+n.getAttribute('y'))),w0=Math.max(...pieces.map(n=>+n.getAttribute('x')+ +n.getAttribute('width')))-x0,h0=Math.max(...pieces.map(n=>+n.getAttribute('y')+ +n.getAttribute('height')))-y0;
  let stage=0;const cut=button('Разрезать пополам',()=>{if(stage<6)stage++;draw(true);});const back=button('На шаг назад',()=>{if(stage>0)stage--;draw(false);});button('Сначала',()=>{stage=0;draw(false);});
  const detail=el('figure',null,'pv-paper-detail'),caption=el('figcaption','Увеличенный фрагмент · отдельный масштаб'),inset=S('svg',{viewBox:'0 0 320 200',role:'img','aria-label':'Увеличенный лист и две равные половины'});
  detail.append(caption,inset);panel.append(detail);
  const sheet=(target,r,fill,stroke,extra={})=>target.append(S('rect',{x:r.x,y:r.y,width:r.w,height:r.h,fill,stroke,'stroke-width':2,...extra}));
  const sheetLabel=(r,n)=>{if(r.w>=42&&r.h>=32)overlay.append(S('text',{x:r.x+r.w/2,y:r.y+r.h/2+7,'text-anchor':'middle','font-size':22,'font-weight':650,fill:'#173c2d'},'А'+n));};
  function halves(r){const v=r.w>=r.h;return v?[{...r,w:r.w/2},{...r,x:r.x+r.w/2,w:r.w/2}]:[{...r,h:r.h/2},{...r,y:r.y+r.h/2,h:r.h/2}];}
  function cutLine(target,r,animate=false){const v=r.w>=r.h,attrs=v?{x1:r.x+r.w/2,x2:r.x+r.w/2,y1:r.y,y2:r.y+r.h}:{x1:r.x,x2:r.x+r.w,y1:r.y+r.h/2,y2:r.y+r.h/2};target.append(S('line',{...attrs,stroke:'#b45309','stroke-width':2,'stroke-dasharray':'6 4',...(animate?{'class':'pv-cut-new'}:{})}));}
  function draw(animate){overlay.replaceChildren();overlay.append(S('rect',{x:x0-4,y:y0-4,width:w0+8,height:h0+8,fill:'white'}));
   let current={x:x0,y:y0,w:w0,h:h0},previous=current;
   for(let i=1;i<=stage;i++){previous=current;const [left,right]=halves(current);sheet(overlay,left,'#d9eade','#365d48');sheetLabel(left,i);current=right;}
   sheet(overlay,current,'#f9dfad','#b45309',animate?{'class':'pv-cut-new'}:{});if(stage<6)cutLine(overlay,current);sheetLabel(current,stage);
   // At small scales A5/A6 are hard to see. A separately labelled magnifier
   // shows the last division at a readable size, never as the main scale.
   inset.replaceChildren();const source=stage?previous:current,k=Math.min(270/source.w,160/source.h),r={x:(320-source.w*k)/2,y:(200-source.h*k)/2,w:source.w*k,h:source.h*k};
   if(stage){const [left,right]=halves(r);sheet(inset,left,'#d9eade','#365d48');sheet(inset,right,'#f9dfad','#b45309',animate?{'class':'pv-cut-new'}:{});cutLine(inset,r,animate);}else{sheet(inset,r,'#f9dfad','#b45309');cutLine(inset,r);}
   caption.textContent=stage?'А'+(stage-1)+' → две равные половины А'+stage+' (увеличено)':'Лист А0 и линия первого разреза (увеличено)';
   status.textContent='Текущий лист: А'+stage+'. '+(stage<6?'Пунктир — следующий разрез.':'Последовательность завершена.');cut.disabled=stage===6;back.disabled=stage===0;
  }draw(false);
 }else if(page==='stoves'){
  note.textContent='Посмотри, как четыре стены превращаются в развёртку. Дверь остаётся проёмом, а пол и потолок в развёртку стен не входят.';
  const a=Number(svg.dataset.roomA),b=Number(svg.dataset.roomB),h=Number(svg.dataset.roomH);if(![a,b,h].every(v=>Number.isFinite(v)&&v>0)){overlay.remove();return;}
  enhanceQuestionDiagram(host);
  const netFigure=el('figure',null,'pv-wall-net');netFigure.hidden=true;const net=S('svg',{viewBox:'0 0 420 160',role:'img','aria-label':'Четыре стены парной, разложенные в одну полосу'});net.setAttribute('hidden','');net.hidden=true;
  const key=el('figcaption','Стены чередуются: длина, ширина, длина, ширина. Белый проём — дверь. Масштаб развёртки отдельный.');
  netFigure.append(net,key);
  const scale=Math.min(390/(2*(a+b)),130/h),widths=[a,b,a,b],top=15;let x=15;
  const dw=Number(svg.dataset.roomDoorW||.7),dh=Number(svg.dataset.roomDoorH||1.8);
  const walls=widths.map((width,i)=>{const w=width*scale,H=h*scale;const wall=S('g',{'data-pv-wall':i,'class':'pv-wall-panel','style':'--wall-delay:'+i*110+'ms'});
   wall.append(S('rect',{x,y:top,width:w,height:H,fill:i%2?'#dce7f5':'#c0dfca',stroke:'#29483c','stroke-width':2}));
   if(i===0&&dw>0&&dh>0&&dw<=width&&dh<=h)wall.append(S('rect',{x:x+Math.min(w*.18,w-dw*scale),y:top+H-dh*scale,width:dw*scale,height:dh*scale,fill:'white',stroke:'#29483c','stroke-width':2,'data-pv-door':'1'}));
   net.append(wall);x+=w;return wall;});
  const focus=el('div',null,'pv-wall-focus');const focusLabel=el('label','Рассмотреть стену');const select=el('select');select.setAttribute('aria-label','Выбрать стену развёртки');
  for(const [value,label] of [['all','Все четыре стены'],['0','1 — длинная, с дверью'],['1','2 — короткая'],['2','3 — длинная'],['3','4 — короткая']]){const opt=el('option',label);opt.value=value;select.append(opt);}focusLabel.append(select);focus.append(focusLabel);netFigure.append(focus);
  select.addEventListener('change',()=>{walls.forEach((wall,i)=>wall.setAttribute('opacity',select.value==='all'||select.value===String(i)?'1':'.23'));status.textContent=select.value==='all'?'Видны все четыре стены.':'Выделена стена '+(Number(select.value)+1)+'.';});
  const toggle=button('Развернуть стены',()=>{const show=netFigure.hidden;netFigure.hidden=!show;net.hidden=!show;net.toggleAttribute('hidden',!show);toggle.setAttribute('aria-pressed',String(show));toggle.textContent=show?'Свернуть развёртку':'Развернуть стены';status.textContent=show?'Четыре стены лежат в одной плоскости.':'Развёртка свёрнута.';});toggle.setAttribute('aria-pressed','false');panel.append(netFigure);
 }else{overlay.remove();return;}
 host.dataset.pvExploreReady='1';panel.prepend(title,note,controls);panel.append(status);host.append(panel);
}

function mount(options){
 const previous=doc.querySelector('.pv-shell');
 const shell=el('main',null,'pv-shell'),nav=el('nav',null,'pv-nav');nav.setAttribute('aria-label','Вернуться к курсу');
 for(const [href,text] of [['index.html','Все сюжеты 1–5'],['../oge-course/','Весь курс ОГЭ']]){const link=el('a',text);link.href=href;nav.append(link);}
 shell.append(nav,el('h1',options.title),el('p',global.OgeCourseSharedMode?'Совместная практика. Ответы и подсказки видны обоим участникам; личные результаты кабинета здесь не изменяются.':'Реши задания по условию. Подсказки открываются рядом с вопросом.','pv-intro'));
 if(options.controls){options.controls.classList.add('pv-controls');shell.append(options.controls);}
 const condition=el('section',null,'pv-condition');condition.setAttribute('aria-label','Общее условие');append(condition,options.condition);shell.append(condition);
 const workspace=el('div',null,'pv-workspace'),reference=el('aside',null,'pv-reference');reference.setAttribute('aria-label','Рисунок и данные варианта');
 const visual=el('div',null,'pv-primary-visual');append(visual,options.visual);reference.append(visual);
 if(options.tables){const tables=el('section',null,'pv-tables');tables.setAttribute('aria-label','Таблицы для решения');append(tables,options.tables);reference.append(tables);}
 const stream=el('section',null,'pv-task-stream');stream.setAttribute('aria-label','Задания варианта');for(const card of options.questions)stream.append(card);
 workspace.append(reference,stream);shell.append(workspace);prepareFigures(reference);
 if(!global.OgeCourseSharedMode)enhancePrimaryVisual(visual,doc.body.dataset.practicalPage);
 for(const root of options.nativeRoots||[]){root.hidden=true;root.inert=true;root.dataset.pvNative='1';}
 previous?previous.replaceWith(shell):doc.body.append(shell);doc.body.classList.add('pv-exam');doc.documentElement.dataset.practicalVariant='ready';doc.documentElement.dataset.practicalMinimal='ready';
 global.PracticalBoard?.changed();
 return shell;
}
function register(page,init){providers.set(page,init);}
function start(){const init=providers.get(doc.body.dataset.practicalPage);if(doc.body.dataset.practicalVariant==='1'&&init)init(global.PracticalVariant);}
global.PracticalVariant={el,html,clone,help,question,mount,register,prepareFigures,enhancePrimaryVisual,enhanceQuestionDiagram};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start);else global.setTimeout(start,0);
})(window);
