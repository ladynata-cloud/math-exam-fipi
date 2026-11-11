# Единая доска — checkpoint 11 ноября 2026

## Implemented
Локальная проекция ожидающих stroke/erase/undo сохраняет видимые записи при переключении, resize и восстановлении sessionStorage. Проекция ограничена автором, рабочим местом и boardAssignmentId. Она не изменяет серверный snapshot, payload, журнал или права. ACK/окончательный отказ удаляют соответствующую metadata. Адресный ластик может удалить ожидающий штрих. Undo ожидает подтверждения предыдущих операций чернил, чтобы отказ нового штриха не привёл к удалению более старого.

В `tools/unified-board.browser.cjs` добавлен сценарий: задержать POST; нарисовать; перейти SpaceMath→Доска; изменить размер окна; проверить реальные пиксели canvas; стереть ожидающий штрих; снять задержку и проверить серверный итог. Ни история, ни демонстрация не получают локальное preview.

## Verification at initial checkpoint
- 102/102 model, expression, assets, bridge and new ink tests PASS (включая 12 новых ink tests).
- 32/32 targeted group server contracts PASS.
- node --check для двух runtime-файлов и browser test; git diff --check PASS.
- Полный локальный server run: 382 PASS / 22 FAIL, неполный sparse checkout не содержал fixtures, assistant-service и несколько trainer HTML. Этот запуск НЕ является full-gate pass; требуется полный checkout в CI.
- Реальный browser gate локально не стартовал: Chromium process_singleton socket EPERM до загрузки страницы. Ограничение окружения, не пройденная UI-проверка. Не обходить sandbox; выполнить штатный workflow GitHub Actions на точном head.
- Независимый технический просмотр двумя агентами текущего patch: блокирующих дефектов нового preview не найдено. Это внутренний review, не внешний Claude-аудит и не проверка с реальным учеником.

## Next priorities for the bounded continuation
1. Проверить CI нового Draft PR и устранить фактические failures, не ослабляя gates. Сначала довести до конца эту правку, а не начинать ещё одну доску.
2. Дополнить browser evidence потерей ACK после durable append, reload и окончательным отказом ink. В этом checkpoint эти границы покрыты helper tests, но не всем UI/pump.
3. Отдельно исправить предсуществовавшую смену авторства очереди: queueKey содержит только lesson id; смена teacher→pupil в той же вкладке того же урока может отправить прежнюю очередь под новым Bearer. Новый preview скрывает чужую metadata, но старый pump проблему не исправляет. Нужна явная привязка очереди к principal, совместимое восстановление и API/browser test. Не заявлять такую смену безопасной до исправления.
4. Затем безопасное согласование с main и проверка текущих release dependencies #529. #532 не включён. Не менять ученические /data ради теста. Backend reader до frontend; backup+restore и live capability обязательны.
5. Последующий полезный объём выбирать по завершённости сценария урока: понятное сохранение, возвращение к материалам, проверенные инструменты и адаптеры. Текст/PDF/картинки требуют самостоятельной схемы/приёмки, не добавлять наскоро ради количества.

При потере ACK и последующем изменении той же линии второй вкладкой локальное preview может временно отставать до окончательного ответа. Сохранение не объявляется завершённым по одному preview. Физический планшет/стилус и реальный урок не проверены.

## Release state
Этот patch основан на Draft #529, не на production main. Он не опубликован. Зависимость #529, серверное обновление, согласованная копия /data и browser gates остаются условиями выпуска. Общую авторизацию повторять не требуется; реальные технические holds не сняты. Статья Хабра не изменялась и не публиковалась.

```text
EXECUTIVE STATUS
Task: UNIFIED_BOARD_CONTINUITY_20261111
PR: pending creation
Base: a385e9dcb6d64b7d466d2174598b76586f7ea310 (#529)
Head: use actual branch head
Gate: UNIT_READY / BROWSER_CI_PENDING; not release-ready
Tests: 102 model/bridge/ink; 32 group contracts passed
Failures: incomplete-checkout full server run (22); local Chromium EPERM
Not run: completed real browser gate, production rollout, real pupil pilot
Scope deviations: none
Recommendation: complete CI and continuation priorities above
Next user decision: none for continued scoped implementation
```

