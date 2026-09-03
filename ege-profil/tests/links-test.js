/* Целостность ссылок раздела: каждая ссылка страниц курса и каждый file
   из реестра должны вести на существующий файл.

   Часть курса ещё не передана в репозиторий — эти адреса перечислены ниже
   в PENDING поимённо. Список работает в обе стороны: ссылка на
   несуществующий файл вне списка валит проверку, а запись из списка,
   которая внезапно нашлась на диске или на которую больше никто не
   ссылается, тоже валит — чтобы список не превращался в свалку. */
const fs = require('fs');
const path = require('path');
const { makeBoot, ROOT } = require('./boot.js');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

const errors = [];
const boot = makeBoot(errors);
const KEY = 'mathExamCourseProgress.v1';

/* Тренажёры и страницы курса, которых в репозитории пока нет.

   Пять адресов ушли отсюда не потому, что файлы приехали, а потому что
   нашлись на месте: эти тренажёры давно лежат в корневом trainers/ под
   своими именами, и страницы курса теперь ссылаются туда через ../ ,
   а не ждут копию под коротким именем. */
const PENDING = new Set([
  'exam/full-exam.html',
  'exam/variant.html',
  'trainers/applied-t910.html',
  'trainers/derivative-t8.html',
  'trainers/expert.html',
  'trainers/functions-t1112.html',
  'trainers/inequalities.html',
  'trainers/interval-method.html',
  'trainers/numbers-t19.html',
  'trainers/parameters-t18.html',
  'trainers/planimetry-t17.html',
  'trainers/probability-t45.html',
  'trainers/rationalization.html',
  'trainers/stereo-t14.html',
  'trainers/trigonometry.html'
]);

/* Куда ссылаются: адрес -> откуда на него ссылаются. */
const seen = new Map();
function note(href, where){
  if (!href) return;
  if (/^(https?:|mailto:|tel:|javascript:|data:|#)/i.test(href)) return;
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return;
  if (!seen.has(clean)) seen.set(clean, new Set());
  seen.get(clean).add(where);
}
function collect(w, where){
  Array.from(w.document.querySelectorAll('a[href]')).forEach(a => note(a.getAttribute('href'), where));
  Array.from(w.document.querySelectorAll('script[data-inlined-from], link[href]')).forEach(el => {
    note(el.getAttribute('data-inlined-from') || el.getAttribute('href'), where);
  });
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

/* ================= 5. Сверка с диском ================= */
{
  const missing = [];
  for (const [href, from] of seen){
    const exists = fs.existsSync(path.join(ROOT, href));
    if (exists) continue;
    if (PENDING.has(href)){ missing.push(href); continue; }
    fails++; checks++;
    console.log('FAIL: битая ссылка ' + href + ' (из: ' + Array.from(from).join(', ') + ')');
  }
  checks++;
  ok(true, `ссылок проверено ${seen.size}, из них ещё не переданы ${missing.length}`);

  for (const href of PENDING){
    ok(!fs.existsSync(path.join(ROOT, href)), 'список ожидаемых устарел, файл уже есть: ' + href);
    ok(seen.has(href), 'запись списка ожидаемых никому не нужна: ' + href);
  }
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

/* ================= 7. Пятёрка из корневого trainers/ ================= */
{
  /* Эти тренажёры курс не хранит у себя — он ссылается на корневой каталог
     сайта. Проверка названа отдельно, чтобы переименование в корне давало
     внятное сообщение, а не общее «битая ссылка». */
  const SHARED = [
    '../trainers/ege-t1-planimetry-generator.html',
    '../trainers/finance-nonstandard-trainer.html',
    '../trainers/trig-sum-to-product-trainer.html',
    '../trainers/ege-t2-vectors-trainer.html',
    '../trainers/ege-profile-stereometry-3d/index.html'
  ];
  for (const f of SHARED){
    ok(fs.existsSync(path.join(ROOT, f)), 'общий с сайтом тренажёр на месте: ' + f);
    ok(seen.has(f), 'на него ссылается страница курса: ' + f);
  }
}

console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);
