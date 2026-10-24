# Grade 6: least common multiple and greatest common divisor

## Identity

- Task: `GRADE6_NOK_NOD_BOARD`
- Owner: MathExam owner
- Date: 2026-10-25 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `91dd1e5a3f85e29709df922fa88859204aac100d`
- Planned branch: `feat/grade6-nok-nod-board`
- Review level: `MEDIUM`
- Related architecture: implemented classic board registry and Bridge SDK;
  existing fixed course reference cards in saved teaching plans.
- ADR 0001 remains `Proposed`; it is not treated as accepted architecture.

## Goal

Create two accessible grade-six trainers for НОК and НОД, attach them to the
requested existing pupil's cabinet, and support joint work on the existing
teacher board. A learner should be able to factor both numbers, distinguish
common from missing factor occurrences, and calculate and check the result.

## Context and evidence

- The current remote repository was cloned from `main` into a clean worktree.
- The requested existing cabinet and its Vilenkin grade-six direction were
  verified through the authenticated teacher interface. Its private identifiers,
  access credentials, and learning records are intentionally absent from git.
- PR315 is merged. The existing cabinet has the Vilenkin course; this task
  preserves its 27 managed modules and the existing 378-entry learning catalog.
- `trainers/board-bridge.js`, the manifest-driven registry and the classic board
  implement hydration, writer transfer, origin checks, reload, and late join.
- `LearningPreparationUI.planCoursesMarkup` already supports fixed, allowlisted
  course references in a saved plan note. This integration is presentation only
  and does not create a managed attempt or independent credit.
- The previous screenshot-specific explanation method could not be recovered.
  The proposed factor-column method is a design choice, not a claim of an exact
  match with an unavailable screenshot.

## Approved scope

### In scope

- Two fixed trainer entries, `grade6-nok` and `grade6-nod`, and their shared
  mathematical and interactive implementation.
- Twenty-four carefully checked number pairs per topic, grouped into three
  difficulty levels, with separate guided and independent working modes.
- Interactive prime factorization columns, factor matching with multiplicity,
  explicit rules for НОК/НОД, contextual help and specific error feedback.
- Keep accepted rows, drafts and the current problem while opening help or
  changing the working mode. Assistance remains recorded for the current task.
- Strict, bounded semantic state for the existing board SDK; restore drafts,
  factor rows, selections, answer, help and feedback without echo or statistics.
- Add exactly two manifest and picker entries. Update exact inventory assertions
  additively, preserving all existing entries and protocol checks.
- Two fixed plan-reference cards with normal practice links and teacher board
  links; preserve the original course and any existing plan contents.
- Relevant mathematics, DOM, browser, real local board/server and regression
  gates, independent technical review, and one Draft PR.
- After separate release authorization and verified deployment, append the
  two canonical links to the selected pupil's existing plan through teacher UI.

### Out of scope

- A new board protocol, trainer archetype, database schema, server persistence
  contract, account, login, authorization rule, personal mastery score, or
  modification of published Vilenkin teaching content.
- Changes to another pupil, automatic assignment to every grade-six pupil,
  a production test that submits fabricated pupil answers, or a claimed
  real-pupil learning-outcome trial.
- Billing changes, new API credentials, automatic paid consultation retries,
  merge, auto-merge, or deployment without the required separate decision.

### Files or areas that must not change

- Board/server core transport, authentication, data storage and managed learning
  contracts; existing course banks and the 378-entry learning catalog.

## Acceptance criteria

- [x] Both trainers have verified answers for all 24 authored pairs, including
  equal, coprime and divisible pairs and repeated prime factors.
- [x] A complete guided solution is possible with keyboard and pointer; any
  valid prime divisor is accepted, and accepted steps remain visible.
- [x] Empty, invalid, wrong, correct and assisted answers receive truthful
  feedback; closing help does not erase assistance.
- [x] No hint action changes the selected problem, clears an entered answer,
  or silently fills the final answer.
- [x] State restores the visible work exactly; malformed state is rejected
  atomically and cannot inject markup or write personal progress.
- [x] Teacher/student mirroring, grant/revoke, reload, late join and no-echo
  behavior pass against the actual local board and Socket.IO server.
- [x] Mobile and half-screen layouts remain readable without horizontal overflow.
- [x] Exact registry union is 47 declarations / 18 mirrors; previous picker
  records and all 378 managed catalog entries remain intact.
- [x] Both assigned cards appear only for a note with their exact canonical URLs;
  lookalike URLs do not create assignments, and existing plan items remain.
- [ ] After release, verify production files and registry before saving and
  reloading the requested cabinet's updated plan.

