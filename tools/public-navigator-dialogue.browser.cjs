'use strict';

const assert = require('node:assert/strict');

module.exports = async function verifyNavigatorDialogue(page, origin) {
  await page.addInitScript(() => {
    window.requests = [];
    window.SiteDialogueClient = {
      enabled: true,
      async ask(request) {
        window.requests.push(request);
        return new Promise(resolve => {
          window.finishTestReply = () => resolve({
            version: 1, site: 'mathexam', reply: 'Выбран тренажёр с двузначным делителем.',
            links: [
              { label: 'Деление по шагам', url: 'https://mathexam.space/trainers/long-division-stepwise.html#twoDigit' },
              { label: 'Лишняя ссылка', url: 'https://example.org/' }
            ],
            state: {surface: 'navigator', dialog: {divisionTopic: 'twoDigit'}}
          });
        });
      }
    };
  });
  await page.goto(origin + '/', {waitUntil:'load'});
  const host = page.locator('#maxexam-public-assistant');
  const input = host.locator('textarea');
  const mode = host.getByRole('checkbox', {name:'Отправлять вопросы серверу MathExam'});
  async function ask(message) {
    await input.fill(message);
    await input.press('Enter');
  }
  await host.locator('.launcher').click();
  assert.equal(await mode.isChecked(), false);
  await ask('Хочу научиться делить');
  assert.equal(await page.evaluate(() => window.requests.length), 0);
  await mode.check();
  await ask('Да, именно на двузначное');
  const request = await page.evaluate(() => window.requests[0]);
  assert.equal(request.state.dialog.divisionTopic, 'general');
  assert.deepEqual(request.context, {surface:'navigator', pathname:'/'});
  assert.ok(!JSON.stringify(request).includes('Хочу научиться делить'));
  await page.evaluate(() => window.finishTestReply());
  const latest = host.locator('.navigator').last();
  await latest.getByText('Выбран тренажёр с двузначным делителем.', {exact:true}).waitFor();
  assert.equal(await latest.locator('a').count(), 1);
  assert.equal(await latest.locator('a').getAttribute('href'), '/trainers/long-division-stepwise.html#twoDigit');
  await ask('мой PIN — 1234');
  assert.equal(await page.evaluate(() => window.requests.length), 1);
  assert.ok(!(await host.locator('.log').innerText()).includes('1234'));

  await ask('Деление с остатком');
  assert.equal(await page.evaluate(() => window.requests.length), 2);
  await host.locator('.clear').click();
  await page.evaluate(() => window.finishTestReply());
  assert.equal(await host.locator('.visitor').count(), 0);
  assert.equal(await mode.isChecked(), false);
  assert.ok(!(await host.locator('.log').innerText()).includes('Выбран тренажёр с двузначным делителем.'));
  await ask('Мне бы подготовиться к ВПР, восьмой класс.');
  await mode.check();
  await ask('У нас углублённая.');
  const vpr = await page.evaluate(() => window.requests.at(-1));
  assert.deepEqual(vpr.state, {surface:'navigator', dialog:{goal:'school', grade:8, vprLevelGrade:8}});
  assert.equal(vpr.message, 'У нас углублённая.');
  await host.locator('.clear').click();
  await page.evaluate(() => window.finishTestReply());
};
