(function(){
'use strict';
if(!window.MathExamRemediationManaged||!window.MathExamLearning?.register)return;
const api=window.MathExamRemediation,D=window.DivisionLab,C=window.DivisionCourse,M=window.MultiplicationColumn,N=window.ArithmeticCourse,local=window.MathExamDivisionCourseLocal===true,host=document.getElementById('learning-remediation-root');
const clone=x=>JSON.parse(JSON.stringify(x));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let spec=null,state=null,readOnly=true,notify=()=>{};
let nestedHelp=null,helpIdentity='',helpRoot=null,helpLevel=0,fallbackHelpOpen=false,toolsOpen=false,notesOpen=false;
const $=id=>host.querySelector('#'+id);
function send(kind,details={}){if(!spec||readOnly)return;notify({kind,details,state:clone(state)});}
function blankFeedback(){return {kind:'none',scope:spec.steps.length?'step':'practice',step:state.step,answer:''};}
function raw(){return state.view==='learn'?(state.lessonAnswers[state.lessonIndex]||''):state.answer;}
function active(){return state.view==='learn'?spec.lessons[state.lessonIndex]?.question:spec.steps.length?spec.steps[state.step]:(spec.items[state.step]||spec.task);}
function arithmeticTraining(){return spec.family==='division'||spec.family==='multiplication'||!!N?.trackFor(spec.contentId);}
function track(){return N?.trackFor(spec?.contentId);}
function courseLabel(){const t=track(),i=t?.stages.findIndex(s=>s.id===spec.contentId);return t?t.title+' · шаг '+(i+1)+' из '+t.stages.length:courseStage()?'Деление уголком · ступень '+courseStage().order+' из '+C.stages.length:'Ликбез · сохранённая попытка';}
function courseStage(){return C?.stages.find(stage=>stage.id===spec?.contentId);}
function displayText(value){return M?.has(spec?.contentId)?M.displayText(value):String(value??'');}
function simpleQuestion(q, scope, step, answer) { const simple=window.LearningScaffolds?.present?.(spec,q,{scope,step,answer}); if(simple)return {...simple,prompt:displayText(simple.prompt),hint:displayText(simple.hint),error:displayText(simple.error)}; if((courseStage()||M?.has(spec?.contentId))&&scope==='step'&&q)return {prompt:displayText(q.prompt),hint:displayText(q.hint),error:displayText(q.error||'Проверь вычисление. Если трудно, открой подсказку.')}; return null; }
function shownLesson(index) { const lesson=window.LearningScaffolds?.lesson?.(spec,index)||spec.lessons[index];if(!lesson||!M?.has(spec?.contentId))return lesson;return {...lesson,title:displayText(lesson.title),lead:displayText(lesson.lead),html:displayText(lesson.html),short:displayText(lesson.short),question:lesson.question?{...lesson.question,prompt:displayText(lesson.question.prompt),hint:displayText(lesson.question.hint)}:null}; }
function shownTitle() { return spec.contentId==='multiplication-division/long-division-quotient-digit'?'Деление: подбираем одну цифру':spec.title; }
function estimationTrail(){
 if((spec.contentId!=='multiplication-division/quotient-estimate'&&(!courseStage()||spec.divisionTask))||!state.answers.length)return '';
 return '<div class="lm-estimate-trail" aria-label="Уже сделали">'+spec.steps.slice(0,state.answers.length).map((q,i)=>'<p class="'+(i===state.answers.length-1?'lm-estimate-last':'')+'"><span aria-hidden="true">✓ </span>'+esc(q.record||q.prompt+' '+state.answers[i])+'</p>').join('')+'</div>';
}
function divisionSegment(){return spec.divisionTasks.find(t=>state.step<t.endIndex)||spec.divisionTasks.at(-1)||null;}
function answerDisplay(q){const x=q.answer;if(q.kind==='choice')return q.options.find(o=>o.id===String(x))?.html||esc(x);if(x&&typeof x==='object')return '<span class="lm-fraction"><span>'+esc(x.n)+'</span><span>'+esc(x.d)+'</span></span>';return esc(x);}
function input(value){if(readOnly)return;if(state.view==='learn'){while(state.lessonAnswers.length<=state.lessonIndex)state.lessonAnswers.push('');state.lessonAnswers[state.lessonIndex]=value;}else state.answer=value;send('input',{scope:state.view==='learn'?'lesson':spec.steps.length?'step':'practice',step:state.view==='learn'?state.lessonIndex:state.step});}
function check(){
 if(readOnly||!raw().trim()||!active())return;
 const scope=state.view==='learn'?'lesson':spec.steps.length?'step':'practice',step=scope==='lesson'?state.lessonIndex:state.step,answer=raw();
 const details={scope,step,answer,answers:state.answers.slice()},result=api.evaluate(spec,details);
 state.feedback={kind:result.correct?'correct':'incorrect',scope,step,answer};
 if(result.correct){if(scope==='lesson'){while(state.lessonChecked.length<=step)state.lessonChecked.push(false);state.lessonChecked[step]=true;}else{state.answers.push(answer);state.step=state.answers.length;state.answer='';state.completed=result.complete;}}
 send('check',details);render(true);
}
function markHelp(level){
 if(readOnly)return;
 state.hint=Math.max(state.hint,level);
 state.feedback={kind:level===3?'solution':'hint',scope:state.view==='learn'?'lesson':spec.steps.length?'step':'practice',step:state.view==='learn'?state.lessonIndex:state.step,answer:''};
 send('hint',{level,scope:state.feedback.scope,step:state.feedback.step});
}
function help(level){if(readOnly)return;markHelp(level);fallbackHelpOpen=true;render();nestedHelp?.open();}
function currentHelp(){
 const scope=state.view==='learn'?'lesson':spec.steps.length?'step':'practice',step=state.view==='learn'?state.lessonIndex:state.step;
 return ['hint','solution'].includes(state.feedback.kind)&&state.feedback.scope===scope&&state.feedback.step===step;
}
function populateHelp(){
 if(!helpRoot)return;
 const output=helpRoot.querySelector('.lm-current-help');
 if(output)output.innerHTML=currentHelp()?feedback():helpLevel?feedback({kind:helpLevel===3?'solution':'hint',scope:state.view==='learn'?'lesson':spec.steps.length?'step':'practice',step:state.view==='learn'?state.lessonIndex:state.step,answer:''}):'';
 // Reveal only the current step's visual, without remounting the answer field.
 const current=host.querySelector('.lm-course-visual');
 if(current&&courseVisual())current.outerHTML=courseVisual();
}
function useHelp(){
 if(readOnly)return;
 if(!currentHelp())markHelp(2);
 helpLevel=state.feedback.kind==='solution'?3:2;
 populateHelp();
}
function helpActions(){return '<div class="lm-actions"><button id="lm-hint"'+(readOnly?' disabled':'')+'>Подсказка к этому действию</button><button id="lm-solution"'+(readOnly?' disabled':'')+'>Разобрать этот шаг</button></div>';}
function mountHelp(){
 const slot=$('lm-help-slot');if(!slot){nestedHelp?.close();return;}
 const id=JSON.stringify([spec.contentId,spec.seed,spec.generatorVersion,state.view,state.view==='learn'?state.lessonIndex:state.step,active()?.prompt]);
 if(helpIdentity!==id){helpIdentity=id;fallbackHelpOpen=currentHelp();helpLevel=0;}
 if(currentHelp())helpLevel=state.feedback.kind==='solution'?3:2;
 helpRoot=document.createElement('div');helpRoot.className='lm-help-root';
 helpRoot.innerHTML='<div class="lm-current-help"></div>'+helpActions()+multiplicationSupport();
 if(helpLevel&&!readOnly)populateHelp();
 const bind=()=>{helpRoot.querySelector('#lm-hint').onclick=()=>help(2);helpRoot.querySelector('#lm-solution').onclick=()=>help(3);};
 bind();
 if(window.MathExamBasicsHelp){
  nestedHelp||=window.MathExamBasicsHelp.create();
  nestedHelp.update({host:slot,identity:id,contentId:spec.contentId,context:{prompt:active()?.prompt||spec.task?.prompt||'',kind:active()?.kind||'',question:active()},rootContent:helpRoot,onUse:useHelp,disabled:readOnly});
  if(fallbackHelpOpen&&!readOnly){fallbackHelpOpen=false;nestedHelp.open();}
 }else{
  // A missing optional help module must not block a saved task.
  const disclosure=document.createElement('details');disclosure.className='lm-help-fallback';disclosure.open=fallbackHelpOpen;
  const summary=document.createElement('summary');summary.textContent='Нужна помощь?';
  disclosure.append(summary,helpRoot);slot.append(disclosure);
  disclosure.addEventListener('toggle',()=>{if(!disclosure.isConnected)return;fallbackHelpOpen=disclosure.open;if(disclosure.open&&!readOnly)useHelp();});
  if(readOnly){summary.setAttribute('aria-disabled','true');summary.onclick=e=>e.preventDefault();}
 }
}

function go(view,index){if(readOnly)return;state.view=view;if(index!==undefined)state.lessonIndex=index;state.feedback=blankFeedback();if(view==='learn'){state.hint=Math.max(state.hint,2);send('hint',{level:2,scope:'lesson',step:state.lessonIndex});}else send('navigate',{view});render();}
function gridNumber(value,end,cls,columns,hasComma,intLen){const text=String(value),start=end-text.length+1;return '<div class="lm-number '+cls+'" style="--cols:'+columns+(hasComma?';grid-template-columns:repeat('+intLen+',1ch) .35ch repeat('+(columns-intLen-1)+',1ch)':'')+'">'+Array.from(text).map((digit,i)=>'<span style="grid-column:'+(start+i+1+(hasComma&&start+i>=intLen?1:0))+'">'+esc(digit)+'</span>').join('')+'</div>';}
function board(){
 if(M?.has(spec.contentId))return M.board(spec,state);
 if(!spec.divisionTask)return '';
 const segment=divisionSegment(),p=D.plan(segment?segment.task:spec.divisionTask),step=state.step-(segment?segment.startIndex:0);
 if(step<p.normalizationEnd){const divisor=p.actions.findIndex(a=>a.kind==='shift-divisor'),dividend=p.actions.findIndex(a=>a.kind==='shift-dividend');return '<div class="lm-normalize"><div>Число, которое делим<br><strong>'+esc(p.task.dividend)+' → '+(step>dividend?esc(p.normalizedDividend):'?')+'</strong></div><div>Число, на которое делим<br><strong>'+esc(p.task.divisor)+' → '+(step>divisor?esc(p.normalizedDivisor):'?')+'</strong></div></div>';}
 let visible=p.originalLength;for(const a of p.actions.slice(0,step))if(a.kind==='bring')visible=Math.max(visible,a.sourceIndex+1);
 const hasComma=visible>p.intLen,columns=visible+(hasComma?1:0),a=p.actions[step],activeIndex=a?.sourceIndex??(a?.cycle!==undefined?p.cycles[a.cycle].sourceIndex:-1);
 let rows='<div class="lm-number" style="--cols:'+columns+(hasComma?';grid-template-columns:repeat('+p.intLen+',1ch) .35ch repeat('+(columns-p.intLen-1)+',1ch)':'')+'">';
 for(let i=0;i<visible;i++){if(hasComma&&i===p.intLen)rows+='<span>,</span>';rows+='<span class="'+(i===activeIndex||(courseStage()&&((a?.kind==='start'&&i<=a.sourceIndex)||(a?.cycle===0&&i<=p.cycles[0].sourceIndex)))?'active':'')+'">'+p.digits[i]+'</span>';}rows+='</div>';
 for(let i=0;i<p.cycles.length;i++){const c=p.cycles[i];if(i&&step>=c.digitAction)rows+=gridNumber(c.partial,c.sourceIndex,'partial'+(courseStage()&&a?.cycle===i?' lm-current-row':''),columns,hasComma,p.intLen);if(step>c.productAction)rows+=gridNumber(c.product,c.sourceIndex,'product'+(courseStage()&&a?.kind==='subtract'&&a.cycle===i?' lm-current-row':''),columns,hasComma,p.intLen);if(step>c.subtractAction)rows+=gridNumber(c.remainder,c.sourceIndex,'remainder'+(courseStage()&&['bring','partial'].includes(a?.kind)&&a.sourceIndex===c.sourceIndex+1?' lm-current-row':''),columns,hasComma,p.intLen);}
 let quotient='';for(const action of p.actions.slice(0,step)){if(action.kind==='digit')quotient+=action.answer;if(action.kind==='comma')quotient+=',';}
 return '<div class="lm-division-scroll"><div class="lm-division" aria-label="Уголок: выполненные действия"><div class="lm-working">'+rows+'</div><div><div class="lm-divisor">'+esc(p.normalizedDivisor)+'</div><div class="lm-quotient">'+esc(quotient||'?')+'</div></div></div></div>';
}
function courseVisual(){
 const q=active(),v=q?.visual;if(!courseStage()||!v||!['first','bring'].includes(v.kind))return '';
 const helped=['hint','solution'].includes(state.feedback.kind)&&state.feedback.step===state.step;
 const strip=Array.from(v.digits).map((digit,i)=>'<span class="'+((v.kind==='bring'?i===v.sourceIndex:helped?i<=v.sourceIndex:i===0)?'active':'')+'">'+esc(digit)+'</span>').join('');
 return '<div class="lm-course-visual"><p>'+(v.kind==='first'?'Начни с цифры слева.':'Следующая цифра выделена. Перенеси только её.')+'</p><div class="lm-course-digits" aria-label="Число '+esc(v.digits)+', делим на '+esc(v.divisor)+'">'+strip+'<span class="lm-course-divisor">: '+esc(v.divisor)+'</span></div>'+(v.kind==='bring'?'<p>После вычитания осталось: <strong>'+esc(v.remainder)+'</strong></p>':'')+'</div>';
}
function courseCue(){
 const stage=courseStage();if(M?.has(spec.contentId))return active()?'<p class="lm-course-cue"><strong>Сейчас: '+esc(displayText(active().cue||'Заполни выделенную клетку'))+'</strong></p>':'';if(!stage)return '';
 if(stage.guidance==='check')return '<p class="lm-course-cue">Реши уголком на доске или в тетради. Затем впиши ответ. Здесь три разных примера. Подсказку можно открыть, но она будет учтена.</p>';
 const q=active(),labels={start:'Выбери начало',digit:'Подбери одну цифру',product:'Умножь',subtract:'Вычти',bring:'Перенеси одну цифру',partial:'Прочитай новое число',comma:'Поставь запятую',answer:'Прочитай ответ',verify:'Проверь',round:'Округли',estimate:'Прикинь'};
 return q?'<p class="lm-course-cue"><strong>Сейчас: '+esc(labels[q.kind]||'Одно действие')+'</strong></p>':'';
}
function courseFooter(){
 const t=track(),stage=t?.stages.find(s=>s.id===spec.contentId)||courseStage();if(!stage)return '';
 const stages=t?.stages||C.stages,next=stages[stages.indexOf(stage)+1];
 const href=local?(next?next.id.split('/').at(-1)+'.html':'division-course.html'):'/learning/#division-course';
 return '<div class="lm-course-footer"><p>'+(next?'Когда станет легко, переходи дальше.':'Трудные шаги можно повторять.')+'</p><a href="'+href+'"'+(local?'':' target="_parent"')+'>'+(local&&next?'Следующий шаг: '+esc(next.title):'К двум маршрутам →')+'</a></div>';
}
function multiplicationSupport(){
 if(!local||readOnly||state.completed)return '';
 const links=window.MultiplicationSupport?.forStep(spec,state)||[];if(!links.length)return '';
 return '<aside class="lm-multiplication-support" aria-label="Потренировать умножение"><strong>Трудно умножить?</strong><p>Открой короткую тренировку, затем вернись к этому примеру.</p><div class="lm-actions">'+links.map(link=>'<a class="button" href="'+esc(link.url)+'" target="_blank" rel="noopener">'+esc(link.title)+' ↗</a>').join('')+'</div></aside>';
}
function feedback(f=state.feedback){
 if(f.kind==='none')return '';
 const q=f.scope==='lesson'?shownLesson(f.step)?.question:f.scope==='step'?spec.steps[f.step]:(spec.items[f.step]||spec.task);if(!q)return '';
 const simple=simpleQuestion(q,f.scope,f.step,f.answer);
 let html='';
 if(f.kind==='correct')html=f.scope==='lesson'?(q.good||'Верно. Можно перейти к следующему объяснению.'):state.completed?(arithmeticTraining()?'Верно. Можно тренироваться сколько нужно.':'Задание завершено. Для самостоятельного повторения возьмите новое условие.'):'Верно. Продолжаем со следующего действия.';
 if(f.kind==='incorrect'){
  let diagnosis=q.error||q.bad||'Проверьте ответ и попробуйте ещё раз.';
  if(q.traps){const n=Number(f.answer.trim().replace(',','.')),trap=q.traps.find(t=>Math.abs(t.v-n)<1e-9);if(trap)diagnosis=trap.msg;}
  if(q.wrong&&q.wrong[f.answer])diagnosis=q.wrong[f.answer];
  if(q.strict&&api.equal(f.answer,q.answer,false))diagnosis='Значение верное. Запишите полностью сокращённую дробь через /.';
  html=(simple?'<strong>Попробуй ещё раз.</strong> ':'<strong>Пока не совпало.</strong> ')+(simple?esc(simple.error):diagnosis);
 }
 if(f.kind==='hint'){
  const first=simple?.hint||q.hint||q.hint1||spec.rule||'Вернитесь к короткому объяснению темы.';
  html='<strong>Подсказка.</strong> '+first+(!simple&&q.hint2&&q.hint2!==first?'<p>'+q.hint2+'</p>':'');
 }
 if(f.kind==='hint'||f.kind==='solution'){
  const scaffold=window.LearningScaffolds?.render(spec,q,{scope:f.scope,step:f.step,level:f.kind==='solution'?3:2})||'';
  if(f.kind==='hint'){if(simple&&scaffold)html=scaffold;else html+=scaffold;}
  else html='<strong>Разбор по шагам.</strong>'+scaffold+'<p>'+(simple?('На этом шаге запиши: '+answerDisplay(q)+'.'):q.solution||('Ответ к действию: '+answerDisplay(q)+'. '+(q.hint||q.hint2||'')))+'</p><div class="lm-muted">Эта помощь сохраняется в истории. После разбора попробуйте новое условие самостоятельно.</div>';
 }
 return '<div class="lm-feedback '+f.kind+'" role="status">'+displayText(html)+'</div>';
}
function controls(q){
 if(!q)return '';
 const disabled=readOnly?' disabled':'';
 if(q.kind==='choice')return '<div class="lm-choices">'+q.options.map(o=>'<button type="button" data-choice="'+esc(o.id)+'" class="'+(raw()===o.id?'lm-selected':'')+'" aria-pressed="'+(raw()===o.id)+'"'+disabled+'>'+o.html+'</button>').join('')+'</div><button class="lm-primary" id="lm-check"'+disabled+'>Проверить</button>';
 const singleDigit=state.view!=='learn'&&q.kind==='digit';
 return '<div class="lm-answer-row"><input id="lm-answer" class="lm-answer" inputmode="'+(singleDigit?'numeric':'decimal')+'" autocomplete="off" maxlength="4000" aria-label="'+(singleDigit?'Одна цифра от 0 до 9':'Ваш ответ')+'" placeholder="'+(singleDigit?'Одна цифра':'Ваш ответ')+'" value="'+esc(raw())+'"'+disabled+'><span>'+esc(q.unit||'')+'</span><button type="button" class="lm-primary" id="lm-check"'+disabled+'>Проверить</button></div>';
}
function render(focus){
 if(!spec)return;
 const previous=host.contains(document.activeElement)?{node:document.activeElement,id:document.activeElement.id,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
 host.classList.toggle('lm-simple-division',spec.family==='division');
 host.classList.toggle('lm-arithmetic',spec.contentId.startsWith('multiplication-division/'));
 host.classList.toggle('lm-task-first',true);
 const training=arithmeticTraining(),exampleCount=spec.divisionTasks.length||spec.items.length||1;
 const nextLabel=training?(exampleCount>1?'Ещё '+exampleCount+' примера →':'Следующий пример →'):'Новое условие →';
 const learn=state.view==='learn',lesson=shownLesson(state.lessonIndex),q=learn?lesson?.question:active(),done=state.completed&&!learn,disabled=readOnly?' disabled':'',segment=divisionSegment(),practice=segment||spec.items[Math.min(state.step,spec.items.length-1)]||spec.task;
 const staticObservation=readOnly&&!window.MathExamBasicsHelp;
 const helpSlot=!done?'<div id="lm-help-slot" class="lm-help-slot">'+(staticObservation?'<button disabled>Нужна помощь?</button><div hidden>'+helpActions()+'</div>':'')+'</div>':'';
 const plainFeedback=readOnly?feedback():['hint','solution'].includes(state.feedback.kind)?'':feedback();
 let content='';
 if(learn&&lesson){
  content='<div class="lm-label">Объяснение · '+(state.lessonIndex+1)+' из '+spec.lessons.length+'</div><h2>'+esc(lesson.title)+'</h2><p>'+lesson.lead+'</p><div class="lm-lesson">'+lesson.html+'</div>'+(q?'<div class="lm-prompt">'+q.prompt+'</div>':'')+helpSlot+controls(q)+plainFeedback+'<div class="lm-actions"><button id="lm-prev"'+(readOnly||!state.lessonIndex?' disabled':'')+'>← Назад</button><button id="lm-next-lesson"'+disabled+'>'+(state.lessonIndex===spec.lessons.length-1?'К заданию →':'Дальше →')+'</button></div>';
 }else{
  const label=spec.steps.length?(segment?'Пример '+(spec.divisionTasks.indexOf(segment)+1)+' из '+spec.divisionTasks.length+' · ':'')+'Действие '+Math.min(state.step-(segment?segment.startIndex:0)+1,segment?segment.endIndex-segment.startIndex:spec.steps.length)+' из '+(segment?segment.endIndex-segment.startIndex:spec.steps.length):spec.items.length?'Задание '+Math.min(state.step+1,spec.items.length)+' из '+spec.items.length:'Ваше задание';
  content='<div class="lm-label">'+label+'</div><div class="lm-task-heading"><div class="lm-prompt">'+practice.prompt+'</div>'+helpSlot+'</div>'+board()+(!done?courseVisual()+courseCue():'')+estimationTrail()+(spec.steps.length||spec.items.length?'<progress value="'+state.step+'" max="'+(spec.steps.length||spec.items.length)+'" aria-label="Пройденные действия"></progress>':'');
  if(done){
   content+='<h2>'+(training?(exampleCount===1?'Пример решён':'Все '+exampleCount+' примера решены'):(spec.divisionTasks.length?(spec.divisionTasks.length===1?'Пример завершён':'Все '+spec.divisionTasks.length+' примера завершены'):spec.items.length?'Все '+spec.items.length+' заданий проверены':'Задание завершено'))+'</h2>'+plainFeedback+'<div class="lm-actions"><button class="lm-primary lm-next-example" id="lm-new"'+disabled+'>'+nextLabel+'</button></div>';
  }else content+=(spec.steps.length?'<div class="lm-prompt">'+esc(simpleQuestion(q,'step',state.step)?.prompt||q.prompt)+'</div>':'')+controls(q)+plainFeedback;
  if(state.answers.length&&spec.contentId!=='multiplication-division/quotient-estimate'&&!courseStage())content+='<section class="lm-accepted-work" aria-label="Выполненные действия"><h2>Уже сделали</h2><div class="lm-worklog">'+state.answers.map((a,i)=>'<p>'+(spec.steps.length?(spec.divisionTasks.length&&i===spec.divisionTasks[spec.steps[i].taskIndex].startIndex?'<strong>Пример '+(spec.steps[i].taskIndex+1)+': '+esc(spec.divisionTasks[spec.steps[i].taskIndex].prompt)+'</strong><br>':'')+esc(simpleQuestion(spec.steps[i],'step',i)?.prompt||spec.steps[i].prompt)+'<br>':spec.items.length?spec.items[i].prompt+'<br>':'')+'<strong>'+esc(a)+'</strong></p>').join('')+'</div></section>';
  if(done)content+=courseFooter();
 }
 const nav='<div class="lm-nav"><button id="lm-practice" class="'+(!learn?'lm-selected':'')+'"'+disabled+'>'+(training?'Тренировка':'Моё задание')+'</button>'+(spec.lessons.length?'<button id="lm-learn" class="'+(learn?'lm-selected':'')+'"'+disabled+'>'+(courseStage()?'Покажи на примере':'Разобраться')+'</button>':'')+(spec.rule?'<button id="lm-rule"'+disabled+'>'+(courseStage()?'Памятка':'Правило темы')+'</button>':'')+'</div>';
 const reference=state.referenceOpen?'<div class="lm-reference">'+(spec.contentId==='multiplication-division/long-division-quotient-digit'?'Умножай на цифры от 0 до 9. Получилось больше нашего числа — цифра не подходит. Из остальных результатов бери самый большой. Ровно столько же — тоже подходит.':displayText(spec.rule))+'</div>':'';
 const rail=learn?'<div class="lm-rail">'+spec.lessons.map((l,i)=>'<button data-lesson="'+i+'" class="'+(state.lessonIndex===i?'lm-selected':'')+'"'+disabled+'>'+(state.lessonChecked[i]?'✓ ':'')+esc(shownLesson(i).short)+'</button>').join('')+'</div>':'';
 host.innerHTML='<div class="lm-header"><div><h1>'+esc(shownTitle())+'</h1></div></div>'+(readOnly?'<p class="lm-readonly-note">Наблюдение. Вы видите текущую работу. Управление включается на доске преподавателя.</p>':'')+'<div class="lm-layout"><section class="lm-card">'+content+'</section></div><details id="lm-tools" class="lm-secondary"'+(toolsOpen||state.referenceOpen?' open':'')+'><summary>Тема и другие действия</summary><div class="lm-label">'+courseLabel()+'</div>'+nav+reference+rail+(!done?'<div class="lm-actions"><button id="lm-new"'+disabled+'>Запросить другое условие</button></div>':'')+'</details><details id="lm-notes" class="lm-secondary"'+(notesOpen?' open':'')+'><summary>Мои записи</summary><p class="lm-muted">'+(local?'Записи сохраняются в этом браузере.':'Можно записать вычисления или вопрос. Преподаватель увидит их.')+'</p><label for="lm-note">Заметки к решению</label><textarea id="lm-note" class="lm-note" maxlength="4000"'+(readOnly?' readonly':'')+'>'+esc(state.note)+'</textarea></details>';
 // Without the optional helper, an observer needs only the serialized view.
 if(staticObservation)return;
 mountHelp();
 const tools=$('lm-tools'),notes=$('lm-notes');
 tools.addEventListener('toggle',()=>{if(tools.isConnected)toolsOpen=tools.open;});
 notes.addEventListener('toggle',()=>{if(notes.isConnected)notesOpen=notes.open;});
 if(readOnly)return;
 if($('lm-check'))$('lm-check').onclick=check;
 if($('lm-answer')){$('lm-answer').oninput=e=>input(e.target.value);$('lm-answer').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();check();}};}
 host.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{input(b.dataset.choice);host.querySelectorAll('[data-choice]').forEach(x=>{x.classList.toggle('lm-selected',x===b);x.setAttribute('aria-pressed',String(x===b));});});
 $('lm-note').oninput=e=>{state.note=e.target.value;send('input',{scope:'note'});};
 $('lm-practice').onclick=()=>go('practice');if($('lm-learn'))$('lm-learn').onclick=()=>go('learn');
 if($('lm-rule'))$('lm-rule').onclick=()=>{state.referenceOpen=!state.referenceOpen;if(state.referenceOpen){state.hint=Math.max(state.hint,2);send('hint',{level:2,scope:'rule'});}else send('navigate',{referenceOpen:false});render();};
 if($('lm-new'))$('lm-new').onclick=()=>{const button=$('lm-new');button.textContent=training?'Готовим следующий пример…':'Запрашиваем новое условие…';button.disabled=true;send('new-task',{contentId:spec.contentId});};
 if($('lm-prev'))$('lm-prev').onclick=()=>go('learn',state.lessonIndex-1);
 if($('lm-next-lesson'))$('lm-next-lesson').onclick=()=>state.lessonIndex===spec.lessons.length-1?go('practice'):go('learn',state.lessonIndex+1);
 host.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>go('learn',Number(b.dataset.lesson)));
 const target=focus?($('lm-answer')||(done&&training?$('lm-new'):null)):previous?.node.isConnected?previous.node:previous?.id?$(previous.id):null;if(target){target.focus({preventScroll:true});if(previous&&target.id===previous.id&&typeof target.setSelectionRange==='function')target.setSelectionRange(previous.start,previous.end);}
}
window.addEventListener?.('mathexam-basics-help-ready',()=>{if(spec&&window.MathExamBasicsHelp)render();});
window.MathExamLearning.register({trainerId:'oge-basics',contentVersion:1,getState:()=>state?clone(state):null,subscribe:callback=>{notify=callback;return()=>{notify=()=>{};};},applyState:payload=>{
 const canonical=api.create(payload.taskSpec.contentId,payload.taskSpec.seed,{generatorVersion:payload.taskSpec.generatorVersion||1}).taskSpec;
 // The account server adds this fixed identity envelope to every saved task.
 // Reconstruct it before the exact comparison; all authored content still matches.
 canonical.trainerId='oge-basics';canonical.id=canonical.contentId;
 if(JSON.stringify(canonical)!==JSON.stringify(payload.taskSpec))throw Error('Условие отличается от сохранённой версии тренажёра.');
 spec=canonical;state=api.normalize(spec,payload.state);readOnly=payload.readOnly===true;render();
}});
})();
