'use strict';
// Real-browser release gate. Browser execution belongs to the cloud CI runner.
if (!process.env.CI) throw new Error('Run this browser gate in cloud CI, not a local browser.');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http'), os = require('node:os');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), out = process.env.PRACTICAL_VARIANT_ARTIFACTS || path.join(root, 'artifacts/oge-practical-variant');
const offline = fs.mkdtempSync(path.join(os.tmpdir(), 'practical-variant-offline-'));
execFileSync('unzip', ['-q', path.join(root, 'downloads/trainers/oge-1-5-trainers/oge-1-5-trainers-package.zip'), '-d', offline]);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://local'), isOffline = url.pathname.startsWith('/offline/'), base = isOffline ? offline : root;
  const file = path.resolve(base, isOffline ? decodeURIComponent(url.pathname.slice(9)) : '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); response.end(fs.readFileSync(file));
});
const slugs = ['roads-grid', 'roads-schema', 'apartments', 'land-plots', 'stoves', 'tariffs', 'paper-sheets'];
const records = []; let browser;
const cards = page => page.locator('.pv-task-stream>.pv-question');
const card = (page, number) => page.locator('.pv-question[data-question="' + number + '"]');
const progress = page => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
async function layout(page, label) {
  const box = await page.evaluate(() => ({ viewport: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(box.html <= box.viewport + 2 && box.body <= box.viewport + 2, label + ': document overflow ' + JSON.stringify(box));
  const wording = await page.locator('.pv-question-condition,.pv-question-condition .q,.pv-condition,.pv-condition *').evaluateAll(nodes => nodes.filter(node => node.matches('.pv-question-condition,.pv-question-condition .q') || node.getClientRects().length && Array.from(node.childNodes).some(child => child.nodeType === 3 && child.textContent.trim())).map(node => parseFloat(getComputedStyle(node).fontSize)));
  assert.ok(wording.every(size => size >= 17.95), label + ': question wording remains readable');
  const fields = await page.locator('.pv-answer-form input,.pv-answer-form select').evaluateAll(nodes => nodes.map(node => ({ font: parseFloat(getComputedStyle(node).fontSize), label: node.getAttribute('aria-label'), width: node.getBoundingClientRect().width })));
  for (const field of fields) { assert.ok(field.font >= 18, label + ': input font'); assert.ok(field.label.length >= 10, label + ': clear answer label'); assert.ok(field.width > 40, label + ': usable input'); }
  const fonts = await page.locator('.pv-primary-visual svg text').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').map(node => {
    const matrix = node.getScreenCTM(), b = node.getBBox(), view = node.ownerSVGElement.viewBox.baseVal;
    return { text: node.textContent, font: parseFloat(getComputedStyle(node).fontSize) * Math.hypot(matrix.a, matrix.b), x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height, left: view.x, top: view.y, width: view.width, height: view.height };
  }));
  assert.ok(fonts.length, label + ': diagram labels present');
  for (const font of fonts) {
    assert.ok(font.font >= 17.95, label + ': primary diagram text too small ' + JSON.stringify(font));
    assert.ok(font.x >= font.left - 1 && font.y >= font.top - 1 && font.right <= font.left + font.width + 1 && font.bottom <= font.top + font.height + 1, label + ': clipped SVG text ' + JSON.stringify(font));
  }
  const cells = await page.locator('.pv-shell table th,.pv-shell table td').evaluateAll(nodes => nodes.filter(node => !node.closest('[hidden]')).map(node => parseFloat(getComputedStyle(node).fontSize)));
  assert.ok(cells.every(size => size >= 17.95), label + ': table text remains readable');
}
async function fillDrafts(page) {
  const fields = page.locator('.pv-answer-form [data-pv-field]');
  for (let index = 0; index < await fields.count(); index++) {
    const input = fields.nth(index);
    if (await input.isDisabled()) continue;
    if (await input.evaluate(node => node.tagName === 'SELECT')) {
      const value = await input.locator('option').evaluateAll(options => options.find(option => option.value)?.value);
      if (value != null) await input.selectOption(value);
    } else await input.fill('12,75');
  }
}
async function help(page, host, label, screenshot) {
  const toggle = host.locator(':scope>.pv-help>.pv-help-button'), panel = host.locator(':scope>.pv-help>.pv-help-panel');
  if (await panel.isVisible()) await toggle.click();
  const before = await progress(page), drafts = await page.locator('.pv-answer-form [data-pv-field]').evaluateAll(nodes => nodes.map(node => node.value));
  const identity = await page.locator('.pv-primary-visual').elementHandle();
  const tables = await page.locator('.pv-shell table').elementHandles();
  await toggle.click(); assert.equal(await panel.isVisible(), true, label + ': help visible');
  const nested = panel.locator(':scope>details').first();
  assert.ok(await nested.count(), label + ': nested discovery');
  if (!(await nested.evaluate(node => node.open))) await nested.locator(':scope>summary').click();
  if (/^roads-(grid|schema) Q1$/.test(label)) {
    assert.equal(await panel.getAttribute('data-discovery-model'), 'road-map', label + ': road-specific identification');
    assert.doesNotMatch(await nested.textContent(), /коридор|комнат|Вход/i, label + ': no apartment model');
    assert.equal(await nested.locator('[data-road-example-node]').count(), 3);
  }
  const control = panel.locator('[data-pd-key]').first();
  if (await control.count()) {
    if (await control.evaluate(node => node.tagName === 'SELECT')) {
      const value = await control.locator('option').last().getAttribute('value'); await control.selectOption(value);
    } else { await control.focus(); await control.press('End'); await control.press('ArrowLeft'); }
  } else {
    const choice = panel.locator('[data-pd-choice]:not([data-pd-choice="zoom"])').first(); assert.ok(await choice.count(), label + ': model action'); await choice.click();
  }
  assert.ok((await panel.locator('.pd-reading').textContent()).length > 10, label + ': discovery response');
  await layout(page, label + ' with discovery open');
  const exact = panel.locator(':scope>.pv-native-help');
  if (await exact.count()) {
    await exact.locator(':scope>summary').click();
    await exact.locator(':scope>.pm-content>*').first().waitFor({ state: 'attached' });
    const full = exact.locator('.pm-content details').first();
    if (await full.count()) { await full.locator(':scope>summary').click(); await layout(page, label + ' with full explanation'); }
    else await layout(page, label + ' with native explanation');
    await exact.locator(':scope>summary').click();
  }
  const model = await panel.locator('[data-pd-key]').evaluateAll(nodes => nodes.map(node => node.value));
  if (screenshot) await panel.screenshot({ path: path.join(out, screenshot) });
  await panel.locator(':scope>.pd-return').click();
  assert.equal(await panel.isVisible(), false, label + ': return closes help');
  assert.equal(await toggle.evaluate(node => node === document.activeElement), true, label + ': clear return focus');
  await toggle.click();
  assert.deepEqual(await panel.locator('[data-pd-key]').evaluateAll(nodes => nodes.map(node => node.value)), model, label + ': experiment retained');
  await toggle.click();
  assert.deepEqual(await page.locator('.pv-answer-form [data-pv-field]').evaluateAll(nodes => nodes.map(node => node.value)), drafts, label + ': all drafts retained');
  assert.equal(await progress(page), before, label + ': help does not award progress');
  assert.equal(await identity.evaluate(node => node === document.querySelector('.pv-primary-visual')), true, label + ': primary figure retained');
  for (const table of tables) assert.equal(await table.evaluate(node => node.isConnected), true, label + ': table remains mounted');
}
async function submit(page, number, values, expected) {
  const host = card(page, number);
  for (const [key, value] of Object.entries(values)) {
    const input = host.locator('[data-pv-field="' + key + '"]');
    if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(String(value));
    else await input.fill(String(value).replace('.', ','));
  }
  await host.locator('.pv-check').click();
  await page.waitForFunction(({ number, expected }) => document.querySelector('.pv-question[data-question="' + number + '"]')?.dataset.result === expected, { number, expected });
}
async function initial(page, slug, width, offlineMode) {
  const prefix = offlineMode ? 'offline-' : '';
  await page.waitForFunction(() => document.documentElement.dataset.practicalVariant === 'ready');
  assert.equal(await cards(page).count(), 5, slug + ': five simultaneously mounted questions');
  assert.equal(await page.locator('.pv-condition').isVisible(), true);
  assert.equal(await page.locator('.pv-primary-visual svg').first().isVisible(), true);
  assert.equal(await page.locator('.pv-primary-visual').evaluate(node => Boolean(node.closest('details,[hidden]'))), false);
  for (let number = 1; number <= 5; number++) {
    assert.equal(await card(page, number).locator('.pv-question-condition').isVisible(), true);
    assert.equal(await card(page, number).locator('.pv-answer-form').isVisible(), true);
    assert.equal(await card(page, number).locator('.pv-help-panel').isVisible(), false);
  }
  await layout(page, prefix + slug + '@' + width);
  if (!offlineMode) {
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    assert.equal(await page.evaluate(() => scrollY), 0, slug + ': main screenshot starts at the page heading');
    await page.screenshot({ path: path.join(out, prefix + 'main-' + slug + '-' + width + '.png') });
    await page.locator('.pv-primary-visual').screenshot({ path: path.join(out, prefix + 'diagram-' + slug + '-' + width + '.png') });
  }
  await fillDrafts(page);
  for (let number = 1; number <= 5; number++) await help(page, card(page, number), slug + ' Q' + number, !offlineMode && width === 360 && number === 1 ? 'help-' + slug + '-' + width + '.png' : null);
  const zoom = page.locator('.pv-primary-visual .pv-zoom').first();
  assert.equal(await zoom.count(), 1, slug + ': primary figure has a zoom control');
  await zoom.click(); assert.equal(await zoom.getAttribute('aria-pressed'), 'true'); await layout(page, slug + ' zoom'); await zoom.click();
  assert.equal(await zoom.getAttribute('aria-pressed'), 'false', slug + ': zoom returns to its original size');
  const scroller = page.locator('.pv-primary-visual .pv-figure-scroll').first();
  await scroller.focus(); await scroller.press('ArrowRight');
  if (!offlineMode && width === 360) {
    await scroller.evaluate(node => { node.scrollLeft = node.scrollWidth; });
    await page.locator('.pv-primary-visual').screenshot({ path: path.join(out, 'diagram-right-' + slug + '-360.png') });
    await scroller.evaluate(node => { node.scrollLeft = 0; });
  }
  await layout(page, prefix + slug + ' after help');
  records.push({ slug, width, offline: offlineMode, stage: 'initial-five-questions-and-help', questions: 5 });
}
async function roadVariants(page, slug) {
  const select = page.locator('.pv-controls select');
  const values = await select.locator('option').evaluateAll(nodes => nodes.map(node => node.value));
  for (const value of values) {
    await select.selectOption(value);
    const numbers = await cards(page).evaluateAll(nodes => nodes.map(node => Number(node.dataset.question)));
    assert.deepEqual(numbers, slug === 'roads-schema' && Number(value) >= 4 ? [5] : [1, 2, 3, 4, 5], slug + ' honest variant coverage ' + value);
    const answers = await page.evaluate(({ slug, value }) => slug === 'roads-grid'
      ? eval('(()=>{const s=currentScenario(),v=currentVariant(),a=computeAnswers(s,v);return [v.ident.map(r=>s.towns[r].num),a.t2,a.t3,a.t4,a.minTotal]})()')
      : eval('VARIANTS[' + Number(value) + '].group === "main" ? [1,2,3,4,5].map(t=>answer(VARIANTS[' + Number(value) + '],t)) : [answer(VARIANTS[' + Number(value) + '],5)]'), { slug, value });
    for (let index = 0; index < numbers.length; index++) {
      const number = numbers[index], fields = slug === 'roads-grid' && number === 1 ? Object.fromEntries(answers[index].map((answer, i) => ['v' + i, answer])) : { answer: answers[index] };
      if (!(slug === 'roads-grid' && number === 1)) await submit(page, number, { answer: '-999' }, 'incorrect');
      await submit(page, number, fields, 'correct');
    }
    await layout(page, slug + ' variant ' + value);
    records.push({ slug, width: 1280, variant: value, stage: 'native-grading', questions: numbers.length });
  }
  if (slug === 'roads-grid') {
    await page.getByRole('button', { name: 'Новый случайный вариант', exact: true }).click();
    assert.equal(await cards(page).count(), 5);
    const expected = await page.evaluate(() => eval('computeAnswers(currentScenario(),currentVariant()).t3'));
    await submit(page, 3, { answer: expected }, 'correct');
    records.push({ slug, width: 1280, stage: 'generated-native-grading', questions: 1 });
  }
}
async function allSubtypes(page, slug) {
  if (slug === 'apartments') {
    const groups = { 1: ['1'], 2: ['2.1', '2.2'], 3: ['3.1', '3.2'], 4: ['4.1', '4.2'], 5: ['5.1', '5.2', '5.3'] };
    for (let plan = 0; plan < 3; plan++) {
      await page.locator('.pv-shell').getByRole('combobox', { name: 'План квартиры', exact: true }).selectOption(String(plan));
      for (const [group, values] of Object.entries(groups)) for (const value of values) {
        if (group !== '1') await card(page, group).getByRole('combobox', { name: 'Вариант задания ' + group, exact: true }).selectOption(value);
        assert.equal(await card(page, group).getAttribute('data-pv-building-type'), value);
        await help(page, card(page, group), slug + ' plan ' + plan + ' type ' + value);
        records.push({ slug, width: 1280, plan, prototype: value, stage: 'canonical-help' });
      }
      for (const group of [3, 4]) {
        await card(page, group).getByRole('button', { name: group === 3 ? 'Другое помещение' : 'Другая пара помещений', exact: true }).click();
        assert.equal(await card(page, group).getAttribute('data-pv-building-type'), group + '.x');
        await help(page, card(page, group), slug + ' generated ' + group);
        records.push({ slug, width: 1280, plan, prototype: group + '.x', stage: 'generated-help' });
      }
      const answer = await page.evaluate(() => eval('Math.ceil(roleCells("gost")/14)'));
      await card(page, 2).getByRole('combobox', { name: 'Вариант задания 2', exact: true }).selectOption('2.1');
      await submit(page, 2, { answer: '-999' }, 'incorrect');
      await submit(page, 2, { answer }, 'correct');
      await layout(page, slug + ' plan ' + plan);
    }
  } else if (slug === 'stoves') {
    for (let number = 1; number <= 5; number++) {
      const select = card(page, number).locator('.pv-subtype select');
      const values = await select.locator('option').evaluateAll(nodes => nodes.map(node => node.value));
      for (const value of values) {
        await select.selectOption(value);
        const prototype = await card(page, number).getAttribute('data-prototype');
        const spec = await page.evaluate(key => { const [g, t] = key.split(':').map(Number); return eval('GROUPS[' + g + '].tasks[' + t + '].gen(false)'); }, prototype);
        await help(page, card(page, number), slug + ' ' + prototype);
        const expected = spec.match ? Object.fromEntries(spec.match.map((row, i) => ['match' + i, row.correct])) : { answer: spec.answer };
        if (!spec.match) await submit(page, number, { answer: '-999' }, 'incorrect');
        await submit(page, number, expected, 'correct');
        await layout(page, slug + ' ' + prototype);
        if (prototype.startsWith('3:')) await card(page, number).screenshot({ path: path.join(out, 'stove-arch-' + prototype.replace(':', '-') + '.png') });
        records.push({ slug, width: 1280, prototype, stage: 'native-grading-and-help' });
      }
    }
  } else if (slug === 'paper-sheets') {
    for (const [number, choice] of [[1, null], [2, null], [3, null], [4, '0'], [4, '1'], [5, null]]) {
      if (choice !== null) await card(page, number).locator('.pv-subtype select').selectOption(choice);
      const prototype = await card(page, number).getAttribute('data-prototype');
      await help(page, card(page, number), slug + ' ' + prototype);
      await submit(page, number, { answer: '-999' }, 'incorrect');
      const answer = await page.evaluate(() => eval('state.inst.spec.roundTo!=null ? Math.round(state.inst.spec.value*10**state.inst.spec.roundTo)/10**state.inst.spec.roundTo : state.inst.spec.value'));
      await submit(page, number, { answer }, 'correct');
      records.push({ slug, width: 1280, prototype, stage: 'native-grading-and-help' });
    }
  } else if (slug === 'land-plots' || slug === 'tariffs') {
    // These private native engines close a question after the first attempt.
    // Exercise that rule through the visible form; positive native parity is a
    // separate exact-generator Node gate, not a guessed answer in this browser.
    for (let number = 1; number <= 5; number++) {
      await submit(page, number, { answer: '-999' }, 'incorrect');
      assert.equal(await card(page, number).locator('[data-pv-field]').isDisabled(), true);
      assert.equal(await card(page, number).locator('.pv-check').isDisabled(), true);
    }
    if (slug === 'tariffs') {
      const scratch = page.locator('.pv-calculation').first(); await scratch.fill('123,45');
      await help(page, card(page, 5), slug + ' scratchpad'); assert.equal(await scratch.inputValue(), '123,45');
    }
    await page.getByRole('button', { name: 'Новый вариант', exact: true }).click();
    assert.equal(await cards(page).count(), 5);
    assert.equal(await card(page, 1).locator('[data-pv-field]').isDisabled(), false);
    records.push({ slug, width: 1280, stage: 'native-final-attempt-and-new-variant', questions: 5 });
  }
}
(async () => {
  fs.mkdirSync(out, { recursive: true }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ headless: true });
  for (const [width, offlineMode] of [[320, false], [360, false], [1280, false], [360, true]]) for (const slug of slugs) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' }), page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    try {
      await page.goto(origin + (offlineMode ? '/offline/' : '/trainers/oge-1-5-trainers/') + 'practice-1-5-' + slug + '.html');
      await initial(page, slug, width, offlineMode);
      if (width === 1280 && !offlineMode) { if (slug.startsWith('roads-')) await roadVariants(page, slug); else await allSubtypes(page, slug); }
      assert.deepEqual(errors, [], slug + ': runtime exceptions');
    } catch (error) { await page.screenshot({ path: path.join(out, 'FAIL-' + slug + '-' + width + '-' + offlineMode + '.png'), fullPage: true }).catch(() => {}); throw error; }
    finally { await context.close(); }
  }
  fs.writeFileSync(path.join(out, 'coverage.json'), JSON.stringify({ cases: records.length, storylines: slugs.length, records }, null, 2));
  console.log('OGE_PRACTICAL_VARIANT_BROWSER_OK ' + records.length + ' cases across all seven storylines');
})().catch(error => { console.error(error); process.exitCode = 1; fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'partial-coverage.json'), JSON.stringify(records, null, 2)); })
  .finally(async () => { if (browser) await browser.close(); server.close(); fs.rmSync(offline, { recursive: true, force: true }); });
