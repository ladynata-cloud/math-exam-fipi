'use strict';
// Printed pp. 125–128. Exercise the public course entry, model and saved learning on a clean browser profile.
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
  async function fresh(){
    const p=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.goto(url);return p;
  }
  let page=await fresh();
  const inventory=await page.evaluate(()=>{
    const l=MakarychevCourse.lessons.find(l=>l.id==='p21');
    return l.studyOrder.filter(i=>l.tasks[i].source.type==='textbook')
      .map(i=>({index:i,title:l.tasks[i].title,ref:l.tasks[i].source.reference}));
  });
  assert.equal(inventory.length,134);assert.equal(new Set(inventory.map(x=>x.index)).size,134);
  for(const [offset,q] of inventory.entries()){
    if(offset&&offset%16===0){await page.close();page=await fresh();}
    await page.evaluate(i=>{history.replaceState(null,'','#lesson/p21/'+i);MakarychevApp.route();},q.index);
    assert.equal(await page.locator('.task-heading h2').innerText(),q.title);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,q.ref);
  }
  await page.close();page=await fresh();
  for(let n=531;n<=556;n++){
    await openNumber(page,n);assert(await page.locator('#number-result a.button:not(.quiet)').count()>0);
  }
  await page.close();page=await fresh();
  await openNumber(page,531,'№ 531б');
  assert.equal(await page.locator('#task-graph svg').count(),0);
  await submit(page,'15;2');
  assert.equal(await page.locator('#task-graph [data-root-curve="quadratic"]').count(),1);
  assert.match(await page.locator('#task-graph').innerText(),/D = -15/);
  await submit(page,'-15;0');
  await openNumber(page,533,'№ 533б');
  await submit(page,'(3-sqrt(29))/2');assert.match(await page.locator('#answer-form .feedback').innerText(),/Одно решение найдено/);
  await submit(page,'(3±sqrt(29))/2');
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p21-source-533-b'].independent),false);
  await openNumber(page,546,'№ 546а, построение');
  await page.locator('#final-answer').fill('1;0;4;-1;1;5');
  assert.equal(await page.locator('#task-graph [data-point-x]').count(),6);
  assert.equal(await page.locator('#task-graph [data-root-curve]').count(),0);
  await page.locator('#answer-form button[type=submit]').click();
  assert.equal(await page.locator('#task-graph [data-root-curve]').count(),2);
  assert.equal(await page.locator('#task-graph [data-root-curve=line]').getAttribute('stroke-dasharray'),'7 4');
  assert.match(await page.locator('#task-graph').innerText(),/штриховая/);
  await page.reload();assert.equal(await page.locator('#task-graph [data-root-curve]').count(),2);
  await openNumber(page,546,'№ 546б, оценка по графику');await submit(page,'0,6;3,4');
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p21-source-546-b-estimate'].correct),true);
  await page.close();page=await fresh();
  await openNumber(page,552,'№ 552, доказательство');await submit(page,'3;2;4');
  assert.match(await page.locator('#answer-form .feedback').innerText(),/звено 2/);
  await submit(page,'3;1;2;4');
  await openNumber(page,553,'№ 553в, пример');await submit(page,'-0,5');
  assert.equal(await page.locator('#task-graph [data-point-x]').count(),2);
  await openNumber(page,555,'№ 555б');await submit(page,'2+3√20/2');
  assert.match(await page.locator('#answer-form .feedback').innerText(),/Значение верно/);
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p21-source-555-b'].attempts),0);
  await submit(page,'3sqrt(5)+2');
  assert.equal(await page.evaluate(()=>MakarychevApp.getState().tasks['p21-source-555-b'].independent),true);
  await page.close();page=await fresh();
  await openNumber(page,556,'№ 556в');await submit(page,'-3;-6');
  assert.match(await page.locator('#task-graph').innerText(),/Ордината|отличается/);
  await submit(page,'-3;-7');
  await openNumber(page,537,'№ 537ж');
  const drill=page.locator('[data-action=detour][data-skill=quadratic-formula]').first();
  await drill.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await drill.click();
  const prior=await page.locator('.prompt').innerText();await page.locator('[data-action=new]').first().click();
  assert.notEqual(await page.locator('.prompt').innerText(),prior);
  await page.locator('[data-action=return]').first().click();assert.equal(await page.locator('.task-heading h2').innerText(),'№ 537ж');
  assert.deepEqual(errors,[]);await page.close();return {width,cards:inventory.length,numbers:26};
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
