/* Проверка интеграции righttri-t1 в review.html и index.html (jsdom). */
const { makeBoot } = require('./boot.js');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

const errors = [];
const boot = makeBoot(errors);
const KEY = 'mathExamCourseProgress.v1';

/* ================= review.html ================= */

/* 1. Пустой журнал — страница живая */
{
  const w = boot('review.html');
  ok(/Журнал пока пуст/.test(w.document.body.textContent), 'review: пустой журнал — заглушка');
}

/* 2. Открытая ошибка righttri: имя, «задание 1», кнопка «Повторить» с ?mode=review */
{
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({
    mistakes: {
      'righttri-t1|t5-seg30': { w: 2, r: 1, lastWrong: Date.now(), last: Date.now() },
      'righttri-t1|t2-altFromSegs': { w: 1, r: 3, lastWrong: 1, last: 1 }          // закрытый
    }
  }));
  const w = boot('review.html', seed);
  const d = w.document;
  const openHtml = d.getElementById('openList').innerHTML;
  ok(/отрезки гипотенузы при угле 30°/.test(openHtml), 'review: человеческое имя типа из NAMES');
  ok(/задание 1/.test(openHtml), 'review: помечено как задание 1');
  ok(/Прямоугольный треугольник/.test(openHtml), 'review: название тренажёра из TRAINERS');
  const btn = d.querySelector('#openList a.btn');
  ok(!!btn && btn.getAttribute('href') === 'trainers/pryamougolny-treugolnik-trenazher.html?mode=review',
     'review: «Повторить» ведёт в тренажёр с ?mode=review, href=' + (btn && btn.getAttribute('href')));
  ok(/высота по отрезкам гипотенузы/.test(d.getElementById('closedList').innerHTML), 'review: закрытый тип в своём списке');
  ok(/1\s*<span[^>]*>\s*к повтору/.test(d.getElementById('summaryCard').innerHTML.replace(/\n/g, '')), 'review: счётчик «к повтору» = 1');
}

/* 3. Неизвестный тип не ломает страницу (мягкая деградация сохранилась) */
{
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({
    mistakes: { 'unknown-tid|weird': { w: 1, r: 0, lastWrong: 1, last: 1 } }
  }));
  const w = boot('review.html', seed);
  const openHtml = w.document.getElementById('openList').innerHTML;
  ok(/weird/.test(openHtml) && /задание \?/.test(openHtml), 'review: неизвестный тип показан сырым, без падения');
}

/* ================= index.html ================= */

/* 4. Карточка и pill на месте; без прогресса — «не начат» */
{
  const w = boot('index.html');
  const d = w.document;
  const card = Array.from(d.querySelectorAll('.card h3')).find(h => /Прямоугольный треугольник/.test(h.textContent));
  ok(!!card, 'index: карточка тренажёра присутствует');
  const host = d.querySelector('[data-progress="righttri"]');
  ok(!!host && /не начат/.test(host.textContent), 'index: адаптер без прогресса пишет «не начат»');
  const pills = Array.from(d.querySelectorAll('a.pill')).filter(a => a.getAttribute('href') === 'trainers/pryamougolny-treugolnik-trenazher.html');
  ok(pills.length === 1 && /Прямоугольный треугольник/.test(pills[0].textContent), 'index: pill в маршруте линии 1');
}

/* 5. Частичный прогресс: серии и счётчик решённых */
{
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({
    'righttri-t1': { topics: {
      1: { steps: 4, solved: 7, correct: 5, streak: 2, best: 4 },
      3: { steps: 0, solved: 2, correct: 1, streak: 1, best: 1 },
      0: { steps: 9, solved: 0, correct: 0, streak: 0, best: 0 }        // разминка не в счёт
    }, board: false }
  }));
  const w = boot('index.html', seed);
  const host = w.document.querySelector('[data-progress="righttri"]');
  ok(/чистые серии: 4 из 15/.test(host.textContent), 'index: серии min(3,correct) по темам 1–5: ' + host.textContent);
  ok(/решено: 9/.test(host.textContent), 'index: сумма решённых по боевым темам');
  ok(host.querySelectorAll('.cellsbar span.filled').length === 3, 'index: заполнено 3 ячейки из 10 (4/15)');
}

/* 6. Полный прогресс: все 15 — отметка done */
{
  const topics = {}; for (let t = 1; t <= 5; t++) topics[t] = { steps: 1, solved: 9, correct: 3, streak: 3, best: 3 };
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({ 'righttri-t1': { topics, board: false } }));
  const w = boot('index.html', seed);
  const host = w.document.querySelector('[data-progress="righttri"]');
  ok(/чистые серии: 15 из 15/.test(host.textContent), 'index: полный прогресс');
  ok(!!host.querySelector('.txt.done'), 'index: метка done при 15 из 15');
}

/* ================= векторный тренажёр в экосистеме ================= */

/* 7. review: открытая ошибка векторов */
{
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({
    mistakes: { 'ege-t2-yashchenko|v6': { w: 1, r: 0, lastWrong: Date.now(), last: Date.now() } }
  }));
  const w = boot('review.html', seed);
  const openHtml = w.document.getElementById('openList').innerHTML;
  ok(/клетчатая бумага: скалярное произведение/.test(openHtml), 'review: имя векторного типа');
  ok(/задание 2/.test(openHtml) && /Векторы \(Ященко\)/.test(openHtml), 'review: линия и название тренажёра');
  ok(/vectors-yashchenko-t2\.html\?mode=review/.test(openHtml), 'review: «Повторить» с ?mode=review');
}

/* 8. index: карточка и адаптер векторов */
{
  const w = boot('index.html');
  const d = w.document;
  ok(Array.from(d.querySelectorAll('.card h3')).some(h => /Векторы по Ященко/.test(h.textContent)), 'index: карточка векторов');
  const host = d.querySelector('[data-progress="vec2y"]');
  ok(!!host && /не начат/.test(host.textContent), 'index: адаптер без прогресса');
  ok(Array.from(d.querySelectorAll('a.pill')).some(a => a.getAttribute('href') === 'trainers/vectors-yashchenko-t2.html'), 'index: pill в маршруте линии 2');
}
{
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({
    'ege-t2-yashchenko': { types: { v1: { best: 3, solved: 5, correct: 4, streak: 3 }, v6: { best: 3, solved: 4, correct: 3, streak: 3 }, v2: { best: 1, solved: 2, correct: 1, streak: 1 } }, runs: 2, best: 6, passed: false, board: false }
  }));
  const w = boot('index.html', seed);
  const host = w.document.querySelector('[data-progress="vec2y"]');
  ok(/типов закрыто: 2 из 7/.test(host.textContent) && /зачёт: 6 из 7/.test(host.textContent), 'index: частичный прогресс векторов: ' + host.textContent);
}
{
  const types = {}; ['v1','v2','v3','v4','v5','v6','v7'].forEach(v => types[v] = { best: 3, solved: 3, correct: 3, streak: 3 });
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({ 'ege-t2-yashchenko': { types, runs: 1, best: 7, passed: true, board: false } }));
  const w = boot('index.html', seed);
  const host = w.document.querySelector('[data-progress="vec2y"]');
  ok(/7 из 7/.test(host.textContent) && /зачёт сдан ✓/.test(host.textContent) && !!host.querySelector('.txt.done'), 'index: полный прогресс векторов с меткой done');
}

/* ================= планиметрический тренажёр в экосистеме ================= */

/* 9. review: открытая ошибка планиметрии */
{
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({
    mistakes: { 'ege-t1-yashchenko|t8': { w: 1, r: 0, lastWrong: Date.now(), last: Date.now() } }
  }));
  const w = boot('review.html', seed);
  const openHtml = w.document.getElementById('openList').innerHTML;
  ok(/высота, биссектриса и медиана из прямого угла/.test(openHtml), 'review: имя планиметрического типа');
  ok(/задание 1/.test(openHtml) && /Планиметрия \(Ященко\)/.test(openHtml), 'review: линия и название тренажёра');
  ok(/planimetry-yashchenko-t1\.html\?mode=review/.test(openHtml), 'review: «Повторить» с ?mode=review');
}

/* 10. index: карточка и адаптер планиметрии */
{
  const w = boot('index.html');
  const d = w.document;
  ok(Array.from(d.querySelectorAll('.card h3')).some(h => /Планиметрия по Ященко/.test(h.textContent)), 'index: карточка планиметрии');
  const host = d.querySelector('[data-progress="plan1y"]');
  ok(!!host && /не начат/.test(host.textContent), 'index: адаптер без прогресса');
  ok(Array.from(d.querySelectorAll('a.pill')).some(a => a.getAttribute('href') === 'trainers/planimetry-yashchenko-t1.html'), 'index: pill в маршруте линии 1');
}
{
  const types = { t8: { best: 3, solved: 4, correct: 3, streak: 3 }, t13: { best: 3, solved: 3, correct: 3, streak: 3 }, t1: { best: 1, solved: 2, correct: 1, streak: 1 } };
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({ 'ege-t1-yashchenko': { types, runs: 1, best: 8, passed: false, board: false } }));
  const w = boot('index.html', seed);
  const host = w.document.querySelector('[data-progress="plan1y"]');
  ok(/типов закрыто: 2 из 19/.test(host.textContent) && /зачёт: 8 из 10/.test(host.textContent), 'index: частичный прогресс планиметрии: ' + host.textContent);
}
{
  const types = {}; for (let i = 1; i <= 19; i++) types['t' + i] = { best: 3, solved: 3, correct: 3, streak: 3 };
  const seed = win => win.localStorage.setItem(KEY, JSON.stringify({ 'ege-t1-yashchenko': { types, runs: 1, best: 10, passed: true, board: false } }));
  const w = boot('index.html', seed);
  const host = w.document.querySelector('[data-progress="plan1y"]');
  ok(/19 из 19/.test(host.textContent) && /зачёт сдан ✓/.test(host.textContent) && !!host.querySelector('.txt.done'), 'index: полный прогресс планиметрии с done');
}

