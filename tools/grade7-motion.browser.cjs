'use strict';
// Fixed authored lessons served on loopback. No account, production, speech or
// video-generation request is allowed. Optional artifacts are QA intermediates.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { chromium } = require('playwright');
const run = promisify(execFile), ROOT = path.resolve(__dirname, '..');
const allTopics = ['negative-numbers', 'fractions', 'brackets', 'linear-equation', 'proportions', 'percentages', 'adjacent-angles',
  'numeric-expressions', 'variable-expressions', 'compare-expressions', 'arithmetic-properties', 'identities', 'equation-roots', 'linear-cases', 'equation-word-problems',
  'grade7-a-opposite-expression', 'grade7-a-two-variable-collect', 'grade7-a-equation-two-brackets', 'grade7-a-equation-denominators', 'grade7-a-equation-decimals', 'grade7-g-segment-order', 'grade7-g-midpoint-chain', 'grade7-g-angle-addition', 'grade7-g-angle-bisector', 'grade7-g-adjacent-equation', 'grade7-b-mixed-borrow', 'grade7-b-fraction-product-cancel', 'grade7-b-decimal-divisor-scale', 'grade7-b-signed-fraction-sum', 'grade7-b-percent-proportion', 'pre7-place-value', 'pre7-natural-compare', 'pre7-add-carry', 'pre7-subtract-borrow', 'pre7-smart-calculation', 'pre7-inverse-components', 'pre7-divisibility', 'pre7-scale-reading', 'pre7-comparison-stories', 'pre7-fraction-line', 'pre7-equivalent-fractions', 'pre7-fraction-compare', 'pre7-fraction-part-whole', 'pre7-decimal-compare', 'pre7-mass-capacity', 'pre7-ruler-length', 'pre7-perimeter', 'pre7-grid-area', 'grade7-g-core-point-line-ray', 'grade7-g-core-perpendicular', 'grade7-g-core-angle-measure', 'grade7-g-core-triangle-elements', 'grade7-g-core-triangle-perimeter', 'grade7-g-core-sas', 'grade7-g-core-median', 'grade7-g-core-bisector', 'grade7-g-core-altitude', 'grade7-g-core-isosceles-elements', 'grade7-g-core-isosceles-base-angles', 'grade7-g-core-isosceles-vertex-line', 'grade7-g-practice-segment-equation', 'grade7-g-practice-angle-parts', 'grade7-g-practice-vertical-proof', 'grade7-g-practice-sas-common-side', 'grade7-g-practice-sas-vertical', 'grade7-g-practice-cevian-reason', 'grade7-g-practice-isosceles-perimeter', 'grade7-g-practice-isosceles-proof'];
