'use strict';
// Disposable browser contexts only. No production origin or real learner state.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.PROFILE_LEGACY_LEARNING_SHOTS||'/tmp/profile-legacy-learning-shots';
const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://fixture').pathname));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch(_){res.writeHead(404).end();}});
(async()=>{
 let browser;const errors=[];let screens=0;
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});fs.mkdirSync(shots,{recursive:true});
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}});
   await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
   const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push({url:page.url(),message:e.message}));
   const go=async file=>{await page.goto(origin+'/ege-profil/trainers/'+file);await page.locator('#profile-course-nav').waitFor();};
   const shot=async label=>{assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' fits '+width);await page.screenshot({path:path.join(shots,width+'-'+label+'.png'),fullPage:true});screens++;};
   await go('functions-t1112.html?topic=graphs');
   assert.equal(await page.locator('#modeChips [aria-pressed=true]').innerText(),'графики');
   await page.locator('#dAnswer').fill('17');await page.locator('#dSol').click();assert.equal(await page.locator('#dAnswer').inputValue(),'17');await shot('functions-practice');
   await go('functions-t1112.html');
   await page.locator('#sk').press('Home');for(let i=0;i<6;i++)await page.locator('#sk').press('ArrowRight');assert.equal(await page.locator('#skv').innerText(),'0');assert.equal(await page.locator('#heroFig [data-hole]').count(),1);await shot('functions-zero-model');
   await go('derivative-t8.html');await page.locator('[data-view=train]').click();assert.equal(await page.locator('details[open]').count(),0);await shot('derivative');
   await go('trigonometry.html?topic=equations');await page.locator('.ep-view.on[data-view=eq]').waitFor();await shot('trigonometry');
   await go('trig-sum-to-product.html');
   await page.locator('[data-mode=practice]').click();await page.locator('[data-mode=learn]').click();await page.locator('[data-mode=practice]').click();
   await page.locator('#trap-c [data-i="0"]').click();await page.waitForFunction(()=>document.body.innerText.includes('Ловушка 2 / 10'));
   assert.equal(await page.locator('#trap-c .choice').count(),3);await shot('trig-next-trap');
   await go('applied-t910.html?topic=text');assert.equal(await page.locator('#modeChips [aria-pressed=true]').innerText(),'текстовые задачи');assert.equal(await page.locator('details[open]').count(),0);await shot('applied-text');
   await go('finance.html');
   for(const [type,wrong,correct,label] of [['Две фазы погашения','300','500','finance-L1'],['Пени за задержку','352,9','375,1','finance-I1']]){
    await page.locator('#taskTypes button').filter({hasText:type}).click();assert.equal(await page.locator('details[open]').count(),0);
    await page.locator('#finalAnswerInput').fill(wrong);await page.locator('.final-answer-row button').click();
    await page.locator('.final-box>.feedback.warn').waitFor();assert.equal(await page.locator('#finalAnswerInput').count(),1);
    await page.locator('#finalAnswerInput').fill(correct);await page.locator('.final-answer-row button').click();await page.locator('.final-box>.feedback.ok').waitFor();await shot(label);
   }
   await context.close();
  }
  assert.deepEqual(errors,[],'all repaired pages run without browser errors');
  console.log('PROFILE_LEGACY_LEARNING_REPAIR_BROWSER_OK',JSON.stringify({widths:[320,390,1280],screens,math:['L1','I1'],repeatTrapEntry:true,topicLinks:true,zeroModel:true}));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
