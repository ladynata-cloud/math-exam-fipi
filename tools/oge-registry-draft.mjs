#!/usr/bin/env node
/*
  Черновик реестра курса ОГЭ: вытаскивает из опубликованных тренажёров
  идентификаторы типов задач и их русские имена и печатает объект NAMES
  в формате ege-profil/registry.js ("TID|тип" → { n, line }).

  Ничего не меняет. Запуск из корня репозитория:
      node tools/oge-registry-draft.mjs            # печатает NAMES
      node tools/oge-registry-draft.mjs --json     # печатает JSON по тренажёрам

  Источник истины по ключам типов — сами тренажёры (SUBS, S17, TYPES, MODULES,
  GROUPS, STEP_GROUPS, коды прогрессий). Реестр oge/registry.js собран из
  этого вывода и дальше ведётся руками; registry-test сверяет их между собой.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = (rel) => fs.readFileSync(path.join(ROOT, 'trainers', rel), 'utf8');

function all(re, s, fn) {
  const out = [];
  let m;
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = r.exec(s))) out.push(fn(m));
  return out;
}

const extractors = {
  'oge-task16-circle': { line: 16, file: 'oge-task16-circle.html', get(s) {
    const topics = Object.fromEntries(all(/(\w+):'([^']*)'/g, s.slice(s.indexOf('const TOPICS='), s.indexOf('const TOPICS=') + 300), (m) => [m[1], m[2]]));
    return all(/\b(\w+):\{topic:'(\w+)',name:'([^']*)'/g, s, (m) => ({ id: m[1], group: topics[m[2]] || m[2], n: m[3] }));
  } },
  'oge17-chetyrehugolniki': { line: 17, file: 'oge-task17-quadrilaterals.html', get(s) {
    const topics = Object.fromEntries(all(/(\w+):'([^']*)'/g, s.slice(s.indexOf('const TOPICS='), s.indexOf('const TOPICS=') + 200), (m) => [m[1], m[2]]));
    return all(/def\('(\w+)',\{topic:'(\w+)',name:'([^']*)'/g, s, (m) => ({ id: m[1], group: topics[m[2]] || m[2], n: m[3] }));
  } },
  'oge18-kletki': { line: 18, file: 'oge-task18-grid.html', get(s) {
    const topics = Object.fromEntries(all(/(\w+):'([^']*)'/g, s.slice(s.indexOf('const TOPICS='), s.indexOf('const TOPICS=') + 200), (m) => [m[1], m[2]]));
    return all(/SUBS\.(\w+)=\{topic:'(\w+)',name:'([^']*)'/g, s, (m) => ({ id: m[1], group: topics[m[2]] || m[2], n: m[3] }));
  } },
  'oge23-vychisleniya': { line: 23, file: 'oge-task23-geometry-calculations.html', get(s) {
    const themes = { quad: 'Четырёхугольники', tri: 'Треугольники', circ: 'Окружность' };
    return all(/SUBS\.(\w+)=\{theme:'(\w+)',name:'([^']*)'/g, s, (m) => ({ id: m[1], group: themes[m[2]] || m[2], n: m[3] }));
  } },
  'oge25-geometriya': { line: 25, file: 'oge-task25-geometry.html', get(s) {
    return all(/TYPES\.push\(\{\s*id:(\d+),\s*topic:'([^']*)',\s*pill:'(\w+)',\s*tag:'([^']*)',\s*title:'([^']*)'/g, s, (m) => ({ id: m[1], group: m[2], n: m[5] }));
  } },
  'oge24-dokazatelstva': { line: 24, file: 'oge-task24-proofs.html', get(s) {
    return all(/"id":\s*"(t\d+)",\s*"theme":\s*"([^"]*)",\s*"fig":\s*"[^"]*",\s*"code":\s*"[^"]*",\s*"title":\s*"([^"]*)"/g, s, (m) => ({ id: m[1], group: m[2], n: m[3] }));
  } },
  'oge-t20-algebra': { line: 20, file: 'oge-task20-equations.html', get(s) {
    return all(/\b([A-Z][A-Z0-9]*):\{\s*num:'([\d.]+)',[^]{0,120}?title:'([^']*)'/g, s, (m) => ({ id: m[1], group: '№' + m[2], n: m[3] }));
  } },
  'oge-t21-tekst': { line: 21, file: 'oge-task21-word-problems.html', get(s) {
    const cats = { move: 'Движение', work: 'Работа', perc: 'Проценты' };
    return all(/MODULES\.push\(\{\s*key:'(\w+)',\s*title:'([^']*)',\s*cat:'(\w+)'/g, s, (m) => ({ id: m[1], group: cats[m[3]] || m[3], n: m[2] }));
  } },
  'oge-t22-grafiki': { line: 22, file: 'oge-task22-functions-graphs.html', get() {
    // подтипы зашиты в генераторах без подписей — имена даны по смыслу
    return [
      { id: 'parline', group: 'Кусочные функции', n: 'Парабола и прямая' },
      { id: 'parhyp', group: 'Кусочные функции', n: 'Парабола и гипербола' },
      { id: 'absquad', group: 'Модуль', n: 'Модуль квадратного трёхчлена' },
      { id: 'xabsx', group: 'Модуль', n: 'x·|x| и слагаемые с модулем' },
      { id: 'sqminuslin', group: 'Модуль', n: 'Квадрат минус модуль линейной' },
      { id: 'alinplusquad', group: 'Модуль', n: 'Модуль линейной плюс парабола' },
      { id: 'inv_kx', group: 'Выколотая точка', n: 'Гипербола с выколотой точкой' },
      { id: 'shift_m', group: 'Выколотая точка', n: 'Сдвиг и выколотая точка' },
      { id: 'parab_kx', group: 'Выколотая точка', n: 'Парабола с выколотой точкой' },
    ];
  } },
  'oge-t12-formuly': { line: 12, file: 'oge-task12-formulas-trainer.html', get(s) {
    const i = s.indexOf('TYPES={');
    return all(/(\d+):\{name:'([^']*)'/g, s.slice(i, i + 2000), (m) => ({ id: m[1], group: 'Расчёты по формулам', n: m[2] }));
  } },
  'oge-t14-progressii': { line: 14, file: 'oge-task14-progressions.html', get(s) {
    const g = { ap: 'Арифметическая', gp: 'Геометрическая', story: 'Сюжетные' };
    return all(/code:"([A-Z0-9-]+)",\s*group:"(\w+)",\s*title:"([^"]*)"/g, s, (m) => ({ id: m[1], group: g[m[2]] || m[2], n: m[3] }));
  } },
  'oge-t10-veroyatnost': { line: 10, file: 'oge-task10-probability.html', get(s) {
    // TYPE_LIST=[['10.1','Равновозможные исходы'],…]; в ключе журнала точка → «_»
    const i = s.indexOf('const TYPE_LIST=[');
    return all(/\['(10\.\d)','([^']*)'\]/g, s.slice(i, i + 600), (m) => ({ id: m[1].replace('.', '_'), group: 'Вероятность', n: m[2] }));
  } },
  'oge-t8-stepeni': { line: 8, file: 'oge-task8-powers-roots.html', get(s) {
    const i = s.indexOf('const GROUPS=[');
    return all(/\{k:"(\w+)",\s*name:"([^"]*)"/g, s.slice(i, i + 2500), (m) => ({ id: m[1], group: 'Степени и корни', n: m[2] }));
  } },
  'oge-t9-uravneniya': { line: 9, file: 'oge-task9-equations.html', get() {
    // FAMMETA даёт только канал lin/quad/frac; имена — по разбору генераторов
    const lin = 'Линейные', quad = 'Квадратные', frac = 'Дробно-рациональные';
    return [
      { id: 'L', group: lin, n: 'Линейное: перенос слагаемых' }, { id: 'LB', group: lin, n: 'Линейное со скобками' },
      { id: 'LF', group: lin, n: 'Линейное с дробями' }, { id: 'LSQ', group: lin, n: 'Сводится к линейному через квадраты' },
      { id: 'QNB', group: quad, n: 'Неполное квадратное: без b' }, { id: 'QNC', group: quad, n: 'Неполное квадратное: без c' },
      { id: 'QNCm', group: quad, n: 'Неполное квадратное: x² = kx' }, { id: 'QF', group: quad, n: 'Полное квадратное: дискриминант' },
      { id: 'QR', group: quad, n: 'Квадратное: корни по Виету' }, { id: 'QP', group: quad, n: 'Квадратное с произведением скобок' },
      { id: 'PROP', group: frac, n: 'Пропорция' }, { id: 'Z', group: frac, n: 'Дробь равна нулю' },
      { id: 'NZ', group: frac, n: 'Дробь равна числу' }, { id: 'XF', group: frac, n: 'Неизвестная в знаменателе' },
      { id: 'S2', group: frac, n: 'Две дроби равны' }, { id: 'SB', group: frac, n: 'Дроби со скобками' },
    ];
  } },
  'oge-t7-pryamaya': { line: 7, file: 'oge-task7-number-line.html', get(s) {
    const i = s.indexOf('STEP_GROUPS={');
    const block = s.slice(i, i + 1500);
    const out = [];
    const gr = /(\w+):\{label:"([^"]*)",\s*subs:\[([^\]]*)\]/g;
    let m;
    while ((m = gr.exec(block))) {
      for (const sm of all(/\{id:"(\w+)",label:"([^"]*)"\}/g, m[3], (x) => x)) {
        if (sm[1] === 'mix') continue; // «вперемешку» — режим, а не тип
        out.push({ id: m[1] + '/' + sm[1], group: m[2], n: sm[2] });
      }
    }
    return out;
  } },
  'oge-t11-grafiki': { line: 11, file: 'oge-task11-graphs-trainer.html', get(s) {
    return all(/data-t="(t4\d)">([^<]*)</g, s, (m) => ({ id: m[1], group: 'Соответствие график — формула', n: m[2] }));
  } },
};

const result = {};
for (const [tid, ex] of Object.entries(extractors)) {
  const types = ex.get(T(ex.file));
  result[tid] = { line: ex.line, file: 'trainers/' + ex.file, types };
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('var NAMES = {');
  for (const [tid, r] of Object.entries(result)) {
    console.log(`  /* ${r.line} · ${r.file} · ${r.types.length} типов */`);
    for (const t of r.types) {
      // группа не дублируется: у 25 заголовок типа уже начинается с темы
      // («Трапеция: …»), у 21 единственный модуль «Работа» называется как группа
      const n = !t.group || t.n === t.group || t.n.startsWith(t.group + ':') ? t.n : t.group + ': ' + t.n;
      console.log(`  ${JSON.stringify(tid + '|' + t.id)}: { n: ${JSON.stringify(n)}, line: ${r.line} },`);
    }
  }
  console.log('};');
  const total = Object.values(result).reduce((a, r) => a + r.types.length, 0);
  console.error(`OGE_REGISTRY_DRAFT: ${Object.keys(result).length} тренажёров, ${total} типов`);
}
