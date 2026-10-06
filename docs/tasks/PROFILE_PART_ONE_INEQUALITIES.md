# Profile first part and detailed inequalities

- Task: PROFILE_PART_ONE_INEQUALITIES
- Owner: site owner; implementation requested 7 October 2026, Novosibirsk time.
- Base: main `a34ef76adc4165adf489f6025de8f3281cc4b592`.
- Branch: `feature/profile-part-one-inequalities`.
- Review: HIGH for breadth of course content and shared route behaviour. Existing
  start and detailed-lesson patterns are reused, not a new platform archetype.

## Goal and approved scope

Extend the clear one-action-at-a-time route from positions 1–3 to every first-part
position, and teach second-part inequalities through explicit domain systems,
separate interval solutions, aligned number lines and their intersection.

The official FIPI 2027 draft, checked on 7 October, has 13 first-part positions
and inequalities at position 16. Preserve the 2026 banks and explain the numbering
change rather than silently relabel old exams. Retain existing lesson/task IDs,
saved-work key, today's two detailed logarithm lessons and the wider logarithm bank.

Add authored guided and separate independent examples for probability and random
variables; equations and expressions; derivatives and functions; applied formulas,
word problems and finance. Models use the actual task data and do not expose
unearned answers. Add detailed rational, exponential, logarithmic and radical
inequalities using the existing guided lesson runtime.

Out of scope: the OGE-priority homepage, accounts, authentication, backend,
production learner records, server contracts, board registry changes, videos and
remaining second-part positions. This is an instructional route across every
first-part position, not a claim to cover every FIPI subtype or a full mock exam.

## Acceptance and gates

- Every first-part number opens real guided and independent practice.
- Prior accepted work and drafts survive reload; hints are counted accurately.
- New data has independent final/intermediate mathematics checks; inequalities
  additionally have boundary and interval membership checks.
- Task-bound figures/tables support the question, including accessible controls.
- Browser journeys cover new themes, old routes, 360px mobile, keyboard, export,
  error handling and a clean console. Existing mathematics and browser gates pass.
- Final gate: PROFILE_FULL_COURSE_OK, exact-head CI and public byte/live checks.
- Independent internal mathematics and interaction review; external review waived
  by the owner's explicit standing instruction. No external-review claim.

## Risk, permissions and rollback

Risks: wrong numbering, mathematical/domain errors, answer leakage, crowded UI,
and accidental changes to older progress or entry links. Mitigate with source
verification, independent formula/boundary checks and old-route regression.
Rollback: revert this static-content/route delta; no database migration or
production account changes. Existing direct URLs remain available.

The current request authorizes implementation in the cloud. Owner's standing
explicit publication permission and waiver of separate external review apply.
Create a draft PR, verify scope, CI, fresh base and reviewed-tree identity before
publication. No force, reset, rebase, admin override or weakened gate is allowed.

## Execution

- 36 new themes / 216 new first-part exercises; 62 themes / 372 exercises in the
  combined start course, including 24 earlier preparatory trigonometry exercises.
- 18 detailed inequalities / 126 steps / 39 interactive axes reuse the existing
  lesson runtime. The only shared runtime extension is a same-origin authored
  report link so a chosen example remains identifiable when sent to the teacher.
- Independent audit recomputed all 216 new final answers without using the
  author test oracles. Bank-specific gates verify all intermediate answers and
  geometric/domain constraints. Inequalities passed 108,162 original-expression
  comparisons, including excluded points and strict/non-strict boundaries.
- Full browser gate: 216 new models, 76 completed journeys across every new theme,
  six further inequality journeys, 360px/desktop/zoom, retained steps, reload,
  independent resume, help accounting, keyboard and reports; no console or HTTP
  failures. Separate inequality gate covers all 18 examples and 126 steps.
- Existing 108-task start, first-three, route/homework, logarithm lessons, full
  profile package and 1,440-entry board picker regressions passed.
- Independent review fixed premature graph-answer reveal and example selection
  in report links. Visual review covered mobile and desktop examples.
- A browser gate initially tried a slider inside a collapsed disclosure; opening
  the disclosure before real keyboard input fixed the test setup. No runtime or
  test requirement was weakened. Local browser execution uses installed Chromium
  headless shell; no sandbox escalation or access-control bypass was needed.

Final gate: PROFILE_FULL_COURSE_OK locally. Exact head, PR, CI, fresh base and
public release evidence are recorded in the PR; no production pupil writes.
