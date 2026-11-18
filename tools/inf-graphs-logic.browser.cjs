const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');

async function main() {
  const root = path.resolve(__dirname,'..');
  const server = http.createServer((req,res) => {
    const pathname = new URL(req.url,'http://localhost').pathname;
    const file = path.join(root,pathname.endsWith('/') ? pathname+'index.html' : pathname);
    if (!file.startsWith(root+path.sep) || !fs.existsSync(file)) {res.writeHead(404).end();return;}
    const types={'.js':'application/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2'};
    res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/trainers/';
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:320,height:740}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // The optional site navigator and fonts are intentionally unavailable during autonomy checks.
    await page.route('**/*',route => route.request().url().startsWith(url) ? route.continue() : route.abort());
    const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),await page.url());
    await page.goto(url+'ege-informatics-task1-graphs-trainer.html');
    await noOverflow();
    assert.equal(await page.locator('.road-grid tbody tr').first().locator('td').nth(1).textContent(),'5');
    await page.locator('#answerInput').fill('99');await page.locator('#answerInput').press('Enter');
    assert.match(await page.locator('.answer-zone [role=status]').textContent(),/не совпало/);
    await page.locator('#answerInput').fill('9,0');await page.locator('#answerInput').press('Enter');
    assert.equal(await page.locator('.answer-zone [role=status]').textContent(),'Верно.');
    await page.locator('#warmup > summary').click();
    await page.locator('#warm-answer').fill('20');await page.locator('#warm-answer').press('Enter');
    assert.match(await page.locator('#warm-status').textContent(),/Проверьте/);
    await page.locator('#warmup details summary').click();
    await page.locator('#warm-answer').fill('1');await page.locator('#warm-answer').press('Enter');
    await page.reload();
    assert.equal(await page.locator('#warmup').getAttribute('open'),'');
    assert.match(await page.locator('label[for="warm-answer"]').textContent(),/километров/);
    await page.locator('#warm-answer').fill('4');await page.locator('#warm-answer').press('Enter');
    assert.match(await page.locator('#warmup [role=status]').textContent(),/Оба шага/);
    await page.locator('#warm-new').click();assert.equal(await page.locator('#warm-answer').count(),1);
    for (const mini of [false,true]) {
      await page.goto(url+'ege-informatics-task15-logic-operations'+(mini?'-mini':'')+'.html');
      await page.locator('[data-mode=practice]').click();
      await noOverflow();
      await page.locator('.stepHint summary').click();
      await page.locator(mini?'[data-opt-idx]':'[data-pick]').first().click();
      await page.reload();
      assert.ok(await page.locator('.exFeedback').count());
      await page.locator('[data-mode=quiz]').click();
      if (!mini) {await page.locator('[data-action=quiz-start]').click(); assert.ok(await page.locator('[data-action=quiz-next]').isDisabled());}
      const prompt=await page.locator('.exPrompt').first().textContent();
      await page.reload();assert.equal(await page.locator('.exPrompt').first().textContent(),prompt);
      if(!mini) assert.ok(await page.evaluate(()=>validateLogicOperationsTrainer().ok));
    }
    await page.goto(url+'logic-trainer/');
    await page.locator('#root a').first().waitFor();
    await page.goto(url+'logic-trainer/#/diagnostic');
    await page.locator('#root button').first().waitFor();
    assert.match(await page.locator('#root').textContent(),/диагностик/i);
    await page.goto(url+'fipi-ege-informatics-task1-report.html');
    assert.ok(await page.locator('img').evaluateAll(imgs=>imgs.length>200&&imgs.every(img=>img.complete&&img.naturalWidth>0)));
    assert.deepEqual(errors,[]);
    console.log('PASS: Chromium 320px, graph wrong/correct and two-step restore, new problem, both logic quizzes restored offline, diagnostic and embedded June report figures.');
  } finally {
    if(browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{ console.error(error); process.exitCode=1; });
