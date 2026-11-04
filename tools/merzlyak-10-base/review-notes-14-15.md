# §14–15 author checks (draft; not review approval)

All 54 exercises were authored as 54 combined cards. Each numbered exercise includes all textbook subquestions; `requiredParts` is `[null]` throughout. `textbookParts` records explicit subparts and the three rows of the table in 15.6.

Source inspected from PNG pages 132–136 and 138–140 (printed 131–135 and 137–139). Expanded page references: 14.5 continues across printed 131–132 / PDF 132–133; 15.17 continues across printed 138–139 / PDF 139–140. 14.13 also cites printed132/PDF133 for figure14.15, together with its condition on printed133/PDF134. Important image readings: 14.25 uses the midpoint of C₁D₁; 14.27 asks for the circle through C,D,O; 15.7 is section AB₁C₁D; 15.17 has strict inequalities A₁B₁<√3/2 and A₁C₁<1/2.

The source givens are preserved. In 15.15 the two regimes of a plane through AD are both solved: a²/cosα up to 45°, a²/sinα from 45°, with matching boundary values. The model contains separately highlighted valid examples at 30° and 60°. In 15.16 the condition of three lateral-edge intersections selects the pentagonal projection MBCDK, with area 7a²/8. The model for table 15.6 explicitly illustrates row 1; all three rows are solved in the steps. Generic-symbol problems use admissible numeric models and derive general formulas in the text.

Checks completed:
- Runtime lesson schema: all 54 cards valid, all draft/pending.
- Model geometry: 231 planar simple polygons and 627 nonzero segments.
- `para14-15-models.test.py` checks the numeric givens and answers, perpendicular planes and lines, actual orthogonal projections, area ratios, two successive projections, strict inequalities in 15.17, and complete solid-edge clipping for 9 section configurations.

No unresolved source issues. These author checks do not replace independent source/mathematical/pedagogical or browser review.

Independent review correction R1415-001: §14.5(1б) restored to printed BE⊥BD (not BF⊥BD). Answer is no, established from projection BC and the acute angle CBD. Separate view highlights BE,BC,BD; hint and numerical assertion now check the original statement.

Independent review correction R1415-002: §14.31–14.32 now show OT and T together with triangle OMH in the step that constructs the perpendicular, before the numerical calculation.
