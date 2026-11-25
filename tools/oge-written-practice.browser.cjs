'use strict';
// Run with the existing isolated Playwright installation used by OGE skill course.
// No real student data, external network or API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'trainers/oge-written-practice.html');
const html = fs.readFileSync(file, 'utf8');
const url = 'https://mathexam.test/trainers/oge-written-practice.html';
const keys = ['mathExamCourseProgress.v1', 'mathExam.oge6.practice.v1', 'oge21_prog', 'mathexam.oge.course-navigation.v1'];
const baseline = Object.fromEntries(keys.map((k,i) => [k, JSON.stringify({synthetic: true, index: i})]));
const ids = ['p24-median-height','p24-cross-sides','p24-cross-diagonals','p24-return','p25-median-bisector','p25-tangent-trapezoid'];
async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320,390,1280]) {
      const context = await browser.newContext({viewport:{width,height:900},acceptDownloads:true,reducedMotion:'reduce'});
      try {
        const requests = [], errors = [], localNavigationAssets = new Set();
        const optionalNavigation = new Map([
          ['https://mathexam.test/assets/assistant/navigator-data.js?v=20261105-site1',{path:'assets/assistant/navigator-data.js',type:'application/javascript'}],
          ['https://mathexam.test/assets/assistant/navigator-widget.js?v=20261105-site1',{path:'assets/assistant/navigator-widget.js',type:'application/javascript'}],
          ['https://mathexam.test/assets/assistant/widget.css?v=20261105-site1',{path:'assets/assistant/widget.css',type:'text/css'}]
        ]);
        await context.addInitScript(values => { for (const [k,v] of Object.entries(values)) localStorage.setItem(k,v); },baseline);
        await context.route('**/*', async route => {
          const u=route.request().url();
          if(u===url) return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
          if(u==='https://mathexam.test/favicon.ico') return route.fulfill({status:204,body:''});
          if(optionalNavigation.has(u)){
            localNavigationAssets.add(u);
            const asset=optionalNavigation.get(u);
            return route.fulfill({status:200,contentType:asset.type+'; charset=utf-8',body:fs.readFileSync(path.join(root,asset.path),'utf8')});
          }
          requests.push(u);
          return route.abort();
        });
        const page = await context.newPage();
        page.on('pageerror',e=>errors.push(String(e)));
        await page.goto(url);
        const controls=page.locator('#controls button'), writing=page.locator('#writing');
        const title=page.locator('#title'), figure=page.locator('#figure');
        const firstHistory=page.locator('#first-record'), firstText=page.locator('#first');
        const inspectFirst=async expected=>{
          assert.equal(await firstText.textContent(),expected,'Original record is retained in the document');
          if(!(await firstHistory.evaluate(el=>el.open))) await firstHistory.locator('summary').click();
          assert(await firstText.isVisible(),'First record must be visible after opening its history');
          assert.equal(await firstText.innerText(),expected,'Visible first record matches the original');
          await firstHistory.locator('summary').click();
          assert.equal(await firstHistory.evaluate(el=>el.open),false,'History can be closed again');
        };
        const home=page.locator('a[data-mathexam-home-link]');
        assert.equal(await home.count(),1);
        assert.equal(await home.getAttribute('href'),'/');
        assert.equal(await home.getAttribute('target'),'_self');
        assert(await home.isVisible());
        const verifyOverflow=async label=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), 'Horizontal overflow: '+width+' '+label);
        assert.match(await title.innerText(),/Медиана является высотой/);
        assert.equal(await figure.locator('polyline').count(),1,'Given right angle is marked');
        for (const b of await controls.all()) assert(await b.isDisabled(),'All help disabled before first entry');
        await verifyOverflow('initial');
        await writing.fill('AM = MC.');
        await page.locator('#save').click();
        await inspectFirst('AM = MC.');
        await writing.fill('AM = MC. BM общая.');
        await controls.nth(0).click();
        assert.match(await page.locator('#notice').innerText(),/Сначала зафиксируй/);
        assert.equal(await page.locator('#help section').count(),0);
        await page.locator('#next').click();
        await page.locator('#prev').click();
        assert.equal(await writing.inputValue(),'AM = MC. BM общая.','Uncommitted draft survives task switching');
        await inspectFirst('AM = MC.');
        await page.locator('#save').click();
        await controls.nth(0).click();
        assert.equal(await page.locator('#help section').count(),1);
        assert(!(await controls.nth(1).isDisabled()));
        await writing.fill('Исправлено после вопроса.');
        await page.locator('#save').click();
        await controls.nth(2).click();
        await controls.nth(3).click();
        await page.locator('#help-checklist input').first().check();
        await page.locator('#next').click();
        assert.match(await title.innerText(),/Два отрезка/);
        for (const b of await controls.all()) assert(await b.isDisabled());
        await page.locator('#prev').click();
        assert.equal(await writing.inputValue(),'Исправлено после вопроса.');
        await inspectFirst('AM = MC.');
        assert(await page.locator('#help-checklist input').first().isChecked());
        await verifyOverflow('expanded supports');
        for(const id of ids) {
          await page.locator('#nav').selectOption(id);
          assert.equal(await figure.locator('line').count()>2,true);
          await verifyOverflow(id);
        }
        await page.locator('#nav').selectOption('p24-return');
        assert.equal(await figure.locator('polyline').count(),0,'Unproved right angle is not marked');
        await page.locator('#unable').click();
        await inspectFirst('Не смог начать');
        await controls.nth(4).click();
        assert.equal(await figure.locator('polyline').count(),1,'Model reveals established right angle');
        await verifyOverflow('established figure');
        const pending=page.waitForEvent('download');
        await page.locator('#export').click();
        const dl=await pending;
        const stream=await dl.createReadStream();
        const chunks=[];
        for await(const chunk of stream) chunks.push(chunk);
        const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
        assert.equal(data.tasks.length,6);
        assert.equal(data.tasks[0].first.text,'AM = MC.');
        assert.equal(data.tasks[0].draft,'Исправлено после вопроса.');
        assert.equal(data.tasks[0].attempts.length,3);
        assert.deepEqual(data.tasks[0].attempts[1].helpBefore,[]);
        assert.deepEqual(data.tasks[0].attempts[2].helpBefore,['hint1']);
        assert.deepEqual(data.tasks[0].checks,[0]);
        assert(data.tasks[3].first.unable);
        assert.equal(data.tasks[3].help[0].kind,'model');
        assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),keys),baseline);
        assert.deepEqual(requests,[],'no external or unexpected requests');
        assert.deepEqual([...localNavigationAssets].sort(),[...optionalNavigation.keys()].sort(),'only the three standard public navigation assets are loaded');
        assert.deepEqual(errors,[]);
        console.log('PASS written practice at '+width+'px: independent drafts, help, square, export and preserved old keys');
      } finally {await context.close();}
    }
  } finally {await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
