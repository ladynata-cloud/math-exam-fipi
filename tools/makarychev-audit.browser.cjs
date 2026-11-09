'use strict';

// Bounded, real-browser release regression. Run in CI with Playwright Chromium.
// All requests are served by this repository; no accounts or remote services.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const numberedData = require('../school/m9-exercises/data.js');

const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, 'artifacts', 'makarychev-audit');
fs.mkdirSync(artifacts, { recursive: true });
const evidence = { status: 'running', viewports: [320, 1280], height: 900, cases: [], browserErrors: [], blockedExternalRequests: 0 };
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.html': 'text/html', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local.test').pathname);
    if (pathname === '/__makarychev_audit_frame') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end('<!doctype html><html><body style="margin:0"><iframe id="audit-frame" title="Учебная демонстрация" style="width:100%;height:900px;border:0"></iframe></body></html>');
    }
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});

let browser, origin;
const urls = {
  m7: '/school/makarychev7/index.html#lesson/p01/0',
  m8: '/school/makarychev8/index.html#lesson/p01/0',
  m9: '/school/index.html?course=makarychev9#lesson/m9f-root-square',
  numbered: '/school/m9-exercises/index.html#21/0'
};
const keys = { m7: 'mathexam.makarychev7.2024.v1', m8: 'mathexam.makarychev8.2024.v1', m9: 'mathexam.workshop.v1', numbered: 'mathexam.makarychev9.exercises.v1' };

