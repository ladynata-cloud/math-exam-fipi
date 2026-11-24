'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
  const server=http.createServer((req,res)=>{
    try{
      const u=new URL(req.url,'http://localhost'),name=decodeURIComponent(u.pathname).replace(/^\//,'');
      let file=path.resolve(root,name);if(!file.startsWith(root+path.sep)&&file!==root)throw Error('path');
      if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
      res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
    }catch(_){res.statusCode=404;res.end('not found');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({headless:true});const origin='http://127.0.0.1:'+server.address().port;
    for(const width of [320,390,1280]){
      const context=await browser.newContext({viewport:{width,height:900}});
      await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
      const page=await context.newPage();await page.goto(origin+'/');await page.locator('#sj-details').waitFor({state:'visible'});
      // Protect the legacy showcase contract as well as progressive enhancement.
      const direct=['/foundations/','/equations/linear-pilot/','/geometry-course/','/courses/','/oge/','/ege-baza/','/ege-profil/'];
      assert(await page.locator('#sj-fallback').isVisible(),'static course links remain visible after enhancement');
      for(const href of direct)assert(await page.locator('#sj-fallback a[href="'+href+'"]').isVisible(),href);
      for(const href of ['/trainers/',...direct])assert(await page.locator('a[href="'+href+'"]').first().isVisible(),'first course link '+href);
      await page.evaluate(()=>localStorage.setItem('unrelated-existing-trainer','keep'));
      await page.locator('#sj-goal').selectOption('algebra');
      assert.equal(await page.locator('#sj-topic').inputValue(),'linear');
      await page.locator('#sj-probe button[type=submit]').click();
      assert.match(await page.locator('#sj-result').innerText(),/Выберите ответ/);
      await page.locator('input[name=sj-q0][value="2"]').check();
      await page.locator('input[name=sj-q1][value="0"]').check();
      await page.locator('#sj-probe button[type=submit]').click();
      assert.match(await page.locator('#sj-result').innerText(),/Обе пробы верны/);
      assert.match(await page.locator('#sj-result').innerText(),/ещё не подтверждение/);
      await page.locator('#sj-result button').click();
      assert.equal(await page.locator('#sj-topic').inputValue(),'modeling');
      await page.locator('#sj-topic').selectOption('fractions');
      await page.locator('input[name=sj-q0][value="?"]').check();
      await page.locator('input[name=sj-q1][value="?"]').check();
      await page.locator('#sj-probe button[type=submit]').click();
      await page.locator('#sj-result button').first().click();
      assert.equal(await page.locator('#sj-topic').inputValue(),'fraction-meaning');
      assert(await page.locator('#sj-resources a[href*="arzhenikov-map"]').count());
      await page.reload();await page.locator('#sj-details').waitFor({state:'visible'});
      assert.equal(await page.locator('#sj-topic').inputValue(),'fraction-meaning');
      assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-existing-trainer')),'keep');
      assert(await page.locator('#sj-result').isHidden());
      const overflow=await page.locator('#learning-journey').evaluate(e=>e.scrollWidth>e.clientWidth+2);
      assert(!overflow,'route overflow at '+width);
      await context.close();
    }
    const staticContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});
    await staticContext.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
    const staticPage=await staticContext.newPage();await staticPage.goto(origin+'/');
    assert(await staticPage.locator('#sj-details').isHidden());
    for(const href of ['/foundations/','/equations/linear-pilot/','/geometry-course/','/courses/','/oge/','/ege-baza/','/ege-profil/']){
      assert(await staticPage.locator('#sj-fallback a[href="'+href+'"]').isVisible(),'no-JS shortcut '+href);
    }
    await staticContext.close();
    const context=await browser.newContext();
    await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}}));
    const page=await context.newPage();await page.goto(origin+'/');await page.locator('#sj-details').waitFor({state:'visible'});
    assert.match(await page.locator('#sj-storage').innerText(),/не разрешил/);
    await page.locator('#sj-topic').selectOption('linear');assert(await page.locator('#sj-probe').isVisible());
    await context.close();console.log('SCHOOL_JOURNEY_BROWSER_PASS');
  }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