## Continuation — 11 November, principal-bound recovery
Freshly verified: workflow [42920531165](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42920531165) completed successfully for d0c98475. Full server contracts, models/bridge, eight-learner browser regression and unified materials browser scenario all passed. This resolves the initial browser-CI pending status and confirms the partial-checkout local failures were not release evidence.

New implementation: queue v2 is keyed by canonical server origin, lesson and server-authenticated principal (teacher or pupil seat). Its stored envelope must match that principal. A teacher queue is neither loaded nor sent under a pupil invitation; returning as the teacher restores the original queue. Tokens are not included in queue keys/envelopes. Corrupt/mismatched v2 storage is preserved and further queue writes are blocked. Ambiguous legacy storage is retained untouched and never adopted automatically; a neutral warning reveals no foreign payload. Automatic legacy recovery is intentionally unavailable because its original author cannot be established.

Added four queue unit regressions and a real browser scenario: teacher stroke receives 503, same tab opens pupil link, no POST/replayed stroke occurs, teacher link resumes exactly one original-author stroke and removes it. Existing eight-learner queue assertions updated to the new keys without removing their lost-ACK coverage. The initial schema and journal are unchanged.

Next checkpoint: verify CI of the new head, then add ink-specific lost-response-after-append/reload/permanent-reject browser cases. No local Chromium retry or sandbox bypass performed. Independent technical review and final tests recorded in subsequent checkpoint below. Publication and actual pupil lesson remain not performed; #529 holds remain in effect.

Review follow-up: independent reviewer identified misleading saved status and enabled editors when v2 recovery is blocked; fixed all three editors and status. Added corrupted-envelope browser assertion preserving exact bytes, and malformed queue-entry validation to fail closed instead of crashing render. Empty legacy queues do not trigger a warning. Unit/model/bridge/assets suite passed 106 tests before the final malformed-entry regression; focused ink+queue suite now passes 17 tests. Full new browser gate remains required in CI. Live recheck still reports only two group trainers without geometry/insert/surfaces; SpaceMath public page still 404. No deployment attempted.


## Continuation — ink fault recovery
Confirmed current base head 5c9d9c106510ec3200a1411a7fbe097950c0b677 and successful full CI [42927803624](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42927803624). Principal-bound queues are implemented and verified; the earlier numbered backlog above is historical.

Added tools/group-board-ink.browser.cjs to the unified browser gate using a separate browser context and synthetic lesson only. It deliberately loses responses after successful server acceptance of stroke and undo, reloads the same tab, verifies retained opId, actual canvas pixels, canonical work identity after retry and absence of double application. It also rejects a pending stroke with403, checks removal of local preview, unchanged durable ink, retained rejected queue across reload and a credential-free downloadable recovery file. This is substantive executable acceptance work, not a production/UI claim before CI completes.

Runtime/server code is unchanged in this increment. Syntax and diff checks pass. Browser execution remains in CI because local Chromium is blocked by EPERM; no bypass attempted. Next: inspect the exact new head CI; fix actual failures; then reconcile dependencies/main and backup/restore readiness, or continue bounded usability work if deployment remains blocked. No merge/deployment or real-pupil lesson performed.


## Continuation — storage failure and main compatibility

Previous exact head `0825f4cd732f245bd83062d6a284c5a7c2d38691` completed [CI42936163573](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42936163573): full server suite, models, eight learners and ink stroke/undo lost-ACK, reload, rejection/export browser scenarios PASS. The earlier pending status is historical.

New runtime change: when the browser cannot write the principal-bound queue, the current action stays in memory and continues sending, but all three editors stop accepting additional edits. The status explicitly reports missing browser backup; a server ACK does not hide a continuing storage failure. Teacher and pupil can download their own unsent/rejected actions without credentials. The previous stored envelope is not removed. A successful later checkpoint resumes editing; refused actions remain recoverable. Startup probes storage before accepting edits. Before-unload protection also covers rejected actions that have no current backup.

