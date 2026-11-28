'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const api=require('../ege-profil/part-two/state.js'),checker=require('../ege-profil/start/checks.js');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'ege-profil/part-two');
const bank=['algebra','geometry','models'].flatMap(name=>require(path.join(folder,'content-'+name+'.js')));
const numericLesson=bank.find(lesson=>lesson.id==='p2-15-section-volume');
const pause=()=>new Promise(resolve=>setImmediate(resolve));
const invalidNumbers=['','   ','abc','1/','1/0','sqrt(-4)^2','(1/0)^0','0^0'];
function memory(){const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};}
async function settle(w){await w.ProfilePartTwoApp.store.flush();await pause();await w.ProfilePartTwoApp.store.flush();await pause();}
async function boot(hash,storage){
 const dom=new JSDOM(fs.readFileSync(path.join(folder,'index.html'),'utf8'),{url:'https://mathexam.space/ege-profil/part-two/#'+hash,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=()=>{};w.scrollTo=()=>{};
 if(storage)Object.defineProperty(w,'localStorage',{value:storage});
 for(const script of w.document.querySelectorAll('script[src]')){
  const src=script.getAttribute('src').split('?')[0];if(src.startsWith('/assets/'))continue;
  w.eval(fs.readFileSync(path.resolve(folder,src),'utf8'));
 }
 await settle(w);return dom;
}
function input(w,id,value){const element=w.document.getElementById(id);assert(element,id);element.value=String(value);element.dispatchEvent(new w.Event('input',{bubbles:true}));}
function dispatch(w,id){const form=w.document.getElementById(id);assert(form,id);form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));}
async function submit(w,id){dispatch(w,id);await settle(w);}
function fillFinal(w,task){task.final.forEach((field,index)=>input(w,'final-'+index,field.answers[0]));}
function gradeState(record){return JSON.parse(JSON.stringify(Object.fromEntries(['attemptCount','wrong','attempts','solvedSteps','hints','proofChecks','helped','solution','solutionSteps','completed','independent'].map(key=>[key,record[key]]))));}
function findField(answerFormat,collection,predicate=()=>true){
 for(const lesson of bank)for(const task of lesson.tasks.slice(collection==='final'?3:0))for(const [index,field] of task[collection].entries()){
  if(field.answerFormat===answerFormat&&predicate(field,task))return{lesson,task,index,field};
 }
 throw Error('No authored field for '+answerFormat+' in '+collection);
}

test('every authored answer alias is recognized by its declared type without changing correctness',()=>{
 let fields=0,aliases=0;
 for(const lesson of bank)for(const task of lesson.tasks){
  for(const field of [...task.steps,...task.final,...(task.independentFinal?[task.independentFinal]:[])]){
   assert.equal(typeof field.answerFormat,'string',task.id+' explicit answer type');fields++;
   for(const value of field.answers){
    const result=api.recognize(field,String(value),checker);
    assert.equal(result.recognized,true,task.id+' '+field.answerFormat+' '+value);
    assert.equal(typeof result.format,'string');
    if(field===task.independentFinal)assert(api.openAnswer(field,String(value)).correct,task.id+' open alias '+value);
    else assert(api.matches(field.answers,String(value),checker),task.id+' alias '+value);
    aliases++;
   }
  }
 }
 assert.equal(bank.flatMap(lesson=>lesson.tasks).filter(task=>!task.equationAnswer).length,252,'H04 preserves its complete condition bank');
 assert.equal(fields,1364);assert(aliases>fields);
});

