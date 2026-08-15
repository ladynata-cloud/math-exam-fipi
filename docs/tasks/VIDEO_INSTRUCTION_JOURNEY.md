# MathExam task specification

## Identity

- Task: Two DVI video modes with a real learner journey and voice-over scripts
- Owner: ladynata-cloud
- Date: 2026-08-15
- Base branch: `main`
- Base SHA: `09f0889b7e505eb43df6722dc646f6146c9e6e15`
- Planned branch: `agent/video-instruction-journey-20260815`
- Review level: `HIGH`
- Related ADR: `docs/adr/0002-video-factory-v1.md`
- ADR status in repository: `Proposed`; implemented production behavior is established by code and release evidence

## Goal

Let a teacher build two complementary videos for every DVI task: an ideal mathematical solution and an instruction showing a realistic learner path through the trainer. The learner-path video must show an error, feedback, a hint, a corrected answer, navigation buttons and the final screen with an explicit cursor, yellow focus and click sounds, while background music is removed. Both modes must export a matching Russian voice-over script for the teacher to record.

## Context and evidence

- Production already has an isolated `video-worker`, durable `/data`, bearer-protected jobs and a silent-caption mode.
- The current ideal manifest shows only correct answers.
- The current `silent` audio provider generates a musical chord instead of silence.
- The renderer accepts only server-authored manifests from the configured studio URL.

## Approved scope

### In scope

- Add validated `videoType` values `ideal-solution` and `student-path` to the fixed render request.
- Preserve the existing ideal mathematical solution.
- Add a realistic student-path manifest and matching studio preview.
- Add an explicit cursor, yellow target highlight and click sound to student-path click scenes.
- Replace background music with silence.
- Export aligned voice-over scripts for both video types.
- Update focused tests, gates and deployment documentation.

### Out of scope

- Uploading or storing the teacher's recorded voice.
- Mixing a supplied voice file into MP4 in this PR.
- Publishing to YouTube/TikTok or embedding final media in student pages.
- Changes to bearer authorization, queue ownership or persistence architecture.

### Files or areas that must not change

- `board-server/`
- learner progress and teacher-panel contracts
- existing task content and answer logic

## Acceptance criteria

- [x] The MP4 dialog offers both video types.
- [x] Ideal-solution output preserves the existing correct mathematical walkthrough.
- [x] Student-path output includes one representative error and hint, then all correct transitions through the final screen.
- [x] Every student-path click scene shows a cursor and yellow target focus before an audible click.
- [x] Silent mode contains no background music.
- [x] The script dialog exports separate aligned Russian voice-over scripts for both types.
- [x] Unknown `videoType` values fail closed.
- [x] Existing security, durability and quota tests remain green.

## Checks and gates

- Required tests: `npm test` in `video-worker`
- Required static checks: inline-script compilation; `git diff --check`
- Manual checks: both manifests for tasks 18–20 and presets 1–3; scene count at most 30; cursor targets resolve
- Final gate marker: `VIDEO_FACTORY_V1_AUTHORING_CHECK_OK`
- Checks intentionally not run: production render/deployment until separate merge and deployment authorization

## Review plan

- Review-level rationale: fixed API contract and server-side FFmpeg/render behavior change
- External review required: yes, independent exact-head review before merge unless the owner explicitly waives it with rationale
- Sanitized handoff constraints: source and tests only; no bearer values, environment secrets or private files
- Required provenance: provider, PR, base SHA, head SHA, verdict and timestamp/source

## Risk and rollback

- Main risks: scene/state mismatch, overlay hiding controls, malformed audio filter, longer render time
- Rollback plan: revert the single squash merge and redeploy the previous worker/studio revision
- Data or compatibility considerations: old stored jobs without `videoType` default to `ideal-solution`; no job or media migration

## Permissions

- `START` granted by owner in the current task conversation: yes
- Branch creation allowed: yes
- Local commits allowed: yes
- Push allowed: yes
- Draft PR allowed: yes
- Merge allowed: no unless separately authorized after review
- Auto-merge allowed: no unless separately authorized
- Deployment allowed: no unless separately authorized

## Execution record

- Actual branch: `agent/video-instruction-journey-20260815`
- Actual base SHA: `09f0889b7e505eb43df6722dc646f6146c9e6e15`
- Actual head SHA: pending
- PR: pending
- Commits: pending
- Tests passed: `VIDEO_FACTORY_V1_AUTHORING_CHECK_OK`; `npm.cmd --prefix video-worker test` (30/30); `git diff --check`; local browser smoke for both MP4 choices, both voice-over sections, cursor/yellow focus and learner navigation
- Tests failed: none after fixes; the browser smoke caught and closed a per-scene `videoType` propagation defect before publication
- Tests not run: production deployment/render
- Scope deviations: none
