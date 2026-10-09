# Profile course entry in permanent learner cabinets

## Identity and goal

- Task: PROFILE_CABINET_ENTRY
- Owner: repository owner
- Date: 2026-10-09
- Base: main, `6e3cc69a791379b516397cf79b46e73922fe4c79`
- Branch: `feat/profile-cabinet-entry`
- Review level: HIGH (persistent teaching-profile schema)
- Architecture: existing accepted ADR 0010; no new account or trainer protocol.

The owner requested two permanent learner cabinets for the published profile
course. Creating accounts currently assigns the seven-grade default, and the
teacher cannot choose profile mathematics. Add the missing course choice and
an honest entrance to the existing public first-part course.

## Evidence and scope

The existing profile field and SQL check accept school, foundations, oge and
ege. The ege value specifically means the basic exam. The published profile
course uses browser-local progress and is not a managed cabinet trainer.

In scope:
- Add `ege-profile` to teaching-profile storage and validation, preserving all
  existing profiles, accounts, work, sessions and constraints.
- Offer the direction in teacher controls and render a dedicated pupil entry
  on home, course and route, with course and diagnostic links.
- Preserve the teacher's focus note and accurate parent-facing course label.
- Avoid base-exam numbered reports and unrelated trainer assignment fallbacks
  for this direction; clearly state that profile solutions remain local.
- Test migration, persistence, authorization boundaries and browser navigation.

Out of scope: authentication or role changes, new passwords or real pupil data
in code, automatic changes to existing pupils, managed profile assignments,
answer synchronization, profile mathematics, billing and hosting settings.
Actual account creation and teacher choices use the existing private UI.

## Acceptance and gates

- [x] Existing databases migrate atomically without losing prior data.
- [x] New direction round-trips through the existing owned-pupil API.
- [x] Existing directions and ownership checks retain their behavior.
- [x] Profile pupils see the correct course, diagnostic and local-progress note.
- [x] All three entry routes work on desktop and mobile.
- [x] Existing assignments cannot silently substitute another course.
- [x] Full backend suite and relevant existing browser gates pass.
- [ ] New profile-entry browser gate runs in cloud CI.
- [ ] Independent local and exact-head remote source reviews are complete.
- [ ] Deployment and production direction assignment are verified.

Final gate: `PROFILE_CABINET_ENTRY_OK`. Record actual results and unperformed
checks in the PR; do not treat these planned checkboxes as review evidence.

## Review, risk and rollback

HIGH review is required for the schema extension. Main risks are loss of old
profile rows during migration and unintended reuse of basic-exam/OGE routes.
Review and test those risks directly. External handoff is limited to public
source, scoped diff and synthetic tests. Record provider, PR, base, exact head,
verdict and timestamp after the actual remote review.

Rollback must preserve every teaching-profile row and all other learning data.
Do not drop the new course rows, reset the database or remove the schema's new
accepted value after it has been used. Prefer a scoped forward fix or withdrawal
of new-course selection while retaining existing-profile readability. Verify
the implementation's compatibility and recovery behavior before release.

## Authorization and execution

The owner's current request authorizes creating the two cabinets; the existing
cloud-publication instruction covers this necessary, scoped course entrance.
The implementation does not claim cloud persistence for the public course.
Use one branch and PR, exact-head checks, source review and fresh-main release
verification. No protection override, forced update or TLS bypass is allowed.
Keep real names, login links, passwords and identifiers out of this repository.

PR and exact-head execution evidence are recorded in the final PR handoff.

## Local execution evidence

- Full backend suite: 212/212 passed, zero failed or skipped.
- Profile migration/API suite: 13/13 passed (included above).
- `LEARNING_PROFILE_ENTRY_OK`, `LEARNING_COURSE_NAVIGATION_OK` and
  `LEARNING_TEACHING_LIVE_BROWSER_OK` passed with isolated synthetic accounts.
- Syntax and `git diff --check` passed.
- Independent local HIGH review: APPROVE, no open P1/P2.
- Independent `PROFILE_ROLLBACK_COMPAT_OK`: the exact base store reopened an
  upgraded database and preserved profiles, sessions and all rows; the new
  store then reopened it without changes. Older UI cannot select the new
  direction, so a forward fix remains the preferred rollback approach.
- Initial two local browser launches could not find the default Playwright
  executable. Both reran successfully using the installed Chromium binary;
  no test assertions or product code were weakened.
- External exact-head source review and cloud gates are pending at commit time.
