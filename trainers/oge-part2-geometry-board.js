/* Semantic shared practice for the native geometry trainers 23–25.
 * Only a bank descriptor, native actions and drafts cross the room boundary.
 * Every diagram, question, answer check and proof is regenerated locally. */
(function(root,doc){
'use strict';
const page=Number((root.location.pathname.match(/oge-task(23|24|25)-/)||[])[1]);
if(!page||!root.OgeCourseSharedMode||new URLSearchParams(root.location.search).get('selftest')==='1')return;
const ids={23:'oge-task23-geometry-calculations',24:'oge-task24-proofs',25:'oge-task25-geometry'};
const q=(s,host=doc)=>host.querySelector(s), qa=(s,host=doc)=>Array.from(host.querySelectorAll(s));
const clone=x=>JSON.parse(JSON.stringify(x));
const host=()=>q(page===23?'.train-host':page===24?'#view':'#panel-train');
const inputs=()=>qa('input.ans-inp,input[data-ai],#gAsk',host()).filter(x=>!x.disabled&&!x.readOnly);
const drafts=()=>inputs().map(x=>x.value);
const types=()=>page===23?ORDER.map(key=>({key,name:SUBS[key].name})):page===24?TASKS.map(t=>({key:t.id,name:t.title})):TYPES.map(t=>({key:String(t.id),name:t.title}));
let task=null,mode='train',actions=[],helpUsed=false,applying=false,running=false,notify=()=>{},previous='',started=false;
function seeded(seed,fn){const original=Math.random;let n=seed>>>0;Math.random=()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};try{return fn();}finally{Math.random=original;}}
function uint(x){return Number.isInteger(x)&&x>=0&&x<=4294967295;}
function object(x,keys){if(!x||typeof x!=='object'||Array.isArray(x)||![Object.prototype,null].includes(Object.getPrototypeOf(x))||Reflect.ownKeys(x).length!==keys.length)return false;return keys.every(k=>{const p=Object.getOwnPropertyDescriptor(x,k);return p&&p.enumerable&&Object.prototype.hasOwnProperty.call(p,'value');});}
function array(x,max,test){return Array.isArray(x)&&Object.getPrototypeOf(x)===Array.prototype&&x.length<=max&&Reflect.ownKeys(x).length===x.length+1&&Array.from({length:x.length},(_,i)=>{const p=Object.getOwnPropertyDescriptor(x,String(i));return p&&p.enumerable&&Object.prototype.hasOwnProperty.call(p,'value')&&test(p.value);}).every(Boolean);}
const assisted=new Set(['hint','solution-step','give','guide','construct-show','place','tr-hint','tr-give','g-tip','g-reveal']);
const safeDraft=x=>typeof x==='string'&&x.length<=80&&!/[<>\u0000-\u001f]/.test(x);
const bools=x=>array(x,100,y=>typeof y==='boolean');
const position=x=>x===null||(array(x,2,y=>Number.isFinite(y)&&y>=14&&y<=366)&&x.length===2&&x[1]<=286);
function descriptorOK(x){if(!object(x,['key','source','value','seed'])||typeof x.key!=='string'||!types().some(t=>t.key===x.key)||!uint(x.seed))return false;
 if(page===23)return x.source==='generator'?uint(x.value):x.source==='archive'&&Number.isInteger(x.value)&&ARCHIVE[x.value]?.sub===x.key;
 if(page===24)return x.source==='proof'&&x.value===0;
 return x.source==='pool'&&Number.isInteger(x.value)&&x.value>=0&&x.value<byId(Number(x.key)).pool.length;
}
function operationOK(op){if(typeof op!=='string')return false;
 if(page===23)return /^(?:answer|hint|solution-step|give|guide|construct-show|construct|recognize:[0-9]|step:[0-9]|choice:[0-9]:[0-9])$/.test(op);
 if(page===24)return /^(?:card:[sx]:[0-9]|just:[0-9]|hint|place|give|restart)$/.test(op);
 return /^(?:tr-check|tr-hint|tr-give|g-check|g-reveal|g-next|g-tip)$/.test(op);
}
function validate(s){if(!object(s,['schema','task','mode','actions','drafts','helpUsed','helpOpen','details','why','workspace','construction'])||s.schema!==1||!descriptorOK(s.task)||!(page===24?['train','recall','justify']:['train']).includes(s.mode)||typeof s.helpUsed!=='boolean'||typeof s.helpOpen!=='boolean'||!bools(s.details)||!bools(s.why)||!array(s.drafts,16,safeDraft)||!position(s.construction))throw new TypeError('Invalid shared geometry state');
 if(!array(s.actions,256,a=>object(a,['op','drafts','point'])&&operationOK(a.op)&&array(a.drafts,16,safeDraft)&&position(a.point)&&(a.op==='construct'?a.point!==null:a.point===null)))throw new TypeError('Invalid native geometry action');
 root.OgeCourseProof.validateState(s.workspace);
 if(!s.helpUsed&&(s.helpOpen||s.actions.some(a=>assisted.has(a.op))||s.why.some(Boolean)||s.workspace.details.some(Boolean)||s.workspace.zoom.some(Boolean)))throw new TypeError('Assistance cannot be erased');
 if(page!==23&&s.construction!==null)throw new TypeError('Unexpected construction');
 if(new TextEncoder().encode(JSON.stringify(s)).length>60000)throw new RangeError('Geometry state is too large');
 return true;
}
function nativeDetails(){return qa('details',host()).filter(x=>!x.closest('.ocp-references,.ocp-step-reason,.ocp-writing'));}
function captureUI(){return {helpOpen:!!q('#courseHintPanel',host())&&!q('#courseHintPanel',host()).hidden,details:nativeDetails().map(x=>x.open),why:qa('.why-body',host()).map(x=>x.classList.contains('open')),workspace:root.OgeCourseProof.captureState()};}
function applyUI(ui,merge){const panel=q('#courseHintPanel',host()),toggle=q('#courseHintToggle',host());if(panel){const open=merge?(ui.helpOpen||!panel.hidden):ui.helpOpen;panel.hidden=!open;if(toggle){toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Убрать подсказку':'Хочешь подсказку?';}}else if(!merge&&ui.helpOpen)throw new TypeError('Missing help panel');
 const details=nativeDetails();if(!merge&&details.length!==ui.details.length)throw new TypeError('Details do not match native task');details.forEach((x,i)=>{if(i<ui.details.length)x.open=ui.details[i];});
 const why=qa('.why-body',host());if(!merge&&why.length!==ui.why.length)throw new TypeError('Explanations do not match native task');why.forEach((x,i)=>{const open=ui.why[i]||false;x.classList.toggle('open',open);const button=q('[data-act="why"]',x.parentElement);if(button)button.textContent=open?'скрыть объяснение':'почему это верно?';});
 let workspace=ui.workspace;
 if(merge){const fresh=root.OgeCourseProof.captureState();workspace={notes:workspace.notes,writingOpen:workspace.writingOpen,details:fresh.details.map((x,i)=>workspace.details[i]??x),zoom:fresh.zoom.map((x,i)=>workspace.zoom[i]??x),figureLarge:fresh.figureLarge.map((x,i)=>workspace.figureLarge[i]??x)};}
 root.OgeCourseProof.applyState(workspace);
}
function decorate(){root.OgeCourseProof.decorate();
 qa('#tabs,.tabs,.minimal-navigation,.solo-nudge,.pnote,#courseSettings').forEach(x=>x.hidden=true);
 if(page===24){qa('[onclick]',host()).forEach(b=>{const code=b.getAttribute('onclick');let m;if((m=code.match(/^pickCard\(\{type:'([sx])',i:(\d+)\}\)$/)))b.dataset.boardAction='card:'+m[1]+':'+m[2];else if((m=code.match(/^pickJust\((\d+)\)$/)))b.dataset.boardAction='just:'+m[1];else{const names={'useHint()':'hint','hintPlace()':'place','surrender()':'give','restartTask()':'restart','nextTask()':'next','trainThis()':'next'};if(names[code])b.dataset.boardAction=names[code];else if(/^(?:backToMenu|switchMode|startStudy)/.test(code))b.hidden=true;}});}
 if(page===25){qa('[data-act]',host()).forEach(b=>{if(operationOK(b.dataset.act)||b.dataset.act==='tr-next')b.dataset.boardAction=b.dataset.act==='tr-next'?'next':b.dataset.act;if(b.dataset.act==='train-pick')b.hidden=true;});}
 const picker=q('#oge-part2-type');if(picker)picker.value=task.key;const mp=q('#oge-part2-mode');if(mp)mp.value=mode;
}
function writeDrafts(values){const fields=inputs();if(fields.length!==values.length)throw new TypeError('Drafts do not match native task');fields.forEach((x,i)=>{x.value=values[i];x.dispatchEvent(new root.Event('input',{bubbles:true}));});}
function reset(description,newMode){task=clone(description);mode=newMode;actions=[];helpUsed=false;root.OgePart2Construction=null;
 seeded(task.seed,()=>{
  if(page===23){const main=q('#main');main.replaceChildren();const mount=doc.createElement('div');mount.className='train-host';main.append(mount);const p=task.source==='archive'?clone(ARCHIVE[task.value].p):seeded(task.value,()=>SUBS[task.key].gen());buildTask(mount,{sub:task.key,p},'train',()=>{});}
  else if(page===24){ST={mode,queue:[task.key],qi:0,results:[]};loadTask();}
  else {const T=byId(Number(task.key)),p=clone(T.pool[task.value]);trS={id:T.id,p,b:T.build(p),hints:0,wrong:0,reveal:0,done:false,surrender:false,fb:null,gmode:false,gstep:0,gres:[],gDrafts:[],inp:[],gfb:null,gtip:false,missed:false,shown:false};trS.traps=trapsFor(T,p,trS.b);renderTrain();switchTab('train');}
 });decorate();const clean=root.OgeCourseProof.captureState();clean.notes='';clean.writingOpen=false;root.OgeCourseProof.applyState(clean);
}
function actionButton(op){return qa('[data-board-action]',host()).find(x=>x.dataset.boardAction===op&&!x.disabled&&!x.closest('.step.done'));}
function runAction(a,index){writeDrafts(a.drafts);const old=running;running=true;try{seeded((task.seed+Math.imul(index+1,2654435761))>>>0,()=>{if(a.op==='construct'){if(!root.OgePart2Construction||q('.construct-step.done',host()))throw new TypeError('Construction is unavailable');root.OgePart2Construction.moveTo(a.point[0],a.point[1],true);}else{const button=actionButton(a.op);if(!button)throw new TypeError('Action is unavailable for this task');button.dispatchEvent(new root.MouseEvent('click',{bubbles:true,cancelable:true}));}});}finally{running=old;}decorate();}
function state(){const ui=captureUI();helpUsed=helpUsed||ui.helpOpen||ui.why.some(Boolean)||ui.workspace.details.some(Boolean)||ui.workspace.zoom.some(Boolean);return {schema:1,task:clone(task),mode,actions:clone(actions),drafts:drafts(),helpUsed,helpOpen:ui.helpOpen,details:ui.details,why:ui.why,workspace:ui.workspace,construction:root.OgePart2Construction?root.OgePart2Construction.position():null};}
function restore(s){reset(s.task,s.mode);s.actions.forEach((a,i)=>{runAction(a,i);actions.push(clone(a));});writeDrafts(s.drafts);helpUsed=s.helpUsed;
 if(s.construction){if(!root.OgePart2Construction)throw new TypeError('Missing construction');root.OgePart2Construction.moveTo(s.construction[0],s.construction[1],false);if(root.OgePart2Construction.position().some((v,i)=>v!==s.construction[i]))throw new TypeError('Construction does not match native state');}
 else if(root.OgePart2Construction)throw new TypeError('Missing construction position');
 applyUI(s,false);decorate();
}
function apply(s){validate(s);const old=state();applying=true;try{restore(s);previous=JSON.stringify(state());}catch(error){restore(old);previous=JSON.stringify(state());throw error;}finally{applying=false;}}
function changed(){if(applying||running||!started)return;const now=JSON.stringify(state());if(now!==previous){previous=now;notify();}}
function after(){Promise.resolve().then(changed);}
function next(key=task?.key||types()[0].key,newMode=mode){const seed=Math.floor(Math.random()*4294967296);const description={key,source:page===23?'generator':page===24?'proof':'pool',value:page===23?seed:page===24?0:Math.floor(Math.random()*byId(Number(key)).pool.length),seed};applying=true;try{reset(description,newMode);}finally{applying=false;}changed();}
function perform(op,point=null){const a={op,drafts:drafts(),point};const old=state();const ui=captureUI();const candidate={...old,helpUsed:old.helpUsed||assisted.has(op),actions:[...actions,a]};
 try{validate(candidate);}catch(_){q('#oge-part2-status').textContent='История этой задачи заполнена. Сохраните записи и перейдите к следующей задаче.';return;}
 applying=true;try{runAction(a,actions.length);actions.push(a);if(assisted.has(op))helpUsed=true;applyUI(ui,true);}catch(error){restore(old);throw error;}finally{applying=false;}changed();}
root.OgePart2ConstructionMoving=()=>after();
root.OgePart2ConstructionDrafts=drafts;
root.OgePart2ConstructionChanged=(point,beforeDrafts)=>{if(applying||running)return;const a={op:'construct',drafts:beforeDrafts,point};const candidate={...state(),actions:[...actions,a]};try{validate(candidate);}catch(_){apply(JSON.parse(previous));q('#oge-part2-status').textContent='История этой задачи заполнена. Перейдите к следующей задаче.';return;}actions.push(a);decorate();changed();};
function start(){if(started)return;started=true;const main=q(page===23?'#main':page===24?'#view':'#panel-train');const controls=doc.createElement('section');controls.id='oge-part2-controls';controls.setAttribute('aria-label','Общая тренировка');controls.style.cssText='max-width:1000px;margin:12px auto;padding:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center';
 const label=doc.createElement('label');label.textContent='Тип задачи ';const picker=doc.createElement('select');picker.id='oge-part2-type';types().forEach(t=>{const option=doc.createElement('option');option.value=t.key;option.textContent=t.name;picker.append(option);});label.append(picker);controls.append(label);picker.addEventListener('change',()=>next(picker.value));
 if(page===24){const label=doc.createElement('label');label.textContent='Режим ';const select=doc.createElement('select');select.id='oge-part2-mode';[['train','Тренировка'],['recall','По памяти'],['justify','Обоснуй']].forEach(([value,text])=>{const o=doc.createElement('option');o.value=value;o.textContent=text;select.append(o);});label.append(select);controls.append(label);select.addEventListener('change',()=>next(task.key,select.value));}
 const button=doc.createElement('button');button.type='button';button.className='btn';button.textContent='Новая задача';button.addEventListener('click',()=>next());controls.append(button);const status=doc.createElement('p');status.id='oge-part2-status';status.textContent='Общая тренировка: полное решение записывайте с обоснованиями. Личный зачёт здесь не сохраняется.';status.style.cssText='flex-basis:100%;font-size:13px;margin:0';controls.append(status);main.before(controls);
 const style=doc.createElement('style');style.textContent='#courseSettings,.minimal-navigation,.tabs{display:none!important}#oge-part2-controls select{max-width:100%;padding:7px}';doc.head.append(style);
 next(types()[0].key,'train');previous=JSON.stringify(state());
 root.getBoardTrainerState=state;root.applyBoardTrainerState=apply;
 root.MathExamBoard.register({id:ids[page],version:'1.0.0',stateSchemaVersion:1,parentOrigin:root.location.origin,getState:state,applyState:apply,subscribe(fn){notify=fn;return()=>{notify=()=>{};};}});
 doc.documentElement.dataset.ogePart2Board='ready';
}
doc.addEventListener('click',event=>{if(!started||applying||running)return;const b=event.target.closest('[data-board-action],#courseHintToggle,summary,button');if(!b||!host()?.contains(b))return;
 if((b.id==='courseHintToggle'&&q('#courseHintPanel',host())?.hidden)||b.closest('.ocp-references,.ocp-step-reason,.why'))helpUsed=true;
 const op=b.dataset.boardAction;if(op){event.preventDefault();event.stopImmediatePropagation();if(b.disabled||b.closest('.step.done'))return;if(op==='next'){next();return;}perform(op);return;}after();
},true);
doc.addEventListener('keydown',event=>{if(!started||applying||running||event.key!=='Enter'||!inputs().includes(event.target))return;const container=event.target.closest('.ans-row,.ansrow');const b=container&&q('[data-board-action]',container);if(b){event.preventDefault();event.stopImmediatePropagation();perform(b.dataset.boardAction);}},true);
doc.addEventListener('input',event=>{if(!started||applying||running)return;if(inputs().includes(event.target))event.target.value=event.target.value.replace(/[<>\u0000-\u001f]/g,'').slice(0,80);after();},true);
root.addEventListener('pagehide',()=>{started=false;});
doc.addEventListener('change',after,true);doc.addEventListener('toggle',after,true);
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window,document);
