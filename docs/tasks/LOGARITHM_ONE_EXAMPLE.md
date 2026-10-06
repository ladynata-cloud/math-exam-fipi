# One logarithmic inequality, explained step by step

## Identity

- Task: interactive detailed solution of one variable-base logarithmic inequality.
- Owner: Наталья Михайловна.
- Date: 2026-10-07 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `5092ccd5750db9e260a743d96b1e706449721824` (published PR #200).
- Planned branch: `feature/logarithm-one-example`.
- Review level: `MEDIUM`.
- Related specification: [existing logarithm trainer](PROFILE_LOG_INEQUALITIES.md).
- ADR status: no new architecture or protocol is introduced.

## Goal

Let a learner work through `log_((25-x²)/16)((24+2x-x²)/14)>1` one small
step at a time, understanding where each restriction and transformation comes
from. The full domain system is collected before solving. Each condition and
the final inequality are solved by ordinary roots, signs and number-line
intersection. Earlier accepted steps stay visible.

## Context and evidence

PR #200 supplies the current 48-task trainer and the existing `MathExamBoard`
bridge pattern. The owner approved a separate, more detailed interactive lesson
based on the worked solution developed in this conversation, then explicitly
requested publication. The new page supplements the existing trainer.

The domain is `-4<x<5`, excluding `-3` and `3`. Rationalization reduces the
inequality to `(x²-9)(x²-16x-17)>0` on that domain. Critical values are
`-3,-1,3,17`; the final answer is `(-4,-3) ∪ (-1,3)`. The condition
`24+2x-x²>0` is solved using the roots of `x²-2x-24=0`, not by introducing
auxiliary variables or completing the square.

## Approved scope

### In scope

- New `lesson.html`, `lesson.js` and `lesson.css` in the logarithm trainer folder.
- Small interactive steps, feedback and hints; persistent visible solution work.
- The complete domain system, separate restrictions, aligned number lines and
  explicit intersection of the final solution with the domain.
- Local restoration and ordinary BoardBridge mirroring with isolated identity
  `profile-log-one-example`, version `1.0.0`, state schema `1`.
- A prominent lesson link in the existing trainer; board registry/picker entries.
- Focused mathematical/browser checks and exact registry expectation updates.
- Reconcile the preceding publication and current scope in project status.

### Out of scope

- New task families, changes to the existing 48 mathematical tasks, audio/video.
- Pupil accounts, assignments, group-cabinet integration or server assessments.
- Changes to bridge, authentication, room protocols or deployment configuration.

### Files or areas that must not change

- Existing logarithm `engine.js` and `app.js` mathematics/runtime contracts.
- Account data, credentials and production pupil records.

## Acceptance criteria

- [x] The original example is shown; all three domain conditions appear together
  before their independent solution.
- [x] Domain restrictions and the final inequality have readable number lines,
  open excluded endpoints, and visible intersections.
- [x] Each newly accepted action explains its source and keeps earlier work.
- [x] Wrong input cannot silently advance; hints and progress do not claim
  independent mastery of unseen tasks.
- [x] Reload restores the current work; remote hydration restores the same work
  without an echo or unintended local-storage write.
- [x] Keyboard and narrow-screen layouts allow the whole lesson to be completed.
- [x] The existing trainer links to the lesson and the board picker opens it.
- [x] Registry entries match the runtime bridge identity and exact version/schema.

## Checks and gates

- Required tests: independent checks of the original domain, polynomial roots,
  interval signs and final answer; full lesson/browser journey and bridge hydrate,
  edit, restoration and silent remote-apply checks.
- Required static checks: registry unit/integration tests, catalogue uniqueness
  and paths, local link validation, existing logarithm mathematics regression,
  `git diff --check`.
- Manual checks: desktop/mobile visual review; accepted work, errors and hints.
- Final gate marker: `PROFILE_LOG_ONE_EXAMPLE_OK`, only after the checks pass.
- Checks intentionally not run: production learner writes and account changes
  are excluded; executing agent records any other unrun check explicitly.

## Review plan

- Rationale: bounded new lesson behavior and one entry within the existing bridge
  architecture, with recoverable browser-local state and no server contract change.
- External review required: no; the owner expressly authorized publication
  without a separate external review. Focused internal reviews still apply.
- Any review handoff is limited to this public code and synthetic learner state.
- If external review is used, record provider, PR, base/head SHA, verdict and
  verifiable source or timestamp; a statement in this file is not review evidence.

## Risk and rollback

- Risks: losing an original exclusion, a sign error, an inaccessible step,
  incomplete state restoration or an incorrect mirrored-board declaration.
- Rollback: revert this bounded addition, entry link and registrations. The
  existing 48-task trainer remains the fallback.
- Use a distinct local-storage key; do not migrate or overwrite existing work.

## Permissions

- `START`, branch creation, local commits, push and Draft PR: authorized by the
  owner's active request to create this lesson and publish it.
- Publication: explicitly requested for this task, without a separate external
  review. The executing root records exact-head/current-main and release checks.
- Auto-merge, force operations and changes to repository protections: not requested.

## Execution record

- Actual branch: `feature/logarithm-one-example`.
- Actual base SHA: `5092ccd5750db9e260a743d96b1e706449721824`.
- Actual head SHA / PR / commits: to be recorded by the executing root.
- Tests passed: registry unit/integration 32/32; existing mathematics 2608 probes;
  direct evaluation of the original expression/domain at 30001 sample points;
  existing 48-task browser regression; all 18 new steps at desktop/375px,
  drafts/reload, wrong inputs, hints, keyboard axes, reset/cancel, stale tabs,
  bidirectional bridge restoration and rejection/recovery of malformed hydration.
- Internal mathematical and runtime reviews completed; hydration rejection fixed.
- Local browser launch initially unavailable; tests completed with the installed
  Chromium headless shell. No application test failure remains.
- Not run: production pupil writes, account changes and external review (out of scope).
- Final marker: `PROFILE_LOG_ONE_EXAMPLE_OK`.
- Scope deviations: none planned.

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
