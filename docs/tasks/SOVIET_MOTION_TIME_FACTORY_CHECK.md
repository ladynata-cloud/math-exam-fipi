# Soviet mathematics: time of travel and a real video-factory path

## Identity

- Owner: repository owner.
- Date: 2026-10-15 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `e01b2780f16f9771defee5d862eec6de581a554f`.
- Branch: `feat/soviet-motion-time-factory-check`.
- Review level: `HIGH` because this adds a bounded production worker task and studio mapping.
- Architecture: reuse the existing validated job, browser-rendering and shared course-board contracts; no new platform primitive.

## Goal and evidence

Continue the owner's Soviet-textbook arithmetic series with topic 61, finding
time from distance and constant speed, and provide an actual Amvera render path
for it. The existing 60 videos were made with the local Canvas/FFmpeg tool;
success of that tool alone is not evidence that the restored cloud worker works.
PR 246 was merged by the owner, and Pages run 38628033755 deployed its exact
tree. Both restored Amvera applications were observed running 1/1.

## Scope

- One stable topic `motion-time`, twelve original conditions, clear school
  wording, stepwise explanation/check, preserved accumulated board.
- Topic references to Princev/Yagodovsky, Arithmetic 5–6, 1966, sections 24
  and 119, printed pages 51 and 284. Exercises are original, not textbook task
  reproductions; no invented exercise numbers.
- Narration, silent preview, and a studio using the same course model and board.
- One namespaced worker task `soviet-motion-time`, fixed presets, existing
  explicit-origin and token requirements, existing queue/render contracts.
- The owner's supplied round red “Made in USSR” image, unchanged, as the
  course emblem beside its title and existing entry cards. Preserve the public
  site's OGE priority; do not redesign unrelated pages.
- Focused mathematical, board, studio, worker and real local-render checks.

Out of scope: the following meeting/catch-up topics, credentials, student data,
authentication changes, paid TTS, storage migration, old media replacement,
queue replay, unrelated curriculum and automatic publication.

## Acceptance and gates

- All twelve conditions have exact answers, meaningful checks and distinct
  wording/data; the initial drawing does not disclose the unknown time.
- Existing sixty IDs, MP4 blobs and saved-result behavior remain intact.
- Studio presets use their own correct numbers, cumulative shared drawings,
  readable source labels, and silent 16:9 output. This initial shared-board
  task explicitly rejects portrait output rather than shrinking the board;
  existing tasks retain both of their current formats.
- Existing worker requests remain compatible; unsupported input stays rejected.
- Run relevant course/content/extension/browser tests, worker tests, renderer
  checks, final diff and independent review. Record exact results in the PR.
- Local rendering and an actual production job are reported separately.
- Final code gate: `SOVIET_MOTION_TIME_FACTORY_READY`.
- Production completion requires an authorized cloud job to reach ready and
  its downloaded MP4 to be inspected; a running container is insufficient.

## Review, permissions and rollback

The current owner request authorizes this implementation, isolated branch,
commit, push and Draft PR. It does not invent a merge/deployment approval or
an external-review waiver. Independent HIGH review and relevant gates are
required; external review or an explicit owner waiver remains a release gate.
Separate exact-head publication approval is required by AGENTS.md.

Deploy the studio before enabling its new worker task. Revert the scoped
frontend/worker patch for rollback; retain any already generated MP4 and
preserve the existing worker data volume. Do not delete locks or queue records.
Browser access restrictions and credential handoff are operational limits,
not reasons to bypass authentication or change endpoint protections.

## Execution record

Implementation, review, exact head and validation evidence are recorded in
the Draft PR. No production rendering is claimed before job/download evidence.

Local preparation completed:
- Twelve original conditions, their arithmetic and narrated timings passed.
- Existing content/extension gates passed; all sixty prior topic plans, video
  blobs, narration entries and the progress implementation remain unchanged.
- The new local Canvas preview is 111.5 seconds, H.264, 1280 x 800, without
  audio. Its manifest/checksum and all sixty-one stored videos passed checks.
- Six targeted worker validation/regression tests and syntax/whitespace passed.
- The original owner-provided emblem was copied unchanged into the course and
  existing Laboratory entry. It does not replace the site's OGE emphasis.
- Local browser launch is blocked by the execution environment's socket
  restriction. No sandbox workaround was used. Standard repository CI runs
  the actual browser, export-recovery and full localhost worker-render gates;
  screenshots and a rendered MP4 are retained as workflow artifacts.
- CI results, independent review and remaining release decisions belong to
  the exact-head PR record. Production Amvera is still unverified by a job.
