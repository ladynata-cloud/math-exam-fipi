# Video Factory v1

## Identity

- Task: automate creation of narrated DVI explanation videos
- Owner: ladynata-cloud
- Date: 2026-08-15
- Base branch: `main`
- Base SHA: `e9347d544a90a8d151051ee29a047d51a906196f`
- Planned branch: `agent/video-factory-v1`
- Review level: `NEW_ARCHETYPE`
- Related ADR: `docs/adr/0002-video-factory-v1.md`
- ADR status: Proposed; rollout is blocked until explicit owner acceptance

## Goal

Turn the existing DVI video studio into a small production pipeline: a teacher
chooses a task, preset and format, presses one button, watches queued/rendering
status and downloads the finished narrated MP4. Rendering must be isolated from
the progress server and must not change student progress.

## Context and evidence

- Production `main` is `e9347d544a90a8d151051ee29a047d51a906196f`.
- The published DVI studio already exposes deterministic scene presentation and
  narration manifests through `window.MathExamVideoStudio`.
- The existing page previews scenes in the browser and downloads scripts, but
  has no text-to-speech, queue, renderer or video storage.
- Amvera supports a separate application built from the same repository and a
  persistent mount. The worker therefore uses its own `/data`, never the board
  server's runtime or volume.

## Approved scope

### In scope

- add a separate Node video-worker with a durable single-concurrency queue;
- provide authenticated create/status/download APIs with strict origin checks;
- support OpenAI and Yandex SpeechKit text-to-speech providers;
- render existing DVI scenes with Chromium and assemble H.264/AAC MP4 with
  FFmpeg in 16:9 or 9:16;
- add captions, friendly job status and a one-click MP4 dialog to the studio;
- preserve preview, script export, trainer mathematics and progress isolation;
- add Docker/Amvera templates, operating instructions, tests and a focused gate.

### Out of scope

- automatic publishing to YouTube, VK Video or social networks;
- user accounts, billing, arbitrary uploaded HTML or arbitrary target URLs;
- changes to the board-server progress API or its persistent data;
- replacing the current trainer generators or teaching content;
- production rollout before ADR acceptance and exact-head authorization.

### Files or areas that must not change

- `board-server/index.js`, progress storage and registry contracts;
- student trainer progress logic and teacher assignment links;
- existing DVI mathematics, answers and guided step content.

## Acceptance criteria

- [ ] One studio action creates an authenticated render job.
- [ ] Jobs survive worker restart and resume from `queued` after interruption.
- [ ] Only an allowlisted studio origin can call the API.
- [ ] The admin secret is accepted only in an authorization header and is never
      written to URLs, HTML, logs, job metadata or generated files.
- [ ] The worker accepts only known tasks, presets and output formats and always
      navigates to a configured trusted studio origin.
- [ ] OpenAI and Yandex TTS adapters produce audio through server-side keys.
- [ ] A renderer creates captioned 16:9 and 9:16 MP4 output from existing scenes.
- [ ] A failed job has a useful sanitized message and never exposes credentials.
- [ ] The studio remains fully usable for preview/script export if the worker is
      unavailable or not configured.
- [ ] Video generation does not create or mutate student progress.
- [ ] Unit, focused authoring, existing DVI and board-server regression tests pass.

## Checks and gates

- Required tests: `npm test` inside `video-worker`; existing board-server tests
- Required static checks: `node tools/video-factory-v1-gate.mjs`, inline-script
  parse, existing DVI gate, `git diff --check`
- Manual checks: studio dialog, authorization failure, mocked job lifecycle,
  status recovery, output download, preview fallback and progress isolation
- Final gate marker: `VIDEO_FACTORY_V1_AUTHORING_CHECK_OK`
- Production smoke: waits for accepted ADR, exact-head merge authorization,
  separate Amvera application configuration and deployment authorization

## Review plan

- Review-level rationale: this introduces a new server, persistent queue,
  privileged TTS credentials and a browser/FFmpeg render runtime.
- External review required: independent security/code review is mandatory unless
  the owner records an exact-head waiver allowed by repository policy.
- ADR acceptance required: yes, by the owner after reviewing the Draft PR.
- Sanitized handoff: repository-relative code, public documentation, hashes and
  test output only; never share API/TTS secrets or generated authorization data.

## Risk and rollback

- Main risks: secret exposure, server-side request forgery, browser sandbox
  escape, disk exhaustion, queue loss, runaway TTS cost or board-server impact.
- Controls: separate app/volume, fixed trusted URL, strict schema and allowlist,
  constant-time bearer comparison, body/rate/output limits, one render at a time,
  fail-closed production configuration and non-root container.
- Rollback: disconnect the video API URL or roll back the separate application;
  the published studio retains local preview and script export.
- Data compatibility: job metadata and MP4s are isolated below the worker's
  `/data`; no progress records require migration.

## Permissions

- `START` granted by owner in the current task conversation: yes
- Branch creation, local commits, push and Draft PR: allowed
- ADR acceptance: **not yet granted**
- Merge and deployment: **not allowed without separate exact-head authorization**

## Execution record

- Actual branch: `agent/video-factory-v1`
- Actual base SHA: `e9347d544a90a8d151051ee29a047d51a906196f`
- Actual head SHA: recorded in the Draft PR
- PR: Draft PR created from the exact production base
- Tests passed: Video Factory authoring gate; DVI authoring gate; 23/23 worker
  unit/integration tests; 41/41 board-server regression tests; inline studio
  script parse; authorization/origin, create/status/download, persistence and
  interrupted-job recovery tests; atomic admission/idempotency, hourly/daily
  budget and media quota, exclusive worker handoff without stale takeover,
  bounded graceful cancellation and re-queue, attempt-media cleanup,
  fail-closed cleanup errors, subprocess deadline,
  streamed TTS size cap, persistence-failure and path-sanitization tests;
  reproducible package-lock tree validation; `git diff --check`
- Tests failed: none in the final run
- Tests not run: local visual browser smoke was blocked by the browser's local
  URL policy; full Chromium/FFmpeg/TTS container render awaits CI/staging secrets;
  production smoke awaits ADR acceptance, merge and deployment authorization
- Scope deviations: npm registry access is restricted in the local environment.
  A lockfile with verified Playwright `1.55.0` package metadata is committed and
  `npm ls --package-lock-only --all` passes; real container `npm ci` remains a
  staging check.