test('recognition accepts meaningful wrong values by field type, independent of the answer key',()=>{
 const examples={
  number:['0','-7','3/4','0,75','π/6','sqrt(2)','2^-3'],
  'yes-no':['да','нет',' НЕТ '],
  constraint:['>0','t>0','t < 0','t>=0'],
  monotonicity:['возрастает','убывает'],
  relation:['>','<','≥','≤','>=','<=','=','!='],
  position:['внутри','на границе','вне'],
  'number-or-none':['нет','0','-3','3/4'],
  'number-or-infinity':['бесконечно много','бесконечность','∞','0','2'],
  'parameter-set':['a>2','а>2','2<a','2<а','a<2','(2;+∞)','[1;2]'],
  'solution-set':['нет решений','∅','пустое множество','[1;2]','{3}'],
  'root-set':['-2;4','{4;-2}','нет корней','∅'],
  'interval-set':['(-∞;1)∪(3;+∞)','(3;∞) или (-∞;1)','[1/2;2]','{3}','∅']
 };
 for(const [answerFormat,values] of Object.entries(examples))for(const value of values){
  for(const answers of [[],['unrelated expected answer']]){
   assert(api.recognize({answerFormat,answers,excluded:answerFormat==='root-set'?7:undefined},value,checker).recognized,answerFormat+': '+value);
  }
 }
 for(const value of invalidNumbers)assert(!api.recognize({answerFormat:'number',answers:['4']},value,checker).recognized,'invalid numeric '+value);
 for(const answerFormat of Object.keys(examples))for(const value of ['','   ','abc'])assert(!api.recognize({answerFormat,answers:[value]},value,checker).recognized,answerFormat+' cannot make invalid syntax valid by key');
 for(const [answerFormat,value] of [['constraint','t><0'],['parameter-set','a>'],['parameter-set','a><2'],['root-set','1;'],['root-set','1;1/0'],['interval-set','[−∞;2)'],['interval-set','(2;∞)∪']]){
  assert(!api.recognize({answerFormat,answers:[],excluded:answerFormat==='root-set'?7:undefined},value,checker).recognized,answerFormat+' invalid '+value);
 }
});

test('ordinary final format errors preserve drafts and leave the first meaningful attempt available',async()=>{
 const task=numericLesson.tasks[3],storage=memory();
 let dom=await boot('task/'+task.id+'/independent',storage),w=dom.window;
 try{
  input(w,'proof-draft','Обоснование и исходные ограничения');fillFinal(w,task);await settle(w);
  const before=gradeState(w.ProfilePartTwoApp.store.read(task.id));
  for(const value of invalidNumbers){
   input(w,'final-0',value);await submit(w,'final-form');
   const record=w.ProfilePartTwoApp.store.read(task.id);
   assert.deepEqual(gradeState(record),before,'format '+value);
   assert.equal(record.drafts.final[0],value);
   assert.equal(record.drafts.proof,'Обоснование и исходные ограничения');
   assert(!w.document.getElementById('completion'));
  }
  input(w,'final-0','  1/  ');await submit(w,'final-form');
  w.close();dom=await boot('task/'+task.id+'/independent',storage);w=dom.window;
  assert.equal(w.document.getElementById('final-0').value,'  1/  ');
  assert.equal(w.document.getElementById('proof-draft').value,'Обоснование и исходные ограничения');
  fillFinal(w,task);await submit(w,'final-form');
  const record=w.ProfilePartTwoApp.store.read(task.id);
  assert.equal(record.attemptCount,1);assert.equal(record.wrong,0);assert.equal(record.attempts.length,1);
  assert(record.attempts[0].correct&&!record.attempts[0].helped);assert(record.completed&&record.independent);
  assert.doesNotMatch(w.document.getElementById('completion').textContent,/исправлен самостоятельно/);
  const completed=gradeState(record);input(w,'final-0','abc');await submit(w,'final-form');
  assert.deepEqual(gradeState(w.ProfilePartTwoApp.store.read(task.id)),completed,'format never removes an existing completion');
 }finally{w.close();}
});

test('the whole final form is recognized before a wrong mathematical field can count',async()=>{
 const task=numericLesson.tasks[4],dom=await boot('task/'+task.id+'/independent'),w=dom.window;
 try{
  input(w,'final-0','999');input(w,'final-1','1/');await submit(w,'final-form');
  assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,0);
  input(w,'final-1',task.final[1].answers[0]);await submit(w,'final-form');
  let record=w.ProfilePartTwoApp.store.read(task.id);assert.equal(record.attemptCount,1);assert.equal(record.wrong,1);assert.equal(record.attempts[0].answers[0],'999');
  input(w,'final-0','abc');await submit(w,'final-form');assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,1);
  fillFinal(w,task);await submit(w,'final-form');record=w.ProfilePartTwoApp.store.read(task.id);
  assert.equal(record.attemptCount,2);assert.equal(record.wrong,1);assert(record.independent);
  assert.equal(record.attempts[0].correct,false);assert.match(w.document.getElementById('completion').textContent,/исправлен самостоятельно/);
 }finally{w.close();}
});

