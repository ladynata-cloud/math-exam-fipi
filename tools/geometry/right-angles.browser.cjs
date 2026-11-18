'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const origin = 'http://mathexam.test';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

async function readDrawing(svg) {
  return svg.evaluate(el => {
    const bounds = n => n.getBBox();
    const signs = [...el.querySelectorAll('[data-right-angle]')];
    const covers = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    return {
      names: [...new Set(signs.map(n => n.dataset.rightAngle))].sort(),
      legacySquares: el.querySelectorAll('[data-segment^="_r"]').length,
      covered: [...el.querySelectorAll('.am-label')].some(label => signs.some(mark => covers(bounds(mark), bounds(label)))),
      description: el.querySelector('desc').textContent,
      paths: signs.map(n => n.getAttribute('d')).join(' ')
    };
  });
}
module.exports = async function checkRightAnglePages(browser, output) {
  for (const width of [320, 1100]) {
    const context = await browser.newContext({ viewport: { width, height: 850 } });
    try {
      await context.route(origin + '/**', async route => {
        const url = new URL(route.request().url());
        let name = decodeURIComponent(url.pathname);
        if (name.endsWith('/')) name += 'index.html';
        const file = path.join(root, name);
        return fs.existsSync(file) ? route.fulfill({ path: file, contentType: types[path.extname(file)] }) : route.fulfill({ status: 404 });
      });
      for (const [mode, entry] of [['course', '/stereo-course/merzlyak-10-base/'], ['board', '/trainers/merzlyak-10-base.html']]) {
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(String(error)));
        await page.goto(origin + entry + '#merz-ex-10-032');
        const svg = page.locator('[data-main-model] .am-svg');
        await svg.waitFor({ state: 'visible' });
        assert.deepEqual((await readDrawing(svg)).names, [], mode + ': the initial question has no constructed AH');
        await page.locator('[data-main-help] > summary').click();
        await page.getByRole('button', { name: 'Разобрать по шагам', exact: true }).click();
        await svg.locator('[data-right-angle]').first().waitFor();
        const firstStep = await readDrawing(svg);
        assert.deepEqual(firstStep.names, ['A H C'], mode + ': step 1 establishes only the altitude');
        assert.equal(firstStep.legacySquares, 0, 'one square at the altitude foot');
        await page.getByRole('button', { name: 'Следующий шаг', exact: true }).click();
        const initial = await readDrawing(svg);
        assert.deepEqual(initial.names, ['A H C', 'M A H']);
        assert.equal(initial.legacySquares, 0, 'one square per proved angle');
        assert.equal(initial.covered, false, mode + ' marks must be clear of vertex labels');
        assert.match(initial.description, /∠AHC, между прямой m и AH/);
        assert.doesNotMatch(initial.description, /∠mAH|_r/);
        assert.match(initial.description, /A — H/);
        await svg.screenshot({ path: path.join(output, 'right-angles-' + mode + '-' + width + '.png') });
        await svg.focus();
        await page.keyboard.press('ArrowRight');
        const rotated = await readDrawing(svg);
        assert.deepEqual(rotated.names, initial.names);
        assert.equal(rotated.covered, false);
        assert.notEqual(rotated.paths, initial.paths);
        await page.keyboard.press('Home');
        assert.equal((await readDrawing(svg)).paths, initial.paths);
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await context.close();
    }
  }
  console.log('RIGHT_ANGLE_PAGES_OK: textbook and board, 320/1100px, rotate and reset');
};
