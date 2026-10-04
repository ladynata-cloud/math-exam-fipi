(function(){
 'use strict';
 if(window.MathExamRemediationManaged)return;
 const D=window.DivisionLab,$=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let state=D.blank(),lastRaw=null,blocked=false,currentPlan=null,feedback='',feedbackKind='',help='';
 function warn(message){$('notice').textContent=message;$('raw').hidden=!blocked;}
 try{lastRaw=localStorage.getItem(D.KEY);if(lastRaw)state=D.validate(JSON.parse(lastRaw));}catch(e){blocked=true;warn('Прежнюю запись не удалось прочитать. Она не перезаписана. Скачай исходную запись или восстанови корректную копию.');}
 function save(){if(blocked)return;try{if(localStorage.getItem(D.KEY)!==lastRaw){blocked=true;warn('Запись изменилась в другой вкладке. Обнови страницу, чтобы продолжить с актуальными данными. Текущую работу можно скачать копией.');return;}const raw=JSON.stringify(state);localStorage.setItem(D.KEY,raw);lastRaw=raw;}catch(e){blocked=true;warn('Браузер не сохранил работу. Скачай копию прогресса перед закрытием страницы.');}}
 const names={'shift-count':'Находим число разрядов','shift-factor':'Сохраняем частное','shift-divisor':'Изменяем делитель','shift-dividend':'Изменяем делимое',start:'Выбираем первый блок',digit:'Записываем цифру частного',product:'Умножаем',subtract:'Вычитаем',comma:'Ставим запятую',bring:'Сносим одну цифру',partial:'Получаем новый блок',answer:'Читаем частное','final-remainder':'Записываем остаток',verify:'Проверяем обратным действием'};
 const modeNames={learn:'Разбор с объяснениями',practice:'Тренировка по шагам',check:'Самостоятельная проверка по шагам'};
 function focusAnswer(){const input=$('answer'),stage=input.closest('.stage'),box=input.getBoundingClientRect();if(box.bottom>innerHeight-20||stage.getBoundingClientRect().top<0)stage.scrollIntoView({block:'center'});input.focus({preventScroll:true});}
 $('level').innerHTML=Object.entries(D.levels).map(([id,l])=>'<option value="'+id+'">'+esc(l.title)+'</option>').join('');
 const requested=location.hash.slice(1);$('level').value=state.session?state.session.task.level:Object.hasOwn(D.levels,requested)?requested:'oneDigit';
 function updateIdea(){$('idea').textContent=D.levels[$('level').value].idea;}
 function start(mode){
  if(state.records.length>=1000||state.seen.length>=3000){warn('Достигнут предел этой записи. Скачай копию прогресса и отчёт, затем явно начни новую запись. Сохранённые результаты не удалены.');return;}
  const level=$('level').value;let task,tries=0,seed=mode==='learn'?0:state.sequence;
  do{task=D.make(level,seed);if(mode!=='check'||!state.seen.includes(D.fingerprint(task)))break;seed=seed%999999+1;}while(++tries<500);
  if(mode!=='learn')state.sequence=seed%999999+1;
  const repeated=state.seen.includes(D.fingerprint(task));if(!repeated)state.seen.push(D.fingerprint(task));
  state.session={task,mode,step:0,errors:0,hints:0,reveals:0,repeated,input:''};feedback='';help='';save();render();$('workspace').scrollIntoView({block:'start'});focusAnswer();
 }
 function rowStyle(columns,hasComma,intLen){return '--cols:'+columns+(hasComma?';grid-template-columns:repeat('+intLen+',1ch) .35ch repeat('+(columns-intLen-1)+',1ch)':'');}
 function gridNumber(value,end,cls,columns,hasComma,intLen){const text=String(value),start=end-text.length+1;return '<div class="number-row '+cls+'" style="'+rowStyle(columns,hasComma,intLen)+'">'+Array.from(text).map((digit,i)=>{const index=start+i,column=index+1+(hasComma&&index>=intLen?1:0);return '<span style="grid-column:'+column+'">'+esc(digit)+'</span>';}).join('')+'</div>';}
 function board(p,s){
  if(s.step<p.normalizationEnd){const divisorAction=p.actions.findIndex(a=>a.kind==='shift-divisor'),dividendAction=p.actions.findIndex(a=>a.kind==='shift-dividend');return '<div class="normalization"><p>Делитель<br><strong>'+esc(p.task.divisor)+' → '+(s.step>divisorAction?esc(p.normalizedDivisor):'?')+'</strong></p><p>Делимое<br><strong>'+esc(p.task.dividend)+' → '+(s.step>dividendAction?esc(p.normalizedDividend):'?')+'</strong></p></div><p class="board-note">Чтобы частное сохранилось, одинаково изменяем оба числа.</p>';}
  let visible=p.originalLength;for(const a of p.actions.slice(0,s.step))if(a.kind==='bring')visible=Math.max(visible,a.sourceIndex+1);
  const hasComma=visible>p.intLen,columns=visible+(hasComma?1:0),active=p.actions[s.step],activeIndex=active?.sourceIndex??(active?.cycle!==undefined?p.cycles[active.cycle].sourceIndex:-1);
  let rows='<div class="number-row" style="'+rowStyle(columns,hasComma,p.intLen)+'">';for(let i=0;i<visible;i++){if(hasComma&&i===p.intLen)rows+='<span>,</span>';rows+='<span class="'+(i===activeIndex?'active':i<activeIndex?'used':'')+'">'+p.digits[i]+'</span>';}rows+='</div>';
  for(let i=0;i<p.cycles.length;i++){const c=p.cycles[i],end=c.sourceIndex;if(i&&s.step>=c.digitAction)rows+=gridNumber(c.partial,end,'partial',columns,hasComma,p.intLen);if(s.step>c.productAction)rows+=gridNumber(c.product,end,'product',columns,hasComma,p.intLen);if(s.step>c.subtractAction)rows+=gridNumber(c.remainder,end,'remainder',columns,hasComma,p.intLen);}
  let q='';for(const a of p.actions.slice(0,s.step)){if(a.kind==='digit')q+=a.answer;if(a.kind==='comma')q+=',';}
  return '<div class="division-scroll"><div class="division" aria-label="Заполненные строки деления"><div class="working">'+rows+'</div><div class="right-side"><div class="divisor">'+p.normalizedDivisor+'</div><div class="quotient">'+esc(q||'?')+'</div></div></div></div><p class="board-note">'+(s.step===p.actions.length?'Все строки уголка заполнены твоими ответами.':'Строки появляются после твоих ответов. Выделена текущая цифра делимого.')+'</p>';
 }
 function renderStats(){
  const independent=state.records.filter(r=>r.independent).length,helped=state.records.filter(r=>r.errors||r.hints||r.reveals).length;
  $('stats').innerHTML='<div class="stat"><strong>'+state.records.length+'</strong><span>примеров завершено</span></div><div class="stat"><strong>'+independent+'</strong><span>новых проверок без ошибок и помощи</span></div><div class="stat"><strong>'+helped+'</strong><span>примеров с исправлениями или помощью</span></div>';
  $('history').innerHTML=state.records.slice(-8).reverse().map(r=>'<div class="history-item">'+esc(r.task.dividend+' : '+r.task.divisor)+' · '+(r.independent?'Самостоятельно по шагам':esc(modeNames[r.mode]))+'<small>Ошибок: '+r.errors+' · подсказок: '+r.hints+' · показанных шагов: '+r.reveals+(r.repeated?' · знакомое условие':'')+'</small></div>').join('');
 }
 function render(){
  updateIdea();renderStats();const s=state.session;$('answer-form').hidden=!s;$('help-buttons').hidden=!s;$('next').hidden=true;$('empty').hidden=!!s;
  if(!s){$('problem').textContent='Выбери тему и начни с примера';$('mode').textContent='Сначала понять';$('empty').textContent='В разборе есть объяснение каждого действия. Затем попробуй новое условие и проверку без помощи.';$('board').innerHTML='';$('stage-title').textContent='Все действия выполняешь ты';$('prompt').textContent='Выбор цифры → произведение → разность → снос → новый блок.';$('stage-count').textContent='Готов к началу';$('feedback').textContent='';$('help').textContent='';$('progress').value=0;return;}
  currentPlan=D.plan(s.task);const p=currentPlan,done=s.step===p.actions.length,a=p.actions[s.step];$('problem').textContent=s.task.dividend+' : '+s.task.divisor;$('mode').textContent=modeNames[s.mode]+(s.repeated?' · знакомое условие':'');$('board').innerHTML=board(p,s);$('stage-count').textContent=done?'Все действия выполнены':'Действие '+(s.step+1)+' из '+p.actions.length;$('progress').max=p.actions.length;$('progress').value=s.step;
  $('stage-title').textContent=done?'Пример завершён':names[a.kind];$('prompt').textContent=done?'Ответ: '+p.quotient+(s.task.level==='remainder'?' (остаток '+p.remainder+')':'')+'. '+(s.mode==='check'&&!s.errors&&!s.hints&&!s.reveals&&!s.repeated?'Все действия выполнены с первой попытки без помощи.':'Можно перейти к новому условию и попробовать решить без помощи.'):a.prompt;
  $('answer-form').hidden=done;$('help-buttons').hidden=done;$('next').hidden=!done;$('answer').value=s.input;$('input-note').textContent=a?.kind==='comma'?'Введи целую часть и запятую после неё, например 2,.':'Число можно записать с запятой или точкой. Нажми Enter для проверки.';
  $('feedback').textContent=feedback;$('feedback').className=feedbackKind;$('help').textContent=help||(!done&&s.mode==='learn'?a.hint:'');
 }
 function errorHint(value,a){
  if(a.kind==='digit'&&/^\d+$/.test(value)){const q=Number(value),c=currentPlan.cycles[a.cycle],product=q*currentPlan.normalizedDivisor;if(q>9)return 'Нужна одна цифра от 0 до 9. Цифры частного записываем по очереди.';return product>c.partial?'Получается '+product+', это больше '+c.partial+'. Попробуй меньшую цифру.':'После вычитания остаётся не меньше делителя. Попробуй большую цифру.';}
  return 'Пока не совпало. '+a.hint;
 }
 function submit(event){
  event.preventDefault();const s=state.session;if(!s||s.step===currentPlan.actions.length)return;const a=currentPlan.actions[s.step],value=$('answer').value;s.input=value;
  if(!D.check(value,a)){s.errors=Math.min(100000,s.errors+1);feedback=errorHint(value,a);feedbackKind='error';save();render();focusAnswer();return;}
  s.step++;s.input='';feedback='Верно. '+(s.step===currentPlan.actions.length?'Обратная проверка совпала с исходным делимым.':'Переходим к следующему действию.');feedbackKind='success';help='';
  if(s.step===currentPlan.actions.length)state.records.push({...s,task:{...s.task},finishedAt:Date.now(),independent:s.mode==='check'&&!s.repeated&&!s.errors&&!s.hints&&!s.reveals});
  save();render();if(s.step<currentPlan.actions.length)focusAnswer();
 }
 function download(name,data,raw){const link=document.createElement('a'),url=URL.createObjectURL(new Blob([raw?data:JSON.stringify(data,null,2)],{type:raw?'text/plain':'application/json'}));link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 $('level').onchange=updateIdea;$('learn').onclick=()=>start('learn');$('practice').onclick=()=>start('practice');$('check-mode').onclick=()=>start('check');$('next').onclick=()=>start(state.session.mode==='learn'?'practice':state.session.mode);$('answer-form').onsubmit=submit;
 $('answer').oninput=()=>{if(state.session){state.session.input=$('answer').value;save();}};
 $('hint').onclick=()=>{const s=state.session;s.hints=Math.min(100000,s.hints+1);help=currentPlan.actions[s.step].hint;save();render();};
 $('reveal').onclick=()=>{const s=state.session;s.reveals=Math.min(100000,s.reveals+1);const a=currentPlan.actions[s.step];help='Ответ к этому действию: '+a.answer+'. '+a.hint+' Введи ответ, чтобы продолжить. Пример будет отмечен как решённый с помощью.';save();render();};
 $('backup').onclick=()=>download('MathExam-division-progress.json',state);
 $('raw').onclick=()=>{try{download('MathExam-division-original.txt',localStorage.getItem(D.KEY)||'',true);}catch(e){warn('Браузер не разрешил прочитать исходную запись.');}};
 $('report').onclick=()=>download('MathExam-division-report.json',{schema:'mathexam-division-report',version:1,alias:$('alias').value.trim(),createdAt:Date.now(),independent:state.records.filter(r=>r.independent).length,records:state.records});
 $('import').onclick=()=>{$('file').value='';$('file').click();};
 $('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>2000000)throw Error('Файл больше 2 МБ.');const prepared=D.validate(JSON.parse(await file.text()));if(!confirm('Заменить прогресс только этой лаборатории данными файла? Остальные тренажёры сохранят свои результаты.'))return;lastRaw=localStorage.getItem(D.KEY);state=prepared;blocked=false;feedback='';help='';if(state.session)$('level').value=state.session.task.level;save();if(!blocked)warn('Копия восстановлена.');render();}catch(e){warn('Файл не загружен: '+e.message);}};
 $('reset').onclick=()=>{if(!confirm('Начать новую запись этой лаборатории? Перед заменой можно скачать копию. Результаты других тренажёров не изменятся.'))return;try{lastRaw=localStorage.getItem(D.KEY);state=D.blank();blocked=false;feedback='';help='';save();if(!blocked)warn('Создана новая запись.');render();}catch(e){warn('Не удалось начать новую запись.');}};
 window.addEventListener('storage',e=>{if(e.key===D.KEY||e.key===null){blocked=true;warn('Запись изменилась в другой вкладке. Обнови страницу перед продолжением. Текущую работу можно скачать копией.');}});
 render();
})();
