#!/usr/bin/env node
/* Гейт «Кнопки сброса стирают только свой прогресс» — голый Node, без зависимостей.

   Зачем. Карта «ОГЭ 1–5» (trainers/oge-1-5-trainers/practice-1-5-map.html), её копия в
   downloads/ (и обе карты внутри архива) и trainers/python-for-nested-if-trainer.html по кнопке
   «Сбросить» делали localStorage.removeItem('mathExamCourseProgress.v1') — вместе со своим
   прогрессом пропадали курс профильного ЕГЭ (/ege-profil/), журнал ошибок mistakes, student,
   пробник full-exam и прогресс всех остальных тренажёров сайта.

   Что проверяет.
     1. Закреплённые списки своего (EXPECTED ниже — фикстура гейта, а не список со страницы):
        свои ветки верхнего уровня, свои ветки внутри topics и собственные отдельные ключи
        тренажёров каждой страницы. Независимая сверка с кодом (writesOf): для каждой карточки
        карты открывается её тренажёр (в дереве или в архиве) и из его кода извлекается, куда
        он пишет, — ветки общего ключа верхнего уровня, внутри topics (в том числе через
        псевдоним tp = d.topics, деструктуризацию и функцию-сохранитель), журнал mistakes и
        отдельные ключи localStorage. Запись, которую разобрать нельзя, — ошибка «не разобрано»,
        а не молчаливый «верхний уровень». Объединение обязано совпасть с фикстурой. Каждый
        отдельный ключ фикстуры не встречается ни в одной другой странице сайта.
     2. Засев чужого: все TID, которые страницы пишут в mathExamCourseProgress.v1 (константы
        TID/TOPIC/TOPIC_ID…, "topicId", tid:, data-topic, записи, найденные writesOf), — на
        верхний уровень, в topics и в mistakes «<TID>|…»; student, full-exam, full-exam-active,
        ключи с похожими именами; и все ключи localStorage/sessionStorage, которые страницы
        сайта называют в getItem/setItem/removeItem литералом, константой или склейкой, кроме
        своих. После сброса чужое побайтно цело, удалены ровно свои отдельные ключи (равенство
        с фикстурой), и сброс не обращался ни к каким ключам, кроме общего и своих.
     3. Вырезанная функция resetOwnProgress (блок между маркерами, одинаковый во всех копиях)
        отдельно от страницы: удаляет ровно своё, чужое побайтно цело; мусор в общем ключе
        заменяется на {}; отказ getItem/setItem/removeItem — ответ 'failed' без исключений.
     4. Весь встроенный скрипт страницы в песочнице (заглушки DOM, confirm, location):
        «Сбросить» с принятым confirm — ровно своё удалено, чужое цело, карта перезагружается;
        отказ в confirm — ничего не меняется; мусор — ключ очищен, сообщение ученику;
        отказ хранилища — сообщение ученику, без перезагрузки. Python: после сброса состояние
        в памяти тоже сброшено — первое действие ученика не возвращает старый прогресс.
     5. Мутации (каждая обязана покраснеть): карта сбрасывает только data-topic; старый
        removeItem; чужой TID/ветка/ключ в своих, в том числе отдельный ключ другого тренажёра
        сайта и ключ, которого на сайте нет; ошибка записи молча; мусор не чистится; Python не
        сбрасывает состояние в памяти; без min-height 44px и без aria-live.
     6. Сканер по репозиторию (эвристика): html и js вне tools/ и тестов плюс html/js внутри
        zip в downloads/. Каждая операция над общим ключом получает вид (KINDS): removeItem,
        clear, delete localStorage, присваивание localStorage[ключ], запись литерала или заново
        собранного объекта, запись значения другого ключа, возврат своей резервной копии
        (.backup), удаление или обнуление всего mistakes/topics в объекте, который затем пишется
        в общий ключ, removeItem с неразобранным ключом. Ключ распознаётся в любых формах:
        литерал, шаблонная строка, склейка, константа и её псевдонимы, obj.KEY, переменная цикла
        по массиву литералов. Обычная запись «прочитал — поправил — записал»
        (setItem(KEY, JSON.stringify(<имя или цепочка>[, …]))) нарушением не считается.
        Разрешения ALLOWED — по файлу и виду операции, без закреплённого числа срабатываний;
        каждое обязано найтись хотя бы раз. Блок сброса, равный эталонному, из скана
        исключается (номера строк в отчёте совпадают с файлом). Сканер и writesOf сами
        проверяются на синтетических образцах.
     7. Доступность, статически: кнопка сброса — <button>, её min-height по каскаду CSS
        страницы (селекторы, специфичность, порядок, @media) ≥ 44px; у сообщения о сбросе
        есть aria-live.

   Запуск:  node tools/reset-own-progress.test.mjs [--root <каталог репозитория>]
   Успех — маркер RESET_OWN_PROGRESS_OK и код 0; при ошибке — RESET_OWN_PROGRESS_FAIL и код 1. */
import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {inflateRawSync} from 'node:zlib';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const argv = process.argv.slice(2);
const root = argv[0] === '--root' && argv[1]
  ? path.resolve(argv[1])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const KEY = 'mathExamCourseProgress.v1';
const ZIP = 'downloads/trainers/oge-1-5-trainers/oge-1-5-trainers-package.zip';
const MAP_DIR = 'trainers/oge-1-5-trainers';
const START = '/*__RESET_OWN_PROGRESS_START__*/';
const END = '/*__RESET_OWN_PROGRESS_END__*/';
const MUST_SAY = ['этой страницы', 'Прогресс других тренажёров и курса ЕГЭ сохранится'];

/* ---------- фикстура: что своё у каждой страницы ---------- */
/* Сверено по коду тренажёров карты (см. п. 1): каждый пишет ветку верхнего уровня с именем
   data-topic своей карточки; «Листы» (practice-1-5-paper-sheets.html) — ещё и
   topics.practicePaperSheetsTrainer; у процентов, участков, тарифов, шин и схемы дорог есть
   свой отдельный ключ, из которого они при следующем открытии переписывают свою ветку. */
const MAP_KEYS = ['percentTrainer.v1', 'landPlotsTrainer.v2', 'tariffsTrainer.v2', 'tiresTrainerV2', 'ogeRoadsTrainer.v2'];
const MAP9 = ['percentTableTrainer', 'practiceRoadsGridTrainer', 'practiceRoadsSchemaTrainer', 'practiceTiresTrainer',
  'practiceStovesTrainer', 'practiceLandPlotsTrainer', 'practiceApartmentsTrainer', 'practiceTariffsTrainer',
  'practicePaperSheetsTrainer'];
const MAP12 = ['practiceEntryDiagnostic2026', 'practicePlanReadingTrainer', 'practiceRoutesCheckpoint2026', ...MAP9];
const EXPECTED = {
  site: {tids: MAP12, topics: ['practicePaperSheetsTrainer'], keys: MAP_KEYS},
  pkg: {tids: MAP9, topics: ['practicePaperSheetsTrainer'], keys: MAP_KEYS},
  python: {tids: [], topics: ['pythonForNestedIfTrainer'], keys: []},
};
const SOURCES = [
  {rel: 'trainers/oge-1-5-trainers/practice-1-5-map.html', kind: 'map', own: EXPECTED.site, links: {dir: MAP_DIR}},
  {rel: 'downloads/trainers/oge-1-5-trainers/oge-1-5-trainers.html', kind: 'map', own: EXPECTED.pkg, links: {zip: ZIP}},
  {rel: ZIP, entry: 'practice-1-5-map.html', kind: 'map', own: EXPECTED.pkg, links: {zip: ZIP}},
  {rel: ZIP, entry: 'oge-1-5-trainers.html', kind: 'map', own: EXPECTED.pkg, links: {zip: ZIP}},
  {rel: 'trainers/python-for-nested-if-trainer.html', kind: 'python', own: EXPECTED.python},
];
/* кнопка сброса и элемент, куда страница пишет сообщение о сбросе */
const A11Y = {map: {btn: 'reset-btn', msg: 'reset-msg'}, python: {btn: 'reset', msg: 'msg'}};

/* Виды операций сканера (п. 6). */
const KINDS = {
  'remove-key': 'removeItem общего ключа',
  'remove-unresolved': 'removeItem с неразобранным ключом в файле с общим ключом',
  'clear': 'localStorage.clear()',
  'delete-storage': 'delete localStorage',
  'assign-key': 'присваивание localStorage[общий ключ]',
  'set-literal': 'общий ключ перезаписан литералом или заново собранным объектом',
  'set-copy': 'общий ключ перезаписан значением другого ключа',
  'set-raw': 'общий ключ перезаписан значением, которое не разобрать',
  'backup-swap': 'общий ключ заменён резервной копией (.backup), которую этот же файл кладёт перед заменой',
  'mistakes-wipe': 'весь журнал mistakes удалён или обнулён в объекте, который затем пишется в общий ключ',
  'topics-wipe': 'вся ветка topics удалена или обнулена в объекте, который затем пишется в общий ключ',
};
/* Намеренные операции над всем журналом или всем ключом — не сброс страницы.
   Разрешение — по файлу и виду операции; каждое обязано найтись хотя бы раз. */
const ALLOWED = [
  {file: 'ege-profil/review.html', kind: 'mistakes-wipe',
    why: 'кнопка «Стереть весь журнал ошибок»: из прочитанного объекта удаляется только ветка mistakes, остальное записывается обратно'},
  {file: 'ege-profil/progress-code.js', kind: 'backup-swap',
    why: 'загрузка кода прогресса: loadInto кладёт прежний прогресс в .backup и заменяет ключ, restoreBackup возвращает .backup'},
  {file: 'ege-profil/trainers/pryamougolny-treugolnik-trenazher.html', kind: 'backup-swap',
    why: 'встроенная копия progress-code.js (loadInto/restoreBackup)'},
];
const STRUCTURAL = new Set(['topics', 'mistakes', 'student', 'full-exam', 'full-exam-active', KEY, '__proto__', 'constructor', 'prototype']);
const TID_ANCHORS = [...MAP12, 'pythonForNestedIfTrainer', 'derivative-t8', 'ege-t1-planimetry-generator', 'righttri-t1',
  'parameters-t18', 'numbers-t19', 'ogeBasicsRounding', 'trigSumToProductTrainer', 'oge13InequalitiesSeries',
  'creditPaymentTableTrainer', 'negativeNumbersAlternative', 'longDivisionStepwise'];
/* ключи, которые сбор ключей сайта обязан найти (иначе засев чужих ключей неполон) */
const KEY_ANCHORS = [KEY, KEY + '.backup', ...MAP_KEYS, 'ep_progress_v1', 'ogeInfoTrainerStats', 'courseTeacherMode',
  'oge17_stats', 'mathExamRoadsGridSession.v1'];

let bad = 0, checks = 0;
const err = m => { console.log('  ✗ ' + m); bad++; };
const ok = (cond, m) => { checks++; if (!cond) err(m); return !!cond; };
const clone = v => JSON.parse(JSON.stringify(v));
const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x)
  ? Object.keys(x).sort().reduce((o, key) => { o[key] = x[key]; return o; }, {}) : x);
const same = (a, b) => canon(a) === canon(b);
const sameSet = (a, b) => same([...new Set(a)].sort(), [...new Set(b)].sort());
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------- zip: только чтение, без зависимостей ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

function readZip(buf, label) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xFFFF); i--) if (buf.readUInt32LE(i) === 0x06054B50) { eocd = i; break; }
  if (eocd < 0) throw new Error(label + ': нет конца центрального каталога');
  const total = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let k = 0; k < total; k++) {
    if (buf.readUInt32LE(p) !== 0x02014B50) throw new Error(label + ': битая запись каталога');
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32);
    const lh = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nl).toString(flags & 0x800 ? 'utf8' : 'latin1');
    p += 46 + nl + el + cl;
    if (buf.readUInt32LE(lh) !== 0x04034B50) throw new Error(label + ': битый локальный заголовок ' + name);
    const start = lh + 30 + buf.readUInt16LE(lh + 26) + buf.readUInt16LE(lh + 28);
    const raw = buf.slice(start, start + csize);
    const data = method === 0 ? raw : method === 8 ? inflateRawSync(raw) : null;
    if (!data) throw new Error(label + ': неизвестный метод сжатия у ' + name);
    if (crc32(data) !== crc) throw new Error(label + ': CRC не сходится у ' + name);
    files.set(name, data);
  }
  return files;
}
const zipCache = new Map();
function zipFiles(rel) {
  if (!zipCache.has(rel)) zipCache.set(rel, readZip(readFileSync(path.join(root, rel)), rel));
  return zipCache.get(rel);
}
function loadSource(src) {
  if (!src.entry) return readFileSync(path.join(root, src.rel), 'utf8');
  const data = zipFiles(src.rel).get(src.entry);
  if (!data) throw new Error('в архиве нет ' + src.entry);
  return data.toString('utf8');
}
const label = src => src.entry ? src.rel + '!' + src.entry : src.rel;

