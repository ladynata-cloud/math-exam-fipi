'use strict';
// Run in CI. A paired control renders each same page without the new shell.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const pages = require('../assets/course-ui-pages.json');
const root = path.resolve(__dirname, '..');
const out = process.env.ARTIFACT_DIR;
assert(out, 'Set ARTIFACT_DIR for review screenshots');
fs.mkdirSync(out, {recursive:true});
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server = http.createServer((req,res)=>{
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://local').pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404).end(); }
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true});
  const results = [], failures = [];
  try {
    for (const width of [1280,320]) {
      for (const [file,family] of Object.entries(pages)) {
        const samples = [];
        for (const control of [true,false]) {
          const context = await browser.newContext({viewport:{width,height:900}});
          const page = await context.newPage(), errors = [];
          page.on('pageerror', e=>errors.push(e.message));
          await context.route('**/*', route=>{
            const url = new URL(route.request().url());
            if(url.origin!==origin) return route.abort();
            if(control && url.pathname==='/' + file) {
              const html = fs.readFileSync(path.join(root,file),'utf8')
                .replace('<link rel="stylesheet" href="/assets/course-ui.css?v=20261109-1">\n','')
                .replace(/ data-mx-course="[^"]+"/,'');
              return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
            }
            return route.continue();
          });
          try {
            await page.goto(origin + '/' + file,{waitUntil:'load'});
            await page.locator('h1').first().waitFor({state:'visible',timeout:15000});
            const sample = await page.evaluate(()=>({
              width:document.documentElement.clientWidth,
              scrollWidth:document.documentElement.scrollWidth,
              colour:getComputedStyle(document.body).backgroundColor,
              family:document.body.dataset.mxCourse,
              heading:document.querySelector('h1').innerText,
              styles:[...document.styleSheets].filter(s=>s.href?.includes('/course-ui.css')).map(s=>s.cssRules.length)
            }));
            sample.errors=errors.sort(); samples.push(sample);
            if(!control) {
              assert.equal(sample.family,family);
              assert.equal(sample.colour,'rgb(246, 247, 242)');
              assert.ok(sample.styles[0]>20,'Shared CSS parsed and loaded');
              assert.deepEqual(sample.errors,samples[0].errors,'No additional page errors');
              assert.ok(sample.scrollWidth<=Math.max(width,samples[0].scrollWidth)+1,
                `Horizontal overflow grew: ${samples[0].scrollWidth} -> ${sample.scrollWidth}`);
              await page.screenshot({path:path.join(out,file.replaceAll('/','-')+'-'+width+'.png')});
              if(file==='courses/index.html') {
                await page.getByText('Как учиться в любом курсе',{exact:true}).click();
                assert.equal(await page.locator('.mx-course-guide').getAttribute('open'),'');
                await page.screenshot({path:path.join(out,'learning-guide-'+width+'.png')});
              }
            }
          } catch(e) { failures.push({file,width,control,error:e.message}); }
          finally { await context.close(); }
        }
        results.push({file,width,samples});
      }
    }
  } finally {
    await browser.close(); server.close();
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,failures},null,2));
  }
  for(const failure of failures) console.error(JSON.stringify(failure));
  assert.equal(failures.length,0,'Course layout regressions');
  console.log('COURSE_UI_BROWSER_OK: 27 entrances × 2 widths, paired controls');
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
