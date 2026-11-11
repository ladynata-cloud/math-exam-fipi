'use strict';
// Measured reading viewport, not full-page screenshots or inferred CSS breakpoints.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),bundle=require(root+'/stereo-course/textbook/data/course.json');
const newIds=require('./additional404-baseline.cjs').ids;
const earlyRouteIds=['theory-014-example-3a','ex-main-0073','theory-022','ex-main-0167','ex-main-0171'];
const earlyChapters=new Set(['Введение','I. Параллельность прямых и плоскостей','II. Перпендикулярность прямых и плоскостей']);
const earlyIds=bundle.lessons.filter(lesson=>earlyChapters.has(lesson.source.chapter)).map(lesson=>lesson.id);
const samples=[1,48,116,166,218,239,271,320,346,372,396].map(n=>bundle.lessons.find(l=>l.source.collection==='main'&&l.source.exercise===String(n)));
samples.push(bundle.lessons.find(l=>l.id==='theory-033'),bundle.lessons.find(l=>l.source.collection==='selfcheck'));
samples.push([...bundle.lessons].filter(l=>!newIds.has(l.id)).sort((a,b)=>b.statement.text.length-a.statement.text.length)[0]);
samples.push(...earlyRouteIds.map(id=>bundle.lessons.find(l=>l.id===id)));
const cards=[...new Map([...bundle.lessons.filter(l=>newIds.has(l.id)),...samples].map(l=>[l.id,l])).values()];
const out=path.resolve(process.env.MOBILE_LAYOUT_ARTIFACTS||'artifacts/atanasyan-mobile-layout');fs.mkdirSync(out,{recursive:true});
const evidence={completed:false,commit:process.env.GITHUB_SHA||null,cards:cards.map(l=>l.id),measurements:[],errors:[],screenshots:[]};
const resources=['index.html','assets/style.css','assets/engine.js','data/course.json'];
evidence.resources=Object.fromEntries(resources.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(root+'/stereo-course/textbook/'+p)).digest('hex')]));
const key=l=>'mathExamTextbook.v1:'+bundle.catalog.book.id+':'+l.id+':r'+l.revision;
let server,browser;
(async()=>{
 let base=process.env.MOBILE_LAYOUT_LIVE_URL;
 if(!base){server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(f.endsWith('textbook'))f+='/index.html';fs.readFile(f,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(data);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/stereo-course/textbook/';}
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,900],[390,844],[1280,900],[320,568],[390,664]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
  for(const card of cards){
   await page.goto(base+'?layout='+card.id+'#'+card.id);await page.locator('[data-main-model] svg').waitFor();
   await page.waitForFunction(()=>document.querySelector('[data-main-model] svg')?.viewBox.baseVal.height>=360);
   const m=await page.evaluate(()=>{
    const rect=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
    return {width:innerWidth,height:innerHeight,scrollY,overflow:document.documentElement.scrollWidth-innerWidth,prompt:rect('.textbook-prompt'),svg:rect('[data-main-model] svg'),controls:rect('[data-main-model] .am-controls'),help:rect('[data-main-help]>summary'),source:rect('.textbook-lesson-header .companion-details>summary'),firstAction:document.querySelector('.textbook-prompt-action')?rect('.textbook-prompt-action'):document.querySelector('.textbook-compact-answer')?rect('.textbook-compact-answer'):null,font:parseFloat(getComputedStyle(document.querySelector('.textbook-condition')).fontSize),labelFonts:[...document.querySelectorAll('[data-main-model] .am-label')].map(n=>parseFloat(getComputedStyle(n).fontSize)),buttons:[...document.querySelectorAll('[data-main-model] .am-controls button')].map(b=>{const r=b.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(b);return {label:b.getAttribute('aria-label'),width:r.width,height:r.height,left:r.left,right:r.right,lines:range.getClientRects().length};}),sourceClosed:!document.querySelector('.textbook-lesson-header details').open};
   });
   assert.equal(m.width,width);assert.equal(m.height,height);assert.equal(m.scrollY,0);assert(m.overflow<=1,card.id+' overflow');assert(m.font>=20&&m.labelFonts.every(n=>n>=19),card.id+' readable text');assert(m.svg.width>=250&&m.svg.height>=360,card.id+' readable diagram');assert(m.sourceClosed);assert(m.controls.top>=m.svg.bottom&&m.controls.top-m.svg.bottom<12,'controls immediately after diagram');
   for(const b of m.buttons){assert(b.width>=44&&b.height>=44&&b.left>=0&&b.right<=width,card.id+' usable control '+b.label);if(b.label==='Вернуть исходный вид')assert.equal(b.lines,1,'reset label stays on one line');}
   m.id=card.id;m.newCard=newIds.has(card.id);m.fits=m.prompt.top>=0&&m.svg.top>=0&&Math.max(m.prompt.bottom,m.svg.bottom)<=height;m.requiredHeight=Math.ceil(Math.max(m.prompt.bottom,m.svg.bottom));evidence.measurements.push(m);
   if(height>=800){const file=width+'-'+card.id+'.png';await page.screenshot({path:path.join(out,file)});evidence.screenshots.push(file);}
   if(height<800)continue;
   if(newIds.has(card.id))assert(m.fits,card.id+' complete condition and model fit the primary viewport');
   if(height===900&&earlyRouteIds.includes(card.id))assert(m.fits&&m.firstAction?.bottom<=height,card.id+' first condition, model and action fit');
   if(width===320&&card.id==='theory-014-example-3a'){
    const full=page.locator('.textbook-full-condition');
    assert(await page.locator('.textbook-compact-condition').isVisible());
    assert.equal(await full.evaluate(node=>node.open),false);
    await full.locator('summary').click();assert(await full.locator('.textbook-condition').isVisible());
    await full.locator('summary').click();
   }
   const disclosure=page.locator('.textbook-lesson-header .companion-details');await disclosure.locator('summary').click();assert(await disclosure.locator('.companion-book').first().isVisible());assert((await disclosure.innerText()).includes('2024'));assert((await disclosure.innerText()).includes('PDF '+card.source.pdfPages.join(', ')));await disclosure.locator('summary').click();
   const guide=page.locator('.textbook-model-guide');await guide.locator('summary').click();assert(await guide.locator('.am-help').isVisible());assert(await guide.locator('.am-note').isVisible());await guide.locator('summary').click();
   const svg=page.locator('[data-main-model] svg'),camera=await svg.getAttribute('data-yaw');
   if(card.visualization.model.planar){assert.equal(await page.getByRole('button',{name:'Повернуть вправо',exact:true}).count(),0,'authored planar diagram is not rotated');}else{await page.getByRole('button',{name:'Повернуть вправо',exact:true}).click();assert.notEqual(await svg.getAttribute('data-yaw'),camera);}
   await page.getByRole('button',{name:'Развернуть рисунок',exact:true}).click();await page.getByRole('button',{name:'Закрыть рисунок',exact:true}).press('Escape');assert.equal(await page.locator('.am-expanded').count(),0);
   if(card.answer)await page.locator('#final-answer').fill('Проверка сохранения '+card.id);
   await page.locator('[data-main-help]>summary').click();for(const step of card.steps)await page.locator('[data-steps]+button').click();assert.equal(await page.locator('[data-step]').count(),card.steps.length);
   await page.locator('[data-step]').first().getByRole('button',{name:'Показать на рисунке',exact:true}).click();assert.equal(await svg.getAttribute('data-view'),card.steps[0].view||'neutral');assert.equal(await page.locator('[data-step]').count(),card.steps.length,'return to prior step retains all steps');
   const saved=await page.evaluate(k=>localStorage.getItem(k),key(card));await page.reload();await page.locator('[data-main-model] svg').waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key(card)),saved);assert.equal(await page.locator('[data-step]').count(),card.steps.length);if(card.answer)assert.equal(await page.locator('#final-answer').inputValue(),'Проверка сохранения '+card.id);
   await page.getByRole('button',{name:'← Все материалы курса',exact:true}).click();assert(await page.locator('#catalog-search').isVisible());
  }
  if(height===900){
   const missed=await page.evaluate(ids=>ids.filter(id=>{
    if(!window.textbookApp.open(id))return true;
    const prompt=document.querySelector('.textbook-prompt'),drawing=document.querySelector('[data-main-model] svg');
    const action=document.querySelector('.textbook-prompt-action,.textbook-compact-answer');
    const visible=element=>{const box=element?.getBoundingClientRect();return box&&box.top>=0&&box.bottom<=innerHeight&&box.width>0;};
    return !visible(prompt)||!visible(drawing)||!visible(action)||document.documentElement.scrollWidth>innerWidth+1;
   }),earlyIds);
   assert.deepEqual(missed,[],'all early lessons fit the first screen at '+width+'px');
   console.log('ATANASYAN_EARLY_FIRST_SCREEN_OK: '+earlyIds.length+' cards at '+width+'×'+height);
  }
  // Live checks verify deployed code as well as unchanged course content.
  if(process.env.MOBILE_LAYOUT_LIVE_URL)for(const file of resources){const response=await context.request.get(base+file+'?layout-check='+Date.now());assert.equal(response.status(),200);assert.equal(crypto.createHash('sha256').update(await response.body()).digest('hex'),evidence.resources[file],file+' deployed bytes');}
  await context.close();
 }
 assert.deepEqual(evidence.errors,[]);evidence.completed=true;
 console.log('ATANASYAN_MOBILE_LAYOUT_OK: '+cards.length+' cards, '+evidence.measurements.length+' initial viewports; '+cards.length*3+' interaction/persistence journeys');
 for(const width of [320,390,1280]){const rows=evidence.measurements.filter(m=>m.width===width&&m.height>=800);console.log(width+'x'+rows[0].height+': '+rows.filter(m=>m.fits).length+'/'+rows.length+' fit; new '+rows.filter(m=>m.newCard&&m.fits).length+'/12; maximum required height '+Math.max(...rows.map(m=>m.requiredHeight)));}
})().catch(e=>{evidence.failure=e.stack;console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));await browser?.close();server?.close();});
