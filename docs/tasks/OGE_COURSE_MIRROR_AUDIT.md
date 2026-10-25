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


## Concurrent main evidence
- Authoritative GitHub main advanced during implementation to `3c6681b06313fb411b7b8e8c73dd62f08fbc0017`.
- Concurrent commits: `741e9ce987cc9bdb452463d2d835632e5233c472` (merged PR336, standalone college function course) and `3c6681b06313fb411b7b8e8c73dd62f08fbc0017` (merged PR337, canonical/sitemap corrections). Neither is silently included in this task's original base.
- Overlapping files: project status and the legacy №13 redirect; canonical correction and query-preserving navigation must both survive.
- Branch is not rebased/reset/merged automatically. A read-only virtual merge is required for the composed release evidence; no old release authorization covers this task.

## Bundle verification
- Rebuilt only the practical package with `--only=oge-1-5-trainers --downloads-only`; 398937 bytes,39 files. Two builds match SHA256 `1468930a0fe885fb58ee9ef02e4e9c8f0160baaf9f05e52e9ab537c0a99b23b3`.
- Offline/3D package suite14/14; extra offline boots for three diagnostics/percent4/4; parent shared-mode/bridge and all three adapters included.
- Navigation/UI final checks cover literal №13 aliases, traversal negatives, authoritative capability and canonical picker deduplication.
- Current production's independent college-course status entry was preserved verbatim while reconciling the task's project status; no concurrent runtime source was copied or overwritten.
