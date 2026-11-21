/* Vilenkin 5 learning details. Canonical tasks and legacy mastery stay in the workshop. */
(function (root) {
  'use strict';
  const KEY='mathexam.vilenkin5.quality.v1', MODES=['learn','practice','check','review'];
  const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
  const integer=(x,a,b)=>Number.isSafeInteger(x)&&x>=a&&x<=b;
  const text=(x,max=400)=>typeof x==='string'&&x.length<=max&&!/<\/?[a-z][^>]*>/i.test(x);
  const copy=x=>JSON.parse(JSON.stringify(x));
  const safeDraft=(value,max=400)=>String(value).slice(0,max).replace(/<\/?[a-z][^>]*>/gi,tag=>tag.replace(/</g,'‹').replace(/>/g,'›'));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safe(value,depth=0,seen=new Set()) {
    if(depth>8)throw new TypeError('State is too deep');
    if(value===null||typeof value==='boolean')return;
    if(typeof value==='string'){if(!text(value,4000))throw new TypeError('Invalid text');return;}
    if(typeof value==='number'){if(!Number.isFinite(value))throw new TypeError('Invalid number');return;}
    if((!plain(value)&&!Array.isArray(value))||seen.has(value))throw new TypeError('Invalid JSON state');
    seen.add(value);
    for(const key of Reflect.ownKeys(value)){
      if(Array.isArray(value)&&key==='length')continue;
      const p=Object.getOwnPropertyDescriptor(value,key);
      if(typeof key!=='string'||['__proto__','prototype','constructor'].includes(key)||!p.enumerable||!Object.prototype.hasOwnProperty.call(p,'value'))throw new TypeError('Invalid state property');
      safe(p.value,depth+1,seen);
    }
    seen.delete(value);
  }
  function createCore({curriculum:C,math:M,models:Models}) {
    if(!C?.byId||!M?.generate||!Models?.normalize||!Models?.defaults)throw new TypeError('Incomplete Vilenkin quality dependencies');
    const lesson=id=>typeof id==='string'&&C.byId[id]?.v5Course?C.byId[id]:null;
    const mediaDefault=()=>({id:'',frame:0,open:false,playing:false});
    function validRoute(route){
      if(route==='#course/vilenkin5')return true;
      const unit=typeof route==='string'&&/^#v5-unit\/([1-9]\d?)$/.exec(route);
      if(unit)return unit[0]===route&&integer(Number(unit[1]),1,53);
      const match=typeof route==='string'&&/^#lesson\/(v5f-[a-z0-9-]+)$/.exec(route);
      return !!match&&match[0]===route&&!!lesson(match[1]);
    }
    function freshScene(id,mode='learn',seed=0){
      const l=lesson(id);if(!l||!MODES.includes(mode)||!integer(seed,0,1000000))throw new TypeError('Invalid lesson scene');
      return {id,mode,seed,step:0,attempt:0,correct:false,assisted:false,exposed:false,savedInput:'',answers:[],hintLevels:{},checkIndex:0,model:Models.defaults(l),media:mediaDefault(),firstAttempt:null,firstWrong:null,note:'',message:'',remedy:'',claim:'',panels:{notes:false,theory:false,claim:false,error:false,history:false}};
    }
    function normalizeScene(raw){
      if(!plain(raw)||!lesson(raw.id)||!MODES.includes(raw.mode)||!integer(raw.seed,0,1000000))throw new TypeError('Unknown lesson scene');
      const base=freshScene(raw.id,raw.mode,raw.seed),allowed=new Set(Object.keys(base));
      if(Object.keys(raw).some(k=>!allowed.has(k)))throw new TypeError('Unknown scene field');
      const s={...base,...raw},task=M.generate(s.id,s.seed),parts=[...task.steps,task],target=s.mode==='learn'?parts[s.step]:task;
      if(!integer(s.step,0,task.steps.length)||s.mode!=='learn'&&s.step!==0||!integer(s.attempt,0,100)||!integer(s.checkIndex,0,2)||['learn','practice'].includes(s.mode)&&s.checkIndex!==0)throw new TypeError('Invalid lesson step');
      for(const key of ['correct','assisted','exposed'])if(typeof s[key]!=='boolean')throw new TypeError('Invalid result flag');
      if(!text(s.savedInput)||!text(s.note,2000)||!text(s.message,800)||!text(s.remedy,80)||s.remedy&&!C.byId[s.remedy]||!['','true','false'].includes(s.claim))throw new TypeError('Invalid scene text');
      if(!Array.isArray(s.answers)||s.answers.length>parts.length||s.answers.some(v=>!text(v)))throw new TypeError('Invalid completed steps');
      if(s.mode!=='learn'&&s.answers.length||s.answers.length>s.step+Number(s.correct)||s.answers.length<s.step)throw new TypeError('Steps from another mode');
      for(let i=0;i<Math.min(s.step,s.answers.length);i++)if(!s.answers[i]||!M.accepts(s.answers[i],parts[i]))throw new TypeError('Incorrect completed step');
      if(s.correct&&(!s.attempt||!M.accepts(s.savedInput,target)))throw new TypeError('Impossible completed answer');
      if(!plain(s.hintLevels)||Object.keys(s.hintLevels).length>parts.length)throw new TypeError('Invalid hints');
      for(const [key,value]of Object.entries(s.hintLevels))if(!(s.mode==='learn'?/^(0|[1-9]\d?)$/.test(key)&&Number(key)<=s.step:key==='check')||!integer(value,1,3))throw new TypeError('Invalid hint level');
      if(s.firstAttempt!==null){const a=s.firstAttempt;if(!plain(a)||Object.keys(a).some(k=>!['value','correct','assisted'].includes(k))||!text(a.value)||!a.value.trim()||typeof a.correct!=='boolean'||typeof a.assisted!=='boolean'||a.correct!==M.accepts(a.value,target)||!s.attempt)throw new TypeError('Invalid first attempt');s.firstAttempt={value:a.value,correct:a.correct,assisted:a.assisted};}
      if(s.firstWrong!==null){const a=s.firstWrong;if(!plain(a)||Object.keys(a).some(k=>!['value','step'].includes(k))||!text(a.value)||!a.value.trim()||!integer(a.step,0,s.step)||M.accepts(a.value,s.mode==='learn'?parts[a.step]:task))throw new TypeError('Invalid first mistake');s.firstWrong={value:a.value,step:a.step};}
      if(!plain(s.media)||Object.keys(s.media).some(k=>!['id','frame','open','playing'].includes(k))||!text(s.media.id,100)||s.media.id!==''&&s.media.id!=='u'+String(lesson(s.id).point).padStart(2,'0')||!integer(s.media.frame,0,4)||typeof s.media.open!=='boolean'||typeof s.media.playing!=='boolean'||s.media.playing&&!s.media.open)throw new TypeError('Invalid media scene');
      s.media={id:s.media.id,frame:s.media.frame,open:s.media.open,playing:s.media.playing};
      if(!plain(s.panels)||Object.keys(s.panels).some(k=>!['notes','theory','claim','error','history'].includes(k))||Object.values(s.panels).some(v=>typeof v!=='boolean'))throw new TypeError('Invalid panels');
      s.panels={...base.panels,...s.panels};
      s.model=Models.normalize(lesson(s.id),s.model);
      s.assisted=s.assisted||Object.keys(s.hintLevels).length>0||s.firstAttempt?.assisted===true||!s.correct&&s.mode!=='learn'&&s.media.open;
      s.answers=s.answers.slice();s.hintLevels={...s.hintLevels};
      return s;
    }
    function validateState(raw){
      safe(raw);
      if(!plain(raw)||Object.keys(raw).some(k=>!['version','route','scene'].includes(k))||raw.version!==1||!validRoute(raw.route))throw new TypeError('Invalid Vilenkin scene');
      const scene=raw.scene===null?null:normalizeScene(raw.scene);
      if(raw.route.startsWith('#lesson/')?(!scene||raw.route!=='#lesson/'+scene.id):scene!==null)throw new TypeError('Route and lesson differ');
      const result={version:1,route:raw.route,scene};
      const serialized=JSON.stringify(result),bytes=typeof TextEncoder!=='undefined'?new TextEncoder().encode(serialized).length:unescape(encodeURIComponent(serialized)).length;
      if(bytes>60*1024)throw new TypeError('Scene exceeds transport limit');
      return result;
    }
    return {freshScene,validateState,normalizeScene,validRoute,lesson};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createCore,KEY};
  if(!root.document)return;
  const C=root.WorkshopCurriculum,M=root.WorkshopMath,Models=root.Vilenkin5QualityModels;
  if(!C||!M||!Models)return;
  const core=createCore({curriculum:C,math:M,models:Models});
  const memoryOnly=root.self!==root.top||root.document.body.hasAttribute('data-vilenkin5-board');
  let connection=null,readOnly=false,applying=false,storageOK=true,storeLoaded=false,lastRaw=null,cleanupModel=null;
  let records={},last='',listeners=new Set(),active=null,pendingWarning='';
  const warn=message=>{pendingWarning=message;const host=root.document.getElementById('notice');if(host&&core.validRoute(root.location.hash))host.textContent=message;};
  const isLegacy=session=>!!(session&&core.lesson(session.id)&&session.mode==='learn'&&session.legacySteps>0&&(!session.answers||session.answers.length<session.step||Array.from({length:session.step},(_,i)=>!session.answers[i]).some(Boolean)));
  function normalizeStore(raw){
    safe(raw);
    if(!plain(raw)||raw.version!==1||!plain(raw.records)||Object.keys(raw.records).length>536||!text(raw.last,100))throw new TypeError('Invalid Vilenkin learning copy');
    const next={};for(const [key,value]of Object.entries(raw.records)){const s=core.normalizeScene(value);if(key!==s.id+':'+s.mode)throw new TypeError('Invalid saved lesson key');next[key]=s;}
    if(raw.last&&!next[raw.last])throw new TypeError('Invalid last lesson');
    return {version:1,records:next,last:raw.last};
  }
  function loadStore(){
    if(memoryOnly||storeLoaded)return;
    storeLoaded=true;
    try{lastRaw=root.localStorage.getItem(KEY);if(lastRaw){if(lastRaw.length>2500000)throw Error('size');const s=normalizeStore(JSON.parse(lastRaw));records=s.records;last=s.last;}}catch(_){storageOK=false;warn('Дополнительные записи курса не удалось прочитать. Исходная копия сохранена. Новую работу можно продолжить и скачать.');}
  }
  const canUsePersonal=()=>!memoryOnly&&connection?.canUsePersonal?.()!==false;
  function persist(){
    if(memoryOnly||!storageOK||applying)return;
    try{
      if(root.localStorage.getItem(KEY)!==lastRaw){storageOK=false;warn('Работа обновилась в другой вкладке. Текущий черновик остаётся здесь; скачай копию перед обновлением страницы.');return;}
      const raw=JSON.stringify({version:1,records,last});if(raw.length>2500000)throw Error('size');root.localStorage.setItem(KEY,raw);lastRaw=raw;
    }catch(_){storageOK=false;warn('Браузер не смог сохранить последние изменения. Работа остаётся на экране; скачай её копию.');}
  }
  function fromSession(session){
    if(!session||!core.lesson(session.id)||!MODES.includes(session.mode))return null;
    const seed=core.freshScene(session.id,session.mode,session.seed),old=session.v5Detail||{};
    for(const key of ['step','attempt','correct','assisted','exposed','savedInput','answers','hintLevels','checkIndex','message','remedy'])if(session[key]!==undefined)seed[key]=session[key];
    for(const key of ['model','media','firstAttempt','firstWrong','note','claim','panels'])if(old[key]!==undefined)seed[key]=old[key];
    // A new step has a new first attempt. The first mathematical mistake remains visible.
    if(old.atStep!==session.step)seed.firstAttempt=null;
    seed.attempt=Math.min(100,seed.attempt);
    return core.normalizeScene(seed);
  }
  function getState(){
    const route=core.validRoute(root.location.hash)?root.location.hash:'#course/vilenkin5';
    const session=connection?.getSession?.();if(isLegacy(session))return {version:1,route:'#course/vilenkin5',scene:null};
    const scene=route.startsWith('#lesson/')&&session?.id===route.slice(8)?fromSession(session):null;
    return core.validateState({version:1,route:scene?route:route.startsWith('#lesson/')?'#course/vilenkin5':route,scene});
  }
  function emit(){if(applying)return;for(const fn of listeners){try{fn(getState());}catch(_){/* Transport observers must not break local work. */}}}
  function checkpoint(session){
    if(applying||!session||isLegacy(session)||!core.lesson(session.id)||!MODES.includes(session.mode))return;
    const scene=fromSession(session);active=session;
    if(canUsePersonal()&&connection?.canPersistSession?.(session)!==false){loadStore();const key=scene.id+':'+scene.mode;delete records[key];records[key]=scene;last=key;persist();}
    emit();
  }
  function restore(id,mode){
    if(!canUsePersonal())return null;
    loadStore();
    if(id==='vilenkin5'){const saved=records[last];return saved?restore(saved.id,saved.mode):null;}
    let s=mode?records[id+':'+mode]:Object.values(records).filter(r=>r.id===id).at(-1);
    if(!mode&&last.startsWith(id+':'))s=records[last];
    if(!s||['check','review'].includes(s.mode)&&s.checkIndex===2&&s.correct)return null;
    const draft=toSession(core.normalizeScene(s));
    return connection?.reconcilePersonal?connection.reconcilePersonal(draft):draft;
  }
  function toSession(s){
    const task=M.generate(s.id,s.seed);
    return {id:s.id,mode:s.mode,seed:s.seed,task,step:s.step,attempt:s.attempt,correct:s.correct,assisted:s.assisted,exposed:s.exposed,savedInput:s.savedInput,answers:s.answers.slice(),hintLevels:{...s.hintLevels},checkIndex:s.checkIndex,message:memoryOnly&&s.correct&&s.mode!=='learn'?'Верно. Совместный разбор.':s.message,remedy:s.remedy,claimAnswered:!!s.claim,diagnostic:null,
      v5Detail:{model:copy(s.model),media:copy(s.media),firstAttempt:s.firstAttempt&&copy(s.firstAttempt),firstWrong:s.firstWrong&&copy(s.firstWrong),note:s.note,claim:s.claim,panels:copy(s.panels),atStep:s.step}};
  }
  function applyState(raw){
    const snapshot=core.validateState(raw);if(!connection)throw new Error('Vilenkin runtime is not connected');
    applying=true;
    try{cleanupModel?.();cleanupModel=null;active=snapshot.scene?toSession(snapshot.scene):null;connection.applyScene(snapshot.route,active);}
    finally{applying=false;}
    enforceReadOnly();
  }
  function detail(session){
    if(!session.v5Detail){const fresh=core.freshScene(session.id,session.mode,session.seed);session.v5Detail={model:fresh.model,media:fresh.media,firstAttempt:null,firstWrong:null,note:'',claim:'',panels:fresh.panels,atStep:session.step};}
    return session.v5Detail;
  }
  function inputIssue(value,target){
    if(!text(value)||!value.trim())return 'Сначала запиши ответ. Пустое поле не считается ошибкой.';
    if(target.scaleChoice){
      const multiplier=M.parse(value), {divisor,powers}=target.scaleChoice;
      const listed=multiplier?.d===1&&powers.includes(multiplier.n);
      // Both fractions are reduced. Cross-divisibility tests their product without rounding.
      if(multiplier?.n>0&&!listed&&multiplier.n%divisor.d===0&&divisor.n%multiplier.d===0)
        return 'С таким множителем делитель тоже целый. Для переноса запятой выбери подходящее число из списка.';
    }
    if(typeof target.answer==='number'||plain(target.answer)&&'n'in target.answer){if(!M.parse(value))return 'Запись пока не распознана. Введи число или точную дробь. Это не считается математической ошибкой.';}
    if(target.answerFormat&&M.equal(value,target.answer)&&!M.accepts(value,target))return 'Значение верное. Проверь требуемую запись ответа — это ещё не математическая ошибка.';
    return '';
  }
  function recordAttempt(session,value,target,correct){
    if(isLegacy(session)||!MODES.includes(session.mode))return;
    const d=detail(session);if(d.atStep!==session.step){d.firstAttempt=null;d.atStep=session.step;}
    if(!d.firstAttempt)d.firstAttempt={value,correct,assisted:!!session.assisted};
    if(!correct&&!d.firstWrong)d.firstWrong={value,step:session.step};
  }
  function markHelp(){const s=connection?.getSession?.();if(!s||!core.lesson(s.id)||readOnly)return;if(!s.correct)s.assisted=true;connection.save?.();}
  function updateMedia(value,helped=false){
    const s=connection?.getSession?.();if(!s||!core.lesson(s.id)||!MODES.includes(s.mode)||isLegacy(s)||readOnly)return;
    const normalized=core.normalizeScene({...fromSession(s),media:value});detail(s).media=normalized.media;
    if(helped&&!s.correct)s.assisted=true;connection.save?.();
  }
  function mathText(scope){
    const walker=root.document.createTreeWalker(scope,root.NodeFilter.SHOW_TEXT),nodes=[];let node;
    while((node=walker.nextNode()))if(/\d\s*\/\s*\d/.test(node.nodeValue)&&!node.parentElement.closest('svg,script,style,textarea,input,option,.v5q-fraction'))nodes.push(node);
    for(const node of nodes){const fragment=root.document.createDocumentFragment(),pattern=/(\d+)\s*\/\s*(\d+)/g,value=node.nodeValue;let pos=0,m;while((m=pattern.exec(value))){fragment.append(value.slice(pos,m.index));const wrap=root.document.createElement('span');wrap.innerHTML=Models.fractionHTML(m[1],m[2]);fragment.append(wrap.firstElementChild);pos=m.index+m[0].length;}fragment.append(value.slice(pos));node.replaceWith(fragment);}
  }
  function enforceReadOnly(){
    root.document.documentElement.dataset.vilenkin5Readonly=String(readOnly);
    const host=root.document.getElementById('main');if(!host?.hasAttribute('data-v5-quality'))return;
    host.querySelectorAll('input,textarea,select,button').forEach(el=>{
      if(readOnly){if(!el.disabled)el.dataset.v5ReadonlyDisabled='1';el.disabled=true;}
      else if(el.dataset.v5ReadonlyDisabled){delete el.dataset.v5ReadonlyDisabled;el.disabled=false;}
    });
  }
  function mountModel(host,lesson,session){
    cleanupModel?.();
    if(isLegacy(session)){root.WorkshopModels.mount(host,session.task.model);cleanupModel=null;return;}
    const cleanInput=event=>{if('value'in event.target&&event.target.type!=='number'&&event.target.type!=='range'){const safe=safeDraft(event.target.value);if(safe!==event.target.value)event.target.value=safe;}};
    host.addEventListener('input',cleanInput,true);
    const d=detail(session),captured=session;
    const dispose=Models.mount(host,lesson,{state:d.model,onChange:value=>{
      if(readOnly||captured!==connection?.getSession?.())return;
      d.model=Models.normalize(lesson,value);connection.save?.();
    }});
    cleanupModel=()=>{host.removeEventListener('input',cleanInput,true);dispose?.();};
  }
  function decorate(host,lesson,session){
    if(pendingWarning)warn(pendingWarning);
    if(!MODES.includes(session.mode)){host.dataset.v5Quality='diagnostic';root.document.body.classList.add('v5-quality-active');return;}
    if(isLegacy(session)){host.dataset.v5Quality='legacy';root.document.body.classList.add('v5-quality-active');host.querySelector('.lesson-head')?.insertAdjacentHTML('beforeend','<p class="panel" data-v5-legacy>Продолжаем сохранённый разбор. В старой записи нет текста некоторых выполненных шагов, поэтому ответы за тебя не подставляются. Можно закончить этот разбор; новое условие или режим откроет исследования с полным сохранением.</p>');return;}
    active=session;host.dataset.v5Quality='lesson';root.document.body.classList.add('v5-quality-active');
    const head=host.querySelector('.lesson-head'),task=host.querySelector('#task-panel'),model=host.querySelector('#model'),theory=host.querySelector('.v6-theory'),claim=host.querySelector('#claim-feedback')?.closest('section'),d=detail(session);
    const modes={learn:'1 · Разберись',practice:'2 · Потренируйся',check:'3 · Проверь себя'};
    head.querySelectorAll('[data-cmd=mode]').forEach(b=>{b.textContent=modes[b.dataset.value];b.classList.add('v5q-mode');b.classList.toggle('is-current',b.dataset.value===session.mode);b.setAttribute('aria-pressed',String(b.dataset.value===session.mode));});
    head.insertAdjacentHTML('beforeend','<p class="v5q-source">Часть '+lesson.source.part+' · '+(lesson.point<=51?'пункт '+lesson.point:'дополнительный практикум')+' · '+(lesson.source.page!=='—'?'страница '+lesson.source.page:'переход в шестой класс')+'</p>');
    if(theory){const box=root.document.createElement('details');box.className='v5q-theory';box.innerHTML='<summary>Правило и разобранный пример</summary>';theory.before(box);box.append(theory);}
    if(claim){const box=root.document.createElement('details');box.className='v5q-theory';box.innerHTML='<summary>Объясни правило своими словами</summary>';claim.before(box);box.append(claim);if(d.claim)claim.querySelector('#claim-feedback').textContent=(String(lesson.claimTrue)===d.claim?'Да, верно определено. ':'Посмотри ещё раз на объяснение. ')+lesson.explanation;}
    const workspace=root.document.createElement('div');workspace.className='v5q-workspace';head.after(workspace);if(model)workspace.append(model);workspace.append(task);if(!model)workspace.classList.add('v5q-solo');
    const original=session.task.model;
    if(model && !memoryOnly && original?.kind==='v5lab' && ['fraction','decimal','angle'].includes(original.family)){
      const lab=root.document.createElement('details');
      lab.className='v5q-theory';
      lab.dataset.v5OriginalLab='';
      const summary=root.document.createElement('summary');
      summary.textContent={fraction:'Лаборатория дробей: доли и действия',decimal:'Лаборатория разрядов и обменов',angle:'Построение угла по шкале'}[original.family];
      const canvas=root.document.createElement('div');
      lab.append(summary,canvas);
      workspace.after(lab);
      lab.addEventListener('toggle',()=>{
        if(lab.open && !canvas.firstChild)root.WorkshopModels.mount(canvas,original);
      });
    }
    const target=session.mode==='learn'?[...session.task.steps,session.task][session.step]:session.task;
    task.querySelector('label[for=answer]').textContent=target.inputPrompt||target.prompt;
    task.querySelector('[data-cmd=hint]')?.replaceChildren('Хочешь подсказку?');
    if(['check','review'].includes(session.mode))task.insertAdjacentHTML('afterbegin','<div class="v5q-check-trail" aria-label="Проверка: вопрос '+(session.checkIndex+1)+' из 3">'+[0,1,2].map(i=>'<span class="'+(i===session.checkIndex?'is-current':i<session.checkIndex?'is-complete':'')+'">'+(i+1)+'</span>').join('')+'<b>Вопрос '+(session.checkIndex+1)+' из 3</b></div>');
    if(d.firstWrong)task.insertAdjacentHTML('beforeend','<details class="v5q-error-note"><summary>Моя первая ошибка</summary><p>В шаге '+(d.firstWrong.step+1)+' был ответ <strong>'+esc(d.firstWrong.value)+'</strong>. Объясни, что нужно изменить в рассуждении.</p></details>');
    if(session.correct){const status=memoryOnly?'Совместный разбор':session.assisted?'Решено с помощью':session.exposed?'Работа со знакомым условием':session.attempt>1?'Решено после исправления':session.mode==='learn'?'Шаг понятен':'Получилось самостоятельно';task.insertAdjacentHTML('beforeend','<p class="v5q-outcome">'+status+'</p>');}
    const extra=root.document.createElement('section');extra.className='v5q-notes';extra.innerHTML='<details><summary>Мои рассуждения и проверка</summary><label>Объясни способ своими словами. Как проверить результат?<textarea id="v5-quality-note" maxlength="2000" rows="3"></textarea></label><p class="tiny">Твои записи сохраняются. Свободное объяснение проверяется вместе с учителем.</p></details><div data-v5-media-host></div>';
    workspace.after(extra);const note=extra.querySelector('textarea');note.value=d.note;note.oninput=()=>{if(readOnly)return;d.note=safeDraft(note.value,2000);if(note.value!==d.note)note.value=d.note;connection.save?.();};
    const panels={notes:extra.querySelector('details'),theory:host.querySelector('.v5q-theory'),claim:claim?.closest('details'),error:host.querySelector('.v5q-error-note'),history:host.querySelector('.v6-history')};
    for(const [key,panel]of Object.entries(panels))if(panel){panel.open=!!d.panels?.[key];panel.addEventListener('toggle',()=>{if(readOnly||session!==connection?.getSession?.()||applying)return;d.panels=d.panels||{};if(d.panels[key]===panel.open)return;d.panels[key]=panel.open;connection.save?.();});}
    mathText(host);enforceReadOnly();
    root.dispatchEvent(new root.CustomEvent('vilenkin5:scene-rendered',{detail:{id:lesson.id,mode:session.mode}}));
  }
  function courseView(host,path){
    host.dataset.v5Quality='course';root.document.body.classList.add('v5-quality-active');
    const hero=host.querySelector('.v5-hero');
    hero?.insertAdjacentHTML('beforeend','<div class="v5q-course-path"><span>Исследуй закономерность</span><span>Собери решение по шагам</span><span>Реши новое условие</span></div>');
    if(hero){const quick=root.document.createElement('section');quick.className='panel v5q-start';quick.innerHTML='<h2>С чего начнём сегодня?</h2><div class="v5q-quick-links"><a href="#v5-unit/1"><strong>Начало пятого класса</strong><span>Таблицы, разряды, измерения</span></a><a href="#lesson/v5f-division-column"><strong>Деление уголком</strong><span>Подбор цифры, нули в частном, проверка</span></a><a href="#v5-unit/26"><strong>Вторая часть: дроби</strong><span>Доля, целое и действия с дробями</span></a><a href="#v5-unit/41"><strong>Десятичные дроби</strong><span>Разряды, вычисления и округление</span></a></div><p>Полный год: 51 пункт, 134 занятия. Выбирай тему по учебнику или продолжай сохранённую работу.</p>';hero.after(quick);}
    host.querySelectorAll('.v5-unit-card').forEach(card=>{const point=Number(card.getAttribute('href').split('/')[1]),unit=path.units.find(u=>u.point===point);if(unit){const n=unit.ids.length,ending=n%100>=11&&n%100<=14?'занятий':n%10===1?'занятие':n%10>=2&&n%10<=4?'занятия':'занятий';card.querySelector('p').textContent=n+' '+ending;card.insertAdjacentHTML('beforeend','<small>Часть '+unit.part+(unit.page?' · с. '+unit.page:'')+'</small>');}});
    if(memoryOnly){host.querySelectorAll('.v5-achievements').forEach(x=>x.closest('section').remove());host.querySelectorAll('[data-cmd="course-diagnostic"],[data-cmd="resume-vilenkin"]').forEach(x=>x.remove());}
    enforceReadOnly();emit();
  }
  function routeRendered(host){
    const hash=root.location.hash,isV5=core.validRoute(hash);
    const notice=root.document.getElementById('notice');if(isV5&&pendingWarning)warn(pendingWarning);else if(!isV5&&notice?.textContent===pendingWarning)notice.textContent='';
    root.document.body.classList.toggle('v5-quality-active',isV5);if(!isV5)host.removeAttribute('data-v5-quality');
    if(isV5&&!hash.startsWith('#lesson/')){cleanupModel?.();cleanupModel=null;host.dataset.v5Quality=hash.startsWith('#v5-unit/')?'unit':'course';}
    if(memoryOnly&&(isV5||root.document.body.hasAttribute('data-vilenkin5-board'))){
      root.document.querySelectorAll('a[href^="#"]').forEach(a=>{const href=a.getAttribute('href');if(href==='#main')return;if(!core.validRoute(href)){a.dataset.v5OriginalHref=href;a.href='#course/vilenkin5';if(a.closest('.brand,.sidebar')||a.matches('.brand'))a.textContent='Виленкин · 5 класс';else a.hidden=true;}});
      host.querySelectorAll('[data-cmd="prerequisite"]').forEach(b=>{if(!core.lesson(b.dataset.value))b.hidden=true;});
      host.querySelectorAll('[data-cmd="course-diagnostic"],[data-cmd="diagnostic"]').forEach(b=>b.hidden=true);
    }
    enforceReadOnly();emit();
  }
  function importState(raw){
    const incoming=normalizeStore(raw);loadStore();
    records=incoming.records;last=incoming.last;
    // Corrupt original storage remains untouched; importing is still useful in memory.
    persist();return {imported:Object.keys(records).length};
  }
  root.addEventListener('storage',event=>{if(!memoryOnly&&event.key===KEY){storageOK=false;warn('Работа курса изменилась в другой вкладке. Твой черновик остаётся здесь; сохрани копию перед обновлением.');}});
  const block=event=>{if(!readOnly||!event.target.closest?.('#main[data-v5-quality]'))return;if(event.type==='keydown'&&['Tab','Escape','PageUp','PageDown'].includes(event.key))return;event.preventDefault();event.stopImmediatePropagation();};
  ['click','input','beforeinput','change','submit','keydown'].forEach(type=>root.document.addEventListener(type,block,true));
  root.Vilenkin5Quality={
    version:1,key:KEY,memoryOnly,createCore,safeDraft,isLegacy,...core,getState,applyState,checkpoint,restore,mountModel,decorate,courseView,routeRendered,inputIssue,recordAttempt,markHelp,updateMedia,
    connect(value){connection=value;},
    subscribe(fn){if(typeof fn!=='function')throw new TypeError('Observer must be a function');listeners.add(fn);return()=>listeners.delete(fn);},
    setReadOnly(value){readOnly=!!value;enforceReadOnly();},
    setClaim(session,value){detail(session).claim=value;checkpoint(session);},
    exportState(){loadStore();return copy({version:1,records,last});},importState,
    validateStore:normalizeStore,
    finish(session){checkpoint(session);},
    destroyModel(){cleanupModel?.();cleanupModel=null;},
    changed:emit
  };
})(typeof window!=='undefined'?window:globalThis);

