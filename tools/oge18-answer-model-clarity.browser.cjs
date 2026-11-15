'use strict';

// This gate runs in GitHub Actions. It must not launch a local user browser.
if (!process.env.CI) throw new Error('OGE18 clarity browser acceptance runs in CI only.');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'artifacts/oge18-answer-model-clarity');
const ROUTE = '/trainers/oge-task18-grid.html';
const fixtures = [
  { name:'segments', id:91, family:'segCmp', expected:3, steps:2 },
  { name:'parallelogram', id:76, family:'areaPar', expected:21, steps:2 },
  { name:'circles', family:'circRatio', p:[1,16], expected:16, steps:3 },
  { name:'diagonal-radii', family:'circRatio', p:[2,5], expected:2.5, steps:3 },
];

async function selectTask(page, fixture) {
  const actual = await page.evaluate(f => window.eval(
    `(()=>{TR.task=${f.id != null ? `archTask(ARCHIVE.find(record=>record.id===${f.id}))` : `build(${JSON.stringify(f.family)},${JSON.stringify(f.p)},{})`};` +
    'TR.done=false;TR.shown=false;TR.hintUsed=false;TR.missed=false;drawTrain();' +
    'return {sub:TR.task.sub,answer:TR.task.ans,params:TR.task.p};})()'
  ), fixture);
  assert.equal(actual.sub, fixture.family);
  assert.equal(actual.answer, fixture.expected);
  await page.waitForFunction(() => !!document.querySelector('.figwrap[data-oge18-task-diagram] svg'));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return actual;
}

async function inspectLayout(page, tag) {
  const measurement = await page.evaluate(() => {
    const figure = document.querySelector('.figwrap[data-oge18-task-diagram]');
    const svg = figure.querySelector('svg');
    const frame = svg.getBoundingClientRect();
    const texts = [...svg.querySelectorAll('text')].filter(node => node.textContent.trim()).map(node => {
      const rect = node.getBoundingClientRect(), transform = node.getScreenCTM();
      return {
        text:node.textContent,
        size:parseFloat(getComputedStyle(node).fontSize) * Math.hypot(transform.a, transform.b),
        left:rect.left-frame.left, top:rect.top-frame.top, right:rect.right-frame.left, bottom:rect.bottom-frame.top,
      };
    });
    const stepFonts = [...document.querySelectorAll('#task18Steps .step')].map(node => ({
      size:parseFloat(getComputedStyle(node).fontSize), line:parseFloat(getComputedStyle(node).lineHeight),
    }));
    return {
      pageOverflow:document.documentElement.scrollWidth-innerWidth,
      figureOverflow:figure.scrollWidth-figure.clientWidth,
      svgWidth:frame.width, svgHeight:frame.height,
      texts, stepFonts,
      prompt:document.querySelector('label[for="ansIn"]').textContent,
      promptSize:parseFloat(getComputedStyle(document.querySelector('label[for="ansIn"]')).fontSize),
      conditionSize:parseFloat(getComputedStyle(document.querySelector('#main .task')).fontSize),
      sourceSize:parseFloat(getComputedStyle(document.querySelector('.oge18-source-note')).fontSize),
      foreignModelVisible:[...document.querySelectorAll('[data-geometry-model]')].some(node => node.getClientRects().length > 0),
    };
  });
  assert.ok(measurement.pageOverflow <= 1, `${tag}: page overflow ${measurement.pageOverflow}`);
  assert.ok(measurement.figureOverflow <= 1, `${tag}: main diagram does not require horizontal panning`);
  assert.equal(measurement.foreignModelVisible, false, `${tag}: foreign model is hidden`);
  assert.ok(measurement.promptSize >= 18, `${tag}: input question is readable`);
  assert.ok(measurement.conditionSize >= 18, `${tag}: task condition is readable`);
  assert.ok(measurement.sourceSize >= 18, `${tag}: task provenance is readable`);
  for (const step of measurement.stepFonts) {
    assert.ok(step.size >= 18, `${tag}: explanation text ${step.size}px`);
    assert.ok(step.line >= step.size * 1.4, `${tag}: explanation line spacing`);
  }
  for (const label of measurement.texts) {
    assert.ok(label.size >= 17.9, `${tag}: SVG label ${label.text} is ${label.size}px`);
    assert.ok(label.left >= -1 && label.top >= -1 && label.right <= measurement.svgWidth + 1 && label.bottom <= measurement.svgHeight + 1,
      `${tag}: clipped label ${JSON.stringify(label)}`);
  }
  for (let i=0;i<measurement.texts.length;i++) for (let j=i+1;j<measurement.texts.length;j++) {
    const a=measurement.texts[i],b=measurement.texts[j];
    const overlapX=Math.min(a.right,b.right)-Math.max(a.left,b.left);
    const overlapY=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    assert.ok(overlapX <= 1 || overlapY <= 1, `${tag}: labels overlap: ${a.text} / ${b.text}`);
  }
  return measurement;
}

