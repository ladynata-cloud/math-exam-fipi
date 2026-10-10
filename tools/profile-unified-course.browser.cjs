'use strict';
// Synthetic pupil journeys on a disposable origin. No real accounts or results.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const course=require('../ege-profil/start/course-links.js');
const lessons=['geometry','algebra','stereo','probability','equations','functions','applied','readiness'].flatMap(n=>require('../ege-profil/start/'+n+'-data.js'));
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch(_){res.writeHead(404).end();}});
(async()=>{
  for(const bank of course.banks){assert(fs.existsSync(path.join(root,bank.path)));for(const id of bank.help)assert(lessons.some(l=>l.id===id),'missing prerequisite '+id);}
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
  let panels=0;
  try{
    for(const width of [360,1280]){
      const context=await browser.newContext({viewport:{width,height:900}});
      await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
      const page=await context.newPage();page.setDefaultTimeout(15000);
      const errors=[];page.on('pageerror',error=>errors.push({url:page.url(),message:error.message}));
      await page.goto(origin+course.entry+'#calm');
      await page.locator('[data-course-extra="16"]').waitFor();
      assert.deepEqual(await page.locator('.exam-grid .exam-number').allTextContents(),[...Array.from({length:13},(_,i)=>String(i+1)),'16']);
      assert.equal(await page.locator('.exam-grid .exam-card').count(),14);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'catalog fits mobile');
      for(let number=1;number<=13;number++){
        await page.goto(origin+course.entry+'#calm/'+number);
        await page.locator('main h1').waitFor();
        assert.deepEqual(await page.locator('[data-course-resource]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))),course.banks.filter(b=>b.numbers.includes(number)).map(b=>b.path));
      }
      await page.goto(origin+course.entry+'#exam/16');
      await page.locator('[data-course-resource]').first().waitFor();
      assert.equal(await page.locator('[data-course-resource]').count(),6);
      // Every registered entry and nested exercise page has course navigation and
      // a working, relevant foundation. The original document never navigates.
      for(const pathname of [...course.banks.map(b=>b.path),...Object.keys(course.extraPages)]){
        await page.goto(origin+pathname);
        await page.locator('#profile-course-help').waitFor();
        if(pathname.endsWith('/planimetry-t1.html'))assert(await page.locator('#profile-course-nav').evaluate(nav=>nav.getBoundingClientRect().bottom<=document.querySelector('.app').getBoundingClientRect().top),'navigation stays above trainer');
        await page.locator('#profile-course-help').click();
        const before=page.url();
        await page.locator('[data-course-help]').first().click();
        const frame=page.frameLocator('#profile-course-support iframe');
        await frame.locator('main h1').waitFor();
        assert.equal(await frame.locator('#profile-course-nav').count(),0,'no nested navigation');
        assert.equal(await frame.locator('.topbar').isVisible(),false,'help focuses on selected topic');
        assert(await page.locator('#profile-course-support').evaluate(d=>d.scrollWidth<=d.clientWidth+1),'help panel fits '+pathname);
        await page.locator('#profile-course-return').click();
        assert.equal(await page.locator('#profile-course-support').evaluate(d=>d.open),false);
        assert.equal(page.url(),before);
        assert.equal(await page.locator('#profile-course-help').evaluate(b=>b===document.activeElement),true,'focus restored');
        panels++;
      }
      // Screenshot trainer: retain selected task, step, input and canvas while
      // actually doing a school exercise, then close the help frame.
      await page.goto(origin+'/ege-profil/trainers/planimetry-t1.html');
      await page.locator('#hub button').first().click();
      await page.locator('#ansInput').fill('1/7');
      const canvas=await page.locator('#cv').elementHandle();
      const before=await page.locator('#mainArea').evaluate(el=>({text:el.innerText,draft:el.querySelector('#ansInput').value}));
      await page.locator('#profile-course-help').click();
      await page.locator('[data-course-help="geo-angles"]').click();
      const frame=page.frameLocator('#profile-course-support iframe');
      await frame.locator('#guided').click();await frame.locator('#answer-form').waitFor();
      await page.locator('#profile-course-return').click();
      assert.deepEqual(await page.locator('#mainArea').evaluate(el=>({text:el.innerText,draft:el.querySelector('#ansInput').value})),before,'exact task, step and draft survive detour');
      assert(await page.locator('#cv').evaluate((el,previous)=>el===previous,canvas),'same drawing node retained');
      // Native keyboard cancellation also restores the task.
      await page.locator('#profile-course-help').click();await page.keyboard.press('Escape');
      assert.equal(await page.locator('#profile-course-support').evaluate(d=>d.open),false);
      // Course practice uses the existing persisted return path and marks help.
      await page.goto(origin+course.entry+'#practice/geo-right/independent');await page.locator('#answer').fill('1/7');
      const condition=await page.locator('.task-condition').first().innerText();
      await page.locator('#submit-answer').click();
      await page.locator('#difficulty-help .prerequisite-link').first().click();
      await page.locator('.return-to-task a').click();await page.locator('#answer').waitFor();
      assert.equal(await page.locator('#answer').inputValue(),'1/7');assert.equal(await page.locator('.task-condition').first().innerText(),condition);
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mathexam.profileStart2027.v1')).sessions['geo-right:independent'].assisted),true);
      assert.deepEqual(errors,[],'no page errors');
      await context.close();
    }
    console.log('PROFILE_UNIFIED_COURSE_OK',JSON.stringify({menu:[1,2,3,4,5,6,7,8,9,10,11,12,13,16],banks:course.banks.length,helpPanels:panels,widths:[360,1280],draftReturn:true}));
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
