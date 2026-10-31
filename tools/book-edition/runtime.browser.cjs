'use strict';
// This is dependency/isolation evidence, not a claim that all learner tasks pass.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const prefix = '/book/oge/2026-10-31/v1/';
const aliases = '/b/oge26-1/';
const manifestPath=path.join(root,prefix,'manifest.json');
const manifestBytes=fs.readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);
const manifestHash=crypto.createHash('sha256').update(manifestBytes).digest('hex');
const out = path.resolve(process.env.BOOK_EDITION_ARTIFACTS || path.join(root, 'artifacts/book-edition'));
const report = { edition: manifest.edition, manifestSha256:manifestHash, scope: 'fixed aliases, runtime dependency requests, browser-local storage isolation; full learner audit separate', complete: false, pages: [], failures: [], isolation: [] };
fs.mkdirSync(out, {recursive:true});
function save() { fs.writeFileSync(path.join(out, 'runtime.json'), JSON.stringify(report, null, 2)); }
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/__book-test-public') { res.setHeader('Content-Type','text/html'); res.end('<!doctype html><title>Isolated public-storage test origin</title>'); return; }
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
async function ready(page, url) {
  await page.goto(url, {waitUntil:'load'});
  await page.waitForFunction(() => !!window.MathExamBookEdition && !!document.querySelector('.book-edition-note'));
  // The existing standalone enhancer waits for two external scripts. Observe
  // their arrival rather than substituting a generic fixed delay.
  if (await page.locator('script[src*="learning-loader.js"]').count()) {
    await page.waitForFunction(() => !!window.MathExamBasicsHelp);
    await page.waitForFunction(() => [...document.scripts].some(s => /basics-standalone\.js/.test(s.src)));
  }
}
async function isolation(browser, origin) {
  const context = await browser.newContext({viewport:{width:1280,height:900}});
  const networkErrors=[];
  await context.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin===origin&&(u.pathname.startsWith(prefix)||u.pathname.startsWith(aliases)||u.pathname==='/__book-test-public'))return route.continue();
    networkErrors.push(u.origin+u.pathname);return route.abort();
  });
  const publicPage = await context.newPage();
  await publicPage.goto(origin + '/__book-test-public');
  await publicPage.evaluate(() => { localStorage.setItem('public-sentinel','keep-public'); localStorage.setItem('mathExamBasics.guidedDivision.v1','public-original'); });
  const page = await context.newPage();
  const url = origin + prefix + 'trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html';
  await ready(page, url);
  await page.waitForFunction(() => !!window.__divisionGuidedDebug);
  assert.equal(await page.evaluate(() => localStorage.getItem('public-sentinel')), null);
  assert.equal(await page.locator('#problem').innerText(), '48 : 2');
  await page.locator('#answer').fill('4');
  await page.locator('#primary').click();
  assert.equal(await page.evaluate(() => window.__divisionGuidedDebug.state().sessions.start.step), 1);
  await page.reload();
  await page.waitForFunction(() => !!window.__divisionGuidedDebug);
  assert.equal(await page.evaluate(() => window.__divisionGuidedDebug.state().sessions.start.step), 1);
  const raw = await publicPage.evaluate(p => ({publicValue:localStorage.getItem('mathExamBasics.guidedDivision.v1'),bookValue:JSON.parse(localStorage.getItem(p + 'mathExamBasics.guidedDivision.v1')),sentinel:localStorage.getItem('public-sentinel')}), manifest.storageNamespace);
  assert.equal(raw.publicValue, 'public-original');
  assert.equal(raw.sentinel, 'keep-public');
  assert.equal(raw.bookValue.sessions.start.step, 1);
  report.isolation.push({test:'real guided-division step and reload',pass:true,publicResultUnchanged:true});

  // Scope all Storage entry points used by existing trainers, including clear.
  const storage = await page.evaluate(() => {
    localStorage.setItem('probe-a', 'one'); localStorage['probe-b'] = 'two';
    Object.defineProperty(localStorage,'probe-c',{value:'three',configurable:true,enumerable:true});
    sessionStorage.setItem('probe-session','retained');
    const before = {keys:Object.keys(localStorage),values:[localStorage.getItem('probe-a'),localStorage['probe-b'],localStorage['probe-c']],session:sessionStorage.getItem('probe-session')};
    delete localStorage['probe-b']; localStorage.removeItem('probe-c');
    return {before,deleted:localStorage.getItem('probe-b'),removed:localStorage.getItem('probe-c')};
  });
  assert.deepEqual(storage.before.values,['one','two','three']);
  assert(storage.before.keys.includes('probe-a') && !storage.before.keys.includes('public-sentinel'));
  assert.equal(storage.deleted,null); assert.equal(storage.removed,null);
  await page.reload(); await page.waitForFunction(() => !!window.MathExamBookEdition);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('probe-session')),'retained');
  report.isolation.push({test:'methods, named properties, enumeration, deletion, session reload',pass:true});

  const other = await context.newPage();
  await ready(other, origin + prefix);
  await page.evaluate(() => { window.bookEvents=[]; window.addEventListener('storage', e => window.bookEvents.push({key:e.key,newValue:e.newValue,scoped:e.storageArea===localStorage})); });
  await publicPage.evaluate(() => localStorage.setItem('public-sentinel','public-updated'));
  await other.evaluate(() => localStorage.setItem('cross-tab-proof','shared-book'));
  await page.waitForFunction(() => window.bookEvents.some(e=>e.key==='cross-tab-proof'));
  const events=await page.evaluate(()=>window.bookEvents);
  assert(!events.some(e=>e.key==='public-sentinel'));
  assert(events.find(e=>e.key==='cross-tab-proof').scoped);
  assert.equal(await page.evaluate(()=>localStorage.getItem('cross-tab-proof')),'shared-book');
  await other.evaluate(()=>localStorage.clear());
  assert.equal(await publicPage.evaluate(()=>localStorage.getItem('public-sentinel')),'public-updated');
  assert.equal(await publicPage.evaluate(()=>localStorage.getItem('mathExamBasics.guidedDivision.v1')),'public-original');
  assert.equal(await other.evaluate(()=>localStorage.length),0);
  report.isolation.push({test:'cross-tab key translation, public-event filtering, scoped clear',pass:true});

  const alias = manifest.entries.find(r=>r.sourceUrl.endsWith('/long-division-from-simple-to-decimals.html'));
  await ready(other, origin + new URL(alias.bookUrl).pathname + '?book-keep=1#zero');
  assert.equal(new URL(other.url()).search,'?book-keep=1');
  assert.equal(new URL(other.url()).hash,'#zero');
  await other.waitForFunction(()=>window.__divisionGuidedDebug?.state().active==='zero');
  report.isolation.push({test:'short redirect preserves query/hash and selects correct exercise',pass:true});
  const inequality=manifest.entries.find(r=>r.sourceUrl.endsWith('/oge-task13-inequalities.html'));
  await ready(other,origin+new URL(inequality.bookUrl).pathname+'?book-keep=2#book-fragment');
  assert.equal(new URL(other.url()).pathname,prefix+'trainers/oge13-inequalities-series.html');
  assert.equal(new URL(other.url()).search,'?book-keep=2');
  assert.equal(new URL(other.url()).hash,'#book-fragment');
  report.isolation.push({test:'two-stage inequality alias preserves query and fragment',pass:true});

  // Dynamic links must be routed using the final inventory, including output
  // created after DOMContentLoaded; an external citation remains visibly marked.
  const links=await other.evaluate(async () => {
    const local=document.createElement('a');local.href='/trainers/task19-trainer.html';local.textContent='19';
    const external=document.createElement('a');external.href='https://fipi.ru/oge';external.textContent='ФИПИ';
    const missing=document.createElement('a');missing.href='../not-a-book-page.html';missing.textContent='outside';
    document.body.append(local,external,missing);
    await new Promise(resolve=>requestAnimationFrame(resolve));
    return {local:local.getAttribute('href'),outside:external.hasAttribute('data-book-exit'),missing:missing.href,missingMarked:missing.hasAttribute('data-book-exit')};
  });
  assert.equal(links.local,prefix+'trainers/task19-trainer.html');
  assert.equal(links.outside,true);assert.equal(links.missingMarked,true);
  assert.equal(links.missing,'https://mathexam.space/not-a-book-page.html');
  report.isolation.push({test:'dynamic included links and visibly marked outside links',pass:true});
  await ready(other,origin+prefix+'trainers/oge-basics/fraction-meaning.html?learning=1');
  assert.equal(await other.evaluate(()=>window.MathExamRemediationManaged),false);
  assert.equal(await other.locator('#learning-remediation-root').count(),0);
  report.isolation.push({test:'managed-query input stays in independent frozen practice',pass:true});
  await publicPage.evaluate(p=>{
    window.bookFrameMessages=[];
    const frame=document.createElement('iframe');frame.id='book-frame';frame.src=p;document.body.append(frame);
    window.addEventListener('message',e=>{if(e.source===frame.contentWindow)window.bookFrameMessages.push(e.data);});
  },origin+prefix+'trainers/oge-1-5-trainers/practice-1-5-roads-grid.html');
  await publicPage.locator('#book-frame').waitFor();
  const frame=await publicPage.locator('#book-frame').contentFrame();
  await frame.locator('.book-edition-note').waitFor();
  const validation=await frame.locator('html').evaluate(()=>({ok:validateBoardTrainerState(getBoardTrainerState()).ok,framed:parent!==window}));
  assert.deepEqual(validation,{ok:true,framed:true});
  assert.deepEqual(await publicPage.evaluate(()=>window.bookFrameMessages),[]);
  report.isolation.push({test:'roads-grid local validator works in iframe without board messaging',pass:true});
  assert.deepEqual(networkErrors,[]);
  await context.close();
}

