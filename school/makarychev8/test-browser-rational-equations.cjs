'use strict';
// Printed pp. 148–151. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const cards=await page.evaluate(()=>{const lesson=MakarychevCourse.lessons.find(l=>l.id==='p26');
    return lesson.studyOrder.filter(i=>lesson.tasks[i].source.type==='textbook'||lesson.tasks[i].source.adaptation).map(i=>({i,title:lesson.tasks[i].title}));});
  assert.equal(cards.length,84);
  for(const [index,card] of cards.entries()){
    if(index&&index%8===0){await page.close();page=await fresh();}
    await page.evaluate(i=>{history.replaceState(null,'','#lesson/p26/'+i);MakarychevApp.route();},card.i);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await page.close();page=await fresh();
  await openNumber(page,631,'№ 631в');await submit(page,'2;1,5');
  assert.equal(await page.locator('[data-candidate-status=excluded]').count(),1);
  assert.equal(await page.locator('[data-candidate-status=correct]').count(),1);
  assert.match(await page.locator('#answer-form .feedback').innerText(),/знаменателей/);
  await submit(page,'3/2');await page.reload();assert.equal(await page.locator('[data-candidate-status=correct]').count(),1);
  await openNumber(page,635,'№ 635б, y = −5');await submit(page,'нет');
  await openNumber(page,641,'№ 641а');await submit(page,'±sqrt(2)');
  await openNumber(page,641,'№ 641, взаимопроверка');await submit(page,'3;7/3;24/7;1;2;5/2');
  await page.close();page=await fresh();
  await openNumber(page,642,'№ 642а, построение');await page.locator('#final-answer').fill('-2;-6;6;2;-3;-1;1;3');
  assert.equal(await page.locator('[data-point-x]').count(),8);assert.equal(await page.locator('[data-root-curve]').count(),0);
  await page.locator('#answer-form button[type=submit]').click();assert.equal(await page.locator('[data-root-curve=hyperbola]').count(),1);
  assert.equal(await page.locator('[data-root-curve=line][stroke-dasharray]').count(),1);
  await openNumber(page,642,'№ 642б, корни по графику');await submit(page,'1,3;4,7');
  await openNumber(page,643,'№ 643, пример с 1 корнями');
  await page.locator('#final-answer').fill('0;3/2');assert.equal(await page.locator('#task-graph [data-point-x]').count(),0);
  await page.locator('#answer-form button[type=submit]').click();
  assert.equal(await page.locator('#task-graph [data-point-x]').count(),1);
  await openNumber(page,643,'№ 643, пример с 2 корнями');await submit(page,'-1;1');assert.equal(await page.locator('#task-graph [data-point-x]').count(),0);
  await submit(page,'-1;3');assert.equal(await page.locator('#task-graph [data-point-x]').count(),2);
  await page.close();page=await fresh();
  await openNumber(page,646,'№ 646б');await submit(page,'sqrt(y)');
  await openNumber(page,636,'№ 636в');
  const drill=page.locator('[data-action=detour][data-skill=rational-equation]').first();
  await drill.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await drill.click();
  const prior=await page.locator('.prompt').innerText();await page.locator('[data-action=new]').first().click();assert.notEqual(await page.locator('.prompt').innerText(),prior);
  await page.locator('[data-action=return]').first().click();assert.equal(await page.locator('.task-heading h2').innerText(),'№ 636в');
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
