# Петерсон 6 и Макарычев 8: маршрут обучения

## Identity and permission

- Owner: MathExam; requested 2026-11-09 (Asia/Novosibirsk).
- Base: main `ee7c501abc2f293d923d892a4b3dcc5ac4b798f7`.
- Branch: `draft/textbook-learning-route`.
- Review: HIGH (separate optional study metadata, legacy storage compatibility).
- START, branch, commits, push and Draft PR explicitly authorized by current request.
- Original merge/deployment hold was superseded by the owner's explicit authorization on 9 November 2026 to upload prepared changes to ladynata-cloud/math-exam-fipi, merge checked PRs and publish to mathexam.space after successful checks. The coordinating agent owns release sequencing and final verification.
- Accepted ADR 0010 account boundary retained. ADR 0005 remains Proposed; this task adds a bounded presentation component over existing course evidence, not a replacement skill engine or account system.

## Goal and approved scope

Show the course journey inside the two existing student applications: chapter/topic sequence, visible task progress, current/next step and continuation, distinct theory acknowledgment, assisted and independent results. Preserve authored exercises, scoring, old saved work, practice detours, search, cabinet links and board isolation. No strategic dashboard or new public area.

Shared presentation and adapter live in school/shared. Each course keeps its original storage key and sanitizer. Only explicit theory acknowledgments use the corresponding `.route.v1` key; optional `learningRoute` backup data is separate from `state`. Old backups remain valid. No writes occur merely from viewing the route.

Peterson current-method results alone contribute to current task progress; old-method work and history remain accessible. Board sessions retain the original home and never initialize personal route storage. Hash links retain cabinet query parameters. The board wrapper loads the same inert shared resources to preserve the existing script-parity gate.

## Evidence definitions and learning design

- Reading alone never supplies an assessed result. “Теория изучена” is explicit pupil self-report.
- Independent means the existing validated course result: correct on first attempt without assistance; current-method credit required for Peterson.
- Help/after attempts includes other correct results; no existing evidence is upgraded.
- Progress percentage measures included course tasks, not all textbook exercises or mastery.
- Fully independent topic means all included topic tasks were independent. Separate practice is not attributed to a topic.
- Continuation returns to an unfinished draft, otherwise next unfinished task in that topic, then first incomplete topic. Completing all tasks offers separate practice. No topic is locked.
- Scope remains Peterson part 1 (14 topics), Makarychev 8 (51 topics). Theory and independently completed work have distinct visible labels.

## Acceptance and checks

- Pure component tests: counts, sequence, safe text/links, empty/mixed/complete evidence.
- Adapter tests: no legacy writes, study persistence/import, old-method evidence, continuation.
- Existing state/import/UI/board/picker/search regressions.
- Real Chromium: 320×900 and 1280×900; fresh/mixed/resumed work, theory marking, help/independent answers, reload, keyboard, no horizontal overflow, cabinet query, board isolation, denied/corrupt storage.
- Syntax and git diff --check; focused independent technical review.
- External provider review not performed under standing owner policy; no real-pupil pedagogical trial claimed.

## Risk and rollback

Progress stays local to this browser, not a new server journal. Optional theory metadata is monotonic and isolated; invalid metadata is not overwritten. Revert the changed code/resources to restore the old UI; do not remove original saves or the optional metadata. Failed shared resource load falls back to the original home.

## Execution record

Final test outcomes, exact head and PR are recorded in the Draft PR. Production and real-account testing are intentionally excluded until owner approval; simulated cabinet/board compatibility is checked locally.

### Review follow-up

- The existing cabinet/board browser gates now select the same first task and saved continuation through the new route controls. Their assertions and shared-board selectors are retained.
- Navigator source binding is refreshed only for `school/makarychev8/index.html`, using the existing binding tool and an explicit committed source. No validator or historical hash assertion is weakened.
- Current main `30e1af62a4ac5fe9717b51a080ca9d7f5e0169af` was composed with this task; concurrent linear-pilot, VPR and OGE work is retained. The shared manifest conflict was resolved from the current main manifest, retaining its OGE receipt, then adding this task's binding through the standard tool. Binding source commit: `03838f3889bc303fd1cf9517b8de32d114ad04c7`.
- The route gate passed all 27 model/adapter checks and real Chromium journeys at 320×900 and 1280×900, including empty/mixed/complete, independent/help, theory, keyboard, drafts, backup/import, earlier-method history, denied/corrupt storage and board personal-storage isolation. Eight screenshots were inspected. Runtime files are unchanged since this successful run: https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42579771785 .
- Initial browser fixture failure was corrected to use the required decimal answer format; no product scoring change. Whole-course Makarychev CI also passed. Final broader CI status is recorded in the PR, without treating old failed runs as passing.
- Full cabinet/helper browser run passed after updating its first-task selector: https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42579986785 .

