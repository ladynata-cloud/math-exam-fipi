# Shared board for the full EGE profile first part

## Scope and acceptance

The owner requested joint work on every first-part profile trainer on 2026-11-28. The initial main commit was `c385a8bc179119d7462e4bbc6e29b1d3576a90ff`. The deployed registry and the official course map supported 34 of 50 core lessons. The six sections with missing coverage were probability of combined events, derivatives and antiderivatives, applied formulas, word problems, functions and graphs, and greatest and least values.

Use the existing structured board session and the course’s authored tasks. Each official entry and individual lesson should open the corresponding registered trainer through the board picker. Preserve existing shared and solo routes, drafts, and personal progress. Keep the official №8 and №12 routes distinct despite their shared historical calculus collection.

## Verification and release

Review level is HIGH because the change extends the trusted room trainer registry. Verify exact entry paths and capabilities, then exercise a teacher and a pupil in separate browser contexts. Check shared task changes, answers, clues, model controls, ownership transfer, reconnection and isolation from solo progress. Check real published assets and the Amvera registry after the Pages and server deployments.

The acceptance gates include the first-part two-client browser suite, manifest preflight and existing profile board regressions. Publication follows the standing owner policy. A rollback reverts the scoped change and redeploys Pages and Amvera together. There is no database migration.