async function context(width) {
  const c = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await c.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.origin === origin || ['data:', 'blob:'].includes(u.protocol)) return route.continue();
    evidence.blockedExternalRequests++;
    return route.abort();
  });
  c.on('page', page => {
    page.setDefaultTimeout(12000);
    page.on('pageerror', error => evidence.browserErrors.push(error.message));
  });
  return c;
}
async function screenshot(page, name) {
  const file = name + '.png';
  await page.screenshot({ path: path.join(artifacts, file), animations: 'disabled' });
  return file;
}
async function noOverflow(page, label) {
  const sizes = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert(sizes.document <= sizes.width + 1 && sizes.body <= sizes.width + 1, label + ': page overflow ' + JSON.stringify(sizes));
  return sizes;
}
async function firstScreen(page, questionSelector, answerSelector, label) {
  await page.locator(answerSelector).waitFor({ state: 'visible' });
  // No scrollIntoView: this checks the actual initial task position.
  const metrics = await page.evaluate(({ questionSelector, answerSelector }) => {
    const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }; };
    return { scrollY, height: innerHeight, width: innerWidth, question: box(questionSelector), answer: box(answerSelector) };
  }, { questionSelector, answerSelector });
  assert.equal(metrics.scrollY, 0, label + ': task must start at the top');
  for (const name of ['question', 'answer']) {
    const b = metrics[name];
    assert(b.width > 0 && b.height > 0, label + ': missing ' + name);
    assert(b.top >= -1 && b.bottom <= metrics.height + 1, label + ': ' + name + ' outside first screen ' + JSON.stringify(metrics));
    assert(b.left >= -1 && b.right <= metrics.width + 1, label + ': ' + name + ' outside width');
  }
  await noOverflow(page, label);
  return metrics;
}
async function openDetails(page, selector) {
  const details = page.locator(selector);
  if (!await details.evaluate(el => el.open)) await details.locator('summary').first().click();
}
async function activeNativeTask(page) {
  return page.evaluate(() => {
    const p = location.hash.slice(1).split('/');
    return window.MakarychevCourse.lessons.find(l => l.id === p[1]).tasks[Number(p[2] || 0)];
  });
}
async function nativeAnswer(page, task) {
  if (task.kind === 'choice') await page.locator('[data-choice="' + task.choices.indexOf(task.answer) + '"]').click();
  else await page.locator('#final-answer').fill(String(task.answer));
  await page.locator('#answer-form button[type=submit]').click();
}
async function nativeFlow(page, surface, record) {
  await page.goto(origin + urls[surface]);
  record.initial = await firstScreen(page, '#problem .prompt', '#final-answer', surface);
  record.screenshots.push(await screenshot(page, surface + '-' + record.width + '-task'));
  const first = await activeNativeTask(page);
  await page.locator('[data-action=hint]').click();
  await nativeAnswer(page, first);
  let done = await page.evaluate(id => window.MakarychevApp.getState().tasks[id], first.id);
  assert(done.correct && done.assisted && !done.independent, surface + ': hinted answer must not be independent');
  const oldHash = new URL(page.url()).hash;
  await page.locator(surface === 'm7' ? '[data-action=fresh-topic]' : '[data-action=fresh]').click();
  await page.waitForFunction(old => location.hash !== old, oldHash);
  const fresh = await activeNativeTask(page);
  assert.notEqual(fresh.id, first.id, surface + ': fresh task ID');
  assert.notEqual(fresh.prompt, first.prompt, surface + ': fresh task condition');
  done = await page.evaluate(id => window.MakarychevApp.getState().tasks[id], fresh.id);
  assert(!done.correct && !done.assisted && done.attempts === 0, surface + ': fresh attempt must begin clean');
  await nativeAnswer(page, fresh);
  done = await page.evaluate(id => window.MakarychevApp.getState().tasks[id], fresh.id);
  assert(done.correct && done.independent && !done.assisted, surface + ': new unassisted success');
  record.helpThenFresh = { assistedTask: first.id, newTask: fresh.id, independent: done.independent };

  if (surface === 'm7') {
    const lessonId = await page.evaluate(() => window.MakarychevCourse.lessons.find(l => l.model === 'function').id);
    await page.goto(origin + '/school/makarychev7/index.html#lesson/' + lessonId + '/0');
    await openDetails(page, '.model-panel');
    const forecast = 'При изменении b график сдвинется вверх, наклон останется прежним.';
    assert.equal(await page.locator('#model input[type=number]:visible').count(), 0, 'M7 outcome stays hidden before prediction');
    await page.locator('.m7-investigation textarea').fill(forecast);
    await page.getByRole('button', { name: 'Проверить на модели', exact: true }).click();
    const exact = page.locator('#model input[type=number][aria-label^="Число b"]');
    await exact.fill('0');
    await exact.fill('2');
    await page.locator('[aria-label="Как объяснить наблюдение"]').selectOption('1');
    await page.getByRole('button', { name: 'Проверить объяснение', exact: true }).click();
    assert.match(await page.locator('.m7-investigation').last().innerText(), /Объяснение верно/);
    const task = await activeNativeTask(page);
    const draft = await page.evaluate(id => window.MakarychevApp.getState().tasks[id], task.id);
    assert(draft.learning.model.started && draft.learning.model.checked && !draft.correct && !draft.independent);
    await page.reload();
    await openDetails(page, '.model-panel');
    assert.equal(await exact.inputValue(), '2');
    assert.match(await page.locator('.m7-investigation').first().innerText(), /наклон останется прежним/);
    assert.match(await page.locator('.m7-investigation').last().innerText(), /Объяснение верно/);
    record.model = { family: 'function', forecast, restoredParameter: await exact.inputValue() };
  } else {
    await page.goto(origin + '/school/makarychev8/index.html#lesson/p08/0');
    await openDetails(page, '.model-panel');
    assert.equal(await page.locator('#model input[type=number]:visible').count(), 0, 'M8 outcome stays hidden before prediction');
    await page.locator('.m8-prediction select').selectOption('1');
    await page.getByRole('button', { name: 'Сохранить прогноз и исследовать', exact: true }).click();
    for (const [label, value] of [['Коэффициент k', '0'], ['Сдвиг в знаменателе a', '2'], ['Свободный член b', '3']]) await page.locator('#model input[aria-label="' + label + ': точное значение"]').fill(value);
    await page.locator('.m8-reflection select').selectOption('0');
    await page.getByRole('button', { name: 'Проверить объяснение', exact: true }).click();
    assert.match(await page.locator('.m8-reflection').innerText(), /Объяснение верно/);
    assert.equal(await page.locator('[data-asymptote]').count(), 0, 'k=0 has no asymptotes');
    assert.match(await page.locator('.m8-value-table').innerText(), /не определено/);
    const task = await activeNativeTask(page);
    const draft = await page.evaluate(id => window.MakarychevApp.getState().tasks[id], task.id);
    assert(draft.investigation.explained && !draft.correct && !draft.independent);
    await page.reload();
    await openDetails(page, '.model-panel');
    assert.equal(await page.locator('#model input[aria-label="Сдвиг в знаменателе a: точное значение"]').inputValue(), '2');
    assert.equal(await page.locator('[data-asymptote]').count(), 0);
    assert.match(await page.locator('.m8-result').innerText(), /вертикальной асимптоты нет/);
    record.model = { family: 'shifted-rational', parameters: { k: 0, a: 2, b: 3 }, undefinedArgumentPreserved: true };
  }
  await noOverflow(page, surface + ' expanded model');
  const retained = await page.evaluate(({ assistedId, independentId }) => {
    const tasks = window.MakarychevApp.getState().tasks;
    return { assisted: tasks[assistedId], independent: tasks[independentId] };
  }, { assistedId: first.id, independentId: fresh.id });
  assert(retained.assisted.assisted && !retained.assisted.independent, surface + ': assistance survives reload');
  assert(retained.independent.independent && !retained.independent.assisted, surface + ': new independent evidence survives reload');
  await page.locator('#model').scrollIntoViewIfNeeded();
  record.screenshots.push(await screenshot(page, surface + '-' + record.width + '-model-restored'));
}

