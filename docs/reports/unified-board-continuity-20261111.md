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
