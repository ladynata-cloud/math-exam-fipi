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
      assert.match(await page.locator('#sj-result').innerText(),/не является новой самостоятельной проверкой/);
      assert(await page.locator('#sj-probe button[type=submit]').isDisabled());
      assert(await page.locator('input[name=sj-q0][value="2"]').isDisabled());
      const revealed=await page.locator('#sj-result').innerText();
      await page.locator('#sj-probe').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
      assert.equal(await page.locator('#sj-result').innerText(),revealed);
      await page.locator('#sj-result button').click();
      assert.equal(await page.locator('#sj-topic').inputValue(),'modeling');
      // A completed explanation must not masquerade as a fresh probe after a topic visit.
      await page.locator('#sj-topic').selectOption('linear');
      assert.match(await page.locator('#sj-probe-note').innerText(),/уже видели разбор/);
      assert.equal(await page.locator('#sj-probe button[type=submit]').innerText(),'Проверить повторение');
      await page.locator('input[name=sj-q0][value="2"]').check();
      await page.locator('input[name=sj-q1][value="0"]').check();
      await page.locator('#sj-probe button[type=submit]').click();
      assert.match(await page.locator('#sj-result').innerText(),/Повторение после разбора/);
      assert.match(await page.locator('#sj-result').innerText(),/не новая самостоятельная проверка/);
      assert(await page.locator('#sj-probe button[type=submit]').isDisabled());
      await page.locator('#sj-topic').selectOption('fractions');
      assert.equal(await page.locator('#sj-probe button[type=submit]').innerText(),'Проверить две задачи');
      await page.locator('#sj-probe button[type=submit]').click();
      assert.match(await page.locator('#sj-result').innerText(),/Выберите ответ/);
      await page.locator('#sj-topic').selectOption('linear');
      await page.locator('#sj-topic').selectOption('fractions');
      assert.equal(await page.locator('#sj-probe button[type=submit]').innerText(),'Проверить две задачи');
      await page.locator('input[name=sj-q0][value="?"]').check();
      await page.locator('input[name=sj-q1][value="?"]').check();
      await page.locator('#sj-probe button[type=submit]').click();
      assert.match(await page.locator('#sj-result').innerText(),/Ответы пока не даны/);
      assert.match(await page.locator('#sj-result').innerText(),/Без ответов нельзя определить/);
      assert.equal(await page.locator('#sj-result li').filter({hasText:'Ответ не дан.'}).count(),2);
      await page.locator('#sj-result button').first().click();
      assert.equal(await page.locator('#sj-topic').inputValue(),'fraction-meaning');
      assert(await page.locator('#sj-resources a[href*="arzhenikov-map"]').count());
      await page.reload();await page.locator('#sj-details').waitFor({state:'visible'});
      assert.equal(await page.locator('#sj-topic').inputValue(),'fraction-meaning');
      assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-existing-trainer')),'keep');
      assert(await page.locator('#sj-result').isHidden());
      await page.locator('#sj-topic').selectOption('linear');
      await page.locator('input[name=sj-q0][value="2"]').check();
      await page.locator('input[name=sj-q1][value="?"]').check();
      await page.locator('#sj-probe button[type=submit]').click();
      assert.match(await page.locator('#sj-result').innerText(),/Одна проба верна, другая без ответа/i);
      await page.locator('#sj-topic').selectOption('fractions');
      await page.locator('#sj-topic').selectOption('linear');
      await page.locator('input[name=sj-q0][value="0"]').check();
      await page.locator('input[name=sj-q1][value="?"]').check();
      await page.locator('#sj-probe button[type=submit]').click();
      assert.match(await page.locator('#sj-result').innerText(),/Одна проба не совпала, другая без ответа/i);
      assert.equal(await page.locator('#sj-result li').filter({hasText:'Ответ не совпал.'}).count(),1);
      assert.equal(await page.locator('#sj-result li').filter({hasText:'Ответ не дан.'}).count(),1);
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
    await context.close();
    // Actual same-origin two-tab storage, failure limited to the selection key.
    const pair=await browser.newContext();
    try{
      await pair.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
      const key='mathExam.schoolJourney.selection.v1';
      const first=await pair.newPage();
      await first.goto(origin+'/');await first.locator('#sj-details').waitFor({state:'visible'});
      const seed=JSON.stringify({goal:'algebra',node:'linear'});
      await first.evaluate(({key,seed})=>{localStorage.setItem(key,seed);localStorage.setItem('sj-synthetic-legacy','keep');},{key,seed});
      const second=await pair.newPage();
      await second.addInitScript(key=>{
        const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
        const probe=window.__sjStorageProbe={readDenied:true,writeDenied:false,writes:0};
        Storage.prototype.getItem=function(k){if(this===window.localStorage&&k===key&&probe.readDenied)throw new DOMException('test read denied','SecurityError');return get.call(this,k);};
        Storage.prototype.setItem=function(k,v){if(this===window.localStorage&&k===key){probe.writes++;if(probe.writeDenied)throw new DOMException('test quota','QuotaExceededError');}return set.call(this,k,v);};
      },key);
      await second.goto(origin+'/');await second.locator('#sj-details').waitFor({state:'visible'});
      assert.equal(await second.evaluate(()=>window.__sjStorageProbe.writes),0,'opening must never overwrite an unread choice');
      assert.equal(await first.evaluate(key=>localStorage.getItem(key),key),seed);
      assert.match(await second.locator('#sj-storage').innerText(),/не разрешил прочитать/);
      await second.evaluate(()=>{window.__sjStorageProbe.readDenied=false;window.__sjStorageProbe.writeDenied=true;});
      await second.locator('#sj-topic').selectOption('fractions');
      assert.equal(await first.evaluate(key=>localStorage.getItem(key),key),seed);
      assert.match(await second.locator('#sj-storage').innerText(),/не разрешил/);
      await second.evaluate(()=>{window.__sjStorageProbe.writeDenied=false;});
      await second.locator('#sj-topic').selectOption('ratio');
      assert.match(await second.locator('#sj-storage').innerText(),/Запоминается только/);
      assert.deepEqual(await first.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),{goal:'foundations',node:'ratio'});
      assert.equal(await first.evaluate(()=>localStorage.getItem('sj-synthetic-legacy')),'keep');
      await first.reload();await first.locator('#sj-details').waitFor({state:'visible'});
      assert.equal(await first.locator('#sj-topic').inputValue(),'ratio');
    }finally{await pair.close();}
    console.log('SCHOOL_JOURNEY_BROWSER_PASS');
  }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
