# Сечения с нуля: назначенный курс и общая доска

## Identity

- Task: `SECTIONS_FROM_ZERO_INTEGRATION_20261106`.
- Owner: repository owner.
- Date: 2026-11-06.
- Base branch: `main`.
- Base SHA: `a2ada6761126f122dcc1faeefe140a4042b56630`.
- Planned and actual branch: `task/sections-from-zero`.
- Review level: `HIGH`, because the course adds shared runtime state and extends
  selected-card preservation across the existing room initialization boundary.
- ADR 0001 remains `Proposed`. Existing registry, SDK, server and passing gates
  define the implemented contract; this task introduces no new archetype.

## Goal

Make the existing “Сечения с нуля” material available as an assigned course in
the pupil cabinet and as a synchronized teacher/pupil lesson. The learner starts
with vertices, edges and faces, progresses through valid construction steps and
can return to the cabinet. Preserve the earlier course's complete material and
personal work while making the beginner route easy to find.

## Context and evidence

- The owner requested a cabinet and a course based on previously created
  section-construction courses, then explicitly granted `START` for connecting
  this course and checking the common board.
- The supplied `Sections_Master_Course.html` (2026-10-25.3) already incorporates
  the older 89-card course. The prepared beginner edition (2026-11-06.1) retains
  all 186 card identifiers, 967 construction steps and 81 calculation steps.
- The prepared edition adds a clear beginner entry, fixes exact-card deep links,
  labels three two-plane intersection exercises correctly and corrects the
  written altitude formula in `iii-self-5` to `a√6/2`.
- The preserved course has 26 route stages, 100 main-route cards, 12 practice
  topics, eight laboratories and five diagnostic/control sets. Readiness marks
  are learner self-assessment, not automatic assessment of a freehand drawing.
- `learning/course-program.js` is the shared client/server source for allowed
  course assignments. An unknown course ID must not be stored in a live profile.
- Existing Merzlyak and college-course adapters establish the public course plus
  registered board-wrapper pattern. The board must isolate its transient work
  from personal local storage and keep the existing bounded SDK state contract.
