'use strict';

// Exercise the actual landing page, its native navigation and the four real
// demo destinations. Contact popups are intercepted; no messages or analytics
// are sent. SHOWCASE_BASE_URL can select the published site after release.
// SHOWCASE_HOME_ONLY=1 reruns only the two homepage entry cases.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
const artifacts = process.env.SHOWCASE_LANDING_ARTIFACTS;
const homepageOnly = process.env.SHOWCASE_HOME_ONLY === '1';
const widths = [320, 390, 768, 1280];
const demos = [
  {id:'demo-division', route:'/trainers/long-division-stepwise.html#start', ready:'#answer'},
  {id:'demo-graphs', route:'/trainers/oge-task11-graphs-trainer.html', ready:'#m4-graphs svg'},
  {id:'demo-ege', route:'/ege-profil/start/index.html#practice/geo-right/guided', ready:'#answer-form'},
  {id:'demo-cone', route:'/stereo-course/textbook/#ex-main-0346', ready:'[data-main-model] svg'}
];
const contacts = ['https://t.me/ladynata3000', 'https://vk.ru/ladynata3000'];
const directions = {school:'demo-division', oge:'demo-graphs', ege:'demo-ege'};
const mime = {'.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'application/javascript',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg', '.woff2':'font/woff2'};
const report = {widths, homepageWidths:[390,1280], cases:[], errors:[], failedRequests:[], unexpectedExternal:[], inheritedFontsIntercepted:[]};
let base;
let server;

