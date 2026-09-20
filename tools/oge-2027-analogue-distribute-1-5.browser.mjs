import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Use external tooling only; this gate never installs dependencies or browsers.
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const trainerPath = '/trainers/oge-1-5-trainers/practice-1-5-tires.html';
const authorId = 'oge-2027-analogue-1';
const authorTitle = 'Авторский аналог ОГЭ-2027 · Вариант 1';
const storageKey = 'tiresTrainerV2';
const courseKey = 'mathExamCourseProgress.v1';
const oldCodes = ['0ACF28', '0FF955', '1F235A', '4FD630', '07BC41', '9E5B99', '47E80B', '77CC6F',
  '87F592', '89CE07', '583B68', '3482E5', '6312CF', '62541F', 'AAE77F', 'AD8FEE', 'B1570A', 'CF1833', 'DB5DF7', 'EAAB14'];
const oldSentinel = { solvedSteps: [true, false, true, false, true, false, false], streak: 2, currentStep: 4 };
const foreignValues = {
  'browser-test.foreign-progress': 'unchanged',
  'mathExamOge2027Analogue1.v2': '{"foreignAuthorProgress":"retain-exactly"}',
  'ogeTask6FractionsProgress': '{"foreignFractionProgress":"retain-exactly"}'
};
// Independent arithmetic expectations, not values read from the trainer's model.
const wheelRows = {
  '185/65 R14': { B: 185, p: 65, di: 14, dm: 355.6, H: 120.25, D: 596.1 },
  '205/50 R16': { B: 205, p: 50, di: 16, dm: 406.4, H: 102.5, D: 611.4 },
  '195/60 R15': { B: 195, p: 60, di: 15, dm: 381, H: 117, D: 615 },
  '185/60 R15': { B: 185, p: 60, di: 15, dm: 381, H: 111, D: 603 }
};
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core')); }
catch { throw new Error('Set PLAYWRIGHT_CORE_PATH to an external playwright-core package. This gate installs nothing.'); }
const evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oge2027-tires-browser-'));
const evidence = { evidenceDir, surfaces: [], correctAnswers: 0, wrongAnswers: 0, tableCells: 0,
  targetMeasurements: 0, layoutChecks: 0, svgChecks: 0, storageChecks: 0, queryChecks: 0, oldVariantChecks: 0, errors: [], externalRequests: [] };