const chosen = process.argv.find(value => value.startsWith('--topics='));
const topics = chosen ? chosen.slice(9).split(',') : allTopics;
assert.ok(topics.length && topics.every(topic => allTopics.includes(topic)), 'Only fixed authored topic IDs are supported');
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
// Independent transfer expectations: the whole summand changes sign only
// when it crosses equality. Merely collecting terms on one side is not transfer.
const transfers = {
  'linear-equation': [
    { 'move-letters-4': [['4x', '−4x']], 'move-numbers-5': [['−4', '+4']] },
    { 'move-letters-4': [['3x', '−3x']], 'move-numbers-5': [['+5', '−5']] },
    { 'move-letters-4': [['5x', '−5x']], 'move-numbers-5': [['−9', '+9']] }
  ],
  brackets: [
    { 'move-numbers-6': [['−3', '+3'], ['−12', '+12']] },
    { 'move-numbers-6': [['+8', '−8'], ['+6', '−6']] },
    { 'move-numbers-6': [['+6', '−6'], ['+5', '−5']] }
  ]
};
const report = { layoutErrors: [], journeys: [], pixels: [], media: [], errors: [], external: [], writes: [] };
async function main() {
  const { silentDuration } = await import('../video-worker/src/tts.js');
  const keep = process.env.GRADE7_MOTION_ARTIFACT_DIR;
  const output = keep || await fs.mkdtemp(path.join(os.tmpdir(), 'grade7-motion-'));
  await fs.mkdir(output, { recursive: true });
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (req.method !== 'GET') { report.writes.push(req.method + ' ' + pathname); res.writeHead(405); return res.end(); }
      if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
      if (!/^\/video-lessons\/[a-z0-9-]+\.(?:html|js|css)$/.test(pathname)) { res.writeHead(404); return res.end(); }
      const types = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8', '.css': 'text/css;charset=utf-8' };
      const content = await fs.readFile(path.join(ROOT, pathname));
      res.writeHead(200, { 'Content-Type': types[path.extname(pathname)], 'Cache-Control': 'no-store' }); res.end(content);
    } catch (_) { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  const firstMotions = new Map();
  try {
    browser = await chromium.launch({ headless: true, chromiumSandbox: false,
      ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
    async function open(viewport, studio = true) {
      const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) { report.external.push(url.origin + url.pathname); return route.abort(); }
        return route.continue();
      });
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
      await page.goto(origin + '/video-lessons/studio.html' + (studio ? '?studio=1' : ''));
      await page.waitForFunction(() => window.__MATH_EXAM_VIDEO_READY__ === true);
      assert.equal(await page.evaluate(() => typeof MathExamVideoStudio.seekMotion), 'function');
      return { page, context };
    }
    async function inspect(page, label, studio) {
      const errors = await page.evaluate(studio => {
        const failures = [], canvas = document.querySelector('.canvas').getBoundingClientRect();
        if (document.documentElement.scrollWidth > innerWidth + 1) failures.push('horizontal overflow');
        const selectors = ['#condition', '#step-panel', '#solution-history', '.frame-footer'];
        for (const selector of selectors) {
          const element = document.querySelector(selector); if (!element) { failures.push(selector + ' missing'); continue; }
          const box = element.getBoundingClientRect();
          if (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1) failures.push(selector + ' inner overflow');
          if (studio && (box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > canvas.bottom + 1)) failures.push(selector + ' outside scene');
        }
        const caption = document.getElementById('check-caption');
        if (studio && caption) {
          const box = caption.getBoundingClientRect();
          if (box.top < canvas.bottom - 1 || box.bottom > innerHeight || caption.scrollWidth > caption.clientWidth + 1 || caption.scrollHeight > caption.clientHeight + 1) failures.push('caption outside reserved area');
        }
        const history = document.querySelector('#solution-history'), bounds = history.closest('.condition').getBoundingClientRect();
        for (const element of history.querySelectorAll('.history-line, .history-math')) {
          const box = element.getBoundingClientRect();
          if (box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1) failures.push('retained step clipped');
        }
        for (const svg of document.querySelectorAll('.motion-diagram, .condition .diagram')) {
          const v = svg.viewBox.baseVal;
          for (const text of svg.querySelectorAll('text')) {
            if (Number(getComputedStyle(text).opacity) === 0 || text.closest('[opacity="0"]')) continue;
            const b = text.getBBox();
            // SVG labels are transformed in a travelling group; compare final
            // screen rectangles to the rendered SVG viewport, not raw x/y.
            const t = text.getBoundingClientRect(), boundary = svg.getBoundingClientRect();
            if (b.width && (t.left < boundary.left - 2 || t.right > boundary.right + 2 || t.top < boundary.top - 2 || t.bottom > boundary.bottom + 2)) failures.push('SVG text clipped: ' + text.textContent);
          }
          if (!(v.width > 0 && v.height > 0)) failures.push('missing SVG viewBox');
        }
        return failures;
      }, studio);
      if (errors.length && keep) await page.screenshot({ path: path.join(output, 'failure-' + label.replace(/[^a-z0-9-]/gi, '_') + '.png'), fullPage: true });
      if (errors.length) report.layoutErrors.push({ label, errors });
    }
    for (const [format, viewport] of [['16:9', { width: 1280, height: 720 }], ['9:16', { width: 720, height: 1280 }]]) {
      const { page, context } = await open(viewport);
      for (const task of topics) for (const preset of [1, 2, 3]) {
        const manifest = await page.evaluate(({ task, preset }) => MathExamVideoStudio.prepare('t' + task, preset), { task, preset });
        const motions = manifest.scenes.filter(scene => scene.motion_ms > 0);
        assert.ok(motions.length > 0, task + ': a real animated explanation exists');
        let elapsed = 0, previousLines = [], mostLines = 0;
        for (const scene of manifest.scenes) {
          if (scene.motion_ms > 0 && !firstMotions.has(task) && preset === 1 && format === '16:9') firstMotions.set(task, { elapsed, duration: scene.motion_ms / 1000, id: scene.id });
          elapsed += silentDuration(scene.narration, scene.duration_hint_ms);
          await page.evaluate(({ task, id }) => MathExamVideoStudio.show('t' + task, id), { task, id: scene.id });
          await page.evaluate(({ text, portrait }) => {
            let caption = document.getElementById('check-caption');
            if (!caption) { caption = document.createElement('div'); caption.id = 'check-caption'; document.body.append(caption); }
            caption.textContent = text;
            Object.assign(caption.style, { position: 'fixed', left: portrait ? '28px' : '40px', right: portrait ? '28px' : '40px', bottom: '20px',
              padding: '16px 22px', font: `${portrait ? 24 : 22}px/1.4 system-ui,sans-serif`, boxSizing: 'border-box',
              whiteSpace: 'normal', overflowWrap: 'anywhere', color: 'white', background: 'rgba(20,27,45,.91)', borderRadius: '18px', textAlign: 'center' });
          }, { text: scene.narration, portrait: format === '9:16' });
          const retained = await page.locator('#solution-history .history-math').allTextContents();
          if (!(task === 'adjacent-angles' && scene.id === 'independent-task-10')) assert.deepEqual(retained.slice(0, previousLines.length), previousLines, 'Earlier justified steps survive every later scene');
          previousLines = retained; mostLines = Math.max(mostLines, retained.length);
          const digests = [];
          const expectedTransfers = transfers[task]?.[preset - 1]?.[scene.id];
          let startingXs;
          for (const progress of scene.motion_ms > 0 ? [0, .5, 1] : [1]) {
            await page.evaluate(progress => MathExamVideoStudio.seekMotion(progress), progress);
            if (expectedTransfers) {
              const tokens = await page.locator('.motion-travel').evaluateAll(nodes => nodes.map(node => ({
                text: node.querySelector('text').textContent, x: node.transform.baseVal.consolidate().matrix.e
              })));
              assert.equal(tokens.length, expectedTransfers.length);
              if (progress === 0) startingXs = tokens.map(token => token.x);
              tokens.forEach((token, i) => {
                const crossed = startingXs[i] > 320 ? token.x <= 320 : token.x >= 320;
                assert.equal(token.text, expectedTransfers[i][crossed ? 1 : 0],
                  `${task}/${preset}/${scene.id}: the moving summand changes sign at equality`);
                if (progress === 1) assert.equal(crossed, true, 'The token really reaches the other side');
              });
            }
            await inspect(page, `${task}/${preset}/${format}/${scene.id}@${progress}`, true);
            assert.deepEqual(await page.locator('#solution-history .history-math').allTextContents(), retained,
              'Animation never removes or rewrites a previous justified step');
            if (scene === motions[0] && preset === 1) {
              const area = page.locator(task === 'adjacent-angles' ? '.condition .diagram' : '.step-panel .motion-diagram');
              const frame = await area.screenshot({ animations: 'disabled' });
              digests.push(hash(frame));
              if (keep) await fs.writeFile(path.join(output, `${task}-${format.replace(':', '-')}-${progress}.png`), frame);
            }
          }
          if (digests.length) {
            assert.equal(new Set(digests).size, 3, task + ': beginning, middle and end contain genuinely different pixels');
            report.pixels.push({ task, format, scene: scene.id, distinctFrames: 3 });
          }
        }
        assert.ok(mostLines >= 3, task + ': the worked example visibly accumulates at least three justified records');
        await page.evaluate(({ task, id }) => MathExamVideoStudio.show('t' + task, id), { task, id: manifest.scenes[0].id });
        assert.deepEqual(await page.locator('#solution-history .history-math').allTextContents(), [], 'Jumping back to the initial condition hides all future results');
        report.journeys.push({ task, preset, format, scenes: manifest.scenes.length, motionScenes: motions.length, retainedSteps: mostLines });
      }
      await context.close();
    }
    const { page, context } = await open({ width: 390, height: 844 }, false);
    for (const task of topics) {
      const manifest = await page.evaluate(task => MathExamVideoStudio.prepare('t' + task, 1), task);
      for (const scene of manifest.scenes.filter(scene => scene.motion_ms > 0)) {
        await page.evaluate(({ task, id }) => MathExamVideoStudio.show('t' + task, id), { task, id: scene.id });
        await page.evaluate(() => MathExamVideoStudio.seekMotion(.5));
        await inspect(page, task + ': 390px mid-motion reader', false);
      }
      await page.locator('#next').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    }
    await page.evaluate(() => { MathExamVideoStudio.prepare('tlinear-equation', 1); MathExamVideoStudio.show('tlinear-equation', 'move-letters-4'); });
    await page.locator('#replay-motion').click();
    await page.waitForFunction(() => Number(document.querySelector('.motion-diagram').dataset.progress) > .05);
    assert.match(await page.locator('#play').innerText(), /Пауза/, 'A single replay exposes its pause control');
    await page.locator('#play').click();
    const paused = await page.locator('.motion-diagram').getAttribute('data-progress');
    await page.waitForTimeout(180);
    assert.equal(await page.locator('.motion-diagram').getAttribute('data-progress'), paused, 'Pause freezes an individually replayed animation');
    assert.equal(await page.locator('#play-status').innerText(), 'Пауза');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>{MathExamVideoStudio.prepare('tgrade7-g-angle-bisector',1);});
    await page.locator('#replay-motion').click();
    assert.equal(await page.locator('.step-panel .motion-diagram').getAttribute('data-progress'),'1','Reduced motion presents a complete readable construction');
    assert.equal(await page.locator('#retained-diagram svg').count(),1,'Original drawing stays alongside the worked record');
    await page.emulateMedia({reducedMotion:'no-preference'});
    report.reader = { topics: topics.length, width: 390, keyboardNavigation: true, midMotionFit: true, singleReplayPauses: true };
    await context.close();
    if (!process.argv.includes('--skip-media')) {
      const ledger=JSON.parse(await fs.readFile(path.join(ROOT,'video-lessons/grade7-next-media.json'),'utf8'));
      assert.equal(ledger.clips.length,30,'Fifteen explanation/tutorial pairs are shipped');
      assert.equal(new Set(ledger.clips.map(clip=>clip.file)).size,30,'Published files have unique identities');
      const pre7Ledger=JSON.parse(await fs.readFile(path.join(ROOT,'video-lessons/pre7-media.json'),'utf8'));
      assert.equal(pre7Ledger.clips.length,36,'Eighteen foundation explanation/tutorial pairs are shipped');
      assert.equal(new Set(pre7Ledger.clips.map(clip=>clip.file)).size,36);
      const geometryLedger=JSON.parse(await fs.readFile(path.join(ROOT,'video-lessons/geometry-core-media.json'),'utf8'));
      assert.equal(geometryLedger.clips.length,40,'Twenty elementary geometry explanation/tutorial pairs are shipped');
      assert.equal(new Set(geometryLedger.clips.map(clip=>clip.file)).size,40);
      const allClips=[...ledger.clips,...pre7Ledger.clips,...geometryLedger.clips];

      for (const task of [...topics, ...topics.map(id => 'using-' + id), 'homework-help']) {
        const file = path.join(ROOT, 'video-lessons/media', task + '.mp4');
        const meta = JSON.parse((await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file])).stdout);
        assert.equal(meta.streams.filter(s => s.codec_type === 'audio').length, 0, task + ': no audio stream, including clicks');
        const streams = meta.streams.filter(s => s.codec_type === 'video');
        assert.equal(streams.length, 1); assert.equal(streams[0].codec_name, 'h264');
        assert.equal(streams[0].width, 1280); assert.equal(streams[0].height, 720);
        if(task.includes('grade7-')||task.includes('pre7-')){const record=allClips.find(clip=>clip.file===task+'.mp4');assert.ok(record,'New MP4 is listed in the checked media ledger');const bytes=await fs.readFile(file);assert.equal(bytes.length,record.bytes);assert.equal(hash(bytes),record.sha256);assert.equal(record.audioStreams,0);assert.equal(Number(meta.format.duration),record.durationSeconds);}
        const motion = firstMotions.get(task), frames = [];
        if (motion) for (const progress of [.15, .5, .85]) {
          const frame = (await run('ffmpeg', ['-v', 'error', '-ss', String(motion.elapsed + motion.duration * progress), '-i', file,
            '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], { encoding: 'buffer', maxBuffer: 4 * 1024 * 1024 })).stdout;
          assert.ok(frame.length > 1000); frames.push(hash(frame));
        }
        if (motion) assert.equal(new Set(frames).size, 3, task + ': stored MP4 includes real intra-step movement');
        report.media.push({ task, audioStreams: 0, width: streams[0].width, height: streams[0].height,
          duration: Number(meta.format.duration), intraStepFrames: frames.length, motionScene: motion?.id });
      }
    }
    assert.deepEqual(report.layoutErrors, [], 'Every final and intermediate frame fits without clipped steps');
    assert.deepEqual(report.errors, []); assert.deepEqual(report.external, []); assert.deepEqual(report.writes, []);
    assert.equal(report.journeys.length, topics.length * 6); assert.equal(report.pixels.length, topics.length * 2);
    report.passed = true;
    console.log('GRADE7_MOTION_BROWSER_OK: ' + report.journeys.length + ' preset/format journeys; ' + topics.length + ' animated topics; retained steps; 390px reader; ' + report.media.length + ' silent MP4s.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    if (keep) await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    else await fs.rm(output, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