Independent internal review identified a combined-failure gap: storage recovery must not wait for a successful server GET. Fixed: periodic local checkpoint runs before the network request. Added real Chromium acceptance for teacher ACK, pupil permanent rejection and simultaneous storage/POST/polling failures. The last scenario restores the local backup while server endpoints still fail, reloads with the original opId, then verifies one durable stroke after network recovery. Only synthetic lesson data is used. New browser execution is required in CI; local Chromium EPERM is not bypassed.

Local checks: 107/107 model/expression/assets/bridge/ink/queue tests PASS; syntax and diff checks PASS. Independent follow-up found no remaining blockers after the combined-failure fix (runtime blob `6f4e869cc37143ff6a09b43184cb2b7d68a65054`, storage test `28702beacf2503145da714c46e886d7d369531a6`). Current-head browser CI must still complete before declaring this increment verified. No full local server claim: the sparse checkout remains unsuitable for its complete asset-dependent suite.

Read-only main composition, before this storage increment:
- Authoritative main: `19811cc15a33d63fc0fcc0b6a11c34863ec64d03`; task head: `0825f4cd732f245bd83062d6a284c5a7c2d38691`.
- Common ancestor: `82ed551bd6922eb4e84551ec8dbfdcc387a4e6d8`.
- `git merge-tree --write-tree` succeeded without conflicts; tree `8e25b6fa3f2edcd4f18b91227ba37d638f9dcef3`.
- Main carries 67 concurrent commits / 397 changed files: published OGE models/routes/equations, division, Atanasyan construction controls, Alimov, EGE base/profile maps and hints, navigator source bindings, CI fixes and history-preserving composition. These are existing main changes, not additions to board scope.
- Board integration changes 48 files. File overlap with main: zero. Virtual delta from main: exactly those 48 files, identical task blobs. All 397 main-only blobs preserved. Stable patch ID before/after composition: `ed03f136098bfa5a2fe6e3409d4014d234e28553`.
- This proves clean source composition of that pair, not full CI of a main-based candidate or deployment. The stacked PR target remains #529; no shared integration ref was moved. Recompute after any head/base change before actual integration.

Release prerequisites remain: upgraded journal reader before frontend, consistent /data backup and verified restoration, exact-candidate gates and public capabilities. Neither production data nor reader rollback was touched. #532 remains separate. Real pupil lesson and physical tablet/stylus testing were not performed. Next: read current CI and correct failures, then complete composition validation/release prerequisites or continue the next bounded reliability check.


CI follow-up: [42943765929](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42943765929), head `6610ebb3df5055208977f2fb4e43017b44bf4cda`, passed full server, 107 model tests, eight-learner browser and teacher storage-failure scenario. Unified browser then failed waiting for the pupil's transient refusal notice: the next periodic backup retry legitimately replaces it with the persistent storage warning. The test now checks the stable downloadable rejected action and its original opId/error while storage is still unavailable, then retains all storage-recovery/reload assertions. No runtime or gate removal. New exact-head CI is required.

The storage increment also composes cleanly with the same main: virtual tree `33530ee422ce26d1a1e1a0e43b69f297b0cf812a`, 49 task files, zero overlap with 397 main files, exact task delta/blobs and every main-only blob preserved. This is still read-only composition evidence, not a deployed/main-tested candidate.


Second CI follow-up: [42944246897](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42944246897), head `46b3d1c5522a9c348158cb5c099ceee215824d28`, passed full server, 107 models, eight learners, all three new storage scenarios and ink fault recovery. A later pre-existing simultaneous-ink case failed after server restart. Its draw helper did not wait for the still-open teacher tab to reconnect; the synthetic journal contains only the pupil stroke after restart. This evidence is consistent with a reconnect race, not definitive proof of a runtime loss. The helper now waits for the actual enabled pen and selects it before drawing. Independent review confirmed this test gap; the concurrent case additionally waits for both participants to be ready and requires one distinct stroke POST from each page. The +2 canonical strokes, two distinct authors, unchanged geometry/trainer and peer-isolation assertions remain. This makes the test require reconnection before input rather than treating ignored input on a disabled canvas as a save failure. No runtime change in these two CI follow-ups; exact-head rerun remains mandatory.


## Verified checkpoint — 11 November, storage recovery complete

