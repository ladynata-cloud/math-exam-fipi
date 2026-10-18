/* Public pages use the same task, validator and renderer as the cabinet. */
(function(){
 'use strict';
 if(window.MathExamRemediationManaged)return;
 const C=window.DivisionCourse,M=window.MultiplicationColumn,A=window.MathExamRemediation,id=document.body.dataset.courseId;
 if((!C?.has(id)&&!M?.has(id))||!A)return;
 window.MathExamRemediationManaged=true;
 window.MathExamDivisionCourseLocal=true;
 const key='mathExamBasics.divisionCourse.v1.'+id;
 const host=document.getElementById('course-local-root')||document.getElementById('learning-remediation-root');
 host.id='learning-remediation-root';
 const notice=document.createElement('p');notice.className='course-local-notice';notice.setAttribute('role','status');host.before(notice);
 let seed=1,created=A.create(id,seed),assisted=false,errors=0,storage,blocked=false,warning='';
 try{
  storage=window.localStorage;
  const raw=storage.getItem(key);
  if(raw){
   const saved=JSON.parse(raw);
   if(saved.version!==1||!Number.isInteger(saved.seed)||saved.seed<0||saved.seed>4294967295||!Number.isInteger(saved.errors)||saved.errors<0||saved.errors>1000000||typeof saved.assisted!=='boolean')throw Error('format');
   const next=A.create(id,saved.seed),state=A.normalize(next.taskSpec,saved.state);
   seed=saved.seed;created={taskSpec:next.taskSpec,state};assisted=saved.assisted||state.hint>0||state.view==='learn';errors=saved.errors;
  }
 }catch(_){blocked=true;warning='Не удалось восстановить запись. Она оставлена без изменений. Можно решать, но новая работа здесь не сохранится.';}
 function updateNotice(){
  const stage=C.stages.find(s=>s.id===id)||M?.stages.find(s=>s.id===id);
  const result=created.state.completed?(stage.guidance==='check'&&!assisted&&!errors?'Три примера решены без подсказок и ошибок. Можно решать ещё.':stage.guidance==='check'?'Три примера решены. Попробуй ещё без помощи.':'Примеры решены по шагам. Продолжай тренировку с новыми числами.'):'Здесь работа сохраняется только в этом браузере. Для занятия с преподавателем открой эту ступень из своего кабинета.';
  notice.textContent=warning||result;
 }
 function save(){
  if(!blocked){try{storage.setItem(key,JSON.stringify({version:1,seed,state:created.state,assisted,errors}));}catch(_){warning='Не удалось сохранить работу в этом браузере. Оставь страницу открытой или продолжи через кабинет.';}}
  updateNotice();
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
    queueMicrotask(()=>{seed=(seed+1)>>>0;created=A.create(id,seed);assisted=false;errors=0;save();apply();});
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
