'use strict';
// PR #522: replay the reported source, then verify real navigation and geometry.
// Local public files only; no pupil accounts or production writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const oldSha = '267d0ab49f0c9a73b541aa540a1fe7d06fc98a66';
const output = process.env.ARTIFACT_DIR || '/tmp/public-home-regressions';
const evidence = { source: oldSha, reproduction: {}, layouts: [] };
const mime = { '.html':'text/html;charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json', '.mp4':'video/mp4' };
const historical = new Map(['lessons/index.html', 'assets/assistant/home-link.js', 'assets/assistant/navigator-widget.js'].map(file =>
  ['/' + file, execFileSync('git', ['show', oldSha + ':' + file], {cwd:root})]));
const server = http.createServer((req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) return res.writeHead(405).end();
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
    if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const bytes = fs.readFileSync(file), range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    const start = range ? +range[1] : 0, end = range && range[2] ? Math.min(+range[2], bytes.length - 1) : bytes.length - 1;
    if (start > end) return res.writeHead(416).end();
    res.writeHead(range ? 206 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream',
      'Content-Length':end-start+1, 'Accept-Ranges':'bytes', ...(range ? {'Content-Range':`bytes ${start}-${end}/${bytes.length}`} : {})});
    res.end(req.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1));
  } catch { res.writeHead(404).end(); }
});
(async () => {
  fs.mkdirSync(output, {recursive:true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  async function open(viewport, replay = false) {
    const context = await browser.newContext({viewport, serviceWorkers:'block'});
    await context.route('**/*', route => {
      const u = new URL(route.request().url());
      if (u.origin !== origin) return route.abort();
      const name = u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname;
      if (replay && historical.has(name)) return route.fulfill({contentType:mime[path.extname(name)], body:historical.get(name)});
      return route.continue();
    });
    const page = await context.newPage(); page.setDefaultTimeout(8000);
    return {context, page};
  }
  try {
    // Reproduce the literal target assertion on the reported source, then click
    // every historical link to distinguish markup from browsing-context behavior.
    const old = await open({width:1440, height:1000}, true), opened = [];
    old.context.on('page', page => opened.push(page));
    for (const selector of ['.showcase-header a.brand', '.showcase-nav a[href="/"]', '.showcase-footer a.brand']) {
      await old.page.goto(origin + '/lessons/');
      const link = old.page.locator(selector), target = await link.evaluate(a => a.target);
      assert.equal(target, '');
      assert.throws(() => assert.equal(target, '_self'), {code:'ERR_ASSERTION'});
      await link.click(); await old.page.waitForURL(origin + '/'); await old.page.waitForLoadState('load');
      assert.deepEqual(opened, []); assert.equal(old.context.pages().length, 1);
    }
    evidence.reproduction.home = {literalAssertionFailed:true, actualSameTab:true, links:3};
    async function sas(page) {
      await page.goto(origin + '/video-lessons/cheatsheets.html');
      await page.locator('#topics a[href="#grade7-g-core-sas"]').click();
      await page.waitForFunction(() => document.querySelector('#video-player').src.includes('/grade7-g-core-sas.mp4'));
      await page.evaluate(() => window.scrollTo(0, 0));
      return page.locator('#video-player').evaluate(v => { const r=v.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,width:r.width}; });
    }
    const desktop = {width:1440,height:1000};
    const fixed = await open(desktop);
    const originalBefore = await sas(old.page), originalAfter = await sas(fixed.page);
    function assertFixedFit(layout, height) {
      assert(layout.top >= 0 && layout.bottom <= height + 1 && layout.width > 200, 'fixed SAS video fits the first screen');
    }
    assertFixedFit(originalAfter, desktop.height);
    assert(originalBefore.bottom - originalAfter.bottom > 30, 'the original displacement is removed at 1440×1000');
    let viewport = desktop, before = originalBefore, after = originalAfter;
    if (before.bottom <= desktop.height + 1) {
      // Browser and font builds can place the same historical video a few pixels
      // higher. Keep the width and independently replay both versions at a real
      // viewport height between the two measured bottoms.
      viewport = {width:desktop.width,height:Math.floor((before.bottom + after.bottom) / 2)};
      await old.page.setViewportSize(viewport);
      await fixed.page.setViewportSize(viewport);
      before = await sas(old.page);
      after = await sas(fixed.page);
    }
    assert(before.bottom > viewport.height + 1, 'the reported old home bundle must reproduce first-screen overflow: ' + JSON.stringify({viewport,before}));
    assertFixedFit(after, viewport.height);
    assert(before.bottom - after.bottom > 30, 'the original displacement is removed in the overflow replay');
    evidence.reproduction.video = {viewport,before,after,desktop:{viewport:desktop,before:originalBefore,after:originalAfter}};
    await old.page.screenshot({path:path.join(output, 'sas-before-1440.png')});
    await fixed.page.screenshot({path:path.join(output, 'sas-after-1440.png')});
    await old.context.close();
    await fixed.context.close();
    const routes = ['/video-lessons/cheatsheets.html#grade7-g-core-sas', '/trainers/ege-t1-planimetry-trainer.html',
      '/trainers/geometry7-practice.html', '/ege-profil/trainers/stereo/trainer.html',
      '/trainers/inequalities-number-line.html', '/trainers/vilenkin6-percent/index.html'];
    for (const viewport of [{width:320,height:900},{width:390,height:844},{width:1280,height:900},{width:1440,height:1000}]) {
      const {context,page} = await open(viewport);
      try {
        for (const route of routes) {
          await page.goto(origin + route, {waitUntil:'load'});
          const home = page.locator('#mathexam-home-navigation');
          await home.waitFor();
          await page.evaluate(() => document.fonts.ready);
          await page.evaluate(() => window.scrollTo(0,0));
          // Compare authored visible media at identical scroll coordinates with
          // and without the added bar; restoring the same node touches no data.
          const layout = await page.evaluate(() => {
            const host = document.getElementById('mathexam-home-navigation'), parent=host.parentNode, next=host.nextSibling;
            const nodes = [...document.querySelectorAll('main svg,main canvas,main video,main iframe,#canvas,#trainerFrame')]
              .filter(n => {const r=n.getBoundingClientRect();return r.width>0 && r.height>0 && r.top<innerHeight && r.bottom>0;});
            const rect = n => {const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
            const withHome = nodes.map(rect);
            host.remove(); const withoutHome = nodes.map(rect); parent.insertBefore(host,next);
            return {withHome,withoutHome};
          });
          for (let i=0;i<layout.withHome.length;i++) for (const key of ['x','y','width','height'])
            assert(Math.abs(layout.withHome[i][key]-layout.withoutHome[i][key])<=1, route + ' home bar changes first-screen media ' + key + ': ' + JSON.stringify(layout));
          await home.locator('a').scrollIntoViewIfNeeded();
          const collisions = await page.evaluate(() => {
            const host=document.getElementById('mathexam-home-navigation'), h=host.getBoundingClientRect();
            return [...document.querySelectorAll('svg,canvas,video,iframe,button,input,select,[role="slider"]')].filter(n=>{
              const r=n.getBoundingClientRect(),s=getComputedStyle(n);
              return s.visibility!=='hidden' && s.display!=='none' && r.width>0 && r.height>0 &&
                Math.min(h.right,r.right)-Math.max(h.left,r.left)>1 && Math.min(h.bottom,r.bottom)-Math.max(h.top,r.top)>1;
            }).map(n=>n.tagName+'#'+n.id);
          });
          assert.deepEqual(collisions, [], route + ' home bar must not cover media or controls at '+viewport.width);
          await home.locator('a').click({trial:true});
          evidence.layouts.push({route,viewport,firstScreenMedia:layout.withHome.length,collisions});
        }
      } finally {await context.close();}
    }
    console.log('PUBLIC_HOME_REGRESSIONS_PASS', JSON.stringify(evidence));
  } finally {
    fs.writeFileSync(path.join(output,'regressions.json'),JSON.stringify(evidence,null,2)+'\n');
    await browser.close();await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
