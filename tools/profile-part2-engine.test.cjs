'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const api=require('../ege-profil/part-two/state.js'),checker=require('../ege-profil/start/checks.js');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'ege-profil/part-two');
const bank=['algebra','geometry','models'].flatMap(name=>require(path.join(folder,'content-'+name+'.js')));
const pause=()=>new Promise(r=>setImmediate(r));
async function settle(w){await w.ProfilePartTwoApp.store.flush();await pause();await w.ProfilePartTwoApp.store.flush();await pause();}
async function boot(hash='map',entries=[]){
 const dom=new JSDOM(fs.readFileSync(path.join(folder,'index.html'),'utf8'),{url:'https://mathexam.space/ege-profil/part-two/#'+hash,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.scrollTo=()=>{};
 entries.forEach(([k,v])=>w.localStorage.setItem(k,v));
 for(const script of w.document.querySelectorAll('script[src]')){const src=script.getAttribute('src').split('?')[0];if(src.startsWith('/assets/'))continue;w.eval(fs.readFileSync(path.resolve(folder,src),'utf8'));}
 await settle(w);return dom;
}
async function go(w,hash){w.location.hash=hash;await new Promise(r=>setTimeout(r,0));await w.ProfilePartTwoApp.render();await settle(w);}
function input(w,id,value){const el=w.document.getElementById(id);assert(el,id);el.value=String(value);el.dispatchEvent(new w.Event('input',{bubbles:true}));}
async function submit(w,id){w.document.getElementById(id).dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));await settle(w);}
const memory=()=>{const values=new Map();return{getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v))};};

test('safe answer parser accepts fractions, roots, pi, unordered roots and exact unions without erasing boundaries',()=>{
 for(const [answers,value] of [[['3/4'],'0,75'],[['3sqrt(2)'],'sqrt(18)'],[['π/6'],'pi/6'],[['1;2'],'2;1'],[['(-∞;1)∪(3;+∞)'],'(3;∞) или (-∞;1)']])assert(api.matches(answers,value,checker),value);
 for(const [answers,value]of [[['[1;2]'],'(1;2)'],[['1'],''],[['1'],'globalThis.x=1'],[['1'],'1.001'],[['(1;+∞)'],'[1;+∞)']])assert(!api.matches(answers,value,checker),value);
});

test('numeric matching rejects invalid intermediate domains, including inside unordered root lists',()=>{
 for(const [answer,input] of [
  ['4','sqrt(-4)^2'],['1','(sqrt(-4))^0'],['1','(1/0)^0'],
  ['1','(0/0)^0'],['1','(0^-1)^0'],['1','0^0'],
  ['0','1/((10^50)^50)'],['1;4','1;sqrt(-4)^2'],['0;1','0;(1/0)^0']
 ])assert(!api.matches([answer],input,checker),input);
 for(const [answer,input] of [['4','sqrt((-4)^2)'],['4','sqrt(4)^2'],['0','0^2'],['1','1^0']])assert(api.matches([answer],input,checker),input);
});

