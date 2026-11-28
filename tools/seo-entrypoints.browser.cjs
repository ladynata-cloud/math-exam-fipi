'use strict';

// Public navigation only: local static files, isolated storage, no real accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const targets = [
  '/trainers/oge-basics/multiplication-division/multiplication-mixed.html',
  '/trainers/oge-basics/multiplication-division/multiplication-pythagoras-table.html',
  '/trainers/oge-basics/multiplication-division/multiplication-tricks.html',
  '/trainers/grade6-nok.html',
  '/trainers/grade6-nod.html',
];
const legacy = ['index.html', 'pythagoras.html', 'times-9.html'];
const vilenkinUnits = {
  5: [[14, 'Деление с остатком'], [35, 'Общий знаменатель'],
    [44, 'Округление и прикидка'], [51, 'Транспортир и построения']],
  6: [[8, 'Наименьшее общее кратное'], [19, 'Пропорция'],
    [24, 'Положительные и отрицательные числа'], [43, 'Координатная плоскость']],
};
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

async function checkVilenkinEntrances(page, origin, javaScriptEnabled) {
  for (const grade of [5, 6]) {
    const id = `vilenkin${grade}`;
    const entry = `/courses/vilenkin-${grade}/`;
    const course = `/school/index.html?course=${id}#course/${id}`;
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`${origin}/courses/`);
    const card = page.locator('article').filter({ has: page.locator(`h2 a[href="${entry}"]`) });
    assert.equal(await card.locator(`a[href="${course}"]`).isVisible(), true,
      `${id}: preserve the direct route from the catalog`);
    const board = await card.getByRole('link', { name: 'Открыть на доске' }).getAttribute('href');
    assert.equal(new URL(board, origin).searchParams.get('trainer'), course,
      `${id}: the board must still open the existing workshop route`);
    await Promise.all([page.waitForURL(origin + entry), card.locator('h2 a').click()]);

    const heading = page.locator('main h1');
    assert.equal(await heading.count(), 1);
    assert.match(await heading.innerText(), /Виленкин/);
    assert.match(await heading.innerText(), new RegExp(`${grade}\\s*класс`));
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),
      `https://mathexam.space${entry}`);
    for (const [unit, title] of vilenkinUnits[grade]) {
      const target = `/school/index.html?course=${id}#v${grade}-unit/${unit}`;
      const topic = page.locator(`#topics a[href="${target}"]`);
      assert.equal(await topic.isVisible(), true, `${id}: visible link to unit ${unit}`);
      if (javaScriptEnabled) {
        await Promise.all([page.waitForURL(origin + target), topic.click()]);
        assert.equal(await page.locator('#main h1').innerText(), title);
        await page.goto(origin + entry);
      }
    }
    const start = page.getByRole('link', { name: 'Открыть курс', exact: true });
    assert.equal(await start.isVisible(), true);
    assert.equal(await start.getAttribute('href'), course);
    if (!javaScriptEnabled) continue;

    await Promise.all([page.waitForURL(origin + course), start.click()]);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,nofollow');
    const next = page.getByRole('button', { name: 'Продолжить обучение', exact: true });
    const lesson = await next.getAttribute('data-value');
    assert(lesson.startsWith(`v${grade}f-`), `${id}: expected a lesson from this course`);
    const savedUrl = `${origin}/school/index.html?course=${id}#lesson/${lesson}`;
    await Promise.all([page.waitForURL(savedUrl), next.click()]);
    await page.locator('[data-cmd="mode"][data-value="practice"]').click();
    // A recognized, wrong number records a mathematical attempt; a format error does not.
    await page.locator('#answer').fill('-999');
    await page.getByRole('button', { name: 'Проверить', exact: true }).click();
    const savedAttempt = () => page.evaluate(() =>
      JSON.parse(localStorage.getItem(window.WorkshopState.KEY)).events.at(-1));
    const attempt = await savedAttempt();
    assert.equal(attempt.skill, lesson);
    assert.equal(attempt.mode, 'practice');
    assert.equal(attempt.correct, false);

    // A saved lesson URL still opens the same lesson with its history in the browser.
    const lessonHeading = await page.locator('#main h1').innerText();
    await page.goto(origin + entry);
    await page.goto(savedUrl);
    assert.equal(await page.locator('#main h1').innerText(), lessonHeading);
    assert.equal(await page.locator('#answer').isVisible(), true);
    assert.deepEqual(await savedAttempt(), attempt);
  }
  console.log(`SEO_VILENKIN_ENTRANCES_OK: two catalog entrances, eight topic links and original workshop routes, JavaScript ${javaScriptEnabled}`);
}

