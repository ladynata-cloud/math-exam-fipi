'use strict';
// Actual Chromium acceptance. Run in hosted CI; node/JSDOM checks do not
// substitute for these pointer, keyboard, layout and storage observations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const {routes} = require('./oge-active-learning-preservation.cjs');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, process.env.OGE_ACTIVE_ARTIFACTS || 'artifacts/oge-active-learning');
const prefix = 'mathexam.oge.active.v1.';
const courseKey = 'mathExamCourseProgress.v1';
// Independent arithmetic for the first two new examples. Do not calculate
// expected answers with the component parser, grader, model or answer table.
const expected = Object.freeze({
  6: ['8/3', '5/4'],       // (2/3)/(1/4), (5/6)/(2/3)
  7: ['7', '6,5'],        // distances of -7 and -6.5 from zero
  8: ['20', '0'],         // sqrt(16)*sqrt(25), sqrt(0)*sqrt(81)
  9: ['6', '4'],          // 2x+5=17, 5x-7=13
  10: ['11/36', '1/12'], // two fair dice: at least one 1 (6+6-1 outcomes); sum at most 3
  11: ['-10', '-6'],      // -5/0.5, 6/(-1)
  12: ['2,5', '3,5']      // 150/60, 84/24 hours
});
const native = Object.freeze({
  6: {card: '#card', input: '#ans', check: '#check', feedback: '#mark'},
  7: {card: '#marTask'},
  8: {card: '#marGrid > .mtask:not([hidden])', input: 'input.ans', check: '.ck'},
  9: {card: '#mara-list > .task-card:not([hidden])', input: ':scope > .field input'},
  10: {card: '#mar-root > .card', input: '.aw-dec', check: '[id$="-ck"]', feedback: '[id$="-fb"]'},
  11: {card: '#m4', input: '#m4-answer', check: '#m4-check'},
  12: {card: '#taskArea > .card', input: '#ansIn', check: '#checkBtn'}
});
const mime = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf'};
const server = http.createServer((request, response) => {
  let url;
  try { url = new URL(request.url, 'http://localhost'); } catch (_) { response.writeHead(400).end(); return; }
  if (url.pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
  if (url.pathname === '/__oa_embed') {
    const file = routes[url.searchParams.get('task')];
    if (!file) { response.writeHead(400).end(); return; }
    response.writeHead(200, {'Content-Type': mime['.html']});
    response.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}iframe{width:100%;height:100vh;border:0}</style><iframe name="oa-embedded" title="Тренажёр" src="/' + file + '?embedded=1"></iframe>');
    return;
  }
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(url.pathname)); } catch (_) { response.writeHead(400).end(); return; }
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(response);
  });
});
const action = (box, name) => box.locator('[data-oa-action="' + name + '"]');
const record = page => page.evaluate(() => window.OgeActiveLearning.readRecord());
const current = state => state.attempts.find(a => a.token === state.active);
async function settle(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function phase(page, value) {
  await page.locator('.oa-screen[data-oa-phase="' + value + '"]').waitFor({state: 'visible'});
  assert.equal((await record(page)).phase, value);
}
async function fits(page, label) {
  const bounds = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.oa-learning,.oa-screen,.oa-model,.oa-model svg,.oa-model table,.oa-learning button,.oa-learning input,.oa-learning select,.oa-learning output')];
    return {width: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth,
      outside: nodes.filter(n => n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden').map(n => {
        const r = n.getBoundingClientRect(); return {tag: n.tagName, cls: n.className.baseVal || n.className, left: r.left, right: r.right};
      }).filter(r => r.left < -1 || r.right > innerWidth + 1)};
  });
  assert(bounds.html <= bounds.width + 1 && bounds.body <= bounds.width + 1, label + ': page overflow ' + JSON.stringify(bounds));
  assert.deepEqual(bounds.outside, [], label + ': component/formula/control bounds');
  return bounds;
}
async function shot(page, name) { await page.screenshot({path: path.join(output, name + '.png'), fullPage: true, animations: 'disabled', caret: 'initial'}); }
async function uncovered(page, target, label) {
  // Real layout and hit testing after ordinary browser scrolling. Full-page
  // screenshots alone can miss a sticky native header covering this lesson.
  await target.scrollIntoViewIfNeeded(); await settle(page);
  const observed = await target.evaluate(element => {
    const r = element.getBoundingClientRect();
    const visible = {left: Math.max(0, r.left), top: Math.max(0, r.top), right: Math.min(innerWidth, r.right), bottom: Math.min(innerHeight, r.bottom)};
    const point = {x: (visible.left + visible.right) / 2, y: (visible.top + visible.bottom) / 2};
    const hit = document.elementFromPoint(point.x, point.y);
    const headers = [...document.querySelectorAll('header')].filter(header => !header.closest('.oa-learning') && header.getClientRects().length).map(header => {
      const h = header.getBoundingClientRect();
      const overlap = {left: Math.max(visible.left, h.left), top: Math.max(visible.top, h.top), right: Math.min(visible.right, h.right), bottom: Math.min(visible.bottom, h.bottom)};
      const intersects = overlap.right > overlap.left + 1 && overlap.bottom > overlap.top + 1;
      const covering = intersects ? document.elementFromPoint((overlap.left + overlap.right) / 2, (overlap.top + overlap.bottom) / 2) : null;
      return {top: h.top, bottom: h.bottom, position: getComputedStyle(header).position, intersects, covers: !!covering && header.contains(covering)};
    });
    return {visible, point, centerInTarget: !!hit && element.contains(hit), headers};
  });
  assert(observed.visible.right > observed.visible.left && observed.visible.bottom > observed.visible.top, label + ': target has visible area');
  assert.equal(observed.centerInTarget, true, label + ': visible center is not covered ' + JSON.stringify(observed));
  assert(!observed.headers.some(header => header.covers), label + ': native header does not cover any intersecting content ' + JSON.stringify(observed));
  return observed;
}

