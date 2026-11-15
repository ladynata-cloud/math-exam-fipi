# ОГЭ №19: убрать отдельный блок исследований

## Identity

- Task: `OGE19_REMOVE_UNRELATED_MODELS_20261116`
- Owner: MathExam owner.
- Date: 2026-11-16.
- Base branch: `main`.
- Base SHA: `35e718ca74852857a86dfe9dcc68d091ce165308`.
- Planned branch: `codex/oge19-remove-model-block-20261116`.
- Review level: `MEDIUM`.
- Related issue or ADR: no architectural change; no ADR acceptance assumed.

## Goal

На странице №19 оставить работу с текущим утверждением и его собственной
наглядной подсказкой. Убрать дополнительный блок «Разобраться на модели»,
который предлагает независимые исследования и мешает понимать связь рисунка
с текущей карточкой.

## Context and evidence

- Владелец дал текущий `START`: «START: убрать блок в №19 и добавить нужные
  формулировки». Эта отдельная задача охватывает только удаление блока;
  добавление формулировок выполняется отдельной задачей, веткой и PR.
- `oge-video-models.js` выбирает исследования по номеру задания, а не по ID
  карточки. Для №19 предлагаются уроки про медиану/высоту и диаметр/прямой
  угол. При переходе к `reason` контейнер очищается и рисунок исчезает.
- Основная карточка уже имеет собственный путь: утверждение → необязательная
  подсказка → ответ → объяснение → другое утверждение.
- Альтернативный вход и скачиваемая версия уже не подключают дополнительный
  блок. В манифесте скачиваний все четыре `oge-video-*` файла входят в
  `offlineOmitAssets` для №19.

### Reconciliation with current production

`PROJECT_STATUS.md` прочитан. Перед стартом следующие ресурсы получены по
HTTPS с HTTP 200 и побайтно совпали с указанной базой:

| Ресурс | SHA-256 |
| --- | --- |
| `trainers/task19-trainer.html` | `a4f52b96194d7ecb28635b15e0f1780181a0abd654d9f41cca86e0690c2cc5f4` |
| `trainers/task19-visual-data.js` | `fd71a70c1b3ce75922b6bd19043c7e735d5809af2cd5a1d2fa05db10b6f4d691` |
| `trainers/geometry_statements_trainer_improved.html` | `20691d700222fb42bebb0a27f7e9bbd62d06b288663982de9df5160d9ed8489b` |

Опубликованный банк содержит 234 карточки. Это проверка выбранных ресурсов,
не приёмка всего сайта. Последующее объединение PR #618 в базу не затрагивало
№19. Отдельный status-only PR и изменение `PROJECT_STATUS.md` не требуются.

## Approved scope

### In scope

- Удалить комментарий и четыре подключения дополнительного блока из
  `trainers/task19-trainer.html`.
- Сохранить исторический список страниц и обратное преобразование старых
  подключений в `tools/oge-video-models-preservation.cjs`; явно отделить
  восемь текущих страниц с дополнительным блоком.
- Адаптировать текущие ожидания наличия блока №19 в:
  `tools/oge-video-models-preservation.test.cjs`,
  `tools/oge-video-models.browser.cjs`,
  `tools/oge-video-models-book-context.test.cjs`,
  `tools/book-edition/test_generator.py`,
  `tools/oge-book-exam.browser.cjs`.
- Расширить существующую браузерную регрессию в
  `tools/task19-visual-hints.browser.cjs`: отсутствие постороннего блока и
  работа подсказки, ответа, объяснения и следующей карточки на основном,
  альтернативном и автономном входах.
- Оформить эту спецификацию и результаты проверок.
- После проверки исходного commit `554a95a3c92610a4a52722509d993be5d19bc480`
  штатно обновить в `assets/assistant/page-rollout.json` только текущую
  привязку `trainers/task19-trainer.html` и соответствующую запись
  происхождения. Сохранить прежнюю историю, остальные привязки, helper,
  тесты и исторические/frozen pins.

### Out of scope

- Новые утверждения, математические исправления и расширение банка.
- Изменение общих исследований или их отображения в остальных тренажёрах.
- Изменение механики прогресса, сохранений, доски, управляемого режима,
  публикации или инфраструктуры.

### Files or areas that must not change

- Банк из 234 карточек, `task19-visual-app.js`, модели и справочные материалы.
- Все четыре общих файла `trainers/oge-video-*`.
- Исторические pins и fixtures, фиксированные `book/**` и `b/**`.
- `downloads/**`, `PROJECT_STATUS.md`, несвязанные страницы и workflows.

## Acceptance criteria

- [x] Основная страница №19 больше не содержит подключений `oge-video-*`;
  её native bytes совпадают с ранее принятой страницей без блока.
- [x] Браузерный gate подтверждает отсутствие дополнительного DOM,
  сетевых запросов и записей его прогресса.
