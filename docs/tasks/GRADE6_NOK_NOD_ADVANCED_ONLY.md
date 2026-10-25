# MathExam task specification

## Identity

- Task: `GRADE6_NOK_NOD_ADVANCED_ONLY`
- Owner: repository owner
- Date: 2026-10-25 (Asia/Novosibirsk)
- Base branch: `main`
- Base SHA: `5e68b35e8e9af54cdfa39558bec121138118fade`
- Planned branch: `feat/grade6-nok-nod-advanced`
- Review level: `MEDIUM`
- Related task: [published NOK/NOD integration](GRADE6_NOK_NOD_BOARD.md), PR #332.
- ADR 0001 remains `Proposed`; the existing board SDK, tests and published
  integration establish the runtime contract used here.

## Goal

Make both grade-six number-theory trainers more challenging, provide a larger
list of prime-divisor buttons, preserve their working shared-board mirror,
and let the owner show only these two trainers in one selected existing
learner cabinet.

## Context and evidence

- The owner supplied a screenshot of the published first task, 4 and 6, with
  only the four prime buttons 2, 3, 5 and 7, and requested harder tasks and
  an exclusive two-trainer cabinet.
- PR #332 is merged and published at the named base. Its completed release
  record confirms the previous 20/20 public byte checks, 7/7 post-merge
  workflows and saved/reloaded teacher and learner cards.
- Current mathematics accepts integer pairs from 2 through 200. Its complete
  prime catalogue already supports all primes through 199. The existing
  closed shared state identifies tasks by stable ID.
- A saved plan note currently adds the two cards but does not replace the
  learner's underlying course. `LearningAttachedCourse` already interprets a
  teacher-selected focus note as a presentation override without a database
  field or a new attempt contract.
- The new exclusive choice is an explicit client presentation convention,
  not an existing server authorization boundary. It is opt-in per profile;
  simply mentioning trainer URLs does not activate it.

## Approved scope

### In scope

- Preserve the original 24 task IDs, pairs and levels. Append 32 independently
  checked pairs, giving 56 pairs across three levels (16 / 20 / 20).
- Open fresh trainer sessions at `nt-3-9`: 132 and 88. Explicit valid task
  URLs and received room state retain priority. NOD is 44 and NOK is 264.
- Show prime-divisor buttons 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41,
  43 and 47 at every guided divisor step. Preserve manual entry; do not filter
  buttons to reveal which divisors are correct.
- Preserve factor columns, accepted work, contextual help, occurrence-aware
  pairing, independent mode and the existing semantic board transport.
- Bump these two trainer versions to 1.1.0 and their asset cache tokens;
  preserve state schema 1 and all other mirror registrations.
- Add the teacher choice "Обычный маршрут / Только НОК и НОД" using the
  existing versioned `profile.focus` save. An exact standalone line,
  "Индивидуальный маршрут: только НОК и НОД.", opts into the fixed allowlisted
  pair. Preserve other focus text and the underlying course for reversibility.
- In that selected profile, show exactly the two practice cards on the main
  learning surfaces and teacher preview. Remove unrelated course suggestions
  and redirect stale learning/catalog routes to the pair. Preserve access to
  existing assignments, lessons and saved work. This is presentation, not
  account access control.
- After an authorized verified publication, activate the option through the
  regular teacher interface for the requested existing learner and verify the
  saved setting and learner preview. Real learner identifiers stay out of
  repository files, CI fixtures and review material.
- Reconcile the prior completed release in PROJECT_STATUS within this task.

### Out of scope / protected areas

- No new accounts, credential changes, data deletion, personal-credit claims,
  database migration, profile enum extension or backend authorization change.
- No shared-board protocol, transport, drawing tools or core lifecycle changes.
- No change to other learner profiles, global course content or prior work.
- No unlimited generator or three-number task model.
- No merge, auto-merge or deployment without the separate concrete release
  decision required by repository policy.

## Acceptance criteria

- [x] 56 distinct pairs; every old task preserves its ID and mathematics.
- [x] Fresh NOK and NOD sessions start at 132 and 88; all 15 prime buttons are
      usable at every guided level and fit narrow/split screens.
- [x] All 112 guided journeys and independent mathematical checks pass.
- [x] Real local teacher/pupil board checks preserve drafts, accepted rows,
      large primes, pairing, hints, control grant/revoke, reload and late join.
- [x] Malformed snapshots still fail atomically and remote application does
      not echo or write personal progress.
- [x] Explicit exclusive mode shows exactly two cards and consistent teacher
      preview, including stale routes; other profiles stay unchanged.
- [x] Mode save uses the existing optimistic version/opId path, does not
      truncate comments and does not mutate saved work.
- [ ] Relevant regression gates, diff review and exact-head CI pass.
- [ ] Live assignment is reported only after publication and actual reload
      verification, with no fabricated learner attempt.

## Checks and gates

- Math: `tools/number-theory.test.cjs`, including the independent exhaustive
  oracle for all 39,601 ordered pairs in the unchanged 2..200 domain.
