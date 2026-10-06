'use strict';
// Focused interaction/geometry checks for the notebook presentation. The
// existing guided suite covers every topic's arithmetic and storage failures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const G = require('../trainers/oge-basics/multiplication-division/division-guided-core');
const root = path.resolve(__dirname, '..');
const route = '/trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html';
const KEY = 'mathExamBasics.guidedDivision.v1';
const shots = process.env.DIVISION_SCREENSHOTS;
const server = http.createServer((req, res) => {
 const pathname = new URL(req.url, 'http://fixture').pathname;
 if (pathname === '/blank') return res.writeHead(200, {'Content-Type':'text/html'}).end('<!doctype html><title>Local fixture</title>');
 const file = path.resolve(root, '.' + pathname);
 if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
 try {
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
 } catch (_) { res.writeHead(404).end(); }
});
const state = page => page.evaluate(() => window.__divisionGuidedDebug.state());
async function work(page) {
 const all = await state(page), s = all.sessions[all.active], p = G.plan(s.task);
 return {all,s,p,a:p.actions[s.step]};
}
async function shot(page, name) {
 if (!shots) return;
 fs.mkdirSync(shots,{recursive:true});
 await page.screenshot({path:path.join(shots,'notebook-'+name+'.png'),fullPage:true});
 await page.screenshot({path:path.join(shots,'notebook-'+name+'-viewport.png')});
}
async function reflow(page, label) {
 assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': no horizontal document overflow');
}
async function answer(page, value, keyboard = false) {
 await page.locator('#answer').fill(value);
 if (keyboard) await page.locator('#answer').press('Enter');
 else await page.locator('#primary').click();
 const {s} = await work(page);
 assert(s.accepted, 'Expected accepted answer ' + value + ': ' + await page.locator('#feedback').innerText());
}
async function next(page) { await page.locator('#primary').click(); }
async function one(page) {
 const {s,a} = await work(page);
 if (s.done) return false;
 if (s.accepted) { await next(page); return true; }
 if (a.options) await page.locator('[data-option=' + JSON.stringify(a.answer) + ']').click();
 else if (a.kind === 'start') await page.locator('[data-prefix-end="' + a.sourceIndex + '"]').click();
 else await page.locator('#answer').fill(a.answer);
 await page.locator('#primary').click();
 assert((await work(page)).s.accepted, 'Valid guided answer rejected for ' + a.kind);
 return true;
}
async function until(page, predicate) {
 for (let i = 0; i < 160; i++) {
  const w = await work(page);
  if (!w.s.accepted && predicate(w.a)) return w;
  if (!(await one(page))) break;
 }
 throw Error('Requested notebook action was not reached');
}
async function finish(page) { for (let i=0;i<200;i++) if (!(await one(page))) return; throw Error('Unfinished example'); }
async function chooseTopic(page, id) {
 await page.locator('#topics-open').click();await page.locator('[data-topic="'+id+'"]').click();
}
async function reloadExact(page) {
 const before = await state(page);
 await page.reload();await page.waitForFunction(() => window.__divisionGuidedDebug);
 assert.deepEqual(await state(page),before,'Notebook changes require no state-v1 migration');
}
async function normalization(page) {
 return page.locator('[data-normalization]').evaluateAll(rows => Object.fromEntries(rows.map(row => [row.dataset.normalization, {
  original:row.querySelector('[data-original]').textContent.trim(),
  factor:row.querySelector('[data-factor]').textContent.trim(),
  normalized:row.querySelector('[data-normalized]').textContent.trim(),
  earned:row.dataset.earned
 }])));
}
async function decimalPreparation(page, expected, label) {
 const original = await work(page);
 assert.equal(original.a.kind,'shift-count');
 let view = await normalization(page);
 for (const id of ['dividend','divisor']) {
  assert.equal(view[id].original,expected[id]);
  assert(view[id].factor.includes('?'),'The multiplier must not be disclosed before the factor answer');
  assert.equal(view[id].normalized,'?','No normalized operand is disclosed before its own answer');
 }
 assert.equal(await page.locator('#notebook').isVisible(),false,'The old decimal divisor is not silently written as an integer');
 await answer(page,'1',true);await next(page);
 assert.equal((await work(page)).a.kind,'shift-factor');
 await page.locator('#answer').fill('100');await page.locator('#primary').click();
 assert.equal((await work(page)).s.accepted,false,'Wrong common multiplier is rejected');
 view=await normalization(page);
 assert(view.dividend.factor.includes('?')&&view.divisor.factor.includes('?'),'A wrong multiplier does not unlock either transformation');
 await answer(page,'10');
 view=await normalization(page);
 assert(view.dividend.factor.includes('10')&&view.divisor.factor.includes('10'),'Both operands show the same earned multiplier');
 assert.equal(view.dividend.normalized,'?');assert.equal(view.divisor.normalized,'?');
 await next(page);assert.equal((await work(page)).a.kind,'shift-divisor');
 await answer(page,expected.normalDivisor);
 view=await normalization(page);
 assert.equal(view.divisor.normalized,expected.normalDivisor);
 assert.equal(view.dividend.normalized,'?','The dividend remains a separate learner action');
 await reloadExact(page);await next(page);
 assert.equal((await work(page)).a.kind,'shift-dividend');
 await answer(page,expected.normalDividend);
 view=await normalization(page);
 assert.equal(view.dividend.normalized,expected.normalDividend);
 assert.equal(view.divisor.normalized,expected.normalDivisor);
 assert.equal(await page.locator('#notebook').isVisible(),true);
 assert.equal(await page.locator('.divisor').innerText(),expected.normalDivisor);
 await shot(page,label+'-equal-shift');await reflow(page,label+'-equal-shift');
 await next(page);
 assert.equal((await work(page)).a.kind,'start');
 assert.equal(await page.locator('[data-first-arch]').count(),0,'Normalization does not preselect the first partial dividend');
 const start=(await work(page)).a;
 await page.locator('[data-prefix-end="'+start.sourceIndex+'"]').click();
 await prefixArch(page,start.sourceIndex);
 await shot(page,label+'-selected-prefix');
}
async function prefixArch(page, end) {
 await page.waitForFunction(index=>document.querySelector('[data-first-arch]')?.dataset.selectedEnd===String(index),end);
 const measured=await page.evaluate(index=>{
  const arch=document.querySelector('[data-first-arch]');
  const first=document.querySelector('[data-source-digit="0"]').getBoundingClientRect();
  const last=document.querySelector('[data-source-digit="'+index+'"]').getBoundingClientRect();
  const screen=distance=>{const p=arch.getPointAtLength(distance);const q=new DOMPoint(p.x,p.y).matrixTransform(arch.getScreenCTM());return {x:q.x,y:q.y};};
  return {start:screen(0),end:screen(arch.getTotalLength()),left:first.left,right:last.right,top:first.top};
 },end);
 assert(Math.abs(measured.start.x-(measured.left+3))<1.5,'Arch starts over the first digit');
 assert(Math.abs(measured.end.x-(measured.right-3))<1.5,'Arch ends over the learner-selected last digit');
 assert(measured.start.y<measured.top&&measured.end.y<measured.top,'Arch is drawn above the selected prefix');
}
async function arrowGeometry(page, label, expectedIndex) {
 await page.waitForFunction(() => document.querySelector('[data-bring-arrow]'));
 const geometry = await page.evaluate(() => {
  const arrow=document.querySelector('[data-bring-arrow]'), index=arrow.dataset.sourceIndex;
  const source=document.querySelector('[data-source-digit="'+index+'"]'), target=document.querySelector('[data-bring-target="'+index+'"]');
  if (!source||!target) return {missing:true,index};
  const screen = length => {const q=arrow.getPointAtLength(length);const p=new DOMPoint(q.x,q.y).matrixTransform(arrow.getScreenCTM());return {x:p.x,y:p.y};};
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  return {source:rect(source),target:rect(target),start:screen(0),end:screen(arrow.getTotalLength()),index};
 });
 assert(!geometry.missing,label+': source and destination exist');
 assert.equal(Number(geometry.index),expectedIndex,label+': arrow follows this action’s source digit');
 for (const key of ['source','target']) assert(geometry[key].width>0&&geometry[key].height>0,label+': visible '+key);
 assert(Math.abs(geometry.source.x-geometry.target.x)<1.5,label+': source and brought digit share a place-value column');
 assert(Math.abs(geometry.start.x-geometry.source.x)<1.5,label+': arrow starts over the actual source digit');
 assert(Math.abs(geometry.end.x-geometry.target.x)<1.5,label+': arrow points at the actual destination digit');
 assert(geometry.start.y>=geometry.source.top-3&&geometry.start.y<=geometry.source.bottom+16,label+': arrow starts beside the source cell');
 assert(geometry.end.y>=geometry.target.top-16&&geometry.end.y<=geometry.target.bottom+3,label+': arrow ends beside the destination cell');
 assert(geometry.end.y>geometry.start.y,label+': bring-down direction is downward');
 return geometry.index;
}
async function commaAndBring(page, expected, label) {
 await until(page,a=>a.kind==='comma');
 assert.equal(await page.locator('[data-quotient-comma]').count(),0,'Quotient comma is not prefilled');
 const quotientBefore=(await page.locator('.quotient').innerText()).replaceAll('·','');
 await answer(page,expected.whole+',');
 assert.equal(await page.locator('[data-quotient-comma]').innerText(),',','Comma appears after the accepted comma action');
 assert((await page.locator('.quotient').innerText()).startsWith(quotientBefore+','));
 await shot(page,label+'-comma');
 await next(page);
 const {a}=await work(page);assert.equal(a.kind,'bring');
 assert.equal(a.answer,expected.bring);assert.equal(a.appended,expected.appended);
 const beforeText=await page.locator('[data-bring-target="'+a.sourceIndex+'"]').innerText();
 assert(!beforeText.trim()||beforeText.includes('?'),'The destination digit remains unfilled before the learner action');
 if(expected.appended) {
  assert.equal((await page.locator('[data-append-zero]').innerText()).trim(),'','An appended zero remains a blank source cell until its own answer');
  assert.equal(await page.locator('[data-append-zero]').getAttribute('data-earned'),'false');
 }
 await arrowGeometry(page,label+'-before-bring',a.sourceIndex);
 await answer(page,expected.bring);
 assert.equal((await page.locator('[data-bring-target="'+a.sourceIndex+'"]').innerText()).trim(),expected.bring);
 if(expected.appended) {
  assert.equal(await page.locator('[data-append-zero]').innerText(),'0');
  assert.equal(await page.locator('[data-dividend-comma]').innerText(),',');
 }
 await arrowGeometry(page,label+'-accepted-bring',a.sourceIndex);
 await shot(page,label+'-bring-arrow');await reflow(page,label+'-bring-arrow');
 await reloadExact(page);await arrowGeometry(page,label+'-restored-bring',a.sourceIndex);
}
function legacySession(task, step, draft) {
 const p=G.plan(task), topic=task.topicId;
 return {version:1,active:topic,serial:1,next:{[topic]:1},sessions:{[topic]:{id:1,task,step,answers:p.actions.slice(0,step).map(a=>a.answer),accepted:false,done:false,draft,errors:1,hints:1,reveals:0,repeated:false}},records:[]};
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const errors=[];let lastPage;
 async function open(width=1280,initial) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();lastPage=page;page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  if(initial){await page.goto(origin+'/blank');await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:KEY,value:initial});}
  await page.goto(origin+route);await page.waitForFunction(()=>window.__divisionGuidedDebug);
  return page;
 }
 try {
  const page=await open();
  assert.equal(await page.locator('#problem').innerText(),'48 : 2');
  assert.equal(await page.locator('[data-first-arch]').count(),0,'The correct prefix is not drawn on initial entry');
  assert.equal(await page.locator('[data-source-digit].current').count(),0,'The first partial dividend is not highlighted in advance');
  const last=page.locator('[data-prefix-end="1"]');
  await last.focus();await last.press('Space');
  assert.equal((await work(page)).s.draft,'48','Clicking the last digit selects the entire prefix, not merely 8');
  assert.equal(await page.locator('[data-first-arch]').getAttribute('data-selected-end'),'1');
  await prefixArch(page,1);
  await page.locator('#primary').press('Enter');
  assert.equal((await work(page)).s.accepted,false,'An unnecessarily long prefix is rejected');
  assert.equal(await page.locator('[data-first-arch]').getAttribute('data-selected-end'),'1','Wrong selection remains the learner selection, not the hidden correct prefix');
  await reloadExact(page);
  assert.equal(await page.locator('[data-first-arch]').getAttribute('data-selected-end'),'1','A prefix draft restores from the old state field');
  await page.locator('[data-prefix-end="0"]').press('Enter');
  assert.equal((await work(page)).s.draft,'4');
  await page.locator('#primary').press('Enter');
  assert.equal((await work(page)).s.accepted,true);
  assert.equal((await work(page)).s.step,0,'A correct prefix waits for explicit continuation');
  await prefixArch(page,0);
  await shot(page,'prefix-desktop');
  await chooseTopic(page,'twoDigit');
  await page.locator('[data-prefix-end="1"]').click();
  assert.equal((await work(page)).s.draft,'86');await page.locator('#primary').click();
  assert((await work(page)).s.accepted,'The last digit of a two-digit prefix selects 86 in 864 : 36');
  await chooseTopic(page,'decimalDivisor');
  await decimalPreparation(page,{dividend:'8',divisor:'2,5',normalDividend:'80',normalDivisor:'25'},'desktop-8');
  await commaAndBring(page,{whole:'3',bring:'0',appended:true},'desktop-8');
  await finish(page);assert.equal(await page.locator('.quotient').innerText(),'3,2');

  // A hand-authored old version-1 attempt resumes halfway through preparation.
  const legacy=legacySession(G.make('decimalDivisor',0),3,'8');
  const resumed=await open(390,legacy);
  assert.deepEqual(await state(resumed),legacy,'Existing v1 answers, help counts and in-progress draft are preserved');
  const view=await normalization(resumed);
  assert.equal(view.divisor.normalized,'25');assert.equal(view.dividend.normalized,'?');
  assert.equal(await resumed.locator('#answer').inputValue(),'8');
  await answer(resumed,'80');await next(resumed);
  await reflow(resumed,'resumed-390');

  for(const width of [320,390]) {
   const task=G.make('decimalDivisor',4);
   assert.equal(task.dividend,'0,084');assert.equal(task.divisor,'0,4');
   const mobile=await open(width,legacySession(task,0,''));
   await decimalPreparation(mobile,{dividend:'0,084',divisor:'0,4',normalDividend:'0,84',normalDivisor:'4'},'mobile-'+width);
   await commaAndBring(mobile,{whole:'0',bring:'8',appended:false},'mobile-'+width);
   await finish(mobile);assert.equal(await mobile.locator('.quotient').innerText(),'0,21');
   await reflow(mobile,'completed-'+width);
   assert(await mobile.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches));
   const animations=await mobile.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length);
   assert.equal(animations,0,'Reduced-motion mode has no running notebook animation');
   await shot(mobile,'decimal-complete-'+width);
  }
  assert.deepEqual(errors,[]);
  console.log('DIVISION_NOTEBOOK_DECIMALS_OK: digit-prefix click/keyboard, no answer leak, earned equal decimal shifts, comma/appended zero, aligned source-to-target arrows, old v1 resume and 320/390px reduced-motion layouts.');
 } catch(error) {if(lastPage) await shot(lastPage,'failure');throw error;}
 finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
