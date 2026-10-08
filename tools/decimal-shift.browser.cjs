'use strict';
// Automated fictional learner journeys; these are software checks, not studies
// of real pupils. The isolated widget page below is served only by this test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const G = require('../trainers/oge-basics/multiplication-division/division-guided-core');
const root = path.resolve(__dirname, '..');
const base = '/trainers/oge-basics/multiplication-division/';
const LEGACY = '/trainers/arifmetika.html?course=preoge&level=n5f';
const GUIDED = base + 'long-division-from-simple-to-decimals.html?course=preoge#decimalDivisor';
const screenshots = process.env.DECIMAL_SCREENSHOTS;
const errors = [];
let origin;
const fixture = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Изолированная проверка сдвига</title><link rel="stylesheet" href="${base}decimal-shift.css">
<style>body{margin:0;padding:12px;box-sizing:border-box;font:18px sans-serif}main{max-width:700px;margin:auto}.spacer{height:1600px;background:linear-gradient(white,#eee)}</style>
<main><div id="fixture"></div></main><div class="spacer">Прокрутка страницы вне запятых</div>
<script src="${base}decimal-shift.js"></script><script>
const params=new URLSearchParams(location.search);window.changes=[];
window.widget=DecimalShift.create(document.getElementById('fixture'),{
 dividend:params.get('a'),divisor:params.get('b'),value:0,locked:false,
 onChange:function(value){window.changes.push(value);}
});
</script></html>`;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://fixture').pathname;
  if (pathname === '/__decimal_fixture.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(fixture); return;
  }
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
function observe(page, label) { page.on('pageerror', error => errors.push(label + ': ' + error.message)); }
const handle = (page, which = 'dividend') => page.locator('.ds-handle[data-number="' + which + '"]');
async function shiftValue(page) { return Number(await handle(page).getAttribute('aria-valuenow')); }
async function paired(page, expected, label) {
  assert.equal(await shiftValue(page), expected, label + ': dividend comma');
  assert.equal(Number(await handle(page, 'divisor').getAttribute('aria-valuenow')), expected, label + ': divisor comma');
}
async function cellWidth(page) {
  return handle(page).evaluate(el => {
    const value = parseFloat(getComputedStyle(el).getPropertyValue('--ds-cell'));
    if (!Number.isFinite(value) || value <= 0) throw Error('Decimal widget needs a measurable --ds-cell');
    return value;
  });
}
async function drag(page, which, delta, outside = false) {
  const control = handle(page, which); await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox(), width = await cellWidth(page);
  assert(box, 'Comma handle is visible');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + delta * width, y + (outside ? 135 : 0), {steps:10});
  await page.mouse.up();
}
async function touchDrag(page, which, delta) {
  const control = handle(page, which); await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox(), width = await cellWidth(page);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x,y}]});
    for (let n = 1; n <= 8; n++) await session.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x:x + delta * width * n / 8,y}]});
    await session.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
  } finally { await session.detach(); }
}
async function reflow(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': no horizontal page overflow');
}
async function shot(page, name) {
  if (!screenshots) return;
  fs.mkdirSync(screenshots, {recursive:true});
  await page.screenshot({path:path.join(screenshots, name + '.png'),fullPage:true});
}
async function isolated(page, dividend, divisor) {
  await page.goto(origin + '/__decimal_fixture.html?' + new URLSearchParams({a:dividend,b:divisor}));
  await handle(page).waitFor({state:'visible'});
}
const guidedState = page => page.evaluate(() => window.__divisionGuidedDebug.state());
const notebookState = page => page.locator('#notebook').evaluate(el => [...el.querySelectorAll('.working,.right-side')].map(part => part.innerHTML));
async function guidedReady(page) { await page.waitForFunction(() => window.__divisionGuidedDebug); }
async function guidedOne(page) {
  const all = await guidedState(page), s = all.sessions[all.active];
  if (s.done) return false;
  if (s.accepted) { await page.locator('#primary').click(); return true; }
  const a = G.plan(s.task).actions[s.step];
  if (a.options) await page.locator('[data-option=' + JSON.stringify(a.answer) + ']').click();
  else await page.locator('#answer').fill(a.answer);
  await page.locator('#primary').click();
  assert((await guidedState(page)).sessions[all.active].accepted, 'Correct guided response is accepted');
  return true;
}
async function guidedFinish(page) {
  for (let i = 0; i < 220; i++) if (!(await guidedOne(page))) return;
  throw Error('Guided division failed to finish');
}
const legacyState = page => page.evaluate(() => ({task,phase,stepIdx,selLen,qDone,errors,finished,stats:structuredClone(stats),draft:document.getElementById('ans').value}));
async function legacyReady(page) { await page.waitForFunction(() => window.levelId === 'n5f' && window.task); }
async function legacyAnswer(page, value) { await page.locator('#ans').fill(String(value)); await page.locator('#check').click(); }
async function legacyOne(page) {
  const s = await legacyState(page);
  if (s.finished) return false;
  if (s.phase === 'select') {
    const wanted = s.task.steps[0].end + 1;
    while ((await legacyState(page)).selLen < wanted) await page.locator('#more').click();
    while ((await legacyState(page)).selLen > wanted) await page.locator('#less').click();
    await page.locator('#selok').click(); return true;
  }
  const value = await page.evaluate(() => {
    if (phase === 'shiftM') return task.m;
    if (phase === 'shiftA') return task.Pval;
    if (phase === 'shiftB') return task.d;
    if (phase === 'digit') return task.steps[stepIdx].qd;
    if (phase === 'mult') return (trialDigit === null ? task.steps[stepIdx].qd : trialDigit) * task.d;
    if (phase === 'sub') return task.steps[stepIdx].rem;
    throw Error('Unexpected legacy phase ' + phase);
  });
  await legacyAnswer(page, String(value).replace('.', ',')); return true;
}
async function legacyFinish(page) {
  for (let i = 0; i < 180; i++) if (!(await legacyOne(page))) return;
  throw Error('Legacy division failed to finish');
}
async function refresh(page, button) {
  await page.locator(button).click();
  const dialog = page.locator('dialog.multiplication-refresh');
  assert(await dialog.isVisible(), 'Multiplication review opens beside division');
  await dialog.locator('.mr-factor').selectOption('7');
  const question = await dialog.locator('.mr-question').innerText();
  const numbers = question.match(/\d+/g).map(Number), correct = numbers[0] * numbers[1];
  await dialog.locator('.mr-check').click();
  assert(await dialog.locator('.mr-next').isDisabled(), 'Blank multiplication response is not accepted');
  await dialog.locator('.mr-answer').fill(String(correct + 1));
  await dialog.locator('.mr-answer').press('Enter');
  assert(await dialog.locator('.mr-next').isDisabled(), 'Wrong multiplication response is not accepted');
  await dialog.locator('.mr-help').click();
  assert(await dialog.locator('.mr-visual').isVisible(), 'The multiplication hint is visual');
  assert.equal(await dialog.locator('.mr-dot').count(), correct, 'Rows contain exactly the represented product');
  await dialog.locator('.mr-answer').fill(String(correct));
  await dialog.locator('.mr-answer').press('Enter');
  assert(await dialog.locator('.mr-next').isEnabled());
  await reflow(page, 'Multiplication dialog');
  await dialog.locator('.mr-return').click();
  assert.equal(await dialog.isVisible(), false);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  try {
    const desktop = await browser.newContext({viewport:{width:1280,height:900}}), page = await desktop.newPage();
    observe(page, 'desktop');
    const pairs = [['4,8','1,2',1,'48','12'],['0,84','0,4',1,'8,4','4'],['0,084','0,4',1,'0,84','4'],['1','0,25',2,'100','25'],['1','0,025',3,'1000','25'],['2,04','0,02',2,'204','2']];
    for (const [a,b,target,resultA,resultB] of pairs) {
      await isolated(page,a,b); await paired(page,0,a + ' : ' + b);
      const initialLefts = await page.locator('.ds-handle').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().left));
      const digitWidth = await cellWidth(page);
      await drag(page,'dividend',target); await paired(page,target,'Dragging dividend in ' + a + ' : ' + b);
      const finalLefts = await page.locator('.ds-handle').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().left));
      finalLefts.forEach((left,i) => assert(Math.abs(left - initialLefts[i] - target * digitWidth) < 1,'Both visible commas move by the same number of digit columns'));
      assert.equal(await page.locator('.ds-result[data-number="dividend"]').innerText(),resultA,'Exact shifted dividend');
      assert.equal(await page.locator('.ds-result[data-number="divisor"]').innerText(),resultB,'Exact shifted divisor');
      await drag(page,'divisor',-target); await paired(page,0,'Dragging divisor back');
      await drag(page,'divisor',target,true); await paired(page,target,'Captured pointer moves outside its handle');
      await handle(page).focus(); await page.keyboard.press('Home'); await paired(page,0,'Keyboard Home');
      await page.keyboard.press('ArrowRight'); await paired(page,1,'Keyboard ArrowRight');
      await page.keyboard.press('ArrowLeft'); await paired(page,0,'Keyboard ArrowLeft');
      await page.locator('.ds-forward').click(); await paired(page,1,'One-place forward button');
      await page.locator('.ds-back').click(); await paired(page,0,'One-place back button');
      await page.evaluate(() => window.widget.setLocked(true));
      await drag(page,'dividend',target); await paired(page,0,'Locked shift cannot move');
    }
    await desktop.close();
    console.log('PASS: both comma handles, six operand pairs, pointer capture, keyboard and locking');

    for (const width of [320,390]) {
      const context = await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true});
      const p = await context.newPage(); observe(p,width + 'px');
      await isolated(p,'1','0,025');
      await touchDrag(p,'divisor',3); await paired(p,3,'Touch drag on ' + width + 'px');
      await reflow(p,'Widget at ' + width + 'px'); await shot(p,'decimal-widget-' + width);
      const cdp = await context.newCDPSession(p);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width - 12,y:740}]});
      for (let n = 1; n <= 8; n++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width - 12,y:740 - 45 * n}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await p.waitForFunction(() => scrollY > 20); await cdp.detach();
      await paired(p,3,'Scrolling outside comma leaves its position unchanged');
      // Real touch cancellation must restore the starting position and must not
      // tell the surrounding trainer that a new draft was committed.
      const control = handle(p,'dividend'); await control.scrollIntoViewIfNeeded();
      const box = await control.boundingBox(), dx = await cellWidth(p);
      const cancelSession = await context.newCDPSession(p), x = box.x + box.width / 2, y = box.y + box.height / 2;
      const callsBefore = await p.evaluate(() => window.changes.length);
      await cancelSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await cancelSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x - dx,y}]});
      await cancelSession.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
      await paired(p,3,'Cancelled touch restores starting position');
      assert.equal(await p.evaluate(() => window.changes.length),callsBefore,'Cancelled touch does not commit a draft');
      await cancelSession.detach();

      await p.goto(origin + GUIDED); await guidedReady(p);
      const initial = await guidedState(p), start = initial.sessions.decimalDivisor;
      assert.equal(start.step,0); assert.equal(start.accepted,false);
      await touchDrag(p,'divisor',2); await paired(p,2,'A learner can try an extra place');
      assert.equal((await guidedState(p)).sessions.decimalDivisor.errors,0,'A wrong drag is not checked automatically');
      assert.equal((await guidedState(p)).sessions.decimalDivisor.accepted,false);
      await p.locator('#primary').click();
      assert.equal((await guidedState(p)).sessions.decimalDivisor.errors,1,'Wrong shift counted only after Check');
      await touchDrag(p,'dividend',-1); await paired(p,1,'Guided touch draft');
      let state = (await guidedState(p)).sessions.decimalDivisor;
      assert.equal(state.draft,'1'); assert.equal(state.step,0); assert.equal(state.accepted,false);
      assert.equal(state.errors,1,'Dragging alone is not a wrong attempt');
      await p.reload(); await guidedReady(p);
      assert.equal(await p.locator('#answer').inputValue(),'1','Dragged draft survives reload');
      await paired(p,1,'Restored paired commas');
      await p.locator('#primary').click();
      state = (await guidedState(p)).sessions.decimalDivisor;
      assert.equal(state.accepted,true); assert.equal(state.step,0,'Check waits for deliberate continuation');
      // Complete the remaining preparation without changing its established four-step plan.
      for (let n = 0; n < 12; n++) {
        const s = (await guidedState(p)).sessions.decimalDivisor;
        if (s.step >= 4) break;
        await guidedOne(p);
      }
      assert.equal((await guidedState(p)).sessions.decimalDivisor.step,4);
      await p.locator('#answer').fill('123');
      const before = await guidedState(p), notebook = await notebookState(p);
      await refresh(p,'#multiplication-refresh');
      const after = await guidedState(p);
      for (const key of ['id','task','step','answers','accepted','done','draft','errors','reveals','repeated']) assert.deepEqual(after.sessions.decimalDivisor[key],before.sessions.decimalDivisor[key],'Multiplication review preserves guided ' + key);
      assert.deepEqual(after.records,before.records,'Multiplication review is not a completed division');
      assert.equal(after.sessions.decimalDivisor.hints,before.sessions.decimalDivisor.hints+1,'One review visit is counted once as assistance');
      assert.deepEqual(await notebookState(p),notebook,'Notebook is preserved while reviewing multiplication');
      await p.reload(); await guidedReady(p);
      assert.equal(await p.locator('#answer').inputValue(),'123','Interrupted review preserves division draft');
      await guidedFinish(p);
      const finished = await guidedState(p);
      assert.equal(finished.records.length,1);
      assert.equal(await p.locator('.quotient').innerText(),'3,2');
      assert((await p.locator('.subtraction').count()) > 0,'Previous calculation rows remain visible');
      await reflow(p,'Completed guided decimal at ' + width + 'px'); await shot(p,'decimal-guided-' + width);

      await p.goto(origin + LEGACY); await legacyReady(p);
      const old = await legacyState(p), wanted = old.task.m;
      await drag(p,'divisor',wanted+1); await paired(p,wanted+1,'Legacy extra place can be explored');
      assert.equal((await legacyState(p)).errors,0,'Exploring a wrong legacy shift is not an error');
      await p.locator('#check').click();
      assert.equal((await legacyState(p)).phase,'shiftM');
      assert.equal((await legacyState(p)).errors,1,'Legacy wrong shift is checked explicitly');
      await drag(p,'dividend',-1); await paired(p,wanted,'Legacy linked drag');
      assert.equal((await legacyState(p)).phase,'shiftM','Legacy drag does not auto-check');
      assert.equal(await p.locator('#ans').inputValue(),String(wanted));
      await p.locator('#check').click();
      assert.equal((await legacyState(p)).phase,'shiftA');
      await legacyAnswer(p,old.task.Pval); await legacyAnswer(p,old.task.d);
      assert.equal((await legacyState(p)).phase,'select');
      await legacyOne(p); await p.locator('#ans').fill('7');
      const oldBefore = await legacyState(p), corner = await p.locator('#cornerwrap').innerHTML();
      await refresh(p,'#multiplication-refresh-button');
      const oldAfter = await legacyState(p);
      for (const key of ['task','phase','stepIdx','selLen','qDone','errors','finished','stats','draft']) assert.deepEqual(oldAfter[key],oldBefore[key],'Multiplication review preserves legacy ' + key);
      assert.equal(await p.locator('#cornerwrap').innerHTML(),corner,'Legacy corner rows survive review');
      await legacyFinish(p);
      assert.equal((await p.locator('#qrow').innerText()).replace(/\s/g,''),old.task.qStr);
      await reflow(p,'Legacy decimal at ' + width + 'px'); await shot(p,'decimal-legacy-' + width);
      await context.close();
      console.log('PASS: ' + width + 'px touch, normal page scroll, explicit checks, durable guided draft, decimal completion and multiplication return in both trainers');
    }
    assert.deepEqual(errors,[],'No browser JavaScript errors');
    console.log('DECIMAL_SHIFT_BROWSER_OK: real pointer/touch/keyboard, six paired operands, 320/390px, retained draft and notebook, unchanged division plans, multiplication review without completion inflation.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); if (errors.length) console.error('Browser errors:',errors); server.close(); process.exitCode = 1; });
