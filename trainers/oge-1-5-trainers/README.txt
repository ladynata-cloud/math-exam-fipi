КАРТА ТРЕНАЖЁРОВ ОГЭ · ЗАДАНИЯ 1–5
===================================

Статические файлы, сборка не нужна. Раздел живёт на сайте по адресу
/trainers/oge-1-5-trainers/ и входит в курс ОГЭ (/oge/).

ТОЧКА ВХОДА
-----------
  index.html                 — перенаправляет на карту (practice-1-5-map.html).
  practice-1-5-map.html      — карта: 12 карточек, прогресс по каждой,
                               «Сбросить прогресс» стирает только свои ветки.

КАРТОЧКИ КАРТЫ (12)
-------------------
  practice-1-5-entry-diagnostic-2026.html  Входная диагностика (10 заданий)
  percent-table-trainer.html               Проценты — таблица 2×2 («Начни отсюда»)
  practice-1-5-roads-grid.html             01 Дороги по клеткам
  practice-1-5-roads-schema.html           02 Дороги без клеток
  practice-1-5-tires.html                  03 Шины (20 вариантов + авторский)
  practice-1-5-stoves.html                 04 Печки
  practice-1-5-land-plots.html             05 Участки
  practice-1-5-apartments.html             06 Квартиры
  practice-1-5-tariffs.html                07 Тарифы
  practice-1-5-paper-sheets.html           08 Листы
  practice-1-5-plan-reading.html           2.1 Чтение плана
  practice-1-5-routes-checkpoint-2026.html 2.4 Проверочная по маршрутам

ПРОГРЕСС
--------
  Ключ localStorage: mathExamCourseProgress.v1 (общий для всего сайта).
  Каждый тренажёр пишет только свою ветку. progress.js (CourseProgress)
  подключают «Проценты», «Участки» и «Тарифы»; остальные пишут ключ сами.
  Единая единица прогресса «сюжет освоен» — задача OGE_COURSE_05_LINE_1_5
  (docs/tasks/), контракт — docs/OGE_PROGRESS_CONTRACT.md.

ВОСПРОИЗВОДИМЫЕ ВАРИАНТЫ
------------------------
  «Тарифы» и «Участки» генерируют задания от номера варианта: ссылка
  practice-1-5-tariffs.html?v=7 всегда открывает один и тот же вариант.
  Шины: practice-1-5-tires.html?variant=oge-2027-analogue-1 — авторский
  набор по структуре демоверсии 2027.

ПРОВЕРКИ (из корня репозитория)
-------------------------------
  node tools/oge-1-5-entry-diagnostic.test.mjs
  node tools/oge-plans-routes-stepik-trainers.test.mjs   (SHA-пины двух файлов)
  node tools/reset-own-progress.test.mjs
  node tools/oge-2027-analogue-distribute-1-5.test.mjs   (шины, авторский набор)
  node tools/oge-percent-guided-showcase-v2.test.mjs     (проценты)
  node tools/oge-check-links.mjs                         (ссылки раздела ОГЭ)