async function screenshot(page, name, fullPage = false) {
  if (artifacts) await page.screenshot({path:path.join(artifacts, name + '.png'), fullPage, animations:'disabled'});
}
async function fits(page, label) {
  const size = await page.evaluate(() => ({width:innerWidth, scroll:document.documentElement.scrollWidth}));
  assert(size.scroll <= size.width + 1, `${label}: horizontal overflow (${size.scroll} > ${size.width})`);
}
async function inViewport(page, selector, label, topVisible = false) {
  const box = await page.locator(selector).first().boundingBox();
  assert(box, label + ': rendered');
  const height = await page.evaluate(() => innerHeight);
  assert(box.y < height && box.y + box.height > 0, label + ': reaches the viewport');
  if (topVisible) {
    const inset = await page.evaluate(() => {
      const header = document.querySelector('.showcase-header');
      return getComputedStyle(header).position === 'sticky' ? header.getBoundingClientRect().bottom : 0;
    });
    assert(box.y >= inset - 1, label + ': beginning is not obscured by the header');
  }
}
async function createContext(browser, width, javaScriptEnabled = true, height = 900) {
  const context = await browser.newContext({viewport:{width, height}, isMobile:width < 600,
    hasTouch:width < 600, javaScriptEnabled, reducedMotion:'reduce'});
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(base).origin) return route.continue();
    if (contacts.includes(url.href)) return route.fulfill({contentType:'text/html', body:'<title>Contact destination checked</title><p>QA intercepted this contact link. No message was sent.</p>'});
    if (/^https:\/\/mc\.yandex\.(ru|com)\//.test(url.href)) return route.fulfill({contentType:'application/javascript', body:'/* Analytics intercepted by QA. */'});
    // Google Fonts are an inherited homepage dependency. Keep the standalone
    // showcase dependency guard strict and verify the homepage's font fallback.
    let homepageRequest = false;
    try { homepageRequest = new URL(route.request().frame().url()).pathname === '/'; } catch {}
    if (homepageRequest && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
      report.inheritedFontsIntercepted.push({width, url:url.href});
      return route.fulfill({contentType:url.hostname === 'fonts.googleapis.com' ? 'text/css' : 'font/woff2', body:''});
    }
    report.unexpectedExternal.push({width, url:url.href});
    return route.fulfill({status:403, body:'Unexpected external request blocked by QA'});
  });
  context.on('page', page => {
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => report.errors.push({width, error:error.message}));
    page.on('response', response => {
      if (new URL(response.url()).origin === new URL(base).origin && response.status() >= 400)
        report.failedRequests.push({width, url:response.url(), status:response.status()});
    });
  });
  return context;
}
async function popup(page, link, expected, ready) {
  const original = page.url();
  const promised = page.waitForEvent('popup');
  await link.click();
  const tab = await promised;
  await tab.waitForURL(expected);
  await tab.waitForLoadState('load');
  assert.equal(tab.url(), expected, 'the clicked link opens the exact advertised destination');
  if (ready) await tab.locator(ready).first().waitFor();
  assert.equal(page.url(), original, 'the showcase and booking route remain in the original tab');
  assert(!page.isClosed(), 'the original landing tab is still open');
  if (ready) assert.equal(await tab.evaluate(() => window.opener), null, 'the demo has no opener access');
  await tab.close();
}
async function metadataAndLinks(page) {
  assert.equal(await page.locator('h1').count(), 1);
  assert.match(await page.title(), /5–11.*ОГЭ.*ЕГЭ/);
  assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mathexam.space/lessons/');
  assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), 'https://mathexam.space/lessons/');
  assert.match(await page.locator('meta[name="viewport"]').getAttribute('content'), /width=device-width/);
  assert.match(await page.locator('meta[name="description"]').getAttribute('content'), /5–11.*ОГЭ.*ЕГЭ/);
  const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => ({href:a.getAttribute('href'), target:a.target, rel:a.rel})));
  const allowed = new Set([...demos.map(d => d.route), ...contacts, 'mailto:nata4os@bk.ru']);
  for (const link of links) {
    if (link.href.startsWith('#')) {
      assert(link.href.length > 1 && await page.locator(link.href).count() === 1, 'native anchor has one real target: ' + link.href);
    } else {
      assert(allowed.has(link.href), 'showcase exposes only checked examples and direct contacts: ' + link.href);
      if (!link.href.startsWith('mailto:')) {
        assert.equal(link.target, '_blank');
        assert(link.rel.split(/\s+/).includes('noopener'));
        assert(link.rel.split(/\s+/).includes('noreferrer'));
      }
    }
  }
  assert.equal(await page.locator('.demo-link').count(), demos.length);
  assert.match(await page.locator('#examples-note').innerText(), /новой вкладке/);
  assert.match(await page.locator('.examples-after').innerText(), /сохранённую работу/);
  assert.equal(await page.locator('form').count(), 0, 'booking does not collect data into an unimplemented form');
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto', 'reduced motion is respected');
}
async function nativeDetails(page) {
  for (const selector of ['.faq-list details:first-child', '.message-template']) {
    const detail = page.locator(selector), summary = detail.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    assert.equal(await detail.getAttribute('open'), '', selector + ': Enter opens native details');
    assert(await detail.locator('p, blockquote').isVisible(), selector + ': content is visible');
    await page.keyboard.press('Space');
    assert.equal(await detail.getAttribute('open'), null, selector + ': Space closes native details');
  }
}
async function responsiveCase(browser, width) {
  const context = await createContext(browser, width);
  const page = await context.newPage();
  try {
    await page.goto(base + '/lessons/', {waitUntil:'load'});
    await fits(page, 'initial ' + width);
    await metadataAndLinks(page);
    await inViewport(page, '#hero-title', 'initial heading');
    await inViewport(page, '.hero-subjects', 'grades and exam offer');
    await inViewport(page, '.hero .button[href="#contact"]', 'initial booking action');
    await screenshot(page, `landing-${width}-initial`);
    if (width === 1280 || width === 390) await screenshot(page, `landing-${width}-full`, true);
    await page.locator('.showcase-nav a[href="#directions"]').click();
    await inViewport(page, '#directions', 'directions navigation', true);
    for (const [direction, demo] of Object.entries(directions)) {
      await page.goto(base + '/lessons/#' + direction);
      await inViewport(page, '#' + direction, 'incoming #' + direction, true);
      const link = page.locator('#' + direction + ' .text-link');
      assert.equal(await link.getAttribute('href'), '#' + demo);
      await link.click();
      assert.equal(new URL(page.url()).hash, '#' + demo);
      await inViewport(page, '#' + demo, direction + ' example target', true);
      await fits(page, direction + ' anchor ' + width);
    }
    await page.goto(base + '/lessons/#examples');
    await screenshot(page, `landing-${width}-examples`);
    for (const demo of demos) {
      const link = page.locator('#' + demo.id + ' .demo-link');
      assert.equal(await link.getAttribute('href'), demo.route);
      await popup(page, link, base + demo.route, demo.ready);
    }
    await page.goto(base + '/lessons/');
    await page.locator('.showcase-nav a[href="#contact"]').click();
    assert.equal(new URL(page.url()).hash, '#contact');
    await inViewport(page, '#contact', 'contact anchor', true);
    await inViewport(page, '.contact-buttons a', 'booking button after navigation');
    await fits(page, 'contact ' + width);
    await screenshot(page, `landing-${width}-contact`);
    for (const contact of contacts) await popup(page, page.locator('.contact-buttons a[href="' + contact + '"]'), contact);
    assert.equal(await page.locator('.email-link').getAttribute('href'), 'mailto:nata4os@bk.ru');
    await nativeDetails(page);
    await fits(page, 'expanded content ' + width);
    report.cases.push({width, result:'PASS', demoPopups:demos.length, contactPopups:contacts.length,
      checks:['first screen', 'incoming direction anchors', 'direction-to-demo links', 'real demo tabs', 'booking anchor', 'native details', 'metadata', 'limited link set', 'reduced motion']});
    console.log(`PASS showcase at ${width}px: four real demo tabs, direct booking, all direction anchors`);
  } catch (error) {
    await screenshot(page, `landing-${width}-failure`, true);
    report.cases.push({width, result:'FAIL', error:error.message});
    throw error;
  } finally { await context.close(); }
}
async function keyboardAndNoJs(browser) {
  for (const javaScriptEnabled of [true, false]) {
    const context = await createContext(browser, 390, javaScriptEnabled);
    const page = await context.newPage();
    try {
      await page.goto(base + '/lessons/');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
      await inViewport(page, '.skip-link', 'keyboard skip link');
      await page.keyboard.press('Enter');
      assert.equal(new URL(page.url()).hash, '#main-content');
      await page.goto(base + '/lessons/');
      await page.locator('.showcase-nav a[href="#contact"]').focus();
      const focus = await page.locator('.showcase-nav a[href="#contact"]').evaluate(el => ({style:getComputedStyle(el).outlineStyle, width:getComputedStyle(el).outlineWidth}));
      assert.equal(focus.style, 'solid');
      assert.equal(focus.width, '3px');
      await page.keyboard.press('Enter');
      await inViewport(page, '.contact-buttons a', 'keyboard booking button');
      await nativeDetails(page);
      await popup(page, page.locator('.contact-buttons a').first(), contacts[0]);
      await page.goto(base + '/lessons/#school');
      await page.locator('#school .text-link').click();
      await inViewport(page, '#demo-division', 'no-JS-compatible example anchor', true);
      await popup(page, page.locator('#demo-division .demo-link'), base + demos[0].route, javaScriptEnabled ? demos[0].ready : null);
      await fits(page, 'keyboard/no-JS');
      report.cases.push({javaScriptEnabled, result:'PASS', checks:['skip link', 'visible focus', 'keyboard booking', 'native details', 'contact popup', 'native demo link']});
      console.log(`PASS keyboard and native navigation with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`);
    } finally { await context.close(); }
  }
  // 640 CSS pixels is the reflow viewport of a 1280px desktop at 200% zoom.
  // This checks reflow, not a physical browser zoom control or text-only zoom.
  const context = await createContext(browser, 640, true, 450);
  const page = await context.newPage();
  try {
    await page.goto(base + '/lessons/');
    await fits(page, '200% equivalent desktop reflow');
    await page.goto(base + '/lessons/#contact');
    await fits(page, '200% equivalent booking reflow');
    await page.locator('.contact-buttons a').first().scrollIntoViewIfNeeded();
    await inViewport(page, '.contact-buttons a', 'booking reachable in short viewport');
    await screenshot(page, 'landing-640-short-reflow');
    report.cases.push({width:640, height:450, result:'PASS', checks:['200% equivalent desktop reflow', 'booking reachable by scrolling']});
  } finally { await context.close(); }
}

