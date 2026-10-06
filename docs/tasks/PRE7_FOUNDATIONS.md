# Foundations before grade 7

## Identity and authorization

- Date: 2026-10-06; owner: MathExam owner.
- Base: main at `ec6afeb7fbae5c567ebd69b1be91f36093237fa2`.
- Branch: `feat/pre7-foundations-20261006`; review: HIGH.
- Architecture: accepted ADR 0010, existing managed Path attempts.
- Owner requested implementation now, using existing earlier-school material,
  with paired animated worked examples and trainer instructions. Existing
  session authorization permits publication without separate external review.
  Internal independent mathematics and code review remains part of this task.

## Goal and scope

Add a clearly visible, freely navigable foundations block to the grade-7 course
and permanent cabinet. Each of eighteen original seeded trainer families has
three meaningful modes, a task-bound interactive model, cumulative hints and
steps, and two silent stored MP4s: a worked example and actual trainer use.

Numbers and arithmetic: place value, natural comparison, carrying, borrowing,
convenient calculations, inverse components, divisibility, scale reading and
comparison stories. Applications: fraction line, equivalence, comparison,
part/whole, decimal comparison, mass/capacity, ruler lengths, perimeter and
square-unit area. Exact IDs start `pre7-`.

Existing `school/vilenkin5-*` and `school/vilenkin6-*` files provide the user's
mathematical patterns and visual references. Examples are newly authored;
this does not claim complete textbook coverage. The old standalone school
labs often explore numbers different from the current exercise. Their values
are not copied into managed tasks without adaptation.

Implementation areas: two Path data extensions, bounded `pre7-lab` renderer
and semantic-state validation, current backend module loaders, curriculum and
prerequisite links, public course cards, paired video authoring/rendering,
media ledger, and relevant automated regression gates.

Out of scope: authentication changes, account creation/reset, schema migration,
production learner writes, new hosting resources, external AI or messaging,
Bridge/Socket.IO protocol changes, EGE exam eligibility and unrelated legacy
trainer cleanup. New items are training-only, null exam position, grade7=true,
pre7=true, subject=foundation; existing family IDs and attempts stay valid.

The owner additionally requested a coherent grade-7 route linking the existing
trainers and videos. The course and cabinet therefore show an ordered main
algebra/geometry path with optional prerequisite detours and a return to the
original topic. Each covered topic connects explanation, model, guided practice,
new independent attempt and explicit submission. Free choice remains available;
old browser-local workshop progress is not presented as server history.

## Added geometry scope from the owner

The owner asked for interactive Atanasyan topics through isosceles triangles,
with animated explanations and trainer tutorials. Add twelve more managed
families and 24 silent paired clips: points/lines/rays, perpendiculars, angle
measurement, triangle elements/perimeter, SAS, median, bisector, altitude,
isosceles elements/base angles/vertex line. The existing eight geometry families
remain part of this coherent route. New semantic construction state stores only
known element/construction IDs and opened explanation count, with the same
restore/read-only boundaries as existing diagrams. No exact edition page map or
full later-grade coverage is claimed. Triangle angle-sum shortcuts are excluded
from this early sequence. Primary geometry route ends at isosceles triangles;
later existing topics are available separately.

The owner subsequently requested more geometry using existing site work.
Eight additional families adapt verified chapter 1/2 legacy patterns: segment
relations, angle parts, vertical-angle proof, SAS with a common side or vertical
angles, distinguishing special lines, isosceles perimeter equations and a
stepwise proof. Exact source mapping is recorded with the generator tests.

Combined addition: 38 families and 76 clips (18 foundations + 20 geometry).
The cabinet now contains 28 managed geometry families including the previous
8. Algebra and geometry each offer three freely switchable route views:
ordered study, a difficult topic, and an independent check. Changing a view
creates no attempt; an independent new check requires an explicit click.
All views share the same existing history and support a return from prerequisites.

The owner also requested polished motion graphics. Geometry clips therefore
use staged construction, paired highlights, labels, meaningful focus and
congruent overlays only when the equality is justified; all remain silent.
New geometry mathematical/model/browser gates join all checks below.

## Acceptance and checks

- Thirty-eight discoverable new managed trainers and 76 actual silent MP4s,
  paired by ID; 62 school families and 136 active clips across 68 topics overall.
- Every generator's independent mathematical checks cover its full seed domain,
  all modes, incorrect answers and visual/model bounds.
- Model selection belongs to the pinned task; reveals are bounded and cumulative.
  Restore is silent; teacher takeover/read-only and handoff preserve state.
- Browser checks cover every family, explicit start, input, mistakes, hints,
  completed prefixes, model interaction, reload, submission and mobile fit.
- Existing account, classroom, free-route and exam gates continue to pass.
- Video checks cover stored-file hashes/audio-stream absence, playable clips,
  three authored presets per topic, arrows/constructions and retained steps.
- Exact-head CI, independent internal HIGH review, diff/secret/URL checks,
  current-base verification and production read-only deployment evidence.
- Gate: `PRE7_FOUNDATIONS_GATE_OK` only after the named local checks pass;
  CI container and deployment evidence reported separately.

## Risks and rollback

Main risks are mathematical edge cases, a picture that differs from the task,
answer leakage, stale script caches, lost model state and oversized video/UI
text. Bound diagrams and exact integer/fraction calculations, consistent cache
revision and browser checks address these risks. No schema change is needed.
If rollback is required, restore the preceding code/media together while keeping
all account/history data; do not delete attempts or issue replacement credentials.
New content may need to remain loadable for already-created attempts, so a
forward fix is preferred to removing its definitions after learners start work.

## Execution record

Local mathematical and managed-state verification passed: 6480 foundations
seed cases, 2592 core and 1728 practice geometry cases, 4320 semantic construction
states and 4320 browser font layouts. All 38 new families passed actual managed
browser flows including hints, restored solution prefixes, teacher observation,
takeover/handoff, mobile display and submission. Existing authorization, cabinet
with eight learners and 21-question exam browser gates passed; backend 165/165.

Route verification passed all 169 Path families, 40,560 generated cases and
166,551 answer checks. The reference catalog, 62 school cards, three route modes
and nested prerequisite returns passed their browser gates. Mode switches create
no attempt; an explicit independent check preserves the source work and starts a
new attempt. Six desktop/mobile route layouts were independently inspected.

Independent runtime and pedagogical review found no production blocker. An
omitted route stylesheet in the local video test server allowlist was corrected.
Geometry video mathematics independently checked 60 authored examples containing
312 diagrams, 25 numerical angle labels and 13 congruent overlays. Equal-side
marking and one question/answer mismatch were corrected before final rendering.

All 76 new silent MP4s are rendered and their bytes match the two media ledgers.
Final video gates passed 408 authored animation journeys, 136 pixel comparisons,
137 stored files (136 active and one archive), 136 decoded browser playbacks and
68 complete one-page A4 guides. They found no external requests, learner writes,
console errors or remaining layout failures. Worker tests passed 44/44. A mobile
heading adjustment resolved a four-pixel video clipping case; the full playback
and print gate passed again. The independent review was extended to the final
stylesheet and 68-topic tutorial metadata; all 37 changed runtime files are
covered with no remaining blocker.

Local content/classroom/media acceptance is complete. Final exact-head CI,
production-container and deployment verification are pending; the release PR
will record these separately. No external review verdict is claimed.
