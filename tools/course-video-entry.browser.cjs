'use strict';
// Public authored assets only, served on loopback. Fresh browser contexts never
// contact production, pupil accounts, the learning API, or speech services.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const ROOT = path.resolve(__dirname, '..'), run = promisify(execFile);
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || path.join(ROOT, 'video-worker/node_modules');
  ({ chromium } = createRequire(path.join(modules, 'package.json'))('playwright'));
}
const routes = {
  'negative-numbers': '/trainers/oge-basics/negative-add-subtract.html',
  fractions: '/trainers/oge-basics/fraction-common-denominator.html',
  brackets: '/ege-baza/path/index.html#lesson=equations-brackets',
  'linear-equation': '/ege-baza/path/index.html#lesson=equations-linear',
  proportions: '/trainers/oge-basics/percentages/proportion.html',
  percentages: '/trainers/oge-basics/percentages/percent-of-number-and-whole.html',
  'adjacent-angles': '/geometry-course/trainers/ch1-p6-t2-angle-problems.html'
};
const ids = Object.keys(routes), guides = require('../learning/topic-guides');
const practicePath = id => { const url = new URL(routes[id], 'https://mathexam.space');
  if (id !== 'adjacent-angles') url.searchParams.set('practice', '1');
  return url.pathname + url.search + url.hash; };
const report = { layouts: [], videos: [], practice: [], prints: [], errors: [], external: [], writes: [] };
const normalize = text => String(text).replace(/\s+/g, '').replace(/[−–]/g, '-');
async function mediaDiagnostics(page) {
  return page.locator('#video-player').evaluate(video => ({
    src: video.currentSrc || video.src, readyState: video.readyState, networkState: video.networkState,
    paused: video.paused, duration: video.duration, currentTime: video.currentTime,
    width: video.videoWidth, height: video.videoHeight,
    error: video.error ? { code: video.error.code, message: video.error.message } : null,
    status: document.querySelector('#video-status')?.textContent
  }));
}

