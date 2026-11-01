'use strict';
// Browser regression for the observed parser-attributed literal image requests.
// HTML bytes are unchanged; only network delivery timing is controlled.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PREFIX = (process.env.BOOK_PREFIX || '').replace(/\/$/, '');
const ROUTE = '/trainers/oge-1-5-trainers/practice-1-5-tires.html';
const OUT = path.resolve(process.env.BOOK_TIRE_IMAGE_OUTPUT || path.join(ROOT, 'artifacts/book-audit-exam', PREFIX ? 'tire-images-frozen' : 'tire-images-source'));
const WIDTHS = (process.env.BOOK_TIRE_IMAGE_WIDTHS || '320,390,1280').split(',').map(Number);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const runner = fs.readFileSync(__filename);
const input = fs.readFileSync(path.join(ROOT, PREFIX + ROUTE));
const fixture = { htmlChunkBytes: 8192, chunkDelayMs: 1, scriptDelayMs: 200 };
const mime = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8', '.css': 'text/css;charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
    if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const bytes = fs.readFileSync(file);
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Content-Length', bytes.length);
    if (file.endsWith('.js')) setTimeout(() => res.end(bytes), fixture.scriptDelayMs);
    else if (file.endsWith('practice-1-5-tires.html')) {
      let offset = 0;
      const send = () => {
        if (res.destroyed) return;
        if (offset >= bytes.length) return res.end();
        res.write(bytes.subarray(offset, offset + fixture.htmlChunkBytes));
        offset += fixture.htmlChunkBytes;
        setTimeout(send, fixture.chunkDelayMs);
      };
      send();
    } else res.end(bytes);
  } catch { res.writeHead(404).end(); }
});
const reports = [];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'runner-used.cjs'), runner);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  const browserVersion = browser.version();
  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 950 } });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      const report = { width, prefix: PREFIX, route: ROUTE, inputSha256: sha(input), browserVersion, stages: [], networkErrors: [], placeholderRequests: [], dependencyEscapes: [], pageErrors: [] };
      let stage = 'initial';
      page.on('pageerror', error => report.pageErrors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) report.networkErrors.push({ stage, path: new URL(response.url()).pathname, status: response.status() }); });
      cdp.on('Network.requestWillBeSent', event => {
        if (/\$%7B|\$\{|RIS[12]/i.test(event.request.url)) report.placeholderRequests.push({ stage, path: new URL(event.request.url).pathname, type: event.type, initiator: event.initiator });
      });
      await page.route('**/*', request => {
        const url = new URL(request.request().url());
        if (url.origin !== origin || (PREFIX && !url.pathname.startsWith(PREFIX + '/'))) {
          report.dependencyEscapes.push({ stage, url: url.origin + url.pathname });
          return request.abort();
        }
        return request.continue();
      });
      const inspectImages = async () => {
        await page.waitForFunction(() => {
          const images = [...document.querySelectorAll('#section-0 img,#section-1 .schema-ref img')];
          return images.length === 3 && images.every(image => image.complete && image.naturalWidth > 0);
        });
        const images = await page.locator('#section-0 img,#section-1 .schema-ref img').evaluateAll(nodes => nodes.map(image => ({ src: image.currentSrc, alt: image.alt, width: image.naturalWidth, height: image.naturalHeight, complete: image.complete })));
        const expected = [[340,147], [430,314], [430,314]];
        const pass = images.length === 3 && images.every((image, index) => /^data:image\/png;base64,/.test(image.src) && image.complete && image.width === expected[index][0] && image.height === expected[index][1]);
        report.stages.push({ stage, status: pass ? 'PASS' : 'FAIL', images: images.map(({ src, ...image }) => ({ ...image, dataUriSha256: sha(src), sourceKind: src.startsWith('data:image/png;base64,') ? 'embedded PNG' : src })) });
      };
      try {
        await page.goto(origin + PREFIX + ROUTE, { waitUntil: 'load' });
        await inspectImages();
        await page.screenshot({ path: path.join(OUT, width + '-initial.png'), fullPage: true });
        stage = 'next-variant';
        await page.locator('#vb-next').click();
        await inspectImages();
        stage = 'reload';
        await page.reload({ waitUntil: 'load' });
        await inspectImages();
      } catch (error) { report.error = error.message; }
      report.status = !report.error && report.stages.length === 3 && report.stages.every(item => item.status === 'PASS') && !report.networkErrors.length && !report.placeholderRequests.length && !report.dependencyEscapes.length && !report.pageErrors.length ? 'PASS' : 'FAIL';
      reports.push(report);
      fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), testScriptSha256: sha(runner), inputSha256: sha(input), browserVersion, prefix: PREFIX, fixture, reports }, null, 2));
      console.log(width, report.status, 'decoded image stages', report.stages.length, 'literal requests', report.placeholderRequests.length);
      await context.close();
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
  if (reports.some(report => report.status !== 'PASS')) process.exitCode = 1;
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
