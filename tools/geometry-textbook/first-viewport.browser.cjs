'use strict';
// Real viewport coordinates, measured before any locator action can scroll.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),prefix='geometry-course/textbook/';
const bundle=JSON.parse(fs.readFileSync(path.join(root,prefix,'data/course.json')));
const out=path.resolve(process.env.GEOMETRY_VIEWPORT_ARTIFACTS||path.join(os.tmpdir(),'atanasyan-first-viewport'));
fs.mkdirSync(out,{recursive:true});
const sizes=[{width:320,height:900},{width:390,height:844},{width:1280,height:900},{width:1440,height:900}];
const explicit=['main-694-part-1','main-722-part-1','main-61-part-1','main-89-part-1','main-44-part-1','main-9-part-1','main-91-part-4','main-384-part-1','main-657-part-1','theory-73-part-1','theory-42-part-1','theory-74-part-1','main-30-part-1'].map(id=>'atanasyan-7-9-'+id);
const evidence={completed:false,browser:null,source:'actual public entry, fresh synthetic local storage',sizes,measurements:[],comparisons:[],interactions:[],negativeControls:[],errors:[],runtimeSha256:{}};
for(const name of ['assets/engine.js','assets/style.css','assets/planar-viewer.js','data/course.json'])evidence.runtimeSha256[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,prefix,name))).digest('hex');
const amendment=JSON.parse(fs.readFileSync(path.join(__dirname,'first-viewport-amendment.json')));
function historicalFile(file){
 let raw=fs.readFileSync(file),name=path.relative(path.join(root,prefix),file),change=amendment.files[name];
 if(!change)return raw;
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),change.afterSha256,'Actual amended bytes');
 let text=raw.toString();for(const row of [...change.changes].reverse()){assert.equal(text.split(row.after).length,2);text=text.replace(row.after,row.before)}
 assert.equal(crypto.createHash('sha256').update(text).digest('hex'),change.beforeSha256,'Exact original screenshot source');return text;
}
let server,browser,page,base;
function serve(){return new Promise(resolve=>{server=http.createServer((req,res)=>{
 let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),before=pathname.startsWith('/__viewport_before__/');
 if(before)pathname=pathname.replace('/__viewport_before__','');
 const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
 if(before)res.end(historicalFile(file));else fs.createReadStream(file).pipe(res);
 });server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port+'/'+prefix));})}