[CI42944962962](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42944962962) on exact code/test head `c10b096583fb5618dcb5e90f4d5880b69f9abbdf` is SUCCESS: 428 server contracts, 107 models/bridge/ink/queue, eight-learner browser and full unified browser (`UNIFIED_BOARD_BROWSER_READY`). All three quota-failure scenarios, ink lost-ACK/reload/rejection, material switching, controls, restored server and simultaneous teacher/pupil strokes passed. The two earlier CI failures and their test corrections remain recorded above. Independent review of c10b096 found no blockers. This checkpoint changes documentation only; code/test blobs remain those verified on c10b096.

Latest read-only composition: c10b096 + freshly rechecked main `19811cc15a33d63fc0fcc0b6a11c34863ec64d03` gives clean virtual tree `1d7af7b0479b1d5a15d185f34ea9c346f6212fc7`. Source compatibility is established; actual main synchronization and full composed-candidate CI are still not performed. #529 head remains a385e9dcb6d64b7d466d2174598b76586f7ea310. No competing change to its ref was made.

Next continuation: read actual CI of the latest docs checkpoint (public navigator checks were still running at this record), then finish main-based candidate validation and investigate safe backend backup/restore/release access. Do not repeat the completed storage implementation or reopen old transient-oracle failures as runtime defects. If backend release access is unavailable, continue one bounded lesson-reliability scenario, keeping current holds. Public status remains two group trainers without unified capabilities, and SpaceMath URL404. No merge, deployment, production-data change, real-pupil lesson or physical-tablet test was performed.


## Continuation — executable main composition gate

Freshly confirmed head44234234584bd1a28c3685fc9e7494045f76d2b2 has all seven checks successful; main remains19811cc15a33d63fc0fcc0b6a11c34863ec64d03. No competing branch change or unfinished local implementation was found.

Implemented a separate main-composition CI job, leaving the original board job intact. It checks out the exact task head, fetches the reviewed main, rejects unexpected main movement or any overlapping file, builds a temporary merge-tree, verifies exact task delta and every affected blob from both branches, then runs full server contracts,107 models and both real browser suites from an archive of that composed tree. The proof artifact records head/main/ancestor/tree/file lists. No repository ref or production data is changed. A passing job does not authorize release or claim all unrelated course gates were rerun on the composed tree.

Added three executable temporary-Git regressions: both branches and a deletion survive without ref changes; overlapping files fail closed; main movement fails closed. All3 PASS locally. The real current pair also passed local composition verification. Independent review found an unavailable workflow expression context in job defaults; corrected to step-level working directories before publishing. Cloud execution of the new exact head remains required. Local Chromium is still not invoked due EPERM. Next: inspect both CI jobs and fix actual composition failures; then address backend-first, consistent /data backup/restore and exact release candidate. #529/#532 holds remain; no deployment or real pupil lesson performed.

### Main composition verified
[CI42950143915](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42950143915) completed both ordinary and main-composition board suites successfully on ca9f09492cffc26c961abf27d517b048d0fcfa87. The composed tree is b30841866e4968933e1aea645ef2bf78de868ed9, main19811cc15a33d63fc0fcc0b6a11c34863ec64d03, ancestor82ed551bd6922eb4e84551ec8dbfdcc387a4e6d8. Full server/models, eight learners, storage/ACK/reload, material switching, handoff and simultaneous handwriting PASS on composed sources. The proof and browser artifacts are attached to that run. This is stronger than the earlier source-only virtual merge evidence.

Follow-up review scoped the fixed-base composition job to this task branch (PR and manual dispatch), so historical EXPECTED_MAIN will not block unrelated future work. Ordinary board CI stays unconditional. This final workflow/docs change requires its own CI; application/test sources are unchanged. A passing composition proves only the recorded pair; before release recheck authoritative main/head. No remote main or #529 ref moved, no release hold removed. Live recheck: backend200, durable=true, two group trainers, no geometry/insert/surfaces; SpaceMath404. Next: verify latest CI then resolve safe backend release access, consistent /data backup and restore proof. Real pupil lesson and physical tablet still not performed.


