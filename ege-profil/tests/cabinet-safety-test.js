/* Гейт «Кабинет учителя и журнал: экранирование и мусор» (jsdom).

   Кабинет учителя (teacher.html) и «Работа над ошибками» (review.html)
   показывают недоверенные данные: localStorage и код прогресса ученика
   MEP1, который учитель вставляет сам. Проверяется:
   1) XSS: нагрузки в ключах журнала (тип и TID), в полях записи (w, r,
      метки времени), в имени ученика — в своём хранилище, в просмотре кода
      и после «Загрузить в этот браузер» — не создают ни одного элемента и
      обработчика, window.__xss не установлен, нагрузка видна как текст;
   2) мусор: "null", строка, массив, число, битый JSON вместо хранилища;
      null/строка/массив/число вместо журнала и его записей; нечисла в w/r
      и метках — страницы грузятся без исключений, счётчики без NaN,
      записи-мусор пропущены, верные — на месте;
   3) «Загрузить в этот браузер»: код, чей верх не объект, отклоняется
      с сообщением и ничего не пишет; записи-мусор журнала отбрасываются
      (это сказано в сообщении), остальные данные ученика — как были;
   4) значения, которых нет в JSON.stringify (Infinity из 1e400, дроби):
      сырой JSON в хранилище и в коде, прямые вызовы RV.entry()/RV.open() —
      Infinity не проходит (isFinite в count()), w и r приводятся к целым;
   5) «Потери последнего пробника»: попытка-мусор в конце истории не
      выдаётся за результат — берётся последняя верная, как на главной;
   6) одно правило записи журнала: registry.js (entry/keyOk) и адаптер
      review на главной (progress-adapters.js) дают один и тот же счёт на
      сотнях сгенерированных записей — верных и мусорных;
   7) «← Курс» в кабинете на касании — не ниже 44 px (правило CSS).

   jsdom картинки не грузит, поэтому onerror сам не сработает. Функция
   fire() делает то, что сделал бы браузер: у каждого элемента с атрибутом
   on* вызывает его событие. Если нагрузка попала в разметку, обработчик
   выполнится и поставит window.__xss. Маркер успеха: CABINET_SAFETY_OK. */
const { makeBoot } = require('./boot.js');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

const errors = [];
const boot = makeBoot(errors);
const KEY = 'mathExamCourseProgress.v1';
const BACKUP = KEY + '.backup';
const DAY = 86400000;
const T0 = Date.UTC(2026, 1, 17, 9, 0, 0);

const flush = (n = 8) => new Promise(res => {
  let i = 0;
  (function tick(){ i++ < n ? setImmediate(tick) : res(); })();
});
function click(w, el){ el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); }

