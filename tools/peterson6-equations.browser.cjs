'use strict';
// Isolated real-browser journeys; all records below are synthetic.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const os=require('node:os');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const OUTPUT=process.env.PETERSON_EQUATION_ARTIFACTS||path.join(os.tmpdir(),'peterson-equation-browser');
const KEY='mathexam.peterson6.part1.v1';
const server=http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
    if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
    let file=path.resolve(ROOT,'.'+pathname);
    assert(file.startsWith(ROOT+path.sep));
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  }catch(_){res.writeHead(404).end();}
});
async function run(){
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+server.address().port;
  let browser,journeys=0,steps=0;
  try{
    browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
    fs.mkdirSync(OUTPUT,{recursive:true});
    for(const width of [320,390,1280]){
      const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
      const routes=['#lesson/p09/2','#lesson/p10/4','#lesson/p11/0','#lesson/p12/4','#lesson/p13/10','#lesson/p14/7','#practice/percent-part/1','#practice/percent-whole/2','#practice/percent-ratio/3'];
      for(const route of routes){
        await page.goto(origin+'/school/peterson6/'+route);
        const task=await page.evaluate(route=>{
          const parts=route.slice(1).split('/');
          if(parts[0]==='lesson')return PetersonCourse.lessons.find(l=>l.id===parts[1]).tasks[Number(parts[2])];
          return PetersonApp.resolveTask('practice:'+parts[1]+':'+parts[2]+':1');
        },route);
        assert.equal(task.methodVersion,2);
        await page.locator('[data-action=guided]').click();
        for(const [i,q]of task.steps.entries()){
          const form=page.locator('[data-step-form="'+i+'"]');
          if(q.kind==='choice')await form.locator('[data-choice="'+q.choices.indexOf(q.answer)+'"]').click();
          else await form.locator('input').fill(q.answerFormat==='decimal'?await page.evaluate(v=>PetersonMath.decimal(v),q.answer):q.answer);
          if(i===2){
            await page.reload();
            const retained=await page.evaluate(id=>PetersonApp.getState().tasks[id],task.id);
            assert.equal(retained.step,i);assert.equal(retained.values[i],q.answerFormat==='decimal'?await page.evaluate(v=>PetersonMath.decimal(v),q.answer):q.answer);
            if(q.kind==='choice')assert.equal(await page.locator('[data-step-form="'+i+'"] [aria-pressed=true]').count(),1);
            await page.locator('[data-step-form="'+i+'"]').scrollIntoViewIfNeeded();
            await page.screenshot({path:path.join(OUTPUT,task.id.replace(/:/g,'-')+'-'+width+'.png')});
          }
          await page.locator('[data-step-form="'+i+'"] button:not([type=button])').click();
          assert.equal(await page.locator('.step.completed').count(),i+1);
          assert.equal(await page.evaluate(id=>PetersonApp.getState().tasks[id].step,task.id),i+1);steps++;
        }
        if(task.kind==='choice')await page.locator('#answer-form [data-choice="'+task.choices.indexOf(task.answer)+'"]').click();
        else await page.locator('#final-answer').fill(task.answerFormat==='decimal'?await page.evaluate(v=>PetersonMath.decimal(v),task.answer):task.answer);
        await page.locator('#answer-form button:not([type=button])').click();
        const saved=await page.evaluate(id=>PetersonApp.getState().tasks[id],task.id);
        assert(saved.correct&&!saved.independent&&saved.assisted,'Guided work is credited with help');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No page overflow at '+width+' '+route);
        assert.equal(await page.locator('.problem').evaluate(el=>/\{\{(?:frac|mix):/.test(el.textContent)),false,'No unrendered fraction tokens');
        journeys++;
      }
      await page.goto(origin+'/school/peterson6/#lesson/p09/0');
      const legacy=await page.evaluate(key=>{
        const t=PetersonCourse.legacyTasks['p09-t01'];
        const old={version:1,tasks:{[t.id]:{value:'',values:[t.steps[0].answer],step:1,guided:true,assisted:true,hint:true,stepHints:{0:true},note:'Сохранённая запись ученика'}},practice:{},last:{hash:'#lesson/p09/0'},origin:null};
        localStorage.setItem(key,JSON.stringify(old));return old.tasks[t.id];
      },KEY);
      await page.reload();assert(await page.locator('.method-notice').isVisible());
      assert.equal(await page.locator('.step.completed').count(),1);
      await page.locator('[data-action=current-method]').click();
      assert.equal(await page.evaluate(()=>PetersonApp.getState().history['p09-t01'][0].note),legacy.note);
      await page.locator('.earlier-work summary').click();
      assert.match(await page.locator('.earlier-work').innerText(),/Была открыта подсказка/);
      assert(await page.locator('.earlier-work').innerText().then(text=>text.includes(legacy.note)));
      const answer=await page.evaluate(()=>PetersonApp.resolveTask('p09-t01').answer);
      await page.locator('#final-answer').fill(answer);await page.locator('#answer-form button:not([type=button])').click();
      await page.reload();
      assert.equal(await page.evaluate(()=>PetersonApp.getState().tasks['p09-t01'].independent),false,'Prior assistance survives method switch and reload');
      await page.goto(origin+'/school/peterson6/#progress');
      assert(await page.locator('.legacy-summary').isVisible());
      assert.deepEqual(errors,[]);journeys++;
      await context.close();
    }
    console.log('PETERSON6_EQUATIONS_BROWSER_OK: '+journeys+' journeys; '+steps+' accepted steps; 320/390/1280px; choice reload, earlier steps and legacy history.');
    console.log('Screenshots: '+OUTPUT);
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
