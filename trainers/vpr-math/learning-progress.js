(function(root){
'use strict';
const reviewDelay=5*24*60*60*1000;
const predictions=['lower','same','higher'];
const modes=['learn','solo'];
const empty=()=>({resume:{},exposed:{},verified:{},motion:null});
const positiveTime=value=>Number.isFinite(value)&&value>0&&value<=8640000000000000;
const entries=value=>Object.entries(value||{});

function sanitize(value,routes,tasks){
 const clean=empty();
 if(!value)return clean;
 for(const [route,cursor] of entries(value.resume)){
  if(routes.has(route)&&cursor&&tasks.get(cursor.task)?.lesson.routes.includes(route)&&modes.includes(cursor.mode)&&positiveTime(cursor.at)){
   clean.resume[route]={task:cursor.task,mode:cursor.mode,at:cursor.at};
  }
 }
 for(const field of ['exposed','verified']){
  for(const [id,at] of entries(value[field]))if(tasks.has(id)&&positiveTime(at))clean[field][id]=at;
 }
 const motion=value.motion;
 if(motion&&predictions.includes(motion.prediction)&&[1,2].includes(motion.stop)&&positiveTime(motion.at)){
  clean.motion={prediction:motion.prediction,stop:motion.stop,at:motion.at};
 }
 return merge(empty(),clean);
}

function merge(progress,incoming){
 for(const [route,cursor] of entries(incoming.resume)){
  if(!progress.resume[route]||cursor.at>progress.resume[route].at)progress.resume[route]=cursor;
 }
 for(const field of ['exposed','verified']){
  for(const [id,at] of entries(incoming[field]))progress[field][id]=Math.min(at,progress[field][id]||at);
 }
 for(const [id,at] of entries(progress.verified)){
  if(progress.exposed[id]&&progress.exposed[id]<=at)delete progress.verified[id];
 }
 if(incoming.motion&&(!progress.motion||incoming.motion.at>progress.motion.at))progress.motion=incoming.motion;
 return progress;
}

function expose(progress,id,at){
 progress.exposed[id]=Math.min(progress.exposed[id]||at,at);
}

function wasGuided(attempt){
 return !!attempt&&(attempt.plotPoints?.length>0||[attempt.solved,attempt.hints,attempt.shown,attempt.mistakes].some(values=>values.some(Boolean)));
}

function exposed(store,id){
 return !!(store.learning.exposed[id]||store.achievements['learn:'+id]||wasGuided(store.attempts['learn:'+id])||
  Object.values(store.diagnostics).some(session=>session.ids.includes(id)));
}

function verify(store,id,at){
 if(!store.achievements['solo:'+id]&&!exposed(store,id))store.learning.verified[id]=at;
}

function sameSkill(a,b){
 const skill=task=>task.skill||(/^g7-process-graphs-[56]$/.test(task.id)?'mean-speed':null);
 const aSkill=skill(a),bSkill=skill(b);
 if(aSkill||bSkill)return !!aSkill&&aSkill===bSkill;
 return a.level===b.level&&a.steps.length===b.steps.length&&a.steps.length>1&&
  a.steps.every((step,i)=>step.prompt===b.steps[i].prompt&&step.answer.kind===b.steps[i].answer.kind);
}

function isFresh(store,task){
 return !store.achievements['solo:'+task.id]&&!store.learning.verified[task.id]&&!exposed(store,task.id);
}

function freshTask(store,lesson,source,level){
 const choices=lesson.tasks.filter(task=>task!==source&&(!level||task.level===level)&&isFresh(store,task));
 return (source&&choices.find(task=>sameSkill(task,source)))||
  (source&&choices.find(task=>task.level===source.level))||choices[0];
}

function topic(store,lesson,now,extra){
 const tasks=extra?[extra,...lesson.tasks]:lesson.tasks;
 const verified=tasks.filter(task=>store.learning.verified[task.id])
  .sort((a,b)=>store.learning.verified[a.id]-store.learning.verified[b.id]);
 if(verified.length){
  const delayedPair=verified.some(first=>verified.some(second=>first!==second&&sameSkill(first,second)&&
   store.learning.verified[second.id]>=store.learning.verified[first.id]+reviewDelay));
  if(delayedPair)return {label:'Подтвердил после паузы'};
  for(const first of verified){
   const due=store.learning.verified[first.id]+reviewDelay;
   const next=now>=due&&tasks.find(task=>task!==first&&sameSkill(first,task)&&isFresh(store,task));
   if(next)return {label:'Пора повторить',next};
  }
  return {label:'Решил новую задачу сам'};
 }
 if(lesson.tasks.some(task=>store.achievements['learn:'+task.id]?.assisted))return {label:'Разобрал с помощью'};
 if(lesson.tasks.some(task=>store.achievements['learn:'+task.id]||store.achievements['solo:'+task.id]))return {label:'Есть пройденные задания'};
 return {label:''};
}

root.VPRLearningProgress={empty,sanitize,merge,expose,verify,wasGuided,freshTask,topic,predictions};
})(typeof window!=='undefined'?window:globalThis);