async function workshopState(page) { return page.evaluate(() => JSON.parse(localStorage.getItem(window.WorkshopState.KEY))); }
async function workshopAnswer(page) {
  return page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem(window.WorkshopState.KEY));
    const t = window.WorkshopMath.generate(s.last.skill, s.last.seed);
    const format = value => Array.isArray(value) ? value.map(format).join('; ') : typeof value === 'object' ? window.WorkshopMath.fmt(value) : String(value);
    if (t.answerFormat === 'decimal') {
      const n = typeof t.answer === 'object' ? t.answer.n / t.answer.d : Number(t.answer);
      return Number.isInteger(n) ? n + ',0' : String(n).replace('.', ',');
    }
    if (t.answerFormat === 'prime-factors') return t.answer.join(' · ');
    if (t.answerFormat === 'm9-pairs') return t.answer.map(pair => '(' + pair.map(format).join(';') + ')').join(';');
    return format(t.answer);
  });
}
async function submitWorkshop(page) {
  await page.locator('#answer').fill(await workshopAnswer(page));
  await page.locator('#answer-form button[type=submit]').click();
}
async function thematicFlow(page, record) {
  await page.goto(origin + urls.m9);
  record.initial = await firstScreen(page, '#task-panel .question', '#answer', 'M9 thematic');
  record.screenshots.push(await screenshot(page, 'm9-' + record.width + '-task'));
  await page.locator('[data-cmd=mode][data-value=check]').first().click();
  const before = await workshopState(page);
  await page.locator('[data-cmd=hint]').click();
  await submitWorkshop(page);
  let saved = await workshopState(page);
  assert.equal(saved.skills['m9f-root-square'].checks.length, 0, 'M9 hinted result is not mastery');
  assert.equal(saved.events.at(-1).assisted, true);
  await page.locator('[data-cmd=mode][data-value=check]').first().click();
  saved = await workshopState(page);
  assert.notEqual(saved.last.seed, before.last.seed, 'M9 fresh seed');
  assert.notEqual(saved.m9Drafts['m9f-root-square'].prompt, before.m9Drafts['m9f-root-square'].prompt, 'M9 fresh condition');
  await submitWorkshop(page);
  saved = await workshopState(page);
  assert.equal(saved.skills['m9f-root-square'].checks.length, 1);
  assert(saved.events.at(-1).independent && !saved.events.at(-1).assisted);
  record.helpThenFresh = { assistedSeed: before.last.seed, newSeed: saved.last.seed, independentChecks: 1 };

  await page.goto(origin + '/school/index.html?course=makarychev9#lesson/m9f-rational-shift');
  await page.locator('#m9-prediction').fill('При нулевом числителе останется прямая с исключённой точкой.');
  await openDetails(page, '.m9-model-details');
  await page.locator('[data-param=type]').selectOption('inverse');
  for (const [name, value] of [['a', '0'], ['h', '2'], ['k', '3']]) {
    await page.locator('[data-param=' + name + ']').fill(value);
    await page.locator('[data-param=' + name + ']').dispatchEvent('change');
  }
  await page.locator('#m9-explanation').fill('При x = 2 знаменатель равен нулю; эту точку исключаем.');
  assert.equal(await page.locator('[data-asymptotes]').count(), 0);
  assert.equal(await page.locator('.m9-open').count(), 1);
  assert.match(await page.locator('.m9-domain').innerText(), /x ≠ 2/);
  assert.match(await page.locator('.m9-value-table').innerText(), /не определено/);
  await page.reload();
  assert.match(await page.locator('#m9-prediction').inputValue(), /исключённой точкой/);
  assert.match(await page.locator('#m9-explanation').inputValue(), /эту точку исключаем/);
  await openDetails(page, '.m9-model-details');
  assert.equal(await page.locator('[data-param=h]').inputValue(), '2');
  assert.equal(await page.locator('[data-param=a]').inputValue(), '0');
  assert.equal(await page.locator('.m9-open').count(), 1);
  // An untouched skill need not have a result record: saving a model draft alone
  // deliberately does not create one. If it exists, its checks must still be empty.
  const exploredSkill = (await workshopState(page)).skills['m9f-rational-shift'];
  assert.equal(exploredSkill === undefined ? 0 : exploredSkill.checks.length, 0, 'M9 exploration must not create independent credit');
  await noOverflow(page, 'M9 expanded model');
  await page.locator('#model').scrollIntoViewIfNeeded();
  record.screenshots.push(await screenshot(page, 'm9-' + record.width + '-model-restored'));
  record.model = { family: 'rational', a: 0, h: 2, k: 3, freeExplanation: 'saved; not automatically scored' };
}

