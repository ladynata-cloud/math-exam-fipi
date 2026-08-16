# Remove the unexplained DVI label from all tasks 18–20 pages

## Identity

- Task: Complete the user-facing label cleanup found by production smoke
- Owner: ladynata-cloud
- Date: 2026-08-16
- Base branch: `main`
- Base SHA: `085c6545afacf136c07c853a4dc96af618dbace7`
- Planned branch: `agent/remove-dvi-tasks-18-20-20260816`
- Review level: `SMALL`

## Goal

Remove the unexplained word “ДВИ” from the learner and teacher pages after the
studio-only release exposed the remaining two public surfaces during production
smoke.

## Approved scope

- Update only user-facing title, heading, and source-comment copy in
  `trainers/dvi/math-18-20.html` and
  `trainers/dvi/math-18-20-teacher.html`.
- Extend `tools/video-factory-v1-gate.mjs` so all three tasks 18–20 pages are
  checked together.
- Preserve the existing `/trainers/dvi/` URL, progress contracts, worker API,
  trainer mechanics, and all mathematical content.

## Acceptance criteria

- No user-facing Cyrillic word “ДВИ” remains on the learner, teacher, or studio
  page.
- Existing learner and teacher scripts remain byte-for-byte unchanged apart
  from the listed copy replacements.
- The video-factory authoring gate and all video-worker tests pass.
- Production smoke confirms the new titles and headings on all three URLs.

## Checks and risk

- Required gate: `node tools/video-factory-v1-gate.mjs`
- Required tests: `npm.cmd --prefix video-worker test`
- Review: `SMALL`; self-review and exact diff are sufficient.
- Risk: minimal copy-only change plus a regression assertion.
- Rollback: revert the squash merge; no data or configuration changes.

## Permissions

- The owner explicitly requested that the prepared changes appear publicly.
- Branch, commit, PR, merge, and deployment are limited to completing that
  already-requested publication after the smoke-test finding.
