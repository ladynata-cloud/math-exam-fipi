# Explain the right-triangle trigonometry task

## Identity

- Date: 2026-10-10
- Base: main, `be7ca1882228fc3b161ab4472f3bc86dfdd8df48`
- Branch: `fix/profile-triangle-explanation`
- Review level: MEDIUM
- Architecture: accepted ADR 0010; existing task models and assisted practice.

## Goal and evidence

The owner opened help for the task with adjacent side 12 and cosine 0.8 and
correctly observed that a highlighted side and one short caption do not explain
how to solve it. The current task-bound drawing lacks the connection from the
side ratio to an operation and an answer. A pupil needs a short, gradual worked
explanation while keeping the original problem and answer entry available.

## Scope

- Explain the three existing right-triangle sine/cosine/tangent tasks, including
  identifying the relevant sides relative to the marked angle, the meaning of
  the ratio, the choice of operation, arithmetic and a check.
- Open one step at a time; retain earlier steps. Keep readable text and a useful
  drawing visible on narrow screens, with keyboard-operable controls.
- Opening the explanation explicitly records help through the existing model
  context before showing the method. Initial independent practice must reveal
  neither the method nor a calculated answer, including hidden explanation DOM.
- Preserve the current task, answer draft, ordinary solving controls, progress
  contracts and all other diagrams. Explain from the current task metadata.
- Add a focused synthetic learner robot and integrate it into profile CI.
- Reconcile the preceding release in the operational project status.

Excluded: new task banks, changed answers, mandatory prerequisite routing,
profile/account data, authentication, persistence schemas, backend, cloud answer
sync, other subject diagrams, new platform archetypes or clinical claims.

## Acceptance and verification

- [x] Cosine explanation connects 12 = 0.8 × hypotenuse to 12 / 0.8 = 15.
- [x] Sine and tangent explanations correctly explain the multiplication.
- [x] Arithmetic and plausibility checks are readable and mathematically correct.
- [x] Five gradual steps retain previous work and original answer draft.
- [x] Explicit explanation marks assistance before showing the method.
- [x] Independent initial drawing does not leak the method or calculated answer.
- [x] Assisted completion cannot become independent mastery.
- [x] Desktop/mobile/keyboard and existing model regressions pass.
- [ ] Focused independent review, exact-head CI and live publication pass.

Required: targeted browser robot; planimetry model geometry; independent model
assistance checks; first-three actual-browser journeys; JavaScript syntax and
whitespace. The existing complete profile workflow remains the cloud release
gate. Robots verify behavior; they are not evidence of actual pupil learning.

## Review, risks and rollback

MEDIUM: bounded explanation behavior in existing public task models, using the
existing onHelp callback. No storage or server contract changes. Independent
review checks mathematics, progressive disclosure, help accounting and mobile
readability. External review is not required for this level.

Risks are answer leakage, accidental independent credit, confusing ratio
language and a drawing which hides the explanation below the screen. Revert the
scoped assets and script URL versions to roll back; preserve all learner saves.
Only public source and synthetic fixtures enter remote review or Git.

## Authorization and execution

The owner's current correction continues the already authorized development
and cloud publication of the accessible profile course. The existing publication
instruction covers this bounded correction after review and exact-head gates.
Fresh-main verification is required before merge. No force, rebase, disabled
protection, weakened tests or unrelated account-system work is authorized.

Actual execution and release evidence are recorded in this task and the PR.

## Local execution evidence

- Five steps added to the three existing task models; only requested help adds
  explanation DOM. Both opening and advancing retain keyboard focus; previous
  steps remain readable. Metadata supplies numbers and computed arithmetic.
- New learner robot passed six journeys covering the three task types at
  widths 360 and 1280, five-step disclosure, keyboard focus, drafts/reload,
  assistance accounting and exclusion from independent mastery. Browser errors
  and failed requests: none.
- Planimetry geometry: 36/36 passed. Independent-model tests: 8/8 passed,
  including three changed-metadata arithmetic checks.
- Existing first-three browser gate: 108 models and 56 journeys passed at
  widths 360/390/1280. Its first run stopped at an obsolete cosine-help button
  selector; a scoped selector update retained the assisted-state assertion and
  the entire rerun passed. No assertion or gate was removed.
- JavaScript syntax and git diff --check passed. Desktop and narrow-screen
  before/after screenshots inspected: readable cards, no clipping or overflow.
- Focused independent MEDIUM source/test review approved, no P1/P2 findings;
  final commit/tree binding and exact-head cloud CI precede publication.
- Runtime: Node 24.19, Playwright 1.56.1, Chromium 141.0.7390.37, jsdom 26.1.0.
  No real account results were used or modified. Unrelated cabinet/server gates
  were not run locally because their files and contracts are unchanged.
- Cloud CI, fresh-main guard and live publication evidence remain pending and
  will be recorded in the PR; this document does not predict their success.
