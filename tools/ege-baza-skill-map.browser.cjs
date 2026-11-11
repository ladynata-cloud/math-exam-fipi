'use strict';
// Real browser journeys; all state belongs to isolated synthetic browser profiles.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.EGE_SKILL_MAP_SHOTS||'artifacts/base-skill-map';
const server=http.createServer((request,response)=>{
 try{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep))throw Error('path');
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  response.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  response.end(fs.readFileSync(file));
 }catch{response.writeHead(404).end();}
});
let browser,checks=0;const errors=[];
const ok=(value,label)=>{assert.ok(value,label);checks++;};
const expectCount=async(page,selector,count,label)=>ok(await page.locator(selector).count()===count,label);
const fits=async(page,label)=>{
 const layout=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,cls:e.getAttribute('class'),text:e.textContent?.trim().slice(0,70),left:r.left,right:r.right,width:r.width};}).filter(e=>e.width>0&&(e.right>innerWidth+1||e.left< -1)).slice(0,15)}));
 const fits=layout.scroll<=layout.viewport+1;
 if(!fits)await page.screenshot({path:path.join(shots,'overflow-'+checks+'.png'),fullPage:true});
 ok(fits,'no horizontal overflow: '+label+(fits?'':' '+JSON.stringify(layout)));
};
// Count real canvas drawing without replacing either renderer or its animation clock.
async function watchCanvasDrawing(page){
 await page.addInitScript(()=>{
  window.__egeCanvasDraws=new WeakMap();
  for(const name of ['clearRect','setTransform']){
   const original=CanvasRenderingContext2D.prototype[name];
   CanvasRenderingContext2D.prototype[name]=function(...args){
    window.__egeCanvasDraws.set(this.canvas,(window.__egeCanvasDraws.get(this.canvas)||0)+1);
    return Reflect.apply(original,this,args);
   };
  }
 });
}
async function movingCanvas(page,selector,label){
 const canvas=await page.locator(selector).elementHandle();
 const before=await canvas.evaluate(node=>window.__egeCanvasDraws.get(node)||0);
 await page.waitForFunction(({canvas,before})=>(window.__egeCanvasDraws.get(canvas)||0)>before+2,{canvas,before});
 ok(true,label+' is actually drawing');
 return canvas;
}
async function disposedCanvas(page,canvas,label){
 ok(await canvas.evaluate(node=>!node.isConnected),label+' is detached');
 const before=await canvas.evaluate(node=>window.__egeCanvasDraws.get(node)||0);
 await page.evaluate(async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>requestAnimationFrame(resolve));});
 ok(await canvas.evaluate(node=>window.__egeCanvasDraws.get(node)||0)===before,label+' no longer draws after cleanup');
 await canvas.dispose();
}
async function sameExamCards(page,label){
 ok(await page.evaluate(()=>window.__egeExamCards.every((node,index)=>node===document.querySelectorAll('[data-exam-position]')[index])),'visual switch preserves card DOM: '+label);
}
async function checkVisualSwitch(page,width){
 const stars=page.locator('[data-exam-visual="stars"]'),oceanChoice=page.locator('[data-exam-visual="ocean"]');
 const oldStars=await movingCanvas(page,'.star-sky canvas','star animation');
 await page.evaluate(()=>{window.__egeExamCards=[...document.querySelectorAll('[data-exam-position]')];});
 await oceanChoice.press('Enter');
 const ocean=page.getByRole('region',{name:'Подводная экспедиция'});
 await ocean.waitFor();
 ok(await page.locator('[data-exam-visual-host]').getAttribute('data-active-visual')==='ocean','ocean selection is explicit');
 ok(await oceanChoice.getAttribute('aria-pressed')==='true'&&await stars.getAttribute('aria-pressed')==='false','visual buttons report ocean selection');
 await expectCount(page,'.star-sky',0,'inactive star scene is unmounted');
 await expectCount(page,'[data-ocean-station]',7,'all seven published ocean stations remain');
 await expectCount(page,'[data-exam-position]',21,'ocean keeps all ordinary exam cards');
 await sameExamCards(page,'stars to ocean');
 await disposedCanvas(page,oldStars,'old star canvas');
 await fits(page,'selected ocean '+width);
 if(width===320)await ocean.getByRole('combobox',{name:'Станция'}).selectOption('4');
 else await ocean.locator('[data-ocean-station="4"]').press('Enter');
 await ocean.locator('canvas').scrollIntoViewIfNeeded();
 await ocean.getByRole('button',{name:'Включить анимацию'}).click();
 const firstOcean=await movingCanvas(page,'.ocean-expedition canvas','ocean animation');
 await page.screenshot({path:path.join(shots,'combined-ocean-'+width+'.png'),fullPage:false});
 const taskLink=ocean.locator('.ocean-expedition-tasks a').first(),href=await taskLink.getAttribute('href');
 const number=new URLSearchParams(href.split('?')[1]).get('pos');
 await taskLink.click();await page.locator('[data-exam-task="'+number+'"]').waitFor();
 await disposedCanvas(page,firstOcean,'ocean canvas after leaving the map');
 await page.locator('#content a[href="#map"]').first().click();await ocean.waitFor();
 ok(await oceanChoice.getAttribute('aria-pressed')==='true','return from a task preserves the chosen visual');
 ok(await ocean.locator('[data-ocean-station="4"]').getAttribute('aria-pressed')==='true','return preserves the chosen ocean station');
 await ocean.locator('canvas').scrollIntoViewIfNeeded();
 const secondOcean=await movingCanvas(page,'.ocean-expedition canvas','restored ocean animation');
 await page.evaluate(()=>{window.__egeExamCards=[...document.querySelectorAll('[data-exam-position]')];});
 await stars.press('Space');await page.locator('.star-sky').waitFor();
 ok(await page.locator('[data-exam-visual-host]').getAttribute('data-active-visual')==='stars','keyboard Space selects stars');
 ok(await stars.getAttribute('aria-pressed')==='true'&&await oceanChoice.getAttribute('aria-pressed')==='false','visual buttons report star selection');
 await expectCount(page,'.ocean-expedition',0,'inactive ocean scene is unmounted');
 await sameExamCards(page,'ocean to stars');
 await disposedCanvas(page,secondOcean,'old ocean canvas');
 ok(await page.locator('[data-star-position="21"]').getAttribute('aria-pressed')==='true','return preserves selected star');
 await page.locator('.star-sky canvas').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('.star-sky').dataset.motion==='running');
 await fits(page,'restored stars '+width);
}
async function newPage(width=1280){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
 page.on('pageerror',error=>errors.push(error.message));
 return page;
}
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  fs.mkdirSync(shots,{recursive:true});
  const origin='http://127.0.0.1:'+server.address().port,home=origin+'/ege-baza/index.html',trainer=origin+'/ege-baza/path/index.html';

  for(const width of [320,1280]){
   const page=await newPage(width);
   await watchCanvasDrawing(page);
   await page.goto(home+'#map');await page.locator('.star-sky').waitFor();
   ok(await page.locator('[data-exam-visual-host]').getAttribute('data-active-visual')==='stars','fresh course opens the requested star sky');
   await expectCount(page,'.ocean-expedition',0,'ocean is available without a second active scene');
   const visualButtons=page.locator('button[data-exam-visual]');
   await expectCount(page,'button[data-exam-visual]',2,'both visual entrances use native buttons');
   ok(await visualButtons.evaluateAll(nodes=>nodes.every(node=>{const r=node.getBoundingClientRect();return r.width>=44&&r.height>=44&&node.textContent.trim()&&document.getElementById(node.getAttribute('aria-controls'));})),'both visual controls have readable labels,44px targets and a real controlled region');
   ok(await page.locator('[data-exam-visual="stars"]').getAttribute('aria-pressed')==='true','stars are initially selected');
   const initialCanvas=await page.locator('.star-sky canvas').elementHandle();
   await page.locator('[data-exam-visual="stars"]').press('Enter');
   ok(await initialCanvas.evaluate(node=>node===document.querySelector('.star-sky canvas')),'selecting the active visual does not restart it');
   await initialCanvas.dispose();
   await expectCount(page,'[data-star-position]',21,'all 21 stars '+width);
   await expectCount(page,'[data-exam-position]',21,'21 ordinary exam cards '+width);
   ok(await page.locator('[data-exam-position]').evaluateAll(nodes=>nodes.every(node=>!node.closest('details'))),'ordinary map stays expanded');
   await page.locator('.star-sky').scrollIntoViewIfNeeded();await fits(page,'sky '+width);
   const boxes=await page.locator('[data-star-position]').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,pos:node.dataset.starPosition};}));
   ok(boxes.every(b=>b.w>=43.9&&b.h>=43.9),'44px star targets '+width);
   ok(boxes.every(b=>b.x>=-1&&b.x+b.w<=width+1),'stars stay within viewport '+width);
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j],overlap=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1;
    ok(!overlap,'separate star targets '+a.pos+'/'+b.pos+' at '+width);
   }
   ok(await page.locator('.star-sky').getAttribute('data-motion')==='paused','reduced motion starts paused');
   const bytes=await page.evaluate(()=>JSON.stringify(Object.entries(localStorage)));
   for(let pos=1;pos<=21;pos++){
    await page.locator('[data-star-position="'+pos+'"]').click();
    ok(await page.locator('[data-sky-open]').getAttribute('href')==='#task?pos='+pos,'selected star opens correct number '+pos);
    ok(await page.locator('[data-sky-skills]').getAttribute('href')==='#task?pos='+pos+'&skills=1','selected star opens its skills '+pos);
   }
   await page.locator('[data-star-position="21"]').focus();await page.keyboard.press('Home');
   ok(await page.locator('[data-star-position="1"]').evaluate(node=>node===document.activeElement),'keyboard Home selects first star');
   await page.keyboard.press('End');
   ok(await page.locator('[data-star-position="21"]').evaluate(node=>node===document.activeElement),'keyboard End selects last star');
   await page.locator('[data-sky-pause]').click();
   await page.waitForFunction(()=>document.querySelector('.star-sky').dataset.motion==='running');
   await checkVisualSwitch(page,width);
   await page.locator('[data-sky-pause]').click();
   await page.waitForFunction(()=>document.querySelector('.star-sky').dataset.motion==='paused');
   ok(await page.evaluate(()=>JSON.stringify(Object.entries(localStorage)))===bytes,'star/ocean switches, animation and navigation do not write learner saves');
   await page.locator('[data-star-position="15"]').click();
   await page.screenshot({path:path.join(shots,'sky-'+width+'.png'),fullPage:false});
   await page.locator('[data-sky-skills]').click();await page.locator('[data-exam-task="15"]').waitFor();
   const position=page.locator('[data-ege-skill-map]');
   ok(await position.isVisible()&&await position.evaluate(node=>node.open),'skill link opens the position map');
   ok(await position.locator('[data-skill-node]').count()>=3,'position contains concrete skills');
   await fits(page,'position skills '+width);
   await page.screenshot({path:path.join(shots,'skills-15-'+width+'.png'),fullPage:false});
   for(let pos=1;pos<=21;pos++){
    await page.goto(home+'#task?pos='+pos+'&skills=1');await page.locator('[data-exam-task="'+pos+'"]').waitFor();
    ok(await page.locator('[data-ege-skill-map]').evaluate(node=>node.open),'number map opens '+pos);
    await fits(page,'number '+pos+' '+width);
   }
   await page.close();
  }

  const page=await newPage(320);
  await page.goto(trainer+'#lesson=round');await page.locator('#answer').waitFor();
  const ids=await page.evaluate(()=>EgeBazaSkillMaps.all().map(m=>m.id));
  for(const id of ids){
   await page.evaluate(id=>location.hash='lesson='+id,id);
   await page.locator('[data-ege-skill-map="'+id+'"]').waitFor({state:'attached'});
   await expectCount(page,'[data-ege-skill-map]',1,'exactly one map for '+id);
   ok(await page.locator('[data-skill-node]').count()>=3,'concrete skill nodes '+id);
  }
  ok(ids.length===111,'all 111 actual trainers have maps');
  await page.goto(trainer+'#lesson=round');await page.locator('#answer').waitFor();
  await page.locator('#answer').fill('7/');
  const before=await page.evaluate(()=>({seed:PathCourse.state().lessons.round.seed,help:PathCourse.state().lessons.round.help}));
  ok(before.help===false,'closed map did not expose support');
  await page.locator('[data-ege-skill-map]>summary').click();
  ok(await page.evaluate(()=>PathCourse.state().lessons.round.help)===true,'opening skill methods marks assistance');
  ok(await page.locator('#answer').inputValue()==='7/','skill map preserves final draft');
  const answer=await page.evaluate(()=>PathData.task('round',PathCourse.state().lessons.round.seed).answer);
  await page.locator('#answer').fill(String(answer));await page.locator('#answer').press('Enter');
  ok(await page.evaluate(()=>PathCourse.state().lessons.round.independent)===0,'answer after skill support is not independent');
  ok(await page.evaluate(()=>{const row=PathCourse.state().lessons.round,last=row.checks.at(-1);return row.done&&last?.correct===true&&last.independent===false;}),'assisted correct result retained in the existing answer record');
  await page.locator('#new').click();
  const fresh=await page.evaluate(()=>{const row=PathCourse.state().lessons.round;return {answer:PathData.task('round',row.seed).answer,help:row.help};});
  ok(fresh.help===false,'new condition starts without assistance');
  await page.locator('#answer').fill(String(fresh.answer));await page.locator('#answer').press('Enter');
  ok(await page.evaluate(()=>PathCourse.state().lessons.round.independent)===1,'new unassisted answer still earns actual independent evidence');
  await page.locator('#new').click();await page.locator('#answer').fill('5/');
  await page.locator('[data-ege-skill-map]>summary').click();await page.locator('[data-skill-steps]').click();
  await page.locator('#stepAnswer').waitFor();await page.locator('#stepAnswer').fill('3/');
  ok(await page.locator('#answer').inputValue()==='5/','guided transition retains final draft');
  const savedSeed=await page.evaluate(()=>PathCourse.state().lessons.round.seed);
  await page.reload();await page.locator('#stepAnswer').waitFor();
  ok(await page.locator('#answer').inputValue()==='5/'&&await page.locator('#stepAnswer').inputValue()==='3/','reload retains both answer fields');
  ok(await page.evaluate(()=>PathCourse.state().lessons.round.seed)===savedSeed,'map does not regenerate task');
  await page.locator('[data-ege-skill-map]>summary').click();await fits(page,'open trainer map');
  await page.screenshot({path:path.join(shots,'trainer-skills-320.png'),fullPage:true});
  const grade7=await page.evaluate(()=>PathData.meta.find(m=>m.grade7&&!m.geometryRebuild).id);
  await page.goto(trainer+'#lesson='+grade7);await page.locator('[data-stage]').first().waitFor();
  await expectCount(page,'[data-ege-skill-map]',0,'grade7 is outside EGE maps');
  await page.goto(trainer+'?learning=1#lesson=box');await page.locator('body.learning-managed').waitFor();
  await expectCount(page,'[data-ege-skill-map]',0,'managed board does not receive independent course navigation');
  await page.close();

  for(const kind of ['exam','diagnostic']){
   const check=await newPage();
   await check.goto(trainer+'#'+kind);await check.locator('#start').click();
   await check.waitForFunction(kind=>window.PathCourse?.state().active?.kind===kind,kind);
   await expectCount(check,'[data-ege-skill-map]',0,kind+' has no learning map');await check.close();
  }

  const fixed=await newPage(320);await fixed.goto(origin+'/trainers/ege-baza/index.html#task=p1a');
  await fixed.waitForFunction(()=>!!window.TrainerDebug);
  const fixedIds=await fixed.evaluate(()=>TrainerDebug.tasks.map(t=>t.id));
  for(const id of fixedIds){
   await fixed.evaluate(id=>TrainerDebug.go(id),id);
   await expectCount(fixed,'[data-ege-skill-map]',1,'fixed example map '+id);
  }
  await fixed.evaluate(()=>TrainerDebug.go('p1a'));await fixed.locator('#ans').fill('7/');
  await fixed.locator('[data-ege-skill-map]>summary').click();
  ok(await fixed.locator('#ans').inputValue()==='7/','fixed trainer answer retained');
  ok(await fixed.evaluate(()=>TrainerDebug.getState().recs.p1a.hints)>=1,'fixed trainer map marks help');
  await fits(fixed,'fixed trainer open map');
  await fixed.locator('#btnVariant').click();await expectCount(fixed,'[data-ege-skill-map]',0,'fixed variant has no map');
  await fixed.close();

  for(const [folder,api,module,skills]of [['course','MathExamFoundation','m01',['decimal','division','rounding','percent','change','choice']],['data-course','MathExamData','m02',['data','probability','graphs','logic']]]){
   const early=await newPage(320),url=origin+'/trainers/ege-baza/'+folder+'/index.html';
   for(const skill of skills){
    await early.goto(url+'#learn-'+skill);await early.locator('[data-ege-skill-map="'+module+':'+skill+'"]').waitFor({state:'attached'});
    await expectCount(early,'[data-ege-skill-map]',1,'early learning map '+module+':'+skill);
    await early.goto(url+'#practice-'+skill+'-0');await early.locator('#answer').waitFor();
    await early.locator('#answer').fill('7/');await early.locator('[data-ege-skill-map]>summary').click();
    ok(await early.locator('#answer').inputValue()==='7/','early practice draft preserved '+skill);
    ok(await early.evaluate(({api,skill})=>JSON.parse(localStorage.getItem(window[api].KEY)).practice[skill+'-practice-1'].hints,{api,skill}),'early practice map is help '+skill);
    await fits(early,'early map '+module+':'+skill);
   }
   await early.goto(url+'#checks');await early.locator('[data-action="start-diagnostic"]').click();
   await early.waitForURL(url=>url.hash==='#test-diagnostic');
   await early.locator('[role="progressbar"]').waitFor();
   await expectCount(early,'[data-ege-skill-map]',0,'early diagnostic has no map '+module);
   await early.close();
  }

  const algebra=await newPage(320);await algebra.goto(origin+'/ege-baza/algebra/index.html#base');await algebra.locator('#mobileSkill').waitFor();
  for(const skill of ['add','multiply','fractions','mixed','decimals','powers','identities','equations']){
   await algebra.locator('#mobileSkill').selectOption(skill);await expectCount(algebra,'[data-ege-skill-map]',1,'algebra skill map '+skill);
  }
  await algebra.locator('#mobileSkill').selectOption('add');await algebra.locator('#practiceInputField').fill('7/');
  await algebra.locator('[data-ege-skill-map]>summary').click();
  ok(await algebra.evaluate(()=>MathExamAlgebra.getState().practice.add.help),'algebra map marks practice support');
  ok(await algebra.locator('#practiceInputField').inputValue()==='7/','algebra draft retained');
  await fits(algebra,'algebra map');
  await algebra.locator('#diagnostic').click();await expectCount(algebra,'[data-ege-skill-map]',0,'algebra check excludes map');await algebra.close();

  const percent=await newPage(320);await percent.goto(origin+'/ege-baza/percent/index.html');
  await percent.locator('[data-route="lessons"]').click();await percent.locator('#lessonSelect').waitFor();
  const pc=await percent.locator('#lessonSelect option').count();
  for(let index=0;index<pc;index++){
   await percent.locator('#lessonSelect').selectOption(String(index));await expectCount(percent,'[data-ege-skill-map]',1,'percent lesson map '+index);
  }
  await percent.locator('[data-ege-skill-map]>summary').click();await fits(percent,'percent map');
  await percent.locator('[data-route="check"]').click();await expectCount(percent,'[data-ege-skill-map]',0,'percent check excludes map');await percent.close();

  const reasoning=await newPage(320);await reasoning.goto(origin+'/ege-baza/reasoning/index.html');await reasoning.locator('#lesson').waitFor();
  const rc=await reasoning.locator('#lesson option').count();
  for(let index=0;index<rc;index++){
   await reasoning.locator('#lesson').selectOption(String(index));await expectCount(reasoning,'[data-ege-skill-map]',1,'reasoning map '+index);
  }
  await reasoning.locator('#check').click();await expectCount(reasoning,'[data-ege-skill-map]',0,'reasoning check excludes map');
  await reasoning.locator('#learn').click();await expectCount(reasoning,'[data-ege-skill-map]',1,'reasoning return restores map');await reasoning.close();

  const work=await newPage(320);await work.goto(origin+'/ege-baza/work-rate/index.html#practice');await work.locator('#kind').waitFor();
  const kinds=await work.locator('#kind option').evaluateAll(nodes=>nodes.map(node=>node.value));
  for(const kind of kinds){
   await work.locator('#kind').selectOption(kind);
   await work.locator('[data-ege-skill-map="work-rate:'+kind+'"]').waitFor({state:'attached'});
  }
  await work.locator('#kind').selectOption('joint');await work.locator('#answer').fill('7/');
  await work.locator('[data-ege-skill-map]>summary').click();
  ok(await work.evaluate(()=>WorkRateCourse.state().activities.practice.help),'work map counts as support');
  ok(await work.locator('#answer').inputValue()==='7/','work draft retained');await fits(work,'work map');await work.close();

  const labs=await newPage(320);await labs.goto(origin+'/ege-baza/labs/index.html');
  await labs.waitForFunction(()=>!!window.MathExamLabs);
  for(const tab of ['stereo','plane','trig','ineq']){
   await labs.locator('[data-tab="'+tab+'"]').click();await expectCount(labs,'[data-ege-skill-map]',1,'laboratory map '+tab);
   await labs.locator('[data-ege-skill-map]>summary').click();await fits(labs,'lab map '+tab);
   await labs.locator('#openQuiz').click();await expectCount(labs,'[data-ege-skill-map]',0,'lab check excludes map '+tab);
   await labs.locator('#backQuiz').click();await expectCount(labs,'[data-ege-skill-map]',1,'lab return restores map '+tab);
   ok(await labs.evaluate(()=>MathExamLabs.getState().quizState.assisted),'lab return is assisted');
  }
  await labs.close();
  ok(errors.length===0,'no browser exceptions: '+errors.join('; '));
  console.log('EGE_BAZA_SKILL_MAP_BROWSER_OK: '+checks+' checks; all 111 families, 21 stars, '+fixedIds.length+' fixed examples, early and supplementary learning routes; star/ocean switching and disposal, drafts, assistance, exam boundaries, 320/1280px and screenshots.');
 }finally{await browser?.close();if(server.listening)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
