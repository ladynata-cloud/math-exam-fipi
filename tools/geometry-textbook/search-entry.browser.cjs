'use strict';
// Exercise the actual public entry, including unavailable/slow course data.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),prefix='/geometry-course/textbook/',course=path.join(root,prefix),out=process.env.GEOMETRY_ENTRY_ARTIFACTS||path.join(os.tmpdir(),'atanasyan-search-entry');
fs.mkdirSync(out,{recursive:true});
const entry=fs.readFileSync(path.join(course,'index.html')),amendment=JSON.parse(fs.readFileSync(path.join(__dirname,'search-entry-amendment.json')));
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
assert.equal(hash(entry),amendment.files['index.html'].afterSha256,'Browser checks the current separately bound entry');
const bundle=JSON.parse(fs.readFileSync(path.join(course,'data/course.json'))),lesson=bundle.lessons.find(row=>row.source.collection==='main'&&row.source.exercise==='61');
const key='mathExamTextbook.v1:'+lesson.source.bookId+':'+lesson.id+':r'+lesson.revision;
const topics=['../trainers/ch4-p1-t2-proof-angle-sum.html','../trainers/ch2-p3-t2-proof-asa.html'];
const evidence={completed:false,indexSha256:hash(entry),bundleSha256:hash(fs.readFileSync(path.join(course,'data/course.json'))),sizes:[],failures:[],journeys:[],errors:[]};
let server,browser,base;
async function serve(){return new Promise(resolve=>{server=http.createServer((req,res)=>{
 try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(400).end();}
 });server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port));});}
