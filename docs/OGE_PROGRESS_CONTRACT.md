# Контракт прогресса курса ОГЭ (v1)

Статус: принят по [ADR 0003](adr/0003-oge-course.md), решение 3. На этот
документ ссылаются все задачи `docs/tasks/OGE_COURSE_*.md`. Он повторяет
контракт курса ЕГЭ (`ege-profil/registry.js`, `ege-profil/progress-adapters.js`)
и добавляет к нему только одно: единое ядро записи тренажёра, чтобы у 25
линий ОГЭ был один адаптер, а не 25.

## 1. Ключ и объект хранилища

- Ключ `localStorage`: `mathExamCourseProgress.v1`. Другие ключи курс не
  заводит. Тренажёр, который хранится под своим ключом, в код прогресса и в
  кабинет не попадает (как `stereo3.status` у ЕГЭ) — для ОГЭ таких быть не
  должно, кроме `mathExamOge2027Analogue1.v2` аналога-2027 (читается
  адаптером только в живом браузере).
- Значение — JSON-объект. Ветка `all[TID]` — запись тренажёра; ветка
  `all.mistakes` — журнал ошибок всех тренажёров; ветка `all["oge-full-exam"]`
  — попытки пробника.
- Чтение: битый JSON, `null`, строка, массив, число — это `{}`; чужие ветки
  никогда не удаляются и не переписываются. Запись — только своей ветки и
  только после свежего чтения ключа (две вкладки не затирают друг друга).

## 2. TID — идентификатор тренажёра

- Существующие TID не переименовываются: `oge-task16-circle`,
  `oge17-chetyrehugolniki`, `oge18-kletki`, `oge23-vychisleniya`,
  `oge24-dokazatelstva`, `oge25-geometriya`, `oge13InequalitiesSeries`
  (уходит в архив вместе с тренажёром), `percentTableTrainer`,
  `practiceTiresTrainer`, `practiceStovesTrainer`, `practiceLandPlotsTrainer`,
  `practiceApartmentsTrainer`, `practiceTariffsTrainer`,
  `practicePaperSheetsTrainer`, `practiceRoadsGridTrainer`,
  `practiceRoadsSchemaTrainer`, `practicePlanReadingTrainer`,
  `practiceRoutesCheckpoint2026`, `practiceEntryDiagnostic2026`.
- Новые TID — `oge-tNN-<slug>`, латиница, без точек:
  `oge-t6-vychisleniya`, `oge-t7-pryamaya`, `oge-t8-stepeni`,
  `oge-t9-uravneniya`, `oge-t10-veroyatnost`, `oge-t11-grafiki`,
  `oge-t12-formuly`, `oge-t13-neravenstva`, `oge-t14-progressii`,
  `oge-t15-treugolniki`, `oge-t19-utverzhdeniya`, `oge-t20-algebra`,
  `oge-t21-tekst`, `oge-t22-grafiki`.
- TID объявляется в тренажёре константой `var TID = "…";` рядом с `KEY`.
  Реестр `oge/registry.js` — единственный список TID курса.

## 3. Ядро записи тренажёра

Каждый тренажёр линий 6–25 держит в `all[TID]` эти поля (остальные — на
своё усмотрение, адаптер их не читает):

```js
all[TID] = {
  v: 1,                    // версия ядра записи; только число
  best: 7,                 // лучший результат зачёта, целое ≥ 0
  total: 10,               // размер зачёта, целое > 0
  passed: true,            // зачёт сдан по порогу тренажёра (не «был запущен»)
  runs: 3,                 // сколько раз зачёт доведён до конца
  solvedByType: {          // верно решённые задачи тренировки по типам
    "insCen": 4,           // ключ — тип из TYPE_IDS, значение — целое ≥ 0
    "tanExt": 1
  },
  updatedAt: 1790000000000 // мс, последняя запись
};
```

Правила счёта:

- `solvedByType[тип]` растёт на 1 за задачу, решённую верно **без показа
  решения**; подсказка и разбор по шагам ничего не отнимают (канон:
  «подсказки ничего не отнимают»). Задача, ответ которой открыт кнопкой
  «Сдаюсь» / «Показать решение», в счёт не идёт.
- `passed` ставится только когда зачёт пройден по порогу тренажёра (у 23 —
  8 из 10; у остальных порог объявляется константой `PASS_AT`), и **не
  снимается** неудачной следующей попыткой. `best` — максимум по попыткам.
- Числа проверяются при чтении: не число, `NaN`, отрицательное — как 0;
  `passed` — только строго `true`.

Линия 1–5 (`practice*Trainer`) ядро не меняет: там `{ solved, total, … }`
в единице «сюжет освоен» (задача `OGE_COURSE_05_LINE_1_5`), адаптер свой.

## 4. Журнал ошибок

- Ключ записи: `"TID|тип"`, где тип ∈ `TYPE_IDS` тренажёра. Обе части
  непустые, в типе нет символа `|`.
- Запись: `{ w, r, lastWrong, last }` — `w` число промахов (≥ 0), `r` число
  верных подряд после последнего промаха, `lastWrong` и `last` — мс.