async function numberedFlow(page, record) {
  await page.goto(origin + urls.numbered);
  await page.locator('#start-check').click();
  record.initial = await firstScreen(page, '.question', '#answer', 'M9 numbered');
  record.screenshots.push(await screenshot(page, 'numbered-' + record.width + '-task'));
  await page.locator('#hint').click();
  await page.locator('#answer').fill(numberedData.byNumber[21].parts[0].steps.find(s => s.final).example);
  await page.locator('#answer-form button[type=submit]').click();
  await page.locator('#next').click();
  const old = await page.evaluate(() => JSON.parse(localStorage.getItem('mathexam.makarychev9.exercises.v1')));
  assert.equal(old.records['21:0'].independent, false);
  await page.locator('[data-fresh-practice]').click();
  await page.locator('#answer').waitFor();
  const fresh = await workshopState(page);
  assert.equal(fresh.last.mode, 'check');
  assert(!fresh.events.length, 'fresh thematic attempt has no synthetic success');
  await submitWorkshop(page);
  const checked = await workshopState(page);
  assert(checked.events.at(-1).independent && !checked.events.at(-1).assisted, 'numbered task leads to a fresh independent thematic answer');
  record.helpThenFresh = { source: '21:0', thematicSkill: checked.last.skill, independent: true };

  await page.goto(origin + '/school/m9-exercises/index.html#64/0');
  await page.locator('#start-learn').click();
  await openDetails(page, '.explore');
  assert.equal(await page.locator('[data-model]:visible').count(), 0, 'numbered model is hidden before forecast');
  await page.locator('[data-prediction]').fill('При большей скидке итоговая стоимость уменьшится.');
  await page.locator('[data-experiment-open]').click();
  await page.locator('[data-model=discount]').fill('20');
  await page.locator('[data-reflection]').fill('Изменил только скидку; остальные цены и количества сохранились.');
  const modelState = await page.evaluate(() => JSON.parse(localStorage.getItem('mathexam.makarychev9.exercises.v1')).sessions['64:0']);
  assert(modelState.assisted && modelState.experiment.open && !modelState.correct);
  await page.reload();
  await openDetails(page, '.explore');
  assert.match(await page.locator('[data-prediction]').inputValue(), /стоимость уменьшится/);
  assert.equal(await page.locator('[data-model=discount]').inputValue(), '20');
  assert.match(await page.locator('[data-reflection]').inputValue(), /остальные цены/);
  assert(await page.locator('.model-output dd').count() > 0);
  await noOverflow(page, 'numbered expanded model');
  await page.locator('#model').scrollIntoViewIfNeeded();
  record.screenshots.push(await screenshot(page, 'numbered-' + record.width + '-model-restored'));
  record.model = { family: 'purchase', discount: 20, freeExplanation: 'saved; not automatically scored' };
}

