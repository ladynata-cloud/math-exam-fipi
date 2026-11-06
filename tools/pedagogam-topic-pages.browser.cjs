/* Responsive/public-link QA for the ten four-variant worksheet topic pages.
 * Run from the repository root. Uses its own local server unless BASE_URL is set.
 * ARTIFACT_DIR receives screenshots and a machine-readable report.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.ARTIFACT_DIR || path.join(os.tmpdir(), 'pedagogam-topic-pages-qa');
const TOPICS = [
  'arith-decimals', 'arith-gcd-lcm', 'arith-fraction-add-subtract', 'alg-linear',
  'geo-ravenstvo-treugolnikov', 'alg-roots', 'alg-quadratics',
  'alg-arithmetic-progression', 'alg-trig-equations', 'alg-derivatives',
];
const PDF_NAMES = ['samostoyatelnaya.pdf', 'samostoyatelnaya-otvety.pdf', 'kontrolnaya.pdf', 'kontrolnaya-otvety.pdf'];
const WIDTHS = [320, 390, 1280];
const SPA_TITLES = {
  '/equations/#both': 'Неизвестное с двух сторон',
  '/equations/#brackets': 'Скобки и подобные',
  '/equations/#square': 'Квадрат числа',
  '/equations/#quadratic': 'Квадратное уравнение',
  '/school/makarychev8/#lesson/p11': 'Квадратные корни. Арифметический квадратный корень',
  '/school/makarychev8/#lesson/p21': 'Формула корней квадратного уравнения',
  '/school/makarychev8/#lesson/p23': 'Теорема Виета',
  '/school/#lesson/m9f-arithmetic-term': 'Арифметическая прогрессия: n−1 шагов',
  '/school/#lesson/m9f-arithmetic-sum': 'Сумма: пары первого и последнего',
  '/school/alimov10-11/#lesson/p34': 'Уравнение sin x = a',
  '/school/alimov10-11/#lesson/p35': 'Уравнение tg x = a',
  '/school/alimov10-11/#lesson/p45': 'Производная степенной функции',
  '/school/alimov10-11/#lesson/p47': 'Производные элементарных функций',
};
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.pdf':'application/pdf','.zip':'application/zip','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2'};
function serve() {
  return http.createServer((req, res) => {
    try {
      const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(ROOT, '.' + requested);
      if (!(file === ROOT || file.startsWith(ROOT + path.sep))) {res.writeHead(403).end(); return;}
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404).end('Not found'); return;}
      const data = fs.readFileSync(file);
      res.writeHead(200, {'Content-Type':MIME[path.extname(file)] || 'application/octet-stream','Content-Length':data.length});
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {res.writeHead(500).end(String(error));}
  });
}
async function main() {
  fs.mkdirSync(OUT, {recursive:true});
  let server, browser, base;
  const results = {result:'RUNNING', widths:WIDTHS, pages:0, downloads:0, trainerLinks:0, errors:[]};
  try {
    if (process.env.BASE_URL) base = process.env.BASE_URL.replace(/\/$/, '');
    else {
      server = serve();
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      base = 'http://127.0.0.1:' + server.address().port;
    }
    browser = await chromium.launch({headless:true, args:['--no-sandbox']});
    const context = await browser.newContext({acceptDownloads:true});
    if (base !== 'https://mathexam.space') {
      await context.route('https://mathexam.space/**', route => route.continue({url:route.request().url().replace('https://mathexam.space', base)}));
    }
    const page = await context.newPage();
    page.on('pageerror', error => results.errors.push({url:page.url(), type:'pageerror', message:error.message}));
    page.on('console', message => {if (message.type() === 'error') results.errors.push({url:page.url(), type:'console', message:message.text()});});
    page.on('response', response => {
      if (response.status() >= 400 && response.url().startsWith(base)) results.errors.push({url:response.url(), type:'http', status:response.status()});
    });
    for (const width of WIDTHS) {
      await page.setViewportSize({width, height:900});
      for (const topic of TOPICS) {
        const route = '/pedagogam/raboty/' + topic + '/';
        const response = await page.goto(base + route, {waitUntil:'networkidle'});
        assert.equal(response.status(), 200, topic + ' main response');
        assert.equal(await page.locator('h1').count(), 1, topic + ' one h1');
        assert.equal(await page.locator('main').count(), 1, topic + ' one main');
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mathexam.space' + route);
        assert.equal(await page.locator('.download-card').count(), 2, topic + ' SR and KR choices');
        assert.ok(await page.locator('.trainer-links a').count() >= 2, topic + ' targeted trainers');
        const overflow = async stage => {
          const offenders = await page.evaluate(() => [...document.querySelectorAll('main,main *')].filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
          }).map(el => ({tag:el.tagName, text:(el.textContent || '').trim().slice(0,80)})));
          assert.deepEqual(offenders, [], `${topic} ${width} ${stage} overflow`);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${topic} ${width} document width`);
        };
        await overflow('initial');
        const details = page.locator('main details');
        assert.ok(await details.count(), topic + ' details');
        for (let index = 0; index < await details.count(); index++) {
          const detail = details.nth(index);
          const initial = await detail.evaluate(el => el.open);
          await detail.locator(':scope > summary').focus();
          await page.keyboard.press('Enter');
          assert.equal(await detail.evaluate(el => el.open), !initial, topic + ' keyboard details');
          await page.keyboard.press('Enter');
          assert.equal(await detail.evaluate(el => el.open), initial, topic + ' keyboard details restore');
        }
        await page.evaluate(() => document.querySelectorAll('main details').forEach(el => {el.open = true;}));
        await overflow('expanded');
        await page.evaluate(() => document.querySelectorAll('main details').forEach(el => {el.open = false;}));
        await page.evaluate(() => scrollTo(0,0));
        await page.screenshot({path:path.join(OUT, topic + '-' + width + '.png'), fullPage:true});
        results.pages++;
        if (width !== WIDTHS[0]) continue;
        const pdfLinks = page.locator('.download-card a[download][href$=".pdf"]');
        assert.equal(await pdfLinks.count(), 4, topic + ' four PDF controls');
        const seenNames = [];
        for (let index = 0; index < await pdfLinks.count(); index++) {
          const link = pdfLinks.nth(index);
          const href = await link.getAttribute('href');
          const target = new URL(href, base + route);
          const filename = path.posix.basename(target.pathname);
          seenNames.push(filename);
          assert.equal(target.pathname, route + filename, topic + ' exact existing PDF path');
          const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
          assert.equal(await download.failure(), null, topic + ' PDF download');
          const data = fs.readFileSync(await download.path());
          assert.equal(data.subarray(0,5).toString(), '%PDF-', topic + ' PDF signature');
          assert.ok(data.equals(fs.readFileSync(path.join(ROOT, route.slice(1), filename))), topic + ' PDF bytes');
          results.downloads++;
        }
        assert.deepEqual(seenNames.sort(), [...PDF_NAMES].sort());
        const trainers = await page.locator('.trainer-links a').evaluateAll(links => links.map(link => ({url:link.href,label:link.textContent.trim()})));
        for (const trainer of trainers) {
          assert.ok(trainer.label, topic + ' trainer label');
          const target = new URL(trainer.url.replace('https://mathexam.space', base));
          assert.ok(target.origin === new URL(base).origin, topic + ' trainer origin');
          const linked = await context.request.get(target.href);
          assert.equal(linked.status(), 200, topic + ' trainer URL ' + trainer.url);
          const html = await linked.text();
          assert.match(html, /<(?:!doctype|html)\b/i, topic + ' trainer HTML');
          if (target.hash) {
            const expectedTitle = SPA_TITLES[target.pathname + target.hash];
            if (expectedTitle) {
              const destination = await context.newPage();
              destination.on('pageerror', error => results.errors.push({url:destination.url(), type:'trainer-pageerror', message:error.message}));
              destination.on('console', message => {if (message.type() === 'error') results.errors.push({url:destination.url(), type:'trainer-console', message:message.text()});});
              await destination.goto(target.href, {waitUntil:'networkidle'});
              assert.equal(new URL(destination.url()).hash, target.hash, topic + ' lesson route preserved');
              await destination.waitForFunction(title => document.querySelector('main h1')?.textContent.trim() === title, expectedTitle);
              assert.equal((await destination.locator('main h1').textContent()).trim(), expectedTitle, topic + ' actual lesson title');
              assert.ok(await destination.locator('main input, main button').count(), topic + ' actual lesson controls');
              assert.equal(await destination.locator('.error-page').count(), 0, topic + ' lesson error fallback');
              await destination.close();
            } else {
              const fragment = decodeURIComponent(target.hash.slice(1));
              assert.ok(await page.evaluate(({html, fragment}) => {
                const document = new DOMParser().parseFromString(html, 'text/html');
                return !!document.getElementById(fragment) || [...document.querySelectorAll('[name]')].some(el => el.getAttribute('name') === fragment);
              }, {html, fragment}), topic + ' trainer anchor');
            }
          }
          results.trainerLinks++;
        }
      }
    }
    // Follow real catalog links to each entry, preserving the unfiltered catalog.
    await page.setViewportSize({width:320, height:900});
    for (const topic of TOPICS) {
      await page.goto(base + '/pedagogam/raboty/', {waitUntil:'networkidle'});
      const route = '/pedagogam/raboty/' + topic + '/';
      const link = page.locator('.pack[id="' + topic + '"] a[href="' + route + '"]');
      assert.equal(await link.count(), 1, topic + ' catalog entrance');
      await Promise.all([page.waitForURL(base + route), link.click()]);
      assert.equal(await page.locator('h1').count(), 1, topic + ' catalog destination');
    }
    assert.deepEqual(results.errors, [], 'browser errors');
    results.result = 'PASS';
    console.log(JSON.stringify(results));
  } catch (error) {
    results.result = 'FAIL';
    results.failure = error.stack || String(error);
    throw error;
  } finally {
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2) + '\n');
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => {console.error(error); process.exitCode = 1;});
