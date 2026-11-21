'use strict';
// Printed pp. 214–215. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const cards=await page.evaluate(()=>MakarychevCourse.lessons.flatMap(l=>l.tasks.map((t,i)=>({l:l.id,i,title:t.title,section:t.source.section}))).filter(t=>/^№\s*(95[6-9]|96\d|97[0-2])(?:$|[^0-9])/.test(t.title)));
  assert.equal(cards.length,30);
  for(const [index,card] of cards.entries()){
    if(index&&index%4===0){await page.close();page=await fresh();}
    await page.evaluate(({l,i})=>{history.replaceState(null,'','#lesson/'+l+'/'+i);MakarychevApp.route();},card);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);
    assert.match(await page.locator('.source-note').first().textContent(),/21[45]/);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await page.close();page=await fresh();
  await openNumber(page,963,'№ 963');const id='p39-source-963-parameters';
  assert(!(await page.evaluate(k=>MakarychevApp.getState().tasks[k].correct,id)));await page.locator('[data-action=guided]').click();
  await page.locator('#step-answer-0').fill('4');assert.equal(await page.locator('[data-parameter-roots="1"]').count(),1);
  await page.locator('#step-answer-0').fill('5');assert.equal(await page.locator('[data-parameter-roots="2"]').count(),1);
  await submit(page,'(4/3;+∞)');assert.match(await page.locator('#problem').innerText(),/исчезает квадратный член/i);await submit(page,'(4/3;4)∪(4;+∞)');
  assert(await page.evaluate(k=>MakarychevApp.getState().tasks[k].correct,id));await page.reload();assert.equal(await page.locator('[data-axis-end=open]').count(),3);
  await page.close();page=await fresh();await openNumber(page,971,'№ 971');assert.equal(await page.locator('[data-root-curve]').count(),2);await submit(page,'2.1');assert.equal(await page.locator('[data-cube-probe=different]').count(),1);await submit(page,'2.29');assert.equal(await page.locator('[data-cube-probe=matching]').count(),1);
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
