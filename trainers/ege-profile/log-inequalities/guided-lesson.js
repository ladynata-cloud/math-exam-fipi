/* Shared guided-lesson runtime. Lesson content and identity are supplied before this script.
 * Standalone persistence and the board bridge retain the existing schema-1 contract. */
(function () {
'use strict';
const config=window.MathExamGuidedLesson;
if(!config||!Array.isArray(config.steps)||!config.steps.length)throw new TypeError('Guided lesson configuration is required');
const steps=config.steps;
const $=id=>document.getElementById(id);
const reportAnswer=typeof config.reportAnswer==='string'?config.reportAnswer:'';
const STORAGE_KEY=config.storageKey;
const embedded=window.parent!==window || new URLSearchParams(location.search).get('groupLesson')==='1';
const listeners=new Set();
const blank=()=>({schema:1,step:0,answers:{},solved:[],helps:[],errors:0,feedback:{kind:'',message:''}});
let state=blank(), observed=null, stale=false, storageUnavailable=false, newer=null;
const clone=v=>JSON.parse(JSON.stringify(v));
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const integer=v=>Number.isInteger(v)&&v>=0&&v<=100000;
const tokens=field=>Array.from({length:field.points.length+1},(_,i)=>'s'+i).concat(field.points.map((_,i)=>'p'+i));
function numeric(v){return typeof v==='string'&&/^[−-]?\d+(?:[.,]\d+)?$/.test(v.trim())?Number(v.trim().replace('−','-').replace(',','.')):NaN;}
function correct(field,value){if(Array.isArray(field.correct))return Array.isArray(value)&&value.length===field.correct.length&&field.correct.every(x=>value.includes(x));return field.kind==='number'?numeric(value)===Number(field.correct):value===field.correct;}
function validate(v){
 if(!plain(v)||v.schema!==1||!Number.isInteger(v.step)||v.step<0||v.step>steps.length||!plain(v.answers)||!Array.isArray(v.solved)||!Array.isArray(v.helps)||!integer(v.errors)||!plain(v.feedback)||!['','good','wrong'].includes(v.feedback.kind)||typeof v.feedback.message!=='string'||v.feedback.message.length>1000)return false;
 if(v.solved.length>steps.length||v.solved.some((q,i)=>q!==i)||v.step>v.solved.length)return false;
 if(new Set(v.helps).size!==v.helps.length||v.helps.some(q=>!Number.isInteger(q)||q<0||q>=steps.length))return false;
 if(Object.keys(v.answers).some(k=>!/^\d+$/.test(k)||Number(k)>=steps.length))return false;
 for(const [key,values]of Object.entries(v.answers)){
  if(!plain(values))return false;const fields=steps[Number(key)].fields;
  for(const [id,value]of Object.entries(values)){
   const field=fields.find(f=>f.id===id);if(!field)return false;
   if(field.kind==='checks'||field.kind==='axis'){const allowed=field.kind==='axis'?tokens(field):field.options.map(o=>o.id);if(!Array.isArray(value)||new Set(value).size!==value.length||value.some(t=>!allowed.includes(t)))return false;}
   else if(typeof value!=='string'||value.length>80||(field.kind==='choice'&&!field.options.some(o=>o.id===value)&&value!==''))return false;
  }
 }
 if(v.solved.some(i=>!steps[i].fields.every(f=>correct(f,v.answers[i]?.[f.id]))))return false;
 return true;
}
function decode(raw){try{const v=JSON.parse(raw);return validate(v)?v:null;}catch(_){return null;}}
function note(s){$('storage-note').textContent=s;$('storage-note').hidden=!s;}
function storageChanged(raw){stale=true;newer=decode(raw);note('В другой вкладке сохранена новая работа. Эта вкладка приостановлена, чтобы её не затереть.');$('load-newer').hidden=!newer;lock();}
function canAct(){if(stale)return false;if(!embedded&&!storageUnavailable){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw!==observed){storageChanged(raw);return false;}}catch(_){storageUnavailable=true;}}return true;}
function changed(){if(!embedded&&!storageUnavailable&&!stale){try{observed=JSON.stringify(state);localStorage.setItem(STORAGE_KEY,observed);}catch(_){storageUnavailable=true;note('Не удалось сохранить работу в браузере. Не закрывайте страницу до завершения; результат можно скачать.');}}listeners.forEach(fn=>fn());saveStatus();}
function saveStatus(){$('save-status').textContent=embedded?'Работа открыта на доске. Сохранением управляет доска.':stale?'Старая вкладка приостановлена.':storageUnavailable?'Автосохранение недоступно в этом браузере.':'Прогресс сохраняется в этом браузере. Можно закрыть страницу и продолжить позже.';}
function applyState(value){if(!validate(value))return false;state=clone(value);render(false);return true;}
function lock(){document.querySelectorAll('#check,#next,#hint,#restart,#restart-confirm').forEach(e=>{e.disabled=stale;});document.querySelectorAll('#exercise input,#exercise button,#previous,#restart,#restart-confirm').forEach(e=>{if(stale)e.disabled=true;});if(stale)document.querySelectorAll('[data-axis]').forEach(e=>e.setAttribute('aria-disabled','true'));saveStatus();}
function el(tag,txt,cls){const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;}
function pointLabel(field,i){return String(field.labels?.[i]??field.points[i]).replace(/-/g,'−');}
function segmentLabel(field,i){return(i===0?'(−∞': '('+pointLabel(field,i-1))+'; '+(i===field.points.length?'+∞)':pointLabel(field,i)+')');}
function axisWidth(field){const count=field.points.length;if(!field.labels)return count<=2?420:Math.max(650,100+(count+1)*70);const labelWidth=Math.max(86,...field.labels.map(label=>String(label).length*10+30));return Math.max(count<=2?420:650,count>=7?1050:0,100+(count+1)*labelWidth);}
function selectionLabel(field,selected){const parts=[];for(let i=0;i<=field.points.length;i++){if(selected.includes('s'+i))parts.push(segmentLabel(field,i));if(i<field.points.length&&selected.includes('p'+i))parts.push('{'+pointLabel(field,i)+'}');}return parts.length?parts.join(' ∪ '):'Пока ничего не отмечено';}
function axisSvg(field,selected,interactive,label){
 const NS='http://www.w3.org/2000/svg', svg=document.createElementNS(NS,'svg');const pts=field.points;const width=axisWidth(field), gap=(width-100)/(pts.length+1);const positions=pts.map((_,i)=>50+(i+1)*gap);const stops=[25,...positions,width-25];
 svg.setAttribute('viewBox','0 0 '+width+' 112');svg.setAttribute('class',pts.length<=2?'small-axis':'');svg.setAttribute('role','group');svg.setAttribute('aria-label',label);
 const add=(tag,attrs,parent=svg)=>{const q=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))q.setAttribute(k,v);parent.append(q);return q;};
 add('line',{x1:20,y1:51,x2:width-18,y2:51,stroke:'#a8bbb2','stroke-width':2});add('path',{d:'M '+(width-27)+' 46 L '+(width-17)+' 51 L '+(width-27)+' 56',fill:'none',stroke:'#71867b','stroke-width':2});
 for(let i=0;i<=pts.length;i++){
  const chosen=selected.includes('s'+i), g=add('g',interactive?{class:'axis-segment',role:'button',tabindex:0,'data-axis':field.id,'data-token':'s'+i,'aria-pressed':chosen,'aria-label':'Промежуток '+segmentLabel(field,i)}:{});
  if(interactive)add('rect',{class:'hit',x:stops[i]+7,y:29,width:Math.max(8,stops[i+1]-stops[i]-14),height:44,fill:'transparent',rx:6},g);
  add('line',{x1:stops[i]+(i===0?0:7),y1:51,x2:stops[i+1]-(i===pts.length?0:7),y2:51,stroke:chosen?'#176f58':'#cbd9d2','stroke-width':chosen?7:4},g);
 }
 for(let i=0;i<pts.length;i++){
  const chosen=selected.includes('p'+i),g=add('g',interactive?{class:'axis-point',role:'button',tabindex:0,'data-axis':field.id,'data-token':'p'+i,'aria-pressed':chosen,'aria-label':'Точка '+pointLabel(field,i)}:{});
  if(interactive)add('rect',{class:'hit',x:positions[i]-22,y:67,width:44,height:44,rx:6,fill:'transparent'},g);
  add('circle',{cx:positions[i],cy:51,r:5,stroke:'#176f58','stroke-width':2,fill:chosen?'#176f58':'white'},g);
  const t=add('text',{x:positions[i],y:93,'text-anchor':'middle',fill:'#203b34','font-size':17,'font-family':'system-ui'},g);t.textContent=pointLabel(field,i);
 }
 return svg;
}
function renderAxis(field,values,disabled){const wrap=el('div',undefined,'axis-block');wrap.append(el('h3',field.label));
 const refs=field.refs||[],scroll=el('div',undefined,'axis-scroll'),stack=el('div',undefined,'axis-stack');
 stack.style.minWidth=(field.labels?axisWidth(field):field.points.length<=2?280:480)+'px';
 for(const ref of refs){stack.append(el('p',ref.label,'axis-help'));stack.append(axisSvg(field,ref.tokens,false,ref.label));}
 if(refs.length)stack.append(el('p','Ваша общая часть','axis-help'));
 stack.append(axisSvg(field,values,!disabled,field.label));scroll.append(stack);wrap.append(scroll);
 const help=el('p','Нажмите на нужные участки линии. Чтобы включить граничную точку, нажмите на число под ней. Пустые точки не входят в решение.','axis-help');wrap.append(help);
 if(field.points.length>2||field.labels)wrap.append(el('p','Расстояния условные. На всех строках одинаковые числа стоят друг под другом. Если ось не помещается, её можно прокрутить вправо.','axis-help'));
 const selected=el('p','Выбрано: '+selectionLabel(field,values),'axis-selection');selected.dataset.selection=field.id;wrap.append(selected);return wrap;}
