# Symmetry continuation — editorial preview and coverage contract

The 15 reviewed cards are stored only in `stereo-course/textbook/lessons/`:
four focused lessons for point 35 and every lettered part of exercises 276–278.
Exercise 278в has separate unequal-edge pyramid and regular tetrahedron cards.
The block contains 50 justified steps and 43 reachable 3D views. Integration
raises the authored course to 418 cards; publication still requires the normal
release decision. This directory holds no duplicate lesson records.

Open `preview.html` through a static HTTP server rooted at the repository.
It reads the same reviewed JSON as the production builder and uses the existing
model and mathematical text renderers. It never changes review flags or writes
pupil progress. Response text is retained while help and steps open, but not
persisted on reload.

## Content and source boundaries

- Space axial symmetry means a 180° half-turn: the triangle has 3 such axes,
  the cube 9, and a segment infinitely many, including its supporting line.
- Exercise 276в has no center for a non-flat dihedral angle. A flat angle is a
  plane and has infinitely many centers. The finite displayed polygons are
  cropped illustrations of infinite half-planes.
- Exercise 278в has 3 reflection planes for a regular triangular pyramid with
  unequal base and lateral edges, and 6 for a regular tetrahedron. Each case
  has its own model.
- Point 35 remains incomplete. Its reviewed source contract contains the four
  ready parts `center`, `axis`, `plane`, `figure` and four pending parts:
  `parallelepiped-examples`, `unbounded-examples`, `general-solids-examples`,
  `applications-elements`. The catalog preserves these missing components as
  drafts, so the number of fully available theory points remains 34.
- The textbook assertion about axes of non-right parallelepipeds is documented
  in the independent review. The four focused lessons do not certify this
  assertion or exhaustive coverage of the examples on printed pages 78–80.
- Exercise responses are manual with linked contextual theory. A numerical
  count alone is not automatically certified as a proof or independent mastery.

## Validation

`node tools/stereo-textbook/symmetry-content.test.cjs` checks the integrated
records, source contracts, linked theory, exact partial coverage and all finite
reachable SVG states. A separate in-memory copy checks that unreviewed records
remain unavailable; it never changes authored flags.

`python3 tools/stereo-textbook/symmetry-math.test.py` independently enumerates
the isometries of the authored vertex sets and derives reflection, half-turn
and central-symmetry counts. It also checks image constructions, sampled segment
axes and the regular-tetrahedron special case. This mathematical algorithm is
not an independent content reviewer.

`node tools/stereo-textbook/symmetry-preview.browser.cjs` captures 30 editorial
journeys and 86 model states at 390/1280px. The dedicated GitHub Actions job
preserves those screenshots. The standard production browser gate additionally
checks all 418 cards at 320/1280px, including every unique symmetry model view.

Independent review, exact content hashes, reproducible build and the normal
release gate remain required. An editorial preview is not deployment evidence.
