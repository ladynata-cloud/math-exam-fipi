'use strict';
// Real Chromium, local fixtures only: every added root card/step and every source number.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),scope={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),scope);
const lessons=scope.window.MakarychevCourse.lessons,added=lessons.flatMap(l=>l.tasks.map((t,index)=>({t,index,lesson:l.id}))).filter(v=>v.t.id.startsWith('roots-'));
assert(added.length>600,'Full chapter content must be built before browser verification');
const chapterCards=lessons.filter(l=>l.chapter==='Квадратные корни').flatMap(l=>l.tasks.map((t,index)=>({t,index,lesson:l.id})));
assert.equal(chapterCards.length,1127,'Every preserved and added chapter card participates in layout acceptance');
const orderedTasks=lessons.flatMap(l=>(l.studyOrder||l.tasks.map((_,i)=>i)).map(index=>({t:l.tasks[index],index,lesson:l.id})));
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://local.test').pathname);
 if(name==='/favicon.ico'){res.writeHead(204).end();return;}
 let file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(name.endsWith('/'))file=path.join(file,'index.html');
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const shots=process.env.M8_SCREENSHOTS||path.join(process.cwd(),'artifacts/makarychev8'),KEY='mathexam.makarychev8.2024.v1';
const errors=[],layoutEvidence=[];let browser,views=0,walked=0,searches=0;
function observe(page){page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon.ico'))errors.push(m.text());});}
const route=v=>'#lesson/'+v.lesson+'/'+v.index;
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const sampleNumbers=new Set([300,353,355,388,398,411,421,436,439,445,500,509]);
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/school/makarychev8/';
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});fs.mkdirSync(shots,{recursive:true});
 // Seed previous-release records once, before loading the current app. Reloads
 // must restore its persisted results; no init script may replace them again.
 const legacyRecords={
  'p17-t01':{value:'2 s q r t (3)',correct:true,independent:true,attempts:1,assisted:false,note:'Прежняя запись о корне',completion:{attempts:1,assisted:false,independent:true}},
  'p19-t05':{value:'',values:['7','2+s q r t (3)','2-s q r t (3)','Черновик следующего шага'],step:3,assisted:true,guided:true,stepHints:{1:true},reveals:{1:true},note:'Прежние шаги с подсказкой'}
 };
 const legacyState={version:1,tasks:legacyRecords,practice:{},last:{hash:'#lesson/p19/4'},origin:null};
 const legacyContext=await browser.newContext({viewport:{width:320,height:900},storageState:{cookies:[],origins:[{origin:new URL(url).origin,localStorage:[{name:KEY,value:JSON.stringify(legacyState)}]}]}});
 try{
  const legacyPage=await legacyContext.newPage();observe(legacyPage);
  for(const [id,lesson,index]of [['p17-t01','p17',0],['p19-t05','p19',4]]){
   const legacyTask=lessons.find(l=>l.id===lesson).tasks[index],legacyRoute='#lesson/'+lesson+'/'+index;
   assert.equal(legacyTask.id,id,'previous-release route remains exact');
   for(let load=0;load<2;load++){
    if(load)await legacyPage.reload();else await legacyPage.goto(url+legacyRoute);
    await legacyPage.waitForFunction(({hash,title})=>location.hash===hash&&window.MakarychevApp?.getState().last?.hash===hash&&document.querySelector('.task-heading h2')?.textContent===title,{hash:legacyRoute,title:legacyTask.title});
    await legacyPage.waitForSelector('#answer-form');
    assert.equal(await legacyPage.locator('.error-page').count(),0,id+' legacy route loads');
    const restored=await legacyPage.evaluate(taskId=>window.MakarychevApp.getState().tasks[taskId],id);
    assert.equal(restored.note,legacyRecords[id].note,id+' notebook restored');
    assert.equal(await legacyPage.locator('#notebook').inputValue(),legacyRecords[id].note,id+' notebook rendered');
    if(id==='p17-t01'){
     assert(restored.correct&&restored.independent,'old spaced sqrt answer retains independent credit');
     assert.deepEqual(restored.completion,legacyRecords[id].completion,'original completion snapshot retained');
     assert.equal(await legacyPage.locator('#final-answer').inputValue(),legacyRecords[id].value,'old answer spelling rendered');
     assert(await legacyPage.locator('#final-answer').evaluate(el=>el.readOnly),'completed old answer stays complete in the UI');
     assert.equal(await legacyPage.locator('.task-heading .tag').innerText(),'Самостоятельно','independent result shown');
    }else{
     assert.equal(restored.step,3,'all three accepted old steps retained');
     assert.deepEqual(restored.values,legacyRecords[id].values,'accepted steps and unfinished draft retained');
     assert(restored.assisted&&restored.guided&&!restored.independent&&!restored.correct,'assisted unfinished work stays assisted and unfinished');
     assert.deepEqual(restored.stepHints,{1:true},'old step-hint history retained');
     assert.deepEqual(restored.reveals,{1:true},'old revealed-step history retained');
     assert.equal(await legacyPage.locator('.step.completed').count(),3,'all accepted steps rendered');
     assert.equal(await legacyPage.locator('[data-step-input="3"]').inputValue(),legacyRecords[id].values[3],'unfinished next-step draft rendered');
    }
    const persisted=await legacyPage.evaluate(({key,taskId})=>JSON.parse(localStorage.getItem(key)).tasks[taskId],{key:KEY,taskId:id});
    assert.deepEqual(persisted,restored,id+' restored work is persisted without loss');
    assert(await legacyPage.locator('#storage-warning').isHidden(),id+' no storage warning');
   }
   await legacyPage.screenshot({path:path.join(shots,'roots-legacy-restored-'+id+'-320.png'),fullPage:true});
  }
  console.log('ROOTS_LEGACY_RELOAD '+JSON.stringify({status:'PASS',cases:2,records:Object.keys(legacyRecords),loadsPerRecord:2}));
 }finally{await legacyContext.close();}
 for(const width of [320,390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();observe(page);
  await page.goto(url);await page.waitForFunction(()=>window.MakarychevApp);
  const launcher=page.locator('#maxexam-public-assistant .launcher');await launcher.waitFor({state:'visible'});
  const launcherBox=await launcher.boundingBox();assert(launcherBox,'Existing navigator stays available');
  const nav=async hash=>{await page.evaluate(h=>{history.replaceState(null,'',h);window.MakarychevApp.route();scrollTo(0,0);},hash);};
  const seenShots=new Set(),layoutFailures=[],measurements={width,height:900,cards:0,figures:0,maxPromptBottom:0,maxFigureBottom:0,navigator:launcherBox};
  for(const v of chapterCards){
   const {t}=v;await nav(route(v));
   assert.equal(await page.locator('.error-page').count(),0,t.id+' route');
   const box=await page.locator('.prompt').boundingBox();
   if(!box||box.y<0||box.y+box.height>900){
    if(layoutFailures.length<12)await page.screenshot({path:path.join(shots,'roots-prompt-failure-'+t.id+'-'+width+'.png'),fullPage:true});
    layoutFailures.push(t.id+' condition outside first screen at '+width+' '+JSON.stringify(box));
   }
   assert(box,t.id+' condition is visible');
   if(overlaps(box,launcherBox))layoutFailures.push(t.id+' condition obscured by navigator at '+width);
   if(box.y+box.height>measurements.maxPromptBottom){measurements.maxPromptBottom=box.y+box.height;measurements.lowestPrompt=t.id;}
   assert(box.x>=0&&box.x+box.width<=width+1,t.id+' prompt outside screen');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),t.id+' horizontal overflow at '+width);
   assert.equal(await page.locator('.task-menu').evaluate(el=>el.open),width>900,'menu default '+width);
   const note=t.source.type==='textbook'?'Из учебника: '+t.source.reference+', с. '+t.source.page:t.source.adaptation?'Самопроверка по учебнику: '+t.source.reference+', с. '+t.source.page:'Авторская задача по теме учебника';
   assert.equal(await page.locator('.source-note').innerText(),note,t.id+' provenance');
   if(t.graph){
    const fig=await page.locator('#task-graph').boundingBox();
    if(!fig||fig.y<0||fig.y+fig.height>900){
     if(layoutFailures.length<12)await page.screenshot({path:path.join(shots,'roots-figure-failure-'+t.id+'-'+width+'.png'),fullPage:true});
     layoutFailures.push(t.id+' necessary figure outside first screen at '+width+' '+JSON.stringify(fig));
    }
    assert(fig,t.id+' necessary figure is visible');
    if(overlaps(fig,launcherBox))layoutFailures.push(t.id+' necessary figure obscured by navigator at '+width);
    assert(fig.x>=0&&fig.x+fig.width<=width+1,t.id+' figure outside screen width');
    measurements.figures++;
    if(fig.y+fig.height>measurements.maxFigureBottom){measurements.maxFigureBottom=fig.y+fig.height;measurements.lowestFigure=t.id;}
    if(['root-build','curve-build'].includes(t.graph.type))assert.equal(await page.locator('#task-graph [data-root-curve]').count(),0,t.id+' no prefilled construction');
   }
   const n=Number(/№\s*(\d+)/.exec(t.source.reference)?.[1]);
   if((width===320||width===1280)&&sampleNumbers.has(n)&&!seenShots.has(n)){seenShots.add(n);await page.screenshot({path:path.join(shots,'roots-'+n+'-'+width+'.png'),fullPage:true});}
   if(t.id==='roots-353-e')await page.screenshot({path:path.join(shots,'roots-353-e-first-screen-'+width+'.png')});
   measurements.cards++;
   views++;
  }
  layoutEvidence.push(measurements);
  fs.writeFileSync(path.join(shots,'roots-layout.json'),JSON.stringify({viewports:layoutEvidence,failures:layoutFailures},null,2)+'\n');
  for(const [kind,id]of [['prompt',measurements.lowestPrompt],['figure',measurements.lowestFigure]]){
   const v=chapterCards.find(v=>v.t.id===id);assert(v,'Measured chapter card exists');await nav(route(v));
   await page.screenshot({path:path.join(shots,'roots-lowest-'+kind+'-'+width+'.png')});
  }
  console.log('ROOTS_LAYOUT '+JSON.stringify(measurements));
  assert.deepEqual(layoutFailures,[],'Every chapter condition and necessary figure fits the first screen');
  if(width===320){
   for(let n=268;n<=509;n++){
    await nav('#home');await page.locator('#exercise-number').fill(String(n));await page.locator('#number-form button').click();
    const expected=orderedTasks.filter(v=>v.t.source?.type==='textbook'&&new RegExp('№\\s*'+n+'(?!\\d)').test(v.t.source.reference));
    assert.equal(await page.locator('#number-result a.button:not(.quiet)').count(),expected.length,'complete search '+n);
    // Fixtures originate in a VM; compare plain host arrays across the browser boundary.
    assert(expected.length>0);assert.deepEqual(await page.locator('#number-result a.button:not(.quiet)').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))),Array.from(expected,route),'source order for '+n);searches++;
   }
   await nav('#home');
   for(const l of lessons.filter(l=>l.studyOrder))assert.equal(await page.locator('#chapter-2 .lesson-card').filter({has:page.getByText(l.title,{exact:true})}).getAttribute('href'),'#lesson/'+l.id+'/'+l.studyOrder[0],'chapter entry starts in source order '+l.id);
   const first=lessons.find(l=>l.id==='p10');await nav('#lesson/p10/'+first.studyOrder[0]);
   const next='#lesson/p10/'+first.studyOrder[1];await page.locator('.navigation [data-action="task"]').filter({hasText:'Следующая задача'}).click();await page.waitForFunction(h=>location.hash===h,next);
   await nav('#progress');assert.equal(await page.getByRole('link',{name:first.title,exact:true}).getAttribute('href'),'#lesson/p10/'+first.studyOrder[0],'progress entry keeps source order');
   // A preserved old card remains independently completable at its old route.
   await nav('#lesson/p16/0');const old=lessons.find(l=>l.id==='p16').tasks[0];
   if(old.kind==='choice')await page.locator('[data-choice="'+old.choices.indexOf(old.answer)+'"]').click();else await page.locator('#final-answer').fill(old.answer);
   await page.locator('#answer-form button[type=submit]').click();
   await page.getByText('Мои записи к задаче',{exact:true}).click();await page.locator('#notebook').fill('Старая запись о модуле сохранена.');
   assert(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].independent,old.id));
   for(const [index,v]of added.entries()){
    const {t}=v;await nav(route(v));await page.locator('[data-action=guided]').click();
    for(let k=0;k<t.steps.length;k++){
     await page.locator('[data-step-input="'+k+'"]').fill(t.steps[k].answer);await page.locator('[data-step-form="'+k+'"] button').first().click();
     assert.equal(await page.locator('.step.completed').count(),k+1,t.id+' retained step '+k);
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),t.id+' worked-step horizontal overflow');walked++;
    }
    if(t.kind==='choice')await page.locator('[data-choice="'+t.choices.indexOf(t.answer)+'"]').click();else await page.locator('#final-answer').fill(t.answer);
    await page.locator('#answer-form button[type=submit]').click();
    const state=await page.evaluate(id=>window.MakarychevApp.getState().tasks[id],t.id);assert(state.correct&&!state.independent,t.id+' assisted completion');
    if(index%100===0){assert(await page.locator('#storage-warning').isHidden(),'no storage/quota failure');console.log('ROOTS_BROWSER_PROGRESS '+index+'/'+added.length);}
   }
   const last=added.at(-1);await page.getByText('Мои записи к задаче',{exact:true}).click();await page.locator('#notebook').fill('Завершённые шаги сохраняются.');
   await page.reload();await page.waitForSelector('#answer-form');
   assert(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,last.t.id));
   assert.equal(await page.locator('#notebook').inputValue(),'Завершённые шаги сохраняются.');
   await nav('#lesson/p16/0');assert.equal(await page.locator('#notebook').inputValue(),'Старая запись о модуле сохранена.');
   // Import into a fresh browser, then confirm that subsequent import cannot overwrite a current notebook.
   const saved=await page.evaluate(k=>localStorage.getItem(k),KEY),fresh=await browser.newContext({viewport:{width:390,height:900}}),other=await fresh.newPage();observe(other);
   await other.goto(url+'#progress');await other.waitForSelector('#import-file');
   const buffer=Buffer.from(JSON.stringify({course:'makarychev8-2024',state:JSON.parse(saved)}));
   await other.locator('#import-file').setInputFiles({name:'roots-progress.json',mimeType:'application/json',buffer});
   await other.waitForFunction(()=>document.getElementById('import-status')?.textContent.includes('объединены'));
   await other.evaluate(h=>{history.replaceState(null,'',h);window.MakarychevApp.route();},route(last));
   assert.equal(await other.locator('.step.completed').count(),last.t.steps.length,'all imported steps stay visible');
   await other.locator('#notebook').fill('Моя новая запись имеет приоритет.');
   await other.evaluate(()=>{history.replaceState(null,'','#progress');window.MakarychevApp.route();});
   await other.locator('#import-file').setInputFiles({name:'roots-progress.json',mimeType:'application/json',buffer});
   await other.waitForFunction(()=>document.getElementById('import-status')?.textContent.includes('объединены'));
   assert.equal(await other.evaluate(id=>window.MakarychevApp.getState().tasks[id].note,last.t.id),'Моя новая запись имеет приоритет.');await fresh.close();
  }
  await context.close();
 }
 // Focused fresh interactions for construction, notation keyboard and deliberately wrong mathematical branches.
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();observe(page);await page.goto(url);await page.waitForFunction(()=>window.MakarychevApp);
 const nav=async v=>{await page.evaluate(h=>{history.replaceState(null,'',h);window.MakarychevApp.route();},route(v));};
 const constructions=added.filter(v=>['root-build','curve-build'].includes(v.t.graph?.type));assert(constructions.length>0,'chapter includes a real learner construction');
 for(const v of constructions){
  await nav(v);assert.equal(await page.locator('[data-root-curve]').count(),0);
  const wrong=v.t.answer.split(';');wrong[0]=Number.isFinite(Number(wrong[0]))?String(Number(wrong[0])+1):'12345';await page.locator('#final-answer').fill(wrong.join(';'));
  await page.locator('#answer-form button[type=submit]').click();assert(!(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,v.t.id)),'wrong branch rejected');
  assert.equal(await page.locator('[data-root-curve]').count(),0,'wrong branch does not reveal curve');
  await page.locator('#final-answer').fill(v.t.answer);await page.reload();await page.waitForSelector('#final-answer');
  assert.equal(await page.locator('#final-answer').inputValue(),v.t.answer,'construction draft restored');assert.equal(await page.locator('[data-root-curve]').count(),v.t.graph.type==='curve-build'?v.t.graph.curves.length:1);
  await page.screenshot({path:path.join(shots,'roots-construction-'+v.t.id+'.png'),fullPage:true});
  await page.locator('#answer-form button[type=submit]').click();assert(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,v.t.id));
 }
 const radical=added.find(v=>v.t.kind==='text'&&v.t.answer.includes('√')&&!v.t.graph);assert(radical);await nav(radical);
 await page.locator('#final-answer').fill('2');await page.locator('[data-action="math-key"][data-target="final-answer"][data-symbol="√"]').click();assert.equal(await page.locator('#final-answer').inputValue(),'2√','keyboard inserts at caret');
 await page.locator('#final-answer').fill('неверный ответ');await page.locator('#answer-form button[type=submit]').click();assert(!(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,radical.t.id)));
 await page.locator('#final-answer').fill(radical.t.answer);await page.locator('#answer-form button[type=submit]').click();assert(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,radical.t.id));
 // Valid alternatives must work through the actual form, then survive reload.
 const examples=[
  ['rational-example',null,'π','-7/3'],
  ['irrational-example',null,'sqrt(16)','sqrt(7)'],
  ['interval-examples',t=>t.lower==='0'&&t.exampleCount===5,'0.0002;0.0002;0.0004;0.0005;0.0006','0.0002;0.0004;0.0006;0.0008;0.0011'],
  ['square-equation-example',t=>t.rootType==='rational','2','4/9'],
  ['square-equation-example',t=>t.rootType==='irrational','1/4','2/3'],
  ['square-equation-example',t=>t.rootType==='none','0','-0.5'],
  ['root-line-count',t=>t.intersectionCount===0,'1;0','1;1'],
  ['root-line-count',t=>t.intersectionCount===1,'1;0','2;1/8'],
  ['root-line-count',t=>t.intersectionCount===2,'0;1','1/2;1/3']
 ];
 for(const [kind,filter,wrong,right]of examples){
  const v=added.find(v=>v.t.kind===kind&&(!filter||filter(v.t)));assert(v,'open-example case '+kind);await nav(v);
  await page.locator('#final-answer').fill(wrong);await page.locator('#answer-form button[type=submit]').click();assert(!(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,v.t.id)),kind+' wrong example rejected');
  await page.locator('#final-answer').fill(right);
  if(kind==='root-line-count')assert.equal(await page.locator('[data-root-curve="line"]').count(),1,'own line preview');
  await page.locator('#answer-form button[type=submit]').click();assert(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,v.t.id),kind+' alternative accepted');
  await page.reload();await page.waitForSelector('#final-answer');assert.equal(await page.locator('#final-answer').inputValue(),right,kind+' alternate retained');assert(await page.evaluate(id=>window.MakarychevApp.getState().tasks[id].correct,v.t.id),kind+' alternate revalidated');
 }
 await context.close();assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',chapterCards:chapterCards.length,addedCards:added.length,views,walkedSteps:walked,searches,legacyReloadCases:2,viewports:[320,390,768,1280],layoutEvidence,flows:['all chapter conditions and figures','all worked steps retained','all 242 searches','old independent result','previous-release spaced sqrt and assisted-step reload','notes/reload/import priority','unfilled learner construction','wrong branch','radical keyboard','source-ordered entry/search/next','free examples and line alternatives/reload','no browser errors']}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
