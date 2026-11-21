'use strict';
// Printed pp. 144–145. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const cards=await page.evaluate(()=>{const lesson=MakarychevCourse.lessons.find(l=>l.id==='p25');
    return lesson.studyOrder.filter(i=>lesson.tasks[i].source.type==='textbook'||lesson.tasks[i].source.adaptation).map(i=>({i,title:lesson.tasks[i].title}));});
  assert.equal(cards.length,48);
  for(const [index,card] of cards.entries()){
    if(index&&index%16===0){await page.close();page=await fresh();}
    await page.evaluate(i=>{history.replaceState(null,'','#lesson/p25/'+i);MakarychevApp.route();},card.i);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await page.close();page=await fresh();
  await openNumber(page,617,'№ 617в');await submit(page,'(x+1)(x+2)/6');
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p25-source-617-c'].independent),true);
  await openNumber(page,618,'№ 618а');await submit(page,'(2x-1)^2/2');
  await openNumber(page,623,'№ 623');await submit(page,'3;6;9;3(x+1)(x+2)');
  assert.match(await page.locator('#answer-form .feedback').innerText(),/дискриминант отрицателен/);
  assert.equal(await page.locator('[data-example-discriminant]').getAttribute('data-example-discriminant'),'-72');
  await page.locator('#final-answer').fill('6;9;3;3(2x+1)(x+1)');await page.locator('#answer-form button[type=submit]').click();
  assert.equal(await page.locator('[data-example-discriminant]').getAttribute('data-example-discriminant'),'9');
  assert.equal(await page.locator('#task-graph [data-point-x]').count(),2);
  await page.reload();assert.equal(await page.locator('[data-example-discriminant]').getAttribute('data-example-discriminant'),'9');
  await openNumber(page,624,'№ 624е');await submit(page,'(-x-6)/(x+5)');
  await openNumber(page,626,'№ 626а');await submit(page,'-0,3;-0,93;-0,993');
  await openNumber(page,627,'№ 627, первая функция');await submit(page,'1;-4;нет');assert.equal(await page.locator('#task-graph [data-hole-x]').count(),0);
  await openNumber(page,627,'№ 627, вторая функция');await submit(page,'1;-4;2');assert.equal(await page.locator('[data-hole-x="2"][data-hole-y="-2"]').count(),1);
  await openNumber(page,629,'№ 629б');await submit(page,'2(2a-b)(a^2-b^2)');
  assert.match(await page.locator('#answer-form .feedback').innerText(),/трёх линейных/);
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p25-source-629-b'].attempts),0);
  await submit(page,'2(a+b)(a-b)(2a-b)');assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p25-source-629-b'].independent));
  await openNumber(page,619,'№ 619в');
  const drill=page.locator('[data-action=detour][data-skill=trinomial-factors]').first();
  await drill.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await drill.click();
  const prior=await page.locator('.prompt').innerText();await page.locator('[data-action=new]').first().click();
  assert.notEqual(await page.locator('.prompt').innerText(),prior);await page.locator('[data-action=return]').first().click();
  assert.equal(await page.locator('.task-heading h2').innerText(),'№ 619в');
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
