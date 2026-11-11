# ОГЭ: короткая практика, мастерские и навыки внутри темы

## Identity

- Task: `OGE_SKILL_COURSE_INTEGRATION_20261111`
- Owner: владелец MathExam.
- Date: 2026-11-11.
- Base branch: `main`.
- Base SHA: `19811cc15a33d63fc0fcc0b6a11c34863ec64d03`.
- Planned branch: `feat/oge-skill-course-integration-20261111`.
- Review level: `HIGH`.
- Related ADR: [0003 — курс ОГЭ](../adr/0003-oge-course.md), `Accepted`.
- ADR 0001 remains `Proposed`; this task does not establish a new bridge contract.

## Goal

Перенести подготовленные в разговоре материалы в действующий курс MathExam:
основы и задания ОГЭ №6–19 получают короткие занятия, добровольные мастерские
и раскрываемые карты навыков. Обычная тренировка остаётся самостоятельным
понятным выбором. Ученику не требуется проходить большую карту целиком.

## Context and evidence

- Прямая инструкция владельца: «продолжи задание. преобразуй курс в
  соотвествие с этими планами». Это разрешение выполнить согласованное
  преобразование; буквальное слово `START` в этой реплике не использовалось.
- Материалы разговора, версия 0.3.0: 15 тем, 99 навыков, 194 фиксированных
  задания, 46 семейств вариантов, 39 коротких маршрутов. Авторский учебный
  набор не объявляется полным банком экзаменационных подтипов.
- На проверенной основе действуют `/trainers/oge-course/`, `/oge/`,
  `/trainers/oge-basics/`, семь учебных линий и прежние адреса тренажёров.
  Все 15 ссылок исходного набора сверены с ними.
- Независимые внутренние аудиты устройства курса и прототипа выполнены
  до изменений. Они рекомендовали отдельную страницу внутри сайта,
  явный вход по теме/маршруту и сохранение локальной истории.
- Параллельные PR #550 (карта курса) и #552 (базовый курс) при старте
  открыты. Их работа не считается опубликованной и не включается в эту ветку.

## Approved scope

### In scope

- Раздел `/oge/skills/` с перенесёнными исходниками, воспроизводимой сборкой
  и математическими проверками подготовленного комплекта.
- Прямые проверяемые ссылки на темы и маршруты, продолжение сохранённого
  занятия и понятный возврат в курс / обычный тренажёр / кабинет.
- Компактные дополнительные входы из существующих страниц курса.
- Четыре обзорных задания на старте темы; мастерские и карта по желанию.
- Раздельный результат обычных задач и мастерских; сохранение учёта помощи.
- Школьные формулировки без вымышленных математических терминов.
- Документация, ограниченные проверки интеграции и CI-проверка браузера.
- Служебная привязка публичного навигатора к точному проверенному коммиту
  страницы курса: штатное обновление `assets/assistant/page-rollout.json`
  только для `trainers/oge-course/index.html`. Проверки не ослабляются.

### Out of scope

- Переработка старых математических движков, их банка или прогресса.
- Сервер, авторизация, зеркальный режим, подключение нового раздела к
  управляемой сессии кабинета, миграция локальной истории между устройствами.
- Изменение реестра TID, семи учебных линий или рекомендации «Продолжить».
- Обязательная карта, процент «освоения всей математики», заявления о
  доказанной эффективности на учениках или полноте экзаменационного банка.
- Merge и deployment до отдельного явного разрешения владельца.

### Files or areas that must not change

- Прежние задания, генераторы, ключи ответов и ключи хранения тренажёров.
- `oge/registry.js`, `oge/learning-map*`, `oge/course-guide*`.
- `foundations/**`, `learning/**`, backend и bridge.
- Существующие защитные проверки, математические контрольные суммы
  и branch protection. Единственное изменение привязки HTML описано выше;
  исходные исторические записи и все остальные привязки сохраняются.

## Acceptance criteria

- [x] Из курса доступны все прежние темы, восемь сюжетов №1–5 и кабинет.
- [x] Все 15 новых тематических входов открывают нужную тему.
- [x] Корректный явный адрес приоритетнее последней темы; неверные параметры
  не ломают занятие. Ссылка на начатый маршрут не создаёт новый вариант.
- [x] Карта и полный список мастерских первоначально свёрнуты.
- [x] Пропуск мастерской сохраняет законченный результат обычной части.
- [x] Ответы, помощь, возврат к исходной задаче и незавершённая работа
  переживают перезагрузку без записи в прежние ключи хранения.
- [x] Старые адреса тренажёров сохранены; навигация работает без JavaScript.
- [x] Математический набор совпадает с подготовленным комплектом.
- [ ] Сборка воспроизводима; проверки курса и новой интеграции проходят.
- [ ] Браузерные проверки подтверждают узкий экран и управление клавиатурой
  либо явно зафиксировано, что именно осталось непроверенным.

## Checks and gates

- Required tests: перенесённые проверки данных/генераторов/интерфейса;
  `tools/oge-skill-course.test.cjs`; `tools/oge-skill-course.browser.cjs`;
  существующие `oge-learning-map`, `oge-course-guide`, `oge-learner-entry`,
  `oge-focus-navigation`.
- Required static checks: повторная сборка без diff, `git diff --check`,
  наличие целей ссылок, отсутствие записей в прежние ключи хранения.
- Manual checks: просмотр настоящих браузерных снимков в CI, если доступны;
  проверка текстов первого экрана и результата короткого маршрута.
