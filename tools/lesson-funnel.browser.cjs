'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const routes=['/','/lessons/','/courses/','/foundations/','/trainers/oge-course/',
  '/topics/','/topics/delenie-ugolkom/','/topics/obyknovennye-drobi/',
  '/topics/procenty/','/topics/lineynye-uravneniya/','/topics/oge-geometriya/'];
const source=fs.readFileSync(path.join(root,'assets/lesson-funnel.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true,
   ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),
   args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  const context=await browser.newContext();
  // All requests are handled locally, including the mock counter and popups.
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='mc.yandex.ru') return route.fulfill({contentType:'text/javascript',body:
    'window.__metricCalls=(window.ym.a||[]).map(a=>Array.from(a));window.ym=function(){window.__metricCalls.push(Array.from(arguments));};'});
   if(url.hostname!=='mathexam.space') return route.fulfill({body:'External link destination intercepted by QA'});
   const file=path.join(root,decodeURIComponent(url.pathname),url.pathname.endsWith('/')?'index.html':'');
   if(!fs.existsSync(file)||!fs.statSync(file).isFile()) return route.fulfill({status:404,body:'Not found'});
   return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream'});
  });
  for(const width of [360,1280]) {
   const page=await context.newPage();await page.setViewportSize({width,height:900});
   for(const route of routes) {
    const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
    await page.goto('https://mathexam.space'+route+'?private=secret#private',{waitUntil:'load'});
    await page.waitForFunction(()=>window.__metricCalls?.some(c=>c[1]==='hit'));
    const calls=await page.evaluate(()=>window.__metricCalls);
    assert.equal(calls.filter(c=>c[1]==='init').length,1);
    assert.equal(calls.find(c=>c[1]==='hit')[2],'https://mathexam.space'+route);
    assert(!JSON.stringify(calls).includes('secret'));
    assert.equal(await page.locator('.me-contacts a[href="https://t.me/ladynata3000"]').count(),1);
    assert.equal(await page.locator('.me-contacts a[href="https://vk.ru/ladynata3000"]').count(),1);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('.me-contact-card').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>window.__metricCalls.some(c=>c[2]==='lesson_invitation_view'));
    const popupPromise=page.waitForEvent('popup');
    await page.locator('.me-contacts a[href="https://t.me/ladynata3000"]').click();
    const popup=await popupPromise;await popup.waitForLoadState();assert.equal(popup.url(),'https://t.me/ladynata3000');await popup.close();
    const goal=await page.evaluate(()=>window.__metricCalls.filter(c=>c[2]==='lesson_contact_click'));
    assert.equal(goal.length,1);assert.deepEqual(goal[0][3],{page:route,placement:'invitation',destination:'telegram'});
    await page.evaluate(source);assert.equal(await page.evaluate(()=>window.__metricCalls.filter(c=>c[1]==='init').length),1);
    assert.deepEqual(errors,[]);page.off('pageerror',onError);
   }
   await page.close();
  }
  const page=await context.newPage();await page.goto('https://mathexam.space/lessons/');
  await page.waitForFunction(()=>window.__metricCalls);
  await page.getByRole('link',{name:'Обсудить занятия',exact:true}).focus();await page.keyboard.press('Enter');
  assert(page.url().endsWith('#contact'));
  assert.equal(await page.evaluate(()=>window.__metricCalls.filter(c=>c[2]==='lesson_details_click').length),1);
  // Even a broken counter does not prevent an actual outbound click.
  await page.evaluate(()=>{window.ym=()=>{throw Error('counter unavailable');};});
  const popupPromise=page.waitForEvent('popup');await page.locator('a[href="https://vk.ru/ladynata3000"]').click();
  const popup=await popupPromise;await popup.waitForLoadState();assert.equal(popup.url(),'https://vk.ru/ladynata3000');await popup.close();
  const nojs=await browser.newContext({javaScriptEnabled:false});
  await nojs.route('**/*',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'lessons/index.html'),'utf8')}));
  const np=await nojs.newPage();await np.goto('https://mathexam.space/lessons/');
  assert(await np.locator('#contact a[href="https://t.me/ladynata3000"]').isVisible());
  assert(await np.locator('#contact a[href="https://vk.ru/ladynata3000"]').isVisible());
  console.log('LESSON_FUNNEL_BROWSER_OK: 22 responsive pages, 22 real contact clicks, keyboard anchor, duplicate guard, broken-counter link and no-JS fallback. No live analytics requests.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
