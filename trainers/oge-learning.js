/* Six native renderers on the existing credential-free managed frame protocol. */
(function(root,doc){
'use strict';
if(!root.MathExamLearning?.managed)return;
root.OgeLearningRegister=function(config){
 const native=root.OgeLearningNative;
 if(!native)throw Error('Missing native learning adapter');
 let spec=null,helpUsed=false,emit=()=>{},applying=false,readOnly=true,timer=null,pendingCheck=false,last='';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const assisted=s=>!!(s.helpUsed||s.helpOpen||s.hintOpen||s.guided||s.referenceOpen||s.model?.open||s.current?.helpUsed||s.current?.hintOpen||s.current?.modelState||s.view?.textbook||s.steps?.some(x=>x.hint||x.revealed)||(Array.isArray(s.details)&&s.details.some(Boolean)));
 function getState(){const snapshot=config.getState();helpUsed=helpUsed||assisted(snapshot);return {native:snapshot,answer:String(native.answer()??''),helpUsed};}
 function tidy(){
  doc.querySelectorAll('#oge-board-toolbar,#oge-board-note,#board-settings,#board-next,#m4-next,#oge-board-subtype,#nextCard,#topicSelect,#reviewOnly').forEach(e=>{e.hidden=true;});
  const note=doc.querySelector('#main .smallnote');if(native.number===15&&note?.textContent.startsWith('Совместная'))note.textContent='Результат сохраняется в кабинете. Подсказки отмечаются отдельно.';
  if(native.number===19){const p=doc.getElementById('progressText');if(p)p.textContent='Ответ и использование подсказки сохраняются в кабинете.';}
 }
 function flush(){
  clearTimeout(timer);timer=null;
  if(applying||readOnly||!spec)return;
  tidy();const state=getState(),serialized=JSON.stringify(state),check=pendingCheck;pendingCheck=false;
  if(check){last=serialized;emit({kind:'check',details:check.scope==='step'?{scope:'step',step:check.step,answer:state.native.steps[check.step].draft}:{scope:'final',answer:state.answer},state});}
  else if(serialized!==last){last=serialized;emit({kind:'input',details:{},state});}
 }
 function schedule(){if(applying||readOnly||!spec)return;if(timer===null)timer=setTimeout(flush,0);}
 config.subscribe(schedule);
 const capture=event=>{
  if(applying||readOnly||!spec)return;
  const button=event.target.closest?.('button');
  if(event.type==='click'&&button?.matches(native.checkSelector)&&!button.disabled)pendingCheck={scope:'final'};
  if(event.type==='keydown'&&((event.key==='Enter'&&event.target.matches(native.answerSelector||'input:not([type=range])'))||(native.number===19&&['KeyJ','KeyN'].includes(event.code)&&!event.repeat&&!event.ctrlKey&&!event.altKey&&!event.metaKey&&!/^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A)$/.test(event.target?.tagName||'')&&!event.target?.closest?.('#textbookHost')&&!event.target?.isContentEditable&&native.answer()==='')))pendingCheck={scope:'final'};
  if(native.number===15&&event.type==='click'&&button?.hasAttribute('data-step-check')&&!button.disabled)pendingCheck={scope:'step',step:Number(button.dataset.stepCheck)};
  if(native.number===15&&event.type==='keydown'&&event.key==='Enter'&&event.target.hasAttribute('data-step-draft'))pendingCheck={scope:'step',step:Number(event.target.dataset.stepDraft)};
  schedule();
 };
 ['click','input','change','keydown','toggle'].forEach(type=>doc.addEventListener(type,capture,true));
 // Prevent the public page from replacing the pinned condition in a managed attempt.
 doc.addEventListener('click',event=>{
  if(applying)return;
  const b=event.target.closest?.('button,a');
  if(b&&(/^(?:board-next|nextCard|m4-next|next|newTask|nextTask|nextBtn|newBtn)$/.test(b.id)||/^(Следующая задача|Другая задача|Другое задание|Другой пример)/.test(b.textContent.trim()))){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 const style=doc.createElement('style');style.textContent='html[data-learning-readonly="true"] #oge-managed-next{display:none} #oge-board-toolbar,#oge-board-note,#board-settings,#board-next,#m4-next,#oge-board-subtype,#topicSelect,#reviewOnly,#nextCard,.tabs,.minimal-navigation,.practice-settings{display:none!important}';doc.head.append(style);
 const bar=doc.createElement('div');bar.style.cssText='max-width:940px;margin:10px auto;padding:8px;font:15px system-ui';bar.textContent='Работа в кабинете · ответ и подсказки сохраняются.';
 const next=doc.createElement('button');next.id='oge-managed-next';next.textContent='Новая самостоятельная попытка';next.type='button';next.style.cssText='margin:6px;padding:10px;font:inherit';next.onclick=()=>{flush();emit({kind:'new-task',details:{},state:getState()});};bar.append(next);doc.body.prepend(bar);
 root.MathExamLearning.register({trainerId:'oge-public',contentVersion:1,getState,
  applyState(value){applying=true;clearTimeout(timer);timer=null;pendingCheck=false;try{spec=copy(value.taskSpec);if(spec.contentId!==String(native.number)||spec.contentVersion!==1)throw Error('Wrong task');helpUsed=value.state.helpUsed;native.start(spec.descriptor);if(value.state.native!==null)config.applyState(copy(value.state.native));tidy();last=JSON.stringify(getState());}finally{applying=false;}},
  setReadOnly(value){readOnly=value;next.disabled=value;},subscribe(fn){emit=fn;return()=>{emit=()=>{};};}
 });
 return {destroy(){clearTimeout(timer);},isApplyingRemoteState:()=>applying};
};
})(window,document);
