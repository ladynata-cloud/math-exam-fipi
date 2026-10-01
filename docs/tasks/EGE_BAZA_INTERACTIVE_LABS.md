# MathExam task specification — EGE_BAZA_INTERACTIVE_LABS

## Identity

- Owner: repository owner; current direct request to continue development.
- Date: 2026-10-02.
- Base branch: `course/ege-baza-data-module` (Draft #151).
- Base SHA: `ef30164ea890ac565e4c116134a74a78a3ef1e59`.
- Branch: `course/ege-baza-interactive-labs`.
- Review level: `NEW_ARCHETYPE` — constrained learner constructions and a new
  lesson sequence; prototype only until acceptance.
- Related ADR: `docs/adr/0004-ege-baza-construction-labs.md`, Proposed.

## Goal and approved scope

Continue the owner's course redesign with volumetric, partly dynamic stereo
models; learner-operated stepwise planar constructions; a clearer trigonometric
circle; and the strongest relevant inequality mechanisms integrated into task
18. The current request is authorization to implement and prepare a reviewable
Draft PR. It is not merge or deployment authorization.

Included: four isolated labs, exact models, guided practice, 18 independent
check questions, report download, accessible alternative controls, mathematical
and browser gates, reproducible portable preview and source/coverage notes.

Unchanged: existing module banks and grading, all existing storage keys,
registry, navigation, homepage, server, board bridge and generated stereo bank.
No all-subtype completeness, full-course readiness, persistent progress or
GeoGebra-equivalent general construction engine is claimed.

## Acceptance criteria

- [x] Two rotatable solid models: partial/full immersion and moving cone section.
- [x] Planar points and tools must be selected by the learner before calculation.
- [x] Construction needs a mathematical reason, not just visual appearance.
- [x] Unit circle covers coordinates, quadrants, turns, negative angles,
      radians and undefined tangent.
- [x] Task 18 connects domains, boundaries, interval/point selection, substitution,
      matching solutions and locating numbers.
- [x] Practice and check are separate; help and repeat checks are distinguished.
- [x] Reports are downloadable; existing course storage remains unchanged.
- [x] Real-browser checks and mobile screenshots, in addition to analytical tests.
- [ ] Independent review, archetype acceptance and full subtype mapping before rollout.

## Checks and gate

- `node tools/ege-baza-labs.test.cjs`: 381 numerical assertions passed.
- `node tools/ege-baza-labs.browser.cjs`: real Chromium/WebGL; all 18 independent
  expected answers; both five-step constructions; six interval builders;
  forbidden endpoints; animation pause; keyboard circle controls; touch taps;
  report download; 360/768/1280 px with no horizontal overflow; storage isolation.
- JS syntax and `git diff --check`.
- Preview builder checks dependencies and ZIP integrity.
- Screenshot inspection: desktop solids/triangle/circle, mobile task-18 builder;
  mobile prompt order corrected after visual review.
- Not run: independent/external review, physical iOS/Android device testing,
  screen-reader audit and a novice learner pilot. Browser touch is emulated.
- Gate: `AUTHOR_MATH_AND_BROWSER_PASS; ARCHETYPE_REVIEW_PENDING`.

## Risks and rollback

The math model or a misleading display can teach a wrong rule. Geometry and
numeric tests use independent expected values, conservation equations and
source-derived requirements. WebGL may be unavailable: a clear message leaves
text and numerical controls usable; this is not a substitute 3D experience.
Temporary results disappear on close; the UI states this explicitly.

Rollback removes only the new lab directory, its tools and proposal documents.
No learner data migration or rollback is needed. Keep existing module files and
other work, including the separately scheduled derivative task, unchanged.

## Permissions and execution

Direct current owner instruction authorizes development, isolated branch,
local commit, push and Draft PR. Merge, auto-merge and deployment: not authorized.
Public handoff contains only repository code, original tasks and public FIPI
references. No private source archives, credentials or student records included.

Exact remote head and PR are recorded in the PR body. Author review is not
independent review and no external approval marker is claimed.
