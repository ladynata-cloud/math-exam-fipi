'use strict';
// Actual event handlers in an in-memory DOM. Browser visual review is separate.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {test}=require('node:test'),{JSDOM}=require('jsdom');
const KEY='mathexam.peterson6.part1.v1',copy=v=>JSON.parse(JSON.stringify(v));
function fixture(saved,help,realCourse=false){
 const errors=[],dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://peterson.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
 w.scrollTo=()=>{};w.console.error=(...v)=>errors.push(v.join(' '));
 for(const f of ['math.js','continuation-models.js','models.js','data.js'])w.eval(fs.readFileSync(path.join(__dirname,f),'utf8'));
 // Isolated authored fixture exercises the public continuation contract while real content is verified in test-ui.
 const task={id:'p15-ui-manual',kind:'manual',title:'Построение',prompt:'Объясни, почему a/b = (3 · 2)/(4 · 2).',answer:'',finalLabel:'Запиши объяснение равенства.',skills:['fraction-multiply'],hint:'Вспомни основное свойство дроби.',steps:[{kind:'number',prompt:'Сколько будет 3 · 2?',answer:'6'},{kind:'instruction',prompt:'Запиши равенство отношений.'},{kind:'instruction',prompt:'Объясни, почему знаменатель не равен нулю.'}],source:{type:'textbook',part:2,number:'1',page:3,reference:'№ 1'},figure:{type:'line',min:-3,max:3,points:[{name:'A',x:1}],caption:'Исходный чертёж'}};
 const lesson={id:'p15',part:2,order:15,title:'Тест продолжения',chapter:'Отношения',page:3,sourceRange:'1–2',model:'continuation',theory:[{title:'Правило',text:'a/b = (a · 2)/(b · 2)'}],skills:['fraction-multiply'],tasks:[task,{...copy(task),id:'p15-ui-second'}]};
 if(!realCourse)w.PetersonCourse.lessons=w.PetersonCourse.lessons.filter(l=>l.id!=='p15').concat(lesson);
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

test('source ratios and brackets diagnose the entered error and restore the work',async()=>{
 const f=fixture(null,null,true);
 try {
  const numeric=(route,value,expected)=>{
   f.nav(route); f.event('#final-answer',value); f.submit('#answer-form');
   assert.match(f.q('.answer-form .feedback').textContent,expected);
  };
  numeric('#lesson/p15/0','2',/обратном порядке/);
  assert.equal(f.state().tasks['p15-t01'].assisted,false);
  assert.equal(f.state().tasks['p15-t01'].correct,false);
  assert.equal(f.d.querySelectorAll('meter').length,0);
  f.event('#final-answer','15/30');assert.equal(f.q('.answer-form .feedback').textContent,'');
  f.submit('#answer-form');assert.match(f.q('.answer-form .feedback').textContent,/Значение верно.*общий делитель/);
  f.event('#final-answer','1/2');f.submit('#answer-form');
  assert.match(f.q('.task-heading').textContent,/Исправлено без подсказки/);
  assert.equal(f.state().tasks['p15-t01'].independent,false);
  numeric('#lesson/p15/1','7/3',/обратном порядке/);
  numeric('#lesson/p15/2','0,8',/нашёл долю/);
  numeric('#lesson/p15/4','250',/единицы/);
  f.click('[data-action="hint"]');
  assert.deepEqual([...f.d.querySelectorAll('.help meter')].map(m=>[m.value,m.max]),[[8,32],[32,32]]);
  assert.equal(f.state().tasks['p15-t05'].assisted,true);
  numeric('#lesson/p15/5','300',/и часы, и минуты/);
  f.nav('#lesson/p15/3');f.click('[data-choice="1"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/порядок двух результатов/);
  f.click('[data-choice="2"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/оба отношения/);
  f.nav('#lesson/p33/0');f.click('[data-choice="2"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/второго слагаемого/);
  f.click('[data-action="hint"]');assert.match(f.q('.help figure').textContent,/−1 × \(a\) и −1 × \(−b\)/);
  f.click('[data-action="detour"][data-skill="bracket-evaluate"]');await f.settle();
  assert.equal(f.w.location.hash,'#practice/bracket-evaluate/1');
  const first=f.q('.prompt').textContent;f.click('[data-action="new"]');assert.notEqual(f.q('.prompt').textContent,first);
  f.click('[data-action="return"]');await f.settle();
  assert.equal(f.w.location.hash,'#lesson/p33/0');
  assert.match(f.q('.answer-form .feedback').textContent,/второго слагаемого/);
  f.click('[data-choice="0"]');f.submit('#answer-form');
  f.click('[data-action="independent-check"]');await f.settle();
  assert.equal(f.w.location.hash,'#check/bracket-evaluate/1');
  assert.equal(f.d.querySelector('[data-action="hint"]'),null);
  numeric('#lesson/p33/1','-19,73',/последнее слагаемое/);
  numeric('#lesson/p33/1','5,17',/знак перед всеми скобками/);
  f.nav('#lesson/p33/2');f.click('[data-choice="0"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/постоянную часть/);
  numeric('#lesson/p33/3','-14',/постоянную часть/);
  const restored=fixture(f.state(),null,true);
  try {restored.nav('#lesson/p33/3');assert.match(restored.q('.answer-form .feedback').textContent,/постоянную часть/);}
  finally {restored.close();}
 } finally {f.close();}
});

test('numbered applications distinguish part from whole and a rate from its reciprocal',async()=>{
 const f=fixture(null,null,true);
 try {
  f.nav('#lesson/p15/9');
  f.event('#final-answer','2,5');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/массу воды/);
  assert.equal(f.state().tasks['p15-t10'].correct,false);
  f.click('[data-action="hint"]');
  assert.match(f.q('.help figure').textContent,/масса воды \+ масса соли/);
  f.event('#final-answer','100/41');f.submit('#answer-form');
  assert.equal(f.state().tasks['p15-t10'].correct,true);
  assert.equal(f.state().tasks['p15-t10'].assisted,true);
  f.click('[data-action="independent-check"]');await f.settle();
  assert.equal(f.w.location.hash,'#check/percent-ratio/1');
  f.nav('#lesson/p15/6');f.event('#final-answer','9');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/без всходов/);
  f.event('#final-answer','91');f.submit('#answer-form');
  assert.match(f.q('.task-heading').textContent,/Исправлено без подсказки/);
  f.nav('#lesson/p15/11');f.click('[data-choice="0"]');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/обратный вопрос/);
  f.click('[data-action="hint"]');assert.match(f.q('.help figure').textContent,/4 м.*2 мин/);
  f.click('[data-choice="1"]');f.submit('#answer-form');
  assert.equal(f.state().tasks['p15-t12'].correct,true);
  f.click('#problem [data-action="task"][data-index="12"]');await f.settle();
  assert.equal(f.w.location.hash,'#lesson/p15/12');
  assert.equal(f.state().tasks['p15-t13'].correct,false);
  f.nav('#home');
  f.event('#book-part','2','change');f.event('#exercise-number','11');f.submit('#number-form');
  assert.equal(f.d.querySelectorAll('#number-result a[href^="#lesson/p15/"]').length,6);
 } finally {f.close();}
});

test('source equations retain a signed correction and the comparison of sides',async()=>{
 const f=fixture(null,null,true);
 try{
  f.nav('#lesson/p33/15');
  f.event('#final-answer','-3,6');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/для −k/);
  f.event('#final-answer','3,6');f.submit('#answer-form');
  assert.match(f.q('.task-heading').textContent,/Исправлено без подсказки/);
  f.nav('#lesson/p33/17');
  f.event('#final-answer','17,3');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/большая/);
  f.click('[data-action="hint"]');assert.match(f.q('.help figure').textContent,/y см и ещё 1,9 см/);
  f.event('#final-answer','15,4');f.submit('#answer-form');
  assert.equal(f.state().tasks['p33-t18'].assisted,true);
  f.click('#problem [data-action="task"][data-index="16"]');await f.settle();
  assert.equal(f.w.location.hash,'#lesson/p33/16');
  assert.match(f.q('.prompt').textContent,/конкурс/);
 }finally{f.close();}
});

