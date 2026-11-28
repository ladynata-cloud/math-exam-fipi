(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory;else root.VilenkinProportionCore=factory;})(typeof globalThis==='undefined'?this:globalThis,function(units,math,supplement){
  'use strict';
  if(!Array.isArray(units)||units.length!==4||units.some((unit,i)=>unit.id!==18+i||unit.tasks?.length!==8))throw Error('PROPORTION_SOURCE_MISMATCH');
  const bookTasks=units.flatMap(unit=>unit.tasks);
  const tasks=bookTasks.concat(supplement?.tasks||[]),byId=new Map(tasks.map(task=>[task.id,task]));
  if(bookTasks.length!==32||byId.size!==tasks.length||tasks.some(task=>!Array.isArray(task.steps)||!task.steps.length||task.answerType==='self-check'||task.steps.some(step=>step.answerType==='self-check')))throw Error('PROPORTION_SOURCE_MISMATCH');
  const clone=value=>JSON.parse(JSON.stringify(value));
  const fail=()=>{throw Error('INVALID_PROPORTION_STATE');};
  const object=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!keys.includes(key))||keys.some(key=>!Object.hasOwn(value,key)))fail();};
  const text=(value,max)=>{if(typeof value!=='string'||value.length>max||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail();};
  const clean=(value,max)=>String(value).replace(/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,max);
  const fresh=task=>({mode:task.role==='learn'?'guided':'independent',step:0,answers:task.steps.map(()=>''),final:'',wrong:Array(task.steps.length+1).fill(0),hints:Array(task.steps.length+1).fill(false),complete:false,feedback:'',notes:''});
  // Keep untouched textbook rooms byte-compatible. Add a workshop card on its first visit.
  function initial(id) {
    const task=byId.get(id)||bookTasks[0];
    const works=Object.fromEntries(bookTasks.map(t=>[t.id,fresh(t)]));
    if(!Object.hasOwn(works,task.id))works[task.id]=fresh(task);
    return {schema:1,taskId:task.id,works,rulesOpen:false};
  }
  // Parse a single equality of two ratios. The unknown must stay paired
  // with a supplied quantity; the numeric ratio on the other side may be reduced.
  function proportionAnswer(value, expected) {
    const atom = '(x|[0-9]+(?:[.,][0-9]+)?)';
    const expression = new RegExp('^' + atom + '[:/]' + atom + '=' + atom + '[:/]' + atom + '$');
    const parse = input => expression.exec(String(input).replace(/\s/g,'').toLowerCase().replace(/х/g,'x').replace(/[÷∶]/g,':'))?.slice(1);
    const terms = parse(value);
    if (!terms || terms.filter(t=>t==='x').length!==1) return {format:false,ok:false};
    const reference = parse(expected);
    const position = terms.indexOf('x');
    const mate = math.parse(terms[position ^ 1]);
    const same = (a,b) => a.n*b.d === b.n*a.d;
    const positive = (n) => n && n.n>0n;
    const numbers = terms.map(t => t==='x' ? null : math.parse(t));
    if (!numbers.every((n,i)=>i===position || positive(n))) return {format:false,ok:false};
    // Reference data are stored in the order cost : count = x : new count.
    const [cost,count,,newCount] = reference.map(t => math.parse(t));
    if (!same(mate,cost) && !same(mate,newCount)) return {format:true,ok:false};
    numbers[position] = {n:cost.n*newCount.n*count.d,d:cost.d*newCount.d*count.n};
    const [a,b,c,d] = numbers;
    const ok = a.n*d.n*b.d*c.d === c.n*b.n*a.d*d.d;
    return {format:true,ok};
  }
  const checkAnswer = (raw,item) => item.answerType==='proportion'
    ? proportionAnswer(raw,item.answer)
    : math.check(raw,item.answer,item.answerType||'number');
  function normalize(value){
    object(value,['schema','taskId','works','rulesOpen']);if(value.schema!==1||!byId.has(value.taskId)||typeof value.rulesOpen!=='boolean')fail();const activeExtra=(supplement?.tasks||[]).filter(t=>Object.hasOwn(value.works||{},t.id));
    const active=bookTasks.concat(activeExtra);
    object(value.works,active.map(t=>t.id));
    if(!Object.hasOwn(value.works,value.taskId))fail();
    for(const task of active){
      const p=value.works[task.id],n=task.steps.length;object(p,['mode','step','answers','final','wrong','hints','complete','feedback','notes']);
      if(!['guided','independent'].includes(p.mode)||!Number.isInteger(p.step)||p.step<0||p.step>n||typeof p.complete!=='boolean'||!['','wrong','format','correct'].includes(p.feedback))fail();
      if(!Array.isArray(p.answers)||p.answers.length!==n||!Array.isArray(p.wrong)||p.wrong.length!==n+1||!Array.isArray(p.hints)||p.hints.length!==n+1)fail();
      p.answers.forEach(answer=>text(answer,90));text(p.final,90);text(p.notes,120);
      if(p.wrong.some(count=>!Number.isInteger(count)||count<0||count>10000)||p.hints.some(hint=>typeof hint!=='boolean'))fail();
      for(let index=0;index<p.step;index++)if(!checkAnswer(p.answers[index],task.steps[index]).ok)fail();
      if(task.role==='transfer'&&p.mode!=='independent'||task.requireSteps&&p.mode!=='guided')fail();
      if(p.mode==='guided'&&p.complete!==(p.step===n))fail();
      if(p.mode==='independent'&&p.complete&&!checkAnswer(p.final,task).ok)fail();
    }
    return clone(value);
  }
  function current(state){const task=byId.get(state.taskId),work=state.works[state.taskId],index=work.mode==='guided'?Math.min(work.step,task.steps.length-1):task.steps.length;return{task,work,index,item:work.mode==='guided'?task.steps[index]:task};}
  function change(state,action,value){
    const next=normalize(state),{task,work:p,index,item}=current(next);
    if(action==='task'){if(!byId.has(value))fail();next.taskId=value;if(!Object.hasOwn(next.works,value))next.works[value]=fresh(byId.get(value));}
    else if(action==='input'&&!p.complete){if(p.mode==='guided')p.answers[index]=clean(value,90);else p.final=clean(value,90);p.feedback='';}
    else if(action==='notes')p.notes=clean(value,120);
    else if(action==='rules')next.rulesOpen=value===true;
    else if(action==='mode'&&!p.complete){if(!['guided','independent'].includes(value)||task.role==='transfer'&&value!=='independent'||task.requireSteps&&value!=='guided')fail();p.mode=value;p.feedback='';if(value==='guided'&&p.step===task.steps.length)p.complete=true;}
    else if(action==='check'&&!p.complete){
      const answer=p.mode==='guided'?p.answers[index]:p.final,result=checkAnswer(answer,item);
      p.feedback=result.ok?'correct':!result.format?'format':'wrong';
      if(result.ok){if(p.mode==='guided')p.step++;p.complete=p.mode==='independent'||p.step===task.steps.length;}
      else p.wrong[index]=Math.min(10000,p.wrong[index]+1);
    }
    else if(action==='back' && task.label && p.mode==='guided' && p.step>0){
      p.complete=false;p.step--;p.feedback='';
      p.answers.fill('',p.step+1);p.hints.fill(false,p.step+1);
    }
    else if(action==='hint'&&!p.complete&&task.role!=='transfer')p.hints[index]=!p.hints[index];
    else if(action==='repeat')next.works[task.id]=fresh(task);
    else fail();
    return normalize(next);
  }
  return Object.freeze({tasks,initial,normalize,current,change,clone});
});
