'use strict';
// Printed pp. 245–246. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const cards=await page.evaluate(()=>MakarychevCourse.lessons.flatMap(l=>l.tasks.map((t,i)=>({l:l.id,i,title:t.title,section:t.source.section,ref:t.source.reference}))).filter(t=>/^№\s*(109[7-9])(?:$|[^0-9])/.test(t.ref)));
  assert.equal(cards.length,10);
  for(const [index,card] of cards.entries()){
    if(index&&index%5===0){await page.close();page=await fresh();}
    await page.evaluate(({l,i})=>{history.replaceState(null,'','#lesson/'+l+'/'+i);MakarychevApp.route();},card);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);assert.match(await page.locator('.source-note').first().textContent(),/24[56]/);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await page.close();page=await fresh();
  await openNumber(page,1097,'№ 1097а');const id='p43-source-1097-rise';
  assert(!(await page.evaluate(k=>MakarychevApp.getState().tasks[k].correct,id)));
  await page.locator('[data-action=guided]').click();await page.locator('#step-answer-0').fill('3');
  assert.equal(await page.locator('[data-phase-probe="2.5"]').count(),1);
  await submit(page,'(0;6)');assert.match(await page.locator('#problem').innerText(),/квадратными скобками/);
  await submit(page,'[0;6]');await page.reload();assert.equal(await page.locator('#final-answer').inputValue(),'[0;6]');
  assert.equal(await page.locator('[data-phase-probe="2.5"]').count(),1);
  await page.close();page=await fresh();await openNumber(page,1098,'№ 1098, максимум');
  await submit(page,'28');assert.match(await page.locator('#problem').innerText(),/горизонтальной оси/);await submit(page,'100');
  await page.close();page=await fresh();await openNumber(page,1099,'№ 1099, (4;10)');
  await page.locator('[data-action=guided]').click();await page.locator('#step-answer-0').fill('7');assert.equal(await page.locator('[data-phase-probe="0"]').count(),1);
  await page.getByRole('button',{name:'лёд таял',exact:true}).click();await page.locator('#answer-form button[type=submit]').click();
  assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p43-source-1099-melt'].correct));
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