async function references(browser, origin) {
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const failures=[];
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin&&url.pathname.startsWith(prefix))return route.continue();
    failures.push('Reference request escaped edition: '+url.origin+url.pathname);return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>failures.push(e.message));
  page.on('response',r=>{if(r.status()>=400)failures.push('HTTP '+r.status()+' '+r.url());});
  await ready(page,origin+prefix+'trainers/task19-trainer.html');
  const excerpts=await page.evaluate(async()=>{
    const id=Object.keys(Task19TextbookData.cards).find(id=>Task19TextbookData.cards[id].includes('parallel_third'));
    const host=document.createElement('div');document.body.append(host);Task19TextbookReference.mount(host,{id});
    host.querySelectorAll('details').forEach(n=>n.open=true);
    const images=[...host.querySelectorAll('img')];images.forEach(i=>i.loading='eager');
    await Promise.all(images.map(i=>i.decode()));
    return images.map(i=>({src:new URL(i.src).pathname,width:i.naturalWidth,height:i.naturalHeight}));
  });
  assert.equal(excerpts.length,2,'Both textbook excerpts remain accepted by the relocated narrow allowlist');
  assert(excerpts.every(i=>i.src.startsWith(prefix)&&i.width>0&&i.height>0));
  report.isolation.push({test:'frozen reference excerpts and preserved image allowlist',pass:true,images:excerpts});
  await ready(page,origin+prefix+'trainers/oge-task10-probability.html');
  const sheet=await page.evaluate(async()=>{
    const host=document.createElement('div');document.body.append(host);
    OgeCourseReference.sheetCards(host,[],{pages:[3,4,5,6]});
    host.querySelectorAll('details').forEach(n=>n.open=true);
    const images=[...host.querySelectorAll('img')];images.forEach(i=>i.loading='eager');
    await Promise.all(images.map(i=>i.decode()));
    await new Promise(resolve=>requestAnimationFrame(resolve));
    return {images:images.map(i=>({src:new URL(i.src).pathname,width:i.naturalWidth})),pdf:host.querySelector('a[href$="source-demo-2027.pdf"]')?.getAttribute('href')};
  });
  assert.equal(sheet.images.length,4);assert(sheet.images.every(i=>i.src.startsWith(prefix)&&i.width>0));
  assert.equal(sheet.pdf,prefix+'trainers/task19-reference/source-demo-2027.pdf');
  assert.equal((await context.request.get(origin+sheet.pdf)).status(),200);
  assert.deepEqual(failures,[]);
  report.isolation.push({test:'computed FIPI sheet images and local PDF link',pass:true,images:sheet.images});
  await context.close();
}

