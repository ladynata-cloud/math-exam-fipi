# Проверка входа «Основы и методы»

Дата: 18 ноября 2026 года, Новосибирск.

- Task: [SEO_METHODS_ENTRANCE_20261118](../tasks/SEO_METHODS_ENTRANCE_20261118.md).
- Base: `93bb989f7b5cb7aea99de388ce35dfcb6deb336d`.
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
| Сопоставление старого/нового набора sitemap | Только один добавленный canonical |
| `node --check tools/seo-entrypoints.browser.cjs` | PASS |
| `git diff --check` | PASS |

Независимый агент повторил генерацию/проверки каталогов, оба набора
профильных тестов, sitemap и SEO. Блокирующих замечаний к просмотренному
diff не осталось. Это локальное техническое review, не внешний provider
verdict и не разрешение на слияние.

## Браузерный gate

Два локальных запуска Chromium остановились до открытия страниц:
`socket() failed: Operation not permitted` при старте браузерного процесса.
Они не считаются успешной браузерной проверкой и не устанавливают дефект сайта.
Ограничение среды не обходилось, TLS и gates не ослаблялись.

Проверки перенесены в штатные PR workflows:

- `Public SEO and sitemap`: 320/390/1280 px, JavaScript включён/отключён,
  отсутствие переполнения/дублирования, чтение статического материала,
  переход к навыку, ввод черновика, reload и сохранность после возврата.
  Снимки сохраняются в artifact `seo-methods-entrance`.
- `Trainer downloads — standalone and GIF workflow`: существующий
  `ege-profil-methods-atlas` остаётся доступным через HTML/ZIP и file://.

Точный head, PR, результаты CI и просмотр полученных снимков записываются
в PR. До успешного browser CI окончательный маркер
`SEO_METHODS_ENTRANCE_20261118_OK` не выдаётся.

Первый CI на head `81afbe42563649cbef19b663507fd66721f13e82`
обнаружил ошибку нового проверочного сценария: он ожидал поле ответа сразу
после выбора темы, хотя действующее приложение сначала показывает карту
навыков. Сценарий исправлен: при первом входе и после возврата он выбирает
видимый навык «Исключаю нули знаменателя» и только затем проверяет черновик.
Проверки сохранности ответа не ослаблены; runtime приложения не менялся.
Первый снимок 320 px просмотрен; остальные размеры и режим без JavaScript
требуют успешного повторного CI на новом head.

## Не выполнялось

- Публикация, merge, auto-merge и проверка уже выпущенного изменения.
- Новый замер индексации/переходов в личных кабинетах поисковых систем.
- Полный backend/board suite: этот runtime и его контракты не менялись.
- Ученический пилот или оценка прироста поискового трафика.

## Передача

```text
EXECUTIVE STATUS

Task: SEO_METHODS_ENTRANCE_20261118
PR: exact URL in the PR handoff
Base: 93bb989f7b5cb7aea99de388ce35dfcb6deb336d
Head: exact committed SHA in the PR handoff
Gate: local checks PASS; browser CI required
Tests: 12 sitemap + 24 profile tests; static/runtime catalog parity; SEO and syntax
Failures: local browser launch blocked before page load
Not run: production release, current search dashboards, unrelated backend suite
Scope deviations: none
Recommendation: finish exact-head CI and review screenshots, then seek merge authorization
Next user decision: separate merge authorization for reviewed base/head
```
