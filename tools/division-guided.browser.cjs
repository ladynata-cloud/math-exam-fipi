'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const G = require('../trainers/oge-basics/multiplication-division/division-guided-core');
const relative = '/trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html';
const KEY = 'mathExamBasics.guidedDivision.v1';
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  try { res.setHeader('Content-Type', types[path.extname(file)] || 'text/plain'); res.end(fs.readFileSync(file)); }
  catch { res.writeHead(404); res.end(); }
});
async function ready(page, url) { await page.goto(url); await page.waitForFunction(() => window.__divisionGuidedDebug); }
async function snapshot(page) { return page.evaluate(() => window.__divisionGuidedDebug.state()); }
async function one(page, wrong = false) {
  const state = await snapshot(page), s = state.sessions[state.active], p = G.plan(s.task);
  if (s.done) return false;
  if (s.accepted) { await page.locator('#primary').click(); return true; }
  const a = p.actions[s.step];
  if (a.options) await page.locator('[data-option="' + (wrong ? 'нет' : a.answer) + '"]').click();
  else await page.locator('#answer').fill(wrong ? '9999' : a.answer);
  await page.locator('#primary').click();
  return true;
}
async function finish(page) {
  for (let guard = 0; guard < 220; guard++) if (!(await one(page))) return;
  throw Error('Example did not finish');
}
async function topic(page, id) {
  await page.locator('#topics-open').click(); await page.locator('[data-topic="' + id + '"]').click();
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + relative;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  const errors = [];
  try {
    const context = await browser.newContext({viewport:{width:1280,height:900}});
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await ready(page, url);
    assert.equal(await page.locator('#problem').innerText(), '48 : 2');
    if (process.env.DIVISION_SCREENSHOTS) { fs.mkdirSync(process.env.DIVISION_SCREENSHOTS,{recursive:true}); await page.screenshot({path:path.join(process.env.DIVISION_SCREENSHOTS,'first-desktop.png'),fullPage:true}); }
    assert.equal(await page.locator('dialog').isVisible(), false);
    assert.equal(await page.locator('#answer').isVisible(), true);
    await page.locator('#primary').click();
    assert.equal((await snapshot(page)).sessions.start.step, 0, 'empty input never accepted');
    await one(page, true); assert.equal((await snapshot(page)).sessions.start.errors, 1);
    await page.locator('#help-toggle').click(); await page.locator('#reveal').click();
    assert.match(await page.locator('#revealed').innerText(), /4/);
    await page.locator('#answer').fill('4'); await page.locator('#primary').click();
    assert.equal(await page.locator('#primary').innerText(), 'Дальше');
    assert.equal((await snapshot(page)).sessions.start.step, 0, 'correct answer waits for deliberate continuation');
    await page.reload(); await page.waitForFunction(() => window.__divisionGuidedDebug);
    assert.equal(await page.locator('#primary').innerText(), 'Дальше');
    assert.equal((await snapshot(page)).sessions.start.reveals, 1);
    await finish(page);
    assert.equal(await page.locator('.quotient').innerText(), '24');
    assert.equal((await snapshot(page)).records.length, 1);
    assert.match(await page.locator('#completion-text').innerText(), /помощью/);
    await page.reload(); await page.waitForFunction(() => window.__divisionGuidedDebug);
    assert.equal((await snapshot(page)).records.length, 1, 'reload does not duplicate completion');
    await page.locator('#repeat-example').click(); await finish(page);
    assert.equal((await snapshot(page)).records[1].repeated, true);
    await page.locator('#next-example').click(); assert.equal(await page.locator('#problem').innerText(), '69 : 3');
    await page.locator('#answer').fill('6'); await page.reload(); await page.waitForFunction(() => window.__divisionGuidedDebug);
    assert.equal(await page.locator('#answer').inputValue(), '6', 'draft survives reload');
    await page.locator('#topics-open').click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('#answer').inputValue(), '6', 'cancel topic picker keeps draft');
    if (process.env.DIVISION_SCREENSHOTS) fs.mkdirSync(process.env.DIVISION_SCREENSHOTS,{recursive:true});
    for (const t of G.topics.filter(t => t.id !== 'start')) {
      await topic(page, t.id); await finish(page);
      const s = (await snapshot(page)).sessions[t.id], p = G.plan(s.task);
      assert.equal(s.done, true, t.id);
      if (process.env.DIVISION_SCREENSHOTS) await page.screenshot({path:path.join(process.env.DIVISION_SCREENSHOTS,t.id+'-desktop.png'),fullPage:true});
      if (!p.micropractice) {
        assert.equal((await page.locator('.quotient').innerText()).replaceAll('·',''), p.quotient, t.id + ' written answer');
        assert.equal(await page.locator('.number-row').evaluateAll(rows => rows.every(row => {const tops=[...row.children].map(cell=>cell.getBoundingClientRect().top);return Math.max(...tops)-Math.min(...tops)<1;})),true,t.id+' all cells of a notebook row share one baseline');
        assert.equal(await page.locator('.subtraction').count() > 0, true, t.id + ' written products');
        for (const text of (await page.locator('.working .number-row').allTextContents()).slice(1)) assert.doesNotMatch(text.replace(/[\s−]/g,''), /^0\d/, t.id + ' no padded partial dividends');
      }
    }
    await topic(page, 'start'); assert.equal(await page.locator('#answer').inputValue(), '6');
    await ready(page, url + '#zero'); await page.waitForFunction(()=>window.__divisionGuidedDebug.state().active==='zero'); assert.equal((await snapshot(page)).active, 'zero');
    await topic(page, 'oneDigit'); await page.reload(); await page.waitForFunction(() => window.__divisionGuidedDebug);
    assert.equal((await snapshot(page)).active, 'oneDigit', 'chosen topic survives hash reload');
    // Clipboard denial always offers selectable report text.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:() => Promise.reject(Error('denied'))}}));
    await page.locator('#results summary').click(); await page.locator('#report-copy').click();
    assert.equal(await page.locator('#report-text').isVisible(), true);
    assert.match(await page.locator('#report-text').inputValue(), /пошагово/);
    // A second tab cannot silently overwrite the current persisted attempt.
    const other = await context.newPage(); await ready(other, url);
    await other.locator('#next-example').click();
    await page.waitForFunction(() => !document.getElementById('storage-notice').hidden);
    const durable = await other.evaluate(key => localStorage.getItem(key), KEY);
    await page.locator('#repeat-example').click();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), durable);
    await context.close();
    for (const width of [320,390]) {
      const mobile = await browser.newContext({viewport:{width,height:844}});
      const p = await mobile.newPage(); p.on('pageerror', error => errors.push(error.message));
      await ready(p, url);
      if (process.env.DIVISION_SCREENSHOTS) await p.screenshot({path:path.join(process.env.DIVISION_SCREENSHOTS,'first-'+width+'.png'),fullPage:true});
      await finish(p);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, width + ' no horizontal document overflow');
      await topic(p, 'appendZeros'); await finish(p);
      assert.equal(await p.locator('.quotient').innerText(), '0,125');
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, width + ' decimals fit page');
      if (process.env.DIVISION_SCREENSHOTS) { fs.mkdirSync(process.env.DIVISION_SCREENSHOTS,{recursive:true}); await p.screenshot({path:path.join(process.env.DIVISION_SCREENSHOTS,'division-'+width+'.png'),fullPage:true}); }
      await mobile.close();
    }
    const broken = await browser.newContext(); const p = await broken.newPage();
    await p.addInitScript(key => localStorage.setItem(key, '{broken'), KEY); await ready(p, url);
    assert.equal(await p.locator('#storage-notice').isVisible(), true);
    await finish(p); assert.equal(await p.evaluate(key => localStorage.getItem(key), KEY), '{broken');
    await broken.close();
    assert.deepEqual(errors, []);
    console.log('DIVISION_GUIDED_NAVIGATION_OK: nine topics, explicit continuation, notebook, hints, exact resume, topic restore, report fallback, duplicate prevention, stale tabs, corrupt storage and 320/390px.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
