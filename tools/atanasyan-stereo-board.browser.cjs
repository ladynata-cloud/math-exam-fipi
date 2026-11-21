'use strict';

const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {createRequire} = require('node:module');
const {createServer} = require('node:net');
const path = require('node:path');
const {chromium} = require('playwright');
const {setTimeout: delay} = require('node:timers/promises');
const root = path.resolve(__dirname, '..');
const express = createRequire(path.join(root, 'board-server/package.json'))('express');
const trainer = '/trainers/atanasyan-stereo-textbook.html';
const section = 'ex-main-0412-b';
const localKey = 'mathExamTextbook.v1:atanasyan-2024-10-11:' + section + ':r1';
const listen = app => new Promise((resolve, reject) => {
  const server = app.listen(0, '127.0.0.1', () => resolve(server));
  server.once('error', reject);
});
const close = server => server && new Promise(resolve => { server.closeAllConnections?.(); server.close(resolve); });

async function ready(host, id) {
  await host.waitForFunction(expected => {
    const frame = document.querySelector('#trainerFrame');
    return new URL(frame?.src || location.href).pathname === expected &&
      document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected';
  }, trainer);
  const frame = await (await host.locator('#trainerFrame').elementHandle()).contentFrame();
  await frame.waitForFunction(expected => document.querySelector('#card')?.value === expected, id);
  return frame;
}

(async () => {
  let server, room, browser;
  try {
    const site = express();
    site.use(express.static(root));
    server = await listen(site);
    const origin = 'http://localhost:' + server.address().port;
    const reservation = await listen(createServer());
    const port = reservation.address().port;
    await close(reservation);
    const roomOrigin = 'http://127.0.0.1:' + port;
    room = spawn(process.execPath, ['index.js'], {cwd:path.join(root, 'board-server'),
      env:{PATH:process.env.PATH, HOST:'127.0.0.1', PORT:String(port), NODE_ENV:'test', CORS_ALLOWED_ORIGINS:origin}, stdio:'ignore'});
    const deadline = Date.now() + 15000;
    for (;;) {
      if (room.exitCode !== null || Date.now() > deadline) throw Error('Isolated board server failed to start');
      const response = await fetch(roomOrigin + '/health', {signal:AbortSignal.timeout(750)}).catch(() => null);
      if (response?.ok) break;
      await delay(80);
    }
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH, headless:true, args:['--no-sandbox','--disable-dev-shm-usage']});
    const errors = [];
    async function page(width) {
      const context = await browser.newContext({viewport:{width,height:900}, serviceWorkers:'block'});
      await context.route('**/*', request => [origin,roomOrigin].includes(new URL(request.request().url()).origin) ? request.continue() : request.abort());
      await context.addInitScript(({site, key, roomServer}) => {
        if (location.origin === site) {
          localStorage.setItem('mathexam.trainerBoard.serverUrl', roomServer);
          if (!localStorage.getItem(key)) localStorage.setItem(key, 'isolated-personal-record');
        }
      }, {site:origin,key:localKey,roomServer:roomOrigin});
      const result = await context.newPage();
      result.setDefaultTimeout(20000);
      result.on('pageerror', error => errors.push(error.message));
      return result;
    }

    const teacher = await page(1280), pupil = await page(390);
    const board = new URL('/trainers/trainer-board.html', origin);
    board.searchParams.set('trainer', '/stereo-course/textbook/#' + section);
    await teacher.goto(board.href);
    await teacher.locator('#openShare').click();
    await teacher.locator('#createRoom').click();
    await teacher.waitForFunction(() => document.querySelector('#studentLink')?.value.includes('role=student'));
    const invitation = await teacher.locator('#studentLink').inputValue();
    await teacher.locator('#sharePanel [data-close-panel]').click();
    await pupil.goto(invitation);

    const left = await ready(teacher, section);
    let right = await ready(pupil, section);
    assert.equal(await left.locator('#work').inputValue(), '');
    await left.locator('#work').fill('Моя запись: <x> и основание высоты');
    await left.getByRole('button', { name: 'Подсказка', exact: true }).click();
    await left.getByRole('button', { name: 'Следующий шаг', exact: true }).click();
    await right.waitForFunction(() => document.querySelector('#work').value.includes('<x>') &&
      document.querySelector('#step h3') && document.querySelector('#hint h3'));
    const original = await right.locator('svg[data-yaw]').getAttribute('data-yaw');
    await left.getByRole('button', { name: 'Повернуть вправо', exact: true }).click();
    await right.waitForFunction(before => document.querySelector('svg[data-yaw]').dataset.yaw !== before, original);
    await left.locator('#find-number').fill('413');
    await left.locator('#find-number').press('Enter');
    await right.waitForFunction(() => document.querySelector('#card').value === 'ex-main-0413');
    await teacher.locator('#openShare').click();
    await teacher.locator('#controlToggle').click();
    await pupil.waitForFunction(() => document.body.classList.contains('control-owner'));
    await teacher.locator('#sharePanel [data-close-panel]').click();
    await right.locator('#work').fill('Сравниваю площади кольца и круга');
    await left.waitForFunction(() => document.querySelector('#work').value === 'Сравниваю площади кольца и круга');
    await right.locator('#find-number').fill('17');
    await right.locator('#find-number').press('Enter');
    await left.waitForFunction(() => document.querySelector('#card').value === 'ex-main-0017');
    await right.getByRole('button', {name:'Следующий шаг', exact:true}).click();
    await right.locator('#work-step-1').fill('8');
    await right.getByRole('button', {name:'Проверить этот шаг', exact:true}).click();
    await left.waitForFunction(() => document.querySelector('[data-step-feedback="step-1"]')?.dataset.answerStatus === 'wrong');
    assert.match(await left.locator('[data-step-feedback="step-1"]').innerText(), /половина/iu);
    await right.locator('#work-step-1').fill('7');
    await right.getByRole('button', {name:'Проверить этот шаг', exact:true}).click();
    await left.waitForFunction(() => document.querySelector('[data-step-feedback="step-1"]')?.dataset.answerStatus === 'correct');
    await pupil.reload();
    right = await ready(pupil, 'ex-main-0017');
    assert.equal(await right.locator('#work-step-1').inputValue(), '7');
    assert.equal(await right.locator('[data-step-feedback="step-1"]').getAttribute('data-answer-status'), 'correct');
    for (const frame of [left,right]) assert.equal(await frame.evaluate(key => localStorage.getItem(key), localKey), 'isolated-personal-record');
    assert.deepEqual(errors, []);
    console.log('ATANASYAN_STEREO_BOARD_OK: two room participants, rotated 3D, hints, checked step answers, final draft, transfer of control, reload, personal records isolated');
  } finally {
    await browser?.close();
    room?.kill();
    await close(server);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
