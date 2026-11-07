'use strict';
// A bounded additional diagnostic, not a substitute for the complete course gate.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.WEEKLY_EVIDENCE||'artifacts/weekly/geometry');
const bundle=JSON.parse(fs.readFileSync(path.join(root,'geometry-course/textbook/data/course.json'),'utf8'));
const engine=require(path.join(root,'geometry-course/textbook/assets/engine.js'));
const viewer=require(path.join(root,'geometry-course/textbook/assets/planar-viewer.js'));
const {expectedTitle}=require('../geometry-textbook/caption_expectations.cjs');
const text=l=>l.statement.text+' '+l.statement.goal;
const eligible=bundle.lessons.filter(l=>l.kind==='exercise'&&l.source.collection==='main'&&l.status==='reviewed'&&l.steps.length>=2);
const construction=l=>/постройте|построить|построй|построени/iu.test(text(l));
const proof=l=>!construction(l)&&/докажите|доказать|докажи|доказательств/iu.test(text(l));
function sample(items){assert(items.length>=10,'At least ten distinct source exercises required');return Array.from({length:10},(_,i)=>items[Math.floor(i*items.length/10)]);}
const selected=[...sample(eligible.filter(construction)).map(lesson=>({kind:'construction',lesson})),...sample(eligible.filter(proof)).map(lesson=>({kind:'proof',lesson}))];
assert.equal(new Set(selected.map(s=>s.lesson.id)).size,20);
fs.mkdirSync(out,{recursive:true});
const report={head:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),scope:'10 constructions + 10 proofs, two widths; bounded diagnostic',selected:selected.map(({kind,lesson:l})=>({kind,id:l.id,exercise:l.source.exercise,statement:l.statement.text,goal:l.statement.goal,steps:l.steps.length})),flows:[],errors:[],complete:false};
const write=()=>fs.writeFileSync(path.join(out,'geometry-sample.json'),JSON.stringify(report,null,2));
let browser,server;
async function drawing(page){
 await page.evaluate(()=>document.fonts.ready);
 return page.locator('[data-main-model] svg').evaluate(svg=>{
  const box=svg.viewBox.baseVal,m=svg.getScreenCTM(),scale=Math.min(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d));
  const labels=[...svg.querySelectorAll('.planar-label')].map(n=>{const b=n.getBBox();return {text:n.textContent,x:b.x,y:b.y,w:b.width,h:b.height,pixels:Number(n.getAttribute('font-size'))*scale};}),issues=[];
  for(const l of labels){if(l.pixels<17.6)issues.push('small label '+l.text);if(l.x<box.x||l.y<box.y||l.x+l.w>box.x+box.width||l.y+l.h>box.y+box.height)issues.push('clipped label '+l.text);}
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.3&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.3)issues.push('overlapping labels '+a.text+'/'+b.text);}
  if(/NaN|Infinity/.test(svg.outerHTML))issues.push('nonfinite drawing');
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal overflow');
  return {view:svg.dataset.view,labels,issues};
 });
}
(async()=>{
 for(const {lesson} of selected){assert.deepEqual(engine.validateLesson(lesson,bundle.catalog.book),[],lesson.id);assert.deepEqual(viewer.validateModel(lesson.visualization.model),[],lesson.id);assert.equal(lesson.answer.mode,'manual');}
 server=http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch{res.writeHead(400).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port,base=origin+'/geometry-course/textbook/';
 browser=await chromium.launch({headless:true});
 for(const width of [320,1280]){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  for(const {kind,lesson:l} of selected){
   await page.goto(base+'#'+l.id);await page.waitForFunction(()=>window.textbookApp);await page.evaluate(id=>window.textbookApp.open(id),l.id);
   assert.equal(await page.locator('.lesson-permalink').getAttribute('href'),'#'+l.id);
   assert((await page.locator('#textbook-app').innerText()).includes(expectedTitle(l)),l.id+' exact source caption');
   assert(await page.locator('[data-main-model] svg').isVisible());
   assert.equal(await page.locator('[data-step]').count(),0,'Solution initially concealed');
   const initial=await drawing(page);assert.deepEqual(initial.issues,[],l.id+' initial '+width);
   await page.screenshot({path:path.join(out,l.id+'-'+width+'-initial.png'),fullPage:false});
   const note='Тестовая запись QA: '+l.id;
   await page.locator('#final-answer').fill(note);await page.locator('[data-final-form] button').click();
   assert.match(await page.locator('[data-final-feedback]').innerText(),/обсудить с учителем/,'Proof is not automatically marked correct');
   if(!await page.locator('[data-main-help]').evaluate(n=>n.open))await page.locator('[data-main-help] > summary').click();
   await page.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();
   await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();
   assert.equal(await page.locator('[data-step]').count(),2,'Earlier step must remain');
   const key='mathExamTextbook.v1:'+l.source.bookId+':'+l.id+':r'+l.revision;
   const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.assisted,true);assert.equal(saved.revealed,2);
   await page.reload();await page.waitForFunction(()=>window.textbookApp);
   assert.equal(await page.locator('#final-answer').inputValue(),note,'Draft survives reload');assert.equal(await page.locator('[data-step]').count(),2,'Both revealed steps survive reload');
   for(let step=3;step<=l.steps.length;step++){await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();assert.equal(await page.locator('[data-step]').count(),step,'All earlier steps retained');}
   const final=await drawing(page);assert.deepEqual(final.issues,[],l.id+' final '+width);
   await page.screenshot({path:path.join(out,l.id+'-'+width+'-final.png'),fullPage:false});
   await page.reload();await page.waitForFunction(()=>window.textbookApp);assert.equal(await page.locator('[data-step]').count(),l.steps.length);assert.equal(await page.locator('#final-answer').inputValue(),note);
   report.flows.push({kind,id:l.id,width,steps:l.steps.length,initial,final,retainedDraft:true,retainedSteps:true,assisted:true,manualReview:true});write();
  }
  await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.equal(report.flows.length,40);report.complete=true;
 console.log('WEEKLY_GEOMETRY_20_OK: 20 distinct tasks, 40 browser flows, retained steps/drafts and honest manual proof review.');
})().catch(error=>{report.errors.push(error.stack);console.error(error);process.exitCode=1;}).finally(async()=>{write();if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
