# First-part OGE geometry: collection and contextual help

Date: 2026-10-28 (Asia/Novosibirsk). **Prepared, not deployed.**
Task: [OGE_GEOMETRY_ASSISTANT](../tasks/OGE_GEOMETRY_ASSISTANT.md), HIGH.
Branch: `feat/oge-geometry-assistant-20261028`.
Exact base: `1fcc4fa36267f5667c42409861ef0b92f97b333c`, Draft PR #360.
Final publication head, tree identity and CI run links are recorded in the task's
Draft PR; this document is part of that reviewed change.

## Observed starting point

Read-only authenticated teacher inspection confirmed the intended existing OGE
cabinet already contained the five canonical links below. Its private identity,
profile values and account records were not copied into this repository, and no
live account or plan was changed.

| Trainer | Existing canonical route | Collection description |
| --- | --- | --- |
| 15 | `/trainers/oge-task15-triangles.html` | Triangles: angles, sides, similarity, bisectors and Pythagoras |
| 16 | `/trainers/oge-task16-circle.html` | Circle relationships, angles and inscribed/circumscribed figures |
| 17 | `/trainers/oge-task17-quadrilaterals.html` | Quadrilaterals, midlines and areas |
| 18 | `/trainers/oge-task18-grid.html` | Geometry on a square grid, lengths and areas |
| 19 | `/trainers/task19-trainer.html` | Individual statements, visual reasoning and counterexamples |

Current main was `8723d6bfb19e64d43c474b1fc7116fe8630ec20a`; geometry PR #335
is merged. The assistant prerequisite chain #358 → #359 → #360 is prepared but
unmerged. This incremental PR targets #360's branch and excludes public-chat
PR #361. Concurrent main PR #362 adds an unrelated isolated course; it does not
change the runtime files in this increment. PROJECT_STATUS is the shared
reconciliation document. No merge or rebase was performed.

## Product changes

A saved geometry plan now has one “Геометрия №15–19 вместе” entry, retaining the
original five trainer cards. The collection offers all five topics, links back
to the public trainers, teacher board links and three existing foundational
materials. It clearly identifies browser-local practice; no managed attempt or
cabinet progress is fabricated. Task19 explains that its individual-statement
practice is not the complete multi-statement examination format.

Each trainer has a collapsed optional helper. “Подсказка в этой задаче” uses the
current native hint. “Передать условие помощнику” marks native assistance and
opens a separate cabinet tab containing the current public mathematical text.
The source draft, figure and task stay intact. Board/embedded and native
assessment modes retain their existing controls and do not expose this handoff.

Transfer permits exactly a canonical source/topic pair and bounded plain text.
It cannot change the signed-in account, profile, task ownership, provider or
permissions. It carries no pupil answer, hidden answer key, picture or history.
The receiver states that drawing data and later edits are unavailable; the pupil
must check the text and submit explicitly. If the helper has not been enabled,
the page explains why the form is absent and points back to native hints; it does
not imply that a working chat already exists. The public condition appears in a URL
fragment and may remain in browser history. It is not an automatic model request.

The existing MaxExam 0.0 panel now supports bounded exact geometry calculations:
angle sums, Pythagoras, both square/circle configurations, explicit arc relations,
trapezoid midlines and their parts, supported area formulas, grid distances and
six exact statements. Inputs must match a complete supported form. Contradictory,
incomplete or unsupported input receives `needs-teacher`. Hints give one step;
only the separate full-explanation request includes the final result. Supported
math stays offline even if optional external permission exists.

MaxExam is the product's name, not a new set of trained neural-model weights.
This task makes zero provider calls, buys nothing and changes no hosting settings.

## Demonstrated defects corrected

| Defect reproduced | Correction and verification |
| --- | --- |
| First native hint click on 16–18 published the previous state to the board | Coalesced timer after native event dispatch; real Chromium failed before the fix and passed all six trainer/viewport combinations afterwards. Remote restore remains silent. |
| Task17 concatenated answer accepted text and minus signs after stripping non-digits | Match the complete permitted digit string. Generated/archive answers and ordinary numeric/fraction checking remain intact. |
| Correct task19 answer with help cleared the repeat queue | Assisted success remains for repetition; room hydration and empty-queue validation agree. Updated visible repeat wording. |
| Compatibility normalization changed `2²` into `22`, then certified a wrong answer | Preserve NFC math text at gateway, service and solver. Unsupported super/subscripts fall back honestly. Separate NFKC privacy detection remains active. |
| Task15 native styling made a helper button unreadable | Scoped helper override; all five mobile journeys visually inspected. |
| Task19 standalone download contained an older runtime copy | Rebuilt the downloadable HTML and ZIP from current sources; offline/source parity gate passes. |

Task19 can remove the same statement from repeat after a new unassisted answer;
that is not evidence of mastery on a fresh analogous task. Historical saved
`needsReview:false` records are not automatically migrated.

## Validation on the assembled change

