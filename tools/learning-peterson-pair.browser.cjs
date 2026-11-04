'use strict';
// Real isolated browser with two local origins. Synthetic cabinet API only;
// no login, pupil data, public requests, provider calls or production writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
let chromium;try{({chromium}=require('playwright'));}catch(_){({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));}
const ROOT=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.pdf':'application/pdf'};
const course='https://mathexam.space/school/peterson6/',line='https://mathexam.space/trainers/maxim-peterson6/';
const focus=`Курс: ${course}\nЛинейка: ${line}`;
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port)));
const close=server=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});
function staticResponse(req,res){try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);let file=path.resolve(ROOT,'.'+pathname);if(!file.startsWith(ROOT+path.sep))throw Error('path');if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);}catch(_){res.writeHead(404).end();}}
(async()=>{
 let browser,publicServer,cabinetServer;const errors=[],mutations=[],publicRequests=[],shots=[];
 const artifactRoot=process.env.PETERSON_PAIR_ARTIFACT_DIR?path.resolve(process.env.PETERSON_PAIR_ARTIFACT_DIR):fs.mkdtempSync(path.join(os.tmpdir(),'peterson-pair-browser-'));
 fs.mkdirSync(artifactRoot,{recursive:true});
 try{
  publicServer=http.createServer((req,res)=>{publicRequests.push(req.url);staticResponse(req,res);});const publicOrigin=await listen(publicServer);
  cabinetServer=http.createServer(staticResponse);const origin=await listen(cabinetServer);
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking']});
  async function open({role='student',selected=true,route='home',viewport={width:1440,height:1000}}={}){
   const context=await browser.newContext({viewport,locale:'ru-RU'});
   const profile={course:'foundations',goal:null,focus:selected?focus:'Прежние темы.',version:1};
   const pupil={id:'synthetic-pupil',role:'student',name:'Учебный профиль',profile},teacher={id:'synthetic-teacher',role:'teacher',name:'Преподаватель'};
   await context.route('**/*',async request=>{
    const u=new URL(request.request().url());
    if(u.origin===origin&&u.pathname.startsWith('/api/learning/')){
     const route=u.pathname.slice('/api/learning'.length);
     if(request.request().method()!=='GET')mutations.push(route);
     const values={'/status':{trainerOrigin:publicOrigin},'/session':{account:role==='teacher'?teacher:pupil,csrfToken:'synthetic-csrf'},'/profile':{profile},'/attempts':{attempts:[]},'/assignments':{assignments:[]},'/lessons':{lessons:[]},'/teacher/students':{students:[pupil]},'/assistant':{enabled:false},'/teacher/students/synthetic-pupil/report':{student:pupil,attempts:[],counts:{}},'/teacher/students/synthetic-pupil/profile':{profile},'/teacher/students/synthetic-pupil/plan':{items:[],note:'Прежний план'}};
     assert(Object.hasOwn(values,route),'Unexpected API '+route);return request.fulfill({status:200,contentType:'application/json',body:JSON.stringify(values[route])});
    }
    if([origin,publicOrigin].includes(u.origin)||['data:','blob:'].includes(u.protocol))return request.continue();
    return request.abort();
   });
   const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/learning/?role='+role+'#'+route);await page.locator('#navigation a').first().waitFor();
   return{context,page};
  }
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
   const {context,page}=await open({viewport});
   try{
    await page.locator('[data-peterson-course]').first().waitFor();assert.equal(await page.locator('[data-peterson-course]').count(),2);
    for(const [route,task,taskTitle]of [['peterson-course','#lesson/p01','Найдём высказывание'],['peterson-line','#schemes','Узнай схему движения']]){
     await page.locator('a[href="#'+route+'"]').click();
     const frameElement=page.locator('[data-peterson-workspace] iframe');await frameElement.waitFor();
     assert.equal(await frameElement.getAttribute('sandbox'),'allow-scripts allow-same-origin allow-downloads allow-modals');assert.equal(await frameElement.getAttribute('referrerpolicy'),'no-referrer');
     const frame=await(await frameElement.elementHandle()).contentFrame();await frame.locator('.peterson-help-launcher').waitFor();
     assert.equal(await page.locator('.cabinet-assistant:visible').count(),0,'No second cabinet helper');
     await frame.locator('a[href="'+task+'"]').first().click();await frame.locator('.peterson-help-launcher').click();
     await frame.locator('[data-peterson-help="hint"]').click();await frame.locator('.peterson-help-answer').waitFor();
     assert.match(await frame.locator('.peterson-help-body').innerText(),new RegExp(taskTitle));
     const panel=await frame.locator('.peterson-help-panel').boundingBox(),launcher=await frame.locator('.peterson-help-launcher').boundingBox();
     assert(panel.width>200&&panel.height>100);assert(panel.x>=0&&panel.y>=0&&panel.x+panel.width<=viewport.width+1&&panel.y+panel.height<=viewport.height+1,'Panel stays in viewport');
     assert(viewport.width-(launcher.x+launcher.width)<50&&viewport.height-(launcher.y+launcher.height)<60,'Launcher is near viewport bottom right '+JSON.stringify({viewport,launcher}));
     const navBox=await page.locator('#navigation').boundingBox(),workspaceBox=await page.locator('[data-peterson-workspace]').boundingBox();if(viewport.width<=850)assert(workspaceBox.y>=navBox.y+navBox.height,'Workspace does not cover mobile cabinet navigation');
     const filename=route+'-'+viewport.width+'.png';await page.screenshot({path:path.join(artifactRoot,filename)});shots.push(filename);
     await frame.locator('.peterson-help-close').click();
     if(route==='peterson-line'){
      await frame.evaluate(()=>{location.hash='';});await frame.locator('#backup-file').waitFor({state:'attached'});
      const backup=await frame.evaluate(()=>localStorage.getItem(TrainerCore.storageKey));
      assert(backup,'Existing synthetic progress is retained');
      const confirmation=page.waitForEvent('dialog');
      await frame.locator('#backup-file').setInputFiles({name:'synthetic-progress.json',mimeType:'application/json',buffer:Buffer.from(backup)});
      const dialog=await confirmation;assert.equal(dialog.type(),'confirm');await dialog.accept();
      await frame.getByText('Резервная копия загружена. Можно продолжать с сохранённых шагов.',{exact:true}).waitFor();
     }
     await page.locator('a[href="#home"]').filter({hasText:'Мои материалы'}).click();
     await page.locator('[data-peterson-course]').first().waitFor();assert.equal(await page.locator('iframe').count(),0);
    }
   }finally{await context.close();}
  }
  const preview=await open({role:'teacher',route:'preview=synthetic-pupil'});await preview.page.locator('[data-peterson-preview]').waitFor();assert.equal(await preview.page.locator('iframe').count(),0);assert.deepEqual(await preview.page.locator('[data-attached-course-open]').evaluateAll(els=>els.map(e=>e.href)),[course,line]);await preview.context.close();
  const denied=await open({selected:false,route:'peterson-course'});await denied.page.getByRole('heading',{name:'Этот материал пока не выбран для кабинета'}).waitFor();assert.equal(await denied.page.locator('iframe').count(),0);await denied.context.close();
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);assert(publicRequests.every(u=>!u.includes('synthetic')&&!u.includes('csrf')&&!u.includes('parentOrigin')));
  console.log(JSON.stringify({status:'PASS',checks:10,viewports:['1440x1000','390x844'],publicRequestsAllowed:0,mutations:0,errors,artifactRoot,screenshots:shots},null,2));
 }finally{if(browser)await browser.close();if(cabinetServer)await close(cabinetServer);if(publicServer)await close(publicServer);}
})().catch(error=>{console.error(error);process.exitCode=1;});
