/* Проверка кабинета учителя: сводка, код прогресса, загрузка и резервная
   копия (jsdom). Стиль тот же, что в site-test.js. */
const zlib = require('zlib');
const { makeBoot } = require('./boot.js');

let fails = 0, checks = 0;
function ok(cond, msg){ checks++; if (!cond){ fails++; console.log('FAIL:', msg); } }

const errors = [];
const boot = makeBoot(errors);
const KEY = 'mathExamCourseProgress.v1';
const BACKUP = KEY + '.backup';

/* Дать промисам страницы отработать. */
const flush = (n = 6) => new Promise(res => {
  let i = 0;
  (function tick(){ i++ < n ? setImmediate(tick) : res(); })();
});
function click(w, el){ el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); }

/* Node 18 знает CompressionStream, но не формат deflate-raw. Подменяем его
   заглушкой на zlib, чтобы проверить и сжатую ветку кода. */
function streamShim(win){
  function Shim(transform){
    const chunks = [];
    let finish;
    const closed = new Promise(r => { finish = r; });
    let sent = false;
    this.writable = { getWriter: () => ({
      write(bytes){ chunks.push(Buffer.from(bytes)); return Promise.resolve(); },
      close(){ finish(); return Promise.resolve(); }
    })};
    this.readable = { getReader: () => ({
      read(){
        if (sent) return Promise.resolve({ done: true, value: undefined });
        return closed.then(() => {
          sent = true;
          return { done: false, value: new Uint8Array(transform(Buffer.concat(chunks))) };
        });
      }
    })};
  }
  win.CompressionStream = function(fmt){
    if (fmt !== 'deflate-raw') throw new Error('формат ' + fmt + ' не поддержан заглушкой');
    return new Shim(zlib.deflateRawSync);
  };
  win.DecompressionStream = function(fmt){
    if (fmt !== 'deflate-raw') throw new Error('формат ' + fmt + ' не поддержан заглушкой');
    return new Shim(zlib.inflateRawSync);
  };
}

/* Сид: все три новых тренажёра плюс журнал ошибок. */
const DAY = 86400000;
const T0 = Date.UTC(2026, 1, 17, 9, 0, 0);
const SEED = {
  'righttri-t1': { topics: {
    1: { steps: 4, solved: 7, correct: 5, streak: 2, best: 4 },
    3: { steps: 0, solved: 2, correct: 1, streak: 1, best: 1 }
  }, board: false },
  'ege-t1-yashchenko': { types: {
    t8:  { best: 3, solved: 4, correct: 3, streak: 3 },
    t13: { best: 3, solved: 3, correct: 3, streak: 3 },
    t1:  { best: 1, solved: 2, correct: 1, streak: 1 }
  }, runs: 1, best: 8, passed: false, board: false },
  'ege-t2-yashchenko': { types: {
    v1: { best: 3, solved: 5, correct: 4, streak: 3 },
    v6: { best: 3, solved: 4, correct: 3, streak: 3 },
    v2: { best: 1, solved: 2, correct: 1, streak: 1 }
  }, runs: 2, best: 6, passed: false, board: false },
  mistakes: {
    'righttri-t1|t5-seg30':      { w: 2, r: 1, lastWrong: T0,           last: T0 },
    'righttri-t1|t2-altFromSegs':{ w: 1, r: 3, lastWrong: T0 - DAY,     last: T0 - DAY },
    'ege-t1-yashchenko|t8':      { w: 3, r: 0, lastWrong: T0 - 2 * DAY, last: T0 - 2 * DAY },
    'ege-t2-yashchenko|v6':      { w: 1, r: 3, lastWrong: T0 - 3 * DAY, last: T0 - 3 * DAY }
  }
};
const seedFull = win => win.localStorage.setItem(KEY, JSON.stringify(SEED));

