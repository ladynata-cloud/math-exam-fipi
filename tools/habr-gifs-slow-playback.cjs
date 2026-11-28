'use strict';

const assert = require('node:assert/strict');
const {setTimeout: delay} = require('node:timers/promises');

async function verifySlowPlayback(browser, origin, plan, cancelWhileLoading) {
  const clip = plan.clips.find(entry => entry.id === 'habr-percent-80');
  const gif = origin + '/assets/habr-entry-gifs/' + clip.id + '/' + clip.id + '.gif';
  const duration = clip.frames.reduce((total, frame) => total + frame.durationMs, 0);
  const delayMs = duration + 1000;
  const context = await browser.newContext({
    viewport: {width: 320, height: 900}, reducedMotion: 'no-preference', serviceWorkers: 'block', locale: 'ru-RU'
  });
  const gate = Promise.withResolvers();
  try {
    await context.route('**/*', async route => {
      const url = route.request().url();
      if (new URL(url).origin !== origin) return route.abort();
      if (url === gif) {
        await gate.promise;
      }
      return route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(origin + clip.url, {waitUntil: 'networkidle'});
    const panel = page.locator('[data-habr-gif="' + clip.id + '"]');
    await panel.locator(':scope > summary').click();
    const image = panel.locator('img');
    await image.evaluate(el => el.decode());

    // Observe the visible image, including a replacement of the poster element.
    const evidence = await panel.evaluateHandle(host => {
      const result = {loadedAt: null, stoppedAt: null, cancelled: false, restarted: false};
      function sample() {
        const image = host.querySelector('img');
        const pressed = host.querySelector('[aria-pressed="true"]') !== null;
        const ready = image && image.complete && image.naturalWidth > 0 && image.getClientRects().length > 0 && image.currentSrc.endsWith('.gif');
        if (result.cancelled && (ready || pressed)) result.restarted = true;
        if (ready && pressed && result.loadedAt === null) result.loadedAt = performance.now();
        if (!pressed && result.loadedAt !== null && result.stoppedAt === null) result.stoppedAt = performance.now();
      }
      host.addEventListener('load', sample, true);
      new MutationObserver(sample).observe(host, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'aria-pressed']
      });
      return result;
    });
    const requested = page.waitForRequest(req => req.url() === gif);
    await panel.getByRole('button', {name: 'Воспроизвести GIF', exact: true}).click();
    await requested;
    const stop = panel.getByRole('button', {name: 'Остановить GIF', exact: true});
    if (cancelWhileLoading) {
      await stop.click();
      await panel.getByRole('button', {name: 'Следующий кадр →', exact: true}).click();
      await image.evaluate(el => el.decode());
      await evidence.evaluate(value => { value.cancelled = true; });
      gate.resolve();
      // Keep the page and its observers alive through the released response and a full stale timer.
      await page.waitForLoadState('networkidle');
      await delay(duration + 250);
      const observed = await evidence.jsonValue();
      assert.equal(observed.restarted, false, 'Late GIF response restarted a cancelled animation');
      assert((await image.getAttribute('src')).endsWith('frame-02.png'), 'Keep the manually selected frame');
      assert.equal(await panel.getByRole('button', {name: 'Воспроизвести GIF', exact: true}).getAttribute('aria-pressed'), 'false');
      assert.deepEqual(errors, []);
      return {cancelledWhileLoading: true, manualFrame: 2};
    }

    // With the real 4.5 s percent clip, no bytes arrive for the first 5.5 s.
    await delay(delayMs);
    assert.equal(await stop.count(), 1, 'Playback stopped before the first GIF byte arrived');
    gate.resolve();
    await page.waitForFunction(value => value.stoppedAt !== null, evidence, {timeout: duration + 15000});
    const observed = await evidence.jsonValue();
    const visibleMs = observed.stoppedAt - observed.loadedAt;
    // Allow 150 ms for load delivery, DOM observation and the browser clock; a full frame is 1500 ms.
    assert(visibleMs >= duration - 150, 'Full cycle after GIF load: ' + visibleMs + ' of ' + duration + ' ms');
    assert((await image.getAttribute('src')).endsWith('frame-01.png'), 'Return to the poster at cycle end');
    assert.deepEqual(errors, []);
    return {delayMs, durationMs: duration, visibleMs};
  } finally {
    gate.resolve();
    await context.unrouteAll({behavior: 'wait'});
    await context.close();
  }
}

module.exports = {verifySlowPlayback};
