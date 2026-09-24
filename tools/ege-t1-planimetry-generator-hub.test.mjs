#!/usr/bin/env node
/* Гейт хаба генератора планиметрии (задание 1 профильного ЕГЭ) — голый Node, без зависимостей.

   Зачем. Курс (ege-profil/trainers/planimetry-t1.html) и trainers/ege-t1-planimetry-trainer.html
   пишут под общим TID «ege-t1-planimetry-generator» запись types[i] = {best:-1, …} уже при первой
   ошибке, до первой завершённой серии. Генератор показывал на карточке типа «лучшее: -1 / 4».

   Что проверяет. Из каждой копии генератора — trainers/…html, downloads/…html и html внутри
   downloads/…-package.zip — вырезаются функции bestBadge и renderHub и выполняются отдельно от
   страницы:
     • bestBadge: null, undefined, -1 и мусор → «ещё не тренировался»; 0 → «лучшее: 0 / 4»;
       3 → «лучшее: 3 / 4»; 4 → класс g; мусор не попадает в разметку;
     • renderHub на записи, как её оставляет курс: карточка с best:-1 — «ещё не тренировался»,
       нигде нет «лучшее: -…»; бейдж марафона не показывает -1 и мусор;
     • bestBadge и renderHub во всех копиях совпадают.
   Архив разбирается встроенным кодом (центральный каталог → локальный заголовок → inflateRaw),
   CRC-32 сверяется.

   Запуск:  node tools/ege-t1-planimetry-generator-hub.test.mjs [файл.html|архив.zip …]
   Без аргументов берутся три копии из репозитория. Успех — маркер PLANIMETRY_GENERATOR_HUB_OK
   и код 0; при ошибке — PLANIMETRY_GENERATOR_HUB_FAIL и код 1. */
import {readFileSync} from 'node:fs';
import {inflateRawSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DL = 'downloads/trainers/ege-t1-planimetry-generator/';
const DEFAULT_SOURCES = [
  'trainers/ege-t1-planimetry-generator.html',
  DL + 'ege-t1-planimetry-generator.html',
  DL + 'ege-t1-planimetry-generator-package.zip',
];
const NOT_YET = 'ещё не тренировался';

let bad = 0, checks = 0;
const err = m => { console.log('  ✗ ' + m); bad++; };
const ok = (cond, m) => { checks++; if (!cond) err(m); };

/* ---------- zip: только чтение, без зависимостей ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

function readZipHtml(buf, label) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xFFFF); i--) if (buf.readUInt32LE(i) === 0x06054B50) { eocd = i; break; }
  if (eocd < 0) throw new Error(label + ': нет конца центрального каталога');
  const total = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const htmls = [];
  for (let k = 0; k < total; k++) {
    if (buf.readUInt32LE(p) !== 0x02014B50) throw new Error(label + ': битая запись каталога');
    const method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32);
    const lh = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nl);
    p += 46 + nl + el + cl;
    if (!name.endsWith('.html')) continue;
    if (buf.readUInt32LE(lh) !== 0x04034B50) throw new Error(label + ': битый локальный заголовок ' + name);
    const start = lh + 30 + buf.readUInt16LE(lh + 26) + buf.readUInt16LE(lh + 28);
    const raw = buf.subarray(start, start + csize);
    const data = method === 8 ? inflateRawSync(raw) : method === 0 ? raw : null;
    if (!data) throw new Error(label + ': метод сжатия ' + method + ' не поддержан');
    if (data.length !== usize || crc32(data) !== crc) throw new Error(label + ': CRC/размер не сходятся у ' + name);
    htmls.push({name, text: data.toString('utf8')});
  }
  if (htmls.length !== 1) throw new Error(label + ': в архиве ожидался ровно один html, найдено ' + htmls.length);
  return htmls[0];
}

function loadSource(rel) {
  const file = path.resolve(root, rel);
  const buf = readFileSync(file);
  if (file.toLowerCase().endsWith('.zip')) {
    const {name, text} = readZipHtml(buf, rel);
    return {label: rel + ' → ' + name, text};
  }
  return {label: rel, text: buf.toString('utf8')};
}

/* ---------- вырезание функции по имени (скобки вне строк и комментариев) ---------- */
function cutFunction(src, name, label) {
  const head = 'function ' + name + '(';
  const first = src.indexOf(head);
  if (first < 0 || src.indexOf(head, first + 1) >= 0) throw new Error(label + ': function ' + name + ' должна встречаться ровно один раз');
  let i = src.indexOf('{', first), depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
    } else if (c === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
    } else if (c === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i) + 1;
    } else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return src.slice(first, i + 1).replace(/\r\n/g, '\n');
  }
  throw new Error(label + ': не найден конец function ' + name);
}

const badgeText = html => html.replace(/<[^>]+>/g, '');
const badgeClass = html => (html.match(/class="([^"]*)"/) || [])[1];

