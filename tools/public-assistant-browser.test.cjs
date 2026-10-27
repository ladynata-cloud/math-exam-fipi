'use strict';

// Local HTTP + real browser. All chat inputs below are synthetic. The server
// serves real public pages unchanged; the separate coverage gate checks every
// inclusion. Fixtures exercise hostile CSS/data and accidentally included paths.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const vm = require('node:vm');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'))); }
const ROOT = path.resolve(__dirname, '..');
const HOST = '#maxexam-public-assistant';
const DECIMALS = '/trainers/oge-basics/decimal-add-subtract.html';
const privatePaths = new Set([
  '/learning/', '/trainers/trainer-board.html', '/trainers/peterson6.html',
  '/downloads/trainers/example.html', '/tools/review.html',
  '/trainers/archive-5-weeks/example.html', '/teacher.html', '/offline.html',
  '/exports/example.html', '/courses/vilenkin-6-part-1/index.html', '/video-lessons/studio.html'
]);
function verifyRuntimeCoverage() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/public-assistant-pages.json'), 'utf8'));
  const source = fs.readFileSync(path.join(ROOT, 'assets/assistant/widget.js'), 'utf8');
  const marker = '  function mount() {';
  assert.equal(source.split(marker).length, 2, 'Find one actual runtime admission boundary');
  // Test-only instrumentation of the actual function; no production test API
  // and no mounting, browser context, URL query or storage involved.
  const window = {};
  vm.runInNewContext(source.replace(marker, '  root.admissionForFixture = permittedPath;\n' + marker), {
    window, document: { readyState: 'loading', addEventListener() {} }
  }, { timeout: 1000, filename: 'widget-runtime-admission-fixture.js' });
  assert.ok(Array.isArray(manifest.pages) && manifest.pages.length > 0);
  for (const file of manifest.pages) {
    assert.equal(window.admissionForFixture('/' + file), true, 'Reviewed public page is admitted: ' + file);
    if (file.endsWith('/index.html') || file === 'index.html') {
      assert.equal(window.admissionForFixture('/' + file.replace(/index\.html$/, '')), true, 'Public directory URL is admitted: ' + file);
    }
  }
  assert.equal(window.admissionForFixture('/trainers/dvi/math-18-20-video-studio.html'), true, 'Public DVI studio remains available');
  for (const pathname of privatePaths) assert.equal(window.admissionForFixture(pathname), false, 'Private path stays suppressed: ' + pathname);
  console.log('PUBLIC_ASSISTANT_RUNTIME_COVERAGE_OK: ' + manifest.pages.length + ' manifest files and their directory URL aliases.');
}
const scriptTags = data => '<script defer src="' + data + '"></script><script defer src="/assets/assistant/widget.js"></script>';
function fixture(data = '/assets/assistant/data.js', frame = false) {
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>Проверка навигатора</title><style>body{margin:0;background:#f3f6f2;font:18px system-ui;color:#173b28}main{max-width:800px;padding:20px;margin:40px auto}button{font:48px fantasy;color:magenta;background:red;border:20px solid orange}h2{font-size:66px!important;color:magenta!important}textarea{min-width:900px!important}.message{display:none!important}#trainer-answer{font-size:18px;width:180px}</style>'
    + scriptTags(data) + '</head><body><main><h1>Учебная страница MathExam</h1><p>Самостоятельная тренировка и поиск материалов.</p>'
    + '<label for="trainer-answer">Ответ в тренажёре</label> <input id="trainer-answer" value="synthetic-answer-draft">'
    + (frame ? '<iframe title="Учебный тренажёр" src="/widget-test.html"></iframe>' : '')
    + '</main><script>window.fixtureTrainerEnter=0;window.fixtureTrainerCapture=0;document.addEventListener("keydown",function(e){if(e.key==="Enter")window.fixtureTrainerEnter++});document.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key==="Escape")window.fixtureTrainerCapture++},true);</script></body></html>';
}
const hostileData = `window.MathExamPublicAssistantData={
  welcome:function(){return {text:"Проверка безопасного текста",links:[],difficultyCount:0,referralShown:false}},
  respond:function(input){return {
    text:"<img src=x onerror=window.injected=true> — текст ответа",
    links:input.text === "Проверка нормализации" ? [
      {title:"Абсолютный URL с двойной чертой",url:"https://mathexam.space//example.invalid/"},
      {title:"Относительный URL с двойной чертой",url:"/a/..//example.invalid/"},
      {title:"Каталог",url:"/trainers/"}
    ] : [
      {title:"JS",url:"javascript:window.injected=true"},
      {title:"Чужой сайт",url:"//example.invalid/"},
      {title:"Внешняя ссылка",url:"https://example.invalid/"},
      {title:"Каталог",url:"/trainers/"},
      {title:"Кабинет",url:"https://mathexam-board-ladynata.msk1.amvera.tech/learning/#route"},
      {title:"Личный адрес",url:"https://mathexam-board-ladynata.msk1.amvera.tech/learning/?invite=synthetic#route"}
    ], actions:[{label:"<svg onload=window.injected=true>",text:"Геометрия"}],kind:"fixture"
  }}
};`;
const requests = [];
const server = http.createServer((req, res) => {
  requests.push({ url: req.url, method: req.method });
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Cache-Control', 'no-store');
  if (url.pathname === '/widget-hostile-data.js') {
    res.setHeader('Content-Type', 'text/javascript;charset=utf-8'); return res.end(hostileData);
  }
  if (url.pathname.startsWith('/widget-test') || privatePaths.has(url.pathname)) {
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    return res.end(fixture(url.pathname === '/widget-test-hostile.html' ? '/widget-hostile-data.js' : '/assets/assistant/data.js', url.pathname === '/widget-test-frame.html'));
  }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (_) { return res.writeHead(400).end(); }
  const file = path.resolve(ROOT, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
  res.setHeader('Content-Type', { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8', '.css': 'text/css;charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const checks = [], pageErrors = [];
function pass(name) { checks.push(name); console.log('PASS: ' + name); }
async function opened(page) {
  await page.locator(HOST + ' .launcher').click();
  await page.getByRole('dialog', { name: 'MaxExam 0.0' }).waitFor();
}
async function ask(page, text) {
  await page.locator(HOST + ' textarea').fill(text);
  await page.locator(HOST + ' .send').click();
}
async function hostText(page) { return page.locator(HOST + ' .log').innerText(); }
async function assertLayout(page) {
  const box = await page.getByRole('dialog', { name: 'MaxExam 0.0' }).boundingBox();
  const view = page.viewportSize();
  assert.ok(box && box.x >= 0 && box.x + box.width <= view.width + 1 && box.y >= 0 && box.y + box.height <= view.height + 1, 'Dialog remains inside viewport');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No introduced horizontal overflow');
  for (const selector of ['.icon-button', '.send', '.clear', 'textarea']) {
    const control = page.locator(HOST + ' ' + selector);
    assert.ok((await control.boundingBox()).height >= 44, selector + ' touch target');
  }
}

(async () => {
  let browser;
  verifyRuntimeCoverage();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });
    async function context(fixtureOnly = false) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU' });
      await ctx.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin === origin || ['about:', 'data:', 'blob:'].includes(url.protocol)) return route.continue();
        return route.abort();
      });
      if (fixtureOnly) await ctx.addInitScript(() => {
        window.privacyCalls = [];
        for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(window, key, { configurable: true, get() { window.privacyCalls.push(key); throw Error('Storage is out of scope'); } });
        Object.defineProperty(document, 'cookie', { configurable: true, get() { window.privacyCalls.push('cookie-read'); return ''; }, set() { window.privacyCalls.push('cookie-write'); } });
        window.fetch = () => { window.privacyCalls.push('fetch'); return Promise.reject(Error('No API')); };
        XMLHttpRequest.prototype.open = () => { window.privacyCalls.push('xhr'); throw Error('No API'); };
        navigator.sendBeacon = () => { window.privacyCalls.push('beacon'); return false; };
        window.WebSocket = function () { window.privacyCalls.push('socket'); throw Error('No API'); };
      });
      const page = await ctx.newPage(); page.setDefaultTimeout(12000);
      page.on('pageerror', error => pageErrors.push(error.message));
      return { ctx, page };
    }
    const live = await context(), page = live.page;
    await page.goto(origin + '/');
    await page.locator(HOST + ' .launcher').waitFor();
    assert.equal(await page.getByRole('dialog', { name: 'MaxExam 0.0' }).isVisible(), false, 'No unsolicited opening');
    assert.equal(await page.locator(HOST + ' .message').count(), 0, 'No unsolicited chat message');
    const originalHeading = await page.locator('main h1,body > h1').first().innerText();
    await opened(page);
    assert.equal(await page.locator(HOST + ' .role-label').innerText(), 'Навигатор по материалам сайта');
    assert.equal(await page.locator('main h1,body > h1').first().innerText(), originalHeading, 'Existing content is retained');
    await ask(page, 'Дроби');
    await page.locator(HOST + ' .choice').filter({ hasText: /^Десятичные дроби$/ }).last().click();
    assert.ok((await hostText(page)).includes('десятичных дробей'));
    const newestReply = await page.locator(HOST + ' .navigator .message-text').last().boundingBox();
    const logBox = await page.locator(HOST + ' .log').boundingBox();
    assert.ok(newestReply.y >= logBox.y && newestReply.y < logBox.y + logBox.height, 'New reply begins visibly before its lower action buttons');
    await assertLayout(page);
    pass('real home page, closed default, honest role, topic clarification and desktop layout');

    await page.locator(HOST + ' a[href="' + DECIMALS + '"]').last().click();
    await page.waitForURL(origin + DECIMALS);
    assert.equal(await page.getByRole('dialog', { name: 'MaxExam 0.0' }).isVisible(), false);
    await page.goto(origin + '/school/peterson6/');
    await opened(page);
    assert.ok((await hostText(page)).includes('Петерсона 6 класса'));
    await ask(page, 'Сложение десятичных дробей');
    await page.locator(HOST + ' a[href="/school/peterson6/#practice/decimal-add/1"]').last().click();
    await page.waitForURL(origin + '/school/peterson6/#practice/decimal-add/1');
    assert.equal(await page.getByRole('dialog', { name: 'MaxExam 0.0' }).isVisible(), false, 'Same-page course link returns the workspace');
    assert.equal(await page.locator('main input,main button').count() > 0, true, 'Course still renders controls');
    pass('real trainer navigation and same-document Peterson practice route');

    const fixtureRun = await context(true), fp = fixtureRun.page;
    await fp.goto(origin + '/widget-test.html?token=synthetic-query-never-context#synthetic-hash');
    await opened(fp);
    assert.equal((await hostText(fp)).includes('synthetic-'), false, 'No query/hash/answer context read');
    const networkBefore = requests.length;
    await ask(fp, 'пароль: synthetic-secret-value');
    assert.equal((await hostText(fp)).includes('synthetic-secret-value'), false, 'Secret input not echoed');
    assert.ok((await hostText(fp)).includes('Сообщение с личными данными скрыто.'));
    assert.equal(await fp.locator(HOST + ' textarea').inputValue(), '');
    await ask(fp, 'test-pupil@example.invalid');
    assert.equal((await hostText(fp)).includes('test-pupil@example.invalid'), false);
    assert.equal(requests.length, networkBefore, 'No request during chat');
    assert.deepEqual(await fp.evaluate(() => window.privacyCalls), [], 'No storage, cookies or transmission APIs');
    for (const selector of ['', ' .log', ' form', ' textarea']) assert.match(await fp.locator(HOST + selector).getAttribute('class'), /ym-hide-content/);
    assert.match(await fp.locator(HOST + ' textarea').getAttribute('class'), /ym-disable-keys/);
    assert.match(await fp.locator(HOST + ' form').getAttribute('class'), /ym-disable-submit/);
    assert.equal(await fp.locator(HOST + ' textarea').getAttribute('autocomplete'), 'off');
    assert.equal(await fp.locator('#trainer-answer').inputValue(), 'synthetic-answer-draft');
    pass('local-only messages, masked synthetic secrets, no storage/requests or query/answer context');

    await fp.locator(HOST + ' .clear').click();
    await fp.locator(HOST + ' textarea').fill('Геометрия ОГЭ');
    await fp.locator(HOST + ' textarea').press('Enter');
    assert.ok((await hostText(fp)).includes('Геометрия ОГЭ собрана'));
    assert.equal(await fp.evaluate(() => window.fixtureTrainerEnter), 0, 'Widget Enter does not check the trainer');
    await fp.locator(HOST + ' textarea').press('Shift+Enter');
    assert.equal(await fp.locator(HOST + ' textarea').inputValue(), '\n', 'Shift+Enter stays an input newline');
    await fp.locator(HOST + ' textarea').press('Escape');
    assert.equal(await fp.getByRole('dialog', { name: 'MaxExam 0.0' }).isVisible(), false);
    assert.equal(await fp.evaluate(() => window.fixtureTrainerCapture), 0, 'Widget keys do not reach trainer capture listeners');
    assert.equal(await fp.evaluate(() => document.querySelector('#maxexam-public-assistant').shadowRoot.activeElement.classList.contains('launcher')), true, 'Close returns focus');
    await fp.locator('#trainer-answer').press('Enter');
    assert.equal(await fp.evaluate(() => window.fixtureTrainerEnter), 1, 'Unrelated trainer keyboard remains live');
    assert.equal(await fp.evaluate(() => window.fixtureTrainerCapture), 1, 'Unrelated trainer capture remains live');
    await opened(fp);
    await fp.locator(HOST + ' .choice').filter({ hasText: /^Дроби$/ }).first().press('Enter');
    assert.ok((await hostText(fp)).includes('Какие дроби'), 'Native keyboard activation still works on helper buttons');
    const messageCount = await fp.locator(HOST + ' .message').count();
    await ask(fp, '   ');
    assert.equal(await fp.locator(HOST + ' .message').count(), messageCount);
    assert.equal(await fp.locator(HOST + ' textarea').getAttribute('maxlength'), '400');
    await fp.locator(HOST + ' textarea').evaluate(node => { node.value = 'x'.repeat(401); });
    await fp.locator(HOST + ' .send').click();
    assert.equal(await fp.locator(HOST + ' .message').count(), messageCount, 'Over-limit text is not handled');
    await fp.getByRole('button', { name: 'Закрыть помощника', exact: true }).click();
    assert.equal(await fp.locator(HOST + ' .launcher').getAttribute('aria-expanded'), 'false');
    pass('keyboard isolation, Enter/Shift+Enter, close/focus and bounded form handling');

    await fp.goto(origin + '/widget-test-hostile.html');
    await opened(fp);
    await ask(fp, '<img src=x onerror="window.injected=true">');
    assert.equal(await fp.locator(HOST + ' img,' + HOST + ' svg').count(), 0);
    assert.equal(await fp.evaluate(() => window.injected || false), false);
    assert.ok((await hostText(fp)).includes('<img src=x'));
    const hrefs = await fp.locator(HOST + ' .log a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    assert.deepEqual(hrefs, ['/trainers/', 'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#route']);
    assert.equal(await fp.locator(HOST + ' a[target="_blank"]').getAttribute('rel'), 'noopener noreferrer');
    await ask(fp, 'Проверка нормализации');
    const projectedHrefs = await fp.locator(HOST + ' .navigator').last().locator('a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    assert.deepEqual(projectedHrefs, ['/trainers/'], 'Normalized double-slash paths cannot become external hrefs');
    const css = await fp.locator(HOST + ' h2').evaluate(node => ({ color: getComputedStyle(node).color, font: getComputedStyle(node).fontSize }));
    assert.deepEqual(css, { color: 'rgb(24, 71, 46)', font: '20px' }, 'Global trainer h2 CSS does not affect shadow content');
    assert.ok(await fp.locator(HOST + ' .message').first().isVisible(), 'Global .message rule does not hide messages');
    pass('inert visitor/response markup, strict link destinations and hostile CSS isolation');

    await fp.goto(origin + '/widget-test.html'); await opened(fp);
    await ask(fp, 'Не понимаю десятичные дроби');
    assert.equal(await fp.locator(HOST + ' a[href="/lessons/#contact"]').count(), 0);
    await ask(fp, 'Снова не получается');
    assert.equal(await fp.locator(HOST + ' a[href="/lessons/#contact"]').count(), 1);
    await ask(fp, 'Опять ошибка');
    assert.equal(await fp.locator(HOST + ' a[href="/lessons/#contact"]').count(), 1, 'At most one spontaneous offer');
    assert.ok(await fp.locator(HOST + ' a[href="/foundations/"]').count() > 0, 'Free learning route remains');
    await fp.locator(HOST + ' .clear').click();
    await ask(fp, 'Не предлагайте репетитора');
    await ask(fp, 'Не понимаю'); await ask(fp, 'Все еще трудно');
    assert.equal(await fp.locator(HOST + ' a[href="/lessons/#contact"]').count(), 0, 'Decline is respected');
    await fp.locator(HOST + ' .clear').click();
    await ask(fp, 'Не могу войти в кабинет'); await ask(fp, 'Не получается войти в кабинет');
    assert.equal(await fp.locator(HOST + ' a[href="/lessons/#contact"]').count(), 0, 'Access failure is not a tutoring prompt');
    await ask(fp, 'Нужен репетитор');
    assert.equal(await fp.locator(HOST + ' a[href="/lessons/#contact"]').count(), 1, 'Explicit contact request gets existing destination');
    assert.ok(fp.url().endsWith('/widget-test.html'), 'No automatic contact navigation');
    pass('gentle one-time difficulty referral, retained free route, decline and access boundaries');

    await fp.locator(HOST + ' .clear').click();
    assert.equal(await fp.locator(HOST + ' .message').count(), 1, 'Clear retains only a new welcome');
    await fp.evaluate(() => {
      const shadow = document.querySelector('#maxexam-public-assistant').shadowRoot;
      for (let index = 0; index < 24; index++) { shadow.querySelector('textarea').value = 'ОГЭ'; shadow.querySelector('form').requestSubmit(); }
    });
    assert.ok(await fp.locator(HOST + ' .message').count() <= 40, 'Transcript DOM memory bounded');
    await fp.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    assert.equal(await fp.locator(HOST + ' .message').count(), 0, 'Pagehide clears BFCache transcript');
    assert.equal(await fp.getByRole('dialog', { name: 'MaxExam 0.0' }).isVisible(), false);
    await fp.reload(); await opened(fp);
    assert.equal(await fp.locator(HOST + ' .message').count(), 1, 'Reload has no saved conversation');
    assert.deepEqual(await fp.evaluate(() => window.privacyCalls), []);
    pass('explicit clearing, bounded history, pagehide and reload forget conversation');

    await fp.setViewportSize({ width: 390, height: 844 });
    await ask(fp, 'Признаки равенства треугольников');
    await assertLayout(fp);
    await fp.locator(HOST + ' .icon-button').click(); await opened(fp);
    await fp.setViewportSize({ width: 390, height: 360 });
    await fp.locator(HOST + ' .clear').click();
    assert.equal(await fp.locator(HOST + ' .message').count(), 1, 'Short-screen controls remain reachable');
    pass('390px mobile layout, touch targets and short-screen reachable controls');

    for (const pathname of privatePaths) {
      await fp.goto(origin + pathname);
      assert.equal(await fp.locator(HOST).count(), 0, 'Suppressed helper on ' + pathname);
    }
    await fp.goto(origin + '/widget-test-frame.html');
    const embedded = fp.frame({ url: origin + '/widget-test.html' });
    await embedded.waitForLoadState();
    assert.equal(await embedded.locator(HOST).count(), 0, 'No widget in embedded trainer');
    assert.equal(await fp.locator(HOST).count(), 1, 'Parent page has just its own widget');
    await fp.addScriptTag({ url: origin + '/assets/assistant/widget.js' });
    assert.equal(await fp.locator(HOST).count(), 1, 'Duplicate include cannot mount twice');
    pass('private/board/archive/export suppression, iframe and duplicate-load guards');

    await page.goto(origin + DECIMALS);
    await page.locator('#practiceAnswer input').waitFor();
    await page.locator('#practiceAnswer input').fill('123');
    const taskBefore = await page.locator('#practicePrompt').innerText();
    const progressBefore = await page.evaluate(() => ({ ...localStorage }));
    await opened(page); await ask(page, 'Сложение десятичных дробей');
    assert.equal(await page.locator('#practiceAnswer input').inputValue(), '123');
    assert.equal(await page.locator('#practicePrompt').innerText(), taskBefore);
    assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), progressBefore, 'Navigation conversation does not change existing trainer progress');
    await page.locator(HOST + ' .icon-button').click();
    const match = taskBefore.match(/(\d+(?:,\d+)?)\s*([+−-])\s*(\d+(?:,\d+)?)/);
    assert.ok(match, 'Existing task has two decimal operands');
    const left = Number(match[1].replace(',', '.')), right = Number(match[3].replace(',', '.'));
    const answer = Math.round((match[2] === '+' ? left + right : left - right) * 100) / 100;
    await page.locator('#practiceAnswer input').fill(String(answer).replace('.', ','));
    await page.locator('#checkTask').click();
    assert.ok((await page.locator('#practiceFeedback').innerText()).includes('Самостоятельно'));
    assert.equal(await page.locator('#nextTask').isVisible(), true);
    await page.locator('#nextTask').click();
    assert.equal(await page.locator('#practiceAnswer input').inputValue(), '');
    pass('existing decimal trainer retains task/draft/progress, then checks and advances normally');

    await page.goto(origin + '/geometry-course/textbook/#atanasyan-7-9-main-92-part-1');
    await page.getByRole('button', { name: 'На весь экран', exact: true }).first().waitFor();
    // This public shell is bound to an existing content-review hash. Its
    // production inclusion is deferred; test future keyboard compatibility by
    // explicitly injecting the checked local helper assets only in this page.
    assert.equal(await page.locator('script[src*="assets/assistant/"]').count(), 0, 'Protected textbook has no helper script inclusion');
    assert.equal(await page.locator(HOST).count(), 0, 'Protected textbook has no production helper');
    await page.addScriptTag({ url: origin + '/assets/assistant/data.js?v=public-assistant-20261027' });
    await page.addScriptTag({ url: origin + '/assets/assistant/widget.js?v=public-assistant-20261027' });
    // The viewer supports an overlay fallback where native fullscreen is not
    // available. Its document-capture Escape listener must not receive chat keys.
    await page.evaluate(() => { Element.prototype.requestFullscreen = undefined; });
    await page.getByRole('button', { name: 'На весь экран', exact: true }).first().click();
    assert.equal(await page.locator('.planar-expanded').count(), 1);
    await opened(page);
    await page.locator(HOST + ' textarea').press('Escape');
    assert.equal(await page.getByRole('dialog', { name: 'MaxExam 0.0' }).isVisible(), false, 'Escape closes the focused helper');
    assert.equal(await page.locator('.planar-expanded').count(), 1, 'Focused chat Escape preserves expanded diagram');
    await page.locator('.planar-expanded .planar-viewport').focus();
    await page.locator('.planar-expanded .planar-viewport').press('Escape');
    assert.equal(await page.locator('.planar-expanded').count(), 0, 'Diagram Escape still works outside helper');
    pass('protected textbook stays deferred; synthetic helper injection preserves real diagram capture keyboard');

    if (process.env.PUBLIC_ASSISTANT_BROWSER_ARTIFACTS) {
      const dir = path.resolve(process.env.PUBLIC_ASSISTANT_BROWSER_ARTIFACTS);
      if (!dir.startsWith(os.tmpdir() + path.sep)) throw Error('Browser artifacts must be in the temporary directory');
      fs.mkdirSync(dir, { recursive: true });
      await page.goto(origin + '/'); await opened(page); await ask(page, 'Геометрия ОГЭ');
      await page.screenshot({ path: path.join(dir, 'public-assistant-desktop.png') });
      await page.setViewportSize({ width: 390, height: 844 }); await assertLayout(page);
      await page.screenshot({ path: path.join(dir, 'public-assistant-mobile.png') });
    }
    assert.equal(requests.some(row => row.method !== 'GET'), false, 'No form or API submission reached server');
    assert.deepEqual(pageErrors, [], 'No uncaught browser errors');
    console.log('PUBLIC_ASSISTANT_BROWSER_OK: ' + checks.length + ' groups; zero model calls, synthetic data only.');
    await fixtureRun.ctx.close(); await live.ctx.close();
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); if (pageErrors.length) console.error('Browser errors:', pageErrors); process.exitCode = 1; server.close(); });