- State/UI: `tools/number-theory.dom.cjs`, including all 112 guided journeys.
- Shared board: `tools/number-theory-board.browser.cjs` on the actual local
  Socket.IO server with separate synthetic teacher and pupil contexts.
- Exclusive cabinet: new `tools/learning-number-theory-route.dom.cjs` plus
  existing number-theory/Peterson/focus-link, Merzlyak, course-navigation and
  profile regressions.
- Real cabinet persistence: `tools/learning-number-theory-route.browser.cjs`
  with synthetic accounts, a local HTTP boundary and temporary SQLite,
  including ordinary-form mode changes, reload, preview and retained work.
- Registry units/integration, picker checks, syntax and `git diff --check`.
- Final technical gate: `GRADE6_NOK_NOD_ADVANCED_ONLY_OK`.
- Publication/cabinet checks remain pending until separately authorized.

## Review plan

- MEDIUM: bounded changes to existing trainer content/UI and client cabinet
  presentation; no persistence, authorization or protocol boundary changes.
- Trainer design consultation applicable: no. This extends the checked task
  bank and reuses existing divisor buttons; it does not introduce a trainer,
  interaction archetype or change the sequence, hints or feedback. The broader
  2..200 mathematics and state schema remain unchanged.
- Independent mathematical review and focused cross-file technical review are
  required. Review the stronger examples and actual mirror behavior separately.
- External Claude review is optional for this bounded scope. No prior
  task-specific waiver or external approval is reused or claimed.
- Real-learner learning gains remain outside synthetic-test claims.
- Remote material contains only relevant public code, synthetic data and
  verifiable results; no real learner identifiers or secret values.

## Risk and rollback

- Risks: remapping old IDs, stale client assets, prime-button overflow,
  accidental exclusive-mode activation and unrelated-course regressions.
- Mitigations: append-only IDs, explicit new default, version/cache update,
  exact opt-in marker, fixed allowlisted cards and focused regressions.
- Revert the selected profile to "Обычный маршрут" through the ordinary UI to
  restore its existing course; keep prior saved work. A forward patch can
  disable the new mode or restore the old default without deleting data.
- A rollback must retain or deliberately handle new task IDs in active room
  snapshots; older clients do not understand those IDs. Do not downgrade live
  room contracts silently.

## Permissions

- Implementation start: the owner's direct current action request authorizes
  this work. A literal copied `START` marker is not asserted as evidence.
- Branch, scoped local edits, tests, logical commits, push and Draft PR: allowed.
- The owner requested delivery to the existing cabinet. Apply that setting
  only after the corresponding code is published and verified.
- Merge / auto-merge / deployment: pending separate exact-PR/base/head decision.

## Execution record

- Actual branch: `feat/grade6-nok-nod-advanced`
- Actual base: `5e68b35e8e9af54cdfa39558bec121138118fade`
- Head and PR identifiers, exact-head CI and the final technical gate are
  recorded in the Draft PR created from this branch, avoiding a self-referential
  commit identifier in this file.
- Local mathematics: 12/12 tests, the independent 39,601-pair oracle and all
  56 fixed task answers pass. State/UI: 16/16 tests, including 112 full guided
  journeys and every prime button, pass.
- Actual board: `NUMBER_THEORY_BOARD_BROWSER_OK` for both trainers, separate
  teacher/pupil contexts, large-prime and old-task snapshots, transfer of
  control, reload, late join, mobile/split layout and no personal writes.
- Cabinet: new DOM gate 10/10; existing number-theory plan 7/7, Peterson plan
  11/11, focus links 5/5, Merzlyak 5/5 and Vilenkin 8/8 pass.
- `LEARNING_NUMBER_THEORY_ROUTE_BROWSER_OK`: actual form/API/SQLite saves,
  reload, nine stale routes, teacher preview, retained work, unaffected peer
  and reversible mode; 1440/390/320px layouts. Exactly two profile saves and
  unchanged protected rows/schema are confirmed after independently reopening
  the closed database read-only.
- Registry, real registry HTTP and profile tests: 45/45 pass. Existing real
  Merzlyak and course-navigation browser gates pass. Picker smoke passes with
  1,452 links and no production room writes. Syntax and diff checks pass.
- Independent OpenAI technical review found no remaining actionable product
  findings. The learner preview uses learner links; teacher board links stay
  in the teacher's own card. No external Claude verdict is asserted.
- Review caught a test-artifact path incompatible with GitHub's RUNNER_TEMP;
  the harness now accepts canonical temporary descendants and rejects the
  repository, path traversal and symlinks into it. Eight path checks pass.
- Earlier local infrastructure attempts failed on restricted loopback access,
  unavailable Chromium paths and a second SQLite connection while the store
  held its existing exclusive lock. Supported local server/browser execution
  and reopening only after store closure resolved these failures; application
  protections and test assertions were not weakened.
- Not run at this commit: exact-head cloud CI, publication and live cabinet
  activation. The latter two require the separate release decision.
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
