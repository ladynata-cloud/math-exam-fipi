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
