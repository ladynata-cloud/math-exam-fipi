# MathExam project status

Updated: 2026-10-25 (Asia/Novosibirsk)

## Prepared for requested publication: college function graphs

- [Scope and checks](tasks/COLLEGE_FUNCTIONS_COURSE.md), MEDIUM static trainer;
  base `8e681831e874a9af129f50c16179bd2a424c5474`, branch
  `feat/college-functions-course`.
- 40 graph tasks, eight diagnostics, retained eight-step solutions, contextual
  help and independent practice. Progress is browser-local; no cabinet or sync.
- Mathematical and DOM journeys, desktop/mobile rendering, sitemap and SEO
  checks pass. Independent internal review is recorded in the PR; unavailable
  Claude consultation is explicitly not claimed as completed.
- Owner requested creation and publication on the existing site. Next: exact-head
  CI, normal scoped release, then live verification at the new public route.
  Publication is not claimed by this prepared-status entry.

## In progress: whole-course OGE audit and shared practice

- [Scope](tasks/OGE_COURSE_MIRROR_AUDIT.md), HIGH; base `8e681831e874a9af129f50c16179bd2a424c5474`, branch `feat/oge-course-mirror-audit`.
- The published core has 32 trainers: numbered 6–25 and twelve practical routes for 1–5. Only six had semantic mirrors before this task.
- Preparing native shared practice for the remaining numbered trainers and ten practical routes, with real room transport, isolated personal storage, visible capability and content corrections. Tires and supplementary personal routes remain explicitly outside the new mirror claim.
- [Audit report](tasks/OGE_COURSE_MIRROR_AUDIT_REPORT.md) separates content, supported practice and limitations. Not yet a production claim; exact-head checks, independent review and release decision are required.

## Published: OGE geometry 15–19 shared practice

- [Scope](tasks/OGE_15_19_SHARED_BOARD.md), HIGH; PR335 merged as `8e681831e874a9af129f50c16179bd2a424c5474` after the owner's explicit release instruction.
- Reviewed head `5c060f665fba823119bf9721b38a1cce4aaa136f`; published tree `1fcdf47df45190a92c913453546e3c0f5c6db82d`. All nine post-merge workflows passed, eighteen runtime assets matched exact reviewed bytes, backend was healthy with 25 mirrors, and live two-window checks passed for 15–19.
- Restored task15 practice/remediation, added five native shared adapters, corrected circle/trapezoid models, and repaired plan cards. Five references were saved in the selected cabinet and verified after reload and learner preview; no private learner identifiers are retained here.
- The failed Claude review had no verdict (insufficient credits); the owner's exception was scoped to PR335 and does not waive future reviews.

## In progress: harder НОК / НОД and a selected two-trainer cabinet

- [Scope](tasks/GRADE6_NOK_NOD_ADVANCED_ONLY.md), MEDIUM bounded content/UI
  update, branch `feat/grade6-nok-nod-advanced`, base
  `5e68b35e8e9af54cdfa39558bec121138118fade`.
- The owner requested stronger examples, more prime-divisor choices and only
  the two number-theory trainers in one existing learner's visible route.
- Implemented: every published task ID retained, 32 pairs added within 2..200,
  fresh sessions start at 132 and 88, 15 primes through 47 are available, and
  the existing board state schema and synchronization behavior are preserved.
- The selected cabinet mode uses an explicit per-profile focus choice;
  no account, schema, authorization, saved-work or global-course change.
- Local mathematics, 112 guided journeys, actual two-sided board sessions,
  real form/API/SQLite cabinet saves, retained-work/peer checks and focused
  regressions pass. Independent technical review is complete; the task record
  lists results and resolved test-environment failures.
- Next: complete exact-head cloud gates in one Draft PR; obtain the concrete
  release decision before publication and the live cabinet setting. The new
  trainer version and exclusive route are not yet claimed as published.

## Published: grade-six НОК / НОД trainers and shared board

- [Scope](tasks/GRADE6_NOK_NOD_BOARD.md), MEDIUM bounded integration, branch
  `feat/grade6-nok-nod-board`, base
  `91dd1e5a3f85e29709df922fa88859204aac100d`.
- The existing requested cabinet and its Vilenkin grade-six direction were
  verified in the live teacher interface. The merged PR315 integration is
  present; its 27 managed modules and the learning catalog stay unchanged.
- Published two standalone trainers with prime-factor columns, retained steps,
  occurrence-aware matching, contextual help and the existing board SDK.
  Fixed plan cards use the existing saved-note mechanism without a new attempt
  contract, account or storage migration.
- External Claude consultation was unavailable. The owner authorized the
  exact PR #332 release with a task-specific exception; this is not an external
  verdict or a standing exception for later work.
- Mathematics, all 48 guided journeys, cabinet and registry regression checks,
  and both actual local board journeys passed. Independent internal review
  resolved the embedded navigation escape; no external verdict is claimed.
