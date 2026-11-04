# College functions: standalone guided practice

## Identity and goal

- Date: 2026-10-25.
- Base: `main`, `8e681831e874a9af129f50c16179bd2a424c5474`.
- Branch: `feat/college-functions-course`.
- Review level: `MEDIUM`: bounded static trainer behavior using the existing
  standalone page, retained steps and browser-storage approach. No platform,
  protocol, authentication, server or deployment architecture is introduced.
- Owner's current request: create a trainer from the prepared college course,
  publish on the existing website and provide its link; synchronization and a
  learner cabinet are explicitly outside this task.
- Intended public route: `/trainers/college-functions/`.

The learner builds and investigates square-root, quadratic, exponential,
logarithmic and piecewise functions. Eight short diagnostic questions and 40
guided graph tasks follow the prepared lesson and exercise bank. Each graph
has eight retained stages, contextual help and a separate independent mode.

## Scope and acceptance

- [x] Five families, eight graph tasks each, and eight diagnostic questions.
- [x] Domain, exact table values, plotted points, range, zeros, signs,
  monotonic/constant intervals and parity are checked explicitly.
- [x] No completed curve before the learner calculates and marks the points.
- [x] Fractions, decimal commas, infinities, unions and isolated points work.
- [x] Hints preserve entered work and completed stages; using help is sticky.
- [x] Independent credit requires a previously unseen task, all eight stages,
  no help and no mistakes. Repeat attempts retain previously earned credit.
- [x] Progress and draft answers stay only in this browser's local storage.
- [x] Public catalog and sitemap include the new route.
- [x] Desktop and 390px iframe layout checked in the actual browser.

Only the trainer directory, its targeted CI, catalog, sitemap registration and
this operational record are in scope. Existing courses, board adapters,
personal learner data, cabinets, server contracts and permissions stay outside
the change. The course publishes mathematical examples, not notebook images or
private learner information.

## Checks and evidence

- `node --test trainers/college-functions/*.test.cjs` with `jsdom@26.1.0`:
  independent formula keys, boundary inclusions, signs and branch discontinuities;
  safe parser equivalences; all 40 tasks through all eight actual DOM stages;
  fresh/repeated credit, sticky help, mode changes, saved draft answers,
  corrupt/unavailable storage, diagnostic routing and SVG rendering.
- `python3 tools/seo-sitemap.test.py`: six tests pass.
- `python3 tools/build-sitemap.py --check`: 522 canonical public URLs.
- `python3 tools/seo-check.py`: entrance metadata and 167 local links pass.
- `git diff --check` and JavaScript syntax checks.
- Actual browser: B1 domain/table/coordinate marking advances to its curve;
  F5's four branches and fraction layout inspected on desktop and mobile.
  At 390px iframe width, body client/scroll widths are both 375px (scrollbar
  accounted for); no horizontal page overflow. Browser extension log errors
  are not attributed to the application.
- Final gate marker: `COLLEGE_FUNCTIONS_STATIC_OK` after all targeted checks.
- No real-learner outcome trial is claimed.

## Review and limitations

Independent internal agents reviewed the mathematical data, answer parser,
rendering and actual DOM journeys. Discovered credit-retention, option markup
and draft-coordinate problems were fixed and regression-tested.

The repository's Claude design consultation and ready-result consultation are
applicable but **not run**: this session has no available Claude provider/API.
This is recorded as missing external consultation, not as an external approval,
an exact-head verdict, or a standing waiver. The present publication request is
explicit owner authorization to ship this bounded result; no previous task's
release exception is reused. Internal review and automated evidence are named
as such. No test, protection or release check is disabled.

## Risks and rollback

- Mathematical risk is concentrated in open/closed endpoints and piecewise
  jumps; independent numeric checks and explicit boundary tests cover these.
- Browser storage can be cleared or unavailable. The UI reports failed saving;
  it makes no cross-device or permanent-history promise.
- SVG graph clicking allows a small visual tolerance; exact coordinate fields
  remain available for fractions and narrow screens.
- Rollback is a normal revert of this single scoped PR, removing the new route,
  its catalog entry and sitemap registration. There is no server migration or
  external learner state to repair. The dedicated browser key is isolated.

## Permissions and execution

Implementation, branch, commit, push, PR, merge and publication are within the
current explicit request to create and publish the trainer. No force push,
admin override, account creation, synchronization or settings change is allowed.
The PR records its exact head and the authoritative current base; publication
must use the checked tree and be verified on the live URL. Passed, failed and
not-run checks are reported separately. This file is evidence, not a substitute
for user authorization or an external review verdict.
