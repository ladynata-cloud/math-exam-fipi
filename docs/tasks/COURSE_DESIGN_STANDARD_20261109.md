# Согласованное оформление учебных курсов

## Identity
- Date: 2026-11-09 (Asia/Novosibirsk)
- Base: main `adc2c9445f6ce7f0a56bca67ed2bc31b8b82ec3c`
- Branch: `codex/course-design-standard`
- Review: MEDIUM — opt-in CSS on existing course entrances, no state or engine changes.
- Scope approval: current owner request to align OGE/EGE/VPR/textbooks/sections design with new principles.
- Release hold: owner requested explicit approval of the final reviewed composition on 2026-11-09; no merge or deployment before that answer.

## Goal and scope
Apply a shared visual shell to the 27 explicitly listed pages in
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

## Acceptance follow-up, 2026-11-09

The previous head 60e65399 completed 43 workflows: 36 success, 7 failure.
The failures were current (not queue delays): compact mobile profile and
Makarychev drawings, profile zoom wrapping, Vilenkin helper overlap, and
historical Atanasyan source fingerprints.

Composition preserves main `463d6bf56fc8f1f944da8d237102f77888711e79`: published
EGE base/profile learning maps and OGE8 corrections. HTML conflict resolution
retains main in full and adds only the two CSS opt-ins. All 27 HTML files restore
main exactly after removing those opt-ins and the single catalogue guide.
No course JavaScript, bank, answer, persistence key or data schema is changed.

The CSS follow-up preserves authored compact header/heading spacing and allows
long labels to wrap at 200% zoom. Historical layout gates accept only an exact
hash-bound reversible stylesheet/body opt-in and still reject changed scripts,
lessons and markup; historical fingerprints and course data are unchanged.
Browser coverage additionally pins the complete profile similarity and
Makarychev41 drawings within the 900px first screen at both test widths.

State checks passed for OGE, VPR, EGE base/profile, Peterson and Makarychev,
including independent versus assisted results, reload, import and stale tabs.
Final browser and full CI results belong to the exact final PR head and are
reported in the PR acceptance record. Local browser process launch is unavailable;
CI screenshots and browser tests provide the full viewport evidence.

Merge and production validation remain on hold until the owner explicitly
approves the final head/base and release contents.
