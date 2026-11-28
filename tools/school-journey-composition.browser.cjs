'use strict';
// Actual-origin acceptance of the two existing draft modules together.
// Never executed against production; no learner accounts or external requests.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const pilot='/equations/linear-pilot/';
const bridgeKey='mathExam.linearFractionBridge.session.v1';
const mapKey='mathExam.schoolJourney.selection.v1';
const legacyKey='school-journey-composition-synthetic-legacy';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
async function serve(){
  const server=http.createServer((req,res)=>{
    try{
      const u=new URL(req.url,'http://localhost');
      let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
      if(file!==root&&!file.startsWith(root+path.sep))throw Error('outside root');
      if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      const real=fs.realpathSync(file);
      if(!real.startsWith(root+path.sep))throw Error('outside root');
      res.writeHead(200,{'Content-Type':mime[path.extname(real)]||'application/octet-stream'}).end(fs.readFileSync(real));
    }catch(_){res.writeHead(404).end('not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return server;
}
async function keyboard(link){
  await link.waitFor({state:'visible'});
  await link.focus();
  await link.press('Enter');
}
async function enterPilot(page,origin,fromStatic=false){
  const link=page.locator((fromStatic?'#sj-fallback':'#sj-resources')+' a[href="'+pilot+'"]');
  assert.equal(await link.count(),1,'one unambiguous course entry');
  await Promise.all([page.waitForURL(origin+pilot),keyboard(link)]);
}
async function enterBridge(page,origin){
  await Promise.all([page.waitForURL(origin+pilot+'#fraction-bridge'),keyboard(page.locator('.backlinks a[href="#fraction-bridge"]'))]);
  const app=page.locator('#fraction-bridge-app');
  await app.waitFor({state:'visible'});
  assert.equal(await page.locator('#fraction-bridge').getAttribute('open'),'');
  return app;
}
async function exercise(browser,origin,width){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(origin+'/');
    await page.locator('#sj-details').waitFor({state:'visible'});
    await page.evaluate(k=>localStorage.setItem(k,'preserve'),legacyKey);
    await page.locator('#sj-goal').selectOption('algebra');
    assert.equal(await page.locator('#sj-topic').inputValue(),'linear');
    assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),mapKey),{goal:'algebra',node:'linear'});
    assert(await page.locator('#sj-fallback').isVisible());
    assert(await page.locator('#learning-journey').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'home route overflow');
    await enterPilot(page,origin);
    const app=await enterBridge(page,origin);
    const click=name=>app.getByRole('button',{name,exact:true}).click();
    assert.equal(await app.getAttribute('data-phase'),'original');
    assert.equal(await page.evaluate(k=>sessionStorage.getItem(k),bridgeKey),null,'a visit is not an attempt');
    const original=await app.locator('[data-fb-original]').innerText();
    assert.equal(original,'x/4 + 3 = 8');
    await page.locator('#fb-answer').fill('7');
    await click('Проверить ответ');
    assert.match(await app.innerText(),/Причина пока неизвестна/);
    await page.locator('#fb-answer').fill('19');
    await click('Восстановить целое по одной доле');
    assert.equal(await app.getAttribute('data-phase'),'probe');
    await page.locator('#fb-answer').fill('5');
    await click('Проверить ответ');
    assert.match(await app.innerText(),/Ответ в этой пробе не совпал/);
    await click('Добавить такую же часть');
    assert.match(await app.innerText(),/Собрали целое: 2 × 11 = 22/);
    const popupPromise=context.waitForEvent('page');
    await keyboard(app.locator('[data-fb-resource="oge-basics:fraction-meaning"]'));
    const popup=await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(new URL(popup.url()).origin,origin);
    assert.equal(new URL(popup.url()).pathname,'/trainers/oge-basics/fraction-meaning.html');
    assert.match(await popup.locator('body').innerText(),/дроб/i,'real prerequisite content');
    await popup.close();
    await click('Вернуться к исходной задаче');
    assert.equal(await app.locator('[data-fb-original]').innerText(),original);
    assert.equal(await page.locator('#fb-answer').inputValue(),'19');
    await page.reload();await app.waitFor({state:'visible'});
    assert.equal(await page.locator('#fb-answer').inputValue(),'19');
    await page.locator('#fb-answer').fill('20');await click('Проверить ответ');
    assert.match(await app.innerText(),/верен после исправления с отмеченной помощью/);
    await click('Новая текстовая задача на перенос');
    assert.equal(await app.getAttribute('data-phase'),'transfer');
    assert.match(await app.innerText(),/9 м — это 2 м и треть длины ленты/);
    assert.equal(await app.locator('[data-fb-resource]').count(),0);
    assert(!((await app.innerText()).includes('x/3 + 2 = 9')),'no supplied transfer equation');
    await page.locator('#fb-answer').fill('21');await click('Проверить ответ');
    assert.equal(await app.getAttribute('data-phase'),'result');
    assert.match(await app.innerText(),/с первой попытки, помощь не отмечена/);
    assert.match(await app.innerText(),/не доказывает освоение/);
    const saved=await page.evaluate(k=>sessionStorage.getItem(k),bridgeKey);
    assert(saved,'actual saved bridge evidence');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'pilot overflow');
    const home=page.locator('#mathexam-home-navigation').getByRole('link',{name:'На главную MathExam',exact:true});
    await Promise.all([page.waitForURL(origin+'/'),keyboard(home)]);
    await page.locator('#sj-details').waitFor({state:'visible'});
    assert.equal(await page.locator('#sj-goal').inputValue(),'algebra');
    assert.equal(await page.locator('#sj-topic').inputValue(),'linear');
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),legacyKey),'preserve');
    await enterPilot(page,origin);
    const restored=await enterBridge(page,origin);
    assert.equal(await restored.getAttribute('data-phase'),'result');
    assert.equal(await page.evaluate(k=>sessionStorage.getItem(k),bridgeKey),saved);
    assert.deepEqual(errors,[]);
    console.log('SCHOOL_COMPOSITION_ROUTE_OK width='+width+' original→prerequisite→return→transfer→home→resume');
  }finally{await context.close();}
}
async function fractionPractice(browser,origin,width){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  try{
    const page=await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    const own='mathExamBasics.fraction-meaning.v1', shared='mathExamCourseProgress.v1';
    await page.addInitScript(({own,shared})=>{
      if(!localStorage.getItem(own))localStorage.setItem(own,JSON.stringify({independent:7,supported:3,reviewed:2,best:4,lastCheck:4,learnDone:[],practiceBySkill:{parts:7}}));
      if(!localStorage.getItem(shared))localStorage.setItem(shared,JSON.stringify({syntheticOther:{solved:2,total:5}}));
    },{own,shared});
    await page.goto(origin+'/trainers/oge-basics/fraction-meaning.html');
    await page.waitForFunction(()=>window.__trainerDebug&&document.body.dataset.basicsStandalone==='basic');
    const route=async name=>{
      const menu=page.locator('.bs-navigation');
      if(!(await menu.evaluate(e=>e.open)))await keyboard(menu.locator('summary'));
      await keyboard(menu.locator('button[data-route="'+name+'"]'));
    };
    await route('learn');
    await keyboard(page.locator('#learnRail button').nth(3));
    const input=page.locator('#lessonQuestion input');
    for(const bad of ['4/10','6/15','0,4']){
      await input.fill(bad);await input.press('Enter');
      assert.match(await page.locator('#lessonFeedback').getAttribute('class'),/bad/);
    }
    await input.fill('2/5');await keyboard(page.locator('#lessonQuestion .q-answer button'));
    assert.match(await page.locator('#lessonFeedback').getAttribute('class'),/good/);
    const numeric=await page.evaluate(()=>{
      const d=window.__trainerDebug;
      return ['4','4,0','8/2','4.000000001','4000000001/1000000000','4/00'].map(x=>d.answerEqual(x,4));
    });
    assert.deepEqual(numeric,[true,true,true,false,false,false]);
    await route('practice');
    // New exercises use the native next button; synthetic storage seeded above must survive.
    const snapshot=()=>page.evaluate(()=>{const s=window.__trainerDebug.state();return [s.independent,s.supported,s.reviewed]});
    const before=await snapshot();
    const answer=async()=>{
      const t=await page.evaluate(()=>window.__trainerDebug.state().current);
      if(t.kind==='choice'){
        await keyboard(page.locator('#practiceAnswer button[data-id="'+t.answer+'"]'));
        await keyboard(page.locator('#checkTask'));
      }else{
        const value=await page.evaluate(()=>{const d=window.__trainerDebug;return d.fmtAnswer(d.state().current.answer)});
        const i=page.locator('#practiceAnswer input');await i.fill(value);await i.press('Enter');
      }
    };
    // The explanation detour can mark the initial task supported. Use an actual fresh page
    // before the independent, supported and reveal trials.
    await page.reload();
    await page.waitForFunction(()=>window.__trainerDebug&&document.body.dataset.basicsStandalone==='basic');
    assert.deepEqual(await snapshot(),before);
    await answer();
    const terminal=async expected=>{
      const feedback=await page.locator('#practiceFeedback').innerHTML();
      for(const key of ['hint1','hint2','solutionBtn']){
        const button=page.locator('#'+key);
        assert(await button.isDisabled(),'terminal help remains disabled: '+key);
        // Negative control: direct native handler, in addition to disabled user controls.
        await button.evaluate(e=>e.onclick());
      }
      assert.deepEqual(await snapshot(),expected);
      assert.equal(await page.locator('#practiceFeedback').innerHTML(),feedback);
      assert.deepEqual(await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));return [s.independent,s.supported,s.reviewed]},own),expected);
    };
    await terminal([before[0]+1,before[1],before[2]]);
    await keyboard(page.locator('#nextTask'));
    const hint=page.locator('#hint1');
    assert(!(await hint.isDisabled()));
    await hint.evaluate(e=>e.click());
    await answer();
    await terminal([before[0]+1,before[1]+1,before[2]]);
    await keyboard(page.locator('#nextTask'));
    await page.locator('#solutionBtn').evaluate(e=>e.click());
    await terminal([before[0]+1,before[1]+1,before[2]+1]);
    const check=await page.evaluate(()=>{
      const d=window.__trainerDebug;let positions=new Set(),valid=true;
      for(let k=0;k<64;k++){
        const [a,b]=d.makeCheckSet();positions.add(a.options.findIndex(o=>o.id==='d'));
        valid=valid&&a.options.find(o=>o.id==='d').html!==b.options.find(o=>o.id==='d').html;
      }
      return {positions:[...positions].sort(),valid};
    });
    assert.deepEqual(check,{positions:[0,1],valid:true});
    await route('check');
    for(let j=0;j<5;j++){
      const t=await page.evaluate(()=>window.__trainerDebug.state().check.tasks[window.__trainerDebug.state().check.i]);
      if(t.kind==='choice'){await keyboard(page.locator('#checkAnswer button[data-id="'+t.answer+'"]'));await keyboard(page.locator('#checkNext'));}
      else{const v=await page.evaluate(()=>{const d=window.__trainerDebug;return d.fmtAnswer(d.state().check.tasks[d.state().check.i].answer)});const i=page.locator('#checkAnswer input');await i.fill(v);await i.press('Enter');}
    }
    assert.equal(await page.locator('#resultScore').innerText(),'5/5');
    assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).syntheticOther,shared),{solved:2,total:5});
    assert.deepEqual(errors,[]);
    console.log('SCHOOL_FRACTION_PRACTICE_OK width='+width);
  }finally{await context.close();}
}
async function noJS(browser,origin){
  const context=await browser.newContext({viewport:{width:320,height:900},javaScriptEnabled:false});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  try{
    const page=await context.newPage();await page.goto(origin+'/');
    assert(await page.locator('#sj-details').isHidden());
    await enterPilot(page,origin,true);
    const panel=page.locator('#fraction-bridge');
    if(!(await page.locator('#fraction-bridge-fallback').isVisible()))await keyboard(panel.locator('summary'));
    assert(await page.locator('#fraction-bridge-fallback a[href="/trainers/oge-basics/fraction-meaning.html"]').isVisible());
    assert(await page.locator('#fraction-bridge-app').isHidden());
    await Promise.all([page.waitForURL(origin+'/trainers/oge-basics/fraction-meaning.html'),keyboard(page.locator('#fraction-bridge-fallback a[href="/trainers/oge-basics/fraction-meaning.html"]'))]);
    assert.match(await page.locator('body').innerText(),/дроб/i);
    const paper=page.locator('#fraction-paper-lesson');
    assert(await paper.isVisible(),'real paper prerequisite with JS disabled');
    assert.match(await paper.locator('h1').innerText(),/Дробь: часть, целое/);
    assert.match(await paper.locator('#fraction-paper-example').innerText(),/6 × 5 = 30 см/);
    assert.equal(await paper.locator('#fraction-paper-tasks li').count(),3);
    const selfCheck=paper.locator('#fraction-paper-check');
    assert.equal(await selfCheck.getAttribute('open'),null,'self-check answers initially closed');
    await keyboard(selfCheck.locator('summary'));
    assert.equal(await selfCheck.getAttribute('open'),'');
    assert.match(await selfCheck.innerText(),/24 см/);
    assert.match(await selfCheck.innerText(),/15 см/);
    assert(!(await page.locator('#view-home').isVisible()),'inactive JS controls hidden');
    assert(await paper.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'paper lesson overflow');
    await Promise.all([page.waitForURL(origin+pilot),keyboard(paper.locator('#fraction-paper-return'))]);
    console.log('SCHOOL_COMPOSITION_NO_JS_OK');
  }finally{await context.close();}
}
(async()=>{
  const server=await serve();let browser;
  try{
    browser=await chromium.launch({headless:true});
    const origin='http://127.0.0.1:'+server.address().port;
    for(const width of [320,390,1280])await exercise(browser,origin,width);
    for(const width of [320,390,1280])await fractionPractice(browser,origin,width);
    await noJS(browser,origin);
    console.log('SCHOOL_JOURNEY_COMPOSITION_BROWSER_OK');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