test('segment construction measures AC and CB on one scale without assigning credit',async()=>{
 const f=fixture(null,null,true);
 try{
  for(const [i,valid] of [[17,[6]],[18,[7,8,9,10,11]],[19,[0,1,2,3,4,5]],[20,[8]]]){
   f.nav('#lesson/p15/'+i);
   const model=f.q('[data-lesson-help="model"]');if(!model.open)f.click('[data-lesson-help="model"] > summary');
   for(let position=0;position<=12;position++){
    f.event('#model select',String(position),'change');
    const text=f.q('#model .pm-result').textContent;
    if(position===12)assert.match(text,/не определено/);
    else{
     assert.equal(text.includes('положение подходит для'),valid.includes(position));
     assert.match(text,new RegExp('AC = '+position+', CB = '+(12-position)));
    }
    assert.equal(f.q('#model svg circle').getAttribute('cx'),String(24+26*position));
   }
   assert.equal(f.d.querySelector('#answer-form'),null);
   assert.equal(f.state().tasks['p15-t'+(i+1)].correct,false);
  }
  f.event('#model select','8','change');
  f.event('#notebook','Взял отрезок 12 см. AC = 8 см, CB = 4 см.');
  f.click('[data-action="record-manual"]');
  const saved=f.state(),g=fixture(saved,null,true);
  try{g.nav('#lesson/p15/20');assert.equal(g.q('#model select').value,'8');assert.match(g.q('#notebook').value,/8 см/);
   assert.equal(g.state().tasks['p15-t21'].correct,false);
  }finally{g.close();}
 }finally{f.close();}
});

