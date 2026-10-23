# Atanasyan 2024 — symmetry continuation

- Date: 2026-10-24, Asia/Novosibirsk.
- Owner START: current request to continue the course.
- Base: main, `07189de58b7f5d60c02ea6ca6aa9450a324a377f`.
- Branch: `feat/atanasyan-symmetry-276-278`.
- Review level: HIGH (source interpretation and mathematical explanations).

## Goal and scope

Continue after the published pyramids with a coherent symmetry block: four
focused theory35 cards and all parts of exercises276–278. Exercise278в is
split into an ordinary regular triangular pyramid and a regular tetrahedron.
There are15 authored cards,50 justified steps, separate progressive3D models,
contextual help and manual proof prompts. Reuse the existing renderer and schema.
Source: supplied Atanasyan2024, printed78–80,84 / PDF80–82,86; visual source pages
were inspected. Private PDF and source images stay out of the repository.

## Reviewed integration and publication boundary

The owner authorized the independent reviewer in the current conversation.
The 15 cards passed independent source, mathematics and pedagogy review after
corrections and were moved into `stereo-course/textbook/lessons`. The registry
binds their exact canonical contents to the actual reviewer and timestamp; see
[the report](../reviews/ATANASYAN_SYMMETRY_CONTENT.md) and its JSON hash record.
Existing lesson contents and the runtime are unchanged. The editor preview reads
the same lesson files without duplicating data or storing pupil progress.

The candidate contains 418 reviewed cards, 1411 justified steps and 1469 model
views. Fully available source coverage is exercises1–270 and276–278 (273 total),
theory1–34 and26 self-check questions. Point35 is explicitly partial: center,
axis, plane and figure are ready; parallelepiped-examples, unbounded-examples,
general-solids-examples and applications-elements remain draft placeholders.
There are1341 catalog entries. Source278 keeps its original three lettered
subparts; the authored contract splits partв into the two required cases.
Practical271–275, theory36–37, exercises279 onward remain pending.

These are candidate counts, not a claim that the new cards have been deployed.
The previously published course remains403 cards until an authorized release.

## Review and checks

Source, mathematics and pedagogy passed independent review at
2026-10-23T21:04:00.795Z. Author checks include schema/runtime validation, all reachable model views,
geometry integrity and an independent algorithm enumerating the isometry groups
of the actual vertex sets. An independent algorithm is not an independent reviewer.
Paid Claude remains deferred under the existing course scope; no verdict claimed.
No new interaction archetype or architecture is introduced.

Required: draft contract tests, coordinate oracle, inherited source/schema/content/
model/runtime gates, actual draft preview browser inspection at mobile and desktop
widths, then independent content review and normal exact-head release checks.
Content integration does not supply an exact-head release verdict. Fresh cloud
tests and visual inspection of the integrated pupil interface remain mandatory.
The two corrected label sets also require fresh actual screenshots.

Independent findings fixed before content freeze: point transformations now use
their actual definitions; cube-axis completeness has an elementary proof;
unexplained vector terminology was removed; A₁ naming and two model label sets
were corrected; exercise help links to the relevant definitions. Exercise276в
uses the definition in point22: coplanar half-planes are excluded, so its answer
is unambiguously0. The separate plane example is explicitly supplementary.
The broad textbook assertion about axes of non-right parallelepipeds is false;
the report records a verified counterexample. That unimplemented example part
of point35 remains pending, rather than repeating the assertion as a theorem.

## EXECUTIVE STATUS

Task: TEXTBOOK_ATANASYAN_SYMMETRY
PR: #321 Draft
Base: 07189de58b7f5d60c02ea6ca6aa9450a324a377f
Head: latest exact PR head and checks are recorded in the PR body
Gate: independent content PASS by canonical hashes; integrated release checks pending
Tests: source/math/coordinate checks and prior draft Chromium evidence; fresh integrated gate required
Failures: earlier preview overlap fixed; review findings corrected before hash freeze
Not run: deployment; exact final integrated cloud and visual gate pending at this checkpoint
Scope deviations: point35 remains partial; original exercise278в needs two authored cases
Recommendation: finish integrated exact-head and visual checks before the release decision
Next user decision: separate merge/publication authorization after the final gate

## Risks and rollback

Main risks: confusing arbitrary rotation with half-turn symmetry, dropping the
regular-tetrahedron case, finite drawings of infinite half-planes and leaking
auxiliary constructions. These are explicitly explained and checked. Draft
removal is a normal revert; production content and learner state are untouched.

## Permissions

Branch, scoped edits, checks, commits, push and Draft PR are authorized by the
current continuation request. Merge/publication is not performed by this task.
No force, reset, rebase, paid call or changed release gate is authorized.
