'use strict';
// Small release smoke, separate from the exhaustive source/model/browser gates.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const {expectedTitle}=require('./caption_expectations.cjs');
const root=path.resolve(__dirname,'../..'),prefix='/geometry-course/textbook/';
const mode=process.env.ATANASYAN_IX_MODE||'local';assert(['local','https'].includes(mode),'Unknown smoke mode');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
if(process.env.ATANASYAN_IX_HEAD)assert.equal(head,process.env.ATANASYAN_IX_HEAD,'Checkout must match the requested source commit');
const out=path.resolve(process.env.ATANASYAN_IX_ARTIFACTS||'artifacts/atanasyan-chapter09-live');fs.mkdirSync(out,{recursive:true});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const names=['index.html','data/course.json','source-inventory.json','assets/engine.js','assets/style.css','assets/math-text.js','assets/planar-viewer.js'];
const files=Object.fromEntries(names.map(name=>[prefix+name,fs.readFileSync(path.join(root,prefix.slice(1),name))]));
const expected=Object.fromEntries(Object.entries(files).map(([name,bytes])=>[name,sha(bytes)]));
for(const name of Object.keys(files))assert.equal(expected[name],sha(execFileSync('git',['show',head+':'+name.slice(1)],{cwd:root,maxBuffer:32*1024*1024})),name+' matches the source commit');
const bundle=JSON.parse(files[prefix+'data/course.json']),ix=bundle.lessons.filter(l=>l.source.chapter==='IX');
const releaseScope=JSON.parse(fs.readFileSync(path.join(__dirname,'release-scope.json'),'utf8'));
const evidence={schemaVersion:1,head,mode,origin:null,startedAt:new Date().toISOString(),scriptSha256:sha(fs.readFileSync(__filename)),
  expectedHashes:expected,matchedHashes:{},browserMatchedHashes:{},lessons:bundle.lessons.length,chapterIXCards:ix.length,
  chapterIXPresent:ix.length>0,localSmokePassed:false,httpsReleaseVerified:false,completed:false,checks:[],errors:[]};
