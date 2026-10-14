'use strict';

// Local-only contract/UI check. Every video-service request is fulfilled or
// aborted by Playwright; this does not establish production Amvera health.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TASK = 'soviet-motion-time';
const API = 'https://mathexam-video-ladynata.msk1.amvera.tech';

async function main() {
  const { validateManifest } = await import(pathToFileURL(path.join(ROOT, 'video-worker/src/renderer.js')));
  const server = http.createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(ROOT, '.' + pathname);
    if (!file.startsWith(ROOT + path.sep)) { response.writeHead(403).end(); return; }
    try {
      const content = await fs.readFile(file);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); response.end(content);
    } catch (_) { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ headless: true,
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [], outside = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      outside.push(route.request().url()); return route.abort();
    });
    await page.goto(origin + '/soviet-math/studio.html?studio=1');
    await page.waitForFunction(() => window.__MATH_EXAM_VIDEO_READY__ === true);
    const statements = [];
    for (const preset of [1, 2, 3]) {
      const manifest = await page.evaluate(({ task, preset }) => window.MathExamVideoStudio.prepare('t' + task, preset, 'ideal-solution'), { task: TASK, preset });
      validateManifest(manifest, TASK, 'ideal-solution');
      assert.equal(manifest.scenes.length, 6);
      const seconds = manifest.scenes.reduce((sum, scene) => sum + scene.duration_hint_ms / 1000, 0);
      assert.ok(seconds >= 90 && seconds <= 150, 'complete reading script remains 90–150 seconds');
      const expected = require('../soviet-math/course.js').make('motion-time', preset - 1);
      assert.equal(manifest.scenes[0].narration, expected.narration.intro);
      assert.equal(manifest.scenes[2].narration, expected.narration.steps[0].explanation);
      statements.push(manifest.scenes[0].narration);
      const check = await page.evaluate(({ task, manifest }) => {
        const board = document.getElementById('board');
        const snapshots = [];
        for (const scene of manifest.scenes) {
          window.MathExamVideoStudio.show('t' + task, scene.id, 'ideal-solution');
          if (scene.motion_ms) {
            window.MathExamVideoStudio.seekMotion(0); const first = board.toDataURL();
            window.MathExamVideoStudio.seekMotion(.5); const middle = board.toDataURL();
            window.MathExamVideoStudio.seekMotion(1);
            snapshots.push({ animated: first !== middle, final: board.toDataURL() });
          }
        }
        const final = board.toDataURL();
        window.MathExamVideoStudio.show(task, manifest.scenes[0].id);
        const initial = board.toDataURL();
        window.MathExamVideoStudio.show(task, manifest.scenes.at(-1).id);
        const rect = board.getBoundingClientRect();
        return { moved: snapshots.every(item => item.animated), independent: initial !== final,
          deterministic: final === board.toDataURL(), withinFrame: rect.top >= 0 && rect.left >= 0
            && rect.right <= innerWidth && rect.bottom <= innerHeight - 170,
          studentState: localStorage.getItem('mathExam.sovietMath.v1') };
      }, { task: TASK, manifest });
      assert.deepEqual(check, { moved: true, independent: true, deterministic: true, withinFrame: true, studentState: null });
    }
    assert.equal(new Set(statements).size, 3, 'preset numbers have their own correct narration');
    assert.equal(await page.locator('#mp4-form').isVisible(), false);
    assert.deepEqual(outside, [], 'render mode makes no video-service calls');
    if (process.env.SOVIET_STUDIO_SCREENSHOTS) {
      await fs.mkdir(process.env.SOVIET_STUDIO_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: path.join(process.env.SOVIET_STUDIO_SCREENSHOTS, 'studio-board-final.png') });
    }

    const posts = [], fixtureToken = 'test-only-not-a-secret-0123456789abcdef';
    let attempts = 0;
    const job = { id: 'vid_abcdefghijklmnopqrstuv', status: 'queued', progress: { current: 0, total: 6 } };
    await page.route(API + '/**', async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, Idempotency-Key' } });
      }
      assert.equal(request.headers().authorization, 'Bearer ' + fixtureToken);
      if (request.method() === 'POST') {
        posts.push({ body: request.postData(), key: request.headers()['idempotency-key'] }); attempts++;
        if (attempts === 1) return route.abort('failed');
      }
      const ready = request.method() === 'GET';
      return route.fulfill({ status: ready ? 200 : 202, contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': origin },
        body: JSON.stringify({ job: { ...job, ...(ready ? { status: 'ready' } : {}) } }) });
    });
    await page.goto(origin + '/soviet-math/studio.html');
    await page.locator('.export summary').click();
    await page.locator('#preset').selectOption('2');
    await page.locator('#mp4-token').fill(fixtureToken);
    await page.locator('#mp4-submit').click();
    await page.waitForFunction(() => document.getElementById('mp4-status').textContent.includes('Ответ не получен'));
    assert.equal(await page.locator('#preset').isDisabled(), true);
    assert.equal(await page.evaluate(value => JSON.stringify(sessionStorage).includes(value), fixtureToken), false);
    await page.reload();
    await page.locator('.export summary').click();
    assert.equal(await page.locator('#mp4-token').inputValue(), '');
    assert.equal(await page.locator('#preset').inputValue(), '2');
    assert.equal(await page.locator('#preset').isDisabled(), true);
    await page.locator('#mp4-token').fill(fixtureToken);
    await page.locator('#mp4-submit').click();
    await page.waitForFunction(() => document.getElementById('mp4-status').textContent === 'Видео готово');
    assert.equal(posts.length, 2); assert.deepEqual(posts[1], posts[0], 'lost reply retry preserves exact request and idempotency key');
    assert.equal(JSON.parse(posts[0].body).preset, 2);
    assert.equal(await page.locator('#mp4-download').isVisible(), true);
    assert.equal(await page.evaluate(value => JSON.stringify(sessionStorage).includes(value), fixtureToken), false);
    await page.locator('#mp4-clear').click();
    assert.equal(await page.locator('#mp4-token').inputValue(), '');
    assert.deepEqual(errors, []);
    console.log('SOVIET_STUDIO_BROWSER_OK: 3 manifests, shared-board motion, no pupil state, local mocked retry/auth workflow');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
