'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { checkCoverage } = require('./public-home-coverage.cjs');
const root = process.cwd(), out = process.env.ARTIFACT_DIR || '/tmp/public-home-qa';
fs.mkdirSync(out, { recursive: true });
const report = checkCoverage();
assert.deepEqual(report.failures, []);
const sample = new Set([
  'lessons/index.html', 'courses/index.html', 'school/index.html', 'oge/index.html',
  'ege-baza/index.html', 'ege-profil/index.html', 'vpr/index.html',
  'trainers/desyatichnye-drobi-level-1.html', 'trainers/inequalities-number-line.html',
  'trainers/oge-task8-powers-roots.html', 'geometry-course/index.html',
  'stereo-course/index.html', 'trainers/index.html'
]);
for (const name of report.covered) if (fs.readFileSync(name, 'utf8').includes('/assets/assistant/home-link.js')) sample.add(name);
const results = [], failures = [];
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
    if (!file.startsWith(root + path.sep) && file !== root) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', ({ '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      for (const file of sample) {
        if (!report.covered.includes(file)) continue;
        try {
          await page.goto(origin + '/' + file, { waitUntil: 'load' });
          const link = page.locator('#mathexam-home-navigation').locator('a');
          await link.waitFor({ state: 'visible' });
          await link.scrollIntoViewIfNeeded();
          const box = await link.boundingBox();
          assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.height >= 44, file + ' reachable home link');
          assert.equal(await link.getAttribute('href'), '/');
          await link.click({ trial: true });
          if (['lessons/index.html', 'trainers/ege-t1-planimetry-trainer.html', 'trainers/geometry7-practice.html', 'school/peterson6/index.html'].includes(file)) await page.screenshot({ path: path.join(out, file.replace(/\W/g, '_') + '-' + width + '.png') });
          await link.click();
          await page.waitForURL(origin + '/');
          results.push({ file, width, box, homeClick: true });
        } catch (error) { failures.push({ file, width, error: error.message }); }
      }
      // A real parent/child document must keep the trainer area free of the bar.
      await page.goto(origin + '/lessons/index.html');
      await page.evaluate(() => { const f = document.createElement('iframe'); f.src = '/trainers/vilenkin6-percent/index.html'; f.id = 'embed-check'; document.body.append(f); });
      const frame = page.frameLocator('#embed-check');
      await frame.locator('body').waitFor();
      assert.equal(await frame.locator('#mathexam-home-navigation').count(), 0);
      await context.close();
    }
  } finally {
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, failures }, null, 2));
    await browser.close(); await new Promise(resolve => server.close(resolve));
  }
  assert.deepEqual(failures, []);
  console.log('HOME_NAVIGATION_BROWSER_PASS', results.length);
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
