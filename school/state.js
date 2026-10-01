(function(root){
 'use strict';
 var DAY=86400000, KEY='mathexam.workshop.v1', TEACHER='mathexam.workshop.teacher.v1';
 function blank(){return {schema:'mathexam-workshop',version:1,route:'5',last:null,seen:[],events:[],skills:{},assignment:null};}
 function safeObject(x){return x&&typeof x==='object'&&!Array.isArray(x);}
 function validId(x){return typeof x==='string'&&/^[a-z][a-z0-9-]{0,60}$/.test(x);}
 function validate(data,ids){
  if(!safeObject(data)||data.schema!=='mathexam-workshop'||data.version!==1)throw Error('Это не файл прогресса мастерской версии 1.');
  var s=blank(),known=new Set(ids);
  if(!['5','6','all'].includes(data.route))throw Error('Неизвестный маршрут.');
  s.route=data.route;
  if(data.last!==null&&(!safeObject(data.last)||!known.has(data.last.skill)||!['learn','practice','check','review','diagnostic'].includes(data.last.mode)||!Number.isInteger(data.last.seed)||data.last.seed<0||data.last.seed>1000000))throw Error('Повреждена запись последнего занятия.');
  s.last=data.last?{skill:data.last.skill,mode:data.last.mode,seed:data.last.seed}:null;
  if(!Array.isArray(data.seen)||data.seen.length>3000||data.seen.some(function(x){return typeof x!=='string'||x.length>700;}))throw Error('Повреждена история заданий.');
  s.seen=data.seen.slice();
  if(!Array.isArray(data.events)||data.events.length>3000)throw Error('Повреждён журнал.');
  s.events=data.events.map(function(e){if(!safeObject(e)||!known.has(e.skill)||!['learn','practice','check','review','diagnostic'].includes(e.mode)||typeof e.correct!=='boolean'||typeof e.assisted!=='boolean'||typeof e.independent!=='boolean'||!Number.isInteger(e.attempt)||e.attempt<1||e.attempt>100||!Number.isFinite(e.time)||e.time<0||typeof e.fingerprint!=='string'||e.fingerprint.length>700)throw Error('Некорректная запись результата.');return {skill:e.skill,mode:e.mode,correct:e.correct,assisted:e.assisted,independent:e.independent,attempt:e.attempt,time:e.time,fingerprint:e.fingerprint};});
  if(!safeObject(data.skills)||Object.keys(data.skills).length>ids.length)throw Error('Повреждена карта навыков.');
  Object.keys(data.skills).forEach(function(id){var x=data.skills[id];if(!known.has(id)||!safeObject(x)||!Number.isInteger(x.learned)||x.learned<0||x.learned>100000||!Array.isArray(x.checks)||x.checks.length>3000||x.checks.some(function(v){return typeof v!=='string'||v.length>700;})||!Number.isInteger(x.reviews)||x.reviews<0||x.reviews>100000||![x.nextReview,x.lastSuccess].every(function(v){return Number.isFinite(v)&&v>=0;}))throw Error('Некорректные данные навыка.');s.skills[id]={learned:x.learned,checks:Array.from(new Set(x.checks)),reviews:x.reviews,nextReview:x.nextReview,lastSuccess:x.lastSuccess};});
  if(data.assignment!==null)s.assignment=validateAssignment(data.assignment,ids);
  return s;
 }
 function validateAssignment(a,ids){if(!safeObject(a)||a.schema!=='mathexam-assignment'||a.version!==1||!validId(a.id)||typeof a.title!=='string'||a.title.length>100||!Array.isArray(a.skills)||a.skills.length<1||a.skills.length>30||a.skills.some(function(id){return !ids.includes(id);})||!Number.isInteger(a.seed)||a.seed<1||a.seed>1000000)throw Error('Неверный код задания.');return {schema:a.schema,version:1,id:a.id,title:a.title,skills:Array.from(new Set(a.skills)),seed:a.seed};}
 function load(storage,ids){try{var raw=storage.getItem(KEY);return {state:raw?validate(JSON.parse(raw),ids):blank(),warning:''};}catch(e){return {state:blank(),warning:'Не удалось прочитать прежний прогресс. Он не перезаписан. Скачайте данные для восстановления или явно начните новую запись.',blocked:true};}}
 function save(storage,s){storage.setItem(KEY,JSON.stringify(s));}
 function evidence(s,id){return s.skills[id]||(s.skills[id]={learned:0,checks:[],reviews:0,nextReview:0,lastSuccess:0});}
 function fingerprint(id,t){return id+'|'+t.prompt;}
 function expose(s,f){var old=s.seen.includes(f);if(!old){s.seen.push(f);if(s.seen.length>3000)s.seen.shift();}return old;}
 function selectTask(s,id,seed,generate){
  var task,known=new Set(s.seen);
  for(var i=0;i<512;i++){task=generate(id,seed);if(!known.has(fingerprint(id,task)))break;if(i<511)seed=(seed+1)%1000001;}
  return {task:task,seed:seed};
 }
 function result(s,e){
  var independent=['check','review','diagnostic'].includes(e.mode)&&e.correct&&!e.assisted&&!e.exposed&&e.attempt===1,skill=evidence(s,e.skill);
  var entry={skill:e.skill,mode:e.mode,correct:!!e.correct,assisted:!!e.assisted,independent:independent,attempt:Math.min(100,e.attempt),time:e.time,fingerprint:e.fingerprint};
  s.events.push(entry);if(s.events.length>3000)s.events.shift();
  if(e.correct&&e.mode==='learn')skill.learned++;
  if(independent&&!skill.checks.includes(e.fingerprint)){
   var delayed=skill.lastSuccess>0&&e.time-skill.lastSuccess>=DAY;
   skill.checks.push(e.fingerprint);
   if(delayed&&e.mode==='review')skill.reviews++;
   skill.lastSuccess=e.time;
   skill.nextReview=e.time+DAY*[1,3,7,14][Math.min(3,skill.reviews)];
  }
  return entry;
 }
 function status(s,id,now){var p=s.skills[id];if(!p)return 'Не начинали';if(p.reviews>0)return 'Подтверждено повторением';if(p.checks.length>=2)return 'Самостоятельно';if(p.checks.length)return 'Первый успех';if(p.learned)return 'Разобрано';return 'Тренируемся';}
 function due(s,ids,now){return ids.filter(function(id){var p=s.skills[id];return p&&p.nextReview>0&&p.nextReview<=now;});}
 function teacherBlank(){return {schema:'mathexam-teacher',version:1,groups:[],assignments:[],reports:[]};}
 function validateReport(r,ids){if(!safeObject(r)||r.schema!=='mathexam-report'||r.version!==1||typeof r.alias!=='string'||r.alias.length>60||typeof r.assignmentId!=='string'||r.assignmentId.length>65||!Number.isFinite(r.createdAt)||!safeObject(r.progress))throw Error('Неверный файл отчёта.');return {schema:r.schema,version:1,alias:r.alias,assignmentId:r.assignmentId,createdAt:r.createdAt,progress:validate(r.progress,ids)};}
 function validateTeacher(t,ids){if(!safeObject(t)||t.schema!=='mathexam-teacher'||t.version!==1||!Array.isArray(t.groups)||t.groups.length>100||!Array.isArray(t.assignments)||t.assignments.length>300||!Array.isArray(t.reports)||t.reports.length>300)throw Error('Неверная копия кабинета.');
  var out=teacherBlank();out.groups=t.groups.map(function(g){if(!safeObject(g)||!validId(g.id)||typeof g.name!=='string'||g.name.length>80)throw Error('Неверная группа.');return {id:g.id,name:g.name};});
  out.assignments=t.assignments.map(function(a){if(!safeObject(a)||!out.groups.some(function(g){return g.id===a.groupId;}))throw Error('Неизвестная группа задания.');return {groupId:a.groupId,data:validateAssignment(a.data,ids)};});
  out.reports=t.reports.map(function(r){if(!safeObject(r)||!out.groups.some(function(g){return g.id===r.groupId;}))throw Error('Неизвестная группа отчёта.');return {groupId:r.groupId,data:validateReport(r.data,ids)};});return out;
 }
 var api={KEY:KEY,TEACHER:TEACHER,DAY:DAY,blank:blank,validate:validate,load:load,save:save,evidence:evidence,fingerprint:fingerprint,expose:expose,selectTask:selectTask,result:result,status:status,due:due,teacherBlank:teacherBlank,validateTeacher:validateTeacher,validateAssignment:validateAssignment,validateReport:validateReport};
 root.WorkshopState=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
