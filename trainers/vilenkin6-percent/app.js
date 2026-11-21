(async function(){
  'use strict';
  const $=id=>document.getElementById(id),M=window.TextbookMath;
  let embedded=false;try{embedded=parent!==window&&parent.location.origin===location.origin&&/\/trainers\/(trainer-board|group-board)\.html$/.test(parent.location.pathname);}catch(_){}
  if(embedded)document.body.classList.add('board-mode');
  try{
    const response=await fetch('../../courses/vilenkin-6-part-1/textbook-data/units-A.json',{cache:'no-cache'});if(!response.ok)throw Error('SOURCE_UNAVAILABLE');
    const unit=(await response.json()).find(item=>item.id===2),C=window.VilenkinPercentCore(unit,M);
    let state=C.initial(new URLSearchParams(location.search).get('task')),notify=()=>{},applying=false;
    const title=task=>'№ '+task.source.number+(task.source.part?' ('+task.source.part+')':'');
    $('task').innerHTML=C.tasks.map(task=>'<option value="'+M.esc(task.id)+'">'+M.esc(title(task))+'</option>').join('');
    $('rule-content').innerHTML=unit.rules.map(rule=>'<h3>'+M.esc(rule.title)+'</h3><p>'+M.fmt(rule.text)+'</p>').join('');
    function render(){
      const {task,work:p,index,item}=C.current(state),idx=C.tasks.indexOf(task),guided=p.mode==='guided';
      $('task').value=task.id;$('source').textContent='К задаче '+title(task)+' · с. '+task.source.page+' · Виленкин, часть 1, 2024';$('condition').innerHTML=M.fmt(task.prompt);
      $('guided').setAttribute('aria-pressed',String(guided));$('independent').setAttribute('aria-pressed',String(!guided));$('guided').disabled=p.complete;$('independent').disabled=p.complete;
      $('history').innerHTML=p.step?'<ol>'+task.steps.slice(0,p.step).map((step,i)=>'<li><span>Шаг '+(i+1)+': </span>'+M.fmt(step.explain||p.answers[i])+'</li>').join('')+'</ol>':'';
      $('answer-form').hidden=p.complete;$('question').innerHTML=(guided?'Шаг '+(p.step+1)+' из '+task.steps.length+'. ':'')+M.fmt(item.inputLabel||item.prompt)+(item.unit?' ('+M.esc(item.unit)+')':'');
      const answer=guided?p.answers[index]:p.final;if($('answer').value!==answer)$('answer').value=answer;
      $('format').textContent=M.formats[item.answerType||'number'];
      $('feedback').dataset.kind=p.feedback;$('feedback').textContent=p.complete?'Задание выполнено вместе.':p.feedback==='correct'?'Верно. Продолжим.':p.feedback==='format'?'Проверь запись ответа.':p.feedback==='wrong'?'Пока не получилось. Попробуй ещё раз.':'';
      $('hint').hidden=p.complete||p.wrong[index]<2;$('hint').textContent=p.hints[index]?'Скрыть подсказку':'Подсказка';$('hint-text').hidden=p.complete||!p.hints[index];$('hint-text').innerHTML=M.fmt(item.hint||'Вспомни, какое количество принято за 100 %.');
      $('previous').disabled=idx===0;$('next').disabled=idx===C.tasks.length-1;$('repeat').hidden=!p.complete;
      if($('notes').value!==p.notes)$('notes').value=p.notes;
      if($('rules').open!==state.rulesOpen)$('rules').open=state.rulesOpen;
      $('open-board').href='../trainer-board.html?trainer='+encodeURIComponent('/trainers/vilenkin6-percent/index.html?task='+encodeURIComponent(task.id));
    }
    function act(action,value){if(applying)return;state=C.change(state,action,value);render();notify();}
    $('task').onchange=()=>act('task',$('task').value);$('answer').oninput=()=>act('input',$('answer').value);$('notes').oninput=()=>act('notes',$('notes').value);
    $('answer-form').onsubmit=event=>{event.preventDefault();act('check');if(!C.current(state).work.complete)$('answer').focus();};
    $('guided').onclick=()=>act('mode','guided');$('independent').onclick=()=>act('mode','independent');$('hint').onclick=()=>act('hint');$('repeat').onclick=()=>act('repeat');
    $('previous').onclick=()=>act('task',C.tasks[C.tasks.findIndex(t=>t.id===state.taskId)-1].id);$('next').onclick=()=>act('task',C.tasks[C.tasks.findIndex(t=>t.id===state.taskId)+1].id);
    $('rules').ontoggle=()=>{if($('rules').open!==state.rulesOpen)act('rules',$('rules').open);};
    const getState=()=>C.normalize(state);
    const applyState=value=>{const next=C.normalize(value);if(JSON.stringify(next)===JSON.stringify(state))return;applying=true;try{state=next;render();}finally{applying=false;}};
    window.getBoardTrainerState=getState;window.applyBoardTrainerState=applyState;
    render();$('loading').hidden=true;$('workspace').hidden=false;
    window.MathExamBoard.register({id:'vilenkin6-percent',version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,getState,applyState,subscribe(callback){notify=callback;return()=>{notify=()=>{};};}});
  }catch(error){$('loading').textContent='Не удалось открыть задачи. Обновите страницу и попробуйте ещё раз.';console.error('Percent course failed:',error.message);}
})();
