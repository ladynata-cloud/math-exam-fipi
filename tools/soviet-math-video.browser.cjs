'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const manifest = require('../soviet-math/media/manifest.json');
(async () => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.resolve(__dirname, '../soviet-math/index.html')).href + '#bonds');
    const supported = await page.locator('#video').evaluate(v => v.canPlayType('video/mp4; codecs="avc1.42E01E"'));
    if (!supported) {
      assert.notEqual(process.env.SOVIET_VIDEO_REQUIRE_CODEC, '1', 'This gate requires Chrome with H.264 support');
      console.log('SOVIET_VIDEO_PLAYBACK_NOT_RUN: browser has no H.264 decoder');
      return;
    }
    for (const lesson of manifest.lessons) {
      await page.evaluate(id => { location.hash = id; }, lesson.id);
      await page.waitForFunction(id => document.title.startsWith(window.SovietMath.topics.find(t => t.id === id).title), lesson.id);
      await page.locator('#mode-video').click();
      await page.waitForFunction(() => {
        const v = document.getElementById('video');
        if (v.error) throw Error(v.error.message);
        return v.readyState >= 2;
      });
      const duration = await page.locator('#video').evaluate(v => v.duration);
      assert.ok(Math.abs(duration - lesson.seconds) < .1, lesson.id + ': duration');
      for (const fraction of [.15, .55, .96]) {
        await page.locator('#video').evaluate((v, position) => new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(Error('seek timeout')), 15000);
          v.addEventListener('seeked', () => { clearTimeout(timeout); resolve(); }, { once: true });
          v.currentTime = v.duration * position;
        }), fraction);
        assert.equal(await page.locator('#video').evaluate(v => v.error === null), true, lesson.id + ': seek decode');
      }
      await page.locator('#video').evaluate(v => { v.currentTime = 0; return v.play(); });
      await page.waitForFunction(() => document.getElementById('video').currentTime > .12);
      await page.locator('#video').evaluate(v => v.pause());
    }
    console.log('SOVIET_MATH_PLAYBACK_OK ' + manifest.lessons.length);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
