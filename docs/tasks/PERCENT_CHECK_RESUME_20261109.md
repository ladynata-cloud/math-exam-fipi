# Percent mini-check: resume after in-page navigation

## Identity

- Date: 9 November 2026 (Asia/Novosibirsk).
- Owner: MathExam owner, current overnight implementation request, priority 4.
- Base: main `f9fa7ae93d2237c0b850b64a541f2ac0bfb3e3c3`.
- Branch: `improve/percent-check-resume-20261109`.
- Review level: MEDIUM; bounded existing in-memory navigation and result labels.
- Architecture: existing percent trainer and check model; no new persistent store.

## Goal and observed problem

An unfinished five-question check retained its tasks and first answers in memory,
but navigating to another view and back always showed the start screen. The only
offered launch replaced the session, including answers and the current draft.
A completed report similarly became inaccessible after view navigation. The exact
main source blob `f6dc8da7d2af455c2f6955080158296c2b3707a5` was reproduced with a
real jsdom page: index 1 / answers [123] / second draft became hidden; selecting
the offered standard check reset index 0 / answers [] / empty draft.

## Approved scope

Return to the same in-page check with its task sequence, answers, current draft
and original start time. Return to its completed report. Begin a replacement
only after the completed-report "Пройти ещё раз" action and level selection;
an unfinished direct start call is a resume, never a silent discard.

Visits to learning, worked review or practice while the check is unfinished are
recorded. A resulting score remains visible/copied as a training result, but
cannot update independent checkpoint best or add course completion via that
best. Neutral home navigation does not itself register help. The existing completed home status is relabelled "Базовая проверка пройдена" rather than claiming "База процентов освоена"; grading/completion thresholds are unchanged. Actual external
help cannot be detected and is not claimed absent.

Keep original generators, numerical checking, practice help/statistics, board
protocol and independent mathematical gates unchanged. No user data/assignments
or hosting changes. Do not add reload restoration or claim it: full answers,
draft and report remain in-memory for this page lifetime. Aggregate last/best
records retain the established persistence path; last now records support and
visited help views. UI warns that the full report lasts until closing/reloading and offers copying a short summary (not individual answers/steps).

## Acceptance and checks

- Exact tasks, accepted answers, draft and startedAt survive repeated in-page
  navigation; Enter accepts one answer and clears only the next draft.
- A completed report reopens without altering score/help/time or awarding twice.
- Learning/review/practice visits are visible in classification and copied report;
  supported 5/5 leaves independent checkpoint best unchanged.
- Explicit new check resets the session, not existing aggregate best.
- Standard and advanced mathematics and legacy numeric parsing gates still pass.
- Existing clear-action/hint regressions and shared-board behaviour stay intact.

Checks: new `tools/percent-check-resume.test.cjs`; existing
`percent-action-clarity.test.cjs`, `task9-clear-actions.test.cjs`, selected
500-standard/1000-advanced/legacy cases from `oge-percent-guided-showcase-v2.test.mjs`,
`oge-algebra-contract.test.mjs`; syntax/diff and preservation gates.
`percent-check-resume.browser.cjs` exercises actual navigation and keyboard at
320/390/768/1280, saves synthetic screenshots, and supports production exact-byte
readiness followed by the same live journeys. Chromium runs in CI; local cloud
Chromium restriction is not bypassed. Root owns exact source bindings and release.

## Review and risk

Independent ready-result technical review is requested. No external provider
review or real pupil effectiveness study is claimed. Elapsed time intentionally
includes time outside the check and the label says so. Support classification is
conservative: merely opening a learning/practice view counts even if the pupil
reads nothing. Existing external-help limits remain explicit.

Rollback the bounded HTML and corresponding tests/workflow as a unit, without
deleting browser progress. No new data migration or server contract exists.
Older code ignores the optional support metadata on the aggregate last result.

## Permissions

Current direct START and standing `docs/OWNER_RELEASE_AUTHORIZATION.md` authorize
this scoped improvement, commits, PR, checked merge/publication and live
verification. No additional owner decision is required. Root is sole publisher;
this worktree does not push or merge the PR. Refresh main/head and rerun affected
gates on base drift; never loosen preservation checks.

## Ready-result evidence

Independent in-session technical review delivered conditional PASS for the exact
trainer SHA-256 `7eabf9b86cfe8b14e5e05dd37a787b30e93a23c25a1f14d0552dfb284828913f`:
no remaining blocker in the bounded in-page scope; CI, preservation bindings and
live publication verification remain required. This is not an external-provider
or pupil-efficacy verdict.

Local passes: 9 new DOM cases; 24 existing clear-action/return cases; 500 generated
conditions of each of five basic percent types and 1000 advanced conditions;
legacy numeric parsing/migration; full OGE algebra contract 668 checks / 0 failures;
script syntax and `git diff --check`.

Exact regression source SHA-256:

- `tools/percent-check-resume.test.cjs`: `9f624eef300b80cb056bf193f60bf56a434e409e103ec045c6b8a2afcef0cf53`.
- `tools/percent-check-resume.browser.cjs`: `f7724fe01d0633bea417bec0ba6d8df4d84391eb546b5f88f33688ce85b7b38c`.

No local Chromium pass is claimed. Its four-viewport navigation/keyboard/help
checks, screenshots, exact production bytes and live browser checks are queued
through the committed workflow once root publishes the branch/main release.
