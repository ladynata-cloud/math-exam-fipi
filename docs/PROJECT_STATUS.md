# MathExam project status

Updated: 2026-08-15

This is the short operational snapshot. Reconcile it against production evidence
at the start of the next approved task; use [ROADMAP.md](ROADMAP.md) for sequence
and [REVIEW_POLICY.md](REVIEW_POLICY.md) for review requirements.

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
first independent review requested changes; admission, cost/storage quotas,
worker fencing, deadlines, streaming, persistence and reproducible-build
findings have been remediated and require exact-head re-review.

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
`#102`. Video Factory authoring, DVI regression, 17/17 worker API/storage/queue
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

1. Finish Video Factory tests and local mocked end-to-end smoke, then open the
   exact-base Draft PR with architecture and test evidence.
2. Obtain explicit owner acceptance of ADR 0002 and exact-head independent
   security/code review (or a policy-compliant waiver).
3. After separate merge/deployment authorization, configure the second Amvera
   app, publish it and run the canonical production smoke.

## Maintenance rule

At the start of each approved task, compare this snapshot with actual remote
`main`, open PRs, gates and production evidence. Update it within that task when
stale and keep exactly the next three concrete actions. Never predict a
successful merge or deployment before it happens.
