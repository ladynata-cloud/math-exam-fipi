'use strict';
// Synthetic pupil accounts only. Run in CI when local browser launch is blocked.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),KEY='mathexam.profileStart2027.v1';
const geometry=[...require('../ege-profil/start/geometry-data.js'),...require('../ege-profil/start/stereo-data.js')].filter(l=>[1,2,3].includes(l.position));
const shotLessons=new Set(['geo-right','vec-coordinates','stereo-box']);
const SHOTS=process.env.PROFILE_MAIN_GEOMETRY_SHOTS||'/tmp/profile-main-geometry-disclosure-shots';
const server=http.createServer((req,res)=>{
  try{let file=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(ROOT+path.sep))return res.writeHead(403).end();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}
});
(async()=>{
  let browser;await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,base=origin+'/ege-profil/start/index.html';
  const errors=[],failed=[];let journeys=0,firstScreenChecks=0,screenshots=0;
  try{
    assert.equal(geometry.length,18,'All main geometry lessons are included');
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
    fs.mkdirSync(SHOTS,{recursive:true});
    for(const width of [320,390,1280]){
      const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<600});
      const page=await context.newPage();page.setDefaultTimeout(12000);
      page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)failed.push(r.url());});
      await page.goto(base+'#calm');await page.locator('[data-calm-exam="1"]').waitFor();
      for(const lesson of geometry){
        const id=lesson.id;
        // This HTTP fixture has no real pupil data. Recreate a fresh synthetic
        // learner for every lesson, then enter through the ordinary calm route.
        // A full document navigation also discards the preceding in-memory state.
        await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});
        const fresh=base+'?geometry-viewport='+width+'-'+id;
        await page.goto(fresh+'#calm');await page.locator('[data-calm-exam="1"]').waitFor();
        await page.goto(fresh+'#practice/'+id+'/independent');await page.locator('#answer-form').waitFor();
        const initial=await page.evaluate(({KEY,id})=>JSON.parse(localStorage.getItem(KEY)).sessions[id+':independent'],{KEY,id});
        assert.equal(initial.taskId,lesson.tasks.at(-3).id,id+': first independent condition');
        assert.equal(initial.familiar,false,id+': fresh independent attempt');
        assert.equal(initial.assisted,false,id+': references have not been opened');
        const model=page.locator('#task-model'),svg=model.locator('svg').first(),hint=page.locator('#hint'),help=page.locator('#hint-box');
        assert(await svg.isVisible(),id+': diagram visible');assert.equal(await help.isVisible(),false);
        const condition=await page.locator('.condition-panel .task-condition').boundingBox();
        const rect=await svg.boundingBox();assert(rect&&rect.width>=200,id+': useful diagram width at '+width);
        assert(condition&&condition.y>=0&&condition.y+condition.height<=rect.y+1,id+': authored condition visible before diagram at '+width);
        assert(rect.y>=0&&rect.y+rect.height<=900,id+': complete diagram on first screen at '+width+' '+JSON.stringify(rect));
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+': no overflow at '+width);
        firstScreenChecks++;
        if(shotLessons.has(id)){await page.screenshot({path:path.join(SHOTS,id+'-'+width+'.png'),fullPage:false});screenshots++;}
        await page.locator('#answer').fill('31/7');
        const before=await page.evaluate(({KEY,id})=>{window.answerWitness=document.getElementById('answer');window.modelWitness=document.getElementById('task-model');const s=JSON.parse(localStorage.getItem(KEY)).sessions[id+':independent'];return {taskId:s.taskId,step:s.step,answers:s.answers,draft:s.draft};},{KEY,id});
        await hint.focus();await page.keyboard.press('Enter');await help.waitFor({state:'visible'});
        await help.locator('.task-foundation>summary').click();await hint.click();
        assert.equal(await help.isVisible(),false);assert.equal(await page.locator('#answer').inputValue(),'31/7');
        assert(await page.evaluate(()=>window.answerWitness===document.getElementById('answer')&&window.modelWitness===document.getElementById('task-model')),id+': stable nodes');
        const after=await page.evaluate(({KEY,id})=>{const s=JSON.parse(localStorage.getItem(KEY)).sessions[id+':independent'];return {taskId:s.taskId,step:s.step,answers:s.answers,draft:s.draft,assisted:s.assisted};},{KEY,id});
        assert.equal(after.assisted,true);delete after.assisted;assert.deepEqual(after,before);
        if(id==='stereo-box'){
          const beforeYaw=await svg.getAttribute('data-yaw');await model.getByRole('button',{name:'Повернуть вправо',exact:true}).click();assert.notEqual(await svg.getAttribute('data-yaw'),beforeYaw);
        }else{
          const button=model.locator('button[aria-pressed]').first();if(await button.count()){await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');}
        }
        assert.equal(await page.locator('#answer').inputValue(),'31/7');journeys++;
      }
      await page.goto(base+'#lesson/geo-quadrilaterals');await page.locator('#explore-lab').waitFor();
      assert.equal(await page.locator('details.theory').getAttribute('open'),null);
      const lab=page.locator('#explore-lab');await lab.locator(':scope>summary').click();
      const input=lab.locator('[name="prof-construction-height"]');await input.fill('5.75');await input.press('Tab');
      await lab.locator('select').selectOption('diagonal');
      const line=lab.getByRole('button',{name:'Провести диагональ',exact:true});await line.click();assert.equal(await line.getAttribute('aria-pressed'),'true');
      const beforeDrawing=await lab.locator('svg').innerHTML();await lab.locator(':scope>summary').click();await lab.locator(':scope>summary').click();
      assert.equal(await input.inputValue(),'5.75');assert.equal(await lab.locator('select').inputValue(),'diagonal');assert.equal(await lab.locator('svg').innerHTML(),beforeDrawing);
      await lab.scrollIntoViewIfNeeded();
      assert(await lab.locator('svg').isVisible(),'requested construction drawing '+width);
      assert(await line.isVisible()&&await input.isVisible(),'construction controls remain available '+width);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'construction width '+width);journeys++;
      await page.goto(base+'#practice/fn-parabola/independent');await page.locator('#task-model svg').waitFor();
      const explore=page.locator('#task-model details');assert.equal(await explore.getAttribute('open'),null);
      await explore.locator('summary').click();await page.locator('#task-model [data-revealed-value]').waitFor();
      const slider=explore.locator('input[type=range]');await slider.focus();await page.keyboard.press('ArrowRight');
      const coordinate=await slider.inputValue();await explore.locator('summary').click();await explore.locator('summary').click();assert.equal(await slider.inputValue(),coordinate);
      journeys++;
      await context.close();
    }
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    assert.equal(firstScreenChecks,54);assert.equal(screenshots,9);
    console.log('PROFILE_MAIN_GEOMETRY_DISCLOSURE_BROWSER_OK: '+journeys+' synthetic journeys; '+firstScreenChecks+' first-screen condition/diagram checks across all 18 geometry lessons at 320/390/1280px; '+screenshots+' representative screenshots; requested references; retained drafts/constructions; graph keyboard controls');
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
