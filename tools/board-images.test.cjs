'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const images = require('../trainers/board-images.js');
const ink = require('../trainers/board-ink.js');
const SOURCE = fs.readFileSync(path.join(__dirname, '../trainers/board-images.js'), 'utf8');
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const pngBytes = () => Buffer.from(PNG.split(',')[1], 'base64');
const asSource = (bytes, type) => 'data:' + type + ';base64,' + Buffer.from(bytes).toString('base64');
const object = (src = PNG) => ({ kind: 'image', tool: 'image', x: -10, y: 20, width: 192, height: 120, src, name: 'Скриншот.png' });
const file = (bytes, type = 'image/png', name = 'Скриншот.png') => ({ type, name, size: bytes.length,
  arrayBuffer: async () => Uint8Array.from(bytes).buffer });

function headerPNG(width, height) {
  const bytes = pngBytes(); bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20); return bytes;
}
function headerWebP(kind, width, height) {
  const length = kind === 'VP8L' ? 5 : 10;
  const bytes = Buffer.alloc(20 + length + length % 2);
  bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WEBP', 8);
  bytes.write(kind, 12); bytes.writeUInt32LE(length, 16);
  if (kind === 'VP8X') { bytes.writeUIntLE(width - 1, 24, 3); bytes.writeUIntLE(height - 1, 27, 3); }
  else if (kind === 'VP8L') { bytes[20] = 47; bytes.writeUInt32LE((width - 1) | ((height - 1) << 14), 21); }
  else { bytes.set([157, 1, 42], 23); bytes.writeUInt16LE(width, 26); bytes.writeUInt16LE(height, 28); }
  return bytes;
}
function headerJPEG(width, height) {
  const bytes = Buffer.from([255,216,255,224,0,4,0,0,255,192,0,8,8,0,0,0,0,1,255,217]);
  bytes.writeUInt16BE(height, 13); bytes.writeUInt16BE(width, 15); return bytes;
}

test('only bounded inline PNG/JPEG/WebP sources and finite positive image geometry are admitted', () => {
  assert.equal(images.validateImage(object()), true);
  for (const src of ['https://example.test/a.png', 'blob:local', 'data:image/svg+xml;base64,PHN2Zz4=',
    PNG.replace('image/png', 'image/jpeg'), PNG + '?tracking=1', PNG.replace(';base64,', ','),
    'data:image/png;base64,' + 'A'.repeat(images.MAX_SRC_LENGTH)]) assert.equal(images.validateImage(object(src)), false, src.slice(0, 60));
  for (const patch of [{ width: 0 }, { width: -1 }, { height: Infinity }, { x: NaN }, { y: '20' }, { kind: 'path' }, { tool: 'pen' }]) {
    assert.equal(images.validateImage({ ...object(), ...patch }), false);
  }
});

test('PNG/JPEG/all WebP dimension headers are bounded before a browser decoder is requested', () => {
  // Header-only fixtures exercise allocation guards, not codec validity; real decoders are covered in the browser gate.
  for (const [type, make] of [['image/png', headerPNG], ['image/jpeg', headerJPEG],
    ...['VP8X', 'VP8 ', 'VP8L'].map(kind => ['image/webp', (w, h) => headerWebP(kind, w, h)])]) {
    assert.equal(images.validateImage(object(asSource(make(100, 80), type))), true, type);
    assert.equal(images.validateImage(object(asSource(make(1601, 80), type))), false, type + ' side limit');
    assert.equal(images.validateImage(object(asSource(make(100, 80).subarray(0, 15), type))), false, type + ' truncated');
  }
});

test('budget counts complete UTF-8 snapshot, all pages and the new image without mutating them', () => {
  const snapshot = { currentPage: 1, trainerUrl: 'negative-numbers-line.html', pages: [
    { id: 'page-a', bg: 'grid', strokes: [{ kind: 'text', text: 'Проверка × 2' }] },
    { id: 'page-b', bg: 'blank', strokes: [] }
  ] };
  const before = structuredClone(snapshot), img = object();
  const budget = images.checkBudget(snapshot, img);
  assert.equal(budget.ok, true);
  const expected = structuredClone(snapshot); expected.pages[1].strokes.push(img);
  assert.equal(budget.bytes, Buffer.byteLength(JSON.stringify(expected), 'utf8'));
  assert.deepEqual(snapshot, before);
  const tooLarge = { pages: [{ strokes: [{ kind: 'text', text: 'я'.repeat(images.MAX_BOARD_BYTES / 2) }] }] };
  assert.equal(images.checkBudget(tooLarge, img).ok, false);
  assert.equal(images.checkBudget({ pages: [{ strokes: Array.from({ length: 8 }, () => object()) }] }, img).ok, false);
  assert.equal(images.checkBudget(snapshot, object('https://example.test/a.png')).ok, false);
});

test('screenshot bounds participate in fit while the ink renderer ignores the image object', () => {
  const img = object();
  assert.deepEqual(ink.strokeBounds(img), { minX: -10, minY: 20, maxX: 182, maxY: 140 });
  assert.deepEqual(ink.drawingBounds([img]), ink.strokeBounds(img));
  const ctx = { save() {}, restore() {}, drawImage() { throw new Error('Images belong below ink'); } };
  assert.equal(ink.drawStroke(ctx, img), false);
});