async function main() {
  const output = process.env.COURSE_VIDEO_ENTRY_ARTIFACT_DIR || await fs.mkdtemp(path.join(os.tmpdir(), 'course-video-entry-'));
  await fs.mkdir(output, { recursive: true });
  const types = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript;charset=utf-8',
    '.css': 'text/css;charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (!['GET', 'HEAD'].includes(req.method)) { report.writes.push(req.method + ' ' + pathname); res.writeHead(405); return res.end(); }
      if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
      const allowed = ['/video-lessons/', '/ege-baza/', '/trainers/oge-basics/', '/geometry-course/trainers/'].some(prefix => pathname.startsWith(prefix)) ||
        ['/learning/topic-guides.js', '/learning/practice-entry.js', '/trainers/learning-bridge.js'].includes(pathname);
      const filename = path.resolve(ROOT, '.' + pathname), type = types[path.extname(pathname)];
      if (!allowed || !type || !filename.startsWith(ROOT + path.sep)) { res.writeHead(404); return res.end(); }
      const content = await fs.readFile(filename), range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
      const start = range ? Number(range[1]) : 0, end = range && range[2] ? Math.min(Number(range[2]), content.length - 1) : content.length - 1;
      if (start > end || start >= content.length) { res.writeHead(416); return res.end(); }
      res.writeHead(range ? 206 : 200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1, ...(range ? { 'Content-Range': `bytes ${start}-${end}/${content.length}` } : {}) });
      res.end(req.method === 'HEAD' ? undefined : content.subarray(start, end + 1));
    } catch (_) { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, chromiumSandbox: false,
      ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
    async function open(viewport = { width: 1440, height: 1000 }, expectedMediaError = false) {
      const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) { report.external.push(url.origin + url.pathname); return route.abort(); }
        return route.continue();
      });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => report.errors.push(error.message));
      page.on('console', message => {
        if (message.type() !== 'error') return;
        const expected = expectedMediaError && /\/video-lessons\/media\/[^/]+\.mp4/.test(message.location().url || '') && /Failed to load resource/.test(message.text());
        if (!expected) report.errors.push(message.text());
      });
      return { context, page };
    }
    const desktop = await open(), page = desktop.page;
    await page.goto(origin + '/video-lessons/cheatsheets.html');
    await page.locator('#video-player').waitFor();
    assert.equal(await page.locator('#topic-select').inputValue(), 'linear-equation');
    assert.equal(await page.locator('#topic-select option').count(), 7);
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const id of ids) {
        if (viewport.width === 390) await page.locator('#topic-select').selectOption(id);
        else await page.locator('#topics a[href="#' + id + '"]').click();
        await page.waitForFunction(id => document.querySelector('#video-player')?.src.includes('/' + id + '.mp4'), id);
        await page.evaluate(() => window.scrollTo(0, 0));
        const dimensions = await page.evaluate(() => {
          const rect = document.querySelector('#video-player').getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom, width: rect.width, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        assert.equal(dimensions.overflow, false, id + ': no horizontal overflow');
        assert.ok(dimensions.top >= 0 && dimensions.bottom <= viewport.height + 1 && dimensions.width > 200,
          id + ': the video is visible on the first screen');
        const player = await page.locator('#video-player').evaluate(video => ({ controls: video.controls, autoplay: video.autoplay, paused: video.paused, src: video.src }));
        assert.equal(player.controls, true); assert.equal(player.autoplay, false); assert.equal(player.paused, true, 'Changing topic stops the previous video');
        assert.equal(await page.locator('#video').getAttribute('href'), 'media/' + id + '.mp4?v=history-tap-20261005');
        assert.equal(await page.locator('#quick-trainer').getAttribute('href'), 'https://mathexam.space' + practicePath(id));
        assert.equal(await page.locator('#trainer').getAttribute('href'), 'https://mathexam.space' + practicePath(id));
        assert.equal(await page.locator('#quick-cabinet').isVisible(), id !== 'adjacent-angles');
        assert.deepEqual(await page.locator('#trainer-steps li').allTextContents(), guides.get(id).steps);
        report.layouts.push({ id, width: viewport.width, ...dimensions });
        if (viewport.width === 1440) {
          if (!report.codecSupport) {
            report.codecSupport = await page.locator('#video-player').evaluate(video => ({
              userAgent: navigator.userAgent,
              h264High31: video.canPlayType('video/mp4; codecs="avc1.64001F"'),
              aacLC: document.createElement('audio').canPlayType('audio/mp4; codecs="mp4a.40.2"'),
              combined: video.canPlayType('video/mp4; codecs="avc1.64001F, mp4a.40.2"')
            }));
            report.codecSupport.browser = browser.version();
            assert.ok(report.codecSupport.h264High31 && report.codecSupport.aacLC && report.codecSupport.combined,
              'The playback gate requires H.264 High 3.1 and AAC-LC support. Use a codec-capable Chrome executable; real playback remains required. ' + JSON.stringify(report.codecSupport));
          }
          await page.locator('#play-video').click();
          try {
            await page.waitForFunction(() => { const v = document.querySelector('#video-player');
              return v.error || (Number.isFinite(v.duration) && v.duration > 1 && v.currentTime > .15 && !v.paused); });
          } catch (error) {
            throw new Error(id + ': actual playback did not start. ' + JSON.stringify(await mediaDiagnostics(page)), { cause: error });
          }
          const playback = await mediaDiagnostics(page);
          assert.equal(playback.error, null, id + ': media decoder failure. ' + JSON.stringify(playback));
          assert.ok(Number.isFinite(playback.duration) && playback.duration > 1 && playback.currentTime > .15 && !playback.paused,
            id + ': actual playback must advance. ' + JSON.stringify(playback));
          assert.ok(playback.width > 0 && playback.height > 0, 'The MP4 decodes real video frames');
          report.videos.push({ id, ...playback });
          // Leave playback running so the next topic must stop it itself.
        }
      }
      if (viewport.width === 1440) {
        await page.locator('#play-video').click();
        assert.equal(await page.locator('#video-player').evaluate(video => video.paused), true);
      }
      await page.locator('#video-player').evaluate(video => video.pause());
      await page.evaluate(() => window.scrollTo(0, 0));
      if (process.env.COURSE_VIDEO_ENTRY_ARTIFACT_DIR) await page.screenshot({ path: path.join(output, 'video-entry-' + viewport.width + '.png'), fullPage: true });
    }
    await page.locator('#show-instructions').click();
    assert.equal(await page.locator('#practice-instructions').evaluate(node => node === document.activeElement), true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const id of ids) {
      await page.evaluate(id => { location.hash = id; }, id);
      await page.waitForFunction(id => document.querySelector('#topic-select').value === id, id);
      const pdf = path.join(output, id + '.pdf');
      await page.pdf({ path: pdf, format: 'A4', preferCSSPageSize: true, printBackground: true });
      const info = (await run('pdfinfo', [pdf])).stdout;
      assert.match(info, /Pages:\s+1\b/, id + ': exactly one printed page');
      assert.match(info, /Page size:[^\n]*\(A4\)/, id + ': A4 paper');
      // Preserve PDF drawing order so the two columns do not interleave words.
      const printed = normalize((await run('pdftotext', ['-raw', pdf, '-'])).stdout);
      const topic = await page.evaluate(id => MathExamCheatsheets[id], id);
      for (const expected of [topic.title, ...topic.example, topic.check, topic.practice.prompt, 'MathExam']) assert.ok(printed.includes(normalize(expected)), id + ': printed content retains ' + expected);
      assert.equal(printed.includes(normalize('Смотреть видео')), false, 'Video controls do not use the printed page');
      report.prints.push({ id, pages: 1, format: 'A4' });
    }
    await desktop.context.close();
    const failed = await open(undefined, true);
    await failed.context.route('**/video-lessons/media/*.mp4?*', route => route.fulfill({ status: 503, body: '' }));
    await failed.page.goto(origin + '/video-lessons/cheatsheets.html#fractions');
    await failed.page.waitForFunction(() => /не загрузилось|не получилось/i.test(document.querySelector('#video-status')?.textContent || ''));
    assert.equal(await failed.page.locator('#video').isVisible(), true, 'Direct MP4 fallback remains available on media failure');
    assert.match(await failed.page.locator('#interactive').getAttribute('href'), /studio\.html\?task=fractions/);
    await failed.context.close();

    for (const id of ids) {
      const normal = await open(), p = normal.page;
      await p.goto(origin + routes[id]);
      if (['negative-numbers', 'fractions', 'proportions', 'percentages'].includes(id)) {
        await p.locator('#view-home').waitFor(); assert.equal(await p.locator('#view-practice').isVisible(), false);
      } else if (id !== 'adjacent-angles') {
        await p.locator('[data-stage="0"][aria-current="step"]').waitFor(); assert.equal(await p.locator('#answer').count(), 0);
      } else await p.locator('#pool button').first().waitFor();
      await normal.context.close();
      const actual = await open(), q = actual.page;
      await q.goto(origin + practicePath(id));
      let input, check, feedback;
      if (['negative-numbers', 'fractions'].includes(id)) { input = q.locator('#practiceAnswer input, #practiceAnswer button').first(); check = '#checkTask'; feedback = '#practiceFeedback'; }
      else if (['proportions', 'percentages'].includes(id)) { input = q.locator('#p-q input').first(); check = '#p-check'; feedback = '#p-fb'; }
      else if (id !== 'adjacent-angles') { input = q.locator('#answer'); check = '#answerForm button'; feedback = '#feedback'; }
      else { input = q.locator('#pool button').first(); feedback = '#msg'; }
      await input.waitFor(); assert.equal(await input.isVisible(), true, id + ': the practice link opens an answer control directly');
      const before = await q.locator(feedback).innerText(), type = await input.getAttribute('type'), tag = await input.evaluate(node => node.tagName);
      if (type === 'radio') await input.check(); else if (tag === 'INPUT') await input.fill('999999999'); else await input.click();
      if (check) await q.locator(check).click();
      const response = (await q.locator(feedback).innerText()).trim();
      assert.ok(response.length); assert.notEqual(response, before.trim(), id + ': answering produces a real response');
      report.practice.push({ id, directAnswer: true, response: response.slice(0, 160) });
      await actual.context.close();
    }

    const saved = await open(), savedPage = saved.page;
    await savedPage.goto(origin + routes.brackets);
    for (const stage of [2, 3, 4]) {
      await savedPage.locator('[data-stage="' + stage + '"]').click();
      await savedPage.locator(stage === 4 ? '#note' : '#answer').fill(stage === 4 ? 'Моя сохранённая запись' : '317');
      const before = await savedPage.evaluate(() => PathCourse.state());
      await savedPage.goto(origin + practicePath('brackets'));
      await savedPage.locator('[data-stage="' + stage + '"][aria-current="step"]').waitFor();
      assert.deepEqual(await savedPage.evaluate(() => PathCourse.state()), before, 'Practice entry preserves the full saved task at stage ' + stage);
    }
    await saved.context.close();
    const helper = await fs.readFile(path.join(ROOT, 'learning/practice-entry.js'), 'utf8');
    for (const search of ['', '?practice=1&learning=1']) vm.runInNewContext(helper, {
      URLSearchParams,
      location: { search, pathname: '/ege-baza/path/index.html' },
      document: { querySelector() { assert.fail('Ordinary/managed entry must not navigate or touch saved trainer state'); }, addEventListener() { assert.fail('Ordinary/managed entry must not schedule navigation'); } }
    });
    assert.deepEqual(report.errors, []); assert.deepEqual(report.external, []); assert.deepEqual(report.writes, []);
    report.passed = true;
    console.log('COURSE_VIDEO_ENTRY_BROWSER_OK: seven real MP4s play, topic changes stop old playback, visible mobile/desktop player, fallback, seven A4 pages, seven direct interactive links, original entry and saved work preserved');
  } finally {
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    if (!process.env.COURSE_VIDEO_ENTRY_ARTIFACT_DIR) await fs.rm(output, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
