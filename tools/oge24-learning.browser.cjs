'use strict';
if (!process.env.CI) throw new Error('Run OGE24 browser acceptance only in cloud CI.');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/oge24-learning');
const MIME = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const read = (page, code) => page.evaluate(expression => window.eval(expression), code);
const card = (page, i) => page.locator(`button[onclick="pickCard({type:'s',i:${i}})"]`);
async function fit(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), label + ': document fits');
  const bad = await page.locator('.givens,.pool .card,.chain .citem,.diag,.proof-learning-result,.proof-learning-result button,.proof-resume-note').evaluateAll(nodes => nodes.filter(n => n.getClientRects().length).map(n => {
    const r = n.getBoundingClientRect();
    return {left:r.left,right:r.right,text:n.textContent.slice(0,80)};
  }).filter(r => r.left < -1 || r.right > document.documentElement.clientWidth + 1));
  assert.deepEqual(bad, [], label + ': proof controls fit');
}
async function snap(page, width, state) {
  await fit(page, state + '/' + width);
  await page.screenshot({path:path.join(OUT, `${width}-${state}.png`),fullPage:true});
}
async function chooseJustification(page) {
  const index = await read(page, 'ST.justPool.findIndex(x=>x.ok)');
  await page.locator(`button[onclick="pickJust(${index})"]`).click();
}

