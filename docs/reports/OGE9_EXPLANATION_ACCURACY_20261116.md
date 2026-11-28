# ОГЭ №9: точность объяснения корней и переноса

Дата: 16 ноября 2026, Asia/Novosibirsk.
[Задача](../tasks/OGE9_EXPLANATION_ACCURACY_20261116.md), `SMALL`.
Основа: `1469ad50a8659f66c8613164009e7387a3a68f2b`.

## Результат и границы

Исправлены поясняющий HTML, строки вкладки «Учимся» и две связанные подсказки.
Для ax²+c=0 явно указано a≠0 и разделены положительный, нулевой и отрицательный
случаи x²=k. Перенос объяснён одинаковым действием с обеими частями. Деление
разрешено только на ненулевой коэффициент; отдельно названы 0x=0 и 0x=d≠0.

140 экзаменационных и 135 прежних дополнительных карточек сохранены. Не менялись
числа, IDs, генераторы, проверка ответа, события, учёт помощи, сохранения и
механика элементов управления. Начальный режим по-прежнему показывает задачу;
справочник и другие режимы остаются дополнительными.

Изменения из других открытых PR не переносились. Продуктовая правка относится
только к №9; новые поля, модели и типы заданий не добавлены.

## Независимый математический просмотр

Внутренний независимый reviewer прочитал полный diff и фактические вызовы
stMoveLeft на source blob `95f46a00734bd53e4574fb2b90e04137a751acea`.
Получен ограниченный PASS текста; это не внешний provider verdict и не
разрешение на выпуск.

| Контрольный случай | Независимый результат |
| --- | --- |
| x²=9 | Корни −3 и 3 |
| x²=0 | Один корень 0 |
| x²=−9 | Действительных корней нет |
| −2x²+18=0 | x²=9; корни −3 и 3 |
| x+5=12 | Вычесть 5 из обеих частей; x=7 |
| 0x=0 / 0x=d, d≠0 | Любое действительное число / корней нет |

Подсказка stMoveLeft используется для ax²=kx, в том числе отрицательного k;
вычитание kx из обеих частей корректно. Блоки генераторов, банка, диспетчера
шагов и UI после учебной вкладки побайтово сохранены. Функции stCanon и
stMoveLeft идентичны прежним после исключения единственной hint-строки в каждой.

## Точный источник и производные файлы

- Проверенный source commit, опубликованный через GitHub integration:
  `679421ce3057ffbcdab89b80fcd591337f67f9e8`.
- Его tree `2d384d9779a5cae0ad071b738421f678382904c3` совпал с деревом локального
  логического source commit; различие commit SHA связано с публикацией через
  GitHub integration при недоступной Git CLI-аутентификации.
- SHA-256 основного HTML:
  `b941c4587339740271867642f456874d6cf555ab11d78f8899bbf7205f6bd68b`.
- SHA-256 полного inline script:
  `a8cae46b2d9730ee6de05e14abf3bbd07a842b06c598264b86cfd9351c1d6c02`.
- В learner-entry обновлены только эта точная привязка и комментарий о
  происхождении; полное сравнение скрипта и проверки controls сохранены.
- Штатный `public_navigator_bindings.py` выполнен с этим source commit и ровно
  `trainers/oge-task9-equations.html`. Другие записи addedPages, originBaseSha,
  snippets и исторические sourceBindingUpdates сохранены; добавлена одна запись.
- Сборка: `node scripts/build-trainer-downloads.mjs --only=oge-task9-equations --downloads-only`.
- В ZIP пять файлов; изменён только `oge-task9-equations.html`. HTML из настоящего
  ZIP побайтово совпадает с самостоятельным HTML. Остальные четыре содержимых
  сохранены; общий манифест скачиваний и промпт не изменились.
- SHA-256 самостоятельного HTML:
  `c672d858f06667798211df795df2d3a8ad8c7dc4821abd5a71b1c8854e9bd56a`.
- Книжные версии v1/v2 и их immutable pins не менялись.

## Локальные результаты перед Draft PR

