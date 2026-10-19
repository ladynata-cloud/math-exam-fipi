(function(){
'use strict';
if(window.MathExamRemediationManaged)return;
const core=window.QuotientEstimate,D=window.DivisionLab,S=window.LearningScaffolds,key='mathExamBasics.quotientEstimate.v1';
const $=id=>document.getElementById(id);
const fresh=()=>({answers:[],answer:'',help:false,feedback:null});
const make=(seed,version)=>({...((version===1?core.make:core.makeV2)(seed)),contentId:core.id});
let seed=1,generatorVersion=2,source=make(seed,generatorVersion),state=fresh(),storage,blocked=false,warning='';
try{
 storage=window.localStorage;
 const raw=storage.getItem(key);
 if(raw!==null){
  const saved=JSON.parse(raw),version=saved?.generatorVersion===undefined?1:saved.generatorVersion;
  if(!saved||Array.isArray(saved)||!Number.isInteger(saved.seed)||saved.seed<0||saved.seed>4294967295||![1,2].includes(version))throw Error('format');
  const candidate=make(saved.seed,version),s=saved.state;
  if(!s||Array.isArray(s)||!Array.isArray(s.answers)||s.answers.length>candidate.steps.length||!s.answers.every((a,i)=>typeof a==='string'&&a.length<=30&&D.check(a,candidate.steps[i]))||typeof s.answer!=='string'||s.answer.length>30||typeof s.help!=='boolean')throw Error('state');
  if(s.feedback!==null&&s.feedback!==undefined&&(!s.feedback||typeof s.feedback!=='object'||Array.isArray(s.feedback)||!['incorrect','hint','solution'].includes(s.feedback.kind)||(s.feedback.text!==undefined&&(typeof s.feedback.text!=='string'||s.feedback.text.length>4000))))throw Error('feedback');
  seed=saved.seed;generatorVersion=version;source=candidate;
  // Rebuild feedback from the checked action. Saved text is never trusted as
  // markup or reused as an old answer-revealing first hint.
  state={answers:s.answers.slice(),answer:s.answer,help:s.help||['hint','solution'].includes(s.feedback?.kind),feedback:s.feedback?{kind:s.feedback.kind}:null};
 }
}catch(_){blocked=true;warning='Не удалось восстановить запись. Она оставлена без изменений. Можно решать, но новая работа здесь не сохранится.';}
function notice(){ $('estimate-notice').textContent=warning||'Эта тренировка сохраняется в этом браузере. Для работы с преподавателем открой её из своего кабинета.'; }
function save(){
 if(!blocked){try{storage.setItem(key,JSON.stringify({seed,generatorVersion,state}));}catch(_){warning='Не удалось сохранить работу в этом браузере. Оставь страницу открытой или продолжи через кабинет.';}}
 notice();
}
function presentation(q){return S?.present(source,q,{scope:'step',step:state.answers.length,answer:state.answer})||{};}
function helpText(q,kind){
 const shown=presentation(q);
 if(kind==='solution')return q.hint;
 if(kind==='hint')return shown.hint||'Посмотри на числа в вопросе. Выполни только одно действие.';
 return shown.error||q.error||'Проверь это действие ещё раз. Если трудно, открой подсказку.';
}
function render(focus){
 const i=state.answers.length,q=source.steps[i],done=!q;
 $('estimate-count').textContent=done?'Пример завершён':'Шаг '+(i+1)+' из '+source.steps.length;
 $('estimate-task').textContent=source.task.prompt;
 const trail=$('estimate-trail');trail.replaceChildren();
 source.steps.slice(0,i).forEach((step,n)=>{const p=document.createElement('p');p.textContent='✓ '+step.record;if(n===i-1)p.className='latest';trail.append(p);});
 $('estimate-form').hidden=done;$('estimate-hint').hidden=done;$('estimate-solution').hidden=done;
 $('estimate-new').textContent=done?'Следующий пример →':'Другой пример';
 const f=$('estimate-feedback'),help=$('estimate-help'),kind=state.feedback?.kind;
 const html=q&&['hint','solution'].includes(kind)?S?.render(source,q,{scope:'step',step:i,level:kind==='solution'?3:2})||'':'';
 // render() escapes its canonical numbers and text. Raw drafts and stored
 // feedback only ever reach textContent or an input's value.
 help.innerHTML=html;help.hidden=!html;
 f.hidden=!!html||(!state.feedback&&!done);f.className=kind||'correct';
 f.textContent=done?(state.help?'Получилось с подсказкой. Попробуй следующий пример сам.':'Цифра найдена самостоятельно.'):(kind?helpText(q,kind):'');
 if(q){$('estimate-prompt').textContent=presentation(q).prompt||q.prompt;$('estimate-answer').value=state.answer;$('estimate-answer').placeholder=q.kind==='digit'?'Одна цифра':'Твой ответ';$('estimate-answer').setAttribute('aria-label',q.kind==='digit'?'Одна цифра от 0 до 9':'Твой ответ');if(focus)$('estimate-answer').focus({preventScroll:true});}
 notice();
}
$('practice').onclick=()=>{$('view-practice').hidden=false;$('practice').hidden=true;render(true);};
$('estimate-answer').oninput=e=>{state.answer=e.target.value;save();};
$('estimate-form').onsubmit=e=>{
 e.preventDefault();const q=source.steps[state.answers.length];if(!q||!state.answer.trim())return;
 if(D.check(state.answer,q)){state.answers.push(state.answer);state.answer='';state.feedback=null;}
 else state.feedback={kind:'incorrect'};
 save();render(true);
};
function showHelp(kind){if(!source.steps[state.answers.length])return;state.help=true;state.feedback={kind};save();render();}
$('estimate-hint').onclick=()=>showHelp('hint');
$('estimate-solution').onclick=()=>showHelp('solution');
$('estimate-new').onclick=()=>{
 let nextSeed=seed,next;
 for(let attempt=0;attempt<64;attempt++){
  nextSeed=(nextSeed+1)>>>0;next=make(nextSeed,2);
  if(next.task.prompt!==source.task.prompt){seed=nextSeed;generatorVersion=2;source=next;state=fresh();save();render(true);return;}
 }
 warning='Не удалось выбрать другой пример. Попробуй открыть тренировку снова.';notice();
};
render();
})();
