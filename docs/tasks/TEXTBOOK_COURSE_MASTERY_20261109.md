# Учебные линии Виленкина, Макарычева и Атанасяна

- Владелец — Наталья Михайловна.
- Дата — 9 ноября 2026, Новосибирск.
- База — `main`, `ee7c501abc2f293d923d892a4b3dcc5ac4b798f7`.
- Ветка — `improve/textbook-course-mastery-20261109`.
- Уровень — `HIGH` из-за восстановления работы и изменений в нескольких действующих приложениях.

## Цель

Показать ученику, что он умеет делать самостоятельно, и помочь ему продолжить с нужного места. Проверить подход на трёх темах, используя существующие модели и способы сохранения.

## Согласованный объём

- Виленкин 5–6. Прогресс по пунктам, раздельные действия для возврата к задаче и выбора следующего навыка, понятный вход к указателю учебника. Мост от одинаковых знаменателей к разным, с прогнозом, моделью, объяснением и новым самостоятельным примером.
- Макарычев 7–8. Видимый прогресс по главам, ориентир на правила самостоятельности и повторения мастерской 9 класса. Прямой вход в полный курс из маршрута 7 класса. Пилот §8 с разбором конкретной ошибки, допустимыми преобразованиями и новыми задачами без подсказок.
- Атанасян 7–9 и 10–11. Прогресс по главам и возврат к теме. В первом признаке равенства проверить выбор признака и соответствие вершин после исследования модели. В сечениях дополнить тренировку проверкой выбора общей грани в новой конфигурации. Письменное доказательство остаётся отдельным результатом для преподавателя.
- Навыки, упражнения учебника и авторская практика сохраняют свои обозначения. Страницы поискового входа из #493 и отдельный пилот уравнений из #492 ведутся в своих PR. Кабинеты, сервер, назначения, облачное хранение и настройки публикации находятся за границами пакета.

## Приёмка

- Возврат после перезагрузки сохраняет проверяемое условие и режим в затронутом маршруте Виленкина. Старая история читается. Локальные результаты приложений остаются раздельными.
- Помощь и самостоятельное подтверждение различимы. Повтор того же условия не выдаёт новый самостоятельный результат. Повторение через время учитывается по отдельному событию там, где курс поддерживает этот режим.
- В трёх темах есть прогноз или первый личный ответ, предметная обратная связь и проверка на другом условии. При помощи пройденный пример остаётся работой с помощью.
- В геометрии исследование, вычисление, выбор признака и письменное обоснование имеют разные результаты. Существующий числовой результат не засчитывает новое задание на признак.
- Прямые ссылки, браузерные маршруты, страницы на ширине 320 и 1280 и прежние локальные записи проверяются на изолированных профилях.

## Проверки и выпуск

- Профильные DOM, математические и браузерные проверки, регрессии приложений, проверка генераторов производных страниц и `git diff --check`.
- Независимый технический и математический просмотр итогового диффа. Проверка занятий на учениках относится к последующему педагогическому этапу.
- Допуск кандидата `TEXTBOOK_COURSE_MASTERY_OK` после применимых проверок. Точные результаты, головная ревизия, CI и сведения о выпуске фиксируются в PR.
- Владелец согласовал пакет сообщением «Давай, делай» после разбора курсов. Публикация по [действующему разрешению](../OWNER_RELEASE_AUTHORIZATION.md) после проверок. При необходимости откат выполняется отменой коммита с сохранением прежнего формата локальной истории.

При подготовке выпуска в `main` вошёл #492 с отдельным уроком уравнений. Проверяемая основа обновлена до `adc2c9445f6ce7f0a56bca67ed2bc31b8b82ec3c`.
## Continuation, 9 November 2026

The following record describes the earlier local preparation. The later explicit
owner authorization and uploaded source identity are recorded below.

EXECUTIVE STATUS

