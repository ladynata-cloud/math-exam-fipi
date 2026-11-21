'use strict';
// The default mode keeps the isolated candidate closed at the ordinary entry.
// Explicit public mode checks the same journeys only after actual release review.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=process.env.GEOMETRY_TEXTBOOK_ROOT;
const publicRelease=process.env.ADVANCED8_PUBLIC_RELEASE==='1';
assert(root,'Set the course root to inspect');
const out=path.resolve(process.env.ADVANCED8_ARTIFACTS||'artifacts/advanced8-journeys');fs.mkdirSync(out,{recursive:true});
const bundle=JSON.parse(fs.readFileSync(path.join(root,'geometry-course/textbook/data/course.json')));
const lessons=bundle.lessons.filter(l=>l.source.advancedGrade===8);
assert.equal(lessons.length,18);assert.equal(bundle.lessons.length,1425);
assert.equal(bundle.build.publicationReviewMatches,publicRelease,'Review state must match the explicitly selected mode');
for(const lesson of lessons)assert.equal(lesson.status,publicRelease?'reviewed':'in-review');
if(publicRelease)assert.notEqual(bundle.build.candidateOnly,true,'A candidate cannot stand in for a public release');
const evidence={completed:false,scope:publicRelease?'reviewed-public-release':'isolated-unapproved-candidate',head:process.env.GEOMETRY_TEXTBOOK_HEAD||process.env.GITHUB_SHA||null,bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'geometry-course/textbook/data/course.json'))).digest('hex'),widths:[320,1280],journeys:[],preservation:[],errors:[],newCardsApproved:publicRelease};
let server,browser;
async function serve(){return new Promise(resolve=>{
 server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403).end();return;}
  if(!fs.existsSync(file)){res.writeHead(404).end();return;}
  const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json'};
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
 });server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port+'/geometry-course/textbook/'));
});}
(async()=>{try{
 const base=await serve();browser=await chromium.launch({headless:true,executablePath:process.env.GEOMETRY_CHROMIUM||chromium.executablePath(),args:['--no-sandbox']});
 for(const width of evidence.widths){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  page.on('pageerror',e=>evidence.errors.push(e.message));
  await page.goto(base+'#'+lessons[0].id);await page.waitForFunction(()=>window.textbookApp);
  assert.equal(await page.locator('[data-preview-notice]').count(),0);
  assert.equal(await page.evaluate(id=>window.textbookApp.open(id),lessons[0].id),publicRelease,'Ordinary entry admits reviewed cards and refuses unapproved content');
  const oldId='atanasyan-7-9-main-823-part-1';
  assert(await page.evaluate(id=>window.textbookApp.open(id),oldId));await page.locator('#final-answer').fill('Сохранённый черновик задачи 823');
  const oldRaw=await page.evaluate(id=>localStorage.getItem('mathExamTextbook.v1:atanasyan-2023-7-9:'+id+':r1'),oldId);
  for(const l of lessons){
   // A hash-only goto reuses the preceding document and its scroll position.
   // Use a distinct harmless query to measure a real cold document entry.
   await page.goto(base+(publicRelease?'':'review.html')+'?exercise='+l.source.exercise+'#'+l.id);await page.waitForFunction(()=>window.textbookApp);
   assert.equal(await page.locator('[data-preview-notice]').count(),publicRelease?0:1);
   assert.equal(await page.locator('main h1').innerText(),'К задаче №'+l.source.exercise);
   assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),'neutral');
   assert.equal(await page.locator('[data-step]').count(),0,'No solved step at cold entry');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const first=await page.evaluate(()=>{
    const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    return {scrollY,height:innerHeight,condition:box('.textbook-condition'),svg:box('[data-main-model] svg')};
   });
   assert.equal(first.scrollY,0,'Cold entry must start at top: '+l.source.exercise+' '+width);
   assert(first.condition.top>=0&&first.condition.bottom<=first.height,'Complete condition in first viewport: '+l.source.exercise+' '+width);
   assert(first.svg.top>=first.condition.bottom&&first.svg.bottom<=first.height,'Complete drawing in first viewport: '+l.source.exercise+' '+width+' '+JSON.stringify(first));
   await page.screenshot({path:path.join(out,l.source.exercise+'-initial-'+width+'.png'),fullPage:true});
   const draft='Моё доказательство '+l.source.exercise;await page.locator('#final-answer').fill(draft);
   await page.locator('[data-main-help] > summary').click();
   for(let i=0;i<l.steps.length;i++){
    await page.getByRole('button',{name:i?'Следующий шаг':'Разобрать по шагам',exact:true}).click();
    assert.equal(await page.locator('[data-step]').count(),i+1);
    assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),'step-'+(i+1));
   }
   await page.locator('[data-steps] details').evaluateAll(ns=>ns.forEach(n=>n.open=true));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded proof overflow');
   await page.screenshot({path:path.join(out,l.source.exercise+'-complete-'+width+'.png'),fullPage:true});
   await page.reload();await page.waitForFunction(()=>window.textbookApp);
   assert.equal(await page.locator('#final-answer').inputValue(),draft);
   assert.equal(await page.locator('[data-step]').count(),l.steps.length);
   assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),'step-'+l.steps.length);
   const refs=l.help.find(h=>h.theoryIds?.length);
   if(refs){
    if(!await page.locator('[data-main-help]').evaluate(n=>n.open))await page.locator('[data-main-help] > summary').click();
    const help=page.locator('[data-main-help] [data-help="recall-theory"]');
    await help.locator(':scope > summary').click();await help.getByRole('button',{name:/^Почему\?/}).first().click();
    await page.locator('dialog').waitFor({state:'visible'});await page.getByRole('button',{name:'Вернуться к задаче',exact:true}).click();
    assert.equal(await page.locator('#final-answer').inputValue(),draft);
    assert.equal(await page.locator('[data-step]').count(),l.steps.length);
   }
   await page.locator('[data-final-form] button').click();assert.match(await page.locator('[data-final-feedback]').innerText(),/обсудить с учителем/);
   evidence.journeys.push({number:l.source.exercise,width,steps:l.steps.length,coldLink:true,firstViewport:first,reload:true,theoryReturn:!!refs,manualAssessment:true});
  }
  await page.goto(base+'#'+oldId);await page.waitForFunction(()=>window.textbookApp);
  assert.equal(await page.locator('#final-answer').inputValue(),'Сохранённый черновик задачи 823');
  assert.equal(await page.evaluate(id=>localStorage.getItem('mathExamTextbook.v1:atanasyan-2023-7-9:'+id+':r1'),oldId),oldRaw);
  evidence.preservation.push({width,oldCard:'823',draftExact:true,ordinaryEntryExcludesCandidate:!publicRelease,ordinaryEntryAdmitsReviewed:publicRelease});await context.close();
 }
 assert.equal(evidence.journeys.length,36);assert.deepEqual(evidence.errors,[]);evidence.completed=true;
 console.log((publicRelease?'ADVANCED8_824_841_PUBLIC_JOURNEYS_PASS ':'ADVANCED8_824_841_JOURNEYS_PASS ')+JSON.stringify({journeys:evidence.journeys.length,preserved:evidence.preservation.length}));
}catch(e){evidence.failure=e.stack;console.error(e);process.exitCode=1;}finally{
 fs.writeFileSync(path.join(out,'journeys.json'),JSON.stringify(evidence,null,2));await browser?.close();server?.close();
}})();
