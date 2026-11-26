'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const printedPages = [5,10,17,21,28,33,36,43,49,61,67,74,77,81,84,89,93,97,100,105,117,122,130,134,139,144,148,160,165,170,174,178,181,186,194,202,213,217,222,225,231,242,246];
const mime = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif'};
function serve(req, res) {
  const url = new URL(req.url, 'http://localhost');
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(404).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.setHeader('content-type', (mime[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8');
  fs.createReadStream(file).pipe(res);
}
async function checkDestination(tab, href) {
  const url = new URL(href);
  await tab.goto(href, {waitUntil:'domcontentloaded'});
  assert.equal(await tab.evaluate(() => location.hash), url.hash);
  if (url.pathname.includes('makarychev8')) {
    const [, lesson, index] = url.hash.split('/');
    await tab.waitForFunction(({lesson,index}) => {
      const data=window.MakarychevCourse?.lessons.find(l=>l.id===lesson), task=data?.tasks[Number(index)];
      return !!task && document.querySelector('#problem h2')?.textContent===task.title && !!document.querySelector('#problem form');
    }, {lesson,index});
    return;
  }
  if (url.pathname.includes('tyurin-statistics')) {
    await tab.waitForFunction(id => document.querySelector('#lesson')?.value===id && !!document.querySelector('#work > section'),url.hash.split('/')[1]);
    const start=tab.locator('#work [data-action=practice]');
    if(await start.count())await start.click();
    await tab.locator('#work form').waitFor();
    return;
  }
  await tab.waitForFunction(() => location.hash==='#lesson/v5f-chart-read' && !!document.querySelector('#answer-form') && !!document.querySelector('#model svg'));
}
(async () => {
  const server = http.createServer(serve);
  let browser;
  try {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    const origin=process.env.BOOK_ORIGIN || 'http://127.0.0.1:'+server.address().port;
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
    const context=await browser.newContext({viewport:{width:375,height:830}});
    const tab=await context.newPage(), personal=await context.newPage(), shared=await context.newPage();
    const errors=[];
    for(const p of [tab,personal,shared]){p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));}
    await tab.goto(origin+'/school/index.html#book/source-78');
    await tab.waitForSelector('#main .skill-row');
    const card=await tab.evaluate(()=>{
      const b=WorkshopCurriculum.books.find(x=>x.id==='source-78');
      return {status:b.status,pdf:b.source.sha256,sourcePages:b.source.pages,edition:b.source.year,
        overflow:document.documentElement.scrollWidth>innerWidth+1,
        rows:[...document.querySelectorAll('#main .skill-row')].map(row=>({
          label:row.querySelector('.eyebrow').textContent,title:row.querySelector('h3').textContent,focus:row.querySelector('h3 + p').textContent,
          personal:row.querySelector('a').href,room:row.querySelector('a:nth-of-type(2)').href
        }))};
    });
    assert.equal(card.pdf,'5d227e0d2da96576b400519c6c1499a87a9919c3d0191304a78e8ff5043f4613');assert.equal(card.sourcePages,291);
    assert.equal(card.edition,'2013');assert.equal(card.status,'Практика по 43 из 43 пунктов');assert.equal(card.rows.length,43);assert.equal(card.overflow,false);
    const registry=await tab.evaluate(async()=> (await(await fetch('/trainers/board-compat.json')).json()).trainers);
    const supplements=new Set([9,20,27,36,42,43]), mirrorIds=new Set();
    for(const [i,row] of card.rows.entries()){
      assert(row.label.endsWith('Пункт '+(i+1)+' · с. '+printedPages[i]),row.label);
      assert.equal(row.label.includes('Для тех, кто хочет знать больше'),supplements.has(i+1));
      assert(row.title.length>5&&row.focus.length>20);
      const link=new URL(row.room), destination=new URL(link.searchParams.get('trainer'),origin);
      assert.equal(link.pathname,'/trainers/trainer-board.html');
      const entry=registry.find(e=>'/'+e.file===destination.pathname);
      assert.equal(entry?.boardCompatibility,'board-mirror',destination.pathname);mirrorIds.add(entry.trainerId);
      for (const [page, href] of [[personal, row.personal], [shared, destination.href]]) {
        try {
          await checkDestination(page, href);
        } catch (cause) {
          throw new Error('Пункт ' + (i + 1) + ', ' + href + ': ' + cause.message, {cause});
        }
      }
      if (i === 41) {
        assert.equal(destination.hash, '#lesson/p51/5');
        assert.match(await personal.locator('#problem h2').innerText(), /Сравни две функции/);
      }
    }
    assert.deepEqual([...mirrorIds].sort(),['makarychev8','tyurin-statistics','vilenkin5']);
    assert.deepEqual(errors,[]);console.log('Макарычев 2013: checked 43 printed points, six supplements, all 43 individual and 43 registered board destinations, and mobile layout.');
  } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
