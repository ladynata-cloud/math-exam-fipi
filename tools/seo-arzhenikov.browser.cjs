'use strict';

// NODE_PATH=<playwright installation>/node_modules node tools/seo-arzhenikov.browser.cjs
// Scope: the new public guide, its catalog entrances and its links into the
// already-tested trainer. No exercises are solved and no previous suite is replaced.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const entry = '/topics/metod-arzhenikova/';
const trainer = '/trainers/oge-basics/multiplication-division/arzhenikov-map.html';
const canonical = 'https://mathexam.space' + entry;
const artifacts = path.resolve(process.env.SEO_ARZHENIKOV_ARTIFACT_DIR || path.join(root, 'artifacts/seo-arzhenikov'));
const bank = require('../trainers/oge-basics/multiplication-division/arzhenikov-discoveries-bank.js');
const storyIds = ['meanings', 'change', 'adjust', 'boundary', 'reverse', 'sequence'].map(id => id + '-1');
const entrances = ['/', '/trainers/', '/topics/', '/topics/delenie-ugolkom/', '/soviet-math/',
  '/trainers/oge-basics/', '/trainers/oge-basics/multiplication-division/'];
const courseRoutes = ["courses","courses-arithmetic","courses-written","courses-fractions","courses-decimals","courses-connections","courses-algebra","courses-geometry","course-check-placement","course-check-review","course-check-final"];
const directions = [
  {hash: 'workshop', mode: 'city', host: '#workshop-play'},
  {hash: 'harbor', mode: 'harbor', host: '#harbor-play'},
  {hash: 'discoveries', mode: 'discoveries', host: '#discoveries-play'},
  {hash: 'garden-count', mode: 'garden', host: '#garden-play'},
  {hash: 'count', mode: 'skills', host: '#activity'},
  {hash: 'journey-algebra', mode: 'journey', host: '#journey-map', group: 'algebra'},
  {hash: 'journey-geometry', mode: 'journey', host: '#journey-map', group: 'geometry'}
];
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.zip': 'application/zip'
};
const server = http.createServer((req, res) => {
  let file;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  } catch {
    res.writeHead(400); res.end(); return;
  }
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});

const clean = text => text.replace(/\s+/g, ' ').trim();
let entryClicks = 0, activityClicks = 0, storyClicks = 0;
async function visibleLink(page, target, scope = 'body') {
  const links = page.locator(scope + ' a[href]');
  const indexes = await links.evaluateAll((elements, wanted) => elements.flatMap((a, index) => {
    const url = new URL(a.href);
    return url.pathname + url.search + url.hash === wanted ? [index] : [];
  }), target);
  for (const index of indexes) if (await links.nth(index).isVisible()) return links.nth(index);
  throw Error('No visible ordinary link to ' + target + ' within ' + scope + ' at ' + page.url());
}

async function linkFits(link, width, label) {
  await link.scrollIntoViewIfNeeded();
  const rects = await link.evaluate(a => [...a.getClientRects()].map(r => ({
    left: r.left, right: r.right, width: r.width, height: r.height
  })));
  assert(rects.length && rects.every(r => r.width > 0 && r.height > 0 && r.left >= -1 && r.right <= width + 1),
    label + ': wrapped link must fit ' + width + 'px; ' + JSON.stringify(rects));
}

async function guideIdentity(page) {
  assert.equal(new URL(page.url()).pathname, entry, 'Back at the guide document');
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('h1').isVisible(), true);
  assert.match(await page.locator('h1').innerText(), /Аржеников/);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical);
}

async function scrollGuideTo(page, id) {
  await page.evaluate(target => {
    if (target) document.getElementById(target).scrollIntoView({block: 'start', behavior: 'instant'});
    else window.scrollTo({top: 0, behavior: 'instant'});
    // Instant scrolling is synchronous. A no-JS context permits evaluation but
    // does not run animation-frame callbacks, so do not await one here.
    document.documentElement.getBoundingClientRect();
  }, id);
}