test('numeric steps preserve malformed drafts, the solved prefix and assistance after reload',async()=>{
 const task=bank.find(lesson=>lesson.id==='p14-circle-selection').tasks[0],storage=memory();
 let dom=await boot('task/'+task.id+'/guided',storage),w=dom.window;
 try{
  input(w,'step-answer',task.steps[0].answers[0]);await submit(w,'step-form');
  w.document.getElementById('step-hint').click();await settle(w);
  const before=gradeState(w.ProfilePartTwoApp.store.read(task.id));assert(before.helped);assert.equal(before.solvedSteps.length,1);
  for(const value of invalidNumbers){
   input(w,'step-answer',value);await submit(w,'step-form');
   const record=w.ProfilePartTwoApp.store.read(task.id);assert.deepEqual(gradeState(record),before,value);assert.equal(record.drafts.steps[1],value);
  }
  input(w,'step-answer','  1/  ');await submit(w,'step-form');
  w.close();dom=await boot('task/'+task.id+'/guided',storage);w=dom.window;
  assert.equal(w.document.getElementById('step-answer').value,'  1/  ');assert.match(w.document.querySelector('#step-form .eyebrow').textContent,/Шаг 2/);
  input(w,'step-answer',task.steps[1].answers[0]);await submit(w,'step-form');
  const record=w.ProfilePartTwoApp.store.read(task.id);assert.equal(record.attemptCount,2);assert.equal(record.wrong,0);assert.equal(record.solvedSteps.length,2);assert(record.helped&&!record.independent);
 }finally{w.close();}
});

test('a guided draft with no mathematical attempts remains discoverable from the lesson',async()=>{
 const lesson=bank.find(item=>item.id==='p14-circle-selection'),task=lesson.tasks[1],dom=await boot('task/'+task.id+'/guided'),w=dom.window;
 try{
  input(w,'step-answer','abc');await submit(w,'step-form');assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,0);
  w.location.hash='lesson/'+lesson.id;await new Promise(resolve=>setTimeout(resolve,0));await w.ProfilePartTwoApp.render();await settle(w);
  const card=w.document.querySelector('a.task-link[href="#task/'+task.id+'/guided"]');assert(card);assert.match(card.textContent,/Продолжить работу/);
  w.location.hash='task/'+task.id+'/guided';await new Promise(resolve=>setTimeout(resolve,0));await w.ProfilePartTwoApp.render();await settle(w);
  assert.equal(w.document.getElementById('step-answer').value,'abc');assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,0);
 }finally{w.close();}
});

test('typed textual and set finals count readable wrong answers, including mixed number-or-none fields',async()=>{
 const cases=[
  [findField('relation','final'),'='],
  [findField('number-or-none','final',field=>field.answers.some(value=>Number.isFinite(checker.number(value)))),'нет'],
  [findField('number-or-none','final',field=>field.answers.includes('нет')),'999'],
  [findField('number-or-infinity','final'),'2'],
  [findField('parameter-set','final'),'a<2'],
  [findField('solution-set','final'),'[1;2]']
 ];
 for(const [{lesson,task,index,field},value] of cases){
  assert(!api.matches(field.answers,value,checker),task.id+' test uses a wrong value');
  const mode=task.independentFinal||lesson.exam===14?'plan':'independent',dom=await boot('task/'+task.id+'/'+mode),w=dom.window;
  try{
   fillFinal(w,task);input(w,'final-'+index,'abc');await submit(w,'final-form');assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,0,field.answerFormat+' format');
   input(w,'final-'+index,value);await submit(w,'final-form');
   const record=w.ProfilePartTwoApp.store.read(task.id);assert.equal(record.attemptCount,1,field.answerFormat);assert.equal(record.wrong,1);assert.equal(record.attempts[0].answers[index],value);assert(!record.completed);
  }finally{w.close();}
 }
});

test('typed steps distinguish wrong mathematics from an unreadable word or sign',async()=>{
 const cases=[['yes-no','да'],['constraint','t<0'],['monotonicity',null],['relation','='],['position',null],['number-or-infinity','2']];
 for(const [type,supplied] of cases){
  const {task,index,field}=findField(type,'steps');
  const value=supplied||(type==='monotonicity'?(field.answers.includes('возрастает')?'убывает':'возрастает'):(field.answers.includes('внутри')?'вне':'внутри'));
  assert(!api.matches(field.answers,value,checker),task.id+' test uses a wrong value');
  const storage=memory(),seed=api.create(storage);await seed.patch(task.id,record=>{record.solvedSteps=Array.from({length:index},(_,i)=>i);});
  const dom=await boot('task/'+task.id+'/guided',storage),w=dom.window;
  try{
   input(w,'step-answer','abc');await submit(w,'step-form');assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,0,type+' format');
   input(w,'step-answer',value);await submit(w,'step-form');
   const record=w.ProfilePartTwoApp.store.read(task.id);assert.equal(record.attemptCount,1,type);assert.equal(record.wrong,1);assert.equal(record.solvedSteps.length,index);assert.equal(record.attempts[0].answers[0],value);
  }finally{w.close();}
 }
});