(async () => {
  const server = http.createServer((request, response) => {
    const relative = new URL(request.url, 'http://local').pathname;
    const file = path.resolve(ROOT, '.' + relative);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404); response.end(); return;
    }
    const type = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif'}[path.extname(file)] || 'application/octet-stream';
    response.setHeader('content-type', type); fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true});
  const evidence = [];
  fs.mkdirSync(OUTPUT, {recursive:true});
  try {
    for (const width of [320,390,1280]) {
      const context = await browser.newContext({viewport:{width,height:900}});
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + ROUTE);
      for (const fixture of fixtures) {
        const identity = await selectTask(page, fixture);
        assert.match(await page.locator('.oge18-source-note').textContent(), /аналог|подготовительн/i);
        const input = page.locator('#ansIn');
        await input.fill('123,45');
        const before = await page.locator('.figwrap svg').evaluate(svg => svg.outerHTML);
        await page.locator('#courseHintToggle').click();
        for (let step=1;step<=fixture.steps;step++) {
          await page.locator('#hintBtn').focus();
          await page.locator('#hintBtn').press('Enter');
          assert.equal(await page.locator('#task18Steps .step').count(), step);
          assert.equal(await input.inputValue(), '123,45');
          assert.equal(await input.isDisabled(), false);
          const metrics = await inspectLayout(page, `${fixture.name}, ${width}, step${step}`);
          evidence.push({width, fixture:fixture.name, step, identity, metrics});
          if (step===1) assert.notEqual(await page.locator('.figwrap svg').evaluate(svg=>svg.outerHTML), before);
        }
        assert.equal(await page.locator('#hintBtn').isDisabled(), true);
        // A resize must not replay/restart the learning sequence or replace the typed answer.
        await page.setViewportSize({width:width===1280?390:1280,height:900});
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await input.inputValue(), '123,45');
        assert.equal(await page.locator('#task18Steps .step').count(), fixture.steps);
        await page.setViewportSize({width,height:900});
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await inspectLayout(page, `${fixture.name}, ${width}, after resize`);
        await page.locator('.figwrap[data-oge18-task-diagram]').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(OUTPUT, `${fixture.name}-${width}.png`),fullPage:true});
        await page.getByRole('button',{name:'Вернуться к моему ответу',exact:true}).click();
        assert.equal(await page.evaluate(()=>document.activeElement.id), 'ansIn');
        await input.fill(String(fixture.expected).replace('.',','));
        await input.press('Enter');
        assert.match(await page.locator('#fb').textContent(), /Верно/);
        assert.match(await page.locator('#answerState').textContent(), /Ответ принят/);
        assert.equal(await input.isDisabled(), true);
        const ownCount = await page.evaluate(family=>JSON.parse(localStorage.getItem('mathExamCourseProgress.v1')||'{}')['oge18-kletki']?.solvedByType?.[family]||0,fixture.family);
        assert.equal(ownCount, 0, 'help never awards independent success');
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
    for (const width of [320,1280]) {
      const context = await browser.newContext({viewport:{width,height:900}});
      const page = await context.newPage(), errors=[], requests=[];
      page.on('pageerror', error=>errors.push(error.message));
      page.on('request', request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
      await context.route(/^https?:/, route=>route.abort());
      const offline = path.join(ROOT,'downloads/trainers/oge-task18-grid/oge-task18-grid.html');
      assert.ok(fs.existsSync(offline), 'rebuilt standalone HTML exists');
      await page.goto(pathToFileURL(offline).href);
      await selectTask(page, fixtures[1]);
      await page.locator('#ansIn').fill('35');
      await page.locator('#chkBtn').click();
      assert.match(await page.locator('#fb').getAttribute('class'), /err/);
      await page.locator('#courseHintToggle').click();
      await page.locator('#hintBtn').click();
      await page.locator('#hintBtn').click();
      await inspectLayout(page, `offline parallelogram ${width}`);
      await page.locator('#ansIn').fill('21');
      await page.locator('#chkBtn').click();
      assert.match(await page.locator('#fb').textContent(), /Верно/);
      await selectTask(page, fixtures[2]);
      await page.locator('#courseHintToggle').click();
      for(let step=0;step<3;step++)await page.locator('#hintBtn').click();
      await inspectLayout(page, `offline circles ${width}`);
      await page.screenshot({path:path.join(OUTPUT,`offline-circles-${width}.png`),fullPage:true});
      await page.locator('#ansIn').fill('16');
      await page.locator('#chkBtn').click();
      assert.match(await page.locator('#fb').textContent(), /Верно/);
      assert.deepEqual(requests, [], 'standalone runtime makes no network requests');
      assert.deepEqual(errors, []);
      await context.close();
    }
    fs.writeFileSync(path.join(OUTPUT,'acceptance.json'),JSON.stringify({gate:'OGE18_ANSWER_MODEL_CLARITY_BROWSER_OK',evidence},null,2)+'\n');
    console.log('OGE18_ANSWER_MODEL_CLARITY_BROWSER_OK: task-bound drawings, readable text, keyboard, 320/390/1280, retained answers/steps, file:// without network');
  } catch (error) {
    fs.writeFileSync(path.join(OUTPUT,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,evidence},null,2)+'\n');
    const lastPage=browser.contexts().flatMap(context=>context.pages()).at(-1);
    if(lastPage)await lastPage.screenshot({path:path.join(OUTPUT,'failure.png'),fullPage:true}).catch(()=>{});
    throw error;
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
