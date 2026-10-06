'use strict';
// UI integration coverage for the single, fully guided logarithm example.
// Run with LOG_EXAMPLE_SCREENSHOTS=/tmp/log-example-shots to retain each phase.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const route = '/trainers/ege-profile/log-inequalities/lesson.html';
const shots = process.env.LOG_EXAMPLE_SCREENSHOTS || process.env.LOG_TRAINER_SCREENSHOTS;
const harness = `<!doctype html><meta charset="utf-8"><title>Single example mirror fixture</title>
<iframe id="student" src="${route}?groupLesson=1"></iframe><iframe id="teacher" src="${route}?groupLesson=1"></iframe>
<script>
window.ready={};window.updates=[];window.hydrate={};window.diagnostics=[];
const badInitial=new URLSearchParams(location.search).has('badHydration');
window.send=(name,type,state)=>{const envelope=ready[name];document.getElementById(name).contentWindow.postMessage({...envelope,type,...(state===undefined?{}:{state})},location.origin)};
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
 try {
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
 } catch (_) { res.writeHead(404).end(); }
});

(async () => {
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const origin = 'http://127.0.0.1:' + server.address().port;
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
 const errors = [];
 async function learner(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + route);
  await page.waitForFunction(() => window.__logExample);
  return page;
 }
 const state = page => page.evaluate(() => window.__logExample.getState());
 async function screenshot(page, name) {
  if (!shots) return;
  fs.mkdirSync(shots, {recursive:true});
  await page.screenshot({path:path.join(shots, name + '.png'), fullPage:true});
 }
 async function reflow(page, label) {
  const info = await page.evaluate(() => ({width:innerWidth, scroll:document.documentElement.scrollWidth,
   wide:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>({tag:e.tagName,id:e.id,text:e.textContent.slice(0,60)}))}));
  if (info.scroll > info.width + 1) { await screenshot(page, 'overflow-' + label); console.log('REFLOW_DIAGNOSTIC', JSON.stringify(info)); }
  assert(info.scroll <= info.width + 1, 'Horizontal overflow: ' + label);
 }
 async function restored(page, expected, label) {
  await page.reload();
  await page.waitForFunction(() => window.__logExample);
  assert.deepEqual(await state(page), expected, label);
 }
 async function fields(page) {
  return page.evaluate(() => {
   const api = window.__logExample;
   return api.steps[api.getState().step].fields;
  });
 }
 const fieldSelector = id => '[data-field=' + JSON.stringify(id) + ']';
 async function fillCorrect(page) {
  for (const field of await fields(page)) {
   const selector = fieldSelector(field.id);
   if (field.kind === 'number') {
    await page.locator('input' + selector).fill(String(field.correct));
   } else if (field.kind === 'choice') {
    await page.locator(selector + '[data-choice=' + JSON.stringify(String(field.correct)) + '], ' + selector + ' [data-choice=' + JSON.stringify(String(field.correct)) + ']').click();
   } else if (field.kind === 'checks') {
    const inputs = page.locator('input' + selector);
    const expected = field.correct.map(String);
    assert(await inputs.count() > 0, 'No checkboxes for ' + field.id);
    for (let n = 0; n < await inputs.count(); n++) {
     const input = inputs.nth(n);
     await input.setChecked(expected.includes(await input.getAttribute('value')));
    }
   } else if (field.kind === 'axis') {
    const tokens = page.locator('[data-axis=' + JSON.stringify(field.id) + '][data-token]');
    const expected = field.correct.map(String);
    assert(await tokens.count() > 0, 'No axis tokens for ' + field.id);
    for (let n = 0; n < await tokens.count(); n++) {
     const button = tokens.nth(n);
     const pressed = await button.getAttribute('aria-pressed') === 'true';
     if (pressed !== expected.includes(await button.getAttribute('data-token'))) await button.click();
    }
   } else throw new Error('Unsupported field kind: ' + field.kind);
  }
 }
 async function solveJourney(page, label, exerciseDrafts) {
  const total = await page.evaluate(() => window.__logExample.steps.length);
  let draftChecked = false, keyboardChecked = false;
  let savedNotebook = '';
  while ((await state(page)).step < total) {
   const before = await state(page);
   const index = before.step;
   const stepFields = await fields(page);
   await reflow(page, label + '-step-' + index);
   await screenshot(page, label + '-step-' + String(index + 1).padStart(2, '0'));
   if (exerciseDrafts && !draftChecked && !before.solved.includes(index)) {
    const number = stepFields.find(field => field.kind === 'number');
    if (number) {
     const input = page.locator('input' + fieldSelector(number.id));
     await input.fill('1/');
     const draft = await state(page);
     assert.equal(draft.answers[String(index)][number.id], '1/');
     await restored(page, draft, 'Incomplete numerical input survives reload exactly');
     await page.locator('#check').click();
     assert(!(await state(page)).solved.includes(index), 'Malformed numerical input must not be accepted');
     assert.equal((await state(page)).step, index, 'Wrong numeric input must not advance');
     draftChecked = true;
    }
   }
   if (!keyboardChecked && !before.solved.includes(index)) {
    const axis = stepFields.find(field => field.kind === 'axis');
    if (axis) {
     const token = page.locator('[data-axis=' + JSON.stringify(axis.id) + '][data-token]').first();
     const initial = await token.getAttribute('aria-pressed');
     await token.focus(); await page.keyboard.press('Space');
     assert.notEqual(await token.getAttribute('aria-pressed'), initial, 'Space toggles an axis segment/point');
     await token.focus(); await page.keyboard.press('Enter');
     assert.equal(await token.getAttribute('aria-pressed'), initial, 'Enter also toggles axis selection');
     keyboardChecked = true;
    }
   }
   if (!(await state(page)).solved.includes(index)) {
    await fillCorrect(page);
    await page.locator('#check').click();
   }
   const accepted = await state(page);
   assert(accepted.solved.includes(index), label + ' step ' + index + ': ' + await page.locator('#feedback').innerText());
   assert.equal(accepted.step, index, 'Correct answer pauses on the current step');
   const notebook = (await page.locator('#notebook').innerText()).trim();
   assert(notebook.length > 0, 'Notebook records the work');
   if (savedNotebook) assert(notebook.includes(savedNotebook), 'Earlier notebook steps must remain visible');
   const entry = page.locator('#notebook [data-notebook-step="0"]');
   if (index === 0 && await entry.count()) savedNotebook = (await entry.innerText()).trim();
   if (index === 0) await restored(page, accepted, 'Accepted answer survives reload without auto-advance');
   await reflow(page, label + '-solved-' + index);
   await screenshot(page, label + '-solved-' + String(index + 1).padStart(2, '0'));
   await page.locator('#next').click();
   assert.equal((await state(page)).step, index + 1, 'Only Next advances');
  }
  const end = await state(page);
  assert.equal(end.solved.length, total);
  assert.deepEqual([...new Set(end.solved)].sort((a,b)=>a-b), Array.from({length:total}, (_,i)=>i));
  assert(keyboardChecked, 'Journey exercises keyboard axis controls');
  if (exerciseDrafts) assert(draftChecked, 'Journey exercises numerical drafts');
  await reflow(page, label + '-finished');
  await screenshot(page, label + '-finished');
  await restored(page, end, 'Completed solution survives reload without duplicate progress');
  return end;
 }
 try {
  const context = await browser.newContext({viewport:{width:1280,height:950}});
  const page = await learner(context);
  const original = await state(page);
  const total = await page.evaluate(() => window.__logExample.steps.length);
  const key = await page.evaluate(() => window.__logExample.storageKey);
  assert.equal(total, 18, 'The example has exactly 18 guided steps');
  assert.equal(original.step, 0); assert.equal(original.schema, 1);
  assert.deepEqual(original.solved, []);
  assert.equal(typeof key, 'string'); assert(key.length > 5);
  await page.evaluate(() => localStorage.setItem('mathExamCourseProgress.v1', 'unrelated-progress-untouched'));
  await page.locator('#check').click();
  const wrong = await state(page);
  assert.equal(wrong.step, 0); assert.deepEqual(wrong.solved, []);
  assert(wrong.errors > original.errors, 'Wrong answer increments errors');
  assert.equal(wrong.feedback.kind, 'wrong');
  await restored(page, wrong, 'Error and feedback survive reload');
  await page.locator('#hint').click();
  assert((await state(page)).helps.includes(0), 'Hint is recorded for this step');
  await screenshot(page, 'desktop-hint');
  const finished = await solveJourney(page, 'desktop', true);
  assert.equal(await page.evaluate(() => localStorage.getItem('mathExamCourseProgress.v1')), 'unrelated-progress-untouched');
  await page.locator('#restart').click();
  await page.locator('#restart-cancel').click();
  assert.deepEqual(await state(page), finished, 'Cancelling reset preserves the entire attempt');
  await restored(page, finished, 'Cancelling reset also preserves the persisted attempt');

  // Public restore API must reject malformed data without damaging an existing solution.
  const invalids = [null, {}, {...finished,schema:99}, {...finished,step:-1}, {...finished,step:total+1},
   {...finished,answers:[]}, {...finished,solved:[999]}, {...finished,helps:[999]}, {...finished,errors:-1}];
  for (const malformed of invalids) {
   const before = await state(page);
   const rejected = await page.evaluate(value => {
    try { return window.__logExample.applyState(value) === false; } catch (_) { return true; }
   }, malformed);
   assert(rejected, 'Malformed state must explicitly be rejected: ' + JSON.stringify(malformed).slice(0,140));
   assert.deepEqual(await state(page), before, 'Malformed restore is atomic');
  }
  await page.locator('#restart').click();
  await page.locator('#restart-confirm').click();
  assert.equal((await state(page)).step, 0);
  assert.deepEqual((await state(page)).solved, []);
  await restored(page, await state(page), 'Confirmed reset is persisted');

  const mobile = await learner(await browser.newContext({viewport:{width:375,height:900},isMobile:true,hasTouch:true}));
  await solveJourney(mobile, 'mobile-375', false);

  // A stale tab may not replace a newer saved attempt.
  const staleContext = await browser.newContext();
  const newer = await learner(staleContext), older = await learner(staleContext);
  await newer.locator('#hint').click();
  const saved = await newer.evaluate(k => localStorage.getItem(k), key);
  await older.waitForFunction(() => document.querySelector('#check').disabled);
  assert.equal(await older.evaluate(k => localStorage.getItem(k), key), saved, 'Stale tab leaves newer storage intact');
  await older.locator('#load-newer').click();
  assert.deepEqual(await state(older), await state(newer), 'Load-newer restores the actual newer attempt');
  assert(await older.locator('#check').isEnabled());

  // Embedded instances hydrate, exchange exact state in both directions, and do not echo or write standalone storage.
  const mirrorContext = await browser.newContext();
  const parent = await mirrorContext.newPage();
  parent.on('pageerror', error => errors.push(error.message));
  await parent.goto(origin + '/mirror-fixture');
  await parent.waitForFunction(() => ready.student && ready.teacher);
  const sf = parent.frameLocator('#student'), tf = parent.frameLocator('#teacher');
  await sf.locator('#check').click();
  await parent.waitForFunction(() => updates.some(item => item.name === 'student'));
  const snapshot = await parent.evaluate(() => updates.filter(item => item.name === 'student').at(-1).state);
  const teacherBefore = await parent.evaluate(() => updates.filter(item => item.name === 'teacher').length);
  await parent.evaluate(value => send('teacher', 'mathexam:apply-trainer-state', value), snapshot);
  await parent.waitForFunction(value => JSON.stringify(document.getElementById('teacher').contentWindow.__logExample.getState()) === JSON.stringify(value), snapshot);
  await parent.waitForTimeout(150);
  assert.equal(await parent.evaluate(() => updates.filter(item => item.name === 'teacher').length), teacherBefore, 'Remote application must not echo');
  assert.equal(await parent.evaluate(k => localStorage.getItem(k), key), null, 'Embedded attempts never write standalone storage');
  await tf.locator('#hint').click();
  await parent.waitForFunction(count => updates.filter(item => item.name === 'teacher').length > count, teacherBefore);
  const teacherSnapshot = await parent.evaluate(() => updates.filter(item => item.name === 'teacher').at(-1).state);
  const studentBefore = await parent.evaluate(() => updates.filter(item => item.name === 'student').length);
  await parent.evaluate(value => send('student', 'mathexam:apply-trainer-state', value), teacherSnapshot);
  await parent.waitForFunction(value => JSON.stringify(document.getElementById('student').contentWindow.__logExample.getState()) === JSON.stringify(value), teacherSnapshot);
  await parent.waitForTimeout(150);
  assert.equal(await parent.evaluate(() => updates.filter(item => item.name === 'student').length), studentBefore, 'Reverse remote application must not echo');
  await parent.evaluate(value => {
   hydrate.teacher = value; delete ready.teacher;
   document.getElementById('teacher').src = document.getElementById('teacher').src + '&reload=1';
  }, teacherSnapshot);
  await parent.waitForFunction(value => ready.teacher && JSON.stringify(document.getElementById('teacher').contentWindow.__logExample?.getState()) === JSON.stringify(value), teacherSnapshot);
  assert.equal(await parent.evaluate(k => localStorage.getItem(k), key), null);
  // A shape-invalid initial state must not unlock the bridge or damage local state.
  const badContext = await browser.newContext();
  const badParent = await badContext.newPage();
  badParent.on('pageerror', error => errors.push(error.message));
  await badParent.goto(origin + '/mirror-fixture?badHydration=1');
  await badParent.waitForFunction(() => diagnostics.some(d => d.name === 'teacher' && d.code === 'hydrate-apply-failed'));
  assert.deepEqual(await badParent.evaluate(() => document.getElementById('teacher').contentWindow.__logExample.getState()), original, 'Bad initial hydration leaves the pristine state intact');
  await badParent.evaluate(() => send('teacher', 'mathexam:request-trainer-state'));
  await badParent.waitForFunction(() => diagnostics.some(d => d.name === 'teacher' && d.code === 'message-before-hydration'));
  assert.equal(await badParent.evaluate(() => updates.filter(item => item.name === 'teacher').length), 0, 'Rejected hydration must not mark the bridge ready');
  await badParent.evaluate(value => {
   document.getElementById('teacher').contentWindow.postMessage({...ready.teacher,type:'mathexam:hydrate',mode:'state',state:value},location.origin);
   send('teacher', 'mathexam:request-trainer-state');
  }, original);
  await badParent.waitForFunction(() => updates.some(item => item.name === 'teacher'));
  await badParent.frameLocator('#teacher').locator('#hint').click();
  await badParent.waitForFunction(() => updates.some(item => item.name === 'teacher' && item.state.helps.includes(0)));
  assert.equal(await badParent.evaluate(k => localStorage.getItem(k), key), null);
  assert.deepEqual(errors, []);
  console.log('PROFILE_LOG_ONE_EXAMPLE_BROWSER_OK: 18 steps at desktop/375px, wrong answers, hints, explicit Next, notebook, keyboard axes, exact drafts/reload, reset/cancel, malformed restore, stale tabs and bidirectional silent iframe hydration.');
 } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
