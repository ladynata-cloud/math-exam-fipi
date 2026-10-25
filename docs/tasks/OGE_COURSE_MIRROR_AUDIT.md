# Аудит и семантическое зеркало основного курса ОГЭ

## Identity
- Task: OGE_COURSE_MIRROR_AUDIT
- Owner: владелец MathExam
- Date: 2026-10-25 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: `8e681831e874a9af129f50c16179bd2a424c5474`
- Planned branch: `feat/oge-course-mirror-audit`
- Review level: HIGH
- Related ADR: 0003 Accepted; существующий зарегистрированный Trainer SDK/room contract установлен кодом и гейтами.

## Goal
Проверить содержание и учебные взаимодействия опубликованного курса ОГЭ; обеспечить действительное общее состояние его основных тренажёров между преподавателем и учеником и явно показывать ограничения остальных маршрутов.

## Context and evidence
- Текущий код: /trainers/oge-course/ содержит номерные страницы6–25 и карту1–5. /oge/ ведёт в этот курс.
- Номерные страницы:5 зеркал из20 (15–19, PR335). Карта1–5:1 зеркало из12 (roads-grid). Итого6 из32 основных тренажёров.
- ПредОГЭ, вычислительные лестницы, варианты и перекрёстные ресурсы составляют дополнительные ветки. Их инвентаризация/учебный аудит нужны отдельно; облачные личные попытки не равны общей комнате.
- PR335 уже опубликован точным деревом1fcdf47df45190a92c913453546e3c0f5c6db82d, все9 post-merge workflows pass, live15–19 проверены. Назначение пяти карточек выбранному ученику выполнено через private teacher UI и подтверждено reload/preview; данные ученика не включаются в репозиторий.
- Выявлены воспроизводимые дефекты: относительный допуск №25 принимает821 вместо820; отдельные ответы/поля сохраняют устаревший успех либо теряют ошибочный draft.

## Approved scope
### In scope
- Полный учёт32 основных тренажёров и отдельная карта поддерживающих веток; содержательная, математическая и педагогическая проверка.
- Добавить нативные семантические адаптеры недостающих номерных6–14,20–25 и практических1–5 там, где достоверное восстановление всех учебных действий подтверждено тестами.
- Каждая регистрация требует closed-schema state, регенерации из ограниченного descriptor, отсутствия peer HTML/ключей/личных данных; same-task draft, checks, step history, assistance, modelcontrols, handoff, latejoin, reload.
- Сохранить standalone behavior/progress; shared practice не импортирует и не записывает личные попытки и не заявляет самостоятельный зачёт.
- Исправить подтвержденные проверки ответов/сохранение draft/устаревший успех; не переписывать банки без математического основания.
- Понятный видимый статус реальной синхронизации в доске/каталоге; course links/redirects, registry/tests/CI, offline artifacts только если затронуты исходники.
### Out of scope
- Новый протокол/архетип, серверная аутентификация/биллинг/хостинг, изменение personal learning schema, массовое назначение другим ученикам.
- Переписывание всего ПредОГЭ и всех школьных курсов, автоматический перенос незавершённых roadmap инициатив. Неподключённые ветки должны быть названы явно.
### Files or areas that must not change
- Чужие курсы и текущие ученические работы; существующие25 mirrors и их contracts; secrets/access tokens никогда не попадают в diff/review.

## Acceptance criteria
- [ ] Отчёт связывает каждый основной URL с реально проверенной возможностью; не обещает зеркальность всего сайта.
- [ ] Новый adapter демонстрирует native standalone task и одинаковое восстановление teacher/pupil, ввода/ошибки/помощи/моделей, latejoin, control revoke, reload.
- [ ] Личные progress namespaces не читаются/не пишутся в room mode, принятый ответ не может показывать stale success после редактирования.
- [ ] №25 математический допуск отвечает заявленному формату ответа, drafts сохраняются.
- [ ] Existing mirrors, board writing/layout, registry readiness и course navigation сохранены.
- [ ] Конкретные неустранённые содержательные/педагогические ограничения честно перечислены.