function checkSource({label, text}) {
  console.log('• ' + label);
  const consts = text.match(/const TYPE_N=(\d+), MARATHON_N=(\d+);/);
  ok(!!consts, 'нет строки const TYPE_N=…, MARATHON_N=…;');
  const TYPE_N = consts ? +consts[1] : 4, MARATHON_N = consts ? +consts[2] : 8;
  ok(TYPE_N === 4 && MARATHON_N === 8, `TYPE_N=${TYPE_N}, MARATHON_N=${MARATHON_N}; ожидались 4 и 8 (как в курсе)`);
  const tidOk = /const TID='ege-t1-planimetry-generator';/.test(text);
  ok(tidOk, 'TID генератора изменился');

  const badgeSrc = cutFunction(text, 'bestBadge', label);
  const hubSrc = cutFunction(text, 'renderHub', label);
  const bestBadge = new Function(badgeSrc + '\nreturn bestBadge;')();

  /* bestBadge: значения из задания */
  const notYet = [null, undefined, -1];
  for (const v of notYet) {
    const h = bestBadge(v, TYPE_N);
    ok(badgeText(h) === NOT_YET && badgeClass(h) === 'best n', `bestBadge(${v}) = ${h}; ожидалось «${NOT_YET}»`);
  }
  const shown = [[0, 'лучшее: 0 / 4', 'best n'], [3, 'лучшее: 3 / 4', 'best n'], [4, 'лучшее: 4 / 4', 'best g']];
  for (const [v, t, cls] of shown) {
    const h = bestBadge(v, TYPE_N);
    ok(badgeText(h) === t && badgeClass(h) === cls, `bestBadge(${v}) = ${h}; ожидалось «${t}», класс ${cls}`);
  }
  /* мусор из localStorage / кода прогресса не доходит до разметки */
  for (const v of [-4, NaN, Infinity, -Infinity, 'abc', '<img src=x onerror=alert(1)>', {}, [], true]) {
    const h = bestBadge(v, TYPE_N);
    ok(badgeText(h) === NOT_YET && !/<img|onerror|NaN|Infinity|-\d/.test(h),
      `bestBadge(${typeof v === 'object' || typeof v === 'string' ? JSON.stringify(v) : String(v)}) = ${h}`);
  }

  /* renderHub на записи, какую оставляет курс */
  const runHub = store => {
    const nodes = {};
    const $ = id => (nodes[id] = nodes[id] || {innerHTML: ''});
    const TYPE_META = Array.from({length: 8}, (_, i) => ({name: 'Тип ' + (i + 1), desc: 'описание ' + (i + 1)}));
    const fn = new Function('$', 'readStore', 'TID', 'TYPE_META', 'TYPE_N', 'MARATHON_N', 'bestBadge',
      hubSrc + '\nrenderHub(); return $("hub").innerHTML;');
    return fn($, () => store, 'ege-t1-planimetry-generator', TYPE_META, TYPE_N, MARATHON_N, bestBadge);
  };
  const cards = h => h.split('<div class="tcard">').slice(1);
  const mbest = h => ((h.match(/<span class="mbest">([\s\S]*?)<\/span>/) || [])[1]);

  const courseLike = {'ege-t1-planimetry-generator': {runs: 0, best: 0, events: [], types: {
    0: {best: -1, hist: [], mastery: 0, err: 1, recogErr: 0},
    1: {best: 3, hist: [3]},
    2: {best: 4, hist: [2, 4], mastery: 3, err: 0, recogErr: 0},
    3: {best: -1, hist: [], mastery: 1, err: 2, recogErr: 1},
  }}};
  let h = runHub(courseLike), cs = cards(h);
  ok(cs.length === 8, 'карточек типов ' + cs.length + ', ожидалось 8');
  ok(cs[0] && cs[0].includes('>' + NOT_YET + '<'), 'карточка 1 (best:-1): нет «' + NOT_YET + '»');
  ok(cs[1] && cs[1].includes('>лучшее: 3 / 4<'), 'карточка 2 (best:3): нет «лучшее: 3 / 4»');
  ok(cs[2] && cs[2].includes('class="best g">лучшее: 4 / 4<'), 'карточка 3 (best:4): нет класса g');
  ok(cs[3] && cs[3].includes('>' + NOT_YET + '<'), 'карточка 4 (best:-1): нет «' + NOT_YET + '»');
  ok(cs.slice(4).every(c => c.includes('>' + NOT_YET + '<')), 'карточки 5–8 без записи: не «' + NOT_YET + '»');
  ok(!/лучшее: -/.test(h), 'в хабе осталось «лучшее: -…»');
  ok(mbest(h) === 'лучшее: 0 / 8', 'бейдж марафона при best:0 = ' + JSON.stringify(mbest(h)) + ' (поведение до правки: «лучшее: 0 / 8»)');

  h = runHub({});
  ok(cards(h).every(c => c.includes('>' + NOT_YET + '<')) && mbest(h) === '', 'пустое хранилище: не все карточки «' + NOT_YET + '» или непустой бейдж марафона');
  for (const garbage of [-1, 'abc', NaN, null]) {
    h = runHub({'ege-t1-planimetry-generator': {best: garbage}});
    ok(mbest(h) === '', 'бейдж марафона при best=' + String(garbage) + ': ' + JSON.stringify(mbest(h)));
  }
  h = runHub({'ege-t1-planimetry-generator': {best: 6, hist: [6]}});
  ok(mbest(h) === 'лучшее: 6 / 8', 'бейдж марафона при best:6 = ' + JSON.stringify(mbest(h)));

  return {badgeSrc, hubSrc};
}

const rels = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_SOURCES;
const extracted = [];
for (const rel of rels) {
  try { extracted.push({rel, ...checkSource(loadSource(rel))}); }
  catch (e) { err(rel + ': ' + e.message); }
}
if (extracted.length > 1) {
  const [first, ...rest] = extracted;
  for (const x of rest) {
    ok(x.badgeSrc === first.badgeSrc, 'bestBadge в ' + x.rel + ' отличается от ' + first.rel);
    ok(x.hubSrc === first.hubSrc, 'renderHub в ' + x.rel + ' отличается от ' + first.rel);
  }
}
console.log(`копий ${extracted.length} из ${rels.length}, проверок ${checks}, ошибок ${bad}`);
if (bad || extracted.length !== rels.length) { console.log('PLANIMETRY_GENERATOR_HUB_FAIL'); process.exit(1); }
console.log('PLANIMETRY_GENERATOR_HUB_OK');
