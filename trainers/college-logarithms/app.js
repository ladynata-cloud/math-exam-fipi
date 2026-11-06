(function(){'use strict';
const C=window.LogCourseCore,D=C.D,E=C.E,P=window.LogCoursePlot,$=id=>document.getElementById(id),esc=E.escapeHTML,BOARD=window.LogCourseBoardMode,KEY='mathExam.collegeLogarithms.v1';
const rich=v=>esc(v).replace(/x − \((-?\d+)\)/g,(_,h)=>Number(h)===0?'x':Number(h)>0?'x − '+h:'x + '+(-Number(h))).replace(/ \+ \((-?\d+)\)/g,(_,k)=>Number(k)===0?'':Number(k)>0?' + '+k:' − '+(-Number(k))).replace(/log\[([^\]]+)\]/g,'log<sub>$1</sub>').replace(/\^(-?\d+)/g,'<sup>$1</sup>');
let state=C.blank(),saved={},storageOK=true,adapter;
if(!BOARD)try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&raw.attempts&&typeof raw.attempts==='object'){for(const [k,s]of Object.entries(raw.attempts)){if(C.validate(s)&&k===s.mode+':'+s.taskId)saved[k]=s;}if(C.validate(raw.current))state=raw.current;}}catch(_){storageOK=false;}
function save(){if(BOARD)return;saved[state.mode+':'+state.taskId]=C.clone(state);try{localStorage.setItem(KEY,JSON.stringify({current:state,attempts:saved}));}catch(_){storageOK=false;}}
function changed(renderAll=true){if(!C.validate(state))throw Error('Invalid local logarithm state');save();if(renderAll)render();if(adapter)adapter.changed();}
function select(id,mode=state.mode){if(!C.task(id))return;save();const previous=!BOARD?saved[mode+':'+id]:null;state=previous&&C.validate(previous)?C.clone(previous):C.blank(id,mode);changed();}
function check(){const t=C.task(state.taskId),step=t.steps[state.stage];if(!step)return;if(C.correct(step,state.drafts[state.stage])){state.stage++;state.hint=0;state.feedback='correct';}else{state.errors=Math.min(100000,state.errors+1);state.feedback='wrong';}changed();if(state.stage<t.steps.length)$('answer')?.focus();}
function setDraft(v){state.drafts[state.stage]=String(v).slice(0,200);state.feedback='none';changed(false);$('feedback').textContent='';$('feedback').className='';}
function lab(){const p=state.lab;$('base').value=String(p.a);$('shift-h').value=p.h;$('shift-k').value=p.k;$('h-value').textContent=p.h;$('k-value').textContent=p.k;$('lab-formula').innerHTML=rich(`y = log[${E.formatNumber(p.a)}](x − (${p.h})) + (${p.k})`);
const pts=[[p.h+1,p.k],[p.h+p.a,p.k+1],[p.h+1/p.a,p.k-1]];P.render($('lab-graph'),p,pts,true);
$('lab-facts').innerHTML=`<p><b>ОДЗ:</b> x &gt; ${p.h}. Значения y — все действительные числа.</p><p><b>${p.a>1?'Возрастает':'Убывает'}</b> на (${p.h}; +∞), потому что ${p.a>1?'a > 1':'0 < a < 1'}.</p><p><b>Асимптота:</b> x = ${p.h}; график приближается к ней, но не пересекает.</p><p><b>Опорные точки:</b> ${pts.map(([x,y])=>'('+E.formatNumber(x)+'; '+E.formatNumber(y)+')').join(', ')}.</p>`;}
function render(){const t=C.task(state.taskId),chapter=D.chapters.find(c=>c.id===t.chapter),step=t.steps[state.stage];
$('chapter').value=t.chapter;$('task').innerHTML=D.tasks.filter(q=>q.chapter===t.chapter).map((q,i)=>`<option value="${q.id}">${i+1}. ${esc(q.title)}</option>`).join('');$('task').value=t.id;
$('learn').setAttribute('aria-pressed',state.mode==='learn');$('test').setAttribute('aria-pressed',state.mode==='test');
$('mode-note').textContent=BOARD?'Совместная работа: состояние задачи и записи передаются участнику комнаты.':state.mode==='learn'?'Учимся: используй подсказки по необходимости. Каждый выполненный шаг остаётся на экране.':'Режим без подсказок: решай в тетради или в поле записей, затем проверяй шаги.';
$('position').textContent=`РАЗДЕЛ ${D.chapters.indexOf(chapter)+1} / 10 · ЗАДАЧА ${D.tasks.indexOf(t)+1} / 60`;$('task-title').textContent=t.title;$('condition').innerHTML=rich(t.prompt);
$('step-count').textContent=step?`Шаг ${state.stage+1} из ${t.steps.length}`:`Все ${t.steps.length} шагов выполнены`;$('error-count').textContent=`Ошибок: ${state.errors}`;$('step-progress').max=t.steps.length;$('step-progress').value=state.stage;
$('history').innerHTML=t.steps.slice(0,state.stage).map((s,i)=>`<div class="done-step"><span>${i+1}. ${esc(s.label)}</span><b>✓ ${esc(state.drafts[i])}</b></div>`).join('');
$('answer-form').hidden=!step;$('completion').hidden=!!step;
if(step){$('current-step').innerHTML=`<label for="answer">${rich(step.label)}</label>`+(step.kind==='choice'?`<select id="answer"><option value="">Выбери ответ…</option>${step.options.map(v=>`<option value="${esc(v)}" ${state.drafts[state.stage]===v?'selected':''}>${esc(v)}</option>`).join('')}</select>`:`<input id="answer" type="text" autocomplete="off" spellcheck="false" maxlength="200" value="${esc(state.drafts[state.stage])}" placeholder="${step.kind==='set'?'Например: (2; +∞)':step.kind==='point'?'x; y':'Число или дробь'}">`);
$('symbol-pad').hidden=step.kind!=='set'&&step.kind!=='point';$('hint').hidden=state.mode==='test';$('hint').disabled=state.hint===3;$('hint').textContent=state.hint?`Ещё подсказка (${state.hint}/3)`:'Подсказка';
}else{$('current-step').textContent='';$('completion').textContent=`Готово! ${state.mode==='test'?'Задание выполнено в режиме без подсказок.':state.helped?'Задание разобрано с помощью. Попробуй следующую задачу без подсказок.':'Все шаги выполнены без подсказок.'} Ошибок: ${state.errors}.`;}
$('feedback').className=state.feedback==='wrong'?'bad':state.feedback==='correct'?'good':'';
$('feedback').textContent=state.feedback==='wrong'?`Пока не получилось. ${step.error}${state.errors>=2&&state.mode==='learn'?' Можно открыть подсказку.':''}`:state.feedback==='correct'?'Верно. Этот шаг сохранён.':'';
$('hint-text').hidden=!state.hint;$('hint-text').innerHTML=step?step.hints.slice(0,state.hint).map((v,i)=>`<p><b>${i+1}.</b> ${esc(v)}</p>`).join(''):'';
$('theory').hidden=state.mode==='test';$('lab').hidden=state.mode==='test';$('theory-content').textContent=chapter.theory;
$('theory').open=state.theory;$('reference').open=state.reference;$('lab').open=state.lab.open;$('notes').value=state.note;
$('previous').disabled=D.tasks.indexOf(t)===0;$('next').disabled=D.tasks.indexOf(t)===D.tasks.length-1;
$('exercise-graph').hidden=!t.graph;
if(t.graph){const pts=t.steps.slice(0,state.stage).filter(s=>s.kind==='point').map(s=>s.answer);P.render($('task-graph'),t.graph,pts,state.stage===t.steps.length);$('graph-caption').textContent=state.stage===t.steps.length?'Точки проверены, теперь виден график и его асимптота.':'График появится после построения трёх точек. Щелчок по сетке: шаг 1/4; дроби можно ввести точно.';}
if(state.lab.open)lab();
const completed=new Set(Object.values(saved).filter(s=>C.task(s.taskId)?.steps.length===s.stage).map(s=>s.taskId));$('progress').textContent=BOARD?'Общая доска':`Выполнено ${completed.size} / 60`;
$('storage-note').textContent=BOARD?'Совместная работа не записывается как личный результат.':storageOK?'Прогресс сохраняется в этом браузере. Учебные и самостоятельные попытки хранятся отдельно.':'Сохранение в браузере недоступно. Текущая работа продолжится до закрытия страницы.';
}
$('chapter').innerHTML=D.chapters.map((c,i)=>`<option value="${c.id}">${i+1}. ${esc(c.title)}</option>`).join('');
$('base').innerHTML=C.bases.map(a=>`<option value="${a}">${E.formatNumber(a)}</option>`).join('');
$('symbol-pad').innerHTML=['−','∞','(',')','[',']',';'].map(s=>`<button type="button" data-symbol="${s}" aria-label="Вставить ${s}">${s}</button>`).join('');
$('answer-form').addEventListener('submit',e=>{e.preventDefault();check();});
$('current-step').addEventListener('input',e=>{if(e.target.id==='answer')setDraft(e.target.value);});
$('current-step').addEventListener('change',e=>{if(e.target.id==='answer')setDraft(e.target.value);});
$('symbol-pad').addEventListener('click',e=>{const b=e.target.closest('[data-symbol]');if(!b)return;const el=$('answer');if(!el||el.tagName!=='INPUT')return;const pos=el.selectionStart??el.value.length,end=el.selectionEnd??pos;el.value=el.value.slice(0,pos)+b.dataset.symbol+el.value.slice(end);setDraft(el.value);el.focus();el.setSelectionRange(pos+b.dataset.symbol.length,pos+b.dataset.symbol.length);});
$('chapter').addEventListener('change',e=>select(D.tasks.find(t=>t.chapter===e.target.value).id));$('task').addEventListener('change',e=>select(e.target.value));
$('learn').addEventListener('click',()=>{if(state.mode!=='learn')select(state.taskId,'learn');});$('test').addEventListener('click',()=>{if(state.mode!=='test')select(state.taskId,'test');});
$('previous').addEventListener('click',()=>{const t=D.tasks[D.tasks.findIndex(t=>t.id===state.taskId)-1];if(t)select(t.id);});$('next').addEventListener('click',()=>{const t=D.tasks[D.tasks.findIndex(t=>t.id===state.taskId)+1];if(t)select(t.id);});
$('hint').addEventListener('click',()=>{if(state.mode==='learn'&&state.stage<C.task(state.taskId).steps.length&&state.hint<3){state.hint++;state.helped=true;changed();}});
$('notes').addEventListener('input',e=>{state.note=e.target.value.slice(0,1500);changed(false);});
for(const id of ['theory','reference','lab'])$(id).addEventListener('toggle',()=>{const current=id==='lab'?state.lab.open:state[id],next=$(id).open;if(current===next)return;if(state.mode==='test'&&id!=='reference'){$(id).open=false;return;}if(id==='lab')state.lab.open=next;else state[id]=next;changed(false);if(id==='lab'&&next)lab();});
for(const [id,key]of [['base','a'],['shift-h','h'],['shift-k','k']])$(id).addEventListener(id==='base'?'change':'input',e=>{const n=Number(e.target.value);if(key==='a'?!C.bases.includes(n):!Number.isInteger(n)||Math.abs(n)>3)return;state.lab[key]=n;changed(false);lab();});
$('task-graph').addEventListener('click',e=>{const t=C.task(state.taskId),s=t.steps[state.stage];if(!t.graph||s?.kind!=='point')return;const p=P.coordinates($('task-graph'),e,t.graph);if(p){$('answer').value=p.map(E.formatNumber).join('; ');setDraft($('answer').value);check();}});
render();
adapter=window.LogCourseBoardAdapter.create({read:()=>state,write:value=>{state=value;render();}});
window.LogCourseApp={snapshot:()=>({state:C.clone(state),attempts:C.clone(saved),board:BOARD}),select};
})();
