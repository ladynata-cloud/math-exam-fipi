'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  try{let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}
});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  for(const width of [320,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/courses/');
   const count=await page.locator('main > .grid > .card').count();assert(count>=25);
   await page.locator('#course-query').fill('Макарычев');assert((await page.locator('main > .grid > .card:visible').count())>=2);
   await page.locator('#course-clear').click();assert.equal(await page.locator('main > .grid > .card:visible').count(),count);
   await page.locator('[data-course-filter="geometry"]').click();await page.locator('#course-query').fill('Погорелов');assert.equal(await page.locator('main > .grid > .card:visible').count(),1);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'catalog overflow '+width);
   for(const [folder,global] of [['alimov10-11','AlimovCourse'],['nikolsky10','NikolskyCourse']]){
    await page.goto(base+'/school/'+folder+'/');
    const info=await page.evaluate(name=>{const c=window[name],l=c.lessons.find(l=>l.tasks.some(t=>t.kind==='number'));const i=l.tasks.findIndex(t=>t.kind==='number');return {hash:'#lesson/'+l.id+'/'+i,answer:l.tasks[i].answer};},global);
    await page.goto(base+'/school/'+folder+'/'+info.hash);
    await page.locator('#final-answer').fill('not a number');await page.locator('#answer-form').evaluate(form=>form.requestSubmit());
    await page.locator('.attempt-history summary').click();assert.match(await page.locator('.attempt-history').innerText(),/not a number/);
    await page.reload();await page.locator('.attempt-history summary').click();assert.match(await page.locator('.attempt-history').innerText(),/not a number/);
    await page.locator('#final-answer').fill(String(info.answer));await page.locator('#answer-form').evaluate(form=>form.requestSubmit());
    await page.locator('.attempt-history summary').click();assert.match(await page.locator('.attempt-history').innerText(),/not a number/);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),folder+' history overflow '+width);
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('COURSE_INTEGRITY_BROWSER_OK: catalogue search and every link retained; Alimov/Nikolsky wrong→reload→correct history at 320/1280; no JS errors or overflow');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
