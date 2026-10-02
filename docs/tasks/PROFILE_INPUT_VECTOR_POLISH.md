# Profile input and vector point polish

## Identity and goal
- Date: 2026-10-03
- Base: main, b0cc5306ef0020943d35234cdaa48c1c61602b49
- Branch: fix/profile-input-and-vector-points
- Review level: SMALL (isolated parser/UI fixes within existing architecture).
- Owner scope: fix rejected 3/4π answer, then reduce vector endpoint size on vec-coordinates.
- No architectural changes or new ADR.

## Evidence and scope
The shared arithmetic parser recognized π but required explicit multiplication.
The screenshot task m4-1-am has expected answer 3π/4. Unparseable values previously
set the same wrong-answer flag as mathematical mistakes. Vector endpoints had
radius 10 and obscured arrowheads.

Implement implicit multiplication with the same left-to-right precedence as
explicit multiplication/division, document denominator parentheses, distinguish
unreadable input before answer grading in both course UIs, and reduce vector
endpoint radius to 4 while keeping the radius-10 drag target.

Keep task data, expected answers, progress schemas, course navigation, other
visible point sizes, and unrelated courses unchanged.

## Acceptance and checks
- Accept 3/4π, 3π/4, 3/4pi and 3*pi/4 as 3π/4.
- Preserve explicit arithmetic, root syntax, precedence and safe rejection of
  malformed input; never use eval or Function.
- Syntax/nonfinite-value errors do not mark an attempt mathematically wrong;
  valid but incorrect numbers still do.
- Vector endpoints are visibly smaller; dragging and coordinate controls work.
- Run profile-number-input, profile-start, mord-circle, profile-geometry,
  profile-algebra, mordkovich-models and profile-route gates.
- Browser smoke: screenshot task, saved attempt flags, desktop/mobile vector
  display and drag from transparent hit region. Run git diff --check.
- Final gate: PROFILE_INPUT_VECTOR_OK only after all scoped checks pass.

## Review, risk and rollback
Self-review and targeted local checks; external review not required for SMALL.
Main risk: ambiguity in slash notation; the UI explicitly states 3/4π = (3/4)·π
and asks for parentheses in denominators. Parser remains bounded and arithmetic-only.
Rollback: revert this PR; no migration or stored data changes are needed.
Do not include private user screenshots or machine-specific paths in the PR.

## Permissions
The owner's direct instructions “доработай” and “сделай точки не такими жирными”
authorize implementation, branch, tests, commits, push and a Draft PR.
Merge, auto-merge and deployment remain unperformed pending separate authorization.

## Execution record
- Passed: profile-number-input (18 valid and 17 invalid cases), profile-start
  (108 tasks / 261 steps), mord-circle (295 tasks / 743 steps), profile-geometry,
  profile-algebra, mordkovich-models, profile-route, JavaScript syntax checks,
  git diff --check, and profile-input-ui DOM integration checks using jsdom 24.1.3.
- DOM checks confirm both form handlers preserve the attempt after invalid
  notation, accept the screenshot answer, retain true wrong-answer marking,
  and update small vector endpoints through coordinate inputs.
- Not run: real Chromium visual, mobile-layout and pointer-drag smoke. No browser
  binary was installed; the attempted browser download returned invalid archives.
  DOM geometry checks do not substitute for a real pointer/visual check.
- Gate: automated checks PASS; full PROFILE_INPUT_VECTOR_OK remains pending
  browser smoke. No application-test failures; browser setup failed.
- No merge or deployment performed. No unrelated scope changes.
