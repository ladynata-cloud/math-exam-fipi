/* MathExam notebook course: deterministic, bounded board state, standalone progress. */
(function(root){
'use strict';
const data=root.NotebookMathData,models=root.NotebookModels;
const normalize=s=>String(s??'').trim().toLowerCase().replace(/ё/g,'е').replace(/[−–—]/g,'-').replace(/\s+/g,'').replace(/\+∞/g,'∞').replace(/²/g,'^2').replace(/³/g,'^3').replace(/₁/g,'1').replace(/π/g,'pi').replace(/\*/g,'').replace(/,/g,'.');
function number(s){
 if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:\/[+-]?\d+(?:\.\d+)?)?$/.test(s))return null;
 const parts=s.split('/').map(Number),v=parts.length===1?parts[0]:parts[1]!==0?parts[0]/parts[1]:NaN;
 return Number.isFinite(v)?v:null;
}
function equivalent(a,b){
 const x=normalize(a),y=normalize(b);if(!x||!y)return false;if(x===y)return true;
 const p=number(x),q=number(y);
 return p!==null&&q!==null&&Math.abs(p-q)<=1e-10*Math.max(1,Math.abs(q));
}
function matches(value,expected,question=''){
 if(!String(value??'').trim())return false;
 return String(expected).split('|').some(v=>{
  if(equivalent(value,v))return true;
  const a=String(value).trim().replace(/^\{|\}$/g,'').split(';'),b=v.trim().replace(/^\{|\}$/g,'').split(';');
  if(a.length>1&&a.length===b.length&&a.every(s=>number(normalize(s))!==null)&&b.every(s=>number(normalize(s))!==null)){const unordered=/корни через|элементы через|найди (?:a∩b|b∖a|u∖a)/i.test(question)&&! /(?:по|в порядке) возрастания/i.test(question);return unordered?a.map(s=>number(normalize(s))).sort((p,q)=>p-q).every((s,i)=>equivalent(s,b.map(t=>number(normalize(t))).sort((p,q)=>p-q)[i])):a.every((s,i)=>equivalent(s,b[i]));}
  return false;
 });
}
function lessonIndex(id){const i=data.findIndex(l=>l[0]===id);return i<0?0:i;}
function makeState(index=0){const l=data[index]||data[0];return {lesson:l[0],mode:'learn',step:0,task:0,answer:'',feedback:'idle',hint:false,model:models.normalize(l[7],{})};}
function cleanState(x){
 x=x&&typeof x==='object'?x:{};const l=data[lessonIndex(x.lesson)],n=(v,max)=>Number.isInteger(v)?Math.min(max,Math.max(0,v)):0;
 const task=n(x.task,l[6].length-1),answer=typeof x.answer==='string'?x.answer.slice(0,220):'';
 let feedback=['idle','empty','correct','incorrect','reveal'].includes(x.feedback)?x.feedback:'idle';
 if(feedback==='correct'&&!matches(answer,l[6][task][1],l[6][task][0]))feedback='idle';
 return {lesson:l[0],mode:x.mode==='practice'?'practice':'learn',step:n(x.step,l[5].length),task,answer,feedback,hint:x.hint===true,model:models.normalize(l[7],x.model)};
}
root.NotebookMathCore=Object.freeze({normalize,matches,makeState,cleanState,lessonIndex});
if(typeof document==='undefined')return;
if(!Array.isArray(data)||!data.length||!models)throw Error('Notebook course data unavailable');
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const framed=root.parent!==root;
const key='mathexam.notebook-math.v1';
let personal={};if(!framed){try{const v=JSON.parse(localStorage.getItem(key)||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))personal=v;}catch(_){personal={};}}
const initial=new URL(location.href).searchParams.get('lesson');
let state=makeState(lessonIndex(initial)),bridge=null,lastModelKey=null;
if(framed){document.body.classList.add('board-frame');$('progressWrap').hidden=true;}
const current=()=>data[lessonIndex(state.lesson)],task=()=>current()[6][state.task];
const taskKey=(l,i)=>l[0]+':'+i;
const mastered=l=>l[6].every((_,i)=>personal[taskKey(l,i)]===true);
function notify(){bridge?.notifyStateChanged();}
function progress(){
 if(framed){$('progressText').textContent='Общая доска: личный прогресс не изменяется.';return;}
 const total=data.reduce((s,l)=>s+l[6].length,0),done=data.reduce((s,l)=>s+l[6].filter((_,i)=>personal[taskKey(l,i)]===true).length,0);
 $('progressText').textContent='Освоено '+data.filter(mastered).length+' из '+data.length+' тем · '+done+' из '+total+' заданий';
 $('progressBar').style.width=(100*done/total)+'%';
 $('map').querySelectorAll('button[data-lesson]').forEach(b=>b.classList.toggle('complete',mastered(data[lessonIndex(b.dataset.lesson)])));
}
function buildMap(){
 const box=$('map');box.replaceChildren();const groups=new Map();for(const l of data){if(!groups.has(l[1]))groups.set(l[1],[]);groups.get(l[1]).push(l);}
 for(const [name,ls] of groups){const d=el('details',undefined,'map-group'),summary=el('summary',name+' · '+ls.length);d.append(summary);d.open=ls.some(l=>l[0]===state.lesson);
  for(const l of ls){const b=el('button',String(lessonIndex(l[0])+1).padStart(2,'0')+' · '+l[2]);b.type='button';b.dataset.lesson=l[0];b.onclick=()=>{selectLesson(lessonIndex(l[0]));toggleMap(false);};d.append(b);}box.append(d);}
 updateMap();progress();
}
function updateMap(){
 $('map').querySelectorAll('button[data-lesson]').forEach(b=>{const yes=b.dataset.lesson===state.lesson;b.classList.toggle('active',yes);if(yes){b.setAttribute('aria-current','step');b.closest('details').open=true;}else b.removeAttribute('aria-current');});
}
function toggleMap(force){const open=typeof force==='boolean'?force:!$('sidebar').classList.contains('open');$('sidebar').classList.toggle('open',open);$('mapToggle').setAttribute('aria-expanded',String(open));}
function selectLesson(i){if(i<0||i>=data.length)return;state=makeState(i);render(true);notify();}
function renderSteps(){
 const l=current(),box=$('steps');box.replaceChildren();for(let i=0;i<state.step;i++){const s=el('div',undefined,'step');s.append(el('strong','Шаг '+(i+1)+'. '),document.createTextNode(l[5][i]));box.append(s);}
 $('revealStep').disabled=state.step>=l[5].length;$('revealStep').textContent=state.step>=l[5].length?'Разбор завершён':'Следующий шаг ('+(state.step+1)+'/'+l[5].length+')';$('hideSteps').disabled=state.step===0;
}
function renderFeedback(){
 const t=task(),box=$('feedback');box.replaceChildren();
 if(state.hint)box.append(el('p','Подсказка: '+t[2],'hint'));
 if(state.feedback==='empty')box.append(el('p','Сначала введи или выбери ответ.','error'));
 if(state.feedback==='incorrect')box.append(el('p','Пока неверно. Проверь вычисления и формат ответа. Можно открыть подсказку.','error'));
 if(state.feedback==='correct')box.append(el('p','Верно! '+t[3],'success'));
 if(state.feedback==='reveal')box.append(el('p','Разбор: '+t[3],'hint'));
 $('hint').textContent=state.hint?'Скрыть подсказку':'Подсказка';
 $('solution').textContent=state.feedback==='reveal'?'Скрыть решение':'Показать решение';
}
function updateChoices(){
 $('choices').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===state.answer)));
}
const symbols=el('div',undefined,'actions');symbols.setAttribute('aria-label','Математические символы');$('answer').after(symbols);
for(const s of ['−','/',';','∞','∪','∩','√','π','(',')','[',']','{','}']){
 const b=el('button',s);b.type='button';b.setAttribute('aria-label','Вставить '+s);b.onclick=()=>{const a=$('answer'),start=a.selectionStart??a.value.length,end=a.selectionEnd??start;a.setRangeText(s,start,end,'end');a.focus();onInput();};symbols.append(b);
}
function renderPractice(){
 const l=current(),t=task();$('taskMeta').textContent='Задание '+(state.task+1)+' из '+l[6].length;
 $('question').textContent=t[0];$('choices').replaceChildren();
 const hasChoices=Array.isArray(t[4]);$('answer').hidden=hasChoices;$('answerLabel').hidden=hasChoices;symbols.hidden=hasChoices;
 $('answer').maxLength=220;$('answer').value=state.answer;
 $('format').textContent=hasChoices?'Выбери вариант и нажми «Проверить».':'Вводи точный ответ. Дробь: 2/3; несколько значений: 1;2; объединение: ∪. Десятичная запятая допустима.';
 if(hasChoices){for(const choice of t[4]){const b=el('button',choice);b.type='button';b.dataset.value=choice;b.onclick=()=>{state.answer=choice;state.feedback='idle';updateChoices();renderFeedback();notify();};$('choices').append(b);}updateChoices();}
 $('newTask').textContent=state.task+1===l[6].length?'К первому заданию':'Следующее задание';
 renderFeedback();
}
function renderMode(){
 const learning=state.mode==='learn';$('learn').setAttribute('aria-pressed',String(learning));$('practice').setAttribute('aria-pressed',String(!learning));$('learnPanel').hidden=!learning;
}
function renderModel(force){
 const l=current();$('modelPanel').hidden=!l[7];
 if(!l[7]){$('model').replaceChildren();lastModelKey=null;return;}
 if(force||lastModelKey!==l[0]){lastModelKey=l[0];models.mount($('model'),l[7],state.model,m=>{state.model=models.normalize(l[7],m);notify();});}
}
function render(forceModel=false){
 const i=lessonIndex(state.lesson),l=current();
 $('lessonMeta').textContent=l[1]+' · тема '+(i+1)+' из '+data.length;
 $('lessonTitle').textContent=l[2];$('theory').textContent=l[3];$('example').textContent=l[4];
 $('previous').disabled=i===0;$('next').disabled=i===data.length-1;
 renderMode();renderSteps();renderPractice();renderModel(forceModel);updateMap();progress();
}
function onInput(){
 state.answer=$('answer').value.slice(0,220);state.feedback='idle';renderFeedback();notify();
}
$('answer').addEventListener('input',onInput);$('answer').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('check').click();}});
$('check').onclick=()=>{
 const t=task();if(!state.answer.trim())state.feedback='empty';else state.feedback=matches(state.answer,t[1],t[0])?'correct':'incorrect';
 if(!framed&&state.feedback==='correct'){personal[taskKey(current(),state.task)]=true;try{localStorage.setItem(key,JSON.stringify(personal));}catch(_){}progress();}
 renderFeedback();notify();
};
$('hint').onclick=()=>{state.hint=!state.hint;renderFeedback();notify();};
$('solution').onclick=()=>{state.feedback=state.feedback==='reveal'?'idle':'reveal';renderFeedback();notify();};
$('newTask').onclick=()=>{state.task=(state.task+1)%current()[6].length;state.answer='';state.feedback='idle';state.hint=false;renderPractice();notify();};
$('revealStep').onclick=()=>{state.step=Math.min(current()[5].length,state.step+1);renderSteps();notify();};
$('hideSteps').onclick=()=>{state.step=0;renderSteps();notify();};
$('previous').onclick=()=>selectLesson(lessonIndex(state.lesson)-1);$('next').onclick=()=>selectLesson(lessonIndex(state.lesson)+1);
$('learn').onclick=()=>{state.mode='learn';renderMode();notify();};$('practice').onclick=()=>{state.mode='practice';renderMode();notify();};
$('mapToggle').onclick=()=>toggleMap();$('mapOpen').onclick=()=>toggleMap(true);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){}};
$('homework').onclick=()=>{const l=current();$('homeworkText').value=l[2]+'\n\n'+l[6].map((t,i)=>(i+1)+'. '+t[0]+(Array.isArray(t[4])?'\nВарианты: '+t[4].join(' / '):'')).join('\n\n');$('copyStatus').textContent='';$('homeworkDialog').showModal();};
$('closeHomework').onclick=()=>$('homeworkDialog').close();
$('copyHomework').onclick=async()=>{try{await navigator.clipboard.writeText($('homeworkText').value);$('copyStatus').textContent='Скопировано.';}catch(_){$('homeworkText').focus();$('homeworkText').select();$('copyStatus').textContent='Текст выделен. Нажмите Ctrl+C для копирования.';}};
buildMap();render(true);
if(root.MathExamBoard){bridge=root.MathExamBoard.register({id:'notebook-math',version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,getState:()=>cleanState(state),applyState:incoming=>{state=cleanState(incoming);render(true);}});}
})(globalThis);
