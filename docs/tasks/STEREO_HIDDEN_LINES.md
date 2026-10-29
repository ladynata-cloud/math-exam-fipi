# Hidden lines throughout the stereometry courses

## Identity and authorization

- Owner: Natalya; task requested 2026-10-30 (Asia/Novosibirsk).
- Base: `main`, `6fb959fc0130a0bb8842601d19297e305ac91ac0`.
- Branch: `fix/atanasyan-hidden-lines-20261030`; review level HIGH.
- Explicit owner request: correct the whole Atanasyan course and every other
  stereometry course previously built. This authorizes implementation, checks,
  commits, push and a Draft PR. Merge requires a separate reviewed decision.
- Cone PR374 remains separate and unpublished. Its 40 prepared cards are a
  compatibility target, not content silently added to this correction.

## Problem and outcome

The shared SVG viewer classified only boundary edges with two adjacent faces.
Auxiliary segments, highlighted sections and arrows were always solid. Some
authored models omitted solid faces altogether. The three legacy canvas viewers
also drew all body edges solid and all learner constructions dashed.

Every drawn line must be split into visible and hidden intervals, recomputed
when the camera changes. Hidden intervals are dashed; silhouettes and visible
surface lines remain solid. In the reported first Atanasyan figure, DE, EC and
MK are hidden in the default view, while DC is a visible silhouette.

## Scope and preservation

- Atanasyan textbook, Merzlyak 10 base, Shestakov–Yashchenko 10–11,
  the original spatial workshop, and the Merzlyak/Pogorelov spatial atlases.
- Shared SVG and legacy canvas visibility, missing reviewed surface topology,
  analytic spheres, selected section outlines and learner constructions.
- Exact-signature model amendments supply missing faces without rewriting
  lesson conditions, proofs, source metadata, reviewed lesson bytes or storage.
  Open surfaces stay open; abstract line diagrams do not acquire invented solids.
- Historical hashes remain intact. A separately hash-bound runtime amendment
  verifies the changed viewer and styles against their archived originals.
- No accounts, learner records, server, assessment, paid provider requests or
  unrelated course continuation changes.

## Required checks and review

- Independent ray/triangle and ray/sphere oracle for all authored model views,
  rotated models, partial occlusion, concavity, coplanarity and silhouettes.
- Explicit source-model topology audit and independent review of corrections.
- Real browser inspection at phone and desktop sizes, including the reported
  defect, rotated views, highlighted sections and retained work.
- Entire inherited textbook, shared course, workshop and atlas technical gates;
  exact-head CI and complete existing textbook browser shards.
- Reproducible profile compilation and standalone workshop rebuild; clean diff.
- Gate: `STEREO_HIDDEN_LINES_REVIEW_OK`, emitted only after all required checks.
- Independent technical review is required. The existing owner decision in
  `TEXTBOOK_ATANASYAN.md` defers paid calls for this textbook work; no external
  provider review is claimed. The expanded HIGH scope across the other courses
  still requires external review or an explicit owner waiver before merge.
  This corrects existing drawing behavior and does
  not introduce a new learning interaction or trainer archetype.

## Risk and rollback

Numerical tangency, partially occluded lines, missing or wrong surfaces,
coincident dash phases and render cost are the principal risks. Independent
geometry oracles, exact model profiles and actual browser checks cover them.
An ordinary scoped revert restores the previous render assets; unchanged
lesson identities and storage formats retain learner work. No data migration
or destructive operation is needed.

## Execution record

Local implementation and independent numeric/code review are complete.
There are 245 exact-model surface amendments; all 2086 published lesson records
and all three course bundles remain byte-identical. The 40 unmerged cone cards
were additionally checked without adding them to this branch.

- [Independent review](../reviews/STEREO_VISIBILITY_INDEPENDENT.json).
- [Sphere and generated-surface review](../reviews/STEREO_VISIBILITY_SPHERES.json).
- [Integration checks](../reviews/STEREO_VISIBILITY_INTEGRATION.json): 46 distinct
  checks passed, with initial failures and their bounded repairs recorded.
- Final SVG SHA256: `91ef00cd15e0e831fa835c089116e5150813ce0bd6554280d3e9f76a5c547f64`.
- Final CSS SHA256: `1100ff4d47f419db531fc8f08d923e910c297413de4ccc572abe340a18fe972d`.
- Full local ray checks passed for 2126 cards against the preceding numeric
  renderer snapshot; 18 focused scenarios passed after the final component-normal
  correction. Exact-head CI repeats the complete three-course checks.
- Local browser launch was unavailable because the host disallows Chromium's
  socket operation. This is not a visual PASS. Real SVG/canvas page scenarios,
  complete inherited browser runs and screenshot artifacts are required in CI.

Final head, PR, exact CI gates, actual screenshot review, limitations and the
separate release decision are recorded in the completed PR handoff.
