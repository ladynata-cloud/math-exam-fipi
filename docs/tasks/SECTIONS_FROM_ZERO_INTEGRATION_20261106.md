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

### Owner continuation, 2026-11-07

The owner requested the separate course assignment and an easy round trip
between a selected course card and the shared board. Continue in this task,
branch and PR. Add a direct card-to-board action and a course panel on the
existing board; closing that panel must leave the room and its trainer mounted.
The teacher may choose another card using the existing authorized board action.
A pupil may read the course and return, but this navigation does not grant a
new ability to replace the shared task. Explicitly opening the personal course
uses its normal personal storage; shared work is never copied into it.

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
- Allow the teacher to inspect the public sections course from the assigned
  card, without loading or creating the pupil's private attempts.
- Link the selected personal course card to the board and expose a visible
  course/board return outside the observer's inert trainer iframe. Preserve
  the existing room, current construction and ink during a same-card return.

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
- [ ] The teacher can open a precise course card on the board from the cabinet.
  Returning through the course panel keeps the same room and trainer document.
- [ ] The observer can reach the course/board controls, but cannot use them to
  change the shared card. A teacher selection preserves room and drawing data.

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
- The 2026-11-07 continuation authorizes adding this separate course to the
  intended existing pupil after its verified release, preserving other courses
  and learning records. It does not supply a new exact-base merge authorization.

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
- The first CI browser attempt exposed a fixture actor mismatch: the teacher's
  existing preview intentionally offers the shared board, while personal course
  work belongs to the pupil. The fixture now authenticates the synthetic pupil
  with a valid four-digit code and checks that pupil's exact course return.
- The next real two-role journey passed selected-card recovery, mirrored work,
  observer reload and control transfer, then exposed a host restoration defect.
  A teacher room URL retained its original `trainer` query; replaying that query
  during reload could invalidate the already-ready bridge through fragment-only
  navigation. Created/restored room URLs now remove that obsolete entry query.
  Initial direct course entry, room authority, other URL parameters and private
  session credentials retain their existing behavior. Two complete-host
  regressions failed on the original source and passed after the correction;
  46 focused host/selection/picker tests passed. Real-browser confirmation of
  the corrected flow is recorded in the PR, not assumed from these DOM tests.
- Pupil-controller reload now tests the existing server contract explicitly:
  the new client is held until the disconnected pupil's turn returns to the
  teacher, then reconnect restores the exact work in an inert observer frame.
  Real grant, pupil editing and revoke follow. The earlier assumption that a
  pupil always retains control through a disconnected interval was incorrect;
  neither the server contract nor the ownership assertions are weakened.
- The next CI journey passed host restoration, trainer retry and the complete
  disconnected-pupil handback/regrant/revoke sequence, then exposed native form
  submission being blocked in the cabinet's sandbox before the course's submit
  listener could run. Both numerical forms in this course now use their existing
  local checker through explicit buttons and composition-aware Enter handling;
  the shared workspace's sandbox permissions are unchanged. The browser checks
  now assert invalid/checked/correct feedback directly in personal and shared
  work, rather than accepting equality between two unchecked answers. The
  offline edition is rebuilt from the same source; mathematical data is intact.
- An unchanged rounding page schedules initial focus into its answer field.
  One navigator browser journey observed the untouched welcome reply after
  Enter, consistent with that focus stealing the key event. The harness now
  awaits that page's observable initial focus before opening the navigator.
  Enter search remains checked on every page and viewport; no page, assertion,
  privacy check or failure boundary is skipped, and page/widget code is unchanged.

## Required handoff

### Continuation validation

- The previous head `2ec719bd0de09d2bdb72d55bf214fa2e39356d6a` passed all nine
  jobs of [CI 42259717017](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/42259717017),
  including the real two-participant browser journey. Its old pending wording
  in the PR description is superseded by that actual run.