- [PR #332](https://github.com/ladynata-cloud/math-exam-fipi/pull/332) records
  the completed release at `5e68b35e8e9af54cdfa39558bec121138118fade`: 13/13
  pre-merge workflows, 7/7 post-merge workflows, 20/20 published asset checks,
  the exact 18-mirror registry and production synchronization readiness for
  both trainers. The two plan references were saved through the teacher UI
  and verified after reload and in learner preview, with Vilenkin retained.
- Gate: `GRADE6_NOK_NOD_CABINET_BOARD_OK`. No real-pupil learning-outcome
  trial is claimed. The subsequent harder/exclusive-route request is the
  separate task above, not an extension of the completed release permission.

## In progress: complete chapter 1 of Shestakov–Yaschenko

- [Scope](tasks/SHESTAKOV_CHAPTER1_COMPLETE.md), HIGH content review, branch
  `content/shestakov-chapter1-complete`, base `043006f439475124b3bb814c81fc887ecbadbe7c`.
  The owner requested continuation after the verified first publication.
- PR324 is published as `5de3d1ad4ad1fb77f477f31a6fdd44f091f86a20`:
  324 exercise variants and 27 theory cards across 27 topics; 1,656 variants pending.
  Pages, post-merge workflows, 18 public file responses and actual live desktop
  learning interactions passed. Mobile checks ran on the identical composed bytes;
  no production-only mobile run or real-pupil trial is claimed.
- This continuation adds the 192 missing chapter-one variants, aiming at all
  126 numbers / 252 variants in that chapter. The intended course total is
  516 exercises plus 27 theories, with 1,464 variants still pending.
- Preserve all previously published content and runtime/storage behavior. The
  previous exact-head release authorization is not claimed for new content.
- Next three actions: author and independently review the 192 additions;
  complete source/mathematics/model/runtime/offline gates and one Draft PR;
  obtain the concrete new release decision after the result is reviewable.

## Release in progress: grade 10 Merzlyak cabinet and shared board

- [Scope](tasks/MERZLYAK10_CABINET_BOARD.md), [PR #314](https://github.com/ladynata-cloud/math-exam-fipi/pull/314), MEDIUM bounded integration.
  The owner explicitly authorized the presented merge and publication on
  2026-10-24. Reviewed head `d8d07fea84fb8d6312705b97436ec9441d9c116d`
  passed all 11 workflows: 14 successful jobs and one skipped content consultation.
- Main subsequently advanced from `07189de58b7f5d60c02ea6ca6aa9450a324a377f`
  through PRs #313, #316, #320, #317 and #321 to
  `f616ec8cbd70dd18e3cecfa58be683c32303a573`. Their release provenance and
  read-only virtual composition were inspected first; 12 files conflicted.
- Continue the already authorized course-preservation work: retain writing,
  screenshots and layout tools, all five START mirrors, Peterson plan cards
  and board, Vilenkin managed work, Atanasyan and Makarychev content. No new
  teaching content, account/schema migration or hosting configuration is added.
- Expected exact union is 45 catalog records, 16 mirrors and 1,450 picker links.
  Both readiness protections and every assertion in the overlapping expressions
  test remain. The shared host differs from current main only in picker cache.
- The published Merzlyak course still contains 989 reviewed cards and solutions
  to all 736 numbered exercises. This integration does not change authored content.
  Real account details and credentials remain solely in the private teacher UI.
- Prior checks are history, not proof of the new composition. Fresh results,
  exact base/head, failed or skipped checks, independent review and actual
  publication evidence belong in PR #314; no live release is claimed here.
- Next: complete composed-tree review and cloud gates; publish the validated
  scoped integration under the owner's current authorization; verify Pages,
  Amvera cabinet assets and the complete 16-mirror authoritative registry.

## In progress: Peterson 6 course in the cabinet and on the shared board

- [Scope](tasks/PETERSON6_BOARD_SYNC.md), MEDIUM review, base
  `b3f2c8999b8155dc9ef249da46b400c396f187d7`, branch
  `feat/peterson6-board-sync`. The owner requested cloud assignment of the
  published course and synchronization with the existing interactive board.
- Thin registered wrapper for all 14 topics / 224 tasks and 20 practice skills.
  Shared state covers drafts, steps, feedback, help, notes, model controls and
  the detour/return. Personal browser progress remains isolated.
- Existing cloud plans gain a fixed course reference card with role-appropriate
  course, practice and teacher-board links. No fictitious managed attempt,
  personal credit or server persistence contract is introduced.
- Local and exact-head cloud evidence, review findings and publication status
  will be recorded in the PR. No completed deployment is claimed here.

- Concurrent PRs #318, #315, #319, #313 and #316 are preserved through normal merges:
  both board aliases, the fifteen-entry mirror registry, Atanasyan manual work,
  all Vilenkin managed modules/profiles, the standalone Makarychev course,
  the published writing/screenshot/layout tools, and all five added START
  mirrors. The host keeps the combined picker cache token and iframe keyboard protection.
  Combined checks and independent merge review are required before publication.

## Merged code: five added START sections on the shared board

- [Scope](tasks/PROFILE_ADDED_TRAINERS_BOARD_SYNC.md), [PR #316](https://github.com/ladynata-cloud/math-exam-fipi/pull/316), MEDIUM review.
  Merged as `b3f2c8999b8155dc9ef249da46b400c396f187d7`, sole parent
  `d524c9107133d6a948ff11c18095b5ca01b660de`, exact reviewed tree
  `2cd789549146000d466998047f6a54e69bd9731c`.
- Five fixed START wrappers synchronize drafts, models, hints and solution
  state. Published task-3/task-8 integration and individual board tools remain.
- The merge records the owner's ordered release authorization, independent
  focused review, 150 focused units, six browser gates and all twelve exact-head
  CI jobs passing on `63c0b20f1559cfc3497a42d92e58c5f89f95c082`.
- Peterson integration preserves all 31 published blobs except the explicitly
  composed picker/registry expectations, readiness waits and host cache token.
  Production lesson verification is not inferred from this status reconciliation.

## Merged code: individual board tools and screen modes

- [Scope](tasks/INDIVIDUAL_BOARD_TOOLS.md), [PR #313](https://github.com/ladynata-cloud/math-exam-fipi/pull/313), MEDIUM review.
  Merged as `d524c9107133d6a948ff11c18095b5ca01b660de`, sole parent
  `07189de58b7f5d60c02ea6ca6aa9450a324a377f`, exact reviewed tree
  `a789ea65f334e1a4db10e36515a5144492314baa`.
- Adds writing tools, screenshot insertion, independent split/pan/zoom and
  Together / Trainer / Board views using the existing room/control transport.
  The live trainer, shared control, own-author undo/redo and keyboard protection
  remain intact. Existing rooms remain memory-backed.
- PR #313 records six exact-head CI jobs passing on
  `f22265363dd0145e8fd9641f418f6aded0b293eb`, focused independent review,
  150 focused checks and six combined browser gates. Its first writing job was
  cancelled during dependency downloads; the unchanged second attempt passed.
  The merge commit records the owner's explicit release authorization.
- Production lesson and physical stylus/iPad verification are not inferred by
  this reconciliation. Additional START adapters belong to their separate task.

## Merged: Vilenkin 6 part 1 in cloud cabinets

- [Scope](tasks/VILENKIN6_CLOUD_CABINET.md), [PR #315](https://github.com/ladynata-cloud/math-exam-fipi/pull/315), HIGH review.
  Merged as `52cb1c1a5c731acd660139328f0001ccfa33a08b`, sole parent
  `202d39bf826c8c7e030e59ff162fe808000cae7e`, exact reviewed tree
  `8c9abbf25ed963f1ae2ad68bd536c4528138d308`.
- All 27 published modules use managed cloud learning with saved drafts,
  accepted steps, help, models, checkpoints and owned textbook notes.
  The original 475 tasks, 81 examples and source PDF remain unchanged.
  Dedicated profiles migrate additively; authentication remains unchanged.
- PR #315 records independent review, 309/309 composed backend tests and
  all nine exact-head workflows passing: 12 successful jobs and the explicitly
  waived external-review job skipped, not counted as a pass. Reviewed head:
  `06381875e14826ea3e5d0d0beea1a27228c2dc27`. The owner authorized that
  publication and its scoped external-review exception.
- Production assignment and deployment verification belong to that PR's
  release record; no additional pupil action is claimed by this reconciliation.
- Preserve the expanded profile enum, V6 decoder/catalog and persistent data
  during rollback. A raw pre-V6 server image cannot read the expanded schema.

## Published: Atanasyan 92a in the cabinet and on the shared board

- [Scope](tasks/ATANASYAN_92_CABINET_BOARD.md), [PR #318](https://github.com/ladynata-cloud/math-exam-fipi/pull/318), HIGH review.
  Merged as `202d39bf826c8c7e030e59ff162fe808000cae7e`, sole parent
  `1f9d8aec82bd2909917ab22746d94571d87c59c4`, exact reviewed tree
  `0b5d21b00419f8a8c4801753acaeef3884ed2213`.
- The existing exercise gains a fixed wrapper, isolated board state, a managed
  manual learning contract and a catalog entry. Published mathematics, diagrams,
  all 336 cards and the sealed textbook runtime remain unchanged.
- All 12 exact-head cloud checks passed on
  `78151b0c50e0c4df2400779f3736bbf9074c2813`; full server tests 298/298,
  real shared-board/cabinet journeys and independent technical review passed.
  The owner authorized publication and a scoped external-review exception,
  documented in PR #318; no external-provider verdict is claimed.
- The host uses iframe inert state after control revoke. Manual save and theory
  restoration retain the existing no-automatic-credit rule.
- The completed [PR #318 release record](https://github.com/ladynata-cloud/math-exam-fipi/pull/318)
  confirms Pages deployment 40012195196, both post-merge integration checks,
  34/34 static byte comparisons and the completed Amvera rollout. Public
  backend verification at 2026-10-23T20:32:13Z passed; the fixed 92a contract
  remains intact alongside later shared-catalog releases.
- Native plan delivery was saved and verified after reload in that release.
  This status reconciliation creates no additional assignment or pupil attempt;
  real-pupil learning outcomes remain unverified.

## Published: profile task 3 stereometry on the shared board

- [Scope](tasks/PROFILE_STEREOMETRY_BOARD_SYNC.md), MEDIUM review. PR #312
  merged as `1f9d8aec82bd2909917ab22746d94571d87c59c4`, sole parent
  `40682b243b3e7342d4330272f7329e60a1d0f417`; reviewed head
  `4c0a958383d304dc5167730034c487df059d26ac`.
- Exact-head CI passed 8/8 checks. The published 21-file delta and tree
  `8bd1cc3059d9b942524555abb955707c4da17f4c` matched the reviewed result.
  Pages run 39993968816 and automatic profile run 39993968452 succeeded.
- All 20 frontend byte probes passed; the authoritative backend returned the
  exact eight-entry registry, including task 3 and preserved task 8, with
  healthy status. Complete evidence and earlier failures/retries are in PR #312.
- The local/cloud teacher-observer tests passed. A supplemental production
  Chromium render was not run because TLS certificate validation failed;
  verification was not disabled. No real account or production-room writes
  were performed in that task. Publication verification passed.

## Published: profile task 8 on the shared board

- [Scope](tasks/PROFILE_EXPRESSIONS_BOARD_SYNC.md), MEDIUM review. PR #311
  merged as `40682b243b3e7342d4330272f7329e60a1d0f417`, sole parent
  `5496bde6f9dff75221cde7ed30a1905f71ae7ec5`; reviewed head
  `10644c33005a4d66e5839ab7221dd47eeceb02ce`, exact reviewed tree
  `67aad910e855a0c16ff8fb1fe578a13a6983db58`. No base drift occurred.
- All seven pre-merge CI checks passed. The automatic post-push profile run
  `39982828499` has also completed SUCCESS. Pages `39982826964` succeeded on
  the exact merge. All 12 changed public frontend files matched reviewed
  bytes through ordinary and versioned URLs (24/24 checks).
- The active Amvera registry returned the exact seven-entry projection,
  including `ege-profile-expressions`, with digest
  `sha256:6201dfb928a792d53a80474ac459966655c3b78b6babcbd30302d4556579d14c`.
  Final health and registry requests succeeded at 2026-10-23 23:01:59 +07
  after one transient health 503 during rollout.
- The original task-8 link opens the wrapper of its six existing topics.
  Shared state includes task/draft, accepted steps, feedback, help, solutions,
  models and route. Real local teacher/observer tests covered narrow layout,
  control handoff, reload, late join and no echo; personal stores stayed intact.
- Gate: `PROFILE_EXPRESSIONS_BOARD_SYNC_OK`; publication verified. No real
  account or production-room test was performed. Supplemental B2 Roads has an
  inherited legacy-selector failure; the full B2 suite is not claimed passing.
- No new curriculum, mathematical data, server/SDK contract or personal credit
  rule changed. The owner's PR #311 release authorization has been completed.

## Published: profile cabinet entry to the full current course

- [Scope](tasks/PROFILE_FULL_COURSE_ENTRY.md), SMALL review. PR #310 merged as
  `5496bde6f9dff75221cde7ed30a1905f71ae7ec5` on 2026-10-23 at 14:22:04 UTC,
  with sole parent `a05f3b60a590da5ca5d149c86262241ace186973`.
- All four checks passed on reviewed head
  `8114f71e3f6242211cc82cc56da14a0872d3ee3f`; the school check's initial
  dependency-download timeout passed on a rerun of the same head.
  Pages run `39969019947` succeeded on the merge commit.
- At 14:23:34 UTC, the published `learning/index.html` and `learning/app.js`
  bytes matched the reviewed files on both Pages and Amvera. The live teacher
  interface displayed "Открыть полный курс ЕГЭ профиль →"; following it opened
  the canonical `#calm` course with tasks 1–13, task 16, the mixed checkpoint
  and current stereometry material.
- Synthetic profile-entry regression passed. A real learner-account login was
  not performed. Course content, learner data and progress semantics were
  unchanged. Release gate: `PROFILE_FULL_COURSE_ENTRY_PUBLISHED_OK`.

## In review: Atanasyan 7–9 chapter III, parallel lines

- [Scope](tasks/ATANASYAN_7_9_CHAPTER_III.md), HIGH review; branch
  `content/atanasyan-7-9-chapter3`, based on
  `631d2d644d87162d60585c3efb8365af8311a3f5`.
- The exact 2023 edition was checked on printed pages 53–68. The candidate
  adds every number 191–227: 43 exercise parts, theory 24–30 and all 17 review
  questions, totaling 67 new cards. The combined candidate has 403 cards,
  227 exercise numbers, 309 exercise parts, 30 theory points and 64 self-checks.
- All 336 published chapter-I/II cards, normalized catalog entries, review
  provenance, runtime files and learner-work identifiers remain unchanged.
  The existing cabinet/board integration still selects exactly 92a and its
  four prerequisite theory cards.
- Independent source, mathematical, authored-model and actual image reviews
  passed. All 788 new view/width pairs are covered. The final full-course browser
  run passed 4084 view checks, 806 step flows and 12 interactions at 320/1280
  pixels without geometry issues or page errors. The hash-bound chapter-III
  review manifest is separate from both earlier chapter reviews. The strict
  reviewed-content gate and ten public interaction scenarios also pass.
- Detailed evidence is recorded in `docs/reviews/ATANASYAN_7_9_CHAPTER_III_*`.
  Exact-head cloud CI and the committed identity belong to this task's Draft PR
  handoff; no publication result is inferred from a local review manifest.
- This section describes a development candidate. Chapters I–II remain the
  published baseline until a separate owner-authorized release of chapter III.
  Later book chapters and a real-pupil pilot are outside this task.

## Published: Atanasyan 7–9 chapter II, triangles

- [Scope](tasks/ATANASYAN_7_9_CHAPTER_II.md), HIGH review. PR #308 merged as
  `6bad56115ff023815e2840873dc7bc60cd3dba1e`, sole parent
  `e72b7c707d3cff4d0da75f6d4053401a91eb1616`; reviewed head
  `4b231d446046be36457f3069b9753cb4553a878e`.
- All 99 numbered exercises 92–190 and 132 subparts, theory 14–23 and
  21 review questions are published: 163 new cards. The combined course has
  336 cards, 1053 steps and 1648 views; all 173 chapter-I cards are intact.
- Independent source/mathematical/visual review and exact-head CI passed.
  Current-base verification passed 25 checks, 3296 browser views, 672 card
  journeys and nine interaction scenarios. All 1165 concurrent files stayed
  intact. Pages 39878390626, 14 public byte checks and live UI passed.
- Gate: `ATANASYAN_7_9_CHAPTER_II_PUBLISHED_OK`. Complete identity evidence is
  recorded in PR #308. The owner waived unavailable Claude review for that
  course release; this is not a standing waiver for unrelated integrations.
  Real-pupil trials and later book chapters remain pending.

## Published: Atanasyan 7–9 chapter I

- PR302 merged as `c62e5047fa2e774d43899e4ee20d5e1127c53e64`, sole parent
  `fa8273a36d33eb0ed854119d26cfa8d55b681d20`. The reviewed48-file delta and all
  changed-file blobs match; composed tree `f4463f39a1581f6d7a92ac1340d396e3ed66cbe9`.
- Published173 cards cover all134 parts of exercises1–91, thirteen theory points
  and26 review questions, with499 justified steps,845 views and453 geometric
  checks. All1690 width-specific view checks and346 card journeys passed;
  all692 initial/final images were independently reviewed or verified identical.
- Exact-head CI and Pages39868162647 succeeded. All14 canonical/cache-busted
  public requests matched reviewed bytes; public bundle SHA256
  `c8fee8a373b5fd00b883794066fd82857e9a10ee4890b6e0a2695086fba10daf`.
- Live course, deep links, saved draft/steps, theory return, full-screen return
  and the legacy entry were checked. Gate:`ATANASYAN_7_9_CHAPTER_I_PUBLISHED_OK`.
  Later chapters and real-pupil validation remain pending.

## In progress: Atanasyan chapter III self-check questions

- [Scope](tasks/TEXTBOOK_ATANASYAN_POLYHEDRA_SELFCHECK.md), HIGH review;
  owner requested publication and continuation on 2026-10-24. Branch
  `feat/atanasyan-polyhedra-selfcheck` starts from release head
  `96cd674faebfc1353194325ab8fb5011fdf11519`, now an ancestor of production.
- Eighteen cards cover all fourteen questions, including both original parts
  of question7 and four explicit cases for question10. The unrestricted
  nonconvex case has a general construction, not only a counterexample.
- Independent exact source, mathematics, pedagogy and coordinate reviews
  passed at 2026-10-24T10:51:46.357Z. Added79steps and76modelstates. Candidate:
  474cards,1693steps,1709views;282complete exercises,37theory points and40
  self-checks. All456 previous cards, runtime and pupil-state contracts remain.
- Exact-head cloud and actual visual review remain pending at this checkpoint.
  Next: verify the committed cloud run, inspect new desktop/mobile images,
  and record the separate Draft PR handoff. Practical271–275 and additional
  exercises288 onward remain pending; the entire book is not complete.

## Published: Atanasyan point37 and exercises281–287

- [Scope](tasks/TEXTBOOK_ATANASYAN_POLYHEDRA_SYMMETRY.md). Original reviewed
  [PR #326](https://github.com/ladynata-cloud/math-exam-fipi/pull/326) is closed
  as superseded by [release PR #328](https://github.com/ladynata-cloud/math-exam-fipi/pull/328).
  Its branch was preserved; after the dependency squash, the identical38-file
  delta was applied to the released base without changing any content bytes.
- Release head `96cd674faebfc1353194325ab8fb5011fdf11519`; merge
  `0f080e9dba396e6bbe7bc7c6df0959c70d2d3437`, first parent
  `054b8a43803686d647ff7b8cf89dc21b618439d0`; exact reviewed composition tree
  `e55e4afb8eea5106a7b312c43b702981b5e2da37`. All11 fresh cloud checks passed,
  with912journeys and1664captures in run40086658043. Existing independent
  mathematics and216-panel/42-complete-proof visual review apply by exact
  content and tested-input identity; no second manual image review is claimed.
- Pages40087429216 succeeded on that merge. At2026-10-24T10:52:20.761465Z,
  all90 ordinary/versioned public requests matched reviewed bytes: both new
  blocks'38cards, bundle, source index and core display assets. Live course:
  456cards,1614steps,1633views;282complete exercises,37theory points,26self-checks.
  Bundle SHA256 `e51200d031fc5e644f9047c240808837c3e70caf8bf81f737e9af5c91b4a64ad`.

## Published: Atanasyan regular polyhedra continuation

- [Scope](tasks/TEXTBOOK_ATANASYAN_REGULAR_POLYHEDRA.md),
  [PR #325](https://github.com/ladynata-cloud/math-exam-fipi/pull/325), reviewed
  head `9215006712a31d30d9bc0ef7d7acb5e0034b8019`. It completed point35,
  point36 and exercises279–280 in17cards,90steps and70modelstates.
- Squashed as `054b8a43803686d647ff7b8cf89dc21b618439d0`, sole parent
  `043006f439475124b3bb814c81fc887ecbadbe7c`; exact tested tree
  `871d3bdfa636276a8876a97e90b28946c9f2aadf`. All12 reviewed-head checks,
  independent content/integration and actual visual review passed.
- Pages40086548022 succeeded; the435-card public bundle matched SHA256
  `097848bc113d3b7e6167b826603855aa67048209066cb15957124288a9a5a4c3`.
  This increment is also preserved in the subsequent456-card publication above.

## Published: Atanasyan pyramids and first symmetry block

- The preceding course increments are published. PR321 merged as
  `f616ec8cbd70dd18e3cecfa58be683c32303a573`; Pages40056093696 succeeded on that
  exact merge (rechecked at this task start), and the commit is in current main.
- Production evidence in PR321 records44 successful ordinary/versioned public
  requests with byte identity. Published bundle SHA256:
  `2adb3cd6f05848c6ccee7bc6e49d52231f635b2bb20b8c61b760e723b25a1643`.
- Published418cards,1411steps and1469views: exercises1–270 and276–278,
  theory1–34, four of eight parts of point35, and26self-checks.
- Point35 remains partial; practical271–275, points36–37 and exercises279 onward
  are not covered by that release. The full book remains incomplete.
- The previous52-card pyramid increment and15-card symmetry increment have
  independent content reviews. PaidClaude remains deferred; no verdict claimed.

## Published: Atanasyan chapter III §1, polyhedra and prisms

- PR303 merged as `fa8273a36d33eb0ed854119d26cfa8d55b681d20`, sole parent
  `6a1f0488e33f9836663382a2e220e69092910337`, exact reviewed tree
  `5be3aaca3cdcf8a035718a6bf52d71a2a3cd7df4`.
- Published351 cards cover main1–238, theory1–31 and26 self-checks;1164 steps
  and1216 views. All315 earlier cards remain byte-identical.
- All8 exact-head cloud check runs passed. Actual visual review covers748 PNGs:
  434 published-baseline and204 previously approved images are byte-identical;
  110 images were re-reviewed through57 native sheets with complete pixel coverage.
  All13 earlier findings were resolved; no failed image was inherited as PASS.
- Pages39863669592 succeeded on the actual merge. All14 public canonical and
  cache-busted requests returned200 and matched reviewed SHA256 and sizes.
  Course SHA256: `7e10ed49d9e35682b99876dae8aba5be30942c942da6cb2f2cc4f6d30ba3206a`.
- Gate: `ATANASYAN_PRISMS_SECTION_OK`. No learner-data or grading change.

## Published: complete Atanasyan chapter II

- PR301 merged as `6a1f0488e33f9836663382a2e220e69092910337`, sole parent
  `434a8d53c7357a20bb1e2ecef853133b14805e84`, exact reviewed tree
  `5ae0ef27d2094a7c4f15c9788215f09eff4a4f6e`.
- All four applicable exact-head workflows passed. Independent source, mathematics,
  integration and434-image browser review passed;215 ordinary screenshot states
  retain all previous cases. Mobile numeric/radical groups, mixed numbers and
  explicit trigonometric fractions remain readable without changing authored text.
- Published315 cards cover main1–217, theory1–26 and26 chapterI–II self-checks,
  with1020 justified steps and1086 model views. Future sections remain pending.
- Pages39849875322 succeeded on the exact merge. All14 public canonical/cache-busted
  asset requests matched reviewed SHA256 and size; course bundle SHA256
  `9a075802ec782aca7b0417f33afb5891d9657c967b99a102988145bea1c69b81`.
- Gate: `ATANASYAN_CHAPTER_II_COMPLETE_OK`. No learner-data or grading change.

## Published: exhaustive textbook browser checks in four parallel jobs

- PR300 merged as `434a8d53c7357a20bb1e2ecef853133b14805e84`, sole parent
  `5953d69400615fdb4f8c6537f0af5a3c1355865a`, exact reviewed tree
  `85e311fc025989fef6d70f4ac529536cc2261645`. All product content is unchanged.
- Independent technical and exact-head reviews passed. Run39686386737 passed
  source-model, all four browser jobs and the strict collector. Artifact12387485077
  contains366 journeys,2524 label states, eight restores and two real-tab cases;
  all174 PNGs are byte-identical to the independently reviewed PR299 images.
- Pages39687154299 succeeded on the exact merge. All14 public canonical/alias
  requests matched the unchanged reviewed SHA256 and sizes.
- Gate:ATANASYAN_BROWSER_SHARDS_OK. No base drift, learner-data or product change.

## Published: complete Atanasyan introduction and chapter I

- PR299 merged as `5953d69400615fdb4f8c6537f0af5a3c1355865a`, sole parent
  `61a42de7d4f5d5aa0d440d9070294ceccffc6092`, exact reviewed tree
  `8f91a288ddae3c403a9b2e3c0fb0e2e5d4dbe849`.
- All three exact-head workflows succeeded. Independent source, mathematics,
  integration and new desktop/mobile screenshot reviews passed. Chromium checked
  366 card-width journeys,2524 model states and14952 labels, with no overlaps or
  browser errors; all eight expansion returns and two real-tab cases passed.
- Artifact12384239691 contains174 PNGs:114 byte-identical reviewed images and
  60 new images independently inspected in full. Pages39685878881 succeeded on
  the exact merge; all14 public canonical/alias requests matched SHA256 and size.
- Gate:ATANASYAN_CHAPTER_I_COMPLETE_OK. Published183 cards cover every question
  of main exercises1–115, theory points1–14 and16 chapterI self-checks, with581
  justified steps and659 model views. Later chapters remain explicitly pending.

## Published: Atanasyan exercises1–83 and visual theory1–14

- PR298 merged as `61a42de7d4f5d5aa0d440d9070294ceccffc6092`, sole parent
  `9ca681eaa8a382d64565233f4da703bbbca4c258`, exact reviewed tree
  `79bbcc6ba0e26474c0ce4872c390e69103cfb98b`.
- Independent source/math/pedagogy/integration and actual image reviews PASS.
  All4 exact-head workflows succeeded; cloud Chromium264 journeys,1930 views,
  11282 labels, no overlaps/errors;8 expansion returns and2 real-tab cases PASS.
- Final artifact12383558596 from run39679806725 contains114 reviewed images;
  two feedback-fraction issues corrected and visually rechecked at320/1280px.
- Pages39681647982 succeeded on the exact merge. All14 public canonical/alias
  requests matched reviewed SHA256 and size. Gate:ATANASYAN_PARALLELISM_CONTENT_OK.
- Published132 cards:83 main numbers,14 theory points,454 steps,533 views.
  This is a bounded course stage, not completion of every source position.

## Published: Atanasyan visual theory, introduction and first parallelism block

- [Scope](tasks/TEXTBOOK_ATANASYAN.md): separate textbook course with visible
  task/theory models, justified progressive explanations, deep same-page help
  and preserved learner work.
- PR297 merged as `9ca681eaa8a382d64565233f4da703bbbca4c258`, sole parent
  `bc322a30111d5a4178ba1a865c56ee1fbe85f03a`, exact reviewed tree
  `65a4d79ed1ee813059ff6f0a5f3e5e69331c65b7`; HIGH independent review PASS.
- Source catalogue:1056 numbered exercises,99 theory points,96 self-check
  questions and2 appendices. This does not mean every position is authored.
- Published: exercises1–35/52 cards, theory1–6/11 cards;195 justified steps,
  283 model views. All4 exact-head workflows and36 independent screenshot
  reviews passed. Cloud Chromium:126 card journeys,882 views,4746 labels,
  no overlaps/errors;8/8 expansion returns and2 real-tab recovery cases passed.
- Pages39672291645 succeeded on the exact merge. All14 public canonical/alias
  requests matched reviewed SHA256 and size. Gate:ATANASYAN_TEXTBOOK_FOUNDATION_OK.
- Remaining book content is explicitly pending; a source catalogue does not
  constitute authored solutions.
- Merzlyak and Pogorelov are separate later courses. Their uploaded PDFs were
  located on2026-10-23; their detailed10–11 courses are not yet authored. The
  recovered Atanasyan2024 PDF exactly matches the current source-catalogue hash.

## Published: standalone stereometry, task first

- PR296 merged as `bc322a30111d5a4178ba1a865c56ee1fbe85f03a`, sole parent
  `8378a4dda077742ecfc1ce9e4b24f465621429e8`, reviewed tree
  `0165adc7a87606f11e6de91c4cdc6e12dbaafa2f`.
- All3 exact-head workflows passed, including full profile compatibility;
  independent source/state review and40 actual screenshots passed.
- Pages39665605067 succeeded on the exact merge; all10 public canonical/alias
  requests returned200 and matched reviewed SHA256/size.
- Gate:STEREO_TASK_FIRST_OK. Existing39 units/38 task families/19 proof chains
  retain mathematics and saved progress; actual task models and optional help
  are visible/readable. Full textbook exercise coverage is not claimed.

## Published: profile and basic EGE task-first presentation

- PR295 merged as `8378a4dda077742ecfc1ce9e4b24f465621429e8`, sole parent
  `13b73619de97176789bc71d06617108aeb3d5994`, exact reviewed tree
  `b0d76c9bae8b7f010848a0df51554b07f63dd14a`.
- All five exact-head workflows passed, including unified classroom/container
  compatibility; independent source and12 actual screenshot reviews passed.
  Pages39659264220 succeeded on the exact merge; all30 canonical/versioned/entry
  public requests returned200 and matched reviewed hashes and sizes.
- Gate: EGE_2027_TASK_FIRST_OK. All68 existing profile families/408tasks and107
  base families use task-first help, retained drafts/models and honest assistance.
  Existing mathematical banks, shared school/exam boundaries and historical
  sources remain. Full FIPI/all legacy second-part coverage is not claimed.

## Published: OGE 2027 season labels

- PR294 merged as `13b73619de97176789bc71d06617108aeb3d5994`, parent
  `81712b878b7657f69b7d299f94c9adebb45fad55`, reviewed tree
  `25b4b5d6348bec4e0b6aa377126d0a954407661a`.
- All nine exact-head CI workflows passed. Pages39620236772 succeeded;
  all17 canonical/versioned public asset checks returned200 and matched reviewed
  SHA256 and sizes, including offline HTML and ZIP. Gate: OGE_2027_SEASON_OK.
- Active headings, copied results and catalogs use2027; actual source dates,
  mathematical engines and stored progress identity remain unchanged.

## Published: consistent exam-first OGE course

- PR293 merged as `81712b878b7657f69b7d299f94c9adebb45fad55`, parent
  `a006abab6ca2a0148c4b51739da0d5e080f39fe9`. All ten exact-head CI workflows
  passed; Pages run39589150975 succeeded. The preceding release verification
  matched all53 public assets and checked the course and tire quiz live.
- Existing task15 coverage remains one external-angle lesson, not a complete
  prototype bank.


- [Scope](tasks/OGE_COURSE_EXAM_VARIANTS.md): extend the continuous variant to
  seven remaining practical storylines; improve remaining first/second-part
  trainers with clear actions, contextual laboratories and saved reasoning.
  Geometry proofs must name the mathematical justification and offer verified
  Atanasyan/Merzlyak and official OGE reference material in place.

## Published: exam-like tire variant with persistent tables

- [Presentation principles](TRAINER_PRESENTATION_PRINCIPLES.md): the owner's
  revised task-first direction, initially implemented in the tire trainer.

- [Scope](tasks/TIRES_CLEAR_VERTICAL_FLOW.md): owner feedback on eleven
  screenshots, revised before publication: show the real tasks1–5 together,
  keep the 3D tire immediately visible and both tables continuously available,
  with a calculation pane beside the task stream and contextual question help.
  Preserve the tested dimension labels, sidewall terminology and enlarged text.

- PR292 merged as `a006abab6ca2a0148c4b51739da0d5e080f39fe9`, sole parent
  `606f629e40c9859a25551b735e9fc981f6345836`; reviewed tree
  `a701e97045cb875d2e28fbc70f66c445e7076ab8`. All 56 Node checks, 13 tire
  3D cases, 27 continuous-variant cases, 39 retained routes and 126 discovery
  cases passed. Independent source/math and actual mobile/desktop screenshot
  review passed. Pages run39532838450 succeeded on the exact merge; all11
  public changed files matched SHA256. Live visible model, five questions,
  persistent tables and contextual help were verified.

## Published: rotating 3D tire dimensions

- [Scope](tasks/TIRES_3D_DEMO.md): replace the misleading front-only wheel help
  with a rotating model that separates axial width B from radial height H and
  rim diameter. Original engines, learner drafts and grading remain protected.
- PR291 merged as606f629e40c9859a25551b735e9fc981f6345836, sole parent
  9f9638ab1a8728eb72e190825b665bc34cf43abe; reviewed tree
  128c28f42fb73a76b6b7331b2e347f8add216769. All53 Node,126 discovery,
  39 retained browser and13 tire interaction/offline cases passed. Independent
  code and final mobile/desktop screenshot review passed. Pages39522871613
  succeeded; all6 public files matched. Live rotation, dimension changes and
  retention after help collapse were verified.

## Published: task19 current sources and textbook references

- [Scope](tasks/TASK19_CURRENT_SOURCES.md): current FIPI access audit, supplied
  question coverage, new owner corrections, and optional verified textbook
  references for every assertion. Paid Claude use remains deferred.
- PR290 merged as `9f9638ab1a8728eb72e190825b665bc34cf43abe`, sole parent
  `6f42132355e0361f6bc54f0e4dacdc036b48b0e7`, exact reviewed tree
  `0a767ef70a668ae12611748f19ba8545b431a5d3`. All83 Node checks and final
  cloud runs39521820256/39521820264 passed. Independent source, mathematical
  and final320px visual reviews passed. Both author lines cover all234 cards;
  source coverage is467 entries. The current FIPI bank remained unavailable
  (503/timeouts); complete-bank coverage is explicitly not claimed.
- Exact-merge Pages run39522172914 succeeded. All17 public files matched their
  expected sizes and SHA256. Live source links, readable quotes and retained
  model state were verified. The subsequent tire release preserved the data.

## Published: outdoor context for the land identification lab

- [Scope](tasks/LAND_IDENTIFICATION_LAB.md): replace the indoor corridor example
  used by land matching with a garden/greenhouse containment discovery. Keep
  original engines and other map contexts unchanged.
- The required live smoke check found this mismatch after the verified release
  below. PR289 repaired the context and merged as
  `6f42132355e0361f6bc54f0e4dacdc036b48b0e7`; reviewed tree
  `dc1b312054601ab1c3651660574f0d7c7aba2bf5`, parent
  `647141dd168284ac1a399f0fdca8e7b6c82ba72b`. Final CI passed47 Node checks,
  126 discovery and39 retained browser cases plus122 course checks. Independent
  visual review passed at320/360px. Pages39515691350 succeeded; all18 public
  assets matched. Live wrong-choice recovery, reset and retained state passed.

## Published: tasks 1–5 interactive help across all eight storylines

- [Scope](tasks/OGE_1_5_INTERACTIVE_DISCOVERY.md): task-first screens, optional
  nested help on the same page, relevant interactive models, retained answer
  drafts and experiments. All eight existing storylines are covered: 57 final
  question paths and two tire-preparation states.
- Independent source/DOM review passed on implementation head
  `7bdc391328bae5fabeb01b1e95e360ea9fb5a99f`; all 46 Node checks passed.
  PR288 merged as `647141dd168284ac1a399f0fdca8e7b6c82ba72b`, sole parent
  `813fdcc129b27e71cc83ebaa80bd590cf1d1f1f1`, tree
  `bed58ee36920b8ad04acec7af822c546ed79e559`. Final cloud run39513466758
  passed47 Node checks,126 discovery cases and39 retained route/viewport cases;
  course, SEO, task19 regression and independent final visual review passed.
  Pages39514050862 succeeded; all18 expected public file hashes matched.
  The live check then found the land-model context mismatch tracked above.
- Task6 is a separate authorized release, recorded below. Paid Claude API use
  remains deferred by the owner.

## Published: task6 help inside every arithmetic step

- [Scope](tasks/TASK6_INTERACTIVE_HELP.md): optional same-page experiments for
  all 1,054 steps of the existing 174-task bank, covering 11 contextual families.
- Preserve unfinished main/step answers, accepted work, model settings and
  nested help on collapse and task navigation. Add visible previous-task and
  course links. Bank bytes, grading and session-only progress remain unchanged.
- Reviewed implementation head83e614726695d5f2b86beb2b16e299c0b5240d12 passed39
  Node/JSDOM checks and independent exact-result checks for all1,054 steps.
- PR287 merged as`813fdcc129b27e71cc83ebaa80bd590cf1d1f1f1`, sole parent
  `df63bacb2f82acf5f8543297c372b414925d6113`, reviewed tree
  `59ac827c1dca65393d118536f7dfeae5d853ae17`. All four final CI workflows
  passed, including unified run39510657209. Independent visual review passed
  after the direct-child CSS fix preserved straight fraction bars in power tiles.
  Pages run39512745128 succeeded. The public HTML returned HTTP200,148344 bytes,
  SHA256 `44ce6c8c70977007e9ea54a293ac2efe88ab32d1a2308f85a847989e9dc07f97`.
  Live verification preserved main and step drafts, model settings and an open
  explanation after help collapse, without awarding credit.
- Tasks1–5, all8 story types, remain a separate authorized workstream. Paid
  Claude API use remains deferred by the owner.

## Published: task19 owner feedback and analogous models

- [Scope](tasks/TASK19_OWNER_FEEDBACK.md): implement the owner's34 annotated
  examples, correct analogous geometric markings/controls, include genuine
  FIPI excerpts and identify untouched cards. Work remains cloud-only.
- PR286 merged normally asdf63bacb2f82acf5f8543297c372b414925d6113,
  parent43dc06bfa7bf503e3e9d455ced3ec05202b9e68e, reviewed tree
  abcf87a3576003fe1fed0fe07b04f2db5cbaebe5. No unexpected concurrent commit.
- Final task19 CI39508613716 passed both jobs and69 Node tests;150 owner-feedback
  and162 family states had zero out-of-bounds labels. SEO39508613665 and focused
  independent final review passed.
- Pages39509146258 succeeded on the exact merged commit. All 29 published
  runtime, reference PDF/image and offline HTML assets returned HTTP200 and
  matched the reviewed byte hashes.
- Public HTML: 4,952 bytes, SHA256
  10d92b60b242229f24649f32cfcc96f9567e8959d54e5c5598b0f52c0eb2af28.
  Core JavaScript: 36,985 bytes, SHA256
  33eabacb0be4c9a3ee378851d68af7192c5b111821ee3e666b67d4c74484dca9.
- Live browser verification exercised six linked sliders, their readouts and
  retained state after reload. Help did not grade an answer automatically.

## Published: task13 interactive laboratories for every prototype

- [Scope](tasks/TASK13_INTERACTIVE_HELP.md): extend the existing minimal
  inequality trainer with task-specific laboratories for all 26 current tasks
  across five families. Connect parabola signs and intervals, exact boundaries,
  signed-term movement, denominator-free linear transformations and systems.
- Preserve the original bank and grading. Help stays on the same page, with
  optional deeper actions and retained experiments/answer drafts.
- Improve adaptive plot scales and mobile readability. This is the current
  26-task bank, not the older unexecuted generator/registry plan or a claim of
  complete FIPI coverage. Claude API remains deferred by owner decision.

- PR285 merged normally as43dc06bfa7bf503e3e9d455ced3ec05202b9e68e,
  parent39c63a63602cd7ae275e76ed647057c2793f576f, reviewed tree
  b55c883e836c1e05ebf18907490e8664f27193d3. No base drift.
- All25 Node tests,230 navigation links and independent mathematical/state checks
  passed. Browser39499969166 covered all26 tasks at1280/360px and7 at320px;
  course39499969186 andSEO39499969091 passed. Pages39500578087 succeeded.
- Published HTML matched81031bytes /SHA256
  8be725fefd0700c7c44f344d5b933da3e5ece40599c0f5752a75c024f22c1975.
  Live exact−6/7 boundary, filledroot, keyboard sign experiment and retained drafts
  were verified. Opening help did not grant automatic credit.

## Published: task9 interactive help for every equation family

- [Scope](tasks/TASK9_ALL_INTERACTIVE_HELP.md): make signed-term transfer
  available when help is requested across all bank and generated equation
  families, preserving brackets, products, fractions and the original domain.
- Keep completed-step cards usable for exploration while preserving accepted
  answers and progress. Add optional task-specific discovery models for the
  other equation actions; generated tasks also start with a task and help button.
- The owner explicitly asks for every linear and other task9 type. Trial-signup
  trainer selection remains open; paid Claude API use remains deferred.

- PR284 merged normally as39c63a63602cd7ae275e76ed647057c2793f576f,
  parent03a6d465416703fcc72a7ce471afb2ad2f3031fd, reviewed tree
  de9ae2204e4b6721b7784a6f90b448dfb4af5f47. No base drift.
- Final31 task9 learner tests and668 algebra contracts passed. Browser
  39495355691 covered all16 bank families,14 visible generator routes,
  eight discovery kinds and320/360/1280px; no JS errors. Retained-action,
  course andSEO workflows also passed; Pages39495981513 succeeded.
- Public HTML returned200 and matched257637bytes /SHA256
  1cc58b1f301afb134c32acb281a9a710ee65c27db51d713ed904cc2fb20a818c.
  Live next-task transfer, accepted-step cards, compound fractions, conditional
  root labels and retained denominator experiments were verified.

## Published: clear learner actions and return paths

- [Scope](tasks/CLEAR_LEARNER_ACTIONS.md): clarify expected inputs and return
  paths in the percentage trainer; add real signed-term movement to the №9
  canonical linear-equation help using the existing manipulative.
- General authoring rule: every input explains what to find, what to enter and
  the next action; help returns to the same task without erasing work.
- The owner has not selected the trainer for trial-lesson signup.
- PR283 merged normally as03a6d465416703fcc72a7ce471afb2ad2f3031fd,
  parentbc392890a67ec594abed7c6a95b39402962830ec, reviewed tree
  7e8c28cf7c3ceba3210acb1929d4b2645ec1a37b. No base drift.
- Focused24 learner tests, existing UI/practical gates,668 algebra contracts,
  3500 independent percentage calculations and independent review passed.
  Browser39490572190, course39490572173 andSEO39490572128 passed;
  Pages39491135384 succeeded on the exact merged commit.
- Both public pages returned200 and matched reviewed bytes. Live transfer,
  reverse movement, retained drafts and percentage return paths were verified.
  At this release transfer covered84/135 bank tasks, including60/105 prototypes;
  the next scope above closes the remaining-family and completed-step gaps.

## Published: task11 visual mnemonics and vertex guidance

- [Scope](tasks/TASK11_VISUAL_MNEMONICS.md): happy/sad smileys, sign-first
  vertex guidance with deeper exact-coordinate steps/FIPI link, a precise
  x versus x+2 denominator comparison and sourced Dalí portrait/biography.
- PR282 merged asbc392890a67ec594abed7c6a95b39402962830ec, parent
  da13ca38669bb648e80bc78dc4b8b3f42e6df8c1, reviewed tree
  88520215c63e01a9be9a6b556023fb8c78462922. No base drift.
- All26 Node tests and668 algebra contracts passed; independent review passed.
  Task11 CI39487423942, course39487423958 andSEO39487423971 passed.
  Browser journeys covered320/360/1280px, retained answers and offline HTML.
- Pages39488143750 succeeded on the merged SHA. Public HTML returned200 and
  matched336442bytes /SHA256
  204a62919de903f531a5ed71292d5bdb66c7ce56ac69a6b618f53320dbefec2f.
  Live smile/vertex-side model and same-page help reopening verified.
- Read-only board audit confirmed durable learning service, up to8students,
  switching and control transfer in deployed code. New public №11/№19/rounding
  pages still lack synchronization bridges; no live pupil sessions were opened.
- Public course, base course and №9 were checked. №9 has task-first optional
  steps but its next requested improvement is actual term manipulation.

## Published: task11 inline help

- The owner asks for help on the same page, because the modal covers the task.
- [Scope](tasks/TASK11_INLINE_HELP.md): expand the existing interactive model
  immediately below the selected function, keep answers accessible and preserve
  independent experiments and deeper help. No mathematics or backend changes.
- PR281 merged asda13ca38669bb648e80bc78dc4b8b3f42e6df8c1, parent
  6ea58439e0628b76cf98b7263a598347f96fe83e, reviewed tree
  eae20f31e977d38af642b32585c3fbaded1d15d9. No base drift.
- All20 Node tests and668 algebra contracts passed; independent review passed.
  Task11 browser CI39483305659 (320/360/1280px), course39483305685 andSEO
  39483305829 passed. Pages39483927685 succeeded on the merged commit.
- Public HTML returned200 and matched167189bytes /SHA256
  f20d85976e6134393a30293607c128ffd66276ebaabbb406ac5569ac7791621d.
  Live answer entry with inline help open, model movement, collapse/reopen and
  retained answers/experiments were verified. No account or backend writes.

## Published: task11 visual discovery and help inside help

- Owner requests a public trainer that demonstrates a useful first success
  without requiring arithmetic. Every function gets its own interactive help,
  then an optional observation and a deeper visual highlight.
- Scope: [task11 discovery](tasks/TASK11_VISUAL_DISCOVERY.md), existing matching
  page, focused tests and workflow. Three graphs and three functions remain;
  opening help preserves choices and never grades automatically.
- First ordinary visit starts with three distinct shapes. Each function keeps
  an independent experiment; changed formulas are labelled and can be reset.
- PR280 merged as6ea58439e0628b76cf98b7263a598347f96fe83e, parent
  3c17e78bc738a58d94ef340fef17242d679871aa, reviewed tree
  04bd175a6ce4b9bc66be5d675dedd436d3d3732a. No base drift.
- All19 learner/math tests,668 algebra contracts and independent review passed.
  Task11 CI39480657557, course compatibility39480657533 andSEO39480657579
  passed. Pages39481294904 succeeded on the merged commit.
- Public HTML returned200;167383bytes andSHA256
  1d00e44942f06e8380b30daa1367e2f30866250b954470641c80e2bd09ca3f5c
  match reviewed source. Live controls, nested help, reset and retained choices
  were verified; desktop/mobile screenshots inspected.
- The owner deferred Claude API use until a difficult creative question arises.
  No provider call, billing change or external approval is claimed.
- Closing the full working course is a future separately scoped task. Public
  standalone trainers remain available; no account/access policy changes here.

## Published: task19 interactive discoveries

- PR279 merged normally as3c17e78bc738a58d94ef340fef17242d679871aa;
  parent923c326dc08918c75a8ac26279c4b094a5d0c68c, reviewed tree
  005e814480244895c25145d118fe163b155c64fd. No base drift.
- All233 active hints have constrained geometric controls and optional
  measurements. Original assertion text, truths, IDs and source audit remain.
- Exact-head53 tests and all233 browser journeys passed;38 used families at
  320/360/1280px,176 label states with0 out-of-viewBox labels. Independent
  geometry/state and pedagogical review passed; all38 family screenshots were
  inspected. Three scale-only equilateral models now visibly scale linearly.
- CI39479183994 and SEO39479184129 passed. Pages39479619833 succeeded;
  all13 public assets returned200 and matched source SHA-256. Live median
  movement, measurements and retained state after reload were verified.
- Owner instruction at2026-10-21T01:36:59+07:00 deferred Claude API use.
  No provider approval is claimed; no backend or learner-account change.

## Published: basic OGE task-first course and nested help

- PR278 published as923c326dc08918c75a8ac26279c4b094a5d0c68c, parent59ca8d215312831a21494e3b67099b30b1e6013d.
  Tree de9c1094e8541597b949bfe5c80abd69403eea58 matches the reviewed result.
- All six technical workflows passed on exact head1d727f769849eacaf2b93f0ac3e639b0acef8d9d;
  Pages39474344117 succeeded. All50 changed public assets returned200 and
  matched source SHA-256, with no mismatches.
- The70 basic routes retain the35-source bank and arithmetic contracts.
  Optional contextual help leads to26 prerequisite microtasks, with a tested
  six-level path and retained drafts, accepted steps and model actions.
- Live percentage practice starts with a task and nearby help. Two deeper
  prerequisite steps and return preserved parent/child drafts; interactive
  chip placement worked. The published screen was visually inspected.
- Amvera anonymous status is healthy and its trainer origin is mathexam.space;
  cabinet trainer frame bytes match. No account writes or Amvera rebuild.
- Claude request39462468886 failed for insufficient credits. The owner
  explicitly waived final review for PR278 at2026-10-21T01:01:34+07:00. The
  narrow owner-waiver workflow guard skipped the external job without another
  paid call. No external approval is claimed and no future waiver is implied.
- No base drift, migration, rollback or further owner decision for PR278.

## Agreed workflow: Claude consultation for trainer design

- Owner confirmed on 2026-10-20 that substantial trainer work should include a
  Claude discussion before implementation and a review of the ready result.
- [Active workflow](TRAINER_CLAUDE_CONSULTATION.md) records the brief, teaching
  constraints, evidence and unavailable-API handling. Mechanical fixes are not
  subject to mandatory paid consultation.
- This is a documentation change; a general design-chat runner was not added.
  The existing OGE runner remains a scoped completed-patch reviewer.
- Last observed external request failed for insufficient provider credits.
  No new consultation or paid request was made in this task.
- Next: restore usable authorized API access; use the brief at the next
  substantial trainer task; keep design findings and release review separate.

## Published: whole existing OGE course, minimal interface

- Task6 PR274 is published as `1bee66162fe76c5cd11b2860cd73c7a9706fb889`.
  Exact-head task6/SEO/learning checks and Pages39440749856 passed. Live HTML
  matches117138 bytes; optional help and retained accepted steps were exercised.
- Task11 PR273 and task19 PR271/272 remain the published style references.
- The owner authorizes rebuilding and publishing the existing whole OGE route
  in the cloud. [Current scope](tasks/OGE_COURSE_MINIMAL.md) is HIGH:
  main lines1–25, practical1–5 family, the existing full author variant, two hubs
  and four directly linked foundation trainers. Task6/11/19 retain their releases.
- Initial integrated groups passed110 DOM scenarios; existing algebra668 and
  geometry1873 checks pass. Independent cross-review fixed concrete provenance,
  input, contextual-help and essential-condition defects. Rounding download and
  archive match the updated canonical implementation.
- Task15 remains honestly labelled as one external-angle lesson. The separate
  PredOGE course stays linked; it is not claimed as rebuilt in this release.
- First cloud browser gates passed algebra, geometry, part2 and special routes.
  External review found one confirmed task10 disclosure defect, now fixed; two
  provenance reports were rebutted with exact code and reproducible tests.
  Actual screenshots prompted contrast/diagram fixes. Existing robots now open
  disclosures through visible controls; final exact-head results follow below.
- PR275 was published as `e1f008f2745b9ff6228f4b9fe97e3bb5ebf4048f`. Its parent
  equals the checked base `1bee66162fe76c5cd11b2860cd73c7a9706fb889`; its tree
  equals the reviewed `1bb24b3f305c65581d9d3cda22b14dee925ddefb`.
- Final technical checks passed: 122 integrated DOM scenarios; all seven browser
  groups; 668 algebra and 1873 geometry contracts; arithmetic robots: 22 scenarios
  and 470 steps; 228 navigation links; Unified Learning, EGE, PreOGE and SEO CI.
- Pages 39451729801 succeeded. All 41 changed public assets matched source bytes.
  Live course navigation and task25 hint open/close with retained input passed.
  Cabinet health confirmed registry and durable progress storage ready.
- Final external review was unavailable because the provider reported
  insufficient credits. The owner explicitly accepted this release without
  repeat review at 2026-10-20T22:45:37+07:00; provenance is recorded in PR275.
  No final Claude approval is claimed. This exception is specific to PR275.

## Current task: task11 matching and optional laboratory

- Task19 corpus PR271 is published as `83c06b3bd0d0ea050080c4fef0dc911c1222c309`.
  Its exact-head Node/SEO/browser CI and Pages39427754132 passed;14 public
  files matched and the live interface showed233 cards. All178 recovered
  entries and106 reference entries are mapped; exhaustive official FIPI
  coverage remains unverified because the official bank returned HTTP503.
- Follow-up PR272 (`46d308df7448c61abc282c69f128975c41285fac`) repairs the
  previous-modes archive link found during live verification.15 Node tests and
  cloud workflows39428479109/39428478914 passed; the reviewed tree and parent
  match. Final link/deployment verification follows this release.
- Cabinet health and durable learning storage were healthy after restart.
- The owner requests the same minimal style for task11: three graphs and
  three functions, with an optional interactive laboratory. Cloud work and
  publication are explicitly authorized. [Scope](tasks/TASK11_MINIMAL_HINT_LAB_20261020.md), MEDIUM.
-11 learner/math tests and the668-check algebra gate pass. Independent
  review covered500 generated tasks and9,141 lab combinations. A missing
  visible quadratic formula in the signs topic was corrected and regression
  tested. Existing progress, repeat-errors and exam contracts are retained.
- Next: exact-head mobile/desktop browser CI, publish and verify the live
  matching screen, optional laboratory and downloadable HTML.

## Current task: task19 terminology and source coverage

- PR270 is published as `763e89aedbd561054e3860016bb999ef6aa15b19`.
  Task19 and SEO cloud checks, Pages39423226004 and all9 public file comparisons
  passed. Both public URLs and the cabinet link open the minimal visual-hint UI.
  Cabinet storage is available and durable; final gate TASK19_VISUAL_HINTS_OK.
- The owner requests ordinary school language and recovery/completeness checking
  of the summer assertion bank. [Scope](tasks/TASK19_CORPUS_COVERAGE.md), MEDIUM.
- Recovered June12 source:178 authored/previous assertions, not an official FIPI
  export. Compare every entry and available external reference; retain explicit
  limits where the current official bank cannot be enumerated.
- Next: finish hints and independent review, run coverage/browser checks, publish
  and verify. Existing cloud/publication authorization applies.
- Subsequent explicit owner task: redesign task11 in the same minimal style with
  three graphs/functions and an optional interactive lab; publish separately.

## Current follow-up: visible arithmetic and practice retests

- PR266 is published as `dd87b765ac85b4d00bdc6fd589966b75feb2f5aa`.
  Four exact-head PR workflows and Pages39272778692 passed. All18 checked
  public/cabinet assets matched; durable learning storage was healthy.
- The owner requests immediate written digits, simple "в уме" wording, a return
  to diagnostics after practice, and horizontal fraction bars in path trainers.
  [Scope](tasks/ARITHMETIC_VISIBLE_STEPS.md), MEDIUM. Publication is explicitly
  authorized in the current conversation; existing pupil work stays intact.
- Next: verify accepted-step replay and retest journeys; review exact-head
  cloud checks and mobile fraction screenshots; publish and verify both hosts.

## Current task: rounding before estimation

- PR264 is published as `cf3b55bdbb338ac27f7dfb4b14bf4fb824a3aecb`.
  The reviewed tree and merge parent matched; all eight exact-head workflows
  and Pages39183528548 passed. 89 public/cabinet asset responses matched, durable
  storage was healthy and the live routes and public trainer were verified.
- The owner requests Claude's existing stepwise rounding trainer immediately
  before estimation, with explicit tens, hundreds and larger-place practice.
  Cloud completion and publication are explicitly authorized in this task.
- [Approved scope](tasks/ROUNDING_BEFORE_ESTIMATION.md), MEDIUM. Existing cabinet
  attempts/progress remain intact; separate rounding practice is clearly labelled.
- Next three actions: verify the trainer and both routes; review exact-head
  checks and publish the authorized PR; verify deployment and live navigation.

## Completed task: arithmetic learner robots and continuous practice

- PR263 is published as `7183175263bfc11ff475220776d08243bb82abbd`.
  Its parent and composed tree matched the reviewed release. Seven exact-head
  workflows and Pages39179333287 passed;77 public and7 cabinet runtime files
  matched production. Durable learning storage and live UI were verified.
- The owner requests synthetic pupils with different multiplication/division
  difficulties, trials on both routes, evidence-driven fixes and publication
  while she is away. Every trainer must offer ongoing varied practice.
  [Approved scope](tasks/ARITHMETIC_LEARNER_ROBOTS.md), MEDIUM.
- Eleven synthetic pupil profiles passed22 comparable scenarios after fixes:
  specific feedback and non-answer first hints improved from2/22 and1/22
  respectively to22/22. Current generated conditions also pass22/22; this is
  interface regression evidence, not a measurement of human learning.
- Bounded generation, legacy replay, public continuation and help fixes are
  implemented. The118 linked URLs have an explicit practice inventory.
- Next: finish the independent review and exact-head cloud browser checks;
  publish the authorized release; verify deployment and live public/cabinet UI.
- Earlier snapshots below describe preceding work, not outstanding permission.

## Current refinement: complete multiplication practice

- PR261 is published at `5c61b0bc12ad9aaebfdb8484cc9987bccb59474a`.
  Its parent and full reviewed tree matched the authorized release. Seven
  exact-head CI workflows and Pages39176065477 passed.
- All83 changed runtime asset responses matched the reviewed files on Pages
  and Amvera. Durable learning storage was healthy. Public and teacher routes
  showed two independent tracks; public column input survived reload.
- The owner requests «в уме», more column sizes and examples, the full existing
  multiplication collection in its route, and contextual links from division.
  Scope: [Complete multiplication practice](tasks/MULTIPLICATION_COMPLETE_ROUTE.md).
- Next: validate old saved work and expanded arithmetic; review the Draft PR
  and exact-head CI; obtain the separate publication decision.

- Concurrent PR262 was merged as `e936db700cd2f435347acbb4e1dd57fb89b7eb82` while this task was being reviewed. Its changes are the static division
  guide, sitemap and documentation; trainer runtime is unchanged. The search
  discovery snapshot below is retained from that concurrent change.

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## Current task: search discovery for division

- PR261 is merged at `5c61b0bc12ad9aaebfdb8484cc9987bccb59474a`.
  Its release record confirms the reviewed tree, seven exact-head CI workflows,
  Pages39176065477 and 83/83 production asset comparisons. This reconciliation
  uses that recorded evidence; it does not claim new learner-flow verification.
- The owner approved the first topic-discovery improvement: the existing
  division explanation, the common «деление столбиком» name and quotient
  estimation. [Scope](tasks/SEO_DIVISION_ESTIMATION_20261019.md), SMALL.
- Wordstat returned relevant explanation and trainer phrases; displayed data
  have a service warning and do not predict this site's traffic.
- Next three actions: complete the focused page and checks; review its Draft
  PR and obtain the separate publication decision; after publication request
  a recrawl and measure query impressions and clicks for this exact URL.
- Earlier snapshots below are historical, not current open work.

## Earlier refinement: assemble photo proofs without writing

- PR 254 merged with owner authorization as
  `dd386d069d6911be6e6d23948149fd78d245f2e3`. Parent, full tree and stable patch
  identity matched; all four exact-head checks and Pages deployment passed.
- All seven changed runtime files matched on Pages; the three exposed on
  Amvera also matched. Live teacher-observer acceptance showed the new flow at
  saved step 5/6, with 20px controls, 24px questions and no horizontal overflow.
  Health and durable learning storage were available; no pupil work was changed.
- The owner asks to remove the final writing screen: only assemble the six
  steps. [This correction](tasks/PHOTO_PROOF_STEPS_ONLY.md) ends at the complete
  argument and handles attempts saved on the former screen without data loss.
- Next three actions: check old-state restoration and completion; prepare the
  focused Draft PR; obtain separate release authorization and verify rollout.

## Completed refinement: a clear guided photo proof

- PR 253 merged as `fadaa6b000afa525af64b1c04318a69f720f9f7d` with owner
  authorization. All exact-head checks and Pages deployment passed. Both changed
  assets matched on Pages and Amvera; live desktop labels/buttons were 20px,
  helper text 18px and arrows 26px, with healthy durable learning service.
- The owner then identified confusing proof wording and excessive interface
  choices. [The focused redesign](tasks/CLEAR_PHOTO_PROOF.md) replaces the three
  photo exercises' five-mode interface with one drawing, one question and an
  accumulating argument. AC is explicitly called the common side.
- Existing tasks and answer values are retained; the new presentation also
  applies to saved attempts. No pupil work is reset.
- Released through PR 254 as recorded above.

## Current refinement: readable drawing controls

- PR 252 merged with owner authorization as
  `6f3b971003ad7ab42027dbac8b5326a3c4434c23`. Reviewed tree, parent and patch
  identity matched; exact-head cloud CI and Pages 38978036100 passed.
- Amvera's renderer now returns HTTP 200. All 45 cabinet entry resources match
  the release; health and durable storage are available. Desktop browser
  checks verified the inline drawing in both route starts and photo-proof
  zoom, highlight, button movement, mouse drag and reset.
- New owner screenshot identifies small labels and helper text below the
  drawing. [Scoped readability fix](tasks/ASSIGNMENT_GEOMETRY_READABILITY.md)
  enlarges these controls and improves text contrast.
- Next three actions: validate the scoped CSS; publish the reviewed corrective
  PR for release authorization; verify live readability after deployment.

## Completed correction: inline assignment drawing resource

- PR 251 merged with owner authorization as
  `c102cee9b7c98c74c30384bfce0ccdd1568b25c2`; parent, full tree and stable
  patch identity matched the reviewed release. All three exact-head CI workflows
  and Pages deployment 38975860479 passed.
- All four changed learning assets matched the release on both Pages and Amvera.
  Amvera restarted at 2026-10-16 22:29:14 UTC and its health and durable learning
  storage endpoints were healthy. This release reached Amvera automatically;
  manual upload of those four files is not needed.
- Initial production verification found the renderer URL returning HTTP 404. Its file
  is bundled but missing from the server's static allowlist, so the inline
  drawing fell back. This was resolved by PR 252 as recorded above.
- [Correction](tasks/ASSIGNMENT_GEOMETRY_ASSET.md): add the one existing renderer
  path and verify every script/style actually requested by the cabinet.
- The corrective release and live desktop acceptance are complete. Physical
  touch on a phone remains untested. No pupil/account changes were required.

## Published baseline: two geometry routes and active practice

- PR [249](https://github.com/ladynata-cloud/math-exam-fipi/pull/249), including
  the full-course work from PR 248, is merged on production `main` at
  `bde7cd1279baf292a206e5ef70abfd98a3e2b825`.
- On 2026-10-16 the public workbook page and interactive lesson were opened:
  103 workbook lessons in 17 sections are reachable. The separate proof route
  in the cabinet source keeps photo problems 1/3 (SAS) and 2 (SSS).
- [Coverage map](reports/GRADE7_GEOMETRY_ACTIVE_PRACTICE.md) accounts for 73
  numbered exercise groups, not an exhaustive audit of every subitem/key.
- [Student-journey scope](tasks/GRADE7_GEOMETRY_STUDENT_JOURNEYS.md) prepares clearer
  starts, named milestones, honest progress and a less crowded workshop. These
  follow-up changes are published by PR [250](https://github.com/ladynata-cloud/math-exam-fipi/pull/250)
  at `f123b4cb60894ba2efaed396b61e38b30a0e1f73`; the recovery session
  verified the corresponding live Amvera learning assets.
- Cabinet assets come from the Amvera container; updating public assets alone
  does not update the cabinet. Final deployment needs separate verification.
- Retain existing task IDs, catalog and loaders when correcting or rolling back
  UI: removing them would make previously saved attempts unavailable.

## Prepared separately: Soviet topic 61, logo and video-factory check

- Draft PR 247 remains separate at head
  `8c1693f860bd97106b26cc97d9bcd065cb9b0b5a`.
- Content/UI checks passed. The final worker integration check stopped before
  rendering because the CI sandbox helper did not have its required mode.
  No passing production render or successful factory restoration is inferred.
- No merge or deployment of that PR has occurred; this task leaves it intact.

## Published: Amvera endpoint recovery after hosting outage

- [Scope](tasks/AMVERA_ENDPOINT_RECOVERY_20261015.md); base
  `7397baf0ebe2b36c8263229117ae5fe44ddf2d45`; MEDIUM frontend recovery.
- PR 246 was merged by the owner as
  `e01b2780f16f9771defee5d862eec6de581a554f`. Its parent and full tree matched
  the reviewed release; Pages run 38628033755 succeeded on the merge commit.
- The public cabinet link opened the restored teacher service at
  `mathexam-board-ladynata.msk1.amvera.tech`. Both Amvera applications were
  observed running 1/1; three existing videos played successfully.
- New authenticated production rendering remains unverified. Running
  containers and existing media playback do not prove the video factory works.

## Merged: Soviet mathematics pedagogical revision and second batch

- [Scope](tasks/SOVIET_MATH_BATCH_TWO.md); base
  `b0b2fe8e4d2cbf15426a9a314674bf7a2edce4f9`; branch
  `feat/soviet-math-batch-two`; HIGH independent review of local progress migration.
- Add 30 trainers and 30 silent videos, taking the course to 60 topics.
  Redo the first thirty lessons and recordings after the owner rejected their
  pedagogy; preserve topic IDs and URLs, prior results and legacy attempts.
- New mental arithmetic, further fractions, decimals and quantities; sources,
  exact answers, cumulative board, downloadable narration scripts.
- All 60 lessons and silent MP4s are recorded: 54 minutes 30 seconds in total.
  Local arithmetic, content, narration, renderer and browser checks passed.
- PR #240 merged as `89e61f80b56f9c3344ee96fbaff7946c90b251bd` after all five
  final-head CI workflows succeeded. Follow that PR for course-specific
  production verification; this Google follow-up preserves its course blobs.

## In progress: owner-provided Google verification

- [Scope](tasks/SEO_GOOGLE_VERIFICATION_20261011.md); base
  `89e61f80b56f9c3344ee96fbaff7946c90b251bd`; branch
  `feat/seo-google-verification-20261011`; SMALL focused independent review.
- The owner supplied the complete Google Search Console meta tag for the
  `https://mathexam.space/` URL-prefix property. Publish it in the homepage
  head, preserve the verified Yandex tag, and check its live presence.
- Google service-side confirmation and sitemap submission remain pending.
  Preserve the complete homepage, learner/account behavior and existing SEO.

## Confirmed: Yandex ownership and sitemap submission

- [Scope](tasks/SEO_SEARCH_VERIFICATION_20261011.md); PR #239 merged as
  `388accb4dd067a621f90fd1066823412a28bfd88` after SEO and EGE base CI passed.
- Pages run 38082856663 succeeded. The live homepage matched the release byte
  for byte and contained exactly one owner-supplied Yandex tag inside `head`.
- The owner's screenshot shows role `Owner`, verification date 2026-10-11.
  A subsequent screenshot shows `https://mathexam.space/sitemap.xml` added to
  the processing queue. Processing results and search indexing are not yet
  verified; no private search-performance data has been read.

## Merged: public SEO and topic discovery

- PR #238 merged as `a51f188b74ccd781622e3e94b3a419f895ca9c73`; retain its public metadata, topic guides and sitemap gates.
- [Scope](tasks/SEO_DISCOVERY_20261011.md); base
  `b0b2fe8e4d2cbf15426a9a314674bf7a2edce4f9`; branch
  `feat/seo-discovery-20261011`; MEDIUM focused independent internal review.
- Initial source/live reconciliation found robots and sitemap returning HTTP
  200; the former 244-URL sitemap missed current public entrances. The published
  generated sitemap now contains 513 public canonical URLs.
- Metadata for 24 entrances, five static worked explanations plus their
  directory, and repeatable public sitemap/exclusion checks.
- Preserve learner runtimes, accounts, stable book URLs and existing noindex.
  Search-account verification progress is recorded in the sections above.
- Checked publication follows the standing owner instruction. PR/release
  evidence records completion; no unrelated active branch is updated.

## Published: Mathematics from Soviet textbooks first batch

- PR #237 merged as `b0b2fe8e4d2cbf15426a9a314674bf7a2edce4f9`.
- 30 trainers and 30 silent MP4s; all four exact-head CI workflows passed.
- Pages run 38078578356 passed; live verification matched 42 files including
  all 30 MP4s, and checked practice, source attribution and actual playback.
- Stable IDs and append-only media preserve earlier material. Browser progress
  remains local and is not represented as cloud account synchronization.

## Published: OGE arithmetic support after a struggling-learner simulation

- [Scope](tasks/OGE_ARITHMETIC_SCAFFOLDING.md); base
  `3759b4646ea19d2790d3b5f84eaadb2c01f762a1`; branch
  `feat/oge-arithmetic-scaffolding`; HIGH independent internal review.
- Exercise the OGE/pass route with a local synthetic learner who makes
  multiplication, decimal and long-division mistakes; improve concrete help
  in the managed trainer. Simulation findings are not real learner outcomes.
- Preserve saved task generation/state, actual pupil data, all account entry
  assets and credentials. Use existing help accounting and mirror controls.
- PR #236 is merged as `28ca6887702748243cc99f50edeb470a987f802d`.
  Its release checks are recorded in that PR; this task does not infer new
  verification of the existing account flows.

## Published: readable profile captions and help links

- [Scope](tasks/PROFILE_READABLE_HELP.md); base
  `92bd34a6163b2115c940a76ba08160cd270dcceb`; branch
  `fix/profile-readable-help`; MEDIUM focused UI review.
- Enlarge small course captions and make both help-status messages navigate to
  the actual current explanation without losing the task, draft or open steps.
- Unified course PR #233 is published at
  `92bd34a6163b2115c940a76ba08160cd270dcceb`. Exact-head Profile CI
  38044542147 and logarithmic inequalities CI 38044542160 passed; Pages run
  38044855461 succeeded. Live menu 1–13/16 and school-help return were verified.
- Existing cabinet/authentication work remains outside this task. Release
  evidence and any verification limits are recorded in the PR.

- PR #235 merged as `3759b4646ea19d2790d3b5f84eaadb2c01f762a1` on composed
  base `731a6b747728a8507e3b66aa498336f4f677b8f2`. Exact-head Profile
  38046985762 and logarithmic 38046985770 checks passed; Pages 38047377965
  succeeded. Its PR records tree identity and live draft/help/focus retention.
  Public asset byte comparison was not run in that release.

## Published: one permanent parent link and one code field

- [Scope](tasks/PARENT_LINK_CODE_ONLY.md); base
  `92bd34a6163b2115c940a76ba08160cd270dcceb`; branch
  `fix/parent-link-code-only`; HIGH independent internal review.
- The owner requests a parent-facing flow with only a permanent personal link
  and a manually entered code. Hide the account identifier and remove unrelated
  choices from this route; preserve return after reload/logout.
- Ready teacher messages contain the personal link and code. Existing links,
  account/session boundaries and legacy login compatibility remain supported.
- No backend, schema or real credential changes. Checked publication remains
  authorized under the standing owner instruction and external-review waiver.

- PR #234 merged as `731a6b747728a8507e3b66aa498336f4f677b8f2`;
  independent HIGH review and exact-head Learning 38045917072 / Navigation
  38045917101 checks passed. Pages 38046506148 succeeded; all ten changed
  assets matched on both hosts at 10:55:50 UTC. Amvera health/storage and the
  retained teacher session were checked after its ordinary rollout. No actual
  parent credential was issued or changed during verification.

## Published: unified profile course menu

- [Scope](tasks/PROFILE_UNIFIED_COURSE.md); base
  `f2a8ba0c6b721446209b4e1c3b83134733f3036d`; branch
  `feat/profile-unified-course`; MEDIUM public-navigation review.
- One exam-first menu for positions 1–13 and 16. Existing topic trainers are
  grouped inside numbered topics, with optional targeted school help and return
  to the still-mounted task. Separate trainer score stores are not merged.
- Existing cabinet/authentication work is outside scope. Source/runtime evidence
  for this release is recorded in its PR, including exact-head CI and Pages.
- Previous profile step-by-step task PR #229 is published as
  `bdf2519d10b03e1c2d77a379a78a21ce2e196f99`; profile CI 38024794757 and
  Pages 38025132684 passed, with seven public asset comparisons and the live
  nine-step similarity example verified on 2026-10-10.

- PR #233 merged as `92bd34a6163b2115c940a76ba08160cd270dcceb`, parent
  `cee6bd214de94852676ea90283e190316700b237`; reviewed composed tree
  `15736a13ae36e910d64c5084c5d13142ed204f3e`. Its PR records exact-head
  profile CI 38044542147, logarithmic CI 38044542160 and Pages 38044855461
  passing, plus the live menu/help/return checks. Direct public byte comparison
  was not completed in that task; no such verification is inferred here.

## Published: ready parent entry and visible login feedback

- [Scope](tasks/SIMPLE_PARENT_ENTRY.md); base
  `f2a8ba0c6b721446209b4e1c3b83134733f3036d`; branch
  `feat/simple-parent-entry`. HIGH independent internal review under the
  existing checked-publication instruction and external-review waiver.
- Ready four-digit parent codes are the primary teacher provisioning flow.
  Parents use their own login-prefilled link and code with no activation step.
- Teacher, pupil and parent login show three animated dots and “Входим…”
  through the initial cabinet load. Keep role, session and learning boundaries.
- The owner also requested a separate practice pupil with the same course,
  goal and start as an existing pupil. Configure through the private teacher
  interface; no real pupil identifiers or credentials are included in Git.
- PR #232 merged as `cee6bd214de94852676ea90283e190316700b237`; parent
  `f2a8ba0c6b721446209b4e1c3b83134733f3036d` and reviewed tree
  `c76453e4c68c87c0d5cd5ea704510a866e95a4a2` verified. Backend 281/281,
  eight browser gates, independent HIGH review and exact-head learning CI
  38043639279/navigation CI 38043639289 passed. Pages 38044221483 passed;
  all 12 changed live asset comparisons matched at 10:19:32 UTC. Amvera
  health/storage and the retained teacher session were verified after its
  ordinary rollout. Requested practice-pupil settings survived full reload.

## Published: clear code-save feedback

- [Scope](tasks/CODE_SAVE_FEEDBACK.md); base
  `0081ce7b52db04be20a70ab6653b4f00d4679025`; branch
  `fix/code-save-feedback`. HIGH independent internal review.
- The owner reports the new-code form remains after entering four digits.
  The screenshot shows a transport error and an unconfirmed save, not a
  confirmed success. Separate this outcome from another code-creation prompt.
- Code settings become an overview with explicit editing. An uncertain save
  hides inputs and offers the cabinet or an explicit same-code retry. No real
  credentials, backend contracts or learning data change.
- PR #231 merged as `f2a8ba0c6b721446209b4e1c3b83134733f3036d`, reviewed
  tree `42c81f4e686fb23268ab1d66547c884cea8fcb17`. Focused browser gates,
  independent HIGH review, learning CI 38032040830 and navigation CI
  38032040839 passed; full backend checks passed 269/269. Pages run
  38032570811 passed. All four changed public/cabinet asset checks matched
  at 06:57:56 UTC. Amvera health/storage and the existing teacher session
  were verified without a manual restart or any credential change.

## Published: four-digit codes and completed setup

- [Scope](tasks/FOUR_DIGIT_CABINET_CODES.md); base
  `bdf2519d10b03e1c2d77a379a78a21ce2e196f99`; branch
  `fix/four-digit-cabinet-codes`. HIGH independent internal review.
- Owner requests four digits for teacher, pupil and parent, and no repeated
  change-password prompt after a successful save. This explicitly supersedes
  previous minimum lengths while keeping existing long login credentials valid.
- Preserve role/account/session boundaries and attempt limits. Full backend
  checks pass 269/269, including leading-zero PINs, older passwords and all
  existing account/recovery boundaries. Browser/release checks are recorded
  in the task PR; no real password is changed by QA.
- PR #230 merged as `0081ce7b52db04be20a70ab6653b4f00d4679025` with reviewed
  tree `7745c0474dd0c533dcdbdba82bf7bf158a2da14b`. All 11 affected local browser
  gates, independent HIGH review, learning CI 38026195645 and navigation CI
  38026195629 passed. Pages 38026771835 passed; all 12 public/cabinet asset
  comparisons matched at 05:23:29 UTC. Amvera health and the live teacher form
  were verified after the ordinary rollout, without manually restarting it.

## Published: simple password recovery and ready pupil access

- [Scope](tasks/SIMPLE_CABINET_ACCESS.md); base
  `f9a9a3607312dab4bbfd6e85d2e28d93822d3e9c`; branch
  `feat/simple-cabinet-access`. HIGH independent review under the owner's
  standing publication instruction and external-review waiver.
- An open teacher session can set a new password without the old password or
  codes and retains its original expiry. A private hosting operator can issue
  a one-use, one-hour recovery link when no teacher session remains.
- Ready pupil login/password is the default creation flow, with a complete
  copyable message and an ordinary Done button. Existing pupil access stays
  read-only until explicit replacement. Learning history and family data remain.
- Backend checks: 246/246 pass, including 23 focused password/recovery API
  cases and six private-file CLI cases. Ready-pupil, authentication, cabinet
  and free-route browser gates passed. Teacher-password and role-navigation
  gates also passed, including lost acknowledgement and cached-page account
  changes. Independent review and CI bind to the publication head in the PR.
- Concurrent PR #226 advanced main to
  `90ca4df40051551c553a70dff5807392f18be343`. Composition changes only this
  shared status document; both runtime/test sets retain their reviewed bytes.
- PR #227 merged as `355035cf04205e8d1c181bca0180e5630e080720`; exact-head
  learning CI 38021639765 and navigation CI 38021639773 passed. Pages deployment
  38022261394 passed; all ten affected public/cabinet assets matched the reviewed
  bytes at 04:30:58 UTC. Amvera health and storage were ready, and the existing
  teacher session opened the published form. Evidence is tracked in PR #227.
- QA uses synthetic accounts only. The owner enters her real new password
  privately after publication; no password is embedded in source or chat.

## Published: accessible profile preparation and calm learning

- Scope: [calm learning](tasks/PROFILE_CALM_LEARNING.md), including the prepared
  grade-nine prerequisite and trigonometry repairs. The owner requested cloud
  publication on 2026-10-09.
- Production base: `aabdb8d9396bef502ced049e7867774c1885ddef`; branch
  `feat/profile-calm-learning`. HIGH review for local progress persistence.
- Optional calm layout, worked examples, short plans, exact-task remediation,
  small prerequisite actions and an honest mixed thirteen-position checkpoint.
  Existing learning targets and all topics remain available.
- [Implementation and limits](reports/PROFILE_CALM_LEARNING.md). Robot fixtures
  are simulations, not evidence of actual pupil learning. This section retains
  browser-local progress; no pupil accounts or server contracts are changed.
- PR [#218](https://github.com/ladynata-cloud/math-exam-fipi/pull/218) merged as
  `e710a5dfd663e41bf4bfccf6c194deaf7c33a8bf`, with parent equal to the production
  base above. The reviewed and published tree was
  `97c9733be9edc4b7f61db0037edb89386759d4a8`.
- Exact-head profile CI `37952985847` and Pages deployment `37953765812`
  passed. All 30 live page assets matched the reviewed bytes. The cloud browser
  confirmed example-to-practice entry, an accepted fractional answer,
  pause/reload/resume with the draft intact, and a valid independent answer.
- SMALL follow-up: [encouraging course heading](tasks/PROFILE_CALM_HEADING.md).
  Replace the opening heading with the owner's wording and refresh that asset
  URL. PR #219 published as `6e3cc69a791379b516397cf79b46e73922fe4c79`;
  exact-head CI `37955834953` and Pages `37956570274` passed. The public
  index and versioned script matched the reviewed bytes.

## Published: profile course entry in learner cabinets

- [Scope](tasks/PROFILE_CABINET_ENTRY.md): add the missing `ege-profile` teaching
  direction and public-course entrance, preserving the four existing routes.
- HIGH review for the teaching-profile schema extension; authentication and
  account ownership remain unchanged. Public profile-course solutions still
  remain browser-local. This is not an answer-sync implementation.
- PR #220 merged as `517f254338013911cfabcd1a72adbc1e00cba801`; reviewed
  tree `16da582a30ccc383ba4fc262e585e01c9e9aa9a1`. Exact-head CI and
  independent reviews passed; Pages run 37960073577 succeeded.
- On 2026-10-10, all five Amvera entry assets matched the reviewed files and
  health reported ready. The previous hosting 409 blocker was resolved.
  Intended profile choices were saved through the private teacher UI and
  remained correct after a full reload. No real pupil data in Git.
- Public profile solutions still remain local to the browser. Release evidence
  is recorded in PR #220.

## Published: exam tasks first, targeted school help when needed

- [Scope](tasks/PROFILE_EXAM_FIRST_ROUTE.md): display the thirteen-position
  catalogue first in profile cabinets; open actual exam practice before optional
  prerequisite work and return from a targeted detour to the original task.
- Base `517f254338013911cfabcd1a72adbc1e00cba801`; branch
  `feat/profile-exam-first`. MEDIUM front-end behavior review; no server,
  authentication, storage schema or cloud answer-sync changes.
- Targeted learner robots passed catalogue, independent entry, wrong-input
  handling, school/trigonometry repair and preserved return on desktop/mobile.
  Focused independent MEDIUM source review approved without P1/P2 findings.
- PR #221 merged as `be7ca1882228fc3b161ab4472f3bc86dfdd8df48`, parent equal
  to the base above, reviewed tree `634bf3446b3c0c614bea377e62854a3259056712`.
  Exact-head course, cabinet and navigation CI passed. Initial legacy test
  assumptions were corrected without removing mathematical/assistance checks.
- Pages run 38015110612 and post-merge profile run 38015110834 passed.
  Eight Pages assets and four actual Amvera assets matched the reviewed bytes;
  health and persistent storage were ready. The brief hosting restart 503
  resolved without intervention. Live UI confirmed thirteen entries, a real
  independent task, relevant trigonometry help and return after reload with
  the same condition and draft. No real pupil results were changed.

## Published: clear teacher, pupil and parent cabinets

- [Scope](tasks/CLEAR_FAMILY_CABINETS.md); base
  `be7ca1882228fc3b161ab4472f3bc86dfdd8df48`; branch
  `feat/clear-family-cabinets`. HIGH internal independent review under the
  owner's standing cloud-publication instruction and external-review waiver.
- Explicit role entrances and session identity checks prevent misleading
  teacher links and stale records after another account signs in. Teacher
  preview retains teacher identity and performs no pupil learning mutation.
- One pupil card includes profile, plan, work, results and family access.
  Ordinary entry copying is separate from password replacement. New family
  invitations last seven days; existing stored expiries remain unchanged.
- Pupil preparation highlights one next action. Managed long-division work
  was exercised through offline drafts, reload, lost acknowledgement and the
  same committed result in pupil, teacher and parent views. Public/local-only
  exercises remain explicitly outside this shared history.
- PR #222 merged as `a971a49f8a98a281df7c078b8409996909fc6880`, parent
  `be7ca1882228fc3b161ab4472f3bc86dfdd8df48`. Its recorded release evidence
  confirms exact-head learning/navigation CI, Pages run 38016919909, 22/22
  matching public/cabinet assets and a ready Amvera persistent store.
  Existing teacher identity survived the release; no real family learning
  records or credentials were changed by verification.

## Published: direct teacher sign-in

- [Scope](tasks/DIRECT_TEACHER_ENTRY.md); base
  `528727fa6e7fa29c578bf540d014e3ad398206e1`; branch
  `fix/direct-teacher-entry`. HIGH internal review for authentication UI.
- The owner requested removing the named pupil mismatch screen. Explicit
  teacher entry will show the teacher form directly if the current cookie
  belongs to a pupil. Existing teacher sessions still open My pupils directly.
- Pupil UI data is cleared while unsent work remains account-scoped. Opening
  the form does not change the cookie; only valid teacher authentication does.
  No teacher credential or real identity is embedded in public assets.
- Local auth, family-progress, cabinet and OGE browser gates passed. The
  role-navigation regression also covers identity flashes, untouched cookies,
  preserved queues and delayed authentication/data responses. Independent
  internal review found no remaining blocking code issue.
- Role-navigation, syntax and whitespace checks passed on the final source.
- PR #224 merged as `f228a08ab440dc79e098b39053921501087ea8fb`; exact-head learning
  CI 38018835138 and navigation CI 38018835075 passed. Pages run 38019423073
  succeeded; all four affected assets matched on both public and cabinet
  origins. Amvera health/storage were ready and the live teacher identity
  remained correct. No real credentials or pupil work changed during QA.

## Published: a real explanation for right-triangle trigonometry

- [Scope](tasks/PROFILE_TRIANGLE_EXPLANATION.md): replace the inadequate
  side-highlighting hint in the three sine/cosine/tangent tasks with gradual
  explanations of the ratio, operation, arithmetic and answer check.
- Base `be7ca1882228fc3b161ab4472f3bc86dfdd8df48`; branch
  `fix/profile-triangle-explanation`. MEDIUM, existing assisted-practice model;
  no account, server or persistence changes.
- Local learner robot passed six journeys at widths 360/1280, model geometry
  36/36, independent models 8/8 and existing first-three browser 108 models /
  56 journeys. Focused independent MEDIUM review approved with no P1/P2 findings.
- Initial exact-head profile CI passed on PR #223. Concurrent PR #222 advanced
  main to `a971a49f8a98a281df7c078b8409996909fc6880`; composition overlaps
  only this status document. Both release records are retained and all course
  runtime/test/workflow files remain byte-identical to their reviewed version.
- PR #223 published as `528727fa6e7fa29c578bf540d014e3ad398206e1`, parent
  `a971a49f8a98a281df7c078b8409996909fc6880`; full reviewed tree
  `e6774947acb4da4c8a82a80a02463647c90cc484`. Renewed exact-head profile CI
  38017270811 and Pages 38017638552 passed; all three published assets matched.
  Live verification confirmed five gradual steps, no explanation before opening,
  correct arithmetic and preserved original condition/draft after reload.

## Published: familiar fraction notation in trigonometry

- [Scope](tasks/PROFILE_TRIG_FRACTIONS.md): stacked fractions for definitions,
  substitutions and ratio checks in the three existing trigonometry explanations.
- Base `528727fa6e7fa29c578bf540d014e3ad398206e1`; branch
  `fix/profile-trig-fractions`. SMALL presentation-only correction; no new data,
  method, task, assistance or persistence behavior.
- Local checks passed: 36 geometry models, 8 independent-model tests and six
  browser journeys at 360/1280. All six definitions and two ratio checks have
  correct numerator/denominator and visible bars. Mobile/desktop images inspected.
- Original exact-head profile CI 38019120274 passed. Concurrent PR #224
  advanced main to `f228a08ab440dc79e098b39053921501087ea8fb`; only this status
  document overlaps. Both records are retained; all runtime and test files
  remain byte-identical to their respective reviewed versions.
- PR #225 published as `f9a9a3607312dab4bbfd6e85d2e28d93822d3e9c`, with
  reviewed composed tree `c01161f06ed52f1f15d19d65de9ec307f9dada2b` and parent
  `f228a08ab440dc79e098b39053921501087ea8fb`. Renewed exact-head profile CI
  38019751638 and Pages 38020048618 passed. Three public assets matched;
  live UI confirmed stacked fractions, visible bars and preserved draft.

## Published: cross multiplication before the unknown-factor rule

- [Scope](tasks/PROFILE_TRIG_PROPORTIONS.md); base
  `f9a9a3607312dab4bbfd6e85d2e28d93822d3e9c`; branch
  `fix/profile-trig-proportions`. MEDIUM, existing three trig explanations.
- Show decimal-to-fraction conversion, diagonal multiplication with the unknown
  on the left, then find the unknown factor by division. Preserve all five
  steps, task data, help accounting and saved work.
- Owner follow-up: extreme terms/red diagonal, mean terms/grey diagonal and
  the familiar equality-of-products mnemonic. Geometry 36/36, independent
  models 8/8 and six browser journeys passed; all six screenshots inspected.
  Independent focused MEDIUM review found no blockers.
- PR #226 published as `90ca4df40051551c553a70dff5807392f18be343`, parent
  `f9a9a3607312dab4bbfd6e85d2e28d93822d3e9c`; reviewed tree
  `df1d31b1b9e2a56d31f0a7a1ebbabffb735c586e`. Exact-head profile CI
  38021117301 and Pages 38021464243 passed; three live assets matched.
  Live UI verified the red/grey cross, mnemonic, unknown-left equation,
  elementary factor rule and preserved draft.

## Published: precise adjacent and opposite side terminology

- [Scope](tasks/PROFILE_TRIG_TERMS.md); base
  `90ca4df40051551c553a70dff5807392f18be343`; branch
  `fix/profile-trig-terms`. SMALL copy correction in the existing walkthroughs
  and adjacent prerequisite triangle lesson.
- Use the standard side names relative to angle α. Arithmetic, task data,
  drawings, cross multiplication and saved work are unchanged.
- Existing readiness mathematics 37/37 and six triangle browser journeys at
  360/1280 passed. Syntax and whitespace checks passed; no test files changed.
- Concurrent PR #227 advanced main to `355035cf04205e8d1c181bca0180e5630e080720`.
  Only this status document overlaps; all runtime files from both tasks retain
  their reviewed bytes.
- PR #228 published as `54556ab694b147207445face010c98595ec77b9d`, parent
  `355035cf04205e8d1c181bca0180e5630e080720`; reviewed tree
  `d95b327db0c33d3416e29abbe64ca3b30b578d8b`. Exact-head profile CI
  38022500798 and Pages 38022841893 passed; three public assets matched.
  Live verification confirmed precise side names and the preserved draft.

## In progress: step-by-step explanations throughout the profile course

- [Scope](tasks/PROFILE_ALL_STEP_SOLUTIONS.md); base
  `54556ab694b147207445face010c98595ec77b9d`; branch
  `feat/profile-all-step-solutions`. MEDIUM presentation change using the
  existing authored teaching steps and assistance contracts.
- The owner found only a highlighted diagram for the similar-triangle area
  task, then requested step-by-step explanations throughout the course.
- The bank contains 348 tasks across all thirteen exam positions, plus 60
  foundation/trigonometry tasks. A visible current-task explanation will reveal
  one action at a time, retaining earlier steps and the learner's draft.
- Add detailed similarity derivations and expand the seventeen shortest
  one-step exercises; retain the existing three full right-triangle walkthroughs.
- Check examples, practice, results and the mixed checkpoint with synthetic
  learner robots. No real pupil accounts or saved answers are changed by QA.
- Local gates: all-bank content/DOM 7/7, new learner journeys 42/42, existing
  triangle 6/6, independent models 8/8, checkpoint/map 38/38, calm learners
  190/190 and exam-first entry/repair passed. Independent mathematics/source
  review and mobile/desktop visual checks found no remaining blockers.
- PR #229 first full CI run 38024444579 passed the new solution gates but found
  an old prerequisite-browser assertion that expected the entire result at once.
  Its correction now checks every retained result step before the original
  answer assertion; later first-run stages were skipped. Repeat full exact-head
  CI after focused review, then verify published assets and the live course.

## Published: independent pupil entry and parent progress

- Scope: [family progress entry](tasks/FAMILY_PROGRESS_ENTRY.md), an existing
  pupil's self-chosen entry code plus a separate read-only parent account.
- Base: `df325b0a73efa1b516e5b81aef9125f1b952e6ff`; branch
  `feature/family-progress-entry`. HIGH independent review and full security,
  privacy and browser gates required. Standing publication permission applies.
- Parent sessions/tables are isolated from core learner/teacher accounts; only
  a narrow published-work projection is allowed. No real credentials in Git.
- Local backend passed 209/209; family security passed 10/10. Existing auth,
  QR and eight-seat cabinet browser gates passed, alongside the new parent gate
  against the actual production router. Independent HIGH review includes the
  documented parent-only rollback and private-data projection. Publication,
  exact-tree review/CI and live verification are tracked in this task's PR.

- Production main verified at `aabdb8d9396bef502ced049e7867774c1885ddef` (PR #216).
  This reconciliation does not alter the family-progress implementation.

## Published: personal pupil QR entry

- Scope: [personal QR/link entry](tasks/STUDENT_QR_ENTRY.md), an optional
  teacher-issued pupil credential usable on phone and laptop without typing
  login/password. Includes pending pupils, bounded expiry and revocation.
- Base: `64c1079e0f2e73ad77d9fbd1d58526be5517246d`; branch
  `feature/student-qr-entry`. Independent HIGH review, 199/199 backend tests,
  existing auth/cabinet and new QR browser gates passed. Actual SVG/PNG decoding
  and shared history in separate phone/desktop sessions are covered.
  `LEARNING_QUICK_ACCESS_OK` passed. Standing publication authorization applies.
- PR #215 merged as `df325b0a73efa1b516e5b81aef9125f1b952e6ff`, parent
  `64c1079e0f2e73ad77d9fbd1d58526be5517246d`; reviewed/merged tree
  `0d610444e60cf84c9dd1288c038fa406f0eb8afb` matched. Exact-head CI runs
  `37919635040` and `37919634992`, and Pages `37920488893` passed. Both
  origins served the reviewed index and versioned app/CSS/QR assets. Amvera
  started its integration revision `22355d2f2c345e04db7837b55fae8441688a4ef3`;
  the existing teacher session, roster and owned-pupil QR metadata dialog worked.
- Actual learner identities, private access cards and credentials remain
  outside source control. No new real credential has been issued yet.

## Published: decimal asset cache refresh

- Scope: [decimal asset versions](tasks/DECIMAL_ASSET_VERSION.md), five URL
  version updates in the two existing trainer pages. All JS/CSS content,
  arithmetic and saved-work behavior remain unchanged.
- Base: `0950fe33f6f4616dbe61fd11c133b0e334ed5834`; branch
  `fix/decimal-asset-version`. SMALL corrective follow-up because production
  reloads continued to use cached assets at the former URLs.
- Existing two-trainer browser checks, five-reference path/version validation,
  exact unchanged-asset checks and `git diff --check` passed. Independent
  internal SMALL review approved; `DECIMAL_ASSET_VERSION_OK` passed. Standing
  publication authorization applies.
- PR #213 merged as `64c1079e0f2e73ad77d9fbd1d58526be5517246d`, parent
  `0950fe33f6f4616dbe61fd11c133b0e334ed5834`; reviewed/merged tree
  `d3df3e0ddad86b3530cc3c35cdaad5ea7f990736` matched. Four exact-head
  workflows and Pages `37887767769` passed. Both ordinary HTML URLs and three
  versioned assets matched reviewed bytes; both live consumers used the new
  references. A returning browser loaded the new wording after normal reload.

## Published: clear decimal-division goal and comma handles

- Scope: [decimal preparation clarity](tasks/DECIMAL_DIVISOR_GOAL.md): reuse the
  completed explanation of removing the comma from the divisor, and display
  both linked comma handles without their frames. A decimal dividend remains
  valid. The 44 by 44 touch targets and keyboard interaction are retained.
- Base: `c22bf2aedc7cb8d6f52dd4963673a241e47052d1`; branch
  `fix/decimal-goal-and-comma`. SMALL copy/style scope; arithmetic, saved work,
  gesture handlers and server contracts are unchanged.
- Reuses source runtime edits from
  `fe8513df92869071814cec4b6dec658d291d5e8d` verbatim. Decimal model, guided
  plans, both-trainer gesture/resume browser checks and desktop/mobile visual
  checks passed. Focused independent internal SMALL review approved with no
  blockers; `DECIMAL_DIVISOR_GOAL_OK` passed. Standing publication permission
  applies.
- PR #212 merged as `0950fe33f6f4616dbe61fd11c133b0e334ed5834`, parent
  `c22bf2aedc7cb8d6f52dd4963673a241e47052d1`; reviewed tree
  `9a475f74f6137727b84f1cca94616a62426192ad` matched the merge. Exact-head
  checks and Pages run `37886573202` passed. Cache-busted public assets
  matched reviewed bytes, but ordinary reloads still used the former asset
  URLs. The bounded version-reference follow-up above addresses that finding.

## Published: personal OGE preparation and foundations

- Scope: [personal preparation](tasks/OGE_PERSONAL_PREPARATION.md), additive
  learner course/goal profiles, private homework deep links, task/laboratory
  modes and server-derived lifetime experience. Existing accounts retain their
  school default; paper/photo homework checks remain in force.
- Base: `b5d26ce9695deab2eea5f7eac2e13277da092450`; branch
  `learning/oge-personal-homework`. Standing publication authorization and
  external-review waiver apply; independent internal HIGH review required.
- Separate `/foundations/` route collects 158 destinations in 12 groups:
  95 managed exercises and 63 public laboratory entries. See the
  [coverage audit](tasks/FOUNDATIONS_COVERAGE.md) for real gaps and limitations.
- PR #211 merged as `c22bf2aedc7cb8d6f52dd4963673a241e47052d1`, parent
  `b5d26ce9695deab2eea5f7eac2e13277da092450`; reviewed and merged tree
  `76abc7436e792d3400a73891c9c5509a199beb30` matched. Three exact-head CI
  workflows passed. Pages run `37885544613` succeeded, 12 changed public
  assets matched reviewed bytes, and the live `/foundations/` route was
  verified. Amvera returned HTTP 200 and both changed cabinet entry scripts
  matched reviewed bytes. Live teacher profile controls and saving an OGE
  preparation goal were verified.
- Public trainers without a server contract do not earn account points.
  Private learner creation remains a production-interface action, never a
  source-code fixture. Borderless decimal commas are the bounded follow-up
  above.

## Published: linked decimal commas and multiplication refresher

- Scope: [decimal preparation interaction](tasks/DECIMAL_COMMA_DRAG.md): grab
  either comma to move both, with exact decimal values, retained working and
  nearby multiplication practice that returns to the same division.
- Base: `1aace4083532f27cdc36f54b70ce20be67f5d25c`; branch
  `course/decimal-comma-drag`. Existing saved-step contracts remain unchanged.
- Standing publication permission and external-review waiver apply; independent
  internal HIGH review approved. Local `DECIMAL_COMMA_DRAG_OK` passed on
  2026-10-08 18:19 UTC: exact arithmetic, both gesture adapters, multiplication
  return, old saved work, 320/390px and canonical bank equality.
- PR #210 merged as `b5d26ce9695deab2eea5f7eac2e13277da092450`, parent
  `1aace4083532f27cdc36f54b70ce20be67f5d25c`; reviewed and merged tree
  `85a89deb0ae60bcf2ddc83fba027d172bc54e0e3` matched. Four exact-head workflows
  and Pages 37824750184 passed; eight public assets matched reviewed bytes,
  and live linked-comma and multiplication-return interactions were verified.

## Published: PreOGE arithmetic route

- Scope: [existing arithmetic integrated with PreOGE](tasks/PREOGE_ARITHMETIC_ROUTE.md),
  skill links, contextual guided division, honest local progress and fictional
  learner software scenarios. No accounts or backend changes.
- Base: `c8241e8c08cfb3916cb9875a9896d8a2024042d0`; branch
  `course/preoge-arithmetic-route`. Prior unpublished curriculum work is excluded.
- PR #209 merged as `1aace4083532f27cdc36f54b70ce20be67f5d25c`;
  reviewed and merged tree `8ebab6ac81741cc6d033ca89b8997edc2a7d51db` matched.
  All four exact-head workflows and Pages 37819428294 passed; nine changed
  public assets matched reviewed bytes and live navigation was verified.

## Published: Atanasyan 10–11 route to profile task 15

- Scope: [Atanasyan stereometry](tasks/ATANASYAN_PROFILE_15.md), a separate
  route inside profile EGE: eight stages using 22 existing workshop units,
  followed by 12 original proof-and-calculation problems with exact models.
- Base: `f829dfed60a0e4821c514e1e2d1c5d11ab9f7220`; branch
  `course/atanasyan-profile15`. Standing owner publication permission and
  separate external-review waiver apply. Independent internal review required.
- PR #208 is included in the verified current main,
  `c8241e8c08cfb3916cb9875a9896d8a2024042d0`.
- Current account request remains separate: two profile learner cabinets,
  names pending. Existing school cabinets do not yet synchronize profile-start
  progress. This static course release does not change authentication or
  production learner records.

## Published: all first-part positions and detailed inequalities

- [First part and inequalities](tasks/PROFILE_PART_ONE_INEQUALITIES.md): 36 new
  themes / 216 exercises, combined 62 themes / 372 exercises, and 18 detailed
  inequalities. First-part positions 1–13 follow the 2027 draft; inequalities
  are 16 in 2027, 15 in 2026.
- PR #207 merged as `f829dfed60a0e4821c514e1e2d1c5d11ab9f7220`, parent
  `a34ef76adc4165adf489f6025de8f3281cc4b592`; reviewed/actual tree
  `d2fda09d6807907ffeaf49fd2c22790a1421e003` matched.
- Exact-head profile/logarithm CI 37544981471 and 37544981466, Pages
  37545396893 and postmerge quality 37545397514 succeeded. All 19 changed
  public assets matched reviewed bytes; live answer/history/model and
  inequality navigation checks passed. No backend/account changes.

## Published: clear EGE profile positions 1–3

- Scope: [task-bound models and short guided steps](tasks/PROFILE_FIRST_THREE.md).
  Reuse the profile start course for planimetry/vectors; add guided stereometry.
  Preserve OGE/PreOGE site priority, prior direct URLs and pupil accounts.
- PR #206 merged as `a34ef76adc4165adf489f6025de8f3281cc4b592`, parent
  `55ea5af0018bc2bb3bad06a384df98ea4cb1211d`; reviewed and actual tree
  `c097ae749b1e09d9eb45b6fd2d24ecb9eb25427f` matched exactly.
- Exact-head CI 37540919253, Pages 37541278349 and main quality 37541278702
  succeeded. Eight public assets matched reviewed bytes. Live model controls,
  accepted steps and navigation passed, with desktop/mobile regressions.
- 36 planimetry tasks, 24 vector tasks and 48 stereometry tasks have task-bound
  figures in the focused route. Earlier content and local progress keys remain.

## Published: OGE/PreOGE entry and visual long division

- PR #204 merged as `9ad311dbb6d969f174876ab290938b94847f2442`: homepage
  prioritizes OGE/PreOGE; other courses and tools remain in `/laboratory/`.
- PR #205 merged as `55ea5af0018bc2bb3bad06a384df98ea4cb1211d`: first partial
  dividend selection, visible notebook steps, bring-down arrow and clear decimal
  normalization at the unchanged public division URL.
- Pages run 37531861906 succeeded. Nine public assets matched the combined tree;
  desktop/mobile, saved-attempt and live navigation/decimal checks passed.
- No account, backend protocol or trainer-registry change. Detailed gate and
  release evidence is retained in PRs #204 and #205. This task fetched and
  independently confirmed that exact production main before branching.

## Published: a nested logarithm, one visible step at a time

- Scope: [a second detailed interactive example](tasks/LOGARITHM_NESTED_EXAMPLE.md)
  at `trainers/ege-profile/log-inequalities/nested.html`, solving
  `log_(x²-x)(log_(x²+x)x) >= 0`: six domain conditions, separate interval
  solutions, aligned number-line intersections and two sign-equivalent
  replacements. Accepted work stays visible throughout.
- PR #203 merged as `74776f448a82aa220d08c1312e20ea314d571dac`, parent
  `fa86d5812ce175ddbf124661b7c258642dd319ab`. Exact-head workflows
  37525990223 (profile course), 37525990009 (logarithms) and 37525990000
  (learning/container) passed. Both guided lessons passed full desktop/mobile
  browser journeys, and 40,038 independent mathematical checks passed.
- The guided runtime preserves the first lesson's identity and saved work.
  Public Amvera checks at 20:33 UTC on 2026-10-06 confirmed HTTP 200, six mirror
  entries including `profile-log-nested-example`, no registry error, and the
  expected digest. No account or server-protocol changes were introduced.

## Published: one logarithmic inequality, one visible step at a time

- Scope: [a detailed interactive worked example](tasks/LOGARITHM_ONE_EXAMPLE.md)
  at `trainers/ege-profile/log-inequalities/lesson.html`: collect the full domain
  system, solve each restriction, intersect aligned number lines, rationalize,
  and intersect the final solution with the domain. Accepted work stays visible.
- PR #202 merged as `fa86d5812ce175ddbf124661b7c258642dd319ab`, parent
  `70c4d1985353c92be0c299b9673e5fe380ceb256`. Exact-head workflows
  37523744592 (logarithms), 37523744486 (profile course) and 37523744408
  (learning/container) passed; the full 18-step browser journey also passed on
  the composed release tree after the concurrent homepage PR #201.
- Published with an entry link and ordinary mirrored-board registration.
  Amvera deployment was verified at 20:15 UTC on 2026-10-06: both public
  endpoints returned 200, the registry contained five mirror entries including
  `profile-log-one-example`, and its digest matched the tested manifest.
- No account, group-cabinet or server-protocol changes were part of the release.

## Published: variable-base logarithmic inequalities

- Scope: [twelve author-written methods and 48 numerical variants](tasks/PROFILE_LOG_INEQUALITIES.md)
  with worked examples, guided steps, independent work and ordinary board mirroring.
- PR #200 merged as `5092ccd5750db9e260a743d96b1e706449721824` and was published.
  That release is included in the current base; its release evidence is retained
  in PR #200. The existing trainer remains at
  `trainers/ege-profile/log-inequalities/index.html`.
- Account and group-cabinet contracts remain outside that bounded addition and
  outside the detailed public lessons.

## Published: guided public division and school cabinet navigation

- Scope: [one current action and Russian notebook notation](tasks/DIVISION_GUIDED_NAVIGATION.md), with the same public URL and all division topics.
- Reference: division inside `trainers/arifmetika.html`. The managed teaching
  bank and pupil accounts remain unchanged. Arithmetic, source-bank, final cloud
  browser, registry/classroom and learning gates passed. PR #198 merged as
  `433af336add696b5a00f53da8b6514d8be8c68f1`; Pages 37466740133 passed and all
  four public trainer assets matched reviewed bytes.
- PR #199 changed the pupil cabinet default to school algebra, geometry and
  foundational revision. Merge `88ae1f71360f36d76f539341f1c3375c51eca442`, focused
  and full learning gates passed; Pages 37465090121 and all three production
  Amvera cabinet assets were verified. Exam materials remain explicitly available.

## Published: author articles on Atanasyan

- Scope: [eight revised articles](tasks/2026-10-06-atanasyan-author-view.md),
  titled «Об учебнике Л. С. Атанасяна» with subtitle «Почти с любовью».
- Eight original SVG diagrams and thirteen small verified textbook fragments
  from 1987, 2010 and 2023 accompany the articles. The 1987 book is explicitly
  identified as a trial grade-6 textbook. The prior twelve-article series stays.
- Independent mathematics/source review, all local links and 30 desktop/mobile
  page views passed. The new series links to the published grade-7 trainers.
- PR #197 merged as `9ed82e42e2e0c4daebd3e0897674dc53e6d510d7`, parent
  `be02423823526bdabb23665bc8dcf8eb54678195`; Pages 37403919183 deployed it.
  Prior release evidence verified 36 public files against reviewed bytes.
  This task independently rechecked that exact remote main before starting.

## Published: foundations before grade 7 and introductory geometry

- Scope: [38 interactive trainers and 76 silent videos](tasks/PRE7_FOUNDATIONS.md):
  18 foundations and 20 introductory geometry families, with separate algebra
  and geometry routes and optional returns to prerequisite topics.
- Base `ec6afeb7fbae5c567ebd69b1be91f36093237fa2`, branch
  `feat/pre7-foundations-20261006`. Existing school/Vilenkin materials are
  mathematical and visual references; their independent exploration values
  are adapted to the actual managed task.
- No account reset, credential change, database migration or production pupil
  write is part of this content expansion. Existing cabinet and teacher-control
  contracts are reused.
- Mathematical, managed-browser and independent runtime reviews passed;
  all 38 new trainers retain task-bound diagrams, hints, previous solution
  steps and teacher-control state. The cabinet exposes 62 school families.
- All 76 new silent clips are rendered. Final media gates passed 136 active
  browser playbacks, 68 A4 guides and 408 animation journeys; independent
  review covers the final 37 changed runtime files.
- PR #196 merged as `be02423823526bdabb23665bc8dcf8eb54678195`, parent
  `ec6afeb7fbae5c567ebd69b1be91f36093237fa2`, reviewed tree
  `ea0b500f1863a34d6e8d3ee092f945171c962707`. Exact-head workflows
  37402430227 (learning/container), 37402430199 (EGE classroom) and
  37402430246 (video) passed. Pages 37403159463 deployed this exact merge.
  Production verification matched 45 public/backend assets, confirmed all 76
  new videos and 62 school entries, and checked durable status and anonymous
  private-plan denial (401). No production learner data was written.

## Published: next grade-7 course block; library label correction

- PR #194 merged as `8125c176b6b0168c9c93e88a766ce6b144149762`, parent
  `a69da715e1f319cf13fd05d769a42878f3922a64`, reviewed tree
  `1f5dd604e9f70702114a5783b7df89ca2efa00d4`.
- Exact-head workflows 37389677215, 37389678296 and 37389678498 passed;
  Pages 37390305523 deployed the merge. Live UI exposes 24 new cabinet entries
  and 30 video topics. Post-deployment byte checks are recorded in PR #194.
- Live inspection found an old static library introduction saying 30 clips and
  15 topics. The scoped SMALL follow-up corrects it to 60/30 and links the
  full grade-7 hub. It changes no scripts, media or pupil state.

- Scope: [24 trainers and 30 silent videos](tasks/GRADE7_NEXT_COURSE_BLOCK.md).
- Base `a69da715e1f319cf13fd05d769a42878f3922a64`, branch
  `content/grade7-next-course-block`. Eight focused trainers per strand:
  algebra, introductory geometry and earlier arithmetic foundations.
- All new trainers use managed cabinet attempts. Existing public school
  records remain browser-local; no migration is claimed.
- Local gates passed: 165 backend tests; 24 new managed trainers with draft,
  hints, semantic diagrams, teacher control and restoration; existing account,
  eight-seat board, exam and free-route scenarios. Independent mathematical
  and code reviews found no remaining blockers.
- Thirty new silent MP4 clips are rendered and hashed. Browser gates checked
  all sixty active clips, thirty complete A4 guides, 180 animated scenarios,
  mobile layouts and cumulative written steps/geometry drawings.
- Familiar grade-7 conditions retain their history across retries and reset;
  their results do not inflate independent mastery. Legacy grading is unchanged.
- PR #195 merged as `ec6afeb7fbae5c567ebd69b1be91f36093237fa2`, parent
  `8125c176b6b0168c9c93e88a766ce6b144149762`, reviewed tree
  `42deb98a49bfaa5a149819ae2aaed0bf1e8bf61f`. Exact-head video workflow
  37391123526 and Pages 37391436094 passed. Published library HTML matched the
  reviewed bytes and reports 60 clips/30 topics. Release PRs retain evidence.

## Published: reliable pupil access card

- PR #193 merged as `a69da715e1f319cf13fd05d769a42878f3922a64`, parent
  `f2397dfca606a72ff46fe1fa3461196974736a9a`, reviewed tree
  `dd5d901c54c4ad23360157a6b928071f03da1ddc`.
- Exact-head CI 37385144900 and Pages 37385499804 passed. Amvera application
  and stylesheet matched reviewed bytes, durable health was available and the
  anonymous replacement-password endpoint returned 401. The authenticated
  teacher roster survived reload. Owner subsequently reported saving access.

- Scope: [pupil access card](tasks/STUDENT_ACCESS_CARD.md); branch
  `fix/student-access-card`, base `f2397dfca606a72ff46fe1fa3461196974736a9a`.
- First pupil creation is now confirmed in the authenticated roster. The owner
  could not retain the access-card data; no production password was inspected.
- Synthetic tests identified clipboard-error feedback hidden behind the modal.
  Implemented in-card feedback, selectable text, explicit save/discard protection
  and teacher-issued replacement passwords for the existing pupil identity.
- Backend 151/151 and independent HIGH review passed. Auth, cabinet and
  free-route browser coverage includes guarded copying and password replacement.
- Initial optional study recommendations were saved and reread after reload.
  No actual credential was inspected or submitted by the executing agent.

## Published: easier pupil sign-in

- PR #192 merged as `f2397dfca606a72ff46fe1fa3461196974736a9a`, parent
  `c8773ed06358121756e4d10658453105cf057639`, reviewed tree
  `988744810aec3da8b46f1c2f55b9eaf0b6d1468d`.
- Backend 140/140, auth/cabinet browser, independent review and exact-head
  workflow 37381326070 passed. Pages deployment 37381681991 succeeded;
  Amvera app bytes matched, status was available and durable, and the live
  teacher pupil form showed the eight-character minimum.

- Scope: [short pupil passwords](tasks/SHORT_STUDENT_PASSWORDS.md); branch
  `fix/short-student-passwords`, base `c8773ed06358121756e4d10658453105cf057639`.
- The owner requested a shorter password for the first pupil. Support an
  eight-character minimum for pupils and an eight-digit random suggestion;
  preserve the teacher's twelve-character setting/recovery minimum.
- Teacher reports saving recovery codes. The first pupil was subsequently
  created; access-card retention is the remaining operational issue above.

## Published: lost teacher recovery codes

- PR #191 merged as `c8773ed06358121756e4d10658453105cf057639`, parent
  `8836bb24c04091ab503bf7c0d74eca1318b5732d`, full reviewed tree
  `c9696f066026116650eba98f366ce91feebf8f09`.
- Exact-head workflow 37379028688 and Pages deployment 37379441729 passed.
  Changed cabinet assets matched tested bytes on Amvera; status was available
  and durable, anonymous recovery-code issuance was denied with 401. Existing
  teacher session survived, and the authenticated Security form was verified.

- Scope: [recovery codes](tasks/TEACHER_RECOVERY_CODES.md); branch
  `fix/teacher-recovery-codes`, base `8836bb24c04091ab503bf7c0d74eca1318b5732d`.
- First-teacher activation succeeded and the authenticated teacher interface
  was confirmed. The owner did not retain the one-time recovery-code display.
- Add password-confirmed authenticated reissue and explicit save/discard
  acknowledgement. Preserve the active password, sessions and teaching data.
- The owner subsequently reported completing the private saving step.
- First pupil provisioning occurred after the next release, as recorded above.

## Published: pending teacher activation repair

- PR #190 merged as `8836bb24c04091ab503bf7c0d74eca1318b5732d`, parent
  `c86a98842f0158ecd4096ee8f58667463d20dd23`, reviewed tree
  `112aaa8be701fce7a60cdc3dcb49c0024f76b3d2`.
- Exact-head CI passed (run 37365672149, attempt 2). Deployment assets were
  verified; operator diagnostics and subsequent authenticated UI confirmed
  successful first activation. No real credentials were captured.

- Scope: [pending activation](tasks/PENDING_TEACHER_ACTIVATION.md); branch
  `fix/pending-teacher-activation`, base `c86a98842f0158ecd4096ee8f58667463d20dd23`.
- Activation and ordinary login had been rejected. The repair was based on
  code evidence; no private database or credential values were read.
- Repair only pending invitations through the existing private hosting
  configuration; active accounts remain untouched. Clarify authentication
  messages and accept invitation fragments added to an already-open page.
- Activation no longer blocks pupil setup; retain recovery codes first.

## Published: grade 7 course and thirty silent videos

- PR #189 merged as `c86a98842f0158ecd4096ee8f58667463d20dd23`, parent
  `6d21ca0866733a85d69c9f6d7a82375c8f46b964`, tree
  `3985c874a7bbbcca76af695cb0a36d45ba122798`.
- Exact-head CI and Pages deployment 37341178554 passed. Production verification
  passed 57 checks for public assets/videos, server status and auth boundaries.

- Owner changed the main product direction to Makarychev + Atanasyan grade 7,
  supporting school-year work and summer consolidation; EGE remains available.
- Scope: [silent motion and opening algebra](tasks/GRADE7_SILENT_MOTION.md),
  branch `feat/grade7-silent-motion`, base
  `6d21ca0866733a85d69c9f6d7a82375c8f46b964`.
- Implemented opening algebra route: twenty-four lessons (six preserved and
  eighteen new), from numbers and expressions through linear equations and
  word problems. This is the opening block, not either complete textbook.
- The video library pairs fifteen animated mathematical explanations with
  fifteen walkthroughs of the actual linked trainers: thirty active silent
  videos. All thirty plus the archived help clip are rendered and included in
  the media directory. The archived clip is separate from the active count;
  all thirty-one files have H.264 video and no audio stream.
- Existing cabinet contracts and school progress keys remain unchanged.
  School workshop results stay in the current browser and are not synchronized
  into cabinet attempts. Written work is sent manually through MAX.
- Independent code review found no remaining blocker; replay can be paused,
  old video-size metadata was removed, and compact export histories fit.
  Completed local checks include 44 worker tests, 2,208 course cases with 7,022
  step checks, 24 browser lesson flows at two widths, 90 motion journeys with
  30 pixel comparisons, decoded-media inspection and the legacy factory gate.
  All 30 active videos play; 15 A4 sheets, seven original practice entries and
  the real HTTP/SQLite cabinet regression passed, including no attempts or
  media fetch before explicit action. Independent mathematical review passed
  all 24 worked presets across the eight new video topics.
- Local combined gate: `GRADE7_SILENT_MOTION_OK`; publication verified above.
- No production pupil account was created in this task;
  no account, authentication or hosting settings were changed.
- First-teacher activation was the operational blocker at that release and has
  since succeeded, as recorded above.

## Published: visible videos and direct practice entry

- PR #188 merged as `6d21ca0866733a85d69c9f6d7a82375c8f46b964`, full tree
  `50c461f576c20d01730d39a857238d1927efc8ab`; merge parent matched the task base.
- All three exact-head CI workflows passed. Pages deployment 37249756756
  succeeded; twelve changed public assets matched exact tested bytes.
  Learning status was available/durable; anonymous private plan returned 401.

- Scope: [video entry](tasks/COURSE_VIDEO_ENTRY.md), branch
  `fix/course-video-entry`; base `7e007ff73a25a16faa1e6913b9c9af819c2ec435`.
- Owner cannot easily find the videos and some trainer entries appear static.
  Put existing voice-free videos at the start of topics; audit and improve
  entry into actual exercise controls. Keep print, saved work and normal entry.
- Local browser gate passes: seven real videos, fourteen layouts, seven A4
  prints and seven answer/feedback flows; saved and managed entry preserved.
  Focused code review found no blockers. Next: scoped PR, exact-head CI and
  production byte verification under the standing publication permission.

## Published: seven animated sheets and exact trainer guidance

- PR [#187](https://github.com/ladynata-cloud/math-exam-fipi/pull/187) merged as
  `7e007ff73a25a16faa1e6913b9c9af819c2ec435`, tree
  `fede6bc9b14d9a5f1aff1562be02ddcf991d778a`; authorized base did not drift.
- Both exact-head CI workflows passed, including the production Alpine image.
  Worker 39/39, 444 scene checks, export recovery, cabinet flows, seven real
  trainer entries and one-page print layouts passed.
- All 22 public Pages/Amvera assets matched tested bytes, including all seven
  stored MP4s. Learning status was available/durable; anonymous private access
  was denied. Pages deployment 37247546946 succeeded.
- Six topic guides lead to saved cabinet work; the separate angles trainer is
  explicitly marked for written work sent manually in MAX. No real account
  was provisioned; first teacher activation remains pending operator access.
- No voice provider calls. Correct solution history and a soft non-tonal tap
  are published. The old how-to clip is deferred until owner-supplied slides.

## Published: learner free route and original paper homework

- PR [#186](https://github.com/ladynata-cloud/math-exam-fipi/pull/186) merged as
  `ab9d7d5812ed32d15fe63497cfc34288a216b753`, tree
  `60dce209626c24342ab9c3a2f416a1cae1ee3394`.
- All three exact-head CI workflows passed, including the actual Alpine image;
  118 server tests, 8,400 checked paper tasks, the new browser flow and legacy
  cabinet/homework/exam/remediation checks passed. Independent findings closed.
- Public checks matched eight Amvera cabinet assets, the Pages remediation
  adapter and all three MP4 files to tested bytes. Learning service was
  available/durable with143 catalog entries; anonymous plan access returned401.
- Free order/pace, prerequisite detours, visible progress, explicit submission,
  teacher-assigned credentials, first-entry guide and original paper homework
  are published. No real pupil account or assignment was created: private
  first-teacher activation remains pending hosting operator access.

## Published code: independent homework method and teaching videos

- PR [#185](https://github.com/ladynata-cloud/math-exam-fipi/pull/185) merged as
  `4df45e5d3b5825a21451f5cc90838260fb9f6f39`, tree
  `759b8de0ce2dc588a76982e9941969374698bebb`. Authorized base remained
  `a024f6c0f22bd58077bb3e31c2911ba324abb1a8`; no drift. Exact-head CI passed.
- The latest owner clarification cancels narration setup and keeps local click
  sounds, readable on-screen explanations and a text/step alternative.
- This task extends only the implemented isolated video worker with three fixed
  authored school scenarios; no pupil data, account permissions or classroom
  contracts change. The complete year course and offline cabinet remain outside
  this task. The old ADR 0002 is Proposed; actual implemented video behavior is
  established by source and verified results, not assumed ADR acceptance.
- Owner screenshot shows the Amvera video application running, and a read-only
  `/healthz` check returned 200 with `ok: true` and an empty queue. Automatic
  narration/provider credentials and a production render are not verified.
- [Method](parallel-class-method.md) and [operator guide](self-study-video.md)
  are implemented with three fixed pilot scenarios and a protected MP4 export
  form. Worker 36/36, legacy gate, 204 scene checks, mobile keyboard navigation
  and lost-acknowledgement/reload/retry regression passed. Three small real MP4
  samples contain local clicks, without narration or external speech calls.
- Independent agent review found no remaining blocker. Owner waived separate
  external review and authorized publication. The public studio entry page
  matches the released source. A live natural-voice render and the deployed
  worker revision are not verified; `/healthz` alone cannot establish them.

## Published: unified learning workspace

- PR [#184](https://github.com/ladynata-cloud/math-exam-fipi/pull/184) merged as
  `a024f6c0f22bd58077bb3e31c2911ba324abb1a8`, tree
  `75d01207f0126872aac813860d24a366efff0346`.
- Both exact release-head workflows passed, including 104 server tests and the
  actual Alpine image. The postmerge EGE workflow and Pages deployment passed.
- Production read-only checks matched 75 Pages files and 22 backend public files
  to the tested tree. Learning status reported available/durable and the exact
  143-entry catalog; an unauthenticated session request returned the expected401.
- Permanent accounts are not capped at eight: the 24-learner / three-group
  persistence and recovery regression passed. Eight is a per-lesson seat limit.
- First-teacher activation is pending: the cloud-browser credential protection
  prevented the Amvera operator-panel workflow. No production account or pupil
  data writes are claimed. See PR #184 for full actual release evidence.

## Published: group-board pilot

- PR [#183](https://github.com/ladynata-cloud/math-exam-fipi/pull/183),
  [scope](tasks/group-board-eight.md), [guide](group-board.md), merged as
  `32cc54312ff2a125c117c85aa180e8da3c74128d`. Pages run `37227174533`
  succeeded; seven changed public runtime files matched the published bytes.
- The owner authorized publication and waived external review for PR #183.
  [ADR 0009](adr/0009-group-lessons.md) is Accepted for that scoped pilot.
  No external reviewer verdict or waiver for the subsequent account system
  is claimed.
- Published coverage: 1–8 independent learners, four teacher previews, two
  learner views, explicit shared explanations and event replay, with two pilot
  trainers. Backend 58/58 and the extended group-browser gate passed. The known
  unrelated legacy-browser failure also occurs on its untouched base.
- Docker uses `/data/group-lessons`; Amvera mounts persistent `/data`.
  The earlier HTTP 503 incident is resolved: subsequent read-only checks
  returned HTTP 200 and durable group capability, and the mount was confirmed.
  This establishes availability and configuration, not a production crash or
  restoration test. No hosting mutation was made during that diagnosis.
  Rollback must preserve journals and the persistent volume.

## Earlier work records (not current group-board release evidence)

## Current: repeated practice for linear equations

- Verified remote main: `333417477a1446e39123e1cbf251f5956134fd92` (PR #181). The preceding π-input/vector-point release is published; Pages succeeded and its four runtime files matched the tested bytes.
- Scope: [same-type equation practice](tasks/EQUATIONS_REPEAT_PRACTICE.md). Four additive sets of 240 linear equations, guided renewal, existing interactive model and unchanged legacy task seeds.
- Next three actions: finish scoped validation; open one Draft PR with exact base/head and test evidence; obtain publication authorization for this new PR.

## Current: paired tutor lesson/homework and unified trigonometry

- Confirmed production main: `4e229981e303c6ddfd252b6c2bc71c4913ff8e30` (PR #179), tree `68ed76c112b286a552cbd995dcb653192d4ebce6`. π input display was published and checked; this follow-up also snaps dragging to exact divisions by default.
- [Current scope](tasks/PROFILE_LESSON_HOMEWORK.md): six paired teacher/homework blocks; one trigonometry route containing 33 Mordkovich foundation lessons followed by six consolidation/application blocks. Read-only combined report, teacher prompts, return/next context and board entry points.
- No new progress schema or cloud accounts. Existing records remain the source; prior successes are labelled as existing browser history. Owner standing publication/review exception applies. Release evidence will be in the single task PR.

## Published: detailed Mordkovich circle route; radians display adjustment

- PR #178 published as `d3df2d65e861ac6dc79cda9cb88853db92b2f6c8`, tree `c18a2742c1f933359cf74b035066ba2ff5884869`. Pre/post-merge CI, Pages, all 16 public file hashes and live course/board passed; release evidence is in PR #178.
- Current SMALL follow-up: [radians input through π](tasks/MORD_RADIANS_PI.md), requested from the owner's screenshot. Existing course scope below is retained as historical context; publication is complete.

- Confirmed production main: `cd5d5a97f25109b70743f3ea85513ab8950dba36` (PR #177), tree `293f449d9c7f502f76780131e4982a05d5874095`. The 18-theme/108-task profile start was published; exact-head CI, Pages and live course/board were verified in PR #177.
- Current task: `course/mordkovich-unit-circle`; [scope](tasks/MORDKOVICH_CIRCLE.md). Owner requests a deeper ordered introduction using her uploaded Mordkovich §§4–6 pages. 33 lessons, 75 numbered exercises / 289 subparts plus 6 authored preparation exercises, 743 guided steps and an additional final check for each task.
- Screenshots themselves are not published. Exact textbook edition/year is unverified. Coverage is the supplied §§4–6, not the entire 10–11 textbook or all profile EGE.
- Existing course and board data are preserved. New progress key is isolated and local, with export and preservation of damaged/future schemas.
- Standing owner authorization permits publication of updated courses without a separate external reviewer/final acceptance. No external reviewer approval is claimed and global policy is unchanged.
- Next: complete real browser gates; publish one exact-head PR; verify Pages, live lesson and board. Actual release evidence belongs in that PR.
- Classic Atanasyan draft PR #168 remains outside this task.

## Confirmed preceding EGE release

- PR #164 merged as `0784471463a8d710a66575f65b8b9f6dc9d41edd`. 103 EGE practice families and the 13-stage foundations route were published; production file hashes and browser were checked.
- This textbook work starts from that tree and preserves it.

## Current release: all discussed courses (2026-10-02)

- Basic EGE and gardens work-rate trainer published by PR #160, main `a325f74909fd3ba322089702a8954bcfd300e5cb`; Pages workflow and public files were verified.
- Targeted remediation and bounded virtual-classroom checks merged by PR #161, main `f8122568a2d736d05d3a373b7a2eb60f94e2aff9`; all three cloud test roles passed on the PR head. Publication evidence is recorded in the PR.
- PR #162 integrates reviewed Atanasyan7–9/10–11, Vilenkin-topic workshop5–6, Merzlyak/Pogorelov geometry, equations, long division and board usability. Main-course priority remains basic EGE.
- The owner explicitly authorized completion and publication of all discussed created/updated courses and requested the board improvements. No global policy or account/hosting settings are changed.
- Internal independent agents found and verified fixes for mathematical presentation, storage, constructions and progress defects. These checks are not represented as external Claude review or a real-student pilot.
- Course maps cover the named textbook points; exercises cover selected families. These are not exhaustive textbook solution banks or complete yearly programs. Additional textbook editions will be supplied later.
- See [release scope](tasks/ALL_COURSES_RELEASE_20261002.md) and PR #162 for the exact base/head, final gates, rollback and actual publication result.

## Historical snapshot below (2026-08-15; not current release evidence)

## Production main

- Repository: `ladynata-cloud/math-exam-fipi`
- Branch: `main`
- Commit: `e9347d544a90a8d151051ee29a047d51a906196f`
- Confirmed state: Progress Workspaces API v1 and persistent board `/data`; the
  Yashchenko lines 1–2, Algebra 7 control-work and DVI mathematics tasks 18–20
  releases with student progress and teacher panels; and the DVI video studio.
- PR `#102` is merged and its student, teacher, video-studio, registry,
  learner-write, teacher-read, reload and autoplay-isolation production smoke
  passed on 2026-08-15.

## Current stage

Video Factory v1 is in implementation on `agent/video-factory-v1`. It adds an
isolated persistent render queue, server-side OpenAI/Yandex speech, Chromium and
FFmpeg MP4 assembly, and one-click controls in the existing DVI studio. The
first independent review findings were remediated. Re-review of head
`b78fc9b6b5bf5e1630f8fe572465c7a4484a61e0` then found a race in automatic
stale-lock takeover plus recovery/shutdown cleanup gaps. Automatic takeover is
now removed fail-closed, cancellation is bounded and propagated, and cleanup
failures are surfaced; the next exact head requires another independent review.

This is a `NEW_ARCHETYPE`. ADR 0002 is Proposed. A Draft PR may demonstrate the
prototype, but merge/deployment remain blocked until explicit ADR acceptance,
independent review or a policy-compliant exact-head waiver, and separate release
authorization.

## Open PRs

- Draft PR `#92` contains the Trainer Inventory v1.0.1 cross-platform
  Git-object hashing fix and still requires independent exact-head review.
- Draft PR `#103` contains Video Factory v1 and remains unmergeable until its
  remediated exact head passes independent re-review and ADR 0002 is accepted.
- Older unrelated PRs remain open but do not alter this task's exact base.

## Last confirmed gate

The DVI release passed its exact-head local gates and production smoke on PR
`#102`. Video Factory authoring, DVI regression, 23/23 worker API/storage/queue
tests and 41/41 board-server tests pass. Local visual browser smoke is blocked
by the browser's local-URL policy; a real Chromium/FFmpeg/TTS render remains a
required container/staging gate.

## Blockers

- ADR 0002 must be accepted for the exact reviewed implementation before merge.
- The exact head needs independent security/code review or an explicit
  policy-compliant owner waiver.
- The separate Amvera application needs its own persistent `/data`, TTS secret,
  admin secret, allowlisted origins and `video.mathexam.space` domain.
- Merge, deployment and production smoke remain separately authorized actions.

## Next three actions

1. Publish the shutdown/lock/cleanup remediation on Draft PR `#103` and obtain
   independent review of that exact new head.
2. After a clean review, obtain explicit owner acceptance of ADR 0002 for the
   exact reviewed implementation.
3. After separate merge/deployment authorization, configure the second Amvera
   app, publish it and run the canonical production smoke.

## Maintenance rule

At the start of each approved task, compare this snapshot with actual remote
`main`, open PRs, gates and production evidence. Update it within that task when
stale and keep exactly the next three concrete actions. Never predict a
successful merge or deployment before it happens.


The in-flight PR266 scope now includes the owner-requested six-step addition
and six-step subtraction prerequisite ladders. They appear alongside the two
existing cabinet tracks and use separate tab-local practice. Diagnostic links
point to the relevant carry/borrow stage. Production publication remains pending
final exact-head CI and deployment verification; see PR266 for current evidence.

## Prepared: Makarychev 7 (2024), full topic course

- [Scope](tasks/MAKARYCHEV7_FULL_COURSE.md), MEDIUM review, branch
  `feat/makarychev7-full-course`, base
  `07189de58b7f5d60c02ea6ca6aa9450a324a377f`.
- Requested analogue of the published grade-eight course: all 46 numbered
  topics, original theory, selected source tasks, authored practice, interactive
  models and preserved computation detours. Separate route and browser storage.
- Source map covers all 1247 exercise numbers with verified header pages.
  Individual worked solutions are selected, not claimed for every number.
- All 46 topics, 160 theory blocks, 276 tasks (92 selected textbook and
  184 authored), 795 worked steps and 10 model families are complete.
- Independent source/math and model reviews passed. Automated verification
  walks every task/step, all source-range boundaries, all 46 model mounts
  and 727 control changes; browser-state/import/computation detours passed.
  Desktop visual inspection passed; final publication evidence belongs in the PR.
- Claude consultation/review was unavailable and is not claimed. No pupil
  account, backend or board-protocol changes belong to this task.

## Published: Makarychev 8 (2024), full topic course

- [PR #319](https://github.com/ladynata-cloud/math-exam-fipi/pull/319) merged as
  `07189de58b7f5d60c02ea6ca6aa9450a324a377f`; public route
  `/school/makarychev8/`. All 51 topics, 172 theory blocks, 306 worked tasks
  (102 selected textbook tasks/subparts and 204 authored), 958 worked steps.
- All six final PR jobs passed; production course CI and Pages deployment
  `40016014762` succeeded. Course HTML, six dependencies, catalog and sitemap
  returned 200 and matched reviewed bytes. Actual parent was concurrent
  Vilenkin release `52cb1c1a5c731acd660139328f0001ccfa33a08b`; the exact
  reviewed 23-file delta was verified and relevant gates rerun after merge.
- Visual browser QA and external Claude review were not completed; these
  limitations were disclosed. Progress is browser-local; no synchronized-board
  or cloud learner-storage claim is made. Final evidence is in PR #319.
