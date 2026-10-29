'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),C=require(root+'/stereo-course/data/course.json'),T=require(root+'/stereo-course/assets/tasks.js'),A=require(root+'/stereo-course/assets/answer.js'),out=process.env.STEREO_ARTIFACTS||path.join(require('os').tmpdir(),'mathexam-stereo-task-first');
fs.mkdirSync(out,{recursive:true});
const labelEvidence=[];
const hash=bytes=>require('node:crypto').createHash('sha256').update(bytes).digest('hex');
const heroSources=()=>Object.fromEntries(['stereo-course/assets/app.js','stereo-course/index.html'].map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
async function checkHomeHero(page){
 const data=await page.locator('.hero-art svg').evaluate(svg=>({
  paths:[...svg.querySelectorAll('[data-hero-lines]')].map(p=>{const s=getComputedStyle(p);return{group:p.dataset.heroLines,dash:s.strokeDasharray,stroke:s.stroke,width:parseFloat(s.strokeWidth),length:p.getTotalLength()};}),
  fillStrokes:[...svg.querySelectorAll('path:not([data-hero-lines])')].map(p=>getComputedStyle(p).stroke)
 }));
 assert.equal(data.paths.length,4);
 for(const p of data.paths){assert(p.length>0&&p.width>0&&p.stroke!=='none','cover edges are painted');assert.equal(p.dash!=='none',p.group.endsWith('hidden'),'computed rear dash style');}
 assert(data.fillStrokes.every(s=>s==='none'),'section fill cannot repaint hidden edges');
 return data;
}
async function checkFigureLabels(page,id,width,stage){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const measured=await page.locator('#task-model svg').evaluate(svg=>{const view=svg.viewBox.baseVal,m=svg.getScreenCTM(),scale=Math.hypot(m.a,m.b);return {width:view.width,height:view.height,labels:[...svg.querySelectorAll('.am-label')].map(el=>{const b=el.getBBox();return {key:el.dataset.label,text:el.textContent,x:b.x,y:b.y,width:b.width,height:b.height,pixels:parseFloat(getComputedStyle(el).fontSize)*scale};})};});
 const overlaps=[];for(let i=0;i<measured.labels.length;i++)for(let j=i+1;j<measured.labels.length;j++){const a=measured.labels[i],b=measured.labels[j];if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1)overlaps.push([a.key,b.key]);}
 labelEvidence.push({id,viewport:width,stage,...measured,overlaps});fs.writeFileSync(path.join(out,'integrated-label-bounds.json'),JSON.stringify(labelEvidence,null,2));
 for(const label of measured.labels){assert(label.pixels>=18,id+' readable label '+label.key+' at'+width);assert(label.x>=-1&&label.y>=-1&&label.x+label.width<=measured.width+1&&label.y+label.height<=measured.height+1,id+' label bounds '+label.key);}
 assert.deepEqual(overlaps,[],id+' overlapping labels at'+width+' '+stage);
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.STEREO_CHROMIUM||undefined,args:['--no-sandbox']}),context=await browser.newContext({viewport:{width:1280,height:960},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const base='file://'+root+'/stereo-course/index.html';await page.goto(base);
  const heroEvidence={sourceHashes:heroSources(),views:[]};
  for(const width of [320,1280]){
   await page.setViewportSize({width,height:960});const paint=await checkHomeHero(page);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'course cover fits '+width);
   const filename='home-hero-'+width+'.png',bytes=await page.locator('.hero-art').screenshot({path:path.join(out,filename)});
   heroEvidence.views.push({width,filename,sha256:hash(bytes),paint});
  }
  const rear=page.locator('[data-hero-lines="body-hidden"]');await rear.evaluate(p=>p.style.strokeDasharray='none');
  try{await assert.rejects(()=>checkHomeHero(page),/computed rear dash style/);}finally{await rear.evaluate(p=>p.style.removeProperty('stroke-dasharray'));}
  await checkHomeHero(page);heroEvidence.negativeControl='solid rear stroke rejected';assert.deepEqual(heroSources(),heroEvidence.sourceHashes);
  fs.writeFileSync(path.join(out,'home-hero-visibility-evidence.json'),JSON.stringify(heroEvidence,null,2)+'\n');
  for(const u of C.units){
   await page.locator('[data-unit="'+u.id+'"]').first().click();await page.locator('#task-model svg').waitFor({state:'visible'});assert(await page.locator('#answer').isVisible(),u.id+' answer visible before help');assert.equal(await page.locator('#task-help').evaluate(e=>e.open),false);
   const condition=await page.locator('.task-question').innerText();assert.ok(condition.length>15);
   await page.fill('#answer','мой ответ '+u.id);await page.evaluate(()=>{window.keptModel=document.querySelector('#task-model svg');window.keptInput=document.querySelector('#answer');});
   const rotate=page.locator('#task-model button[aria-label="Повернуть влево"]');if(await rotate.count())await rotate.click();
   const shapeBefore=await page.locator('#task-model svg').innerHTML();
   await page.locator('[data-action=help]').click();await page.locator('#task-guide>summary').click();await page.locator('#step-answer').waitFor({state:'visible'});await page.fill('#step-answer','промежуточный');
   await page.locator('#task-help>summary').click();await page.locator('[data-action=help]').click();
   assert(await page.evaluate(()=>window.keptModel===document.querySelector('#task-model svg')&&window.keptInput===document.querySelector('#answer')),u.id+' preserved nodes');assert.equal(await page.inputValue('#answer'),'мой ответ '+u.id);assert.equal(await page.inputValue('#step-answer'),'промежуточный');
   const rec=await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamStereo.v1')).units[id],u.id),t=T.make(u.task,rec.seed);assert.equal(rec.assisted,true);
   await page.fill('#step-answer',A.format(t.steps[0].a));await page.locator('#step-answer-form button').click();assert.equal(await page.inputValue('#answer'),'мой ответ '+u.id);
   await page.fill('#answer',A.format(t.a));await page.locator('#answer-form button').click();assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('mathExamStereo.v1')).units[id].independent,u.id),0);
   await page.locator('[data-action=close-help]').click();assert(await page.evaluate(()=>window.keptModel===document.querySelector('#task-model svg')));assert.equal(await page.locator('#task-model svg').innerHTML(),shapeBefore,u.id+' camera and initial figure after help');
   await page.locator('[data-action=home]').first().click();
  }
  for(const width of [320,768,1280]){
   await page.setViewportSize({width,height:960});
   for(const id of ['sections','sphere','box','ceva-menelaus','cone']){
    // Use direct known source IDs only; no guessed lesson route.
    assert(C.units.some(u=>u.id===id),id+' known lesson');
    await page.goto(base+'#'+id);await page.reload();await page.locator('#task-model svg').waitFor({state:'visible'});if(await page.locator('#task-help').evaluate(e=>e.open))await page.locator('[data-action=close-help]').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' initial overflow '+width);
    await page.screenshot({path:path.join(out,id+'-'+width+'-task.png'),fullPage:true});await checkFigureLabels(page,id,width,'task');if(!await page.locator('#task-help').evaluate(e=>e.open))await page.locator('[data-action=help]').click();if(!await page.locator('#task-guide').evaluate(e=>e.open))await page.locator('#task-guide>summary').click();await page.locator('#step-answer').waitFor({state:'visible'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' help overflow '+width);
    await page.screenshot({path:path.join(out,id+'-'+width+'-help.png'),fullPage:true});await checkFigureLabels(page,id,width,'help');
   }
  }
  // Two real tabs share saved work; an old tab must not overwrite a later condition.
  await page.goto(base+'#box');await page.reload();await page.locator('[data-action=new]').click();await page.fill('#answer','старый локальный черновик');
  const second=await page.context().newPage();second.on('pageerror',e=>errors.push(e.message));await second.goto(base+'#box');await second.locator('#answer').waitFor();await second.locator('[data-action=new]').click();await second.fill('#answer','новая сохранённая работа');await second.locator('[data-action=help]').click();
  const latest=await second.evaluate(()=>localStorage.getItem('mathExamStereo.v1'));await page.locator('[data-recover-latest]').waitFor({state:'visible'});assert(await page.locator('#answer-form button').isDisabled());
  await page.locator('#answer-form').evaluate(el=>el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));assert.equal(await second.evaluate(()=>localStorage.getItem('mathExamStereo.v1')),latest);assert.equal(await page.locator('[data-recovery-drafts] textarea').first().inputValue(),'старый локальный черновик');
  await page.locator('[data-recover-latest]').click();assert.equal(await page.inputValue('#answer'),'новая сохранённая работа');assert.equal(await page.locator('[data-recovery-drafts] textarea').first().inputValue(),'старый локальный черновик');await second.close();
  assert.deepEqual(errors,[]);console.log('STEREO_TASK_FIRST_BROWSER_OK: all39units, retained live models/drafts, honest help,320/768/1280px');
 }catch(error){await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});console.error(error);process.exitCode=1;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
