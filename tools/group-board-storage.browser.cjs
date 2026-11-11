'use strict';
const assert = require('node:assert/strict');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function poll(check, label) {
  const until = Date.now() + 20000;
  while (Date.now() < until) { if (await check()) return; await delay(100); }
  throw Error(label + ' timed out');
}
module.exports = async function storageFailure({page, origin, server, lesson, token, seatId, teacher, offline = false, readWork}) {
  const actionURL = server + '/api/group-lessons/' + lesson + '/actions';
  const key = 'mathexam.group.outbox.v2.' + encodeURIComponent(JSON.stringify([server, lesson, teacher ? 'teacher' : seatId]));
  const queue = () => page.evaluate(key => JSON.parse(sessionStorage.getItem(key) || '{}'), key);
  const openBoard = async () => {
    if (teacher) await page.locator('#roster button').first().click();
    const button = page.locator('#materialTabs [data-surface="board"]');
    if (await button.getAttribute('aria-pressed') !== 'true') await button.click();
    await poll(async () => await button.getAttribute('aria-pressed') === 'true', 'board selected');
  };
  const acceptUnload = dialog => dialog.accept(); page.on('dialog', acceptUnload);
  await page.goto(origin + '/trainers/group-board.html#' + new URLSearchParams({lesson, token, server}));
  await page.locator('#app').waitFor({state:'visible'}); await openBoard();
  assert.equal((await readWork()).strokes.length, 0);
  const before = await page.evaluate(key => sessionStorage.getItem(key), key);
  // A real browser exception at the persistence boundary; requests still reach
  // the real synthetic backend when the barrier is released.
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    window.restoreQueueStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (this === sessionStorage && name === key) throw new DOMException('QA quota', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, key);
  let release, body, failedReads = 0;
  const unavailable = {status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({error:'QA_OFFLINE'})};
  const pollURL = server + '/api/group-lessons/' + lesson + '?after=*';
  const failRead = route => { failedReads++; return route.fulfill(unavailable); };
  if (offline) await page.route(pollURL, failRead);
  const barrier = new Promise(resolve => { release = resolve; });
  const handler = async route => {
    if (route.request().method() !== 'POST' || route.request().postDataJSON()?.type !== 'stroke') return route.continue();
    body = route.request().postDataJSON(); await barrier;
    return offline ? route.fulfill(unavailable) : teacher ? route.continue() : route.fulfill({status:403,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({error:'GROUP_FORBIDDEN'})});
  };
  await page.route(actionURL, handler);
  try {
    const canvas = page.locator('#boardCanvas'); await canvas.scrollIntoViewIfNeeded(); const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 35, box.y + 45); await page.mouse.down();
    await page.mouse.move(box.x + 110, box.y + 100, {steps:8}); await page.mouse.up();
    await poll(() => !!body, 'memory queue continues sending despite unavailable backup');
    assert.match(await page.locator('#connectionStatus').textContent(), /Нет резервной копии/);
    assert.equal(await page.locator('#connectionStatus').getAttribute('data-state'), 'pending');
    assert.equal(await page.locator('#penButton').isDisabled(), true, 'further edits blocked until backup recovers');
    assert.equal(await page.evaluate(key => sessionStorage.getItem(key), key), before, 'last stored envelope untouched');
    assert.equal(await canvas.evaluate(c => {
      const p = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      return p.some((v, i) => i % 4 === 3 && v > 0);
    }), true, 'unbacked stroke remains visible');
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#recoverWorkButton').click()]);
    const stream = await download.createReadStream(); let text = ''; for await (const chunk of stream) text += chunk.toString();
    const recovery = JSON.parse(text);
    assert.equal(recovery.unsent[0].opId, body.opId, 'both roles can download exact in-memory action');
    assert.equal(text.includes(token), false, 'recovery export has no credentials');
    release();
    if (offline) await poll(() => failedReads > 0, 'server polls also unavailable');
    else if (teacher) await poll(async () => (await readWork()).strokes.length === 1, 'unbacked stroke reaches durable server');
    else await poll(async () => /Для этого действия нет доступа/.test(await page.locator('#errorNotice').textContent()), 'permanent refusal handled');
    assert.match(await page.locator('#connectionStatus').textContent(), /Нет резервной копии/, 'ACK or refusal does not hide storage failure');
    await page.evaluate(() => window.restoreQueueStorage());
    await poll(async () => !/Нет резервной копии/.test(await page.locator('#connectionStatus').textContent()), 'local checkpoint recovers independently of network');
    assert.equal((await queue()).outbox.length, offline ? 1 : 0);
    assert.equal((await queue()).rejected.length, teacher || offline ? 0 : 1);
    if (offline) {
      assert.equal((await queue()).outbox[0].opId, body.opId, 'memory action backed up while POST and polling still unavailable');
      assert.equal((await readWork()).strokes.length, 0);
    }
    if (!teacher && !offline) assert.equal((await queue()).rejected[0].action.opId, body.opId, 'refused memory action backed up on recovery');
    await page.reload(); await page.locator('#app').waitFor({state:'visible'}); await openBoard();
    if (offline) {
      assert.equal((await queue()).outbox[0].opId, body.opId, 'reload restores the locally recovered action');
      await page.unroute(pollURL, failRead); await page.unroute(actionURL, handler);
      await poll(async () => (await readWork()).strokes.length === 1 && (await queue()).outbox.length === 0, 'network recovery sends exactly one restored stroke');
      await page.locator('#undoButton').click();
      await poll(async () => (await readWork()).strokes.length === 0, 'pupil fixture cleanup');
    } else if (teacher) {
      assert.equal((await readWork()).strokes.length, 1, 'reload does not duplicate accepted action');
      await page.locator('#undoButton').click();
      await poll(async () => (await readWork()).strokes.length === 0, 'teacher fixture cleanup');
    } else {
      assert.equal((await queue()).rejected[0].action.opId, body.opId, 'rejected action survives reload');
      assert.equal((await readWork()).strokes.length, 0);
    }
  } finally {
    release(); await page.unroute(actionURL, handler);
    if (offline) await page.unroute(pollURL, failRead);
    await page.evaluate(() => window.restoreQueueStorage?.()); page.off('dialog', acceptUnload);
  }
  console.log('PASS browser quota failure, ' + (offline ? 'simultaneous network outage' : teacher ? 'teacher ACK' : 'pupil rejection') + ', download, storage recovery and reload');
};
