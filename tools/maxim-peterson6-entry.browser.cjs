'use strict';
// Two local origins and synthetic storage only. The cabinet fixture reproduces
// its iframe sandbox, without a real account, API, assignment or production URL.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const os=require('node:os');
const path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const OUTPUT=process.env.PETERSON_ENTRY_ARTIFACTS||process.env.MAXIM_ENTRY_ARTIFACTS||path.join(os.tmpdir(),'maxim-entry-browser');
const VIEWPORTS=[320,390,1280];
let phase='startup';
const SANDBOX='allow-scripts allow-same-origin allow-downloads allow-modals';
const sources={
 303:{module:'meeting',prompt:'Два поезда выехали одновременно навстречу друг другу из двух городов, расстояние между которыми равно 385 км. Скорость первого поезда в 1,2 раза больше скорости второго. Какое расстояние прошёл первый поезд до встречи?'},
 305:{module:'ratio',prompt:'Из одного города одновременно в противоположных направлениях выехали велосипедист и мотоциклист. Скорость велосипедиста в 3 раза меньше скорости мотоциклиста. С какими скоростями они едут, если через 1 ч 20 мин расстояние между ними стало 96 км?'}
};
const listen=server=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port));});
const close=server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});
const escape=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
function staticResponse(req,res){
 try{
  const url=new URL(req.url,'http://local');if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  let file=path.resolve(ROOT,'.'+decodeURIComponent(url.pathname));assert(file.startsWith(ROOT+path.sep));
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');assert(fs.statSync(file).isFile());
  const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
  res.writeHead(200,{'Content-Type':(types[path.extname(file)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
 }catch(_){res.writeHead(404).end();}
}
async function snapshot(work,module){return work.evaluate(module=>{const C=TrainerCore,p=JSON.parse(localStorage.getItem(C.storageKey)),s=p.sessions[module];return {session:s,problem:C.problemFor(s),hints:p.metrics[module].hints,solutions:p.solutions.length};},module);}
async function chooseDraft(work,step){
 if(step.kind==='choice'&&step.rich)await work.locator('[name=equation-choice][value="'+step.expected+'"]').check();
 else if(step.kind==='choice')await work.locator('#answer-input').selectOption(step.expected);
 else await work.locator('#answer-input').fill(String(step.expected));
}
async function reloadWork(page,work){
 if(work===page)await page.reload();
 else{const navigation=page.waitForEvent('framenavigated',{predicate:frame=>frame===work});await work.evaluate(()=>location.reload());await navigation;}
 await work.locator('#answer-form').waitFor();
}
async function exerciseJourney({page,work,id,exactUrl,mode,width}){
 const source=sources[id];await work.locator('.problem-text').waitFor();
 assert.equal(work.url(),exactUrl);assert.equal((await work.locator('.problem-text').innerText()).trim(),source.prompt);
 assert.equal(await work.locator('.problem-top .badge').innerText(),'Учебник');
 let saved=await snapshot(work,source.module);assert.equal(saved.session.exampleId,String(id));assert.equal(saved.session.methodVersion,2);assert.equal(saved.problem.method,'equation');
 if(id===305){await work.locator('#answer-input').fill('4/3');await work.locator('#answer-input').press('Enter');}
 else{await chooseDraft(work,saved.problem.steps[0]);await work.locator('#answer-form button[type=submit]').click();}
 saved=await snapshot(work,source.module);assert.equal(saved.session.index,1);assert.equal(await work.locator('.step.done').count(),1);
 await chooseDraft(work,saved.problem.steps[1]);const draft=await work.locator('#answer-input').inputValue();
 await work.locator('.peterson-help-launcher').click();await work.locator('[data-peterson-help=hint]').click();
 assert.equal(await work.locator('.peterson-help-answer').count(),1,'Helper remains usable on the exact task');
 assert.equal(await work.locator('#answer-input').inputValue(),draft,'Helper retains the draft');
 await work.locator('.peterson-help-close').click();const partial=await snapshot(work,source.module);assert.equal(partial.hints,1);
 await reloadWork(page,work);assert.deepEqual((await snapshot(work,source.module)).session,partial.session,'Reload preserves the exact partial work and help');
 assert.equal(await work.locator('#answer-input').inputValue(),draft);
 await work.locator('#another').click();const generated=await snapshot(work,source.module);assert.equal(generated.session.exampleId,null);
 assert.equal(new URL(work.url()).hash,'#'+source.module,'A new generated example has a truthful URL');
 await work.goto(exactUrl);await work.locator('#answer-form').waitFor();
 const restored=await snapshot(work,source.module);assert.deepEqual(restored.session,partial.session,'Exact URL restores archived source work rather than starting over');
 assert.equal(restored.hints,1);assert.equal(restored.solutions,0);assert.equal(await work.locator('#answer-input').inputValue(),draft);
 assert.equal(await work.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No frame overflow at '+width);
 await work.locator('.problem-text').scrollIntoViewIfNeeded();
 const filename=mode+'-'+id+'-'+width+'.png';await page.screenshot({path:path.join(OUTPUT,filename)});return filename;
}
async function run(){
 const cabinetSource=fs.readFileSync(path.join(ROOT,'learning/app.js'),'utf8');
 assert(cabinetSource.includes("frame.setAttribute('sandbox','"+SANDBOX+"')"),'Fixture sandbox must match the actual cabinet');
 assert(cabinetSource.includes("frame.referrerPolicy='no-referrer'"),'Fixture uses the cabinet referrer policy');
 fs.mkdirSync(OUTPUT,{recursive:true});let publicServer,cabinetServer,browser,watchdog;
 const errors=[],externalRequests=[],mutations=[],screenshots=[];let journeys=0,mainCabinetJourneys=0,mainGuidedSteps=0;
 try{
  publicServer=http.createServer(staticResponse);const origin=await listen(publicServer);
  const cabinetCourse=origin+'/school/peterson6/?cabinet=peterson-helper&student=synthetic-ignore&parentOrigin=synthetic-ignore&token=synthetic-ignore#home';
  cabinetServer=http.createServer((req,res)=>{
   if(new URL(req.url,'http://local').pathname==='/favicon.ico'){res.writeHead(204).end();return;}
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
   res.end('<!doctype html><html lang="ru"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Локальный кабинет</title><style>html,body{margin:0;height:100%}header{height:36px;box-sizing:border-box;padding:8px;font:16px sans-serif}iframe{display:block;width:100%;height:calc(100% - 36px);border:0}</style><header>Мои материалы · проверка</header><iframe title="Курс Петерсона" sandbox="'+SANDBOX+'" referrerpolicy="no-referrer" src="'+escape(cabinetCourse)+'"></iframe></html>');
  });const cabinetOrigin=await listen(cabinetServer);
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
  async function isolatedContext(width){
   const context=await browser.newContext({viewport:{width,height:900}});
   context.on('page',page=>{page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});});
   await context.route('**/*',route=>{const request=route.request(),url=new URL(request.url());if(!['GET','HEAD'].includes(request.method())){mutations.push(request.method()+' '+url.pathname);return route.abort();}if([origin,cabinetOrigin].includes(url.origin))return route.continue();externalRequests.push(url.href);return route.abort();});
   return context;
  }
  async function journeysRun(){
   for(const width of VIEWPORTS)for(const mode of ['public','cabinet'])for(const id of [303,305]){
    phase=mode+' / '+id+' / '+width;
    const context=await isolatedContext(width);
    try{
     const parent=await context.newPage();let course,parentUrl,work,workPage;
     if(mode==='public'){await parent.goto(origin+'/school/peterson6/?student=synthetic-ignore&token=synthetic-ignore#home');course=parent;}
     else{
      await parent.goto(cabinetOrigin+'/fixture?account=synthetic-parent&token=synthetic-parent#peterson-course');
      const iframe=parent.locator('iframe');assert.equal(await iframe.getAttribute('sandbox'),SANDBOX);assert.equal(await iframe.getAttribute('referrerpolicy'),'no-referrer');
      course=await(await iframe.elementHandle()).contentFrame();
     }
     parentUrl=parent.url();await course.locator('#exercise-number').fill(String(id));
     if(id===305)await course.locator('#exercise-number').press('Enter');else await course.locator('#number-form button').click();
     const link=course.locator('#number-result a'),exactUrl=origin+'/trainers/maxim-peterson6/'+(mode==='cabinet'?'?cabinet=peterson-helper':'')+'#'+sources[id].module+'?example='+id;
     await link.waitFor({state:'visible'});
     assert.equal(await link.count(),1,'Known source number has one exact entry');assert.equal(await link.getAttribute('target'),mode==='cabinet'?'_self':'_blank');assert.equal(await link.evaluate(element=>element.href),exactUrl,'Only the cabinet helper flag is forwarded');
     if(mode==='public'){
      const opening=context.waitForEvent('page');await link.click();work=await opening;workPage=work;
      await work.locator('.problem-text').waitFor();assert.equal(await work.evaluate(()=>window.opener===null),true,'Public exact task is isolated from its opener');
     }else{
      await Promise.all([course.waitForURL(exactUrl),link.click()]);work=course;workPage=parent;
      assert.equal(context.pages().length,1,'Sandbox transition does not require a popup');assert.equal(await parent.locator('iframe').count(),1);
     }
     assert.equal(parent.url(),parentUrl,'Opening the task does not navigate the course tab or cabinet parent');
     screenshots.push(await exerciseJourney({page:workPage,work,id,exactUrl,mode,width}));
     assert.equal(parent.url(),parentUrl,'Reload and archived restoration stay inside the work surface');
     assert.equal(new URL(work.url()).search,mode==='cabinet'?'?cabinet=peterson-helper':'','No student, token or parent query leaks');
     assert.equal(await parent.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No shell overflow at '+width);
     journeys++;
    }finally{await context.close();}
   }
   phase='cabinet / main guided and final forms / 390';
   const context=await isolatedContext(390);
   try{
    const page=await context.newPage();await page.goto(cabinetOrigin+'/fixture?account=synthetic-parent#peterson-course');const parentUrl=page.url();
    const iframe=page.locator('iframe');assert.equal(await iframe.getAttribute('sandbox'),SANDBOX);
    const frame=await(await iframe.elementHandle()).contentFrame();
    await frame.goto(origin+'/school/peterson6/?cabinet=peterson-helper#lesson/p09/2');await frame.locator('[data-action=guided]').click();
    const task=await frame.evaluate(()=>PetersonApp.resolveTask('p09-t03'));assert.equal(task.methodVersion,2);assert.equal(task.answer,'21');assert.equal(task.steps.length,5);
    for(const [i,step]of task.steps.entries()){
     const form=frame.locator('[data-step-form="'+i+'"]');
     if(step.kind==='choice')await form.locator('[data-choice="'+step.choices.indexOf(step.answer)+'"]').click();
     else await form.locator('input').fill(step.answerFormat==='decimal'?await frame.evaluate(value=>PetersonMath.decimal(value),step.answer):step.answer);
     if(step.kind!=='choice'&&i%2===0)await form.locator('input').press('Enter');else await form.locator('button:not([type=button])').click();
     assert.equal(await frame.evaluate(id=>PetersonApp.getState().tasks[id].step,task.id),i+1);assert.equal(await frame.locator('.step.completed').count(),i+1);mainGuidedSteps++;
    }
    await frame.locator('#answer-form button[type=submit]').click();
    assert.match(await frame.locator('#answer-form .feedback').innerText(),/Сначала введи/);
    assert.equal(await frame.evaluate(id=>PetersonApp.getState().tasks[id].attempts,task.id),0,'Empty final click runs the handler without counting an attempt');
    await frame.locator('#final-answer').fill('21');await frame.locator('#final-answer').press('Enter');
    const completion=await frame.evaluate(id=>PetersonApp.getState().tasks[id],task.id);assert.equal(completion.correct,true);assert.equal(completion.attempts,1);assert.equal(completion.independent,false);
    await reloadWork(page,frame);assert.deepEqual(await frame.evaluate(id=>PetersonApp.getState().tasks[id],task.id),completion,'Main guided work and final result survive frame reload');
    assert.equal(await frame.locator('.peterson-help-launcher').count(),1);assert.equal(page.url(),parentUrl);assert.equal(context.pages().length,1);
    assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await frame.locator('#answer-form').scrollIntoViewIfNeeded();
    const filename='cabinet-main-p09-390.png';await page.screenshot({path:path.join(OUTPUT,filename)});screenshots.push(filename);mainCabinetJourneys++;
   }finally{await context.close();}
  }
  await Promise.race([journeysRun(),new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(new Error('Entry browser gate exceeded 180 seconds')),180000);})]);
  assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);assert.deepEqual(mutations,[]);
  console.log(JSON.stringify({status:'MAXIM_PETERSON6_ENTRY_BROWSER_OK',journeys:journeys+mainCabinetJourneys,exactEntryJourneys:journeys,mainCabinetJourneys,acceptedLineSteps:journeys,acceptedMainGuidedSteps:mainGuidedSteps,acceptedMainFinalAnswers:mainCabinetJourneys,partialReloads:journeys,archivedRestores:journeys,publicNewTabs:journeys/2,cabinetSameFrame:journeys/2,searchEnter:journeys/2,numericFractionEnter:journeys/2,viewports:VIEWPORTS,externalRequests:0,mutations:0,errors,artifactRoot:OUTPUT,screenshots},null,2));
 }catch(error){console.error('Captured browser errors: '+JSON.stringify(errors));throw error;}
 finally{clearTimeout(watchdog);if(browser)await browser.close();if(cabinetServer)await close(cabinetServer);if(publicServer)await close(publicServer);}
}
run().catch(error=>{console.error('MAXIM_PETERSON6_ENTRY_BROWSER_FAILED at '+phase+'\n'+(error.stack||error));process.exitCode=1;});