async function run(){

/* ================= 1. Сводка по своему браузеру ================= */
{
  const w = boot('teacher.html', seedFull);
  const d = w.document;
  await flush();

  ok(/Показан прогресс этого браузера/.test(d.getElementById('sourceLine').textContent),
     'сводка помечена как своя');

  const rows = Array.from(d.querySelectorAll('#cards .trow'));
  ok(rows.length === w.RV.CABINET.length, 'карточка на каждый TID реестра: ' + rows.length);

  function rowOf(tid){ return rows.find(r => r.querySelector('.tid').textContent === tid); }

  const rt = rowOf('righttri-t1');
  ok(!!rt && /Прямоугольный треугольник/.test(rt.textContent), 'карточка прямоугольного треугольника');
  ok(/чистые серии: 4 из 15/.test(rt.querySelector('.progress').textContent),
     'righttri: главная метрика из адаптера: ' + rt.querySelector('.progress').textContent);
  ok(/17\.02\.2026/.test(rt.textContent), 'righttri: дата последней ошибки из журнала');
  ok(/отрезки гипотенузы при угле 30°/.test(rt.textContent), 'righttri: имя открытого типа из NAMES');
  ok(/высота по отрезкам гипотенузы/.test(rt.textContent), 'righttri: имя закрытого типа');
  ok(rt.querySelectorAll('.types li.open').length === 1 && rt.querySelectorAll('.types li.shut').length === 1,
     'righttri: один открытый и один закрытый тип');

  const p1 = rowOf('ege-t1-yashchenko');
  ok(/типов закрыто: 2 из 19/.test(p1.querySelector('.progress').textContent) &&
     /зачёт: 8 из 10/.test(p1.querySelector('.progress').textContent),
     'планиметрия: метрика и зачёт: ' + p1.querySelector('.progress').textContent);
  ok(/высота, биссектриса и медиана из прямого угла/.test(p1.textContent), 'планиметрия: имя типа из NAMES');
  ok(/задание 1/.test(p1.textContent), 'планиметрия: пилюля линии');

  const v2 = rowOf('ege-t2-yashchenko');
  ok(/типов закрыто: 2 из 7/.test(v2.querySelector('.progress').textContent) &&
     /зачёт: 6 из 7/.test(v2.querySelector('.progress').textContent),
     'векторы: метрика и зачёт: ' + v2.querySelector('.progress').textContent);
  ok(/клетчатая бумага: скалярное произведение/.test(v2.textContent), 'векторы: имя типа из NAMES');
  ok(v2.querySelectorAll('.types li.shut').length === 1, 'векторы: тип закрыт');

  const empty = rowOf('numbers-t19');
  ok(/не начат/.test(empty.querySelector('.progress').textContent), 'нетронутый тренажёр — «не начат»');
  ok(/записей нет/.test(empty.textContent) && /В журнале ошибок по этому тренажёру пусто/.test(empty.textContent),
     'нетронутый тренажёр — пустой журнал без мусора');
  ok(!/undefined|NaN|\[object/.test(d.getElementById('cards').innerHTML), 'в сводке нет мусора');
}

/* ================= 2. Код прогресса: туда и обратно ================= */
for (const [label, seedStreams] of [['без сжатия', false], ['через deflate-raw', true]]){
  const w = boot('teacher.html', win => { seedFull(win); if (seedStreams) streamShim(win); });
  const d = w.document;
  await flush();

  ok(w.PROGRESS_CODE.hasCompression() === seedStreams, label + ': ветка сжатия выбрана верно');

  click(w, d.querySelector('#myCode #codeBtn'));
  await flush(10);

  const code = d.querySelector('#myCode .codebox').value;
  ok(code.slice(0, 5) === 'MEP1.', label + ': код начинается с MEP1.');
  ok(/^MEP1\.[A-Za-z0-9\-_]+$/.test(code), label + ': код — base64url без посторонних символов');
  ok(/длина: \d+ симв\./.test(d.querySelector('#myCode .codelen').textContent), label + ': показана длина');
  ok(!!d.querySelector('#myCode .qr svg'), label + ': QR-код нарисован');

  const back = await w.PROGRESS_CODE.decode(code);
  ok(JSON.stringify(back) === JSON.stringify(SEED), label + ': декодирование даёт исходный объект');

  if (seedStreams){
    const plain = await boot('teacher.html', seedFull).PROGRESS_CODE.encode(SEED);
    ok(plain.length > code.length, 'сжатый код короче несжатого: ' + code.length + ' против ' + plain.length);
    const cross = await w.PROGRESS_CODE.decode(plain);
    ok(JSON.stringify(cross) === JSON.stringify(SEED), 'браузер со сжатием читает несжатый код');
  }
}

/* Код, собранный со сжатием, в браузере без DecompressionStream — понятный отказ. */
{
  const withStreams = boot('teacher.html', win => { seedFull(win); streamShim(win); });
  await flush();
  const code = await withStreams.PROGRESS_CODE.encode(SEED);

  const plain = boot('teacher.html', seedFull);
  await flush();
  let msg = '';
  try{ await plain.PROGRESS_CODE.decode(code); }catch(e){ msg = e.message; }
  ok(/DecompressionStream/.test(msg), 'старый браузер честно говорит, что не умеет распаковывать: ' + msg);
}

/* ================= 3. Битый код не роняет страницу ================= */
{
  const BAD = [
    ['', 'пустая строка'],
    ['   ', 'пробелы'],
    ['просто текст', 'не код'],
    ['MEP1.', 'префикс без тела'],
    ['MEP1.!!!!', 'посторонние символы'],
    ['MEP1.' + Buffer.from([9, 1, 2, 3]).toString('base64url'), 'неизвестная версия'],
    ['MEP1.' + Buffer.concat([Buffer.from([0]), Buffer.from('не json', 'utf8')]).toString('base64url'), 'внутри не JSON'],
    ['MEP1.' + Buffer.concat([Buffer.from([0]), Buffer.from('[1,2,3]', 'utf8')]).toString('base64url'), 'внутри не объект']
  ];
  const w = boot('teacher.html', seedFull);
  const d = w.document;
  await flush();
  const before = w.localStorage.getItem(KEY);

  for (const [code, label] of BAD){
    d.getElementById('inBox').value = code;
    click(w, d.getElementById('showBtn'));
    await flush(8);
    const st = d.getElementById('inStatus');
    ok(st.textContent.length > 10 && /bad/.test(st.className), 'битый код (' + label + '): сообщение об ошибке');
    ok(/Показан прогресс этого браузера/.test(d.getElementById('sourceLine').textContent),
       'битый код (' + label + '): сводка осталась своей');
  }
  ok(w.localStorage.getItem(KEY) === before, 'битый код ничего не записал');
  ok(errors.length === 0, 'битый код не дал исключений: ' + errors.join(' | '));
}

/* ================= 4. Просмотр чужого кода ничего не пишет ================= */
{
  const donor = boot('teacher.html', win => win.localStorage.setItem(KEY, JSON.stringify(SEED)));
  await flush();
  const code = await donor.PROGRESS_CODE.encode(SEED);

  const w = boot('teacher.html');   /* чистый браузер учителя */
  const d = w.document;
  await flush();
  ok(/не начат/.test(d.querySelector('#cards .progress').textContent), 'у учителя своего прогресса нет');

  d.getElementById('inBox').value = code;
  click(w, d.getElementById('showBtn'));
  await flush(8);

  ok(/Показан прогресс из вставленного кода/.test(d.getElementById('sourceLine').textContent), 'режим просмотра включён');
  const rows = Array.from(d.querySelectorAll('#cards .trow'));
  const rt = rows.find(r => r.querySelector('.tid').textContent === 'righttri-t1');
  ok(/чистые серии: 4 из 15/.test(rt.querySelector('.progress').textContent), 'в просмотре видна метрика ученика');
  ok(/отрезки гипотенузы при угле 30°/.test(rt.textContent), 'в просмотре виден журнал ученика');
  ok(w.localStorage.getItem(KEY) === null, 'просмотр не пишет в localStorage');
  ok(w.localStorage.getItem(BACKUP) === null, 'просмотр не делает резервную копию');

  ok(!d.getElementById('mineBtn').hidden, 'появилась кнопка возврата к своему браузеру');
  click(w, d.getElementById('mineBtn'));
  await flush();
  ok(/Показан прогресс этого браузера/.test(d.getElementById('sourceLine').textContent), 'возврат к своей сводке');
}

/* ================= 5. Загрузка в этот браузер и резервная копия ============ */
{
  const donor = boot('teacher.html');
  await flush();
  const code = await donor.PROGRESS_CODE.encode(SEED);

  const OWN = { 'numbers-t19': { passed: true, tasks: {} } };
  const w = boot('teacher.html', win => {
    win.localStorage.setItem(KEY, JSON.stringify(OWN));
    win.confirm = () => true;
  });
  const d = w.document;
  await flush();

  ok(d.getElementById('restoreBtn').hidden, 'до загрузки кнопки возврата нет');
  ok(d.getElementById('mineBtn').hidden, 'кнопка возврата к своему браузеру скрыта до просмотра чужого кода');
  /* .btn задаёт display, поэтому без явного правила hidden не сработает.
     Каскад с !important jsdom не считает — проверяем само правило. */
  ok(/\[hidden\]\s*\{\s*display:\s*none\s*!important\s*\}/.test(require('fs').readFileSync(
       require('path').join(require('./boot.js').ROOT, 'teacher.html'), 'utf8')),
     'в стилях есть [hidden]{display:none !important}');

  d.getElementById('inBox').value = code;
  click(w, d.getElementById('loadBtn'));
  await flush(8);

  ok(JSON.stringify(JSON.parse(w.localStorage.getItem(KEY))) === JSON.stringify(SEED), 'прогресс записан в ключ');
  ok(JSON.stringify(JSON.parse(w.localStorage.getItem(BACKUP))) === JSON.stringify(OWN), 'прежний прогресс ушёл в .backup');
  ok(/Прогресс загружен/.test(d.getElementById('inStatus').textContent), 'сообщение о загрузке');
  ok(!d.getElementById('restoreBtn').hidden, 'кнопка возврата появилась');
  const rt = Array.from(d.querySelectorAll('#cards .trow')).find(r => r.querySelector('.tid').textContent === 'righttri-t1');
  ok(/чистые серии: 4 из 15/.test(rt.querySelector('.progress').textContent), 'сводка перечиталась из localStorage');

  click(w, d.getElementById('restoreBtn'));
  await flush(4);
  ok(JSON.stringify(JSON.parse(w.localStorage.getItem(KEY))) === JSON.stringify(OWN), 'возврат из резервной копии');

  /* отказ в confirm ничего не меняет */
  w.confirm = () => false;
  d.getElementById('inBox').value = code;
  click(w, d.getElementById('loadBtn'));
  await flush(6);
  ok(JSON.stringify(JSON.parse(w.localStorage.getItem(KEY))) === JSON.stringify(OWN), 'отказ в confirm — записи нет');
}

/* Загрузка в браузер, где ключа ещё не было: резервная копия — пустой объект. */
{
  const donor = boot('teacher.html');
  await flush();
  const code = await donor.PROGRESS_CODE.encode(SEED);
  const w = boot('teacher.html', win => { win.confirm = () => true; });
  const d = w.document;
  await flush();
  d.getElementById('inBox').value = code;
  click(w, d.getElementById('loadBtn'));
  await flush(8);
  ok(w.localStorage.getItem(BACKUP) === '{}', 'без прежнего прогресса резервная копия — пустой объект');
}

/* ================= 6. Кнопка кода в подвале главной ================= */
{
  const w = boot('index.html', seedFull);
  const d = w.document;
  await flush();
  ok(Array.from(d.querySelectorAll('footer a')).some(a => a.getAttribute('href') === 'teacher.html'),
     'index: ссылка «Кабинет учителя» в подвале');
  const btn = d.querySelector('footer #myCode button.linkbtn');
  ok(!!btn && /Скопировать код прогресса/.test(btn.textContent), 'index: ссылка-кнопка кода прогресса');
  click(w, btn);
  await flush(10);
  const code = d.querySelector('footer .codebox').value;
  ok(/^MEP1\./.test(code), 'index: код собирается в подвале');
  ok(!!d.querySelector('footer .qr svg'), 'index: QR-код нарисован');
  const back = await w.PROGRESS_CODE.decode(code);
  ok(JSON.stringify(back) === JSON.stringify(SEED), 'index: код подвала читается обратно');
}

ok(errors.length === 0, 'нет JS-ошибок: ' + errors.join(' | '));
console.log(`\nПроверок: ${checks}, отказов: ${fails}, JS-ошибок: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join('\n'));
process.exit(fails || errors.length ? 1 : 0);

}

run().catch(e => { console.log('СБОЙ:', e && e.stack || e); process.exit(1); });
