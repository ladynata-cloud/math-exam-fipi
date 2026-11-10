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
