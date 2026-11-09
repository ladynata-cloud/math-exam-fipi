# Математические модели видео GeoGebra в обеих частях ОГЭ

## Identity
- Owner: Наталья Михайловна; дата: 9 ноября 2026 (Asia/Novosibirsk).
- Base: main `89ee66bfe5068f16364d61d091fcbf1a1cbd6287`.
- Branch: `feat/oge-video-models`; review: HIGH.
- Existing architecture: Accepted ADR0003, current optional investigation patterns and public trainer isolation. No new board protocol or grader architecture.

## Goal and authorization
Запрос: «найди возможность применить математические модели из курса к моим тренажерам. к первом части и второй части». Реализовать предметные исследования внутри существующих тренажёров, связав модель с прогнозом, обоснованием и новым самостоятельным примером. START, branch, local commits, push and Draft PR authorized by this request; checked release authorized by OWNER_RELEASE_AUTHORIZATION.md and prior explicit permission to publish course improvements.

## Evidence and scope
Прочитаны сохранённые разборы GeoGebra «Графики» (8 ноября и продолжение L8/L10 от 9 ноября) и «Планиметрия / стандарт 2D v0.2». Это выборочные визуальные наблюдения; полного аудио-разбора и всех исходных .ggb нет. Новые SVG — собственные модели MathExam, не импорт чужих упражнений.

| Наблюдение | Адаптация | Тренажёры |
|---|---|---|
| L8: отдельно менять коэффициенты прямой | Наклон и пересечение оси, новое условие | 11 |
| L8: гипербола со сдвигами | Асимптоты, особое k=0 и исключённая точка | 11 |
| L2–3: модуль параболы и горизонталь | Число различных пересечений, точный порог | 22 |
| L4–5: кусочные функции | Выбор ветви и включённость концов | 22 |
| L6: сокращение дроби и выколотая точка | ОДЗ, потеря пересечения, y=kx | 22 |
| Планиметрия: медиана и высота | Середина против перпендикулярности, внешняя высота | 15,19 |
| Планиметрия: диаметр и вписанный угол | Сохраняем связь, формулируем причину | 16,19 |
| Подобие и площади | Коэффициент длины и квадрат коэффициента площади | 17,23 |
| Касательные и радиусы | Перпендикулярность, равенство касательных | 16,23 |
| L8: BC=CB1=BC1, середины | Вспомогательная окружность диаметра BC и цепочка обоснования | 24,25 |

Конкретное соответствие и независимая математика фиксируются в данных и тестах. Наличие старых похожих моделей не выдаётся за новое внедрение.

## Acceptance criteria
- Optional collapsed entry on nine public pages; original task remains first and unchanged.
- Prediction before model; accessible parameters; visible exact boundary cases; reason check and three distinct transfer conditions per model.
- Numeric answer accepts equivalent decimal/fraction forms, rejects blank/nonfinite/zero denominator.
- Practice labels distinguish independent, corrected, helped, familiar repetition; exploration never awards native course credit.
- Own drafts survive reload. Concurrent stale tabs cannot overwrite newer state; unrelated progress untouched.
- Proof text can be saved; interface explicitly does not claim machine verification of free proof.
- No addon in iframe, shared, managed or exam modes; no server/board/frozen-book modifications.
- Mobile 320/360 and desktop 1280 acceptance; keyboard controls and reduced motion.

## Review, gates and rollback
Independent mathematical data and technical/interaction review. Node math/domain/transfer tests; runtime persistence and isolation tests; historical source checks, book closure, native OGE regressions; actual Chromium workflow and screenshots. Git diff --check and source bindings. External provider audit and real-pupil pilot not performed. Required final gate OGE_VIDEO_MODELS_OK plus all applicable CI.
Rollback: scoped revert of nine include blocks and four assets (retain independent storage). Existing graders/banks/progress and shared protocols must remain unchanged. No secrets, private files or local paths in public handoff.

## Execution record
Implemented ten investigations and thirty transfer conditions on the nine listed standalone pages. The old task markup is preserved byte-for-byte after removing the exact include block. Existing book editions are unchanged; the future book dependency closure includes exactly the four new assets.

Independent mathematical review checked exact boundary cases, domains, degeneracies and transfer answers. Technical review found and corrected help-history loss on a skipped condition, duplicate/relabelled attempts, stale cross-tab writes, pending draft loss when switching lessons and missing off-screen intersections. Snapshot writes use exclusive Web Locks; bounded idempotent exposure markers preserve already shown help and checked errors across conflicts. Without locks, lesson drafts remain in the current page session. Native stores are not used.

Completed local model/runtime/preservation regressions: 47 tests. Root rechecked the final session/marker implementation after independent review fixes. Completed local native regressions: 91 Node tests, 668 algebra contract checks, 1873 geometry contract checks; future-book generator: 13 tests. The dedicated real-browser gate covers 27 page/viewport combinations, 30 lesson journeys and 54 embedded/managed/exam isolation cases, with screenshots. Local Chromium could not start in this execution environment; the dedicated GitHub Actions browser gate remains mandatory before publication. A read-only desktop preview confirmed the modulus model and its exact c=9/4 boundary; this does not replace the automated mobile gate.

The final product revision adds an L8 mobile crop with 201 checked parameter positions; the model/runtime/preservation suite now has 48 passing tests. Real Chromium acceptance on head `4b61c3abdc8fc393c824b00d8309f0556247b008` passed 27 page/viewport combinations, 30 lesson journeys, 54 isolation cases and 3 native-only reload controls (run 42660481556, artifact 13694286544). Mobile and desktop screenshots were inspected. All native scores, answers and event histories remain unchanged by model interactions; 23 negative reload controls reject impermissible state changes.

Main advanced to `e5ca2174becd89064710af625b517feeab00e4bd` during validation. A history-preserving composition retained all concurrent profile files and resolved only the source-binding registry. Nine OGE pages were bound by the standard tool to composed source `68add415b86115585e5b8c10d97570a63fbb3821`. The composed native/model gates and 85 profile, 4 navigator-preservation and 5 binding checks passed.

The fixed-book verifier identified an evidence-format mismatch: the source pages now contain one closed optional summary, and its historical SVG collector also records a hidden L8 preview on tasks 24/25. A narrow integration receipt preserves the complete raw text/SVG evidence, verifies native HTML byte identity and served asset hashes, and inverts only that exact summary and the pinned hidden preview during the existing fixture comparison. Original mathematics, text, geometry and oracle fixture pins are unchanged. Five new Node groups (including six Python negative-control groups) bring the local model suite to 53 passing tests. An offline replay of the archived browser evidence with projected receipts yielded 1185 PASS, 0 PENDING, 0 FAIL; this projection is not a fresh browser run, and CI must capture and validate actual DOM receipts on the final candidate.

Release pending: all applicable CI on the final candidate, fresh main/head check, merge-delta verification and public resources. No merge or publication is claimed in this source record. No additional owner permission is pending within scope.
