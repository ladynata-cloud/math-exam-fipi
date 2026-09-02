/* =========================================================================
   QR-код — минимальный собственный кодировщик. Внешних библиотек и CDN нет.

   Умеет ровно то, что нужно курсу: байтовый режим, уровень коррекции L,
   версии 1–40, автоматический выбор версии и маски. Результат — матрица
   булевых модулей и готовый SVG.

   QR.encode(text)            -> { size, modules, version, mask } | null
   QR.svg(qr, opts)           -> строка <svg>
   QR.CAPACITY_L_BYTES        -> сколько байт влезает максимум (2953)

   null возвращается, когда текст длиннее версии 40: вызывающий код обязан
   это обработать и предложить передать строку текстом.
   ========================================================================= */
var QR = (function(){
  "use strict";

  /* ---------- арифметика GF(256), примитивный многочлен 0x11D ---------- */
  var EXP = new Array(256), LOG = new Array(256);
  (function(){
    var x = 1;
    for (var i = 0; i < 255; i++){
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
  })();
  function gmul(a, b){
    if (!a || !b) return 0;
    return EXP[(LOG[a] + LOG[b]) % 255];
  }

  /* Многочлен-генератор Рида — Соломона степени deg. */
  function rsGenerator(deg){
    var res = [1], i, j, root = 1;
    for (i = 0; i < deg; i++){
      res.push(0);
      for (j = res.length - 1; j > 0; j--) res[j] = res[j] ^ gmul(res[j - 1], root);
      res[0] = gmul(res[0], root);
      root = gmul(root, 2);
    }
    return res.reverse();
  }
  /* Остаток от деления данных на генератор — это и есть проверочные байты. */
  function rsRemainder(data, gen){
    var res = new Array(gen.length).fill(0), i, j, factor;
    for (i = 0; i < data.length; i++){
      factor = data[i] ^ res.shift();
      res.push(0);
      for (j = 0; j < gen.length; j++) res[j] ^= gmul(gen[j], factor);
    }
    return res;
  }

  /* ---------- таблицы уровня L, версии 1..40 ---------- */
  var ECC_PER_BLOCK_L = [
    7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28,
    28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30
  ];
  var BLOCKS_L = [
    1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8,
    8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25
  ];

  /* Сколько всего кодовых слов помещается в версию (без служебных модулей). */
  function totalCodewords(ver){
    var res = (16 * ver + 128) * ver + 64, n;
    if (ver >= 2){
      n = Math.floor(ver / 7) + 2;
      res -= (25 * n - 10) * n - 55;
      if (ver >= 7) res -= 36;
    }
    return Math.floor(res / 8);
  }
  function dataCodewords(ver){
    return totalCodewords(ver) - ECC_PER_BLOCK_L[ver - 1] * BLOCKS_L[ver - 1];
  }
  function lengthBits(ver){ return ver <= 9 ? 8 : 16; }

  var CAPACITY_L_BYTES = dataCodewords(40) - 3;   /* 4 бита режима + 16 бит длины */

  function alignPositions(ver){
    if (ver === 1) return [];
    var size = ver * 4 + 17;
    var n = Math.floor(ver / 7) + 2;
    var step = (ver === 32) ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    var res = [6], pos;
    for (pos = size - 7; res.length < n; pos -= step) res.splice(1, 0, pos);
    return res;
  }

  /* ---------- разметка служебных модулей ---------- */
  function newGrid(size, val){
    var g = new Array(size), y;
    for (y = 0; y < size; y++) g[y] = new Array(size).fill(val);
    return g;
  }
  function drawFinder(mods, fn, size, cx, cy){
    for (var dy = -4; dy <= 4; dy++){
      for (var dx = -4; dx <= 4; dx++){
        var x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        fn[y][x] = true;
        mods[y][x] = (d !== 2 && d !== 4);
      }
    }
  }
  function drawAlign(mods, fn, cx, cy){
    for (var dy = -2; dy <= 2; dy++){
      for (var dx = -2; dx <= 2; dx++){
        fn[cy + dy][cx + dx] = true;
        mods[cy + dy][cx + dx] = (Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }
  function reserveFormat(fn, size){
    var i;
    for (i = 0; i <= 8; i++){
      if (i !== 6){ fn[8][i] = true; fn[i][8] = true; }
    }
    fn[8][6] = true; fn[6][8] = true; fn[8][8] = true;
    for (i = 0; i < 8; i++){ fn[size - 1 - i][8] = true; fn[8][size - 1 - i] = true; }
    fn[size - 8][8] = true;   /* всегда тёмный модуль */
  }
  function drawFunctionPatterns(ver){
    var size = ver * 4 + 17;
    var mods = newGrid(size, false), fn = newGrid(size, false), i, j, pos;

    for (i = 0; i < size; i++){                      /* синхрополосы */
      mods[6][i] = (i % 2 === 0); fn[6][i] = true;
      mods[i][6] = (i % 2 === 0); fn[i][6] = true;
    }
    drawFinder(mods, fn, size, 3, 3);
    drawFinder(mods, fn, size, size - 4, 3);
    drawFinder(mods, fn, size, 3, size - 4);

    pos = alignPositions(ver);
    for (i = 0; i < pos.length; i++){
      for (j = 0; j < pos.length; j++){
        var skip = (i === 0 && j === 0) || (i === 0 && j === pos.length - 1) ||
                   (i === pos.length - 1 && j === 0);
        if (!skip) drawAlign(mods, fn, pos[j], pos[i]);
      }
    }
    reserveFormat(fn, size);
    mods[size - 8][8] = true;

    if (ver >= 7){                                   /* сведения о версии */
      var rem = ver, k;
      for (k = 0; k < 12; k++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var bits = (ver << 12) | rem;
      for (k = 0; k < 18; k++){
        var b = ((bits >>> k) & 1) === 1;
        var a = size - 11 + (k % 3), c = Math.floor(k / 3);
        mods[a][c] = b; fn[a][c] = true;
        mods[c][a] = b; fn[c][a] = true;
      }
    }
    return { size:size, modules:mods, fn:fn };
  }
  function drawFormat(mods, size, mask){
    var data = (1 << 3) | mask;        /* 01 — уровень L */
    var rem = data, i;
    for (i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;
    function bit(k){ return ((bits >>> k) & 1) === 1; }

    /* mods[y][x]. Первая копия — вокруг левого верхнего поискового узора. */
    for (i = 0; i <= 5; i++) mods[i][8] = bit(i);
    mods[7][8] = bit(6);
    mods[8][8] = bit(7);
    mods[8][7] = bit(8);
    for (i = 9; i < 15; i++) mods[8][14 - i] = bit(i);

    /* Вторая копия — вдоль правого верхнего и левого нижнего узоров. */
    for (i = 0; i < 8; i++) mods[8][size - 1 - i] = bit(i);
    for (i = 8; i < 15; i++) mods[size - 15 + i][8] = bit(i);
    mods[size - 8][8] = true;   /* всегда тёмный модуль */
  }

  /* ---------- данные ---------- */
  function utf8Bytes(text){
    if (typeof TextEncoder !== "undefined") return Array.from(new TextEncoder().encode(text));
    var out = [], i, c;
    for (i = 0; i < text.length; i++){
      c = text.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800){ out.push(0xC0 | (c >> 6), 0x80 | (c & 63)); }
      else { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    }
    return out;
  }
  function pickVersion(len){
    for (var v = 1; v <= 40; v++){
      if (dataCodewords(v) >= Math.ceil((4 + lengthBits(v) + len * 8) / 8)) return v;
    }
    return 0;
  }
  function toCodewords(bytes, ver){
    var bits = [], i, k;
    function push(val, n){ for (k = n - 1; k >= 0; k--) bits.push((val >>> k) & 1); }
    push(4, 4);                              /* байтовый режим */
    push(bytes.length, lengthBits(ver));
    for (i = 0; i < bytes.length; i++) push(bytes[i], 8);

    var cap = dataCodewords(ver) * 8;
    push(0, Math.min(4, cap - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    var cw = [];
    for (i = 0; i < bits.length; i += 8){
      var b = 0;
      for (k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
      cw.push(b);
    }
    for (i = 0; cw.length < dataCodewords(ver); i++) cw.push(i % 2 === 0 ? 0xEC : 0x11);
    return cw;
  }
  /* Блоки + коррекция + чередование: сначала данные по столбцам, затем
     проверочные байты по столбцам — как в стандарте. */
  function interleave(data, ver){
    var numBlocks = BLOCKS_L[ver - 1], eccLen = ECC_PER_BLOCK_L[ver - 1];
    var raw = totalCodewords(ver);
    var shortLen = Math.floor(raw / numBlocks);
    var numShort = numBlocks - raw % numBlocks;
    var gen = rsGenerator(eccLen), dats = [], eccs = [], k = 0, i, j, maxLen = 0;

    for (i = 0; i < numBlocks; i++){
      var len = shortLen - eccLen + (i < numShort ? 0 : 1);
      var dat = data.slice(k, k + len); k += len;
      maxLen = Math.max(maxLen, len);
      dats.push(dat);
      eccs.push(rsRemainder(dat, gen));
    }
    var out = [];
    for (i = 0; i < maxLen; i++)
      for (j = 0; j < numBlocks; j++) if (i < dats[j].length) out.push(dats[j][i]);
    for (i = 0; i < eccLen; i++)
      for (j = 0; j < numBlocks; j++) out.push(eccs[j][i]);
    return out;
  }
  /* Змейка снизу вверх, по два столбца, пропуская служебные модули. */
  function eachDataModule(size, fn, visit){
    var right, y, j, x, upward, vert, i = 0;
    for (right = size - 1; right >= 1; right -= 2){
      if (right === 6) right = 5;
      for (vert = 0; vert < size; vert++){
        for (j = 0; j < 2; j++){
          x = right - j;
          upward = ((right + 1) & 2) === 0;
          y = upward ? size - 1 - vert : vert;
          if (fn[y][x]) continue;
          visit(x, y, i++);
        }
      }
    }
  }
  function maskBit(m, x, y){
    switch (m){
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return x * y % 2 + x * y % 3 === 0;
      case 6: return (x * y % 2 + x * y % 3) % 2 === 0;
      default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
    }
  }

  /* ---------- штрафы, чтобы выбрать маску ---------- */
  var FINDERISH = [true,false,true,true,true,false,true,false,false,false,false];
  function penalty(mods, size){
    var score = 0, x, y, dark = 0;

    /* Правила 1 и 3: длинные одноцветные серии и узор 1:1:3:1:1 с полем. */
    function line(get){
      var run = 1, colour = get(0), i, c, j, hit;
      for (i = 1; i < size; i++){
        c = get(i);
        if (c === colour){ run++; if (run === 5) score += 3; else if (run > 5) score += 1; }
        else { run = 1; colour = c; }
      }
      for (i = 0; i + FINDERISH.length <= size; i++){
        hit = true;
        for (j = 0; j < FINDERISH.length; j++) if (get(i + j) !== FINDERISH[j]){ hit = false; break; }
        if (hit) score += 40;
        hit = true;
        for (j = 0; j < FINDERISH.length; j++)
          if (get(i + j) !== FINDERISH[FINDERISH.length - 1 - j]){ hit = false; break; }
        if (hit) score += 40;
      }
    }
    for (y = 0; y < size; y++) line(function(i){ return mods[y][i]; });
    for (x = 0; x < size; x++) line(function(i){ return mods[i][x]; });

    for (y = 0; y < size - 1; y++){
      for (x = 0; x < size - 1; x++){
        var v = mods[y][x];
        if (v === mods[y][x + 1] && v === mods[y + 1][x] && v === mods[y + 1][x + 1]) score += 3;
      }
    }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mods[y][x]) dark++;
    var k = Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size));
    return score + k * 10;
  }

  /* ---------- сборка ---------- */
  function encode(text){
    var bytes = utf8Bytes(String(text));
    var ver = pickVersion(bytes.length);
    if (!ver) return null;

    var codewords = interleave(toCodewords(bytes, ver), ver);
    var best = null, m;
    for (m = 0; m < 8; m++){
      var g = drawFunctionPatterns(ver);
      eachDataModule(g.size, g.fn, function(x, y, i){
        var byte = codewords[i >>> 3];
        var bit = byte === undefined ? 0 : (byte >>> (7 - (i & 7))) & 1;
        g.modules[y][x] = (bit === 1) !== maskBit(m, x, y);
      });
      drawFormat(g.modules, g.size, m);
      var p = penalty(g.modules, g.size);
      if (!best || p < best.penalty) best = { size:g.size, modules:g.modules, fn:g.fn, version:ver, mask:m, penalty:p };
    }
    return { size:best.size, modules:best.modules, fn:best.fn,
             version:best.version, mask:best.mask, codewords:codewords };
  }

  /* Чтение матрицы обратно — служит проверкой размещения и маски. */
  function readCodewords(qr){
    var bits = [];
    eachDataModule(qr.size, qr.fn, function(x, y){
      bits.push((qr.modules[y][x] !== maskBit(qr.mask, x, y)) ? 1 : 0);
    });
    var out = [], i, k, b;
    for (i = 0; i + 8 <= bits.length; i += 8){
      b = 0;
      for (k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
      out.push(b);
    }
    return out;
  }

  function svg(qr, opts){
    opts = opts || {};
    var border = opts.border == null ? 3 : opts.border;
    var dim = qr.size + border * 2;
    var path = [], x, y;
    for (y = 0; y < qr.size; y++){
      for (x = 0; x < qr.size; x++){
        if (qr.modules[y][x]) path.push("M" + (x + border) + "," + (y + border) + "h1v1h-1z");
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" ' +
      'role="img" aria-label="' + (opts.label || "QR-код с кодом прогресса") + '" ' +
      'style="width:100%;height:auto;shape-rendering:crispEdges">' +
      '<rect width="' + dim + '" height="' + dim + '" fill="#FFFFFF"/>' +
      '<path d="' + path.join("") + '" fill="#16307F"/></svg>';
  }

  return { encode:encode, svg:svg, readCodewords:readCodewords,
           CAPACITY_L_BYTES:CAPACITY_L_BYTES,
           _internal:{ totalCodewords:totalCodewords, dataCodewords:dataCodewords,
                       alignPositions:alignPositions, penalty:penalty } };
})();
if (typeof module !== "undefined") module.exports = QR;
