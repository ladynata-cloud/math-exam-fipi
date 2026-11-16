'use strict';

// Validate the shipped recordings, their immutable sources and all scoped lessons.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets/geometry-experiment-gifs');
const catalogueBytes = fs.readFileSync(path.join(ASSETS, 'catalog.json'));
const catalogue = JSON.parse(catalogueBytes);
const media = JSON.parse(fs.readFileSync(path.join(ASSETS, 'media.json')));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const readSource = (file, ref) => ref
  ? execFileSync('git', ['show', `${ref}:${file}`], { cwd: ROOT, maxBuffer: 8 * 1024 * 1024 })
  : fs.readFileSync(path.join(ROOT, file));
const configOf = html => {
  const match = html.match(/<script>\s*window\.COURSE_CONFIG=([\s\S]*?);\s*<\/script>/);
  assert(match, 'lesson has one course configuration');
  return JSON.parse(match[1]);
};

function gifInfo(bytes) {
  assert.match(bytes.subarray(0, 6).toString(), /^GIF8[79]a$/);
  assert(bytes.length > 13, 'complete GIF header');
  const width = bytes.readUInt16LE(6), height = bytes.readUInt16LE(8);
  let pos = 13, frames = 0, durationMs = 0, delay = 0, ended = false;
  const packed = bytes[10];
  if (packed & 128) pos += 3 * (2 ** ((packed & 7) + 1));
  const blocks = () => {
    while (pos < bytes.length) {
      const size = bytes[pos++];
      if (!size) return;
      pos += size;
      assert(pos <= bytes.length, 'complete GIF data block');
    }
    assert.fail('unterminated GIF data blocks');
  };
  while (pos < bytes.length) {
    const kind = bytes[pos++];
    if (kind === 0x3b) { ended = true; break; }
    if (kind === 0x21) {
      const extension = bytes[pos++];
      if (extension === 0xf9) { assert.equal(bytes[pos], 4); delay = bytes.readUInt16LE(pos + 2) * 10; }
      blocks();
    } else if (kind === 0x2c) {
      assert(pos + 9 < bytes.length, 'complete GIF image descriptor');
      const local = bytes[pos + 8];
      pos += 9;
      if (local & 128) pos += 3 * (2 ** ((local & 7) + 1));
      pos++; // LZW minimum code size.
      blocks();
      frames++;
      durationMs += delay;
    } else assert.fail('unexpected GIF block ' + kind);
  }
  assert(ended, 'GIF ends with a trailer');
  return { width, height, frames, durationMs };
}

function pngInfo(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.subarray(12, 16).toString(), 'IHDR');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('exactly 84 Pogorelov and 63 Atanasyan 2D lessons have explicit action mappings', () => {
  const expected = [];
  for (const course of ['geometry-course', 'geometry-pogorelov']) {
    const units = JSON.parse(fs.readFileSync(path.join(ROOT, course, 'data/course.json'))).units;
    for (const unit of units.filter(unit => !unit.space)) {
      const filename = `${course}/atlas/${unit.id}.html`;
      expected.push(filename);
      const entry = catalogue.pages[filename];
      assert(entry, filename);
      assert.equal(entry.unitId, unit.id);
      assert.equal(entry.figure, unit.figure);
      assert.equal(entry.goal, unit.goal);
      assert(entry.manual.length > 0, filename + ': construction instruction present');
      for (const surface of ['manual', 'experiments', 'investigations']) {
        for (const id of entry[surface]) {
          const clip = catalogue.clips[id];
          assert(clip, id);
          assert.equal(clip.surface, { manual: 'manual', experiments: 'experiment', investigations: 'investigation' }[surface]);
          if (surface === 'manual') {
            assert.equal(clip.sourceCourse, course, 'recording shows this course’s real controls');
            assert.equal(clip.figure, unit.figure, 'same figure');
            assert.equal(clip.goal, unit.goal, 'same construction');
          }
        }
      }
      if (course === 'geometry-course') assert.equal(entry.investigations.length, 1, 'separate pending primary instruction');
      else assert.equal(entry.investigations.length, 0, 'no invented topic runtime');
    }
  }
  assert.equal(expected.length, 147);
  assert.deepEqual(Object.keys(catalogue.pages).sort(), expected.sort());
  assert.equal(expected.filter(name => name.startsWith('geometry-pogorelov/')).length, 84);
});

