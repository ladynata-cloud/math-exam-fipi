/* Topic-specific independent transfer practice for retained geometry trainers. */
(function (root) {
  'use strict';
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const copy=x=>JSON.parse(JSON.stringify(x)),text=(x,max=6000)=>typeof x==='string'?x.slice(0,max):'';
  const nonnegative=x=>Number.isFinite(x)&&x>=0?Math.min(1e9,Math.floor(x)):0;
  function fingerprint(task){const normalized=s=>String(s).trim().replace(/\s+/g,' '),choice=task.answer.kind==='choice';return JSON.stringify([normalized(task.prompt),task.answer.kind,choice?normalized(task.answer.options.find(o=>o.value===task.answer.value)?.label||''):task.answer.value,choice?task.answer.options.map(o=>normalized(o.label)).sort():null]);}
  function parseNumber(raw){
    const value=String(raw).trim().replace(/−/g,'-');
    if(!value)return {valid:false,empty:true};
    const number='[+-]?(?:\\d+(?:[.,]\\d*)?|[.,]\\d+)',pattern=new RegExp('^('+number+')(?:\\s*/\\s*('+number+'))?$');
    const m=value.match(pattern);if(!m)return {valid:false,empty:false};
    const numerator=Number(m[1].replace(',','.')),denominator=m[2]===undefined?1:Number(m[2].replace(',','.'));
    const result=numerator/denominator;return denominator!==0&&Number.isFinite(result)?{valid:true,value:result}:{valid:false,empty:false};
  }
  function interpret(task,raw){
    if(task.answer.kind==='choice')return task.answer.options.some(o=>o.value===raw)?{valid:true,value:raw}:{valid:false,empty:!String(raw).trim()};
    let input=String(raw).trim();if(task.answer.unit&&input.endsWith(task.answer.unit))input=input.slice(0,-task.answer.unit.length).trim();return parseNumber(input);
  }
  const equal=(task,a,b)=>task.answer.kind==='number'?Math.abs(a-b)<=Math.max(0,task.answer.tolerance??1e-8):a===b;
  function freshRecord(task,repeated=false){return {id:task.id,condition:copy(task),draft:'',firstAnswer:'',firstOutcome:null,attempts:0,errors:0,hint:false,solution:false,completed:false,outcome:null,repeated,feedback:'',feedbackKind:'',history:[]};}
  function freshState(){return {version:1,updated:0,active:'',records:{},credits:[],archive:[]};}
  function cleanRecord(value){
    if(!plain(value)||!plain(value.condition))throw Error('Повреждён сохранённый вариант.');
    return {...copy(value),draft:text(value.draft,300),firstAnswer:text(value.firstAnswer,300),firstOutcome:['correct','wrong'].includes(value.firstOutcome)?value.firstOutcome:null,attempts:nonnegative(value.attempts),errors:nonnegative(value.errors),hint:!!value.hint,solution:!!value.solution,completed:!!value.completed,repeated:!!value.repeated,outcome:['independent','corrected','assisted','repeated'].includes(value.outcome)?value.outcome:null,feedback:text(value.feedback),feedbackKind:text(value.feedbackKind,30),history:Array.isArray(value.history)?value.history.slice(-100).filter(plain).map(e=>({at:Number.isFinite(e.at)?e.at:0,type:text(e.type,30),answer:text(e.answer,300),feedback:text(e.feedback)})):[]};
  }
  function readState(raw){
    if(!raw)return freshState();const value=JSON.parse(raw);
    if(!plain(value)||value.version!==1||!plain(value.records)||!Array.isArray(value.credits)||!Array.isArray(value.archive))throw Error('Неизвестный формат практики.');
    const records={};for(const [key,record] of Object.entries(value.records)){if(key.length>20000)throw Error('Повреждён ключ условия.');records[key]=cleanRecord(record);}
    return {version:1,updated:Number.isFinite(value.updated)?value.updated:0,active:text(value.active,20000),records,credits:value.credits.filter(c=>plain(c)&&typeof c.key==='string').slice(-500),archive:value.archive.slice(-50)};
  }
  function select(state,task){const key=fingerprint(task);if(!own(state.records,key))state.records[key]=freshRecord(task);state.active=key;return state.records[key];}
  function log(record,event){record.history.push(event);record.history=record.history.slice(-100);}
  function submit(state,task,raw,now=Date.now()){
    const record=select(state,task);if(record.completed)return {kind:'complete',message:record.feedback};
    record.draft=String(raw).slice(0,300);const parsed=interpret(task,record.draft);
    if(!parsed.valid){const message=parsed.empty?'Сначала запиши свой ответ.':'Проверь запись: введи число, десятичную дробь или дробь вида 3/4.';record.feedback=message;record.feedbackKind='format';return {kind:'format',message};}
    record.attempts++;const correct=equal(task,parsed.value,task.answer.value);
    if(record.firstOutcome===null){record.firstAnswer=record.draft;record.firstOutcome=correct?'correct':'wrong';}
    if(!correct){
      record.errors++;
      const match=(task.errors||[]).find(error=>equal(task,parsed.value,error.value));
      record.feedback=match?.feedback||'Ответ пока не подходит. Ещё раз проверь данные, выбранное свойство и вычисления.';
      record.feedbackKind='wrong';log(record,{at:now,type:'wrong',answer:record.draft,feedback:record.feedback});return {kind:'wrong',message:record.feedback};
    }
    record.completed=true;const key=fingerprint(task),credited=state.credits.some(c=>c.key===key);
    record.outcome=record.repeated||credited?'repeated':record.hint||record.solution?'assisted':record.firstOutcome==='wrong'?'corrected':'independent';
    if(record.outcome==='independent')state.credits.push({key,id:task.id,at:now});
    const messages={independent:'Верно с первой попытки без подсказки. Этот новый вариант решён самостоятельно.',corrected:'Верно после исправления. Теперь возьми новый вариант для самостоятельной проверки.',assisted:'Верно с опорой. Возьми новый вариант и реши его без открытой подсказки.',repeated:'Верно. Это знакомое условие: повтор сохранён отдельно от новых самостоятельных решений.'};
    record.feedback=messages[record.outcome];record.feedbackKind='correct';log(record,{at:now,type:record.outcome,answer:record.draft});return {kind:record.outcome,message:record.feedback};
  }
  function help(state,task,kind,now=Date.now()){
    const record=select(state,task);if(!['hint','solution'].includes(kind))return false;
    if(!record.completed&&record.errors<2)return false;
    if(!record[kind]){record[kind]=true;log(record,{at:now,type:kind});}return true;
  }
  function repeat(state,task,now=Date.now()){
    const key=fingerprint(task),record=state.records[key];if(!record?.completed)return false;
    state.archive.push({key,at:now,record:copy(record)});state.archive=state.archive.slice(-50);state.records[key]=freshRecord(task,true);state.active=key;return true;
  }
  function nextUnseen(state,tasks){return tasks.find(task=>!own(state.records,fingerprint(task)))||null;}
  function mount(win,doc,config){
    if(win.Geometry7Native||new URLSearchParams(win.location.search).get('g7-board')==='1')return null;
    const tasks=config.tasks;if(!Array.isArray(tasks)||!tasks.length)return null;
    const storageKey='mathExamGeometryTransfer.v1.'+config.id;let raw=null,state=freshState(),unavailable=false,conflict=false,recovered=[];
    try{raw=win.localStorage.getItem(storageKey);state=readState(raw);}catch(_){unavailable=true;}
    const beforeOpen=JSON.stringify(state);let task=tasks.find(t=>fingerprint(t)===state.active)||tasks[0];select(state,task);const openedChanged=JSON.stringify(state)!==beforeOpen;
    const style=doc.createElement('style');style.textContent='#atanasyan-active-practice{max-width:980px;margin:16px auto;background:#fff;border:2px solid #296c54;border-radius:14px;padding:14px;color:#163d31;font:15px/1.45 system-ui;box-sizing:border-box;text-align:left}#atanasyan-active-practice *{box-sizing:border-box}#atanasyan-active-practice summary{font-weight:750;cursor:pointer}#atanasyan-active-practice h2{font-size:21px;margin:10px 0}#atanasyan-active-practice p{margin:8px 0}#atanasyan-active-practice .ap-problem{font-size:17px}#atanasyan-active-practice .ap-figure{max-width:580px;margin:8px auto}#atanasyan-active-practice svg{display:block;width:100%;max-height:300px}#atanasyan-active-practice label{display:block;margin:8px 0}#atanasyan-active-practice input[type=text]{width:100%;max-width:260px;font:inherit;padding:9px;border:1px solid #789b8e;border-radius:6px}#atanasyan-active-practice input[type=radio]{margin-right:8px}#atanasyan-active-practice select{max-width:100%;font:inherit;padding:7px}#atanasyan-active-practice button{font:inherit;margin:5px 5px 0 0;padding:8px 12px;border:1px solid #296c54;border-radius:7px;background:#fff;color:#174b37;white-space:normal}#atanasyan-active-practice .ap-primary,#atanasyan-active-practice-open{background:#22654e;color:#fff}#atanasyan-active-practice button:disabled{opacity:.55;cursor:default}#atanasyan-active-practice .ap-small{font-size:13px;color:#4f695f}#atanasyan-active-practice .ap-help{border-left:3px solid #d5a643;padding:8px 12px;background:#fff9e9}#atanasyan-active-practice .ap-feedback{min-height:24px}#atanasyan-active-practice .ap-feedback[data-kind=correct]{color:#1d6849}#atanasyan-active-practice .ap-feedback[data-kind=wrong],#atanasyan-active-practice .ap-warning{color:#922f22}#atanasyan-active-practice textarea{width:100%;font:inherit;padding:8px}';doc.head.append(style);
    const panel=doc.createElement('details');panel.id='atanasyan-active-practice';panel.innerHTML='<summary>Проверить понимание · новая задача</summary><div data-practice-body></div><div data-practice-recovery></div><p data-practice-status role="status" class="ap-small"></p><button type="button" data-practice-export>Скачать попытки</button><button type="button" data-practice-latest hidden>Открыть свежую работу</button>';
    const notebook=doc.getElementById('atanasyan-notebook');doc.body.insertBefore(panel,notebook||null);const body=panel.querySelector('[data-practice-body]'),status=panel.querySelector('[data-practice-status]');
    const toolbar=doc.querySelector('.bar');if(toolbar){toolbar.style.flexWrap='wrap';const open=doc.createElement('button');open.id='atanasyan-active-practice-open';open.type='button';open.textContent='Проверить понимание';open.setAttribute('aria-controls',panel.id);open.addEventListener('click',()=>{panel.open=true;panel.scrollIntoView({block:'start'});body.querySelector('h2')?.focus({preventScroll:true});});toolbar.append(open);}
    function flagConflict(){conflict=true;status.className='ap-small ap-warning';status.textContent='В другой вкладке уже есть более свежая работа. Эта попытка приостановлена, её можно скачать. При открытии свежей работы прежний ответ останется ниже.';body.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);panel.querySelector('[data-practice-latest]').hidden=false;}
    function save(){
      if(conflict)return false;
      if(!unavailable){try{if(win.localStorage.getItem(storageKey)!==raw){flagConflict();return false;}state.updated=Date.now();const next=JSON.stringify(state);win.localStorage.setItem(storageKey,next);raw=next;}catch(_){unavailable=true;}}
      status.className='ap-small';status.textContent=unavailable?'Сохранение браузера недоступно. Работа остаётся в этой вкладке: скачай попытки перед закрытием.':'Попытка сохранена в этом браузере.';return true;
    }
    const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function focusTask(){panel.scrollIntoView({block:'start'});body.querySelector('h2')?.focus({preventScroll:true});}
    function render(){
      const record=select(state,task),index=tasks.indexOf(task),unseen=nextUnseen(state,tasks),hintReady=record.errors>=2||record.completed;
      const form=task.answer.kind==='choice'?'<fieldset><legend>Твой ответ</legend>'+task.answer.options.map(option=>'<label><input type="radio" name="ap-choice" value="'+esc(option.value)+'"'+(record.draft===option.value?' checked':'')+'>'+esc(option.label)+'</label>').join('')+'</fieldset>':'<label for="ap-answer">Твой ответ'+(task.answer.unit?' ('+esc(task.answer.unit)+')':'')+'</label><input id="ap-answer" type="text" autocomplete="off" maxlength="300" value="'+esc(record.draft)+'"><p class="ap-small">Можно записать число, десятичную дробь с запятой или дробь: 3/4.</p>';
      body.innerHTML='<h2 tabindex="-1">'+esc(config.topic)+'</h2><p class="ap-small">Вариант '+(index+1)+' из '+tasks.length+(record.repeated?' · знакомое условие':'')+'</p><p class="ap-problem">'+esc(task.prompt)+'</p>'+(task.figure?'<div class="ap-figure">'+task.figure+'</div>':'')+'<form data-practice-form>'+form+'<button type="submit" class="ap-primary"'+(record.completed?' disabled':'')+'>Проверить ответ</button></form><p class="ap-feedback" data-kind="'+esc(record.feedbackKind)+'" data-practice-feedback role="status">'+esc(record.feedback)+'</p><div><button type="button" data-practice-hint'+(!hintReady?' disabled':'')+'>Подсказка</button><button type="button" data-practice-solution'+(!hintReady?' disabled':'')+'>Разобрать решение</button></div>'+(!hintReady?'<p class="ap-small">Сначала попробуй сам. После двух ошибок можно открыть подсказку; пустой ответ и ошибка записи попыткой не считаются.</p>':'')+(record.hint?'<div class="ap-help"><strong>Подсказка</strong><p>'+esc(task.hint)+'</p></div>':'')+(record.solution?'<div class="ap-help"><strong>Разбор</strong><p>'+esc(task.solution)+'</p></div>':'')+'<p><button type="button" data-practice-next class="ap-primary"'+(!unseen?' disabled':'')+'>Новый вариант без подсказки</button>'+(record.completed?'<button type="button" data-practice-repeat>Повторить это условие</button>':'')+'</p>'+(!unseen?'<p class="ap-small">Все варианты уже открыты. Можно продолжить сохранённую работу или повторить знакомое условие. Повтор не добавляет новый самостоятельный успех.</p>':'')+'<label>Продолжить вариант <select data-practice-select>'+tasks.map((t,i)=>{const r=state.records[fingerprint(t)],label=!r?'не открыт':r.outcome==='independent'?'самостоятельно':r.outcome==='assisted'?'с опорой':r.outcome==='corrected'?'исправлено':r.outcome==='repeated'?'повтор':r.completed?'завершён':'в работе';return '<option value="'+esc(t.id)+'"'+(t.id===task.id?' selected':'')+'>'+String(i+1)+' · '+label+'</option>';}).join('')+'</select></label><p class="ap-small">Новых самостоятельных вариантов: '+state.credits.length+'. Верный ответ после ошибки, с помощью и знакомый повтор учитываются отдельно. Эти задачи проверяют указанный навык; письменное доказательство проверяет учитель.</p><details><summary>Мои попытки в этом условии</summary><ol>'+record.history.map(event=>'<li>'+esc(({wrong:'Ошибка',hint:'Открыта подсказка',solution:'Открыт разбор',independent:'Самостоятельный ответ',corrected:'Ответ исправлен',assisted:'Ответ с опорой',repeated:'Знакомый повтор'})[event.type]||event.type)+(event.answer?' · '+esc(event.answer):'')+(event.feedback?' — '+esc(event.feedback):'')+'</li>').join('')+'</ol></details>';
      if(record.completed)body.querySelectorAll('input').forEach(el=>el.disabled=true);
      body.querySelector('[data-practice-form]').addEventListener('submit',event=>{event.preventDefault();if(conflict)return;const input=task.answer.kind==='choice'?body.querySelector('input[name="ap-choice"]:checked')?.value||'':body.querySelector('#ap-answer').value;submit(state,task,input);if(save())render();});
      body.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{if(conflict)return;record.draft=task.answer.kind==='choice'?body.querySelector('input[name="ap-choice"]:checked')?.value||'':body.querySelector('#ap-answer').value;save();}));
      for(const kind of ['hint','solution'])body.querySelector('[data-practice-'+kind+']').addEventListener('click',()=>{if(conflict)return;if(help(state,task,kind)&&save())render();});
      body.querySelector('[data-practice-next]').addEventListener('click',()=>{if(conflict)return;const next=nextUnseen(state,tasks);if(!next)return;task=next;select(state,task);if(save()){render();focusTask();}});
      body.querySelector('[data-practice-repeat]')?.addEventListener('click',()=>{if(conflict)return;if(repeat(state,task)&&save()){render();focusTask();}});
      body.querySelector('[data-practice-select]').addEventListener('change',event=>{if(conflict)return;task=tasks.find(t=>t.id===event.target.value)||task;select(state,task);if(save()){render();focusTask();}});
      if(conflict)flagConflict();
    }
    panel.querySelector('[data-practice-export]').addEventListener('click',()=>{const blob=new win.Blob([JSON.stringify({trainer:config.id,topic:config.topic,...state,recovered},null,2)],{type:'application/json'}),url=win.URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download=config.id+'-practice.json';a.click();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);});
    panel.querySelector('[data-practice-latest]').addEventListener('click',()=>{try{
      const latestRaw=win.localStorage.getItem(storageKey),latest=readState(latestRaw),old=copy(state);recovered.push(old);
      const details=doc.createElement('details');details.open=true;const summary=doc.createElement('summary');summary.textContent='Прежняя попытка из этой вкладки';details.append(summary);const p=doc.createElement('p');p.textContent=task.prompt;details.append(p);const area=doc.createElement('textarea');area.readOnly=true;area.value=state.records[state.active]?.draft||'';details.append(area);panel.querySelector('[data-practice-recovery]').append(details);
      raw=latestRaw;state=latest;task=tasks.find(t=>fingerprint(t)===state.active)||tasks[0];select(state,task);conflict=false;panel.querySelector('[data-practice-latest]').hidden=true;render();status.className='ap-small';status.textContent='Открыта свежая работа. Прежняя попытка сохранена ниже и включена в скачиваемый файл до закрытия вкладки.';
    }catch(_){status.textContent='Свежую запись прочитать не удалось. Скачай попытку этой вкладки.';}});
    win.addEventListener('storage',event=>{if(event.key===storageKey&&!unavailable&&!conflict){try{if(win.localStorage.getItem(storageKey)!==raw)flagConflict();}catch(_){flagConflict();}}});
    render();if(openedChanged||unavailable)save();else status.textContent='Продолжена сохранённая попытка.';return {state:()=>copy(state),panel,key:storageKey};
  }
  const api={fingerprint,parseNumber,interpret,freshRecord,freshState,readState,select,submit,help,repeat,nextUnseen,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.AtanasyanActivePractice=api;
  if(root.document){const config=root.document.getElementById('atanasyan-active-practice-config');if(config)mount(root,root.document,JSON.parse(config.textContent));}
})(typeof window!=='undefined'?window:globalThis);