const { loadTrainerRegistry } = require(path.join(root, 'board-server/trainer-registry.js'));
const registry = loadTrainerRegistry({ baseDir: path.join(root, 'board-server'), env: {} });
assert.equal(registry.loaded, true, 'Actual board registry loads');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/trainer-registry') {
      response.writeHead(200, { 'Content-Type': mime['.json'] }).end(JSON.stringify(registry.publicPayload)); return;
    }
    let file = path.resolve(root, pathname.replace(/^\/+/, '') || 'index.html');
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end('Forbidden'); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (error, bytes) => {
      if (error) { response.writeHead(404).end('Not found'); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    });
  } catch { response.writeHead(400).end('Bad request'); }
});
let browser, browserServer, origin, failure;
function progress(stage) { console.log(JSON.stringify({ stage, evidenceDir })); }
async function closeWithin(value, label) {
  let timer;
  try {
    await Promise.race([value.close(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label}: cleanup exceeded 30 seconds`)), 30000);
    })]);
    progress(label + ' closed');
  } finally { clearTimeout(timer); }
}
function observe(page, label) {
  page.on('pageerror', error => evidence.errors.push(`${label}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') evidence.errors.push(`${label}: ${message.text()}`); });
  page.on('requestfailed', request => evidence.errors.push(`${label}: ${request.url()}: ${request.failure()?.errorText}`));
}
async function makeContext(options) {
  const context = await browser.newContext(options);
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'file:' || url.origin === origin) return route.continue();
    evidence.externalRequests.push(url.href); return route.abort('blockedbyclient');
  });
  await context.addInitScript(({ trainerPath, key, courseKey, foreignValues, oldSentinel }) => {
    if (!location.pathname.endsWith(trainerPath)) return;
    // Seed unrelated state once. Reloads then inspect the app's real saved values.
    if (!sessionStorage.getItem('browser-test.tires-seeded')) {
      for (const [name, value] of Object.entries(foreignValues)) localStorage.setItem(name, value);
      localStorage.setItem(courseKey, JSON.stringify({ foreignCourseProgress: { solved: 8, total: 10 } }));
      localStorage.setItem(key, JSON.stringify({ selectedCode: '0ACF28', mode: 'learn', byCode: { DB5DF7: oldSentinel } }));
      sessionStorage.setItem('browser-test.tires-seeded', 'yes');
      sessionStorage.setItem('browser-test.foreign-session', 'unchanged');
    }
    window.browserTestStorageWrites = [];
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) {
        window.browserTestStorageWrites.push({ method, key: args[0], area: this === localStorage ? 'local' : 'session' });
        return original.apply(this, args);
      };
    }
  }, { trainerPath, key: storageKey, courseKey, foreignValues, oldSentinel });
  return context;
}
async function saved(target) { return target.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey); }
async function storage(target, oldFirst) {
  const result = await target.evaluate(({ key, courseKey, foreignValues }) => ({
    values: Object.fromEntries(Object.keys(foreignValues).map(name => [name, localStorage.getItem(name)])),
    course: JSON.parse(localStorage.getItem(courseKey)), state: JSON.parse(localStorage.getItem(key)),
    session: sessionStorage.getItem('browser-test.foreign-session'), writes: window.browserTestStorageWrites
  }), { key: storageKey, courseKey, foreignValues });
  assert.deepEqual(result.values, foreignValues, 'Other trainer progress remains byte-identical');
  assert.equal(result.session, 'unchanged');
  assert.deepEqual(result.course.foreignCourseProgress, { solved: 8, total: 10 }, 'Existing course progress remains intact');
  assert.deepEqual(result.state.byCode.DB5DF7, oldSentinel, 'Unselected legacy variant progress is preserved');
  if (oldFirst) assert.deepEqual(result.state.byCode['0ACF28'], oldFirst, 'Opening/resetting author set preserves old variant progress');
  assert.ok(result.writes.every(write => write.area === 'local' && [storageKey, courseKey].includes(write.key) && write.method === 'setItem'),
    `Unexpected storage mutation: ${JSON.stringify(result.writes)}`);
  evidence.storageChecks++;
}
async function press(target, selector, touch) {
  try {
    if (touch) await target.locator(selector).tap(); else await target.locator(selector).click();
  } catch (error) {
    evidence.failedInteraction = await target.locator(selector).evaluate(element => {
      const r = element.getBoundingClientRect(), viewport = visualViewport;
      return { selector: element.outerHTML, rect: r.toJSON(), innerWidth, innerHeight, scrollX, scrollY,
        active: document.activeElement.outerHTML,
        viewport: viewport && { width: viewport.width, height: viewport.height, scale: viewport.scale, offsetTop: viewport.offsetTop, offsetLeft: viewport.offsetLeft },
        hit: document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2).slice(0, 8).map(e => e.tagName + '#' + e.id + '.' + e.className) };
    }).catch(diagnosticError => ({ diagnosticError: diagnosticError.message }));
    const page = typeof target.page === 'function' ? target.page() : target;
    await page.screenshot({ path: path.join(evidenceDir, 'failed-interaction.png') }).catch(() => {});
    throw error;
  }
}
async function step(target, index, touch) {
  await press(target, `#step-stepper [data-step="${index}"]`, touch);
  assert.equal(await target.locator(`#section-${index}`).isVisible(), true);
  assert.match(await target.locator(`#step-stepper [data-step="${index}"]`).getAttribute('class'), /active/);
}
async function layout(target, label) {
  const result = await target.evaluate(() => ({ width: document.documentElement.clientWidth, innerWidth,
    documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    controls: [...document.querySelectorAll('button,input,select,a[href]')]
      .filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
      .map(e => { const r = e.getBoundingClientRect(); return { name: e.id || e.dataset.check || e.textContent.trim(), width: r.width, height: r.height }; }),
    images: [...document.querySelectorAll('img')].map(e => ({ loaded: e.complete && e.naturalWidth > 0, alt: e.alt })),
    svgs: [...document.querySelectorAll('.author-wheel')].filter(e => e.getClientRects().length).map(e => {
      const r = e.getBoundingClientRect(), v = e.viewBox.baseVal, b = e.getBBox();
      return { width: r.width, height: r.height, viewWidth: v.width, viewHeight: v.height,
        title: e.querySelector('title')?.textContent || e.getAttribute('aria-label'),
        inside: b.x >= v.x - 1 && b.y >= v.y - 1 && b.x + b.width <= v.x + v.width + 1 && b.y + b.height <= v.y + v.height + 1 };
    }),
    activeSections: document.querySelectorAll('.step-section.active').length
  }));
  assert.ok(result.documentWidth <= result.width + 1, `${label}: page overflow ${result.documentWidth} > ${result.width}`);
  assert.ok(result.innerWidth <= result.width + 1, `${label}: expanded mobile layout viewport ${result.innerWidth} > ${result.width}`);
  assert.equal(result.activeSections, 1);
  // Chromium can report 43.9999389648 for a computed 44px box after a translation.
  for (const control of result.controls) assert.ok(control.width >= 44 - 0.001 && control.height >= 44 - 0.001,
    `${label}: ${control.name} target ${control.width}×${control.height} <44×44`);
  for (const image of result.images) assert.ok(image.loaded && image.alt, `${label}: missing embedded image/alt`);
  for (const svg of result.svgs) {
    assert.ok(svg.title && svg.inside, `${label}: author diagram has an accessible title and no clipped labels`);
    assert.ok(svg.width > 40 && svg.height > 30);
    assert.ok(Math.abs(svg.width / svg.viewWidth - svg.height / svg.viewHeight) < 0.01, `${label}: author SVG scale`);
    evidence.svgChecks++;
  }
  evidence.targetMeasurements += result.controls.length; evidence.layoutChecks++;
}
async function focus(target, selector) {
  const control = target.locator(selector);
  await control.focus(); await control.press('Shift');
  const result = await control.evaluate(e => {
    const css = getComputedStyle(e); return { active: document.activeElement === e, visible: e.matches(':focus-visible'),
      outline: css.outlineStyle, width: parseFloat(css.outlineWidth), shadow: css.boxShadow };
  });
  assert.ok(result.active && result.visible, `${selector}: keyboard focus remains visible`);
  assert.ok(result.outline !== 'none' && result.width > 0 || result.shadow !== 'none', `${selector}: visible focus indication`);
}
async function substep(target, id, answer, touch, keyboard = false) {
  const input = target.locator(`#${id} .substep-input`);
  await input.fill(String(answer));
  if (keyboard) await input.press('Enter'); else await press(target, `[data-check="${id}"]`, touch);
  assert.match(await input.getAttribute('class'), /correct/, `${id}: accepted ${answer}`);
  assert.equal(await input.isDisabled(), true);
  assert.match(await target.locator(`#${id} .substep-feedback`).innerText(), /Верно/);
}
async function finalAnswer(target, id, answer, wrong, index, touch) {
  const input = target.locator(`#${id} .substep-input`);
  const before = Number(await target.locator('#stat-solved').innerText());
  await input.fill(String(wrong)); await input.press('Enter');
  assert.match(await input.getAttribute('class'), /wrong/);
  assert.equal(await input.isDisabled(), false);
  assert.equal(Number(await target.locator('#stat-solved').innerText()), before);
  assert.equal((await saved(target)).byCode[authorId].solvedSteps[index], false);
  evidence.wrongAnswers++;
  await substep(target, id, answer, touch, true);
  assert.equal(Number(await target.locator('#stat-solved').innerText()), before + 1);
  assert.equal((await saved(target)).byCode[authorId].solvedSteps[index], true);
  evidence.correctAnswers++;
}
async function authorBasics(target) {
  assert.equal(await target.locator('#variant-select').inputValue(), '20');
  assert.equal(await target.locator('body').getAttribute('data-source-kind'), 'author-analogue');
  assert.match(await target.locator('#author-source').innerText(), /Авторский аналог ОГЭ-2027 · Вариант 1/);
  assert.match(await target.locator('#author-source').innerText(), /Авторский комплект MathExam\. Не является официальным материалом ФИПИ\./);
  assert.equal((await target.locator('#vb-factory').innerText()).trim(), '185/65 R14');
  const options = await target.locator('#variant-select option').allTextContents();
  assert.equal(options.length, 21);
  oldCodes.forEach((code, index) => assert.ok(options[index].includes(code), `Legacy variant ${index}: ${code}`));
  assert.ok(options[20].includes(authorTitle));
}
async function oldVariant(target) {
  await target.locator('#variant-select').selectOption('0');
  assert.equal((await target.locator('#vb-factory').innerText()).trim(), '185/70 R14');
  assert.notEqual(await target.locator('body').getAttribute('data-source-kind'), 'author-analogue');
  // Exercise existing content with real keyboard activation; do not alter its historical layout.
  for (const key of ['B', 'p', 'Rd']) {
    const selector = `#quiz-${key} .quiz-opt`;
    await target.locator(selector).first().focus(); await target.locator(selector).first().press('Enter');
  }
  assert.equal(Number(await target.locator('#stat-solved').innerText()), 1);
  await target.locator('[data-step="2"]').focus(); await target.locator('[data-step="2"]').press('Enter');
  await substep(target, 't1-col', '16', false, true);
  await substep(target, 't1-widths', '195,205', false, true);
  await substep(target, 't1-final', '195', false, true);
  assert.equal(Number(await target.locator('#stat-solved').innerText()), 2);
  const oldFirst = (await saved(target)).byCode['0ACF28'];
  await target.locator('#variant-select').selectOption('20');
  await authorBasics(target); await storage(target, oldFirst);
  evidence.oldVariantChecks++;
  return oldFirst;
}
async function masterTable(target, touch) {
  await step(target, 0, touch);
  for (const key of ['B', 'p', 'Rd']) await press(target, `#quiz-${key} .quiz-opt:first-child`, touch);
  assert.equal(Number(await target.locator('#stat-solved').innerText()), 1);
  await step(target, 1, touch);
  await layout(target, 'initial calculation table');
  for (const [field, value] of Object.entries({ B: 185, p: 65, di: 14 })) {
    await target.locator(`#w-read [data-field="${field}"]`).fill(String(value));
  }
  await press(target, '[data-check="w-read"]', touch);
  await substep(target, 'w-dm', '355,6', touch, true);
  await substep(target, 'w-H', '120,25', touch, true);
  await substep(target, 'w-D', '596,1', touch, true);
  const rows = await target.locator('#master-table tbody tr').evaluateAll(elements => elements
    .filter(row => row.querySelector('.calc-cell'))
    .map(row => ({ marking: row.querySelector('td.marking').childNodes[0].textContent.trim(),
      id: row.querySelector('.calc-cell').dataset.tire })));
  assert.deepEqual(rows.map(row => row.marking).sort(), Object.keys(wheelRows).sort(), 'Coherent four-wheel calculation table');
  for (const row of rows) {
    for (const [field, value] of Object.entries(wheelRows[row.marking])) {
      const input = target.locator(`#master-table .calc-cell[data-tire="${row.id}"][data-cell="${field}"]`);
      if (!await input.isDisabled()) { await input.fill(String(value)); await input.press('Enter'); }
      assert.match(await input.getAttribute('class'), /correct/);
      assert.ok(Math.abs(Number((await input.inputValue()).replace(',', '.')) - value) < 0.001);
      evidence.tableCells++;
    }
  }
  assert.equal(Number(await target.locator('#stat-solved').innerText()), 2);
  assert.equal(await target.locator('#table-done-msg').isVisible(), true);
}
async function compatibility(target) {
  const rows = await target.locator('#section-2 .compat-table tr').evaluateAll(elements =>
    elements.map(row => [...row.children].map(cell => cell.textContent.trim())));
  assert.equal(rows.length, 5);
  assert.deepEqual(rows[0].slice(1).map(text => Number(text.match(/\d+/)[0])), [14, 15, 16]);
  const expected = [
    ['175', '175/70', '175/65', null], ['185', '185/65', '185/60', null],
    ['195', null, '195/60', '195/55'], ['205', null, '205/55', '205/50']
  ];
  expected.forEach((row, index) => row.forEach((value, column) => {
    const actual = rows[index + 1][column];
    if (value === null) assert.match(actual, /^[—–-]$/); else assert.ok(actual.includes(value), `Compatibility row ${index}, column ${column}: ${actual}`);
  }));
}
async function flows(page, target, label, touch) {
  progress(label + ' flows start');
  await authorBasics(target);
  const oldFirst = await oldVariant(target);
  progress(label + ' legacy variant passed');
  await layout(target, label + ' intro'); await focus(target, '#variant-select');
  await focus(target, '#vb-prev');
  await target.locator('#vb-prev').press('Enter');
  assert.equal(await target.locator('#variant-select').inputValue(), '19');
  await target.locator('#vb-next').focus(); await target.locator('#vb-next').press('Enter');
  await authorBasics(target); await storage(target, oldFirst);
  await masterTable(target, touch); await layout(target, label + ' calculation table');
  progress(label + ' calculation table passed');
  await step(target, 2, touch); await compatibility(target); await layout(target, label + ' task1');
  await substep(target, 't1-col', '15', touch, true);
  await substep(target, 't1-widths', '175;185;195;205', touch, true);
  await focus(target, '#t1-final .substep-input');
  await finalAnswer(target, 't1-final', '205', '175', 2, touch);
  if (label === 'desktop' || label === 'mobile360') await target.locator('#section-2').screenshot({ path: path.join(evidenceDir, label + '-compatibility.png') });
  await step(target, 3, touch); await layout(target, label + ' task2');
  await finalAnswer(target, 't2-H', '102,5', '50', 3, touch);
  await step(target, 4, touch); await layout(target, label + ' task3');
  await finalAnswer(target, 't3-D', '596.1', '298.05', 4, touch);
  await step(target, 5, touch); await layout(target, label + ' task4');
  assert.match(await target.locator('#section-5 .card-intro').innerText(), /радиус/i);
  assert.match(await target.locator('#section-5 .card-intro').innerText(), /185\/60 R15/);
  assert.match(await target.locator('#section-5 .card-intro').innerText(), /195\/60 R15/);
  const direction = target.locator('#t4-dir .quiz-opt');
  await direction.filter({ hasText: 'уменьшился' })[touch ? 'tap' : 'click']();
  assert.match(await direction.filter({ hasText: 'уменьшился' }).getAttribute('class'), /wrong/);
  await direction.filter({ hasText: 'увеличился' })[touch ? 'tap' : 'click']();
  await finalAnswer(target, 't4-diff', '6', '12', 5, touch);
  await step(target, 6, touch); await layout(target, label + ' task5');
  await press(target, '#t5-mq .quiz-opt:first-child', touch);
  await substep(target, 't5-prop', '103,2', touch, true);
  await finalAnswer(target, 't5-final', '3,2', '103.2', 6, touch);
  assert.deepEqual((await saved(target)).byCode[authorId].solvedSteps, Array(7).fill(true));
  assert.equal(Number(await target.locator('#stat-solved').innerText()), 7);
  await press(target, '#btn-roll', touch);
  await target.locator('#anim-result.show').waitFor();
  await press(target, '#btn-roll-reset', touch);
  // Existing teacher mode is the solution-reveal mechanism in this bank.
  await press(target, '[data-mode="practice"]', touch);
  await step(target, 3, touch);
  assert.equal(await target.locator('#t2-H .substep-hint').isVisible(), false);
  await press(target, '#t2-H .substep-hint-btn', touch);
  assert.equal(await target.locator('#t2-H .substep-hint').isVisible(), true);
  const beforeReveal = (await saved(target)).byCode[authorId];
  await press(target, '[data-mode="teacher"]', touch);
  for (const [index, answer] of [[2, '205'], [3, '102,5'], [4, '596,1'], [5, '6'], [6, '3,2']]) {
    await step(target, index, touch); await layout(target, label + ' revealed task' + (index - 1));
    assert.equal(await target.locator(`#section-${index} .teacher-block`).isVisible(), true);
    assert.equal((await target.locator(`#section-${index} .answer-display`).innerText()).replace(/\s/g, ''), 'Ответ:' + answer);
    if (index === 5) {
      assert.match(await target.locator('#section-5 .teacher-block').innerText(), /615/);
      assert.match(await target.locator('#section-5 .teacher-block').innerText(), /603/);
      if (label === 'desktop' || label === 'mobile360') await target.locator('#section-5').screenshot({ path: path.join(evidenceDir, label + '-radius-solution.png') });
    }
  }
  assert.deepEqual((await saved(target)).byCode[authorId].solvedSteps, beforeReveal.solvedSteps, 'Reveal does not reset solved steps');
  await storage(target, oldFirst);
  await press(target, '#reset-btn', touch);
  assert.equal(await target.locator('#variant-select').inputValue(), '20');
  assert.equal(Number(await target.locator('#stat-solved').innerText()), 0);
  assert.deepEqual((await saved(target)).byCode[authorId].solvedSteps, Array(7).fill(false));
  await storage(target, oldFirst);
  await press(target, '[data-mode="learn"]', touch);
  await press(target, '#quiz-B .quiz-opt:first-child', touch);
  await press(target, '#quiz-p .quiz-opt:first-child', touch);
  await press(target, '#quiz-Rd .quiz-opt:first-child', touch);
  assert.equal(Number(await target.locator('#stat-solved').innerText()), 1);
  const currentUrl = target.url();
  await target.goto(currentUrl, { waitUntil: 'load' });
  await authorBasics(target);
  assert.equal(Number(await target.locator('#stat-solved').innerText()), 0, 'Existing bank reload behavior resets current variant');
  assert.equal(await target.locator('#section-0').isVisible(), true);
  await storage(target, oldFirst); await layout(target, label + ' reloaded');
  if (label === 'desktop' || label === 'mobile360') await page.screenshot({ path: path.join(evidenceDir, label + '-intro.png') });
  evidence.surfaces.push(label); progress(label + ' passed');
}