async function homepageEntry(browser, width) {
  const context = await createContext(browser, width);
  const page = await context.newPage();
  const entries = [
    {route:'/lessons/', target:'#hero-title', name:'showcase'},
    {route:'/lessons/#examples', target:'#examples', name:'examples'},
    {route:'/lessons/#contact', target:'#contact', name:'contact'}
  ];
  try {
    await page.goto(base + '/', {waitUntil:'load'});
    await fits(page, 'homepage ' + width);
    assert.match(await page.locator('.hero-inner .kicker').innerText(), /5–11.*ОГЭ.*ЕГЭ.*базовый.*профильный/i);
    await inViewport(page, '.hero-inner .kicker', 'homepage grades and exam offer');
    await inViewport(page, '.hero-inner h1', 'homepage heading');
    assert.deepEqual(await page.locator('.hero-inner .actions a').evaluateAll(links => links.map(a => a.getAttribute('href'))), entries.map(entry => entry.route));
    await screenshot(page, `homepage-${width}-initial`);
    for (const entry of entries) {
      await page.goto(base + '/', {waitUntil:'load'});
      await page.locator('.hero-inner .actions a[href="' + entry.route + '"]').click();
      await page.waitForURL(base + entry.route);
      await page.locator(entry.target).waitFor();
      await inViewport(page, entry.target, 'homepage CTA reaches ' + entry.name, true);
      await fits(page, 'homepage destination ' + entry.name + ' at ' + width);
      if (entry.name === 'contact') await inViewport(page, '.contact-buttons a', 'homepage CTA reaches visible booking button');
      await screenshot(page, `homepage-${width}-to-${entry.name}`);
    }
    report.cases.push({page:'homepage', width, result:'PASS', destinations:entries.map(entry => entry.route),
      checks:['grades and exams in hero', 'no horizontal overflow', 'three actual CTA navigations', 'rendered destination targets'], fonts:'inherited Google Fonts intercepted; system fallback rendered'});
    console.log(`PASS homepage at ${width}px: school/OGE/EGE offer and three real showcase entry paths`);
  } catch (error) {
    await screenshot(page, `homepage-${width}-failure`, true);
    report.cases.push({page:'homepage', width, result:'FAIL', error:error.message});
    throw error;
  } finally { await context.close(); }
}

