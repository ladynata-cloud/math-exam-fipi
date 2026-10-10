# Profile route: start with the thirteen exam tasks

## Identity

- Task: PROFILE_EXAM_FIRST_ROUTE
- Date: 2026-10-10
- Base: main, `517f254338013911cfabcd1a72adbc1e00cba801`
- Branch: `feat/profile-exam-first`
- Review level: MEDIUM
- Architecture: accepted ADR 0010; existing public course and repair navigation.

## Goal and approved scope

The owner requires the profile learner's route to begin with the catalogue of
thirteen exam positions. A learner first tries an exam task. A difficulty can
lead to the relevant school-mathematics topic, followed by a return to the same
original task. A whole school course or preliminary diagnostic is not required.

- Show thirteen numbered choices directly on profile cabinet home/course/route.
- Reuse the canonical exam mapping through a deterministic public-data projection
  under learning/, which the existing production server already serves.
- Make a real independent task the primary course entry; examples, theory and
  diagnosis remain available as optional help.
- After a valid incorrect answer, expose relevant prerequisite help without
  forcing navigation. Empty or unparseable input is not a mathematical error.
- Preserve original task identity, answer draft and step through a foundation
  detour and reload; opening help must not become independent mastery.
- Preserve existing assignments, free attempts, other directions and local
  progress warnings. Reconcile preceding release evidence in project status.

Excluded: new mathematics or numbering, score thresholds, progress schemas,
answer synchronization, authentication, profile storage, server routes, Docker,
hosting configuration, pupil data in Git, or changing real pupil results.

## Acceptance and checks

- [x] Profile home/course/route start with exactly thirteen numbered choices.
- [x] A choice opens a real profile task without compulsory prerequisite work.
- [x] All thirteen entries match the canonical course map.
- [x] Valid errors reveal relevant help; blank/unparseable input does not.
- [x] Foundation and trigonometry detours return to the same saved task.
- [x] Help remains assisted work; prior work and other routes stay accessible.
- [x] Desktop, mobile and reload checks pass with synthetic learners.
- [ ] Focused independent code review and applicable exact-head CI pass.
- [ ] Published cabinet/course assets match the reviewed release.

Required gates: `PROFILE_EXAM_FIRST_BROWSER_OK`, `LEARNING_PROFILE_ENTRY_OK`,
existing calm/readiness course checks as affected, generator `--check`, syntax
and `git diff --check`. Exact-head CI and publication evidence belong in the PR.
Robots simulate behavior and cannot demonstrate actual human learning efficacy.

## Review, risk and rollback

MEDIUM: bounded front-end navigation using existing persistence contracts.
Main risks: hiding old work, incorrect catalogue links, overwriting a return
target during nested help, or miscounting assisted work. A focused independent
review and actual-browser scenarios cover these behaviors. External review is
not required at this level unless requested by the owner/reviewer.

Rollback the front-end change and restore the previous script URLs. Do not
erase browser saves or alter pupil accounts. No database migration is needed.
Remote handoffs contain scoped public source and synthetic fixtures only.

## Authorization and execution

The current owner request authorizes this correction to the previously
authorized cloud course and cabinets. The standing cloud-publication instruction
continues to cover the scoped correction after review and exact-head checks.
One task, branch and PR; fresh-main guard before merge. No force, rebase,
protection override, weakened tests or unrelated roadmap work.

## Execution evidence

- Focused learner robots passed: thirteen independent entries, targeted help,
  empty/unparseable input, school and nested trigonometry detours, preservation
  of original task/draft/accepted step through reload, assisted-work accounting,
  and new independent work after completion. Desktop and mobile screenshots
  were visually inspected; the catalogue has no clipped cards.
- Cabinet robot passed home/course/route catalogue checks, canonical mapping,
  old free-attempt resumption, existing directions, parent and teacher views.
- Independent MEDIUM source review approved the scoped product diff against
  the recorded base, without P1/P2 findings. Final-head identity and CI remain
  release conditions. Review confirmed that the generated catalogue is served
  by the existing production asset paths.
- Generator `--check`, relevant JavaScript syntax and `git diff --check` pass.
- Initial DOM-test launch lacked jsdom; rerun with jsdom 26.1.0 passed
  `PROFILE_INPUT_DOM_OK`. This was an environment failure, not a passing test.
- Both new gates passed, including the final
  `PROFILE_EXAM_FIRST_BROWSER_OK` marker. Affected regressions passed: calm
  unit checks 84/84; four calm learner personas 186/186; six existing learner
  personas 341/341; readiness browser 36 tasks and 86 answers at 360/1280 px;
  readiness mathematics 37/37; readiness plan 12 questions, 68 valid targets
  and four cases; algebra final-answer 48 answers and 137 wrong rejections.
- Local browser verification used Playwright 1.56.1, Chromium 141.0.7390.37,
  jsdom 26.1.0 and Node 24.19.0. The first newer-browser download returned
  invalid archives; local verification used the successfully installed
  compatible browser. CI retains its existing pinned browser versions.
- First cloud profile run failed because the legacy browser test expected the
  old topic catalogue at an empty hash. That check now opens explicit `#home`
  and retains all topic assertions. The full-course gate's former guided-entry
  expectation was also updated to independent entry, with additional exam
  position and unassisted-attempt assertions. Product code was unchanged.
  Navigation-only attempts use a separate synthetic learner so subsequent
  rule reading does not invalidate the existing fresh-credit fixture; assisted
  work and mastery assertions remain intact.
  The new exam-first robot runs in both affected course and cabinet workflows.
- Final regression totals, exact-head CI, merge and live-asset evidence are
  recorded in the PR. Unchecked acceptance items are not claims of completion.
