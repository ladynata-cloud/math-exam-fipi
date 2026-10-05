# Grade 7: another twenty-four trainers and thirty silent videos

## Identity and permission

- Date: 2026-10-06, Asia/Novosibirsk.
- Base: `main` at `a69da715e1f319cf13fd05d769a42878f3922a64`.
- Branch: `content/grade7-next-course-block`; review level: HIGH.
- Owner requested another equivalent block across algebra, geometry and
  foundational mathematics. Standing owner permission covers implementation,
  publication and deployment without separate external review. Independent
  mathematical and code review remain required. No production credentials or
  pupil records belong in source, fixtures or public review evidence.
- Architecture: accepted ADR 0010. Reuse its existing managed Path family;
  proposed school-workshop ADR 0005 is not an authority for server persistence.

## Verified baseline and intended outcome

The preceding grade-7 release has twenty-four opening algebra lessons and
fifteen video topics with two clips each: thirty active videos. The separate
archived welcome clip does not count. The managed cabinet catalog currently
contains 143 entries: 107 Path items and 36 foundation items. Most existing
school-workshop lessons still save only in the current browser.

Add twenty-four focused original trainers, eight each in algebra, introductory
geometry and arithmetic foundations. Add fifteen matching topic pairs: a silent
animated mathematical explanation and a recording of the actual trainer UI.
The resulting active video library has sixty clips across thirty topics.
These are new focused task families, not a claim that the underlying school
topics were absent or that either whole textbook is now covered.

## Scope

- Algebra: expression structure, opposite expressions, two-variable term
  collection, negative-fraction substitution, equations with two brackets,
  numerical denominators, decimal coefficients and rectangle word problems.
- Geometry: segment order, midpoint chains, angle naming, angle addition,
  bisectors, adjacent-angle equations, vertical angles and correspondence in
  triangles already given as congruent. No unverified old-edition page mapping.
- Foundations: mixed-number borrowing, cancelling factors in a product,
  division by a fraction, decimal place alignment, decimal divisor scaling,
  signed fraction sums, ratios after unit conversion and percentages through
  proportions.
- Each task family has varied seeded conditions, at least three structural
  modes, guided intermediate responses, method hints and a fresh independent
  example. Correct earlier lines stay visible. All fractions and decimal
  generators use exact rational or integer-scaled arithmetic.
- Register all new tasks in the existing managed catalog with position null,
  grade-7 metadata and training-only status. They must not enter an EGE trial
  exam or change existing task IDs, seeds or versions.
- For these new grade-7 tasks only, assess familiarity against canonical
  question identities across the learner's history in the same trainer/content
  family, ignoring seeds. Exclude the current attempt and current unpublished
  homework drafts; include started and archived work. Resetting progress does
  not erase exposure. Archived homework whose former publication status is
  uncertain is conservatively familiar. Inspect at most 500 prior task specs
  plus one overflow row; overflow cannot produce an independent-success claim.
  Try at most 15 replacement generations, then recheck exposure atomically on
  completion. An unassisted correct familiar answer is `practiced`; teacher and
  hint assistance retain precedence. Existing non-grade-7 outcomes are unchanged.
- Persist draft, answers, help and diagram state through the current attempt
  protocol. Support teacher observation/control, restoration, history and
  submission. A selected geometric element is semantic state, not hidden DOM.
- Real managed-frame testing exposed a pre-existing blocked native form submit:
  the intended iframe sandbox excludes form submission. Handle explicit answer
  button clicks and Enter through the existing local check function without
  relaxing that sandbox. Prevent duplicate/IME submits and preserve readonly
  control and server-side validation. Test the actual sandboxed interaction.
- Deep links present an activity before explicit start/continue; opening a
  link or watching a video creates no result and marks no independent success.
- Fifteen new mathematical scenarios have three checked presets, real
  animation and cumulative correct records. The fifteen companion clips show
  the actual matching practice UI with readable captions. All thirty MP4 files
  are reusable, encoded once and contain no audio stream.
- Update the grade-7 hub, cabinet route, video guides, content counts and
  course navigation. Preserve the earlier twenty-four workshop lessons and
  explain that their browser-local records have not been migrated.

No account/authentication redesign, production pupil mutation, messaging,
hosting/tariff change, voice synthesis or wholesale textbook copying.

## Gates and review

- Independent arithmetic/geometry invariants across varied seeds; valid and
  invalid intermediate responses; determinism and unchanged legacy tasks.
- Actual public and managed browser practice in each new family, restored
  draft/steps/hints, keyboard choices and semantic diagrams. Representative
  two-client teacher control and readonly behavior; canonical catalog and
  server normalization checks for every new item.
- Full relevant backend and existing cabinet, classroom, exam and route gates.
- Video schema, all presets, readable responsive layouts, cumulative records,
  sampled motion, actual trainer actions, playback and ffprobe of thirty new
  silent clips. Preserve prior videos and compatible worker behavior.
- Independent code and mathematical review. External review is waived by the
  owner; no external-review verdict will be claimed.
- Exact-head CI, authoritative-main check immediately before merge, reviewed
  tree/parent identity, Pages and Amvera publication, public bytes and safe UI.
- Final marker: `GRADE7_NEXT_COURSE_BLOCK_OK`.

## Risk and rollback

Risks are incorrect seeded mathematics, misleading diagram marks, lost semantic
state, accidental exam inclusion, tiny text in video and inconsistent asset
publication. Keep the existing persistence protocol and stable previous IDs.
There is no schema migration. A rollback must retain definitions and validation
for already-created new attempts; removing those IDs while they are in use
would hide work. Prefer disabling new starts/navigation while retaining the
task readers, or a forward corrective patch. Never restore a stale database or
delete pupil work to roll back this content release.

## Execution record

Base and clean isolated worktree verified. Implementation, independent review,
gate results and exact release evidence will be recorded in the PR. Real
student credentials are neither inspected nor used in tests.

The grade-7 exposure fix has eleven new real-SQLite tests covering full-history
repetition, concurrent attempts, learner/family isolation, archive/draft policy,
bounded retries and overflow, assistance precedence, and legacy behavior.
Independent code review verified the fix; the full backend suite passed 165/165.
