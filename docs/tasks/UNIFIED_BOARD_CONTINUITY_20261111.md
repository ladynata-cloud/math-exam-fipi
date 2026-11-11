# Единая доска: непрерывность записей во время сохранения

## Identity
- Task: UNIFIED_BOARD_CONTINUITY_20261111
- Owner: MathExam
- Date: 2026-11-11 (Asia/Novosibirsk)
- Base branch: release/unified-board-verified-20261110 (PR #529)
- Base SHA: a385e9dcb6d64b7d466d2174598b76586f7ea310
- Planned branch: feature/unified-board-continuity-20261111
- Review level: HIGH — восстановление локальной очереди и отображение совместной работы.
- Architecture: [ADR 0015](../adr/0015-unified-interactive-board.md), Accepted.

## Goal and approved scope
Владелец попросила продолжить создание цельной доски и выделить следующий длительный цикл примерно на восемь часов. Первый законченный участок: собственные неподтверждённые штрихи не исчезают при переключении материала, перерисовке, изменении размера окна и восстановлении вкладки. Сохранённая серверная работа остаётся источником истины.

Продолжение по прямому заданию владельца 11 ноября: principal-bound outbox, изоляция при смене роли, сохранение неоднозначной legacy-очереди и проверки возврата автора.

Продолжение в том же scope: честный статус и восстановление при отказе браузерной резервной копии, экспорт своих неотправленных действий обеим ролям, проверка одновременного отказа сети и storage.

В scope: локальная проекция stroke/erase/undo, привязка к автору/рабочему месту/поколению доски, адресная отмена preview, защита undo при ожидающих действиях, unit и браузерная регрессия, отчёт и checkpoint продолжения.
Вне этого patch: новый формат журнала, инструменты текста/картинок/PDF, новые адаптеры, кабинеты, курсы, объединение #532, публикация статьи Хабра, работа с реальными учениками и их данными.

## Evidence and status reconciliation
PROJECT_STATUS.md в базе описывает прошлые этапы и не доказывает текущий выпуск. При начале работы текущий remote main — 19811cc15a33d63fc0fcc0b6a11c34863ec64d03; #529 остаётся Draft. На публичном backend /api/group-lessons/status отсутствуют geometry/insert/surfaces; /trainers/spacemath/index.html — 404. Это исходное наблюдение текущего чата, не повторная приёмка всех страниц.
Исходный group-board.js использует ws.strokes в renderFocus/resize/moveDraw, хотя законченный штрих уже находится в outbox. Задержка POST + переключение скрывает его до подтверждения.

## Acceptance
- [x] Собственный штрих виден при задержанном POST, переключении и resize.
- [x] Erase удаляет адресованный preview и не восстанавливает его после ACK.
- [x] Нет двойного штриха после ACK; undo не выбирает второй штрих при повторной проекции.
- [x] Другое место/автор/поколение, история и демонстрация не получают локальные неподтверждённые данные.
- [x] Протокол и серверные файлы не изменены; legacy очередь без metadata не получает выдуманное preview.
- [x] Пройдены необходимые проверки; failed/not-run отражены отдельно.

## Checks and review
- Isolated synthetic journal-copy restore rehearsal: materials/rights/history/dedup, immutable source/reference copy, unsupported complete event fails closed. This does not satisfy production /data backup evidence.
- Separate read-only composition with reviewed current main, preservation proof, full server/models and real two browser suites on composed sources. Overlap/main movement fails closed; no release authorization inferred.
- node --test tools/group-board-ink.test.cjs
- Geometry/model/assets/bridge tests from unified-interactive-board.yml.
- Existing group server contracts and two real browser gates.
- node --check, git diff --check, exact changed-file review.
- Independent technical review required; external provider review not requested under [standing policy](../OWNER_RELEASE_AUTHORIZATION.md).
- Final gate marker: UNIFIED_BOARD_CONTINUITY_READY only after relevant gates.

## Risk and rollback
Локальное preview не подтверждает сохранение. Ошибки и индикатор «Сохраняю…» сохраняются. Metadata остаётся в sessionStorage рядом с очередью, не отправляется серверу и не добавляется в журнал. Откат только frontend patch возвращает прежнюю отрисовку; откат reader интеграционной сборки к несовместимой старой версии недопустим.
Риск смены авторства очереди устранён principal-bound envelope и проверен CI 42927803624. Отказ локального storage требует отдельного CI текущего продолжения; его прохождение не снимает серверные release holds.

## Permissions
START: текущая просьба владельца «продолжи ее создавать ... часом 8». Branch, implementation, tests, commits, push, Draft PR разрешены этим заданием. Standing release policy применяется к запрошенной работе; технические release holds #529 (backend-first, согласованная копия /data, фактический CI и восстановление) сохраняются. Этот task не снимает hold #532 и не разрешает публикацию Хабра.

## Execution
Результаты и продолжение: [report](../reports/unified-board-continuity-20261111.md). Один branch/PR для этой правки; не смешивать с параллельными изменениями курсов. Следующие запуски сначала читают checkpoint и актуальную ветку, затем продолжают незавершённые проверки.
