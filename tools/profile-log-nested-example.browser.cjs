'use strict';
// End-to-end checks specific to the second guided example. Shared runtime
// edge cases remain covered by profile-log-one-example.browser.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { loadConfig, verifyContent, expectedTokens } = require('./profile-log-nested-example.test.cjs');
const root = path.resolve(__dirname, '..');
const route = '/trainers/ege-profile/log-inequalities/nested.html';
const firstRoute = '/trainers/ege-profile/log-inequalities/lesson.html';
const config = loadConfig();
verifyContent(config);
const shots = process.env.LOG_TRAINER_SCREENSHOTS;
const harness = `<!doctype html><meta charset="utf-8"><title>Nested example mirror fixture</title>
<iframe id="student" src="${route}?groupLesson=1"></iframe><iframe id="teacher" src="${route}?groupLesson=1"></iframe>
<script>
window.ready={};window.updates=[];window.hydrate={};window.diagnostics=[];
const badInitial=new URLSearchParams(location.search).has('badHydration');
window.send=(name,type,state)=>{document.getElementById(name).contentWindow.postMessage({...ready[name],type,...(state===undefined?{}:{state})},location.origin)};
addEventListener('message',event=>{
 if(event.origin!==location.origin)return;
 const name=['student','teacher'].find(n=>document.getElementById(n).contentWindow===event.source);if(!name)return;
 if(event.data.type==='mathexam:trainer-ready'){
  ready[name]=event.data;
  event.source.addEventListener('mathexam:bridge-diagnostic',e=>diagnostics.push({name,code:e.detail.code}));
  const initial=badInitial&&name==='teacher'?{schema:1}:hydrate[name];
  event.source.postMessage({...event.data,type:'mathexam:hydrate',...(initial?{mode:'state',state:initial}:{mode:'empty'})},location.origin);
 }
 if(event.data.type==='mathexam:trainer-state')updates.push({name,state:event.data.state});
});</script>`;
const server = http.createServer((req, res) => {
 const url = new URL(req.url, 'http://fixture');
 if (url.pathname === '/mirror-fixture') return res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}).end(harness);
 if (url.pathname === '/blank') return res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}).end('<!doctype html><title>Fixture</title>');
 try {
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
 } catch (_) { res.writeHead(404).end(); }
});
const selector = (name, value) => '[' + name + '=' + JSON.stringify(String(value)) + ']';
const state = page => page.evaluate(() => window.__nestedLogExample.getState());
async function shot(page, name) {
 if (!shots) return;
 fs.mkdirSync(shots, {recursive:true});
 await page.screenshot({path:path.join(shots, 'nested-' + name + '.png'),fullPage:true});
}
async function reflow(page, label) {
 const measured = await page.evaluate(() => ({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 if (measured.scroll > measured.width + 1) await shot(page, 'overflow-' + label);
 assert(measured.scroll <= measured.width + 1, label + ': no page-wide horizontal overflow');
}
async function setAxis(page, field, values) {
 const buttons = page.locator(selector('data-axis', field.id) + '[data-token]');
 assert.equal(await buttons.count(), field.points.length * 2 + 1);
 for (let i = 0; i < await buttons.count(); i++) {
  const button = buttons.nth(i);
  if ((await button.getAttribute('aria-pressed') === 'true') !== values.includes(await button.getAttribute('data-token'))) await button.click();
 }
}
async function fill(page, fields) {
 for (const field of fields) {
  const f = selector('data-field', field.id);
  if (field.kind === 'number') await page.locator('input' + f).fill(String(field.correct));
  else if (field.kind === 'choice') await page.locator('input' + f + selector('data-choice', field.correct)).check();
  else if (field.kind === 'checks') {
   const inputs = page.locator('input' + f);
   for (let i = 0; i < await inputs.count(); i++) await inputs.nth(i).setChecked(field.correct.includes(await inputs.nth(i).getAttribute('value')));
  } else if (field.kind === 'axis') await setAxis(page, field, expectedTokens(field));
  else assert.fail('Uncovered field kind: ' + field.kind);
 }
}
async function commonAxes(page, mobile) {
 const measured = await page.evaluate(() => {
  const host = document.querySelector('[data-axis="domain-axis"]').closest('.axis-block');
  const scrollers = host.querySelectorAll('.axis-scroll');
  const scroll = scrollers[0];
  scroll.scrollLeft = scroll.scrollWidth;
  return {
   count:scrollers.length, overflow:scroll.scrollWidth > scroll.clientWidth, left:scroll.scrollLeft,
   labels:[...scroll.querySelectorAll('.axis-help')].map(label=>{
    const box=label.getBoundingClientRect(),viewport=scroll.getBoundingClientRect();
    return {left:box.left-viewport.left,right:box.right-viewport.right};
   }),
   rows:[...scroll.querySelectorAll('svg')].map(svg => [...svg.querySelectorAll('circle')].map(c => {
    const b = c.getBoundingClientRect();return b.x + b.width / 2;
   }))
  };
 });
 assert.equal(measured.count, 1, 'All six reference axes and the answer share one scroller');
 assert.equal(measured.rows.length, 7, 'Six domain conditions and one intersection axis');
 assert.equal(measured.rows[0].length, 7, 'Each row shares the seven critical points');
 assert.equal(measured.labels.length, 7);
 measured.labels.forEach(label=>assert(label.left>=-1&&label.right<=1,'Each condition label stays visible when its axes are scrolled'));
 for (const row of measured.rows) {
  assert.equal(row.length, measured.rows[0].length);
  row.forEach((x, i) => assert(Math.abs(x - measured.rows[0][i]) < 1, 'Critical points stay vertically aligned after horizontal scroll'));
 }
 if (mobile) assert(measured.overflow && measured.left > 0, 'On a phone the complete axis stack can scroll together');
}
async function solve(page, label, mobile) {
 const steps = await page.evaluate(() => window.__nestedLogExample.steps);
 let firstRecord = '', endpointChecks = 0;
 for (let index = 0; index < steps.length; index++) {
  assert.equal((await state(page)).step, index);
  const fields = steps[index].fields;
  await reflow(page, label + '-step-' + index);
  const axis = fields.find(f => f.kind === 'axis');
  if (axis?.id === 'domain-axis') { await commonAxes(page, mobile); await shot(page, label + '-six-domain-rows'); }
  await fill(page, fields);
  if (axis && ['quadratic-axis','final-axis'].includes(axis.id)) {
   // A closed quadratic endpoint is required, but the original logarithm's
   // boundary is prohibited. Exercise both mistakes using the actual UI.
   const expected = expectedTokens(axis);
   const wrong = axis.id === 'quadratic-axis' ? expected.filter(t => t !== 'p0') : expected.concat('p2');
   await setAxis(page, axis, wrong);
   await page.locator('#check').click();
   assert(!(await state(page)).solved.includes(index), axis.id + ': incorrect endpoint must be rejected');
   await setAxis(page, axis, expected);
   endpointChecks++;
   await shot(page, label + '-' + axis.id);
  }
  await page.locator('#check').click();
  const accepted = await state(page);
  assert(accepted.solved.includes(index), label + ' step ' + index + ': ' + await page.locator('#feedback').innerText());
  assert.equal(accepted.step, index, 'Checking an answer never skips its explanation');
  if (index === 0) firstRecord = await page.locator('#notebook [data-notebook-step="0"]').innerText();
  assert((await page.locator('#notebook').innerText()).includes(firstRecord), 'Earlier solution steps stay visible');
  if (axis?.id === 'domain-axis') {
   await page.reload();await page.waitForFunction(() => window.__nestedLogExample);
   assert.deepEqual(await state(page), accepted, 'Irrational critical points and domain selections survive reload');
  }
  await page.locator('#next').click();
 }
 assert.equal(endpointChecks, 2, 'Closed intermediate and open final boundaries are both exercised');
 const finished = await state(page);
 assert.equal(finished.solved.length, steps.length);
 const report = await page.locator('#report').inputValue();
 assert(report.includes('Пройдено шагов: ' + steps.length + ' из ' + steps.length));
 assert(report.includes('Ответ: (1; (1+√5)/2)'));
 assert(report.includes(config.reportProblem));
 assert(!report.includes('(−4; −3)'), 'The second example has its own report');
 const downloaded = page.waitForEvent('download');
 await page.locator('#download-report').click();
 const download = await downloaded;
 assert.equal(download.suggestedFilename(), config.reportName);
 assert.equal(fs.readFileSync(await download.path(), 'utf8'), report, 'Downloaded report exactly matches the visible result');
 await reflow(page, label + '-complete');await shot(page, label + '-complete');
 await page.reload();await page.waitForFunction(() => window.__nestedLogExample);
 assert.deepEqual(await state(page), finished, 'Completed nested solution restores exactly');
 return finished;
}
(async () => {
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const origin = 'http://127.0.0.1:' + server.address().port;
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
 const errors = [];
 async function learner(context) {
  const page = await context.newPage();page.setDefaultTimeout(12000);
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin + route);await page.waitForFunction(() => window.__nestedLogExample);return page;
 }
 try {
  const context = await browser.newContext({viewport:{width:1280,height:950},reducedMotion:'reduce'});
  const legacyPage = await context.newPage();
  await legacyPage.goto(origin + '/blank');
  const legacyKey = 'mathExam.logOneExample.v1';
  const legacy = {schema:1,step:1,answers:{'0':{base:'base',arg:'arg'}},solved:[0],helps:[0],errors:2,feedback:{kind:'',message:''}};
  const legacyRaw = JSON.stringify(legacy);
  await legacyPage.evaluate(({key,raw}) => localStorage.setItem(key,raw), {key:legacyKey,raw:legacyRaw});
  await legacyPage.goto(origin + firstRoute);await legacyPage.waitForFunction(() => window.__logExample);
  assert.deepEqual(await legacyPage.evaluate(() => window.__logExample.getState()), legacy, 'The extracted runtime restores the old first-example format without migration');
  const page = await learner(context);
  const pristine = await state(page), key = await page.evaluate(() => window.__nestedLogExample.storageKey);
  assert.notEqual(key, legacyKey, 'The two examples have separate storage identities');
  assert.equal(pristine.step, 0);assert.deepEqual(pristine.solved, []);
  await page.locator('#check').click();
  assert.equal((await state(page)).step, 0);assert.deepEqual((await state(page)).solved, []);
  await page.locator('#hint').click();
  assert((await state(page)).helps.includes(0));
  const finished = await solve(page, 'desktop', false);
  assert.equal(await page.evaluate(k => localStorage.getItem(k), legacyKey), legacyRaw, 'Nested work never alters the existing first-example save');
  await legacyPage.reload();await legacyPage.waitForFunction(() => window.__logExample);
  assert.deepEqual(await legacyPage.evaluate(() => window.__logExample.getState()), legacy);
  for (const bad of [{...finished,schema:99},{...finished,answers:[]},{...finished,solved:[999]}]) {
   assert(await page.evaluate(v => {try{return window.__nestedLogExample.applyState(v)===false;}catch(_){return true;}},bad));
   assert.deepEqual(await state(page),finished,'Invalid remote restores remain atomic');
  }
  const mobile = await learner(await browser.newContext({viewport:{width:375,height:900},isMobile:true,hasTouch:true,reducedMotion:'reduce'}));
  await solve(mobile, 'mobile-375', true);

  const mirror = await (await browser.newContext()).newPage();mirror.on('pageerror',e=>errors.push(e.message));
  await mirror.goto(origin + '/mirror-fixture');await mirror.waitForFunction(() => ready.student && ready.teacher);
  assert.equal(await mirror.evaluate(() => ready.student.trainerId), 'profile-log-nested-example');
  await mirror.frameLocator('#student').locator('#hint').click();
  await mirror.waitForFunction(() => updates.some(x => x.name === 'student'));
  const snapshot = await mirror.evaluate(() => updates.filter(x => x.name === 'student').at(-1).state);
  const count = await mirror.evaluate(() => updates.filter(x => x.name === 'teacher').length);
  await mirror.evaluate(s => send('teacher','mathexam:apply-trainer-state',s), snapshot);
  await mirror.waitForFunction(s => JSON.stringify(document.getElementById('teacher').contentWindow.__nestedLogExample.getState()) === JSON.stringify(s), snapshot);
  await mirror.waitForTimeout(150);
  assert.equal(await mirror.evaluate(() => updates.filter(x => x.name === 'teacher').length),count,'Remote nested restoration emits no echo');
  await mirror.evaluate(s => {hydrate.teacher=s;delete ready.teacher;document.getElementById('teacher').src += '&restore=1';},snapshot);
  await mirror.waitForFunction(s => ready.teacher && JSON.stringify(document.getElementById('teacher').contentWindow.__nestedLogExample?.getState()) === JSON.stringify(s),snapshot);
  assert.equal(await mirror.evaluate(k => localStorage.getItem(k),key),null,'Embedded nested work does not write standalone storage');
  const bad = await (await browser.newContext()).newPage();
  await bad.goto(origin + '/mirror-fixture?badHydration=1');
  await bad.waitForFunction(() => diagnostics.some(d => d.name === 'teacher' && d.code === 'hydrate-apply-failed'));
  assert.deepEqual(await bad.evaluate(() => document.getElementById('teacher').contentWindow.__nestedLogExample.getState()),pristine);
  await bad.evaluate(() => send('teacher','mathexam:request-trainer-state'));
  await bad.waitForFunction(() => diagnostics.some(d => d.name === 'teacher' && d.code === 'message-before-hydration'));
  assert.equal(await bad.evaluate(() => updates.filter(x => x.name === 'teacher').length),0,'Invalid hydration leaves the bridge locked');
  await bad.evaluate(s => document.getElementById('teacher').contentWindow.postMessage({...ready.teacher,type:'mathexam:hydrate',mode:'state',state:s},location.origin),snapshot);
  await bad.waitForFunction(s => JSON.stringify(document.getElementById('teacher').contentWindow.__nestedLogExample.getState()) === JSON.stringify(s),snapshot);
  assert.deepEqual(errors,[]);
  console.log('PROFILE_LOG_NESTED_BROWSER_OK: all guided steps at desktop/375px, six aligned scrolling domain axes, closed/open endpoints, legacy-save isolation, reports, and silent/rejected mirror hydration.');
 } finally { await browser.close();await new Promise(resolve => server.close(resolve)); }
})().catch(error => {console.error(error);process.exitCode=1;server.close();});
