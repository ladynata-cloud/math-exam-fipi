(function(){
'use strict';
const C=window.ArithmeticFoundations,$=s=>document.querySelector(s),E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state,task,key,canSave=true;
let contextualHelp=null;
function updateHelp(q){
 if(!window.MathExamBasicsHelp||!q)return;
 contextualHelp=contextualHelp||window.MathExamBasicsHelp.create();
 const host=document.createElement('div');host.className='basics-help-host';$('#question').after(host);
 const content=document.createElement('div');content.className='basics-help-root';
 const clue=document.createElement('p');clue.textContent=q.hint;content.append(clue);
 const reveal=document.createElement('button');reveal.type='button';reveal.textContent='Показать этот шаг';
 reveal.onclick=()=>{state.help=true;save();clue.textContent=q.record+'. Введи ответ '+q.answer+' и проверь.';};content.append(reveal);
 $('#hint').hidden=true;$('#help').hidden=true;
 contextualHelp.update({host,identity:state.id+':'+state.seed+':'+state.answers.length,contentId:task.stage.branch==='addition'?'decimal-add-subtract':'multiplication-division/course-subtract',context:{prompt:q.prompt,kind:task.stage.branch==='addition'?'add':'subtract'},rootContent:content,onUse:()=>{state.help=true;save();}});
}
function save(){if(!canSave)return;try{sessionStorage.setItem(key,JSON.stringify(state));}catch(_){canSave=false;$('#storage-note').textContent='Сохранение недоступно. Не закрывай и не обновляй вкладку до конца упражнения.';}}
function fresh(id,seed=1,streak=0){return {id,seed,answers:[],errors:0,help:false,draft:'',streak};}
function load(){const id=location.hash.slice(1),stage=C.stages.find(s=>s.id===id)||C.stages[0];key='mathExam.foundations.tab.v1.'+stage.id;canSave=true;$('#storage-note').textContent='';state=fresh(stage.id);try{const raw=sessionStorage.getItem(key);if(raw){const s=JSON.parse(raw);if(s.id!==stage.id||!Number.isInteger(s.seed)||s.seed<1||s.seed>100000000||!Array.isArray(s.answers)||!Number.isInteger(s.errors)||s.errors<0||typeof s.help!=='boolean'||typeof s.draft!=='string'||s.draft.length>12||!Number.isInteger(s.streak)||s.streak<0)throw Error('saved');const t=C.make(s.id,s.seed);if(s.answers.length>t.steps.length||s.answers.some((a,i)=>a!==t.steps[i].answer))throw Error('answers');state=s;}}catch(_){canSave=false;$('#storage-note').textContent='Сохранённую работу не удалось прочитать. Она оставлена без изменений. Этот пример не сохраняется; не обновляй вкладку.';}task=C.make(state.id,state.seed);render();}
function column(){
 const marks=C.written(task,state.answers.length),width=Math.max(String(task.a).length,String(task.b).length,...Object.keys(marks.result).map(c=>Number(c)+1));
 const digits=n=>[...String(n)].reverse();
 function row(values,kind,operator=''){
  return '<div class="column-line '+kind+'"><span class="operator">'+operator+'</span>'+Array.from({length:width},(_,n)=>{const col=width-n-1,value=values[col]??'';return '<span data-column="'+col+'"'+(kind==='result'?' data-written-digit':'')+' class="'+(kind==='top'&&Object.hasOwn(marks.regroup,col)?'changed':'')+'">'+E(value)+'</span>';}).join('')+'</div>';
 }
 return '<div class="column" style="--columns:'+width+'" aria-label="'+task.a+' '+task.sign+' '+task.b+'">'+row(marks.regroup,'regroup')+row(digits(task.a),'top')+row(digits(task.b),'bottom',task.sign)+row(marks.result,'result')+'</div><p class="in-mind" aria-live="polite">'+(marks.memory?'В уме '+marks.memory.value:'')+'</p>';
}
function retestLink(){
 const params=new URLSearchParams(location.search),previous=params.get('diagnosticVariant'),next=previous==='1'?0:1;
 return 'division-diagnostic.html?afterPractice=1&variant='+next+(params.get('from')==='cabinet'?'&from=cabinet':'');
}
function render(){const i=state.answers.length,q=task.steps[i],done=!q;$('#title').textContent=task.stage.title;$('#goal').textContent=task.stage.goal;
 $('#stages').innerHTML=C.stages.filter(s=>s.branch===task.stage.branch).map((s,n)=>'<a href="#'+s.id+'"'+(s.id===state.id?' aria-current="step"':'')+'>'+ (n+1)+'. '+E(s.title)+'</a>').join('');
 const record=task.steps.slice(0,i).map(s=>'<li>'+E(s.record)+'</li>').join('');
 $('#exercise').innerHTML='<p>Пример '+state.seed+' · '+(done?'Готово':'Действие '+(i+1)+' из '+task.steps.length)+'</p>'+column()+(record?'<details open><summary>Наши действия</summary><ol class="records">'+record+'</ol></details>':'')+(done?'<h2>Пример решён</h2><p>'+(state.errors||state.help?'В этом примере понадобилась помощь или исправление. Попробуй ещё один.':'Все действия выполнены верно с первой попытки.')+'</p><p>Подряд без ошибок и подсказок: '+(state.errors||state.help?0:state.streak+1)+'. Для закрепления попробуй решить три новых примера.</p><div class="actions"><button id="new" class="primary">Новый пример</button>'+ (C.stages.find(s=>s.branch===task.stage.branch&&C.stages.indexOf(s)===C.stages.indexOf(task.stage)+1)?'<a id="next-stage" href="#'+C.stages[C.stages.indexOf(task.stage)+1].id+'">Следующий шаг →</a>':'<a href="division-course.html">К четырём линейкам →</a>')+'</div>'+(!state.errors&&!state.help&&state.streak+1>=3?'<section class="retest-ready"><h2>Уже есть опыт</h2><p>Три новых примера подряд получились самостоятельно. Можно снова проверить деление и выбрать следующий шаг.</p><a class="button" id="retest" href="'+retestLink()+'" target="_blank" rel="noopener">Повторить диагностику →</a></section>':''):'<h2 id="question">'+E(q.prompt)+'</h2><form id="answer-form"><label for="answer">Твой ответ</label><input id="answer" inputmode="numeric" autocomplete="off" maxlength="12" value="'+E(state.draft)+'"><div class="actions"><button class="primary" id="check">Проверить</button><button type="button" id="hint">Подсказка</button></div></form><p id="feedback" role="status"></p><div id="help"></div>');
 if(done){contextualHelp?.close();$('#new').onclick=()=>{state=fresh(state.id,state.seed+1,state.errors||state.help?0:state.streak+1);task=C.make(state.id,state.seed);save();render();$('#answer')?.focus();};return;}
 $('#answer').oninput=()=>{state.draft=$('#answer').value;save();};
 $('#hint').onclick=()=>{state.help=true;save();$('#help').innerHTML='<p class="hint">'+E(q.hint)+'</p><button id="show">Показать этот шаг</button>';$('#show').onclick=()=>{$('#help').innerHTML='<p class="hint">'+E(q.record)+'. Введи ответ '+q.answer+' и проверь.</p>';};};
 $('#answer-form').onsubmit=e=>{e.preventDefault();const value=$('#answer').value.trim();if(!/^\d{1,7}$/.test(value)){$('#feedback').textContent='Введи целое неотрицательное число.';return;}if(String(Number(value))!==q.answer){state.errors++;save();$('#feedback').className='feedback error';$('#feedback').textContent='Пока не совпало. '+q.hint;return;}state.answers.push(q.answer);state.draft='';save();render();$('#answer')?.focus();};
 updateHelp(q);
}
window.addEventListener('mathexam-basics-help-ready',()=>{if(state)render();});window.addEventListener('hashchange',load);load();
})();