test('every recording is complete, animated, paired with readable stills, and matches its captured source', () => {
  assert.equal(media.catalogueSha256, sha(catalogueBytes), 'media refers to this exact catalogue');
  assert.deepEqual(Object.keys(media.clips).sort(), Object.keys(catalogue.clips).sort());
  const recorderHash = sha(fs.readFileSync(path.join(ROOT, 'tools/geometry-experiment-gifs.browser.cjs')));
  const encoderHash = sha(fs.readFileSync(path.join(ROOT, 'tools/build-geometry-experiment-gifs.py')));
  const checkedSources = new Map();
  for (const [id, clip] of Object.entries(catalogue.clips)) {
    const record = media.clips[id];
    assert.equal(record.scenarioSha256, sha(JSON.stringify(clip)), id + ': recorded action sequence');
    assert.equal(record.sourceRef || null, clip.sourceRef || null, id + ': source revision');
    assert(record.browser, id + ': actual browser provenance');
    assert.match(record.recordingSha256, /^[a-f0-9]{64}$/);
    assert.equal(record.recorderSha256, recorderHash, id + ': exact recorder implementation');
    assert.equal(record.encoderSha256, encoderHash, id + ': exact encoder implementation');
    assert.equal(record.frames.length, clip.steps.length, id + ': one independent still per instruction');
    assert(record.frames.length >= 2);
    for (const step of clip.steps) {
      assert.equal(typeof step.caption, 'string');
      assert(step.caption.trim().length > 0);
      assert(Array.isArray(step.actions));
    }
    for (const [file, expectedHash] of Object.entries(record.sourceHashes)) {
      const key = `${record.sourceRef || 'working'}:${file}`;
      if (!checkedSources.has(key)) checkedSources.set(key, sha(readSource(file, record.sourceRef)));
      assert.equal(checkedSources.get(key), expectedHash, id + ': source ' + file);
    }
    const files = [record.gif, ...record.frames];
    assert.equal(record.poster, record.frames[0]);
    for (const file of files) {
      assert.equal(path.basename(file), file, 'resources stay within the guide directory');
      const bytes = fs.readFileSync(path.join(ASSETS, file));
      assert.equal(bytes.length, record.bytes[file], file + ': file size');
      assert.equal(sha(bytes), record.sha256[file], file + ': file hash');
      if (file.endsWith('.png')) assert.deepEqual(pngInfo(bytes), { width: record.width, height: record.height });
    }
    const gif = gifInfo(fs.readFileSync(path.join(ASSETS, record.gif)));
    assert.equal(gif.width, record.width);
    assert.equal(gif.height, record.height);
    assert(gif.frames >= record.frames.length, id + ': animated real action frames');
    assert(gif.frames <= record.animationFrames, id + ': encoder may combine duplicate frames only');
    assert.equal(gif.durationMs, record.durationMs);
    if (clip.surface === 'investigation') {
      const last = record.states.at(-1).investigation;
      assert.equal(last.prediction, 'unsure', id + ': example does not select the answer');
      assert.equal(last.observation, '', id + ': example does not write the pupil’s conclusion');
      assert(last.opened && last.changed);
    }
  }
});

