# Independent review: theory 15–21

Frozen source: `2806d0ffe176d0a0b59a36c4eb5eb8c33d92460b4e7c9a268a0eb054091fb9d6`. Author files and review flags untouched.

## Interim source/math review, points 15–18

Actual source PNG PDF pages 38–42 (printed 36–40) visually reviewed. All five cards read in full, including help, steps, justifications and model coordinates/views. Source checklist items 1–17 covered: perpendicular skew lines; parallel transfer lemma; definition and intersection of normal/plane; forward and converse parallel-normal theorems; full two-intersecting-line criterion with arbitrary-direction and incidence exceptions; embedded plane construction for M on/outside a; independent uniqueness proof; normal existence/uniqueness for M in/outside plane. Proofs are logically correct and do not depend on future theory.

Model coordinates match conditions: 15 has genuinely skew b,c with zero direction dot product; 16 distinct vertical normals have exact feet H,K in z=0; 17 a is offset from O, auxiliary a₀ is parallel and through O, A/B symmetric, P/Q/L collinear with L inside PQ, l parallel m, AP=BP/AQ=BQ/AL=BL; 17-example alpha/beta distinct through a, M in alpha, perpendicular p/q through F and gamma z=1; 18 beta x=2, alpha z=0, b their intersection, c through M perpendicular to both a,b.

No source/math proof blocker found. Four bounded P2 corrections needed before full content PASS:

1. `theory-017-example.help[id=uniqueness].text`: says construct n ∥ a through M without covering M∈a. That case is explicitly included in the lesson, and parallel-through-on-line construction is impossible under strict parallelism. Add n=a for M∈a, matching step5.
2. `theory-017-example.visualization.model.views.unique.label`: “любую прямую γ” names the plane gamma as a line. Use “любую прямую плоскости γ”.
3. `theory-017.visualization.model.views.three-points.segments[0]`: drawn P–L stops before Q although the step calls it a transversal through P,Q,L. Actual rendered PNG inspected. Replace segment with P–Q (L lies inside), preserving coordinates.
4. `theory-017-example.visualization.model.views.planes`: two displayed planes have no α/β labels, so the pupil cannot reliably connect the named planes to the model. Add explicit labels within this construction view; preserve neutral state without these auxiliaries. Actual PNG inspected.

Other cards 19–21 are being independently reviewed separately. Browser/layout PASS not claimed for these new cards.


## Remaining five cards — independent PASS

Theory019, theory019-distances, theory020, theory021, theory021-central reviewed independently by intro_geometry_audit (33 steps,35 views); root reviewer additionally visually read actual PDF PNG45–49 and the textual proofs/help. All remaining checklist items18–46 covered. No additional source/math/model/pedagogy blocker.

Distances: all three remarks included, equal normal lengths justified, skew-plane construction unique and symmetric, displayed H explicitly need not lie on b. Three perpendiculars: both directions proved using two genuinely intersecting lines of AHM, while a/AH can be skew. Orthogonal projection: both inclusions of the whole-line image, segment order/bijection, figure image and exceptional point/in-plane/normal/parallel cases; source's 0-degree convention accurately distinguished. Minimum-angle proof by Pythagoras and cosine theorem is valid; illustrative angles are45 and60degrees. Central projection: excluded plane including O, unique intersection using full line, opposite-ray case, figure and photography example. Independent coordinate subreview27 substantive relations,15 planar polygons,85 nonzero segments; actual TaskSceneViewer35 states return exactly to neutral paths/labels. No real browser run claimed.

General read-only model geometry gate independently executed:10 cards,23 planar simple polygons,158 nonzero segments — PASS. Whole package:10 cards,65 justified steps,69 views. SHA rechecked exact2806d0.

## Interim complete verdict

Source coverage and mathematics PASS for all10 cards/7sourcepoints and46 checklist topics. Content release remains pending the four bounded P2 corrections above, all in theory017/theory017-example. No other blockers found. Do not promote review flags until the exact corrected snapshot is independently compared. Author and parent have the precise list; no authored/product files changed.


## Final corrected snapshot — independent content PASS

2026-10-21T21:54:05.325049+00:00

SHA256 `dd35d86e0b5a5b4aa7fbf7102915e13ad222c9328093b4572fb3a7245c82103d`. Both baseline and new file hashes independently verified. Recursive comparison confirms exactly10 reported JSON paths: four requested corrections plus revision2 for theory017 and theory017-example. Other8 cards, all source/status/review fields and all65 steps unchanged.

All four P2 findings closed. Help explicitly uses n=a when M∈a and n∥a only when M∉a; this agrees with the source boundary case and full proof. Gamma caption now says line of the plane gamma. The transversal is P–Q with L at parameter0.75 and P∈p/Q∈q. Alpha label is on y=2x/3 and beta label on y=0, correct for their respective planes. Actual fresh PNGs three-points/planes/neutral inspected: complete transversal and readableα/β labels, no auxiliary plane labels in neutral. Independent realTaskSceneViewer jsdom check confirms renderedP|Q segment, both labels in construction, no labels initially, exact neutral SVG restoration.

Final source completeness, mathematics, model and pedagogy PASS for10cards/65steps/69views covering all7sourcepoints15–21 and46checklist topics. Review flags were not edited by reviewer. Cloud/mobile browser layout review remains an integration responsibility.