async function iframeIsolation(page, surface, record) {
  await page.goto(origin + '/__makarychev_audit_frame');
  const sentinel = 'personal-progress-sentinel:' + surface;
  await page.evaluate(({ key, sentinel, url }) => {
    localStorage.setItem(key, sentinel);
    document.querySelector('iframe').src = url;
  }, { key: keys[surface], sentinel, url: origin + urls[surface] });
  const frame = page.frameLocator('#audit-frame');
  if (surface === 'm7' || surface === 'm8') {
    await frame.locator('#final-answer').waitFor();
    await frame.locator('[data-action=hint]').click();
    await frame.locator('#final-answer').fill('42');
    await frame.locator('#answer-form button[type=submit]').click();
  } else if (surface === 'm9') {
    await frame.locator('#answer').waitFor();
    await frame.locator('[data-cmd=hint]').click();
    await frame.locator('#answer').fill('42');
    await frame.locator('#answer-form button[type=submit]').click();
  } else {
    await frame.locator('#start-check').click();
    await frame.locator('#hint').click();
    await frame.locator('#answer').fill('360');
    await frame.locator('#answer-form button[type=submit]').click();
    await frame.locator('#next').click();
  }
  assert.equal(await page.evaluate(key => localStorage.getItem(key), keys[surface]), sentinel, surface + ': embedded work changed personal bytes');
  record.iframePersonalProgressUnchanged = true;
  record.screenshots.push(await screenshot(page, surface + '-' + record.width + '-iframe'));
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
  for (const width of evidence.viewports) for (const surface of ['m7', 'm8', 'm9', 'numbered']) {
    const record = { surface, width, status: 'running', screenshots: [] };
    evidence.cases.push(record);
    const c = await context(width), page = await c.newPage();
    try {
      if (surface === 'm7' || surface === 'm8') await nativeFlow(page, surface, record);
      else if (surface === 'm9') await thematicFlow(page, record);
      else await numberedFlow(page, record);
      await iframeIsolation(page, surface, record);
      record.status = 'passed';
    } catch (error) {
      record.status = 'failed';
      record.error = error.stack || String(error);
      try { record.screenshots.push(await screenshot(page, surface + '-' + width + '-failure')); } catch (_) { /* retain the original assertion */ }
      console.error(surface + ' ' + width + ': ' + error.message);
    } finally { await c.close(); }
    fs.writeFileSync(path.join(artifacts, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  }
  evidence.status = evidence.cases.every(r => r.status === 'passed') && evidence.browserErrors.length === 0 ? 'passed' : 'failed';
  assert.deepEqual(evidence.browserErrors, [], 'uncaught browser errors');
  assert.equal(evidence.status, 'passed', 'See artifacts/makarychev-audit/evidence.json and failure screenshots');
  console.log('PASS Makarychev audit browser: four surfaces × 320/1280; task-first layout, fresh unassisted work after help, saved investigations and isolated iframe state.');
})().catch(error => { evidence.status = 'failed'; evidence.fatal = error.stack || String(error); console.error(error); process.exitCode = 1; })
  .finally(async () => {
    fs.writeFileSync(path.join(artifacts, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  });
