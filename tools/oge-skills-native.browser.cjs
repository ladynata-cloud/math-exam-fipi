'use strict';
/*
 * Actual Chromium navigation through the additive OGE skill-map entrances.
 * Run: node tools/oge-skills-native.browser.cjs
 * Public source pages, map controls, resource links and return links are clicked
 * or tapped. page.evaluate is used only to observe layout/DOM and await painting.
 * All lesson URLs and node IDs come from the final catalog in this checkout.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/oge-skills-native');
const WIDTHS = [320, 390, 1280];
const TIMEOUT = 15000;
const WORKERS = 2;
const MANIFEST_PATH = 'oge/skills/source-entrances.json';
const NAV = [
  { href: '/trainers/oge-course/', text: '← Все темы ОГЭ' },
  { href: '/', text: 'Главная' }
];
const startedAt = new Date().toISOString();
const report = {
  schemaVersion: 1,
  gate: 'oge-skills-native-browser',
  startedAt,
  status: 'running',
  viewportWidths: WIDTHS,
  expected: {},
  cases: [],
  failures: [],
  screenshots: [],
  notRun: [],
  blockedExternalOrigins: [],
  sourceHashes: {}
};
let browser, server, origin, maps, byId, entrances, investigationEdges, lessons;
let nextCase = 0, failureScreenshots = 0;
const blockedOrigins = new Set();

function normalize(text) { return String(text).replace(/\s+/g, ' ').trim(); }
function sha(file) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex'); }
function relativeHref(url) { return url.pathname + url.search + url.hash; }
function nativeURL(href) { return new URL(href, origin); }
function mapURL(map, node) { return new URL('/oge/skills/#' + map.id + (node ? '?node=' + node.id : ''), origin); }
function resourceURL(map, node, resource) {
  const url = nativeURL(resource.href);
  if (resource.investigationId) url.searchParams.set('skill-model', resource.investigationId);
  url.searchParams.set('skill-map', map.id);
  url.searchParams.set('skill-node', node.id);
  return url;
}
function safeName(value) { return String(value).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0,130); }
function observeURL(actual, expected, label) {
  const url = new URL(actual);
  assert.equal(url.origin, expected.origin, label + ': origin');
  assert.equal(url.pathname, expected.pathname, label + ': path');
  assert.equal(url.hash, expected.hash, label + ': fragment');
  assert.deepEqual([...url.searchParams].sort(), [...expected.searchParams].sort(), label + ': query');
}
function contracts() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, MANIFEST_PATH), 'utf8'));
  assert.equal(manifest.schemaVersion, 1, 'source entrance schema');
  entrances = manifest.entries;
  assert.equal(entrances.length, 33, 'all 33 source entrances are required');
  assert.equal(new Set(entrances.map(e => e.path)).size, 33, 'unique source entrance paths');
  const catalog = require(path.join(ROOT, 'oge/skills/catalog.js'));
  maps = catalog.maps;
  byId = catalog.byId;
  assert.equal(maps.length, 28, '28 final maps');
  assert.equal(maps.reduce((n,m) => n + m.nodes.length, 0), 168, '168 final nodes');
  assert.equal(entrances.filter(e => e.map).length, 28, '28 map-specific source entrances');
  assert.equal(entrances.filter(e => !e.map).length, 5, 'five common practical entrances');
  assert.deepEqual(entrances.filter(e => e.map).map(e => e.map).sort(), maps.map(m => m.id).sort());
  for (const entry of entrances) {
    assert.match(entry.path, /^trainers\/[a-zA-Z0-9/_-]+\.html$/);
    const html = fs.readFileSync(path.join(ROOT, entry.path), 'utf8');
    assert.equal(html.split(entry.headSnippet).length - 1, 1, 'exact head addition: ' + entry.path);
    assert.equal(html.split(entry.entranceSnippet).length - 1, 1, 'exact entrance addition: ' + entry.path);
    const nav = html.match(/<nav\b[^>]*class=["'][^"']*\boge-wayfinding\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i);
    assert.ok(nav, 'retained navigation exists: ' + entry.path);
    assert.equal((nav[0].match(/<a\b/gi) || []).length, 2, 'two retained links in source: ' + entry.path);
    assert.ok(html.indexOf(entry.entranceSnippet) > html.indexOf(nav[0]), 'additive aside follows retained nav');
    if (entry.map) {
      const map = byId[entry.map];
      assert.ok(map, 'manifest map resolves');
      assert.equal(map.source.href.split(/[?#]/)[0], '/' + entry.path, 'catalog native source is the manifest page');
      assert.equal(entry.href, '/oge/skills/#' + map.id);
    } else assert.equal(entry.href, '/oge/skills/');
  }
  lessons = [
    ...require(path.join(ROOT, 'trainers/oge-video-graphs.js')),
    ...require(path.join(ROOT, 'trainers/oge-video-geometry.js'))
  ];
  assert.equal(lessons.length, 10, 'all ten native investigations');
  assert.equal(new Set(lessons.map(l => l.id)).size, 10);
  investigationEdges = maps.flatMap(map => map.nodes.flatMap(node =>
    node.resources.flatMap((resource, index) => resource.investigationId ? [{ map, node, resource, index }] : [])
  ));
  assert.deepEqual([...new Set(investigationEdges.map(e => e.resource.investigationId))].sort(),
    lessons.map(l => l.id).sort(), 'catalog reuses every native investigation');
  for (const edge of investigationEdges) {
    const lesson = lessons.find(l => l.id === edge.resource.investigationId);
    const nativePath = edge.resource.href.split(/[?#]/)[0].replace(/^\//, '');
    assert.ok(entrances.some(e => e.path === nativePath), 'investigation has a real return entrance: ' + nativePath);
    const html = fs.readFileSync(path.join(ROOT, nativePath), 'utf8');
    const task = Number(html.match(/\bdata-oge-video-task=["'](\d+)["']/)?.[1]);
    assert.ok(lesson.tasks.includes(task), 'lesson belongs to the linked native task: ' + lesson.id);
    assert.equal(edge.resource.href.split('#')[1], 'oge-video-models');
  }
  const files = [
    MANIFEST_PATH, 'oge/skills/entry.js', 'oge/skills/entry-data.js', 'oge/skills/entry.css',
    'oge/skills/catalog.js', 'oge/skills/app.js', 'oge/skills/maps-practical.js',
    'oge/skills/maps-algebra.js', 'oge/skills/maps-geometry.js',
    'trainers/oge-video-models.js', 'trainers/oge-video-graphs.js',
    'trainers/oge-video-geometry.js', 'assets/oge-wayfinding.js',
    'assets/oge-wayfinding.css', 'tools/oge-skills-native.browser.cjs'
  ];
  for (const file of files) report.sourceHashes[file] = sha(file);
  report.manifestBase = manifest.baseSha;
  report.mapCount = maps.length;
  report.nodeCount = maps.reduce((n,m) => n + m.nodes.length, 0);
  report.investigationIds = lessons.map(l => l.id).sort();
  report.investigationEdges = investigationEdges.length;
  try { report.head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); }
  catch (_) { report.head = null; }
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf'
};
async function startServer() {
  if (process.env.OGE_SKILLS_NATIVE_BASE_URL) {
    const url = new URL(process.env.OGE_SKILLS_NATIVE_BASE_URL);
    assert.ok(/^https?:$/.test(url.protocol), 'HTTP(S) base URL');
    origin = url.origin;
    report.externalBase = true;
    return;
  }
  server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch (_) { res.writeHead(400).end('bad URL'); return; }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    let file = path.resolve(ROOT, '.' + pathname);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      res.writeHead(200);
      res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(file));
    } catch (_) { res.writeHead(404).end('not found'); }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  origin = 'http://127.0.0.1:' + server.address().port;
}

async function paint(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function goto(page, url) {
  const response = await page.goto(String(url), { waitUntil: 'load', timeout: TIMEOUT });
  assert.ok(response && response.ok(), 'loaded actual HTML: ' + url + ' (' + response?.status() + ')');
  await paint(page);
}
async function layout(page, label, evidence) {
  const value = await page.evaluate(() => ({
    viewport: innerWidth, document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  evidence.layouts.push({ label, ...value });
  assert.ok(value.document <= value.viewport + 1 && value.body <= value.viewport + 1,
    label + ': horizontal overflow ' + JSON.stringify(value));
}
async function target(page, locator, label, evidence, min = 44) {
  await locator.waitFor({ state: 'visible', timeout: TIMEOUT });
  await locator.scrollIntoViewIfNeeded();
  await paint(page);
  const value = await locator.evaluate(el => {
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    let hit = document.elementFromPoint(x, y);
    while (hit?.shadowRoot) {
      const inner = hit.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === hit) break;
      hit = inner;
    }
    return {
      width: r.width, height: r.height, left: r.left, right: r.right,
      top: r.top, bottom: r.bottom, viewport: innerWidth,
      hit: !!hit && (hit === el || el.contains(hit)),
      interceptedBy: hit ? hit.tagName + (typeof hit.className === 'string' ? '.' + hit.className : '') : null
    };
  });
  evidence.targets.push({ label, ...value });
  assert.ok(value.width >= min - 0.5 && value.height >= min - 0.5,
    label + ': target smaller than ' + min + ' CSS px ' + JSON.stringify(value));
  assert.ok(value.left >= -1 && value.right <= value.viewport + 1,
    label + ': target outside the viewport ' + JSON.stringify(value));
  assert.ok(value.hit, label + ': target is covered ' + JSON.stringify(value));
}
async function activate(page, locator, label, evidence) {
  await target(page, locator, label, evidence);
  if (evidence.width < 500) await locator.tap();
  else await locator.click();
}
async function clickURL(page, locator, url, label, evidence) {
  assert.equal(new URL(await locator.getAttribute('href'), page.url()).href, url.href, label + ': actual href');
  await target(page, locator, label, evidence);
  await Promise.all([
    page.waitForURL(u => u.href === url.href, { waitUntil: 'load', timeout: TIMEOUT }),
    evidence.width < 500 ? locator.tap() : locator.click()
  ]);
  await paint(page);
  observeURL(page.url(), url, label);
  evidence.navigations.push({ label, href: relativeHref(url) });
}
async function nativeNav(page, evidence, visible) {
  const nav = page.locator('nav.oge-wayfinding');
  assert.equal(await nav.count(), 1, 'one retained native navigation');
  const links = await nav.locator('a').evaluateAll(elements => elements.map(el => ({
    href: el.getAttribute('href'), text: el.textContent.replace(/\s+/g, ' ').trim()
  })));
  assert.deepEqual(links, NAV, 'original two links remain unchanged and in the same order');
  assert.equal(await nav.locator('.oge-skill-entrance').count(), 0, 'new entrance stays outside the old nav');
  if (visible) for (let i = 0; i < 2; i++)
    await target(page, nav.locator('a').nth(i), 'retained navigation ' + (i + 1), evidence);
  evidence.originalNavigationChecks++;
}
async function waitMap(page, map, node) {
  await page.locator('#skill-title').waitFor({ state: 'visible', timeout: TIMEOUT });
  assert.equal(normalize(await page.locator('#skill-title').textContent()), normalize(map.title));
  assert.equal(await page.locator('[data-node-link]').count(), 6, 'six rendered map nodes');
  if (node) {
    await page.waitForFunction(({ title }) =>
      document.getElementById('skill-node-title')?.textContent.trim() === title,
      { title: node.title }, { timeout: TIMEOUT });
    assert.equal(await page.locator('[data-node-link][aria-current="step"]').getAttribute('data-node-link'), node.id);
  }
}
async function chooseNode(page, map, node, evidence) {
  await waitMap(page, map);
  const panel = page.locator('#skill-map-panel');
  if (!(await panel.evaluate(el => el.open)))
    await activate(page, panel.locator(':scope > summary'), 'open six-step map', evidence);
  await clickURL(page, page.locator('[data-node-link="' + node.id + '"]'), mapURL(map, node),
    'select map node ' + node.id, evidence);
  await waitMap(page, map, node);
  await layout(page, 'selected map node', evidence);
}
async function returnToNode(page, map, node, evidence) {
  const entry = page.locator('.oge-skill-entrance');
  assert.equal(await entry.count(), 1);
  assert.equal(await entry.isVisible(), true, 'return entrance is visible in ordinary native trainer');
  const link = entry.locator('a');
  assert.equal(await entry.locator('a').count(), 1, 'one unambiguous return action');
  assert.ok((await link.textContent()).includes('← К шагу «' + node.title + '»'), 'return names the actual node');
  assert.equal(normalize(await link.locator('small').textContent()), normalize(map.title), 'return names the actual map');
  await clickURL(page, link, mapURL(map, node), 'return to the same map and node', evidence);
  await waitMap(page, map, node);
  await layout(page, 'returned map node', evidence);
  evidence.returnedNode = map.id + '/' + node.id;
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false, animations: 'disabled' });
  report.screenshots.push(name);
}

async function entranceCase(page, item, evidence) {
  const entry = item.entry;
  await goto(page, nativeURL('/' + entry.path));
  await nativeNav(page, evidence, true);
  const aside = page.locator('.oge-skill-entrance');
  assert.equal(await aside.count(), 1, 'one additive source entrance');
  assert.equal(await aside.locator('a').count(), 1, 'one source entrance link');
  assert.equal(await aside.isVisible(), true, 'public source entrance is visible');
  assert.equal(await page.locator('nav.oge-wayfinding').evaluate(el =>
    el.nextElementSibling?.classList.contains('oge-skill-entrance')), true, 'aside directly follows original nav');
  const link = aside.locator('a');
  await layout(page, 'native source entrance', evidence);
  await target(page, link, 'native map entrance', evidence);
  if (entry.map === 'practical-roads-grid' && item.width === 320)
    await shot(page, 'native-entry-320.png');
  await clickURL(page, link, nativeURL(entry.href), 'native entrance to map', evidence);
  if (!entry.map) {
    await page.locator('.skill-card[data-skill-map]').first().waitFor({ state: 'visible', timeout: TIMEOUT });
    assert.equal(await page.locator('.skill-card[data-skill-map]').count(), 28, 'common entrance opens all maps');
    await layout(page, 'common map catalog', evidence);
    return;
  }
  const map = byId[entry.map];
  // Exercise three different non-default nodes across the three viewport widths.
  const node = map.nodes[1 + 2 * WIDTHS.indexOf(item.width)];
  await chooseNode(page, map, node, evidence);
  const index = node.resources.findIndex(r =>
    r.href.split(/[?#]/)[0] === '/' + entry.path && !r.investigationId);
  assert.ok(index >= 0, 'the selected node retains its native task resource');
  const resource = node.resources[index], expected = resourceURL(map, node, resource);
  await clickURL(page, page.locator('[data-resource="' + index + '"]'), expected,
    'map resource to native trainer', evidence);
  await nativeNav(page, evidence, true);
  assert.equal(new URL(page.url()).searchParams.get('skill-map'), map.id);
  assert.equal(new URL(page.url()).searchParams.get('skill-node'), node.id);
  await layout(page, 'native trainer with return context', evidence);
  await returnToNode(page, map, node, evidence);
  if (map.id === 'oge-24' && item.width === 1280) {
    await page.locator('#skill-node-title').scrollIntoViewIfNeeded();
    await shot(page, 'same-node-return-1280.png');
  }
}

async function isolationCase(page, item, evidence) {
  const entry = item.entry, url = nativeURL('/' + entry.path);
  url.searchParams.set(item.mode, '1');
  if (entry.map) {
    const map = byId[entry.map];
    url.searchParams.set('skill-map', map.id);
    url.searchParams.set('skill-node', map.nodes[5].id);
  }
  await goto(page, url);
  await page.locator('.oge-skill-entrance').waitFor({ state: 'attached', timeout: TIMEOUT });
  await nativeNav(page, evidence, false);
  assert.equal(await page.locator('.oge-skill-entrance').evaluate(el => el.hidden), true,
    item.mode + ': entry has hidden semantics');
  assert.equal(await page.locator('.oge-skill-entrance').isVisible(), false,
    item.mode + ': entry is not visible');
  assert.equal(await page.locator('.oge-skill-entrance a:visible').count(), 0,
    item.mode + ': no visible exploration action');
  assert.equal(await page.locator('#oge-video-models').count(), 0,
    item.mode + ': no exploration model inserted into isolated native trainer');
  await layout(page, item.mode + ' isolated native page', evidence);
}

async function frameCase(page, item, evidence) {
  const src = nativeURL('/' + item.entry.path).href.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  // A real browsing context, not a stub of window.top or a fake isolation flag.
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0"><iframe title="Embedded native trainer" style="border:0;width:100%;height:900px" src="' +
    src + '"></iframe></body></html>', { waitUntil: 'load', timeout: TIMEOUT });
  const handle = await page.locator('iframe').elementHandle();
  const frame = await handle.contentFrame();
  assert.ok(frame, 'real native iframe exists');
  await frame.locator('.oge-skill-entrance').waitFor({ state: 'attached', timeout: TIMEOUT });
  assert.equal(await frame.evaluate(() => window.self !== window.top), true, 'real embedded window');
  await nativeNav(frame, evidence, false);
  assert.equal(await frame.locator('.oge-skill-entrance').evaluate(el => el.hidden), true, 'iframe entry has hidden semantics');
  assert.equal(await frame.locator('.oge-skill-entrance').isVisible(), false, 'iframe entry is invisible');
  assert.equal(await frame.locator('.oge-skill-entrance a:visible').count(), 0);
  assert.equal(await frame.locator('#oge-video-models').count(), 0, 'iframe contains no exploration model');
  await layout(frame, 'actual iframe native page', evidence);
}

async function investigationCase(page, item, evidence) {
  const { map, node, resource, index } = item.edge;
  const id = resource.investigationId, lesson = lessons.find(l => l.id === id);
  // Seed a different lesson through the actual native picker, where one exists.
  // The subsequent map click must override this remembered selection.
  await goto(page, nativeURL(resource.href));
  const shell = page.locator('#oge-video-models');
  await shell.waitFor({ state: 'attached', timeout: TIMEOUT });
  if (!(await shell.evaluate(el => el.open)))
    await activate(page, shell.locator('summary[data-ovm-open]'), 'open native model before link test', evidence);
  const picker = shell.locator('[data-ovm-picker]');
  const options = await picker.locator('option').evaluateAll(es => es.map(el => el.value));
  assert.ok(options.includes(id), 'linked investigation is actually available on native page');
  const alternate = options.find(value => value !== id);
  if (alternate) {
    await target(page, picker, 'native lesson picker before link test', evidence);
    await picker.selectOption(alternate);
    await page.locator('[data-ovm-lesson="' + alternate + '"]').waitFor({ state: 'visible', timeout: TIMEOUT });
    assert.equal(await picker.inputValue(), alternate);
    evidence.previouslySelectedInvestigation = alternate;
  } else evidence.previouslySelectedInvestigation = null;
  await goto(page, mapURL(map));
  await chooseNode(page, map, node, evidence);
  const expected = resourceURL(map, node, resource);
  await clickURL(page, page.locator('[data-resource="' + index + '"]'), expected,
    'map resource to requested investigation ' + id, evidence);
  await nativeNav(page, evidence, true);
  const activeShell = page.locator('#oge-video-models');
  await page.waitForFunction(expectedId => {
    const shell = document.getElementById('oge-video-models');
    return !!shell?.open && shell.querySelector('[data-ovm-picker]')?.value === expectedId &&
      shell.querySelector('[data-ovm-lesson]')?.dataset.ovmLesson === expectedId;
  }, id, { timeout: TIMEOUT });
  assert.equal(await activeShell.evaluate(el => el.open), true, 'native model disclosure is actually open');
  assert.equal(await activeShell.locator('[data-ovm-picker]').inputValue(), id, 'native picker selects requested investigation');
  const host = activeShell.locator('[data-ovm-lesson]');
  assert.equal(await host.count(), 1);
  assert.equal(await host.getAttribute('data-ovm-lesson'), id, 'native host renders requested investigation');
  assert.equal(await host.isVisible(), true, 'native investigation host is visible');
  assert.equal(normalize(await host.locator('h2').first().textContent()), normalize(lesson.title));
  const actual = new URL(page.url());
  assert.equal(actual.searchParams.get('skill-model'), id);
  assert.equal(actual.searchParams.get('skill-map'), map.id);
  assert.equal(actual.searchParams.get('skill-node'), node.id);
  await target(page, activeShell.locator('summary[data-ovm-open]'), 'opened investigation disclosure', evidence);
  await target(page, activeShell.locator('[data-ovm-picker]'), 'selected investigation picker', evidence);
  await layout(page, 'opened requested investigation', evidence);
  if (id === 'line-parameters' && item.width === 390) {
    await activeShell.locator('summary').scrollIntoViewIfNeeded();
    await shot(page, 'requested-investigation-390.png');
  }
  evidence.selectedInvestigation = id;
  evidence.resourceHref = resource.href;
  await returnToNode(page, map, node, evidence);
}

async function newPage(width) {
  const context = await browser.newContext({
    viewport: { width, height: 900 }, reducedMotion: 'reduce', hasTouch: width < 500,
    serviceWorkers: 'block'
  });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin || ['data:','blob:'].includes(url.protocol)) return route.continue();
    blockedOrigins.add(url.origin);
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);
  return { context, page };
}

async function runCase(item) {
  const t0 = Date.now(), { context, page } = await newPage(item.width);
  const evidence = {
    id: item.id, kind: item.kind, width: item.width, status: 'running',
    source: item.entry?.path || item.edge?.resource.href,
    map: item.entry?.map || item.edge?.map.id || null,
    node: item.edge?.node.id || null,
    investigationId: item.edge?.resource.investigationId || null,
    layouts: [], targets: [], navigations: [], originalNavigationChecks: 0,
    pageErrors: [], ownResourceErrors: []
  };
  page.on('pageerror', error => evidence.pageErrors.push(error.message));
  page.on('dialog', dialog => dialog.dismiss());
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin === origin && response.status() >= 400 &&
      (url.pathname.startsWith('/oge/skills/') || url.pathname.startsWith('/foundations/')))
      evidence.ownResourceErrors.push({ href: relativeHref(url), status: response.status() });
  });
  try {
    if (item.kind === 'entrance') await entranceCase(page, item, evidence);
    else if (item.kind === 'mode-isolation') await isolationCase(page, item, evidence);
    else if (item.kind === 'frame-isolation') await frameCase(page, item, evidence);
    else if (item.kind === 'investigation') await investigationCase(page, item, evidence);
    else throw Error('Unknown case kind');
    assert.deepEqual(evidence.pageErrors, [], 'no uncaught browser errors');
    assert.deepEqual(evidence.ownResourceErrors, [], 'new skill-map resources load successfully');
    evidence.status = 'pass';
  } catch (error) {
    evidence.status = 'fail';
    evidence.error = error.stack || String(error);
    report.failures.push({ id: item.id, error: error.message || String(error) });
    if (failureScreenshots++ < 8) {
      const name = 'FAIL-' + safeName(item.id) + '.png';
      try { await shot(page, name); evidence.screenshot = name; }
      catch (shotError) { evidence.screenshotError = String(shotError); }
    }
  } finally {
    evidence.durationMs = Date.now() - t0;
    report.cases.push(evidence);
    await context.close();
    process.stdout.write(evidence.status.toUpperCase() + ' ' + item.id + '\n');
  }
}
function buildCases() {
  const cases = [];
  for (const width of WIDTHS) for (const entry of entrances) {
    cases.push({ id: 'entrance-' + width + '-' + safeName(entry.path), kind: 'entrance', width, entry });
    for (const mode of ['board','embedded'])
      cases.push({ id: mode + '-' + width + '-' + safeName(entry.path), kind: 'mode-isolation', width, entry, mode });
  }
  for (const entry of entrances)
    cases.push({ id: 'iframe-390-' + safeName(entry.path), kind: 'frame-isolation', width: 390, entry });
  for (const width of WIDTHS) for (const edge of investigationEdges)
    cases.push({
      id: 'investigation-' + width + '-' + edge.map.id + '-' + edge.node.id + '-' + edge.index,
      kind: 'investigation', width, edge
    });
  assert.equal(new Set(cases.map(c => c.id)).size, cases.length, 'unique browser cases');
  report.expected = {
    entrance: 33 * WIDTHS.length, 'mode-isolation': 33 * WIDTHS.length * 2,
    'frame-isolation': 33, investigation: investigationEdges.length * WIDTHS.length,
    total: cases.length
  };
  return cases;
}
async function preflight() {
  const { context, page } = await newPage(1280);
  try {
    await goto(page, nativeURL('/oge/skills/'));
    await page.locator('[data-skill-map]').first().waitFor({ state: 'visible', timeout: TIMEOUT });
    assert.equal(await page.locator('[data-skill-map]').count(), 28, 'real catalog boots before case matrix');
    await goto(page, nativeURL('/' + entrances[0].path));
    await page.locator('.oge-skill-entrance a').waitFor({ state: 'visible', timeout: TIMEOUT });
    const allowlist = await page.evaluate(() => ({
      maps: Object.keys(window.OgeSkillEntryData || {}).length,
      nodes: Object.values(window.OgeSkillEntryData || {}).reduce((sum,m) => sum + Object.keys(m.nodes || {}).length, 0)
    }));
    assert.deepEqual(allowlist, { maps: 28, nodes: 168 }, 'actual native return allowlist is loaded');
    report.preflight = 'pass';
  } finally { await context.close(); }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let cases = [];
  try {
    contracts();
    cases = buildCases();
    await startServer();
    report.baseURL = origin;
    const executablePath = process.env.OGE_SKILLS_CHROMIUM || process.env.CHROMIUM_EXECUTABLE_PATH;
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    report.browserVersion = browser.version();
    await preflight();
    const workers = await Promise.allSettled(Array.from({ length: WORKERS }, async () => {
      while (nextCase < cases.length) {
        const item = cases[nextCase++];
        await runCase(item);
      }
    }));
    const rejected = workers.filter(result => result.status === 'rejected');
    if (rejected.length) throw new AggregateError(rejected.map(result => result.reason), 'Browser worker failed');
    assert.equal(report.cases.length, cases.length, 'every required browser case completed');
    const observed = new Set(report.cases.filter(c => c.kind === 'investigation' && c.status === 'pass').map(c => c.investigationId));
    assert.deepEqual([...observed].sort(), lessons.map(l => l.id).sort(), 'all ten investigations actually opened');
  } catch (error) {
    report.fatal = error.stack || String(error);
    report.failures.push({ id: 'gate-infrastructure-or-contract', error: error.message || String(error) });
  } finally {
    try { if (browser) await browser.close(); } catch (_) {}
    try { if (server?.listening) await new Promise(resolve => server.close(resolve)); } catch (_) {}
    const completed = new Set(report.cases.map(c => c.id));
    report.notRun = cases.filter(c => !completed.has(c.id)).map(c => c.id);
    report.cases.sort((a,b) => a.id.localeCompare(b.id));
    report.blockedExternalOrigins = [...blockedOrigins].sort();
    report.finishedAt = new Date().toISOString();
    report.durationMs = Date.parse(report.finishedAt) - Date.parse(startedAt);
    report.passed = report.cases.filter(c => c.status === 'pass').length;
    report.failed = report.cases.filter(c => c.status === 'fail').length;
    report.status = report.failures.length || report.notRun.length ? 'fail' : 'pass';
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    process.stdout.write(JSON.stringify({
      gate: report.gate, status: report.status, passed: report.passed, failed: report.failed,
      notRun: report.notRun.length, report: 'artifacts/oge-skills-native/report.json'
    }) + '\n');
    if (report.status !== 'pass') process.exitCode = 1;
  }
})();