async function checkGuideNavigator(page, width) {
  const host = page.locator('#maxexam-public-assistant');
  const launcher = host.locator('.launcher');
  const panel = host.locator('.panel');
  await launcher.waitFor({state: 'visible'});
  assert.equal(await host.count(), 1, 'One existing navigator instance');
  const presentation = await host.evaluate(element => {
    const button = element.shadowRoot.querySelector('.launcher');
    const label = element.shadowRoot.querySelector('.launcher-label');
    const strong = label.querySelector('strong');
    const rect = button.getBoundingClientRect();
    return {
      inMenu: element.parentElement?.matches('header.site-header nav.site-nav'),
      position: getComputedStyle(button).position, label: strong.textContent,
      clip: getComputedStyle(label).clipPath, font: parseFloat(getComputedStyle(strong).fontSize),
      labelWidth: label.getBoundingClientRect().width,
      left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
      width: rect.width, height: rect.height, viewportHeight: innerHeight
    };
  });
  assert.equal(presentation.inMenu, true, 'The original host occupies space in the guide header');
  assert.equal(presentation.position, 'static', 'The closed launcher scrolls with the document');
  assert.equal(presentation.label, 'Навигатор');
  assert.equal(presentation.clip, 'none', 'The mobile label is visible');
  assert(presentation.labelWidth > 60 && presentation.font >= 15 &&
    presentation.width >= 100 && presentation.height >= 44, 'Readable launcher and accessible target');
  assert(presentation.left >= 0 && presentation.right <= width && presentation.top >= 0 &&
    presentation.bottom <= presentation.viewportHeight, 'The complete launcher fits the first viewport');
  assert.equal(await panel.isVisible(), false);
  for (const target of [null, 'method', 'practice', 'sources']) {
    await scrollGuideTo(page, target);
    const overlaps = await page.evaluate(() => {
      const button = document.getElementById('maxexam-public-assistant').shadowRoot
        .querySelector('.launcher').getBoundingClientRect();
      return [...document.querySelectorAll('main h1,main h2,main h3,main p,main li,main a,main button,main input,main summary,main [role="img"]')]
        .filter(element => getComputedStyle(element).visibility !== 'hidden')
        .flatMap(element => [...element.getClientRects()]
          .filter(rect => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight &&
            rect.left < innerWidth && rect.right > 0 &&
            button.left < rect.right && button.right > rect.left && button.top < rect.bottom && button.bottom > rect.top)
          .map(() => element.textContent.trim().slice(0, 100)));
    });
    assert.deepEqual(overlaps, [], 'Closed navigator never covers visible text or CTA at ' + (target || 'top') + ', ' + width + 'px');
  }
  await scrollGuideTo(page, null);
  await launcher.click();
  await panel.waitFor({state: 'visible'});
  assert.equal(await panel.evaluate(element => getComputedStyle(element).position), 'fixed');
  const bounds = await panel.boundingBox();
  const height = page.viewportSize().height;
  assert(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width &&
    bounds.y + bounds.height <= height, 'The fixed dialog really fits the viewport after moving its host');
  await host.locator('textarea').press('Escape');
  assert.equal(await panel.isVisible(), false, 'Escape closes the same dialog');
  assert.equal(await launcher.isVisible(), true);
  assert.equal(await launcher.getAttribute('aria-expanded'), 'false');
  assert.equal(await host.evaluate(element => document.activeElement === element &&
    element.shadowRoot.activeElement === element.shadowRoot.querySelector('.launcher')), true,
  'Closing the dialog returns focus to the existing launcher');
}