async function comparable(p){return p.evaluate(()=>{
 const r=s=>{let n=document.querySelector(s),b=n.getBoundingClientRect();return {top:b.top,bottom:b.bottom,width:b.width,height:b.height}};
 return {scrollY,condition:r('.textbook-condition'),svg:r('[data-main-model] svg'),font:parseFloat(getComputedStyle(document.querySelector('.textbook-condition')).fontSize)};
})}
async function measure(){return page.evaluate(()=>{
 const one=s=>document.querySelector(s),rect=e=>{let r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
 const condition=one('.textbook-condition'),problem=one('.textbook-problem'),svg=one('[data-main-model] svg'),title=one('main h1');
 const clip=rect(one('.planar-viewport')),labels=[...svg.querySelectorAll('.planar-label')].map(n=>{let m=n.getScreenCTM();return {point:n.dataset.point,px:Number(n.getAttribute('font-size'))*Math.min(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d)),...rect(n)}});
 const visible=e=>{let s=getComputedStyle(e);return s.display!=='none'&&s.visibility==='visible'&&Number(s.opacity)>0&&!e.closest('details:not([open]),[hidden]')};
 return {scrollY,viewport:{width:innerWidth,height:innerHeight},condition:rect(condition),problem:rect(problem),title:rect(title),svg:rect(svg),clip,labels,conditionFont:parseFloat(getComputedStyle(condition).fontSize),conditionVisible:visible(condition),titleVisible:visible(title),overflow:document.documentElement.scrollWidth>innerWidth+1,helpOpen:one('[data-main-help]').open,sourceOpen:one('.textbook-source').open};
})}
function check(m,id){
 assert.equal(m.scrollY,0,id+' initial page must not auto-scroll');
 assert(m.conditionVisible&&m.titleVisible,id+' full condition/title visible');
 assert(!m.overflow,id+' horizontal overflow');
 assert(m.condition.top>=0&&m.condition.top<=(m.viewport.width<851?400:210),id+' condition pushed below header budget');
 assert(m.condition.top-m.title.bottom<=40,id+' service content between title and condition');
 assert(m.svg.top-m.problem.bottom<=24&&m.svg.top>=m.problem.bottom-1,id+' SVG must follow the complete problem immediately');
 assert(m.svg.height>=199&&m.svg.width>=270,id+' drawing must remain usable');
 assert(m.conditionFont>=(m.viewport.width<=500?18.7:20.9)-.01,id+' condition font reduced');
 assert(m.svg.top>=m.clip.top-.1&&m.svg.bottom<=m.clip.bottom+.1,id+' initial SVG clipped by its own viewport');
 for(const label of m.labels)assert(label.px>=17.6,id+' small mathematical label '+label.point);
 assert(!m.helpOpen&&!m.sourceOpen,id+' help/bibliography should start closed');
 if(/main-(694|722)-part-1$/.test(id)){
  assert(m.condition.bottom<=m.viewport.height,id+' complete condition in first viewport');
  assert(m.svg.bottom<=m.viewport.height,id+' complete SVG in first viewport');
  for(const l of m.labels)assert(l.top>=0&&l.bottom<=m.viewport.height,id+' painted label outside first viewport');
 }
}
async function open(id,direct=false){
 if(direct){await page.goto(base+'#'+id);await page.waitForFunction(()=>window.textbookApp);}
 else await page.evaluate(id=>{window.textbookApp.open(id);window.scrollTo(0,0)},id);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
async function interactions(){
 const id=explicit[0],lesson=bundle.lessons.find(x=>x.id===id),key='mathExamTextbook.v1:'+lesson.source.bookId+':'+id+':r'+lesson.revision;
 for(const size of [sizes[0],sizes[2]]){
  await page.setViewportSize(size);await page.goto(base);await page.waitForFunction(()=>window.textbookApp);await page.evaluate(()=>localStorage.clear());await open(id,true);
  await page.locator('.textbook-source>summary').click();assert((await page.locator('.textbook-source').innerText()).includes('К параграфу'));assert.equal(await page.locator('.lesson-permalink').getAttribute('href'),'#'+id);assert(!(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}').assisted,key)),'Bibliography is not mathematical assistance');
  await page.locator('#final-answer').fill('Мой сохранённый черновик, №694.');
  await page.locator('[data-main-help]>summary').click();
  await page.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();
  await page.locator('[data-main-model]').getByRole('button',{name:'Увеличить чертёж',exact:true}).click();
  assert.equal(await page.locator('.planar-viewport').evaluate(n=>getComputedStyle(n).maxHeight),size.height*.7+'px','Requested zoom preserves the inner scroll limit');
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.revealed,2);assert.equal(saved.assisted,true);
  await page.reload();await page.waitForSelector('#final-answer');assert.equal(await page.locator('#final-answer').inputValue(),saved.draft);assert.equal(await page.locator('[data-step]').count(),2);
  assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),saved,'Reload retains all work/camera/assistance fields');
  const model=page.locator('[data-main-model]');await model.getByRole('button',{name:'На весь экран',exact:true}).click();await page.waitForFunction(()=>document.fullscreenElement||document.querySelector('.planar-expanded'));await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.fullscreenElement&&!document.querySelector('.planar-expanded'));assert.equal(await page.locator('#final-answer').inputValue(),saved.draft);
  await page.locator('[data-final-form] button').click();assert.match(await page.locator('[data-final-feedback]').innerText(),/обсудить с учителем/);
  await page.getByRole('button',{name:'← Все материалы курса',exact:true}).click();assert.equal(await page.locator('#catalog-search').count(),1);await open(id);assert.equal(await page.locator('#final-answer').inputValue(),saved.draft);
  evidence.interactions.push({width:size.width,draft:true,steps:2,camera:true,fullscreen:true,manualProof:true,bibliography:true,catalog:true});
 }
}
(async()=>{try{
 base=await serve();browser=await chromium.launch({headless:true,executablePath:process.env.GEOMETRY_CHROMIUM||chromium.executablePath(),args:['--no-sandbox',...(process.env.GEOMETRY_SINGLE_PROCESS==='1'?['--no-zygote','--single-process']:[])]});evidence.browser=browser.version();
 const context=await browser.newContext();page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
 for(const size of sizes){
  await page.setViewportSize(size);await open(explicit[0],true);
  const lessons=process.env.GEOMETRY_VIEWPORT_SAMPLE==='1'?bundle.lessons.filter(l=>explicit.includes(l.id)):bundle.lessons;
  for(const lesson of lessons){
   await open(lesson.id);const m=await measure();check(m,lesson.id);
   // Compare every visible mathematical condition/given/goal with the source
   // through the existing formatter; preserve fractions rather than flattening.
   const preserved=await page.evaluate(lesson=>{const formatted=text=>{let n=document.createElement('span');StereoMath.appendText(n,text);return n.innerHTML};let problem=document.querySelector('.textbook-problem');return document.querySelector('.textbook-condition').innerHTML===formatted(lesson.statement.text)&&JSON.stringify([...problem.querySelectorAll('li')].map(n=>n.innerHTML))===JSON.stringify((lesson.statement.givens||[]).map(formatted))&&document.querySelector('.textbook-goal').innerHTML===formatted(lesson.statement.goal)},lesson);
   assert(preserved,lesson.id+' complete original problem content');
   evidence.measurements.push({id:lesson.id,width:size.width,...m});
   if(explicit.includes(lesson.id)){
    await page.screenshot({path:path.join(out,lesson.id+'-'+size.width+'.png'),fullPage:false});
    const current=await comparable(page),beforePage=await page.context().newPage();await beforePage.setViewportSize(size);
    await beforePage.goto(base.replace('/'+prefix,'/__viewport_before__/'+prefix)+'#'+lesson.id);await beforePage.waitForSelector('[data-main-model] svg');
    await beforePage.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const before=await comparable(beforePage);
    assert.equal(before.scrollY,0);assert.equal(current.font,before.font,'Condition font preserved');
    assert(Math.abs(current.svg.width-before.svg.width)<.1&&Math.abs(current.svg.height-before.svg.height)<.1,'Mathematical drawing dimensions preserved');
    assert(current.condition.top<before.condition.top&&current.svg.top<before.svg.top,'Condition and SVG moved earlier');
    if(lesson.id===explicit[0]&&size.width===320)assert(before.svg.top>size.height,'Reproduce original694 failure');
    if(lesson.id===explicit[1]&&size.width===1280)assert(before.svg.bottom>size.height,'Reproduce original722 failure');
    await beforePage.screenshot({path:path.join(out,'before-'+lesson.id+'-'+size.width+'.png'),fullPage:false});
    evidence.comparisons.push({id:lesson.id,width:size.width,before,after:current});await beforePage.close();
   }
  }
 }
 // Prove these checks reject the old failure, hidden text and a reduced figure.
 await page.setViewportSize(sizes[0]);await open(explicit[0]);
 for(const [name,css] of [['header-push','main header{padding-bottom:950px!important}'],['hidden-condition','.textbook-condition{display:none!important}'],['shrunken-svg','[data-main-model] svg{height:80px!important;min-height:0!important}']]){
  const style=await page.addStyleTag({content:css});const broken=await measure();assert.throws(()=>check(broken,explicit[0]),undefined,name);evidence.negativeControls.push(name);
  await style.evaluate(n=>n.remove());
 }
 await interactions();assert.deepEqual(evidence.errors,[]);evidence.completed=true;
 console.log('ATANASYAN_FIRST_VIEWPORT_OK '+JSON.stringify({cards:bundle.lessons.length,scenarios:evidence.measurements.length,interactions:evidence.interactions.length,browser:evidence.browser}));
 }catch(e){evidence.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{fs.writeFileSync(path.join(out,'first-viewport-evidence.json'),JSON.stringify(evidence,null,2));await browser?.close();server?.close();}})();
