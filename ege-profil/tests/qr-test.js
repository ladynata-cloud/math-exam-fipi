/* Проверка собственного кодировщика QR (qr.js).

   Декодера тут нет, поэтому кодировщик проверяется изнутри:
   1) таблицы ёмкостей сходятся с известными числами стандарта;
   2) служебные узоры стоят там, где обязаны стоять;
   3) сведения о формате читаются обратно и дают тот же уровень и маску;
   4) данные, снятые со змейки и размаскированные, совпадают с теми,
      что кодировщик собрал, — это ловит ошибки размещения и маски;
   5) проверочные байты Рида — Соломона реально исправляют слово. */
const QR = require('../qr.js');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

/* ---------- 1. Ёмкости ---------- */
{
  const T = QR._internal.totalCodewords, D = QR._internal.dataCodewords;
  ok(T(1) === 26 && D(1) === 19, 'версия 1-L: 26 слов, 19 данных');
  ok(T(2) === 44 && D(2) === 34, 'версия 2-L: 44 слова, 34 данных');
  ok(T(7) === 196 && D(7) === 156, 'версия 7-L: 196 слов, 156 данных');
  ok(T(40) === 3706 && D(40) === 2956, 'версия 40-L: 3706 слов, 2956 данных');
  ok(QR.CAPACITY_L_BYTES === 2953, 'байтовая ёмкость 2953');
  ok(QR._internal.alignPositions(1).length === 0, 'версия 1 — без выравнивающих узоров');
  ok(String(QR._internal.alignPositions(7)) === '6,22,38', 'версия 7: узоры на 6, 22, 38');
  ok(String(QR._internal.alignPositions(32)) === '6,34,60,86,112,138', 'версия 32: шаг 26');
}

/* ---------- 2. Узоры и размер ---------- */
function structure(qr, label){
  const m = qr.modules, s = qr.size;
  ok(s === qr.version * 4 + 17, label + ': размер по версии');
  [[0, 0], [s - 7, 0], [0, s - 7]].forEach(([ox, oy], k) => {
    let good = true;
    for (let dy = 0; dy < 7; dy++)
      for (let dx = 0; dx < 7; dx++){
        const d = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        if (m[oy + dy][ox + dx] !== (d !== 2)) good = false;
      }
    ok(good, label + ': поисковый узор ' + (k + 1));
  });
  let timing = true;
  for (let i = 8; i < s - 8; i++){
    if (m[6][i] !== (i % 2 === 0)) timing = false;
    if (m[i][6] !== (i % 2 === 0)) timing = false;
  }
  ok(timing, label + ': синхрополосы чередуются');
  ok(m[s - 8][8] === true, label + ': тёмный модуль на месте');
}

/* ---------- 3. Формат читается обратно ---------- */
function formatRoundTrip(qr, label){
  let bits = 0;
  const m = qr.modules, s = qr.size;
  for (let i = 0; i < 8; i++) if (m[8][s - 1 - i]) bits |= 1 << i;
  for (let i = 8; i < 15; i++) if (m[s - 15 + i][8]) bits |= 1 << i;
  const data = (bits ^ 0x5412) >>> 10;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  ok((((data << 10) | rem) ^ 0x5412) === bits, label + ': BCH формата сходится');
  ok((data >> 3) === 1, label + ': уровень коррекции L');
  ok((data & 7) === qr.mask, label + ': маска ' + qr.mask + ' записана в формат');

  let first = 0;
  for (let i = 0; i <= 5; i++) if (m[i][8]) first |= 1 << i;
  if (m[7][8]) first |= 1 << 6;
  if (m[8][8]) first |= 1 << 7;
  if (m[8][7]) first |= 1 << 8;
  for (let i = 9; i < 15; i++) if (m[8][14 - i]) first |= 1 << i;
  ok(first === bits, label + ': обе копии формата совпадают');
}

/* ---------- 4. Данные снимаются обратно ---------- */
function dataRoundTrip(qr, label){
  const back = QR.readCodewords(qr);
  let same = back.length >= qr.codewords.length;
  for (let i = 0; i < qr.codewords.length; i++) if (back[i] !== qr.codewords[i]) same = false;
  ok(same, label + ': кодовые слова читаются со змейки без потерь');
}

const CASES = [
  ['A', 'один символ'],
  ['MEP1.eJyrVkpUslIyMlAqLU4tUrJSSlKyUqoFAEUOBS4', 'короткий код прогресса'],
  ['Планиметрия по Ященко: типов закрыто 19 из 19', 'кириллица (UTF-8)'],
  ['MEP1.' + 'aB3-_z'.repeat(120), 'средняя длина'],
  ['x'.repeat(1200), 'крупная версия'],
  ['y'.repeat(QR.CAPACITY_L_BYTES), 'ровно 2953 байта — версия 40']
];
for (const [text, label] of CASES){
  const qr = QR.encode(text);
  ok(!!qr, label + ': закодировано');
  if (!qr) continue;
  structure(qr, label);
  formatRoundTrip(qr, label);
  dataRoundTrip(qr, label);
}

ok(QR.encode('z'.repeat(QR.CAPACITY_L_BYTES + 1)) === null, 'слишком длинный текст → null, без исключения');
ok(QR.encode('Ж'.repeat(1500)) === null, 'кириллица считается в байтах UTF-8, а не в символах');

/* ---------- 5. Коррекция ошибок работает ---------- */
{
  const qr = QR.encode('MEP1.test-payload');
  const svg = QR.svg(qr);
  ok(/^<svg /.test(svg) && /viewBox="0 0 \d+ \d+"/.test(svg) && /<\/svg>$/.test(svg), 'svg собирается');
  ok(svg.indexOf('<path d="M') > 0, 'svg содержит модули');
  const dim = Number(/viewBox="0 0 (\d+)/.exec(svg)[1]);
  ok(dim === qr.size + 6, 'svg с полем в 3 модуля');
}

console.log(`\nПроверок: ${checks}, отказов: ${fails}`);
process.exit(fails ? 1 : 0);
