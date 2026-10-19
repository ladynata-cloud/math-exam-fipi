/* Extra practice only. Authored Soviet examples and their saved revisions stay intact. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.SovietArithmeticPractice=api;if(root.document?.getElementById('arithmetic-practice-root'))api.mount(root);}
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const continuations=Object.freeze({
    groups:'/trainers/arifmetika.html?course=preoge&level=t2a',
    'times-table':'/trainers/arifmetika.html?course=preoge&level=n2d',
    'multiply-by-ten-hundred':'/soviet-math/arithmetic-practice.html?topic=multiply-by-ten-hundred',
    'zero-actions':'/soviet-math/arithmetic-practice.html?topic=zero-actions',
    'column-multiply':'/trainers/oge-basics/multiplication-division/course-column-mixed.html',
    'decimal-multiply':'/trainers/drobi-oge-trainer.html#practice=decimal-multiply',
    'decimal-multiply-ten':'/school/index.html?course=vilenkin5#lesson/v5f-decimal-times-ten',
    'fraction-multiply':'/trainers/drobi-oge-trainer.html#practice=fraction-multiply',
    'fraction-of-number':'/trainers/fractions-part-whole-assignment.html',
    order:'/trainers/oge-basics/order-of-operations.html'
  });
  const topics=Object.freeze(['multiply-by-ten-hundred','zero-actions']);
  const nextSeed=seed=>(seed+1)>>>0;
  function make(topic,seed){
    if(!topics.includes(topic)||!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Неизвестная тренировка.');
    const a=2+(Math.imul(seed,17)>>>0)%98,b=2+(Math.imul(seed,3)>>>0)%8;
    const step=(prompt,answer,solution,record,hint)=>({prompt,answer,hint,solution,record});
    if(topic==='multiply-by-ten-hundred'){
      const factor=seed%2?100:10,zeros=factor===10?'0':'00',answer=a*factor;
      return {topic,seed,title:'Умножаем целое число на 10 и 100',prompt:a+' × '+factor,answer,
        steps:[step('Умножаем на '+factor+'. Сколько нулей припишем справа?',zeros.length,'На 10 — один ноль. На 100 — два нуля.','Справа припишем '+zeros+'.','Посмотри, сколько нулей в числе, на которое умножаем.'),
          step('Припиши '+zeros+' к числу '+a+'. Какое число получилось?',answer,'Число '+a+' и справа '+zeros+': '+answer+'.',a+' × '+factor+' = '+answer+'.','Сначала напиши исходное число. Справа припиши столько нулей, сколько в числе, на которое умножаем.')]};
    }
    const mode=seed%4;
    if(mode===0)return {topic,seed,title:'Действия с нулём',prompt:a+' + 0',answer:a,steps:[step('Ничего не прибавили. Какое число осталось?',a,'Было '+a+'. Прибавили 0 — осталось '+a+'.',a+' + 0 = '+a+'.','Ноль означает, что ничего не добавили. Посмотри на число перед плюсом.')]};
    if(mode===1)return {topic,seed,title:'Действия с нулём',prompt:a+' − 0',answer:a,steps:[step('Ничего не вычли. Какое число осталось?',a,'Было '+a+'. Убрали 0 — осталось '+a+'.',a+' − 0 = '+a+'.','Ничего не убрали. Посмотри на число перед минусом.')]};
    if(mode===2)return {topic,seed,title:'Действия с нулём',prompt:a+' × 0',answer:0,steps:[step('Число '+a+' взяли ноль раз. Сколько получилось?',0,'Не взяли ни одного раза — получилось 0.',a+' × 0 = 0.','Если число не взяли ни разу, предметов не будет.')]};
    return {topic,seed,title:'Действия с нулём',prompt:'('+a+' + 0) − '+b+' × 0',answer:a,steps:[
      step('Сначала скобки: '+a+' + 0 = ?',a,'Ничего не прибавили. Осталось '+a+'.',a+' + 0 = '+a+'.','Ничего не добавляем. Число в скобках останется прежним.'),
      step('Теперь умножение: '+b+' × 0 = ?',0,'Число взяли ноль раз. Получилось 0.',b+' × 0 = 0.','Если число не взяли ни разу, предметов не будет.'),
      step('Осталось вычесть: '+a+' − 0 = ?',a,'Ничего не убрали. Осталось '+a+'.',a+' − 0 = '+a+'.','Ничего не убираем. Найди число перед минусом.')]};
  }
  function accepts(value,answer){return /^\+?\d+$/.test(String(value).trim())&&Number(value)===answer;}
  function mount(w){
    const d=w.document,$=id=>d.getElementById(id),requested=new URLSearchParams(w.location.search).get('topic'),topic=topics.includes(requested)?requested:topics[0],key='mathExam.sovietArithmeticPractice.v1.'+topic;
    let state={version:1,topic,seed:0,answers:[],draft:'',hint:false,solution:false,assisted:false,solved:0,helpSolved:0},task,saveBlocked=false;
    try{const raw=w.localStorage.getItem(key);if(raw!==null){const saved=JSON.parse(raw);if(!saved||saved.version!==1||saved.topic!==topic||!Number.isInteger(saved.seed)||saved.seed<0||saved.seed>4294967295||!Array.isArray(saved.answers)||typeof saved.draft!=='string'||saved.draft.length>20||typeof saved.hint!=='boolean'||!Number.isSafeInteger(saved.solved)||saved.solved<0||!['solution','assisted'].every(k=>saved[k]===undefined||typeof saved[k]==='boolean')||!(saved.helpSolved===undefined||Number.isSafeInteger(saved.helpSolved)&&saved.helpSolved>=0&&saved.helpSolved<=saved.solved))throw Error('Неверная запись.');const old=make(topic,saved.seed);if(saved.answers.length>old.steps.length||!saved.answers.every((value,i)=>accepts(value,old.steps[i].answer)))throw Error('Неверные ответы.');state={...state,...saved};}}catch(ignore){saveBlocked=true;$('save-warning').textContent='Сохранённая запись не открылась. Она оставлена без изменений. Можно решать, но новая работа пока не сохраняется.';$('save-warning').hidden=false;}
    const save=()=>{if(saveBlocked)return;try{w.localStorage.setItem(key,JSON.stringify(state));$('save-warning').hidden=true;}catch(ignore){$('save-warning').hidden=false;}};
    function render(){
      task=make(topic,state.seed);const done=state.answers.length===task.steps.length,q=task.steps[state.answers.length];
      d.title=task.title+' · Тренировка · MathExam';$('title').textContent=task.title;$('return').href='index.html#'+topic;$('condition').textContent=task.prompt;$('progress').textContent='Решено примеров: '+state.solved+'. С помощью: '+state.helpSolved+'.';
      $('question').textContent=done?(state.assisted?'Пример решён с помощью. Ответ: ':'Пример решён. Ответ: ')+task.answer:q.prompt;$('answer-form').hidden=done;$('hint').hidden=done;$('solution').hidden=done;$('hint-text').hidden=done||!state.hint&&!state.solution;$('hint-text').textContent=(state.solution?q?.solution:q?.hint)||'';$('answer').value=state.draft;$('next').hidden=!done;
      $('written').replaceChildren();task.steps.slice(0,state.answers.length).forEach(q=>{const li=d.createElement('li');li.textContent=q.record;$('written').append(li);});
    }
    $('answer').oninput=e=>{state.draft=e.target.value.slice(0,20);save();};
    $('answer-form').onsubmit=e=>{e.preventDefault();const q=task.steps[state.answers.length];if(!q)return;if(!accepts($('answer').value,q.answer)){$('feedback').textContent=$('answer').value.trim()?'Пока не получилось. Посмотри на этот шаг или открой подсказку.':'Введи число.';return;}state.answers.push(String(q.answer));state.draft='';state.hint=false;state.solution=false;if(state.answers.length===task.steps.length){state.solved++;if(state.assisted)state.helpSolved++;}save();render();$('feedback').textContent='Верно.';(state.answers.length===task.steps.length?$('next'):$('answer')).focus();};
    $('hint').onclick=()=>{state.hint=!state.hint;state.solution=false;state.assisted=true;save();render();};
    $('solution').onclick=()=>{state.solution=true;state.assisted=true;save();render();};
    $('next').onclick=()=>{if(state.answers.length!==task.steps.length)return;state.seed=nextSeed(state.seed);state.answers=[];state.draft='';state.hint=false;state.solution=false;state.assisted=false;save();render();$('feedback').textContent='';$('answer').focus();};
    render();
  }
  return Object.freeze({continuations,topics,nextSeed,make,accepts,mount});
});
