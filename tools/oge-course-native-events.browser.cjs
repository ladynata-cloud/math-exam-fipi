'use strict';

// Real browser input/click dispatch, not evaluate(element.click()). The bridge
// boundary is a recorder here; the separate transport suite exercises the real
// SDK/server, authorization, handoff and late joining with the same adapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const entries = require('./fixtures/oge-course-board-entries.json').concat([
  {trainerId:'oge-task15-triangles',file:'trainers/oge-task15-triangles.html'},
  {trainerId:'oge-task16-circle',file:'trainers/oge-task16-circle.html'},
  {trainerId:'oge-task17-quadrilaterals',file:'trainers/oge-task17-quadrilaterals.html'},
  {trainerId:'oge-task18-grid',file:'trainers/oge-task18-grid.html'},
  {trainerId:'oge-task19',file:'trainers/task19-trainer.html'}
]);
const stages = { 10:'#mar-root', 11:'#m4', 12:'#taskArea', 13:'section.main', 14:'#m-task' };
const checks = { 10:'button[id$="-ck"]', 11:'#m4-check', 12:'#checkBtn', 13:'#check', 14:'#m-ck' };
const hints = { 10:'.minimal-hint', 11:'#m4-hint', 12:'.minimal-hint', 13:'#hintToggle', 14:'#m-solve' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/trainers/trainer-board.html' && url.searchParams.has('nativeHarness')) {
    const entry = entries.find(item => item.file === url.searchParams.get('trainer'));
    if (!entry) { res.writeHead(400).end(); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><meta charset="utf-8"><style>body{margin:0}iframe{display:block;width:100%;height:100vh;border:0}</style><iframe name="native-trainer" src="/' + entry.file + '?board=1"></iframe>');
    return;
  }
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch (_) { res.writeHead(400).end(); return; }
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (file.endsWith('/board-bridge.js')) { res.setHeader('Content-Type', 'text/javascript'); res.end('/* test boundary installed before native code */'); return; }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
let browser;
const records = [];
const hosts = new WeakMap();
const snapshot = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__nativeBoard.getState())));

async function boot(context, origin, entry, errors) {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(entry.trainerId + ': ' + error.message));
  await page.goto(origin + '/trainers/trainer-board.html?nativeHarness=1&trainer=' + encodeURIComponent(entry.file));
  const frame = page.frame({name:'native-trainer'});
  assert(frame, entry.trainerId + ': native trainer is embedded like the actual board');
  await frame.waitForFunction(() => !!window.__nativeBoard);
  assert.equal(await frame.evaluate(() => window.__nativeBoard.id), entry.trainerId);
  await page.waitForTimeout(30);
  hosts.set(frame,page);
  return frame;
}

