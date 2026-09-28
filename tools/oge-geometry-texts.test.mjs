#!/usr/bin/env node
/*
  Гейт текстов условий тренажёров 16, 17, 18, 23 (OGE_COURSE_03A_GEOMETRY,
  часть «тексты архива»; ADR 0003, решение 9; решения P1–P6 делегата
  владельца). Голый Node 18+, без зависимостей и сети.

    node tools/oge-geometry-texts.test.mjs              проверка файлов
    node tools/oge-geometry-texts.test.mjs --drafts d.json [--verbose]
                                                        проверка черновиков
    node tools/oge-geometry-texts.test.mjs --make-base  снять базу (только
                                                        до переписывания!)

  Маркер успеха: OGE_GEOMETRY_TEXTS_OK; при ошибке — список и код 1.

  Старые формулировки в репозитории не хранятся: база
  tools/oge-geometry-texts.base.json содержит только SHA-1 четырёхсловных
  шинглов старых текстов 16/17/23 и нетекстовые инварианты каждого шаблона
  (наборы данных-чисел, латинских меток, полей p.*, признак «в градусах»,
  длину). Новый текст шаблона проходит, если на каждом наборе чисел:
   - доля его шинглов, совпавших с объединением старых, ≤ 30 % ИЛИ
     совпавших ≤ 2, И нет 4 совпавших шинглов подряд (общий отрезок
     ≥ 7 слов) — это и есть проверка на дословность;
   - те же числа, те же буквы, те же поля p.*, «Ответ дайте в градусах.»
     там и только там, где было (16, 17), длина ≤ 1,25 прежней;
   - нет «см. рис.», «на рисунке», «сколько градусов», «градусную меру»,
     «величину угла», «угол ABC = …», «tan», SAS/ASA/SSS, «е» вместо «ё»
     в «изображён», «проведён», «её».
  18 не переписывается (служебная формула + фигура + вопрос): каждый
  шаблон начинается с «На клетчатой бумаге с размером клетки 1×1», те же
  проверки «ё».

  Черновики — JSON-массив {id:'16.insCen', src:'p=>`…${p.c}…`'}; src —
  выражение-функция, выполняется в среде тренажёра (доступны его помощники).
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, loadTrainer } from './oge-geometry-contract.lib.mjs';

const BASE_FILE = path.join(ROOT, 'tools/oge-geometry-texts.base.json');
const SEED = 20260928, GEN = 20, MAXI = 30;
const TR = {
  16: { file: 'trainers/oge-task16-circle.html', subs: 'SUBS', keys: 'Object.keys(SUBS)', proto: k => `SUBS[${k}].proto`, arch: k => `ARCHIVE.filter(e=>e.sub===${k}&&!e.text).map(e=>e.p)` },
  17: { file: 'trainers/oge-task17-quadrilaterals.html', subs: 'S17', keys: 'Object.keys(S17)', proto: k => `S17[${k}].proto`, arch: k => `ARCHIVE.filter(e=>e.sub===${k}).map(e=>e.p)` },
  18: { file: 'trainers/oge-task18-grid.html', subs: 'SUBS', keys: 'SUBKEYS', proto: k => `SUBS[${k}].proto`, arch: k => `ARCHIVE.filter(e=>e.sub===${k}).map(e=>e.p)` },
  23: { file: 'trainers/oge-task23-geometry-calculations.html', subs: 'SUBS', keys: 'ORDER', proto: k => `(ARCHIVE.find(a=>a.sub===${k})||{}).p`, arch: k => `ARCHIVE.filter(a=>a.sub===${k}).map(a=>a.p)` },
};
const REWRITE = ['16', '17', '23'];

/* ---------- нормализация и шинглы (решение P5) ---------- */
const WHITE = [
  /Ответ дайте в градусах\.?/gu,
  /На клетчатой бумаге с размером клетки 1\s*×\s*1/gu,
  /(^|[.!?]\s+)(В ответе|Ответ запишите|Ответ можно записать)[^.!?]*[.!?]?/gu,
];
const plain = h => String(h).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
function tokens(html) {
  let t = plain(html);
  for (const re of WHITE) t = t.replace(re, ' ');
  return t.toLowerCase().replace(/ё/g, 'е')
    .split(/[\s,.;:!?()«»"“”—–\-=∥⟂⊥·×/]+/u).filter(Boolean)
    .map(w => /\d/.test(w) ? '#' : (/^[∠△]?[a-z]+[₀-₉']*$/.test(w) ? '@' : w));
}
const cyr = w => /[а-я]{2,}/.test(w);   // слово — от двух букв: предлоги «в», «к», «с» и союзы «и», «а» не считаются
function shingles(html) {
  const tk = tokens(html), out = [];
  for (let i = 0; i + 4 <= tk.length; i++) {
    const g = tk.slice(i, i + 4);
    out.push(g.filter(cyr).length >= 2 ? g.join(' ') : null);   // null — перечень данных, не считается
  }
  return out;
}
const h12 = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const numbers = html => (plain(html).replace(/На клетчатой бумаге с размером клетки 1\s*×\s*1/gu, ' ').match(/\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(',', '.')).sort();
const labels = html => [...new Set((plain(html).match(/[A-Z]+[₀-₉']*/g) || []).filter(x => !/^(SAS|ASA|SSS)$/.test(x)))].sort();
const fieldsOf = src => [...new Set([...String(src).matchAll(/\bp\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]))].sort();
const DEG = /Ответ дайте в градусах/u;
/* угловая задача: в старом тексте ответ в градусах («Ответ дайте в градусах», «Сколько градусов…», «градусную меру…») */
const ANGLE = /градус/iu;
const BAD = [
  [/см\.\s*рис/iu, '«см. рис.»'], [/на рисунке/iu, '«на рисунке»'], [/сколько градусов/iu, '«сколько градусов»'],
  [/градусную меру/iu, '«градусную меру»'], [/величину угла/iu, '«величину угла»'], [/угол\s+[A-Z]+\s*=/u, 'гибрид «угол ABC =»'],
  [/\btan\b/u, '«tan»'], [/\b(SAS|ASA|SSS)\b/u, 'SAS/ASA/SSS'],
];
/* ё: «изображён», «проведён», «изображённый», «проведённый», «её»; формы «изображена», «проведена» пишутся без ё */
const YO = [[/(^|[^а-яё])(изображен|проведен)(?=[^а-яё]|$)/u, '«изображен/проведен» без ё'],
  [/(^|[^а-яё])(изображенн|проведенн)[а-яё]*/u, '«изображенный/проведенный» без ё'], [/(^|[^а-яё])ее([^а-яё]|$)/u, '«ее» без ё']];
/* просьба владельца 28.09.2026: «высота проведена», а не «опущена» — во всех текстах шести тренажёров */
const DOWN = /(^|[^а-яёА-ЯЁ])[Оо]пу(щ|ст)[а-яё]*/u;
const SIX = ['trainers/oge-task16-circle.html', 'trainers/oge-task17-quadrilaterals.html', 'trainers/oge-task18-grid.html',
  'trainers/oge-task23-geometry-calculations.html', 'trainers/oge-task24-proofs.html', 'trainers/oge-task25-geometry.html'];

/* ---------- чтение шаблонов тренажёра на фиксированных наборах ---------- */
function load(n) {
  return loadTrainer(TR[n].file, { seed: SEED });
}
function templates(n, T) {
  const c = TR[n];
  const keys = JSON.parse(T.run(`JSON.stringify(${c.keys})`));
  return keys.map(k => {
    const K = JSON.stringify(k);
    const src = T.run(`String(${c.subs}[${K}].text)`);
    return { id: n + '.' + k, k, src };
  });
}
function pset(n, T, k) {
  const c = TR[n], K = JSON.stringify(k);
  const list = JSON.parse(T.run(`JSON.stringify([${c.proto(K)}].concat(${c.arch(K)}).concat(Array.from({length:${GEN}},()=>${c.subs}[${K}].gen())).filter(x=>x!==undefined))`));
  const seen = new Set(), out = [];
  for (const p of list) { const s = JSON.stringify(p); if (!seen.has(s)) { seen.add(s); out.push(p); } if (out.length >= MAXI) break; }
  return out;
}
/* src == null — шаблон из файла (вызывается как есть, с this подтипа);
   иначе черновик: выражение-функция или метод «text(p){…}» (станет function(p){…}) */
function render(n, T, k, src, ps) {
  const c = TR[n], K = JSON.stringify(k);
  if (src == null) T.run(`globalThis.__tpl=${c.subs}[${K}].text`);
  else {
    const s = String(src).trim(), m = /^([A-Za-z_$][\w$]*)\s*\(/.exec(s);
    T.run(`globalThis.__tpl=(${m && m[1] !== 'function' ? 'function' + s.slice(m[1].length) : s})`);
  }
  return ps.map(p => T.run(`__tpl.call(${c.subs}[${K}], ${JSON.stringify(p)})`));
}
const arch16 = T => T.run(`(ARCHIVE.find(e=>e.text)||{}).text||''`);
const arch16id = T => T.run(`String((ARCHIVE.find(e=>e.text)||{nums:['']}).nums[0])`);

/* ---------- база ---------- */
function makeBase() {
  const base = { note: 'База гейта текстов: SHA-1 (12 знаков) четырёхсловных шинглов старых условий 16/17/23 по каждому шаблону и нетекстовые инварианты шаблонов. Снята с main до переписывания; самих текстов нет.', from: 'f030901', tpl: {} };
  const shSet = html => [...new Set(html.flatMap(h => shingles(h).filter(Boolean).map(h12)))].sort();
  let total = 0;
  for (const n of Object.keys(TR)) {
    const T = load(n);
    for (const t of templates(n, T)) {
      const ps = pset(n, T, t.k), html = render(n, T, t.k, null, ps);
      base.tpl[t.id] = { ps, fields: fieldsOf(t.src), deg: html.some(h => ANGLE.test(plain(h))),
        len: html.map(h => plain(h).length), nums: html.map(numbers), labels: html.map(labels) };
      if (REWRITE.includes(n)) { base.tpl[t.id].sh = shSet(html); total += base.tpl[t.id].sh.length; }
    }
    if (n === '16') {
      const txt = arch16(T), id = '16.arch.' + arch16id(T);
      base.tpl[id] = { ps: [null], fields: [], deg: ANGLE.test(plain(txt)), len: [plain(txt).length], nums: [numbers(txt)], labels: [labels(txt)], sh: shSet([txt]) };
      total += base.tpl[id].sh.length;
    }
  }
  fs.writeFileSync(BASE_FILE, JSON.stringify(base, null, 0).replace(/("tpl":\{|\},")/g, m => m.replace(',', ',\n')) + '\n');
  console.log('база снята: шаблонов ' + Object.keys(base.tpl).length + ', шинглов по шаблонам ' + total);
}

/* ---------- проверка ---------- */
function check(opts) {
  const base = JSON.parse(fs.readFileSync(BASE_FILE, 'utf8'));
  /* чей шингл: хэш → шаблоны, в старом тексте которых он встречался */
  const OWNERS = new Map();
  for (const [id, b] of Object.entries(base.tpl)) for (const h of b.sh || []) { if (!OWNERS.has(h)) OWNERS.set(h, new Set()); OWNERS.get(h).add(id); }
  /* самая длинная цепочка совпавших; отфильтрованные шинглы (перечни данных) нейтральны — не считаются и не рвут цепочку */
  const longest = hits => { let run = 0, max = 0; for (const x of hits) { if (x === null) continue; run = x ? run + 1 : 0; if (run > max) max = run; } return max; };
  const drafts = opts.drafts ? Object.fromEntries(JSON.parse(fs.readFileSync(opts.drafts, 'utf8')).map(d => [d.id, d.src])) : {};
  let fails = 0, n16arch = null;
  const bad = (id, msg) => { fails++; console.log('FAIL ' + id + ': ' + msg); };
  const seenIds = new Set();
  for (const n of Object.keys(TR)) {
    const T = load(n);
    const list = templates(n, T);
    if (n === '16') { const id = '16.arch.' + arch16id(T); n16arch = id; list.push({ id, k: null, src: null, fixed: drafts[id] != null ? drafts[id] : arch16(T) }); }
    for (const t of list) {
      if (opts.drafts && drafts[t.id] == null) continue;          // режим черновиков: только поданные
      seenIds.add(t.id);
      const b = base.tpl[t.id];
      if (!b) { bad(t.id, 'нет в базе'); continue; }
      let html;
      try {
        html = t.fixed != null ? [t.fixed] : render(n, T, t.k, drafts[t.id] != null ? drafts[t.id] : null, b.ps);
      } catch (e) { bad(t.id, 'шаблон не выполняется: ' + String(e.message || e).slice(0, 120)); continue; }
      const src = t.fixed != null ? '' : (drafts[t.id] != null ? drafts[t.id] : t.src);
      const txt = html.map(plain);
      // регексы
      for (const s of txt) {
        for (const [re, what] of YO) if (re.test(s)) { bad(t.id, what + ' — «' + s.slice(0, 60) + '…»'); break; }
        if (n === '18') { if (!/^На клетчатой бумаге с размером клетки 1\s*×\s*1/u.test(s)) bad(t.id, 'не начинается с «На клетчатой бумаге с размером клетки 1×1»'); continue; }
        for (const [re, what] of BAD) if (re.test(s)) bad(t.id, 'запрещено ' + what);
      }
      if (n === '18') continue;
      // инварианты
      if (t.fixed == null && JSON.stringify(fieldsOf(src)) !== JSON.stringify(b.fields)) bad(t.id, 'поля p.* ' + JSON.stringify(fieldsOf(src)) + ' ≠ ' + JSON.stringify(b.fields));
      const deg = txt.some(s => DEG.test(s));
      /* решение P3: в 16 и 17 фраза обязательна в угловых задачах и запрещена в прочих; в 23 её нет */
      const want = n === '23' ? false : b.deg;
      if (deg !== want) bad(t.id, deg ? 'лишнее «Ответ дайте в градусах.»' : 'нет «Ответ дайте в градусах.» в угловой задаче');
      txt.forEach((s, i) => {
        if (JSON.stringify(numbers(html[i])) !== JSON.stringify(b.nums[i])) bad(t.id, `набор ${i}: числа ${numbers(html[i]).join(' ')} ≠ ${b.nums[i].join(' ')}`);
        if (JSON.stringify(labels(html[i])) !== JSON.stringify(b.labels[i])) bad(t.id, `набор ${i}: буквы ${labels(html[i]).join(' ')} ≠ ${b.labels[i].join(' ')}`);
        if (s.length > 1.25 * b.len[i]) bad(t.id, `набор ${i}: длина ${s.length} > 1,25 × ${b.len[i]}`);
        // шинглы (поправка P5): против своего старого шаблона — доля ≤ 30 % или ≤ 2 совпадений, и меньше 4 подряд;
        // против остальных старых шаблонов — меньше 6 подряд (общий отрезок короче 9 слов)
        const sh = shingles(html[i]);
        const own = sh.map(x => x === null ? null : !!(OWNERS.get(h12(x)) || new Set()).has(t.id));
        const other = sh.map(x => x === null ? null : [...(OWNERS.get(h12(x)) || [])].some(o => o !== t.id));
        const counted = sh.filter(Boolean).length, matched = own.filter(x => x === true).length, share = counted ? matched / counted : 0;
        const runOwn = longest(own), runOther = longest(other);
        if (!((share <= 0.30 || matched <= 2) && runOwn < 4)) bad(t.id, `набор ${i}: со своим старым текстом совпало шинглов ${matched} из ${counted} (${Math.round(share * 100)} %), подряд ${runOwn} — формулировка близка к старой`);
        if (runOther >= 6) bad(t.id, `набор ${i}: с другим старым шаблоном совпало ${runOther} шинглов подряд — переписан чужой текст`);
        if (opts.verbose && (matched || runOther)) console.log('     ' + t.id + ' [' + i + '] свои: ' + sh.filter((x, j) => own[j]).join(' | ') + (runOther ? ' · чужие подряд ' + runOther : ''));
      });
    }
  }
  if (opts.drafts) for (const id of Object.keys(drafts)) if (!seenIds.has(id)) bad(id, 'такого шаблона нет');
  for (const [id, d] of Object.entries(drafts)) { const m = DOWN.exec(d); if (m) bad(id, '«' + m[0].trim() + '» — пишем «проведена / проведём»'); }
  if (!opts.drafts) for (const f of SIX) fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').forEach((line, i) => {
    const m = DOWN.exec(line);
    if (m) bad(f + ':' + (i + 1), '«' + m[0].trim() + '» — пишем «проведена / проведём» (просьба владельца)');
  });
  console.log('\nпроверено шаблонов: ' + seenIds.size + ', провалов: ' + fails);
  if (fails) process.exitCode = 1; else console.log('OGE_GEOMETRY_TEXTS_OK');
}

const argv = process.argv.slice(2);
if (argv.includes('--make-base')) {
  /* база снимается один раз со старых текстов; после переписывания пересъём её обнулил бы */
  if (fs.existsSync(BASE_FILE) && !argv.includes('--force')) { console.error('база уже есть: ' + BASE_FILE + ' (пересъём только с --force и только со старых текстов)'); process.exitCode = 1; }
  else makeBase();
}
else check({ drafts: argv.includes('--drafts') ? path.resolve(argv[argv.indexOf('--drafts') + 1]) : null, verbose: argv.includes('--verbose') });