/* нагрузки: текстовый контекст, выход из атрибута, скрипт */
const PAY = '<img src=x onerror="window.__xss=1">';
const PAY2 = '"><svg onload=window.__xss=2>';
const PAY3 = "'><script>window.__xss=3</script>";
/* мусор в тексте страницы */
const BAD = /NaN|undefined|Infinity|Invalid Date|\[object/;

/* Видимый текст: без вклеенных boot.js скриптов и стилей. */
function vis(el){
  const c = el.cloneNode(true);
  c.querySelectorAll('script, style').forEach(s => s.remove());
  return c.textContent;
}
/* Всё, что нагрузка могла бы оставить в документе. */
function injected(d){
  const found = [];
  d.querySelectorAll('img, iframe, object, embed').forEach(el => found.push(el.tagName));
  d.querySelectorAll('script:not([data-inlined-from])').forEach(el => {
    if (/__xss/.test(el.textContent)) found.push('script');
  });
  /* свои svg у страниц есть (главная, QR-код); чужой svg выдаёт себя атрибутом on* */
  d.querySelectorAll('*').forEach(el => {
    for (const a of Array.from(el.attributes)) if (/^on/i.test(a.name)) found.push(el.tagName + '[' + a.name + ']');
  });
  return found;
}
/* Сделать то, что сделал бы браузер: вызвать события всех атрибутов on*. */
function fire(w){
  w.document.querySelectorAll('*').forEach(el => {
    for (const a of Array.from(el.attributes)){
      if (!/^on/i.test(a.name)) continue;
      try { el.dispatchEvent(new w.Event(a.name.slice(2).toLowerCase())); } catch (e) {}
    }
  });
}
/* Итог по странице: ничего не внедрено и ничего не исполнилось. */
function safe(w, label){
  const inj = injected(w.document);
  fire(w);
  ok(!inj.length, label + ': нагрузка не стала разметкой: ' + inj.slice(0, 4).join(', '));
  ok(w.__xss === undefined, label + ': window.__xss не установлен (' + w.__xss + ')');
}

function open(file, store, extra){
  const before = errors.length;
  let w = null;
  try {
    w = boot(file, win => {
      win.confirm = () => true;
      win.scrollTo = () => {};
      if (store !== undefined) win.localStorage.setItem(KEY, typeof store === 'string' ? store : JSON.stringify(store));
      if (extra) extra(win);
    });
  } catch (e) { errors.push('boot ' + file + ': ' + e.message); }
  return { w, d: w && w.document, errs: () => errors.slice(before) };
}
const rowsOf = d => Array.from(d.querySelectorAll('#cards .trow'));
const rowOf = (d, tid) => rowsOf(d).find(r => r.querySelector('.tid').textContent === tid);
const reviewOpen = d => d.querySelectorAll('#openList .row').length;
const reviewClosed = d => d.querySelectorAll('#closedList .row').length;
/* RAW-код MEP1 вручную — для верха null, который encode() превращает в {} */
const rawCode = json => 'MEP1.' + Buffer.concat([Buffer.from([0]), Buffer.from(json, 'utf8')]).toString('base64url');

/* Журнал с нагрузками. Верные записи с нагрузкой в ключе показываются
   (как текст), записи с нагрузкой в полях — мусор и пропускаются. */
const XSS_STORE = {
  student: { name: PAY + PAY3 },
  mistakes: {
    ['righttri-t1|' + PAY]:        { w: 2, r: 1, lastWrong: T0, last: T0 },              /* тип — в кабинете и в журнале */
    [PAY2 + '|t1']:                { w: 1, r: 0, lastWrong: T0 - DAY, last: T0 - DAY },  /* TID — в журнале */
    ['x|' + PAY3]:                 { w: 1, r: 0, lastWrong: T0 - 2 * DAY, last: T0 - 2 * DAY }, /* пример из ревью */
    'ege-t1-yashchenko|t8':        { w: PAY, r: 0, lastWrong: T0, last: T0 },            /* w — мусор */
    'ege-t2-yashchenko|v1':        { w: 1, r: PAY2, lastWrong: T0, last: T0 },           /* r — мусор */
    'probability-t45|balls':       { w: 1, r: 0, lastWrong: PAY, last: PAY3 }             /* метки — мусор */
  }
};
const XSS_VALID = 3, XSS_JUNK = 3;

function checkTeacherXss(p, label){
  safe(p.w, label);
  const d = p.d;
  ok(rowsOf(d).length === p.w.RV.CABINET.length, label + ': все строки кабинета на месте');
  const rt = rowOf(d, 'righttri-t1');
  ok(!!rt && rt.textContent.includes(PAY), label + ': тип-нагрузка видна текстом в строке righttri');
  ok(!!rt && rt.querySelectorAll('.types li.open').length === 1, label + ': у righttri одна открытая запись');
  const p1 = rowOf(d, 'ege-t1-yashchenko'), v2 = rowOf(d, 'ege-t2-yashchenko'), pr = rowOf(d, 'probability-t45');
  ok(/пусто/.test(p1.textContent) && /записей нет/.test(p1.textContent), label + ': запись с w-нагрузкой пропущена');
  ok(/пусто/.test(v2.textContent), label + ': запись с r-нагрузкой пропущена');
  ok(/пусто/.test(pr.textContent) && /записей нет/.test(pr.textContent), label + ': запись с нагрузкой в метках пропущена');
  ok(!BAD.test(d.getElementById('cards').textContent), label + ': в сводке нет NaN/undefined/Invalid Date');
}
function checkReviewXss(p, label){
  safe(p.w, label);
  const d = p.d;
  const txt = d.getElementById('openList').textContent;
  ok(txt.includes(PAY) && txt.includes(PAY3), label + ': типы-нагрузки видны текстом');
  ok(txt.includes(PAY2), label + ': TID-нагрузка видна текстом');
  ok(reviewOpen(d) === XSS_VALID, label + ': к повтору ровно верные записи: ' + reviewOpen(d));
  ok(d.querySelector('#summaryCard .bigcount').firstChild.textContent === String(XSS_VALID), label + ': счётчик «к повтору» = ' + XSS_VALID);
  ok(!BAD.test(vis(d.body)), label + ': на странице нет NaN/undefined/Invalid Date');
}

async function run(){

/* ================= 1. XSS в своём хранилище ================= */
{
  const t = open('teacher.html', XSS_STORE);
  await flush();
  checkTeacherXss(t, 'кабинет, своё хранилище');
  ok(t.d.getElementById('sourceLine').textContent.includes('Ученик: ' + PAY + PAY3), 'кабинет: имя ученика-нагрузка — текстом');
  ok(!t.errs().length, 'кабинет, своё хранилище: без исключений: ' + t.errs().join(' | '));

  const r = open('review.html', XSS_STORE);
  checkReviewXss(r, 'журнал, своё хранилище');
  ok(!r.errs().length, 'журнал, своё хранилище: без исключений: ' + r.errs().join(' | '));

  /* счётчик на главной — по тому же правилу записи */
  const i = open('index.html', XSS_STORE);
  const txt = i.d.querySelector('[data-progress="review"]').textContent;
  ok(new RegExp('к повтору: ' + XSS_VALID + ' ').test(txt), 'главная: «к повтору» совпадает с журналом: ' + txt);
  safe(i.w, 'главная, своё хранилище');
}

/* ================= 2. XSS в коде ученика: просмотр и загрузка ================= */
{
  const donor = open('teacher.html');
  await flush();
  const code = await donor.w.PROGRESS_CODE.encode(XSS_STORE);
  ok(/^MEP1\.[A-Za-z0-9\-_]+$/.test(code), 'код с нагрузками собран функцией encode()');

  const OWN = { 'numbers-t19': { passed: true, tasks: {} } };
  const t = open('teacher.html', OWN);
  await flush();
  const d = t.d;
  d.getElementById('inBox').value = code;
  click(t.w, d.getElementById('showBtn'));
  await flush();
  ok(/Показан прогресс из вставленного кода/.test(d.getElementById('sourceLine').textContent), 'просмотр кода с нагрузками включён');
  checkTeacherXss(t, 'кабинет, просмотр кода');
  ok(d.getElementById('sourceLine').textContent.includes('Ученик: ' + PAY + PAY3), 'просмотр: имя ученика-нагрузка — текстом');
  ok(new RegExp('пропущено: ' + XSS_JUNK).test(d.getElementById('inStatus').textContent),
     'просмотр: сказано, сколько записей журнала пропущено: ' + d.getElementById('inStatus').textContent);
  ok(JSON.stringify(JSON.parse(t.w.localStorage.getItem(KEY))) === JSON.stringify(OWN), 'просмотр ничего не записал');

  click(t.w, d.getElementById('loadBtn'));
  await flush();
  const stored = JSON.parse(t.w.localStorage.getItem(KEY));
  ok(JSON.stringify(JSON.parse(t.w.localStorage.getItem(BACKUP))) === JSON.stringify(OWN), 'загрузка: прежний прогресс в .backup');
  ok(Object.keys(stored.mistakes).length === XSS_VALID, 'загрузка: в журнале только верные записи: ' + Object.keys(stored.mistakes).length);
  ok(Object.keys(stored.mistakes).every(k => JSON.stringify(stored.mistakes[k]) === JSON.stringify(XSS_STORE.mistakes[k])),
     'загрузка: верные записи — как в коде, побайтно');
  ok(stored.student.name === PAY + PAY3, 'загрузка: имя ученика — как в коде (строка)');
  ok(new RegExp('отброшено: ' + XSS_JUNK).test(d.getElementById('inStatus').textContent),
     'загрузка: сказано, сколько записей отброшено: ' + d.getElementById('inStatus').textContent);
  checkTeacherXss(t, 'кабинет после загрузки');
  ok(!t.errs().length, 'кабинет, код с нагрузками: без исключений: ' + t.errs().join(' | '));

  const r = open('review.html', t.w.localStorage.getItem(KEY));
  checkReviewXss(r, 'журнал после загрузки');
  ok(!r.errs().length, 'журнал после загрузки: без исключений: ' + r.errs().join(' | '));
}

/* ================= 3. Мусор вместо всего хранилища ================= */
{
  const TOP = { 'битый JSON': '{"a":', 'null': 'null', 'строка': '"junk"', 'массив': '[1,2]', 'число': '42', 'true': 'true' };
  for (const [name, raw] of Object.entries(TOP)){
    const t = open('teacher.html', raw);
    await flush();
    ok(!!t.d && rowsOf(t.d).length === t.w.RV.CABINET.length, 'кабинет, хранилище «' + name + '»: сводка отрисована');
    ok(!!t.d && /Показан прогресс этого браузера/.test(t.d.getElementById('sourceLine').textContent), 'кабинет, хранилище «' + name + '»: своя сводка');
    ok(!!t.d && !BAD.test(t.d.getElementById('cards').textContent), 'кабинет, хранилище «' + name + '»: без NaN/undefined');
    ok(JSON.stringify(t.w.PROGRESS_CODE.readLive()) === '{}', 'readLive() на «' + name + '» — пустой объект');
    click(t.w, t.d.querySelector('#myCode #codeBtn'));
    await flush(10);
    const code = t.d.querySelector('#myCode .codebox').value;
    let back;
    try { back = JSON.stringify(await t.w.PROGRESS_CODE.decode(code)); } catch (e) { back = e.message; }
    ok(back === '{}', 'кабинет, хранилище «' + name + '»: код своего браузера читается как {}: ' + back);
    ok(!t.errs().length, 'кабинет, хранилище «' + name + '»: без исключений: ' + t.errs().join(' | '));

    const r = open('review.html', raw);
    ok(!!r.d && /Журнал пока пуст/.test(r.d.body.textContent), 'журнал, хранилище «' + name + '»: пустой журнал');
    ok(!r.errs().length, 'журнал, хранилище «' + name + '»: без исключений: ' + r.errs().join(' | '));
    /* «Очистить журнал» на мусоре — не падает. location.reload() jsdom
       не умеет («Not implemented: navigation») — эту строку не считаем. */
    const mark = errors.length;
    click(r.w, r.d.getElementById('clearBtn'));
    const real = errors.splice(mark).filter(e => !/Not implemented: navigation/.test(e));
    ok(!real.length, 'журнал, хранилище «' + name + '»: очистка без исключений: ' + real.join(' | '));
    ok(r.w.localStorage.getItem(KEY) === '{}', 'журнал, хранилище «' + name + '»: очистка записала пустой объект');
  }
}

/* ================= 4. Мусор вместо журнала и в записях ================= */
{
  for (const [name, mk] of Object.entries({ 'null': null, 'строка': 'x', 'массив': [1, 2], 'число': 42, 'true': true })){
    const store = { mistakes: mk, 'righttri-t1': { topics: { 1: { correct: 2, solved: 3 } } } };
    const t = open('teacher.html', store);
    await flush();
    ok(!!t.d && rowsOf(t.d).length === t.w.RV.CABINET.length && !BAD.test(t.d.getElementById('cards').textContent),
       'кабинет, журнал «' + name + '»: сводка без мусора');
    ok(!!t.d && /чистые серии: 2 из 15/.test(rowOf(t.d, 'righttri-t1').textContent), 'кабинет, журнал «' + name + '»: прогресс тренажёра виден');
    ok(!t.errs().length, 'кабинет, журнал «' + name + '»: без исключений: ' + t.errs().join(' | '));
    const r = open('review.html', store);
    ok(!!r.d && /Журнал пока пуст/.test(r.d.body.textContent), 'журнал «' + name + '»: пустой журнал');
    ok(!r.errs().length, 'журнал «' + name + '»: без исключений: ' + r.errs().join(' | '));
  }

  const JUNK_MK = {
    'righttri-t1|t5-seg30':       { w: 2, r: 1, lastWrong: T0, last: T0 },              /* верная, открыта */
    'righttri-t1|t2-altFromSegs': { w: 1, r: 3, lastWrong: T0 - DAY, last: T0 - DAY },  /* верная, закрыта */
    'constructor|y':              { w: 1, r: 0, lastWrong: T0 - 2 * DAY },                /* верная, TID — имя из Object.prototype */
    '__proto__|z':                { w: 1, r: 0 },                                         /* верная, без меток */
    'righttri-t1|a': null, 'righttri-t1|b': 'x', 'righttri-t1|c': [1, 2], 'righttri-t1|d': 7,
    'righttri-t1|e': { w: 'x', r: 0 }, 'righttri-t1|f': { w: 1, r: 'x' }, 'righttri-t1|g': { w: null, r: 0 },
    'righttri-t1|h': { w: -1, r: 0 }, 'righttri-t1|i': { w: 1, r: -2 }, 'righttri-t1|j': { w: [3], r: 0 },
    'righttri-t1|k': { w: 1, r: 0, last: 'x' }, 'righttri-t1|l': { w: 1, r: 0, lastWrong: 1e300 },
    'righttri-t1|m': { r: 0 }, 'righttri-t1|n': { w: '5', r: '0' },
    'junkkey': { w: 1, r: 0 }, '|t1': { w: 1, r: 0 }, 'righttri-t1|': { w: 1, r: 0 }
  };
  const VALID = ['righttri-t1|t5-seg30', 'righttri-t1|t2-altFromSegs', 'constructor|y', '__proto__|z'];
  const JUNK_N = Object.keys(JUNK_MK).length - VALID.length;
  const store = { student: { name: 'Аня П., 9А' }, 'righttri-t1': { topics: { 1: { correct: 2, solved: 3 } } }, mistakes: JUNK_MK };

  const t = open('teacher.html', store);
  await flush();
  ok(!!rowOf(t.d, 'righttri-t1'), 'кабинет: записи-мусор не роняют сводку');
  const rt = rowOf(t.d, 'righttri-t1') || t.d.createElement('div');
  ok(rt.querySelectorAll('.types li.open').length === 1 && rt.querySelectorAll('.types li.shut').length === 1,
     'кабинет: из 17 записей righttri видны только 2 верные');
  ok(/17\.02\.2026/.test(rt.textContent), 'кабинет: дата последней ошибки — из верной записи');
  ok(!BAD.test(t.d.getElementById('cards').textContent), 'кабинет: записи-мусор не дали NaN/undefined/Invalid Date');
  ok(/Ученик: Аня П\., 9А\./.test(t.d.getElementById('sourceLine').textContent), 'кабинет: верное имя ученика показано');
  ok(!t.errs().length, 'кабинет, записи-мусор: без исключений: ' + t.errs().join(' | '));

  const r = open('review.html', store);
  ok(reviewOpen(r.d) === 3 && reviewClosed(r.d) === 1, 'журнал: 3 открытых и 1 закрытая из ' + Object.keys(JUNK_MK).length + ': ' + reviewOpen(r.d) + '/' + reviewClosed(r.d));
  ok(!BAD.test(vis(r.d.body)), 'журнал: записи-мусор не дали NaN/undefined/Invalid Date: ' + (vis(r.d.body).match(BAD) || [''])[0]);
  const links = Array.from(r.d.querySelectorAll('#openList a, #closedList a')).map(a => a.getAttribute('href'));
  ok(links.length === 1 && /^trainers\/pryamougolny-treugolnik-trenazher\.html\?mode=review$/.test(links[0]),
     'журнал: «Повторить» только у известного тренажёра (constructor/__proto__ — без ссылки): ' + links.join(', '));
  ok(/constructor/.test(r.d.getElementById('openList').textContent) && /__proto__/.test(r.d.getElementById('openList').textContent),
     'журнал: TID «constructor» и «__proto__» показаны как есть');
  ok(!r.errs().length, 'журнал, записи-мусор: без исключений: ' + r.errs().join(' | '));

  const i = open('index.html', store);
  const txt = i.d.querySelector('[data-progress="review"]').textContent;
  ok(/к повтору: 3 · закрыто: 1/.test(txt), 'главная: счётчик журнала совпадает с «Работой над ошибками»: ' + txt);

  /* загрузка кода с записями-мусором */
  const code = await t.w.PROGRESS_CODE.encode(store);
  const L = open('teacher.html', { own: 1 });
  await flush();
  L.d.getElementById('inBox').value = code;
  click(L.w, L.d.getElementById('loadBtn'));
  await flush();
  const got = JSON.parse(L.w.localStorage.getItem(KEY));
  ok(JSON.stringify(Object.keys(got.mistakes)) === JSON.stringify(VALID), 'загрузка: в журнале остались только верные записи, порядок прежний: ' + Object.keys(got.mistakes).join(', '));
  ok(VALID.every(k => JSON.stringify(got.mistakes[k]) === JSON.stringify(JUNK_MK[k])), 'загрузка: верные записи не изменены');
  const rest = o => JSON.stringify(Object.keys(o).filter(k => k !== 'mistakes').map(k => [k, o[k]]));
  ok(rest(got) === rest(store) && JSON.stringify(Object.keys(got)) === JSON.stringify(Object.keys(store)),
     'загрузка: остальные данные ученика — как в коде, порядок ключей прежний');
  ok(new RegExp('отброшено: ' + JUNK_N + '\\.').test(L.d.getElementById('inStatus').textContent),
     'загрузка: в сообщении число отброшенных записей (' + JUNK_N + '): ' + L.d.getElementById('inStatus').textContent);
  ok(!L.errs().length, 'загрузка записей-мусора: без исключений: ' + L.errs().join(' | '));
  const r2 = open('review.html', L.w.localStorage.getItem(KEY));
  ok(reviewOpen(r2.d) === 3 && reviewClosed(r2.d) === 1 && !r2.errs().length, 'журнал после загрузки: 3 и 1, без исключений');

  /* ветка журнала — не объект: отбрасывается целиком, остальное пишется */
  const store2 = { 'righttri-t1': { topics: { 1: { correct: 2 } } }, mistakes: 'zz', student: { name: 'Б.' } };
  const code2 = await t.w.PROGRESS_CODE.encode(store2);
  L.d.getElementById('inBox').value = code2;
  click(L.w, L.d.getElementById('loadBtn'));
  await flush();
  const got2 = JSON.parse(L.w.localStorage.getItem(KEY));
  ok(!('mistakes' in got2) && rest(got2) === rest(store2), 'загрузка: журнал-строка отброшен, остальное записано');
  ok(/Журнал ошибок в коде испорчен и не загружен/.test(L.d.getElementById('inStatus').textContent),
     'загрузка: сказано, что журнал испорчен: ' + L.d.getElementById('inStatus').textContent);

  /* чистый код — без оговорок и побайтно */
  const clean = { 'righttri-t1': { topics: { 1: { correct: 2 } } }, mistakes: { 'righttri-t1|t1-ratio': { w: 1, r: 0, lastWrong: T0, last: T0 } } };
  L.d.getElementById('inBox').value = await t.w.PROGRESS_CODE.encode(clean);
  click(L.w, L.d.getElementById('loadBtn'));
  await flush();
  ok(L.w.localStorage.getItem(KEY) === JSON.stringify(clean), 'загрузка чистого кода — побайтно как в коде');
  ok(!/испорч/.test(L.d.getElementById('inStatus').textContent), 'загрузка чистого кода — без оговорок о мусоре');
}

/* ================= 4а. Infinity и дроби: мимо JSON.stringify ================= */
/* JSON.stringify пишет Infinity как null, поэтому хранилище задаётся сырой
   строкой (1e400 → JSON.parse даёт Infinity), код — через rawCode(), а
   функции реестра вызываются напрямую. Так ловятся и count() без isFinite,
   и entry() без приведения w, r к целым. */
{
  const RAW = '{"student":{"name":"Аня"},"mistakes":{' +
    '"righttri-t1|t1-ratio":{"w":1e400,"r":0},' +                     /* w = Infinity — мусор */
    '"righttri-t1|t1-side":{"w":2,"r":1e400},' +                       /* r = Infinity — мусор */
    '"righttri-t1|t2-sinFromSeg":{"w":1,"r":0,"lastWrong":1e400},' +  /* метка = Infinity — мусор */
    '"righttri-t1|t5-seg30":{"w":2.7,"r":1.2,"lastWrong":' + T0 + '}}}'; /* верная, дроби → 2 и 1 */
  const MOVE = /промахов: 2 · подряд верных: 1 из 3/;
  const cabinet = (d, label) => {
    const rt = rowOf(d, 'righttri-t1') || d.createElement('div');
    const li = Array.from(rt.querySelectorAll('.types li'));
    ok(!/Infinity/.test(d.getElementById('cards').textContent) && !BAD.test(d.getElementById('cards').textContent),
       label + ': в сводке нет Infinity/NaN');
    ok(li.length === 1 && li[0].classList.contains('open') && MOVE.test(li[0].textContent),
       label + ': у righttri одна открытая запись «промахов: 2 · подряд верных: 1»: ' + li.map(x => x.textContent).join(' | '));
    ok(/17\.02\.2026/.test(rt.textContent), label + ': дата последней ошибки — из верной записи');
  };

  const t = open('teacher.html', RAW);
  await flush();
  cabinet(t.d, 'кабинет, сырое хранилище с 1e400');
  ok(!t.errs().length, 'кабинет, сырое хранилище: без исключений: ' + t.errs().join(' | '));

  const r = open('review.html', RAW);
  const body = vis(r.d.body);
  ok(!/Infinity/.test(body) && !BAD.test(body), 'журнал, сырое хранилище: нет Infinity/NaN: ' + (body.match(/Infinity|NaN/) || [''])[0]);
  ok(reviewOpen(r.d) === 1 && reviewClosed(r.d) === 0, 'журнал, сырое хранилище: к повтору ровно 1: ' + reviewOpen(r.d) + '/' + reviewClosed(r.d));
  const row = r.d.querySelector('#openList .row');
  ok(!!row && /промахов: 2 ·/.test(row.textContent) && row.querySelectorAll('.closedbar span.on').length === 1,
     'журнал, сырое хранилище: промахов 2, закрыто 1 клетка из 3 (r = 1.2 → 1)');
  ok(!r.errs().length, 'журнал, сырое хранилище: без исключений: ' + r.errs().join(' | '));

  const i = open('index.html', RAW);
  const txt = i.d.querySelector('[data-progress="review"]').textContent;
  ok(/^к повтору: 1 · закрыто: 0$/.test(txt), 'главная, сырое хранилище: «к повтору: 1 · закрыто: 0»: ' + txt);

  /* код с 1e400: просмотр и загрузка */
  const L = open('teacher.html', { own: 1 });
  await flush();
  L.d.getElementById('inBox').value = rawCode(RAW);
  click(L.w, L.d.getElementById('showBtn'));
  await flush();
  ok(/Показан прогресс из вставленного кода/.test(L.d.getElementById('sourceLine').textContent), 'код с 1e400: просмотр включён');
  cabinet(L.d, 'кабинет, просмотр кода с 1e400');
  ok(/пропущено: 3\./.test(L.d.getElementById('inStatus').textContent), 'код с 1e400, просмотр: «пропущено: 3»: ' + L.d.getElementById('inStatus').textContent);
  click(L.w, L.d.getElementById('loadBtn'));
  await flush();
  const got = JSON.parse(L.w.localStorage.getItem(KEY));
  ok(JSON.stringify(Object.keys(got.mistakes)) === '["righttri-t1|t5-seg30"]' && got.mistakes['righttri-t1|t5-seg30'].w === 2.7,
     'код с 1e400, загрузка: осталась одна верная запись, как в коде: ' + JSON.stringify(got.mistakes));
  ok(/отброшено: 3\./.test(L.d.getElementById('inStatus').textContent), 'код с 1e400, загрузка: «отброшено: 3»: ' + L.d.getElementById('inStatus').textContent);
  cabinet(L.d, 'кабинет после загрузки кода с 1e400');
  ok(!L.errs().length, 'код с 1e400: без исключений: ' + L.errs().join(' | '));

  /* прямые вызовы: значения, которые в JSON не записать */
  const RV = t.w.RV;
  for (const [name, e] of [
    ['w = Infinity', { w: Infinity, r: 0 }], ['w = -Infinity', { w: -Infinity, r: 0 }], ['w = NaN', { w: NaN, r: 0 }],
    ['r = Infinity', { w: 1, r: Infinity }], ['r = NaN', { w: 1, r: NaN }],
    ['lastWrong = Infinity', { w: 1, r: 0, lastWrong: Infinity }], ['last = NaN', { w: 1, r: 0, last: NaN }],
    ['last > 8.64e15', { w: 1, r: 0, last: 8.64e15 + 1 }]
  ]) ok(RV.entry(e) === null, 'RV.entry: ' + name + ' — мусор: ' + JSON.stringify(RV.entry(e)));
  const n1 = RV.entry({ w: 2.7, r: 1.2, lastWrong: T0 });
  ok(!!n1 && n1.w === 2 && n1.r === 1 && n1.lastWrong === T0 && n1.last === 0, 'RV.entry: w 2.7 → 2, r 1.2 → 1: ' + JSON.stringify(n1));
  const n2 = RV.entry({ w: 0.5, r: 3.9 });
  ok(!!n2 && n2.w === 0 && n2.r === 3, 'RV.entry: w 0.5 → 0, r 3.9 → 3: ' + JSON.stringify(n2));
  const mk = { 'righttri-t1|a': { w: Infinity, r: 0 }, 'righttri-t1|b': { w: 3.9, r: 2.99 }, 'righttri-t1|c': { w: 1.5, r: 3.1 },
               'righttri-t1|d': { w: 0.9, r: 0 }, 'righttri-t1|e': { w: 1, r: Infinity } };
  const op = RV.open(mk), cl = RV.closed(mk);
  ok(op.length === 1 && op[0].key === 'righttri-t1|b' && op[0].w === 3 && op[0].r === 2,
     'RV.open: Infinity пропущены, w 3.9 → 3, r 2.99 → 2 (ещё открыта): ' + JSON.stringify(op));
  ok(cl.length === 1 && cl[0].key === 'righttri-t1|c' && cl[0].w === 1 && cl[0].r === 3,
     'RV.closed: w 1.5 → 1, r 3.1 → 3 (закрыта); w 0.9 → 0 — не в журнале: ' + JSON.stringify(cl));
  ok(RV.lastActivity({ 'righttri-t1|a': { w: 1, r: 0, lastWrong: Infinity }, 'righttri-t1|b': { w: 1, last: T0 } }, 'righttri-t1') === T0,
     'RV.lastActivity: метка Infinity не в счёт');
}

/* ================= 5. Верх кода — не объект: отказ, ничего не записано ================= */
{
  const OWN = { 'numbers-t19': { passed: true, tasks: {} } };
  const t = open('teacher.html', OWN);
  await flush();
  const d = t.d;
  const codes = {
    'null': rawCode('null'),
    'массив': await t.w.PROGRESS_CODE.encode([1, 2]),
    'строка': await t.w.PROGRESS_CODE.encode('<img src=x onerror="window.__xss=1">'),
    'число': await t.w.PROGRESS_CODE.encode(42),
    'true': await t.w.PROGRESS_CODE.encode(true)
  };
  for (const [name, code] of Object.entries(codes)){
    for (const btn of ['showBtn', 'loadBtn']){
      d.getElementById('inBox').value = code;
      click(t.w, d.getElementById(btn));
      await flush();
      const st = d.getElementById('inStatus');
      ok(/bad/.test(st.className) && /не объект прогресса/.test(st.textContent), 'код-«' + name + '» (' + btn + '): понятный отказ: ' + st.textContent);
      ok(/Показан прогресс этого браузера/.test(d.getElementById('sourceLine').textContent), 'код-«' + name + '» (' + btn + '): сводка своя');
    }
  }
  ok(JSON.stringify(JSON.parse(t.w.localStorage.getItem(KEY))) === JSON.stringify(OWN), 'не-объект: прогресс браузера не тронут');
  ok(t.w.localStorage.getItem(BACKUP) === null, 'не-объект: резервная копия не создана');
  safe(t.w, 'кабинет, код-не-объект');

  /* loadInto() и сам отказывает не-объекту */
  for (const v of [null, [1], 'x', 7]){
    let msg = '';
    try { t.w.PROGRESS_CODE.loadInto(v); } catch (e) { msg = e.message; }
    ok(/не объект прогресса/.test(msg), 'loadInto(' + JSON.stringify(v) + '): отказ с сообщением: ' + msg);
  }
  ok(JSON.stringify(JSON.parse(t.w.localStorage.getItem(KEY))) === JSON.stringify(OWN) && t.w.localStorage.getItem(BACKUP) === null,
     'loadInto(не-объект): ничего не записано');
  ok(!t.errs().length, 'кабинет, код-не-объект: без исключений: ' + t.errs().join(' | '));
}

/* ================= 6. Мусор в имени ученика и в пробнике ================= */
{
  for (const st of ['x', [1], { name: { a: 1 } }, { name: 5 }, { name: null }, null]){
    const t = open('teacher.html', { student: st });
    await flush();
    const line = t.d.getElementById('sourceLine').textContent;
    ok(!/Ученик/.test(line) && !BAD.test(line) && !/null/.test(line), 'кабинет, student=' + JSON.stringify(st) + ': имени нет, мусора нет: ' + line);
    ok(!t.errs().length, 'кабинет, student=' + JSON.stringify(st) + ': без исключений');
  }

  /* попытки, которые не признаёт страница пробника (нет числового ts) или
     главная (primary/test не числа), и попытки без lines — мусор */
  const JUNK_AT = [
    null, 'zz', [1], 7, { lines: 'zz' }, { lines: {} },
    { ts: 'x', primary: 'x', test: null, lines: { 1: 0 } },                  /* пример из ревью */
    { ts: 'x', primary: 12, test: 60, lines: {} },                           /* ts не число — full-exam отбрасывает */
    { ts: T0 + DAY, primary: 'x', test: 50, lines: {} },                     /* primary не число — главная пропускает */
    { ts: T0 + DAY, primary: 12, test: null, lines: {} },                    /* test не число */
    { ts: T0 + DAY, primary: 12, test: 60, lines: 'zz' },                    /* без разбора по линиям */
    { ts: 1e300, primary: 12, test: 60, lines: {} },                         /* ts вне Date — было бы Invalid Date */
    { ts: -9e15, primary: 12, test: 60, lines: {} },                         /* то же в минус */
    { ts: Infinity, primary: 12, test: 60, lines: {} },                      /* в JSON — null */
    { ts: T0 + DAY, primary: PAY, test: PAY2, lines: { 1: PAY } }
  ];
  const FE = [
    'zz', { attempts: 'zz' }, { attempts: [null] }, { attempts: [{ lines: 'zz' }] }, { attempts: { length: 1, 0: { lines: {} } } },
    { attempts: JUNK_AT }
  ].concat(JUNK_AT.map(a => ({ attempts: [a] })));
  FE.forEach((fe, n) => {
    const r = open('review.html', { 'full-exam': fe });
    ok(!r.errs().length, 'журнал, пробник-мусор №' + n + ': без исключений: ' + r.errs().join(' | '));
    ok(!BAD.test(vis(r.d.body)), 'журнал, пробник-мусор №' + n + ': без NaN/undefined/Invalid Date');
    ok(r.d.getElementById('examCard').style.display !== 'block' && !r.d.querySelector('#examList .row'),
       'журнал, пробник-мусор №' + n + ': блок потерь не показан: ' + r.d.getElementById('examMeta').textContent);
    safe(r.w, 'журнал, пробник-мусор №' + n);
  });

  /* верная попытка, за ней мусор: показана верная — как на главной */
  const GOOD = { ts: T0, seed: 7, spent: 600, primary: 10, test: 56,
                 lines: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 0, 11: 1, 12: 1, 13: 2, 14: 0, 15: 2, 16: 2, 17: 0, 18: 0, 19: 0 } };
  const GOOD_META = 'попытка от 17.02.2026 · 10 перв. · 56 тест.';
  const GOOD_LOST = ['10', '14', '17', '18', '19'];
  const examRows = d => Array.from(d.querySelectorAll('#examList .row')).map(x => x.querySelector('.pillline').textContent.replace('задание ', ''));
  const tails = [[JUNK_AT[6]], JUNK_AT].concat(JUNK_AT.map(a => [a]));
  let mainChecked = 0;
  tails.forEach((tail, n) => {
    const store = { 'full-exam': { attempts: [GOOD].concat(tail) } };
    const r = open('review.html', store);
    const meta = r.d.getElementById('examMeta').textContent;
    ok(r.d.getElementById('examCard').style.display === 'block' && meta === GOOD_META,
       'пробник: верная попытка, за ней мусор №' + n + ' — показана верная: ' + meta);
    ok(JSON.stringify(examRows(r.d)) === JSON.stringify(GOOD_LOST), 'пробник: мусор №' + n + ' — потери верной попытки: ' + examRows(r.d).join(','));
    ok(!BAD.test(vis(r.d.body)) && !r.errs().length, 'пробник: мусор №' + n + ' — без NaN/Invalid Date и исключений');
    safe(r.w, 'пробник, верная + мусор №' + n);
    /* главная не смотрит на ts: сверяем там, где мусор без числовых баллов */
    if (tail.every(a => !(a && typeof a === 'object' && Number.isFinite(a.primary) && Number.isFinite(a.test)))){
      mainChecked++;
      const i = open('index.html', store);
      const txt = i.d.querySelector('[data-progress="fullexam"]').textContent;
      ok(/^последний: 10 перв\. · 56 тест\./.test(txt), 'главная: та же попытка, что в журнале (мусор №' + n + '): ' + txt);
    }
  });
  ok(mainChecked >= 10,'пробник: сверка с главной проведена на ' + mainChecked + ' наборах');

  /* более новая верная попытка вытесняет старую */
  const NEWER = { ts: T0 + DAY, primary: 20, test: 70, lines: Object.assign({}, GOOD.lines, { 10: 1, 14: 3, 17: 3, 18: 4 }) };
  let r = open('review.html', { 'full-exam': { attempts: [GOOD, NEWER, JUNK_AT[6]] } });
  ok(r.d.getElementById('examMeta').textContent === 'попытка от 18.02.2026 · 20 перв. · 70 тест.' && JSON.stringify(examRows(r.d)) === '["19"]',
     'пробник: из двух верных — более новая: ' + r.d.getElementById('examMeta').textContent + ' / ' + examRows(r.d).join(','));

  /* верная попытка с мусором в баллах линий: мусор — ноль */
  r = open('review.html', { 'full-exam': { attempts: [{ ts: T0, primary: 3, test: 20, lines: { 1: '', 2: [0], 3: 'x', 4: PAY, 5: -1, 6: 1, 7: null } }] } });
  const rows = Array.from(r.d.querySelectorAll('#examList .row')).map(x => x.querySelector('.name').textContent);
  ok(rows.length === 18 && rows.every(x => /^0 из [1-4] балл/.test(x)), 'пробник: мусорные баллы линий считаются нулём, линия 6 с 1 баллом не в потерях: ' + rows.length);
  ok(r.d.getElementById('examMeta').textContent === 'попытка от 17.02.2026 · 3 перв. · 20 тест.', 'пробник: дата и баллы верной попытки: ' + r.d.getElementById('examMeta').textContent);
  safe(r.w, 'пробник, мусор в lines');

  /* отрицательные баллы — ноль, как на главной; дробный первичный — целый */
  r = open('review.html', { 'full-exam': { attempts: [{ ts: T0, primary: -3, test: -1, lines: {} }] } });
  ok(r.d.getElementById('examMeta').textContent === 'попытка от 17.02.2026 · 0 перв. · 0 тест.' && r.d.querySelectorAll('#examList .row').length === 19,
     'пробник: отрицательные баллы — 0, все 19 линий в потерях: ' + r.d.getElementById('examMeta').textContent);
  r = open('review.html', { 'full-exam': { attempts: [{ ts: T0, primary: 7.8, test: 44, lines: {} }] } });
  ok(r.d.getElementById('examMeta').textContent === 'попытка от 17.02.2026 · 7 перв. · 44 тест.', 'пробник: первичный 7.8 → 7, как на главной: ' + r.d.getElementById('examMeta').textContent);
  /* ts < 0 — число в пределах Date: full-exam.html такую попытку признаёт, журнал тоже */
  r = open('review.html', { 'full-exam': { attempts: [GOOD, { ts: -DAY, primary: 12, test: 60, lines: {} }] } });
  ok(r.d.getElementById('examMeta').textContent === 'попытка от ' + new Date(-DAY).toLocaleDateString('ru-RU') + ' · 12 перв. · 60 тест.',
     'пробник: ts < 0 в пределах Date — попытка признана: ' + r.d.getElementById('examMeta').textContent);
}

/* ================= 7. esc() реестра ================= */
{
  const t = open('teacher.html');
  await flush();
  const esc = t.w.RV.esc;
  ok(esc('<a href="x">&\'') === '&lt;a href=&quot;x&quot;&gt;&amp;&#39;', 'RV.esc экранирует & < > " \'');
  ok(esc(null) === '' && esc(undefined) === '' && esc(3) === '3', 'RV.esc: null/undefined — пустая строка, число — как есть');
}

/* ================= 8. Одно правило записи журнала: registry.js и главная ================= */
/* Правило «запись журнала годна» написано дважды: entry()/keyOk() в
   registry.js (журнал, кабинет, загрузка) и адаптер review в
   progress-adapters.js (счётчик на главной, registry.js там не подключён).
   Обе стороны сверяются с третьим, независимым пересчётом по спецификации
   на сгенерированных записях — верных и мусорных. Хранилище подаётся
   снимком (snapshotStore), а не строкой: Infinity, NaN и -0 доходят как есть. */
{
  const t = open('teacher.html');
  await flush();
  const RV = t.w.RV, PR = t.w.PROGRESS, d = t.d;

  /* независимый пересчёт: 'junk' | 'zero' (верная, w < 1) | 'open' | 'closed' */
  const fin = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  /* ключ «TID|тип»: до первой черты и после неё — не пусто */
  const keyGood = k => { const i = k.indexOf('|'); return i >= 1 && i <= k.length - 2; };
  /* сама запись: мусор или нет */
  function entryGood(e){
    if (e === null || typeof e !== 'object' || Array.isArray(e)) return false;
    if (!fin(e.w)) return false;
    if (e.r !== undefined && !fin(e.r)) return false;
    for (const s of ['lastWrong', 'last']) if (e[s] !== undefined && !(fin(e[s]) && e[s] <= 8.64e15)) return false;
    return true;
  }
  const wOf = e => Math.trunc(e.w), rOf = e => e.r === undefined ? 0 : Math.trunc(e.r);
  function oracle(k, e){
    if (!keyGood(k) || !entryGood(e)) return 'junk';
    if (wOf(e) < 1) return 'zero';
    return rOf(e) >= 3 ? 'closed' : 'open';
  }
  /* счёт адаптера главной: { open, closed } или null, если подпись непонятна */
  function adapter(mk){
    const root = d.createElement('div');
    root.innerHTML = '<div data-progress="review"></div>';
    PR.apply(root, PR.snapshotStore({ mistakes: mk }));
    const host = root.querySelector('[data-progress="review"]');
    if (!host) return null;                                /* адаптер упал — apply() убрал узел */
    const txt = host.textContent, full = host.querySelectorAll('.cellsbar span.filled').length;
    if (txt === 'журнал пуст') return { open: 0, closed: 0 };
    if (txt === 'все ошибки закрыты ✓') return { open: 0, closed: full === 10 ? 'all' : NaN };
    const m = txt.match(/^к повтору: (\d+) · закрыто: (\d+)$/);
    return m ? { open: +m[1], closed: +m[2] } : null;
  }
  function registry(mk){ return { open: RV.open(mk).length, closed: RV.closed(mk).length }; }
  const same = (a, b) => !!a && !!b && a.open === b.open && (a.closed === b.closed || (a.closed === 'all' && b.open === 0 && b.closed > 0));

  /* детерминированный генератор (mulberry32) */
  let seed = 20260926;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const NONE = Symbol('нет поля');
  const COUNTS = [0, 1, 1, 2, 2, 3, 3, 4, 7, 0.5, 0.99, 1.5, 2.7, 2.99, 3.5, -0, -1, -0.5, NaN, Infinity, -Infinity, 1e300,
                  '1', '3', '', null, true, false, [], [3], {}, NONE, NONE, NONE];
  const STAMPS = [T0, T0, 0, 1.5, 8.64e15, 8.64e15 + 1, -1, -0, 1e300, Infinity, NaN, 'x', '' + T0, null, [T0], NONE, NONE, NONE];
  /* ключи: три четверти — вида «TID|тип», остальное — без TID, без типа, без черты */
  const KEYS = i => rnd() < 0.75
    ? pick(['righttri-t1|t' + i, 'x' + i + '|y', 'constructor|c' + i, '__proto__|p' + i, 'a' + i + '|b|c', 'x|' + PAY + i])
    : pick(['junk' + i, '|t' + i, 'tid' + i + '|', '|']);
  /* поле: чаще — из правдоподобных значений, иначе — из всего набора */
  const FIELDS = [['w', 0.75, [0, 0.5, 1, 2, 3, 5]], ['r', 0.75, [0, 1, 2, 2.5, 3, 4, NONE]],
                  ['lastWrong', 0.85, [T0, 0, NONE]], ['last', 0.85, [T0, 0, NONE]]];
  function record(){
    if (rnd() < 0.12) return pick([null, 'x', [1, 2], 7, true, undefined, {}, [{ w: 1 }]]);
    const e = {};
    for (const [f, p, good] of FIELDS){
      const v = rnd() < p ? pick(good) : pick(f === 'w' || f === 'r' ? COUNTS : STAMPS);
      if (v !== NONE) e[f] = v;
    }
    return e;
  }

  const tally = { junk: 0, zero: 0, open: 0, closed: 0 };
  const bad = [];
  const show = (k, e) => k + ' → ' + (e && typeof e === 'object' && !Array.isArray(e)
    ? '{' + Object.keys(e).map(f => f + ':' + (typeof e[f] === 'string' ? JSON.stringify(e[f]) : Object.is(e[f], -0) ? '-0' : String(e[f]))).join(',') + '}'
    : String(e));

  /* а) 400 журналов из одной записи: вердикт каждой стороны — по записи */
  const SINGLE = 400;
  for (let n = 0; n < SINGLE; n++){
    const k = KEYS(n), e = record(), mk = {};
    mk[k] = e;
    const want = oracle(k, e);
    tally[want]++;
    const exp = { open: want === 'open' ? 1 : 0, closed: want === 'closed' ? 1 : 0 };
    const reg = registry(mk), ad = adapter(mk);
    const ent = RV.entry(e);
    const entOk = entryGood(e) ? (!!ent && ent.w === wOf(e) && ent.r === rOf(e)) : ent === null;
    const kept = Object.keys(RV.cleanJournal({ mistakes: mk }).obj.mistakes || {}).length;
    if (!same(reg, exp)) bad.push('registry ' + JSON.stringify(reg) + ' ≠ ' + want + ': ' + show(k, e));
    if (!same(ad, exp)) bad.push('главная ' + JSON.stringify(ad) + ' ≠ ' + want + ': ' + show(k, e));
    if (!entOk) bad.push('RV.entry ' + JSON.stringify(ent) + ' ≠ ' + want + ': ' + show(k, e));
    if (kept !== (want === 'junk' ? 0 : 1)) bad.push('cleanJournal оставил ' + kept + ' при ' + want + ': ' + show(k, e));
  }

  /* б) 120 журналов из 2–8 записей: счёт целиком */
  let multi = 0;
  for (let n = 0; n < 120; n++){
    const mk = {}, cnt = 2 + Math.floor(rnd() * 7), exp = { open: 0, closed: 0 };
    for (let j = 0; j < cnt; j++){
      const k = KEYS(1000 + n * 10 + j), e = record();
      if (Object.prototype.hasOwnProperty.call(mk, k)) continue;
      mk[k] = e;
      const want = oracle(k, e);
      if (want === 'open') exp.open++;
      if (want === 'closed') exp.closed++;
      multi++;
    }
    const reg = registry(mk), ad = adapter(mk);
    if (!same(reg, exp)) bad.push('registry, журнал №' + n + ': ' + JSON.stringify(reg) + ' ≠ ' + JSON.stringify(exp));
    if (!same(ad, exp)) bad.push('главная, журнал №' + n + ': ' + JSON.stringify(ad) + ' ≠ ' + JSON.stringify(exp));
  }

  /* в) унаследованные записи не в счёт ни у одной стороны */
  const proto = Object.create({ 'righttri-t1|p': { w: 2, r: 0 }, 'righttri-t1|q': { w: 1, r: 3 } });
  proto['righttri-t1|own'] = { w: 1, r: 0 };
  const pe = { open: 1, closed: 0 };
  if (!same(registry(proto), pe)) bad.push('registry считает унаследованные: ' + JSON.stringify(registry(proto)));
  if (!same(adapter(proto), pe)) bad.push('главная считает унаследованные: ' + JSON.stringify(adapter(proto)));

  ok(!bad.length, 'одно правило записи: registry.js = главная = пересчёт по спецификации на ' + SINGLE + ' + ' + multi +
     ' записях; расхождений ' + bad.length + (bad.length ? ': ' + bad.slice(0, 4).join(' || ') : ''));
  ok(tally.junk >= 60 && tally.zero >= 20 && tally.open >= 40 && tally.closed >= 20,
     'в наборе есть все виды записей (мусор, w < 1, открытые, закрытые): ' + JSON.stringify(tally));
  console.log('Одно правило записи: ' + SINGLE + ' одиночных записей ' + JSON.stringify(tally) + ' и ' + multi + ' записей в 120 журналах; расхождений: ' + bad.length);
  ok(!t.errs().length, 'одно правило записи: без исключений: ' + t.errs().join(' | '));
}

/* ================= 9. Кабинет: «← Курс» на касании не ниже 44 px ================= */
/* jsdom раскладку не считает: проверяется правило CSS (размер меряет
   браузерный смоук). Образец — review.html. */
{
  const fs = require('fs'), pth = require('path'), ROOT = require('./boot.js').ROOT;
  const css = f => (fs.readFileSync(pth.join(ROOT, f), 'utf8').match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  const coarse = s => { const m = s.match(/@media\s*\(pointer:\s*coarse\)\s*\{([\s\S]*?\})\s*\}/); return m ? m[1] : ''; };
  const tc = css('teacher.html');
  ok(/\.back\s*\{[^}]*display:\s*inline-flex[^}]*min-height:\s*44px/.test(coarse(tc)), 'кабинет: на касании «← Курс» — inline-flex и min-height 44px');
  ok(/\.skip:focus\s*\{[^}]*min-height:\s*44px/.test(tc), 'кабинет: «Перейти к сводке» в фокусе — min-height 44px');
  ok(/\n\s*\.btn\s*\{[^}]*min-height:\s*44px/.test(tc), 'кабинет: .btn — min-height 44px');
}

ok(errors.length === 0, 'нет JS-ошибок: ' + errors.join(' | '));
console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (fails || errors.length){ process.exit(1); }
console.log('CABINET_SAFETY_OK');

}

run().catch(e => { console.log('СБОЙ:', e && e.stack || e); process.exit(1); });