test('a valid number violating the original domain remains a mathematical attempt',async()=>{
 const task=bank.find(lesson=>lesson.id==='p14-log-domain').tasks[3],dom=await boot('task/'+task.id+'/plan'),w=dom.window;
 try{
  input(w,'final-0',task.meta.bad);await submit(w,'final-form');
  const record=w.ProfilePartTwoApp.store.read(task.id);assert.equal(record.attemptCount,1);assert.equal(record.wrong,1);assert(!record.completed);
 }finally{w.close();}
});

test('duplicate pending submissions count once while a later deliberate retry remains in history',async()=>{
 const lesson=bank.find(item=>item.id==='p14-circle-selection');
 for(const mode of ['independent','guided']){
  const task=mode==='independent'?numericLesson.tasks[5]:lesson.tasks[0],dom=await boot('task/'+task.id+'/'+mode),w=dom.window,form=mode==='independent'?'final-form':'step-form';
  try{
   if(mode==='independent'){fillFinal(w,task);input(w,'final-0','999');}else input(w,'step-answer','999');
   dispatch(w,form);dispatch(w,form);await settle(w);
   assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,1,mode+' duplicate event');
   await submit(w,form);assert.equal(w.ProfilePartTwoApp.store.read(task.id).attemptCount,2,mode+' deliberate retry');
   if(mode==='independent')fillFinal(w,task);else input(w,'step-answer',task.steps[0].answers[0]);
   dispatch(w,form);dispatch(w,form);await settle(w);
   const record=w.ProfilePartTwoApp.store.read(task.id);assert.equal(record.attemptCount,3,mode+' one correct event');assert.equal(record.wrong,2);assert.equal(record.attempts[0].answers[0],'999');
   if(mode==='guided')assert.equal(record.solvedSteps.length,1);else assert(record.completed&&record.independent);
  }finally{w.close();}
 }
});

test('format edits across two tabs preserve the newest proof, assistance and the first meaningful attempt',async()=>{
 const task=numericLesson.tasks[3],hash='task/'+task.id+'/independent',storage=memory();
 const first=await boot(hash,storage),second=await boot(hash,storage),a=first.window,b=second.window;
 try{
  fillFinal(a,task);input(a,'final-0','1/');await submit(a,'final-form');
  input(b,'proof-draft','Свежая запись во второй вкладке');b.document.getElementById('request-help').click();await settle(b);
  input(a,'final-0','abc');await submit(a,'final-form');
  let record=a.ProfilePartTwoApp.store.read(task.id);assert.equal(record.attemptCount,0);assert.equal(record.drafts.proof,'Свежая запись во второй вкладке');assert(record.helped);assert.deepEqual(Array.from(record.hints),[99]);
  fillFinal(a,task);await submit(a,'final-form');record=a.ProfilePartTwoApp.store.read(task.id);
  assert.equal(record.attemptCount,1);assert(record.attempts[0].correct&&record.attempts[0].helped);assert(record.completed&&!record.independent);assert.equal(record.drafts.proof,'Свежая запись во второй вкладке');
  const reloaded=await boot(hash,storage);
  try{assert.equal(reloaded.window.document.getElementById('proof-draft').value,'Свежая запись во второй вкладке');assert(reloaded.window.document.getElementById('completion'));assert(!reloaded.window.ProfilePartTwoApp.store.read(task.id).independent);}finally{reloaded.window.close();}
 }finally{a.close();b.close();}
});