## Continuation — isolated backup restoration rehearsal
Fresh head af5a4c22478da0bd0d4d0fb65261c7255211a8e7: all eight checks SUCCESS, including both ordinary and current-main composition. The previous pending navigator status is historical. Connected local Browser tool is unavailable (unknown tool); available cloud tabs do not contain an Amvera management session. No authenticated volume/backup operation was established. This is a release-access limitation, not a reason to stop permitted repository work.

Added two real filesystem/store regressions in group-geometry.test.js. A closed synthetic store is copied to an independent reference backup and then a separate writable restore directory. The restored reader must preserve all three materials, generation IDs/versions/controllers, teacher/pupil access, history, presentation and peer isolation. A lost-ACK stroke replay must keep the same revision and byte digest; a new action must append only to the restored journal while source and reference backup stay byte-identical. A complete unsupported event in a copied journal must fail closed without silently removing it or touching the source. No production path, credential or pupil record is used. Runtime/schema is unchanged.

Local focused geometry suite:17/17 PASS (previous15 plus2 new), syntax/diff checks PASS. Independent technical review found no blockers and independently repeated17/17 PASS (reviewed test blob e7440c60dff338ea615ebe1a8def3ed9795f895f). Full exact-head CI remains required. Existing workflow automatically exercises these tests in both ordinary and main-composed full server suites and repeats both browser suites.

### Actual release prerequisites still outstanding
The rehearsal is NOT a production /data backup or a restore of real pupil data. Before rollout, establish authenticated access to the correct Amvera project and its persistent volume; record the deployed reader and candidate SHA, mount and all writer paths. Obtain a consistent private copy of the entire required dataset, using a supported volume snapshot or a controlled quiescent window for every writer. Copying only group journals does not cover progress.json or learning.sqlite and its WAL state. Do not copy active SQLite files independently or remove live locks as a test.

Restore into a separate isolated volume with the candidate reader, never over live data. Keep the reference backup immutable, preserve access restrictions (journals contain invitation credentials), check counts/digests and all storage families, then confirm lesson materials, history, rights and dedup. Keep backup contents out of GitHub/artifacts/reports. The synthetic tests only demonstrate the group-journal portion. Upgrade backend before frontend, verify live geometry/insert/surfaces capabilities and candidate identity; no rollback to a reader that cannot understand newly appended events. All #529/#532 holds remain until actual operational evidence exists. No deployment or real pupil lesson performed.

Next: read exact new CI/review results; continue a bounded reliability fix if management access remains unavailable. Do not equate this rehearsal with completed production backup/restore.


## Continuation — pointer ownership during handwriting
Fresh head607d27685048eda429413200b0ec13d077b75423 has26successful checks and one intentionally skipped publication check. CI42956355914 passed430server tests,107models and both browser suites on the branch and main composition; main remains19811cc15a33d63fc0fcc0b6a11c34863ec64d03. No competing local or remote changes were found.

Found a concrete runtime loss: startDraw overwrote an existing drawing on a second pointerdown; any pointermove/up could extend or finish it. Bind a stroke to its initial primary pointer, ignore secondary input, and share finishDraw between release, cancellation, navigation and native lostpointercapture. Clear the active gesture before releasing capture so the later native event cannot enqueue the stroke twice. Original target/generation, queue and server protocol stay unchanged.

Added trusted Chromium CDP multi-touch regression: second finger neither replaces nor ends the first stroke, first finger continues after secondary release, saved coordinates contain only its path, and exactly one stroke POST is sent. Native capture release while mouse remains held must save once, with subsequent pointerup adding no duplicate. Tests undo their synthetic fixtures before existing lost-ACK/reload/permanent-rejection scenarios. These run inside the existing real browser gate on both ordinary and main-composed sources. No physical device or real pupil data is involved.

Local107model/bridge/ink/queue tests and syntax/diff checks PASS. Local Chromium remains not run (known EPERM; no bypass). Independent review found and corrected two test issues before push: CDP touchEnd must identify the finger being released, and cleanup must tolerate an already-ended gesture. Added explicit pointer-ID assertions. Reviewer found no remaining blockers on runtime blob543a842387e23fb8306238b3c26dc8ea51a03552 and browser blob4d2391f59ed3102c1a69c7378d7b4a6cf228a209. Exact-head cloud browser results remain required before marking this increment ready. Release access, consistent production /data backup/isolated restore and backend-first deployment holds remain unchanged.


