#!/usr/bin/env node
/*
  Проверка ссылок страниц ОГЭ относительно корня сайта.

  Берёт страницы раздела ОГЭ (см. PAGES), вытаскивает href="…"/src="…" и
  JS-свойства href:"…" вне комментариев и проверяет, что цель существует на
  диске с точным регистром имени (GitHub Pages различает регистр), что
  ссылка на каталог ведёт в каталог с index.html и что в пути нет компонента
  на «_» или «.» (Jekyll такие не публикует). Абсолютные пути `/x` считаются
  от корня репозитория, относительные — от каталога страницы. Внешние
  адреса (http, mailto, data:, #, javascript:) не проверяются.

  Ничего не меняет. Код выхода 1 при битых ссылках, иначе печатает маркер
  OGE_CHECK_LINKS_OK. Запуск из корня репозитория:
      node tools/oge-check-links.mjs            # страницы по умолчанию
      node tools/oge-check-links.mjs a.html …   # свои страницы
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_PAGES = [
  'index.html',
  'oge/index.html',
  'oge/algebra/task-09-linear-equations.html',
  'oge/algebra/task-14-sequences.html',
  'oge/probability/task-10-probability.html',
  'oge/geometry/task-15-external-angle.html',
  'trainers/index.html',
  'trainers/oge-course/index.html',
  'trainers/oge-1-5-trainers/index.html',
  'trainers/oge-1-5-trainers/practice-1-5-map.html',
  'trainers/oge-basics/index.html',
  'trainers/oge-basics/percentages/index.html',
  'trainers/oge-2027-analogue-1.html',
  'trainers/oge-task6-fractions.html',
  'trainers/oge-task7-number-line.html',
  'trainers/oge-task8-powers-roots.html',
  'trainers/oge-task9-equations.html',
  'trainers/oge-task10-probability.html',
  'trainers/oge-task11-graphs-trainer.html',
  'trainers/oge-task12-formulas-trainer.html',
  'trainers/oge-task13-inequalities.html',
  'trainers/oge13-inequalities-series.html',
  'trainers/oge-task14-progressions.html',
  'trainers/oge-task16-circle.html',
  'trainers/oge-task17-quadrilaterals.html',
  'trainers/oge-task18-grid.html',
  'trainers/task19-trainer.html',
  'trainers/oge-task20-equations.html',
  'trainers/oge-task21-word-problems.html',
  'trainers/oge-task22-functions-graphs.html',
  'trainers/oge-task23-geometry-calculations.html',
  'trainers/oge-task24-proofs.html',
  'trainers/oge-task25-geometry.html',
];

const LINK_RE = /(?:\b(?:href|src)\s*=|\bhref\s*:)\s*(["'])([^"']+)\1/gi;
const EXT_RE = /^(?:https?:|mailto:|tel:|javascript:|data:|blob:|\/\/|#)/i;
const COMMENT_RE = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g;

function hiddenFromJekyll(rel) {
  return rel.split('/').some((c) => c && c !== '..' && c !== '.htaccess' && (c[0] === '_' || c[0] === '.'));
}

/* цель на диске с точным регистром каждого компонента; для каталога — его index.html */
function resolveExact(absTarget) {
  const rel = path.relative(ROOT, absTarget);
  if (rel.startsWith('..')) return { ok: false, why: 'вне корня сайта' };
  let cur = ROOT;
  for (const c of rel.split(path.sep)) {
    if (!c || c === '.') continue;
    let names;
    try { names = fs.readdirSync(cur); } catch { return { ok: false, why: 'нет каталога ' + path.relative(ROOT, cur) }; }
    if (!names.includes(c)) {
      const ci = names.find((n) => n.toLowerCase() === c.toLowerCase());
      return { ok: false, why: ci ? `регистр: на диске «${ci}»` : 'нет файла' };
    }
    cur = path.join(cur, c);
  }
  const st = fs.statSync(cur);
  if (st.isDirectory()) {
    if (!fs.existsSync(path.join(cur, 'index.html'))) return { ok: false, why: 'каталог без index.html' };
  }
  return { ok: true };
}

function checkPage(page) {
  const abs = path.join(ROOT, page);
  if (!fs.existsSync(abs)) return [{ page, link: '', why: 'страницы нет' }];
  const src = fs.readFileSync(abs, 'utf8').replace(COMMENT_RE, '');
  const dir = path.dirname(abs);
  const broken = [];
  const seen = new Set();
  let m;
  while ((m = LINK_RE.exec(src))) {
    let link = m[2].trim();
    if (!link || EXT_RE.test(link) || link.includes('${') || link.startsWith('{')) continue;
    if (/\s/.test(link) || /[^\x20-\x7e]/.test(link)) continue; // подпись, а не адрес
    link = link.split('#')[0].split('?')[0];
    if (!link) continue;
    if (seen.has(link)) continue;
    seen.add(link);
    let target;
    try { target = decodeURIComponent(link); } catch { target = link; }
    const absTarget = target.startsWith('/') ? path.join(ROOT, target) : path.resolve(dir, target);
    if (hiddenFromJekyll(path.relative(ROOT, absTarget).split(path.sep).join('/'))) {
      broken.push({ page, link, why: 'скрыто от Jekyll (компонент на «_» или «.»)' });
      continue;
    }
    const r = resolveExact(absTarget);
    if (!r.ok) broken.push({ page, link, why: r.why });
  }
  return broken;
}

const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES;
let broken = [];
for (const p of pages) broken = broken.concat(checkPage(p));

if (broken.length) {
  console.error(`Битых ссылок: ${broken.length}`);
  for (const b of broken) console.error(`  ${b.page}: ${b.link || '(нет файла)'} — ${b.why}`);
  process.exit(1);
}
console.log(`OGE_CHECK_LINKS_OK: ${pages.length} страниц, битых ссылок 0`);