Это снимок перед облачным CI. Финальные PR/head, результаты браузера и gate
фиксируются в теле Draft PR для точного коммита; эта запись не объявляет выпуск.

| Проверка | Результат |
| --- | --- |
| `node --test --test-concurrency=2 tools/task9-*.test.cjs` | PASS, 222/222; в том числе независимые ответы, промежуточные шаги, генераторы и сохранение учёта помощи |
| `node tools/oge-algebra-minimal.test.cjs` | PASS, 26/26; задача первой, помощь добровольная, введённый ответ и результат сохраняются |
| `node tools/oge-algebra-contract.test.mjs` | PASS, 668 проверок, 0 провалов; `OGE_ALGEBRA_GATE_OK` |
| `node tools/oge-focus-navigation.test.cjs` | PASS; 522 внутренних ссылки |
| `node --test tools/public-navigator-preservation.test.cjs` | PASS, 4/4; точный navigator и восстановление всех привязанных страниц |
| `python3 tools/public_navigator_bindings.test.py` | PASS, 5/5 |
| `python3 tools/book-edition/verify.py --base 1469ad50a8659f66c8613164009e7387a3a68f2b` | PASS, две защищённые версии; по 71 записи и 225 файлов |
| ZIP member set и побайтовая сверка содержимого | PASS; изменён только один HTML, остальные четыре файла сохранены |
| `node --check tools/task9-transfer-all.browser.cjs` | PASS |

`oge-learner-entry.test.cjs`, окончательный `git diff --check` и состояние CI
дополняются в передаче по фактическому результату. Исторические refs для
learner-entry получены штатным read-only fetch; проверки не ослаблялись.

## Браузер и визуальная приёмка

В общей среде локальный Chromium остановился до открытия страниц проверяемого
пакета занятий: отсутствовал bundled browser, а штатный системный executable
не смог открыть сокет (`Operation not permitted`). Защита и системные настройки
не менялись. Локальные браузерные сценарии №9 не объявляются выполненными.

В существующий task9-transfer browser suite добавлены только переходы к
исправленным справочным/учебным блокам, проверка границ viewport и PNG для
320/360/1280 px. Прежние сценарии решения, взаимодействий и прогресса сохранены.
Эти изображения предназначены для визуального просмотра после CI, а не для
публичной страницы ученика. Отдельный существующий offline browser suite
открывает HTML и настоящий ZIP без сети.

Итоговый `OGE9_EXPLANATION_ACCURACY_OK` выдаётся в PR только после успешных
применимых CI, проверки артефактов и exact-head review. Наблюдения реальных
учеников, новое покрытие всего ФИПИ и рост результатов этим не подтверждаются.

## Сверка исходной публикации

15 ноября в 23:43:49 UTC основной HTML №9, `ege-profil/part-two/app.js` и
`ege-profil/azbuka-metodov/diagrams.js` вернули HTTP 200 и побайтово совпали
с основой. H04/#618 и #620 уже находятся в main; верхняя запись PROJECT_STATUS
уточняет историческое Draft-описание. Новая правка №9 ещё не публиковалась.

## Риск, откат и передача

Риск — расхождение повторённых объяснений или тесная строка на узком экране.
Математика просмотрена независимо; для экрана сохраняются реальные CI PNG.
Откат выполняется обычным проверенным обратным изменением этой задачи,
без миграции или удаления пользовательских сохранений.

```text
EXECUTIVE STATUS

Task: OGE9_EXPLANATION_ACCURACY_20261116
PR: exact Draft URL in handoff
Base: 1469ad50a8659f66c8613164009e7387a3a68f2b
Head: exact final candidate recorded in the Draft PR
Gate: local mathematics/preservation PASS; final browser acceptance pending
Tests: actual local results listed above; cloud results in exact-head PR
Failures: local browser unavailable before page execution
Not run: real pupils, unrelated banks, external provider, merge/deployment
Scope deviations: none; existing browser suite extended only for changed-text evidence
Recommendation: finish exact-head CI and inspect its images, retain Draft
Next user decision: separate owner merge/publication authorization
```
