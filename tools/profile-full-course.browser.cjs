'use strict';

// This gate checks learner journeys. Independent mathematics and model geometry
// are verified by the bank-specific gates; answers here drive the actual UI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const oldLessons = ['geometry', 'algebra', 'stereo'].flatMap(name => require('../ege-profil/start/' + name + '-data'));
const addedLessons = ['probability', 'equations', 'functions', 'applied'].flatMap(name => require('../ege-profil/start/' + name + '-data'));
const prerequisiteLessons = require('../ege-profil/start/readiness-data');
const lessons = [...oldLessons, ...addedLessons, ...prerequisiteLessons];
const KEY = 'mathexam.profileStart2027.v1';
const root = path.resolve(__dirname, '..');
const shots = process.env.PROFILE_FULL_COURSE_SHOTS || '/tmp/profile-full-course-shots';
const mime = {'.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://fixture').pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/html');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const base = origin + '/ege-profil/start/index.html';
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH, headless:true, args:['--no-sandbox']});
  const contexts = [], errors = [], failedRequests = [];
  let mountedModels = 0, completedJourneys = 0, controlledModels = 0, inequalityJourneys = 0;
  try {
    fs.mkdirSync(shots, {recursive:true});
    assert.equal(new Set(lessons.map(l => l.id)).size, lessons.length, 'Lesson IDs are unique across old and new banks');
    assert.equal(new Set(lessons.flatMap(l => l.tasks.map(t => t.id))).size, lessons.reduce((n,l) => n+l.tasks.length,0), 'Task IDs are unique');
    for (const n of Array.from({length:13}, (_,i) => i+1)) assert(lessons.some(l => l.position===n), 'Real content for first-part position '+n);
    async function learner(width = 1280) {
      const context = await browser.newContext({viewport:{width,height:900}});
      contexts.push(context);
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) failedRequests.push(response.status()+' '+response.url()); });
      return page;
    }
    const page = await learner(), fixture = await learner(360);
    async function go(hash, target = page) {
      await target.goto(base + hash);
      await target.locator('main h1').waitFor();
    }
    async function saved(target = page) { return target.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY); }
    async function session(id, mode, target = page) { return (await saved(target)).sessions[id+':'+mode]; }
    async function taskFor(id, mode, target = page) {
      const s = await session(id, mode, target);
      return lessons.find(l => l.id===id).tasks.find(t => t.id===s.taskId);
    }
    async function fill(q, target, value = String(q.answer)) {
      if (q.choices) {
        const radios = target.locator('input[name="answer"]');
        const values = await radios.evaluateAll(es => es.map(e => e.value));
        const index = values.indexOf(value);
        assert(index>=0, 'Missing answer choice '+value);
        await radios.nth(index).check();
      } else await target.locator('#answer').fill(value);
    }
    async function accept(q, target = page, value = String(q.answer)) {
      await fill(q, target, value);
      await target.locator('#submit-answer').click();
      await target.locator('#feedback.good').waitFor();
      assert(await target.locator('#next').isEnabled(), 'Correct answer enables next');
      assert(await target.locator('#submit-answer').isDisabled(), 'Accepted answer cannot be counted twice');
    }
    async function finish(id, mode = 'guided', target = page) {
      const task = await taskFor(id, mode, target), s = await session(id, mode, target);
      for (const q of mode==='guided' ? task.steps.slice(s.step) : [task]) {
        await accept(q, target);
        await target.locator('#next').click();
      }
      await target.locator('.result-panel').waitFor();
      if (mode==='guided') assert.equal(await target.locator('#solution-history [data-step]').count(), task.steps.length, 'Every accepted step remains at completion: '+id);
      completedJourneys++;
      return task;
    }
    async function noOverflow(target, label) {
      assert(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1), 'Horizontal page overflow: '+label);
    }
    async function seed(lesson, task, mode, target = fixture) {
      await target.evaluate(({key,id,taskId,mode}) => localStorage.setItem(key, JSON.stringify({version:1,records:{},seen:{[taskId]:1},sessions:{
        [id+':'+mode]:{taskId,step:0,wrong:false,assisted:mode==='guided',familiar:false,done:false,draft:'',answers:[],started:'2026-10-07T00:00:00.000Z',registered:false}
      }})), {key:KEY,id:lesson.id,taskId:task.id,mode});
      await target.goto(base+'?journey='+encodeURIComponent(task.id+'-'+mode)+'#practice/'+lesson.id+'/'+mode);
      await target.locator('#answer-form').waitFor();
    }
    async function validModel(target, task) {
      const svg = target.locator('#task-model svg').first();
      await svg.waitFor();
      const markup = await svg.evaluate(el => el.outerHTML);
      assert(!/(?:NaN|undefined|Infinity)/.test(markup), 'Non-finite model: '+task.id);
      assert(await target.locator('#task-model').innerText(), 'Model has readable explanation: '+task.id);
    }

    // All thirteen cards lead to their own real topics and a fresh independent task.
    await go('#part-one');
    assert.equal(await page.locator('.exam-card[href^="#exam/"]').count(), 13);
    const actualIds = await page.evaluate(() => globalThis.ProfileLessons.map(l => l.id).sort());
    assert.deepEqual(actualIds, lessons.map(l => l.id).sort(), 'No script overwrite or missing bank');
    // Keep navigation-only attempts separate from the pupil who later learns a
    // topic and earns fresh independent credit. Reading a rule must continue to
    // mark any already-open independent attempt as assisted.
    const catalogue = await learner();
    for (let number=1; number<=13; number++) {
      await go('#part-one', catalogue);
      await catalogue.locator('.exam-card[href="#exam/'+number+'"]').click();
      await catalogue.locator('.exam-topic').first().waitFor();
      assert.equal(await catalogue.locator('.exam-topic').count(), lessons.filter(l => l.position===number).length, 'All topics discoverable for position '+number);
      await catalogue.locator('#exam-start').click();
      await catalogue.locator('#answer-form').waitFor();
      const practiceHash = new URL(catalogue.url()).hash;
      assert.match(practiceHash, /^#practice\/.+\/independent$/);
      const entryId = practiceHash.split('/')[1];
      assert.equal(lessons.find(lesson => lesson.id === entryId).position, number, 'The task belongs to the selected exam number');
      assert.equal((await session(entryId, 'independent', catalogue)).assisted, false, 'Starting an exam task does not supply help');
      await noOverflow(catalogue, 'position '+number);
    }
    await go('#first-three');
    assert.equal(await page.locator('.exam-card').count(), 3, 'Previous first-three link still opens the short route');
    await page.evaluate(() => localStorage.setItem('mathExamCourseProgress.v1','legacy-preserved'));

    // Error, retained steps, draft recovery and independent-credit behaviour.
    const retained = addedLessons.find(l => l.tasks[0].steps.length>=2 && !l.tasks[0].steps[1].choices);
    assert(retained, 'A numerical multi-step new lesson exists');
    await go('#practice/'+retained.id+'/guided');
    let task = await taskFor(retained.id,'guided');
    await page.locator('#submit-answer').click();
    assert.equal((await session(retained.id,'guided')).wrong,false,'Blank answer is not a mathematical mistake');
    await fill(task.steps[0],page,task.steps[0].choices ? task.steps[0].choices.find(v=>String(v)!==String(task.steps[0].answer)) : String(Number(task.steps[0].answer)+731));
    await page.locator('#submit-answer').click();
    await page.locator('#feedback.bad').waitFor();
    assert(await page.locator('#next').isDisabled());
    await accept(task.steps[0]);
    await page.locator('#next').click();
    assert.equal(await page.locator('#solution-history [data-step]').count(),1);
    await page.locator('#answer').fill('13,25');
    await page.reload();
    assert.equal(await page.locator('#answer').inputValue(),'13,25');
    assert.equal(await page.locator('#solution-history [data-step]').count(),1);
    await finish(retained.id);

    const creditLesson=addedLessons.find(l=>!l.tasks[l.tasks.length-3].choices);
    await go('#part-one',fixture);
    const independentTask=creditLesson.tasks[creditLesson.tasks.length-3];
    await seed(creditLesson,independentTask,'independent');
    await fixture.locator('#answer').fill('3/7');
    await go('#exam/'+creditLesson.position,fixture);
    assert.equal(await fixture.locator('#exam-start').getAttribute('href'),'#practice/'+creditLesson.id+'/independent','Resume respects unfinished independent mode');
    await fixture.locator('#exam-start').click();
    assert.equal(await fixture.locator('#answer').inputValue(),'3/7');
    await fixture.locator('#hint').click();
    assert.equal((await session(creditLesson.id,'independent',fixture)).assisted,true);
    await finish(creditLesson.id,'independent',fixture);
    assert.equal((await saved(fixture)).records[creditLesson.id].independent.length,0,'Helped independent work does not earn unassisted credit');
    await seed(creditLesson,independentTask,'independent');
    await accept(independentTask,fixture);
    await fixture.locator('#hint').click();
    assert.equal((await session(creditLesson.id,'independent',fixture)).assisted,false,'Review after acceptance preserves credit');
    await fixture.locator('#next').click();
    await fixture.locator('.result-panel').waitFor();
    assert((await saved(fixture)).records[creditLesson.id].independent.includes(independentTask.id));
    const earned=(await saved(fixture)).records[creditLesson.id];
    await fixture.reload();
    assert.deepEqual((await saved(fixture)).records[creditLesson.id],earned,'Reload cannot duplicate success');

    // Every new variant mounts its actual finite model at a narrow width. Try a
    // real keyboard model control once per theme where a control is available.
    for(const lesson of addedLessons){
      for(const [i,t] of lesson.tasks.entries()){
        await seed(lesson,t,i>=lesson.tasks.length-3?'independent':'guided');
        await validModel(fixture,t);
        assert.equal(await fixture.locator('#solution-history [data-step]').count(),0,'No unearned solution history: '+t.id);
        await noOverflow(fixture,'360px '+t.id);
        mountedModels++;
        if(i===0){
          const ranges=fixture.locator('#task-model input[type="range"]');
          if(await ranges.count()){
            const control=ranges.first(), before=await control.inputValue();
            const max=await control.getAttribute('max');
            if(!await control.isVisible())await fixture.locator('#task-model details').filter({has:fixture.locator('input[type="range"]')}).locator('summary').click();
            await control.focus();
            await fixture.keyboard.press(Number(before)<Number(max)?'ArrowRight':'ArrowLeft');
            assert.notEqual(await control.inputValue(),before,'Keyboard moves model: '+lesson.id);
            controlledModels++;
          }else{
            const control=fixture.locator('#task-model button').first();
            if(await control.count()){
              const before=await control.getAttribute('aria-pressed');
              await control.focus();await fixture.keyboard.press('Enter');
              if(before!==null)assert.notEqual(await control.getAttribute('aria-pressed'),before,'Keyboard toggles model: '+lesson.id);
              controlledModels++;
            }
          }
          await validModel(fixture,t);
          await noOverflow(fixture,'model control '+lesson.id);
        }
      }
      // Exercise data-to-input-to-result for both modes, across every new theme.
      await go('#lesson/'+lesson.id);
      await page.locator('#guided').click();
      await page.locator('#answer-form').waitFor();
      await finish(lesson.id);
      await go('#lesson/'+lesson.id);
      await page.locator('#independent').click();
      await page.locator('#answer-form').waitFor();
      const completed=await finish(lesson.id,'independent');
      assert((await saved()).records[lesson.id].independent.includes(completed.id),'Fresh unassisted task earns credit: '+lesson.id);
      console.log('Completed new theme',lesson.id);
    }

    // New and old routes use the same history without erasing older successes.
    await go('#practice/geo-right/guided');
    await finish('geo-right');
    await go('#lesson/trig-angle');
    await page.locator('#explore-lab summary').click();
    await page.locator('#lab svg').first().waitFor();
    await go('#practice/algebra-logarithmic/guided');
    await finish('algebra-logarithmic');

    for(const hash of ['#part-one','#exam/4','#exam/6','#exam/7','#exam/9','#exam/11','#exam/13','#exam/16','#progress']){
      await go(hash,fixture);await noOverflow(fixture,'mobile '+hash);
    }
    await go('#part-one',fixture);
    await fixture.emulateMedia({reducedMotion:'reduce'});
    await fixture.evaluate(()=>{document.body.style.zoom='2';});
    await noOverflow(fixture,'200% zoom');
    await fixture.evaluate(()=>{document.body.style.zoom='1';});
    await fixture.screenshot({path:path.join(shots,'part-one-360.png'),fullPage:true});
    await go('#part-one');
    await page.screenshot({path:path.join(shots,'part-one-desktop.png'),fullPage:true});

    await go('#exam/16');
    const detailed=page.locator('main a[href$="/inequalities/index.html"]');
    assert(await detailed.count(),'Position16 links to the detailed inequality course');
    await detailed.first().click();
    await page.locator('main h1, h1').first().waitFor();
    assert.equal(new URL(page.url()).pathname,'/trainers/ege-profile/inequalities/index.html');
    await noOverflow(page,'inequality hub');
    await page.setViewportSize({width:360,height:900});
    await noOverflow(page,'inequality hub 360');
    await page.screenshot({path:path.join(shots,'inequalities-360.png'),fullPage:true});

    // Independently exercise the last variant of each inequality family. These
    // include decreasing logarithms/exponentials and the non-empty second case
    // for a variable base. The author's separate gate covers all 18 variants.
    const inequalityData=require('../trainers/ege-profile/inequalities/lessons');
    for(const family of inequalityData.families){
      const lesson=inequalityData.lessons.filter(l=>l.family===family.id).at(-1);
      assert(lesson,'Detailed example for '+family.id);
      await page.goto(origin+'/trainers/ege-profile/inequalities/lesson.html?lesson='+encodeURIComponent(lesson.id));
      await page.waitForFunction(()=>window.__inequalityLesson);
      assert.equal(await page.evaluate(()=>window.MathExamGuidedLesson.id),lesson.id);
      let firstRecord='';
      for(const [index,step] of lesson.steps.entries()){
        assert.equal(await page.evaluate(()=>window.__inequalityLesson.getState().step),index);
        for(const field of step.fields){
          const selector='[data-field='+JSON.stringify(field.id)+']';
          if(field.kind==='number')await page.locator('input'+selector).fill(String(field.correct));
          else if(field.kind==='choice')await page.locator('input'+selector+'[data-choice='+JSON.stringify(field.correct)+']').check();
          else if(field.kind==='axis'){
            const buttons=page.locator('[data-axis='+JSON.stringify(field.id)+'][data-token]');
            assert.equal(await buttons.count(),field.points.length*2+1,'Every interval and endpoint is selectable');
            for(let i=0;i<await buttons.count();i++){
              const button=buttons.nth(i);
              if((await button.getAttribute('aria-pressed')==='true')!==field.correct.includes(await button.getAttribute('data-token')))await button.click();
            }
          }else assert.fail('Uncovered inequality field '+field.kind);
        }
        await noOverflow(page,lesson.id+' step '+index);
        const lastAxis=index===lesson.steps.length-1&&step.fields.find(f=>f.kind==='axis');
        if(lastAxis){
          // Flipping even one endpoint must be rejected; restore it afterwards.
          const endpoint=page.locator('[data-axis='+JSON.stringify(lastAxis.id)+'][data-token="p0"]');
          await endpoint.click();await page.locator('#check').click();
          assert(!(await page.evaluate(()=>window.__inequalityLesson.getState().solved)).includes(index),'Wrong final endpoint rejected: '+lesson.id);
          await endpoint.click();
        }
        await page.locator('#check').click();
        const accepted=await page.evaluate(()=>window.__inequalityLesson.getState());
        assert(accepted.solved.includes(index),'Inequality step accepted: '+lesson.id+'/'+index+' '+await page.locator('#feedback').innerText());
        assert.equal(accepted.step,index,'Answer checking never skips the explanation');
        if(index===0)firstRecord=await page.locator('#notebook [data-notebook-step="0"]').innerText();
        assert((await page.locator('#notebook').innerText()).includes(firstRecord),'Earlier inequality steps remain visible');
        if(index===lesson.domainStepIndex){
          await page.reload();await page.waitForFunction(()=>window.__inequalityLesson);
          assert.deepEqual(await page.evaluate(()=>window.__inequalityLesson.getState()),accepted,'The domain and selected intervals restore exactly');
        }
        await page.locator('#next').click();
      }
      await page.locator('#completion').waitFor({state:'visible'});
      assert.equal(await page.locator('#notebook [data-notebook-step]').count(),lesson.steps.length);
      const report=await page.locator('#report').inputValue();
      assert(report.includes(lesson.reportAnswer)&&report.includes(lesson.reportProblem),'Teacher report identifies problem and result');
      assert(report.includes('lesson='+lesson.id),'Report link reopens this exact example');
      inequalityJourneys++;
    }

    await go('#progress');
    const downloading=page.waitForEvent('download');await page.locator('#export').click();
    const download=await downloading;
    const report=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(report.storage,'local-browser');
    for(const l of addedLessons)assert(report.records[l.id].guided.length>0&&report.records[l.id].independent.length>0,'Report includes new work: '+l.id);
    assert(report.records['geo-right'].guided.length>0,'Report keeps previous first-three work');
    assert.equal(await page.evaluate(()=>localStorage.getItem('mathExamCourseProgress.v1')),'legacy-preserved');
    assert.deepEqual(errors,[]);
    assert.deepEqual(failedRequests,[]);
    console.log(JSON.stringify({gate:'PROFILE_FULL_COURSE_BROWSER_OK',positions:13,inequalityPosition:16,newThemes:addedLessons.length,mountedModels,completedJourneys,controlledModels,inequalityJourneys,retainedSteps:true,draftReload:true,independentResume:true,helpCredit:true,report:true,oldRoutes:true,mobile360:true,zoom:true,errors,failedRequests}));
  } finally {
    for(const context of contexts)await context.close();
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
