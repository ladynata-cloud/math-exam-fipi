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
   if(course==='ege-profil')assert.equal(await page.locator('#legacy-course').evaluate(n=>n.open),false,'historical catalogue optional');
   else assert.equal(await page.locator('.course-recommendation').evaluate(n=>n.open),false,'initial check optional');
   const shots=process.env.EGE_ENTRY_SHOTS;if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,course+'-'+width+'.png'),fullPage:true});}
   await page.locator(start).click();await page.locator('main h1').first().waitFor();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),course+' task menu fits '+width);
  }
 }
 await page.goto(origin+'/ege-profil/#route');assert(await page.locator('#legacy-course').evaluate(n=>n.open),'old deep link opens its containing catalogue');
 assert(await page.locator('#route-h').isVisible());assert.match(await page.locator('#route-h').textContent(),/2026/);
 await page.goto(origin+'/ege-profil/#%');assert(await page.locator('#myCode').textContent(),'malformed anchor does not prevent progress UI');
 await page.goto(origin+'/ege-baza/');await page.locator('.course-recommendation summary').click();assert(await page.locator('[data-recommendation] a.btn').first().isVisible(),'old module recommendations remain accessible');
 assert.deepEqual(errors,[]);console.log('EGE_COURSE_ENTRIES_OK: 2027, two direct task entries, optional checks/legacy, preserved deep links, 320/1280px');
}finally{await browser?.close();if(server.listening)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
