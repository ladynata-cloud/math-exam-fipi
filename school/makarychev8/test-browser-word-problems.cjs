'use strict';
const { chapterThreeCards } = require('./browser-chapter-three-inventory.cjs');
// Printed pp. 129–131. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(url);
  const rows = await chapterThreeCards(page, 'p22', 557, 577);
  assert.equal(rows.length,29);
  for(const card of rows){
    await page.evaluate(i=>{history.replaceState(null,'','#lesson/p22/'+i);MakarychevApp.route();},card.index);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await openNumber(page,564,'№ 564, чертёж 5 см');
  assert.equal(await page.locator('[data-source-cut]').count(),0);
  await page.locator('#final-answer').fill('13;12;2;4');
  assert.match(await page.locator('#task-graph').innerText(),/Отметки идут/);
  await page.locator('#final-answer').fill('13;2,5;10,5;2,5');
  const sheet=page.locator('[data-source-cut=sheet]'),middle=page.locator('[data-source-cut=middle]');
  const ratio=async()=>Number(await middle.getAttribute('width'))/Number(await sheet.getAttribute('height'));
  assert(Math.abs(await ratio()-16/5)<1e-8);
  await page.locator('#answer-form button[type=submit]').click();
  await page.reload();assert(Math.abs(await ratio()-16/5)<1e-8);
  await openNumber(page,564,'№ 564, чертёж 8 см');
  await submit(page,'13;4;9;4');assert(Math.abs(await ratio()-10/8)<1e-8);
  await openNumber(page,567,'№ 567');await submit(page,'16;48');
  await openNumber(page,568,'№ 568');await submit(page,'5');
  assert.match(await page.locator('#answer-form .feedback').innerText(),/нельзя убрать троих/);
  await submit(page,'50');assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p22-source-568'].independent),false);
  await openNumber(page,572,'№ 572');await submit(page,'40');
  assert.match(await page.locator('#answer-form .feedback').innerText(),/дно такой коробки/);
  await submit(page,'10');
  const drill=page.locator('[data-action=detour][data-skill=quadratic-story-problems]').first();
  await drill.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await drill.click();
  const prompt=await page.locator('.prompt').innerText();await page.locator('[data-action=new]').first().click();
  assert.notEqual(await page.locator('.prompt').innerText(),prompt);
  await page.locator('[data-action=return]').first().click();assert.equal(await page.locator('.task-heading h2').innerText(),'№ 572');
  await openNumber(page,574,'№ 574б');await submit(page,'(4-x)/(x-3)');
  assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p22-source-574-b'].correct));
  await openNumber(page,577,'№ 577');await submit(page,'1/5;0;0;-13/5');
  assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p22-source-577'].correct));
  assert.deepEqual(errors,[]);await page.close();return {width,cards:rows.length};
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
