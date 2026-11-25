'use strict';
const { chapterThreeCards } = require('./browser-chapter-three-inventory.cjs');
// Printed pp. 152–155. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const fresh=async()=>{const p=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.goto(url);return p;};
  let page=await fresh();
  const cards = await chapterThreeCards(page, 'p27', 648, 670);
  assert.equal(cards.length,28);
  for(const [index,card] of cards.entries()){
    if(index&&index%8===0){await page.close();page=await fresh();}
    await page.evaluate(i=>{history.replaceState(null,'','#lesson/p27/'+i);MakarychevApp.route();},card.index);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await page.close();page=await fresh();
  await openNumber(page,658,'№ 658');await page.locator('#final-answer').fill('2');
  assert.equal(await page.locator('[data-rate-domain]').count(),1);
  await submit(page,'6');assert.match(await page.locator('#answer-form .feedback').innerText(),/Пока/);
  await submit(page,'6;5');
  const expected=['3/2 ч','5/2 ч','2 ч','3 ч'];
  assert.deepEqual(await page.locator('[data-rate-result]').allTextContents(),expected);
  await page.reload();assert.deepEqual(await page.locator('[data-rate-result]').allTextContents(),expected);
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p27-source-658'].independent),false);
  await openNumber(page,661,'№ 661');await page.locator('#final-answer').fill('20');
  assert.equal(await page.locator('[data-rate-domain]').count(),1);
  await submit(page,'500');assert.deepEqual(await page.locator('[data-rate-result]').allTextContents(),['6 %','5 %']);
  await openNumber(page,662,'№ 662');await submit(page,'60');assert.deepEqual(await page.locator('[data-rate-result]').allTextContents(),['40 %','60 %']);
  await page.close();page=await fresh();await openNumber(page,670,'№ 670а');
  await submit(page,'2;√3;1');assert.match(await page.locator('#answer-form .feedback').innerText(),/коэффициент B/);
  await submit(page,'√3;-3;√3/2');assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p27-source-670-a'].correct));
  const control=cards.find(c=>c.title==='§ 9, контрольный вопрос 1');
  await page.evaluate(i=>{history.replaceState(null,'','#lesson/p27/'+i);MakarychevApp.route();},control.index);
  assert.equal(await page.locator('.task-heading h2').innerText(),control.title);
  await submit(page,'3/2;8;-5;0');assert.match(await page.locator('[data-equation-pair]').innerText(),/1 \/ .* = 0/);
  assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p27-source-check-1'].independent));
  await openNumber(page,660,'№ 660');
  const drill=page.locator('[data-action=detour][data-skill=rational-stories]').first();
  await drill.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await drill.click();
  const prior=await page.locator('.prompt').innerText();await page.locator('[data-action=new]').first().click();assert.notEqual(await page.locator('.prompt').innerText(),prior);
  await page.locator('[data-action=return]').first().click();assert.equal(await page.locator('.task-heading h2').innerText(),'№ 660');
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
