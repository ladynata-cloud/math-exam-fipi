/* OGE 20–22: bounded native practice state. The packet contains a module/seed,
 * typed drafts and locally validated learning actions, never peer markup,
 * answer keys, native closures or personal progress. Detached reconstruction
 * verifies the entire history before replacing the visible task. */
(function (root, doc) {
  'use strict';
  const native = root.Oge2022Native;
  if (!root.OgeCourseSharedMode || !native) return;
  const common = root.OgeCourseAlgebraShared;
  if (!common) throw new Error('Shared algebra support is unavailable');
  const excluded = '.oca-work,.oca-exploration,.oca-reference,.oca-instruction';
  const copy = value => JSON.parse(JSON.stringify(value));
  const plain = value => value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value));
  const exact = (value, keys) => plain(value) && Reflect.ownKeys(value).length === keys.length && keys.every(k => {const p=Object.getOwnPropertyDescriptor(value,k);return p&&p.enumerable&&Object.prototype.hasOwnProperty.call(p,'value');});
  const text = value => typeof value === 'string' && value.length <= 120 && !/[<>\u0000-\u001f]/.test(value);
  const key = value => typeof value === 'string' && /^(?:check|help|choice|format|action|text|number|range|select|radio|checkbox|textarea|detail):\d{1,4}$/.test(value);
  function safe(value, depth=0) {
    if(depth>7)return false;
    if(value===null||typeof value==='boolean')return true;
    if(typeof value==='number')return Number.isFinite(value);
    if(typeof value==='string')return value.length<=7000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
    if(!plain(value)&&!Array.isArray(value))return false;
    const keys=Reflect.ownKeys(value);
    if(Array.isArray(value)&&(Object.getPrototypeOf(value)!==Array.prototype||value.length>256||keys.length!==value.length+1||!Array.from({length:value.length},(_,i)=>Object.prototype.hasOwnProperty.call(value,i)).every(Boolean)))return false;
    return keys.every(k=>{if(Array.isArray(value)&&k==='length')return true;const p=Object.getOwnPropertyDescriptor(value,k);return typeof k==='string'&&!['__proto__','prototype','constructor'].includes(k)&&p&&p.enumerable&&Object.prototype.hasOwnProperty.call(p,'value')&&safe(p.value,depth+1);});
  }
  const fail = () => {throw new TypeError('Invalid OGE native practice state');};
  const uint = value => Number.isSafeInteger(value)&&value>=0&&value<=4294967295;
  const modules = new Map(native.modules.map(x=>[x.key,x]));
  let current, applying=false, forwarding=false, notify=()=>{}, previous='', scheduled=false;
  const host=doc.querySelector(native.host);
  if(!host)throw new Error('Native practice host is missing');
  if(native.hide)doc.querySelectorAll(native.hide).forEach(e=>e.hidden=true);
  host.replaceChildren();
  const toolbar=doc.createElement('div'), label=doc.createElement('label'), picker=doc.createElement('select'), next=doc.createElement('button'), note=doc.createElement('p'), warning=doc.createElement('p'), slot=doc.createElement('div');
  toolbar.className='oge-shared-toolbar';label.textContent='Тип задачи ';picker.id='oge-shared-module';picker.setAttribute('aria-label','Тип задачи');
  for(const row of native.modules){const option=doc.createElement('option');option.value=row.key;option.textContent=row.label;picker.append(option);}
  label.append(picker);next.type='button';next.className='btn';next.textContent='Другая задача →';toolbar.append(label,next);
  note.className='smallnote';note.textContent='Совместная тренировка. Задача, ответы, шаги и подсказки видны обоим участникам. Личный зачёт здесь не изменяется.';
  warning.setAttribute('role','status');warning.hidden=true;slot.className='oge-shared-stage-slot';host.append(note,toolbar,warning,slot);
  const style=doc.createElement('style');style.textContent='.oge-shared-toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:18px 0}.oge-shared-toolbar label{flex:1;min-width:220px}.oge-shared-toolbar select{display:block;width:100%;font:inherit;padding:10px;margin-top:6px}.oge-native-shared-stage .minimal-results{display:none}.oge-native-shared-stage{min-width:0}.oge-shared-stage-slot>.oge-native-shared-stage{display:block!important}';doc.head.append(style);

  function rng(context, fn){const original=Math.random;Math.random=()=>{context.random+=0x6D2B79F5;let t=context.random;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};try{return fn();}finally{Math.random=original;}}
  function owned(node){return !!node.closest(excluded);}
  function present(node, stage){for(let p=node;p&&p!==stage;p=p.parentElement){if(p.hidden||p.style.display==='none'||p.classList.contains('hidden')||p.classList.contains('minimal-results'))return false;}return stage.contains(node);}
  function operation(node){const content=node.textContent.trim();if(node.matches('.opt,.tfopt,.choice,[role="radio"]'))return 'choice';if(/^Проверить/.test(content))return 'check';if(/подсказ|Показать|Скрыть|Разобрать|Понятно/i.test(content))return 'help';if(node.matches('.fx,.toggle,.fxtoggle')||/дробью|десятичной/.test(content))return 'format';return 'action';}
  function tag(context,node,kind){let result=context.ids.get(node);if(!result){result=kind+':'+(context.counts[kind]||0);context.counts[kind]=(context.counts[kind]||0)+1;context.ids.set(node,result);}return result;}
  function controls(context){const result=new Map();context.stage.querySelectorAll('button,[role="button"],input[type="button"]').forEach(node=>{if(!owned(node))result.set(tag(context,node,operation(node)),node);});return result;}
  function fields(context){const result=new Map();context.stage.querySelectorAll('input:not([type="button"]),select,textarea').forEach(node=>{if(owned(node))return;const kind=node.tagName==='SELECT'?'select':node.tagName==='TEXTAREA'?'textarea':['radio','checkbox','range','number'].includes(node.type)?node.type:'text';result.set(tag(context,node,kind),node);});return result;}
  function fieldValue(node){return ['checkbox','radio'].includes(node.type)?node.checked:node.value;}
  function snapshot(context){return [...fields(context)].map(([name,node])=>[name,fieldValue(node)]);}
  function difference(before,after){const saved=new Map(before);return after.filter(([name,value])=>saved.get(name)!==value);}
  function details(context){const result=new Map();context.stage.querySelectorAll('details').forEach(node=>{if(!owned(node)&&!node.matches('.minimal-results'))result.set(tag(context,node,'detail'),node);});return result;}
  function inspect(context){controls(context);fields(context);details(context);common.getState(native.card(context.stage));}
  function make(module,seed){
    const context={stage:doc.createElement('section'),module,seed,random:seed,ids:new WeakMap(),counts:{},actions:[],baseFields:[],helpUsed:false};
    context.stage.className='oge-native-shared-stage';context.stage.setAttribute('aria-label','Совместное задание ОГЭ №'+native.number);
    rng(context,()=>native.mount(context.stage,module));
    common.enhanceCard(native.card(context.stage));inspect(context);context.baseFields=snapshot(context);return context;
  }
  function validatePairs(value,max=96){if(!Array.isArray(value)||value.length>max||new Set(value.map(x=>Array.isArray(x)?x[0]:null)).size!==value.length||!value.every(x=>Array.isArray(x)&&x.length===2&&key(x[0])&&(typeof x[1]==='boolean'||text(x[1]))))fail();}
  function putFields(context,values,events){
    validatePairs(values);const available=fields(context);
    for(const [name,value]of values){
      const node=available.get(name);if(!node)fail();
      if(['checkbox','radio'].includes(node.type)){if(typeof value!=='boolean')fail();}
      else{if(!text(value))fail();if(node.tagName==='SELECT'&&![...node.options].some(o=>o.value===value))fail();if(node.type==='range'){const n=Number(value);const step=Number(node.step||1),min=Number(node.min);if(!Number.isFinite(n)||n<min||n>Number(node.max)||node.step!=='any'&&Math.abs((n-min)/step-Math.round((n-min)/step))>1e-7)fail();}}
      if((node.disabled||node.readOnly)&&fieldValue(node)!==value)fail();
    }
    for(const [name,value]of values){const node=available.get(name);if(fieldValue(node)===value)continue;if(['checkbox','radio'].includes(node.type))node.checked=value;else node.value=value;if(events&&!node.disabled){node.dispatchEvent(new root.Event('input',{bubbles:true}));if(node.tagName==='SELECT'||['radio','checkbox'].includes(node.type))node.dispatchEvent(new root.Event('change',{bubbles:true}));}}
    for(const [name,value]of values)if(fieldValue(available.get(name))!==value)fail();
  }
  function perform(context,action){
    if(!Array.isArray(action)||action.length!==3||!['activate','change','enter'].includes(action[0])||!key(action[1]))fail();
    putFields(context,action[2],true);const node=(action[0]==='activate'?controls(context):fields(context)).get(action[1]);
    if(!node||node.disabled||!present(node,context.stage)||node.classList.contains('lock')||isNew(node))fail();
    if(helpAction(node))context.helpUsed=true;
    if(action[0]==='activate')node.dispatchEvent(new root.MouseEvent('click',{bubbles:true,cancelable:true}));
    else if(action[0]==='enter')node.dispatchEvent(new root.KeyboardEvent('keydown',{bubbles:true,key:'Enter'}));
    else{node.dispatchEvent(new root.Event('input',{bubbles:true}));node.dispatchEvent(new root.Event('change',{bubbles:true}));}
    inspect(context);context.baseFields=snapshot(context);
  }
  function isNew(node){return /^(?:Другая задача|Следующая задача|Ещё пример|Дальше\s*→|Новый пример|Возьмите новый)/i.test((node.textContent||'').trim());}
  function helpAction(node){return /подсказ|Показать|Скрыть|Разобрать|Понятно/i.test(node.textContent||'')||!!node.closest('.minimal-help,.steps');}
  function getState(){inspect(current);return {module:current.module,seed:current.seed,actions:copy(current.actions),drafts:difference(current.baseFields,snapshot(current)),details:[...details(current)].map(([k,n])=>[k,n.open]),helpUsed:current.helpUsed,shared:common.getState(native.card(current.stage))};}
  function prepare(incoming){
    if(!safe(incoming)||!exact(incoming,['module','seed','actions','drafts','details','helpUsed','shared'])||!modules.has(incoming.module)||!uint(incoming.seed)||!Array.isArray(incoming.actions)||incoming.actions.length>128||typeof incoming.helpUsed!=='boolean'||unescape(encodeURIComponent(JSON.stringify(incoming))).length>60000)fail();
    validatePairs(incoming.drafts);validatePairs(incoming.details,40);
    const previousModule=current&&current.module;
    try{const context=make(incoming.module,incoming.seed);
    for(const action of incoming.actions)rng(context,()=>perform(context,action));
    rng(context,()=>putFields(context,incoming.drafts,true));inspect(context);
    const boxes=details(context);if(incoming.details.length!==boxes.size)fail();
    for(const [name,open]of incoming.details){if(typeof open!=='boolean'||!boxes.has(name))fail();boxes.get(name).open=open;}
    if(!common.validateState(incoming.shared,native.card(context.stage)))fail();
    if(context.helpUsed&&!incoming.helpUsed)fail();context.actions=copy(incoming.actions);context.helpUsed=incoming.helpUsed;return context;}finally{if(previousModule)native.onLive(previousModule);}
  }
  function install(context){current=context;slot.replaceChildren(context.stage);picker.value=context.module;native.onLive(context.module);bind(context);warning.hidden=true;}
  function applyState(incoming){applying=true;try{const prepared=prepare(incoming);common.applyState(incoming.shared,native.card(prepared.stage));install(prepared);previous=JSON.stringify(getState());}finally{applying=false;}}
  function changed(){if(applying||scheduled)return;scheduled=true;Promise.resolve().then(()=>{scheduled=false;if(applying)return;const state=getState(),serialized=JSON.stringify(state);if(unescape(encodeURIComponent(serialized)).length>60000){applyState(JSON.parse(previous));warning.textContent='Общий снимок этой задачи заполнен. Сократите запись или выберите другую задачу.';warning.hidden=false;return;}if(serialized!==previous){previous=serialized;notify();}});}
  function fresh(){const module=picker.value;install(make(module,Math.floor(Math.random()*4294967296)));changed();}
  picker.addEventListener('change',fresh);next.addEventListener('click',fresh);
  function bind(context){
    const stage=context.stage;
    stage.addEventListener('click',event=>{
      if(applying||forwarding)return;
      const node=event.target.closest('button,[role="button"],input[type="button"]');
      if(!node||owned(node)){changed();return;}
      if(!stage.contains(node)||node.disabled||node.classList.contains('lock'))return;
      if(isNew(node)){event.preventDefault();event.stopImmediatePropagation();fresh();return;}
      const map=controls(context),name=[...map].find(([,n])=>n===node)?.[0];if(!name)return;
      event.preventDefault();event.stopImmediatePropagation();record(context,'activate',name,node);
    },true);
    stage.addEventListener('change',event=>{
      if(applying||forwarding)return;const node=event.target;if(owned(node)){changed();return;}
      if(node.tagName!=='SELECT'&&!['radio','checkbox'].includes(node.type)){changed();return;}
      const name=[...fields(context)].find(([,n])=>n===node)?.[0];if(!name)return;
      event.preventDefault();event.stopImmediatePropagation();record(context,'change',name,node);
    },true);
    stage.addEventListener('keydown',event=>{
      if(applying||forwarding||event.key!=='Enter'||owned(event.target)||!event.target.matches('input'))return;
      const name=[...fields(context)].find(([,n])=>n===event.target)?.[0];if(!name)return;
      event.preventDefault();event.stopImmediatePropagation();record(context,'enter',name,event.target);
    },true);
    stage.addEventListener('input',event=>{if(!owned(event.target)&&event.target.matches('input:not([type="range"]),textarea'))event.target.value=event.target.value.replace(/[<>\u0000-\u001f]/g,'').slice(0,120);changed();},true);
    stage.addEventListener('toggle',changed,true);
  }
  function record(context,kind,name,node){
    if(context.actions.length>=128){warning.textContent='В этой задаче уже много действий. Выберите «Другая задача», чтобы продолжить совместную тренировку.';warning.hidden=false;return;}
    const action=[kind,name,difference(context.baseFields,snapshot(context))];
    if(helpAction(node))context.helpUsed=true;
    forwarding=true;try{rng(context,()=>perform(context,action));}finally{forwarding=false;}
    // Consecutive retries at the same numeric checker replace only obsolete
    // feedback. Their cumulative draft delta is retained; accepted steps use
    // different locally assigned controls and cannot be compacted away.
    const last=context.actions[context.actions.length-1];
    if(name.startsWith('check:')&&last&&last[0]===kind&&last[1]===name&&!node.disabled){const merged=new Map(last[2]);action[2].forEach(([k,v])=>merged.set(k,v));last[2]=[...merged];}
    else context.actions.push(action);
    changed();
  }
  install(make(native.modules[0].key,Math.floor(Math.random()*4294967296)));previous=JSON.stringify(getState());
  root.Oge2022Board=Object.freeze({getState,applyState,validateState:value=>{try{prepare(value);return true;}catch(_){return false;}}});
  root.getBoardTrainerState=getState;root.applyBoardTrainerState=applyState;
  root.MathExamBoard.register({id:native.id,version:'1.0.0',stateSchemaVersion:1,parentOrigin:root.location.origin,getState,applyState,subscribe:callback=>{notify=callback;return()=>{notify=()=>{};};}});
})(window,document);
