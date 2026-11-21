# Linear pilot acceptance — 9 November 2026

## Identity and scope

- Source: PR #492, reviewed head `f361a1287873856ab3c2c6a23446457c9f20016f`.
- During this review GitHub changed #492 from open draft to merged. Merge `adc2c9445f6ce7f0a56bca67ed2bc31b8b82ec3c` has the same tree as the reviewed head. This acceptance task did not perform that merge.
- Correction base: `main` at `adc2c9445f6ce7f0a56bca67ed2bc31b8b82ec3c`.
- Review level: MEDIUM; independent mathematics and technical review.
- Owner request: inspect mathematics, first-screen layout, errors/hints, restore, independent check and compatibility with the four-lesson route; prepare corrections and regressions.
- Permission: create this correction Draft PR. Do not merge or publish until the owner explicitly approves its concrete scope.

## Reproduced findings and corrections

1. Scene 3 had already removed 2 from the left (3 versus 5), but its success feedback proposed subtracting 2 from both unequal sides to restore equality. The corrected text removes 2 from the right only and relates both operations to the original equal state. The question explicitly refers to the prior experiment, including when the learner toggles back to the initial picture.
2. When localStorage writes failed, the advanced route could finish a lesson in its in-memory store while its header displayed 0/4. The header now reads the count from that same store, including pending records, cross-tab changes and late declaration of outside help. Storage keys, records and scoring rules are unchanged.

Both regressions failed against the previous implementation before the fixes.

## Confirmed evidence

- Independent arithmetic derives roots from equations and checks all 23 weight states and 10 final answer keys. The 14 screens contain 9 experiments and 8 questions; inverse operations and all 16 incorrect-option explanations were reviewed.
- Local command `node --test tools/equations/linear-pilot*.test.cjs tools/equations/resume.test.cjs`: 40 passed, 0 failed (24 pilot tests, including 7 new tests, and 16 parent-course restore tests).
- New tests cover the corrected experiment, 4/5 rejection despite 14/14 learning steps, remediation and hint restoration, unchanged completed learning steps, alternate-form 5/5 success, separate 14-step/4-lesson counts, storage failure/recovery, cross-tab completion and help invalidation.
- Existing CI run [42577572060](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42577572060) passed both Chromium journeys at 320×900 and 1280×900. Its screenshot artifact was inspected. Its final answers were read from lesson data, so independent mathematical tests have now been added.
- The updated browser scenario additionally captures the welcome screen and scene-3 hint/correct-feedback states at both widths and asserts the corrected context while toggling the model. The workflow now runs all pilot test files. The correction PR's Actions supply the browser result for this new candidate.
- Local Chromium launch was unavailable because the executor denied a required socket. This is not recorded as a passing local browser run; GitHub Actions is the browser verification path.
- Publication of #492 was subsequently confirmed: [Pages run 42578424662](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42578424662) passed; [pilot push run 42578425956](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42578425956) matched 14 live resources to `adc2c944` and passed both actual-production journeys. Public `index.html` and `basics-data.js` were also fetched and matched to that commit. This is evidence for the original release, not the corrections. Production verification of the correction is deferred until an authorized release.

## Boundaries and rollback

- The numerical check requires all five correct answers. It does not automatically assess explanations or prove that the learner worked without outside help. The two fixed forms become familiar on further retries.
- 14/14 means completed learning steps, not a passed assessment or four completed advanced lessons. Progress is local to the browser; blocked storage leaves work in the current tab with a warning.
- No real-pupil effectiveness study was performed. After passing the beginner check, the current screen offers the trainer but no whole-lesson restart; this is a nonblocking limitation.
- The correction changes lesson text, the advanced-count connection, tests and this record. It does not change trainer algorithms, existing learner records, server synchronization, navigation receipts or publication configuration.
- Reverting the correction commit restores previous files without deleting or migrating stored learner records. The owner must separately authorize release; a fresh base/head and applicable gates must be checked before it.

## EXECUTIVE STATUS

Task: Subject and technical acceptance of PR #492, with two bounded corrections.
PR: Separate correction Draft PR, linked in its GitHub description.
Base: `adc2c9445f6ce7f0a56bca67ed2bc31b8b82ec3c`.
Head: The correction PR head identifies the exact candidate.
Gate: Local checks passed; current browser/CI evidence is attached to that candidate.
Tests: 40 local tests; two Chromium journeys in GitHub Actions.
Failures: Two reproduced defects corrected; local browser launch blocked by executor.
Not run: Real-pupil study, correction production checks, external provider review.
Scope deviations: #492 was merged outside this task, so corrections use a separate PR.
Recommendation: Release only after the correction candidate's CI and owner consent.
Next user decision: Whether to merge and publish the correction Draft PR.