test('actual final form never completes a task for an invalid expression that formerly matched its numeric answer',async()=>{
 const lesson=bank.find(l=>l.id==='p14-circle-selection'),task=lesson.tasks[3],hash='task/'+task.id+'/independent';
 for(const [expression,oldValue] of [['sqrt(-4)^2',4],['(sqrt(-4))^0',1],['(1/0)^0',1]]){
  let dom=await boot(hash),w=dom.window;
  try {
   const invalid=`(${task.final[0].answers[0]})+(${expression})-${oldValue}`;
   task.final.forEach((field,i)=>input(w,'final-'+i,i===0?invalid:field.answers[0]));
   input(w,'proof-draft','Моё обоснование остаётся на месте');
   await submit(w,'final-form');
   const r=w.ProfilePartTwoApp.store.read(task.id);
   assert(!r.completed&&!r.independent,expression+' cannot earn success');
   assert(r.attempts.every(a=>!a.correct));
   assert(!w.document.getElementById('completion'));
   assert.equal(r.drafts.final[0],invalid);
   assert.equal(r.drafts.proof,'Моё обоснование остаётся на месте');
   // The existing ordinary-final-format attempt policy is intentionally not
   // changed here; H04 separately classifies unreadable input without penalty.
   const entries=Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]);
   w.close();dom=await boot(hash,entries);w=dom.window;
   assert.equal(w.document.getElementById('final-0').value,invalid);
   assert(!w.ProfilePartTwoApp.store.read(task.id).completed);
   task.final.forEach((field,i)=>input(w,'final-'+i,field.answers[0]));
   await submit(w,'final-form');
   assert(w.ProfilePartTwoApp.store.read(task.id).completed,'valid answer still completes the task');
   assert.equal(w.document.getElementById('proof-draft').value,'Моё обоснование остаётся на месте');
  }finally{w.close();}
 }
});

test('open answers preserve exact roots and accept equivalent unions without filling a hole',()=>{
 const roots={answers:['-2; 4'],excluded:7};
 assert(api.openAnswer(roots,'{8/2; -2,0; 4}').correct);
 assert(!api.openAnswer(roots,'-2;4,00000000000000001').correct);
 assert.match(api.openAnswer(roots,'-2; 4; 7').hint,/знаменатель/);
 assert(!api.openAnswer(roots,'-2;4;1/0').recognized);
 const intervals={answers:['(−∞; −2) ∪ (−2; +∞)']};
 assert(api.openAnswer(intervals,'(-4/2; +∞) или (−∞; −2)').correct);
 assert(api.openAnswer(intervals,'(-∞; -4] ∪ (-4; -2) ∪ (-2; ∞)').correct);
 assert(!api.openAnswer(intervals,'(-∞; -2] ∪ (-2; ∞)').correct);
 assert(!api.openAnswer(intervals,'[-∞; -2) ∪ (-2; ∞)').recognized);
 assert(!api.openAnswer(intervals,'(-∞; -2] ∪').recognized);
});

test('independent open answer keeps prior fields, distinguishes format from attempts and restores correction',async()=>{
 const task=bank.find(l=>l.id==='p14-rational-hole').tasks[5],hash='task/'+task.id+'/independent';
 const storage=memory(),seed=api.create(storage);
 await seed.patch(task.id,r=>{r.drafts.final=['2','-6'];r.drafts.proof='Мой черновик';});
 const dom=await boot(hash,[[seed.key(task.id),storage.getItem(seed.key(task.id))]]),w=dom.window,d=w.document;
 const read=()=>w.ProfilePartTwoApp.store.read(task.id);
 try {
  assert.equal(d.querySelectorAll('[data-final]').length,1);
  assert.doesNotMatch(d.querySelector('.condition').textContent,/количество корней/);
  assert.equal(d.querySelector('#final-0').value,'');
  assert.match(d.querySelector('.earlier-final').textContent,/-6/);
  input(w,'final-0','-6;');await submit(w,'final-form');
  assert.equal(read().attemptCount,0);
  assert.match(d.querySelector('#feedback').textContent,/формат/);
  input(w,'final-0','-6; 2; 7');await submit(w,'final-form');
  assert.match(d.querySelector('#feedback').textContent,/знаменатель/);
  input(w,'final-0','2; -6');await submit(w,'final-form');
  await submit(w,'final-form');
  assert(read().completed);assert(read().independent);
  assert.match(d.querySelector('#completion').textContent,/исправлен самостоятельно/);
  assert.equal(read().attemptCount,2);
  assert.deepEqual(Array.from(read().drafts.final),['2','-6']);
  const next=await boot(hash,[[seed.key(task.id),w.localStorage.getItem(seed.key(task.id))]]);
  assert.equal(next.window.document.querySelector('#final-0').value,'2; -6');
  assert.equal(next.window.document.querySelector('#proof-draft').value,'Мой черновик');
  input(next.window,'final-0','-6; 2; 7');await submit(next.window,'final-form');
  assert.match(next.window.document.querySelector('#feedback').textContent,/знаменатель/);
  const repeated=next.window.ProfilePartTwoApp.store.read(task.id);
  assert(repeated.completed);assert(repeated.independent);assert.equal(repeated.attemptCount,3);
  next.window.close();
 }finally{w.close();}
});