## Checks and gates
- Native independent math gates; targeted DOM/state validators; real Socket.IO transport; board/registry regressions; links/SEO wherechanged.
- Cloud CI on exact head; read-only cloudbrowser production baseline and prepared UI staging whereavailable.
- Final marker: OGE_COURSE_MIRROR_AUDIT_OK only after required checks; not inferred from visible iframe.
- No real-pupil learning gain is claimed.

## Review plan
- HIGH: broad native runtimes and room isolation. Independent math/pedagogy/technical reviews and relevant full gates.
- Retain native learningsequence. A substantial design change would require focused Claude consultation; existing authorized API is unavailable (insufficient credits in prior same-session call; no repeated billing/retry attempt). This is not advice or approval.
- Final external review required or a new explicit task-scoped owner exception with rationale; PR335 exception does not apply.
- Handoff limited to publicsource/diff/tests, no student data/credentials/private absolutepaths.

## Risk and rollback
- Main risks: mismatch descriptors, forged state, eventecho, storagecross-contamination, lostdraft, unsupportedcontrols falselylabelledmirror.
- Rollback remove only newlyregistered adapters/code via normal reviewed revert, preserve existing25 mirrors and all savedpersonal namespaces. No database migration.
- Sharedroom state remains existing bounded TTL contract; personalwork unchanged.

## Permissions
- START: current user request «пересмотри еще раз весь курс ОГЭ ... по возможности синхронизировать с моей доской».
- Branch/localcommits/push/DraftPR allowed by requestedimplementation.
- Merge/auto-merge/deployment: no new authorization inferred from PR335 release; present exact tested result before required release decision.

## Execution record
- Actual branch: feat/oge-course-mirror-audit
- Actual base: 8e681831e874a9af129f50c16179bd2a424c5474
- Native algebra math gate: 668 checks, 0 failures; geometry: 1873 checks, 0 failures.
- Numbered adapters: foundation6–9 22 new tests plus68 regressions; 10–14 27 plus2 model checks; 20–22 15 new plus14 native regressions;23–25 full20/20/16 subtype journeys and notes/construction/validation.
- Practical: six providers7 plus2 targeted checks; native/discovery39; practical-minimal31; diagnostic and percent markers passed; percent actionclarity16; tires105 independent exact answers.
- Root native common/part2/special/UI regression76/76; real new transport26/26; old geometry+server transport13/13; registry25/25. No runtime failure remains in these suites.
- Independent crossreviews found and fixed: Escape/initial boot/saturated replay10–14; completed construction mismatch23; rejected notebook-cache poisoning and outbound byte budget20–22; relative redirect and duplicate picker alias13; practical numeric tolerance/model feedback.
- Initial harness failures (sparse missing dependencies, missing TextEncoder and incorrect generic fixture controls) were repaired without changing production limits. Historical inline snapshots updated only after source review, retaining math-bank checks; №21 normalization separately proves original math bytes unchanged.
- New helper asset URLs are versioned to avoid stale cached scripts. Downloadable practical bundle is rebuilt and checked separately.
- Exact head, cloud checks and composed-main evidence are recorded in the PR.


## Concurrent main evidence (initial read-only preparation)
- Authoritative GitHub main advanced during implementation to `3c6681b06313fb411b7b8e8c73dd62f08fbc0017`.
- Concurrent commits: `741e9ce987cc9bdb452463d2d835632e5233c472` (merged PR336, standalone college function course) and `3c6681b06313fb411b7b8e8c73dd62f08fbc0017` (merged PR337, canonical/sitemap corrections). Neither is silently included in this task's original base.
- Overlapping files: project status and the legacy №13 redirect; canonical correction and query-preserving navigation must both survive.
- Branch is not rebased/reset/merged automatically. A read-only virtual merge is required for the composed release evidence; no old release authorization covers this task.

