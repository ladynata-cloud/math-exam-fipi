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

console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);
