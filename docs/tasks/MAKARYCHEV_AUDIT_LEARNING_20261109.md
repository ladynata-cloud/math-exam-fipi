# Макарычев 7–9: результаты аудита в курсах и тренажёрах

## Identity and authorization

- Task: MAKARYCHEV_AUDIT_LEARNING_20261109.
- Date: 2026-11-09, Asia/Novosibirsk.
- Owner request: «примени все ценные результата аудита курсов методайзера, видео курсов Геогебры, бриллиант, к курсам Макарычева», clarified «к курсам и тренажерам».
- Base: `main`, `89ee66bfe5068f16364d61d091fcbf1a1cbd6287`.
- Branch: `feat/makarychev-audit-learning-20261109`.
- Review level: HIGH (learning interactions and compatible saved learner work).
- START, local implementation, branch and commits: authorized by the current request.
- Checked publication was planned under the prior explicit owner authorization and [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md). Automatic action review nevertheless rejected this exact public GitHub upload; publication is blocked pending package-specific confirmation. No force, reset, rebase or gate weakening.

## Goal

Use the applicable, evidenced audit findings in the existing Makarychev 7–9
courses and practice trainers. The learner makes a prediction, changes a
mathematical model, explains an observation, and solves a fresh example.
Progress must distinguish independent first attempts, help, corrections and
familiar repetition. A correct final answer does not certify a proof.

## Evidence and scope

Evidence is recorded in the accompanying audit evidence report. Brilliant and
GeoGebra observations are selective; Methodizer findings include an adapted
lesson outline, not a completed pupil trial. Five-day repetition is a product
choice from the previous MathExam pilot, not an experimentally established
optimal interval.

In scope:

- Native `school/makarychev7/` and `school/makarychev8/` lessons, models and all
  their generated practice skills.
- The 93-lesson Makarychev 9 thematic course and `school/m9-exercises/` numbered
  trainers (existing exercises 1–97; no claim that 98–891 are implemented).
- Concrete model-family prompts and observation/explanation records;
  synchronized graph/formula/table/domain; exact keyboard-accessible inputs.
- Specific feedback, preserved first attempts and completed learner steps,
  optional help after errors, fresh same-skill practice and delayed repetition.
- Compatible sanitization/import/export of new optional metadata. Old answers,
  notes, task IDs, storage keys and valid records remain readable. Missing
  provenance is unknown, not independently mastered.
- Discoverable entry links, tests, source provenance bindings and release evidence.

Out of scope: copying proprietary course assets; completing missing textbook
exercises; merging unrelated pending PRs; modifying real pupil accounts or
assignments; paid provider audits; claiming a pupil trial or complete video audit.
PR #482's source additions are not included. Pending #497/#499 course progress
changes must be preserved when a later composition is needed.

## Acceptance criteria

- Existing course and practice routes continue to work with old saved work.
- Each model family provides a mathematical prediction and a concrete
  experiment; observations are saved separately from task correctness.
- Empty submissions do not count as mathematical mistakes. Help offered is
  not help used. Viewing help cannot manufacture independent mastery.
- Corrected and repeated work remain useful and visible, with a fresh practice
  action and a later-review action.
- A zero reciprocal coefficient retains the excluded input and removes the
  false vertical asymptote. Formula, table and plotted domain agree.
- Existing valid equivalent answers remain accepted; mathematical conditions
  and source exercise answers are unchanged.
- Mobile and keyboard interactions keep the problem accessible and preserve
  work on navigation/reload. Shared demonstrations do not create personal
  mastery without the existing personal-work boundary.

## Checks and review

Run existing course/model/state/import/DOM gates for each touched course,
targeted mathematical boundary tests and new behavior regressions. Check shared
school runtime regressions and source bindings/preservation. Inspect the ready
result independently. Run browser scenarios where the environment supports
them and preserve CI requirements; unavailable checks are never reported as
passes. Final marker: `MAKARYCHEV_AUDIT_LEARNING_PASS` only after applicable gates.

External provider review: not requested, not performed under standing policy.
Real-pupil and mini-group pilots: not performed. Sources must not contain
credentials, private learner data, or machine-specific paths.

## Risk and rollback

Main risks are saved-work compatibility, old uncertainty being relabelled as
independence, mobile first-screen crowding, and parameter edge cases. Roll back
presentation through a corrective release while retaining compatible readers,
optional saved-work fields and new learner records. Do not clear localStorage
or restore serializers that discard new drafts. Before release, re-read remote
main/head, validate any changed base and preserve concurrent approved changes.

## Execution record

Implementation and independent HIGH source review are complete, with no unresolved
blocking findings. New audit suites and scoped mathematical/state/import gates passed.
The final full native DOM runs passed at a 768 MB heap cap: M7 276/795 and
M8 722/1955. Grade-seven test scheduling now yields between batches without
removing assertions. Remote CI and real-browser acceptance remain required. Exact source/head,
passed/failed/not-run checks, PR, CI and public verification will be recorded in
the release report. No publication is asserted by this specification.

## External action status

No branch upload, PR, merge or publication occurred in this task. The destination
repository and owner push permission were verified read-only after an initial
rejection; a second upload attempt was again rejected by automatic review,
which requires explicit confirmation for this exact package. No alternate
external write route was used. The complete patch and commit bundle are prepared
for review; local check results do not imply a GitHub Actions or production pass.
