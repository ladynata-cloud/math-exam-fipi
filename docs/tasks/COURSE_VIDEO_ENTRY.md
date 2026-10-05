# Visible video and practice entry

- Date: 2026-10-05 (Asia/Novosibirsk).
- Base: main `7e007ff73a25a16faa1e6913b9c9af819c2ec435`.
- Branch: `fix/course-video-entry`; review: MEDIUM.
- Owner feedback: some activities appear noninteractive and the existing
  voice-free videos are hard to find. Standing publication permission applies;
  separate external review is waived. No voice synthesis or new video render.

## Evidence

The seven-entry browser audit found four home screens and two theory stages
without answer controls at entry. Each becomes interactive after one explicit
practice selection; angles already exposes choices. The video link was below
the first viewport on desktop and mobile; no inline player existed.

## Scope

Make the existing seven MP4s visible near the start of the selected topic, with
normal playback controls and a direct-file fallback. Stop previous playback on
topic change. Make practice and the text reminder easy to distinguish. Audit
all seven exact activity links; where they start at theory, provide an explicit
practice entry using the existing interaction, preserving saved work.

Keep the printable sheet on one A4 page. Preserve existing normal trainer entry,
managed cabinet state, mathematical generators and export/render contracts.
No account, persistence, assessment or hosting-setting changes.

## Verification and release

- All seven MP4s load and can play; topic switching changes/stops the source.
- Desktop/mobile navigation and media fallback; print remains one A4 page.
- Exact trainer entry shows actual answer/choice controls and feedback.
- Existing unrelated entry modes and saved attempts remain intact.
- Focused independent review, affected local gates and exact-head CI.
- Publish one scoped PR, verify merged tree/parent and public file bytes.
- Gate: COURSE_VIDEO_ENTRY_OK. Revert scoped UI/entry files to roll back.

## Local result

`COURSE_VIDEO_ENTRY_BROWSER_OK`: all seven MP4s decode at 1280×720 and advance
playback; all fourteen desktop/mobile topic layouts expose the player in the
first viewport without overflow. Topic switching pauses playback; the media
error fallback and native/custom controls work. All seven printed sheets fit
one A4 and retain the complete worked example. All seven exact practice links
accept an answer and respond. Ordinary entry, managed entry and complete saved
Path state at stages 2/3/4 are preserved. No JavaScript errors, external requests
or server writes occurred. Focused independent code review found no blockers.
Syntax and whitespace checks pass. Exact-head CI and production byte verification
will be recorded in the scoped release PR; no real pupil-account flow is claimed.
