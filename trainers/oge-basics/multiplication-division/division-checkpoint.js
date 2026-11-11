(function(root,factory){
  'use strict';
  const D=typeof module==='object'&&module.exports?require('./division-lab-core.js'):root.DivisionLab;
  const api=factory(D);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.DivisionCheckpoint=api;if(root.document)api.mount(root);}
})(typeof globalThis==='undefined'?this:globalThis,function(D){
  'use strict';
  const KEY='mathExamBasics.divisionCheckpoint.v1';
  const topics=Object.freeze([
    ['start','Простое деление'],['oneDigit','Деление на одну цифру'],['zero','Ноль в частном'],
    ['remainder','Деление с остатком'],['twoDigit','Двузначный делитель'],
    ['decimalNatural','Запятая в ответе'],['appendZeros','Дописывание нулей'],['decimalDivisor','Десятичный делитель']
  ].map(([id,title])=>Object.freeze({id,title})));
  const integer=(n,max=1000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
  const stamp=t=>t.dividend+':'+t.divisor;
  function topicTask(id,seed){
    if(id==='start'){
      const d=seed%2?2:3,limit=Math.floor(9/d),a=1+Math.floor(seed/2)%limit,b=1+Math.floor(seed/(limit*2))%limit;
      return {level:'oneDigit',dividend:String(d*(10*a+b)),divisor:String(d)};
    }
    return D.make(id,seed);
  }
  function matches(id,task){
    const p=D.plan(task),dividend=D.number(task.dividend),divisor=D.number(task.divisor);
    if(task.level!==(id==='start'?'oneDigit':id))return false;
    if(id==='start')return !dividend.places&&!divisor.places&&task.dividend.length===2&&p.cycles.length===2&&p.cycles.every(c=>c.remainder===0&&c.qd>0);
    if(id==='oneDigit')return !dividend.places&&!divisor.places&&divisor.units>=2&&divisor.units<=9&&p.cycles.length>=2&&p.cycles.slice(0,-1).some(c=>c.remainder>0)&&!p.quotient.includes('0');
    if(id==='zero')return !dividend.places&&!divisor.places&&/^\d+0\d+/.test(p.quotient);
    if(id==='remainder')return !dividend.places&&!divisor.places&&p.remainder>0&&p.remainder<divisor.units;
    if(id==='twoDigit')return !dividend.places&&!divisor.places&&divisor.units>=10&&divisor.units<=99&&p.cycles.length>=2;
    if(id==='decimalNatural')return dividend.places>0&&!divisor.places&&D.number(p.quotient).places>0;
    if(id==='appendZeros')return !dividend.places&&!divisor.places&&p.actions.some(a=>a.kind==='bring'&&a.appended);
    return divisor.places>0&&p.normalizationEnd>0;
  }
  function makeTasks(serial=1,previous=[]){
    if(!integer(serial)||serial===0)throw Error('Неверный номер проверки.');
    const avoid=new Set(previous.map(stamp)),tasks=[];
    topics.forEach((topic,index)=>{
      for(let offset=0;offset<5000;offset++){
        const seed=((Math.imul(serial,997)+index*7919+offset*37)>>>0)||1,task=topicTask(topic.id,seed);
        if(matches(topic.id,task)&&!avoid.has(stamp(task))){tasks.push(task);avoid.add(stamp(task));return;}
      }
      throw Error('Не удалось подобрать новый пример.');
    });
    return tasks;
  }
  function blank(serial=1,previous=[]){return {schema:'mathexam-division-checkpoint',version:1,serial,tasks:makeTasks(serial,previous),index:0,answers:[],assisted:Array(8).fill(false),draft:{answer:'',remainder:''}};}
  function numeric(value,whole=false){
    return typeof value==='string'&&value.length<=30&& (whole?/^\d+$/:/^\d+(?:[.,]\d+)?$/).test(value.trim());
  }
  function evaluate(task,answer,remainder=''){
    const p=D.plan(task);
    return D.equal(answer,p.quotient)&&(task.level!=='remainder'||(numeric(remainder,true)&&D.equal(remainder,String(p.remainder))));
  }
  function validate(value){
    if(!value||value.schema!=='mathexam-division-checkpoint'||value.version!==1||!integer(value.serial)||value.serial===0||!Array.isArray(value.tasks)||value.tasks.length!==8||!integer(value.index,8)||!Array.isArray(value.answers)||!Array.isArray(value.assisted)||value.assisted.length!==8||!value.assisted.every(x=>typeof x==='boolean')||!value.draft||!['answer','remainder'].every(k=>typeof value.draft[k]==='string'&&value.draft[k].length<=30))throw Error('Повреждена проверка.');
    if(value.answers.length!==value.index&&value.answers.length!==value.index+1)throw Error('Неверное число ответов.');
    if(value.answers.length>8||value.index===8&&value.answers.length!==8)throw Error('Неверный итог.');
    const tasks=value.tasks.map((task,i)=>{if(!matches(topics[i].id,task))throw Error('Неверное задание.');return D.plan(task).task;});
    if(new Set(tasks.map(stamp)).size!==8)throw Error('Повтор задания.');
    const answers=value.answers.map((record,i)=>{
      if(!record||!numeric(record.answer,tasks[i].level==='remainder')||typeof record.remainder!=='string'||record.remainder.length>30||typeof record.assisted!=='boolean'||record.assisted!==value.assisted[i]||(tasks[i].level==='remainder'&&!numeric(record.remainder,true))||(tasks[i].level!=='remainder'&&record.remainder!==''))throw Error('Неверная запись ответа.');
      return {answer:record.answer,remainder:record.remainder,assisted:record.assisted};
    });
    return {schema:value.schema,version:1,serial:value.serial,tasks,index:value.index,answers,assisted:[...value.assisted],draft:{answer:value.draft.answer,remainder:value.draft.remainder}};
  }
  function summary(raw){
    const s=validate(raw),rows=s.answers.map((answer,index)=>({topic:topics[index].id,title:topics[index].title,correct:evaluate(s.tasks[index],answer.answer,answer.remainder),assisted:answer.assisted}));
    return {finished:s.index===8,answered:rows.length,independent:rows.filter(r=>r.correct&&!r.assisted).length,supported:rows.filter(r=>r.correct&&r.assisted).length,incorrect:rows.filter(r=>!r.correct).length,rows};
  }
  function submit(raw,answer,remainder=''){
    const s=validate(raw);
    if(s.index===8||s.answers.length>s.index)return {state:s,changed:false,message:'Этот ответ уже проверен.'};
    const task=s.tasks[s.index],whole=task.level==='remainder';
    if(!String(answer).trim()||(whole&&!String(remainder).trim()))return {state:s,changed:false,message:whole?'Заполни частное и остаток.':'Сначала введи ответ.'};
    if(!numeric(answer,whole)||(whole&&!numeric(remainder,true)))return {state:s,changed:false,message:whole?'Введи целое частное и целый остаток отдельными числами.':'Введи число. Дробную часть можно отделить запятой или точкой.'};
    s.answers.push({answer:answer.trim(),remainder:whole?remainder.trim():'',assisted:s.assisted[s.index]});s.draft={answer:'',remainder:''};
    return {state:s,changed:true};
  }
  function advance(raw){const s=validate(raw);if(s.index<8&&s.answers.length===s.index+1)s.index++;return s;}
  function help(raw){const s=validate(raw);if(s.index<8&&s.answers.length===s.index)s.assisted[s.index]=true;return s;}
  function mount(w){
    const doc=w.document,$=id=>doc.getElementById(id);if(!$('checkpoint-form'))return;
    let state=blank(),lastRaw=null,blocked=false,warning='';
    function showNotice(text){warning=text;$('checkpoint-storage').textContent=text;$('checkpoint-storage').hidden=!text;}
    try{lastRaw=w.localStorage.getItem(KEY);if(lastRaw)state=validate(JSON.parse(lastRaw));}
    catch(_){blocked=true;showNotice('Сохранённую работу не удалось прочитать. Она оставлена без изменений. Сейчас можно потренироваться, но эта проверка не сохранится.');}
    function save(){
      if(blocked)return false;
      try{
        if(w.localStorage.getItem(KEY)!==lastRaw){blocked=true;showNotice('Проверка изменилась в другой вкладке. Обнови страницу, чтобы продолжить с сохранённого места.');return false;}
        lastRaw=JSON.stringify(state);w.localStorage.setItem(KEY,lastRaw);return true;
      }catch(_){blocked=true;showNotice('Браузер не смог сохранить проверку. Пока не закрывай эту вкладку.');return false;}
    }
    function practiceURL(topic,withReturn=false){return '/trainers/long-division-stepwise.html'+(withReturn?'?skillReturn='+encodeURIComponent(w.location.pathname+w.location.search):'')+'#'+topic;}
    function el(tag,text,className){const element=doc.createElement(tag);if(text!==undefined)element.textContent=text;if(className)element.className=className;return element;}
    function resultText(answer,correct){return correct?(answer.assisted?'Верно, с помощью':'Верно, самостоятельно'):'Пока не получилось';}
    function render(focus=false){
      const finished=state.index===8,review=!finished&&state.answers.length===state.index+1;
      $('checkpoint-exercise').hidden=finished;$('checkpoint-results').hidden=!finished;
      if(finished){
        const result=summary(state);
        $('checkpoint-summary').textContent='Самостоятельно верно: '+result.independent+' из 8.'+(result.supported?' С помощью верно: '+result.supported+'.':'');
        const list=$('checkpoint-result-list');list.replaceChildren();
        result.rows.forEach((row,i)=>{
          const item=el('li'),answer=state.answers[i],task=state.tasks[i],p=D.plan(task);
          item.append(el('h3',(i+1)+'. '+row.title));
          const badge=el('p',resultText(answer,row.correct),'checkpoint-result-badge');badge.dataset.kind=row.correct&&!row.assisted?'good':row.correct?'neutral':'bad';item.append(badge);
          item.append(el('p',task.dividend+' : '+task.divisor+' = '+p.quotient+(task.level==='remainder'?' (остаток '+p.remainder+')':'')));
          if(!row.correct)item.append(el('p','Твой ответ: '+answer.answer+(task.level==='remainder'?', остаток '+answer.remainder:'')));
          const link=el('a',row.correct&&!row.assisted?'Ещё практика →':'Повторить этот шаг →');link.href=practiceURL(row.topic);item.append(link);list.append(item);
        });
        if(focus)$('checkpoint-results-title').focus();return;
      }
      const task=state.tasks[state.index],p=D.plan(task),remainder=task.level==='remainder';
      $('checkpoint-count').textContent='Пример '+(state.index+1)+' из 8';$('checkpoint-status').textContent=state.assisted[state.index]?'С помощью':'';
      $('checkpoint-progress').value=state.answers.length;
      $('checkpoint-problem').textContent=task.dividend+' : '+task.divisor;
      $('checkpoint-instruction').textContent=remainder?'Выполни деление с остатком. Запиши целое частное и остаток.':'Выполни деление до конца. Если нужно, продолжи после запятой.';
      $('checkpoint-answer-label').textContent=remainder?'Целое частное':'Ответ';$('checkpoint-remainder-label').hidden=!remainder;
      $('checkpoint-answer').inputMode=remainder?'numeric':'decimal';
      $('checkpoint-answer').value=state.draft.answer;$('checkpoint-remainder').value=state.draft.remainder;
      $('checkpoint-form').hidden=review;$('checkpoint-review').hidden=!review;$('checkpoint-help-line').hidden=review;
      $('checkpoint-help').href=practiceURL(topics[state.index].id,true);
      if(review){
        const answer=state.answers[state.index],correct=evaluate(task,answer.answer,answer.remainder);
        $('checkpoint-feedback').textContent=resultText(answer,correct)+'.';$('checkpoint-feedback').dataset.kind=correct?'good':'bad';
        $('checkpoint-correct-answer').textContent='Ответ: '+p.quotient+(remainder?', остаток '+p.remainder:'')+'.';
        $('checkpoint-verification').textContent='Проверка: '+task.divisor+' × '+p.quotient+(remainder?' + '+p.remainder:'')+' = '+task.dividend+'.';
        const steps=$('checkpoint-steps');steps.replaceChildren();
        if(p.normalizationEnd)steps.append(el('li','Умножаем оба числа на '+10**D.number(task.divisor).places+': '+p.normalizedDividend+' : '+p.normalizedDivisor+'.'));
        p.cycles.forEach(c=>steps.append(el('li','Для '+c.partial+' берём цифру '+c.qd+': '+p.normalizedDivisor+' × '+c.qd+' = '+c.product+'. Вычитаем: '+c.partial+' − '+c.product+' = '+c.remainder+'.')));
        $('checkpoint-next').textContent=state.index===7?'Посмотреть результат →':'Следующий пример →';if(focus)$('checkpoint-next').focus();
      }else{
        $('checkpoint-feedback').textContent='';$('checkpoint-feedback').dataset.kind='neutral';$('checkpoint-review').querySelector('details').open=false;
        if(focus)$('checkpoint-answer').focus();
      }
    }
    $('checkpoint-form').addEventListener('submit',event=>{
      event.preventDefault();const result=submit(state,$('checkpoint-answer').value,$('checkpoint-remainder').value);
      if(!result.changed){$('checkpoint-feedback').textContent=result.message;$('checkpoint-feedback').dataset.kind='neutral';return;}
      state=result.state;save();render(true);
    });
    for(const id of ['checkpoint-answer','checkpoint-remainder'])$(id).addEventListener('input',()=>{if(state.answers.length!==state.index)return;state.draft={answer:$('checkpoint-answer').value,remainder:$('checkpoint-remainder').value};save();});
    $('checkpoint-next').addEventListener('click',()=>{state=advance(state);save();render(true);});
    $('checkpoint-new').addEventListener('click',()=>{if(state.index!==8)return;try{state=blank(state.serial>=1000000?1:state.serial+1,state.tasks);save();render(true);}catch(_){showNotice('Не удалось подготовить новые примеры. Результат остался на экране.');}});
    $('checkpoint-help').addEventListener('click',event=>{state=help(state);const saved=save();render();if(!saved){event.currentTarget.target='_blank';event.currentTarget.rel='noopener';event.currentTarget.href=practiceURL(topics[state.index].id);}});
    doc.addEventListener('mathexam:skill-support',event=>{if(state.index<8&&state.answers.length===state.index){state=help(state);if(!save())event.preventDefault();render();}});
    w.addEventListener('storage',event=>{if(event.key===null||event.key===KEY)showNotice('Проверка изменилась в другой вкладке. Обнови страницу перед продолжением.');});
    w.addEventListener('pageshow',()=>render());
    w.__divisionCheckpointDebug={state:()=>JSON.parse(JSON.stringify(state)),summary:()=>summary(state)};
    if(!lastRaw&&!blocked)save();render();
  }
  return {KEY,topics,makeTasks,matches,blank,numeric,evaluate,validate,summary,submit,advance,help,mount};
});
