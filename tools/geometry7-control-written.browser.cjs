'use strict';

const assert = require('node:assert/strict');
const { createReadStream, statSync } = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const pagePath = '/trainers/geometry-7/control-work.html';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.gif': 'image/gif', '.webp': 'image/webp' };
const storageKey = 'geometry7-control-written-v1';

function serve(req, res) {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !mime[path.extname(file)] || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] + '; charset=utf-8');
  createReadStream(file).pipe(res);
}

const selectTask = (page, number) => page.getByRole('button', { name: 'Задача ' + number, exact: true }).click();
const selectVariant = (page, number) => page.locator('#written-work').getByRole('button', { name: 'Вариант ' + number, exact: true }).click();
const tool = (page, name) => page.locator('#written-drawing').getByRole('button', { name, exact: true }).click();
const written = page => page.getByRole('button', { name: 'Полное решение', exact: true }).click();
const saved = (page, key) => page.evaluate(id => JSON.parse(localStorage.getItem(id)), `${storageKey}:${key}`);
const namedPoint = (drawing, name) => drawing.points.find(point => point.label === name);
const surface = page => page.getByRole('group', { name: 'Поле чертежа', exact: true });

async function position(page, x, y) {
  const svg = surface(page);
  await svg.scrollIntoViewIfNeeded();
  return svg.evaluate((element, [x, y]) => {
    const point = new DOMPoint(x, y).matrixTransform(element.getScreenCTM());
    return { x: point.x, y: point.y };
  }, [x, y]);
}

async function clickPoint(page, x, y, touch = false) {
  const target = await position(page, x, y);
  if (touch) await page.touchscreen.tap(target.x, target.y);
  else await page.mouse.click(target.x, target.y);
}

async function choosePoints(page, name, coordinates) {
  await tool(page, name);
  for (const [x, y] of coordinates) await clickPoint(page, x, y);
}

async function addPoint(page, name, x, y, touch = false) {
  if (name) await page.getByLabel('Имя точки', { exact: true }).fill(name);
  await clickPoint(page, x, y, touch);
}

async function assertFit(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}

async function verifyDemo(page, id) {
  const demo = page.locator(`[data-demo="${id}"]`);
  const summary = demo.locator('summary');
  const image = demo.locator('img');
  const button = demo.locator('[data-demo-toggle]');
  const loaded = extension => page.waitForFunction(({ id, extension }) => {
    const img = document.querySelector(`[data-demo="${id}"] img`);
    return img?.getAttribute('src')?.endsWith(`/${id}.${extension}`) &&
      img.complete && img.naturalWidth === 640 && img.naturalHeight === 428;
  }, { id, extension });

  assert.equal(await image.getAttribute('src'), null);
  await summary.click();
  await image.scrollIntoViewIfNeeded();
  await loaded('webp');
  assert(await demo.locator('.demo-steps li').count() >= 3);
  assert.equal(await button.getAttribute('aria-pressed'), 'false');
  await button.click();
  await loaded('gif');
  assert.equal(await button.getAttribute('aria-pressed'), 'true');
  await assertFit(page);
  await button.click();
  await loaded('webp');
  await summary.click();
  await page.waitForFunction(id => !document.querySelector(`[data-demo="${id}"] img`).hasAttribute('src'), id);
}