async function checkGuide(page, width, enabled) {
  await guideIdentity(page);
  await page.evaluate(() => document.fonts.ready);
  await scrollGuideTo(page, null);
  if (enabled) await checkGuideNavigator(page, width);
  for (const id of ['method', 'practice', 'courses', 'discoveries', 'offline', 'sources']) {
    const section = page.locator('#' + id);
    assert.equal(await section.isVisible(), true, id + ': visible with JavaScript ' + enabled);
    assert(clean(await section.innerText()), id + ': rendered explanatory text');
    assert.equal(await section.locator('h2').isVisible(), true, id + ': visible heading');
  }
  const examples = page.locator('.worked-example');
  assert((await examples.count()) >= 2, 'Both meanings of division remain readable without JavaScript');
  for (let index = 0; index < await examples.count(); index++) {
    assert.equal(await examples.nth(index).isVisible(), true);
    assert(clean(await examples.nth(index).innerText()), 'An example has readable content');
  }
  assert.equal(await page.locator('#practice .topic-card').count(), 7);
  for (const direction of directions) {
    const link = await visibleLink(page, trainer + '#' + direction.hash, '#practice .topic-card');
    await linkFits(link, width, direction.hash);
  }
  for (const id of courseRoutes) {
    const link = await visibleLink(page, trainer + '#' + id, '#courses');
    await linkFits(link, width, id);
  }
  for (const id of storyIds) {
    const link = await visibleLink(page, trainer + '#discoveries-' + id, '#discoveries');
    await linkFits(link, width, id);
  }
  const offline = await visibleLink(page, '/trainers/oge-basics/multiplication-division/arzhenikov-offline.zip', '#offline');
  assert.notEqual(await offline.getAttribute('download'), null, 'Download works as an ordinary HTML link');
  await linkFits(offline, width, 'Offline package');
  const geometry = await page.evaluate(() => ({
    width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
    overflowing: [...document.querySelectorAll('main a,main h1,main h2,main h3,main p,main img,main [role="img"]')]
      .flatMap(el => [...el.getClientRects()].filter(r => r.width && r.height && (r.left < -1 || r.right > innerWidth + 1))
        .map(r => ({text: el.textContent.trim().slice(0, 90), left: r.left, right: r.right})))
  }));
  fs.writeFileSync(path.join(artifacts, 'guide-' + (enabled ? 'js' : 'nojs') + '-' + width + '.json'),
    JSON.stringify(geometry, null, 2) + '\n');
  assert(geometry.document <= width + 1 && geometry.body <= width + 1,
    'No horizontal document scrolling: ' + JSON.stringify(geometry));
  assert.deepEqual(geometry.overflowing, [], 'The visible guide content fits ' + width + 'px');
  await scrollGuideTo(page, null);
  // Capture the final closed navigator in its header, with all content retained.
  await page.screenshot({path: path.join(artifacts, 'guide-' + (enabled ? 'js' : 'nojs') + '-' + width + '.png'),
    fullPage: true, animations: 'disabled'});
}

async function clickAndReturn(page, link, target, verify) {
  const from = page.url();
  await Promise.all([
    page.waitForURL(url => url.pathname + url.search + url.hash === target),
    link.click()
  ]);
  await verify();
  await page.goBack({waitUntil: 'domcontentloaded'});
  await page.waitForURL(from);
}

async function checkEntrances(page, origin, width) {
  for (const source of entrances) {
    await page.goto(origin + source, {waitUntil: 'domcontentloaded'});
    const link = await visibleLink(page, entry);
    await linkFits(link, width, source + ' guide entrance');
    await clickAndReturn(page, link, entry, () => guideIdentity(page));
    assert.equal(new URL(page.url()).pathname, source, source + ': browser Back preserves the source page');
    assert.equal(await (await visibleLink(page, entry)).isVisible(), true);
    entryClicks++;
  }
}

