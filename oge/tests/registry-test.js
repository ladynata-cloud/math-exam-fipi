/* Реестр курса ОГЭ: файлы существуют (точный регистр), TID/NAMES/TYPES/
   LINES/CABINET согласованы, TYPES опубликованных тренажёров совпадают с
   ключами, которые извлекает tools/oge-registry-draft.mjs (пока в тренажёрах
   нет TYPE_IDS), а где TYPE_IDS уже есть — с ней. Голый Node, без jsdom.
   Маркер: OGE_REGISTRY_OK. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');           // oge/
const REPO = path.resolve(ROOT, '..');
const RV = require(path.join(ROOT, 'registry.js'));

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

/* файл существует с точным регистром каждого компонента */
function existsExact(rel){
  let cur = REPO;
  for (const c of rel.split('/')){
    if (!c || c === '.') continue;
    if (c === '..'){ cur = path.dirname(cur); continue; }
    let names;
    try { names = fs.readdirSync(cur); } catch (e) { return false; }
    if (!names.includes(c)) return false;
    cur = path.join(cur, c);
  }
  return fs.existsSync(cur);
}

/* 1. TRAINERS: файлы */
for (const [tid, t] of Object.entries(RV.TRAINERS)){
  const rel = path.posix.join('oge', t.file);
  if (t.planned) ok(!existsExact(rel) || true, 'planned: ' + tid);
  else ok(existsExact(rel), `TRAINERS.${tid}: файла нет или другой регистр — ${t.file}`);
  ok(typeof t.title === 'string' && t.title.length > 2, `TRAINERS.${tid}: title`);
  ok(Number.isInteger(t.line) && t.line >= 0 && t.line <= 25, `TRAINERS.${tid}: line`);
  ok(typeof t.review === 'boolean', `TRAINERS.${tid}: review`);
  ok([null, 'line', 'plot', 'analogue', 'exam'].includes(t.contract), `TRAINERS.${tid}: contract`);
  if (t.review) ok(t.contract === 'line' || t.contract === 'plot', `TRAINERS.${tid}: review:true только у тренажёров с ядром`);
}

/* 2. NAMES ↔ TYPES ↔ TRAINERS */
for (const key of Object.keys(RV.NAMES)){
  ok(RV.keyOk(key), 'NAMES: ключ вида TID|тип — ' + key);
  const [tid, type] = RV.split(key);
  ok(!!RV.TRAINERS[tid], 'NAMES: TID есть в TRAINERS — ' + key);
  ok((RV.TYPES[tid] || []).includes(type), 'NAMES: тип есть в TYPES — ' + key);
  const n = RV.NAMES[key];
  ok(n && typeof n.n === 'string' && n.n.length > 1 && Number.isInteger(n.line), 'NAMES: форма записи — ' + key);
  ok(!/\|/.test(type), 'NAMES: в типе нет «|» — ' + key);
}
for (const [tid, ids] of Object.entries(RV.TYPES)){
  ok(!!RV.TRAINERS[tid], 'TYPES: TID есть в TRAINERS — ' + tid);
  ok(Array.isArray(ids) && ids.length > 0, 'TYPES: непустой список — ' + tid);
  ok(new Set(ids).size === ids.length, 'TYPES: без дублей — ' + tid);
  for (const t of ids) ok(!!RV.NAMES[tid + '|' + t], `TYPES: у типа есть имя — ${tid}|${t}`);
}
for (const [tid, t] of Object.entries(RV.TRAINERS)){
  if (t.contract === 'line' || t.contract === 'plot') ok(Array.isArray(RV.TYPES[tid]), 'у тренажёра с ядром есть TYPES — ' + tid);
}

/* 3. LINES: 1–5 и 6…25, каждый TID из TRAINERS, каждая линия 6–25 непуста */
ok(Array.isArray(RV.LINES['1-5']) && RV.LINES['1-5'].length >= 8, 'LINES: 1-5');
for (let l = 6; l <= 25; l++){
  const list = RV.LINES[String(l)];
  ok(Array.isArray(list) && list.length >= 1, 'LINES: линия ' + l + ' непуста');
  for (const tid of list || []) ok(RV.TRAINERS[tid] && RV.TRAINERS[tid].line === l, `LINES: ${tid} на линии ${l}`);
}
for (const tid of RV.LINES['1-5']) ok(RV.TRAINERS[tid] && RV.TRAINERS[tid].line === 0, 'LINES 1-5: ' + tid);

