'use strict';
// Printed pp. 253–257. Exercise the public course entry, model and saved learning on a clean browser profile.
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
 for(const card of require('./exercises-1137-1143.json')){
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);
  await p.locator('#task-graph svg').waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1138,'№ 1138 · −8/9');await submit(p,'-8/9');
 assert.match(await p.locator('#problem').innerText(),/расстояние.*отрицательным/);
 await submit(p,'1/9');
 await openNumber(p,1143,'№ 1143');await submit(p,'(-2;0), (-1;-1) | []');assert.match(await p.locator('#problem').innerText(),/пустым/);
 await submit(p,'(-2;0), (-1;-1) | [)');
 assert.equal(await p.locator('#task-graph [data-floor-piece=completed][data-floor-end=open]').count(),3);
 await p.reload();await p.waitForFunction(()=>MakarychevApp.getState().tasks['p46-source-1143-saw']?.correct);
 assert.equal(await p.locator('#task-graph [data-floor-piece=own][data-floor-end=closed]').count(),1);
 for(const card of require('./exercises-1144-1146.json')){
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);await p.locator('#task-graph svg').waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1144,'№ 1144в');await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('-1');
 await p.locator('[data-compound-trial=excluded]').waitFor();assert.match(await p.locator('[data-compound-trial]').innerText(),/Внешний знаменатель: 0/);
 await submit(p,'x ≠ -1');assert.match(await p.locator('#problem').innerText(),/внутреннюю дробь/);
 await submit(p,'x ≠ -1 и x ≠ 0');await p.reload();await p.locator('[data-compound-trial=excluded]').waitFor();
 await openNumber(p,1146,'№ 1146 · значения');await p.locator('[data-action=guided]').click();
 await p.locator('#step-answer-0').fill('5');await p.locator('[data-section-trial=outside]').waitFor();
 await p.locator('#step-answer-0').fill('8/3');await p.locator('[data-section-trial="4"]').waitFor();
 await submit(p,'[0;4]');assert.match(await p.locator('#problem').innerText(),/совпадает с основанием/);
 await submit(p,'[0;6]');await p.reload();await p.locator('[data-section-trial="4"]').waitFor();
 for(const card of require('./exercises-1147-1149.json')){
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);await p.locator('#task-graph svg').waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1148,'№ 1148 · график');await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('8');
 await p.locator('[data-river-distance="96"]').waitFor();assert.match(await p.locator('[data-river-distance]').innerText(),/24 км от A/);
 await submit(p,'(0;0), (3;60), (5;60), (10;0)');assert.match(await p.locator('#problem').innerText(),/накопил оба перехода/);
 await submit(p,'(0;0), (3;60), (5;60), (10;120)');await p.reload();await p.locator('[data-route-knots=valid]').waitFor();
 await openNumber(p,1149,'№ 1149 · свой график');await submit(p,'(-3;2), (0;');
 assert.equal(await p.evaluate(()=>MakarychevApp.getState().tasks['p42-source-1149-build'].attempts),0);
 await submit(p,'(-3;2), (0;6), (4;1)');assert.match(await p.locator('#problem').innerText(),/обеих крайних высот/);
 await submit(p,'(-3;2),(-1;6),(2;0),(4;3)');await p.reload();await p.locator('[data-route-knots=valid]').waitFor();
 assert.equal(await p.locator('#task-graph [data-point-x]').count(),4);
 for(const card of require('./exercises-1150-1153.json')){
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);await p.locator('#task-graph svg').waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1150,'№ 1150б');await submit(p,'16');assert.match(await p.locator('#problem').innerText(),/знаменатель равен нулю/);
 await submit(p,'нет');await p.reload();await p.waitForFunction(()=>MakarychevApp.getState().tasks['p42-source-1150-b']?.correct);
 await openNumber(p,1152,'№ 1152');await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('-2;3');await p.locator('[data-monotone-sample="3"]').waitFor();
 await submit(p,'3;2;1');assert.match(await p.locator('#problem').innerText(),/не обещает пересечения/);
 await submit(p,'3;2;4');await p.reload();await p.locator('[data-monotone-sample="-2"]').waitFor();await p.locator('[data-monotone-sample="3"]').waitFor();
 assert(await p.locator('#task-graph svg text').evaluateAll(labels=>labels.every(t=>t.getBBox().x>=0)), 'All negative fractional tick labels fit the SVG');
 for(const card of require('./exercises-1154-1157.json')){
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);await p.locator('#task-graph svg').first().waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1155,'№ 1155');await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('2');
 await p.locator('[data-sign-probe=outside]').waitFor();assert.equal(await p.locator('#task-graph [data-point-x="1"][data-point-y="0"]').count(),1);assert(await p.locator('#task-graph svg text').evaluateAll(labels=>labels.every(t=>t.getBBox().x>=0)));
 await p.locator('#step-answer-0').fill('-3');await p.locator('[data-sign-probe=positive]').waitFor();
 await openNumber(p,1156,'№ 1156');assert.equal(await p.locator('#task-graph [data-source-gallery]').count(),3);
 await submit(p,'1');assert.match(await p.locator('#problem').innerText(),/координаты вершины/);await submit(p,'2');
 await openNumber(p,1157,'№ 1157 · график');await submit(p,'(-1;-6), (3;2)');assert.match(await p.locator('#problem').innerText(),/ордината должна быть положительна/);
 await submit(p,'(-4;3/2), (3;2)');await p.reload();await p.locator('[data-absolute-points=valid]').waitFor();
 assert.equal(await p.locator('#task-graph [data-root-curve=absolute-reciprocal]').count(),1);
 assert.deepEqual(errors,[]);await ctx.close();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const url='http://127.0.0.1:'+server.address().port+'/school/makarychev8/';
  for(const w of [320,390,1024])await verify(w,url);
  const offline=path.join(root,'downloads/trainers/makarychev8-algebra/makarychev8-algebra.html');
  await verify(320,require('node:url').pathToFileURL(offline).href,true);
  console.log('PASS source 1131–1157 on 320/390/1024px and 320px offline; distinct error feedback, both branches restored inequality intersection and two signed radical remainders.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