async function inspectEntry(page,width){
 const result=await page.evaluate(()=>{
  const rect=node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
  return {overflow:document.documentElement.scrollWidth>innerWidth+1,links:[...document.querySelectorAll('.textbook-topic-links a')].map(node=>({href:node.getAttribute('href'),...rect(node)})),number:rect(document.querySelector('#textbook-number-title')),topic:rect(document.querySelector('#textbook-topic-title')),height:innerHeight};
 });
 assert.equal(result.overflow,false,'No horizontal scrolling at '+width);
 assert.deepEqual(result.links.map(row=>row.href),topics);
 assert(result.number.bottom<=result.height&&result.topic.bottom<=result.height,'Both choices are on the initial screen');
 for(const link of result.links)assert(link.bottom<=result.height&&link.top>=0,'Both concrete topics are on the initial screen');
 return result;
}
async function loaded(page){await page.waitForFunction(()=>window.textbookApp?.coverage.available===1425);}
(async()=>{try{
 base=await serve();browser=await chromium.launch({headless:true,executablePath:process.env.GEOMETRY_CHROMIUM||chromium.executablePath(),args:['--no-sandbox']});evidence.browser=browser.version();
 for(const width of [320,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',error=>evidence.errors.push(error.message));
  await context.addInitScript(()=>localStorage.setItem('search-entry-unrelated-fixture','retain me'));
  let release;const hold=new Promise(resolve=>release=resolve);
  await context.route('**/geometry-course/textbook/data/course.json',async route=>{await hold;await route.continue();});
  await page.goto(base+prefix,{waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>!!window.textbookApp),false,'Catalogue genuinely remains pending');
  assert.equal(await page.locator('#textbook-number-find').isDisabled(),true);
  evidence.sizes.push({width,beforeJSON:await inspectEntry(page,width)});
  await page.screenshot({path:path.join(out,'entry-pending-'+width+'.png'),fullPage:false});
  await page.locator('#textbook-number').fill('61');release();await loaded(page);
  assert.equal(await page.locator('#textbook-number').inputValue(),'61','Typing during the fetch survives initialization');
  await page.locator('#textbook-number').fill('');await page.locator('#textbook-number-find').click();assert.match(await page.locator('#textbook-number-message').innerText(),/Введите номер/);
  await page.locator('#textbook-number').fill('1432');await page.locator('#textbook-number-find').click();assert.match(await page.locator('#textbook-number-message').innerText(),/1431/);
  await page.locator('#textbook-number').fill('№ 61');await page.locator('#textbook-number-find').click();
  assert.equal(await page.locator('#catalog-search').inputValue(),'61');assert.equal(await page.locator('#catalog-collection').inputValue(),'main');
  const found=await page.locator('[data-catalog-ready] [data-lesson]').evaluateAll(nodes=>nodes.map(node=>node.dataset.lesson));
  assert(found.length>0&&found.every(id=>bundle.lessons.some(row=>row.id===id&&row.source.collection==='main'&&row.source.exercise==='61')),'Only parts of the requested textbook exercise');
  assert.equal(await page.evaluate(()=>localStorage.getItem('search-entry-unrelated-fixture')),'retain me');
  await page.locator('[data-lesson="'+lesson.id+'"]').click();await page.waitForSelector('.textbook-lesson-header');
  assert.equal(await page.locator('.textbook-entry').isVisible(),false,'Entry must not push the task or drawing down');
  await page.locator('main>header').evaluate(node=>node.classList.remove('textbook-lesson-header'));
  assert.equal(await page.locator('.textbook-entry').isVisible(),false,'Historical before-view runtime also keeps the entry out of the task');
  await page.locator('main>header').evaluate(node=>node.classList.add('textbook-lesson-header'));
  assert.equal(await page.evaluate(()=>scrollY),0,'A selected task starts at its condition');
  await page.locator('#final-answer').fill('Проверочный черновик: объясню каждый шаг.');
  await page.locator('[data-main-help]>summary').click();await page.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();
  const saved=await page.evaluate(key=>localStorage.getItem(key),key);assert(saved);
  await page.reload();await loaded(page);assert.equal(await page.locator('#final-answer').inputValue(),'Проверочный черновик: объясню каждый шаг.');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),saved,'All existing save fields survive the new entry');
  await page.getByRole('button',{name:'← Все материалы курса',exact:true}).click();assert.equal(await page.locator('.textbook-entry').isVisible(),true);assert.equal(await page.evaluate(()=>scrollY),0);
  await page.screenshot({path:path.join(out,'entry-ready-'+width+'.png'),fullPage:false});
  for(const href of topics){const response=await context.request.get(new URL(href,base+prefix).href);assert.equal(response.status(),200,'Direct topic remains a real page');}
  evidence.journeys.push({width,pendingJSON:true,emptyAndOutOfRange:true,numberSearch:found,retainedDraft:true,retainedSteps:true,returnToEntry:true,directTopicLinks:true});await context.close();
 }
 for(const failure of ['http','json']){
  const context=await browser.newContext({viewport:{width:320,height:900}}),page=await context.newPage();page.on('pageerror',error=>evidence.errors.push(error.message));let requests=0;
  await context.route('**/geometry-course/textbook/data/course.json',route=>++requests===1?route.fulfill({status:failure==='http'?503:200,contentType:'application/json',body:'unavailable'}):route.continue());
  await page.goto(base+prefix);await page.locator('#textbook-retry').waitFor({state:'visible'});
  assert.equal(await page.locator('#textbook-number-find').isDisabled(),true);assert.match(await page.locator('#textbook-load-status').innerText(),/не загрузился/);await inspectEntry(page,320);
  await page.screenshot({path:path.join(out,'entry-failure-'+failure+'.png'),fullPage:false});
  await page.locator('#textbook-retry').click();await loaded(page);assert.equal(requests,2);assert.equal(await page.locator('#textbook-retry').isVisible(),false);assert.equal(await page.locator('#textbook-number-find').isEnabled(),true);
  evidence.journeys.push({failure,retry:true,topicsRetained:true});await context.close();
 }
 const failedRuntime=await browser.newContext({viewport:{width:320,height:900}}),runtimePage=await failedRuntime.newPage();let engineRequests=0;
 runtimePage.on('pageerror',error=>evidence.errors.push(error.message));await failedRuntime.addInitScript(()=>window.fixtureDocumentToken=Math.random());
 await failedRuntime.route('**/geometry-course/textbook/assets/engine.js',route=>++engineRequests===1?route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(course,'assets/engine.js'),'utf8')+'\n{ const original=GeometryTextbook.createApp; GeometryTextbook.createApp=(...args)=>{original(...args);throw Error("Synthetic failure after runtime subscriptions");}; }'}):route.continue());
 await runtimePage.goto(base+prefix);await runtimePage.locator('#textbook-retry').waitFor({state:'visible'});assert.equal(await runtimePage.locator('#textbook-retry').innerText(),'Обновить страницу');const oldDocument=await runtimePage.evaluate(()=>window.fixtureDocumentToken);
 await runtimePage.locator('#textbook-retry').click();await loaded(runtimePage);assert.notEqual(await runtimePage.evaluate(()=>window.fixtureDocumentToken),oldDocument,'Partial runtime initialization retries in a fresh document');assert.equal(engineRequests,2);evidence.journeys.push({partialRuntimeFailure:true,newDocumentOnRetry:true});await failedRuntime.close();
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}}),page=await noJS.newPage();await page.goto(base+prefix);await inspectEntry(page,320);assert.equal(await page.locator('noscript').isVisible(),true);assert.equal(await page.locator('#textbook-number-find').isDisabled(),true);await page.screenshot({path:path.join(out,'entry-no-js.png'),fullPage:false});evidence.journeys.push({javaScriptDisabled:true,topicLinksRetained:true});await noJS.close();
 assert.deepEqual(evidence.errors,[]);evidence.completed=true;console.log('ATANASYAN_SEARCH_ENTRY_OK '+JSON.stringify({sizes:evidence.sizes.length,journeys:evidence.journeys.length,browser:evidence.browser}));
 }catch(error){evidence.failures.push(error.stack);console.error(error.stack);process.exitCode=1;}finally{fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));await browser?.close();server?.close();}
})();
