# Grade-six LCM course and navigation integration

## Identity

- Task: `GRADE6_LCM_NAVIGATION_INTEGRATION_20261101`.
- Owner: MathExam project owner.
- Date: 2026-11-01, Asia/Novosibirsk.
- Base branch: `main`.
- Revalidated base SHA: `2a9e70be5f7648d9fb41ad22236eeab35bf205d0`.
- Original preparation base: `37718f1c0138ba031314b8f4716b73c9d963bc81`.
- Branch: `feat/grade6-lcm-course-integration-20261101`.
- Review level: **HIGH**, because the combined learner flow uses retained cloud work.
- Inputs: PR389 `a14fed1152a0dbfdca07775dd891ba3af00a2e30` and PR392
  `5568a093d7ffb3e587d5dba145071c8cde206e70`.
- ADR0001 remains Proposed; no new architecture or storage contract is introduced.

## Goal

Prepare one compatible grade-six cabinet experience in which a learner can
choose a topic, learn LCM of three to five numbers by both existing methods,
solve tasks with optional hints, return to the catalogue and resume the same
unfinished work. The helper remains at the bottom right. Publish and verify
the live cabinet after the separate owner release decision.

## Authorization and context

The owner's original direct Action requested this composition, conflict
resolution, full phone/desktop learner-path verification and release
preparation. This authorizes implementation, task branch, local commits,
publication of the branch and a Draft PR. It does not authorize merge or deploy.

PR391 was already merged and published as the original main base. Preserve it;
do not release it again as a separate dependency. The original PR389 review
exception applies to its recorded version, not to this new combined candidate.

The source patches overlap in ten files; a read-only virtual merge identifies
seven text conflicts. Materialize their 65-path union on a fresh branch from
main and resolve it without rewriting either original source branch.

### Authorized continuation after the PR393 base movement

On 2026-11-01 the owner explicitly authorized an ordinary history-preserving
merge of main `2a9e70be5f7648d9fb41ad22236eeab35bf205d0` into PR395 head
`7df31a8363cf07e331e6c2ffe2e059f3032848b9`. The only conflict to resolve is
the heading in `docs/PROJECT_STATUS.md`: retain "Merged and release recorded"
and every substantive record from both tasks. Cabinet/course implementation
bytes must remain exact. Updating this task and the verification evidence,
publishing the continuation to the same Draft PR, and presenting its new head
are authorized. This is the same task, branch and PR.

The owner's earlier three direct approvals included a one-time HIGH external
review exception for the presented implementation because the provider was
unavailable and independent checks had completed. Record that as an owner
exception, never as an external verdict. The old-base production merge
authorization was invalidated by PR393's movement of main. This continuation
does not authorize merge into main or deployment of the new head.

## Approved scope

- Combine the two named patches, preserve provenance and resolve their
  presentation/navigation conflicts without changing mathematical content.
- Preserve all 44 author cards, 203 steps, both methods, hints, accepted steps,
  separate method attempts, drafts and source identities.
- Combine author stages/method/review controls with clear topic/task actions,
  truthful progress and the existing whole-course opening lock.
- Keep a cabinet-owned catalogue return outside collapsed tools in pupil,
  teacher and history views, preserving pending/rejected-save guards.
- Continue the newest unfinished attempt using actual numeric API timestamps,
  ISO/creation-time fallbacks and stable catalogue order for ties.
- Keep the fixed helper usable and current answer actions unobscured on phone
  and desktop, including advancement to a longer authored question.
- Add combined DOM/browser regression evidence, scoped cache revisions,
  status reconciliation, a verification report and one Draft release candidate.
- After separately authorized publication, verify the intended existing
  grade-six cabinet. If its approved textbook route still needs assignment,
  identify the exact pupil first and preserve route notes, assignments and work.

## Out of scope

- New arithmetic content, a new training engine, broad course completion,
  unrelated tasks, authentication/backend implementation or schema changes.
- Deleting/migrating attempts, changing real profiles before release, changing
  other pupils' profiles or credentials, contacting pupils, paid-model
  activation or billing changes.
- Merge, auto-merge or deployment before the separate exact-base/head decision.
- Force, reset, rebase, admin override or disabled TLS. The only authorized
  non-fast-forward branch operation is the ordinary merge named in the
  continuation above; it does not authorize a production merge.

## Immutable areas

Keep original textbook A-D JSON and 194 source identities/revisions, 27 legacy
modules, other catalogue identities, the original offline bundle and published
book editions. Preserve the already released PR391 course/helper source pair.
Real pupil data and unrelated repository files are outside the preparation.

## Acceptance criteria

- [x] All 194 original and 44 author identities remain exact; all 203 new steps
  and both mathematical methods are retained.
- [x] The course has clear action labels and truthful source/author attribution.
- [x] Separate method steps, drafts and hints survive catalogue return, reload
  and another browser context.
- [x] Continue resumes the latest unfinished work, including a repeat after
  earlier success, without duplicate creation.
- [x] Pupil, teacher and history returns respect ownership/read-only and
  pending/rejected-save protection.
- [x] Helper, current question, input and check are usable at 320x900, 390x844
  and 1280x900, with actual visual inspection and deterministic long-step trials.
- [x] Relevant original and combined gates pass; exact-head CI is recorded
  separately in the Draft PR.

## Validation and review

Run authored arithmetic/immutable-source, retained-work backend, managed DOM,
source support/helper, original textbook, legacy, catalogue partition, geometry
source/assistant projection and offline checks. Run both combined browser gates
and existing textbook/helper/reference browser regressions. Check JavaScript
syntax, sanitized diff, generated identity and whitespace.

Independent source/state/navigation and combined code/visual review is required.
No new teaching archetype is designed. HIGH external review remains required
unless the owner explicitly waives it for this concrete version with rationale.
The authorized provider is unavailable; no paid retry is initiated. Copied
approval markers and historical exceptions are not external verdicts.

Preparation marker: `GRADE6_LCM_NAVIGATION_INTEGRATION_OK` after local gates and
independent review. This is not a release, actual-pupil trial or live assignment.
The PR body binds the exact published head, avoiding a self-referential SHA here.

## Risk and rollback

Main risks are hidden navigation/help, wrong continuation, duplicate attempts,
changed source identity and incorrect assistance accounting. Tests use isolated
SQLite and synthetic profiles. No data migration is needed.

Before release the Draft can be abandoned without production effect. After an
authorized release, an owner-approved revert can remove new entry points while
retaining every saved record. Restore the matching author source before reopening
new author attempts. Preserve PR391 during rollback; never delete pupil work.

## Release boundary

Immediately before any authorized merge, query authoritative remote main and
compare it to the exact authorized base. Drift invalidates the authorization:
stop, classify concurrent commits, build a read-only virtual composition, rerun
applicable gates and obtain a new owner decision. Original PRs must not then be
merged separately over the combined release. Follow the repository release skill.

## Execution and handoff

See [verification report](../reports/GRADE6_LCM_NAVIGATION_INTEGRATION_20261101.md).
The [base revalidation report](../reports/GRADE6_LCM_NAVIGATION_REVALIDATION_20261101.md)
records the authorized documentation-only continuation and its source bindings.
Record the standard `EXECUTIVE STATUS` fields: Task, PR, Base, Head, Gate, Tests,
Failures, Not run, Scope deviations, Recommendation and Next user decision.

Implementation/branch/local commits/push/Draft PR and the specifically named
history-preserving branch merge are authorized. Merge into main, auto-merge
and deployment remain **not authorized** for the new head.
