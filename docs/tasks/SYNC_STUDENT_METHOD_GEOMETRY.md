# Synchronize the learner with the reviewed method and pyramid geometry

## Identity

- Task: Close the learner/studio behavior gap exposed by production smoke
- Owner: ladynata-cloud
- Date: 2026-08-16
- Base branch: `main`
- Base SHA: `2065e99612a74adb2e1b0596ec768f6e45fe2d5c`
- Planned branch: `agent/sync-student-method-geometry-20260816`
- Review level: `MEDIUM`

## Goal

Make the public learner page use the same already-tested formula layout,
substitution-first logarithmic method, and anchored pyramid models as the video
studio. Production smoke after PRs #108 and #109 proved that only the studio had
received those changes.

## Approved scope

- Port the reviewed layout CSS, task 19 theory and generator, 3D engine,
  pyramid specifications, and task 20 corner-pyramid height calculation into
  `trainers/dvi/math-18-20.html`.
- Preserve learner progress synchronization, assignment handling, local
  fallback, task answers, recording controls, and public URLs.
- Extend `tools/video-factory-v1-gate.mjs` so learner and studio shared
  method/geometry sections cannot drift again.

## Acceptance criteria

- The learner starts every task 19 preset by expressing one variable from the
  first equation and substituting it into the logarithmic equation.
- Learner and studio use identical task 19 generator and 3D engine sections.
- Fractions/questions/options stay vertically aligned.
- Every learner pyramid has base `ABC` in `z = 0`, a visible horizontal
  plane, locked vertical tilt, and explicit `SO = h`.
- Learner progress code and identifiers remain present and unchanged outside
  the ported teaching/visual sections.
- Authoring gate, 30 worker tests, desktop/mobile browser checks, and
  production smoke pass.

## Risk and rollback

- Review level: `MEDIUM`; bounded client behavior with no server or data
  contract change.
- Main risk: accidental drift in duplicated learner/studio teaching code.
- Mitigation: exact shared-section assertions plus generated algebra and
  geometry tests.
- Rollback: revert the squash merge; no migration or persistent-state change.

## Permissions

- This corrective release completes the owner-requested public trainer update.
- Merge and deployment remain limited to this exact learner synchronization.
