# Atanasyan practical nets 271–275 — content review

## Scope and actual review

Exactly five practical exercises from printed page 84 / PDF page 86,
figures 95–99, are implemented as five source-specific planar nets. The private
source was inspected directly. No source pages or full-book extracts are included
in this repository.

The independent reviewer `practical_source_math` authored none of these lessons.
The [machine-readable record](ATANASYAN_POLYHEDRA_PRACTICAL_MATH.json) binds the
source, mathematical and written-pedagogy PASS to every final card hash and the
independent mathematical test. All five statements and manual answer prompts,
all 37 explanations and their justifications, and all help trees were read.
Minor Russian plural agreements were corrected before the final hash binding;
there are no open content findings.

| Exercise | Source figure | Net faces | Uncut fold edges | Paired cut seams | Closed V / E / F |
| --- | --- | --- | --- | --- | --- |
| 271 | 95 | 4 triangles | 3 | 3 | 4 / 6 / 4 |
| 272 | 96 | 6 squares | 5 | 7 | 8 / 12 / 6 |
| 273 | 97 | 8 triangles | 7 | 5 | 6 / 12 / 8 |
| 274 | 98 | 12 pentagons | 11 | 19 | 20 / 30 / 12 |
| 275 | 99 | 20 triangles | 19 | 11 | 12 / 30 / 20 |

## Learning sequence

The initial scene shows the whole paper net without crowded vertex labels.
Successive views distinguish a face, a common side length, the fold lines, the
cut boundary and one glue allowance. Each of the 45 seams has its own reachable
help item, which highlights exactly two matching edges and displays the same
number at their midpoints. The numbering identifies pairs, not a required order
of gluing. A tab is an allowance outside a face, not an extra face.

The source supplies no numerical dimensions. Instructions preserve one common
enlargement scale, explain construction of the regular faces, and require a dry
fit before gluing. Existing contextual theory supplies an assembled solid for
comparison. The main scene remains a flat net; no folding animation is claimed.
A physical model or its photographs and the written account are checked manually.
Opening all steps never certifies physical completion.

## Independent geometry

`polyhedra-practical-math.test.py` derives incidence from the actual lesson
coordinates. It checks regular unit faces, non-overlap, source hinge topology and
connectivity; folds each face by independent rigid rotations; verifies closure,
convexity, incidence, lengths and the circumsphere; and checks all 90 boundary
edges in their 45 pairs. It also checks that each sample tab lies outside all
original faces and attaches to a cut edge. Author-generated fold metadata is
not an input to this test.

Canonical aggregate SHA256 (only top-level status/review omitted):
`63927ae8c646fed2390002f2efea7a2bb6f05878648e8e61877707f17c927f90`.
The report records the five individual hashes, exact review timestamp, source
hash and mathematical test hash.

## Integration and remaining release gates

The candidate expands the course from 474 to 479 cards, with 1,730 justified
steps and 1,784 model states. Main exercises 1–287, theory points 1–37 and all
40 self-check questions of chapters I–III are covered. Additional exercises
288 onward remain pending; this is not completion of the entire textbook.

Historical tests retain their prior exact counts and hashes. The isolated
practical baseline reconstructs the complete published 474-card course and its
review registry before earlier historical fixtures are applied. All prior
474 authored files, 917 screenshot cases and the runtime, renderer, schemas and
builder stay unchanged. Eighty new capture cases cover all 75 new model states
and each full final explanation at both 320 and 1280 pixels.

Actual exact-head cloud journeys and independent inspection of those responsive
images are separate requirements. Their run IDs, artifacts, verdicts and head
binding must be recorded in the task PR before the final review marker is used.
This content record alone does not claim browser-pixel approval or publication.
No physical paper build, continuous collision-free folding path or pupil pilot
is claimed. Paid external-provider review remains deferred under the original
whole-course owner scope. Merge and deployment require a separate owner decision.