async function oldModes(page, url) {
  await page.goto(url);
  assert(await page.locator('#training').isVisible());
  for (let i = 0; i < 2; i++) {
    await page.locator('#practice-0').fill('100');
    await page.locator('#practice-form button[type=submit]').click();
  }
  assert(await page.getByRole('heading', { name: 'Подсказка', exact: true }).isVisible());
  await page.locator('#practice-0').fill('112');
  await page.locator('#practice-form button[type=submit]').click();
  assert.match(await page.locator('#total-text').textContent(), /Решено 1 из 30/);

  await page.getByRole('button', { name: 'Самопроверка', exact: true }).click();
  await page.getByRole('button', { name: 'Начать вариант 1', exact: true }).click();
  await page.locator('#check-0-0').fill('133');
  await page.locator('#check-1-0').selectOption('∠TSK и ∠KSN');
  await page.locator('#check-form button[type=submit]').click();
  await page.locator('#check-0-0').selectOption('Вертикальные');
  await page.locator('#check-0-1').fill('48');
  await page.locator('#check-0-2').fill('132');
  await written(page);
  await page.getByRole('button', { name: 'Самопроверка', exact: true }).click();
  assert.equal(await page.locator('#check-0-1').inputValue(), '48');
  await page.locator('#check-form button[type=submit]').click();
  for (const [index, value] of ['134', '46', '134'].entries()) await page.locator('#check-0-' + index).fill(value);
  await page.locator('#check-form button[type=submit]').click();
  await page.locator('#check-0-0').fill('13');
  await page.locator('#check-form button[type=submit]').click();
  for (const [index, value] of ['17', '12', '14'].entries()) await page.locator('#check-0-' + index).fill(value);
  await page.locator('#check-form button[type=submit]').click();
  assert.match(await page.locator('.summary').textContent(), /Полностью решено 5 из 5/);
  await page.getByRole('button', { name: 'Тренировка', exact: true }).click();
  assert.equal(await page.locator('#practice-0').inputValue(), '112');
}

async function reviewTasks(page) {
  await written(page);
  const expected = [
    [[/68°/, /112°.*BOD/], [/112°/, /56°.*124°/], [/54°/, /126°.*54°.*126°/], [/84°.*7 см/, /4,68 см/], [/5 см.*7 см.*9 см/, /5 см.*7 см.*9 см/]],
    [[/в 3 раза/, /45°.*135°/], [/34°/, /73°.*107°/], [/126°/, /63°.*117°/], [/30°.*55°.*25°.*85°/, /25°/], [/AO = OB.*△AOC = △BOD/, /второму признаку/]]
  ];
  for (let variant = 1; variant <= 2; variant++) {
    await selectVariant(page, variant);
    for (let number = 1; number <= 5; number++) {
      await selectTask(page, number);
      const [prompt, answer] = expected[variant - 1][number - 1];
      assert.match(await page.locator('.written-problem .prompt').textContent(), prompt);
      assert.equal(await page.locator('#written-given').inputValue(), '');
      assert.equal(await surface(page).locator('.drawing-point').count(), 0);
      assert.equal(await page.locator('.written-example').isVisible(), false);
      await page.getByText('Посмотреть схему', { exact: true }).click();
      assert(await page.locator('#written-work figure svg').isVisible());
      await page.getByText('Сверить с образцом', { exact: true }).click();
      assert.match(await page.locator('.written-example').textContent(), answer);
      assert(await page.locator('#written-given').isVisible());
      assert(await page.getByLabel(variant === 2 && number === 5 ? 'Доказать' : 'Найти', { exact: true }).isVisible());
      assert(await page.getByLabel(variant === 2 && number === 5 ? 'Доказательство' : 'Решение', { exact: true }).isVisible());
      await verifyDemo(page, `${variant}-${number}`);
      await assertFit(page);
    }
  }
  await verifyDemo(page, 'proof-format');
  await selectVariant(page, 1);
  await verifyDemo(page, 'format');
  const tools = page.locator('[data-written-panel="tool-demos"]');
  await tools.locator(':scope > summary').click();
  for (const id of ['tool-segment', 'tool-intersection', 'tool-arc', 'tool-tick']) await verifyDemo(page, id);
  await tools.locator(':scope > summary').click();
}

