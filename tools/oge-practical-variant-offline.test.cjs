'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const unpacked = fs.mkdtempSync(path.join(os.tmpdir(), 'oge-practical-offline-'));
execFileSync('unzip', ['-q', path.join(root, 'downloads/trainers/oge-1-5-trainers/oge-1-5-trainers-package.zip'), '-d', unpacked]);
test.after(() => fs.rmSync(unpacked, { recursive: true, force: true }));

for (const slug of ['roads-grid', 'roads-schema', 'apartments', 'land-plots', 'stoves', 'tariffs', 'paper-sheets', 'tires']) {
  test('downloaded archive boots offline: ' + slug, async () => {
    const errors = [], missing = [], vc = new VirtualConsole();
    vc.on('jsdomError', error => { if (!/scrollTo|HTMLCanvasElement.prototype.getContext/.test(error.message)) errors.push(error.message); });
    class Archive extends ResourceLoader {
      fetch(url) {
        const parsed = new URL(url);
        if (parsed.origin !== 'https://offline.example') return null;
        if (!parsed.pathname.startsWith('/offline/')) { missing.push(parsed.pathname); return null; }
        const file = path.resolve(unpacked, decodeURIComponent(parsed.pathname.slice('/offline/'.length)));
        if (!file.startsWith(unpacked + path.sep) || !fs.existsSync(file)) { missing.push(parsed.pathname); return null; }
        return Promise.resolve(fs.readFileSync(file));
      }
    }
    const dom = new JSDOM(fs.readFileSync(path.join(unpacked, 'practice-1-5-' + slug + '.html'), 'utf8'), {
      url: 'https://offline.example/offline/practice-1-5-' + slug + '.html', resources: new Archive(), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) { w.scrollTo = () => {}; w.confirm = () => true; w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }); w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {}; }
    });
    try {
      await new Promise(resolve => dom.window.addEventListener('load', resolve));
      await new Promise(resolve => setTimeout(resolve, 30));
      const doc = dom.window.document;
      assert.deepEqual(missing, [], 'every local runtime dependency is inside the archive');
      assert.deepEqual(errors, [], 'offline runtime errors');
      if (slug === 'tires') {
        assert.equal(doc.documentElement.dataset.tireVariantLayout, 'ready');
        assert.equal(doc.querySelectorAll('#tvl-task-stream>.step-section').length, 5);
      } else {
        assert.equal(doc.documentElement.dataset.practicalVariant, 'ready');
        assert.equal(doc.querySelectorAll('.pv-task-stream>.pv-question').length, 5);
      }
      if (slug === 'roads-grid') {
        assert.equal(typeof dom.window.MathExamBoard.register, 'function');
        const source = doc.querySelector('script[src*="board-bridge"]');
        assert.equal(source.getAttribute('src'), '_shared/trainers/board-bridge.js');
        const localFile = new URL(source.getAttribute('src'), 'file://' + path.join(unpacked, 'practice-1-5-roads-grid.html'));
        assert.ok(fs.existsSync(localFile), 'relocated shared script also resolves for file://');
        assert.ok(doc.querySelector('script[src="practical-discovery.js?v=20261021-exam-variants"]'), 'cache version preserved');
      }
    } finally { dom.window.close(); }
  });
}
