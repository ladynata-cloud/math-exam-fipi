(async function(){
  'use strict';
  const $=id=>document.getElementById(id),M=window.TextbookMath;
  let embedded=false;try{embedded=parent!==window&&parent.location.origin===location.origin&&/\/trainers\/(trainer-board|group-board)\.html$/.test(parent.location.pathname);}catch(_){}
  if(embedded)document.body.classList.add('board-mode');
  try{
    const response=await fetch('../../courses/vilenkin-6-part-1/textbook-data/units-D.json',{cache:'no-cache'});if(!response.ok)throw Error('SOURCE_UNAVAILABLE');
    const bookUnits=(await response.json()).filter(item=>[18,19,20,21].includes(item.id));
    const workshop=window.RatioDivisionUnit,units=bookUnits.concat(workshop),C=window.VilenkinProportionCore(bookUnits,M,workshop);
    const unitByTask=new Map(units.flatMap(unit=>unit.tasks.map(task=>[task.id,unit])));
    const params=new URLSearchParams(location.search),selectedUnit=units.find(unit=>String(unit.id)===params.get('unit'));
    let state=C.initial(params.get('task')||selectedUnit?.tasks[0].id),notify=()=>{},applying=false;
    const title=task=>task.label||'№ '+task.source.number+(task.source.part?' ('+task.source.part+')':'');
    $('task').innerHTML=units.map(unit=>'<optgroup label="'+M.esc(unit.title)+'">'+unit.tasks.map(task=>'<option value="'+M.esc(task.id)+'">'+M.esc(title(task))+'</option>').join('')+'</optgroup>').join('');
    window.renderBoardTopicEntries($('board-topic-slot'),embedded,taskId=>act('task',taskId));
    let renderedUnit=null;
    function render(){
      const {task,work:p,index,item}=C.current(state),idx=C.tasks.indexOf(task),guided=p.mode==='guided';
      const unit=unitByTask.get(task.id),inWorkshop=unit===workshop,transfer=task.role==='transfer';
      if(renderedUnit!==unit.id){$('topic-heading').textContent=unit.title;$('rule-content').innerHTML=unit.rules.map(rule=>'<h3>'+M.esc(rule.title)+'</h3><p>'+M.fmt(rule.text)+'</p>').join('');renderedUnit=unit.id;}
      $('task').value=task.id;$('source').textContent=inWorkshop?'Практикум MathExam к §§ 18–19 · '+task.label:'К задаче '+title(task)+' · с. '+task.source.page+' · Виленкин, часть 1, 2024';$('condition').innerHTML=M.fmt(task.prompt);
      $('guided').parentElement.hidden=transfer||!!task.requireSteps;
      $('rules').hidden=transfer;
      window.renderRatioDivisionModel($('corridor-model'),inWorkshop&&guided?task.id:'',p.step,p.complete);
      $('guided').setAttribute('aria-pressed',String(guided));$('independent').setAttribute('aria-pressed',String(!guided));$('guided').disabled=p.complete;$('independent').disabled=p.complete;
      $('history').innerHTML=p.step?'<ol>'+task.steps.slice(0,p.step).map((step,i)=>'<li><span>Шаг '+(i+1)+': </span>'+M.fmt(step.answerType==='proportion'?'Твоя пропорция: '+p.answers[i]:step.explain||p.answers[i])+'</li>').join('')+'</ol>':'';
      $('answer-form').hidden=p.complete;$('question').innerHTML=(guided?'Шаг '+(p.step+1)+' из '+task.steps.length+'. ':'')+M.fmt(item.inputLabel||(guided?item.prompt:'Ответ на задачу'))+(item.unit?' ('+M.esc(item.unit)+')':'');
      const answer=guided?p.answers[index]:p.final;if($('answer').value!==answer)$('answer').value=answer;
      $('format').textContent=item.answerType==='proportion'?'Пиши отношения через : или /, а между отношениями поставь =. Латинская x и русская х подходят.':M.formats[item.answerType||'number'];
      $('feedback').dataset.kind=p.feedback;$('feedback').textContent=p.complete?(transfer?'Верно. 14 стаканов по 0,4 л вмещают 5,6 л.':'Задание выполнено вместе.'):p.feedback==='correct'?'Верно. Продолжим.':p.feedback==='format'?'Проверь запись ответа.':p.feedback==='wrong'?'Пока не получилось. Попробуй ещё раз.':'';
      $('hint').hidden=p.complete||transfer;$('hint').textContent=p.hints[index]?'Скрыть подсказку':'Подсказка';$('hint-text').hidden=transfer||p.complete||!p.hints[index];$('hint-text').innerHTML=M.fmt(item.hint||'Вспомни правило этой темы и проверь предыдущий шаг.');
      if(inWorkshop && ['wrong','format'].includes(p.feedback) && !p.complete){
        const draft=guided?p.answers[index]:p.final;
        if(task.id==='ratio-division-tenths'&&M.check(draft,'24').ok&&(!guided||index===6))$('feedback').textContent='24 больше верхней границы 3. Проверь, где в частном стоит запятая.';
        else if(task.id==='ratio-division-shift'&&M.check(draft,'2,4').ok&&(!guided||index===4))$('feedback').textContent='2,4 меньше нижней границы 20. Перенеси запятую на одинаковое число знаков в обоих числах.';
        else if(guided&&p.feedback==='wrong')$('feedback').textContent=item.hint;
      }
      $('back-step').hidden=!inWorkshop||!guided||p.step===0;
      $('previous').disabled=idx===0;$('next').disabled=idx===C.tasks.length-1;$('repeat').hidden=!p.complete;
      if($('notes').value!==p.notes)$('notes').value=p.notes;
      if($('rules').open!==state.rulesOpen)$('rules').open=state.rulesOpen;
      $('open-board').href='../trainer-board.html?trainer='+encodeURIComponent('/trainers/vilenkin6-proportion/index.html?task='+encodeURIComponent(task.id));
    }
    function act(action,value){if(applying)return;state=C.change(state,action,value);render();notify();}
    $('task').onchange=()=>act('task',$('task').value);$('answer').oninput=()=>act('input',$('answer').value);$('notes').oninput=()=>act('notes',$('notes').value);
    $('answer-form').onsubmit=event=>{event.preventDefault();act('check');if(!C.current(state).work.complete)$('answer').focus();};
    $('back-step').onclick=()=>act('back');
    $('guided').onclick=()=>act('mode','guided');$('independent').onclick=()=>act('mode','independent');$('hint').onclick=()=>act('hint');$('repeat').onclick=()=>act('repeat');
    $('previous').onclick=()=>act('task',C.tasks[C.tasks.findIndex(t=>t.id===state.taskId)-1].id);$('next').onclick=()=>act('task',C.tasks[C.tasks.findIndex(t=>t.id===state.taskId)+1].id);
    $('rules').ontoggle=()=>{if($('rules').open!==state.rulesOpen)act('rules',$('rules').open);};
    const getState=()=>C.normalize(state);
    const applyState=value=>{const next=C.normalize(value);if(JSON.stringify(next)===JSON.stringify(state))return;applying=true;try{state=next;render();}finally{applying=false;}};
    window.getBoardTrainerState=getState;window.applyBoardTrainerState=applyState;
    render();$('loading').hidden=true;$('workspace').hidden=false;
    window.MathExamBoard.register({id:'vilenkin6-proportion',version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,getState,applyState,subscribe(callback){notify=callback;return()=>{notify=()=>{};};}});
  }catch(error){$('loading').textContent='Не удалось открыть задачи. Обновите страницу и попробуйте ещё раз.';console.error('Proportion course failed:',error.message);}
})();