test('a stale invalid final form does not erase an untouched field saved in another tab',async()=>{
 const task=numericLesson.tasks[3],hash='task/'+task.id+'/independent',storage=memory();
 const first=await boot(hash,storage),second=await boot(hash,storage),a=first.window,b=second.window;
 try{
  input(a,'final-0','abc');await settle(a);
  input(b,'final-1',task.final[1].answers[0]);await settle(b);
  assert.equal(a.document.getElementById('final-1').value,'','first tab has not edited its stale second field');
  await submit(a,'final-form');
  const record=a.ProfilePartTwoApp.store.read(task.id);assert.equal(record.attemptCount,0);assert.equal(record.drafts.final[0],'abc');
  assert.equal(record.drafts.final[1],String(task.final[1].answers[0]),'unrelated newer field survives a format-only submission');
 }finally{a.close();b.close();}
});

test('submitting a value populated without an input event preserves its literal format draft',async()=>{
 const lesson=bank.find(item=>item.id==='p14-circle-selection');
 for(const mode of ['independent','guided']){
  const task=mode==='independent'?numericLesson.tasks[3]:lesson.tasks[1],storage=memory(),hash='task/'+task.id+'/'+mode;
  let dom=await boot(hash,storage),w=dom.window;
  try{
   const id=mode==='independent'?'final-0':'step-answer',form=mode==='independent'?'final-form':'step-form';
   w.document.getElementById(id).value='  1/  ';
   if(mode==='independent')w.document.getElementById('final-1').value=String(task.final[1].answers[0]);
   await submit(w,form);const record=w.ProfilePartTwoApp.store.read(task.id);
   assert.equal(record.attemptCount,0);assert.equal(record.wrong,0);assert.equal(record.drafts[mode==='independent'?'final':'steps'][0],'  1/  ');
   if(mode==='independent')assert.equal(record.drafts.final[1],String(task.final[1].answers[0]));
   w.close();dom=await boot(hash,storage);w=dom.window;assert.equal(w.document.getElementById(id).value,'  1/  ');
  }finally{w.close();}
 }
});