## Composition with textbook mastery, 9 November 2026

This records the earlier local preparation; the authorized uploaded candidate is
described below.

The overlap with #497 is resolved in one course map, not two competing home
screens. The primary action still resumes the exact unfinished draft. A separate
optional action offers the next fresh task or a delayed review. Raw solved and
independent totals and the all-included-tasks confirmation remain unchanged.
Two distinct independent examples and the delayed third result are shown as a
separate assessment; old unknown timestamps never invent a review deadline.
Completion timestamps, signature deduplication, notebook/steps, backup import
and theory acknowledgements retain their existing formats. New/in-progress rows
do not display redundant assessment labels. Missing route resources keep the
#497 mastery home as fallback. Peterson has no new assessment callbacks.

EXECUTIVE STATUS

Task: TEXTBOOK_LEARNING_ROUTE
PR: #499; local composition only, not uploaded
Base: published main 463d6bf plus #497 candidate f4840fed
Head: source composition 2eedbd95; final checked follow-up recorded in handoff
Gate: targeted local PASS; browser/remote CI still required
Tests: 33 route/adapter/integration tests, independently rerun; M8 state and import; Peterson state/equation-state, picker 6, session 12, exact search 8; navigator 4 and bindings 5 PASS; syntax/diff checks PASS
Failures: initial local Peterson equation test lacked NODE_PATH, rerun with installed dependencies passed
Not run: current composition browser/remote CI, production, pupil study, external provider review; full M8 DOM suite started but final output unavailable, outcome unverified and not claimed as PASS
Scope deviations: none; #497 evidence remains distinct from #499 task-completion progress
Recommendation: retain #497-before-#499 release order; upload only after execution approval and run actual-head CI
Next user decision: exact external-write authorization requested by automatic approval review; task-specific release hold retained until resolved by owner

Authorized base: local composition within the requested course update
Actual current main at composition: 463d6bf
Base drift detected: yes; current #497 already incorporates #496/#498/#501/#506
Virtual merge result: navigator receipt and M8 home conflict resolved, preserving both learning models
Rerun gates: listed above, including six new combined-course scenarios
New owner authorization required: external write/release confirmation requested by automatic approval review

The navigator receipt starts from #497's current published bindings and adds only
school/makarychev8/index.html at source checkpoint 2eedbd95. This composition
neither publishes #497 implicitly nor changes the source of exercise answers.

Independent focused review of source checkpoint 2eedbd95 and the final badge
refinement passed without blocking findings. The reviewer compared both parents,
confirmed the single map, exact-draft priority, separate mastery/all-task counts,
retained timestamps and read-only map rendering, and reran all 33 combined tests.
Peterson's application remains unchanged from #499; the added callbacks are
optional. This review does not substitute for the current-head browser/CI gates.

## Authorized uploaded composition

The owner has explicitly authorized uploading, merging checked PRs and publishing
after successful checks. No additional task-specific release hold remains. The
new composition preserves the actual uploaded #497 head
768c7ac3074c9260387af2da3bf6e26c52783ab4 as a parent alongside the original #499
head 55263f767d649685882eb997ace9e7292ad60ce1. All runtime files match the locally
reviewed 5345256a candidate. Its manifest starts from the uploaded #497 receipt,
and only school/makarychev8/index.html is rebound to the new uploaded source.
The #497 task record is preserved from that actual head. Uploaded source:
be7b5522a1672a641c125b31442bdd516dd627d1, tree
f2feffa95dc59dc1f424200aaab5162087fb6c60, exactly matching the prepared local
7851166b tree. Final head and actual-head CI outcomes are recorded in PR #499. Merge and site
publication have not yet been performed; #497 precedes this follow-up.

## Published entrance compatibility follow-up

Main advanced through #493 to d063ca10200c9fa208df15077b11a6bea67659e5.
This follow-up composes the actual updated #497 head
dfdc8aeb564f898b7821e01e190ba3a86a2ec97d with the prior #499 head dc8f24e8.
It retains the two static Vilenkin entrances and their catalogue/sitemap
coverage. The SEO browser scenario now selects the specific current
"К следующему навыку" action and asserts its learn command, while all saved
lesson URL, wrong-answer attempt, history and re-entry checks remain unchanged.
The earlier exact selector was obsolete after #497; no broad fallback was added.
Route/mastery runtime files remain identical to the independently reviewed
composition. Canonical source binding be7b5522 remains an uploaded ancestor;
bound HTML did not change. Affected navigator, sitemap, SEO and catalogue gates
passed, and JSDOM journeys through both new entrances confirmed the next-skill
action, practice attempt and reload. Local Chromium remains blocked by socket
permissions; actual-head browser CI is required before release.