- [x] Собственная интерактивная подсказка карточки, проверка ответа,
  объяснение, следующая карточка и сохранённый результат работают на трёх
  входах: основном, альтернативном и автономном.
- [x] Остальные восемь страниц сохраняют подключения дополнительных
  исследований; их native-byte и DOM-контракты пройдены.
- [x] Полные native-byte проверки №19 и остальных страниц, исторические
  отрицательные пробы и фиксированные книжные версии сохраняются.
- [x] Банк, runtime общих assets, автономные файлы и механика сохранений не
  изменены. Текущая привязка №19 в navigator manifest обновлена отдельно
  штатным механизмом, как указано в согласованном follow-up scope.
- [x] Все применимые локальные gates пройдены либо фактический блокер
  явно отмечен до передачи координатору.

## Checks and gates

- Required tests: существующие `tools/task19-*.test.cjs`, тесты
  `tools/oge-video-*.test.cjs`, проверки книжного генератора/контекста и
  независимой математики; применимые команды из workflow №19,
  `oge-video-models.yml` и `book-edition.yml`.
- Required static checks: синтаксис затронутых JS/Python, `git diff --check`,
  точный список изменений и сохранность запрещённых областей.
- Navigator follow-up: штатный preview/write для одной указанной страницы,
  `public-navigator-preservation.test.cjs`, `public_navigator_bindings.test.py`,
  `public-navigator-regression.cjs`, проверки home coverage и прежних
  исторических/native контрактов после смены текущей привязки.
- Manual checks: изучить браузерные результаты и изображения основного
  сценария на узком и широком экранах.
- Final gate marker: `OGE19_REMOVE_UNRELATED_MODELS_OK` после успешной
  проверки согласованного изменения.
- Checks intentionally not run and why: внешняя платная консультация не
  запрошена; публикационные проверки относятся к будущему разрешённому
  выпуску. Точные локальные команды и статусы дополняются ниже.

## Review plan

- Review-level rationale: ограниченная правка интерфейса затрагивает несколько
  проверок сохранности обычных и фиксированных книжных страниц.
- Trainer design consultation applicable: no external consultation needed for
  removal of an unrelated optional block; no new trainer or learning archetype.
- Before implementation: выполнен независимый разбор кода, подтверждены
  исчезновение рисунка на `reason`, отсутствие связи с карточкой и уже
  согласованный автономный интерфейс. Внешний provider не привлекался.
- Ready-result review: проверка точного diff и browser journeys координатором;
  изучение сохранности native checks, математики, прогресса и восьми других
  страниц. Реальный ученический пилот не заявляется.
- External review required: no; owner did not request it for this task.
- Sanitized handoff constraints: только scoped diff, команды и публичные
  сведения; без секретов, частных документов и абсолютных машинных путей.
- Required provenance if external review is used: provider, PR, base/head,
  verdict and verifiable source/time. No external verdict is claimed.

## Risk and rollback

- Main risks: слишком широкое исключение №19 из проверок может скрыть
  изменение основного тренажёра; удаление общих файлов сломало бы остальные
  страницы. Проверки будут явно различать текущие подключения и неизменные
  исторические pins, а не исключать защиту №19.
- Rollback plan: отдельным обычным revert восстановить этот scoped commit
  после разрешения владельца; миграций данных и разрушительных операций нет.
- Data or compatibility considerations: ключи и формат сохранений не меняются;
  исторические данные дополнительного блока остаются в браузере, а его уроки
  продолжают работать в остальных тренажёрах.

## Permissions

- `START` granted by owner in the current task conversation: **yes**, quote above.
- Branch creation allowed: **yes**, verified prepared clean task worktree.
- Local commits allowed: **yes**, coordinator will commit after review.
- Push allowed: **yes**, coordinator will perform it after review.
- Draft PR allowed: **yes**, coordinator will open it after review.
- Release authorization: the explicit `AGENTS.md` supplied by the owner in
  this conversation is narrower than the repository standing-release text.
- Merge allowed: **no** without separate explicit owner authorization.
- Auto-merge allowed: **no**.
- Deployment allowed: **no** without separate explicit owner authorization.
- This executing subagent stops after implementation and verification; it does
  not commit, push, open a PR, merge or deploy.

## Initial local execution record

- Actual branch: `codex/oge19-remove-model-block-20261116`.
- Actual base SHA: `35e718ca74852857a86dfe9dcc68d091ce165308`.
- Actual head SHA: base plus uncommitted scoped changes; coordinator commits.
- PR: not opened by the executing subagent.
- Commits: none by the executing subagent.
- Tests passed: listed below; local Node/Python/static checks pass.
- Tests failed: browser launch is `BLOCKED_ENV`, before opening any page.
- Tests not run: real browser journeys and visual inspection await the normal
  GitHub CI browser environment. No browser success is claimed.
