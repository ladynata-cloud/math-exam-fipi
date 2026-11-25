# Согласованное предложение занятий 5–11 классов

Дата: 16 ноября 2026, Asia/Novosibirsk. [Задача](../tasks/LESSONS_OFFER_CONSISTENCY_20261116.md).
Основа: `1469ad50a8659f66c8613164009e7387a3a68f2b`.

## Результат

В `lessons/index.html` изменены ровно шесть строк: три description, возраст
на первом экране, возраст в представлении преподавателя и метка карточки 5–6
классов. Занятия обозначены для 5–11 классов; карточка 5–6 называется школьной
программой. Главная уже содержала правильное предложение и не менялась.
Цены, длительность, мини-группы до четырёх, контакты, ссылки, CSS и JS сохранены.
В существующем workflow дополнительно включено сохранение screenshots и JSON,
которые уже умеет создавать browser-тест. Это свидетельства приёмки; команды
тестов, assertions, права workflow и прежний артефакт `oge-home-3d` сохранены.

## Сверка опубликованного состояния

`PROJECT_STATUS.md` прочитан без изменения. Запись об удалении блока ранних
отзывов описывает подготовку. 15 ноября в 23:42:31 UTC (16 ноября 06:42 по
Новосибирску) обычный HTTPS вернул 200 для главной и `/lessons/`; оба ответа
побайтово совпали с базой. В текущей странице блока уже нет, а противоречие
5–11 / 7–11 ещё присутствует. Это свидетельство только двух выбранных страниц.
Общая сверка журнала ведётся в другом пакете текущего аудита.

SHA-256 опубликованной страницы до правки:
`29864e54147df0e295929bee19a433dc833b99408c700e5a4170bade76922bec`.
SHA-256 подготовленной страницы:
`a41c2b81941ed912315ac628ad0f47569056c18c52532d08647cf4eacc632c89`.

## Локальные проверки перед Draft PR

Этот раздел фиксирует проверку до облачного CI. Итоговые PR, head, облачные
проверки и визуальная приёмка фиксируются в теле Draft PR для точного коммита.

| Команда или проверка | Результат |
| --- | --- |
| `python3 tools/seo-sitemap.test.py` | PASS, 12 тестов |
| `python3 tools/build-sitemap.py --check` | PASS, 582 публичных canonical URL |
| `python3 tools/seo-check.py` | PASS: 31 вход; 226 локальных ссылок; 914 canonical; 151 redirect; 582 URL sitemap |
| `node tools/lesson-funnel.test.cjs` | PASS, 6 тестов существующей аналитики |
| Сравнение HTML-разметки с базой | 307 тегов сохранены; изменены только три атрибута description; ссылки и ресурсы сохранены |
| `git diff --numstat -- lessons/index.html` | Ровно +6 / −6 |
| `git diff --check` | PASS |

Использован установленный Node runtime; версии зависимостей и тесты
не изменялись. Новых тестовых файлов для этой текстовой правки нет.

## Браузерная проверка: ограничение среды

Штатная команда `node tools/avito-showcase.browser.cjs` запущена с существующим
Playwright и каталогом артефактов вне репозитория. Первая попытка остановилась
до открытия браузера: ожидаемый bundled Chromium отсутствует. Повторная попытка
с установленным системным Chromium, заданным через предусмотренный скриптом
`CHROMIUM_EXECUTABLE_PATH`, остановилась до открытия страниц:
`socket() failed: Operation not permitted`.

Локально ни один браузерный сценарий не выполнен; screenshots не получены. Это
ограничение запуска, а не доказанная ошибка страницы. Защиты браузера,
системные настройки и gates не изменялись. Повторные локальные попытки
остановлены; браузерные проверки выполнены штатным CI.

## Первый облачный прогон и сохранение артефактов

[Draft #629](https://github.com/ladynata-cloud/math-exam-fipi/pull/629), head
`6fe3f257994f274e623ca518bb863f3cecd3b3c0`, base
`1469ad50a8659f66c8613164009e7387a3a68f2b`: семь check-runs из четырёх workflow
завершились **SUCCESS**. Последний завершён 15 ноября 2026 в 23:56:51 UTC.

| Workflow | Результат первого head |
| --- | --- |
| [Public lesson showcase](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43777078236) | SUCCESS: главная 320/390/1280; `/lessons/` 320/390/768/1280; клавиатура, без JS, ссылки; 12 полных прохождений четырёх примеров |
| [Public SEO](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43777078234) | SUCCESS |
| [Public navigator](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43777078160) | SUCCESS, четыре shard jobs |
| [GIF previews](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43777078161) | SUCCESS |

В первом showcase-прогоне не было PNG `/lessons/`: переменная
`SHOWCASE_LANDING_ARTIFACTS` не задавалась, а выгружался только `oge-home-3d`.
Изображения ОГЭ не подтверждают визуальную приёмку изменённой страницы.
Успешные автоматические проверки первого head не заменяют эту приёмку.

В согласованном дополнении workflow переменная направляет уже существующие
screenshots в каталог артефактов runner, а отдельный upload сохраняет их как
`lesson-showcase`. `tools/avito-showcase.browser.cjs` уже формирует
`landing-320-initial.png`, `landing-1280-initial.png`, `landing-1280-full.png`,
снимки других состояний и `results.json`; тестовый код не меняется.
Локальная проверка дополнения: YAML успешно разобран; после исключения
нового env и upload-шага структура workflow совпадает с первым кандидатом.
`git diff --check` — PASS; продуктовый diff с базой остаётся +6 / −6.
Проверки и визуальный просмотр этого дополнения ожидаются на следующем точном
head PR. Итоговый маркер `LESSONS_OFFER_CONSISTENCY_20261116_OK` **не выдан**.

## Передача

```text
EXECUTIVE STATUS

Task: LESSONS_OFFER_CONSISTENCY_20261116
PR: https://github.com/ladynata-cloud/math-exam-fipi/pull/629 (Draft)
Base: 1469ad50a8659f66c8613164009e7387a3a68f2b
Head: first tested 6fe3f257994f274e623ca518bb863f3cecd3b3c0; artifact follow-up uncommitted
Gate: first head CI 7/7 SUCCESS; next head CI and visual acceptance PENDING
Tests: 12 sitemap + 6 funnel local tests PASS; existing SEO and cloud browser checks PASS
Failures: no product failure observed; local browser startup blocked before page checks
Not run: next head CI and /lessons/ PNG review; external provider review
Scope deviations: none; four approved paths, six product lines
Recommendation: review and publish artifact follow-up, then inspect next head CI and PNG
Next user decision: separate merge/publication authorization after verified Draft
```

Объединение, auto-merge и публикация запрещены более узкими правилами владельца
в текущем разговоре. Подготовка не означает выпуск.
