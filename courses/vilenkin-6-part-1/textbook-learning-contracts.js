/* A separate, source-pinned cloud attempt for one revised textbook task.
 * Legacy 27-module attempts and standalone browser records are never decoded here. */
(function(root, factory) {
  'use strict';
  if(typeof module==='object'&&module.exports) {
    const units=[...['A','B','C','D'].flatMap(part=>require('./textbook-data/units-'+part+'.json')),...require('./textbook-data/supplement-lcm-multi.json')];
    module.exports=factory(units,require('./textbook-math'),require('../../learning/vilenkin6-textbook-catalog'));
  } else root.VilenkinTextbookLearning=Object.freeze({createFactory:factory});
})(typeof globalThis==='undefined'?this:globalThis,function(units,math,manifest) {
  'use strict';
  const TRAINER='vilenkin6-textbook',ANSWER_LIMIT=180,STATE_BYTES=60000;
  const tasks=new Map(),rows=new Map((manifest||[]).map(row=>[row.contentId,row]));
  for(const unit of units)for(const task of unit.tasks){
    const row=rows.get(task.id);
    if(tasks.has(task.id)||!row||row.id!==TRAINER+':'+task.id||row.unitId!==unit.id||row.trainerId!==TRAINER||row.role!==task.role||!Array.isArray(task.steps)||!task.steps.length)throw Error('Textbook cloud catalog mismatch');
    tasks.set(task.id,{unit,task,row});
  }
  if(rows.size!==tasks.size)throw Error('Textbook cloud catalog coverage mismatch');
  const fail=(message='Некорректная сохранённая работа.')=>{throw Error(message);};
  const object=value=>{if(!value||typeof value!=='object'||Array.isArray(value))fail();for(const key of Object.keys(value))if(['__proto__','constructor','prototype'].includes(key))fail();return value;};
  const keys=(value,allowed,required=allowed)=>{object(value);if(Object.keys(value).some(key=>!allowed.includes(key))||required.some(key=>!Object.hasOwn(value,key)))fail();return value;};
  const integer=(value,min,max)=>{if(!Number.isSafeInteger(value)||value<min||value>max)fail();return value;};
  const bool=value=>{if(typeof value!=='boolean')fail();return value;};
  const text=(value,max=ANSWER_LIMIT)=>{if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail();return value;};
  const routeOf=spec=>'#unit/'+spec.unitId+'/task/'+encodeURIComponent(spec.contentId);
  const stateKeys=['schema','version','contentId','seed','route','task'];
  const progressKeys=['mode','step','draft','stepDrafts','hintKeys','hiddenHints','revealedSteps','manualChecks','feedback','wrongCounts','ruleOpen','helped','solution','reviewedAfter','status','repeated','attempts'];
  const statuses=['','independent','assisted','learned','manual','repeated'];
  const keyValid=(key,max)=>key==='final'||/^(0|[1-9]\d*)$/.test(String(key))&&Number(key)<max;
  function canonical(contentId,seed){
    const entry=tasks.get(contentId);if(!entry)fail('Неизвестное задание учебника.');integer(seed,0,1000000000);
    return {schema:'mathexam-vilenkin6-textbook-task',trainerId:TRAINER,contentVersion:1,contentId,id:contentId,unitId:entry.unit.id,seed,sourceRevision:entry.row.sourceRevision};
  }
  function guard(spec){const expected=canonical(spec?.contentId,spec?.seed);keys(spec,Object.keys(expected));if(Object.keys(expected).some(key=>spec[key]!==expected[key]))fail('Задание изменилось. Прежняя работа сохранена; открой новую работу из курса.');return tasks.get(spec.contentId);}
  function fresh(spec){
    const {task}=guard(spec);
    return {schema:'mathexam-vilenkin6-textbook-state',version:1,contentId:spec.contentId,seed:spec.seed,route:routeOf(spec),task:{
      mode:task.role==='learn'?'guided':'independent',step:0,draft:'',stepDrafts:[],hintKeys:[],hiddenHints:[],revealedSteps:[],manualChecks:{},feedback:{},wrongCounts:{},ruleOpen:false,helped:false,solution:false,reviewedAfter:false,status:'',repeated:false,attempts:0}};
  }
  function create(contentId,seed=0){const taskSpec=canonical(contentId,seed);return {taskSpec,state:fresh(taskSpec)};}
  function assisted(task,p){return task.role==='learn'||p.mode==='guided'||p.helped||p.solution||p.hintKeys.length>0||p.revealedSteps.length>0;}
  function resultStatus(task,p,manual){return manual?'manual':task.role==='learn'?'learned':p.helped||p.mode==='guided'?'assisted':p.repeated?'repeated':'independent';}
  function normalize(spec,value,previous){
    const {task}=guard(spec),expected=fresh(spec),max=task.steps.length;
    keys(value,stateKeys);if(value.schema!==expected.schema||value.version!==1||value.contentId!==spec.contentId||value.seed!==spec.seed||value.route!==expected.route)fail('Работа относится к другому заданию.');
    const raw=keys(value.task,progressKeys);
    if(!['guided','independent'].includes(raw.mode)||task.role==='learn'&&raw.mode!=='guided'||!statuses.includes(raw.status))fail();
    const p={mode:raw.mode,step:integer(raw.step,0,max),draft:text(raw.draft),stepDrafts:[],hintKeys:[],hiddenHints:[],revealedSteps:[],manualChecks:{},feedback:{},wrongCounts:{},ruleOpen:bool(raw.ruleOpen),helped:bool(raw.helped),solution:bool(raw.solution),reviewedAfter:bool(raw.reviewedAfter),status:raw.status,repeated:bool(raw.repeated),attempts:integer(raw.attempts,0,10000)};
    if(!Array.isArray(raw.stepDrafts)||raw.stepDrafts.length>max)fail();
    p.stepDrafts=Array.from(raw.stepDrafts,value=>text(value));
    for(const name of ['hintKeys','hiddenHints','revealedSteps']){
      const list=raw[name];if(!Array.isArray(list)||list.length>max+1||new Set(list).size!==list.length)fail();
      p[name]=Array.from(list,key=>{if(name==='revealedSteps')return integer(key,0,max-1);if(key!=='final')integer(key,0,max-1);return key;});
    }
    if(p.hiddenHints.some(key=>!p.hintKeys.includes(key)))fail();
    for(const name of ['manualChecks','feedback','wrongCounts']){
      object(raw[name]);if(Object.keys(raw[name]).some(key=>!keyValid(key,max)))fail();
      for(const [key,value]of Object.entries(raw[name])){
        const item=key==='final'?task:task.steps[Number(key)];
        if(name==='manualChecks'){
          if(item.answerType!=='self-check'||!Array.isArray(value)||value.length>(item.selfCheck||[]).length)fail();
          p.manualChecks[key]=Array.from(value,bool);
        }else if(name==='feedback'){
          keys(value,['kind']);if(!['wrong','format','manual'].includes(value.kind))fail();p.feedback[key]={kind:value.kind};
        }else p.wrongCounts[key]=integer(value,0,10000);
      }
    }
    if((p.solution||p.ruleOpen||p.hintKeys.length||p.revealedSteps.length||task.role!=='learn'&&p.mode==='guided')&&!p.helped)fail('Подсказки сохраняют отметку помощи.');
    const verified=(item,key,answer)=>item.answerType==='self-check'
      ? (item.selfCheck||[]).length>0&&item.selfCheck.every((_,i)=>p.manualChecks[String(key)]?.[i]===true)
      : math.check(answer,item.answer,item.answerType||'number').ok;
    for(let index=0;index<p.step;index++)if(!(task.steps[index].answerType!=='self-check'&&p.revealedSteps.includes(index))&&!verified(task.steps[index],index,p.stepDrafts[index]||''))fail('Выполненный шаг не подтверждён ответом.');
    const manual=task.answerType==='self-check'||p.mode==='guided'&&task.steps[max-1].answerType==='self-check';
    const complete=p.mode==='guided'?p.step===max:(task.answerType==='self-check'||p.attempts>0)&&verified(task,'final',p.draft);
    if(p.mode==='independent'&&p.step!==0)fail();
    if(p.status&&(!complete||p.status!==resultStatus(task,p,manual)))fail('Результат не подтверждён сохранённой работой.');
    if(p.mode==='guided'&&p.step===max&&!p.status)fail('Последний шаг требует точной отметки результата.');
    if(p.reviewedAfter&&!p.status)fail('Проверка решения доступна после завершения.');
    if(previous!==undefined){
      const old=normalize(spec,previous).task;
      if(p.step<old.step||p.attempts<old.attempts||old.helped&&!p.helped||old.solution&&!p.solution||old.repeated&&!p.repeated||old.mode==='guided'&&p.mode!=='guided'||old.status&&p.status!==old.status)fail('Уже выполненная работа и помощь сохраняются.');
      for(const name of ['hintKeys','revealedSteps'])if(old[name].some(key=>!p[name].includes(key)))fail('Отметка помощи сохраняется.');
      for(const [key,count]of Object.entries(old.wrongCounts))if((p.wrongCounts[key]||0)<count)fail('История попыток сохраняется.');
      for(let index=0;index<old.step;index++)if((old.stepDrafts[index]||'')!==(p.stepDrafts[index]||'')||JSON.stringify(old.manualChecks[String(index)])!==JSON.stringify(p.manualChecks[String(index)]))fail('Выполненные шаги сохраняются.');
      if(old.status&&(old.draft!==p.draft||JSON.stringify(old.manualChecks.final)!==JSON.stringify(p.manualChecks.final)))fail('Завершённый ответ сохраняется.');
    }
    const state={...expected,task:p};if(new TextEncoder().encode(JSON.stringify(state)).length>STATE_BYTES)fail('Работа превышает предел сохранения.');return state;
  }
  function evaluate(spec,details,value){
    const {task}=guard(spec),state=normalize(spec,value),p=state.task;object(details);
    if(details.scope==='manual'){
      keys(details,['scope']);if(p.status!=='manual'&&!(p.mode==='guided'&&p.step>0&&task.steps[p.step-1].answerType==='self-check'))fail('Самопроверка ещё не завершена.');
      return {correct:false,complete:false,assisted:true,manual:true};
    }
    if(details.scope==='guided'){
      keys(details,['scope']);if(p.mode!=='guided'||p.step<1||!p.revealedSteps.includes(p.step-1))fail('Показанный шаг не подтверждён.');
      return {correct:p.status!=='manual',complete:!!p.status&&p.status!=='manual',assisted:true};
    }
    if(details.scope==='step'){
      keys(details,['scope','step','answer']);const step=integer(details.step,0,task.steps.length-1),item=task.steps[step],answer=text(details.answer);
      if(p.mode!=='guided'||item.answerType==='self-check'||p.stepDrafts[step]!==answer||p.attempts<1)fail('Проверяется другой шаг или ответ.');
      const correct=math.check(answer,item.answer,item.answerType||'number').ok;
      if(p.step!==(correct?step+1:step))fail('Шаг не совпадает с сохранённой работой.');
      return {correct,complete:correct&&!!p.status&&p.status!=='manual',assisted:true};
    }
    if(details.scope==='final'){
      keys(details,['scope','answer']);const answer=text(details.answer);
      if(p.mode!=='independent'||task.answerType==='self-check'||p.draft!==answer||p.attempts<1)fail('Проверяется другой ответ.');
      const correct=math.check(answer,task.answer,task.answerType||'number').ok;
      if(correct!==!!p.status)fail('Отметка результата не совпадает с ответом.');
      return {correct,complete:correct,assisted:assisted(task,p)};
    }
    fail('Неизвестная проверка.');
  }
  function assistance(spec,state){return assisted(guard(spec).task,state.task);}
  function describe(spec){const {task,row}=guard(spec);return {title:row.title,prompt:task.prompt,contentId:spec.contentId,position:null,steps:task.steps.length};}
  // Only canonical course material is projected. No question, draft or answer
  // supplied by the browser can become the helper's source of truth.
  function help(spec,value,request){
    const {task,row}=guard(spec),state=normalize(spec,value),p=state.task;
    keys(request,['mode','sourceRevision','step','workMode']);
    if(!['hint','step','solution'].includes(request.mode)||request.sourceRevision!==spec.sourceRevision||
      request.step!==p.step||request.workMode!==p.mode)fail('Шаг задания изменился.');
    const completed=!!p.status,index=Math.min(p.step,task.steps.length-1),item=p.mode==='guided'?task.steps[index]:task;
    if(completed&&request.mode!=='solution')fail('После ответа доступен разбор решения.');
    let lines;
    if(request.mode==='solution')lines=task.solution.slice();
    else if(request.mode==='step')lines=[task.steps[index].prompt,task.steps[index].explain].filter(Boolean);
    else lines=[item.hint||item.prompt];
    if(!lines.length||lines.length>16)fail();
    lines=lines.map(line=>text(line,2048));
    // Save assistance, but do not open native hint/solution disclosures during
    // ACK hydration. Only the helper panel reveals text after its final context
    // check. Completed review is recorded by the event; its result stays intact.
    if(!completed)p.helped=true;
    return {state:normalize(spec,state,value),help:{contentId:spec.contentId,sourceRevision:spec.sourceRevision,
      mode:request.mode,step:request.step,workMode:request.workMode,completed,
      title:text(row.title,500),prompt:text(task.prompt,2048),lines}};
  }
  function questionIdentity(spec){
    // Rewards and finite-bank exposure read immutable historical specifications.
    // A newer answer/step revision (or removal from today's catalogue) must not
    // make that history unreadable or turn the same source task into a new prize.
    // Editing/continuing work still uses guard() and requires the current revision.
    keys(spec,['schema','trainerId','contentVersion','contentId','id','unitId','seed','sourceRevision']);
    if(spec.schema!=='mathexam-vilenkin6-textbook-task'||spec.trainerId!==TRAINER||spec.contentVersion!==1||
      !/^[\p{L}\p{N}][\p{L}\p{N}._-]{0,159}$/u.test(text(spec.contentId,160))||spec.id!==spec.contentId||
      typeof spec.sourceRevision!=='string'||!/^[a-f0-9]{64}$/.test(spec.sourceRevision))fail('Некорректная история задания.');
    integer(spec.unitId,0,10000);integer(spec.seed,0,1000000000);
    return JSON.stringify({trainerId:TRAINER,contentId:spec.contentId});
  }
  return Object.freeze({TRAINER,ANSWER_LIMIT,STATE_BYTES,create,fresh,normalize,evaluate,assistance,describe,help,questionIdentity,routeOf});
});
