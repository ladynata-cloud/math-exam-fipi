(function(global){'use strict';
const collections=['main','ege','practical','research','selfcheck','theory','example'];
const reserved=new Set(['__proto__','prototype','constructor']);
const idOK=x=>typeof x==='string'&&/^[a-z][a-z0-9-]*$/.test(x)&&!reserved.has(x);
const textOK=x=>typeof x==='string'&&x.trim().length>0;
const stable=x=>JSON.stringify(x&&typeof x==='object'?Array.isArray(x)?x.map(v=>JSON.parse(stable(v))):Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(stable(x[k]))])):x);
const normalized=x=>String(x).trim().replace(/\s+/g,' ').replace(/−/g,'-');
const localChapter=source=>['main','theory'].includes(source.collection)?null:source.chapter||null;
const sourceGroup=entry=>stable([entry.kind,entry.source.bookId,entry.source.collection,localChapter(entry.source),entry.source.examTask||null,entry.kind==='theory'?entry.source.point:entry.source.exercise,entry.source.collection==='example'?entry.source.point||null:null]);
function coverageGroups(entries,available){
 const groups=new Map();for(const entry of entries){const id=sourceGroup(entry);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(entry);}
 const result={exercises:0,theoryPoints:0,selfchecks:0,appendices:0,examples:0,availableExercises:0,availableTheoryPoints:0,availableSelfchecks:0,availableAppendices:0,availableExamples:0,partiallyAvailable:0};
 for(const group of groups.values()){const entry=group[0],bucket=entry.kind==='theory'?String(entry.source.point).startsWith('appendix-')?'appendices':'theoryPoints':entry.source.collection==='selfcheck'?'selfchecks':entry.source.collection==='example'?'examples':'exercises',count=group.filter(item=>available.has(item.id)).length;result[bucket]++;if(count===group.length)result['available'+bucket[0].toUpperCase()+bucket.slice(1)]++;else if(count)result.partiallyAvailable++;}
 return result;
}
function validateSource(source,book){
 const errors=[];
 if(!source||source.bookId!==book.id||!collections.includes(source.collection))return ['Unknown source book or collection'];
 for(const key of ['printedPages','pdfPages'])if(!Array.isArray(source[key])||!source[key].length||!source[key].every(n=>Number.isInteger(n)&&n>0&&n<=book.pdfPageCount)||new Set(source[key]).size!==source[key].length)errors.push('Invalid '+key);
 if(!errors.length&&(source.printedPages.length!==source.pdfPages.length||source.printedPages.some((n,i)=>source.pdfPages[i]!==n+1)))errors.push('PDF/printed page mismatch for this edition');
 if(source.collection==='ege'&&![3,6,8,14,16].includes(source.examTask))errors.push('Missing historical EGE task number');
 return errors;
}
function validateLessonData(lesson,book){
 const errors=[],bad=s=>errors.push(s);
 if(!lesson||lesson.schemaVersion!==1||!idOK(lesson.id)||!Number.isInteger(lesson.revision)||lesson.revision<1)return ['Invalid lesson identity'];
 if(!['exercise','theory'].includes(lesson.kind)||!textOK(lesson.title)||!['draft','in-review','reviewed'].includes(lesson.status))bad('Invalid lesson metadata');
 errors.push(...validateSource(lesson.source,book));
 if(lesson.kind==='exercise'&&!textOK(lesson.source?.exercise))bad('Exercise source number is required');
 if(lesson.kind==='theory'&&!textOK(lesson.source?.point))bad('Theory source point is required');
 if(!textOK(lesson.statement?.text)||!textOK(lesson.statement?.goal)||lesson.statement?.givens&&!lesson.statement.givens.every(textOK))bad('Incomplete condition');
 const model=lesson.visualization?.model,views=model?.views||{},points=model?.points||{},names=Object.keys(points),exists=n=>typeof n==='string'&&!reserved.has(n)&&Object.hasOwn(points,n);
 if(lesson.visualization?.type!=='scene3d'||!textOK(lesson.visualization?.caption)||!names.length)bad('Missing visualization');
 for(const name of names)if(reserved.has(name)||!Array.isArray(points[name])||points[name].length!==3||!points[name].every(Number.isFinite))bad('Invalid point '+name);
 const groups=(list,min,max)=>Array.isArray(list)&&list.every(a=>Array.isArray(a)&&a.length>=min&&a.length<=max&&a.every(exists));
 if(!groups(model?.edges,2,2)||model?.faces&&!groups(model.faces,3,Infinity)||model?.arrows&&!groups(model.arrows,2,2))bad('Invalid model segments/faces');
 if(!Object.hasOwn(views,'neutral'))bad('Missing neutral view');
 for(const [key,view] of Object.entries(views))if(reserved.has(key)||!textOK(view?.label)||view.segments&&!groups(view.segments,2,2)||view.polygon&&(!Array.isArray(view.polygon)||view.polygon.length>0&&view.polygon.length<3||!view.polygon.every(exists))||view.points&&(!Array.isArray(view.points)||!view.points.every(exists)))bad('Invalid model view '+key);
 for(const key of ['labelNames','neutralPoints'])if(model?.[key]&&(!Array.isArray(model[key])||!model[key].every(exists)))bad('Invalid model '+key);
 if(model?.labels&&Object.entries(model.labels).some(([key,value])=>!exists(key)||!textOK(value)))bad('Invalid model labels');
 const ids=new Set(),viewOK=view=>view===undefined||typeof view==='string'&&!reserved.has(view)&&Object.hasOwn(views,view);
 const unique=id=>{if(!idOK(id)||ids.has(id))bad('Invalid/duplicate content id');ids.add(id);};
 const inputOK=input=>textOK(input?.prompt)&&Array.isArray(input.accepted)&&input.accepted.length>0&&input.accepted.every(textOK)&&textOK(input.feedback);
 function helpCheck(items,depth=0){
  if(!Array.isArray(items)||depth>20){bad('Invalid help hierarchy');return;}
  for(const h of items){if(!h||typeof h!=='object'){bad('Invalid help item');continue;}unique(h.id);if(!textOK(h.question)||!textOK(h.text)||!viewOK(h.view)||h.theoryIds&&(!Array.isArray(h.theoryIds)||!h.theoryIds.every(idOK)))bad('Invalid help');if(h.children)helpCheck(h.children,depth+1);}
 }
 helpCheck(lesson.help);
 if(!Array.isArray(lesson.steps)||!lesson.steps.length)bad('Missing authored steps');
 else for(const step of lesson.steps){
  unique(step?.id);if(!textOK(step?.title)||!textOK(step?.prompt)||!textOK(step?.explanation)||!viewOK(step?.view)||step?.input&&!inputOK(step.input))bad('Incomplete step');
  if(!Array.isArray(step?.justifications)||!step.justifications.length)bad('Missing justification');
  else for(const j of step.justifications){if(!['given','definition','theorem'].includes(j?.kind)||!textOK(j?.text)||j.theoryId&&!idOK(j.theoryId))bad('Invalid justification');if(j.source)errors.push(...validateSource(j.source,book));}
 }
 const answer=lesson.answer;
 if(lesson.kind==='exercise'&&!answer)bad('Missing answer prompt');
 if(answer&&(!['manual','exact'].includes(answer.mode)||!textOK(answer.prompt)||answer.mode==='exact'&&(!Array.isArray(answer.accepted)||!answer.accepted.length||!answer.accepted.every(textOK))))bad('Invalid answer contract');
 if(!lesson.review||['source','mathematics','pedagogy'].some(k=>!['pending','passed'].includes(lesson.review[k])))bad('Missing review state');
 if(lesson.status==='reviewed'&&(['source','mathematics','pedagogy'].some(k=>lesson.review?.[k]!=='passed')||!textOK(lesson.review?.reviewer)||!/^\d{4}-\d\d-\d\dT/.test(lesson.review?.at)||!Number.isFinite(Date.parse(lesson.review.at))))bad('Review incomplete');
 return errors;
}
function validateLesson(lesson,book){try{return validateLessonData(lesson,book);}catch{return ['Malformed lesson structure'];}}
function inspectBundle(catalog,lessons,options={}){
 if(catalog?.schemaVersion!==1||!idOK(catalog.book?.id)||!textOK(catalog.book?.title)||!textOK(catalog.book?.edition)||!Number.isInteger(catalog.book?.pdfPageCount)||catalog.book.pdfPageCount<1||!Array.isArray(catalog.entries)||typeof catalog.inventoryComplete!=='boolean'||!Array.isArray(lessons))throw Error('Invalid course catalog');
 const issues=[],available=new Map(),contents=new Map(),duplicates=new Set(),entries=new Map(),sourceKeys=new Map();
 for(const lesson of lessons){if(!lesson||!idOK(lesson.id)){issues.push({id:null,errors:['Invalid lesson identity']});continue;}if(contents.has(lesson.id))duplicates.add(lesson.id);contents.set(lesson.id,lesson);}
 for(const entry of catalog.entries){
  if(!entry||!idOK(entry.id)||entries.has(entry.id)||!Number.isInteger(entry.revision)||entry.revision<1||!['exercise','theory'].includes(entry.kind)||!textOK(entry.title)||!['draft','in-review','reviewed'].includes(entry.status))throw Error('Duplicate/invalid inventory metadata');entries.set(entry.id,entry);
  const errors=validateSource(entry.source,catalog.book);if(errors.length)issues.push({id:entry.id,errors});
  const sourceKey=stable([entry.kind,entry.source?.collection,localChapter(entry.source||{}),entry.source?.examTask||null,entry.source?.exercise||null,entry.source?.point||null,entry.source?.subpart||null]);
  if(sourceKeys.has(sourceKey)){duplicates.add(entry.id);duplicates.add(sourceKeys.get(sourceKey));}else sourceKeys.set(sourceKey,entry.id);
 }
 for(const entry of catalog.entries){
  if(entry.status!=='reviewed')continue;
  const lesson=contents.get(entry.id),errors=lesson?validateLesson(lesson,catalog.book):['Missing authored lesson'];
  if(lesson?.testOnly===true&&options.allowTestFixtures!==true)errors.push('Engineering fixture is not published content');
  if(duplicates.has(entry.id))errors.push('Duplicate content/source identity');
  if(lesson&&['revision','kind','title','status','source'].some(k=>stable(lesson[k])!==stable(entry[k])))errors.push('Catalog/content mismatch');
  if(errors.length)issues.push({id:entry.id,errors});else available.set(entry.id,lesson);
 }
 const coverage={inventoried:catalog.entries.length,available:available.size,draft:catalog.entries.filter(x=>x.status==='draft').length,inReview:catalog.entries.filter(x=>x.status==='in-review').length,blocked:catalog.entries.filter(x=>x.status==='reviewed'&&!available.has(x.id)).length,inventoryComplete:catalog.inventoryComplete,...coverageGroups(catalog.entries,available)};
 return {available,coverage,issues};
}
function createApp(root,options){
 const {catalog,lessons}=options,{available,coverage,issues}=inspectBundle(catalog,lessons,options),doc=root.ownerDocument,win=doc.defaultView,math=options.math||win.StereoMath,sceneViewer=options.sceneViewer||win.TaskSceneViewer;
 let storage;try{storage=options.storage??win.localStorage;}catch{storage=null;}
 let current=null,state=null,key='',expected=null,viewer=null,dialogViewer=null,dialog=null,dialogView='neutral',locked=false,destroyed=false;
 const theoryTrail=[];
 const cache=new Map();
 /* MERZLYAK_BOARD_BEGIN: optional isolated room state; standalone code is retained verbatim. */
 let boardCatalog=null;
 /* MERZLYAK_BOARD_END */
 function el(tag,text,attrs={}){const node=doc.createElement(tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);if(text!==undefined)math.appendText(node,String(text));return node;}
 function setDisplayText(node,text){node.replaceChildren();math.appendText(node,String(text));}
 const alerts=el('div',undefined,{class:'course-alerts','aria-live':'polite'}),view=el('main');root.replaceChildren(alerts,view);
 function status(text){if(![...alerts.children].some(node=>node.tagName==='P'&&node.textContent===text))alerts.append(el('p',text));}
 function safeRead(k){try{return storage?.getItem(k)||null;}catch{status('Сохранение в браузере недоступно. Оставь страницу открытой, чтобы сохранить текущие записи.');return null;}}
 function initial(){return {draft:'',stepDrafts:{},revealed:0,assisted:false,checked:false,camera:null};}
 function readState(raw){try{const saved=JSON.parse(raw);if(!saved||typeof saved!=='object')return initial();return {draft:typeof saved.draft==='string'?saved.draft:'',stepDrafts:saved.stepDrafts&&typeof saved.stepDrafts==='object'?saved.stepDrafts:{},revealed:Number.isInteger(saved.revealed)?Math.max(0,Math.min(saved.revealed,current.steps.length)):0,assisted:saved.assisted===true,checked:saved.checked===true,camera:saved.camera&&Number.isFinite(saved.camera.yaw)&&Number.isFinite(saved.camera.pitch)?saved.camera:null};}catch{return initial();}}
 function freeze(){
  if(locked)return;locked=true;
  const note=el('section',undefined,{class:'course-conflict'});note.append(el('strong','В другом окне уже сохранена новая работа. Твои записи ниже можно скопировать.'),el('p',current.statement.text));
  const backup=el('textarea',undefined,{readonly:'',rows:'6','aria-label':'Записи прежнего окна'});backup.value=[state.draft,...Object.entries(state.stepDrafts).map(([id,value])=>id+': '+value)].join('\n');note.append(backup);
  const recover=el('button','Открыть сохранённую работу');recover.addEventListener('click',()=>{cache.delete(key);locked=false;open(current.id);recover.remove();});note.append(recover);alerts.append(note);
  view.querySelectorAll('input,textarea').forEach(node=>node.readOnly=true);view.querySelectorAll('button').forEach(node=>node.disabled=true);
 }
 function save(){
  if(locked||!current)return false;
  const latest=safeRead(key);if(latest!==expected){freeze();return false;}
  const raw=JSON.stringify(state);
  try{if(storage){storage.setItem(key,raw);expected=raw;cache.delete(key);}else cache.set(key,{raw,base:expected});}catch{cache.set(key,{raw,base:expected});status('Не удалось сохранить на устройстве. Текст остаётся в открытой странице.');}
  return true;
 }
 function assisted(){state.assisted=true;return save();}
 function sourceText(source){return catalog.book.edition+' · стр. '+source.printedPages.join(', ')+' · PDF '+source.pdfPages.join(', ')+(source.point?' · пункт '+source.point:'')+(source.exercise?' · № '+source.exercise:'')+(source.subpart?' · '+source.subpart:'')+(source.examTask?' · номер ЕГЭ в книге: '+source.examTask:'');}
 function sourceNode(lesson){const details=el('details');details.append(el('summary','Где это в учебнике?'),el('p',sourceText(lesson.source)));return details;}
 function closeTheory(){if(!dialog)return;theoryTrail.length=0;dialogViewer?.destroy();dialogViewer=null;const old=dialog;dialog=null;if(old.close)old.close();old.remove();old._returnFocus?.focus();}
 function destroyScene(){closeTheory();viewer?.destroy();viewer=null;}
 function theoryButton(id){
  const lesson=available.get(id);if(!lesson||lesson.kind!=='theory')return null;
  const button=el('button','Почему? '+lesson.title,{type:'button'});button.addEventListener('click',()=>showTheory(id,button));return button;
 }
 function justifications(step,container){
  const details=el('details');details.append(el('summary','Почему этот переход верен?'));
  for(const j of step.justifications){const p=el('p',j.text);details.append(p);if(j.source)details.append(el('small',sourceText(j.source)));if(j.theoryId){const button=theoryButton(j.theoryId);if(button)details.append(button);}}
  container.append(details);
 }
 function showTheory(id,from,backState){
  if(current&&!assisted())return;const lesson=available.get(id);if(!lesson||lesson.kind!=='theory')return;
  if(dialog){const old=dialog;from=old._returnFocus;if(!backState)theoryTrail.push({id:old.dataset.theory,camera:dialogViewer?.getState(),view:dialogView,opened:[...old.querySelectorAll('details')].map((node,index)=>node.open?index:-1).filter(index=>index>=0)});dialogViewer?.destroy();dialogViewer=null;dialog=null;if(old.close)old.close();old.remove();}
  dialog=el('dialog',undefined,{class:'theory-dialog','aria-labelledby':'theory-dialog-title','data-theory':id});dialog._returnFocus=from;
  const shownDialog=dialog;let restoring=!!backState;dialogView='neutral';
  function selectTheoryView(view){if(restoring||dialog!==shownDialog)return;dialogView=view;dialogViewer?.setView(view);}
  const close=el('button',theoryTrail.length?'Назад к объяснению':'Вернуться к задаче',{type:'button'}),title=el('h2',lesson.title,{id:'theory-dialog-title'}),model=el('div',undefined,{class:'textbook-model task-scene'});
  close.addEventListener('click',()=>{if(theoryTrail.length){const previous=theoryTrail.pop();showTheory(previous.id,from,previous);}else closeTheory();});dialog.addEventListener('cancel',event=>{event.preventDefault();closeTheory();});
  function focusable(node){
   if(node.disabled||node.closest('[hidden],[inert]')||node.getAttribute('tabindex')==='-1')return false;
   for(let parent=node.parentElement;parent&&parent!==dialog;parent=parent.parentElement)if(parent.tagName==='DETAILS'&&!parent.open){const summary=[...parent.children].find(child=>child.tagName==='SUMMARY');if(!summary?.contains(node))return false;}
   const style=win.getComputedStyle?.(node);return style?.display!=='none'&&style?.visibility!=='hidden';
  }
  dialog.addEventListener('keydown',event=>{if(event.defaultPrevented)return;if(event.key==='Escape'){event.preventDefault();closeTheory();}if(event.key==='Tab'){const nodes=[...dialog.querySelectorAll('button,input,textarea,summary,a[href],[tabindex="0"]')].filter(focusable);if(event.shiftKey&&doc.activeElement===nodes[0]){event.preventDefault();nodes.at(-1).focus();}else if(!event.shiftKey&&doc.activeElement===nodes.at(-1)){event.preventDefault();nodes[0].focus();}}});
  dialog.append(close,title,el('p',lesson.statement.text),model,el('p',lesson.statement.goal),el('p',lesson.visualization.caption),sourceNode(lesson));
  const nestedHelp=el('div');mountHelp(lesson.help,nestedHelp,()=>({setView:selectTheoryView}));dialog.append(nestedHelp);
  const steps=el('div');for(const step of lesson.steps){const d=el('details');d.append(el('summary',step.title),el('p',step.prompt),el('p',step.explanation));justifications(step,d);d.addEventListener('toggle',()=>{if(d.isConnected&&d.open)selectTheoryView(step.view||'neutral');});steps.append(d);}dialog.append(steps);root.append(dialog);
  dialogViewer=sceneViewer.mount(model,lesson.visualization.model,{savedCamera:backState?.camera});
  if(backState){
   const details=[...dialog.querySelectorAll('details')],pendingToggles=new Set((backState.opened||[]).map(index=>details[index]).filter(Boolean));
   const restoreSelected=()=>{if(dialog!==shownDialog)return;restoring=false;selectTheoryView(backState.view||'neutral');};
   // Native details emits queued toggle events. Suppress their DOM-order view
   // changes; restore the saved selected view after the final event's listeners.
   dialog.addEventListener('toggle',event=>{if(pendingToggles.delete(event.target)&&!pendingToggles.size)win.queueMicrotask(restoreSelected);},true);
   if(!pendingToggles.size)restoreSelected();else for(const detail of pendingToggles)detail.open=true;
  }
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');close.focus();
 }
 function mountHelp(items,parent,target=()=>viewer){
  for(const item of items){const details=el('details',undefined,{'data-help':item.id}),summary=el('summary',item.question);details.append(summary,el('p',item.text));
   summary.addEventListener('click',event=>{if(!details.open&&!assisted())event.preventDefault();});
   details.addEventListener('toggle',()=>{if(details.isConnected&&details.open){if(!assisted())return;target()?.setView(item.view||'neutral');}});
   for(const id of item.theoryIds||[]){const button=theoryButton(id);if(button)details.append(button);}mountHelp(item.children||[],details,target);parent.append(details);
  }
 }
 function open(id){
  if(destroyed||locked)return false;const lesson=available.get(id);if(!lesson){status('Этот материал ещё не прошёл все проверки.');return false;}
  destroyScene();current=lesson;key='mathExamTextbook.v1:'+catalog.book.id+':'+lesson.id+':r'+lesson.revision;expected=safeRead(key);const cached=cache.get(key);state=readState(cached?.raw||expected);view.replaceChildren();
  win.history?.replaceState(null,'','#'+lesson.id);
  const back=el('button','← Все материалы курса',{type:'button'});back.addEventListener('click',home);
  const header=el('header');header.append(back,el('p',lesson.kind==='theory'?'Теория':'Задача'),el('h1',lesson.title));view.append(header);
  const layout=el('div',undefined,{class:'textbook-layout'}),main=el('section',undefined,{class:'textbook-main'}),side=el('aside',undefined,{class:'textbook-help','aria-label':'Помощь к текущей задаче'}),model=el('div',undefined,{class:'textbook-model task-scene','data-main-model':''});
  main.append(el('p',lesson.statement.text,{class:'textbook-condition'}));if(lesson.statement.givens?.length){const list=el('ul');for(const text of lesson.statement.givens)list.append(el('li',text));main.append(list);}main.append(el('p',lesson.statement.goal,{class:'textbook-goal'}),model,el('p',lesson.visualization.caption),sourceNode(lesson));
  if(lesson.answer){
   const form=el('form',undefined,{'data-final-form':''}),label=el('label',lesson.answer.prompt,{for:'final-answer'}),input=el(lesson.answer.mode==='manual'?'textarea':'input',undefined,{id:'final-answer',autocomplete:'off'}),check=el('button',lesson.answer.mode==='manual'?'Сохранить рассуждение':'Проверить ответ',{type:'submit'}),feedback=el('p',undefined,{role:'status','data-final-feedback':''});input.value=state.draft;
   input.addEventListener('input',()=>{state.draft=input.value;save();});
   form.addEventListener('submit',event=>{event.preventDefault();if(locked)return;state.draft=input.value;
    // Open native disclosures count as help even before their queued toggle fires.
    if(side.querySelector('details[open]'))state.assisted=true;
    if(!save())return;
    if(lesson.answer.mode==='manual'){setDisplayText(feedback,'Рассуждение сохранено. Его обоснованность нужно обсудить с учителем.');return;}
    const correct=lesson.answer.accepted.some(value=>normalized(value)===normalized(input.value));
    setDisplayText(feedback,correct?(state.checked?'Этот ответ уже проверен.':state.assisted?'Ответ совпал с проверенным после обращения к помощи.':'Ответ совпал с проверенным. Решено самостоятельно.'):(lesson.answer.feedback||'Проверь ответ. Можно раскрыть помощь рядом с условием.'));if(correct)state.checked=true;else state.assisted=true;save();
   });form.append(label,input,check,feedback);main.append(form);
  }
  const help=el('details',undefined,{'data-main-help':''}),summary=el('summary','Хочешь подсказку?'),helpBody=el('div');summary.addEventListener('click',event=>{if(!help.open&&!assisted())event.preventDefault();});help.addEventListener('toggle',()=>{if(help.isConnected&&help.open)assisted();});help.append(summary,helpBody);mountHelp(lesson.help,helpBody);
  const steps=el('section',undefined,{'data-steps':''}),next=el('button','Разобрать по шагам',{type:'button'});helpBody.append(steps,next);
  function addStep(index){const step=lesson.steps[index],section=el('section',undefined,{class:'textbook-step','data-step':step.id});section.append(el('h3',step.title),el('p',step.prompt));const explain=el('details');explain.append(el('summary','Показать объяснение'),el('p',step.explanation));justifications(step,explain);section.append(explain);
   if(step.input){const form=el('form'),fieldId='step-'+step.id,input=el('input',undefined,{id:fieldId,autocomplete:'off'}),feedback=el('p',undefined,{role:'status'});input.value=state.stepDrafts[step.id]||'';input.addEventListener('input',()=>{state.stepDrafts[step.id]=input.value;save();});form.append(el('label',step.input.prompt,{for:fieldId}),input,el('button','Проверить этот шаг',{type:'submit'}),feedback);form.addEventListener('submit',event=>{event.preventDefault();if(!assisted())return;setDisplayText(feedback,step.input.accepted.some(value=>normalized(value)===normalized(input.value))?'Ответ на этот шаг совпал.':step.input.feedback);});section.append(form);}
   const onModel=el('button','Показать на рисунке',{type:'button'});onModel.addEventListener('click',()=>{if(assisted())viewer?.setView(step.view||'neutral');});section.append(onModel);steps.append(section);
  }
  for(let i=0;i<state.revealed;i++)addStep(i);if(state.revealed>0){help.open=true;state.assisted=true;}
  function nextLabel(){next.hidden=state.revealed>=lesson.steps.length;next.textContent=state.revealed?'Следующий шаг':'Разобрать по шагам';}nextLabel();
  next.addEventListener('click',()=>{if(!assisted()||state.revealed>=lesson.steps.length)return;const index=state.revealed;state.revealed++;if(!save())return;addStep(index);viewer?.setView(lesson.steps[index].view||'neutral');nextLabel();});
  side.append(help);layout.append(main,side);view.append(layout);viewer=sceneViewer.mount(model,lesson.visualization.model,{savedCamera:state.camera,onChange:camera=>{state.camera=camera;save();}});if(cached&&cached.base!==expected)freeze();
  return true;
 }
 function home(){if(destroyed||locked)return;destroyScene();current=null;state=null;view.replaceChildren();win.history?.replaceState(null,'',win.location.pathname+win.location.search);view.append(el('h1',catalog.book.title),el('p',catalog.book.edition),el('p','В учебнике учтено задач: '+coverage.exercises+'; пунктов теории: '+coverage.theoryPoints+(coverage.selfchecks?'; вопросов самопроверки: '+coverage.selfchecks:'')+(coverage.appendices?'; приложений: '+coverage.appendices:'')+'. Полностью доступны задачи: '+coverage.availableExercises+'; пункты теории: '+coverage.availableTheoryPoints+(coverage.availableSelfchecks?'; вопросы самопроверки: '+coverage.availableSelfchecks:'')+'.'),el('p','Доступно разборов и частей задач: '+coverage.available+'. Остальные материалы готовятся.'));
  if(!coverage.inventoryComplete)view.append(el('p','Список учебника ещё дополняется. Эти числа пока не означают полное покрытие книги.',{class:'course-note'}));
  if(!available.size)view.append(el('p','Проверенные материалы пока не опубликованы.'));
  const controls=el('section',undefined,{class:'catalog-filters','aria-label':'Найти материал'}),search=el('input',undefined,{id:'catalog-search',type:'search',placeholder:'Номер задачи, пункт или название'});
  const collectionNames={main:'Основные задачи',ege:'ЕГЭ в учебнике',practical:'Практические задачи',research:'Исследования',selfcheck:'Вопросы для самопроверки',theory:'Теория',example:'Разобранные примеры'};
  function select(id,label,choices){const box=el('label',label,{for:id}),node=el('select',undefined,{id});for(const [value,title] of choices)node.append(el('option',title,{value}));box.append(node);controls.append(box);return node;}
  controls.append(el('label','Найти номер или тему',{for:'catalog-search'}),search);
  const kind=select('catalog-kind','Тип',[['','Все материалы'],['exercise','Задачи'],['theory','Теория']]);
  const collection=select('catalog-collection','Раздел',[['','Все разделы'],...collections.filter(name=>catalog.entries.some(entry=>entry.source.collection===name)).map(name=>[name,collectionNames[name]])]);
  const chapters=[...new Set(catalog.entries.map(entry=>entry.source.chapter||''))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ru',{numeric:true}));
  const chapter=select('catalog-chapter','Глава',[['','Все главы'],...chapters.map(name=>[name,name])]);
  const results=el('div',undefined,{class:'catalog-results','aria-live':'polite'});view.append(controls,results);let readyPage=0,pendingPage=0;
  function renderResults(){
   results.replaceChildren();const q=search.value.trim().toLocaleLowerCase('ru').replace(/ё/g,'е'),number=q.match(/^(?:№\s*)?(\d+(?:\.\d+)?)$/)?.[1];
   const filtered=catalog.entries.filter(entry=>{const s=entry.source;if(kind.value&&entry.kind!==kind.value||collection.value&&s.collection!==collection.value||chapter.value&&s.chapter!==chapter.value)return false;if(!q)return true;if(number)return (entry.kind==='theory'?s.point:s.exercise)===number;return [entry.title,s.exercise,s.point,s.subpart,s.chapter,collectionNames[s.collection],s.examTask?'ЕГЭ '+s.examTask:''].filter(Boolean).join(' ').toLocaleLowerCase('ru').replace(/ё/g,'е').includes(q);});
   const ready=filtered.filter(entry=>available.has(entry.id)),pending=filtered.filter(entry=>!available.has(entry.id)),groups=new Map();for(const entry of pending){const group=sourceGroup(entry);if(!groups.has(group))groups.set(group,[]);groups.get(group).push(entry);}
   results.append(el('p','Найдено карточек: '+filtered.length+'. Доступно: '+ready.length+'. Ещё готовятся: '+pending.length+'.'));
   function pager(parent,count,page,move){const total=Math.ceil(count/24);if(total<2)return;const nav=el('nav',undefined,{'aria-label':'Страницы списка'}),prev=el('button','← Назад',{type:'button'}),next=el('button','Далее →',{type:'button'});prev.disabled=page===0;next.disabled=page>=total-1;prev.addEventListener('click',()=>move(page-1));next.addEventListener('click',()=>move(page+1));nav.append(prev,el('span',(page+1)+' / '+total),next);parent.append(nav);}
   const readySection=el('section',undefined,{'data-catalog-ready':''});readySection.append(el('h2','Можно изучать сейчас'));if(!ready.length)readySection.append(el('p','По этому запросу проверенных материалов пока нет.'));readyPage=Math.min(readyPage,Math.max(0,Math.ceil(ready.length/24)-1));
   for(const entry of ready.slice(readyPage*24,(readyPage+1)*24)){const article=el('article'),button=el('button',entry.title,{type:'button','data-lesson':entry.id});button.addEventListener('click',()=>open(entry.id));article.append(button,el('p',sourceText(entry.source)));readySection.append(article);}pager(readySection,ready.length,readyPage,page=>{readyPage=page;renderResults();});results.append(readySection);
   if(pending.length){const pendingSection=el('details',undefined,{'data-catalog-pending':''});pendingSection.append(el('summary','Учтены, но ещё не готовы: '+groups.size+' номеров / пунктов'));const groupList=[...groups.values()];pendingPage=Math.min(pendingPage,Math.max(0,Math.ceil(groupList.length/24)-1));
    for(const group of groupList.slice(pendingPage*24,(pendingPage+1)*24)){const entry=group[0],s=entry.source,article=el('article'),identity=entry.kind==='theory'?(String(s.point).startsWith('appendix-')?'Приложение '+s.point.slice(9):'Пункт '+s.point):'№ '+s.exercise;article.append(el('h3',identity+' · '+collectionNames[s.collection]+(s.examTask?' · исторический номер ЕГЭ '+s.examTask:'')),el('p',group.map(item=>item.title).join('; ')),el('p','Разбор ещё готовится.'));pendingSection.append(article);}
    pager(pendingSection,groupList.length,pendingPage,page=>{pendingPage=page;renderResults();results.querySelector('[data-catalog-pending]').open=true;});results.append(pendingSection);
   }
  }
  function filterChanged(){readyPage=0;pendingPage=0;renderResults();}search.addEventListener('input',filterChanged);for(const node of [kind,collection,chapter])node.addEventListener('change',filterChanged);renderResults();
 /* MERZLYAK_BOARD_BEGIN: semantic catalog state, activated only by the registered wrapper. */
  if(options.boardSession)boardCatalog={
   read:()=>({search:search.value,kind:kind.value,collection:collection.value,chapter:chapter.value,readyPage,pendingPage}),
   apply(value){search.value=value.search;kind.value=value.kind;collection.value=value.collection;chapter.value=value.chapter;readyPage=value.readyPage;pendingPage=value.pendingPage;renderResults();}
  };
 /* MERZLYAK_BOARD_END */
 }
 /* MERZLYAK_BOARD_BEGIN: current-card mirror; no personal progress is imported or credited. */
 if(options.boardSession){
  const session=options.boardSession,copy=value=>JSON.parse(JSON.stringify(value));
  let applying=false,catalogState={search:'',kind:'',collection:'',chapter:'',readyPage:0,pendingPage:0};
  const pendingToggles=new Map(),oldSave=save,oldAssisted=assisted,oldOpen=open,oldHome=home,oldTheory=showTheory;
  const announcements={none:'',rotate:'Вид модели изменён. Геометрия осталась прежней.',reset:'Исходный вид модели восстановлен.'};
  const announcement=node=>Object.keys(announcements).find(key=>announcements[key]===(node?.querySelector('.am-sr-only')?.textContent||''))||'none';
  const opened=node=>[...node.querySelectorAll('details')].flatMap((detail,index)=>detail.open?[index]:[]);
  const selected=node=>node?.querySelector('svg[data-view]')?.dataset.view||'neutral';
  function modelState(node,instance){return {camera:instance.getState(),view:selected(node),announcement:announcement(node)};}
  function theoryState(){return dialog?{id:dialog.dataset.theory,camera:dialogViewer.getState(),view:dialogView,opened:opened(dialog),announcement:announcement(dialog)}:null;}
  function setAnnouncement(node,value){const output=node?.querySelector('.am-sr-only');if(output)output.textContent=announcements[value];}
  function restoreDetails(node,indexes){
   const indices=new Set(indexes);
   [...node.querySelectorAll('details')].forEach((detail,index)=>{
    // A newly rendered open disclosure already has a queued native toggle.
    // Suppress its teaching side effects as well as the toggles changed below.
    if(detail.open||detail.open!==indices.has(index))pendingToggles.set(detail,indices.has(index));
    detail.open=indices.has(index);
   });
  }
  function feedbackText(lesson,kind){return {none:'',manual:'Рассуждение сохранено. Его обоснованность нужно обсудить с учителем.',already:'Этот ответ уже проверен.',assisted:'Ответ совпал с проверенным после обращения к помощи.',independent:'Ответ совпал с проверенным. Решено самостоятельно.',wrong:lesson.answer?.feedback||'Проверь ответ. Можно раскрыть помощь рядом с условием.'}[kind];}
  function getState(){
   if(!current){if(boardCatalog)catalogState=boardCatalog.read();return {version:1,bookId:catalog.book.id,lessonId:null,work:null,catalog:{...copy(catalogState),search:session.encodeText(catalogState.search)},view:null};}
   const model=modelState(view.querySelector('[data-main-model]'),viewer),work=copy(state);work.camera=copy(model.camera);
   work.draft=session.encodeText(work.draft);for(const id of Object.keys(work.stepDrafts))work.stepDrafts[id]=session.encodeText(work.stepDrafts[id]);
   const feedback={final:view.querySelector('[data-final-feedback]')?.dataset.boardFeedback||'none',steps:{}};
   for(const section of view.querySelectorAll('[data-step]')){const output=section.querySelector('form [role=status]');if(output)feedback.steps[section.dataset.step]=output.dataset.boardFeedback||'none';}
   return {version:1,bookId:catalog.book.id,lessonId:current.id,work,catalog:{...copy(catalogState),search:session.encodeText(catalogState.search)},view:{model,opened:opened(view),feedback,theory:{active:theoryState(),trail:theoryTrail.map(item=>({...copy(item),announcement:item.announcement||'none'}))}}};
  }
  save=function(){return applying?true:oldSave();};
  assisted=function(){return applying?true:oldAssisted();};
  open=function(id){
   if(!available.has(id))return oldOpen(id);
   if(!applying){if(!current&&boardCatalog)catalogState=boardCatalog.read();if(current?.id!==id){session.clearStorage();cache.clear();}}
   const result=oldOpen(id);
   if(result)for(const input of view.querySelectorAll('input,textarea'))input.maxLength=2000;
   return result;
  };
  home=function(){
   if(!applying){session.clearStorage();cache.clear();}
   oldHome();boardCatalog?.apply(catalogState);
   const search=view.querySelector('#catalog-search');if(search)search.maxLength=200;
  };
  showTheory=function(id,from,backState){
   if(!applying&&!backState&&dialog&&theoryTrail.length>=8){status('Вернись к предыдущему объяснению, чтобы открыть новое.');return;}
   const previous=dialog?announcement(dialog):'none',before=theoryTrail.length;
   oldTheory(id,from,backState);
   if(theoryTrail.length>before)theoryTrail.at(-1).announcement=previous;
   if(backState)setAnnouncement(dialog,backState.announcement||'none');
  };
  function applyState(value){
   if(!session.validateState(value))throw new TypeError('Invalid Merzlyak board state');
   pendingToggles.clear();applying=true;
   try{
    session.clearStorage();cache.clear();catalogState=copy(value.catalog);catalogState.search=session.decodeText(catalogState.search);locked=false;
    if(value.lessonId===null){home();return;}
    const lesson=available.get(value.lessonId),storageKey='mathExamTextbook.v1:'+catalog.book.id+':'+lesson.id+':r'+lesson.revision;
    const work=copy(value.work);work.draft=session.decodeText(work.draft);for(const id of Object.keys(work.stepDrafts))work.stepDrafts[id]=session.decodeText(work.stepDrafts[id]);
    storage.setItem(storageKey,JSON.stringify(work));open(lesson.id);
    restoreDetails(view,value.view.opened);viewer.setView(value.view.model.view);setAnnouncement(view.querySelector('[data-main-model]'),value.view.model.announcement);
    const output=view.querySelector('[data-final-feedback]');if(output){output.dataset.boardFeedback=value.view.feedback.final;setDisplayText(output,feedbackText(lesson,value.view.feedback.final));}
    for(const [id,kind]of Object.entries(value.view.feedback.steps)){const section=[...view.querySelectorAll('[data-step]')].find(node=>node.dataset.step===id),output=section?.querySelector('form [role=status]'),step=lesson.steps.find(item=>item.id===id);if(output){output.dataset.boardFeedback=kind;setDisplayText(output,kind==='none'?'':kind==='correct'?'Ответ на этот шаг совпал.':step.input.feedback);}}
    const theory=value.view.theory;
    if(theory.active){
     theoryTrail.push(...copy(theory.trail));
     // Restore the viewer through its existing camera option, without replaying
     // clicks or submits. An empty disclosure list leaves its closure live.
     showTheory(theory.active.id,view.querySelector('button'),{...copy(theory.active),opened:[]});
     restoreDetails(dialog,theory.active.opened);setAnnouncement(dialog,theory.active.announcement);
    }
   }finally{applying=false;}
  }
  root.addEventListener('toggle',event=>{
   if(!pendingToggles.has(event.target))return;
   const expectedOpen=pendingToggles.get(event.target);pendingToggles.delete(event.target);
   // A controller may already have changed this disclosure after hydration.
   // Suppress only the queued remote state, not that newer local action.
   if(event.target.open===expectedOpen)event.stopImmediatePropagation();
  },true);
  root.addEventListener('input',event=>{
   if(applying)return;const input=event.target;if(!input.matches('input,textarea'))return;
   // Bound drafts before the ordinary listener; never replace mathematical
   // comparison signs. The snapshot layer handles lossless wire escaping.
   input.value=input.value.slice(0,input.id==='catalog-search'?200:2000);
  },true);
  root.addEventListener('submit',event=>{
   if(applying||!current)return;const form=event.target;
   if(form.matches('[data-final-form]')){
    const output=form.querySelector('[data-final-feedback]'),answer=current.answer,input=form.querySelector('input,textarea');
    output.dataset.boardFeedback=answer.mode==='manual'?'manual':answer.accepted.some(value=>normalized(value)===normalized(input.value))?(state.checked?'already':state.assisted||view.querySelector('[data-main-help] details[open], [data-main-help][open]')?'assisted':'independent'):'wrong';
   }else{
    const section=form.closest('[data-step]'),step=current.steps.find(item=>item.id===section?.dataset.step),output=form.querySelector('[role=status]');
    if(step?.input&&output)output.dataset.boardFeedback=step.input.accepted.some(value=>normalized(value)===normalized(form.querySelector('input').value))?'correct':'wrong';
   }
  },true);
  session.attach({getState,applyState,isApplying:()=>{
   for(const detail of pendingToggles.keys())if(!root.contains(detail))pendingToggles.delete(detail);
   return applying||pendingToggles.size>0;
  }});
 }
 /* MERZLYAK_BOARD_END */
 function onStorage(event){if(current&&event.key===key&&safeRead(key)!==expected)freeze();}
 win.addEventListener('storage',onStorage);const start=win.location.hash.slice(1);if(start&&available.has(start))open(start);else home();
 return {open,home,coverage,issues,destroy(){destroyed=true;destroyScene();win.removeEventListener('storage',onStorage);root.replaceChildren();}};
}
const api={validateLesson,inspectBundle,createApp};global.StereoTextbook=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
