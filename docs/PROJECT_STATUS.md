# MathExam project status

Updated: 2026-10-05 (Asia/Novosibirsk)

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

## Current: learner free route and original paper homework

- Scope: [free route](tasks/LEARNER_FREE_ROUTE.md), branch
  `feature/learner-free-route`, verified base
  `4df45e5d3b5825a21451f5cc90838260fb9f6f39`.
- Current owner instructions authorize publication without separate external
  review. Free order/pace, prerequisite detours, visible progress, explicit
  submission, teacher-assigned credentials, first-entry guide and additional
  authored paper homework are one connected pupil workflow.
- Local gate passed: 118 server tests, 8,400 checked paper tasks, the full new
  browser flow and legacy cabinet/homework/exam/remediation gates. Independent
  audit findings about stale review and premature submission were corrected.
  Production pupil creation
  and teacher activation remain pending because browser observation of the
  hosting panel is blocked by native-credential protection.
- Next: publish one scoped PR and run exact-head CI,
  verify production and provision the pupil only with authenticated access.

## Published code: independent homework method and teaching videos

- PR [#185](https://github.com/ladynata-cloud/math-exam-fipi/pull/185) merged as
  `4df45e5d3b5825a21451f5cc90838260fb9f6f39`, tree
  `759b8de0ce2dc588a76982e9941969374698bebb`. Authorized base remained
  `a024f6c0f22bd58077bb3e31c2911ba324abb1a8`; no drift. Exact-head CI passed.
- The latest owner clarification requests automatic narration plus click sounds,
  retaining readable on-screen explanations and a text/step alternative.
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