## Checks and gates

- Mathematics: `node --test tools/number-theory.test.cjs`.
- Interactive DOM and state: `node --test tools/number-theory.dom.cjs`.
- Plan cards: `node --test tools/learning-number-theory-plan.dom.cjs` and existing
  Peterson/focus/Vilenkin cabinet regression tests.
- Registry: existing server registry and server-registry integration tests,
  plus picker smoke and preservation checks.
- Browser: `node tools/number-theory-board.browser.cjs`, actual local
  teacher/student sessions and separate standalone desktop/mobile journeys.
- Static: JS syntax, exact changed-file inspection, `git diff --check`.
- Technical gate marker: `GRADE6_NOK_NOD_TECHNICAL_OK`.
- Release gate marker only after authorization, deployment and saved assignment:
  `GRADE6_NOK_NOD_CABINET_BOARD_OK`.
- A technical gate is not publication authorization or a pupil pilot.

## Review plan

- MEDIUM: bounded new learning behavior and registration within implemented
  architecture, with no new persistence or access boundary.
- Trainer design consultation applies under `TRAINER_CLAUDE_CONSULTATION.md`.
- Before implementation, the local environment was checked for an authorized
  Anthropic API path without reading or logging secret values. No API key or
  general read-only Claude connector is available. Existing repository review
  workflows are narrowly scoped to other tasks; they were not repurposed.
- Status: external design consultation **unavailable / not completed**. No
  provider request, advice, verdict, charge or waiver is claimed. Useful
  technical preparation continues; this record does not waive release review.
- Ready-result review: independent mathematical verification, UI/state and
  integration review, plus the actual gates. External review remains pending
  an available authorized path or an explicit owner decision for this task.
- Sanitized review material includes only these public source files, synthetic
  examples and test evidence. It excludes real pupil identities and records.
- Any external release review must identify provider, PR, exact base/head,
  verdict, and verifiable source or timestamp. No prior task's exception applies.

## Risk and rollback

- Risks: repeated prime factors matched twice; stale drafts or feedback after
  state restoration; help mistaken for independent work; registry/picker drift;
  links attached to a pupil before deployment is available.
- Rollback: a forward patch can remove the two plan reference cards and registry
  entries and remove only these two links from the affected plan note. Preserve
  unrelated note contents, original course assignments and all saved work.
- No database migration or data deletion is introduced. Classic shared-room
  state retains its existing memory-backed lifetime; durable personal storage
  is not promised by these standalone trainers.

## Permissions

- Current owner instruction explicitly requests finding the existing cabinet,
  creating both trainers, adding them, and synchronizing with the board. It is
  the current task's start instruction; no literal copied `START` is claimed.
- Task branch, implementation, local validation, logical commits and Draft PR
  preparation are within that requested scope.
- Merge, auto-merge and deployment: **not yet separately authorized**.
- Assignment to the identified existing cabinet is requested, but will occur
  only after its new links are deployed and verified.

## Execution record

- Actual branch: `feat/grade6-nok-nod-board`
- Actual base: `91dd1e5a3f85e29709df922fa88859204aac100d`
- Head / PR / exact tests: recorded in the completed Draft PR handoff.
- Local mathematical checks pass: all 39,601 ordered pairs in the supported
  range were checked against independent divisor/multiple enumeration; all
  24 authored pairs and strict-input diagnostic cases pass.
- All 14 interactive DOM/state scenarios pass, including all 48 complete
  guided journeys, arbitrary prime order, assistance retention, malformed
  snapshots, actual SDK hydration, no echo and no storage effects.
- New cabinet DOM scenarios 7/7 pass; existing Peterson 11/11 and focus-link
  5/5 regressions pass. Registry units, all seven server integration scenarios,
  six existing picker test files, syntax and whitespace checks pass.
- Actual local board/browser gate passes for both trainers: teacher/pupil
  editing and control transfer, both page reloads, late join, complete semantic
  and rendered work equality, partial drafts, error/help state, no message
  loop, no personal storage access, and standalone/board mobile layouts.
  Visual checks used Chromium 153 with Playwright 1.62.1.
- Independent internal review found and resolved an embedded home-link escape.
  DOM review also hardened array prototypes and data-property validation.
  This internal OpenAI review is not an external provider verdict.
- Earlier failures were kept explicit: the sandbox prevented a local listener;
  the default browser archive was unusable; an existing connected pupil label
  after control revoke and a counter reset on reload required corrections to
  the new browser harness. No host or trainer contract was weakened to pass.
- Exact-head cloud checks: pending Draft PR, reported separately there.
- Production assignment: pending release, no plan mutation yet.
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