function renderFields(){const host=$('fields');host.replaceChildren();if(state.step>=steps.length)return;const step=steps[state.step],values=state.answers[state.step]||{},disabled=state.solved.includes(state.step)||stale;let numberGroup=null;
 for(const field of step.fields){if(field.kind==='number'){if(!numberGroup){numberGroup=el('div',undefined,'number-fields');host.append(numberGroup);}const label=el('label',undefined,'number-field');label.append(el('span',field.label));const input=el('input');input.type='text';input.inputMode='text';input.autocomplete='off';input.spellcheck=false;input.dataset.field=field.id;input.value=values[field.id]||'';input.disabled=disabled;input.maxLength=80;label.append(input);numberGroup.append(label);continue;}
 numberGroup=null;if(field.kind==='axis'){host.append(renderAxis(field,values[field.id]||[],disabled));continue;}
 const fs=el('fieldset');fs.disabled=disabled;fs.append(el('legend',field.label));const options=el('div',undefined,'options');
 for(const o of field.options){const label=el('label',undefined,'option'),input=el('input');input.type=field.kind==='checks'?'checkbox':'radio';input.dataset.field=field.id;input.dataset.choice=o.id;input.name=field.id;input.value=o.id;input.checked=field.kind==='checks'?(values[field.id]||[]).includes(o.id):values[field.id]===o.id;const body=el('span',undefined,'option-content');body.innerHTML=o.html;label.append(input,body);options.append(label);}fs.append(options);host.append(fs);
 }
}
function renderNotebook(){const host=$('notebook');host.replaceChildren();$('notebook-empty').hidden=state.solved.length>0;
 for(const i of state.solved){const li=el('li');li.dataset.notebookStep=String(i);li.append(el('h3',(i+1)+'. '+steps[i].title));const body=el('div');body.innerHTML=steps[i].record;li.append(body);host.append(li);}
 $('saved-domain').innerHTML=state.solved.includes(config.domainStepIndex)?'<p class="eyebrow">Сохраняем ОДЗ</p>'+config.solvedDomainHtml:config.initialDomainHtml&&state.solved.includes(config.initialDomainStepIndex)?'<p class="eyebrow">Наша система ОДЗ</p>'+config.initialDomainHtml:'';
}
function report(){return config.title+'\n'+config.reportProblem+'\nПройдено шагов: '+state.solved.length+' из '+steps.length+'\nПодсказки на шагах: '+(state.helps.length?state.helps.map(i=>i+1).join(', '):'не использованы')+'\nПроверок с ошибкой: '+state.errors+'\n'+(state.solved.length===steps.length&&reportAnswer?'Ответ: '+reportAnswer+'\n':'')+'Страница: '+location.href.split('?')[0].split('#')[0];}
function markOverflow(){let wide=false;document.querySelectorAll('#exercise .formula,#exercise .option-content').forEach(e=>{const overflow=e.scrollWidth>e.clientWidth+2;e.classList.toggle('scrollable-formula',overflow);if(overflow){wide=true;e.tabIndex=0;e.setAttribute('aria-describedby','formula-scroll-note');}else{e.removeAttribute('tabindex');e.removeAttribute('aria-describedby');}});$('formula-scroll-note').hidden=!wide;}
window.addEventListener('resize',markOverflow);
function render(focus){const done=state.step===steps.length;$('exercise').hidden=done;$('completion').hidden=!done;$('progress').value=state.solved.length;$('step-count').textContent=done?'Готово':('Шаг '+(state.step+1)+' из '+steps.length);$('phase').textContent=done?'Решение завершено':steps[state.step].phase;$('previous').disabled=state.step===0||stale;
 if(!done){const s=steps[state.step],passed=state.solved.includes(state.step);$('step-title').textContent=s.title;$('explanation').innerHTML=s.body;renderFields();$('check').hidden=passed;$('next').hidden=!passed;$('next').textContent=state.step===steps.length-1?'Завершить разбор →':'Следующий шаг →';$('hint').hidden=passed;$('hint-text').hidden=!state.helps.includes(state.step);$('hint-text').textContent=s.hint;$('feedback').className='feedback '+(passed?'good':state.feedback.kind);$('feedback').textContent=passed?'Верно. Запись добавлена в тетрадь. Можно перейти дальше.':state.feedback.message;}
 else{$('final-answer').innerHTML=config.answerHtml;$('result-status').textContent=state.helps.length?'Разобрано с подсказками. Чтобы проверить себя, решите ещё раз без них.':'Все шаги выполнены без подсказок.';$('report').value=report();}
 renderNotebook();lock();saveStatus();requestAnimationFrame(markOverflow);if(focus){const target=done?$('complete-title'):$('step-title');target.focus({preventScroll:true});$('current').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
}
function changeValue(fieldId,value){if(!canAct()||state.solved.includes(state.step)||state.step>=steps.length)return;state.answers[state.step] ||= {};state.answers[state.step][fieldId]=value;state.feedback={kind:'',message:''};$('feedback').textContent='';changed();}
$('fields').addEventListener('input',event=>{const e=event.target;if(!e.dataset.field||e.type==='radio'||e.type==='checkbox')return;changeValue(e.dataset.field,e.value);});
$('fields').addEventListener('change',event=>{const e=event.target;if(!e.dataset.field)return;if(e.type==='radio')changeValue(e.dataset.field,e.value);else if(e.type==='checkbox'){const prev=state.answers[state.step]?.[e.dataset.field]||[];changeValue(e.dataset.field,e.checked?[...prev,e.value]:prev.filter(x=>x!==e.value));}});
function toggleAxis(event){const target=event.target.closest('[data-axis]');if(!target||!canAct()||state.solved.includes(state.step)||target.getAttribute('aria-disabled')==='true')return;const field=steps[state.step].fields.find(f=>f.id===target.dataset.axis);const value=state.answers[state.step]?.[field.id]||[],token=target.dataset.token;changeValue(field.id,value.includes(token)?value.filter(q=>q!==token):value.concat(token));const active=state.answers[state.step][field.id];target.setAttribute('aria-pressed',String(active.includes(token)));const line=target.querySelector('line'),circle=target.querySelector('circle');if(line){line.setAttribute('stroke',active.includes(token)?'#176f58':'#cbd9d2');line.setAttribute('stroke-width',active.includes(token)?7:4);}if(circle)circle.setAttribute('fill',active.includes(token)?'#176f58':'white');document.querySelector('[data-selection="'+field.id+'"]').textContent='Выбрано: '+selectionLabel(field,active);}
$('fields').addEventListener('click',toggleAxis);$('fields').addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-axis]')){event.preventDefault();toggleAxis(event);}});
$('form').addEventListener('submit',event=>{event.preventDefault();if(!canAct()||state.step>=steps.length||state.solved.includes(state.step))return;const s=steps[state.step],failed=s.fields.filter(f=>!correct(f,state.answers[state.step]?.[f.id]));if(failed.length){state.errors++;state.feedback={kind:'wrong',message:'Пока не совпало. Проверьте: '+failed.map(f=>f.label).join('; ')+'. Можно открыть подсказку.'};}else{state.solved.push(state.step);state.feedback={kind:'good',message:'Верно.'};}changed();render(false);});
$('next').addEventListener('click',()=>{if(!canAct()||!state.solved.includes(state.step))return;state.step++;state.feedback={kind:'',message:''};changed();render(true);});
$('previous').addEventListener('click',()=>{if(!canAct()||state.step===0)return;state.step--;state.feedback={kind:'',message:''};changed();render(true);});
$('hint').addEventListener('click',()=>{if(!canAct()||state.step>=steps.length)return;if(!state.helps.includes(state.step))state.helps.push(state.step);changed();$('hint-text').hidden=false;$('hint-text').textContent=steps[state.step].hint;});
$('restart').addEventListener('click',()=>{if(canAct())$('restart-box').hidden=false;});$('restart-cancel').addEventListener('click',()=>{$('restart-box').hidden=true;});$('restart-confirm').addEventListener('click',()=>{if(!canAct())return;state=blank();$('restart-box').hidden=true;changed();render(true);});
$('copy-report').addEventListener('click',async()=>{$('report').value=report();try{await navigator.clipboard.writeText(report());$('report-note').textContent='Скопировано. Вставьте текст в сообщение учителю.';}catch(_){$('report').parentElement.open=true;$('report').focus();$('report').select();$('report-note').textContent='Автоматическое копирование недоступно. Текст выделен — скопируйте его вручную.';}});
$('download-report').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([report()],{type:'text/plain;charset=utf-8'}));const link=el('a');link.href=url;link.download=config.reportName;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('report-note').textContent='Результат подготовлен для скачивания.';});
$('load-newer').addEventListener('click',()=>{try{const raw=localStorage.getItem(STORAGE_KEY),value=decode(raw);if(!value)return;observed=raw;state=value;stale=false;newer=null;note('');$('load-newer').hidden=true;render(false);}catch(_){note('Не удалось прочитать сохранение. Попробуйте обновить страницу.');}});
window.addEventListener('storage',event=>{if(!embedded&&(event.key===STORAGE_KEY||event.key===null)&&event.newValue!==observed)storageChanged(event.key===null?null:event.newValue);});
if(!embedded){try{observed=localStorage.getItem(STORAGE_KEY);if(observed){const v=decode(observed);if(v)state=v;else{storageUnavailable=true;note('Сохранение этого примера повреждено. Начата новая работа без перезаписи старого сохранения.');}}}catch(_){storageUnavailable=true;note('Браузер не разрешил автосохранение. Решать пример можно; в конце скачайте результат.');}}
$('problem').innerHTML=config.problemHtml;
$('progress').max=steps.length;
document.querySelectorAll('[data-step-total]').forEach(element=>{element.textContent=String(steps.length);});
render(false);
window[config.apiName]=Object.freeze({getState:()=>clone(state),applyState,steps:clone(steps),storageKey:STORAGE_KEY});
if(window.MathExamBoard)window.MathExamBoard.register({id:config.trainerId,version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,getState:()=>clone(state),applyState(value){if(!applyState(value))throw new TypeError('Invalid logarithm lesson state');},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}});
})();
