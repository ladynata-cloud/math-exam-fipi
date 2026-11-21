# LINEAR_PILOT_GUIDED_BASICS

## Identity

- Owner: MathExam
- Date: 2026-11-09 (Asia/Novosibirsk)
- Base branch and SHA: `main` at `ee7c501abc2f293d923d892a4b3dcc5ac4b798f7`
- Branch: `draft/linear-pilot-guided-basics`
- Review level: MEDIUM
- Related work: [#488](https://github.com/ladynata-cloud/math-exam-fipi/pull/488), [#483](https://github.com/ladynata-cloud/math-exam-fipi/pull/483), [#484](https://github.com/ladynata-cloud/math-exam-fipi/pull/484)

## Goal and scope

Keep the current course URL and add a beginner route before the existing diagnostics. A new learner can see what equality and the unknown mean, observe reversible actions on both sides and solve a different example alone. The current route is available under «Уже знаю основы». Learners with existing work reopen their saved route.

The lesson works with positive whole numbers and uses the current practice link. The existing pilot records, standalone trainer, free-step engine, downloads, server progress, and production deployment are outside this draft. Beginners' checkpoints use their own browser-local storage.

## Acceptance

- A first-time learner can start the explanation without taking the diagnosis. Worked examples show why a step works, with one decision at a time.
- On an incorrect answer the learner sees an explanation and can try again. Hints are optional. Lesson and review input resume after reload.
- Each route shows its own completed-step or completed-lesson count. Worked scenes are counted as learning steps. The final numerical check is reported separately.
- The final check uses fresh numbers. Incorrect answers route to the associated worked examples. A second form uses different equations.
- The final screen opens the existing trainer. Existing drafts and reporting remain usable.
- Verify key arithmetic, DOM behavior, existing course regression, and browser journeys at 320×900 and 1280×900.

## Review and risk

The original diagnostics require negative-number arithmetic, brackets and the unknown in both parts. The new sequence begins with equality and concrete weights, then fades support. Mathematical review checks the keys by substitution and balances by tray totals. Browser tests use synthetic learners. Real-learner effectiveness is an open pilot question. External provider review was not requested.

The main risks are overclaiming mastery from a numeric check and disrupting previously saved work. The two routes display distinct progress and use separate keys. An ordinary revert removes the new views without modifying existing learner records.

## Permissions

The owner requested implementation in a separate branch or draft PR. Merge, auto-merge, and public deployment require separate owner consent.