## Bundle verification
- Rebuilt only the practical package with `--only=oge-1-5-trainers --downloads-only`; 398937 bytes,39 files. Two builds match SHA256 `1468930a0fe885fb58ee9ef02e4e9c8f0160baaf9f05e52e9ab537c0a99b23b3`.
- Offline/3D package suite14/14; extra offline boots for three diagnostics/percent4/4; parent shared-mode/bridge and all three adapters included.
- Navigation/UI final checks cover literal №13 aliases, traversal negatives, authoritative capability and canonical picker deduplication.
- Current production's independent college-course status entry was preserved verbatim while reconciling the task's project status; no concurrent runtime source was copied or overwritten.

## Latest-main integration and cloud validation
- Main advanced again to `d73200d80f81334699d2e78d0fcc22f45d7d7f2c` through PR338 (college functions board and cabinet). This supersedes the earlier composed-main release evidence; the original task base remains `8e681831e874a9af129f50c16179bd2a424c5474`.
- Frozen initial task head: `2141f16fa458c7d31a3919bdf58987c062a38c47`; initial remote Draft PR340 head: `840bd2411a2c9377dd159541f76e211d49b2ec7c`; both have tree `8cee97c68bf910a4b71308423753b6756e40c1b9`. The original local task branch remains frozen for provenance.
- An isolated virtual composition preserves PR336/337 canonical and college changes and PR338 college runtime, cabinet integration, registry entry and project-status sections. Six overlapping conflicts are resolved additively: registry unit/integration expectations, capability manifest, picker asset versions, board asset version and project status. The legacy №13 canonical fix and query/hash-preserving navigation both remain.
- Candidate counts are 51 mirrors and 75 catalog entries: 25 original mirrors plus the concurrent college mirror, plus 25 new OGE mirrors. Original-head counts 50/74 remain historical evidence. The main OGE course coverage remains 6→31 of 32, with no extra college credit.
- The integration delta initially comprised the original 71 task paths plus one integration-only path, `tools/trainer-registry-client-cutover-smoke.cjs`: retain every existing test vector and require the exact 51 IDs (26 current-main IDs plus the 25 curated OGE fixture IDs). Registry assertions likewise require 51/75. The shared picker/catalog cache token is `20261025-oge-course-college-mirror`, distinct from both published predecessors.
- Applicable composed-tree gates and exact blob/path provenance are recorded with the candidate in the PR after validation. Prior native-runtime CI evidence is reused only for byte-identical files; new integration checks are not inferred from the old virtual tree. After independent composition review and successful local gates, the Draft PR branch advanced by normal fast-forward to `7c22d6bd11e9dbbd0c639dba9ba7e01f0d4a9c0a`, with parents `840bd2411a2c9377dd159541f76e211d49b2ec7c` and current main `d73200d80f81334699d2e78d0fcc22f45d7d7f2c`; tree `c02cb19c60b028dcb9b678a7c1579af7250b911b`. This reversible preparation enables cloud browser gates; it does not merge into main, deploy, or grant release authorization.


## Cloud regression follow-up
- Full cloud CI on the composed head confirmed the new whole-course shared-practice gates, existing 15–19, practical discoveries, all exam-variant families, course-minimal mobile/desktop scenarios and the concurrent college course.
- The task-6 focused test still assumed a single script tag and a historical whole-repository scope. It now requires exactly one byte-identical native engine (SHA256 `442b9369cdbec829a8e379284e1fed90a253da4f85aaf880b50bdc63b6cedf24`) and the exact ordered three local board scripts with no inline payload or extra attributes. Frozen TASKS, independent arithmetic and native storage/network/eval prohibitions remain. The obsolete historical repository-wide path guard is replaced by this stronger engine-specific immutability check; current task scope is reviewed against the current base. Focused and native-hint tests: 39/39; five negative injection/order/engine probes rejected as expected. This adds one reviewed test path, before the additional event-order regressions below.
- The shared picker browser test found a real tablet layout regression at 768px: the newly visible status added a full row below the controls. The status now occupies the existing title-label area; mobile padding/gap are compacted. All status text and retry controls remain accessible. The existing `iframe.y < 205` layout assertion and all viewport checks remain unchanged. The CSS URL has a new `-2` version; runtime/catalog versions remain unchanged.
- Local Chromium installation failed because the download was not a valid complete archive; local live-browser results are not claimed. Exact-head GitHub Actions results, including the unchanged browser layout gate, are recorded in PR340 after the follow-up commit. Initial local test invocations without the existing jsdom dependency path failed at module resolution; corrected dependency configuration passed without changing tests for that environment issue.