try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
  try {
    browserServer = await chromium.launchServer({ headless: true, timeout: 30000, ...(executablePath ? { executablePath } : { channel: 'msedge' }) });
    evidence.browserPid = browserServer.process().pid;
    browser = await chromium.connect(browserServer.wsEndpoint());
  }
  catch (error) { throw new Error('System Edge/Chromium unavailable. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.', { cause: error }); }
  for (const [label, width, height, touch] of [['desktop', 1280, 900, false], ['mobile390', 390, 844, true], ['mobile360', 360, 844, true]]) {
    const context = await makeContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch });
    try {
      const page = await context.newPage(); observe(page, label);
      const response = await page.goto(origin + trainerPath + '?variant=' + authorId, { waitUntil: 'load' });
      assert.equal(response.status(), 200);
      await flows(page, page, label, touch);
      // Missing/invalid query keeps the old default: restore the saved selection.
      for (const query of ['', '?variant=unknown', '?variant=OGE-2027-ANALOGUE-1']) {
        await page.goto(origin + trainerPath + query, { waitUntil: 'load' });
        await authorBasics(page); evidence.queryChecks++;
      }
    } finally { await closeWithin(context, label + ' context'); }
  }
  for (const query of ['', '?variant=unknown', '?variant=oge-2027-analogue-1-extra',
    '?variant=' + authorId + '&variant=' + authorId, '?variant=' + authorId + '&variant=unknown']) {
    const context = await makeContext({ viewport: { width: 1280, height: 900 } });
    try {
      const page = await context.newPage(); observe(page, 'default-query');
      await page.goto(origin + trainerPath + query, { waitUntil: 'load' });
      assert.equal(await page.locator('#variant-select').inputValue(), '0', 'Missing/invalid query keeps legacy default');
      assert.equal((await page.locator('#vb-factory').innerText()).trim(), '185/70 R14');
      await storage(page); evidence.queryChecks++;
    } finally { await closeWithin(context, 'default-query context'); }
  }
  const boardContext = await makeContext({ viewport: { width: 1280, height: 900 } });
  try {
    const board = await boardContext.newPage(); observe(board, 'actual-board');
    await board.goto(origin + '/trainers/trainer-board.html?server=' + encodeURIComponent(origin), { waitUntil: 'load' });
    const requestedSrc = trainerPath + '?variant=' + authorId;
    await board.locator('#trainerUrl').fill(requestedSrc); await board.locator('#openTrainer').click();
    const frame = await (await board.locator('#trainerFrame').elementHandle()).contentFrame();
    await frame.waitForURL(url => url.pathname === trainerPath && url.searchParams.get('variant') === authorId, { waitUntil: 'load' });
    await frame.locator('#author-source').waitFor();
    evidence.board = { requestedSrc, actualUrl: frame.url() };
    await flows(board, frame, 'actual-board-manual-iframe', false);
  } finally { await closeWithin(boardContext, 'board context'); }
  const fileContext = await makeContext({ viewport: { width: 360, height: 844 }, isMobile: true, hasTouch: true, offline: true });
  try {
    const page = await fileContext.newPage(); observe(page, 'file-offline');
    await page.goto(pathToFileURL(path.join(root, trainerPath.slice(1))).href + '?variant=' + authorId, { waitUntil: 'load' });
    await flows(page, page, 'file-offline360', true);
  } finally { await closeWithin(fileContext, 'file context'); }
  assert.deepEqual(evidence.errors, [], 'No console/page/request errors');
  assert.deepEqual(evidence.externalRequests, [], 'No external dependencies or requests');
} catch (error) { failure = error; }
finally {
  try { if (browser) await closeWithin(browser, 'browser'); }
  catch (error) { failure = failure ? new AggregateError([failure, error], 'Gate and browser cleanup failed') : error; }
  finally {
    try {
      if (browserServer) {
        await closeWithin(browserServer, 'owned browser process');
        evidence.browserExitCode = browserServer.process().exitCode;
        assert.equal(evidence.browserExitCode, 0, 'Owned browser process exits cleanly');
      }
    } catch (error) {
      failure = failure ? new AggregateError([failure, error], 'Gate and owned browser cleanup failed') : error;
      if (browserServer) await browserServer.kill();
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); progress('server closed'); }
  }
}
evidence.status = failure ? 'FAIL' : 'PASS';
function errorEvidence(error) {
  return { stack: error.stack || String(error), ...(error.errors ? { errors: error.errors.map(errorEvidence) } : {}),
    ...(error.cause ? { cause: errorEvidence(error.cause) } : {}) };
}
if (failure) evidence.failure = errorEvidence(failure);
fs.writeFileSync(path.join(evidenceDir, 'browser-results.json'), JSON.stringify(evidence, null, 2));
if (failure) throw failure;
console.log(JSON.stringify(evidence));
console.log('OGE_2027_ANALOGUE_TIRES_BROWSER_OK');
