'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const os = require('node:os'), { execFileSync } = require('node:child_process'), { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), data = require('./fixtures/h35-algebra-conditions.json');
const out = process.env.H35_ARTIFACTS || path.join(os.tmpdir(), 'mathexam-h35-artifacts');
fs.mkdirSync(out, { recursive: true });
const report = { checks: [], pages: [], errors: [] }, onlineOnly = process.argv.includes('--online-only');
const routes = { systems: '/trainers/linear-systems-trainer.html', quadratic: '/trainers/quadratic-inequalities-lab.html' };
const act = (p, name, value) => p.locator(`[data-action="${name}"]${value === undefined ? '' : `[data-value="${value}"]`}`).first();
const snapshot = p => p.evaluate(() => H35App.snapshot());
async function checkLayout(page, width, name) {
  const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth, boxes: ['#condition', '#model', '#learning-step h2', '#learning-step button'].map(s => { const e = document.querySelector(s), r = e.getBoundingClientRect(); return { selector: s, x: r.x, y: r.y, width: r.width, height: r.height }; }) }));
  // Keep the measured failure and screenshot, not only the assertion message.
  await page.screenshot({ path: path.join(out, name + '-' + width + '.png'), fullPage: true });
  report.pages.push({ name, width, layout });
  const evidence = ' ' + JSON.stringify(layout);
  assert(layout.scroll <= width + 1, name + ' no horizontal overflow' + evidence);
  for (const b of layout.boxes) { assert(b.width > 0 && b.height > 0 && b.x >= -1 && b.x + b.width <= width + 1, name + ' readable ' + b.selector + evidence); }
  assert(layout.boxes[0].y < 900 && layout.boxes[1].y + layout.boxes[1].height < 900, name + ' condition and full model in first viewport' + evidence);
  assert(layout.boxes[2].y < 900 && layout.boxes[3].y < 900, name + ' first forecast visible' + evidence);
}
async function research(page, method) {
  assert.equal((await snapshot(page)).active.state.phase, 0);
  const prediction = act(page, 'predict', 'unsure'); await prediction.focus(); await page.keyboard.press('Enter');
  assert.equal((await snapshot(page)).active.state.phase, 1);
  assert(await act(page, 'conclusion').isDisabled());
  if (method === 'quadratic') for (const value of ['left', 'middle', 'right', 'roots']) await act(page, 'probe-zone', value).click();
  else {
    await act(page, 'observe').click();
    const slider = page.locator('#probe'); await slider.focus(); await page.keyboard.press('ArrowRight');
    assert.notEqual(await slider.inputValue(), '0'); await act(page, 'observe').click();
  }
  assert(!await act(page, 'conclusion').isDisabled()); await act(page, 'conclusion').click();
  assert.equal((await snapshot(page)).active.state.phase, 2); await act(page, 'practice').click();
}
async function answer(page, method, t) {
  const s = (await snapshot(page)).active.state;
  if (method === 'quadratic') {
    const wanted = ['gt', 'gte'].includes(t.sign) ? [true, false, true] : [false, true, false];
    for (let i = 0; i < 3; i++) if ((await snapshot(page)).active.state.zones[i] !== wanted[i]) await act(page, 'zone', String(i)).click();
    await act(page, 'endpoints', String(['gte', 'lte'].includes(t.sign))).click(); await page.locator('#answer-form button[type=submit]').click(); return;
  }
  if (s.mode === 'learn' && method !== 'graph') {
    await act(page, 'choice', method === 'sub' ? 'equal' : t.second).click(); await page.locator('#answer-form button[type=submit]').click();
    await page.locator('#answer').fill(String(method === 'sub' ? t.x : t.mainVal)); await page.locator('#answer').press('Enter');
    await page.locator('#answer').fill(String(method === 'sub' ? t.y : t.secondVal)); await page.locator('#answer').press('Enter');
  }
  const pair = method === 'add' ? (t.main === 'x' ? [t.mainVal, t.secondVal] : [t.secondVal, t.mainVal]) : [t.x, t.y];
  await page.locator('#answer').fill(pair.join(';')); await page.locator('#answer').press('Enter');
}
async function pendingFailure(browser, base, kind) {
  const context = await browser.newContext(), page = await context.newPage();
  await page.addInitScript(kind => {
    const original = Storage.prototype.setItem, get = Storage.prototype.getItem;
    window.h35Fail = false;
    Storage.prototype.setItem = function (k, v) { if (window.h35Fail && k.startsWith('mathExam.h35Algebra.')) throw new DOMException('blocked', kind); return original.call(this, k, v); };
    if (kind === 'SecurityError') Storage.prototype.getItem = function (k) { if (window.h35Fail && k.startsWith('mathExam.h35Algebra.')) throw new DOMException('blocked', kind); return get.call(this, k); };
  }, kind);
  await page.goto(base + routes.systems); await act(page, 'fresh').click();
  await page.evaluate(() => { window.h35Fail = true; });
  await page.locator('#answer').fill('2;3'); await page.locator('#answer').press('Enter');
  assert.equal((await snapshot(page)).stats.independent, 0); assert.equal((await snapshot(page)).stats.pending, 1);
  assert(await page.locator('#storage-notice').isVisible());
  await page.evaluate(() => { window.h35Fail = false; }); await act(page, 'retry-save').click();
  assert.equal((await snapshot(page)).stats.independent, 1); await page.reload();
  assert.equal((await snapshot(page)).stats.independent, 1); assert.equal((await snapshot(page)).active.state.drafts[3], '2;3');
  report.checks.push({ case: kind + ' then successful retry and reload', status: 'PASS' }); await context.close();
}
(async () => {
  let server, browser, temp;
  try {
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
    server = http.createServer((req, res) => { try { let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname)); assert(file.startsWith(root + path.sep)); if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res); } catch (_) { res.writeHead(404).end(); } });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const base = 'http://127.0.0.1:' + server.address().port;
    const executablePath = process.env.H35_CHROMIUM || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
    browser = await chromium.launch({ headless: true, executablePath });
    for (const width of [320, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.route('**/*', r => new URL(r.request().url()).origin === base ? r.continue() : r.abort());
      const page = await context.newPage(); page.on('pageerror', e => report.errors.push(String(e)));
      for (const course of ['systems', 'quadratic']) {
        await page.goto(base + routes[course], { waitUntil: 'load' }); await page.waitForFunction(() => window.H35App);
        await checkLayout(page, width, course);
        const methods = course === 'systems' ? ['graph', 'sub', 'add'] : ['quadratic'];
        for (const method of methods) {
          if (course === 'systems' && method !== 'graph') await act(page, 'method', method).click();
          const independentBefore = (await snapshot(page)).stats.independent;
          await research(page, method); await answer(page, method, data[method][0]);
          assert((await snapshot(page)).active.state.done); assert.equal((await snapshot(page)).stats.independent, independentBefore);
          await act(page, 'fresh').click(); const state = await snapshot(page); assert.equal(state.active.state.taskId, method + '-2'); assert(!state.active.state.help); assert(!state.active.state.familiar);
          if (method === 'add') assert(!(await page.locator('#workspace').textContent()).includes(data.add[1].add));
          if (method === 'sub') assert(!(await page.locator('#workspace').textContent()).includes(data.sub[1].eq));
          assert.equal(await page.locator('[data-answer-label]').count(), 0);
          await page.reload(); assert.equal((await snapshot(page)).active.state.taskId, method + '-2');
          await answer(page, method, data[method][1]); const solved = await snapshot(page); assert(solved.active.state.done);
          const count = solved.stats.independent; await page.keyboard.press('Enter'); await page.reload(); assert.equal((await snapshot(page)).stats.independent, count);
          report.checks.push({ case: method + ' prediction, experiment, guided work, fresh independent, reload and Enter', width, status: 'PASS' });
        }
      }
      await context.close();
    }
    // A real second page retains its visible draft while another page completes
    // the attempt; its late edit is archived, never applied to the new step.
    {
      const context = await browser.newContext(), a = await context.newPage(), b = await context.newPage();
      await a.goto(base + routes.systems); await act(a, 'fresh').click(); await a.locator('#answer').fill('1;1');
      await b.goto(base + routes.systems); await act(b, 'hint').click(); await answer(b, 'graph', data.graph[1]);
      await a.waitForFunction(() => !document.getElementById('conflict-notice').hidden);
      assert.equal(await a.locator('#answer').inputValue(), '1;1'); await a.locator('#answer').fill('7;8');
      const s = await snapshot(a); assert(s.active.state.done); assert(s.active.state.help); assert.equal(s.stats.independent, 0);
      assert(s.active.archives.some(v => v.state.drafts[3] === '7;8')); await a.reload(); assert.equal((await snapshot(a)).stats.assisted, 1);
      report.checks.push({ case: 'two real tabs: newer result, stale draft archive, assistance retained', status: 'PASS' }); await context.close();
    }
    for (const kind of ['QuotaExceededError', 'SecurityError']) await pendingFailure(browser, base, kind);
    {
      const context = await browser.newContext(), page = await context.newPage();
      const legacy = '{"foreignRoot":{"keep":[1,"two"]},"topics":{"other":{"keep":true},"linearSystemsTrainer":{"solved":15,"correct":12}},"quadraticInequalitiesLab":{"solved":27,"correct":20}}';
      await page.goto(base + routes.systems); await page.evaluate(text => localStorage.setItem('mathExamCourseProgress.v1', text), legacy); await page.reload();
      assert.match(await page.locator('#progress').textContent(), /неизвестны помощь и повтор/);
      await act(page, 'fresh').click(); await act(page, 'reveal').click(); assert(!(await snapshot(page)).active.state.done); await answer(page, 'graph', data.graph[1]);
      await page.goto(base + routes.quadratic); await act(page, 'fresh').click(); await act(page, 'reveal').click();
      assert.deepEqual((await snapshot(page)).active.state.zones, [false, false, false]); await page.locator('#answer-form button[type=submit]').click(); assert(!(await snapshot(page)).active.state.done);
      await answer(page, 'quadratic', data.quadratic[1]); assert.equal((await snapshot(page)).stats.independent, 0); assert.equal((await snapshot(page)).stats.assisted, 1);
      await page.keyboard.press('Enter'); await page.reload(); assert.equal((await snapshot(page)).stats.assisted, 1);
      assert.equal(await page.evaluate(() => localStorage.getItem('mathExamCourseProgress.v1')), legacy);
      report.checks.push({ case: 'shared historical bytes, answer reveal, repeated submit and reload', status: 'PASS' }); await context.close();
    }
    if (!onlineOnly) {
      const directory = path.join(root, 'downloads/trainers/linear-systems-trainer'), standalone = path.join(directory, 'linear-systems-trainer.html');
      const zip = path.join(directory, 'linear-systems-trainer-package.zip'); temp = fs.mkdtempSync(path.join(os.tmpdir(), 'h35-offline-'));
      execFileSync('unzip', ['-q', zip, '-d', temp]);
      const extracted = path.join(temp, 'linear-systems-trainer.html'); assert(fs.existsSync(extracted), 'the original archive entry name remains usable');
      assert.equal(fs.readFileSync(extracted, 'utf8'), fs.readFileSync(standalone, 'utf8'));
      for (const file of [standalone, extracted]) {
        const context = await browser.newContext({ viewport: { width: 320, height: 900 } }); let network = 0;
        await context.route('http://**/*', r => { network++; return r.abort(); }); await context.route('https://**/*', r => { network++; return r.abort(); });
        const page = await context.newPage(); page.on('pageerror', e => report.errors.push(String(e))); await page.goto('file://' + file); await page.waitForFunction(() => window.H35App);
        assert.equal(await page.locator('script[src],link[rel=stylesheet][href]').count(), 0, 'self-contained file');
        await research(page, 'graph'); await answer(page, 'graph', data.graph[0]);
        await act(page, 'method', 'sub').click(); await research(page, 'sub'); await answer(page, 'sub', data.sub[0]);
        await act(page, 'method', 'add').click(); await research(page, 'add'); await answer(page, 'add', data.add[0]);
        assert.equal((await snapshot(page)).stats.assisted, 3); assert.equal(network, 0, 'offline exercise needs no network');
        await page.reload(); assert.equal((await snapshot(page)).stats.assisted, 3);
        report.checks.push({ case: 'offline ' + (file === standalone ? 'standalone HTML' : 'extracted ZIP') + ', all three methods and reload', status: 'PASS' });
        await context.close();
      }
    }
    assert.deepEqual(report.errors, []); report.result = onlineOnly ? 'H35_ONLINE_BROWSER_OK' : 'H35_ALGEBRA_BROWSER_OK';
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n'); console.log(report.result, JSON.stringify({ cases: report.checks.length, pages: report.pages.length }));
  } catch (e) { report.result = 'FAIL'; report.error = e.stack; fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n'); console.error(e); process.exitCode = 1; }
  finally { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); if (temp) fs.rmSync(temp, { recursive: true, force: true }); }
})();
