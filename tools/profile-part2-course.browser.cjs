'use strict';
// Real browser coverage is run in CI. Independent mathematical gates validate
// the keys; this gate enters them through the rendered student controls.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const lessons=['algebra','geometry','models'].flatMap(n=>require('../ege-profil/part-two/content-'+n+'.js'));
const root=path.resolve(__dirname,'..'),shots='/tmp/profile-part2-shots',errors=[],bad=[];
const mime={'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://fixture').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'text/html');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port,base=origin+'/ege-profil/part-two/index.html';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});fs.mkdirSync(shots,{recursive:true});let screens=0,completed=0;
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.setDefaultTimeout(12000);
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)bad.push(r.status()+' '+r.url());});
   async function go(hash){await page.goto(base+hash);await page.locator('#main h1').waitFor();}
   async function record(id){return page.evaluate(id=>window.ProfilePartTwoApp.store.read(id),id);}
   async function fill(task){
    const fields=task.independentFinal?[task.independentFinal]:task.final;
    for(let i=0;i<fields.length;i++)await page.locator('#final-'+i).fill(String(fields[i].answers[0]));
   }
   await page.goto(origin+'/ege-profil/');
   for(let n=1;n<=20;n++){const href=n<=13?'start/index.html#calm/'+n:'part-two/index.html#exam/'+n;assert(await page.locator('#profile-2027 a[href="'+href+'"]').isVisible(),'visible entrance '+n);}
   assert(await page.locator('#legacy-course[open]').isVisible());
   await page.screenshot({path:path.join(shots,'entrance-'+width+'.png'),fullPage:false});
   for(const lesson of lessons){
    const task=lesson.tasks[3];await go('#task/'+task.id+'/independent');assert(await page.locator('#final-form').isVisible());
    const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,condition:document.querySelector('.condition').getBoundingClientRect().top}));
    if(metrics.scroll>metrics.width+1||metrics.condition>=900){
     const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).map(el=>{const r=el.getBoundingClientRect(),style=getComputedStyle(el);return{tag:el.tagName,id:el.id,className:el.getAttribute('class')||'',left:r.left,right:r.right,width:r.width,height:r.height,text:(el.textContent||'').trim().slice(0,180),display:style.display,minWidth:style.minWidth,overflowWrap:style.overflowWrap,whiteSpace:style.whiteSpace,gridTemplateColumns:style.gridTemplateColumns};}).filter(el=>el.width>0&&el.height>0&&el.display!=='none'&&(el.right>innerWidth+1||el.left<0)&&el.className!=='skip').slice(0,40));
     const evidence={lesson:lesson.id,task:task.id,viewport:width,metrics,overflow};
     fs.writeFileSync(path.join(shots,'layout-failure-'+lesson.id+'-'+width+'.json'),JSON.stringify(evidence,null,2));
     await page.screenshot({path:path.join(shots,'layout-failure-'+lesson.id+'-'+width+'.png'),fullPage:true});
     console.error('PROFILE_PART2_LAYOUT_FAILURE '+JSON.stringify(evidence));
    }
    assert(metrics.scroll<=metrics.width+1,lesson.id+' horizontal overflow at '+width);assert(metrics.condition<900,lesson.id+' condition below first screen');screens++;
    if(lesson===lessons.find(l=>l.exam===lesson.exam))await page.screenshot({path:path.join(shots,'exam-'+lesson.exam+'-'+width+'.png'),fullPage:true});
    if(width===1280){await fill(task);await page.locator('#final-form button[type=submit]').click();await page.locator('#completion').waitFor();const r=await record(task.id);assert(r.completed&&r.independent,task.id+' independently checked numeric result');assert(await page.locator('#proof-draft').isVisible());assert.match(await page.locator('#main').innerText(),/обосновани.*провер|Обоснование требует проверки/i);completed++;}
    if(lesson.id==='p2-15-coordinate-angle'){
     // The same long exact expressions must also fit after every step of the
     // vector proof is revealed, not only while its answer fields are empty.
     await page.locator('#show-solution').click();await page.locator('.solution-list li').first().waitFor();
     for(let count=1;count<task.solution.length;count++){await page.locator('#solution-next').click();await page.waitForFunction(expected=>document.querySelectorAll('.solution-list li').length===expected,count+1);}
     const expanded=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
     await page.screenshot({path:path.join(shots,'coordinate-angle-solution-'+width+'.png'),fullPage:true});
     assert(expanded.scroll<=expanded.width+1,'expanded coordinate-angle solution horizontal overflow at '+width+': '+JSON.stringify(expanded));
    }
   }
   // First error, correction, proof draft, reload and repeat submission.
   const t=lessons[0].tasks[4];await go('#task/'+t.id+'/independent');await page.locator('#final-form button[type=submit]').click();assert.equal((await record(t.id)).attemptCount,0,'empty field not attempt');
   await fill(t);await page.locator('#final-0').fill('987654321');await page.locator('#final-form button[type=submit]').click();await page.waitForFunction(id=>window.ProfilePartTwoApp.store.read(id).attemptCount===1,t.id);assert.equal((await record(t.id)).attempts[0].correct,false);
   await page.locator('#proof-draft').fill('Проверяю исходное условие и ограничения.');await fill(t);await page.locator('#final-form button[type=submit]').click();await page.locator('#completion').waitFor();await page.reload();await page.locator('#completion').waitFor();let r=await record(t.id);assert.equal(r.attempts[0].answers[0],'987654321');assert(r.independent);assert.equal(await page.locator('#proof-draft').inputValue(),'Проверяю исходное условие и ограничения.');
   await page.locator('#final-form button[type=submit]').click();await page.locator('#completion').waitFor();assert((await record(t.id)).independent,'repeated click stays one task');
   // Assistance never becomes independent credit on the same fresh condition.
   const assisted=lessons[0].tasks[5];await go('#task/'+assisted.id+'/independent');await page.locator('#request-help').click();await page.getByText('Подсказка открыта. Для самостоятельной проверки потом выберите другое условие.',{exact:true}).waitFor();await fill(assisted);await page.locator('#final-form button[type=submit]').click();await page.locator('#completion').waitFor();r=await record(assisted.id);assert(r.helped&&r.completed&&!r.independent);
   await page.reload();await page.locator('#completion').waitFor();assert(!(await record(assisted.id)).independent);
   // One completed guided step is retained when moving to another task and back.
   const guided=lessons.find(l=>l.exam===15).tasks[0];await go('#task/'+guided.id+'/guided');await page.locator('#step-answer').fill(String(guided.steps[0].answers[0]));await page.locator('#step-form button[type=submit]').click();await page.waitForFunction(id=>window.ProfilePartTwoApp.store.read(id).solvedSteps.length===1,guided.id);await go('#exam/15');await go('#task/'+guided.id+'/guided');assert.equal((await record(guided.id)).solvedSteps.length,1);
   await go('#progress');assert.match(await page.locator('#main').innerText(),/автоматически не оцениваются/);
   await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log('PROFILE_PART2_COURSE_BROWSER_OK '+JSON.stringify({screens,completed,widths:[320,390,1280],sections:7}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
