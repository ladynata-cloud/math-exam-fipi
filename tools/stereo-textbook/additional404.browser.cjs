'use strict';
// Exercise the production route and its real persistence, never a promoted preview.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),course=require(root+'/stereo-course/textbook/data/course.json');
const {ids}=require('./additional404-baseline.cjs'),cards=course.lessons.filter(card=>ids.has(card.id));
const out=path.resolve(process.env.ADDITIONAL404_ARTIFACTS||'artifacts/atanasyan-additional404');fs.mkdirSync(out,{recursive:true});
const evidence={completed:false,commit:process.env.GITHUB_SHA||null,bundleSHA256:crypto.createHash('sha256').update(fs.readFileSync(root+'/stereo-course/textbook/data/course.json')).digest('hex'),widths:[320,390,1280],journeys:[],views:[],fractions:[],screenshots:[],errors:[]};
const stateKey=card=>'mathExamTextbook.v1:'+card.source.bookId+':'+card.id+':r'+card.revision;
let server,browser;
async function capture(page,name,selector){const file=path.join(out,name);if(selector)await page.locator(selector).screenshot({path:file});else await page.screenshot({path:file,fullPage:true});evidence.screenshots.push({file:name,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});}
async function layout(page,id){
 const data=await page.evaluate(()=>{const svg=document.querySelector('[data-main-model] svg'),v=svg.viewBox.baseVal;return {overflow:document.documentElement.scrollWidth-innerWidth,width:v.width,height:v.height,labels:[...svg.querySelectorAll('text[data-label]')].map(n=>{const b=n.getBBox();return {key:n.dataset.label,x:b.x,y:b.y,w:b.width,h:b.height};})};});
 assert(data.overflow<=1,id+' page overflow');
 for(const b of data.labels)assert(b.x>=-1&&b.y>=-1&&b.x+b.w<=data.width+1&&b.y+b.h<=data.height+1,id+' clipped label '+b.key);
}
(async()=>{
 let base=process.env.ADDITIONAL404_LIVE_URL;
 if(!base){server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(req.url.split('?')[0].endsWith('/'))file=path.join(file,'index.html');fs.readFile(file,(error,bytes)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream');res.end(bytes);});});await new Promise(resolve=>server.listen(0,'136.0.0.1',resolve));base='http://136.0.0.1:'+server.address().port+'/stereo-course/textbook/';}
 browser=await chromium.launch({headless:true});
 for(const width of evidence.widths){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
  await page.addInitScript(count=>{window.__additionalExpectedCount=count;},course.lessons.length);
  await page.goto(base);await page.waitForFunction(()=>window.textbookApp?.coverage.available===window.__additionalExpectedCount);
  const old=course.lessons.find(card=>!ids.has(card.id)&&card.answer?.mode==='manual');
  await page.evaluate(id=>textbookApp.open(id),old.id);await page.locator('#final-answer').fill('Старая сохранённая работа');
  const oldBytes=await page.evaluate(key=>localStorage.getItem(key),stateKey(old));
  for(const card of cards){
   await page.goto(base+'?additional404='+card.id+'#'+card.id);await page.waitForFunction(id=>document.querySelector('h1')&&location.hash==='#'+id&&document.querySelector('[data-main-model] svg'),card.id);
   assert.equal(await page.locator('main>header>h1').textContent(),card.title);
   assert.equal(await page.locator('[data-step]').count(),0);assert.equal(await page.locator('[data-main-help]').getAttribute('open'),null);
   const caption=await page.locator('main>header>[data-companion-source]').innerText();assert(caption.includes('К задаче № '+card.source.exercise));if(card.source.subpart)assert(caption.includes('подпункт '+card.source.subpart));
   await layout(page,card.id);const box=await page.locator('[data-main-model] svg').boundingBox();assert(box.width>=180&&box.height>=260,card.id+' large readable model');
   await capture(page,width+'-'+card.id+'-initial.png');
   const seen=new Set();
   async function modelState(){const view=await page.locator('[data-main-model] svg').getAttribute('data-view');await layout(page,card.id);if(seen.has(view))return;seen.add(view);await capture(page,width+'-'+card.id+'-'+view+'.png','[data-main-model]');evidence.views.push({id:card.id,width,view});}
   await modelState();await page.locator('#final-answer').fill('Моё доказательство '+card.id);
   const before=await page.locator('[data-main-model] svg').innerHTML();await page.getByRole('button',{name:'Повернуть вправо',exact:true}).click();assert.notEqual(await page.locator('[data-main-model] svg').innerHTML(),before);await page.getByRole('button',{name:'Вернуть исходный вид',exact:true}).click();
   await page.getByRole('button',{name:'Развернуть рисунок',exact:true}).click();assert.equal(await page.getByRole('dialog',{name:'Увеличенный рисунок задачи'}).count(),1);await page.getByRole('button',{name:'Закрыть рисунок',exact:true}).click();
   await page.locator('[data-main-help]>summary').click();
   for(const h of card.help){const summary=page.locator('[data-help="'+h.id+'"]>summary');await summary.click();await page.waitForFunction(view=>document.querySelector('[data-main-model] svg').dataset.view===view,h.view||'neutral');await modelState();await summary.click();}
   for(const step of card.steps){await page.locator('[data-steps]+button').click();await page.locator('[data-step="'+step.id+'"]>details>summary').click();await modelState();}
   assert.equal(await page.locator('[data-step]').count(),card.steps.length);assert.deepEqual([...seen].sort(),Object.keys(card.visualization.model.views).sort());
   const fractions=await page.locator('[data-steps] .stereo-fraction').evaluateAll(nodes=>nodes.map(n=>{const a=n.querySelector(':scope > .stereo-numerator'),b=n.querySelector(':scope > .stereo-denominator'),x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return {a:a.textContent,b:b.textContent,above:x.bottom<=y.top+.5,bar:parseFloat(getComputedStyle(a).borderBottomWidth),left:Math.min(x.left,y.left),right:Math.max(x.right,y.right)};}));
   for(const f of fractions)assert(f.above&&f.bar>=1&&f.left>=-1&&f.right<=width+1,card.id+' stacked fraction inside viewport: '+JSON.stringify(f));
   const expected={'ex-main-0404':[['(πl)','2']], 'ex-main-0405':[['1','3']], 'ex-main-0407':[['1','7']], 'ex-main-0409':[['3','4']]}[card.id]||[];
   for(const[a,b]of expected)assert(fractions.some(f=>f.a===a&&f.b===b),card.id+' exact fraction '+a+'/'+b);
   if(card.id==='ex-main-0405') assert(await page.locator('[data-steps] .stereo-fraction').last().evaluate(n=>(n.previousSibling?.textContent||'').trim().endsWith('−')),'405 negative sign remains before final fraction');
   evidence.fractions.push({id:card.id,width,count:fractions.length,expected});

   await capture(page,width+'-'+card.id+'-complete.png');
   const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),stateKey(card));assert.equal(saved.revealed,card.steps.length);assert.equal(saved.checked,false);
   await page.reload();await page.waitForFunction(()=>!!window.textbookApp);assert.equal(await page.locator('#final-answer').inputValue(),'Моё доказательство '+card.id);assert.equal(await page.locator('[data-step]').count(),card.steps.length);
   const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),stateKey(card));assert.deepEqual(after,saved,'reload retains stored work and model camera');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),stateKey(old)),oldBytes,'old card record preserved');
   evidence.journeys.push({id:card.id,width,steps:card.steps.length,reloaded:true,oldRecordUnchanged:true});
  }
  await context.close();
 }
 assert.equal(evidence.journeys.length,36);assert.equal(evidence.views.length,147);assert(evidence.fractions.reduce((n,x)=>n+x.count,0)>30);assert.deepEqual(evidence.errors,[]);evidence.completed=true;
 console.log('ATANASYAN_ADDITIONAL404_BROWSER_OK: 36 journeys, 147 model states, exact stacked fractions, reload persistence and old records at 320/390/1280');
})().catch(error=>{evidence.failure=error.stack;console.error(error);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));await browser?.close();server?.close();});