- This continuation adds course/board navigation; it requires a fresh exact-head
  browser run. Earlier evidence is not claimed for the modified interaction.
- Local continuation checks passed: 11 navigation tests (including seeded rooms,
  observer/control boundaries and stale-document rejection), existing complete
  host/room-selection regressions, 18 course/cabinet tests, 27 shared-course and
  return tests, eight independent mathematics tests and 402 server tests.
  Deterministic build, syntax and whitespace checks passed. The real-browser
  journey now starts its round trip with a completed step, a nonempty shared
  draft and an actual canvas stroke synchronized to the pupil.
- Current main observed at continuation start is
  `66172e7398d63c1f809cb3befbd29dbb92651109`, including independent published
  PRs #473 and #476. It subsequently advanced to
  `25548b86df75b8c90a5dc5c6f1f1925c2ad70636` through PR #475 (profile
  logarithms/trigonometry and shared-room ordering). Preserve all three changes
  in the read-only composition before a separate reconciliation/release
  decision; no branch repair is performed implicitly.
- Chromium cannot launch in this executor: its process-singleton socket is
  denied. Pinned-browser download also returned an invalid archive. Browser
  validation runs in CI; local DOM tests do not replace it.

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


## Authorized release continuation — 9 November 2026

The owner explicitly authorized sending the prepared changes to
`ladynata-cloud/math-exam-fipi`, merging checked PRs and publishing on
`mathexam.space` after successful checks. This supersedes the earlier release
hold for this approved course; earlier hold paragraphs above are historical.
No actual-pupil assignment is included.

The local composition with main `463d6bf56fc8f1f944da8d237102f77888711e79`
retains exactly the 43 original task paths; 41 task blobs are unchanged and all
131 concurrent main files are preserved. The navigator-only conflict preserves
all 612 current main page bindings plus the sections page and both histories.
Stable code patch ID (excluding manifest/status):
`889eb32866d3d80e9f3433d5167b912c0f2ce904`.

Local validation: sections 41/41, independent geometry 8/8, sitemap 12/12,
navigator 4/4, bindings 5/5, deterministic build of 556 URLs, syntax and
whitespace PASS. The initial parallel local run reported two whole-file failures
without assertion or signal details; the single sequential retry with 256 MiB
heap passed 41/41 in 172.6 seconds without changing tests.

Remote provenance must use an actual GitHub source checkpoint followed by an
exact manifest rebind. Final remote refs, actual-head CI and release evidence
are recorded in the PR. Full browser/CI verification and Pages/Amvera live
checks remain mandatory; no new release or assignment is claimed here.


## Final dependency composition, 9 November 2026

The approved release now stacks this course after #507, actual predecessor
ce19ca31d4776034503d81c8997feba5fbccbb1b, which preserves #508, #499, #497,
#505 and published main 39705bc5. PR #474 targets the existing predecessor
branch until root release coordination merges dependencies with their history.
PR #504 continues to target this course. Branches are retained.

The two published Vilenkin heading links and the sections catalogue card are
preserved together. Navigator coverage is 558/557 with the existing Peterson
exclusion, all predecessor/source histories and the sections provenance row.
All merged HTML bindings already match their reviewed rows; the final receipt
only advances source identity to an actual uploaded composition checkpoint.
The binding tool does not rewrite HTML or expand coverage.

The preceding actual course head 9c31b4b57b2b47a058a99dbb122220cc7ab586fb
passed 32/32 workflows (50 successful checks, 3 expected conditional skips).
Its profile run 42607870110 passed 9/9 jobs including independent mathematics,
real two-participant sections browser work, cabinet/navigation, registry/roads
and all navigator browser shards. All 6 screenshots were reviewed; artifact
13670902707, ZIP SHA-256 f354de83cb47d5f4bf77ad63195a5a552d1bbab1899b220fb1ea6c95fed1e106.
These are prior source evidence; final composed actual-head CI remains required.
