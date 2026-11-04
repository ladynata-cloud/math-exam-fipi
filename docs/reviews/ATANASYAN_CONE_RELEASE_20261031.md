# Cone release reconciliation — 2026-10-31

Owner request: reconcile PR374 with current main, preserve prior lessons and
learner work, repeat geometry/formula/mobile checks, and publish after success.
This is the same cone task, branch and PR, not a new curriculum batch.

Current base: `c9bf66e2d95f48db0134d43cc590da89f8bc3053`.
Original reviewed head: `065c2a294faf0f3b505eb53a2c8ac4f55621e313`.

## Reconciliation

The eight intervening main commits are GitHub PR merges #373, #379, #376,
#368, #378, #380, #382 and #377. Their published changes are preserved.
A virtual merge found one conflict, in PROJECT_STATUS.md. Both course-status
sections were retained and the completed PR376 release was reconciled against
its primary PR evidence. The workflow and cylinder test merged cleanly.

No lesson, bundle, mathematical answer, source caption, storage identifier or
runtime is changed relative to the reviewed cone candidate, except the two
shared visibility assets already published by PR376 (and retained byte-for-byte
from current main). Current main's textbook entry page is also preserved.

The first cone content gate correctly rejected the new shared renderer against
its old frozen baseline. It now uses the existing strict visibility migration
for exactly those two assets: original hashes and archived bytes remain frozen,
current bytes must match the published migration. Every other frozen file keeps
its direct hash assertion. The migration's negative controls now cover the cone
baseline as well. No historical fixture or expected content hash was rewritten.

## Completed local checks before CI

- Deterministic 594-card build and seven source catalogue checks.
- Independent cone oracle: 3120 parameter cases, 40 actual models, 2576 facets,
  171 model states and 166 justified steps.
- Cone content: 40 exact cards, all prior 554 files and reviews preserved,
  source completeness, actual DOM, 20 negative controls.
- Visibility migration: seven historical baselines, exact two assets, archived
  originals and 21 negative controls.
- Runtime: publication gate, source identities, help, camera, drafts, revision
  recovery and proof honesty.

Full current-composition source, visibility and cloud browser checks continue
in the existing workflow. The final exact-head CI, actual screenshot inspection,
merge and deployment evidence belongs in PR374. This preparation record does
not claim those subsequent operations have passed.

Historical independent content/mathematics reviews still bind the unchanged
40 lesson files. Historical screenshots are not claimed as new-renderer images.
The whole-textbook paid-review deferral recorded in the parent task remains
applicable; no new external-provider verdict is claimed.

Rollback: ordinary scoped revert of the released cone delta; no learner data
migration or live pupil mutation. Sphere and later sections remain pending.
