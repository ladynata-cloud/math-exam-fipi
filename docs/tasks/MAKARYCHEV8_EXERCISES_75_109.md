# Макарычев 8: упражнения №75–109

## Identity and approved scope

- Owner START: «выполни незакрытые задачи. порядок определи самостоятельно»; task delegated on 2026-11-06 after the published №1–74 continuation.
- Base branch: `main`; verified remote base: `8448ccecff1334cfa4e404c6040f855f2bb258e5`.
- Branch: `feat/makarychev8-exercises-75-109`.
- Review level: MEDIUM, bounded additive textbook content using the existing course interaction and exact answer formats.
- No open overlapping PR or branch was found at task start.

Complete every source subpart of №75–109 in topic p04, «Сложение и вычитание дробей с разными знаменателями». Preserve the existing №75а/75г cards, all 596 prior task objects, indices, deep links and browser storage. Append only missing cards. Supply optional persistent steps, original restrictions, proofs and all explicit secondary questions. Do not change the backend, cabinet, other courses or shared-board protocol.

## Source and evidence

The owner's PDF is Макарычев, Миндюк, Нешков, Суворова, под редакцией Теляковского, «Математика. Алгебра. 8 класс. Базовый уровень», Просвещение, 2024, 17-е стереотипное издание, electronic ISBN 978-5-09-116445-9. SHA256: `356695f0f11a489090ed72428320a6d6cc343747eec02968b716c2204caaced8`, matching the previous source record. Topic theory is printed pp23–24; exercises are pp25–29 (PDF pp26–30). The course source-map establishes the exact №75–109 boundary. Source PDF and rendered pages stay outside git.

## Acceptance and gates

- All numbered tasks and subparts are transcribed from the verified source, with visual formula/sign review.
- A separately transcribed fixture and exact symbolic/rational oracle check source formulas, common denominators, transformations, answers, aliases, original domains, proofs and equation roots.
- Prior task objects and their positions remain unchanged. The generated build is deterministic.
- Existing schema, models, state, DOM, import, graph and previous exercise gates pass.
- Chromium checks every added prompt at 320/390/768/1280 px, all added step journeys, number search, wrong-answer rejection, preserved notes/drafts and previous deep links; representative screenshots are inspected.
- Syntax and `git diff --check` pass. Final marker: `MAKARYCHEV8_EXERCISES_75_109_OK`.

## Review and release boundary

The design question is how to expose common-denominator reasoning without prematurely revealing the answer or losing excluded values after cancellation. Reuse the existing task-first interface and optional stored steps. Explicitly distinguish an algebraic identity from a proof based only on sample substitutions. Mathematical/source and browser review are required. External provider consultation/review is waived by the owner and not claimed; no real-pupil trial is claimed.

The owner authorizes local implementation, commits, push and a Draft PR. Root coordinates publication; this delegated task stops before merge/deployment. No force, reset, rebase, protection changes or production pupil writes. Roll back by reverting this additive content/build patch while retaining learner records.

## Execution record

- Actual base: `8448ccecff1334cfa4e404c6040f855f2bb258e5`.
- Actual branch: `feat/makarychev8-exercises-75-109`.
- Adds 126 cards and 301 steps; №75а/75г remain in their original positions. Total 722 tasks, 518 source cards, 204 authored tasks, 1955 steps, 51 topics. Prior 596 task objects/positions retain snapshot SHA256 `a48e07fb8537a72e0da2419dd7e91951189c69aa9b7074b3edbe0e6189b36695`.
- Source conditions were visually compared with all five printed pages. Content SHA256: `071787664dc53b52cd0c3c3e1e839084c015d4ffcac1a11659a19a45de392bd0`. The independently transcribed exact-math fixture passes 3320 assertions, including original domains, transformations, aliases, proof lines, substitutions, complete subpart coverage and preserved previous cards.
- Native №108 construction accepts two learner-entered lines in either order with exact rational coefficients. A blank grid precedes input; the separate exact-intersection question compares the plotted source functions with the algebraic answer. No answer is prefilled.
- Local Chromium gate passes 504 prompt/width views at 320/390/768/1280, 301 step journeys and 35 number searches. It also verifies old links and notes, draft reload, wrong signs, single-fraction form, excluded original values, exact graph coefficients and intersection, and the mass asked for in №109. Representative mobile and desktop screenshots are inspected. Local browser is the available Chromium 134; the pinned Playwright 1.62.1 browser remains an exact-head CI gate.
- Full DOM suite passes 722 task journeys/1955 steps. At the old synchronous loop the default Node heap exhausted; a lifecycle-only repair yields every 20 tasks while keeping all assertions and the same learner state. The default-heap rerun passed in 110.64s with maximum resident memory 755228 KiB. No heap override is required. The four complete browser blocks plus this larger DOM suite justify a 20-minute CI timeout; no test or assertion was removed.
- Initial mobile №108 placed the graph below the first 900px. Shortening repeated prompt/caption text resolved the failure without relaxing the layout assertion; the complete graph is visible at 320px.
- Existing source/math, schema, model, state, import and graph tests pass. All three earlier browser suites pass on the current runtime: 372 + 496 + 292 views and 223 + 294 + 179 steps. Together with this continuation, all four suites cover 1664 views, 997 worked steps and all 109 source-number searches. Build regeneration is byte-identical; syntax and diff checks pass.
- [Independent source/math and bounded runtime review](../reviews/MAKARYCHEV8_75_109_INDEPENDENT.json): PASS with no findings. The reviewer read all five source pages, reran the 3320-assertion oracle and inspected four actual №108 screenshots; the receipt binds exact file hashes. This is independent agent review, not external provider approval.
- Exact-head CI, final synchronized base/head and PR link are recorded in the PR handoff. The original base above is retained for provenance; concurrent main changes are incorporated only after read-only composition verification.
- No external provider review, real-pupil trial, publication or production learner write is claimed by this task.

## Exact-head CI provisioning follow-up, 2026-11-06

The original published PR463 head was `5958f40ac792106727384703de4a924d2c2cfff9`.
Its Makarychev course, EGE classroom and unified-learning runs passed
(`42138653923`, `42138653910`, `42138653930`). Self-study video run
`42138653954`, job `127633093863`, was cancelled at the 30-minute job limit
during `Prepare local media verification tools`. Browser dependencies had taken
about ten minutes; Ubuntu FFmpeg dependencies were still downloading after the
next twenty minutes. The 13.6 MB `libflite1` download took over five minutes,
and cancellation occurred during `libmysofa1`. The job's actual test steps were
all skipped, so this run is neither a failed mathematical test nor a passing
video gate.

The owner-delegated fix changes only the workflow's time allowance to 60 minutes
and explicitly checks out `github.event.pull_request.head.sha || github.sha`,
as the other exact-head workflows do. All dependency versions, install commands,
test steps, assertions and runner settings remain unchanged. The comment states
that the additional allowance covers dependency provisioning. This does not
change any course/runtime/source file or merge main. A new candidate and its
CI runs are required; the old cancellation is not relabelled as success.