(async () => {
  if (artifacts) fs.mkdirSync(artifacts, {recursive:true});
  if (process.env.SHOWCASE_BASE_URL) base = process.env.SHOWCASE_BASE_URL.replace(/\/$/, '');
  else {
    server = http.createServer((req, res) => {
      try {
        const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
        if (pathname === '/favicon.ico') return res.writeHead(204).end();
        let file = path.resolve(root, '.' + pathname);
        if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
        if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
      } catch { res.writeHead(404).end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
  }
  let browser;
  try {
    browser = await chromium.launch({headless:true,
      ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
    report.browser = browser.version();
    report.source = process.env.SHOWCASE_BASE_URL ? 'published origin' : 'local worktree';
    report.suite = homepageOnly ? 'homepage entry only' : 'homepage and landing';
    for (const width of report.homepageWidths) await homepageEntry(browser, width);
    if (!homepageOnly) {
      for (const width of widths) await responsiveCase(browser, width);
      await keyboardAndNoJs(browser);
    }
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.failedRequests, []);
    assert.deepEqual(report.unexpectedExternal, []);
    console.log(homepageOnly ? 'AVITO_SHOWCASE_HOME_BROWSER_OK: homepage hero and all three entry paths at 390/1280; no live messages or analytics.' : 'AVITO_SHOWCASE_BROWSER_OK: homepage entry at 390/1280; responsive landing at 320/390/768/1280, real demo tabs, booking, native anchors/details, keyboard and no-JS fallback; no live messages or analytics.');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (artifacts) fs.writeFileSync(path.join(artifacts, homepageOnly ? 'homepage-results.json' : 'results.json'), JSON.stringify(report, null, 2) + '\n');
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
