# Base-EGE interactive labs: prototype evidence and coverage

Entry: `ege-baza/labs/index.html`. This is an isolated course prototype, not a
new completed module in the current ten-lesson registry. No storage writes.

## What the learner can do

| Area | Active learning | Independent check |
| --- | --- | --- |
| Stereo, 11/13 | Rotate solids; immerse a cube; observe partial/full displacement; move a cone section and compare k, k², k³ | 4 questions on displacement, units, similarity and constant-volume transfer |
| Plane, 12 | Select midpoint/segment tools and points; construct a median or chords; justify the right angle; calculate | 4 questions on a new triangle, chords, a theorem and Pythagoras |
| Trigonometry, 12/16 | Drag the circle point, track signed coordinates, use negative/multiple turns, convert to radians, inspect tangent | 4 questions on periodicity, quadrant sign, radians and undefined tangent |
| Task 18 | Domain → boundaries → selected intervals/endpoints; test a number by substitution | 6 questions, including four-pair solution matching and number locations |

Each planar scenario offers three sets of dimensions. This is six guided
constructions, not six independent mastery tests. The six inequality builders
cover linear negative division, product, rational fraction, reciprocal product,
logarithm/domain intersection, and decreasing exponential base. Existing
assisted scores are not imported.

## Existing assets reviewed

- `ege-profil/trainers/stereo/README.txt` and `js/trainer.js`: camera controls,
  exact geometry and learner-selected segments. Reuse local `js/three.min.js`
  unchanged. Do not edit generated `js/data.js`.
- `ege-profil/trainers/trigonometry.html`: triangle-to-circle bridge, turns,
  signed coordinates, radian measure and tangent axis. New lesson focuses these
  on actions and checks; historical prose is not copied.
- `trainers/linear-inequalities-stepwise.html`: actions and sign reversal.
- `trainers/inequalities-number-line-reader.html`: rays, intervals, open/closed
  endpoints and matching representations.
- The broader quadratic/interval banks remain candidates for subsequent
  coverage; this PR does not claim to have migrated every existing exercise.

## FIPI source and remaining coverage

Source checked on 2026-10-02: official **project** documents for EGE 2027,
https://fipi.ru/ege/demoversii-specifikacii-kodifikatory
Archive: https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/ma_11_2027.zip
Base demo and specification were read from the official archive. Printed page
numbers below refer to the demo (PDF sheets hold two printed pages).

| Prototype connection | Demo pages | Still to add before claiming full coverage |
| --- | --- | --- |
| 11: displaced water; transfer | 23–24 | composite solids, face count and surface area families |
| 12: median, chord, triangle | 24–25 | remaining angle/trigonometric and geometric families |
| 13: cone section and similarity | 25–26 | pyramids, lateral areas, prism diagonal families |
| 16: sine of multi-turn angle | 27 | remaining radical/logarithm/expression families |
| 18: solutions and number line | 29–30 | wider variants, parameter-expression family and delayed transfer |

All prototype tasks are original numerical examples. The course must retain a
separate full subtype matrix and diagnostic/repeat forms before release. Do not
claim a FIPI project is final or that one representative task covers every type.

## Running and packaging

Open the entry HTML from the repository or a local static server. WebGL is needed
for 3D; all scripts are local. The portable archive embeds the unchanged Three.js
asset and rewrites only the back link to the existing public homepage.

```
node tools/ege-baza-labs.test.cjs
node tools/ege-baza-labs.browser.cjs
python3 tools/build-ege-baza-labs-preview.py /absolute/output/MathExam_Labs.zip
```

The browser gate requires Playwright and Chromium. Set `CHROMIUM_EXECUTABLE_PATH`
if using an installed binary and `LABS_SCREENSHOT_DIR` to retain screenshots.
In the author environment Chromium 153 with software WebGL was used. The normal
browser download failed earlier; a packaged Chromium runtime provided a working
browser. This PR's browser pass does not retroactively validate earlier modules.

## Follow-up

After archetype review and owner acceptance, integrate each lab with the relevant
course lesson and progress contract; add more tasks, delayed checks and teacher
reporting. Do not merge automatically. The separately scheduled derivative
integration owns its own branch and should not overwrite these files.
