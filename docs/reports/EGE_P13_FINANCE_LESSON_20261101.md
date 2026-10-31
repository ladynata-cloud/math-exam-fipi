# Financial models for profile EGE task 13

## Preparation status

Local preparation report for `EGE-P13-FINANCE-LESSON-2026-11-01`.
Verification took place on 2026-10-31 UTC. The date in the task ID is the
approved planning identifier.

- Base: `a8eb6b26c917c337a3f9672c0b8eb40243f6e6a3` (`main`).
- Branch: `task/ege-p13-finance-lesson-2026-11-01`.
- Review level: `MEDIUM`.
- Owner START permits implementation, verification, commits, branch publication
  and a Draft PR. Merge, auto-merge and deployment require a separate decision.
- External Claude consultation: `NOT_RUN_BY_OWNER_REQUEST`, explicitly declined
  for this task in the owner's START message. No external verdict is claimed.
- The immutable report records local evidence. The Draft PR body and its checks
  record the published head SHA and authoritative CI outcome for that head.

## Result

The existing course gains **13 lessons, 78 independently written tasks and 442
steps**. Each lesson contains three guided conditions and three separate
independent conditions. Together these form **39 matched learning pairs**.

The finance section grows from 3 lessons / 18 tasks to **16 / 96**. The complete
main course grows from 68 / 408 to **81 / 486**, with **1,771 steps**. The old
18 finance objects, their IDs and step order, `applied-data.js`, `state.js`, and
local progress identity remain unchanged. The new conditions extend the course
without replacing earlier work.

The teaching sequence follows the lesson's central needs: build a money-flow
model, keep interest separate from principal repayment, trace the order of
operations, and answer the actual question in the requested unit. It includes
credit and deposits, backward reconstruction, equal principal parts and equal
whole payments, integer bounds, calendars and two-stage loans. This report does
not infer a learner's mastery from the earlier consultation.

## Complete coverage register

Every reference below has a guided task and a fresh independent sibling. The
32 numerical reference IDs identify publicly referenced source problems; they
are **not asserted FIPI bank GUIDs**. Seven additional pairs use explicit FIPI
catalogue IDs. Source references identify mathematical models, while the course
uses newly written conditions, numerical variants and explanations.

| Lesson | Topic | Three source pairs |
| --- | --- | --- |
| 1 | Долг: начисляем проценты и вносим платёж | `630197`, `630129`, `630219` |
| 2 | Вклады: пополнение, снятие и обратный ход | `704682`, `704683`, `704684` |
| 3 | Равные части долга: проценты как прогрессия | `517569`, `526293`, `517568` |
| 4 | Первый и последний платежи: срок, сумма и ставка | `624083`, `517480`, `517203` |
| 5 | График долга: доли, общая сумма и целое S | `701456`, `525414`, `526017` |
| 6 | Предел выплат: каждый платёж или общая сумма | `525142`, `548818`, `643163` |
| 7 | Равные платежи: два года и три года | `517503`, `704627`, `660699` |
| 8 | Неизвестное в таблице: кредит и размер платежа | `672873`, `630122`, `697032` |
| 9 | Ставка и рост: найдём процент и сравним варианты | `704685`, `704686`, `517574` |
| 10 | Равные платежи: восстанавливаем сумму кредита | `628752`, `707183`, `fipi-four-equal-total-to-principal` |
| 11 | Неравномерные выплаты и изменение договора | `630110`, `fipi-balloon-total`, `561179` |
| 12 | Месяцы и годы: когда именно начисляются проценты | `513106`, `fipi-first-months-rate`, `fipi-late-year-principal` |
| 13 | Кредит по этапам: соединяем правила погашения | `fipi-two-stage-principal`, `fipi-two-stage-rate`, `fipi-two-stage-midpoint` |

The 78 conditions and all 442 step prompts, hints, explanations and exact
answers were compared with the previously approved authored bank. There were
no mathematical-content changes during runtime integration. Lesson introductions,
prerequisite explanations and public-source metadata were completed separately.

