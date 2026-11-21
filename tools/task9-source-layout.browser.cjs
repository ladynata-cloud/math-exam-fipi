'use strict';
// Every exam card, with its source details open: the badge must not cover the
// equation, and the condition, source text and controls must fit the viewport.
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const trainerPath=path.join(root,'trainers/oge-task9-equations.html');
const trainerHTML=fs.readFileSync(trainerPath);
const artifacts=path.resolve(process.env.TASK9_SOURCE_LAYOUT_ARTIFACTS||path.join(root,'artifacts/task9-source-layout'));
fs.mkdirSync(artifacts,{recursive:true});
const result={testedFile:'trainers/oge-task9-equations.html',testedFileSha256:crypto.createHash('sha256').update(trainerHTML).digest('hex'),status:'RUNNING',evidence:[],errors:[]};
const server=http.createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
 if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const send=(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(data);};
 if(file===trainerPath)send(null,trainerHTML);else fs.readFile(file,send);
});
const launchBrowser=()=>chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--disable-dev-shm-usage']});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/trainers/oge-task9-equations.html';
 let browser;
 try{
  browser=await launchBrowser();
  for(const width of [320,1280]){
   let context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   let page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>result.errors.push({width,message:error.message}));
   await page.goto(url);
   const tasks=await page.evaluate(()=>EXAM_BANK.map((task,index)=>({id:task.id,index})));
   for(const task of tasks){
    if(task.index>0&&task.index%20===0){
     await context.close();await browser.close();browser=await launchBrowser();
     context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
     page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>result.errors.push({width,message:error.message}));await page.goto(url);
    }
    const picker=page.locator('#pane-mara .minimal-task-nav > details');
    if(await picker.getAttribute('open')===null)await picker.locator(':scope > summary').click();
    await picker.locator('select').selectOption(String(task.index));
    const card=page.locator('#mara-list > .task-card:not([hidden])');
    assert.equal(await card.getAttribute('data-task-id'),task.id);
    await card.getByText('Об этом задании',{exact:true}).click();
    const geometry=await card.evaluate(card=>{
     const badge=card.querySelector('.src-badge'),question=card.querySelector('.task-q'),details=badge.closest('details');
     const b=badge.getBoundingClientRect(),q=question.getBoundingClientRect(),d=details.getBoundingClientRect();
     const overlap=Math.min(b.right,q.right)>Math.max(b.left,q.left)&&Math.min(b.bottom,q.bottom)>Math.max(b.top,q.top);
     const out=[...card.querySelectorAll('.task-q,.task-source,.src-badge,input,button')].filter(el=>el.getClientRects().length).map(el=>({tag:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})).filter(r=>r.left<-1||r.right>innerWidth+1);
     return{detailsOpen:details.open,badgePosition:getComputedStyle(badge).position,badgeVisible:b.width>0&&b.height>0,questionVisible:q.width>0&&q.height>0,insideDetails:b.top>=d.top&&b.bottom<=d.bottom,overlap,out,pageWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
    });
    assert.equal(geometry.detailsOpen,true,task.id+' source details are open');
    assert.equal(geometry.badgePosition,'static',task.id+' badge stays in the source details flow');
    assert(geometry.badgeVisible&&geometry.questionVisible&&geometry.insideDetails,task.id+' badge is visible inside its source details');
    assert.equal(geometry.overlap,false,task.id+' badge never covers the equation prompt');
    assert.deepEqual(geometry.out,[],task.id+' controls fit');assert(geometry.pageWidth<=width+1,task.id+' page fits');
    assert.deepEqual(result.errors,[],task.id+' no JavaScript errors');
    result.evidence.push({width,id:task.id,...geometry});
   }
   await page.locator('#mara-list > .task-card:not([hidden])').evaluate(card=>card.scrollIntoView({block:'start'}));
   await page.screenshot({path:path.join(artifacts,width+'-source-details.png')});
   await context.close();console.log('SOURCE_LAYOUT_PASS',width,tasks.length);
  }
  assert.equal(new Set(result.evidence.map(row=>row.width+':'+row.id)).size,result.evidence.length);result.status='PASS';
  console.log('SOURCE_LAYOUT_OK',result.evidence.length);
 }catch(error){result.status='FAIL';result.failure={message:error.message};throw error;}
 finally{fs.writeFileSync(path.join(artifacts,'source-layout-results.json'),JSON.stringify(result,null,2));if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
