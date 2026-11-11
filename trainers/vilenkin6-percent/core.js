(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory;else root.VilenkinPercentCore=factory;})(typeof globalThis==='undefined'?this:globalThis,function(unit,math){
  'use strict';
  if(unit?.id!==2||unit.tasks?.length!==8)throw Error('PERCENT_SOURCE_MISMATCH');
  const tasks=unit.tasks,byId=new Map(tasks.map(task=>[task.id,task]));
  const clone=value=>JSON.parse(JSON.stringify(value));
  const fail=()=>{throw Error('INVALID_PERCENT_STATE');};
  const object=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!keys.includes(key))||keys.some(key=>!Object.hasOwn(value,key)))fail();};
  const text=(value,max)=>{if(typeof value!=='string'||value.length>max||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail();};
  const clean=(value,max)=>String(value).replace(/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,max);
  const fresh=task=>({mode:task.role==='learn'?'guided':'independent',step:0,answers:task.steps.map(()=>''),final:'',wrong:Array(task.steps.length+1).fill(0),hints:Array(task.steps.length+1).fill(false),complete:false,feedback:'',notes:''});
  const initial=id=>({schema:1,taskId:byId.has(id)?id:tasks[0].id,works:Object.fromEntries(tasks.map(task=>[task.id,fresh(task)])),rulesOpen:false});
  function normalize(value){
    object(value,['schema','taskId','works','rulesOpen']);if(value.schema!==1||!byId.has(value.taskId)||typeof value.rulesOpen!=='boolean')fail();object(value.works,tasks.map(t=>t.id));
    for(const task of tasks){
      const p=value.works[task.id],n=task.steps.length;object(p,['mode','step','answers','final','wrong','hints','complete','feedback','notes']);
      if(!['guided','independent'].includes(p.mode)||!Number.isInteger(p.step)||p.step<0||p.step>n||typeof p.complete!=='boolean'||!['','wrong','format','correct'].includes(p.feedback))fail();
      if(!Array.isArray(p.answers)||p.answers.length!==n||!Array.isArray(p.wrong)||p.wrong.length!==n+1||!Array.isArray(p.hints)||p.hints.length!==n+1)fail();
      p.answers.forEach(answer=>text(answer,180));text(p.final,180);text(p.notes,1200);
      if(p.wrong.some(count=>!Number.isInteger(count)||count<0||count>10000)||p.hints.some(hint=>typeof hint!=='boolean'))fail();
      for(let index=0;index<p.step;index++)if(!math.check(p.answers[index],task.steps[index].answer,task.steps[index].answerType||'number').ok)fail();
      if(p.mode==='guided'&&p.complete!==(p.step===n))fail();
      if(p.mode==='independent'&&p.complete&&!math.check(p.final,task.answer,task.answerType||'number').ok)fail();
    }
    return clone(value);
  }
  function current(state){const task=byId.get(state.taskId),work=state.works[state.taskId],index=work.mode==='guided'?Math.min(work.step,task.steps.length-1):task.steps.length;return{task,work,index,item:work.mode==='guided'?task.steps[index]:task};}
  function change(state,action,value){
    const next=normalize(state),{task,work:p,index,item}=current(next);
    if(action==='task'){if(!byId.has(value))fail();next.taskId=value;}
    else if(action==='input'&&!p.complete){if(p.mode==='guided')p.answers[index]=clean(value,180);else p.final=clean(value,180);p.feedback='';}
    else if(action==='notes')p.notes=clean(value,1200);
    else if(action==='rules')next.rulesOpen=value===true;
    else if(action==='mode'&&!p.complete){if(!['guided','independent'].includes(value))fail();p.mode=value;p.feedback='';if(value==='guided'&&p.step===task.steps.length)p.complete=true;}
    else if(action==='check'&&!p.complete){
      const answer=p.mode==='guided'?p.answers[index]:p.final,result=math.check(answer,item.answer,item.answerType||'number');
      p.feedback=result.ok?'correct':!result.format?'format':'wrong';
      if(result.ok){if(p.mode==='guided')p.step++;p.complete=p.mode==='independent'||p.step===task.steps.length;}
      else p.wrong[index]=Math.min(10000,p.wrong[index]+1);
    }
    else if(action==='hint'&&!p.complete&&p.wrong[index]>=2)p.hints[index]=!p.hints[index];
    else if(action==='repeat')next.works[task.id]=fresh(task);
    else fail();
    return normalize(next);
  }
  return Object.freeze({tasks,initial,normalize,current,change,clone});
});
