/* Целостность ссылок раздела: каждая ссылка страниц курса, каждый file
   из реестра, каждый адрес JS-таблиц exam/*.html (LINE_TRAINER, TRAINER)
   и оглавления мини-курса (href:"…" в trainers/parameters-18/index.html)
   и каждый src/href всех страниц курса должны вести на существующий файл,
   который GitHub Pages опубликует: имя с точным регистром, у каталога —
   index.html, без компонентов на «_» и «.».

   Список PENDING (непереданные страницы) снят 24.09.2026: архив курса
   влит целиком, а отсутствовавшая rationalization.html заменена ссылкой
   на модуль 9 курса неравенств — inequalities.html#m8. Любая ссылка на
   несуществующий файл теперь валит проверку без исключений. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { makeBoot, ROOT } = require('./boot.js');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

const errors = [];
const boot = makeBoot(errors);
const KEY = 'mathExamCourseProgress.v1';

/* Куда ссылаются: адрес от корня курса -> откуда на него ссылаются.
   base — каталог ссылающейся страницы относительно корня курса
   ('' для index.html, 'exam' для exam/variant.html и т. д.). */
const seen = new Map();
function note(href, where, base){
  if (!href) return;
  if (/^(https?:|mailto:|tel:|javascript:|data:|#)/i.test(href)) return;
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return;
  const target = path.posix.normalize(path.posix.join(base || '', clean));
  if (!seen.has(target)) seen.set(target, new Set());
  seen.get(target).add(where);
}
function collect(w, where){
  Array.from(w.document.querySelectorAll('a[href]')).forEach(a => note(a.getAttribute('href'), where));
  Array.from(w.document.querySelectorAll('script[data-inlined-from], link[href]')).forEach(el => {
    note(el.getAttribute('data-inlined-from') || el.getAttribute('href'), where);
  });
}
/* Таблица вида NAME = { 1:"…", 2:"…", … } из исходника страницы. */
function jsTable(src, name){
  const m = src.match(new RegExp('\\b' + name + '\\s*=\\s*\\{([^}]*)\\}'));
  if (!m) return null;
  return Array.from(m[1].matchAll(/(\d+)\s*:\s*"([^"]+)"/g)).map(p => ({ line: +p[1], href: p[2] }));
}

/* ================= 1. index.html: карточки и пилюли маршрута ================= */
{
  const w = boot('index.html');
  const cards = Array.from(w.document.querySelectorAll('a[href]')).filter(a => /trainers\/|exam\//.test(a.getAttribute('href')));
  ok(cards.length >= 20, `index: карточек и пилюль со ссылками ${cards.length}`);
  ok(errors.length === 0, 'index: без JS-ошибок: ' + errors.join(' | '));
  collect(w, 'index.html');
}

/* ================= 2. review.html: «Повторить» и «Отработать» ================= */
{
  /* Журнал с открытой и закрытой записью у каждого тренажёра реестра плюс
     пробник с потерями на всех 19 линиях — так отрисуются все ветки. */
  const seed = win => {
    const reg = fs.readFileSync(path.join(ROOT, 'registry.js'), 'utf8');
    const RV = new Function(reg + '; return RV;')();
    const mistakes = {};
    Object.keys(RV.TRAINERS).forEach((tid, i) => {
      mistakes[tid + '|open' + i] = { w: 2, r: 0, lastWrong: 10, last: 10 };
      mistakes[tid + '|done' + i] = { w: 1, r: 3, lastWrong: 5, last: 9 };
    });
    const lines = {};
    for (let i = 1; i <= 19; i++) lines[i] = 0;
    win.localStorage.setItem(KEY, JSON.stringify({
      mistakes,
      'full-exam': { attempts: [{ ts: Date.now(), primary: 5, test: 4, lines }] }
    }));
  };
  const w = boot('review.html', seed);
  const d = w.document;
  const repeat = Array.from(d.querySelectorAll('#openList a.btn, #closedList a.btn'));
  ok(repeat.length >= Object.keys(new Function(fs.readFileSync(path.join(ROOT, 'registry.js'), 'utf8') + '; return RV;')().TRAINERS).length,
    `review: кнопок «Повторить» ${repeat.length}`);
  repeat.forEach(a => ok(/\.html($|\?)/.test(a.getAttribute('href')), 'review: «Повторить» ведёт на html: ' + a.getAttribute('href')));
  const work = Array.from(d.querySelectorAll('#examList a.btn'));
  ok(work.length === 19, `review: кнопок «Отработать» по одной на линию (${work.length})`);
  ok(errors.length === 0, 'review: без JS-ошибок: ' + errors.join(' | '));
  collect(w, 'review.html');
}

/* ================= 3. teacher.html ================= */
{
  const w = boot('teacher.html');
  ok(w.document.querySelectorAll('.trow').length > 0, 'teacher: сводка отрисована');
  ok(errors.length === 0, 'teacher: без JS-ошибок: ' + errors.join(' | '));
  collect(w, 'teacher.html');
}

/* ================= 4. Реестр: TRAINERS и CABINET ================= */
{
  const reg = fs.readFileSync(path.join(ROOT, 'registry.js'), 'utf8');
  const RV = new Function(reg + '; return RV;')();
  Object.keys(RV.TRAINERS).forEach(tid => note(RV.TRAINERS[tid].file, 'RV.TRAINERS[' + tid + ']'));
  RV.CABINET.forEach(c => note(c.file, 'RV.CABINET[' + c.tid + ']'));
  ok(RV.CABINET.every(c => c.file), 'реестр: у каждой записи кабинета указан файл');
}

/* ================= 4а. JS-таблицы страниц экзамена ================= */
{
  /* «Теория линии» (variant.html) и «→ отработать эту линию» (full-exam.html)
     собираются скриптом из таблиц LINE_TRAINER и TRAINER — в разметке этих
     ссылок нет, поэтому раньше проверка их не видела. Адреса в таблицах
     относительны каталога exam/. */
  const byLine = {};
  const add = (line, target) => { (byLine[line] = byLine[line] || new Set()).add(target); };
  for (const [file, name] of [['exam/variant.html', 'LINE_TRAINER'], ['exam/full-exam.html', 'TRAINER']]){
    const rows = jsTable(fs.readFileSync(path.join(ROOT, file), 'utf8'), name);
    ok(!!rows, file + ': найдена таблица ' + name);
    if (!rows) continue;
    const lines = rows.map(r => r.line).sort((a, b) => a - b);
    ok(rows.length === 19 && lines.every((n, i) => n === i + 1), file + ': ' + name + ' — ровно линии 1–19, записей ' + rows.length);
    rows.forEach(r => {
      note(r.href, file + ' ' + name + '[' + r.line + ']', 'exam');
      add(r.line, path.posix.normalize(path.posix.join('exam', r.href.split('#')[0].split('?')[0])));
    });
  }
  /* Журнал ошибок отправляет «Отработать» туда же, куда и страницы экзамена. */
  const rv = jsTable(fs.readFileSync(path.join(ROOT, 'review.html'), 'utf8'), 'LINE_TRAINER');
  ok(!!rv && rv.length === 19, 'review.html: таблица LINE_TRAINER на 19 линий');
  (rv || []).forEach(r => add(r.line, path.posix.normalize(r.href.split('#')[0].split('?')[0])));
  for (let i = 1; i <= 19; i++){
    const set = byLine[i] || new Set();
    ok(set.size === 1, 'линия ' + i + ': журнал и страницы экзамена ведут в один тренажёр — ' + Array.from(set).join(' | '));
  }
}

/* ================= 4б. Все страницы курса: src и href ================= */
{
  /* Каждая страница разбирается без запуска скриптов: script[src], img[src],
     link[href], a[href]. Так проверяются и подключения вроде
     lib/mathjax/tex-chtml.js, и ссылки «← Курс» из тренажёров, и исходящие
     ссылки глав мини-курса (его оглавление собирается скриптом — это 4в).
     tests/, src/, node_modules/ и служебный _istochniki/ — не страницы сайта. */
  const SKIP = new Set(['tests', 'src', 'node_modules', '_istochniki']);
  const pages = [];
  (function walk(dir){
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })){
      const rel = dir ? dir + '/' + e.name : e.name;
      if (e.isDirectory()){ if (!SKIP.has(e.name)) walk(rel); }
      else if (/\.html$/.test(e.name)) pages.push(rel);
    }
  })('');
  ok(pages.length >= 30, 'страниц курса найдено: ' + pages.length);
  const external = [];
  for (const file of pages){
    const doc = new JSDOM(fs.readFileSync(path.join(ROOT, file), 'utf8')).window.document;
    const base = path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file);
    doc.querySelectorAll('script[src], img[src]').forEach(el => note(el.getAttribute('src'), file, base));
    doc.querySelectorAll('a[href], link[href]').forEach(el => note(el.getAttribute('href'), file, base));
    doc.querySelectorAll('script[src]').forEach(el => {
      if (/^(https?:)?\/\//i.test(el.getAttribute('src'))) external.push(file + ' → ' + el.getAttribute('src'));
    });
  }
  ok(external.length === 0, 'скрипты страниц курса только локальные (работа офлайн): ' + external.join(' | '));
  const mj = seen.get('trainers/lib/mathjax/tex-chtml.js');
  ok(!!mj && mj.has('trainers/inequalities.html') && mj.has('trainers/interval-method.html'),
     'MathJax подключён локально: inequalities и interval-method');
  ok(pages.includes('trainers/parameters-18/index.html'), 'мини-курс по параметрам среди страниц курса');
}