- Тип открыт при `w > 0 && r < 3`, закрыт при `r >= 3`. Верный ответ по типу,
  у которого записи нет, записи не заводит.
- В журнал пишут и тренировка, и зачёт. Ответ после показа решения в
  журнал не идёт (ни промахом, ни верным).

Помощник записи — в каждый тренажёр вставляется как есть (тренажёр не
подключает общий `.js`, чтобы работать по `file://`):

```js
var TID = "oge-t16-…";                      // из реестра
var KEY = "mathExamCourseProgress.v1";
var TYPE_IDS = ["insCen", "twoDiam", /* … все ключи типов тренажёра */];
var PASS_AT = 8;                            // порог зачёта из N задач
function isObj(o){ return !!o && typeof o === "object" && !Array.isArray(o); }
function num(v){ return (typeof v === "number" && isFinite(v) && v > 0) ? Math.floor(v) : 0; }
function readAll(){
  try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); return isObj(o) ? o : {}; }
  catch (e) { return {}; }
}
/* меняет только свою ветку: читает ключ заново прямо перед записью */
function saveRec(fn){
  try {
    var all = readAll();
    var rec = isObj(all[TID]) ? all[TID] : {};
    if (!isObj(rec.solvedByType)) rec.solvedByType = {};
    rec.v = 1;
    fn(rec);
    rec.updatedAt = Date.now();
    all[TID] = rec;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch (e) {}
}
function solvedOne(type){ saveRec(function(rec){ rec.solvedByType[type] = num(rec.solvedByType[type]) + 1; }); }
function finishQuiz(score, total){
  saveRec(function(rec){
    rec.runs = num(rec.runs) + 1;
    rec.total = total;
    if (score > num(rec.best)) rec.best = score;
    if (score >= PASS_AT) rec.passed = true;
  });
}
/* журнал: промах открывает тип, три верных подряд закрывают;
   верный ответ по типу без промахов записи не заводит */
function mlog(type, ok){
  try {
    var all = readAll();
    var key = TID + "|" + type;
    if (ok && !(isObj(all.mistakes) && isObj(all.mistakes[key]))) return;
    if (!isObj(all.mistakes)) all.mistakes = {};
    var e = isObj(all.mistakes[key]) ? all.mistakes[key] : (all.mistakes[key] = { w:0, r:0 });
    if (ok) { if (num(e.w)) e.r = num(e.r) + 1; }
    else { e.w = num(e.w) + 1; e.r = 0; e.lastWrong = Date.now(); }
    e.last = Date.now();
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch (err) {}
}
/* режим повтора: только открытые типы этого тренажёра */
function openTypes(){
  var mk = readAll().mistakes, pre = TID + "|", res = [];
  if (!isObj(mk)) return res;
  for (var k in mk) if (Object.prototype.hasOwnProperty.call(mk, k) && k.indexOf(pre) === 0){
    var t = k.slice(pre.length), e = mk[k];
    if (isObj(e) && num(e.w) > 0 && num(e.r) < 3 && TYPE_IDS.indexOf(t) >= 0) res.push(t);
  }
  return res;
}
```

## 5. Режим повтора `?mode=review`

- Тренажёр с `review:true` в реестре при `?mode=review` берёт задачи только
  из `openTypes()`. Если открытых типов нет — сообщает об этом и открывает
  обычный режим.
- Кнопка «Повторить» в `oge/review.html` ведёт на
  `TRAINERS[TID].file + "?mode=review"`.
- Помощь помечается только при явном обращении к ней: переход между
  этапами, клик по навигации и самостоятельно исправленная ошибка помощью
  не считаются (канон).

## 6. Миграция своих ключей

Тренажёры, которые хранили прогресс под своим ключом (`oge10_progress_v1`,
`mathexam_oge11_stats_v1`, `mx-oge12-v1`, `oge14_progress_v1`,
`task19_trainer_v1`, `oge21_prog`), при первом открытии новой версии:

1. читают старый ключ; мусор — «нет данных»;
2. переносят то, что сопоставимо с ядром: счётчики по типам →
   `solvedByType`, лучший результат зачёта → `best`/`total`/`passed`;
3. ставят в своей ветке `migratedFrom: "<старый ключ>"` и больше миграцию не
   выполняют;
4. старый ключ **не удаляют** и не переписывают — откат возможен без потерь.

Кнопка «Сбросить прогресс» стирает только свою ветку и свои записи
журнала (по префиксу `TID|`), как в `practice-1-5-map.html`
(`resetOwnProgress`, тест `tools/reset-own-progress.test.mjs`).

## 7. Адаптеры страниц курса

`oge/progress-adapters.js` (копия движка из `ege-profil/`: `bar()`,
`liveStore`, `snapshotStore`, отбрасывание мусора) плюс адаптеры:

- `line(tid, typeIds)` — общий для линий 6–25. `passed === true` — полная
  полоса и подпись «зачёт сдан: best из total». Иначе полоса — охват типов:
  от каждого типа берётся не больше 3 из `solvedByType`, знаменатель
  `3 × typeIds.length`; подпись «решено задач: N». Ни одной записи — «не
  начат». `typeIds` берутся из реестра (`TYPES[tid]`), не из хранилища.
