'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),items=JSON.parse(fs.readFileSync(path.join(root,'assets/trainer-previews/manifest.json')));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml','.json':'application/json'};
(async()=>{
 let server,base=process.env.PREVIEW_BASE_URL;
 if(!base){server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://localhost').pathname;
  let f=path.join(root,decodeURIComponent(p));if(p.endsWith('/'))f=path.join(f,'index.html');
  if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const b=fs.readFileSync(f);res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});res.end(b)}catch{res.writeHead(404).end()}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const artifactDir=process.env.PREVIEW_ARTIFACTS;if(artifactDir)fs.mkdirSync(artifactDir,{recursive:true});
 const reports=[];
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());return u.origin===new URL(base).origin?route.continue():route.fulfill({status:200,body:''})});
  for(const file of [...new Set(items.map(i=>i.page))]){
   const page=await context.newPage(),gifRequests=[];const expected=items.filter(i=>i.page===file);
   page.on('request',r=>{if(new URL(r.url()).pathname.endsWith('.gif'))gifRequests.push(r.url())});
   const response=await page.goto(base+'/'+file,{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   assert.equal(await page.locator('h1').count(),1);
   assert(await page.locator('link[rel=canonical]').getAttribute('href'));
   if(file==='trainers/index.html') {
    assert.equal(await page.locator('#catalog [data-card]').count(),59);
    assert.equal(await page.locator('#catalog [data-card] a[href="./college-logarithms/"]').count(),1);
   }
   if(file==='oge/variants/2027/index.html') assert.equal(await page.locator('.card[data-number]').count(),104);
   assert.equal(await page.locator('[data-me-preview]').count(),expected.length);
   assert.equal(gifRequests.length,0,'no GIF downloads before user action, including reduced motion');
   const details=page.locator('.me-preview-section > details');if(await details.count())await details.locator(':scope > summary').click();
   for(const it of expected){
    const box=page.locator('[data-me-preview="'+it.id+'"]');await box.scrollIntoViewIfNeeded();
    const img=box.locator('img'),button=box.locator('button');
    await page.waitForFunction(id=>document.getElementById(id)?.naturalWidth===640,await img.getAttribute("id"));
    try { await img.evaluate(img=>img.decode()); } catch (error) { throw new Error(`${file} ${width} ${it.id}: ${await img.evaluate(i=>JSON.stringify({src:i.src,currentSrc:i.currentSrc,complete:i.complete,width:i.naturalWidth}))}: ${error.message}`); } assert.equal(await img.evaluate(i=>i.naturalWidth),640);
    await button.focus();await page.keyboard.press('Enter');await img.evaluate(img=>img.decode());assert.match(await img.getAttribute('src'),/\.gif$/);
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    // A second click must really return to a still, not just change the label.
    await button.click();assert.match(await img.getAttribute('src'),/\.png$/);
    assert.equal(await button.getAttribute('aria-pressed'),'false');
    const ancestor=box.locator('xpath=..');
    assert(await ancestor.locator('a[href="'+it.url+'"]').count()>0, 'visible nearby trainer link');
    if(artifactDir && width===390) await ancestor.screenshot({path:path.join(artifactDir,it.id+'-mobile.png')});
   }
   assert.equal(gifRequests.length,expected.length);
   const first=page.locator('[data-me-preview]').first();await first.scrollIntoViewIfNeeded();
   const dimensions=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));
   assert(dimensions.sw<=dimensions.w+1,`${file} overflow ${JSON.stringify(dimensions)}`);
   const card=first.locator('xpath=..');
   if(artifactDir)await card.screenshot({path:path.join(artifactDir,file.replaceAll('/','-')+'-'+width+'.png')});
   // Ensure off-screen motion stops and the shared player never runs two GIFs.
   await first.locator('button').click();await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
   if(await first.evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}))await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-me-preview] button')].every(b=>b.getAttribute('aria-pressed')==='false'));
   // Direct links reveal the exact preview even inside a closed gallery.
   const linked=expected[expected.length-1];
   if(await details.count()) await details.evaluate(el=>{el.open=false});
   await page.goto(base+'/'+file+'#preview-'+linked.id);
   await page.locator('#preview-'+linked.id).waitFor({state:'visible'});
   reports.push({page:file,width,previews:expected.length,initialGifRequests:0,passed:true});await page.close();
  }
  await context.close();
 }
 // Check real destinations and their rendered controls, including redirect aliases.
 const routeContext=await browser.newContext({viewport:{width:390,height:844}});
 for(const route of [...new Set(items.map(i=>i.url))]) {
  const page=await routeContext.newPage();
  const response=await page.goto(base+route,{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200,route);
  await page.locator('button:visible,input:visible,select:visible').first().waitFor({timeout:20000});
  assert((await page.locator('body').innerText()).length>150,route);
  reports.push({route,rendered:true});await page.close();
 }
 await routeContext.close();
 // Explicit play works with the normal motion preference; timers start on load.
 const playContext=await browser.newContext({viewport:{width:1280,height:900}});
 const playPage=await playContext.newPage();await playPage.clock.install();
 await playPage.goto(base+'/oge/#preview-02-parabola');
 const firstPlay=playPage.locator('[data-me-preview]').first();
 await firstPlay.locator('button').click();await firstPlay.locator('img').evaluate(i=>i.decode());
 await playPage.clock.fastForward(12000);
 assert.match(await firstPlay.locator('img').getAttribute('src'),/\.png$/);
 await firstPlay.locator('button').click();await firstPlay.locator('img').evaluate(i=>i.decode());
 await playPage.emulateMedia({reducedMotion:'reduce'});
 await playPage.waitForFunction(()=>document.querySelector('[data-me-preview] button').getAttribute('aria-pressed')==='false');
 // Playing a second preview must stop the first even if both are in view.
 await firstPlay.locator('button').click();
 const secondPlay=playPage.locator('[data-me-preview]').nth(1);
 await secondPlay.locator('button').click();await secondPlay.locator('img').evaluate(i=>i.decode());
 assert.equal(await playPage.locator('[data-me-preview] button[aria-pressed=true]').count(),1);
 await playContext.close();
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});
 for(const file of [...new Set(items.map(i=>i.page))]){
  const page=await context.newPage();await page.goto(base+'/'+file);
  const details=page.locator('.me-preview-section > details');if(await details.count())await details.locator(':scope > summary').click();
  for(const image of await page.locator('[data-me-preview] img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode());}
  assert.equal(await page.locator('[data-me-preview] button:visible').count(),0);
  for(const it of items.filter(i=>i.page===file))assert(await page.locator('a[href="'+it.url+'"]').count()>0);
  await page.close();
 }await context.close();
 console.log(JSON.stringify({gate:'TRAINER_GIF_BROWSER_PASS',reports},null,2));
 if(artifactDir)fs.writeFileSync(path.join(artifactDir,'results.json'),JSON.stringify(reports,null,2));
 }finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
