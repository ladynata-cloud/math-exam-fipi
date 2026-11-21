'use strict';
// Printed pp. 218–221. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const cards=await page.evaluate(()=>MakarychevCourse.lessons.flatMap(l=>l.tasks.map((t,i)=>({l:l.id,i,title:t.title,section:t.source.section,ref:t.source.reference}))).filter(t=>/^№\s*(97[3-9]|98\d|990)(?:$|[^0-9])/.test(t.ref)));
  assert.equal(cards.length,78);
  for(const [index,card] of cards.entries()){
    if(index&&index%5===0){await page.close();page=await fresh();}
    await page.evaluate(({l,i})=>{history.replaceState(null,'','#lesson/'+l+'/'+i);MakarychevApp.route();},card);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);assert.match(await page.locator('.source-note').first().textContent(),/21[89]|22[01]/);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await page.close();page=await fresh();await openNumber(page,983,'№ 983а');
  const id='p40-source-983-a';assert(!(await page.evaluate(k=>MakarychevApp.getState().tasks[k].correct,id)));await page.locator('[data-action=guided]').click();
  await page.locator('#step-answer-0').fill('11');assert.equal(await page.locator('[data-system-hole=yes]').count(),1);
  await page.locator('[data-step-form="0"] .answer-controls button').first().click();await page.locator('#step-answer-1').fill('x≥-6');await page.locator('[data-step-form="1"] .answer-controls button').first().click();
  await page.locator('#step-answer-2').fill('2,5≤x');assert.equal(await page.locator('[data-axis-row]').count(),2);
  await submit(page,'[5/2;+∞)');assert.match(await page.locator('#problem').innerText(),/корни в знаменателе равны/i);
  await submit(page,'[5/2;11)∪(11;+∞)');await page.reload();assert.equal(await page.locator('[data-axis-row]').count(),3);
  assert(await page.evaluate(k=>MakarychevApp.getState().tasks[k].correct&&!MakarychevApp.getState().tasks[k].independent,id));assert.equal(await page.locator('[data-system-hole=yes]').count(),1);
  await page.close();page=await fresh();await openNumber(page,977,'№ 977в, два примера');await submit(page,'1/5;1/4');assert.match(await page.locator('#problem').innerText(),/нарушает строку 2/i);await submit(page,'7/30;13/60');assert.equal(await page.locator('[data-system-example=yes]').count(),2);
  assert.deepEqual(errors,[]);await page.close();return {width,cards:cards.length};
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/school/makarychev8/';
  const views = [];
  const widths=process.env.M8_VIEWPORT?[Number(process.env.M8_VIEWPORT)]:[320,390,1024];
  for(const width of widths){
    assert([320,390,1024].includes(width));
    browser = await chromium.launch({ headless:true, args:['--disable-dev-shm-usage','--renderer-process-limit=2','--js-flags=--max-old-space-size=200'], ...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}) });
    try { views.push(await verify(width,url)); } finally { await browser.close();browser=null; }
  }
  console.log(JSON.stringify({ status: 'PASS', views }));
})().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.close();
});
