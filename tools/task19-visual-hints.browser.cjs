'use strict';

// Real browser checks for the learner flow and geometry at narrow widths.
// Run after the node contracts, with Playwright's Chromium installed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const {cards} = require('../trainers/task19-visual-data.js');
const KEY = 'mathExam.task19.visualHints.v1';
const artifacts = path.resolve(process.env.TASK19_BROWSER_ARTIFACTS || path.join(root,'artifacts/task19-visual-hints'));
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.ico':'image/x-icon'};

async function startServer() {
  const server = http.createServer((req,res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
    catch (_) { res.writeHead(400).end();return; }
    if (pathname === '/favicon.ico') {res.writeHead(204).end();return;}
    const file = path.resolve(root,'.'+pathname);
    if (!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
    fs.readFile(file,(error,body) => {
      if(error){res.writeHead(404).end('Not found');return;}
      res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});res.end(body);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {server,base:'http://127.0.0.1:'+server.address().port};
}

async function noOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const selectors = ['main','.exercise','#statement','#hintPanel','#visualHost','#visualHost svg','#visualHost input'];
    return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length).map(el=>({
      selector,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width
    }))).filter(r=>r.left < -1 || r.right > r.width+1);
  });
  assert.deepEqual(overflow,[],label+' fits the viewport');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),label+' has no page horizontal scroll');
}

async function main() {
  fs.mkdirSync(artifacts,{recursive:true});
  const {server,base} = await startServer();
  let browser;
  const failures = [];
  const errors = [];
  const check = async (name,fn) => {
    try {await fn();console.log('PASS '+name);}
    catch(error){failures.push(name+': '+error.stack);console.error('FAIL '+name+': '+error.message);}
  };
  try {
    browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
    const context = await browser.newContext({viewport:{width:360,height:800}});
    const page = await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
    const go = async (file='task19-trainer.html',card='prev-056') => {
      await page.goto(base+'/trainers/'+file+'?card='+encodeURIComponent(card));
      await page.waitForFunction(()=>window.Task19Data && document.querySelector('#statement').textContent !== 'Загружаем утверждение…');
    };

    await check('both public entry points withhold the answer and support keyboard help',async()=>{
      for (const file of ['task19-trainer.html','geometry_statements_trainer_improved.html']) {
        await context.clearCookies();
        await go(file);
        await page.evaluate(()=>localStorage.clear());
        await page.reload();
        assert.equal(await page.locator('#hintToggle').innerText(),'Хочешь подсказку?');
        assert.equal(await page.locator('#hintPanel').isVisible(),false);
        assert.equal(await page.locator('#answerPanel').isVisible(),false);
        assert.equal(await page.locator('#answerExplanation').innerText(),'');
        assert.equal(await page.locator('#settings').getAttribute('open'),null);
        const before = await page.locator('#progressText').textContent();
        await noOverflow(page,file+' initial');
        for (const id of ['hintToggle','btnTrue','btnFalse','nextCard']) {
          const bounds = await page.locator('#'+id).boundingBox();
          assert(bounds.height>=44,id+' touch height');
        }
        await page.locator('#hintToggle').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#hintPanel').isVisible(),true);
        assert.equal(await page.locator('#hintToggle').getAttribute('aria-expanded'),'true');
        assert(await page.locator('#visualHost svg').count());
        assert.equal(await page.locator('#answerPanel').isVisible(),false);
        assert.equal(await page.locator('#progressText').textContent(),before);
        await noOverflow(page,file+' hint');
      }
    });

    await check('interactive controls respond to arrows without answering the card',async()=>{
      await go();
      await page.evaluate(()=>localStorage.clear());
      await page.reload();
      await page.screenshot({path:path.join(artifacts,'01-question-mobile.png'),fullPage:true});
      await page.locator('#hintToggle').click();
      const slider = page.locator('#visualHost input[type=range]').last();
      assert(await slider.count(),'Rhombus offers an experiment');
      const value = await slider.inputValue();
      const drawing = await page.locator('#visualHost svg').innerHTML();
      await slider.focus();await page.keyboard.press('ArrowRight');
      assert.notEqual(await slider.inputValue(),value);
      assert.notEqual(await page.locator('#visualHost svg').innerHTML(),drawing);
      assert.equal(await page.locator('#answerPanel').isVisible(),false);
      await noOverflow(page,'Keyboard rhombus');
      await page.screenshot({path:path.join(artifacts,'02-hint-mobile.png'),fullPage:true});
      await page.locator('#btnTrue').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#answerPanel').isVisible(),true);
      const saved = await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
      assert.equal(saved.records['prev-056'].attempts,1);
      assert.equal(saved.records['prev-056'].needsReview,true);
      await page.locator('#statement').focus();await page.keyboard.press('j');await page.keyboard.press('n');
      await page.reload();
      assert.equal(await page.locator('#answerPanel').isVisible(),true);
      assert.equal(await page.locator('#btnTrue').isDisabled(),true);
      assert.equal(await page.locator('#btnFalse').isDisabled(),true);
      assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).records,KEY),saved.records);
      await page.screenshot({path:path.join(artifacts,'03-explanation-mobile.png'),fullPage:true});
      await page.locator('#nextCard').click();
      assert.equal(await page.locator('#hintPanel').isVisible(),false);
      assert.equal(await page.locator('#answerPanel').isVisible(),false);
      assert.equal(await page.locator('#answerExplanation').textContent(),'');
    });

    await check('all diagram families fit mobile and desktop with adjustable boundaries',async()=>{
      const representatives = [...new Map(cards.map(c=>[c.hint.model || 'static-svg',c])).values()];
      for (const width of [360,1280]) {
        await page.setViewportSize({width,height:900});
        for (const card of representatives) {
          await go('task19-trainer.html',card.id);
          if (!await page.locator('#hintPanel').isVisible()) await page.locator('#hintToggle').click();
          assert.equal(await page.locator('#answerPanel').isVisible(),false,card.id+' no revealed explanation');
          await noOverflow(page,card.id+' '+width);
          const sliders = page.locator('#visualHost input[type=range]');
          for (let i=0;i<await sliders.count();i++) {
            await sliders.nth(i).focus();await page.keyboard.press('Home');
            await noOverflow(page,card.id+' minimum '+i);
            await page.keyboard.press('End');
            await noOverflow(page,card.id+' maximum '+i);
          }
          assert.equal(await page.locator('#answerPanel').isVisible(),false);
        }
      }
      await go();
      await page.screenshot({path:path.join(artifacts,'04-desktop.png'),fullPage:true});
    });

    await check('storage denial leaves the trainer usable',async()=>{
      const blocked = await browser.newContext({viewport:{width:360,height:800}});
      await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
      const denied = await blocked.newPage();
      denied.on('pageerror',error=>errors.push(error.message));
      await denied.goto(base+'/trainers/task19-trainer.html?card=prev-056');
      await denied.locator('#hintToggle').click();
      assert(await denied.locator('#visualHost svg').count());
      await denied.locator('#btnFalse').click();
      assert.equal(await denied.locator('#answerPanel').isVisible(),true);
      assert.match(await denied.locator('#storageNote').textContent(),/не разрешает сохранять/);
      await denied.locator('#nextCard').click();
      assert.equal(await denied.locator('#answerPanel').isVisible(),false);
      await blocked.close();
    });
    assert.deepEqual(errors,[],'No browser script or resource errors');
    assert.deepEqual(failures,[],'All learner journeys pass');
    console.log('TASK19_VISUAL_HINTS_BROWSER_OK');
  } finally {
    if(browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error.stack || error);process.exitCode=1;});
