# Profile first-part trainer repair

## Identity

- Task: PROFILE-TRAINER-REPAIR-20261101
- Owner: repository owner, direct instruction in the current conversation.
- Date: 2026-11-01
- Base branch: main
- Base SHA: `6b9c327f2ca438cb7e7620ef302876de467fac19`
- Branch: `fix/profile-trainers-audit-20261101`
- Review level: HIGH (progress accounting and behavior across existing trainers).
- Existing architecture only; ADR0001 remains Proposed.

## Goal and authorization

The owner asked to fix the completed profile first-part audit, make links open
the appropriate trainer, pay particular attention to geometry 1/2/3 and drawing
activities, and reveal reference information only when requested. This direct
implementation instruction is the current task start and approves preparation,
implementation, tests and a corrective Draft PR. It does not reuse the separate
PR390 release authorization.

## Evidence and approved scope

- The preceding read-only audit inspected all 13 first-part catalogues and all
  14 associated standalone entries, checked the 71-lesson/426-task main bank and
  reproduced defects independently. Base now includes the merged PR396 deposit
  hint correction; do not duplicate or revert it.
- Correct old finance L1/I1 answers and explanations, J1 sum/tolerance and M1
  question/answer mismatch; strict complete numeric parsing; probability
  percent and rounding semantics; graph/derivative wording and zero parameter.
- One answer must be counted once across rapid clicks, keyboard repetition and
  delayed transitions. Display solutions and reference material on request;
  assistance must remain recorded after help is closed.
- Fix exhausted mastery conditions, recognize legitimate checkpoint successes,
  distinguish recovery on familiar conditions, preserve prior records, improve
  continuation/diagnostic persistence and include course evidence in reporting.
- Correct contextual links and year/number labels without deleting old routes.
- Keep condition, drawing and essential construction controls visible. Collapse
  secondary instructions/formulas/details, retain task, draft, camera and earned
  steps on opening/closing help, including board hydration.
- Add meaningful regression tests and mobile/browser evidence; update canonical
  copies/derived wrappers only where required for the above changes.

Out of scope: new curriculum/task-bank expansion, unrelated courses or learner
accounts, server/authentication changes, destructive state migration, new
architecture, changes to historical book editions, automatic merge/deployment.

## Acceptance and gates

- Independent calculations and behavioral regressions reject the audited wrong
  answers and verify the corrected ones.
- Fresh existing profile unit/DOM/mathematics and relevant package gates pass.
- Geometry 1/2/3, drawing controls, deferred help and progress retention are
  tested at 320/390/1280px; inspect actual screenshots from completed runs.
- Contextual links resolve to the intended existing group and correct topic.
- Old keys/task IDs and unrelated earned work survive; no real pupil record is
  modified. New evidence stays distinct from old/assisted/familiar evidence.
- CI is reported for the exact remote head, with failures and not-run checks
  distinguished. Final marker: `PROFILE_TRAINER_REPAIR_OK` only after gates pass.

## Review and limits

- Focused independent mathematics, progress-preservation and geometry/interaction
  review is required on the final diff, in addition to existing tests.
- User-directed progressive disclosure uses existing controls/details rather
  than a new trainer archetype. The consultation brief is the goal, constraints
  and audited counterexamples above. No general authorized Claude consultation
  tool is exposed in this environment; the repository's OGE reviewer is scoped
  to a different patch. External design/result consultation is not completed,
  and no provider approval or standing waiver is claimed.
- HIGH external review or a current task-specific owner exception remains a
  release requirement. Earlier task-specific refusals are not used as proof.
- Only public source/diffs and synthetic records may be used for handoffs.

## Risk, rollback and permissions

The main risk is accidental loss or inflation of learning evidence. Keep stored
IDs/keys; validate additional fields; do not erase original records. Rollback is
a bounded revert of this PR: original data remain readable, additive evidence
may be ignored by the previous version. No server data migration is introduced.

Branch, local edits/commits, push and a Draft PR are within the current direct
request. Merge, auto-merge and production release require separate exact-base/
head permission under AGENTS.md. Physical devices and real pupil records are not
part of synthetic testing. Local Chromium launch is blocked by the environment
(`socket() Operation not permitted`); browser gates must run in CI and their
artifacts must be inspected before claiming completed visual verification.

## Execution record

The final verification report and PR record exact changes, tests, failures,
screenshots, base/head, review findings and remaining release decisions.