async function adjacentDrawing(page, url) {
  await selectVariant(page, 1);
  await selectTask(page, 1);
  await addPoint(page, 'A', 125, 275);
  await addPoint(page, 'C', 510, 275);
  await choosePoints(page, 'Прямая', [[125, 275], [510, 275]]);
  await tool(page, 'Точка');
  await addPoint(page, 'O', 320, 285);
  await addPoint(page, 'B', 224, 105);
  let drawing = (await saved(page, '1-1')).drawing;
  assert.equal(namedPoint(drawing, 'O').kind, 'affine');
  assert(Math.abs(namedPoint(drawing, 'O').y - 275) < 1);

  await choosePoints(page, 'Луч', [[320, 275], [224, 105]]);
  await page.getByText('Другие инструменты', { exact: true }).click();
  await choosePoints(page, 'Дуга угла', [[125, 275], [320, 275], [224, 105]]);
  await tool(page, 'Подпись');
  await page.getByLabel('Текст на чертеже', { exact: true }).fill('68°');
  await clickPoint(page, 228, 237);
  assert.match(await surface(page).textContent(), /68°/);

  await tool(page, 'Двигать');
  const start = await position(page, 125, 275);
  const end = await position(page, 125, 330);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.mouse.up();
  assert(namedPoint((await saved(page, '1-1')).drawing, 'O').y > 291);
  await page.getByRole('button', { name: '↶ Отменить', exact: true }).click();
  drawing = (await saved(page, '1-1')).drawing;
  assert(Math.abs(namedPoint(drawing, 'O').y - 275) < 1);
  assert.deepEqual(drawing.objects.map(object => object.extent), ['line', 'ray']);
  assert.deepEqual(drawing.marks.map(mark => mark.kind), ['arc', 'label']);

  await clickPoint(page, 510, 275);
  await page.getByLabel('Имя точки', { exact: true }).fill('C1');
  await page.getByRole('button', { name: 'Переименовать', exact: true }).click();
  assert(namedPoint((await saved(page, '1-1')).drawing, 'C1'));

  await page.getByLabel('Дано', { exact: true }).fill('AOB = 68°');
  await page.getByLabel('Дано', { exact: true }).press('Home');
  await page.getByRole('button', { name: 'Вставить ∠', exact: true }).click();
  await page.getByLabel('Найти', { exact: true }).fill('∠BOC');
  await page.getByLabel('Решение', { exact: true }).fill('Углы смежные.\n∠BOC = 180° − 68° = 112°.');
  await selectTask(page, 2);
  assert.equal(await page.locator('#written-solution').inputValue(), '');
  await selectTask(page, 1);
  assert.equal(await page.locator('#written-given').inputValue(), '∠AOB = 68°');
  await page.goto(url + '?mode=written');
  assert.equal(await page.locator('#written-mode').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#written-goal').inputValue(), '∠BOC');
  assert.match(await page.locator('#written-solution').inputValue(), /112°/);
  assert.equal(await surface(page).locator('.drawing-point').count(), 4);
  assert.match(await surface(page).textContent(), /C1/);
  await page.getByRole('button', { name: 'Очистить чертёж', exact: true }).click();
  assert.equal(await surface(page).locator('.drawing-point').count(), 0);
  await page.getByRole('button', { name: '↶ Отменить', exact: true }).click();
  assert.equal(await surface(page).locator('.drawing-point').count(), 4);
  assert.match(await page.locator('#written-solution').inputValue(), /112°/);
}

async function constructionTools(page) {
  await selectTask(page, 4);
  const a = [460, 90];
  const b = [110, 210];
  const c = [460, 330];
  const k = [210, 210];
  await addPoint(page, 'A', ...a);
  await addPoint(page, 'B', ...b);
  await addPoint(page, 'C', ...c);
  await page.getByText('Другие инструменты', { exact: true }).click();
  await choosePoints(page, 'Биссектриса', [a, b, c]);
  await choosePoints(page, 'Перпендикуляр', [k, b, a]);
  await choosePoints(page, 'Перпендикуляр', [k, b, c]);
  let drawing = (await saved(page, '1-4')).drawing;
  const center = namedPoint(drawing, 'B');
  const bisector = namedPoint(drawing, 'K');
  assert.equal(bisector.kind, 'bisector');
  for (const [foot, side] of [['H', 'A'], ['M', 'C']]) {
    const p = namedPoint(drawing, foot);
    const q = namedPoint(drawing, side);
    assert.equal(p.kind, 'foot');
    const dot = (p.x - bisector.x) * (q.x - center.x) + (p.y - bisector.y) * (q.y - center.y);
    assert(Math.abs(dot) < 1e-6);
  }
  assert.equal(drawing.marks.filter(mark => mark.kind === 'right').length, 2);

  await selectVariant(page, 2);
  await selectTask(page, 5);
  await page.getByLabel('Доказательство', { exact: true }).fill('Вертикальные углы AOC и BOD равны.');
  const points = [[120, 130], [520, 290], [210, 340], [430, 80]];
  for (let i = 0; i < points.length; i++) await addPoint(page, 'ABCD'[i], ...points[i]);
  await choosePoints(page, 'Отрезок', points.slice(0, 2));
  await choosePoints(page, 'Отрезок', points.slice(2));
  await page.getByText('Другие инструменты', { exact: true }).click();
  await choosePoints(page, 'Пересечение', [[220, 170], [375, 145]]);
  drawing = (await saved(page, '2-5')).drawing;
  const o = namedPoint(drawing, 'O');
  assert.equal(o.kind, 'intersection');
  assert(Math.abs(o.x - 320) < 1 && Math.abs(o.y - 210) < 1);
  await choosePoints(page, 'Засечка', [points[0], [320, 210]]);
  assert.equal((await saved(page, '2-5')).drawing.marks[0].kind, 'tick');
  await page.reload();
  assert.equal(await page.locator('#written-solution').inputValue(), 'Вертикальные углы AOC и BOD равны.');
  assert.equal(await surface(page).locator('.drawing-point').count(), 5);
}

async function mobile(browser, url) {
  const page = await browser.newPage({ viewport: { width: 320, height: 900 }, isMobile: true, hasTouch: true });
  try {
    await page.goto(url + '?mode=written');
    await assertFit(page);
    const bottom = await surface(page).evaluate(element => element.getBoundingClientRect().bottom);
    assert(bottom > 0 && bottom <= 900);
    await addPoint(page, null, 120, 260, true);
    await addPoint(page, null, 440, 150, true);
    await tool(page, 'Отрезок');
    await clickPoint(page, 120, 260, true);
    await clickPoint(page, 440, 150, true);
    assert.equal((await saved(page, '1-1')).drawing.objects[0].extent, 'segment');
    await page.locator('#written-solution').fill('112°');
    await page.reload();
    assert.equal(await page.locator('#written-solution').inputValue(), '112°');
    assert.equal(await surface(page).locator('.drawing-point').count(), 2);
    await page.locator('#written-work').getByRole('button', { name: 'Следующая задача →', exact: true }).click();
    assert.match(await page.locator('#written-title').textContent(), /^№2/);
    const tools = page.locator('[data-written-panel="tool-demos"]');
    await tools.locator(':scope > summary').tap();
    await verifyDemo(page, 'tool-arc');
    await assertFit(page);
  } finally {
    await page.close();
  }
}

async function storageUnavailable(browser, url) {
  const page = await browser.newPage();
  try {
    await page.addInitScript(prefix => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith(prefix)) throw new DOMException('Storage disabled for test', 'QuotaExceededError');
        return setItem.call(this, key, value);
      };
    }, storageKey);
    await page.goto(url + '?mode=written');
    await surface(page).focus();
    await surface(page).press('ArrowRight');
    await surface(page).press('Enter');
    await page.locator('#written-given').fill('∠AOB = 68°');
    assert.match(await page.locator('.draft-status').textContent(), /до закрытия/);
    await selectTask(page, 2);
    await selectTask(page, 1);
    assert.equal(await surface(page).locator('.drawing-point').count(), 1);
    assert.equal(await page.locator('#written-given').inputValue(), '∠AOB = 68°');
  } finally {
    await page.close();
  }
}

(async () => {
  const server = http.createServer(serve);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = process.env.GEOMETRY7_WRITTEN_URL || `http://127.0.0.1:${server.address().port}${pagePath}`;
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath });
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    await oldModes(page, url);
    await reviewTasks(page);
    await adjacentDrawing(page, url);
    await constructionTools(page);
    await mobile(browser, url);
    await storageUnavailable(browser, url);
    assert.deepEqual(errors, []);
    console.log('GEOMETRY7_WRITTEN_SOLUTION_PASS · 10 задач, 16 GIF · Chromium 1280×900 и 320×900');
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
