'use strict';
// Printed pp. 253–260. Exercise the public course entry, model and saved learning on a clean browser profile.
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
 for (const card of require('./exercises-1158-1160.json')) {
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);
  await p.locator('#task-graph svg').first().waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1158,'№ 1158а');await submit(p,'y=');
 assert.equal(await p.evaluate(()=>MakarychevApp.getState().tasks['p44-source-1158-a'].attempts),0);
 await submit(p,'y=3,5x-7');assert.match(await p.locator('#problem').innerText(),/ту же прямую/);
 await submit(p,'y=3,5x+1');assert.match(await p.locator('#problem').innerText(),/нет точки пересечения/);
 await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('-2');await p.locator('[data-source-line-trial="-2"]').waitFor();
 assert.match(await p.locator('[data-source-line-trial]').innerText(),/y = -14/);
 await submit(p,'y=2x-10');await p.reload();await p.locator('[data-line-intersection=valid]').waitFor();
 assert.equal(await p.locator('#task-graph [data-root-curve=line]').count(),2);
 assert(await p.locator('#task-graph [data-point-x="-2"][data-point-y="-14"]').count()>=1);
 await openNumber(p,1159,'№ 1159б');await submit(p,'y=-2x+8');assert.match(await p.locator('#problem').innerText(),/координаты заданной точки/);
 await submit(p,'y=-2x-8');await openNumber(p,1160,'№ 1160а');
 await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('2');await p.locator('[data-slope-mode="горизонтальна"]').waitFor();
 await submit(p,'[2;+∞)');assert.match(await p.locator('#problem').innerText(),/нулевой.*горизонтальна/);
 await submit(p,'a>2');await p.reload();await p.locator('[data-slope-mode="горизонтальна"]').waitFor();
 assert(await p.evaluate(()=>MakarychevApp.getState().tasks['p44-source-1160-a'].correct));
 for(const card of require('./exercises-1161-1163.json')){
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);await p.locator('#task-graph svg').first().waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1161,'№ 1161');await submit(p,'-5;0');assert.equal(await p.evaluate(()=>MakarychevApp.getState().tasks['p45-source-1161-order'].attempts),0);
 await submit(p,'1;0;0,5;0,7;-5');assert.match(await p.locator('#problem').innerText(),/соседних ординат/);
 await submit(p,'-5;0;1/2;7/10;1');
 await openNumber(p,1162,'№ 1162 · y = 4x − 5');await p.locator('[data-action=guided]').click();
 await p.locator('#step-answer-0').fill('-1');await p.locator('[data-root-line-position=outside]').waitFor();
 await p.locator('#step-answer-0').fill('25/16');await p.locator('[data-root-line-position=equal]').waitFor();
 assert(await p.locator('#task-graph [data-point-x="1.5625"][data-point-y="1.25"]').count()>=1);
 await openNumber(p,1163,'№ 1163 · график');await submit(p,'(-3/4;-4/3),(1;1)');assert.match(await p.locator('#problem').innerText(),/выколотую точку/);
 await submit(p,'(-1/2;-2),(5;1/5)');await p.reload();await p.locator('[data-punctured-plot=valid]').waitFor();assert.equal(await p.locator('[data-hole-x="-0.75"]').count(),1);
 await openNumber(p,1163,'№ 1163 · параметр');await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('1');await p.locator('[data-punctured-count="2"]').waitFor();
 await submit(p,'1');assert.match(await p.locator('#problem').innerText(),/остались две точки/);
 await p.locator('#step-answer-0').fill('16/9');await p.locator('[data-punctured-count="1"]').waitFor();await submit(p,'16/9');
 await p.reload();await p.locator('[data-punctured-count="1"]').waitFor();assert.equal(await p.locator('[data-hole-x="-0.75"]').count(),1);assert.equal(await p.locator('[data-point-x="0.75"]').count(),1);
 for(const card of require('./exercises-1164.json')){
  await openNumber(p,1164,card.title);await p.locator('#task-graph svg').first().waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1164,'№ 1164а · график');await submit(p,'(0;0),(1;1) | (1;1),(4;2)');assert.match(await p.locator('#problem').innerText(),/стыка относится к первой строке/);
 await submit(p,'(0;0),(-1/2;1/4) | (9/4;3/2),(4;2)');await p.locator('[data-piecewise-marks=valid]').waitFor();assert.equal(await p.locator('[data-root-curve=piecewise-half]').count(),2);
 await openNumber(p,1164,'№ 1164б · график');await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('4');await p.locator('[data-piecewise-trial=outside]').waitFor();
 await p.locator('#step-answer-0').fill('2');await p.locator('[data-piecewise-trial=left]').waitFor();
 await p.locator('#step-answer-0').fill('5/2');await p.locator('[data-piecewise-trial=right]').waitFor();assert.match(await p.locator('[data-piecewise-trial=right]').innerText(),/равна 0/);
 await submit(p,'(0;1),(1;0) | (9/4;1/2),(3;-1)');await p.reload();await p.locator('[data-piecewise-marks=valid]').waitFor();
 assert.equal(await p.locator('[data-piecewise-boundary="2"]').count(),1);assert.equal(await p.locator('[data-piecewise-boundary="3"]').count(),1);
 await openNumber(p,1164,'№ 1164б · значения');await submit(p,'[0;+∞)');assert.match(await p.locator('#problem').innerText(),/последней точке/);await submit(p,'[-1;+∞)');
 await openNumber(p,1164,'№ 1164б · убывание');await submit(p,'(-∞;1]');assert.match(await p.locator('#problem').innerText(),/вершину и стык/);await submit(p,'(-∞;1]∪[2;3]');await p.reload();assert(await p.evaluate(()=>MakarychevApp.getState().tasks['p45-source-1164-b-decrease'].correct));
 for(const card of require('./exercises-1165-1166.json')){
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);await p.locator('#task-graph svg').first().waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1165,'№ 1165');await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('0');await p.locator('[data-root-reciprocal=zero]').waitFor();
 await p.locator('#step-answer-0').fill('1,55');await p.locator('[data-root-reciprocal=below]').waitFor();await p.locator('#step-answer-0').fill('1,65');await p.locator('[data-root-reciprocal=above]').waitFor();
 await submit(p,'1,58');assert.match(await p.locator('#problem').innerText(),/округли абсциссу/);await submit(p,'1,6');await p.reload();await p.locator('[data-crossing-zoom]').waitFor();
 await openNumber(p,1166,'№ 1166 · графики');await submit(p,'1/4;1/4;1/16;1/64');assert.equal(await p.evaluate(()=>MakarychevApp.getState().tasks['p45-source-1166-draw'].attempts),0);
 await submit(p,'1/4;1/4;1/16;1/64;-1/2');assert.match(await p.locator('#problem').innerText(),/квадратного корня/);
 await submit(p,'9/4;9/4;81/16;729/64;3/2');await p.reload();await p.locator('[data-four-marks=valid]').waitFor();assert.equal(await p.locator('#task-graph [data-root-curve]').count(),4);
 await openNumber(p,1166,'№ 1166в');await submit(p,'x^2;x^3;x;√x');assert.match(await p.locator('#problem').innerText(),/снизу вверх/);
 await submit(p,'(0,37)³;(0,37)²;0,37;√0,37');await p.reload();assert(await p.evaluate(()=>MakarychevApp.getState().tasks['p45-source-1166-c'].correct));
 for(const card of require('./exercises-1167-1169.json')){
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);await p.locator('#task-graph svg').first().waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1167,'№ 1167 · корень · знак');await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('-1');await p.locator('[data-elementary-trial=outside]').waitFor();
 await submit(p,'(0;+∞)');assert.equal(await p.evaluate(()=>MakarychevApp.getState().tasks['p45-source-1167-sqrt-sign'].attempts),0);
 await submit(p,'(0;+∞)|(-∞;0)');assert.match(await p.locator('#problem').innerText(),/строго ниже оси/);await submit(p,'x>0|∅');
 await openNumber(p,1167,'№ 1167 · куб · изменение');await submit(p,'x>0|∅');assert.match(await p.locator('#problem').innerText(),/возрастает слева направо/);await submit(p,'(-∞;+∞)|∅');
 await openNumber(p,1168,'№ 1168');await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('0');await p.locator('[data-elementary-trial=outside]').waitFor();assert.match(await p.locator('[data-elementary-trial=outside]').innerText(),/прямая проходит/i);
 await openNumber(p,1169,'№ 1169б');await submit(p,'1;2');assert.match(await p.locator('#problem').innerText(),/15 вместо -20/);
 await submit(p,'2');assert.match(await p.locator('#problem').innerText(),/оставшиеся без отметки/);
 await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('-2/5');await p.locator('[data-elementary-trial="-2/5"]').waitFor();assert.match(await p.locator('[data-elementary-trial]').innerText(),/y = 50/);
 await submit(p,'4;2');await p.reload();await p.locator('[data-candidate-point="4"][data-selected=true]').waitFor();assert.equal(await p.locator('[data-candidate-point][data-selected=true]').count(),2);
 for(const card of require('./exercises-1170-1171.json')){
  await openNumber(p,Number(card.title.match(/\d+/)[0]),card.title);await p.locator('#task-graph svg').first().waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await openNumber(p,1170,'№ 1170 · графики');await submit(p,'2;1/2;2');assert.equal(await p.evaluate(()=>MakarychevApp.getState().tasks['p45-source-1170-draw'].attempts),0);
 await submit(p,'2;1/2;2;-1;3');assert.match(await p.locator('#problem').innerText(),/-6\/x/);await submit(p,'-2/5;-5/2;-10;5;15');await p.reload();await p.locator('[data-reciprocal-construction=valid]').waitFor();
 assert.equal(await p.locator('#task-graph [data-root-curve=hyperbola]').count(),4);assert.equal(await p.locator('#task-graph [data-point-x="0.4"]').count(),4);
 await openNumber(p,1171,'№ 1171б · графики');await submit(p,'(1;2),(2;1) | (0;1),(2;3)');assert.match(await p.locator('#problem').innerText(),/одной ветви/);
 await p.locator('[data-action=guided]').click();await p.locator('#step-answer-0').fill('-2');await p.locator('[data-reciprocal-family-trial=equal]').waitFor();
 await submit(p,'(-1/2;-4),(4;1/2) | (-1;0),(3;4)');await p.reload();await p.locator('[data-reciprocal-construction=valid]').waitFor();assert.equal(await p.locator('#task-graph [data-root-curve]').count(),2);
 await openNumber(p,1171,'№ 1171б · пересечения');await submit(p,'(1;2)');assert.match(await p.locator('#problem').innerText(),/второе пересечение/);await submit(p,'(-2;-1),(1;2)');await p.reload();assert(await p.evaluate(()=>MakarychevApp.getState().tasks['p45-source-1171-b-meet'].correct));
 assert.deepEqual(errors,[]);await ctx.close();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const url='http://127.0.0.1:'+server.address().port+'/school/makarychev8/';
  for(const w of [320,390,1024])await verify(w,url);
  const offline=path.join(root,'downloads/trainers/makarychev8-algebra/makarychev8-algebra.html');
  await verify(320,require('node:url').pathToFileURL(offline).href,true);
  console.log('PASS source 1131–1171 on 320/390/1024px and 320px offline; distinct error feedback, both branches restored inequality intersection and two signed radical remainders.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