function environment(options = {}) {
  const calls = { sources: [], created: [], revoked: [], draws: [], encodes: [] };
  const context = {
    Uint8Array, DataView, TextEncoder, atob, setTimeout, clearTimeout,
    Image: class {
      set src(value) {
        calls.sources.push(value);
        queueMicrotask(() => {
          if (options.decodeError) return this.onerror?.();
          this.naturalWidth = options.width || 1; this.naturalHeight = options.height || 1;
          this.onload?.();
        });
      }
    },
    URL: {
      createObjectURL(value) { calls.created.push(value); return 'blob:owned-image'; },
      revokeObjectURL(value) { calls.revoked.push(value); }
    },
    FileReader: class { readAsDataURL(value) { this.result = value.src; queueMicrotask(() => this.onload()); } },
    document: { createElement(tag) {
      assert.equal(tag, 'canvas');
      const canvas = { width: 0, height: 0,
        getContext() { return { drawImage(...args) { calls.draws.push(args.slice(1)); } }; },
        toBlob(callback, type, quality) {
          calls.encodes.push({ type, quality, width: canvas.width, height: canvas.height });
          const huge = options.tooLarge || (options.pngTooLarge && type === 'image/png');
          const src = type === 'image/webp' ? asSource(headerWebP('VP8X', 1, 1), type) : PNG;
          queueMicrotask(() => callback({ type, size: huge ? images.MAX_SRC_LENGTH : 100, src }));
        }
      }; return canvas;
    } }
  };
  vm.runInContext(SOURCE, vm.createContext(context));
  return { api: context.BoardImages, calls };
}

test('import rejects unsupported, oversized and excessive-pixel inputs before allocating a decoder', async () => {
  const { api, calls } = environment();
  await assert.rejects(api.importFile(file(pngBytes(), 'image/svg+xml')), /PNG.*JPEG.*WebP/);
  await assert.rejects(api.importFile({ ...file(pngBytes()), size: images.MAX_INPUT_BYTES + 1 }), /10 МБ/);
  await assert.rejects(api.importFile(file(headerPNG(6000, 6000))), /разрешению/);
  await assert.rejects(api.importFile(file(Buffer.from('not an image'))), /PNG.*JPEG.*WebP/);
  assert.equal(calls.created.length, 0);
  assert.equal(calls.sources.length, 0);
});

test('import fits large dimensions, prefers lossless PNG, cleans the filename and revokes its owned blob URL', async () => {
  const { api, calls } = environment({ width: 4000, height: 2000 });
  const imported = await api.importFile(file(headerPNG(4000, 2000), 'image/png', '  Фото\nурока.png  '));
  assert.equal(imported.width, 1600); assert.equal(imported.height, 800);
  assert.equal(imported.src, PNG); assert.equal(imported.name, 'Фотоурока.png');
  assert.deepEqual(calls.draws[0], [0, 0, 1600, 800]);
  assert.equal(calls.encodes.length, 1); assert.equal(calls.encodes[0].type, 'image/png');
  assert.deepEqual(calls.sources, ['blob:owned-image']);
  assert.deepEqual(calls.revoked, ['blob:owned-image']);
});

test('import falls back to high-quality WebP within budget and reports impossible compression clearly', async () => {
  const webp = environment({ pngTooLarge: true });
  const imported = await webp.api.importFile(file(pngBytes()));
  assert.ok(imported.src.startsWith('data:image/webp;base64,'));
  assert.equal(webp.calls.encodes[1].quality, 0.96);
  const impossible = environment({ tooLarge: true, width: 1600, height: 1000 });
  await assert.rejects(impossible.api.importFile(file(headerPNG(1600, 1000))), /Обрежьте/);
  assert.ok(impossible.calls.encodes.length <= 35, 'encoding attempts are bounded');
  assert.equal(impossible.calls.encodes.at(-1).width, 640);
  const broken = environment({ decodeError: true });
  await assert.rejects(broken.api.importFile(file(pngBytes())), /Не удалось прочитать/);
  assert.deepEqual(broken.calls.revoked, ['blob:owned-image']);
});

test('safe images decode once, notify the renderer, and draw with its existing transform; external URLs never decode', async () => {
  const { api, calls } = environment();
  let notifications = 0, saves = 0, restores = 0;
  const draws = [];
  const ctx = { save() { saves++; }, restore() { restores++; }, fillRect() {}, strokeRect() {}, fillText() {},
    drawImage(...args) { draws.push(args.slice(1)); } };
  assert.equal(api.drawImages(ctx, [object()], () => notifications++), false);
  assert.equal(await api.whenReady([object()]), true);
  assert.equal(notifications, 1);
  assert.equal(api.drawImages(ctx, [object()]), true);
  assert.deepEqual(draws, [[-10, 20, 192, 120]]);
  assert.equal(calls.sources.length, 1);
  assert.equal(await api.whenReady([object('https://example.test/secret.png')]), false);
  assert.equal(calls.sources.length, 1, 'no external fetch or Image.src assignment');
  assert.equal(saves, restores);
});

test('decoded cache has a bounded size and reports corrupt raster decode without repeated attempts', async () => {
  const { api, calls } = environment();
  const sources = Array.from({ length: images.MAX_IMAGES + 1 }, (_, i) => asSource(headerPNG(i + 1, 1), 'image/png'));
  for (const src of sources) assert.equal(await api.whenReady([object(src)]), true);
  assert.equal(calls.sources.length, images.MAX_IMAGES + 1);
  await api.whenReady([object(sources[0])]);
  assert.equal(calls.sources.length, images.MAX_IMAGES + 2, 'oldest unused bitmap was evicted');
  const broken = environment({ decodeError: true });
  assert.equal(await broken.api.whenReady([object()]), false);
  assert.equal(await broken.api.whenReady([object()]), false);
  assert.equal(broken.calls.sources.length, 1);
});
