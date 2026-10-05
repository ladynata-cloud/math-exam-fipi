# Grade-7 video library labels

- Date: 2026-10-06, Asia/Novosibirsk; review level SMALL.
- Base: `8125c176b6b0168c9c93e88a766ce6b144149762` (published PR #194).
- Branch: `fix/grade7-video-library-labels`.
- Post-publication UI inspection found stale introductory counts: 30 clips and
  15 topics despite the verified 60 clips/30 topics. Correct those two numbers,
  describe all three strands and point the course link to the full grade-7 hub.
- Owner standing authorization covers completing and publishing this course;
  no separate external review is required. No script, media, grading, database,
  account or pupil-state changes. Accepted architecture remains unchanged.
- Check the exact diff, existing video workflow and live heading/link after
  Pages deployment. No new tests for a static copy/link correction. Final gate:
  `GRADE7_VIDEO_LIBRARY_LABELS_OK`.
- Rollback is restoring this introduction only; no learner data is affected.
- Reconcile the preceding release in project status; retain final publication
  evidence in this follow-up PR without another status-only PR.
