(function(root){
'use strict';
const DATA=root.PetersonWorkshopData,M=root.PetersonMath;
if(!DATA?.topics?.length||!M)return;
const BOARD=document.body?.dataset.petersonBoard==='parts1-2';
const KEY='mathexam.peterson5.workshop.v1',topics=DATA.topics,byId=Object.fromEntries(topics.map(t=>[t.id,t]));
const cards=Object.fromEntries(topics.flatMap(t=>[t.discovery,...t.practice,...t.check].map(q=>[q.id,q])));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const record=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=v=>typeof v==='string'?v.slice(0,500):'';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let format=v=>esc(v).replace(/\b(\d+)\/(\d+)\b/g,(_,n,d)=>'<span class="fra" aria-label="'+n+' делить на '+d+'"><span>'+n+'</span><span>'+d+'</span></span>').replace(/\n/g,'<br>');
const blank=()=>({version:1,revision:0,entries:{},checks:{},models:{},last:null});
const fresh=()=>({value:'',note:'',attempts:0,first:'',firstWrong:'',accepted:false,aided:BOARD,hints:0,solution:false,showSteps:false,step:0,stepValues:[],modelOpen:false});
let state=blank(),writable=true,warning='',view=null,disposeModel=null,queue=Promise.resolve();
function setValue(value){
 const raw=String(value).trim();
 if(!raw||raw.length>500)return null;
 const parts=raw.split(/[\s,;]+/);
 if(!parts.every(v=>/^\d+$/.test(v)&&Number.isSafeInteger(Number(v))))return null;
 return parts.map(Number);
}
function recognized(value,q){
 if(!String(value).trim())return false;
 if(q.kind==='choice')return q.choices.includes(String(value).trim());
 if(q.kind==='set')return !!setValue(value);
 return !!M.parse(String(value));
}
function check(value,q){
 if(!q||!recognized(value,q))return false;
 if(q.kind==='choice')return String(value).trim()===q.answer;
 if(q.kind==='set'){
  const a=setValue(value),b=setValue(q.answer);
  return new Set(a).size===a.length&&a.length===b.length&&a.every(n=>b.includes(n));
 }
 return M.check(String(value),q.answer,q.answerFormat);
}
function validRoute(hash){
 const m=typeof hash==='string'&&/^#topic\/(p\d{2})\/(discover|practice|check)(?:\/([01]))?$/.exec(hash);
 return m&&own(byId,m[1])?hash:null;
}
function cleanEntry(raw,q){
 const s=fresh();if(!record(raw))return s;
 s.value=text(raw.value);s.note=typeof raw.note==='string'?raw.note.slice(0,BOARD?2000:8000):'';
 s.attempts=Number.isSafeInteger(raw.attempts)?Math.max(0,Math.min(raw.attempts,100000)):0;
 s.first=recognized(text(raw.first),q)?text(raw.first):'';
 s.firstWrong=recognized(text(raw.firstWrong),q)&&!check(text(raw.firstWrong),q)?text(raw.firstWrong):'';
 s.accepted=raw.accepted===true&&check(s.value,q)&&s.attempts>0&&!!s.first;
 s.aided=raw.aided===true;s.hints=Number.isInteger(raw.hints)?Math.max(0,Math.min(raw.hints,2)):0;s.solution=raw.solution===true;s.showSteps=raw.showSteps===true;s.modelOpen=raw.modelOpen===true;
 s.stepValues=(Array.isArray(raw.stepValues)?raw.stepValues:[]).slice(0,q.steps?.length||0).map(text);
 const end=Number.isInteger(raw.step)?Math.max(0,Math.min(raw.step,q.steps?.length||0)):0;
 while(s.step<end&&check(s.stepValues[s.step]||'',q.steps[s.step]))s.step++;
 if(s.hints||s.solution||s.showSteps||s.modelOpen||s.step>0)s.aided=true;
 if(s.accepted&&record(raw.completion)){
  s.completion={aided:raw.completion.aided===true,first:s.first,attempts:s.attempts};
 }
 return s;
}
function cleanModel(raw){
 const out={};if(!record(raw))return out;
 for(const [k,v] of Object.entries(raw).slice(0,30)){
  if(!/^[a-zA-Z][\w-]{0,30}$/.test(k)||['constructor','prototype','__proto__'].includes(k))continue;
  if(typeof v==='boolean'||(typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e7))out[k]=v;
  else if(typeof v==='string')out[k]=v.slice(0,300);
 }return out;
}
function validateState(raw){
 if(!record(raw)||raw.version!==1||!record(raw.entries)||!record(raw.checks))throw Error('Неподдерживаемое сохранение учебного маршрута.');
 const out=blank();out.revision=Number.isSafeInteger(raw.revision)?Math.max(0,raw.revision):0;
 for(const [id,v]of Object.entries(raw.entries))if(own(cards,id)&&!/-check-/.test(id))out.entries[id]=cleanEntry(v,cards[id]);
 for(const [id,v]of Object.entries(raw.checks)){
  if(!own(byId,id)||!record(v))continue;
  const c={answers:{},drafts:{},aided:v.aided===true};
  for(const q of byId[id].check){
   if(record(v.answers)&&own(v.answers,q.id)&&recognized(text(v.answers[q.id]),q))c.answers[q.id]=text(v.answers[q.id]);
   if(!own(c.answers,q.id)&&record(v.drafts)&&own(v.drafts,q.id))c.drafts[q.id]=text(v.drafts[q.id]);
  }out.checks[id]=c;
 }
 if(record(raw.models))for(const [id,v]of Object.entries(raw.models))if(own(byId,id))out.models[id]=cleanModel(v);
 out.last=validRoute(raw.last);return out;
}
function readDisk(){
 const raw=root.localStorage.getItem(KEY);return raw?validateState(JSON.parse(raw)):blank();
}
function announceWarning(message){warning=message;const node=document.getElementById('storage-warning');if(node){node.hidden=false;node.textContent=message;}}
try{if(!BOARD)state=readDisk();}catch(_){writable=false;announceWarning('Не удалось прочитать сохранение нового маршрута. Оно не перезаписано. Текущую работу можно скачать в разделе результатов.');}
function mutate(fn){
 if(BOARD){const result=fn(state);state.revision++;root.dispatchEvent(new CustomEvent('peterson5:change'));return Promise.resolve(result);}
 const run=()=>{
  if(writable){try{if(!BOARD)state=readDisk();}catch(_){writable=false;announceWarning('Сохранение изменилось или повреждено. Оно не перезаписано; скачай текущую работу в результатах.');}}
  const result=fn(state);
  state.revision=Math.min(Number.MAX_SAFE_INTEGER,state.revision+1);
  if(writable){try{root.localStorage.setItem(KEY,JSON.stringify(state));}catch(_){writable=false;announceWarning('Браузер не смог сохранить маршрут. Скачай результаты перед закрытием страницы.');}}
  return result;
 };
 const operation=()=>root.navigator?.locks?.request?root.navigator.locks.request(KEY,run):run();
 const promise=queue.then(operation);queue=promise.catch(err=>{announceWarning('Не удалось сохранить действие. Введённая работа остаётся на странице.');console.error(err);});
 return promise;
}
function entry(s,id){return s.entries[id]||(s.entries[id]=fresh());}
function complete(c,t){return !!c&&t.check.every(q=>own(c.answers,q.id));}
function score(c,t){return t.check.filter(q=>own(c.answers,q.id)&&check(c.answers[q.id],q)).length;}
function entryLabel(s){return !s?.accepted?'Ещё решаем':s.attempts===1&&!(s.completion?.aided??s.aided)?'С первой попытки':'С помощью или после исправления';}
function visit(hash){
 if(BOARD)return Promise.resolve();
 const match=/^#(?:topic|lesson)\/(p\d{2})(?:\/(\w+))?/.exec(hash||'');
 if(!match||!own(byId,match[1])||match[2]==='check')return Promise.resolve();
 const id=match[1];
 return mutate(s=>{const c=s.checks[id];if(c&&!complete(c,byId[id]))c.aided=true;});
}
function go(hash){if(root.location.hash===hash)root.PetersonApp?.route();else root.location.hash=hash;}
function stopModel(){if(disposeModel)disposeModel();disposeModel=null;}
function cleanView(){stopModel();root.Peterson5Media?.cleanup();view=null;}
function status(message,error=false){const n=view?.host.querySelector('[data-w-status]');if(n){n.className='workshop-feedback'+(error?' is-error':'');n.textContent=message;}}
function formatHelp(q){
 if(q.kind==='set')return 'Введи все подходящие числа через пробел или добавляй по одному. Порядок не важен; повторять число не нужно.';
 if(q.kind==='choice')return 'Выбери один ответ, затем проверь свой выбор.';
 return {'integer':'Введи целое число.','decimal':'Введи десятичную дробь с запятой или точкой.','reduced-fraction':'Введи несократимую дробь, например 3/4, или целое число.','mixed-number':'Введи смешанное число с пробелом, например 2 1/3.'}[q.answerFormat]||'Можно ввести число, дробь 3/4 или смешанное число 2 1/3. Единицы не вводи.';
}
function field(q,value,disabled=false,prefix='answer'){
 const id='workshop-'+prefix;
 if(q.kind==='choice')return '<fieldset class="workshop-choices"><legend class="sr-only">Варианты ответа</legend>'+q.choices.map((v,i)=>'<label class="workshop-choice '+(value===v?'is-selected':'')+'"><input type="radio" name="'+id+'" data-w-value value="'+esc(v)+'" '+(value===v?'checked ':'')+(disabled?'disabled ':'')+'><span class="choice-index" aria-hidden="true">'+(i+1)+'</span><span>'+format(v)+'</span></label>').join('')+'</fieldset>';
 return '<label class="workshop-input-label" for="'+id+'">'+(q.kind==='set'?'Твой полный набор':'Твой ответ')+'</label><input id="'+id+'" data-w-value type="text" autocomplete="off" spellcheck="false" maxlength="500" value="'+esc(value)+'" '+(disabled?'readonly':'')+' aria-describedby="'+id+'-help"><p id="'+id+'-help" class="small">'+esc(formatHelp(q))+'</p>'+(q.kind==='set'&&!disabled?'<div class="set-builder"><label for="set-one" class="sr-only">Добавить одно число</label><input id="set-one" type="text" inputmode="numeric" maxlength="10" placeholder="Одно число"><button type="button" class="quiet" data-w-add>Добавить</button><div class="set-chips" data-w-chips aria-label="Собранные числа"></div></div>':'');
}
function answerValue(form,q){const f=form.querySelector(q.kind==='choice'?'[data-w-value]:checked':'[data-w-value]');return f?.value||'';}
function currentQuery(){if(!view||view.stage==='check')return null;const t=byId[view.id];return view.stage==='discover'?t.discovery:t.practice[view.index||0];}
function paintChips(form){
 const out=form.querySelector('[data-w-chips]'),value=form.querySelector('[data-w-value]');if(!out||!value)return;
 const parts=value.value.trim().split(/[\s,;]+/).filter(Boolean);
 out.innerHTML=parts.map((v,i)=>'<button type="button" class="quiet set-chip" data-w-remove="'+i+'" aria-label="Убрать '+esc(v)+'">'+esc(v)+' <span aria-hidden="true">×</span></button>').join('');
}
function bindFields(form,q,onDraft){
 form.querySelectorAll('[data-w-value]').forEach(f=>f.addEventListener(q.kind==='choice'?'change':'input',()=>{
  const value=answerValue(form,q);onDraft(value);
  form.querySelectorAll('.workshop-choice').forEach(l=>l.classList.toggle('is-selected',!!l.querySelector('input:checked')));
  if(q.kind==='set')paintChips(form);
 }));
 if(q.kind==='set'&&form.querySelector('[data-w-add]')){
  paintChips(form);
  form.querySelector('[data-w-add]').onclick=()=>{
   const extra=form.querySelector('#set-one'),input=form.querySelector('[data-w-value]'),n=extra.value.trim();
   if(!/^\d+$/.test(n)||!Number.isSafeInteger(Number(n))){status('Добавь одно целое неотрицательное число.',true);return;}
   const list=setValue(input.value)||[];
   if(list.includes(Number(n))){status('Это число уже есть в наборе. Повтор не добавлен.',true);return;}
   input.value=[input.value.trim(),String(Number(n))].filter(Boolean).join(' ');extra.value='';onDraft(input.value);paintChips(form);extra.focus();
  };
  form.querySelector('#set-one').onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();form.querySelector('[data-w-add]').click();}};
  form.querySelector('[data-w-chips]').onclick=ev=>{const b=ev.target.closest('[data-w-remove]');if(!b)return;const input=form.querySelector('[data-w-value]'),values=input.value.trim().split(/[\s,;]+/).filter(Boolean);values.splice(Number(b.dataset.wRemove),1);input.value=values.join(' ');onDraft(input.value);paintChips(form);};
 }
}
function wrongMessage(q,value){
 if(q.errors&&own(q.errors,value))return q.errors[value];
 if(q.kind==='number'&&M.equal(value,q.answer)&&q.answerFormat)return 'Значение получилось верным. Теперь запиши его в нужном виде. '+formatHelp(q);
 if(q.kind==='set'){
  const a=setValue(value),b=setValue(q.answer);
  if(new Set(a).size!==a.length)return 'В наборе есть повтор. Каждое подходящее число запиши один раз.';
  if(a.some(v=>!b.includes(v)))return 'В набор попало число, которое не подходит под условие. Проверь каждое число.';
  return 'Найдены подходящие числа, но пока не все. Организуй перебор, чтобы ничего не пропустить.';
 }
 return 'Пока не получилось. Проверь условие и своё действие. Можно взять подсказку или разобрать один шаг.';
}
function invalidMessage(q,value){return !value.trim()?'Сначала '+(q.kind==='choice'?'выбери ответ.':'введи ответ.'):
 q.kind==='set'?'Запись пока не распознана. Нужны целые неотрицательные числа через пробел. Попытка не засчитана.':
 q.kind==='choice'?'Выбери один из предложенных вариантов.':'Запись пока не распознана. Например: 0,5; 3/4; 2 1/3. Это ещё не математическая попытка.';}