// Native acceptance exercises the rendered controls and the generated file://
// bundle. JSDOM above is deliberately not a substitute for this check.
test('native H04 format, duplicate submission and saved-work parity online and offline',{
 skip:!(process.env.CI||process.env.H04_NATIVE_BROWSER==='1')&&'native acceptance runs in CI; set H04_NATIVE_BROWSER=1',
 timeout:300000
},async()=>{
 const http=require('node:http'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
 const mime={'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
 const server=http.createServer((request,response)=>{
  try{
   let file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://fixture').pathname));
   if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
   if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   response.setHeader('Content-Type',mime[path.extname(file)]||'text/html');response.end(fs.readFileSync(file));
  }catch(_){response.writeHead(404).end();}
 });
 const offline=path.join(root,'downloads/trainers/ege-profil-part-two/ege-profil-part-two.html');
 assert(fs.existsSync(offline),'generated autonomous Part Two HTML');
 const shots='/tmp/profile-part2-shots/h04-answer-format';fs.mkdirSync(shots,{recursive:true});
 const errors=[],failed=[],report=[];
 let browser,origin;
 const circle=bank.find(lesson=>lesson.id==='p14-circle-selection');
 async function read(page,id){return page.evaluate(async id=>{await window.ProfilePartTwoApp.store.flush();return window.ProfilePartTwoApp.store.read(id);},id);}
 async function fill(page,task){for(const [index,field] of task.final.entries())await page.locator('#final-'+index).fill(String(field.answers[0]));}
 async function open(page,base,task,mode){const hash='#task/'+task.id+'/'+mode;await page.goto(base+hash);await page.locator('.modes a[aria-current="page"][href="'+hash+'"]').waitFor();await page.locator('#final-form').waitFor();}
 function watch(page){page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.url().startsWith(origin)&&response.status()>=400)failed.push(response.status()+' '+new URL(response.url()).pathname);});}
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
  const deliveries={online:origin+'/ege-profil/part-two/index.html',offline:pathToFileURL(offline).href};
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
  for(const [delivery,base] of Object.entries(deliveries))for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.setDefaultTimeout(12000);watch(page);
   try{
    const task=numericLesson.tasks[3];await open(page,base,task,'independent');await fill(page,task);
    await page.locator('#proof-draft').fill('Мой ход решения сохраняется при уточнении формата.');
    for(const value of ['   ','abc','1/','1/0','sqrt(-4)^2']){
     if(value==='1/')await page.locator('#final-0').evaluate((element,value)=>{element.value=value;},value);else await page.locator('#final-0').fill(value);
     await page.locator('#final-form button[type=submit]').click();
     const record=await read(page,task.id);assert.equal(record.attemptCount,0,delivery+' '+width+' '+value);assert.equal(record.wrong,0);assert(!record.helped&&!record.completed);assert.equal(record.drafts.final[0],value);
    }
    assert(await page.locator('#feedback').isVisible());
    const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(metrics.scroll<=metrics.width+1,delivery+' format feedback overflow at '+width);
    await page.screenshot({path:path.join(shots,delivery+'-format-'+width+'.png'),fullPage:true});
    await fill(page,task);
    await page.evaluate(()=>{const form=document.getElementById('final-form');for(let i=0;i<2;i++)form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));});
    await page.locator('#completion').waitFor();let record=await read(page,task.id);assert.equal(record.attemptCount,1);assert(record.completed&&record.independent);assert(record.attempts[0].correct);
    await page.reload();await page.locator('#completion').waitFor();record=await read(page,task.id);assert.equal(record.attemptCount,1);assert.equal(await page.locator('#proof-draft').inputValue(),'Мой ход решения сохраняется при уточнении формата.');
    const guided=circle.tasks[0];await open(page,base,guided,'guided');
    for(const value of ['abc','1/0']){
     if(value==='abc')await page.locator('#step-answer').evaluate((element,value)=>{element.value=value;},value);else await page.locator('#step-answer').fill(value);
     await page.locator('#step-form button[type=submit]').click();record=await read(page,guided.id);assert.equal(record.attemptCount,0);assert.equal(record.drafts.steps[0],value);assert.equal(record.solvedSteps.length,0);
    }
    await page.reload();await page.locator('#step-answer').waitFor();assert.equal(await page.locator('#step-answer').inputValue(),'1/0');
    await page.locator('#step-answer').fill(String(guided.steps[0].answers[0]));
    await page.evaluate(()=>{const form=document.getElementById('step-form');for(let i=0;i<2;i++)form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));});
    await page.waitForFunction(id=>window.ProfilePartTwoApp.store.read(id).solvedSteps.length===1,guided.id);record=await read(page,guided.id);assert.equal(record.attemptCount,1);assert.equal(record.wrong,0);assert(record.helped);
    const textual=bank.find(lesson=>lesson.id==='p14-trig-factors').tasks[0];await open(page,base,textual,'guided');
    await page.locator('#step-answer').fill('да');await page.locator('#step-form button[type=submit]').click();record=await read(page,textual.id);assert.equal(record.attemptCount,1);assert.equal(record.wrong,1);
    await page.locator('#step-answer').fill('abc');await page.locator('#step-form button[type=submit]').click();assert.equal((await read(page,textual.id)).attemptCount,1);
    if(width===1280){
     const shared=numericLesson.tasks[4];await open(page,base,shared,'independent');await page.locator('#final-0').fill('1/');await page.locator('#final-form button[type=submit]').click();
     const second=await context.newPage();watch(second);await open(second,base,shared,'independent');
     await second.locator('#final-1').fill(String(shared.final[1].answers[0]));await second.locator('#proof-draft').fill('Свежий черновик другой вкладки.');await second.locator('#request-help').click();await second.waitForFunction(id=>window.ProfilePartTwoApp.store.read(id).helped,shared.id);
     await page.locator('#final-0').fill('abc');await page.locator('#final-form button[type=submit]').click();record=await read(page,shared.id);assert.equal(record.attemptCount,0);assert(record.helped);assert.equal(record.drafts.proof,'Свежий черновик другой вкладки.');assert.equal(record.drafts.final[1],String(shared.final[1].answers[0]),'untouched newer field is preserved');
     await fill(page,shared);await page.locator('#final-form button[type=submit]').click();await page.locator('#completion').waitFor();record=await read(page,shared.id);assert.equal(record.attemptCount,1);assert(record.completed&&!record.independent);assert(record.attempts[0].helped);assert.equal(record.drafts.proof,'Свежий черновик другой вкладки.');await second.close();
    }
    report.push({delivery,width,formatAttempts:0,firstMeaningfulAttempt:1,stepAttempts:1,twoTabs:width===1280});
   }finally{await context.close();}
  }
  assert.deepEqual(errors,[],'native JavaScript errors');assert.deepEqual(failed,[],'native missing resources');
  console.log('PROFILE_PART_TWO_ANSWER_FORMAT_NATIVE_OK '+JSON.stringify(report));
 }finally{if(browser)await browser.close();if(server.listening)await new Promise(resolve=>server.close(resolve));}
});
