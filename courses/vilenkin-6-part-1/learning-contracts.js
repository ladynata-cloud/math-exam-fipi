/* One cloud attempt owns one published module. No credential enters this file. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports){
    const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),context=vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(__dirname,'math.js'),'utf8'),context,{timeout:1000});
    const lessons=[1,2,3,4,5].flatMap(n=>JSON.parse(fs.readFileSync(path.join(__dirname,'data/lessons-'+n+'.json'),'utf8')));
    const book=JSON.parse(fs.readFileSync(path.join(__dirname,'data/textbook-index.json'),'utf8'));
    module.exports=factory(lessons,book,context.CourseMath);
  }else root.VilenkinLearningContractsFactory=factory;
})(typeof window==='undefined'?globalThis:window,function(DATA,BOOK,math){
  'use strict';
  const TRAINER='vilenkin6-part1',ANSWER_LIMIT=200,NOTE_LIMIT=4000,NOTES_BYTES=32000,STATE_BYTES=61440;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const lessons=new Map(DATA.map(lesson=>[Number(lesson.id),clone(lesson)]));
  const book=[...(BOOK.exercises||[]),...(BOOK.checks||[])];
  const fail=message=>{throw Error(message||'Некорректное состояние занятия.');};
  const object=value=>{if(!value||typeof value!=='object'||Array.isArray(value))fail();for(const key of Object.keys(value))if(['__proto__','prototype','constructor'].includes(key))fail();return value;};
  const keys=(value,allowed,required=allowed)=>{object(value);if(Object.keys(value).some(key=>!allowed.includes(key))||required.some(key=>!Object.hasOwn(value,key)))fail();return value;};
  const integer=(value,min,max)=>{if(!Number.isSafeInteger(value)||value<min||value>max)fail();return value;};
  const bool=value=>{if(typeof value!=='boolean')fail();return value;};
  const text=(value,max=ANSWER_LIMIT)=>{if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail('Текст слишком длинный или содержит недопустимые символы.');return value;};
  const bytes=value=>new TextEncoder().encode(JSON.stringify(value)).length;
  const correct=(answer,expected)=>math.equivalent(answer,expected);
  function canonical(contentId,seed){
    const match=typeof contentId==='string'&&contentId.match(/^lesson-(0|[1-9]\d*)$/),id=match?Number(match[1]):-1;
    if(!lessons.has(id))fail('Неизвестное занятие.');integer(seed,0,1000000000);
    return {schema:'mathexam-vilenkin6-task',trainerId:TRAINER,contentVersion:1,contentId,id:contentId,lessonId:id,seed};
  }
  function guard(spec){
    const expected=canonical(spec?.contentId,spec?.seed);keys(spec,Object.keys(expected));
    if(Object.keys(expected).some(key=>spec[key]!==expected[key]))fail('Занятие не совпадает с опубликованной версией.');
    return lessons.get(spec.lessonId);
  }
  function ownNumbers(spec){return new Set(book.filter(row=>Number(row.lesson)===spec.lessonId).map(row=>row.number));}
  function route(spec,value,returnOnly=false){
    text(value,200);const l=guard(spec),match=value.match(/^#lesson\/(\d+)\/(theory|steps|practice|check)(?:\/(\d+))?$/);
    if(match){
      if(Number(match[1])!==spec.lessonId)fail('Открой другое занятие из кабинета.');
      if(match[3]!==undefined){const max=match[2]==='steps'?l.examples.length-1:match[2]==='practice'?l.tasks.length-6:-1;integer(Number(match[3]),0,max);}
      return value;
    }
    if(!returnOnly&&(value==='#book'||value==='#progress'))return value;
    if(!returnOnly&&value.startsWith('#book/')){let number;try{number=decodeURIComponent(value.slice(6));}catch(_){fail();}if(ownNumbers(spec).has(number))return value;}
    fail('Эта страница относится к другому занятию.');
  }
  function fresh(spec){
    guard(spec);return {schema:'mathexam-vilenkin6-state',version:1,contentId:spec.contentId,seed:spec.seed,
      route:'#lesson/'+spec.lessonId+'/theory',focus:false,
      lesson:{theory:false,example:0,examples:{},practice:0,tasks:{},lab:{},exam:null},
      notes:{},book:{query:'',page:0,filter:'all'},returnTo:null,help:null};
  }
  function create(contentId,seed=0){const taskSpec=canonical(contentId,seed);return {taskSpec,state:fresh(taskSpec)};}
  function normalize(spec,value,previous){
    const l=guard(spec),pool=l.tasks.slice(0,-5),checks=l.tasks.slice(-5),expected=fresh(spec);
    keys(value,Object.keys(expected));if(value.schema!==expected.schema||value.version!==1||value.contentId!==spec.contentId||value.seed!==spec.seed)fail();
    const state={...expected,route:route(spec,value.route),focus:bool(value.focus),returnTo:value.returnTo===null?null:route(spec,value.returnTo,true)};
    const raw=keys(value.lesson,['theory','example','examples','practice','tasks','lab','exam']);
    const lesson={theory:bool(raw.theory),example:integer(raw.example,0,l.examples.length-1),examples:{},practice:integer(raw.practice,0,pool.length-1),tasks:{},lab:{},exam:null};
    object(raw.examples);if(Object.keys(raw.examples).length>l.examples.length)fail();
    for(const [index,record] of Object.entries(raw.examples)){
      if(!/^(0|[1-9]\d*)$/.test(index)||!l.examples[Number(index)])fail();
      keys(record,['n','rows','draft','help','revealed']);const n=integer(record.n,0,l.examples[Number(index)].steps.length);
      if(!Array.isArray(record.rows)||record.rows.length!==n)fail();
      lesson.examples[index]={n,rows:record.rows.map(row=>({help:bool(keys(row,['help']).help)})),draft:text(record.draft),help:bool(record.help),revealed:bool(record.revealed)};
      if(record.revealed&&!record.help)fail('Показанный шаг сохраняет отметку помощи.');
    }
    object(raw.tasks);if(Object.keys(raw.tasks).length>pool.length)fail();
    for(const [id,record] of Object.entries(raw.tasks)){
      const task=pool.find(task=>task.id===id);if(!task)fail();
      keys(record,['draft','attempts','help','solved','result','solvedAt'],['draft','attempts','help','solved','result']);
      const r={draft:text(record.draft),attempts:integer(record.attempts,0,1000000),help:integer(record.help,0,2),solved:bool(record.solved),result:record.result};
      if(![null,'independent','corrected','assisted'].includes(r.result))fail();
      if(r.solved){if(!correct(r.draft,task.answer)||r.attempts<1||!r.result)fail('Решение не подтверждено ответом.');if(r.result!==(r.help>0?'assisted':r.attempts===1?'independent':'corrected'))fail('Результат сохраняет отметку помощи.');}
      else if(r.result!==null)fail();
      if(Object.hasOwn(record,'solvedAt'))r.solvedAt=text(record.solvedAt,80);
      lesson.tasks[id]=r;
    }
    object(raw.lab);if(Object.keys(raw.lab).length>30)fail();
    for(const [name,item] of Object.entries(raw.lab)){
      if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name))fail();
      if(typeof item==='number'&&Number.isFinite(item)&&Math.abs(item)<1e9)lesson.lab[name]=item;
      else if(typeof item==='string')lesson.lab[name]=text(item,100);else fail();
    }
    if(raw.exam!==null){
      const record=keys(raw.exam,['n','answers','draft','score','complete','aided','started','finished'],['n','answers','draft','score','complete','aided']);
      const n=integer(record.n,0,5),complete=bool(record.complete);if(complete!==(n===5)||!Array.isArray(record.answers)||record.answers.length!==n)fail();
      const answers=record.answers.map((answer,index)=>{keys(answer,['value','ok']);const value=text(answer.value),ok=correct(value,checks[index].answer);if(bool(answer.ok)!==ok)fail('Результат ответа не подтверждён.');return {value,ok};});
      const score=complete?answers.filter(answer=>answer.ok).length:null;if(record.score!==score)fail('Результат проверки не подтверждён.');
      lesson.exam={n,answers,draft:text(record.draft),score,complete,aided:bool(record.aided)};
      if(!complete&&!lesson.exam.aided&&(state.route.startsWith('#book')||state.route.startsWith('#lesson/')&&!state.route.endsWith('/check')||value.help?.open))fail('Повторение во время проверки сохраняет отметку помощи.');
      for(const key of ['started','finished'])if(Object.hasOwn(record,key))lesson.exam[key]=text(record[key],80);
    }
    state.lesson=lesson;
    object(value.notes);const numbers=ownNumbers(spec);
    for(const [number,note] of Object.entries(value.notes)){
      if(!numbers.has(number))fail('Запись относится к другой теме.');keys(note,['text','done']);state.notes[number]={text:text(note.text,NOTE_LIMIT),done:bool(note.done)};
    }
    if(bytes(state.notes)>NOTES_BYTES)fail('В этом занятии заполнено место для записей. Сократи запись или сохрани продолжение на доске.');
    keys(value.book,['query','page','filter']);if(!['all',String(spec.lessonId)].includes(value.book.filter))fail();
    state.book={query:text(value.book.query,100),page:integer(value.book.page,0,30),filter:value.book.filter};
    if(value.help!==null){keys(value.help,['open','multiplier','tableOpen']);if(value.help.open!==true)fail();state.help={open:true,multiplier:integer(value.help.multiplier,2,9),tableOpen:bool(value.help.tableOpen)};}
    if(bytes(state)>STATE_BYTES)fail('Работа слишком велика для сохранения. Сократи запись; уже сохранённые данные останутся на месте.');
    if(previous!==undefined){
      const old=normalize(spec,previous).lesson;
      for(const [id,before] of Object.entries(old.tasks)){
        const after=lesson.tasks[id];
        if(!after||after.help<before.help||after.attempts<before.attempts||before.solved&&!after.solved)fail('Уже выполненная работа и помощь сохраняются.');
      }
      for(const [id,before] of Object.entries(old.examples)){
        const after=lesson.examples[id];
        if(!after||after.n<before.n||before.rows.some((row,index)=>row.help&&!after.rows[index]?.help))fail('Выполненные шаги сохраняются.');
        if(after.n===before.n&&(before.help&&!after.help||before.revealed&&!after.revealed))fail('Подсказка текущего шага сохраняется.');
        if(after.n>before.n&&(before.help||before.revealed)&&!after.rows[before.n]?.help)fail('Разобранный шаг сохраняет отметку помощи.');
      }
      if(old.exam){
        const after=lesson.exam;
        if(!after||after.n<old.exam.n||old.exam.aided&&!after.aided||old.exam.answers.some((answer,index)=>JSON.stringify(answer)!==JSON.stringify(after.answers[index])))fail('Ответы проверки и отметка помощи сохраняются.');
      }
    }
    return state;
  }
  function status(spec,value){const state=normalize(spec,value),tasks=Object.values(state.lesson.tasks),exam=state.lesson.exam;return {completed:tasks.filter(t=>t.solved).length,total:guard(spec).tasks.length-5,independent:tasks.filter(t=>t.solved&&t.result==='independent').length,assisted:tasks.filter(t=>t.solved&&t.result==='assisted').length,checkpoint:exam?.complete?exam.score:null,checked:!!exam?.complete&&exam.score>=4};}
  function assistance(spec,value){
    guard(spec);const l=value.lesson;return !!value.help?.open||!!l.exam?.aided||Object.values(l.tasks).some(task=>task.help>0||task.result==='assisted')||Object.values(l.examples).some(example=>example.help||example.revealed||example.rows.some(row=>row.help));
  }
  function evaluate(spec,details,value){
    const l=guard(spec),state=normalize(spec,value),s=state.lesson;object(details);
    if(details.scope==='checkpoint'){
      keys(details,['scope']);if(state.route!=='#lesson/'+spec.lessonId+'/check'||!s.exam?.complete)fail('Проверка ещё не закончена.');
      return {correct:s.exam.score>=4,complete:true,assisted:assistance(spec,state)};
    }
    if(details.scope==='practice'){
      keys(details,['scope','taskId','answer']);const index=l.tasks.slice(0,-5).findIndex(task=>task.id===details.taskId),task=l.tasks[index],r=s.tasks[details.taskId];
      if(index<0||s.practice!==index||!state.route.startsWith('#lesson/'+spec.lessonId+'/practice')||!r||r.draft!==text(details.answer)||r.attempts<1)fail('Проверяется другое задание или ответ.');
      const ok=correct(details.answer,task.answer);if(ok!==r.solved)fail('Сохранённое решение не совпадает с проверкой.');
      return {correct:ok,complete:false,assisted:assistance(spec,state)};
    }
    if(details.scope==='example'){
      keys(details,['scope','exampleIndex','step','answer']);const index=integer(details.exampleIndex,0,l.examples.length-1),step=integer(details.step,0,l.examples[index].steps.length-1),r=s.examples[index],answer=text(details.answer);
      if(s.example!==index||!state.route.startsWith('#lesson/'+spec.lessonId+'/steps')||!r)fail();
      const ok=correct(answer,l.examples[index].steps[step].answer);if(ok?r.n!==step+1:r.n!==step||r.draft!==answer)fail('Шаг не совпадает с сохранённым решением.');
      return {correct:ok,complete:false,assisted:true};
    }
    if(details.scope==='exam'){
      keys(details,['scope','index','answer']);const index=integer(details.index,0,4),answer=text(details.answer),exam=s.exam;
      if(state.route!=='#lesson/'+spec.lessonId+'/check'||!exam||exam.n!==index+1||exam.answers[index].value!==answer)fail('Проверяется другой ответ.');
      return {correct:correct(answer,l.tasks.slice(-5)[index].answer),complete:false,assisted:assistance(spec,state)};
    }
    fail('Неизвестный вид проверки.');
  }
  function describe(spec){const l=guard(spec);return {title:l.title,prompt:l.goal,contentId:spec.contentId,position:null,steps:l.examples.reduce((n,example)=>n+example.steps.length,0)};}
  function questionIdentity(spec){const l=guard(spec);return JSON.stringify({trainerId:TRAINER,contentId:spec.contentId,questions:l.tasks.map(task=>task.prompt)});}
  return Object.freeze({TRAINER,ANSWER_LIMIT,NOTE_LIMIT,NOTES_BYTES,STATE_BYTES,create,fresh,normalize,evaluate,status,assistance,describe,questionIdentity,correct});
});
