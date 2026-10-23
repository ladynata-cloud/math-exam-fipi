# Symmetry continuation — authored, not released

15 draft cards: four focused lessons for point35, and all lettered parts of
276–278, with278в split into the unequal-edge pyramid and regular tetrahedron.
50 justified steps;43 reachable3D views. Every record remains `in-review` with
all three review flags `pending`. These records are deliberately outside the
production builder and do not increase the live course's403-card count.

Open `preview.html` through a static HTTP server rooted at the repository. It
uses the existing model and mathematical text renderers directly on draft data.
It never promotes status flags, writes pupil progress, or claims independent
mastery. Draft text is kept while help/steps open, but not persisted on reload.

## Content decisions requiring review

- Space axial symmetry means a180° half-turn. The triangle has3 such axes,
  the cube9, the segment infinitely many (including its own supporting line).
- 276в:0 centers for a non-flat dihedral angle; a flat angle is a plane and has
  infinitely many. Infinite half-planes must not be confused with the cropped
  polygons in the model.
- 278в:3 reflection planes for a regular triangular pyramid with unequal base
  and lateral edges,6 for the regular tetrahedron. Each case has its own model.
- Four focused theory lessons cover the definitions and central examples, not
  a certified exhaustive interpretation of every assertion on printed78–80.
  In particular the broad claim about axes of non-right parallelepipeds on
  printed80 requires a separate source/math audit before point35 is marked
  complete. The proposed source contract is not yet registered as reviewed.
- All exercise responses are manual with explicit prompts. The count is not
  automatically treated as a proof or independent mastery.

## Validation

`node tools/stereo-textbook/symmetry-pending.test.cjs` checks JSON schema,
runtime validation, source parts, reachable finite SVG views and the actual
production guard: unreviewed cards remain unavailable to pupils.

`python3 tools/stereo-textbook/symmetry-math.test.py` independently enumerates
the isometries of the authored vertex sets and derives reflection/half-turn/
central-symmetry counts. It also checks elementary image constructions,
infinitely many sampled segment axes and the regular-tetrahedron special case.
An independent mathematical algorithm is not an independent content reviewer.

`node tools/stereo-textbook/symmetry-preview.browser.cjs` captures30 browser
journeys and86 model states at390/1280px. Its dedicated GitHub Actions job runs
the same draft-only checks and uploads actual screenshot evidence.

Before integration: independent source, proof and pedagogy review; inspect
actual browser images; resolve source35 completeness. Then explicitly integrate
accepted cards/contracts, review hashes and updated exact coverage counts, rerun
the established release gate and obtain the required release decision.