async function checkLearningEntries(page, origin, javaScriptEnabled) {
  const textbook = '/courses/vilenkin-6-part-1/textbook.html';
  const units = ['units-A', 'units-B', 'units-C', 'units-D', 'supplement-lcm-multi'].flatMap(name =>
    JSON.parse(fs.readFileSync(path.join(root, 'courses/vilenkin-6-part-1/textbook-data', name + '.json'), 'utf8')));
  await page.setViewportSize({width: 360, height: 800});
  await page.goto(origin + textbook);
  if (!javaScriptEnabled) {
    const links = page.locator('#book a[href^="#unit/"]');
    assert.deepEqual(await links.evaluateAll(items => items.map(a => a.hash)), units.map(u => '#unit/' + u.id));
    for (const unit of units) {
      const content = await page.locator('[id="unit/' + unit.id + '"]').innerText();
      const rule = unit.rules[0].text.replace(/\[\[([^\]]+)\]\]/g, '$1');
      assert(content.includes(unit.title) && content.includes(rule), 'static unit ' + unit.id);
    }
  }
  for (const id of [1, 19, 1008]) {
    const unit = units.find(u => u.id === id);
    await page.goto(origin + textbook + '#unit/' + id);
    const heading = javaScriptEnabled ? page.locator('main h1') : page.locator(':target h3');
    await page.waitForFunction(title => document.querySelector('main h1')?.textContent === title ||
      document.querySelector(':target h3')?.textContent.includes(title), unit.title);
    assert((await heading.innerText()).includes(unit.title));
  }

  const decimal = '/trainers/desyatichnye-drobi-level-1.html';
  await page.goto(origin + '/topics/');
  await page.locator('a[href="' + decimal + '"]').click();
  assert.equal(new URL(page.url()).pathname, decimal);
  assert.equal(await page.locator('#quiz').isVisible(), javaScriptEnabled);
  if (javaScriptEnabled) {
    await page.locator('#ans').fill('12,4');
    await page.locator('#check').click();
    assert.equal(await page.locator('#fb').innerText(), 'Верно!');
  }
  await page.getByText('Сверить решение', {exact: true}).click();
  assert((await page.locator('details[open]').innerText()).includes('3,45'));
  await page.locator('a[href="/trainers/oge-basics/decimal-add-subtract.html"]').click();
  assert.equal(new URL(page.url()).pathname, '/trainers/oge-basics/decimal-add-subtract.html');

  for (const destination of ['/equations/linear-pilot/', '/trainers/oge-task9-equations.html']) {
    await page.goto(origin + '/topics/lineynye-uravneniya/');
    await page.locator('.topic-hero a[href="' + destination + '"]').click();
    assert.equal(new URL(page.url()).pathname, destination);
    assert.match(await page.locator('h1').first().innerText(), /уравнен/i);
  }
  console.log('SEO_FIRST_LEARNING_ENTRIES_OK: JavaScript ' + javaScriptEnabled);
}

