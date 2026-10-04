(function(root){
'use strict';
const node=typeof module==='object'&&module.exports;
const bank=node?require('./learning-bank.js'):root.MathExamRemediationBank;
const division=node?require('./multiplication-division/division-lab-core.js'):root.DivisionLab;
const LAB='multiplication-division/division-lab';
const clone=x=>JSON.parse(JSON.stringify(x));
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const text=(x,max=4000)=>{if(typeof x!=='string'||x.length>max)throw Error('Некорректный текст решения.');return x;};
const integer=(x,max)=>{if(!Number.isInteger(x)||x<0||x>max)throw Error('Некорректный этап решения.');return x;};
const normalized=x=>String(x??'').trim().replace(/\s+/g,'').replace(',','.').replace(/−/g,'-');
function number(raw){const s=normalized(raw);if(!s||!/^[-+]?(?:\d+(?:\.\d+)?|\d+\/[-+]?\d+)$/.test(s))return NaN;if(s.includes('/')){const [a,b]=s.split('/').map(Number);return b?a/b:NaN;}return Number(s);}
function equal(raw,answer,strict){
 if(answer&&typeof answer==='object'&&own(answer,'n')){
  if(strict){const m=normalized(raw).match(/^(-?\d+)\/(-?\d+)$/);let n=answer.n,d=answer.d;const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);const g=gcd(n,d);n/=g;d/=g;if(d<0){n=-n;d=-d;}if(!m)return d===1&&/^[-+]?\d+$/.test(normalized(raw))&&number(raw)===n;let a=Number(m[1]),b=Number(m[2]);if(b<0){a=-a;b=-b;}return a===n&&b===d;}
  return Number.isFinite(number(raw))&&Math.abs(number(raw)-answer.n/answer.d)<1e-8;
 }
 if(typeof answer==='number')return Number.isFinite(number(raw))&&Math.abs(number(raw)-answer)<1e-8;
 return normalized(raw)===normalized(answer);
}
function question(q){if(!q)return null;const choice=q.kind==='choice'||q.type==='choice';return {...clone(q),kind:choice?'choice':'input',options:choice?q.options.map((o,i)=>typeof o==='object'?{id:String(o.id),html:String(o.html)}:{id:String(i),html:String(o)}):[],answer:choice?String(q.answer):clone(q.answer)};}
function checked(raw,q){return !!q&&(q.kind==='choice'?String(raw)===String(q.answer):equal(raw,q.answer,q.strict));}
function fresh(){return {view:'practice',lessonIndex:0,step:0,answer:'',answers:[],lessonAnswers:[],lessonChecked:[],hint:0,feedback:{kind:'none',scope:'practice',step:0,answer:''},referenceOpen:false,note:'',completed:false};}
function create(contentId,seed){
 if(contentId!==LAB&&!own(bank,contentId))throw Error('Неизвестный тренажёр.');
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Некорректный вариант задания.');
 let source,task,lessons=[],steps=[],items=[],divisionTask=null,divisionTasks=[],rule='';
 if(contentId===LAB){const keys=Object.keys(division.levels),level=keys[seed%keys.length];divisionTask=division.make(level,seed||1);source={family:'division',title:'Лаборатория деления уголком'};rule=division.levels[level].idea;task={kind:'input',prompt:divisionTask.dividend+' : '+divisionTask.divisor};steps=division.plan(divisionTask).actions;
 }else{
  source=bank[contentId](seed);rule=source.rule||'';
  if(source.family==='division'){
   const t=source.task,rows=source.config.lessons[t.mode]||[];
   lessons=rows.map(r=>({title:r[0],short:r[1],lead:r[2],html:r[3],question:question(r[4])}));rule=source.config.rules[t.mode]||'';
   task={kind:'input',prompt:t.original,label:source.config.meta[t.mode].title};
   if(t.mode==='quotientDigit')steps=[{kind:'digit',prompt:'Какая цифра частного подходит к '+t.partial+' : '+t.d+'?',answer:String(t.steps[0].qd),hint:'Выбери наибольшую цифру от 0 до 9, произведение которой на делитель не больше '+t.partial+'.'}];
   else{divisionTask={level:t.mode,dividend:t.origDividend||t.original.split(' : ')[0],divisor:t.origDivisor||String(t.d)};steps=division.plan(divisionTask).actions;}
   if(contentId==='multiplication-division/long-division-mixed-checkpoint'){
    const tasks=source.makeCheck();steps=[];lessons=[];
    tasks.forEach((t,index)=>{
     const item={level:t.mode,dividend:t.origDividend||t.original.split(' : ')[0],divisor:t.origDivisor||String(t.d)},actions=division.plan(item).actions,startIndex=steps.length;
     steps.push(...actions.map(a=>({...a,taskIndex:index})));
     divisionTasks.push({task:item,prompt:t.original,startIndex,endIndex:steps.length});
     lessons.push(...(source.config.lessons[t.mode]||[]).map(r=>({title:source.config.meta[t.mode].short+': '+r[0],short:r[1],lead:r[2],html:r[3],question:question(r[4])})));
    });
    divisionTask=divisionTasks[0].task;task={kind:'input',prompt:divisionTasks[0].prompt,label:source.title};
    rule=tasks.map(t=>'<p>'+source.config.rules[t.mode]+'</p>').join('');
   }
  }else{
   task=question(source.task);
   lessons=source.lessons.map(l=>({title:l.title,short:l.short||l.title,lead:l.lead||l.intro||'',html:l.html||'',question:question(typeof l.question==='function'?l.question():l.question)}));
   if(contentId==='percentages/percent-final-checkpoint'){items=source.makeCheck().map(question);task=items[0];}
  }
 }
 const taskSpec={schema:'mathexam-remediation-task',contentVersion:1,contentId,seed,family:source.family,title:source.title,rule,task,lessons,steps,items,divisionTask,divisionTasks};
 if(JSON.stringify(taskSpec).length>60000)throw Error('Задание превысило допустимый размер.');
 return {taskSpec,state:fresh()};
}
function guard(spec){if(!spec||spec.schema!=='mathexam-remediation-task'||spec.contentVersion!==1||(spec.contentId!==LAB&&!own(bank,spec.contentId))||!Array.isArray(spec.steps)||!Array.isArray(spec.lessons)||!Array.isArray(spec.items))throw Error('Неизвестный формат задания.');}
function length(spec){return spec.steps.length||spec.items.length||1;}
function prefix(spec,answers){
 if(!Array.isArray(answers)||answers.length>length(spec))throw Error('Некорректная последовательность решения.');
 return answers.map((raw,i)=>{text(raw,4000);const ok=spec.steps.length?division.check(raw,spec.steps[i]):checked(raw,spec.items[i]||spec.task);if(!ok)throw Error('В решении пропущен непроверенный этап.');return raw;});
}
function normalize(spec,value){
 guard(spec);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Некорректное состояние тренажёра.');
 const s=fresh();if(!['practice','learn'].includes(value.view))throw Error('Неизвестный экран.');s.view=value.view;
 s.lessonIndex=integer(value.lessonIndex,Math.max(0,spec.lessons.length-1));s.answers=prefix(spec,value.answers);
 s.step=integer(value.step,length(spec));if(s.step!==s.answers.length)throw Error('Этап не соответствует решению.');
 s.answer=text(value.answer);s.note=text(value.note||'');s.hint=integer(value.hint,3);s.referenceOpen=value.referenceOpen===true;
 if(!Array.isArray(value.lessonAnswers)||value.lessonAnswers.length>spec.lessons.length||!Array.isArray(value.lessonChecked)||value.lessonChecked.length>spec.lessons.length)throw Error('Некорректные ответы к объяснению.');
 s.lessonAnswers=value.lessonAnswers.map(v=>text(v));
 s.lessonChecked=value.lessonChecked.map((v,i)=>v===true&&checked(s.lessonAnswers[i],spec.lessons[i]?.question));
 const f=value.feedback;if(!f||!['none','correct','incorrect','hint','solution'].includes(f.kind)||!['practice','lesson','step'].includes(f.scope))throw Error('Некорректная обратная связь.');
 s.feedback={kind:f.kind,scope:f.scope,step:integer(f.step,Math.max(length(spec),spec.lessons.length)),answer:text(f.answer||'')};
 s.completed=s.answers.length===length(spec);return s;
}
function evaluate(spec,details){
 guard(spec);if(!details||typeof details!=='object')throw Error('Не указан ответ.');const raw=text(details.answer,4000);
 if(details.scope==='lesson'){const i=integer(details.step,spec.lessons.length-1);return {correct:checked(raw,spec.lessons[i].question),complete:false};}
 if(spec.steps.length){if(details.scope!=='step')throw Error('Нужно проверить действие уголка.');const i=integer(details.step,spec.steps.length-1),answers=prefix(spec,details.answers||[]);if(answers.length!==i)throw Error('Сначала завершите предыдущие действия.');const correct=division.check(raw,spec.steps[i]);return {correct,complete:correct&&i===spec.steps.length-1};}
 if(details.scope!=='practice')throw Error('Неизвестный вид проверки.');
 if(spec.items.length){const i=integer(details.step,spec.items.length-1),answers=prefix(spec,details.answers||[]);if(answers.length!==i)throw Error('Сначала ответьте на предыдущие вопросы.');const correct=checked(raw,spec.items[i]);return {correct,complete:correct&&i===spec.items.length-1};}
 const correct=checked(raw,spec.task);return {correct,complete:correct};
}
function list(){return [...Object.keys(bank),LAB].sort().map(contentId=>{const title=contentId===LAB?'Лаборатория деления уголком':bank[contentId](1).title;return {id:'oge-basics:'+contentId,trainerId:'oge-basics',contentId,contentVersion:1,title,position:null,topicId:'foundation',url:'/trainers/oge-basics/'+contentId+'.html'};});}
function describe(spec){guard(spec);return {title:spec.title,prompt:spec.items.length?'Итоговая проверка: '+spec.items.length+' заданий по всем навыкам темы.':spec.task.prompt,contentId:spec.contentId,steps:length(spec)};}
const api={list,create,normalize,validate:normalize,evaluate,describe,equal,checked};if(node)module.exports=api;else root.MathExamRemediation=api;
})(typeof window==='undefined'?globalThis:window);
