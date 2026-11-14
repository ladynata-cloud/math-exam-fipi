# MathExam task specification

## Identity

- Task: GEOMETRY_PROOF_FIGURES_20261114
- Owner: MathExam owner
- Date: 2026-11-14 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a`
- Planned branch: `fix/geometry-proof-figures-20261114`
- Review level: `MEDIUM`
- Related issue or ADR: unfinished diagram work in PR #534; published middle-line work in PR #595.
- ADR status: no architectural change; no Proposed ADR treated as authority.

## Goal

Show the figure that belongs to the current condition when a pupil builds a
proof, follows a numerical solution, or writes an explanation independently.
Complete seven existing Atanasyan atlas routes without changing their answers,
progress format, construction tools, or the published middle-line lesson.

## Context and evidence

- The owner asked on 14 November to finish unfinished trainers and resolve
  routine questions independently. This specification bounds one component of
  that requested work.
- Current `lesson.js` supplies a visible proof/practice figure only for
  `midline`. Other proof pages offer a collapsed, generic triangle regardless
  of their condition.
- PR #534 contains four useful proof sketches in
  `geometry-course/assets/proof-diagrams.js`, head
  `50862960271fccc8e104405bb9a70bc9216929df`. Their geometry informs this work;
  its unrelated 107-file patch and previous check results are not imported.
- Seven routes use those proof types: `segments`, `equality`, `length`,
  `chords-tangent`, `circle-position`, `projections`, `pythagoras`.
- A proof's letters and values can differ from the numerical exercise. Each
  practice figure must come from that exercise's generated condition.
- All 63 standalone atlas pages embed shared runtime sources. Their generated
  script payloads must be refreshed together; the existing page shells,
  canonical URLs, navigation and `COURSE_CONFIG` are preserved byte for byte.

## Approved scope

### In scope

- Four proof figures with labels matching the given condition, and visual
  emphasis for the selected/completed reasoning step.
- Matching numerical figures for the seven existing practice generators,
  without disclosing the requested numerical answer.
- Figures in proof, supported solution, independent task and written-proof
  stages. Keep the existing middle-line rendering intact.
- An empty optional sketch field for these seven routes, with explicit drawing
  instructions and a notice that this temporary sketch is not saved.
- A script-only refresh option in the canonical builder, regression checks and
  browser scenarios on 320 × 900 and 1280 × 900.

### Out of scope

- Changing proof dependencies or the order in which valid steps are restored.
- New tasks, new learning sequences, or figures for all remaining proof types.
- Pogorelov/Merzlyak changes, server/board protocol or cloud synchronization.
- Merging PR #534, releasing this task, or modifying a different open PR.

### Files or areas that must not change

- `AGENTS.md`, release/review rules and `PROJECT_STATUS.md`.
- Existing task questions, answers, solution steps, fingerprints and saved IDs.
- `midline-diagram.js`, geometry construction logic, storage schema and backend.
- The non-script shells of all standalone atlas pages.

## Acceptance criteria

- [ ] All seven target routes have a visible figure matching the current proof.
- [ ] Practice figures use the current generated values and the requested
      unknown remains `?` until the ordinary answer checker resolves it.
- [ ] Proof emphasis follows the chosen step; written proof starts with the
      given condition, without displaying completed reasoning as the answer.
- [ ] A reload preserves the existing proof progress, numerical draft and
      written text; figures reconstruct from the saved task/step.
- [ ] Existing middle-line and unrelated lessons retain their current behavior.
- [ ] At both required viewport sizes, condition and figure fit within the
      first screen after opening the relevant stage.
- [ ] All generated runtimes match source; page shells and current conditions
      are preserved exactly.

## Checks and gates

- Required tests: existing geometry numerical/construction suites; new figure
  geometry/data tests; DOM regression scenarios; browser figure/saved-work
  scenarios and the existing complete atlas browser suite.
- Required static checks: JS syntax, exact generation, preserved shells,
  relevant navigation/SEO gates, `git diff --check`.
- Manual checks: inspect rendered figure artifacts and browser screenshots.
- Final gate marker: `GEOMETRY_PROOF_FIGURES_20261114_GATE_OK` after all required
  local and CI checks complete.
- Local Chromium cannot start in this executor: `socket() failed: Operation
  not permitted`. The failed launch is recorded; no browser pass is claimed
  until the real CI browser job succeeds.

## Review plan

- Review-level rationale: bounded visual rendering and generated static assets;
  no persistence/authorization/server contract change.
- Trainer design consultation: no new archetype or sequence. Design review
  checks consistency between given conditions, labels, visual emphasis and
  independent-work claims.
- Before implementation: code/proof-data audit showed missing visible figures
  and a mismatch between proof and practice conditions; preserve both as
  separate diagrams. No external provider consultation performed.
- Ready-result review: mathematical invariants, actual DOM interactions,
  independent technical review and CI screenshots. A real-pupil pilot is not
  represented as completed by automated checks.
- External review required: not requested for this task; none claimed.
- Sanitized handoff: only this diff, generated checks and synthetic pupil data;
  no private documents, credentials, or machine-specific paths in the PR.
- External review, if later requested, needs provider, PR, exact base/head,
  verdict and verifiable timestamp/source.

## Risk and rollback

- Main risks: a diagram mismatching the numerical condition, accidentally
  showing a requested answer, lost shell/navigation during regeneration, or
  changed middle-line behavior.
- Rollback: ordinary reviewed revert of this task commit; no data migration.
- Compatibility: progress keys, proof IDs, task seeds, fingerprints, drafts,
  responses, saved drawings and board messages are unchanged.

## Permissions

- Current owner execution instruction: «доделай пожалуйста … постарайся все
  вопросы разрешить самостоятельно». It authorizes this bounded implementation
  and review work; no historical review marker is used as a new approval.
- Branch creation, local commits, push and Draft PR: yes.
- Release authorization: the explicit repository rules supplied by the owner
  in this conversation take precedence over broader standing release text.
- Merge allowed: **no; separate explicit owner authorization required**.
- Auto-merge: **no**.
- Deployment allowed: **no**.

## Execution record

- Actual branch: `fix/geometry-proof-figures-20261114`
- Actual base SHA: `add234c3ecb3204d4d7c9b3ef99f7b98a33bf37a`
- Actual head SHA and PR: recorded in the final handoff.
- Tests passed locally: 46,552 existing mathematical assertions; 17 test cases
  covering all 63 construction scenes, exact generated scripts/shells, 4,410
  unchanged numerical conditions/answers/steps/fingerprints, the seven new DOM
  learning flows and the existing middle-line route. Diagram geometry was
  checked by independent dot products, distances and ratios. The four proof
  figures and seven numerical figures were visually inspected as rendered SVG.
- Generation: the canonical script-only refresh preserves the page shells and
  `COURSE_CONFIG`; `git diff --check` passed. Navigation receipts await the
  published source checkpoint so they can bind to an available Git object.
- Tests failed: local Chromium launch blocked by executor socket permission.
- Tests not run: production publication and real-pupil pilot.
- Scope deviations: none.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