| Check | Result |
| --- | --- |
| Full assistant service, including bounded geometry and Unicode regressions | 122 passed; 0 failed/skipped |
| Full board/cabinet server suite after the Unicode correction | 328 passed; 0 failed/skipped |
| Existing geometry mathematical contract | 1,873 checks passed |
| Geometry text contract | 107 templates; 0 failures |
| Geometry/state/transport/course/task19 combined suite | 151 passed; includes real Socket.IO and offline download parity |
| Cabinet plan/route/helper and neighboring course DOM regressions | 55 passed |
| Existing assistant browser UI | 10 scenario groups passed |
| Real browser → authenticated cabinet → independent helper | 6 geometry groups passed, including preserved `2²`, retained hints, login handoff and 390 px layout |
| Public-trainer handoff in Chromium | 10/10 journeys: five trainers at 1280 and 390 px |
| Native board input/click/peer restore in Chromium | 6/6 journeys: 16–18 at 360 and 1280 px |
| Existing three-profile real two-service browser journey | 9 completed requests; fourth pupil blocked |
| Provider traffic / real pupil writes / fabricated managed attempts | 0 / 0 / 0 |

Node 24.22.1, jsdom 26.1.0, Playwright 1.55.0 and Chromium build 1187 were used
locally. Browser/server fixtures use temporary synthetic identities and databases.
Local loopback execution needed the normal sandbox permission because the
restricted runner denies listening sockets; gates were not weakened.
The new CI workflow pins Node 24.21.0, Ubuntu 24.04 and the same browser libraries,
checks out the exact PR head and runs the new scenarios. Existing workflows remain
unchanged. Final CI status belongs to the immutable head recorded in the PR.

## Independent review and remaining connection work

A separate internal reviewer checked the mathematics and full matching boundaries:
1,474 independent numerical/naming probes passed. That review found the Unicode
bug outside the original suite. After the correction, 17 independent boundary
probes passed, including unchanged privacy rejection and the five example tasks.
A different internal review covered routes, profile/account boundaries, lifecycle,
assistance marking and safe transfer; no unresolved concrete blocker remains.
These are internal reviews, not external release verdicts.

Claude consultation and external ready-result review were not performed: no
callable authorized Claude integration or configured local credential was
available. No paid retries or external approval are claimed. During this task,
the owner withdrew the previously supplied AGENTS.md instructions. Their earlier
mandatory consultation/exception workflow is therefore not imposed on this
increment. The completed internal review remains technical evidence.

Not run: production rollout, private helper activation, real pupil trial,
external inference/model quality/billing, hosting-resource verification and
external release review. Synthetic tests do not establish learning gains or
complete FIPI-bank coverage. Releasing the dependency chain and configuring the
separate helper application are still needed for a real cabinet connection.

## Curriculum sources and limits

The [FIPI demo/specification page](https://fipi.ru/oge/demoversii-specifikacii-kodifikatory)
labels the 2027 materials as projects. Its
[2027 change plan](https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2027/Plan_izmeneniya_KIM_OGE_2027.pdf)
states no mathematics changes. Draft examples include circle/square area and a
trapezoid midline divided by a diagonal; collection descriptions therefore do
not narrow number16 to angles or number17 to areas only. This is a bounded
curriculum check, not certification of every bank problem or final 2027 material.

## Synthetic visual evidence

- [Collection, desktop](oge-geometry-assistant-20261028/collection-desktop.png).
- [Checked hint followed by explicitly requested full solution](oge-geometry-assistant-20261028/checked-helper-desktop.png).
- [Native task, preserved draft and optional helper at 390 px](oge-geometry-assistant-20261028/native-helper-mobile.png).

These captures use fictional test accounts and deliberately synthetic input.
They do not depict the intended real pupil or a live deployment.

## Rollback

The live site is unchanged by this prepared branch. For a later release, a
normal scoped revert of this delta restores the parent UI and solver. No database
schema, learner-storage key or board packet format changed. Preserve request
reservations, tombstones and learner history. Private pupil access or the gateway
can also be disabled through the existing controls; no data deletion is needed.
Stopping the shared board/cabinet process still stops both; the separate assistant
retains its own lifecycle. This increment does not alter that architecture.

```text
EXECUTIVE STATUS

Task: OGE_GEOMETRY_ASSISTANT
PR: Draft publication and exact final head recorded in the PR handoff
Base: 1fcc4fa36267f5667c42409861ef0b92f97b333c
Head: see the immutable publication head in the Draft PR
Gate: OGE_GEOMETRY_ASSISTANT_LOCAL_OK; final remote CI reported separately
Tests: 122 service; 328 server; 1873 mathematics; 107 texts; 151 state; 55 DOM; browser journeys above
Failures: 0 unresolved local failures
Not run: external review, provider calls, real pupil pilot, production activation/deployment
Scope deviations: bounded gateway normalization correction necessary for demonstrated wrong answers
Recommendation: finish prerequisite integration and configure the independent helper service
Next user decision: resolve the actual deployment/access context for live cabinet activation
```