/* ================= слияние архива: финансы, стерео, мини-курс ================= */

/* 11. index: карточки и пилюли по решению владельца (24.09.2026) */
{
  const w = boot('index.html');
  const d = w.document;
  const cardOf = re => Array.from(d.querySelectorAll('.card')).find(c => re.test(c.querySelector('h3').textContent));
  const fin = cardOf(/Финансовая математика/);
  ok(!!fin && fin.querySelector('a.btn').getAttribute('href') === 'trainers/finance.html', 'index: карточка финансов ведёт на локальную копию курса');
  ok(!!fin && /14 задач · 11 схем/.test(fin.querySelector('.meta').textContent), 'index: финансы — «14 задач · 11 схем»');
  const st = cardOf(/Стереометрия в 3D/);
  ok(!!st && st.querySelector('a.btn').getAttribute('href') === 'trainers/stereo/index.html', 'index: карточка стерео ведёт на объединённую линейку курса');
  ok(!!st && /281 задача/.test(st.querySelector('.meta').textContent) && /7 «Развёрток»/.test(st.querySelector('.meta').textContent),
     'index: стерео — 281 задача и 7 «Развёрток»: ' + (st && st.querySelector('.meta').textContent));
  const lineOf = n => Array.from(d.querySelectorAll('li.line')).find(li => li.querySelector('.num').textContent.trim() === String(n));
  ok(!!lineOf(3).querySelector('a.pill[href="trainers/stereo/index.html"]'), 'index: пилюля стерео в линии 3');
  ok(!!lineOf(16).querySelector('a.pill[href="trainers/finance.html"]'), 'index: пилюля финансов в линии 16');
  const mini = lineOf(18).querySelector('a.pill[href="trainers/parameters-18/index.html"]');
  ok(!!mini && /Мини-курс: параметры с нуля/.test(mini.textContent), 'index: пилюля мини-курса в линии 18');
  const m8 = Array.from(d.querySelectorAll('a[href="trainers/inequalities.html#m8"]'));
  ok(m8.length === 2 && m8.some(a => a.classList.contains('pill')) && m8.some(a => a.classList.contains('btn')),
     'index: рационализация — пилюля и карточка открывают модуль 9 курса неравенств');
  ok(!d.querySelector('a[href*="rationalization"]'), 'index: ссылок на отсутствующую rationalization.html нет');
  ok(!d.querySelector('a[href^="../trainers/"]'), 'index: ссылок на корневые копии тренажёров нет');
  const tri = cardOf(/Прямоугольный треугольник/);
  ok(!!tri && tri.querySelector('.meta').textContent === '6 тем · 16 типов задач · журнал ошибок', 'index: мета карточки треугольника — как в архиве');
  const facts = d.querySelector('header .facts').textContent;
  ok(/281 задача стереометрии/.test(facts) && /7 «Развёрток»/.test(facts) && /14 задач, 11 схем/.test(facts),
     'index: строка фактов с числами объединённого курса: ' + facts);
  /* число тренажёров в строке фактов — по факту: разные файлы карточек без тренажёра эксперта */
  const files = new Set(Array.from(d.querySelectorAll('.card a.btn')).map(a => a.getAttribute('href').split('#')[0]).filter(h => h !== 'trainers/expert.html'));
  const n = facts.match(/^(\d+) тренажёров/);
  ok(!!n && +n[1] === files.size, 'index: число тренажёров в строке фактов совпадает с карточками: ' + (n && n[1]) + ' / ' + files.size);
  const desc = d.querySelector('meta[name="description"]');
  ok(!!desc && /маршрут по всем 19 заданиям/.test(desc.getAttribute('content')), 'index: meta description из первого абзаца');
}

/* 12. Адаптер финансов: решено = записи stats.doneTasks, всего 14 задач */
{
  const finHost = obj => boot('index.html', win => { if (obj !== undefined) win.localStorage.setItem(KEY, JSON.stringify(obj)); })
    .document.querySelector('[data-progress="finance"]');
  const done = n => { const o = {}; for (let i = 0; i < n; i++) o['task' + i] = true; return o; };
  ok(/не начат/.test(finHost(undefined).textContent), 'finance: без прогресса — «не начат»');
  ok(/в работе/.test(finHost({ financeNonstandardTrainer: { mode: 'practice', lastTaskId: 'dep-1' } }).textContent),
     'finance: тренажёр открыт, задач не решено — «в работе»');
  const h3 = finHost({ financeNonstandardTrainer: { mode: 'learn', lastTaskId: 'x', stats: { solved: 3, correct: 3, attempts: 9, hints: 2, doneTasks: done(3) } } });
  ok(/решено задач: 3 из 14/.test(h3.textContent) && h3.querySelectorAll('.cellsbar span.filled').length === 2 && !h3.querySelector('.txt.done'),
     'finance: 3 из 14, две ячейки из 10, без done: ' + h3.textContent);
  ok(!/27/.test(h3.textContent), 'finance: прежний счёт «из 27» по ключам объекта больше не используется');
  const h14 = finHost({ financeNonstandardTrainer: { stats: { doneTasks: done(14) } } });
  ok(/решено задач: 14 из 14/.test(h14.textContent) && !!h14.querySelector('.txt.done') && h14.querySelectorAll('.cellsbar span.filled').length === 10,
     'finance: 14 из 14 — полная полоса и отметка done');
  ok(/решено задач: 14 из 14/.test(finHost({ financeNonstandardTrainer: { stats: { doneTasks: done(15) } } }).textContent),
     'finance: лишние записи не дают «15 из 14»');
  ok(/в работе/.test(finHost({ financeNonstandardTrainer: { stats: { doneTasks: 'мусор' } } }).textContent),
     'finance: мусор в doneTasks отброшен без падения');
}

/* 13. Адаптер стерео: stereo3.status, записи razv-* («Развёртки») не в счёт, из 281 */
{
  const stHost = st => boot('index.html', win => { if (st !== undefined) win.localStorage.setItem('stereo3.status', typeof st === 'string' ? st : JSON.stringify(st)); })
    .document.querySelector('[data-progress="stereo"]');
  ok(/не начат/.test(stHost(undefined).textContent), 'stereo: без прогресса — «не начат»');
  ok(/не начат/.test(stHost('{битый json').textContent), 'stereo: битый JSON — «не начат», без падения');
  const h = stHost({
    '27043':  { st: 'ok',   attempts: 1, wrong: 0, topic: 'cube' },
    'kub-01': { st: 'ok',   attempts: 2, wrong: 1, topic: 'cube' },
    '245339': { st: 'fail', attempts: 3, wrong: 3, topic: 'cone' },
    'razv-01':{ st: 'ok',   attempts: 1, wrong: 0, topic: 'razv' },
    'razv-02':{ st: 'ok',   attempts: 1, wrong: 0, topic: 'razv' }
  });
  ok(/решено задач: 2 из 281/.test(h.textContent), 'stereo: считаются старые и новые id, razv-* пропущены: ' + h.textContent);
  ok(h.querySelectorAll('.cellsbar span.filled').length === 1 && !h.querySelector('.txt.done'),
     'stereo: 2 из 281 — ненулевой прогресс виден одной ячейкой, без done');
  ok(/в работе/.test(stHost({ 'razv-01': { st: 'ok' }, '27043': { st: 'fail' } }).textContent),
     'stereo: решены только «Развёртки» — задание 3 ещё «в работе»');
  const full = {}; for (let i = 0; i < 281; i++) full[String(100000 + i)] = { st: 'ok' };
  for (let i = 1; i <= 7; i++) full['razv-0' + i] = { st: 'ok' };
  const hf = stHost(full);
  ok(/решено задач: 281 из 281/.test(hf.textContent) && !!hf.querySelector('.txt.done'), 'stereo: 281 из 281 — отметка done, «Развёртки» не прибавились');

  /* Считаются только id, похожие на id банка; подпись не выходит за 281 */
  const junkOnly = { 'id1': { st: 'ok' }, 'foo': { st: 'ok' }, 'KUB-01': { st: 'ok' }, 'kub01': { st: 'ok' }, 'kub-01x': { st: 'ok' }, '__proto__x': { st: 'ok' } };
  const hj = stHost(junkOnly);
  ok(/не начат/.test(hj.textContent) && !hj.querySelector('.cellsbar'), 'stereo: посторонние ключи — не id банка, «не начат»: ' + hj.textContent);
  ok(/не начат/.test(stHost([{ st: 'ok' }, { st: 'ok' }]).textContent), 'stereo: массив вместо объекта — «не начат»');
  ok(/не начат/.test(stHost({ '27043': 'ok', '27044': null, 'kub-02': 5 }).textContent), 'stereo: записи не-объекты — мусор, «не начат»');
  const over = {}; for (let i = 0; i < 300; i++) over[String(500000 + i)] = { st: 'ok' };
  const ho = stHost(over);
  ok(/решено задач: 281 из 281/.test(ho.textContent) && !/300/.test(ho.textContent), 'stereo: больше 281 id — подпись ограничена 281: ' + ho.textContent);
  const mixed = Object.assign({ 'kon-28': { st: 'ok' }, 'komb-13': { st: 'ok' }, 'sost-6': { st: 'ok' } }, junkOnly);
  ok(/решено задач: 3 из 281/.test(stHost(mixed).textContent), 'stereo: из смеси считаются только id банка (3)');

  /* 281 и форма id сверяются с настоящим банком trainers/stereo/js/data.js */
  const fs = require('fs'), pth = require('path');
  const PROBLEMS = new Function(fs.readFileSync(pth.join(require('./boot.js').ROOT, 'trainers/stereo/js/data.js'), 'utf8') + '; return PROBLEMS;')();
  const P = boot('index.html').PROGRESS;
  const ids = PROBLEMS.map(p => String(p.id));
  const razv = ids.filter(i => /^razv-\d+$/.test(i));
  const task3 = ids.filter(i => !/^razv-/.test(i));
  ok(task3.length === P.STEREO_TOTAL && task3.every(i => P.STEREO_ID.test(i)) && razv.length === 7 && new Set(ids).size === ids.length,
     'stereo: в data.js ' + task3.length + ' задач задания 3, все id подходят под STEREO_ID, «Развёрток» ' + razv.length + ', знаменатель ' + P.STEREO_TOTAL);
}

