'use strict';
// Fictional pupil journeys in cloud Chromium. Answers are computed from the
// visible number and selected place, never from trainer state or its answer key.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const route = '/trainers/oge-basics/multiplication-division/division-course.html';
const trainer = '/trainers/rounding-stepwise.html';
const errors = [];
function fileResponse(url) {
  const file = path.resolve(root, '.' + new URL(url, 'http://fixture').pathname);
  if (!file.startsWith(root + path.sep)) return {status:403,body:''};
  try {
    const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
    return {status:200,contentType:mime[path.extname(file)] || 'application/octet-stream',body:fs.readFileSync(file)};
  } catch (_) { return {status:404,body:''}; }
}
const server = http.createServer((req, res) => {
  const response = fileResponse(req.url);
  res.statusCode=response.status;
  if(response.contentType)res.setHeader('Content-Type',response.contentType);
  res.end(response.body);
});
const instruction = page => page.locator('#instruction').innerText();
const total = async page => Number(await page.locator('#total').innerText());
async function visibleProblem(page, place) {
  const prompt = await page.locator('#prompt').innerText();
  const match = prompt.match(/^Округли число (\d+(?:,\d+)?) до /);
  assert(match, 'The exercise exposes its number as readable text');
  const number = match[1], comma = number.includes(',') ? number.indexOf(',') : number.length;
  const target = comma - place - (place >= 0 ? 1 : 0);
  const look = target + (number[target + 1] === ',' ? 2 : 1);
  const fraction = number.includes(',') ? number.length - comma - 1 : 0;
  const cut = fraction + place;
  const unscaled = BigInt(number.replace(',', ''));
  const power = 10n ** BigInt(Math.abs(cut));
  const rounded = cut > 0 ? (unscaled + power / 2n) / power : unscaled * power;
  const digits = String(rounded).padStart(-place + 1, '0');
  const answer = place >= 0 ? String(rounded * 10n ** BigInt(place)) : digits.slice(0, place) + ',' + digits.slice(place);
  return {prompt, target, look, up:Number(number[look]) >= 5, answer};
}
async function layout(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': no horizontal document overflow');
  const tops = await page.locator('#digits .digit').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top));
  assert(tops.length >= 2 && Math.max(...tops) - Math.min(...tops) <= 1, label + ': digits stay in one number row');
}
async function solve(page, place, injectMistakes) {
  const problem = await visibleProblem(page, place), before = await total(page);
  const target = page.locator('.digit[data-i="' + problem.target + '"]');
  const look = page.locator('.digit[data-i="' + problem.look + '"]');
  assert.match(await instruction(page), /^1\)/);
  if (injectMistakes) {
    await look.click();
    assert.match(await instruction(page), /^1\)/, 'Wrong digit does not advance');
    await page.locator('#hint').click();
    assert.equal(await page.locator('#ans').inputValue(), '', 'A hint cannot fill the answer');
    assert.doesNotMatch(await page.locator('#fb').innerText(), /Ответ:|≈/);
  }
  await target.click();
  assert.match(await instruction(page), /^2\)/);
  if (injectMistakes) {
    await target.click();
    assert.match(await instruction(page), /^2\)/, 'Wrong neighbour remains editable');
  }
  await look.click();
  assert.match(await instruction(page), /^3\)/);
  if (injectMistakes) {
    await page.locator(problem.up ? '#keep' : '#up').click();
    assert.match(await instruction(page), /^3\)/, 'Wrong decision does not advance');
  }
  await page.locator(problem.up ? '#up' : '#keep').click();
  assert.match(await instruction(page), /^4\)/);
  if (injectMistakes) {
    await page.locator('#ans').fill(String(Number(problem.answer.replace(',', '.')) + 1));
    await page.locator('#check').click();
    assert.equal(await total(page), before, 'An incorrect answer is not counted as a solved example');
    assert.match(await instruction(page), /^4\)/);
    await page.locator('#hint').click();
    assert.doesNotMatch(await page.locator('#fb').innerText(), /Ответ:|≈/);
  }
  await page.locator('#ans').fill(problem.answer);
  await page.locator('#ans').press('Enter');
  assert.equal(await total(page), before + 1, 'A corrected answer completes this same example');
  assert.match(await page.locator('#fb').innerText(), /Верно|Решено/);
  await page.locator('#check').click();
  assert.equal(await total(page), before + 1, 'Repeated checking cannot count a second completion');
  return problem.prompt;
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  try {
    for (const width of [320,390,1060]) {
      const context = await browser.newContext({viewport:{width,height:900}});
      // Public and cabinet links may be absolute. Serve the reviewed checkout,
      // preserving real link destinations instead of visiting production code.
      await context.route('https://mathexam.space/**', request => request.fulfill(fileResponse(request.request().url())));
      // Reproducible random choices; no question, answers, progress or app state injected.
      await context.addInitScript(() => {
        let seed = 0x64b971;
        Math.random = () => { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      });
      context.on('page', page => page.on('pageerror', error => errors.push(width + 'px: ' + error.message)));
      try {
        const page = await context.newPage();
        await page.goto(origin + route);
        const preparation = page.locator('[data-division-preparation="rounding-stepwise"]');
        await preparation.waitFor({state:'visible'});
        assert.equal(await page.locator('[data-arithmetic-track] .division-course-step').count(),31);
        assert.equal(await page.locator('[data-foundation-track] .division-course-step').count(),12);
        assert.deepEqual(await page.locator('[data-arithmetic-track] > header progress').evaluateAll(nodes => nodes.map(node => node.max)),[16,15]);
        assert(await preparation.evaluate(node => node.nextElementSibling.querySelector('a').getAttribute('href').startsWith('course-estimate.html')), 'Rounding immediately precedes estimation');
        const [practice] = await Promise.all([page.waitForEvent('popup'),preparation.locator('a').click()]);
        await practice.locator('#place').waitFor({state:'visible'});
        assert.equal(new URL(practice.url()).pathname,trainer);
        assert.equal(new URL(practice.url()).searchParams.get('place'),'1');
        assert.equal(await practice.locator('#place').inputValue(),'1');
        assert.equal(new URL(page.url()).pathname,route,'The starting route remains open');
        await solve(practice,1,true);
        assert.equal(await practice.locator('#right').innerText(),'0','A corrected example is not marked immediately correct');
        await layout(practice,'tens at ' + width);
        for (const place of [2,3,4,5,6,0,-1,-2]) {
          await practice.locator('#place').selectOption(String(place));
          const previous = await solve(practice,place,false);
          await layout(practice,'place ' + place + ' at ' + width);
          await practice.locator('#next').click();
          assert.notEqual(await practice.locator('#prompt').innerText(),previous,'The next exercise changes the condition');
        }
        // Repeated real Next clicks exercise continuation beyond a short fixed set.
        let previous = await practice.locator('#prompt').innerText();
        for (let n=0;n<20;n++) {
          await practice.locator('#next').click();
          const current = await practice.locator('#prompt').innerText();
          assert.notEqual(current,previous,'No adjacent duplicate conditions');
          previous=current;
        }
        await practice.locator('#med').click();
        await practice.locator('#place').selectOption('6');
        await solve(practice,6,false);
        await layout(practice,'larger numbers at ' + width);
        console.log('PASS: ' + width + 'px route link, four visible steps, retry, nine places, continued examples and digit row');
      } finally { await context.close(); }
    }
    assert.deepEqual(errors,[],'No browser JavaScript exceptions');
    console.log('ROUNDING_STEPWISE_BROWSER_OK: public route popup, original tab retained, 30 solved examples from visible prompts, wrong retries and continued practice at 320/390/1060px.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); if(errors.length)console.error(errors);server.close();process.exitCode=1; });
