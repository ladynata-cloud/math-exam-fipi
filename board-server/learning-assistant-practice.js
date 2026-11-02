'use strict';
// Private formative practice. Never persist pupil free text or trust client grading.
const express=require('express');
const crypto=require('node:crypto');
const {requireValue,exactKeys,tokenHash}=require('./learning-auth');
let corePromise;
async function loadCore(){try{return await (corePromise??=import('../assistant-service/public/practice-core.js'));}catch{fail(false,'LEARNING_ASSISTANT_PRACTICE_UNAVAILABLE',503);}}
const clone=x=>JSON.parse(JSON.stringify(x)),uuid=()=>crypto.randomUUID();
const DAY=86400000,RETENTION=30*DAY;
const fail=(ok,code='LEARNING_ASSISTANT_PRACTICE_INVALID',status=400)=>requireValue(ok,code,status);
const DESCRIPTOR_KEYS=['version','skill','level','seed'];
function prunePractice(store,now=store.clock()){for(const [table,column]of [['assistant_practice_progress','updated_at'],['assistant_practice_homework','created_at'],['assistant_practice_disputes','created_at']])store.run(`DELETE FROM ${table} WHERE ${column}<?`,now-RETENTION);}
function createPracticeRouter(learning,access){
 const {store,handler,authMiddleware,mutationMiddleware}=learning,router=express.Router(),memory=new Map(),previews=new Map();
 if(store.available)store.db.exec(`CREATE TABLE IF NOT EXISTS assistant_practice_progress(learner_id TEXT PRIMARY KEY REFERENCES accounts(id),version TEXT NOT NULL,state_json TEXT NOT NULL,updated_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS assistant_practice_homework(id TEXT PRIMARY KEY,teacher_id TEXT NOT NULL REFERENCES accounts(id),learner_id TEXT NOT NULL REFERENCES accounts(id),payload TEXT NOT NULL,created_at INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS assistant_practice_notes(teacher_id TEXT NOT NULL REFERENCES accounts(id),skill TEXT NOT NULL,version INTEGER NOT NULL,draft TEXT NOT NULL,approved TEXT,approved_version INTEGER,updated_at INTEGER NOT NULL,PRIMARY KEY(teacher_id,skill));
 CREATE TABLE IF NOT EXISTS assistant_practice_disputes(id TEXT PRIMARY KEY,teacher_id TEXT NOT NULL REFERENCES accounts(id),descriptor TEXT NOT NULL,reason TEXT NOT NULL,status TEXT NOT NULL,version INTEGER NOT NULL,created_at INTEGER NOT NULL);`);
 const fresh=()=>({version:uuid(),current:null,events:[],levels:{}});
 function cleanup(){const now=store.clock();for(const [k,v]of memory)if(v.at<now-DAY)memory.delete(k);for(const [k,v]of previews)if(v.at<now-1800000)previews.delete(k);
  prunePractice(store,now);
 }
 function gate(req,id,student=false){if(student)fail(req.learningAuth.role==='student','LEARNING_FORBIDDEN',403);const auth=access.recheck(req,id);fail(access.enabled&&access.settings(id)?.enabled,'LEARNING_ASSISTANT_DISABLED',403);fail(!access.examActive(id),'LEARNING_ASSISTANT_EXAM_ACTIVE',409);return auth;}
 const student=req=>gate(req,req.learningAuth.id,true);
 function eraseProgress(id){store.run('DELETE FROM assistant_practice_progress WHERE learner_id=?',id);for(const [k,v]of memory)if(v.learner===id)memory.delete(k);}
 // Erasure is available even when teaching is disabled, an exam is active, or the optional math module is unavailable.
 router.post('/assistant/practice/retention',authMiddleware,mutationMiddleware,handler((req,res)=>{exactKeys(req.query,[]);exactKeys(req.body,['action'],['action']);fail(req.body.action==='erase');fail(req.learningAuth.role==='student','LEARNING_FORBIDDEN',403);access.recheck(req,req.learningAuth.id);eraseProgress(req.learningAuth.id);res.json({ok:true,resumeEnabled:false});}));
 function cache(req){const k=tokenHash('practice:'+req.learningSessionToken);let v=memory.get(k);if(!v){fail(memory.size<300,'LEARNING_ASSISTANT_PRACTICE_CAPACITY',503);v={learner:req.learningAuth.id,at:store.clock(),session:uuid(),state:fresh()};memory.set(k,v);}v.at=store.clock();return v;}
 function read(req){const m=cache(req),row=store.row('SELECT * FROM assistant_practice_progress WHERE learner_id=?',req.learningAuth.id);return {state:row?JSON.parse(row.state_json):clone(m.state),persist:!!row,session:m.session};}
 function save(req,record){record.state.version=uuid();record.state.events=record.state.events.slice(-100);if(record.persist){store.run('INSERT INTO assistant_practice_progress VALUES(?,?,?,?) ON CONFLICT(learner_id) DO UPDATE SET version=excluded.version,state_json=excluded.state_json,updated_at=excluded.updated_at',req.learningAuth.id,record.state.version,JSON.stringify(record.state),store.clock());for(const m of memory.values())if(m.learner===req.learningAuth.id)m.state=fresh();}else cache(req).state=clone(record.state);}
 function homework(req,id){const row=store.row('SELECT * FROM assistant_practice_homework WHERE id=? AND learner_id=? AND revoked=0',id,req.learningAuth.id);fail(row&&row.created_at>=store.clock()-RETENTION,'LEARNING_NOT_FOUND',404);return {...row,...JSON.parse(row.payload)};}
 function policyFor(req,current){return current.homeworkId?homework(req,current.homeworkId).policy:{fullSolution:true,allowedMethods:null};}
 function methods(task,policy){return task.methods.filter(m=>!policy.allowedMethods||policy.allowedMethods.includes(m.id));}
 function taskView(req,current,core){if(!current)return null;const task=core.generatePractice(current.descriptor),policy=policyFor(req,current);return {id:current.id,descriptor:current.descriptor,question:task.question,format:task.kind==='roots'?'Все корни через ;':'Точное число или дробь',helped:current.helped,solved:current.solved,tries:current.tries,homeworkId:current.homeworkId||null,methods:methods(task,policy).map(({id,title})=>({id,title})),fullSolution:policy.fullSolution};}
 function view(req,record,core){const {state}=record;let task=null;try{task=taskView(req,state.current,core);}catch(error){if(error.code!=='LEARNING_NOT_FOUND')throw error;}
  const assignments=store.rows('SELECT id,payload FROM assistant_practice_homework WHERE learner_id=? AND revoked=0 AND created_at>=? ORDER BY created_at DESC LIMIT 20',req.learningAuth.id,store.clock()-RETENTION).map(r=>({id:r.id,...JSON.parse(r.payload)})).map(x=>({id:x.id,count:x.descriptors.length,skill:x.descriptors[0].skill,policy:x.policy}));
  return {ok:true,version:state.version,resumeEnabled:record.persist,task,summary:core.summarizePractice(state.events),sessionSummary:core.summarizePractice(state.events.filter(e=>e.session===record.session)),levels:state.levels,assignments,skills:core.SKILLS,engine:core.PRACTICE_VERSION};
 }
 function descriptor(value,core){exactKeys(value,DESCRIPTOR_KEYS,['skill','level','seed']);let task;try{task=core.generatePractice(value);}catch{fail(false);}return Object.fromEntries(DESCRIPTOR_KEYS.map(k=>[k,task[k]]));}
 function policy(value,tasks){exactKeys(value,['fullSolution','allowedMethods'],['fullSolution','allowedMethods']);fail(typeof value.fullSolution==='boolean'&&Array.isArray(value.allowedMethods)&&value.allowedMethods.length>=1&&value.allowedMethods.length<=12&&new Set(value.allowedMethods).size===value.allowedMethods.length&&value.allowedMethods.every(x=>typeof x==='string'));
  fail(tasks.every(t=>value.allowedMethods.every(id=>t.methods.some(m=>m.id===id))),'LEARNING_ASSISTANT_METHOD_UNAVAILABLE');return clone(value);
 }
 function recordOutcome(record,core,result){const c=record.state.current,old=record.state.events.find(e=>e.id===c.id);const event={id:c.id,skill:c.descriptor.skill,status:result.status,helped:c.helped||c.tries>0,errorType:result.errorType||old?.errorType||null,session:record.session};
  record.state.events=record.state.events.filter(e=>e.id!==c.id);record.state.events.push(event);
  if(!old)record.state.levels[event.skill]=core.adaptLevel(record.state.levels[event.skill]||{level:c.descriptor.level},event);
 }
 router.get('/assistant/practice',authMiddleware,handler(async(req,res)=>{exactKeys(req.query,[]);const core=await loadCore();student(req);cleanup();res.json(view(req,read(req),core));}));
 router.post('/assistant/practice',authMiddleware,mutationMiddleware,handler(async(req,res)=>{
  exactKeys(req.query,[]);const core=await loadCore();student(req);cleanup();const b=req.body;exactKeys(b,['action','version','enabled','skill','level','taskId','answer','method','homeworkId','index','reason'],['action','version']);
  const allowed={resume:['enabled'],erase:[],new:['skill','level'],homework:['homeworkId','index'],answer:['taskId','answer'],help:['taskId','method'],solution:['taskId','method'],report:['taskId','reason']};
  fail(Object.hasOwn(allowed,b.action));exactKeys(b,['action','version',...allowed[b.action]],['action','version',...allowed[b.action]]);
  const record=read(req);fail(b.version===record.state.version,'LEARNING_ASSISTANT_VERSION_CONFLICT',409);let result=null,explanation=null;
  if(b.action==='resume'){fail(typeof b.enabled==='boolean');record.persist=b.enabled;if(!b.enabled){eraseProgress(req.learningAuth.id);record.state=fresh();}}
  else if(b.action==='erase'){eraseProgress(req.learningAuth.id);record.persist=false;record.state=fresh();}
  else if(b.action==='new'||b.action==='homework'){
   let d,homeworkId=null;if(b.action==='homework'){fail(typeof b.homeworkId==='string'&&Number.isInteger(b.index));const h=homework(req,b.homeworkId);fail(b.index>=0&&b.index<h.descriptors.length);d=h.descriptors[b.index];homeworkId=h.id;}
   else {d=descriptor({skill:b.skill,level:b.level,seed:crypto.randomInt(2147483648)},core);if(record.state.levels[d.skill]?.level!==d.level)record.state.levels[d.skill]={level:d.level,streak:0,errors:0};}
   const id=homeworkId?homeworkId+':'+b.index:uuid(),previous=record.state.events.find(e=>e.id===id);
   record.state.current={id,descriptor:d,homeworkId,helped:!!previous,tries:previous?1:0,solved:previous?.status==='correct'};
  }else{
   const c=record.state.current;fail(c&&b.taskId===c.id,'LEARNING_ASSISTANT_TASK_CHANGED',409);const task=core.generatePractice(c.descriptor),p=policyFor(req,c);
   if(b.action==='answer'){
    fail(!c.solved,'LEARNING_ASSISTANT_ALREADY_SOLVED',409);fail(typeof b.answer==='string'&&b.answer.length<=400);result=core.gradePractice(c.descriptor,b.answer);
    if(result.status!=='unsupported'){recordOutcome(record,core,result);c.tries++;c.solved=result.status==='correct';}
   }else if(b.action==='help'||b.action==='solution'){
    const method=methods(task,p).find(m=>m.id===b.method);fail(method,'LEARNING_ASSISTANT_METHOD_FORBIDDEN',403);if(b.action==='solution')fail(p.fullSolution,'LEARNING_ASSISTANT_SOLUTION_FORBIDDEN',403);
    c.helped=true;const e=record.state.events.find(e=>e.id===c.id);if(e)e.helped=true;
    // A hint gives a strategy without calculated lines or teacher notes.
    explanation={title:method.title,steps:b.action==='solution'?method.steps:[`Выбран способ «${method.title}». Определи, какое правило позволяет выполнить первый шаг.`]};
    if(b.action==='solution'){const teacher=store.account(req.learningAuth.id).teacher_id,note=store.row('SELECT approved,approved_version FROM assistant_practice_notes WHERE teacher_id=? AND skill=?',teacher,c.descriptor.skill);if(note?.approved)explanation.teacherNote={text:note.approved,version:note.approved_version};}
   }else if(b.action==='report'){
    fail(['grading','explanation','condition'].includes(b.reason));const teacher=store.account(req.learningAuth.id).teacher_id,json=JSON.stringify(c.descriptor);
    const found=store.row('SELECT id FROM assistant_practice_disputes WHERE teacher_id=? AND descriptor=? AND reason=?',teacher,json,b.reason);
    if(!found){fail(store.row('SELECT count(*) AS n FROM assistant_practice_disputes WHERE teacher_id=?',teacher).n<1000,'LEARNING_ASSISTANT_PRACTICE_CAPACITY',429);store.run('INSERT INTO assistant_practice_disputes VALUES(?,?,?,?,?,1,?)',uuid(),teacher,json,b.reason,'open',store.clock());}
    result={status:'reported',text:'Сохранены версия генератора, параметры задачи и категория. Твой ответ и личные данные в сообщение не включены.'};
   }
  }
  save(req,record);res.json({...view(req,record,core),result,explanation});
 }));
 const teacherBase='/teacher/students/:id/assistant/practice';
 function teacher(req){fail(req.learningAuth.role==='teacher','LEARNING_FORBIDDEN',403);return gate(req,req.params.id);}
 router.get(teacherBase,authMiddleware,handler(async(req,res)=>{exactKeys(req.query,[]);const core=await loadCore();teacher(req);cleanup();const row=store.row('SELECT state_json FROM assistant_practice_progress WHERE learner_id=?',req.params.id),state=row?JSON.parse(row.state_json):null,counts={};for(const e of state?.events||[])if(e.errorType&&e.errorType!=='unclassified')counts[e.skill+':'+e.errorType]=(counts[e.skill+':'+e.errorType]||0)+1;
  const notes=store.rows('SELECT skill,version,draft,approved,approved_version FROM assistant_practice_notes WHERE teacher_id=?',req.learningAuth.id);
  const disputes=store.rows('SELECT id,descriptor,reason,status,version FROM assistant_practice_disputes WHERE teacher_id=? ORDER BY created_at DESC LIMIT 100',req.learningAuth.id).map(r=>({...r,descriptor:JSON.parse(r.descriptor)}));
  const assignments=store.rows('SELECT id,payload,revoked FROM assistant_practice_homework WHERE teacher_id=? AND learner_id=? ORDER BY revoked ASC,created_at DESC LIMIT 40',req.learningAuth.id,req.params.id).map(r=>({id:r.id,revoked:!!r.revoked,...JSON.parse(r.payload)}));
  res.json({ok:true,retained:!!row,summary:core.summarizePractice(state?.events||[]),repeatedErrors:Object.entries(counts).filter(([,n])=>n>=2).map(([key,count])=>({key,count})),skills:core.SKILLS,notes,disputes,assignments});
 }));
 router.post(teacherBase+'/preview',authMiddleware,mutationMiddleware,handler(async(req,res)=>{exactKeys(req.query,[]);const core=await loadCore();teacher(req);cleanup();const b=req.body;exactKeys(b,['skill','level','count','policy'],['skill','level','count','policy']);fail(Number.isInteger(b.count)&&b.count>=3&&b.count<=5);const descriptors=[];const seen=new Set();for(let tries=0;descriptors.length<b.count&&tries<200;tries++){const d=descriptor({skill:b.skill,level:b.level,seed:crypto.randomInt(2147483648)},core),q=core.generatePractice(d).question;if(!seen.has(q)){seen.add(q);descriptors.push(d);}}fail(descriptors.length===b.count,'LEARNING_ASSISTANT_VARIANTS_UNAVAILABLE',409);const tasks=descriptors.map(core.generatePractice),p=policy(b.policy,tasks);fail(previews.size<100,'LEARNING_ASSISTANT_PRACTICE_CAPACITY',429);const id=uuid();previews.set(id,{at:store.clock(),teacher:req.learningAuth.id,learner:req.params.id,descriptors,policy:p});res.json({ok:true,previewId:id,tasks,policy:p});}));
 router.post(teacherBase+'/assign',authMiddleware,mutationMiddleware,handler(async(req,res)=>{exactKeys(req.query,[]);await loadCore();teacher(req);cleanup();exactKeys(req.body,['previewId'],['previewId']);const p=previews.get(req.body.previewId);fail(p&&p.teacher===req.learningAuth.id&&p.learner===req.params.id,'LEARNING_ASSISTANT_PREVIEW_EXPIRED',409);
  if(p.assigned){res.json({ok:true,id:p.assigned,duplicate:true});return;}fail(store.row('SELECT count(*) AS n FROM assistant_practice_homework WHERE learner_id=? AND revoked=0',req.params.id).n<20,'LEARNING_ASSISTANT_PRACTICE_CAPACITY',429);fail(store.row('SELECT count(*) AS n FROM assistant_practice_homework WHERE teacher_id=?',req.learningAuth.id).n<1000,'LEARNING_ASSISTANT_PRACTICE_CAPACITY',429);const id=uuid();store.run('INSERT INTO assistant_practice_homework VALUES(?,?,?,?,?,0)',id,p.teacher,p.learner,JSON.stringify({descriptors:p.descriptors,policy:p.policy}),store.clock());p.assigned=id;res.json({ok:true,id});
 }));
 router.post(teacherBase+'/revoke',authMiddleware,mutationMiddleware,handler(async(req,res)=>{exactKeys(req.query,[]);await loadCore();teacher(req);exactKeys(req.body,['id'],['id']);fail(typeof req.body.id==='string');const row=store.row('SELECT id FROM assistant_practice_homework WHERE id=? AND teacher_id=? AND learner_id=?',req.body.id,req.learningAuth.id,req.params.id);fail(row,'LEARNING_NOT_FOUND',404);store.run('UPDATE assistant_practice_homework SET revoked=1 WHERE id=?',row.id);res.json({ok:true});}));
 // Sandbox is pure: no cleanup, progress, budget, attempt, homework or queue writes.
 router.post(teacherBase+'/sandbox',authMiddleware,mutationMiddleware,handler(async(req,res)=>{exactKeys(req.query,[]);const core=await loadCore();teacher(req);const b=req.body;exactKeys(b,['descriptor','answer'],['descriptor']);const d=descriptor(b.descriptor,core);fail(b.answer===undefined||typeof b.answer==='string'&&b.answer.length<=400);res.json({ok:true,task:core.generatePractice(d),result:b.answer===undefined?null:core.gradePractice(d,b.answer),sandbox:true});}));
 router.post(teacherBase+'/note',authMiddleware,mutationMiddleware,handler(async(req,res)=>{exactKeys(req.query,[]);const core=await loadCore();teacher(req);const b=req.body;exactKeys(b,['skill','version','action','text'],['skill','version','action']);fail(Object.hasOwn(core.SKILLS,b.skill)&&Number.isSafeInteger(b.version)&&b.version>=0&&['draft','approve'].includes(b.action));const old=store.row('SELECT * FROM assistant_practice_notes WHERE teacher_id=? AND skill=?',req.learningAuth.id,b.skill);fail((old?.version||0)===b.version,'LEARNING_ASSISTANT_VERSION_CONFLICT',409);
  if(b.action==='draft'){fail(typeof b.text==='string'&&b.text.trim().length>0&&b.text.length<=2000&&!/[\u0000-\u0008\u000b-\u001f\u007f]/u.test(b.text));store.run('INSERT INTO assistant_practice_notes VALUES(?,?,?,?,NULL,NULL,?) ON CONFLICT(teacher_id,skill) DO UPDATE SET version=excluded.version,draft=excluded.draft,updated_at=excluded.updated_at',req.learningAuth.id,b.skill,b.version+1,b.text.trim(),store.clock());}
  else{exactKeys(b,['skill','version','action'],['skill','version','action']);fail(old,'LEARNING_NOT_FOUND',404);store.run('UPDATE assistant_practice_notes SET approved=draft,approved_version=version,version=version+1,updated_at=? WHERE teacher_id=? AND skill=?',store.clock(),req.learningAuth.id,b.skill);}
  res.json({ok:true,note:store.row('SELECT skill,version,draft,approved,approved_version FROM assistant_practice_notes WHERE teacher_id=? AND skill=?',req.learningAuth.id,b.skill)});
 }));
 router.post(teacherBase+'/dispute',authMiddleware,mutationMiddleware,handler(async(req,res)=>{exactKeys(req.query,[]);await loadCore();teacher(req);const b=req.body;exactKeys(b,['id','version','status'],['id','version','status']);fail(typeof b.id==='string'&&Number.isInteger(b.version)&&['open','reviewed'].includes(b.status));const row=store.row('SELECT version FROM assistant_practice_disputes WHERE id=? AND teacher_id=?',b.id,req.learningAuth.id);fail(row,'LEARNING_NOT_FOUND',404);fail(row.version===b.version,'LEARNING_ASSISTANT_VERSION_CONFLICT',409);store.run('UPDATE assistant_practice_disputes SET status=?,version=version+1 WHERE id=?',b.status,b.id);res.json({ok:true});}));
 return router;
}
module.exports={createPracticeRouter,prunePractice};
