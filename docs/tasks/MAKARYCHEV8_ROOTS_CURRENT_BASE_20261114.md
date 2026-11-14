# Makarychev 8 square roots — completion on current main

## Identity

- Task: MAKARYCHEV8_ROOTS_CURRENT_BASE_20261114
- Owner: MathExam owner
- Date: 2026-11-14 (UTC)
- Base branch: main
- Base SHA: add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a
- Planned branch: feat/makarychev8-roots-completion-20261114
- Review level: HIGH
- Source continuation: PR #482, exact head b16c346ca1ee35ae3d911fe7b8a0a71b2f5708f1
- ADR: no architectural change. ADR 0001 remains Proposed.

## Goal

Make the already authored, independently reviewed square-roots chapter available in the current Makarychev 8 course: exercises 268–509 with their subparts, retained solution steps, constructions and review questions, while preserving earlier lessons and saved work.

## Context and evidence

The owner's current request is to finish remaining trainer work and resolve routine questions independently. Read-only inspection of current main found 722 cards and 1,955 steps; PR #482 contains the missing chapter but its old branch conflicts with main. The selected source head has 1,789 cards and 4,116 steps. Direct comparison verified that all 722 current task payloads, their indices, source map and existing theory blocks are unchanged. The continuation appends 1,046 textbook cards and 21 authored review cards to the existing topics p10–p19, bringing chapter II to 1,127 cards including its earlier 60 cards.

The three source JSON files match their independent oracle hashes exactly, and their coverage records enumerate all 242 numbers from 268 through 509. Historical source evidence identifies the uploaded 2024 edition by SHA-256 `356695f0f11a489090ed72428320a6d6cc343747eec02968b716c2204caaced8`, printed pages 64–114. The four carried review records document earlier authoring and independent source/runtime review; they are historical evidence, not current-head approval. This continuation does not claim a fresh audit of the PDF pages or external-provider review.

Current main contains a newer equal-axis-scale correction in `models.js` and its regression in `test-audit-learning.cjs`; both are preserved byte-for-byte. PR #595 does not overlap the course runtime or content. Its only shared task path is the global navigator manifest, whose unrelated rows remain intact. The current example catalogue call and standalone/shared-mode boundaries are retained.

## Approved scope

### In scope

- Import the three reviewed source blocks, three independent oracle fixtures, frozen earlier-task receipt and review-question source without altering their contents.
- Extend the existing builder, checker, input controls, source-order navigation and task figures only as needed by these reviewed tasks.
- Rebuild `data.js` from the preserved current chapter sources and imported chapter additions.
- Carry historical review receipts, update the course README and coordinated asset cache version.
- Preserve all existing course gates; add the roots source, engine and native browser suites to current CI.
- Refresh only the Makarychev 8 page's canonical navigator binding to the real published source checkpoint.

### Out of scope

- Additional textbook chapters or newly invented source mappings, task generators or course architecture.
- Repairing, rebasing or merging the old PR #482 branch; copying its obsolete branch-composition helper and pinned workflow jobs.
- Backend, authentication, account/board contracts, real learner records, source PDFs/scans and raw OCR.
- PROJECT_STATUS.md, which is coordinated separately.

### Files and contracts that must not change

- `school/makarychev8/models.js`, `test-audit-learning.cjs`, `source-map.json`, the existing chapter JSON and exercises 1–109 JSON.
- All 722 prior task objects, 1,955 retained steps, task IDs, indexed URLs, storage key/schema, imported-work precedence and notebook data.
- Unrelated navigator bindings, current catalogue/examples, other courses and the shared arithmetic module.

## Acceptance criteria

- [ ] Three imported source files and review questions retain their exact reviewed hashes; all 242 source-number records and independent answer expectations pass.
- [ ] Generated course contains 51 topics, 1,789 tasks and 4,116 steps, with all current tasks and indices preserved.
- [ ] Full source/math, checker, graph, state, import and DOM gates pass; current equal-axis regression remains enabled and passes.
- [ ] Fresh current-base native CI passes the four existing exercise suites and complete roots suite, including four widths, source searches, graph construction, alternate examples, saved work and reload.
- [ ] Current example catalogue and standalone/shared-mode contracts pass.
- [ ] Generated course is reproducible; strict canonical navigator preservation passes after the real source checkpoint is published.
- [ ] Independent technical review examines the actual current-base candidate; browser screenshots are reviewed separately.

## Checks and gates