### Pointer ownership verified; unfinished-gesture unload guard
[CI42963445113](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42963445113), heada036cd57d143bcc1b3781db6487aec8ecbe7b152, passed both ordinary and main-composition jobs:430server,107models, eight learners and full unified browser. Both logs explicitly report trusted Chromium multi-pointer ownership, native capture-loss exactly-once save, durable ACK/reload/rejection and UNIFIED_BOARD_BROWSER_READY. Composed tree2f481f2a3c66a7335350783392a8b5c5a64fad9d on main19811cc15a33d63fc0fcc0b6a11c34863ec64d03. All26general checks on a036cd57 subsequently completed SUCCESS; publication intentionally skipped. Fresh live read still backend200/durable with2trainers and no unified capabilities; SpaceMath404. No production data was changed.

Follow-up review found one preexisting edge in #529 and607d276: a held, unfinished stroke is memory-only, and beforeunload warned for queued/rejected actions but ignored drawing. Added drawing to the existing warning condition without clearing or enqueueing anything during unload. This lets the author cancel an accidental reload. It does NOT recover unfinished input after accepted reload, a crash, or unavailable browser prompts.

Real Chromium regression holds the mouse down, records the original document, reloads and dismisses the native beforeunload dialog, then finishes the original gesture and requires one POST and one canonical stroke with its original path. Synchronous beforeunload evidence requires an empty queue and active native pointer capture, so the old outbox guard cannot accidentally satisfy the test after capture loss. Fixtures are undone before existing fault scenarios. Local107tests and syntax/diff PASS. Independent review confirmed runtime93b924dd06059e4df3ed6c9bfe329351d392182b and test e34e0ff053097d5b3147c1719e8643fabdfe6064 after strengthening that unload oracle; no remaining review blockers. Exact new browser CI remains required. Release holds, actual backup/restore, physical tablet and real pupil pilot remain outstanding.


## Continuation — storage failure during an active stroke
Restored clean heada93d4a640390d18b410e95a0104f3da28b9ae786; no competing branch writer found. [CI42965538214](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42965538214) passed430server,107models and both real browser suites on branch and main composition, including held-pointer reload warning/cancel. Composed tree7b67c39fb2c0e1732ba4cd233c70cf922107cb02 on unchanged main19811cc15a33d63fc0fcc0b6a11c34863ec64d03. The broader learning-quality check was still running at the start of this continuation; all other25checks passed and publication was intentionally skipped.

Found a specific loss path: finishDraw clears the captured draft before enqueue; if an earlier action's ACK checkpoint has meanwhile set queueStorageFailed, enqueue rejects this already-started stroke. Allow only finishDraw's internally marked stroke to enter the same memory queue despite this storage failure. The exception requires type stroke and a strict true private option; queue ownership, credentials, workspace, original target/generation and server authorization remain unchanged. New starts still require canDraw and remain blocked. The private completion option is not serialized into API, outbox or journal; no schema/backend change.

Added actual-browser teacher and pupil scenarios to the existing storage gate. A first stroke is durably accepted with its ACK held; the second mouse gesture starts, then the first ACK arrives while sessionStorage writes fail. Native capture must still be active at failure. Releasing the second gesture must retain its original points in a downloadable credential-free action; a third gesture is ignored. The second POST then receives503 until local backup recovers, reload preserves the same opId, and delivery creates exactly one second canonical stroke. Both fixtures are undone without touching production data.

Local107model/bridge/ink/queue tests, syntax and diff checks PASS. Independent technical review found no blockers and repeated17ink/queue tests successfully on runtime3b1e53954a79eba00b300c08f79d618f634fd229, storage browser59740aa691afe449ae608ee0a95f628dcd4b21a8 and runner3b244d69aba7ccb2c236733ee06eaf3cf0b71b0a. Exact new cloud browser gates remain required; local Chromium is not run because of the established EPERM restriction. Standing release authorization does not remove #529/#532 holds: authenticated Amvera access, consistent private /data backup, isolated restore and compatible backend before frontend are still required. Real pupil lesson and physical tablet not performed.