test('ratio constructions preserve scale, right angles and the angular partition',()=>{
 const f=fixture(null,null,true);
 try {
  for(const [index,kind] of ['segments','rectangle','triangle','angle'].entries()) {
   const number=21+index;
   f.nav('#lesson/p15/'+number);
   const model=f.q('[data-lesson-help="model"]');
   if(!model.open)f.click('[data-lesson-help="model"] > summary');
   for(const value of (kind==='angle'?[0,10,20,30,40,50,60]:[1,2,3])) {
    f.event('#model select',String(value),'change');
    const diagram=f.q('#model svg'),feedback=f.q('#model .pm-result').textContent;
    if(kind==='segments') {
     const lines=[...diagram.querySelectorAll('line')].filter(line=>line.getAttribute('x1')!==line.getAttribute('x2'));
     const lengths=lines.map(line=>Number(line.getAttribute('x2'))-Number(line.getAttribute('x1')));
     assert.deepEqual(lengths,[34*value,51*value]);
    } else if(kind==='rectangle') {
     const side=diagram.querySelector('rect');
     assert.equal(Number(side.getAttribute('width')),85*value);
     assert.equal(Number(side.getAttribute('height')),51*value);
    } else if(kind==='triangle') {
     const [p,q,r]=diagram.querySelector('polygon').getAttribute('points').split(' ').map(pair=>pair.split(',').map(Number));
     assert.equal(p[1],q[1]);assert.equal(p[0],r[0]);
     assert.equal(Math.hypot(q[0]-r[0],q[1]-r[1]),85*value);
     assert.match(feedback,/Короткий катет.*Длинный катет/);
    } else {
     const ray=diagram.querySelector('line[stroke-dasharray]');
     const radians=Math.atan2(199-Number(ray.getAttribute('y2')),Number(ray.getAttribute('x2'))-47);
     assert(Math.abs(radians*180/Math.PI-value)<1e-9);
     if(value===0||value===60)assert.match(feedback,/совпал со стороной/);
     else if(value===20||value===40)assert.match(feedback,/часть занимает одну долю/);
     else assert.match(feedback,/больший угол должен быть/);
    }
    assert.equal(f.d.querySelector('#answer-form'),null);
    assert.equal(f.state().tasks['p15-t'+(number+1)].correct,false);
   }
  }
 } finally { f.close(); }
});