- The previously observed “trainer not connected” state occurred before room
  creation. The host waits for the first room state before hydration. Recovery
  from an expired handshake was published in
  [PR #472](https://github.com/ladynata-cloud/math-exam-fipi/pull/472), merge
  `e894aced7319d121450a5709bb007cf4d5cc2613`; its public host, bridge, picker and
  Merzlyak adapter matched the current source during read-only verification.
- Before this task, the server authorized 56 mirrors. The browser cutover smoke
  test still asserted 51 and omitted three already-authorized grade-7 wrappers
  from its explicit ID list (the shared OGE fixture had also grown). Reconcile
  that stale expectation with the existing authoritative registry, then add the
  new course: 57 exact IDs. Retain exact-set and manifest-identity assertions.

## Approved scope

### In scope

- Publish the supplied course at `/stereo-course/sections/` with deterministic
  data/assets and a self-contained downloadable edition.
- Preserve all earlier cards, models, source references, routes, practice,
  laboratories, assessments and existing personal storage identifiers.
- Provide the beginner entry and responsive, readable task/model presentation.
- Add `sections-from-zero` to the supported cabinet program and public catalog.
- Register `/trainers/sections-from-zero.html` for the existing board SDK; add
  course-picker discovery and strict public-path normalization.
- Share the current card, construction/calculation steps, answers, hints,
  draft, disclosures and model view. Keep the private full learning route in
  the personal course; board sessions use an isolated card workspace.
- Preserve a valid selected section card when the existing room flow supplies
  a seed or recovers the trainer document. Retain the exact-origin, pathname,
  query and validated-state checks used for the existing Merzlyak wrapper.
- Add independent mathematical/content checks, adapter and cabinet regression
  checks, real two-role browser/Socket.IO tests and responsive screenshots.
- Update the sitemap, strict registry expectations and project status in this
  task. Preserve other registered courses and their regression gates.

### Out of scope

- New accounts, invitation delivery or credential changes during repository QA.
- Server authorization, room protocol/schema, ink protocol or persistence changes.
- A new personal progress backend, assessment of freehand drawings or new course
  material unrelated to the supplied section-construction course.
- Production assignment before the course and shared client/server catalog have
  been released. No fabricated unknown course ID or account-data workaround.

### Files or areas that must not change

- Authentication material, production student data and other learners' work.
- Existing course content, server security rules, branch protections and gates.
- Repository permission policies; the current conversation's narrower release
  boundary applies to this task without rewriting the standing policy.

## Acceptance criteria

- [ ] All 186 cards and their identifiers survive; numeric and geometric checks
  pass independently of the renderer.
- [ ] A fresh learner can start at the first face, continue the route, open an
  exact linked card and keep personal work after reload.
- [ ] Cabinet teacher/student views expose the assigned course and appropriate
  board actions, retaining the exact return route and existing assignments.
- [ ] Both participants see the same selected card, steps, hint, draft and view;
  handoff, reload and reconnect retain the authoritative room state.
- [ ] A selected non-first card survives room creation and expired-handshake
  recovery. An untrusted or wrong trainer document cannot supply its selection.
- [ ] Board work neither reads nor changes personal course progress; no pupil
  identifiers or private cabinet routes enter public trainer URLs or state.
- [ ] Oversized, malformed, unknown, HTML-bearing and inconsistent shared state
  is rejected by the existing bridge/adapter boundaries.
- [ ] The task and model are reachable at 320px and 1280px without page-wide
  horizontal overflow; primary actions and cabinet return remain usable.
- [ ] Registry, legacy mirror/room regressions and generated sitemap stay valid.

## Checks and gates

- Independent course mathematics: `python3 tools/sections-course.test.py -v`.
- Adapter and integration: `node --test tools/sections-*.test.cjs`.
- Course build reproducibility and JavaScript syntax.
- Existing Merzlyak selection/room/cabinet, public-practice return and picker
  regressions; full relevant board-server test suite.
- Authoritative registry exact parity and existing fail-closed/live browser gates.
- Real two-role journey: `node tools/sections-course.browser.cjs`, including
  synthetic cabinet entry/return and 320/1280 layout evidence.
- Sitemap generation/check, SEO sitemap unit tests and `git diff --check`.
- Final gate markers and actual pass/fail/not-run results are recorded below
  and in the PR after execution; this specification does not assert a pass.
- Chromium cannot start locally in the current executor because its process
  singleton socket is denied. Real-browser execution is required in CI. Local
  DOM/transport assertions are not presented as a browser pass.

## Review plan

- Independent mathematical checks and technical review by a second executing
  agent, including the adapter boundary and generic host change.
- Trainer design consultation: applicable to the beginner entry and shared-card
  view. No external provider consultation was requested or performed. The
  standing review policy makes it optional; this is not external approval.
- Design questions: whether a novice knows which face allows each segment,
  whether staged help encourages a separate construction, and whether shared
  work stays distinct from personal readiness. Retain the supplied progressive
  path, explicit face reasoning and manual readiness wording.
- Ready-result review must inspect source preservation, math, actual interaction
  and screenshots. A real learner's independent construction remains a teaching
  observation, not a claim established by automated tests.
- Remote handoffs contain only public source, the minimum diff and synthetic
  fixtures. No account details, credentials, private source documents, room
  invitations or machine-specific absolute paths are included.
- External review, if later requested, requires provider, PR, exact base/head,
  verdict and verifiable source/timestamp. Internal checks are not such a record.

## Risk and rollback

- Main risks: unintended personal-storage access, partial or invalid shared state,
  losing the selected card at room initialization, and layout regressions from
  the large supplied course. Explicit validators, isolation and two-role tests
  address these before release.
- Revert this task's commit(s) to remove the new course and its registry/picker
  entries and restore the prior host allowlist. No database migration is added.
- After a later authorized live assignment, remove that new course ID through
  the normal teacher program editor before rollback. Preserve other assignments
  and all existing work. Never reset accounts or the browser's whole storage.
- Existing source storage keys and lesson IDs remain compatible. Board state is
  version 1 within the existing SDK contract; private route progress stays local.

## Permissions

- `START` granted in the current task conversation: **yes**.
- Branch creation, scoped implementation, tests and logical local commits: **yes**.
- Push and complete Draft PR: **yes** under the directly supplied task rules.
- Merge, auto-merge and deployment: **no** in this turn. The user's current
  `AGENTS.md` instructions explicitly require separate owner authorization; they
  take precedence over the repository's broader standing release policy.
- Before any later merge, query authoritative current remote main and compare it
  with the exact base in that authorization. Base drift invalidates it; prepare
  a read-only virtual composition and applicable gates, then request a new
  explicit authorization. No force, reset, rebase or automatic drift repair.

## Execution record

- Base and clean worktree verified; branch created from the authoritative base.
- No production account or assignment is changed by automated tests.
- Local gates: 402/402 board-server tests; 100/100 course/adapter/cabinet/room/
  ink/image tests; eight independent mathematical/content tests and 12 sitemap
  tests passed. Deterministic build, syntax and whitespace checks passed.
- Initial new tests exposed URL encoding of three preserved Cyrillic card IDs;
  the sections host path now preserves them and all 186 IDs are checked. A
  course-entry test exposed the missing cabinet return on public program links;
  only the new course's personal entry now joins the existing return workspace.
- Test-authoring mismatches (SVG subpixel rounding, native disclosure scheduling,
  actual numeric feedback wording and the noun «грань») were corrected against
  observed UI behavior. Exact shared-state equality and failure boundaries stay
  asserted. All expected registry counts now include the one new authorization.
- Real browser attempted locally: unavailable at Chromium launch because the
  executor denies its process-singleton socket. No UI assertion ran in that
  attempt. The committed CI gate must execute the actual two-role room journey.
- Reload coverage concerns the board host document and the participant's room
  page. A full reload of the outer cabinet recreates its original entry URL;
  returning to an existing room then requires its room link. This pre-existing
  cabinet behavior is not changed or represented as a successful room restore.
- Actual head, PR and CI/visual evidence: recorded in the PR handoff. Live
  assignment follows a separately authorized, verified release.
- Continuation opened Draft PR #474 from the preserved task branch. An
  independent review found that numeric correctness flags were not tied to
  the submitted shared answer. The adapter now reuses the course's own parser
  and tolerance; all 41 numeric cards, accepted formats, invalid syntax,
  retained restart feedback and forged flags are covered by the 10-test
  adapter suite. No second parser or ordinary answer behavior was introduced.
- The existing navigator gate exposed a missing registration for the new
  public course. Its exact existing include pair and source-bound inventory
  entry are added; the offline build removes only the verified pair and
  rejects all remaining external script/stylesheet references. All previous
  navigator bindings are preserved. The immutable initial task commit
  `acfcf3961dbaaf79a54c7d8cce2d4e7b5f2607d2` supplies the new source binding.
- Current main advanced to `6c64ac63e6bad70993ec50995d3a39976b1b0a36` through
  published PR #473, an independent logarithm introduction. The first read-only
  virtual merge reported a status-document conflict; no branch repair was
  performed. Final composition and actual CI results are recorded in PR #474.
  Task-branch push checks preserve real-browser verification while GitHub
  cannot synthesize a conflicting pull-request merge ref. Additional focused
  regressions do not claim that every workflow for a future reconciled PR ran.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