test('147 generated pages keep their full training configuration and embed only active page recordings', () => {
  for (const [filename, mapping] of Object.entries(catalogue.pages)) {
    const html = fs.readFileSync(path.join(ROOT, filename), 'utf8');
    const current = configOf(html);
    const original = configOf(readSource(filename, catalogue.sourceBase).toString('utf8'));
    const guides = current.experimentGuides;
    assert(guides, filename + ': guide configuration exists');
    delete current.experimentGuides;
    assert.deepEqual(current, original, filename + ': conditions, proofs, seeds and catalogue unchanged');
    for (const surface of ['manual', 'experiments', 'investigations']) assert.deepEqual(guides[surface], mapping[surface]);
    const ids = [...new Set([...mapping.manual, ...mapping.experiments, ...mapping.investigations])];
    assert.deepEqual(guides.clips.map(clip => clip.id).sort(), ids.sort(), filename + ': only this lesson’s examples');
    assert.equal((html.match(/data-geometry-experiment-gifs="runtime"/g) || []).length, 1);
    assert.equal((html.match(/data-geometry-experiment-gifs="style"/g) || []).length, 1);
    const harmonized = fs.readFileSync(path.join(ROOT, mapping.course, 'assets/lesson.js'), 'utf8').includes('GeoInvestigations.mount');
    const active = new Set([...mapping.manual, ...mapping.experiments, ...(harmonized ? mapping.investigations : [])]);
    for (const clip of guides.clips) {
      const encoded = media.clips[clip.id];
      assert.equal(clip.frames.length, clip.steps.length);
      assert.equal(clip.width, encoded.width);
      assert.equal(clip.height, encoded.height);
      for (const [url, file] of [[clip.gif, encoded.gif], [clip.poster, encoded.poster], ...clip.frames.map((src, i) => [src, encoded.frames[i]])]) {
        if (mapping.course === 'geometry-course' && active.has(clip.id)) {
          assert.match(url, /^data:image\/(gif|png);base64,/);
          assert.equal(sha(Buffer.from(url.split(',')[1], 'base64')), encoded.sha256[file], filename + ': complete offline bytes');
        } else assert.equal(url, '/assets/geometry-experiment-gifs/' + file, filename + ': shared resource path remains local to site');
      }
    }
  }
});

for (const course of ['geometry-course', 'geometry-pogorelov']) {
  test(`${course}: midline measurements follow connected dependent points, their saved names and live geometry`, () => {
    const dom = new JSDOM('<main></main>', { runScripts: 'outside-only' });
    const window = dom.window;
    // Geometry and DOM are real; the raster drawing surface is irrelevant to the readout.
    window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {}, set: () => true });
    try {
      for (const file of ['geometry.js', 'lab.js']) window.eval(fs.readFileSync(path.join(ROOT, course, 'assets', file), 'utf8'));
      const host = window.document.querySelector('main');
      const lab = window.GeoLab.mount(host, { figure: 'triangle', goal: 'midline' }, () => {});
      const board = lab.board, read = () => host.querySelector('.lab-readout').textContent;
      assert.match(read(), /AB = 7.20/);
      assert.doesNotMatch(read(), /ACB|S△/);
      const a = board.point('A'), b = board.point('B'), c = board.point('C');
      board.addPoint((a.x + c.x) / 2, (a.y + c.y) / 2);
      board.addPoint((b.x + c.x) / 2, (b.y + c.y) / 2);
      board.make('segment', ['M', 'N']);
      lab.redraw();
      assert.doesNotMatch(read(), /MN =/, 'coincident free points are not a constructed middle segment');
      board.make('midpoint', ['C', 'A']);
      board.make('midpoint', ['C', 'B']);
      lab.redraw();
      assert.match(read(), /Соедини середины P и Q/);
      assert.doesNotMatch(read(), /PQ =/, 'length appears only after connecting the true midpoints');
      board.make('segment', ['Q', 'P']);
      lab.redraw();
      assert.match(read(), /PQ = 3.60/);
      assert.doesNotMatch(read(), /MN =/);
      board.move('B', 550, 320);
      lab.redraw();
      assert.match(read(), /AB = 8.21/);
      assert.match(read(), /PQ = 4.10/, 'both measurements update after the base moves');
      board.move('C', (board.point('A').x + board.point('B').x) / 2, (board.point('A').y + board.point('B').y) / 2);
      lab.redraw();
      assert.match(read(), /Восстанови треугольник/);
      assert.doesNotMatch(read(), /PQ =|AB =/, 'degenerate figure never keeps stale measurements');
      lab.destroy();
      window.GeoLab.mount(host, { figure: 'triangle', goal: 'explore' }, () => {});
      assert.match(read(), /ACB/);
      assert.match(read(), /S△/, 'unrelated lessons retain their original measurements');
    } finally { window.close(); }
  });
}