(async () => {
  let browser;
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const origin='http://127.0.0.1:'+server.address().port;
    browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
    for(const width of (process.env.BOOK_ISOLATION_ONLY ? [] : [320,1280])) {
      const context=await browser.newContext({viewport:{width,height:900}});
      const page=await context.newPage();
      let current;
      page.on('pageerror',e=>{if(current)current.errors.push(e.message);});
      page.on('response',response=>{if(current&&response.status()>=400)current.errors.push('HTTP '+response.status()+' '+new URL(response.url()).pathname);});
      await context.route('**/*',route=>{
        const url=new URL(route.request().url());
        if(url.protocol==='data:'||url.protocol==='blob:')return route.continue();
        if(url.origin===origin&&(url.pathname.startsWith(prefix)||url.pathname.startsWith(aliases))) {
          if(current)current.requests.push(url.pathname);
          return route.continue();
        }
        if(current)current.errors.push('Request escaped edition: '+url.origin+url.pathname);
        return route.abort();
      });
      for(const entry of manifest.entries) {
        current={id:entry.id,sourceUrl:entry.sourceUrl,width,requests:[],errors:[]};
        try {
          await ready(page,origin+new URL(entry.bookUrl).pathname);
          assert(new URL(page.url()).pathname.startsWith(prefix));
          assert.equal(await page.evaluate(()=>window.MathExamBookEdition.edition),manifest.edition);
          current.finalPath=new URL(page.url()).pathname;
          current.title=await page.title();
          current.storagePrefix=await page.evaluate(()=>window.MathExamBookEdition.storagePrefix);
          current.horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
          current.complete=true;
        } catch(error) {current.errors.push(error.message);current.complete=false;}
        current.requests=[...new Set(current.requests)].sort();
        report.pages.push(current);save();
      }
      await context.close();
    }
    const bad=report.pages.filter(p=>p.errors.length||!p.complete);
    assert.equal(bad.length,0,JSON.stringify(bad.map(p=>({id:p.id,width:p.width,errors:p.errors})),null,2));
    await isolation(browser,origin);
    await references(browser,origin);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(manifestPath)).digest('hex'),manifestHash,'Frozen package must remain unchanged throughout this run');
    report.complete=true;
    console.log('BOOK_EDITION_RUNTIME_OK: '+report.pages.length+' entry/viewport checks; '+report.isolation.length+' storage/alias/navigation checks. Learner-scenario results remain separate.');
  } catch(error) {report.failures.push(error.stack);console.error(error);process.exitCode=1;}
  finally {save();if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})();