async function checkSchoolSearchEntries(page, origin, javaScriptEnabled) {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + '/courses/vilenkin-5/');
    const part = page.locator('.topic-hero a[href="/courses/vilenkin-5-part-1/"]');
    assert.equal(await part.count(), 1);
    await part.scrollIntoViewIfNeeded();
    assert(await part.isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Vilenkin entry overflow');
    await Promise.all([page.waitForURL(url => url.pathname === '/courses/vilenkin-5-part-1/'), part.click()]);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mathexam.space/courses/vilenkin-5-part-1/');
    await page.goto(origin + '/topics/obyknovennye-drobi/');
    const primary = page.locator('.topic-hero .topic-actions a.btn').first();
    assert.equal(await primary.getAttribute('href'), '/trainers/oge-basics/fraction-common-denominator.html');
    assert(await primary.isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'fraction entry overflow');
    await Promise.all([page.waitForURL(url => url.pathname.endsWith('/fraction-common-denominator.html')), primary.click()]);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mathexam.space/trainers/oge-basics/fraction-common-denominator.html');
    for (const target of ['/pedagogam/raboty/arith-fraction-add-subtract/', '/trainers/desyatichnye-drobi-level-1.html']) {
      await page.goto(origin + '/topics/obyknovennye-drobi/');
      const link = page.locator('a[href="' + target + '"]');
      assert.equal(await link.count(), 1);
      await link.scrollIntoViewIfNeeded();
      assert(await link.isVisible());
      await Promise.all([page.waitForURL(url => url.pathname === target), link.click()]);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mathexam.space' + target);
    }
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(origin + '/school/peterson5/');
  const quick = ['p16', 'p17', 'p28', 'p43'];
  for (const id of quick) {
    const route = '#topic/' + id + '/discover';
    const link = javaScriptEnabled ? page.locator('.workshop-topic-card[href="' + route + '"]') : page.locator('.grade5-entry > p a[href="' + route + '"]');
    await link.waitFor({ state: 'visible' });
    assert.equal(await link.count(), 1);
    if (!javaScriptEnabled) assert.equal(await page.locator('[id="' + route.slice(1) + '"]').count(), 1);
  }
  if (javaScriptEnabled) {
    await page.locator('.workshop-topic-card[href="#topic/p28/discover"]').click();
    await page.locator('.workshop-lesson-header h1').waitFor();
    assert.match(await page.locator('.workshop-lesson-header h1').innerText(), /сложение и вычитание дробей/i);
  }
  // The atlas title is independent of the dynamic catalog; do not infer index status.
  await page.goto(origin + '/geometry-course/textbook/', {waitUntil: 'domcontentloaded'});
  assert.match(await page.title(), /Атанасян.*чертежами и подсказками/);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mathexam.space/geometry-course/textbook/');
  console.log('SEO_SCHOOL_SEARCH_ENTRIES_OK: 320/390/1280, JavaScript ' + javaScriptEnabled);
}

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
    for (const javaScriptEnabled of [true, false]) {
      const context = await browser.newContext({ javaScriptEnabled });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await checkLearningEntries(page, origin, javaScriptEnabled);
      await checkSchoolSearchEntries(page, origin, javaScriptEnabled);
      await checkVilenkinEntrances(page, origin, javaScriptEnabled);
      for (let i = 0; i < legacy.length; i++) {
        await page.goto(`${origin}/trainers/multiplication-table/${legacy[i]}?source=compat-check#saved-route`, { waitUntil: 'commit' });
        await page.waitForURL(url => url.pathname === targets[i]);
        const url = new URL(page.url());
        assert.equal(url.search, javaScriptEnabled ? '?source=compat-check' : '');
        assert.equal(url.hash, javaScriptEnabled ? '#saved-route' : '');
        assert((await page.locator('h1').first().innerText()).trim());
      }
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const [source, target] of [
          ['/trainers/oge-course/', '/oge/variants/2027/'],
          ['/articles/stroynost-kursa-geometrii/', '/geometry-course/first-steps/'],
        ]) {
          await page.goto(origin + source);
          const link = page.locator(`a[href="${target}"]`);
          assert.equal(await link.count(), 1, `${source}: one direct practice entrance`);
          assert.equal(await link.isVisible(), true);
          await link.scrollIntoViewIfNeeded();
          const rects = await link.evaluate(a => [...a.getClientRects()].map(r => ({left:r.left, right:r.right, width:r.width, height:r.height})));
          assert(rects.length && rects.every(r => r.width > 0 && r.height > 0 && r.left >= -1 && r.right <= width + 1), `${source}: practice link fits ${width}px`);
          await Promise.all([page.waitForURL(url => url.pathname === target), link.click()]);
          assert((await page.locator('h1').first().innerText()).trim());
          assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mathexam.space' + target);
        }
        console.log(`SEO_PRACTICE_ENTRANCES_OK: two actual clicks, ${width}px, JavaScript ${javaScriptEnabled}`);
        for (const target of targets) {
          await page.goto(`${origin}/trainers/`);
          const links = page.locator('#catalog .actions a');
          const hrefs = await links.evaluateAll(elements => elements.map(a => new URL(a.href).pathname));
          const index = hrefs.indexOf(target);
          assert(index >= 0, `missing catalog destination: ${target}`);
          await Promise.all([page.waitForURL(url => url.pathname === target), links.nth(index).click()]);
          assert((await page.locator('h1').first().innerText()).trim());
          if (javaScriptEnabled && target.includes('grade6-')) {
            await page.locator('#trainer button').first().waitFor();
            assert.equal(await page.locator('.public-explanation').isVisible(), true);
            await page.goto(`${origin}/trainers/`);
            await page.setContent(`<iframe title="Embedded practice" src="${origin}${target}" style="width:100%;height:800px"></iframe>`);
            const frame = page.frameLocator('iframe');
            await frame.locator('#trainer button').first().waitFor();
            assert.equal(await frame.locator('.public-explanation').isVisible(), false);
          }
        }
      }
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const catalog of ['/geometry-course/', '/grade7/']) {
          for (const target of ['/geometry-course/first-steps/', '/geometry-course/ichenskaya-7-works/']) {
            await page.goto(origin + catalog);
            const link = page.locator(`a[href="${catalog === '/grade7/' ? '..' + target : target.replace('/geometry-course/', '')}"]`).first();
            assert.equal(await link.isVisible(), true, `${catalog}: visible link to ${target}`);
            await link.scrollIntoViewIfNeeded();
            const rects = await link.evaluate(a => [...a.getClientRects()].map(r => ({left:r.left, right:r.right, width:r.width, height:r.height})));
            assert(rects.length && rects.every(r => r.width > 0 && r.height > 0 && r.left >= -1 && r.right <= width + 1), `${catalog}: link fits ${width}px`);
            await Promise.all([page.waitForURL(url => url.pathname === target), link.click()]);
            assert((await page.locator('h1').first().innerText()).trim());
            assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mathexam.space' + target);
          }
        }
      }
      assert.deepEqual(errors, [], 'public navigation must not raise JavaScript errors');
      await context.close();
    }
    console.log('SEO_ENTRYPOINTS_BROWSER_OK: 6 compatibility routes, 30 trainer catalog clicks and 24 grade-seven geometry course clicks; 320/390/1280 px; JavaScript on/off; course link bounds and canonicals; public/embedded NOK/NOD.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
