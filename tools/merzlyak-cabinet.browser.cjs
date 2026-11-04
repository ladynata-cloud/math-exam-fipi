'use strict';

// Actual cabinet scripts and styles, synthetic DTOs matching learning-api/store.
// This presentation gate performs no account creation or production requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
let chromium;
try { ({chromium} = require('playwright')); }
catch (_) { ({chromium} = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'))); }
const COURSE = 'https://mathexam.space/stereo-course/merzlyak-10-base/';
const FOCUS = '10 класс. Геометрия, базовый уровень.\nКурс: ' + COURSE + '\nСначала повтори определения.';
const TEACHER = {id:'fixture_teacher_001',role:'teacher',name:'Преподаватель',login:'fixture-teacher',teacherId:'fixture_teacher_001',active:true};
const PROFILE = {course:'school',goal:null,focus:FOCUS,version:1,updatedAt:1800000000000};
const PUPIL = {id:'fixture_pupil_0001',role:'student',name:'Ученик теста',login:'fixture-pupil',teacherId:TEACHER.id,active:true};
const PEER = {...PUPIL,id:'fixture_other_001',login:'fixture-other',name:'Другой ученик'};
// Fields follow LearningStore.attemptSummary; title/state/answer are not in DTO.
const WORK = {id:'fixture_saved_001',learnerId:PUPIL.id,teacherId:TEACHER.id,trainerId:'ege-path',contentId:'triangle',
  version:1,trainerVersion:1,controller:'student',assistance:{},outcome:'started',sourceAttemptId:null,
  submission:null,archivedAt:null,createdAt:1800000000000,updatedAt:1800000000000};
// The teacher report is a distinct summary DTO, not an attemptSummary.
const item = require('../learning/catalog').get('path:triangle');
const REPORT_WORK = {id:WORK.id,catalogId:item.id,title:item.title,topicId:item.topicId,position:item.position||null,
  outcome:'started',status:'Начато',assistance:{},checks:0,wrongChecks:0,skippedChecks:0,submission:null,
  archivedAt:null,createdAt:WORK.createdAt,updatedAt:WORK.updatedAt};
const ARTIFACTS = path.resolve(process.env.MERZLYAK_BOARD_ARTIFACTS || 'artifacts/merzlyak-board');
const widths = [1280,320];

(async()=>{
  fs.mkdirSync(ARTIFACTS,{recursive:true});
  const app=express();app.use(express.static(ROOT));
  const server=await new Promise(resolve=>{const value=app.listen(0,'127.0.0.1',()=>resolve(value));});
  const origin='http://127.0.0.1:'+server.address().port;
  const report={completed:false,widths,journeys:[],screenshots:[],pageErrors:[],staticFailures:[],unexpectedRequests:[],writes:[]};
  let browser;
  try {
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||process.env.CHROMIUM_EXECUTABLE,
      args:['--no-sandbox','--disable-dev-shm-usage']});
    async function fixture({teacher=false,attached=true,width}){
      const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,locale:'ru-RU',reducedMotion:'reduce'});
      const actor=teacher?TEACHER:attached?PUPIL:PEER;
      const profile=attached?PROFILE:{course:'school',goal:null,focus:'',version:0,updatedAt:null};
      const roster={...PUPIL,passwordReady:true,quickAccess:{active:false,expiresAt:null,version:0},invitationExpiresAt:null,profile:PROFILE};
      await context.route('**/*',async route=>{
        const request=route.request(),url=new URL(request.url());
        if(url.origin!==origin){report.unexpectedRequests.push(request.method()+' '+url.origin+url.pathname);return route.abort();}
        if(!url.pathname.startsWith('/api/learning/'))return route.continue();
        const endpoint=url.pathname.slice('/api/learning'.length);
        if(request.method()!=='GET'){
          report.writes.push({method:request.method(),endpoint});
          return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'FIXTURE_READ_ONLY'})});
        }
        const responses={
          '/status':{available:true,durable:true,trainerOrigin:origin},
          '/session':{account:actor,csrfToken:'synthetic-read-only'},
          // Match the real learner status DTO with the assistant disabled by default.
          '/assistant':{ok:true,enabled:false,configuredEnabled:false,available:false,profile:null,
            version:0,dailyLimit:10,used:0,remaining:10,externalAllowed:false,externalAvailable:false,
            externalEnabled:false,mode:'unavailable',providerLabel:'',examActive:false},
          '/profile':{profile},'/attempts':{attempts:teacher||attached?[WORK]:[]},
          '/assignments':{assignments:[]},'/lessons':{lessons:[]},
          '/teacher/students':{students:[roster]},
          ['/teacher/students/'+PUPIL.id+'/report']:{student:{id:PUPIL.id,name:PUPIL.name},generatedAt:1800000000000,
            attempts:[REPORT_WORK],counts:{started:1},positions:[],assignments:[],resets:[]},
          ['/teacher/students/'+PUPIL.id+'/profile']:{profile:PROFILE},
          ['/teacher/students/'+PUPIL.id+'/plan']:{items:[],note:'',updatedAt:null}
        };
        if(!Object.hasOwn(responses,endpoint)){
          report.unexpectedRequests.push(request.method()+' '+endpoint);
          return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({error:'FIXTURE_UNKNOWN_ROUTE'})});
        }
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(responses[endpoint])});
      });
      const page=await context.newPage();page.setDefaultTimeout(15000);
      page.on('pageerror',error=>report.pageErrors.push(error.message));
      page.on('response',response=>{
        if(response.status()>=400&&['document','script','stylesheet'].includes(response.request().resourceType()))
          report.staticFailures.push({path:new URL(response.url()).pathname,status:response.status()});
      });
      return {context,page};
    }
    async function screenshot(page,name,width){
      await page.evaluate(()=>document.fonts.ready);
      const filename=`cabinet-${name}-${width}.png`;
      await page.screenshot({path:path.join(ARTIFACTS,filename),fullPage:true});report.screenshots.push(filename);
      const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
      assert.equal(size.viewport,width);
      assert(size.document<=width+1&&size.body<=width+1,`${name} has horizontal overflow at ${width}px: ${JSON.stringify(size)}`);
    }
    async function attachedEntry(page){
      await page.locator('[data-attached-course="merzlyak-10-base"]').waitFor();
      assert.equal(await page.locator('[data-attached-course-open]').getAttribute('href'),COURSE);
      const board=new URL(await page.locator('[data-attached-course-board]').getAttribute('href'));
      assert.equal(board.origin,'https://mathexam.space');assert.equal(board.pathname,'/trainers/trainer-board.html');
      assert.deepEqual([...board.searchParams],[['trainer','/trainers/merzlyak-10-base.html']]);
      assert(await page.locator('[data-attached-course-open]').isVisible());
      assert(await page.locator('[data-attached-course-board]').isVisible());
      assert.match(await page.locator('[data-attached-course-storage]').innerText(),/сохраняются в браузере/);
    }
    for(const width of widths){
      const pupil=await fixture({width});
      try{
        await pupil.page.goto(origin+'/learning/?role=student#home');
        for(const route of ['home','course','route']){
          await pupil.page.evaluate(value=>LearningApp.navigate(value),route);
          await pupil.page.waitForFunction(value=>document.querySelector('[data-nav="'+value+'"]')?.getAttribute('aria-current')==='page',route);
          await attachedEntry(pupil.page);
          assert.equal(await pupil.page.locator('#main h1').innerText(),'10 класс · Геометрия Мерзляк');
          assert.equal(await pupil.page.locator('[data-attached-prior-work] a[href="#attempt='+WORK.id+'"]').count(),1);
          assert.equal(await pupil.page.locator('#navigation [data-nav="division-course"]').count(),0);
          assert.equal(await pupil.page.locator('#main details a[href="#division-course"]').count(),1);
          assert(!(await pupil.page.locator('#main').innerText()).includes('7 класс'));
          await screenshot(pupil.page,route,width);report.journeys.push({role:'student',route,width,ownWorkPreserved:true});
        }
        await pupil.page.reload();await attachedEntry(pupil.page);
        assert.equal(await pupil.page.locator('[data-attached-prior-work] a[href="#attempt='+WORK.id+'"]').count(),1);
      }finally{await pupil.context.close();}

      const teacher=await fixture({teacher:true,width});
      try{
        await teacher.page.goto(origin+'/learning/?role=teacher#preview='+PUPIL.id);
        await teacher.page.locator('.preview-banner').waitFor();await attachedEntry(teacher.page);
        assert((await teacher.page.locator('.preview-banner').innerText()).includes('Вы остаётесь преподавателем'));
        assert((await teacher.page.locator('#main').innerText()).includes('10 класс · Геометрия Мерзляк'));
        assert((await teacher.page.locator('#main').innerText()).includes(REPORT_WORK.title),'Teacher preview retains the real report work title');
        assert(!(await teacher.page.locator('#main').innerText()).includes('7 класс'));
        await screenshot(teacher.page,'teacher-preview',width);report.journeys.push({role:'teacher',route:'preview',width});
      }finally{await teacher.context.close();}

      const peer=await fixture({attached:false,width});
      try{
        await peer.page.goto(origin+'/learning/?role=student#course');
        await peer.page.locator('#catalog-grid[data-course-scope="school"]').waitFor();
        assert.equal(await peer.page.locator('#main h1').innerText(),'Мой курс · 7 класс');
        assert.equal(await peer.page.locator('[data-attached-course]').count(),0);
        assert.equal(await peer.page.locator('#navigation [data-nav="division-course"]').count(),1);
        assert.equal(await peer.page.locator('a[href="#attempt='+WORK.id+'"]').count(),0);
        await screenshot(peer.page,'other-pupil',width);report.journeys.push({role:'other-student',route:'course',width});
      }finally{await peer.context.close();}
    }
    assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.staticFailures,[]);assert.deepEqual(report.unexpectedRequests,[]);assert.deepEqual(report.writes,[]);
    assert.equal(report.screenshots.length,10);report.completed=true;
    console.log('MERZLYAK_CABINET_BROWSER_OK '+JSON.stringify({journeys:report.journeys.length,screenshots:report.screenshots.length,widths,readOnly:true}));
  } catch(error){report.failure=error.stack||String(error);throw error;}
  finally{
    fs.writeFileSync(path.join(ARTIFACTS,'cabinet-browser-report.json'),JSON.stringify(report,null,2)+'\n');
    await browser?.close();await new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});
  }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