(async () => {
  fs.mkdirSync(OUT, {recursive:true});
  const server = http.createServer((req, res) => {
    const filename = path.resolve(ROOT, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!filename.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(filename, (error, bytes) => {
      if (error) { res.writeHead(404).end(); return; }
      res.writeHead(200, {'Content-Type':MIME[path.extname(filename)] || 'application/octet-stream'});res.end(bytes);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const errors = [], coverage = [];
  let browser;
  try {
    browser = await chromium.launch({headless:true});
    for (const width of [320,390,1280]) {
      const context = await browser.newContext({viewport:{width,height:920},reducedMotion:'reduce'});
      await context.addInitScript(() => { Math.random=()=>0.999; });
      const page = await context.newPage();page.on('pageerror', error => errors.push({width,message:error.message}));
      await page.goto(base + '/trainers/oge-task24-proofs.html');
      await page.locator('html[data-oge-course-proof="ready"]').waitFor();
      await read(page,"ST={mode:'justify',queue:['t2'],qi:0,results:[]};loadTask();");
      await snap(page,width,'initial');
      await card(page,2).focus();await page.keyboard.press('Space');
      assert.equal(await read(page,'ST.awaitJust'),2);
      await chooseJustification(page);
      assert.deepEqual(await read(page,'ST.order'),[2]);
      assert.equal(await read(page,'ST.err'),0);
      await page.locator('.chain .citem[data-proof-step="2"] .ocp-step-reason').waitFor();
      assert.match(await page.locator('.chain .citem').innerText(),/вертикальные/);
      await snap(page,width,'independent-premise');
      for(const i of[0,1]){await card(page,i).click();await chooseJustification(page);}
      await card(page,3).click();await chooseJustification(page);await card(page,4).click();
      assert.deepEqual(await read(page,'ST.order'),[2,0,1,3,4]);
      assert.equal(await page.locator('.proof-learning-result').getAttribute('data-proof-outcome'),'independent');
      await snap(page,width,'independent-result');

      // A true final claim is not yet justified by one of two premises.
      await read(page,"startStudy('t5')");await card(page,1).click();await card(page,2).click();
      assert.deepEqual(await read(page,'ST.order'),[1]);assert.equal(await read(page,'ST.err'),0);
      assert.match(await page.locator('.diag').innerText(),/ещё не хватает оснований/);
      await snap(page,width,'missing-ground');
      await page.getByRole('button',{name:'Показать, чего не хватает',exact:true}).click();
      const diagnosis=await page.locator('.diag').innerText();
      assert.match(diagnosis,/биссектрисе угла A/);assert.doesNotMatch(diagnosis,/расстояния до AD, AB и BC равны между собой/);
      assert.equal(await read(page,'ST.helpUsed'),true);
      await card(page,0).click();await card(page,2).click();
      assert.equal(await page.locator('.proof-learning-result').getAttribute('data-proof-outcome'),'helped');

      // Full reload must preserve the actual order, writing and used help.
      await read(page,"startStudy('t14')");await card(page,1).click();
      const writing=page.locator('.ocp-writing');await writing.locator(':scope>summary').click();
      await writing.locator('textarea').fill('JA = JB — радиусы. Затем сравню IA и IB.');
      await writing.locator(':scope>summary').click();await page.locator('#courseHintToggle').click();
      const attemptId=await read(page,'ST.attemptId');
      await page.reload();await page.locator('.proof-resume-note').waitFor();
      assert.equal(await read(page,'curTask().id'),'t14');assert.deepEqual(await read(page,'ST.order'),[1]);
      assert.equal(await read(page,'ST.attemptId'),attemptId);assert.equal(await read(page,'ST.helpUsed'),true);
      assert.equal(await page.locator('.ocp-writing textarea').inputValue(),'JA = JB — радиусы. Затем сравню IA и IB.');
      assert.equal(await page.locator('#courseHintPanel').isVisible(),true);
      await page.locator('#courseHintToggle').click();await snap(page,width,'restored');
      for(const i of[0,2,3])await card(page,i).click();
      assert.equal(await page.locator('.proof-learning-result').getAttribute('data-proof-outcome'),'helped');
      await snap(page,width,'helped-result');
      const expectedNext=await read(page,'proofNextChoice().id');
      await page.locator('.proof-learning-result').getByRole('button',{name:'Другое доказательство без подсказки →',exact:true}).click();
      assert.equal(await read(page,'curTask().id'),expectedNext);assert.notEqual(expectedNext,'t14');
      assert.equal(await read(page,'ST.fresh'),true);assert.equal(await read(page,'ST.helpUsed'),false);

      // The finite bank is reported honestly after every condition was seen.
      await read(page,"for(const task of TASKS){startStudy(task.id);surrender();}");
      assert.equal(await read(page,'proofNextChoice().fresh'),false);
      assert.match(await page.locator('.proof-learning-result').innerText(),/Все 20 условий уже встречались/);
      await snap(page,width,'familiar-repeat');
      coverage.push({width,orders:[2,0,1,3,4],justification:true,missingGround:true,reload:true,help:true,freshProof:true,familiarRepeat:true});
      await context.close();
    }

    const shared = await browser.newPage({viewport:{width:390,height:920}});
    shared.on('pageerror',error=>errors.push({shared:true,message:error.message}));
    await shared.goto(base+'/trainers/oge-task24-proofs.html?board=1');
    await shared.locator('html[data-oge-part2-board="ready"]').waitFor();
    await shared.locator('#oge-part2-type').selectOption('t2');
    for(const i of[2,1])await shared.locator(`[data-board-action="card:s:${i}"]`).click();
    const before=await shared.evaluate(()=>({snapshot:getBoardTrainerState(),keys:Object.keys(localStorage),order:window.eval('ST.order')}));
    await shared.evaluate(snapshot=>applyBoardTrainerState(snapshot),before.snapshot);
    assert.deepEqual(await read(shared,'ST.order'),[2,1]);
    assert.deepEqual(await shared.evaluate(()=>getBoardTrainerState()),before.snapshot);
    assert.deepEqual(await shared.evaluate(()=>Object.keys(localStorage)),before.keys);
    assert.equal(before.keys.length,0);
    for(const i of[0,3,4])await shared.locator(`[data-board-action="card:s:${i}"]`).click();
    assert.equal(await read(shared,'ST.solvedNow'),true);
    assert.equal(await shared.evaluate(()=>localStorage.length),0);
    await snap(shared,390,'shared-replay');await shared.close();
    assert.deepEqual(errors,[]);
    console.log('OGE24_LEARNING_BROWSER_OK: 320/390/1280, alternative argument + reasons, missing grounds, help, exact resume, fresh/familiar practice and schema-1 shared replay');
  } finally {
    if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
    fs.writeFileSync(path.join(OUT,'coverage.json'),JSON.stringify({coverage,errors},null,2));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
