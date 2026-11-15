# Согласованное предложение занятий 5–11 классов

Дата: 16 ноября 2026, Asia/Novosibirsk. [Задача](../tasks/LESSONS_OFFER_CONSISTENCY_20261116.md).
Основа: `1469ad50a8659f66c8613164009e7387a3a68f2b`.

## Результат

В `lessons/index.html` изменены ровно шесть строк: три description, возраст
на первом экране, возраст в представлении преподавателя и метка карточки 5–6
классов. Занятия обозначены для 5–11 классов; карточка 5–6 называется школьной
программой. Главная уже содержала правильное предложение и не менялась.
Цены, длительность, мини-группы до четырёх, контакты, ссылки, CSS и JS сохранены.

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

Использован установленный Node runtime; версии зависимостей, тесты и workflow
не изменялись. Новых тестовых файлов для этой текстовой правки нет.

## Браузерная проверка: ограничение среды

Штатная команда `node tools/avito-showcase.browser.cjs` запущена с существующим
Playwright и каталогом артефактов вне репозитория. Первая попытка остановилась
до открытия браузера: ожидаемый bundled Chromium отсутствует. Повторная попытка
с установленным системным Chromium, заданным через предусмотренный скриптом
`CHROMIUM_EXECUTABLE_PATH`, остановилась до открытия страниц:
`socket() failed: Operation not permitted`.

Ни один браузерный сценарий не выполнен; screenshots не получены. Это
ограничение запуска, а не доказанная ошибка страницы. Защиты браузера,
системные настройки и gates не изменялись. Существующий workflow
`avito-showcase.yml` должен выполнить проверку 320/390/768/1280 px, клавиатуры,
режима без JavaScript и ссылок на точном коммите Draft PR. До этого итоговый
маркер `LESSONS_OFFER_CONSISTENCY_20261116_OK` **не выдан**.

## Передача

```text
EXECUTIVE STATUS

Task: LESSONS_OFFER_CONSISTENCY_20261116
PR: created by the executing agent after local review; exact URL in handoff
Base: 1469ad50a8659f66c8613164009e7387a3a68f2b
Head: exact committed candidate recorded in the Draft PR
Gate: static checks PASS; browser/complete gate PENDING
Tests: 12 sitemap + 6 funnel tests PASS; existing SEO checks PASS
Failures: local browser startup blocked by environment before page checks
Not run: browser scenarios/screenshots, native CI, external provider review
Scope deviations: none; exactly three approved paths
Recommendation: review the exact diff, then run existing CI on the Draft PR
Next user decision: separate merge/publication authorization after verified Draft
```

Объединение, auto-merge и публикация запрещены более узкими правилами владельца
в текущем разговоре. Подготовка не означает выпуск.
