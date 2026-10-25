/* OGE 10–14: reconstruct the native task and replay its bounded, typed learning
 * operations. The wire contains neither markup, an answer key nor personal work.
 * Control slots are resolved only in the compiled native exercise root. No peer
 * selectors, property paths, functions, URLs or event names are evaluated. */
(function(root,doc){
'use strict';
const page=Number(doc.currentScript?.dataset.ogeNative);
if(!root.OgeCourseSharedMode||![10,11,12,13,14].includes(page)||/[?&]selftest=1(?:&|$)/.test(root.location.search))return;
function init(){
const byId=id=>doc.getElementById(id),clone=x=>JSON.parse(JSON.stringify(x));
const excluded='.practice-settings,.oca-exploration,.oca-reference,.oca-work,.oca-instruction';
const ids={10:'oge-task10-probability',11:'oge-task11-graphs',12:'oge-task12-formulas',13:'oge-task13-inequalities',14:'oge-task14-progressions'};
const stage=()=>page===10?byId('mar-root'):page===11?byId('m4'):page===12?byId('taskArea'):page===13?doc.querySelector('section.main'):byId('m-task');
const card=()=>stage().querySelector(':scope > .card')||stage();
const types=page===10?TYPE_LIST:page===11?[['t41','Знаки a и c'],['t42','Параболы'],['t43','Прямые'],['t44','Гиперболы'],['t45','Разные виды графиков']]:page===12?GENS.map((g,i)=>[String(i),TYPES[g.t].name+' · '+(i+1)]):page===13?MODS.flatMap(([key,name])=>DATA[key].map((_,i)=>[key+':'+i,name+' · '+(i+1)])):Object.entries(T14.GENS).map(([key,g])=>[key,g.title]);
let descriptor={type:types[0][0],seed:1},history=[],helpUsed=false,applying=false,notify=()=>{},last='',queued=false;
function seeded(seed,fn){const original=Math.random;let n=seed>>>0;Math.random=()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};try{return fn();}finally{Math.random=original;}}
if(page===12){const nativeBuildSteps=buildSteps;buildSteps=function(task){return seeded(descriptor.seed^0x51ed270b,()=>nativeBuildSteps(task));};}
function extra(){if([10,12,14].includes(page)){root.OgeCourseAlgebraShared?.enhanceCard(card());root.OgeCourseAlgebraShared?.getState(card());}root.OgeCourseReferenceEntry?.update();}
function mount(d){
 descriptor=clone(d);history=[];helpUsed=false;if(stage())stage().inert=false;
 if(page===10){['uch','step','quiz'].forEach(name=>byId('tab-'+name).replaceChildren());UID=0;TASK_UID=0;RECS.clear();marFilter=d.type;showTab('mar');marNew(attach(genTask(d.type,makePick(RNG(d.seed)))));}
 else if(page===11){M4.type=d.type;M4.review=false;seeded(d.seed,m4New);doc.querySelectorAll('.module').forEach(n=>n.classList.toggle('active',n.id==='m4'));}
 else if(page===12){mode='exam';reviewOn=false;cur=seeded(d.seed,()=>GENS[Number(d.type)].make());A=newState();renderTask();}
 else if(page===13){const [family,index]=d.type.split(':');mod=family;idx[family]=Number(index);for(const key of Object.keys(sessionStates))delete sessionStates[key];labCache.clear();resetState();renderAll();}
 else T14.boardMount(d.type,d.seed);
 extra();
 doc.querySelectorAll('.tabs,.minimal-settings,.minimal-navigation,.practice-settings,.pnote,.stats,#mar-stats,#mar-filters,#settings,#m4-review').forEach(n=>{n.hidden=true;});
 if(page===10)doc.querySelectorAll('#tab-mar>.chips,#mar-chips').forEach(n=>n.hidden=true);
 if(page===14)doc.querySelectorAll('#page-marathon>:not(#m-task)').forEach(n=>n.hidden=true);
 if(byId('oge-board-type'))byId('oge-board-type').value=d.type;
}
function nextButton(el){return /^(?:m4-next|nextBtn|previous|next|m-skip|m-next\d*|w\d+-next)$/.test(el.id)||/^(?:Следующая задача|Другая задача|Другое задание)/.test(el.textContent.trim());}
function controls(){extra();return Array.from(stage().querySelectorAll('button,input,select,textarea,details,svg')).filter(el=>!el.closest(excluded)&&!el.closest('#oge-board-toolbar')&&(!el.matches('svg')||typeof el.ogeSetProbe==='function')&&!nextButton(el));}
function kind(el){return el.matches('input')?'input:'+el.type:el.matches('select')?'select':el.matches('textarea')?'text':el.matches('details')?'details':el.matches('svg')?'probe':'button';}
function value(el){return el.matches('details')?el.open:el.type==='checkbox'?el.checked:el.value;}
function clean(s){return String(s).replace(/[<>\u0000-\u001f]/g,'').slice(0,80);}
function atCapacity(){return history.length>=320||new Blob([JSON.stringify(history)]).size>=28000;}
function reflectCapacity(){const full=atCapacity();stage().inert=full;const limit=byId('oge-board-limit');if(limit)limit.hidden=!full;}
function add(op){const prev=history[history.length-1];if(['input','change','probe','details'].includes(op[0])&&prev&&prev[0]===op[0]&&prev[1]===op[1]&&prev[2]===op[2])history[history.length-1]=op;else history.push(op);reflectCapacity();}
function enqueue(){if(applying||queued)return;queued=true;Promise.resolve().then(()=>{queued=false;if(applying)return;const now=JSON.stringify(getState());if(now!==last){last=now;notify();}});}
function ensureCapacity(event){if(!atCapacity())return true;event?.preventDefault();event?.stopImmediatePropagation();byId('oge-board-limit').hidden=false;return false;}
function markHelp(el){if(el.closest('.minimal-hint-panel,.oca-help,.oca-exploration,.oca-reference,.oca-work,.oca-instruction,#m4-hintbox,#t11-help-panel,#hintPanel,[data-task13-lab],[data-lab-kind]')||el.matches('.minimal-hint,.function-help')||/hint|solve|show|steps/.test(el.id))helpUsed=true;}
function record(event){
 if(applying)return;
 const el=event.target.closest(event.type==='click'?'button,summary':event.type==='toggle'?'details':'input,select,textarea');
 if(!el||!stage().contains(el))return;
 if(event.type==='click'&&nextButton(el)){event.preventDefault();event.stopImmediatePropagation();newTask(undefined,el.id==='previous'?-1:1);return;}
 if(el.closest(excluded)){markHelp(el);enqueue();return;}
 if(el.matches('summary')){const detail=el.parentElement,slot=controls().indexOf(detail);if(slot>=0&&ensureCapacity(event)){markHelp(detail);add(['details',slot,'details',!detail.open]);enqueue();}return;}
 if(page===13&&el.dataset.labAction==='move-term')return; // native move hook also covers keyboard/drop.
 const list=controls(),slot=list.indexOf(el);if(slot<0||(el.disabled||el.readOnly))return;
 if(!ensureCapacity(event))return;
 markHelp(el);
 const op=event.type==='click'?'click':event.type==='toggle'?'details':event.type;
 if(op==='input'&&!['range','checkbox'].includes(el.type))el.value=clean(el.value);
 add([op,slot,kind(el),op==='click'?null:value(el)]);enqueue();
}
['click','input','change'].forEach(name=>doc.addEventListener(name,record,true));
// Native Enter handlers invoke check functions directly; replay the native key,
// after its draft, so keyboard and pointer checking restore the same closure.
doc.addEventListener('keydown',event=>{if(!applying&&page===11&&event.key==='Escape'&&event.target.closest('#t11-help-panel')){event.preventDefault();event.stopImmediatePropagation();byId('t11-help-close').click();return;}if(applying||event.key!=='Enter'||!event.target.matches('input')||!stage().contains(event.target)||event.target.closest(excluded)||(event.target.disabled||event.target.readOnly))return;const slot=controls().indexOf(event.target);if(slot<0||!ensureCapacity(event))return;add(['enter',slot,kind(event.target),null]);enqueue();},true);
doc.addEventListener('toggle',event=>{if(applying||!event.target.matches('details')||!stage().contains(event.target))return;/* Open state is a typed final view; avoid asynchronous toggle echoes. */enqueue();},true);
let probeGesture=null;
doc.addEventListener('pointerdown',event=>{if(applying||page!==13)return;const svg=event.target.closest('svg');if(svg?.ogeProbeRollback&&stage().contains(svg))probeGesture={svg,history:clone(history)};},true);
doc.addEventListener('pointercancel',event=>{if(applying||!probeGesture||!probeGesture.svg.contains(event.target))return;history=probeGesture.history;probeGesture=null;reflectCapacity();enqueue();},true);
doc.addEventListener('pointerup',()=>{probeGesture=null;},true);
doc.addEventListener('oge13:probe',event=>{if(applying)return;const slot=controls().indexOf(event.target);if(slot<0||!ensureCapacity(event))return;markHelp(event.target);add(['probe',slot,'probe',event.detail.value]);enqueue();},true);
doc.addEventListener('oge13:move',event=>{if(applying)return;if(!ensureCapacity(event))return;helpUsed=true;add(['move',0,event.detail.term,event.detail.side]);enqueue();},true);
function snapshot(){return controls().flatMap((el,i)=>el.matches('input,select,textarea,details')?[[i,kind(el),value(el)]]:[]);}
function getState(){return {version:1,task:clone(descriptor),actions:clone(history),view:snapshot(),helpUsed,algebra:[10,12,14].includes(page)?root.OgeCourseAlgebraShared.getState(card()):null};}
function plain(x){return !!x&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));}
function safe(x,depth=0){if(depth>8)return false;if(x===null||typeof x==='boolean')return true;if(typeof x==='number')return Number.isFinite(x);if(typeof x==='string')return x.length<=8000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x);if(!plain(x)&&!Array.isArray(x))return false;const keys=Reflect.ownKeys(x);if(Array.isArray(x)&&(Object.getPrototypeOf(x)!==Array.prototype||x.length>600||keys.length!==x.length+1))return false;return keys.every(key=>{if(Array.isArray(x)&&key==='length')return true;const p=Object.getOwnPropertyDescriptor(x,key);return typeof key==='string'&&!['__proto__','prototype','constructor'].includes(key)&&p.enumerable&&Object.hasOwn(p,'value')&&safe(p.value,depth+1);});}
function exact(x,keys){return plain(x)&&Reflect.ownKeys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));}
function valid(s){if(!safe(s)||new Blob([JSON.stringify(s)]).size>65536||!exact(s,['version','task','actions','view','helpUsed','algebra'])||s.version!==1||typeof s.helpUsed!=='boolean'||!exact(s.task,['type','seed'])||!types.some(t=>t[0]===s.task.type)||!Number.isInteger(s.task.seed)||s.task.seed<0||s.task.seed>4294967295||!Array.isArray(s.actions)||s.actions.length>320||!Array.isArray(s.view)||s.view.length>300)return false;
 if(!s.actions.every(a=>Array.isArray(a)&&a.length===4&&['click','input','change','enter','probe','move','details'].includes(a[0])&&Number.isInteger(a[1])&&a[1]>=0&&a[1]<300&&typeof a[2]==='string'&&a[2].length<=80&&(a[3]===null||typeof a[3]==='boolean'||typeof a[3]==='number'||typeof a[3]==='string'&&a[3].length<=80)))return false;
 if(!s.view.every(a=>Array.isArray(a)&&a.length===3&&Number.isInteger(a[0])&&a[0]>=0&&a[0]<300&&typeof a[1]==='string'&&a[1].length<40&&(typeof a[2]==='boolean'||typeof a[2]==='string'&&a[2].length<=80)))return false;
 return [10,12,14].includes(page)?root.OgeCourseAlgebraShared.validateState(s.algebra):s.algebra===null;
}
function setField(el,v,dispatch){
 if(el.matches('details')){if(typeof v!=='boolean')throw Error('details value');el.open=v;return;}
 if(el.type==='checkbox'){if(typeof v!=='boolean')throw Error('checkbox value');el.checked=v;}
 else{if(typeof v!=='string'||v.length>80||/[<>\u0000-\u001f]/.test(v))throw Error('field value');if(el.matches('select')&&!Array.from(el.options).some(o=>o.value===v))throw Error('unknown option');if(el.type==='range'&&(!Number.isFinite(Number(v))||Number(v)<Number(el.min)||Number(v)>Number(el.max)))throw Error('range value');el.value=v;}
 if(dispatch)el.dispatchEvent(new Event(dispatch,{bubbles:true}));
}
function run(s){mount(s.task);for(const a of s.actions){const [op,slot,type,v]=a;if(op==='move'){if(page!==13||slot!==0||!['left','right'].includes(v))throw Error('move');const lab=stage().querySelector('[data-task13-lab]');const term=lab&&Array.from(lab.querySelectorAll('[data-term-id]')).find(e=>e.dataset.termId===type);if(!term||term.dataset.side===v||typeof lab.ogeMoveTerm!=='function')throw Error('term');helpUsed=true;lab.ogeMoveTerm(type,v);continue;}
 const el=controls()[slot];if(!el||kind(el)!==type||el.disabled||el.readOnly)throw Error('Unknown or locked native control');
 markHelp(el);
 if(op==='click'){if(type!=='button'||v!==null)throw Error('button operation');el.click();}
 else if(op==='enter'){if(!el.matches('input')||v!==null)throw Error('enter operation');el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));}
 else if(op==='probe'){if(type!=='probe'||typeof v!=='number'||v<el.ogeProbeRange[0]||v>el.ogeProbeRange[1])throw Error('probe value');el.ogeSetProbe(v);}
 else{if(!el.matches('input,select,textarea,details')||(op==='details')!==el.matches('details'))throw Error('field operation');setField(el,v,op==='details'?null:op);}
 extra();}
 const list=controls(),expected=list.flatMap((e,i)=>e.matches('input,select,textarea,details')?[[i,kind(e)]]:[]);
 if(expected.length!==s.view.length||!expected.every((e,i)=>e[0]===s.view[i][0]&&e[1]===s.view[i][1]))throw Error('view shape');
 s.view.forEach(([slot,type,v])=>{const el=list[slot];if(el.matches('details'))setField(el,v,null);else if(value(el)!==v)throw Error('draft and native operations disagree');});
 if([10,12,14].includes(page)){if(!root.OgeCourseAlgebraShared.validateState(s.algebra,card()))throw Error('model shape');root.OgeCourseAlgebraShared.applyState(s.algebra,card());}
 if(helpUsed&&!s.helpUsed)throw Error('assistance cannot be cleared');history=clone(s.actions);helpUsed=s.helpUsed;reflectCapacity();
}
function applyState(s){if(!valid(s))throw TypeError('Invalid OGE native shared state');const previous=getState();applying=true;try{run(s);last=JSON.stringify(getState());}catch(error){run(previous);last=JSON.stringify(getState());throw error;}finally{applying=false;}}
function newTask(type,delta=1){if(page===13&&!type)type=types[(types.findIndex(t=>t[0]===descriptor.type)+delta+types.length)%types.length][0];applying=true;try{mount({type:type||descriptor.type,seed:Math.floor(Math.random()*4294967296)});byId('oge-board-limit').hidden=true;}finally{applying=false;}enqueue();}
applying=true;mount({type:types[0][0],seed:Math.floor(Math.random()*4294967296)});applying=false;
const bar=doc.createElement('div');bar.id='oge-board-toolbar';bar.style.cssText='max-width:940px;margin:12px auto;padding:12px;font:inherit';const note=doc.createElement('p');note.textContent='Совместная тренировка: ответы, подсказки и модели видны обоим участникам. Личные результаты кабинета здесь не изменяются.';bar.append(note);
const label=doc.createElement('label');label.textContent='Тип задачи ';const select=doc.createElement('select');select.id='oge-board-type';select.style.cssText='font:inherit;max-width:100%;padding:8px';types.forEach(([key,name])=>{const option=doc.createElement('option');option.value=key;option.textContent=name;select.append(option);});select.value=descriptor.type;select.onchange=()=>newTask(select.value);label.append(select);bar.append(label);const next=doc.createElement('button');next.textContent='Следующая задача';next.type='button';next.style.cssText='font:inherit;margin:8px;padding:8px';next.onclick=()=>newTask();bar.append(next);const limit=doc.createElement('p');limit.id='oge-board-limit';limit.hidden=true;limit.textContent='Достигнут предел действий в этой задаче. Выберите следующую задачу для продолжения общей тренировки.';bar.append(limit);stage().before(bar);
last=JSON.stringify(getState());
root.getBoardTrainerState=getState;root.applyBoardTrainerState=applyState;
root.MathExamBoard.register({id:ids[page],version:'1.0.0',stateSchemaVersion:1,parentOrigin:root.location.origin,getState,applyState,subscribe(fn){notify=fn;return()=>{notify=()=>{};};}});
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