/* 14. trainers/finance.html: режим «Учитель» открывается только ссылкой ?teacher=1 */
{
  const URL0 = 'https://mathexam.space/ege-profil/trainers/finance.html';
  const fin = (q, store) => {
    const w = boot('trainers/finance.html', win => { for (const k in (store || {})) win.localStorage.setItem(k, store[k]); }, URL0 + q);
    const d = w.document;
    const stored = (JSON.parse(w.localStorage.getItem(KEY) || '{}').financeNonstandardTrainer || {}).mode || null;
    return { btn: d.querySelector('#modeSwitch [data-mode="teacher"]'), active: d.querySelector('#modeSwitch button.active').dataset.mode,
             key: w.localStorage.getItem('financeTeacherKey'), stored, w };
  };
  const savedTeacher = { [KEY]: JSON.stringify({ financeNonstandardTrainer: { mode: 'teacher', stats: { doneTasks: { a: true } } } }) };
  let r = fin('');
  ok(r.btn.hidden && r.key === null && r.active === 'learn', 'finance: без параметра кнопки «Учитель» нет, флага нет');
  r = fin('?teacher=yes');
  ok(r.btn.hidden && r.key === null, 'finance: ?teacher=yes флаг не ставит');
  r = fin('?teacher=1');
  ok(!r.btn.hidden && r.key === '1', 'finance: ?teacher=1 показывает кнопку и ставит флаг');
  r = fin('', Object.assign({ financeTeacherKey: '1' }, savedTeacher));
  ok(!r.btn.hidden && r.active === 'teacher', 'finance: флаг в браузере — режим учителя помнится');
  r = fin('?teacher=0', Object.assign({ financeTeacherKey: '1' }, savedTeacher));
  ok(r.btn.hidden && r.key === null && r.active === 'learn' && r.stored === 'learn',
     'finance: ?teacher=0 снимает флаг, режим откатывается в «Обучение» и записывается: ' + JSON.stringify({ key: r.key, active: r.active, stored: r.stored }));
  ok(JSON.parse(r.w.localStorage.getItem(KEY)).financeNonstandardTrainer.stats.doneTasks.a === true, 'finance: откат режима не трогает решённые задачи');
  r = fin('', savedTeacher);
  ok(r.btn.hidden && r.active === 'learn' && r.stored === 'learn', 'finance: сохранённый режим учителя без флага не открывается');
  r.w.document.querySelector('#modeSwitch [data-mode="teacher"]').click();
  ok(r.w.document.querySelector('#modeSwitch button.active').dataset.mode === 'learn', 'finance: скрытую кнопку не включить и программным кликом');
}

/* 14а. Зоны нажатия 44 px: правила на месте (размеры меряет браузерный смоук,
   jsdom раскладку не считает — проверяем сами правила) */
{
  const fs = require('fs'), pth = require('path'), ROOT = require('./boot.js').ROOT;
  const css = f => (fs.readFileSync(pth.join(ROOT, f), 'utf8').match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  const coarse = s => { const m = s.match(/@media\s*\(pointer:\s*coarse\)\s*\{([\s\S]*?\})\s*\}/); return m ? m[1] : ''; };
  const idx = coarse(css('index.html'));
  ok(/\.pill\s*\{[^}]*display:\s*inline-flex[^}]*min-height:\s*44px/.test(idx), 'index: на касании пилюли маршрута — inline-flex и min-height 44px');
  ok(/\.ghostlink\s*\{[^}]*display:\s*inline-flex[^}]*min-height:\s*44px/.test(idx), 'index: на касании «вариант» — inline-flex и min-height 44px');
  const rv = css('review.html');
  ok(/\n\s*\.btn\s*\{[^}]*min-height:\s*44px/.test(rv), 'review: .btn («Повторить», «Отработать», «Очистить журнал») — min-height 44px');
  ok(/\.back\s*\{[^}]*min-height:\s*44px/.test(coarse(rv)), 'review: на касании «← Курс» — min-height 44px');
  for (const f of ['trainers/trigonometry.html', 'trainers/trig-sum-to-product.html', 'trainers/inequalities.html', 'trainers/interval-method.html']){
    const m = fs.readFileSync(pth.join(ROOT, f), 'utf8').match(/class="course-back" style="([^"]*)"/);
    ok(!!m && /min-height:\s*44px/.test(m[1]) && /position:\s*fixed/.test(m[1]), f + ': плашка «← Курс» — min-height 44px');
  }
}

/* ================= полоса прогресса ================= */

/* 15. bar(): ненулевой прогресс — хотя бы одна клетка; неполный — не больше девяти */
{
  const w = boot('index.html');
  const d = w.document;
  const cells = ratio => {
    const h = d.createElement('div');
    w.PROGRESS.bar(h, ratio, 'x');
    return h.querySelector('.cellsbar') ? h.querySelectorAll('.cellsbar span.filled').length : null;
  };
  ok(cells(null) === null, 'bar: без доли — полосы нет, только подпись');
  ok(cells(0) === 0, 'bar: 0 — пустая полоса');
  ok(cells(1 / 30) === 1, 'bar: 1 из 30 — одна клетка, а не ноль');
  ok(cells(5 / 281) === 1, 'bar: 5 из 281 — одна клетка');
  ok(cells(0.001) === 1, 'bar: сколь угодно малая доля — одна клетка');
  ok(cells(4 / 15) === 3 && cells(3 / 14) === 2, 'bar: средние доли — по-прежнему округление');
  ok(cells(29 / 30) === 9, 'bar: 29 из 30 — девять клеток, вся полоса только у завершённого');
  ok(cells(1) === 10 && cells(1.4) === 10, 'bar: доля 1 и больше — все десять');
  ok(cells(-0.2) === 0 && cells(NaN) === 0, 'bar: отрицательная доля и NaN — пусто, без падения');
  const hostOf = (key, obj, name) => boot('index.html', win => win.localStorage.setItem(key, JSON.stringify(obj)))
    .document.querySelector('[data-progress="' + name + '"]');
  const hp = hostOf(KEY, { 'probability-t45': { solved4: 1, solved5: 0, runs: 0, best: 0, passed: false } }, 'prob');
  ok(/решено задач: 1/.test(hp.textContent) && hp.querySelectorAll('.cellsbar span.filled').length === 1,
     'prob: 1 решённая из 30 — одна клетка: ' + hp.textContent);
  const st5 = {}; for (let i = 0; i < 5; i++) st5['par-0' + (i + 1)] = { st: 'ok' };
  const hs = hostOf('stereo3.status', st5, 'stereo');
  ok(/решено задач: 5 из 281/.test(hs.textContent) && hs.querySelectorAll('.cellsbar span.filled').length === 1,
     'stereo: 5 из 281 — одна клетка');
}

/* ================= производная: задание 8 ================= */