test('state retains first wrong attempt, separate help, unique completion, bounded history and fresh cross-tab writes',async()=>{
 const storage=memory(),a=api.create(storage),b=api.create(storage);
 await a.attempt('task-a',{kind:'final',answers:['7'],correct:false,mode:'independent',independentEligible:true});
 await b.patch('task-a',s=>{s.drafts.proof='Свежий текст другой вкладки';s.helped=true;});
 await a.attempt('task-a',{kind:'final',answers:['8'],correct:true,mode:'independent',independentEligible:true});
 assert.equal(a.read('task-a').independent,false);assert.equal(a.read('task-a').completed,true);assert.equal(a.read('task-a').attempts[0].answers[0],'7');assert.equal(a.read('task-a').drafts.proof,'Свежий текст другой вкладки');
 await a.attempt('task-b',{kind:'final',answers:['8'],correct:false,mode:'independent',independentEligible:true});
 await a.attempt('task-b',{kind:'final',answers:['9'],correct:true,mode:'independent',independentEligible:true});
 assert.equal(a.read('task-b').independent,true,'unassisted self-correction is independent, first error remains');
 for(let i=0;i<70;i++)await a.attempt('task-a',{kind:'final',answers:[i],correct:true,mode:'guided'});
 assert.equal(a.read('task-a').attempts.length,60);assert.equal(a.read('task-a').attempts[0].answers[0],'7');
});

test('malformed saves are preserved and a failed save keeps current working memory',async()=>{
 const storage=memory();storage.setItem(api.PREFIX+'broken','{not json');let warnings=0;
 const state=api.create(storage,{onWarning:()=>warnings++});await state.patch('broken',r=>{r.drafts.proof='Новое обоснование';});
 assert.equal(storage.getItem(api.PREFIX+'broken'),'{not json');assert.equal(state.read('broken').drafts.proof,'Новое обоснование');assert.equal(warnings,1);
 const bad=state.read('another');bad.solvedSteps=[99];assert(!api.valid(bad,'another'));
});

test('all seven sections and every lesson/task render with the authored answer fields',async()=>{
 const dom=await boot(),w=dom.window,d=w.document;
 assert.equal(d.querySelectorAll('.grid .card').length,8,'seven official entries, including finance, plus optimization');
 for(const lesson of bank){await go(w,'lesson/'+lesson.id);assert.equal(d.querySelectorAll('.task-link').length,6);assert(d.querySelector('a[href="'+w.ProfileExamMap.hash(w.ProfileExamMap.fromLegacyPartTwo(lesson.exam))+'"]'));}
 for(const lesson of bank)for(const [index,task] of lesson.tasks.entries()){await go(w,'task/'+task.id+'/independent');assert.equal(d.querySelectorAll('[data-final]').length,index>=3&&task.independentFinal?1:task.final.length,task.id);assert(d.querySelector('#proof-draft'),task.id+' proof');assert.match(d.querySelector('.proof-status').textContent,/требует проверки/);}
 w.close();
});