- Scope deviations: none.

### Local commands and results

Node 24.22.1, jsdom 26.1.0 and Playwright 1.62.1 were used. `CI=1` was a local
script flag only; these results are not a GitHub Actions run. Historical
lookups used `GIT_NO_LAZY_FETCH=1` after diagnosing missing partial-clone
objects. Two missing blobs were downloaded from their exact public GitHub
commit, checked against the Git blob SHA from the committed tree, and added
to the local object store. No ref, pin or historical file was changed.

| Command | Result |
| --- | --- |
| `node --test tools/task19-*.test.cjs` | PASS, 92 tests |
| `node --test --test-concurrency=1 tools/oge-video-*.test.cjs` | PASS, 59 tests; includes independent Python receipt probes |
| `node --test --test-concurrency=1 tools/oge-course-algebra.test.cjs tools/oge-course-geometry.test.cjs tools/oge-course-proof.test.cjs tools/oge-geometry-minimal.test.cjs tools/oge-part2-minimal.test.cjs` | PASS, 95 tests |
| `node --test tools/oge-book-corrections.test.cjs tools/oge-book-exam-corrections.test.cjs tools/oge-video-models-book-context.test.cjs` | PASS, 45 tests |
| `node tools/oge-algebra-contract.test.mjs` | PASS, 668 checks; `OGE_ALGEBRA_GATE_OK` |
| `node tools/oge-geometry-contract.test.mjs` | PASS, 1873 checks; `OGE_GEOMETRY_GATE_OK` |
| `python3 tools/book-edition/test_generator.py` | PASS, 16 tests |
| `python3 tools/book-edition/test_package.py` | PASS, 16 tests |
| `python3 tools/oge-worked-steps-book-context.test.py` | PASS, 6 tests |
| `python3 tools/book-edition/verify.py --base 35e718ca74852857a86dfe9dcc68d091ce165308` | PASS; both protected editions, 71 entries / 225 files each |
| `node --check` for all six changed JS files, three main task19 scripts and the unchanged shared model engine | PASS, 10 files |
| Python AST parse of `tools/book-edition/test_generator.py` | PASS |
| `git diff --check` and exact changed-file/protected-byte comparison against the base | PASS |
| `node tools/task19-visual-hints.browser.cjs` | BLOCKED_ENV at Chromium launch |
| `node tools/oge-video-models.browser.cjs` | BLOCKED_ENV at Chromium launch |

The first Node attempt lacked sparse-checkout fixtures; the next diagnosed two
missing historical blobs. After restoring only the required tracked fixtures
and verified objects, the complete Node suites above passed. These setup
failures were not resolved by changing expectations or historical pins.

Both browser attempts failed in `process_singleton_posix.cc` with
`socket() failed: Operation not permitted` before creating a usable page.
The standard bundled headless shell was absent; its ordinary installer returned
an empty/incomplete archive and was stopped. No custom bypass flags were used.
There are no local screenshots or successful browser journeys for this change.

The full browser jobs in `task19-visual-hints.yml`, `oge-video-models.yml` and
`book-edition.yml`, including source/frozen book journeys and the independent
mathematical verification of their new evidence, remain required in GitHub CI.
They are not waived. The coordinator will inspect resulting screenshots before
the final gate can become `OGE19_REMOVE_UNRELATED_MODELS_OK`.

The coordinator independently reviewed the scoped code diff: no findings.
This is technical review of the working diff, not an external provider verdict,
browser acceptance or release authorization.

### CI follow-up: current navigator source binding

Draft PR #624 открыт координатором. На проверенном source commit
`554a95a3c92610a4a52722509d993be5d19bc480` успешно завершены GitHub Actions
`Task 19 visual hints` (run `43765081467`) и `OGE video model investigations`
(run `43765081548`). Первый проверяет полный путь карточки на трёх входах
при ширине 360/1280, второй — отсутствие дополнительного блока №19 и
сохранность остальных страниц. Координатор просмотрел шесть репрезентативных
изображений трёх входов на узком/широком экране: замечаний нет. Это результаты
GitHub CI и технического просмотра указанного source commit, не локальный
browser PASS и не разрешение выпуска.

`Public navigator visibility` (run `43765081502`) выявил ещё одну текущую
привязку: `public-navigator-preservation.test.cjs` ожидал полный HTML №19
до согласованного удаления дополнительных подключений. Фактический SHA-256
`6ad106a63c13ca7d05653f22f1a3d8ac14cef14d0ce7aad878a7ae623eae0f35`
вместо прежнего
`a4f52b96194d7ecb28635b15e0f1780181a0abd654d9f41cca86e0690c2cc5f4`
объясняется ровно этой проверенной правкой. Навигационные includes не
менялись. Ошибка загрузки navigator artifact вторична: браузерный шаг ещё
не запускался из-за раннего выхода regression gate.

