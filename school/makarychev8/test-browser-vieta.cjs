'use strict';
// Printed pp. 135–136. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  const cards=await page.evaluate(()=>{const lesson=MakarychevCourse.lessons.find(l=>l.id==='p23');
    return lesson.studyOrder.filter(i=>lesson.tasks[i].source.type==='textbook').map(i=>({i,title:lesson.tasks[i].title}));});
  assert.equal(cards.length,65);
  for(const [index,card] of cards.entries()){
    if(index&&index%16===0){await page.close();page=await fresh();}
    await page.evaluate(i=>{history.replaceState(null,'','#lesson/p23/'+i);MakarychevApp.route();},card.i);
    assert.equal(await page.locator('.task-heading h2').innerText(),card.title);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title);
  }
  await page.close();page=await fresh();
  await openNumber(page,578,'№ 578д');await page.locator('#final-answer').fill('-4,5;-5');
  assert.equal(await page.locator('[data-vieta-relation]').count(),0);
  await page.locator('#answer-form button[type=submit]').click();
  const relation=key=>page.locator('[data-vieta-relation='+key+']');
  assert.equal(await relation('product').getAttribute('data-match'),'true');
  assert.equal(await relation('sum').getAttribute('data-match'),'false');
  await submit(page,'9/2;-5');assert.equal(await relation('sum').getAttribute('data-match'),'true');
  await page.reload();assert.equal(await relation('sum').getAttribute('data-match'),'true');
  await openNumber(page,579,'№ 579а');await submit(page,'1±sqrt(10)');
  await openNumber(page,579,'№ 579а, проверка Виета');await submit(page,'2;-9');
  await openNumber(page,592,'№ 592а');await submit(page,'3;1;2');
  await openNumber(page,593,'№ 593б');
  await page.getByRole('button',{name:'m = 11',exact:true}).click();await page.locator('#answer-form button[type=submit]').click();
  await page.getByRole('button',{name:'Подходящего m нет',exact:true}).click();await page.locator('#answer-form button[type=submit]').click();
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p23-source-593-b'].independent),false);
  await openNumber(page,593,'№ 593, сверка пары');await submit(page,'45;-19');
  await openNumber(page,594,'№ 594д');
  await page.getByRole('button',{name:'любое действительное x',exact:true}).click();await page.locator('#answer-form button[type=submit]').click();
  assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p23-source-594-e'].correct));
  await openNumber(page,597,'№ 597');assert.equal(await page.locator('#task-graph svg text').filter({hasText:'34 см'}).count(),1);
  await submit(page,'30;16');await openNumber(page,586,'№ 586');
  const drill=page.locator('[data-action=detour][data-skill=vieta-roots]').first();
  await drill.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await drill.click();
  const prior=await page.locator('.prompt').innerText();await page.locator('[data-action=new]').first().click();
  assert.notEqual(await page.locator('.prompt').innerText(),prior);await page.locator('[data-action=return]').first().click();
  assert.equal(await page.locator('.task-heading h2').innerText(),'№ 586');
  await page.close();page=await fresh();await openNumber(page,591,'№ 591, правило');
  await submit(page,'4;2;1;3');
  assert.match(await page.locator('#problem').innerText(),/Утверждение №4 опирается.*Условия существования/s);
  const after=await page.evaluate(()=>MakarychevApp.getState().tasks['p23-source-591-rule']);
  assert.equal(after.attempts,1);assert(!after.correct&&!after.assisted&&!after.hint);
  await submit(page,'5;2;4;1');assert.match(await page.locator('#problem').innerText(),/Утверждение №5 не следует/);
  await submit(page,'2;4;1;3');await page.reload();
  assert(await page.evaluate(()=>MakarychevApp.getState().tasks['p23-source-591-rule'].correct));
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
