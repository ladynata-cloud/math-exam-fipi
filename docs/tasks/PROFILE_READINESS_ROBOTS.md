# Profile first-part readiness and learner robots

- Owner request: test and improve the existing profile course for an OGE-grade-4 learner with grade-9 gaps and substantial trigonometry gaps; write tester and simulated-learner robots.
- Date: 2026-10-09; base: `main`, `aabdb8d9396bef502ced049e7867774c1885ddef`.
- Branch: `feat/profile-readiness-robots`; review: `MEDIUM`.
- The current direct instruction authorizes implementation, local tests, commits, push and a Draft PR. Merge/deployment remain a separate decision under AGENTS.md.

## Scope

Add a short optional diagnostic, targeted prerequisite practice using the existing course engine, and a short trigonometry entry route. Complete the missing final computations in 48 existing algebra/trigonometry tasks. Improve prerequisite navigation and make the finite independent-task bank explicit. Preserve existing lesson/task IDs, saved-work identity, account services and board contracts.

Create deterministic simulated learners with explicit misconceptions, separate from technical answer-key traversal. Run independent mathematical oracles and real-browser error/help/return/reload/mobile/keyboard journeys. These simulations do not establish educational effectiveness with real pupils.

Out of scope: exam numbering changes, second-part expansion, cloud progress integration, account changes, a new learning engine, release infrastructure changes beyond registering relevant tests.

## Acceptance and gates

- All first-part positions in the existing course remain accessible.
- Six prerequisite lessons have distinct guided and independent conditions and independently verified arithmetic.
- All 48 corrected guided tasks require the learner to enter the actual requested result.
- Diagnostic wrong/unknown answers recommend relevant lessons; invalid input is not a mathematical mistake.
- A learner can resume work, revisit an explanation and continue to another lesson even after exhausting fresh independent tasks. Repetition is never represented as a fresh independent success.
- Existing relevant math/state/browser gates and new robots pass; `git diff --check` passes.
- Final marker: `PROFILE_READINESS_ROBOTS_OK`.

## Review, risk and rollback

Focused independent code/content review plus targeted regressions. Bounded client-side course behavior; existing storage schema and server APIs are unchanged. Primary risk is mismatch between guided steps, visual models and route metadata; validate them together. Revert the task commit to roll back; original saved-task IDs and progress stay compatible.

## Execution

Baseline: 62 themes, 372 tasks, 1109 authored guided steps. Read-only audit found missing final computations in all eight algebra-data themes (48 tasks), a 39-block trigonometry route without a compact entry, and a finite three-task independent pool. Final results are recorded in `docs/reports/PROFILE_READINESS_ROBOTS.md`.