- Final gate marker: `OGE_SKILL_COURSE_INTEGRATION_OK` only after its checks pass.
- Checks intentionally not run: реальное обучение ученика и синхронизация
  кабинета; эффективность и синхронизация не заявляются.

## Review plan

- Review-level rationale: перенос существенного самостоятельного учебного
  приложения с собственной локальной историей и несколькими видами заданий.
- Trainer design consultation applicable: yes; подготовленная концепция,
  содержательные проверки и два внутренних аудита использованы до внедрения.
- Provider/model: внутренние агенты ChatGPT текущей сессии, 2026-11-11.
  Внешняя консультация Claude не выполнялась и не считается полученной.
- Decisions: отдельная страница, добровольная глубина, прежние математические
  идентификаторы, отсутствие имитации подключения к кабинету.
- Ready-result review: независимая проверка diff и пользовательского пути,
  математические и технические проверки, честные границы результатов.
- External review required: нет отдельного запроса владельца на внешний
  сервис; внутренний обзор не записывается как внешний approval.
- Sanitized handoff: только публичный код и необходимый контекст; без
  секретов, персональных данных и абсолютных путей рабочей машины.

## Risk and rollback

- Risks: ссылка откроет прошлую тему; повторный вход изменит вариант;
  потеря контекста помощи; перегрузка первого экрана; конфликт с #550/#552.
- Rollback: отдельный revert этой задачи с удалением новых входов и раздела.
  Прежние данные не переписываются. Два ключа нового раздела можно оставить.
- Compatibility: сохраняются `mathexam.skillLab.v1` и
  `mathexam.skillLab.session.v2`, математические ID и подписи вариантов.
  История привязана к браузеру и origin; аккаунтная синхронизация не обещается.

## Permissions

- Implementation authorized by the current direct owner instruction: yes.
- Branch creation, local commits, push and Draft PR: within that instruction.
- Literal `START` token: not present; the exact authorization is quoted above.
- Merge allowed: **no**, pending separate explicit owner authorization.
- Auto-merge allowed: **no**.
- Deployment allowed: **no**, pending separate explicit owner authorization.
- The narrower repository rules supplied by the owner in this task conversation
  take precedence over the broader committed standing release policy.

## Execution record

- Actual branch: `feat/oge-skill-course-integration-20261111`.
- Actual base SHA: `19811cc15a33d63fc0fcc0b6a11c34863ec64d03`.
- Actual head SHA: supplied in the final PR handoff.
- PR: the Draft PR for this task branch is the authoritative head/CI handoff.
- Tests passed locally: mathematical data (2,345 checks); generated series
  (501,298 checks, 46,000 generations); arithmetic/functions/geometry expansions
  (1,926 / 542 / 923); foundation bridges (67,185); independent function checks
  (144); answer-format checks (7,498, 17 scenarios); core DOM (105); expansion DOM (74);
  integration DOM (10); existing map (13), guide (9), navigation (496 links).
- Source preservation: 13 content/runtime files and the mathematical checker
  are byte-identical to the prepared 0.3.0 source. Existing course HTML is
  byte-identical after removing only the added entry and stylesheet link.
- Internal ready-result review: no open blockers. Its CI baseline-fetch finding
  was corrected. Keyboard focus and continuation after a saved correct answer
  were also fixed and independently checked without adding result credit.
- Tests failed: obsolete storage-status wording in copied tests was corrected;
  no mathematical failure. The final CI record determines the release gate.
- Tests not completed locally: the legacy learner-entry gate did not finish
  in the partial clone; it reads historical Git objects and CI explicitly
  fetches its four pinned sources. The real Chromium gate and screenshot
  review run in CI.
- CI source commit: `7a273185deb80cfbe082ea2dcb48ea69fab46c63` passed the
  dedicated skill-course workflow, including real Chromium, and nine existing
  workflows: minimal course interface, learner entrances/returns, learning map,
  whole-course practice, PDF catalogue, linear pilot, SEO, GIF and lesson showcase.
- Screenshot review found too much introductory text before the first answer
  on a 320 px screen. The full topic description is now an optional details
  block after the task. Mobile navigation is shorter; 44 px controls and main
  text sizes are preserved. The browser gate now requires the question,
  answer and Check control fully inside the initial 900 px viewport at
  widths 320, 390 and 1280, before any scrolling. Final-head CI must confirm it.
- CI on `88506e52a9bee4302e86fd97ae739317f670a537` confirmed all three
  initial viewport checks and repeated the mathematical, DOM and existing
  course gates successfully. Its new keyboard scenario exposed a delayed
  native `details.toggle` event: choosing the current topic could close the
  teacher overview before its state was recorded. The fix reads the actual
  teacher `open` state before rendering. The browser assertion is retained;
  deterministic open/close regression checks cover the event-order boundary.
- Initial CI found one dependent metadata mismatch: the public-navigator
  manifest still named the old exact course HTML. The existing binding command
  is used with source `7a273185deb80cfbe082ea2dcb48ea69fab46c63` and exactly
  `trainers/oge-course/index.html`. This is committed source identity,
  not release approval. The test assertions and mathematical pins stay intact.
- Scope adjustment: one dependent navigator provenance record, required by
  the existing preservation gate. No additional product change. Resume and
  focus fixes remain within lesson navigation. Final-head CI is recorded in PR.

## Required handoff

```text
EXECUTIVE STATUS

Task:
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
