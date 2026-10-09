(function(root){'use strict';
// A small, untimed sample across the 13 course numbers. This is not an exam
// forecast or an authentication boundary: its separate local record is editable.
const KEY='mathexam.profileCheckpoint.v1';
const ORDER=[4,7,1,2,8,3,10,5,12,9,6,11,13];
function create(lessons,storage,learningState){
 const known=new Map(lessons.map(l=>[l.id,l]));
 const pools=new Map(ORDER.map(number=>[number,lessons.filter(l=>l.position===number).flatMap(lesson=>lesson.tasks.slice(-3).map(task=>({lesson,task})))]));
 let data={version:1,round:null,history:[]},raw='',blocked=false,warning='';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const bool=value=>typeof value==='boolean';
 const text=value=>typeof value==='string'&&value.length<=200;
 function empty(number){return {number,lessonId:null,taskId:null,draft:'',submitted:false,correct:false,assisted:false,unavailable:false};}
 function validateRound(round){
  if(!round||typeof round!=='object'||typeof round.id!=='string'||!round.id||round.id.length>100||!text(round.started)||!text(round.finished)||!bool(round.complete)||!Number.isInteger(round.index)||round.index<0||round.index>ORDER.length||round.complete!==(round.index===ORDER.length)||!Array.isArray(round.items)||round.items.length!==ORDER.length)throw Error('round');
  const ids=new Set();
  const items=round.items.map((item,index)=>{
   if(!item||item.number!==ORDER[index]||!text(item.draft)||!['submitted','correct','assisted','unavailable'].every(key=>bool(item[key])))throw Error('item');
   const clean={number:item.number,lessonId:item.lessonId,taskId:item.taskId,draft:item.draft,submitted:item.submitted,correct:item.correct,assisted:item.assisted,unavailable:item.unavailable};
   if(item.taskId===null&&item.lessonId===null){
    if(item.submitted||item.correct||item.assisted||item.draft)throw Error('empty item');
   }else{
    const lesson=known.get(item.lessonId);
    if(item.unavailable||!lesson||lesson.position!==item.number||!lesson.tasks.slice(-3).some(t=>t.id===item.taskId)||ids.has(item.taskId)||(!item.submitted&&item.correct)||(item.submitted&&!item.draft.trim()))throw Error('task');
    ids.add(item.taskId);
   }
   if(index<round.index&&!item.submitted&&!item.unavailable)throw Error('skipped item');
   if(index>round.index&&(item.taskId!==null||item.unavailable))throw Error('unopened item');
   return clean;
  });
  return {id:round.id,index:round.index,complete:round.complete,items,started:round.started,finished:round.finished};
 }
 function decode(value){
  const saved=JSON.parse(value);
  if(!saved||saved.version!==1||!Array.isArray(saved.history)||saved.history.length>20||!Object.prototype.hasOwnProperty.call(saved,'round'))throw Error('version');
  const round=saved.round===null?null:validateRound(saved.round);
  const history=saved.history.map(validateRound);
  if(history.some(r=>!r.complete)||new Set(history.map(r=>r.id)).size!==history.length)throw Error('history');
  return {version:1,round,history};
 }
 function storageProblem(value,message){
  blocked=true;
  if(typeof value==='string')raw=value;
  warning=message||'Сохранение проверки недоступно или повреждено. Прежние данные оставлены без изменений. Текущую работу можно скачать перед закрытием страницы.';
 }
 function read(){
  if(blocked)return false;
  try{
   const value=storage.getItem(KEY)||'';
   if(value===raw)return true;
   if(!value){
    // Another tab cleared storage: retain the displayed work in memory and do
    // not resurrect an old round into the newly cleared persistent state.
    if(raw){storageProblem(value,'Сохранение проверки удалено в другом окне. Текущая работа осталась на этой странице; скачайте её перед закрытием.');return false;}
    return true;
   }
   data=decode(value);raw=value;return true;
  }catch(_){let value;try{value=storage.getItem(KEY);}catch(_){}storageProblem(value);return false;}
 }
 function write(){
  if(blocked)return false;
  try{
   // Re-read immediately before writing so an older tab cannot replace a new
   // round, submitted answer or draft that appeared since the last read.
   if((storage.getItem(KEY)||'')!==raw){read();return false;}
   const value=JSON.stringify(data);storage.setItem(KEY,value);raw=value;return true;
  }catch(_){
   // Keep accepted in-memory work after a failed write. A subsequent read from
   // another tab must not silently replace it with an older persistent draft.
   blocked=true;
   warning='Браузер не разрешил сохранить проверку. Текущая работа осталась на этой странице; скачайте отчёт перед закрытием страницы.';
   return false;
  }
 }
 function context(){const r=data.round;return r?[r.id,r.index,r.items[r.index]?.taskId||''].join(':'):'';}
 function prepare(expectedToken){const before=context();read();return (expectedToken===undefined?before:expectedToken)===context();}
 function makeRound(){
  return {id:'round-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12),index:0,complete:false,items:ORDER.map(empty),started:new Date().toISOString(),finished:''};
 }
 function reserve(){
  const round=data.round;
  if(!round||round.complete)return;
  const item=round.items[round.index];
  if(item.unavailable)return;
  if(item.taskId){
   // A checkpoint save may survive a failed write of the larger lesson save.
   // Restore the exposure marker without counting a reload as a second view.
   if(!learningState.data.seen[item.taskId]){
    try{learningState.persist();}catch(_){}
    if(!learningState.data.seen[item.taskId])learningState.data.seen[item.taskId]=1;
    try{learningState.persist();}catch(_){}
   }
   return;
  }
  // ProfileState.persist merges seen task IDs from other tabs before selection.
  // No ProfileState.finish call: these results never promote lesson mastery.
  try{learningState.persist();}catch(_){}
  const found=pools.get(item.number).find(({task})=>!learningState.data.seen[task.id]);
  if(found){
   item.lessonId=found.lesson.id;item.taskId=found.task.id;
   learningState.data.seen[found.task.id]=(learningState.data.seen[found.task.id]||0)+1;
   try{learningState.persist();}catch(_){}
  }else item.unavailable=true;
  write();
 }
 function view(){
  const round=data.round;
  if(!round)return {token:context(),number:ORDER[0],lesson:null,task:null,draft:'',submitted:false,correct:false,assisted:false,position:0,total:ORDER.length,complete:false,unavailable:false};
  if(round.complete)return {token:context(),number:null,lesson:null,task:null,draft:'',submitted:false,correct:false,assisted:false,position:ORDER.length,total:ORDER.length,complete:true,unavailable:false};
  const item=round.items[round.index],lesson=known.get(item.lessonId)||null;
  return {token:context(),number:item.number,lesson,task:lesson?.tasks.find(t=>t.id===item.taskId)||null,draft:item.draft,submitted:item.submitted,correct:item.correct,assisted:item.assisted,position:round.index,total:ORDER.length,complete:false,unavailable:item.unavailable};
 }
 function current(){read();if(!data.round){data.round=makeRound();write();}reserve();return view();}
 function startRound(fresh=false){
  read();
  if(!data.round||(fresh===true&&data.round.complete)){data.round=makeRound();write();}
  return current();
 }
 function submit(input,checkFn,expectedToken){
  if(!prepare(expectedToken))return current();
  const shown=current(),answer=String(input??'').slice(0,200);
  if(expectedToken!==undefined&&shown.token!==expectedToken)return shown;
  if(shown.complete||shown.unavailable||shown.submitted||!answer.trim()||typeof checkFn!=='function')return shown;
  // The UI validates the numeric parser before calling submit. A false result
  // is a real first attempt and is not replaceable by retries or help.
  let correct;
  try{correct=checkFn(shown.task.answer,answer);}catch(_){return shown;}
  if(!bool(correct))return shown;
  const item=data.round.items[data.round.index];
  item.draft=answer;item.correct=correct;item.submitted=true;write();return view();
 }
 function help(expectedToken){
  if(!prepare(expectedToken))return current();
  const shown=current();
  if(expectedToken!==undefined&&shown.token!==expectedToken)return shown;
  if(!shown.complete&&!shown.unavailable&&!shown.submitted){data.round.items[data.round.index].assisted=true;write();}
  return view();
 }
 function persistDraft(input,expectedToken){
  if(!prepare(expectedToken))return current();
  const shown=current();
  if(expectedToken!==undefined&&shown.token!==expectedToken)return shown;
  if(!shown.complete&&!shown.unavailable&&!shown.submitted){data.round.items[data.round.index].draft=String(input??'').slice(0,200);write();}
  return view();
 }
 function next(expectedToken){
  if(!prepare(expectedToken))return current();
  const shown=current();
  if(expectedToken!==undefined&&shown.token!==expectedToken)return shown;
  if(shown.complete||(!shown.submitted&&!shown.unavailable))return shown;
  const round=data.round;round.index++;
  if(round.index===ORDER.length){
   round.complete=true;round.finished=new Date().toISOString();
   data.history=data.history.filter(r=>r.id!==round.id).concat(clone(round)).slice(-20);
  }
  write();return current();
 }
 function summary(round){
  const items=round?.items||[];
  return {attempted:items.filter(i=>i.submitted).length,independent:items.filter(i=>i.submitted&&i.correct&&!i.assisted&&!i.unavailable).length,assisted:items.filter(i=>i.assisted).length,unavailable:items.filter(i=>i.unavailable).length,total:ORDER.length};
 }
 function snapshot(){read();return {...clone(data),summary:summary(data.round)};}
 read();
 return {KEY,startRound,current,submit,help,next,persistDraft,snapshot,get warning(){return warning||learningState.warning||'';},get original(){return blocked?raw:'';},export(){return {kind:'mathexam-profile-checkpoint',exportedAt:new Date().toISOString(),storage:'local-browser',...snapshot()};}};
}
const api={KEY,ORDER,create};root.ProfileCheckpoint=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
