'use strict';
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {tasks} = require('../trainers/oge-sources/coverage-06-09.json');

const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'};
const server = http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + url.pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error,data) => error ? res.writeHead(404).end() : res.writeHead(200,{'content-type':types[path.extname(file)] || 'application/octet-stream'}).end(data));
});

async function showControls(control) {
  const closed = control.locator('xpath=ancestor::details[not(@open)]');
  while (await closed.count()) await closed.first().locator(':scope > summary').click();
}
async function answer(card,input,button,wrong,right,feedback) {
  const entry = card.locator(input).first();
  const submit = card.getByRole('button',{name:button,exact:true}).first();
  await entry.fill(wrong);
  await submit.click();
  assert.doesNotMatch(await card.locator(feedback).first().innerText(), /^Верно/i);
  await entry.fill(right);
  await submit.click();
  assert.match(await card.locator(feedback).first().innerText(), /верно/i);
}
async function fractions(page) {
  const jump = page.locator('#taskJump');
  await showControls(jump);
  await page.locator('#chips').getByRole('button',{name:/Продвинутый уровень/}).click();
  await jump.selectOption('10');
  assert.match(await page.locator('#card > .expr').innerText(),/1,08/);
  await page.locator('#hintToggle').click();
  assert.ok(await page.locator('#stepPrompt').isVisible());
  await page.locator('#hintToggle').click();
  await answer(page.locator('#card'),'#ans','Проверить','1,3','0,96','#mark');
  await page.reload();
  assert.match(await page.locator('#card > .expr').innerText(),/1,08/);
  assert.match(await page.locator('#taskState').textContent(),/самостоятельно/i);
  assert.equal(await page.locator('#ans').inputValue(),'0,96');
}
async function numberLine(page) {
  const filter = page.locator('#marSrcChips button').filter({hasText:/^MathExam$/});
  await showControls(filter);
  await filter.click();
  const card = page.locator('#marTask');
  assert.match(await card.innerText(),/0,456/);
  assert.equal(await card.locator('.optbtn').count(),4);
  await card.locator('.optbtn').nth(1).click();
  assert.equal(await card.locator('.optbtn.bad').count(),1);
  await card.locator('.optbtn').nth(2).click();
  assert.equal(await card.locator('.optbtn.good').count(),1);
}
async function roots(page) {
  const pager = page.locator('#view-mar .minimal-task-nav select');
  await showControls(pager);
  await pager.selectOption('43');
  const card = page.locator('#marGrid > .mtask:not([hidden])');
  assert.equal((await card.locator('.expr').innerText()).replace(/\s+/g,''),'45·36·30');
  await answer(card,'input','Проверить','630','360','.fb');
}
async function equations(page) {
  const card = page.locator('#mara-list > .task-card:not([hidden])');
  assert.equal(await card.getAttribute('data-task-id'),'exam-author-demo-type-2027');
  await answer(card,':scope > .field input','Проверить','-32','-13','.fb');
}

async function main() {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  let browser;
  try {
    browser = await chromium.launch({headless:true,
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})});
    const journeys = [fractions,numberLine,roots,equations];
    for (const width of [320,390,1280]) {
      for (const [i,row] of tasks.entries()) {
        const page = await browser.newPage({viewport:{width,height:900}});
        try {
          const errors=[];
          page.on('pageerror',error=>errors.push(error.message));
          await page.goto(base + row.trainer);
          await journeys[i](page);
          assert.deepEqual(errors,[]);
          assert(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth+2));
          console.log(`PASS task ${row.number} at ${width}px`);
        } finally {await page.close();}
      }
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
