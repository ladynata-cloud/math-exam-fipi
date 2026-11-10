'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,1280]){
  await page.setViewportSize({width,height:900});
  for(const course of ['ege-profil','ege-baza']){
   await page.goto(origin+'/'+course+'/');await page.locator('h1').first().waitFor();
   assert.match(await page.title(),/2027/);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),course+' fits '+width);
   const start=course==='ege-profil'?'#profile-2027 a[href="start/index.html#calm"]':'.course-start a[href="path/index.html#map"]';
   assert(await page.locator(start).isVisible(),course+' direct task route');
   if(course==='ege-profil'){
    // The complete-course entrance deliberately exposes every exam number
    // and the existing course. No summary click is allowed before these checks.
    for(let number=1;number<=20;number++){
     const href=number<=13?'start/index.html#calm/'+number:'part-two/index.html#exam/'+number;
     const entry=page.locator('#profile-2027 a[href="'+href+'"]');
     assert.equal(await entry.count(),1,'one current route for profile '+number);
     assert(await entry.isVisible(),'profile '+number+' visible without expanding a section at '+width);
     assert.equal(await entry.evaluate(a=>!!a.closest('details:not([open])')),false,'profile '+number+' is not hidden in a collapsed section');
    }
    assert.equal(await page.locator('#legacy-course').evaluate(n=>n.open),true,'existing profile catalogue stays expanded');
    assert.equal(await page.locator('#route .line').count(),19,'all historical 2026 lines retained');
    for(let number=1;number<=19;number++)assert(await page.locator('#route a[href="exam/variant.html?m='+number+'"]').isVisible(),'historical variant '+number+' remains directly visible');
    for(const href of ['trainers/stereo/index.html','trainers/trigonometry.html','trainers/inequalities.html','trainers/finance.html','trainers/planimetry-t17.html','trainers/parameters-18/index.html','trainers/numbers-t19.html']){
     assert(await page.locator('#legacy-course a[href="'+href+'"]').first().isVisible(),'existing trainer remains directly visible: '+href);
    }
    const legacyLinks=page.locator('#legacy-course a[href]');
    for(let index=0;index<await legacyLinks.count();index++)assert(await legacyLinks.nth(index).isVisible(),'existing profile link '+index+' visible without expanding a section');
    assert(await page.locator('#profile-2027 a[href="trigonometry/index.html"]').isVisible(),'earlier trigonometry course remains directly visible');
   }
   else assert.equal(await page.locator('.course-recommendation').evaluate(n=>n.open),false,'initial check optional');
   const shots=process.env.EGE_ENTRY_SHOTS;if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,course+'-'+width+'.png'),fullPage:true});}
   await page.locator(start).click();await page.locator('main h1').first().waitFor();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),course+' task menu fits '+width);
   if(course==='ege-profil'){
    // The old first-part continuation must still restore the actual work,
    // rather than merely landing somewhere inside the first-part application.
    const next=page.locator('[data-journey-start]');await next.waitFor();
    const savedRoute=await next.getAttribute('href');assert.match(savedRoute,/^#practice\/[^/]+\/independent$/);
    await next.click();await page.locator('#answer').waitFor();
    const draft=width===320?'7/3':'11/4';await page.locator('#answer').fill(draft);
    await page.waitForFunction(value=>Object.values(JSON.parse(localStorage.getItem('mathexam.profileStart2027.v1')).sessions).some(session=>session.draft===value),draft);
    await page.goto(origin+'/ege-profil/');await page.locator(start).click();await page.locator('[data-journey-start]').waitFor();
    assert.equal(await page.locator('[data-journey-start]').getAttribute('href'),savedRoute,'first-part continuation keeps the same lesson and mode');
    await page.locator('[data-journey-start]').click();await page.locator('#answer').waitFor();
    assert.equal(new URL(page.url()).hash,savedRoute,'first-part continuation restores the task route');
    assert.equal(await page.locator('#answer').inputValue(),draft,'first-part draft survives a return through the complete-course entrance');
   }
  }
 }
 await page.goto(origin+'/ege-profil/#route');assert(await page.locator('#legacy-course').evaluate(n=>n.open),'old deep link opens its containing catalogue');
 assert(await page.locator('#route-h').isVisible());assert.match(await page.locator('#route-h').textContent(),/2026/);
 await page.goto(origin+'/ege-profil/#%');assert(await page.locator('#myCode').textContent(),'malformed anchor does not prevent progress UI');
 await page.goto(origin+'/ege-baza/');await page.locator('.course-recommendation summary').click();assert(await page.locator('[data-recommendation] a.btn').first().isVisible(),'old module recommendations remain accessible');
 assert.deepEqual(errors,[]);console.log('EGE_COURSE_ENTRIES_OK: 2027, all 20 profile routes and expanded legacy links, restored first-part draft, optional base checks, preserved deep links, 320/1280px');
}finally{await browser?.close();if(server.listening)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
