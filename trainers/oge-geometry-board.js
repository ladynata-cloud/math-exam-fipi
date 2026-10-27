/* Native geometry practice projected into the existing board contract.
 * Tasks are reconstructed from an archive index or a deterministic generator seed.
 * The bounded semantic action record restores native checking/step closures; no
 * remote markup, figure, answer key, personal statistics or credit is imported. */
(function (root, doc) {
  'use strict';
  const page = Number(doc.body.dataset.ogeGeometry);
  if (![16,17,18].includes(page) || /[?&]selftest=1(?:&|$)/.test(root.location.search)) return;
  const active = root.OgeGeometryBoardMode === true;
  const nativeTask = () => page === 16 ? trTask : page === 17 ? CUR : TR.task;
  const keyOf = task => task && (task.k || task.key || task.sub);
  const inputId = page === 18 ? 'ansIn' : 'ans';
  const actionIds = page === 16 ? {check:'check',giveup:'give'} : page === 17 ? {chk:'check',stepH:'step',give:'give'} : {chkBtn:'check',hintBtn:'first',giveBtn:'give'};
  const actionButtons = Object.fromEntries(Object.entries(actionIds).map(([id,action])=>[action,id]));
  const byId = id => doc.getElementById(id);
  const copy = value => JSON.parse(JSON.stringify(value));
  let taskSeen = nativeTask(), applying = false, notify = function(){}, notifyTimer = null, previous = '', actions = [], taskHelp = false;
  root.OgeGeometryHelpUsed = false;

  function refreshTask() {
    if (nativeTask() === taskSeen) return;
    taskSeen = nativeTask(); actions = []; taskHelp = false; root.OgeGeometryHelpUsed = false;
    if(active){const draft=byId(inputId);if(draft)draft.value='';doc.querySelectorAll('.tabs,.minimal-navigation,.pnote,.stats').forEach(node=>node.hidden=true);const picker=byId('oge-board-subtype');if(picker)picker.value=filterState().sub;}
  }
  function changed() {
    if (applying) return;
    refreshTask();
    if (!active) return;
    const now = JSON.stringify(getState());
    if (now !== previous) { previous = now; notify(); }
  }
  function compactActions() {
    const task=nativeTask();
    const wrong=actions.map((entry,index)=>{
      if(entry[0]!=='check')return -1;
      const parsed=parseAns(entry[1]);
      const valid=page===17?entry[1].trim()!==''&&(task.ansFmt==='concat'||parsed!==null):Number.isFinite(parsed);
      const correct=page===16?eqAns(parsed,task.ans):page===17?isRight(task,entry[1]):near(parsed,task.ans,1e-6);
      return valid&&!correct?index:-1;
    }).filter(i=>i>=0).slice(0,page===16?2:1);
    const lastCheck=actions.findLastIndex(a=>a[0]==='check');
    const firstHint=actions.findIndex(a=>a[0]==='first'),lastHint=actions.findLastIndex(a=>a[0]==='first');
    const firstGive=actions.findIndex(a=>a[0]==='give');
    // Native practice needs the first miss flag (two attempts in №16), the
    // last feedback and each genuine solution step. Superseded checks and
    // repeated first-step clicks cannot accumulate an unbounded room packet.
    actions=actions.filter((a,i)=>a[0]==='check'?(wrong.includes(i)||i===lastCheck):a[0]==='first'?(i===firstHint||i===lastHint):a[0]==='give'?i===firstGive:true);
  }
  function afterAction() {
    if (applying || notifyTimer !== null) return;
    // Native events can checkpoint microtasks between capture and the task's
    // own listeners. Publish once, after the entire dispatch has settled.
    notifyTimer = root.setTimeout(function() { notifyTimer = null; changed(); }, 0);
  }
  // Assistance is sticky for this actual task, not merely the visible help panel.
  doc.addEventListener('click', function(event) {
    if (applying) return;
    refreshTask();
    const button = event.target.closest('button,a,[data-act],summary');
    if (!button) return;
    if ((button.id === 'courseHintToggle' && byId('courseHintPanel')?.hidden) ||
        button.closest('#courseHintPanel')) {
      taskHelp = true; root.OgeGeometryHelpUsed = true;
    }
    if (active && actionIds[button.id] && !button.disabled && !(byId(actionButtons.check)?.disabled && ['check','give'].includes(actionIds[button.id]))) {
      actions.push([actionIds[button.id], byId(inputId)?.value || '', taskHelp]);
      compactActions();
    }
    afterAction();
  }, true);
  doc.addEventListener('input', function(event) {
    if (applying) return;
    refreshTask();
    if (event.target.id===inputId) event.target.value=event.target.value.replace(/[<>\u0000-\u001f]/g,'').slice(0,80);
    afterAction();
  }, true);
  doc.addEventListener('change', afterAction, true);
  doc.addEventListener('toggle', afterAction, true);
  if (!active) return;

  const types = page === 17 ? S17 : SUBS;
  const ids = Object.keys(types);
  const params = new WeakMap(), descriptors = new WeakMap();
  const originalBuild = build;
  const originalGenerators = Object.fromEntries(ids.map(key=>[key,types[key].gen]));
  function seeded(seed, fn) {
    const saved = Math.random;
    let n = seed >>> 0;
    Math.random = function() { n += 0x6D2B79F5; let t=n; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296; };
    try { return fn(); } finally { Math.random=saved; }
  }
  ids.forEach(key=>{
    types[key].gen=function(){
      const seed = Math.floor(Math.random()*4294967296);
      const p=seeded(seed,()=>originalGenerators[key].call(types[key]));
      params.set(p,{key,source:'generator',value:seed});return p;
    };
  });
  build=function(key,p,meta){
    const result=originalBuild(key,p,meta);
    let description=params.get(p);
    if(!description){
      const index=ARCHIVE.findIndex(a=>a.sub===key&&JSON.stringify(a.p)===JSON.stringify(p));
      if(index>=0)description={key,source:'archive',value:index};
      else if(JSON.stringify(p)===JSON.stringify(types[key].proto))description={key,source:'prototype',value:0};
    }
    if(description)descriptors.set(result,description);
    return result;
  };
  function makeTask(description) {
    const {key,source,value}=description;
    if(source==='archive'){
      const a=ARCHIVE[value];
      if(page===16)return buildArchive(a);
      if(page===17)return build(key,a.p,{gen:false,srcLab:srcLabel(a,true),note:types[key].note});
      return archTask(a);
    }
    if(source==='prototype')return build(key,types[key].proto,page===16?{kind:'proto'}:page===17?{gen:false,srcLab:'прототип'}:{});
    const p=seeded(value,()=>originalGenerators[key].call(types[key]));
    params.set(p,description);
    return build(key,p,page===16?{kind:'gen'}:page===17?{gen:true,srcLab:'генератор',note:types[key].note}:{});
  }
  function info(task) { return {key:keyOf(task),ref:page===16?task.sub.ref:task.ref,shape:page===17?task.topic:page===18&&(task.ref==='midtrap'||task.ref==='strap')?'trap':''}; }
  function filterState() {
    if(page===16)return {topic:trFilter.topic,source:trFilter.src,sub:trSubOnly||'all'};
    if(page===17)return {topic:FILT.topic,source:FILT.src,sub:FILT.sub||'all'};
    return {topic:TR.topic,source:'all',sub:TR.sub};
  }
  function resetNative(task,filter) {
    root.OgeGeometryHelpUsed=false;
    if(page===16){TAB='train';trReview=false;trReviewEmpty=false;trTask=task;trFilter={topic:filter.topic,src:filter.source};trSubOnly=filter.sub==='all'?null:filter.sub;trAtt=2;trDone=false;trMissed=false;trArchSeen.clear();trArchNote=false;renderTrain();}
    else if(page===17){MODE='train';REVIEW.on=false;REVIEW.empty=false;CUR=task;FILT={topic:filter.topic,src:filter.source};if(filter.sub!=='all')FILT.sub=filter.sub;renderTrain(false);}
    else{MODE='train';REVIEW.on=false;REVIEW.empty=false;TR={topic:filter.topic,sub:filter.sub,task,hintUsed:false,exhausted:false,done:false,missed:false,shown:false};drawTrain();}
    doc.querySelectorAll('.tabs,.minimal-navigation,.pnote,.stats').forEach(node=>node.hidden=true);
    const summary=byId('courseSettings')?.querySelector('summary');if(summary)summary.textContent='Выбрать тему';
  }
  const initialKey=keyOf(nativeTask())||ids[0];
  const first=makeTask({key:initialKey,source:'generator',value:Math.floor(Math.random()*4294967296)});
  resetNative(first,{topic:'all',source:page===16?'mix':'all',sub:'all'});
  taskSeen=first;
  doc.body.classList.add('oge-board-practice');
  const note=doc.createElement('p');note.className='smallnote';note.id='oge-board-note';note.textContent='Совместная тренировка. Ответы и подсказки видны обоим участникам. Личный зачёт и результаты кабинета здесь не изменяются.';byId('main').before(note);
  const picker=doc.createElement('label');picker.className='ocg-answer-label';picker.textContent='Тип задачи ';const select=doc.createElement('select');select.id='oge-board-subtype';select.style.maxWidth='100%';select.style.width='100%';select.style.font='inherit';picker.style.display='block';
  const all=doc.createElement('option');all.value='all';all.textContent='Все типы';select.append(all);
  ids.forEach(key=>{const o=doc.createElement('option');o.value=key;o.textContent=types[key].name;select.append(o);});picker.append(select);byId('courseSettings')?.append(picker);
  select.addEventListener('change',()=>{
    const key=select.value==='all'?ids[Math.floor(Math.random()*ids.length)]:select.value;
    resetNative(makeTask({key,source:'generator',value:Math.floor(Math.random()*4294967296)}),{topic:'all',source:page===16?'gen':page===17?'gen':'all',sub:select.value});refreshTask();afterAction();
  });

  function details() { return Array.from(doc.querySelectorAll('#courseHintPanel details')).filter(d=>!d.matches('[data-geometry-model]')); }
  function getState() {
    refreshTask();
    const task=nativeTask(),description=descriptors.get(task);
    if(!description)throw new TypeError('Unregistered geometry task');
    return {task:copy(description),filter:filterState(),actions:copy(actions),answer:byId(inputId)?.value||'',helpUsed:taskHelp,helpOpen:!byId('courseHintPanel')?.hidden,settingsOpen:!!byId('courseSettings')?.open,details:details().map(d=>d.open),referenceZoom:Array.from(doc.querySelectorAll('#courseHintPanel .ocr-zoom')).map(b=>b.getAttribute('aria-pressed')==='true'),model:root.OgeGeometryDiscovery.captureState()};
  }
  function plain(value) { return value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value)); }
  function exact(value,keys) {
    if(!plain(value)||Reflect.ownKeys(value).length!==keys.length)return false;
    return keys.every(key=>{const p=Object.getOwnPropertyDescriptor(value,key);return p&&p.enumerable&&Object.prototype.hasOwnProperty.call(p,'value');});
  }
  function safe(value,depth=0) {
    if(depth>8)return false;
    if(value===null||typeof value==='boolean')return true;
    if(typeof value==='number')return Number.isFinite(value);
    if(typeof value==='string')return value.length<=80&&!/[<>\u0000-\u001f]/.test(value);
    if(!plain(value)&&!Array.isArray(value))return false;
    const keys=Reflect.ownKeys(value);
    if(Array.isArray(value)&&(Object.getPrototypeOf(value)!==Array.prototype||value.length>256||keys.length!==value.length+1||!Array.from({length:value.length},(_,i)=>Object.prototype.hasOwnProperty.call(value,i)).every(Boolean)))return false;
    for(const key of keys){if(Array.isArray(value)&&key==='length')continue;const p=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||['__proto__','prototype','constructor'].includes(key)||!p.enumerable||!Object.prototype.hasOwnProperty.call(p,'value')||!safe(p.value,depth+1))return false;}
    return true;
  }
  function validHistory(value,task) {
    let closed=false,locked='',steps=0,misses=0,stepsBlocked=false;
    for(const [op,draft] of value.actions){
      if(closed&&(draft!==locked||op==='check'||op==='give'))return false;
      if(op==='check'){
        const parsed=parseAns(draft);
        const numeric=page===17?draft.trim()!==''&&(task.ansFmt==='concat'||parsed!==null):Number.isFinite(parsed);
        const correct=numeric&&(page===16?eqAns(parsed,task.ans):page===17?isRight(task,draft):near(parsed,task.ans,1e-6));
        if(correct){closed=true;locked=draft;}
        else if(numeric)misses++;
      }else if(op==='give'){
        if(page===16&&misses<2)return false;
        if(page===17)stepsBlocked=true;
        closed=true;locked=draft;
      }else if(op==='step'){
        if(page!==17||stepsBlocked||steps>=task.sol.length)return false;
        steps++;
        if(steps===task.sol.length){closed=true;locked=draft;}
      }else if(op!=='first'||page!==18)return false;
    }
    // Once the native checker/solution closes a task, its disabled answer
    // field cannot change. A shared packet cannot combine a correct verdict
    // with a different final draft or replay impossible post-completion checks.
    return !closed||value.answer===locked;
  }
  function prepare(value) {
    const fail=()=>{throw new TypeError('Invalid geometry board state');};
    if(!safe(value)||!exact(value,['task','filter','actions','answer','helpUsed','helpOpen','settingsOpen','details','referenceZoom','model']))fail();
    const t=value.task,f=value.filter;
    if(!exact(t,['key','source','value'])||!ids.includes(t.key)||!Number.isSafeInteger(t.value)||t.value<0||t.value>4294967295)fail();
    if(t.source==='archive'){if(!ARCHIVE[t.value]||ARCHIVE[t.value].sub!==t.key)fail();}
    else if(t.source==='prototype'){if(t.value!==0)fail();}
    else if(t.source!=='generator')fail();
    if(!exact(f,['topic','source','sub'])||!['all',...Object.keys(TOPICS)].includes(f.topic)||!['all',...ids].includes(f.sub)||!(page===16?['mix','arch','gen']:page===17?['all','arch','gen']:['all']).includes(f.source))fail();
    if(typeof value.answer!=='string'||['helpUsed','helpOpen','settingsOpen'].some(k=>typeof value[k]!=='boolean')||(value.helpOpen&&!value.helpUsed))fail();
    if(!Array.isArray(value.actions)||value.actions.length>128||!value.actions.every(a=>Array.isArray(a)&&a.length===3&&Object.keys(actionButtons).includes(a[0])&&typeof a[1]==='string'&&typeof a[2]==='boolean'))fail();
    if(!Array.isArray(value.details)||value.details.length>20||value.details.some(x=>typeof x!=='boolean')||(value.details.some(Boolean)&&!value.helpUsed))fail();
    // Only known code generates the future task and detached model. Validate
    // the complete semantic packet before touching any live state.
    const task=makeTask(t),i=info(task),configuration=root.OgeGeometryDiscovery.config(i),kind=configuration[0];
    const refs=doc.createElement('section');root.OgeCourseReference.topicCards(refs,configuration[1]);root.OgeCourseReference.sheetCards(refs,configuration[2]);
    if(value.details.length!==2+refs.querySelectorAll('details').length)fail();
    if(!Array.isArray(value.referenceZoom)||value.referenceZoom.length!==refs.querySelectorAll('.ocr-zoom').length||value.referenceZoom.some(x=>typeof x!=='boolean')||(value.referenceZoom.some(Boolean)&&!value.helpUsed))fail();
    if(!Number.isFinite(typeof task.ans==='string'?parseFloat(task.ans.replace(',','.')):task.ans)||!root.OgeGeometryDiscovery.validateState(value.model,{kind,shape:i.shape}))fail();
    if((value.actions.some(a=>a[0]!=='check'||a[2])||value.model?.open)&&!value.helpUsed)fail();
    const helped=value.actions.findIndex(a=>a[2]);if(helped>=0&&value.actions.slice(helped).some(a=>!a[2]))fail();
    if(!validHistory(value,task))fail();
    return {value:copy(value),task};
  }
  function applyState(incoming) {
    const prepared=prepare(incoming),value=prepared.value;
    root.clearTimeout(notifyTimer);notifyTimer=null;
    applying=true;
    try {
      resetNative(prepared.task,value.filter);
      taskSeen=prepared.task;actions=copy(value.actions);taskHelp=value.helpUsed;root.OgeGeometryHelpUsed=value.helpUsed;
      for(const [op,answer,help] of value.actions){root.OgeGeometryHelpUsed=help;const input=byId(inputId);if(input)input.value=answer;const button=byId(actionButtons[op]);if(button&&!button.disabled)button.click();}
      root.OgeGeometryHelpUsed=value.helpUsed;
      const input=byId(inputId);if(input)input.value=value.answer;
      if(value.helpOpen&&byId('courseHintPanel')?.hidden)byId('courseHintToggle').click();
      details().forEach((d,index)=>d.open=!!value.details[index]);
      root.OgeGeometryDiscovery.applyState(value.model);
      doc.querySelectorAll('#courseHintPanel .ocr-zoom').forEach((button,index)=>{if((button.getAttribute('aria-pressed')==='true')!==value.referenceZoom[index])button.click();});
      if(byId('courseSettings'))byId('courseSettings').open=value.settingsOpen;
      select.value=value.filter.sub;
      previous=JSON.stringify(getState());
    } finally {applying=false;}
  }
  root.OgeGeometryBoard=Object.freeze({getState,applyState,validateState:value=>{try{prepare(value);return true;}catch(_){return false;}}});
  root.getBoardTrainerState=getState;root.applyBoardTrainerState=applyState;
  previous=JSON.stringify(getState());
  root.MathExamBoard.register({id:'oge-task'+page+'-'+({16:'circle',17:'quadrilaterals',18:'grid'}[page]),version:'1.0.0',stateSchemaVersion:1,parentOrigin:root.location.origin,getState,applyState,subscribe:callback=>{notify=callback;return()=>{notify=function(){};};}});
})(window,document);
