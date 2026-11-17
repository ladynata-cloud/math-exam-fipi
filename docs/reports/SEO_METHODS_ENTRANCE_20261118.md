# Проверка входа «Основы и методы»

Дата: 18 ноября 2026 года, Новосибирск.

- Task: [SEO_METHODS_ENTRANCE_20261118](../tasks/SEO_METHODS_ENTRANCE_20261118.md).
- Исходная база `93bb989f7b5cb7aea99de388ce35dfcb6deb336d`. Повторная проверка выполнена с `main` на `eb18fc2a577adb8af133459fc3a2490ff2cd2fc4`.
- Branch: `fix/seo-methods-entrance-20261118`.
- Review level: `MEDIUM`.
- Release: не выполнялся; текущий `AGENTS.md` владельца в разговоре требует
  отдельного явного разрешения на merge.

## Сверка с опубликованным состоянием

До правок два публичных ответа HTTP 200 побайтово совпали с базой задачи:

| Страница | Байты | SHA256 |
| --- | ---: | --- |
| `/ege-profil/azbuka-metodov/index.html` | 4260 | `593f39b33aabc399326327ff6f15f28fb0e249b62c963a4faf009e75a3101fa4` |
| `/oge/index.html` | 64745 | `d705c4bb30878e35004dc1b87cabbb43a23aa5218247302014e79f7877142c2e` |

Проверка использовала обычный HTTPS с верификацией TLS. Это сверка входных
страниц, не повторная приёмка всех курсов, кабинета или Search Console.
Старые записи PROJECT_STATUS о подготовке SEO остаются историческими.

## Что изменено

- В существующем разделе добавлен один HTTPS canonical, конкретные
  title/description и согласованные OG/Twitter-метаданные.
- Начальный HTML содержит 11 тем. Он воспроизводимо собирается из
  действующих `exam-map.js` и `catalog.js`, с текущими официальными
  подписями номеров. Всего в каталоге остаются 44 навыка.
- Приложение заменяет начальный каталог своим обычным отображением.
  Статическая подпись сообщает количество навыков и не изображает
  несуществующий результат ученика.
- Без JavaScript доступны названия/описания тем и две статические страницы
  для чтения; упражнения и самопроверка требуют JavaScript. Новое сообщение
  говорит об этом прямо.
- Sitemap меняется с 582 до 583 URL. Единственное добавление —
  `https://mathexam.space/ege-profil/azbuka-metodov/`; удалений,
  query/hash-вариантов и снятия `noindex` нет.
- SEO workflow проверяет воспроизводимость и совпадение с фактическим
  JS-каталогом. Изменения runtime JS этого раздела тоже запускают проверку.
- На новый адрес sitemap подключена неизменённая штатная пара скриптов
  общего навигатора. В inventory добавлен только этот вход: 583 URL,
  582 покрытых навигатором и прежнее отдельное исключение Peterson 6.
  Исходный HTML привязан к проверенному коммиту; его байты полностью
  восстанавливаются удалением ровно этой пары подключений.
- [SEO-записка](SEO_ARTICLES_20261118.md) фиксирует редакторские приоритеты
  трёх сайтов, проверку дублей и критерии оценки результата.

Runtime JS, математические банки, стили, сохранения, кабинеты и готовые
автономные пакеты не изменены. Метаданные опубликованного входа не требуют
изменения прежнего работающего offline-приложения.

## Выполненные локальные проверки

