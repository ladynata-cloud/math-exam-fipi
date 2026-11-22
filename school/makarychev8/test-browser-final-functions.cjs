'use strict';
// Printed pp. 253–254. Exercise the public course entry, model and saved learning on a clean browser profile.
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



async function verify(width,url,offline=false){
 const ctx=await browser.newContext({viewport:{width,height:820},offline}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.waitForFunction(()=>Boolean(window.MakarychevApp));
 const cards=require('./exercises-1131-1135.json');
 for(const card of cards){
  const n=Number(card.title.match(/\d+/)[0]);await openNumber(p,n,card.title);
  await p.locator('#task-graph svg').waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),card.title+' '+width);
  assert(!await p.evaluate(id=>window.MakarychevApp.getState().tasks[id]?.correct,card.id),card.title);
 }
 await openNumber(p,1131,'№ 1131а · построение');
 await submit(p,'(1;3), (2;3/2)');
 assert.match(await p.locator('#problem').innerText(),/одной ветви/);
 const record=()=>p.evaluate(()=>MakarychevApp.getState().tasks['p45-source-1131-plot-positive']);
 const wrong=await record();assert.equal(wrong.correct,false);
 await submit(p,'(-2;-3/2), (3/2;2)');assert.equal((await record()).correct,true);
 assert.equal(await p.locator('#task-graph [data-root-curve=hyperbola]').count(),1);
 await openNumber(p,1133,'№ 1133б');await submit(p,'(-∞;1)');
 assert.match(await p.locator('#problem').innerText(),/попал нуль/);
 await submit(p,'(-∞;0) ∪ (1;+∞)');assert.equal(await p.locator('#task-graph [data-axis-end=open]').count(),2);
 await openNumber(p,1135,'№ 1135');await p.locator('[data-action=guided]').click();
 for(const [i,a] of ['[0,5;+∞)','(-∞;15)'].entries()){
  await p.locator('#step-answer-'+i).fill(a);await p.locator('[data-step-form="'+i+'"] .answer-controls button').first().click();
 }
 await submit(p,'[1/2;15)');assert.equal(await p.locator('#task-graph [data-axis-end=closed]').count(),2);
 await p.reload();await p.waitForFunction(()=>MakarychevApp.getState().tasks['p45-source-1135-intersection']?.correct);
 for(const card of require('./exercises-1136.json')){
  await openNumber(p,1136,card.title);
  const svg=p.locator('#task-graph svg');
  assert.equal(await svg.locator('[data-surd-area]').count(),0);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1136,'№ 1136г');
 await p.locator('[data-action=choice][data-choice="0"]').click();
 await p.locator('#answer-form button[type=submit]').click();
 assert.match(await p.locator('#problem').innerText(),/отрицательны/);
 await p.locator('[data-action=guided]').click();
 for(const [i,val] of ['4','20','23'].entries()){
  await p.locator('#step-answer-'+i).fill(val);await p.locator('[data-step-form="'+i+'"] .answer-controls button').first().click();
 }
 await p.locator('[data-action=choice][data-choice="2"]').click();await p.locator('#answer-form button[type=submit]').click();
 await p.reload();await p.waitForFunction(()=>MakarychevApp.getState().tasks['p45-source-1136-g']?.correct);
 assert.deepEqual(await p.locator('#task-graph [data-surd-area]').evaluateAll(nodes=>nodes.map(n=>n.dataset.surdArea)),['20','23']);
 assert.deepEqual(errors,[]);await ctx.close();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const url='http://127.0.0.1:'+server.address().port+'/school/makarychev8/';
  for(const w of [320,390,1024])await verify(w,url);
  const offline=path.join(root,'downloads/trainers/makarychev8-algebra/makarychev8-algebra.html');
  await verify(320,require('node:url').pathToFileURL(offline).href,true);
  console.log('PASS source 1131–1136 on 320/390/1024px and 320px offline; distinct error feedback, both branches restored inequality intersection and two signed radical remainders.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
