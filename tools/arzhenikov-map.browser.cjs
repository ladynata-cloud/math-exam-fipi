'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const training = pathToFileURL(path.resolve(__dirname, '../trainers/oge-basics/multiplication-division/arzhenikov-map.html')).href;
async function exercise(browser, width) {
  const page = await browser.newPage({viewport: {width, height: 850}});
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const button = name => page.getByRole('button', {name, exact: true});
  async function submit(...values) {
    const inputs = page.locator('#activity input');
    assert.equal(await inputs.count(), values.length);
    for (const [index, value] of values.entries()) await inputs.nth(index).fill(String(value));
    await button('Проверить').click();
  }
  async function open(id) {
    await page.goto(training + '#' + id);
    await page.waitForFunction(target => document.querySelector('#skills [aria-current]').hash === '#' + target, id);
  }
  await open('count');
  await submit(8); await submit(10);
  await button('Следующий навык').click();
  await button('Раздать по одной').click(); await button('Раздать по одной').click();
  await submit(2); await submit(3);
  await open('pack');
  await button('Наполнить коробку').click(); await button('Вернуть шаг').click();
  await button('Наполнить коробку').click(); await button('Наполнить коробку').click();
  await submit(2); await submit(4);
  await open('inverse'); await button('Подсказка').click(); await submit(5); await submit(6);
  await open('bridge'); await submit(6);
  assert.match(await page.locator('#feedback').innerText(), /закончите/);
  for (let i = 0; i < 6; i++) await button('Наполнить коробку').click();
  await submit(6);
  assert.equal(await button('Наполнить коробку').count(), 0);
  await page.locator('input').first().fill('6'); await page.reload();
  assert.equal(await page.locator('input').first().inputValue(), '6');
  await submit(6,4); await submit(6); await submit(5,4);
  await open('zero'); await submit(2); assert.equal(await page.locator('[aria-invalid=true]').count(),1);
  await submit(0); await submit(206); await submit(205);
  await open('remainder'); await submit(5,3); await submit(6);
  await open('transfer');
  assert.equal(await button('Подсказка').count(), 0);
  await submit(5,40,48,54,5);
  assert.match(await page.locator('#total').innerText(), /8 из 8/);
  assert.match(await page.locator('#record').textContent(), /все поля верны/);
  await button('Другой пример').click(); await submit(5,40,48,56,6); await submit(5,40,48,56,5);
  assert.match(await page.locator('#record').textContent(), /потребовалась правка/);
  await open('bridge'); await button('Пройти ещё раз').click(); await button('Проба цифры').click();
  await submit(5,40,48); await submit(6,48,56); await submit(6,4); await submit(6); await submit(5,4);
  await page.reload(); assert.equal(await page.locator('#stepNo').innerText(), 'Завершено');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  await page.close();
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [375,1280]) await exercise(browser,width);
    const page = await browser.newPage({viewport:{width:320,height:660}});
    await page.addInitScript(() => Object.defineProperty(window,'localStorage',{get(){throw Error('unavailable');}}));
    await page.goto(training + '#zero');
    assert.match(await page.locator('#storage').innerText(), /недоступно/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log('ARZHENIKOV_BROWSER_OK: eight skills, two entries, saved work, hints, correction, transfer, 320/375/1280.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
