'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const authors = {pogorelov: '9-107', merzlyak: '8-9'};
const cases = {diameter: 30, inside: 110, outside: 40};
function angle(a, c, b) {
  const x = {x: a.x-c.x, y: a.y-c.y}, y = {x: b.x-c.x, y: b.y-c.y};
  return Math.atan2(Math.abs(x.x*y.y-x.y*y.x), x.x*y.x+x.y*y.y) * 180 / Math.PI;
}
async function run() {
  const browser = await chromium.launch({executablePath: process.env.GEOMETRY_CHROMIUM});
  try {
    for (const width of [320, 1280]) {
      for (const [author, unit] of Object.entries(authors)) {
        const page = await browser.newPage({viewport: {width, height: 900}});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const file = path.resolve(__dirname, '../../geometry-'+author+'/atlas/'+author+'-base-'+unit+'.html');
        await page.goto(pathToFileURL(file).href);
        await page.locator('[data-stage="2"]').focus();
        await page.keyboard.press('Enter');
        const lab = page.locator('#lesson');
        for (const [name, degrees] of Object.entries(cases)) {
          const panel = lab.locator('[data-inscribed-case="'+name+'"]'), toggle = panel.locator('summary');
          await toggle.focus();
          await page.keyboard.press('Enter');
          assert.ok(await panel.getAttribute('open') !== null);
          assert.ok(await panel.getByRole('img').isVisible());
          const geom = await panel.locator('svg').evaluate(svg => {
            const points = Object.fromEntries([...svg.querySelectorAll('[data-point]')].map(p =>
              [p.dataset.point, {x: +p.getAttribute('cx'), y: +p.getAttribute('cy')}]));
            const bounds = svg.getBoundingClientRect();
            return {points, fits: bounds.left >= 0 && bounds.right <= window.innerWidth};
          });
          assert.ok(geom.fits, name+' figure exceeds viewport at '+width);
          const {A, B, C, D, O} = geom.points;
          assert.ok(Math.abs(angle(A, C, B)-degrees) < 0.02);
          assert.ok(Math.abs(angle(C, O, D || B)-180) < 0.02);
          for(const p of [A, B, C]) assert.ok(Math.abs(Math.hypot(p.x-O.x,p.y-O.y)-73)<0.02);
          assert.ok((await panel.locator('li').allTextContents()).some(t => t.includes(degrees+'°')));
          await page.keyboard.press('Space');
          assert.equal(await panel.getAttribute('open'), null);
        }
        assert.equal(await lab.locator('.proof-list li').count(), 0);
        for (const id of ['s1','s2','s3','s4']) {
          await lab.locator('[data-proof="'+id+'"]').click();
          await lab.locator('#reason-choice').selectOption('yes');
          await lab.locator('[data-action="reason-check"]').click();
        }
        assert.equal(await lab.locator('.proof-list li').count(), 4);
        await page.locator('[data-stage="4"]').click();
        assert.equal(await lab.locator('[data-inscribed-case]').count(), 0);
        assert.deepEqual(errors, []);
        await page.close();
      }
    }
    console.log('Inscribed angle: 12 keyboard journeys, coordinates, proofs and independent stage passed.');
  } finally {await browser.close();}
}
run().catch(e => {console.error(e); process.exitCode = 1;});
