'use strict';
// Printed pp. 183–184. Exercise the public course entry, model and saved learning on a clean browser profile.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local.test');
  if (url.pathname === '/favicon.ico') return res.writeHead(204).end();
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
  res.setHeader('content-type', types[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
let browser;

async function openNumber(page, n, ref) {
  await page.evaluate(() => {
    history.replaceState(null, '', '#home');
    window.MakarychevApp.route();
  });
  await page.locator('#exercise-number').fill(String(n));
  await page.locator('#number-form button').click();
  if (ref) {
    await page.getByRole('link', { name: ref, exact: true }).click();
    await page.waitForFunction(label => document.querySelector('.task-heading h2')?.textContent === label, ref);
  }
}

async function submit(page, value) {
  await page.locator('#final-answer').fill(value);
  await page.locator('#answer-form button[type=submit]').click();
}



async function verify(width,url){
  const errors=[];
  const fresh=async()=>{const p=await browser.newPage({viewport:{width,height:900}});p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.stack));await p.goto(url);return p;};
  let page=await fresh();
  const cards=await page.evaluate(()=>MakarychevCourse.lessons.flatMap(l=>l.tasks.map((t,i)=>({l:l.id,i,title:t.title,section:t.source.section}))).filter(t=>t.section==='additional-3'&&/^№ (82[2-9]|83[0-1])(?:$|[^0-9])/.test(t.title)));
  assert.equal(cards.length,10);
  for(const [index,card] of cards.entries()){
    if(index&&index%8===0){await page.close();page=await fresh();}
    await page.evaluate(({l,i})=>{history.replaceState(null,'','#lesson/'+l+'/'+i);MakarychevApp.route();},card);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);
    assert.match(await page.locator('p.eyebrow').filter({hasText:'Дополнительно к §9'}).first().textContent(),/Дополнительно к §9/);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await page.close();page=await fresh();
  await openNumber(page,826,'№ 826');assert(!(await page.evaluate(()=>MakarychevApp.getState().tasks['p27-extra-826'].correct)));
  await submit(page,'12');assert.match(await page.locator('#answer-form [role=status]').innerText(),/второй корень/);assert.equal(await page.locator('#task-graph progress').count(),2);
  await submit(page,'12;25');assert.equal(await page.locator('[data-quantity-comparison=agrees]').count(),2);assert.equal(await page.locator('#task-graph progress').count(),4);
  await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.locator('[data-quantity-comparison=agrees]').count(),2);
  await page.close();page=await fresh();await openNumber(page,827,'№ 827');
  await page.locator('[data-action=guided]').click();await page.locator('#step-answer-0').fill('0');assert(await page.locator('[data-quantity-measure=invalid]').count());
  await page.locator('#step-answer-0').fill('10');assert.equal(await page.locator('[data-quantity-comparison=agrees]').count(),1);
  await page.locator('[data-step-form="0"] button').first().click();await page.locator('#step-answer-1').fill('4/x+4/(x+5)');await page.locator('[data-step-form="1"] button').first().click();
  await page.locator('#step-answer-2').fill('10');await page.locator('[data-step-form="2"] button').first().click();
  await submit(page,'10;15');assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p27-extra-827'].correct));
  const drill=page.locator('[data-action=detour][data-skill=work-fraction]').first();
  await drill.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await drill.click();
  const prior=await page.locator('.prompt').innerText();await page.locator('[data-action=new]').first().click();assert.notEqual(await page.locator('.prompt').innerText(),prior);
  await page.locator('[data-action=return]').first().click();assert.equal(await page.locator('.task-heading h2').innerText(),'№ 827');
  assert.deepEqual(errors,[]);await page.close();return {width,cards:cards.length};
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/school/makarychev8/';
  browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const views = [];
  for (const width of [320, 390, 1024]) views.push(await verify(width, url));
  console.log(JSON.stringify({ status: 'PASS', views }));
})().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.close();
});
