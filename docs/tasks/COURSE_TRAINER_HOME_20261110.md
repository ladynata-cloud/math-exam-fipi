# Return home from courses and trainers

- Owner START: «обеспечь возврат на главную с каждой страницы курсов и тренажеров сайта».
- Date: 10 November 2026, Asia/Novosibirsk.
- Base: main / 049eeb943bc3df5e43dd4d643d76f3c3003d568e.
- Branch: fix/course-trainer-home-navigation. Review level: HIGH (shared navigation).
- Publication: authorized for this task by docs/OWNER_RELEASE_AUTHORIZATION.md.

## Scope and acceptance

Every active public course/trainer HTML page exposes an explicit «← На главную»
link to `/`, independently of browser history, referral/session query values,
and the navigator conversation panel. Redirects must resolve to covered pages.
Existing public navigator pages receive the shared home code in the same bundle;
uncovered pages receive the standalone script. Byte equality guards the two
copies and avoids adding a network dependency to the existing bundle.

The lessons header/footer logos also return home, with a visible header menu
entry. The common bar sits in document flow, avoiding overlays on answers.
Iframe and explicit embedded modes retain their parent navigation. Public
standalone board shells still expose home. The expanded owner request also
covers teacher assessment panels and the three existing cabinet shells. The
cabinet uses native links to the public homepage because its separate origin
serves only local assets. The generated OGE skills page uses a native link in
its authored template. Empty placeholders, source reports, offline and frozen
book editions keep explicit exclusions. No exercises, grading, saved work,
account protocol or board synchronization is changed.

## Checks and review

Required: source-wide coverage, home navigation DOM/browser checks (320/1280),
native link destination/click, repeated-load idempotence, iframe isolation,
unchanged storage, public navigator regression/preservation, exact HTML source
bindings, syntax/diff checks and applicable GitHub CI. Independent technical
review is required. External provider review is optional and not performed.
The published site is accepted only after merge identity, Pages and live
resource/link checks. Record environment failures separately from test passes.

## Risk and rollback

Potential risks are altered page layout and unwanted navigation within a shared
workspace. Isolated styles, an in-flow bar, explicit embed checks and browser
checks cover these boundaries. Roll back this scoped commit without deleting
or migrating saved results. Use the normal release workflow and fresh main/head
guard; do not force, reset, rebase or weaken existing tests.

## Execution record

PR #522. Source coverage includes 657 direct public learning pages and 7
verified redirects (including the standalone GeoGebra page). Independent
source review accepted the isolated home code, unmodified navigator remainder
and exact trainer-source restoration. Local checks passed: six new home DOM
suites, 43 navigator regressions, four preservation checks, five binding tests,
45 strict profile picker/script contracts, 65 board contracts after the focused
Peterson expectation update, 24 linear-pilot and 23 Vilenkin/Maxim entry checks.
Existing canonical script arrays stay strict: only the exact appended home
asset and deferred tag are additionally required. The regenerated Vilenkin
sixth-grade offline edition is byte-identical to the previous edition.
Desktop preview showed the link and actual home transitions from lessons and
planimetry; the full-height geometry wrapper layout was visually inspected.
Mobile and full integration browser acceptance remain required in GitHub CI.
Initial disk/environment recovery and unavailable git credentials were resolved
using a fresh checkout and connector delivery with exact tree verification.
A rejected source-binding attempt changed nothing: lessons is an existingPages
entry, and the original preservation gate passes without manifest changes.
Publication is pending the exact candidate CI, fresh main/head guard and live
verification; no external audit or live release is claimed in this record.

## Browser regression verification — 10 November 2026

The owner explicitly requests a draft-only correction and verification of #522:
no merge and no publication during this check. This task-specific hold overrides
the standing release permission above. Starting head: `3e9dc8f8af29e868aa6df61f1c0a7af97e954b99`.

The reported `267d0ab` failures have already been addressed in that head: the
lessons anchors explicitly target the same tab, and ordinary pages append the
home bar after authored content. Native showcase run `42690398557` and video run
`42690398773` both passed. This follow-up retains those fixes and adds actual
same-tab clicks for all four lessons home links, popup detection, historical
source replay, first-screen media coordinate comparison and no-overlap checks at
320, 390, 1280 and 1440 pixels. The historical replay uses only the three changed
navigation/lessons files from `267d0ab`; the video entry HTML/CSS/JS are unchanged
between the reported and starting heads.

The existing strict home browser gate also exposed four first-visit trig pages
whose onboarding dismiss button was below the mobile viewport. Their authored
cards now have a viewport-bound scroll area. The same real dismiss-button click,
home click, coverage, mathematics, persistence and source checks remain in place;
there is no forced click, hidden modal, extra exclusion or relaxed timeout.

Local Chromium cannot create its process socket in this environment. Browser
results must come from native GitHub Actions; local syntax/DOM/source checks do
not stand in for browser acceptance. The separate no-JavaScript GIF preview
failure has been re-run without changing its assertions or runtime.

Risk/rollback: this follow-up changes only four onboarding CSS blocks and test
coverage. Revert those scoped changes if needed; there are no data migrations,
account writes or exercise changes. Final exact-head results belong in the PR.

## Проверка полноэкранной практики кабинета

В [проверке кабинета 43085022866](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/43085022866) на `4d3a0528` браузер обнаружил, что общий нижний блок допускает прокрутку экрана практики и может увести кнопку «В кабинет» за верхнюю границу. На этой странице общий нижний блок скрывается, а ссылка на главную находится в существующем меню «О результатах». На обычных экранах кабинета остаётся нижняя ссылка.

Локальный Chromium воспроизвёл падение на `4d3a0528`. После исправления прежнее ограничение положения кнопки «В кабинет» и остальные сценарии на шести тренажёрах прошли. Добавлена проверка действительного перехода на главную в той же вкладке. Отдельный сервер Amvera в ходе этой работы не обновлялся.