test('fresh practice uses its own operands and withholds cues during an independent check',async()=>{
 const f=fixture(null,null,true);
 try {
  for(const level of [1,2,3]) {
   for(const skill of ['ratio','bracket-evaluate']) {
    f.nav('#practice/'+skill+'/'+level);
    for(let example=0;example<3;example++) {
     const seed=f.state().practice[skill+':'+level].seed;
     const t=f.w.PetersonMath.generate(skill,seed,level,2),{left,right,third}=t.calculation;
     const [a,b,c]=[left,right,third].map(Number);
     const wrong=skill==='ratio'?b+'/'+a:String(a-b-c);
     if(!f.w.PetersonMath.equal(wrong,t.answer)){
      f.event('#final-answer',wrong);f.submit('#answer-form');
      assert.match(f.q('.answer-form .feedback').textContent,skill==='ratio'?/обратном порядке/:/скобками|слагаемое/);
     }
     f.click('[data-action="hint"]');
     if(skill==='ratio')assert.deepEqual([...f.d.querySelectorAll('.help meter')].map(m=>m.value),[a,b]);
     else assert.ok(f.q('.help figure').textContent.includes('−('+third+')'));
     f.click('[data-action="new"]');
    }
   }
  }
  f.nav('#check/ratio/1');
  f.event('#final-answer','12345');f.submit('#answer-form');
  assert.match(f.q('.answer-form .feedback').textContent,/Пока не совпало/);
  assert.equal(f.d.querySelector('.help figure'),null);
 }finally{f.close();}
});

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

test('revealing a model or opening theory records help and preserves previously earned independence',()=>{
 for(const kind of ['model','theory']){
  const f = fixture();
  try {
   f.nav('#lesson/p08/0');
   const task = f.w.PetersonCourse.lessons.find(l => l.id === 'p08').tasks[0];
   const panel = '[data-lesson-help="' + kind + '"]';
   assert.equal(f.q(panel).open, false);
   f.event('#final-answer', '0,86');
   f.event('#notebook', 'Не потерять запись');
   f.click(panel + ' > summary');
   assert.equal(f.q(panel).open, true);
   assert.equal(f.q('#final-answer').value, '0,86');
   assert.equal(f.q('#notebook').value, 'Не потерять запись');
   if (kind === 'model') {
    assert.equal(f.state().tasks[task.id].assisted, false, 'the experiment is still hidden');
    f.click('[data-inquiry-open]');
   }
   f.click(panel + ' > summary');
   assert.equal(f.state().tasks[task.id].assisted, true, 'closing cannot undo assistance');
   f.event('#final-answer', task.answer);
   f.submit('#answer-form');
   assert.equal(f.state().tasks[task.id].correct, true);
   assert.equal(f.state().tasks[task.id].independent, false);
  } finally { f.close(); }
 }
 const f=fixture();try{f.nav('#lesson/p08/0');const task=f.w.PetersonCourse.lessons.find(l=>l.id==='p08').tasks[0];f.event('#final-answer',task.answer);f.submit('#answer-form');const earned=f.state().tasks[task.id].completion;assert.equal(earned.independent,true);for(const kind of ['model','theory'])f.click('[data-lesson-help="'+kind+'"] > summary');f.click('[data-inquiry-open]');f.event('#model .pm-experiment input','7');assert.deepEqual(f.state().tasks[task.id].completion,earned);assert.equal(f.state().tasks[task.id].independent,true);}finally{f.close();}
});

test('part three switches from automatic answer to the actual manual card before the queued hash event',()=>{
 const f=fixture();try{
  f.nav('#lesson/p39');assert.equal(f.d.querySelectorAll('#answer-form').length,1);
  f.click('.side-list [data-index="1"]');
  assert.equal(f.w.location.hash,'#lesson/p39/1');
  assert.equal(f.q('.side-list [aria-current="step"]').dataset.index,'1');
  assert.equal(f.q('#problem .task-heading h2').textContent,f.w.PetersonCourse.lessons.find(l=>l.id==='p39').tasks[1].title);
  assert.equal(f.d.querySelectorAll('#answer-form').length,0);
  assert(f.q('.manual-work'));assert(f.q('[data-action="record-manual"]'));
 }finally{f.close();}
});