- Required: four existing `test-exercises-*.py` suites; `test-roots-source.py`; course/model/state/task-graph/roots-engine suites; full `test-ui.cjs`, import and current audit-learning DOM suites.
- Native: all four prior exercise browser suites, `test-browser-roots.cjs`, existing course-entrance and Makarychev audit browser checks.
- Static: deterministic build, syntax, direct current-base payload/route comparison, exact protected-file identity, canonical bindings/navigator preservation and `git diff --check`.
- Manual review: current-base runtime delta, source/oracle receipts, graph/construction behavior and native phone/tablet/desktop screenshots.
- Final marker: MAKARYCHEV8_ROOTS_CURRENT_BASE_20261114_OK, withheld until required exact-head CI and review are complete.
- Not run locally: native Chromium because of the environment process/socket restriction; use CI. No physical-device or real-pupil trial is claimed.

## Review plan

HIGH because the chapter expands the accepted-answer runtime and stored task set, and a data downgrade could remove new work. Before implementation, inspect the exact old head against current main, verify source hashes and all prior payloads, and identify newer main corrections. Ready-result review is independent of the port author and checks mathematics/runtime integration, preserved work, source ordering and screenshot evidence. Reuse the existing learning sequence and previously reviewed authored content; no new trainer archetype is introduced. External review is optional under the standing owner policy and is not claimed. Sanitized handoffs contain only repository-relative code/evidence and no credentials, personal data or source scans.

## Risk and recovery

The main risks are losing a newer runtime correction, stale checker/data caches, rejecting formerly accepted radicals, incorrect source-order navigation and saved-work loss. Preserve current model changes, version all seven coupled assets together, retain legacy radical/step regressions and compare every prior task payload/index directly with the actual base.

After pupils create work for new roots IDs, a blanket downgrade to the old 722-card data/checker is unsafe: the old sanitizer discards unknown IDs and a later save can overwrite their work. Recovery therefore uses a corrective release preserving the expanded data, IDs, compatible checker and storage schema. If the course must pause, a separately verified static entry that does not run the application or access localStorage can suspend entry while retaining the expanded resources. A limited UI/CSS revert requires compatibility checks with current data. No recovery publication is authorized or performed here.

## Permissions

- Current direct owner request and coordinating task authorization cover branch creation, scoped implementation, validation, logical local commits, push and a Draft PR.
- The user's directly supplied AGENTS.md requires a separate explicit merge authorization and takes precedence over older repository standing-release language.
- Merge, auto-merge and deployment are not authorized by this task. No force, reset, rebase, non-fast-forward synchronization, admin override or weakened gates.

## Execution record

- Actual base: add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a
- Actual branch: feat/makarychev8-roots-completion-20261114
- Source: PR #482 at b16c346ca1ee35ae3d911fe7b8a0a71b2f5708f1, left unchanged.
- Initial audit: 722 existing payloads/routes preserved; source map and all prior theory preserved; 1,067 missing cards identified; reviewed source hashes verified in memory.
- Imported content rebuilds to the exact previously reviewed `data.js` bytes, SHA-256 `e8043ddcc07ae018f8b23971cc14135202ee96775a799ce9ae2f33c17512a839`.
- Source/math checks: 34,017 assertions pass, including 9,627 roots checks and 1,095 independently calculated expectations. Current model (8), import (4), audit-learning (16), course/schema, graph and state/reload suites pass. Protected current-main files are unchanged.
- Independent ready-result review reproduced a current-base integration defect: incomplete values for newly imported root kinds consumed a mathematical attempt. The new real-DOM regression failed on `roots-353-e` before correction. `formatProblem` now uses the existing exact parsers for the new numeric/tuple kinds; malformed drafts do not fabricate answer history, while well-formed wrong mathematics still counts. A generic ordered-value label also correctly covers coefficient tuples. Content/oracles remain unchanged. The expanded root-engine gate passes 883 checks, and seven additional native format/reload journeys are prepared.
- Direct comparison with the actual current-base checker tried 11,878 notational variants and preserved all 11,129 previously accepted answers. 1,444 synthetic completed or partly solved records produce identical sanitized state before/after the port, including notes, earlier accepted steps, drafts, routes and a second reload. This uses no real pupil records.
- Full DOM on the initial port passed all 1,789 cards and 4,116 steps; a complete rerun after the format correction is in progress at the source checkpoint. Final results, internal review and actual published source checkpoint are recorded in the completion entry. Historical PR results do not substitute for this candidate's gates.

## Required handoff

```text
EXECUTIVE STATUS
Task: MAKARYCHEV8_ROOTS_CURRENT_BASE_20261114
PR:
Base: add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision: separate explicit merge authorization after review
```
