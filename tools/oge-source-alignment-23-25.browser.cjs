'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css'};
const trainers = {
  23: 'oge-task23-geometry-calculations.html',
  24: 'oge-task24-proofs.html',
  25: 'oge-task25-geometry.html',
};

const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://127.0.0.1').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, bytes) => {
    if (error) return res.writeHead(404).end();
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(bytes);
  });
});

async function showAuthoredVariant(page, number) {
  await page.evaluate(number => {
    if (number === 23) {
      buildTask(document.querySelector('.train-host'), ARCHIVE.find(row => row.id === 'q022-v2'), 'train', () => {});
    } else if (number === 24) {
      startStudy('t10');
    } else {
      const random = Math.random;
      Math.random = () => 0.21;
      try {
        startTrain(3);
      } finally {
        Math.random = random;
      }
    }
    window.OgeCourseProof.decorate();
  }, number);
}

async function verify(page, number, width) {
  await showAuthoredVariant(page, number);
  const figure = page.locator('.ocp-figure-pan').first();
  await figure.locator('svg').waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), number + ' overflow at ' + width);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  if (number === 23) {
    const condition = page.locator('.train-host .q-text');
    assert.match(await condition.innerText(), /AF = 36.+BF = 27/);
    const answer = page.locator('.train-host .ans-inp');
    await answer.fill('63');
    await page.locator('.train-host [data-board-action="answer"]').click();
    assert.ok(await page.locator('.train-host .fb.warn').isVisible());
    await answer.fill('45');
    await page.locator('.train-host [data-board-action="answer"]').click();
    assert.match(await page.locator('.train-host .fb').innerText(), /Верно/);
  } else if (number === 24) {
    assert.match(await page.locator('.givens').innerText(), /KA · KD = KB · KC/);
    for (let index = 0; index < 5; index++) {
      await page.locator(`button[onclick="pickCard({type:'s',i:${index}})"]`).click();
    }
    assert.match(await page.locator('.chain .citem').last().innerText(), /KA\/KC = KB\/KD/);
    assert.equal(await page.locator('.ocp-writing').getAttribute('data-task-key'), '24|t10-v2');
  } else {
    assert.match(await page.locator('#panel-train .cond').innerText(), /AB = 26.+CD = 30/);
    assert.ok(await figure.locator('svg text').filter({hasText:/^H₁$/}).isVisible());
    const answer = page.locator('#panel-train input[data-ai="0"]');
    await answer.fill('360');
    await page.locator('#panel-train [data-act="tr-check"]').click();
    assert.match(await page.locator('#trFb').innerText(), /Верно|Самостоятельно/);
  }
  assert.deepEqual(errors, []);
}

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE_PATH});
    const base = 'http://127.0.0.1:' + server.address().port;
    for (const width of [320,390,1280]) {
      for (const [number,file] of Object.entries(trainers)) {
        const page = await browser.newPage({viewport:{width,height:900}});
        try {
          await page.goto(base + '/trainers/' + file, {waitUntil:'load'});
          await page.locator('html[data-oge-course-proof="ready"]').waitFor();
          await verify(page, Number(number), width);
        } finally {
          await page.close();
        }
      }
    }
    console.log('OGE_SOURCE_ALIGNMENT_23_25_BROWSER_OK: 9 viewport scenarios');
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
