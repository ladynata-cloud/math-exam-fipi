/* Local authored-page test. The production worker's sandbox stays enabled. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..', 'video-lessons');
  const server = http.createServer(async (req, res) => {
    const file = new URL(req.url, 'http://localhost').pathname;
    if (!/^\/(studio\.(?:html|js|css)|export\.js|motion\.js|(?:cheatsheet|motion)-topics\.js|makarychev7-videos\.js)$/.test(file)) { res.writeHead(404); res.end(); return; }
    const data = await fs.readFile(path.join(root, file));
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'text/javascript' : 'text/css');
    res.end(data);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const token = 'synthetic-not-a-credential-for-test-1234567890';
    const jobs = new Map();
    const requestKeys = [];
    const requestBodies = [];
    let posts = 0;
    let downloads = 0;
    let sent = 0;
    await page.route('https://mathexam-video-ladynata.amvera.io/api/**', async route => {
      const request = route.request();
      sent++;
      assert.ok(['Bearer ' + token, 'Bearer ' + token + '-wrong'].includes(request.headers().authorization));
      assert.equal(request.headers().cookie, undefined);
      assert.equal(request.url().includes(token), false);
      if (request.method() === 'POST') {
        posts++;
        const key = request.headers()['idempotency-key'];
        requestKeys.push(key);
        const payload = request.postDataJSON();
        requestBodies.push(request.postData());
        assert.equal(payload.preset, 1, 'An uncertain request preserves its original example');
        assert.equal(payload.audioMode, 'silent');
        assert.equal(payload.captions, true);
        assert.equal(payload.task, 'linear-equation');
        const reused = jobs.has(key);
        if (posts === 2) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Authorization required' }) });
        if (!reused) jobs.set(key, { id: 'vid_012345678901234567890123', task: payload.task, preset: payload.preset, status: 'ready', videoReady: true });
        // Simulate a committed server job whose first response was lost.
        if (posts === 1) return route.abort('failed');
        return route.fulfill({ status: reused ? 200 : 202, contentType: 'application/json', body: JSON.stringify({ job: jobs.get(key), reused }) });
      }
      if (request.url().endsWith('/video')) {
        downloads++;
        return route.fulfill({ status: 200, contentType: 'video/mp4', body: Buffer.from('synthetic-download-fixture') });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ job: [...jobs.values()][0] }) });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/studio.html`);
    await page.waitForFunction(() => window.__MATH_EXAM_VIDEO_READY__ === true);
    assert.equal(sent, 0, 'preview must make no video-server or credential request');
    // Previous audible exports are never silently reissued or rewritten under
    // their old deduplication key. Only the explicit local discard unlocks a
    // fresh silent request; discarding itself sends nothing to the server.
    for (const audioMode of ['voice', 'clicks']) {
      const legacy = { key: 'legacy-' + audioMode + '-request-0123456789', body: JSON.stringify({
        task: 'proportions', preset: 2, format: '9:16', audioMode,
        captions: true, videoType: 'ideal-solution'
      }) };
      await page.evaluate(value => sessionStorage.setItem('mathexam-school-video-pending-v1', JSON.stringify(value)), legacy);
      await page.reload();
      await page.locator('#mp4-tools summary').click();
      assert.equal(await page.locator('#mp4-submit').isDisabled(), true);
      for (const id of ['task', 'preset', 'mp4-format']) assert.equal(await page.locator('#' + id).isDisabled(), true);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('mathexam-school-video-pending-v1')), JSON.stringify(legacy));
      await page.locator('#mp4-token').fill(token);
      await page.locator('#mp4-form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      assert.equal(sent, 0, 'Even programmatic submit cannot replay legacy audible work');
      await page.locator('#mp4-restart-silent').click();
      assert.equal(sent, 0, 'Explicit discard is local, not a remote cancellation or new render');
      assert.equal(await page.evaluate(() => sessionStorage.getItem('mathexam-school-video-pending-v1')), null);
      assert.equal(await page.locator('#mp4-submit').isDisabled(), false);
      for (const id of ['task', 'preset', 'mp4-format']) assert.equal(await page.locator('#' + id).isDisabled(), false);
      await page.locator('#mp4-tools summary').click();
    }
    await page.locator('#mp4-tools summary').click();
    assert.equal(await page.locator('#mp4-audio').count(), 0, 'School exports expose no audible mode');
    await page.locator('#mp4-token').fill(token);
    await page.locator('#mp4-submit').click();
    await page.waitForFunction(() => document.getElementById('mp4-status').textContent.includes('тот же запрос'));
    assert.equal(await page.locator('#preset').isDisabled(), true);
    // Reload loses neither the deduplication key nor the frozen request, and
    // never restores the secret. A later 401 must not erase the uncertain job.
    await page.reload();
    await page.locator('#mp4-tools summary').click();
    assert.equal(await page.locator('#mp4-token').inputValue(), '');
    await page.locator('#mp4-token').fill(token + '-wrong');
    await page.locator('#mp4-submit').click();
    await page.waitForFunction(() => document.getElementById('mp4-status').textContent.includes('Код доступа не подошёл'));
    assert.equal(await page.locator('#preset').isDisabled(), true);
    await page.locator('#mp4-token').fill(token);
    // Even bypassing the disabled selector in this adversarial fixture cannot
    // replace an uncertain request with another render.
    await page.evaluate(() => { document.getElementById('task').value = 'linear-equation'; document.getElementById('preset').value = '3'; });
    await page.locator('#mp4-submit').click();
    await page.waitForFunction(() => document.getElementById('mp4-status').textContent === 'Видео готово');
    assert.equal(posts, 3);
    assert.equal(jobs.size, 1, 'lost reply must not create a second render job');
    assert.equal(requestKeys[0], requestKeys[1]);
    assert.equal(requestKeys[0], requestKeys[2]);
    assert.equal(requestBodies[0], requestBodies[1]);
    assert.equal(requestBodies[0], requestBodies[2]);
    assert.equal(requestKeys.some(key => key.startsWith('legacy-')), false);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#mp4-download').click();
    assert.equal((await downloadEvent).suggestedFilename(), 'linear-equation.mp4');
    assert.equal(downloads, 1);
    assert.deepEqual(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })), { local: [], session: [] });
    assert.equal((await page.url()).includes(token), false);
    await page.locator('#mp4-clear').click();
    assert.equal(await page.locator('#mp4-token').inputValue(), '');
    assert.deepEqual(errors, []);
    console.log('SELF_STUDY_EXPORT_BROWSER_OK: silent export; explicit local legacy-audio discard; lost ACK reuses exact key and body; fixed origin; no cookie/storage credentials; authenticated download; clear token');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
