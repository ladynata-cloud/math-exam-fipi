'use strict';
const { chapterThreeCards } = require('./browser-chapter-three-inventory.cjs');
// Printed pp. 118–120. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  const inventory = await chapterThreeCards(page, 'p20', 510, 530);
  assert.equal(inventory.length,70);
  for(const card of inventory){
    await page.evaluate(index=>{history.replaceState(null,'','#lesson/p20/'+index);MakarychevApp.route();},card.index);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,card.id+' on '+width);
    if(card.graph)assert.equal(await page.locator('#task-graph svg').count(),1);
  }
  for(let n=510;n<=530;n++){
    await openNumber(page,n);assert(await page.locator('#number-result a.button:not(.quiet)').count()>0);
  }
  await openNumber(page,512,'№ 512, без b');
  await submit(page,'0;0;-3');assert.match(await page.locator('#answer-form .feedback').innerText(),/член второй степени исчезает/);
  await submit(page,'-3/2;0;6');assert.equal(await page.locator('[data-root-curve="quadratic"]').count(),1);
  await page.reload();assert.equal(await page.locator('#final-answer').inputValue(),'-3/2;0;6');
  await openNumber(page,516,'№ 516б');
  await submit(page,'√6/3');assert.match(await page.locator('#answer-form .feedback').innerText(),/второй корень/);
  await submit(page,'±sqrt(2/3)');
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p20-source-516-b'].independent),false);
  await openNumber(page,514,'№ 514в, округление');
  await submit(page,'-3.6;3.6');await submit(page,'±3,5');
  await openNumber(page,525,'№ 525');
  await submit(page,'2');assert.match(await page.locator('.quantity-model').innerText(),/12,806/);
  await submit(page,'16/√41');assert.match(await page.locator('.quantity-model').innerText(),/16 км/);
  await openNumber(page,528,'№ 528, дюймы');
  await submit(page,'20;15');
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p20-source-528-inch'].correct),true);
  await openNumber(page,519,'№ 519в');
  const drill=page.locator('[data-action=detour][data-skill=incomplete-quadratic]').first();
  await drill.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await drill.click();
  await page.waitForURL(/#practice\/incomplete-quadratic\/1$/);
  const initial=await page.locator('.prompt').innerText();
  await page.locator('[data-action=new]').first().click();
  assert.notEqual(await page.locator('.prompt').innerText(),initial);
  const returned=page.locator('[data-action=return]').first();await returned.click();
  assert.equal(await page.locator('.task-heading h2').innerText(),'№ 519в');
  assert.deepEqual(errors,[]);await page.close();
  return {width,cards:inventory.length,numbers:21};
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/school/makarychev8/';
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const views = [];
  for (const width of [320, 390, 1024]) views.push(await verify(width, url));
  console.log(JSON.stringify({ status: 'PASS', views }));
})().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.close();
});
