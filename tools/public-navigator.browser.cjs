'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { restorePublicNavigator } = require('./public-navigator-preservation.cjs');
const allPages = require('../assets/assistant/pages.json');
const shardCount=Number(process.env.NAV_SHARD_COUNT||1),shardIndex=Number(process.env.NAV_SHARD_INDEX||0);
assert(Number.isInteger(shardCount)&&shardCount>0&&Number.isInteger(shardIndex)&&shardIndex>=0&&shardIndex<shardCount,'valid browser shard');
const pages=allPages.filter((_,index)=>index%shardCount===shardIndex);
const catalogue = require('../assets/assistant/navigator-data.js').catalogue;
let origin = process.env.NAV_ORIGIN || 'http://127.0.0.1:8765';
let localServer;
const out = process.env.ARTIFACT_DIR || '/tmp/public-navigator-qa';
fs.mkdirSync(out, { recursive: true });
for (const item of catalogue) {
  if (!item.url.startsWith('/')) continue;
  const pathname = new URL(item.url, origin).pathname;
  assert.ok(fs.existsSync(path.join(process.cwd(), pathname, pathname.endsWith('/') ? 'index.html' : '')), item.url);
}
(async () => {
  if(process.env.NAV_LOCAL_SERVER==='1'){
    const root=process.cwd(),mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
    localServer=http.createServer((request,response)=>{try{
      let file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://local').pathname));
      if(file!==root&&!file.startsWith(root+path.sep))return response.writeHead(403).end();
      if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(fs.readFileSync(file));
    }catch{response.writeHead(404).end();}});
    await new Promise(resolve=>localServer.listen(0,'127.0.0.1',resolve));
    origin='http://127.0.0.1:'+localServer.address().port;
  }
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}) });
  const results = [];
  const failures = [];
  const focusRegressions = [];
  async function originalPageErrors(filename,viewport){
    const context=await browser.newContext({viewport});
    const original=restorePublicNavigator(filename,fs.readFileSync(path.join(process.cwd(),filename)));
    const route='/' + filename.replace(/index\.html$/, '');
    await context.route('**/*',request=>{
      const url=new URL(request.request().url());
      if(url.origin!==origin)return request.abort();
      if(request.request().resourceType()==='document'&&url.pathname===route)
        return request.fulfill({status:200,contentType:'text/html;charset=utf-8',body:original});
      return request.continue();
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    try{await page.goto(origin+route,{waitUntil:'load'});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));return errors.sort();}
    finally{await context.close();}
  }
  try {
    for (const viewport of [{width:1280,height:900}, {width:320,height:640}, {width:844,height:390}]) {
      const context = await browser.newContext({ viewport });
      // Do not send synthetic QA text or page visits to production analytics.
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      for (const filename of pages) {
        const route = '/' + filename.replace(/index\.html$/, '');
        errors.length=0;
        try {
        await page.goto(origin + route, { waitUntil: 'load' });
        const host = page.locator('#maxexam-public-assistant');
        const launcher = host.locator('.launcher');
        const panel = host.locator('.panel');
        await launcher.waitFor({ state: 'visible' });
        assert.equal(await host.count(), 1);
        assert.match(await launcher.innerText(), /Навигатор/);
        assert.equal(await panel.isVisible(), false);
        const box = await launcher.boundingBox();
        const courseFlow = viewport.width <= 600 && await host.getAttribute('data-course-navigation') === 'true';
        if(courseFlow) {
          assert.equal(await launcher.evaluate(e => getComputedStyle(e).position), 'static', 'OGE launcher occupies its own line');
          const routeBar=await page.locator('body > nav.oge-wayfinding').boundingBox();
          assert(routeBar && box.y >= routeBar.y+routeBar.height-1, 'Launcher follows the existing course return');
          assert(box.height>=44,'Course launcher remains an accessible touch target');
        } else {
          assert.ok(box.x > viewport.width / 2 && box.y > viewport.height / 2);
          assert.equal(await launcher.evaluate(e => getComputedStyle(e).position), 'fixed');
        }
        assert.ok(box.x + box.width <= viewport.width && box.y + box.height <= viewport.height);
        assert.equal(await launcher.getAttribute('aria-label'), 'Открыть навигатор по MathExam');
        if (viewport.width <= 600 && !courseFlow) assert.ok(box.width <= 56, 'Mobile launcher must leave answer columns reachable');
        if (filename === 'index.html') await page.screenshot({ path: path.join(out, `home-${viewport.width}.png`) });
        await launcher.click();
        await panel.waitFor({state:'visible'});
        const panelBox = await panel.boundingBox();
        assert.ok(panelBox.x >= 0 && panelBox.y >= 0 && panelBox.x + panelBox.width <= viewport.width && panelBox.y + panelBox.height <= viewport.height);
        const input = host.locator('textarea');
        await input.fill('Я в 6 классе, надо делить уголком');
        await input.press('Enter');
        assert.equal(await host.locator('.navigator').last().locator('a').first().getAttribute('href'), '/trainers/long-division-stepwise.html');
        await input.fill('мой PIN — 1234');
        await host.locator('.send').click();
        assert.ok(!(await host.locator('.log').innerText()).includes('1234'));
        await input.press('Escape');
        assert.equal(await panel.isVisible(), false);
        await launcher.click();
        await host.locator('.clear').click();
        assert.equal(await host.locator('.visitor').count(), 0);
        await input.fill('Где найти графики ОГЭ?');
        await host.locator('.send').click();
        if (filename === 'index.html') await page.screenshot({ path: path.join(out, `chat-${viewport.width}.png`) });
        await host.locator('.icon-button').click();
        assert.equal(await panel.isVisible(), false);
        await page.reload({waitUntil:'load'});
        await launcher.waitFor({state:'visible'});
        assert.equal(await panel.isVisible(), false);
        let preExistingErrors=[];
        if(errors.length){
          preExistingErrors=await originalPageErrors(filename,viewport);
          // A reload repeats the original page's existing load errors. Compare
          // multiplicities, not a broad allowlist of exception names/messages.
          assert.deepEqual(errors.slice().sort(),[...preExistingErrors,...preExistingErrors].sort(),filename+' must introduce no new page errors');
        }
        results.push({route,viewport,launcher:box,passed:true,preExistingErrors});
        if(results.length%50===0)console.log('NAVIGATOR_PROGRESS',JSON.stringify({shardIndex,passed:results.length,expected:pages.length*3,failures:failures.length}));
        } catch(error){failures.push({route,viewport,error:error.message,pageErrors:errors.slice()});console.error('NAVIGATOR_ROUTE_FAIL',route,viewport.width,error.message);}
      }
      await context.close();
    }
    // Exercise the actual delayed rounding callback at a deterministic point.
    // A dedicated context keeps this clock out of the ordinary page journeys.
    if (pages.includes('rounding.html')) {
      const viewport = { width: 844, height: 390 };
      const context = await browser.newContext({ viewport });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage(), pageErrors = [];
      page.setDefaultTimeout(10000);
      page.on('pageerror', error => pageErrors.push(error.message));
      try {
        const initialTime = Date.UTC(2026, 10, 6);
        await page.clock.install({ time: initialTime });
        await page.clock.pauseAt(initialTime + 60000);
        await page.goto(origin + '/rounding.html', { waitUntil: 'load' });
        const answer = page.locator('#userAnswer');
        await page.clock.runFor(100);
        assert.equal(await answer.evaluate(node => document.activeElement === node), true, 'initial rounding autofocus');
        await answer.fill(await page.evaluate(() => buildAITaskPayload('focus-regression', true).correctAnswer));
        await answer.press('Enter');
        await page.locator('#feedback .feedback-correct').waitFor();
        await page.locator('#nextBtn').click();
        await page.clock.runFor(100);
        assert.equal(await answer.evaluate(node => document.activeElement === node), true, 'Next restores answer focus after hiding its button');
        assert.equal(await answer.isEnabled(), true);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('roundingTrainer2025')).totalAttempts), 1);

        // The category starts a fresh real 100 ms callback. Opening/filling the
        // navigator is a newer focus choice that callback must respect.
        await page.locator('[data-category="decimals"]').click();
        const host = page.locator('#maxexam-public-assistant');
        await host.locator('.launcher').click();
        const input = host.locator('textarea');
        await input.fill('Я в 6 классе, надо делить уголком');
        await page.clock.runFor(100);
        assert.equal(await input.evaluate(node => node.getRootNode().activeElement === node && document.activeElement === node.getRootNode().host), true, 'rounding timer preserves navigator focus before native Enter');
        await input.press('Enter');
        assert.equal(await host.locator('.navigator').last().locator('a').first().getAttribute('href'), '/trainers/long-division-stepwise.html');
        assert.equal(await host.locator('.visitor').count(), 1);
        assert.equal(await answer.inputValue(), '', 'navigator text never enters the rounding answer');
        assert.equal(await page.locator('#feedback').textContent(), '');
        assert.deepEqual(pageErrors, []);
        focusRegressions.push({ route: '/rounding.html', viewport, scenarios: ['hidden-next-button', 'navigator-native-enter'], passed: true });
        console.log('ROUNDING_FOCUS_NATIVE_OK');
      } catch (error) {
        const failure = { route: '/rounding.html', viewport, scenario: 'delayed-autofocus', error: error.message, pageErrors: pageErrors.slice() };
        focusRegressions.push({ ...failure, passed: false }); failures.push(failure);
        console.error('ROUNDING_FOCUS_NATIVE_FAIL', error.message);
      } finally { await context.close(); }
    }
    // The existing navigator must stay absent when a public trainer is hosted
    // inside the board/cabinet or another course iframe.
    const frameContext=await browser.newContext();
    await frameContext.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const framePage=await frameContext.newPage();
    await framePage.goto(origin+'/');
    for(const filename of ['trainers/oge-task6-fractions.html','geometry-course/textbook/index.html','trainers/college-logarithms/index.html']){
      await framePage.evaluate(src=>{document.querySelectorAll('iframe[data-navigator-test]').forEach(node=>node.remove());const frame=document.createElement('iframe');frame.dataset.navigatorTest='true';frame.src=src;document.body.append(frame);},origin+'/'+filename);
      const frame=framePage.frameLocator('iframe[data-navigator-test]');
      await frame.locator('body').waitFor();
      const loadedFrame=await(await framePage.locator('iframe[data-navigator-test]').elementHandle()).contentFrame();
      await loadedFrame.waitForLoadState('load');
      assert.equal(await frame.locator('#maxexam-public-assistant').count(),0,'No competing navigator in iframe: '+filename);
    }
    await frameContext.close();
    fs.writeFileSync(path.join(out,'results.json'), JSON.stringify({result:failures.length?'PUBLIC_NAVIGATOR_FAILED':'PUBLIC_NAVIGATOR_VISIBLE_OK',shardIndex,shardCount,inventoryPages:allPages.length,shardPages:pages.length,browserVersion:browser.version(),catalogue:catalogue.length,results,focusRegressions,failures},null,2));
    assert.equal(results.length,pages.length*3,'Every page/viewport journey must pass; see recorded failures');
    assert.deepEqual(failures,[]);
    console.log('PUBLIC_NAVIGATOR_VISIBLE_OK', results.length, 'page/viewport journeys;', catalogue.length, 'catalogue entries');
  } finally { await browser.close(); if(localServer)localServer.close(); }
})().catch(e => { console.error(e); if(localServer)localServer.close(); process.exitCode = 1; });
