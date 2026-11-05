/* One cabinet attempt holds the twelve original exercises of one lesson. */
(function(root){
'use strict';
if(new URLSearchParams(location.search).get('learning')!=='1')return;
const M=root.MotionCourse,C=root.MotionContracts,N=root.MotionNavigation,bridge=root.MathExamLearning;
const main=document.getElementById('main');
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=s=>JSON.parse(JSON.stringify(s));
let spec=null,state=null,readonly=true,applying=false,notify=()=>{},playing=false,lastFrame=0,raf=null;
let feedback='',feedbackGood=false;
document.body.classList.add('managed');
main.innerHTML='<p role="status">Открываем сохранённое занятие…</p>';main.inert=true;
const item=()=>spec.items[state.taskIndex];
const record=()=>state.records[state.taskIndex];
const done=(r,i)=>C.isDone(spec,r,i);
const count=()=>state.records.filter(done).length;
function getState(){return state?copy(state):null;}
function emit(kind,details={}){if(!applying&&!readonly&&state)notify({kind,details,state:getState()});}
function stop(){playing=false;lastFrame=0;if(raf!==null)cancelAnimationFrame(raf);raf=null;}
function readOnly(value){readonly=value===true;if(readonly)stop();main.inert=readonly||!state;main.dataset.readOnly=String(readonly);}
function applyState(envelope){
 if(!envelope||!envelope.taskSpec)throw Error('Не передано занятие.');
 const p=envelope.taskSpec;
 const canonical=C.create(p.contentId,p.seed).taskSpec;
 if(JSON.stringify(p)!==JSON.stringify(canonical))throw Error('Условие отличается от опубликованного занятия.');
 const incoming=C.normalize(p,envelope.state);
 const same=spec&&JSON.stringify(spec)===JSON.stringify(p)&&JSON.stringify(state)===JSON.stringify(incoming);
 readOnly(envelope.readOnly===true);if(same)return;
 const active=document.activeElement,focus=active?.id==='answer';
 const selection=focus&&typeof active.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null;
 applying=true;
 try{stop();spec=copy(p);state=incoming;feedback='';render();if(focus&&!readonly){const field=document.getElementById('answer');field?.focus({preventScroll:true});if(field&&selection)field.setSelectionRange(...selection);}}
 finally{applying=false;readOnly(envelope.readOnly===true);}
}
function helpEvent(){record().assisted=true;emit('hint',{step:record().answers.length});}
function setTask(n){if(n===state.taskIndex){render();return;}stop();state.taskIndex=n;state.modelTime=0;state.exampleStep=0;state.modelOpen=false;state.view='train';state.help=false;feedback='';render();emit('navigate',{taskIndex:n});}
function setView(view){stop();state.view=view;state.exampleStep=0;state.modelOpen=view==='learn';state.modelTime=0;feedback='';if(view!=='train')record().assisted=true;render();emit(view==='train'?'navigate':'hint',{step:record().answers.length});}
function solvedView(){const r=record(),q=item();return `<div class="end" role="status"><b>Верно! Ответ: ${M.F(q.answer)} ${E(q.unit)}.</b><p>${r.assisted?'Задача решена с помощью.':'Задача решена самостоятельно.'}</p></div>${r.answers.length?q.steps.map((s,i)=>`<div class="step done"><b>✓ Шаг ${i+1}.</b> ${E(s.why)}</div>`).join(''):''}`;}
function formView(){
 const r=record(),q=item(),guided=state.help,s=guided?q.steps[r.answers.length]:{q:'Запиши ответ на вопрос задачи.',u:q.unit};
 return (guided?q.steps.slice(0,r.answers.length).map((s,i)=>`<div class="step done"><b>✓ Шаг ${i+1}.</b> ${E(s.why)}</div>`).join(''):'')+`<form id="answerForm" class="step"><label for="answer"><b>${guided?`Шаг ${r.answers.length+1} из ${q.steps.length}. `:''}${E(s.q)}</b></label><div class="row" style="margin-top:12px"><input id="answer" type="text" inputmode="decimal" autocomplete="off" maxlength="200" aria-describedby="feedback" placeholder="Твой ответ"><span>${E(s.u)}</span><button class="primary" type="button" id="check">Проверить</button><button type="button" id="hint">Подсказка</button></div><div id="feedback" class="feedback ${feedbackGood?'success':'error'}" role="status">${E(feedback)}</div><div id="hintContent"></div></form>`;
}
function render(){
 stop();const q=item(),r=record(),l=M.lessons[spec.lessonIndex],n=count();
 document.title=l[0]+' · Мастерская движения';
 const previous=state.taskIndex>0?'<button id="prev">← Предыдущая</button>':'<span></span>';
 const next=state.taskIndex<11?'<button id="next">Следующая задача →</button>':'<button id="finish">Итог занятия</button>';
 main.innerHTML=`<div class="eyebrow">Мастерская движения · 6 класс · Занятие ${N.position(spec.lessonIndex)} / 12</div><h1>${E(l[0])}</h1><p class="lead">${E(l[1])}</p>${N.isRiver(spec.lessonIndex)?'<p class="river-callout"><a id="riverHelp" href="river-lab.html" target="_blank" rel="noopener">Почему разность скоростей вдвое больше скорости течения? Разобраться на модели ↗</a></p>':''}<p class="managed-status">Решено в этом занятии: <b>${n} из 12</b>. Ответы и шаги сохраняются в кабинете.</p><div class="progress"><div style="width:${n/12*100}%"></div></div><div class="tabs" aria-label="Режим занятия">${[['learn','1. Посмотри'],['example','2. Разберись'],['train','3. Потренируйся']].map(([id,label])=>`<button data-view="${id}" class="${state.view===id?'selected':''}">${label}</button>`).join('')}</div>${state.view==='learn'?`<div class="formula">${E(l[2])}</div><p class="hint">${E(l[3])}</p>`:''}<section class="card"><div class="row between"><span class="chip">Задача ${state.taskIndex+1} из 12 · ${['Первые шаги','Закрепление','Чуть сложнее'][Math.floor(state.taskIndex/4)]}</span>${state.view==='train'&&!done(r,state.taskIndex)?`<label><input type="checkbox" id="guided" ${state.help?'checked':''}> Решать по шагам</label>`:''}</div><p class="question">${E(q.text)}</p><div id="work"></div></section><details id="modelDetails" ${state.modelOpen?'open':''}><summary>Анимация и схема движения · подсказка</summary><section class="card scene"><svg id="scene" viewBox="0 0 800 310" role="img" aria-label="Схема движения"></svg><p id="sceneReadout" style="padding:12px 20px;margin:0;font-size:17px"></p><div class="controls"><button id="play">▶ Пуск</button><button id="restart" aria-label="Сначала">↺</button><label for="scrub">Время</label><input id="scrub" type="range" min="0" max="1000" value="0" aria-label="Ход движения"><output id="clock" class="time"></output></div></section><p class="small">Модель ускорена: весь путь показан за 10 секунд. Часы на схеме — время из задачи.</p></details><div class="row between">${previous}${next}</div><div class="taskdots">${state.records.map((r,i)=>`<button data-task="${i}" class="${i===state.taskIndex?'current':''} ${done(r,i)?'solved':''}" aria-label="Задача ${i+1}${done(r,i)?', решена':''}">${i+1}</button>`).join('')}</div><footer>Десятичные дроби можно вводить с запятой или точкой. Можно вводить дроби вида 3/2. Другие занятия открываются из маршрута в кабинете. Повторное прохождение содержит те же 12 задач.</footer>`;
 const work=document.getElementById('work');
 if(state.view==='learn')work.innerHTML='<p class="small">Запусти модель. Останови движение и объясни, как изменилось расстояние.</p><button class="primary" data-view="example">К разбору по шагам →</button>';
 else if(state.view==='example')work.innerHTML=q.steps.slice(0,state.exampleStep).map((s,i)=>`<div class="step done"><b>Шаг ${i+1}. ${E(s.q)}</b><p>${E(s.why)}</p></div>`).join('')+(state.exampleStep<q.steps.length?'<button class="primary" id="exampleNext">Показать следующий шаг</button>':`<div class="end"><b>Ответ: ${M.F(q.answer)} ${E(q.unit)}.</b><p>Это объяснение не засчитывает задачу. Перейди к тренировке и запиши решение.</p><button class="primary" data-view="train">К тренировке →</button></div>`);
 else work.innerHTML=done(r,state.taskIndex)?solvedView():formView();
 const field=document.getElementById('answer');if(field)field.value=r.draft;
 draw();bind();readOnly(readonly);
}
function check(){
 if(readonly||done(record(),state.taskIndex))return;
 const q=item(),r=record(),raw=document.getElementById('answer').value,value=M.numeric(raw),guided=state.help,step=r.answers.length,previous=[...r.answers];r.draft=raw;
 if(!Number.isFinite(value)){feedback='Введи число: например 12; 1,5; 3/2.';feedbackGood=false;render();emit('input',{taskIndex:state.taskIndex});return;}
 const correct=Math.abs(value-(guided?q.steps[step].a:q.answer))<=1e-6;
 if(guided)r.assisted=true;
 if(correct){if(guided)r.answers.push(raw);else r.finalAnswer=raw;r.draft='';feedback=done(r,state.taskIndex)?'Верно!':'Верно. Продолжай со следующего шага.';feedbackGood=true;}
 else{feedback='Пока не получилось. Проверь действие, вычисление и единицы. Можно открыть подсказку.';feedbackGood=false;}
 const details=guided?{scope:'step',taskIndex:state.taskIndex,step,answer:raw,answers:previous}:{scope:'final',taskIndex:state.taskIndex,answer:raw};
 emit('check',details);render();document.getElementById('answer')?.focus();
}
function bind(){
 main.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{if(!readonly)setView(b.dataset.view);});
 main.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>{if(!readonly)setTask(+b.dataset.task);});
 const on=(id,event,fn)=>{const el=document.getElementById(id);if(el)el[event]=()=>{if(!readonly)fn(el);};};
 on('prev','onclick',()=>setTask(state.taskIndex-1));on('next','onclick',()=>setTask(state.taskIndex+1));
 on('finish','onclick',()=>{const n=count();document.getElementById('work').innerHTML=`<div class="end"><h2>${n===12?'Занятие пройдено!':'Продолжи тренировку'}</h2><p>Решено ${n} из 12 задач. ${n===12?'Дождись отметки «Сохранено» в кабинете. Следующую тему выбери в своём маршруте.':'Зелёным отмечены решённые задачи. Выбери оставшиеся номера.'}</p></div>`;});
 on('exampleNext','onclick',()=>{state.exampleStep++;record().assisted=true;render();helpEvent();});
 on('guided','onchange',el=>{state.help=el.checked;if(state.help)record().assisted=true;render();emit(state.help?'hint':'navigate',{step:record().answers.length});});
 on('answer','oninput',el=>{record().draft=el.value.slice(0,200);emit('input',{field:'answer',taskIndex:state.taskIndex});});
 const form=document.getElementById('answerForm');if(form)form.onsubmit=e=>{e.preventDefault();check();};
 const field=document.getElementById('answer');if(field)field.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing&&!e.repeat){e.preventDefault();check();}};
 on('check','onclick',check);
 on('riverHelp','onclick',helpEvent);
 on('hint','onclick',()=>{helpEvent();const q=item(),r=record();document.getElementById('hintContent').innerHTML=`<p class="hint">${E(state.help?q.steps[r.answers.length].why:M.lessons[spec.lessonIndex][2]+'. '+M.lessons[spec.lessonIndex][3])}</p>`;});
 const details=document.getElementById('modelDetails');details.ontoggle=()=>{if(applying||readonly||!details.isConnected||details.open===state.modelOpen)return;stop();state.modelOpen=details.open;if(details.open)record().assisted=true;emit(details.open?'hint':'navigate',{step:record().answers.length});};
 on('play','onclick',()=>{if(playing){stop();draw();emit('model');}else{helpEvent();if(state.modelTime>=item().duration)state.modelTime=0;playing=true;lastFrame=0;raf=requestAnimationFrame(frame);draw();}});
 on('restart','onclick',()=>{stop();state.modelTime=0;draw();emit('model');});
 on('scrub','oninput',el=>{stop();state.modelTime=+el.value/1000*item().duration;draw();});
 on('scrub','onchange',()=>{record().assisted=true;emit('model');});
}
const text=(x,y,t,color='#20342f',size=18,anchor='start')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="system-ui,sans-serif" text-anchor="${anchor}">${E(t)}</text>`;
function draw(){
 const el=document.getElementById('scene');if(!el||!state)return;
 const q=item(),t=state.modelTime,g=M.geometry(q,t),x=p=>80+(p-g.min)/(g.max-g.min||1)*640,two=['meet','away','catch','lag','compare'].includes(q.kind),river=['up','down','trip','compare'].includes(q.kind);
 const p1=x(g.p1),p2=x(g.p2);let body=`<rect width="800" height="310" fill="${river?'#e1f0f4':'#edf4ed'}"/>`;
 if(river)body+=text(28,32,`Течение → ${q.river??q.v2} км/ч`,'#35677f',17)+`<path d="M25 80 Q65 65 105 80 T185 80 T265 80 T345 80 T425 80 T505 80 T585 80 T665 80 T745 80" fill="none" stroke="#bad9e4" stroke-width="3"/>`;
 body+='<line x1="80" y1="154" x2="720" y2="154" stroke="#bbcdbd" stroke-width="8" stroke-linecap="round"/>';
 for(let i=0;i<=4;i++){const px=80+i*160;body+=`<line x1="${px}" y1="144" x2="${px}" y2="164" stroke="#718a79"/>`+text(px,189,M.F(g.min+(g.max-g.min)*i/4),'#61736c',15,'middle');}
 body+=text(744,189,'км','#61736c',14);
 const left=q.kind==='away'||q.kind==='up'||q.kind==='trip'&&t>q.turn;
 body+=text(28,59,`${q.labelA}: ${M.F(q.kind==='trip'&&t>q.turn?q.v2:q.v1)} км/ч ${left?'←':'→'}`,'#26755e',19)+`<circle cx="${p1}" cy="124" r="17" fill="#26755e"/>`+text(p1,131,river&&q.kind!=='compare'?'▲':'1','#fff',19,'middle')+`<line x1="${p1}" y1="141" x2="${p1}" y2="154" stroke="#26755e" stroke-width="3"/>`;
 if(two)body+=text(28,86,`${q.labelB}: ${M.F(q.v2)} км/ч ${['meet','compare'].includes(q.kind)?'←':'→'}`,'#3d75ba',19)+`<circle cx="${p2}" cy="213" r="17" fill="#457fca"/>`+text(p2,220,'2','#fff',19,'middle')+`<line x1="${p2}" y1="154" x2="${p2}" y2="196" stroke="#457fca" stroke-width="3"/>`;
 let caption=two&&q.kind!=='compare'?`Расстояние между участниками: ${M.F(g.distance)} км`:q.kind==='compare'?`За ${M.F(t)} ч: по течению ${M.F(q.v1*t)} км; против течения ${M.F(q.v2*t)} км`:`Пройденный путь: ${M.F(g.distance)} км`;
 if(q.kind==='trip')caption+=t>q.turn?' · обратно':' · туда';
 body+=text(400,274,caption,'#20342f',21,'middle');if(q.kind==='compare')body+=text(400,301,'Две отдельные поездки: по течению → и против течения ←.','#61736c',14,'middle');
 el.innerHTML=body;el.setAttribute('aria-label',`${caption}. Прошло ${M.F(t)} ч.`);document.getElementById('sceneReadout').textContent=caption;document.getElementById('clock').textContent=M.F(t)+' ч';document.getElementById('scrub').value=t/q.duration*1000;document.getElementById('play').textContent=playing?'Ⅱ Пауза':'▶ Пуск';
}
function frame(ts){if(!playing||readonly)return;if(lastFrame)state.modelTime=Math.min(item().duration,state.modelTime+(ts-lastFrame)/10000*item().duration);lastFrame=ts;const finished=state.modelTime>=item().duration;if(finished)stop();draw();if(finished)emit('model');else raf=requestAnimationFrame(frame);}
if(!bridge||!C){main.innerHTML='<p role="alert">Не удалось подключить занятие. Обнови страницу кабинета.</p>';return;}
bridge.register({trainerId:'motion-grade6',contentVersion:1,getState,applyState,setReadOnly:readOnly,subscribe(fn){notify=fn;return()=>{notify=()=>{};};}});
})(window);