Координатор разрешил узкое обновление текущего source binding штатным
`tools/public_navigator_bindings.py`. Preview с `--source-base
554a95a3c92610a4a52722509d993be5d19bc480`, `--task
docs/tasks/OGE19_REMOVE_UNRELATED_MODELS_20261116.md` и `--paths
trainers/task19-trainer.html` вернул `BINDINGS_PREVIEW`: изменяется ровно
указанная привязка, HTML-файлов записано 0, approval не создаётся. Перед
preview восстановлены необходимые tracked public-page fixtures в отдельном
sparse worktree; другие worktrees и содержимое файлов не изменялись.

Эта запись и расширение списка допустимых файлов сделаны до `--write`.
После записи независимо подтверждено: изменена одна привязка из 624,
сохранены все 122 прежние provenance rows и остальные поля manifest;
добавлена одна запись с точным source commit и этой задачей. Helper, tests,
исторические pins, HTML и автономные файлы не изменены. Повторный preview
вернул `BINDINGS_CURRENT`. Новые значения текущей привязки:

| Значение | SHA-256 |
| --- | --- |
| HTML до навигационных includes | `9e56151af7320311f08bc5ccb7100dbadadfe89884b87add38b8780bc5d018bb` |
| Полный текущий HTML | `6ad106a63c13ca7d05653f22f1a3d8ac14cef14d0ce7aad878a7ae623eae0f35` |

Повторные локальные проверки после записи:

| Команда | Результат |
| --- | --- |
| `node --test tools/public-navigator-preservation.test.cjs` | PASS, 4 теста; полный inventory и отрицательные пробы |
| `python3 tools/public_navigator_bindings.test.py` | PASS, 5 тестов |
| `node tools/public-navigator-regression.cjs assets/assistant/navigator-data.js` с отдельным временным JSON-отчётом | PASS, 43 сценария |
| `node tools/public-home-coverage.cjs` | PASS, 743 eligible: 736 прямых входов и 7 перенаправлений; failures 0 |
| `node --test tools/public-home.test.cjs tools/rounding-focus.test.cjs` | PASS, 14 тестов |
| `node --test tools/task19-*.test.cjs` | PASS, 92 теста |
| `node --test --test-concurrency=1 tools/oge-video-*.test.cjs` | PASS, 59 тестов |
| `node --test --test-concurrency=1 tools/oge-course-algebra.test.cjs tools/oge-course-geometry.test.cjs tools/oge-course-proof.test.cjs tools/oge-geometry-minimal.test.cjs tools/oge-part2-minimal.test.cjs` | PASS, 95 тестов |
| `node --test tools/oge-book-corrections.test.cjs tools/oge-book-exam-corrections.test.cjs tools/oge-video-models-book-context.test.cjs` | PASS, 45 тестов |
| `python3 tools/book-edition/test_generator.py` | PASS, 16 тестов |
| `python3 tools/book-edition/test_package.py` | PASS, 16 тестов |
| `python3 tools/oge-worked-steps-book-context.test.py` | PASS, 6 тестов |
| `python3 tools/book-edition/verify.py --base 35e718ca74852857a86dfe9dcc68d091ce165308` | PASS, обе защищённые версии: 71 entry / 225 files |
| `node --check` для трёх navigator/home scripts и `git diff --check` | PASS |

Первые попытки inventory/home tests обнаружили отсутствующие sparse fixtures,
включая исключённые автономные HTML и `utils/lib.js`. Восстановлены только
нужные tracked bytes текущего commit с проверкой Git blob SHA, после чего
тесты прошли. Настройки, ожидания и pins ради окружения не менялись.
Локальный браузер повторно не запускался после установленного ограничения
`socket EPERM`; окончательный CI требуется на новом commit. Merge/deploy
не разрешены.

## Required handoff

```text
EXECUTIVE STATUS

Task: OGE19_REMOVE_UNRELATED_MODELS_20261116
PR: https://github.com/ladynata-cloud/math-exam-fipi/pull/624 (Draft)
Base: 35e718ca74852857a86dfe9dcc68d091ce165308
Head: 554a95a3c92610a4a52722509d993be5d19bc480 plus local navigator-binding follow-up
Gate: FOLLOWUP_LOCAL_PASS; final exact-head CI pending
Tests: Task19/OGE-video CI and root visual review pass on source head; post-binding local gates pass
Failures: source-head current navigator binding mismatch corrected locally; local Chromium EPERM remains documented
Not run: CI on the pending follow-up commit, external provider review, release/live verification
Scope deviations: one necessary current binding refresh explicitly approved by coordinator; historical pins unchanged
Recommendation: review two-file follow-up, publish through coordinator, then inspect exact-head CI
Next user decision: separate explicit merge authorization after review
```