## Verified FIPI alignment

Nine official loan examples were matched. Two already occur among the supplied
32 models, so seven additional pairs complete this coverage.

| Official example | Printed page | Course reference |
| --- | --- | --- |
| Draft profile demo 2027, task 13 | 13 | `704627` |
| Profile demo 2026, task 16, first alternative | 16; solution 27 | `fipi-two-stage-rate` |
| Profile demo 2026, task 16, second alternative | 16; solution 28 | `fipi-late-year-principal` |
| Methodological materials 2026, worked task 16 | 77–79 | `fipi-two-stage-principal` |
| Methodological materials 2026, example 16.1 | 79 | `fipi-two-stage-midpoint` |
| Methodological materials 2026, example 16.2 | 80 | `fipi-balloon-total` |
| Methodological materials 2026, example 16.3 | 80 | `630219` |
| Methodological materials 2026, example 16.4 | 80 | `fipi-four-equal-total-to-principal` |
| Methodological materials 2026, example 16.5 | 81 | `fipi-first-months-rate` |

Primary sources:

- [FIPI official demo and specification page](https://fipi.ru/ege/demoversii-specifikacii-kodifikatory).
- [Mathematics 2027 archive](https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/ma_11_2027.zip), labelled a project/draft at source inspection.
- [Mathematics 2026 archive](https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2026/ma_11_2026.zip).
- [FIPI methodological materials 2026](https://doc.fipi.ru/navigator-podgotovki/navigator-ege/MR_matematika_ege_2026.pdf).

The live open bank returned HTTP503/timeouts during source research. This is
coverage of the verified official documents, not an exhaustive bank import.
The historical 2026 economic task16 examples provide additional thematic
practice; their presence does not establish that every such type is mandatory
in 2027 task13. Investment optimisation example16.6 stays outside this scope.
Original writing and explicit provenance are documented, without promising
legal immunity.

## Learning and interface decisions

- A credit ledger separates debt before interest, interest, debt with interest,
  principal repayment, whole payment and remaining debt. A deposit ledger
  separates the owner's operation from the sum used to calculate interest.
- Every computed cell has an explicit semantic reveal milestone. Coincidental
  equality with an earlier answer cannot unlock another value. Only accepted
  answers count; the current step index alone grants nothing.
- Before an unknown term is found, the model uses symbolic preview rows. It
  exposes neither the real row count nor a pager or label containing that count.
- Two-stage boundaries and selected payment windows remain visible. The last
  zero balance is treated according to its meaning in the condition.
- Help records assistance before revealing its explanation. It explains the
  calculation method without exposing all future values. Stale or disposed
  controls cannot reveal content or alter an obsolete attempt.
- Each answer has a visible unit. New integer domains reject a nearby decimal;
  strict money checks reject a kopeck error even for a large amount. Exact
  fractions work in input, retained steps and worked solutions. Existing tasks
  keep their previous parser and tolerance.
- The question and answer input appear together. The table and help follow,
  and retained history is below the current action. A completed task retains
  its solved table. On phones, a single period card replaces the wide table;
  a wide container shows up to four periods.

## Implementation boundaries

`finance-data.js`, `finance-tasks.js` and `finance.css` add content, model views
and local styling. `index.html` and `calm-data.js` register the module in the
existing catalogue. `app.js`, `solutions.js` and `checks.js` add opt-in units,
exact answers, feedback and numeric constraints. `checkpoint.js` passes the
same constraints into mixed practice.

No storage migration, new runtime protocol, backend, account boundary,
production configuration or existing task-bank rewrite is introduced. The
current project status was reconciled with PR388's release evidence; that
historical book distribution gate was not rerun or reclassified by this task.

## Local verification

| Check | Result and scope |
| --- | --- |
| New independent mathematics and model tests | `profile-finance.test.cjs`: 9/9 PASS; all 78 final answers; 506 ledger rows / 3,010 cells recomputed from public parameters |
| New end-to-end finance journeys | `PROFILE_FINANCE_BROWSER_OK`: 78 guided + 78 independent completions across 320/1280px, 546 accepted answers, 28 reloads and 10,056 visible-cell comparisons |
| Full course inventory and state | `PROFILE_FULL_COURSE_DATA_OK`: 81 lessons / 486 tasks / 1,771 steps; old storage identity and separate independent conditions |
| Existing unit regression | 26 relevant existing test files PASS, including numeric input, fractions, applied bank, state, checkpoint, prerequisites, task-first and model disclosure |
| Worked-solution unit coverage | 7/7 PASS over all 486 tasks; mathematical comparison reconstructs displayed fractions and separately verifies units |
| Full course browser | `PROFILE_FULL_COURSE_BROWSER_OK`: 102 completed journeys, 294 mounted models, 49 controlled models and 6 inequality journeys; no runtime/request errors |
| Worked-solution browser | `PROFILE_STEP_SOLUTIONS_BROWSER_OK`: 42 journeys at 360/1280px; single-step reveal, draft/history, stale actions, mixed practice, keyboard and help credit |
| Readable help browser | `PROFILE_READABLE_HELP_BROWSER_OK`: 84 journeys at 360/1280px |
| Calm learners browser | `PROFILE_CALM_LEARNERS_BROWSER`: all 4 scripted learner profiles / 190 checks PASS; zero source drift, runtime errors or failed requests |
| Exam entry browser | `PROFILE_EXAM_FIRST_BROWSER_OK`: all 13 independent entries, repair/detour/return/reload scenarios |
| Unified course browser | `PROFILE_UNIFIED_COURSE_OK`: 20 banks, 44 help panels, 360/1280px and draft return |
| Task-first browser | `PROFILE_TASK_FIRST_BROWSER_OK`: 81 lesson families, same-page help, identity/history/credit and 320px |
| Existing profile package | `npm --prefix ege-profil test`: PASS; all existing package gates completed, including 7,600 generated geometry cases with zero discrepancies |
| Syntax / scope / whitespace | Node syntax checks, protected-file checks, public handoff scan and `git diff --check` |

The finance oracle derives answers and complete ledgers from task parameters,
rather than using the answer keys as expected results. It also checks strict and
inclusive bounds, neighbouring integers, full debt closure, selected periods,
precision and legacy snapshots. Browser journeys intentionally use checked
answers to exercise the UI; they are not evidence of real-pupil learning.

### Visual inspection

Four representative conditions (ordinary credit, unknown term, deposit and
monthly calendar) were inspected at **320×900** and **1280×900**, with 16
screenshots of the initial screen and model. No horizontal overflow or runtime
errors remained. Symbolic desktop columns retain their correct positions.

On the 320px samples, the answer input moved from an initial 2,307–3,295px down
the document to **1,116–1,425px**, with the full conditions retained. On desktop
it appears at **659–720px**, within the initial viewport. These observations
cover representative layouts, while automated finance journeys cover all tasks
at both widths. They do not claim physical-phone or screen-keyboard testing.

### Resolved failures and environment constraints

- The first general run lacked linked geometry/equation files in the sparse
  checkout, and sandbox process restrictions interrupted Git subprocesses.
  The public dependencies were fetched and affected tests rerun successfully;
  no test was bypassed or weakened.
- The existing worked-solution test helper treated stacked fraction text as a
  concatenated integer and included the new unit in numeric parsing. It now
  reconstructs the numerator/denominator, checks the accessible fraction label
  and exact unit, and retains the mathematical answer assertion.
- Focused review found that the result screen hid earned financial values.
  Finance-only completion context now retains the solved ledger; the browser
  test verifies that state after finishing.
- Visual checks found excess scrolling, a wrapped brand and misaligned blank
  symbolic columns. The final form order and finance-only responsive styling
  resolve those findings without dropping condition information.

Local tools: Node24.22.1, jsdom26.1.0 and isolated Playwright1.55.0 with
Chromium140.0.7339.16. The existing CI pin, Playwright1.62.1, is unchanged.
Chromium required the execution environment's approved process permission.
No TLS verification was disabled and no browser trust configuration changed.

### Not run locally / not established

- Every unrelated repository suite and board-server runtime; the applicable
  existing CI workflows remain responsible for their own checks.
- Published-head CI: recorded in the Draft PR after publication, not claimed
  retrospectively by this local report.
- Production finance deployment and post-deployment tests: not authorized.
- Physical devices, Safari/Firefox, printed material, real-pupil outcomes or a
  complete live-bank comparison.
- External Claude design consultation/review: declined by the owner for this
  task; focused internal review and mathematical checks were performed.

## Review, risks and rollback

Content transfer, model/interface work and independent mathematics/code review
were performed separately. The focused review covered earned-value disclosure,
unknown-term noninterference, exact fractions, integer/money validation, help
accounting, cleanup, result rendering, legacy state and CI integration. Resolved
findings are listed above. This is internal review, not an external Claude
approval marker.

Remaining material limits are browser/device coverage and the incomplete live
FIPI-bank access. The large authored data module is static and reproducible;
there is no server-side or persistence rollout. Close the Draft PR before merge
to abandon the candidate. After a separately authorized release, a bounded
revert can remove the new module and opt-in integration without a storage
migration. Old task records remain addressable.

## Publication decision

The candidate is prepared for a Draft PR. CI for its exact published head must
be read before a release recommendation. A passing check, START or this report
does not authorize merge, auto-merge or deployment. Those actions require a
separate owner decision identifying the PR, head and current base.

## Reviewed source identity

Focused internal review completed at `2026-10-31T18:01:52.244117+00:00`.

The following SHA256 values identify its reviewed working files. The published
commit and PR remain the authoritative revision identifiers.

| File | SHA256 |
| --- | --- |
| `ege-profil/start/app.js` | `7a255c29b9ec7cb9b1a7f5df5ee9fb3762e757742934a3a6acf21af558cc7e44` |
| `ege-profil/start/checks.js` | `97267ea77ad613261bbe3a507e3f64058061a6669c7fb8666202d8f617793fd7` |
| `ege-profil/start/checkpoint.js` | `dab98a76d0add949c2f8ad1b734c2deac938aa8d0b25d2dd9ed153e7d2fc8721` |
| `ege-profil/start/solutions.js` | `cb09b22882304c940b4b76c574bb12cfc34e78455d949a4d77a462ca796e836e` |
| `ege-profil/start/finance-data.js` | `a2f17f678e3bb9398bcee0e4c0088692abce9a5375e69f70c3b4d9f6ca2cbd8d` |
| `ege-profil/start/finance-tasks.js` | `b88716d67691de4d6d2f60fca9270d6d8257b6ae8d52d95951823bb65581afbc` |
| `ege-profil/start/finance.css` | `3c7244dc8490efd0388b2c2befead520bddcd412fdfd9a63b5e56b3f5595c7c9` |
| `tools/profile-finance.test.cjs` | `1bef13f526c46e8416ab0783eb8af66b989ae892b114da23f4ae4b0011342bf9` |
| `tools/profile-finance.browser.cjs` | `a5be8521971c1b1087778c22bb103c7d48ba67e18ea793b721a8d8b076292c66` |
| `tools/profile-full-course.test.cjs` | `83ca0f22894709260dac261e6af713246799d23bfd6f63abbbf532fd56eace5b` |
| `tools/profile-full-course.browser.cjs` | `763826e4bb59dc7c790ee2fbbc4ce5a8ea428fddb8c5cde08cf464b84c78b729` |
| `tools/profile-step-solutions.test.cjs` | `8d81e309ae04a8f4b1072411a9fdd9731ea73bc7fc6adb3bc6f414146c90dc20` |
| `tools/profile-step-solutions.browser.cjs` | `2524604c66ca2456dec390a4336692d7daafe5bf2bcd7322da1cc3562552a861` |
| `tools/profile-calm-state.test.cjs` | `0194fb34f8567811b85fe4ab1b2203f64e04979a888d0491967057719c2827b9` |
| `tools/profile-checkpoint.test.cjs` | `315cc70f1d3283d6ea528b67e56c7dd6f5442ef04613347a11ed8c79703a9093` |
| `tools/profile-independent-models.test.cjs` | `db399ab69390d71d489d9caa2749dda9ed7d4373d96f06204288c4413677fba7` |
| `tools/profile-calm-map.test.cjs` | `e24c5f480fd1bf882a41569da94ff4fff4729d49a21c12234b14037db54bc097` |
| `tools/profile-task-first.test.cjs` | `0f275a8c6edf5037aed6fee45b5d08a490a4c028259f3facde7125b8c1d724f9` |
| `tools/profile-task-first.browser.cjs` | `f8f8d1f9c4ef8d6ba0205a99331da623b2828888cda55ed2f9f132b7bad29430` |
| `tools/profile-readiness-plan.test.cjs` | `b622b07100f4fdadd01d4530ca16e49132f2c03bcc5d159e4567f8166bd50e10` |
| `tools/profile-readable-help.browser.cjs` | `89ccf0ea53c7925f94f7cd18a2dba43552011cdac742fcd2bbf49b3a0e5f21e2` |
| `tools/profile-exam-first.browser.cjs` | `357263c2ee1873009c0def9e3aefb76053b24201c390897c0badb8a90fdd59c4` |
| `tools/profile-unified-course.browser.cjs` | `c4c9e21a015faebc56def1385ab32ae322dbf76015719ca735740aa02cacb5a4` |

## First published CI and dependency follow-up

The first published candidate was
`75e5a7a33d7f512cb1a61708be3d4986d1ed428b` in
[Draft PR390](https://github.com/ladynata-cloud/math-exam-fipi/pull/390).
Its local checks above passed, but its first CI did not pass:

- [Profile learning-start run41228700466](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/41228700466)
  found an omitted `finance` module in the existing `#home` catalogue assertion
  and stale canonical script lists in the stereometry/expressions wrappers.
- [Five added board trainers run41228700314](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/41228700314)
  found the same asset-list drift in five other wrappers.
- SEO, task-first courses and all active stereometry renderers passed on that
  initial head. Downstream steps skipped by the two failed workflows are not
  counted as passing.

The correction synchronizes seven existing wrapper HTML files with the main
course's canonical script/CSS references, including the new finance module and
cache queries. Each wrapper's body, board adapter, bridge and route/protocol
boundary remain unchanged. The exact asset-parity assertions are retained.
`profile-start.browser.cjs` adds the finance module to its aggregate expected
catalogue while retaining `assert.deepEqual` and all legacy scenarios.

The corrected `PROFILE_START_BROWSER_OK` gate passes **108 tasks / 224 answers**,
including 360/768/1280px, keyboard, reduced motion, zoom, board and damaged-save
checks, with no runtime errors. Seventeen relevant browser loaders were
inspected; no other aggregate omissions were found. The corrected test SHA256
is `4a8e0d95bae9e62bf1859843eb5b5d305c01daa1b97f608760cedc0b380e4b35`.

This is a required registration dependency within the same task. It adds no
board protocol or registry behaviour, changes no financial content, and does
not weaken a gate. The reviewed core source hashes above remain identical.
All three picker suites pass: `profile-expressions-picker.test.cjs`,
`profile-stereo-picker.test.cjs` and `profile-added-picker.test.cjs`. The
independent read-only follow-up review confirmed exact order/cache queries for
31 shared scripts, unchanged wrapper bodies and board bootstrap order, and no
changes to the old eight data modules, state, adapter, bridge or server files.
`git diff --check` passes. Replacement-head CI is recorded in the current PR
verdict; initial failed runs remain part of the evidence history.
