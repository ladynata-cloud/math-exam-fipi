# Chapter IV: independent exact-source inventory

Date: 2026-10-26. Reviewer: independent OpenAI source-inventory agent,
separate from the authors of exercise and theory blocks.

## Source and method

The reviewer visually read **every one of the 22 source page images**, printed
pages 69–90, corresponding to PDF pages 70–91. The inventory was established
before reading the chapter-IV author preparations and without deriving counts
from the previously reported 166-card candidate.

Exact source: Atanasyan et al., Geometry 7–9, basic level, 14th revised edition,
2023, ISBN 978-5-09-102538-5. Source PDF SHA256:
`3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.
Source scans and raw extracted text are not included in this change.

The machine-readable result is
`tools/geometry-textbook/chapter-04-source-map.json`. It records every number,
printed subpart, source page, theory point, review question and significant
case requirement. Its status is an independent **source-structure check**, not
approval of authored solutions, models or publication.

## Independently counted coverage

| Collection | Count |
| --- | ---: |
| Numbered exercises, 228–330 | 103 |
| Exercise parts, including single-part numbers | 135 |
| Theory points, 31–38 | 8 |
| Chapter-qualified review questions, 1–23 | 23 |
| Total cards with one card per inventoried part/point/question | 166 |

The published 403-card course plus this complete chapter therefore has a
candidate target of 569 cards. These counts do not establish content readiness.

| Exercise numbers | Printed page |
| --- | ---: |
| 228–240 | 71 |
| 241–251 | 74 |
| 252–258 | 75 |
| 259–270 | 79 |
| 271–278 | 80 |
| 279–291 | 85 |
| 292–299 | 86 |
| 300–303 | 87 |
| 304–314 | 89 |
| 315–330 | 90 |

Printed multi-part numbers: 228а–г; 231а–б; 232а–б; 233а–в;
241а–б; 242а–б; 252а–б; 253а–б; 255а–в; 296а–б; 298а–б;
299а–д; 300а–б; 309а–б; 310а–б; 323а–в; 324а–и.
For 324 the exact letter sequence is а, б, в, г, д, е, ж, з, и.
All remaining exercise numbers have one unlettered part.

| Theory point | Printed pages |
| --- | --- |
| 31 | 69, 70 |
| 32 | 70, 71 |
| 33 | 72, 73 |
| 34 | 73, 74 |
| 35 | 75, 76, 77 |
| 36 | 77, 78, 79 |
| 37 | 80, 81, 82, 83 |
| 38 | 83, 84, 85 |

Review questions 1–2 are on page 87; 3–21 on page 88; 22–23 on page 89.
Question 6 includes both side/angle implications, question 11 includes the
30-degree property and converse, and question 22 contains both SAS and ASA
construction requests. One card must still cover each whole printed question.

Theory 35 includes four properties and two converse criteria. Theory 37 includes
the converse equidistance assertion and the locus explanation. Theory 38 includes
all three constructions and the existence discussion, including the ASA task
left for independent solution in the source.

## Cases requiring explicit attention

The source map records these per number. Particularly important are both
admissible isosceles configurations in 233/239; equality in 244/256; the acute
constraint in 268; zero distances in the coincident-line case of 284; both line
arrangements in 285; all constructions and their feasibility in 292–303 and
322–330; both implications in 309/310; and proof by contradiction in 314.

The strict statement of 321 requires the point to lie on the open opposite side.
If boundary vertices are included in an explanation, the resulting equality
case must be identified rather than asserting the strict inequality there.
Coordinates alone are never proof of a general assertion.

## Existing release preservation

Added `tools/geometry-textbook/published-chapters-01-03.json`, frozen from the
published base Git object
`9cf995d30c400a6e581a3168bb8ef8f5c76ed945`, not generated from chapter-IV content.
It pins all 403 normalized lesson objects, catalog entries, per-chapter authored
content hashes, shared implementation hash and the bytes of all three existing
release-review manifests.

The additional `review_scope_test.py` preservation test retains all seven older
tests and checks this new baseline. Baseline execution passed **8/8 tests** on
the unchanged three-chapter content, before chapter-IV author files were added.
`git diff --check` passed for these edits. The complete candidate must rerun the
same checks after all new fragments arrive.

## Scope and limits

- Independent source inventory: **PASS**, no numbering/subpart gap found.
- Existing three-chapter preservation baseline: **PASS**, 8 tests.
- Authored chapter-IV solutions, geometric models, learner interactions,
  screenshots and exact-head CI: not evaluated by this inventory record.
- No release review manifest, publication approval or completion of the whole
  grade-7 textbook is asserted. In this exact edition grade 7 also includes
  chapter V, exercises 331–412, and advanced exercises 413–461.