## Native event dispatch correction
- Concurrent main PR341 (`4c42cb8328fc57ded507bd07ce5110caadb93bf9`) exposed a browser event-order hazard in the independent college adapter: a capture-listener microtask may run before native target handlers. Its five source/status/test changes are classified and preserved in the next composed tree; college code remains byte-identical to that main commit.
- The same hazard was independently reproduced in all seven new OGE adapter modules. Examples: the first reference zoom in №8 or probability outcome in №10 could be suppressed until another action; notes containing inequalities could be read before native normalization and rejected by the peer. Scripted jsdom dispatch alone does not reproduce browser microtask checkpoints.
- New capture→microtask checkpoint→native-handler regressions fail on the old schedulers and pass with a coalesced zero-delay task. Existing equality, apply/echo, personal-storage, replay and payload-size guards remain. Tests cover the first action, native answer feedback, normalized notes, optional models, coalescing and remote apply while a local notification is pending.
- An additional Playwright gate uses actual native locator input/clicks across all 25 new pages and applies each final published snapshot to a second native page before any next action. This is a recorder at the bridge boundary, not a claim of real network transport; the separate real SDK/Socket.IO gate covers the network and authorization. The original picker viewport test remains unchanged and runs in the same cloud job.
- The practical archive is rebuilt after the three scheduling changes: 399199 bytes, 39 files, 1297107 uncompressed bytes; SHA256 `e073d6bc19697920e2ec41a24d49c1039062c725483f6c1ff7cf7de3704e38f0`. Each of the three packaged adapters exactly matches its reviewed source. The earlier archive hash is historical evidence only.
- One unrelated combined cloud learning robot on head `7c22d6b` timed out waiting for a dynamically replaced grade-7 geometry start button; preceding 63-trainer/718-action remediation and all other earlier stages passed. Its unchanged runtime/test will be rerun on the final composed head; no unrelated gate is weakened or reported as passed.


## Existing 15–19 mirror follow-up
- The same native capture checkpoint was reproduced independently in the already-published common adapter for №16–18: the first help click could publish before the help panel opened. Its publisher now uses one coalesced zero-delay task with the existing apply/equality guards; pending work is cancelled on pagehide. The three page references use the new `20261025-native-events` cache token. Three new checkpoint tests fail on the prior adapter and pass after correction.
- №15 already commits owned state and renders before notification. №19 already uses a guarded zero-delay publisher and clears pending work during remote apply. Their runtimes remain unchanged. The existing roads-grid trainer likewise publishes only after committing and rendering its closed semantic state.
- The cloud browser suite is extended from the 25 new mirrors to all 30 numbered/new-practical mirrors by adding native 15–19 actions, help, reference/model interactions and first-event notification assertions. The separate established roads-grid room/browser gates cover the 31st supported OGE trainer.
- On intermediate head `ea5aa6a109ffb35ccac4539c8a885a345b224f2d`, the actual browser gate passed all 25 new mirrors and 88 native actions, with zero personal-store access or production room writes; the unchanged picker viewport/drawing/recovery gate passed. The extension and original16–18 correction require a new exact-head run; prior25 success is not represented as evidence for those additional five pages.
- Final changed-path count against main `4c42cb8328fc57ded507bd07ce5110caadb93bf9` is 83: 78 previously reviewed paths plus the existing16–18 adapter, its test and three page cache references. No registry schema/ID/version, authentication or personal progress contract changes are introduced by this follow-up.
