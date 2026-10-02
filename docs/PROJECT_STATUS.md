# MathExam project status

Updated: 2026-10-03

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

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