/* 16. Адаптер derivative-t8: зачёт — как раньше; до зачёта — решённые в «Тренажёре» */
{
  const dh = obj => boot('index.html', win => { if (obj !== undefined) win.localStorage.setItem(KEY, JSON.stringify(obj)); })
    .document.querySelector('[data-progress="derivative"]');
  ok(/не начат/.test(dh(undefined).textContent), 'derivative: без прогресса — «не начат»');
  ok(/не начат/.test(dh({ 'derivative-t8': 'мусор' }).textContent), 'derivative: мусор вместо записи — «не начат»');
  ok(/запусков зачёта: 2/.test(dh({ 'derivative-t8': { runs: 2, best: 0, passed: false } }).textContent),
     'derivative: зачёт начат, решённых нет — подпись как раньше');
  const h3 = dh({ 'derivative-t8': { runs: 0, best: 0, passed: false, solvedByType: { extrema: 2, physics: 1 } } });
  ok(/решено задач: 3/.test(h3.textContent) && h3.querySelectorAll('.cellsbar span.filled').length === 1 && !h3.querySelector('.txt.done'),
     'derivative: до зачёта — «решено задач: 3», одна клетка, без done: ' + h3.textContent);
  ok(/решено задач: 1$/.test(dh({ 'derivative-t8': { solvedByType: { extrema: 1, tangent: -4, parallel: 'x', physics: null, antider: 2.5e400 } } }).textContent),
     'derivative: мусорные счётчики не в счёт');
  ok(/запусков зачёта: 0/.test(dh({ 'derivative-t8': { solvedByType: [5] } }).textContent), 'derivative: массив вместо счётчиков отброшен');
  const hb = dh({ 'derivative-t8': { runs: 1, best: 6, passed: false, solvedByType: { extrema: 9 } } });
  ok(/зачёт: лучший результат 6 из 10/.test(hb.textContent) && hb.querySelectorAll('.cellsbar span.filled').length === 6,
     'derivative: после зачёта — лучший результат, как раньше');
  const hz = dh({ 'derivative-t8': { runs: 1, best: 9, passed: true, solvedByType: { extrema: 9 } } });
  ok(/зачёт сдан ✓/.test(hz.textContent) && !!hz.querySelector('.txt.done'), 'derivative: зачёт сдан — отметка done');

  /* Полоса — охват треков: знаменатель 24 = 8 треков × 3, от трека не больше трёх */
  const filledOf = h => h.querySelectorAll('.cellsbar span.filled').length;
  const h24 = dh({ 'derivative-t8': { solvedByType: { extrema: 24 } } });
  ok(/решено задач: 24$/.test(h24.textContent) && filledOf(h24) === 1 && !h24.querySelector('.txt.done'),
     'derivative: 24 решения одного трека — подпись 24, но полоса 3 из 24 (одна клетка), а не полная: ' + h24.textContent + ' / ' + filledOf(h24));
  const P = boot('index.html').PROGRESS;
  const all3 = {}; P.DERIVATIVE_TRACKS.forEach(t => { all3[t] = 3; });
  const ha = dh({ 'derivative-t8': { solvedByType: all3 } });
  ok(/решено задач: 24$/.test(ha.textContent) && filledOf(ha) === 10, 'derivative: по три в каждом из 8 треков — полная полоса');
  const all5 = {}; P.DERIVATIVE_TRACKS.forEach(t => { all5[t] = 5; });
  ok(/решено задач: 40$/.test(dh({ 'derivative-t8': { solvedByType: all5 } }).textContent), 'derivative: подпись — фактическое число решённых (40)');
  const h7 = dh({ 'derivative-t8': { solvedByType: { extrema: 5, tangent: 2 } } });
  ok(/решено задач: 7$/.test(h7.textContent) && filledOf(h7) === 2, 'derivative: 5 + 2 — в полосу идут 3 + 2 из 24 (две клетки): ' + filledOf(h7));
  ok(/запусков зачёта: 0/.test(dh({ 'derivative-t8': { solvedByType: { foo: 9, toString: 3 } } }).textContent),
     'derivative: неизвестные треки не в счёт');
  const hzz = dh({ 'derivative-t8': { best: 'zz', runs: 'zz', passed: 'zz', solvedByType: { extrema: 2 } } });
  ok(/решено задач: 2$/.test(hzz.textContent) && !/zz|NaN|undefined/.test(hzz.textContent) && !hzz.querySelector('.txt.done'),
     'derivative: best/runs/passed — строки, в подписи мусора нет: ' + hzz.textContent);
  ok(/запусков зачёта: 0$/.test(dh({ 'derivative-t8': { best: 'zz', runs: 'zz' } }).textContent), 'derivative: runs — строка, подпись «0»');
  /* список треков адаптера совпадает с TRACKS тренажёра */
  const src = require('fs').readFileSync(require('path').join(require('./boot.js').ROOT, 'trainers/derivative-t8.html'), 'utf8');
  const tr = (src.match(/var TRACKS = \[([\s\S]*?)\];/) || [])[1] || '';
  const ids = Array.from(tr.matchAll(/id:"([^"]+)"/g)).map(m => m[1]);
  ok(ids.length === 8 && JSON.stringify(ids) === JSON.stringify(P.DERIVATIVE_TRACKS),
     'derivative: треки адаптера = TRACKS тренажёра: ' + ids.join(','));
}