/* ---------- файлы репозитория (html/js вне tools/ и тестов + html/js в zip из downloads/) ---------- */
const SKIP_DIRS = new Set(['.git', 'node_modules', 'tools', 'tests', '_istochniki', 'video-worker', 'board-server']);
function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(full, out); }
    else if (/\.(html?|m?js|zip)$/i.test(name)) out.push(full);
  }
  return out;
}
function repoFiles() {
  const out = [];
  for (const full of walk(root, [])) {
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (/\.zip$/i.test(rel)) {
      if (!rel.startsWith('downloads/')) continue;
      let entries;
      try { entries = readZip(readFileSync(full), rel); } catch (e) { err(rel + ': ' + e.message); continue; }
      for (const [name, data] of entries) if (/\.(html?|m?js)$/i.test(name)) out.push({rel: rel + '!' + name, text: data.toString('utf8')});
      continue;
    }
    out.push({rel, text: readFileSync(full, 'utf8')});
  }
  return out;
}

/* ---------- разбор кода ---------- */
/* Все вырезания заменяются тем же числом переводов строк: номера строк в отчёте = номера в файле. */
const onlyNl = s => s.replace(/[^\n]/g, '');
function prep(text) {
  let t = text.replace(/\/\*[\s\S]*?\*\//g, m => ' ' + onlyNl(m)).replace(/(^|[\s;{}])\/\/[^\n]*/g, '$1');
  let prev;
  do {
    prev = t;
    t = t.replace(/(['"`])((?:(?!\1)[^\\\n$])*)\1\s*\+\s*(['"`])((?:(?!\3)[^\\\n$])*)\3/g,
      (m, q1, a, q2, b) => KEY.includes(a + b) ? "'" + a + b + "'" + onlyNl(m) : m);
  } while (t !== prev);
  return t.split('`' + KEY + '`').join("'" + KEY + "'");
}
const ID = String.raw`[A-Za-z_$][\w$]*`;
const ACC = String.raw`(?:\s*\.\s*[A-Za-z_$][\w$]*|\s*\[[^\[\]]*\])`;
const CHAIN_ONLY = new RegExp(`^${ID}${ACC}*$`);
const normChain = s => s.replace(/\s+/g, '');

/* Индекс скобки, закрывающей t[open] (одна из «([{»), с учётом строк; -1 — не найдена. */
function closeOf(t, open, limit = 20000) {
  let depth = 0, q = null;
  const end = Math.min(t.length, open + limit);
  for (let i = open; i < end; i++) {
    const c = t[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { if (--depth === 0) return i; }
  }
  return -1;
}
/* Части s, разделённые символом sep вне скобок и строк. */
function splitTop(s, sep) {
  const out = [];
  let depth = 0, start = 0, q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === sep && depth === 0) { out.push(s.slice(start, i)); start = i + 1; }
  }
  out.push(s.slice(start));
  return out;
}
/* Аргументы вызова, t[open] === '('. */
function callArgs(t, open) {
  const close = closeOf(t, open, 6000);
  if (close < 0) return null;
  return {args: splitTop(t.slice(open + 1, close), ',').map(a => a.trim()), end: close};
}
/* Выражение с позиции i до «;», «,», перевода строки вне скобок или до закрывающей скобки. */
function exprAt(t, i, limit = 4000) {
  let depth = 0, q = null;
  const end = Math.min(t.length, i + limit);
  for (let j = i; j < end; j++) {
    const c = t[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { if (--depth < 0) return t.slice(i, j); }
    else if (depth === 0 && (c === ';' || c === ',' || c === '\n')) return t.slice(i, j);
  }
  return t.slice(i, end);
}

/* Значения выражения-ключа: литерал, шаблон (подстановки — только известные имена), имя или
   obj.имя с известными литеральными значениями, склейка этих частей через «+».
   null — не разобрать. */
function keyValues(expr, lit) {
  let e = String(expr).trim();
  while (e.startsWith('(') && closeOf(e, 0) === e.length - 1) e = e.slice(1, -1).trim();
  if (!e) return null;
  let acc = [''];
  for (const raw of splitTop(e, '+')) {
    const s = raw.trim();
    let vals = null, m;
    if ((m = /^(['"])((?:(?!\1)[^\\\n])*)\1$/.exec(s))) vals = [m[2]];
    else if ((m = /^`([^`\\]*)`$/.exec(s))) vals = templateValues(m[1], lit);
    else if ((m = new RegExp(`^(?:${ID}\\s*\\.\\s*)*(${ID})$`).exec(s)) && lit.has(m[1])) vals = [...lit.get(m[1])];
    if (!vals) return null;
    const next = [];
    for (const a of acc) for (const v of vals) next.push(a + v);
    if (next.length > 64) return null;
    acc = next;
  }
  return new Set(acc);
}
function templateValues(body, lit) {
  let acc = [''];
  for (const part of body.split(/(\$\{[^}]*\})/)) {
    if (!part) continue;
    let vals;
    const sub = new RegExp(`^\\$\\{\\s*(?:${ID}\\s*\\.\\s*)*(${ID})\\s*\\}$`).exec(part);
    if (sub) { if (!lit.has(sub[1])) return null; vals = [...lit.get(sub[1])]; }
    else if (part.startsWith('${')) return null;
    else vals = [part];
    const next = [];
    for (const a of acc) for (const v of vals) next.push(a + v);
    if (next.length > 64) return null;
    acc = next;
  }
  return acc;
}
/* Имя → множество строковых значений: литералы, затем имена и склейки из уже известных. */
function bindings(t) {
  const lit = new Map();
  const put = (n, v) => {
    if (!lit.has(n)) lit.set(n, new Set());
    const s = lit.get(n);
    if (s.has(v) || s.size >= 64) return false;
    s.add(v);
    return true;
  };
  for (const m of t.matchAll(/["']?([A-Za-z_$][\w$]*)["']?\s*[:=]\s*(?<q>['"`])(?<v>(?:(?!\k<q>)[^\\\n])*)\k<q>(?!\s*[+.[(])/g)) {
    if (m.groups.q === '`' && m.groups.v.includes('${')) continue;
    put(m[1], m.groups.v);
  }
  const cands = [];
  for (const m of t.matchAll(/\b([A-Za-z_$][\w$]*)["']?\s*[:=](?![=>])\s*([^,;\n{}()?:=]+?)\s*(?=[,;\n})])/g)) {
    const rhs = m[2];
    if (!/[A-Za-z_$]/.test(rhs) || /^(['"`])[^'"`]*\1$/.test(rhs)) continue;
    const parts = splitTop(rhs, '+').map(s => s.trim());
    if (parts.every(p => /^(['"])[^'"\\\n]*\1$/.test(p) || new RegExp(`^(?:${ID}\\s*\\.\\s*)*${ID}$`).test(p) || /^`[^`\\]*`$/.test(p))) cands.push([m[1], rhs]);
  }
  for (let round = 0, grew = true; grew && round < 6; round++) {
    grew = false;
    for (const [name, rhs] of cands) {
      const v = keyValues(rhs, lit);
      if (v) for (const x of v) if (put(name, x)) grew = true;
    }
  }
  return lit;
}
/* Имя → списки элементов массивов-литералов, которые ему присвоены. */
function arrayBindings(t) {
  const arr = new Map();
  for (const m of t.matchAll(/\b([A-Za-z_$][\w$]*)\s*[:=]\s*\[/g)) {
    const open = m.index + m[0].length - 1;
    const close = closeOf(t, open, 4000);
    if (close < 0) continue;
    if (!arr.has(m[1])) arr.set(m[1], []);
    arr.get(m[1]).push(splitTop(t.slice(open + 1, close), ',').map(s => s.trim()).filter(Boolean));
  }
  return arr;
}
/* Значения переменной цикла name: [..].forEach(name => …) или for (const name of [..]). */
function loopValues(t, pos, name, lit) {
  const head = t.slice(Math.max(0, pos - 600), pos), n = reEsc(name);
  const cands = [];
  for (const m of head.matchAll(new RegExp(`(\\[[^\\[\\]]*\\]|${ID}(?:\\s*\\.\\s*${ID})*)\\s*\\.\\s*forEach\\(\\s*(?:function\\s*\\(\\s*${n}\\b|\\(\\s*${n}\\b|${n}\\s*=>)`, 'g'))) cands.push([m.index, m[1]]);
  for (const m of head.matchAll(new RegExp(`\\bfor\\s*\\(\\s*(?:const|let|var)?\\s*${n}\\s+of\\s+(\\[[^\\[\\]]*\\]|${ID}(?:\\s*\\.\\s*${ID})*)\\s*\\)`, 'g'))) cands.push([m.index, m[1]]);
  if (!cands.length) return null;
  const src = cands.sort((a, b) => a[0] - b[0]).pop()[1];
  const lists = src.startsWith('[') ? [splitTop(src.slice(1, -1), ',').map(s => s.trim()).filter(Boolean)]
    : arrayBindings(t).get(/([A-Za-z_$][\w$]*)$/.exec(src)[1]);
  if (!lists) return null;
  const out = new Set();
  for (const list of lists) for (const it of list) {
    const v = keyValues(it, lit);
    if (!v) return null;
    v.forEach(x => out.add(x));
  }
  return out;
}
/* Вызовы getItem/setItem/removeItem: имя метода, позиция, аргументы, получатель. */
function storageCalls(t) {
  const out = [];
  for (const m of t.matchAll(/\.\s*(getItem|setItem|removeItem)\s*\(/g)) {
    const c = callArgs(t, m.index + m[0].length - 1);
    if (!c) continue;
    const rm = /([A-Za-z_$][\w$]*)\s*$/.exec(t.slice(Math.max(0, m.index - 60), m.index));
    out.push({fn: m[1], i: m.index, args: c.args, end: c.end, recv: rm ? rm[1] : '', text: t.slice(m.index, c.end + 1)});
  }
  return out;
}
/* name — параметр какой-нибудь функции файла (function f(name), (name) =>, name =>, метод). */
function isParamIn(t, name) {
  const n = reEsc(name);
  const P = String.raw`\([^()]*?(?<![\w$.])${n}(?![\w$])[^()]*\)`;
  return new RegExp(String.raw`\bfunction\b\s*[\w$]*\s*${P}`).test(t)
    || new RegExp(`${P}\\s*=>`).test(t)
    || new RegExp(String.raw`(?<![\w$.])${n}\s*=>`).test(t)
    || new RegExp(String.raw`(?<![\w$.])(?!(?:if|for|while|switch|with|catch|function|return)\b)[A-Za-z_$][\w$]*\s*${P}\s*\{`).test(t);
}
/* Глубина фигурных скобок на участке [a, b), начиная с 1 (внутри тела); 0 — тело закрылось. */
function depthBetween(t, a, b) {
  let d = 1, q = null;
  for (let i = a; i < b; i++) {
    const c = t[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') d++;
    else if (c === '}' && --d === 0) return 0;
  }
  return d;
}
const FN_HEAD = new RegExp([
  String.raw`(?<![\w$.])(?<n1>[A-Za-z_$][\w$]*)\s*[:=]\s*function\b\s*[\w$]*\s*\((?<p1>[^()]*)\)\s*\{`,
  String.raw`\bfunction\b\s*(?<n2>[A-Za-z_$][\w$]*)?\s*\((?<p2>[^()]*)\)\s*\{`,
  String.raw`(?<![\w$.])(?<n3>[A-Za-z_$][\w$]*)\s*[:=]\s*(?:async\s+)?(?:\((?<p3>[^()]*)\)|(?<p4>[A-Za-z_$][\w$]*))\s*=>\s*(?<b1>\{)?`,
  String.raw`(?<![\w$.])(?!(?:if|for|while|switch|with|catch|function|return)\b)(?<n4>[A-Za-z_$][\w$]*)\s*\((?<p5>[^()]*)\)\s*\{`,
].join('|'), 'g');
/* Ближайшая открытая функция вокруг позиции pos: {at, name, params} или null (верхний уровень). */
function enclosingFunction(t, pos) {
  const from = Math.max(0, pos - 6000);
  const heads = [...t.slice(from, pos).matchAll(FN_HEAD)];
  for (let k = heads.length - 1; k >= 0; k--) {
    const m = heads[k], g = m.groups, end = from + m.index + m[0].length;
    const arrowExpr = g.n3 !== undefined && !g.b1;
    if (arrowExpr ? /[;\n]/.test(t.slice(end, pos)) : depthBetween(t, end, pos) < 1) continue;
    const params = (g.p1 ?? g.p2 ?? g.p3 ?? g.p4 ?? g.p5 ?? '').split(',').map(p => p.replace(/=[\s\S]*$/, '').trim()).filter(Boolean);
    return {at: from + m.index, name: g.n1 || g.n2 || g.n3 || g.n4 || null, params};
  }
  return null;
}
const normBlock = s => s.replace(/\r\n/g, '\n').split('\n').map(l => l.trim()).join('\n');
function stripBlock(text, canonical) {
  if (!canonical) return text;
  let out = text, a;
  while ((a = out.indexOf(START)) >= 0) {
    const b = out.indexOf(END, a);
    if (b < 0 || normBlock(out.slice(a, b + END.length)) !== canonical) break;
    out = out.slice(0, a) + onlyNl(out.slice(a, b + END.length)) + out.slice(b + END.length);
  }
  return out;
}

/* ---------- куда пишет страница (writesOf) ---------- */
/* Корень — объект, который целиком уходит в запись общего ключа (setItem(KEY, JSON.stringify(корень))
   или вызов функции-сохранителя с ним). В окне от чтения общего ключа до записи разбираются
   псевдонимы корня, его веток и деструктуризация; запись через объект, связь которого с
   корнем не видна, и любое иное использование всей ветки topics — «не разобрано». */
const GLOBALS = new Set(['document', 'window', 'location', 'console', 'Math', 'JSON', 'navigator', 'globalThis', 'self', 'history', 'performance']);
function writesOf(text) {
  const t = prep(text);
  const lit = bindings(t);
  const one = e => { const v = keyValues(e, lit); return v && v.size === 1 ? [...v][0] : null; };
  const isShared = e => { const v = keyValues(e, lit); return !!v && v.has(KEY); };
  const res = {top: new Set(), topics: new Set(), keys: new Set(), mistakes: false, unresolved: []};
  const calls = storageCalls(t);
  for (const c of calls) {
    if (c.fn !== 'setItem' || c.recv !== 'localStorage') continue;
    const v = keyValues(c.args[0] || '', lit);
    if (!v) res.unresolved.push('localStorage.setItem(' + c.args[0] + ', …)');
    else for (const k of v) if (k !== KEY) res.keys.add(k);
  }
  for (const m of t.matchAll(/\blocalStorage\s*\[/g)) res.unresolved.push('localStorage[…] (' + t.slice(m.index, m.index + 40) + ')');
  for (const m of t.matchAll(/CourseProgress\s*\.\s*write\(\s*([^,()]+?)\s*,/g)) {
    const v = one(m[1]);
    if (v === null) res.unresolved.push('CourseProgress.write(' + m[1] + ')'); else res.top.add(v);
  }
  const gets = calls.filter(c => c.fn === 'getItem' && isShared(c.args[0] || '')).map(c => c.i);
  const writes = [];
  for (const c of calls) {
    if (c.fn !== 'setItem' || !isShared(c.args[0] || '')) continue;
    const v = (c.args[1] || '').trim();
    const js = /^JSON\s*\.\s*stringify\s*\(/.exec(v);
    const inner = js && callArgs(v, js[0].length - 1);
    const rootText = inner && inner.args[0];
    if (!rootText || !CHAIN_ONLY.test(rootText)) { res.unresolved.push('запись общего ключа не из объекта-переменной: ' + c.text.slice(0, 80)); continue; }
    const r = normChain(rootText);
    const fn = !/[.[]/.test(r) && isParamIn(t, r) ? enclosingFunction(t, c.i) : null;
    if (fn && fn.params.includes(r)) {                // функция-сохранитель: разбираются места вызова
      if (!fn.name) { res.unresolved.push('безымянная функция пишет свой параметр ' + r + ' в общий ключ'); continue; }
      const idx = fn.params.indexOf(r);
      let used = 0;
      for (const m of t.matchAll(new RegExp(`(?<![\\w$])${reEsc(fn.name)}\\s*\\(`, 'g'))) {
        if (m.index >= fn.at && m.index < c.i) continue;   // сама функция
        const ca = callArgs(t, m.index + m[0].length - 1);
        if (!ca || /^\s*\{/.test(t.slice(ca.end + 1, ca.end + 6))) continue;
        const a = ca.args[idx];
        if (!a || !CHAIN_ONLY.test(a)) { res.unresolved.push(fn.name + '(' + (a || '') + ') — не разобрано, что пишется в общий ключ'); continue; }
        writes.push({at: m.index, root: normChain(a)});
        used++;
      }
      if (!used) res.unresolved.push('функция ' + fn.name + ' пишет параметр в общий ключ, вызовов не найдено');
      continue;
    }
    writes.push({at: c.i, root: r});
  }
  for (const w of writes) {
    const before = gets.filter(i => i < w.at);
    const g = before.length ? before[before.length - 1] : -1;
    if (g < 0 || w.at - g > 3000) { res.unresolved.push('запись общего ключа без чтения перед ней: ' + t.slice(w.at, w.at + 60)); continue; }
    const ws = Math.max(t.lastIndexOf(';', g), t.lastIndexOf('{', g), t.lastIndexOf('}', g), t.lastIndexOf('\n', g)) + 1;
    analyzeWindow(t, t.slice(ws, w.at), w.root, one, res);
  }
  return res;
}
/* Ключи верхнего уровня объектного литерала: {a: …, 'b': …, [X]: …, c, ...d}. */
function objectKeys(litText, one) {
  const out = [];
  for (const item of splitTop(litText.slice(1, -1), ',')) {
    const s = item.trim();
    if (!s) continue;
    if (s.startsWith('...')) { out.push({spread: s.slice(3).trim()}); continue; }
    let m;
    if ((m = /^\[([\s\S]*?)\]\s*:\s*([\s\S]*)$/.exec(s))) out.push({key: one(m[1]), value: m[2].trim()});
    else if ((m = /^(['"])([^'"]*)\1\s*:\s*([\s\S]*)$/.exec(s))) out.push({key: m[2], value: m[3].trim()});
    else if ((m = /^([A-Za-z_$][\w$]*)\s*:\s*([\s\S]*)$/.exec(s))) out.push({key: m[1], value: m[2].trim()});
    else if ((m = /^([A-Za-z_$][\w$]*)$/.exec(s))) out.push({key: m[1], value: m[1]});
    else out.push({key: null, value: s});
  }
  return out;
}
function analyzeWindow(t, win, rootChain, one, res) {
  const roots = [rootChain];
  const alias = new Map();          // имя → путь от корня (имена веток; null — не разобрано)
  const locals = new Set(), unclear = new Set();
  const un = m => res.unresolved.push(m.replace(/\s+/g, ' ').slice(0, 140));
  const walkPath = (p, rest) => {
    let m;
    while (rest && (m = /^(?:\.([A-Za-z_$][\w$]*)|\[([^\[\]]*)\])/.exec(rest))) { p.push(m[1] !== undefined ? m[1] : one(m[2])); rest = rest.slice(m[0].length); }
    return rest ? null : p;
  };
  const pathOf = chainText => {
    const c = normChain(chainText);
    for (const r of roots) if (c === r || c.startsWith(r + '.') || c.startsWith(r + '[')) return walkPath([], c.slice(r.length));
    const base = /^[A-Za-z_$][\w$]*/.exec(c)[0];
    return alias.has(base) ? walkPath(alias.get(base).slice(), c.slice(base.length)) : null;
  };
  const literalWrites = litText => {           // корень переприсвоен литералом (заготовка или слияние)
    for (const it of objectKeys(litText, one)) {
      if (it.spread !== undefined) { if (!pathOf(it.spread) || pathOf(it.spread).length) un('переприсваивание корня со spread ' + it.spread); continue; }
      if (it.key === null) { un('переприсваивание корня: ключ не разобран: ' + it.value); continue; }
      if ((it.key === 'topics' || it.key === 'mistakes') && /^(\{\s*\}|\[\s*\])$/.test(it.value)) continue;
      if (it.key === 'mistakes') { res.mistakes = true; continue; }
      if (it.key === 'topics') {
        if (!it.value.startsWith('{')) { un('переприсваивание корня: topics = ' + it.value); continue; }
        for (const k of objectKeys(it.value, one)) { if (k.key === null || k.spread !== undefined) un('topics в литерале не разобран'); else res.topics.add(k.key); }
        continue;
      }
      res.top.add(it.key);
    }
  };
  const HEAD = new RegExp(`^\\(?\\s*(${ID}${ACC}*)`);
  const events = [];
  for (const m of win.matchAll(new RegExp(`(?<![\\w$.])(?:(?:const|let|var)\\s+)?(${ID})\\s*=(?![=>])\\s*`, 'g'))) events.push({i: m.index, kind: 'assign', m});
  for (const m of win.matchAll(new RegExp(`\\b(?:const|let|var)\\s*\\{([^{}]*)\\}\\s*=\\s*(${ID}${ACC}*)`, 'g'))) events.push({i: m.index, kind: 'destr', m});
  events.sort((a, b) => a.i - b.i);
  for (const {kind, m} of events) {
    if (kind === 'destr') {
      const p = pathOf(m[2]);
      for (const part of m[1].split(',')) {
        const mm = /^\s*([A-Za-z_$][\w$]*)\s*(?::\s*([A-Za-z_$][\w$]*))?/.exec(part);
        if (!mm) continue;
        if (p) alias.set(mm[2] || mm[1], p.concat([mm[1]])); else locals.add(mm[2] || mm[1]);
      }
      continue;
    }
    const name = m[1];
    if (['const', 'let', 'var', 'return', 'typeof', 'new'].includes(name)) continue;
    const rhs = exprAt(win, m.index + m[0].length).trim();
    if (roots.includes(name)) {
      for (const part of splitTop(rhs, '|')) { const s = part.trim(); if (s.startsWith('{') && closeOf(s, 0) === s.length - 1) literalWrites(s); }
      continue;
    }
    const h = HEAD.exec(rhs);
    const p = h ? pathOf(h[1]) : null;
    if (p) { if (!p.length) roots.push(name); else alias.set(name, p); continue; }
    /* правая часть упоминает корень или его псевдоним не как путь (pick(d), f(d.topics)) —
       куда указывает имя, не видно */
    const mentions = [...roots.map(r => r.split(/[.[]/)[0]), ...alias.keys()];
    if (mentions.some(n => new RegExp(`(?<![\\w$.])${reEsc(n)}(?![\\w$])`).test(rhs))) { unclear.add(name); continue; }
    locals.add(name);
  }
  /* записи в члены: X.a = …, X[k] = …, X.a[b] += … */
  for (const m of win.matchAll(new RegExp(`(?<![\\w$.])(${ID}${ACC}+)\\s*(?:[-+*/%&|^]|\\*\\*|<<|>>>?|\\?\\?|\\|\\||&&)?=(?![=>])`, 'g'))) {
    const chain = m[1];
    const p = pathOf(chain);
    if (!p) {
      const base = /^[A-Za-z_$][\w$]*/.exec(chain)[0];
      if (!unclear.has(base) && (locals.has(base) || GLOBALS.has(base))) continue;
      if (!unclear.has(base) && new RegExp(`\\b(?:const|let|var)\\s+${reEsc(base)}\\s*=\\s*(?:\\{|\\[|new\\s|['"\`\\d-])`).test(t)) continue;
      un('запись ' + normChain(chain) + ' = … — не видно, связан ли объект с общим ключом');
      continue;
    }
    if (!p.length) continue;
    if (p[0] === null) { un('запись ' + normChain(chain) + ' = … — ключ ветки не разобран'); continue; }
    if (p[0] === 'mistakes') { res.mistakes = true; continue; }
    if (p[0] === 'topics') {
      if (p.length === 1) {
        const rhs = exprAt(win, m.index + m[0].length);
        const cut = Math.max(win.lastIndexOf(';', m.index), win.lastIndexOf('}', m.index), win.lastIndexOf('{', m.index));
        const pre = win.slice(cut + 1, m.index);
        const guarded = (/\b(?:if|while)\b/.test(pre) || /(?:\|\||\?\?)\s*\(\s*$/.test(pre)) && /topics/.test(pre);
        if (!/\btopics\b/.test(rhs) && !(guarded && /^\s*(\{\s*\}|\[\s*\])\s*$/.test(rhs))) un('ветка topics перезаписана целиком: ' + win.slice(m.index, m.index + 60));
        continue;
      }
      if (p[1] === null) un('запись ' + normChain(chain) + ' = … — ветка topics не разобрана'); else res.topics.add(p[1]);
      continue;
    }
    res.top.add(p[0]);
  }
  /* вся ветка topics корня: допустимы только запись, чтение-проверка и псевдоним */
  for (const m of win.matchAll(new RegExp(`(?<![\\w$.])(${ID}${ACC}*?)\\s*(?:\\.\\s*topics\\b|\\[\\s*(['"\`])topics\\2\\s*\\])(?!\\s*(?:\\.|\\[|\\())`, 'g'))) {
    const p = pathOf(m[1]);
    if (!p || p.length) continue;
    const s = m.index, e = m.index + m[0].length;
    const before = win.slice(Math.max(0, s - 40), s), after = win.slice(e, e + 12);
    const fine = /^\s*(?:[-+*/%&|^]|\*\*|\?\?|\|\||&&)?=(?![=>])/.test(after)
      || /^\s*(?:&&|\|\||\?\?|\?(?![.?]))/.test(after)
      || /(?:!|\btypeof\s+|\bin\s+|\b(?:isObj|isObject|isPlainObject)\s*\(\s*|Array\s*\.\s*isArray\s*\(\s*)$/.test(before)
      || new RegExp(`(?<![\\w$.])${ID}\\s*=\\s*\\(?\\s*$`).test(before)
      || (/\b(?:if|while)\s*\(\s*$/.test(before) && /^\s*\)/.test(after));
    if (!fine) un('ветка topics используется не только для записи своей ветки: ' + win.slice(s, e + 24));
  }
  for (const m of win.matchAll(new RegExp(`Object\\s*\\.\\s*assign\\(\\s*(${ID}${ACC}*)\\s*,`, 'g'))) {
    if (pathOf(m[1])) un('Object.assign в объект общего ключа: ' + win.slice(m.index, m.index + 60));
  }
  if (/\bmistakes\b/.test(win)) res.mistakes = true;
}

/* Все TID, которые страницы сайта пишут в общий ключ (для засева чужих веток). */
function collectTids(files, canonical) {
  const tids = new Map();
  const ID_NAME = /^(?:TID|TOPIC|TOPIC_ID|TOPIC_KEY|TRAINER_ID|topicId|tid|[A-Z_]*_(?:TID|TOPIC|TOPIC_ID))$/;
  const add = (v, rel) => {
    if (!/^[A-Za-z][\w.-]{1,80}$/.test(v) || STRUCTURAL.has(v)) return;
    if (!tids.has(v)) tids.set(v, new Set());
    tids.get(v).add(rel);
  };
  for (const {rel, text} of files) {
    if (!text.includes('mathExamCourseProgress')) continue;
    const t = prep(stripBlock(text, canonical));
    for (const m of t.matchAll(/["']?([A-Za-z_$][\w$]*)["']?\s*[:=]\s*(?<q>['"])(?<v>[^'"\n]*)\k<q>/g)) if (ID_NAME.test(m[1])) add(m.groups.v, rel);
    for (const m of t.matchAll(/\b(?:data-topic|data-tid|tid)\s*=\s*"([^"]+)"/g)) add(m[1], rel);
    const w = writesOf(stripBlock(text, canonical));
    for (const v of [...w.top, ...w.topics]) add(v, rel);
  }
  return tids;
}
/* Все ключи localStorage/sessionStorage, которые страницы сайта называют в getItem/setItem/
   removeItem литералом, константой, склейкой или шаблоном из известных имён. */
function collectSiteKeys(files) {
  const keys = new Map();
  for (const {rel, text} of files) {
    if (!/(?:local|session)Storage/.test(text)) continue;
    const t = prep(text), lit = bindings(t);
    const recv = new Set(['localStorage', 'sessionStorage']);
    for (const m of t.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*=\s*(?:window\s*\.\s*)?(?:localStorage|sessionStorage)\b(?!\s*\.)/g)) recv.add(m[1]);
    for (const c of storageCalls(t)) {
      if (!recv.has(c.recv)) continue;
      const v = keyValues(c.args[0] || '', lit);
      if (!v) continue;
      for (const k of v) if (/^\S{1,160}$/.test(k)) { if (!keys.has(k)) keys.set(k, new Set()); keys.get(k).add(rel); }
    }
  }
  return keys;
}

/* ---------- засев хранилища ---------- */
const OWN_TOP_SHAPES = {
  practiceEntryDiagnostic2026: {solved: 7, total: 10, completed: true, attempts: 2, bestScore: 8, lastScore: 7, weakTopics: ['routes']},
  practicePlanReadingTrainer: {solved: 6, total: 10, lastScore: 6, bestScore: 6, completed: false, attempts: 1},
  practiceRoutesCheckpoint2026: {solved: 9, total: 10, bestScore: 9, completed: true, attempts: 3},
  percentTableTrainer: {solved: 3, total: 5},
  practiceRoadsGridTrainer: {solved: 4, streak: 2, total: 120},
  practiceRoadsSchemaTrainer: {solved: 5, total: 18},
  practiceTiresTrainer: {solved: 2, total: 147},
  practiceStovesTrainer: {solved: 3, solvedList: ['g1:0', 'g1:1', 'g2:0'], streak: 1, total: 40},
  practiceLandPlotsTrainer: {solved: 2, total: 5},
  practiceApartmentsTrainer: {solved: 3, total: 10, solvedList: [0, 1, 2], streak: 3},
  practiceTariffsTrainer: {solved: 1, total: 5},
  practicePaperSheetsTrainer: {solved: 3, total: 6},
};
const OWN_TOPIC_SHAPES = {
  practicePaperSheetsTrainer: {perType: {a4: {solvedCount: 3, freshStreak: 1, mastered: true}}, solved: 3, total: 6, attempts: 11, lastTouch: 1727000000000},
  pythonForNestedIfTrainer: {i: 2, step: 0, built: [], tries: 7, right: 5, solved: {even_gt10: true, pos_div3: true}, total: 7, homeworkSolved: 2, homeworkTotal: 10, lastAt: '2026-09-20T10:00:00.000Z'},
};
const OWN_KEY_SEEDS = {
  'percentTrainer.v1': '{"version":2,"perType":{"find":3},"learnDone":true,"checkpointBest":{"standard":4}}',
  'landPlotsTrainer.v2': '{"perType":{"area":3,"scale":2},"streak":2,"vcount":1}',
  'tariffsTrainer.v2': '{"perType":{"cost":3},"streak":1,"vcount":2}',
  'tiresTrainerV2': '{"selectedCode":"v1","mode":"learn","byCode":{"v1":{"solvedSteps":[true,true,false,false,false,false,false],"streak":2,"currentStep":2}}}',
  'ogeRoadsTrainer.v2': '{"solved":{"v1#1":true,"v1#2":true},"streak":2}',
};
/* синтетические чужие ключи в дополнение к ключам сайта */
const FOREIGN_KEYS = {'unrelated.key': 'keep', [KEY + '.backup']: '{"student":{"name":"до загрузки"}}', courseTeacherMode: '1', 'percentTrainer.v2': '{"x":1}'};
let SITE_KEYS = new Set();

function buildSeed(own, foreignTids) {
  const kept = {
    student: {name: 'Ученик', cls: '11А'},
    'full-exam': {attempts: [{primary: 9, test: 52, at: 1727000000000}]},
    'full-exam-active': {started: 1727000000000, answers: {1: '5'}},
    mistakes: {'derivative-t8|extrema': {w: 2, r: 0, lastWrong: 1, last: 1}, 'righttri-t1|t5-seg30': {w: 1, r: 1, lastWrong: 2, last: 2}},
    topics: {},
  };
  for (const t of foreignTids) {
    kept[t] = {solved: 1, total: 3, seed: 'чужое'};
    kept.topics[t] = {total: 2, right: 1, seed: 'чужое'};
    kept.mistakes[t + '|p1'] = {w: 1, r: 0, lastWrong: 3, last: 3};
  }
  kept['ege-t1-planimetry-generator'] = {types: {0: {best: 3, hist: [3], mastery: 0, err: 1, recogErr: 0}}, runs: 2, best: 6};
  kept['derivative-t8'] = {solvedByType: {extrema: 4}, passed: false};
  const names = [...own.tids, ...own.topics];
  for (const t of names) {                      // похожие на свои, но чужие
    kept[t + 'X'] = {solved: 1};
    kept[t.toUpperCase()] = {solved: 2};
    kept.topics[t + 'X'] = {total: 1};
    kept.mistakes[t + 'X|a'] = {w: 1, r: 0};
    kept.mistakes['x' + t + '|a'] = {w: 1, r: 0};
    kept.mistakes[t] = {w: 1, r: 0};
  }
  /* свой TID в чужом месте — не своё: topics[TID карточки] пишет только архивная копия
     квартир, а на верхний уровень pythonForNestedIfTrainer никто не пишет */
  for (const t of own.tids) if (!own.topics.includes(t)) kept.topics[t] = {solvedTasks: [1], seed: 'архивная копия'};
  for (const t of own.topics) if (!own.tids.includes(t)) kept[t] = {solved: 1, seed: 'не своё место'};
  const seeded = clone(kept);
  for (const t of own.tids) seeded[t] = OWN_TOP_SHAPES[t] || {solved: 2, total: 10};
  for (const t of own.topics) seeded.topics[t] = OWN_TOPIC_SHAPES[t] || {total: 3, right: 2};
  for (const t of names) {
    seeded.mistakes[t + '|p1'] = {w: 2, r: 0, lastWrong: 5, last: 5};
    seeded.mistakes[t + '|'] = {w: 1, r: 1, lastWrong: 6, last: 6};
  }
  /* чужие ключи — все ключи сайта, кроме общего и своих; свои — ровно фикстура */
  const ownKeys = {}, otherKeys = {};
  for (const k of SITE_KEYS) if (k !== KEY && !own.keys.includes(k)) otherKeys[k] = '{"seed":"чужой ключ сайта","key":' + JSON.stringify(k) + '}';
  for (const [k, v] of Object.entries(FOREIGN_KEYS)) if (!own.keys.includes(k)) otherKeys[k] = v;
  for (const k of MAP_KEYS) if (!own.keys.includes(k)) otherKeys[k] = OWN_KEY_SEEDS[k];
  for (const k of own.keys) ownKeys[k] = OWN_KEY_SEEDS[k] || '{"seed":"свой ключ"}';
  return {seeded, kept, ownKeys, otherKeys};
}

function makeStorage(initial, opts = {}) {
  const map = new Map(Object.entries(initial || {}));
  const log = {get: 0, getKeys: [], set: [], remove: [], clear: 0};
  const reset = () => { log.getKeys.length = 0; log.set.length = 0; log.remove.length = 0; };
  return {
    log, map, opts, reset,
    getItem(k) { log.get++; log.getKeys.push(String(k)); if (opts.getThrows) throw new Error('SecurityError'); return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { if (opts.setThrows) throw new Error('QuotaExceededError'); log.set.push(k); map.set(k, String(v)); },
    removeItem(k) { if (opts.removeThrows) throw new Error('SecurityError'); log.remove.push(k); map.delete(k); },
    clear() { log.clear++; map.clear(); },
    key(i) { return [...map.keys()][i] ?? null; },
    get length() { return map.size; },
  };
}
function diffHint(a, b) {
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === 'topics' || k === 'mistakes') {
      const x = a[k] || {}, y = b[k] || {};
      for (const j of new Set([...Object.keys(x), ...Object.keys(y)])) if (!same(x[j], y[j])) out.push(k + '.' + j + (j in x ? (j in y ? ' изменена' : ' лишняя') : ' пропала'));
    } else if (!same(a[k], b[k])) out.push(k + (k in a ? (k in b ? ' изменена' : ' лишняя') : ' пропала'));
  }
  return out.length ? ': ' + out.slice(0, 8).join('; ') + (out.length > 8 ? ' … всего ' + out.length : '') : '';
}
/* Хранилище после сброса: общий ключ = kept, свои ключи удалены, чужие побайтно целы,
   удалено ровно своё, прочитано только общее и своё. */
function storageVerdict(st, sd, want) {
  const shared = st.map.has(KEY) ? st.map.get(KEY) : null;
  let after = null;
  try { after = JSON.parse(shared); } catch (e) { /* мусор */ }
  if (!after || typeof after !== 'object') { want(false, 'общий ключ после сброса: ' + JSON.stringify(shared && shared.slice(0, 60))); return; }
  want(same(after, sd.kept), 'после сброса общий ключ ≠ «чужое без своего»' + diffHint(after, sd.kept));
  for (const k of Object.keys(sd.ownKeys)) want(!st.map.has(k), 'свой отдельный ключ ' + k + ' не удалён');
  const changed = Object.entries(sd.otherKeys).filter(([k, v]) => st.map.get(k) !== v).map(([k]) => k);
  want(!changed.length, 'чужие ключи localStorage изменены или удалены: ' + JSON.stringify(changed.slice(0, 6)) + (changed.length > 6 ? ' … всего ' + changed.length : ''));
  want(st.log.clear === 0, 'вызван localStorage.clear()');
  want(st.log.set.every(k => k === KEY), 'записаны другие ключи: ' + st.log.set.filter(k => k !== KEY).join(', '));
  want(sameSet(st.log.remove, Object.keys(sd.ownKeys)), 'removeItem вызван для ' + JSON.stringify(st.log.remove) + ', свои ключи фикстуры ' + JSON.stringify(Object.keys(sd.ownKeys)));
  const reads = new Set([KEY, ...Object.keys(sd.ownKeys)]);
  const stray = [...new Set(st.log.getKeys)].filter(k => !reads.has(k));
  want(!stray.length, 'сброс обращался к ключам вне своих: ' + JSON.stringify(stray));
}

/* ---------- 3. вырезанная функция ---------- */
function extractBlock(html, lbl) {
  const a = html.indexOf(START), b = html.indexOf(END);
  if (a < 0 || b < 0 || b < a) throw new Error(lbl + ': нет блока ' + START + ' … ' + END);
  if (html.indexOf(START, a + 1) >= 0) throw new Error(lbl + ': блок сброса встречается дважды');
  return html.slice(a, b + END.length);
}

function checkFunction(block, own, foreign, lbl) {
  const ctx = vm.createContext({});
  vm.runInContext(block + '\nthis.resetOwnProgress = resetOwnProgress;', ctx, {filename: lbl + '#resetOwnProgress'});
  const reset = ctx.resetOwnProgress;
  if (!ok(typeof reset === 'function', lbl + ': resetOwnProgress не функция')) return;
  const t = m => lbl + ': функция: ' + m;
  const want = (c, m) => ok(c, t(m));
  const sd = buildSeed(own, foreign);
  const ownArg = () => ({tids: own.tids.slice(), topics: own.topics.slice(), keys: own.keys.slice()});

  const st = makeStorage({[KEY]: JSON.stringify(sd.seeded), ...sd.ownKeys, ...sd.otherKeys});
  let r;
  try { r = reset(KEY, ownArg(), st); } catch (e) { err(t('исключение на засеянном хранилище: ' + e.message)); return; }
  want(r === 'reset', 'на засеянном хранилище ответ ' + r + ', ожидалось reset');
  want(st.log.set.length === 1, 'общий ключ записан ' + st.log.set.length + ' раз');
  storageVerdict(st, sd, want);

  /* повторный сброс — своего нет, ничего не пишется */
  const snap = canon([...st.map]);
  st.reset();
  r = reset(KEY, ownArg(), st);
  want(r === 'reset' && st.log.set.length === 0 && st.log.remove.length === 0 && canon([...st.map]) === snap, 'повторный сброс что-то записал или ответ ' + r);

  /* мусор в общем ключе — заменяется на {}, свои отдельные ключи удаляются, чужое цело */
  for (const junk of ['', 'not json', '{', '5', '[1,2]', '"str"', 'null', 'true']) {
    const js = makeStorage({[KEY]: junk, ...sd.ownKeys, ...sd.otherKeys});
    let thrown = null;
    try { r = reset(KEY, ownArg(), js); } catch (e) { thrown = e; }
    want(!thrown, 'мусор ' + JSON.stringify(junk) + ' → исключение ' + (thrown && thrown.message));
    want(r === 'cleaned' && js.map.get(KEY) === '{}', 'мусор ' + JSON.stringify(junk) + ' → ответ ' + r + ', ключ ' + JSON.stringify(js.map.get(KEY)));
    for (const k of Object.keys(sd.ownKeys)) want(!js.map.has(k), 'мусор ' + JSON.stringify(junk) + ': свой ключ ' + k + ' не удалён');
    const changed = Object.entries(sd.otherKeys).filter(([k, v]) => js.map.get(k) !== v).map(([k]) => k);
    want(!changed.length, 'мусор ' + JSON.stringify(junk) + ': чужие ключи изменены: ' + JSON.stringify(changed.slice(0, 6)));
  }
  /* ключа нет — ничего не создаётся */
  const empty = makeStorage({...sd.otherKeys});
  r = reset(KEY, ownArg(), empty);
  want(r === 'reset' && !empty.map.has(KEY) && empty.log.set.length === 0, 'без общего ключа: ответ ' + r + ', записей ' + empty.log.set.length);
  /* мусор внутри объекта: mistakes и topics не объекты — не трогаем, своё верхнего уровня убираем */
  const odd = {mistakes: 7, topics: 'x', student: {name: 'У'}};
  for (const tid of own.tids) odd[tid] = {solved: 1};
  const os = makeStorage({[KEY]: JSON.stringify(odd)});
  try {
    reset(KEY, ownArg(), os);
    const got = JSON.parse(os.map.get(KEY));
    want(got.mistakes === 7 && got.topics === 'x' && same(got.student, {name: 'У'}), 'мусорные mistakes/topics или student изменены');
    want(own.tids.every(tid => !(tid in got)), 'при мусорных mistakes/topics своя ветка не удалена');
  } catch (e) { err(t('мусорные mistakes/topics → исключение ' + e.message)); }
  /* хранилище недоступно или переполнено: ответ failed, исключений нет */
  for (const o of [{getThrows: true}, {setThrows: true}, {removeThrows: true}]) {
    const ts = makeStorage({[KEY]: JSON.stringify(sd.seeded), ...sd.ownKeys, ...sd.otherKeys}, o);
    let thrown = null;
    try { r = reset(KEY, ownArg(), ts); } catch (e) { thrown = e; }
    const name = Object.keys(o)[0];
    if (name === 'removeThrows' && !own.keys.length) { want(!thrown && r === 'reset', name + ' без своих ключей → ' + r); continue; }
    want(!thrown && r === 'failed', name + ' → ' + (thrown ? 'исключение ' + thrown.message : 'ответ ' + r));
    if (name !== 'removeThrows') {
      want(ts.map.get(KEY) === JSON.stringify(sd.seeded), name + ' → общий ключ изменён');
      for (const k of Object.keys(sd.ownKeys)) want(ts.map.has(k), name + ' → свой ключ ' + k + ' удалён при несостоявшемся сбросе');
    }
  }
  /* пустой own — ничего не пишется */
  const es = makeStorage({[KEY]: JSON.stringify(sd.seeded)});
  r = reset(KEY, undefined, es);
  want(r === 'reset' && es.log.set.length === 0 && es.log.remove.length === 0, 'без own что-то записано');
  /* общий ключ в own.keys не удаляется */
  const ks = makeStorage({[KEY]: JSON.stringify(sd.seeded)});
  reset(KEY, {keys: [KEY]}, ks);
  want(ks.map.get(KEY) === JSON.stringify(sd.seeded), 'own.keys с общим ключом стёр общий ключ');
}

/* ---------- 4. вся страница в песочнице ---------- */
function makeEl(id) {
  const cls = new Set();
  return {
    id: id || '', textContent: '', innerHTML: '', value: '', disabled: false, hidden: false, className: '',
    style: {}, dataset: {}, children: [], listeners: {},
    classList: {
      add: (...c) => c.forEach(x => cls.add(x)), remove: (...c) => c.forEach(x => cls.delete(x)),
      toggle: (c, f) => { const on = f === undefined ? !cls.has(c) : !!f; if (on) cls.add(c); else cls.delete(c); return on; },
      contains: c => cls.has(c),
    },
    addEventListener(tp, fn) { (this.listeners[tp] = this.listeners[tp] || []).push(fn); },
    appendChild(c) { this.children.push(c); return c; },
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {}, focus() {}, closest() { return null; },
    scrollIntoView() {},
  };
}
function parseCards(html) {
  const cards = [];
  for (const m of html.matchAll(/<[a-z]+\b[^>]*\bdata-topic="([^"]+)"[^>]*>/gi)) {
    const card = makeEl();
    card.dataset.topic = m[1];
    const hm = /\bhref="([^"]*)"/i.exec(m[0]); if (hm) card.href = hm[1];
    const dm = /\bdata-diagnostic="([^"]*)"/i.exec(m[0]); if (dm) card.dataset.diagnostic = dm[1];
    const cm = /\bdata-color="([^"]*)"/i.exec(m[0]); if (cm) card.dataset.color = cm[1];
    const inner = new Map();
    card.querySelector = sel => { if (!inner.has(sel)) inner.set(sel, makeEl()); return inner.get(sel); };
    cards.push(card);
  }
  return cards;
}
const inlineScripts = html => [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

function runPage(html, src, storage, confirmAnswer) {
  const byId = new Map(), docListeners = {};
  const cards = parseCards(html);
  const confirms = [];
  let reloads = 0;
  const document = {
    getElementById(id) { if (!byId.has(id)) byId.set(id, makeEl(id)); return byId.get(id); },
    querySelectorAll(sel) { return sel === '.card[data-topic]' ? cards.slice() : []; },
    querySelector() { return makeEl(); },
    createElement() { return makeEl(); },
    addEventListener(tp, fn) { (docListeners[tp] = docListeners[tp] || []).push(fn); },
    body: makeEl(), documentElement: makeEl(),
  };
  const ctx = vm.createContext({
    document, localStorage: storage, console: {log() {}, warn() {}, error() {}, info() {}},
    confirm: msg => { confirms.push(String(msg)); return confirmAnswer; },
    alert() {}, location: {reload: () => { reloads++; }, search: '', hash: '', href: 'https://mathexam.space/'},
    navigator: {}, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, matchMedia: () => ({matches: false, addEventListener() {}}),
    scrollTo() {},
  });
  ctx.window = ctx;
  if (src.entry) {
    const pj = zipFiles(src.rel).get('progress.js');
    if (pj) vm.runInContext(pj.toString('utf8'), ctx, {filename: label(src) + '#progress.js'});
  }
  inlineScripts(html).forEach((code, i) => vm.runInContext(code, ctx, {filename: label(src) + '#script' + i}));
  const docClick = btn => {
    btn.closest = () => btn;
    const fns = docListeners.click || [];
    if (!fns.length) throw new Error('нет обработчика click на document');
    fns.forEach(fn => fn({target: btn}));
  };
  const click = () => {
    if (src.kind === 'map') {
      const fns = (byId.get('reset-btn') || {listeners: {}}).listeners.click || [];
      if (!fns.length) throw new Error('на #reset-btn нет обработчика click');
      fns.forEach(fn => fn({target: byId.get('reset-btn')}));
    } else docClick(makeEl('reset'));
  };
  const openTask = n => { const b = makeEl(); b.dataset.task = String(n); docClick(b); };
  const text = id => String((byId.get(id) || {textContent: ''}).textContent);
  return {click, openTask, text, confirms, cards, reloads: () => reloads};
}

/* Возвращает список найденных нарушений (пустой — всё хорошо). */
function checkPage(html, src, own, foreign) {
  const fails = [];
  const want = (cond, m) => { if (!cond) fails.push(m); };
  const sd = buildSeed(own, foreign);
  const fresh = opts => makeStorage({[KEY]: JSON.stringify(sd.seeded), ...sd.ownKeys, ...sd.otherKeys}, opts);
  const noteOf = page => page.text(A11Y[src.kind].msg);
  const foreignChanged = st => Object.entries(sd.otherKeys).filter(([k, v]) => st.map.get(k) !== v).map(([k]) => k);

  /* нажали «Сбросить» и приняли confirm */
  let st = fresh();
  try {
    const page = runPage(html, src, st, true);
    if (src.kind === 'python') want(page.text('tries') === '7', 'до сброса на странице не видно засеянных попыток: ' + page.text('tries'));
    st.reset();
    page.click();
    want(page.confirms.length === 1, 'confirm вызван ' + page.confirms.length + ' раз');
    for (const s of MUST_SAY) want((page.confirms[0] || '').includes(s), 'в подтверждении нет «' + s + '»: ' + JSON.stringify(page.confirms[0]));
    want(!/всем тренаж|весь прогресс/i.test(page.confirms[0] || ''), 'подтверждение всё ещё обещает стереть всё: ' + JSON.stringify(page.confirms[0]));
    storageVerdict(st, sd, want);
    if (src.kind === 'map') {
      want(page.reloads() === 1, 'после сброса карта не перезагружена (reload: ' + page.reloads() + ')');
      want(noteOf(page) === '', 'после удачного сброса показано сообщение: ' + noteOf(page));
    } else {
      want(noteOf(page) === 'Прогресс этой страницы сброшен.', 'сообщение после сброса: ' + JSON.stringify(noteOf(page)));
      want(page.text('tries') === '0' && page.text('solved') === '0', 'после сброса на странице попыток ' + page.text('tries') + ', решено ' + page.text('solved'));
      /* первое действие ученика после сброса не возвращает старый прогресс */
      page.openTask(1);
      let now = null;
      try { now = JSON.parse(st.map.get(KEY)); } catch (e) { /* пусто */ }
      const mine = now && now.topics && now.topics[own.topics[0]];
      want(mine && mine.tries === 0 && mine.right === 0 && mine.solved === 0, 'после сброса и открытия задачи сохранено: ' + JSON.stringify(mine));
      if (now && now.topics) delete now.topics[own.topics[0]];
      want(now && same(now, sd.kept), 'после сброса и открытия задачи чужое изменилось' + (now ? diffHint(now, sd.kept) : ''));
    }
  } catch (e) { want(false, 'исключение при сбросе: ' + e.message); }

  /* отказались в confirm — ничего не меняется */
  st = fresh();
  try {
    const page = runPage(html, src, st, false);
    const before = canon([...st.map]);
    st.reset();
    page.click();
    want(canon([...st.map]) === before && !st.log.set.length && !st.log.remove.length, 'отказ в confirm изменил хранилище');
    if (src.kind === 'map') want(page.reloads() === 0, 'отказ в confirm перезагрузил карту');
  } catch (e) { want(false, 'исключение при отказе в confirm: ' + e.message); }

  /* мусор в общем ключе — страница открывается, сброс очищает ключ и говорит об этом */
  for (const junk of ['not json', '[1,2]', '5', 'null', '"str"', '']) {
    st = makeStorage({[KEY]: junk, ...sd.ownKeys, ...sd.otherKeys});
    try {
      const page = runPage(html, src, st, true);
      st.reset();
      page.click();
      want(st.map.get(KEY) === '{}', 'мусор ' + JSON.stringify(junk) + ' в ключе не заменён на {}: ' + JSON.stringify(st.map.get(KEY)));
      for (const k of Object.keys(sd.ownKeys)) want(!st.map.has(k), 'мусор ' + JSON.stringify(junk) + ': свой ключ ' + k + ' не удалён');
      want(sameSet(st.log.remove, Object.keys(sd.ownKeys)), 'мусор ' + JSON.stringify(junk) + ': removeItem вызван для ' + JSON.stringify(st.log.remove));
      const changed = foreignChanged(st);
      want(!changed.length, 'мусор ' + JSON.stringify(junk) + ': чужие ключи изменены: ' + JSON.stringify(changed.slice(0, 6)));
      want(/повреждена/.test(noteOf(page)) && /снова сохраняется/.test(noteOf(page)), 'мусор ' + JSON.stringify(junk) + ': ученику не сказано, что запись очищена: ' + JSON.stringify(noteOf(page)));
      if (src.kind === 'map') want(page.reloads() === 0, 'мусор ' + JSON.stringify(junk) + ': карта перезагружена, сообщение потеряно');
      else {
        page.openTask(1);
        let now = null;
        try { now = JSON.parse(st.map.get(KEY)); } catch (e) { /* мусор */ }
        want(now && now.topics && now.topics[own.topics[0]], 'мусор ' + JSON.stringify(junk) + ': после очистки прогресс снова не сохраняется');
      }
    } catch (e) { want(false, 'мусор ' + JSON.stringify(junk) + ' → исключение: ' + e.message); }
  }

  /* хранилище отказывает в момент сброса — сообщение ученику, без перезагрузки */
  for (const fail of ['setThrows', 'getThrows']) {
    st = fresh();
    try {
      const page = runPage(html, src, st, true);
      st.opts[fail] = true;
      page.click();
      st.opts[fail] = false;
      want(st.map.get(KEY) === JSON.stringify(sd.seeded), fail + ': общий ключ изменён');
      for (const k of Object.keys(sd.ownKeys)) want(st.map.has(k), fail + ': свой ключ ' + k + ' удалён при несостоявшемся сбросе');
      want(/Не удалось/.test(noteOf(page)), fail + ': ученику не сказано, что сброс не удался: ' + JSON.stringify(noteOf(page)));
      if (src.kind === 'map') want(page.reloads() === 0, fail + ': карта перезагружена, сообщение потеряно');
      else want(page.text('tries') === '7', fail + ': состояние в памяти сброшено, хотя хранилище не изменилось (попыток ' + page.text('tries') + ')');
    } catch (e) { want(false, fail + ' → исключение: ' + e.message); }
  }
  return fails;
}

/* ---------- 7. доступность кнопки сброса и сообщения (статически) ---------- */
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const blankOut = s => s.replace(/[^\n]/g, ' ');
function attrMap(s) {
  const a = new Map();
  for (const m of s.matchAll(/([^\s=/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g)) a.set(m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '');
  return a;
}
function elInfo(tag, attrs) {
  const a = attrMap(attrs);
  return {tag: tag.toLowerCase(), id: a.get('id') || '', classes: new Set((a.get('class') || '').split(/\s+/).filter(Boolean)), attrs: a};
}
/* Элемент с данным id и цепочка его предков по разметке. */
function elementWithId(html, id) {
  const clean = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, blankOut).replace(/<!--[\s\S]*?-->/g, blankOut);
  const all = [...clean.matchAll(new RegExp(`<([a-zA-Z][\\w-]*)\\b([^>]*?\\bid\\s*=\\s*(["'])${reEsc(id)}\\3[^>]*)>`, 'g'))];
  if (all.length !== 1) return {count: all.length};
  const m = all[0];
  const stack = [];
  for (const tm of clean.slice(0, m.index).matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const tag = tm[2].toLowerCase();
    if (tm[1]) { const k = stack.map(e => e.tag).lastIndexOf(tag); if (k >= 0) stack.length = k; }
    else if (!VOID_TAGS.has(tag) && !/\/\s*$/.test(tm[3])) stack.push(elInfo(tag, tm[3]));
  }
  return {count: 1, el: elInfo(m[1], m[2]), ancestors: stack};
}
function cssRules(html) {
  const out = [];
  const parse = (css, media) => {
    let i = 0;
    while (i < css.length) {
      const open = css.indexOf('{', i);
      if (open < 0) break;
      const close = closeOf(css, open, css.length);
      if (close < 0) break;
      let prelude = css.slice(i, open);
      prelude = prelude.slice(prelude.lastIndexOf(';') + 1).trim();
      const body = css.slice(open + 1, close);
      if (/^@media\b/i.test(prelude)) parse(body, prelude);
      else if (/^@supports\b/i.test(prelude)) parse(body, media);
      else if (!prelude.startsWith('@')) out.push({sel: prelude, decl: body, media, order: out.length});
      i = close + 1;
    }
  };
  for (const sm of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) parse(sm[1].replace(/\/\*[\s\S]*?\*\//g, ''), '');
  return out;
}
/* простой селектор без псевдоклассов и атрибутов (правило, которое действует всегда) */
function parseCompound(s) {
  if (/[:[]/.test(s)) return null;
  const m = /^([a-zA-Z][\w-]*|\*)?((?:[#.][\w-]+)*)$/.exec(s);
  if (!m) return null;
  return {tag: m[1] && m[1] !== '*' ? m[1].toLowerCase() : null,
    ids: [...m[2].matchAll(/#([\w-]+)/g)].map(x => x[1]), cls: [...m[2].matchAll(/\.([\w-]+)/g)].map(x => x[1])};
}
const compoundMatches = (c, el) => (!c.tag || c.tag === el.tag) && c.ids.every(i => i === el.id) && c.cls.every(k => el.classes.has(k));
/* специфичность селектора, если он выбирает элемент; иначе null */
function selectorMatch(sel, el, ancestors) {
  const parts = [];
  let comb = ' ';
  for (const tk of sel.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/)) {
    if (tk === '>') { comb = '>'; continue; }
    if (tk === '+' || tk === '~') return null;
    const c = parseCompound(tk);
    if (!c) return null;
    parts.push({c, comb});
    comb = ' ';
  }
  if (!parts.length || !compoundMatches(parts[parts.length - 1].c, el)) return null;
  let k = ancestors.length - 1;
  for (let p = parts.length - 2; p >= 0; p--) {
    if (parts[p + 1].comb === '>') { if (k < 0 || !compoundMatches(parts[p].c, ancestors[k])) return null; k--; }
    else { while (k >= 0 && !compoundMatches(parts[p].c, ancestors[k])) k--; if (k < 0) return null; k--; }
  }
  const spec = [0, 0, 0];
  for (const {c} of parts) { spec[0] += c.ids.length; spec[1] += c.cls.length; spec[2] += c.tag ? 1 : 0; }
  return spec;
}
const cmpSpec = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const cssPx = v => { const m = /^\s*(\d+(?:\.\d+)?)(px|rem|em)\s*$/i.exec(v || ''); return m ? +m[1] * (m[2].toLowerCase() === 'px' ? 1 : 16) : null; };
/* min-height элемента по каскаду: {best: {px, sel} | null, lowered: [правила в @media ниже 44px]} */
function minHeightOf(html, info) {
  let best = null;
  const lowered = [];
  for (const r of cssRules(html)) {
    const decls = [...r.decl.matchAll(/(?:^|;)\s*min-height\s*:\s*([^;!]+)/gi)];
    if (!decls.length) continue;
    let spec = null;
    for (const s of splitTop(r.sel, ',')) { const sp = selectorMatch(s, info.el, info.ancestors); if (sp && (!spec || cmpSpec(sp, spec) > 0)) spec = sp; }
    if (!spec) continue;
    const px = cssPx(decls[decls.length - 1][1]);
    if (r.media) { if (px === null || px < 44) lowered.push(r.media + ' ' + r.sel); continue; }
    const cand = {spec, order: r.order, px, sel: r.sel};
    if (!best || cmpSpec(cand.spec, best.spec) > 0 || (cmpSpec(cand.spec, best.spec) === 0 && cand.order > best.order)) best = cand;
  }
  const inline = /(?:^|;)\s*min-height\s*:\s*([^;!]+)/i.exec(info.el.attrs.get('style') || '');
  if (inline) best = {px: cssPx(inline[1]), sel: 'style=""'};
  return {best, lowered};
}
function checkA11y(html, src) {
  const fails = [];
  const want = (c, m) => { if (!c) fails.push(m); };
  const {btn, msg} = A11Y[src.kind];
  const b = elementWithId(html, btn);
  if (b.count !== 1) want(false, 'кнопка сброса #' + btn + ' найдена ' + b.count + ' раз');
  else {
    want(b.el.tag === 'button', '#' + btn + ' — не <button>, а <' + b.el.tag + '>');
    const mh = minHeightOf(html, b);
    want(mh.best && mh.best.px !== null && mh.best.px >= 44, 'кнопка сброса #' + btn + ': min-height ' +
      (mh.best ? (mh.best.px === null ? 'не в px' : mh.best.px + 'px') + ' из правила «' + mh.best.sel + '»' : 'не задан ни одним правилом CSS') + ', нужно ≥ 44px');
    want(!mh.lowered.length, 'кнопка сброса #' + btn + ': в @media высота ниже 44px: ' + mh.lowered.join('; '));
  }
  const m = elementWithId(html, msg);
  if (m.count !== 1) want(false, 'сообщение о сбросе #' + msg + ' найдено ' + m.count + ' раз');
  else {
    const live = m.el.attrs.get('aria-live');
    want(live === 'polite' || live === 'assertive', 'сообщение о сбросе #' + msg + ': aria-live=' + JSON.stringify(live ?? null) + ', нужно polite или assertive');
  }
  return fails;
}

/* ---------- 5. мутации ---------- */
function mutations(src, foreignTid) {
  const block = [['mutF3: мусор в общем ключе не чистится', "storage.setItem(key, '{}');", 'void 0;']];
  if (src.kind === 'map') return [
    ['mutF1: сброс только data-topic', 'topics: OWN_TOPICS,\n      keys: OWN_KEYS\n', 'topics: [],\n      keys: []\n'],
    ['mutOld: старый removeItem', 'const status = resetOwnProgress(STORAGE_KEY, own);', "const status = (localStorage.removeItem(STORAGE_KEY), 'reset');"],
    ['mutR2a: чужой TID в своих', "    if (!confirm('", "    own.tids.push('" + foreignTid + "');\n    if (!confirm('"],
    ['mutR2b: чужая ветка topics в своих', 'topics: OWN_TOPICS,', "topics: OWN_TOPICS.concat(['pythonForNestedIfTrainer']),"],
    ['mutR2c: чужой ключ в своих', 'keys: OWN_KEYS\n', "keys: OWN_KEYS.concat(['" + KEY + ".backup'])\n"],
    ['mutR2d: отдельный ключ другого тренажёра сайта в своих', 'keys: OWN_KEYS\n', "keys: OWN_KEYS.concat(['ep_progress_v1'])\n"],
    ['mutR2e: ключ, которого на сайте нет, в своих', 'keys: OWN_KEYS\n', "keys: OWN_KEYS.concat(['zz.reset.probe.v1'])\n"],
    ['mutR6: отказ записи молча', "if (status === 'failed') {", 'if (false) {'],
    ['mutA1: у кнопки сброса нет min-height 44px', 'min-height: 44px;', ''],
    ['mutA2: у сообщения о сбросе нет aria-live', ' role="status" aria-live="polite"', ' role="status"'],
    ['mutA3: правило точнее снижает высоту кнопки', '.reset-msg:empty { margin: 0; }', '.reset-msg:empty { margin: 0; }\n  #reset-btn { min-height: 32px; }'],
    ...block,
  ];
  return [
    ['mutOld: старый removeItem', 'const r=resetOwnProgress(KEY,{topics:[TOPIC]});', "const r=(localStorage.removeItem(KEY),'reset');"],
    ['mutR3: состояние в памяти не сбрасывается', 'state={i:0,step:0,built:[],tries:0,right:0,solved:{}};render();', 'render();'],
    ['mutR2: чужая ветка в своих', '{topics:[TOPIC]}', "{topics:[TOPIC,'practicePaperSheetsTrainer']}"],
    ['mutR2k: отдельный ключ другого тренажёра сайта в своих', '{topics:[TOPIC]}', "{topics:[TOPIC],keys:['ogeInfoTrainerStats']}"],
    ['mutR6: отказ записи молча', "if(r==='failed'){", 'if(false){'],
    ['mutA1: у кнопки сброса нет min-height 44px', '#reset{min-height:44px}', ''],
    ['mutA2: у сообщения нет aria-live', 'id="msg" aria-live="polite"', 'id="msg"'],
    ...block,
  ];
}
function applyMutation(html, a, b) {
  const eol = a.includes('\n') && html.includes(a.replace(/\n/g, '\r\n')) ? '\r\n' : '\n';
  const from = a.replace(/\n/g, eol), to = b.replace(/\n/g, eol);
  if (html.split(from).length !== 2) throw new Error('якорь «' + a.trim() + '» не найден ровно один раз');
  return html.replace(from, () => to);
}

/* ---------- 6. сканер по репозиторию ---------- */
function offenders(text, canonical) {
  const t = prep(stripBlock(text, canonical));
  const lit = bindings(t);
  const vals = e => keyValues(e, lit);
  const isShared = e => { const v = vals(e); return !!v && v.has(KEY); };
  const names = [...lit].filter(([, s]) => s.has(KEY)).map(([n]) => n);
  const ref = `(?:'${reEsc(KEY)}'|"${reEsc(KEY)}"${names.length ? '|(?:[\\w$]+\\s*\\.\\s*)*\\b(?:' + names.map(reEsc).join('|') + ')\\b' : ''})`;
  const hasShared = /mathExamCourse/.test(t);
  const found = [];
  const lineOf = i => t.slice(0, i).split('\n').length;
  const add = (rule, i, s) => found.push({rule, at: lineOf(i), text: s.replace(/\s+/g, ' ').slice(0, 90)});
  for (const m of t.matchAll(/\blocalStorage\s*(?:\.\s*clear\s*\(|\[\s*['"`]clear['"`]\s*\])/g)) add('clear', m.index, m[0]);
  for (const m of t.matchAll(/\bdelete\s+(?:window\s*\.\s*)?localStorage\b/g)) add('delete-storage', m.index, m[0]);
  for (const m of t.matchAll(new RegExp(`\\blocalStorage\\s*(?:\\[\\s*${ref}\\s*\\]|\\.\\s*${ref})\\s*=(?!=)`, 'g'))) add('assign-key', m.index, m[0]);

  const calls = storageCalls(t);
  /* имя = …getItem(ключ) — из какого ключа взято значение */
  const readFrom = new Map();
  for (const c of calls) if (c.fn === 'getItem') {
    const am = /(?<![\w$.])([A-Za-z_$][\w$]*)\s*=(?![=>])[^;=\n]*$/.exec(t.slice(Math.max(0, c.i - 160), c.i));
    if (!am) continue;
    const v = vals(c.args[0] || '');
    const prev = readFrom.has(am[1]) ? readFrom.get(am[1]) : new Set();
    readFrom.set(am[1], v && prev ? new Set([...prev, ...v]) : null);
  }
  /* резервные ключи: B ≠ общего, куда файл кладёт прежнее значение общего ключа */
  const backups = new Set();
  for (const c of calls) if (c.fn === 'setItem') {
    const kv = vals(c.args[0] || '');
    if (!kv || kv.has(KEY)) continue;
    const v = c.args[1] || '';
    const direct = [...v.matchAll(/getItem\(\s*([^()]*?)\s*\)/g)].some(x => isShared(x[1]));
    const viaName = [...readFrom].some(([n, s]) => s && s.has(KEY) && new RegExp(`(?<![\\w$.])${reEsc(n)}(?![\\w$])`).test(v));
    if (direct || viaName) kv.forEach(k => backups.add(k));
  }
  const assignsOf = name => [...t.matchAll(new RegExp(`(?<![\\w$.])${reEsc(name)}\\s*=(?![=>])\\s*`, 'g'))].map(m => exprAt(t, m.index + m[0].length).trim());
  const literalOnly = name => {
    if (isParamIn(t, name) || new RegExp(`Object\\s*\\.\\s*assign\\(\\s*${reEsc(name)}\\b`).test(t)) return false;
    const rhs = assignsOf(name);
    return rhs.length > 0 && rhs.every(r => (r.startsWith('{') && !r.includes('...')) || r.startsWith('['));
  };
  const copyKind = sets => {
    let backup = false;
    for (const s of sets) {
      if (!s) return 'set-copy';
      for (const k of s) { if (k === KEY) continue; if (backups.has(k)) backup = true; else return 'set-copy'; }
    }
    return backup ? 'backup-swap' : null;
  };
  const classify = (v, depth = 0) => {
    v = v.trim();
    const js = /^JSON\s*\.\s*stringify\s*\(/.exec(v);
    if (js) {
      const c = callArgs(v, js[0].length - 1);
      const a0 = c ? c.args[0] : '';
      if (CHAIN_ONLY.test(a0)) {
        const chain = normChain(a0);
        return !/[.[]/.test(chain) && literalOnly(chain) ? {rule: 'set-literal'} : {sink: chain};
      }
      if (a0.startsWith('{')) return /^\{\s*\.\.\.|,\s*\.\.\./.test(a0) ? {} : {rule: 'set-literal'};
      if (a0.startsWith('[') || /^(['"`]|-?\d|null\b|true\b|false\b|undefined\b)/.test(a0)) return {rule: 'set-literal'};
      return {rule: 'set-raw'};
    }
    if (/^(['"`]|-?\d|null\b|true\b|false\b|undefined\b|void\b)/.test(v)) return {rule: 'set-literal'};
    const gets = [...v.matchAll(/getItem\(\s*([^()]*?)\s*\)/g)];
    if (gets.length) { const r = copyKind(gets.map(g => vals(g[1]))); return r ? {rule: r} : {}; }
    if (/^[A-Za-z_$][\w$]*$/.test(v) && depth < 2) {
      if (readFrom.has(v)) { const r = copyKind([readFrom.get(v)]); return r ? {rule: r} : {}; }
      const parts = assignsOf(v).map(r => classify(r, depth + 1));
      if (!parts.length) return {rule: 'set-raw'};
      return parts.find(p => p.rule) || {sink: parts.map(p => p.sink).find(Boolean)};
    }
    return {rule: 'set-raw'};
  };
  const sinks = [];                  // {chain, at} — объекты, которые целиком пишутся в общий ключ
  for (const c of calls) {
    if (c.fn === 'removeItem') {
      const a = (c.args[0] || '').trim();
      let kv = vals(a);
      if (!kv && /^[A-Za-z_$][\w$]*$/.test(a)) kv = loopValues(t, c.i, a, lit);
      if (kv && kv.has(KEY)) add('remove-key', c.i, c.text);
      else if (!kv && hasShared) add('remove-unresolved', c.i, c.text);
    } else if (c.fn === 'setItem' && isShared(c.args[0] || '')) {
      const r = classify(c.args[1] || '');
      if (r.rule) add(r.rule, c.i, c.text);
      if (r.sink) sinks.push({chain: r.sink, at: c.i});
    }
  }
  /* обнуление всего mistakes/topics: только в объекте, который потом пишется в общий ключ
     (напрямую или через функцию-сохранитель) в той же функции */
  const wipes = [];
  const BR = String.raw`(?:\s*\.\s*(?<dot>mistakes|topics)\b|\s*\[\s*(?<q>['"\`])(?<br>mistakes|topics)\k<q>\s*\])`;
  for (const m of t.matchAll(new RegExp(String.raw`\bdelete\s+(?<head>${ID}${ACC}*?)${BR}\s*(?=[;)},\n]|$)`, 'g'))) wipes.push({m, assign: false});
  for (const m of t.matchAll(new RegExp(String.raw`(?<![\w$.])(?<head>${ID}${ACC}*?)${BR}\s*=(?![=>])\s*(?:\{\s*\}|\[\s*\]|null\b|undefined\b|void\s+0\b|''|""|0\b)`, 'g'))) wipes.push({m, assign: true});
  if (wipes.length && sinks.length) {
    for (const s of sinks) {
      if (/[.[]/.test(s.chain) || !isParamIn(t, s.chain)) continue;
      const fn = enclosingFunction(t, s.at);
      if (!fn || !fn.name || !fn.params.includes(s.chain)) continue;
      const idx = fn.params.indexOf(s.chain);
      for (const m of t.matchAll(new RegExp(`(?<![\\w$])${reEsc(fn.name)}\\s*\\(`, 'g'))) {
        const ca = callArgs(t, m.index + m[0].length - 1);
        if (!ca || /^\s*\{/.test(t.slice(ca.end + 1, ca.end + 6))) continue;
        const a = ca.args[idx];
        if (a && CHAIN_ONLY.test(a)) sinks.push({chain: normChain(a), at: m.index});
      }
    }
    const fnAt = i => { const f = enclosingFunction(t, i); return f ? f.at : -1; };
    for (const {m, assign} of wipes) {
      const chain = normChain(m.groups.head), branch = m.groups.dot || m.groups.br;
      const later = sinks.filter(s => s.chain === chain && s.at > m.index);
      if (!later.length) continue;
      const here = fnAt(m.index);
      if (!later.some(s => fnAt(s.at) === here)) continue;
      if (assign) {
        const cut = Math.max(t.lastIndexOf(';', m.index), t.lastIndexOf('}', m.index), t.lastIndexOf('{', m.index));
        const pre = t.slice(Math.max(cut + 1, m.index - 200), m.index);
        const guarded = (/\b(?:if|while)\b/.test(pre) || /(?:\|\||\?\?)\s*\(\s*$/.test(pre)) && pre.replace(/\s+/g, '').includes(branch);
        if (guarded) continue;
      }
      add(branch + '-wipe', m.index, m[0]);
    }
  }
  return found;
}
function scannerSelfTest() {
  const K = "'" + KEY + "'";
  const rulesOf = s => offenders(s).map(f => f.rule);
  const badSamples = [
    ["var K='mathExamCourse'+'Progress.v1'; localStorage.removeItem(K);", 'remove-key'],
    ['localStorage.setItem(' + K + ', JSON.stringify({topics:{}}));', 'set-literal'],
    ['localStorage[' + K + "]='{}';", 'assign-key'],
    ['delete localStorage[' + K + '];', 'delete-storage'],
    ['[' + K + '].forEach(k=>localStorage.removeItem(k));', 'remove-key'],
    ['window.localStorage.clear();', 'clear'],
    ['localStorage.removeItem(`' + KEY + '`);', 'remove-key'],
    ['const S=' + K + '; const T=S; localStorage.setItem(T, "");', 'set-literal'],
    ['const P={KEY:' + K + '}; localStorage.removeItem(P.KEY);', 'remove-key'],
    ['const d=JSON.parse(localStorage.getItem(' + K + ')); delete d.mistakes; localStorage.setItem(' + K + ', JSON.stringify(d));', 'mistakes-wipe'],
    ['const d=JSON.parse(localStorage.getItem(' + K + ')); d.mistakes = {}; localStorage.setItem(' + K + ', JSON.stringify(d));', 'mistakes-wipe'],
    ['const KEY=' + K + '; function save(x){ localStorage.setItem(KEY, JSON.stringify(x)); }\nfunction wipe(){ const a=JSON.parse(localStorage.getItem(KEY)); delete a["topics"]; save(a); }', 'topics-wipe'],
    ['const KEY=' + K + '; const fresh = {}; fresh[TID] = 1; localStorage.setItem(KEY, JSON.stringify(fresh));', 'set-literal'],
    ["const KEY=" + K + "; const v = localStorage.getItem('other.key'); localStorage.setItem(KEY, v);", 'set-copy'],
    ["const KEY=" + K + ", B=KEY+'.backup'; function restore(){ const b=localStorage.getItem(B); localStorage.setItem(KEY, b); }", 'set-copy'],
    ['const KEY=' + K + '; function put(s){ localStorage.setItem(KEY, s); }', 'set-raw'],
    ["const KEY=" + K + "; for (const k of [KEY, 'x.v1']) localStorage.removeItem(k);", 'remove-key'],
    ["const A=['a.v1', " + K + "]; A.forEach(function(k){ localStorage.removeItem(k); });", 'remove-key'],
    ['const KEY=' + K + '; localStorage.removeItem(nameOf(1));', 'remove-unresolved'],
    ["const KEY=" + K + "; localStorage.removeItem(`${KEY}`);", 'remove-key'],
  ];
  const goodSamples = [
    'const KEY=' + K + '; const d=JSON.parse(localStorage.getItem(KEY)||"{}"); d.x=1; delete d[TOPIC]; localStorage.setItem(KEY, JSON.stringify(d));',
    "const OWN='landPlotsTrainer.v2', MAP=" + K + '; localStorage.removeItem(OWN);',
    'const KEY=' + K + '; const a=JSON.parse(localStorage.getItem(KEY)); delete a.topics[TOPIC]; delete a.mistakes[k]; localStorage.setItem(KEY, JSON.stringify(a)); sessionStorage.clear();',
    /* из ревью второго круга: законные операции, которые не стирают общий ключ */
    'var KEY=' + K + '; function cleanJournal(obj){ var out = JSON.parse(JSON.stringify(obj)); if (!isObj(out.mistakes)){ delete out.mistakes; } return out; }',
    'const KEY=' + K + '; const s = {data: JSON.parse(localStorage.getItem(KEY))}; s.data.x = 1; localStorage.setItem(KEY, JSON.stringify(s.data));',
    'const KEY=' + K + '; const d = JSON.parse(localStorage.getItem(KEY)||"{}"); localStorage.setItem(KEY, JSON.stringify(d, null, 0));',
    'const KEY=' + K + "; ['myTrainer.v1','myTrainer.v2'].forEach(k=>localStorage.removeItem(k));",
    'const KEY=' + K + "; const MINE=['myTrainer.v1']; for (const k of MINE) localStorage.removeItem(k);",
    'const KEY=' + K + '; let d=JSON.parse(localStorage.getItem(KEY)||"{}"); if(!d.topics)d.topics={}; d.topics[T]=1; localStorage.setItem(KEY,JSON.stringify(d));',
    'const KEY=' + K + '; let d=JSON.parse(localStorage.getItem(KEY)||"{}"); if (typeof d.mistakes !== "object") d.mistakes = {}; localStorage.setItem(KEY,JSON.stringify(d));',
    'const KEY=' + K + '; const d=JSON.parse(localStorage.getItem(KEY)||"{}"); localStorage.setItem(KEY, JSON.stringify({...d, [TID]: 1}));',
    'const KEY=' + K + '; function commit(d){ localStorage.setItem(KEY, JSON.stringify(d)); } function clear(tid){ const d=JSON.parse(localStorage.getItem(KEY)); delete d[tid]; commit(d); }',
    'const KEY=' + K + '; const s = JSON.stringify(JSON.parse(localStorage.getItem(KEY))); localStorage.setItem(KEY, s);',
  ];
  for (const [s, rule] of badSamples) ok(rulesOf(s).includes(rule), 'сканер не ловит (' + rule + '): ' + s + ' → ' + JSON.stringify(rulesOf(s)));
  for (const s of goodSamples) { const f = offenders(s); ok(!f.length, 'сканер ложно ловит ' + JSON.stringify(f) + ': ' + s); }
  /* загрузка кода с предварительной резервной копией — вид backup-swap и больше ничего */
  const swap = 'var KEY=' + K + ', BACKUP = KEY + ".backup";\nfunction loadInto(obj){ var cur; try{ cur = localStorage.getItem(KEY); }catch(e){ cur = null; }\n' +
    '  localStorage.setItem(BACKUP, cur === null ? "{}" : cur); localStorage.setItem(KEY, JSON.stringify(obj)); }\n' +
    'function restoreBackup(){ var b; try{ b = localStorage.getItem(BACKUP); }catch(e){ b = null; } localStorage.setItem(KEY, b); }';
  ok(same(rulesOf(swap), ['backup-swap']), 'сканер: загрузка кода с .backup → ' + JSON.stringify(rulesOf(swap)) + ', ожидался ровно backup-swap');
  const swapNoBackup = swap.replace('localStorage.setItem(BACKUP, cur === null ? "{}" : cur); ', '');
  ok(same(rulesOf(swapNoBackup), ['set-copy']), 'сканер: возврат .backup без предварительной копии → ' + JSON.stringify(rulesOf(swapNoBackup)) + ', ожидался set-copy');
  /* номера строк — как в файле, несмотря на вырезанные комментарии и склейки */
  const lines = '/* строка 1\n   строка 2\n   строка 3 */\nvar K = "mathExamCourse"\n  + "Progress.v1";\n// 6\nlocalStorage.removeItem(K);\n';
  const at = offenders(lines).map(f => f.at);
  ok(same(at, [7]), 'сканер: номер строки ' + JSON.stringify(at) + ', в файле 7');
}
function writesSelfTest() {
  const K = "'" + KEY + "'";
  const pre = 'const KEY=' + K + ", TID='t1', TOPIC='tp1';\n";
  const cases = [
    ['обычная запись', 'function s(){ const d=JSON.parse(localStorage.getItem(KEY)||"{}"); d[TID]={a:1}; localStorage.setItem(KEY, JSON.stringify(d)); }', {top: ['t1'], topics: []}],
    ['псевдоним topics', 'function s(){ const d=JSON.parse(localStorage.getItem(KEY)||"{}"); const tp = d.topics || (d.topics = {}); tp[TOPIC] = {n:1}; localStorage.setItem(KEY, JSON.stringify(d)); }', {top: [], topics: ['tp1']}],
    ['деструктуризация', 'function s(){ const d=JSON.parse(localStorage.getItem(KEY)||"{}"); const {topics} = d; topics[TOPIC] = 1; localStorage.setItem(KEY, JSON.stringify(d)); }', {top: [], topics: ['tp1']}],
    ['псевдоним корня', 'function s(){ const all=JSON.parse(localStorage.getItem(KEY)||"{}"); const d = all; d.topics[TOPIC] = 1; d[TID] = 2; localStorage.setItem(KEY, JSON.stringify(all)); }', {top: ['t1'], topics: ['tp1']}],
    ['функция-сохранитель', 'function save(o){ localStorage.setItem(KEY, JSON.stringify(o)); }\nfunction f(){ const a=JSON.parse(localStorage.getItem(KEY)); a.topics[TOPIC]=1; save(a); }', {top: [], topics: ['tp1']}],
    ['как в Python-тренажёре', 'function save(){let d;try{d=JSON.parse(localStorage.getItem(KEY))||{topics:{}}}catch(e){d={topics:{}}}d.topics=d.topics||{};d.topics[TOPIC]={x:1};localStorage.setItem(KEY,JSON.stringify(d))}', {top: [], topics: ['tp1']}],
    ['ветка из переменной', 'function s(){ const d=JSON.parse(localStorage.getItem(KEY)||"{}"); const prev = d[TID] || {}; prev.n = 1; d[TID] = {...prev}; localStorage.setItem(KEY, JSON.stringify(d)); }', {top: ['t1'], topics: []}],
  ];
  for (const [name, code, want] of cases) {
    const w = writesOf(pre + code);
    ok(!w.unresolved.length && sameSet(w.top, want.top) && sameSet(w.topics, want.topics),
      'writesOf «' + name + '»: top=' + JSON.stringify([...w.top]) + ' topics=' + JSON.stringify([...w.topics]) + ' не разобрано=' + JSON.stringify(w.unresolved) + ', ожидалось ' + JSON.stringify(want));
  }
  const unclear = [
    ['topics уходит в функцию', 'function s(){ const d=JSON.parse(localStorage.getItem(KEY)||"{}"); fill(d.topics); localStorage.setItem(KEY, JSON.stringify(d)); }'],
    ['запись в объект неизвестного происхождения', 'function s(){ const d=JSON.parse(localStorage.getItem(KEY)||"{}"); const tp = pick(d); tp[TOPIC] = 1; localStorage.setItem(KEY, JSON.stringify(d)); }'],
    ['Object.assign в корень', 'function s(){ const d=JSON.parse(localStorage.getItem(KEY)||"{}"); Object.assign(d, {x:1}); localStorage.setItem(KEY, JSON.stringify(d)); }'],
    ['ключ ветки не разобран', 'function s(k){ const d=JSON.parse(localStorage.getItem(KEY)||"{}"); d[k] = 1; localStorage.setItem(KEY, JSON.stringify(d)); }'],
  ];
  for (const [name, code] of unclear) {
    const w = writesOf(pre + code);
    ok(w.unresolved.length > 0, 'writesOf «' + name + '» разобрано молча: top=' + JSON.stringify([...w.top]) + ' topics=' + JSON.stringify([...w.topics]));
  }
}
function scanRepo(files, canonical) {
  const seen = new Map(ALLOWED.map(a => [a, 0]));
  for (const {rel, text} of files) {
    for (const f of offenders(text, canonical)) {
      const allow = ALLOWED.find(a => a.file === rel && a.kind === f.rule);
      if (allow) { seen.set(allow, seen.get(allow) + 1); continue; }
      err('сканер: ' + rel + ':' + f.at + ' [' + f.rule + ': ' + KINDS[f.rule] + '] ' + f.text);
    }
  }
  for (const a of ALLOWED) ok(seen.get(a) >= 1, 'сканер: разрешение ' + a.file + ' [' + a.kind + '] не нашло ни одной операции — её убрали или сканер перестал её узнавать (' + a.why + ')');
  checks++;
  return seen;
}

/* ---------- 1. сверка фикстуры с кодом тренажёров карты ---------- */
function linkedText(src, href) {
  if (src.links.zip) {
    const d = zipFiles(src.links.zip).get(href);
    return d ? {rel: src.links.zip + '!' + href, text: d.toString('utf8')} : null;
  }
  const rel = src.links.dir + '/' + href;
  const full = path.join(root, rel);
  return existsSync(full) ? {rel, text: readFileSync(full, 'utf8')} : null;
}
function checkLinks(src, html, canonical) {
  const lbl = label(src);
  const own = src.own;
  if (src.kind === 'python') {
    const w = writesOf(stripBlock(html, canonical));
    ok(!w.unresolved.length, lbl + ': не удалось разобрать запись: ' + w.unresolved.join('; '));
    ok(sameSet(w.top, own.tids) && sameSet(w.topics, own.topics) && sameSet(w.keys, own.keys) && !w.mistakes,
      lbl + ': страница пишет top=' + JSON.stringify([...w.top]) + ' topics=' + JSON.stringify([...w.topics]) + ' keys=' + JSON.stringify([...w.keys]) + ' mistakes=' + w.mistakes + ', в фикстуре ' + JSON.stringify(own));
    return [];
  }
  const cards = parseCards(html);
  ok(sameSet(cards.map(c => c.dataset.topic), own.tids) && cards.length === own.tids.length,
    lbl + ': карточки карты ' + JSON.stringify(cards.map(c => c.dataset.topic)) + ' ≠ фикстуре ' + JSON.stringify(own.tids));
  const top = new Set(), topics = new Set(), keys = new Set(), linked = [];
  for (const c of cards) {
    const lt = c.href && linkedText(src, c.href);
    if (!ok(lt, lbl + ': тренажёр карточки ' + c.dataset.topic + ' (' + c.href + ') не найден')) continue;
    linked.push(lt.rel);
    const w = writesOf(lt.text);
    ok(!w.unresolved.length, lt.rel + ': не удалось разобрать запись: ' + w.unresolved.join('; '));
    ok(!w.mistakes, lt.rel + ': тренажёр пишет журнал mistakes — проверьте префикс и фикстуру');
    ok(w.top.has(c.dataset.topic), lt.rel + ': тренажёр не пишет ветку своей карточки ' + c.dataset.topic + ' (пишет ' + JSON.stringify([...w.top]) + ')');
    w.top.forEach(v => top.add(v)); w.topics.forEach(v => topics.add(v)); w.keys.forEach(v => keys.add(v));
  }
  ok(sameSet(top, own.tids), lbl + ': тренажёры карты пишут на верхний уровень ' + JSON.stringify([...top].sort()) + ', в фикстуре ' + JSON.stringify([...own.tids].sort()));
  ok(sameSet(topics, own.topics), lbl + ': тренажёры карты пишут в topics ' + JSON.stringify([...topics].sort()) + ', в фикстуре ' + JSON.stringify(own.topics));
  ok(sameSet(keys, own.keys), lbl + ': тренажёры карты пишут отдельные ключи ' + JSON.stringify([...keys].sort()) + ', в фикстуре ' + JSON.stringify([...own.keys].sort()));
  return linked;
}

/* ---------- запуск ---------- */
const files = repoFiles();
let canonical = null;
try { canonical = normBlock(extractBlock(loadSource(SOURCES[0]), label(SOURCES[0]))); } catch (e) { /* блока нет — сообщит проверка страницы */ }

const tidMap = collectTids(files, canonical);
ok(tidMap.size >= 150, 'сканер TID нашёл всего ' + tidMap.size + ' TID (ожидалось ≥ 150)');
for (const a of TID_ANCHORS) ok(tidMap.has(a), 'сканер TID не нашёл ' + a);
console.log('  • TID страниц сайта (для засева чужих веток): ' + tidMap.size);

const keyMap = collectSiteKeys(files);
SITE_KEYS = new Set(keyMap.keys());
ok(SITE_KEYS.size >= 100, 'сбор ключей сайта нашёл всего ' + SITE_KEYS.size + ' ключей (ожидалось ≥ 100)');
for (const k of KEY_ANCHORS) ok(SITE_KEYS.has(k), 'сбор ключей сайта не нашёл ' + k);
console.log('  • ключей localStorage/sessionStorage сайта (чужие засеваются все): ' + SITE_KEYS.size);

scannerSelfTest();
writesSelfTest();

const blocks = [], linkedAll = new Set(SOURCES.map(label));   // сами карты тоже называют эти ключи
let pages = 0, mutRuns = 0;
for (const src of SOURCES) {
  const lbl = label(src);
  let html;
  try { html = loadSource(src); } catch (e) { err(lbl + ': ' + e.message); continue; }
  const own = src.own;
  const foreign = [...tidMap.keys()].filter(t => !own.tids.includes(t) && !own.topics.includes(t));
  checkLinks(src, html, canonical).forEach(r => linkedAll.add(r));

  let block;
  try { block = extractBlock(html, lbl); } catch (e) { err(e.message); }
  if (block) { blocks.push({lbl, block}); checkFunction(block, own, foreign, lbl); }

  const fails = checkPage(html, src, own, foreign);
  checks++;
  for (const f of fails) err(lbl + ': ' + f);
  const afails = checkA11y(html, src);
  checks++;
  for (const f of afails) err(lbl + ': доступность: ' + f);

  const foreignTid = foreign.includes('trigSumToProductTrainer') ? 'trigSumToProductTrainer' : foreign[0];
  for (const [name, a, b] of mutations(src, foreignTid)) {
    try {
      const mhtml = applyMutation(html, a, b);
      const mfails = checkPage(mhtml, src, own, foreign).concat(checkA11y(mhtml, src));
      ok(mfails.length > 0, lbl + ': мутация «' + name + '» не поймана');
      mutRuns++;
    } catch (e) { err(lbl + ': мутация «' + name + '»: ' + e.message); }
  }
  pages++;
  const otherKeys = Object.keys(buildSeed(own, foreign).otherKeys).length;
  console.log('  • ' + lbl + ' — своё: ' + own.tids.length + ' TID, topics ' + JSON.stringify(own.topics) + ', ключей ' + own.keys.length +
    '; в засеве чужих TID ' + foreign.length + ', чужих ключей ' + otherKeys + ((fails.length + afails.length) ? '; ошибок ' + (fails.length + afails.length) : '; ok'));
}
if (blocks.length > 1) {
  const first = normBlock(blocks[0].block);
  for (const b of blocks.slice(1)) ok(normBlock(b.block) === first, 'блок сброса в ' + b.lbl + ' отличается от ' + blocks[0].lbl);
}
/* отдельные ключи фикстуры пишут и читают только тренажёры карт */
for (const k of MAP_KEYS) {
  const users = files.filter(f => f.text.includes(k)).map(f => f.rel);
  const stray = users.filter(r => !linkedAll.has(r));
  ok(users.length > 0 && !stray.length, 'ключ ' + k + ' встречается вне тренажёров карты: ' + JSON.stringify(stray));
}
const allowedSeen = scanRepo(files, canonical);
console.log('  • мутаций прогнано: ' + mutRuns + '; разрешённые операции сканера: ' +
  ALLOWED.map(a => a.file + ' [' + a.kind + '] ×' + allowedSeen.get(a)).join(', '));
console.log(`страниц ${pages} из ${SOURCES.length}, файлов просканировано ${files.length}, проверок ${checks}, ошибок ${bad}`);
if (bad || pages !== SOURCES.length) { console.log('RESET_OWN_PROGRESS_FAIL'); process.exit(1); }
console.log('RESET_OWN_PROGRESS_OK');
