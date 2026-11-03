'use strict';
// Serve unchanged repository bytes in two chunks at the observed image token.
// A real historical 404 must be reproduced before the corrected page can pass.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PREFIX = (process.env.BOOK_PREFIX || '').replace(/\/$/, '');
assert(!PREFIX || /^\/book\/oge\/\d{4}-\d{2}-\d{2}\/v\d+$/.test(PREFIX), 'Invalid edition prefix');
const ROUTE = '/trainers/oge-task11-graphs-trainer.html';
const BASELINE_PREFIX = '/book/oge/2026-10-31/v1';
const WIDTHS = [320, 390, 1280];
const OUT = path.resolve(process.env.BOOK_DALI_IMAGE_OUTPUT || path.join(ROOT, 'artifacts/book-audit-exam', PREFIX ? 'dali-images-frozen-' + PREFIX.split('/').at(-1) : 'dali-images-source'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const runner = fs.readFileSync(__filename);
const historical = fs.readFileSync(path.join(ROOT, BASELINE_PREFIX + ROUTE));
const candidate = fs.readFileSync(path.join(ROOT, PREFIX + ROUTE));
const BASELINE_SHA = '84e27ca2bd18773a2959a36765018cf0fb7eab2883fd7edc443efcde66a335ac';
assert.equal(sha(historical), BASELINE_SHA, 'The negative control must use exact immutable v1 bytes');
const constant = (bytes, name) => {
  const matches = [...bytes.toString('utf8').matchAll(new RegExp("const " + name + " = '([^']*)';", 'g'))];
  assert.equal(matches.length, 1, 'Expected exactly one ' + name);
  return matches[0][1];
};
const expected = Object.fromEntries(['DALI_PORTRAIT_DATA', 'DALI_REFERENCE_HTML', 'DALI_CREDIT_HTML'].map(name => [name, constant(historical, name)]));
const jpeg = Buffer.from(expected.DALI_PORTRAIT_DATA.split(',')[1], 'base64');
assert.equal(sha(expected.DALI_PORTRAIT_DATA), 'aa8ff36826c2b213d3c6e52d3354b3613e7a3e3682455839e39f95aa180d36a5');
assert.equal(sha(jpeg), 'b6c33803d9aeb035f88eb3d7ca2f8f3a6a5f7d6c2300f9a67ad0e0103299cba5');
assert.equal(jpeg.length, 113621);
for (const [name, value] of Object.entries(expected)) assert.equal(constant(candidate, name), value, 'Portrait data, biography and credit must remain unchanged: ' + name);
const expectedAlt = 'Сальвадор Дали с загнутыми вверх усами, фотография 1965 года';
const fixture = { splitBefore: '<img data-dali-portrait', htmlChunkDelayMs: 100, scriptDelayMs: 1500, htmlBytesAltered: false };
const mime = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8', '.css': 'text/css;charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const literalPath = pathname => decodeURIComponent(pathname).endsWith("/'+DALI_PORTRAIT_DATA+'" );
let active;
const server = http.createServer((req, res) => {
  const report = active;
  try {
    const pathname = new URL(req.url, 'http://local').pathname;
    // This is the browser's optional default icon, not a trainer resource.
    if (pathname === '/favicon.ico') return res.writeHead(204).end();
    const filename = path.resolve(ROOT, '.' + decodeURIComponent(pathname));
    if (!filename.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    const bytes = pathname === report.documentPath ? report.documentBytes : fs.readFileSync(filename);
    res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Content-Length': bytes.length, 'Cache-Control': 'no-store' });
    if (pathname === report.documentPath) {
      const split = report.splitOffset;
      const pieces = [bytes.subarray(0, split), bytes.subarray(split)];
      assert(Buffer.concat(pieces).equals(bytes), 'Chunking must not change HTML bytes');
      let index = 0;
      const send = () => {
        if (res.destroyed) return;
        if (index === pieces.length) return res.end();
        res.write(pieces[index++]);
        setTimeout(send, fixture.htmlChunkDelayMs);
      };
      send();
    } else setTimeout(() => res.end(bytes), filename.endsWith('.js') ? fixture.scriptDelayMs : 0);
  } catch (error) {
    report.serverErrors.push({ stage: report.currentStage, path: new URL(req.url, 'http://local').pathname, status: 404 });
    res.writeHead(404).end();
  }
});

const result = {
  mode: 'LOCAL_IMAGE_REGRESSION', status: 'RUNNING', complete: false,
  testScriptSha256: sha(runner), prefix: PREFIX, route: ROUTE, widths: WIDTHS, fixture,
  historicalBaseline: { path: BASELINE_PREFIX + ROUTE, sha256: sha(historical), bytes: historical.length, role: 'Known failing immutable v1; negative control only' },
  candidate: { path: PREFIX + ROUTE, sha256: sha(candidate), bytes: candidate.length },
  portrait: { dataUriSha256: sha(expected.DALI_PORTRAIT_DATA), jpegSha256: sha(jpeg), jpegBytes: jpeg.length, width: 807, height: 1024, alt: expectedAlt },
  negativeControls: [], reports: []
};
const save = () => fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(result, (key, value) => key === 'documentBytes' || key === 'currentStage' ? undefined : value, 2) + '\n');
const localPath = url => { const parsed = new URL(url); return parsed.pathname + parsed.search; };

async function runCase(browser, origin, width, negative) {
  const prefix = negative ? BASELINE_PREFIX : PREFIX;
  const bytes = negative ? historical : candidate;
  const splitOffset = bytes.indexOf(Buffer.from(fixture.splitBefore));
  assert(splitOffset > 0 && bytes.indexOf(Buffer.from(fixture.splitBefore), splitOffset + 1) === -1, 'The exact portrait split token must be unique');
  const report = {
    width, role: negative ? 'historical-negative-control' : 'corrected-candidate',
    documentPath: prefix + ROUTE, documentBytes: bytes, inputSha256: sha(bytes), splitOffset,
    stages: [], documentResponses: [], htmlData: [], literalRequests: [], networkErrors: [],
    serverErrors: [], requestFailures: [], pageErrors: [], dependencyEscapes: [], currentStage: 'initial'
  };
  active = report;
  const context = await browser.newContext({ viewport: { width, height: 950 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  let documentId;
  page.on('pageerror', error => report.pageErrors.push({ stage: report.currentStage, message: error.message }));
  page.on('requestfailed', request => report.requestFailures.push({ stage: report.currentStage, path: localPath(request.url()), error: request.failure()?.errorText }));
  page.on('response', response => {
    if (response.status() >= 400) report.networkErrors.push({ stage: report.currentStage, path: localPath(response.url()), status: response.status() });
  });
  cdp.on('Network.requestWillBeSent', event => {
    if (event.type === 'Document') documentId = event.requestId;
    if (/DALI_PORTRAIT_DATA/i.test(event.request.url)) {
      const initiator = { ...event.initiator };
      if (initiator.url) initiator.url = localPath(initiator.url);
      report.literalRequests.push({ stage: report.currentStage, requestId: event.requestId, path: localPath(event.request.url), type: event.type, initiator });
    }
  });
  cdp.on('Network.dataReceived', event => {
    if (event.requestId === documentId) report.htmlData.push({ stage: report.currentStage, dataLength: event.dataLength, encodedDataLength: event.encodedDataLength });
  });
  await page.route('**/*', request => {
    const url = new URL(request.request().url());
    if (url.origin !== origin || (prefix && !url.pathname.startsWith(prefix + '/') && url.pathname !== '/favicon.ico')) {
      report.dependencyEscapes.push({ stage: report.currentStage, url: url.origin === origin ? url.pathname : url.origin + url.pathname });
      return request.abort();
    }
    return request.continue();
  });
  const inspectImages = async expectedCount => {
    await page.waitForFunction(count => {
      const images = [...document.querySelectorAll('[data-dali-portrait]')];
      return images.length === count && images.every(image => image.complete && image.naturalWidth === 807 && image.naturalHeight === 1024);
    }, expectedCount);
    const state = await page.evaluate(({ expectedCredit, expectedBiography }) => {
      const content = html => {
        const template = document.createElement('template'); template.innerHTML = html;
        return { text: template.content.textContent, links: [...template.content.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: a.textContent, target: a.target, rel: a.rel })) };
      };
      const extract = node => ({ text: node.textContent, links: [...node.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: a.textContent, target: a.target, rel: a.rel })) });
      return {
        viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth,
        expectedCredit: content(expectedCredit), expectedBiography: content(expectedBiography),
        images: [...document.querySelectorAll('[data-dali-portrait]')].map(image => {
          const ref = image.closest('.dali-reference'), rect = image.getBoundingClientRect();
          return { src: image.currentSrc, alt: image.alt, width: image.naturalWidth, height: image.naturalHeight,
            widthAttribute: image.getAttribute('width'), heightAttribute: image.getAttribute('height'), complete: image.complete,
            visible: image.getClientRects().length > 0, left: rect.left, right: rect.right, renderedWidth: rect.width,
            credit: extract(ref.querySelector('[data-dali-credit]')), biography: extract(ref.querySelector('[data-dali-biography]')) };
        })
      };
    }, { expectedCredit: expected.DALI_CREDIT_HTML, expectedBiography: expected.DALI_REFERENCE_HTML });
    assert.equal(state.images.length, expectedCount);
    assert(state.documentWidth <= width + 1, 'No horizontal document overflow');
    for (const image of state.images) {
      assert.equal(image.src, expected.DALI_PORTRAIT_DATA, 'Exact embedded portrait data URI');
      assert.equal(image.alt, expectedAlt);
      assert.deepEqual([image.width, image.height, image.widthAttribute, image.heightAttribute, image.complete], [807, 1024, '807', '1024', true]);
      assert.deepEqual(image.credit, state.expectedCredit, 'Exact credit and source link');
      assert.deepEqual(image.biography, state.expectedBiography, 'Exact biography and source link');
      if (image.visible) assert(image.renderedWidth > 0 && image.left >= -1 && image.right <= width + 1, 'Visible portrait fits its viewport');
    }
    report.stages.push({ stage: report.currentStage, status: 'PASS', documentWidth: state.documentWidth,
      images: state.images.map(({ src, ...image }) => ({ ...image, dataUriSha256: sha(src), jpegSha256: sha(Buffer.from(src.split(',')[1], 'base64')) })) });
  };
  const navigate = async reload => {
    const response = reload ? await page.reload({ waitUntil: 'load', timeout: 25000 }) : await page.goto(origin + report.documentPath, { waitUntil: 'load', timeout: 25000 });
    assert.equal(response.status(), 200);
    const observedSha256 = sha(await response.body());
    report.documentResponses.push({ stage: report.currentStage, status: response.status(), observedSha256 });
    assert.equal(observedSha256, report.inputSha256, 'Browser received exact on-disk HTML bytes');
  };
  const progress = () => page.evaluate(() => ({
    selectedAnswers: [...document.querySelectorAll('#m4-desc > .row > select')].map(select => select.value),
    answer: document.querySelector('#m4-answer').value, attempts: M4.attempts, done: M4.done,
    progress: localStorage.getItem('mathExamCourseProgress.v1')
  }));
  try {
    await navigate(false);
    await inspectImages(1);
    if (!negative) {
      report.currentStage = 'help';
      const before = await progress();
      await page.locator('#m4-hint').click();
      await page.locator('#m4-hintbox [data-family="hyp"]').click();
      await page.locator('#lab-dali > summary').click();
      assert(await page.locator('#lab-dali [data-dali-portrait]').isVisible(), 'General help visibly opens the portrait');
      await page.locator('#lab-dali').screenshot({ path: path.join(OUT, width + '-help-general.png') });
      let found = false;
      for (let index = 0; index < 3; index++) {
        await page.locator('#m4-desc .function-help[data-i="' + index + '"]').click();
        if (await page.evaluate(() => Task11Discovery.getState().kind === 'hyp')) { found = true; break; }
      }
      assert(found, 'The initial matching exercise has hyperbola help');
      await page.locator('#t11-help-dali > summary').click();
      assert(await page.locator('#t11-help-dali [data-dali-portrait]').isVisible(), 'Function help visibly opens the portrait');
      await inspectImages(2);
      assert.deepEqual(await progress(), before, 'Reading either portrait changes no answer, attempt, result or saved progress');
      await page.locator('#t11-help-dali').screenshot({ path: path.join(OUT, width + '-help-function.png') });
      report.currentStage = 'reload';
      await navigate(true);
      await inspectImages(1);
      assert.deepEqual(await progress(), before, 'Reload after reading help retains the original unsolved state');
    }
  } catch (error) { report.error = error.message; }
  report.status = !report.error && report.stages.length === (negative ? 1 : 3) && !report.networkErrors.length && !report.serverErrors.length && !report.literalRequests.length && !report.pageErrors.length && !report.requestFailures.length && !report.dependencyEscapes.length ? 'PASS' : 'FAIL';
  if (negative) {
    report.negativeControl = !report.error && report.status === 'FAIL' && report.stages.length === 1 &&
      report.literalRequests.some(request => literalPath(request.path) && request.type === 'Image' && request.initiator.type === 'parser') &&
      report.networkErrors.some(error => literalPath(error.path) && error.status === 404) &&
      report.serverErrors.some(error => literalPath(error.path) && error.status === 404) &&
      report.networkErrors.every(error => literalPath(error.path) && error.status === 404) &&
      report.serverErrors.every(error => literalPath(error.path) && error.status === 404) &&
      !report.pageErrors.length && !report.requestFailures.length && !report.dependencyEscapes.length ? 'PASS' : 'FAIL';
  }
  await context.close();
  return report;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'runner-used.cjs'), runner);
  save();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
    result.browserVersion = browser.version();
    for (const width of WIDTHS) {
      const report = await runCase(browser, origin, width, true);
      result.negativeControls.push(report); save();
      console.log('historical negative', width, report.negativeControl, 'browser', report.status, 'literal404', report.networkErrors.length);
    }
    assert(result.negativeControls.every(report => report.negativeControl === 'PASS'), 'The exact historical failure must reproduce at every width; absence is a failed negative control');
    for (const width of WIDTHS) {
      const report = await runCase(browser, origin, width, false);
      result.reports.push(report); save();
      console.log('corrected candidate', width, report.status, 'image stages', report.stages.length, 'literal requests', report.literalRequests.length, report.error || '');
    }
    assert(result.reports.every(report => report.status === 'PASS'), 'Corrected portrait initial/help/reload checks failed');
    result.status = 'PASS'; result.complete = true;
  } catch (error) {
    result.status = 'FAIL'; result.error = error.message; process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    result.finishedAt = new Date().toISOString(); save();
  }
})().catch(error => { console.error(error); result.status = 'FAIL'; result.error = error.message; save(); server.closeAllConnections(); server.close(); process.exitCode = 1; });