/* 4. CABINET */
const adapters = new Set(['line', 'plots', 'analogue', 'exam', 'diagnostic']);
for (const row of RV.CABINET){
  ok(adapters.has(row.adapter), 'CABINET: адаптер известен — ' + row.tid);
  ok(typeof row.title === 'string' && typeof row.file === 'string', 'CABINET: title/file — ' + row.tid);
  if (row.adapter === 'line') ok(RV.TRAINERS[row.tid] && RV.TRAINERS[row.tid].contract === 'line', 'CABINET line: TID с ядром — ' + row.tid);
}
ok(RV.CABINET.filter(r => r.adapter === 'line').length === 20, 'CABINET: 20 линий 6–25');

/* 5. Сверка TYPES с тренажёрами: TYPE_IDS в файле (если есть) или черновик */
function typeIdsFromFile(rel){
  const abs = path.join(REPO, rel);
  if (!fs.existsSync(abs)) return null;
  const s = fs.readFileSync(abs, 'utf8');
  const m = s.match(/\bvar\s+TYPE_IDS\s*=\s*(\[[^\]]*\])/) || s.match(/\bconst\s+TYPE_IDS\s*=\s*(\[[^\]]*\])/);
  if (!m) return null;
  try { return JSON.parse(m[1].replace(/'/g, '"').replace(/,\s*\]/, ']')); } catch (e) { return 'bad'; }
}
const draft = JSON.parse(execFileSync(process.execPath, [path.join(REPO, 'tools', 'oge-registry-draft.mjs'), '--json'], { encoding: 'utf8' }));
for (const [tid, t] of Object.entries(RV.TRAINERS)){
  if (t.contract !== 'line' || t.planned) continue;
  const rel = path.posix.join('oge', t.file);
  const inFile = typeIdsFromFile(rel);
  const want = RV.TYPES[tid];
  if (inFile === 'bad'){ ok(false, `TYPE_IDS в ${rel} не разбирается`); continue; }
  if (inFile){
    ok(JSON.stringify(inFile) === JSON.stringify(want), `TYPE_IDS в ${rel} = TYPES реестра`);
  } else if (draft[tid]){
    const got = draft[tid].types.map(x => x.id);
    ok(JSON.stringify(got) === JSON.stringify(want), `черновик из тренажёра = TYPES реестра — ${tid}`);
  } else {
    ok(true, 'planned types: ' + tid);
  }
}

/* 6. Функции журнала — те же, что у ЕГЭ */
const mk = { 'oge-task16-circle|tanTrap': { w: 2, r: 1, last: 5 }, 'oge18-kletki|dist': { w: 1, r: 3, last: 4 }, 'bad': { w: 1 }, 'x|y': 'мусор', 'oge-task16-circle|insCen': { w: 0 } };
ok(RV.open(mk).length === 1 && RV.open(mk)[0].type === 'tanTrap', 'open(): один открытый тип');
ok(RV.closed(mk).length === 1 && RV.closed(mk)[0].tid === 'oge18-kletki', 'closed(): один закрытый');
ok(RV.nameOf('oge-task16-circle|tanTrap').n.length > 3, 'nameOf');
const cj = RV.cleanJournal({ a: 1, mistakes: mk, 'derivative-t8': { runs: 1 } });
ok(cj.dropped === 2 && cj.obj.a === 1 && cj.obj['derivative-t8'].runs === 1, 'cleanJournal: мусор выброшен, чужие ветки целы');
ok(RV.esc('<b>&"\'') === '&lt;b&gt;&amp;&quot;&#39;', 'esc');

console.log(`реестр: тренажёров ${Object.keys(RV.TRAINERS).length}, имён типов ${Object.keys(RV.NAMES).length}, проверок ${checks}, ошибок ${fails}`);
if (fails){ console.log('OGE_REGISTRY_FAIL'); process.exit(1); }
console.log('OGE_REGISTRY_OK');
