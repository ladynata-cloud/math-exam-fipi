# A nested logarithmic inequality, explained step by step

## Identity

- Task: a separate interactive lesson for a logarithm inside another logarithm.
- Owner: Наталья Михайловна.
- Date: 2026-10-07 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `fa86d5812ce175ddbf124661b7c258642dd319ab` (published PR #202).
- Planned branch: `feature/logarithm-nested-example`.
- Review level: `MEDIUM`.
- Related specification: [the first detailed lesson](LOGARITHM_ONE_EXAMPLE.md).
- ADR status: existing guided-lesson and BoardBridge behavior; no new protocol.

## Goal

Let a learner solve `log_(x²-x)(log_(x²+x)x) >= 0` in small interactive
steps, using the method developed with the owner: collect all restrictions in
one system, solve each restriction, draw the solutions on aligned number lines,
and take their intersection. Keep every accepted step visible and explain the
source of each new expression before asking for the next action.

## Context and evidence

PR #202 published the first detailed example at `lesson.html`. Its exact-head
mathematics, browser and learning checks passed, and the Amvera registry was
verified with five mirror entries after deployment. The owner then requested
a trainer for the other worked example. This is an additional lesson with its
own identity and saved attempt; the first lesson remains available.

The nested expression gives six domain conditions: `x²-x>0`, `x²-x != 1`,
`log_(x²+x)x>0`, `x²+x>0`, `x²+x != 1`, and `x>0`. Their intersection is
`x>1`, excluding `(1+sqrt(5))/2`. Two sign-equivalent logarithm replacements
then reduce the original inequality to `x²-x-1 <= 0`; the domain excludes
equality. The answer is `(1, (1+sqrt(5))/2)`. Replacements preserve signs;
they are not equalities between the numerical values of the expressions.

## Approved scope

### In scope

- Add `nested.html` and its authored lesson data in `nested.js`.
- Reuse a bounded shared `guided-lesson.js` runtime and the existing lesson
  styling; preserve the first lesson's saved-state schema, identity and behavior.
- Show the full domain system, ordinary root calculations, interval signs,
  aligned number lines and explicit intersections, including the final answer.
- Provide small interactive steps, wrong-answer feedback, optional hints and
  a persistent visible solution notebook, with explicit advancement.
- Isolate nested-lesson browser storage and mirror identity
  `profile-log-nested-example`, version `1.0.0`, state schema `1`, protocol `1`.
- Add a prominent link beside the existing lesson link and register the page
  in the board manifest and picker, retaining every existing entry.
- Update exact registry expectations and targeted mathematics/browser checks;
  reconcile the preceding release and current task in project status.

### Out of scope

- New task generators, extra example families, audio or video production.
- Account, assignment, group-cabinet or server-assessment integration.
- Changes to authentication, room protocols, BoardBridge or hosting settings.

### Files or areas that must not change

- The existing 48-task trainer's `engine.js` and `app.js` contracts.
- Production accounts, credentials, learner records and unrelated course work.

## Acceptance criteria

- [x] Both logarithms and all six domain conditions appear before simplification.
- [x] Restrictions are solved independently with ordinary roots and intervals;
  the full intersection includes the right-hand domain ray beyond the excluded
  positive root until the original inequality is applied.
- [x] Both sign-equivalent replacements are explained and equality is excluded
  for the original-domain reason, not silently discarded.
- [x] Correct steps remain visible; wrong input does not advance; hints are
  recorded without claiming mastery of unfamiliar tasks.
- [x] Reload and silent remote restoration preserve the complete attempt;
  stale tabs do not overwrite newer saved work.
- [x] The new and existing lessons remain separate and can both be completed
  with keyboard controls and a narrow viewport.
- [x] The existing index keeps the first link and adds the nested-lesson link.
- [x] The manifest, picker and exact registry tests include the new identity.

## Checks and gates

- Required tests: independent original-expression/domain and interval checks;
  complete nested-lesson browser journey, hints, wrong input, saved drafts,
  resets, keyboard axes, malformed hydration, silent bidirectional mirroring,
  and regression of the original detailed lesson after runtime extraction.
- Required static checks: registry unit/integration suites, manifest and picker
  uniqueness/paths, local links, script syntax, `git diff --check`.
- Manual checks: desktop and mobile layout, long root labels, aligned axes,
  open excluded endpoints and retained earlier solution work.
- Final gate marker: `PROFILE_LOG_NESTED_EXAMPLE_OK` after required checks pass.
- Intentionally not run: production learner writes or account changes, which
  are outside this public lesson; record any other unrun checks separately.

## Review plan

- Rationale: bounded additional lesson using existing guided interaction and
  mirror contracts; shared-runtime extraction needs first-lesson regression.
- External review required: no; the owner explicitly authorized publication
  without a separate external review. Internal code and mathematics review,
  targeted regression and release verification remain part of the task.
- Handoffs contain only relevant public code and synthetic learner state.
- If external review is used, record provider, PR, exact base/head, verdict and
  a verifiable source; this specification is not evidence of such a review.

## Risk and rollback

- Risks: dropping a domain condition, confusing a sign-equivalent replacement
  with equality, unreadable root labels, lost work or mixed lesson identities.
- Rollback: revert the bounded nested lesson, shared-runtime extraction, link
  and registration together, preserving unrelated work and the previous lesson.
- Keep the first lesson's storage key and schema; use a separate key for the
  nested lesson. Do not migrate or reset either learner attempt automatically.

## Permissions

- `START`, branch creation, local commits, push and Draft PR: authorized by the
  owner's request for the other trainer within the continuing published work.
- Publication: covered by the owner's explicit standing permission to publish
  these trainers without separate external review. The executing root performs
  current-base, exact-head and post-deployment checks.
- Auto-merge, force operations and repository-protection changes: not requested.

## Execution record

- Actual branch: `feature/logarithm-nested-example`.
- Actual base SHA: `fa86d5812ce175ddbf124661b7c258642dd319ab`.
- Actual head SHA / PR / commits: to be recorded by the executing root.
- Tests passed: registry unit/integration 32/32; 40,038 independent mathematical
  probes, all seven interval fields and their reference rows; existing logarithm
  mathematics; complete 26-step desktop/375px browser journeys, wrong endpoints,
  exact persistence, legacy-save isolation, result download and mirror hydration.
- Shared-runtime regression: the existing 18-step desktop/375px suite passes,
  including keyboard axes, stale-tab protection and rejection of corrupt hydration.
- Visual review found horizontally scrolled condition labels disappeared; fixed
  with sticky row labels and verified their visibility in the browser regression.
- Local links, identity uniqueness, syntax and patch whitespace checks passed.
- Focused internal mathematics and implementation reviews completed.
- Tests failed: none remain.
- Tests not run: production pupil writes and account operations (out of scope).
  Exact-head CI and production verification will be recorded in the task PR.
- Local gate: PROFILE_LOG_NESTED_EXAMPLE_OK.
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