test('empty, wrong, hinted and correct answers preserve drafts and truthfully separate assistance after reload',async()=>{
 const lesson=bank[0],task=lesson.tasks[3],dom=await boot('task/'+task.id+'/independent'),w=dom.window;
 await submit(w,'final-form');assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,0);
 task.final.forEach((_,i)=>input(w,'final-'+i,'99999'));await submit(w,'final-form');assert.equal(w.ProfilePartTwoApp.store.read(task.id).attempts[0].correct,false);
 input(w,'proof-draft','Моё обоснование и ограничения');w.document.getElementById('request-help').click();await settle(w);
 task.final.forEach((field,i)=>input(w,'final-'+i,field.answers[0]));await submit(w,'final-form');
 const r=w.ProfilePartTwoApp.store.read(task.id);assert(r.completed);assert(!r.independent);assert.equal(r.attempts[0].answers[0],'99999');assert.equal(w.document.getElementById('proof-draft').value,'Моё обоснование и ограничения');assert(w.document.querySelector('#completion a'));
 const entries=Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]);w.close();const next=await boot('task/'+task.id+'/independent',entries);assert(next.window.document.getElementById('completion'));assert.match(next.window.document.querySelector('.proof-status').textContent,/требует проверки/);next.window.close();
});

test('guided accepted steps retain literal drafts and do not affect independent count',async()=>{
 const lesson=bank[0],task=lesson.tasks[0],dom=await boot('task/'+task.id+'/guided'),w=dom.window;
 for(let i=0;i<task.steps.length;i++){input(w,'step-answer',task.steps[i].answers[0]);await submit(w,'step-form');assert.equal(w.document.querySelectorAll('.step-done').length,i+1);}
 task.final.forEach((field,i)=>input(w,'final-'+i,field.answers[0]));await submit(w,'final-form');const r=w.ProfilePartTwoApp.store.read(task.id);assert.equal(r.drafts.steps.length,task.steps.length);assert(r.completed);assert(!r.independent);assert.match(w.document.getElementById('completion').textContent,/Другое условие самостоятельно/);w.close();
});

test('same-task stale step never grades a different prompt and current-mode click refreshes safely',async()=>{
 const task=bank[0].tasks[0],dom=await boot('task/'+task.id+'/guided'),w=dom.window;
 await w.ProfilePartTwoApp.store.patch(task.id,s=>{s.solvedSteps=[0];});
 input(w,'step-answer',task.steps[0].answers[0]);await submit(w,'step-form');
 assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,0);
 assert.match(w.document.getElementById('feedback').textContent,/другой вкладке/);
 w.document.querySelector('.modes a[aria-current=page]').click();await settle(w);
 assert.match(w.document.querySelector('#step-form .eyebrow').textContent,/Шаг 2/);w.close();
});

test('a pending help or correct submit cannot replace a newer route',async()=>{
 const task=bank[0].tasks[3],dom=await boot('task/'+task.id+'/independent'),w=dom.window;
 w.document.getElementById('request-help').click();w.location.hash='progress';await w.ProfilePartTwoApp.render();await settle(w);assert.equal(w.document.querySelector('h1').textContent,'Мой прогресс');
 await go(w,'task/'+bank[1].tasks[3].id+'/independent');const freshTask=bank[1].tasks[3];freshTask.final.forEach((field,i)=>input(w,'final-'+i,field.answers[0]));w.document.getElementById('final-form').dispatchEvent(new w.Event('submit',{cancelable:true}));w.location.hash='exam/19';await w.ProfilePartTwoApp.render();await settle(w);assert.equal(w.document.querySelector('h1').textContent,'Задачи с параметром');w.close();
});

test('task-bound invalid solved-prefix is preserved without crashing its page',async()=>{
 const task=bank[0].tasks[0],storage=memory(),state=api.create(storage);await state.patch(task.id,s=>{s.solvedSteps=Array.from({length:task.steps.length+1},(_,i)=>i);});
 const raw=storage.getItem(api.PREFIX+task.id),dom=await boot('task/'+task.id+'/guided',[[api.PREFIX+task.id,raw]]),w=dom.window;
 assert(w.document.getElementById('step-form'));assert.equal(w.localStorage.getItem(api.PREFIX+task.id),raw);assert(!w.document.getElementById('save-warning').hidden);w.close();
});