async function run(context, origin, entry) {
  const errors = [], teacher = await boot(context, origin, entry, errors), pupil = await boot(context, origin, entry, errors);
  let actions = 0;
  async function mirror() {
    const state = await snapshot(teacher), before = await pupil.evaluate(() => window.__nativePublications.length);
    await pupil.evaluate(value => window.__nativeBoard.applyState(value), state);
    await hosts.get(pupil).waitForTimeout(40);
    assert.deepEqual(await snapshot(pupil), state, entry.trainerId + ': exact native peer restoration');
    assert.equal(await pupil.evaluate(() => window.__nativePublications.length), before, entry.trainerId + ': apply must not echo');
  }
  async function act(label, action) {
    const before = JSON.stringify(await snapshot(teacher));
    const count = await teacher.evaluate(() => window.__nativePublications.length);
    await action();
    // No follow-up event is allowed to flush a stale or missed notification.
    await teacher.waitForFunction(({before,count}) => {
      const current = JSON.stringify(window.__nativeBoard.getState());
      return current !== before && window.__nativePublications.length > count &&
        JSON.stringify(window.__nativePublications.at(-1)) === current;
    }, {before,count}, {timeout:5000}).catch(error => { throw new Error(entry.trainerId + ' / ' + label + ': native action did not publish its completed state without another event', {cause:error}); });
    await mirror(); actions++;
  }
  const click = (label, locator) => act(label, () => locator.first().click());
  const fill = (label, locator, value='-987654') => act(label, () => locator.first().fill(value));
  try {
    await mirror();
    const n = Number(entry.trainerId.match(/^oge-task(\d+)/)?.[1]);
    if (n >= 6 && n <= 9) {
      const stage = teacher.locator('#oge-foundation-stage');
      if (n === 7) await click('answer choice', stage.locator('.optbtn'));
      else {
        await fill('answer draft', stage.locator('input:not([type=range]):not([type=checkbox]):visible'));
        await click('check answer', stage.getByRole('button', {name:'Проверить',exact:true}));
      }
      await click('hint', stage.getByRole('button', {name:'Хочешь подсказку?',exact:true}));
    } else if (n >= 10 && n <= 14) {
      const stage = teacher.locator(stages[n]);
      if (n === 13) await click('answer choice', stage.locator('#chips button,#choices button'));
      else await fill('answer draft', stage.locator(n === 11 ? '#m4-answer' : 'input:not([type=range]):not([type=checkbox]):visible'), n === 11 ? '111' : '-987654');
      await click('check answer', stage.locator(checks[n]));
      await click('hint', stage.locator(hints[n]));
      if (n === 10) {
        await click('probability model', stage.locator('.oca-exploration > details > summary'));
        await click('one native outcome after help already used', stage.locator('.oca-outcomes button'));
      }
    } else if (n === 15) {
      await fill('answer draft', teacher.locator('#board-answer'));
      await click('check answer', teacher.locator('#board-check'));
      await click('hint', teacher.locator('#board-hint'));
      await click('reference', teacher.locator('#board-reference'));
      await click('guided solution', teacher.locator('#board-guide'));
      await click('show first step', teacher.locator('[data-step-reveal="0"]'));
    } else if (n >= 16 && n <= 18) {
      await fill('answer draft', teacher.locator(n === 18 ? '#ansIn' : '#ans'));
      await click('check answer', teacher.locator(n === 16 ? '#check' : n === 17 ? '#chk' : '#chkBtn'));
      await click('native help', teacher.locator('#courseHintToggle'));
      const model = teacher.locator('[data-geometry-model]').first();
      await click('open native geometry model', model.locator(':scope > summary'));
      const slider = model.locator('input[type=range]').first();
      if (await slider.count()) await act('one native geometry slider edit', async () => {const key = await slider.evaluate(el => Number(el.value) >= Number(el.max) ? 'ArrowLeft' : 'ArrowRight'); await slider.focus(); await slider.press(key);});
      const toggle = model.locator('button[aria-pressed]').first();
      if (await toggle.count()) await click('one native geometry model button', toggle);
    } else if (n === 19) {
      await click('statement hint', teacher.locator('#hintToggle'));
      await click('native measurement', teacher.locator('.t19-measure'));
      await click('statement choice', teacher.locator('#btnTrue'));
      await click('settings disclosure', teacher.locator('#settings > summary'));
    } else if (n >= 20 && n <= 22) {
      const stage = teacher.locator('.oge-native-shared-stage');
      if (n === 22) await click('add a single answer value', stage.getByRole('button', {name:'+ отдельное значение',exact:true}));
      await fill('answer draft', stage.locator('input:not([type=range]):not([type=checkbox]):visible'));
      await click('check answer', stage.getByRole('button', {name:'Проверить',exact:true}));
      await click('hint', stage.getByRole('button', {name:'Хочешь подсказку?',exact:true}));
    } else if (n >= 23 && n <= 25) {
      if (n === 24) {
        await click('proof card', teacher.locator('[data-board-action^="card:"]'));
        await click('open native help', teacher.locator('#courseHintToggle'));
        await click('proof hint', teacher.locator('[data-board-action="hint"]'));
      } else {
        await fill('answer draft', teacher.locator(n === 23 ? '.train-host input.ans-inp' : '#panel-train input[data-ai]'));
        await click('check answer', teacher.locator('[data-board-action="' + (n === 23 ? 'answer' : 'tr-check') + '"]'));
        await click('open native help', teacher.locator('#courseHintToggle'));
        await click('guided solution', teacher.locator('[data-board-action="' + (n === 23 ? 'guide' : 'tr-hint') + '"]'));
      }
    } else if (entry.trainerId === 'practice-1-5-entry-diagnostic-2026') {
      await click('start', teacher.locator('#start-btn'));
      await fill('answer draft', teacher.locator('#answer-control'));
      await click('next task', teacher.locator('#next-btn'));
    } else if (entry.trainerId === 'practice-1-5-plan-reading') {
      await click('answer choice', teacher.locator('.option[data-index="0"]'));
      await click('check choice', teacher.locator('#check'));
      await click('next task', teacher.locator('#next'));
    } else if (entry.trainerId === 'practice-1-5-routes-checkpoint-2026') {
      await click('start', teacher.locator('#start'));
      await fill('answer draft', teacher.locator('#answer-input'));
      await click('next task', teacher.locator('#next'));
    } else if (entry.trainerId === 'percent-table-trainer') {
      await fill('answer draft', teacher.locator('#practice-input'));
      await click('check answer', teacher.locator('#practice-check'));
      await click('hint', teacher.locator('#hint-btn'));
    } else {
      const card = teacher.locator('.pv-shell .pv-question').first();
      const field = card.locator('[data-pv-field]').first();
      if (await field.evaluate(el => el.tagName) === 'SELECT') {
        const value = await field.evaluate(el => [...el.options].find(option => option.value !== el.value && !option.disabled).value);
        await act('answer choice', () => field.selectOption(value));
      } else await fill('answer draft', field);
      await click('check answer', card.locator('.pv-check'));
      await click('native help', card.locator('.pv-help-button'));
    }
    for (const kind of ['oca-work','ocp-writing']) {
      const notes = teacher.locator('.' + kind).filter({has:teacher.locator('textarea')}).first();
      if (!await notes.count()) continue;
      if (await notes.evaluate(el => el.tagName === 'DETAILS' && !el.open)) await click('open notebook', notes.locator(':scope > summary'));
      await fill('native notebook normalization', notes.locator('textarea'), 'x < 5; y > 2');
      const value = await notes.locator('textarea').inputValue();
      assert.equal(value, 'x ＜ 5; y ＞ 2', entry.trainerId + ': native note normalization');
    }
    assert.deepEqual(errors, [], entry.trainerId + ': native runtime');
    assert.equal(await teacher.evaluate(() => window.__personalAccesses), 0);
    assert.equal(await pupil.evaluate(() => window.__personalAccesses), 0);
    records.push({id:entry.trainerId,actions});
    console.log('NATIVE_EVENTS_OK ' + entry.trainerId + ' ' + actions);
  } finally { await hosts.get(teacher).close(); await hosts.get(pupil).close(); }
}

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1280,height:900}});
  await context.addInitScript(() => {
    window.__nativePublications = []; window.__personalAccesses = 0;
    Object.defineProperty(window,'localStorage',{get(){window.__personalAccesses++;throw Error('Shared native browser touched personal storage');}});
    window.MathExamBoard = {register(config){window.__nativeBoard=config;config.subscribe(() => window.__nativePublications.push(JSON.parse(JSON.stringify(config.getState()))));}};
  });
  const failures = [];
  for (const entry of entries) {
    try { await run(context,origin,entry); }
    catch (error) { failures.push(entry.trainerId + ': ' + error.message); console.error(error); }
  }
  assert.deepEqual(failures, [], 'Every native trainer must pass; failures are collected without skipping later pages');
  assert.equal(records.length,30);
  console.log(JSON.stringify({marker:'OGE_NATIVE_BROWSER_EVENTS_OK',trainers:records.length,actions:records.reduce((sum,item)=>sum+item.actions,0),personalAccesses:0,productionRoomWrites:0}));
})().catch(error => {console.error(error);process.exitCode=1;}).finally(async () => {await browser?.close();server.close();});
