# Independent content review: Atanasyan 35–36 and exercises 279–280

Provider: OpenAI Codex. Independent reviewer: `next_block_review`; additional independent mathematical audit: `polyhedra_math_audit`. Neither reviewer authored the lesson files. No Claude call or Claude verdict is claimed.

Base: `96d44cc06a3dbc1e40482a774eda6c18fac89242`. PR and eventual head must be bound separately after integration. This is an exact-content review, not a release authorization.

Reviewed at: `2026-10-24T04:56:28.889Z`.

## Verdict

**PASS for source fidelity, mathematics and written pedagogy of the 17 corrected cards: 90 justified steps and 70 model states.** There are no unresolved source, text or coordinate blockers in the content identified by the companion hash record.

**Actual browser/visual verification remains separate and pending at this checkpoint.** Neither passing coordinate checks nor inspecting the textbook page images establishes that the pupil interface rendered correctly. No product screenshots were included in this verdict.

The four remaining components of point 35 complete that source point together with its four previously published definition cards. All of point 36 is covered by ten cards, including both the counting argument and existence constructions. Exercise 279 requires one case; exercise 280 requires two distinct cases. Practical exercises 271–275, point 37 and later exercises remain pending.

## Source and review method

The reviewer read and visually inspected the supplied textbook's printed pages 78–84 / PDF pages 80–86. Private PDF bytes and source page images are not included in the repository or this report. The reviewer read every new statement, goal, step, help item, justification, source identity, model and theory reference; corrections were re-read before hashing.

The reviewer independently checked the actual point 35 vertex transformations rather than relying solely on author tests: four transformations of the right rhombic prism, three of the skew rhombohedron and three of the crystal model. The four midpoint/perpendicular conditions for the skew axis and the three illustrated infinite-plane point mappings were also verified. Exhaustive distance-matrix permutations of the supplied generic six-vertex prism and four-vertex pyramid examples found only the identity, independently confirming their lack of the three proposed symmetry types.

For exercises 279–280, the reviewer enumerated all 12 face diagonals and all 66 unordered pairs in a cube. Exactly 24 pairs share an endpoint, and every such angle is 60 degrees. Six pairs belong to one face and are outside exercise 280. Among the remaining pairs, 24 give triangular sections, six give rectangular sections and 30 are skew. Actual authored coordinates give the equilateral triangle ACB₁, its perpendicular median AM, and the rectangle ACC₁A₁. Their areas are respectively `a²√3/2` and `a²√2`.

The separate mathematical reviewer independently constructed the regular solids and then audited the actual authored coordinates. Checks included face planarity, regularity and supporting planes; edge incidence and vertex degree; the tetrahedron height; octahedron vertices as cube face centers; icosahedron radii, cap and belt heights, pairwise distance classes and supporting-plane inequalities; and the dodecahedron's twenty actual face centers, twelve regular pentagons and supporting-plane projection argument. The primary reviewer also checked all written formulas and proof steps, including the optional full icosahedron convexity proof.

## Findings resolved

| Finding | Checked correction |
| --- | --- |
| Crystal statement did not require the apex line through the rhombus center, although the proof relied on it. | Condition now explicitly puts both apexes on the perpendicular through the diagonal intersection, on opposite sides at equal distances. |
| Several point 35 justifications linked to a symmetry definition instead of the invoked parallelepiped/prism/incidence result. | References corrected to point 13, point 30 and the plane-incidence axiom. |
| Point 35 text named B₁, D₁ or C while the relevant states omitted their labels. | Required labels/construction added only to those states. Fresh browser inspection remains necessary. |
| The generic prism non-symmetry argument skipped why all base vertices must move together. | Added the triangular-face versus quadrilateral-face argument before using distinct incident edge lengths. |
| Exercise 279's generic model note mentioned a section. | Replaced with angle invariance under cube scaling. |
| Cube and Euler help references were incorrect. | References now resolve to the prism lesson and Euler point 29. |
| Octahedron convexity sentence attributed separation to a triangle instead of its plane. | Corrected to the plane of each triangular face. |
| Vertex-angle discussion retained a highlighted 120-degree hexagon while discussing other polygons. | Subsequent cases use neutral state and explicitly explain that the shown hexagons are the excluded example. |
| Icosahedron radius derivation loosely described a half-side as subtending 36 degrees. | Now starts from the 72-degree full central angle and bisects it with the midpoint radius. |
| Dodecahedron proof used G while its chosen center was labeled F₄. | Model display label F₄ now reads G consistently. |
| Icosahedron sphere/supporting-plane explanation used hidden or generic point names. | Sphere state shows U, L and O; the proof uses the actual face A₁A₂B₁, its computed center G and segment OG. |

The new point 36 navigation help links definitions to the angle restriction, then to the five individual solids, and links the dodecahedron construction to the preceding icosahedron construction. These are existing contextual-help interactions, not a new runtime or learning-state mechanism.

## Mathematical/source conclusions

- **Point 35:** the source's blanket statement that a parallelepiped which is not a right prism has no half-turn axis is false. The authored counterexample is valid: centered vertices generated by `(1,1,0)`, `(1,0,1)`, `(0,1,1)` are preserved by the half-turn `(x,y,z) → (−x,−z,−y)`. None of its edge directions is perpendicular to the other two. Its reflection plane `y = z` is also valid. The lesson clearly identifies this as a correction, rather than silently repeating the false assertion.
- **Point 35 unbounded figures:** center, half-turn axis and reflection-plane examples are valid for the full infinite line or plane. The finite drawn quadrilateral is explicitly a display fragment, not the mathematical object.
- **Point 36:** five candidate pairs `(n,m)` follow from the strict vertex-angle sum. Existence is explicitly separate. Euler formulas use `D = 2m + 2n − mn`, with `f = 4m/D`, `k = 2mn/D`, `e = 4n/D`. Tetrahedron height is `a√6/3`. Icosahedron pentagon radius and belt height are `a√((5 + √5)/10)`; cap height is `a√((5 − √5)/10)`. The face-center construction gives the regular dodecahedron.
- **279:** only 60 degrees. The 90-degree crossing of two diagonals of one square does not share an endpoint and is excluded by the source wording.
- **280:** adjacent-face intersecting diagonals and opposite-face parallel diagonals are both allowed by the original wording. The two authored cards make this split explicit without inventing original lettered subparts.

## Future point 37 caution

Point 37 is outside this increment. Its printed-page-83 claim that a plane through any two cube symmetry axes must be a symmetry plane is also false. In a centered cube with vertices `(±1,±1,±1)`, valid half-turn directions `(1,1,0)` and `(1,0,1)` span the plane `x−y−z=0`. Reflecting `(1,1,1)` gives `(5/3,1/3,1/3)`, outside the cube. Preserve this correction requirement when point 37 is authored; do not mark that point complete now.

## Hash and integration boundary

Canonicalization recursively sorts object keys, preserves array order, omits only top-level `status` and `review`, and uses Node `JSON.stringify` with UTF-8 SHA256. The companion JSON lists each card's exact hash and the aggregate order.

Aggregate canonical SHA256: `78a2d547838e63aa50c0d1d3ba64e533478114fb5389ad172f49c52061cd0622`.

Any substantive edit invalidates the affected hash until independently re-reviewed. Status/review registration alone does not change the content hashes. Integration, preservation of existing cards, exact-head CI, actual browser evidence, final visual inspection and merge/publication remain separate gates. This review makes no claim about demonstrated learning gains or a real-pupil pilot.
