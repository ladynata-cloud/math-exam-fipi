'use strict';
// Actual event handlers in an in-memory DOM. Browser visual review is separate.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {test}=require('node:test'),{JSDOM}=require('jsdom');
const KEY='mathexam.peterson6.part1.v1',copy=v=>JSON.parse(JSON.stringify(v));
function fixture(saved,help){
 const errors=[],dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://peterson.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 w.scrollTo=()=>{};w.console.error=(...v)=>errors.push(v.join(' '));
 for(const f of ['math.js','continuation-models.js','models.js','data.js'])w.eval(fs.readFileSync(path.join(__dirname,f),'utf8'));
 // Isolated authored fixture exercises the public continuation contract while real content is verified in test-ui.
 const task={id:'p15-ui-manual',kind:'manual',title:'Построение',prompt:'Объясни, почему a/b = (3 · 2)/(4 · 2).',answer:'',finalLabel:'Запиши объяснение равенства.',skills:['fraction-multiply'],hint:'Вспомни основное свойство дроби.',steps:[{kind:'number',prompt:'Сколько будет 3 · 2?',answer:'6'},{kind:'instruction',prompt:'Запиши равенство отношений.'},{kind:'instruction',prompt:'Объясни, почему знаменатель не равен нулю.'}],source:{type:'textbook',part:2,number:'1',page:3,reference:'№ 1'},figure:{type:'line',min:-3,max:3,points:[{name:'A',x:1}],caption:'Исходный чертёж'}};
 const lesson={id:'p15',part:2,order:15,title:'Тест продолжения',chapter:'Отношения',page:3,sourceRange:'1–2',model:'continuation',theory:[{title:'Правило',text:'a/b = (a · 2)/(b · 2)'}],skills:['fraction-multiply'],tasks:[task,{...copy(task),id:'p15-ui-second'}]};
 w.PetersonCourse.lessons=w.PetersonCourse.lessons.filter(l=>l.id!=='p15').concat(lesson);
 if(saved)w.localStorage.setItem(KEY,JSON.stringify(saved));if(help)w.localStorage.setItem(KEY+'.help',JSON.stringify(help));
 w.eval(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'));
 const q=s=>{const n=d.querySelector(s);assert(n,'Missing '+s);return n;},state=()=>copy(w.PetersonApp.getState());
 const nav=h=>{w.history.replaceState(null,'',h);w.PetersonApp.route();assert(!d.querySelector('.error-page'));};
 const event=(s,value,type='input')=>{const n=q(s);n.value=value;n.dispatchEvent(new w.Event(type,{bubbles:true}));};
 const click=s=>q(s).click(),submit=s=>q(s).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const settle=()=>new Promise(r=>w.setTimeout(r,15));
 const close=()=>{assert.deepEqual(errors,[]);dom.window.close();};
 async function importData(data){nav('#progress');await q('#import-file').onchange({target:{files:[{size:JSON.stringify(data).length,text:async()=>JSON.stringify(data)}]}});}
 return {w,d,q,state,nav,event,click,submit,settle,close,importData};
}

test('manual mixed steps, required figure, notes and explicit review survive reload without credit',()=>{
 const f=fixture();let saved;
 try{
  f.nav('#lesson/p15/0');assert(f.q('#task-figure svg'));assert(!f.d.querySelector('#answer-form'));assert.equal(f.state().tasks['p15-ui-manual'].assisted,false,'required figure is not help');
  f.click('[data-action="record-manual"]');assert.equal(f.state().tasks['p15-ui-manual'].value,'');
  f.event('#notebook','Построение и обоснование записаны в тетради.');f.click('[data-action="guided"]');f.event('[data-step-input="0"]','6');f.submit('[data-step-form="0"]');
  f.click('[data-action="instruction"]');assert.equal(f.state().tasks['p15-ui-manual'].step,2);assert.equal(f.d.querySelectorAll('.step.completed').length,2);
  f.click('[data-action="record-manual"]');saved=f.state();assert.equal(saved.tasks['p15-ui-manual'].value,'recorded');assert.equal(saved.tasks['p15-ui-manual'].correct,false);assert.equal(saved.tasks['p15-ui-manual'].independent,false);assert.equal(saved.tasks['p15-ui-manual'].completion,null);
 }finally{f.close();}
 const g=fixture(saved);try{g.nav('#lesson/p15/0');assert.equal(g.d.querySelectorAll('.step.completed').length,2);assert.equal(g.q('#notebook').value,'Построение и обоснование записаны в тетради.');g.click('[data-action="instruction"]');assert.equal(g.state().tasks['p15-ui-manual'].step,3);assert.match(g.q('.task-heading').textContent,/Записано для проверки/);g.event('#notebook','');assert.equal(g.state().tasks['p15-ui-manual'].value,'');}finally{g.close();}
});

test('model values persist per task, through a practice detour and a new browser session',async()=>{
 const f=fixture();let saved,help;
 try{f.nav('#lesson/p15/0');assert.equal(f.q('[data-lesson-help="model"]').open,false);f.click('[data-lesson-help="model"] > summary');f.event('#model select','9','change');assert.equal(f.state().models['p15-ui-manual'].values[0],9);assert.equal(f.state().tasks['p15-ui-manual'].assisted,true);f.event('#notebook','Моя схема');f.click('[data-action="detour"]');await f.settle();f.click('[data-action="return"]');await f.settle();assert.equal(f.q('#model select').value,'9');assert.equal(f.q('[data-lesson-help="model"]').open,true);assert.equal(f.q('#notebook').value,'Моя схема');f.nav('#lesson/p15/1');assert.equal(f.q('#model select').value,'6','other task uses its own model');f.click('[data-lesson-help="model"] > summary');f.event('#model select','3','change');f.nav('#lesson/p15/0');assert.equal(f.q('#model select').value,'9');saved=f.state();help=JSON.parse(f.w.localStorage.getItem(KEY+'.help'));}finally{f.close();}
 const g=fixture(saved,help);try{g.nav('#lesson/p15/1');assert.equal(g.q('#model select').value,'3');assert.equal(g.q('[data-lesson-help="model"]').open,true);g.nav('#lesson/p15/0');assert.equal(g.q('#model select').value,'9');assert.equal(g.q('[data-lesson-help="model"]').open,true);}finally{g.close();}
});

test('new independent checks retain helped practice, use unseen conditions, and resume after reload',async()=>{
 const f=fixture();let saved,checkId;
 try{f.nav('#practice/fraction-multiply/1');f.click('[data-action="hint"]');f.event('#notebook','Старая запись с подсказкой');const previous=f.state(),oldId=Object.keys(previous.tasks).find(id=>id.startsWith('practice:'));f.click('[data-action="start-check"]');await f.settle();assert.equal(f.w.location.hash,'#check/fraction-multiply/1');checkId=Object.keys(f.state().tasks).find(id=>id.startsWith('check:'));assert(checkId);assert.notEqual(f.state().tasks[checkId].signature,previous.tasks[oldId].signature);assert.deepEqual(f.state().tasks[oldId],previous.tasks[oldId]);assert(!f.d.querySelector('[data-action="hint"]'));assert(!f.d.querySelector('[data-action="guided"]'));const seed=Number(checkId.split(':')[3]),task=f.w.PetersonMath.generate('fraction-multiply',seed,1);f.event('#final-answer',task.answer);f.submit('#answer-form');assert(f.state().tasks[checkId].correct);assert(f.state().tasks[checkId].independent);saved=f.state();f.nav('#diagnostic');assert.match(f.q('#main').textContent,/Последняя проверка выполнена с первой попытки/);f.nav('#check/fraction-multiply/3');f.nav('#diagnostic');const card=[...f.d.querySelectorAll('.skill-card')].find(el=>el.querySelector('h2').textContent===f.w.PetersonMath.skills.find(sk=>sk.id==='fraction-multiply').title);assert.match(card.textContent,/Здесь полезно повторить действие/,'latest check is based on visit order across levels, not level-specific seed');}finally{f.close();}
 const g=fixture(saved);try{g.nav('#check/fraction-multiply/1');assert.equal(g.state().tasks[checkId].correct,true);assert.equal(Object.keys(g.state().tasks).filter(id=>id.startsWith('check:')).length,1,'reload resumes current check');g.click('[data-action="new"]');assert.equal(Object.keys(g.state().tasks).filter(id=>id.startsWith('check:')).length,2);assert.equal(g.state().tasks[checkId].correct,true);}finally{g.close();}
});

test('real import keeps conflicting local work and imports an untouched task with its model together',async()=>{
 const incomingFixture=fixture();let incoming;
 try{incomingFixture.nav('#lesson/p15/0');incomingFixture.event('#notebook','Входящая запись');incomingFixture.click('[data-action="record-manual"]');incomingFixture.event('#model select','8','change');incoming= incomingFixture.state();}finally{incomingFixture.close();}
 const f=fixture();try{f.nav('#lesson/p15/0');f.event('#notebook','СВОЙ ЧЕРНОВИК');f.click('[data-action="guided"]');f.event('[data-step-input="0"]','6');f.submit('[data-step-form="0"]');f.event('#model select','11','change');const before=f.state();await f.importData({course:'peterson6-part1',state:incoming});assert.deepEqual(f.state().tasks['p15-ui-manual'],before.tasks['p15-ui-manual']);assert.deepEqual(f.state().models['p15-ui-manual'],before.models['p15-ui-manual']);}finally{f.close();}
 const g=fixture();try{await g.importData({course:'peterson6-part1',state:incoming});assert.equal(g.state().tasks['p15-ui-manual'].note,'Входящая запись');assert.deepEqual(g.state().models['p15-ui-manual'],incoming.models['p15-ui-manual']);g.nav('#lesson/p15/0');assert.equal(g.q('#model select').value,'8');}finally{g.close();}
});

test('legacy v1 state loads without models and safe math formatting leaves ordinary slashes alone',()=>{
 const old={version:1,tasks:{},practice:{},last:{hash:'#lesson/p01/0'},origin:null},f=fixture(old);
 try{f.nav('#lesson/p01/0');assert(f.state().models['p01-t01']);const div=f.d.createElement('div');div.innerHTML=f.w.PetersonApp.format('a/b; (3 + 2)/6; (3 · 22)/(11 · 45); 1/t; 2 1/3; {{frac:a:12}}; {{frac:a+b:b}}; {{frac:(a + 2):(b − 3)}}; {{mix:+2:1:3}}; Decimal/Fraction; https://example.org/a/b; <img src=x onerror=alert(1)>; {{frac:<img src=x onerror=alert(1)>:b}}');assert.equal(div.querySelectorAll('.fra').length,10);assert.equal(div.querySelectorAll('img').length,0);assert.doesNotMatch(div.textContent,/\{\{(?:frac|mix):/);assert.equal(div.querySelectorAll('[onerror],[onclick]').length,0);assert.match(div.textContent,/Decimal\/Fraction/);assert.match(div.textContent,/https:\/\/example.org\/a\/b/);}finally{f.close();}
});

test('opening model or theory is sticky help; reviewing either after success keeps earned independence',()=>{
 for(const kind of ['model','theory']){
  const f=fixture();try{f.nav('#lesson/p08/0');const task=f.w.PetersonCourse.lessons.find(l=>l.id==='p08').tasks[0];assert.equal(f.q('[data-lesson-help="'+kind+'"]').open,false);f.event('#final-answer','0,86');f.event('#notebook','Не потерять запись');f.click('[data-lesson-help="'+kind+'"] > summary');assert.equal(f.q('[data-lesson-help="'+kind+'"]').open,true);assert.equal(f.q('#final-answer').value,'0,86');assert.equal(f.q('#notebook').value,'Не потерять запись');f.click('[data-lesson-help="'+kind+'"] > summary');assert.equal(f.state().tasks[task.id].assisted,true,'closing cannot undo assistance');f.event('#final-answer',task.answer);f.submit('#answer-form');assert.equal(f.state().tasks[task.id].correct,true);assert.equal(f.state().tasks[task.id].independent,false);}finally{f.close();}
 }
 const f=fixture();try{f.nav('#lesson/p08/0');const task=f.w.PetersonCourse.lessons.find(l=>l.id==='p08').tasks[0];f.event('#final-answer',task.answer);f.submit('#answer-form');const earned=f.state().tasks[task.id].completion;assert.equal(earned.independent,true);for(const kind of ['model','theory'])f.click('[data-lesson-help="'+kind+'"] > summary');f.event('#model input','7');assert.deepEqual(f.state().tasks[task.id].completion,earned);assert.equal(f.state().tasks[task.id].independent,true);}finally{f.close();}
});