// Scope the site navigator's flow layout to Vilenkin 5. Leaving the course
// restores the same host to its original place and removes only our styles.
(function(root){
  'use strict';
  const document=root.document;
  if(!document)return;
  let placement=null;
  function move(host,parent,before){
    const focused=document.activeElement===host?host.shadowRoot.activeElement:null;
    parent.insertBefore(host,before?.parentNode===parent?before:null);
    focused?.focus({preventScroll:true});
  }
  function restore(){
    if(!placement)return;
    const {host,parent,next,header,properties,hadStyleAttribute,style}=placement;
    placement=null;style.remove();
    for(const [name,value,priority]of properties){if(value)header.style.setProperty(name,value,priority);else header.style.removeProperty(name);}
    if(!hadStyleAttribute&&!header.style.length)header.removeAttribute('style');
    move(host,parent.isConnected?parent:document.body,next);
  }
  function placeNavigator(){
    const host=document.getElementById('maxexam-public-assistant'),header=document.querySelector('header.top');
    if(!document.body.classList.contains('v5-quality-active')){restore();return;}
    if(!host?.shadowRoot||!header)return;
    if(placement?.host===host&&placement.header===header)return;
    restore();
    const style=document.createElement('style');style.dataset.courseNavigatorFlow='vilenkin5';
    style.textContent=':host{display:inline-flex!important;position:static!important;contain:none!important;min-height:0!important;min-width:0;max-width:100%;align-self:center}.launcher{position:static;inset:auto;z-index:auto;display:flex;width:auto;height:auto;min-height:44px;max-width:100%;padding:8px 12px;gap:8px;border-radius:12px;box-shadow:none}.launcher-mark{width:24px;height:24px;flex:0 0 24px;font-size:20px}.launcher-label{position:static;display:block;width:auto;height:auto;overflow:visible;clip-path:none;white-space:normal;line-height:1.3}.launcher-label strong{font-size:16px}.launcher-label>span{display:none}';
    placement={host,parent:host.parentNode,next:host.nextSibling,header,style,hadStyleAttribute:header.hasAttribute('style'),properties:['flex-wrap','gap'].map(name=>[name,header.style.getPropertyValue(name),header.style.getPropertyPriority(name)])};
    header.style.setProperty('flex-wrap','wrap');header.style.setProperty('gap','12px');
    host.shadowRoot.append(style);move(host,header,null);
  }
  function start(){
    new root.MutationObserver(placeNavigator).observe(document.body,{childList:true,attributes:true,attributeFilter:['class']});
    placeNavigator();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
