/* MathExam notebook course: deterministic, bounded board state, standalone progress. */
(function(root){
'use strict';
const data=root.NotebookMathData,models=root.NotebookModels;
const normalize=s=>String(s??'').trim().toLowerCase().replace(/ё/g,'е').replace(/[−–—]/g,'-').replace(/\s+/g,' ').replace(/\s*([;()[\]{}∪/])\s*/g,'$1').replace(/\+∞/g,'∞').replace(/²/g,'^2').replace(/³/g,'^3').replace(/₁/g,'1').replace(/π/g,'pi').replace(/(\d)\s*\*\s*pi/g,'$1pi').replace(/,/g,'.');
function decimalParts(s){
 const [whole,frac='']=s.replace(/^[+-]/,'').split('.');
 return [BigInt((whole||'0')+frac)*(s.startsWith('-')?-1n:1n),10n**BigInt(frac.length)];
}
function rational(s){
 if(s.length>220||!/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:\/[-+]?(?:\d+(?:\.\d+)?|\.\d+))?$/.test(s))return null;
 const [top,bottom='1']=s.split('/'),[a,b]=decimalParts(top),[c,d]=decimalParts(bottom);
 return c===0n?null:[a*d,b*c];
}
function equivalent(a,b){
 if(a===b)return true;
 const p=rational(a),q=rational(b);
 return !!(p&&q&&p[0]*q[1]===q[0]*p[1]);
}
function matches(value,expected,question=''){
 const answer=normalize(value);
 if(!answer||answer.length>220)return false;
 if(/^Сократи /i.test(question)){
  if(!/^[+-]?\d+\/[1-9]\d*$/.test(answer))return false;
  let [a,b]=answer.replace(/^[+-]/,'').split('/').map(BigInt);
  while(b!==0n)[a,b]=[b,a%b];
  if(a!==1n)return false;
 }
 if(/десятичной дробью/i.test(question)&&!/^[-+]?\d+\.\d+$/.test(answer))return false;
 const unordered=/(?:корни через|элементы через|запрещённые x через|найди (?:a∩b|b∖a|u∖a))/i.test(question)&&!/возрастани/i.test(question);
 const setQuestion=/элементы через|найди (?:a∩b|b∖a|u∖a)/i.test(question);
 const values=s=>(setQuestion?s.replace(/^\{(.*)\}$/,'$1'):s).split(';');
 return String(expected).split('|').some(key=>{
  const target=normalize(key);
  if(equivalent(answer,target))return true;
  const items=values(answer),remaining=values(target);
  if(items.length<2||items.length!==remaining.length||!items.every(rational)||!remaining.every(rational))return false;
  if(!unordered)return items.every((item,i)=>equivalent(item,remaining[i]));
  return items.every(item=>{
   const index=remaining.findIndex(other=>equivalent(item,other));
   if(index<0)return false;
   remaining.splice(index,1);
   return true;
  });
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
 $('progressText').textContent='Завершено '+data.filter(mastered).length+' из '+data.length+' тем · '+done+' из '+total+' заданий';
 $('progressBar').style.width=(100*done/total)+'%';
 $('map').querySelectorAll('button[data-lesson]').forEach(b=>b.classList.toggle('complete',mastered(data[lessonIndex(b.dataset.lesson)])));
}
function buildMap(){
 const box=$('map');box.replaceChildren();const groups=new Map();for(const l of data){if(!groups.has(l[1]))groups.set(l[1],[]);groups.get(l[1]).push(l);}
 for(const [name,ls] of groups){const d=el('details',undefined,'map-group'),summary=el('summary',name+' · '+ls.length);d.append(summary);d.open=ls.some(l=>l[0]===state.lesson);
  for(const l of ls){const b=el('button',String(lessonIndex(l[0])+1).padStart(2,'0')+' · '+l[2]);b.type='button';b.dataset.lesson=l[0];b.onclick=()=>{selectLesson(lessonIndex(l[0]));toggleMap(false);$('lessonTitle').focus();};d.append(b);}box.append(d);}
 updateMap();progress();
}
function updateMap(){
 $('map').querySelectorAll('button[data-lesson]').forEach(b=>{const yes=b.dataset.lesson===state.lesson;b.classList.toggle('active',yes);if(yes){b.setAttribute('aria-current','step');b.closest('details').open=true;}else b.removeAttribute('aria-current');});
}
function toggleMap(force){
 const open=typeof force==='boolean'?force:!$('sidebar').classList.contains('open');
 $('sidebar').classList.toggle('open',open);
 for(const id of ['mapToggle','mapOpen'])$(id).setAttribute('aria-expanded',String(open));
 if(open)$('map').querySelector('[aria-current="step"]').focus();
}
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
function setModelZoom(enlarged,scrollLeft){
 const host=$('model'),view=host.querySelector('.model-view');
 host.classList.toggle('zoomed',enlarged);
 $('modelZoom').textContent=enlarged?'Показать рисунок целиком':'Увеличить рисунок';
 if(!view)return;
 if(enlarged){
  view.tabIndex=0;
  view.setAttribute('role','region');
  view.setAttribute('aria-label','Увеличенный рисунок, прокрутка по горизонтали');
  view.scrollLeft=scrollLeft??(view.scrollWidth-view.clientWidth)/2;
 }else{
  view.removeAttribute('tabindex');view.removeAttribute('role');view.removeAttribute('aria-label');
  view.scrollLeft=0;
 }
}
function renderModel(force){
 const l=current(),host=$('model'),zoom=$('modelZoom');
 $('modelPanel').hidden=!l[7];
 if(!l[7]){host.replaceChildren();zoom.hidden=true;lastModelKey=null;return;}
 if(force||lastModelKey!==l[0]){
  const enlarged=lastModelKey===l[0]&&host.classList.contains('zoomed');
  const scroll=host.querySelector('.model-view')?.scrollLeft;
  lastModelKey=l[0];
  models.mount(host,l[7],state.model,m=>{state.model=models.normalize(l[7],m);notify();},l[0]);
  zoom.hidden=!host.querySelector('svg');
  setModelZoom(enlarged,scroll);
 }
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
$('modelZoom').onclick=()=>{
 const enlarged=!$('model').classList.contains('zoomed');
 setModelZoom(enlarged);
 if(enlarged)$('model').querySelector('.model-view').focus({preventScroll:true});
};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){}};
$('homework').onclick=()=>{const l=current();$('homeworkText').value=l[2]+'\n\n'+l[6].map((t,i)=>(i+1)+'. '+t[0]+(Array.isArray(t[4])?'\nВарианты: '+t[4].join(' / '):'')).join('\n\n');$('copyStatus').textContent='';$('homeworkDialog').showModal();};
$('closeHomework').onclick=()=>$('homeworkDialog').close();
$('copyHomework').onclick=async()=>{try{await navigator.clipboard.writeText($('homeworkText').value);$('copyStatus').textContent='Скопировано.';}catch(_){$('homeworkText').focus();$('homeworkText').select();$('copyStatus').textContent='Текст выделен. Нажмите Ctrl+C для копирования.';}};
buildMap();render(true);
if(root.MathExamBoard){bridge=root.MathExamBoard.register({id:'notebook-math',version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,getState:()=>cleanState(state),applyState:incoming=>{const next=cleanState(incoming);const modelChanged=state.lesson!==next.lesson||JSON.stringify(state.model)!==JSON.stringify(next.model);state=next;render(modelChanged);}});}
})(globalThis);
