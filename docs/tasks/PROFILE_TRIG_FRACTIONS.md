# Familiar fraction notation for trigonometric ratios

## Identity and goal

- Owner: course owner; date: 2026-10-10.
- Base: main, `528727fa6e7fa29c578bf540d014e3ad398206e1`.
- Branch: `fix/profile-trig-fractions`; review: SMALL.
- Architecture: accepted ADR 0010, existing task explanations.

The owner prefers the familiar stacked-fraction form of sine and cosine.
The screenshot shows the new explanation using colon division for a ratio.
Display the numerator above the denominator with a horizontal fraction bar.

## Approved scope

- Update definitions and substituted ratios in step 2 of the existing sine,
  cosine and tangent explanations, plus sine/tangent ratio checks in step 5.
- Keep normal arithmetic division, wording, step order, task data, answers,
  assistance tracking and saved progress unchanged.
- Use safe text DOM, readable mobile fractions and accessible whole-equation
  labels; refresh the two asset versions.
- Adapt existing checks to the new presentation and reconcile the last release.

Excluded: new tasks, mathematical-method changes, other course modules,
accounts, server, storage, external dependencies and new testing frameworks.

## Acceptance and gates

- [x] Definitions/substitutions/checks show correct numerator and denominator.
- [x] Fractions remain readable at widths 360 and 1280; bar is visible.
- [x] Screen-reader labels describe the entire equality without duplicate text.
- [x] Existing geometry, changed-metadata and six learner journeys pass.
- [ ] Source review, exact-head CI and published page verification pass.

Required: JavaScript syntax, git diff --check, existing 36-model geometry check,
independent-model tests and triangle browser robot; mobile/desktop visual review.
The existing full profile CI remains the release gate. No new test suite or
unrelated cabinet/server checks are needed for a presentation-only change.

## Review, risk and rollback

SMALL: display-only change inside three already reviewed explanations.
Independent focused review is used; external review is not required.
Risks are reversed fractions, unreadable long side names and duplicate spoken
content. Revert the three frontend files to roll back; preserve all saves.
Only scoped source and synthetic test fixtures enter remote review.

## Permissions and execution

The current correction and standing cloud-publication instruction authorize
implementation, commits, Draft PR and publication after the required checks.
Verify authoritative main and exact reviewed tree before release; no force,
reset, rebase, security bypass or unrelated data changes are in scope.
Record exact tests, failures and release identities here and in the PR.

## Local execution

- Geometry 36/36, independent models 8/8 and the existing six-journey triangle
  robot passed on the first run. The robot checks six definitions/substitutions
  and two ratio checks at 360/1280, including exact parts, vertical placement,
  visible fraction bars, whole-equation labels and hidden duplicate visuals.
- Existing arithmetic, metadata, first-help timing, five-step retention, focus,
  draft/reload and exclusion of assisted work from mastery remain checked.
- Six screenshots (all three task types at both widths) inspected: side names
  wrap inside their fractions without crossing the equality sign or bar.
- JavaScript syntax and git diff --check passed. Focused source review found no
  blocking issue; final tree binding and exact-head CI remain release conditions.
- No new test file or workflow was needed. Unrelated cabinet/server checks were
  not rerun locally. No real pupil records or credentials were used or changed.