function taskHTML(t,q,s,stage){
 const steps=(q.steps||[]),current=steps[s.step];
 return '<article class="workshop-task" aria-labelledby="workshop-question"><div class="workshop-task-top"><span class="eyebrow">'+(stage==='discover'?'Исследование · попробуй сначала':'Тренировка · задание '+((view.index||0)+1)+' из 2')+'</span><span class="tag">'+entryLabel(s)+'</span></div><h2 id="workshop-question">'+format(q.prompt)+'</h2><form data-w-form>'+field(q,s.value,s.accepted)+'<button type="submit" '+(s.accepted?'disabled':'')+'>'+(stage==='discover'?'Проверить предположение':'Проверить ответ')+'</button></form><div data-w-status role="status" aria-live="polite"></div>'+
 (s.firstWrong?'<details class="workshop-first"><summary>Моя первая ошибка'+(s.accepted?' и исправление':'')+'</summary><p>Первый неверный ответ: '+format(s.firstWrong)+'.</p>'+(s.accepted?'<p>После исправления: '+format(s.value)+'.</p>':'')+'</details>':'')+
 (s.accepted?'<div class="workshop-feedback"><strong>Получилось.</strong><p>'+format(q.explanation)+'</p></div>':'')+
 '<div class="workshop-help-actions"><button type="button" class="quiet" data-w-hint>Нужна подсказка</button>'+(steps.length?'<button type="button" class="quiet" data-w-steps>Разобрать по шагам</button>':'')+(stage==='discover'?'<button type="button" class="quiet" data-w-model>Исследовать на модели</button>':'')+'</div>'+
 (s.hints?'<aside class="workshop-hint"><strong>Подумай об этом</strong><p>'+format(q.hint)+'</p>'+(s.hints===2?'<p>'+format(current?.hint||current?.prompt||'Сверь данные условия и вопрос. Можно открыть решение и затем проверить себя на новом задании.')+'</p>':'<button type="button" class="text-button" data-w-hint>Ещё немного помощи</button>')+'<button type="button" class="text-button" data-w-solution>Показать объяснение</button></aside>':'')+
 (s.solution?'<div class="workshop-hint"><strong>Разбор с помощью</strong><p>'+format(q.explanation)+'</p><p>Ответ: '+format(q.answer)+'. После этого реши новый пример в проверке.</p></div>':'')+
 (s.showSteps?'<section class="workshop-steps"><h3>По одному действию</h3><p class="small">Это разбор с помощью. Уже выполненные шаги остаются видны.</p>'+steps.slice(0,s.step).map((a,i)=>'<div class="workshop-step is-done"><strong>Шаг '+(i+1)+' · готово</strong><p>'+format(a.prompt)+'</p><p>Твой ответ: '+format(s.stepValues[i])+'. '+format(a.explanation)+'</p></div>').join('')+(current?'<div class="workshop-step"><span class="eyebrow">Сейчас · шаг '+(s.step+1)+'</span><h3>'+format(current.prompt)+'</h3><form data-w-step-form>'+field(current,s.stepValues[s.step]||'',false,'step')+'<button type="submit">Проверить шаг</button></form><div data-w-step-status role="status"></div></div>':'<p>Шаги готовы. Вернись к вопросу задания и запиши ответ.</p>')+'</section>':'')+
 '<details class="workshop-notes" '+(s.note?'open':'')+'><summary>Мои записи и рассуждения</summary><label for="workshop-notes" class="small">Записи сохраняются. Свободное рассуждение обсуждаем с учителем.</label><textarea id="workshop-notes" maxlength="'+(BOARD?2000:8000)+'" placeholder="Что я заметил? Как рассуждал?">'+esc(s.note)+'</textarea></details></article>';
}
function drawTask(){
 if(!view||view.stage==='check')return;const {host,id,stage}=view,t=byId[id],q=currentQuery(),s=state.entries[q.id]||fresh();
 host.querySelector('[data-w-body]').innerHTML=taskHTML(t,q,s,stage)+'<div data-p5-media-host></div>'+(stage==='discover'&&s.modelOpen?'<section class="workshop-model"><h2>Проверь идею на другом примере</h2><p>Меняй значения и наблюдай, что сохраняется. Эта модель помогает разобраться; задание выше имеет свои данные.</p><div data-w-model-host></div></section>':'')+
 (stage==='discover'?'<details class="workshop-rule"><summary>Короткое правило темы</summary>'+((root.PetersonCourse?.lessons||[]).find(l=>l.id===id)?.theory||[]).map(p=>'<h3>'+esc(p.title)+'</h3><p>'+format(p.text)+'</p>'+(p.example?'<p class="workshop-rule-example">'+format(p.example)+'</p>':'')).join('')+'</details><a class="button workshop-next" href="#topic/'+id+'/practice">Теперь потренироваться →</a>':'<div class="workshop-practice-navigation">'+(view.index?'<a class="button quiet" href="#topic/'+id+'/practice/0">← Первое задание</a>':'<a class="button quiet" href="#topic/'+id+'/practice/1">Второе задание →</a>')+'<a class="button" href="#topic/'+id+'/check">Проверить себя на новых заданиях →</a></div>');
 root.Peterson5Media?.mount(host.querySelector('[data-p5-media-host]'),id,{onHelp(){mutate(d=>{entry(d,q.id).aided=true;});}});
 const form=host.querySelector('[data-w-form]');
 bindFields(form,q,value=>mutate(d=>{const a=entry(d,q.id);if(!a.accepted)a.value=value;}));
 form.onsubmit=async ev=>{
  ev.preventDefault();const value=answerValue(form,q);
  if(!recognized(value,q)){status(invalidMessage(q,value),true);return;}
  let result;
  await mutate(d=>{const a=entry(d,q.id);if(a.accepted){result=true;return;}a.value=value;a.attempts++;if(!a.first)a.first=value;result=check(value,q);if(result){a.accepted=true;a.completion={aided:a.aided,attempts:a.attempts,first:a.first};}else if(!a.firstWrong)a.firstWrong=value;});
  if(view?.id!==id||currentQuery()?.id!==q.id)return;
  drawTask();if(!result)status(wrongMessage(q,value),true);else host.querySelector('.workshop-next,.workshop-practice-navigation a')?.focus({preventScroll:true});
 };
 host.querySelectorAll('[data-w-hint]').forEach(b=>b.onclick=async()=>{await mutate(d=>{const a=entry(d,q.id);a.hints=Math.min(a.hints+1,2);a.aided=true;});if(currentQuery()?.id===q.id)drawTask();});
 host.querySelector('[data-w-solution]')?.addEventListener('click',async()=>{await mutate(d=>{const a=entry(d,q.id);a.solution=true;a.aided=true;});if(currentQuery()?.id===q.id)drawTask();});
 host.querySelector('[data-w-steps]')?.addEventListener('click',async()=>{await mutate(d=>{const a=entry(d,q.id);a.showSteps=!a.showSteps;a.aided=true;});if(currentQuery()?.id===q.id)drawTask();});
 host.querySelector('[data-w-model]')?.addEventListener('click',async()=>{await mutate(d=>{const a=entry(d,q.id);a.modelOpen=!a.modelOpen;a.aided=true;});if(currentQuery()?.id===q.id)drawTask();});
 host.querySelector('#workshop-notes').oninput=ev=>{const value=ev.target.value.slice(0,BOARD?2000:8000);mutate(d=>{entry(d,q.id).note=value;});};
 const stepForm=host.querySelector('[data-w-step-form]');
 if(stepForm){const step=q.steps[s.step],index=s.step;bindFields(stepForm,step,value=>mutate(d=>{entry(d,q.id).stepValues[index]=value;}));stepForm.onsubmit=async ev=>{
  ev.preventDefault();const value=answerValue(stepForm,step),feedback=host.querySelector('[data-w-step-status]');
  if(!recognized(value,step)){feedback.textContent=invalidMessage(step,value);return;}
  if(!check(value,step)){feedback.textContent=step.hint||'Проверь именно этот шаг. Сопоставь вопрос и введённый ответ.';return;}
  await mutate(d=>{const a=entry(d,q.id);if(a.step===index){a.stepValues[index]=value;a.step++;a.aided=true;}});if(currentQuery()?.id===q.id){drawTask();host.querySelector('[data-w-step-form] input,[data-w-form] input')?.focus({preventScroll:true});}
 };}
 stopModel();
 if(stage==='discover'&&s.modelOpen){const h=host.querySelector('[data-w-model-host]');disposeModel=root.PetersonModels?.mount(h,{model:t.model},q,{state:state.models[id]||{},inquiry:false,caption:'Авторский пример для исследования. Сравни его со своей задачей и сформулируй правило.',onChange(value){mutate(d=>{d.models[id]=cleanModel(value);});}});}
 host.querySelector('.workshop-rule')?.addEventListener('toggle',ev=>{if(ev.target.open)mutate(d=>{entry(d,q.id).aided=true;});});
}
function checkHTML(t,c){
 if(complete(c,t)){
  const n=score(c,t),title=BOARD?'Совместный разбор завершён':c.aided?'Проверка с повторением':n===3?'Три новых задания получились':'Видно, что ещё потренировать';
  return '<section class="workshop-result"><p class="eyebrow">'+(BOARD?'Общая работа на доске':'Первая проверка сохранена')+'</p><h2>'+title+'</h2><div class="workshop-score"><strong>'+n+'</strong><span>из 3<br>с первой попытки</span></div><p>'+(BOARD?'Ответы относятся к совместной работе на доске. Личный результат ученика не изменён.':c.aided?'Во время проверки ты возвращался к объяснению этой темы. Этот результат отмечен отдельно от самостоятельного.':'Во время этой проверки подсказок не было. Результат относится к этим трём заданиям.')+'</p><p class="small">Повторное открытие не меняет первый результат. Ошибки можно разобрать ниже.</p></section>'+t.check.map((q,i)=>'<details class="workshop-check-review" '+(!check(c.answers[q.id],q)?'open':'')+'><summary>Задание '+(i+1)+' · '+(check(c.answers[q.id],q)?'верно':'разберём ошибку')+'</summary><h3>'+format(q.prompt)+'</h3><p>Твой первый ответ: <strong>'+format(c.answers[q.id])+'</strong>.</p><p>Верный ответ: <strong>'+format(q.answer)+'</strong>.</p><p>'+format(q.explanation)+'</p></details>').join('')+'<div class="workshop-practice-navigation"><a class="button quiet" href="#topic/'+t.id+'/practice">Вернуться к тренировке</a><a class="button" href="#lesson/'+t.id+'/0">Применить в задачах учебника →</a></div>';
 }
 const q=t.check.find(q=>!own(c.answers,q.id)),index=t.check.indexOf(q),draft=c.drafts[q.id]||'';
 return '<section class="workshop-check-intro"><p class="eyebrow">'+(BOARD?'Совместный разбор':'Самостоятельная проверка')+' · '+(index+1)+' из 3</p><p>'+(BOARD?'Обсудите три новых задания вместе. Ответы и шаги видны всем участникам комнаты.':'Новые задания без подсказок. Первый ответ сохранится после отправки. Разбор появится после третьего задания.')+'</p>'+(c.aided&&!BOARD?'<p class="tag warm">С повторением: ты возвращался к обучению этой темы.</p>':'')+'<div class="workshop-check-dots" aria-label="Отправлено '+index+' из 3">'+t.check.map((_,i)=>'<span class="'+(i<index?'is-sent':'')+'">'+(i<index?'✓':i+1)+'</span>').join('')+'</div></section><article class="workshop-task"><h2 id="workshop-question">'+format(q.prompt)+'</h2><form data-w-check-form>'+field(q,draft)+'<button type="submit">'+(index===2?'Завершить и посмотреть результат':'Сохранить ответ и продолжить')+'</button></form><div data-w-status role="status" aria-live="polite"></div><p class="small">'+(BOARD?'Состояние общей работы хранится в комнате доски.':'Можно закрыть страницу и продолжить позже — черновик сохранится.')+'</p></article>';
}
function drawCheck(){
 if(!view)return;stopModel();const {host,id}=view,t=byId[id],c=state.checks[id]||{answers:{},drafts:{},aided:BOARD};
 host.querySelector('[data-w-body]').innerHTML=checkHTML(t,c);const form=host.querySelector('[data-w-check-form]');if(!form)return;
 const q=t.check.find(q=>!own(c.answers,q.id));
 bindFields(form,q,value=>mutate(d=>{const a=d.checks[id]||(d.checks[id]={answers:{},drafts:{},aided:BOARD});if(!own(a.answers,q.id))a.drafts[q.id]=value;}));
 form.onsubmit=async ev=>{
  ev.preventDefault();const value=answerValue(form,q);if(!recognized(value,q)){status(invalidMessage(q,value),true);return;}
  form.querySelector('button[type="submit"]').disabled=true;
  await mutate(d=>{const a=d.checks[id]||(d.checks[id]={answers:{},drafts:{},aided:BOARD});if(!own(a.answers,q.id)){a.answers[q.id]=value;delete a.drafts[q.id];}});
  if(view?.id===id&&view.stage==='check'){drawCheck();host.querySelector('#workshop-question,.workshop-result h2')?.setAttribute('tabindex','-1');host.querySelector('#workshop-question,.workshop-result h2')?.focus({preventScroll:true});}
 };
}
function mount(host,id,stage='discover',options={}){
 cleanView();if(options.format)format=options.format;
 if(!own(byId,id)){host.innerHTML='<h1>Тема не найдена</h1><a class="button" href="#home">Выбрать тему</a>';return cleanView;}
 const t=byId[id],parts=String(stage).split('/'),tab=['discover','practice','check'].includes(parts[0])?parts[0]:'discover',index=parts[1]==='1'?1:0;
 view={host,id,stage:tab,index};
 host.innerHTML='<div class="workshop-breadcrumb"><a href="#home">← Все темы</a><span>Часть '+t.part+' · тема '+Number(id.slice(1))+'</span><a href="#lesson/'+id+'/0">Номера учебника</a></div><header class="workshop-lesson-header"><p class="eyebrow">Петерсон · 5 класс</p><h1>'+esc(t.title)+'</h1><p class="lead">'+esc(t.goal)+'</p></header><nav class="workshop-tabs" aria-label="Этапы занятия">'+[['discover','1','Исследуй'],['practice','2','Практика'],['check','3',BOARD?'Обсуди':'Проверь себя']].map(([key,n,label])=>'<a href="#topic/'+id+'/'+key+'" '+(tab===key?'aria-current="step"':'')+'><span>'+n+'</span>'+label+'</a>').join('')+'</nav><div class="workshop-lesson-layout"><div data-w-body></div><aside class="workshop-compass"><p class="eyebrow">Зачем это нужно</p><p>'+esc(t.why)+'</p><h2>Твой следующий шаг</h2><p>'+(tab==='discover'?'Сначала сделай предположение. Если трудно — открой подсказку или модель.':tab==='practice'?'Реши две разные задачи. Можно разбирать трудное действие по шагам.':'Ответь на три новых вопроса. После завершения увидишь, куда вернуться.')+'</p><a href="#lesson/'+id+'/0">Выбранные задачи учебника →</a><a href="#progress">Мои результаты →</a></aside></div>';
 if(tab==='check')drawCheck();else drawTask();
 const token=view;
 const remember=s=>{s.last='#topic/'+id+'/'+tab+(tab==='practice'?'/'+index:'');if(tab==='check'&&!s.checks[id])s.checks[id]={answers:{},drafts:{},aided:BOARD};else if(tab!=='check'&&s.checks[id]&&!complete(s.checks[id],t))s.checks[id].aided=true;};
 if(BOARD){remember(state);}else mutate(remember).then(()=>{if(view===token){if(tab==='check')drawCheck();else drawTask();}});
 return ()=>{if(view?.host===host)cleanView();};
}
function renderHome(host,options={}){
 cleanView();if(options.format)format=options.format;
 const homeState=BOARD?blank():state;
 const done=topics.filter(t=>complete(homeState.checks[t.id],t)).length;
 host.innerHTML='<section class="workshop-hero"><div><p class="eyebrow">Петерсон · 5 класс · две части</p><h1>Пойми идею.<br>Сделай сам.</h1><p class="lead">Составляй выражения, находи закономерности, исследуй дроби. Один понятный шаг за другим — от первого предположения к самостоятельному решению.</p><div class="row"><a class="button" href="'+(homeState.last||'#topic/p01/discover')+'">'+(homeState.last?'Продолжить занятие':'Начать с первой темы')+' →</a><a class="button quiet" href="#topics">Выбрать тему</a></div><p class="small">Без таймера. С подсказками по запросу. '+(BOARD?'Общая работа комнаты.':'Работа сохраняется.')+'</p></div><div class="workshop-hero-paper" aria-label="Скобки меняют смысл выражения"><span class="paper-label">Маленькое открытие</span><p class="paper-expression">8 + 3 · 4 <span>= 20</span></p><p class="paper-expression"><b>(</b>8 + 3<b>)</b> · 4 <span>= 44</span></p><div class="paper-line"></div><p>Числа те же.<br><strong>Что изменили скобки?</strong></p><a href="#topic/p01/discover">Попробовать →</a></div></section><section class="workshop-overview" aria-label="Содержание курса"><div><strong>43</strong><span>темы двух частей</span></div><div><strong>86</strong><span>новых тренировок</span></div><div><strong>129</strong><span>вопросов для проверки</span></div><div><strong>'+done+'</strong><span>проверок завершено</span></div></section><section class="workshop-start"><div><p class="eyebrow">Начало учебного года</p><h2>Учимся говорить на языке математики</h2><p>Выражения, модели задач, пробы, перебор и логика. В Петерсоне это отдельные важные умения.</p></div><a class="button quiet" href="#topic/p01/discover">Начать этот маршрут →</a></section><section id="topics" class="workshop-topics"><div class="workshop-section-title"><h2>Выбери, с чем разобраться</h2><label for="workshop-filter" class="sr-only">Найти тему</label><input id="workshop-filter" type="search" placeholder="Например, перебор или дроби"></div><div class="workshop-filter-buttons" role="group" aria-label="Раздел курса"><button type="button" data-w-filter="all" aria-pressed="true">Все темы</button><button type="button" data-w-filter="start" aria-pressed="false">Начало года</button><button type="button" data-w-filter="1" aria-pressed="false">Часть 1</button><button type="button" data-w-filter="2" aria-pressed="false">Часть 2</button></div><p class="small" data-w-filter-status aria-live="polite"></p><div class="workshop-topic-grid">'+topics.map(t=>{const c=homeState.checks[t.id],finished=complete(c,t);return '<a class="workshop-topic-card" href="#topic/'+t.id+'/discover" data-w-topic="'+t.id+'"><span class="workshop-topic-number">'+t.id.slice(1)+'</span><div><p class="small">Часть '+t.part+'</p><h3>'+esc(t.title)+'</h3><p>'+esc(t.goal)+'</p><span class="workshop-topic-status">'+(finished?'Проверка: '+score(c,t)+' / 3'+(c.aided?' · с повторением':''):c?'Проверка начата':'Исследование · 2 задачи · проверка')+'</span></div><span class="workshop-arrow" aria-hidden="true">↗</span></a>';}).join('')+'</div></section><details class="workshop-book"><summary>Найти выбранный номер из учебника</summary><p>Прежние 131 карточка и записи к ним доступны отдельно. Номера относятся к изданию 2019 года.</p><form id="number-form" class="number-form"><label for="book-part">Часть<select id="book-part"><option value="1">Часть 1</option><option value="2">Часть 2</option></select></label><label for="exercise-number">Номер упражнения<input id="exercise-number" type="number" min="1" max="9999" required inputmode="numeric"></label><button>Найти разбор</button></form><div id="number-result" class="search-results" aria-live="polite"></div>'+(options.legacyLast&&!BOARD?'<a href="'+esc(options.legacyLast)+'">Вернуться к прежнему заданию →</a>':'')+'</details><details class="workshop-about"><summary>Что входит в курс и как сохраняются результаты</summary><p>Авторские исследования, тренировки и проверки по всем 43 темам двух частей Дорофеева–Петерсон, 2019. Это дополнение к учебнику: подробные разборы есть для выбранных номеров.</p><p>В самостоятельной проверке сохраняется первый ответ. Возврат к объяснению той же темы помечается как повторение. Один удачный проход ещё не означает, что умение закрепилось.</p><p>Свободные записи и доказательства обсуждаются с учителем. Результаты находятся в этом браузере; их можно скачать в разделе «Мои результаты». Автоматической отправки в кабинет нет.</p><a href="#skills">Отдельная вычислительная мастерская →</a></details>';
 if(BOARD){const about=host.querySelector('.workshop-about');if(about)about.innerHTML='<summary>Как работает общий курс</summary><p>Выбранная задача, ответы, подсказки, модель и анимация передаются участникам комнаты. Управляет тот, кому передан ход.</p><p>На доске сохраняется текущая общая сцена. Личный учебный маршрут и результаты остаются в отдельном курсе.</p>';host.querySelectorAll('a[href="#progress"]').forEach(link=>{link.textContent='Работа урока →';});}
 let filter='all';const search=host.querySelector('#workshop-filter');
 function apply(){let n=0;host.querySelectorAll('[data-w-topic]').forEach(card=>{const t=byId[card.dataset.wTopic],part=filter==='all'||filter==='start'&&Number(t.id.slice(1))<=11||String(t.part)===filter,match=(t.title+' '+t.goal).toLowerCase().includes(search.value.toLowerCase().trim());card.hidden=!(part&&match);if(!card.hidden)n++;});host.querySelector('[data-w-filter-status]').textContent=n?'Показано тем: '+n:'По этому запросу тем не нашлось. Попробуй другое слово.';}
 search.oninput=apply;host.querySelectorAll('[data-w-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.wFilter;host.querySelectorAll('[data-w-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));apply();});apply();
 host.querySelector('#number-form').onsubmit=ev=>{ev.preventDefault();options.findNumber?.(Number(host.querySelector('#exercise-number').value),Number(host.querySelector('#book-part').value));};
 return cleanView;
}
function progressHTML(){
 const finished=topics.filter(t=>complete(state.checks[t.id],t));
 return '<section class="workshop-progress"><p class="eyebrow">Новый учебный маршрут</p><h2>Первая самостоятельная проверка</h2><p>Завершено '+finished.length+' из 43 проверок. Здесь сохраняется первая попытка на новых заданиях; повторное открытие не повышает результат.</p><div class="workshop-progress-grid">'+topics.filter(t=>state.checks[t.id]||[t.discovery,...t.practice].some(q=>state.entries[q.id])).map(t=>{const c=state.checks[t.id];return '<a href="#topic/'+t.id+'/'+(c?'check':'discover')+'"><strong>'+esc(t.title)+'</strong><span>'+(complete(c,t)?score(c,t)+' / 3'+(c.aided?' · с повторением':' · без подсказок в проверке'):c?'Проверка ещё не закончена':'Исследование или тренировка начаты')+'</span></a>';}).join('')+'</div>'+(finished.length?'':'<p class="small">Открытие темы и чтение объяснения не считаются пройденной проверкой.</p>')+'</section>';
}
function renderProgress(host){host.insertAdjacentHTML('afterbegin',progressHTML());}
function hasWork(s){return !!s&&(s.value||s.note||s.first||s.firstWrong||s.attempts||s.aided||s.hints||s.solution||s.step||s.stepValues?.some(Boolean)||s.modelOpen);}
async function importState(raw){
 if(BOARD)throw Error('Личное сохранение открывается в отдельном курсе.');
 const incoming=validateState(raw);
 await mutate(s=>{
  for(const [id,v]of Object.entries(incoming.entries))if(!hasWork(s.entries[id]))s.entries[id]=v;
  for(const [id,v]of Object.entries(incoming.checks))if(!own(s.checks,id))s.checks[id]=v;
  for(const [id,v]of Object.entries(incoming.models))if(!own(s.models,id))s.models[id]=v;
  if(!s.last)s.last=incoming.last;
 });
}
root.addEventListener('storage',ev=>{if(BOARD||ev.key!==KEY||!writable)return;try{state=readDisk();if(view&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'')){if(view.stage==='check')drawCheck();else drawTask();}}catch(_){writable=false;announceWarning('Сохранение в другой вкладке не удалось прочитать. Оно не перезаписано.');}});
root.PetersonWorkshop={boardMode:BOARD,replaceBoardState(raw){if(!BOARD)throw Error('Board wrapper required');state=validateState(raw);},storageKey:KEY,getState:()=>JSON.parse(JSON.stringify(state)),validateState,check,mount,renderHome,renderProgress,exportState:()=>JSON.parse(JSON.stringify(state)),importState,visit,whenIdle:()=>queue,cleanup:cleanView,progressHTML};
})(typeof window!=='undefined'?window:globalThis);
