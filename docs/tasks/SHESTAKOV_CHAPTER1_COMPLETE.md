# Shestakov–Yaschenko: complete chapter 1

## Identity and authorization

- Task: SHESTAKOV_CHAPTER1_COMPLETE.
- Owner request: «продолжай», 2026-10-24 (Asia/Novosibirsk), following publication of the first course release. This is START for continued course authoring.
- Base branch / SHA: main / 043006f439475124b3bb814c81fc887ecbadbe7c.
- Branch: content/shestakov-chapter1-complete.
- Review level: HIGH, because the change adds 192 source geometry variants with proofs and task-specific models.
- No new architecture or interaction pattern. Existing task-first engine, retained steps, optional help, local progress and manual proof handling remain.

## Goal and scope

Complete all 126 numbered exercises / 252 variants in chapter 1, «Отрезки, углы, треугольники», of the supplied 2021 third edition. Add the 192 missing variants from sections 1.1–1.5, preserving all 60 released chapter-one variants and all five companion theory cards exactly. The rest of the course is unchanged. The resulting authored course has 516 exercise variants, 27 theories and 1,464 pending variants; this is not the complete problem book.

Included: exact source/page mapping, complete derivations and answer forms, faithful models, independent cross-review, full relevant gates, deterministic authoring and an updated offline artifact. Any genuinely ambiguous source condition is identified explicitly and analyzed; it is not silently rewritten or given a unique automatic answer.

Excluded: cabinet/shared-board integration, runtime redesign, catalog promotion, source scans/OCR, pupil data, unrelated course edits, deployment without a new concrete release decision. The earlier release authorization explicitly bound unchanged head efa7f90d; it is not represented as authorization for this new content head.

## Evidence and preservation

PR324 published commit 5de3d1ad4ad1fb77f477f31a6fdd44f091f86a20. Pages, both automatic post-merge workflows, 18 production HTTP/byte checks and live desktop interaction checks passed. The current base adds Alimov PR322 without touching this course or shared scene/math/style dependencies. `ch1-completion-scope.json` records exact canonical hashes for the 60 released exercise records and five theory records.

## Acceptance and gates

- Every source chapter-one variant is present exactly once, with correct edition/page/level/number/part.
- Complete source-derived solutions, meaningful justified steps and separate task-specific models.
- All objects given in the condition are initially visible; only genuine auxiliary constructions are revealed later.
- Proofs and underdetermined source conditions use manual discussion, with no automatic correctness claim.
- Existing released records and runtime/storage contracts remain unchanged.
- Independent review binds each author module and its actual records; the chapter review hash is promoted only after all new content passes.
- Deterministic authoring/bundle; source/schema/coverage/preservation; independent mathematics; geometry; full mobile/desktop model and retained-step browsers; offline checks; `git diff --check`.
- Final gate: SHESTAKOV_CHAPTER1_COMPLETE_CHECKED, only after actual successful checks.

## Review and external access

Six author scopes receive cross-review by different AI agents. Review includes the original PDF and rendered source figures, independent recalculation, all solution steps, valid geometric configurations, initial visibility and answer aliases. These reviews are not human teacher approval or a real pupil pilot.

The engine and learning interaction are unchanged. A new design consultation is not needed for a new interface; the difficult added content is still reviewed under HIGH. Local authorized Claude credentials and a connector are unavailable. The prior bounded Anthropic request returned HTTP400 without a verdict; no automatic repetition of that failed request or billing change is allowed. External release approval or an explicit justified owner exception remains required for this new content; the first-release exception is not a standing waiver.

## Risks and rollback

Risks: source transcription, hidden assumptions, multiple geometric configurations, radical aliases and crowded diagrams. Check the actual PDF and mathematical constraints, preserve ambiguity honestly, and run all new models at both widths. Revert only the scoped added content/tools and regenerated bundle if needed. Keep all prior course records, namespaces and pupil work; no server migration exists.

## Permissions and execution

The current continuation authorizes branch, implementation, tests, commits, push and one Draft PR. Merge, auto-merge and deployment require a concrete subsequent owner decision. No force/reset/rebase/admin override, disabled TLS or weaker test is permitted.

Execution evidence, exact head, CI and review limitations will be recorded in this task's PR and completion report. No release success is predicted here.

## Completed local candidate

All 192 additions passed six independent scoped reviews and executable mathematical suites. The resulting chapter has all252 variants, preserving the released60 and all5 theory records. Whole-course source/schema, geometry,543 retained-step journeys,3780 model states,12 existing interaction scenarios,10 new answer/proof scenarios and2 added mobile journeys passed. The offline543-card HTML passed with networking disabled. See `tools/shestakov-yaschenko/ch1-completion-report.json` for exact hashes, the corrected test assumption, source clarification and limitations. Final-head CI and the new release decision belong to the Draft PR; no new publication is claimed.
