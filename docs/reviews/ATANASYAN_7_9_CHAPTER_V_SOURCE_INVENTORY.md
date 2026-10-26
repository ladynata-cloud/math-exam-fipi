# Chapter V: independent exact-source inventory

Date: 2026-10-26. Reviewer: independent OpenAI source-inventory agent,
separate from the authors of all exercise and theory blocks.

## Source and method

The reviewer visually read **all 25 rendered source pages**, printed pages
91–115 (PDF pages 92–116). This inventory was completed before reading any
chapter-V authored preparation, model or generator. Counts, subparts, page
boundaries and source-condition caveats were derived directly from those pages.
The chapter-IV map was used only as a structural schema example. A later
cross-reference check during the A review corrected 354's page list to include
its required figure on page 99, which the reviewer re-opened and verified
directly. This correction changes no number, part or card count.

Exact source: Atanasyan et al., Geometry 7–9, basic level, 14th revised edition,
2023, ISBN 978-5-09-102538-5. Source PDF SHA256:
`3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.

The machine-readable inventory is
`tools/geometry-textbook/chapter-05-source-map.json`, SHA256:
`bd99bd11b3d4750ef0871caac769807dac65a87f1bf8686c7ab06a74cec98d4f`.

Source scans and raw extracted text are not included. The map's case notes are
review requirements and mathematical observations, not quotations or silent
amendments to textbook conditions.

## Independently counted coverage

Chapter V is “Геометрические места точек. Симметричные фигуры”.

| Collection | Count |
| --- | ---: |
| Numbered exercises, 331–412 | 82 |
| Exercise parts, including unlettered numbers | 99 |
| Theory points, 39–45 | 7 |
| Chapter-qualified review questions, 1–30 | 30 |
| Total cards, one per exercise part/theory point/whole review question | 136 |

The published chapters I–IV contain 569 cards. Adding this exact complete
chapter gives a **705-card target**, not a readiness claim. The independent
author blocks contain 30 exercise cards for 331–357, 36 for 358–384 and 33 for
385–412; theory and review questions contribute 37 cards.

| Exercise numbers | Printed pages |
| --- | --- |
| 331–335 | 95 |
| 336–346 | 103 |
| 347 | 103, 104 |
| 348–353 | 104 |
| 354 | 99, 104 |
| 355–361 | 104 |
| 362 | 104, 105 |
| 363–368 | 105 |
| 369–373 | 106 |
| 374–382 | 110 |
| 383–389 | 111 |
| 390 | 111, 112 |
| 391 | 111 |
| 392–393 | 112 |
| 394–402 | 114 |
| 403–412 | 115 |

The second page of 347 contains its continuation. Exercise 354's statement is
on 104 and its required figure 162 is on 99. Exercise 362 includes its
printed construction and proof over both pages. Exercise 390's statement is on
111 and its required figure 181 is on 112. Exercise 393 includes a printed proof.

| Printed multipart number | Exact part sequence |
| --- | --- |
| 347 | а, б |
| 356 | а, б, в |
| 379 | а, б, в, г, д |
| 380 | а, б |
| 381 | а, б, в, г |
| 384 | а, б |
| 385 | а, б, в |
| 389 | а, б |
| 410 | а, б |
| 411 | а, б |

All other main exercise numbers have one unlettered part. The star on 396 does
not create a separate part. Unlettered multi-case tasks remain whole cards:
364/365 include all three triangle types; 382 includes all five table columns.
Question 30 includes two construction methods within one selfcheck card.

| Theory point | Title | Printed pages |
| --- | --- | --- |
| 39 | Свойства биссектрисы угла | 91, 92, 93 |
| 40 | Свойства серединного перпендикуляра к отрезку | 93, 94, 95 |
| 41 | Свойства диаметров и хорд окружности | 95, 96, 97 |
| 42 | Взаимное расположение окружности и прямой. Касательная к окружности | 97, 98, 99, 100 |
| 43 | Вписанная и описанная окружности треугольника | 100, 101, 102, 103 |
| 44 | Фигуры, симметричные относительно прямой | 106, 107, 108 |
| 45 | Осевая симметрия и её свойства | 108, 109 |

Selfchecks 1–5 are on page 112; 6–26 on page 113; 27–30 on page 114.
The whole theory-point page span is recorded, including proofs, converse
statements, constructions and relevant examples.

## Source caveats requiring an explicit explanation

The map records these as distinct `sourceCaveats`, preserving the difference
between the printed statement and the mathematically valid qualification.

**V-SOURCE-041-MIDPOINT, theory 41, page 96.** The direct property about a
diameter through the midpoint of a chord omits the restriction that the chord
is not itself a diameter. A diametric chord has midpoint at the center, through
which every diameter passes; perpendicularity does not follow. The source's
center/endpoints triangle proof degenerates in that case. The authored
explanation must identify the missing qualification rather than attribute it
silently to the book. The converse perpendicular-diameter property remains
valid for a diametric chord. Relevant review questions must preserve this
distinction.

**V-SOURCE-045-COINCIDENT, theory 45, pages 108–109.** The original line and its
reflected image can coincide: the axis and every perpendicular line are
invariant. An explanation of distinct parallel or intersecting original/image
lines must additionally acknowledge this case. It matters in 403, 404, 410 and
411 and must not be disguised as a distinct-line configuration.

**V-SOURCE-408-CENTER, exercise 408, page 115.** The printed condition permits
the equal chords to intersect at the center. Two distinct diameters then give
equal chords whose intersection lies on every diameter; an arbitrary such
diameter is not a reflection axis exchanging them. The ordinary proof requires
the intersection to differ from the center. In the central case, the two
angle-bisector axes exchange the diameters. The source's missing restriction
must be disclosed rather than an unconditional false assertion being proved
from one favorable diagram.

## Other cases that the authored content must preserve

The map contains per-number requirements. The following are particularly
important for the later source and mathematical review.

- Locus tasks require both implications. In 331 both angle-bisector lines are
  needed. In 333 the perpendicular bisectors can intersect, be distinct
  parallel lines or coincide. The source in 334 does not explicitly restrict
  the requested point to the angle interior; point 39 defines distances to
  the supporting lines.
- Tangency of a segment or ray requires its contact point to belong to it.
  This matters in 347 and in the actual side segments of 368. Theory 43
  requires existence and uniqueness of both triangle circles.
- Constructions 360/361 require the strict and equality feasibility cases.
  Compass-only reflection in 375 and selfcheck 30 is not satisfied by merely
  describing a ruler-and-compass construction.
- Reflection fixes points on the axis. It also admits zero, one, several or
  infinitely many symmetry axes depending on the figure. The pictured glyphs
  in 383 must be judged as geometrical shapes, not as a theorem about all fonts.
- The circumcenter-on-median task 399 includes both a right triangle, where
  the circumcenter is the median's endpoint at the opposite side's midpoint,
  and an isosceles
  triangle. Circle centers in 373/400 may coincide.
- Construction 402 has two solutions when the specified point is strictly
  between the parallel lines, and none outside the strip.
- In 410б the line is required to be an **axis** of a nonzero segment. Include
  the exchanged-endpoint construction and the possibility of two distinct
  fixed endpoints on the axis, so that the segment lies along it. In 411б the
  line must be the **perpendicular bisector**; candidates on the axis give a
  zero segment and must be excluded.
- In 412 the union of two perpendicular lines has four axes: both bisectors
  and the two given lines. A claim of exactly two axes is valid only for the
  nonperpendicular case.

Coordinates or a chosen example cannot replace a proof of a universal claim.
These requirements do not force new runtime features; explicit authored cases
can cover boundary arrangements.

## Validation and limits

Structural checks passed for the exact consecutive sets 331–412, 39–45 and
1–30, their unique part labels, source page bounds and computed total of 136
cards. Every printed page 91–115 was actually inspected; no count was inferred
from a prepared-card total. The map parses as JSON and `git diff --check`
passed for the two inventory files.

This source-structure inventory is **PASS**. The three recorded source caveats
remain mandatory content-review obligations, not unresolved numbering gaps.
No authored solutions, model assertions, browser screenshots, preservation
tests, exact-head CI or release approval are evaluated by this record.

The preservation baseline and tests are owned by a separate reviewer. This
inventory changes neither the previously published 569 cards nor the shared
runtime or gates. Chapter V ends at 412. The separate advanced exercises
413–461 begin on the same printed page 115 and are outside this chapter's
scope, so completion of chapter V alone does not claim completion of every
grade-7 textbook exercise.