- `plots()` — линия 1–5: освоенные сюжеты из 8 (+ диагностика отдельно).
- `exam()` — попытки `all["oge-full-exam"].attempts[]` с числовыми
  `primary`, `geometry`, `mark`; показывает последнюю и лучшую попытку.
- `analogue()` — живой браузер: `mathExamOge2027Analogue1.v2` →
  `entries.filter(credit).length` из 19 и ручные баллы из 12; в снимке
  (код MEP1) честно «не начат».

Полоса из 10 клеток: ненулевая доля — хотя бы одна клетка, неполная — не
больше девяти, вся полоса только при доле ≥ 1 (правило `bar()` ЕГЭ).

## 8. Реестр `oge/registry.js`

```js
var RV = (function(){
  var TRAINERS = { "<TID>": { file:"../trainers/….html", title:"…", line:16, review:true } };
  var NAMES    = { "<TID>|<тип>": { n:"…", line:16 } };
  var TYPES    = { "<TID>": ["insCen", …] };            // = TYPE_IDS тренажёра
  var LINES    = { 16: ["oge-task16-circle"], … };       // порядок пилюль навигатора
  var CABINET  = [ { tid:"…", adapter:"line", title:"…", file:"…", line:16 } ];
  /* entry(), keyOk(), split(), open(), closed(), nameOf(), esc() — как в ЕГЭ */
})();
```

- `file` — относительно `oge/`.
- `TYPES[tid]` совпадает с `TYPE_IDS` в файле тренажёра; это проверяет
  `oge/tests/registry-test.js` (читает константу из HTML регулярным
  выражением, а не выполняет скрипт).
- Черновик `NAMES` получен из тренажёров скриптом
  `tools/oge-registry-draft.mjs`; дальше реестр ведётся руками.

## 9. Обязательные проверки

Для каждой страницы курса и каждого тренажёра, который пишет ключ:

- `oge/tests/junk-test.js` — 8 видов мусора в ключе и в своей ветке:
  страница загружается без исключений, после действия ученика пишет
  корректную запись, чужие ветки байт в байт целы;
- `oge/tests/registry-test.js` — каждый `file` существует с точным
  регистром, каждый TID из `NAMES` есть в `TRAINERS`, `TYPES[tid]` равен
  `TYPE_IDS` тренажёра, у каждого типа есть имя;
- `oge/tests/cabinet-safety-test.js` — XSS и мусор в журнале и в коде
  `MEP1`; правило `entry()` совпадает в `registry.js` и в адаптере;
- `oge/tests/links-test.js` — все `href`/`src` страниц курса, `file`
  реестра и адреса из JS-таблиц `exam/*.html` ведут на публикуемый файл;
  внешних скриптов нет.

Тренажёр дополнительно проходит `?selftest=1` с маркером
`<ИМЯ>_SELFTEST_OK` в консоли (см. `CLAUDE.md`, «Проверки перед коммитом»)
и внешний гейт в `tools/` на голом Node с независимым пересчётом ответов.

## 10. Параметры адреса тренажёра (режим занятия)

Добавлены решениями 20 и 22 ADR 0003; входят в общий критерий этапа 3.

- `?seed=<целое>` — все генераторы задач берут числа из `mulberry32(seed)`:
  у всей группы одинаковая последовательность задач. Без `seed` —
  прежнее поведение. Сид не влияет на запись прогресса.
- `?drill=N` — пятиминутка: N задач подряд (по умолчанию из всех типов,
  `&types=a,b` — только из указанных), таймер как ориентир, итог «верно X
  из N»; в ветку тренажёра пишется `drills[]` (не больше 30 последних
  записей `{ at, n, ok, seed, types }`), `solvedByType` и журнал — как в
  тренировке.
- `?board=1` — крупный шрифт для проектора, запоминается; `?mirror=1` —
  зеркало, не запоминается; кнопка «Во весь экран». Код — внутри файла, как
  в тренажёрах `ege-profil/`.
- `?mode=review` — раздел 5.
- `?hw=<id>` — ссылка «← К заданию» ведёт на `/oge/#hw=<id>`.
- `?join=<код>` принимает только навигатор `/oge/` (задача 02C).

## 11. Синхронизация в группу (задача 02C)

После каждой записи `saveRec`/`mlog`, если в браузере есть
`mathExamGroupAccess.v1 = { groupId, studentId, code }` и страница открыта
не по `file://`, тренажёр отправляет свою ветку и свои записи журнала:

```js
PUT https://mathexam-board-ladynata.amvera.io/api/v2/students/<studentId>/progress
Authorization: Bearer <code>
{ "tid": TID, "record": all[TID], "mistakes": { "TID|тип": {…}, … } }
```

Отложенно (3 с после последней записи), с повтором по нарастающей паузе,
принудительно при `visibilitychange`; никогда не блокирует интерфейс;
при недоступности сервера — тихий значок «не синхронизировано». Чужие
ветки и чужие записи журнала не отправляются никогда. Сервер заменяет
ветку целиком и сливает журнал по большему `last`.
