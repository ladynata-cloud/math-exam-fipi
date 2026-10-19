/* Public pages use the same task, validator and renderer as the cabinet. */
(function(){
 'use strict';
 if(window.MathExamRemediationManaged)return;
 const C=window.DivisionCourse,M=window.MultiplicationColumn,A=window.MathExamRemediation,id=document.body.dataset.courseId;
 if((!C?.has(id)&&!M?.has(id))||!A)return;
 window.MathExamRemediationManaged=true;
 window.MathExamDivisionCourseLocal=true;
 const key='mathExamBasics.divisionCourse.v1.'+id;
 const historyKey='mathExamBasics.divisionCourse.history.v1.'+id;
 const host=document.getElementById('course-local-root')||document.getElementById('learning-remediation-root');
 host.id='learning-remediation-root';
 const notice=document.createElement('p');notice.className='course-local-notice';notice.setAttribute('role','status');host.before(notice);
 let seed=1,created=A.create(id,seed),assisted=false,errors=0,storage,blocked=false,historyBlocked=false,historySaved=false,warning='';
 try{
  storage=window.localStorage;
  const raw=storage.getItem(key);
  if(raw!==null){
   const saved=JSON.parse(raw);
   if(!saved||saved.version!==1||!Number.isInteger(saved.seed)||saved.seed<0||saved.seed>4294967295||!Number.isInteger(saved.errors)||saved.errors<0||saved.errors>1000000||typeof saved.assisted!=='boolean'||(saved.generatorVersion!==undefined&&![1,2].includes(saved.generatorVersion)))throw Error('format');
   // A record without a generator marker belongs to the original generator.
   const next=A.create(id,saved.seed,{generatorVersion:saved.generatorVersion??1}),state=A.normalize(next.taskSpec,saved.state);
   seed=saved.seed;created={taskSpec:next.taskSpec,state};assisted=saved.assisted||state.hint>0||state.view==='learn';errors=saved.errors;
  }
 }catch(_){blocked=true;warning='Не удалось восстановить запись. Она оставлена без изменений. Можно решать, но новая работа здесь не сохранится.';}
 try{
  const raw=storage.getItem(historyKey);
  if(raw!==null){
   const history=JSON.parse(raw);
   if(!history||history.schemaVersion!==1||history.hasCompleted!==true)throw Error('format');
   historySaved=true;
  }
 }catch(_){historyBlocked=true;warning||='Не удалось прочитать историю решённых примеров. Она оставлена без изменений. Можно продолжать тренировку.';}
 function updateNotice(){
  const stage=C.stages.find(s=>s.id===id)||M?.stages.find(s=>s.id===id);
  const result=created.state.completed?(stage.guidance==='check'&&!assisted&&!errors?'Три примера решены без подсказок и ошибок. Можно решать ещё.':stage.guidance==='check'?'Три примера решены. Попробуй ещё без помощи.':'Примеры решены по шагам. Продолжай тренировку с новыми числами.'):'Здесь работа сохраняется только в этом браузере. Для занятия с преподавателем открой эту ступень из своего кабинета.';
  notice.textContent=warning||result;
 }
 function saveCompleted(){
  if(created.state.completed&&!historyBlocked&&!historySaved){
   try{storage.setItem(historyKey,JSON.stringify({schemaVersion:1,hasCompleted:true}));historySaved=true;}
   catch(_){warning||='Не удалось сохранить историю решённых примеров в этом браузере. Можно продолжать через кабинет.';}
  }
 }
 function save(){
  saveCompleted();
  const generatorVersion=created.taskSpec.generatorVersion;
  if(!blocked){try{storage.setItem(key,JSON.stringify({version:1,seed,state:created.state,assisted,errors,...(generatorVersion===undefined?{}:{generatorVersion})}));}catch(_){warning||='Не удалось сохранить работу в этом браузере. Оставь страницу открытой или продолжи через кабинет.';}}
  updateNotice();
 }
 function questionIdentity(spec){return JSON.stringify({contentId:spec.contentId,prompt:spec.task?.prompt,divisionTask:spec.divisionTask});}
 function nextExample(){
  // Save history before replacing the last solved example with unfinished work.
  saveCompleted();
  if(created.state.completed&&!historySaved){
   // A browser can allow replacing an existing key while refusing a new key.
   // Keep the last completed record until its history marker is durable.
   blocked=true;
   warning='Не удалось сохранить историю решённых примеров. Последняя запись оставлена без изменений. Можно решать дальше, но новая работа здесь не сохранится.';
  }
  const previous=questionIdentity(created.taskSpec);
  let nextSeed=seed;
  for(let tries=0;tries<64;tries++){
   nextSeed=(nextSeed+1)>>>0;
   const next=A.create(id,nextSeed);
   if(questionIdentity(next.taskSpec)===previous)continue;
   seed=nextSeed;created=next;assisted=false;errors=0;save();apply();return;
  }
  warning||='Не удалось подобрать другой пример. Твоя работа остаётся на экране.';
  apply();
 }
 let adapter;
 function apply(){
  const spec=JSON.parse(JSON.stringify(created.taskSpec));spec.trainerId='oge-basics';spec.id=id;
  adapter.applyState({taskSpec:spec,state:created.state,readOnly:false});updateNotice();
 }
 window.MathExamLearning={register(value){
  adapter=value;
  adapter.subscribe(event=>{
   if(event.kind==='new-task'){
    // Run after the old button's handler has finished updating its label.
    queueMicrotask(nextExample);
    return;
   }
   created.state=A.normalize(created.taskSpec,event.state);
   if(event.kind==='hint'||created.state.hint>0||created.state.view==='learn')assisted=true;
   if(event.kind==='check'){
    const result=A.evaluate(created.taskSpec,event.details);
    if(result.assisted)assisted=true;
    if(!result.correct)errors=Math.min(1000000,errors+1);
   }
   save();
  });
  apply();
 }};
 const start=document.getElementById('practice'),practice=document.getElementById('view-practice');
 start.onclick=()=>{practice.hidden=false;start.hidden=true;host.querySelector('#lm-answer')?.focus({preventScroll:true});};
 updateNotice();
})();
