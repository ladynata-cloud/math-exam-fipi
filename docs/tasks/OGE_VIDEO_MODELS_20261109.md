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

Release pending: source binding refresh after the source commit, all applicable CI, fresh main/head check, merge-delta verification and public resources. No merge or publication is claimed in this source record. No additional owner permission is pending within scope.
