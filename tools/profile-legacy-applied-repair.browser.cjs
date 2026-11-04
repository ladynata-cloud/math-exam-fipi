'use strict';
// Mobile financial ledgers use a local horizontal scroller. Real learner state
// and external services are never accessed by these disposable local contexts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.PROFILE_FINANCE_LAYOUT_SHOTS||'/tmp/profile-finance-layout-shots';
const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://fixture').pathname));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch(_){res.writeHead(404).end();}});
(async()=>{
 let browser;const errors=[];
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});fs.mkdirSync(shots,{recursive:true});
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await page.goto(origin+'/ege-profil/trainers/finance.html');await page.locator('#profile-course-nav').waitFor();
   assert.equal(await page.locator('#taskChooser').getAttribute('open'),null);
   await page.locator('#taskChooser>summary').click();await page.locator('#taskTypes button').filter({hasText:'Пени за задержку'}).click();
   assert.equal(await page.locator('#taskChooser').getAttribute('open'),null);
   assert.match(await page.locator('#selectedTaskType').innerText(),/Пени/);
   assert.equal(await page.locator('.model-details .fin-table-wrap').isVisible(),false);
   assert.equal(await page.locator('.stats-grid').isVisible(),false);
   if(width<=1080)assert((await page.locator('.steps-card').boundingBox()).y<(await page.locator('.model-details').boundingBox()).y,'current action precedes optional model');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'closed page fits '+width);
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:path.join(shots,width+'-finance-I1-top.png'),animations:'disabled'});
   await page.screenshot({path:path.join(shots,width+'-finance-I1-closed.png'),fullPage:true,animations:'disabled'});
   await page.locator('.model-details>summary').click();
   const scroller=page.locator('.model-details .fin-table-wrap');
   assert(await scroller.isVisible());
   const dimensions=await scroller.evaluate(el=>({visible:el.clientWidth,scroll:el.scrollWidth,columns:[...el.querySelectorAll('th')].map(th=>({width:th.getBoundingClientRect().width,wrap:getComputedStyle(th).overflowWrap})),layout:getComputedStyle(el.querySelector('table')).tableLayout}));
   assert.equal(dimensions.layout,'auto');assert(dimensions.columns.every(c=>c.width>=79&&c.wrap==='normal'));
   assert(dimensions.scroll>dimensions.visible,'ledger scrolls within its own region');
   await scroller.focus();await scroller.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.model-details .fin-table-wrap').scrollLeft>0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'expanded ledger does not overflow page');
   await page.locator('.model-details').screenshot({path:path.join(shots,width+'-finance-I1-table.png'),animations:'disabled'});
   await page.locator('#finalAnswerInput').fill('375,1');await page.locator('.final-answer-row button').click();
   assert.match(await page.locator('.final-box>.feedback').innerText(),/Решено с помощью/);
   assert(await page.locator('.model-details .fin-table-wrap').isVisible(),'requested model persists through answer check');
   await page.locator('#taskChooser>summary').click();await page.locator('#taskTypes button').filter({hasText:'Кредит с таблицей остатков'}).click();
   assert.equal(await page.locator('.condition-card table th').count(),3);
   assert(await page.locator('.condition-card .fin-table-wrap').isVisible(),'given balances remain part of the visible statement');
   assert.match(await page.locator('.task-goal').innerText(),/2-й декабрь/);
   assert.equal(await page.locator('.model-details .fin-table-wrap').isVisible(),false);
   await page.locator('.condition-card').screenshot({path:path.join(shots,width+'-finance-D1-givens.png'),animations:'disabled'});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'given ledger fits page');
   await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log('PROFILE_LEGACY_APPLIED_REPAIR_BROWSER_OK',JSON.stringify({widths:[320,390,1280],screens:12,errors:0,localTableScroll:true,requestedHelp:true,essentialGivensVisible:true}));
 }finally{if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