/* ================= 4в. Оглавление мини-курса: JS-таблица href:"…" ================= */
{
  /* Карточки оглавления trainers/parameters-18/index.html собираются
     скриптом из таблицы { …, href:"intro.html", ready:true } (el.href=t.href) —
     в разметке этих ссылок нет, разбор 4б их не видит. Готовых записей 7:
     шесть глав и вариант по линии 18; у неготовых href:null. */
  const file = 'trainers/parameters-18/index.html';
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const hrefs = Array.from(src.matchAll(/\bhref\s*:\s*(["'])([^"']+)\1/g)).map(m => m[2]);
  const nulls = (src.match(/\bhref\s*:\s*null\b/g) || []).length;
  ok(hrefs.length === 7, file + ': записей с адресом в оглавлении 7 (6 глав + вариант), найдено ' + hrefs.length + ': ' + hrefs.join(', '));
  const chapters = hrefs.filter(h => /^[a-z0-9-]+\.html$/.test(h));
  ok(chapters.length === 6, file + ': шесть глав рядом с оглавлением: ' + chapters.join(', '));
  ok(hrefs.includes('../../exam/variant.html?m=18'), file + ': оглавление ведёт в вариант по линии 18');
  ok(nulls >= 1, file + ': неготовые главы без адреса (href:null) — ' + nulls);
  hrefs.forEach(h => note(h, file + ' [оглавление]', 'trainers/parameters-18'));
  chapters.forEach(h => ok(seen.has('trainers/parameters-18/' + h), 'глава мини-курса учтена в проверке ссылок: ' + h));
}

/* ================= 5. Сверка с диском ================= */
/* GitHub Pages различает регистр, а ссылка на каталог без index.html даёт
   404. fs.existsSync на Windows не видит ни того, ни другого, поэтому имя
   сверяется с листингом каталога на каждом уровне. */
function existsExact(rel){
  let cur = ROOT;
  const parts = rel.split('/').filter(p => p && p !== '.');
  for (const p of parts){
    if (p === '..'){ cur = path.dirname(cur); continue; }
    let names;
    try{ names = fs.readdirSync(cur); }catch(e){ return false; }
    if (!names.includes(p)) return false;
    cur = path.join(cur, p);
  }
  let st;
  try{ st = fs.statSync(cur); }catch(e){ return false; }
  if (st.isDirectory()){
    try{ return fs.readdirSync(cur).includes('index.html'); }catch(e){ return false; }
  }
  return st.isFile();
}
{
  for (const [href, from] of seen){
    if (existsExact(href)) continue;
    fails++; checks++;
    console.log('FAIL: битая ссылка ' + href + ' (из: ' + Array.from(from).join(', ') + ')');
  }
  checks++;
  ok(true, `ссылок проверено ${seen.size}`);

  /* GitHub Pages собирает сайт Jekyll'ом: файлы и каталоги с «_» или «.»
     в начале имени не публикуются, ссылка на них даст 404. */
  const hidden = Array.from(seen.keys()).filter(h => h.split('/').some(c => c !== '..' && /^[_.]/.test(c)));
  ok(hidden.length === 0, 'ни одна ссылка не ведёт в каталог, скрытый от Jekyll: ' + hidden.join(', '));
}

/* ================= 6. Три выложенных тренажёра на месте ================= */
{
  for (const f of ['trainers/planimetry-yashchenko-t1.html',
                   'trainers/pryamougolny-treugolnik-trenazher.html',
                   'trainers/vectors-yashchenko-t2.html']){
    ok(fs.existsSync(path.join(ROOT, f)), 'выложен: ' + f);
    ok(seen.has(f), 'на него ссылается страница курса: ' + f);
  }
}

/* ================= 7. Финансы и стерео — локальные копии курса ================= */
{
  /* Решение владельца (24.09.2026): курс хранит свои копии — финансы
     с учительским режимом за ?teacher=1 и объединённую линейку
     стереометрии (281 задача задания 3 + 7 «Развёрток»). Корневые
     trainers/finance-nonstandard-trainer.html и
     trainers/ege-profile-stereometry-3d/ остаются опубликованными как
     были, но курс на них больше не ссылается. Проверка названа отдельно,
     чтобы переименование давало внятное сообщение, а не общее
     «битая ссылка». */
  const LOCAL = ['trainers/finance.html', 'trainers/stereo/index.html'];
  for (const f of LOCAL){
    ok(fs.existsSync(path.join(ROOT, f)), 'локальная копия курса на месте: ' + f);
    ok(seen.has(f), 'на неё ссылается страница курса: ' + f);
    const from = seen.get(f) || new Set();
    ok(['index.html', 'review.html'].every(p => from.has(p)) && Array.from(from).some(p => /^exam\//.test(p)),
       'на неё ведут навигатор, журнал и страницы экзамена: ' + f + ' ← ' + Array.from(from).join(', '));
  }
  ok(Object.values(new Function(fs.readFileSync(path.join(ROOT, 'registry.js'), 'utf8') + '; return RV;')().CABINET)
       .some(c => c.tid === 'financeNonstandardTrainer' && c.file === 'trainers/finance.html'),
     'кабинет учителя: финансы ведут на локальную копию');
  const OLD = ['../trainers/finance-nonstandard-trainer.html', '../trainers/ege-profile-stereometry-3d/index.html'];
  for (const f of OLD) ok(!seen.has(f), 'курс больше не ведёт в корневой тренажёр: ' + f);
  /* Стереометрия тянет ресурсы относительно себя — они должны лежать рядом
     с той страницей, на которую ведёт ссылка. */
  for (const r of ['css/style.css', 'js/three.min.js', 'js/data.js', 'js/trainer.js']){
    const p = path.join(ROOT, 'trainers/stereo', r);
    ok(fs.existsSync(p), 'стереометрия: ресурс на месте — ' + r);
  }
}

console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);
