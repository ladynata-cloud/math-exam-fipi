/* Screenshot objects for the classic board. No remote URLs or new transport events. */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BoardImages = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MAX_INPUT_BYTES = 10 * 1024 * 1024;
  const MAX_SIDE = 1600;
  const MAX_SOURCE_SIDE = 16384;
  const MAX_SOURCE_PIXELS = 25000000;
  const MAX_SRC_LENGTH = 350 * 1024;
  const MAX_BOARD_BYTES = 1500 * 1024;
  const MAX_IMAGES = 8;
  const TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
  const cache = new Map();
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const formatError = () => new Error('Выберите изображение PNG, JPEG или WebP. SVG и ссылки не поддерживаются.');
  const decodeError = () => new Error('Не удалось прочитать изображение. Попробуйте сохранить скриншот в PNG и выбрать его снова.');

  function ascii(bytes, start, length) {
    let text = '';
    for (let i = start; i < start + length && i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
    return text;
  }

  // Inspect dimensions before asking a browser decoder to allocate a bitmap.
  function dimensions(bytes, type) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (type === 'image/png') {
      if (bytes.length < 33 || bytes[0] !== 137 || ascii(bytes, 1, 7) !== 'PNG\r\n\x1a\n'
        || ascii(bytes, 12, 4) !== 'IHDR' || view.getUint32(8) !== 13) return null;
      return { width: view.getUint32(16), height: view.getUint32(20) };
    }
    if (type === 'image/jpeg') {
      if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) return null;
      let offset = 2;
      while (offset + 3 < bytes.length) {
        if (bytes[offset++] !== 255) return null;
        while (bytes[offset] === 255) offset++;
        const marker = bytes[offset++];
        if (marker === 217 || marker === 218) return null;
        if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
        if (offset + 2 > bytes.length) return null;
        const length = view.getUint16(offset);
        if (length < 2 || offset + length > bytes.length) return null;
        if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
          return length >= 8 ? { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) } : null;
        }
        offset += length;
      }
    }
    if (type === 'image/webp') {
      if (bytes.length < 20 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP') return null;
      for (let offset = 12; offset + 8 <= bytes.length;) {
        const kind = ascii(bytes, offset, 4), length = view.getUint32(offset + 4, true), start = offset + 8;
        if (start + length > bytes.length) return null;
        if (kind === 'VP8X' && length >= 10) {
          return { width: 1 + bytes[start + 4] + (bytes[start + 5] << 8) + (bytes[start + 6] << 16),
            height: 1 + bytes[start + 7] + (bytes[start + 8] << 8) + (bytes[start + 9] << 16) };
        }
        if (kind === 'VP8 ' && length >= 10 && bytes[start + 3] === 157 && bytes[start + 4] === 1 && bytes[start + 5] === 42) {
          return { width: view.getUint16(start + 6, true) & 16383, height: view.getUint16(start + 8, true) & 16383 };
        }
        if (kind === 'VP8L' && length >= 5 && bytes[start] === 47) {
          const bits = view.getUint32(start + 1, true);
          return { width: 1 + (bits & 16383), height: 1 + ((bits >>> 14) & 16383) };
        }
        offset = start + length + length % 2;
      }
    }
    return null;
  }

  function saneSize(size, side = MAX_SOURCE_SIDE, pixels = MAX_SOURCE_PIXELS) {
    return !!size && Number.isInteger(size.width) && Number.isInteger(size.height)
      && size.width > 0 && size.height > 0 && size.width <= side && size.height <= side
      && size.width * size.height <= pixels;
  }

  function sourceInfo(src) {
    if (typeof src !== 'string' || src.length > MAX_SRC_LENGTH) return null;
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(src);
    if (!match || match[2].length % 4 !== 0) return null;
    try {
      const binary = root.atob(match[2]), bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const size = dimensions(bytes, match[1]);
      return saneSize(size, MAX_SIDE, MAX_SIDE * MAX_SIDE) ? { ...size, type: match[1] } : null;
    } catch (_) { return null; }
  }

  function imageGeometry(stroke) {
    return !!stroke && stroke.kind === 'image' && stroke.tool === 'image'
      && finite(stroke.x) && finite(stroke.y) && finite(stroke.width) && finite(stroke.height)
      && stroke.width > 0 && stroke.height > 0;
  }

  function validateImage(stroke) {
    return imageGeometry(stroke) && (cache.has(stroke.src) || !!sourceInfo(stroke.src));
  }

  function decode(src, expected) {
    return new Promise((resolve, reject) => {
      const image = new root.Image();
      const timer = setTimeout(() => finish(decodeError()), 15000);
      let finished = false;
      function finish(error) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        image.onload = image.onerror = null;
        if (error) reject(error);
        else resolve(image);
      }
      image.onload = () => {
        const size = { width: image.naturalWidth, height: image.naturalHeight };
        if (!saneSize(size) || (expected && (size.width > MAX_SIDE || size.height > MAX_SIDE))) finish(decodeError());
        else finish();
      };
      image.onerror = () => finish(decodeError());
      image.src = src;
    });
  }

  function blobDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new root.FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(decodeError());
      reader.readAsDataURL(blob);
    });
  }

  async function encode(canvas, type, quality) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type, quality));
    if (!blob || blob.type !== type) return null;
    if (4 * Math.ceil(blob.size / 3) + ('data:' + type + ';base64,').length > MAX_SRC_LENGTH) return null;
    const src = await blobDataURL(blob);
    return sourceInfo(src) ? src : null;
  }

  async function importFile(file) {
    if (!file || !TYPES.has(file.type) || typeof file.arrayBuffer !== 'function') throw formatError();
    if (!finite(file.size) || file.size <= 0) throw decodeError();
    if (file.size > MAX_INPUT_BYTES) throw new Error('Файл слишком большой. Выберите скриншот размером до 10 МБ.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength !== file.size || bytes.byteLength > MAX_INPUT_BYTES) throw decodeError();
    const size = dimensions(bytes, file.type);
    if (!size) throw formatError();
    if (!saneSize(size)) throw new Error('Изображение слишком большое по разрешению. Обрежьте скриншот перед добавлением.');
    const url = root.URL.createObjectURL(file);
    let image;
    try { image = await decode(url); } finally { root.URL.revokeObjectURL(url); }
    const canvas = root.document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw decodeError();
    const ratio = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    let width = Math.max(1, Math.round(image.naturalWidth * ratio));
    let height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const name = String(file.name || 'Скриншот').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120) || 'Скриншот';
    for (let attempt = 0; attempt < 7; attempt++) {
      canvas.width = width; canvas.height = height;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, 0, 0, width, height);
      let src = await encode(canvas, 'image/png');
      if (!src) for (const quality of [0.96, 0.9, 0.84, 0.78]) {
        src = await encode(canvas, 'image/webp', quality);
        if (src) break;
      }
      if (src) return { src, width, height, name };
      if (Math.max(width, height) <= 640) break;
      const smaller = Math.max(640, Math.floor(Math.max(width, height) * 0.84)) / Math.max(width, height);
      width = Math.max(1, Math.round(width * smaller)); height = Math.max(1, Math.round(height * smaller));
    }
    throw new Error('Не удалось уменьшить скриншот без чрезмерной потери качества. Обрежьте его и попробуйте снова.');
  }

  function entryFor(src, onReady) {
    let entry = cache.get(src);
    if (entry) { cache.delete(src); cache.set(src, entry); }
    else {
      const info = sourceInfo(src);
      if (!info) return null;
      entry = { status: 'loading', image: null, callbacks: new Set() };
      cache.set(src, entry);
      while (cache.size > MAX_IMAGES) cache.delete(cache.keys().next().value);
      entry.promise = decode(src, info).then(image => { entry.image = image; entry.status = 'ready'; return true; },
        () => { entry.status = 'error'; return false; }).then(ok => {
        for (const callback of entry.callbacks) { try { callback(); } catch (_) {} }
        entry.callbacks.clear();
        return ok;
      });
    }
    if (entry.status === 'loading' && typeof onReady === 'function') entry.callbacks.add(onReady);
    return entry;
  }

  function placeholder(ctx, stroke, error) {
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(stroke.x, stroke.y, stroke.width, stroke.height);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
    ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
    if (stroke.width > 160 && stroke.height > 30) {
      ctx.fillStyle = '#475569'; ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(error ? 'Изображение недоступно' : 'Загружаем изображение…', stroke.x + 10, stroke.y + 10, stroke.width - 20);
    }
  }

  // Called on the main canvas after its background, before the separate ink layer.
  function drawImages(ctx, strokes, onReady) {
    let ready = true, count = 0;
    ctx.save();
    try {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      for (const stroke of Array.isArray(strokes) ? strokes : []) {
        if (!imageGeometry(stroke)) continue;
        const entry = count++ < MAX_IMAGES ? entryFor(stroke.src, onReady) : null;
        if (entry && entry.status === 'ready') ctx.drawImage(entry.image, stroke.x, stroke.y, stroke.width, stroke.height);
        else { placeholder(ctx, stroke, !entry || entry.status === 'error'); ready = false; }
      }
    } finally { ctx.restore(); }
    return ready;
  }

  async function whenReady(strokes) {
    const images = (Array.isArray(strokes) ? strokes : []).filter(stroke => stroke && stroke.kind === 'image');
    if (images.length > MAX_IMAGES) return false;
    const loaded = await Promise.all(images.map(stroke => {
      if (!imageGeometry(stroke)) return false;
      const entry = entryFor(stroke.src);
      return entry ? entry.promise : false;
    }));
    return loaded.every(Boolean);
  }

  function checkBudget(snapshot, image) {
    const error = 'На доске уже много данных. Удалите ненужные изображения или листы перед добавлением скриншота.';
    try {
      if (!snapshot || !Array.isArray(snapshot.pages) || !snapshot.pages.length) throw new Error();
      const current = Number.isInteger(snapshot.currentPage) ? snapshot.currentPage : 0;
      if (current < 0 || current >= snapshot.pages.length || (image && !validateImage(image))) throw new Error();
      let imageCount = 0;
      const pages = snapshot.pages.map((page, i) => {
        if (!page || !Array.isArray(page.strokes)) throw new Error();
        const strokes = image && i === current ? [...page.strokes, image] : page.strokes;
        imageCount += strokes.filter(stroke => stroke && stroke.kind === 'image').length;
        return { ...page, strokes };
      });
      const bytes = new root.TextEncoder().encode(JSON.stringify({ ...snapshot, pages })).length;
      if (imageCount > MAX_IMAGES) return { ok: false, bytes, maxBytes: MAX_BOARD_BYTES,
        error: 'На доске можно разместить до 8 изображений. Удалите ненужный скриншот перед добавлением нового.' };
      return { ok: bytes <= MAX_BOARD_BYTES, bytes, maxBytes: MAX_BOARD_BYTES, error: bytes <= MAX_BOARD_BYTES ? '' : error };
    } catch (_) { return { ok: false, bytes: 0, maxBytes: MAX_BOARD_BYTES, error: 'Не удалось проверить изображение или объём доски.' }; }
  }

  return Object.freeze({ MAX_INPUT_BYTES, MAX_SIDE, MAX_SRC_LENGTH, MAX_BOARD_BYTES, MAX_IMAGES,
    importFile, validateImage, drawImages, whenReady, checkBudget, clearCache: () => cache.clear() });
});