Task: TEXTBOOK_COURSE_MASTERY_20261109
PR: #497; local continuation not uploaded
Base: 463d6bf
Head: source 7a6720a2, navigator binding d8cf35d8
Gate: targeted local PASS; updated remote CI pending
Tests: navigator 4/4; bindings 5/5; workshop state, Vilenkin 5, Vilenkin full, Makarychev 9 and grade7 route suites PASS; 7400/16080/23280/13020 generated task/answer checks respectively
Failures: no test failure in these suites
Not run: updated full browser/CI and production; real-pupil/external review
Scope deviations: none; course source unchanged from b085e210
Recommendation: upload existing PR after explicit approval and complete exact-head CI; resolve overlap with #499 before publishing that follow-up
Next user decision: external-write authorization requested by automatic approval review

Authorized base: standing policy
Actual current main at composition: 463d6bf
Base drift detected: yes; published #496/#498/#501/#506
Authorization valid/invalid: standing policy applies; execution review blocks external upload
Virtual merge result: single navigator receipt conflict resolved with all published bindings retained
Rerun gates: listed above
New owner authorization required: requested by automatic approval review

Read-only composition with #499 exposes a real school/makarychev8/app.js
conflict between two home/progress implementations; it is not ready for blind
sequential merging. #503 has only the shared navigator-receipt conflict with
this candidate; its source remains separate and unchanged.

## Authorized upload, 9 November 2026

The owner explicitly authorized sending prepared changes to
ladynata-cloud/math-exam-fipi, merging checked PRs and publishing to
mathexam.space after successful checks. This supersedes the execution-review
upload blocker above. The coordinating agent owns merge and publication.

The uploaded source 407e2b1a5416b03496a8879239c1b3cd4460cff2 has parents
b085e2102a9e04dfa02185796f4cc5c2c1eaa595 and current main
463d6bf56fc8f1f944da8d237102f77888711e79. Its tree exactly equals the reviewed
local source 7a6720a2. Five public pages are rebound to this uploaded source,
retaining every published receipt. Independent read-only review confirmed tree
equality and both parents. Application code and authored content are unchanged
from the locally checked candidate; the follow-up changes only the binding and
this record. The final remote head and actual-head CI outcomes are tracked in
PR #497. Merge/publication have not yet been performed.

The #499 overlap has also been resolved and independently reviewed locally:
one map, exact draft continuation, separate fresh/review action and retained
mastery evidence. It will be uploaded as a follow-up whose parent is the actual
uploaded #497 head; it remains a separate release candidate.

## Composition after published Vilenkin entrances

Main advanced to d063ca10200c9fa208df15077b11a6bea67659e5 through #493.
Its nine files add two static Vilenkin entrances, catalogue/sitemap coverage and
their browser checks. The automatic merge preserved both candidates' full
patch identity and every non-manifest source blob. The new browser scenario
still selected the old Vilenkin course label, however. Its selector now names
the specific current action "К следующему навыку" and checks its learn command;
the saved-lesson URL, answer, attempt history, re-entry and navigation assertions
remain intact. No fallback selector or product behaviour changed.

Affected local gates passed: navigator preservation 4/4, bindings 5/5,
sitemap 12/12, generated sitemap 557 URLs, SEO and 73 catalogue destinations.
Local Chromium could not launch because socket creation is prohibited by this
environment; no local browser PASS is claimed. The uploaded candidate must pass
the complete current SEO browser workflow and other actual-head checks. Existing
source bindings remain canonical uploaded commits, with #493 coverage retained.

## Final release chain after Merzlyak and the OGE guide

Published main is 39705bc5669acb5b97a33c72f5badc044faff298 after #503.
This candidate also includes the actual uploaded #505 head
f878e2146ff01c960138f52576a778b8a31167e5. Release order is #505, #497, #499;
the coordinator preserves dependency ancestry when merging #505. The new #497
source has parents its previous remote head dfdc8aeb and the exact #505 head.
Only a subsequent binding commit points the five textbook pages at that actual
uploaded source. The complete #505 manifest history, all four Merzlyak bindings
and the two published Vilenkin entrances are retained.

Independent review confirmed all 21 non-manifest files published by #503 remain
exact. Its bounded gates passed: learning records 24/24 and 26/26, trainer
feedback 311478 checks, similarity 720 cases and existing course 39480 checks.
The OGE guide's seven non-manifest files are inherited unchanged from the
coordinator's checked head. Textbook application and exercise files are unchanged
from the reviewed #497 candidate. Final navigator checks and exact-head CI are
reported in PR #497; no obsolete-head result is substituted for the new head.
