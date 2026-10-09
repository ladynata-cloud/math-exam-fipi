# Encouraging opening heading for the profile course

## Identity

- Task: PROFILE_CALM_HEADING
- Owner: repository owner
- Date: 2026-10-09
- Base branch: main
- Base SHA: `e710a5dfd663e41bf4bfccf6c194deaf7c33a8bf`
- Planned and actual branch: `fix/profile-calm-heading`
- Review level: SMALL
- Related issue or ADR: none; no architectural change

## Goal and evidence

The owner requested an encouraging opening heading for the published calm
course: «Просто бери и решай! Всё получится)». The existing heading is emitted
by `ege-profil/start/calm-ui.js`; the index references this script by a versioned
URL. PR #218 is already published. This task reconciles its stale project-status
entry using the verified merge, CI, Pages and live-check evidence.

## Approved scope

- Replace only the course's opening heading and refresh that script's URL.
- Record this task and reconcile the preceding release in project status.
- Preserve all lessons, learning stages, answer validation and saved progress.
- Do not change account, authentication, server or hosting behavior. No pupil
  identity, private invitation or credential belongs in this public change.

## Acceptance and checks

- [x] The opening heading contains the exact requested wording.
- [x] The former heading is absent from runtime source.
- [x] The affected script URL has a new cache version.
- [x] Existing calm-map gate: 16/16 passed.
- [x] `node --check ege-profil/start/calm-ui.js` passed.
- [x] Exact old/new string and runtime-diff checks passed.
- [x] `git diff --check` passed.
- Final local gate: `PROFILE_CALM_HEADING_OK`.
- No new tests: this reversible text-only change does not need a new test
  implementation. Full learner journeys are not rerun locally because lesson
  behavior is unchanged; the existing profile cloud workflow remains enabled.

## Review, risk and rollback

- SMALL self-review; external review is not required by the review policy.
- Review verifies exactly one runtime text replacement and its cache URL.
- Main risk: stale browser cache; the new URL addresses that risk.
- Rollback: revert this scoped change. No saved-data migration or cleanup.
- Handoffs contain only public scoped source, no private data or credentials.

## Permissions and execution record

- Owner's current instruction authorizes this scoped correction.
- Branch creation, local commit, push and Draft PR: allowed.
- This executing subtask stops before merge; release is coordinated separately.
- No merge, auto-merge or deployment is performed by this subtask.
- Local/remote head and PR: recorded in the PR and handoff once created.
- Tests failed: none. Scope deviations: none.

## Required handoff

```text
EXECUTIVE STATUS

Task: PROFILE_CALM_HEADING
PR: recorded in handoff
Base: e710a5dfd663e41bf4bfccf6c194deaf7c33a8bf
Head: recorded in handoff
Gate: PROFILE_CALM_HEADING_OK
Tests: calm-map 16/16, syntax, exact wording/diff, diff whitespace
Failures: none
Not run: full local browser/math regression for this text-only change
Scope deviations: none
Recommendation: scoped Draft PR ready for release coordination
Next user decision: none requested by this executing subtask
```
