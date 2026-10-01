# MathExam project status

Updated: 2026-10-01

## Current evidence

- Authoritative remote `main` at task start:
  `010e89c75c0fe110b57c983c728b8216fb38cd9d`.
- The base-EGE trainer and foundations/percentages materials are present on
  current main. The base trainer contains 68 fixed tasks covering 21 positions.
- Current approved work: `EGE_BAZA_FOUNDATION_MODULE_1`, first module of the
  owner's mini-group base-EGE course, on its own branch
  `course/ege-baza-foundation-module-1`.
- The first module is implemented. Mathematical/static and 81 DOM integration
  checks pass, as does the existing base-EGE gate. The browser gate is blocked
  by this execution environment; desktop/mobile visual checks remain pending.
  Merge and deployment are not authorized.
- Latest open-PR search confirms unrelated #146, #138, #137, #129, #126 and
  #117 remain open. Their branches are not used as a base for this task.
- The August snapshot below is historical; its claims about current main,
  active work and open PRs must not be treated as current deployment evidence.

## Review and readiness

New local progress/assessment behavior is classified HIGH. Author checks and a
Draft PR do not constitute external approval. Independent/external review or an
explicit policy-compliant owner waiver is required before merge, followed by
separate merge authorization and the base-drift check. Exact tests and head are
recorded in the task PR and handoff.

## Next three actions

1. Complete the pending browser/visual gate for the first module's Draft PR.
2. Review the working module and resolve HIGH-level review requirements.
3. After separate merge authorization, run the release workflow and production
   smoke, then choose the next bounded course module.

---

# Historical snapshot (2026-08-15)

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

## Historical next actions (not current authorization)

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