test('solution is disclosed one step at a time and always contaminates independent credit',async()=>{
 const task=bank[0].tasks[3],dom=await boot('task/'+task.id+'/independent'),w=dom.window;
 w.document.getElementById('show-solution').click();await settle(w);
 assert.equal(w.document.querySelectorAll('.solution-list li').length,1);
 for(let i=1;i<task.solution.length;i++){w.document.getElementById('solution-next').click();await settle(w);assert.equal(w.document.querySelectorAll('.solution-list li').length,i+1);}
 assert(!w.document.getElementById('solution-next'));assert(w.ProfilePartTwoApp.store.read(task.id).helped);w.close();
});

test('correct guided step is saved even when learner immediately leaves the task',async()=>{
 const task=bank[0].tasks[0],dom=await boot('task/'+task.id+'/guided'),w=dom.window;
 input(w,'step-answer',task.steps[0].answers[0]);w.document.getElementById('step-form').dispatchEvent(new w.Event('submit',{cancelable:true}));w.location.hash='map';await w.ProfilePartTwoApp.render();await settle(w);
 assert.equal(w.ProfilePartTwoApp.store.read(task.id).solvedSteps.length,1);assert.match(w.document.querySelector('h1').textContent,/Вторая часть/);w.close();
});

// The existing profile workflow installs pinned Playwright and Chromium before
// this file and always uploads /tmp/profile-part2-shots. Native acceptance is
// mandatory in CI; a local run must opt in, and never substitutes JSDOM.
test('native Chromium H01 numeric-domain forms at 320, 390 and 1280 pixels',{
 skip:!(process.env.CI||process.env.H01_NATIVE_BROWSER==='1')&&'native acceptance runs in CI Chromium image; set H01_NATIVE_BROWSER=1',
 timeout:300000
},async t=>{
 const http=require('node:http'),{chromium}=require('playwright');
 const shots='/tmp/profile-part2-shots/h01-numeric-domain',realRoot=fs.realpathSync(root);
 const widths=[320,390,1280],token='20261114-numeric-domain';
 const cases=[['sqrt(-4)^2',4,'sqrt((-4)^2)-4'],['(sqrt(-4))^0',1,'sqrt(4)^2-4'],['(1/0)^0',1,'2^-3-1/8']];
 const task=bank.find(l=>l.id==='p14-circle-selection').tasks[3];
 const routes={start:'#practice/vec-coordinates/independent',circle:'#task/m4-1-am/independent','part-two':'#task/'+task.id+'/independent'};
 const report={kind:'native Chromium',jsdom:false,widths,height:900,plannedCases:27,parserToken:token,cases:[]};
 const mime={'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
 const server=http.createServer((req,res)=>{
  try {
   let file=path.resolve(realRoot,'.'+decodeURIComponent(new URL(req.url,'http://fixture').pathname));
   if(!file.startsWith(realRoot+path.sep))return res.writeHead(403).end();
   if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   file=fs.realpathSync(file);
   if(!file.startsWith(realRoot+path.sep))return res.writeHead(403).end();
   res.setHeader('Content-Type',mime[path.extname(file)]||'text/html');res.end(fs.readFileSync(file));
  }catch(_){res.writeHead(404).end();}
 });
 let browser,shutdown;
 const cleanup=()=>shutdown||(shutdown=(async()=>{
  try{if(browser)await browser.close();}finally{if(server.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
 })());
 t.after(cleanup);
 t.signal.addEventListener('abort',()=>{void cleanup().catch(()=>{});},{once:true});
 fs.mkdirSync(shots,{recursive:true});
 try {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+server.address().port;
  // A missing browser or launch error must fail the CI test, not skip it.
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
  report.browserVersion=browser.version();
  for(const width of widths)for(const area of Object.keys(routes))for(const [index,[expression,oldValue,valid]] of cases.entries()){
   await t.test(area+' '+width+'px rejects '+expression,async()=>{
    const row={area,width,expression,assertions:[],screenshots:[],pageErrors:[],consoleErrors:[],badResponses:[],parserResponses:[]};
    report.cases.push(row);
    let context,page;
    const check=(name,actual,expected=true)=>{assert.deepEqual(actual,expected,name);row.assertions.push(name);};
    const capture=async state=>{if(index===0){const name=area+'-'+width+'-'+state+'.png';await page.screenshot({path:path.join(shots,name),fullPage:true});row.screenshots.push(name);}};
    const readPartTwo=()=>page.evaluate(async id=>{await window.ProfilePartTwoApp.store.flush();return window.ProfilePartTwoApp.store.read(id);},task.id);
    const readSimple=()=>page.evaluate(area=>{
     const circle=area==='circle',key=circle?'mathexam.mordkovichCircle.v1':'mathexam.profileStart2027.v1';
     const state=JSON.parse(localStorage.getItem(key)),lesson=circle?'m4-1-am':'vec-coordinates',session=state.sessions[lesson+':independent'],record=state.records[lesson];
     return{session,independent:circle?!!record?.independent:!!record?.independent?.includes(session.taskId)};
    },area);
    try {
     context=await browser.newContext({viewport:{width,height:900}});page=await context.newPage();
     page.setDefaultTimeout(12000);
     page.on('pageerror',e=>row.pageErrors.push(e.message));
     page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text());});
     page.on('response',r=>{if(r.status()>=400)row.badResponses.push({url:r.url(),status:r.status()});if(new URL(r.url()).pathname==='/ege-profil/start/checks.js')row.parserResponses.push({url:r.url(),status:r.status()});});
     await page.goto(origin+'/ege-profil/'+area+'/index.html'+routes[area]);
     await page.locator(area==='part-two'?'#final-form':'#answer-form').waitFor();
     check('new parser version requested',(await page.locator('script[src*="checks.js?v='+token+'"]').getAttribute('src')).includes(token));
     check('no horizontal page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
     if(area==='part-two'){
      row.invalidInput='('+task.final[0].answers[0]+')+('+expression+')-'+oldValue;
      row.validInput='('+task.final[0].answers[0]+')+'+valid;
      const proof='Моё обоснование остаётся на месте';
      for(let i=0;i<task.final.length;i++)await page.locator('#final-'+i).fill(i===0?row.invalidInput:String(task.final[i].answers[0]));
      await page.locator('#proof-draft').fill(proof);
      await page.locator('#final-form button[type=submit]').click();
      await page.waitForFunction(()=>document.getElementById('feedback').textContent.trim().length>0);
      let record=await readPartTwo();
      check('invalid input cannot complete task',record.completed,false);
      check('invalid input earns no independent credit',record.independent,false);
      check('invalid input creates no correct attempt',record.attempts.every(a=>a.correct===false));
      check('no completion panel for invalid input',await page.locator('#completion').count(),0);
      check('literal invalid draft stored',record.drafts.final[0],row.invalidInput);
      check('proof draft retained',record.drafts.proof,proof);
      row.invalidFeedback=await page.locator('#feedback').innerText();
      // H04 owns malformed-answer attempt classification; it is not altered here.
      row.invalidAttemptCount=record.attemptCount;
      await capture('invalid');await page.reload();await page.locator('#final-form').waitFor();
      check('literal invalid draft survives native reload',await page.locator('#final-0').inputValue(),row.invalidInput);
      check('proof draft survives native reload',await page.locator('#proof-draft').inputValue(),proof);
      check('reload shows no completion',await page.locator('#completion').count(),0);
      check('reload earns no independent credit',(await readPartTwo()).independent,false);
      await page.locator('#final-0').fill(row.validInput);await page.locator('#final-form button[type=submit]').click();await page.locator('#completion').waitFor();
      record=await readPartTwo();
      check('valid root/power answer completes task',record.completed);
      check('only valid answer earns independent credit',record.independent);
      check('valid answer creates a correct attempt',record.attempts.some(a=>a.correct===true));
      check('proof retained after valid answer',record.drafts.proof,proof);
      row.validFeedback=await page.locator('#feedback').innerText();
      await capture('valid');await page.reload();await page.locator('#completion').waitFor();
      record=await readPartTwo();
      check('valid completion survives native reload',record.completed&&record.independent);
      check('literal valid root/power draft survives',await page.locator('#final-0').inputValue(),row.validInput);
     }else{
      const circle=area==='circle',before=await readSimple();
      const answer=circle?'3π/4':await page.evaluate(id=>String(window.ProfileLessons.find(l=>l.id==='vec-coordinates').tasks.find(t=>t.id===id).answer),before.session.taskId);
      row.taskId=before.session.taskId;row.invalidInput='('+answer+')+('+expression+')-'+oldValue;row.validInput='('+answer+')+'+valid;
      const field='#answer-form input[type=text]',button=circle?'#check':'#submit-answer';
      await page.locator(field).fill(row.invalidInput);await page.locator(button).click();
      row.invalidFeedback=await page.locator('#feedback').innerText();
      check('invalid input receives format feedback',/Не удалось прочитать/.test(row.invalidFeedback));
      let state=await readSimple();
      check('format error is not a mathematical mistake',!!state.session.wrong,false);
      check('invalid input cannot complete task',!!(state.session.done||state.session.solved||state.session.answers?.length),false);
      check('invalid input earns no independent credit',state.independent,false);
      check('next disabled for invalid input',await page.locator('#next').isDisabled());
      await capture('invalid');await page.reload();await page.locator('#answer-form').waitFor();
      check('literal invalid draft survives native reload',await page.locator(field).inputValue(),row.invalidInput);
      check('next remains disabled after reload',await page.locator('#next').isDisabled());
      check('reload earns no independent credit',(await readSimple()).independent,false);
      await page.locator(field).fill(row.validInput);await page.locator(button).click();
      row.validFeedback=await page.locator('#feedback').innerText();
      check('valid root/power answer receives correct feedback',/^Верно/.test(row.validFeedback));
      check('next enabled for valid answer',await page.locator('#next').isEnabled());
      await capture('valid');await page.locator('#next').click();await page.locator('.result-panel').waitFor();
      check('only valid answer earns independent credit',(await readSimple()).independent);
      await page.reload();await page.locator('.result-panel').waitFor();
      check('valid independent completion survives native reload',(await readSimple()).independent);
     }
     check('real parser resource loaded on each navigation',row.parserResponses.length>=3&&row.parserResponses.every(r=>r.status===200&&r.url.includes(token)));
     check('no page errors',row.pageErrors,[]);check('no console errors',row.consoleErrors,[]);check('no HTTP errors',row.badResponses,[]);
     row.status='passed';
    }catch(error){
     row.status='failed';row.error=error.stack||String(error);
     const name=area+'-'+width+'-case'+index+'-failure.png';
     if(page)await page.screenshot({path:path.join(shots,name),fullPage:true}).then(()=>row.screenshots.push(name)).catch(()=>{});
     throw error;
    }finally{if(context)await context.close();}
   });
  }
 }catch(error){report.error=error.stack||String(error);throw error;}
 finally{
  report.summary={cases:report.cases.length,passed:report.cases.filter(r=>r.status==='passed').length,failed:report.cases.filter(r=>r.status==='failed').length,notRun:27-report.cases.length,widths};
  fs.writeFileSync(path.join(shots,'results.json'),JSON.stringify(report,null,2)+'\n');
  t.diagnostic('H01_NATIVE_DOMAIN_BROWSER '+JSON.stringify(report.summary));
  await cleanup();
 }
 assert.equal(report.summary.passed,27,'all 27 native form cases must pass');
});

// The existing CI profile driver invokes H02 contract and mandatory native gates.
require('./profile-fipi-2027-contract.test.cjs');
require('./profile-fipi-2027-browser.cjs');