async function rangeTo(page, box, key, value) {
  const control = box.locator('[data-oa-control="' + key + '"]');
  if (await control.evaluate(e => e.tagName === 'SELECT')) {
    await control.selectOption(String(value));
    assert.equal(Number(await control.inputValue()), value, 'real select reaches ' + key + '=' + value);
    return;
  }
  const meta = await control.evaluate(e => ({min: Number(e.min), max: Number(e.max), step: Number(e.step)}));
  assert(value >= meta.min && value <= meta.max);
  await control.focus(); await page.keyboard.press('Home');
  for (let step = 0; step < Math.round((value - meta.min) / meta.step); step++) await page.keyboard.press('ArrowRight');
  assert.equal(Number(await control.inputValue()), value, 'real range keyboard reaches ' + key + '=' + value);
}
async function rootBoundaries(page, box, label) {
  const caption = () => box.locator('[data-oa-caption]').innerText();
  await rangeTo(page, box, 'op', 0); await rangeTo(page, box, 'a', -1); await rangeTo(page, box, 'b', -1);
  assert.match(await caption(), /не определено в действительных числах/);
  assert.match(await caption(), /равно 1, но это не разрешает/);
  await uncovered(page, box.locator('[data-oa-model]'), label + ' negative roots model');
  await uncovered(page, box.locator('[data-oa-caption]'), label + ' negative roots explanation');
  await rangeTo(page, box, 'op', 1); await rangeTo(page, box, 'a', 0); await rangeTo(page, box, 'b', 0);
  assert.match(await caption(), /на ноль делить нельзя.*числитель тоже равен 0/);
  await uncovered(page, box.locator('[data-oa-model]'), label + ' zero denominator model');
  await uncovered(page, box.locator('[data-oa-caption]'), label + ' zero denominator explanation');
  await shot(page, label + '-roots-zero-denominator');
  await rangeTo(page, box, 'b', 9);
  assert.match(await caption(), /Частное: √0 \/ √9 = √\(0\) = 0\./);
  await rangeTo(page, box, 'op', 0);
  assert.match(await caption(), /Произведение: √0 × √9 = √0 = 0\./);
  await rangeTo(page, box, 'x', -4);
  assert.match(await box.locator('[data-oa-model] [role="math"]').innerText(), /√16 = 4 = \|-4\|/);
  assert.doesNotMatch(await box.locator('[data-oa-model]').innerText(), /NaN|Infinity|undefined/);
}
async function fractionBoundaries(page, label) {
  const settings = page.locator('.minimal-settings').first();
  if (!await settings.evaluate(e => e.open)) await settings.locator(':scope > summary').click();
  await page.locator('button.tab[data-t="learn"]').click();
  const result = page.locator('#p3out');
  for (const [m, n, exact] of [[5, 5, '1'], [6, 3, '2'], [5, 4, '1,25'], [5, 9, '0,(5)']]) {
    await page.locator('#p3m').fill(String(m)); await page.locator('#p3n').fill(String(n));
    await page.locator('#p3go').click();
    const text = await result.innerText();
    if (m % n === 0) {
      assert(text.includes('Число находится на делении ' + exact + '.'));
      assert.doesNotMatch(text, /между|Дробь правильная|≈/);
    } else {
      assert(text.includes(m + ' : ' + n + ' = ' + exact + '.'));
      assert.doesNotMatch(text, /≈/);
    }
    await fits(page, label + ' native fraction ' + m + '/' + n);
    await result.screenshot({path: path.join(output, label + '-fraction-' + m + '-' + n + '.png'), caret: 'initial'});
  }
}
async function nativeSnapshot(page, n) {
  return page.evaluate(({selector, prefix}) => {
    const card = document.querySelector(selector);
    const controls = [...card.querySelectorAll('input,select,textarea')].map(e => ({id: e.id, value: e.value, checked: e.checked, disabled: e.disabled, readOnly: e.readOnly}));
    const storage = Object.fromEntries(Object.keys(localStorage).filter(k => !k.startsWith(prefix)).sort().map(k => [k, localStorage.getItem(k)]));
    // Text alone cannot prove preservation of mathematical SVGs and fractions.
    // The complete existing task subtree is retained during the new mini-lesson.
    return {controls, html: card.innerHTML, storage};
  }, {selector: native[n].card, prefix});
}
async function retainNative(page, n, before, label) {
  assert.deepEqual(await nativeSnapshot(page, n), before, n + ': ' + label + ' preserves native question, drafts, controls and all existing storage');
}
async function nativeWorks(page, n) {
  const rule = native[n], card = page.locator(rule.card), before = await page.evaluate(key => localStorage.getItem(key), courseKey);
  if (n === 7) {
    const choice = await page.evaluate(() => BANK[marIdx].key);
    await card.locator('.optbtn').nth(choice - 1).click();
  } else {
    // Native mathematics is independently tested by the existing contract gate.
    // Here its published state supplies a valid response solely to exercise UI
    // integration after the new component has run. Probability uses the
    // independently impossible -1 to verify a visible rejection and no credit.
    const answer = n === 6 ? '-31/50' : n === 8 ? await page.evaluate(() => BANK[0].ans.join('/')) :
      n === 9 ? await page.evaluate(() => String(BANK[0].exp)) : n === 10 ? '-1' :
        n === 11 ? await page.evaluate(() => M4.task.key.join('')) : await page.evaluate(() => String(cur.answer));
    const input = card.locator(rule.input).first();
    assert(await input.isEnabled(), n + ': native answer remains enabled');
    await input.fill(answer);
    if (n === 9) await card.getByRole('button', {name: 'Проверить', exact: true}).click();
    else await card.locator(rule.check).click();
    if (n === 6) assert.match(await card.locator(rule.feedback).innerText(), /Верно/);
    if (n === 10) {
      assert((await card.locator(rule.feedback).innerText()).trim(), 'native probability checker gives visible feedback');
      const after = await page.evaluate(key => localStorage.getItem(key), courseKey);
      const count = text => Object.values(JSON.parse(text || '{}')).reduce((s, row) => s + Object.values(row.solvedByType || {}).reduce((a, b) => a + Number(b), 0), 0);
      assert.equal(count(after), count(before), 'negative probability earns no native credit');
      return;
    }
  }
  if (n !== 6) assert.notEqual(await page.evaluate(key => localStorage.getItem(key), courseKey), before, n + ': real native correct-answer action still records progress');
}
async function publicCase(browser, origin, n, width) {
  const label = n + '-' + width;
  const context = await browser.newContext({viewport: {width, height: 900}, locale: 'ru-RU', reducedMotion: 'reduce', hasTouch: width <= 360});
  context.setDefaultTimeout(8000);
  await context.tracing.start({screenshots: true, snapshots: true});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  let failure;
  try {
    await page.goto(origin + '/' + routes[n], {waitUntil: 'load'});
    const box = page.locator('details.oa-learning');
    await box.waitFor(); await settle(page);
    assert.equal(await box.count(), 1);
    assert.equal(await box.evaluate(e => e.open), false, 'new lesson starts optional');
    assert.equal(await box.locator(':scope > summary').innerText(), 'Разобраться на опыте');
    const card = page.locator(native[n].card);
    await card.waitFor();
    const nativeHeaderMode = n === 8 ? {closed: await page.locator('body > header').evaluate(e => getComputedStyle(e).position)} : null;
    if (nativeHeaderMode) assert.equal(nativeHeaderMode.closed, width > 640 ? 'sticky' : 'static', 'closed mini-lesson keeps the native responsive header');
    if (native[n].input) {
      const draft = n === 11 ? '123' : '17,5', input = card.locator(native[n].input).first();
      await input.fill(draft); await input.press('Tab'); await settle(page);
      assert.equal(await input.inputValue(), draft, 'native draft survives ordinary blur before baseline capture');
    }
    await settle(page);
    const original = await nativeSnapshot(page, n);
    await fits(page, label + ' collapsed'); await shot(page, label + '-01-entry');
    await box.locator(':scope > summary').focus(); await page.keyboard.press('Enter');
    await action(box, 'begin').click(); await phase(page, 'predict');
    if (nativeHeaderMode) {
      nativeHeaderMode.open = await page.locator('body > header').evaluate(e => getComputedStyle(e).position);
      assert.equal(nativeHeaderMode.open, 'static', 'open roots mini-lesson prevents native sticky header overlap');
    }
    const wrongPrediction = await page.evaluate(n => window.OgeActiveLearningData.lessons[n].prediction.options.findIndex(o => !o.correct), n);
    assert(wrongPrediction >= 0, 'prediction offers a real misconception');
    await box.locator('[data-oa-question="prediction"] [data-oa-choice="' + wrongPrediction + '"]').click();
    await action(box, 'check-prediction').click(); await phase(page, 'experiment');
    assert((await box.locator('.oa-observation').innerText()).trim(), 'wrong forecast receives an explanation');
    assert.equal(await action(box, 'check-concept').isDisabled(), true, 'an untouched model cannot be skipped as understood');
    const beforeModel = {html: await box.locator('[data-oa-model]').innerHTML(), caption: await box.locator('[data-oa-caption]').innerText()};
    const control = box.locator('[data-oa-control]').first();
    const beforeValue = await control.inputValue();
    if (await control.evaluate(e => e.tagName === 'SELECT')) {
      const next = await control.evaluate(e => [...e.options].find(o => o.value !== e.value).value);
      await control.selectOption(next);
    } else {
      const direction = await control.evaluate(e => Number(e.value) < Number(e.max) ? 'ArrowRight' : 'ArrowLeft');
      await control.focus(); await page.keyboard.press(direction);
    }
    assert.notEqual(await control.inputValue(), beforeValue, 'real keyboard/select input changes model parameter');
    assert.notDeepEqual({html: await box.locator('[data-oa-model]').innerHTML(), caption: await box.locator('[data-oa-caption]').innerText()}, beforeModel,
      'actual mathematical drawing or explanation changes, not only the slider label');
    assert.equal((await record(page)).modelChanged, true);
    if (n === 8) await rootBoundaries(page, box, label);
    const choices = await page.evaluate(n => {
      const options = window.OgeActiveLearningData.lessons[n].concept.options;
      return {wrong: options.findIndex(o => !o.correct), right: options.findIndex(o => o.correct)};
    }, n);
    assert(choices.wrong >= 0 && choices.right >= 0);
    await box.locator('[data-oa-question="concept"] [data-oa-choice="' + choices.wrong + '"]').click();
    await action(box, 'check-concept').click(); await phase(page, 'experiment');
    assert((await box.locator('[data-oa-feedback]').innerText()).trim(), 'wrong concept is explained before practice');
    const experimentUncovered = {
      heading: await uncovered(page, box.locator('.oa-screen h2'), label + ' experiment heading'),
      model: await uncovered(page, box.locator('[data-oa-model]'), label + ' experiment model'),
      explanation: await uncovered(page, box.locator('[data-oa-caption]'), label + ' experiment explanation')
    };
    await fits(page, label + ' experiment'); await shot(page, label + '-02-experiment');
    await box.locator('[data-oa-question="concept"] [data-oa-choice="' + choices.right + '"]').click();
    await action(box, 'check-concept').click(); await phase(page, 'practice');
    assert.equal(current(await record(page)).item, 0, 'first independent fixture is displayed');
    const input = () => box.locator('[data-oa-answer]');
    await input().fill('1/0'); await input().press('Enter');
    assert.equal(current(await record(page)).answers.length, 0, 'zero-denominator input spends no mathematical attempt');
    assert.match(await box.locator('[data-oa-feedback]').innerText(), /ненулевым знаменателем/);
    await action(box, 'hint').click();
    assert.equal(current(await record(page)).hinted, true);
    assert((await box.locator('.oa-help').innerText()).trim());
    await input().fill(expected[n][0]); await input().press('Enter');
    const helped = await record(page);
    assert.equal(current(helped).credit, 'helped');
    assert.deepEqual(helped.counts, {independent: 0, helped: 1, corrected: 0, familiar: 0});
    assert.equal(await action(box, 'check-answer').isDisabled(), true);
    await input().press('Enter');
    assert.deepEqual((await record(page)).counts, helped.counts, 'repeated Enter cannot award again');
    await retainNative(page, n, original, 'helped practice');
    await fits(page, label + ' helped'); await shot(page, label + '-03-helped');
    await action(box, 'next').click();
    const fresh = current(await record(page));
    assert.equal(fresh.item, 1); assert.equal(fresh.hinted, false); assert.equal(fresh.revealed, false); assert.equal(fresh.familiar, false);
    await input().fill(expected[n][1]); await action(box, 'check-answer').click();
    const independent = await record(page);
    assert.equal(current(independent).credit, 'independent');
    assert.deepEqual(independent.counts, {independent: 1, helped: 1, corrected: 0, familiar: 0});
    await retainNative(page, n, original, 'new independent practice');
    await action(box, 'summary').click(); await phase(page, 'summary');
    assert.match(await box.locator('[data-oa-summary]').innerText(), /самостоятельно 1.*с опорой 1/);
    const summaryUncovered = await uncovered(page, box.locator('[data-oa-summary]'), label + ' result summary');
    await fits(page, label + ' result'); await shot(page, label + '-04-result');
    const saved = await record(page);
    await action(box, 'native').click();
    assert.equal(await box.evaluate(e => e.open), false);
    assert.equal(await box.locator(':scope > summary').evaluate(e => e === document.activeElement), true, 'return restores keyboard focus');
    await retainNative(page, n, original, 'return to trainer');
    if (nativeHeaderMode) {
      nativeHeaderMode.returned = await page.locator('body > header').evaluate(e => getComputedStyle(e).position);
      assert.equal(nativeHeaderMode.returned, nativeHeaderMode.closed, 'closing mini-lesson restores original native header behavior');
    }
    await nativeWorks(page, n);
    if (n === 7) await fractionBoundaries(page, label);
    assert.deepEqual((await record(page)).attempts, saved.attempts, 'native practice cannot rewrite mini-lesson attempts');
    assert.deepEqual((await record(page)).counts, saved.counts);
    await box.locator(':scope > summary').click(); await settle(page);
    const courseBeforeReload = await page.evaluate(key => localStorage.getItem(key), courseKey);
    await page.reload({waitUntil: 'load'}); await box.waitFor(); await phase(page, 'summary');
    const restored = await record(page);
    assert.deepEqual(restored.attempts, saved.attempts, 'mini-lesson drafts, help provenance and attempts survive reload');
    assert.deepEqual(restored.counts, saved.counts, 'no repeat credit after reload');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), courseKey), courseBeforeReload, 'reloading mini-lesson does not change native course credit');
    await fits(page, label + ' reloaded');
    assert.deepEqual(errors, [], 'no runtime or resource console errors');
    return {lesson: n, width, forecastCorrection: true, actualModelChange: true, conceptCorrection: true,
      zeroDenominatorRejected: true, rootModelBoundaries: n === 8 ? 5 : null, nativeFractionCases: n === 7 ? 4 : null,
      experimentUncovered, summaryUncovered, nativeHeaderMode, helped: 1, independent: 1, nativeDraftRetained: true, nativeCheckWorks: true, reloadRetained: true};
  } catch (error) { failure = error; try { await shot(page, label + '-FAIL'); } catch (_) {} throw error; }
  finally {
    await context.tracing.stop({path: path.join(output, label + '-trace.zip')}).catch(error => { if (!failure) throw error; });
    await context.close();
  }
}
async function isolationCase(browser, origin, n, mode) {
  const context = await browser.newContext({viewport: {width: 360, height: 800}});
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await context.addInitScript(({prefix, managed}) => {
    if (managed) window.MathExamLearning = {managed: true};
    localStorage.setItem(prefix + 'existing-unrelated-record', 'retained');
    window.__oaObservedWrites = [];
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (String(key).startsWith(prefix)) window.__oaObservedWrites.push(String(key));
      return original.call(this, key, value);
    };
  }, {prefix, managed: mode === 'managed'});
  try {
    // №11's real learning bridge re-derives managed mode from this query;
    // the other routes receive the same pre-initialization managed flag.
    const query = mode === 'board' ? '?board=1' : mode === 'managed' ? '?learning=1' : '';
    await page.goto(mode === 'embedded' ? origin + '/__oa_embed?task=' + n : origin + '/' + routes[n] + query, {waitUntil: 'load'});
    const target = mode === 'embedded' ? page.frame({name: 'oa-embedded'}) : page;
    assert(target, 'actual embedded trainer frame exists'); await settle(target);
    assert.equal(await target.locator('.oa-learning').count(), 0, n + ': no new personal UI in ' + mode);
    const storage = await target.evaluate(prefix => ({keys: Object.keys(localStorage).filter(k => k.startsWith(prefix)), value: localStorage.getItem(prefix + 'existing-unrelated-record'), writes: window.__oaObservedWrites}), prefix);
    assert.deepEqual(storage, {keys: [prefix + 'existing-unrelated-record'], value: 'retained', writes: []}, n + ': shared/embedded mode neither creates nor clears mini-lesson progress');
    assert.deepEqual(errors, [], n + ' ' + mode + ': no browser errors');
    return {lesson: n, mode, newUI: false, miniLessonWrites: 0, existingStorageRetained: true};
  } finally { await context.close(); }
}
(async () => {
  fs.mkdirSync(output, {recursive: true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const evidence = {kind: 'actual Chromium UI', sourceCommit: process.env.GITHUB_SHA || null, browserVersion: null,
    routes, widths: [320, 360, 1280], public: [], isolation: [], failures: []};
  let browser;
  try {
    browser = await chromium.launch({headless: true});
    evidence.browserVersion = browser.version();
    for (const width of evidence.widths) for (const key of Object.keys(routes)) {
      const n = Number(key);
      try { evidence.public.push(await publicCase(browser, origin, n, width)); console.log('PASS active lesson ' + n + ' at ' + width + 'px'); }
      catch (error) { evidence.failures.push({lesson: n, width, error: error.stack}); console.error('FAIL active lesson ' + n + ' at ' + width + 'px: ' + error.message); }
    }
    for (const mode of ['board', 'embedded', 'managed']) for (const key of Object.keys(routes)) {
      const n = Number(key);
      try { evidence.isolation.push(await isolationCase(browser, origin, n, mode)); }
      catch (error) { evidence.failures.push({lesson: n, mode, error: error.stack}); console.error('FAIL isolation ' + n + ' ' + mode + ': ' + error.message); }
    }
    assert.equal(evidence.public.length, 21, 'all seven public lessons pass at all three widths');
    assert.equal(evidence.isolation.length, 21, 'all seven lessons remain isolated in board, embedded and managed modes');
    assert.deepEqual(evidence.failures, []);
    console.log('OGE_ACTIVE_LEARNING_BROWSER_OK: 21 public journeys + 21 isolation cases');
  } finally {
    fs.writeFileSync(path.join(output, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