/* 16б. Адаптер тригонометрии: знаменатель — все 7 треков × 8, мусор в треке — 0 очков */
{
  const th = obj => boot('index.html', win => { if (obj !== undefined) win.localStorage.setItem('ep_progress_v1', JSON.stringify(obj)); })
    .document.querySelector('[data-progress="trig"]');
  const filledOf = h => h.querySelectorAll('.cellsbar span.filled').length;
  const P = boot('index.html').PROGRESS;
  const all8 = {}; P.TRIG_TRACKS.forEach(t => { all8[t] = 8; });
  ok(/^не начат$/.test(th(undefined).textContent), 'trig: без записи — «не начат»');
  const h1 = th({ xp: { table: 8, rad: 'zz' } });
  ok(/^практикум: 8 из 56 очков$/.test(h1.textContent) && !h1.querySelector('.txt.done') && filledOf(h1) === 1,
     'trig: мусор в одном треке — не «выполнено», 8 из 56 (одна клетка): ' + h1.textContent + ' / ' + filledOf(h1));
  const h2 = th({ xp: Object.assign({}, all8, { rad: 'zz' }) });
  ok(/^практикум: 48 из 56 очков$/.test(h2.textContent) && !h2.querySelector('.txt.done') && filledOf(h2) === 9,
     'trig: шесть треков по 8 и мусор в седьмом — 48 из 56, без done: ' + h2.textContent);
  const h3 = th({ xp: Object.assign({}, all8, { sup: null, foo: 99 }) });
  ok(/^практикум: 48 из 56 очков$/.test(h3.textContent) && !h3.querySelector('.txt.done'),
     'trig: null в треке и посторонний ключ — трек не выбыл, посторонний не в счёт: ' + h3.textContent);
  const h4 = th({ xp: Object.assign({}, all8, { junk: 'zz' }) });
  ok(/^практикум: 56 из 56 очков$/.test(h4.textContent) && !!h4.querySelector('.txt.done') && filledOf(h4) === 10,
     'trig: все 7 треков по 8 — «выполнено», мусорный лишний ключ не мешает: ' + h4.textContent);
  ok(/^практикум: 11 из 56 очков$/.test(th({ xp: { table: 20, rad: 3.7, sign: -2, red: 2.5e400 } }).textContent),
     'trig: больше 8 — 8, дробь — целая часть, минус и бесконечность — 0');
  ok(/^не начат$/.test(th({ xp: { table: 'zz', rad: null, sign: [3] } }).textContent) && /^не начат$/.test(th({ xp: { foo: 9 } }).textContent),
     'trig: ни одного трека с числом — «не начат»');
  /* список треков и цель адаптера совпадают с тренажёром */
  const src = require('fs').readFileSync(require('path').join(require('./boot.js').ROOT, 'trainers/trigonometry.html'), 'utf8');
  const dx = ((src.match(/const defaults = \(\) => \(\{\s*xp: \{([^}]*)\}/) || [])[1] || '').split(',').map(s => s.split(':')[0].trim()).filter(Boolean);
  const tk = Array.from(((src.match(/const TRACKS = \{([^}]*)\}/) || [])[1] || '').matchAll(/(\w+):\s*'/g)).map(m => m[1]);
  const goal = +((src.match(/const GOAL = (\d+);/) || [])[1]);
  ok(dx.length === 7 && JSON.stringify(dx) === JSON.stringify(P.TRIG_TRACKS) && JSON.stringify(tk) === JSON.stringify(P.TRIG_TRACKS) && goal === P.TRIG_GOAL,
     'trig: треки и цель адаптера = defaults().xp, TRACKS и GOAL тренажёра: ' + dx.join(',') + ' / ' + tk.join(',') + ' / ' + goal);
}

/* 16а. Мусор в записях: ни один адаптер не падает и не выводит NaN/undefined/чужую строку */
{
  const TIDS = ['ege-t1-planimetry-generator', 'ege-t1-yashchenko', 'ege-t2-yashchenko', 'righttri-t1', 'financeNonstandardTrainer',
    'derivative-t8', 'stereo-t14', 'planimetry-t17', 'parameters-t18', 'numbers-t19', 'probability-t45', 'applied-t910',
    'functions-t1112', 'expert-t', 'full-exam'];
  const JUNK = { passed: 'zz', best: 'zz', runs: 'zz', drillBest: 'zz', solved4: 'zz', solved5: 'x', solved9: 'zz', solved10: 'x',
    solved11: 'zz', solved12: 'x', types: { t1: null, t2: 'zz', t3: { best: 'zz', solved: 'zz' } },
    tasks: { 1: null, 2: 'zz', 3: { a: 0, b: 0, proof: 0 } }, keys: 'zz', done: { a: null, b: 'zz' }, attempts: 'zz',
    topics: { 1: null, 2: { correct: 'zz', solved: 'zz' } }, stats: 'zz', solvedByType: { extrema: 'zz' }, xp: 'zz' };
  const SIDE = ['stereo3.status', 'ep_progress_v1', 'trig-stp-trainer-v2', 'profile-ege-course-v1'];
  const junkMain = v => { const o = {}; TIDS.forEach(t => { o[t] = v; }); return o; };
  const cases = [
    ['null', 'null', 'null'],
    ['строка', '"zz"', '"zz"'],
    ['массив', '[1,"zz",null]', '[1,"zz",null]'],
    ['число', '42', 'NaN'],
    ['записи-строки', JSON.stringify(Object.assign(junkMain('zz'), { mistakes: 'zz' })), JSON.stringify('zz')],
    ['записи-массивы', JSON.stringify(Object.assign(junkMain([1, 2]), { mistakes: [1] })), '[]'],
    ['мусор в полях', JSON.stringify(Object.assign(junkMain(JUNK), { mistakes: { 'a|b': null, 'c|d': 'zz', 'e|f': { w: 'zz', r: 'zz' } } })), null],
    ['числа строками', JSON.stringify(junkMain({ passed: 1, best: '7', runs: '3', drillBest: '5', solved4: '2', solved9: '2', solved11: '2',
      attempts: [{ primary: '5', test: '27' }, null, 'zz'], keys: ['a', 'b'], done: ['a'], tasks: ['a'], types: ['t1'] })), null]
  ];
  const SIDEJUNK = {
    'stereo3.status': JSON.stringify({ '27043': 'zz', 'foo': { st: 'ok' }, 'kub-01': null }),
    'ep_progress_v1': JSON.stringify({ xp: { table: 'zz', rad: null, sign: [3] } }),
    'trig-stp-trainer-v2': JSON.stringify({ progress: { ssum: 'zz', sdiff: null, testBest: 'zz' } }),
    'profile-ege-course-v1': JSON.stringify({ progress: { '5': 'zz', 'zz': { attempts: 3 }, '7': { attempts: 'zz', correct: null } } })
  };
  const clean = boot('index.html');
  const nClean = clean.document.querySelectorAll('[data-progress]').length;
  const BAD = /NaN|undefined|null|Infinity|\[object|zz|\bx\b/;
  for (const [label, main, side] of cases){
    const w = boot('index.html', win => {
      win.localStorage.setItem(KEY, main);
      SIDE.forEach(k => win.localStorage.setItem(k, side === null ? SIDEJUNK[k] : side));
    });
    const hosts = Array.from(w.document.querySelectorAll('[data-progress]'));
    const texts = hosts.map(h => h.getAttribute('data-progress') + ': ' + h.textContent);
    ok(hosts.length === nClean, 'мусор (' + label + '): ни одна полоса не пропала из-за исключения — ' + hosts.length + ' из ' + nClean);
    const bad = texts.filter(t => BAD.test(t.replace(/^[^:]+: /, '')));
    ok(!bad.length, 'мусор (' + label + '): в подписях нет NaN/undefined/чужих строк: ' + bad.join(' | '));
    ok(!w.document.querySelector('[data-progress] .txt.done'), 'мусор (' + label + '): ни одна полоса не отмечена выполненной');
    ok(/Вы на шаге 1/.test(w.document.getElementById('routeNow').textContent), 'мусор (' + label + '): маршрут — шаг 1');
  }
  /* числа строками — не данные: полосы «в работе» без счёта, а не «7 из 10» */
  const w = boot('index.html', win => win.localStorage.setItem(KEY, cases[7][1]));
  const t = id => w.document.querySelector('[data-progress="' + id + '"]').textContent;
  ok(/^в работе$/.test(t('plan1y')) && /^решено задач: 0$/.test(t('prob')) && /^не начат$/.test(t('fullexam')) && /^в работе$/.test(t('p18')),
     'числа строками: plan1y «в работе», prob «решено задач: 0», пробник «не начат», p18 «в работе»: ' +
     [t('plan1y'), t('prob'), t('fullexam'), t('p18')].join(' | '));
  /* валидная попытка пробника среди мусора читается */
  const wf = boot('index.html', win => win.localStorage.setItem(KEY, JSON.stringify({ 'full-exam': { attempts: ['zz', null, { primary: 9, test: 52 }, { primary: 'u', test: 99 }] } })));
  ok(/^последний: 9 перв\. · 52 тест\. · лучший: 52$/.test(wf.document.querySelector('[data-progress="fullexam"]').textContent),
     'пробник: из смеси взяты только попытки с числами: ' + wf.document.querySelector('[data-progress="fullexam"]').textContent);
  ok(/Вы на шаге 2/.test(wf.document.getElementById('routeNow').textContent), 'пробник: валидная попытка двигает маршрут на шаг 2');
  ok(errors.length === 0, 'мусор в хранилище: без JS-ошибок: ' + errors.join(' | '));
}

/* 17. trainers/derivative-t8.html: «Тренажёр» пишет решённые и журнал ошибок */
const DER = 'trainers/derivative-t8.html';
/* детерминированный Math.random: одна и та же задача в двух загрузках страницы */
const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const timers = [];
const der = (seed, store) => boot(DER, win => {
  win.Math.random = rng(seed);
  win.setTimeout = fn => { timers.push(fn); return timers.length; };   /* очередь таймеров прокачивается вручную */
  if (store) win.localStorage.setItem(KEY, JSON.stringify(store));
});
const flushTimers = () => { while (timers.length) timers.shift()(); };
/* ответ задачи — с последней ступени лестницы разбора: «Разбор по шагам» показывает
   вопрос первой ступени, дальше «Ответ шага» / «Следующий шаг» до .lfinal («Ответ: X.»);
   walkLadder возвращает число нажатий кнопки лестницы */
const walkLadder = d => { d.getElementById('taskSol').click(); const box = d.getElementById('taskSolBox'); const btn = box.querySelector('.ladder-btn'); let n = 0; while (!box.querySelector('.lfinal') && n < 40){ btn.click(); n++; } return n; };
const shownAnswer = d => { walkLadder(d); const f = d.getElementById('taskSolBox').querySelector('.lfinal'); const m = f && f.textContent.match(/^Ответ: (.+)\.$/); return m && m[1]; };
const recOf = w => JSON.parse(w.localStorage.getItem(KEY) || '{}');
/* решённые по треку extrema; отсутствие записи — 0, а не исключение */
const solvedEx = w => (((recOf(w)['derivative-t8'] || {}).solvedByType || {}).extrema) || 0;
const missEx = w => (recOf(w).mistakes || {})['derivative-t8|extrema'] || null;
const checkDer = (w, v) => { const d = w.document; d.getElementById('taskAnswer').value = v; d.getElementById('taskCheck').click(); return d.getElementById('taskFb'); };
const RVN = require('../registry.js').NAMES;
{
  /* ответ первой задачи узнаём в «пробной» загрузке через кнопку «Решение» */
  const answer = shownAnswer(der(20260924).document);
  ok(!!answer, 'derivative: ответ пробной задачи прочитан: ' + answer);
  const w = der(20260924);
  const d = w.document;
  ok(d.getElementById('taskFb').getAttribute('aria-live') === 'polite' && d.getElementById('examFb').getAttribute('aria-live') === 'polite',
     'derivative: сообщения проверки — aria-live');
  let fb = checkDer(w, answer);
  let r = recOf(w)['derivative-t8'] || {};
  ok(/ok/.test(fb.className) && r.solvedByType && r.solvedByType.extrema === 1 && r.runs === 0 && r.passed === false,
     'derivative: верное решение — solvedByType.extrema = 1, поля зачёта на месте: ' + JSON.stringify(r));
  ok(/Решено в тренажёре: 1/.test(fb.textContent), 'derivative: ученик видит счёт решённых');
  checkDer(w, answer);
  ok(solvedEx(w) === 1, 'derivative: повторное «Проверить» ту же задачу второй раз не засчитывает');
  ok(!missEx(w), 'derivative: верный ответ без промахов записи в журнале не заводит');

  /* неверный ответ — промах типа, один раз на задачу; пустой — не промах */
  d.getElementById('taskNext').click();
  fb = checkDer(w, '');
  ok(/hint/.test(fb.className) && !missEx(w), 'derivative: пустой ответ — просьба ввести число, не промах');
  checkDer(w, '123456');
  const e = missEx(w);
  ok(!!e && e.w === 1 && e.r === 0 && e.lastWrong > 0 && e.last > 0, 'derivative: промах записан в mistakes[derivative-t8|extrema]: ' + JSON.stringify(e));
  ok(!!RVN['derivative-t8|extrema'], 'derivative: тип журнала есть в NAMES реестра');
  checkDer(w, '654321');
  ok((missEx(w) || {}).w === 1, 'derivative: второй неверный ответ на ту же задачу промахов не множит');

  /* ответ, открытый лестницей разбора, в счёт решённых не идёт */
  d.getElementById('taskNext').click();
  fb = checkDer(w, shownAnswer(d));
  ok(/ok/.test(fb.className) && /в счёт решённых не идёт/.test(fb.textContent) && solvedEx(w) === 1 && (missEx(w) || {}).r === 0,
     'derivative: после открытого ответа задача не засчитана и тип не закрывает');
}
{
  /* лестница разбора: вопрос ступени → отдельным нажатием её ответ → …;
     итог «Ответ: X.» — только вместе с ответом последней ступени; задача,
     решённая после открытых ступеней без итога, засчитана (ступени ничего
     не отнимают), решённая после итога — нет, и ученику это сказано без упрёка */
  const answer = shownAnswer(der(20260926).document);
  const w = der(20260926);
  const d = w.document;
  const box = d.getElementById('taskSolBox');
  d.getElementById('taskSol').click();
  const btn = box.querySelector('.ladder-btn');
  ok(box.classList.contains('on') && !!btn && box.querySelectorAll('.lq').length === 1 && box.querySelectorAll('.la').length === 0 && btn.textContent === 'Ответ шага',
     'derivative: «Разбор по шагам» открывает только вопрос первой ступени');
  btn.click();
  ok(box.querySelectorAll('.la').length === 1 && btn.textContent === 'Следующий шаг' && !/Ответ:/.test(box.textContent),
     'derivative: «Ответ шага» — ответ первой ступени, итога в разборе нет');
  btn.click();
  ok(box.querySelectorAll('.lq').length === 2 && box.querySelectorAll('.la').length === 1, 'derivative: «Следующий шаг» — вопрос второй ступени без её ответа');
  let fb = checkDer(w, answer);
  ok(/ok/.test(fb.className) && solvedEx(w) === 1 && !/не идёт/.test(fb.textContent), 'derivative: задача, решённая после открытых ступеней без итога, засчитана');
  d.getElementById('taskNext').click();
  ok(!box.classList.contains('on') && box.textContent === '', 'derivative: новая задача закрывает лестницу');
  const presses = walkLadder(d);
  const q = box.querySelectorAll('.lq').length, a = box.querySelectorAll('.la').length;
  const btn2 = box.querySelector('.ladder-btn');
  ok(q >= 3 && q === a && presses === 2 * q - 1, 'derivative: лестница пройдена по одной ступени: вопросов ' + q + ', ответов ' + a + ', нажатий ' + presses);
  ok(btn2.disabled && /в счёт решённых она не пойдёт/.test(box.textContent), 'derivative: после итога кнопка выключена, ученику сказано без упрёка');
  ok(/в счёт решённых не пойдёт \(промахом это не считается\)/.test(box.querySelector('.ladder-note').textContent), 'derivative: подпись над лестницей предупреждает об открытом итоге до последнего нажатия');
  fb = checkDer(w, '999');
  ok(/bad/.test(fb.className) && /уже открыт/.test(fb.textContent) && !/разбор по шагам/.test(fb.textContent) && !missEx(w),
     'derivative: неверный ответ после итога — сверить запись, в разбор не зовёт, промаха нет: ' + fb.textContent);
  const fin = box.querySelector('.lfinal').textContent;
  const m = fin.match(/^Ответ: (.+)\.$/);
  fb = checkDer(w, m && m[1]);
  ok(/ok/.test(fb.className) && /в счёт решённых не идёт/.test(fb.textContent) && solvedEx(w) === 1, 'derivative: решённая после итога задача не засчитана: ' + fin);
  d.getElementById('taskSol').click();
  ok(box.querySelectorAll('.lq').length === q, 'derivative: повторное «Разбор по шагам» лестницу не пересоздаёт');
  ok(!box.querySelector('script, img') && box.querySelectorAll('.lq, .la, .lfinal').length === 2 * q + 1, 'derivative: ступени вставлены текстом, разметки в них нет');

  /* карточка навигатора и строка кабинета видят тренировку */
  const hd = boot('index.html', win => win.localStorage.setItem(KEY, w.localStorage.getItem(KEY))).document.querySelector('[data-progress="derivative"]');
  ok(/решено задач: 1/.test(hd.textContent) && hd.querySelectorAll('.cellsbar span.filled').length === 1,
     'derivative: карточка на навигаторе сдвинулась с «не начат»: ' + hd.textContent);
}
{
  /* трек «График f: точки»: ступени называют точки так, как они подписаны на чертеже — x₁ … x₆,
     абсцисса в скобках; голых «x = −3», которые пришлось бы искать по клеткам, в ступенях нет */
  const w = der(20260927);
  const d = w.document;
  Array.from(d.querySelectorAll('#trackChips .chip')).find(b => /График f: точки/.test(b.textContent)).click();
  const figLabels = Array.from(d.querySelectorAll('#taskFig text')).map(t => t.textContent).filter(t => /^x[₁₂₃₄₅₆]$/.test(t));
  walkLadder(d);
  const rows = Array.from(d.querySelectorAll('#taskSolBox .la')).map(e => e.textContent).join(' ');
  const MARKS = [-5, -3, -1, 1, 3, 5], SUB = '₁₂₃₄₅₆';
  const named = Array.from(rows.matchAll(/x([₁₂₃₄₅₆]) \(x = (−?\d)\)/g));
  ok(figLabels.length === 6 && named.length >= 6 && named.every(m => MARKS[SUB.indexOf(m[1])] === Number(m[2].replace('−', '-'))) && !/(^|[^(])x = −?\d/.test(rows),
     'derivative/marked: ступени называют точки подписями чертежа x₁ … x₆ с верной абсциссой (' + named.length + '), голых «x = …» нет');
  w.close();
}
{
  /* подсказка ничего не отнимает: решённая после подсказки задача засчитана и шагает к закрытию типа */
  const answer = shownAnswer(der(777).document);
  const store = { mistakes: { 'derivative-t8|extrema': { w: 2, r: 1, lastWrong: 1, last: 1 } } };
  const w = der(777, store);
  w.document.getElementById('taskHint').click();
  const fb = checkDer(w, answer);
  const me = missEx(w) || {};
  ok(/ok/.test(fb.className) && solvedEx(w) === 1 && me.r === 2 && me.w === 2,
     'derivative: после подсказки — засчитано, журнал r+1: ' + JSON.stringify(me));
}
{
  /* мусор в хранилище молча отбрасывается */
  const w = boot(DER, win => { win.Math.random = rng(777); win.localStorage.setItem(KEY, '[1,2,3]'); });
  const answer = shownAnswer(der(777).document);
  checkDer(w, answer);
  ok(solvedEx(w) === 1, 'derivative: массив вместо прогресса отброшен, решение записано');
}

/* 18. Зачёт: журнал по трекам, сданный зачёт не стирается, двойное нажатие не съедает задачу */
{
  const z = der(7, { 'derivative-t8': { runs: 1, best: 9, passed: true } });
  const zd = z.document;
  zd.getElementById('examStart').click();
  zd.getElementById('examAnswer').value = '123456';
  zd.getElementById('examCheck').click();
  zd.getElementById('examCheck').click();   /* второе нажатие до показа следующей задачи */
  ok(zd.querySelectorAll('#examDots span.ok, #examDots span.bad').length === 1, 'зачёт 8: двойное нажатие — один ответ');
  flushTimers();
  for (let i = 1; i < 10; i++){ zd.getElementById('examAnswer').value = '123456'; zd.getElementById('examCheck').click(); flushTimers(); }
  const zr = recOf(z);
  ok(/0 \/ 10/.test(zd.getElementById('examScore').textContent), 'зачёт 8: пройден до конца: ' + zd.getElementById('examScore').textContent);
  const zs = zr['derivative-t8'] || {};
  ok(zs.passed === true && zs.best === 9 && zs.runs === 2,
     'зачёт 8: неудачная попытка не стирает сданный зачёт: ' + JSON.stringify(zr['derivative-t8']));
  const keys = Object.keys(zr.mistakes || {}).filter(k => k.indexOf('derivative-t8|') === 0);
  const sumW = keys.reduce((s, k) => s + zr.mistakes[k].w, 0);
  ok(keys.length >= 1 && keys.every(k => !!RVN[k]) && sumW === 10, 'зачёт 8: 10 промахов в журнале под типами реестра: ' + keys.join(', ') + ' · w=' + sumW);
}

/* 19. «Физический смысл»: запись без «0t», «1t²», «+ −»; ответ сверяется независимым пересчётом */
{
  const w = der(99);
  const d = w.document;
  Array.from(d.querySelectorAll('#trackChips .chip')).find(b => /Физический смысл/.test(b.textContent)).click();
  const BAD = [/(^|[^0-9,])0t/, /(^|[^0-9,])1t/, /[+−-]\s*[+−-]/, /[+−]\s0(?![,\d])/, /undefined|NaN/];
  const bad = [];
  const kinds = { v: 0, t: 0 };
  function parsePoly(s){
    const P = {};
    s.trim().split(/ (?=[+−] )/).forEach((tk, i) => {
      let sign = 1;
      if (/^[+−] /.test(tk)){
        if (i === 0) bad.push('знак перед первым слагаемым: ' + s);
        sign = tk[0] === '−' ? -1 : 1; tk = tk.slice(2);
      }
      const m = tk.match(/^(\d+(?:,\d+)?)?(t([²³])?)?$/);
      if (!m || (!m[1] && !m[2])){ bad.push('не разобрано слагаемое «' + tk + '» в ' + s); return; }
      const pow = m[2] ? (m[3] === '³' ? 3 : m[3] === '²' ? 2 : 1) : 0;
      const coef = m[1] ? Number(m[1].replace(',', '.')) : 1;
      if (m[1] && coef === 1 && pow > 0) bad.push('единица перед t: ' + s);
      if (coef === 0) bad.push('нулевое слагаемое: ' + s);
      P[pow] = sign * coef;
    });
    return P;
  }
  for (let i = 0; i < 60; i++){
    const text = d.getElementById('taskText').textContent;
    d.getElementById('taskHint').click();
    const hint = d.getElementById('taskFb').textContent;
    const ans = shownAnswer(d);
    const sol = d.getElementById('taskSolBox').textContent;
    for (const s of [text, hint, sol]) for (const re of BAD) if (re.test(s)) bad.push(re + ' в «' + s.slice(0, 140) + '»');
    const m = text.match(/x\(t\) = (.+?)(?:, где| \()/);
    if (!m){ bad.push('нет закона движения: ' + text.slice(0, 80)); d.getElementById('taskNext').click(); continue; }
    const P = parsePoly(m[1]);
    const t0 = text.match(/в момент t = (\d+) с/), V = text.match(/была равна (\d+) м\/с/);
    let expect = NaN;
    if (t0){ kinds.v++; const T = +t0[1]; expect = 0; for (const p in P) if (+p > 0) expect += P[p] * p * Math.pow(T, p - 1); }
    else if (V){ kinds.t++; expect = (+V[1] - (P[1] || 0)) / (2 * P[2]); }
    const got = Number(String(ans).replace('−', '-').replace(',', '.'));
    if (!(Math.abs(got - expect) < 1e-9)) bad.push('ответ ' + ans + ' ≠ пересчёт ' + expect + ': ' + text.slice(0, 90));
    d.getElementById('taskNext').click();
  }
  ok(!bad.length, 'physics: 60 генераций без «0t»/«1t»/«+ −», ответы сходятся с пересчётом: ' + bad.slice(0, 3).join(' | '));
  ok(kinds.v >= 5 && kinds.t >= 5, 'physics: встретились обе разновидности: ' + JSON.stringify(kinds));
}

/* 19а. trainers/probability-t45.html: две попытки, адресная диагностика, лестница разбора */
const PRB = 'trainers/probability-t45.html';
const prob = (seed, store) => boot(PRB, win => {
  win.Math.random = rng(seed);
  win.setTimeout = fn => { timers.push(fn); return timers.length; };
  if (store) win.localStorage.setItem(KEY, JSON.stringify(store));
});
const prRec = w => recOf(w)['probability-t45'] || {};
const prSolved = w => (prRec(w).solved4 || 0) + (prRec(w).solved5 || 0);
const prMiss = w => recOf(w).mistakes || {};
const checkPr = (w, v) => { const d = w.document; d.getElementById('dAnswer').value = v; d.getElementById('dCheck').click(); return d.getElementById('dFb'); };
const prBox = d => d.getElementById('dSolBox');
/* нажимает кнопку лестницы до итога .lfinal, возвращает число нажатий */
const walkPr = d => { const btn = prBox(d).querySelector('.ladder-btn'); let n = 0; while (btn && !prBox(d).querySelector('.lfinal') && n < 40){ btn.click(); n++; } return n; };
const finalPr = d => { const f = prBox(d).querySelector('.lfinal'); const m = f && f.textContent.match(/^Ответ: (.+)\.$/); return m && m[1]; };
const decRu = x => String(Math.round(x * 1e6) / 1e6).replace('.', ',');
const hasNum = (text, num) => new RegExp('(^|[^0-9,])' + num.replace(',', '[.,]') + '(?![0-9])').test(text);
/* задача о билетах: по тексту известны n и k — значит, известны и ответ (n − k)/n, и типичная ошибка k/n */
const findTickets = () => {
  for (let s = 1; s <= 400; s++){
    const w = prob(s);
    const m = w.document.getElementById('dText').textContent.match(/^На экзамене (\d+) билетов, .+ не выучила? (\d+) из них/);
    if (m) return { seed: s, w, n: +m[1], k: +m[2] };
    w.close();
  }
  return null;
};
timers.length = 0;
{
  const found = findTickets();
  ok(!!found, 'probability: найдена задача о билетах');
  const { w, n, k } = found, d = w.document;
  const answer = decRu((n - k) / n), trap = decRu(k / n);
  ok(d.getElementById('dFb').getAttribute('aria-live') === 'polite' && d.getElementById('zFb').getAttribute('aria-live') === 'polite' && prBox(d).getAttribute('aria-live') === 'polite',
     'probability: сообщения проверки и лестница — aria-live');
  ok(d.getElementById('dSol').textContent === 'Разбор по шагам', 'probability: кнопка разбора — «Разбор по шагам»');
  /* первая ошибка: адресно, без ответа, вторая попытка; промах в журнале один */
  let fb = checkPr(w, trap);
  ok(/bad/.test(fb.className) && /Пока неверно/.test(fb.textContent) && /невыученного билета/.test(fb.textContent) && /Попробуйте ещё раз/.test(fb.textContent),
     'probability: первая ошибка k/n — адресно про невыученный билет, вторая попытка: ' + fb.textContent);
  ok(!hasNum(fb.textContent, answer) && !prBox(d).classList.contains('on'), 'probability: после первой ошибки ответ не показан, лестница не открыта');
  const e1 = prMiss(w)['probability-t45|tickets'];
  ok(!!e1 && e1.w === 1 && e1.r === 0 && e1.lastWrong > 0 && e1.last > 0 && prSolved(w) === 0, 'probability: промах записан один раз: ' + JSON.stringify(e1));
  ok(!!RVN['probability-t45|tickets'], 'probability: тип журнала есть в NAMES реестра');
  /* верно со второй попытки — засчитано, журнал r + 1: попытка ничего не отняла */
  fb = checkPr(w, answer);
  const r1 = prRec(w);
  ok(/ok/.test(fb.className) && prSolved(w) === 1 && r1.solved4 === 1 && r1.solved5 === 0 && r1.runs === 0 && r1.best === 0 && r1.passed === false,
     'probability: верно со второй попытки — solved4 = 1, форма записи прежняя: ' + JSON.stringify(r1));
  ok(prMiss(w)['probability-t45|tickets'].r === 1, 'probability: верный ответ после промаха — шаг к закрытию типа, r = 1');
  /* неверный ввод в те 900 мс, пока верный ответ ждёт смены задачи: ни промаха, ни обнуления серии, ни нового сообщения */
  checkPr(w, '1,5');
  ok(prMiss(w)['probability-t45|tickets'].w === 1 && prMiss(w)['probability-t45|tickets'].r === 1 && d.getElementById('stStreak').textContent === '1' && /ok/.test(d.getElementById('dFb').className),
     'probability: неверный ввод после верного до смены задачи журнал, серию и сообщение не трогает: ' + JSON.stringify(prMiss(w)['probability-t45|tickets']));
  ok(timers.length === 1, 'probability: следующая задача запланирована таймером');
  flushTimers();
  ok(!prBox(d).classList.contains('on') && prBox(d).textContent === '', 'probability: новая задача — лестница закрыта');
  /* вторая ошибка открывает лестницу; итог — последней ступенью; решённая после итога не засчитана */
  fb = checkPr(w, '1,5');
  ok(/bad/.test(fb.className) && /от 0 до 1/.test(fb.textContent) && !prBox(d).classList.contains('on'), 'probability: значение больше 1 — общее объяснение, лестницы ещё нет');
  const missBefore = JSON.stringify(Object.entries(prMiss(w)).map(([key, e]) => [key, e.w, e.r]));
  fb = checkPr(w, '1,5');
  const box = prBox(d), btn = box.querySelector('.ladder-btn');
  ok(/bad/.test(fb.className) && /Снова неверно/.test(fb.textContent) && /разбор по шагам/.test(fb.textContent), 'probability: вторая ошибка — приглашение в разбор: ' + fb.textContent);
  ok(box.classList.contains('on') && !!btn && box.querySelectorAll('.lq').length === 1 && box.querySelectorAll('.la').length === 0 && btn.textContent === 'Ответ шага' && !/Ответ:/.test(box.textContent),
     'probability: лестница открыта на вопросе первой ступени, итога нет');
  ok(/в счёт решённых не пойдёт \(промахом это не считается\)/.test(box.querySelector('.ladder-note').textContent), 'probability: подпись над лестницей предупреждает об открытом итоге до последнего нажатия');
  ok(JSON.stringify(Object.entries(prMiss(w)).map(([key, e]) => [key, e.w, e.r])) === missBefore, 'probability: вторая ошибка промахов не множит');
  btn.click();
  ok(box.querySelectorAll('.la').length === 1 && btn.textContent === 'Следующий шаг' && !/Ответ:/.test(box.textContent), 'probability: «Ответ шага» — ответ первой ступени, итога нет');
  const presses = walkPr(d) + 1;
  const q = box.querySelectorAll('.lq').length, a = box.querySelectorAll('.la').length;
  ok(q >= 3 && q === a && presses === 2 * q - 1 && btn.disabled && /в счёт решённых она не пойдёт/.test(box.textContent),
     'probability: лестница пройдена по одной ступени: вопросов ' + q + ', нажатий ' + presses + ', после итога кнопка выключена');
  ok(!box.querySelector('script, img') && box.querySelectorAll('.lq, .la, .lfinal').length === 2 * q + 1, 'probability: ступени вставлены текстом');
  const fin = finalPr(d);
  fb = checkPr(w, '1,5');
  ok(/bad/.test(fb.className) && /уже открыт/.test(fb.textContent) && box.querySelectorAll('.lq').length === q, 'probability: ошибка после итога — сверить запись, лестница не пересоздаётся');
  fb = checkPr(w, fin);
  ok(/ok/.test(fb.className) && /в счёт решённых не идёт/.test(fb.textContent) && prSolved(w) === 1 && timers.length === 0,
     'probability: решённая после итога задача не засчитана: ' + fb.textContent);
  const open = Object.entries(prMiss(w)).filter(([key, e]) => e.w === 1 && e.r === 0);
  ok(open.length === 1 && open[0][0] !== 'probability-t45|tickets', 'probability: тип разобранной задачи в журнале остался открытым: ' + open.map(x => x[0]).join());
  /* лестница по своей воле, без ошибок: журнал не трогает, но задача в счёт не идёт */
  d.getElementById('dNext').click();
  const jBefore = JSON.stringify(prMiss(w));
  d.getElementById('dSol').click();
  walkPr(d);
  fb = checkPr(w, finalPr(d));
  ok(/ok/.test(fb.className) && /в счёт решённых не идёт/.test(fb.textContent) && prSolved(w) === 1 && JSON.stringify(prMiss(w)) === jBefore,
     'probability: разбор без ошибок — не засчитано, промаха в журнале нет');
  /* карточка навигатора видит одну решённую */
  const hp = boot('index.html', win => win.localStorage.setItem(KEY, w.localStorage.getItem(KEY))).document.querySelector('[data-progress="prob"]');
  ok(/решено задач: 1/.test(hp.textContent), 'probability: навигатор показывает решённую: ' + hp.textContent);
  w.close();
}
{
  /* ответ в процентах — адресно; журнал после ошибок хранит тип, кабинет и review его понимают */
  const found = findTickets();
  const { w, n, k } = found;
  const fb = checkPr(w, decRu((n - k) / n * 100));
  ok(/bad/.test(fb.className) && /в процентах/.test(fb.textContent) && !hasNum(fb.textContent, decRu((n - k) / n)),
     'probability: ответ в процентах — адресное объяснение без числа ответа: ' + fb.textContent);
  const rv = boot('review.html', win => win.localStorage.setItem(KEY, w.localStorage.getItem(KEY))).document;
  ok(/невыученный билет|билет/.test(rv.getElementById('openList').textContent) && /задание 4/.test(rv.getElementById('openList').textContent),
     'probability: журнал ошибок показывает открытый тип «билеты» линии 4');
  w.close();
}
{
  /* мусор в хранилище молча отбрасывается: массив вместо объекта не роняет тренажёр и лестницу */
  const w = boot(PRB, win => { win.Math.random = rng(3); win.setTimeout = fn => { timers.push(fn); return timers.length; }; win.localStorage.setItem(KEY, '[1,2,3]'); });
  const d = w.document;
  checkPr(w, '1,5'); checkPr(w, '1,5');
  ok(prBox(d).classList.contains('on') && walkPr(d) > 0 && !!finalPr(d), 'probability: при мусоре в хранилище лестница работает');
  w.close();
}

/* 19б. trainers/inequalities.html: итог не одним нажатием. Кнопки «Показать всё» нет;
   24 блока «Проверь себя» — «Ход решения» + кнопка «Показать ответ» внутри, ответ скрыт;
   «Ход решения» не заканчивается итогом в другой записи; диагностическая работа без
   отдельного «Ответ»; разбор mountSteps — по одному шагу, ответ последним нажатием.
   MathJax в jsdom нет — mj() пустой, разметка ступеней остаётся сырым TeX */
{
  const w = boot('trainers/inequalities.html', win => { win.scrollTo = () => {}; });
  const d = w.document;
  ok(!Array.from(d.querySelectorAll('button, summary')).some(b => /Показать всё/.test(b.textContent)), 'inequalities: кнопки «Показать всё» в документе нет');
  const labs = Array.from(d.querySelectorAll('details.reveal > summary > span')).map(s => s.textContent.trim());
  const conv = Array.from(d.querySelectorAll('details.reveal')).filter(x => x.querySelector(':scope > .solution > button.reveal-answer'));
  ok(conv.length === 24 && labs.filter(t => t === 'Ход решения').length === 24 && !labs.includes('Показать ответ') && labs.filter(t => t === 'Показать решение').length === 10,
     'inequalities: 24 блока «Ход решения» с кнопкой ответа, 10 разобранных примеров теории не тронуты: ' + JSON.stringify(labs.reduce((m, t) => (m[t] = (m[t] || 0) + 1, m), {})));
  ok(conv.every(x => { const a = x.querySelector(':scope > .solution > .answer'); return !!a && a.style.display === 'none' && x.querySelector('button.reveal-answer').textContent === 'Показать ответ'; }),
     'inequalities: ответ каждого блока скрыт до нажатия «Показать ответ»');
  /* «Ход решения» — ступень, а не ответ в другой записи: последняя формула абзаца не должна быть
     неравенством по x (x > 2, x ≤ −3, −3 < x < 4, x − 1 < 0), и запись ответа в абзаце не встречается */
  const norm = s => s.replace(/\\[()]/g, '').replace(/\\[,;!]/g, '').replace(/\s+/g, '');
  const xIneq = /^(?:-?\d+\s*(?:<|\\leq)\s*)?x\s*(?:[-+]\s*\d+\s*)?(?:<|>|\\leq|\\geq)\s*-?\d+$/;
  const leaks = conv.map(x => {
    const p = x.querySelector(':scope > .solution > p'), a = x.querySelector(':scope > .solution > .answer');
    const text = p ? p.textContent : '';
    const forms = text.match(/\\\(([\s\S]*?)\\\)/g) || [];
    const last = forms.length ? forms[forms.length - 1].slice(2, -2).split('\\Rightarrow').pop().trim() : '';
    return (!p || xIneq.test(last) || norm(text).includes(norm(a.textContent))) ? (x.closest('.example').querySelector('.example-task') || {}).textContent : null;
  }).filter(Boolean);
  ok(leaks.length === 0, 'inequalities: ни один «Ход решения» не заканчивается итогом: ' + leaks.join(' | '));
  const first = conv[0], fbtn = first.querySelector('button.reveal-answer');
  fbtn.click();
  ok(first.querySelector(':scope > .solution > .answer').style.display === '' && !first.querySelector('button.reveal-answer'), 'inequalities: «Показать ответ» открывает ответ и убирает кнопку');
  /* диагностическая работа № 13: у карточек только «Подсказка» и «Решение по шагам» */
  const sums = Array.from(d.querySelectorAll('details > summary')).map(s => s.textContent.trim());
  ok(!sums.includes('Ответ') && sums.filter(s => s === 'Решение по шагам').length === 24 && sums.filter(s => s === 'Подсказка').length === 24,
     'inequalities: диагностическая работа — 24 карточки с «Подсказка» и «Решение по шагам», отдельного «Ответ» нет');
  /* mountSteps: шаги по одному, «Показать ответ» — только на последнем шаге, «Сначала» сбрасывает */
  const foots = Array.from(d.querySelectorAll('.quiz-foot')).filter(f => Array.from(f.querySelectorAll('button')).some(b => b.textContent === 'Следующий шаг'));
  ok(foots.length >= 20 && foots.every(f => Array.from(f.querySelectorAll('button')).map(b => b.textContent).join('|') === 'Следующий шаг|Сначала'),
     'inequalities: подвалы разборов (' + foots.length + ') — только «Следующий шаг» и «Сначала»');
  const sbox = foots[0].parentElement, sbtn = foots[0].querySelector('button');
  const st = () => ({ steps: sbox.querySelectorAll('.step-body').length, ans: !!sbox.querySelector('.answer'), btn: sbtn.textContent, dis: sbtn.disabled });
  const seq = [];
  for (let i = 0; i < 12; i++){ const s = st(); seq.push(s.steps + (s.ans ? '+A' : '')); if (s.ans || s.dis) break; sbtn.click(); }
  const end = st();
  ok(end.ans && end.dis && end.steps >= 2 && seq.slice(0, -1).every(s => !/A/.test(s)) && seq.length === end.steps + 2,
     'inequalities: разбор по одному шагу, ответ только последним нажатием «Показать ответ»: ' + seq.join(' → '));
  Array.from(foots[0].querySelectorAll('button')).find(b => b.textContent === 'Сначала').click();
  ok(st().steps === 0 && !st().ans && !st().dis && st().btn === 'Следующий шаг', 'inequalities: «Сначала» сбрасывает разбор');
  w.close();
}

/* ================= exam/variant.html: честный счёт попыток ================= */

/* 20. Брошенная после первой ошибки задача — попытка без балла, ровно один раз */
{
  const VK = 'profile-ege-course-v1';
  const VURL = 'https://mathexam.space/exam/variant.html?m=1';
  const w = boot('exam/variant.html', null, VURL);
  const d = w.document;
  const st1 = () => ((JSON.parse(w.localStorage.getItem(VK) || '{}').progress || {})[1]) || { attempts: 0, correct: 0, points: 0 };
  const answerNow = () => w.eval('currentTask.answer');
  const put = v => { d.getElementById('short-answer').value = String(v); d.getElementById('check-short').click(); };
  const fbv = () => d.getElementById('feedback');
  const back = d.querySelector('a.back');
  ok(!!back && back.getAttribute('href') === '../index.html' && /Курс/.test(back.textContent), 'variant: ссылка «← Курс» ведёт на навигатор');
  put('123456789');
  ok(/hint/.test(fbv().className) && !/Правильный ответ/.test(fbv().textContent), 'variant: первая ошибка — вторая попытка, ответ не показан');
  ok(st1().attempts === 1 && st1().correct === 0 && st1().points === 0, 'variant: первая ошибка — уже попытка без балла: ' + JSON.stringify(st1()));
  d.getElementById('next').click();
  ok(st1().attempts === 1 && st1().correct === 0, 'variant: «Новое задание» после первой ошибки — попытка осталась, ровно одна: ' + JSON.stringify(st1()));
  ok(/0 верных из 1/.test(d.getElementById('topic-score').textContent), 'variant: счёт линии показывает брошенную попытку');
  put('123456789'); put(answerNow());
  ok(st1().attempts === 2 && st1().correct === 1 && st1().points === 1 && /ok/.test(fbv().className),
     'variant: верно со второй попытки — одна попытка и один балл: ' + JSON.stringify(st1()));
  d.getElementById('next').click();
  put('123456789'); put('123456789');
  ok(st1().attempts === 3 && st1().correct === 1 && /bad/.test(fbv().className) && /Правильный ответ/.test(fbv().textContent),
     'variant: две ошибки — одна попытка, затем ответ и разбор');
  d.getElementById('next').click();
  put(answerNow());
  ok(st1().attempts === 4 && st1().correct === 2, 'variant: верно с первой — как раньше');
  d.getElementById('next').click();
  put('123456789');
  d.querySelector('[data-mode="mix"]').click();
  ok(st1().attempts === 5 && st1().correct === 2, 'variant: брошенная сменой режима задача — тоже одна попытка');
  const w2 = boot('exam/variant.html', win => win.localStorage.setItem(VK, w.localStorage.getItem(VK)), VURL);
  ok(/2 верных из 5/.test(w2.document.getElementById('topic-score').textContent), 'variant: после перезагрузки точность честная: 2 из 5');
}

console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);