async function checkActivities(page, origin, width) {
  await page.goto(origin + entry, {waitUntil: 'domcontentloaded'});
  for (const direction of directions) {
    const target = trainer + '#' + direction.hash;
    const link = await visibleLink(page, target, '#practice .topic-card');
    await linkFits(link, width, direction.hash + ' entrance');
    await clickAndReturn(page, link, target, async () => {
      await page.waitForFunction(mode => document.body.dataset.adventureMode === mode, direction.mode);
      const host = page.locator(direction.host);
      await host.waitFor({state: 'visible'});
      assert(clean(await host.innerText()), direction.hash + ': an actual lesson or map has rendered');
      if (direction.group) {
        assert.equal(await host.getAttribute('data-view'), 'group');
        assert.equal(await host.getAttribute('data-group'), direction.group);
      }
    });
    await guideIdentity(page);
    activityClicks++;
  }
  for (const id of courseRoutes) {
    const target = trainer + '#' + id;
    const link = await visibleLink(page, target, '#courses');
    await linkFits(link, width, id);
    await clickAndReturn(page, link, target, async () => {
      const host = page.locator('#arz-courses');
      await host.waitFor({state: 'visible'});
      assert(clean(await host.innerText()), id + ': course or assessment content rendered');
    });
    await guideIdentity(page);
    activityClicks++;
  }
  for (const id of storyIds) {
    const mission = bank.missions.find(item => item.id === id);
    assert(mission && mission.mode === 'practice', id + ': real practice mission');
    const target = trainer + '#discoveries-' + id;
    const link = await visibleLink(page, target, '#discoveries');
    await linkFits(link, width, id + ' entrance');
    await clickAndReturn(page, link, target, async () => {
      await page.waitForFunction(expected => {
        const host = document.getElementById('discoveries-play');
        return document.body.dataset.adventureMode === 'discoveries' && host?.dataset.mission === expected;
      }, id);
      const host = page.locator('#discoveries-play');
      assert.equal(await host.isVisible(), true);
      assert.equal(await host.getAttribute('data-stage'), 'predict', 'An unvisited learning story starts at its prediction');
      assert.equal(clean(await host.locator('.dc-title').innerText()), clean(mission.title), 'Correct story title');
      assert.equal(clean(await host.locator('.dc-story').innerText()), clean(mission.story), 'Correct original story');
      assert(await host.locator('input[name="dc-predict"]').count() > 0, 'The actual exercise is available');
    });
    await guideIdentity(page);
    storyClicks++;
  }
}

(async () => {
  let browser;
  let activePage;
  let currentCase = 'startup';
  fs.mkdirSync(artifacts, {recursive: true});
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({headless: true,
      ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
    for (const javaScriptEnabled of [false, true]) {
      const context = await browser.newContext({javaScriptEnabled, reducedMotion: 'reduce', acceptDownloads: true});
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      activePage = page;
      page.setDefaultTimeout(10000);
      const errors = [], missing = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        const request = response.request();
        if (response.url().startsWith(origin + '/') && response.status() >= 400 &&
            ['document', 'script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) {
          missing.push({url: response.url().slice(origin.length), status: response.status(), type: request.resourceType()});
        }
      });
      for (const width of [320, 390, 1280]) {
        currentCase = (javaScriptEnabled ? 'js' : 'nojs') + '-' + width;
        await page.setViewportSize({width, height: 900});
        await page.goto(origin + entry, {waitUntil: 'domcontentloaded'});
        await checkGuide(page, width, javaScriptEnabled);
        await checkEntrances(page, origin, width);
        if (javaScriptEnabled) await checkActivities(page, origin, width);
        assert.deepEqual(errors, [], 'No browser script errors in ' + currentCase);
        assert.deepEqual(missing, [], 'No missing local document or visual/runtime dependency in ' + currentCase);
        console.log('SEO_ARZHENIKOV_LAYOUT_OK: ' + width + 'px, JavaScript ' + javaScriptEnabled + ', readable guide, seven entrances and Back');
      }
      if (javaScriptEnabled) {
        await page.goto(origin + entry);
        const zip = await visibleLink(page, '/trainers/oge-basics/multiplication-division/arzhenikov-offline.zip', '#offline');
        const [download] = await Promise.all([page.waitForEvent('download'), zip.click()]);
        assert.equal(download.suggestedFilename(), 'arzhenikov-offline.zip');
        assert.equal(await download.failure(), null, 'The published package can actually be downloaded');
        await download.delete();
      }
      await context.close();
      activePage = null;
    }
    console.log('SEO_ARZHENIKOV_BROWSER_OK: ' + entryClicks + ' catalog clicks and Back with JS on/off; ' +
      activityClicks + ' activity links and ' + storyClicks + ' real bank story links and Back; ' +
      '320/390/1280px; full-page screenshots, no horizontal overflow, published ZIP download.');
  } catch (error) {
    if (activePage && !activePage.isClosed()) {
      await activePage.screenshot({path: path.join(artifacts, 'failure-' + currentCase + '.png'), fullPage: true})
        .catch(() => {});
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
