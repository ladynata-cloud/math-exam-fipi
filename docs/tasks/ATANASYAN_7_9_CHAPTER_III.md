# Атанасян 7–9: глава III «Параллельные прямые»

## Identity

- Task: `ATANASYAN_7_9_CHAPTER_III`.
- Owner: repository owner, explicitly continuing this stage with «продолжай»
  after the status report proposed chapter III, exercises 191–227.
- Date: 2026-10-24 (UTC).
- Base branch: `main`.
- Base SHA: `631d2d644d87162d60585c3efb8365af8311a3f5`.
- Planned and actual branch: `content/atanasyan-7-9-chapter3`.
- Review level: **HIGH** (source-faithful mathematics and visual proofs).
- Parent scope: [complete 7–9 course](ATANASYAN_7_9_COMPLETE_COURSE.md).
- ADR 0006 remains Proposed; established runtime and gates define the format.

## Goal

Extend the published detailed course with every exercise and subpart of
chapter III, the chapter's theory and all 17 review questions. Each card has
its own accurate drawing, small justified steps and nearby theory. This is
one complete chapter, not completion of the whole textbook.

## Context and evidence

- Exact source: Atanasyan et al., Geometry 7–9, 14th revised edition, 2023;
  SHA256 `3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.
- Printed pages 53–68 correspond to PDF pages 54–69. All conditions, parts,
  figures and theory statements must be visually checked against these pages.
- PR #308 published chapters I–II: 336 cards, exercises 1–190, 23 theory
  points, 47 self-checks, 1053 steps and 1648 model states. On task start all
  six public course files returned HTTP 200 and matched the base bytes.
- PR #318 subsequently delivered exactly exercise 92a and its four theory
  references to the cabinet/board; its final release record confirms the
  backend and native plan delivery. That integration remains intact.
- Source scans, source PDF and uncorrected OCR stay outside the repository.
  Learner-facing conditions are faithful paraphrases with source pages.

## Approved scope

### In scope

- All 37 numbers 191–227, including every source subpart and practical task.
- Complete chapter-III theory and all 17 chapter-qualified review questions.
- Task-specific planar models, source maps and independent mathematical checks.
- Required extension of completeness, preservation, review and browser gates.
- A chapter-specific review manifest only after the actual reviews pass.
- A bounded status reconciliation, one branch, logical commits and one Draft PR.

### Out of scope / preserved areas

- Later chapters, any other textbook or a new trainer architecture.
- Runtime/assets, authentication, grading, server, cabinet or board changes.
- Existing 336 normalized lessons, their IDs, review provenance and saved work.
- Existing review approvals may not approve new content implicitly.

## Acceptance criteria

- [x] Every number, subpart, theory point and self-check is independently
  source-verified; no gaps or fabricated tasks.
- [x] Every solution has correct grounds and uses only established facts,
  or supplies the missing proof. Measurement examples are not universal proofs.
- [x] Every card has its own model; coordinate claims agree with the condition.
- [x] Initial views show givens only; additional lines appear at their step;
  alternative cases are separate, with legible labels at 320 and 1280 pixels.
- [x] All 336 published cards, implementation files and learner-state semantics
  remain unchanged; the 92a integration continues to resolve its fixed IDs.
- [x] Reproducible build, source/model/runtime/browser checks and independent
  source/mathematics/visual/integration review pass.
- [ ] Exact-head CI passes; its post-commit results belong to the Draft PR handoff.
- [x] Final scoped diff and `git diff --check` are clean; failures and skipped
  checks are explicitly recorded.

## Checks and gates

Required: source preparation check; reproducible build; review-scope tests;
coordinate-model and model-claim tests; strict reviewed course check; retained
work and reviewer runtime checks; all-card browser checks at 320/1280; relevant
legacy/navigation/SEO checks; exact-head cloud workflows; final diff audit.

Final preparation gate: `ATANASYAN_7_9_CHAPTER_III_READY`, only when supported
by completed evidence. A real-pupil pilot is not part of this development
verification and must not be implied. No publication gate is claimed here.

## Review plan

The chapter retains the approved interaction and learning pattern. The existing
course-specific owner exception in the parent scope permits continuation
without the unavailable Claude consultation, with independent source,
mathematics, model and actual visual reviews. No Claude consultation, external
provider verdict or global review waiver is claimed. Reviewers must not review
their own authored block. Evidence is bound to hashes and current content.

Remote review handoffs contain only necessary public code and synthetic checks;
no source scans, personal records, credentials or machine paths are published.

## Risk and rollback

Main risks: omitted source cases, OCR confusion, circular use of parallel-line
criteria and properties, reliance on the later triangle angle-sum theorem,
incorrect ray orientation and crowded angle labels. Use independent source and
proof review, exact geometric assertions and real browser inspection. Rollback
is an ordinary revert of the final scoped commit; existing learner keys and
published card identities are retained.

## Permissions

- START: yes, current explicit «продолжай» for the presented chapter-III scope.
- Branch, local commits, push and Draft PR: yes, under repository workflow.
- Merge, auto-merge and deployment: **no; separate owner authorization required**.
- Force, reset, rebase, non-fast-forward merge, admin override, disabled TLS or
  weakened tests: not authorized.

## Execution record

- Base and clean isolated worktree verified; one task branch created.
- Source, mathematics, models and teaching sequence independently reviewed;
  all 67 new cards and all 788 final view/width pairs covered.
- Final engineering candidate v3 passed the full browser gate: 403 cards,
  4084 view checks, 806 step flows, 1612 initial/final captures and 12 interaction
  scenarios at 320/1280 pixels; no geometry issues or page errors.
- The strict reviewed-content gate passes for all 403 cards. A separate public
  run passed ten interaction scenarios, including both chapters' direct links.
- Chapter-specific review manifest was created only after those reviews passed.
  All 336 earlier lesson objects and catalog entries remain exactly equal to
  the base Git objects. No source scans or machine paths enter the patch.
- Detailed checks, corrected development failures, review provenance and artifact
  hashes are in `docs/reviews/ATANASYAN_7_9_CHAPTER_III_LOCAL_REVIEW.json`.
- Exact committed head, Draft PR and cloud-CI outcomes will be recorded in the
  PR body. This avoids a recursive documentation commit changing the checked head.
- No chapter-III merge or deployment authorization has been received.
