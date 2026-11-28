# Аржеников: исследования, пространственная карта и следующий шаг

## Identity

- Task: `ARZHENIKOV_JOURNEYS_20261123`.
- Owner: владелец MathExam.
- Date: 23 ноября 2026, Asia/Novosibirsk.
- Base branch: `main`.
- Base SHA: `9ffd240c87abe46fc1456fac8ef883622268e6d9`.
- Planned branch: `feat/arzhenikov-journeys-20261123`.
- Review level: `HIGH` — новые учебные последовательности и отдельные сохраняемые черновики; пространственная навигация общей страницы.
- ADR 0001 remains `Proposed`; используем существующую статическую страницу и её архитектуру, платформенные контракты не меняем.

## Goal

Расширить и углубить действующие тренажёры по мотивам Арженикова: дать ребёнку
возможность предсказать, проверить действием и объяснить результат на новом
условии. Показать пути на карте с приближением и возвратом к целому по
визуальному принципу Prezi. Добавить вход от арифметики к алгебре и геометрии,
краткую справку об Арженикове и проверяемые ссылки на исторические источники.
Обеспечить бесплатное использование и передачу автономного комплекта.

## Context and evidence

- Прямое поручение в текущем разговоре: «Давай ты расширишь и углубишь
  тренажеры по методике Арженикова»; затем уточнены пространственные карты,
  вход в советский курс алгебры/геометрии, источники и справка об авторе.
- Последующее указание: выполнить всё облачно как одну активную задачу;
  дать русскоязычным детям бесплатный доступ. Локальный компьютер владельца
  не участвует; не создаются дополнительные фоновые задачи или расписания.
- На базе есть 48 историй города, 512 условий оранжереи, 12 миссий порта и
  восемь навыков пошагового деления. Их ID, содержание и ключи сохраняются.
- Публичный HTML при начале задачи: HTTP 200, точное совпадение с базой,
  SHA-256 `f50f699ecc2b32f9e80dd3174d1a226e4782547037a2340fee6d182254208a4f`.
  Это подтверждает предыдущую публикацию, а не выпуск текущих изменений.
- Учебный разбор выявил недостаток самостоятельного выбора смысла, прогноза
  изменения, обратной задачи и двух последовательных действий. Прежние
  выводы аудита учтены в `ARZHENIKOV_GARDEN.md`; новый внешний аудит не заявляется.
- Биография проверяется по «Летописи МГУ», книги — по библиотечным карточкам.
  Современные задания и маршруты не выдаются за полный оцифрованный учебник.

## Approved scope

### In scope

- «Бюро открытий»: шесть линий, 24 истории (по две учебные и две новые
  проверочные на линию), предметное действие, объяснение, адресная помощь,
  сохранение незаконченной работы и честный учёт первого ответа.
- Пространственная карта существующих режимов и навыков: общий вид,
  приближение к разделу и теме, последовательный маршрут, возврат, обычные
  ссылки, клавиатура, мобильный экран и режим без движения.
- Два следующих направления с работающими вводными упражнениями MathExam
  и отдельными ссылками на советские издания А. П. Киселёва.
- Краткая справка о К. П. Арженикове, происхождение адаптации, источники.
- Воспроизводимый ZIP этой страницы для занятий без интернета; ссылки на
  соседние онлайн-тренажёры и библиотечные источники остаются сетевыми.
- Адресная привязка изменённого HTML в page-rollout, необходимые проверки
  и их подключение к существующему workflow.

### Out of scope / areas that must not change

- Полное постраничное создание учебников Киселёва, остальные курсы,
  серверы, платные API, аккаунты учеников, платформа общей доски.
- Изменение старых банков, ID, контрактов сохранения и доказательств
  самостоятельности; широкое обновление источников navigator.
- Публикация сообщений от имени владельца, новые задания по расписанию,
  изменение лицензии всего репозитория.

## Acceptance criteria

- [ ] Все 24 новые истории математически и смыслово проверены независимо.
- [ ] Предметное действие предшествует числовой записи; помощь/исправление
      не превращаются в самостоятельный первый ответ после перезагрузки.
- [ ] Карта действительно приближает раздел и тему; обзор, прямые ссылки,
      клавиатура, Back и reduced motion сохраняют ориентацию и работу.
- [ ] Прежние 48/512/12 заданий, первый ход и черновики проходят регрессии.
- [ ] Два входа имеют действующие упражнения и подписанные источники;
      полный исторический курс не объявляется готовым.
- [ ] Справка об авторе соответствует источникам; современная адаптация
      обозначена явно.
- [ ] ZIP воспроизводим, основные режимы работают без сети, регистрации
      и ключей ИИ; сетевые переходы понятны.
- [ ] Проверки выполняются в облачном окружении/CI; прохождение в настоящем
      браузере и DOM-проверки учитываются отдельно.

## Checks and gates

- Required: existing garden/harbor arithmetic tests and map/garden/life/
  adventure/harbor browser suites; new discovery and journey suites;
  offline build/check; navigator preservation; applicable SEO checks.
- Static: syntax, local/source links, `git diff --check`.
- Manual: screenshots at 320/390/1280, overview/zoom/topic/return,
  readability, lesson state while travelling, attribution.
- Final gate marker: `ARZHENIKOV_JOURNEYS_READY_FOR_OWNER_REVIEW` only after
  applicable checks; keep unavailable/failing checks separate.

## Review plan

- Independent learning-design review before implementation, then separate
  mathematics, persistence, navigation and visual review of the result.
- External Claude/provider review: not performed; no paid review requested
  for this task. Existing audit findings are context, not a new verdict.
- No secrets, personal pupil data or machine-specific paths in repository
  reports or remote handoffs.

## Risk and rollback

- Risks: camera hides a destination; new hashes interfere with old modes;
  restoration overstates independent work; offline bundle misses a resource.
- Check reversible navigation, one visible activity, old-save byte identity,
  refused/corrupt storage, revised answers and complete offline resource set.
- Rollback: ordinary revert of this task after owner authorization; separate
  discovery storage is retained and old keys remain untouched.

## Permissions

- Start and implementation: direct current owner instructions quoted above.
- One branch, local commits, push and Draft PR are within the requested work.
- Current conversation includes an explicit repository boundary requiring
  separate owner merge authorization. It takes precedence over the more
  permissive on-disk standing policy. No merge, auto-merge or deployment is
  performed in this task without that separate authorization.
- No force, reset, rebase, non-fast-forward merge, admin override or weakened
  verification.

## Execution record

- Actual branch: `feat/arzhenikov-journeys-20261123`.
- Actual base: `9ffd240c87abe46fc1456fac8ef883622268e6d9`.
- Exact head, PR, passed/failed/not-run gates and independent findings are
  recorded in the task report and PR after implementation.

## Required handoff

```text
EXECUTIVE STATUS

Task: ARZHENIKOV_JOURNEYS_20261123
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
