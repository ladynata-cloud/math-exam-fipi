'use strict';
// Printed pp. 164–165. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const fresh=async()=>{const p=await browser.newPage({viewport:{width,height:900}});p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));await p.goto(url);return p;};
  let page=await fresh();
  const cards=await page.evaluate(()=>{const lesson=MakarychevCourse.lessons.find(l=>l.id==='p30');
    return lesson.studyOrder.filter(i=>lesson.tasks[i].source.type==='textbook'||lesson.tasks[i].source.adaptation).map(i=>({i,title:lesson.tasks[i].title}));});
  assert.equal(cards.length,28);
  for(const [index,card] of cards.entries()){
    if(index&&index%8===0){await page.close();page=await fresh();}
    await page.evaluate(i=>{history.replaceState(null,'','#lesson/p30/'+i);MakarychevApp.route();},card.i);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await page.close();page=await fresh();
  await openNumber(page,697,'№ 697, построение');await page.locator('#final-answer').fill('4;1;0;1;4;9;1;3;9');
  assert.equal(await page.locator('[data-point-x]').count(),9);assert.equal(await page.locator('[data-root-curve]').count(),0);
  await page.locator('#answer-form button[type=submit]').click();assert.equal(await page.locator('[data-root-curve=line][stroke-dasharray]').count(),1);
  await openNumber(page,697,'№ 697, общие точки');await submit(page,'(-1;1),(3;8)');
  assert.equal(await page.locator('[data-point-x="3"]').getAttribute('data-point-y'),'8');
  await submit(page,'(3;9),(-1;1)');await page.reload();assert.equal(await page.locator('[data-point-x="3"]').getAttribute('data-point-y'),'9');
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p30-source-697-solutions'].independent),false);
  await openNumber(page,698,'№ 698б, эскиз');await submit(page,'12;9;8;9;12;8;11;12;11;8');
  assert.equal(await page.locator('[data-root-curve=quadratic]').count(),2);
  await page.close();page=await fresh();await openNumber(page,699,'№ 699, решения системы');
  await submit(page,'(-2;-3),(-2;3),(2;-3),(2;3)');assert.equal(await page.locator('[data-root-curve=vertical]').count(),2);
  assert.equal(await page.locator('[data-point-x]').count(),4);
  await openNumber(page,700,'№ 700д, построение');await submit(page,'(-0,5;-3),(-1/2;4)');
  assert.equal(await page.locator('[data-root-curve=vertical]').getAttribute('data-curve-h'),'-0.5');
  await openNumber(page,701,'№ 701в');await submit(page,'(2x+3y)/(3xy)');
  assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p30-source-701-c'].independent));
  await page.close();page=await fresh();await openNumber(page,698,'№ 698в, число решений');const drill=page.locator('[data-action=detour][data-skill=graphical-systems]').first();
  await drill.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await drill.click();
  const prior=await page.locator('.prompt').innerText();await page.locator('[data-action=new]').first().click();assert.notEqual(await page.locator('.prompt').innerText(),prior);
  await page.locator('[data-action=return]').first().click();assert.equal(await page.locator('.task-heading h2').innerText(),'№ 698в, число решений');
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
