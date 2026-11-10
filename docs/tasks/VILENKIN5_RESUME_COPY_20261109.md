# Виленкин 5: точные названия продолжения

## Identity and approved scope

- Task: VILENKIN5_RESUME_COPY_20261109; owner: MathExam; date: 2026-11-09.
- Review: SMALL; isolated explanatory copy, no runtime or architecture change.
- Base: PR #502, `codex/course-design-standard`, exact head `bb95d9b7c10c75d436c1d679318d9700ebb24e7b`.
- Branch: `fix/vilenkin5-resume-copy-20261109`; follows #502.
- START, branch, commits, upload and Draft PR were explicitly approved in the current course-update task. The executing agent does not merge or deploy; the coordinator owns release under the existing owner authorization.

## Goal and evidence

The public grade-5 entrance named an absent "Продолжить обучение" button.
Current `school/app.js` renders "К следующему навыку" for the next skill and
"Вернуться к своей задаче" only when `vilenkinDraft(course)` returns a saved
task. The two actions remain distinct. The coordinator approved replacing only
the last sentence of the "Как начать или продолжить" paragraph with two
sentences naming those exact controls and the saved-task condition.

Only `courses/vilenkin-5/index.html` and this task record change. Preserve the
first two sentences, links, HTML structure, #502 styling, runtime, task banks,
serializers, source-binding manifest and all other predecessor files.

## Acceptance, checks and review

- The two quoted labels match the current course controls; resume is conditional
  on saved work and opens its saved place.
- Inspect the exact two-file diff and run `git diff --check`.
- Run existing SEO/sitemap checks and verify fresh/saved-work branches with the
  actual workshop DOM handlers; add no mirror test or runtime change.
- SMALL self-review; no new trainer or mathematical claim, so no external
  consultation or pupil trial is required or claimed.
- Actual-head CI is required before release. Local Chromium is unavailable due
  to the environment's socket restriction; no local browser pass is claimed.

## Risk, rollback and execution

The risk is wording that conflates next-skill selection and exact draft resume.
Revert only this copy commit if needed; retain all predecessor persistence and
learning-route backup adapters. The existing entrance is a navigator
`existingPages` entry, so no bound-source receipt changes are needed.

Local checks passed: sitemap 12/12; generated sitemap 558 URLs; SEO entrances,
canonicals and local links; `git diff --check`. Actual DOM handlers confirmed
both exact labels, no resume on a fresh course and restoration of the original
lesson/input after saving a draft. Only the two approved files changed.
Exact committed head/PR and current-head CI are recorded in the Draft PR.
No merge or publication is performed by this task's executing agent.