let server,browser,base,visitSequence=0;
const contentType=name=>name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'javascript';
async function verifyBytes(){
 const found=await Promise.all(Object.keys(files).map(async name=>{
  const response=await fetch(new URL(name+'?release='+head+'&probe='+Date.now(),base),{redirect:'error',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,200,name+' HTTP status');assert((response.headers.get('content-type')||'').includes(contentType(name)),name+' content type');
  const actual=sha(Buffer.from(await response.arrayBuffer()));assert.equal(actual,expected[name],name+' exact committed bytes');return [name,actual];
 }));evidence.matchedHashes=Object.fromEntries(found);
}
async function waitForPublication(){
 const deadline=Date.now()+480000;
 while(true){try{await verifyBytes();return;}catch(error){evidence.lastPublicationMismatch=error.message;console.log('Waiting for exact release: '+error.message.split('\n')[0]);
  if(Date.now()>=deadline)throw error;await new Promise(resolve=>setTimeout(resolve,10000));}}
}
async function serve(){
 server=http.createServer((request,response)=>{
  const name=new URL(request.url,'http://127.0.0.1').pathname.replace(/\/$/,'/index.html'),bytes=files[name];
  if(!bytes){response.writeHead(404).end();return;}
  response.writeHead(200,{'Content-Type':contentType(name)==='javascript'?'application/javascript':contentType(name),'Cache-Control':'no-store'});response.end(bytes);
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port+prefix;
}
async function visit(page,lesson,pending,width){
 const response=await page.goto(base+'?release='+head+'&visit='+(++visitSequence)+'#'+lesson.id);assert.equal(response.status(),200);
 await page.waitForFunction(()=>window.textbookApp);await Promise.all(pending.splice(0));
 assert.equal(await page.locator('[data-preview-notice]').count(),0,'Use the genuine public entry');
 assert.equal(await page.locator('.lesson-permalink').getAttribute('href'),'#'+lesson.id);
 assert.equal(await page.locator('main h1').innerText(),expectedTitle(lesson));
 assert.equal(await page.evaluate(()=>window.textbookApp.coverage.available),bundle.lessons.length);
 assert.deepEqual(await page.evaluate(()=>window.textbookApp.issues),[]);
 const sourceMatches=await page.evaluate(lesson=>{const span=document.createElement('span');StereoMath.appendText(span,lesson.statement.text);return document.querySelector('.textbook-condition').innerHTML===span.innerHTML;},lesson);
 assert(sourceMatches,lesson.id+' original condition');
 for(const selector of ['main h1','.textbook-condition','[data-main-model] svg']){
  const node=page.locator(selector);assert(await node.isVisible(),selector+' visible');await node.scrollIntoViewIfNeeded();
  assert(await node.evaluate(n=>{const b=n.getBoundingClientRect();return b.width>0&&b.height>0&&b.top<innerHeight&&b.bottom>0;}),selector+' reaches viewport');
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 assert(!/NaN|Infinity/.test(await page.locator('[data-main-model] svg').evaluate(n=>n.outerHTML)),'Finite drawing');
 await page.screenshot({path:path.join(out,lesson.id+'-'+width+'.png'),fullPage:true});
 evidence.checks.push({id:lesson.id,width,directEntry:true,condition:true,drawing:true,overflow:false});
}
async function retainedWork(page,lesson,pending,width){
 await visit(page,lesson,pending,width);
 const draft='Проверочный черновик выпуска IX: '+width,key='mathExamTextbook.v1:'+lesson.source.bookId+':'+lesson.id+':r'+lesson.revision;
 await page.locator('#final-answer').fill(draft);await page.locator('[data-main-help] > summary').click();
 await page.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();
 const help=page.locator('[data-help="recall-theory"]');await help.locator(':scope > summary').click();
 await help.getByRole('button',{name:/^Почему\?/}).first().click();await page.locator('dialog').waitFor({state:'visible'});
 const theoryId=await page.locator('dialog').getAttribute('data-theory');assert(lesson.help.some(h=>h.theoryIds?.includes(theoryId)),'Actual source-linked theory');
 assert(await page.locator('dialog svg').isVisible());await page.getByRole('button',{name:'Вернуться к задаче',exact:true}).click();
 assert.equal(await page.locator('#final-answer').inputValue(),draft,'Theory return preserves draft');
 const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.draft,draft);assert.equal(saved.assisted,true);assert.equal(saved.revealed,1);
 await page.reload();await page.waitForSelector('#final-answer');await Promise.all(pending.splice(0));
 assert.equal(await page.locator('#final-answer').inputValue(),draft);assert.equal(await page.locator('[data-step]').count(),1);
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),saved,'Reload retains all synthetic work fields');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Restored assistance does not overflow');
 evidence.checks.push({id:lesson.id,width,draftReload:true,assisted:true,revealed:1,theoryReturn:theoryId});
}
(async()=>{try{
 assert.equal(bundle.build.publicationReviewMatches,true,'Expected bundle must be genuinely reviewed');
 assert(bundle.lessons.every(l=>l.status==='reviewed'),'Every published lesson is reviewed');
 // Validate the complete source-bound scope before allowing its exact total.
 // A later supplement must not relax the 160-card chapter IX or legacy checks.
 execFileSync('python3',[path.join(__dirname,'build_course.py'),'--check'],{cwd:root,stdio:'inherit'});
 execFileSync(process.execPath,[path.join(__dirname,'check_course.cjs'),'--require-reviewed'],{cwd:root,stdio:'inherit'});
 assert.equal(bundle.lessons.length,releaseScope.totalCards,'Exact independently validated release scope');
 if(ix.length){assert.equal(ix.length,160);}else{assert.equal(bundle.lessons.length,1247);assert.equal(mode,'local','HTTPS release requires chapter IX');evidence.skipped='IX absent: legacy public smoke only, no IX release success';}
 base=mode==='https'?'https://mathexam.space'+prefix:await serve();evidence.origin=base;
 if(mode==='https')await waitForPublication();else await verifyBytes();
 const ids=['main-736-part-1',...(ix.length?['main-737-part-1','main-823-part-1','theory-83-part-1','selfcheck-chapter-9-1-part-1']:[])].map(id=>'atanasyan-7-9-'+id);
 const lessons=ids.map(id=>{const lesson=bundle.lessons.find(l=>l.id===id);assert(lesson,'Source ID '+id);return lesson;});
 const sample=bundle.lessons.find(l=>l.source.chapter===(ix.length?'IX':'VIII')&&l.source.collection==='main'&&l.answer&&l.steps.length&&l.help.some(h=>h.id==='recall-theory'&&h.theoryIds?.length));assert(sample,'Source-linked theory interaction');
 browser=await chromium.launch({headless:true,...(process.env.GEOMETRY_CHROMIUM?{executablePath:process.env.GEOMETRY_CHROMIUM}:{})});evidence.browser=browser.version();
 for(const width of [320,1280]){
  // Nonpersistent, empty contexts: no real account, cookie, learner state or disk profile.
  const context=await browser.newContext({viewport:{width,height:900},extraHTTPHeaders:{'Cache-Control':'no-cache'}}),page=await context.newPage(),pending=[];
  // Routing disables the HTTP cache while preserving real responses for exact body verification.
  await context.route('**/*',route=>route.continue());
  page.setDefaultTimeout(15000);page.on('pageerror',error=>evidence.errors.push(error.message));
  page.on('response',response=>{const url=new URL(response.url()),name=url.pathname.replace(/\/$/,'/index.html');if(!(name in expected))return;
   pending.push((async()=>{assert.equal(url.origin,new URL(base).origin,'Resource origin');assert.equal(response.status(),200,name+' browser HTTP');
    const actual=sha(await response.body());assert.equal(actual,expected[name],name+' browser received exact committed bytes');evidence.browserMatchedHashes[name]=actual;
   })().catch(error=>{evidence.errors.push(error.message);}));});
  for(const lesson of lessons)await visit(page,lesson,pending,width);
  await retainedWork(page,sample,pending,width);await context.close();
 }
 for(const name of names.filter(n=>n!=='source-inventory.json'))assert.equal(evidence.browserMatchedHashes[prefix+name],expected[prefix+name],'Browser loaded '+name);
 await verifyBytes();assert.deepEqual(evidence.errors,[]);evidence.completed=true;
 evidence.localSmokePassed=mode==='local';evidence.httpsReleaseVerified=mode==='https'&&ix.length===160;
 console.log((evidence.httpsReleaseVerified?'ATANASYAN_IX_HTTPS_RELEASE_OK':'ATANASYAN_IX_LOCAL_PUBLIC_SMOKE_OK')+' '+JSON.stringify({head,lessons:bundle.lessons.length,ix:ix.length}));
 }catch(error){evidence.failure=error.stack;console.error(error.stack);process.exitCode=1;}
 finally{evidence.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'chapter09-live-evidence.json'),JSON.stringify(evidence,null,2));await browser?.close();server?.close();}
})();
