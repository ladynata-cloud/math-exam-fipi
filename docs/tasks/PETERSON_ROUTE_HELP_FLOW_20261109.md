# Петерсон: помощь не перекрывает карту на узком экране

## Identity

- Task: PETERSON_ROUTE_HELP_FLOW_20261109
- Owner: владелец MathExam; координатор выпуска — root.
- Date: 2026-11-09.
- Base branch: `fix/vilenkin5-resume-copy-20261109` (#509).
- Base SHA: `81038c88580045849becc30d3dd62e9fb1cd96e6`.
- Planned branch: `fix/peterson-route-help-20261109`.
- Review level: `MEDIUM` — ограниченная UI-интеграция с жизненным циклом помощника.
- Related task: #499, #502, #509. Архитектура и учебная последовательность не меняются.

## Goal and evidence

На карте Петерсона кнопка «Нужна подсказка?» остаётся доступной и при ширине
до 480 px занимает собственное место перед главами. Она не перекрывает текст.
Actual #499 artifact `13678095334` (head `879551c0`) показал перекрытие заголовка
и вводного текста при 320 px в пустом и смешанном состояниях. Координатор
независимо подтвердил дефект и поручил отдельное исправление поверх #509.
Фиксированное положение из `peterson-assistant.css` применялось ко всем видам.
Задача не объявляет предыдущие кандидаты опубликованными: выпуск ведёт координатор.

## Approved scope

- Опциональный anchor для того же экземпляра helper; только карта Петерсона
  и только узкий экран используют normal flow. В других видах сохраняется body/fixed.
- Сохранить один host, открытие/закрытие, Escape, ARIA и фокус при переносе,
  повторном рендере карты, изменении ширины и переходе к своей задаче.
- Расширить существующие helper/route проверки устойчивыми assertions для
  размещения соседних блоков, фокуса, точного черновика и неизменённых сохранений.
- Математика, задания, критерии самостоятельности, serializers, ключи хранения,
  сеть, API, кабинет и shared-board контракты не меняются. Максим без anchor
  сохраняет прежнее поведение. Broad CSS selectors не добавляются.

## Acceptance criteria

- [ ] Пустая и смешанная карта 320 px: host в потоке между guide и главами,
  оба соседних блока не перекрываются закрытой или открытой помощью.
- [ ] Главный Start/Continue видим; help доступна, закрытие/Escape возвращают фокус.
- [ ] Повторный route сохраняет один и тот же открытый host и фокус;
  320 → 1280 → 320 сохраняет управление и возвращает прежнее desktop placement.
- [ ] Карта → задача → карта → Continue сохраняет точный черновик и помощь;
  чтение карты/открытие пустой помощи не переписывает progress или theory metadata.
- [ ] Обычные задания, Максим, cabinet opt-in и shared-board isolation проходят
  существующие регрессии. Все применимые actual-head CI успешны до выпуска.

## Checks and review

- Required: `tools/peterson-assistant.test.cjs`, существующие Peterson state,
  equation-state, picker/session/exact-number-search и route adapter regressions;
  syntax, navigator preservation/bindings и `git diff --check`.
- Browser: existing `textbook-learning-route.browser.cjs` (empty/mixed 320/1280,
  open/close/Escape, no overlap, resize/rerender/resume); existing helper browser
  и Peterson quality/board checks в CI. Скриншоты actual head смотрятся независимо.
- Независимое focused review: Merzlyak release agent. Механизм до реализации
  одобрен координатором; готовый diff и фактический результат проверяются отдельно.
- Внешний аудит, новая design consultation и ученический пилот не проводились:
  это исправление размещения существующего помощника, не новая учебная схема.
- Локальный Chromium ранее блокировался socket-ограничением executor. Эта задача
  не подменяет успешным такой запуск: actual-head browser CI обязателен.
- Gate marker: `PETERSON_ROUTE_HELP_FLOW_READY` только после применимых checks.

## Risk and rollback

Риски: потеря фокуса или detached host после `main.innerHTML`, случайное изменение
подсказок в заданиях. Перед рендером тот же host переносится в body, после — к
свежему anchor; перенос не выполняется при уже правильном положении. Сохраняется
только прежний активный descendant, фокус других полей не захватывается.
Scoped revert только этого UI-исправления допустим: новых сохранённых полей нет.
Слои совместимости #497/#499/#503 и другие предшественники сохраняются.

## Permissions and execution

START, branch, local commits, upload и Draft PR разрешены текущим поручением
координатора в рамках явного разрешения владельца отправить изменения в
`ladynata-cloud/math-exam-fipi` и опубликовать после успешных проверок.
Применяется [standing policy](../OWNER_RELEASE_AUTHORIZATION.md). Merge/deploy
выполняет только root. Не используются force, reset, rebase или ослабление тестов.
Точные source/head/tree, результаты, оставшиеся failures/not-run и review
фиксируются в Draft PR после загрузки кандидата. Секреты и персональные данные
в передаче отсутствуют.

## Local execution record

- Helper/route/cabinet/session/picker tests: 87/87 PASS; focused helper tests
  include the two new lifecycle and saved-work regressions.
- Peterson state: 20 checks plus first-success/reload/help/detour workflows PASS.
  Equation state: 25 scenarios / 98 compiled tasks PASS.
- Peterson UI: 224 tasks, 60 practice screens, 98 equation tasks / 491 steps PASS.
  Maxim: 15 tests / 27 entries / 26 generated cases PASS.
- Navigator preservation 4/4 and bindings 5/5 PASS; no HTML/receipt changed.
- Board integration: 8/9 PASS locally. The existing actual-SDK test's 75 ms settle
  failed to observe a notification after navigation; the unchanged #509 baseline
  reproduced the same assertion after another navigation. The test is unchanged;
  actual-head CI remains required. This local suite is not reported as PASS.
- Initial commands without the existing task-local jsdom dependency path failed
  to load jsdom; reruns with jsdom 26.1.0 produced the results above.
- Browser/visual acceptance of this candidate awaits CI and its artifacts.
- Native page, board wrapper and Maxim use the same canonical helper JS/CSS;
  the wrapper uses the same course app.js. There are no copied versions or
  per-asset mirrored hashes to sync. Registry metadata, board adapter, cabinet
  frames and the navigator manifest remain byte-for-byte unchanged.
- Independent focused diff review (Merzlyak release agent, 2026-11-09): no code blockers; browser/visual and full actual-head CI remain required. The local SDK failure cause is not established by baseline reproduction.
