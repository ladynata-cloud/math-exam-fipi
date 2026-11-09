# Согласованное оформление учебных курсов

## Identity
- Date: 2026-11-09 (Asia/Novosibirsk)
- Base: main `adc2c9445f6ce7f0a56bca67ed2bc31b8b82ec3c`
- Branch: `codex/course-design-standard`
- Review: MEDIUM — opt-in CSS on existing course entrances, no state or engine changes.
- Scope approval: current owner request to align OGE/EGE/VPR/textbooks/sections design with new principles.
- Release authorization: [standing policy](../OWNER_RELEASE_AUTHORIZATION.md).

## Goal and scope
Apply a shared visual shell to the 26 explicitly listed pages in
`assets/course-ui-pages.json`, document the learning UI standard, and explain
the learning cycle in the existing course catalogue. Shared font hierarchy,
primary actions, card shape, mobile header and keyboard focus. Model palettes,
math engines, task banks, answers, progress schemas and course URLs are unchanged.
Open progress PRs #494–499 and unpublished sections PR #474 are separate work.

## Acceptance and checks
- Every scoped entrance opts in once and retains all prior scripts and routes.
- CSS is parsed successfully; text and primary actions meet 4.5:1 contrast.
- Verify representative home/task screens in the browser and mobile layout.
- Existing navigator preservation, relevant HTML/source checks and CI.
- Diff review, no new persistence or external calls, `git diff --check`.
- Gate: COURSE_DESIGN_STANDARD_OK only after results recorded.

## Review and rollback
Focused review of selectors and interaction states. No universal button rule
that recolours answer choices; no CSS inference of learning progress.
External review not performed under standing policy. No new trainer or
mathematical sequence is introduced. Real-pupil usability is not measured.
Rollback by reverting this task's stylesheet includes, body attributes and
catalogue guide; no data migration or pupil data restoration is needed.

## Context reconciliation
PROJECT_STATUS contains historical preparation notes. Remote main already
contains the equations pilot (#492); the current open PRs separately cover
new learning maps. This task starts from the authoritative main above and
leaves their publication decisions to their owning tasks.

## Execution
Checks, final commit, CI and release evidence are recorded in the PR.
