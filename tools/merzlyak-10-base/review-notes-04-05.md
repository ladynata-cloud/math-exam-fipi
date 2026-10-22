# §4–5 author checks (draft; not independent review approval)

Prepared all 69 numbered exercises: §4 has 28 exercises / 31 cards; §5 has 41 exercises / 41 cards. Combined cards solve all explicit textbook subparts except 4.11 and 4.14, which are split into exact source subparts. Machine-readable coverage is in `coverage-04-05.json`.

Source inspected: uploaded 2022 basic-level textbook PNG pages 38–41 and 46–51 (printed 37–40 and 45–50). OCR was used only to locate text; mathematical labels and source figures were read from page images. Important corrections to OCR: 5.13 is AA₁:A₁B = 7:5; 5.30 has AA₁ = 24 cm; 5.35 uses planes AFD and A₁ED₁; 5.36 direction B₁D; 5.37 direction AC₁. The condition for 5.19 continues across printed pages 47–48, so its source pages must be expanded to PDF 48–49 in the source index.

Scope assumptions explicitly disclosed in cards: named points on edges are the interior points shown by the source figures; in 4.18 the two intersections D,E on a are distinct as drawn; 5.35 uses the depicted order F above E. In 5.38 and 5.39 the displayed polygon is one valid configuration, while the construction explains tracing the actual plane through the faces for other positions. No solution is inferred from the shape of the rendered diagram.

Verification completed:
- All 72 cards pass the course runtime lesson validator, with `draft` and all review flags `pending`.
- The generic model test checks 247 planar simple polygons and 705 nonzero segments.
- `para04-05-models.test.py` independently verifies source lengths and ratios, construction collinearities and parallel directions, numeric answers, and complete edge–plane intersections for 12 solid sections. It catches missing or extra section vertices, not only planarity.
- The §4 alternative-intersection model in 4.10 has X on both AC and BD₂.

No source items remain unresolved. These checks do not replace independent mathematical, source, pedagogical, or browser review.
