# Nikolsky algebra 10 (2022)

Static course at `/school/nikolsky10/`, using the established MathExam lesson, guided-solution and computation-practice flow.

The source is S. M. Nikolsky, M. K. Potapov, N. N. Reshetnikov and A. V. Shevkin, *Algebra and the Beginnings of Mathematical Analysis. Grade 10*, Prosveshchenie, 2022, 10th stereotyped edition, basic and advanced levels. A PDF page is the printed page plus two. The textbook PDF is not included in this directory.

Coverage follows all 90 numbered topics in 14 paragraphs and three chapters: 59 basic topics and 31 starred advanced topics. There are 270 tasks with 815 worked steps: 56 selected textbook tasks or subparts, identified by exercise number and printed page, and 214 explicitly labelled authored tasks. This covers every topic; it does not provide solutions to every textbook exercise or subpart. The exercise navigator distinguishes available selected solutions from links to the corresponding topic.

All topics have short theory and an interactive illustration drawn from 22 model families. The shared computation module supplies 20 skills with three difficulty levels. A learner can practise an individual computation and return to the original task with answers, steps and notes preserved. Independently solved work and work completed with help or after earlier attempts are counted separately.

The browser loads `../peterson6/math.js` for exact rational arithmetic and generated practice. There is no external CDN or account dependency. Progress uses the isolated local-storage key `mathexam.nikolsky10.2022.v1`, state version `1`, and JSON export course identifier `nikolsky10-2022`. Imports reject other courses and unsupported versions, validate task records, and preserve existing populated records when merging. Other courses' progress is not changed.

Answer checking supports exact numeric equivalence, unordered finite root sets, notation normalization and the finite symbolic aliases specified in the content. It is not a general computer algebra system: an arbitrary algebraically equivalent expression need not be accepted. Required input forms are stated beside the relevant tasks.

`source-map.json` records the textbook structure. Edit content in `part1.json` through `part4.json`; `build.cjs` combines them in source order into generated `data.js`. `app.js`, `check.js`, `models.js` and `style.css` implement the interface, checking and illustrations.

Run from the repository root with Node 22. The DOM checks require jsdom 26.1.0; install it outside the repository and expose it through `NODE_PATH`:

```sh
nikolsky_test_dir="$(mktemp -d)"
npm install --prefix "$nikolsky_test_dir" --no-audit --no-fund --ignore-scripts jsdom@26.1.0
export NODE_PATH="$nikolsky_test_dir/node_modules"
node school/nikolsky10/build.cjs
node school/nikolsky10/test-course.cjs
node school/nikolsky10/test-models.cjs
node school/nikolsky10/test-state.cjs
node school/nikolsky10/test-import.cjs
node school/nikolsky10/test-ui.cjs
```

The scoped workflow `.github/workflows/nikolsky10-quality.yml` also verifies that rebuilding leaves committed `data.js` unchanged. Model DOM checks are skipped if jsdom is unavailable, so a calculations-only model result is not a full DOM pass.

Verification completed for all 270 task journeys and 815 guided steps, content contracts, model routes and controls, state recovery, computation detours, and import preservation. Independent reviewers checked mathematical content and selected textbook conditions. The home page and logarithm model were successfully inspected in the actual cloud browser. Mobile viewport inspection and pupil validation have not been performed. Claude consultation and release review were unavailable; independent agent reviews do not constitute Claude approval.
