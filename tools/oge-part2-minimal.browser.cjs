'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),artifacts=path.resolve(root,process.env.OGE_PART2_BROWSER_ARTIFACTS||'artifacts/oge-part2-minimal');
const files={20:'oge-task20-equations.html',21:'oge-task21-word-problems.html',22:'oge-task22-functions-graphs.html'};
const errors=[],external=[];fs.mkdirSync(artifacts,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});fs.createReadStream(file).pipe(res);});
function watch(page){page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!/^(?:http:\/\/127\.0\.0\.1:|file:|data:)/.test(r.url()))external.push(r.url());});}
function main(page,n){return n===20?page.locator('#body'):n===21?page.locator('#content'):page.locator('.panel:not(.hidden) .mode-host[data-mode="marathon"]');}
function condition(page,n){return n===20?page.locator('#body .qbox > .prompt'):n===21?page.locator('#content [data-slot="stmt"]'):main(page,n).locator('.statement').first();}
async function noOverflow(page,label){const b=await page.evaluate(()=>({w:innerWidth,root:document.documentElement.scrollWidth,body:document.body.scrollWidth}));assert(b.root<=b.w+1&&b.body<=b.w+1,label+': overflow '+JSON.stringify(b));}
async function inputFor(page,n){if(n===20)return page.locator('#body .qbox > div:not(.minimal-hint) .numin').first();if(n===21)return page.locator('#content .card > div:not(.minimal-hint) .af input').first();const host=main(page,n);await host.getByRole('button',{name:'+ отдельное значение',exact:true}).click();return host.locator('.ans-host .v-dec').first();}
async function initial(page,n){const host=main(page,n);await host.getByRole('button',{name:'Хочешь подсказку?',exact:true}).waitFor();assert.equal(await page.locator('#courseSettings').evaluate(e=>e.open),false);assert.equal(await host.locator('.minimal-help').isVisible(),false);assert.equal(await page.locator('#courseSettings button').count()>0,true);assert(await condition(page,n).isVisible());assert(await page.locator('.minimal-proof-note').first().isVisible());}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [320,360,1280])for(const n of [20,21,22]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});watch(page);
   await page.goto(origin+'/trainers/'+files[n],{waitUntil:'load'});await initial(page,n);await noOverflow(page,n+' initial '+width);
   await page.screenshot({path:path.join(artifacts,n+'-'+width+'-task.png'),fullPage:true});
   const host=main(page,n),before=await condition(page,n).innerHTML(),input=await inputFor(page,n);await input.fill('123');
   const hint=host.getByRole('button',{name:'Хочешь подсказку?',exact:true});await hint.focus();await page.keyboard.press('Enter');
   const help=host.locator('.minimal-help');assert(await help.isVisible());assert.equal(await hint.getAttribute('aria-expanded'),'true');assert.equal(await input.inputValue(),'123');assert.equal(await condition(page,n).innerHTML(),before);
   if(n===22){const slider=help.getByRole('slider',{name:'Положение прямой',exact:true}),svg=help.locator('svg').first(),graph=await svg.innerHTML();await slider.focus();await page.keyboard.press('End');assert.notEqual(await svg.innerHTML(),graph);await help.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();assert(await help.locator('.step-card').first().isVisible());}
   else assert(await help.locator(n===20?'.sstep':'.stepcard').first().isVisible());
   if(n===21||n===22){
    const model=help.locator('.minimal-model-scroll').first(),svg=model.locator('svg');
    assert(await model.isVisible());assert.equal(await model.getAttribute('tabindex'),'0');
    const dimensions=await model.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,svg:e.querySelector('svg').getBoundingClientRect().width}));
    assert(dimensions.svg>=(n===21?520:560)-1,'Model labels retain their authored readable scale');
    assert.equal(await help.locator('.minimal-model-scroll input').count(),0,'Model controls stay outside the scrolling drawing');
    if(width<=360){assert(dimensions.scroll>dimensions.width,'Only the drawing scrolls horizontally');await model.focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(120);assert(await model.evaluate(e=>e.scrollLeft>0),'The enlarged model is keyboard-scrollable');await model.evaluate(e=>{e.scrollLeft=0;});}
   }
   await noOverflow(page,n+' help '+width);await page.screenshot({path:path.join(artifacts,n+'-'+width+'-help.png'),fullPage:true});
   const accepted=await help.innerHTML();await hint.click();assert(!await help.isVisible());await hint.click();assert(await help.isVisible());assert.equal(await help.innerHTML(),accepted);assert.equal(await input.inputValue(),'123');
   await host.getByRole('button',{name:'Другая задача →',exact:true}).click();assert(!await host.locator('.minimal-help').isVisible());assert.equal(await host.getByRole('button',{name:'Хочешь подсказку?',exact:true}).getAttribute('aria-expanded'),'false');await noOverflow(page,n+' next '+width);
   await page.locator('#courseSettings > summary').click();assert(await page.locator('#courseSettings').evaluate(e=>e.open));await noOverflow(page,n+' settings '+width);
   await page.close();
  }
  for(const n of [20,21,22]){
   const page=await browser.newPage({viewport:{width:360,height:900}});watch(page);await page.goto(pathToFileURL(path.join(root,'trainers',files[n])).href);await initial(page,n);await main(page,n).getByRole('button',{name:'Хочешь подсказку?',exact:true}).click();assert(await main(page,n).locator('.minimal-help').isVisible());await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('OGE_PART2_MINIMAL_BROWSER_OK: 3 trainers × 3 widths, same-task help, keyboard, responsive screenshots, next and offline');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
