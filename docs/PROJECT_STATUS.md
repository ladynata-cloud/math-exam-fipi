# MathExam project status

Updated: 2026-10-07 (Asia/Novosibirsk)

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## In progress: one logarithmic inequality, one visible step at a time

- Scope: [a detailed interactive worked example](tasks/LOGARITHM_ONE_EXAMPLE.md)
  at `trainers/ege-profile/log-inequalities/lesson.html`: collect the full domain
  system, solve each restriction, intersect aligned number lines, rationalize,
  and intersect the final solution with the domain. Accepted work stays visible.
- Base: `5092ccd5750db9e260a743d96b1e706449721824`; branch
  `feature/logarithm-one-example`. Adds an entry link and ordinary mirrored-board
  registration. No account, group-cabinet or server protocol changes.
- The owner requested implementation and publication without a separate external
  review. Mathematical, browser, registry and current-release checks remain part
  of this task.

## Published: variable-base logarithmic inequalities

- Scope: [twelve author-written methods and 48 numerical variants](tasks/PROFILE_LOG_INEQUALITIES.md)
  with worked examples, guided steps, independent work and ordinary board mirroring.
- PR #200 merged as `5092ccd5750db9e260a743d96b1e706449721824` and was published.
  The merge is the verified starting commit of the current task; previous release
  evidence is retained in PR #200. The existing trainer remains at
  `trainers/ege-profile/log-inequalities/index.html`.
- Account and group-cabinet contracts remain outside that bounded addition and
  outside the current one-example lesson.

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