| Проверка | Результат |
| --- | --- |
| `node tools/build-profile-methods-entrance.cjs --check` | PASS, 11 тем |
| `python3 tools/seo-sitemap.test.py` | PASS, 12 тестов |
| `python3 tools/build-sitemap.py --check` | PASS, 583 URL |
| `python3 tools/seo-check.py` | PASS: 32 входа, 6 статических тематических страниц, 226 локальных ссылок |
| `tools/seo-catalog.test.cjs` относительно base | PASS: 11 тем совпадают по порядку, текстам, подписям и адресам; нет второго H1 или записи progress |
| `tools/profile-alphabets.test.cjs` | PASS, 14 тестов |
| `tools/profile-fipi-2027-contract.test.cjs` | PASS, 10 тестов |
| `tools/public-navigator-preservation.test.cjs` | PASS, 4 теста; прежние байты и отрицательные проверки сохранены |
| `tools/public_navigator_bindings.test.py` | PASS, 5 тестов |
| `tools/public-navigator-regression.cjs` | PASS, 46 сценариев |
| `tools/public-home-coverage.cjs` | PASS, 743 учебных HTML: 736 прямых входов и 7 редиректов, пропусков нет |
| Сопоставление старого/нового набора sitemap | Только один добавленный canonical |
| `node --check tools/seo-entrypoints.browser.cjs` | PASS |
| `git diff --check` | PASS |

Независимый агент повторил генерацию/проверки каталогов, оба набора
профильных тестов, sitemap и SEO. Блокирующих замечаний к просмотренному
diff не осталось. Это локальное техническое review, не внешний provider
verdict и не разрешение на слияние.

## Переход к заданию ОДЗ

В первом запуске GitHub Actions сценарий открыл тему «ОДЗ и отбор решений»
и 30 секунд ждал поле `#az-answer` на карте навыков. Единственный снимок
`methods-js-320.png` сделан в каталоге перед переходом. Ошибку воспроизводит
пропуск второго клика. [Журнал первого запуска](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/44187475085).

На странице темы ученик выбирает «Исключаю нули знаменателя». По адресу
`#/domain/denominator` открывается задача о сокращении дроби и поле
«Запрещённое x». Браузерный тест проходит обе видимые ссылки, сверяет
адреса и подпись поля. После перезагрузки и возврата через «К списку тем»
он проверяет введённое значение и записи в хранилище браузера.

| Проверка на 320, 390 и 1280 px | Результат в Chromium |
| --- | --- |
| JavaScript включён | Поле открывается на каждом экране. Черновик восстанавливается при повторном входе. |
| JavaScript выключен | В каталоге 11 тем. Обе ссылки открывают материалы для чтения, работает возврат. |
| Ранее заполненные ответы | При переходе с HTML из `main` на версию PR в том же браузере сохранились черновик, ошибочная попытка и принятый ответ в другом навыке. Обе записи совпали побайтово. |

Запросы с User-Agent Googlebot и YandexBot к проверяемой версии вернули
HTTP 200 и все 11 карточек в исходном HTML. Обход разрешён в `robots.txt`.
У раздела один canonical, он один раз включён в карту сайта.

Конфликт с изменениями геометрии из #659 затрагивал только
`assets/assistant/page-rollout.json`. В реестре сохранены ранее проверенные
страницы из `main` и добавлен вход раздела. Общая версия исходников
`0f6e95f703af7e020a676923e3179ac226e4ba2e` используется для проверки
контрольных сумм. Состав и результаты запусков GitHub Actions доступны
во [вкладке проверок PR #662](https://github.com/ladynata-cloud/math-exam-fipi/pull/662/checks).
Артефакт `seo-methods-entrance` содержит шесть снимков каталога и три
снимка упражнения при полном прохождении сценария.

## Не выполнялось

- Публикация, merge, auto-merge и проверка уже выпущенного изменения.
- Новый замер индексации/переходов в личных кабинетах поисковых систем.
- Полный backend/board suite: этот runtime и его контракты не менялись.
- Ученический пилот или оценка прироста поискового трафика.

## Передача

```text
EXECUTIVE STATUS

Task: SEO_METHODS_ENTRANCE_20261118
PR: #662
Base: eb18fc2a577adb8af133459fc3a2490ff2cd2fc4
Head: exact committed SHA in the PR handoff
Gate: local checks PASS; browser CI required
Tests: 12 sitemap and 24 profile tests, static/runtime parity, full SEO browser suite, legacy answers and navigator
Failures: initial CI expected the answer on the topic map; fixed in the browser scenario
Not run: production release, current search dashboards, unrelated backend suite
Scope deviations: none
Recommendation: finish exact-head CI and review screenshots, then seek merge authorization
Next user decision: separate merge authorization for reviewed base/head
```
